import express from 'express';
import { allAsync, runSQL, getAsync } from '../database/database-adapter.js';
import { generateSecureToken, securityLog } from '../middleware/security.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 管理員驗證中間件
const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: true,
      message: '需要管理員權限'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'corba_3c_shop_secret_key_2024');
    
    // 查詢用戶資訊
    const user = getAsync('SELECT * FROM users WHERE id = ? AND role = ?', [decoded.userId, 'admin']);
    
    if (!user) {
      return res.status(401).json({
        error: true,
        message: '無效的管理員權限'
      });
    }

    req.admin = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({
      error: true,
      message: '無效的認證令牌'
    });
  }
};

/**
 * GET /api/admin/api-keys
 * 取得所有 API Keys
 */
router.get('/api-keys', adminAuth, async (req, res) => {
  try {
    const apiKeys = allAsync(`
      SELECT id, key_name, client_system, is_active, rate_limit, 
             allowed_ips, created_at, updated_at,
             SUBSTR(api_key, 1, 8) || '...' || SUBSTR(api_key, -4) as masked_key
      FROM api_keys
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    console.error('取得 API Keys 失敗:', error);
    res.status(500).json({
      error: true,
      message: '取得失敗'
    });
  }
});

/**
 * POST /api/admin/api-keys
 * 建立新的 API Key
 */
router.post('/api-keys', adminAuth, async (req, res) => {
  try {
    const { key_name, client_system, rate_limit = 100, allowed_ips } = req.body;

    if (!key_name || !client_system) {
      return res.status(400).json({
        error: true,
        message: '缺少必要參數: key_name, client_system'
      });
    }

    // 檢查名稱是否已存在
    const existing = getAsync('SELECT id FROM api_keys WHERE key_name = ?', [key_name]);
    if (existing) {
      return res.status(409).json({
        error: true,
        message: 'API Key 名稱已存在'
      });
    }

    // 產生新的 API Key
    const apiKey = 'corba_' + generateSecureToken(24);

    const result = runSQL(`
      INSERT INTO api_keys (key_name, api_key, client_system, rate_limit, allowed_ips)
      VALUES (?, ?, ?, ?, ?)
    `, [key_name, apiKey, client_system, rate_limit, allowed_ips || null]);

    // 記錄安全日誌
    securityLog('info', 'API Key 已建立', req, {
      admin_id: req.admin.id,
      key_name,
      client_system,
      new_key_id: result.lastInsertRowid
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        key_name,
        api_key: apiKey, // 只在建立時完整顯示
        client_system,
        rate_limit,
        allowed_ips
      }
    });
  } catch (error) {
    console.error('建立 API Key 失敗:', error);
    res.status(500).json({
      error: true,
      message: '建立失敗'
    });
  }
});

/**
 * PUT /api/admin/api-keys/:keyId
 * 更新 API Key 設定
 */
router.put('/api-keys/:keyId', adminAuth, async (req, res) => {
  try {
    const { keyId } = req.params;
    const { key_name, client_system, rate_limit, allowed_ips, is_active } = req.body;

    // 檢查 API Key 是否存在
    const existingKey = getAsync('SELECT * FROM api_keys WHERE id = ?', [keyId]);
    if (!existingKey) {
      return res.status(404).json({
        error: true,
        message: '找不到指定的 API Key'
      });
    }

    // 更新資料
    runSQL(`
      UPDATE api_keys 
      SET key_name = ?, client_system = ?, rate_limit = ?, 
          allowed_ips = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      key_name || existingKey.key_name,
      client_system || existingKey.client_system,
      rate_limit !== undefined ? rate_limit : existingKey.rate_limit,
      allowed_ips !== undefined ? allowed_ips : existingKey.allowed_ips,
      is_active !== undefined ? is_active : existingKey.is_active,
      keyId
    ]);

    // 記錄安全日誌
    securityLog('info', 'API Key 已更新', req, {
      admin_id: req.admin.id,
      key_id: keyId,
      key_name: key_name || existingKey.key_name
    });

    res.json({
      success: true,
      message: 'API Key 已更新'
    });
  } catch (error) {
    console.error('更新 API Key 失敗:', error);
    res.status(500).json({
      error: true,
      message: '更新失敗'
    });
  }
});

/**
 * DELETE /api/admin/api-keys/:keyId
 * 刪除 API Key
 */
router.delete('/api-keys/:keyId', adminAuth, async (req, res) => {
  try {
    const { keyId } = req.params;

    // 檢查 API Key 是否存在
    const existingKey = getAsync('SELECT * FROM api_keys WHERE id = ?', [keyId]);
    if (!existingKey) {
      return res.status(404).json({
        error: true,
        message: '找不到指定的 API Key'
      });
    }

    // 軟刪除：設為非活動狀態
    runSQL('UPDATE api_keys SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [keyId]);

    // 記錄安全日誌
    securityLog('warn', 'API Key 已停用', req, {
      admin_id: req.admin.id,
      key_id: keyId,
      key_name: existingKey.key_name
    });

    res.json({
      success: true,
      message: 'API Key 已停用'
    });
  } catch (error) {
    console.error('刪除 API Key 失敗:', error);
    res.status(500).json({
      error: true,
      message: '刪除失敗'
    });
  }
});

/**
 * GET /api/admin/third-party-orders
 * 取得第三方訂單列表
 */
router.get('/third-party-orders', adminAuth, async (req, res) => {
  try {
    const { status, client_system, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status) {
      whereClause += ' AND tpo.status = ?';
      params.push(status);
    }

    if (client_system) {
      whereClause += ' AND tpo.client_system = ?';
      params.push(client_system);
    }

    const orders = allAsync(`
      SELECT 
        tpo.*, 
        et.merchant_trade_no, et.payment_date, et.payment_type,
        tpc.name as customer_name, tpc.phone as customer_phone
      FROM third_party_orders tpo
      LEFT JOIN ecpay_transactions et ON tpo.id = et.third_party_order_id
      LEFT JOIN third_party_customers tpc ON tpo.id = tpc.third_party_order_id
      ${whereClause}
      ORDER BY tpo.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // 取得總數
    const totalResult = getAsync(`
      SELECT COUNT(*) as total
      FROM third_party_orders tpo
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalResult.total,
          pages: Math.ceil(totalResult.total / limit)
        }
      }
    });
  } catch (error) {
    console.error('取得第三方訂單列表失敗:', error);
    res.status(500).json({
      error: true,
      message: '取得失敗'
    });
  }
});

/**
 * GET /api/admin/api-call-logs
 * 取得API調用記錄
 */
router.get('/api-call-logs', adminAuth, async (req, res) => {
  try {
    const { api_key_id, client_system, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (api_key_id) {
      whereClause += ' AND acl.api_key_id = ?';
      params.push(api_key_id);
    }

    if (client_system) {
      whereClause += ' AND acl.client_system = ?';
      params.push(client_system);
    }

    if (status) {
      whereClause += ' AND acl.response_status = ?';
      params.push(parseInt(status));
    }

    const logs = allAsync(`
      SELECT 
        acl.*, 
        ak.key_name,
        ak.client_system as key_client_system
      FROM api_call_logs acl
      LEFT JOIN api_keys ak ON acl.api_key_id = ak.id
      ${whereClause}
      ORDER BY acl.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // 取得總數
    const totalResult = getAsync(`
      SELECT COUNT(*) as total
      FROM api_call_logs acl
      LEFT JOIN api_keys ak ON acl.api_key_id = ak.id
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalResult.total,
          pages: Math.ceil(totalResult.total / limit)
        }
      }
    });
  } catch (error) {
    console.error('取得API調用記錄失敗:', error);
    res.status(500).json({
      error: true,
      message: '取得失敗'
    });
  }
});

/**
 * GET /api/admin/statistics
 * 取得統計資訊
 */
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    // 訂單統計
    const orderStats = getAsync(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue
      FROM third_party_orders
    `);

    // 客戶端系統統計
    const systemStats = allAsync(`
      SELECT 
        client_system,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as revenue
      FROM third_party_orders
      GROUP BY client_system
      ORDER BY order_count DESC
    `);

    // 最近 7 天的訂單趨勢
    const dailyStats = allAsync(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as revenue
      FROM third_party_orders
      WHERE created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    res.json({
      success: true,
      data: {
        overview: orderStats,
        systems: systemStats,
        daily_trend: dailyStats
      }
    });
  } catch (error) {
    console.error('取得統計資訊失敗:', error);
    res.status(500).json({
      error: true,
      message: '取得統計失敗'
    });
  }
});

export default router;