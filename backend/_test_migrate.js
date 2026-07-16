const http = require('http');

function apiRequest(method, path, body, xUserId) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': xUserId || '',
      },
    };

    const req = http.request(options, (res) => {
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) });
        } catch (e) {
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const uid = '757cd265-38ca-43b3-97ac-8f8677d9129b';

  console.log('=== 1. GET /users/me/stats (迁移前) ===');
  const before = await apiRequest('GET', '/users/me/stats', null, uid);
  console.log(JSON.stringify(before, null, 2));

  console.log('\n=== 2. POST /users/me/stats/migrate (第1次) ===');
  const first = await apiRequest('POST', '/users/me/stats/migrate', {
    level: 6, xp: 530, totalXp: 530, continuousDays: 2, totalRecords: 8, lastRecordDate: '2026-07-15'
  }, uid);
  console.log(JSON.stringify(first, null, 2));

  console.log('\n=== 3. POST /users/me/stats/migrate (第2次) ===');
  const second = await apiRequest('POST', '/users/me/stats/migrate', {
    level: 6, xp: 530, totalXp: 530, continuousDays: 2, totalRecords: 8, lastRecordDate: '2026-07-15'
  }, uid);
  console.log(JSON.stringify(second, null, 2));

  console.log('\n=== 4. GET /users/me/stats (迁移后) ===');
  const after = await apiRequest('GET', '/users/me/stats', null, uid);
  console.log(JSON.stringify(after, null, 2));
})();
