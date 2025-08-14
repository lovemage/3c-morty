import { runSQL, getAsync } from './server/database/database-adapter.js';

async function setupTestApiKey() {
  try {
    console.log('🔑 檢查測試API Key...');
    
    const testApiKey = 'test-api-key-corba3c2024';
    
    // 檢查是否已存在
    const existingKey = await getAsync('SELECT id FROM api_keys WHERE api_key = ?', [testApiKey]);
    
    if (!existingKey) {
      console.log('📝 創建測試API Key...');
      
      await runSQL(`
        INSERT INTO api_keys (key_name, api_key, client_system, is_active, rate_limit)
        VALUES (?, ?, ?, ?, ?)
      `, [
        'Corba 3C Test Client',
        testApiKey,
        'corba3c-test',
        1,
        1000
      ]);
      
      console.log('✅ 測試API Key已創建:', testApiKey);
    } else {
      console.log('✅ 測試API Key已存在:', testApiKey);
    }
    
    // 顯示所有API Keys
    const allKeys = await getAsync('SELECT * FROM api_keys');
    console.log('📋 資料庫中的API Keys:', allKeys);
    
  } catch (error) {
    console.error('❌ 設置失敗:', error);
  }
}

// 執行設置
setupTestApiKey();