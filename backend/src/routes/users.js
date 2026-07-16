/**
 * 用户相关 API 路由
 *
 * Phase 1 完整实现：
 * POST   /api/users/register      - 用户注册 (name+className+studentId+password)
 * POST   /api/users/login         - 用户登录 (studentId+password)
 * POST   /api/users/login/wx      - 微信登录（预留 501）
 * GET    /api/users/me            - 获取当前用户信息  [auth]
 * PUT    /api/users/me            - 更新用户信息      [auth]
 * PUT    /api/users/me/password   - 修改密码          [auth]  ← Phase 4.4.1 新增
 * POST   /api/users/me/checkin    - 每日签到          [auth]
 * POST   /api/users/me/events     - 事件驱动 XP      [auth]
 * GET    /api/users/me/xp-logs    - XP 流水历史      [auth]
 *
 * 修订 v3：注册不再检查 name 唯一性，仅检查 studentId 唯一性
 *         允许同名不同学号的用户存在
 *
 * 修订 v4（Phase 4.4.1）：
 *         - 注册/登录增加 trim 和长度校验
 *         - 登录使用认证专用查询方法 findAuthByStudentId
 *         - findById / findByStudentId 不再返回 passwordHash
 *         - 新增 PUT /api/users/me/password 修改密码接口
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

// 字段长度限制
const LIMITS = {
  name: { min: 1, max: 50 },
  className: { min: 0, max: 100 },
  studentId: { min: 1, max: 50 },
  password: { min: 6, max: 72 },
};

/**
 * 校验字符串长度
 * @param {string} val - 待校验字符串
 * @param {{ min: number, max: number }} limits - 长度限制
 * @param {string} label - 字段中文名
 * @returns {string|null} 错误信息，无错误返回 null
 */
function checkLength(val, limits, label) {
  if (typeof val !== 'string') return `${label} 格式不正确`;
  if (val.length < limits.min) {
    if (limits.min === 1) return `${label} 不能为空`;
    return `${label} 至少需要${limits.min}位`;
  }
  if (val.length > limits.max) return `${label} 不能超过${limits.max}位`;
  return null;
}

// ==================== 注册 ====================

router.post('/register',
  validate.required(['name', 'studentId', 'password']),
  validate.passwordRules,
  async (req, res) => {
    try {
      // trim 所有字符串字段
      const name = (req.body.name || '').trim();
      const className = (req.body.className || '').trim();
      const studentId = (req.body.studentId || '').trim();
      const password = req.body.password; // 已由 passwordRules 中间件 trim

      // 字段长度校验
      const nameErr = checkLength(name, LIMITS.name, '姓名');
      if (nameErr) return error(res, 400, nameErr);

      if (className.length > LIMITS.className.max) {
        return error(res, 400, `班级不能超过${LIMITS.className.max}位`);
      }

      const sidErr = checkLength(studentId, LIMITS.studentId, '学号');
      if (sidErr) return error(res, 400, sidErr);

      // 学号唯一性检查（使用安全查询方法，不需要 passwordHash）
      if (await UserModel.findByStudentId(studentId)) {
        return error(res, 409, '该学号已被注册');
      }

      // 密码哈希
      const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

      // 创建用户
      const user = await UserModel.register({ name, className, studentId, passwordHash });

      // 初始化统计记录（幂等）
      try {
        await UserStatsModel.initForUser(user.id);
      } catch (statsErr) {
        console.error(`[注册] 为用户 ${user.id} 初始化统计失败:`, statsErr.message);
        // 不阻塞注册流程，但记录错误
      }

      // 生成 JWT（只写入 userId 和 name）
      const token = generateToken({ userId: user.id, name: user.name });

      // 返回时附带 stats
      const stats = await UserStatsModel.findByUserId(user.id);

      return created(res, {
        user: serializeUser(user, stats),
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
  async (req, res) => {
    try {
      const studentId = (req.body.studentId || '').trim();
      const password = (req.body.password || '').trim();

      if (!studentId || !password) {
        return error(res, 401, '学号或密码错误');
      }

      // 使用认证专用方法获取 passwordHash
      const authUser = await UserModel.findAuthByStudentId(studentId);
      if (!authUser || !authUser.passwordHash) {
        // 用户不存在或未设置密码 → 统一错误消息，不泄露用户是否存在
        return error(res, 401, '学号或密码错误');
      }

      // 验证密码
      const isMatch = bcrypt.compareSync(password, authUser.passwordHash);
      if (!isMatch) {
        return error(res, 401, '学号或密码错误');
      }

      // 生成 JWT（只写入 userId 和 name，不含敏感字段）
      const token = generateToken({ userId: authUser.id, name: authUser.name });

      // 确保 user_stats 存在（老用户可能没有统计行）
      await UserStatsModel.initForUser(authUser.id);
      const stats = await UserStatsModel.findByUserId(authUser.id);

      // 返回安全用户（不含 passwordHash）
      const safeUser = serializeUser({
        id: authUser.id,
        name: authUser.name,
        nickname: authUser.nickname,
        className: authUser.className,
        studentId: authUser.studentId,
        avatar: authUser.avatar,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
      }, stats);

      return success(res, {
        user: safeUser,
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

// ==================== 修改密码 ====================

/**
 * PUT /api/users/me/password
 *
 * 修改当前登录用户的密码。
 * 必须通过 authMiddleware 认证，仅允许修改自己的密码。
 *
 * 请求体：
 *   { currentPassword, newPassword, confirmPassword }
 *
 * 校验：
 *   - 三个字段必填
 *   - newPassword === confirmPassword
 *   - 新密码 6~72 位
 *   - 新密码不能全部为数字
 *   - 新密码不能等于当前密码
 *   - 使用 bcrypt.compare 验证 currentPassword
 *   - 不允许通过 body.userId 修改他人密码
 */
router.put('/me/password',
  authMiddleware,
  validate.required(['currentPassword', 'newPassword', 'confirmPassword']),
  async (req, res) => {
    try {
      const currentPassword = (req.body.currentPassword || '').trim();
      const newPassword = (req.body.newPassword || '').trim();
      const confirmPassword = (req.body.confirmPassword || '').trim();

      // 确认两次新密码一致
      if (newPassword !== confirmPassword) {
        return error(res, 400, '两次输入的新密码不一致');
      }

      // 新密码不能等于当前密码
      if (newPassword === currentPassword) {
        return error(res, 400, '新密码不能与当前密码相同');
      }

      // 新密码长度校验
      if (newPassword.length < LIMITS.password.min) {
        return error(res, 400, `新密码至少需要${LIMITS.password.min}位`);
      }
      if (newPassword.length > LIMITS.password.max) {
        return error(res, 400, `新密码不能超过${LIMITS.password.max}位`);
      }

      // 新密码不能全部为数字
      if (/^\d+$/.test(newPassword)) {
        return error(res, 400, '新密码不能全部为数字');
      }

      // 使用认证专用方法获取 passwordHash
      const authUser = await UserModel.findAuthById(req.user.id);
      if (!authUser) {
        return error(res, 404, '用户不存在');
      }

      // 验证当前密码
      if (!authUser.passwordHash) {
        return error(res, 400, '当前账号未设置密码，无法修改');
      }

      const isMatch = bcrypt.compareSync(currentPassword, authUser.passwordHash);
      if (!isMatch) {
        return error(res, 400, '当前密码错误');
      }

      // 哈希新密码
      const newPasswordHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);

      // 更新密码（参数化查询，仅更新当前用户）
      await UserModel.updatePassword(req.user.id, newPasswordHash);

      return success(res, { success: true }, '密码修改成功');
    } catch (err) {
      console.error('修改密码失败:', err);
      return serverError(res, '修改密码失败');
    }
  }
);

// ==================== 获取当前用户信息 ====================

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return error(res, 404, '用户不存在');
    }

    // 尝试获取统计，老用户自动补建
    const stats = await UserStatsModel.initForUser(req.user.id);

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

// ==================== 获取用户统计 ====================

router.get('/me/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 检查用户是否存在
    const user = await UserModel.findById(userId);
    if (!user) {
      return error(res, 404, '用户不存在');
    }

    // initForUser 幂等：老用户没有统计行时自动补建
    const stats = await UserStatsModel.initForUser(userId);

    return success(res, { stats });
  } catch (err) {
    console.error('获取用户统计失败:', err);
    return serverError(res, '获取用户统计失败');
  }
});

// ==================== 迁移本地统计到后端 ====================

/**
 * POST /api/users/me/stats/migrate
 *
 * 将本地历史统计一次性迁移到 MySQL。
 * 只在后端统计仍为空白时执行迁移，防止覆盖已有数据。
 *
 * 请求体：
 *   level, xp, totalXp, continuousDays, totalRecords, lastRecordDate
 *
 * 不迁移 totalBountiesPublished / totalBountiesCompleted
 */
router.post('/me/stats/migrate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 检查用户是否存在
    const user = await UserModel.findById(userId);
    if (!user) {
      return error(res, 404, '用户不存在');
    }

    // 1. 输入校验
    const { level, xp, totalXp, continuousDays, totalRecords, lastRecordDate } = req.body;

    // 字段存在性检查
    if (level === undefined || xp === undefined || totalXp === undefined ||
        continuousDays === undefined || totalRecords === undefined) {
      return error(res, 400, '缺少必填字段: level, xp, totalXp, continuousDays, totalRecords');
    }

    // 类型和范围校验
    const parsedLevel = parseInt(level, 10);
    const parsedXp = parseInt(xp, 10);
    const parsedTotalXp = parseInt(totalXp, 10);
    const parsedContinuousDays = parseInt(continuousDays, 10);
    const parsedTotalRecords = parseInt(totalRecords, 10);

    if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 100) {
      return error(res, 400, 'level 必须是 1~100 的整数');
    }
    if (isNaN(parsedXp) || parsedXp < 0 || parsedXp > 1000000) {
      return error(res, 400, 'xp 必须是 0~1000000 的非负整数');
    }
    if (isNaN(parsedTotalXp) || parsedTotalXp < 0 || parsedTotalXp > 1000000) {
      return error(res, 400, 'totalXp 必须是 0~1000000 的非负整数');
    }
    if (isNaN(parsedContinuousDays) || parsedContinuousDays < 0 || parsedContinuousDays > 10000) {
      return error(res, 400, 'continuousDays 必须是 0~10000 的非负整数');
    }
    if (isNaN(parsedTotalRecords) || parsedTotalRecords < 0 || parsedTotalRecords > 100000) {
      return error(res, 400, 'totalRecords 必须是 0~100000 的非负整数');
    }

    // lastRecordDate 校验：YYYY-MM-DD 或 null
    let parsedDate = null;
    if (lastRecordDate !== null && lastRecordDate !== undefined && lastRecordDate !== '') {
      if (typeof lastRecordDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(lastRecordDate)) {
        return error(res, 400, 'lastRecordDate 必须是 YYYY-MM-DD 格式或 null');
      }
      parsedDate = lastRecordDate;
    }

    // 2. 确保统计行存在
    await UserStatsModel.initForUser(userId);

    // 3. 尝试原子条件迁移（只在后端为空白时写入）
    const result = await UserStatsModel.migrateIfBlank(userId, {
      level: parsedLevel,
      xp: parsedXp,
      totalXp: parsedTotalXp,
      continuousDays: parsedContinuousDays,
      totalRecords: parsedTotalRecords,
      lastRecordDate: parsedDate,
    });

    // 4. 重新查询最新统计
    const updatedStats = await UserStatsModel.findByUserId(userId);

    return success(res, {
      stats: updatedStats,
      migrated: result.migrated,
      reason: result.reason || null,
    }, result.migrated ? '迁移成功' : '后端已有统计，跳过迁移');
  } catch (err) {
    console.error('迁移统计失败:', err);
    return serverError(res, '迁移统计失败');
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
