/**
 * 临时测试：RecordModel MySQL 查询
 * 测试完成后可删除
 */
const { recordModel } = require('./record');
const { getPool } = require('../config/database');

(async () => {
  const pool = getPool();
  const testStudentId = 'TEST1002';

  try {
    // 查询测试用户
    const [userRows] = await pool.execute(
      'SELECT * FROM users WHERE student_id = ?',
      [testStudentId]
    );

    if (!userRows[0]) {
      console.error('未找到测试用户 TEST1002，请先创建该用户');
      process.exit(1);
    }
    const userId = userRows[0].id;
    console.log('=== 测试用户 ===');
    console.log(JSON.stringify({ id: userId, studentId: testStudentId, name: userRows[0].name }));
    console.log();

    const today = new Date();
    const dateStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    // 1. 创建官方饮品记录
    console.log('=== 1. 创建官方饮品记录 ===');
    const record1 = await recordModel.create({
      userId,
      drinkId: 1,
      size: '大杯',
      price: 15,
      rating: 5,
      note: '测试记录',
      date: dateStr,
    });
    console.log(JSON.stringify(record1, null, 2));
    console.log();

    // 2. 创建自定义饮品记录
    console.log('=== 2. 创建自定义饮品记录 ===');
    const record2 = await recordModel.create({
      userId,
      drinkId: null,
      customBrand: '学校奶茶店',
      customName: '测试杨枝甘露',
      price: 12,
      date: dateStr,
    });
    console.log(JSON.stringify(record2, null, 2));
    console.log();

    // 3. 查询用户全部记录
    console.log('=== 3. 查询用户全部记录 ===');
    const userRecords = await recordModel.findByUser(userId);
    console.log(JSON.stringify(userRecords, null, 2));
    console.log();

    // 4. 统计记录总数
    console.log('=== 4. countByUser ===');
    const count = await recordModel.countByUser(userId);
    console.log(JSON.stringify({ count }));
    console.log();

    // 5. 删除测试记录
    console.log('=== 5. 删除测试记录 ===');
    const deleted1 = await recordModel.delete(record1.id, userId);
    const deleted2 = await recordModel.delete(record2.id, userId);
    console.log(JSON.stringify({ deleted1, deleted2 }));
    console.log();

    // 验证删除后记录数
    const countAfter = await recordModel.countByUser(userId);
    console.log('=== 删除后记录数 ===');
    console.log(JSON.stringify({ count: countAfter }));

    process.exit(0);
  } catch (err) {
    console.error('测试失败:', err);
    process.exit(1);
  }
})();
