// Database adapter - 強制使用 PostgreSQL

async function getDatabaseModule() {
  // 強制使用 PostgreSQL 數據庫
  console.log('🐘 使用 PostgreSQL 數據庫');
  return await import('./postgresql-init.js');
}

const databaseModule = await getDatabaseModule();

export const {
  initializeDatabase,
  runSQL,
  getAsync,
  allAsync
} = databaseModule;