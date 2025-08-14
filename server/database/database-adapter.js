// Database adapter - 自動選擇 SQLite 或 PostgreSQL

async function getDatabaseModule() {
  if (process.env.DATABASE_URL) {
    // 使用 PostgreSQL (Railway 環境)
    console.log('🐘 使用 PostgreSQL 數據庫');
    return await import('./postgresql-init.js');
  } else {
    // 使用 SQLite (本地開發環境)
    console.log('🗃️  使用 SQLite 數據庫');
    return await import('./init.js');
  }
}

const databaseModule = await getDatabaseModule();

export const {
  initializeDatabase,
  runSQL,
  getAsync,
  allAsync
} = databaseModule;