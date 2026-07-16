/**
 * 用户数据模型
 *
 * Phase 1：基于 BaseModel 内存 Map 存储
 * 包含 UserModel、UserStatsModel、XpLogModel
 *
 * 修订 v3：
 * - name 不要求唯一，允许同名不同学号
 * - studentId 必须唯一，用于登录
 * - findByName 保留但仅作辅助查询
 */

const { BaseModel } = require('./index');
const { getPool } = require('../config/database');
const { generateId } = require('../utils/idGenerator');
const { getXPLevelInfo } = require('../config/xpLevels');

/**
 * 获取 MySQL DATETIME 格式的本地时间（北京时间）
 * @returns {string} 格式: YYYY-MM-DD HH:mm:ss
 */
function getMysqlDateTime() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

// ==================== UserModel ====================

class UserModel extends BaseModel {
  constructor() {
    super('users');
    this.pool = getPool();
  }

  /**
   * 注册新用户
   * @param {Object} data - { name, className, studentId, passwordHash }
   * @returns {Object} 创建的用户对象
   */
  async register(data) {
    const now = getMysqlDateTime();
    const id = generateId();
    await this.pool.execute(
      `INSERT INTO users (id, name, nickname, class_name, student_id, avatar, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.name,
        data.className || '',
        data.studentId || '',
        '',
        data.passwordHash,
        now,
        now,
      ]
    );
    return {
      id,
      name: data.name,
      className: data.className || '',
      studentId: data.studentId || '',
      nickname: data.name,
      avatar: '',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 根据用户名查找（不区分大小写）
   * 注意：name 不保证唯一，返回第一个匹配项
   * @param {string} name
   * @returns {Object|null}
   */
  findByName(name) {
    const lower = name.toLowerCase();
    return this.findAll().find(u => u.name.toLowerCase() === lower) || null;
  }

  /**
   * 将 MySQL row 映射为安全用户对象（不含 passwordHash）
   * @param {Object} r - MySQL 行数据
   * @returns {Object}
   */
  _mapSafeUser(r) {
    return {
      id: r.id,
      name: r.name,
      nickname: r.nickname,
      className: r.class_name,
      studentId: r.student_id,
      avatar: r.avatar,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  /**
   * 根据 ID 查找用户（安全版本，不含 passwordHash）
   * 用于普通业务接口
   * @param {string} id
   * @returns {Object|null}
   */
  async findById(id) {
    const [rows] = await this.pool.execute(
      'SELECT id, name, nickname, class_name, student_id, avatar, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    if (!rows[0]) return null;
    return this._mapSafeUser(rows[0]);
  }

  /**
   * 根据学号查找用户（安全版本，不含 passwordHash）
   * 用于注册查重等不需要密码的场景
   * @param {string} studentId
   * @returns {Object|null}
   */
  async findByStudentId(studentId) {
    const [rows] = await this.pool.execute(
      'SELECT id, name, nickname, class_name, student_id, avatar, created_at, updated_at FROM users WHERE student_id = ?',
      [studentId]
    );
    if (!rows[0]) return null;
    return this._mapSafeUser(rows[0]);
  }

  // ==================== 认证专用查询方法（含 passwordHash） ====================

  /**
   * 根据 ID 查找用户（认证版本，包含 passwordHash）
   * 仅用于登录、修改密码等认证流程
   * @param {string} id
   * @returns {Object|null}
   */
  async findAuthById(id) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      nickname: r.nickname,
      className: r.class_name,
      studentId: r.student_id,
      avatar: r.avatar,
      passwordHash: r.password_hash,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  /**
   * 根据学号查找用户（认证版本，包含 passwordHash）
   * 仅用于登录认证流程
   * @param {string} studentId
   * @returns {Object|null}
   */
  async findAuthByStudentId(studentId) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE student_id = ?',
      [studentId]
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      nickname: r.nickname,
      className: r.class_name,
      studentId: r.student_id,
      avatar: r.avatar,
      passwordHash: r.password_hash,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  /**
   * 更新用户密码（参数化查询，仅更新当前用户）
   * @param {string} userId
   * @param {string} passwordHash - bcrypt 哈希后的密码
   * @returns {Promise<boolean>}
   */
  async updatePassword(userId, passwordHash) {
    await this.pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      [passwordHash, getMysqlDateTime(), userId]
    );
    return true;
  }

  /**
   * 更新用户信息
   * @param {string} id
   * @param {Object} data - { name?, nickname?, className?, studentId?, avatar?, passwordHash? }
   * @returns {Object|null}
   */
  async update(id, data) {
    const fieldMap = {
      name: 'name',
      nickname: 'nickname',
      className: 'class_name',
      studentId: 'student_id',
      avatar: 'avatar',
      passwordHash: 'password_hash',
    };
    const setClauses = [];
    const values = [];
    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        setClauses.push(`${col} = ?`);
        values.push(data[key]);
      }
    }
    if (setClauses.length === 0) return this.findById(id);

    setClauses.push('updated_at = ?');
    values.push(getMysqlDateTime());
    values.push(id);

    await this.pool.execute(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
    return this.findById(id);
  }

  /**
   * 更新用户 XP 和等级
   * @param {string} userId
   * @param {number} xpAmount - 要增加的 XP
   * @returns {{ xp, level, leveledUp, newTitle } | null}
   */
  addXP(userId, xpAmount) {
    const user = this.findById(userId);
    if (!user) return null;

    const oldLevel = user.level;
    user.xp += xpAmount;

    const levelInfo = getXPLevelInfo(user.xp);
    user.level = levelInfo.level;
    user.updatedAt = new Date().toISOString();

    this.update(userId, user);

    return {
      xp: user.xp,
      level: user.level,
      leveledUp: user.level > oldLevel,
      newTitle: levelInfo.title,
    };
  }
}

// ==================== UserStatsModel ====================

/**
 * 统计字段白名单（camelCase API 字段 → 实际 MySQL 列名）
 *
 * 注意：实际 MySQL user_stats 表的列名与 schema.sql 可能不同，
 * 这里以实际运行的表结构为准。
 *
 * MySQL 实际列 → API 字段映射：
 *   total_drinks         → totalRecords           (总记录数)
 *   total_bounties       → totalBountiesPublished  (发布悬赏数)
 *   total_help_completed → totalBountiesCompleted  (完成悬赏数)
 *
 * 只允许更新这些字段，禁止直接拼接不可信列名
 */
const STATS_ALLOWED_FIELDS = {
  level:                    'level',
  xp:                       'xp',
  total_xp:                 'total_xp',
  continuous_days:          'continuous_days',
  total_records:            'total_drinks',            // 实际列名
  total_bounties_published: 'total_bounties',          // 实际列名
  total_bounties_completed: 'total_help_completed',    // 实际列名
};

/**
 * 将 MySQL row 的 snake_case 转换为前端 camelCase
 * 同时将 DATE/DATETIME 安全序列化为字符串
 * @param {Object} row - MySQL 查询返回的原始行
 * @returns {Object} camelCase 统计对象
 */
function normalizeStatsRow(row) {
  if (!row) return null;
  const toDateStr = (val) => {
    if (!val) return null;
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // 字符串：取日期部分
    const s = String(val).split('T')[0];
    return s || null;
  };

  return {
    userId:                  row.user_id,
    level:                   Number(row.level) || 1,
    xp:                      Number(row.xp) || 0,
    totalXp:                 Number(row.total_xp) || 0,
    continuousDays:          Number(row.continuous_days) || 0,
    lastRecordDate:          toDateStr(row.last_record_date),
    // 实际 MySQL 列名 → API 字段名
    totalRecords:            Number(row.total_drinks) || 0,
    totalBountiesPublished:  Number(row.total_bounties) || 0,
    totalBountiesCompleted:  Number(row.total_help_completed) || 0,
    updatedAt:               row.updated_at || null,
  };
}

class UserStatsModel extends BaseModel {
  constructor() {
    super('user_stats');
    this.pool = getPool();
  }

  /**
   * 根据 userId 查找统计
   * - MySQL 可用：从 user_stats 表查询
   * - MySQL 不可用：回退到内存 Map
   * @param {string|number} userId
   * @returns {Promise<Object|null>}
   */
  async findByUserId(userId) {
    // 尝试 MySQL
    if (this.pool) {
      try {
        const [rows] = await this.pool.execute(
          'SELECT * FROM user_stats WHERE user_id = ?',
          [userId]
        );
        return rows[0] ? normalizeStatsRow(rows[0]) : null;
      } catch (err) {
        console.error('[UserStats] MySQL findByUserId 失败，回退内存:', err.message);
      }
    }

    // 内存 fallback
    const stats = this.findAll({ userId })[0] || null;
    if (!stats) return null;
    return {
      userId: stats.userId,
      level: Number(stats.level) || 1,
      xp: Number(stats.xp) || 0,
      totalXp: Number(stats.totalXp) || 0,
      continuousDays: Number(stats.continuousDays) || 0,
      lastRecordDate: stats.lastRecordDate || null,
      totalRecords: Number(stats.totalRecords) || 0,
      totalBountiesPublished: Number(stats.totalBountiesPublished) || 0,
      totalBountiesCompleted: Number(stats.totalBountiesCompleted) || 0,
      updatedAt: stats.updatedAt || null,
    };
  }

  /**
   * 为用户初始化统计（幂等）
   * - 如果 user_stats 已存在，返回现有数据
   * - 如果不存在，插入默认数据后返回
   * - 必须兼容旧用户
   * @param {string|number} userId
   * @returns {Promise<Object>}
   */
  async initForUser(userId) {
    // 先查询是否已存在
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    // 不存在则创建
    const now = getMysqlDateTime();
    if (this.pool) {
      try {
        await this.pool.execute(
          `INSERT INTO user_stats (id, user_id, level, xp, total_xp, continuous_days,
             total_drinks, total_bounties, total_help_completed, total_collections,
             created_at, updated_at)
           VALUES (?, ?, 1, 0, 0, 0, 0, 0, 0, 0, ?, ?)`,
          [generateId(), userId, now, now]
        );
        console.log(`[UserStats] 为用户 ${userId} 创建统计行`);
        return await this.findByUserId(userId);
      } catch (err) {
        // 如果是并发插入导致的重复键错误，重新查询
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`[UserStats] 用户 ${userId} 统计行已存在（并发创建），返回现有数据`);
          return await this.findByUserId(userId);
        }
        console.error('[UserStats] MySQL initForUser 失败，回退内存:', err.message);
      }
    }

    // 内存 fallback
    const stats = {
      id: generateId(),
      userId,
      level: 1,
      xp: 0,
      totalXp: 0,
      continuousDays: 0,
      lastRecordDate: null,
      totalRecords: 0,
      totalBountiesPublished: 0,
      totalBountiesCompleted: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.create(stats);
    return this.findByUserId(userId);
  }

  /**
   * 更新统计字段（白名单校验）
   * - 只允许更新 STATS_ALLOWED_FIELDS 中的字段
   * - 禁止直接拼接不可信列名
   * @param {string|number} userId
   * @param {Object} updates - camelCase API 字段名 → 值
   * @returns {Promise<Object|null>}
   */
  async updateByUserId(userId, updates) {
    // 白名单过滤：camelCase API 字段 → 实际 MySQL 列名
    const setClauses = [];
    const values = [];
    for (const [apiKey, colName] of Object.entries(STATS_ALLOWED_FIELDS)) {
      if (updates[apiKey] !== undefined) {
        setClauses.push(`${colName} = ?`);
        values.push(updates[apiKey]);
      }
    }

    if (setClauses.length === 0) return this.findByUserId(userId);

    setClauses.push('updated_at = ?');
    values.push(getMysqlDateTime());
    values.push(userId);

    if (this.pool) {
      try {
        await this.pool.execute(
          `UPDATE user_stats SET ${setClauses.join(', ')} WHERE user_id = ?`,
          values
        );
        return await this.findByUserId(userId);
      } catch (err) {
        console.error('[UserStats] MySQL updateByUserId 失败，回退内存:', err.message);
      }
    }

    // 内存 fallback
    const stats = this.findByUserId(userId);
    if (!stats) return null;
    for (const [apiKey] of Object.entries(STATS_ALLOWED_FIELDS)) {
      if (updates[apiKey] !== undefined) {
        stats[apiKey] = updates[apiKey];
      }
    }
    stats.updatedAt = new Date().toISOString();
    this.update(stats.id, stats);
    return this.findByUserId(userId);
  }

  /**
   * 判断后端统计是否为空白（新建用户默认值）
   * 空白条件：所有统计字段均为默认值
   *
   * 注意：实际 MySQL user_stats 表没有 last_record_date 列，
   * lastRecordDate 始终为 null（由 normalizeStatsRow 返回），
   * 因此空白判断不依赖 lastRecordDate。
   *
   * @param {Object} stats - normalizeStatsRow 输出的统计对象
   * @returns {boolean}
   */
  _isStatsBlank(stats) {
    if (!stats) return true;
    return (
      stats.totalXp === 0 &&
      stats.xp === 0 &&
      stats.level <= 1 &&
      stats.continuousDays === 0 &&
      stats.totalRecords === 0 &&
      stats.totalBountiesPublished === 0 &&
      stats.totalBountiesCompleted === 0
    );
  }

  /**
   * 原子条件迁移：只在后端统计为空白时才写入
   *
   * 使用 WHERE 条件确保原子性，防止并发重复迁移：
   *   UPDATE user_stats SET ...
   *   WHERE user_id = ?
   *     AND total_xp = 0 AND xp = 0 AND level <= 1
   *     AND continuous_days = 0 AND total_drinks = 0
   *     AND total_bounties = 0 AND total_help_completed = 0
   *
   * 注意：实际 MySQL user_stats 表没有 last_record_date 列，
   * lastRecordDate 仅在 API 响应中返回（始终为 null），
   * 原子 UPDATE 不依赖该列。
   *
   * @param {string|number} userId
   * @param {Object} data - { level, xp, totalXp, continuousDays, totalRecords, lastRecordDate }
   * @returns {Promise<{ migrated: boolean, reason?: string }>}
   */
  async migrateIfBlank(userId, data) {
    console.log('[migrate] 收到迁移请求, userId=', userId, 'data=', JSON.stringify(data));

    // 先查询当前状态
    const currentStats = await this.findByUserId(userId);
    console.log('[migrate] 当前后端统计:', JSON.stringify(currentStats));
    console.log('[migrate] _isStatsBlank 结果:', this._isStatsBlank(currentStats));

    if (!this._isStatsBlank(currentStats)) {
      console.log('[migrate] 后端非空白，拒绝迁移');
      return { migrated: false, reason: 'backend_not_blank' };
    }

    // 构建 SET 子句（使用白名单映射）
    const setClauses = [];
    const values = [];
    const fieldMappings = {
      level:           { col: 'level',           value: data.level },
      xp:              { col: 'xp',              value: data.xp },
      totalXp:         { col: 'total_xp',        value: data.totalXp },
      continuousDays:  { col: 'continuous_days', value: data.continuousDays },
      totalRecords:    { col: 'total_drinks',    value: data.totalRecords },
    };

    for (const [apiKey, { col, value }] of Object.entries(fieldMappings)) {
      if (value !== undefined) {
        setClauses.push(`${col} = ?`);
        values.push(value);
      }
    }

    // lastRecordDate: 写入 last_record_date 列（schema.sql 定义了该列）
    if (data.lastRecordDate !== undefined && data.lastRecordDate !== null) {
      setClauses.push('last_record_date = ?');
      values.push(data.lastRecordDate);
    }

    setClauses.push('updated_at = ?');
    values.push(getMysqlDateTime());

    // WHERE 条件值（仅 user_id 使用占位符，其余为字面量）
    values.push(userId);

    const sql = `UPDATE user_stats
           SET ${setClauses.join(', ')}
           WHERE user_id = ?
             AND total_xp = 0
             AND xp = 0
             AND level <= 1
             AND continuous_days = 0
             AND total_drinks = 0
             AND total_bounties = 0
             AND total_help_completed = 0`;

    console.log('[migrate] 执行 SQL:', sql);
    console.log('[migrate] SQL 参数:', JSON.stringify(values));

    if (this.pool) {
      try {
        const [result] = await this.pool.execute(sql, values);

        console.log('[migrate] affectedRows:', result.affectedRows);

        if (result.affectedRows === 0) {
          // WHERE 条件不满足（被并发写入或已迁移）
          console.log(`[migrate] 用户 ${userId} 迁移条件不满足，可能已被并发写入`);
          return { migrated: false, reason: 'backend_not_blank' };
        }

        console.log(`[migrate] 用户 ${userId} 迁移成功`);
        return { migrated: true };
      } catch (err) {
        console.error('[migrate] MySQL migrateIfBlank 失败，回退内存:', err.message);
      }
    }

    // 内存 fallback（非原子，但开发环境可接受）
    console.log('[migrate] 进入内存 fallback 路径');
    const stats = await this.findByUserId(userId);
    console.log('[migrate] 内存 fallback 查询结果:', JSON.stringify(stats));
    if (!this._isStatsBlank(stats)) {
      console.log('[migrate] 内存 fallback: 后端非空白');
      return { migrated: false, reason: 'backend_not_blank' };
    }
    for (const [apiKey, { value }] of Object.entries(fieldMappings)) {
      if (value !== undefined) {
        stats[apiKey] = value;
      }
    }
    if (data.lastRecordDate !== undefined) {
      stats.lastRecordDate = data.lastRecordDate;
    }
    stats.updatedAt = new Date().toISOString();
    this.update(stats.id, stats);
    console.log('[migrate] 内存 fallback 迁移成功');
    return { migrated: true };
  }

  /**
   * 原子自增统计字段（白名单校验）
   * - 使用 SQL 原子自增，避免并发覆盖
   * - 更新后返回最新统计
   * @param {string|number} userId
   * @param {string} field - camelCase API 字段名（仅允许 STATS_ALLOWED_FIELDS 中的键）
   * @param {number} amount - 增加量（默认 1）
   * @returns {Promise<Object|null>}
   */
  async increment(userId, field, amount = 1) {
    const colName = STATS_ALLOWED_FIELDS[field];
    if (!colName) {
      console.error(`[UserStats] increment 非法字段: ${field}`);
      return null;
    }

    // 确保统计行存在
    await this.initForUser(userId);

    if (this.pool) {
      try {
        await this.pool.execute(
          `UPDATE user_stats SET ${colName} = ${colName} + ?, updated_at = ? WHERE user_id = ?`,
          [amount, getMysqlDateTime(), userId]
        );
        return await this.findByUserId(userId);
      } catch (err) {
        console.error('[UserStats] MySQL increment 失败，回退内存:', err.message);
      }
    }

    // 内存 fallback
    const stats = this.findByUserId(userId);
    if (!stats) return null;
    stats[field] = (Number(stats[field]) || 0) + amount;
    stats.updatedAt = new Date().toISOString();
    this.update(stats.id, stats);
    return this.findByUserId(userId);
  }

  /**
   * 排行榜查询：按 XP 总榜排序
   *
   * 排序规则：
   *   1. total_xp DESC
   *   2. total_drinks DESC
   *   3. users.created_at ASC
   *   4. users.id ASC（最终稳定排序）
   *
   * 排除条件：total_xp = 0 AND total_drinks = 0
   *
   * 返回结构：
   *   {
   *     entries: [{ rank, userId, name, className, avatar, level, totalXp, totalRecords,
   *                continuousDays, totalBountiesCompleted, createdAt, isCurrentUser }],
   *     currentUser: { rank, ... } | null,
   *     total: number
   *   }
   *
   * @param {Object} options - { limit?, currentUserId? }
   * @returns {Promise<Object>}
   */
  async getLeaderboard(options = {}) {
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 50));
    const currentUserId = options.currentUserId || null;

    if (this.pool) {
      try {
        // 核心排行榜查询：JOIN users + user_stats，排除空白用户
        // 注意：使用 query() 而非 execute()，因为 mysql2 prepared statement
        // 不支持 LIMIT ? 语法（ER_WRONG_ARGUMENTS）
        // limit 已在上方校验为安全整数，可以安全内联
        const [rows] = await this.pool.query(
          `SELECT
            u.id          AS user_id,
            u.name        AS name,
            u.class_name  AS class_name,
            u.avatar      AS avatar,
            us.level      AS level,
            us.total_xp   AS total_xp,
            us.total_drinks AS total_drinks,
            us.continuous_days AS continuous_days,
            us.total_help_completed AS total_help_completed,
            u.created_at  AS created_at
          FROM user_stats us
          INNER JOIN users u ON u.id = us.user_id
          WHERE (us.total_xp > 0 OR us.total_drinks > 0)
          ORDER BY
            us.total_xp DESC,
            us.total_drinks DESC,
            u.created_at ASC,
            u.id ASC
          LIMIT ${limit}`
        );

        // 映射行数据
        const entries = rows.map((row, index) => ({
          rank: index + 1,
          userId: row.user_id,
          name: row.name,
          className: row.class_name || '',
          avatar: row.avatar || '',
          level: getXPLevelInfo(Number(row.total_xp) || 0).level,
          totalXp: Number(row.total_xp) || 0,
          totalRecords: Number(row.total_drinks) || 0,
          continuousDays: Number(row.continuous_days) || 0,
          totalBountiesCompleted: Number(row.total_help_completed) || 0,
          createdAt: row.created_at,
          isCurrentUser: row.user_id === currentUserId,
        }));

        // 查询总有效用户数
        const [countRows] = await this.pool.execute(
          `SELECT COUNT(*) AS cnt FROM user_stats
           WHERE total_xp > 0 OR total_drinks > 0`
        );
        const total = Number(countRows[0].cnt) || 0;

        // 当前用户处理
        let currentUser = null;
        if (currentUserId) {
          // 先在 entries 中找
          const inEntries = entries.find(e => e.userId === currentUserId);
          if (inEntries) {
            currentUser = { ...inEntries };
          } else {
            // 不在 Top N，查询当前用户的 totalXp、totalRecords 和 createdAt
            const [selfRows] = await this.pool.execute(
              `SELECT us.total_xp, us.total_drinks, u.created_at
               FROM user_stats us
               INNER JOIN users u ON u.id = us.user_id
               WHERE us.user_id = ?`,
              [currentUserId]
            );

            if (selfRows[0]) {
              const myXp = Number(selfRows[0].total_xp) || 0;
              const myDrinks = Number(selfRows[0].total_drinks) || 0;
              const myCreatedAt = selfRows[0].created_at;

              // 用户为空白则不计算排名
              if (myXp > 0 || myDrinks > 0) {
                // 计算排名：排在该用户前面的有效用户数 + 1
                // 使用变量方式避免重复子查询
                const [rankRows] = await this.pool.execute(
                  `SELECT COUNT(*) + 1 AS rank FROM user_stats us
                   INNER JOIN users u ON u.id = us.user_id
                   WHERE (us.total_xp > 0 OR us.total_drinks > 0)
                     AND (
                       us.total_xp > ?
                       OR (us.total_xp = ? AND us.total_drinks > ?)
                       OR (us.total_xp = ? AND us.total_drinks = ? AND u.created_at < ?)
                       OR (us.total_xp = ? AND us.total_drinks = ? AND u.created_at = ? AND u.id < ?)
                     )`,
                  [myXp, myXp, myDrinks, myXp, myDrinks, myCreatedAt, myXp, myDrinks, myCreatedAt, currentUserId]
                );
                const rank = Number(rankRows[0].rank) || 0;

                // 查询当前用户详情
                const [userRows] = await this.pool.execute(
                  `SELECT
                    u.id AS user_id, u.name, u.class_name, u.avatar,
                    us.level, us.total_xp, us.total_drinks,
                    us.continuous_days, us.total_help_completed,
                    u.created_at
                  FROM users u
                  LEFT JOIN user_stats us ON u.id = us.user_id
                  WHERE u.id = ?`,
                  [currentUserId]
                );

                if (userRows[0]) {
                  const r = userRows[0];
                  currentUser = {
                    rank,
                    userId: r.user_id,
                    name: r.name,
                    className: r.class_name || '',
                    avatar: r.avatar || '',
                    level: getXPLevelInfo(Number(r.total_xp) || 0).level,
                    totalXp: Number(r.total_xp) || 0,
                    totalRecords: Number(r.total_drinks) || 0,
                    continuousDays: Number(r.continuous_days) || 0,
                    totalBountiesCompleted: Number(r.total_help_completed) || 0,
                    createdAt: r.created_at,
                    isCurrentUser: true,
                  };
                }
              }
            }
          }
        }

        return { entries, currentUser, total };
      } catch (err) {
        console.error('[Leaderboard] MySQL 查询失败，回退内存:', err.message);
      }
    }

    // 内存 fallback：返回空排行榜
    return { entries: [], currentUser: null, total: 0 };
  }
}

// ==================== XpLogModel ====================

class XpLogModel extends BaseModel {
  constructor() {
    super('xp_logs');
  }

  /**
   * 创建 XP 流水记录
   * @param {Object} data - { userId, amount, reason, sourceType, targetId? }
   * @returns {Object}
   */
  createLog(data) {
    const now = new Date().toISOString();
    const log = {
      id: generateId(),
      userId: data.userId,
      amount: data.amount,
      reason: data.reason,
      sourceType: data.sourceType,
      targetId: data.targetId || null,
      createdAt: now,
    };
    this.create(log);
    return log;
  }

  /**
   * 检查事件是否已处理（幂等性）
   * @param {string} userId
   * @param {string} sourceType
   * @param {string} targetId
   * @returns {boolean} 是否已存在
   */
  exists(userId, sourceType, targetId) {
    if (!targetId) return false;
    return this.findAll().some(
      log => log.userId === userId && log.sourceType === sourceType && log.targetId === targetId
    );
  }

  /**
   * 查询用户的 XP 流水（分页）
   * @param {string} userId
   * @param {Object} options - { page, limit, sourceType? }
   * @returns {{ logs, total, page, limit }}
   */
  findByUser(userId, options = {}) {
    const { page = 1, limit = 20, sourceType } = options;
    let logs = this.findAll({ userId });
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (sourceType) {
      logs = logs.filter(l => l.sourceType === sourceType);
    }

    const total = logs.length;
    const start = (page - 1) * limit;
    const paged = logs.slice(start, start + limit);

    return { logs: paged, total, page, limit };
  }
}

// 单例导出
module.exports = {
  UserModel: new UserModel(),
  UserStatsModel: new UserStatsModel(),
  XpLogModel: new XpLogModel(),
};
