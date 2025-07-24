# Railway 部署指南

## 📁 **Volume Mount Path 配置**

### Railway 掛載結構
```
/app/                                    # Railway 工作目錄 (volume mount root)
├── package.json                        # Node.js 配置
├── nixpacks.toml                       # Railway 建構配置  
├── railway.json                        # Railway 部署設定
├── server/
│   ├── index.js                        # Express 服務器
│   └── database/
│       └── database.db                 # SQLite 數據庫文件
├── public/
│   └── images/                         # 靜態圖片資源 (34個產品圖片)
├── dist/                               # 構建後的前端文件
├── src/                                # React 源碼
└── node_modules/                       # 依賴包
```

### 關鍵路徑說明  
- **工作目錄**: `/app` (Railway 直接掛載 rick-morty-ecommerce git 倉庫)
- **數據庫路徑**: `/app/server/database/database.db`
- **靜態文件**: `/app/public/images/`  
- **前端構建**: `/app/dist/`
- **環境變數 PORT**: Railway 自動分配

## 🚀 Railway 部署步驟

### 1. 環境變數設定
在 Railway 專案中設定以下環境變數：

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://your-app-name.railway.app
```
**注意**: `PORT` 會由 Railway 自動設定，無需手動配置

### 2. 依賴項說明
- **better-sqlite3**: 使用 v9.6.0 以確保與 Railway 的 Node.js 環境相容
- **Node.js**: 支援 Node.js 18.x 和 20.x
- **Python**: nixpacks.toml 已配置自動安裝 Python（編譯原生模塊需要）

### 3. 專案結構
```
rick-morty-ecommerce/
├── server/           # 後端 API 服務
├── src/             # React 前端源碼
├── dist/            # 構建後的前端文件（生產環境）
├── public/          # 靜態資源
├── package.json     # 依賴和腳本
└── nixpacks.toml   # Railway 構建配置
```

### 4. 構建流程
1. `npm ci` - 安裝依賴
2. `npm run build` - 構建前端 (TypeScript + Vite)
3. `npm start` - 啟動生產服務器

### 5. 服務架構
- **單一服務器**: Express.js 服務器同時提供 API 和靜態文件
- **資料庫**: SQLite (better-sqlite3) 本地文件存儲
- **端口**: 使用 Railway 提供的 PORT 環境變數

### 6. 數據持久化 & Volume 配置
Railway 的 **Volume Mount Path** 為 `/app`，重要文件路徑：

```bash
# Railway 持久化存儲：
/app/server/database/database.db      # 主數據庫文件  
/app/server/database/database.db-shm  # SQLite 共享內存
/app/server/database/database.db-wal  # SQLite 預寫日誌

# 靜態資源路徑：
/app/public/images/                   # 產品圖片 (34個)
/app/dist/                           # 前端構建文件
```

### 7. 注意事項
- ✅ **Volume Mount**: rick-morty-ecommerce git 倉庫直接掛載到 `/app`
- ✅ **工作目錄**: 所有命令在 `/app` 執行  
- ✅ **數據持久化**: SQLite 數據庫文件永久保存在 Railway 持久存儲
- ✅ **靜態資源**: Express.js 提供 34個產品圖片和前端文件服務
- ✅ **SPA 路由**: 非 API 路由自動回傳 index.html
- ✅ **環境變數**: PORT 由 Railway 自動分配
- ⚠️  **WAL 模式**: SQLite 已啟用 WAL 模式提高併發性能 