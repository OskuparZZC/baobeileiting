const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Oskupar@2026',
    database: 'baobeileiting'
  });

  console.log('=== COLUMNS ===');
  const [cols] = await conn.execute('SHOW COLUMNS FROM user_stats');
  cols.forEach(c => console.log(c.Field, c.Type, c.Default, c.Null));

  console.log('\n=== ROW ===');
  const [rows] = await conn.execute(
    "SELECT * FROM user_stats WHERE user_id = '757cd265-38ca-43b3-97ac-8f8677d9129b'"
  );
  console.log(JSON.stringify(rows[0] || null, null, 2));

  await conn.end();
})();
