-- ============================================================
-- 爆杯雷霆 瑞幸饮品补充种子数据
-- 目标: 在已有 8 款基础上新增瑞幸热门饮品
-- 使用 INSERT IGNORE 避免重复执行报错
-- 创建日期: 2026-07-12
-- ============================================================

USE baobeileiting;

-- 获取瑞幸品牌 ID
SELECT id INTO @luckin_id FROM drink_brands WHERE name = '瑞幸咖啡';

-- ============================================================
-- 瑞幸咖啡 新增饮品（共 20 款）
-- ============================================================

-- ---- 奶咖系列（7款）----
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@luckin_id, '厚乳拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '标准', '🥛', '精选厚牛乳+浓缩咖啡，口感醇厚'),
(@luckin_id, '椰云拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 18.00, '高', '少糖', '☁️', '椰云顶+生椰拿铁，轻盈如云'),
(@luckin_id, '马斯卡彭生酪拿铁',    'coffee', JSON_ARRAY('中杯','大杯'), 18.00, '高', '标准', '🧀', '马斯卡彭芝士风味+生酪+拿铁'),
(@luckin_id, '小白梨拿铁',         'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '标准', '🍐', '雪梨风味+拿铁，清甜润喉'),
(@luckin_id, '烤椰拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '少糖', '🥥', '烤椰风味+拿铁，焦香椰香融合'),
(@luckin_id, '太妃榛香拿铁',       'coffee', JSON_ARRAY('中杯','大杯'), 17.00, '高', '标准', '🌰', '太妃糖+榛子风味+拿铁，冬日暖饮'),
(@luckin_id, '陨石生椰拿铁',       'coffee', JSON_ARRAY('中杯','大杯'), 17.00, '高', '半糖', '🌑', '黑糖寒天+生椰+拿铁，陨石系列升级');

-- ---- 美式/黑咖系列（4款）----
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@luckin_id, '加浓美式',           'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '极高', '无糖', '☕', '双份浓缩美式，咖啡因加倍'),
(@luckin_id, '葡萄冰萃美式',       'coffee', JSON_ARRAY('中杯','大杯'), 14.00, '高', '少糖', '🍇', '葡萄果汁+美式，果味清爽'),
(@luckin_id, '柚C美式',            'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '少糖', '🍊', '柚子果汁+美式咖啡'),
(@luckin_id, '柠C美式',            'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '少糖', '🍋', '柠檬汁+美式咖啡');

-- ---- 茶咖系列（4款）----
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@luckin_id, '碧螺知春拿铁',       'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '少糖', '🍃', '碧螺春茶+拿铁，茶咖融合'),
(@luckin_id, '山茶花·Dirty',       'coffee', JSON_ARRAY('中杯'),        16.00, '高', '少糖', '🌸', '山茶花风味+Dirty，花香咖韵'),
(@luckin_id, '桂花龙井拿铁',       'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '少糖', '🌾', '桂花+龙井茶+拿铁'),
(@luckin_id, '蒸青日向夏拿铁',     'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '少糖', '🍵', '日式蒸青绿茶+拿铁');

-- ---- 无咖啡因/轻咖系列（5款）----
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@luckin_id, '抹茶好喝椰',         'tea',    JSON_ARRAY('中杯','大杯'), 15.00, '低', '标准', '🍵', '抹茶+椰乳，清新不腻'),
(@luckin_id, '茉莉花香轻乳茶',     'tea',    JSON_ARRAY('中杯','大杯'), 14.00, '低', '少糖', '🌸', '茉莉花茶+轻乳，花香四溢'),
(@luckin_id, '生椰爱摩卡',         'coffee', JSON_ARRAY('中杯','大杯'), 17.00, '中', '标准', '🍫', '生椰+巧克力+咖啡，三重满足'),
(@luckin_id, '巧克力瑞纳冰',       'other',  JSON_ARRAY('中杯'),        18.00, '无', '标准', '🍫', '巧克力冰沙+奶油顶，夏日冰品'),
(@luckin_id, '抹茶瑞纳冰',         'other',  JSON_ARRAY('中杯'),        18.00, '低', '标准', '🍵', '抹茶冰沙+奶油顶，日式冰品');

-- ============================================================
-- 验证：输出本次新增的饮品数量
-- ============================================================
SELECT COUNT(*) AS new_luckin_drinks_count
FROM drinks
WHERE brand_id = @luckin_id;
