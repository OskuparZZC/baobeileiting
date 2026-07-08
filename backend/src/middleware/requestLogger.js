/**
 * 请求日志中间件
 * 记录每个请求的方法、路径、状态码和耗时
 */

function requestLogger(req, res, next) {
  const start = Date.now();

  // 响应结束时记录日志
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // 状态码图标
    let icon = '✓';
    if (statusCode >= 400) icon = '✗';
    if (statusCode >= 500) icon = '✗✗';

    console.log(
      `[${new Date().toISOString()}] ${icon} ${req.method} ${req.path} ${statusCode} ${duration}ms`
    );
  });

  next();
}

module.exports = requestLogger;
