import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAsync, runSQL } from '../database/database-adapter.js';

const router = express.Router();

// JWT secret (should be in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'corba_3c_shop_secret_key_2024';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: true, 
      message: '需要提供認證令牌' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getAsync(
      'SELECT id, email, name, role FROM users WHERE id = ?', 
      [decoded.userId]
    );
    
    if (!user) {
      return res.status(401).json({ 
        error: true, 
        message: '無效的認證令牌' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: true, 
      message: '令牌驗證失敗' 
    });
  }
};

// Middleware to check admin role
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: true,
      message: '需要管理員權限'
    });
  }
  next();
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: true,
        message: '請提供所有必要資料'
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

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        error: true,
        message: '密碼長度至少需要6個字符'
      });
    }

    // Check if email already exists
    const existingUser = await getAsync(
      'SELECT id FROM users WHERE email = ?', 
      [email.toLowerCase()]
    );

    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: '該電子郵件已被註冊'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await runSQL(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email.toLowerCase(), hashedPassword, name]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get user data (without password)
    const user = await getAsync(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: '註冊成功',
      user,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: true,
      message: '註冊失敗，請稍後再試'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: '請提供電子郵件和密碼'
      });
    }

    // Find user
    const user = await getAsync(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({
        error: true,
        message: '電子郵件或密碼錯誤'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: true,
        message: '電子郵件或密碼錯誤'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: '登入成功',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: true,
      message: '登入失敗，請稍後再試'
    });
  }
});

// Verify token and get current user
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      error: true,
      message: '驗證失敗'
    });
  }
});

// Logout (client-side token removal, but we can add token blacklisting if needed)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we just return success and let the client remove the token
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: true,
      message: '登出失敗'
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await getAsync(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        error: true,
        message: '用戶不存在'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: true,
      message: '獲取用戶資料失敗'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        error: true,
        message: '請提供所有必要資料'
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

    // Check if email is already taken by another user
    const existingUser = await getAsync(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email.toLowerCase(), userId]
    );

    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: '該電子郵件已被其他用戶使用'
      });
    }

    // Update user
    await runSQL(
      'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email.toLowerCase(), userId]
    );

    // Get updated user data
    const updatedUser = await getAsync(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '用戶資料更新成功',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: true,
      message: '更新用戶資料失敗'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: true,
        message: '請提供當前密碼和新密碼'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: true,
        message: '新密碼長度至少需要6個字符'
      });
    }

    // Get current user with password
    const user = await getAsync(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: true,
        message: '當前密碼錯誤'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await runSQL(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: '密碼更新成功'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: true,
      message: '密碼更新失敗'
    });
  }
});

export default router; 