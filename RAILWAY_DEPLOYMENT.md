# 第三方金流API - 廠商接入文件

## 🎯 服務說明
本API協助廠商向ECPay發出條碼付款訂單請求，ECPay會返回HTML頁面供用戶點選取得條碼。我們只負責訂單建立，實際條碼生成由ECPay處理。

## 🚀 API使用

### 創建付款訂單

**完整網址**: `POST https://corba3c-production.up.railway.app/api/third-party/barcode/create`

**Headers**:
```
Content-Type: application/json
X-API-KEY: 您的API Key
```

**請求**:
```json
{
  "amount": 299,
  "client_order_id": "ORDER-001"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "order_id": 61,
    "merchant_trade_no": "TPA881036289OR061",
    "amount": 299,
    "expire_date": "2025-08-26T07:21:43.628Z",
    "ecpay_form": {
      "action": "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
      "method": "POST", 
      "params": {
        "MerchantID": "3466445",
        "MerchantTradeNo": "TPA881036289OR061",
        "CheckMacValue": "E39823A21C4A78B522F5F37CF93C8963C563A236DE6DE814547EA07E4BE62D8D"
      }
    }
  }
}
```

**重要**: 目前無法取得條碼資料，只能建立訂單並提供ECPay表單參數。

### 查詢訂單狀態

**完整網址**: `GET https://corba3c-production.up.railway.app/api/third-party/orders/{order_id}/barcode`

**Headers**:
```
X-API-KEY: 您的API Key
```

查詢我們系統中的訂單狀態，無法取得ECPay的條碼資料。

## 💳 使用流程

1. 調用我們的API建立訂單
2. 使用回傳的`ecpay_form`參數建立表單
3. 用戶提交表單跳轉到ECPay頁面
4. 用戶在ECPay頁面點選取得條碼
5. 用戶至便利商店完成付款

```html
<form method="POST" action="{{ecpay_form.action}}">
  <input type="hidden" name="MerchantID" value="{{params.MerchantID}}">
  <input type="hidden" name="MerchantTradeNo" value="{{params.MerchantTradeNo}}">
  <input type="hidden" name="CheckMacValue" value="{{params.CheckMacValue}}">
  <!-- 添加所有params中的參數 -->
  <button type="submit">前往付款</button>
</form>
```

## 🔔 限制說明

- 無法直接產生條碼資料
- 無法取得ECPay的條碼資訊  
- 只能協助建立訂單和提供表單參數
- 付款狀態需透過ECPay回調或輪詢確認

## 🧪 測試

測試頁面：https://corba3c-production.up.railway.app/test-ecpay

### 使用curl測試
```bash
curl -X POST https://corba3c-production.up.railway.app/api/third-party/barcode/create \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: 您的API Key" \
  -d '{
    "amount": 299,
    "client_order_id": "TEST-001"
  }'
```

## 📋 API使用範例

### JavaScript範例
```javascript
async function createOrder() {
  try {
    const response = await fetch('https://corba3c-production.up.railway.app/api/third-party/barcode/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'your-api-key-here'
      },
      body: JSON.stringify({
        amount: 299,
        client_order_id: 'ORDER-' + Date.now()
      })
    });
    
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('API調用失敗:', error);
  }
}
```

### PHP範例
```php
<?php
$url = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create';

$data = [
    'amount' => 299,
    'client_order_id' => 'ORDER-' . time()
];

$options = [
    'http' => [
        'header' => [
            'Content-Type: application/json',
            'X-API-KEY: your-api-key-here'
        ],
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
$response = json_decode($result, true);

print_r($response);
?>
```

### Python範例
```python
import requests

url = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create'
headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': 'your-api-key-here'
}
data = {
    'amount': 299,
    'client_order_id': 'ORDER-' + str(int(time.time()))
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```