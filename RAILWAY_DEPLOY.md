# Railway 部署指南

## 🚀 Railway 部署步驟

### 1. 環境變數設定
在 Railway 專案中設定以下環境變數：

```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://your-app-name.railway.app
```

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

### 6. 注意事項
- Railway 會自動偵測並使用 `npm start` 腳本
- 靜態文件在生產環境中由 Express 提供服務
- SPA 路由已正確配置，非 API 路由會回傳 index.html 