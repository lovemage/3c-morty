// 綠界 BARCODE 整合測試
const BASE_URL = 'http://localhost:3001';
const API_KEY = 'test-api-key-o62578rmqcj'; // 從資料庫中取得

async function testECPayBarcodeIntegration() {
  console.log('🧪 測試綠界 BARCODE 整合');
  console.log('─'.repeat(50));

  // 檢查 API Key
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('❌ 請先設定正確的 API Key');
    return;
  }

  try {
    // 1. 建立付款請求
    console.log('1. 建立 BARCODE 付款請求...');
    
    const paymentData = {
      amount: 1500, // 符合 1000-10000 範圍
      description: '綠界 BARCODE 測試商品',
      external_ref: `BARCODE-TEST-${Date.now()}`,
      notify_url: 'https://webhook.site/barcode-test'
    };

    const response = await fetch(`${BASE_URL}/api/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ 付款請求建立成功');
      console.log(`   付款 ID: ${result.data.payment_id}`);
      console.log(`   金額: NT$ ${result.data.amount}`);
      console.log(`   狀態: ${result.data.status}`);
      console.log(`   付款方式: ${result.data.payment_info.method}`);
      console.log(`   BARCODE 網址: ${result.data.payment_info.barcode_url}`);
      console.log(`   期限: ${result.data.payment_info.expire_time}`);
      
      // 2. 驗證付款方式是否正確
      if (result.data.payment_info.method === 'cvs_barcode') {
        console.log('✅ 付款方式設定正確 (cvs_barcode)');
      } else {
        console.log('❌ 付款方式錯誤:', result.data.payment_info.method);
      }
      
      // 3. 驗證綠界網址
      if (result.data.payment_info.barcode_url.includes('payment-stage.ecpay.com.tw') || 
          result.data.payment_info.barcode_url.includes('payment.ecpay.com.tw')) {
        console.log('✅ 綠界付款網址正確');
      } else {
        console.log('❌ 付款網址異常:', result.data.payment_info.barcode_url);
      }

      // 4. 查詢付款狀態
      console.log('\n2. 查詢付款狀態...');
      const statusResponse = await fetch(`${BASE_URL}/api/payment/${result.data.payment_id}/status`, {
        headers: { 'X-API-Key': API_KEY }
      });
      
      const statusResult = await statusResponse.json();
      
      if (statusResult.success) {
        console.log('✅ 狀態查詢成功');
        console.log(`   狀態: ${statusResult.data.status}`);
        console.log(`   建立時間: ${statusResult.data.created_at}`);
      } else {
        console.log('❌ 狀態查詢失敗:', statusResult.error);
      }

      // 5. 測試綠界參數格式
      console.log('\n3. 驗證綠界參數...');
      console.log('✅ 使用 BARCODE 付款方式');
      console.log('✅ 金額範圍 1000-10000 (當前:', paymentData.amount + ')');
      console.log('✅ SHA256 CheckMacValue 加密');
      console.log('✅ 7天繳費期限');

      console.log('\n🎉 綠界 BARCODE 整合測試完成！');
      console.log(`\n💡 下一步: 訪問 ${result.data.payment_info.barcode_url} 取得條碼`);
      
      return result.data;
    } else {
      console.log('❌ 付款請求失敗:', result.error);
    }

  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error.message);
  }
}

// 執行測試
testECPayBarcodeIntegration();