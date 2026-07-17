/**
 * Express 应用入口
 * 配置中间件、路由、错误处理
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const corsOptions = require('./config/cors');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// 前端静态文件根目录（项目根目录）
const frontendRoot = path.resolve(__dirname, '../../');

// ===== 全局中间件 =====

// CORS
app.use(cors(corsOptions));

// 请求体解析
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use(requestLogger);

// ===== 路由 =====

// API 路由（所有接口统一 /api 前缀，必须在前端静态托管之前注册）
app.use('/api', routes);

// ===== 前端静态文件托管 =====

// 安全：屏蔽对后端源码和敏感文件的访问
app.use((req, res, next) => {
  const blocked = [
    '/backend', '/node_modules', '/docs',
    '/package.json', '/package-lock.json',
    '/PROJECT_STATUS.md', '/.env', '/.git',
  ];
  if (blocked.some(p => req.path.startsWith(p) || req.path === p)) {
    return res.status(404).end();
  }
  next();
});

// 托管前端静态资源（css / js / assets / index.html / manifest.json / service-worker.js 等）
app.use(express.static(frontendRoot));

// SPA 回退：非 API 的 GET 请求返回 index.html（支持前端路由如 /dashboard /profile）
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendRoot, 'index.html'));
});

// 404 处理（仅在非 API 非 GET 或未匹配的 API 路径时触发）
app.use(notFoundHandler);

// 统一错误处理（必须在最后）
app.use(errorHandler);

module.exports = app;
