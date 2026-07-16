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
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  /**
   * 生产环境 JWT_SECRET 安全检查
   *
   * 如果 NODE_ENV=production 且 JWT_SECRET 仍是默认弱密钥：
   *   后端启动时必须明确报错，禁止静默使用默认密钥。
   *
   * 开发环境允许使用默认密钥。
   */
  isJwtSecretWeak: function() {
    const secret = process.env.JWT_SECRET || '';
    const weakSecrets = [
      '',
      'dev-secret-change-in-production',
      'dev-secret-do-not-use-in-production',
    ];
    return weakSecrets.includes(secret);
  },

  /**
   * 认证模式开关
   *
   * 行为由 auth 中间件控制：
   * - production 环境 → 永远 JWT 认证，忽略此配置
   * - development + true  → JWT 认证
   * - development + false → x-user-id 测试模式
   *
   * 显式读取环境变量，不再根据 NODE_ENV 自动推断
   */
  authEnabled: process.env.AUTH_ENABLED === 'true'
};

module.exports = config;
