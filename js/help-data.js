// ===== 校园互助数据层 =====
// V1 MVP：使用 localStorage 存储，为 Supabase 预留接口

const HelpData = {
    // 当前存储引擎：'local' | 'supabase'
    storageEngine: 'local',
    
    // Supabase 预留配置（未来接入时填写）
    supabaseConfig: {
        url: null,
        anonKey: null,
        client: null,
    },

    // ===== 初始化 Supabase（预留） =====
    initSupabase(url, anonKey) {
        // TODO: V2 接入 Supabase
        // this.supabaseConfig.url = url;
        // this.supabaseConfig.anonKey = anonKey;
        // this.supabaseConfig.client = supabase.createClient(url, anonKey);
        // this.storageEngine = 'supabase';
    },

    // ===== 数据操作接口（统一入口，切换存储引擎只需修改内部实现） =====

    // 获取所有悬赏
    getBounties() {
        if (this.storageEngine === 'supabase') {
            return this._getBountiesSupabase();
        }
        return this._getBountiesLocal();
    },

    // 获取单个悬赏
    getBounty(id) {
        const bounties = this.getBounties();
        return bounties.find(b => b.id === id) || null;
    },

    // 创建悬赏
    createBounty(bounty) {
        if (this.storageEngine === 'supabase') {
            return this._createBountySupabase(bounty);
        }
        return this._createBountyLocal(bounty);
    },

    // 接受悬赏
    acceptBounty(id, acceptorInfo) {
        if (this.storageEngine === 'supabase') {
            return this._acceptBountySupabase(id, acceptorInfo);
        }
        return this._acceptBountyLocal(id, acceptorInfo);
    },

    // 取消悬赏
    cancelBounty(id) {
        if (this.storageEngine === 'supabase') {
            return this._cancelBountySupabase(id);
        }
        return this._cancelBountyLocal(id);
    },

    // 完成悬赏
    completeBounty(id) {
        if (this.storageEngine === 'supabase') {
            return this._completeBountySupabase(id);
        }
        return this._completeBountyLocal(id);
    },

    // ===== LocalStorage 实现 =====

    _getBountiesLocal() {
        try {
            const data = localStorage.getItem('baobei_bounties');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('读取悬赏数据失败', e);
            return [];
        }
    },

    _saveBountiesLocal(bounties) {
        try {
            localStorage.setItem('baobei_bounties', JSON.stringify(bounties));
            return true;
        } catch (e) {
            console.warn('保存悬赏数据失败', e);
            return false;
        }
    },

    _createBountyLocal(bounty) {
        const bounties = this._getBountiesLocal();
        const now = new Date();
        const newBounty = {
            id: 'bounty_' + Date.now(),
            title: bounty.title || '',
            description: bounty.description || '',
            reward: bounty.reward || '',
            category: bounty.category || 'other', // 取快递、带饭、借东西、打印、其他
            urgency: bounty.urgency || 'normal',  // urgent, normal, low
            location: bounty.location || '',
            deadline: bounty.deadline || '',
            publisherId: bounty.publisherId || '',
            publisherName: bounty.publisherName || '',
            publisherClass: bounty.publisherClass || '',
            status: 'open', // open, accepted, completed, cancelled
            acceptorId: null,
            acceptorName: null,
            acceptorClass: null,
            createdAt: now.toISOString(),
            acceptedAt: null,
            completedAt: null,
        };
        bounties.unshift(newBounty);
        this._saveBountiesLocal(bounties);
        return newBounty;
    },

    _acceptBountyLocal(id, acceptorInfo) {
        const bounties = this._getBountiesLocal();
        const bounty = bounties.find(b => b.id === id);
        if (!bounty || bounty.status !== 'open') return null;
        bounty.status = 'accepted';
        bounty.acceptorId = acceptorInfo.id;
        bounty.acceptorName = acceptorInfo.name;
        bounty.acceptorClass = acceptorInfo.className;
        bounty.acceptedAt = new Date().toISOString();
        this._saveBountiesLocal(bounties);
        return bounty;
    },

    _cancelBountyLocal(id) {
        const bounties = this._getBountiesLocal();
        const bounty = bounties.find(b => b.id === id);
        if (!bounty) return null;
        bounty.status = 'cancelled';
        this._saveBountiesLocal(bounties);
        return bounty;
    },

    _completeBountyLocal(id) {
        const bounties = this._getBountiesLocal();
        const bounty = bounties.find(b => b.id === id);
        if (!bounty || bounty.status !== 'accepted') return null;
        bounty.status = 'completed';
        bounty.completedAt = new Date().toISOString();
        this._saveBountiesLocal(bounties);
        return bounty;
    },

    // ===== Supabase 接口（预留） =====
    async _getBountiesSupabase() {
        // TODO: const { data, error } = await this.supabaseConfig.client.from('bounties').select('*').order('created_at', { ascending: false });
        throw new Error('Supabase 未接入');
    },
    async _createBountySupabase(bounty) {
        throw new Error('Supabase 未接入');
    },
    async _acceptBountySupabase(id, acceptorInfo) {
        throw new Error('Supabase 未接入');
    },
    async _cancelBountySupabase(id) {
        throw new Error('Supabase 未接入');
    },
    async _completeBountySupabase(id) {
        throw new Error('Supabase 未接入');
    },

    // ===== 辅助方法 =====
    
    // 获取用户的悬赏（我发布的）
    getMyPublishedBounties(userId) {
        return this.getBounties().filter(b => b.publisherId === userId);
    },

    // 获取用户的悬赏（我接受的）
    getMyAcceptedBounties(userId) {
        return this.getBounties().filter(b => b.acceptorId === userId);
    },

    // 获取分类信息
    getCategoryInfo(category) {
        const map = {
            package:   { label: '取快递', icon: 'fa-box',   color: '#D4953A' },
            meal:      { label: '带饭',   icon: 'fa-utensils', color: '#5B8C5A' },
            borrow:    { label: '借东西', icon: 'fa-handshake', color: '#5B7B8C' },
            print:     { label: '打印',   icon: 'fa-print', color: '#8B5E3C' },
            other:     { label: '其他',   icon: 'fa-ellipsis', color: '#8B7355' },
        };
        return map[category] || map['other'];
    },

    // 获取紧急程度信息
    getUrgencyInfo(urgency) {
        const map = {
            urgent: { label: '紧急', color: '#E74C3C', icon: 'fa-circle-exclamation' },
            normal: { label: '普通', color: '#D4953A', icon: 'fa-circle' },
            low:    { label: '不急', color: '#5B8C5A', icon: 'fa-circle-check' },
        };
        return map[urgency] || map['normal'];
    },

    // 获取状态信息
    getStatusInfo(status) {
        const map = {
            open:      { label: '进行中', color: '#5B8C5A', bgColor: '#D4E8D4' },
            accepted:  { label: '已接受', color: '#D4953A', bgColor: '#F5E6D3' },
            completed: { label: '已完成', color: '#5B7B8C', bgColor: '#D4E0F0' },
            cancelled: { label: '已取消', color: '#B8A898', bgColor: '#E8E0D8' },
        };
        return map[status] || map['open'];
    },

    // 格式化时间
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
    { value: 'package', label: '取快递', icon: 'fa-box', desc: '帮忙取个快递' },
    { value: 'meal',    label: '带饭',   icon: 'fa-utensils', desc: '帮忙带份饭' },
    { value: 'borrow',  label: '借东西', icon: 'fa-handshake', desc: '借用一下物品' },
    { value: 'print',   label: '打印',   icon: 'fa-print', desc: '帮忙打印文件' },
    { value: 'other',   label: '其他',   icon: 'fa-ellipsis', desc: '其他互助需求' },
];

const urgencyOptions = [
    { value: 'urgent', label: '紧急', desc: '1小时内' },
    { value: 'normal', label: '普通', desc: '今天内' },
    { value: 'low',    label: '不急', desc: '三天内' },
];
