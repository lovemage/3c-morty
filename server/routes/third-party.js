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

    // 生成唯一的商家訂單編號
    const merchantTradeNo = `TPA${Date.now()}${String(thirdPartyOrderId).padStart(3, '0')}`;

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
        SET payment_url = ?, barcode_status = 'redirect_ready', expire_date = ?, updated_at = CURRENT_TIMESTAMP
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
    const responseData = {
      order_id: thirdPartyOrderId,
      client_order_id: client_order_id,
      merchant_trade_no: merchantTradeNo,
      trade_no: ecpayResult.tradeNo || null,
      store_type: store_type,
      amount: numAmount,
      expire_date: ecpayResult.expireDate,
      customer_info_url: `${process.env.BASE_URL || 'https://corba3c-production.up.railway.app'}/customer-info/${thirdPartyOrderId}`
    };

    if (ecpayResult.mode === 'ecpay_redirect') {
      // ECPay跳轉模式：返回支付表單資訊
      responseData.barcode_status = 'redirect_ready';
      responseData.payment_method = 'ecpay_redirect';
      responseData.ecpay_form = {
        action: ecpayResult.paymentForm.action,
        method: ecpayResult.paymentForm.method,
        params: ecpayResult.paymentForm.params
      };
      responseData.message = '訂單建立成功，請使用ecpay_form建立POST表單跳轉到ECPay頁面進行條碼付款';
      responseData.integration_instructions = [
        '使用ecpay_form.action作為表單的action URL',
        '使用ecpay_form.method (POST)作為表單方法',
        '將ecpay_form.params中的所有參數作為隱藏欄位添加到表單',
        '提交表單將跳轉到ECPay條碼頁面',
        '用戶完成付款後，系統會收到付款通知'
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
            '付款完成後系統將自動更新訂單狀態'
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

    // 從BarcodeInfo中提取條碼段
    let Barcode_1, Barcode_2, Barcode_3, finalExpireDate;
    if (BarcodeInfo) {
      console.log('使用BarcodeInfo格式:', BarcodeInfo);
      Barcode_1 = BarcodeInfo.Barcode1;
      Barcode_2 = BarcodeInfo.Barcode2; 
      Barcode_3 = BarcodeInfo.Barcode3;
      finalExpireDate = BarcodeInfo.ExpireDate || ExpireDate;
    } else {
      console.log('使用傳統格式');
      // 兼容舊格式（如果還有的話）
      Barcode_1 = req.body.Barcode_1;
      Barcode_2 = req.body.Barcode_2;
      Barcode_3 = req.body.Barcode_3;
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

export default router;