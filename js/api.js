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

  /**
   * 通用请求
   * @param {string} method  - GET | POST | DELETE
   * @param {string} path    - /drinks 等（不含 /api 前缀）
   * @param {Object} options - { body?, xUserId? }
   * @returns {Object} { code, message, data }
   */
  async request(method, path, options = {}) {
    const { body, xUserId } = options;
    const headers = { 'Content-Type': 'application/json' };
    if (xUserId) headers['x-user-id'] = String(xUserId);

    const fetchOptions = { method, headers };
    if (body) fetchOptions.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, fetchOptions);
    const json = await res.json();

    if (!res.ok || (json.code && json.code >= 400)) {
      const err = new Error(json.message || '请求失败');
      err.code = json.code || res.status;
      err.data = json.data;
      throw err;
    }
    return json;
  },

  get(path, opts)    { return this.request('GET', path, opts); },
  post(path, body, opts) { return this.request('POST', path, { body, ...opts }); },
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
     */
    register(data) {
      return api.post('/users/register', data);
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

};

// 挂载到 window，方便调试
if (typeof window !== 'undefined') {
  window.api = api;
}
