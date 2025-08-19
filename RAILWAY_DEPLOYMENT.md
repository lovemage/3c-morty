# 第三方金流API - 廠商接入文件

## 🎯 服務說明
本API提供便利商店條碼付款服務，廠商只需要提供訂單金額和商品資訊，我們負責處理所有金流相關的技術細節。

## 🔑 API Key申請
請聯繫我們的客服團隊申請專屬的API Key：
- 📧 Email: support@your-company.com
- 📱 客服專線: 0800-123-456

## 🚀 快速開始

### 1. 創建條碼訂單

**端點**: `POST /api/third-party/barcode/create`

**Headers**:
```
Content-Type: application/json
X-API-KEY: 您的專屬API Key
```

**請求參數**:
```json
{
  "amount": 299,                    // 付款金額 (必填, 1-6000之間)
  "client_order_id": "ORDER-001",   // 您的訂單編號 (必填, 唯一值)
  "product_info": "商品名稱",        // 商品描述 (選填)
  "callback_url": "https://your-domain.com/payment-callback",  // 付款通知網址 (選填)
  "store_type": "7ELEVEN"           // 便利商店類型 (選填: 7ELEVEN, FAMILY, HILIFE, OKMART)
}
```

**回應範例**:
```json
{
  "success": true,
  "data": {
    "order_id": 123,
    "client_order_id": "ORDER-001",
    "merchant_trade_no": "TPA12345678",
    "amount": 299,
    "expire_date": "2025-08-26T07:14:09.699Z",
    "barcode_status": "generated",
    "barcode_page_url": "https://api.your-service.com/orders/123/barcode/page",
    "customer_info_url": "https://api.your-service.com/customer-info/123",
    "message": "訂單建立成功"
  }
}
```

### 2. 查詢訂單狀態

**端點**: `GET /api/third-party/orders/{order_id}/barcode`

**Headers**:
```
X-API-KEY: 您的專屬API Key
```

**回應範例**:
```json
{
  "success": true,
  "data": {
    "order_id": 123,
    "client_order_id": "ORDER-001",
    "amount": 299,
    "barcode_status": "generated",
    "order_status": "pending",
    "barcode_page_url": "https://api.your-service.com/orders/123/barcode/page",
    "expire_date": "2025-08-26T07:14:09.699Z",
    "created_at": "2025-08-19T07:14:09.546Z",
    "updated_at": "2025-08-19T07:14:09.796Z",
    "message": "條碼已生成，可至便利商店付款"
  }
}
```

## 📱 條碼展示方式

### 方式一：直接跳轉 (推薦)
```javascript
// 將用戶導向條碼頁面
window.location.href = response.data.barcode_page_url;
```

### 方式二：嵌入iframe
```html
<iframe 
  src="https://api.your-service.com/orders/123/barcode/page?format=iframe" 
  width="100%" 
  height="600"
  style="border: none;">
</iframe>
```

### 方式三：彈出視窗
```javascript
window.open(
  response.data.barcode_page_url, 
  'barcode-payment', 
  'width=400,height=600,scrollbars=yes'
);
```

## 🔔 付款通知機制

當顧客完成付款後，系統會向您的`callback_url`發送POST通知：

**通知格式**:
```json
{
  "event": "payment.completed",
  "payment_id": "PAY20250819123",
  "external_ref": "ORDER-001",
  "amount": 299,
  "paid_at": "2025-08-19T08:30:00.000Z",
  "signature": "abc123..."
}
```

**驗證簽名**:
```javascript
// 計算簽名 (使用您的API Key)
const data = payment_id + external_ref + amount + paid_at;
const signature = crypto.createHash('sha256')
  .update(data + your_api_key)
  .digest('hex');
```

## 📊 訂單狀態說明

| 狀態 | 說明 |
|------|------|
| `pending` | 待付款 - 條碼已生成，等待顧客付款 |
| `paid` | 已付款 - 顾客已完成付款 |
| `expired` | 已過期 - 超過付款期限 |
| `cancelled` | 已取消 - 訂單已被取消 |

## 💡 最佳實踐

### 1. 輪詢檢查付款狀態
```javascript
async function checkPaymentStatus(orderId) {
  const response = await fetch(`/api/third-party/orders/${orderId}/barcode`, {
    headers: {
      'X-API-KEY': 'your-api-key'
    }
  });
  
  const result = await response.json();
  
  if (result.data.order_status === 'paid') {
    // 付款完成，更新您的系統
    console.log('付款成功！');
  }
}

// 每30秒檢查一次
setInterval(() => checkPaymentStatus(123), 30000);
```

### 2. 錯誤處理
```javascript
try {
  const response = await fetch('/api/third-party/barcode/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': 'your-api-key'
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '請求失敗');
  }

  const result = await response.json();
  // 處理成功回應
  
} catch (error) {
  console.error('創建訂單失敗:', error.message);
  // 顯示錯誤訊息給用戶
}
```

## 🛡️ 安全注意事項

1. **保護API Key**: 
   - 🚫 不要在前端程式碼中暴露API Key
   - ✅ 在服務器端調用我們的API
   - 🔄 定期更新API Key

2. **驗證回調**: 
   - ✅ 必須驗證付款通知的簽名
   - ✅ 檢查訂單金額和狀態
   - 🔒 使用HTTPS接收通知

3. **訂單管理**:
   - ✅ 確保client_order_id的唯一性
   - ✅ 設定合理的付款超時時間
   - 📝 記錄所有API調用日誌

## 🧪 測試環境

我們提供測試頁面供您測試整合：
- 🌐 測試頁面：`https://api.your-service.com/test-barcode`
- 🔧 API測試：使用任何HTTP工具 (如Postman)
- 📞 技術支援：integration@your-company.com

## 📈 用量監控

您可以通過以下方式監控API使用情況：
- 📊 每日用量報告
- 🚨 異常使用通知
- 📞 24/7技術支援

## 🆘 常見問題

**Q: 條碼多久會過期？**
A: 條碼的有效期限為7天，過期後需要重新創建訂單。

**Q: 支援哪些便利商店？**
A: 支援7-ELEVEN、全家、萊爾富、OK mart等主要便利商店。

**Q: 如何處理重複的訂單？**
A: 請確保每個`client_order_id`都是唯一的，系統會拒絕重複的訂單號。

**Q: 付款通知延遲怎麼辦？**
A: 通常付款通知會在顧客完成付款後30秒內送達，建議實作輪詢機制作為備用。

---

📧 **技術支援**: tech-support@your-company.com  
📱 **客服專線**: 0800-123-456  
🌐 **開發者文檔**: https://docs.your-service.com