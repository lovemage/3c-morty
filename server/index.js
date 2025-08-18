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