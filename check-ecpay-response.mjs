import pkg from 'pg';
const { Client } = pkg;

async function checkECPayResponse() {
  const publicUrl = 'postgresql://postgres:BvAdHDswtNGeKgNnUuPLztfRSWIXAclO@yamanote.proxy.rlwy.net:17443/railway';
  
  const client = new Client({
    connectionString: publicUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    
    console.log('🔍 檢查最新ECPay訂單的實際回應...');
    
    // 查詢最新的ECPay交易記錄
    const result = await client.query(`
      SELECT et.merchant_trade_no, et.raw_response, tpo.external_order_id, et.created_at
      FROM ecpay_transactions et
      JOIN third_party_orders tpo ON et.third_party_order_id = tpo.id
      ORDER BY et.created_at DESC
      LIMIT 3
    `);
    
    if (result.rows.length > 0) {
      result.rows.forEach((row, index) => {
        console.log(`\n=== 訂單 ${index + 1} ===`);
        console.log('🏪 商家訂單號:', row.merchant_trade_no);
        console.log('📋 外部訂單號:', row.external_order_id);
        console.log('⏰ 建立時間:', row.created_at);
        
          if (row.raw_response) {
          try {
            const ecpayResponse = JSON.parse(row.raw_response);
            console.log('📤 ECPay API 回應:');
            console.log('- mode:', ecpayResponse.mode);
            console.log('- success:', ecpayResponse.success);
            console.log('- message:', ecpayResponse.message);
            
            if (ecpayResponse.paymentForm) {
              console.log('- paymentForm action:', ecpayResponse.paymentForm.action);
              console.log('- paymentForm method:', ecpayResponse.paymentForm.method);
            }
            
            if (ecpayResponse.ecpayResponse && ecpayResponse.ecpayResponse.length > 10) {
              console.log('🌐 ECPay 原始回應 (前100字元):');
              console.log(ecpayResponse.ecpayResponse.substring(0, 100) + '...');
            }
          } catch (e) {
            console.log('❌ 無法解析ECPay回應:', e.message);
            console.log('原始數據 (前200字元):', row.raw_response.substring(0, 200));
          }
        } else {
          console.log('❌ 沒有ECPay回應數據');
        }
      });
    } else {
      console.log('❌ 找不到指定的訂單記錄');
    }
    
  } catch (error) {
    console.error('❌ 查詢失敗:', error.message);
  } finally {
    await client.end();
  }
}

checkECPayResponse();