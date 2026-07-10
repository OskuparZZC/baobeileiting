const { getPool } = require('../config/database');
const { generateId } = require('../utils/idGenerator');

async function test() {
  const pool = getPool();

  console.log('[TEST] 开始 MySQL User 测试');

  const id = generateId();

  // 1. 插入
  await pool.execute(
    `
    INSERT INTO users
    (id, name, nickname, class_name, student_id, password_hash)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      '测试用户',
      '测试昵称',
      '高一1班',
      'TEST001',
      'test_hash'
    ]
  );

  console.log('[TEST] INSERT OK');

  // 2. 查询
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );

  console.log('[TEST] SELECT OK:', rows[0]);

  // 3. 更新
  await pool.execute(
    'UPDATE users SET nickname=? WHERE id=?',
    ['修改后的昵称', id]
  );

  console.log('[TEST] UPDATE OK');

  // 清理测试数据
  await pool.execute(
    'DELETE FROM users WHERE id=?',
    [id]
  );

  console.log('[TEST] DELETE OK');

  await pool.end();

  console.log('[TEST] 全部通过');
}

test().catch(err => {
  console.error('[TEST] 失败:', err.message);
  process.exit(1);
});