#!/usr/bin/env node

import pkg from 'pg';

const { Pool } = pkg;

// 直接測試PostgreSQL查詢
async function debugPostgreSQL() {
  const DATABASE_URL = 'postgresql://postgres:J5I*x4AjVjw9xNJWPqOhfw@junction.proxy.rlwy.net:13166/railway';
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔗 連接到Railway PostgreSQL...');
    
    const client = await pool.connect();
    
    // 檢查third_party_orders表是否存在
    console.log('📋 檢查third_party_orders表...');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'third_party_orders'
      );
    `);
    
    console.log('third_party_orders表存在:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // 查看表結構
      console.log('\\n📊 表結構:');
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'third_party_orders'
        ORDER BY ordinal_position;
      `);
      
      console.table(columns.rows);
      
      // 查看所有記錄
      console.log('\\n📄 所有記錄:');
      const allRecords = await client.query('SELECT * FROM third_party_orders LIMIT 10');
      console.log('記錄數量:', allRecords.rows.length);
      
      if (allRecords.rows.length > 0) {
        console.table(allRecords.rows);
      }
      
      // 測試具體的查詢
      console.log('\\n🔍 測試訂單號查詢...');
      const testOrderId = 'CLI_FIXED_1755179417_15596';
      const testSystem = 'cli-test-2024';
      
      const queryResult = await client.query(
        'SELECT id FROM third_party_orders WHERE external_order_id = $1 AND client_system = $2',
        [testOrderId, testSystem]
      );
      
      console.log(`查詢 external_order_id='${testOrderId}' AND client_system='${testSystem}':`);
      console.log('結果:', queryResult.rows);
      console.log('是否存在:', queryResult.rows.length > 0);
      
      // 查詢所有的external_order_id
      console.log('\\n📝 所有external_order_id:');
      const allIds = await client.query('SELECT external_order_id, client_system FROM third_party_orders');
      console.table(allIds.rows);
      
    } else {
      console.log('❌ third_party_orders表不存在！');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  } finally {
    await pool.end();
  }
}

// 執行測試
console.log('🚀 開始調試PostgreSQL...');
debugPostgreSQL().then(() => {
  console.log('✅ 調試完成');
}).catch(error => {
  console.error('❌ 調試失敗:', error);
  process.exit(1);
});
