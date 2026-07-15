/**
 * 图鉴收集 API 路由
 *
 * Phase 4.1：
 * GET    /api/collections/me      - 获取当前用户图鉴  [auth]
 * POST   /api/collections/unlock  - 解锁/更新图鉴条目  [auth]
 */

const express = require('express');
const router = express.Router();

const collectionModel = require('../models/collection');
const { authMiddleware } = require('../middleware/auth');
const { success, created, error, serverError } = require('../utils/response');

// ==================== 获取当前用户图鉴 ====================

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const rows = await collectionModel.findByUser(req.user.id);

    // 将 snake_case 行转换为 camelCase
    const collections = rows.map(r => ({
      drinkId: r.drink_id,
      unlockedAt: r.unlocked_at,
      timesTried: r.times_tried,
    }));

    return success(res, {
      collections,
      count: collections.length,
    });
  } catch (err) {
    console.error('查询图鉴失败:', err);
    return serverError(res, '查询图鉴失败');
  }
});

// ==================== 解锁/更新图鉴条目 ====================

router.post('/unlock', authMiddleware, async (req, res) => {
  try {
    const { drinkId, unlockedAt } = req.body;

    if (!drinkId) {
      return error(res, 400, '请提供饮品 ID');
    }

    const result = await collectionModel.upsert(
      req.user.id,
      parseInt(drinkId, 10),
      unlockedAt || new Date().toISOString().split('T')[0]
    );

    if (result.inserted) {
      return created(res, { drinkId, unlockedAt }, '图鉴解锁成功');
    }
    return success(res, { drinkId, unlockedAt }, '图鉴已更新');
  } catch (err) {
    console.error('解锁图鉴失败:', err);
    return serverError(res, '解锁图鉴失败');
  }
});

module.exports = router;
