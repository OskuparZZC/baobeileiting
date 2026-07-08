/**
 * 数据库连接配置（预留）
 *
 * 当前 Phase 0 使用内存存储。
 * Phase 6 接入 MySQL 时，取消注释并安装 mysql2 依赖：
 *   npm install mysql2
 */

const config = require('./index');

let pool = null;

/**
 * 获取数据库连接池
 * 当前返回 null，Phase 6 启用时返回 MySQL 连接池
 */
function getPool() {
  if (pool) return pool;

  // Phase 6: 启用 MySQL 连接池
  // if (config.db.type === 'mysql') {
  //   const mysql = require('mysql2/promise');
  //   pool = mysql.createPool({
  //     host: config.db.host,
  //     port: config.db.port,
  //     user: config.db.user,
  //     password: config.db.password,
  //     database: config.db.name,
  //     waitForConnections: true,
  //     connectionLimit: 10,
  //     queueLimit: 0
  //   });
  // }

  return pool;
}

/**
 * 测试数据库连接
 */
async function testConnection() {
  const p = getPool();
  if (!p) {
    console.log('[DB] 使用内存存储模式');
    return true;
  }
  // Phase 6: const conn = await p.getConnection(); conn.release();
  return false;
}

module.exports = { getPool, testConnection };
