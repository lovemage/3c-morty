# 第三方金流API - 廠商接入文件

## 🎯 服務說明
廠商發出請求提供訂單編號和金額，我們直接返回ECPay收銀台跳轉頁面網址，廠商只需將用戶導向此網址，用戶就能直接進入ECPay收銀台完成付款。廠商無需處理任何ECPay技術細節。

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
  "client_order_id": "ORDER-001",
  "callback_url": "https://your-domain.com/payment/callback"
}
```

**參數說明**:
- `amount`: 付款金額 (必填，1-6000元)
- `client_order_id`: 廠商訂單編號 (必填，唯一識別)
- `callback_url`: 付款完成回調網址 (選填，如需接收付款成功通知請提供)

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

**重要**: 廠商只需調用API並將用戶導向返回的 `barcode_page_url`，用戶將直接進入ECPay收銀台完成付款。

### 查詢訂單狀態

**完整網址**: `GET https://corba3c-production.up.railway.app/api/third-party/orders/{order_id}/barcode`

**Headers**:
```
X-API-KEY: 您的API Key
```

查詢我們系統中的訂單狀態，無法取得ECPay的條碼資料。

**回應範例**:
```json
{
  "success": true,
  "data": {
    "order_id": 68,
    "external_order_id": "ORDER-001",
    "status": "paid",
    "amount": 299,
    "paid_at": "2025-08-20T12:34:56.789Z",
    "expire_date": "2025-08-26T07:21:43.628Z"
  }
}
```

### 付款完成回調通知

當用戶完成付款後，系統會自動發送POST請求到您在創建訂單時提供的`callback_url`。

**回調格式**:
```json
{
  "event": "payment.completed",
  "payment_id": "PAY_1234567890123456",
  "external_ref": "ORDER-001",
  "amount": 299,
  "paid_at": "2025-08-20T12:34:56.789Z",
  "signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**回調參數說明**:
- `event`: 事件類型，固定為 `payment.completed`
- `payment_id`: 我們系統的付款編號
- `external_ref`: 廠商的訂單編號 (對應創建時的client_order_id)
- `amount`: 付款金額
- `paid_at`: 付款完成時間 (ISO 8601格式)
- `signature`: 數位簽名，用於驗證通知真實性

**重要**: 廠商收到回調後必須回應HTTP 200狀態碼，否則系統會重試發送通知。

## 💳 使用流程

1. 廠商調用我們的API，提供訂單編號、金額 (可選提供回調網址)
2. 我們返回 `barcode_page_url` 跳轉頁面網址
3. 廠商將用戶導向此網址（使用 `window.location.href` 或服務端 302 重定向）
4. 用戶自動跳轉到ECPay收銀台完成條碼付款
5. 付款完成後，如有提供callback_url，我們自動發送回調通知
6. 廠商可透過回調通知或主動查詢API了解付款狀態

## ✅ 服務

- 廠商無需申請ECPay帳號
- 廠商無需處理ECPay表單和參數
- 我們處理所有金流整合和回調通知

## 🧪 測試

測試頁面：https://corba3c-production.up.railway.app/test-ecpay

### 使用curl測試
```bash
curl -X POST https://corba3c-production.up.railway.app/api/third-party/barcode/create \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: 您的API Key" \
  -d '{
    "amount": 299,
    "client_order_id": "TEST-001",
    "callback_url": "https://your-domain.com/payment/callback"
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
        client_order_id: 'ORDER-' + Date.now(),
        callback_url: 'https://your-domain.com/payment/callback'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // 直接跳轉到ECPay收銀台頁面
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
    'client_order_id' => 'ORDER-' . time(),
    'callback_url' => 'https://your-domain.com/payment/callback'
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
    // 直接跳轉到ECPay收銀台頁面
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
    'client_order_id': 'ORDER-' + str(int(time.time())),
    'callback_url': 'https://your-domain.com/payment/callback'
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

## 🔐 回調驗證範例

### 數位簽名驗證
為確保回調通知的真實性，我們在發送付款完成通知時會包含數位簽名。**廠商調用我們的API時不需要簽名，只需要X-API-KEY驗證即可。**

**我們的簽名計算方法**:
```
signature = SHA256(payment_id + external_ref + amount + paid_at + your_api_key)
```

**重要說明**:
- 廠商調用API：只需X-API-KEY，無需額外簽名
- 我們發送回調：包含SHA256簽名供廠商驗證通知真實性

### JavaScript/Node.js 回調處理範例
```javascript
const crypto = require('crypto');

app.post('/payment/callback', (req, res) => {
  const { event, payment_id, external_ref, amount, paid_at, signature } = req.body;
  
  // 驗證簽名
  const expectedSignature = crypto.createHash('sha256')
    .update(payment_id + external_ref + amount + paid_at + 'your-api-key-here')
    .digest('hex');
  
  if (signature === expectedSignature) {
    // 簽名驗證通過，處理付款完成邏輯
    console.log('付款完成:', {
      order_id: external_ref,
      payment_id: payment_id,
      amount: amount,
      paid_at: paid_at
    });
    
    // 更新訂單狀態
    updateOrderStatus(external_ref, 'paid');
    
    // 必須回應200狀態碼
    res.status(200).send('OK');
  } else {
    // 簽名驗證失敗
    console.error('回調簽名驗證失敗');
    res.status(400).send('Invalid signature');
  }
});
```

### PHP 回調處理範例
```php
<?php
// 接收回調數據
$input = file_get_contents('php://input');
$data = json_decode($input, true);

$payment_id = $data['payment_id'];
$external_ref = $data['external_ref'];
$amount = $data['amount'];
$paid_at = $data['paid_at'];
$received_signature = $data['signature'];

// 計算預期簽名
$api_key = 'your-api-key-here';
$expected_signature = hash('sha256', $payment_id . $external_ref . $amount . $paid_at . $api_key);

if ($received_signature === $expected_signature) {
    // 簽名驗證通過，處理付款完成邏輯
    error_log('付款完成: ' . $external_ref);
    
    // 更新訂單狀態
    updateOrderStatus($external_ref, 'paid');
    
    // 回應200狀態碼
    http_response_code(200);
    echo 'OK';
} else {
    // 簽名驗證失敗
    error_log('回調簽名驗證失敗');
    http_response_code(400);
    echo 'Invalid signature';
}
?>
```

### Python 回調處理範例
```python
import hashlib
import json
from flask import Flask, request

app = Flask(__name__)

@app.route('/payment/callback', methods=['POST'])
def payment_callback():
    data = request.get_json()
    
    payment_id = data['payment_id']
    external_ref = data['external_ref']
    amount = str(data['amount'])
    paid_at = data['paid_at']
    received_signature = data['signature']
    
    # 計算預期簽名
    api_key = 'your-api-key-here'
    signature_string = payment_id + external_ref + amount + paid_at + api_key
    expected_signature = hashlib.sha256(signature_string.encode()).hexdigest()
    
    if received_signature == expected_signature:
        # 簽名驗證通過，處理付款完成邏輯
        print(f'付款完成: {external_ref}')
        
        # 更新訂單狀態
        update_order_status(external_ref, 'paid')
        
        # 回應200狀態碼
        return 'OK', 200
    else:
        # 簽名驗證失敗
        print('回調簽名驗證失敗')
        return 'Invalid signature', 400
```