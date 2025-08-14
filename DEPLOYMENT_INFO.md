# Rick and Morty 電商應用 - Railway 部署信息

## 🚀 部署狀態

### **✅ 部署成功**
- **部署平台**: Railway Cloud Platform
- **部署時間**: 2025年1月24日
- **狀態**: 線上運行中

## 🌐 訪問信息

### **公開網址**
- **主要網址**: [https://corba3c-production.up.railway.app/](https://corba3c-production.up.railway.app/)
- **內部端口**: 8080
- **外部端口**: 自動映射 (Railway 管理)

### **API 端點**
- **健康檢查**: https://corba3c-production.up.railway.app/api/health
- **產品 API**: https://corba3c-production.up.railway.app/api/products
- **分類 API**: https://corba3c-production.up.railway.app/api/categories
- **用戶認證**: https://corba3c-production.up.railway.app/api/auth
- **購物車**: https://corba3c-production.up.railway.app/api/cart
- **訂單**: https://corba3c-production.up.railway.app/api/orders

## 🔧 技術配置

### **運行環境**
- **Node.js**: v20.19.4
- **運行模式**: Production
- **包管理**: npm
- **模組系統**: ESM (ES Modules)

### **主要依賴**
```json
{
  "express": "^4.18.2",
  "react": "^18.2.0",
  "better-sqlite3": "^9.6.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "dotenv": "^16.6.1",
  "helmet": "^7.2.0"
}
```

### **環境變數**
- ✅ `NODE_ENV`: production
- ✅ `JWT_SECRET`: 已設置
- ✅ `PORT`: 8080 (Railway 自動分配)

## 📁 專案結構

```
project/
├── server/           # 後端 API 服務
│   ├── index.js     # 主要服務器文件
│   ├── database/    # SQLite 數據庫
│   └── routes/      # API 路由
├── src/             # React 前端源碼
├── dist/            # 構建輸出 (生產環境)
├── public/          # 靜態資源
│   └── images/      # 產品圖片
└── package.json     # 專案配置
```

## 🗄️ 數據庫信息

### **數據庫類型**
- **類型**: SQLite
- **位置**: `/app/server/database/database.db`
- **持久化**: 建議添加卷掛載
- **產品數量**: 34個產品
- **分類**: 鼠標、鍵盤、電纜、充電寶、筆電、榨汁機等

## 🔒 安全配置

### **安全中間件**
- ✅ **Helmet**: HTTP 安全標頭
- ✅ **CORS**: 跨域請求配置
- ✅ **JWT**: 用戶認證加密
- ✅ **bcrypt**: 密碼雜湊加密

### **生產環境優化**
- ✅ 靜態文件服務
- ✅ SPA 路由支援
- ✅ 錯誤處理中間件
- ✅ 優雅關閉處理

## 📊 功能特性

### **前端功能**
- 🏠 首頁展示
- 🛍️ 產品瀏覽
- 📂 分類篩選
- 🔍 產品搜索
- 🛒 購物車管理
- 👤 用戶註冊/登入
- 📱 響應式設計

### **後端 API**
- RESTful API 設計
- JWT 身份驗證
- 數據庫 CRUD 操作
- 圖片靜態服務
- 健康狀態監控

## 🚀 部署歷程

### **解決的技術問題**
1. ✅ **卷配置問題** - 移除持久化卷，使用標準文件系統
2. ✅ **依賴缺失** - 添加 dotenv 和 helmet 包
3. ✅ **package-lock.json 同步** - 更新依賴鎖定文件
4. ✅ **ESM 兼容性** - 修復 require() 在 ES 模組中的錯誤
5. ✅ **環境變數配置** - 設置 NODE_ENV 和 JWT_SECRET

### **構建配置**
- **Builder**: Nixpacks
- **構建命令**: `npm run build`
- **啟動命令**: `npm start`
- **根目錄**: 專案根目錄

## 📞 支援信息

### **技術支援**
- **平台**: Railway.app
- **監控**: 內建健康檢查
- **日誌**: Railway Dashboard 查看
- **重啟**: 自動重啟機制

### **維護說明**
- **代碼更新**: Git push 自動部署
- **環境變數**: Railway Dashboard 管理
- **數據備份**: 建議添加數據庫卷掛載

---

**部署完成時間**: 2025年1月24日  
**最後更新**: 修復 ESM require 錯誤  
**狀態**: ✅ 線上穩定運行 