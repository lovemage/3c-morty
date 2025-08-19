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
            <h3>🚀 快速測試</h3>
            <p>選擇測試金額，系統會自動建立訂單並顯示條碼網頁：</p>
            <div style="text-align: center;">
                <a href="/create-test-barcode?amount=100" class="test-btn">NT$ 100</a>
                <a href="/create-test-barcode?amount=299" class="test-btn">NT$ 299</a>
                <a href="/create-test-barcode?amount=500" class="test-btn">NT$ 500</a>
                <a href="/create-test-barcode?amount=1000" class="test-btn">NT$ 1000</a>
            </div>
            
            <div class="custom-form">
                <h4>💰 自訂金額測試</h4>
                <form action="/create-test-barcode" method="GET" style="text-align: center;">
                    <input type="number" name="amount" placeholder="輸入金額 (1-6000)" min="1" max="6000" required>
                    <button type="submit" class="test-btn">建立條碼訂單</button>
                </form>
            </div>
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
            <a href="/test-ecpay" class="test-btn secondary">🔄 ECPay原始測試</a>
            <a href="/api/health" class="test-btn secondary">🏥 系統狀態</a>
        </div>
    </div>
</body>
</html>
  `);
});

// ECPay 測試表單選擇頁面
app.get('/test-ecpay', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ECPay 測試 - 選擇金額</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .amount-btn { 
            display: inline-block; 
            background: #4CAF50; 
            color: white; 
            padding: 15px 25px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px; 
            font-size: 18px;
            transition: background 0.3s;
        }
        .amount-btn:hover { background: #45a049; }
        h1 { text-align: center; color: #333; }
        p { text-align: center; color: #666; margin: 20px 0; }
        .custom-form { 
            border: 2px dashed #ddd; 
            padding: 20px; 
            border-radius: 10px; 
            margin-top: 30px;
            text-align: center;
        }
        input[type="number"] { 
            width: 200px; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 5px; 
            margin: 0 10px;
            font-size: 16px;
        }
        .custom-btn {
            background: #2196F3;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        }
        .custom-btn:hover { background: #1976D2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛒 ECPay 測試頁面</h1>
        <p>選擇測試金額，系統會自動建立訂單並跳轉到ECPay收銀台</p>
        
        <div style="text-align: center;">
            <a href="/generate-ecpay-form?amount=199" class="amount-btn">NT$ 199</a>
            <a href="/generate-ecpay-form?amount=299" class="amount-btn">NT$ 299</a>
            <a href="/generate-ecpay-form?amount=499" class="amount-btn">NT$ 499</a>
            <a href="/generate-ecpay-form?amount=999" class="amount-btn">NT$ 999</a>
        </div>
        
        <div class="custom-form">
            <h4>自訂金額</h4>
            <form action="/generate-ecpay-form" method="GET" style="display: inline;">
                <input type="number" name="amount" placeholder="輸入金額" min="1" max="6000" required>
                <button type="submit" class="custom-btn">建立訂單</button>
            </form>
        </div>
        
        <p style="font-size: 14px; color: #999;">
            ⚠️ 這會建立真實的ECPay訂單，請勿使用真實付款
        </p>
    </div>
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
            <a href="/api/third-party/orders/${orderId}/barcode" class="btn">📋 查看API資料</a>
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

// ECPay 表單生成端點 (伺服器端處理)
app.get('/generate-ecpay-form', async (req, res) => {
  const amount = parseInt(req.query.amount) || 299;
  
  if (amount < 1 || amount > 6000) {
    return res.status(400).send('金額必須在 1-6000 之間');
  }
  
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const clientOrderId = `server_test_${timestamp}_${randomId}`;
    
    // 生成更唯一的商家交易編號
    const uniqueTimestamp = Date.now().toString();
    const uniqueRandom = Math.random().toString(36).substring(2, 8).toUpperCase();
    const merchantTradeNo = `TEST${uniqueTimestamp.slice(-10)}${uniqueRandom}`;
    
    // 建立訂單 (直接呼叫API) - 使用絕對URL確保正確
    const apiUrl = 'https://corba3c-production.up.railway.app/api/third-party/barcode/create';
    console.log('呼叫API:', apiUrl);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
      },
      body: JSON.stringify({
        amount: amount,
        client_order_id: clientOrderId,
        callback_url: 'https://webhook.site/test'
      })
    });
    
    console.log('API回應狀態:', response.status);
    const orderResult = await response.json();
    console.log('API回應內容:', JSON.stringify(orderResult, null, 2));
    
    if (!response.ok || !orderResult.success) {
      const errorMsg = orderResult.message || `API呼叫失敗: ${response.status}`;
      console.error('API錯誤:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // 生成純HTML表單頁面 (無JavaScript)
    const ecpayForm = orderResult.data.ecpay_form;
    let hiddenInputs = '';
    
    Object.entries(ecpayForm.params).forEach(([key, value]) => {
      hiddenInputs += `<input type="hidden" name="${key}" value="${value}">`;
    });
    
    res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>跳轉到ECPay收銀台</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: white;
            color: #333;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: inline-block;
            min-width: 400px;
        }
        .btn { 
            background: #FF5722; 
            color: white; 
            padding: 20px 40px; 
            border: none; 
            border-radius: 8px; 
            font-size: 20px; 
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn:hover { 
            background: #E64A19; 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .info { 
            background: #e8f5e8; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 5px solid #4CAF50;
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #ffc107;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 準備跳轉到ECPay</h1>
        
        <div class="info">
            <h3>📋 訂單資訊</h3>
            <p><strong>金額：</strong>NT$ ${amount}</p>
            <p><strong>商品：</strong>伺服器測試商品</p>
            <p><strong>付款方式：</strong>7-ELEVEN條碼付款</p>
        </div>
        
        <div class="warning">
            <strong>⚠️ 注意：</strong>這會跳轉到真實的ECPay頁面，請勿進行實際付款
        </div>
        
        <form method="${ecpayForm.method}" action="${ecpayForm.action}">
            ${hiddenInputs}
            <button type="submit" class="btn">💳 跳轉到 ECPay 收銀台</button>
        </form>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
            點擊上方按鈕將跳轉到ECPay官方收銀台頁面
        </p>
    </div>
</body>
</html>
    `);
    
  } catch (error) {
    console.error('生成ECPay表單失敗:', error);
    res.status(500).send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>錯誤</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px;">
    <h1 style="color: red;">❌ 建立訂單失敗</h1>
    <p>${error.message}</p>
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
    await initializeDatabase();
    console.log('✅ 數據庫初始化完成');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Corba 3C Shop API Server 正在運行');
      console.log(`📍 Server: http://0.0.0.0:${PORT}`);
      console.log(`🏥 Health: http://0.0.0.0:${PORT}/api/health`);
      console.log(`🛍️ 環境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origin: ${process.env.NODE_ENV === 'production' ? (process.env.FRONTEND_URL || 'all origins') : 'development origins'}`);
      console.log(`📁 Dist directory exists: ${fs.existsSync(path.join(__dirname, '../dist'))}`);
      console.log(`📄 Index.html exists: ${fs.existsSync(path.join(__dirname, '../dist/index.html'))}`);
    });
  } catch (error) {
    console.error('❌ 服務器啟動失敗:', error);
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