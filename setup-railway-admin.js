#!/usr/bin/env node

import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

// 測試Railway PostgreSQL環境的Admin設置
async function setupRailwayAdmin() {
  // Railway的DATABASE_URL
  const DATABASE_URL = 'postgresql://postgres:J5I*x4AjVjw9xNJWPqOhfw@junction.proxy.rlwy.net:13166/railway';
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔗 連接到Railway PostgreSQL...');
    
    const client = await pool.connect();
    
    // 檢查users表是否存在
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    console.log('📋 Users表存在:', tableExists.rows[0].exists);
    
    if (!tableExists.rows[0].exists) {
      console.log('⚠️  Users表不存在，需要初始化數據庫');
      client.release();
      await pool.end();
      return;
    }
    
    // 檢查是否已有admin用戶
    const adminExists = await client.query('SELECT id FROM users WHERE email = $1', ['admin@corba3c.com']);
    
    if (adminExists.rows.length === 0) {
      console.log('👤 創建管理員帳戶...');
      
      const hashedPassword = await bcrypt.hash('admin32123', 10);
      
      await client.query(`
        INSERT INTO users (email, password, name, role) 
        VALUES ($1, $2, $3, $4)
      `, ['admin@corba3c.com', hashedPassword, 'Corba Admin', 'admin']);
      
      console.log('✅ 管理員帳戶已創建: admin@corba3c.com / admin32123');
    } else {
      console.log('✅ 管理員帳戶已存在');
    }
    
    // 檢查API Keys表
    const apiKeysExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'api_keys'
      );
    `);
    
    console.log('🔑 API Keys表存在:', apiKeysExists.rows[0].exists);
    
    if (apiKeysExists.rows[0].exists) {
      // 檢查測試API Key
      const testApiKey = await client.query('SELECT id FROM api_keys WHERE api_key = $1', ['test-api-key-corba3c2024']);
      
      if (testApiKey.rows.length === 0) {
        console.log('🔑 創建測試API Key...');
        
        await client.query(`
          INSERT INTO api_keys (key_name, api_key, client_system, is_active, rate_limit)
          VALUES ($1, $2, $3, $4, $5)
        `, ['Corba 3C Test Client', 'test-api-key-corba3c2024', 'corba3c-test', true, 1000]);
        
        console.log('✅ 測試API Key已創建: test-api-key-corba3c2024');
      } else {
        console.log('✅ 測試API Key已存在');
      }
    }
    
    // 顯示所有用戶
    const allUsers = await client.query('SELECT id, email, name, role FROM users');
    console.log('👥 所有用戶:', allUsers.rows);
    
    // 顯示所有API Keys
    if (apiKeysExists.rows[0].exists) {
      const allKeys = await client.query('SELECT id, key_name, client_system, is_active FROM api_keys');
      console.log('🔑 所有API Keys:', allKeys.rows);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ 設置失敗:', error);
  } finally {
    await pool.end();
  }
}

// 執行設置
console.log('🚀 開始設置Railway Admin...');
setupRailwayAdmin().then(() => {
  console.log('✅ 設置完成');
}).catch(error => {
  console.error('❌ 設置程序失敗:', error);
  process.exit(1);
});
