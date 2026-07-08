/**
 * 健康检查路由
 * GET /api/health
 */

const express = require('express');
const router = express.Router();
const { success } = require('../utils/response');

router.get('/', (req, res) => {
  success(res, {
    status: 'ok',
    version: '2.1.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  }, '服务运行正常');
});

module.exports = router;
