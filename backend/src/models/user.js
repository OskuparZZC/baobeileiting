/**
 * 用户数据模型
 *
 * Phase 1：基于 BaseModel 内存 Map 存储
 * 包含 UserModel、UserStatsModel、XpLogModel
 *
 * 修订 v3：
 * - name 不要求唯一，允许同名不同学号
 * - studentId 必须唯一，用于登录
 * - findByName 保留但仅作辅助查询
 */

const { BaseModel } = require('./index');
const { generateId } = require('../utils/idGenerator');
const { getXPLevelInfo } = require('../config/xpLevels');

// ==================== UserModel ====================

class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  /**
   * 注册新用户
   * @param {Object} data - { name, className, studentId, passwordHash }
   * @returns {Object} 创建的用户对象
   */
  register(data) {
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const user = {
      id: generateId(),
      name: data.name,
      className: data.className || '',
      studentId: data.studentId || '',
      passwordHash: data.passwordHash,
      nickname: data.name,
      avatar: '',
      joinDate: todayStr,
      registerDate: todayStr,
      lastLoginDate: todayStr,
      xp: 0,
      level: 1,
      streak: 1,
      wx_openid: null,
      createdAt: now,
      updatedAt: now,
    };
    this.create(user);
    return user;
  }

  /**
   * 根据用户名查找（不区分大小写）
   * 注意：name 不保证唯一，返回第一个匹配项
   * @param {string} name
   * @returns {Object|null}
   */
  findByName(name) {
    const lower = name.toLowerCase();
    return this.findAll().find(u => u.name.toLowerCase() === lower) || null;
  }

  /**
   * 根据学号查找用户（精确匹配，保证唯一）
   * 用于登录
   * @param {string} studentId
   * @returns {Object|null}
   */
  findByStudentId(studentId) {
    return this.findAll().find(u => u.studentId === studentId) || null;
  }

  /**
   * 更新用户 XP 和等级
   * @param {string} userId
   * @param {number} xpAmount - 要增加的 XP
   * @returns {{ xp, level, leveledUp, newTitle } | null}
   */
  addXP(userId, xpAmount) {
    const user = this.findById(userId);
    if (!user) return null;

    const oldLevel = user.level;
    user.xp += xpAmount;

    const levelInfo = getXPLevelInfo(user.xp);
    user.level = levelInfo.level;
    user.updatedAt = new Date().toISOString();

    this.update(userId, user);

    return {
      xp: user.xp,
      level: user.level,
      leveledUp: user.level > oldLevel,
      newTitle: levelInfo.title,
    };
  }
}

// ==================== UserStatsModel ====================

class UserStatsModel extends BaseModel {
  constructor() {
    super('user_stats');
  }

  /**
   * 为新用户创建初始统计
   * @param {string} userId
   * @returns {Object}
   */
  initForUser(userId) {
    const now = new Date().toISOString();
    const stats = {
      id: generateId(),
      userId,
      totalDrinks: 0,
      totalBounties: 0,
      totalHelpCompleted: 0,
      totalCollections: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.create(stats);
    return stats;
  }

  /**
   * 根据 userId 查找统计
   * @param {string} userId
   * @returns {Object|null}
   */
  findByUserId(userId) {
    return this.findAll({ userId })[0] || null;
  }

  /**
   * 增加统计计数
   * @param {string} userId
   * @param {string} field - totalDrinks | totalBounties | totalHelpCompleted | totalCollections
   * @param {number} amount - 增加量（默认 1）
   */
  increment(userId, field, amount = 1) {
    const stats = this.findByUserId(userId);
    if (!stats) return null;
    stats[field] = (stats[field] || 0) + amount;
    stats.updatedAt = new Date().toISOString();
    this.update(stats.id, stats);
    return stats;
  }
}

// ==================== XpLogModel ====================

class XpLogModel extends BaseModel {
  constructor() {
    super('xp_logs');
  }

  /**
   * 创建 XP 流水记录
   * @param {Object} data - { userId, amount, reason, sourceType, targetId? }
   * @returns {Object}
   */
  createLog(data) {
    const now = new Date().toISOString();
    const log = {
      id: generateId(),
      userId: data.userId,
      amount: data.amount,
      reason: data.reason,
      sourceType: data.sourceType,
      targetId: data.targetId || null,
      createdAt: now,
    };
    this.create(log);
    return log;
  }

  /**
   * 检查事件是否已处理（幂等性）
   * @param {string} userId
   * @param {string} sourceType
   * @param {string} targetId
   * @returns {boolean} 是否已存在
   */
  exists(userId, sourceType, targetId) {
    if (!targetId) return false;
    return this.findAll().some(
      log => log.userId === userId && log.sourceType === sourceType && log.targetId === targetId
    );
  }

  /**
   * 查询用户的 XP 流水（分页）
   * @param {string} userId
   * @param {Object} options - { page, limit, sourceType? }
   * @returns {{ logs, total, page, limit }}
   */
  findByUser(userId, options = {}) {
    const { page = 1, limit = 20, sourceType } = options;
    let logs = this.findAll({ userId });
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (sourceType) {
      logs = logs.filter(l => l.sourceType === sourceType);
    }

    const total = logs.length;
    const start = (page - 1) * limit;
    const paged = logs.slice(start, start + limit);

    return { logs: paged, total, page, limit };
  }
}

// 单例导出
module.exports = {
  UserModel: new UserModel(),
  UserStatsModel: new UserStatsModel(),
  XpLogModel: new XpLogModel(),
};
