import jwt from 'jsonwebtoken';
import { getAsync } from '../database/database-adapter.js';

// JWT token verification middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: '需要登入權限' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database to ensure user still exists and get latest data
    const user = await getAsync('SELECT id, email, name, role FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ message: '無效的用戶' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: '無效的token' });
  }
};

// Admin role verification middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '需要登入權限' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理員權限' });
  }

  next();
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await getAsync('SELECT id, email, name, role FROM users WHERE id = ?', [decoded.userId]);
    
    req.user = user || null;
  } catch (error) {
    req.user = null;
  }

  next();
}; 