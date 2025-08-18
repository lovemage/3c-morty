import { runSQL, getAsync } from '../database/database-adapter.js';

/**
 * API調用記錄中間件
 * 記錄所有通過API Key認證的第三方API調用
 */
export const apiCallLogger = (req, res, next) => {
  // 只記錄通過API Key認證的請求
  if (!req.clientInfo) {
    return next();
  }

  const startTime = Date.now();
  
  // 儲存原始的 res.json 和 res.send 方法
  const originalJson = res.json;
  const originalSend = res.send;
  
  let responseBody = null;
  let responseStatus = null;

  // 攔截回應
  res.json = function(data) {
    responseBody = JSON.stringify(data);
    responseStatus = res.statusCode;
    return originalJson.call(this, data);
  };

  res.send = function(data) {
    responseBody = typeof data === 'string' ? data : JSON.stringify(data);
    responseStatus = res.statusCode;
    return originalSend.call(this, data);
  };

  // 在回應結束時記錄
  res.on('finish', () => {
    try {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // 直接從認證信息中獲取API Key ID
      if (req.clientInfo && req.clientInfo.id) {
        // 記錄API調用
        runSQL(`
          INSERT INTO api_call_logs (
            api_key_id, client_system, endpoint, method,
            request_headers, request_body, response_status,
            response_headers, response_body, client_ip,
            user_agent, processing_time, error_message
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          req.clientInfo.id,
          req.clientInfo.system,
          req.originalUrl,
          req.method,
          JSON.stringify(req.headers),
          req.body ? JSON.stringify(req.body) : null,
          responseStatus,
          JSON.stringify(res.getHeaders()),
          responseBody,
          getClientIP(req),
          req.headers['user-agent'] || null,
          processingTime,
          res.statusCode >= 400 ? responseBody : null
        ]);
      }
    } catch (error) {
      console.error('API調用記錄失敗:', error);
    }
  });

  next();
};

/**
 * 取得客戶端IP地址
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip ||
         'unknown';
}

/**
 * 記錄手動API調用（用於外部API調用）
 */
export const logManualApiCall = (apiKeyId, clientSystem, endpoint, method, requestData, responseData, processingTime, errorMessage = null) => {
  try {
    runSQL(`
      INSERT INTO api_call_logs (
        api_key_id, client_system, endpoint, method,
        request_body, response_status, response_body,
        processing_time, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      apiKeyId,
      clientSystem,
      endpoint,
      method,
      requestData ? JSON.stringify(requestData) : null,
      responseData?.status || 200,
      responseData ? JSON.stringify(responseData) : null,
      processingTime,
      errorMessage
    ]);
  } catch (error) {
    console.error('手動API調用記錄失敗:', error);
  }
};