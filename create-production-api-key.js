import { runSQL, getAsync } from './server/database/database-adapter.js';

async function createProductionApiKey() {
  try {
    console.log('🔑 創建正式環境API Key...');
    
    // 生成一個生產級別的API Key
    const apiKey = 'api-key-corba3c-prod-' + Date.now() + Math.random().toString(36).substring(2, 15);
    
    console.log('📝 創建API Key:', apiKey);
    
    await runSQL(`
      INSERT INTO api_keys (key_name, api_key, client_system, is_active, rate_limit)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'Corba 3C Production Client',
      apiKey,
      'corba3c-production',
      1,
      5000  // 更高的速率限制用於生產環境
    ]);
    
    console.log('✅ API Key已創建成功!');
    console.log('🔐 您的API Key:', apiKey);
    console.log('📊 速率限制: 5000 請求/小時');
    console.log('🏷️  客戶端系統: corba3c-production');
    
    // 顯示如何使用
    console.log('\n📖 使用範例:');
    console.log('curl -X POST http://localhost:3001/api/third-party/barcode/create \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log(`  -H "X-API-Key: ${apiKey}" \\`);
    console.log('  -d \'{\n    "amount": 2990,\n    "client_order_id": "PROD_ORDER_001"\n  }\'');
    
    // 查詢所有API Keys
    console.log('\n📋 資料庫中的所有API Keys:');
    const allKeys = await getAsync('SELECT * FROM api_keys ORDER BY created_at DESC');
    if (Array.isArray(allKeys)) {
      allKeys.forEach((key, index) => {
        console.log(`${index + 1}. ${key.key_name} (${key.client_system}) - ${key.is_active ? '活躍' : '停用'}`);
        console.log(`   API Key: ${key.api_key.substring(0, 20)}...`);
        console.log(`   速率限制: ${key.rate_limit}/hr`);
      });
    } else if (allKeys) {
      console.log(`1. ${allKeys.key_name} (${allKeys.client_system}) - ${allKeys.is_active ? '活躍' : '停用'}`);
      console.log(`   API Key: ${allKeys.api_key}`);
    }
    
  } catch (error) {
    console.error('❌ 創建失敗:', error);
  }
}

// 執行創建
createProductionApiKey();