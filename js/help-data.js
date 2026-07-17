// ===== 校园互助数据层 =====
// V2：使用后端 API 作为主数据源
// V1 遗留：localStorage 存储已移除，保留 Supabase 预留接口为兼容注释

const HelpData = {
    // 当前用户的后端 ID（dev 模式下用作 x-user-id 请求头）
    _xUserId: null,

    /**
     * 设置当前用户（在页面初始化时调用）
     * 正式模式：token 由 api.auth 自动管理，可不调用此方法
     * 开发模式：需传入后端用户 ID 用于 x-user-id 请求头
     * @param {string} xUserId - 后端用户 ID (UUID)
     */
    setCurrentUser(xUserId) {
        this._xUserId = xUserId;
    },

    // ===== 数据操作接口 =====

    /**
     * 获取悬赏列表
     * @param {Object} [filters] - 可选筛选 { status?, category?, urgency? }
     * @returns {Promise<Array>} 悬赏数组
     */
    async getBounties(filters = {}) {
        try {
            const res = await api.bounties.list(filters);
            return res.data || [];
        } catch (e) {
            console.warn('获取悬赏列表失败:', e.message);
            return [];
        }
    },

    /**
     * 获取单个悬赏
     * @param {number|string} id - 悬赏 ID
     * @returns {Promise<Object|null>} 悬赏对象或 null
     */
    async getBounty(id) {
        try {
            const res = await api.bounties.getById(id);
            return res.data || null;
        } catch (e) {
            console.warn('获取悬赏详情失败:', e.message);
            return null;
        }
    },

    /**
     * 创建悬赏
     * 注意：publisherId 由后端通过 token 获取，前端传入的 publisherId 会被忽略
     * @param {Object} bounty - { title, description, reward?, category?, urgency?, location?, deadline? }
     * @returns {Promise<Object>} 新创建的悬赏对象
     */
    async createBounty(bounty) {
        const res = await api.bounties.create(bounty, this._xUserId);
        return res.data;
    },

    /**
     * 接受悬赏
     * @param {number|string} id - 悬赏 ID
     * @param {Object} [acceptorInfo] - 保留兼容参数，实际接口人由 token 获取
     * @returns {Promise<Object|null>} 更新后的悬赏或 null
     */
    async acceptBounty(id, acceptorInfo) {
        try {
            const res = await api.bounties.accept(id, this._xUserId);
            return res.data;
        } catch (e) {
            console.warn('接单失败:', e.message);
            return null;
        }
    },

    /**
     * 取消悬赏
     * @param {number|string} id - 悬赏 ID
     * @returns {Promise<Object|null>} 更新后的悬赏或 null
     */
    async cancelBounty(id) {
        try {
            const res = await api.bounties.cancel(id, this._xUserId);
            return res.data;
        } catch (e) {
            console.warn('取消悬赏失败:', e.message);
            return null;
        }
    },

    /**
     * 完成悬赏（发布者确认完成）
     * @param {number|string} id - 悬赏 ID
     * @returns {Promise<Object|null>} 更新后的悬赏或 null
     */
    async completeBounty(id) {
        try {
            const res = await api.bounties.complete(id, this._xUserId);
            return res.data;
        } catch (e) {
            console.warn('完成悬赏失败:', e.message);
            return null;
        }
    },

    /**
     * 接单者提交完成申请（accepted → submitted）
     * @param {number|string} id - 悬赏 ID
     * @returns {Promise<Object|null>} 更新后的悬赏或 null
     */
    async submitComplete(id) {
        try {
            const res = await api.bounties.submit(id, this._xUserId);
            return res.data;
        } catch (e) {
            console.warn('提交完成失败:', e.message);
            return null;
        }
    },

    // ===== 用户相关查询 =====

    /**
     * 获取用户的悬赏（我发布的）
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    async getMyPublishedBounties(userId) {
        const bounties = await this.getBounties();
        return bounties.filter(b => b.publisherId === userId);
    },

    /**
     * 获取用户的悬赏（我接受的）
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    async getMyAcceptedBounties(userId) {
        const bounties = await this.getBounties();
        return bounties.filter(b => b.acceptorId === userId);
    },

    // ===== 辅助方法（纯函数，不变） =====

    /**
     * 获取分类信息
     * @param {string} category
     * @returns {{ label: string, icon: string, color: string }}
     */
    getCategoryInfo(category) {
        const map = {
            package:   { label: '跑腿', icon: 'fa-box',   color: '#D4953A' },
            meal:      { label: '代购', icon: 'fa-utensils', color: '#5B8C5A' },
            borrow:    { label: '学习', icon: 'fa-handshake', color: '#5B7B8C' },
            print:     { label: '打印', icon: 'fa-print', color: '#8B5E3C' },
            other:     { label: '其他', icon: 'fa-ellipsis', color: '#8B7355' },
        };
        return map[category] || map['other'];
    },

    /**
     * 获取紧急程度信息
     * @param {string} urgency
     * @returns {{ label: string, color: string, icon: string }}
     */
    getUrgencyInfo(urgency) {
        const map = {
            urgent: { label: '紧急', color: '#E74C3C', icon: 'fa-circle-exclamation' },
            normal: { label: '普通', color: '#D4953A', icon: 'fa-circle' },
            low:    { label: '不急', color: '#5B8C5A', icon: 'fa-circle-check' },
        };
        return map[urgency] || map['normal'];
    },

    /**
     * 获取状态信息
     * @param {string} status
     * @returns {{ label: string, color: string, bgColor: string }}
     */
    getStatusInfo(status) {
        const map = {
            open:      { label: '进行中',  color: '#5B8C5A', bgColor: '#D4E8D4' },
            accepted:  { label: '已接受',  color: '#D4953A', bgColor: '#F5E6D3' },
            submitted: { label: '待确认',  color: '#C06030', bgColor: '#FCE4D6' },
            completed: { label: '已完成',  color: '#5B7B8C', bgColor: '#D4E0F0' },
            cancelled: { label: '已取消',  color: '#B8A898', bgColor: '#E8E0D8' },
        };
        return map[status] || map['open'];
    },

    /**
     * 格式化时间（相对时间）
     * @param {string} isoStr - ISO 时间字符串
     * @returns {string} 格式化后的相对时间
     */
    formatTime(isoStr) {
        if (!isoStr) return '';
        const date = new Date(isoStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return '刚刚';
        if (diffMin < 60) return `${diffMin}分钟前`;
        if (diffHour < 24) return `${diffHour}小时前`;
        if (diffDay < 7) return `${diffDay}天前`;

        const m = date.getMonth() + 1;
        const d = date.getDate();
        return `${m}月${d}日`;
    },
};

// ===== 分类定义 =====
const bountyCategories = [
    { value: 'package', label: '跑腿', icon: 'fa-box', desc: '帮忙取快递、跑腿' },
    { value: 'meal',    label: '代购', icon: 'fa-utensils', desc: '帮忙带饭、代购东西' },
    { value: 'borrow',  label: '学习', icon: 'fa-handshake', desc: '借东西、学习互助' },
    { value: 'other',   label: '其他', icon: 'fa-ellipsis', desc: '其他互助需求' },
];

const urgencyOptions = [
    { value: 'urgent', label: '紧急', desc: '1小时内' },
    { value: 'normal', label: '普通', desc: '今天内' },
    { value: 'low',    label: '不急', desc: '三天内' },
];
