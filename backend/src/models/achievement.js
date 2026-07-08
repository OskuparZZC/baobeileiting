/**
 * 成就系统模型
 * 表: achievements, user_achievements
 *
 * 预留结构，暂不实现业务逻辑
 */

const { BaseModel } = require('./index');

class AchievementModel extends BaseModel {
  constructor() {
    super('achievements');
  }
}

class UserAchievementModel extends BaseModel {
  constructor() {
    super('user_achievements');
  }
}

module.exports = {
  AchievementModel: new AchievementModel(),
  UserAchievementModel: new UserAchievementModel()
};
