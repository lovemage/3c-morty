import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

// PostgreSQL 連接配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetProductData() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 開始重置PostgreSQL產品數據...');
    
    await client.query('BEGIN');
    
    // 清空現有產品數據
    console.log('🗑️ 清空現有產品數據...');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM products');
    await client.query('ALTER SEQUENCE products_id_seq RESTART WITH 1');
    
    // 重新插入完整的產品數據
    console.log('📦 插入完整產品數據...');
    await insertAllProducts(client);
    
    await client.query('COMMIT');
    console.log('✅ PostgreSQL 產品數據重置完成！');
    
    // 顯示統計
    const productCount = await client.query('SELECT COUNT(*) as count FROM products');
    console.log(`📊 總共插入了 ${productCount.rows[0].count} 個產品`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 重置失敗:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 插入完整的產品數據
const insertAllProducts = async (client) => {
  const defaultProducts = [
    // 滑鼠類產品 (4個產品)
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
    },

    // 果汁機類產品 (4個產品)  
    {
      name: 'Rick量子果汁機',
      category: 'juicer',
      price: 5990,
      original_price: 7990,
      description: 'Rick實驗室開發的量子破壁機，可榨出多維度營養',
      specifications: JSON.stringify(['功率: 2200W', '量子破壁技術', '多段調速', '自動清洗', '食品級材質']),
      specifications2: JSON.stringify(['量子營養萃取', '多維破壁', '實驗室認證']),
      stock: 15,
      image: '/images/products/quantum-juicer.jpg',
      featured: 1
    },
    {
      name: 'Portal次元破壁機',
      category: 'juicer',
      price: 7990,
      original_price: 9990,
      description: 'Portal能量驅動的破壁機，能破碎任何次元的食材',
      specifications: JSON.stringify(['功率: 3000W', 'Portal能量', '超音波破壁', '智能控制', '安全防護']),
      specifications2: JSON.stringify(['Portal技術', '次元破壁', '能量注入']),
      stock: 8,
      image: '/images/products/portal-blender.jpg',
      featured: 1
    },
    {
      name: 'Morty家用果汁機',
      category: 'juicer',
      price: 2990,
      original_price: 3590,
      description: 'Morty也能輕鬆操作的簡易果汁機',
      specifications: JSON.stringify(['功率: 1200W', '簡易操作', '易清洗', '安全鎖定', '靜音設計']),
      specifications2: JSON.stringify(['家用設計', '操作簡單', '安全可靠']),
      stock: 35,
      image: '/images/products/home-juicer.jpg'
    },
    {
      name: 'Rick實驗室營養機',
      category: 'juicer',
      price: 8990,
      original_price: 11990,
      description: '實驗室級營養機，可分析並最佳化營養成分',
      specifications: JSON.stringify(['功率: 2800W', '營養分析', '智能配比', '專業級馬達', '科學萃取']),
      specifications2: JSON.stringify(['營養分析技術', '科學配比', '實驗室級']),
      stock: 5,
      image: '/images/products/lab-nutrition.jpg'
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

// 執行重置
console.log('🚀 開始執行產品數據重置腳本...');
console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? '已設定' : '未設定');
console.log('📍 NODE_ENV:', process.env.NODE_ENV);

resetProductData().catch(error => {
  console.error('❌ 程序執行失敗:', error);
  process.exit(1);
});