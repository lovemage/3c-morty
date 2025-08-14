import express from 'express';
import { allAsync, runSQL, getAsync } from '../database/database-adapter.js';

const router = express.Router();

/**
 * GET /api/customer-info/:orderId
 * 取得訂單資訊 (用於買家填寫資料頁面)
 */
router.get('/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;

    // 查詢訂單資訊
    const order = getAsync(`
      SELECT tpo.*, tpc.name, tpc.phone, tpc.address, tpc.city, tpc.postal_code, tpc.email
      FROM third_party_orders tpo
      LEFT JOIN third_party_customers tpc ON tpo.id = tpc.third_party_order_id
      WHERE tpo.id = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).json({
        error: true,
        message: '找不到訂單'
      });
    }

    // 只有已付款的訂單才能填寫資料
    if (order.status !== 'paid') {
      return res.status(400).json({
        error: true,
        message: '訂單尚未付款或狀態異常',
        order_status: order.status
      });
    }

    res.json({
      success: true,
      data: {
        order_id: order.id,
        external_order_id: order.external_order_id,
        client_system: order.client_system,
        amount: order.amount,
        product_info: order.product_info,
        paid_at: order.paid_at,
        customer: order.name ? {
          name: order.name,
          phone: order.phone,
          address: order.address,
          city: order.city,
          postal_code: order.postal_code,
          email: order.email
        } : null
      }
    });

  } catch (error) {
    console.error('取得訂單資訊失敗:', error);
    res.status(500).json({
      error: true,
      message: '取得訂單資訊失敗'
    });
  }
});

/**
 * POST /api/customer-info/:orderId
 * 儲存買家資料
 */
router.post('/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const { name, phone, address, city, postal_code, email } = req.body;

    // 驗證必要欄位
    if (!name || !phone || !address || !city || !postal_code) {
      return res.status(400).json({
        error: true,
        message: '請填寫所有必要欄位: 姓名、電話、地址、城市、郵遞區號'
      });
    }

    // 驗證手機號碼格式 (簡化版)
    if (!/^09\d{8}$/.test(phone)) {
      return res.status(400).json({
        error: true,
        message: '請輸入正確的手機號碼格式 (09xxxxxxxx)'
      });
    }

    // 驗證郵遞區號格式
    if (!/^\d{3,5}$/.test(postal_code)) {
      return res.status(400).json({
        error: true,
        message: '請輸入正確的郵遞區號格式'
      });
    }

    // 驗證 email 格式 (如果有提供)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: true,
        message: '請輸入正確的電子郵件格式'
      });
    }

    // 檢查訂單是否存在且已付款
    const order = getAsync(
      'SELECT id, status FROM third_party_orders WHERE id = ?',
      [orderId]
    );

    if (!order) {
      return res.status(404).json({
        error: true,
        message: '找不到訂單'
      });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({
        error: true,
        message: '訂單尚未付款，無法填寫資料'
      });
    }

    // 檢查是否已有客戶資料
    const existingCustomer = getAsync(
      'SELECT id FROM third_party_customers WHERE third_party_order_id = ?',
      [orderId]
    );

    if (existingCustomer) {
      // 更新現有資料
      runSQL(`
        UPDATE third_party_customers
        SET name = ?, phone = ?, address = ?, city = ?, postal_code = ?, email = ?
        WHERE third_party_order_id = ?
      `, [name, phone, address, city, postal_code, email || null, orderId]);
    } else {
      // 插入新資料
      runSQL(`
        INSERT INTO third_party_customers (
          third_party_order_id, name, phone, address, city, postal_code, email
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, name, phone, address, city, postal_code, email || null]);
    }

    res.json({
      success: true,
      message: '客戶資料已儲存'
    });

  } catch (error) {
    console.error('儲存客戶資料失敗:', error);
    res.status(500).json({
      error: true,
      message: '儲存資料失敗'
    });
  }
});

/**
 * GET /api/customer-info/:orderId/export
 * 匯出客戶資料 (提供給第三方系統使用)
 */
router.get('/:orderId/export', (req, res) => {
  try {
    const { orderId } = req.params;
    const { format = 'json' } = req.query;

    // 查詢完整訂單和客戶資訊
    const orderWithCustomer = getAsync(`
      SELECT 
        tpo.id, tpo.external_order_id, tpo.client_system, tpo.amount, 
        tpo.product_info, tpo.paid_at, tpo.created_at,
        tpc.name, tpc.phone, tpc.address, tpc.city, tpc.postal_code, tpc.email,
        et.merchant_trade_no, et.payment_date, et.payment_type
      FROM third_party_orders tpo
      LEFT JOIN third_party_customers tpc ON tpo.id = tpc.third_party_order_id
      LEFT JOIN ecpay_transactions et ON tpo.id = et.third_party_order_id
      WHERE tpo.id = ?
    `, [orderId]);

    if (!orderWithCustomer) {
      return res.status(404).json({
        error: true,
        message: '找不到訂單'
      });
    }

    if (!orderWithCustomer.name) {
      return res.status(400).json({
        error: true,
        message: '客戶尚未填寫資料'
      });
    }

    const exportData = {
      order_info: {
        internal_order_id: orderWithCustomer.id,
        external_order_id: orderWithCustomer.external_order_id,
        client_system: orderWithCustomer.client_system,
        amount: orderWithCustomer.amount,
        product_info: orderWithCustomer.product_info,
        merchant_trade_no: orderWithCustomer.merchant_trade_no,
        payment_date: orderWithCustomer.payment_date,
        payment_type: orderWithCustomer.payment_type,
        paid_at: orderWithCustomer.paid_at,
        created_at: orderWithCustomer.created_at
      },
      customer_info: {
        name: orderWithCustomer.name,
        phone: orderWithCustomer.phone,
        address: orderWithCustomer.address,
        city: orderWithCustomer.city,
        postal_code: orderWithCustomer.postal_code,
        email: orderWithCustomer.email,
        full_address: `${orderWithCustomer.postal_code} ${orderWithCustomer.city}${orderWithCustomer.address}`
      }
    };

    if (format === 'csv') {
      // 簡單的 CSV 格式
      const csvHeader = 'Order ID,External Order ID,Amount,Product,Customer Name,Phone,Address,City,Postal Code,Email,Payment Date\n';
      const csvData = `${orderWithCustomer.id},${orderWithCustomer.external_order_id},${orderWithCustomer.amount},"${orderWithCustomer.product_info}","${orderWithCustomer.name}",${orderWithCustomer.phone},"${orderWithCustomer.address}",${orderWithCustomer.city},${orderWithCustomer.postal_code},${orderWithCustomer.email || ''},${orderWithCustomer.payment_date || ''}`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="order-${orderId}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      // JSON 格式
      res.json({
        success: true,
        data: exportData
      });
    }

  } catch (error) {
    console.error('匯出客戶資料失敗:', error);
    res.status(500).json({
      error: true,
      message: '匯出失敗'
    });
  }
});

export default router;