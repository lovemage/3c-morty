#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'server/database/database.db');

console.log('📦 開始遷移條碼相關欄位...');
console.log('🗃️ 數據庫路徑:', dbPath);

try {
  const db = new Database(dbPath);
  
  // 檢查 third_party_orders 表
  const tableInfo = db.prepare("PRAGMA table_info(third_party_orders)").all();
  const hasBarcodeStatus = tableInfo.some(col => col.name === 'barcode_status');
  const hasExpireDate = tableInfo.some(col => col.name === 'expire_date');
  const hasBarcodeData = tableInfo.some(col => col.name === 'barcode_data');
  
  console.log('📋 third_party_orders 現有欄位:', tableInfo.map(col => col.name).join(', '));
  
  if (!hasExpireDate) {
    console.log('➕ 添加 expire_date 欄位...');
    db.exec('ALTER TABLE third_party_orders ADD COLUMN expire_date DATETIME');
  } else {
    console.log('✅ expire_date 欄位已存在');
  }
  
  if (!hasBarcodeStatus) {
    console.log('➕ 添加 barcode_status 欄位...');
    db.exec(`ALTER TABLE third_party_orders ADD COLUMN barcode_status TEXT DEFAULT 'pending' CHECK(barcode_status IN ('pending', 'generated', 'expired'))`);
  } else {
    console.log('✅ barcode_status 欄位已存在');
  }
  
  if (!hasBarcodeData) {
    console.log('➕ 添加 barcode_data 欄位...');
    db.exec('ALTER TABLE third_party_orders ADD COLUMN barcode_data TEXT');
  } else {
    console.log('✅ barcode_data 欄位已存在');
  }
  
  // 檢查 ecpay_transactions 表
  const ecpayTableInfo = db.prepare("PRAGMA table_info(ecpay_transactions)").all();
  const hasBarcodeInfo = ecpayTableInfo.some(col => col.name === 'barcode_info');
  
  console.log('📋 ecpay_transactions 現有欄位:', ecpayTableInfo.map(col => col.name).join(', '));
  
  if (!hasBarcodeInfo) {
    console.log('➕ 添加 barcode_info 欄位到 ecpay_transactions...');
    db.exec('ALTER TABLE ecpay_transactions ADD COLUMN barcode_info TEXT');
  } else {
    console.log('✅ barcode_info 欄位已存在');
  }
  
  // 驗證更新
  const updatedTableInfo = db.prepare("PRAGMA table_info(third_party_orders)").all();
  const updatedEcpayTableInfo = db.prepare("PRAGMA table_info(ecpay_transactions)").all();
  console.log('✅ 更新後 third_party_orders 欄位:', updatedTableInfo.map(col => col.name).join(', '));
  console.log('✅ 更新後 ecpay_transactions 欄位:', updatedEcpayTableInfo.map(col => col.name).join(', '));
  
  db.close();
  console.log('🎉 數據庫遷移完成！');
  
} catch (error) {
  console.error('❌ 數據庫遷移失敗:', error);
  process.exit(1);
}