/**
 * 校园互助 API 路由（预留）
 * Phase 3 实现
 *
 * POST   /api/bounties              - 发布悬赏
 * GET    /api/bounties              - 悬赏列表
 * GET    /api/bounties/:id          - 悬赏详情
 * PUT    /api/bounties/:id/accept   - 接受悬赏
 * PUT    /api/bounties/:id/complete - 完成悬赏
 * PUT    /api/bounties/:id/cancel   - 取消悬赏
 */

const express = require('express');
const router = express.Router();
const { success } = require('../utils/response');

// TODO: Phase 3 实现
router.get('/', (req, res) => {
  success(res, null, '悬赏接口待实现（Phase 3）');
});

module.exports = router;
