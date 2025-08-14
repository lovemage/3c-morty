import pkg from 'pg';

const { Pool } = pkg;

// PostgreSQL 連接配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testPostgreSQLProducts() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 測試PostgreSQL產品數據...');
    
    // 測試產品總數
    const productCount = await client.query('SELECT COUNT(*) as count FROM products');
    console.log(`📊 產品總數: ${productCount.rows[0].count}`);
    
    // 測試分類產品數
    const categoryCount = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM products 
      GROUP BY category 
      ORDER BY category
    `);
    
    console.log('📋 各分類產品數:');
    categoryCount.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count}個產品`);
    });
    
    // 測試特色產品
    const featuredProducts = await client.query('SELECT name FROM products WHERE featured = 1');
    console.log(`⭐ 特色產品數: ${featuredProducts.rows.length}`);
    featuredProducts.rows.forEach(row => {
      console.log(`  - ${row.name}`);
    });
    
    // 測試價格範圍
    const priceRange = await client.query(`
      SELECT 
        MIN(price) as min_price,
        MAX(price) as max_price,
        ROUND(AVG(price)::numeric, 0) as avg_price
      FROM products
    `);
    
    console.log('💰 價格範圍:');
    console.log(`  最低價: NT$ ${priceRange.rows[0].min_price}`);
    console.log(`  最高價: NT$ ${priceRange.rows[0].max_price}`);
    console.log(`  平均價: NT$ ${priceRange.rows[0].avg_price}`);
    
    console.log('✅ PostgreSQL 產品數據測試完成！');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 執行測試
console.log('🚀 開始測試PostgreSQL產品數據...');
console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? '已設定' : '未設定');

testPostgreSQLProducts().catch(error => {
  console.error('❌ 測試程序執行失敗:', error);
  process.exit(1);
});