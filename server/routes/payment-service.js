import express from 'express';
import { allAsync, runSQL, getAsync } from '../database/database-adapter.js';
import { createCVSOrder, handlePaymentCallback } from '../services/ecpay.js';
import { 
  apiKeyAuth, 
  rateLimiter, 
  requestValidator, 
  sanitizeInput,
  securityLog 
} from '../middleware/security.js';
import crypto from 'crypto';

const router = express.Router();

// 為付款服務創建專門的費率限制
const paymentRateLimit = rateLimiter(60000, 60);  // 建立付款：每分鐘60次
const queryRateLimit = rateLimiter(60000, 300);   // 查詢狀態：每分鐘300次

/**
 * POST /api/payment/create
 * 建立付款請求 (金流服務核心API)
 */
router.post('/create', 
  requestValidator, 
  sanitizeInput, 
  apiKeyAuth, 
  paymentRateLimit,
  async (req, res) => {
  try {
    const { 
      amount, 
      description, 
      external_ref, 
      notify_url 
    } = req.body;

    securityLog('info', '付款請求', req, {
      client_system: req.clientInfo.system,
      amount,
      external_ref
    });

    // 驗證必要參數
    if (!amount || !description || !external_ref) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: '缺少必要參數: amount, description, external_ref'
        }
      });
    }

    // 驗證金額 (根據綠界規範調整為 1000-10000)
    if (typeof amount !== 'number' || amount < 1000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: '付款金額最小為 NT$ 1,000'
        }
      });
    }

    if (amount > 10000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AMOUNT_TOO_LARGE',
          message: '付款金額不可超過 NT$ 10,000'
        }
      });
    }

    // 檢查外部參考號是否重複
    const existingPayment = getAsync(`
      SELECT id FROM third_party_orders 
      WHERE external_order_id = ? AND client_system = ?
    `, [external_ref, req.clientInfo.system]);

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_REF',
          message: '第三方參考號已存在'
        }
      });
    }

    // 自動生成商品資訊 (金流服務自動處理)
    const autoProductInfo = `金流代收服務 - ${description}`;
    
    // 建立付款記錄
    const paymentResult = runSQL(`
      INSERT INTO third_party_orders (
        external_order_id, client_system, amount, product_info, 
        callback_url, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `, [external_ref, req.clientInfo.system, amount, autoProductInfo, notify_url || null]);

    const paymentId = paymentResult.lastInsertRowid;
    const paymentCode = `PAY${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(paymentId).padStart(3, '0')}`;

    // 建立 ECPay CVS 付款
    const ecpayResult = await createCVSOrder({
      thirdPartyOrderId: paymentId,
      amount,
      productInfo: autoProductInfo,
      clientSystem: req.clientInfo.system
    });

    if (!ecpayResult.success) {
      // 失敗時清理記錄
      runSQL('DELETE FROM third_party_orders WHERE id = ?', [paymentId]);
      throw new Error(ecpayResult.message || '付款處理失敗');
    }

    // 更新付款資訊
    runSQL(`
      UPDATE third_party_orders 
      SET payment_url = ?, expire_date = ?
      WHERE id = ?
    `, [ecpayResult.paymentUrl, ecpayResult.expireDate, paymentId]);

    // 自動建立對應的內部商品訂單 (完全自動化)
    await createInternalProductOrder(paymentId, amount, description);

    res.status(201).json({
      success: true,
      data: {
        payment_id: paymentCode,
        external_ref: external_ref,
        amount: amount,
        status: 'pending',
        payment_info: {
          method: 'cvs_barcode',
          barcode_url: ecpayResult.paymentUrl,
          expire_time: ecpayResult.expireDate
        },
        created_at: new Date().toISOString()
      }
    });

    securityLog('info', '付款請求已建立', req, {
      payment_id: paymentCode,
      amount
    });

  } catch (error) {
    console.error('建立付款失敗:', error);
    securityLog('error', '付款請求失敗', req, { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_CREATION_FAILED',
        message: '付款處理失敗，請稍後重試'
      }
    });
  }
});

/**
 * GET /api/payment/:paymentId/status
 * 查詢付款狀態
 */
router.get('/:paymentId/status', apiKeyAuth, queryRateLimit, (req, res) => {
  try {
    const { paymentId } = req.params;

    // 從付款代碼解析出內部 ID
    const internalId = parsePaymentId(paymentId);
    if (!internalId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: '找不到指定的付款記錄'
        }
      });
    }

    const payment = getAsync(`
      SELECT tpo.*, et.payment_date, et.payment_type
      FROM third_party_orders tpo
      LEFT JOIN ecpay_transactions et ON tpo.id = et.third_party_order_id
      WHERE tpo.id = ? AND tpo.client_system = ?
    `, [internalId, req.clientInfo.system]);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: '找不到指定的付款記錄'
        }
      });
    }

    // 檢查是否過期
    let status = payment.status;
    if (status === 'pending' && new Date() > new Date(payment.expire_date)) {
      status = 'expired';
      // 更新資料庫狀態
      runSQL('UPDATE third_party_orders SET status = ? WHERE id = ?', ['expired', internalId]);
    }

    const responseData = {
      payment_id: paymentId,
      external_ref: payment.external_order_id,
      amount: payment.amount,
      status: status,
      created_at: payment.created_at
    };

    if (payment.paid_at) {
      responseData.paid_at = payment.paid_at;
    }

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('查詢付款狀態失敗:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_FAILED',
        message: '查詢失敗'
      }
    });
  }
});

/**
 * GET /api/payment/list
 * 查詢付款列表
 */
router.get('/list', apiKeyAuth, queryRateLimit, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const maxLimit = Math.min(parseInt(limit), 100);

    let whereClause = 'WHERE tpo.client_system = ?';
    let params = [req.clientInfo.system];

    if (status && ['pending', 'paid', 'expired', 'failed'].includes(status)) {
      whereClause += ' AND tpo.status = ?';
      params.push(status);
    }

    const payments = allAsync(`
      SELECT 
        tpo.id, tpo.external_order_id, tpo.amount, tpo.status,
        tpo.created_at, tpo.paid_at
      FROM third_party_orders tpo
      ${whereClause}
      ORDER BY tpo.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, maxLimit, parseInt(offset)]);

    // 轉換為付款代碼格式
    const formattedPayments = payments.map(payment => ({
      payment_id: generatePaymentCode(payment.id, payment.created_at),
      external_ref: payment.external_order_id,
      amount: payment.amount,
      status: payment.status,
      created_at: payment.created_at,
      paid_at: payment.paid_at
    }));

    // 取得總數
    const totalResult = getAsync(`
      SELECT COUNT(*) as total
      FROM third_party_orders tpo
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          page: parseInt(page),
          limit: maxLimit,
          total: totalResult.total,
          pages: Math.ceil(totalResult.total / maxLimit)
        }
      }
    });

  } catch (error) {
    console.error('查詢付款列表失敗:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LIST_QUERY_FAILED',
        message: '查詢失敗'
      }
    });
  }
});

/**
 * 自動建立內部商品訂單 (金流服務自動處理)
 */
async function createInternalProductOrder(paymentId, amount, description) {
  try {
    // 自動生成商品 (如果不存在)
    let product = getAsync(`
      SELECT id FROM products 
      WHERE name = ? AND category = 'payment-service'
    `, [`金流商品 - ${description}`]);

    if (!product) {
      // 自動建立虛擬商品
      const productResult = runSQL(`
        INSERT INTO products (
          name, category, price, original_price, description, 
          specifications, stock, image, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `金流商品 - ${description}`,
        'payment-service',
        amount,
        amount,
        `透過金流服務建立的虛擬商品：${description}`,
        JSON.stringify(['金流服務', '自動生成', '虛擬商品']),
        9999, // 虛擬商品無庫存限制
        '/images/payment-service.png',
        0
      ]);

      product = { id: productResult.lastInsertRowid };
    }

    // 自動建立系統用戶 (如果不存在)
    let systemUser = getAsync(`
      SELECT id FROM users WHERE email = ? AND role = ?
    `, ['system@payment-service.local', 'system']);

    if (!systemUser) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('system-auto-generated', 10);
      
      const userResult = runSQL(`
        INSERT INTO users (email, password, name, role)
        VALUES (?, ?, ?, ?)
      `, ['system@payment-service.local', hashedPassword, 'Payment Service System', 'system']);

      systemUser = { id: userResult.lastInsertRowid };
    }

    // 建立內部訂單
    const orderResult = runSQL(`
      INSERT INTO orders (
        user_id, total, status, shipping_name, shipping_address, 
        shipping_city, shipping_postal_code, shipping_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      systemUser.id,
      amount,
      'pending',
      '金流服務自動訂單',
      '系統自動生成',
      '服務地區',
      '00000',
      '00000000000'
    ]);

    // 建立訂單項目
    runSQL(`
      INSERT INTO order_items (
        order_id, product_id, quantity, price, product_name, product_image
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      orderResult.lastInsertRowid,
      product.id,
      1,
      amount,
      `金流商品 - ${description}`,
      '/images/payment-service.png'
    ]);

    // 關聯付款記錄與內部訂單
    runSQL(`
      UPDATE third_party_orders 
      SET internal_order_id = ? 
      WHERE id = ?
    `, [orderResult.lastInsertRowid, paymentId]);

    console.log(`✅ 自動建立內部訂單: ${orderResult.lastInsertRowid} (付款: ${paymentId})`);

  } catch (error) {
    console.error('建立內部訂單失敗:', error);
    // 不影響主要付款流程，只記錄錯誤
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
 * 解析付款代碼為內部 ID
 */
function parsePaymentId(paymentCode) {
  const match = paymentCode.match(/^PAY\d{8}(\d+)$/);
  return match ? parseInt(match[1]) : null;
}

/**
 * 生成通知簽名
 */
function generateNotificationSignature(paymentId, externalRef, amount, paidAt, apiKey) {
  const data = paymentId + externalRef + amount + paidAt;
  return crypto.createHmac('sha256', apiKey).update(data).digest('hex');
}

export default router;