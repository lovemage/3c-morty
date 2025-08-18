#!/usr/bin/env node

// 這個腳本專門用於在 Railway 生產環境中創建 API Key
// 使用方式: 在 Railway 環境中運行此腳本

import { runSQL, getAsync } from './server/database/database-adapter.js';

async function deployApiKeyToProduction() {
  try {
    const apiKey = 'api-key-corba3c-prod-1755101802637fufedw01d8l';
    
    console.log('🚀 部署API Key到生產環境...');
    console.log('🔐 API Key:', apiKey);
    
    // 檢查當前環境
    if (process.env.DATABASE_URL) {
      console.log('🐘 生產環境: 使用PostgreSQL數據庫');
      console.log('📡 Database URL:', process.env.DATABASE_URL ? '已設置' : '未設置');
    } else {
      console.log('⚠️  警告: 未檢測到生產環境DATABASE_URL');
      console.log('🗃️  當前使用SQLite數據庫 (本地環境)');
    }
    
    // 檢查API Key是否已存在
    console.log('🔍 檢查API Key是否已存在...');
    const existingKey = await getAsync(
      'SELECT id, key_name, client_system, is_active FROM api_keys WHERE api_key = ?', 
      [apiKey]
    );
    
    if (existingKey) {
      console.log('✅ API Key已存在於數據庫:');
      console.log(`   ID: ${existingKey.id}`);
      console.log(`   名稱: ${existingKey.key_name}`);
      console.log(`   客戶端: ${existingKey.client_system}`);
      console.log(`   狀態: ${existingKey.is_active ? '✅ 活躍' : '❌ 停用'}`);
      
      if (!existingKey.is_active) {
        console.log('🔄 激活現有的API Key...');
        await runSQL('UPDATE api_keys SET is_active = 1 WHERE api_key = ?', [apiKey]);
        console.log('✅ API Key已激活!');
      }
    } else {
      console.log('📝 創建新的API Key...');
      
      // 檢查是否使用PostgreSQL (有NOW()函數)
      const isPostgreSQL = !!process.env.DATABASE_URL;
      const createdAtValue = isPostgreSQL ? 'NOW()' : "datetime('now')";
      
      await runSQL(`
        INSERT INTO api_keys (key_name, api_key, client_system, is_active, rate_limit, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ${createdAtValue}, ${createdAtValue})
      `, [
        'Corba 3C Production Client',
        apiKey,
        'corba3c-production',
        1,
        5000
      ]);
      
      console.log('✅ API Key創建成功!');
    }
    
    // 驗證API Key
    console.log('🔍 驗證API Key...');
    const verifyKey = await getAsync(
      'SELECT id, key_name, client_system, is_active, rate_limit FROM api_keys WHERE api_key = ?', 
      [apiKey]
    );
    
    if (verifyKey && verifyKey.is_active) {
      console.log('🎉 API Key部署成功!');
      console.log(`   ID: ${verifyKey.id}`);
      console.log(`   名稱: ${verifyKey.key_name}`);
      console.log(`   客戶端: ${verifyKey.client_system}`);
      console.log(`   速率限制: ${verifyKey.rate_limit} 請求/分鐘`);
      console.log(`   狀態: ✅ 活躍`);
    } else {
      throw new Error('API Key驗證失敗');
    }
    
    // 測試建議
    console.log('\n🧪 測試建議:');
    console.log('現在可以使用以下命令測試API:');
    console.log('');
    console.log('curl -X POST https://corba3c-production.up.railway.app/api/third-party/barcode/create \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log(`  -H "x-api-key: ${apiKey}" \\`);
    console.log('  -d \'{"amount": 150, "client_order_id": "test-001", "callback_url": "https://your-callback-url.com"}\'');
    
  } catch (error) {
    console.error('❌ 部署失敗:', error);
    console.error('錯誤詳情:', error.message);
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  deployApiKeyToProduction();
}

export default deployApiKeyToProduction;