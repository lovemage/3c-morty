import express from 'express';
import { getAsync, allAsync, runSQL } from '../database/database-adapter.js';
import { authenticateToken, requireAdmin } from './auth.js';

const router = express.Router();

// Helper function to transform user data (remove sensitive info)
const transformUser = (user) => {
  if (!user) return null;
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, search, limit = 20, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    // Add role filter
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    // Add search filter
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add sorting
    const validSortFields = ['created_at', 'updated_at', 'name', 'email', 'role'];
    const validSortOrders = ['asc', 'desc'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ' ORDER BY created_at DESC';
    }

    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = await allAsync(query, params);
    const transformedUsers = users.map(transformUser);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];

    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await getAsync(countQuery, countParams);

    res.json({
      success: true,
      users: transformedUsers,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: true,
      message: '獲取用戶列表失敗'
    });
  }
});

// Get user by ID (Admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getAsync(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({
        error: true,
        message: '用戶不存在'
      });
    }

    // Get user's order statistics
    const orderStats = await getAsync(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_spent,
        AVG(total) as average_order_value
      FROM orders 
      WHERE user_id = ?
    `, [id]);

    // Get user's recent orders
    const recentOrders = await allAsync(`
      SELECT id, total, status, created_at
      FROM orders 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [id]);

    res.json({
      success: true,
      user: transformUser(user),
      stats: {
        orders: orderStats,
        recentOrders
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: true,
      message: '獲取用戶資料失敗'
    });
  }
});

// Update user role (Admin only)
router.patch('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: true,
        message: '無效的用戶角色'
      });
    }

    // Check if user exists
    const existingUser = await getAsync(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      return res.status(404).json({
        error: true,
        message: '用戶不存在'
      });
    }

    // Prevent removing admin role from the last admin
    if (existingUser.role === 'admin' && role === 'user') {
      const adminCount = await getAsync(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['admin']
      );

      if (adminCount.count <= 1) {
        return res.status(400).json({
          error: true,
          message: '無法移除最後一個管理員的權限'
        });
      }
    }

    // Update user role
    await runSQL(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, id]
    );

    // Get updated user
    const updatedUser = await getAsync(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `用戶 "${existingUser.name}" 的角色已更新為 ${role === 'admin' ? '管理員' : '一般用戶'}`,
      user: transformUser(updatedUser)
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      error: true,
      message: '更新用戶角色失敗'
    });
  }
});

// Update user info (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        error: true,
        message: '請提供姓名和電子郵件'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        message: '請提供有效的電子郵件地址'
      });
    }

    // Check if user exists
    const existingUser = await getAsync(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      return res.status(404).json({
        error: true,
        message: '用戶不存在'
      });
    }

    // Check if email is already taken by another user
    const emailTaken = await getAsync(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email.toLowerCase(), id]
    );

    if (emailTaken) {
      return res.status(400).json({
        error: true,
        message: '該電子郵件已被其他用戶使用'
      });
    }

    // Update user
    await runSQL(
      'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email.toLowerCase(), id]
    );

    // Get updated user
    const updatedUser = await getAsync(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '用戶資料更新成功',
      user: transformUser(updatedUser)
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: true,
      message: '更新用戶資料失敗'
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Prevent user from deleting themselves
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({
        error: true,
        message: '無法刪除自己的帳戶'
      });
    }

    // Check if user exists
    const existingUser = await getAsync(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      return res.status(404).json({
        error: true,
        message: '用戶不存在'
      });
    }

    // Prevent deleting the last admin
    if (existingUser.role === 'admin') {
      const adminCount = await getAsync(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['admin']
      );

      if (adminCount.count <= 1) {
        return res.status(400).json({
          error: true,
          message: '無法刪除最後一個管理員帳戶'
        });
      }
    }

    // Check if user has pending orders
    const pendingOrders = await getAsync(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status IN (?, ?)',
      [id, 'pending', 'processing']
    );

    if (pendingOrders.count > 0) {
      return res.status(400).json({
        error: true,
        message: '無法刪除：該用戶有待處理的訂單'
      });
    }

    // Delete user (this will cascade delete cart items due to foreign key constraint)
    await runSQL('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `用戶 "${existingUser.name}" 已刪除`
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: true,
      message: '刪除用戶失敗'
    });
  }
});

// Get user statistics (Admin only)
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

    // Get user counts by role
    const roleStats = await allAsync(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users 
      WHERE 1=1 ${dateFilter}
      GROUP BY role
    `);

    // Get total user count
    const totalUsers = await getAsync(`
      SELECT COUNT(*) as total FROM users WHERE 1=1 ${dateFilter}
    `);

    // Get registration trend
    const registrationTrend = await allAsync(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as registrations
      FROM users 
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get top customers by orders
    const topCustomers = await allAsync(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(o.id) as total_orders,
        SUM(o.total) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.name, u.email
      HAVING total_orders > 0
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: {
        period,
        total: totalUsers.total,
        byRole: roleStats,
        registrationTrend,
        topCustomers
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: true,
      message: '獲取用戶統計失敗'
    });
  }
});

// Search users (Admin only)
router.get('/search/query', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q, role, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: true,
        message: '搜尋關鍵字至少需要2個字符'
      });
    }

    let query = 'SELECT * FROM users WHERE (name LIKE ? OR email LIKE ?)';
    const params = [`%${q}%`, `%${q}%`];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY name ASC LIMIT ?';
    params.push(parseInt(limit));

    const users = await allAsync(query, params);
    const transformedUsers = users.map(transformUser);

    res.json({
      success: true,
      users: transformedUsers,
      query: q
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      error: true,
      message: '搜尋用戶失敗'
    });
  }
});

// Get user's orders (Admin viewing specific user's orders)
router.get('/:id/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;

    // Check if user exists
    const user = await getAsync(
      'SELECT id, name, email FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({
        error: true,
        message: '用戶不存在'
      });
    }

    let query = 'SELECT * FROM orders WHERE user_id = ?';
    const params = [id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = await allAsync(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    const countParams = [id];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const countResult = await getAsync(countQuery, countParams);

    res.json({
      success: true,
      user: transformUser(user),
      orders,
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
      message: '獲取用戶訂單失敗'
    });
  }
});

export default router; 