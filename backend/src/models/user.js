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
   * 根据 ID 查找用户
   * @param {string} id
   * @returns {Object|null}
   */
  async findById(id) {
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
   * 根据学号查找用户（精确匹配，保证唯一）
   * 用于登录
   * @param {string} studentId
   * @returns {Object|null}
   */
  async findByStudentId(studentId) {
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
