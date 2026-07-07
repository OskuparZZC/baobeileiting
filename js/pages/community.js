// ===== 饮品评论社区页 =====

const Community = {

    render(container) {
        container.innerHTML = `
            <!-- 页面标题 -->
            <div class="page-header mb-lg">
                <h2 class="page-title">💬 饮品社区</h2>
                <p class="text-secondary">发现同学们都在喝什么</p>
            </div>

            <!-- 搜索栏 -->
            <div class="community-search mb-lg">
                <div class="search-input-wrapper">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" class="search-input" placeholder="搜索饮品、店铺..." id="communitySearch">
                </div>
                <button class="btn btn-sm btn-primary" id="newPostBtn">
                    <i class="fas fa-pen"></i> 发帖
                </button>
            </div>

            <!-- 热门话题 -->
            <div class="topic-scroll mb-lg">
                <button class="topic-chip active" data-topic="all">全部</button>
                <button class="topic-chip" data-topic="hot">🔥 热门</button>
                <button class="topic-chip" data-topic="coffee">☕ 咖啡</button>
                <button class="topic-chip" data-topic="milk_tea">🧋 奶茶</button>
                <button class="topic-chip" data-topic="tea">🍵 茶饮</button>
                <button class="topic-chip" data-topic="juice">🧃 果汁</button>
                <button class="topic-chip" data-topic="new">💡 新品</button>
            </div>

            <!-- 帖子列表 -->
            <div class="posts-list" id="postsList">
                ${this.renderPosts()}
            </div>
        `;

        this.bindEvents();
        this.addStyles();
    },

    renderPosts(topic = 'all') {
        let posts = App.posts;

        // 话题筛选
        if (topic === 'hot') {
            posts = [...posts].sort((a, b) => b.likes - a.likes);
        } else if (topic !== 'all' && topic !== 'new') {
            posts = posts.filter(p => p.category === topic);
        } else if (topic === 'new') {
            posts = [...posts].sort((a, b) => b.id - a.id);
        }

        if (posts.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h4>暂无帖子</h4>
                    <p>快来分享你的饮品体验吧！</p>
                </div>
            `;
        }

        return posts.map(post => {
            const cat = App.getCategoryInfo(post.category);
            const stars = Array(5).fill(0).map((_, i) =>
                i < post.rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'
            ).join('');

            const avatarColor = this.getAvatarColor(post.user.name);

            return `
                <div class="post-card card" data-post-id="${post.id}">
                    <div class="post-header">
                        <div class="post-user-avatar" style="background: ${avatarColor};">
                            ${post.user.name.charAt(0)}
                        </div>
                        <div class="post-user-info">
                            <span class="post-username">${post.user.name}</span>
                            <span class="post-dept">${post.user.className}</span>
                        </div>
                        <span class="post-time">${post.time}</span>
                    </div>
                    <div class="post-drink-tag">
                        <span class="tag tag-${post.category}">
                            <i class="fas ${cat.icon}"></i> ${cat.label}
                        </span>
                        <span class="post-drink-name">${post.drinkName}</span>
                        <span class="post-rating-stars">${stars}</span>
                    </div>
                    <p class="post-content">${post.content}</p>
                    <div class="post-actions">
                        <button class="post-action-btn ${post.liked ? 'liked' : ''}" data-post-id="${post.id}" data-action="like">
                            <i class="${post.liked ? 'fas' : 'far'} fa-heart"></i>
                            <span class="like-count">${post.likes}</span>
                        </button>
                        <button class="post-action-btn" data-post-id="${post.id}" data-action="comment">
                            <i class="far fa-comment"></i>
                            <span>${post.comments}</span>
                        </button>
                        <button class="post-action-btn" data-post-id="${post.id}" data-action="share">
                            <i class="far fa-share-square"></i>
                            <span>分享</span>
                        </button>
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

    currentTopic: 'all',

    bindEvents() {
        // 点赞 - 不重新渲染整个页面，直接操作DOM
        document.querySelectorAll('[data-action="like"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = parseInt(btn.dataset.postId);
                const post = App.posts.find(p => p.id === postId);
                if (!post) return;

                // 切换点赞状态
                post.liked = !post.liked;
                post.likes += post.liked ? 1 : -1;

                // 更新按钮样式
                btn.classList.toggle('liked', post.liked);
                const icon = btn.querySelector('i');
                icon.className = post.liked ? 'fas fa-heart' : 'far fa-heart';

                // 更新数字
                const countSpan = btn.querySelector('.like-count');
                if (countSpan) countSpan.textContent = post.likes;

                // 添加心跳动画
                if (post.liked) {
                    icon.style.animation = 'none';
                    icon.offsetHeight;
                    icon.style.animation = 'heartBeat 0.4s ease';
                }

                // Toast
                App.showToast(post.liked ? '❤️ 已点赞' : '已取消点赞');
            });
        });

        // 评论按钮
        document.querySelectorAll('[data-action="comment"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = parseInt(btn.dataset.postId);
                const post = App.posts.find(p => p.id === postId);
                if (post) {
                    App.showToast(`正在查看「${post.drinkName}」的评论 (${post.comments}条)`);
                }
            });
        });

        // 分享按钮
        document.querySelectorAll('[data-action="share"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = parseInt(btn.dataset.postId);
                const post = App.posts.find(p => p.id === postId);
                if (post) {
                    App.showToast(`已复制「${post.drinkName}」的分享链接 📋`);
                }
            });
        });

        // 发帖按钮
        const newPostBtn = document.getElementById('newPostBtn');
        if (newPostBtn) {
            newPostBtn.addEventListener('click', () => {
                // 模拟发帖，给予 XP 奖励
                const result = App.addXP(5, '发布社区评价');
                if (result.leveledUp) {
                    App.showXPToast(`🎉 发布评价 +${result.xpGained}XP！升级到 Lv.${result.newLevel} ${result.newTitle}！`);
                } else {
                    App.showXPToast(`💬 发布社区评价 +${result.xpGained}XP`);
                }
                App.showToast('发帖功能即将上线，敬请期待！📝');
            });
        }

        // 话题筛选
        document.querySelectorAll('.topic-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.topic-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentTopic = chip.dataset.topic;

                // 只更新帖子列表区域
                const postsList = document.getElementById('postsList');
                if (postsList) {
                    postsList.innerHTML = this.renderPosts(this.currentTopic);
                    this.bindEvents(); // 重新绑定事件
                }
            });
        });

        // 搜索功能
        const searchInput = document.getElementById('communitySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                const postCards = document.querySelectorAll('.post-card');
                postCards.forEach(card => {
                    const content = card.textContent.toLowerCase();
                    if (query === '' || content.includes(query)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        }
    },

    addStyles() {
        if (document.getElementById('community-styles')) return;

        const style = document.createElement('style');
        style.id = 'community-styles';
        style.textContent = `
            .community-search { display: flex; gap: var(--spacing-sm); }
            .search-input-wrapper { flex: 1; position: relative; display: flex; align-items: center; }
            .search-icon { position: absolute; left: 12px; color: var(--color-text-light); font-size: var(--font-size-md); }
            .search-input { width: 100%; padding: 10px 12px 10px 36px; border: 2px solid var(--color-border); border-radius: 25px; background: var(--color-white); font-size: var(--font-size-md); color: var(--color-text); transition: border-color 0.2s; -webkit-appearance: none; }
            .search-input:focus { border-color: var(--color-primary); }
            .topic-scroll { display: flex; gap: var(--spacing-sm); overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
            .topic-scroll::-webkit-scrollbar { display: none; }
            .topic-chip { flex-shrink: 0; padding: 8px 16px; border-radius: 20px; background: var(--color-white); color: var(--color-text-secondary); font-size: var(--font-size-sm); font-weight: 500; border: 1.5px solid var(--color-border); transition: all 0.2s; min-height: 36px; -webkit-tap-highlight-color: transparent; }
            .topic-chip.active { background: var(--color-primary); color: var(--color-cream); border-color: var(--color-primary); }
            .posts-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
            .post-card { padding: var(--spacing-lg); }
            .post-header { display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md); }
            .post-user-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: var(--font-size-md); flex-shrink: 0; }
            .post-user-info { flex: 1; display: flex; flex-direction: column; }
            .post-username { font-weight: 600; font-size: var(--font-size-md); }
            .post-dept { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .post-time { font-size: var(--font-size-xs); color: var(--color-text-light); }
            .post-drink-tag { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); }
            .post-drink-name { font-weight: 600; color: var(--color-primary); font-size: var(--font-size-sm); }
            .post-rating-stars { font-size: 12px; color: #F0C040; }
            .post-content { font-size: var(--font-size-md); color: var(--color-text); line-height: 1.6; margin-bottom: var(--spacing-md); }
            .post-actions { display: flex; gap: var(--spacing-xl); padding-top: var(--spacing-md); border-top: 1px solid var(--color-cream-dark); }
            .post-action-btn { display: flex; align-items: center; gap: 4px; background: none; color: var(--color-text-light); font-size: var(--font-size-md); transition: all 0.2s; padding: 8px 12px; border-radius: 8px; min-height: 44px; -webkit-tap-highlight-color: transparent; }
            .post-action-btn:hover { background: var(--color-cream); }
            .post-action-btn:active { background: var(--color-cream); transform: scale(0.92); }
            .post-action-btn.liked { color: #E74C3C; }
            @keyframes heartBeat { 0% { transform: scale(1); } 30% { transform: scale(1.4); } 60% { transform: scale(0.9); } 100% { transform: scale(1); } }
        `;
        document.head.appendChild(style);
    }
};
