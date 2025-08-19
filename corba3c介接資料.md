# 第三方金流API - 廠商接入文件

## 🎯 服務說明
廠商只需提供訂單編號和金額，我們處理所有金流技術細節，返回付款頁面網址供用戶使用。

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
    "order_id": 68,
    "client_order_id": "ORDER-001",
    "amount": 299,
    "expire_date": "2025-08-26T07:21:43.628Z",
    "barcode_page_url": "https://corba3c-production.up.railway.app/api/third-party/orders/68/barcode/page"
  }
}
```

**重要**: 廠商取得 `barcode_page_url` 後，直接引導用戶前往此網址即可完成付款。

### 查詢訂單狀態

**完整網址**: `GET https://corba3c-production.up.railway.app/api/third-party/orders/{order_id}/barcode`

**Headers**:
```
X-API-KEY: 您的API Key
```

查詢我們系統中的訂單狀態，無法取得ECPay的條碼資料。

## 💳 使用流程

1. 廠商調用我們的API，提供訂單編號和金額
2. 我們返回 `barcode_page_url` 付款頁面網址
3. 廠商引導用戶前往此網址
4. 我們的頁面處理所有金流流程
5. 用戶完成條碼付款

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
async function createOrderAndRedirect() {
  try {
    // 調用API創建訂單
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
    
    if (data.success) {
      // 直接跳轉到我們的付款頁面
      window.location.href = data.data.barcode_page_url;
    }
  } catch (error) {
    console.error('API調用失敗:', error);
  }
}
```

### PHP範例
```php
<?php
// 調用API創建訂單
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

if ($response['success']) {
    // 直接跳轉到我們的付款頁面
    $paymentUrl = $response['data']['barcode_page_url'];
    header('Location: ' . $paymentUrl);
    exit;
}
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