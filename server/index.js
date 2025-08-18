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

// ECPay 測試頁面端點
app.get('/test-ecpay', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ECPay 生產環境測試</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .btn { background: #4CAF50; color: white; padding: 15px 25px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 10px 0; }
        .btn:hover { background: #45a049; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        #result { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; white-space: pre-wrap; }
        #checkoutForm { display: none; }
    </style>
</head>
<body>
    <h1>🏪 ECPay 生產環境測試</h1>
    
    <div class="form-group">
        <label for="amount">金額 (NT$)</label>
        <input type="number" id="amount" value="299" min="1" max="6000">
    </div>
    
    <button class="btn" onclick="createOrder()">建立訂單並測試ECPay跳轉</button>
    
    <div id="result"></div>
    
    <form id="checkoutForm" method="POST" target="_blank">
        <button type="submit" class="btn" style="background: #FF5722;">🚀 跳轉到 ECPay 收銀台</button>
    </form>

    <script>
        async function createOrder() {
            const amount = document.getElementById('amount').value;
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 10);
            const clientOrderId = \`prod_test_\${timestamp}_\${randomId}\`;
            
            try {
                const response = await fetch('/api/third-party/barcode/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': 'api-key-corba3c-prod-1755101802637fufedw01d8l'
                    },
                    body: JSON.stringify({
                        amount: parseInt(amount),
                        client_order_id: clientOrderId,
                        callback_url: window.location.origin + '/webhook-test'
                    })
                });
                
                const data = await response.json();
                const result = document.getElementById('result');
                
                if (response.ok && data.success) {
                    result.textContent = '✅ 訂單建立成功！\\n\\n訂單ID: ' + data.data.order_id + '\\n商家交易號: ' + data.data.merchant_trade_no;
                    setupECPayForm(data.data.ecpay_form);
                } else {
                    result.textContent = '❌ 建立失敗:\\n' + JSON.stringify(data, null, 2);
                }
            } catch (error) {
                document.getElementById('result').textContent = '❌ 請求失敗: ' + error.message;
            }
        }
        
        function setupECPayForm(ecpayForm) {
            const form = document.getElementById('checkoutForm');
            form.action = ecpayForm.action;
            form.innerHTML = '';
            
            Object.entries(ecpayForm.params).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });
            
            const submitBtn = document.createElement('button');
            submitBtn.type = 'submit';
            submitBtn.className = 'btn';
            submitBtn.style.background = '#FF5722';
            submitBtn.textContent = '🚀 跳轉到 ECPay 收銀台';
            form.appendChild(submitBtn);
            
            form.style.display = 'block';
        }
    </script>
</body>
</html>
  `);
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