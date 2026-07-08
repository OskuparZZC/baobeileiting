/**
 * XP 等级定义
 * 从 js/data.js 的 xpLevelDefs 迁移到后端
 */
const xpLevelDefs = [
  { level: 1,  title: '饮品新人',   xpNeeded: 0 },
  { level: 2,  title: '饮品新人',   xpNeeded: 30 },
  { level: 3,  title: '校园探店员', xpNeeded: 80 },
  { level: 4,  title: '校园探店员', xpNeeded: 150 },
  { level: 5,  title: '风味探索家', xpNeeded: 250 },
  { level: 6,  title: '风味探索家', xpNeeded: 380 },
  { level: 7,  title: '风味探索家', xpNeeded: 540 },
  { level: 8,  title: '风味探索家', xpNeeded: 730 },
  { level: 9,  title: '风味探索家', xpNeeded: 950 },
  { level: 10, title: '饮品达人',   xpNeeded: 1200 },
  { level: 11, title: '饮品达人',   xpNeeded: 1500 },
  { level: 12, title: '饮品达人',   xpNeeded: 1850 },
  { level: 13, title: '饮品达人',   xpNeeded: 2250 },
  { level: 14, title: '饮品达人',   xpNeeded: 2700 },
  { level: 15, title: '饮品达人',   xpNeeded: 3200 },
  { level: 16, title: '饮品达人',   xpNeeded: 3750 },
  { level: 17, title: '饮品达人',   xpNeeded: 4350 },
  { level: 18, title: '饮品达人',   xpNeeded: 5000 },
  { level: 19, title: '饮品达人',   xpNeeded: 5700 },
  { level: 20, title: '爆杯大师',   xpNeeded: 6500 },
];

/**
 * 根据总经验值计算等级信息
 * @param {number} totalXp - 累计总经验
 * @returns {{ level, title, xpInLevel, xpToNext, progressPercent, nextLevel, nextTitle }}
 */
function getXPLevelInfo(totalXp) {
  let currentLevel = xpLevelDefs[0];
  let nextLevel = xpLevelDefs[1] || xpLevelDefs[0];
  for (let i = xpLevelDefs.length - 1; i >= 0; i--) {
    if (totalXp >= xpLevelDefs[i].xpNeeded) {
      currentLevel = xpLevelDefs[i];
      nextLevel = xpLevelDefs[i + 1] || xpLevelDefs[i];
      break;
    }
  }
  const levelRange = nextLevel.xpNeeded - currentLevel.xpNeeded;
  const xpInLevel = totalXp - currentLevel.xpNeeded;
  const progressPercent = levelRange > 0 ? Math.min(100, Math.round((xpInLevel / levelRange) * 100)) : 100;
  const xpToNext = nextLevel.xpNeeded - totalXp;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    xpInLevel,
    xpToNext: Math.max(0, xpToNext),
    progressPercent,
    nextLevel: nextLevel.level,
    nextTitle: nextLevel.title,
  };
}

module.exports = { xpLevelDefs, getXPLevelInfo };
