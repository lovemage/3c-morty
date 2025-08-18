import pkg from 'pg';
const { Client } = pkg;

async function deployApiKeyViaPublicUrl() {
  const publicUrl = 'postgresql://postgres:BvAdHDswtNGeKgNnUuPLztfRSWIXAclO@yamanote.proxy.rlwy.net:17443/railway';
  const apiKey = 'api-key-corba3c-prod-1755101802637fufedw01d8l';
  
  console.log('🚀 使用公開URL連接到生產數據庫...');
  console.log('🔐 API Key:', apiKey);
  
  const client = new Client({
    connectionString: publicUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log('✅ 成功連接到PostgreSQL數據庫');
    
    // 檢查API Key是否已存在
    console.log('🔍 檢查API Key是否已存在...');
    const checkResult = await client.query('SELECT * FROM api_keys WHERE api_key = $1', [apiKey]);
    
    if (checkResult.rows.length > 0) {
      const existing = checkResult.rows[0];
      console.log('✅ API Key已存在於生產數據庫:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   名稱: ${existing.key_name}`);
      console.log(`   客戶端: ${existing.client_system}`);
      console.log(`   狀態: ${existing.is_active ? '✅ 活躍' : '❌ 停用'}`);
      
      if (!existing.is_active) {
        console.log('🔄 激活API Key...');
        await client.query('UPDATE api_keys SET is_active = $1, updated_at = NOW() WHERE api_key = $2', [1, apiKey]);
        console.log('✅ API Key已激活!');
      }
    } else {
      console.log('📝 創建新的API Key...');
      await client.query(`
        INSERT INTO api_keys (key_name, api_key, client_system, is_active, rate_limit, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, ['Corba 3C Production Client', apiKey, 'corba3c-production', 1, 5000]);
      console.log('✅ API Key創建完成!');
    }
    
    // 最終驗證
    console.log('🔍 最終驗證...');
    const verifyResult = await client.query('SELECT * FROM api_keys WHERE api_key = $1', [apiKey]);
    
    if (verifyResult.rows.length > 0 && verifyResult.rows[0].is_active) {
      const verified = verifyResult.rows[0];
      console.log('🎉 API Key部署成功!');
      console.log('📋 詳細信息:');
      console.log(`   ID: ${verified.id}`);
      console.log(`   名稱: ${verified.key_name}`);
      console.log(`   客戶端: ${verified.client_system}`);
      console.log(`   速率限制: ${verified.rate_limit}/分鐘`);
      console.log(`   創建時間: ${verified.created_at}`);
      console.log(`   更新時間: ${verified.updated_at}`);
      console.log('');
      console.log('🧪 現在可以測試API調用了!');
      console.log('測試命令:');
      console.log('curl -X POST https://corba3c-production.up.railway.app/api/third-party/barcode/create \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log(`  -H "x-api-key: ${apiKey}" \\`);
      console.log('  -d \'{"amount": 150, "client_order_id": "test-001", "callback_url": "https://your-callback-url.com"}\'');
    } else {
      throw new Error('API Key部署驗證失敗');
    }
    
  } catch (error) {
    console.error('❌ 部署失敗:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('📴 數據庫連接已關閉');
  }
}

deployApiKeyViaPublicUrl();