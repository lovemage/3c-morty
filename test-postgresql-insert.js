import { runSQL, getAsync, allAsync } from './server/database/database-adapter.js';

async function testPostgreSQLInsert() {
  try {
    console.log('🧪 測試PostgreSQL INSERT功能...');
    
    // 設定環境變數以使用PostgreSQL
    process.env.DATABASE_URL = "postgresql://postgres:BvAdHDswtNGeKgNnUuPLztfRSWIXAclO@yamanote.proxy.rlwy.net:17443/railway";
    process.env.NODE_ENV = "production";
    
    // 測試插入一個測試訂單
    console.log('📦 測試插入訂單...');
    const orderResult = await runSQL(`
      INSERT INTO orders (
        user_id, total, status, shipping_name, shipping_address, 
        shipping_city, shipping_postal_code, shipping_phone,
        merchant_trade_no, payment_method, trade_desc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, // admin user
      1000,
      'pending',
      '測試用戶',
      '測試地址',
      '台北市',
      '10001',
      '0912345678',
      'TEST' + Date.now(),
      'BARCODE',
      '測試訂單'
    ]);
    
    console.log('📊 訂單插入結果:', orderResult);
    
    if (orderResult.lastInsertRowid) {
      const orderId = orderResult.lastInsertRowid;
      console.log('✅ 成功獲得訂單ID:', orderId);
      
      // 測試插入訂單項目
      console.log('📋 測試插入訂單項目...');
      const itemResult = await runSQL(`
        INSERT INTO order_items (
          order_id, product_name, quantity, price
        ) VALUES (?, ?, ?, ?)
      `, [
        orderId,
        '測試商品',
        1,
        1000
      ]);
      
      console.log('📊 訂單項目插入結果:', itemResult);
      
      // 驗證數據
      const insertedOrder = await getAsync('SELECT * FROM orders WHERE id = ?', [orderId]);
      console.log('🔍 插入的訂單:', insertedOrder);
      
      const insertedItems = await allAsync('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      console.log('🔍 插入的訂單項目:', insertedItems);
      
      // 清理測試數據
      console.log('🧹 清理測試數據...');
      await runSQL('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      await runSQL('DELETE FROM orders WHERE id = ?', [orderId]);
      
      console.log('✅ PostgreSQL INSERT測試成功！');
    } else {
      console.error('❌ 未能獲得插入的訂單ID');
    }
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    throw error;
  }
}

// 執行測試
testPostgreSQLInsert().catch(error => {
  console.error('❌ 測試程序失敗:', error);
  process.exit(1);
});