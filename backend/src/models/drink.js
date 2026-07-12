/**
 * 饮品数据模型
 *
 * Phase 2A：直接使用 MySQL，不依赖 BaseModel 内存存储
 * 包含 DrinkBrandModel、DrinkModel
 *
 * 数据库：
 * - drink_brands: 饮品品牌
 * - drinks: 饮品基础信息
 */

const { getPool } = require('../config/database');

// ==================== 字段映射工具 ====================

/**
 * 将 MySQL snake_case 行转换为 JS camelCase 对象
 */
function rowToBrand(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    description: row.description,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function rowToDrink(row) {
  if (!row) return null;
  return {
    id: row.id,
    brandId: row.brand_id,
    name: row.name,
    category: row.category,
    sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes,
    basePrice: row.base_price,
    caffeine: row.caffeine,
    sugar: row.sugar,
    icon: row.icon,
    description: row.description,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ==================== DrinkBrandModel ====================

class DrinkBrandModel {
  constructor() {
    this.pool = getPool();
  }

  /**
   * 查询品牌列表
   * @param {Object} filters - { isActive?, sortOrder? }
   * @returns {Object[]}
   */
  async findAll(filters = {}) {
    const conditions = [];
    const values = [];

    if (filters.isActive !== undefined) {
      conditions.push('is_active = ?');
      values.push(filters.isActive ? 1 : 0);
    }

    let sql = 'SELECT * FROM drink_brands';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY sort_order ASC, id ASC';

    const [rows] = await this.pool.execute(sql, values);
    return rows.map(rowToBrand);
  }

  /**
   * 根据 ID 查找品牌
   * @param {number} id
   * @returns {Object|null}
   */
  async findById(id) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM drink_brands WHERE id = ?',
      [id]
    );
    return rowToBrand(rows[0] || null);
  }
}

// ==================== DrinkModel ====================

class DrinkModel {
  constructor() {
    this.pool = getPool();
  }

  /**
   * 查询饮品列表
   * @param {Object} filters - { brandId?, category?, isActive? }
   * @returns {Object[]}
   */
  async findAll(filters = {}) {
    const conditions = [];
    const values = [];

    if (filters.brandId !== undefined) {
      conditions.push('brand_id = ?');
      values.push(filters.brandId);
    }
    if (filters.category !== undefined) {
      conditions.push('category = ?');
      values.push(filters.category);
    }
    if (filters.isActive !== undefined) {
      conditions.push('is_active = ?');
      values.push(filters.isActive ? 1 : 0);
    }

    let sql = 'SELECT * FROM drinks';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY sort_order ASC, id ASC';

    const [rows] = await this.pool.execute(sql, values);
    return rows.map(rowToDrink);
  }

  /**
   * 根据 ID 查找饮品
   * @param {number} id
   * @returns {Object|null}
   */
  async findById(id) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM drinks WHERE id = ?',
      [id]
    );
    return rowToDrink(rows[0] || null);
  }

  /**
   * 关键词搜索饮品（匹配名称、描述）
   * @param {string} keyword
   * @returns {Object[]}
   */
  async search(keyword) {
    const [rows] = await this.pool.execute(
      `SELECT * FROM drinks
       WHERE is_active = 1
         AND (name LIKE ? OR description LIKE ?)
       ORDER BY sort_order ASC, id ASC`,
      [`%${keyword}%`, `%${keyword}%`]
    );
    return rows.map(rowToDrink);
  }

  /**
   * 根据品牌 ID 查找饮品
   * @param {number} brandId
   * @returns {Object[]}
   */
  async findByBrand(brandId) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM drinks WHERE brand_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC',
      [brandId]
    );
    return rows.map(rowToDrink);
  }
}

// ==================== 单例导出 ====================

const drinkBrandModel = new DrinkBrandModel();
const drinkModel = new DrinkModel();

module.exports = { DrinkBrandModel, DrinkModel, drinkBrandModel, drinkModel };
