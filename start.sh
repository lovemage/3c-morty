#!/bin/bash

echo "🚀 Railway 啟動腳本"
echo "當前工作目錄: $(pwd)"
echo "檢查 /app 目錄："
ls -la /app/ 2>/dev/null || echo "/app 目錄不存在"

# 如果 /app 是空的但當前目錄有文件，複製過去
if [ ! -f "/app/package.json" ] && [ -f "package.json" ]; then
    echo "🔧 複製項目文件到 /app 卷..."
    cp -r . /app/
    echo "✅ 文件已複製到 /app"
fi

# 切換到 /app 目錄
cd /app

echo "📍 最終工作目錄: $(pwd)"
echo "📦 檢查 package.json："
ls -la package.json

echo "🌟 啟動 Node.js 應用..."
exec npm start 