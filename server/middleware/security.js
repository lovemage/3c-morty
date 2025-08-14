import { getAsync } from '../database/database-adapter.js';
import crypto from 'crypto';

// 簡單的記憶體快取（生產環境建議使用 Redis）
const rateLimitCache = new Map();

/**
 * API Key 驗證中間件
 */
export const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: true,
      message: '缺少 API Key'
    });
  }

  try {
    // 查詢 API Key
    const keyInfo = getAsync(
      'SELECT * FROM api_keys WHERE api_key = ? AND is_active = 1',
      [apiKey]
    );

    if (!keyInfo) {
      return res.status(401).json({
        error: true,
        message: '無效的 API Key'
      });
    }

    // 檢查 IP 限制
    if (keyInfo.allowed_ips) {
      const allowedIPs = keyInfo.allowed_ips.split(',').map(ip => ip.trim());
      const clientIP = getClientIP(req);
      
      if (!isIPAllowed(clientIP, allowedIPs)) {
        securityLog('warn', 'IP 限制違規', req, {
          client_ip: clientIP,
          allowed_ips: allowedIPs,
          api_key_id: keyInfo.id,
          client_system: keyInfo.client_system
        });
        return res.status(403).json({
          error: true,
          message: 'IP 不在允許清單中'
        });
      }
    }

    req.clientInfo = {
      system: keyInfo.client_system,
      keyName: keyInfo.key_name,
      rateLimit: keyInfo.rate_limit
    };

    next();
  } catch (error) {
    console.error('API Key 驗證錯誤:', error);
    return res.status(500).json({
      error: true,
      message: '驗證失敗'
    });
  }
};

/**
 * 費率限制中間件
 */
export const rateLimiter = (windowMs = 60000, maxRequests = null) => {
  return (req, res, next) => {
    const key = req.clientInfo ? req.clientInfo.system : getClientIP(req);
    const limit = maxRequests || req.clientInfo?.rateLimit || 100;
    const now = Date.now();
    const windowStart = now - windowMs;

    // 清理過期的記錄
    if (!rateLimitCache.has(key)) {
      rateLimitCache.set(key, []);
    }

    const requests = rateLimitCache.get(key);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= limit) {
      return res.status(429).json({
        error: true,
        message: '請求過於頻繁，請稍後再試',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }

    // 記錄當前請求
    validRequests.push(now);
    rateLimitCache.set(key, validRequests);

    // 設定回應標頭
    res.set({
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': Math.max(0, limit - validRequests.length - 1),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });

    next();
  };
};

/**
 * 請求驗證中間件 - 驗證請求內容的完整性
 */
export const requestValidator = (req, res, next) => {
  // 檢查必要的 Content-Type
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: true,
        message: '請求必須使用 application/json 格式'
      });
    }
  }

  // 檢查請求體大小 (防止過大的請求)
  if (req.body && JSON.stringify(req.body).length > 10000) {
    return res.status(413).json({
      error: true,
      message: '請求內容過大'
    });
  }

  next();
};

/**
 * CSRF 保護中間件 (簡化版)
 */
export const csrfProtection = (req, res, next) => {
  // 對於 API 請求，檢查 X-Requested-With 標頭
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const requestedWith = req.headers['x-requested-with'];
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // 允許來自同源的請求或有適當標頭的請求
    if (!requestedWith && !isValidOrigin(origin, referer, req.get('host'))) {
      return res.status(403).json({
        error: true,
        message: '請求來源驗證失敗'
      });
    }
  }

  next();
};

/**
 * 輸入清理中間件
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * 取得客戶端 IP
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         'unknown';
}

/**
 * 檢查 IP 是否在允許清單中 (支援 CIDR 表示法)
 */
function isIPAllowed(clientIP, allowedIPs) {
  // 處理 IPv6 映射的 IPv4 地址
  if (clientIP.startsWith('::ffff:')) {
    clientIP = clientIP.substring(7);
  }

  for (const allowedIP of allowedIPs) {
    // 萬用字符
    if (allowedIP === '*') {
      return true;
    }

    // 完全匹配
    if (allowedIP === clientIP) {
      return true;
    }

    // CIDR 表示法檢查
    if (allowedIP.includes('/')) {
      if (isIPInCIDR(clientIP, allowedIP)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 檢查 IP 是否在 CIDR 範圍內
 */
function isIPInCIDR(ip, cidr) {
  try {
    const [network, prefixLength] = cidr.split('/');
    const prefix = parseInt(prefixLength, 10);

    // 轉換 IP 為 32 位整數
    const ipToInt = (ip) => {
      return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    };

    const ipInt = ipToInt(ip);
    const networkInt = ipToInt(network);
    const mask = (-1 << (32 - prefix)) >>> 0;

    return (ipInt & mask) === (networkInt & mask);
  } catch (error) {
    console.error('CIDR 檢查錯誤:', error);
    return false;
  }
}

/**
 * 檢查請求來源是否有效
 */
function isValidOrigin(origin, referer, host) {
  if (!origin && !referer) return false;
  
  const validHosts = [
    `http://${host}`,
    `https://${host}`,
    `http://localhost:5173`,
    `http://localhost:3000`,
    `http://127.0.0.1:5173`,
    process.env.FRONTEND_URL
  ].filter(Boolean);

  if (origin) {
    return validHosts.some(validHost => origin.startsWith(validHost));
  }

  if (referer) {
    return validHosts.some(validHost => referer.startsWith(validHost));
  }

  return false;
}

/**
 * 清理物件中的敏感字符
 */
function sanitizeObject(obj) {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // 移除潛在的 XSS 字符
      cleaned[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeObject(value);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * 產生安全的隨機字串 (用於 API Key)
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 雜湊 API Key (用於儲存)
 */
export function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * 安全日誌記錄
 */
export function securityLog(level, message, req, extra = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    ...extra
  };

  console.log(`[SECURITY-${level.toUpperCase()}]`, JSON.stringify(logData));
}

// 清理過期的費率限制記錄
setInterval(() => {
  const now = Date.now();
  const expireTime = 60000; // 1 分鐘

  for (const [key, requests] of rateLimitCache.entries()) {
    const validRequests = requests.filter(timestamp => timestamp > (now - expireTime));
    if (validRequests.length === 0) {
      rateLimitCache.delete(key);
    } else {
      rateLimitCache.set(key, validRequests);
    }
  }
}, 60000); // 每分鐘清理一次