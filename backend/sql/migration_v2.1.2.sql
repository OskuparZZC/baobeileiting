-- ============================================================
-- 爆杯雷霆 V2.1.1 → V2.1.2 数据库迁移脚本
-- 数据库: baobeileiting
-- 变更: records 表 drink_id 允许 NULL，新增 custom_brand/custom_name
-- 执行日期: 2026-07-12
-- ============================================================

USE baobeileiting;

-- 1. 修改 drink_id 允许 NULL
ALTER TABLE records
  MODIFY COLUMN drink_id INT NULL COMMENT '饮品（NULL 表示自定义饮品）';

-- 2. 新增自定义饮品字段（放在 drink_id 之后）
ALTER TABLE records
  ADD COLUMN custom_brand VARCHAR(100) NULL COMMENT '用户自定义品牌' AFTER drink_id,
  ADD COLUMN custom_name  VARCHAR(100) NULL COMMENT '用户自定义饮品' AFTER custom_brand;

-- 3. bounties 新增 submitted_at 字段
ALTER TABLE bounties
  ADD COLUMN submitted_at DATETIME NULL COMMENT '提交完成时间' AFTER accepted_at;
