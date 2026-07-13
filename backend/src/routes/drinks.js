/**
 * 饮品数据 API 路由
 *
 * Phase 2B：
 * GET /api/drinks/brands       - 获取全部启用品牌
 * GET /api/drinks               - 获取全部启用饮品
 * GET /api/drinks/search?q=xxx  - 搜索饮品
 */

const express = require('express');
const router = express.Router();

const { drinkBrandModel, drinkModel } = require('../models/drink');
const { success, error, serverError } = require('../utils/response');

// ==================== GET /api/drinks/brands ====================

router.get('/brands', async (req, res) => {
  try {
    const brands = await drinkBrandModel.findAll({ isActive: true });
    return success(res, brands, '获取品牌列表成功');
  } catch (err) {
    console.error('[drinks] 获取品牌列表失败:', err.message);
    return serverError(res, '获取品牌列表失败');
  }
});

// ==================== GET /api/drinks/search ====================

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return error(res, 400, '请提供搜索关键词');
    }

    const drinks = await drinkModel.search(q.trim());
    return success(res, drinks, '搜索饮品成功');
  } catch (err) {
    console.error('[drinks] 搜索饮品失败:', err.message);
    return serverError(res, '搜索饮品失败');
  }
});

// ==================== GET /api/drinks ====================

router.get('/', async (req, res) => {
  try {
    const drinks = await drinkModel.findAll({ isActive: true });
    return success(res, drinks, '获取饮品列表成功');
  } catch (err) {
    console.error('[drinks] 获取饮品列表失败:', err.message);
    return serverError(res, '获取饮品列表失败');
  }
});

module.exports = router;
