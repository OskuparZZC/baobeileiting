/**
 * 统一配置导出
 * 读取环境变量，提供默认值
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const config = {
  // 服务
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .map(s => s.trim()),

  // 数据库（Phase 6 启用）
  db: {
    type: process.env.DB_TYPE || 'memory',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'baobeileiting'
  },

  // JWT（Phase 1 启用）
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // 是否启用 API 鉴权
  authEnabled: process.env.NODE_ENV === 'production'
};

module.exports = config;
