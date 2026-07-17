/* ============================================================
 * 爆杯雷霆 PWA Service Worker
 * 仅缓存项目静态资源，不拦截 API 请求，不影响业务逻辑
 * 更新缓存版本号即可使旧缓存失效
 * ============================================================ */

const CACHE_NAME = 'baobeileiting-v1';

// 预缓存的静态资源列表
const PRECACHE_URLS = [
  '/',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/api.js',
  'js/data.js',
  'js/ai-recommend.js',
  'js/help-data.js',
  'js/pages/login.js',
  'js/pages/dashboard.js',
  'js/pages/records.js',
  'js/pages/collection.js',
  'js/pages/profile.js',
  'js/pages/leaderboard.js',
  'js/pages/community.js',
  'js/pages/help.js',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/mascot.png',
];

// ---------- install：预缓存静态资源 ----------
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 预缓存静态资源:', PRECACHE_URLS.length, '个文件');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // 个别文件缺失不应导致整个 SW 安装失败
        console.warn('[SW] 部分资源预缓存失败（不影响使用）:', err.message);
      });
    })
  );
});

// ---------- activate：清理旧版本缓存 ----------
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] 删除旧缓存:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] 激活完成，当前缓存版本:', CACHE_NAME);
      // 立即接管所有页面（不等到刷新）
      return self.clients.claim();
    })
  );
});

// ---------- fetch：静态资源缓存优先，API 走网络 ----------
self.addEventListener('fetch', (event) => {
  const { url, method } = event.request;

  // 不拦截非 GET 请求（POST / PUT / DELETE 等全部放行到网络）
  if (method !== 'GET') return;

  // 不拦截 API 请求（含 /api/ 路径或后端域名）
  if (url.includes('/api/')) return;

  // 不拦截 CDN 等第三方资源
  const parsedUrl = new URL(url);
  if (parsedUrl.origin !== self.location.origin) return;

  // 静态资源：缓存优先
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      // 缓存未命中，走网络并动态加入缓存
      return fetch(event.request).then((response) => {
        // 只缓存成功的响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(() => {
        // 网络不可用时，对 HTML 请求返回缓存的 index.html（SPA 回退）
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('index.html');
        }
        // 其余资源无法提供则返回错误
        return new Response('离线状态下该资源不可用', { status: 503 });
      });
    })
  );
});
