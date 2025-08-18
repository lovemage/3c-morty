import fetch from 'node-fetch';

async function testSimpleAPI() {
  console.log('🧪 測試簡化的條碼API');
  
  try {
    const response = await fetch('https://corba3c-production.up.railway.app/api/third-party/orders', {
      method: 'GET',
      headers: {
        'x-api-key': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 基本API仍然正常運作');
      console.log('訂單數量:', data.data.orders.length);
      
      if (data.data.orders.length > 0) {
        const latestOrder = data.data.orders[0];
        console.log('最新訂單:', latestOrder.order_id, latestOrder.external_order_id);
        
        // 測試條碼狀態查詢
        const barcodeResponse = await fetch(`https://corba3c-production.up.railway.app/api/third-party/orders/${latestOrder.order_id}/barcode`, {
          headers: {
            'x-api-key': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
          }
        });
        
        if (barcodeResponse.ok) {
          const barcodeData = await barcodeResponse.json();
          console.log('📱 條碼狀態:', barcodeData.data.barcode_status);
        }
      }
    } else {
      console.error('❌ 基本API也有問題:', response.status);
    }
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

// 不使用 node-fetch，改用內建 fetch (如果有的話)
testSimpleAPI();