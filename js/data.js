// ===== 数据层 =====

// 饮品菜单
const drinkMenu = [
    { id: 1, name: '美式咖啡', category: 'coffee', basePrice: 15 },
    { id: 2, name: '拿铁', category: 'coffee', basePrice: 18 },
    { id: 3, name: '卡布奇诺', category: 'coffee', basePrice: 20 },
    { id: 4, name: '摩卡', category: 'coffee', basePrice: 22 },
    { id: 5, name: '冷萃咖啡', category: 'coffee', basePrice: 25 },
    { id: 6, name: '珍珠奶茶', category: 'milk_tea', basePrice: 16 },
    { id: 7, name: '椰果奶茶', category: 'milk_tea', basePrice: 16 },
    { id: 8, name: '红豆奶茶', category: 'milk_tea', basePrice: 17 },
    { id: 9, name: '芋泥波波', category: 'milk_tea', basePrice: 20 },
    { id: 10, name: '四季春茶', category: 'tea', basePrice: 12 },
    { id: 11, name: '乌龙茶', category: 'tea', basePrice: 12 },
    { id: 12, name: '茉莉花茶', category: 'tea', basePrice: 10 },
    { id: 13, name: '柠檬绿茶', category: 'tea', basePrice: 13 },
    { id: 14, name: '鲜榨橙汁', category: 'juice', basePrice: 18 },
    { id: 15, name: '西瓜汁', category: 'juice', basePrice: 15 },
    { id: 16, name: '芒果汁', category: 'juice', basePrice: 18 },
    { id: 17, name: '可乐', category: 'soda', basePrice: 5 },
    { id: 18, name: '雪碧', category: 'soda', basePrice: 5 },
    { id: 19, name: '气泡水', category: 'soda', basePrice: 8 },
    { id: 20, name: '抹茶拿铁', category: 'other', basePrice: 22 },
];

// 分类映射
const categoryMap = {
    coffee: { label: '咖啡', icon: 'fa-coffee', color: '#6B4226' },
    tea: { label: '茶饮', icon: 'fa-leaf', color: '#5B8C5A' },
    milk_tea: { label: '奶茶', icon: 'fa-mug-saucer', color: '#C06030' },
    juice: { label: '果汁', icon: 'fa-glass-water', color: '#E8953A' },
    soda: { label: '汽水', icon: 'fa-wine-bottle', color: '#5B7B8C' },
    other: { label: '其他', icon: 'fa-ellipsis', color: '#8B7355' },
};

// 预设用户模板（用于创建新用户时的种子数据）
const userTemplates = [
    {
        name: '雷霆小子',
        className: '高三(1)班',
        studentId: '2024001',
        joinDate: '2024-09-01',
        avatar: 'assets/avatar.jpg',
        seedRecords: [
            { id: 1, drinkId: 2, drinkName: '拿铁', category: 'coffee', size: 'medium', price: 18, rating: 4, note: '早上来一杯，提神醒脑', date: '2026-07-07', time: '08:30' },
            { id: 2, drinkId: 6, drinkName: '珍珠奶茶', category: 'milk_tea', size: 'large', price: 16, rating: 5, note: '下午茶时间，珍珠很Q弹', date: '2026-07-06', time: '15:20' },
            { id: 3, drinkId: 5, drinkName: '冷萃咖啡', category: 'coffee', size: 'medium', price: 25, rating: 4, note: '夏天的感觉', date: '2026-07-06', time: '10:00' },
            { id: 4, drinkId: 11, drinkName: '乌龙茶', category: 'tea', size: 'large', price: 12, rating: 3, note: '解腻不错', date: '2026-07-05', time: '12:30' },
            { id: 5, drinkId: 7, drinkName: '椰果奶茶', category: 'milk_tea', size: 'medium', price: 16, rating: 4, note: '椰果很多', date: '2026-07-05', time: '14:00' },
            { id: 6, drinkId: 1, drinkName: '美式咖啡', category: 'coffee', size: 'large', price: 15, rating: 3, note: '有点苦，下次加糖', date: '2026-07-04', time: '08:00' },
            { id: 7, drinkId: 14, drinkName: '鲜榨橙汁', category: 'juice', size: 'medium', price: 18, rating: 5, note: '新鲜好喝', date: '2026-07-04', time: '11:00' },
            { id: 8, drinkId: 9, drinkName: '芋泥波波', category: 'milk_tea', size: 'large', price: 20, rating: 5, note: '芋泥超赞！', date: '2026-07-03', time: '16:00' },
        ]
    },
    {
        name: '奶茶爱好者',
        className: '高二(3)班',
        studentId: '2024002',
        joinDate: '2024-09-01',
        avatar: '',
        seedRecords: [
            { id: 1, drinkId: 6, drinkName: '珍珠奶茶', category: 'milk_tea', size: 'large', price: 16, rating: 5, note: '珍珠奶茶yyds！', date: '2026-07-07', time: '14:00' },
            { id: 2, drinkId: 9, drinkName: '芋泥波波', category: 'milk_tea', size: 'large', price: 20, rating: 5, note: '芋泥超细腻', date: '2026-07-07', time: '16:30' },
            { id: 3, drinkId: 7, drinkName: '椰果奶茶', category: 'milk_tea', size: 'medium', price: 16, rating: 4, note: '椰果很多很满足', date: '2026-07-06', time: '13:00' },
            { id: 4, drinkId: 8, drinkName: '红豆奶茶', category: 'milk_tea', size: 'medium', price: 17, rating: 4, note: '红豆软糯', date: '2026-07-06', time: '16:00' },
            { id: 5, drinkId: 6, drinkName: '珍珠奶茶', category: 'milk_tea', size: 'large', price: 16, rating: 5, note: '又来一杯', date: '2026-07-05', time: '15:00' },
            { id: 6, drinkId: 9, drinkName: '芋泥波波', category: 'milk_tea', size: 'large', price: 20, rating: 5, note: '每周必点', date: '2026-07-04', time: '14:30' },
        ]
    },
    {
        name: '咖啡达人',
        className: '高三(5)班',
        studentId: '2024003',
        joinDate: '2024-09-01',
        avatar: '',
        seedRecords: [
            { id: 1, drinkId: 1, drinkName: '美式咖啡', category: 'coffee', size: 'large', price: 15, rating: 4, note: '每天一杯美式', date: '2026-07-07', time: '07:30' },
            { id: 2, drinkId: 2, drinkName: '拿铁', category: 'coffee', size: 'medium', price: 18, rating: 5, note: '拉花很漂亮', date: '2026-07-07', time: '10:00' },
            { id: 3, drinkId: 5, drinkName: '冷萃咖啡', category: 'coffee', size: 'medium', price: 25, rating: 4, note: '夏天喝冷萃正好', date: '2026-07-06', time: '08:00' },
            { id: 4, drinkId: 3, drinkName: '卡布奇诺', category: 'coffee', size: 'medium', price: 20, rating: 4, note: '奶泡很绵密', date: '2026-07-05', time: '09:00' },
            { id: 5, drinkId: 4, drinkName: '摩卡', category: 'coffee', size: 'medium', price: 22, rating: 5, note: '巧克力味很浓', date: '2026-07-05', time: '11:00' },
        ]
    },
    {
        name: '养生茶客',
        className: '高二(7)班',
        studentId: '2024004',
        joinDate: '2024-09-01',
        avatar: '',
        seedRecords: [
            { id: 1, drinkId: 11, drinkName: '乌龙茶', category: 'tea', size: 'large', price: 12, rating: 4, note: '饭后解腻', date: '2026-07-07', time: '12:30' },
            { id: 2, drinkId: 12, drinkName: '茉莉花茶', category: 'tea', size: 'medium', price: 10, rating: 5, note: '花香四溢', date: '2026-07-07', time: '16:00' },
            { id: 3, drinkId: 10, drinkName: '四季春茶', category: 'tea', size: 'large', price: 12, rating: 4, note: '清香回甘', date: '2026-07-06', time: '14:00' },
            { id: 4, drinkId: 13, drinkName: '柠檬绿茶', category: 'tea', size: 'medium', price: 13, rating: 4, note: '清爽解渴', date: '2026-07-05', time: '11:00' },
            { id: 5, drinkId: 11, drinkName: '乌龙茶', category: 'tea', size: 'large', price: 12, rating: 5, note: '今天也是乌龙', date: '2026-07-04', time: '13:00' },
        ]
    },
];

// 成就定义（静态）
const achievementDefs = [
    { id: 1, name: '首次记录', icon: 'fa-mug-hot', desc: '完成第一次饮品记录', condition: (stats) => stats.totalCups >= 1 },
    { id: 2, name: '咖啡爱好者', icon: 'fa-coffee', desc: '记录10杯咖啡', condition: (stats) => stats.categoryCounts.coffee >= 10 },
    { id: 3, name: '奶茶控', icon: 'fa-mug-saucer', desc: '记录20杯奶茶', condition: (stats) => stats.categoryCounts.milk_tea >= 20 },
    { id: 4, name: '连续7天', icon: 'fa-calendar-check', desc: '连续7天记录饮品', condition: (stats) => stats.streak >= 7 },
    { id: 5, name: '百杯达成', icon: 'fa-trophy', desc: '累计记录100杯', condition: (stats) => stats.totalCups >= 100 },
    { id: 6, name: '品鉴大师', icon: 'fa-star', desc: '累计评分50次', condition: (stats) => stats.totalCups >= 50 },
    { id: 7, name: '社交达人', icon: 'fa-comments', desc: '发布30条评论', condition: () => false },
    { id: 8, name: '千杯不醉', icon: 'fa-crown', desc: '累计记录1000杯', condition: (stats) => stats.totalCups >= 1000 },
];

// 等级定义（旧版，基于杯数，保留兼容）
const levelDefs = [
    { level: 1,  title: '新手入门', cupsNeeded: 0 },
    { level: 2,  title: '初尝饮品', cupsNeeded: 5 },
    { level: 3,  title: '饮品学徒', cupsNeeded: 15 },
    { level: 4,  title: '饮品爱好者', cupsNeeded: 30 },
    { level: 5,  title: '品鉴新手', cupsNeeded: 50 },
    { level: 6,  title: '饮品猎人', cupsNeeded: 75 },
    { level: 7,  title: '饮品达人', cupsNeeded: 100 },
    { level: 8,  title: '品鉴师', cupsNeeded: 150 },
    { level: 9,  title: '饮品专家', cupsNeeded: 200 },
    { level: 10, title: '饮品大师', cupsNeeded: 300 },
    { level: 11, title: '饮品宗师', cupsNeeded: 400 },
    { level: 12, title: '饮品传奇', cupsNeeded: 500 },
    { level: 13, title: '雷霆至尊', cupsNeeded: 700 },
    { level: 14, title: '饮品之神', cupsNeeded: 1000 },
];

// XP系统：等级定义（基于累计经验 totalXp）
const xpLevelDefs = [
    { level: 1,  title: '饮品新人',   xpNeeded: 0 },
    { level: 2,  title: '饮品新人',   xpNeeded: 30 },
    { level: 3,  title: '校园探店员', xpNeeded: 80 },
    { level: 4,  title: '校园探店员', xpNeeded: 150 },
    { level: 5,  title: '风味探索家', xpNeeded: 250 },
    { level: 6,  title: '风味探索家', xpNeeded: 380 },
    { level: 7,  title: '风味探索家', xpNeeded: 540 },
    { level: 8,  title: '风味探索家', xpNeeded: 730 },
    { level: 9,  title: '风味探索家', xpNeeded: 950 },
    { level: 10, title: '饮品达人',   xpNeeded: 1200 },
    { level: 11, title: '饮品达人',   xpNeeded: 1500 },
    { level: 12, title: '饮品达人',   xpNeeded: 1850 },
    { level: 13, title: '饮品达人',   xpNeeded: 2250 },
    { level: 14, title: '饮品达人',   xpNeeded: 2700 },
    { level: 15, title: '饮品达人',   xpNeeded: 3200 },
    { level: 16, title: '饮品达人',   xpNeeded: 3750 },
    { level: 17, title: '饮品达人',   xpNeeded: 4350 },
    { level: 18, title: '饮品达人',   xpNeeded: 5000 },
    { level: 19, title: '饮品达人',   xpNeeded: 5700 },
    { level: 20, title: '爆杯大师',   xpNeeded: 6500 },
];

// 其他用户初始记录数（用于排行榜其他用户）
const otherUsers = [
    { name: '奶茶公主', className: '高二(1)班', baseCups: 523 },
    { name: '咖啡王子', className: '高三(2)班', baseCups: 487 },
    { name: '饮霸天下', className: '高三(5)班', baseCups: 421 },
    { name: '果汁达人', className: '高一(3)班', baseCups: 238 },
    { name: '茶韵飘香', className: '高二(4)班', baseCups: 215 },
    { name: '气泡少女', className: '高一(6)班', baseCups: 198 },
    { name: '奶茶弟弟', className: '高二(8)班', baseCups: 176 },
    { name: '拿铁控', className: '高三(1)班', baseCups: 154 },
    { name: '冰美式', className: '高一(5)班', baseCups: 132 },
];

// 社区帖子数据
const seedPosts = [
    {
        id: 1,
        user: { name: '奶茶公主', className: '高二(1)班' },
        drinkName: '珍珠奶茶', category: 'milk_tea', rating: 5,
        content: '今天试了新开的奶茶店，珍珠超级Q弹，奶味浓郁，强烈推荐！店在二食堂旁边，叫"茶言茶语"',
        likes: 42, comments: 8, time: '2小时前', liked: false,
    },
    {
        id: 2,
        user: { name: '咖啡王子', className: '高三(2)班' },
        drinkName: '冷萃咖啡', category: 'coffee', rating: 4,
        content: '图书馆一楼的咖啡店新出了冷萃，口感很清爽，适合夏天。价格25，稍微有点贵但值得。',
        likes: 35, comments: 5, time: '3小时前', liked: true,
    },
    {
        id: 3,
        user: { name: '果汁达人', className: '高一(3)班' },
        drinkName: '鲜榨橙汁', category: 'juice', rating: 5,
        content: '校门口那家水果店的橙汁是现榨的！看得见的真材实料，18块一杯，比奶茶健康多了。',
        likes: 28, comments: 12, time: '5小时前', liked: false,
    },
    {
        id: 4,
        user: { name: '茶韵飘香', className: '高二(4)班' },
        drinkName: '四季春茶', category: 'tea', rating: 4,
        content: '三食堂的茶铺重新装修了，环境很好。四季春茶12元一杯，清雅回甘，很适合自习时喝。',
        likes: 19, comments: 3, time: '昨天', liked: false,
    },
    {
        id: 5,
        user: { name: '饮霸天下', className: '高三(5)班' },
        drinkName: '芋泥波波', category: 'milk_tea', rating: 5,
        content: '芋泥波波yyds！每次去都必点，这周已经喝了4杯了。芋泥超级细腻，波波也很有嚼劲。',
        likes: 56, comments: 15, time: '昨天', liked: true,
    },
];

// 图鉴收集成就称号
const collectionTitleDefs = [
    { count: 20, title: '图鉴大师' },
    { count: 16, title: '收集达人' },
    { count: 12, title: '探索专家' },
    { count: 8, title: '品鉴先锋' },
    { count: 4, title: '初涉饮品' },
    { count: 1, title: '饮品学徒' },
    { count: 0, title: '尚未开始' },
];

// 每日任务模板定义
const dailyTaskTemplates = [
    { id: 'login', name: '登录App', desc: '今日首次打开应用', icon: 'fa-right-to-bracket', xpReward: 5, category: 'daily' },
    { id: 'record', name: '记录一杯饮品', desc: '添加一条饮品记录', icon: 'fa-mug-hot', xpReward: 10, category: 'action' },
    { id: 'discover', name: '解锁新饮品', desc: '发现一款从未喝过的饮品', icon: 'fa-compass', xpReward: 20, category: 'explore' },
    { id: 'rate', name: '给饮品评分', desc: '为饮品记录打分评价', icon: 'fa-star', xpReward: 5, category: 'action' },
];

// 兼容旧代码：userProfile 由 App.currentUser 动态提供
// 旧的 userProfile 引用将在 app.js 中通过 getter 动态返回
