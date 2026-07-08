/**
 * 用户相关 API 路由（预留）
 * Phase 1 实现
 *
 * POST   /api/users/register  - 用户注册
 * POST   /api/users/login     - 用户登录
 * GET    /api/users/:id       - 获取用户信息
 * PUT    /api/users/:id       - 更新用户信息
 */

const express = require('express');
const router = express.Router();
const { success } = require('../utils/response');

// TODO: Phase 1 实现
router.get('/', (req, res) => {
  success(res, null, '用户接口待实现（Phase 1）');
});

module.exports = router;
