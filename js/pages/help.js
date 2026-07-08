// ===== 校园互助模块 =====
// V1 MVP：发布悬赏、悬赏大厅、我的悬赏

const HelpModule = {
    currentTab: 'hall', // 'publish' | 'hall' | 'my'

    render(container) {
        const user = App.getCurrentUser();
        const userName = user ? user.name : '未知用户';
        const userClass = user ? user.className : '未知班级';

        container.innerHTML = `
            <!-- 页面标题 -->
            <div class="page-header mb-lg">
                <h2 class="page-title">🤝 校园互助</h2>
                <p class="text-secondary">发布悬赏，互帮互助</p>
            </div>

            <!-- Tab 导航 -->
            <div class="help-tabs mb-lg">
                <button class="help-tab ${this.currentTab === 'hall' ? 'active' : ''}" data-tab="hall">
                    <i class="fas fa-list"></i> 悬赏大厅
                </button>
                <button class="help-tab ${this.currentTab === 'publish' ? 'active' : ''}" data-tab="publish">
                    <i class="fas fa-plus-circle"></i> 发布悬赏
                </button>
                <button class="help-tab ${this.currentTab === 'my' ? 'active' : ''}" data-tab="my">
                    <i class="fas fa-user-check"></i> 我的悬赏
                </button>
            </div>

            <!-- Tab 内容区域 -->
            <div class="help-content" id="helpContent">
                ${this.currentTab === 'publish' ? this.renderPublishForm() : ''}
                ${this.currentTab === 'hall' ? this.renderHall() : ''}
                ${this.currentTab === 'my' ? this.renderMyBounties() : ''}
            </div>
        `;

        this.addStyles();
        this.bindEvents();
    },

    // ==================== 1. 发布悬赏 ====================

    renderPublishForm() {
        return `
            <div class="card publish-card">
                <div class="card-header">
                    <span class="card-title">📝 发布悬赏</span>
                    <span class="card-subtitle">填写需求，等待同学接单</span>
                </div>
                <div class="form-group">
                    <label>悬赏标题 <span class="required">*</span></label>
                    <input type="text" id="bountyTitle" class="form-input" placeholder="例：帮忙取一下中通快递" maxlength="50">
                </div>
                <div class="form-group">
                    <label>需求分类</label>
                    <div class="category-selector" id="categorySelector">
                        ${bountyCategories.map(c => `
                            <button class="category-chip" data-category="${c.value}">
                                <i class="fas ${c.icon}"></i> ${c.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label>详细描述 <span class="required">*</span></label>
                    <textarea id="bountyDesc" class="form-textarea" placeholder="详细描述你的需求，如地点、时间等..." rows="3" maxlength="200"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group form-half">
                        <label>悬赏报酬</label>
                        <input type="text" id="bountyReward" class="form-input" placeholder="例：一杯奶茶 / 5元">
                    </div>
                    <div class="form-group form-half">
                        <label>紧急程度</label>
                        <div class="urgency-selector" id="urgencySelector">
                            ${urgencyOptions.map(u => `
                                <button class="urgency-chip" data-urgency="${u.value}">
                                    ${u.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>地点</label>
                    <input type="text" id="bountyLocation" class="form-input" placeholder="例：2号宿舍楼下">
                </div>
                <div class="form-group">
                    <label>截止时间</label>
                    <input type="datetime-local" id="bountyDeadline" class="form-input">
                </div>
                <button class="btn btn-primary btn-block" id="submitBountyBtn">
                    <i class="fas fa-paper-plane"></i> 发布悬赏
                </button>
            </div>
        `;
    },

    // ==================== 2. 悬赏大厅 ====================

    renderHall() {
        const bounties = HelpData.getBounties().filter(b => b.status === 'open');
        // 按紧急程度和创建时间排序
        bounties.sort((a, b) => {
            const urgencyOrder = { urgent: 0, normal: 1, low: 2 };
            const ua = urgencyOrder[a.urgency] || 1;
            const ub = urgencyOrder[b.urgency] || 1;
            if (ua !== ub) return ua - ub;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        if (bounties.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-hand-holding-heart"></i>
                    <h4>暂无悬赏</h4>
                    <p>当前没有进行中的悬赏，快去发布第一个吧！</p>
                </div>
            `;
        }

        return `
            <div class="hall-stats mb-md">
                <span class="hall-count">共 <strong>${bounties.length}</strong> 个悬赏待接</span>
            </div>
            <div class="bounty-list">
                ${bounties.map(b => this.renderBountyCard(b)).join('')}
            </div>
        `;
    },

    renderBountyCard(bounty, showActions = true) {
        const catInfo = HelpData.getCategoryInfo(bounty.category);
        const urgencyInfo = HelpData.getUrgencyInfo(bounty.urgency);
        const timeStr = HelpData.formatTime(bounty.createdAt);

        return `
            <div class="card bounty-card" data-bounty-id="${bounty.id}">
                <div class="bounty-card-header">
                    <span class="bounty-category-tag" style="background: ${catInfo.color}15; color: ${catInfo.color};">
                        <i class="fas ${catInfo.icon}"></i> ${catInfo.label}
                    </span>
                    <span class="bounty-urgency-tag" style="color: ${urgencyInfo.color};">
                        <i class="fas ${urgencyInfo.icon}"></i> ${urgencyInfo.label}
                    </span>
                </div>
                <h4 class="bounty-title">${this.escapeHtml(bounty.title)}</h4>
                <p class="bounty-desc">${this.escapeHtml(bounty.description)}</p>
                <div class="bounty-meta">
                    ${bounty.reward ? `<span class="bounty-reward"><i class="fas fa-gift"></i> ${this.escapeHtml(bounty.reward)}</span>` : ''}
                    ${bounty.location ? `<span class="bounty-location"><i class="fas fa-location-dot"></i> ${this.escapeHtml(bounty.location)}</span>` : ''}
                </div>
                <div class="bounty-footer">
                    <div class="bounty-publisher">
                        <span class="publisher-avatar" style="background: ${this.getAvatarColor(bounty.publisherName)};">
                            ${bounty.publisherName.charAt(0)}
                        </span>
                        <div class="publisher-info">
                            <span class="publisher-name">${this.escapeHtml(bounty.publisherName)}</span>
                            <span class="publisher-class">${this.escapeHtml(bounty.publisherClass)}</span>
                        </div>
                    </div>
                    <div class="bounty-footer-right">
                        <span class="bounty-time">${timeStr}</span>
                        ${showActions && bounty.status === 'open' ? `
                            <button class="btn btn-sm btn-primary accept-btn" data-bounty-id="${bounty.id}">
                                接单
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    // ==================== 3. 我的悬赏 ====================

    renderMyBounties() {
        const user = App.getCurrentUser();
        const userId = user ? user.id : '';

        const myPublished = HelpData.getMyPublishedBounties(userId);
        const myAccepted = HelpData.getMyAcceptedBounties(userId);

        return `
            <div class="my-bounties-section">
                <!-- 我发布的 -->
                <div class="my-section">
                    <div class="my-section-header">
                        <h3><i class="fas fa-pen-to-square"></i> 我发布的</h3>
                        <span class="my-section-count">${myPublished.length}个</span>
                    </div>
                    ${myPublished.length === 0 ? `
                        <div class="empty-state empty-sm">
                            <i class="fas fa-inbox"></i>
                            <p>还没有发布过悬赏</p>
                        </div>
                    ` : `
                        <div class="bounty-list">
                            ${myPublished.map(b => this.renderMyBountyCard(b, 'published')).join('')}
                        </div>
                    `}
                </div>

                <!-- 我接受的 -->
                <div class="my-section mt-lg">
                    <div class="my-section-header">
                        <h3><i class="fas fa-handshake"></i> 我接受的</h3>
                        <span class="my-section-count">${myAccepted.length}个</span>
                    </div>
                    ${myAccepted.length === 0 ? `
                        <div class="empty-state empty-sm">
                            <i class="fas fa-inbox"></i>
                            <p>还没有接过悬赏</p>
                        </div>
                    ` : `
                        <div class="bounty-list">
                            ${myAccepted.map(b => this.renderMyBountyCard(b, 'accepted')).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    renderMyBountyCard(bounty, type) {
        const catInfo = HelpData.getCategoryInfo(bounty.category);
        const statusInfo = HelpData.getStatusInfo(bounty.status);
        const timeStr = HelpData.formatTime(bounty.createdAt);

        let actionButtons = '';
        if (type === 'published') {
            if (bounty.status === 'open') {
                actionButtons = `
                    <button class="btn btn-sm btn-outline cancel-btn" data-bounty-id="${bounty.id}">
                        <i class="fas fa-times"></i> 取消
                    </button>
                `;
            } else if (bounty.status === 'accepted') {
                actionButtons = `
                    <button class="btn btn-sm btn-primary complete-btn" data-bounty-id="${bounty.id}">
                        <i class="fas fa-check"></i> 确认完成
                    </button>
                `;
            }
        } else if (type === 'accepted') {
            if (bounty.status === 'accepted') {
                actionButtons = `
                    <span class="text-secondary font-bold" style="font-size: var(--font-size-xs);">等待对方确认</span>
                `;
            }
        }

        return `
            <div class="card bounty-card" data-bounty-id="${bounty.id}">
                <div class="bounty-card-header">
                    <span class="bounty-category-tag" style="background: ${catInfo.color}15; color: ${catInfo.color};">
                        <i class="fas ${catInfo.icon}"></i> ${catInfo.label}
                    </span>
                    <span class="bounty-status-tag" style="background: ${statusInfo.bgColor}; color: ${statusInfo.color};">
                        ${statusInfo.label}
                    </span>
                </div>
                <h4 class="bounty-title">${this.escapeHtml(bounty.title)}</h4>
                <p class="bounty-desc">${this.escapeHtml(bounty.description)}</p>
                <div class="bounty-meta">
                    ${bounty.reward ? `<span class="bounty-reward"><i class="fas fa-gift"></i> ${this.escapeHtml(bounty.reward)}</span>` : ''}
                    ${bounty.location ? `<span class="bounty-location"><i class="fas fa-location-dot"></i> ${this.escapeHtml(bounty.location)}</span>` : ''}
                </div>
                ${bounty.acceptorName ? `
                    <div class="bounty-acceptor">
                        <i class="fas fa-user-check"></i> 接单人：${this.escapeHtml(bounty.acceptorName)} · ${this.escapeHtml(bounty.acceptorClass)}
                    </div>
                ` : ''}
                <div class="bounty-footer">
                    <span class="bounty-time">${timeStr}</span>
                    ${actionButtons}
                </div>
            </div>
        `;
    },

    // ==================== 事件绑定 ====================

    bindEvents() {
        // Tab 切换
        document.querySelectorAll('.help-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                const mainContent = document.getElementById('mainContent');
                this.render(mainContent);
            });
        });

        // 发布悬赏表单
        if (this.currentTab === 'publish') {
            this.bindPublishEvents();
        }

        // 悬赏大厅 - 接单
        if (this.currentTab === 'hall') {
            this.bindHallEvents();
        }

        // 我的悬赏
        if (this.currentTab === 'my') {
            this.bindMyBountiesEvents();
        }
    },

    bindPublishEvents() {
        // 分类选择
        let selectedCategory = 'other';
        document.querySelectorAll('#categorySelector .category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('#categorySelector .category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                selectedCategory = chip.dataset.category;
            });
        });
        // 默认选中第一个
        const firstChip = document.querySelector('#categorySelector .category-chip');
        if (firstChip) {
            firstChip.classList.add('active');
            selectedCategory = firstChip.dataset.category;
        }

        // 紧急程度选择
        let selectedUrgency = 'normal';
        document.querySelectorAll('#urgencySelector .urgency-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('#urgencySelector .urgency-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                selectedUrgency = chip.dataset.urgency;
            });
        });
        // 默认选中"普通"
        const normalChip = document.querySelector('#urgencySelector .urgency-chip[data-urgency="normal"]');
        if (normalChip) {
            normalChip.classList.add('active');
            selectedUrgency = 'normal';
        }

        // 提交按钮
        const submitBtn = document.getElementById('submitBountyBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const title = document.getElementById('bountyTitle').value.trim();
                const desc = document.getElementById('bountyDesc').value.trim();
                const reward = document.getElementById('bountyReward').value.trim();
                const location = document.getElementById('bountyLocation').value.trim();
                const deadline = document.getElementById('bountyDeadline').value;

                if (!title) { App.showToast('请输入悬赏标题'); return; }
                if (!desc) { App.showToast('请输入详细描述'); return; }

                const user = App.getCurrentUser();
                const newBounty = HelpData.createBounty({
                    title,
                    description: desc,
                    reward,
                    category: selectedCategory,
                    urgency: selectedUrgency,
                    location,
                    deadline,
                    publisherId: user ? user.id : '',
                    publisherName: user ? user.name : '匿名',
                    publisherClass: user ? user.className : '',
                });

                App.showToast('悬赏发布成功！🎉');
                this.currentTab = 'hall';
                const mainContent = document.getElementById('mainContent');
                this.render(mainContent);
            });
        }
    },

    bindHallEvents() {
        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bountyId = btn.dataset.bountyId;
                const bounty = HelpData.getBounty(bountyId);
                if (!bounty) return;

                const user = App.getCurrentUser();
                if (!user) { App.showToast('请先登录'); return; }

                if (bounty.publisherId === user.id) {
                    App.showToast('不能接自己发布的悬赏哦');
                    return;
                }

                if (confirm(`确定要接「${bounty.title}」这个悬赏吗？`)) {
                    HelpData.acceptBounty(bountyId, {
                        id: user.id,
                        name: user.name,
                        className: user.className,
                    });
                    App.showToast('接单成功！请尽快完成 🤝');
                    this.currentTab = 'my';
                    const mainContent = document.getElementById('mainContent');
                    this.render(mainContent);
                }
            });
        });
    },

    bindMyBountiesEvents() {
        // 取消悬赏
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bountyId = btn.dataset.bountyId;
                if (confirm('确定要取消这个悬赏吗？')) {
                    HelpData.cancelBounty(bountyId);
                    App.showToast('悬赏已取消');
                    const mainContent = document.getElementById('mainContent');
                    this.render(mainContent);
                }
            });
        });

        // 确认完成
        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bountyId = btn.dataset.bountyId;
                if (confirm('确认该悬赏已完成？')) {
                    HelpData.completeBounty(bountyId);
                    App.showToast('悬赏已完成！🎉');
                    const mainContent = document.getElementById('mainContent');
                    this.render(mainContent);
                }
            });
        });
    },

    // ==================== 工具方法 ====================

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    getAvatarColor(name) {
        const colors = ['#6B4226', '#8B5E3C', '#D4953A', '#5B8C5A', '#5B7B8C', '#C06030', '#7B5B8C', '#3D6B6B'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    },

    // ==================== 动态样式 ====================

    addStyles() {
        if (document.getElementById('help-module-styles')) return;

        const style = document.createElement('style');
        style.id = 'help-module-styles';
        style.textContent = `
            /* Tab 导航 */
            .help-tabs {
                display: flex;
                background: var(--color-white);
                border-radius: 14px;
                padding: 4px;
                gap: 4px;
                box-shadow: var(--card-shadow);
                border: 1px solid var(--color-border);
            }
            .help-tab {
                flex: 1;
                padding: 10px 8px;
                border-radius: 11px;
                background: transparent;
                color: var(--color-text-secondary);
                font-size: var(--font-size-sm);
                font-weight: 600;
                transition: all 0.25s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                white-space: nowrap;
                min-height: 42px;
            }
            .help-tab.active {
                background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
                color: var(--color-cream);
                box-shadow: 0 2px 8px rgba(107, 66, 38, 0.25);
            }

            /* 发布表单 */
            .publish-card { padding: var(--spacing-lg); }
            .required { color: var(--color-danger); }
            .category-selector {
                display: flex;
                flex-wrap: wrap;
                gap: var(--spacing-sm);
            }
            .category-chip {
                padding: 8px 14px;
                border-radius: 20px;
                border: 2px solid var(--color-border);
                background: var(--color-cream);
                color: var(--color-text-secondary);
                font-size: var(--font-size-sm);
                font-weight: 500;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 4px;
                min-height: 38px;
            }
            .category-chip.active {
                border-color: var(--color-primary);
                background: var(--color-primary);
                color: var(--color-cream);
            }
            .urgency-selector {
                display: flex;
                gap: var(--spacing-sm);
            }
            .urgency-chip {
                flex: 1;
                padding: 8px 6px;
                border-radius: 20px;
                border: 2px solid var(--color-border);
                background: var(--color-cream);
                color: var(--color-text-secondary);
                font-size: var(--font-size-sm);
                font-weight: 500;
                transition: all 0.2s;
                text-align: center;
                min-height: 38px;
            }
            .urgency-chip.active {
                border-color: var(--color-primary);
                background: var(--color-primary);
                color: var(--color-cream);
            }
            .form-row {
                display: flex;
                gap: var(--spacing-md);
            }
            .form-half {
                flex: 1;
            }

            /* 悬赏大厅 */
            .hall-stats {
                color: var(--color-text-secondary);
                font-size: var(--font-size-sm);
            }
            .hall-stats strong {
                color: var(--color-primary);
            }
            .bounty-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
            }
            .bounty-card {
                padding: var(--spacing-lg);
                cursor: default;
            }
            .bounty-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-sm);
            }
            .bounty-category-tag {
                padding: 3px 10px;
                border-radius: 12px;
                font-size: var(--font-size-xs);
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 3px;
            }
            .bounty-urgency-tag {
                font-size: var(--font-size-xs);
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 3px;
            }
            .bounty-status-tag {
                padding: 3px 10px;
                border-radius: 12px;
                font-size: var(--font-size-xs);
                font-weight: 600;
            }
            .bounty-title {
                font-size: var(--font-size-lg);
                font-weight: 600;
                color: var(--color-text);
                margin-bottom: 6px;
                line-height: 1.4;
            }
            .bounty-desc {
                font-size: var(--font-size-md);
                color: var(--color-text-secondary);
                line-height: 1.5;
                margin-bottom: var(--spacing-md);
            }
            .bounty-meta {
                display: flex;
                flex-wrap: wrap;
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-md);
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
            }
            .bounty-meta span {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .bounty-reward {
                color: var(--color-warning);
                font-weight: 600;
            }
            .bounty-acceptor {
                font-size: var(--font-size-sm);
                color: var(--color-primary);
                margin-bottom: var(--spacing-sm);
                padding: 6px 10px;
                background: var(--color-cream);
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .bounty-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: var(--spacing-md);
                border-top: 1px solid var(--color-cream-dark);
            }
            .bounty-publisher {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            .publisher-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: var(--font-size-sm);
                flex-shrink: 0;
            }
            .publisher-info {
                display: flex;
                flex-direction: column;
            }
            .publisher-name {
                font-weight: 600;
                font-size: var(--font-size-sm);
            }
            .publisher-class {
                font-size: var(--font-size-xs);
                color: var(--color-text-light);
            }
            .bounty-footer-right {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
            }
            .bounty-time {
                font-size: var(--font-size-xs);
                color: var(--color-text-light);
            }
            .accept-btn {
                padding: 6px 16px !important;
                font-size: var(--font-size-sm) !important;
                min-height: 34px !important;
            }

            /* 我的悬赏 */
            .my-section {
                background: var(--color-white);
                border-radius: var(--card-radius);
                border: 1px solid var(--color-border);
                overflow: hidden;
            }
            .my-section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-md) var(--spacing-lg);
                background: var(--color-cream);
                border-bottom: 1px solid var(--color-border);
            }
            .my-section-header h3 {
                font-size: var(--font-size-md);
                font-weight: 700;
                color: var(--color-text);
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .my-section-count {
                font-size: var(--font-size-sm);
                color: var(--color-text-light);
                font-weight: 500;
            }
            .my-section .bounty-list {
                padding: var(--spacing-md);
            }
            .empty-sm {
                padding: var(--spacing-xl) var(--spacing-lg) !important;
            }
            .empty-sm i {
                font-size: 40px !important;
            }
            .empty-sm p {
                font-size: var(--font-size-sm) !important;
            }
            .cancel-btn {
                color: var(--color-danger) !important;
                border-color: var(--color-danger) !important;
            }
        `;
        document.head.appendChild(style);
    }
};
