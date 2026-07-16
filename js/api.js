/**
 * 前端 API 封装
 *
 * Phase 2B-1B-1：最小 HTTP 通信层
 *
 * 使用方式：
 *   api.drinks.list()            → GET /api/drinks
 *   api.drinks.brands()          → GET /api/drinks/brands
 *   api.drinks.search('拿铁')    → GET /api/drinks/search?q=拿铁
 */

const API_BASE = (() => {
  // 开发模式：同源直接走相对路径；跨域走 localhost:3000
  if (window.location.port === '3000') return '/api';
  return 'http://localhost:3000/api';
})();

const api = {

  // ==================== Token 管理 ====================

  auth: {
    token: null,
    _storageKey: 'baobei_auth_token',

    /**
     * 设置 token
     * @param {string|null} token - JWT token，传 null 或空字符串时清除
     */
    setToken(token) {
      if (token) {
        this.token = token;
        try {
          localStorage.setItem(this._storageKey, token);
        } catch (e) {
          console.warn('[auth] 保存 token 失败:', e.message);
        }
      } else {
        this.clearToken();
      }
    },

    /**
     * 获取 token
     * @returns {string|null}
     */
    getToken() {
      if (this.token) return this.token;
      try {
        this.token = localStorage.getItem(this._storageKey);
      } catch (e) {
        console.warn('[auth] 读取 token 失败:', e.message);
      }
      return this.token || null;
    },

    /**
     * 清除 token
     */
    clearToken() {
      this.token = null;
      try {
        localStorage.removeItem(this._storageKey);
      } catch (e) {
        console.warn('[auth] 清除 token 失败:', e.message);
      }
    },
  },

  /**
   * 通用请求
   * @param {string} method  - GET | POST | DELETE | PUT
   * @param {string} path    - /drinks 等（不含 /api 前缀）
   * @param {Object} options - { body?, xUserId? }
   * @returns {Object} { code, message, data }
   */
  async request(method, path, options = {}) {
    const { body, xUserId } = options;
    const headers = { 'Content-Type': 'application/json' };

    // Token 优先于 x-user-id，不同时发送
    const token = this.auth.getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    } else if (xUserId) {
      headers['x-user-id'] = String(xUserId);
    }

    const fetchOptions = { method, headers };
    if (body) fetchOptions.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, fetchOptions);
    } catch (networkErr) {
      const err = new Error(networkErr.message || '网络请求失败');
      err.code = 0;
      err.isNetworkError = true;
      throw err;
    }

    let json;
    try {
      json = await res.json();
    } catch (parseErr) {
      const err = new Error('响应解析失败');
      err.code = res.status;
      err.status = res.status;
      throw err;
    }

    // 401 统一处理：清除 token
    if (res.status === 401) {
      this.auth.clearToken();
      const err = new Error(json.message || '认证已失效，请重新登录');
      err.code = 401;
      err.status = 401;
      err.data = json.data;
      throw err;
    }

    if (!res.ok || (json.code && json.code >= 400)) {
      const err = new Error(json.message || '请求失败');
      err.code = json.code || res.status;
      err.status = res.status;
      err.data = json.data;
      throw err;
    }
    return json;
  },

  get(path, opts)    { return this.request('GET', path, opts); },
  post(path, body, opts) { return this.request('POST', path, { body, ...opts }); },
  put(path, body, opts) { return this.request('PUT', path, { body, ...opts }); },
  delete(path, opts) { return this.request('DELETE', path, opts); },

  // ==================== 饮品 ====================

  drinks: {
    /** 获取全部启用饮品 */
    list() {
      return api.get('/drinks');
    },
    /** 获取全部启用品牌 */
    brands() {
      return api.get('/drinks/brands');
    },
    /** 搜索饮品 */
    search(keyword) {
      return api.get(`/drinks/search?q=${encodeURIComponent(keyword)}`);
    },
  },

  // ==================== 用户 ====================

  users: {
    /**
     * 注册新用户（自动绑定后端）
     * @param {Object} data - { name, className, studentId, password }
     * @returns {Object} { code, message, data: { user, token } }
     * 注意：token 由 App 层处理，api 层不自动保存 token
     */
    register(data) {
      return api.post('/users/register', data);
    },

    /**
     * 用户登录
     * @param {Object} data - { studentId, password }
     * @returns {Object} { code, message, data: { user, token } }
     */
    login(data) {
      return api.post('/users/login', data);
    },

    /**
     * 获取当前用户信息（使用 Bearer Token）
     * @returns {Object} { code, message, data: { user } }
     */
    me() {
      return api.get('/users/me');
    },

    /**
     * 修改密码
     * @param {Object} data - { currentPassword, newPassword, confirmPassword }
     * @returns {Object} { code, message, data }
     */
    changePassword(data) {
      return api.put('/users/me/password', data);
    },

    /**
     * 获取当前用户统计信息
     * @param {string} xUserId - 后端用户 ID（UUID）
     * @returns {Object} { code, message, data: { stats } }
     */
    getStats(xUserId) {
      return api.get('/users/me/stats', { xUserId });
    },

    /**
     * 迁移本地历史统计到后端
     * @param {Object} payload - { level, xp, totalXp, continuousDays, totalRecords, lastRecordDate }
     * @param {string} xUserId
     * @returns {Object} { code, message, data: { stats, migrated, reason } }
     */
    migrateStats(payload, xUserId) {
      return api.post('/users/me/stats/migrate', payload, { xUserId });
    },
  },

  // ==================== 记录 ====================

  records: {
    /**
     * 创建饮品记录
     * @param {Object} record - { drinkId, customBrand, customName, size, price, rating, note, date, time }
     * @param {string} xUserId
     * @returns {Object} { code, message, data }
     */
    create(record, xUserId) {
      return api.post('/records', record, { xUserId });
    },

    /**
     * 获取当前用户记录
     * @param {string} xUserId
     * @param {Object} options - { limit? }
     * @returns {Object} { code, message, data: { records, total } }
     */
    me(xUserId, options = {}) {
      let path = '/records/me';
      if (options.limit != null) path += `?limit=${options.limit}`;
      return api.get(path, { xUserId });
    },

    /**
     * 删除自己的记录
     * @param {number} id
     * @param {string} xUserId
     * @returns {Object} { code, message, data }
     */
    delete(id, xUserId) {
      return api.delete(`/records/${id}`, { xUserId });
    },
  },

  // ==================== 排行榜 ====================

  leaderboard: {
    /**
     * 获取排行榜数据
     * @param {Object} options - { limit?: number }
     * @returns {Object} { code, message, data: { entries, currentUser, total } }
     */
    async get(options = {}) {
      let limit = Number(options.limit) || 50;
      limit = Math.max(1, Math.min(100, Math.floor(limit)));
      // 自动携带当前用户 x-user-id（如果已绑定）
      const user = (typeof App !== 'undefined' && App.getCurrentUser) ? App.getCurrentUser() : null;
      const xUserId = user && user._backendId ? user._backendId : undefined;
      return api.get(`/leaderboard?limit=${limit}`, { xUserId });
    },
  },

  // ==================== 图鉴 ====================

  collections: {
    /**
     * 获取当前用户图鉴
     * @param {string} xUserId
     * @returns {Object} { code, message, data: { collections: [...], count: N } }
     */
    me(xUserId) {
      return api.get('/collections/me', { xUserId });
    },

    /**
     * 解锁/更新图鉴条目（幂等）
     * @param {Object} data - { drinkId, unlockedAt }
     * @param {string} xUserId
     * @returns {Object} { code, message, data }
     */
    unlock(data, xUserId) {
      return api.post('/collections/unlock', data, { xUserId });
    },
  },

};

// 挂载到 window，方便调试
if (typeof window !== 'undefined') {
  window.api = api;
}
