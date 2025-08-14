// 完整的整合測試腳本
// 使用方法: 先啟動服務器，然後運行 node integration-test.js

const BASE_URL = 'http://localhost:3001';
const API_KEY = 'YOUR_API_KEY_HERE'; // 從啟動日誌獲取，請更新此值

class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.testOrderId = null;
    this.testMerchantTradeNo = null;
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  async runTest(name, testFn, critical = false) {
    this.log(`測試開始: ${name}`, 'info');
    try {
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.push({ name, status: 'PASS', duration });
      this.log(`${name} - 通過 (${duration}ms)`, 'success');
    } catch (error) {
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      this.log(`${name} - 失敗: ${error.message}`, 'error');
      
      if (critical) {
        this.log('關鍵測試失敗，停止後續測試', 'error');
        throw error;
      }
    }
  }

  async makeRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { response, data };
  }

  // 測試 1: 系統健康檢查
  async testHealthCheck() {
    const { response, data } = await this.makeRequest(`${BASE_URL}/api/health`);
    
    if (!response.ok) {
      throw new Error(`健康檢查失敗: HTTP ${response.status}`);
    }
    
    if (data.status !== 'OK') {
      throw new Error(`健康檢查回應異常: ${JSON.stringify(data)}`);
    }
    
    this.log(`服務器狀態: ${data.message}`, 'info');
  }

  // 測試 2: API Key 驗證機制
  async testApiKeyValidation() {
    // 測試無 API Key
    const { response: noKeyResp } = await this.makeRequest(
      `${BASE_URL}/api/third-party/orders`,
      { headers: {} }
    );
    
    if (noKeyResp.status !== 401) {
      throw new Error('缺少 API Key 時應返回 401');
    }

    // 測試錯誤 API Key
    const { response: badKeyResp } = await this.makeRequest(
      `${BASE_URL}/api/third-party/orders`,
      { headers: { 'X-API-Key': 'invalid-key-12345' } }
    );
    
    if (badKeyResp.status !== 401) {
      throw new Error('錯誤 API Key 時應返回 401');
    }

    // 測試正確 API Key
    const { response: goodKeyResp } = await this.makeRequest(
      `${BASE_URL}/api/third-party/orders`,
      { headers: { 'X-API-Key': API_KEY } }
    );
    
    if (goodKeyResp.status === 401) {
      throw new Error('正確的 API Key 被拒絕，請檢查 API_KEY 設定');
    }
  }

  // 測試 3: 建立第三方訂單
  async testCreateOrder() {
    const orderData = {
      amount: 2888,
      product_info: '整合測試商品 - MacBook Pro 充電器',
      client_order_id: `INT-TEST-${Date.now()}`,
      callback_url: 'https://webhook.site/integration-test'
    };

    const { response, data } = await this.makeRequest(
      `${BASE_URL}/api/third-party/orders/create`,
      {
        method: 'POST',
        headers: { 'X-API-Key': API_KEY },
        body: JSON.stringify(orderData)
      }
    );

    if (!response.ok) {
      throw new Error(`訂單建立失敗: ${JSON.stringify(data)}`);
    }

    if (!data.success) {
      throw new Error(`訂單建立失敗: ${data.message}`);
    }

    // 驗證回應結構
    const requiredFields = ['order_id', 'merchant_trade_no', 'payment_url', 'expire_date'];
    for (const field of requiredFields) {
      if (!data.data[field]) {
        throw new Error(`回應缺少必要欄位: ${field}`);
      }
    }

    // 驗證 ECPay 參數
    if (!data.data.payment_params.MerchantID) {
      throw new Error('ECPay 商戶 ID 未設定');
    }

    if (data.data.payment_params.ChoosePayment !== 'CVS') {
      throw new Error('付款方式應為 CVS');
    }

    this.testOrderId = data.data.order_id;
    this.testMerchantTradeNo = data.data.merchant_trade_no;
    this.testExternalOrderId = orderData.client_order_id;

    this.log(`訂單已建立: ID=${this.testOrderId}, 商戶號=${this.testMerchantTradeNo}`, 'info');
    this.log(`付款頁面: ${data.data.payment_url}`, 'info');
  }

  // 測試 4: 查詢訂單狀態
  async testOrderQuery() {
    if (!this.testOrderId) {
      throw new Error('需要先建立測試訂單');
    }

    const { response, data } = await this.makeRequest(
      `${BASE_URL}/api/third-party/orders/${this.testOrderId}/status`,
      { headers: { 'X-API-Key': API_KEY } }
    );

    if (!response.ok) {
      throw new Error(`查詢訂單失敗: HTTP ${response.status}`);
    }

    if (!data.success) {
      throw new Error(`查詢訂單失敗: ${data.message}`);
    }

    // 驗證訂單資料
    if (data.data.external_order_id !== this.testExternalOrderId) {
      throw new Error('外部訂單號不匹配');
    }

    if (data.data.status !== 'pending') {
      throw new Error(`預期訂單狀態為 pending，實際為 ${data.data.status}`);
    }

    if (data.data.amount !== 2888) {
      throw new Error(`訂單金額不匹配，預期 2888，實際 ${data.data.amount}`);
    }

    this.log(`訂單狀態: ${data.data.status}, 金額: ${data.data.amount}`, 'info');
  }

  // 測試 5: 查詢訂單列表
  async testOrderList() {
    const { response, data } = await this.makeRequest(
      `${BASE_URL}/api/third-party/orders?limit=5`,
      { headers: { 'X-API-Key': API_KEY } }
    );

    if (!response.ok) {
      throw new Error(`查詢訂單列表失敗: HTTP ${response.status}`);
    }

    if (!data.success) {
      throw new Error(`查詢訂單列表失敗: ${data.message}`);
    }

    if (!Array.isArray(data.data.orders)) {
      throw new Error('訂單列表格式錯誤');
    }

    if (!data.data.pagination) {
      throw new Error('缺少分頁資訊');
    }

    // 檢查是否包含剛建立的訂單
    const testOrder = data.data.orders.find(order => 
      order.external_order_id === this.testExternalOrderId
    );

    if (!testOrder) {
      throw new Error('新建立的訂單未出現在列表中');
    }

    this.log(`訂單列表: 共 ${data.data.orders.length} 筆`, 'info');
  }

  // 測試 6: 參數驗證
  async testParameterValidation() {
    const testCases = [
      {
        name: '缺少必要參數',
        data: { amount: 1000 }, // 缺少 product_info 和 client_order_id
        expectedStatus: 400
      },
      {
        name: '金額超出範圍',
        data: {
          amount: 2000000, // 超過最大值
          product_info: 'test',
          client_order_id: 'test-large-amount'
        },
        expectedStatus: 400
      },
      {
        name: '金額為負數',
        data: {
          amount: -100,
          product_info: 'test',
          client_order_id: 'test-negative'
        },
        expectedStatus: 400
      },
      {
        name: '重複的訂單號',
        data: {
          amount: 1000,
          product_info: 'test',
          client_order_id: this.testExternalOrderId // 使用已存在的訂單號
        },
        expectedStatus: 409
      }
    ];

    for (const testCase of testCases) {
      const { response } = await this.makeRequest(
        `${BASE_URL}/api/third-party/orders/create`,
        {
          method: 'POST',
          headers: { 'X-API-Key': API_KEY },
          body: JSON.stringify(testCase.data)
        }
      );

      if (response.status !== testCase.expectedStatus) {
        throw new Error(
          `${testCase.name}: 預期狀態碼 ${testCase.expectedStatus}, 實際 ${response.status}`
        );
      }
    }

    this.log('所有參數驗證測試通過', 'info');
  }

  // 測試 7: 客戶資料頁面存取
  async testCustomerInfoAccess() {
    if (!this.testOrderId) {
      throw new Error('需要先建立測試訂單');
    }

    // 測試未付款訂單的客戶資料存取（應該被拒絕）
    const { response, data } = await this.makeRequest(
      `${BASE_URL}/api/customer-info/${this.testOrderId}`
    );

    if (response.ok && data.success) {
      throw new Error('未付款訂單不應允許存取客戶資料頁面');
    }

    if (!data.error || data.order_status !== 'pending') {
      throw new Error('錯誤回應格式不正確');
    }

    this.log('客戶資料存取控制正常運作', 'info');
  }

  // 測試 8: ECPay 參數驗證
  async testECPayParameters() {
    if (!this.testOrderId) {
      throw new Error('需要先建立測試訂單');
    }

    // 重新查詢訂單以獲取 ECPay 參數
    const { data } = await this.makeRequest(
      `${BASE_URL}/api/third-party/orders/${this.testOrderId}/status`,
      { headers: { 'X-API-Key': API_KEY } }
    );

    const merchantTradeNo = data.data.merchant_trade_no;

    // 驗證商戶交易號格式（應該以 TP 開頭）
    if (!merchantTradeNo.startsWith('TP')) {
      throw new Error(`商戶交易號格式錯誤: ${merchantTradeNo}`);
    }

    // 驗證交易號長度
    if (merchantTradeNo.length < 10 || merchantTradeNo.length > 20) {
      throw new Error(`商戶交易號長度異常: ${merchantTradeNo.length}`);
    }

    this.log(`ECPay 參數驗證通過: ${merchantTradeNo}`, 'info');
  }

  // 測試 9: 安全性檢查
  async testSecurity() {
    // 測試 XSS 防護
    const xssPayload = {
      amount: 1000,
      product_info: '<script>alert("xss")</script>測試商品',
      client_order_id: `xss-test-${Date.now()}`
    };

    const { response, data } = await this.makeRequest(
      `${BASE_URL}/api/third-party/orders/create`,
      {
        method: 'POST',
        headers: { 'X-API-Key': API_KEY },
        body: JSON.stringify(xssPayload)
      }
    );

    if (response.ok && data.success) {
      // 檢查產品資訊是否被清理
      const cleanedInfo = data.data.product_info || xssPayload.product_info;
      if (cleanedInfo.includes('<script>')) {
        throw new Error('XSS 防護未正常工作');
      }
    }

    this.log('安全性檢查通過', 'info');
  }

  // 測試 10: 效能測試
  async testPerformance() {
    const concurrentRequests = 5;
    const requestPromises = [];

    this.log(`開始並發測試: ${concurrentRequests} 個請求`, 'info');

    for (let i = 0; i < concurrentRequests; i++) {
      const promise = this.makeRequest(
        `${BASE_URL}/api/third-party/orders`,
        { headers: { 'X-API-Key': API_KEY } }
      );
      requestPromises.push(promise);
    }

    const startTime = Date.now();
    const results = await Promise.allSettled(requestPromises);
    const duration = Date.now() - startTime;

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const avgResponseTime = duration / concurrentRequests;

    if (successCount < concurrentRequests * 0.8) {
      throw new Error(`並發測試成功率過低: ${successCount}/${concurrentRequests}`);
    }

    if (avgResponseTime > 5000) {
      throw new Error(`平均回應時間過長: ${avgResponseTime}ms`);
    }

    this.log(`並發測試完成: ${successCount}/${concurrentRequests} 成功, 平均 ${avgResponseTime.toFixed(0)}ms`, 'info');
  }

  // 執行所有測試
  async runAllTests() {
    console.log('🚀 開始第三方訂單 API 整合測試');
    console.log(`📅 測試時間: ${new Date().toLocaleString()}`);
    console.log(`🔧 測試環境: ${BASE_URL}`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`);
    console.log('─'.repeat(80));

    try {
      // 關鍵測試（失敗時停止後續測試）
      await this.runTest('系統健康檢查', () => this.testHealthCheck(), true);
      await this.runTest('API Key 驗證機制', () => this.testApiKeyValidation(), true);
      await this.runTest('建立第三方訂單', () => this.testCreateOrder(), true);

      // 一般測試
      await this.runTest('查詢訂單狀態', () => this.testOrderQuery());
      await this.runTest('查詢訂單列表', () => this.testOrderList());
      await this.runTest('參數驗證', () => this.testParameterValidation());
      await this.runTest('客戶資料存取控制', () => this.testCustomerInfoAccess());
      await this.runTest('ECPay 參數驗證', () => this.testECPayParameters());
      await this.runTest('安全性檢查', () => this.testSecurity());
      await this.runTest('效能測試', () => this.testPerformance());

    } catch (error) {
      this.log(`測試中斷: ${error.message}`, 'error');
    }

    // 顯示測試結果
    this.showTestResults();
  }

  showTestResults() {
    const totalDuration = Date.now() - this.startTime;
    console.log('\n' + '═'.repeat(80));
    console.log('📊 測試結果總結');
    console.log('═'.repeat(80));

    const passedTests = this.testResults.filter(r => r.status === 'PASS');
    const failedTests = this.testResults.filter(r => r.status === 'FAIL');

    // 顯示測試結果
    this.testResults.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      const duration = result.duration ? `(${result.duration}ms)` : '';
      console.log(`${icon} ${index + 1}. ${result.name} ${duration}`);
      
      if (result.error) {
        console.log(`    💬 ${result.error}`);
      }
    });

    console.log('\n📈 統計資訊:');
    console.log(`   總測試數: ${this.testResults.length}`);
    console.log(`   通過: ${passedTests.length} ✅`);
    console.log(`   失敗: ${failedTests.length} ❌`);
    console.log(`   成功率: ${(passedTests.length / this.testResults.length * 100).toFixed(1)}%`);
    console.log(`   總耗時: ${(totalDuration / 1000).toFixed(2)}s`);

    if (passedTests.length > 0) {
      const avgDuration = passedTests
        .filter(t => t.duration)
        .reduce((sum, t) => sum + t.duration, 0) / passedTests.length;
      console.log(`   平均回應時間: ${avgDuration.toFixed(0)}ms`);
    }

    // 顯示測試資源
    if (this.testOrderId) {
      console.log('\n🔗 測試資源:');
      console.log(`   測試訂單 ID: ${this.testOrderId}`);
      console.log(`   商戶交易號: ${this.testMerchantTradeNo}`);
      console.log(`   客戶資料頁面: ${BASE_URL}/customer-info/${this.testOrderId}`);
      console.log(`   管理介面: ${BASE_URL}/admin`);
    }

    // 顯示建議
    console.log('\n💡 下一步建議:');
    if (failedTests.length === 0) {
      console.log('   🎉 所有測試通過！系統已準備好進行生產部署');
      console.log('   📋 建議執行生產環境檢查清單');
      console.log('   🔧 設定監控和日誌系統');
    } else {
      console.log('   🔧 修復失敗的測試項目');
      console.log('   🔄 重新執行測試確認修復結果');
    }

    console.log('\n📚 更多資訊請參考:');
    console.log('   📖 INTEGRATION_TESTING_GUIDE.md');
    console.log('   📖 THIRD_PARTY_API.md');
    console.log('═'.repeat(80));
  }
}

// 檢查環境
if (API_KEY === 'YOUR_API_KEY_HERE') {
  console.log('❌ 請更新腳本中的 API_KEY 變數');
  console.log('請從服務器啟動日誌中找到 "測試 API Key 已建立" 訊息');
  console.log('然後將 API Key 貼上到腳本第 5 行的 API_KEY 變數中');
  process.exit(1);
}

// 執行測試
const tester = new IntegrationTester();
tester.runAllTests().catch(error => {
  console.error('\n💥 測試執行失敗:', error);
  process.exit(1);
});