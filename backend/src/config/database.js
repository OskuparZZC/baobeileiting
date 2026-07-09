/**
 * 数据库连接配置
 *
 * Phase 1.5A: MySQL 连接基础设施
 * - memory 模式: getPool() 返回 null，默认继续使用内存存储
 * - mysql  模式: 创建 mysql2/promise 连接池
 *
 * 当前默认 DB_TYPE=memory，不自动切换到 MySQL
 */

const config = require('./index');

let pool = null;

/**
 * 获取数据库连接池
 * memory 模式返回 null，mysql 模式返回连接池
 */
function getPool() {
  if (pool) return pool;

  if (config.db.type === 'mysql') {
    const mysql = require('mysql2/promise');
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    });
  }

  return pool;
}

/**
 * 测试数据库连接
 *
 * - memory 模式: 输出提示，返回 true
 * - mysql  模式: 执行 SELECT 1，成功输出提示返回 true，失败 throw 原错误
 */
async function testConnection() {
  if (config.db.type !== 'mysql') {
    console.log('[DB] 使用内存存储模式');
    return true;
  }

  // MySQL 模式: 执行真实查询
  const p = getPool();
  try {
    const [rows] = await p.execute('SELECT 1 AS ok');
    if (rows[0] && rows[0].ok === 1) {
      console.log('[DB] MySQL 连接成功');
      return true;
    }
    throw new Error('MySQL 连接验证失败: 未收到预期响应');
  } catch (err) {
    console.error('[DB] MySQL 连接失败: ' + err.message);
    throw err;
  }
}

/**
 * 关闭数据库连接池
 * 如果连接池存在，等待所有连接释放后关闭
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] MySQL 连接池已关闭');
  }
}

module.exports = { getPool, testConnection, closePool };
