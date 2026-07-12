-- ============================================================
-- 爆杯雷霆 V2.1.2 官方饮品快捷选择库 种子数据
-- 目标: 初始化 drink_brands + drinks
-- 使用 INSERT IGNORE 避免重复执行报错
-- 创建日期: 2026-07-12
-- ============================================================

USE baobeileiting;

-- ============================================================
-- Part 1: drink_brands（约 40 个品牌）
-- ============================================================

-- 【奶茶/茶饮】
INSERT IGNORE INTO drink_brands (name, logo, description, sort_order) VALUES
('喜茶',           NULL, '灵感之茶，新茶饮开创者', 1),
('奈雪的茶',        NULL, '一杯好茶，一口软欧包', 2),
('蜜雪冰城',        NULL, '你爱我我爱你，蜜雪冰城甜蜜蜜', 3),
('古茗',           NULL, '每天一杯喝不腻', 4),
('茶百道',          NULL, '好茶为底，制造新鲜', 5),
('一点点',          NULL, '手摇茶饮，自由搭配', 6),
('CoCo都可',        NULL, '全球茶饮连锁品牌', 7),
('书亦烧仙草',       NULL, '半杯都是料', 8),
('霸王茶姬',         NULL, '以东方茶，会世界友', 9),
('茶颜悦色',         NULL, '新中式鲜茶', 10),
('沪上阿姨',         NULL, '五谷茶饮开创者', 11),
('益禾堂',          NULL, '畅饮年轻，这一杯益禾堂', 12),
('7分甜',           NULL, '杯装杨枝甘露创造者', 13),
('快乐番薯',         NULL, '薯于你的快乐', 14),
('茶救星球',         NULL, '蔬果茶新品类', 15),
('柠季',           NULL, '手打柠檬茶专门店', 16),
('LINLEE手打柠檬茶',  NULL, '广东手打柠檬茶', 17),
('茉莉奶白',         NULL, '花香鲜奶茶', 18),
('阿嬷手作',         NULL, '手作·自然·家', 19),
('爷爷不泡茶',        NULL, '爷爷不泡茶，泡了才香', 20);

-- 【咖啡】
INSERT IGNORE INTO drink_brands (name, logo, description, sort_order) VALUES
('瑞幸咖啡',         NULL, 'luckin coffee，专业咖啡新鲜式', 21),
('星巴克',          NULL, 'Starbucks，星巴克咖啡', 22),
('库迪咖啡',         NULL, 'Cotti Coffee，源自瑞幸创始团队', 23),
('Manner',         NULL, '让咖啡成为生活的一部分', 24),
('Costa',          NULL, '源自伦敦的咖啡品牌', 25),
('Tims天好咖啡',     NULL, '加拿大国民咖啡', 26),
('McCafe',         NULL, '麦当劳旗下咖啡品牌', 27),
('Peet\'s Coffee', NULL, '皮爷咖啡，咖啡界祖师爷', 28),
('Nowwa挪瓦咖啡',    NULL, '果咖新选择', 29);

-- 【饮料】
INSERT IGNORE INTO drink_brands (name, logo, description, sort_order) VALUES
('可口可乐',         NULL, 'Coca-Cola，快乐水', 31),
('百事可乐',         NULL, 'Pepsi，渴望无限', 32),
('元气森林',         NULL, '0糖0脂0卡，元气满满', 33),
('东方树叶',         NULL, '农夫山泉出品，0卡路里茶饮料', 34),
('农夫山泉',         NULL, '我们不生产水，我们只是大自然的搬运工', 35),
('康师傅',          NULL, '康师傅冰红茶/绿茶系列', 36),
('统一',           NULL, '统一冰红茶/绿茶/阿萨姆', 37),
('王老吉',          NULL, '怕上火喝王老吉', 38),
('红牛',           NULL, 'Red Bull，你的能量超乎你想象', 39),
('维他',           NULL, '维他柠檬茶，够真才出涩', 40);

-- 【其他】
INSERT IGNORE INTO drink_brands (name, logo, description, sort_order) VALUES
('校园饮品店',       NULL, '校园内饮品店铺', 50),
('食堂饮品',         NULL, '学校食堂饮品', 51),
('小卖部饮品',       NULL, '校园小卖部/超市饮品', 52),
('自制饮品',         NULL, '自己动手制作的饮品', 53),
('其他',           NULL, '其他未分类饮品', 99);

-- ============================================================
-- Part 2: drinks（约 250+ 个饮品）
-- ============================================================

-- ---------- 品牌 ID 变量 ----------
SELECT id INTO @xicha_id       FROM drink_brands WHERE name = '喜茶';
SELECT id INTO @naixue_id      FROM drink_brands WHERE name = '奈雪的茶';
SELECT id INTO @mixue_id       FROM drink_brands WHERE name = '蜜雪冰城';
SELECT id INTO @guming_id      FROM drink_brands WHERE name = '古茗';
SELECT id INTO @chabaidao_id   FROM drink_brands WHERE name = '茶百道';
SELECT id INTO @yidiandian_id  FROM drink_brands WHERE name = '一点点';
SELECT id INTO @coco_id        FROM drink_brands WHERE name = 'CoCo都可';
SELECT id INTO @shuyi_id       FROM drink_brands WHERE name = '书亦烧仙草';
SELECT id INTO @bawang_id      FROM drink_brands WHERE name = '霸王茶姬';
SELECT id INTO @chayan_id      FROM drink_brands WHERE name = '茶颜悦色';
SELECT id INTO @hushang_id     FROM drink_brands WHERE name = '沪上阿姨';
SELECT id INTO @yihetang_id    FROM drink_brands WHERE name = '益禾堂';
SELECT id INTO @7fentian_id    FROM drink_brands WHERE name = '7分甜';
SELECT id INTO @kuailefanshu_id FROM drink_brands WHERE name = '快乐番薯';
SELECT id INTO @chajiu_id      FROM drink_brands WHERE name = '茶救星球';
SELECT id INTO @ningji_id      FROM drink_brands WHERE name = '柠季';
SELECT id INTO @linlee_id      FROM drink_brands WHERE name = 'LINLEE手打柠檬茶';
SELECT id INTO @molinaibai_id  FROM drink_brands WHERE name = '茉莉奶白';
SELECT id INTO @amo_id         FROM drink_brands WHERE name = '阿嬷手作';
SELECT id INTO @yeye_id        FROM drink_brands WHERE name = '爷爷不泡茶';

SELECT id INTO @luckin_id      FROM drink_brands WHERE name = '瑞幸咖啡';
SELECT id INTO @starbucks_id   FROM drink_brands WHERE name = '星巴克';
SELECT id INTO @cotti_id       FROM drink_brands WHERE name = '库迪咖啡';
SELECT id INTO @manner_id      FROM drink_brands WHERE name = 'Manner';
SELECT id INTO @costa_id       FROM drink_brands WHERE name = 'Costa';
SELECT id INTO @tims_id        FROM drink_brands WHERE name = 'Tims天好咖啡';
SELECT id INTO @mccafe_id      FROM drink_brands WHERE name = 'McCafe';
SELECT id INTO @peets_id       FROM drink_brands WHERE name = 'Peet\'s Coffee';
SELECT id INTO @nowwa_id       FROM drink_brands WHERE name = 'Nowwa挪瓦咖啡';

SELECT id INTO @cocacola_id    FROM drink_brands WHERE name = '可口可乐';
SELECT id INTO @pepsi_id       FROM drink_brands WHERE name = '百事可乐';
SELECT id INTO @yuanqi_id      FROM drink_brands WHERE name = '元气森林';
SELECT id INTO @dongfang_id    FROM drink_brands WHERE name = '东方树叶';
SELECT id INTO @nongfu_id      FROM drink_brands WHERE name = '农夫山泉';
SELECT id INTO @kangshifu_id   FROM drink_brands WHERE name = '康师傅';
SELECT id INTO @tongyi_id      FROM drink_brands WHERE name = '统一';
SELECT id INTO @wanglaoji_id   FROM drink_brands WHERE name = '王老吉';
SELECT id INTO @redbull_id     FROM drink_brands WHERE name = '红牛';
SELECT id INTO @weita_id       FROM drink_brands WHERE name = '维他';

SELECT id INTO @campus_id      FROM drink_brands WHERE name = '校园饮品店';
SELECT id INTO @canteen_id     FROM drink_brands WHERE name = '食堂饮品';
SELECT id INTO @shop_id        FROM drink_brands WHERE name = '小卖部饮品';
SELECT id INTO @homemade_id    FROM drink_brands WHERE name = '自制饮品';
SELECT id INTO @other_id       FROM drink_brands WHERE name = '其他';


-- ============================================================
-- 喜茶（8款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@xicha_id, '多肉葡萄',       'tea', JSON_ARRAY('中杯','大杯'), 19.00, '低', '少糖', '🍇', '手剥葡萄+绿妍茶底'),
(@xicha_id, '芝芝莓莓',       'tea', JSON_ARRAY('中杯','大杯'), 19.00, '低', '半糖', '🍓', '草莓+芝士奶盖+绿妍茶底'),
(@xicha_id, '烤黑糖波波牛乳',  'tea', JSON_ARRAY('中杯','大杯'), 18.00, '无', '标准', '🫧', '黑糖珍珠+鲜牛乳'),
(@xicha_id, '满杯红柚',       'tea', JSON_ARRAY('中杯','大杯'), 17.00, '低', '少糖', '🍊', '满满西柚+绿妍茶底'),
(@xicha_id, '芝芝芒芒',       'tea', JSON_ARRAY('中杯','大杯'), 18.00, '低', '半糖', '🥭', '芒果+芝士奶盖+绿妍'),
(@xicha_id, '纯绿妍',         'tea', JSON_ARRAY('中杯','大杯'), 11.00, '中', '无糖', '🍃', '茉莉绿茶纯茶'),
(@xicha_id, '轻波波牛乳茶',    'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '少糖', '🧋', '奶茶+黑糖波波'),
(@xicha_id, '酷黑莓桑',       'tea', JSON_ARRAY('中杯','大杯'), 19.00, '低', '半糖', '🫐', '蓝莓+桑葚+草莓');

-- ============================================================
-- 奈雪的茶（7款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@naixue_id, '霸气草莓',       'tea', JSON_ARRAY('中杯','大杯'), 19.00, '低', '少糖', '🍓', '新鲜草莓+茉莉初雪茶底'),
(@naixue_id, '霸气葡萄',       'tea', JSON_ARRAY('中杯','大杯'), 19.00, '低', '少糖', '🍇', '手剥葡萄+茉莉初雪茶底'),
(@naixue_id, '霸气橙子',       'tea', JSON_ARRAY('中杯','大杯'), 17.00, '低', '半糖', '🍊', '新奇士橙+茉莉初雪'),
(@naixue_id, '杨枝甘露',       'tea', JSON_ARRAY('中杯'),        18.00, '低', '标准', '🥭', '芒果+西柚+椰奶+西米'),
(@naixue_id, '茉莉初雪',       'tea', JSON_ARRAY('中杯','大杯'), 11.00, '中', '无糖', '🌸', '茉莉花茶纯茶'),
(@naixue_id, '金色山脉珍珠奶茶', 'tea', JSON_ARRAY('中杯','大杯'), 15.00, '中', '少糖', '🧋', '红茶+珍珠+鲜奶'),
(@naixue_id, '霸气柠檬',       'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '半糖', '🍋', '柠檬+茉莉初雪茶底');

-- ============================================================
-- 蜜雪冰城（8款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@mixue_id, '冰鲜柠檬水',      'tea',  JSON_ARRAY('中杯','大杯'), 4.00,  '无', '标准', '🍋', '新鲜柠檬+冰水，性价比之王'),
(@mixue_id, '珍珠奶茶',        'tea',  JSON_ARRAY('中杯','大杯'), 6.00,  '中', '标准', '🧋', '经典珍珠奶茶'),
(@mixue_id, '满杯百香果',      'tea',  JSON_ARRAY('中杯','大杯'), 7.00,  '无', '标准', '🍊', '百香果+椰果+珍珠'),
(@mixue_id, '草莓摇摇奶昔',     'tea',  JSON_ARRAY('中杯'),        6.00,  '无', '标准', '🍓', '草莓酱+冰淇淋+牛奶'),
(@mixue_id, '棒打鲜橙',        'tea',  JSON_ARRAY('中杯','大杯'), 6.00,  '无', '标准', '🍊', '新鲜橙子现榨'),
(@mixue_id, '蜜桃四季春',      'tea',  JSON_ARRAY('中杯','大杯'), 5.00,  '低', '标准', '🍑', '蜜桃果肉+四季春茶'),
(@mixue_id, '原味冰淇淋',      'other', JSON_ARRAY('标准'),        3.00,  '无', '标准', '🍦', '新鲜现打冰淇淋'),
(@mixue_id, '芝士奶盖绿茶',     'tea',  JSON_ARRAY('中杯','大杯'), 7.00,  '中', '半糖', '🍵', '芝士奶盖+绿茶');

-- ============================================================
-- 古茗（7款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@guming_id, '超A芝士葡萄',     'tea', JSON_ARRAY('中杯','大杯'), 16.00, '低', '少糖', '🍇', '手剥葡萄+芝士奶盖+茉莉绿茶'),
(@guming_id, '布蕾脆脆奶芙',     'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '标准', '🍮', '布蕾+脆波波+奶油顶'),
(@guming_id, '龙井香青团',      'tea', JSON_ARRAY('中杯','大杯'), 14.00, '低', '少糖', '🍵', '龙井茶+青团丸子'),
(@guming_id, '杨枝甘露',        'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '标准', '🥭', '芒果+西柚+椰奶'),
(@guming_id, '大叔奶茶',        'tea', JSON_ARRAY('中杯','大杯'), 10.00, '中', '标准', '🧋', '古茗招牌奶茶'),
(@guming_id, '什么都有',        'tea', JSON_ARRAY('中杯','大杯'), 10.00, '中', '标准', '🥤', '古茗经典大满贯'),
(@guming_id, '百香双重奏',      'tea', JSON_ARRAY('中杯','大杯'), 11.00, '无', '标准', '🍊', '百香果+珍珠+椰果');

-- ============================================================
-- 茶百道（7款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@chabaidao_id, '茉莉奶绿',       'tea', JSON_ARRAY('中杯','大杯'), 12.00, '低', '少糖', '🌸', '茉莉绿茶+鲜奶'),
(@chabaidao_id, '杨枝甘露',       'tea', JSON_ARRAY('中杯','大杯'), 16.00, '低', '标准', '🥭', '招牌杨枝甘露'),
(@chabaidao_id, '豆乳玉麒麟',      'tea', JSON_ARRAY('中杯','大杯'), 15.00, '中', '少糖', '🥜', '玉麒麟茶底+豆乳奶盖+黄豆粉'),
(@chabaidao_id, '西瓜啵啵',       'tea', JSON_ARRAY('中杯','大杯'), 12.00, '无', '标准', '🍉', '西瓜+脆波波'),
(@chabaidao_id, '铁观音奶冻',      'tea', JSON_ARRAY('中杯','大杯'), 13.00, '中', '少糖', '🍮', '铁观音茶底+奶冻'),
(@chabaidao_id, '葡萄冻冻',       'tea', JSON_ARRAY('中杯','大杯'), 14.00, '低', '少糖', '🍇', '葡萄果肉+冻冻'),
(@chabaidao_id, '超级杯水果茶',     'tea', JSON_ARRAY('大杯'),        18.00, '低', '半糖', '🍉', '六种鲜果+茉莉绿茶，超大杯');

-- ============================================================
-- 一点点（7款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@yidiandian_id, '四季春茶',       'tea', JSON_ARRAY('中杯','大杯'), 8.00,  '中', '无糖', '🍃', '四季春茶纯茶'),
(@yidiandian_id, '波霸奶茶',       'tea', JSON_ARRAY('中杯','大杯'), 10.00, '中', '半糖', '🧋', '大波霸珍珠奶茶'),
(@yidiandian_id, '冰淇淋红茶',      'tea', JSON_ARRAY('中杯','大杯'), 12.00, '中', '少糖', '🍦', '红茶+香草冰淇淋'),
(@yidiandian_id, '乌龙奶茶',       'tea', JSON_ARRAY('中杯','大杯'), 10.00, '中', '半糖', '🍂', '乌龙茶+鲜奶'),
(@yidiandian_id, '葡萄柚绿',       'tea', JSON_ARRAY('中杯','大杯'), 11.00, '低', '半糖', '🍊', '葡萄柚汁+绿茶'),
(@yidiandian_id, '阿华田',         'tea', JSON_ARRAY('中杯','大杯'), 12.00, '低', '标准', '🍫', '阿华田+波霸+冰淇淋'),
(@yidiandian_id, '养乐多绿',       'tea', JSON_ARRAY('中杯','大杯'), 11.00, '低', '半糖', '🍵', '养乐多+绿茶');

-- ============================================================
-- CoCo都可（7款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@coco_id, '鲜百香双响炮',     'tea', JSON_ARRAY('中杯','大杯'), 12.00, '低', '半糖', '🍊', '百香果+珍珠+椰果，招牌饮品'),
(@coco_id, '奶茶三兄弟',       'tea', JSON_ARRAY('中杯','大杯'), 12.00, '中', '标准', '🧋', '珍珠+布丁+仙草奶茶'),
(@coco_id, '莓莓果茶',        'tea', JSON_ARRAY('中杯','大杯'), 13.00, '低', '少糖', '🍓', '草莓+蔓越莓+绿茶'),
(@coco_id, '芒果绿茶',        'tea', JSON_ARRAY('中杯','大杯'), 10.00, '低', '半糖', '🥭', '芒果果肉+绿茶'),
(@coco_id, '柠檬霸',         'tea', JSON_ARRAY('大杯'),        13.00, '低', '半糖', '🍋', '整颗柠檬+绿茶，大杯畅饮'),
(@coco_id, '茉香奶茶',        'tea', JSON_ARRAY('中杯','大杯'), 10.00, '中', '半糖', '🌸', '茉莉花茶+鲜奶'),
(@coco_id, '鲜芋牛奶',        'tea', JSON_ARRAY('中杯','大杯'), 14.00, '无', '标准', '🍠', '芋泥+鲜牛奶');

-- ============================================================
-- 书亦烧仙草（7款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@shuyi_id, '招牌烧仙草',       'tea', JSON_ARRAY('中杯','大杯'), 12.00, '低', '标准', '🌿', '半杯都是料的招牌烧仙草'),
(@shuyi_id, '葡萄芋圆冻冻',      'tea', JSON_ARRAY('中杯','大杯'), 13.00, '低', '少糖', '🍇', '葡萄+芋圆+冻冻+绿茶'),
(@shuyi_id, '杨枝甘露烧仙草',     'tea', JSON_ARRAY('中杯','大杯'), 14.00, '低', '标准', '🥭', '杨枝甘露+烧仙草，跨界组合'),
(@shuyi_id, '百香凤梨',        'tea', JSON_ARRAY('中杯','大杯'), 11.00, '无', '半糖', '🍍', '百香果+凤梨+绿茶'),
(@shuyi_id, '草莓啵啵益菌多',     'tea', JSON_ARRAY('中杯','大杯'), 13.00, '无', '标准', '🍓', '草莓+啵啵+益菌多'),
(@shuyi_id, '茉莉奶绿',        'tea', JSON_ARRAY('中杯','大杯'), 10.00, '低', '少糖', '🌸', '茉莉花茶+鲜奶'),
(@shuyi_id, '橙漫山茶花',       'tea', JSON_ARRAY('中杯','大杯'), 13.00, '低', '少糖', '🍊', '橙子+山茶花乌龙');

-- ============================================================
-- 霸王茶姬（7款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@bawang_id, '伯牙绝弦',        'tea', JSON_ARRAY('中杯','大杯'), 16.00, '中', '少糖', '🎵', '茉莉雪芽+优质牛乳，经典招牌'),
(@bawang_id, '桂馥兰香',        'tea', JSON_ARRAY('中杯','大杯'), 16.00, '中', '少糖', '🌸', '桂花乌龙+牛乳'),
(@bawang_id, '花田乌龙',        'tea', JSON_ARRAY('中杯','大杯'), 15.00, '中', '少糖', '🍑', '白桃乌龙+牛乳'),
(@bawang_id, '白雾红尘',        'tea', JSON_ARRAY('中杯','大杯'), 17.00, '中', '少糖', '🍂', '大红袍+牛乳，岩韵悠长'),
(@bawang_id, '青青糯山',        'tea', JSON_ARRAY('中杯','大杯'), 16.00, '中', '少糖', '🌾', '糯米香绿茶+牛乳'),
(@bawang_id, '万里木兰',        'tea', JSON_ARRAY('中杯','大杯'), 17.00, '中', '少糖', '🏔', '锡兰红茶+牛乳，异域风情'),
(@bawang_id, '寻香山茶',        'tea', JSON_ARRAY('中杯','大杯'), 16.00, '中', '少糖', '🏔', '山茶花乌龙+牛乳');

-- ============================================================
-- 茶颜悦色（7款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@chayan_id, '幽兰拿铁',        'tea', JSON_ARRAY('标准'),        16.00, '中', '标准', '🥜', '锡兰红茶+鲜奶+碧根果碎，招牌'),
(@chayan_id, '声声乌龙',        'tea', JSON_ARRAY('标准'),        15.00, '中', '标准', '🍑', '蜜桃乌龙茶+鲜奶，清新回甘'),
(@chayan_id, '桂花弄',         'tea', JSON_ARRAY('标准'),        15.00, '中', '标准', '🌸', '桂花乌龙茶+鲜奶，桂花飘香'),
(@chayan_id, '人间烟火',        'tea', JSON_ARRAY('标准'),        16.00, '中', '标准', '🎆', '大红袍+鲜奶+开心果碎'),
(@chayan_id, '抹茶菩提',        'tea', JSON_ARRAY('标准'),        16.00, '低', '标准', '🍵', '抹茶+鲜奶+葡萄干'),
(@chayan_id, '蔓越阑珊',        'tea', JSON_ARRAY('标准'),        17.00, '低', '标准', '🍒', '蔓越莓+锡兰红茶+鲜奶'),
(@chayan_id, '栀子生椰',        'tea', JSON_ARRAY('标准'),        16.00, '低', '标准', '🥥', '栀子绿茶+椰乳');

-- ============================================================
-- 沪上阿姨（6款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@hushang_id, '血糯米奶茶',      'tea', JSON_ARRAY('中杯','大杯'), 12.00, '中', '标准', '🍚', '血糯米+奶茶，经典招牌'),
(@hushang_id, '绿豆牛乳冰',      'tea', JSON_ARRAY('中杯','大杯'), 13.00, '无', '标准', '🫘', '绿豆沙+牛乳冰'),
(@hushang_id, '草莓大福',       'tea', JSON_ARRAY('中杯','大杯'), 14.00, '低', '标准', '🍓', '草莓+麻薯+鲜奶'),
(@hushang_id, '杨枝甘露',       'tea', JSON_ARRAY('中杯','大杯'), 14.00, '低', '标准', '🥭', '经典杨枝甘露'),
(@hushang_id, '多肉葡萄',       'tea', JSON_ARRAY('中杯','大杯'), 13.00, '低', '少糖', '🍇', '葡萄果肉+茉莉绿茶'),
(@hushang_id, '厚芋泥波波奶茶',   'tea', JSON_ARRAY('中杯','大杯'), 14.00, '中', '标准', '🍠', '厚芋泥+波波+奶茶');

-- ============================================================
-- 益禾堂（6款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@yihetang_id, '益禾烤奶',        'tea', JSON_ARRAY('中杯','大杯'), 8.00,  '中', '标准', '🥛', '招牌烤奶，焦香浓郁'),
(@yihetang_id, '薄荷奶绿',        'tea', JSON_ARRAY('中杯','大杯'), 9.00,  '低', '标准', '🌿', '薄荷+茉莉奶绿，清爽提神'),
(@yihetang_id, '西瓜椰椰',        'tea', JSON_ARRAY('中杯','大杯'), 10.00, '无', '标准', '🍉', '西瓜+椰乳'),
(@yihetang_id, '多肉葡萄',        'tea', JSON_ARRAY('中杯','大杯'), 11.00, '低', '少糖', '🍇', '葡萄+茉莉绿茶'),
(@yihetang_id, '杨梅吐气',        'tea', JSON_ARRAY('中杯','大杯'), 11.00, '低', '少糖', '🍒', '杨梅+茉莉绿茶'),
(@yihetang_id, '茉莉白月光',       'tea', JSON_ARRAY('中杯','大杯'), 8.00,  '低', '少糖', '🌸', '茉莉花茶+鲜奶');

-- ============================================================
-- 7分甜（6款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@7fentian_id, '杨枝甘露',        'tea', JSON_ARRAY('中杯','大杯'), 18.00, '低', '标准', '🥭', '杯装杨枝甘露首创者，经典招牌'),
(@7fentian_id, '芒椰小丸子',       'tea', JSON_ARRAY('中杯','大杯'), 16.00, '无', '标准', '🥥', '芒果+椰奶+小丸子'),
(@7fentian_id, '草莓甘露',        'tea', JSON_ARRAY('中杯','大杯'), 17.00, '低', '标准', '🍓', '草莓版杨枝甘露'),
(@7fentian_id, '西瓜甘露',        'tea', JSON_ARRAY('中杯','大杯'), 14.00, '无', '标准', '🍉', '西瓜版杨枝甘露'),
(@7fentian_id, '超级水果茶',       'tea', JSON_ARRAY('大杯'),        19.00, '低', '半糖', '🍉', '多种水果+绿茶，超大杯'),
(@7fentian_id, '蜜桃乌龙奶茶',      'tea', JSON_ARRAY('中杯','大杯'), 15.00, '中', '少糖', '🍑', '蜜桃乌龙茶+鲜奶');

-- ============================================================
-- 快乐番薯（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@kuailefanshu_id, '紫薯圆奶茶',    'tea', JSON_ARRAY('中杯','大杯'), 9.00,  '中', '标准', '🍠', '紫薯圆+奶茶'),
(@kuailefanshu_id, '番薯香烤奶',     'tea', JSON_ARRAY('中杯','大杯'), 10.00, '中', '标准', '🥛', '番薯+烤奶，招牌'),
(@kuailefanshu_id, '芋圆大满贯',     'tea', JSON_ARRAY('中杯','大杯'), 11.00, '中', '标准', '🍠', '芋圆+珍珠+仙草+奶茶'),
(@kuailefanshu_id, '柠檬红茶',      'tea', JSON_ARRAY('中杯','大杯'), 7.00,  '中', '半糖', '🍋', '柠檬+红茶'),
(@kuailefanshu_id, '百香果双响炮',    'tea', JSON_ARRAY('中杯','大杯'), 9.00,  '低', '半糖', '🍊', '百香果+珍珠+椰果');

-- ============================================================
-- 茶救星球（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@chajiu_id, '苦瓜柠檬茶',       'tea', JSON_ARRAY('中杯','大杯'), 13.00, '低', '少糖', '🥒', '苦瓜+柠檬+绿茶，蔬果茶开创'),
(@chajiu_id, '番茄蛋花汤（饮品）',  'tea', JSON_ARRAY('中杯'),        14.00, '无', '少糖', '🍅', '番茄+菠萝+脆波波，趣味饮品'),
(@chajiu_id, '斑斓薄荷柠檬茶',    'tea', JSON_ARRAY('中杯','大杯'), 14.00, '低', '少糖', '🌿', '斑斓叶+薄荷+柠檬+绿茶'),
(@chajiu_id, '胡萝卜橙',        'tea', JSON_ARRAY('中杯','大杯'), 13.00, '无', '标准', '🥕', '胡萝卜+橙子，健康蔬果茶'),
(@chajiu_id, '香菜柠檬茶',       'tea', JSON_ARRAY('中杯','大杯'), 13.00, '低', '少糖', '🌿', '香菜+柠檬+绿茶，争议之作');

-- ============================================================
-- 柠季（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@ningji_id, '招牌手打柠檬茶',     'tea', JSON_ARRAY('中杯','大杯'), 13.00, '中', '标准', '🍋', '手打香水柠檬+红茶底，招牌'),
(@ningji_id, '茉莉手打柠檬茶',     'tea', JSON_ARRAY('中杯','大杯'), 13.00, '低', '标准', '🍋', '香水柠檬+茉莉绿茶底'),
(@ningji_id, '鸭屎香手打柠檬茶',    'tea', JSON_ARRAY('中杯','大杯'), 14.00, '中', '标准', '🍋', '鸭屎香单丛茶底+香水柠檬'),
(@ningji_id, '梅烦恼',          'tea', JSON_ARRAY('中杯','大杯'), 14.00, '低', '少糖', '🫐', '话梅+柠檬+绿茶，酸甜解腻'),
(@ningji_id, '椰子手打柠檬茶',     'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '标准', '🥥', '椰青+香水柠檬+绿茶');

-- ============================================================
-- LINLEE手打柠檬茶（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@linlee_id, '招牌手打柠檬茶',     'tea', JSON_ARRAY('中杯','大杯'), 13.00, '中', '标准', '🍋', '手打香水柠檬+红茶'),
(@linlee_id, '鸭屎香柠檬茶',      'tea', JSON_ARRAY('中杯','大杯'), 14.00, '中', '标准', '🍋', '鸭屎香茶底+香水柠檬'),
(@linlee_id, '苦瓜柠檬茶',       'tea', JSON_ARRAY('中杯','大杯'), 14.00, '低', '少糖', '🥒', '苦瓜+柠檬，清热降火'),
(@linlee_id, '海底椰柠檬茶',      'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '标准', '🥥', '海底椰+柠檬，热带风情'),
(@linlee_id, '石榴柠檬茶',       'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '少糖', '🍎', '石榴汁+柠檬+绿茶');

-- ============================================================
-- 茉莉奶白（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@molinaibai_id, '茉莉奶白',       'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '少糖', '🌸', '茉莉花茶+鲜奶，招牌'),
(@molinaibai_id, '一朵茉莉花',      'tea', JSON_ARRAY('中杯','大杯'), 16.00, '低', '少糖', '🌸', '茉莉奶白+奶油顶+茉莉花'),
(@molinaibai_id, '白兰',         'tea', JSON_ARRAY('中杯','大杯'), 16.00, '低', '少糖', '🌼', '白兰花茶+鲜奶，清香优雅'),
(@molinaibai_id, '栀子奶白',      'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '少糖', '🌿', '栀子花茶+鲜奶'),
(@molinaibai_id, '桂花龙井',      'tea', JSON_ARRAY('中杯','大杯'), 16.00, '中', '少糖', '🌾', '桂花+龙井+鲜奶');

-- ============================================================
-- 阿嬷手作（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@amo_id, '手作·米麻薯',       'tea', JSON_ARRAY('中杯'),        20.00, '中', '标准', '🍚', '手打米麻薯+奶茶，招牌'),
(@amo_id, '打·米麻薯',        'tea', JSON_ARRAY('中杯'),        22.00, '中', '标准', '🍚', '升级版米麻薯奶茶'),
(@amo_id, '手剥·葡萄',        'tea', JSON_ARRAY('中杯'),        24.00, '低', '少糖', '🍇', '手剥巨峰葡萄+茉莉绿茶'),
(@amo_id, '手剥·毛荔枝',       'tea', JSON_ARRAY('中杯'),        24.00, '低', '少糖', '🍈', '手剥毛荔枝+茉莉绿茶'),
(@amo_id, '老椰清补凉',        'tea', JSON_ARRAY('中杯'),        20.00, '无', '标准', '🥥', '椰奶+马蹄+薏米+西瓜，清补凉风味');

-- ============================================================
-- 爷爷不泡茶（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@yeye_id, '空山栀子',         'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '少糖', '🌿', '栀子花茶+鲜奶，花香清雅'),
(@yeye_id, '重瓣玫瑰',         'tea', JSON_ARRAY('中杯','大杯'), 16.00, '低', '少糖', '🌹', '重瓣玫瑰+鲜奶，花香浓郁'),
(@yeye_id, '爷爷茉莉',         'tea', JSON_ARRAY('中杯','大杯'), 14.00, '低', '少糖', '🌸', '茉莉花茶+鲜奶'),
(@yeye_id, '桂花酒酿',         'tea', JSON_ARRAY('中杯','大杯'), 15.00, '低', '标准', '🌾', '桂花+酒酿+鲜奶'),
(@yeye_id, '武夷岩茶',         'tea', JSON_ARRAY('中杯','大杯'), 16.00, '中', '无糖', '🍂', '武夷岩茶纯茶，岩骨花香');

-- ============================================================
-- 瑞幸咖啡（8款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@luckin_id, '生椰拿铁',        'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '少糖', '🥥', '椰乳+浓缩咖啡，现象级爆款'),
(@luckin_id, '酱香拿铁',        'coffee', JSON_ARRAY('中杯','大杯'), 19.00, '高', '标准', '🍶', '茅台酒风味厚奶+咖啡'),
(@luckin_id, '丝绒拿铁',        'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '标准', '☕', '北海道丝绒风味厚奶+咖啡'),
(@luckin_id, '陨石拿铁',        'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '半糖', '🌑', '黑糖+寒天晶球+拿铁'),
(@luckin_id, '橙C美式',         'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '少糖', '🍊', 'NFC橙汁+美式咖啡'),
(@luckin_id, '椰青冰萃美式',      'coffee', JSON_ARRAY('中杯','大杯'), 14.00, '高', '无糖', '🥥', '椰青水+美式，清爽提神'),
(@luckin_id, '茉莉花香拿铁',      'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '少糖', '🌸', '茉莉花茶风味+拿铁'),
(@luckin_id, '标准美式',        'coffee', JSON_ARRAY('中杯','大杯'), 11.00, '高', '无糖', '☕', '经典美式咖啡');

-- ============================================================
-- 星巴克（8款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@starbucks_id, '拿铁',              'coffee', JSON_ARRAY('中杯','大杯','超大杯'), 29.00, '高', '标准', '☕', '经典浓缩咖啡+蒸牛奶'),
(@starbucks_id, '美式咖啡',           'coffee', JSON_ARRAY('中杯','大杯','超大杯'), 25.00, '高', '无糖', '☕', '经典美式黑咖啡'),
(@starbucks_id, '焦糖玛奇朵',          'coffee', JSON_ARRAY('中杯','大杯','超大杯'), 32.00, '高', '标准', '🍮', '浓缩+牛奶+焦糖酱+香草糖浆'),
(@starbucks_id, '星冰乐-抹茶',         'coffee', JSON_ARRAY('中杯','大杯','超大杯'), 33.00, '低', '标准', '🍵', '抹茶星冰乐，夏日经典'),
(@starbucks_id, '星冰乐-摩卡',         'coffee', JSON_ARRAY('中杯','大杯','超大杯'), 33.00, '中', '标准', '🍫', '摩卡星冰乐+奶油顶'),
(@starbucks_id, '冰摇桃桃乌龙茶',        'tea',    JSON_ARRAY('中杯','大杯','超大杯'), 29.00, '低', '标准', '🍑', '桃汁+乌龙茶+桃果肉'),
(@starbucks_id, '红茶拿铁',            'tea',    JSON_ARRAY('中杯','大杯','超大杯'), 29.00, '中', '标准', '🧋', '红茶+蒸牛奶'),
(@starbucks_id, '冷萃冰咖啡',          'coffee', JSON_ARRAY('中杯','大杯'),        28.00, '高', '无糖', '🧊', '冷萃工艺，顺滑醇厚');

-- ============================================================
-- 库迪咖啡（7款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@cotti_id, '生椰拿铁',         'coffee', JSON_ARRAY('中杯','大杯'), 11.00, '高', '少糖', '🥥', '椰乳+浓缩咖啡'),
(@cotti_id, '潘帕斯蓝生酪茉莉拿铁', 'coffee', JSON_ARRAY('中杯','大杯'), 13.00, '高', '少糖', '💙', '蓝藻蛋白+生酪+茉莉茶+咖啡'),
(@cotti_id, '生酪拿铁',         'coffee', JSON_ARRAY('中杯','大杯'), 12.00, '高', '标准', '🧀', '生酪厚奶+咖啡'),
(@cotti_id, '柚见美式',         'coffee', JSON_ARRAY('中杯','大杯'), 10.00, '高', '少糖', '🍊', '柚子果汁+美式咖啡'),
(@cotti_id, '星辰厚乳拿铁',       'coffee', JSON_ARRAY('中杯','大杯'), 12.00, '高', '标准', '✨', '黑糖+厚乳+拿铁'),
(@cotti_id, '美式咖啡',         'coffee', JSON_ARRAY('中杯','大杯'), 8.00,  '高', '无糖', '☕', '经典美式'),
(@cotti_id, '蜜瓜拿铁',         'coffee', JSON_ARRAY('中杯','大杯'), 12.00, '高', '标准', '🍈', '蜜瓜风味+拿铁');

-- ============================================================
-- Manner（6款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@manner_id, '拿铁',           'coffee', JSON_ARRAY('小杯','大杯'), 15.00, '高', '标准', '☕', '经典拿铁，自带杯减5元'),
(@manner_id, '澳白',           'coffee', JSON_ARRAY('小杯','大杯'), 15.00, '高', '标准', '🥛', 'Flat White，丝滑浓郁'),
(@manner_id, '冰橘皮拿铁',      'coffee', JSON_ARRAY('大杯'),        20.00, '高', '少糖', '🍊', '橘皮糖浆+拿铁，清新果咖'),
(@manner_id, '桂花拿铁',        'coffee', JSON_ARRAY('大杯'),        20.00, '高', '少糖', '🌾', '桂花风味+拿铁'),
(@manner_id, '美式咖啡',        'coffee', JSON_ARRAY('小杯','大杯'), 10.00, '高', '无糖', '☕', '经典美式'),
(@manner_id, 'Dirty',         'coffee', JSON_ARRAY('小杯'),        15.00, '高', '标准', '🥛', '浓缩咖啡+冰牛奶，脏咖啡');

-- ============================================================
-- Costa（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@costa_id, '丝慕白',          'coffee', JSON_ARRAY('中杯','大杯'), 29.00, '高', '标准', '🥛', 'Flat White，丝滑口感'),
(@costa_id, '经典拿铁',         'coffee', JSON_ARRAY('中杯','大杯'), 28.00, '高', '标准', '☕', '经典意式拿铁'),
(@costa_id, '美式咖啡',         'coffee', JSON_ARRAY('中杯','大杯'), 25.00, '高', '无糖', '☕', '经典美式黑咖啡'),
(@costa_id, '摩卡',           'coffee', JSON_ARRAY('中杯','大杯'), 30.00, '中', '标准', '🍫', '巧克力+浓缩咖啡+牛奶'),
(@costa_id, '冰焦糖拿铁',       'coffee', JSON_ARRAY('中杯','大杯'), 31.00, '高', '标准', '🍮', '焦糖风味冰拿铁');

-- ============================================================
-- Tims天好咖啡（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@tims_id, '鲜萃咖啡',         'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '无糖', '☕', '鲜萃滴滤咖啡，加拿大经典'),
(@tims_id, '拿铁',            'coffee', JSON_ARRAY('中杯','大杯'), 20.00, '高', '标准', '☕', '经典拿铁'),
(@tims_id, 'Double Double',  'coffee', JSON_ARRAY('中杯','大杯'), 18.00, '高', '标准', '🍬', '双糖双奶，加拿大国民喝法'),
(@tims_id, '生椰冷萃',         'coffee', JSON_ARRAY('中杯','大杯'), 22.00, '高', '少糖', '🥥', '椰乳+冷萃咖啡'),
(@tims_id, '抹茶拿铁',         'tea',    JSON_ARRAY('中杯','大杯'), 21.00, '低', '标准', '🍵', '抹茶+牛奶');

-- ============================================================
-- McCafe（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@mccafe_id, '拿铁',           'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '标准', '☕', 'McCafe经典拿铁'),
(@mccafe_id, '美式',           'coffee', JSON_ARRAY('中杯','大杯'), 12.00, '高', '无糖', '☕', 'McCafe美式咖啡'),
(@mccafe_id, '卡布奇诺',        'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '标准', '☕', '意式卡布奇诺'),
(@mccafe_id, '冰摩卡',         'coffee', JSON_ARRAY('中杯','大杯'), 17.00, '中', '标准', '🍫', '巧克力+咖啡+奶油'),
(@mccafe_id, '特浓奶香拿铁',     'coffee', JSON_ARRAY('中杯','大杯'), 16.00, '高', '标准', '🥛', '加倍浓缩+浓郁牛奶');

-- ============================================================
-- Peet's Coffee（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@peets_id, '澳洲小白',         'coffee', JSON_ARRAY('中杯','大杯'), 28.00, '高', '标准', '🥛', 'Flat White，皮爷经典'),
(@peets_id, '拿铁',            'coffee', JSON_ARRAY('中杯','大杯'), 27.00, '高', '标准', '☕', '经典拿铁，深烘咖啡豆'),
(@peets_id, '美式咖啡',         'coffee', JSON_ARRAY('中杯','大杯'), 24.00, '高', '无糖', '☕', '经典美式'),
(@peets_id, '摘星拿铁',         'coffee', JSON_ARRAY('中杯','大杯'), 30.00, '高', '少糖', '✨', '橙皮+拿铁，皮爷特调'),
(@peets_id, '抹茶拿铁',         'tea',    JSON_ARRAY('中杯','大杯'), 28.00, '低', '标准', '🍵', '日式抹茶+牛奶');

-- ============================================================
-- Nowwa挪瓦咖啡（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@nowwa_id, '生椰拿铁',         'coffee', JSON_ARRAY('中杯','大杯'), 14.00, '高', '少糖', '🥥', '椰乳+浓缩咖啡'),
(@nowwa_id, '半熟芝士拿铁',      'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '标准', '🧀', '芝士风味厚奶+拿铁'),
(@nowwa_id, '美式咖啡',         'coffee', JSON_ARRAY('中杯','大杯'), 10.00, '高', '无糖', '☕', '经典美式'),
(@nowwa_id, '草莓拿铁',         'coffee', JSON_ARRAY('中杯','大杯'), 15.00, '高', '标准', '🍓', '草莓风味+拿铁'),
(@nowwa_id, '柠檬美式',         'coffee', JSON_ARRAY('中杯','大杯'), 12.00, '高', '少糖', '🍋', '柠檬+美式咖啡');

-- ============================================================
-- 可口可乐（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@cocacola_id, '可口可乐（经典）',    'drink', JSON_ARRAY('罐装','瓶装','大瓶'), 3.00, '中', '标准', '🥤', '经典可口可乐'),
(@cocacola_id, '零度可口可乐',       'drink', JSON_ARRAY('罐装','瓶装','大瓶'), 3.00, '中', '无糖', '🥤', '零糖零卡可口可乐'),
(@cocacola_id, '雪碧',            'drink', JSON_ARRAY('罐装','瓶装','大瓶'), 3.00, '无', '标准', '🍋', '柠檬味汽水'),
(@cocacola_id, '芬达（橙味）',       'drink', JSON_ARRAY('罐装','瓶装','大瓶'), 3.00, '无', '标准', '🍊', '橙味汽水'),
(@cocacola_id, '美汁源果粒橙',       'drink', JSON_ARRAY('瓶装','大瓶'),        3.50, '无', '标准', '🍊', '含果粒橙汁饮料');

-- ============================================================
-- 百事可乐（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@pepsi_id, '百事可乐（经典）',     'drink', JSON_ARRAY('罐装','瓶装','大瓶'), 3.00, '中', '标准', '🥤', '经典百事可乐'),
(@pepsi_id, '百事无糖',          'drink', JSON_ARRAY('罐装','瓶装','大瓶'), 3.00, '中', '无糖', '🥤', '无糖百事可乐'),
(@pepsi_id, '美年达（橙味）',      'drink', JSON_ARRAY('罐装','瓶装','大瓶'), 3.00, '无', '标准', '🍊', '橙味汽水'),
(@pepsi_id, '七喜',            'drink', JSON_ARRAY('罐装','瓶装','大瓶'), 3.00, '无', '标准', '🍋', '柠檬味汽水'),
(@pepsi_id, '佳得乐（蓝莓味）',     'drink', JSON_ARRAY('瓶装'),              5.00, '无', '标准', '💧', '运动功能饮料');

-- ============================================================
-- 元气森林（6款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@yuanqi_id, '白桃味苏打气泡水',    'drink', JSON_ARRAY('罐装','瓶装'), 5.00, '无', '无糖', '🍑', '0糖0脂0卡，白桃味'),
(@yuanqi_id, '葡萄味苏打气泡水',    'drink', JSON_ARRAY('罐装','瓶装'), 5.00, '无', '无糖', '🍇', '0糖0脂0卡，葡萄味'),
(@yuanqi_id, '卡曼橘味苏打气泡水',   'drink', JSON_ARRAY('罐装','瓶装'), 5.00, '无', '无糖', '🍊', '0糖0脂0卡，卡曼橘味'),
(@yuanqi_id, '燃茶（桃香乌龙）',     'drink', JSON_ARRAY('瓶装'),        6.00, '中', '无糖', '🍑', '无糖乌龙茶饮料，桃香风味'),
(@yuanqi_id, '电解质水（海盐柚子）',   'drink', JSON_ARRAY('瓶装'),        6.00, '无', '无糖', '💧', '电解质饮料，快速补水'),
(@yuanqi_id, '冰茶（柠檬味）',      'drink', JSON_ARRAY('瓶装'),        5.00, '低', '低糖', '🍋', '低糖冰茶饮料');

-- ============================================================
-- 东方树叶（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@dongfang_id, '茉莉花茶',        'drink', JSON_ARRAY('瓶装'), 4.00, '低', '无糖', '🌸', '0卡茉莉花茶'),
(@dongfang_id, '乌龙茶',         'drink', JSON_ARRAY('瓶装'), 4.00, '低', '无糖', '🍂', '0卡乌龙茶'),
(@dongfang_id, '绿茶',          'drink', JSON_ARRAY('瓶装'), 4.00, '低', '无糖', '🍃', '0卡绿茶'),
(@dongfang_id, '红茶',          'drink', JSON_ARRAY('瓶装'), 4.00, '低', '无糖', '🫖', '0卡红茶'),
(@dongfang_id, '青柑普洱',       'drink', JSON_ARRAY('瓶装'), 5.00, '低', '无糖', '🍊', '0卡青柑普洱茶');

-- ============================================================
-- 农夫山泉（4款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@nongfu_id, '农夫山泉饮用天然水',   'drink', JSON_ARRAY('瓶装','大瓶'), 2.00, '无', '无糖', '💧', '天然矿泉水'),
(@nongfu_id, '水溶C100（柠檬）',    'drink', JSON_ARRAY('瓶装'),        4.50, '无', '标准', '🍋', '维生素C柠檬饮料'),
(@nongfu_id, '茶π（蜜桃乌龙）',     'drink', JSON_ARRAY('瓶装'),        5.00, '低', '低糖', '🍑', '果味茶饮料，蜜桃乌龙'),
(@nongfu_id, '尖叫（运动饮料）',     'drink', JSON_ARRAY('瓶装'),        5.00, '无', '标准', '⚡', '运动功能饮料');

-- ============================================================
-- 康师傅（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@kangshifu_id, '冰红茶',         'drink', JSON_ARRAY('瓶装','大瓶'), 3.50, '低', '标准', '🧊', '经典冰红茶'),
(@kangshifu_id, '冰绿茶',         'drink', JSON_ARRAY('瓶装','大瓶'), 3.50, '低', '标准', '🍵', '经典冰绿茶'),
(@kangshifu_id, '茉莉蜜茶',        'drink', JSON_ARRAY('瓶装','大瓶'), 3.50, '低', '标准', '🌸', '茉莉花蜜茶'),
(@kangshifu_id, '冰糖雪梨',        'drink', JSON_ARRAY('瓶装'),        3.50, '无', '标准', '🍐', '冰糖雪梨饮料'),
(@kangshifu_id, '酸梅汤',         'drink', JSON_ARRAY('瓶装'),        3.50, '无', '标准', '🫐', '传统酸梅汤风味');

-- ============================================================
-- 统一（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@tongyi_id, '冰红茶',           'drink', JSON_ARRAY('瓶装','大瓶'), 3.50, '低', '标准', '🧊', '统一冰红茶'),
(@tongyi_id, '绿茶',            'drink', JSON_ARRAY('瓶装','大瓶'), 3.50, '低', '标准', '🍵', '统一绿茶'),
(@tongyi_id, '阿萨姆奶茶',        'drink', JSON_ARRAY('瓶装','大瓶'), 4.50, '低', '标准', '🧋', '阿萨姆红茶+牛奶'),
(@tongyi_id, '小茗同学',         'drink', JSON_ARRAY('瓶装'),        5.00, '低', '低糖', '🧊', '冷泡茶饮料'),
(@tongyi_id, '海之言（柠檬味）',    'drink', JSON_ARRAY('瓶装'),        4.50, '无', '标准', '🍋', '海盐柠檬饮料');

-- ============================================================
-- 王老吉（4款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@wanglaoji_id, '王老吉凉茶（红罐）',  'drink', JSON_ARRAY('罐装','瓶装'), 4.00, '无', '标准', '🫙', '怕上火喝王老吉，经典红罐'),
(@wanglaoji_id, '王老吉凉茶（绿盒）',  'drink', JSON_ARRAY('盒装'),        3.00, '无', '标准', '🫙', '经典绿盒装'),
(@wanglaoji_id, '王老吉无糖凉茶',     'drink', JSON_ARRAY('罐装'),        4.00, '无', '无糖', '🫙', '无糖版凉茶'),
(@wanglaoji_id, '刺柠吉',          'drink', JSON_ARRAY('罐装'),        5.00, '无', '标准', '🍋', '刺梨+柠檬，高维C饮料');

-- ============================================================
-- 红牛（4款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@redbull_id, '红牛维生素功能饮料',   'drink', JSON_ARRAY('罐装'), 6.00, '高', '标准', '⚡', '经典金罐红牛，提神抗疲劳'),
(@redbull_id, '红牛维生素风味饮料',   'drink', JSON_ARRAY('罐装'), 6.00, '高', '标准', '⚡', '蓝罐红牛'),
(@redbull_id, '红牛加强型',        'drink', JSON_ARRAY('罐装'), 7.00, '高', '标准', '⚡', '牛磺酸加强版'),
(@redbull_id, '红牛0糖',          'drink', JSON_ARRAY('罐装'), 6.00, '高', '无糖', '⚡', '0糖版红牛');

-- ============================================================
-- 维他（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@weita_id, '维他柠檬茶',         'drink', JSON_ARRAY('盒装','瓶装'), 3.50, '中', '标准', '🍋', '维他柠檬茶，够真才出涩'),
(@weita_id, '维他原味豆奶',       'drink', JSON_ARRAY('盒装','瓶装'), 3.00, '无', '标准', '🥛', '经典豆奶饮料'),
(@weita_id, '维他菊花茶',         'drink', JSON_ARRAY('盒装','瓶装'), 3.50, '无', '低糖', '🌼', '菊花茶饮料'),
(@weita_id, '维他港式奶茶',       'drink', JSON_ARRAY('盒装','瓶装'), 4.00, '中', '标准', '🧋', '港式奶茶风味'),
(@weita_id, '维他锡兰柠檬茶',      'drink', JSON_ARRAY('盒装','瓶装'), 4.00, '中', '标准', '🍋', '锡兰红茶+柠檬');

-- ============================================================
-- 校园饮品店（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@campus_id, '校园奶茶',         'tea',    JSON_ARRAY('中杯','大杯'), 8.00,  '中', '标准', '🧋', '校园饮品店经典奶茶'),
(@campus_id, '校园果茶',         'tea',    JSON_ARRAY('中杯','大杯'), 8.00,  '低', '半糖', '🍊', '校园饮品店水果茶'),
(@campus_id, '校园柠檬水',       'tea',    JSON_ARRAY('中杯','大杯'), 5.00,  '无', '标准', '🍋', '校园饮品店柠檬水'),
(@campus_id, '校园咖啡',         'coffee', JSON_ARRAY('中杯','大杯'), 10.00, '高', '标准', '☕', '校园饮品店咖啡'),
(@campus_id, '校园奶昔',         'tea',    JSON_ARRAY('中杯','大杯'), 10.00, '无', '标准', '🥛', '校园饮品店奶昔');

-- ============================================================
-- 食堂饮品（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@canteen_id, '食堂豆浆',        'drink', JSON_ARRAY('杯装'), 2.00, '无', '低糖', '🥛', '食堂现磨豆浆'),
(@canteen_id, '食堂绿豆汤',       'drink', JSON_ARRAY('碗装','杯装'), 2.00, '无', '低糖', '🫘', '食堂绿豆汤，消暑解渴'),
(@canteen_id, '食堂酸梅汤',       'drink', JSON_ARRAY('杯装'),        2.00, '无', '标准', '🫐', '食堂自制酸梅汤'),
(@canteen_id, '食堂紫菜蛋花汤',    'other', JSON_ARRAY('碗装'),        1.00, '无', '低盐', '🍲', '食堂免费汤品'),
(@canteen_id, '食堂银耳汤',       'drink', JSON_ARRAY('碗装','杯装'), 3.00, '无', '低糖', '🥣', '食堂银耳汤，清甜滋润');

-- ============================================================
-- 小卖部饮品（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@shop_id, '小卖部矿泉水',       'drink', JSON_ARRAY('瓶装'), 1.50, '无', '无糖', '💧', '普通矿泉水'),
(@shop_id, '小卖部冰红茶',       'drink', JSON_ARRAY('瓶装'), 3.00, '低', '标准', '🧊', '小卖部冰红茶'),
(@shop_id, '小卖部AD钙奶',       'drink', JSON_ARRAY('瓶装'), 2.00, '无', '标准', '🥛', 'AD钙奶'),
(@shop_id, '小卖部营养快线',      'drink', JSON_ARRAY('瓶装'), 4.00, '无', '标准', '🥛', '营养快线'),
(@shop_id, '小卖部旺仔牛奶',      'drink', JSON_ARRAY('罐装'), 4.00, '无', '标准', '🥛', '旺仔牛奶');

-- ============================================================
-- 自制饮品（5款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@homemade_id, '自制手冲咖啡',     'coffee', JSON_ARRAY('杯装'),        0.00, '高', '无糖', '☕', '自己手冲的咖啡'),
(@homemade_id, '自制奶茶',        'tea',    JSON_ARRAY('杯装'),        0.00, '中', '少糖', '🧋', '自己做的奶茶'),
(@homemade_id, '自制柠檬水',       'drink',  JSON_ARRAY('杯装'),        0.00, '无', '少糖', '🍋', '柠檬+水+蜂蜜'),
(@homemade_id, '自制水果茶',       'tea',    JSON_ARRAY('杯装'),        0.00, '无', '少糖', '🍉', '自己切的水果泡茶'),
(@homemade_id, '自制奶昔',        'drink',  JSON_ARRAY('杯装'),        0.00, '无', '标准', '🥛', '水果+牛奶+搅拌机');

-- ============================================================
-- 其他（4款）
-- ============================================================
INSERT IGNORE INTO drinks (brand_id, name, category, sizes, base_price, caffeine, sugar, icon, description) VALUES
(@other_id, '其他奶茶',          'tea',    JSON_ARRAY('中杯','大杯'), 10.00, '中', '标准', '🧋', '其他品牌/店铺奶茶'),
(@other_id, '其他咖啡',          'coffee', JSON_ARRAY('中杯','大杯'), 12.00, '高', '标准', '☕', '其他品牌/店铺咖啡'),
(@other_id, '其他果茶',          'tea',    JSON_ARRAY('中杯','大杯'), 10.00, '低', '标准', '🍊', '其他品牌/店铺果茶'),
(@other_id, '其他饮品',          'other',  JSON_ARRAY('中杯','大杯'), 8.00,  '无', '标准', '🥤', '未归类的其他饮品');
