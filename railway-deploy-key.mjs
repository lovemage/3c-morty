import { getAsync, runSQL } from './server/database/database-adapter.js';

async function deployApiKey() {
  try {
    const apiKey = 'api-key-corba3c-prod-1755101802637fufedw01d8l';
    
    console.log('🚀 開始部署API Key到生產環境...');
    console.log('🔐 API Key:', apiKey);
    
    // 檢查是否為PostgreSQL環境
    if (process.env.DATABASE_URL) {
      console.log('🐘 確認: 使用PostgreSQL生產數據庫');
    } else {
      console.log('⚠️  警告: 未檢測到DATABASE_URL，可能不在生產環境');
    }
    
    // 檢查API Key是否已存在
    console.log('🔍 檢查API Key是否已存在...');
    const existing = await getAsync('SELECT * FROM api_keys WHERE api_key = $1', [apiKey]);
    
    if (existing) {
      console.log('✅ API Key已存在於生產數據庫:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   名稱: ${existing.key_name}`);
      console.log(`   客戶端: ${existing.client_system}`);
      console.log(`   狀態: ${existing.is_active ? '✅ 活躍' : '❌ 停用'}`);
      
      if (!existing.is_active) {
        console.log('🔄 激活API Key...');
        await runSQL('UPDATE api_keys SET is_active = $1, updated_at = NOW() WHERE api_key = $2', [true, apiKey]);
        console.log('✅ API Key已激活!');
      }
    } else {
      console.log('📝 創建新的API Key...');
      await runSQL(`
        INSERT INTO api_keys (key_name, api_key, client_system, is_active, rate_limit, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, ['Corba 3C Production Client', apiKey, 'corba3c-production', true, 5000]);
      console.log('✅ API Key創建完成!');
    }
    
    // 最終驗證
    console.log('🔍 最終驗證...');
    const verification = await getAsync('SELECT * FROM api_keys WHERE api_key = $1', [apiKey]);
    
    if (verification && verification.is_active) {
      console.log('🎉 API Key部署成功!');
      console.log('📋 詳細信息:');
      console.log(`   ID: ${verification.id}`);
      console.log(`   名稱: ${verification.key_name}`);
      console.log(`   客戶端: ${verification.client_system}`);
      console.log(`   速率限制: ${verification.rate_limit}/分鐘`);
      console.log(`   創建時間: ${verification.created_at}`);
      console.log(`   更新時間: ${verification.updated_at}`);
      console.log('');
      console.log('🧪 現在可以測試API調用了!');
      console.log('使用此API Key進行請求: api-key-corba3c-prod-1755101802637fufedw01d8l');
    } else {
      throw new Error('API Key部署驗證失敗');
    }
    
  } catch (error) {
    console.error('❌ 部署失敗:', error.message);
    throw error;
  }
}

deployApiKey();