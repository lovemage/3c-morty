# 生產環境部署檢查清單

## 部署前檢查 ✅

### 1. 環境設定
- [ ] 設定 `NODE_ENV=production`
- [ ] 設定強密碼的 `JWT_SECRET`
- [ ] 確認 ECPay 商戶資訊正確
- [ ] 設定正確的回調 URL (HTTPS)
- [ ] 配置 `BASE_URL` 為正式域名
- [ ] 設定 CORS 允許的來源網域

### 2. 安全性設定
- [ ] 啟用 HTTPS 憑證
- [ ] 配置防火牆規則
- [ ] 設定適當的 API 費率限制
- [ ] 檢查 API Key 安全性
- [ ] 啟用安全標頭 (CSP, HSTS 等)

### 3. ECPay 設定
- [ ] 在 ECPay 後台設定回調 URL
- [ ] 驗證商戶資訊 (請聯絡管理員確認)
- [ ] 測試付款流程
- [ ] 確認 CheckMacValue 計算正確

### 4. 資料庫設定
- [ ] 設定資料庫備份策略
- [ ] 確認資料庫檔案權限
- [ ] 測試資料庫連線
- [ ] 建立索引優化

### 5. 監控設定
- [ ] 設定日誌輪轉
- [ ] 配置錯誤監控
- [ ] 設定效能監控
- [ ] 配置告警通知

## 部署步驟

### 1. 程式碼部署
```bash
# 1. 上傳程式碼到服務器
git clone <your-repo> 
cd your-project

# 2. 安裝依賴
npm install --production

# 3. 建置前端 (如果需要)
npm run build

# 4. 設定環境變數
cp .env.example .env
# 編輯 .env 檔案設定正確的值
```

### 2. 服務設定
```bash
# 1. 建立系統服務 (systemd)
sudo cp deployment/app.service /etc/systemd/system/
sudo systemctl enable app
sudo systemctl start app

# 2. 設定 Nginx 反向代理
sudo cp deployment/nginx.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 3. 資料庫初始化
```bash
# 系統會自動初始化資料庫
# 檢查日誌確認初始化成功
sudo journalctl -u app -f
```

## 部署後驗證

### 1. 基本功能測試
```bash
# 健康檢查
curl https://your-domain.com/api/health

# API Key 測試
curl -X GET https://your-domain.com/api/third-party/orders \
  -H "X-API-Key: YOUR_PRODUCTION_API_KEY"
```

### 2. 整合測試
```bash
# 執行完整整合測試
node integration-test.js
```

### 3. ECPay 測試
- [ ] 建立測試訂單
- [ ] 完成超商付款流程
- [ ] 確認回調正常運作
- [ ] 驗證客戶資料收集

## 監控和維護

### 1. 日常監控項目
- API 回應時間
- 訂單建立成功率  
- 付款完成率
- 錯誤率
- 系統資源使用率

### 2. 定期維護
- [ ] 每日檢查系統日誌
- [ ] 每週檢查效能指標
- [ ] 每月備份資料庫
- [ ] 每季安全更新

### 3. 告警設定
- 系統錯誤率超過 5%
- API 回應時間超過 3 秒
- 付款失敗率超過 10%
- 磁碟空間使用率超過 80%

## 故障處理

### 1. 常見問題
- ECPay 回調失敗 → 檢查 URL 可訪問性
- API Key 驗證失敗 → 檢查資料庫和設定
- 訂單狀態異常 → 檢查付款流程
- 效能問題 → 檢查資料庫和索引

### 2. 緊急恢復
- 備份資料庫位置: `/backup/database/`
- 設定檔備份: `/backup/config/`
- 日誌位置: `/var/log/app/`

## 聯絡資訊

- 技術支援: tech@company.com
- 緊急聯絡: emergency@company.com
- ECPay 技術支援: https://www.ecpay.com.tw/

---

**部署完成檢查**: 當所有項目都已勾選時，系統即可投入生產使用。