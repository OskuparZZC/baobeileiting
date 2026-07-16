// ===== 我的饮品档案页 =====

const Profile = {
    render(container) {
        const stats = App.getStats();
        const profile = App.userProfile;
        const personality = App.getDrinkPersonality();
        const usageDays = App.getUsageDays();
        const xpInfo = App.getXPLevelInfo(profile.totalXp);

        container.innerHTML = `
            <!-- 用户信息卡片 -->
            <div class="profile-header-card card">
                <div class="profile-top">
                    <div class="profile-avatar-wrapper">
                        ${profile.avatar
                            ? `<img src="${profile.avatar}" alt="头像" class="profile-avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
                            : ''
                        }
                        <div class="avatar-fallback-large" style="${profile.avatar ? 'display:none;' : ''}">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                    <div class="profile-user-info">
                        <h3 class="profile-name">${profile.name}</h3>
                        <span class="profile-dept">${profile.className}</span>
                        <span class="profile-id">学号: ${profile.studentId}</span>
                    </div>
                </div>
                <div class="profile-level-section">
                    <div class="flex-between mb-sm">
                        <span class="level-badge-large">Lv.${xpInfo.level}</span>
                        <span class="level-title">${xpInfo.title}</span>
                    </div>
                    <div class="progress-bar xp-bar">
                        <div class="progress-fill xp-fill" style="width: ${xpInfo.progressPercent}%;"></div>
                    </div>
                    <div class="flex-between mt-sm">
                        <span class="text-secondary" style="font-size: var(--font-size-xs);">累计 ${profile.totalXp} XP</span>
                        <span class="text-secondary" style="font-size: var(--font-size-xs);">${xpInfo.progressPercent}%</span>
                    </div>
                    ${xpInfo.xpToNext > 0 ? `
                    <div class="xp-next-hint">
                        <i class="fas fa-arrow-up"></i> 距离 Lv.${xpInfo.nextLevel} ${xpInfo.nextTitle} 还需 ${xpInfo.xpToNext} XP
                    </div>` : '<div class="xp-next-hint"><i class="fas fa-crown"></i> 已达最高等级！</div>'}
                </div>
            </div>

            <!-- 我的AI饮品人格 -->
            <div class="card personality-card mb-lg">
                <div class="card-header">
                    <span class="card-title">🤖 我的AI饮品人格</span>
                    ${personality.personality.tags.map(t => `<span class="personality-tag" style="background: ${personality.personality.color}18; color: ${personality.personality.color};">${t}</span>`).join('')}
                </div>
                <div class="personality-content">
                    <div class="personality-emoji">${personality.personality.emoji}</div>
                    <div class="personality-info">
                        <span class="personality-name">${personality.personality.title}</span>
                        <span class="personality-desc">${personality.personality.summary}</span>
                    </div>
                </div>
                ${this.renderPersonalityDetail(personality)}
            </div>

            <!-- 核心数据 -->
            <div class="profile-stats-grid mb-lg">
                <div class="card profile-stat-card">
                    <i class="fas fa-mug-hot stat-card-icon" style="color: var(--color-primary);"></i>
                    <span class="stat-card-value">${stats.totalCups}</span>
                    <span class="stat-card-label">累计杯数</span>
                </div>
                <div class="card profile-stat-card">
                    <i class="fas fa-coins stat-card-icon" style="color: #D4953A;"></i>
                    <span class="stat-card-value">¥${stats.totalSpent.toFixed(0)}</span>
                    <span class="stat-card-label">累计消费</span>
                </div>
                <div class="card profile-stat-card">
                    <i class="fas fa-calendar-alt stat-card-icon" style="color: #5B8C5A;"></i>
                    <span class="stat-card-value">${stats.achievements.filter(a => a.unlocked).length}</span>
                    <span class="stat-card-label">成就解锁</span>
                </div>
                <div class="card profile-stat-card">
                    <i class="fas fa-fire stat-card-icon" style="color: #C0392B;"></i>
                    <span class="stat-card-value">${profile.continuousDays}天</span>
                    <span class="stat-card-label">连续打卡</span>
                </div>
            </div>

            <!-- 口味偏好 -->
            <div class="card mb-lg">
                <div class="card-header">
                    <span class="card-title">🍩 口味偏好</span>
                </div>
                <div class="preference-list">
                    ${stats.favoriteCategories.map((fav) => {
                        const cat = App.getCategoryInfo(fav.category);
                        return `
                            <div class="preference-item">
                                <div class="preference-info">
                                    <div class="preference-icon" style="background: ${cat.color}15;">
                                        <i class="fas ${cat.icon}" style="color: ${cat.color};"></i>
                                    </div>
                                    <span class="preference-name">${cat.label}</span>
                                    <span class="preference-count">${fav.count}杯</span>
                                </div>
                                <div class="preference-bar-wrapper">
                                    <div class="preference-bar" style="width: ${fav.percentage}%; background: ${cat.color};"></div>
                                </div>
                                <span class="preference-percent">${fav.percentage}%</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- 成就墙 -->
            <div class="card mb-lg">
                <div class="card-header">
                    <span class="card-title">🏆 成就墙</span>
                    <span class="card-subtitle">${stats.achievements.filter(a => a.unlocked).length}/${stats.achievements.length}</span>
                </div>
                <div class="achievement-grid">
                    ${stats.achievements.map(a => `
                        <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
                            <div class="achievement-icon-wrapper">
                                <i class="fas ${a.icon}"></i>
                                ${!a.unlocked ? '<i class="fas fa-lock lock-icon"></i>' : ''}
                            </div>
                            <span class="achievement-name">${a.name}</span>
                            <span class="achievement-desc">${a.desc}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 账号信息 -->
            <div class="card account-info-card mb-lg">
                <div class="card-header">
                    <span class="card-title">📅 账号信息</span>
                </div>
                <div class="account-info-grid">
                    <div class="account-info-item">
                        <i class="fas fa-calendar-plus"></i>
                        <div class="account-info-text">
                            <span class="account-info-label">注册时间</span>
                            <span class="account-info-value">${profile.registerDate || profile.joinDate}</span>
                        </div>
                    </div>
                    <div class="account-info-item">
                        <i class="fas fa-clock"></i>
                        <div class="account-info-text">
                            <span class="account-info-label">已使用</span>
                            <span class="account-info-value">${usageDays} 天</span>
                        </div>
                    </div>
                    <div class="account-info-item">
                        <i class="fas fa-sign-in-alt"></i>
                        <div class="account-info-text">
                            <span class="account-info-label">最近登录</span>
                            <span class="account-info-value">${profile.lastLoginDate || '今天'}</span>
                        </div>
                    </div>
                    <div class="account-info-item">
                        <i class="fas fa-fire"></i>
                        <div class="account-info-text">
                            <span class="account-info-label">连续打卡</span>
                            <span class="account-info-value">${profile.continuousDays} 天</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 账号与安全卡片（仅已认证用户显示）
        if (App.isAuthenticated) {
            container.innerHTML += `
                <div class="card account-security-card mb-lg">
                    <div class="card-header">
                        <span class="card-title">🔒 账号与安全</span>
                    </div>
                    <div class="security-actions">
                        <button class="security-action" id="changePasswordBtn">
                            <div class="security-action-content">
                                <div class="security-action-icon">
                                    <i class="fas fa-key"></i>
                                </div>
                                <div class="security-action-text">
                                    <span class="security-action-label">修改密码</span>
                                    <span class="security-action-desc">更新你的登录密码</span>
                                </div>
                            </div>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="security-action security-action-danger" id="logoutBtn">
                            <div class="security-action-content">
                                <div class="security-action-icon security-action-icon-danger">
                                    <i class="fas fa-sign-out-alt"></i>
                                </div>
                                <div class="security-action-text">
                                    <span class="security-action-label">退出登录</span>
                                    <span class="security-action-desc">退出当前账号，或登录其他账号</span>
                                </div>
                            </div>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        this.bindEvents();
        this.addStyles();
    },

    bindEvents() {
        // 修改密码按钮
        const changePwdBtn = document.getElementById('changePasswordBtn');
        if (changePwdBtn) {
            changePwdBtn.addEventListener('click', () => this._openPasswordModal());
        }

        // 退出登录按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this._handleLogout());
        }

        // 密码模态框事件（仅绑定一次）
        this._bindPasswordModal();
    },

    // ===== 密码修改模态框 =====

    _passwordModalBound: false,
    _passwordLoading: false,

    _bindPasswordModal() {
        if (this._passwordModalBound) return;
        this._passwordModalBound = true;

        const modal = document.getElementById('passwordModal');
        if (!modal) return;

        const closeBtn = document.getElementById('closePasswordModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this._closePasswordModal());
        }

        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal && !this._passwordLoading) {
                this._closePasswordModal();
            }
        });

        // ESC 关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active') && !this._passwordLoading) {
                this._closePasswordModal();
            }
        });

        // 表单提交
        const form = document.getElementById('passwordForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this._submitPasswordChange();
            });
        }
    },

    _openPasswordModal() {
        const modal = document.getElementById('passwordModal');
        if (!modal) return;

        // 清理输入
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';

        // 清理错误
        this._clearPasswordError();

        // 恢复按钮
        this._setPasswordLoading(false);

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    _closePasswordModal() {
        const modal = document.getElementById('passwordModal');
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // 清理
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        this._clearPasswordError();
        this._setPasswordLoading(false);
    },

    _clearPasswordError() {
        const errEl = document.getElementById('passwordError');
        if (errEl) {
            errEl.style.display = 'none';
            errEl.textContent = '';
        }
    },

    _showPasswordError(message) {
        const errEl = document.getElementById('passwordError');
        if (errEl) {
            errEl.textContent = message;
            errEl.style.display = 'block';
        }
    },

    _setPasswordLoading(loading) {
        this._passwordLoading = loading;
        const btn = document.getElementById('submitPasswordBtn');
        const text = document.getElementById('passwordBtnText');
        const spinner = document.getElementById('passwordSpinner');

        if (btn) btn.disabled = loading;
        if (text) text.style.display = loading ? 'none' : '';
        if (spinner) spinner.style.display = loading ? 'inline' : 'none';
    },

    async _submitPasswordChange() {
        if (this._passwordLoading) return;

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 前端验证
        if (!currentPassword) {
            this._showPasswordError('请输入当前密码');
            return;
        }
        if (!newPassword) {
            this._showPasswordError('请输入新密码');
            return;
        }
        if (newPassword.length < 6 || newPassword.length > 72) {
            this._showPasswordError('新密码长度需要 6~72 位');
            return;
        }
        if (newPassword === currentPassword) {
            this._showPasswordError('新密码不能与当前密码相同');
            return;
        }
        if (newPassword !== confirmPassword) {
            this._showPasswordError('两次输入的新密码不一致');
            return;
        }

        // 获取当前用户身份
        const currentUser = App.getCurrentUser?.();
        const backendAuthEnabled = api.auth.backendAuthEnabled;

        if (!currentUser) {
            this._showPasswordError('当前用户信息缺失，请重新登录');
            return;
        }

        // 正式 JWT 模式：无需传 xUserId（request() 会使用 Bearer token）
        // 开发模式：需要传 _backendId 作为 x-user-id
        let requestOptions = {};
        if (backendAuthEnabled === false) {
            if (!currentUser._backendId) {
                this._showPasswordError('当前账号身份信息缺失，请重新登录');
                return;
            }
            requestOptions = { xUserId: currentUser._backendId };
        }

        this._clearPasswordError();
        this._setPasswordLoading(true);

        try {
            await api.users.changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            }, requestOptions);

            // 修改成功：关闭模态框
            this._closePasswordModal();

            // 提示成功
            App.showToast('密码修改成功，请使用新密码登录', 2500);

            // 延迟退出登录，让用户看到提示
            setTimeout(() => {
                App.logout();
            }, 1500);

        } catch (err) {
            // 根据不同错误类型显示提示
            if (err.code === 401) {
                // 401 只在真正使用 Bearer 认证时才是 token 过期
                if (backendAuthEnabled === true) {
                    this._showPasswordError('登录已过期，请重新登录');
                    setTimeout(() => {
                        this._closePasswordModal();
                        App.logout();
                    }, 1500);
                } else {
                    // 开发模式 401：身份验证失败，不退出
                    this._showPasswordError(err.message || '当前账号身份验证失败，请重新进入账号');
                }
            } else if (err.code === 400) {
                this._showPasswordError(err.message || '当前密码不正确');
            } else if (err.isNetworkError) {
                if (err.isTimeout) {
                    this._showPasswordError('请求超时，请稍后重试');
                } else {
                    this._showPasswordError('无法连接服务器，请稍后重试');
                }
            } else {
                this._showPasswordError(err.message || '修改密码失败，请稍后重试');
            }
        } finally {
            this._setPasswordLoading(false);
        }
    },

    // ===== 退出登录 =====

    _handleLogout() {
        if (!confirm('确定要退出当前账号吗？\n退出后可登录其他账号。')) return;

        // 保存当前数据
        App.saveCurrentUserData();
        App.logout();
    },

    renderPersonalityDetail(personality) {
        if (personality.totalRecords === 0) {
            return `
                <div class="personality-detail-section">
                    <div class="personality-divider"></div>
                    <div class="personality-empty-hint">
                        <i class="fas fa-mug-hot"></i>
                        <span>记录你的第一杯饮品后，AI将为你生成专属饮品画像</span>
                    </div>
                </div>
            `;
        }

        const cat = personality.categoryAnalysis;
        const spend = personality.spendingAnalysis;
        const rating = personality.ratingAnalysis;
        const time = personality.timeAnalysis;
        const coll = personality.collectionAnalysis;
        const size = personality.sizeAnalysis;

        return `
            <div class="personality-detail-section">
                <div class="personality-divider"></div>
                
                <!-- 品类偏好 -->
                <div class="personality-block">
                    <div class="personality-block-header">
                        <i class="fas fa-chart-pie"></i>
                        <span>品类偏好</span>
                        <span class="personality-block-badge">${cat.diversityLabel}</span>
                    </div>
                    <div class="personality-cat-bars">
                        ${cat.categories.filter(c => c.count > 0).slice(0, 4).map(c => `
                            <div class="personality-cat-bar-item">
                                <div class="personality-cat-bar-label">
                                    <i class="fas ${c.icon}" style="color: ${c.color};"></i>
                                    <span>${c.label}</span>
                                    <span class="personality-cat-bar-count">${c.count}杯</span>
                                </div>
                                <div class="personality-cat-bar-track">
                                    <div class="personality-cat-bar-fill" style="width: ${c.percentage}%; background: ${c.color};"></div>
                                </div>
                                <span class="personality-cat-bar-pct">${c.percentage}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 消费特点 -->
                ${spend ? `
                <div class="personality-block">
                    <div class="personality-block-header">
                        <i class="fas fa-coins"></i>
                        <span>消费特点</span>
                        <span class="personality-block-badge" style="background: ${spend.levelColor}15; color: ${spend.levelColor};">${spend.level}</span>
                    </div>
                    <div class="personality-spend-grid">
                        <div class="personality-spend-item">
                            <span class="ps-label">累计消费</span>
                            <span class="ps-value">¥${spend.totalSpent.toFixed(0)}</span>
                        </div>
                        <div class="personality-spend-item">
                            <span class="ps-label">均价</span>
                            <span class="ps-value">¥${spend.avgPrice}</span>
                        </div>
                        <div class="personality-spend-item">
                            <span class="ps-label">价格区间</span>
                            <span class="ps-value">¥${spend.rangeLabel}</span>
                        </div>
                        <div class="personality-spend-item">
                            <span class="ps-label">消费风格</span>
                            <span class="ps-value">${spend.stability}</span>
                        </div>
                    </div>
                </div>` : ''}

                <!-- 评分习惯 -->
                ${rating ? `
                <div class="personality-block">
                    <div class="personality-block-header">
                        <i class="fas fa-star"></i>
                        <span>评分习惯</span>
                        <span class="personality-block-badge" style="background: ${rating.styleColor}15; color: ${rating.styleColor};">${rating.style}</span>
                    </div>
                    <div class="personality-rating-row">
                        <div class="personality-rating-avg">
                            <span class="pra-value">${rating.avgRating}</span>
                            <span class="pra-label">平均评分</span>
                        </div>
                        <div class="personality-rating-dist">
                            ${[5,4,3,2,1].map(s => `
                                <div class="prd-bar-row">
                                    <span class="prd-star">${'★'.repeat(s)}${'☆'.repeat(5-s)}</span>
                                    <div class="prd-track"><div class="prd-fill" style="width: ${rating.totalRated > 0 ? (rating.distribution[s] / rating.totalRated * 100) : 0}%;"></div></div>
                                    <span class="prd-count">${rating.distribution[s]}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>` : ''}

                <!-- 饮用时段 -->
                ${time ? `
                <div class="personality-block">
                    <div class="personality-block-header">
                        <i class="fas fa-clock"></i>
                        <span>饮用时段</span>
                        <span class="personality-block-badge">${time.primePeriod.label}型</span>
                    </div>
                    <div class="personality-time-bars">
                        ${time.periods.map(p => `
                            <div class="ptb-item">
                                <i class="fas ${p.icon} ptb-icon"></i>
                                <span class="ptb-label">${p.label}</span>
                                <div class="ptb-track"><div class="ptb-fill" style="width: ${personality.totalRecords > 0 ? (p.count / personality.totalRecords * 100) : 0}%;"></div></div>
                                <span class="ptb-count">${p.count}次</span>
                            </div>
                        `).join('')}
                    </div>
                    <p class="personality-time-summary">习惯在 <strong>${time.avgTimeLabel}</strong> 左右喝饮品</p>
                </div>` : ''}

                <!-- 图鉴探索 -->
                <div class="personality-block">
                    <div class="personality-block-header">
                        <i class="fas fa-atlas"></i>
                        <span>图鉴探索</span>
                        <span class="personality-block-badge" style="background: ${coll.titleColor}15; color: ${coll.titleColor};">${coll.title}</span>
                    </div>
                    <div class="personality-collection-progress">
                        <div class="pcp-header">
                            <span>已解锁 ${coll.unlockedCount}/${coll.totalCount} 款饮品</span>
                            <span>${coll.progressPercent}%</span>
                        </div>
                        <div class="pcp-bar">
                            <div class="pcp-fill" style="width: ${coll.progressPercent}%;"></div>
                        </div>
                    </div>
                </div>

                <!-- AI建议 -->
                <div class="personality-advice-section">
                    <div class="personality-advice-header">
                        <i class="fas fa-robot"></i>
                        <span>AI管家建议</span>
                    </div>
                    <div class="personality-advice-list">
                        ${personality.aiAdvice.map(a => `
                            <div class="personality-advice-item">
                                <div class="pai-icon"><i class="fas ${a.icon}"></i></div>
                                <span class="pai-text">${a.text}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    addStyles() {
        if (document.getElementById('profile-styles')) return;

        const style = document.createElement('style');
        style.id = 'profile-styles';
        style.textContent = `
            .profile-header-card { text-align: center; padding: var(--spacing-xxl) var(--spacing-lg); }
            .profile-top { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-xl); }
            .profile-avatar-wrapper { position: relative; }
            .profile-avatar { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 4px solid var(--color-accent-light); box-shadow: 0 4px 12px rgba(107, 66, 38, 0.15); }
            .avatar-fallback-large { width: 88px; height: 88px; border-radius: 50%; background: var(--color-accent-light); display: flex; align-items: center; justify-content: center; font-size: 40px; color: var(--color-primary); }
            .profile-user-info { display: flex; flex-direction: column; align-items: center; gap: 2px; }
            .profile-name { font-size: var(--font-size-xl); font-weight: 700; }
            .profile-dept { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
            .profile-id { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .profile-level-section { padding: var(--spacing-md); background: var(--color-cream); border-radius: 12px; }
            .level-badge-large { background: linear-gradient(135deg, #D4953A, #F0C040); color: white; padding: 4px 14px; border-radius: 20px; font-size: var(--font-size-md); font-weight: 700; box-shadow: 0 2px 8px rgba(212,149,58,0.3); }
            .level-title { font-weight: 600; color: var(--color-primary); }
            .xp-bar { background: #F5E6D3; }
            .xp-fill { background: linear-gradient(90deg, #D4953A, #F0C040, #FFD700); }
            .xp-next-hint { text-align: center; margin-top: var(--spacing-sm); font-size: var(--font-size-xs); color: #D4953A; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 4px; }
            .profile-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
            .profile-stat-card { text-align: center; padding: var(--spacing-lg) var(--spacing-md); display: flex; flex-direction: column; align-items: center; gap: 6px; }
            .stat-card-icon { font-size: 28px; }
            .stat-card-value { font-size: var(--font-size-xxl); font-weight: 700; color: var(--color-text); }
            .stat-card-label { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
            .preference-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
            .preference-item { display: flex; align-items: center; gap: var(--spacing-md); }
            .preference-info { display: flex; align-items: center; gap: var(--spacing-sm); width: 100px; flex-shrink: 0; }
            .preference-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
            .preference-name { font-size: var(--font-size-sm); font-weight: 500; }
            .preference-count { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .preference-bar-wrapper { flex: 1; height: 8px; background: var(--color-cream-dark); border-radius: 4px; overflow: hidden; }
            .preference-bar { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
            .preference-percent { width: 35px; text-align: right; font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-secondary); }
            .achievement-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
            .achievement-item { padding: var(--spacing-md); border-radius: 12px; text-align: center; background: var(--color-cream); transition: all 0.2s; }
            .achievement-item.unlocked { background: linear-gradient(135deg, #FFF8E7, #FFE8C0); border: 1.5px solid #F0C040; }
            .achievement-item.locked { opacity: 0.5; filter: grayscale(0.5); }
            .achievement-icon-wrapper { position: relative; display: inline-flex; margin-bottom: var(--spacing-sm); }
            .achievement-icon-wrapper > i.fas { font-size: 32px; color: var(--color-primary); }
            .achievement-item.unlocked .achievement-icon-wrapper > i.fas { color: #D4953A; }
            .lock-icon { position: absolute; bottom: -2px; right: -6px; font-size: 12px; color: var(--color-text-light); background: var(--color-cream); border-radius: 50%; padding: 3px; }
            .achievement-name { display: block; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: 2px; }
            .achievement-desc { display: block; font-size: 11px; color: var(--color-text-light); }

            /* 饮品人格 */
            .personality-card { }
            .personality-card .card-header { display: flex; align-items: center; gap: var(--spacing-sm); flex-wrap: wrap; }
            .personality-tag { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: var(--font-size-xs); font-weight: 600; }
            .personality-content { display: flex; align-items: center; gap: var(--spacing-lg); padding: var(--spacing-md); background: linear-gradient(135deg, #FFF8F0, #F5E6D3); border-radius: 14px; }
            .personality-emoji { font-size: 48px; flex-shrink: 0; animation: personality-pulse 2s ease-in-out infinite; }
            @keyframes personality-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
            .personality-info { display: flex; flex-direction: column; gap: 4px; }
            .personality-name { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-primary); }
            .personality-desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: 1.5; }
            /* 人格详情 */
            .personality-detail-section { margin-top: var(--spacing-lg); }
            .personality-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--color-border), transparent); margin-bottom: var(--spacing-lg); }
            .personality-empty-hint { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-lg); background: var(--color-cream); border-radius: 12px; font-size: var(--font-size-sm); color: var(--color-text-light); justify-content: center; }
            .personality-block { margin-bottom: var(--spacing-lg); }
            .personality-block:last-child { margin-bottom: 0; }
            .personality-block-header { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); font-weight: 600; color: var(--color-text); font-size: var(--font-size-md); }
            .personality-block-header > i { color: var(--color-primary); font-size: var(--font-size-md); }
            .personality-block-badge { font-size: var(--font-size-xs); font-weight: 600; padding: 2px 10px; border-radius: 12px; margin-left: auto; }
            /* 品类偏好条 */
            .personality-cat-bars { display: flex; flex-direction: column; gap: var(--spacing-sm); }
            .personality-cat-bar-item { display: flex; align-items: center; gap: var(--spacing-sm); }
            .personality-cat-bar-label { display: flex; align-items: center; gap: 4px; width: 80px; flex-shrink: 0; font-size: var(--font-size-sm); }
            .personality-cat-bar-label i { font-size: 12px; }
            .personality-cat-bar-count { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .personality-cat-bar-track { flex: 1; height: 6px; background: var(--color-cream-dark); border-radius: 3px; overflow: hidden; }
            .personality-cat-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
            .personality-cat-bar-pct { width: 35px; text-align: right; font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-secondary); }
            /* 消费特点 */
            .personality-spend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); }
            .personality-spend-item { display: flex; flex-direction: column; gap: 2px; padding: var(--spacing-sm) var(--spacing-md); background: var(--color-cream); border-radius: 10px; }
            .ps-label { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .ps-value { font-size: var(--font-size-md); font-weight: 700; color: var(--color-text); }
            /* 评分习惯 */
            .personality-rating-row { display: flex; gap: var(--spacing-lg); align-items: center; }
            .personality-rating-avg { display: flex; flex-direction: column; align-items: center; padding: var(--spacing-md); background: linear-gradient(135deg, #FFF8E7, #FFF0D4); border-radius: 12px; min-width: 70px; }
            .pra-value { font-size: var(--font-size-xxl); font-weight: 700; color: #D4953A; }
            .pra-label { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .personality-rating-dist { flex: 1; display: flex; flex-direction: column; gap: 3px; }
            .prd-bar-row { display: flex; align-items: center; gap: var(--spacing-sm); }
            .prd-star { font-size: var(--font-size-xs); color: #D4953A; width: 55px; flex-shrink: 0; letter-spacing: 1px; }
            .prd-track { flex: 1; height: 6px; background: var(--color-cream-dark); border-radius: 3px; overflow: hidden; }
            .prd-fill { height: 100%; background: linear-gradient(90deg, #D4953A, #F0C040); border-radius: 3px; transition: width 0.5s ease; }
            .prd-count { font-size: var(--font-size-xs); color: var(--color-text-light); width: 16px; text-align: center; }
            /* 饮用时段 */
            .personality-time-bars { display: flex; flex-direction: column; gap: var(--spacing-sm); }
            .ptb-item { display: flex; align-items: center; gap: var(--spacing-sm); }
            .ptb-icon { font-size: 14px; color: var(--color-primary); width: 20px; text-align: center; }
            .ptb-label { font-size: var(--font-size-sm); width: 36px; flex-shrink: 0; color: var(--color-text-secondary); }
            .ptb-track { flex: 1; height: 8px; background: var(--color-cream-dark); border-radius: 4px; overflow: hidden; }
            .ptb-fill { height: 100%; background: linear-gradient(90deg, #6B4226, #D4953A); border-radius: 4px; transition: width 0.5s ease; }
            .ptb-count { font-size: var(--font-size-xs); color: var(--color-text-light); width: 24px; text-align: right; }
            .personality-time-summary { font-size: var(--font-size-sm); color: var(--color-text-light); margin-top: var(--spacing-sm); padding-left: var(--spacing-sm); }
            /* 图鉴探索 */
            .personality-collection-progress { }
            .pcp-header { display: flex; justify-content: space-between; font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm); }
            .pcp-header span:first-child { color: var(--color-text-secondary); }
            .pcp-header span:last-child { font-weight: 700; color: var(--color-primary); }
            .pcp-bar { width: 100%; height: 8px; background: var(--color-cream-dark); border-radius: 4px; overflow: hidden; }
            .pcp-fill { height: 100%; background: linear-gradient(90deg, #5B8C5A, #7CB87C); border-radius: 4px; transition: width 0.5s ease; }
            /* AI建议 */
            .personality-advice-section { margin-top: var(--spacing-lg); padding: var(--spacing-md); background: linear-gradient(135deg, #F0F4FF, #E8F0FF); border-radius: 14px; border: 1.5px solid #D0E0FF; }
            .personality-advice-header { display: flex; align-items: center; gap: var(--spacing-sm); font-weight: 700; color: #4A7BD4; margin-bottom: var(--spacing-md); font-size: var(--font-size-md); }
            .personality-advice-header i { font-size: var(--font-size-lg); }
            .personality-advice-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
            .personality-advice-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-md); background: rgba(255,255,255,0.7); border-radius: 10px; }
            .pai-icon { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #4A7BD4, #6B9DFF); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .pai-icon i { color: #fff; font-size: 13px; }
            .pai-text { font-size: var(--font-size-sm); color: var(--color-text); line-height: 1.4; }
            /* 账号信息 */
            .account-info-card { }
            .account-info-grid { display: flex; flex-direction: column; gap: var(--spacing-sm); }
            .account-info-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-md); background: var(--color-cream); border-radius: 10px; }
            .account-info-item > i { font-size: var(--font-size-lg); color: var(--color-primary); width: 24px; text-align: center; }
            .account-info-text { display: flex; flex-direction: column; gap: 1px; }
            .account-info-label { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .account-info-value { font-size: var(--font-size-md); font-weight: 600; color: var(--color-text); }
        `;
        document.head.appendChild(style);
    }
};
