#!/usr/bin/env node

// 測試 Railway 線上環境的第三方API
async function testRailwayAPI() {
  // Railway 線上環境 URL
  const baseUrl = 'https://corba3c-production.up.railway.app';
  
  // 測試用的API Key (需要先在線上環境設置)
  const testApiKey = 'test-api-key-corba3c2024';
  
  console.log('🚀 測試 Railway 線上環境的四方金流API...');
  console.log('🌐 伺服器URL:', baseUrl);
  console.log('🔑 使用API Key:', testApiKey);
  
  try {
    // 1. 首先測試健康檢查
    console.log('\n📋 步驟 1: 檢查伺服器健康狀態...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthResult = await healthResponse.json();
    
    console.log('✅ 健康檢查回應:', healthResult);
    
    if (!healthResponse.ok) {
      throw new Error('伺服器健康檢查失敗');
    }
    
    // 2. 測試第三方 BARCODE 下單API
    console.log('\n📋 步驟 2: 測試第三方BARCODE下單API...');
    
    const orderData = {
      amount: 1299,                                    // 測試金額
      client_order_id: `RAILWAY_TEST_${Date.now()}`,  // 唯一訂單號
      callback_url: 'https://webhook.site/test',       // 測試回調URL
      product_info: '3C商品測試訂單',                    // 產品描述
      store_type: '7ELEVEN'                            // 便利店類型
    };
    
    console.log('📦 發送下單請求:', orderData);
    
    const response = await fetch(`${baseUrl}/api/third-party/barcode/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey,
        'User-Agent': 'Railway-Test-Client/1.0'
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    console.log('📊 HTTP狀態:', response.status);
    console.log('📋 API回應:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('\n✅ 第三方API下單成功！');
      console.log('🆔 訂單ID:', result.data.order_id);
      console.log('💳 商家交易號:', result.data.merchant_trade_no);
      console.log('🏪 便利店類型:', result.data.store_type);
      console.log('💰 金額:', result.data.amount);
      console.log('📱 Barcode:', result.data.barcode);
      console.log('🔗 Barcode URL:', result.data.barcode_url);
      console.log('📅 到期時間:', result.data.expire_date);
      console.log('🔗 客戶填寫頁面:', result.data.customer_info_url);
      
      // 3. 測試查詢訂單狀態
      console.log('\n📋 步驟 3: 測試查詢訂單狀態...');
      
      const statusResponse = await fetch(
        `${baseUrl}/api/third-party/orders/${result.data.order_id}/status`,
        {
          headers: {
            'X-API-Key': testApiKey,
            'User-Agent': 'Railway-Test-Client/1.0'
          }
        }
      );
      
      const statusResult = await statusResponse.json();
      console.log('📊 訂單狀態查詢結果:', JSON.stringify(statusResult, null, 2));
      
      if (statusResponse.ok) {
        console.log('✅ 訂單狀態查詢成功');
        console.log('📈 當前狀態:', statusResult.data.status);
        console.log('💰 訂單金額:', statusResult.data.amount);
        console.log('📅 建立時間:', statusResult.data.created_at);
      }
      
      // 4. 檢查綠界 Barcode 是否有效
      console.log('\n📋 步驟 4: 驗證綠界 Barcode...');
      
      if (result.data.barcode && result.data.barcode.length > 0) {
        if (result.data.barcode.startsWith('SIM_')) {
          console.log('⚠️  注意: 這是模擬 Barcode (開發測試用)');
          console.log('🔧 實際上線需要配置真實的綠界金流參數');
        } else {
          console.log('✅ 獲得真實綠界 Barcode');
        }
        
        // 檢查 QR Code URL 是否可訪問
        if (result.data.barcode_url) {
          try {
            const qrResponse = await fetch(result.data.barcode_url, { method: 'HEAD' });
            if (qrResponse.ok) {
              console.log('✅ QR Code URL 可正常訪問');
            } else {
              console.log('⚠️  QR Code URL 訪問異常:', qrResponse.status);
            }
          } catch (error) {
            console.log('⚠️  QR Code URL 檢查失敗:', error.message);
          }
        }
      } else {
        console.log('❌ 未獲得有效的 Barcode');
      }
      
    } else {
      console.log('❌ 第三方API下單失敗');
      console.log('錯誤代碼:', response.status);
      console.log('錯誤信息:', result.message || result.error || '未知錯誤');
      
      if (response.status === 401) {
        console.log('💡 提示: API Key 可能無效，請檢查線上環境是否已設置測試 API Key');
      } else if (response.status === 429) {
        console.log('💡 提示: API 調用頻率超限，請稍後再試');
      } else if (response.status === 500) {
        console.log('💡 提示: 伺服器內部錯誤，請檢查 Railway 日誌');
      }
    }
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    console.error('詳細錯誤:', error);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 提示: 無法連接到 Railway 伺服器，請檢查網路連線或URL是否正確');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 連接被拒絕，伺服器可能未運行');
    }
  }
}

// 執行測試
console.log('🚀 開始測試 Railway 線上環境...');
console.log('🌐 目標: https://corba3c-production.up.railway.app');
console.log('⏰ 時間:', new Date().toLocaleString('zh-TW'));

testRailwayAPI().then(() => {
  console.log('\n✅ 測試完成');
  console.log('📝 如需查看詳細日誌，請登入 Railway Dashboard 查看');
}).catch(error => {
  console.error('\n❌ 測試程序失敗:', error);
  process.exit(1);
});
