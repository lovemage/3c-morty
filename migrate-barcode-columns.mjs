import pkg from 'pg';
const { Client } = pkg;

async function migrateBarcodeColumns() {
  const publicUrl = 'postgresql://postgres:BvAdHDswtNGeKgNnUuPLztfRSWIXAclO@yamanote.proxy.rlwy.net:17443/railway';
  
  console.log('🔄 開始數據庫遷移...');
  
  const client = new Client({
    connectionString: publicUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log('✅ 已連接到PostgreSQL數據庫');
    
    // 為 third_party_orders 表添加條碼相關欄位
    console.log('📝 添加 barcode_data 欄位...');
    await client.query('ALTER TABLE third_party_orders ADD COLUMN IF NOT EXISTS barcode_data JSONB');
    
    console.log('📝 添加 barcode_status 欄位...');
    await client.query(`ALTER TABLE third_party_orders ADD COLUMN IF NOT EXISTS barcode_status TEXT DEFAULT 'pending' CHECK(barcode_status IN ('pending', 'generated', 'expired'))`);
    
    // 為 ecpay_transactions 表添加條碼相關欄位
    console.log('📝 添加 barcode_info 欄位...');
    await client.query('ALTER TABLE ecpay_transactions ADD COLUMN IF NOT EXISTS barcode_info JSONB');
    
    console.log('📝 添加 updated_at 欄位...');
    await client.query('ALTER TABLE ecpay_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    
    // 檢查遷移結果
    console.log('🔍 檢查表結構...');
    const tpoColumns = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'third_party_orders' 
      AND column_name IN ('barcode_data', 'barcode_status')
      ORDER BY column_name
    `);
    
    const etColumns = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'ecpay_transactions' 
      AND column_name IN ('barcode_info', 'updated_at')
      ORDER BY column_name
    `);
    
    console.log('✅ third_party_orders 新欄位:');
    tpoColumns.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (預設值: ${row.column_default || 'null'})`);
    });
    
    console.log('✅ ecpay_transactions 新欄位:');
    etColumns.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (預設值: ${row.column_default || 'null'})`);
    });
    
    console.log('🎉 數據庫遷移完成!');
    
  } catch (error) {
    console.error('❌ 遷移失敗:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('📴 數據庫連接已關閉');
  }
}

migrateBarcodeColumns();