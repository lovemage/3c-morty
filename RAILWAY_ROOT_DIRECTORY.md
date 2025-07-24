# Railway 根目錄配置說明

## ⚠️ 重要：根目錄已更改

**舊結構（已廢棄）:**
```
/app/rick-morty-ecommerce/  ❌ 不再使用
```

**新結構（當前）:**
```
/app/  ✅ 項目根目錄
├── package.json
├── server/
├── src/
├── public/
└── 所有項目文件
```

## 🔧 Railway 設定檢查

如果 Railway 顯示錯誤 "Could not find root directory: rick-morty-ecommerce"，請檢查：

### 1. Railway Dashboard 設定
- 前往 Railway Project Settings
- 檢查 "Root Directory" 設定
- 確保設定為 `.` 或留空（使用默認根目錄）
- **不要** 設定為 `rick-morty-ecommerce`

### 2. 環境變數檢查
確保沒有設定以下變數：
- `ROOT_DIR=rick-morty-ecommerce` ❌
- `PROJECT_ROOT=rick-morty-ecommerce` ❌

### 3. 部署配置
當前配置文件：
- ✅ `Procfile`: `web: npm start`
- ✅ `nixpacks.toml`: 明確指定 Node.js
- ✅ `railway.json`: 正確的構建配置
- ✅ `package.json`: 在根目錄

## 🚀 正確的部署流程

1. Railway 掛載倉庫到 `/app`
2. 找到 `/app/package.json` ✅
3. 執行 `npm ci` 安裝依賴
4. 執行 `npm run build` 構建前端
5. 執行 `npm start` 啟動服務器

## 📞 如果仍有問題

如果 Railway 仍然尋找 `rick-morty-ecommerce` 目錄：
1. 在 Railway Dashboard 中完全重新創建部署
2. 或聯繫 Railway 支援清除緩存設定
3. 確認 Git 倉庫中沒有 `rick-morty-ecommerce` 目錄

**當前狀態：所有文件已移至根目錄，不再有子目錄結構。** 