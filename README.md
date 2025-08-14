# 🛍️ Rick & Morty 3C E-commerce Website

一個以Rick & Morty為主題的現代化3C產品電商網站，採用明亮黃色×卡通黑色×俏皮灰色的設計風格，專為年輕消費者打造。

![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

## ✨ 核心功能

### 🛒 電商功能
- **完整產品管理** - 支援CRUD操作的管理面板
- **購物車系統** - 即時更新，持久化儲存
- **結帳流程** - 完整的訂單處理系統
- **用戶認證** - 註冊、登入、個人資料管理
- **搜索與篩選** - 強大的產品搜索和分類篩選

### 📱 響應式設計
- **移動端**: 2欄產品布局
- **平板**: 3欄產品布局  
- **桌面**: 4欄產品布局
- **頂部篩選器** - 桌面端篩選器置於頂部，提升用戶體驗

### 🎨 UI/UX 特色
- **3C卡通風格** - 適合年輕族群的視覺設計
- **明亮配色** - 黃色主色調搭配黑色與灰色
- **全寬按鈕** - 產品卡片底部的矩形加購按鈕
- **圖標優化** - 修復輸入框內圖標重疊問題
- **簡潔首頁** - 移除不必要的區塊，專注核心功能

## 🛠️ 技術架構

### 前端技術棧
```bash
⚛️  React 18           # 主要UI框架
🔷  TypeScript 5       # 類型安全
⚡  Vite              # 構建工具與開發服務器
🎨  Tailwind CSS      # 原子化CSS框架
🚀  React Router      # 客戶端路由
🎯  Lucide React      # 現代化圖標庫
🔥  React Hot Toast   # 通知系統
```

### 開發工具
```bash
📝  ESLint            # 代碼質量檢查
🎯  TypeScript        # 靜態類型檢查
📦  PNPM             # 包管理器
🔧  PostCSS          # CSS後處理器
```

### 存儲方案
- **LocalStorage** - 作為模擬後端數據庫
- **持久化購物車** - 瀏覽器重啟後數據保持
- **用戶會話管理** - 安全的認證狀態管理

## 🚀 快速開始

### 環境要求
- Node.js 18+
- PNPM 8+

### 安裝與運行
```bash
# 1. 克隆倉庫
git clone https://github.com/lovemage/3c-morty.git
cd 3c-morty

# 2. 安裝依賴
pnpm install

# 3. 啟動開發服務器
pnpm dev

# 4. 在瀏覽器打開
# http://localhost:5174
```

### 構建生產版本
```bash
# 構建
pnpm build

# 預覽構建結果
pnpm preview
```

## 📁 項目結構

```
rick-morty-ecommerce/
├── public/
│   └── images/
│       └── products/          # 產品圖片資源
├── src/
│   ├── components/            # 可重用組件
│   │   ├── Admin/            # 管理員組件
│   │   ├── Layout/           # 布局組件
│   │   └── Product/          # 產品相關組件
│   ├── contexts/             # React Context
│   │   ├── AuthContext.tsx  # 認證狀態管理
│   │   └── CartContext.tsx  # 購物車狀態管理
│   ├── hooks/                # 自定義Hook
│   ├── lib/                  # 工具函數和配置
│   │   ├── localStorage.ts   # 數據持久化
│   │   └── utils.ts         # 通用工具函數
│   ├── pages/                # 頁面組件
│   │   ├── Home.tsx         # 首頁
│   │   ├── Products.tsx     # 產品列表
│   │   ├── Search.tsx       # 搜索頁面
│   │   ├── Cart.tsx         # 購物車
│   │   ├── Checkout.tsx     # 結帳頁面
│   │   ├── Admin.tsx        # 管理面板
│   │   └── ...              # 其他頁面
│   └── index.css            # 全局樣式與主題變量
├── package.json
├── tailwind.config.js       # Tailwind配置
├── vite.config.ts           # Vite配置
└── tsconfig.json            # TypeScript配置
```

## 🎯 功能詳情

### 管理員功能
- **後台登入**: `admin` / `admin123`
- **產品管理**: 新增、編輯、刪除產品
- **庫存管理**: 即時更新產品庫存
- **圖片管理**: 支援產品圖片上傳和管理

### 用戶功能
- **瀏覽產品**: 分類瀏覽和搜索
- **購物車**: 加入購物車、調整數量
- **用戶註冊**: 創建和管理個人帳戶
- **訂單管理**: 查看訂單歷史和狀態

### 產品分類
- 🖱️ **滑鼠** - 有線/無線遊戲滑鼠
- ⌨️ **鍵盤** - 機械/無線鍵盤
- 🔌 **傳輸線** - USB-C/Lightning/HDMI線材
- 🔋 **行動電源** - 大容量移動電源
- 💻 **筆記型電腦** - 遊戲/商務筆電

## 🎨 設計特色

### 配色方案
- **主色**: 明亮黃色 (`#FCD34D`)
- **輔色**: 卡通黑色 (`#1F2937`)
- **點綴**: 俏皮灰色 (`#6B7280`)

### 響應式斷點
```css
/* 移動端 */
@media (max-width: 768px) {
  grid-cols-2  /* 2欄布局 */
}

/* 平板 */
@media (768px - 1024px) {
  md:grid-cols-3  /* 3欄布局 */
}

/* 桌面 */
@media (min-width: 1024px) {
  lg:grid-cols-4  /* 4欄布局 */
}
```

## 🔧 自定義配置

### 主題變量 (src/index.css)
```css
:root {
  --primary: 45 93% 47%;        /* 明亮黃色 */
  --secondary: 45 23% 93%;      /* 淺黃色 */
  --accent: 220 13% 28%;        /* 卡通黑 */
  --muted: 220 9% 46%;          /* 俏皮灰 */
}
```

### Tailwind擴展 (tailwind.config.js)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'rm-primary': 'hsl(var(--primary))',
        'rm-secondary': 'hsl(var(--secondary))',
        'rm-accent': 'hsl(var(--accent))',
      }
    }
  }
}
```

## 📱 兼容性

- ✅ **現代瀏覽器**: Chrome 90+, Firefox 88+, Safari 14+
- ✅ **移動設備**: iOS 14+, Android 10+
- ✅ **響應式設計**: 320px - 2560px 寬度支援

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 開發流程
1. Fork 本倉庫
2. 創建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 開啟 Pull Request

### 代碼規範
- 使用 TypeScript 進行類型檢查
- 遵循 ESLint 規則
- 組件使用 PascalCase 命名
- 文件使用 camelCase 命名

## 📄 許可證

本項目採用 MIT 許可證 - 詳見 [LICENSE](LICENSE) 文件

## 🔗 相關鏈接

- [🚀 線上演示](http://localhost:5174)
- [📖 React 文檔](https://react.dev)
- [⚡ Vite 文檔](https://vitejs.dev)
- [🎨 Tailwind CSS](https://tailwindcss.com)

---

**打造卓越的購物體驗 🛍️ | 用現代技術實現商業價值 💡**
