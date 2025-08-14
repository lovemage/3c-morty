# Railway 部署指南

## 📋 部署步驟

### 1. 建立 Railway 專案
1. 前往 [Railway](https://railway.app)
2. 連接您的 GitHub 倉庫
3. 選擇 "Deploy from GitHub repo"

### 2. 添加 PostgreSQL 資料庫
1. 在 Railway 儀表板點擊 "Add Service"
2. 選擇 "Database" → "PostgreSQL"
3. Railway 會自動設定 `DATABASE_URL` 環境變數

### 3. 設定環境變數
在 Railway 專案設定中添加以下環境變數：

```bash
# 基本設定
NODE_ENV=production
PORT=3001

# 綠界金流設定
ECPAY_MERCHANT_ID=你的商店代碼
ECPAY_HASH_KEY=你的金鑰
ECPAY_HASH_IV=你的向量

# 回調網址設定 (替換為你的 Railway 域名)
ECPAY_RETURN_URL=https://your-app.railway.app/api/third-party/ecpay/callback
ECPAY_PAYMENT_INFO_URL=https://your-app.railway.app/api/third-party/ecpay/payment-info

# 前端網址 (如果需要 CORS 設定)
FRONTEND_URL=https://your-app.railway.app
```

### 4. 資料庫自動切換
系統會自動檢測環境：
- 🏠 **本地開發**: 使用 SQLite (`server/database/database.db`)
- 🚀 **Railway 生產**: 使用 PostgreSQL (`DATABASE_URL`)

### 5. 部署確認
1. 檢查 Railway 日誌確認部署成功
2. 訪問 `https://your-app.railway.app/api/health` 確認 API 運作
3. 檢查資料庫是否初始化完成

## 🔄 資料遷移
如果需要從本地 SQLite 遷移資料到 Railway PostgreSQL：

1. 匯出本地資料 (如果需要)
2. 使用 Railway 提供的資料庫連線資訊手動匯入

## ⚠️ 注意事項
- Railway PostgreSQL 是持久化的，資料不會在部署時消失
- 確保綠界金流的回調網址指向正確的 Railway 域名
- 生產環境會自動使用 PostgreSQL，無需手動設定
- 每次部署後資料庫結構會自動更新，但資料會保留

## 📞 測試 API
部署完成後，可使用以下命令測試第三方 API：

```bash
curl -X POST https://your-app.railway.app/api/third-party/barcode/create \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "amount": 1000,
    "product_info": "測試商品",
    "client_order_id": "TEST-001",
    "store_type": "7ELEVEN"
  }'
```

## 🛠️ 故障排除
- 檢查 Railway 日誌查看錯誤訊息
- 確認環境變數設定正確
- 驗證 PostgreSQL 資料庫連線狀態