# 修復 403 錯誤 - 商店直接下單

## 🚨 問題分析
前端調用 `POST /api/orders` 時遇到 403 錯誤，原因是該端點需要用戶登入認證（JWT token）。

## ✅ 解決方案

### 方案1: 使用新的訪客下單 API（推薦）

我已經新增了 `POST /api/orders/guest` 端點，**無需認證**即可下單。

**前端修改**：
將原本的 API 調用：
```javascript
// 原本（會 403 錯誤）
fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
})
```

改為：
```javascript
// 修正後（無需認證）
fetch('/api/orders/guest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
})
```

### 方案2: 添加認證 token

如果要繼續使用原本的 `/api/orders` 端點，需要添加認證：

```javascript
fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}` // 需要先登入
  },
  body: JSON.stringify(orderData)
})
```

## 🧪 測試確認

新的訪客 API 已測試成功：
```bash
✅ 訪客下單測試成功！
🆔 訂單 ID: 3
🏪 商家交易號: GUEST1755097833915
💰 總金額: NT$ 2990
💳 付款方式: BARCODE
```

## 📝 建議

**推薦使用方案1**（訪客 API），因為：
- ✅ 無需用戶登入
- ✅ 適合商店直接下單的場景
- ✅ 已經過測試驗證
- ✅ 會自動創建訪客用戶記錄

只需要前端將 API 路徑從 `/api/orders` 改為 `/api/orders/guest` 即可。