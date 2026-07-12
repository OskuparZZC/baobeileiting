/**
 * 饮水记录数据模型
 *
 * Phase 2A：直接使用 MySQL，不依赖 BaseModel 内存存储
 *
 * 数据库表：
 * - records: 用户饮水记录
 */

const { getPool } = require('../config/database');

// ==================== 字段映射工具 ====================

/**
 * 将 MySQL snake_case 行转换为 JS camelCase 对象
 */
function rowToRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    drinkId: row.drink_id,
    customBrand: row.custom_brand,
    customName: row.custom_name,
    size: row.size,
    price: row.price,
    rating: row.rating,
    note: row.note,
    date: row.date,
    time: row.time,
    createdAt: row.created_at,
  };
}

// ==================== RecordModel ====================

class RecordModel {
  constructor() {
    this.pool = getPool();
  }

  /**
   * 创建饮水记录
   * 支持官方饮品（drinkId 有值）和自定义饮品（drinkId 为 null）
   * @param {Object} data - { userId, drinkId?, customBrand?, customName?, size?, price?, rating?, note?, date, time }
   * @returns {Object} 创建的记录
   */
  async create(data) {
    const [result] = await this.pool.execute(
      `INSERT INTO records (user_id, drink_id, custom_brand, custom_name, size, price, rating, note, date, time, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        data.userId ?? null,
        data.drinkId ?? null,
        data.customBrand ?? null,
        data.customName ?? null,
        data.size ?? null,
        data.price ?? null,
        data.rating ?? null,
        data.note ?? null,
        data.date ?? null,
        data.time ?? null,
      ]
    );

    const [rows] = await this.pool.execute(
      'SELECT * FROM records WHERE id = ?',
      [result.insertId]
    );
    return rowToRecord(rows[0]);
  }

  /**
   * 根据 ID 查找记录
   * @param {number} id
   * @returns {Object|null}
   */
  async findById(id) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM records WHERE id = ?',
      [id]
    );
    return rowToRecord(rows[0] || null);
  }

  /**
   * 查询用户记录（按日期倒序）
   * @param {string} userId
   * @param {Object} options - { limit? }
   * @returns {Object[]}
   */
  async findByUser(userId, options = {}) {
    let sql = 'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, id DESC';
    const values = [userId];

    if (options.limit != null) {
      sql += ' LIMIT ?';
      values.push(options.limit);
    }

    const [rows] = await this.pool.execute(sql, values);
    return rows.map(rowToRecord);
  }

  /**
   * 统计用户记录总数
   * @param {string} userId
   * @returns {number}
   */
  async countByUser(userId) {
    const [rows] = await this.pool.execute(
      'SELECT COUNT(*) AS cnt FROM records WHERE user_id = ?',
      [userId]
    );
    return rows[0].cnt;
  }

  /**
   * 删除记录（只能删除自己的记录）
   * @param {number} id
   * @param {string} userId
   * @returns {boolean} 是否删除成功
   */
  async delete(id, userId) {
    const [result] = await this.pool.execute(
      'DELETE FROM records WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}

// ==================== 单例导出 ====================

const recordModel = new RecordModel();

module.exports = { RecordModel, recordModel };
