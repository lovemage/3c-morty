#!/bin/bash

# Railway 部署腳本 - 確認目錄結構正確

echo "🔍 確認當前目錄結構："
echo "當前工作目錄: $(pwd)"

echo "📁 檢查根目錄文件："
ls -la

echo "📦 檢查 package.json："
if [ -f "package.json" ]; then
    echo "✅ package.json 存在於根目錄"
    head -5 package.json
else
    echo "❌ package.json 未找到"
fi

echo "🔧 檢查服務器文件："
if [ -d "server" ]; then
    echo "✅ server 目錄存在"
    ls -la server/
else
    echo "❌ server 目錄未找到"
fi

echo "🎨 檢查前端源碼："
if [ -d "src" ]; then
    echo "✅ src 目錄存在"
    ls -la src/
else
    echo "❌ src 目錄未找到"
fi

echo "📸 檢查靜態資源："
if [ -d "public" ]; then
    echo "✅ public 目錄存在"
    ls -la public/
else
    echo "❌ public 目錄未找到"
fi

echo "🚀 準備啟動 Node.js 應用..."
exec npm start 