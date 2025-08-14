# 第四方網站條碼付款API文檔

## 概述

本API提供給第四方網站使用的綠界便利店條碼付款服務。第四方網站可以通過API創建訂單並獲取付款條碼，用戶掃碼完成付款後系統會自動回調通知。

## 認證

所有API請求需要在Header中提供API Key：
```
X-API-Key: your_api_key
```

## Base URL
```
Production: https://corba3c-production.up.railway.app/api/third-party
Development: http://localhost:3001/api/third-party
```

## API端點

### 1. 創建條碼付款訂單

**端點**: `POST /barcode/create`

**描述**: 為第四方網站創建便利店條碼付款訂單

**請求參數**:
```json
{
  "amount": 3990,
  "client_order_id": "ORDER_2024_001",
  "callback_url": "https://your-website.com/payment-callback"
}
```

**參數說明**:
- `amount` (number, 必須): 訂單金額，範圍1-6000元
- `client_order_id` (string, 必須): 第四方網站的訂單編號（唯一）
- `callback_url` (string, 可選): 付款完成回調URL

**自動生成參數**:
- `product_info`: 自動生成為 "3C商品一組 - NT${amount}"
- `store_type`: 預設為 "7ELEVEN" (7-ELEVEN便利商店)
- `customer_info`: 由用戶後續在付款頁面填寫

**成功回應**:
```json
{
  "success": true,
  "data": {
    "order_id": 6,
    "client_order_id": "ORDER_2024_001",
    "merchant_trade_no": "TPA1755100856990006",
    "store_type": "7ELEVEN",
    "amount": 3990,
    "barcode": "|ES|K3C0ZJ608Omea5qgk4",
    "barcode_url": "https://payment-stage.ecpay.com.tw/SP/CreateQRCode?qdata=%7CES%7CK3C0ZJ608Omea5qgk4",
    "expire_date": "2025-08-20T16:00:56.990Z",
    "customer_info_url": "https://corba3c-production.up.railway.app/customer-info/6"
  }
}
```

**回應說明**:
- `order_id`: 系統內部訂單ID
- `client_order_id`: 第四方網站訂單編號
- `merchant_trade_no`: 綠界商家交易編號
- `barcode`: 付款條碼數據
- `barcode_url`: 條碼QR Code圖片URL
- `expire_date`: 付款到期時間（7天後）
- `customer_info_url`: 客戶資料填寫頁面URL

### 2. 查詢訂單狀態

**端點**: `GET /orders/{order_id}/status`

**描述**: 查詢特定訂單的付款狀態

**回應**:
```json
{
  "success": true,
  "data": {
    "order_id": 6,
    "external_order_id": "ORDER_2024_001",
    "status": "pending",
    "amount": 3990,
    "product_info": "3C商品一組 - NT$3990",
    "merchant_trade_no": "TPA1755100856990006",
    "payment_date": null,
    "payment_type": "BARCODE",
    "paid_at": null,
    "expire_date": "2025-08-20T16:00:56.990Z",
    "created_at": "2025-08-13 16:00:56"
  }
}
```

**狀態說明**:
- `pending`: 等待付款
- `paid`: 已付款
- `expired`: 已過期
- `cancelled`: 已取消

### 3. 查詢訂單列表

**端點**: `GET /orders`

**查詢參數**:
- `status` (可選): 篩選訂單狀態
- `page` (可選): 頁碼，預設為1
- `limit` (可選): 每頁筆數，預設為20

**範例**: `GET /orders?status=paid&page=1&limit=10`

## 付款回調

當用戶完成付款時，系統會向您提供的`callback_url`發送POST請求：

**回調格式**:
```json
{
  "event": "payment.completed",
  "payment_id": "PAY20250813006",
  "external_ref": "ORDER_2024_001",
  "amount": 3990,
  "paid_at": "2025-08-13T16:30:00.000Z",
  "signature": "abc123..."
}
```

## 錯誤處理

**錯誤回應格式**:
```json
{
  "error": true,
  "message": "錯誤描述"
}
```

**常見錯誤碼**:
- `400`: 請求參數錯誤
- `401`: API Key無效
- `409`: 訂單編號已存在
- `429`: 請求頻率超限
- `500`: 服務器內部錯誤

## 使用流程

1. **創建訂單**: 調用 `POST /barcode/create` 創建付款訂單
2. **顯示條碼**: 使用返回的 `barcode_url` 顯示QR Code給用戶
3. **用戶付款**: 用戶到便利店掃碼付款
4. **接收回調**: 系統自動發送付款完成通知到您的 `callback_url`
5. **確認狀態**: 可隨時調用 `GET /orders/{order_id}/status` 確認付款狀態

## API Key 申請和管理

### 正式環境 API Key
請聯繫技術支援團隊申請正式環境的API Key。每個API Key包含以下資訊：
- **Key名稱**: 用於識別的友好名稱
- **客戶端系統**: 您的系統標識符
- **速率限制**: 每小時請求上限
- **IP限制**: (可選) 限制特定IP才能使用

### 測試環境 API Key
**測試API Key**: `test-api-key-twa4fsmmaw`

**測試用法**:
```bash
curl -X POST http://localhost:3001/api/third-party/barcode/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-twa4fsmmaw" \
  -d '{
    "amount": 3990,
    "client_order_id": "TEST_001"
  }'
```

### 生產環境使用範例
```bash
curl -X POST https://corba3c-production.up.railway.app/api/third-party/barcode/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_production_api_key" \
  -d '{
    "amount": 2990,
    "client_order_id": "PROD_ORDER_001",
    "callback_url": "https://your-website.com/payment-callback"
  }'
```

## 程式碼範例

### JavaScript (Node.js)
```javascript
const createOrder = async () => {
  try {
    const response = await fetch('https://corba3c-production.up.railway.app/api/third-party/barcode/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your_api_key'
      },
      body: JSON.stringify({
        amount: 2990,
        client_order_id: `ORDER_${Date.now()}`,
        callback_url: 'https://your-website.com/payment-callback'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('訂單創建成功:', result.data);
      // 顯示 QR Code: result.data.barcode_url
    } else {
      console.error('創建失敗:', result.message);
    }
  } catch (error) {
    console.error('請求錯誤:', error);
  }
};
```

### PHP
```php
<?php
function createOrder() {
    $url = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create';
    $data = [
        'amount' => 2990,
        'client_order_id' => 'ORDER_' . time(),
        'callback_url' => 'https://your-website.com/payment-callback'
    ];
    
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => [
                'Content-Type: application/json',
                'X-API-Key: your_api_key'
            ],
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    $response = json_decode($result, true);
    
    if ($response['success']) {
        echo '訂單創建成功: ' . $response['data']['order_id'];
        // 顯示 QR Code: $response['data']['barcode_url']
    } else {
        echo '創建失敗: ' . $response['message'];
    }
}
?>
```

### Python
```python
import requests
import json
import time

def create_order():
    url = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create'
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': 'your_api_key'
    }
    data = {
        'amount': 2990,
        'client_order_id': f'ORDER_{int(time.time())}',
        'callback_url': 'https://your-website.com/payment-callback'
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        result = response.json()
        
        if result['success']:
            print(f"訂單創建成功: {result['data']['order_id']}")
            # 顯示 QR Code: result['data']['barcode_url']
        else:
            print(f"創建失敗: {result['message']}")
            
    except Exception as e:
        print(f"請求錯誤: {e}")

create_order()
```

## 回調處理範例

### Node.js Express
```javascript
app.post('/payment-callback', (req, res) => {
  const { event, payment_id, external_ref, amount, paid_at, signature } = req.body;
  
  if (event === 'payment.completed') {
    // 驗證簽名 (建議實施)
    // if (!verifySignature(req.body, signature)) {
    //   return res.status(400).send('Invalid signature');
    // }
    
    // 處理付款完成邏輯
    console.log(`訂單 ${external_ref} 付款完成，金額: ${amount}`);
    
    // 更新您的訂單狀態
    // updateOrderStatus(external_ref, 'paid');
    
    res.status(200).send('OK');
  } else {
    res.status(400).send('Unknown event');
  }
});
```

### PHP
```php
<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input['event'] === 'payment.completed') {
        // 驗證簽名 (建議實施)
        // if (!verifySignature($input, $input['signature'])) {
        //     http_response_code(400);
        //     echo 'Invalid signature';
        //     exit;
        // }
        
        $order_id = $input['external_ref'];
        $amount = $input['amount'];
        
        // 處理付款完成邏輯
        error_log("訂單 {$order_id} 付款完成，金額: {$amount}");
        
        // 更新您的訂單狀態
        // updateOrderStatus($order_id, 'paid');
        
        http_response_code(200);
        echo 'OK';
    } else {
        http_response_code(400);
        echo 'Unknown event';
    }
}
?>
```

## 技術規格

### 請求限制
- **Content-Type**: application/json
- **編碼**: UTF-8
- **請求大小**: 最大 1MB
- **超時時間**: 30秒

### 速率限制
- **測試環境**: 100 請求/小時
- **生產環境**: 依API Key設定（通常 1000-5000 請求/小時）
- **超限處理**: 返回 HTTP 429 狀態碼

### 安全性
- **HTTPS**: 生產環境強制使用 HTTPS
- **API Key**: 請妥善保管，定期更換
- **IP白名單**: 建議設定允許的IP範圍
- **簽名驗證**: 回調請求建議實施簽名驗證

## 注意事項

1. **API Key安全**: 請妥善保管您的API Key，不要在前端代碼中暴露
2. **訂單編號唯一性**: `client_order_id` 必須在您的系統中保持唯一
3. **付款期限**: 條碼付款期限為7天，過期後需重新創建訂單
4. **回調驗證**: 建議驗證回調請求中的簽名以確保安全性
5. **錯誤重試**: 網路錯誤時請實施適當的重試機制
6. **測試環境**: 請先在測試環境中充分測試再上線
7. **監控**: 建議實施日誌記錄和錯誤監控
8. **備援**: 建議實施備援機制處理API暫時不可用的情況

## 常見問題 (FAQ)

### Q: 如何獲得正式環境的API Key？
A: 請聯繫技術支援團隊，提供您的公司資訊和預期使用量，我們將為您配置專屬的API Key。

### Q: API Key有使用期限嗎？
A: API Key本身沒有過期時間，但建議定期更換以確保安全性。

### Q: 可以設定IP白名單嗎？
A: 是的，可以在申請API Key時指定允許使用的IP範圍。

### Q: 付款失敗時會收到通知嗎？
A: 目前只在付款成功時發送回調通知。付款失敗可通過查詢訂單狀態API獲得。

### Q: 支援退款功能嗎？
A: 目前API不直接支援退款，如需退款請聯繫客服處理。

### Q: 如何處理重複的回調通知？
A: 建議在您的系統中實施冪等性檢查，確保同一筆訂單的付款回調只處理一次。

## 支援與聯繫

如有技術問題或需要協助，請聯繫：

- **技術支援**: [聯繫資訊]
- **文檔更新**: 2025-08-13
- **API版本**: v1.0

---

© 2025 Corba 3C Shop. 保留所有權利。