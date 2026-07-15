/**
 * 图鉴收集模型
 * 表: user_collections
 *
 * Phase 4.1：实现 MySQL 读写
 * - user_id 使用 UUID 字符串（与 users.id、records.user_id 一致）
 * - 使用 INSERT ... ON DUPLICATE KEY UPDATE 实现幂等 upsert
 */

const { getPool } = require('../config/database');

class UserCollectionModel {
  constructor() {
    this.pool = getPool();
  }

  /**
   * 查询用户所有图鉴条目
   * @param {string} userId - UUID
   * @returns {Array<{ drink_id, unlocked_at, times_tried }>}
   */
  async findByUser(userId) {
    const [rows] = await this.pool.execute(
      'SELECT drink_id, unlocked_at, times_tried FROM user_collections WHERE user_id = ? ORDER BY unlocked_at DESC',
      [userId]
    );
    return rows;
  }

  /**
   * 新增或更新图鉴条目（幂等）
   * - 新饮品：插入 unlocked_at = ?、times_tried = 1
   * - 已有饮品：times_tried + 1，unlocked_at 保持较早日期
   * @param {string} userId - UUID
   * @param {number} drinkId
   * @param {string} unlockedAt - 日期字符串 "YYYY-MM-DD"
   * @returns {Object} { inserted: boolean }
   */
  async upsert(userId, drinkId, unlockedAt) {
    const [result] = await this.pool.execute(
      `INSERT INTO user_collections (user_id, drink_id, unlocked_at, times_tried)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         times_tried = times_tried + 1,
         unlocked_at = LEAST(unlocked_at, VALUES(unlocked_at))`,
      [userId, drinkId, unlockedAt]
    );

    // result.affectedRows: 1 = INSERT, 2 = UPDATE (ON DUPLICATE KEY)
    return { inserted: result.affectedRows === 1 };
  }
}

module.exports = new UserCollectionModel();
