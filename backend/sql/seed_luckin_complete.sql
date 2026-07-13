-- ============================================================
-- 爆杯雷霆 瑞幸咖啡饮品库完整补充
-- 目标: 在已有 28 款基础上新增 35 款，达到 63 款
-- 使用 INSERT IGNORE 避免重复执行报错
-- 创建日期: 2026-07-12
-- ============================================================

USE baobeileting;

-- 获取瑞幸品牌 ID
SELECT id INTO @luckin_id FROM drink_brands WHERE name = '瑞幸咖啡';

-- ============================================================
-- 瑞幸咖啡 补充饮品（共 35 款）
-- ============================================================

-- ---- 拿铁/奶咖系列（12款）----
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@luckin_id, '澳白',                 'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '标准', '🥛', 'Flat White，丝滑薄奶泡+浓缩'),
(@luckin_id, '卡布奇诺',              'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '标准', '☕', '意式卡布奇诺，厚奶泡+浓缩'),
(@luckin_id, '焦糖玛奇朵',            'coffee', JSON_ARRAY('中杯','大杯'), 17.00, '高', '标准', '🍮', '焦糖酱+浓缩+牛奶，层次分明'),
(@luckin_id, '摩卡',                'coffee', JSON_ARRAY('中杯','大杯'), 17.00, '中', '标准', '🍫', '巧克力酱+浓缩+牛奶'),
(@luckin_id, '椰青冰萃拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '少糖', '🥥', '椰青水+椰乳+拿铁，三重椰味'),
(@luckin_id, '抹茶拿铁',              'tea',    JSON_ARRAY('中杯','大杯'), 15.00, '低', '少糖', '🍵', '日式抹茶+鲜牛奶，无咖啡款'),
(@luckin_id, '红茶拿铁',              'tea',    JSON_ARRAY('中杯','大杯'), 14.00, '中', '少糖', '🫖', '锡兰红茶+鲜牛奶'),
(@luckin_id, '陨石燕麦拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 17.00, '高', '半糖', '🌑', '燕麦奶+黑糖寒天+拿铁'),
(@luckin_id, '椰青生椰拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '少糖', '🥥', '椰青水+生椰+浓缩，椰味加倍'),
(@luckin_id, '海盐芝士拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 17.00, '高', '少糖', '🧀', '海盐芝士奶盖+拿铁'),
(@luckin_id, '提拉米苏拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 18.00, '高', '标准', '🍰', '提拉米苏风味+拿铁，甜品感'),
(@luckin_id, '黑糖波波拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 17.00, '高', '半糖', '🫧', '黑糖珍珠+拿铁');

-- ---- 美式/黑咖系列（5款）----
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@luckin_id, '精萃澳瑞白',            'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '极高', '标准', '🥛', 'Ristretto精萃+牛奶，浓度更高'),
(@luckin_id, '冰美式',               'coffee', JSON_ARRAY('中杯','大杯'), 11.00, '高', '无糖', '🧊', '经典冰美式，夏日标配'),
(@luckin_id, '气泡美式',              'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '无糖', '🫧', '苏打水+美式，气泡咖新体验'),
(@luckin_id, '西梅美式',              'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '少糖', '🫐', '西梅汁+美式咖啡，酸甜果味'),
(@luckin_id, '青苹果美式',            'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '少糖', '🍏', '青苹果汁+美式，清爽果咖');

-- ---- 果咖/特调系列（8款）----
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@luckin_id, '生椰拿铁·冰',           'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '少糖', '🥥', '冰镇版生椰拿铁，更清凉'),
(@luckin_id, '西柚冰萃美式',           'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '少糖', '🍊', '西柚果汁+美式，微苦微甜'),
(@luckin_id, '菠萝美式',              'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '少糖', '🍍', '菠萝果汁+美式咖啡'),
(@luckin_id, '蜜瓜生椰拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '标准', '🍈', '蜜瓜风味+生椰+拿铁'),
(@luckin_id, '香蕉拿铁',              'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '标准', '🍌', '香蕉风味+拿铁，香甜柔滑'),
(@luckin_id, '话梅美式',              'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '少糖', '🫐', '话梅风味+美式，咸甜酸爽'),
(@luckin_id, '椰子水美式',            'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '无糖', '🥥', '100%椰子水+美式，极简风'),
(@luckin_id, '葡萄冰萃美式·升级版',    'coffee', JSON_ARRAY('中杯','大杯'), 14.00, '高', '少糖', '🍇', '更大颗葡萄果肉+美式');

-- ---- 茶咖系列（5款）----
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@luckin_id, '龙井拿铁',              'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '少糖', '🍃', '西湖龙井茶+拿铁，春茶限定'),
(@luckin_id, '铁观音拿铁',            'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '少糖', '🍂', '安溪铁观音+拿铁，兰花香'),
(@luckin_id, '大红袍拿铁',            'coffee', JSON_ARRAY('中杯','大杯'), 17.00, '高', '少糖', '🏔', '武夷山大红袍+拿铁，岩韵'),
(@luckin_id, '金骏眉拿铁',            'coffee', JSON_ARRAY('中杯','大杯'), 18.00, '高', '少糖', '🫖', '金骏眉红茶+拿铁，高端茶咖'),
(@luckin_id, '玫瑰普洱拿铁',          'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '少糖', '🌹', '玫瑰+普洱熟茶+拿铁');

-- ---- 轻乳茶/非咖啡饮品系列（5款）----
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@luckin_id, '厚乳波波',              'tea',    JSON_ARRAY('中杯','大杯'), 14.00, '低', '标准', '🫧', '厚牛乳+黑糖波波，无咖啡'),
(@luckin_id, '椰椰双打',              'tea',    JSON_ARRAY('中杯','大杯'), 15.00, '无', '标准', '🥥', '椰乳+椰青水+椰果，三重椰'),
(@luckin_id, '草莓厚乳',              'tea',    JSON_ARRAY('中杯','大杯'), 14.00, '无', '标准', '🍓', '草莓酱+厚牛乳'),
(@luckin_id, '芒果厚乳',              'tea',    JSON_ARRAY('中杯','大杯'), 14.00, '无', '标准', '🥭', '芒果酱+厚牛乳'),
(@luckin_id, '蜜桃厚乳',              'tea',    JSON_ARRAY('中杯','大杯'), 14.00, '无', '标准', '🍑', '蜜桃酱+厚牛乳');

-- ============================================================
-- 验证：输出当前瑞幸饮品总数量
-- ============================================================
SELECT COUNT(*) AS total_luckin_drinks
FROM drinks
WHERE brand_id = @luckin_id;
