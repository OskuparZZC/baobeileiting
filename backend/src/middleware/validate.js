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

/**
 * 校验字符串最小长度
 * @param {string} field - 字段名
 * @param {number} min   - 最小长度
 * @param {'body'|'query'|'params'} source
 */
function minLength(field, min, source = 'body') {
  return (req, res, next) => {
    const val = (req[source] || {})[field];
    if (val === undefined || val === null) return next();
    if (typeof val !== 'string') return next();
    if (val.length < min) {
      return error(res, 400, `${field} 至少需要${min}位`);
    }
    next();
  };
}

/**
 * 校验字符串最大长度
 * @param {string} field - 字段名
 * @param {number} max   - 最大长度
 * @param {'body'|'query'|'params'} source
 */
function maxLength(field, max, source = 'body') {
  return (req, res, next) => {
    const val = (req[source] || {})[field];
    if (val === undefined || val === null) return next();
    if (typeof val !== 'string') return next();
    if (val.length > max) {
      return error(res, 400, `${field} 不能超过${max}位`);
    }
    next();
  };
}

/**
 * 密码规则校验（修订3）
 *
 * 规则：
 * - 去除首尾空格后校验
 * - 最少 6 位
 * - 最多 72 位（bcrypt 对超长密码有实际限制）
 * - 不能全部为数字
 *
 * 示例：
 * "123456" ❌ (全数字)
 * "abcdef" ✅
 * "abc123" ✅
 * "   abc123   " ✅ (trim 后为 "abc123")
 */
function passwordRules(req, res, next) {
  const pwd = (req.body.password || '').trim();
  req.body.password = pwd;  // 回写 trim 后的值

  if (pwd.length < 6) {
    return error(res, 400, '密码至少需要6位');
  }
  if (pwd.length > 72) {
    return error(res, 400, '密码不能超过72位');
  }
  if (/^\d+$/.test(pwd)) {
    return error(res, 400, '密码不能全部为数字');
  }

  next();
}

module.exports = { required, type, minLength, maxLength, passwordRules };
