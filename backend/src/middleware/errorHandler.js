/**
 * 统一错误处理中间件
 *
 * 捕获所有未处理的错误，返回统一格式
 * 必须在路由之后注册
 */

const { serverError } = require('../utils/response');

/**
 * 统一错误处理
 */
function errorHandler(err, req, res, _next) {
  // 记录错误日志
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // CORS 错误
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      code: 403,
      message: '跨域请求被拒绝',
      data: null
    });
  }

  // JSON 解析错误
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      code: 400,
      message: '请求体 JSON 格式错误',
      data: null
    });
  }

  return serverError(res);
}

/**
 * 404 处理中间件
 */
function notFoundHandler(req, res) {
  return res.status(404).json({
    code: 404,
    message: `接口不存在: ${req.method} ${req.path}`,
    data: null
  });
}

module.exports = { errorHandler, notFoundHandler };
