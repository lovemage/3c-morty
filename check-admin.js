import { getAsync, allAsync } from './server/database/database-adapter.js';

async function checkAdminAccount() {
  console.log('🔍 檢查資料庫中的管理員帳號...\n');
  
  try {
    // 查詢所有用戶
    const users = await allAsync('SELECT id, email, name, role FROM users');
    
    console.log('📋 資料庫中的所有用戶:');
    users.forEach(user => {
      console.log(`  🆔 ID: ${user.id}`);
      console.log(`  📧 Email: ${user.email}`);
      console.log(`  👤 Name: ${user.name}`);
      console.log(`  🏷️  Role: ${user.role}`);
      console.log('');
    });
    
    // 特別查詢管理員帳號
    const admin = await getAsync('SELECT * FROM users WHERE email = ?', ['admin@corba3c.com']);
    
    if (admin) {
      console.log('✅ 找到管理員帳號:');
      console.log(`  📧 Email: ${admin.email}`);
      console.log(`  👤 Name: ${admin.name}`);
      console.log(`  🏷️  Role: ${admin.role}`);
      console.log(`  🔒 Password Hash: ${admin.password.substring(0, 20)}...`);
    } else {
      console.log('❌ 未找到 admin@corba3c.com 帳號');
    }
    
  } catch (error) {
    console.error('❌ 檢查過程發生錯誤:', error);
  }
}

checkAdminAccount();