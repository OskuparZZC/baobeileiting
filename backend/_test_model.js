const { UserStatsModel } = require('./src/models/user');

(async () => {
  const uid = '757cd265-38ca-43b3-97ac-8f8677d9129b';

  console.log('=== 直接测试 migrateIfBlank (第1次) ===');
  const result1 = await UserStatsModel.migrateIfBlank(uid, {
    level: 6, xp: 530, totalXp: 530, continuousDays: 2, totalRecords: 8, lastRecordDate: '2026-07-15'
  });
  console.log('第1次结果:', JSON.stringify(result1, null, 2));

  if (result1.migrated) {
    console.log('\n=== 直接测试 migrateIfBlank (第2次) ===');
    const result2 = await UserStatsModel.migrateIfBlank(uid, {
      level: 6, xp: 530, totalXp: 530, continuousDays: 2, totalRecords: 8, lastRecordDate: '2026-07-15'
    });
    console.log('第2次结果:', JSON.stringify(result2, null, 2));

    console.log('\n=== 验证数据库最终状态 ===');
    const stats = await UserStatsModel.findByUserId(uid);
    console.log('最终统计:', JSON.stringify(stats, null, 2));
  }
})();
