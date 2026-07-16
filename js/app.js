// ===== 应用主控制器 =====

const App = {
    currentPage: 'dashboard',
    records: [],
    nextRecordId: 0,
    posts: [],
    notificationCount: 3,
    drinks: [],               // 饮品列表（后端加载，fallback 到 drinkMenu）
    brands: [],               // 品牌列表（后端加载）
    _drinksLoading: false,    // 饮品加载中标记
    _brandsLoading: false,    // 品牌加载中标记
    // 用户系统
    currentUserId: null,
    users: {},
    // 排行榜后端数据缓存
    leaderboardData: null,
    leaderboardLoading: false,
    leaderboardError: null,
    // 认证状态
    authToken: null,
    isAuthenticated: false,
    authLoading: false,
    authError: null,
    _backendSyncDone: false,  // 防止重复调用 _initBackendSync()
    _uiBound: false,          // 防止重复绑定全局事件
    _authenticatedStartupDone: false,  // 防止重复执行启动

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

    async init() {
        // 1. 加载用户系统（保留旧数据兼容）
        this.loadUsers();

        // 2. 显示认证加载页面
        this._showAuthLoading();

        // 3. 检测后端认证模式
        await api.auth.detectAuthMode();

        // 4. 读取 token 并尝试恢复认证会话
        this.authToken = api.auth.getToken();
        let authRestored = false;
        if (this.authToken) {
            authRestored = await this.restoreAuthSession();
        }

        // 5. 有 token 且恢复成功 → 进入应用
        if (authRestored) {
            this._hideAuthLoading();
            await this.completeAuthenticatedStartup();
            return;
        }

        // 6. 有 token 但恢复失败（网络错误）→ 保留 token，显示登录页
        if (this.authToken && !authRestored) {
            this._hideAuthLoading();
            const msg = this._lastRestoreError || '暂时无法连接服务器，请稍后重试';
            this.showLoginPage(msg);
            return;
        }

        // 7. 无 token → 显示登录页
        this._hideAuthLoading();
        this.showLoginPage();
    },

    // ===== 饮品数据加载 =====

    /**
     * 从后端 API 加载饮品列表
     * 成功：this.drinks = 后端数据
     * 失败：this.drinks = drinkMenu（本地 fallback）
     */
    async loadDrinks() {
        if (this._drinksLoading) return;
        this._drinksLoading = true;
        this._drinksReadyPromise = (async () => {
            try {
                const res = await api.drinks.list();
                if (res.data && res.data.length > 0) {
                    this.drinks = res.data;
                    console.log(`[drinks] 已从后端加载 ${this.drinks.length} 款饮品`);
                    this._refreshDrinkSelect();
                    return;
                }
            } catch (e) {
                console.warn('[drinks] 后端加载失败，使用本地 fallback:', e.message);
            } finally {
                this._drinksLoading = false;
            }
            this.drinks = drinkMenu;
        })();
        return this._drinksReadyPromise;
    },

    /**
     * 从后端 API 加载品牌列表
     * 成功：this.brands = 后端数据
     * 失败：this.brands = []（品牌筛选隐藏）
     */
    async loadBrands() {
        if (this._brandsLoading) return;
        this._brandsLoading = true;
        try {
            const res = await api.drinks.brands();
            if (res.data && res.data.length > 0) {
                this.brands = res.data;
                console.log(`[drinks] 已从后端加载 ${this.brands.length} 个品牌`);
                this._refreshBrandSelect();
                return;
            }
        } catch (e) {
            console.warn('[drinks] 品牌加载失败:', e.message);
        } finally {
            this._brandsLoading = false;
        }
        this.brands = [];
    },

    /**
     * 获取当前筛选后的饮品列表
     * @returns {Array} 筛选后的饮品数组
     */
    _getFilteredDrinks() {
        const brandSelect = document.getElementById('drinkBrand');
        const searchInput = document.getElementById('drinkSearch');
        const selectedBrandId = brandSelect ? brandSelect.value : '';
        const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

        return this.drinks.filter(drink => {
            // 品牌筛选（仅当 drinks 有 brandId 时生效）
            if (selectedBrandId && drink.brandId != null) {
                if (String(drink.brandId) !== String(selectedBrandId)) return false;
            }
            // 搜索关键词筛选
            if (keyword) {
                const name = (drink.name || '').toLowerCase();
                const desc = (drink.description || '').toLowerCase();
                if (!name.includes(keyword) && !desc.includes(keyword)) return false;
            }
            return true;
        });
    },

    /**
     * 刷新官方饮品下拉框内容（根据品牌筛选和搜索）
     */
    _refreshDrinkSelect() {
        const select = document.getElementById('drinkName');
        if (!select) return;
        // 保留第一个 "选择饮品..." option，清空其余
        while (select.options.length > 1) {
            select.remove(1);
        }
        const filtered = this._getFilteredDrinks();
        filtered.forEach(drink => {
            const option = document.createElement('option');
            option.value = drink.id;
            // 如果有品牌信息，显示「品牌 - 饮品名」
            if (drink.brandId && this.brands.length > 0) {
                const brand = this.brands.find(b => b.id === drink.brandId);
                option.textContent = brand ? `${brand.name} - ${drink.name}` : drink.name;
            } else {
                option.textContent = drink.name;
            }
            select.appendChild(option);
        });
        // 清空当前选中
        select.value = '';
    },

    /**
     * 刷新品牌下拉框内容
     */
    _refreshBrandSelect() {
        const select = document.getElementById('drinkBrand');
        if (!select) return;
        // 保留第一个 "全部品牌" option，清空其余
        while (select.options.length > 1) {
            select.remove(1);
        }
        this.brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.id;
            option.textContent = brand.name;
            select.appendChild(option);
        });
        select.value = '';
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
        // Phase 4.4.3.3：不再自动使用 userTemplates 生成演示账号
        // 无认证时必须显示登录页，不可自动创建可进入的演示用户
        // 旧数据保留在 localStorage 中用于历史迁移/备份
        if (!this.users || Object.keys(this.users).length === 0) {
            this.users = {};
            // 不自动生成用户，确保空 users 不会导致 resolveCurrentUser 创建默认用户
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
        // Phase 4.4.3.3：不再自动创建默认用户或自动选择第一个用户
        // 无正式认证时 currentUserId 保持 null
        // 仅在有有效 users 数据且 lastUserId 匹配时恢复
        const lastUserId = localStorage.getItem('baobei_lastUser');
        if (lastUserId && this.users[lastUserId]) {
            this.currentUserId = lastUserId;
            localStorage.setItem('baobei_lastUser', this.currentUserId);
        } else {
            // 无有效 lastUserId → currentUserId 为 null
            // 不自动创建默认用户，不自动选第一个用户
            this.currentUserId = null;
        }
    },

    getCurrentUser() {
        return this.users[this.currentUserId] || null;
    },

    loadCurrentUserData() {
        const user = this.getCurrentUser();
        if (!user) return;
        this.records = (user.records || []).map(r => ({
            ...r,
            price: Number(r.price || 0),
            rating: Number(r.rating || 0),
            date: this._normalizeDateField(r.date),
            time: this._normalizeTimeField(r.time),
        }));
        this.nextRecordId = user.nextRecordId || (this.records.length + 1);
        this.notificationCount = user.notificationCount || 0;
        // 社区帖子是共享的
        this.posts = JSON.parse(JSON.stringify(seedPosts));
    },

    /**
     * 将后端记录转换为前端兼容格式
     * 补充 drinkName 和 category 字段
     * @param {Object} record - 后端返回的 record
     * @returns {Object} 前端兼容的 record
     */
    _normalizeBackendRecord(record) {
        let drinkName = record.drinkName || '';
        let category = record.category || 'other';

        // 自定义饮品：用 customBrand + customName 拼接
        if (record.customBrand || record.customName) {
            const brand = record.customBrand || '';
            const name = record.customName || '';
            drinkName = brand && name ? `${brand} - ${name}` : (brand || name);
            category = record.category || 'other';
        } else if (record.drinkId) {
            // 官方饮品：从 this.drinks（后端加载）或 drinkMenu（本地 fallback）查找
            const allDrinks = this.drinks.length > 0 ? this.drinks : drinkMenu;
            const rid = Number(record.drinkId);
            const drink = allDrinks.find(d => Number(d.id) === rid);
            if (drink) {
                drinkName = drink.name;
                category = drink.category;
            }
        }

        return {
            ...record,
            drinkName,
            category,
            price: Number(record.price || 0),
            rating: Number(record.rating || 0),
            date: this._normalizeDateField(record.date),
            time: this._normalizeTimeField(record.time),
        };
    },

    /**
     * 标准化日期字段为 YYYY-MM-DD 格式
     * 兼容：Date 对象、ISO 字符串、"YYYY-MM-DD" 字符串、空值
     */
    _normalizeDateField(val) {
        if (!val) return '';
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val).split('T')[0] || String(val);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },

    /**
     * 标准化时间字段为 HH:mm 格式
     * 兼容：Date 对象、ISO 字符串、"HH:mm:ss"、"HH:mm" 格式、空值
     */
    _normalizeTimeField(val) {
        if (!val) return '';
        const str = String(val);
        // 已经是 "HH:mm" 或 "HH:mm:ss" 格式
        if (/^\d{2}:\d{2}/.test(str)) return str.substring(0, 5);
        const d = new Date(val);
        if (isNaN(d.getTime())) return str;
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${min}`;
    },

    /**
     * 从后端同步饮品记录到前端
     * - 异步执行，不阻塞页面初始化
     * - 成功则替换 this.records 为后端数据
     * - 失败则保留 localStorage 现有数据
     */
    async syncRecordsFromBackend() {
        const user = this.getCurrentUser();
        if (!user || !user._backendId) {
            console.log('[records] 未绑定后端用户，跳过同步');
            return;
        }

        // 等待饮品数据加载完成，确保 _normalizeBackendRecord 能正确匹配 drinkName 和 category
        await this._waitForDrinks();

        try {
            const res = await api.records.me(user._backendId);
            if (res.data && Array.isArray(res.data.records)) {
                const backendRecords = res.data.records.map(r => this._normalizeBackendRecord(r));
                // 后端无记录时保留本地数据（防止迁移阶段丢失历史记录）
                if (backendRecords.length === 0 && this.records.length > 0) {
                    console.log('[records] 后端无记录，保留本地数据');
                    return;
                }
                this.records = backendRecords;
                this.nextRecordId = backendRecords.length > 0
                    ? Math.max(...backendRecords.map(r => r.id)) + 1
                    : 1;
                // 同步到 localStorage（使离线时能回退）
                this.saveCurrentUserData();
                console.log(`[records] 从后端同步了 ${backendRecords.length} 条记录`);
            }
        } catch (err) {
            console.warn('[records] 后端同步失败，保留本地数据:', err.message);
        }
    },

    /**
     * 等待饮品数据加载完成（最多等 10 秒）
     * @returns {Promise<void>}
     */
    async _waitForDrinks() {
        if (!this._drinksReadyPromise) {
            this._drinksReadyPromise = this.loadDrinks();
        }
        try {
            await Promise.race([
                this._drinksReadyPromise,
                new Promise(resolve => setTimeout(resolve, 10000))
            ]);
        } catch (e) {
            console.warn('[drinks] 饮品加载超时，使用已有数据继续');
        }
    },

    /**
     * 从后端同步图鉴数据到前端
     * - 异步执行，不阻塞页面初始化
     * - 成功则合并后端数据到本地 collection（不覆盖已有数据）
     * - 合并规则：timesTried 取较大值，unlockedAt 取较早日期
     * - 失败则保留 localStorage 现有数据
     */
    async syncCollectionFromBackend() {
        const user = this.getCurrentUser();
        if (!user || !user._backendId) {
            console.log('[collection] 未绑定后端用户，跳过同步');
            return;
        }

        try {
            const res = await api.collections.me(user._backendId);
            if (res.data && Array.isArray(res.data.collections)) {
                // 确保本地 collection 存在
                if (!user.collection || typeof user.collection !== 'object') {
                    user.collection = {};
                }

                let mergedCount = 0;
                res.data.collections.forEach(c => {
                    const key = String(c.drinkId);
                    const existing = user.collection[key];

                    if (existing) {
                        // 已存在：合并 — timesTried 取较大值，unlockedAt 取较早日期
                        existing.timesTried = Math.max(existing.timesTried || 1, c.timesTried || 1);
                        if (c.unlockedAt && (!existing.unlockedAt || c.unlockedAt < existing.unlockedAt)) {
                            existing.unlockedAt = c.unlockedAt;
                        }
                    } else {
                        // 新条目：直接写入
                        user.collection[key] = {
                            unlockedAt: c.unlockedAt || '',
                            timesTried: c.timesTried || 1,
                        };
                        mergedCount++;
                    }
                });

                this.saveUsers();
                const totalKeys = Object.keys(user.collection).length;
                console.log(`[collection] 从后端同步了 ${res.data.collections.length} 个图鉴条目（新增 ${mergedCount}，总计 ${totalKeys}）`);
            }
        } catch (err) {
            console.warn('[collection] 后端同步失败，保留本地数据:', err.message);
        }
    },

    /**
     * 从后端同步用户统计（XP、等级、连续天数等）到前端
     * - 异步执行，不阻塞页面初始化
     * - 成功则覆盖 currentUser 的 XP/等级/连续天数字段
     * - 失败则保留 localStorage 现有数据
     * - 注意：后端 totalXp=0 时正确写入 0，不使用 || 导致被旧值覆盖
     * - 如果后端为空白统计而本地有历史数据，暂不覆盖，标记 needsMigration
     */
    async syncUserStatsFromBackend() {
        const user = this.getCurrentUser();
        if (!user || !user._backendId) {
            console.log('[stats] 未绑定后端用户，跳过统计同步');
            return;
        }

        try {
            const res = await api.users.getStats(user._backendId);
            if (!res.data || !res.data.stats) {
                console.warn('[stats] 后端返回数据格式异常，保留本地数据');
                return;
            }

            const stats = res.data.stats;

            // 安全 normalize：使用显式 Number 转换，0 不会被 || 忽略
            const backendLevel = Number(stats.level ?? 1);
            const backendXp = Number(stats.xp ?? 0);
            const backendTotalXp = Number(stats.totalXp ?? 0);
            const backendContinuousDays = Number(stats.continuousDays ?? 0);
            const backendTotalRecords = Number(stats.totalRecords ?? 0);
            const backendBountiesPublished = Number(stats.totalBountiesPublished ?? 0);
            const backendBountiesCompleted = Number(stats.totalBountiesCompleted ?? 0);

            // 判断后端是否为空白统计（新建用户默认值）
            // 注意：lastRecordDate 在实际 MySQL user_stats 表中没有对应列，
            // normalizeStatsRow 始终返回 null，不纳入空白判断
            const backendIsBlank =
                backendTotalXp === 0 &&
                backendXp === 0 &&
                backendLevel <= 1 &&
                backendContinuousDays === 0 &&
                backendTotalRecords === 0 &&
                backendBountiesPublished === 0 &&
                backendBountiesCompleted === 0;

            // 判断本地是否有历史数据
            const localHasHistory =
                (user.totalXp > 0) ||
                (user.xp > 0) ||
                (user.level > 1) ||
                (user.continuousDays > 0) ||
                (this.records && this.records.length > 0);

            // 保存后端统计数据到 user.backendStats（始终保存）
            const backendStatsData = {
                totalRecords: isNaN(backendTotalRecords) ? 0 : backendTotalRecords,
                totalBountiesPublished: isNaN(backendBountiesPublished) ? 0 : backendBountiesPublished,
                totalBountiesCompleted: isNaN(backendBountiesCompleted) ? 0 : backendBountiesCompleted,
                lastRecordDate: stats.lastRecordDate || '',
                needsMigration: false,
            };

            if (backendIsBlank && localHasHistory) {
                // 后端是空白统计，本地有历史数据 → 不覆盖，标记需要迁移
                console.warn('[stats] 检测到本地历史统计，等待迁移，暂不使用后端空白数据覆盖');
                backendStatsData.needsMigration = true;
                user.backendStats = backendStatsData;
                this.saveUsers();
                return;
            }

            // 后端不是空白，或本地也没有历史数据 → 正常写入
            user.level = isNaN(backendLevel) ? (user.level ?? 1) : backendLevel;
            user.xp = isNaN(backendXp) ? (user.xp ?? 0) : backendXp;
            user.totalXp = isNaN(backendTotalXp) ? (user.totalXp ?? 0) : backendTotalXp;
            user.continuousDays = isNaN(backendContinuousDays) ? (user.continuousDays ?? 1) : backendContinuousDays;

            // 注意：lastRecordDate（最后记录日期）≠ lastLoginDate（最后登录日期）
            // lastRecordDate 只保存到 backendStats，不覆盖 lastLoginDate

            user.backendStats = backendStatsData;

            // 持久化到 localStorage
            this.saveUsers();

            // 刷新当前页面显示（如有 XP 卡片则更新）
            if (this.currentPage === 'dashboard' || this.currentPage === 'profile') {
                const mainContent = document.getElementById('mainContent');
                if (mainContent) {
                    if (this.currentPage === 'dashboard') {
                        Dashboard.render(mainContent);
                    } else if (this.currentPage === 'profile') {
                        Profile.render(mainContent);
                    }
                }
            }

            console.log(`[stats] 从后端同步统计成功: Lv.${user.level}, XP=${user.xp}, totalXp=${user.totalXp}, 连续${user.continuousDays}天`);
        } catch (err) {
            console.warn('[stats] 后端统计同步失败，保留本地数据:', err.message);
        }
    },

    /**
     * 初始化后端同步（确保绑定后按顺序同步记录、图鉴、统计、迁移）
     * - 不阻塞 UI，所有失败静默处理
     * - 顺序：记录 → 图鉴 → 统计 → 迁移 → 重新拉取统计
     *   确保 totalRecords 来自后端同步后的记录数组
     *   不先用后端 0 覆盖本地 XP
     */
    async _initBackendSync() {
        if (this._backendSyncDone) {
            console.log('[init] 后端同步已执行，跳过重复调用');
            return;
        }
        this._backendSyncDone = true;

        // 1. 确保后端用户绑定（仅非认证用户需要）
        if (!this.isAuthenticated) {
            try {
                await this.ensureBackendUser();
            } catch (err) {
                console.warn('[init] 后端用户绑定失败，跳过所有后端同步:', err.message);
                return;
            }
        }

        // 2. 先同步记录（为迁移提供 totalRecords 数据）
        await this.syncRecordsFromBackend();

        // 3. 同步图鉴
        await this.syncCollectionFromBackend();

        // 4. 同步用户统计（检测 needsMigration）
        await this.syncUserStatsFromBackend();

        // 5. 如果检测到需要迁移，执行迁移
        const user = this.getCurrentUser();
        if (user && user.backendStats && user.backendStats.needsMigration) {
            await this.migrateLocalStatsToBackend();

            // 6. 迁移成功后重新拉取后端统计
            if (user.backendStats && !user.backendStats.needsMigration) {
                await this.syncUserStatsFromBackend();
            }
        }

        // 7. 同步排行榜（失败不影响其他同步，不阻塞页面）
        try {
            await this.syncLeaderboardFromBackend();
        } catch (err) {
            console.warn('[init] 排行榜同步失败（不影响其他功能）:', err.message);
        }
    },

    // ===== 认证会话管理 =====

    /**
     * 设置认证会话
     * @param {string} token - JWT token
     * @param {Object} backendUser - 后端返回的 user 对象 { id, name, className, studentId, avatar, levelInfo, stats }
     */
    setAuthSession(token, backendUser) {
        // 1. 保存 token
        api.auth.setToken(token);
        this.authToken = token;
        this.isAuthenticated = true;
        this.authError = null;

        // 2. 将后端 user 转换为前端兼容用户结构
        const localId = 'auth_' + backendUser.id;
        const levelInfo = backendUser.levelInfo || {};
        const stats = backendUser.stats || {};

        // 检查是否已有该认证用户对应的本地用户记录
        let existingLocalId = null;
        for (const [uid, u] of Object.entries(this.users)) {
            if (u._backendId === backendUser.id) {
                existingLocalId = uid;
                break;
            }
        }

        const targetId = existingLocalId || localId;
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (existingLocalId) {
            // 更新已有用户记录
            const u = this.users[existingLocalId];
            u.name = backendUser.name || u.name;
            u.className = backendUser.className || u.className;
            u.studentId = backendUser.studentId || u.studentId;
            u.avatar = backendUser.avatar || u.avatar || '';
            u._backendId = backendUser.id;
            u.lastLoginDate = todayStr;
        } else {
            // 创建新的本地用户记录
            this.users[targetId] = {
                id: targetId,
                name: backendUser.name || '',
                className: backendUser.className || '',
                studentId: backendUser.studentId || '',
                avatar: backendUser.avatar || '',
                joinDate: todayStr,
                records: [],
                nextRecordId: 1,
                notificationCount: 0,
                createdAt: now.toISOString(),
                registerDate: todayStr,
                lastLoginDate: todayStr,
                continuousDays: stats.continuousDays || 1,
                level: levelInfo.level || 1,
                xp: levelInfo.xp || 0,
                totalXp: levelInfo.totalXp || 0,
                collection: {},
                dailyTasks: null,
                _backendId: backendUser.id,
            };
        }

        // 3. 切换到该用户
        if (this.currentUserId && this.currentUserId !== targetId) {
            this.saveCurrentUserData();
        }
        this.currentUserId = targetId;
        localStorage.setItem('baobei_lastUser', targetId);

        // 4. 持久化
        this.saveUsers();

        // 5. 保存最小会话信息（用于开发模式刷新恢复）
        //    不保存密码，不保存 passwordHash
        this._saveAuthUser({
            id: backendUser.id,
            name: backendUser.name,
            className: backendUser.className || '',
            studentId: backendUser.studentId || '',
            avatar: backendUser.avatar || '',
            _backendId: backendUser.id,
        });

        // 6. 加载当前用户数据
        this.loadCurrentUserData();

        console.log(`[auth] 认证会话已设置: ${backendUser.name} (${backendUser.id}) → ${targetId}`);
    },

    /**
     * 清除认证会话
     */
    clearAuthSession() {
        api.auth.clearToken();
        this.authToken = null;
        this.isAuthenticated = false;
        this.authError = null;

        // 清除本地保存的 auth 用户信息
        this._clearSavedAuthUser();

        // 清空当前会话缓存
        this.records = [];
        this.leaderboardData = null;

        // 清空当前用户的 backendStats
        const user = this.getCurrentUser();
        if (user) {
            user.backendStats = null;
            this.saveUsers();
        }

        // 重置当前用户
        this.currentUserId = null;
        localStorage.removeItem('baobei_lastUser');

        // 重置同步标记
        this._backendSyncDone = false;
        this._authenticatedStartupDone = false;

        console.log('[auth] 认证会话已清除');
    },

    /**
     * 恢复认证会话
     * @returns {Promise<boolean>} 是否成功恢复
     */
    async restoreAuthSession() {
        const token = api.auth.getToken();
        if (!token) return false;

        const backendAuthEnabled = api.auth.backendAuthEnabled;
        this._lastRestoreError = null;

        this.authLoading = true;
        try {
            // 正式模式：使用 Bearer token 调用 /users/me
            // 开发模式：需要从本地存储中获取 _backendId，用 x-user-id 验证
            if (backendAuthEnabled === true) {
                // 正式 JWT 模式
                const res = await api.users.me();
                if (res.data && res.data.user) {
                    this.setAuthSession(token, res.data.user);
                    this.authLoading = false;
                    // 执行后端同步
                    try {
                        await this._initBackendSync();
                    } catch (err) {
                        console.warn('[auth] 恢复后同步异常:', err.message);
                    }
                    console.log('[auth] 认证会话已恢复（JWT模式）');
                    return true;
                }
                console.warn('[auth] /me 返回数据异常，清除 token');
                this.clearAuthSession();
                this.authLoading = false;
                return false;
            } else {
                // 开发模式：使用本地保存的 auth 用户信息 + x-user-id 验证
                const savedAuthUser = this._getSavedAuthUser();
                if (!savedAuthUser || !savedAuthUser._backendId) {
                    // 有 token 但没有本地 auth 用户信息 → 无法在开发模式恢复
                    console.warn('[auth] 开发模式下无本地 auth 用户信息，无法恢复');
                    this.authLoading = false;
                    // 不清除 token，可能是从正式模式切换回开发模式
                    this._lastRestoreError = '请重新登录以恢复会话';
                    return false;
                }

                // 开发模式：用 x-user-id 调用 /users/me 验证用户存在
                try {
                    const res = await api.get('/users/me', { xUserId: savedAuthUser._backendId });
                    if (res.data && res.data.user) {
                        this.setAuthSession(token, res.data.user);
                        this.authLoading = false;
                        // 执行后端同步
                        try {
                            await this._initBackendSync();
                        } catch (err) {
                            console.warn('[auth] 恢复后同步异常:', err.message);
                        }
                        console.log('[auth] 认证会话已恢复（开发模式）');
                        return true;
                    }
                } catch (devErr) {
                    console.warn('[auth] 开发模式用户验证失败:', devErr.message);
                }

                // 验证失败
                console.warn('[auth] 开发模式恢复失败，清除认证会话');
                this.clearAuthSession();
                this.authLoading = false;
                this._lastRestoreError = '登录已过期，请重新登录';
                return false;
            }
        } catch (err) {
            this.authLoading = false;
            if (err.code === 401 || err.status === 401) {
                // 401：token 无效，清除
                console.warn('[auth] token 已失效，清除认证会话');
                this.clearAuthSession();
                this._lastRestoreError = '登录已过期，请重新登录';
                return false;
            }
            // 网络错误：保留 token，保留本地缓存
            console.warn('[auth] 恢复认证会话网络错误，保留 token:', err.message);
            this._lastRestoreError = '暂时无法连接服务器，请稍后重试';
            return false;
        }
    },

    // ===== 认证会话辅助存储（baobei_auth_user） =====

    _AUTH_USER_KEY: 'baobei_auth_user',

    /**
     * 保存最小认证用户信息（开发模式刷新恢复用）
     * 不保存密码、passwordHash、token
     */
    _saveAuthUser(authUser) {
        try {
            const data = {
                id: authUser.id,
                name: authUser.name,
                className: authUser.className || '',
                studentId: authUser.studentId || '',
                avatar: authUser.avatar || '',
                _backendId: authUser._backendId || authUser.id,
                savedAt: new Date().toISOString(),
            };
            localStorage.setItem(this._AUTH_USER_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[auth] 保存 auth 用户信息失败:', e.message);
        }
    },

    /**
     * 获取保存的认证用户信息
     * @returns {Object|null}
     */
    _getSavedAuthUser() {
        try {
            const raw = localStorage.getItem(this._AUTH_USER_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || !data._backendId) return null;
            return data;
        } catch (e) {
            console.warn('[auth] 读取 auth 用户信息失败:', e.message);
            return null;
        }
    },

    /**
     * 清除保存的认证用户信息
     */
    _clearSavedAuthUser() {
        try {
            localStorage.removeItem(this._AUTH_USER_KEY);
        } catch (e) {
            console.warn('[auth] 清除 auth 用户信息失败:', e.message);
        }
    },

    // ===== 认证页面控制 =====

    /**
     * 显示登录页
     * @param {string} message - 可选的提示消息
     */
    showLoginPage(message = '') {
        this.currentPage = 'login';

        // 隐藏 header、bottom-nav、FAB
        this._setAuthUIVisible(false);

        // 渲染登录页
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            LoginPage.mode = 'login';
            LoginPage.error = '';
            LoginPage.render(mainContent, message);
        }
    },

    /**
     * 隐藏登录页
     */
    hideLoginPage() {
        // 恢复 header、bottom-nav、FAB
        this._setAuthUIVisible(true);
    },

    /**
     * 控制认证相关 UI 可见性
     * @param {boolean} visible - true 显示，false 隐藏
     */
    _setAuthUIVisible(visible) {
        const header = document.querySelector('.app-header');
        const nav = document.querySelector('.bottom-nav');
        const fab = document.querySelector('.fab');

        if (header) header.style.display = visible ? '' : 'none';
        if (nav) nav.style.display = visible ? '' : 'none';
        if (fab) fab.style.display = visible ? '' : 'none';
    },

    /**
     * 显示认证加载画面
     */
    _showAuthLoading() {
        const header = document.querySelector('.app-header');
        const nav = document.querySelector('.bottom-nav');
        const fab = document.querySelector('.fab');

        if (header) header.style.display = 'none';
        if (nav) nav.style.display = 'none';
        if (fab) fab.style.display = 'none';

        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="auth-loading">
                    <div class="auth-mascot-wrap">
                        <img src="assets/mascot.png" alt="看板娘" class="auth-mascot">
                    </div>
                    <div class="loading-spinner"></div>
                    <p class="auth-loading-text">正在验证登录状态...</p>
                </div>
            `;
        }
    },

    /**
     * 隐藏认证加载画面
     */
    _hideAuthLoading() {
        // 清空 mainContent 中的 loading 内容
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = '';
        }
    },

    /**
     * 统一认证启动方法
     * 职责：
     * 1. 确认当前用户已通过 setAuthSession 建立
     * 2. loadCurrentUserData()
     * 3. 执行一次 _initBackendSync()
     * 4. 绑定导航
     * 5. 绑定 FAB
     * 6. 绑定其他全局事件
     * 7. 显示 app-header 和 bottom-nav
     * 8. navigateTo('dashboard')
     *
     * 必须防止重复绑定
     */
    async completeAuthenticatedStartup() {
        // 防止重复执行
        if (this._authenticatedStartupDone) {
            console.log('[startup] 已执行过认证启动，跳过重复调用');
            // 至少刷新页面显示
            this.hideLoginPage();
            this.updateHeaderAvatar();
            this.updateNotificationBadge();
            this.navigateTo('dashboard');
            return;
        }
        this._authenticatedStartupDone = true;

        // 1. 确认用户已设置
        const user = this.getCurrentUser();
        if (!user) {
            console.error('[startup] completeAuthenticatedStartup 调用时无当前用户');
            this.showLoginPage('会话异常，请重新登录');
            return;
        }

        // 2. 加载当前用户数据（已在 setAuthSession 中调用，但确保数据一致）
        this.loadCurrentUserData();

        // 3. 执行后端同步
        if (!this._backendSyncDone) {
            try {
                await this._initBackendSync();
            } catch (err) {
                console.warn('[startup] 后端同步异常:', err.message);
            }
        }

        // 4. 显示 UI 元素
        this.hideLoginPage();

        // 5. 绑定全局事件（仅首次）
        if (!this._uiBound) {
            this.bindNavigation();
            this.bindFAB();
            this.bindModal();
            this.bindToast();
            this.bindNotificationBtn();
            this.bindProfileBtn();
            this._uiBound = true;
        }

        // 6. 更新头部头像
        this.updateHeaderAvatar();

        // 7. 同步通知徽标
        this.updateNotificationBadge();

        // 8. 初始化每日任务系统
        this.initDailyTasks();

        // 9. 检查并更新登录打卡
        this.checkLoginStreak();

        // 10. 导航到首页
        this.navigateTo('dashboard');

        // 11. 异步加载饮品数据
        this.loadDrinks();
        this.loadBrands();

        console.log('[startup] 认证启动完成');
    },

    /**
     * 使用密码登录
     * @param {string} studentId - 学号
     * @param {string} password - 密码
     * @returns {Promise<Object>} { success, user }
     */
    async loginWithPassword(studentId, password) {
        const trimmedId = (studentId || '').trim();
        if (!trimmedId) {
            const err = new Error('请输入学号');
            err.code = 400;
            this.authError = err.message;
            throw err;
        }
        if (!password) {
            const err = new Error('请输入密码');
            err.code = 400;
            this.authError = err.message;
            throw err;
        }

        this.authLoading = true;
        try {
            const res = await api.users.login({ studentId: trimmedId, password });
            if (!res.data || !res.data.token || !res.data.user) {
                const err = new Error('登录响应异常');
                err.code = 500;
                this.authError = err.message;
                throw err;
            }
            this.setAuthSession(res.data.token, res.data.user);
            // 执行后端同步
            try {
                await this._initBackendSync();
            } catch (syncErr) {
                console.warn('[auth] 登录后同步异常:', syncErr.message);
            }
            return { success: true, user: res.data.user };
        } catch (err) {
            this.authError = err.message;
            throw err;
        } finally {
            this.authLoading = false;
        }
    },

    /**
     * 注册新账号
     * @param {Object} payload - { name, className, studentId, password }
     * @returns {Promise<Object>} { success, user }
     */
    async registerAccount(payload) {
        this.authLoading = true;
        try {
            const res = await api.users.register(payload);
            if (!res.data || !res.data.token || !res.data.user) {
                const err = new Error('注册响应异常');
                err.code = 500;
                this.authError = err.message;
                throw err;
            }
            this.setAuthSession(res.data.token, res.data.user);
            // 执行后端同步
            try {
                await this._initBackendSync();
            } catch (syncErr) {
                console.warn('[auth] 注册后同步异常:', syncErr.message);
            }
            return { success: true, user: res.data.user };
        } catch (err) {
            this.authError = err.message;
            throw err;
        } finally {
            this.authLoading = false;
        }
    },

    /**
     * 退出登录
     */
    logout() {
        // 先保存当前用户数据
        this.saveCurrentUserData();
        // 清除认证会话
        this.clearAuthSession();
        // 显示登录页（不进入演示账号首页）
        this.showLoginPage();
        console.log('[auth] 已退出登录');
    },

    /**
     * 将本地历史统计迁移到后端
     * - 仅在 user.backendStats.needsMigration === true 时运行
     * - 迁移成功后用后端数据覆盖本地，并清除 needsMigration 标记
     * - 迁移失败或后端已有统计时保留本地数据
     */
    async migrateLocalStatsToBackend() {
        const user = this.getCurrentUser();
        if (!user || !user._backendId) {
            console.log('[stats] 未绑定后端用户，跳过迁移');
            return;
        }

        if (!user.backendStats || !user.backendStats.needsMigration) {
            console.log('[stats] 无需迁移（needsMigration=false）');
            return;
        }

        // 从 records 中取最大 date 作为 lastRecordDate
        let lastRecordDate = null;
        if (this.records && this.records.length > 0) {
            const validDates = this.records
                .map(r => this._normalizeDateField(r.date))
                .filter(d => d && d.length === 10);
            if (validDates.length > 0) {
                validDates.sort(); // YYYY-MM-DD 字符串排序
                lastRecordDate = validDates[validDates.length - 1];
            }
        }

        const payload = {
            level: Number(user.level || 1),
            xp: Number(user.xp || 0),
            totalXp: Number(user.totalXp || 0),
            continuousDays: Number(user.continuousDays || 0),
            totalRecords: this.records ? this.records.length : 0,
            lastRecordDate: lastRecordDate, // YYYY-MM-DD 或 null
        };

        try {
            const res = await api.users.migrateStats(payload, user._backendId);

            if (!res.data) {
                console.warn('[stats] 迁移返回数据异常，保留本地数据');
                return;
            }

            const { stats, migrated, reason } = res.data;

            if (migrated === true) {
                // 迁移成功，用后端 stats 覆盖本地
                user.level = Number(stats.level ?? payload.level);
                user.xp = Number(stats.xp ?? payload.xp);
                user.totalXp = Number(stats.totalXp ?? payload.totalXp);
                user.continuousDays = Number(stats.continuousDays ?? payload.continuousDays);

                // 更新 backendStats
                user.backendStats = {
                    totalRecords: Number(stats.totalRecords ?? 0),
                    totalBountiesPublished: Number(stats.totalBountiesPublished ?? 0),
                    totalBountiesCompleted: Number(stats.totalBountiesCompleted ?? 0),
                    lastRecordDate: stats.lastRecordDate || '',
                    needsMigration: false,
                };

                this.saveUsers();
                console.log('[stats] 本地历史统计迁移成功');

                // 刷新页面显示
                if (this.currentPage === 'dashboard' || this.currentPage === 'profile') {
                    const mainContent = document.getElementById('mainContent');
                    if (mainContent) {
                        if (this.currentPage === 'dashboard') {
                            Dashboard.render(mainContent);
                        } else if (this.currentPage === 'profile') {
                            Profile.render(mainContent);
                        }
                    }
                }
            } else if (migrated === false && reason === 'backend_not_blank') {
                // 后端已有统计，使用后端数据
                user.level = Number(stats.level ?? user.level);
                user.xp = Number(stats.xp ?? user.xp);
                user.totalXp = Number(stats.totalXp ?? user.totalXp);
                user.continuousDays = Number(stats.continuousDays ?? user.continuousDays);

                user.backendStats = {
                    totalRecords: Number(stats.totalRecords ?? 0),
                    totalBountiesPublished: Number(stats.totalBountiesPublished ?? 0),
                    totalBountiesCompleted: Number(stats.totalBountiesCompleted ?? 0),
                    lastRecordDate: stats.lastRecordDate || '',
                    needsMigration: false,
                };

                this.saveUsers();
                console.warn('[stats] 后端已有统计，跳过本地迁移');
            } else {
                // 未知状态，保留本地数据
                user.backendStats = user.backendStats || {};
                user.backendStats.needsMigration = true;
                this.saveUsers();
                console.warn('[stats] 迁移返回未知状态:', { migrated, reason });
            }
        } catch (err) {
            // 请求失败，保留 needsMigration，页面继续正常使用
            console.warn('[stats] 迁移请求失败，保留本地数据:', err.message);
            user.backendStats = user.backendStats || {};
            user.backendStats.needsMigration = true;
            this.saveUsers();
        }
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
        // Phase 4.4.3.3：正式登录状态下禁止本地切换账号
        if (this.isAuthenticated) {
            console.warn('[auth] 正式登录状态下禁止本地切换账号，请使用退出登录→登录页');
            return false;
        }
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
        // Phase 4.4.3.3：正式登录状态下禁止本地创建账号
        // 正式注册必须使用 App.registerAccount()
        if (this.isAuthenticated) {
            console.warn('[auth] 正式登录状态下禁止本地创建账号，请使用注册页面');
            return null;
        }
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
            // 后端绑定
            _backendId: null,
        };
        this.users[uid] = user;
        this.saveUsers();
        return uid;
    },

    /**
     * 确保当前用户已绑定后端
     * - 检查 user._backendId 是否存在
     * - 不存在则调用后端注册，保存返回的 user.id
     * - 持久化到 localStorage
     * @returns {Promise<string>} 后端用户 ID (UUID)
     */
    async ensureBackendUser() {
        const user = this.getCurrentUser();
        if (!user) throw new Error('无当前用户');

        // 已绑定，直接返回
        if (user._backendId) return user._backendId;

        // 未绑定，调用后端注册
        try {
            const res = await api.users.register({
                name: user.name,
                className: user.className,
                studentId: 'baobei_' + user.id,
                password: 'baobei123',
            });
            user._backendId = res.data.user.id;
            this.saveUsers();
            console.log(`[user] 已绑定后端用户: ${user.name} → ${user._backendId}`);
            return user._backendId;
        } catch (err) {
            // 如果学号已存在（409），尝试用已有学号重新注册
            if (err.code === 409) {
                console.warn('[user] 学号冲突，尝试备用学号注册...');
                const res = await api.users.register({
                    name: user.name,
                    className: user.className,
                    studentId: 'baobei_' + user.id + '_' + Date.now(),
                    password: 'baobei123',
                });
                user._backendId = res.data.user.id;
                this.saveUsers();
                console.log(`[user] 已绑定后端用户(备用): ${user.name} → ${user._backendId}`);
                return user._backendId;
            }
            throw err;
        }
    },

    /**
     * 将记录异步同步到后端（双写）
     * - 静默执行，失败不影响前端
     * - 自动完成用户绑定（如未绑定）
     * @param {Object} record - { drinkId, customBrand, customName, size, price, rating, note, date, time }
     */
    async _syncRecordToBackend(record) {
        try {
            const backendId = await this.ensureBackendUser();
            await api.records.create(record, backendId);
            console.log('[record] 后端同步成功');
        } catch (err) {
            console.warn('[record] 后端同步失败（不影响本地数据）:', err.message);
        }
    },

    deleteUser(userId) {
        // Phase 4.4.3.3：正式登录状态下禁止删除本地账号
        if (this.isAuthenticated) {
            console.warn('[auth] 正式登录状态下禁止删除本地账号');
            return false;
        }
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

    /**
     * 从后端同步排行榜数据
     * - 失败不阻塞，leaderboardData 保持 null 则使用本地 fallback
     * - 不触发 XP、不调用 location.reload()
     */
    async syncLeaderboardFromBackend() {
        const user = this.getCurrentUser();
        if (!user || !user._backendId) {
            console.log('[leaderboard] 未绑定后端用户，跳过排行榜同步');
            return;
        }

        if (this.leaderboardLoading) return;
        this.leaderboardLoading = true;
        this.leaderboardError = null;

        try {
            const res = await api.leaderboard.get({ limit: 50 });

            if (!res.data || !Array.isArray(res.data.entries)) {
                console.warn('[leaderboard] 后端返回数据格式异常');
                return;
            }

            // normalize 每一项数字字段
            const entries = res.data.entries.map(entry => ({
                rank: Number(entry.rank) || 0,
                userId: entry.userId,
                name: entry.name || '',
                className: entry.className || '',
                avatar: entry.avatar || '',
                level: Number(entry.level) || 1,
                totalXp: Number(entry.totalXp) || 0,
                totalRecords: Number(entry.totalRecords) || 0,
                cups: Number(entry.totalRecords) || 0,          // 兼容旧字段
                continuousDays: Number(entry.continuousDays) || 0,
                totalBountiesCompleted: Number(entry.totalBountiesCompleted) || 0,
                isCurrentUser: !!entry.isCurrentUser,
                isMe: !!entry.isCurrentUser,                     // 兼容旧字段
                createdAt: entry.createdAt || '',
            }));

            let currentUser = null;
            if (res.data.currentUser) {
                const cu = res.data.currentUser;
                currentUser = {
                    rank: Number(cu.rank) || 0,
                    userId: cu.userId,
                    name: cu.name || '',
                    className: cu.className || '',
                    avatar: cu.avatar || '',
                    level: Number(cu.level) || 1,
                    totalXp: Number(cu.totalXp) || 0,
                    totalRecords: Number(cu.totalRecords) || 0,
                    cups: Number(cu.totalRecords) || 0,
                    continuousDays: Number(cu.continuousDays) || 0,
                    totalBountiesCompleted: Number(cu.totalBountiesCompleted) || 0,
                    isCurrentUser: true,
                    isMe: true,
                    createdAt: cu.createdAt || '',
                };
            }

            this.leaderboardData = {
                entries,
                currentUser,
                total: Number(res.data.total) || entries.length,
                source: 'backend',
            };

            console.log(`[leaderboard] 从后端同步了 ${entries.length} 条排行数据`);

            // 如果当前页面是排行榜，重新渲染
            if (this.currentPage === 'leaderboard') {
                const mainContent = document.getElementById('mainContent');
                if (mainContent) {
                    Leaderboard.render(mainContent);
                }
            }
        } catch (err) {
            this.leaderboardError = err.message;
            console.warn('[leaderboard] 后端不可用，使用本地演示排行:', err.message);
        } finally {
            this.leaderboardLoading = false;
        }
    },

    getLeaderboard() {
        // 后端数据可用时，返回真实排行（包括空数组场景）
        if (this.leaderboardData && this.leaderboardData.entries) {
            return this.leaderboardData.entries;
        }

        // 后端请求失败/尚未请求：使用本地演示 fallback
        // leaderboardData 为 null 表示：
        //   1. 请求失败（leaderboardError 有值）
        //   2. 尚未请求过（leaderboardError 也为 null，首次加载页面时后端可能还没返回）
        if (this.leaderboardError) {
            console.log('[leaderboard] 后端不可用，使用本地演示排行');
        }
        const stats = this.getStats();
        const allUsers = otherUsers.map(u => ({
            name: u.name,
            className: u.className,
            cups: u.baseCups + Math.floor(Math.random() * 10),
            level: this._calcLevel(u.baseCups).level,
            isMe: false,
            isCurrentUser: false,
        }));

        allUsers.push({
            name: this.userProfile.name,
            className: this.userProfile.className,
            cups: stats.totalCups,
            level: stats.currentLevel,
            isMe: true,
            isCurrentUser: true,
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
            case 'profile':
                try {
                    Profile.render(mainContent);
                } catch (error) {
                    console.error('[Profile] 页面渲染失败:', error);
                    mainContent.innerHTML = '<div class="empty-state"><div class="empty-title">档案页加载失败</div><div class="empty-desc">请刷新后重试</div></div>';
                }
                break;
            case 'leaderboard': Leaderboard.render(mainContent); break;
            case 'community': Community.render(mainContent); break;
            case 'collection': Collection.render(mainContent); break;
            case 'help': HelpModule.render(mainContent); break;
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

        // 饮品类型切换
        const typeBtns = document.querySelectorAll('.drink-type-btn');
        const officialSection = document.getElementById('officialDrinkSection');
        const customSection = document.getElementById('customDrinkSection');
        let currentDrinkType = 'official';

        typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                typeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentDrinkType = btn.dataset.type;
                if (currentDrinkType === 'official') {
                    officialSection.style.display = 'block';
                    customSection.style.display = 'none';
                } else {
                    officialSection.style.display = 'none';
                    customSection.style.display = 'block';
                }
            });
        });
        // 保存 currentDrinkType 引用供 saveDrinkRecord 使用
        this._getDrinkType = () => currentDrinkType;

        const drinkSelect = document.getElementById('drinkName');
        // 初始化品牌下拉框
        this._refreshBrandSelect();
        // 初始化饮品下拉框
        this._refreshDrinkSelect();

        // 品牌筛选联动：品牌变更 → 刷新饮品列表
        const brandSelect = document.getElementById('drinkBrand');
        if (brandSelect) {
            brandSelect.addEventListener('change', () => {
                this._refreshDrinkSelect();
            });
        }

        // 搜索联动：输入搜索 → 防抖刷新饮品列表
        const searchInput = document.getElementById('drinkSearch');
        let searchTimer = null;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                if (searchTimer) clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    this._refreshDrinkSelect();
                }, 250);
            });
        }

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
            }
        });

        // 旧用户弹窗事件绑定（内部已是空实现，保留调用以避免报错）
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

        // 重置为官方饮品模式
        document.querySelectorAll('.drink-type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === 'official');
        });
        document.getElementById('officialDrinkSection').style.display = 'block';
        document.getElementById('customDrinkSection').style.display = 'none';

        // 重置搜索和品牌筛选
        const searchInput = document.getElementById('drinkSearch');
        const brandSelect = document.getElementById('drinkBrand');
        if (searchInput) searchInput.value = '';
        if (brandSelect) brandSelect.value = '';

        document.getElementById('drinkName').value = '';
        document.getElementById('drinkCategory').value = 'coffee';
        document.getElementById('customBrand').value = '';
        document.getElementById('customName').value = '';
        document.getElementById('customCategory').value = 'other';
        document.getElementById('drinkPrice').value = '';
        document.getElementById('drinkNote').value = '';
        document.querySelectorAll('.size-btn').forEach((b, i) => {
            b.classList.toggle('active', i === 1);
        });
        this.updateRatingStars(0);

        // 刷新品牌和饮品下拉框
        this._refreshBrandSelect();
        this._refreshDrinkSelect();
    },

    closeAddDrinkModal() {
        const modal = document.getElementById('addDrinkModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    saveDrinkRecord() {
        const isCustom = this._getDrinkType && this._getDrinkType() === 'custom';

        let drinkId = null;
        let customBrand = null;
        let customName = null;
        let category;
        let drinkName = '';
        let drink = null;

        if (isCustom) {
            // 自定义饮品
            customBrand = document.getElementById('customBrand').value.trim();
            customName = document.getElementById('customName').value.trim();
            category = document.getElementById('customCategory').value;

            if (!customBrand) { this.showToast('请输入品牌'); return; }
            if (!customName) { this.showToast('请输入饮品名称'); return; }
            drinkName = customBrand + ' - ' + customName;
        } else {
            // 官方饮品
            drinkId = parseInt(document.getElementById('drinkName').value);
            category = document.getElementById('drinkCategory').value;

            if (!drinkId) { this.showToast('请选择饮品名称'); return; }
            drink = this.drinks.find(d => d.id === drinkId);
            drinkName = drink ? drink.name : '未知饮品';
        }

        const sizeBtn = document.querySelector('.size-btn.active');
        const size = sizeBtn ? sizeBtn.dataset.size : 'medium';
        const price = parseFloat(document.getElementById('drinkPrice').value);
        const note = document.getElementById('drinkNote').value;

        const ratingStars = document.querySelectorAll('#ratingSelector i.fas');
        const rating = ratingStars.length;

        if (!price || price <= 0) { this.showToast('请输入有效价格'); return; }
        if (rating === 0) { this.showToast('请给饮品评分'); return; }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

        const newRecord = {
            id: this.nextRecordId++,
            drinkId: drinkId,
            customBrand: customBrand,
            customName: customName,
            drinkName: drinkName,
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

        // 后端同步：双写记录（异步，不阻塞前端逻辑）
        this._syncRecordToBackend({
            drinkId, customBrand, customName,
            size, price, rating, note: note || '',
            date: dateStr, time: timeStr,
        });

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
        // 旧用户切换弹窗（userSwitchModal）已于 Phase 4.4.3.3 从 index.html 中移除
        // 此方法保留空实现以避免调用方报错，正式账号切换应使用 logout() → 登录页
    },

    // ===== 旧用户切换弹窗方法（Phase 4.4.3.3：已废弃，DOM 已移除） =====
    // 以下方法保留空实现以避免调用方报错
    // 正式账号切换应使用 logout() → 登录页

    openUserModal() {
        // 已废弃：userSwitchModal DOM 已从 index.html 移除
        // 正式登录状态下禁止本地切换账号
        if (this.isAuthenticated) {
            console.warn('[auth] 正式登录状态下禁止本地切换账号');
            return false;
        }
        console.warn('[deprecated] openUserModal 已废弃，请使用退出登录→登录页切换账号');
    },

    closeUserModal() {
        // 已废弃：userSwitchModal DOM 已从 index.html 移除
    },

    renderUserList() {
        // 已废弃：userList DOM 已从 index.html 移除
    },

    handleCreateUser() {
        // 已废弃：创建新用户表单 DOM 已从 index.html 移除
        // 正式注册必须使用 App.registerAccount()
        if (this.isAuthenticated) {
            console.warn('[auth] 正式登录状态下禁止本地创建账号');
            return false;
        }
        console.warn('[deprecated] handleCreateUser 已废弃，请使用注册页面');
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
            // 后端同步（异步，fire-and-forget）
            if (user._backendId) {
                api.collections.unlock({ drinkId, unlockedAt: dateStr }, user._backendId)
                    .catch(err => console.warn('[collection] 后端同步失败:', err.message));
            }
            return { isNew: false };
        }

        // 新发现！
        user.collection[drinkId] = {
            unlockedAt: dateStr || new Date().toISOString().split('T')[0],
            timesTried: 1,
        };
        this.saveUsers();
        // 后端同步（异步，fire-and-forget）
        if (user._backendId) {
            api.collections.unlock({ drinkId, unlockedAt: dateStr }, user._backendId)
                .catch(err => console.warn('[collection] 后端同步失败:', err.message));
        }
        return { isNew: true, drinkName };
    },

    /**
     * 将后端饮品数据标准化为前端统一格式
     * 后端 drinks 表字段：id, name, category, basePrice (model 已转), icon
     * 本地 drinkMenu 字段：id, name, category, basePrice
     * 确保 category 在 categoryMap 中有对应条目，否则 fallback 到 'other'
     */
    _normalizeDrinkForCollection(drink) {
        if (!drink) return null;
        const category = categoryMap[drink.category] ? drink.category : 'other';
        return {
            id: drink.id,
            name: drink.name,
            category: category,
            brandId: drink.brandId || null,
            basePrice: Number(drink.basePrice || drink.base_price || 0),
        };
    },

    // 获取当前用户的图鉴数据
    getCollectionData() {
        const user = this.getCurrentUser();
        if (!user) return { unlockedCount: 0, totalCount: 0, unlockedList: [], lockedList: [], progressPercent: 0, title: '' };

        const collection = user.collection || {};
        // 优先使用后端加载的饮品列表，后端不可用时 fallback 到本地 drinkMenu
        const rawDrinks = this.drinks && this.drinks.length > 0 ? this.drinks : drinkMenu;
        const allDrinks = rawDrinks.map(d => this._normalizeDrinkForCollection(d));
        const totalCount = allDrinks.length;
        const unlockedIds = Object.keys(collection);
        const unlockedCount = unlockedIds.length;
        const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

        // 构建已解锁列表（按解锁时间倒序）
        const unlockedList = unlockedIds.map(did => {
            const drink = allDrinks.find(d => d.id === parseInt(did));
            const entry = collection[did];
            let brandName = '';
            if (drink && drink.brandId && this.brands.length > 0) {
                const brand = this.brands.find(b => Number(b.id) === Number(drink.brandId));
                if (brand) brandName = brand.name;
            }
            return {
                drinkId: parseInt(did),
                drinkName: drink ? drink.name : '未知饮品',
                brandName,
                category: drink ? drink.category : 'other',
                basePrice: drink ? drink.basePrice : 0,
                unlockedAt: entry.unlockedAt,
                timesTried: entry.timesTried || 1,
                isUnlocked: true,
            };
        }).sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt));

        // 构建未解锁列表（按品类分组排序）
        const unlockedIdSet = new Set(unlockedIds.map(id => parseInt(id)));
        const lockedList = allDrinks
            .filter(d => !unlockedIdSet.has(d.id))
            .map(d => {
                let brandName = '';
                if (d.brandId && this.brands.length > 0) {
                    const brand = this.brands.find(b => Number(b.id) === Number(d.brandId));
                    if (brand) brandName = brand.name;
                }
                return {
                    drinkId: d.id,
                    drinkName: d.name,
                    brandName,
                    category: d.category,
                    basePrice: d.basePrice,
                    isUnlocked: false,
                };
            })
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
            const cat = d.category;
            if (!categoryStats[cat]) {
                categoryStats[cat] = { unlocked: 0, total: 0, info: categoryMap[cat] || categoryMap['other'] };
            }
            categoryStats[cat].unlocked++;
        });
        allDrinks.forEach(d => {
            const cat = d.category;
            if (!categoryStats[cat]) {
                categoryStats[cat] = { unlocked: 0, total: 0, info: categoryMap[cat] || categoryMap['other'] };
            }
            categoryStats[cat].total++;
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
        return '¥' + Number(price || 0).toFixed(2);
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

    /**
     * 获取记录的显示名称
     * - 自定义饮品：customBrand + customName（如 "蜜雪冰城 - 柠檬水"）
     * - 官方饮品：品牌 + 饮品名（如 "瑞幸咖啡\n生椰拿铁"）
     * - fallback：直接用 drinkName
     * @param {Object} record 记录对象
     * @returns {{ brandLine: string, nameLine: string, isTwoLine: boolean }}
     */
    getDrinkDisplayName(record) {
        // 自定义饮品
        if (record.customBrand || record.customName) {
            const brand = record.customBrand || '';
            const name = record.customName || '';
            return {
                brandLine: brand,
                nameLine: name,
                isTwoLine: !!brand && !!name,
            };
        }
        // 官方饮品：从 drinks/brands 查找品牌
        if (record.drinkId) {
            const allDrinks = this.drinks && this.drinks.length > 0 ? this.drinks : drinkMenu;
            const rid = Number(record.drinkId);
            const drink = allDrinks.find(d => Number(d.id) === rid);
            if (drink && drink.brandId && this.brands.length > 0) {
                const brand = this.brands.find(b => Number(b.id) === Number(drink.brandId));
                if (brand) {
                    return {
                        brandLine: brand.name,
                        nameLine: drink.name,
                        isTwoLine: true,
                    };
                }
            }
            if (drink) {
                return {
                    brandLine: '',
                    nameLine: drink.name,
                    isTwoLine: false,
                };
            }
        }
        // fallback
        return {
            brandLine: '',
            nameLine: record.drinkName || '未知饮品',
            isTwoLine: false,
        };
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
