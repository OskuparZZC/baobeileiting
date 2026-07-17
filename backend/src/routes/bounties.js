/**
 * 校园互助 API 路由 (Phase 3-2)
 *
 * 公开接口:
 *   GET  /api/bounties           - 悬赏列表
 *   GET  /api/bounties/:id       - 悬赏详情
 *
 * 需认证:
 *   POST /api/bounties           - 发布悬赏
 *   PUT  /api/bounties/:id/accept   - 接单
 *   PUT  /api/bounties/:id/submit   - 接单者提交完成
 *   PUT  /api/bounties/:id/complete - 发布者确认完成
 *   PUT  /api/bounties/:id/cancel   - 取消悬赏
 */

const express = require('express');
const router = express.Router();

const bountyModel = require('../models/bounty');
const { UserModel, UserStatsModel, XpLogModel } = require('../models/user');
const { authMiddleware } = require('../middleware/auth');
const { success, created, error, serverError } = require('../utils/response');
const { getEventConfig } = require('../config/xpEvents');

// ==================== 发布悬赏 ====================

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, urgency, location, deadline, reward } = req.body;

    // 必填校验
    if (!title || !title.trim()) {
      return error(res, 400, '请填写悬赏标题');
    }
    if (!description || !description.trim()) {
      return error(res, 400, '请填写详细描述');
    }

    // publisherId 从 JWT 获取，不信任前端传值
    const bounty = await bountyModel.create({
      title: title.trim(),
      description: description.trim(),
      category: category || 'other',
      urgency: urgency || 'normal',
      location: location || null,
      deadline: deadline || null,
      reward: reward || '',
      publisherId: req.user.id,
      publisherName: req.user.name,       // memory 模式用
      publisherClass: req.user.className || '', // memory 模式用
    });

    // 统计：发布者悬赏数 +1
    try {
      await UserStatsModel.increment(req.user.id, 'total_bounties_published', 1);
    } catch (statsErr) {
      console.error('[Bounty] 更新发布统计失败:', statsErr.message);
      // 不阻断主流程
    }

    return created(res, bounty, '悬赏发布成功');
  } catch (err) {
    console.error('发布悬赏失败:', err);
    return serverError(res, '发布悬赏失败');
  }
});

// ==================== 悬赏列表 ====================

router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.status)   filters.status   = req.query.status;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.urgency)  filters.urgency  = req.query.urgency;

    const bounties = await bountyModel.findAll(filters);
    return success(res, bounties);
  } catch (err) {
    console.error('查询悬赏列表失败:', err);
    return serverError(res, '查询悬赏列表失败');
  }
});

// ==================== 悬赏详情 ====================

router.get('/:id', async (req, res) => {
  try {
    const bounty = await bountyModel.findById(req.params.id);

    if (!bounty) {
      return error(res, 404, '悬赏不存在');
    }

    return success(res, bounty);
  } catch (err) {
    console.error('查询悬赏详情失败:', err);
    return serverError(res, '查询悬赏详情失败');
  }
});

// ==================== 接单 ====================

router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const bounty = await bountyModel.accept(
      req.params.id,
      req.user.id,
      req.user.name,                   // memory 模式用
      req.user.className || ''         // memory 模式用
    );

    return success(res, bounty, '接单成功');
  } catch (err) {
    // 业务错误 → 4xx
    if (
      err.message.includes('不存在') ||
      err.message.includes('状态') ||
      err.message.includes('自己') ||
      err.message.includes('抢先')
    ) {
      return error(res, 400, err.message);
    }
    console.error('接单失败:', err);
    return serverError(res, '接单失败');
  }
});

// ==================== 提交完成（接单者） ====================

router.put('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const bounty = await bountyModel.submit(req.params.id, req.user.id);

    return success(res, bounty, '已提交完成，等待发布者确认');
  } catch (err) {
    if (
      err.message.includes('不存在') ||
      err.message.includes('只有接单者') ||
      err.message.includes('只能提交') ||
      err.message.includes('失败')
    ) {
      return error(res, 400, err.message);
    }
    console.error('提交完成失败:', err);
    return serverError(res, '提交完成失败');
  }
});

// ==================== 完成悬赏 ====================

router.put('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const bounty = await bountyModel.complete(req.params.id, req.user.id);

    // 接单者统计：完成数 +1
    try {
      await UserStatsModel.increment(bounty.acceptorId, 'total_bounties_completed', 1);
    } catch (statsErr) {
      console.error('[Bounty] 更新完成统计失败:', statsErr.message);
    }

    // 接单者 XP 奖励（COMPLETE_BOUNTY = 20 XP）
    try {
      const eventConfig = getEventConfig('COMPLETE_BOUNTY');
      if (eventConfig) {
        // XP 流水
        XpLogModel.createLog({
          userId: bounty.acceptorId,
          amount: eventConfig.xpAmount,
          reason: eventConfig.reason,
          sourceType: 'COMPLETE_BOUNTY',
          targetId: String(bounty.id),
        });

        // 增加 XP
        await UserModel.addXP(bounty.acceptorId, eventConfig.xpAmount);
        console.log(`[Bounty] 完成悬赏 XP 奖励: +${eventConfig.xpAmount} → acceptorId=${bounty.acceptorId}`);
      }
    } catch (xpErr) {
      console.error('[Bounty] XP 奖励发放失败:', xpErr.message);
    }

    return success(res, bounty, '悬赏已完成');
  } catch (err) {
    if (
      err.message.includes('不存在') ||
      err.message.includes('只有发布者') ||
      err.message.includes('只能完成') ||
      err.message.includes('失败')
    ) {
      return error(res, 400, err.message);
    }
    console.error('完成悬赏失败:', err);
    return serverError(res, '完成悬赏失败');
  }
});

// ==================== 取消悬赏 ====================

router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const bounty = await bountyModel.cancel(req.params.id, req.user.id);

    return success(res, bounty, '悬赏已取消');
  } catch (err) {
    if (
      err.message.includes('不存在') ||
      err.message.includes('只有发布者') ||
      err.message.includes('不允许') ||
      err.message.includes('失败')
    ) {
      return error(res, 400, err.message);
    }
    console.error('取消悬赏失败:', err);
    return serverError(res, '取消悬赏失败');
  }
});

module.exports = router;
