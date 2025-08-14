# 四方網站條碼付款API 

## 📋 基本資訊

**Base URL**: `https://corba3c-production.up.railway.app/api/third-party`

**認證方式**: 在請求Header中添加 `X-API-Key: your_api_key`

**支援付款方式**: 便利店條碼付款 (7-ELEVEN、全家、萊爾富、OK超商)

---

## 🚀 快速開始

### 1. 創建付款訂單

**端點**: `POST /barcode/create`

**請求範例**:
```bash
curl -X POST https://corba3c-production.up.railway.app/api/third-party/barcode/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "amount": 2990,
    "client_order_id": "ORDER_001"
  }'
```

**必填參數**:
- `amount`: 金額 (1-6000元)
- `client_order_id`: 您的訂單編號 (唯一)

**可選參數**:
- `callback_url`: 付款完成回調網址

**回應**:
```json
{
  "success": true,
  "data": {
    "order_id": 6,
    "barcode_url": "https://payment-stage.ecpay.com.tw/SP/CreateQRCode?qdata=...",
    "expire_date": "2025-08-20T16:00:56.990Z"
  }
}
```

### 2. 查詢訂單狀態

**端點**: `GET /orders/{order_id}/status`

**請求範例**:
```bash
curl -H "X-API-Key: your_api_key" \
  https://corba3c-production.up.railway.app/api/third-party/orders/6/status
```

**回應**:
```json
{
  "success": true,
  "data": {
    "order_id": 6,
    "status": "pending",
    "amount": 2990
  }
}
```

**狀態說明**:
- `pending`: 待付款
- `paid`: 已付款  
- `expired`: 已過期
- `cancelled`: 已取消

---

## 💻 程式碼範例

### JavaScript
```javascript
async function createOrder(amount, orderId) {
  const response = await fetch('https://corba3c-production.up.railway.app/api/third-party/barcode/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your_api_key'
    },
    body: JSON.stringify({
      amount: amount,
      client_order_id: orderId
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // 顯示 QR Code
    document.getElementById('qr-code').src = result.data.barcode_url;
  }
}
```

### PHP
```php
function createOrder($amount, $orderId) {
    $url = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create';
    $data = json_encode([
        'amount' => $amount,
        'client_order_id' => $orderId
    ]);
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\nX-API-Key: your_api_key",
            'content' => $data
        ]
    ]);
    
    $result = file_get_contents($url, false, $context);
    return json_decode($result, true);
}
```

### Python
```python
import requests

def create_order(amount, order_id):
    url = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create'
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': 'your_api_key'
    }
    data = {
        'amount': amount,
        'client_order_id': order_id
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.json()
```

---

## 🔔 付款回調

當用戶完成付款時，系統會向您的 `callback_url` 發送通知：

```json
{
  "event": "payment.completed",
  "external_ref": "ORDER_001",
  "amount": 2990,
  "paid_at": "2025-08-13T16:30:00.000Z"
}
```

**處理範例**:
```javascript
app.post('/payment-callback', (req, res) => {
  const { event, external_ref, amount } = req.body;
  
  if (event === 'payment.completed') {
    // 更新您的訂單狀態
    updateOrderStatus(external_ref, 'paid');
    res.status(200).send('OK');
  }
});
```

---

## ⚠️ 注意事項

1. **API Key 安全**: 請勿在前端代碼中暴露API Key
2. **訂單編號**: `client_order_id` 必須唯一
3. **付款期限**: 條碼有效期為7天
4. **錯誤處理**: 請實施適當的錯誤重試機制
5. **測試環境**: 請先充分測試再上線

---

## 🆘 常見錯誤

| 錯誤碼 | 說明 | 解決方法 |
|--------|------|----------|
| 400 | 請求參數錯誤 | 檢查參數格式和必填項目 |
| 401 | API Key無效 | 檢查API Key是否正確 |
| 409 | 訂單編號已存在 | 使用不同的 client_order_id |
| 429 | 請求頻率超限 | 降低請求頻率 |

---

## 📞 技術支援

如需技術協助或申請API Key，請聯繫技術支援團隊。

**文檔版本**: v1.0 簡易版  
**更新日期**: 2025-08-14

---

© 2025 Corba 3C Shop. 保留所有權利。
