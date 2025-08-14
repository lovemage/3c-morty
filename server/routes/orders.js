import express from 'express';
import crypto from 'crypto';
import { getAsync, allAsync, runSQL } from '../database/database-adapter.js';
import { authenticateToken, requireAdmin } from './auth.js';

const router = express.Router();

// 綠界支付相關函數
function formatECPayDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

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

function generateECPayForm(ecpayData) {
  const paymentUrl = process.env.NODE_ENV === 'production' 
    ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
    : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

  let formHtml = `<form id="ecpayForm" method="post" action="${paymentUrl}">`;
  
  for (const [key, value] of Object.entries(ecpayData)) {
    formHtml += `<input type="hidden" name="${key}" value="${value}" />`;
  }
  
  formHtml += `
    <button type="submit" class="ecpay-submit-btn">前往綠界付款</button>
    </form>
    <script>
      document.getElementById('ecpayForm').submit();
    </script>`;
  
  return formHtml;
}

// Helper function to get order with details
const getOrderWithDetails = async (orderId, userId = null) => {
  let orderQuery = `
    SELECT 
      o.*,
      u.name as customer_name,
      u.email as customer_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `;
  const orderParams = [orderId];
  
  if (userId) {
    orderQuery += ' AND o.user_id = ?';
    orderParams.push(userId);
  }

  const order = await getAsync(orderQuery, orderParams);
  
  if (!order) return null;

  // Get order items
  const orderItems = await allAsync(`
    SELECT 
      oi.*,
      p.name as current_product_name,
      p.image as current_product_image,
      p.stock as current_product_stock
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
    ORDER BY oi.id
  `, [orderId]);

  return {
    id: order.id,
    userId: order.user_id,
    total: order.total,
    status: order.status,
    shippingAddress: {
      name: order.shipping_name,
      address: order.shipping_address,
      city: order.shipping_city,
      postalCode: order.shipping_postal_code,
      phone: order.shipping_phone
    },
    customer: {
      name: order.customer_name,
      email: order.customer_email
    },
    items: orderItems.map(item => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      price: item.price,
      productName: item.product_name,
      productImage: item.product_image,
      currentProductName: item.current_product_name,
      currentProductImage: item.current_product_image,
      currentProductStock: item.current_product_stock
    })),
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
};

// Create new order (需要 Admin 權限)
router.post('/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress } = req.body;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.name || !shippingAddress.address || 
        !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.phone) {
      return res.status(400).json({
        error: true,
        message: '請提供完整的配送資料'
      });
    }

    // Get user's cart
    const cartItems = await allAsync(`
      SELECT 
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.image,
        p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [userId]);

    if (cartItems.length === 0) {
      return res.status(400).json({
        error: true,
        message: '購物車是空的'
      });
    }

    // Validate stock and calculate total
    let total = 0;
    const stockIssues = [];

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        stockIssues.push({
          productName: item.name,
          requested: item.quantity,
          available: item.stock
        });
      } else {
        total += item.price * item.quantity;
      }
    }

    if (stockIssues.length > 0) {
      return res.status(400).json({
        error: true,
        message: '部分商品庫存不足',
        stockIssues
      });
    }

    // Start transaction
    const orderResult = await runSQL(`
      INSERT INTO orders (
        user_id, total, status,
        shipping_name, shipping_address, shipping_city,
        shipping_postal_code, shipping_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      total,
      'pending',
      shippingAddress.name,
      shippingAddress.address,
      shippingAddress.city,
      shippingAddress.postalCode,
      shippingAddress.phone
    ]);

    const orderId = orderResult.id;

    // Add order items and update product stock
    for (const item of cartItems) {
      // Add order item
      await runSQL(`
        INSERT INTO order_items (
          order_id, product_id, quantity, price,
          product_name, product_image
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        item.product_id,
        item.quantity,
        item.price,
        item.name,
        item.image
      ]);

      // Update product stock
      await runSQL(
        'UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear user's cart
    await runSQL('DELETE FROM cart WHERE user_id = ?', [userId]);

    // Get the complete order details
    const newOrder = await getOrderWithDetails(orderId, userId);

    res.status(201).json({
      success: true,
      message: '訂單創建成功',
      order: newOrder
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: true,
      message: '創建訂單失敗'
    });
  }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = 'SELECT * FROM orders WHERE user_id = ?';
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
    }

    const orders = await allAsync(query, params);

    // Get detailed information for each order
    const detailedOrders = await Promise.all(
      orders.map(order => getOrderWithDetails(order.id, userId))
    );

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    const countParams = [userId];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const countResult = await getAsync(countQuery, countParams);

    res.json({
      success: true,
      orders: detailedOrders,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      error: true,
      message: '獲取訂單列表失敗'
    });
  }
});

// Get order by ID (user can only access their own orders)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const order = await getOrderWithDetails(id, userId);

    if (!order) {
      return res.status(404).json({
        error: true,
        message: '訂單不存在或無權限查看'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: true,
      message: '獲取訂單詳情失敗'
    });
  }
});

// Get all orders (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, userId, limit = 20, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    let query = `
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (userId) {
      query += ' AND o.user_id = ?';
      params.push(userId);
    }

    // Add sorting
    const validSortFields = ['created_at', 'updated_at', 'total', 'status'];
    const validSortOrders = ['asc', 'desc'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      query += ` ORDER BY o.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ' ORDER BY o.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = await allAsync(query, params);

    // Get detailed information for each order
    const detailedOrders = await Promise.all(
      orders.map(order => getOrderWithDetails(order.id))
    );

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders o WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(userId);
    }

    const countResult = await getAsync(countQuery, countParams);

    res.json({
      success: true,
      orders: detailedOrders,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      error: true,
      message: '獲取訂單列表失敗'
    });
  }
});

// Update order status (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: true,
        message: '無效的訂單狀態'
      });
    }

    // Check if order exists
    const existingOrder = await getAsync(
      'SELECT id, status FROM orders WHERE id = ?',
      [id]
    );

    if (!existingOrder) {
      return res.status(404).json({
        error: true,
        message: '訂單不存在'
      });
    }

    // Update order status
    await runSQL(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    // Get updated order
    const updatedOrder = await getOrderWithDetails(id);

    res.json({
      success: true,
      message: `訂單狀態已更新為 ${getStatusText(status)}`,
      order: updatedOrder
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: true,
      message: '更新訂單狀態失敗'
    });
  }
});

// Cancel order (User can cancel their own pending orders)
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Check if order exists and belongs to user (unless admin)
    let orderQuery = 'SELECT id, status, user_id FROM orders WHERE id = ?';
    let orderParams = [id];

    if (!isAdmin) {
      orderQuery += ' AND user_id = ?';
      orderParams.push(userId);
    }

    const order = await getAsync(orderQuery, orderParams);

    if (!order) {
      return res.status(404).json({
        error: true,
        message: '訂單不存在或無權限操作'
      });
    }

    // Check if order can be cancelled
    if (order.status !== 'pending' && order.status !== 'processing') {
      return res.status(400).json({
        error: true,
        message: '只能取消待處理或處理中的訂單'
      });
    }

    // Restore product stock
    const orderItems = await allAsync(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [id]
    );

    for (const item of orderItems) {
      await runSQL(
        'UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Update order status to cancelled
    await runSQL(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', id]
    );

    // Get updated order
    const updatedOrder = await getOrderWithDetails(id);

    res.json({
      success: true,
      message: '訂單已取消，庫存已恢復',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      error: true,
      message: '取消訂單失敗'
    });
  }
});

// Get order statistics (Admin only)
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    let dateFilter = '';
    if (period === '7d') {
      dateFilter = " AND created_at >= datetime('now', '-7 days')";
    } else if (period === '30d') {
      dateFilter = " AND created_at >= datetime('now', '-30 days')";
    } else if (period === '90d') {
      dateFilter = " AND created_at >= datetime('now', '-90 days')";
    }

    // Get order counts by status
    const statusStats = await allAsync(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total) as total_value
      FROM orders 
      WHERE 1=1 ${dateFilter}
      GROUP BY status
    `);

    // Get total statistics
    const totalStats = await getAsync(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        AVG(total) as average_order_value
      FROM orders 
      WHERE 1=1 ${dateFilter}
    `);

    // Get daily statistics for the period
    const dailyStats = await allAsync(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM orders 
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      stats: {
        period,
        total: totalStats,
        byStatus: statusStats,
        daily: dailyStats
      }
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      error: true,
      message: '獲取訂單統計失敗'
    });
  }
});

/**
 * POST /api/orders
 * 創建綠界BARCODE支付訂單（需要 Admin 權限）
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      merchant_trade_no,
      total_amount,
      items,
      trade_desc,
      customer_info,
      payment_method,
      client_back_url,
      return_url,
      payment_info_url
    } = req.body;

    // 驗證必要參數
    if (!merchant_trade_no || !total_amount || !items || !customer_info) {
      return res.status(400).json({
        error: true,
        message: '缺少必要參數'
      });
    }

    // 驗證客戶資訊
    if (!customer_info.name || !customer_info.phone || !customer_info.address) {
      return res.status(400).json({
        error: true,
        message: '請提供完整的客戶資料'
      });
    }

    // 創建訂單記錄
    const orderResult = await runSQL(`
      INSERT INTO orders (
        user_id, total, status,
        shipping_name, shipping_address, shipping_city,
        shipping_postal_code, shipping_phone, 
        merchant_trade_no, payment_method, trade_desc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      total_amount,
      'pending',
      customer_info.name,
      customer_info.address,
      customer_info.city,
      customer_info.postal_code,
      customer_info.phone,
      merchant_trade_no,
      payment_method || 'BARCODE',
      trade_desc
    ]);

    const orderId = orderResult.lastInsertRowid;

    // 添加訂單項目
    for (const item of items) {
      await runSQL(`
        INSERT INTO order_items (
          order_id, product_name, quantity, price
        ) VALUES (?, ?, ?, ?)
      `, [
        orderId,
        item.name,
        item.quantity,
        item.price
      ]);
    }

    // 準備綠界API參數
    const ecpayData = {
      MerchantID: process.env.ECPAY_MERCHANT_ID || '2000132',
      MerchantTradeNo: merchant_trade_no,
      MerchantTradeDate: formatECPayDate(new Date()),
      PaymentType: 'aio',
      TotalAmount: parseInt(total_amount),
      TradeDesc: trade_desc,
      ItemName: items.map(item => `${item.name}x${item.quantity}`).join('#'),
      ReturnURL: return_url,
      ChoosePayment: 'BARCODE',
      EncryptType: 1,
      StoreExpireDate: 7,
      ClientBackURL: client_back_url,
      PaymentInfoURL: payment_info_url
    };

    // 生成CheckMacValue
    ecpayData.CheckMacValue = generateCheckMacValue(
      ecpayData, 
      process.env.ECPAY_HASH_KEY || 'u0mKtzqI07btGNNT',
      process.env.ECPAY_HASH_IV || 'ZjAbsWWZUvOu8NA0'
    );

    // 生成綠界支付表單HTML
    const paymentFormHtml = generateECPayForm(ecpayData);
    
    res.json({
      success: true,
      order_id: orderId,
      merchant_trade_no: merchant_trade_no,
      payment_method: 'BARCODE',
      total_amount: total_amount,
      ecpay_form_data: ecpayData,
      payment_form_html: paymentFormHtml,
      payment_url: process.env.NODE_ENV === 'production' 
        ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
        : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
      message: '訂單已建立，請前往綠界付款頁面完成付款'
    });

  } catch (error) {
    console.error('創建綠界訂單失敗:', error);
    res.status(500).json({
      error: true,
      message: '訂單建立失敗'
    });
  }
});

// Helper function to get status text
function getStatusText(status) {
  const statusMap = {
    pending: '待處理',
    processing: '處理中',
    shipped: '已出貨',
    delivered: '已送達',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
}

export default router; 