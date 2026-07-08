/**
 * 饮品模型
 * 表: drinks, drink_brands
 *
 * 提供饮品和品牌的查询能力
 */

const { BaseModel } = require('./index');

class DrinkModel extends BaseModel {
  constructor() {
    super('drinks');
  }
}

class DrinkBrandModel extends BaseModel {
  constructor() {
    super('drink_brands');
  }
}

module.exports = {
  DrinkModel: new DrinkModel(),
  DrinkBrandModel: new DrinkBrandModel()
};
