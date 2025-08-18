import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Database initialization
export const initializeDatabase = async () => {
  try {
    console.log('🗃️  初始化數據庫...');
    
    await createTables();
    await insertDefaultData();
    
    console.log('✅ 數據庫初始化完成');
  } catch (error) {
    console.error('❌ 數據庫初始化失敗:', error);
    throw error;
  }
};

// Create all tables
const createTables = async () => {
  // Create tables
  const tables = [
    // Categories table
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      description TEXT,
      gradient TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Products table
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category) REFERENCES categories (id)
    )`,

    // Orders table
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      payment_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,
    
    // Order items table
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      price INTEGER NOT NULL, -- Price at time of order
      product_name TEXT NOT NULL, -- Snapshot of product name
      product_image TEXT, -- Snapshot of product image
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )`,
    
    // Cart table
    `CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    )`,
    
    // Third party orders table
    `CREATE TABLE IF NOT EXISTS third_party_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_order_id TEXT NOT NULL,
      client_system TEXT NOT NULL,
      amount INTEGER NOT NULL,
      product_info TEXT NOT NULL,
      callback_url TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'expired', 'cancelled')),
      payment_code TEXT,
      payment_url TEXT,
      barcode_data TEXT, -- JSON格式儲存條碼詳細資訊
      barcode_status TEXT DEFAULT 'pending' CHECK(barcode_status IN ('pending', 'generated', 'expired')), -- 條碼狀態
      expire_date DATETIME,
      paid_at DATETIME,
      internal_order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(external_order_id, client_system),
      FOREIGN KEY (internal_order_id) REFERENCES orders (id)
    )`,

    // ECPay transactions table
    `CREATE TABLE IF NOT EXISTS ecpay_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      third_party_order_id INTEGER,
      merchant_trade_no TEXT NOT NULL UNIQUE,
      trade_no TEXT,
      payment_type TEXT,
      payment_date DATETIME,
      amount INTEGER NOT NULL,
      response_code TEXT,
      response_msg TEXT,
      raw_response TEXT,
      barcode_info TEXT, -- JSON格式儲存條碼詳細資訊
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (third_party_order_id) REFERENCES third_party_orders (id)
    )`,

    // Customer info table for third party orders
    `CREATE TABLE IF NOT EXISTS third_party_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      third_party_order_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (third_party_order_id) REFERENCES third_party_orders (id)
    )`,

    // API keys for third party authentication
    `CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_name TEXT NOT NULL UNIQUE,
      api_key TEXT NOT NULL UNIQUE,
      client_system TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      rate_limit INTEGER DEFAULT 100,
      allowed_ips TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // API call logs for tracking third party interactions
    `CREATE TABLE IF NOT EXISTS api_call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (api_key_id) REFERENCES api_keys (id)
    )`,

    // Create indexes for better performance
    `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
    `CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_third_party_orders_client ON third_party_orders(client_system)`,
    `CREATE INDEX IF NOT EXISTS idx_third_party_orders_status ON third_party_orders(status)`,
    `CREATE INDEX IF NOT EXISTS idx_ecpay_transactions_merchant_no ON ecpay_transactions(merchant_trade_no)`,
    `CREATE INDEX IF NOT EXISTS idx_api_call_logs_api_key ON api_call_logs(api_key_id)`,
    `CREATE INDEX IF NOT EXISTS idx_api_call_logs_client ON api_call_logs(client_system)`,
    `CREATE INDEX IF NOT EXISTS idx_api_call_logs_created ON api_call_logs(created_at)`
  ];

  for (const sql of tables) {
    db.exec(sql);
  }
};

// Insert default categories
const insertDefaultCategories = async () => {
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

  const insertCategorySQL = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, icon, description, gradient)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const category of defaultCategories) {
    insertCategorySQL.run(
      category.id,
      category.name,
      category.icon,
      category.description,
      category.gradient
    );
  }
};

// Insert default data
const insertDefaultData = async () => {
  // Check if categories exist
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  
  if (categoryCount.count === 0) {
    console.log('🏷️ 插入預設分類數據...');
    await insertDefaultCategories();
    console.log('✅ 預設分類數據已插入');
  }

  // Check if admin user exists
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@corba3c.com');
  
  if (!adminExists) {
    console.log('🔧 建立預設管理員帳戶...');
    const hashedPassword = await bcrypt.hash('admin32123', 10);
    db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)')
      .run('admin@corba3c.com', hashedPassword, 'Corba Admin', 'admin');
    console.log('👤 預設管理員帳戶已建立: admin@corba3c.com / admin32123');
  }

  // Check if products exist
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  
  if (productCount.count === 0) {
    console.log('🛍️ 插入預設產品數據...');
    await insertDefaultProducts();
    console.log('✅ 預設產品數據已插入');
  }

  // Check if API keys exist
  const apiKeyCount = db.prepare('SELECT COUNT(*) as count FROM api_keys').get();
  
  if (apiKeyCount.count === 0) {
    console.log('🔑 建立預設 API Key...');
    const testApiKey = 'test-api-key-' + Math.random().toString(36).substring(2, 15);
    db.prepare('INSERT INTO api_keys (key_name, api_key, client_system, rate_limit) VALUES (?, ?, ?, ?)')
      .run('Test Client', testApiKey, 'test-system', 1000);
    console.log(`🔑 測試 API Key 已建立: ${testApiKey}`);
  }
};

// Insert default products
const insertDefaultProducts = async () => {
  const defaultProducts = [
    {
      name: 'Rick科學家滑鼠',
      category: 'mouse',
      price: 1990,
      original_price: 2490,
      description: 'Rick親自設計的量子滑鼠，具備跨維度精準定位',
      specifications: JSON.stringify(['DPI 12000', '7個按鍵', '彩虹背光', 'USB-C充電', '量子感測器']),
      specifications2: JSON.stringify(['科學家認證', '防酸鹼', '次元穩定']),
      stock: 50,
      image: '/images/products/6674005_R1.webp'
    },
    {
      name: 'Morty冒險者滑鼠',
      category: 'mouse',
      price: 1290,
      original_price: 1590,
      description: 'Morty專用的冒險滑鼠，經得起各種次元旅行',
      specifications: JSON.stringify(['DPI 8000', '5個按鍵', '呼吸燈效', 'USB-A連接', '防震設計']),
      specifications2: JSON.stringify(['冒險者認證', '抗震防摔', '緊急求救']),
      stock: 30,
      image: '/images/products/6674006_R1.webp'
    },
    {
      name: 'Portal科學鍵盤',
      category: 'keyboard',
      price: 3990,
      original_price: 4990,
      description: 'Portal技術打造的機械鍵盤，每個按鍵都是小型傳送門',
      specifications: JSON.stringify(['Cherry MX軸', '87鍵配列', 'RGB燈效', 'USB-C', '鋁合金外殼']),
      specifications2: JSON.stringify(['Portal技術', '瞬間響應', '跨維度輸入']),
      stock: 25,
      image: '/images/products/6674007_R1.webp',
      featured: 1
    },
    {
      name: 'Rick實驗室鍵盤',
      category: 'keyboard',
      price: 2890,
      original_price: 3390,
      description: 'Rick實驗室標準配備，能承受各種化學實驗',
      specifications: JSON.stringify(['防水設計', '104鍵', '綠色背光', '有線連接', '耐酸鹼']),
      specifications2: JSON.stringify(['實驗室認證', '化學抗性', '緊急停止']),
      stock: 40,
      image: '/images/products/6674008_R1.webp'
    },
    {
      name: 'Portal充電線',
      category: 'cable',
      price: 590,
      original_price: 790,
      description: '利用Portal技術的USB-C充電線，傳輸快如閃電',
      specifications: JSON.stringify(['USB-C to C', '100W PD', '5A電流', '1.2米長', 'E-Mark晶片']),
      specifications2: JSON.stringify(['Portal加速', '量子糾纏', '瞬間傳輸']),
      stock: 100,
      image: '/images/products/6674009_R1.webp'
    },
    {
      name: 'Rick科學傳輸線',
      category: 'cable',
      price: 390,
      original_price: 590,
      description: 'Rick設計的萬用傳輸線，支援所有已知宇宙的裝置',
      specifications: JSON.stringify(['多接頭設計', '快充支援', '2米長度', '編織線材', '萬用相容']),
      specifications2: JSON.stringify(['科學認證', '宇宙相容', '防纏繞']),
      stock: 75,
      image: '/images/products/6674010_R1.webp'
    },
    {
      name: 'Portal能量行動電源',
      category: 'powerbank',
      price: 2990,
      original_price: 3990,
      description: '使用Portal能量的超級行動電源，永不斷電',
      specifications: JSON.stringify(['30000mAh', '100W輸出', '無線充電', '快充3.0', 'LED顯示']),
      specifications2: JSON.stringify(['Portal能量', '無限電力', '次元充電']),
      stock: 20,
      image: '/images/products/6674011_R1.webp',
      featured: 1
    },
    {
      name: 'Morty隨身電源',
      category: 'powerbank',
      price: 1490,
      original_price: 1990,
      description: 'Morty專用的隨身電源，輕巧好攜帶',
      specifications: JSON.stringify(['10000mAh', '22.5W快充', '雙USB輸出', '輕薄設計', '安全保護']),
      specifications2: JSON.stringify(['冒險專用', '輕量化', '緊急救援']),
      stock: 60,
      image: '/images/products/6674012_R1.webp'
    },
    {
      name: 'Portal商務筆電',
      category: 'laptop',
      price: 45990,
      original_price: 52990,
      description: 'Portal技術打造的商務筆電，輕薄且效能卓越',
      specifications: JSON.stringify(['Intel i7-1260P', 'Iris Xe', '16GB DDR5', '1TB SSD', '13.3吋 2K']),
      specifications2: JSON.stringify(['Portal技術', '輕薄設計', '商務優化']),
      stock: 20,
      image: '/images/products/6674008_R1.webp'
    },

    // 果汁機/破壁機類產品 (9個產品)
    {
      name: 'Morty迷你果汁機',
      category: 'juicer',
      price: 500,
      original_price: 800,
      description: 'Morty專用的迷你便攜果汁機，簡單操作一鍵完成',
      specifications: JSON.stringify(['350ml容量', '單人份設計', '充電式', 'USB-C充電', '便攜設計']),
      specifications2: JSON.stringify(['一鍵操作', '食品級材質', '易清潔']),
      stock: 100,
      image: '/images/products/mini-juicer.jpg'
    },
    {
      name: 'Rick入門破壁機',
      category: 'juicer',
      price: 1000,
      original_price: 1300,
      description: 'Rick實驗室入門級破壁機，科學配比營養更均衡',
      specifications: JSON.stringify(['600ml容量', '1200W功率', '破壁功能', '6葉刀片', '噪音控制']),
      specifications2: JSON.stringify(['科學配比', '營養保留', '實驗室標準']),
      stock: 80,
      image: '/images/products/entry-blender.jpg'
    },
    {
      name: 'Portal智能果汁機',
      category: 'juicer',
      price: 1500,
      original_price: 1900,
      description: 'Portal技術智能果汁機，自動識別食材並調整程式',
      specifications: JSON.stringify(['800ml容量', '智能程式', '自動識別', '觸控操作', 'APP連接']),
      specifications2: JSON.stringify(['Portal智能', '自動化', '雲端食譜']),
      stock: 70,
      image: '/images/products/smart-juicer.jpg'
    },
    {
      name: 'Rick次元營養機',
      category: 'juicer',
      price: 2000,
      original_price: 2500,
      description: 'Rick設計的次元營養機，能鎖定各維度的營養精華',
      specifications: JSON.stringify(['1L容量', '次元保鮮', '營養鎖定', '多功能', '定時預約']),
      specifications2: JSON.stringify(['次元技術', '營養最大化', '科學認證']),
      stock: 60,
      image: '/images/products/dimension-nutrition.jpg'
    },
    {
      name: 'Portal家用破壁機',
      category: 'juicer',
      price: 2500,
      original_price: 3200,
      description: 'Portal技術家用破壁機，靜音設計適合全家使用',
      specifications: JSON.stringify(['1.5L容量', '靜音設計', '家庭份量', '多段速度', '安全鎖定']),
      specifications2: JSON.stringify(['家庭適用', '靜音技術', 'Portal品質']),
      stock: 50,
      image: '/images/products/family-blender.jpg',
      featured: 1
    },
    {
      name: 'Rick實驗室專業果汁機',
      category: 'juicer',
      price: 3000,
      original_price: 3800,
      description: 'Rick實驗室專業級果汁機，精密控制每個細節',
      specifications: JSON.stringify(['2L容量', '精密控制', '實驗室級', '溫度監控', '專業刀頭']),
      specifications2: JSON.stringify(['實驗室級', '精密儀器', '專業認證']),
      stock: 40,
      image: '/images/products/lab-juicer.jpg'
    },
    {
      name: 'Portal商用破壁機',
      category: 'juicer',
      price: 3500,
      original_price: 4300,
      description: 'Portal商用級破壁機，適合連續大量製作',
      specifications: JSON.stringify(['2.5L容量', '商用級', '連續工作', '重載設計', '易清潔']),
      specifications2: JSON.stringify(['商用認證', '高效率', '耐用設計']),
      stock: 30,
      image: '/images/products/commercial-blender.jpg'
    },
    {
      name: 'Rick多功能破壁機',
      category: 'juicer',
      price: 4000,
      original_price: 5000,
      description: 'Rick設計的多功能破壁機，集合所有功能於一身',
      specifications: JSON.stringify(['3L容量', '觸控螢幕', '多功能整合', '記憶功能', '遠端控制']),
      specifications2: JSON.stringify(['多功能', '智能整合', 'Rick認證']),
      stock: 25,
      image: '/images/products/multi-blender.jpg',
      featured: 1
    },
    {
      name: 'Portal頂級破壁機',
      category: 'juicer',
      price: 5000,
      original_price: 6500,
      description: 'Portal最頂級的破壁機，結合所有最新科技',
      specifications: JSON.stringify(['4L容量', 'AI智能', '頂級配置', '自清潔', '語音控制']),
      specifications2: JSON.stringify(['頂級配置', 'AI加持', 'Portal巔峰']),
      stock: 15,
      image: '/images/products/premium-blender.jpg',
      featured: 1
    }
  ];

  const insertProductSQL = db.prepare(`
    INSERT INTO products (
      name, category, price, original_price, description, 
      specifications, specifications2, stock, image, featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const product of defaultProducts) {
    insertProductSQL.run(
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
    );
  }
};

// Utility functions for better-sqlite3
export const runSQL = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
};

export const getAsync = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

export const allAsync = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

// Close database connection on process exit
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));