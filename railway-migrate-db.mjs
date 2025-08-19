#!/usr/bin/env node

// Railway生產環境數據庫遷移腳本

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isPostgreSQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

console.log('🚀 Railway生產環境數據庫遷移');
console.log('📊 數據庫類型:', isPostgreSQL ? 'PostgreSQL' : 'SQLite');

if (isPostgreSQL) {
  console.log('🐘 連接到PostgreSQL...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL連接成功');

    // 檢查並添加缺少的欄位
    const migrations = [
      {
        table: 'third_party_orders',
        column: 'barcode_status',
        sql: `ALTER TABLE third_party_orders ADD COLUMN IF NOT EXISTS barcode_status TEXT DEFAULT 'pending'`
      },
      {
        table: 'third_party_orders', 
        column: 'barcode_data',
        sql: `ALTER TABLE third_party_orders ADD COLUMN IF NOT EXISTS barcode_data TEXT`
      },
      {
        table: 'ecpay_transactions',
        column: 'barcode_info', 
        sql: `ALTER TABLE ecpay_transactions ADD COLUMN IF NOT EXISTS barcode_info TEXT`
      }
    ];

    for (const migration of migrations) {
      try {
        console.log(`➕ 添加欄位 ${migration.table}.${migration.column}...`);
        await client.query(migration.sql);
        console.log(`✅ ${migration.table}.${migration.column} 添加成功`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ ${migration.table}.${migration.column} 已存在`);
        } else {
          console.error(`❌ ${migration.table}.${migration.column} 添加失敗:`, error.message);
        }
      }
    }

    await client.end();
    console.log('🎉 PostgreSQL遷移完成！');
    
  } catch (error) {
    console.error('❌ PostgreSQL遷移失敗:', error);
    process.exit(1);
  }
} else {
  console.log('💡 SQLite環境，遷移已在本地完成');
  console.log('📋 請確保本地數據庫已正確遷移並推送到Git');
}