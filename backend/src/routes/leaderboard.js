/**
 * 排行榜 API 路由（预留）
 * Phase 4 实现
 *
 * GET /api/leaderboard  - 排行榜数据
 */

const express = require('express');
const router = express.Router();
const { success } = require('../utils/response');

// TODO: Phase 4 实现
router.get('/', (req, res) => {
  success(res, null, '排行榜接口待实现（Phase 4）');
});

module.exports = router;
