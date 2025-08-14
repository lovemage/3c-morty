import { runSQL, getAsync } from './server/database/database-adapter.js';

async function syncApiKeyToProduction() {
  try {
    const apiKey = 'api-key-corba3c-prod-1755101802637fufedw01d8l';
    
    console.log('🔄 同步API Key到生產環境...');
    console.log('🔐 API Key:', apiKey);
    
    // 檢查當前環境
    if (process.env.DATABASE_URL) {
      console.log('🐘 當前使用PostgreSQL數據庫 (生產環境)');
    } else {
      console.log('🗃️ 當前使用SQLite數據庫 (本地環境)');
    }
    
    // 檢查API Key是否已存在
    const existingKey = await getAsync('SELECT id, key_name, client_system, is_active FROM api_keys WHERE api_key = ?', [apiKey]);
    
    if (existingKey) {
      console.log('✅ API Key已存在於當前數據庫:');
      console.log(`   ID: ${existingKey.id}`);
      console.log(`   名稱: ${existingKey.key_name}`);
      console.log(`   客戶端: ${existingKey.client_system}`);
      console.log(`   狀態: ${existingKey.is_active ? '活躍' : '停用'}`);
    } else {
      console.log('📝 在當前環境創建API Key...');
      
      await runSQL(`
        INSERT INTO api_keys (key_name, api_key, client_system, is_active, rate_limit, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        'Corba 3C Production Client',
        apiKey,
        'corba3c-production',
        1,
        5000
      ]);
      
      console.log('✅ API Key已創建於當前環境!');
    }
    
    // 列出所有API Keys
    console.log('\n📋 當前數據庫中的所有API Keys:');
    const allKeys = await getAsync('SELECT * FROM api_keys ORDER BY created_at DESC');
    
    if (Array.isArray(allKeys)) {
      allKeys.forEach((key, index) => {
        console.log(`${index + 1}. ${key.key_name}`);
        console.log(`   客戶端: ${key.client_system}`);
        console.log(`   狀態: ${key.is_active ? '活躍' : '停用'}`);
        console.log(`   API Key: ${key.api_key.substring(0, 30)}...`);
        console.log('');
      });
    } else if (allKeys) {
      console.log(`1. ${allKeys.key_name}`);
      console.log(`   客戶端: ${allKeys.client_system}`);
      console.log(`   狀態: ${allKeys.is_active ? '活躍' : '停用'}`);
      console.log(`   API Key: ${allKeys.api_key}`);
    } else {
      console.log('   沒有找到任何API Keys');
    }
    
    console.log('\n🌐 生產環境使用說明:');
    console.log('如果要在Railway生產環境使用，請在Railway環境中運行:');
    console.log('DATABASE_URL="your_railway_postgres_url" node sync-api-key-to-production.js');
    
  } catch (error) {
    console.error('❌ 同步失敗:', error);
  }
}

// 執行同步
syncApiKeyToProduction();