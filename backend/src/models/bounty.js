/**
 * 校园悬赏模型 (Phase 3-1)
 * 表: bounties
 *
 * 支持 MySQL + memory 双模式，风格与 UserModel 一致。
 *
 * 状态流转:
 *   open → accepted → submitted → completed
 *   open → cancelled
 *   accepted → cancelled
 *   submitted → cancelled
 *
 * MySQL 模式: publisher/acceptor 信息通过 JOIN users 表获取
 * memory 模式: publisher/acceptor 信息直接存入悬赏对象
 */

const { BaseModel } = require('./index');
const { getPool } = require('../config/database');
const { generateId } = require('../utils/idGenerator');

// ==================== 工具函数 ====================

/**
 * 获取 MySQL DATETIME 格式的本地时间（北京时间）
 * @returns {string} 格式: YYYY-MM-DD HH:mm:ss
 */
function getMysqlDateTime() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * 有效期合法值
 */
const VALID_STATUSES = ['open', 'accepted', 'submitted', 'completed', 'cancelled'];

// ==================== BountyModel ====================

class BountyModel extends BaseModel {
  constructor() {
    super('bounties');
    this.pool = getPool();
  }

  // ==================== 内部辅助方法 ====================

  /**
   * 将 MySQL 行数据映射为前端友好的 camelCase 对象
   * 行中通过 LEFT JOIN 带了 publisher_name/publisher_class/acceptor_name/acceptor_class
   * @param {Object} r - MySQL 行数据
   * @returns {Object}
   */
  _mapRow(r) {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      urgency: r.urgency || 'normal',
      location: r.location || null,
      deadline: r.deadline || null,
      reward: r.reward_detail || '',
      publisherId: r.publisher_id,
      publisherName: r.publisher_name || '',
      publisherClass: r.publisher_class || '',
      acceptorId: r.acceptor_id || null,
      acceptorName: r.acceptor_name || '',
      acceptorClass: r.acceptor_class || '',
      status: r.status || 'open',
      viewCount: Number(r.view_count) || 0,
      createdAt: r.created_at,
      acceptedAt: r.accepted_at || null,
      completedAt: r.completed_at || null,
      submittedAt: r.submitted_at || null,
    };
  }

  /**
   * MySQL 路径: 通过 id + JOIN users 查询单条悬赏
   * @param {number} id - 悬赏整数 id
   * @returns {Object|null}
   */
  async _mysqlFindById(id) {
    const [rows] = await this.pool.execute(
      `SELECT b.*,
              pu.name        AS publisher_name,
              pu.class_name  AS publisher_class,
              au.name        AS acceptor_name,
              au.class_name  AS acceptor_class
         FROM bounties b
         LEFT JOIN users pu ON b.publisher_id = pu.id
         LEFT JOIN users au ON b.acceptor_id = au.id
        WHERE b.id = ?`,
      [id]
    );
    return rows[0] ? this._mapRow(rows[0]) : null;
  }

  /**
   * MySQL 路径: 构建筛选条件 + JOIN 查询
   * @param {Object} filters - { status?, category?, urgency?, publisherId?, acceptorId? }
   * @returns {Object[]}
   */
  async _mysqlFindAll(filters) {
    let sql = `SELECT b.*,
                      pu.name        AS publisher_name,
                      pu.class_name  AS publisher_class,
                      au.name        AS acceptor_name,
                      au.class_name  AS acceptor_class
                 FROM bounties b
                 LEFT JOIN users pu ON b.publisher_id = pu.id
                 LEFT JOIN users au ON b.acceptor_id = au.id
                WHERE 1=1`;
    const params = [];

    if (filters.status)      { sql += ' AND b.status = ?';      params.push(filters.status); }
    if (filters.category)    { sql += ' AND b.category = ?';    params.push(filters.category); }
    if (filters.urgency)     { sql += ' AND b.urgency = ?';     params.push(filters.urgency); }
    if (filters.publisherId) { sql += ' AND b.publisher_id = ?'; params.push(filters.publisherId); }
    if (filters.acceptorId)  { sql += ' AND b.acceptor_id = ?';  params.push(filters.acceptorId); }

    sql += ' ORDER BY b.created_at DESC';

    const [rows] = await this.pool.execute(sql, params);
    return rows.map(r => this._mapRow(r));
  }

  /**
   * MySQL 路径: 原子条件更新（防并发）
   * @param {number} id
   * @param {Object} updates - { status?, acceptor_id?, accepted_at?, completed_at? }
   * @param {string} expectedStatus - 当前状态条件
   * @returns {Object|null} 更新后的悬赏，失败返回 null
   */
  async _mysqlUpdateIfStatus(id, updates, expectedStatus) {
    const setClauses = [];
    const values = [];

    const fieldMap = {
      status:       'status',
      acceptorId:  'acceptor_id',
      acceptedAt:  'accepted_at',
      completedAt: 'completed_at',
      submittedAt: 'submitted_at',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        setClauses.push(`${col} = ?`);
        values.push(updates[key]);
      }
    }

    if (setClauses.length === 0) return null;

    values.push(id);
    values.push(expectedStatus);

    const [result] = await this.pool.execute(
      `UPDATE bounties SET ${setClauses.join(', ')} WHERE id = ? AND status = ?`,
      values
    );

    if (result.affectedRows === 0) return null;
    return await this._mysqlFindById(id);
  }

  // ==================== 公开 API ====================

  /**
   * 创建悬赏
   *
   * @param {Object} data
   *   - title         {string}  悬赏标题
   *   - description   {string}  详细描述
   *   - category      {string}  分类 (package/meal/borrow/study/other)
   *   - urgency       {string}  紧急程度 (urgent/normal/low)
   *   - location      {string}  地点 (可选)
   *   - deadline      {string}  截止时间 (可选)
   *   - reward        {string}  奖励描述 (如"一杯奶茶"，存入 reward_detail)
   *   - publisherId   {string}  发布者 UUID
   *   - publisherName {string}  发布者姓名 (memory 模式用)
   *   - publisherClass{string}  发布者班级 (memory 模式用)
   * @returns {Object} 创建的悬赏对象
   */
  async create(data) {
    const now = getMysqlDateTime();

    // === MySQL 路径 ===
    if (this.pool) {
      try {
        const [result] = await this.pool.execute(
          `INSERT INTO bounties
             (title, description, category, urgency, location, deadline,
              reward_detail, publisher_id, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
          [
            data.title,
            data.description,
            data.category || 'other',
            data.urgency || 'normal',
            data.location || null,
            data.deadline || null,
            data.reward || '',
            data.publisherId,
            now,
          ]
        );

        console.log(`[Bounty] MySQL 创建悬赏成功, id=${result.insertId}`);
        return await this._mysqlFindById(result.insertId);
      } catch (err) {
        console.error('[Bounty] MySQL create 失败，回退内存:', err.message);
      }
    }

    // === Memory 回退 ===
    const id = generateId();
    const bounty = {
      id,
      title: data.title,
      description: data.description,
      category: data.category || 'other',
      urgency: data.urgency || 'normal',
      location: data.location || null,
      deadline: data.deadline || null,
      reward: data.reward || '',
      publisherId: data.publisherId,
      publisherName: data.publisherName || '',
      publisherClass: data.publisherClass || '',
      acceptorId: null,
      acceptorName: '',
      acceptorClass: '',
      status: 'open',
      viewCount: 0,
      createdAt: now,
      acceptedAt: null,
      completedAt: null,
    };
    super.create(bounty);
    console.log(`[Bounty] Memory 创建悬赏成功, id=${id}`);
    return bounty;
  }

  /**
   * 查询悬赏列表（支持多条件筛选）
   *
   * @param {Object} filters
   *   - status?      {string}  按状态筛选
   *   - category?    {string}  按分类筛选
   *   - urgency?     {string}  按紧急程度筛选
   *   - publisherId? {string}  按发布者筛选
   *   - acceptorId?  {string}  按接单者筛选
   * @returns {Object[]} 悬赏数组
   */
  async findAll(filters = {}) {
    // === MySQL 路径 ===
    if (this.pool) {
      try {
        return await this._mysqlFindAll(filters);
      } catch (err) {
        console.error('[Bounty] MySQL findAll 失败，回退内存:', err.message);
      }
    }

    // === Memory 回退 ===
    let items = super.findAll(filters);

    // 按 createdAt 倒序排列
    items.sort((a, b) => {
      const tA = a.createdAt || '';
      const tB = b.createdAt || '';
      if (tA > tB) return -1;
      if (tA < tB) return 1;
      return 0;
    });

    return items;
  }

  /**
   * 根据 ID 查询单条悬赏（含发布者/接单者信息）
   *
   * @param {number|string} id - MySQL 为整数 id，memory 为 UUID
   * @returns {Object|null}
   */
  async findById(id) {
    // === MySQL 路径 ===
    if (this.pool) {
      try {
        return await this._mysqlFindById(id);
      } catch (err) {
        console.error('[Bounty] MySQL findById 失败，回退内存:', err.message);
      }
    }

    // === Memory 回退 ===
    const bounty = super.findById(id);
    if (!bounty) return null;

    // 自增浏览次数
    const updated = { ...bounty, viewCount: (Number(bounty.viewCount) || 0) + 1 };
    super.update(id, updated);
    return updated;
  }

  /**
   * 接单 — 将悬赏状态从 open 改为 accepted
   *
   * 校验：
   *   - 悬赏存在且状态为 open
   *   - 接单者不能是发布者
   *   - 使用原子条件更新防并发
   *
   * @param {number|string} id           - 悬赏 id
   * @param {string}        acceptorId   - 接单者 UUID
   * @param {string}        [acceptorName]   - 接单者姓名 (memory 模式用)
   * @param {string}        [acceptorClass]  - 接单者班级 (memory 模式用)
   * @returns {Object} 更新后的悬赏对象
   * @throws  {Error} 如果状态不允许接单
   */
  async accept(id, acceptorId, acceptorName = '', acceptorClass = '') {
    const now = getMysqlDateTime();

    // === MySQL 路径 ===
    if (this.pool) {
      // 先查询当前状态并校验
      const bounty = await this._mysqlFindById(id);
      if (!bounty) {
        throw new Error('悬赏不存在');
      }
      if (bounty.status !== 'open') {
        throw new Error(bounty.status === 'accepted' ? '悬赏已被他人抢先接单' : '悬赏状态不允许接单');
      }
      if (bounty.publisherId === acceptorId) {
        throw new Error('不能接自己的悬赏');
      }

      // 原子更新
      const updated = await this._mysqlUpdateIfStatus(id, {
        status: 'accepted',
        acceptorId,
        acceptedAt: now,
      }, 'open');

      if (!updated) {
        throw new Error('悬赏已被他人抢先接单');
      }

      console.log(`[Bounty] MySQL accept 成功, id=${id}, acceptorId=${acceptorId}`);
      return updated;
    }

    // === Memory 回退 ===
    const bounty = super.findById(id);
    if (!bounty) {
      throw new Error('悬赏不存在');
    }
    if (bounty.status !== 'open') {
      throw new Error(bounty.status === 'accepted' ? '悬赏已被他人抢先接单' : '悬赏状态不允许接单');
    }
    if (bounty.publisherId === acceptorId) {
      throw new Error('不能接自己的悬赏');
    }

    const updated = {
      ...bounty,
      status: 'accepted',
      acceptorId,
      acceptorName: acceptorName || bounty.acceptorName || '',
      acceptorClass: acceptorClass || bounty.acceptorClass || '',
      acceptedAt: now,
    };
    super.update(id, updated);
    console.log(`[Bounty] Memory accept 成功, id=${id}`);
    return updated;
  }

  /**
   * 提交完成 — 接单者将状态从 accepted 改为 submitted
   *
   * 校验：
   *   - 悬赏存在且状态为 accepted
   *   - 只有接单者可以提交
   *
   * @param {number|string} id     - 悬赏 id
   * @param {string}        userId - 操作用户 UUID（必须为接单者）
   * @returns {Object} 更新后的悬赏对象
   * @throws  {Error} 如果状态不允许提交或无权限
   */
  async submit(id, userId) {
    const now = getMysqlDateTime();

    // === MySQL 路径 ===
    if (this.pool) {
      const bounty = await this._mysqlFindById(id);
      if (!bounty) {
        throw new Error('悬赏不存在');
      }
      if (bounty.acceptorId !== userId) {
        throw new Error('只有接单者可以提交完成');
      }
      if (bounty.status !== 'accepted') {
        throw new Error('只能提交已接单的悬赏');
      }

      const updated = await this._mysqlUpdateIfStatus(id, {
        status: 'submitted',
        submittedAt: now,
      }, 'accepted');

      if (!updated) {
        throw new Error('提交失败，悬赏状态已变更');
      }

      console.log(`[Bounty] MySQL submit 成功, id=${id}, userId=${userId}`);
      return updated;
    }

    // === Memory 回退 ===
    const bounty = super.findById(id);
    if (!bounty) {
      throw new Error('悬赏不存在');
    }
    if (bounty.acceptorId !== userId) {
      throw new Error('只有接单者可以提交完成');
    }
    if (bounty.status !== 'accepted') {
      throw new Error('只能提交已接单的悬赏');
    }

    const updated = {
      ...bounty,
      status: 'submitted',
      submittedAt: now,
    };
    super.update(id, updated);
    console.log(`[Bounty] Memory submit 成功, id=${id}`);
    return updated;
  }

  /**
   * 取消悬赏 — 将状态改为 cancelled
   *
   * 校验：
   *   - 悬赏存在且状态为 open 或 accepted
   *   - 只有发布者可以取消
   *
   * @param {number|string} id     - 悬赏 id
   * @param {string}        userId - 操作用户 UUID（必须为发布者）
   * @returns {Object} 更新后的悬赏对象
   * @throws  {Error} 如果状态不允许取消或无权限
   */
  async cancel(id, userId) {
    // === MySQL 路径 ===
    if (this.pool) {
      const bounty = await this._mysqlFindById(id);
      if (!bounty) {
        throw new Error('悬赏不存在');
      }
      if (bounty.publisherId !== userId) {
        throw new Error('只有发布者可以取消悬赏');
      }
      if (bounty.status !== 'open' && bounty.status !== 'accepted' && bounty.status !== 'submitted') {
        throw new Error('当前状态不允许取消');
      }

      const [result] = await this.pool.execute(
        `UPDATE bounties SET status = 'cancelled' WHERE id = ? AND status IN ('open', 'accepted', 'submitted')`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('取消失败，悬赏状态已变更');
      }

      console.log(`[Bounty] MySQL cancel 成功, id=${id}`);
      return await this._mysqlFindById(id);
    }

    // === Memory 回退 ===
    const bounty = super.findById(id);
    if (!bounty) {
      throw new Error('悬赏不存在');
    }
    if (bounty.publisherId !== userId) {
      throw new Error('只有发布者可以取消悬赏');
    }
    if (bounty.status !== 'open' && bounty.status !== 'accepted' && bounty.status !== 'submitted') {
      throw new Error('当前状态不允许取消');
    }

    const updated = { ...bounty, status: 'cancelled' };
    super.update(id, updated);
    console.log(`[Bounty] Memory cancel 成功, id=${id}`);
    return updated;
  }

  /**
   * 完成悬赏 — 将状态从 submitted 改为 completed（必须先由接单者提交完成）
   *
   * 只有发布者可以调用。必须先经 submit() 将状态变为 submitted，再调用本方法完成。
   * XP 奖励由路由层在 complete 成功后发放给接单者。
   *
   * 校验：
   *   - 悬赏存在且状态为 submitted
   *   - 只有发布者可以确认完成
   *
   * @param {number|string} id     - 悬赏 id
   * @param {string}        userId - 操作用户 UUID（必须为发布者）
   * @returns {Object} 更新后的悬赏对象
   * @throws  {Error} 如果状态不允许完成或无权限
   */
  async complete(id, userId) {
    const now = getMysqlDateTime();

    // === MySQL 路径 ===
    if (this.pool) {
      const bounty = await this._mysqlFindById(id);
      if (!bounty) {
        throw new Error('悬赏不存在');
      }
      if (bounty.publisherId !== userId) {
        throw new Error('只有发布者可以确认完成');
      }
      if (bounty.status !== 'submitted') {
        throw new Error('接单者尚未提交完成');
      }

      const [result] = await this.pool.execute(
        `UPDATE bounties SET status = 'completed', completed_at = ? WHERE id = ? AND status = 'submitted'`,
        [now, id]
      );

      if (result.affectedRows === 0) {
        throw new Error('完成失败，悬赏状态已变更');
      }

      console.log(`[Bounty] MySQL complete 成功, id=${id}`);
      return await this._mysqlFindById(id);
    }

    // === Memory 回退 ===
    const bounty = super.findById(id);
    if (!bounty) {
      throw new Error('悬赏不存在');
    }
    if (bounty.publisherId !== userId) {
      throw new Error('只有发布者可以确认完成');
    }
    if (bounty.status !== 'submitted') {
      throw new Error('接单者尚未提交完成');
    }

    const updated = {
      ...bounty,
      status: 'completed',
      completedAt: now,
    };
    super.update(id, updated);
    console.log(`[Bounty] Memory complete 成功, id=${id}`);
    return updated;
  }
}

// 单例导出
module.exports = new BountyModel();
