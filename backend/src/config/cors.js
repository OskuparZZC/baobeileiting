/**
 * CORS 配置
 */
const config = require('./index');

const corsOptions = {
  origin: function (origin, callback) {
    // 允许无 origin 的请求（如 Postman、curl）
    if (!origin) return callback(null, true);

    if (config.corsOrigins.includes(origin) || config.nodeEnv !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 预检请求缓存 24 小时
};

module.exports = corsOptions;
