/**
 * 用户相关 API 路由
 *
 * Phase 1 完整实现：
 * POST   /api/users/register      - 用户注册 (name+className+studentId+password)
 * POST   /api/users/login         - 用户登录 (studentId+password)
 * POST   /api/users/login/wx      - 微信登录（预留 501）
 * GET    /api/users/me            - 获取当前用户信息  [auth]
 * PUT    /api/users/me            - 更新用户信息      [auth]
 * POST   /api/users/me/checkin    - 每日签到          [auth]
 * POST   /api/users/me/events     - 事件驱动 XP      [auth]
 * GET    /api/users/me/xp-logs    - XP 流水历史      [auth]
 *
 * 修订 v3：注册不再检查 name 唯一性，仅检查 studentId 唯一性
 *         允许同名不同学号的用户存在
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const { UserModel, UserStatsModel, XpLogModel } = require('../models/user');
const { authMiddleware, generateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { success, created, error, serverError } = require('../utils/response');
const { serializeUser } = require('../utils/serialize');
const { getXPLevelInfo } = require('../config/xpLevels');
const { getEventConfig, VALID_SOURCE_TYPES, XP_EVENTS } = require('../config/xpEvents');

const SALT_ROUNDS = 10;

// ==================== 注册 ====================

router.post('/register',
  validate.required(['name', 'studentId', 'password']),
  validate.passwordRules,
  (req, res) => {
    try {
      const { name, className, studentId, password } = req.body;

      // 学号唯一性检查（name 不要求唯一，允许同名不同学号）
      if (UserModel.findByStudentId(studentId)) {
        return error(res, 409, '该学号已被注册');
      }

      // 密码哈希
      const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

      // 创建用户
      const user = UserModel.register({ name, className, studentId, passwordHash });

      // 创建统计记录
      UserStatsModel.initForUser(user.id);

      // 生成 JWT
      const token = generateToken({ userId: user.id, name: user.name });

      return created(res, {
        user: serializeUser(user),
        token,
      }, '注册成功');
    } catch (err) {
      console.error('注册失败:', err);
      return serverError(res, '注册失败');
    }
  }
);

// ==================== 登录 ====================

router.post('/login',
  validate.required(['studentId', 'password']),
  (req, res) => {
    try {
      const { studentId, password } = req.body;

      // 通过学号查找用户
      const user = UserModel.findByStudentId(studentId);
      if (!user) {
        return error(res, 401, '学号或密码错误');
      }

      // 验证密码
      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return error(res, 401, '学号或密码错误');
      }

      // 更新登录时间
      UserModel.update(user.id, { lastLoginDate: new Date().toISOString().split('T')[0] });

      // 生成 JWT
      const token = generateToken({ userId: user.id, name: user.name });

      return success(res, {
        user: serializeUser(user),
        token,
      }, '登录成功');
    } catch (err) {
      console.error('登录失败:', err);
      return serverError(res, '登录失败');
    }
  }
);

// ==================== 微信登录（预留） ====================

router.post('/login/wx', (req, res) => {
  return error(res, 501, '微信登录功能开发中');
});

// ==================== 获取当前用户信息 ====================

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = UserModel.findById(req.user.id);
    if (!user) {
      return error(res, 404, '用户不存在');
    }

    const stats = UserStatsModel.findByUserId(req.user.id);

    return success(res, {
      user: serializeUser(user, stats),
    });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return serverError(res, '获取用户信息失败');
  }
});

// ==================== 更新用户信息 ====================

router.put('/me', authMiddleware, (req, res) => {
  try {
    const allowedFields = ['nickname', 'avatar', 'className', 'studentId'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return error(res, 400, '没有可更新的字段');
    }

    const user = UserModel.update(req.user.id, updates);
    if (!user) {
      return error(res, 404, '用户不存在');
    }

    return success(res, {
      user: serializeUser(user),
    }, '更新成功');
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return serverError(res, '更新用户信息失败');
  }
});

// ==================== 每日签到 ====================

router.post('/me/checkin', authMiddleware, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 检查是否已签到（幂等性）
    const existingLog = XpLogModel.findAll().find(
      log => log.userId === req.user.id &&
             log.sourceType === 'DAILY_CHECKIN' &&
             log.createdAt?.startsWith(today)
    );

    if (existingLog) {
      return error(res, 409, '今日已签到，请勿重复签到');
    }

    // 写入 XP 流水
    const eventConfig = getEventConfig('DAILY_CHECKIN');
    XpLogModel.createLog({
      userId: req.user.id,
      amount: eventConfig.xpAmount,
      reason: eventConfig.reason,
      sourceType: 'DAILY_CHECKIN',
    });

    // 更新用户 XP
    const xpResult = UserModel.addXP(req.user.id, eventConfig.xpAmount);
    const levelInfo = getXPLevelInfo(xpResult.xp);

    return success(res, {
      xp: xpResult.xp,
      level: xpResult.level,
      levelUp: xpResult.leveledUp,
      newLevelName: xpResult.leveledUp ? levelInfo.title : null,
      xpGained: eventConfig.xpAmount,
      streak: xpResult.streak,
    }, '签到成功');
  } catch (err) {
    console.error('签到失败:', err);
    return serverError(res, '签到失败');
  }
});

// ==================== 事件驱动 XP ====================

router.post('/me/events',
  authMiddleware,
  validate.required(['sourceType']),
  (req, res) => {
    try {
      const { sourceType, targetId } = req.body;

      // 校验事件类型合法性
      if (!VALID_SOURCE_TYPES.includes(sourceType)) {
        return error(res, 400, '无效的事件类型: ' + sourceType + '，合法类型: ' + VALID_SOURCE_TYPES.join(', '));
      }

      // 获取事件配置
      const eventConfig = getEventConfig(sourceType);
      if (!eventConfig) {
        return error(res, 400, '未配置的事件类型: ' + sourceType);
      }

      // 幂等性检查
      if (targetId && XpLogModel.exists(req.user.id, sourceType, targetId)) {
        return error(res, 409, '该事件已处理，不能重复提交');
      }

      // 写入 XP 流水
      XpLogModel.createLog({
        userId: req.user.id,
        amount: eventConfig.xpAmount,
        reason: eventConfig.reason,
        sourceType,
        targetId: targetId || null,
      });

      // 更新用户 XP
      const xpResult = UserModel.addXP(req.user.id, eventConfig.xpAmount);
      const levelInfo = getXPLevelInfo(xpResult.xp);

      return success(res, {
        xp: xpResult.xp,
        level: xpResult.level,
        levelUp: xpResult.leveledUp,
        newLevelName: xpResult.leveledUp ? levelInfo.title : null,
        xpGained: eventConfig.xpAmount,
      });
    } catch (err) {
      console.error('处理 XP 事件失败:', err);
      return serverError(res, '处理 XP 事件失败');
    }
  }
);

// ==================== XP 流水历史 ====================

router.get('/me/xp-logs', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const sourceType = req.query.sourceType || null;

    // 校验 sourceType（如果提供）
    if (sourceType && !VALID_SOURCE_TYPES.includes(sourceType)) {
      return error(res, 400, '无效的事件类型筛选: ' + sourceType);
    }

    const result = XpLogModel.findByUser(req.user.id, { page, limit, sourceType });

    return success(res, {
      logs: result.logs,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    console.error('查询 XP 流水失败:', err);
    return serverError(res, '查询 XP 流水失败');
  }
});

module.exports = router;
