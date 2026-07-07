// ===== Collection 饮品图鉴 =====

const Collection = {
    currentView: 'grid', // 'grid' | 'detail'
    detailDrinkId: null,

    render(container) {
        const data = App.getCollectionData();
        this.addStyles();

        if (this.currentView === 'detail' && this.detailDrinkId) {
            this.renderDetail(container, data);
            return;
        }

        this.currentView = 'grid';
        container.innerHTML = `
            <!-- 图鉴头部统计 -->
            <div class="collection-header mb-lg">
                <div class="collection-header-top">
                    <h2 class="collection-title">
                        <i class="fas fa-book-open"></i> 饮品图鉴
                    </h2>
                    <span class="collection-badge">${data.title}</span>
                </div>
                <div class="collection-stats-row">
                    <div class="collection-stat-item">
                        <span class="collection-stat-num">${data.unlockedCount}</span>
                        <span class="collection-stat-label">已收集</span>
                    </div>
                    <div class="collection-stat-divider"></div>
                    <div class="collection-stat-item">
                        <span class="collection-stat-num">${data.totalCount}</span>
                        <span class="collection-stat-label">总图鉴</span>
                    </div>
                    <div class="collection-stat-divider"></div>
                    <div class="collection-stat-item">
                        <span class="collection-stat-num">${data.progressPercent}%</span>
                        <span class="collection-stat-label">收集率</span>
                    </div>
                </div>
                <div class="collection-progress-bar">
                    <div class="collection-progress-fill" style="width: ${data.progressPercent}%;">
                        <span class="collection-progress-text">${data.progressPercent}%</span>
                    </div>
                </div>
            </div>

            <!-- 品类统计 -->
            <div class="collection-categories mb-lg">
                ${this.renderCategoryStats(data.categoryStats)}
            </div>

            <!-- Tab 切换 -->
            <div class="collection-tabs mb-md">
                <button class="collection-tab active" data-tab="unlocked">
                    <i class="fas fa-check-circle"></i> 已解锁 (${data.unlockedCount})
                </button>
                <button class="collection-tab" data-tab="locked">
                    <i class="fas fa-lock"></i> 未解锁 (${data.totalCount - data.unlockedCount})
                </button>
            </div>

            <!-- 已解锁列表 -->
            <div class="collection-list" id="collectionUnlocked">
                ${data.unlockedCount > 0 ? this.renderUnlockedList(data.unlockedList) : this.renderEmptyState()}
            </div>

            <!-- 未解锁列表（默认隐藏） -->
            <div class="collection-list" id="collectionLocked" style="display:none;">
                ${this.renderLockedList(data.lockedList)}
            </div>
        `;

        this.bindEvents(data);
    },

    renderUnlockedList(list) {
        return list.map(d => {
            const catInfo = App.getCategoryInfo(d.category);
            return `
                <div class="collection-card unlocked" data-drink-id="${d.drinkId}">
                    <div class="collection-card-icon" style="background: ${catInfo.color};">
                        <i class="fas ${catInfo.icon}"></i>
                    </div>
                    <div class="collection-card-info">
                        <div class="collection-card-name">${d.drinkName}</div>
                        <div class="collection-card-meta">
                            <span class="collection-card-tag" style="color: ${catInfo.color}; background: ${catInfo.color}15;">
                                ${catInfo.label}
                            </span>
                            <span class="collection-card-tried">品尝 ${d.timesTried} 次</span>
                        </div>
                        <div class="collection-card-date">
                            <i class="fas fa-calendar-check"></i> ${d.unlockedAt} 发现
                        </div>
                    </div>
                    <div class="collection-card-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderLockedList(list) {
        if (list.length === 0) {
            return `
                <div class="collection-empty">
                    <div class="collection-empty-icon">🏆</div>
                    <p class="collection-empty-title">图鉴已集齐！</p>
                    <p class="collection-empty-desc">你已经发现所有官方饮品，太厉害了！</p>
                </div>
            `;
        }
        return list.map(d => {
            const catInfo = App.getCategoryInfo(d.category);
            return `
                <div class="collection-card locked">
                    <div class="collection-card-icon locked-icon">
                        <i class="fas fa-question"></i>
                    </div>
                    <div class="collection-card-info">
                        <div class="collection-card-name locked-name">???</div>
                        <div class="collection-card-meta">
                            <span class="collection-card-tag locked-tag" style="color: ${catInfo.color}55; background: ${catInfo.color}10;">
                                ${catInfo.label}
                            </span>
                            <span class="collection-card-tried">尚未品尝</span>
                        </div>
                        <div class="collection-card-date locked-hint">
                            <i class="fas fa-lock"></i> 去校园探索发现吧！
                        </div>
                    </div>
                    <div class="collection-card-arrow">
                        <i class="fas fa-lock" style="opacity:0.3;"></i>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderEmptyState() {
        return `
            <div class="collection-empty">
                <div class="collection-empty-icon">🔍</div>
                <p class="collection-empty-title">还没有发现任何饮品</p>
                <p class="collection-empty-desc">快去记录你的第一杯饮品，开启图鉴之旅吧！</p>
            </div>
        `;
    },

    renderCategoryStats(categoryStats) {
        return Object.entries(categoryStats).map(([key, stat]) => {
            const pct = stat.total > 0 ? Math.round((stat.unlocked / stat.total) * 100) : 0;
            return `
                <div class="cat-stat-item">
                    <div class="cat-stat-header">
                        <span class="cat-stat-icon" style="background: ${stat.info.color};">
                            <i class="fas ${stat.info.icon}"></i>
                        </span>
                        <span class="cat-stat-label">${stat.info.label}</span>
                        <span class="cat-stat-count">${stat.unlocked}/${stat.total}</span>
                    </div>
                    <div class="cat-stat-bar">
                        <div class="cat-stat-fill" style="width: ${pct}%; background: ${stat.info.color};"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderDetail(container, data) {
        const did = this.detailDrinkId;
        const drink = drinkMenu.find(d => d.id === did);
        const catInfo = drink ? App.getCategoryInfo(drink.category) : App.getCategoryInfo('other');
        const collection = data.unlockedList.find(d => d.drinkId === did);

        // 获取该饮品的统计
        const records = App.records.filter(r => r.drinkId === did);
        const avgRating = records.length > 0
            ? (records.reduce((s, r) => s + r.rating, 0) / records.length).toFixed(1)
            : '0.0';
        const totalSpent = records.reduce((s, r) => s + r.price, 0);

        container.innerHTML = `
            <!-- 返回按钮 -->
            <div class="detail-back-bar mb-md">
                <button class="detail-back-btn" id="collectionBackBtn">
                    <i class="fas fa-arrow-left"></i> 返回图鉴
                </button>
            </div>

            <!-- 饮品详情卡片 -->
            <div class="card collection-detail-card mb-lg">
                <div class="detail-icon-section" style="background: linear-gradient(135deg, ${catInfo.color}, ${catInfo.color}dd);">
                    <i class="fas ${catInfo.icon} detail-drink-icon"></i>
                    <span class="detail-category-tag">${catInfo.label}</span>
                </div>
                <div class="detail-info-section">
                    <h2 class="detail-drink-name">${drink ? drink.name : '未知饮品'}</h2>
                    ${collection ? `<p class="detail-unlock-date"><i class="fas fa-calendar-star"></i> ${collection.unlockedAt} 首次发现</p>` : ''}
                    <div class="detail-stats-grid">
                        <div class="detail-stat">
                            <span class="detail-stat-value">${collection ? collection.timesTried : 0}</span>
                            <span class="detail-stat-label">品尝次数</span>
                        </div>
                        <div class="detail-stat">
                            <span class="detail-stat-value">${avgRating}</span>
                            <span class="detail-stat-label">平均评分</span>
                        </div>
                        <div class="detail-stat">
                            <span class="detail-stat-value">${App.formatPrice(drink ? drink.basePrice : 0)}</span>
                            <span class="detail-stat-label">参考价格</span>
                        </div>
                        <div class="detail-stat">
                            <span class="detail-stat-value">${App.formatPrice(totalSpent)}</span>
                            <span class="detail-stat-label">累计花费</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 最近记录 -->
            ${records.length > 0 ? `
            <div class="card mb-lg">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-history"></i> 最近记录
                    </h3>
                </div>
                <div class="detail-records-list">
                    ${records.slice(0, 10).map(r => {
                        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                        return `
                        <div class="detail-record-item">
                            <div class="detail-record-left">
                                <span class="detail-record-date">${r.date}</span>
                                <span class="detail-record-size">${r.size === 'large' ? '大杯' : r.size === 'small' ? '小杯' : '中杯'}</span>
                            </div>
                            <div class="detail-record-right">
                                <span class="detail-record-rating">${stars}</span>
                                <span class="detail-record-price">${App.formatPrice(r.price)}</span>
                            </div>
                            ${r.note ? `<div class="detail-record-note">${r.note}</div>` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}
        `;

        document.getElementById('collectionBackBtn').addEventListener('click', () => {
            this.currentView = 'grid';
            this.detailDrinkId = null;
            this.render(container);
        });
    },

    bindEvents(data) {
        // Tab 切换
        document.querySelectorAll('.collection-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.collection-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const tabName = tab.dataset.tab;
                document.getElementById('collectionUnlocked').style.display = tabName === 'unlocked' ? 'block' : 'none';
                document.getElementById('collectionLocked').style.display = tabName === 'locked' ? 'block' : 'none';
            });
        });

        // 点击已解锁饮品进入详情
        document.querySelectorAll('.collection-card.unlocked').forEach(card => {
            card.addEventListener('click', () => {
                this.currentView = 'detail';
                this.detailDrinkId = parseInt(card.dataset.drinkId);
                const container = document.getElementById('mainContent');
                this.render(container);
            });
        });
    },

    addStyles() {
        if (document.getElementById('collection-styles')) return;

        const style = document.createElement('style');
        style.id = 'collection-styles';
        style.textContent = `
            /* 图鉴头部 */
            .collection-header {
                background: linear-gradient(135deg, #6B4226, #8B5E3C);
                border-radius: var(--radius-lg, 16px);
                padding: 20px;
                color: #fff;
            }
            .collection-header-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            .collection-title {
                font-size: 20px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #fff;
            }
            .collection-badge {
                background: rgba(255,255,255,0.2);
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                -webkit-backdrop-filter: blur(4px);
                backdrop-filter: blur(4px);
            }

            /* 统计行 */
            .collection-stats-row {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 24px;
                margin-bottom: 16px;
            }
            .collection-stat-item {
                text-align: center;
            }
            .collection-stat-num {
                display: block;
                font-size: 24px;
                font-weight: 800;
            }
            .collection-stat-label {
                font-size: 12px;
                opacity: 0.8;
            }
            .collection-stat-divider {
                width: 1px;
                height: 36px;
                background: rgba(255,255,255,0.2);
            }

            /* 进度条 */
            .collection-progress-bar {
                background: rgba(255,255,255,0.15);
                border-radius: 10px;
                height: 24px;
                overflow: hidden;
                position: relative;
            }
            .collection-progress-fill {
                background: linear-gradient(90deg, #F0A830, #F7D060);
                height: 100%;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding-right: 8px;
                transition: width 0.5s ease;
                min-width: 40px;
            }
            .collection-progress-text {
                font-size: 11px;
                font-weight: 700;
                color: #6B4226;
                white-space: nowrap;
            }

            /* 品类统计 */
            .collection-categories {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            .cat-stat-item {
                background: var(--color-bg-card, #fff);
                border-radius: 10px;
                padding: 10px 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            }
            .cat-stat-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 6px;
            }
            .cat-stat-icon {
                width: 24px;
                height: 24px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 11px;
            }
            .cat-stat-label {
                font-size: 12px;
                font-weight: 600;
                color: #555;
                flex: 1;
            }
            .cat-stat-count {
                font-size: 11px;
                font-weight: 700;
                color: #999;
            }
            .cat-stat-bar {
                background: #f0f0f0;
                border-radius: 4px;
                height: 4px;
                overflow: hidden;
            }
            .cat-stat-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 0.5s ease;
            }

            /* Tab */
            .collection-tabs {
                display: flex;
                gap: 8px;
            }
            .collection-tab {
                flex: 1;
                padding: 10px;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                background: #fff;
                font-size: 14px;
                font-weight: 600;
                color: #888;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                min-height: 44px;
                -webkit-tap-highlight-color: transparent;
            }
            .collection-tab.active {
                border-color: #6B4226;
                color: #6B4226;
                background: #6B422610;
            }
            .collection-tab:hover {
                border-color: #6B4226;
            }
            .collection-tab:active {
                border-color: #6B4226;
                transform: scale(0.97);
            }

            /* 图鉴卡片 */
            .collection-card {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px;
                background: var(--color-bg-card, #fff);
                border-radius: 12px;
                margin-bottom: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                cursor: pointer;
                transition: transform 0.15s, box-shadow 0.15s;
            }
            .collection-card.unlocked:hover {
                transform: translateY(-1px);
                box-shadow: 0 3px 12px rgba(0,0,0,0.08);
            }
            .collection-card.unlocked:active {
                transform: scale(0.98);
            }
            .collection-card.locked {
                cursor: default;
                opacity: 0.7;
            }

            .collection-card-icon {
                width: 44px;
                height: 44px;
                min-width: 44px;
                min-height: 44px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 20px;
                flex-shrink: 0;
            }
            .collection-card-icon.locked-icon {
                background: #ddd !important;
                color: #aaa;
            }

            .collection-card-info {
                flex: 1;
                min-width: 0;
            }
            .collection-card-name {
                font-size: 15px;
                font-weight: 600;
                color: #333;
                margin-bottom: 4px;
            }
            .collection-card-name.locked-name {
                color: #bbb;
            }
            .collection-card-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 3px;
            }
            .collection-card-tag {
                font-size: 11px;
                padding: 1px 8px;
                border-radius: 10px;
                font-weight: 500;
            }
            .collection-card-tag.locked-tag {
                opacity: 0.6;
            }
            .collection-card-tried {
                font-size: 11px;
                color: #aaa;
            }
            .collection-card-date {
                font-size: 11px;
                color: #999;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .collection-card-date.locked-hint {
                color: #ccc;
                font-style: italic;
            }
            .collection-card-arrow {
                color: #ccc;
                font-size: 14px;
                flex-shrink: 0;
            }

            /* 空状态 */
            .collection-empty {
                text-align: center;
                padding: 40px 20px;
            }
            .collection-empty-icon {
                font-size: 48px;
                margin-bottom: 12px;
            }
            .collection-empty-title {
                font-size: 16px;
                font-weight: 600;
                color: #666;
                margin-bottom: 6px;
            }
            .collection-empty-desc {
                font-size: 13px;
                color: #999;
            }

            /* 详情页 */
            .detail-back-bar {
                display: flex;
            }
            .detail-back-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 10px 16px;
                border: none;
                background: #f5f5f5;
                border-radius: 8px;
                font-size: 14px;
                color: #555;
                cursor: pointer;
                transition: background 0.2s;
                min-height: 44px;
                -webkit-tap-highlight-color: transparent;
            }
            .detail-back-btn:hover {
                background: #e8e8e8;
            }
            .detail-back-btn:active {
                background: #e8e8e8;
                transform: scale(0.96);
            }

            .collection-detail-card {
                overflow: hidden;
            }
            .detail-icon-section {
                padding: 32px 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 10px;
                color: #fff;
            }
            .detail-drink-icon {
                font-size: 48px;
                opacity: 0.9;
            }
            .detail-category-tag {
                background: rgba(255,255,255,0.25);
                padding: 4px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                -webkit-backdrop-filter: blur(4px);
                backdrop-filter: blur(4px);
            }
            .detail-info-section {
                padding: 20px;
            }
            .detail-drink-name {
                font-size: 22px;
                font-weight: 700;
                color: #333;
                margin-bottom: 6px;
            }
            .detail-unlock-date {
                font-size: 13px;
                color: #6B4226;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .detail-stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            .detail-stat {
                text-align: center;
                background: #f8f8f8;
                border-radius: 10px;
                padding: 12px 8px;
            }
            .detail-stat-value {
                display: block;
                font-size: 18px;
                font-weight: 700;
                color: #6B4226;
            }
            .detail-stat-label {
                font-size: 11px;
                color: #999;
            }

            /* 最近记录列表 */
            .detail-records-list {
                padding: 0 4px;
            }
            .detail-record-item {
                padding: 10px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            .detail-record-item:last-child {
                border-bottom: none;
            }
            .detail-record-left {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }
            .detail-record-date {
                font-size: 13px;
                color: #666;
                font-weight: 500;
            }
            .detail-record-size {
                font-size: 11px;
                background: #f0f0f0;
                padding: 1px 8px;
                border-radius: 8px;
                color: #999;
            }
            .detail-record-right {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .detail-record-rating {
                font-size: 12px;
                color: #F0A830;
                letter-spacing: 1px;
            }
            .detail-record-price {
                font-size: 13px;
                font-weight: 600;
                color: #6B4226;
            }
            .detail-record-note {
                font-size: 12px;
                color: #aaa;
                margin-top: 2px;
                padding-left: 2px;
            }
        `;
        document.head.appendChild(style);
    },
};
