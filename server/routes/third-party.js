import express from 'express';
import { allAsync, runSQL, getAsync } from '../database/database-adapter.js';
import { createBarcodeOrder, handlePaymentCallback } from '../services/ecpay.js';
import { 
  apiKeyAuth, 
  rateLimiter, 
  requestValidator, 
  sanitizeInput,
  securityLog 
} from '../middleware/security.js';
import { apiCallLogger } from '../middleware/api-logger.js';
import { 
  generateCode39SVG, 
  generateMultiSegmentCode39SVG, 
  validateCode39Text 
} from '../utils/code39-generator.js';
import { queryAndUpdateBarcodeInfo } from '../services/ecpay.js';

const router = express.Router();

/**
 * POST /api/third-party/barcode/create
 * 第三方便利店條碼付款下單
 * 流程：第三方告知便利店類型和金額 → 向綠界下單 → 回傳BARCODE資料
 */
router.post('/barcode/create', 
  requestValidator, 
  sanitizeInput, 
  apiKeyAuth, 
  rateLimiter(), 
  apiCallLogger,
  async (req, res) => {
  try {
    const { 
      amount, 
      client_order_id,
      callback_url
    } = req.body;

    // 驗證和轉換金額
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (typeof numAmount !== 'number' || isNaN(numAmount) || numAmount <= 0 || numAmount > 6000) {
      return res.status(400).json({
        error: true,
        message: '金額必須是正整數，範圍為1-6000元'
      });
    }

    // 自動生成其他參數
    const product_info = `3C商品一組 - NT$${numAmount}`;
    const store_type = '7ELEVEN'; // 預設使用7-ELEVEN
    const customer_info = null; // 由客戶後續填寫

    // 記錄建立訂單請求
    securityLog('info', '第三方BARCODE訂單建立請求', req, {
      client_system: req.clientInfo.system,
      amount: numAmount,
      client_order_id
    });

    // 驗證必要參數
    if (!amount || !client_order_id) {
      securityLog('warn', '缺少必要參數', req);
      return res.status(400).json({
        error: true,
        message: '缺少必要參數: amount, client_order_id'
      });
    }

    // 便利店類型已自動設定為7-ELEVEN，無需驗證

    // 檢查是否已存在相同的外部訂單號
    const existingOrder = await getAsync(
      'SELECT id FROM third_party_orders WHERE external_order_id = ? AND client_system = ?',
      [client_order_id, req.clientInfo.system]
    );

    if (existingOrder) {
      return res.status(409).json({
        error: true,
        message: '訂單號已存在'
      });
    }

    // 建立第三方訂單記錄
    const result = await runSQL(`
      INSERT INTO third_party_orders (
        external_order_id, client_system, amount, product_info, callback_url, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `, [client_order_id, req.clientInfo.system, numAmount, product_info, callback_url || null]);

    const thirdPartyOrderId = result.lastInsertRowid;

    // 生成唯一的商家訂單編號（確保符合ECPay 20字符限制）
    const timestamp = Date.now().toString().slice(-8); // 取時間戳後8位
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3位隨機字符
    const merchantTradeNo = `TPA${timestamp}${randomStr}${String(thirdPartyOrderId).padStart(3, '0')}`; // 總長度: 3+8+3+3=17字符

    // 建立綠界BARCODE訂單
    const ecpayResult = await createBarcodeOrder({
      thirdPartyOrderId,
      merchantTradeNo,
      amount: numAmount,
      productInfo: product_info,
      clientSystem: req.clientInfo.system,
      storeType: store_type,
      customerInfo: customer_info
    });

    if (!ecpayResult.success) {
      // 如果綠界建立失敗，刪除剛建立的訂單
      await runSQL('DELETE FROM third_party_orders WHERE id = ?', [thirdPartyOrderId]);
      throw new Error(ecpayResult.message || '綠界BARCODE訂單建立失敗');
    }

    // 根據ECPay回應模式處理
    if (ecpayResult.mode === 'ecpay_redirect') {
      // ECPay跳轉模式：將支付表單資訊保存到訂單
      await runSQL(`
        UPDATE third_party_orders 
        SET payment_url = ?, barcode_status = 'generated', expire_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        ecpayResult.paymentForm.action, // ECPay API URL
        ecpayResult.expireDate, 
        thirdPartyOrderId
      ]);
    } else if (ecpayResult.mode === 'server_direct') {
      // Server端直接獲取到條碼資訊
      await runSQL(`
        UPDATE third_party_orders 
        SET payment_code = ?, payment_url = ?, barcode_data = ?, barcode_status = 'generated', expire_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        ecpayResult.barcode, 
        ecpayResult.barcodeUrl, 
        JSON.stringify(ecpayResult.barcodeSegments),
        ecpayResult.expireDate, 
        thirdPartyOrderId
      ]);
    } else {
      // 回調等待模式
      await runSQL(`
        UPDATE third_party_orders 
        SET payment_code = ?, payment_url = ?, barcode_status = 'pending', expire_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [ecpayResult.barcode || null, ecpayResult.paymentUrl, ecpayResult.expireDate, thirdPartyOrderId]);
    }

    // 記錄綠界交易
    await runSQL(`
      INSERT INTO ecpay_transactions (
        third_party_order_id, merchant_trade_no, amount, payment_type, response_code, response_msg, raw_response, trade_no, barcode_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      thirdPartyOrderId, 
      merchantTradeNo, 
      numAmount, 
      'BARCODE', 
      '1', 
      'SUCCESS', 
      JSON.stringify(ecpayResult),
      ecpayResult.tradeNo || null,
      ecpayResult.barcodeSegments ? JSON.stringify(ecpayResult.barcodeSegments) : null
    ]);

    // 根據ECPay回應模式返回不同的結果
    const baseUrl = process.env.BASE_URL || 'https://corba3c-production.up.railway.app';
    const responseData = {
      order_id: thirdPartyOrderId,
      client_order_id: client_order_id,
      merchant_trade_no: merchantTradeNo,
      trade_no: ecpayResult.tradeNo || null,
      store_type: store_type,
      amount: numAmount,
      expire_date: ecpayResult.expireDate,
      customer_info_url: `${baseUrl}/customer-info/${thirdPartyOrderId}`
    };

    if (ecpayResult.mode === 'ecpay_redirect') {
      // ECPay跳轉模式：廠商獲得直接跳轉到ECPay收銀台的網址
      responseData.barcode_status = 'generated';
      responseData.payment_method = 'ecpay_redirect';
      responseData.barcode_page_url = `${baseUrl}/ecpay-redirect/${thirdPartyOrderId}`;
      responseData.message = '訂單建立成功，廠商只需將用戶導向 barcode_page_url 即可進入ECPay收銀台';
      responseData.usage_instructions = [
        '將用戶導向 barcode_page_url 網址',
        '用戶將直接進入ECPay收銀台頁面',
        '用戶完成條碼付款後系統會自動處理回調',
        '廠商無需處理任何ECPay技術細節'
      ];
    } else if (ecpayResult.mode === 'server_direct') {
      // Server端直接模式：立即返回條碼資訊
      responseData.barcode_status = 'generated';
      responseData.barcode = ecpayResult.barcode;
      responseData.barcode_url = ecpayResult.barcodeUrl;
      responseData.barcode_segments = {
        barcode_1: ecpayResult.barcodeSegments.barcode1,
        barcode_2: ecpayResult.barcodeSegments.barcode2,
        barcode_3: ecpayResult.barcodeSegments.barcode3
      };
      responseData.message = '條碼已生成完成，可直接使用';
      responseData.usage_instructions = [
        '請至便利商店櫃台出示此條碼',
        '可使用條碼圖片或告知店員三段條碼號碼',
        '條碼有效期限至 ' + new Date(ecpayResult.expireDate).toLocaleString('zh-TW')
      ];
    } else {
      // 回調等待模式：異步生成
      responseData.barcode_status = 'pending';
      responseData.barcode = null;
      responseData.barcode_url = null;
      responseData.barcode_segments = {
        barcode_1: null,
        barcode_2: null,
        barcode_3: null
      };
      responseData.barcode_status_url = `${process.env.BASE_URL || 'https://corba3c-production.up.railway.app'}/api/third-party/orders/${thirdPartyOrderId}/barcode`;
      responseData.message = '訂單建立成功，條碼正在生成中，請使用 barcode_status_url 查詢條碼狀態';
      responseData.retry_after = 10;
      responseData.estimated_barcode_ready_time = new Date(Date.now() + 30000).toISOString();
    }

    res.status(201).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('建立第三方訂單失敗:', error);
    res.status(500).json({
      error: true,
      message: error.message || '建立訂單失敗'
    });
  }
});

/**
 * GET /api/third-party/orders/:orderId/status
 * 查詢訂單狀態
 */
router.get('/orders/:orderId/status', apiKeyAuth, apiCallLogger, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getAsync(`
      SELECT tpo.*, et.merchant_trade_no, et.payment_date, et.payment_type
      FROM third_party_orders tpo
      LEFT JOIN ecpay_transactions et ON tpo.id = et.third_party_order_id
      WHERE tpo.id = ? AND tpo.client_system = ?
    `, [orderId, req.clientInfo.system]);

    if (!order) {
      return res.status(404).json({
        error: true,
        message: '找不到訂單'
      });
    }

    res.json({
      success: true,
      data: {
        order_id: order.id,
        external_order_id: order.external_order_id,
        status: order.status,
        amount: order.amount,
        product_info: order.product_info,
        merchant_trade_no: order.merchant_trade_no,
        payment_date: order.payment_date,
        payment_type: order.payment_type,
        paid_at: order.paid_at,
        expire_date: order.expire_date,
        created_at: order.created_at
      }
    });

  } catch (error) {
    console.error('查詢訂單狀態失敗:', error);
    res.status(500).json({
      error: true,
      message: '查詢失敗'
    });
  }
});

/**
 * GET /api/third-party/orders/:orderId/barcode
 * 查詢訂單條碼狀態和資訊
 */
router.get('/orders/:orderId/barcode', apiKeyAuth, apiCallLogger, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getAsync(`
      SELECT tpo.id, tpo.external_order_id, tpo.amount, tpo.product_info,
             tpo.payment_code, tpo.payment_url, tpo.barcode_data, tpo.barcode_status,
             tpo.expire_date, tpo.status, tpo.created_at, tpo.updated_at,
             et.merchant_trade_no, et.trade_no, et.barcode_info
      FROM third_party_orders tpo
      LEFT JOIN ecpay_transactions et ON tpo.id = et.third_party_order_id
      WHERE tpo.id = ? AND tpo.client_system = ?
    `, [orderId, req.clientInfo.system]);

    if (!order) {
      return res.status(404).json({
        error: true,
        message: '找不到訂單'
      });
    }

    // 解析條碼數據
    let barcodeData = null;
    let barcodeSegments = {
      barcode_1: null,
      barcode_2: null,
      barcode_3: null
    };

    if (order.barcode_data) {
      try {
        barcodeData = JSON.parse(order.barcode_data);
        barcodeSegments = {
          barcode_1: barcodeData.barcode_1,
          barcode_2: barcodeData.barcode_2,
          barcode_3: barcodeData.barcode_3
        };
      } catch (e) {
        console.error('解析條碼數據失敗:', e);
      }
    }

    // 檢查條碼是否過期
    const isExpired = order.expire_date && new Date(order.expire_date) < new Date();
    const currentStatus = isExpired ? 'expired' : (order.barcode_status || 'pending');

    // 如果過期且狀態未更新，更新狀態
    if (isExpired && order.barcode_status !== 'expired') {
      await runSQL(`
        UPDATE third_party_orders 
        SET barcode_status = 'expired', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [orderId]);
    }

    const baseUrl = process.env.BASE_URL || 'https://corba3c-production.up.railway.app';
    
    res.json({
      success: true,
      data: {
        order_id: order.id,
        external_order_id: order.external_order_id,
        merchant_trade_no: order.merchant_trade_no,
        
        // 條碼狀態
        barcode_status: currentStatus, // pending, generated, expired
        
        // 條碼資訊
        barcode: order.payment_code, // 完整條碼
        barcode_url: order.payment_url, // 條碼圖片URL
        barcode_segments: barcodeSegments, // 三段式條碼
        
        // 條碼網頁URL (廠商可直接使用或嵌入)
        barcode_page_url: `${baseUrl}/api/third-party/orders/${order.id}/barcode/page`,
        barcode_iframe_url: `${baseUrl}/api/third-party/orders/${order.id}/barcode/page?format=iframe`,
        
        // 時間資訊
        expire_date: order.expire_date,
        created_at: order.created_at,
        updated_at: order.updated_at,
        
        // 訂單基本資訊
        amount: order.amount,
        product_info: order.product_info,
        order_status: order.status,
        
        // 提示訊息
        message: getBarcodeStatusMessage(currentStatus, order.expire_date),
        
        // 如果條碼未生成，提供重新查詢建議
        ...(currentStatus === 'pending' && {
          retry_after: 10, // 建議10秒後重試
          next_check_time: new Date(Date.now() + 10000).toISOString()
        }),
        
        // 條碼使用說明
        ...(currentStatus === 'generated' && {
          usage_instructions: [
            '請至便利商店櫃台出示此條碼',
            '條碼有效期限至 ' + (order.expire_date ? new Date(order.expire_date).toLocaleString('zh-TW') : '未知'),
            '付款完成後系統將自動更新訂單狀態',
            '可使用 barcode_page_url 顯示完整的條碼付款頁面'
          ]
        })
      }
    });

  } catch (error) {
    console.error('查詢條碼狀態失敗:', error);
    res.status(500).json({
      error: true,
      message: '查詢失敗'
    });
  }
});

/**
 * 取得條碼狀態說明訊息
 */
function getBarcodeStatusMessage(status, expireDate) {
  switch (status) {
    case 'pending':
      return '條碼正在生成中，請稍後查詢';
    case 'generated':
      return '條碼已生成，可至便利商店付款';
    case 'expired':
      return '條碼已過期，請重新建立訂單';
    default:
      return '條碼狀態未知';
  }
}

/**
 * GET /api/third-party/orders
 * 查詢訂單列表
 */
router.get('/orders', apiKeyAuth, apiCallLogger, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tpo.client_system = ?';
    let params = [req.clientInfo.system];

    if (status) {
      whereClause += ' AND tpo.status = ?';
      params.push(status);
    }

    const orders = await allAsync(`
      SELECT tpo.*, et.merchant_trade_no, et.payment_date, et.payment_type
      FROM third_party_orders tpo
      LEFT JOIN ecpay_transactions et ON tpo.id = et.third_party_order_id
      ${whereClause}
      ORDER BY tpo.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // 取得總數
    const totalResult = await getAsync(`
      SELECT COUNT(*) as total
      FROM third_party_orders tpo
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          order_id: order.id,
          external_order_id: order.external_order_id,
          status: order.status,
          amount: order.amount,
          product_info: order.product_info,
          merchant_trade_no: order.merchant_trade_no,
          payment_date: order.payment_date,
          payment_type: order.payment_type,
          paid_at: order.paid_at,
          expire_date: order.expire_date,
          created_at: order.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalResult.total,
          pages: Math.ceil(totalResult.total / limit)
        }
      }
    });

  } catch (error) {
    console.error('查詢訂單列表失敗:', error);
    res.status(500).json({
      error: true,
      message: '查詢失敗'
    });
  }
});

/**
 * POST /api/third-party/ecpay/callback
 * ECPay 付款結果回調 (不需要 API Key 驗證)
 */
router.post('/ecpay/callback', async (req, res) => {
  try {
    const result = await handlePaymentCallback(req.body);
    
    if (result.success) {
      res.send('1|OK');
    } else {
      res.send('0|' + result.message);
    }
  } catch (error) {
    console.error('ECPay 回調處理失敗:', error);
    res.send('0|處理失敗');
  }
});

/**
 * POST /api/third-party/ecpay/payment-info
 * ECPay 付款資訊回調 - 接收條碼資訊 (不需要 API Key 驗證)
 */
router.post('/ecpay/payment-info', async (req, res) => {
  try {
    console.log('收到 ECPay 付款資訊回調:', JSON.stringify(req.body, null, 2));
    
    const { MerchantTradeNo } = req.body;

    if (!MerchantTradeNo) {
      console.error('PaymentInfo回調缺少MerchantTradeNo');
      return res.send('0|缺少必要參數');
    }

    // 查找對應的訂單（使用更簡單的查詢）
    const order = await getAsync(`
      SELECT tpo.id, tpo.external_order_id, tpo.client_system, et.id as transaction_id
      FROM third_party_orders tpo
      JOIN ecpay_transactions et ON tpo.id = et.third_party_order_id
      WHERE et.merchant_trade_no = ?
      LIMIT 1
    `, [MerchantTradeNo]);

    if (!order) {
      console.error('找不到對應的訂單:', MerchantTradeNo);
      return res.send('0|找不到訂單');
    }

    console.log('找到訂單:', order);

    // 處理真實的ECPay BARCODE回調格式
    const { 
      TradeNo,
      PaymentType,
      TradeDate,
      RtnCode,
      RtnMsg,
      BarcodeInfo, // 真實格式：包含Barcode1, Barcode2, Barcode3的物件
      ExpireDate,
      PaymentNo
    } = req.body;

    // 從ECPay回調中提取條碼段（修復條碼字段名稱）
    let Barcode_1, Barcode_2, Barcode_3, finalExpireDate;
    if (BarcodeInfo) {
      console.log('使用BarcodeInfo格式:', BarcodeInfo);
      Barcode_1 = BarcodeInfo.Barcode1;
      Barcode_2 = BarcodeInfo.Barcode2; 
      Barcode_3 = BarcodeInfo.Barcode3;
      finalExpireDate = BarcodeInfo.ExpireDate || ExpireDate;
    } else {
      console.log('使用ECPay直接格式');
      // ECPay直接傳送格式：Barcode1, Barcode2, Barcode3
      Barcode_1 = req.body.Barcode1;
      Barcode_2 = req.body.Barcode2;
      Barcode_3 = req.body.Barcode3;
      finalExpireDate = ExpireDate;
    }

    console.log('提取的條碼數據:', { Barcode_1, Barcode_2, Barcode_3, finalExpireDate });

    // 處理條碼資訊
    if (PaymentType === 'BARCODE' && (Barcode_1 || Barcode_2 || Barcode_3)) {
      console.log('開始處理條碼資訊...');
      
      // 生成完整條碼
      const segments = [Barcode_1, Barcode_2, Barcode_3].filter(Boolean);
      if (segments.length === 0) {
        console.error('沒有有效的條碼段');
        return res.send('0|條碼數據無效');
      }

      const fullBarcode = segments.join('-');
      const barcodeUrl = `https://payment.ecpay.com.tw/SP/CreateQRCode?qdata=${encodeURIComponent(fullBarcode)}`;
      
      console.log('生成的條碼:', fullBarcode);
      console.log('條碼URL:', barcodeUrl);
      
      // 簡化的條碼數據結構
      const barcodeData = {
        barcode_1: Barcode_1 || '',
        barcode_2: Barcode_2 || '',
        barcode_3: Barcode_3 || '',
        full_barcode: fullBarcode,
        segments_count: segments.length,
        expire_date: finalExpireDate,
        barcode_url: barcodeUrl
      };
      
      console.log('準備更新數據庫...');
      
      // 更新訂單條碼資訊
      runSQL(`
        UPDATE third_party_orders 
        SET payment_code = ?, payment_url = ?, barcode_data = ?, barcode_status = 'generated', expire_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        fullBarcode,
        barcodeUrl, 
        JSON.stringify(barcodeData),
        finalExpireDate || null,
        order.id
      ]);

      // 更新交易記錄
      if (order.transaction_id) {
        runSQL(`
          UPDATE ecpay_transactions 
          SET trade_no = ?, payment_type = ?, barcode_info = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          TradeNo || null,
          PaymentType,
          JSON.stringify(barcodeData),
          order.transaction_id
        ]);
      }

      console.log('條碼資訊更新成功:', {
        order_id: order.id,
        merchant_trade_no: MerchantTradeNo,
        barcode: fullBarcode
      });
    }

    res.send('1|OK');
  } catch (error) {
    console.error('ECPay 付款資訊處理失敗:', error);
    securityLog('error', 'PaymentInfo處理失敗', req, { error: error.message });
    res.send('0|處理失敗');
  }
});

/**
 * 生成條碼URL和相關資訊
 */
function generateBarcodeUrl(barcodeData) {
  if (!barcodeData || barcodeData === '--' || barcodeData === '---') {
    return null;
  }
  
  // 清理條碼數據
  const cleanBarcode = barcodeData.replace(/-+$/, '').replace(/^-+/, '');
  
  if (!cleanBarcode) {
    return null;
  }
  
  // 使用綠界QRCode服務生成條碼圖片URL
  return `https://payment.ecpay.com.tw/SP/CreateQRCode?qdata=${encodeURIComponent(cleanBarcode)}`;
}

/**
 * GET /api/third-party/orders/:orderId/barcode/page
 * 顯示條碼網頁頁面 (供廠商嵌入或直接使用)
 */
router.get('/orders/:orderId/barcode/page', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { theme = 'default', format = 'web', lang = 'zh-TW' } = req.query;

    const order = await getAsync(`
      SELECT tpo.id, tpo.external_order_id, tpo.amount, tpo.product_info,
             tpo.payment_code, tpo.payment_url, tpo.barcode_data, tpo.barcode_status,
             tpo.expire_date, tpo.status, tpo.created_at, tpo.updated_at,
             tpo.client_system,
             et.merchant_trade_no, et.trade_no, et.barcode_info
      FROM third_party_orders tpo
      LEFT JOIN ecpay_transactions et ON tpo.id = et.third_party_order_id
      WHERE tpo.id = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).send(generateErrorPage('找不到訂單', '請檢查訂單編號是否正確'));
    }

    // 解析條碼數據
    let barcodeData = null;
    let barcodeSegments = {
      barcode_1: null,
      barcode_2: null,
      barcode_3: null
    };

    if (order.barcode_data) {
      try {
        barcodeData = JSON.parse(order.barcode_data);
        barcodeSegments = {
          barcode_1: barcodeData.barcode_1,
          barcode_2: barcodeData.barcode_2,
          barcode_3: barcodeData.barcode_3
        };
      } catch (e) {
        console.error('解析條碼數據失敗:', e);
      }
    }

    // 檢查條碼是否過期
    const isExpired = order.expire_date && new Date(order.expire_date) < new Date();
    const currentStatus = isExpired ? 'expired' : (order.barcode_status || 'pending');

    // 生成條碼網頁HTML
    const barcodePageHtml = generateBarcodePageHtml({
      orderId: order.id,
      externalOrderId: order.external_order_id,
      merchantTradeNo: order.merchant_trade_no,
      amount: order.amount,
      productInfo: order.product_info,
      clientSystem: order.client_system,
      barcodeStatus: currentStatus,
      barcode: order.payment_code,
      barcodeUrl: order.payment_url,
      barcodeSegments: barcodeSegments,
      expireDate: order.expire_date,
      createdAt: order.created_at,
      theme: theme,
      format: format,
      lang: lang
    });

    // 設置適當的Content-Type
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(barcodePageHtml);

  } catch (error) {
    console.error('條碼網頁生成失敗:', error);
    res.status(500).send(generateErrorPage('系統錯誤', '條碼網頁生成失敗，請稍後再試'));
  }
});

/**
 * 生成條碼展示網頁HTML
 */
function generateBarcodePageHtml(data) {
  const {
    orderId,
    externalOrderId,
    merchantTradeNo,
    amount,
    productInfo,
    clientSystem,
    barcodeStatus,
    barcode,
    barcodeUrl,
    barcodeSegments,
    expireDate,
    createdAt,
    theme = 'default',
    format = 'web',
    lang = 'zh-TW'
  } = data;

  // 生成條碼相關內容
  let barcodeContent = '';
  let statusMessage = '';
  let statusClass = '';
  
  // 預先處理條碼段數據
  const segments = [barcodeSegments.barcode_1, barcodeSegments.barcode_2, barcodeSegments.barcode_3].filter(Boolean);
  const hasValidSegments = segments.length > 0;
  
  // 準備最終的條碼段（可能包含從完整條碼解析的段）
  let finalSegments = segments;

  switch (barcodeStatus) {
    case 'generated':
      statusClass = 'success';
      statusMessage = '條碼已生成，請至便利商店付款';
      
      // 如果沒有條碼段但有完整條碼，嘗試解析
      if (!hasValidSegments && barcode) {
        const parsedSegments = barcode.split('-').filter(Boolean);
        if (parsedSegments.length > 0) {
          finalSegments = parsedSegments;
        }
      }
      
      // 生成本地Code39條碼
      const baseUrl = process.env.BASE_URL || 'https://corba3c-production.up.railway.app';
      const localBarcodeUrl = finalSegments.length > 0 
        ? `${baseUrl}/api/third-party/barcode/generate-multi`
        : null;

      if (hasValidSegments || barcode) {
        
        barcodeContent = `
          <div class="barcode-section">
            <h3>🛒 便利商店條碼付款</h3>
            
            ${barcodeUrl ? `
              <div class="barcode-image">
                <img src="${barcodeUrl}" alt="付款條碼" style="max-width: 100%; height: auto; border: 1px solid #ddd; padding: 10px; background: white;">
                <p class="image-note">綠界官方條碼圖片</p>
              </div>
            ` : ''}
            
            ${finalSegments.length > 0 ? `
              <div class="barcode-segments">
                <h4>條碼號碼 (${finalSegments.length}段式)</h4>
                ${finalSegments.map((segment, index) => `
                  <div class="segment">
                    <label>第 ${index + 1} 段:</label>
                    <span class="barcode-number">${segment}</span>
                    <button onclick="copyToClipboard('${segment}')" class="copy-btn">複製</button>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${(barcode || finalSegments.length > 0) ? `
              <div class="barcode-full">
                <h4>完整條碼</h4>
                <div class="full-barcode-display">
                  <span class="barcode-number">${barcode || finalSegments.join('-')}</span>
                  <button onclick="copyToClipboard('${barcode || finalSegments.join('-')}')" class="copy-btn">複製</button>
                </div>
              </div>
            ` : `
              <div class="no-barcode-data">
                <h4>⏳ 等待條碼數據</h4>
                <p>系統正在向綠界取得條碼資訊，請稍後重新整理頁面</p>
                <button onclick="location.reload()" class="refresh-btn">重新整理</button>
              </div>
            `}
            
            ${finalSegments.length > 0 ? `
              <div class="local-barcode-section">
                <h4>📊 本地生成條碼</h4>
                <div class="local-barcode-container" id="localBarcodeContainer">
                  <div class="loading-barcode">
                    <div class="loading-spinner"></div>
                    <p>正在生成條碼...</p>
                  </div>
                </div>
                <p class="barcode-note">此為本地生成的Code39格式條碼，供離線使用</p>
              </div>
            ` : ''}
            
            <div class="usage-instructions">
              <h4>💡 使用說明</h4>
              <ul>
                <li>方法一：出示條碼圖片讓店員掃描</li>
                <li>方法二：告知店員三段條碼號碼</li>
                <li>方法三：在超商機台輸入條碼號碼</li>
              </ul>
            </div>
          </div>
        `;
      } else {
        // 條碼狀態為generated但沒有條碼數據
        barcodeContent = `
          <div class="barcode-section">
            <h3>🛒 便利商店條碼付款</h3>
            
            <div class="no-barcode-data">
              <h4>⏳ 等待條碼數據</h4>
              <p>訂單已建立，正在等待綠界回傳條碼資訊</p>
              <p>這通常需要幾秒鐘時間，請稍後重新整理頁面</p>
              <button onclick="location.reload()" class="refresh-btn">重新整理</button>
            </div>
            
            <div class="usage-instructions">
              <h4>💡 使用說明</h4>
              <ul>
                <li>系統已向綠界發送條碼請求</li>
                <li>條碼數據通常在5-30秒內到達</li>
                <li>請稍後重新整理頁面查看條碼</li>
                <li>如果長時間未顯示，請聯繫客服</li>
              </ul>
            </div>
          </div>
        `;
      }
      break;
      
    case 'pending':
      statusClass = 'warning';
      statusMessage = '條碼生成中，請稍後重新整理';
      barcodeContent = `
        <div class="barcode-section">
          <div class="pending-barcode">
            <h3>⏳ 條碼生成中</h3>
            <p>系統正在生成付款條碼，請稍候...</p>
            <div class="loading-spinner"></div>
            <button onclick="location.reload()" class="refresh-btn">重新整理</button>
          </div>
        </div>
      `;
      break;
      
    case 'expired':
      statusClass = 'error';
      statusMessage = '條碼已過期，請重新建立訂單';
      barcodeContent = `
        <div class="barcode-section">
          <div class="expired-barcode">
            <h3>⌛ 條碼已過期</h3>
            <p>此條碼已過期，無法進行付款</p>
            <p>請聯繫商家重新建立訂單</p>
          </div>
        </div>
      `;
      break;
      
    default:
      statusClass = 'info';
      statusMessage = '條碼狀態未知';
      barcodeContent = `
        <div class="barcode-section">
          <div class="unknown-status">
            <h3>❓ 狀態未知</h3>
            <p>無法確定條碼狀態，請聯繫客服</p>
          </div>
        </div>
      `;
  }

  // 格式化過期時間
  const expireDateFormatted = expireDate 
    ? new Date(expireDate).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '未設定';

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>條碼付款 - 訂單 ${externalOrderId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft JhengHei', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
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
        
        .header h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
        }
        
        .status.success {
            background: #27ae60;
            color: white;
        }
        
        .status.warning {
            background: #f39c12;
            color: white;
        }
        
        .status.error {
            background: #e74c3c;
            color: white;
        }
        
        .status.info {
            background: #3498db;
            color: white;
        }
        
        .content {
            padding: 30px;
        }
        
        .order-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
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
            color: #e74c3c;
            font-weight: bold;
        }
        
        .barcode-section {
            background: #fff;
            border: 2px solid #dee2e6;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 20px;
        }
        
        .barcode-section h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .barcode-image {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .barcode-image img {
            border-radius: 8px;
        }
        
        .image-note {
            margin-top: 10px;
            color: #6c757d;
            font-size: 14px;
        }
        
        .barcode-segments h4,
        .barcode-full h4,
        .usage-instructions h4 {
            color: #495057;
            margin-bottom: 15px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 5px;
        }
        
        .segment,
        .full-barcode-display {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .segment label {
            min-width: 80px;
            font-weight: bold;
            color: #495057;
        }
        
        .barcode-number {
            flex: 1;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            background: white;
            padding: 8px 12px;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            margin: 0 10px;
        }
        
        .copy-btn,
        .refresh-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s;
        }
        
        .copy-btn:hover,
        .refresh-btn:hover {
            background: #2980b9;
        }
        
        .usage-instructions ul {
            list-style: none;
            padding: 0;
        }
        
        .usage-instructions li {
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .usage-instructions li:last-child {
            border-bottom: none;
        }
        
        .pending-barcode,
        .expired-barcode,
        .unknown-status,
        .no-barcode {
            text-align: center;
            padding: 40px 20px;
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
        
        .local-barcode-section {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .local-barcode-container {
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 15px 0;
        }
        
        .loading-barcode {
            text-align: center;
        }
        
        .barcode-note {
            font-size: 14px;
            color: #6c757d;
            text-align: center;
            margin: 10px 0 0 0;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        
        .footer a {
            color: #3498db;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 10px;
            }
            
            .header,
            .content {
                padding: 20px;
            }
            
            .info-row {
                flex-direction: column;
                gap: 5px;
            }
            
            .segment,
            .full-barcode-display {
                flex-direction: column;
                gap: 10px;
                align-items: stretch;
            }
            
            .segment label {
                min-width: auto;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 便利商店條碼付款</h1>
            <div class="status ${statusClass}">${statusMessage}</div>
        </div>
        
        <div class="content">
            <div class="order-info">
                <div class="info-row">
                    <span class="info-label">訂單編號:</span>
                    <span class="info-value">${externalOrderId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">付款金額:</span>
                    <span class="info-value amount">NT$ ${amount}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">商品資訊:</span>
                    <span class="info-value">${productInfo}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">有效期限:</span>
                    <span class="info-value">${expireDateFormatted}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">建立時間:</span>
                    <span class="info-value">${new Date(createdAt).toLocaleString('zh-TW')}</span>
                </div>
            </div>
            
            ${barcodeContent}
        </div>
        
        <div class="footer">
            <p>由 <strong>${clientSystem || '第三方系統'}</strong> 提供服務</p>
            <p>如有問題請聯繫客服 | <a href="#" onclick="location.reload()">重新整理頁面</a></p>
        </div>
    </div>
    
    <script>
        // 複製到剪貼板功能
        function copyToClipboard(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function() {
                    showCopySuccess();
                }, function(err) {
                    fallbackCopyToClipboard(text);
                });
            } else {
                fallbackCopyToClipboard(text);
            }
        }
        
        function fallbackCopyToClipboard(text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.top = "-1000px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showCopySuccess();
                } else {
                    showCopyError();
                }
            } catch (err) {
                showCopyError();
            }
            
            document.body.removeChild(textArea);
        }
        
        function showCopySuccess() {
            // 簡單的提示
            const originalText = event.target.textContent;
            event.target.textContent = '已複製!';
            event.target.style.background = '#27ae60';
            setTimeout(() => {
                event.target.textContent = originalText;
                event.target.style.background = '#3498db';
            }, 1500);
        }
        
        function showCopyError() {
            alert('複製失敗，請手動選取文字');
        }
        
        // 自動重新整理 (僅在條碼生成中時)
        if ('${barcodeStatus}' === 'pending') {
            setTimeout(() => {
                location.reload();
            }, 15000); // 15秒後自動重新整理
        }
        
        // 生成本地條碼
        async function generateLocalBarcode() {
            const container = document.getElementById('localBarcodeContainer');
            if (!container) return;
            
            // 取得條碼段
            const segments = [${finalSegments.map(segment => `'${segment}'`).join(', ')}];
            
            if (segments.length === 0) {
                container.innerHTML = '<p style="color: #6c757d; text-align: center;">等待條碼數據...</p>';
                return;
            }
            
            try {
                const response = await fetch('/api/third-party/barcode/generate-multi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        segments: segments,
                        options: {
                            width: 320,
                            height: 60,
                            showText: true,
                            showSegmentLabels: true,
                            segmentSpacing: 10
                        }
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        container.innerHTML = result.data.svg;
                        
                        // 添加下載按鈕
                        const downloadBtn = document.createElement('button');
                        downloadBtn.textContent = '下載條碼';
                        downloadBtn.className = 'copy-btn';
                        downloadBtn.style.marginTop = '10px';
                        downloadBtn.onclick = () => downloadSVG(result.data.svg, 'barcode.svg');
                        container.appendChild(downloadBtn);
                    } else {
                        throw new Error(result.message || '生成失敗');
                    }
                } else {
                    throw new Error('API請求失敗');
                }
            } catch (error) {
                console.error('本地條碼生成失敗:', error);
                container.innerHTML = '<p style="color: red;">本地條碼生成失敗：' + error.message + '</p>';
            }
        }
        
        // 下載SVG文件
        function downloadSVG(svgContent, filename) {
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        // 頁面載入完成後生成本地條碼
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('localBarcodeContainer')) {
                setTimeout(generateLocalBarcode, 1000); // 延遲1秒後生成
            }
        });
    </script>
</body>
</html>
  `;
}

/**
 * 生成錯誤頁面HTML
 */
function generateErrorPage(title, message) {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft JhengHei', sans-serif;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
        }
        .error-container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        .error-icon {
            font-size: 60px;
            margin-bottom: 20px;
        }
        .error-title {
            font-size: 24px;
            color: #2c3e50;
            margin-bottom: 15px;
        }
        .error-message {
            color: #7f8c8d;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .back-btn {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            transition: background 0.3s;
        }
        .back-btn:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">❌</div>
        <h1 class="error-title">${title}</h1>
        <p class="error-message">${message}</p>
        <a href="javascript:history.back()" class="back-btn">返回上頁</a>
    </div>
</body>
</html>
  `;
}

/**
 * GET /api/third-party/barcode/generate/:text
 * 生成Code39條碼SVG (公開端點，無需API Key)
 */
router.get('/barcode/generate/:text', async (req, res) => {
  try {
    const { text } = req.params;
    const { 
      width = 300, 
      height = 80, 
      format = 'svg',
      showText = 'true',
      style = 'default'
    } = req.query;

    // 驗證文字
    const validation = validateCode39Text(text);
    if (!validation.isValid) {
      return res.status(400).json({
        error: true,
        message: '無效的條碼文字',
        details: validation.errors,
        warnings: validation.warnings
      });
    }

    // 生成條碼選項
    const options = {
      width: parseInt(width),
      height: parseInt(height),
      showText: showText === 'true',
      barColor: style === 'dark' ? '#000000' : '#000000',
      backgroundColor: style === 'dark' ? '#f8f9fa' : '#ffffff',
      textColor: style === 'dark' ? '#000000' : '#000000'
    };

    // 生成SVG條碼
    const svgCode = generateCode39SVG(validation.cleanedText, options);

    // 設置適當的Content-Type
    if (format === 'svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgCode);
    } else {
      res.json({
        success: true,
        data: {
          text: validation.cleanedText,
          svg: svgCode,
          warnings: validation.warnings
        }
      });
    }

  } catch (error) {
    console.error('條碼生成失敗:', error);
    res.status(500).json({
      error: true,
      message: '條碼生成失敗',
      details: error.message
    });
  }
});

/**
 * POST /api/third-party/barcode/generate-multi
 * 生成多段Code39條碼SVG (公開端點，無需API Key)
 */
router.post('/barcode/generate-multi', async (req, res) => {
  try {
    const { segments, options = {} } = req.body;

    if (!Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({
        error: true,
        message: '必須提供條碼段陣列'
      });
    }

    if (segments.length > 3) {
      return res.status(400).json({
        error: true,
        message: '最多支援3段條碼'
      });
    }

    // 驗證所有段
    const validatedSegments = [];
    const allWarnings = [];
    
    for (let i = 0; i < segments.length; i++) {
      const validation = validateCode39Text(segments[i]);
      if (!validation.isValid) {
        return res.status(400).json({
          error: true,
          message: `第${i + 1}段條碼無效`,
          details: validation.errors
        });
      }
      validatedSegments.push(validation.cleanedText);
      allWarnings.push(...validation.warnings);
    }

    // 生成多段條碼
    const barcodeOptions = {
      width: 350,
      height: 70,
      showText: true,
      showSegmentLabels: true,
      segmentSpacing: 15,
      ...options
    };

    const svgCode = generateMultiSegmentCode39SVG(validatedSegments, barcodeOptions);

    res.json({
      success: true,
      data: {
        segments: validatedSegments,
        svg: svgCode,
        warnings: allWarnings,
        segmentCount: validatedSegments.length
      }
    });

  } catch (error) {
    console.error('多段條碼生成失敗:', error);
    res.status(500).json({
      error: true,
      message: '多段條碼生成失敗',
      details: error.message
    });
  }
});

/**
 * 生成完整的條碼資訊物件
 */
function generateBarcodeInfo(barcode1, barcode2, barcode3, paymentNo, expireDate) {
  const segments = [barcode1, barcode2, barcode3].filter(Boolean);
  
  if (segments.length === 0) {
    return null;
  }
  
  const fullBarcode = segments.join('-');
  const barcodeUrl = generateBarcodeUrl(fullBarcode);
  
  return {
    barcode_1: barcode1 || '',
    barcode_2: barcode2 || '',
    barcode_3: barcode3 || '',
    full_barcode: fullBarcode,
    segments_count: segments.length,
    payment_no: paymentNo || '',
    expire_date: expireDate || null,
    barcode_url: barcodeUrl,
    
    // 提供多種條碼顯示格式
    display_formats: {
      // 標準格式：三段條碼用破折號分隔
      standard: fullBarcode,
      
      // 緊湊格式：無分隔符
      compact: segments.join(''),
      
      // 陣列格式：分段顯示
      array: segments,
      
      // 顯示用格式：美化顯示
      display: segments.map((seg, index) => `第${index + 1}段: ${seg}`).join(' | ')
    },
    
    // 使用說明
    usage_info: {
      description: '請至便利商店出示以下條碼進行付款',
      barcode_type: 'Code39',
      segments_description: segments.length === 3 ? '三段式條碼' : `${segments.length}段條碼`,
      instructions: [
        '方法1: 出示條碼圖片讓店員掃描',
        '方法2: 告知店員三段條碼號碼',
        '方法3: 使用超商機台輸入條碼號碼'
      ]
    },
    
    // 技術資訊
    technical_info: {
      encoding: 'Code39',
      total_length: fullBarcode.length,
      segments: segments.map((seg, index) => ({
        segment: index + 1,
        value: seg,
        length: seg.length
      }))
    }
  };
}

/**
 * POST /api/third-party/orders/:orderId/barcode/query
 * 主動查詢ECPay條碼資訊 (CVS查詢功能)
 */
router.post('/orders/:orderId/barcode/query', apiKeyAuth, apiCallLogger, async (req, res) => {
  try {
    const { orderId } = req.params;

    // 驗證訂單是否屬於該客戶
    const order = await getAsync(`
      SELECT id, external_order_id, client_system, barcode_status
      FROM third_party_orders 
      WHERE id = ? AND client_system = ?
    `, [orderId, req.clientInfo.system]);

    if (!order) {
      return res.status(404).json({
        error: true,
        message: '找不到訂單'
      });
    }

    securityLog('info', 'CVS查詢條碼資訊', req, {
      client_system: req.clientInfo.system,
      order_id: orderId,
      external_order_id: order.external_order_id
    });

    // 執行ECPay查詢
    const queryResult = await queryAndUpdateBarcodeInfo(orderId);

    if (queryResult.success) {
      // 查詢成功，返回更新後的訂單資訊
      const updatedOrder = await getAsync(`
        SELECT tpo.id, tpo.external_order_id, tpo.amount, tpo.product_info,
               tpo.payment_code, tpo.payment_url, tpo.barcode_data, tpo.barcode_status,
               tpo.expire_date, tpo.status, tpo.created_at, tpo.updated_at,
               et.merchant_trade_no, et.trade_no, et.barcode_info
        FROM third_party_orders tpo
        LEFT JOIN ecpay_transactions et ON tpo.id = et.third_party_order_id
        WHERE tpo.id = ?
      `, [orderId]);

      // 解析條碼數據
      let barcodeSegments = {
        barcode_1: null,
        barcode_2: null,
        barcode_3: null
      };

      if (updatedOrder.barcode_data) {
        try {
          const barcodeData = JSON.parse(updatedOrder.barcode_data);
          barcodeSegments = {
            barcode_1: barcodeData.barcode_1,
            barcode_2: barcodeData.barcode_2,
            barcode_3: barcodeData.barcode_3
          };
        } catch (e) {
          console.error('解析條碼數據失敗:', e);
        }
      }

      res.json({
        success: true,
        data: {
          order_id: updatedOrder.id,
          external_order_id: updatedOrder.external_order_id,
          merchant_trade_no: updatedOrder.merchant_trade_no,
          
          // 查詢結果
          query_success: queryResult.success,
          barcode_updated: queryResult.barcodeUpdated,
          trade_status: queryResult.tradeStatus,
          payment_type: queryResult.paymentType,
          payment_date: queryResult.paymentDate,
          
          // 條碼資訊
          barcode_status: updatedOrder.barcode_status,
          barcode: updatedOrder.payment_code,
          barcode_url: updatedOrder.payment_url,
          barcode_segments: barcodeSegments,
          
          // 時間資訊
          expire_date: updatedOrder.expire_date,
          updated_at: updatedOrder.updated_at,
          
          message: queryResult.barcodeUpdated 
            ? '成功查詢並更新條碼資訊'
            : '查詢完成，但條碼資訊尚未產生'
        }
      });

    } else {
      res.status(500).json({
        error: true,
        message: 'ECPay查詢失敗',
        details: queryResult.error,
        data: {
          order_id: order.id,
          external_order_id: order.external_order_id,
          query_success: false,
          barcode_updated: false
        }
      });
    }

  } catch (error) {
    console.error('CVS查詢條碼失敗:', error);
    securityLog('error', 'CVS查詢失敗', req, { error: error.message });
    
    res.status(500).json({
      error: true,
      message: '查詢失敗',
      details: error.message
    });
  }
});

/**
 * GET /api/third-party/orders/:orderId/barcode/refresh
 * 簡化的條碼刷新端點 (用於測試頁面輪詢)
 */
router.get('/orders/:orderId/barcode/refresh', apiKeyAuth, apiCallLogger, async (req, res) => {
  try {
    const { orderId } = req.params;

    // 驗證訂單是否屬於該客戶
    const order = await getAsync(`
      SELECT id, external_order_id, client_system
      FROM third_party_orders 
      WHERE id = ? AND client_system = ?
    `, [orderId, req.clientInfo.system]);

    if (!order) {
      return res.status(404).json({
        error: true,
        message: '找不到訂單'
      });
    }

    // 執行ECPay查詢 (不記錄安全日誌，避免頻繁輪詢造成日誌過多)
    const queryResult = await queryAndUpdateBarcodeInfo(orderId);

    // 獲取最新的訂單資訊
    const response = await fetch(`${process.env.BASE_URL || 'https://corba3c-production.up.railway.app'}/api/third-party/orders/${orderId}/barcode`, {
      headers: {
        'X-API-KEY': req.headers['x-api-key']
      }
    });

    if (response.ok) {
      const barcodeData = await response.json();
      
      // 添加查詢結果資訊
      if (barcodeData.success) {
        barcodeData.data.query_performed = true;
        barcodeData.data.query_success = queryResult.success;
        barcodeData.data.barcode_updated = queryResult.barcodeUpdated;
        barcodeData.data.ecpay_trade_status = queryResult.tradeStatus;
      }
      
      res.json(barcodeData);
    } else {
      throw new Error('無法獲取訂單資訊');
    }

  } catch (error) {
    console.error('條碼刷新失敗:', error);
    res.status(500).json({
      error: true,
      message: '刷新失敗',
      details: error.message
    });
  }
});

export default router;