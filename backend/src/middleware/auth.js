/**
 * 认证中间件
 *
 * 修订1：环境感知安全策略
 * ┌─────────────┬────────────────┬──────────────────┐
 * │ 环境         │ AUTH_ENABLED    │ 行为              │
 * ├─────────────┼────────────────┼──────────────────┤
 * │ development │ false（默认）   │ 测试模式 x-user-id │
 * │ development │ true           │ JWT 认证          │
 * │ production  │ 忽略           │ 永远 JWT 认证     │
 * └─────────────┴────────────────┴──────────────────┘
 *
 * 安全约束：
 * - production 环境硬编码强制 JWT，不可绕过
 * - 测试模式仅通过 x-user-id 请求头注入，不接受 query/body 参数
 *
 * 修订2：统一使用 name 字段
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { UserModel } = require('../models/user');
const { error } = require('../utils/response');

/**
 * JWT 认证处理
 */
async function jwtAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 401, '未提供认证令牌');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret);

    // 验证 JWT 中的用户是否真实存在（防止已删除用户的旧 token 被继续使用）
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return error(res, 401, '用户不存在或已被删除');
    }

    req.user = { id: payload.userId, name: payload.name };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 401, '登录已过期，请重新登录');
    }
    return error(res, 401, '无效的认证令牌');
  }
}

/**
 * 测试模式处理（仅 development）
 * 通过 x-user-id 请求头注入用户身份
 * 禁止通过 query/body 参数指定 userId
 */
async function devAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return error(res, 401, '测试模式需要 x-user-id 请求头');
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return error(res, 401, '测试用户不存在');
  }

  req.user = { id: user.id, name: user.name };
  next();
}

/**
 * 认证中间件入口
 *
 * 逻辑：
 * 1. production 环境 → 永远走 JWT 认证
 * 2. development 环境 → 根据 AUTH_ENABLED 决定
 */
function authMiddleware(req, res, next) {
  // production 环境：强制 JWT
  if (config.nodeEnv === 'production') {
    return jwtAuth(req, res, next);
  }

  // development 环境：根据配置决定
  if (config.authEnabled === true) {
    return jwtAuth(req, res, next);
  }

  // development 测试模式
  return devAuth(req, res, next);
}

/**
 * 生成 JWT token
 * @param {Object} payload - { userId, name }
 * @returns {string} JWT token
 */
function generateToken(payload) {
  // 生产环境安全检查：禁止使用弱密钥
  if (config.nodeEnv === 'production' && config.isJwtSecretWeak()) {
    throw new Error(
      '[安全错误] 生产环境禁止使用默认 JWT_SECRET。请在 .env 中设置强密钥。'
    );
  }

  // 只允许写入 userId 和 name，防止敏感信息泄露
  const safePayload = {
    userId: payload.userId,
    name: payload.name,
  };

  return jwt.sign(safePayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

module.exports = { authMiddleware, generateToken };
