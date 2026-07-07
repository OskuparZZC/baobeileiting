// ===== 应用主控制器 =====

const App = {
    currentPage: 'dashboard',
    records: [],
    nextRecordId: 0,
    posts: [],
    notificationCount: 3,
    // 用户系统
    currentUserId: null,
    users: {},
    // 兼容旧代码：动态获取当前用户信息
    get userProfile() {
        const u = this.getCurrentUser();
        if (!u) {
            // fallback
            return {
                id: 0, name: '访客', className: '', studentId: '', joinDate: '', avatar: '',
                registerDate: '', lastLoginDate: '', continuousDays: 0,
                level: 1, xp: 0, totalXp: 0,
            };
        }
        return {
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            studentId: u.studentId,
            className: u.className,
            joinDate: u.joinDate,
            registerDate: u.registerDate || u.joinDate || '',
            lastLoginDate: u.lastLoginDate || '',
            continuousDays: u.continuousDays || 1,
            level: u.level || 1,
            xp: u.xp || 0,
            totalXp: u.totalXp || 0,
        };
    },

    init() {
        // 1. 加载用户系统
        this.loadUsers();
        // 2. 确定当前用户
        this.resolveCurrentUser();
        // 3. 加载当前用户数据
        this.loadCurrentUserData();
        // 4. 同步通知徽标（必须在 loadCurrentUserData 之后）
        this.updateNotificationBadge();
        // 5. 初始化每日任务系统（必须在 checkLoginStreak 之前，否则登录任务无法被标记）
        this.initDailyTasks();
        // 6. 检查并更新登录打卡
        this.checkLoginStreak();

        // 7. 初始化UI
        this.bindNavigation();
        this.bindFAB();
        this.bindModal();
        this.bindToast();
        this.bindNotificationBtn();
        this.bindProfileBtn();
        this.navigateTo('dashboard');
        this.updateHeaderAvatar();
    },

    // ===== 用户系统：localStorage 持久化 =====

    loadUsers() {
        try {
            const saved = localStorage.getItem('baobei_users');
            if (saved) {
                this.users = JSON.parse(saved);
                // 迁移旧数据：将 department 转为 className，清理 studyGroup
                let needSave = false;
                Object.values(this.users).forEach(u => {
                    if (!u.className) {
                        u.className = u.department || '未知班级';
                        needSave = true;
                    }
                    // 移除 studyGroup 字段
                    if (u.studyGroup !== undefined) {
                        delete u.studyGroup;
                        needSave = true;
                    }
                    // 时间系统字段迁移
                    if (!u.registerDate) {
                        u.registerDate = u.joinDate || new Date().toISOString().split('T')[0];
                        needSave = true;
                    }
                    if (!u.lastLoginDate) {
                        u.lastLoginDate = new Date().toISOString().split('T')[0];
                        needSave = true;
                    }
                    if (u.continuousDays === undefined || u.continuousDays === null) {
                        u.continuousDays = 1;
                        needSave = true;
                    }
                    // XP系统字段迁移
                    if (u.level === undefined || u.level === null) {
                        u.level = 1;
                        needSave = true;
                    }
                    if (u.xp === undefined || u.xp === null) {
                        u.xp = 0;
                        needSave = true;
                    }
                    if (u.totalXp === undefined || u.totalXp === null) {
                        u.totalXp = 0;
                        needSave = true;
                    }
                    // 图鉴系统字段迁移
                    if (!u.collection || typeof u.collection !== 'object') {
                        u.collection = this._buildCollectionFromRecords(u.records || []);
                        needSave = true;
                    }
                    // 每日任务系统字段迁移
                    if (u.dailyTasks === undefined || u.dailyTasks === null) {
                        u.dailyTasks = null;
                        needSave = true;
                    }
                });
                if (needSave) this.saveUsers();
            }
        } catch (e) {
            console.warn('加载用户数据失败', e);
        }
        // 如果没有用户数据，用预设模板初始化
        if (!this.users || Object.keys(this.users).length === 0) {
            this.users = {};
            userTemplates.forEach((tmpl, idx) => {
                const uid = 'user_' + (idx + 1);
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                // 调整种子记录日期到最近7天
                const adjustedRecords = tmpl.seedRecords.map((r, ri) => {
                    const d = new Date(now);
                    d.setDate(d.getDate() - (tmpl.seedRecords.length - 1 - ri));
                    return { ...r, date: d.toISOString().split('T')[0] };
                });
                this.users[uid] = {
                    id: uid,
                    name: tmpl.name,
                    className: tmpl.className,
                    studentId: tmpl.studentId,
                    joinDate: tmpl.joinDate,
                    avatar: tmpl.avatar || '',
                    records: adjustedRecords,
                    nextRecordId: adjustedRecords.length + 1,
                    notificationCount: adjustedRecords.length > 0 ? Math.min(adjustedRecords.length, 5) : 0,
                    createdAt: new Date().toISOString(),
                    // 时间系统字段
                    registerDate: tmpl.joinDate,
                    lastLoginDate: todayStr,
                    continuousDays: adjustedRecords.length > 0 ? Math.min(adjustedRecords.length, 7) : 1,
                    // XP系统字段
                    level: 1,
                    xp: 0,
                    totalXp: 0,
                    // 图鉴系统字段
                    collection: this._buildCollectionFromRecords(adjustedRecords),
                };
            });
            this.saveUsers();
        }
    },

    saveUsers() {
        try {
            localStorage.setItem('baobei_users', JSON.stringify(this.users));
        } catch (e) {
            console.warn('保存用户数据失败', e);
            App.showToast('存储空间不足，请清理数据');
        }
    },

    resolveCurrentUser() {
        // 从 localStorage 读取上次活跃用户
        const lastUserId = localStorage.getItem('baobei_lastUser');
        if (lastUserId && this.users[lastUserId]) {
            this.currentUserId = lastUserId;
        } else {
            // 默认使用第一个用户
            const ids = Object.keys(this.users);
            if (ids.length > 0) {
                this.currentUserId = ids[0];
            } else {
                // 创建默认用户
                this.currentUserId = this.createNewUser('新同学', '未知班级', '');
            }
        }
        localStorage.setItem('baobei_lastUser', this.currentUserId);
    },

    getCurrentUser() {
        return this.users[this.currentUserId] || null;
    },

    loadCurrentUserData() {
        const user = this.getCurrentUser();
        if (!user) return;
        this.records = JSON.parse(JSON.stringify(user.records || []));
        this.nextRecordId = user.nextRecordId || (this.records.length + 1);
        this.notificationCount = user.notificationCount || 0;
        // 社区帖子是共享的
        this.posts = JSON.parse(JSON.stringify(seedPosts));
    },

    saveCurrentUserData() {
        const user = this.getCurrentUser();
        if (!user) return;
        user.records = JSON.parse(JSON.stringify(this.records));
        user.nextRecordId = this.nextRecordId;
        user.notificationCount = this.notificationCount;
        this.saveUsers();
    },

    // ===== 时间系统：登录打卡 =====
    checkLoginStreak() {
        const user = this.getCurrentUser();
        if (!user) return;

        const todayStr = new Date().toISOString().split('T')[0];
        let isFirstLoginToday = false;

        // 确保时间字段存在（兼容旧数据迁移）
        if (!user.registerDate) {
            user.registerDate = user.joinDate || todayStr;
        }
        if (!user.continuousDays) {
            user.continuousDays = 1;
        }
        if (!user.lastLoginDate) {
            user.lastLoginDate = todayStr;
            isFirstLoginToday = true;
        }

        // 今天还未登录
        if (user.lastLoginDate !== todayStr) {
            isFirstLoginToday = true;

            // 计算日期差
            const lastDate = new Date(user.lastLoginDate);
            const today = new Date(todayStr);
            const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // 昨天登录了，连续天数+1
                user.continuousDays = (user.continuousDays || 0) + 1;
            } else if (diffDays > 1) {
                // 超过一天未登录，重新开始计算
                user.continuousDays = 1;
            }

            user.lastLoginDate = todayStr;
        }

        this.saveUsers();

        // 每日首次登录 +5 XP
        if (isFirstLoginToday) {
            const result = this.addXP(5, '每日登录');
            if (result.leveledUp) {
                this.showXPToast(`🎉 每日登录 +${result.xpGained}XP！升级到 Lv.${result.newLevel} ${result.newTitle}！`);
            } else {
                this.showXPToast(`📅 每日登录 +${result.xpGained}XP`);
            }
            // 注意：登录每日任务已在 initDailyTasks() 中自动完成，此处不再重复调用
        }
    },

    // 获取使用天数
    getUsageDays() {
        const user = this.getCurrentUser();
        if (!user) return 0;
        const registerDate = user.registerDate || user.joinDate;
        if (!registerDate) return 0;
        const today = new Date();
        const reg = new Date(registerDate);
        const diff = Math.floor((today - reg) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff + 1);
    },

    // ===== XP系统 =====

    // 根据累计经验计算等级信息
    getXPLevelInfo(totalXp) {
        let currentLevel = xpLevelDefs[0];
        let nextLevel = xpLevelDefs[1] || xpLevelDefs[0];
        for (let i = xpLevelDefs.length - 1; i >= 0; i--) {
            if (totalXp >= xpLevelDefs[i].xpNeeded) {
                currentLevel = xpLevelDefs[i];
                nextLevel = xpLevelDefs[i + 1] || xpLevelDefs[i];
                break;
            }
        }
        const levelRange = nextLevel.xpNeeded - currentLevel.xpNeeded;
        const xpInLevel = totalXp - currentLevel.xpNeeded;
        const progressPercent = levelRange > 0 ? Math.min(100, Math.round((xpInLevel / levelRange) * 100)) : 100;
        const xpToNext = nextLevel.xpNeeded - totalXp;

        return {
            level: currentLevel.level,
            title: currentLevel.title,
            xpInLevel,
            xpToNext: Math.max(0, xpToNext),
            progressPercent,
            nextLevel: nextLevel.level,
            nextTitle: nextLevel.title,
        };
    },

    // 添加经验值，返回 { xpGained, leveledUp, newLevel, newTitle }
    addXP(amount, reason) {
        const user = this.getCurrentUser();
        if (!user) return { xpGained: 0, leveledUp: false };

        // 确保字段存在
        if (user.level === undefined) user.level = 1;
        if (user.xp === undefined) user.xp = 0;
        if (user.totalXp === undefined) user.totalXp = 0;

        const oldLevel = user.level;
        user.xp += amount;
        user.totalXp += amount;

        // 检查升级
        const newInfo = this.getXPLevelInfo(user.totalXp);
        let leveledUp = false;
        if (newInfo.level > oldLevel) {
            user.level = newInfo.level;
            leveledUp = true;
        }

        this.saveUsers();
        return {
            xpGained: amount,
            leveledUp,
            newLevel: newInfo.level,
            newTitle: newInfo.title,
        };
    },

    switchUser(userId) {
        if (!this.users[userId]) return false;
        // 先保存当前用户数据
        this.saveCurrentUserData();
        // 切换
        this.currentUserId = userId;
        localStorage.setItem('baobei_lastUser', userId);
        // 加载新用户数据
        this.loadCurrentUserData();
        // 同步通知徽标（使用新用户的数据）
        this.updateNotificationBadge();
        this.updateHeaderAvatar();
        // 刷新页面
        this.navigateTo(this.currentPage);
        return true;
    },

    createNewUser(name, className, avatar) {
        const uid = 'user_' + Date.now();
        const todayStr = new Date().toISOString().split('T')[0];
        const user = {
            id: uid,
            name: name || '新同学',
            className: className || '未知班级',
            studentId: 'STU' + String(Object.keys(this.users).length + 1).padStart(3, '0'),
            joinDate: todayStr,
            avatar: avatar || '',
            records: [],
            nextRecordId: 1,
            notificationCount: 0,
            createdAt: new Date().toISOString(),
            // 时间系统字段
            registerDate: todayStr,
            lastLoginDate: todayStr,
            continuousDays: 1,
            // XP系统字段
            level: 1,
            xp: 0,
            totalXp: 0,
            // 图鉴系统字段
            collection: {},
            // 每日任务系统字段
            dailyTasks: null,
        };
        this.users[uid] = user;
        this.saveUsers();
        return uid;
    },

    deleteUser(userId) {
        if (!this.users[userId]) return false;
        if (Object.keys(this.users).length <= 1) {
            App.showToast('至少保留一个用户哦');
            return false;
        }
        delete this.users[userId];
        this.saveUsers();
        if (this.currentUserId === userId) {
            const ids = Object.keys(this.users);
            this.switchUser(ids[0]);
        }
        return true;
    },

    getAllUsers() {
        return Object.values(this.users).sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    },

    getCategoryInfo(category) {
        return categoryMap[category] || categoryMap['other'];
    },

    // 获取完整AI饮品画像（调用AI推荐引擎分析）
    getDrinkPersonality() {
        const user = this.getCurrentUser();
        const collection = user ? (user.collection || {}) : {};
        return AIRecommendEngine.analyzeUserProfile(this.records, collection);
    },

    updateHeaderAvatar() {
        const user = this.getCurrentUser();
        if (!user) return;
        const avatarImg = document.querySelector('.avatar-small');
        const avatarFallback = document.querySelector('.avatar-fallback');
        if (avatarImg && user.avatar) {
            avatarImg.src = user.avatar;
            avatarImg.style.display = '';
            if (avatarFallback) avatarFallback.style.display = 'none';
        } else if (avatarFallback) {
            if (avatarImg) avatarImg.style.display = 'none';
            avatarFallback.style.display = 'flex';
        }
    },

    // ===== 数据统计引擎 =====
    getStats() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const weekStart = this.getWeekStart();
        const monthStart = this.getMonthStart();

        const todayRecords = this.records.filter(r => r.date === todayStr);
        const weekRecords = this.records.filter(r => r.date >= weekStart);
        const monthRecords = this.records.filter(r => r.date >= monthStart);

        const todayCups = todayRecords.length;
        const weekCups = weekRecords.length;
        const monthCups = monthRecords.length;
        const todaySpent = todayRecords.reduce((s, r) => s + r.price, 0);
        const weekSpent = weekRecords.reduce((s, r) => s + r.price, 0);
        const monthSpent = monthRecords.reduce((s, r) => s + r.price, 0);
        const totalCups = this.records.length;
        const totalSpent = this.records.reduce((s, r) => s + r.price, 0);

        const streak = this._calcStreak();

        const categoryCounts = {};
        this.records.forEach(r => {
            categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
        });

        let currentLevel = 1;
        let levelTitle = '新手入门';
        let nextLevelCups = 5;
        let progressPercent = 0;
        for (let i = levelDefs.length - 1; i >= 0; i--) {
            if (totalCups >= levelDefs[i].cupsNeeded) {
                currentLevel = levelDefs[i].level;
                levelTitle = levelDefs[i].title;
                const nextDef = levelDefs[i + 1];
                if (nextDef) {
                    nextLevelCups = nextDef.cupsNeeded;
                    progressPercent = Math.round(((totalCups - levelDefs[i].cupsNeeded) / (nextDef.cupsNeeded - levelDefs[i].cupsNeeded)) * 100);
                } else {
                    nextLevelCups = levelDefs[i].cupsNeeded;
                    progressPercent = 100;
                }
                break;
            }
        }

        const trendData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            const cups = this.records.filter(r => r.date === ds).length;
            trendData.push({ date: `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`, cups });
        }

        const catTotal = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
        const favoriteCategories = Object.entries(categoryMap).map(([key, val]) => ({
            category: key,
            count: categoryCounts[key] || 0,
            percentage: catTotal > 0 ? Math.round(((categoryCounts[key] || 0) / catTotal) * 100) : 0,
        })).sort((a, b) => b.count - a.count);

        const stats = { totalCups, totalSpent, categoryCounts, streak };
        const achievements = achievementDefs.map(a => ({
            ...a,
            unlocked: a.condition(stats),
        }));

        const avgRating = totalCups > 0 ? (this.records.reduce((s, r) => s + r.rating, 0) / totalCups).toFixed(1) : '0.0';

        return {
            todayCups, weekCups, monthCups,
            todaySpent, weekSpent, monthSpent,
            totalCups, totalSpent,
            streak,
            currentLevel, levelTitle, nextLevelCups, progressPercent,
            trendData,
            favoriteCategories,
            achievements,
            categoryCounts,
            avgRating,
        };
    },

    _calcStreak() {
        if (this.records.length === 0) return 0;
        const today = new Date();
        const dateSet = new Set(this.records.map(r => r.date));
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let checkDate = new Date(today);
        if (!dateSet.has(todayStr)) {
            if (!dateSet.has(yesterdayStr)) return 0;
            checkDate = new Date(yesterday);
        }

        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const ds = checkDate.toISOString().split('T')[0];
            if (dateSet.has(ds)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    },

    // ===== 排行榜数据 =====
    getLeaderboard() {
        const stats = this.getStats();
        const allUsers = otherUsers.map(u => ({
            name: u.name,
            className: u.className,
            cups: u.baseCups + Math.floor(Math.random() * 10),
            level: this._calcLevel(u.baseCups).level,
            isMe: false,
        }));

        allUsers.push({
            name: this.userProfile.name,
            className: this.userProfile.className,
            cups: stats.totalCups,
            level: stats.currentLevel,
            isMe: true,
        });

        allUsers.sort((a, b) => b.cups - a.cups);
        return allUsers.map((u, i) => ({ ...u, rank: i + 1 }));
    },

    getWeeklyLeaderboard() {
        const weekStart = this.getWeekStart();
        const allUsers = otherUsers.map(u => ({
            name: u.name,
            className: u.className,
            cups: Math.floor(Math.random() * 12) + 8,
            isMe: false,
        }));

        const myWeekCups = this.records.filter(r => r.date >= weekStart).length;
        allUsers.push({
            name: this.userProfile.name,
            className: this.userProfile.className,
            cups: myWeekCups,
            isMe: true,
        });

        allUsers.sort((a, b) => b.cups - a.cups);
        return allUsers.map((u, i) => ({ ...u, rank: i + 1 }));
    },

    _calcLevel(totalCups) {
        let lvl = 1;
        let title = '新手入门';
        for (let i = levelDefs.length - 1; i >= 0; i--) {
            if (totalCups >= levelDefs[i].cupsNeeded) {
                lvl = levelDefs[i].level;
                title = levelDefs[i].title;
                break;
            }
        }
        return { level: lvl, title };
    },

    // ===== 底部导航 =====
    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.navigateTo(item.dataset.page);
            });
        });
    },

    navigateTo(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        const mainContent = document.getElementById('mainContent');
        mainContent.style.animation = 'none';
        mainContent.offsetHeight;
        mainContent.style.animation = 'fadeIn 0.3s ease';

        switch (page) {
            case 'dashboard': Dashboard.render(mainContent); break;
            case 'records': Records.render(mainContent); break;
            case 'profile': Profile.render(mainContent); break;
            case 'leaderboard': Leaderboard.render(mainContent); break;
            case 'community': Community.render(mainContent); break;
            case 'collection': Collection.render(mainContent); break;
        }

        mainContent.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ===== 顶部按钮 =====
    bindProfileBtn() {
        const btn = document.getElementById('profileBtn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            this.navigateTo('profile');
        });
    },

    // ===== FAB按钮 =====
    bindFAB() {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.innerHTML = '<i class="fas fa-plus"></i>';
        fab.addEventListener('click', () => this.openAddDrinkModal());
        document.querySelector('.app-container').appendChild(fab);
    },

    // ===== Modal 弹窗 =====
    bindModal() {
        const modal = document.getElementById('addDrinkModal');
        const closeBtn = document.getElementById('closeModal');
        const saveBtn = document.getElementById('saveDrinkBtn');

        closeBtn.addEventListener('click', () => this.closeAddDrinkModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeAddDrinkModal();
        });

        saveBtn.addEventListener('click', () => this.saveDrinkRecord());

        const drinkSelect = document.getElementById('drinkName');
        drinkMenu.forEach(drink => {
            const option = document.createElement('option');
            option.value = drink.id;
            option.textContent = drink.name;
            drinkSelect.appendChild(option);
        });

        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        const ratingStars = document.querySelectorAll('#ratingSelector i');
        let currentRating = 0;
        let touchPreviewActive = false;
        ratingStars.forEach(star => {
            star.addEventListener('click', () => {
                currentRating = parseInt(star.dataset.rating);
                this.updateRatingStars(currentRating);
            });
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                ratingStars.forEach((s, i) => {
                    s.className = i < rating ? 'fas fa-star' : 'far fa-star';
                });
            });
            // 移动端 touch 事件替代 hover
            star.addEventListener('touchstart', (e) => {
                e.preventDefault();
                touchPreviewActive = true;
                const rating = parseInt(star.dataset.rating);
                ratingStars.forEach((s, i) => {
                    s.className = i < rating ? 'fas fa-star' : 'far fa-star';
                });
            });
        });
        document.getElementById('ratingSelector').addEventListener('mouseleave', () => {
            this.updateRatingStars(currentRating);
        });
        // 移动端：点击空白区域恢复原评分
        document.getElementById('ratingSelector').addEventListener('touchend', (e) => {
            if (touchPreviewActive) {
                touchPreviewActive = false;
                // 如果触摸的不是星星本身，恢复原评分
                if (!e.target.closest('#ratingSelector i')) {
                    this.updateRatingStars(currentRating);
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAddDrinkModal();
                this.closeUserModal();
            }
        });

        // 用户弹窗事件绑定
        this.bindUserModal();
    },

    updateRatingStars(rating) {
        const stars = document.querySelectorAll('#ratingSelector i');
        stars.forEach((star, i) => {
            star.className = i < rating ? 'fas fa-star' : 'far fa-star';
        });
    },

    openAddDrinkModal() {
        const modal = document.getElementById('addDrinkModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        document.getElementById('drinkName').value = '';
        document.getElementById('drinkCategory').value = 'coffee';
        document.getElementById('drinkPrice').value = '';
        document.getElementById('drinkNote').value = '';
        document.querySelectorAll('.size-btn').forEach((b, i) => {
            b.classList.toggle('active', i === 1);
        });
        this.updateRatingStars(0);
    },

    closeAddDrinkModal() {
        const modal = document.getElementById('addDrinkModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    saveDrinkRecord() {
        const drinkId = parseInt(document.getElementById('drinkName').value);
        const category = document.getElementById('drinkCategory').value;
        const sizeBtn = document.querySelector('.size-btn.active');
        const size = sizeBtn ? sizeBtn.dataset.size : 'medium';
        const price = parseFloat(document.getElementById('drinkPrice').value);
        const note = document.getElementById('drinkNote').value;

        const ratingStars = document.querySelectorAll('#ratingSelector i.fas');
        const rating = ratingStars.length;

        if (!drinkId) { this.showToast('请选择饮品名称'); return; }
        if (!price || price <= 0) { this.showToast('请输入有效价格'); return; }
        if (rating === 0) { this.showToast('请给饮品评分'); return; }

        const drink = drinkMenu.find(d => d.id === drinkId);
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

        const newRecord = {
            id: this.nextRecordId++,
            drinkId: drinkId,
            drinkName: drink ? drink.name : '未知饮品',
            category: category,
            size: size,
            price: price,
            rating: rating,
            note: note || '',
            date: dateStr,
            time: timeStr,
        };

        this.records.unshift(newRecord);
        this.notificationCount++;
        this.updateNotificationBadge();
        this.saveCurrentUserData();

        this.closeAddDrinkModal();

        // 图鉴系统：检查是否新饮品解锁
        let collectionResult = null;
        if (drink && drinkId) {
            collectionResult = this.checkAndUnlockDrink(drinkId, drink.name, dateStr);
        }

        // XP 奖励：记录饮品 +10，评分 +5
        const xpResult = this.addXP(10, '记录饮品');
        let xpMsg = `记录添加成功！⚡ +${xpResult.xpGained}XP`;
        if (rating > 0) {
            const ratingResult = this.addXP(5, '饮品评分');
            xpMsg += ` | 评分 +${ratingResult.xpGained}XP`;
        }

        // 新饮品发现：额外 +20 XP
        if (collectionResult && collectionResult.isNew) {
            const discoveryResult = this.addXP(20, '新饮品发现');
            xpMsg += ` | 🔍新发现 +${discoveryResult.xpGained}XP`;
        }

        if (xpResult.leveledUp) {
            xpMsg = `🎉 升级了！Lv.${xpResult.newLevel} ${xpResult.newTitle}！`;
        }

        // 新饮品发现的特殊提示
        if (collectionResult && collectionResult.isNew) {
            this.showXPToast(`🔍 新饮品发现！「${collectionResult.drinkName}」已加入图鉴！+20XP`, 3000);
            setTimeout(() => {
                this.showToast(xpMsg);
            }, 3100);
        } else {
            this.showToast(xpMsg);
        }

        // 每日任务检查：记录饮品 + 评分
        this.checkDailyTask('record');
        if (rating > 0) {
            this.checkDailyTask('rate');
        }
        // 每日任务检查：新饮品发现
        if (collectionResult && collectionResult.isNew) {
            this.checkDailyTask('discover');
        }

        this.navigateTo(this.currentPage);
    },

    // ===== 用户切换弹窗 =====
    bindUserModal() {
        const userModal = document.getElementById('userSwitchModal');
        if (!userModal) return;

        document.getElementById('closeUserModal').addEventListener('click', () => this.closeUserModal());
        userModal.addEventListener('click', (e) => {
            if (e.target === userModal) this.closeUserModal();
        });

        document.getElementById('createUserBtn').addEventListener('click', () => this.handleCreateUser());
    },

    openUserModal() {
        const modal = document.getElementById('userSwitchModal');
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.renderUserList();
    },

    closeUserModal() {
        const modal = document.getElementById('userSwitchModal');
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    renderUserList() {
        const listEl = document.getElementById('userList');
        if (!listEl) return;
        const allUsers = this.getAllUsers();
        const currentUser = this.getCurrentUser();

        listEl.innerHTML = allUsers.map(u => {
            const stats = u.records ? u.records.length : 0;
            const isCurrent = currentUser && u.id === currentUser.id;
            const initials = u.name.charAt(0);
            const avatarColor = this.getAvatarColor(u.name);
            return `
                <div class="user-list-item ${isCurrent ? 'current' : ''}" data-user-id="${u.id}">
                    <div class="user-list-avatar" style="background: ${avatarColor};">
                        ${u.avatar ? `<img src="${u.avatar}" alt="${u.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
                        <span class="user-list-initials" style="${u.avatar ? '' : 'display:flex;'}">${initials}</span>
                    </div>
                    <div class="user-list-info">
                        <span class="user-list-name">${u.name} ${isCurrent ? '<span class="user-current-tag">当前</span>' : ''}</span>
                        <span class="user-list-meta">${u.className} · ${stats}条记录</span>
                    </div>
                    <div class="user-list-actions">
                        ${!isCurrent ? `<button class="user-switch-btn" data-user-id="${u.id}">切换</button>` : ''}
                        ${allUsers.length > 1 ? `<button class="user-delete-btn" data-user-id="${u.id}" title="删除用户"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // 绑定切换事件
        listEl.querySelectorAll('.user-switch-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = btn.dataset.userId;
                if (this.switchUser(uid)) {
                    this.showToast('已切换用户 ✨');
                    this.renderUserList();
                    this.updateHeaderAvatar();
                    this.navigateTo(this.currentPage);
                }
            });
        });

        // 绑定删除事件
        listEl.querySelectorAll('.user-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = btn.dataset.userId;
                if (confirm('确定要删除此用户吗？此操作不可撤销。')) {
                    if (this.deleteUser(uid)) {
                        this.showToast('用户已删除');
                        this.renderUserList();
                        this.updateHeaderAvatar();
                        this.navigateTo(this.currentPage);
                    }
                }
            });
        });

        // 点击整行也可切换
        listEl.querySelectorAll('.user-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const uid = item.dataset.userId;
                if (uid !== this.currentUserId) {
                    if (this.switchUser(uid)) {
                        this.showToast('已切换用户 ✨');
                        this.renderUserList();
                        this.updateHeaderAvatar();
                        this.navigateTo(this.currentPage);
                    }
                }
            });
        });
    },

    handleCreateUser() {
        const nameInput = document.getElementById('newUserName');
        const classInput = document.getElementById('newUserClass');
        const name = nameInput.value.trim();
        const className = classInput ? classInput.value.trim() : '';

        if (!name) {
            this.showToast('请输入姓名');
            return;
        }

        // 1. 先保存当前用户数据（如果存在）
        if (this.currentUserId && this.users[this.currentUserId]) {
            this.saveCurrentUserData();
        }

        // 2. 创建新用户
        const uid = this.createNewUser(name, className || '未知班级', '');

        // 3. 切换当前用户ID并更新localStorage
        this.currentUserId = uid;
        localStorage.setItem('baobei_lastUser', uid);

        // 4. 加载新用户的空数据
        this.records = [];
        this.nextRecordId = 1;
        this.notificationCount = 0;
        this.posts = JSON.parse(JSON.stringify(seedPosts));

        // 5. 更新UI
        this.updateHeaderAvatar();
        this.updateNotificationBadge();

        nameInput.value = '';
        if (classInput) classInput.value = '';
        this.closeUserModal();
        this.showToast('新同学加入成功！🎉');

        // 6. 导航到首页，显示新手引导
        this.currentPage = 'dashboard';
        const mainContent = document.getElementById('mainContent');
        Dashboard.render(mainContent);
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === 'dashboard');
        });
        mainContent.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    getAvatarColor(name) {
        const colors = ['#6B4226', '#8B5E3C', '#D4953A', '#5B8C5A', '#5B7B8C', '#C06030', '#7B5B8C', '#3D6B6B'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    },

    // ===== 通知徽标 =====
    bindNotificationBtn() {
        const btn = document.getElementById('notificationBtn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            if (this.notificationCount > 0) {
                this.showToast(`您有 ${this.notificationCount} 条新消息`);
                this.notificationCount = 0;
                this.updateNotificationBadge();
                this.saveCurrentUserData();
            } else {
                this.showToast('暂无新消息');
            }
        });
    },

    updateNotificationBadge() {
        const badge = document.querySelector('#notificationBtn .badge');
        if (badge) {
            if (this.notificationCount > 0) {
                badge.textContent = this.notificationCount > 99 ? '99+' : this.notificationCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    },

    // ===== Toast =====
    bindToast() {
        this.toastTimer = null;
    },

    showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },

    showXPToast(message, duration = 2500) {
        const toast = document.getElementById('toast');
        toast.innerHTML = `<span class="xp-toast-content">${message}</span>`;
        toast.classList.add('show', 'xp-toast');
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.classList.remove('show', 'xp-toast');
        }, duration);
    },

    // ===== 图鉴系统 =====

    // 从已有记录构建图鉴数据（用于迁移和模板初始化）
    _buildCollectionFromRecords(records) {
        const collection = {};
        if (!records || !Array.isArray(records)) return collection;
        const seen = {};
        records.forEach(r => {
            if (r.drinkId && !seen[r.drinkId]) {
                seen[r.drinkId] = true;
                collection[r.drinkId] = {
                    unlockedAt: r.date,
                    timesTried: 1,
                };
            } else if (r.drinkId && seen[r.drinkId]) {
                collection[r.drinkId].timesTried++;
            }
        });
        return collection;
    },

    // 检查并解锁饮品，返回 { isNew, drinkName }
    checkAndUnlockDrink(drinkId, drinkName, dateStr) {
        const user = this.getCurrentUser();
        if (!user) return { isNew: false };

        // 确保 collection 存在
        if (!user.collection || typeof user.collection !== 'object') {
            user.collection = {};
        }

        if (user.collection[drinkId]) {
            // 已解锁，增加尝试次数
            user.collection[drinkId].timesTried = (user.collection[drinkId].timesTried || 1) + 1;
            this.saveUsers();
            return { isNew: false };
        }

        // 新发现！
        user.collection[drinkId] = {
            unlockedAt: dateStr || new Date().toISOString().split('T')[0],
            timesTried: 1,
        };
        this.saveUsers();
        return { isNew: true, drinkName };
    },

    // 获取当前用户的图鉴数据
    getCollectionData() {
        const user = this.getCurrentUser();
        if (!user) return { unlockedCount: 0, totalCount: 0, unlockedList: [], lockedList: [], progressPercent: 0, title: '' };

        const collection = user.collection || {};
        const totalCount = drinkMenu.length;
        const unlockedIds = Object.keys(collection);
        const unlockedCount = unlockedIds.length;
        const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

        // 构建已解锁列表（按解锁时间倒序）
        const unlockedList = unlockedIds.map(did => {
            const drink = drinkMenu.find(d => d.id === parseInt(did));
            const entry = collection[did];
            return {
                drinkId: parseInt(did),
                drinkName: drink ? drink.name : '未知饮品',
                category: drink ? drink.category : 'other',
                basePrice: drink ? drink.basePrice : 0,
                unlockedAt: entry.unlockedAt,
                timesTried: entry.timesTried || 1,
                isUnlocked: true,
            };
        }).sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt));

        // 构建未解锁列表（按品类分组排序）
        const unlockedIdSet = new Set(unlockedIds.map(id => parseInt(id)));
        const lockedList = drinkMenu
            .filter(d => !unlockedIdSet.has(d.id))
            .map(d => ({
                drinkId: d.id,
                drinkName: d.name,
                category: d.category,
                basePrice: d.basePrice,
                isUnlocked: false,
            }))
            .sort((a, b) => a.category.localeCompare(b.category) || a.drinkName.localeCompare(b.drinkName));

        // 收集称号
        let title = '';
        for (const def of collectionTitleDefs) {
            if (unlockedCount >= def.count) {
                title = def.title;
                break;
            }
        }

        // 按品类统计
        const categoryStats = {};
        unlockedList.forEach(d => {
            if (!categoryStats[d.category]) {
                categoryStats[d.category] = { unlocked: 0, total: 0, info: categoryMap[d.category] };
            }
            categoryStats[d.category].unlocked++;
        });
        drinkMenu.forEach(d => {
            if (!categoryStats[d.category]) {
                categoryStats[d.category] = { unlocked: 0, total: 0, info: categoryMap[d.category] };
            }
            categoryStats[d.category].total++;
        });

        return {
            unlockedCount,
            totalCount,
            unlockedList,
            lockedList,
            progressPercent,
            title,
            categoryStats,
        };
    },

    // ===== 每日任务系统 =====

    // 初始化每日任务：根据日期生成/加载任务
    initDailyTasks() {
        const user = this.getCurrentUser();
        if (!user) return;

        const todayStr = this.getTodayStr();

        // 如果今天已有任务数据，直接使用
        if (user.dailyTasks && user.dailyTasks.date === todayStr) {
            // 如果之前已经标记 login 为完成，保持状态
            // 但如果 login 未完成，现在就是登录时机，自动完成
            const loginTask = user.dailyTasks.tasks.find(t => t.id === 'login');
            if (loginTask && !loginTask.completed) {
                loginTask.completed = true;
                this.saveUsers();
                // 发放XP
                const xpResult = this.addXP(loginTask.xpReward, '每日任务：登录App');
                const xpMsg = `✅ 每日任务完成：「登录App」+${loginTask.xpReward}XP`;
                if (xpResult.leveledUp) {
                    this.showXPToast(`🎉 ${xpMsg} | 升级到 Lv.${xpResult.newLevel} ${xpResult.newTitle}！`, 3000);
                } else {
                    this.showXPToast(xpMsg, 2500);
                }
            }
            return;
        }

        // 需要生成新任务（日期变更或首次初始化），登录任务直接标记完成
        user.dailyTasks = {
            date: todayStr,
            tasks: dailyTaskTemplates.map(t => ({
                id: t.id,
                name: t.name,
                desc: t.desc,
                icon: t.icon,
                xpReward: t.xpReward,
                category: t.category,
                completed: t.id === 'login', // 登录任务直接完成
                claimed: false,
            })),
        };
        this.saveUsers();
    },

    // 获取今日任务列表（带完成状态）
    getDailyTasks() {
        const user = this.getCurrentUser();
        if (!user || !user.dailyTasks) {
            // 返回未初始化状态
            return {
                date: this.getTodayStr(),
                tasks: dailyTaskTemplates.map(t => ({
                    id: t.id,
                    name: t.name,
                    desc: t.desc,
                    icon: t.icon,
                    xpReward: t.xpReward,
                    category: t.category,
                    completed: false,
                    claimed: false,
                })),
                totalCompleted: 0,
                totalCount: dailyTaskTemplates.length,
                progressPercent: 0,
            };
        }

        const tasks = user.dailyTasks.tasks || [];
        const totalCompleted = tasks.filter(t => t.completed).length;
        const totalCount = tasks.length;
        const progressPercent = totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0;

        return {
            date: user.dailyTasks.date,
            tasks,
            totalCompleted,
            totalCount,
            progressPercent,
        };
    },

    // 检查并完成指定任务，自动发放XP
    checkDailyTask(taskId) {
        const user = this.getCurrentUser();
        if (!user || !user.dailyTasks) return null;

        const task = user.dailyTasks.tasks.find(t => t.id === taskId);
        if (!task || task.completed) return null;

        // 标记完成
        task.completed = true;
        this.saveUsers();

        // 自动发放XP奖励
        const xpResult = this.addXP(task.xpReward, `每日任务：${task.name}`);
        const xpMsg = `✅ 每日任务完成：「${task.name}」+${task.xpReward}XP`;

        if (xpResult.leveledUp) {
            this.showXPToast(`🎉 ${xpMsg} | 升级到 Lv.${xpResult.newLevel} ${xpResult.newTitle}！`, 3000);
        } else {
            this.showXPToast(xpMsg, 2500);
        }

        // 刷新当前页面（如果有每日任务卡片）
        if (this.currentPage === 'dashboard') {
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                const tasksCard = mainContent.querySelector('.daily-tasks-card');
                if (tasksCard) {
                    // 刷新每日任务卡片
                    const tasksData = this.getDailyTasks();
                    const newCard = Dashboard.renderDailyTasksCard(tasksData);
                    tasksCard.outerHTML = newCard;
                    Dashboard.bindDailyTasksEvents();
                }
            }
        }

        return { taskId, xpGained: xpResult.xpGained, taskName: task.name };
    },

    // ===== 工具方法 =====
    getCategoryInfo(category) {
        return categoryMap[category] || categoryMap['other'];
    },

    formatPrice(price) {
        return '¥' + price.toFixed(2);
    },

    getTodayStr() {
        return new Date().toISOString().split('T')[0];
    },

    getWeekStart() {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff)).toISOString().split('T')[0];
    },

    getMonthStart() {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 6) return '凌晨好';
        if (hour < 9) return '早上好';
        if (hour < 12) return '上午好';
        if (hour < 14) return '中午好';
        if (hour < 18) return '下午好';
        return '晚上好';
    },
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
