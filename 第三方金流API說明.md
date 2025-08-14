# 第三方金流 API 使用說明

## 服務簡介

我們提供完整的金流代收服務，您只需要發送付款請求，我們處理所有後續流程：
- ✅ 自動產生超商繳費條碼
- ✅ 處理買家付款流程  
- ✅ 付款完成自動通知

## 快速整合

### 1. 取得 API 金鑰
請聯絡我們取得您專屬的 API Key

### 2. 發起付款請求

**API 端點**: `POST /api/payment/create`

**請求格式**:
```json
{
  "amount": 3000,                          // 付款金額
  "description": "商品購買",               // 商品描述  
  "external_ref": "YOUR-ORDER-123",        // 您的訂單號 (唯一)
  "notify_url": "https://your-site.com/notify"  // 付款完成通知網址 (選填)
}
```

**請求標頭**:
```
Content-Type: application/json
X-API-Key: 您的API金鑰
```

**成功回應**:
```json
{
  "success": true,
  "data": {
    "payment_id": "PAY20240101001",
    "amount": 3000,
    "status": "pending", 
    "payment_info": {
      "barcode_url": "https://payment.ecpay.com.tw/...",  // 超商條碼頁面
      "expire_time": "2024-01-08T23:59:59Z"               // 繳費期限
    }
  }
}
```

### 3. 查詢付款狀態

**API 端點**: `GET /api/payment/{payment_id}/status`

**回應**:
```json
{
  "success": true,
  "data": {
    "payment_id": "PAY20240101001",
    "status": "paid",                    // pending/paid/expired
    "paid_at": "2024-01-01T14:30:00Z"   // 付款時間 (已付款時)
  }
}
```

## 付款完成通知

當買家完成付款時，我們會發送通知到您的 `notify_url`:

```json
{
  "event": "payment.completed",
  "payment_id": "PAY20240101001", 
  "external_ref": "YOUR-ORDER-123",
  "amount": 3000,
  "paid_at": "2024-01-01T14:30:00Z",
  "signature": "abc123..."          // 簽名驗證
}
```

### 簽名驗證 (重要)
```javascript
const crypto = require('crypto');
const data = payment_id + external_ref + amount + paid_at;
const expectedSignature = crypto.createHash('sha256').update(data + YOUR_API_KEY).digest('hex');
// 比較 expectedSignature 與收到的 signature
```

## 整合範例

### Node.js 範例
```javascript
// 建立付款
async function createPayment(amount, description, orderRef) {
  const response = await fetch('https://your-api-domain.com/api/payment/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'YOUR_API_KEY'
    },
    body: JSON.stringify({
      amount,
      description,
      external_ref: orderRef,
      notify_url: 'https://your-site.com/payment-notify'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // 導向用戶到 result.data.payment_info.barcode_url
    console.log('條碼頁面:', result.data.payment_info.barcode_url);
    return result.data;
  } else {
    throw new Error(result.error.message);
  }
}

// 處理付款完成通知
app.post('/payment-notify', (req, res) => {
  const { payment_id, external_ref, amount, paid_at, signature } = req.body;
  
  // 驗證簽名
  const crypto = require('crypto');
  const data = payment_id + external_ref + amount + paid_at;
  const expectedSig = crypto.createHash('sha256').update(data + YOUR_API_KEY).digest('hex');
  
  if (signature === expectedSig) {
    // 簽名正確，處理付款完成邏輯
    console.log('付款完成:', external_ref);
    res.send('OK');
  } else {
    res.status(400).send('Invalid signature');
  }
});
```

### PHP 範例  
```php
// 建立付款
function createPayment($amount, $description, $orderRef) {
    $data = [
        'amount' => $amount,
        'description' => $description,
        'external_ref' => $orderRef,
        'notify_url' => 'https://your-site.com/payment-notify.php'
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://your-api-domain.com/api/payment/create',
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: YOUR_API_KEY'
        ]
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($result['success']) {
        return $result['data'];
    } else {
        throw new Exception($result['error']['message']);
    }
}

// 處理付款完成通知 (payment-notify.php)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $data = $input['payment_id'] . $input['external_ref'] . $input['amount'] . $input['paid_at'];
    $expectedSig = hash('sha256', $data . 'YOUR_API_KEY');
    
    if ($input['signature'] === $expectedSig) {
        // 簽名正確，處理付款完成
        echo "OK";
    } else {
        http_response_code(400);
        echo "Invalid signature";
    }
}
```

## 錯誤處理

### 常見錯誤
| 狀態碼 | 錯誤碼 | 說明 |
|--------|--------|------|
| 400 | INVALID_AMOUNT | 金額格式錯誤 |
| 401 | INVALID_API_KEY | API Key 無效 |
| 409 | DUPLICATE_REF | 訂單號重複 |
| 429 | RATE_LIMIT_EXCEEDED | 請求過於頻繁 |

### 錯誤回應格式
```json
{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "付款金額必須大於 0"
  }
}
```

## 限制說明

- **金額範圍**: NT$ 1000 ~ NT$ 10,000
- **API 頻率**: 每分鐘最多 60 次建立付款請求
- **繳費期限**: 7 天內完成繳費
- **參考號**: 每個客戶端的 external_ref 必須唯一

