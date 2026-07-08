/**
 * 饮品记录 API 路由（预留）
 * Phase 2 实现
 *
 * POST   /api/records           - 创建饮品记录
 * GET    /api/records           - 获取记录列表
 * DELETE /api/records/:id       - 删除记录
 */

const express = require('express');
const router = express.Router();
const { success } = require('../utils/response');

// TODO: Phase 2 实现
router.get('/', (req, res) => {
  success(res, null, '记录接口待实现（Phase 2）');
});

module.exports = router;
