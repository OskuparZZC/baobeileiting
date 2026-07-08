/**
 * ID 生成器
 * 使用 uuid v4 生成全局唯一 ID
 */
const { v4: uuidv4 } = require('uuid');

/**
 * 生成唯一 ID
 * @returns {string} UUID v4
 */
function generateId() {
  return uuidv4();
}

/**
 * 生成短 ID（取 uuid 前 8 位）
 * 适用于非关键业务场景
 */
function generateShortId() {
  return uuidv4().split('-')[0];
}

module.exports = { generateId, generateShortId };
