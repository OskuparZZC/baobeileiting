/**
 * 参数校验中间件
 * 提供常用的请求参数校验方法
 */

const { error } = require('../utils/response');

/**
 * 校验必填字段
 * @param {string[]} fields - 必填字段列表
 * @param {'body'|'query'|'params'} source - 参数来源
 */
function required(fields, source = 'body') {
  return (req, res, next) => {
    const data = req[source] || {};
    const missing = fields.filter(f => {
      const val = data[f];
      return val === undefined || val === null || val === '';
    });

    if (missing.length > 0) {
      return error(res, 400, `缺少必填参数: ${missing.join(', ')}`);
    }

    next();
  };
}

/**
 * 校验字段类型
 * @param {Object} schema - { field: 'string'|'number'|'boolean'|'array' }
 * @param {'body'|'query'|'params'} source
 */
function type(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source] || {};
    const errors = [];

    for (const [field, expectedType] of Object.entries(schema)) {
      const val = data[field];
      if (val === undefined || val === null) continue;

      const actualType = Array.isArray(val) ? 'array' : typeof val;
      if (actualType !== expectedType) {
        errors.push(`${field} 应为 ${expectedType} 类型`);
      }
    }

    if (errors.length > 0) {
      return error(res, 400, errors.join('; '));
    }

    next();
  };
}

module.exports = { required, type };
