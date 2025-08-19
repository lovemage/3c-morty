#!/usr/bin/env node

// 簡單的健康檢查腳本

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function healthCheck() {
  console.log('🏥 Railway 健康檢查開始...');
  console.log('🌐 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔑 DATABASE_URL 存在:', !!process.env.DATABASE_URL);
  console.log('🚀 BASE_URL:', process.env.BASE_URL || '未設定');
  
  if (process.env.DATABASE_URL) {
    try {
      console.log('🐘 測試 PostgreSQL 連接...');
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      await client.connect();
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ PostgreSQL 連接成功:', result.rows[0].current_time);
      
      // 檢查重要表是否存在
      const tables = ['third_party_orders', 'ecpay_transactions', 'api_keys'];
      for (const table of tables) {
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        console.log(`📋 表 ${table}:`, tableCheck.rows[0].exists ? '✅ 存在' : '❌ 不存在');
      }
      
      await client.end();
    } catch (error) {
      console.error('❌ PostgreSQL 連接失敗:', error.message);
      process.exit(1);
    }
  }
  
  console.log('🎉 健康檢查完成！');
}

healthCheck().catch(console.error);