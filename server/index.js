import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import categoryRoutes from './routes/categories.js';
import thirdPartyRoutes from './routes/third-party.js';
import customerInfoRoutes from './routes/customer-info.js';
import adminApiRoutes from './routes/admin-api.js';
import paymentServiceRoutes from './routes/payment-service.js';

// Database - 自動選擇 SQLite 或 PostgreSQL
import { initializeDatabase } from './database/database-adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || true) // 允許所有來源如果沒有設定 FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for product images
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Serve static files from dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/third-party', thirdPartyRoutes);
app.use('/api/customer-info', customerInfoRoutes);
app.use('/api/admin', adminApiRoutes);
app.use('/api/payment', paymentServiceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Corba 3C Shop API is running!',
    timestamp: new Date().toISOString()
  });
});

// 條碼網頁測試頁面
app.get('/test-barcode', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>條碼網頁測試 - 第三方API服務</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft JhengHei', sans-serif; 
            max-width: 800px; 
            margin: 30px auto; 
            padding: 20px; 
            background: #f8f9fa;
            line-height: 1.6;
        }
        .container { 
            background: white; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 20px;
        }
        h1 { 
            color: #2c3e50; 
            margin-bottom: 10px;
        }
        .subtitle {
            color: #7f8c8d;
            font-size: 18px;
            margin: 0;
        }
        .section {
            margin: 30px 0;
            padding: 25px;
            border: 1px solid #dee2e6;
            border-radius: 10px;
            background: #f8f9fa;
        }
        .section h3 {
            color: #495057;
            margin-top: 0;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
        }
        .test-btn { 
            display: inline-block; 
            background: #28a745; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 10px 15px 10px 0; 
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s;
            border: none;
            cursor: pointer;
        }
        .test-btn:hover { 
            background: #218838; 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .test-btn.secondary {
            background: #6c757d;
        }
        .test-btn.secondary:hover {
            background: #545b62;
        }
        .custom-form { 
            border: 2px dashed #28a745; 
            padding: 25px; 
            border-radius: 10px; 
            margin-top: 20px;
            background: white;
        }
        input[type="number"] { 
            width: 200px; 
            padding: 12px; 
            border: 2px solid #ced4da; 
            border-radius: 6px; 
            margin: 10px;
            font-size: 16px;
        }
        input[type="number"]:focus {
            border-color: #28a745;
            outline: none;
            box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #ffc107;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #17a2b8;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .feature-list li:before {
            content: "✅ ";
            margin-right: 10px;
        }
        .url-example {
            background: #e9ecef;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            margin: 10px 0;
            word-break: break-all;
        }
        .loading-section {
            text-align: center;
            padding: 40px;
            background: #f8f9fa;
            border-radius: 10px;
            margin: 20px 0;
        }
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .barcode-result {
            background: #fff;
            border: 2px solid #28a745;
            border-radius: 15px;
            margin: 20px 0;
            padding: 30px;
        }
        .barcode-header {
            background: #28a745;
            color: white;
            padding: 20px;
            margin: -30px -30px 30px -30px;
            border-radius: 13px 13px 0 0;
            text-align: center;
        }
        .barcode-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }
        .info-label {
            font-weight: bold;
            color: #495057;
            margin-bottom: 5px;
        }
        .info-value {
            color: #212529;
            font-family: 'Courier New', monospace;
        }
        .barcode-segments {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .barcode-segment {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            border: 2px dashed #2196f3;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .copy-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .copy-btn:hover {
            background: #218838;
        }
        .barcode-display {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .status-pending {
            color: #856404;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .status-success {
            color: #155724;
            background: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .status-error {
            color: #721c24;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .refresh-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏪 便利商店條碼付款測試</h1>
            <p class="subtitle">第三方API服務 - 條碼網頁展示功能</p>
        </div>
        
        <div class="section">
            <h3>📋 功能說明</h3>
            <p>此測試頁面展示如何使用第三方API建立便利商店條碼付款，並生成條碼展示網頁。</p>
            <ul class="feature-list">
                <li>建立便利商店條碼付款訂單</li>
                <li>生成完整的條碼展示網頁</li>
                <li>支援條碼複製和使用說明</li>
                <li>響應式設計，支援手機瀏覽</li>
                <li>自動重新整理等待條碼生成</li>
            </ul>
        </div>
        
        <div class="section">
            <h3>🚀 條碼測試</h3>
            <p>輸入金額後，條碼將直接在下方顯示：</p>
            
            <div class="test-form" id="testForm">
                <div style="text-align: center; margin: 20px 0;">
                    <button onclick="createBarcode(100)" class="test-btn">NT$ 100</button>
                    <button onclick="createBarcode(299)" class="test-btn">NT$ 299</button>
                    <button onclick="createBarcode(500)" class="test-btn">NT$ 500</button>
                    <button onclick="createBarcode(1000)" class="test-btn">NT$ 1000</button>
                </div>
                
                <div class="custom-form" style="text-align: center;">
                    <h4>💰 自訂金額</h4>
                    <input type="number" id="customAmount" placeholder="輸入金額 (1-6000)" min="1" max="6000" style="padding: 10px; margin: 5px; border: 1px solid #ddd; border-radius: 5px;">
                    <button onclick="createCustomBarcode()" class="test-btn">建立條碼</button>
                </div>
            </div>
            
            <!-- 載入中的顯示 -->
            <div class="loading-section" id="loadingSection" style="display: none;">
                <div class="loading-spinner"></div>
                <p>正在建立條碼訂單...</p>
            </div>
            
            <!-- 條碼結果顯示區域 -->
            <div class="barcode-result" id="barcodeResult" style="display: none;"></div>
        </div>
        
        <div class="section">
            <h3>🔗 API端點說明</h3>
            <p><strong>條碼網頁URL格式：</strong></p>
            <div class="url-example">
                ${process.env.BASE_URL || 'https://corba3c-production.up.railway.app'}/api/third-party/orders/{訂單ID}/barcode/page
            </div>
            
            <p><strong>查詢參數選項：</strong></p>
            <ul>
                <li><code>?theme=default</code> - 設定主題風格</li>
                <li><code>?format=web</code> - 設定顯示格式 (web/iframe)</li>
                <li><code>?lang=zh-TW</code> - 設定語言</li>
            </ul>
        </div>
        
        <div class="info">
            <h4>💡 廠商整合說明</h4>
            <p>廠商可以透過以下方式使用條碼網頁：</p>
            <ol>
                <li><strong>直接跳轉：</strong>將用戶導向 <code>barcode_page_url</code></li>
                <li><strong>嵌入iframe：</strong>使用 <code>barcode_iframe_url</code> 嵌入自己的網頁</li>
                <li><strong>API查詢：</strong>定期查詢 <code>/barcode</code> API獲取最新狀態</li>
            </ol>
        </div>
        
        <div class="warning">
            <h4>⚠️ 測試注意事項</h4>
            <ul>
                <li>這會建立真實的綠界訂單，但請勿進行實際付款</li>
                <li>條碼生成可能需要幾秒鐘時間</li>
                <li>條碼有效期限為7天</li>
                <li>測試完成後可忽略條碼，系統會自動清理過期訂單</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <a href="/merchant-demo" class="test-btn secondary">🏪 廠商API演示</a>
            <a href="/test-code39" class="test-btn secondary">📊 Code39條碼測試</a>
            <a href="/api/health" class="test-btn secondary">🏥 系統狀態</a>
        </div>
    </div>
    
    <script>
        let currentOrderId = null;
        let pollInterval = null;
        
        // 建立條碼訂單
        async function createBarcode(amount) {
            showLoading(true);
            hideResult();
            
            try {
                const timestamp = Date.now();
                const randomId = Math.random().toString(36).substring(2, 10);
                const clientOrderId = \`barcode_test_\${timestamp}_\${randomId}\`;
                
                const response = await fetch('/api/third-party/barcode/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
                    },
                    body: JSON.stringify({
                        amount: amount,
                        client_order_id: clientOrderId,
                        callback_url: 'https://webhook.site/test-barcode'
                    })
                });
                
                const result = await response.json();
                console.log('API回應:', result);
                
                if (response.ok && result.success) {
                    currentOrderId = result.data.order_id;
                    showResult(result.data);
                    
                    // 如果條碼還沒有生成，開始輪詢
                    if (!result.data.barcode && (!result.data.barcode_segments || 
                        (!result.data.barcode_segments.barcode_1 && !result.data.barcode_segments.barcode_2 && !result.data.barcode_segments.barcode_3))) {
                        startPolling(currentOrderId);
                    }
                } else {
                    showError('API呼叫失敗: ' + (result.message || '未知錯誤'));
                }
            } catch (error) {
                console.error('建立條碼失敗:', error);
                showError('建立條碼失敗: ' + error.message);
            }
            
            showLoading(false);
        }
        
        // 自訂金額建立條碼
        function createCustomBarcode() {
            const amountInput = document.getElementById('customAmount');
            const amount = parseInt(amountInput.value);
            
            if (!amount || amount < 1 || amount > 6000) {
                alert('請輸入1-6000之間的金額');
                return;
            }
            
            createBarcode(amount);
        }
        
        // 輪詢檢查條碼狀態
        async function startPolling(orderId) {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
            
            console.log('開始輪詢訂單 (使用CVS查詢)', orderId);
            
            let pollCount = 0;
            const maxPolls = 24; // 最多輪詢2分鐘 (24次 * 5秒)
            
            pollInterval = setInterval(async () => {
                try {
                    pollCount++;
                    console.log(\`輪詢第\${pollCount}次，檢查條碼狀態...\`);
                    
                    // 使用新的refresh端點，它會自動執行CVS查詢
                    const response = await fetch(\`/api/third-party/orders/\${orderId}/barcode/refresh\`, {
                        headers: {
                            'X-API-KEY': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
                        }
                    });
                    
                    const result = await response.json();
                    console.log('條碼查詢回應:', result);
                    
                    if (response.ok && result.success) {
                        // 檢查是否有條碼數據
                        if (result.data.barcode || 
                            (result.data.barcode_segments && 
                             (result.data.barcode_segments.barcode_1 || result.data.barcode_segments.barcode_2 || result.data.barcode_segments.barcode_3))) {
                            
                            console.log('收到條碼數據，停止輪詢');
                            clearInterval(pollInterval);
                            showResult(result.data);
                            return;
                        }
                    }
                    
                    // 檢查是否達到最大輪詢次數
                    if (pollCount >= maxPolls) {
                        console.log('已達最大輪詢次數，停止輪詢');
                        clearInterval(pollInterval);
                        
                        const resultSection = document.getElementById('barcodeResult');
                        resultSection.innerHTML = \`
                            <div class="status-warning">
                                ⏰ 輪詢超時 - 已輪詢\${maxPolls}次
                            </div>
                            <div style="margin-top: 15px;">
                                <p>條碼資訊尚未從綠界系統生成。這可能是因為：</p>
                                <ul style="text-align: left; margin: 10px 0;">
                                    <li>綠界需要消費者實際訪問付款頁面才會生成條碼</li>
                                    <li>系統正在處理中，請稍後再試</li>
                                </ul>
                                <button onclick="continuePolling(\${orderId})" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                                    🔄 繼續輪詢
                                </button>
                            </div>
                        \`;
                        resultSection.style.display = 'block';
                    }
                } catch (error) {
                    console.error('輪詢錯誤:', error);
                    if (pollCount >= maxPolls) {
                        clearInterval(pollInterval);
                        showError('輪詢失敗: ' + error.message);
                    }
                }
            }, 5000); // 每5秒檢查一次
        }
        
        // 繼續輪詢功能
        function continuePolling(orderId) {
            console.log('用戶選擇繼續輪詢:', orderId);
            const resultSection = document.getElementById('barcodeResult');
            resultSection.innerHTML = \`
                <div class="status-info">
                    🔄 繼續查詢中...
                </div>
                <div style="margin-top: 15px;">
                    <p>正在重新檢查條碼狀態...</p>
                </div>
            \`;
            startPolling(orderId);
        }
        
        // 顯示載入中
        function showLoading(show) {
            const loadingSection = document.getElementById('loadingSection');
            loadingSection.style.display = show ? 'block' : 'none';
        }
        
        // 隱藏結果
        function hideResult() {
            const resultSection = document.getElementById('barcodeResult');
            resultSection.style.display = 'none';
        }
        
        // 顯示結果
        function showResult(data) {
            const resultSection = document.getElementById('barcodeResult');
            
            // 檢查條碼狀態
            const hasBarcode = data.barcode || 
                (data.barcode_segments && 
                 (data.barcode_segments.barcode_1 || data.barcode_segments.barcode_2 || data.barcode_segments.barcode_3));
            
            let barcodeContent = '';
            
            if (hasBarcode) {
                // 有條碼數據
                let segments = [];
                if (data.barcode_segments) {
                    if (data.barcode_segments.barcode_1) segments.push(data.barcode_segments.barcode_1);
                    if (data.barcode_segments.barcode_2) segments.push(data.barcode_segments.barcode_2);
                    if (data.barcode_segments.barcode_3) segments.push(data.barcode_segments.barcode_3);
                }
                
                barcodeContent = \`
                    <div class="status-success">
                        ✅ 條碼已生成！請至便利商店付款
                    </div>
                    
                    \${segments.length > 0 ? \`
                        <div class="barcode-segments">
                            <h4>📊 條碼段資訊</h4>
                            \${segments.map((segment, index) => \`
                                <div class="barcode-segment">
                                    <span>第 \${index + 1} 段: \${segment}</span>
                                    <button class="copy-btn" onclick="copyToClipboard('\${segment}')">複製</button>
                                </div>
                            \`).join('')}
                            \${data.barcode ? \`
                                <div class="barcode-segment" style="border-color: #28a745;">
                                    <span>完整條碼: \${data.barcode}</span>
                                    <button class="copy-btn" onclick="copyToClipboard('\${data.barcode}')">複製</button>
                                </div>
                            \` : ''}
                        </div>
                    \` : (data.barcode ? \`
                        <div class="barcode-segments">
                            <div class="barcode-segment" style="border-color: #28a745;">
                                <span>條碼: \${data.barcode}</span>
                                <button class="copy-btn" onclick="copyToClipboard('\${data.barcode}')">複製</button>
                            </div>
                        </div>
                    \` : '')}
                \`;
            } else {
                // 沒有條碼數據
                barcodeContent = \`
                    <div class="status-pending">
                        ⏳ 正在等待綠界回傳條碼數據...
                        <br>這通常需要幾秒到幾分鐘時間，系統會自動更新
                        <br><button class="refresh-btn" onclick="manualRefresh()">手動重新整理</button>
                    </div>
                \`;
            }
            
            resultSection.innerHTML = \`
                <div class="barcode-header">
                    <h2>🏪 便利商店條碼付款</h2>
                    <p>訂單編號: \${data.external_order_id}</p>
                </div>
                
                <div class="barcode-info">
                    <div class="info-item">
                        <div class="info-label">訂單ID</div>
                        <div class="info-value">\${data.order_id}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">付款金額</div>
                        <div class="info-value">NT$ \${data.amount}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">條碼狀態</div>
                        <div class="info-value">\${data.barcode_status}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">過期時間</div>
                        <div class="info-value">\${new Date(data.expire_date).toLocaleString('zh-TW')}</div>
                    </div>
                </div>
                
                \${barcodeContent}
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="\${data.barcode_page_url}" target="_blank" class="test-btn">🏪 完整條碼頁面</a>
                    <button onclick="resetTest()" class="test-btn secondary">🔄 重新測試</button>
                </div>
            \`;
            
            resultSection.style.display = 'block';
        }
        
        // 顯示錯誤
        function showError(message) {
            const resultSection = document.getElementById('barcodeResult');
            resultSection.innerHTML = \`
                <div class="barcode-header" style="background: #dc3545;">
                    <h2>❌ 建立失敗</h2>
                </div>
                <div class="status-error">
                    \${message}
                    <br><button class="refresh-btn" onclick="resetTest()">重新嘗試</button>
                </div>
            \`;
            resultSection.style.display = 'block';
        }
        
        // 手動重新整理
        async function manualRefresh() {
            if (currentOrderId) {
                showLoading(true);
                try {
                    const response = await fetch(\`/api/third-party/orders/\${currentOrderId}/barcode\`, {
                        headers: {
                            'X-API-KEY': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
                        }
                    });
                    
                    const result = await response.json();
                    if (response.ok && result.success) {
                        showResult(result.data);
                        
                        // 如果還是沒有條碼，繼續輪詢
                        const hasBarcode = result.data.barcode || 
                            (result.data.barcode_segments && 
                             (result.data.barcode_segments.barcode_1 || result.data.barcode_segments.barcode_2 || result.data.barcode_segments.barcode_3));
                        
                        if (!hasBarcode) {
                            startPolling(currentOrderId);
                        }
                    }
                } catch (error) {
                    console.error('重新整理失敗:', error);
                }
                showLoading(false);
            }
        }
        
        // 重置測試
        function resetTest() {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
            currentOrderId = null;
            hideResult();
            showLoading(false);
        }
        
        // 複製到剪貼板
        function copyToClipboard(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function() {
                    const btn = event.target;
                    const originalText = btn.textContent;
                    btn.textContent = '已複製!';
                    btn.style.background = '#20c997';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = '#28a745';
                    }, 1500);
                });
            } else {
                // 降級方案
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    alert('已複製到剪貼板');
                } catch (err) {
                    alert('複製失敗，請手動選取文字');
                }
                document.body.removeChild(textArea);
            }
        }
        
        // Enter 鍵支援
        document.getElementById('customAmount').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                createCustomBarcode();
            }
        });
    </script>
</body>
</html>
  `);
});

// ECPay 測試表單選擇頁面
// 廠商模擬頁面 - 演示如何使用API
app.get('/merchant-demo', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>廠商API使用演示</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft JhengHei', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        .demo-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 5px solid #3498db;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #495057;
        }
        input, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #dee2e6;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #3498db;
        }
        .btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
            width: 100%;
        }
        .btn:hover {
            background: #218838;
        }
        .btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
        .result-box {
            background: #e8f5e8;
            border: 2px solid #28a745;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            display: none;
        }
        .error-box {
            background: #f8d7da;
            border: 2px solid #dc3545;
            color: #721c24;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            display: none;
        }
        .code-block {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            overflow-x: auto;
            margin: 15px 0;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .info-box {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏪 廠商API使用演示</h1>
            <p>模擬廠商網站如何使用我們的金流API</p>
        </div>
        
        <div class="content">
            <div class="demo-section">
                <h3>📝 訂單資訊</h3>
                <div class="form-group">
                    <label for="amount">付款金額 (NT$)</label>
                    <input type="number" id="amount" min="1" max="6000" value="299" required>
                </div>
                <div class="form-group">
                    <label for="orderType">訂單類型</label>
                    <select id="orderType">
                        <option value="product">商品購買</option>
                        <option value="service">服務付費</option>
                        <option value="donation">捐款</option>
                        <option value="membership">會員費</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="customerEmail">顧客email (選填)</label>
                    <input type="email" id="customerEmail" placeholder="customer@example.com">
                </div>
            </div>
            
            <div class="demo-section">
                <h3>🚀 API 調用演示</h3>
                <div class="info-box">
                    <strong>服務流程：</strong><br>
                    1. 廠商調用我們的API建立訂單<br>
                    2. 獲得 barcode_page_url 跳轉網址<br>
                    3. 將用戶導向此網址，用戶直接進入ECPay收銀台<br>
                    4. 廠商無需處理任何ECPay技術細節
                </div>
                
                <button onclick="callPaymentAPI()" class="btn" id="payBtn">💳 建立付款訂單</button>
                
                <div class="loading" id="loading">
                    <div class="loading-spinner"></div>
                    <p>正在調用API建立訂單...</p>
                </div>
                
                <div class="result-box" id="resultBox">
                    <h4>✅ API 調用成功</h4>
                    <p><strong>訂單編號：</strong><span id="orderId"></span></p>
                    <p><strong>付款網址：</strong><span id="paymentUrl"></span></p>
                    <button onclick="redirectToPayment()" class="btn" style="margin-top: 15px;">
                        🏪 前往ECPay收銀台付款
                    </button>
                </div>
                
                <div class="error-box" id="errorBox">
                    <h4>❌ API 調用失敗</h4>
                    <p id="errorMessage"></p>
                </div>
                
                <div id="apiDetails" style="display: none;">
                    <h4>📋 API 調用詳情</h4>
                    <p><strong>請求URL：</strong></p>
                    <div class="code-block" id="requestUrl"></div>
                    <p><strong>請求內容：</strong></p>
                    <div class="code-block" id="requestBody"></div>
                    <p><strong>回應內容：</strong></p>
                    <div class="code-block" id="responseBody"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentPaymentUrl = '';
        
        async function callPaymentAPI() {
            const amount = document.getElementById('amount').value;
            const orderType = document.getElementById('orderType').value;
            const customerEmail = document.getElementById('customerEmail').value;
            
            if (!amount || amount < 1 || amount > 6000) {
                alert('請輸入有效的金額 (1-6000)');
                return;
            }
            
            // 生成唯一訂單編號
            const timestamp = Date.now();
            const clientOrderId = \`DEMO_\${orderType.toUpperCase()}_\${timestamp}\`;
            
            // 顯示載入狀態
            document.getElementById('payBtn').disabled = true;
            document.getElementById('loading').style.display = 'block';
            document.getElementById('resultBox').style.display = 'none';
            document.getElementById('errorBox').style.display = 'none';
            document.getElementById('apiDetails').style.display = 'none';
            
            const apiUrl = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create';
            const requestData = {
                amount: parseInt(amount),
                client_order_id: clientOrderId,
                callback_url: customerEmail ? \`mailto:\${customerEmail}\` : 'https://webhook.site/demo'
            };
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
                    },
                    body: JSON.stringify(requestData)
                });
                
                const result = await response.json();
                
                // 更新API詳情
                document.getElementById('requestUrl').textContent = \`POST \${apiUrl}\`;
                document.getElementById('requestBody').textContent = JSON.stringify(requestData, null, 2);
                document.getElementById('responseBody').textContent = JSON.stringify(result, null, 2);
                document.getElementById('apiDetails').style.display = 'block';
                
                if (response.ok && result.success) {
                    // 成功回應
                    document.getElementById('orderId').textContent = result.data.client_order_id;
                    document.getElementById('paymentUrl').textContent = result.data.barcode_page_url;
                    currentPaymentUrl = result.data.barcode_page_url;
                    document.getElementById('resultBox').style.display = 'block';
                } else {
                    throw new Error(result.message || '未知錯誤');
                }
                
            } catch (error) {
                document.getElementById('errorMessage').textContent = error.message;
                document.getElementById('errorBox').style.display = 'block';
            } finally {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('payBtn').disabled = false;
            }
        }
        
        function redirectToPayment() {
            if (currentPaymentUrl) {
                window.location.href = currentPaymentUrl;
            }
        }
        
        // 頁面載入時顯示歡迎訊息
        window.addEventListener('load', function() {
            console.log('廠商API演示頁面載入完成');
        });
    </script>
</body>
</html>
  `);
});

// Code39條碼生成測試頁面
app.get('/test-code39', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code39條碼生成測試</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft JhengHei', sans-serif; 
            max-width: 900px; 
            margin: 30px auto; 
            padding: 20px; 
            background: #f8f9fa;
            line-height: 1.6;
        }
        .container { 
            background: white; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #28a745;
            padding-bottom: 20px;
        }
        h1 { 
            color: #2c3e50; 
            margin-bottom: 10px;
        }
        .test-section {
            margin: 30px 0;
            padding: 25px;
            border: 1px solid #dee2e6;
            border-radius: 10px;
            background: #f8f9fa;
        }
        .input-group {
            margin: 20px 0;
        }
        .input-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #495057;
        }
        .input-group input, .input-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #ced4da;
            border-radius: 6px;
            font-size: 16px;
            box-sizing: border-box;
        }
        .input-group input:focus, .input-group textarea:focus {
            border-color: #28a745;
            outline: none;
            box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
        }
        .btn { 
            background: #28a745; 
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 6px; 
            font-size: 16px;
            cursor: pointer;
            margin: 10px 5px;
            transition: all 0.3s;
        }
        .btn:hover { 
            background: #218838; 
            transform: translateY(-1px);
        }
        .btn.secondary {
            background: #6c757d;
        }
        .btn.secondary:hover {
            background: #545b62;
        }
        .result-section {
            margin: 30px 0;
            padding: 25px;
            border: 2px solid #28a745;
            border-radius: 10px;
            background: white;
            min-height: 150px;
        }
        .barcode-display {
            text-align: center;
            margin: 20px 0;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #17a2b8;
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #ffc107;
        }
        .tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 2px solid #dee2e6;
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 16px;
            transition: all 0.3s;
        }
        .tab.active {
            border-bottom: 3px solid #28a745;
            color: #28a745;
            font-weight: bold;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Code39條碼生成測試</h1>
            <p>測試本地Code39條碼生成功能</p>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="switchTab('single')">單段條碼</button>
            <button class="tab" onclick="switchTab('multi')">多段條碼</button>
            <button class="tab" onclick="switchTab('examples')">範例測試</button>
        </div>
        
        <!-- 單段條碼測試 -->
        <div id="singleTab" class="tab-content active">
            <div class="test-section">
                <h3>🔤 單段條碼生成</h3>
                <div class="input-group">
                    <label for="singleText">條碼文字 (支援數字、大寫字母、-、.、空格等):</label>
                    <input type="text" id="singleText" placeholder="例如: HELLO123" value="HELLO123">
                </div>
                <div class="input-group">
                    <label for="singleWidth">寬度:</label>
                    <input type="number" id="singleWidth" value="350" min="200" max="600">
                </div>
                <div class="input-group">
                    <label for="singleHeight">高度:</label>
                    <input type="number" id="singleHeight" value="100" min="60" max="200">
                </div>
                <button class="btn" onclick="generateSingleBarcode()">生成條碼</button>
                <button class="btn secondary" onclick="clearResults()">清除結果</button>
            </div>
        </div>
        
        <!-- 多段條碼測試 -->
        <div id="multiTab" class="tab-content">
            <div class="test-section">
                <h3>📋 多段條碼生成 (模擬綠界三段式)</h3>
                <div class="input-group">
                    <label for="segment1">第一段:</label>
                    <input type="text" id="segment1" placeholder="例如: 12345" value="12345">
                </div>
                <div class="input-group">
                    <label for="segment2">第二段:</label>
                    <input type="text" id="segment2" placeholder="例如: 67890" value="67890">
                </div>
                <div class="input-group">
                    <label for="segment3">第三段:</label>
                    <input type="text" id="segment3" placeholder="例如: ABCDE" value="ABCDE">
                </div>
                <button class="btn" onclick="generateMultiBarcode()">生成多段條碼</button>
                <button class="btn secondary" onclick="clearResults()">清除結果</button>
            </div>
        </div>
        
        <!-- 範例測試 -->
        <div id="examplesTab" class="tab-content">
            <div class="test-section">
                <h3>🎯 快速範例測試</h3>
                <p>點擊以下按鈕測試不同的條碼格式:</p>
                <button class="btn" onclick="testExample('TEST123')">測試: TEST123</button>
                <button class="btn" onclick="testExample('STORE-001')">測試: STORE-001</button>
                <button class="btn" onclick="testExample('PAY 2023')">測試: PAY 2023</button>
                <button class="btn" onclick="testMultiExample(['123456', '789012', 'ABC'])">測試三段式</button>
            </div>
        </div>
        
        <div class="info">
            <h4>💡 Code39格式說明</h4>
            <ul>
                <li><strong>支援字符:</strong> 數字(0-9)、大寫字母(A-Z)、特殊符號(-、.、空格、$、/、+、%)</li>
                <li><strong>條碼格式:</strong> 自動添加起始和結束符號(*)</li>
                <li><strong>用途:</strong> 超商條碼掃描、庫存管理、物流追蹤</li>
                <li><strong>建議:</strong> 條碼文字不要超過20個字符以確保可讀性</li>
            </ul>
        </div>
        
        <div class="result-section" id="resultSection">
            <h3>📊 生成結果</h3>
            <div id="barcodeResult">
                <p style="text-align: center; color: #6c757d;">請在上方選擇測試類型並生成條碼</p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="/test-barcode" class="btn secondary">🏪 條碼付款測試</a>
            <a href="/api/health" class="btn secondary">🏥 系統狀態</a>
        </div>
    </div>
    
    <script>
        function switchTab(tabName) {
            // 隱藏所有tab內容
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // 移除所有tab的active狀態
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // 顯示選中的tab
            document.getElementById(tabName + 'Tab').classList.add('active');
            event.target.classList.add('active');
        }
        
        async function generateSingleBarcode() {
            const text = document.getElementById('singleText').value;
            const width = document.getElementById('singleWidth').value;
            const height = document.getElementById('singleHeight').value;
            
            if (!text.trim()) {
                alert('請輸入條碼文字');
                return;
            }
            
            try {
                showLoading();
                const response = await fetch(\`/api/third-party/barcode/generate/\${encodeURIComponent(text)}?width=\${width}&height=\${height}&format=json\`);
                const result = await response.json();
                
                if (result.success) {
                    displayResult(result.data.svg, \`單段條碼: \${result.data.text}\`, result.data.warnings);
                } else {
                    displayError(result.message, result.details);
                }
            } catch (error) {
                displayError('生成失敗', error.message);
            }
        }
        
        async function generateMultiBarcode() {
            const segments = [
                document.getElementById('segment1').value,
                document.getElementById('segment2').value,
                document.getElementById('segment3').value
            ].filter(s => s.trim());
            
            if (segments.length === 0) {
                alert('請至少輸入一段條碼文字');
                return;
            }
            
            try {
                showLoading();
                const response = await fetch('/api/third-party/barcode/generate-multi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ segments })
                });
                const result = await response.json();
                
                if (result.success) {
                    displayResult(result.data.svg, \`多段條碼 (\${result.data.segmentCount}段)\`, result.data.warnings);
                } else {
                    displayError(result.message, result.details);
                }
            } catch (error) {
                displayError('生成失敗', error.message);
            }
        }
        
        function testExample(text) {
            document.getElementById('singleText').value = text;
            switchTab('single');
            document.querySelector('.tab[onclick="switchTab(\'single\')"]').classList.add('active');
            generateSingleBarcode();
        }
        
        function testMultiExample(segments) {
            document.getElementById('segment1').value = segments[0] || '';
            document.getElementById('segment2').value = segments[1] || '';
            document.getElementById('segment3').value = segments[2] || '';
            switchTab('multi');
            document.querySelector('.tab[onclick="switchTab(\'multi\')"]').classList.add('active');
            generateMultiBarcode();
        }
        
        function showLoading() {
            document.getElementById('barcodeResult').innerHTML = '<p style="text-align: center;">⏳ 正在生成條碼...</p>';
        }
        
        function displayResult(svg, title, warnings = []) {
            let html = \`<h4>\${title}</h4><div class="barcode-display">\${svg}</div>\`;
            
            if (warnings.length > 0) {
                html += \`<div class="warning"><strong>⚠️ 警告:</strong><ul>\${warnings.map(w => \`<li>\${w}</li>\`).join('')}</ul></div>\`;
            }
            
            html += \`<div style="text-align: center; margin-top: 15px;">
                <button class="btn secondary" onclick="downloadCurrentBarcode()">下載SVG</button>
            </div>\`;
            
            document.getElementById('barcodeResult').innerHTML = html;
        }
        
        function displayError(message, details) {
            let html = \`<div style="color: red; text-align: center;">
                <h4>❌ \${message}</h4>\`;
            
            if (details) {
                if (Array.isArray(details)) {
                    html += \`<ul>\${details.map(d => \`<li>\${d}</li>\`).join('')}</ul>\`;
                } else {
                    html += \`<p>\${details}</p>\`;
                }
            }
            
            html += '</div>';
            document.getElementById('barcodeResult').innerHTML = html;
        }
        
        function clearResults() {
            document.getElementById('barcodeResult').innerHTML = '<p style="text-align: center; color: #6c757d;">請在上方選擇測試類型並生成條碼</p>';
        }
        
        function downloadCurrentBarcode() {
            const svg = document.querySelector('#barcodeResult svg');
            if (svg) {
                const svgContent = new XMLSerializer().serializeToString(svg);
                const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'code39-barcode.svg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        }
    </script>
</body>
</html>
  `);
});

// 條碼測試端點 (建立訂單並跳轉到條碼網頁)
app.get('/create-test-barcode', async (req, res) => {
  const amount = parseInt(req.query.amount) || 299;
  
  if (amount < 1 || amount > 6000) {
    return res.status(400).send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>錯誤</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px;">
    <h1 style="color: red;">❌ 金額錯誤</h1>
    <p>金額必須在 1-6000 之間</p>
    <a href="/test-barcode" style="color: blue;">返回測試頁面</a>
</body>
</html>
    `);
  }
  
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const clientOrderId = `barcode_test_${timestamp}_${randomId}`;
    
    // 建立條碼訂單 (直接呼叫API)
    const apiUrl = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create';
    console.log('呼叫條碼API:', apiUrl);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
      },
      body: JSON.stringify({
        amount: amount,
        client_order_id: clientOrderId,
        callback_url: 'https://webhook.site/test-barcode'
      })
    });
    
    console.log('條碼API回應狀態:', response.status);
    const orderResult = await response.json();
    console.log('條碼API回應內容:', JSON.stringify(orderResult, null, 2));
    
    if (!response.ok || !orderResult.success) {
      const errorMsg = orderResult.message || `API呼叫失敗: ${response.status}`;
      console.error('條碼API錯誤:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // 取得條碼網頁URL
    const barcodePageUrl = orderResult.data.barcode_page_url;
    const orderId = orderResult.data.order_id;
    
    // 顯示中間頁面，然後跳轉到條碼網頁
    res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>條碼訂單建立成功</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft JhengHei', sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .container {
            background: white;
            color: #2c3e50;
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
        }
        .success-icon {
            font-size: 80px;
            margin-bottom: 30px;
        }
        h1 {
            color: #28a745;
            margin-bottom: 20px;
        }
        .order-info {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            text-align: left;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
        }
        .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .info-label {
            font-weight: bold;
            color: #495057;
        }
        .info-value {
            color: #212529;
        }
        .amount {
            font-size: 18px;
            color: #28a745;
            font-weight: bold;
        }
        .btn { 
            background: #007bff; 
            color: white; 
            padding: 20px 40px; 
            border: none; 
            border-radius: 10px; 
            font-size: 18px; 
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 15px;
            transition: all 0.3s;
        }
        .btn:hover { 
            background: #0056b3; 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .btn.primary {
            background: #28a745;
        }
        .btn.primary:hover {
            background: #1e7e34;
        }
        .countdown {
            font-size: 16px;
            color: #6c757d;
            margin-top: 20px;
        }
        .api-info {
            background: #e9ecef;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            text-align: left;
        }
        .api-info code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>條碼訂單建立成功！</h1>
        <p>系統已成功建立便利商店條碼付款訂單</p>
        
        <div class="order-info">
            <div class="info-row">
                <span class="info-label">訂單編號:</span>
                <span class="info-value">${orderResult.data.client_order_id}</span>
            </div>
            <div class="info-row">
                <span class="info-label">內部ID:</span>
                <span class="info-value">${orderId}</span>
            </div>
            <div class="info-row">
                <span class="info-label">付款金額:</span>
                <span class="info-value amount">NT$ ${amount}</span>
            </div>
            <div class="info-row">
                <span class="info-label">付款方式:</span>
                <span class="info-value">7-ELEVEN條碼付款</span>
            </div>
            <div class="info-row">
                <span class="info-label">訂單狀態:</span>
                <span class="info-value">${orderResult.data.barcode_status || 'pending'}</span>
            </div>
        </div>
        
        <div class="api-info">
            <h4>🔗 API回應資訊</h4>
            <p><strong>條碼網頁URL:</strong></p>
            <code>${barcodePageUrl}</code>
            <p style="margin-top: 10px;"><strong>付款方式:</strong> ${orderResult.data.payment_method || 'ecpay_redirect'}</p>
        </div>
        
        <div>
            <a href="${barcodePageUrl}" class="btn primary">🏪 查看條碼付款頁面</a>
            <a href="/test-barcode-api/${orderId}" class="btn">📋 查看API資料</a>
        </div>
        
        <div>
            <a href="/test-barcode" class="btn">🔄 建立另一個測試</a>
        </div>
        
        <div class="countdown" id="countdown">
            <span id="timer">5</span> 秒後自動跳轉到條碼頁面...
        </div>
    </div>
    
    <script>
        let seconds = 5;
        const timerElement = document.getElementById('timer');
        const countdownElement = document.getElementById('countdown');
        
        const countdown = setInterval(() => {
            seconds--;
            timerElement.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(countdown);
                countdownElement.textContent = '正在跳轉...';
                window.location.href = '${barcodePageUrl}';
            }
        }, 1000);
        
        // 點擊任何地方取消自動跳轉
        document.addEventListener('click', () => {
            clearInterval(countdown);
            countdownElement.textContent = '自動跳轉已取消，請手動點擊按鈕';
        });
    </script>
</body>
</html>
    `);
    
  } catch (error) {
    console.error('建立條碼測試失敗:', error);
    res.status(500).send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>錯誤</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px;">
    <h1 style="color: red;">❌ 建立條碼訂單失敗</h1>
    <p>${error.message}</p>
    <p style="font-size: 14px; color: #666;">請檢查網路連線或稍後再試</p>
    <a href="/test-barcode" style="color: blue;">返回測試頁面</a>
</body>
</html>
    `);
  }
});

// 測試用API資料查看端點 (不需要API Key)
app.get('/test-barcode-api/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 使用測試API Key呼叫API
    const apiUrl = `https://corba3c-production.up.railway.app/api/third-party/orders/${orderId}/barcode`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
      }
    });
    
    const data = await response.json();
    
    // 產生美化的API資料頁面
    res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>條碼API資料 - 訂單 ${orderId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft JhengHei', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .status { 
            display: inline-block; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: bold; 
            margin-top: 10px;
        }
        .status.success { background: #27ae60; color: white; }
        .status.pending { background: #f39c12; color: white; }
        .status.error { background: #e74c3c; color: white; }
        .content { padding: 30px; }
        .json-container {
            background: #2d3748;
            color: #e2e8f0;
            padding: 25px;
            border-radius: 10px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            white-space: pre-wrap;
            overflow-x: auto;
            line-height: 1.6;
        }
        .back-btn {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px 0 0;
            transition: background 0.3s;
        }
        .back-btn:hover { background: #2980b9; }
        .secondary { background: #6c757d; }
        .secondary:hover { background: #545b62; }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .info-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #3498db;
        }
        .info-card h4 { color: #2c3e50; margin-bottom: 10px; }
        .info-card p { color: #495057; margin: 5px 0; }
        .barcode-segments {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .segment {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            color: #2c3e50;
            border: 2px dashed #3498db;
        }
        .copy-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 條碼API資料</h1>
            <div class="status ${response.ok && data.success ? 'success' : 'error'}">
                ${response.ok && data.success ? '✅ API成功' : '❌ API錯誤'}
            </div>
        </div>
        
        <div class="content">
            ${response.ok && data.success ? `
                <div class="info-grid">
                    <div class="info-card">
                        <h4>📦 訂單資訊</h4>
                        <p><strong>訂單ID:</strong> ${data.data.order_id}</p>
                        <p><strong>外部ID:</strong> ${data.data.external_order_id}</p>
                        <p><strong>金額:</strong> NT$ ${data.data.amount}</p>
                        <p><strong>商品:</strong> ${data.data.product_info}</p>
                    </div>
                    
                    <div class="info-card">
                        <h4>🏪 條碼狀態</h4>
                        <p><strong>狀態:</strong> ${data.data.barcode_status}</p>
                        <p><strong>建立時間:</strong> ${new Date(data.data.created_at).toLocaleString('zh-TW')}</p>
                        <p><strong>更新時間:</strong> ${new Date(data.data.updated_at).toLocaleString('zh-TW')}</p>
                        <p><strong>過期時間:</strong> ${data.data.expire_date ? new Date(data.data.expire_date).toLocaleString('zh-TW') : '未設定'}</p>
                    </div>
                    
                    <div class="info-card">
                        <h4>🔗 相關連結</h4>
                        <p><a href="${data.data.barcode_page_url}" target="_blank" style="color: #007bff;">條碼頁面</a></p>
                        <p><a href="${data.data.barcode_iframe_url}" target="_blank" style="color: #007bff;">iframe版本</a></p>
                    </div>
                    
                    <div class="info-card">
                        <h4>💳 綠界資訊</h4>
                        <p><strong>商家編號:</strong> ${data.data.merchant_trade_no}</p>
                        <p><strong>交易編號:</strong> ${data.data.trade_no || '尚未產生'}</p>
                        <p><strong>訂單狀態:</strong> ${data.data.order_status}</p>
                    </div>
                </div>
                
                ${data.data.barcode_segments && (data.data.barcode_segments.barcode_1 || data.data.barcode_segments.barcode_2 || data.data.barcode_segments.barcode_3) ? `
                    <div class="barcode-segments">
                        <h4>📊 條碼段資訊</h4>
                        ${data.data.barcode_segments.barcode_1 ? `
                            <div class="segment">
                                第1段: ${data.data.barcode_segments.barcode_1}
                                <button class="copy-btn" onclick="copyToClipboard('${data.data.barcode_segments.barcode_1}')">複製</button>
                            </div>
                        ` : ''}
                        ${data.data.barcode_segments.barcode_2 ? `
                            <div class="segment">
                                第2段: ${data.data.barcode_segments.barcode_2}
                                <button class="copy-btn" onclick="copyToClipboard('${data.data.barcode_segments.barcode_2}')">複製</button>
                            </div>
                        ` : ''}
                        ${data.data.barcode_segments.barcode_3 ? `
                            <div class="segment">
                                第3段: ${data.data.barcode_segments.barcode_3}
                                <button class="copy-btn" onclick="copyToClipboard('${data.data.barcode_segments.barcode_3}')">複製</button>
                            </div>
                        ` : ''}
                        ${data.data.barcode ? `
                            <div class="segment" style="border-color: #28a745;">
                                完整條碼: ${data.data.barcode}
                                <button class="copy-btn" onclick="copyToClipboard('${data.data.barcode}')">複製</button>
                            </div>
                        ` : ''}
                    </div>
                ` : '<div class="info-card"><h4>⏳ 等待條碼</h4><p>條碼尚未生成，請稍後重新整理</p></div>'}
                
                <h4>🔧 完整API回應</h4>
            ` : ''}
            
            <div class="json-container">${JSON.stringify(data, null, 2)}</div>
            
            <div>
                <a href="javascript:history.back()" class="back-btn">🔙 返回</a>
                <a href="/test-barcode" class="back-btn secondary">🧪 新測試</a>
                <a href="${response.ok && data.success && data.data.barcode_page_url ? data.data.barcode_page_url : '#'}" class="back-btn">🏪 條碼頁面</a>
                <button onclick="location.reload()" class="back-btn secondary">🔄 重新整理</button>
            </div>
        </div>
    </div>
    
    <script>
        function copyToClipboard(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function() {
                    // 簡單的提示
                    const btn = event.target;
                    const originalText = btn.textContent;
                    btn.textContent = '已複製!';
                    btn.style.background = '#20c997';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = '#28a745';
                    }, 1500);
                });
            } else {
                alert('複製功能不支援，請手動選取文字');
            }
        }
    </script>
</body>
</html>
    `);

  } catch (error) {
    console.error('API資料查詢錯誤:', error);
    res.status(500).send(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>錯誤</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px;">
    <h1 style="color: red;">❌ 查詢失敗</h1>
    <p>無法獲取API資料: ${error.message}</p>
    <a href="/test-barcode" style="color: blue;">返回測試頁面</a>
</body>
</html>
    `);
  }
});

// 測試用API資料查看端點 - 使用CVS查詢功能 (不需要API Key)
app.get('/test-barcode-api/:orderId/refresh', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 使用測試API Key呼叫refresh端點
    const apiUrl = `https://corba3c-production.up.railway.app/api/third-party/orders/${orderId}/barcode/refresh`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
      }
    });
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('查詢條碼刷新失敗:', error);
    res.status(500).json({
      error: true,
      message: '查詢失敗: ' + error.message
    });
  }
});


/**
 * ECPay 重定向端點 - 專為第三方廠商使用
 * GET /ecpay-redirect/:orderId
 * 直接將用戶重定向到ECPay收銀台，無需額外表單操作
 */
app.get('/ecpay-redirect/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId || isNaN(orderId)) {
      return res.status(400).send('無效的訂單ID');
    }
    
    console.log('ECPay重定向請求，訂單ID:', orderId);
    
    // 查詢訂單資訊
    const { getAsync } = await import('./database/database-adapter.js');
    const order = await getAsync(`
      SELECT tpo.id, tpo.external_order_id, tpo.amount, tpo.product_info, tpo.client_system,
             et.merchant_trade_no, et.raw_response
      FROM third_party_orders tpo
      LEFT JOIN ecpay_transactions et ON tpo.id = et.third_party_order_id
      WHERE tpo.id = ?
    `, [orderId]);
    
    if (!order) {
      return res.status(404).send('找不到訂單');
    }
    
    if (!order.raw_response) {
      return res.status(400).send('訂單未包含ECPay參數');
    }
    
    // 解析ECPay參數
    let ecpayParams;
    try {
      const rawResponse = JSON.parse(order.raw_response);
      ecpayParams = rawResponse.paymentParams || rawResponse.paymentForm?.params;
      
      if (!ecpayParams) {
        throw new Error('找不到ECPay參數');
      }
    } catch (error) {
      console.error('解析ECPay參數失敗:', error);
      return res.status(500).send('訂單參數錯誤');
    }
    
    // 生成隱藏欄位
    let hiddenInputs = '';
    Object.entries(ecpayParams).forEach(([key, value]) => {
      hiddenInputs += `<input type="hidden" name="${key}" value="${value}">`;
    });
    
    // 生成自動提交的HTML表單
    res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>跳轉至ECPay收銀台</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .redirect-container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .order-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
            border-bottom: 1px solid #dee2e6;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .manual-submit {
            margin-top: 30px;
            padding: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
        }
        .submit-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 15px;
        }
        .submit-btn:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <div class="redirect-container">
        <h1>🏪 正在跳轉至ECPay收銀台</h1>
        
        <div class="order-info">
            <div class="info-row">
                <span>訂單編號:</span>
                <span>${order.external_order_id}</span>
            </div>
            <div class="info-row">
                <span>付款金額:</span>
                <span>NT$ ${order.amount}</span>
            </div>
            <div class="info-row">
                <span>商品資訊:</span>
                <span>${order.product_info}</span>
            </div>
        </div>
        
        <div class="loading-spinner"></div>
        <p>系統正在自動跳轉，請稍候...</p>
        
        <!-- 自動提交表單 -->
        <form id="ecpayForm" method="POST" action="https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5" style="display: none;">
            ${hiddenInputs}
        </form>
        
        <!-- 手動提交備案 -->
        <div id="manualSubmit" class="manual-submit" style="display: none;">
            <h3>⚠️ 自動跳轉失敗</h3>
            <p>請點擊下方按鈕手動前往ECPay收銀台</p>
            <button type="button" class="submit-btn" onclick="submitForm()">前往ECPay付款</button>
        </div>
    </div>
    
    <script>
        let autoSubmitted = false;
        
        function submitForm() {
            if (!autoSubmitted) {
                autoSubmitted = true;
                console.log('提交ECPay表單');
                document.getElementById('ecpayForm').submit();
            }
        }
        
        // 頁面載入後自動提交
        window.addEventListener('load', function() {
            console.log('頁面載入完成，準備跳轉至ECPay');
            
            // 延遲2秒後自動提交，給用戶看到跳轉訊息的時間
            setTimeout(function() {
                submitForm();
            }, 2000);
            
            // 10秒後顯示手動提交選項
            setTimeout(function() {
                if (!autoSubmitted) {
                    document.getElementById('manualSubmit').style.display = 'block';
                }
            }, 10000);
        });
    </script>
</body>
</html>
    `);
    
  } catch (error) {
    console.error('ECPay重定向失敗:', error);
    res.status(500).send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>重定向錯誤</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px;">
    <h1 style="color: red;">❌ 跳轉失敗</h1>
    <p>無法跳轉至ECPay收銀台</p>
    <p style="color: #666; font-size: 14px;">錯誤詳情: ${error.message}</p>
    <a href="/test-ecpay" style="color: blue;">返回測試頁面</a>
</body>
</html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || '伺服器內部錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// SPA fallback for production - serve index.html for non-API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // If it's an API route, return 404 JSON
    if (req.path.startsWith('/api/')) {
      res.status(404).json({
        error: true,
        message: '找不到請求的API端點'
      });
    } else {
      // For all other routes, serve the React app
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({
      error: true,
      message: '找不到請求的API端點'
    });
  });
}

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔧 初始化數據庫...');
    console.log('🌐 環境變數檢查:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   PORT: ${PORT}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ 已設定' : '❌ 未設定'}`);
    console.log(`   BASE_URL: ${process.env.BASE_URL || '未設定'}`);
    
    await initializeDatabase();
    console.log('✅ 數據庫初始化完成');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Corba 3C Shop API Server 正在運行');
      console.log(`📍 Server: http://0.0.0.0:${PORT}`);
      console.log(`🏥 Health: http://0.0.0.0:${PORT}/api/health`);
      console.log(`🧪 Barcode Test: http://0.0.0.0:${PORT}/test-barcode`);
      console.log(`🛍️ 環境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origin: ${process.env.NODE_ENV === 'production' ? (process.env.FRONTEND_URL || 'all origins') : 'development origins'}`);
      console.log(`📁 Dist directory exists: ${fs.existsSync(path.join(__dirname, '../dist'))}`);
      console.log(`📄 Index.html exists: ${fs.existsSync(path.join(__dirname, '../dist/index.html'))}`);
    });
    
    // 處理服務器錯誤
    server.on('error', (error) => {
      console.error('❌ 服務器錯誤:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被使用`);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ 服務器啟動失敗:', error);
    console.error('錯誤詳情:', error.stack);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 收到SIGTERM信號，正在關閉服務器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 收到SIGINT信號，正在關閉服務器...');
  process.exit(0);
}); 