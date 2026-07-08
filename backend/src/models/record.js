/**
 * 饮品记录模型
 * 表: records
 *
 * Phase 2 实现具体逻辑
 */

const { BaseModel } = require('./index');

class RecordModel extends BaseModel {
  constructor() {
    super('records');
  }

  // TODO: Phase 2 - 实现 CRUD
}

module.exports = new RecordModel();
