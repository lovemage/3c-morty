#!/bin/bash

echo "🚀 Railway 生產環境啟動"
echo "當前工作目錄: $(pwd)"

# 確認在 /app 目錄
if [ "$(pwd)" != "/app" ]; then
    echo "🔧 切換到 /app 目錄..."
    cd /app
fi

echo "📍 工作目錄: $(pwd)"
echo "📦 檢查必要文件："
ls -la package.json || echo "❌ package.json 不存在"
ls -la server/index.js || echo "❌ server/index.js 不存在"

echo "🔗 檢查環境變數："
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

echo "🌟 啟動 Node.js 應用..."
exec npm start 