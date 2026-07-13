-- ============================================================
-- 爆杯雷霆 Monster Energy / 魔爪 饮品数据
-- 品牌 + 饮品一次性补全
-- 使用 INSERT IGNORE 避免重复
-- 创建日期: 2026-07-13
-- ============================================================

USE baobeileting;

-- ============================================================
-- 1. 创建品牌（如果不存在）
-- ============================================================
INSERT IGNORE INTO drink_brands (name, logo, description, is_active, sort_order) VALUES
('魔爪', NULL, 'Monster Energy 魔爪能量饮料，全球知名能量饮料品牌，2002年诞生于美国加州，以独特口味和极限运动文化著称', 1, 10);

-- 动态获取品牌 ID
SELECT id INTO @monster_id FROM drink_brands WHERE name = '魔爪';

-- ============================================================
-- 2. 插入饮品
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES

-- 经典绿爪系列
(@monster_id, '经典绿爪',               'other', JSON_ARRAY('330ml','500ml'),  6.00, '高', '标准', '💚', 'Monster Energy 原味经典，标志性绿爪包装，能量充沛'),

-- Ultra 零糖系列（白爪/蓝爪/红爪/黑爪）
(@monster_id, '白爪 Ultra',             'other', JSON_ARRAY('330ml'),           7.00, '高', '无糖', '🤍', 'Monster Ultra 零糖白爪，清爽柠檬味，零糖零负担'),
(@monster_id, '蓝爪 Ultra',             'other', JSON_ARRAY('330ml'),           7.00, '高', '无糖', '💙', 'Monster Ultra 蓝爪，混合浆果味，零糖清爽'),
(@monster_id, '红爪 Ultra',             'other', JSON_ARRAY('330ml'),           7.00, '高', '无糖', '❤️', 'Monster Ultra 红爪，水果宾治风味，零糖活力'),
(@monster_id, '黑爪 Ultra',             'other', JSON_ARRAY('330ml'),           7.00, '高', '无糖', '🖤', 'Monster Ultra 黑爪，黑樱桃味，零糖酷感'),

-- 果汁系列
(@monster_id, '芒果味',                 'other', JSON_ARRAY('330ml','500ml'),  6.00, '高', '标准', '🥭', 'Monster Mango Loco 芒果味，热带芒果+能量配方'),
(@monster_id, '桃味',                   'other', JSON_ARRAY('330ml','500ml'),  6.00, '高', '标准', '🍑', 'Monster Papillon 桃味，蜜桃风味+能量爆发'),
(@monster_id, '柠檬味',                 'other', JSON_ARRAY('330ml','500ml'),  6.00, '高', '标准', '🍋', 'Monster Aussie Lemonade 柠檬味，澳洲柠檬风味'),

-- 无糖系列（除 Ultra 外的其他无糖款）
(@monster_id, '无糖原味',               'other', JSON_ARRAY('330ml'),           7.00, '高', '无糖', '💪', 'Monster Absolutely Zero 无糖原味，零糖经典能量');

-- ============================================================
-- 3. 统计输出
-- ============================================================
SELECT '品牌数量' AS 统计项, COUNT(*) AS 数量 FROM drink_brands WHERE name = '魔爪'
UNION ALL
SELECT '魔爪饮品数量' AS 统计项, COUNT(*) AS 数量 FROM drinks WHERE brand_id = @monster_id
UNION ALL
SELECT '瑞幸饮品数量' AS 统计项, COUNT(*) AS 数量 FROM drinks WHERE brand_id = (SELECT id FROM drink_brands WHERE name = '瑞幸咖啡');
