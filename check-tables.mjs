import pkg from 'pg';
const { Client } = pkg;

async function checkTables() {
  const publicUrl = 'postgresql://postgres:BvAdHDswtNGeKgNnUuPLztfRSWIXAclO@yamanote.proxy.rlwy.net:17443/railway';
  
  const client = new Client({
    connectionString: publicUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    
    console.log('📋 檢查數據庫表...');
    
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('🗃️  現有表格:');
    result.rows.forEach(row => {
      console.log(`- ${row.tablename}`);
    });
    
    // 特別檢查API調用日誌
    const apiCallLogs = await client.query(`
      SELECT COUNT(*) as total_calls,
             MAX(created_at) as latest_call
      FROM api_call_logs
    `);
    
    console.log(`\n📞 API調用統計: 總共 ${apiCallLogs.rows[0].total_calls} 次調用`);
    console.log(`📅 最新調用時間: ${apiCallLogs.rows[0].latest_call}`);
    
    // 檢查最近的API調用
    const recentCalls = await client.query(`
      SELECT endpoint, method, response_status, client_system, created_at
      FROM api_call_logs 
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n🕐 最近10次API調用:');
    recentCalls.rows.forEach((call, index) => {
      console.log(`${index + 1}. [${call.created_at}] ${call.method} ${call.endpoint} - ${call.response_status} - ${call.client_system}`);
    });
    
  } catch (error) {
    console.error('❌ 查詢失敗:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();