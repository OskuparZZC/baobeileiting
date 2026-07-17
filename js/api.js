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
  // 开发模式和生产环境统一走相对路径 /api
  if (window.location.port === '3000') return '/api';
  return '/api';
})();

/** 默认请求超时（毫秒） */
const DEFAULT_TIMEOUT = 8000;
/** 健康检查超时（毫秒） */
const HEALTH_TIMEOUT = 4000;

/**
 * 创建一个可被 AbortController 取消的 fetch 请求
 * @param {string} url
 * @param {Object} options
 * @param {number} timeout - 超时毫秒数
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const signal = controller.signal;

  const fetchOptions = { ...options, signal };

  let timeoutId = null;
  if (timeout && timeout > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeout);
  }

  try {
    const res = await fetch(url, fetchOptions);
    return res;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * 包装网络错误为统一格式
 * @param {Error} err - 原始错误
 * @param {boolean} isTimeout - 是否为超时
 * @returns {Error}
 */
function wrapNetworkError(err, isTimeout) {
  const wrapped = new Error(
    isTimeout
      ? '请求超时，请检查网络或服务器'
      : '无法连接服务器，请检查后端或网络'
  );
  wrapped.code = 0;
  wrapped.status = 0;
  wrapped.isNetworkError = true;
  wrapped.isTimeout = !!isTimeout;
  return wrapped;
}

const api = {

  // ==================== Token 管理 ====================

  auth: {
    token: null,
    _storageKey: 'baobei_auth_token',

    /**
     * 后端认证模式（通过健康检查获取）
     * - true：后端启用 JWT 认证，受保护接口只接受 Bearer token
     * - false：开发测试模式，受保护接口接受 x-user-id
     * - null：尚未检测
     */
    backendAuthEnabled: null,

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

    /**
     * 检测后端认证模式
     * 调用 /api/health 获取 authEnabled 字段
     * @returns {Promise<boolean>} 是否成功获取
     */
    async detectAuthMode() {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/health`, { method: 'GET' }, HEALTH_TIMEOUT);
        if (!res.ok) throw new Error('Health check failed');
        const json = await res.json();
        if (json.data && typeof json.data.authEnabled === 'boolean') {
          this.backendAuthEnabled = json.data.authEnabled;
          console.log(`[auth] 后端认证模式: authEnabled=${this.backendAuthEnabled}`);
          return true;
        }
        console.warn('[auth] 健康检查响应中无 authEnabled 字段，保持现有模式');
        return false;
      } catch (e) {
        console.warn('[auth] 无法获取后端认证模式，保持现有 fallback:', e.message);
        return false;
      }
    },
  },

  /**
   * 通用请求
   * @param {string} method  - GET | POST | DELETE | PUT
   * @param {string} path    - /drinks 等（不含 /api 前缀）
   * @param {Object} options - { body?, xUserId?, authMode? }
   *   authMode:
   *     'auto'（默认）— 根据 backendAuthEnabled 自动决定认证头
   *     'public'        — 不发送认证头（登录/注册等公开接口）
   *     'token'         — 强制使用 Bearer token
   *     'dev'           — 强制使用 x-user-id
   * @returns {Object} { code, message, data }
   */
  async request(method, path, options = {}) {
    const { body, xUserId, authMode, timeout } = options;
    const headers = { 'Content-Type': 'application/json' };

    // 公开接口：不发送任何认证头
    if (authMode === 'public') {
      // skip auth headers
    } else {
      const token = this.auth.getToken();
      const backendAuthEnabled = this.auth.backendAuthEnabled;

      // 规则：正式 JWT 模式下，有 token 则只发 token
      // 开发模式下，即使有 token，受保护业务请求仍使用 x-user-id
      if (backendAuthEnabled === true && token) {
        // 正式模式 + 有 token → Bearer
        headers['Authorization'] = 'Bearer ' + token;
      } else if (backendAuthEnabled === false && xUserId) {
        // 开发模式 → 使用 x-user-id（即使有 token，token 仅保存不用）
        headers['x-user-id'] = String(xUserId);
      } else if (token && !xUserId) {
        // fallback：有 token 但未知后端模式 → 使用 token
        headers['Authorization'] = 'Bearer ' + token;
      } else if (xUserId) {
        // fallback：无 token 有 xUserId → 使用 x-user-id
        headers['x-user-id'] = String(xUserId);
      }
      // 都没有 → 不发送认证头，后端会返回 401
    }

    const fetchOptions = { method, headers };
    if (body) fetchOptions.body = JSON.stringify(body);

    // 记录本次请求是否实际发送了 Bearer token（用于 401 判断）
    const usedBearerAuth = Boolean(headers['Authorization']);

    const effectiveTimeout = (timeout != null) ? timeout : DEFAULT_TIMEOUT;

    let res;
    try {
      res = await fetchWithTimeout(`${API_BASE}${path}`, fetchOptions, effectiveTimeout);
    } catch (networkErr) {
      // 判断是否为 AbortError（超时）
      const isAbort = (networkErr.name === 'AbortError');
      throw wrapNetworkError(networkErr, isAbort);
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

    // 401 处理：只有本次请求真正发送了 Bearer token 时才清除 token
    // 开发模式下使用 x-user-id 导致的 401（如缺少 x-user-id）不清除 token
    if (res.status === 401) {
      if (usedBearerAuth) {
        this.auth.clearToken();
      }
      const err = new Error(json.message || '认证已失效，请重新登录');
      err.code = 401;
      err.status = 401;
      err.data = json.data;
      throw err;
    }

    // 其他 HTTP 错误（400/409/500 等），不是网络错误
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
     * 注册新用户（公开接口，无需认证）
     * @param {Object} data - { name, className, studentId, password }
     * @returns {Object} { code, message, data: { user, token } }
     * 注意：token 由 App 层处理，api 层不自动保存 token
     */
    register(data) {
      return api.post('/users/register', data, { authMode: 'public' });
    },

    /**
     * 用户登录（公开接口，无需认证）
     * @param {Object} data - { studentId, password }
     * @returns {Object} { code, message, data: { user, token } }
     */
    login(data) {
      return api.post('/users/login', data, { authMode: 'public' });
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
     * @param {Object} [options] - { xUserId? }
     * @returns {Object} { code, message, data }
     */
    changePassword(data, options = {}) {
      return api.put('/users/me/password', data, options);
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

    /**
     * 增量同步 XP 事件到后端（事件驱动模式）
     * @param {string} sourceType - XP 事件类型，如 'RECORD_DRINK'
     * @param {string|null} targetId - 幂等键，传 null 跳过幂等检查
     * @param {string} xUserId - 后端用户 ID (UUID)
     * @returns {Object} { code, message, data: { xp, level, levelUp, newLevelName, xpGained } }
     */
    postEvent(sourceType, targetId, xUserId) {
      return api.post('/users/me/events', { sourceType, targetId }, { xUserId });
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

  // ==================== 悬赏互助 ====================

  bounties: {
    /**
     * 获取悬赏列表（公开接口）
     * @param {Object} filters - { status?, category?, urgency? }
     * @returns {Object} { code, message, data: [...] }
     */
    list(filters = {}) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.urgency) params.append('urgency', filters.urgency);
      const qs = params.toString();
      return api.get(`/bounties${qs ? '?' + qs : ''}`, { authMode: 'public' });
    },

    /**
     * 获取悬赏详情（公开接口）
     * @param {number|string} id - 悬赏 ID
     * @returns {Object} { code, message, data }
     */
    getById(id) {
      return api.get(`/bounties/${id}`, { authMode: 'public' });
    },

    /**
     * 发布悬赏
     * 注意：publisherId 由后端通过 token 获取，前端不要传 publisherId
     * @param {Object} data - { title, description, category?, urgency?, location?, deadline?, reward? }
     * @param {string} [xUserId] - 开发模式下的用户标识
     * @returns {Object} { code, message, data }
     */
    create(data, xUserId) {
      return api.post('/bounties', data, { xUserId });
    },

    /**
     * 当前用户接单
     * @param {number|string} id - 悬赏 ID
     * @param {string} [xUserId] - 开发模式下的用户标识
     * @returns {Object} { code, message, data }
     */
    accept(id, xUserId) {
      return api.put(`/bounties/${id}/accept`, null, { xUserId });
    },

    /**
     * 接单者提交完成申请（accepted → submitted）
     * @param {number|string} id - 悬赏 ID
     * @param {string} [xUserId] - 开发模式下的用户标识
     * @returns {Object} { code, message, data }
     */
    submit(id, xUserId) {
      return api.put(`/bounties/${id}/submit`, null, { xUserId });
    },

    /**
     * 发布者确认完成悬赏
     * @param {number|string} id - 悬赏 ID
     * @param {string} [xUserId] - 开发模式下的用户标识
     * @returns {Object} { code, message, data }
     */
    complete(id, xUserId) {
      return api.put(`/bounties/${id}/complete`, null, { xUserId });
    },

    /**
     * 发布者取消悬赏
     * @param {number|string} id - 悬赏 ID
     * @param {string} [xUserId] - 开发模式下的用户标识
     * @returns {Object} { code, message, data }
     */
    cancel(id, xUserId) {
      return api.put(`/bounties/${id}/cancel`, null, { xUserId });
    },
  },

  // ==================== 系统 ====================

  system: {
    /**
     * 健康检查
     * @returns {Object} { code, message, data: { status, version, authEnabled, ... } }
     */
    health() {
      return api.get('/health');
    },
  },

};

// 挂载到 window，方便调试
if (typeof window !== 'undefined') {
  window.api = api;
}
