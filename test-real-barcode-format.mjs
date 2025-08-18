import fetch from 'node-fetch';

async function testRealBarcodeFormat() {
  console.log('🧪 測試真實ECPay條碼回調格式');
  
  // 模擬真實的ECPay BARCODE回調數據（根據你提供的格式）
  const realBarcodePayload = {
    RtnCode: 1,
    RtnMsg: '成功',
    MerchantTradeNo: 'TPA17241036851713', // 使用最新的訂單號
    TradeNo: 'EC2408180001', 
    PaymentType: 'BARCODE',
    TradeDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    BarcodeInfo: {
      Barcode1: '1407086CY',
      Barcode2: '1557341899384519',
      Barcode3: '0708B4000000100',
      ExpireDate: '2025/08/25 23:59:59'
    }
  };

  console.log('📤 發送真實格式的條碼回調:');
  console.log(JSON.stringify(realBarcodePayload, null, 2));

  try {
    const response = await fetch('https://corba3c-production.up.railway.app/api/third-party/ecpay/payment-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(realBarcodePayload)
    });

    const responseText = await response.text();
    console.log('\n📥 服務器回應:', responseText);

    if (responseText === '1|OK') {
      console.log('✅ 回調處理成功!');
      
      // 等待一下讓數據更新
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 查詢條碼狀態
      console.log('\n🔍 查詢條碼狀態...');
      const statusResponse = await fetch('https://corba3c-production.up.railway.app/api/third-party/orders/13/barcode', {
        headers: {
          'x-api-key': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('📊 條碼狀態:', statusData.data.barcode_status);
        console.log('📱 條碼內容:', statusData.data.barcode);
        console.log('🔗 條碼URL:', statusData.data.barcode_url);
        console.log('📋 條碼段:');
        console.log('  - Barcode1:', statusData.data.barcode_segments.barcode_1);
        console.log('  - Barcode2:', statusData.data.barcode_segments.barcode_2);
        console.log('  - Barcode3:', statusData.data.barcode_segments.barcode_3);
      } else {
        console.log('❌ 查詢狀態失敗:', statusResponse.status);
      }
      
    } else {
      console.log('❌ 回調處理失敗:', responseText);
    }

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

testRealBarcodeFormat();