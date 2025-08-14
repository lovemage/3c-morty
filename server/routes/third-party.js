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

    // 自動生成其他參數
    const product_info = `3C商品一組 - NT$${amount}`;
    const store_type = '7ELEVEN'; // 預設使用7-ELEVEN
    const customer_info = null; // 由客戶後續填寫

    // 記錄建立訂單請求
    securityLog('info', '第三方BARCODE訂單建立請求', req, {
      client_system: req.clientInfo.system,
      amount,
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

    // 驗證金額
    if (typeof amount !== 'number' || amount <= 0 || amount > 6000) {
      return res.status(400).json({
        error: true,
        message: '金額必須是正整數，範圍為1-6000元'
      });
    }

    // 檢查是否已存在相同的外部訂單號
    console.log('🔍 檢查訂單號重複:', {
      client_order_id,
      client_system: req.clientInfo.system
    });
    
    const existingOrder = await getAsync(
      'SELECT id FROM third_party_orders WHERE external_order_id = ? AND client_system = ?',
      [client_order_id, req.clientInfo.system]
    );
    
    console.log('📊 查詢結果:', existingOrder);

    if (existingOrder) {
      console.log('❌ 訂單號衝突:', existingOrder);
      return res.status(409).json({
        error: true,
        message: '訂單號已存在'
      });
    }
    
    console.log('✅ 訂單號檢查通過，繼續建立訂單');

    // 建立第三方訂單記錄
    const result = await runSQL(`
      INSERT INTO third_party_orders (
        external_order_id, client_system, amount, product_info, callback_url, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `, [client_order_id, req.clientInfo.system, amount, product_info, callback_url || null]);

    const thirdPartyOrderId = result.lastInsertRowid;

    // 生成唯一的商家訂單編號
    const merchantTradeNo = `TPA${Date.now()}${String(thirdPartyOrderId).padStart(3, '0')}`;

    // 建立綠界BARCODE訂單
    const ecpayResult = await createBarcodeOrder({
      thirdPartyOrderId,
      merchantTradeNo,
      amount,
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

    // 更新訂單資訊
    await runSQL(`
      UPDATE third_party_orders 
      SET payment_code = ?, payment_url = ?, expire_date = ?
      WHERE id = ?
    `, [ecpayResult.barcode, ecpayResult.paymentUrl, ecpayResult.expireDate, thirdPartyOrderId]);

    // 記錄綠界交易
    await runSQL(`
      INSERT INTO ecpay_transactions (
        third_party_order_id, merchant_trade_no, amount, payment_type, response_code, response_msg, raw_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [thirdPartyOrderId, merchantTradeNo, amount, 'BARCODE', '1', 'SUCCESS', JSON.stringify(ecpayResult)]);

    res.status(201).json({
      success: true,
      data: {
        order_id: thirdPartyOrderId,
        client_order_id: client_order_id,
        merchant_trade_no: merchantTradeNo,
        store_type: store_type,
        amount: amount,
        barcode: ecpayResult.barcode, // 重要：返回條碼資料
        barcode_url: ecpayResult.barcodeUrl,
        expire_date: ecpayResult.expireDate,
        payment_params: ecpayResult.paymentParams,
        expire_date: ecpayResult.expireDate,
        customer_info_url: `${process.env.BASE_URL || 'http://localhost:3001'}/customer-info/${thirdPartyOrderId}`
      }
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
router.get('/orders/:orderId/status', apiKeyAuth, apiCallLogger, (req, res) => {
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
 * GET /api/third-party/orders
 * 查詢訂單列表
 */
router.get('/orders', apiKeyAuth, apiCallLogger, (req, res) => {
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
 * ECPay 付款資訊回調 (不需要 API Key 驗證)
 */
router.post('/ecpay/payment-info', (req, res) => {
  try {
    console.log('收到 ECPay 付款資訊:', req.body);
    // 這裡可以處理付款資訊更新邏輯
    res.send('1|OK');
  } catch (error) {
    console.error('ECPay 付款資訊處理失敗:', error);
    res.send('0|處理失敗');
  }
});

export default router;