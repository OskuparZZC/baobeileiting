/**
 * 饮品记录 API 路由
 *
 * Phase 2A：
 * POST   /api/records        - 创建饮品记录     [auth]
 * GET    /api/records/me     - 获取当前用户记录  [auth]
 * DELETE /api/records/:id    - 删除自己的记录    [auth]
 */

const express = require('express');
const router = express.Router();

const { recordModel } = require('../models/record');
const { authMiddleware } = require('../middleware/auth');
const { success, created, error, serverError } = require('../utils/response');

// ==================== 创建饮品记录 ====================

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { drinkId, customBrand, customName, size, price, rating, note, date } = req.body;

    // 必须有 drinkId 或 (customBrand + customName)
    if (!drinkId && (!customBrand || !customName)) {
      return error(res, 400, '请选择官方饮品或填写自定义品牌和饮品名称');
    }

    if (!date) {
      return error(res, 400, '请提供日期');
    }

    console.log("DEBUG CREATE BODY:", req.body);
    console.log("DEBUG USER:", req.user);

    const record = await recordModel.create({
      userId: req.user.id,
      drinkId: drinkId || null,
      customBrand: customBrand || null,
      customName: customName || null,
      size: size || null,
      price: price || null,
      rating: rating || null,
      note: note || null,
      date,
    });

    return created(res, record, '记录创建成功');
  } catch (err) {
    console.error('创建记录失败:', err);
    return serverError(res, '创建记录失败');
  }
});

// ==================== 获取当前用户记录 ====================

router.get('/me', authMiddleware, async (req, res) => {
  try {
    console.log("DEBUG FIND USER:", req.user);
    const limit = parseInt(req.query.limit, 10) || undefined;
    const records = await recordModel.findByUser(req.user.id, { limit });
    const total = await recordModel.countByUser(req.user.id);

    return success(res, {
      records,
      total,
    });
  } catch (err) {
    console.error('查询记录失败:', err);
    return serverError(res, '查询记录失败');
  }
});

// ==================== 删除自己的记录 ====================

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return error(res, 400, '无效的记录 ID');
    }

    const deleted = await recordModel.delete(id, req.user.id);

    if (!deleted) {
      return error(res, 404, '记录不存在或无权删除');
    }

    return success(res, null, '删除成功');
  } catch (err) {
    console.error('删除记录失败:', err);
    return serverError(res, '删除记录失败');
  }
});

module.exports = router;
