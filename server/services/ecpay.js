import crypto from 'crypto';
import { allAsync, runSQL, getAsync } from '../database/database-adapter.js';

// ECPay 設定 (正式環境配置)
const ECPAY_CONFIG = {
  merchantID: process.env.ECPAY_MERCHANT_ID || '3466445',
  hashKey: process.env.ECPAY_HASH_KEY || 'u0mKtzqI07btGNNT',
  hashIV: process.env.ECPAY_HASH_IV || 'ZjAbsWWZUvOu8NA0',
  testMode: false, // 使用正式環境
  apiUrl: 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5', // 正式環境
  returnURL: process.env.ECPAY_RETURN_URL || 'https://corba3c-production.up.railway.app/api/third-party/ecpay/callback',
  paymentInfoURL: process.env.ECPAY_PAYMENT_INFO_URL || 'https://corba3c-production.up.railway.app/api/third-party/ecpay/payment-info'
};

/**
 * 格式化日期為綠界要求的格式 yyyy/MM/dd HH:mm:ss
 */
function formatECPayDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 產生 CheckMacValue
 */
function generateCheckMacValue(params, hashKey, hashIV) {
  // 移除 CheckMacValue 參數
  const filteredParams = { ...params };
  delete filteredParams.CheckMacValue;

  // 依照字母順序排序參數
  const sortedKeys = Object.keys(filteredParams).sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  // 建立查詢字串
  const queryString = sortedKeys
    .map(key => `${key}=${filteredParams[key]}`)
    .join('&');

  // 前後加上 HashKey 和 HashIV
  const stringToHash = `HashKey=${hashKey}&${queryString}&HashIV=${hashIV}`;

  // URL encode (根據綠界規範)
  const encodedString = encodeURIComponent(stringToHash)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    })
    .toLowerCase(); // 綠界要求小寫

  // SHA256 雜湊並轉大寫
  return crypto.createHash('sha256').update(encodedString).digest('hex').toUpperCase();
}

/**
 * 驗證 CheckMacValue
 */
function verifyCheckMacValue(params, hashKey, hashIV) {
  const receivedMac = params.CheckMacValue;
  const calculatedMac = generateCheckMacValue(params, hashKey, hashIV);
  return receivedMac === calculatedMac;
}

/**
 * 建立 ECPay CVS 訂單
 */
export async function createCVSOrder(orderData) {
  const { 
    thirdPartyOrderId, 
    amount, 
    productInfo, 
    clientSystem 
  } = orderData;

  // 產生唯一的商店交易編號（確保符合ECPay 20字符限制）
  const timestamp = Date.now().toString().slice(-10); // 取時間戳後10位
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4位隨機字符
  const merchantTradeNo = `TP${timestamp}${randomStr}`; // 總長度: 2+10+4=16字符
  
  // 計算到期時間（7天後）
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + 7);

  // ECPay 參數 (根據綠界 BARCODE 規範)
  const params = {
    MerchantID: ECPAY_CONFIG.merchantID,
    MerchantTradeNo: merchantTradeNo,
    MerchantTradeDate: formatECPayDate(new Date()),
    PaymentType: 'aio',
    TotalAmount: amount,
    TradeDesc: `金流代收服務`,
    ItemName: productInfo.length > 400 ? productInfo.substring(0, 397) + '...' : productInfo,
    ReturnURL: ECPAY_CONFIG.returnURL,
    ChoosePayment: 'BARCODE',
    EncryptType: 1,
    StoreExpireDate: 7, // 7天期限 (以天為單位)
    PaymentInfoURL: ECPAY_CONFIG.paymentInfoURL
  };

  // 產生 CheckMacValue
  params.CheckMacValue = generateCheckMacValue(params, ECPAY_CONFIG.hashKey, ECPAY_CONFIG.hashIV);

  try {
    // 儲存 ECPay 交易記錄
    const result = runSQL(`
      INSERT INTO ecpay_transactions (
        third_party_order_id, merchant_trade_no, amount, raw_response
      ) VALUES (?, ?, ?, ?)
    `, [thirdPartyOrderId, merchantTradeNo, amount, JSON.stringify(params)]);

    // 更新第三方訂單
    runSQL(`
      UPDATE third_party_orders 
      SET payment_url = ?, expire_date = ?
      WHERE id = ?
    `, [ECPAY_CONFIG.apiUrl, expireDate.toISOString(), thirdPartyOrderId]);

    return {
      success: true,
      merchantTradeNo,
      paymentUrl: ECPAY_CONFIG.apiUrl,
      paymentParams: params,
      expireDate: expireDate.toISOString()
    };

  } catch (error) {
    console.error('ECPay 訂單建立失敗:', error);
    throw new Error('付款訂單建立失敗');
  }
}

/**
 * 處理 ECPay 付款結果回調
 */
export async function handlePaymentCallback(callbackData) {
  console.log('收到 ECPay 回調:', callbackData);

  // 驗證 CheckMacValue
  if (!verifyCheckMacValue(callbackData, ECPAY_CONFIG.hashKey, ECPAY_CONFIG.hashIV)) {
    console.error('CheckMacValue 驗證失敗');
    return { success: false, message: '驗證失敗' };
  }

  const { 
    MerchantTradeNo, 
    TradeNo, 
    PaymentDate, 
    PaymentType,
    RtnCode, 
    RtnMsg 
  } = callbackData;

  try {
    // 查找對應的交易記錄
    const transaction = getAsync(`
      SELECT et.*, tpo.id as order_id, tpo.callback_url, tpo.external_order_id, tpo.client_system
      FROM ecpay_transactions et
      JOIN third_party_orders tpo ON et.third_party_order_id = tpo.id
      WHERE et.merchant_trade_no = ?
    `, [MerchantTradeNo]);

    if (!transaction) {
      console.error('找不到對應的交易記錄:', MerchantTradeNo);
      return { success: false, message: '找不到交易記錄' };
    }

    // 更新交易記錄
    runSQL(`
      UPDATE ecpay_transactions 
      SET trade_no = ?, payment_type = ?, payment_date = ?, 
          response_code = ?, response_msg = ?, raw_response = ?
      WHERE merchant_trade_no = ?
    `, [
      TradeNo, 
      PaymentType, 
      PaymentDate, 
      RtnCode, 
      RtnMsg, 
      JSON.stringify(callbackData),
      MerchantTradeNo
    ]);

    // 如果付款成功，更新訂單狀態
    if (RtnCode === '1') {
      const paidAt = new Date().toISOString();
      
      runSQL(`
        UPDATE third_party_orders 
        SET status = 'paid', paid_at = ?
        WHERE id = ?
      `, [paidAt, transaction.order_id]);

      // 同時更新關聯的內部訂單狀態
      if (transaction.internal_order_id) {
        runSQL(`
          UPDATE orders 
          SET status = 'processing', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [transaction.internal_order_id]);
      }

      console.log('訂單付款成功:', MerchantTradeNo);

      // 自動建立買家資料 (金流服務自動處理)
      await createAutoCustomerInfo(transaction.order_id);

      // 如果有回調網址，通知第三方系統 (新格式)
      if (transaction.callback_url) {
        const paymentCode = generatePaymentCode(transaction.order_id, transaction.created_at);
        await notifyThirdPartyPayment(transaction, paymentCode, paidAt);
      }
    }

    return { success: true, message: '處理完成' };

  } catch (error) {
    console.error('處理付款回調失敗:', error);
    return { success: false, message: '處理失敗' };
  }
}

/**
 * 通知第三方系統 (金流服務格式)
 */
async function notifyThirdPartyPayment(transaction, paymentCode, paidAt) {
  try {
    // 查詢 API Key 用於簽名
    const apiKeyInfo = getAsync(
      'SELECT api_key FROM api_keys WHERE client_system = ? AND is_active = 1',
      [transaction.client_system]
    );

    if (!apiKeyInfo) {
      console.error('找不到客戶端 API Key，無法生成簽名');
      return;
    }

    // 生成簽名
    const signature = generateNotificationSignature(
      paymentCode, 
      transaction.external_order_id, 
      transaction.amount, 
      paidAt, 
      apiKeyInfo.api_key
    );

    const notificationData = {
      event: 'payment.completed',
      payment_id: paymentCode,
      external_ref: transaction.external_order_id,
      amount: transaction.amount,
      paid_at: paidAt,
      signature: signature
    };

    const response = await fetch(transaction.callback_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData)
    });

    if (response.ok) {
      console.log('第三方付款通知成功:', paymentCode);
    } else {
      console.error('第三方付款通知失敗:', response.status);
    }
  } catch (error) {
    console.error('第三方付款通知錯誤:', error);
  }
}

/**
 * 自動建立買家資料 (金流服務內部處理)
 */
async function createAutoCustomerInfo(orderId) {
  try {
    // 檢查是否已存在
    const existingCustomer = getAsync(
      'SELECT id FROM third_party_customers WHERE third_party_order_id = ?',
      [orderId]
    );

    if (existingCustomer) {
      return; // 已存在，不重複建立
    }

    // 自動建立預設買家資料
    runSQL(`
      INSERT INTO third_party_customers (
        third_party_order_id, name, phone, address, city, postal_code, email
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId,
      '金流服務客戶',
      '0000000000',
      '待客戶更新',
      '待填寫',
      '00000',
      null
    ]);

    console.log('自動建立買家資料:', orderId);
  } catch (error) {
    console.error('自動建立買家資料失敗:', error);
  }
}

/**
 * 生成付款代碼
 */
function generatePaymentCode(internalId, createdAt) {
  const date = new Date(createdAt).toISOString().slice(0, 10).replace(/-/g, '');
  return `PAY${date}${String(internalId).padStart(3, '0')}`;
}

/**
 * 生成通知簽名
 */
function generateNotificationSignature(paymentId, externalRef, amount, paidAt, apiKey) {
  const data = paymentId + externalRef + amount + paidAt;
  return crypto.createHash('sha256').update(data + apiKey).digest('hex');
}

/**
 * 查詢訂單狀態
 */
export function getOrderStatus(merchantTradeNo) {
  const result = getAsync(`
    SELECT et.*, tpo.status, tpo.external_order_id, tpo.client_system
    FROM ecpay_transactions et
    JOIN third_party_orders tpo ON et.third_party_order_id = tpo.id
    WHERE et.merchant_trade_no = ?
  `, [merchantTradeNo]);

  return result;
}

/**
 * 建立 ECPay BARCODE 訂單（便利店付款）
 * 使用Server端API直接獲取條碼資訊，無需跳轉ECPay頁面
 */
export async function createBarcodeOrder(orderData) {
  const { 
    thirdPartyOrderId, 
    merchantTradeNo,
    amount, 
    productInfo, 
    clientSystem,
    storeType,
    customerInfo
  } = orderData;

  // 計算到期時間（7天後）
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + 7);

  // ECPay 條碼API參數
  const params = {
    MerchantID: ECPAY_CONFIG.merchantID,
    MerchantTradeNo: merchantTradeNo,
    MerchantTradeDate: formatECPayDate(new Date()),
    PaymentType: 'aio',
    TotalAmount: amount,
    TradeDesc: `${storeType}便利店條碼付款`,
    ItemName: productInfo.length > 400 ? productInfo.substring(0, 397) + '...' : productInfo,
    ReturnURL: ECPAY_CONFIG.returnURL,
    ChoosePayment: 'BARCODE',
    EncryptType: 1,
    StoreExpireDate: 7, // 7天期限 (以天為單位)
    PaymentInfoURL: ECPAY_CONFIG.paymentInfoURL
  };

  // 根據便利店類型設定額外參數
  if (storeType) {
    // 可以根據不同便利店類型做特殊設定
    switch (storeType) {
      case 'FAMILY':
        params.Desc_1 = '全家便利商店';
        break;
      case '7ELEVEN':
        params.Desc_1 = '7-ELEVEN';
        break;
      case 'HILIFE':
        params.Desc_1 = '萊爾富便利商店';
        break;
      case 'OKMART':
        params.Desc_1 = 'OK便利商店';
        break;
    }
  }

  // 產生 CheckMacValue
  params.CheckMacValue = generateCheckMacValue(params, ECPAY_CONFIG.hashKey, ECPAY_CONFIG.hashIV);

  try {
    // 使用真實的綠界支付流程

    // 使用fetch向綠界API發送POST請求
    const formData = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    console.log('向綠界發送BARCODE請求:', params);
    
    const response = await fetch(ECPAY_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      },
      body: formData.toString()
    });

    const responseText = await response.text();
    console.log('綠界Server端API回應:', responseText);

    // 處理綠界API的回應 - 直接返回ECPay頁面模式
    if (response.ok) {
      console.log('綠界回應成功，狀態碼:', response.status);
      
      // 構建ECPay付款頁面URL（帶參數的POST表單提交URL）
      const ecpayPageUrl = buildECPayFormURL(params);
      
      console.log('綠界BARCODE訂單建立成功，返回ECPay頁面URL');
      
      return {
        success: true,
        mode: 'ecpay_redirect', // 直接跳轉ECPay模式
        merchantTradeNo,
        paymentForm: ecpayPageUrl, // ECPay表單資訊
        paymentParams: params,
        expireDate: expireDate.toISOString(),
        ecpayResponse: responseText.substring(0, 200),
        message: '請使用paymentForm資訊建立POST表單跳轉到ECPay頁面'
      };
    } else {
      console.error('綠界API回應錯誤:', response.status, responseText);
      throw new Error('綠界BARCODE訂單建立失敗: ' + response.status);
    }

  } catch (error) {
    console.error('ECPay BARCODE 訂單建立失敗:', error);
    throw new Error('便利店條碼付款訂單建立失敗: ' + error.message);
  }
}

/**
 * 模擬綠界 BARCODE API 回應
 * 在正式環境中，這應該是實際的 HTTP 請求到綠界 API
 */
async function simulateECPayBarcodeAPI(params) {
  // 模擬 API 延遲
  await new Promise(resolve => setTimeout(resolve, 100));

  // 模擬成功回應 (實際環境中應該替換為真實的 ECPay API 請求)
  const mockBarcode = generateMockBarcode();
  const mockTradeNo = `EC${Date.now()}${Math.random().toString(36).substring(2, 6)}`;

  return {
    success: true,
    tradeNo: mockTradeNo,
    barcode: mockBarcode,
    barcodeUrl: `https://payment-stage.ecpay.com.tw/SP/CreateQRCode?qdata=${encodeURIComponent(mockBarcode)}`,
    message: 'BARCODE建立成功',
    expireDate: params.StoreExpireDate
  };
}

/**
 * 構建ECPay付款資訊
 * 返回ECPay URL和表單參數，供前端建立POST表單
 */
function buildECPayFormURL(params) {
  return {
    action: ECPAY_CONFIG.apiUrl,
    method: 'POST',
    params: params
  };
}

/**
 * 生成模擬條碼數據
 */
function generateMockBarcode() {
  // 生成一個類似綠界條碼格式的模擬條碼
  const prefix = '|ES|';
  const code = Math.random().toString(36).substring(2, 15).toUpperCase();
  const timestamp = Date.now().toString(36);
  return `${prefix}${code}${timestamp}`;
}

export { ECPAY_CONFIG };