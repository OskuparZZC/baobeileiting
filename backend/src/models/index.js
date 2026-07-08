/**
 * 数据模型汇总
 *
 * 每个模型提供统一的 CRUD 接口：
 * - findById(id)
 * - findAll(filters)
 * - create(data)
 * - update(id, data)
 * - delete(id)
 *
 * Phase 0: 使用内存存储（Map）
 * Phase 6: 切换为 MySQL（通过 database.js 连接池）
 */

const { getPool } = require('../config/database');

/**
 * 模型基类 - 内存存储实现
 */
class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    // 使用 Map 作为内存存储
    if (!BaseModel._store) {
      BaseModel._store = new Map();
    }
    if (!BaseModel._store.has(tableName)) {
      BaseModel._store.set(tableName, new Map());
    }
  }

  get _table() {
    return BaseModel._store.get(this.tableName);
  }

  findById(id) {
    return this._table.get(id) || null;
  }

  findAll(filters = {}) {
    let items = Array.from(this._table.values());

    // 简单筛选
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        items = items.filter(item => item[key] === value);
      }
    }

    return items;
  }

  create(data) {
    this._table.set(data.id, { ...data, created_at: new Date().toISOString() });
    return this._table.get(data.id);
  }

  update(id, data) {
    const existing = this._table.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    this._table.set(id, updated);
    return updated;
  }

  delete(id) {
    return this._table.delete(id);
  }

  count(filters = {}) {
    return this.findAll(filters).length;
  }
}

module.exports = { BaseModel };
