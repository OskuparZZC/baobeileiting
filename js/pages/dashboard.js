// ===== Dashboard 首页 =====

const Dashboard = {
    render(container) {
        const stats = App.getStats();
        const greeting = App.getGreeting();
        const isNewUser = App.records.length === 0;

        if (isNewUser) {
            this.renderNewUserOnboarding(container, greeting);
            return;
        }

        const aiRec = AIRecommendEngine.getRecommendation();

        const profile = App.userProfile;
        const usageDays = App.getUsageDays();
        const xpInfo = App.getXPLevelInfo(profile.totalXp);

        container.innerHTML = `
            <!-- 问候区域 -->
            <div class="greeting-section mb-lg">
                <div class="greeting-text">
                    <h2>${greeting}，${profile.name} ☕</h2>
                    <p class="text-secondary">今天喝点什么呢？你已经连续打卡 <span class="text-primary font-bold">${profile.continuousDays}</span> 天啦！</p>
                </div>
                <div class="greeting-meta">
                    <span class="greeting-meta-item" title="加入日期">
                        <i class="fas fa-calendar-plus"></i> ${profile.registerDate}
                    </span>
                    <span class="greeting-meta-item" title="已使用天数">
                        <i class="fas fa-clock"></i> ${usageDays}天
                    </span>
                </div>
            </div>

            <!-- 每日任务卡片 -->
            ${this.renderDailyTasksCard(App.getDailyTasks())}

            <!-- XP 成长卡片 -->
            <div class="card xp-growth-card mb-lg">
                <div class="xp-card-header">
                    <div class="xp-level-display">
                        <span class="xp-level-badge">Lv.${xpInfo.level}</span>
                        <span class="xp-level-title">${xpInfo.title}</span>
                    </div>
                    <span class="xp-total-badge" title="累计经验">
                        <i class="fas fa-star"></i> ${profile.totalXp} XP
                    </span>
                </div>
                <div class="xp-progress-section">
                    <div class="xp-progress-bar">
                        <div class="xp-progress-fill" style="width: ${xpInfo.progressPercent}%;">
                            <span class="xp-progress-text">${xpInfo.progressPercent}%</span>
                        </div>
                    </div>
                    <div class="xp-progress-labels">
                        <span class="xp-current-label">${xpInfo.xpInLevel} XP</span>
                        <span class="xp-next-label">
                            ${xpInfo.xpToNext > 0 ? `距离 Lv.${xpInfo.nextLevel} 还需 ${xpInfo.xpToNext} XP` : '已满级 🏆'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- AI今日推荐 -->
            ${this.renderAIRecommendCard(aiRec)}

            <!-- 今日概览卡片 -->
            <div class="card stats-card">
                <div class="card-header">
                    <span class="card-title">📊 今日概览</span>
                    <span class="card-subtitle">${App.getTodayStr()}</span>
                </div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-icon" style="background: #E8D5C4;">
                            <i class="fas fa-mug-hot" style="color: #6B4226;"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.todayCups}</span>
                            <span class="stat-label">今日杯数</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon" style="background: #D4E8D4;">
                            <i class="fas fa-coins" style="color: #5B8C5A;"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">¥${stats.todaySpent}</span>
                            <span class="stat-label">今日消费</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon" style="background: #FFE8D4;">
                            <i class="fas fa-calendar-week" style="color: #D4953A;"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.weekCups}</span>
                            <span class="stat-label">本周杯数</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon" style="background: #D4E0F0;">
                            <i class="fas fa-fire" style="color: #C0392B;"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${profile.continuousDays}天</span>
                            <span class="stat-label">连续打卡</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 7天趋势 -->
            <div class="card trend-card">
                <div class="card-header">
                    <span class="card-title">📈 近7天饮品趋势</span>
                </div>
                <div class="trend-chart">
                    ${this.renderTrendChart(stats.trendData)}
                </div>
            </div>

            <!-- 最近记录 -->
            <div class="card recent-card">
                <div class="card-header">
                    <span class="card-title">📋 最近记录</span>
                    <button class="btn btn-sm btn-outline" id="goToRecords">查看全部</button>
                </div>
                <div class="recent-list">
                    ${this.renderRecentRecords()}
                </div>
            </div>
        `;

        this.addStyles();
        this.bindAIRefresh();
        this.bindGoToRecords();
        this.bindDailyTasksEvents();
    },

    renderNewUserOnboarding(container, greeting) {
        container.innerHTML = `
            <!-- 问候区域 -->
            <div class="greeting-section mb-lg">
                <div class="greeting-text">
                    <h2>${greeting}，${App.userProfile.name} ☕</h2>
                    <p class="text-secondary">欢迎加入爆杯雷霆！开启你的饮品探索之旅吧 🎉</p>
                </div>
            </div>

            <!-- 新手引导卡片 -->
            <div class="card onboarding-card">
                <div class="onboarding-hero">
                    <div class="onboarding-icon-wrapper">
                        <i class="fas fa-mug-hot onboarding-hero-icon"></i>
                    </div>
                    <h3>欢迎来到饮品世界！</h3>
                    <p class="text-secondary">看起来你还没有任何饮品记录，让我们从第一杯开始吧！</p>
                </div>

                <div class="onboarding-steps">
                    <div class="onboarding-step">
                        <div class="onboarding-step-num">1</div>
                        <div class="onboarding-step-content">
                            <strong>点击右下角 <span style="color:var(--color-primary);">+</span> 按钮</strong>
                            <span class="text-secondary">开始记录你的第一杯饮品</span>
                        </div>
                    </div>
                    <div class="onboarding-step">
                        <div class="onboarding-step-num">2</div>
                        <div class="onboarding-step-content">
                            <strong>选择饮品并评分</strong>
                            <span class="text-secondary">记录名称、价格，并给饮品打分</span>
                        </div>
                    </div>
                    <div class="onboarding-step">
                        <div class="onboarding-step-num">3</div>
                        <div class="onboarding-step-content">
                            <strong>查看个人档案</strong>
                            <span class="text-secondary">追踪你的饮品习惯和等级成长</span>
                        </div>
                    </div>
                    <div class="onboarding-step">
                        <div class="onboarding-step-num">4</div>
                        <div class="onboarding-step-content">
                            <strong>登上排行榜</strong>
                            <span class="text-secondary">和同学们比拼谁是饮品达人</span>
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary btn-block onboarding-cta" id="onboardingStartBtn">
                    <i class="fas fa-plus-circle"></i> 记录第一杯饮品
                </button>
            </div>

            <!-- 饮品菜单预览 -->
            <div class="card menu-preview-card">
                <div class="card-header">
                    <span class="card-title">🍹 热门饮品推荐</span>
                </div>
                <div class="menu-preview-grid">
                    ${this.renderMenuPreview()}
                </div>
            </div>
        `;

        this.addStyles();
        this.bindOnboardingBtn();
    },

    renderMenuPreview() {
        const samples = drinkMenu.slice(0, 4);
        return samples.map(d => {
            const cat = App.getCategoryInfo(d.category);
            return `
                <div class="menu-preview-item">
                    <div class="menu-preview-icon" style="background: ${cat.color}20;">
                        <i class="fas ${cat.icon}" style="color: ${cat.color};"></i>
                    </div>
                    <div class="menu-preview-info">
                        <span class="menu-preview-name">${d.name}</span>
                        <span class="tag tag-${d.category}">${cat.label}</span>
                    </div>
                    <span class="menu-preview-price">¥${d.basePrice}</span>
                </div>
            `;
        }).join('');
    },

    bindOnboardingBtn() {
        const btn = document.getElementById('onboardingStartBtn');
        if (btn) {
            btn.addEventListener('click', () => App.openAddDrinkModal());
        }
    },

    renderTrendChart(trendData) {
        const maxCups = Math.max(...trendData.map(d => d.cups), 1);
        const maxHeight = 100;

        return trendData.map((d, i) => {
            const height = Math.max(4, (d.cups / maxCups) * maxHeight);
            const isToday = i === trendData.length - 1;
            return `
                <div class="trend-bar-wrapper">
                    <span class="trend-value">${d.cups}</span>
                    <div class="trend-bar ${isToday ? 'active' : ''}" style="height: ${height}px;"></div>
                    <span class="trend-date">${d.date}</span>
                </div>
            `;
        }).join('');
    },

    renderRecentRecords() {
        const recent = App.records.slice(0, 4);
        if (recent.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-mug-hot"></i>
                    <h4>还没有记录</h4>
                    <p>点击右下角 + 按钮开始记录吧</p>
                </div>
            `;
        }

        return recent.map(r => {
            const cat = App.getCategoryInfo(r.category);
            const stars = Array(5).fill(0).map((_, i) =>
                i < r.rating ? '<i class="fas fa-star" style="color:#F0C040;font-size:12px;"></i>' : '<i class="far fa-star" style="color:#DDD;font-size:12px;"></i>'
            ).join('');

            const sizeLabel = r.size === 'large' ? '大杯' : r.size === 'medium' ? '中杯' : '小杯';

            return `
                <div class="recent-item">
                    <div class="recent-item-left">
                        <div class="recent-icon" style="background: ${cat.color}15;">
                            <i class="fas ${cat.icon}" style="color: ${cat.color};"></i>
                        </div>
                        <div class="recent-info">
                            <span class="recent-name">${r.drinkName}</span>
                            <span class="recent-meta">
                                <span class="tag tag-${r.category}">${cat.label}</span>
                                <span>${sizeLabel}</span>
                            </span>
                        </div>
                    </div>
                    <div class="recent-item-right">
                        <span class="recent-price">¥${r.price}</span>
                        <span class="recent-rating">${stars}</span>
                        <span class="recent-time">${r.date}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    bindGoToRecords() {
        const btn = document.getElementById('goToRecords');
        if (btn) {
            btn.addEventListener('click', () => App.navigateTo('records'));
        }
    },

    renderDailyTasksCard(tasksData) {
        const { tasks, totalCompleted, totalCount, progressPercent } = tasksData;
        const allDone = totalCompleted >= totalCount;

        return `
            <div class="card daily-tasks-card">
                <div class="daily-tasks-header">
                    <div class="daily-tasks-title-row">
                        <span class="daily-tasks-icon">🎯</span>
                        <span class="daily-tasks-title">今日挑战</span>
                        ${allDone ? '<span class="daily-tasks-all-done">全部完成 🎉</span>' : ''}
                    </div>
                    <div class="daily-tasks-progress-info">
                        <span class="daily-tasks-progress-text">${totalCompleted}/${totalCount}</span>
                    </div>
                </div>
                <div class="daily-tasks-progress-bar">
                    <div class="daily-tasks-progress-fill" style="width: ${progressPercent}%;${allDone ? 'background: linear-gradient(90deg, #5B8C5A, #7CB87C);' : ''}"></div>
                </div>
                <div class="daily-tasks-list">
                    ${tasks.map(t => this.renderDailyTaskItem(t)).join('')}
                </div>
            </div>
        `;
    },

    renderDailyTaskItem(task) {
        const completed = task.completed;
        const categoryColors = {
            daily: { bg: '#E8F0FF', color: '#4A7BD4' },
            action: { bg: '#FFF0E8', color: '#D4953A' },
            explore: { bg: '#E8FFE8', color: '#5B8C5A' },
        };
        const cc = categoryColors[task.category] || categoryColors['action'];

        return `
            <div class="daily-task-item ${completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="daily-task-left">
                    <div class="daily-task-icon" style="background: ${cc.bg}; color: ${cc.color};">
                        <i class="fas ${task.icon}"></i>
                    </div>
                    <div class="daily-task-info">
                        <span class="daily-task-name">${task.name}</span>
                        <span class="daily-task-desc">${task.desc}</span>
                    </div>
                </div>
                <div class="daily-task-right">
                    ${completed
                        ? '<span class="daily-task-check"><i class="fas fa-check-circle"></i> 已完成</span>'
                        : `<span class="daily-task-reward">+${task.xpReward} XP</span>`
                    }
                </div>
            </div>
        `;
    },

    bindDailyTasksEvents() {
        // 当前每日任务不需要额外的交互事件，完成状态由 App.checkDailyTask 自动触发
        // 保留此方法供未来扩展（如手动领取奖励等）
    },

    renderAIRecommendCard(aiRec) {
        const drink = aiRec.drink;
        const cat = aiRec.categoryInfo;
        const confidenceColor = aiRec.confidence >= 85 ? '#5B8C5A' : aiRec.confidence >= 70 ? '#D4953A' : '#8B7355';
        const confidenceLabel = aiRec.confidence >= 85 ? '强烈推荐' : aiRec.confidence >= 70 ? '推荐' : '值得一试';

        return `
            <div class="card ai-recommend-card">
                <div class="ai-card-header">
                    <div class="ai-badge">
                        <i class="fas fa-robot"></i>
                        <span>AI 今日推荐</span>
                        <span class="ai-sparkle">✨</span>
                    </div>
                    <button class="ai-refresh-btn" id="aiRefreshBtn" title="换一个推荐">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>

                <div class="ai-drink-showcase">
                    <div class="ai-drink-icon-wrapper">
                        <div class="ai-drink-icon" style="background: linear-gradient(135deg, ${cat.color}20, ${cat.color}40);">
                            <i class="fas ${cat.icon}" style="color: ${cat.color};"></i>
                        </div>
                        <div class="ai-confidence-ring">
                            <svg viewBox="0 0 60 60" class="ai-ring-svg">
                                <circle cx="30" cy="30" r="26" fill="none" stroke="#E8D5C4" stroke-width="4"/>
                                <circle cx="30" cy="30" r="26" fill="none" stroke="${confidenceColor}" stroke-width="4"
                                    stroke-dasharray="${aiRec.confidence * 1.63} 163"
                                    stroke-linecap="round" transform="rotate(-90 30 30)"
                                    class="ai-ring-progress"/>
                            </svg>
                            <span class="ai-confidence-text">${aiRec.confidence}%</span>
                        </div>
                    </div>
                    <div class="ai-drink-info">
                        <h3 class="ai-drink-name">${drink.name}</h3>
                        <div class="ai-drink-meta-row">
                            <span class="tag tag-${drink.category}">${cat.label}</span>
                            <span class="ai-confidence-label" style="color: ${confidenceColor};">${confidenceLabel}</span>
                        </div>
                        <span class="ai-drink-price">约 ¥${drink.basePrice}</span>
                    </div>
                </div>

                <div class="ai-reason-section">
                    <div class="ai-reason-main">
                        <i class="fas fa-lightbulb ai-bulb"></i>
                        <p>${aiRec.reason}</p>
                    </div>
                    <div class="ai-detail-reasons">
                        ${aiRec.detailReasons.map((r, i) => `
                            <span class="ai-detail-chip">
                                <span class="ai-detail-chip-num">${i + 1}</span> ${r}
                            </span>
                        `).join('')}
                    </div>
                </div>

                <div class="ai-footer">
                    <div class="ai-match-tags">
                        ${aiRec.matchTags.map(t => `<span class="ai-match-tag">${t}</span>`).join('')}
                    </div>
                    <div class="ai-analysis-meta">
                        <span title="基于 ${aiRec.preferenceSummary.totalAnalyzed} 条记录分析">
                            <i class="fas fa-database"></i> ${aiRec.preferenceSummary.totalAnalyzed}条记录
                        </span>
                        <span title="最爱品类: ${aiRec.preferenceSummary.topCategory} ${aiRec.preferenceSummary.topCategoryPercent}%">
                            <i class="fas fa-heart"></i> ${aiRec.preferenceSummary.topCategory} ${aiRec.preferenceSummary.topCategoryPercent}%
                        </span>
                        <span title="平均评分">
                            <i class="fas fa-star"></i> ${aiRec.preferenceSummary.avgRating}
                        </span>
                    </div>
                </div>
            </div>
        `;
    },

    bindAIRefresh() {
        const btn = document.getElementById('aiRefreshBtn');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const icon = btn.querySelector('i');
            icon.style.transition = 'transform 0.5s ease';
            icon.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                icon.style.transition = 'none';
                icon.style.transform = 'rotate(0deg)';
            }, 500);

            const aiCard = document.querySelector('.ai-recommend-card');
            if (aiCard) {
                const newRec = AIRecommendEngine.refreshRecommendation();
                const newCard = this.renderAIRecommendCard(newRec);
                const temp = document.createElement('div');
                temp.innerHTML = newCard;
                const newCardEl = temp.firstElementChild;

                aiCard.style.opacity = '0';
                aiCard.style.transform = 'translateY(8px)';
                aiCard.style.transition = 'all 0.3s ease';

                setTimeout(() => {
                    aiCard.replaceWith(newCardEl);
                    newCardEl.style.opacity = '0';
                    newCardEl.style.transform = 'translateY(8px)';
                    requestAnimationFrame(() => {
                        newCardEl.style.transition = 'all 0.3s ease';
                        newCardEl.style.opacity = '1';
                        newCardEl.style.transform = 'translateY(0)';
                    });
                    this.bindAIRefresh();
                }, 300);
            }
        });
    },

    addStyles() {
        if (document.getElementById('dashboard-styles')) return;

        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            .greeting-section { padding: var(--spacing-sm) 0; }
            .greeting-section h2 { font-size: var(--font-size-xxl); font-weight: 700; color: var(--color-text); margin-bottom: 4px; }
            .greeting-section p { font-size: var(--font-size-md); }
            .greeting-meta { display: flex; gap: var(--spacing-lg); margin-top: var(--spacing-sm); }
            .greeting-meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: var(--font-size-xs); color: var(--color-text-light); background: var(--color-cream); padding: 3px 10px; border-radius: 12px; }
            .greeting-meta-item i { font-size: 11px; }
            /* XP 成长卡片 */
            .xp-growth-card { background: linear-gradient(135deg, #FFFDF7 0%, #FFF8E7 100%); border: 1.5px solid #F0D080; }
            .xp-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); }
            .xp-level-display { display: flex; align-items: center; gap: var(--spacing-sm); }
            .xp-level-badge { background: linear-gradient(135deg, #D4953A, #F0C040); color: #fff; padding: 4px 14px; border-radius: 20px; font-size: var(--font-size-md); font-weight: 700; box-shadow: 0 2px 8px rgba(212,149,58,0.3); }
            .xp-level-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-primary); }
            .xp-total-badge { display: inline-flex; align-items: center; gap: 4px; background: var(--color-cream); color: #D4953A; padding: 4px 12px; border-radius: 15px; font-size: var(--font-size-xs); font-weight: 600; }
            .xp-progress-section { }
            .xp-progress-bar { width: 100%; height: 28px; background: #F5E6D3; border-radius: 14px; overflow: hidden; margin-bottom: var(--spacing-sm); position: relative; }
            .xp-progress-fill { height: 100%; background: linear-gradient(90deg, #D4953A, #F0C040, #FFD700); border-radius: 14px; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
            .xp-progress-fill::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: xp-shimmer 2s ease-in-out infinite; }
            @keyframes xp-shimmer { 0% { left: -100%; } 100% { left: 200%; } }
            .xp-progress-text { color: #fff; font-size: var(--font-size-xs); font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
            .xp-progress-labels { display: flex; justify-content: space-between; align-items: center; }
            .xp-current-label { font-size: var(--font-size-xs); color: #D4953A; font-weight: 600; }
            .xp-next-label { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
            .stat-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-cream); border-radius: 12px; }
            .stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
            .stat-info { display: flex; flex-direction: column; }
            .stat-value { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); }
            .stat-label { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
            .level-badge { background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); color: white; padding: 4px 12px; border-radius: 20px; font-size: var(--font-size-sm); font-weight: 700; }
            .progress-bar { width: 100%; height: 24px; background: var(--color-cream-dark); border-radius: 12px; overflow: hidden; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); border-radius: 12px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; transition: width 0.6s ease; }
            .progress-text { color: white; font-size: var(--font-size-xs); font-weight: 600; }
            .trend-chart { display: flex; align-items: flex-end; justify-content: space-around; height: 140px; padding-top: var(--spacing-md); }
            .trend-bar-wrapper { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
            .trend-value { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-secondary); }
            .trend-bar { width: 28px; background: var(--color-accent-light); border-radius: 6px 6px 0 0; transition: height 0.4s ease; }
            .trend-bar.active { background: linear-gradient(180deg, var(--color-primary), var(--color-accent)); }
            .trend-date { font-size: var(--font-size-xs); color: var(--color-text-light); margin-top: 4px; }
            .recent-list { display: flex; flex-direction: column; }
            .recent-item { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md) 0; border-bottom: 1px solid var(--color-cream-dark); }
            .recent-item:last-child { border-bottom: none; padding-bottom: 0; }
            .recent-item-left { display: flex; align-items: center; gap: var(--spacing-md); }
            .recent-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
            .recent-info { display: flex; flex-direction: column; gap: 4px; }
            .recent-name { font-weight: 600; font-size: var(--font-size-md); }
            .recent-meta { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-xs); color: var(--color-text-secondary); }
            .recent-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
            .recent-price { font-weight: 700; color: var(--color-primary); font-size: var(--font-size-md); }
            .recent-rating { font-size: var(--font-size-xs); }
            .recent-time { font-size: var(--font-size-xs); color: var(--color-text-light); }
            /* AI 推荐卡片 */
            .ai-recommend-card { background: linear-gradient(145deg, #FFFDF7, #FFF8EC); border: 1.5px solid #E8D5C4; position: relative; overflow: hidden; transition: opacity 0.3s ease, transform 0.3s ease; }
            .ai-recommend-card::before { content: ''; position: absolute; top: -40px; right: -40px; width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, rgba(107,66,38,0.04), rgba(212,165,116,0.06)); pointer-events: none; }
            .ai-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); }
            .ai-badge { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #6B4226, #8B5E3C); color: #FFD700; padding: 6px 14px; border-radius: 20px; font-size: var(--font-size-sm); font-weight: 700; box-shadow: 0 2px 8px rgba(107,66,38,0.2); }
            .ai-sparkle { animation: sparkle 1.5s ease-in-out infinite; }
            @keyframes sparkle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
            .ai-refresh-btn { width: 44px; height: 44px; min-width: 44px; min-height: 44px; border-radius: 50%; background: var(--color-cream); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s; border: 1px solid var(--color-border); -webkit-tap-highlight-color: transparent; }
            .ai-refresh-btn:active { background: var(--color-accent-light); transform: scale(0.92); }
            .ai-drink-showcase { display: flex; align-items: center; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: rgba(255,255,255,0.7); border-radius: 14px; }
            .ai-drink-icon-wrapper { position: relative; flex-shrink: 0; }
            .ai-drink-icon { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
            .ai-confidence-ring { position: absolute; top: -6px; right: -6px; width: 60px; height: 60px; }
            .ai-ring-svg { width: 100%; height: 100%; }
            .ai-ring-progress { transition: stroke-dasharray 0.8s ease; }
            .ai-confidence-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 11px; font-weight: 700; color: var(--color-text); }
            .ai-drink-info { display: flex; flex-direction: column; gap: 4px; }
            .ai-drink-name { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); }
            .ai-drink-meta-row { display: flex; align-items: center; gap: var(--spacing-sm); }
            .ai-confidence-label { font-size: var(--font-size-xs); font-weight: 700; }
            .ai-drink-price { font-size: var(--font-size-sm); color: var(--color-primary); font-weight: 600; }
            .ai-reason-section { margin-bottom: var(--spacing-md); }
            .ai-reason-main { display: flex; align-items: flex-start; gap: var(--spacing-sm); padding: var(--spacing-md); background: linear-gradient(135deg, #FFF8E7, #FFF0D4); border-radius: 10px; border-left: 3px solid #D4953A; margin-bottom: var(--spacing-md); }
            .ai-bulb { color: #D4953A; font-size: var(--font-size-lg); margin-top: 2px; animation: bulb-glow 2s ease-in-out infinite; }
            @keyframes bulb-glow { 0%, 100% { text-shadow: 0 0 4px rgba(212,149,58,0.3); } 50% { text-shadow: 0 0 12px rgba(212,149,58,0.6); } }
            .ai-reason-main p { font-size: var(--font-size-md); color: var(--color-text); font-weight: 500; line-height: 1.5; }
            .ai-detail-reasons { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }
            .ai-detail-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--color-cream); border-radius: 15px; font-size: var(--font-size-xs); color: var(--color-text-secondary); }
            .ai-detail-chip-num { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 9px; font-weight: 700; flex-shrink: 0; }
            .ai-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--spacing-sm); padding-top: var(--spacing-md); border-top: 1px dashed var(--color-border); }
            .ai-match-tags { display: flex; gap: var(--spacing-xs); }
            .ai-match-tag { padding: 3px 10px; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); color: var(--color-cream); border-radius: 12px; font-size: var(--font-size-xs); font-weight: 600; }
            .ai-analysis-meta { display: flex; gap: var(--spacing-md); font-size: var(--font-size-xs); color: var(--color-text-light); flex-wrap: wrap; }
            .ai-analysis-meta span { display: inline-flex; align-items: center; gap: 3px; }
            /* 新手引导 */
            .onboarding-card { text-align: center; padding: var(--spacing-xxl) var(--spacing-lg); }
            .onboarding-hero { margin-bottom: var(--spacing-xl); }
            .onboarding-icon-wrapper { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--color-cream), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--spacing-lg); }
            .onboarding-hero-icon { font-size: 36px; color: var(--color-primary); animation: float-up 2s ease-in-out infinite; }
            @keyframes float-up { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
            .onboarding-hero h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); margin-bottom: var(--spacing-sm); }
            .onboarding-hero p { font-size: var(--font-size-md); }
            .onboarding-steps { display: flex; flex-direction: column; gap: var(--spacing-md); margin-bottom: var(--spacing-xl); text-align: left; }
            .onboarding-step { display: flex; align-items: flex-start; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-cream); border-radius: 12px; }
            .onboarding-step-num { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); color: var(--color-cream); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-sm); font-weight: 700; flex-shrink: 0; }
            .onboarding-step-content { display: flex; flex-direction: column; gap: 2px; }
            .onboarding-step-content strong { font-size: var(--font-size-md); color: var(--color-text); }
            .onboarding-step-content span { font-size: var(--font-size-xs); }
            .onboarding-cta { margin-top: var(--spacing-sm); padding: 14px 0; font-size: var(--font-size-lg); }
            .menu-preview-grid { display: flex; flex-direction: column; gap: var(--spacing-sm); }
            .menu-preview-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm) 0; border-bottom: 1px solid var(--color-cream-dark); }
            .menu-preview-item:last-child { border-bottom: none; }
            .menu-preview-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
            .menu-preview-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
            .menu-preview-name { font-size: var(--font-size-md); font-weight: 600; }
            .menu-preview-price { font-size: var(--font-size-md); font-weight: 700; color: var(--color-primary); }
            /* 每日任务卡片 */
            .daily-tasks-card { background: linear-gradient(145deg, #FFFDF7, #FFF8EC); border: 1.5px solid #E8D5C4; }
            .daily-tasks-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm); }
            .daily-tasks-title-row { display: flex; align-items: center; gap: var(--spacing-sm); }
            .daily-tasks-icon { font-size: var(--font-size-xl); }
            .daily-tasks-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text); }
            .daily-tasks-all-done { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-success); background: #E8F5E8; padding: 2px 10px; border-radius: 10px; }
            .daily-tasks-progress-info { display: flex; align-items: center; }
            .daily-tasks-progress-text { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-primary); }
            .daily-tasks-progress-bar { width: 100%; height: 6px; background: #F5E6D3; border-radius: 3px; overflow: hidden; margin-bottom: var(--spacing-md); }
            .daily-tasks-progress-fill { height: 100%; background: linear-gradient(90deg, #D4953A, #F0C040); border-radius: 3px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
            .daily-tasks-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
            .daily-task-item { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md); background: rgba(255,255,255,0.7); border-radius: 12px; border: 1px solid transparent; transition: all 0.3s ease; }
            .daily-task-item.completed { background: #F8FAF8; border-color: #D4E8D4; opacity: 0.75; }
            .daily-task-left { display: flex; align-items: center; gap: var(--spacing-md); }
            .daily-task-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
            .daily-task-info { display: flex; flex-direction: column; gap: 1px; }
            .daily-task-name { font-size: var(--font-size-md); font-weight: 600; color: var(--color-text); }
            .daily-task-item.completed .daily-task-name { text-decoration: line-through; color: var(--color-text-secondary); }
            .daily-task-desc { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .daily-task-right { display: flex; align-items: center; flex-shrink: 0; }
            .daily-task-reward { font-size: var(--font-size-sm); font-weight: 700; color: #D4953A; background: linear-gradient(135deg, #FFF8E7, #FFF0D4); padding: 4px 12px; border-radius: 14px; border: 1px solid #F0D080; }
            .daily-task-check { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-success); display: flex; align-items: center; gap: 4px; }
            .daily-task-check i { font-size: var(--font-size-lg); }
        `;
        document.head.appendChild(style);
    }
};
