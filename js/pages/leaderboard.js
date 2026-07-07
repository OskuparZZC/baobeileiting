// ===== 校园排行榜页 =====

const Leaderboard = {
    currentTab: 'total',

    render(container) {
        container.innerHTML = `
            <!-- 页面标题 -->
            <div class="page-header mb-lg">
                <h2 class="page-title">🏆 校园排行榜</h2>
                <p class="text-secondary">看看谁是校园饮品王！</p>
            </div>

            <!-- Tab切换 -->
            <div class="tab-bar mb-lg">
                <button class="tab-btn ${this.currentTab === 'total' ? 'active' : ''}" data-tab="total">
                    <i class="fas fa-crown"></i> 总榜
                </button>
                <button class="tab-btn ${this.currentTab === 'weekly' ? 'active' : ''}" data-tab="weekly">
                    <i class="fas fa-calendar-week"></i> 本周
                </button>
            </div>

            <!-- 前三名 -->
            <div class="top-three mb-lg">
                ${this.renderTopThree()}
            </div>

            <!-- 排行榜列表 -->
            <div class="leaderboard-list">
                ${this.renderLeaderboardList()}
            </div>
        `;

        this.bindTabs();
        this.addStyles();
    },

    getData() {
        return this.currentTab === 'total'
            ? App.getLeaderboard()
            : App.getWeeklyLeaderboard();
    },

    renderTopThree() {
        const data = this.getData();
        const top3 = data.slice(0, 3);

        if (top3.length < 3) {
            // 数据不足时直接展示已有数据
            return top3.map((user, idx) => this._renderTopUser(user, idx + 1)).join('');
        }

        // 展示顺序: 第2名, 第1名, 第3名
        const display = [top3[1], top3[0], top3[2]];
        return display.map((user, displayIndex) => {
            const actualRank = displayIndex === 0 ? 2 : displayIndex === 1 ? 1 : 3;
            return this._renderTopUser(user, actualRank);
        }).join('');
    },

    _renderTopUser(user, rank) {
        const crownColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
        const crownIcon = rank === 1 ? 'fa-crown' : 'fa-medal';

        return `
            <div class="top-three-item rank-${rank}">
                <div class="top-crown" style="color: ${crownColor};">
                    <i class="fas ${crownIcon}"></i>
                </div>
                <div class="top-avatar ${user.isMe ? 'is-me' : ''}">
                    <div class="top-avatar-fallback" style="background: ${this.getAvatarColor(user.name)};">
                        ${user.name.charAt(0)}
                    </div>
                </div>
                <span class="top-name">${user.name}${user.isMe ? ' 👈' : ''}</span>
                <span class="top-dept">${user.className}</span>
                <span class="top-cups">${user.cups} 杯</span>
            </div>
        `;
    },

    renderLeaderboardList() {
        const data = this.getData();
        const rest = data.slice(3);

        return rest.map((user, index) => {
            const rank = index + 4;
            return `
                <div class="leaderboard-item ${user.isMe ? 'is-me' : ''}">
                    <span class="lb-rank">${rank}</span>
                    <div class="lb-avatar ${user.isMe ? 'is-me' : ''}">
                        <div class="lb-avatar-fallback" style="background: ${this.getAvatarColor(user.name)};">
                            ${user.name.charAt(0)}
                        </div>
                    </div>
                    <div class="lb-info">
                        <span class="lb-name">${user.name}${user.isMe ? ' (我)' : ''}</span>
                        <span class="lb-dept">${user.className}</span>
                    </div>
                    <div class="lb-stats">
                        <span class="lb-cups">${user.cups}杯</span>
                        ${user.level ? `<span class="lb-level">Lv.${user.level}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    getAvatarColor(name) {
        const colors = ['#6B4226', '#8B5E3C', '#D4953A', '#5B8C5A', '#5B7B8C', '#C06030', '#7B5B8C', '#3D6B6B'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    },

    bindTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTab = btn.dataset.tab;
                const mainContent = document.getElementById('mainContent');
                this.render(mainContent);
            });
        });
    },

    addStyles() {
        if (document.getElementById('leaderboard-styles')) return;

        const style = document.createElement('style');
        style.id = 'leaderboard-styles';
        style.textContent = `
            .tab-bar { display: flex; background: var(--color-white); border-radius: 12px; padding: 4px; box-shadow: var(--card-shadow); }
            .tab-btn { flex: 1; padding: 10px; border-radius: 10px; background: transparent; color: var(--color-text-secondary); font-size: var(--font-size-md); font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; min-height: 44px; -webkit-tap-highlight-color: transparent; }
            .tab-btn.active { background: var(--color-primary); color: var(--color-cream); box-shadow: 0 2px 8px rgba(107, 66, 38, 0.25); }
            .top-three { display: flex; align-items: flex-end; justify-content: center; gap: var(--spacing-md); padding: var(--spacing-lg) 0; }
            .top-three-item { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
            .top-three-item.rank-1 { order: 2; }
            .top-three-item.rank-2 { order: 1; }
            .top-three-item.rank-3 { order: 3; }
            .top-crown { font-size: 24px; margin-bottom: 4px; }
            .top-three-item.rank-1 .top-crown { font-size: 32px; animation: crown-bounce 1s ease-in-out infinite; }
            @keyframes crown-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            .top-avatar { width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 3px solid var(--color-border); background: var(--color-cream); }
            .top-three-item.rank-1 .top-avatar { width: 72px; height: 72px; border-color: #FFD700; }
            .top-avatar.is-me { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(107, 66, 38, 0.2); }
            .top-avatar-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; font-weight: 700; }
            .top-name { font-weight: 600; font-size: var(--font-size-sm); color: var(--color-text); }
            .top-three-item.rank-1 .top-name { font-size: var(--font-size-md); }
            .top-dept { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .top-cups { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-primary); }
            .leaderboard-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
            .leaderboard-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-white); border-radius: 12px; box-shadow: var(--card-shadow); }
            .leaderboard-item.is-me { background: linear-gradient(135deg, #FFF8F0, #F5E6D3); border: 1.5px solid var(--color-accent); }
            .lb-rank { width: 28px; text-align: center; font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text-light); }
            .lb-avatar { width: 42px; height: 42px; border-radius: 50%; overflow: hidden; background: var(--color-cream); }
            .lb-avatar.is-me { border: 2px solid var(--color-primary); }
            .lb-avatar-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; font-weight: 700; }
            .lb-info { flex: 1; min-width: 0; }
            .lb-name { display: block; font-weight: 600; font-size: var(--font-size-md); }
            .lb-dept { display: block; font-size: var(--font-size-xs); color: var(--color-text-light); }
            .lb-stats { text-align: right; display: flex; flex-direction: column; gap: 2px; }
            .lb-cups { font-weight: 700; color: var(--color-primary); font-size: var(--font-size-md); }
            .lb-level { font-size: var(--font-size-xs); color: var(--color-accent); }
        `;
        document.head.appendChild(style);
    }
};
