// 設置Railway環境變數的腳本
// 注意：這個腳本只是提供設置指令，需要手動在Railway控制台執行

console.log('🔧 建議在Railway控制台設置以下環境變數:');
console.log('');

const envVars = {
  'ECPAY_RETURN_URL': 'https://corba3c-production.up.railway.app/api/third-party/ecpay/callback',
  'ECPAY_PAYMENT_INFO_URL': 'https://corba3c-production.up.railway.app/api/third-party/ecpay/payment-info',
  'BASE_URL': 'https://corba3c-production.up.railway.app'
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('');
console.log('📋 說明:');
console.log('- ECPAY_RETURN_URL: 付款完成後的回調URL');
console.log('- ECPAY_PAYMENT_INFO_URL: 條碼資訊回調URL (重要!)');
console.log('- BASE_URL: 系統基礎URL');
console.log('');
console.log('⚠️  設置完成後需要重新部署服務才會生效');

// 現在讓我檢查當前的條碼狀態
import fetch from 'node-fetch';

async function checkCurrentStatus() {
  try {
    console.log('');
    console.log('🔍 檢查當前最新訂單的條碼狀態...');
    
    const response = await fetch('https://corba3c-production.up.railway.app/api/third-party/orders/13/barcode', {
      headers: {
        'x-api-key': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 條碼狀態:', data.data.barcode_status);
      console.log('📱 條碼內容:', data.data.barcode || '尚未生成');
      
      if (data.data.barcode_status === 'generated') {
        console.log('🎉 真實條碼已生成!');
        console.log('🖼️  條碼URL:', data.data.barcode_url);
      } else {
        console.log('⏳ 條碼尚未生成，可能需要等待綠界回調');
      }
    } else {
      console.log('❌ 查詢失敗:', response.status);
    }
  } catch (error) {
    console.log('❌ 查詢錯誤:', error.message);
  }
}

checkCurrentStatus();