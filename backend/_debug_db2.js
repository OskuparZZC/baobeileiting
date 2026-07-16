const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Oskupar@2026',
    database: 'baobeileiting'
  });

  // Test if last_record_date column exists
  try {
    const [rows] = await conn.execute(
      "SELECT last_record_date FROM user_stats WHERE user_id = '757cd265-38ca-43b3-97ac-8f8677d9129b'"
    );
    console.log('last_record_date exists, value:', rows[0]);
  } catch (err) {
    console.log('last_record_date ERROR:', err.message);
  }

  // Test UPDATE with last_record_date
  try {
    const [result] = await conn.execute(
      `UPDATE user_stats SET last_record_date = ? WHERE user_id = '757cd265-38ca-43b3-97ac-8f8677d9129b'`,
      ['2026-07-15']
    );
    console.log('UPDATE result:', result);
  } catch (err) {
    console.log('UPDATE ERROR:', err.message);
  }

  await conn.end();
})();
