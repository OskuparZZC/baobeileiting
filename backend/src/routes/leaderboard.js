/**
 * 排行榜 API 路由
 * Phase 4.3.1 实现
 *
 * GET /api/leaderboard  - XP 总榜（Top 50）
 *   Query: ?limit=N  (1-100, 默认 50)
 */

const express = require('express');
const router = express.Router();
const { UserStatsModel } = require('../models/user');
const { authMiddleware } = require('../middleware/auth');
const { success, serverError } = require('../utils/response');

/**
 * GET /api/leaderboard
 *
 * 返回 XP 总榜，排序规则：
 *   1. totalXp DESC
 *   2. totalRecords DESC
 *   3. createdAt ASC
 *   4. userId ASC
 *
 * 排除 totalXp=0 AND totalRecords=0 的空白用户
 *
 * 当前用户不在 Top N 时，currentUser 返回该用户的真实排名和详情
 * 当前用户在 Top N 中时，currentUser 返回该条目副本
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;

    // limit 校验：默认 50，范围 1-100，非法值回退
    let limit = 50;
    if (req.query.limit !== undefined) {
      const parsed = parseInt(req.query.limit, 10);
      if (!isNaN(parsed)) {
        limit = Math.max(1, Math.min(100, parsed));
      }
    }

    const result = await UserStatsModel.getLeaderboard({
      limit,
      currentUserId,
    });

    return success(res, result);
  } catch (err) {
    console.error('排行榜查询失败:', err);
    return serverError(res, '排行榜查询失败');
  }
});

module.exports = router;
