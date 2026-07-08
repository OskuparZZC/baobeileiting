/**
 * XP 事件类型定义
 *
 * 事件驱动模式：前端只发 sourceType + targetId，
 * XP 奖励金额完全由后端配置决定。
 */

const XP_EVENTS = {
  DAILY_CHECKIN: {
    sourceType: 'DAILY_CHECKIN',
    xpAmount: 5,
    reason: '每日签到',
    description: '每日首次登录签到',
  },
  STREAK_BONUS: {
    sourceType: 'STREAK_BONUS',
    xpPerStreak: 2,        // 每连续一天 +2
    reason: '连续签到加成',
    description: '连续签到额外奖励',
  },
  RECORD_DRINK: {
    sourceType: 'RECORD_DRINK',
    xpAmount: 10,
    reason: '记录饮品',
    description: '添加一条饮品记录',
  },
  RATE_DRINK: {
    sourceType: 'RATE_DRINK',
    xpAmount: 5,
    reason: '饮品评分',
    description: '为饮品记录打分评价',
  },
  DISCOVER_DRINK: {
    sourceType: 'DISCOVER_DRINK',
    xpAmount: 20,
    reason: '新饮品发现',
    description: '发现从未喝过的饮品',
  },
  COMPLETE_BOUNTY: {
    sourceType: 'COMPLETE_BOUNTY',
    xpAmount: 20,
    reason: '完成互助',
    description: '接受并完成一个悬赏任务',
  },
  DAILY_TASK_LOGIN: {
    sourceType: 'DAILY_TASK_LOGIN',
    xpAmount: 5,
    reason: '每日任务：登录App',
    description: '每日任务—登录App',
  },
  DAILY_TASK_RECORD: {
    sourceType: 'DAILY_TASK_RECORD',
    xpAmount: 10,
    reason: '每日任务：记录饮品',
    description: '每日任务—记录一杯饮品',
  },
  DAILY_TASK_DISCOVER: {
    sourceType: 'DAILY_TASK_DISCOVER',
    xpAmount: 20,
    reason: '每日任务：解锁新饮品',
    description: '每日任务—发现新饮品',
  },
  DAILY_TASK_RATE: {
    sourceType: 'DAILY_TASK_RATE',
    xpAmount: 5,
    reason: '每日任务：饮品评分',
    description: '每日任务—给饮品评分',
  },
  ACHIEVEMENT_UNLOCK: {
    sourceType: 'ACHIEVEMENT_UNLOCK',
    xpAmount: 50,
    reason: '解锁成就',
    description: '达成一项成就',
  },
};

/** 所有合法的事件类型 */
const VALID_SOURCE_TYPES = Object.values(XP_EVENTS).map(e => e.sourceType);

/**
 * 根据事件类型获取 XP 奖励配置
 * @param {string} sourceType
 * @returns {{ sourceType, xpAmount, reason } | null}
 */
function getEventConfig(sourceType) {
  return XP_EVENTS[sourceType] || null;
}

module.exports = { XP_EVENTS, VALID_SOURCE_TYPES, getEventConfig };
