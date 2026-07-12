/**
 * 临时测试：Records API 端到端测试
 * 测试完成后可删除
 */

const http = require('http');

const BASE = 'http://localhost:3000/api';

/**
 * HTTP 请求封装
 */
function request(method, path, { body, token, xUserId } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (xUserId) {
      options.headers['x-user-id'] = xUserId;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

(async () => {
  try {
    const testDate = new Date();
    const dateStr = testDate.getFullYear() + '-' +
      String(testDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(testDate.getDate()).padStart(2, '0');

    // ========== 1. 登录获取 token ==========
    console.log('=== 1. 登录 ===');
    const loginRes = await request('POST', '/users/login', {
      body: {
        studentId: 'TEST1002',
        password: 'Test123456',
      },
    });
    console.log(JSON.stringify(loginRes, null, 2));
    console.log();

    const token = loginRes.body?.data?.token;
    const userId = loginRes.body?.data?.user?.id;
    if (!token) {
      console.error('登录失败，未获取到 token');
      process.exit(1);
    }

    // ========== 2. 创建官方饮品记录 ==========
    console.log('=== 2. 创建官方饮品记录 ===');
    const record1Res = await request('POST', '/records', {
      body: {
        drinkId: 1,
        size: '大杯',
        price: 15,
        rating: 5,
        note: 'API测试',
        date: dateStr,
      },
      xUserId: userId,
    });
    console.log(JSON.stringify(record1Res, null, 2));
    console.log();

    const record1Id = record1Res.body?.data?.id;

    // ========== 3. 创建自定义饮品记录 ==========
    console.log('=== 3. 创建自定义饮品记录 ===');
    const record2Res = await request('POST', '/records', {
      body: {
        customBrand: '学校奶茶店',
        customName: 'API测试杨枝甘露',
        price: 12,
        date: dateStr,
      },
      xUserId: userId,
    });
    console.log(JSON.stringify(record2Res, null, 2));
    console.log();

    const record2Id = record2Res.body?.data?.id;

    // ========== 4. 查询当前用户记录 ==========
    console.log('=== 4. 查询用户记录 (GET /records/me) ===');
    const meRes = await request('GET', '/records/me', {
      xUserId: userId,
    });
    console.log(JSON.stringify(meRes, null, 2));
    console.log();

    // ========== 5. 删除测试记录 ==========
    console.log('=== 5. 删除测试记录 ===');
    if (record1Id) {
      const del1Res = await request('DELETE', `/records/${record1Id}`, {
        xUserId: userId,
      });
      console.log(`删除 record1 (id=${record1Id}):`, JSON.stringify(del1Res));
    }
    if (record2Id) {
      const del2Res = await request('DELETE', `/records/${record2Id}`, {
        xUserId: userId,
      });
      console.log(`删除 record2 (id=${record2Id}):`, JSON.stringify(del2Res));
    }
    console.log();

    // 验证清理结果
    const verifyRes = await request('GET', '/records/me', {
      xUserId: userId,
    });
    console.log('=== 清理后记录数 ===');
    console.log(JSON.stringify({ total: verifyRes.body?.data?.total }));

    process.exit(0);
  } catch (err) {
    console.error('测试失败:', err);
    process.exit(1);
  }
})();
