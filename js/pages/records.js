// ===== 饮品记录页 =====

const Records = {
    currentFilter: 'all',
    currentSort: 'date-desc',

    render(container) {
        const filteredRecords = this.getFilteredRecords();

        container.innerHTML = `
            <!-- 页面标题 -->
            <div class="page-header mb-lg">
                <h2 class="page-title">📝 饮品记录</h2>
                <p class="text-secondary">共 ${filteredRecords.length} 条记录</p>
            </div>

            <!-- 筛选栏 -->
            <div class="filter-section mb-lg">
                <div class="filter-scroll" id="categoryFilter">
                    <button class="filter-chip active" data-filter="all">全部</button>
                    ${Object.entries(categoryMap).map(([key, val]) => `
                        <button class="filter-chip" data-filter="${key}">
                            <i class="fas ${val.icon}"></i> ${val.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- 排序 -->
            <div class="sort-bar mb-lg">
                <span class="text-secondary" style="font-size: var(--font-size-sm);">排序：</span>
                <button class="sort-btn active" data-sort="date-desc">最新</button>
                <button class="sort-btn" data-sort="date-asc">最早</button>
                <button class="sort-btn" data-sort="price-desc">价格↓</button>
                <button class="sort-btn" data-sort="price-asc">价格↑</button>
                <button class="sort-btn" data-sort="rating-desc">评分↓</button>
            </div>

            <!-- 记录列表 -->
            <div class="records-list" id="recordsList">
                ${filteredRecords.length === 0 ? this.renderEmpty() : this.renderRecords(filteredRecords)}
            </div>

            <!-- 统计摘要 -->
            ${filteredRecords.length > 0 ? this.renderSummary(filteredRecords) : ''}
        `;

        this.bindFilters();
        this.bindSort();
        this.addStyles();
    },

    getFilteredRecords() {
        let records = [...App.records];

        // 分类筛选
        if (this.currentFilter !== 'all') {
            records = records.filter(r => r.category === this.currentFilter);
        }

        // 排序
        switch (this.currentSort) {
            case 'date-desc':
                records.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
                break;
            case 'date-asc':
                records.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
                break;
            case 'price-desc':
                records.sort((a, b) => b.price - a.price);
                break;
            case 'price-asc':
                records.sort((a, b) => a.price - b.price);
                break;
            case 'rating-desc':
                records.sort((a, b) => b.rating - a.rating);
                break;
        }

        return records;
    },

    renderRecords(records) {
        return records.map(r => {
            const cat = App.getCategoryInfo(r.category);
            const stars = Array(5).fill(0).map((_, i) =>
                i < r.rating ? '<i class="fas fa-star" style="color:#F0C040;"></i>' : '<i class="far fa-star" style="color:#DDD;"></i>'
            ).join('');

            const sizeLabel = r.size === 'large' ? '大杯' : r.size === 'medium' ? '中杯' : '小杯';

            return `
                <div class="record-card card">
                    <div class="record-card-top">
                        <div class="record-icon" style="background: ${cat.color}15;">
                            <i class="fas ${cat.icon}" style="color: ${cat.color};"></i>
                        </div>
                        <div class="record-main">
                            <div class="flex-between">
                                <span class="record-name">${r.drinkName}</span>
                                <span class="record-price">¥${r.price}</span>
                            </div>
                            <div class="record-meta">
                                <span class="tag tag-${r.category}">${cat.label}</span>
                                <span>${sizeLabel}</span>
                                <span class="record-date">${r.date} ${r.time}</span>
                            </div>
                            <div class="record-rating">${stars}</div>
                        </div>
                    </div>
                    ${r.note ? `<p class="record-note">💬 ${r.note}</p>` : ''}
                </div>
            `;
        }).join('');
    },

    renderEmpty() {
        return `
            <div class="empty-state">
                <i class="fas fa-mug-hot"></i>
                <h4>暂无记录</h4>
                <p>点击右下角 + 按钮添加你的第一条饮品记录吧</p>
            </div>
        `;
    },

    renderSummary(records) {
        const totalSpent = records.reduce((sum, r) => sum + r.price, 0);
        const avgRating = (records.reduce((sum, r) => sum + r.rating, 0) / records.length).toFixed(1);

        return `
            <div class="card summary-card mt-lg">
                <div class="card-title mb-md">📊 筛选统计</div>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="summary-value">${records.length}</span>
                        <span class="summary-label">总杯数</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-value">¥${totalSpent.toFixed(2)}</span>
                        <span class="summary-label">总消费</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-value">⭐${avgRating}</span>
                        <span class="summary-label">均分</span>
                    </div>
                </div>
            </div>
        `;
    },

    bindFilters() {
        const filterContainer = document.getElementById('categoryFilter');
        if (!filterContainer) return;

        filterContainer.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                filterContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFilter = chip.dataset.filter;
                const mainContent = document.getElementById('mainContent');
                this.render(mainContent);
            });
        });
    },

    bindSort() {
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSort = btn.dataset.sort;
                const mainContent = document.getElementById('mainContent');
                this.render(mainContent);
            });
        });
    },

    addStyles() {
        if (document.getElementById('records-styles')) return;

        const style = document.createElement('style');
        style.id = 'records-styles';
        style.textContent = `
            .page-header {
                padding-top: var(--spacing-sm);
            }
            .page-title {
                font-size: var(--font-size-xxl);
                font-weight: 700;
                margin-bottom: 4px;
            }
            .filter-section {
                overflow: hidden;
            }
            .filter-scroll {
                display: flex;
                gap: var(--spacing-sm);
                overflow-x: auto;
                padding-bottom: 4px;
                -webkit-overflow-scrolling: touch;
            }
            .filter-scroll::-webkit-scrollbar {
                display: none;
            }
            .filter-chip {
                flex-shrink: 0;
                padding: 8px 16px;
                border-radius: 20px;
                background: var(--color-white);
                color: var(--color-text-secondary);
                font-size: var(--font-size-sm);
                font-weight: 500;
                border: 1.5px solid var(--color-border);
                display: flex;
                align-items: center;
                gap: 4px;
                transition: all 0.2s;
            }
            .filter-chip.active {
                background: var(--color-primary);
                color: var(--color-cream);
                border-color: var(--color-primary);
            }
            .sort-bar {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                flex-wrap: wrap;
            }
            .sort-btn {
                padding: 5px 12px;
                border-radius: 15px;
                background: var(--color-white);
                color: var(--color-text-secondary);
                font-size: var(--font-size-xs);
                border: 1px solid var(--color-border);
                transition: all 0.2s;
            }
            .sort-btn.active {
                background: var(--color-accent-light);
                color: var(--color-primary);
                border-color: var(--color-accent);
                font-weight: 600;
            }
            .record-card {
                padding: var(--spacing-md);
            }
            .record-card-top {
                display: flex;
                gap: var(--spacing-md);
            }
            .record-icon {
                width: 44px;
                height: 44px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                flex-shrink: 0;
            }
            .record-main {
                flex: 1;
                min-width: 0;
            }
            .record-name {
                font-weight: 600;
                font-size: var(--font-size-lg);
            }
            .record-price {
                font-weight: 700;
                color: var(--color-primary);
                font-size: var(--font-size-lg);
            }
            .record-meta {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-top: 4px;
                font-size: var(--font-size-xs);
                color: var(--color-text-secondary);
            }
            .record-rating {
                margin-top: 4px;
                font-size: 13px;
            }
            .record-note {
                margin-top: var(--spacing-md);
                padding: var(--spacing-sm) var(--spacing-md);
                background: var(--color-cream);
                border-radius: 8px;
                font-size: var(--font-size-sm);
                color: var(--color-text-secondary);
                line-height: 1.5;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: var(--spacing-md);
            }
            .summary-item {
                text-align: center;
                padding: var(--spacing-md);
                background: var(--color-cream);
                border-radius: 12px;
            }
            .summary-value {
                display: block;
                font-size: var(--font-size-xl);
                font-weight: 700;
                color: var(--color-primary);
            }
            .summary-label {
                display: block;
                font-size: var(--font-size-xs);
                color: var(--color-text-secondary);
                margin-top: 2px;
            }
        `;
        document.head.appendChild(style);
    }
};
