import pkg from 'pg';
const { Client } = pkg;

async function monitorCallbacks() {
  const publicUrl = 'postgresql://postgres:BvAdHDswtNGeKgNnUuPLztfRSWIXAclO@yamanote.proxy.rlwy.net:17443/railway';
  
  const client = new Client({
    connectionString: publicUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    
    console.log('🔍 監控ECPay回調和API調用...');
    
    // 檢查最近的PaymentInfo回調 (從security_logs中查看)
    const securityLogs = await client.query(`
      SELECT event_type, message, details, created_at
      FROM security_logs 
      WHERE message LIKE '%PaymentInfo%' OR message LIKE '%ECPay%'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📋 最近的ECPay相關安全日誌:');
    if (securityLogs.rows.length > 0) {
      securityLogs.rows.forEach((log, index) => {
        console.log(`${index + 1}. [${log.created_at}] ${log.event_type}: ${log.message}`);
        if (log.details) {
          try {
            const details = JSON.parse(log.details);
            console.log('   詳細信息:', details);
          } catch (e) {
            console.log('   詳細信息:', log.details);
          }
        }
      });
    } else {
      console.log('❌ 沒有找到ECPay相關的日誌');
    }
    
    // 檢查API調用日誌中是否有PaymentInfo請求
    const apiLogs = await client.query(`
      SELECT endpoint, method, response_status, created_at
      FROM api_call_logs 
      WHERE endpoint LIKE '%payment-info%'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n🌐 PaymentInfo API調用記錄:');
    if (apiLogs.rows.length > 0) {
      apiLogs.rows.forEach((log, index) => {
        console.log(`${index + 1}. [${log.created_at}] ${log.method} ${log.endpoint} - Status: ${log.response_status}`);
      });
    } else {
      console.log('❌ 沒有找到PaymentInfo API調用記錄');
    }
    
    // 檢查條碼狀態變更
    const barcodeOrders = await client.query(`
      SELECT id, external_order_id, barcode_status, barcode_data, updated_at
      FROM third_party_orders 
      WHERE barcode_status = 'generated' OR barcode_data IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 5
    `);
    
    console.log('\n📱 已生成條碼的訂單:');
    if (barcodeOrders.rows.length > 0) {
      barcodeOrders.rows.forEach((order, index) => {
        console.log(`${index + 1}. 訂單 ${order.id} (${order.external_order_id}): ${order.barcode_status} - 更新於 ${order.updated_at}`);
        if (order.barcode_data) {
          try {
            const barcodeData = JSON.parse(order.barcode_data);
            console.log(`   條碼: ${barcodeData.full_barcode}`);
          } catch (e) {
            console.log(`   條碼數據: ${order.barcode_data}`);
          }
        }
      });
    } else {
      console.log('❌ 沒有找到已生成條碼的訂單');
    }
    
  } catch (error) {
    console.error('❌ 監控失敗:', error.message);
  } finally {
    await client.end();
  }
}

monitorCallbacks();