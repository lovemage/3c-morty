// 模擬綠界PaymentInfoURL回調
async function simulateECPayCallback() {
  const merchantTradeNo = 'TPA1755500457564012'; // 剛建立的訂單
  
  // 模擬綠界回傳的條碼資訊
  const mockCallbackData = {
    MerchantTradeNo: merchantTradeNo,
    TradeNo: 'EC' + Date.now(),
    PaymentType: 'BARCODE',
    TradeDate: new Date().toISOString(),
    Barcode_1: '12345678901234567890',
    Barcode_2: '09876543210987654321', 
    Barcode_3: '11223344556677889900',
    ExpireDate: '2025/08/25 23:59:59',
    PaymentNo: 'P' + Date.now()
  };
  
  console.log('🔄 模擬綠界PaymentInfoURL回調...');
  console.log('📋 回調數據:', mockCallbackData);
  
  try {
    const response = await fetch('https://corba3c-production.up.railway.app/api/third-party/ecpay/payment-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockCallbackData)
    });
    
    const responseText = await response.text();
    console.log('✅ 回調回應:', response.status, responseText);
    
    if (response.ok && responseText === '1|OK') {
      console.log('🎉 PaymentInfoURL回調模擬成功!');
      
      // 等待一下然後查詢條碼狀態
      console.log('⏳ 等待3秒後查詢條碼狀態...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 查詢條碼狀態
      const statusResponse = await fetch(`https://corba3c-production.up.railway.app/api/third-party/orders/12/barcode`, {
        headers: {
          'x-api-key': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
        }
      });
      
      const statusData = await statusResponse.json();
      console.log('📊 條碼狀態查詢結果:');
      console.log(JSON.stringify(statusData, null, 2));
      
      if (statusData.success && statusData.data.barcode_status === 'generated') {
        console.log('');
        console.log('🎯 條碼已生成! 三方網站可以使用以下信息:');
        console.log('📱 完整條碼:', statusData.data.barcode);
        console.log('🖼️  條碼圖片URL:', statusData.data.barcode_url);
        console.log('🔢 三段條碼:');
        console.log('   第1段:', statusData.data.barcode_segments.barcode_1);
        console.log('   第2段:', statusData.data.barcode_segments.barcode_2);
        console.log('   第3段:', statusData.data.barcode_segments.barcode_3);
      }
      
    } else {
      console.error('❌ PaymentInfoURL回調失敗');
    }
    
  } catch (error) {
    console.error('❌ 模擬回調錯誤:', error.message);
  }
}

simulateECPayCallback();