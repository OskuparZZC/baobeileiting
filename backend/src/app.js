/**
 * Express 应用入口
 * 配置中间件、路由、错误处理
 */

const express = require('express');
const cors = require('cors');

const corsOptions = require('./config/cors');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ===== 全局中间件 =====

// CORS
app.use(cors(corsOptions));

// 请求体解析
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use(requestLogger);

// ===== 路由 =====

// API 路由（所有接口统一 /api 前缀）
app.use('/api', routes);

// 404 处理（必须在路由之后）
app.use(notFoundHandler);

// 统一错误处理（必须在最后）
app.use(errorHandler);

module.exports = app;
