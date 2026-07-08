/**
 * 用户数据序列化转换层
 *
 * 后端内部使用标准化字段名（name, className, studentId 等），
 * 序列化时转换为前端期望的字段名，确保与现有前端 localStorage 数据结构完全兼容。
 *
 * 修订：后端统一使用 name 字段
 */

const { getXPLevelInfo } = require('../config/xpLevels');

/**
 * 将后端用户对象序列化为前端兼容格式
 * @param {Object} user    - 后端 users 记录
 * @param {Object} stats   - 后端 user_stats 记录（可选）
 * @returns {Object} 前端兼容的用户对象
 */
function serializeUser(user, stats = null) {
  if (!user) return null;

  const levelInfo = getXPLevelInfo(user.xp || 0);

  return {
    // 核心标识
    id: user.id,

    // 前端字段名（后端统一使用 name）
    name: user.name || '访客',
    className: user.className || '',
    studentId: user.studentId || '',
    avatar: user.avatar || '',

    // 时间相关
    joinDate: user.joinDate || user.createdAt?.split('T')[0] || '',
    registerDate: user.registerDate || user.createdAt?.split('T')[0] || '',
    lastLoginDate: user.lastLoginDate || '',

    // XP / 等级相关
    level: user.level || 1,
    xp: user.xp || 0,
    totalXp: user.xp || 0,
    continuousDays: user.streak || 0,

    // 等级信息（动态计算）
    levelInfo: {
      currentLevel: levelInfo.level,
      currentTitle: levelInfo.title,
      nextLevelXp: levelInfo.xpToNext,
      xpProgress: levelInfo.xpInLevel + '/' + (levelInfo.xpInLevel + levelInfo.xpToNext),
      progressPercent: levelInfo.progressPercent,
    },

    // 微信预留
    wx_openid: user.wx_openid || null,

    // 统计（如果有 stats）
    stats: stats ? {
      totalDrinks: stats.totalDrinks || 0,
      totalBounties: stats.totalBounties || 0,
      totalHelpCompleted: stats.totalHelpCompleted || 0,
      totalCollections: stats.totalCollections || 0,
    } : null,

    // 元数据
    createdAt: user.createdAt || '',
    updatedAt: user.updatedAt || '',
  };
}

/**
 * 批量序列化用户列表
 * @param {Object[]} users
 * @param {Object}   statsMap - { userId → stats }
 * @returns {Object[]}
 */
function serializeUsers(users, statsMap = {}) {
  return users.map(user => serializeUser(user, statsMap[user.id] || null));
}

module.exports = { serializeUser, serializeUsers };
