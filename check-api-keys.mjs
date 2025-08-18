import pkg from 'pg';
const { Client } = pkg;

async function checkApiKeys() {
  const publicUrl = 'postgresql://postgres:BvAdHDswtNGeKgNnUuPLztfRSWIXAclO@yamanote.proxy.rlwy.net:17443/railway';
  
  console.log('🔍 查詢生產數據庫中的所有 API Keys...');
  
  const client = new Client({
    connectionString: publicUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log('✅ 成功連接到PostgreSQL數據庫');
    
    // 查詢所有 API Keys
    const result = await client.query('SELECT id, key_name, api_key, client_system, is_active, rate_limit, created_at FROM api_keys ORDER BY id');
    
    if (result.rows.length === 0) {
      console.log('❌ 沒有找到任何 API Keys');
    } else {
      console.log(`📋 找到 ${result.rows.length} 個 API Keys:`);
      console.log('');
      
      result.rows.forEach((key, index) => {
        console.log(`${index + 1}. ID: ${key.id}`);
        console.log(`   名稱: ${key.key_name}`);
        console.log(`   客戶端: ${key.client_system}`);
        console.log(`   狀態: ${key.is_active ? '✅ 活躍' : '❌ 停用'}`);
        console.log(`   速率限制: ${key.rate_limit}/分鐘`);
        console.log(`   API Key: ${key.api_key}`);
        console.log(`   創建時間: ${key.created_at}`);
        console.log('');
      });
      
      // 顯示活躍的 API Keys
      const activeKeys = result.rows.filter(key => key.is_active);
      if (activeKeys.length > 0) {
        console.log('🔑 目前活躍的 API Keys:');
        activeKeys.forEach(key => {
          console.log(`   ${key.client_system}: ${key.api_key}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 查詢失敗:', error.message);
  } finally {
    await client.end();
    console.log('📴 數據庫連接已關閉');
  }
}

checkApiKeys();