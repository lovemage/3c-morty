# 第三方系統整合測試指南

## 概述

本文件提供完整的第三方系統整合測試流程，包含環境設定、API 測試、錯誤處理和生產部署準備。

## 測試環境準備

### 1. 本地開發環境

```bash
# 1. 啟動服務
npm run dev

# 2. 確認服務運行
curl http://localhost:3001/api/health

# 3. 查看啟動日誌獲取測試 API Key
# 日誌會顯示：🔑 測試 API Key 已建立: test-api-key-xxxxxx
```

### 2. 環境變數設定

建立 `.env` 檔案：

```bash
# ECPay 設定 (請聯絡管理員取得正式參數)
ECPAY_MERCHANT_ID=YOUR_MERCHANT_ID
ECPAY_HASH_KEY=YOUR_HASH_KEY
ECPAY_HASH_IV=YOUR_HASH_IV

# 回調 URL (部署後需更新為真實 URL)
ECPAY_RETURN_URL=http://localhost:3001/api/third-party/ecpay/callback
ECPAY_PAYMENT_INFO_URL=http://localhost:3001/api/third-party/ecpay/payment-info

# 基礎 URL
BASE_URL=http://localhost:3001

# JWT 密鑰
JWT_SECRET=your-super-secret-key-change-in-production

# 環境設定
NODE_ENV=development
```

## API 測試步驟

### 階段一：基礎 API 功能測試

#### 1.1 健康檢查

```bash
curl -X GET http://localhost:3001/api/health
```

**預期回應：**
```json
{
  "status": "OK",
  "message": "Corba 3C Shop API is running!",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### 1.2 API Key 驗證測試

```bash
# 測試無 API Key 請求 (應該失敗)
curl -X POST http://localhost:3001/api/third-party/orders/create \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "product_info": "test", "client_order_id": "test-001"}'

# 測試錯誤的 API Key (應該失敗)
curl -X POST http://localhost:3001/api/third-party/orders/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid-key" \
  -d '{"amount": 1000, "product_info": "test", "client_order_id": "test-001"}'
```

### 階段二：訂單建立和查詢測試

#### 2.1 建立第三方訂單

```bash
curl -X POST http://localhost:3001/api/third-party/orders/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "amount": 3000,
    "product_info": "測試商品 - iPhone 充電線",
    "client_order_id": "TEST-ORDER-001",
    "callback_url": "https://your-system.com/webhook/payment-callback"
  }'
```

**預期回應：**
```json
{
  "success": true,
  "data": {
    "order_id": 1,
    "merchant_trade_no": "TP1640123456ABC",
    "payment_url": "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
    "payment_params": {
      "MerchantID": "YOUR_MERCHANT_ID",
      "MerchantTradeNo": "TP1640123456ABC",
      "CheckMacValue": "...",
      "ChoosePayment": "CVS"
    },
    "expire_date": "2025-01-08T12:00:00.000Z",
    "customer_info_url": "http://localhost:3001/customer-info/1"
  }
}
```

#### 2.2 查詢訂單狀態

```bash
curl -X GET http://localhost:3001/api/third-party/orders/1/status \
  -H "X-API-Key: YOUR_API_KEY"
```

#### 2.3 查詢訂單列表

```bash
# 基本查詢
curl -X GET "http://localhost:3001/api/third-party/orders" \
  -H "X-API-Key: YOUR_API_KEY"

# 帶篩選條件
curl -X GET "http://localhost:3001/api/third-party/orders?status=pending&page=1&limit=10" \
  -H "X-API-Key: YOUR_API_KEY"
```

### 階段三：錯誤處理測試

#### 3.1 參數驗證測試

```bash
# 測試缺少必要參數
curl -X POST http://localhost:3001/api/third-party/orders/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"amount": 1000}'

# 測試金額超出範圍
curl -X POST http://localhost:3001/api/third-party/orders/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "amount": 2000000,
    "product_info": "test",
    "client_order_id": "test-002"
  }'

# 測試重複訂單號
curl -X POST http://localhost:3001/api/third-party/orders/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "amount": 1000,
    "product_info": "test",
    "client_order_id": "TEST-ORDER-001"
  }'
```

#### 3.2 費率限制測試

建立一個簡單的腳本來測試費率限制：

```javascript
// rate-limit-test.js
const BASE_URL = 'http://localhost:3001';
const API_KEY = 'YOUR_API_KEY';

async function testRateLimit() {
  const requests = Array.from({length: 150}, (_, i) => 
    fetch(`${BASE_URL}/api/third-party/orders`, {
      headers: { 'X-API-Key': API_KEY }
    })
  );

  const results = await Promise.allSettled(requests);
  const rateLimited = results.filter(r => 
    r.status === 'fulfilled' && r.value.status === 429
  );

  console.log(`總請求: ${requests.length}`);
  console.log(`被限制請求: ${rateLimited.length}`);
}

testRateLimit();
```

### 階段四：ECPay 付款流程測試

#### 4.1 付款頁面訪問測試

1. 建立訂單後，複製回應中的 `payment_url`
2. 在瀏覽器中開啟該 URL
3. 確認能正確顯示 ECPay 付款頁面
4. 選擇「超商代碼繳費」選項

#### 4.2 模擬付款回調測試

```bash
# 注意：這個回調通常由 ECPay 發送，這裡是手動模擬
curl -X POST http://localhost:3001/api/third-party/ecpay/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'MerchantID=YOUR_MERCHANT_ID&MerchantTradeNo=TP1640123456ABC&TradeNo=ECPay123&PaymentDate=2025/01/01%2012:00:00&PaymentType=CVS_CVS&RtnCode=1&RtnMsg=付款成功&CheckMacValue=CORRECT_MAC_VALUE'
```

**注意：** 真實的 CheckMacValue 需要根據 ECPay 規則計算，測試時可能會驗證失敗。

### 階段五：客戶資料收集測試

#### 5.1 客戶資料頁面訪問

```bash
# 取得客戶資料頁面資訊
curl -X GET http://localhost:3001/api/customer-info/1
```

#### 5.2 填寫客戶資料

```bash
curl -X POST http://localhost:3001/api/customer-info/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "張三",
    "phone": "0912345678",
    "address": "中正路123號",
    "city": "台北市",
    "postal_code": "10001",
    "email": "test@example.com"
  }'
```

#### 5.3 匯出客戶資料

```bash
# JSON 格式匯出
curl -X GET http://localhost:3001/api/customer-info/1/export

# CSV 格式匯出
curl -X GET "http://localhost:3001/api/customer-info/1/export?format=csv"
```

## 整合測試腳本

### 完整自動化測試腳本

```javascript
// integration-test.js
const BASE_URL = 'http://localhost:3001';
const API_KEY = 'YOUR_API_KEY'; // 從啟動日誌獲取

class IntegrationTester {
  constructor() {
    this.testResults = [];
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 測試: ${name}`);
    try {
      await testFn();
      this.testResults.push({ name, status: 'PASS' });
      console.log(`✅ ${name} - 通過`);
    } catch (error) {
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ ${name} - 失敗: ${error.message}`);
    }
  }

  async testHealthCheck() {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    if (!data.status === 'OK') throw new Error('健康檢查失敗');
  }

  async testCreateOrder() {
    const response = await fetch(`${BASE_URL}/api/third-party/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        amount: 2500,
        product_info: '整合測試商品',
        client_order_id: `INT-TEST-${Date.now()}`,
        callback_url: 'https://webhook.site/test'
      })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    this.testOrderId = data.data.order_id;
    this.testMerchantTradeNo = data.data.merchant_trade_no;
  }

  async testOrderQuery() {
    const response = await fetch(`${BASE_URL}/api/third-party/orders/${this.testOrderId}/status`, {
      headers: { 'X-API-Key': API_KEY }
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    if (data.data.status !== 'pending') throw new Error('訂單狀態異常');
  }

  async testInvalidApiKey() {
    const response = await fetch(`${BASE_URL}/api/third-party/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid-key'
      },
      body: JSON.stringify({
        amount: 1000,
        product_info: 'test',
        client_order_id: 'test'
      })
    });

    if (response.status !== 401) throw new Error('API Key 驗證未正常工作');
  }

  async testParameterValidation() {
    const response = await fetch(`${BASE_URL}/api/third-party/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        amount: -1000, // 無效金額
        product_info: 'test'
        // 缺少 client_order_id
      })
    });

    if (response.status !== 400) throw new Error('參數驗證未正常工作');
  }

  async testCustomerInfoAccess() {
    const response = await fetch(`${BASE_URL}/api/customer-info/${this.testOrderId}`);
    const data = await response.json();
    
    // 由於訂單是 pending 狀態，應該返回錯誤
    if (data.error !== true) throw new Error('客戶資料頁面存取控制異常');
  }

  async runAllTests() {
    console.log('🚀 開始整合測試\n');

    await this.runTest('健康檢查', () => this.testHealthCheck());
    await this.runTest('建立訂單', () => this.testCreateOrder());
    await this.runTest('查詢訂單', () => this.testOrderQuery());
    await this.runTest('無效 API Key', () => this.testInvalidApiKey());
    await this.runTest('參數驗證', () => this.testParameterValidation());
    await this.runTest('客戶資料存取控制', () => this.testCustomerInfoAccess());

    console.log('\n📊 測試結果總結:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.status}`);
      if (result.error) console.log(`   錯誤: ${result.error}`);
    });

    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const totalTests = this.testResults.length;
    console.log(`\n總計: ${passedTests}/${totalTests} 測試通過`);

    if (this.testOrderId) {
      console.log(`\n📝 測試訂單 ID: ${this.testOrderId}`);
      console.log(`📝 商戶交易號: ${this.testMerchantTradeNo}`);
      console.log(`🔗 客戶資料頁面: ${BASE_URL}/customer-info/${this.testOrderId}`);
    }
  }
}

// 執行測試
const tester = new IntegrationTester();
tester.runAllTests().catch(console.error);
```

### 執行整合測試

```bash
# 1. 確保服務器正在運行
npm run server

# 2. 在另一個終端執行測試
node integration-test.js
```

## 生產環境部署前檢查

### 1. 環境設定檢查

```bash
# 檢查清單
□ 設定正確的 ECPay 商戶資訊
□ 設定 HTTPS 域名和憑證
□ 更新 ECPay 回調 URL 為正式域名
□ 設定強密碼的 JWT_SECRET
□ 設定 NODE_ENV=production
□ 配置防火牆和安全群組
□ 設定 CORS 允許的來源網域
```

### 2. ECPay 回調 URL 設定

在 ECPay 後台設定回調 URL：
- 付款結果通知: `https://your-domain.com/api/third-party/ecpay/callback`
- 付款資訊通知: `https://your-domain.com/api/third-party/ecpay/payment-info`

### 3. 安全性檢查

```bash
# 測試 HTTPS 連線
curl https://your-domain.com/api/health

# 檢查安全標頭
curl -I https://your-domain.com/api/health

# 測試 CORS 設定
curl -H "Origin: https://unauthorized-domain.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://your-domain.com/api/third-party/orders/create
```

### 4. 效能測試

```bash
# 使用 Apache Bench 進行負載測試
ab -n 1000 -c 10 \
   -H "X-API-Key: YOUR_API_KEY" \
   https://your-domain.com/api/third-party/orders

# 或使用 Artillery.js
npm install -g artillery
artillery quick --count 10 --num 100 https://your-domain.com/api/health
```

## 監控和日誌

### 1. 關鍵指標監控

- API 回應時間
- 訂單建立成功率
- ECPay 回調成功率
- 錯誤率和類型分佈
- API Key 使用情況

### 2. 日誌分析

```bash
# 查看安全日誌
grep "SECURITY" server.log

# 查看 ECPay 相關日誌
grep "ECPay" server.log

# 查看錯誤日誌
grep "ERROR" server.log
```

## 故障排除

### 常見問題和解決方案

#### 1. ECPay 回調驗證失敗
```
錯誤: CheckMacValue 驗證失敗
解決: 檢查 HashKey、HashIV 是否正確，確認參數編碼方式
```

#### 2. 訂單狀態未更新
```
錯誤: 付款完成但訂單狀態仍為 pending
解決: 檢查 ECPay 回調 URL 是否可正常存取
```

#### 3. 客戶資料頁面無法存取
```
錯誤: 404 或無法載入頁面
解決: 確認前端路由設定和靜態檔案服務
```

#### 4. API Key 驗證問題
```
錯誤: 401 Unauthorized
解決: 檢查 API Key 格式、資料庫記錄、IP 限制設定
```

## 聯絡支援

遇到技術問題時，請提供以下資訊：

1. 錯誤訊息和完整日誌
2. API 請求和回應內容
3. 系統環境資訊
4. 重現步驟

技術支援信箱：support@your-company.com