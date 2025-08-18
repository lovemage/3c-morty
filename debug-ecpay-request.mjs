import pkg from 'pg';
const { Client } = pkg;

async function debugECPayRequest() {
  const publicUrl = 'postgresql://postgres:BvAdHDswtNGeKgNnUuPLztfRSWIXAclO@yamanote.proxy.rlwy.net:17443/railway';
  
  const client = new Client({
    connectionString: publicUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    
    // 查詢最新的綠界交易記錄
    const result = await client.query(`
      SELECT et.merchant_trade_no, et.raw_response, tpo.external_order_id
      FROM ecpay_transactions et
      JOIN third_party_orders tpo ON et.third_party_order_id = tpo.id
      ORDER BY et.created_at DESC
      LIMIT 2
    `);
    
    console.log('🔍 最新的綠界API調用記錄:');
    
    result.rows.forEach((row, index) => {
      console.log(`\n=== 記錄 ${index + 1} ===`);
      console.log('商家訂單號:', row.merchant_trade_no);
      console.log('外部訂單號:', row.external_order_id);
      
      if (row.raw_response) {
        try {
          const apiParams = JSON.parse(row.raw_response);
          console.log('📋 綠界API參數:');
          console.log('MerchantID:', apiParams.MerchantID);
          console.log('PaymentInfoURL:', apiParams.PaymentInfoURL);
          console.log('ReturnURL:', apiParams.ReturnURL);
          console.log('ChoosePayment:', apiParams.ChoosePayment);
          console.log('StoreExpireDate:', apiParams.StoreExpireDate);
          
          // 檢查關鍵參數
          if (apiParams.PaymentInfoURL) {
            console.log('✅ PaymentInfoURL已設置');
          } else {
            console.log('❌ PaymentInfoURL未設置');
          }
          
        } catch (e) {
          console.log('❌ 無法解析API參數:', e.message);
        }
      }
    });
    
    // 檢查是否有收到任何回調
    console.log('\n🔍 檢查PaymentInfo回調記錄...');
    // 這裡我們無法直接查詢日誌，但可以檢查數據庫中的barcode_data
    
    const barcodeResult = await client.query(`
      SELECT id, external_order_id, barcode_status, 
             CASE WHEN barcode_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_barcode_data
      FROM third_party_orders 
      WHERE barcode_status = 'generated'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (barcodeResult.rows.length > 0) {
      console.log('✅ 找到已生成條碼的訂單:');
      barcodeResult.rows.forEach(row => {
        console.log(`- 訂單${row.id} (${row.external_order_id}): 條碼數據 ${row.has_barcode_data}`);
      });
    } else {
      console.log('❌ 沒有找到任何已生成條碼的訂單');
      console.log('');
      console.log('🤔 可能的原因:');
      console.log('1. 綠界還沒有回調PaymentInfoURL');
      console.log('2. PaymentInfoURL無法被綠界訪問');
      console.log('3. 回調參數格式與我們的處理邏輯不匹配');
      console.log('4. 正式環境需要特殊配置');
    }
    
  } catch (error) {
    console.error('❌ 調試失敗:', error.message);
  } finally {
    await client.end();
  }
}

debugECPayRequest();