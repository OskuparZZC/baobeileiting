/**
 * 统一响应格式
 *
 * 所有 API 返回统一结构:
 * { code: 200, message: 'success', data: {...} }
 */

/**
 * 成功响应
 */
function success(res, data = null, message = 'success') {
  return res.json({
    code: 200,
    message,
    data
  });
}

/**
 * 创建成功响应（201）
 */
function created(res, data = null, message = '创建成功') {
  return res.status(201).json({
    code: 201,
    message,
    data
  });
}

/**
 * 业务错误响应
 * @param {number} code - HTTP 状态码
 * @param {string} message - 错误描述
 * @param {*} data - 可选错误详情
 */
function error(res, code = 400, message = '请求参数错误', data = null) {
  return res.status(code).json({
    code,
    message,
    data
  });
}

/**
 * 服务端错误响应（500）
 */
function serverError(res, message = '服务器内部错误') {
  return res.status(500).json({
    code: 500,
    message,
    data: null
  });
}

/**
 * 分页响应
 */
function paginated(res, { list, total, page, pageSize }, message = 'success') {
  return res.json({
    code: 200,
    message,
    data: {
      list,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  });
}

module.exports = { success, created, error, serverError, paginated };
