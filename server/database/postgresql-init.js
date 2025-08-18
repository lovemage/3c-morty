import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

// PostgreSQL 連接配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database initialization for PostgreSQL
export const initializeDatabase = async () => {
  try {
    console.log('🗃️  初始化 PostgreSQL 數據庫...');
    
    await createTables();
    await insertDefaultData();
    
    console.log('✅ PostgreSQL 數據庫初始化完成');
  } catch (error) {
    console.error('❌ PostgreSQL 數據庫初始化失敗:', error);
    throw error;
  }
};

// Create all tables for PostgreSQL
const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        icon TEXT NOT NULL,
        description TEXT,
        gradient TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        original_price INTEGER NOT NULL,
        description TEXT NOT NULL,
        specifications TEXT NOT NULL,
        specifications2 TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        image TEXT NOT NULL,
        featured INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category) REFERENCES categories (id)
      )
    `);

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        total INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
        shipping_name TEXT NOT NULL,
        shipping_address TEXT NOT NULL,
        shipping_city TEXT NOT NULL,
        shipping_postal_code TEXT NOT NULL,
        shipping_phone TEXT NOT NULL,
        merchant_trade_no TEXT UNIQUE,
        payment_method TEXT DEFAULT 'BARCODE',
        trade_desc TEXT,
        ecpay_trade_no TEXT,
        payment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    // Order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        product_image TEXT,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);
    
    // Cart table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        UNIQUE(user_id, product_id)
      )
    `);
    
    // Third party orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS third_party_orders (
        id SERIAL PRIMARY KEY,
        external_order_id TEXT NOT NULL,
        client_system TEXT NOT NULL,
        amount INTEGER NOT NULL,
        product_info TEXT NOT NULL,
        callback_url TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'expired', 'cancelled')),
        payment_code TEXT,
        payment_url TEXT,
        barcode_data JSONB, -- 儲存條碼詳細資訊
        barcode_status TEXT DEFAULT 'pending' CHECK(barcode_status IN ('pending', 'generated', 'expired')), -- 條碼狀態
        expire_date TIMESTAMP,
        paid_at TIMESTAMP,
        internal_order_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(external_order_id, client_system),
        FOREIGN KEY (internal_order_id) REFERENCES orders (id)
      )
    `);

    // ECPay transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ecpay_transactions (
        id SERIAL PRIMARY KEY,
        third_party_order_id INTEGER,
        merchant_trade_no TEXT NOT NULL UNIQUE,
        trade_no TEXT,
        payment_type TEXT,
        payment_date TIMESTAMP,
        amount INTEGER NOT NULL,
        response_code TEXT,
        response_msg TEXT,
        raw_response TEXT,
        barcode_info JSONB, -- 儲存條碼詳細資訊
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (third_party_order_id) REFERENCES third_party_orders (id)
      )
    `);

    // Customer info table for third party orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS third_party_customers (
        id SERIAL PRIMARY KEY,
        third_party_order_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (third_party_order_id) REFERENCES third_party_orders (id)
      )
    `);

    // API keys for third party authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        key_name TEXT NOT NULL UNIQUE,
        api_key TEXT NOT NULL UNIQUE,
        client_system TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        rate_limit INTEGER DEFAULT 100,
        allowed_ips TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // API call logs for tracking third party interactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_call_logs (
        id SERIAL PRIMARY KEY,
        api_key_id INTEGER NOT NULL,
        client_system TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        request_headers TEXT,
        request_body TEXT,
        response_status INTEGER,
        response_headers TEXT,
        response_body TEXT,
        client_ip TEXT,
        user_agent TEXT,
        processing_time INTEGER,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (api_key_id) REFERENCES api_keys (id)
      )
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_third_party_orders_client ON third_party_orders(client_system)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_third_party_orders_status ON third_party_orders(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_ecpay_transactions_merchant_no ON ecpay_transactions(merchant_trade_no)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_api_call_logs_api_key ON api_call_logs(api_key_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_api_call_logs_client ON api_call_logs(client_system)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_api_call_logs_created ON api_call_logs(created_at)');

    await client.query('COMMIT');
    console.log('✅ PostgreSQL 資料表建立完成');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Insert default data for PostgreSQL
const insertDefaultData = async () => {
  const client = await pool.connect();
  
  try {
    // Check if categories exist
    const categoryCount = await client.query('SELECT COUNT(*) as count FROM categories');
    
    if (categoryCount.rows[0].count === '0') {
      console.log('🏷️ 插入預設分類數據...');
      await insertDefaultCategories(client);
      console.log('✅ 預設分類數據已插入');
    }

    // Check if admin user exists
    const adminExists = await client.query('SELECT id FROM users WHERE email = $1', ['admin@corba3c.com']);
    
    if (adminExists.rows.length === 0) {
      console.log('🔧 建立預設管理員帳戶...');
      const hashedPassword = await bcrypt.hash('admin32123', 10);
      await client.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['admin@corba3c.com', hashedPassword, 'Corba Admin', 'admin']
      );
      console.log('👤 預設管理員帳戶已建立: admin@corba3c.com / admin32123');
    }

    // Check if products exist
    const productCount = await client.query('SELECT COUNT(*) as count FROM products');
    
    if (productCount.rows[0].count === '0') {
      console.log('🛍️ 插入預設產品數據...');
      await insertDefaultProducts(client);
      console.log('✅ 預設產品數據已插入');
    }

    // Check if API keys exist
    const apiKeyCount = await client.query('SELECT COUNT(*) as count FROM api_keys');
    
    if (apiKeyCount.rows[0].count === '0') {
      console.log('🔑 建立預設 API Key...');
      const testApiKey = 'test-api-key-' + Math.random().toString(36).substring(2, 15);
      await client.query(
        'INSERT INTO api_keys (key_name, api_key, client_system, rate_limit) VALUES ($1, $2, $3, $4)',
        ['Test Client', testApiKey, 'test-system', 1000]
      );
      console.log(`🔑 測試 API Key 已建立: ${testApiKey}`);
    }
  } finally {
    client.release();
  }
};

// Insert default categories for PostgreSQL
const insertDefaultCategories = async (client) => {
  const defaultCategories = [
    {
      id: 'mouse',
      name: '滑鼠',
      icon: '🖱️',
      description: '精準操作，量子級定位技術',
      gradient: 'from-green-400 to-green-600'
    },
    {
      id: 'keyboard',
      name: '鍵盤',
      icon: '⌨️',
      description: '打字體驗，次元穩定軸體',
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      id: 'cable',
      name: '傳輸線',
      icon: '🔌',
      description: '快速傳輸，跨維度連接',
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      id: 'powerbank',
      name: '行動電源',
      icon: '🔋',
      description: '電力供應，量子能量技術',
      gradient: 'from-orange-400 to-red-500'
    },
    {
      id: 'laptop',
      name: '筆記型電腦',
      icon: '💻',
      description: '絕佳效能，次元處理器',
      gradient: 'from-cyan-400 to-teal-500'
    },
    {
      id: 'juicer',
      name: '果汁機/破壁機',
      icon: '🥤',
      description: '健康飲品，次元破壁技術',
      gradient: 'from-pink-400 to-rose-500'
    }
  ];

  for (const category of defaultCategories) {
    await client.query(`
      INSERT INTO categories (id, name, icon, description, gradient)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `, [
      category.id,
      category.name,
      category.icon,
      category.description,
      category.gradient
    ]);
  }
};

// Insert default products for PostgreSQL (完整版產品數據)
const insertDefaultProducts = async (client) => {
  const defaultProducts = [
    // 滑鼠類產品 (8個產品)
    {
      name: 'Portal無線電競滑鼠',
      category: 'mouse',
      price: 2990,
      original_price: 3990,
      description: '來自次元C-137的頂級電競滑鼠，具備Rick實驗室開發的量子精準技術',
      specifications: JSON.stringify(['DPI: 16000', 'RGB背光', '無線連接', '電池續航: 70小時', '人體工學設計']),
      specifications2: JSON.stringify(['無線2.4GHz技術', '可自訂DPI設定', '支援宏編程']),
      stock: 25,
      image: '/images/products/wireless-gaming-mouse.jpg',
      featured: 1
    },
    {
      name: 'Morty有線光學滑鼠',
      category: 'mouse',
      price: 990,
      original_price: 1290,
      description: '簡單易用的有線滑鼠，Morty也能輕鬆操作',
      specifications: JSON.stringify(['DPI: 3200', '有線連接', '即插即用', '人體工學', '耐用設計']),
      specifications2: JSON.stringify(['1.8米線長', '光學感應器', '簡單設定']),
      stock: 50,
      image: '/images/products/wired-mouse.jpg'
    },
    {
      name: 'Rick次元高精度滑鼠',
      category: 'mouse',
      price: 1590,
      original_price: 2190,
      description: '採用次元科技的高精度滑鼠，適合專業工作',
      specifications: JSON.stringify(['DPI: 8000', '精確感應', '人體工學', '耐用材質', '靜音設計']),
      specifications2: JSON.stringify(['次元穩定技術', '量子感應器', '適合專業工作']),
      stock: 35,
      image: '/images/products/6206427_R.webp'
    },
    {
      name: 'Portal Gaming Pro滑鼠',
      category: 'mouse',
      price: 3490,
      original_price: 4490,
      description: 'Rick實驗室最新研發的電競滑鼠，專為職業玩家設計',
      specifications: JSON.stringify(['DPI: 25600', 'RGB炫光', '無線充電', '超快響應', '防滑設計']),
      specifications2: JSON.stringify(['1ms回應時間', '職業級精度', '可程式設計按鍵']),
      stock: 20,
      image: '/images/products/13248873_R.webp',
      featured: 1
    },

    // 鍵盤類產品 (4個產品)
    {
      name: 'Rick科學機械鍵盤',
      category: 'keyboard',
      price: 4990,
      original_price: 5990,
      description: '使用Rick的實驗室材料製作，每個按鍵都帶有次元穩定技術',
      specifications: JSON.stringify(['機械軸體', 'RGB全彩背光', '防水設計', '巨集功能', 'USB Type-C連接']),
      specifications2: JSON.stringify(['多軸體選項', '可調背光亮度', '程式巨集支援']),
      stock: 15,
      image: '/images/products/mechanical-keyboard.jpeg',
      featured: 1
    },
    {
      name: 'Portal無線鍵盤',
      category: 'keyboard',
      price: 2490,
      original_price: 2990,
      description: '輕薄設計的無線鍵盤，適合行動辦公',
      specifications: JSON.stringify(['無線藍牙', '超薄設計', '續航180小時', '快速充電', '靜音按鍵']),
      specifications2: JSON.stringify(['藍牙5.0', '多設備連接', '節能模式']),
      stock: 30,
      image: '/images/products/wireless-keyboard.jpg'
    },
    {
      name: 'Morty辦公鍵盤',
      category: 'keyboard',
      price: 1290,
      original_price: 1590,
      description: 'Morty專用的辦公鍵盤，簡單實用',
      specifications: JSON.stringify(['薄膜按鍵', '有線連接', '標準配列', '舒適手感', '靜音設計']),
      specifications2: JSON.stringify(['104鍵標準', '防潑水', '即插即用']),
      stock: 40,
      image: '/images/products/12236748_R.webp'
    },
    {
      name: 'Rick實驗室專業鍵盤',
      category: 'keyboard',
      price: 3890,
      original_price: 4890,
      description: 'Rick實驗室研發的專業鍵盤，具備多種科學功能',
      specifications: JSON.stringify(['客製化軸體', '可程式設計', '防腐蝕材質', '快捷鍵支援', '背光調節']),
      specifications2: JSON.stringify(['實驗室級耐用', '化學防護', '科學計算快捷鍵']),
      stock: 18,
      image: '/images/products/14169511_R.webp'
    },

    // 傳輸線類產品 (9個產品)
    {
      name: 'Morty充電線',
      category: 'cable',
      price: 590,
      original_price: 790,
      description: 'USB-C快充線，經過Rick改良，充電速度提升200%',
      specifications: JSON.stringify(['USB-C接口', '快充支援', '長度1.2米', '耐彎折設計', '數據傳輸']),
      specifications2: JSON.stringify(['480Mbps傳輸', '編織防纏', '快充認證']),
      stock: 100,
      image: '/images/products/usb-c-cable_1.jpg'
    },
    {
      name: 'Portal USB-C傳輸線',
      category: 'cable',
      price: 690,
      original_price: 890,
      description: '次元傳輸技術的USB-C線材，資料傳輸更穩定',
      specifications: JSON.stringify(['USB-C接口', '高速傳輸', '長度1.5米', '編織線材', '金屬接頭']),
      specifications2: JSON.stringify(['10Gbps傳輸', '次元穩定', '抗電磁干擾']),
      stock: 80,
      image: '/images/products/usb-c-cable_2.jpg'
    },
    {
      name: 'Rick量子傳輸線',
      category: 'cable',
      price: 890,
      original_price: 1290,
      description: '採用量子技術的高階傳輸線，支援超高速資料傳輸',
      specifications: JSON.stringify(['USB-C 3.2', '量子加速', '長度2米', '防干擾設計', '快充100W']),
      specifications2: JSON.stringify(['20Gbps傳輸', '量子加密', '耐高溫設計']),
      stock: 60,
      image: '/images/products/usb-c-cable_3.jpg'
    },
    {
      name: 'Lightning次元線',
      category: 'cable',
      price: 790,
      original_price: 990,
      description: 'iPhone專用Lightning線，具備次元穩定技術',
      specifications: JSON.stringify(['Lightning接口', 'MFi認證', '長度1米', '高速充電', '數據同步']),
      specifications2: JSON.stringify(['iOS原廠晶片', 'MFi認證', '次元同步技術']),
      stock: 80,
      image: '/images/products/lightning-cable.jpg'
    },
    {
      name: 'Portal HDMI線',
      category: 'cable',
      price: 1290,
      original_price: 1590,
      description: '4K超高清HDMI線，可傳輸多維度影像信號',
      specifications: JSON.stringify(['4K@60Hz', '高速傳輸', '長度2米', '抗干擾', '金屬接頭']),
      specifications2: JSON.stringify(['HDMI 2.1標準', '48Gbps頻寬', '多維度信號']),
      stock: 60,
      image: '/images/products/hdmi-cable.jpg'
    },
    {
      name: 'Rick實驗室USB-C線',
      category: 'cable',
      price: 1190,
      original_price: 1490,
      description: 'Rick親自設計的USB-C線材，具備實驗室級別的品質',
      specifications: JSON.stringify(['USB-C 3.1', '實驗室測試', '長度1.8米', '超耐用設計', '快充支援']),
      specifications2: JSON.stringify(['軍規級耐用', '實驗室認證', '專業品質']),
      stock: 45,
      image: '/images/products/usb-c-cable_4.jpg'
    },
    {
      name: 'Morty日常充電線',
      category: 'cable',
      price: 590,
      original_price: 790,
      description: 'Morty日常使用的充電線，簡單實用',
      specifications: JSON.stringify(['USB-C接口', '基本充電', '長度1米', '輕便攜帶', '耐用設計']),
      specifications2: JSON.stringify(['基本功能', '簡單實用', '日常使用']),
      stock: 90,
      image: '/images/products/usb-c-cable_6.jpg'
    },
    {
      name: 'Portal科技線材',
      category: 'cable',
      price: 1590,
      original_price: 1990,
      description: '融合Portal科技的高端線材，傳輸效能卓越',
      specifications: JSON.stringify(['Thunderbolt 4', '高速傳輸', '長度2.5米', '專業級品質', '多功能支援']),
      specifications2: JSON.stringify(['40Gbps傳輸', 'Portal技術', '專業認證']),
      stock: 25,
      image: '/images/products/7667886_R.webp'
    },
    {
      name: 'Rick基礎傳輸線',
      category: 'cable',
      price: 490,
      original_price: 690,
      description: 'Rick設計的基礎型傳輸線，滿足日常需求',
      specifications: JSON.stringify(['USB-C接口', '標準傳輸', '長度1米', '基本充電', '耐用設計']),
      specifications2: JSON.stringify(['標準規格', '基本功能', '經濟實用']),
      stock: 120,
      image: '/images/products/usb-c-cable_0.jpg'
    },

    // 行動電源類產品 (4個產品)
    {
      name: 'Rick量子行動電源 20000mAh',
      category: 'powerbank',
      price: 1990,
      original_price: 2490,
      description: '使用量子能量技術，充電速度和容量都超越常規產品',
      specifications: JSON.stringify(['容量: 20000mAh', '快充PD 65W', '無線充電', '三個輸出口', 'LED電量顯示']),
      specifications2: JSON.stringify(['雙向快充', '智能保護', '溫控技術']),
      stock: 40,
      image: '/images/products/power-bank-20000.jpeg',
      featured: 1
    },
    {
      name: 'Portal能量核心',
      category: 'powerbank',
      price: 2990,
      original_price: 3490,
      description: 'Portal技術驅動的能量核心，可為多個設備同時充電',
      specifications: JSON.stringify(['容量: 30000mAh', '無線充電', 'PD 100W', '四個輸出', '快速充電技術']),
      specifications2: JSON.stringify(['Portal技術', '多設備支援', '高效充電']),
      stock: 20,
      image: '/images/products/11455868_R.webp',
      featured: 1
    },
    {
      name: 'Morty輕量行動電源',
      category: 'powerbank',
      price: 1290,
      original_price: 1590,
      description: '輕便小巧的行動電源，適合日常使用',
      specifications: JSON.stringify(['容量: 10000mAh', '輕薄設計', '雙輸出', 'LED電量指示', '安全保護']),
      specifications2: JSON.stringify(['輕量設計', '便攜實用', '安全可靠']),
      stock: 70,
      image: '/images/products/10254365_R.webp'
    },
    {
      name: 'Rick實驗室電源',
      category: 'powerbank',
      price: 3990,
      original_price: 4990,
      description: 'Rick實驗室特製的高性能行動電源，支援實驗設備供電',
      specifications: JSON.stringify(['容量: 50000mAh', '實驗室級', 'AC輸出', '多接口設計', '智能保護']),
      specifications2: JSON.stringify(['實驗室級品質', 'AC輸出支援', '專業設備']),
      stock: 8,
      image: '/images/products/9779579_R.webp'
    },

    // 筆記型電腦類產品 (4個產品)
    {
      name: 'Portal Gaming筆記型電腦',
      category: 'laptop',
      price: 49990,
      original_price: 59990,
      description: 'Rick設計的頂級電競筆電，配備次元處理器和量子顯卡',
      specifications: JSON.stringify(['處理器: Intel i9', '顯卡: RTX 4080', '記憶體: 32GB', '儲存: 1TB SSD', '螢幕: 17.3" 144Hz']),
      specifications2: JSON.stringify(['次元處理技術', '量子顯卡', '電競級配置']),
      stock: 5,
      image: '/images/products/gaming-laptop.jpg',
      featured: 1
    },
    {
      name: 'Dimension商務筆電',
      category: 'laptop',
      price: 45990,
      original_price: 55990,
      description: '輕薄商務筆電，適合辦公和學習',
      specifications: JSON.stringify(['處理器: Intel i7', '記憶體: 16GB', '儲存: 512GB SSD', '螢幕: 14" IPS', '重量: 1.2kg']),
      specifications2: JSON.stringify(['商務設計', '輕薄便攜', '高效辦公']),
      stock: 12,
      image: '/images/products/ultrabook.jpg'
    },
    {
      name: 'Rick科學計算筆電',
      category: 'laptop',
      price: 42990,
      original_price: 52990,
      description: 'Rick實驗室專用的科學計算筆電，效能強大',
      specifications: JSON.stringify(['處理器: AMD Ryzen 9', '記憶體: 32GB', '獨立顯卡', '儲存: 1TB SSD', '科學計算優化']),
      specifications2: JSON.stringify(['科學計算優化', '專業軟體支援', '研究級配置']),
      stock: 6,
      image: '/images/products/4318322_R.webp'
    },
    {
      name: 'Portal多維筆電',
      category: 'laptop',
      price: 39990,
      original_price: 49990,
      description: '具備多維度處理能力的筆記型電腦，適合複雜運算',
      specifications: JSON.stringify(['處理器: Intel i7', '記憶體: 24GB', '高解析螢幕', '儲存: 512GB SSD', '多維運算支援']),
      specifications2: JSON.stringify(['多維處理', '高解析顯示', '運算優化']),
      stock: 8,
      image: '/images/products/6674008_R1.webp'
    }
  ];

  for (const product of defaultProducts) {
    await client.query(`
      INSERT INTO products (
        name, category, price, original_price, description, 
        specifications, specifications2, stock, image, featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      product.name,
      product.category,
      product.price,
      product.original_price,
      product.description,
      product.specifications,
      product.specifications2 || null,
      product.stock,
      product.image,
      product.featured || 0
    ]);
  }
};

// Utility functions for PostgreSQL
export const runSQL = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    // 轉換 SQLite 語法到 PostgreSQL
    let pgSql = sql.replace(/\?/g, (match, offset) => {
      const paramIndex = sql.substring(0, offset).split('?').length;
      return `$${paramIndex}`;
    });
    
    // 對於 INSERT 查詢，添加 RETURNING id 子句來獲取插入的 ID
    if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
      pgSql += ' RETURNING id';
    }
    
    const result = await client.query(pgSql, params);
    
    // 對於 INSERT 查詢，返回新插入的 ID
    if (pgSql.trim().toUpperCase().startsWith('INSERT') && result.rows.length > 0) {
      return { lastInsertRowid: result.rows[0].id, changes: result.rowCount };
    }
    
    return { changes: result.rowCount };
  } finally {
    client.release();
  }
};

export const getAsync = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    // 轉換 SQLite 語法到 PostgreSQL
    let pgSql = sql.replace(/\?/g, (match, offset) => {
      const paramIndex = sql.substring(0, offset).split('?').length;
      return `$${paramIndex}`;
    });
    
    const result = await client.query(pgSql, params);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};

export const allAsync = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    // 轉換 SQLite 語法到 PostgreSQL
    let pgSql = sql.replace(/\?/g, (match, offset) => {
      const paramIndex = sql.substring(0, offset).split('?').length;
      return `$${paramIndex}`;
    });
    
    const result = await client.query(pgSql, params);
    return result.rows;
  } finally {
    client.release();
  }
};

// Close database connection on process exit
process.on('exit', () => pool.end());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));