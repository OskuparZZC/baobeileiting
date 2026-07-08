/**
 * 用户模型
 * 表: users + user_stats (1:1)
 *
 * Phase 1 实现具体逻辑
 */

const { BaseModel } = require('./index');

class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  // TODO: Phase 1 - 实现注册、登录、信息查询更新
}

class UserStatsModel extends BaseModel {
  constructor() {
    super('user_stats');
  }

  // TODO: Phase 1 - 实现统计信息更新
}

module.exports = { UserModel: new UserModel(), UserStatsModel: new UserStatsModel() };
