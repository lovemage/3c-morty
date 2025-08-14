import crypto from 'crypto';

// 測試第三方API
async function testThirdPartyAPI() {
  const baseUrl = 'http://localhost:3001';
  
  // 測試API Key (從資料庫中獲取)
  const testApiKey = 'test-api-key-twa4fsmmaw';
  
  console.log('🧪 測試第三方BARCODE下單API...');
  
  try {
    // 測試下單請求 (簡化版 - 只需要金額和訂單號)
    const orderData = {
      amount: 3990,
      client_order_id: `TEST_ORDER_${Date.now()}`,
      callback_url: 'https://example.com/payment-callback'
    };
    
    console.log('📦 發送下單請求:', orderData);
    
    const response = await fetch(`${baseUrl}/api/third-party/barcode/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    console.log('📊 API回應狀態:', response.status);
    console.log('📋 API回應內容:', result);
    
    if (response.ok && result.success) {
      console.log('✅ 第三方API下單成功！');
      console.log('🆔 訂單ID:', result.data.order_id);
      console.log('💳 商家交易號:', result.data.merchant_trade_no);
      console.log('🏪 便利店類型:', result.data.store_type);
      console.log('💰 金額:', result.data.amount);
      console.log('📱 條碼:', result.data.barcode);
      console.log('🔗 條碼URL:', result.data.barcode_url);
      console.log('📅 到期時間:', result.data.expire_date);
      
      // 測試查詢訂單狀態
      console.log('\n🔍 測試查詢訂單狀態...');
      
      const statusResponse = await fetch(
        `${baseUrl}/api/third-party/orders/${result.data.order_id}/status`,
        {
          headers: {
            'X-API-Key': testApiKey
          }
        }
      );
      
      const statusResult = await statusResponse.json();
      console.log('📊 訂單狀態查詢結果:', statusResult);
      
    } else {
      console.log('❌ 第三方API下單失敗');
      console.log('錯誤信息:', result.message || '未知錯誤');
    }
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

// 執行測試
console.log('🚀 開始測試第三方API...');
testThirdPartyAPI().then(() => {
  console.log('✅ 測試完成');
}).catch(error => {
  console.error('❌ 測試程序失敗:', error);
  process.exit(1);
});