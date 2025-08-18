import pkg from 'pg';
const { Client } = pkg;

async function checkBarcodeData() {
  const publicUrl = 'postgresql://postgres:BvAdHDswtNGeKgNnUuPLztfRSWIXAclO@yamanote.proxy.rlwy.net:17443/railway';
  
  const client = new Client({
    connectionString: publicUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    
    // 查詢訂單12的條碼資料
    const result = await client.query(`
      SELECT id, external_order_id, payment_code, payment_url, barcode_data, barcode_status, expire_date
      FROM third_party_orders 
      WHERE id = 12
    `);
    
    if (result.rows.length > 0) {
      const order = result.rows[0];
      console.log('📋 訂單12的條碼資料:');
      console.log('ID:', order.id);
      console.log('外部訂單號:', order.external_order_id);
      console.log('條碼狀態:', order.barcode_status);
      console.log('付款代碼:', order.payment_code);
      console.log('付款URL:', order.payment_url);
      console.log('過期時間:', order.expire_date);
      console.log('條碼數據 (JSON):', order.barcode_data);
      
      if (order.barcode_data) {
        console.log('');
        console.log('🔍 解析條碼數據:');
        const parsed = JSON.parse(JSON.stringify(order.barcode_data));
        console.log(JSON.stringify(parsed, null, 2));
        
        console.log('');
        console.log('🎯 三方網站可使用的條碼URL:');
        console.log(order.payment_url);
      }
    } else {
      console.log('❌ 找不到訂單12');
    }
    
  } catch (error) {
    console.error('❌ 查詢失敗:', error.message);
  } finally {
    await client.end();
  }
}

checkBarcodeData();