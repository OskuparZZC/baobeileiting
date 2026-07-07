// ===== AI 饮品推荐引擎 =====
// 基于用户历史记录分析偏好，给出个性化推荐

const AIRecommendEngine = {

    /**
     * 核心推荐算法
     * 综合多维度分析：品类偏好、评分偏好、时间模式、价格区间、季节因素、探索度
     */
    analyze(records, menu) {
        if (!records || records.length === 0) {
            return this._coldStartRecommend(menu);
        }

        // 1. 品类偏好分析
        const categoryScores = this._analyzeCategoryPreference(records);

        // 2. 评分偏好分析
        const highRatedDrinks = this._analyzeHighRated(records);

        // 3. 时间模式分析（早/中/晚习惯）
        const timePattern = this._analyzeTimePattern(records);

        // 4. 价格偏好分析
        const priceRange = this._analyzePriceRange(records);

        // 5. 最近喝过的饮品（用于排除）
        const recentDrinkIds = records.slice(0, 5).map(r => r.drinkId);

        // 6. 候选饮品打分
        const candidates = menu
            .filter(d => !recentDrinkIds.includes(d.id)) // 排除最近喝过的
            .map(drink => {
                let score = 0;
                const reasons = [];

                // 品类匹配加分
                const catScore = categoryScores[drink.category] || 0;
                score += catScore * 40;
                if (catScore > 0.15) {
                    reasons.push(this._getCategoryReason(drink.category, catScore));
                }

                // 高评分相似饮品加分
                if (highRatedDrinks.includes(drink.id)) {
                    score += 20;
                    reasons.push('你之前给过类似饮品高分评价');
                }

                // 价格匹配加分
                const priceMatch = this._priceMatchScore(drink.basePrice, priceRange);
                score += priceMatch * 15;
                if (priceMatch > 0.7) {
                    reasons.push('价格在你习惯的消费范围内');
                }

                // 时间场景适配加分
                const timeScore = this._timeMatchScore(drink.category, timePattern);
                score += timeScore * 15;
                if (timeScore > 0.6) {
                    reasons.push(this._getTimeReason(timePattern));
                }

                // 探索奖励：适当推荐未尝试过的品类
                if (!categoryScores[drink.category] || categoryScores[drink.category] < 0.1) {
                    score += 8;
                    reasons.push('尝试新品类，换换口味');
                }

                // 季节因素
                const seasonScore = this._seasonMatchScore(drink);
                score += seasonScore * 10;
                if (seasonScore > 0.7) {
                    reasons.push(this._getSeasonReason());
                }

                return { ...drink, score, reasons };
            });

        // 按分数降序排列
        candidates.sort((a, b) => b.score - a.score);

        // 取前3名，加入一些随机性避免每次推荐相同
        const topPool = candidates.slice(0, Math.min(5, candidates.length));
        const pick = topPool[Math.floor(Math.random() * Math.min(3, topPool.length))];

        return this._buildRecommendation(pick, records, categoryScores);
    },

    /**
     * 冷启动推荐（新用户无历史记录时）
     */
    _coldStartRecommend(menu) {
        // 根据当前季节推荐
        const seasonDrinks = menu.filter(d => this._seasonMatchScore(d) > 0.5);
        const pool = seasonDrinks.length > 0 ? seasonDrinks : menu;
        const pick = pool[Math.floor(Math.random() * pool.length)];

        const cat = categoryMap[pick.category] || categoryMap['other'];
        return {
            drink: pick,
            categoryInfo: cat,
            reason: '这是当前季节的热门饮品，非常适合初次尝试！',
            detailReasons: [
                '根据季节为你精心挑选',
                '校园热门款，大家都在喝',
                '入门友好，接受度高'
            ],
            confidence: 75,
            matchTags: ['新手推荐', '季节之选'],
        };
    },

    /**
     * 分析品类偏好权重
     */
    _analyzeCategoryPreference(records) {
        const total = records.length;
        const counts = {};
        records.forEach(r => {
            counts[r.category] = (counts[r.category] || 0) + 1;
        });

        const scores = {};
        Object.keys(counts).forEach(cat => {
            scores[cat] = counts[cat] / total;
        });
        return scores;
    },

    /**
     * 找出用户高评分(>=4)的饮品ID
     */
    _analyzeHighRated(records) {
        const highRatedIds = records
            .filter(r => r.rating >= 4)
            .map(r => r.drinkId);

        // 找出同品类中高评分饮品
        const highCat = {};
        records.filter(r => r.rating >= 4).forEach(r => {
            if (!highCat[r.category]) highCat[r.category] = [];
            highCat[r.category].push(r.drinkId);
        });

        // 返回同品类高评分饮品的同品类其他饮品
        const result = new Set();
        Object.values(highCat).forEach(ids => {
            ids.forEach(id => {
                const drink = drinkMenu.find(d => d.id === id);
                if (drink) {
                    drinkMenu
                        .filter(d => d.category === drink.category && d.id !== id)
                        .forEach(d => result.add(d.id));
                }
            });
        });
        return [...result];
    },

    /**
     * 分析用户饮用时间模式
     */
    _analyzeTimePattern(records) {
        const hours = records.map(r => parseInt(r.time.split(':')[0]));
        const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;

        if (avgHour < 10) return 'morning';
        if (avgHour < 14) return 'noon';
        if (avgHour < 17) return 'afternoon';
        return 'evening';
    },

    /**
     * 分析价格偏好区间
     */
    _analyzePriceRange(records) {
        const prices = records.map(r => r.price);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return { avg, min, max };
    },

    /**
     * 价格匹配度打分
     */
    _priceMatchScore(price, range) {
        if (price >= range.min && price <= range.max) return 1.0;
        if (price < range.min) {
            const diff = range.min - price;
            return Math.max(0, 1 - diff / range.min);
        }
        const diff = price - range.max;
        return Math.max(0, 1 - diff / range.max);
    },

    /**
     * 时间场景匹配打分
     */
    _timeMatchScore(category, timePattern) {
        const morningFav = ['coffee', 'tea'];
        const noonFav = ['juice', 'tea', 'soda'];
        const afternoonFav = ['milk_tea', 'coffee', 'juice'];
        const eveningFav = ['milk_tea', 'tea', 'juice'];

        const map = {
            morning: morningFav,
            noon: noonFav,
            afternoon: afternoonFav,
            evening: eveningFav,
        };

        const fav = map[timePattern] || afternoonFav;
        const idx = fav.indexOf(category);
        return idx >= 0 ? 1 - idx * 0.15 : 0.4;
    },

    /**
     * 季节匹配打分
     */
    _seasonMatchScore(drink) {
        const month = new Date().getMonth() + 1; // 1-12
        const cat = drink.category;

        // 夏季 (6-8月): 冷萃、果汁、汽水、茶饮
        if (month >= 6 && month <= 8) {
            if (drink.name.includes('冷萃') || drink.name.includes('冰')) return 1.0;
            if (cat === 'juice' || cat === 'soda') return 0.9;
            if (cat === 'tea' && (drink.name.includes('柠檬') || drink.name.includes('绿'))) return 0.85;
            if (cat === 'milk_tea') return 0.5;
            if (cat === 'coffee' && drink.name.includes('美式')) return 0.6;
            return 0.4;
        }

        // 冬季 (12-2月): 热咖啡、奶茶、抹茶
        if (month === 12 || month <= 2) {
            if (cat === 'coffee' && (drink.name.includes('拿铁') || drink.name.includes('摩卡') || drink.name.includes('卡布奇诺'))) return 1.0;
            if (cat === 'milk_tea' && drink.name.includes('芋泥')) return 0.95;
            if (cat === 'milk_tea') return 0.85;
            if (cat === 'coffee') return 0.8;
            if (drink.name.includes('抹茶')) return 0.9;
            if (cat === 'juice') return 0.2;
            return 0.5;
        }

        // 春秋季：均衡
        return 0.7;
    },

    /**
     * 品类偏好推荐理由
     */
    _getCategoryReason(category, score) {
        const cat = categoryMap[category];
        const label = cat ? cat.label : category;
        if (score > 0.3) return `你最爱喝${label}，这款很适合你`;
        if (score > 0.15) return `你经常喝${label}品类`;
        return `属于你偏好的${label}品类`;
    },

    /**
     * 时间模式推荐理由
     */
    _getTimeReason(pattern) {
        const map = {
            morning: '适合早上提神醒脑',
            noon: '午餐搭配刚好合适',
            afternoon: '下午茶时间的绝佳选择',
            evening: '晚间放松的好伴侣',
        };
        return map[pattern] || '符合你的饮用习惯';
    },

    /**
     * 季节推荐理由
     */
    _getSeasonReason() {
        const month = new Date().getMonth() + 1;
        if (month >= 6 && month <= 8) return '夏日清凉解暑首选';
        if (month === 12 || month <= 2) return '冬日暖身暖心推荐';
        if (month >= 3 && month <= 5) return '春日清新之选';
        return '秋日温润之选';
    },

    /**
     * 构建最终推荐结果
     */
    _buildRecommendation(pick, records, categoryScores) {
        if (!pick) return this._coldStartRecommend(drinkMenu);

        const cat = categoryMap[pick.category] || categoryMap['other'];
        const topCat = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0];
        const topCatInfo = categoryMap[topCat[0]] || {};

        // 生成主推荐理由
        const mainReason = pick.reasons.length > 0
            ? pick.reasons[0]
            : '根据你的口味偏好智能推荐';

        // 计算匹配置信度
        const confidence = Math.min(98, Math.round(pick.score * 1.2 + 55));

        // 生成匹配标签
        const matchTags = [];
        if (pick.score > 50) matchTags.push('高度匹配');
        else if (pick.score > 30) matchTags.push('较匹配');
        if (topCatInfo.label) matchTags.push(`${topCatInfo.label}偏好`);
        const sizePref = this._analyzeSizePreference(records);
        if (sizePref) matchTags.push(`${sizePref}推荐`);

        return {
            drink: pick,
            categoryInfo: cat,
            reason: mainReason,
            detailReasons: pick.reasons.slice(0, 4),
            confidence,
            matchTags: matchTags.slice(0, 3),
            preferenceSummary: {
                topCategory: topCatInfo.label || '未知',
                topCategoryPercent: Math.round((topCat[1] || 0) * 100),
                avgRating: (records.reduce((s, r) => s + r.rating, 0) / records.length).toFixed(1),
                totalAnalyzed: records.length,
            }
        };
    },

    /**
     * 分析容量偏好
     */
    _analyzeSizePreference(records) {
        const counts = { small: 0, medium: 0, large: 0 };
        records.forEach(r => { counts[r.size] = (counts[r.size] || 0) + 1; });
        const max = Math.max(counts.small, counts.medium, counts.large);
        if (max === 0) return null;
        if (counts.large === max) return '大杯';
        if (counts.medium === max) return '中杯';
        return '小杯';
    },

    /**
     * 获取推荐结果（供外部调用）
     */
    getRecommendation() {
        return this.analyze(App.records, drinkMenu);
    },

    /**
     * 刷新推荐（加入随机种子，可得到不同结果）
     */
    refreshRecommendation() {
        // 通过随机种子扰动，获得不同推荐
        const shuffled = [...App.records].sort(() => Math.random() - 0.5);
        const subset = shuffled.slice(0, Math.max(3, Math.floor(shuffled.length * 0.7)));
        return this.analyze(subset, drinkMenu);
    },

    /**
     * 生成用户饮品画像 —— AI饮品管家核心分析
     * @param {Array} records - 用户所有饮品记录
     * @param {Object} collection - 用户图鉴收藏数据
     * @returns {Object} 完整饮品画像
     */
    analyzeUserProfile(records, collection) {
        if (!records || records.length === 0) {
            return this._emptyProfile();
        }

        // 1. 品类偏好深度分析
        const categoryAnalysis = this._deepCategoryAnalysis(records);

        // 2. 消费特征分析
        const spendingAnalysis = this._spendingAnalysis(records);

        // 3. 评分习惯分析
        const ratingAnalysis = this._ratingAnalysis(records);

        // 4. 时间模式分析
        const timeAnalysis = this._timeAnalysis(records);

        // 5. 图鉴探索度
        const collectionAnalysis = this._collectionAnalysis(collection);

        // 6. 杯型偏好
        const sizeAnalysis = this._sizeAnalysis(records);

        // 7. 确定人格类型
        const personality = this._determinePersonality(categoryAnalysis, spendingAnalysis, ratingAnalysis, collectionAnalysis, records.length);

        // 8. 生成AI建议
        const aiAdvice = this._generateAdvice(personality, categoryAnalysis, spendingAnalysis, collectionAnalysis, records.length);

        return {
            personality,
            categoryAnalysis,
            spendingAnalysis,
            ratingAnalysis,
            timeAnalysis,
            collectionAnalysis,
            sizeAnalysis,
            aiAdvice,
            totalRecords: records.length,
            generatedAt: new Date().toISOString(),
        };
    },

    // 空画像（新用户）
    _emptyProfile() {
        return {
            personality: {
                typeName: '饮品新人',
                emoji: '🌱',
                title: '初入饮品世界',
                summary: '你的饮品之旅才刚刚开始，还有无限可能等待探索！',
                tags: ['新手', '待探索'],
                color: '#5B8C5A',
            },
            categoryAnalysis: null,
            spendingAnalysis: null,
            ratingAnalysis: null,
            timeAnalysis: null,
            collectionAnalysis: { unlockedCount: 0, totalCount: drinkMenu.length, progressPercent: 0, title: '探索者' },
            sizeAnalysis: null,
            aiAdvice: [
                { icon: 'fa-compass', text: '从热门饮品开始尝试，找到你的口味偏好' },
                { icon: 'fa-star', text: '记录饮品时记得评分，AI会更好地了解你' },
                { icon: 'fa-trophy', text: '完成每日任务和图鉴收集，解锁更多成就' },
            ],
            totalRecords: 0,
            generatedAt: new Date().toISOString(),
        };
    },

    // 深度品类分析
    _deepCategoryAnalysis(records) {
        const total = records.length;
        const counts = {};
        const ratingSums = {};
        const ratingCounts = {};

        records.forEach(r => {
            counts[r.category] = (counts[r.category] || 0) + 1;
            ratingSums[r.category] = (ratingSums[r.category] || 0) + (r.rating || 0);
            ratingCounts[r.category] = (ratingCounts[r.category] || 0) + 1;
        });

        const categories = Object.keys(categoryMap).map(key => {
            const count = counts[key] || 0;
            const avgRating = count > 0 ? (ratingSums[key] / ratingCounts[key]).toFixed(1) : '0.0';
            const catInfo = categoryMap[key];
            return {
                category: key,
                label: catInfo.label,
                icon: catInfo.icon,
                color: catInfo.color,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
                avgRating,
            };
        }).sort((a, b) => b.count - a.count);

        const top = categories[0];
        const diversity = categories.filter(c => c.count > 0).length;

        return {
            categories,
            topCategory: top,
            totalCategories: categories.length,
            activeCategories: diversity,
            diversityLabel: diversity >= 4 ? '口味广泛' : diversity >= 2 ? '口味适中' : '口味专一',
            diversityScore: Math.min(100, Math.round((diversity / categories.length) * 100)),
        };
    },

    // 消费特征分析
    _spendingAnalysis(records) {
        const prices = records.map(r => r.price || 0).filter(p => p > 0);
        if (prices.length === 0) return null;

        const total = prices.reduce((a, b) => a + b, 0);
        const avg = total / prices.length;
        const sorted = [...prices].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        let level, levelColor;
        if (avg >= 20) { level = '高端享受型'; levelColor = '#C06030'; }
        else if (avg >= 14) { level = '中端品质型'; levelColor = '#D4953A'; }
        else if (avg >= 8) { level = '经济实惠型'; levelColor = '#5B8C5A'; }
        else { level = '节俭达人'; levelColor = '#5B7B8C'; }

        // 计算消费波动
        const variance = prices.reduce((s, p) => s + (p - avg) ** 2, 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        const stability = stdDev < 3 ? '稳定' : stdDev < 6 ? '适度波动' : '灵活多变';

        return {
            totalSpent: total,
            avgPrice: parseFloat(avg.toFixed(1)),
            minPrice: min,
            maxPrice: max,
            level,
            levelColor,
            stability,
            rangeLabel: `${min}-${max}元`,
        };
    },

    // 评分习惯分析
    _ratingAnalysis(records) {
        const rated = records.filter(r => r.rating > 0);
        if (rated.length === 0) return null;

        const avg = rated.reduce((s, r) => s + r.rating, 0) / rated.length;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        rated.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

        let style, styleColor;
        if (avg >= 4.2) { style = '慷慨好评家'; styleColor = '#5B8C5A'; }
        else if (avg >= 3.5) { style = '温和点评家'; styleColor = '#D4953A'; }
        else if (avg >= 2.5) { style = '严苛评审官'; styleColor = '#C0392B'; }
        else { style = '毒舌鉴赏家'; styleColor = '#8B5B5B'; }

        return {
            avgRating: parseFloat(avg.toFixed(1)),
            distribution,
            style,
            styleColor,
            totalRated: rated.length,
            ratePercent: Math.round((rated.length / records.length) * 100),
        };
    },

    // 时间分析
    _timeAnalysis(records) {
        const hours = records.map(r => parseInt(r.time.split(':')[0])).filter(h => !isNaN(h));
        if (hours.length === 0) return null;

        const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;
        const periodCounts = { morning: 0, noon: 0, afternoon: 0, evening: 0 };
        hours.forEach(h => {
            if (h < 10) periodCounts.morning++;
            else if (h < 14) periodCounts.noon++;
            else if (h < 17) periodCounts.afternoon++;
            else periodCounts.evening++;
        });

        const periods = [
            { key: 'morning', label: '早晨', icon: 'fa-sun', range: '6:00-10:00', count: periodCounts.morning },
            { key: 'noon', label: '中午', icon: 'fa-sun', range: '10:00-14:00', count: periodCounts.noon },
            { key: 'afternoon', label: '下午', icon: 'fa-cloud-sun', range: '14:00-17:00', count: periodCounts.afternoon },
            { key: 'evening', label: '晚间', icon: 'fa-moon', range: '17:00+', count: periodCounts.evening },
        ].sort((a, b) => b.count - a.count);

        const primePeriod = periods[0];
        const avgHourRounded = Math.round(avgHour);

        return {
            avgHour: avgHourRounded,
            avgTimeLabel: `${avgHourRounded}:00左右`,
            primePeriod,
            periods,
            pattern: this._analyzeTimePattern(records),
        };
    },

    // 图鉴分析
    _collectionAnalysis(collection) {
        const totalCount = drinkMenu.length;
        const unlockedCount = collection ? Object.keys(collection).length : 0;
        const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

        let title, titleColor;
        if (progressPercent >= 90) { title = '图鉴大师'; titleColor = '#D4953A'; }
        else if (progressPercent >= 60) { title = '资深收藏家'; titleColor = '#C06030'; }
        else if (progressPercent >= 30) { title = '进阶探索者'; titleColor = '#5B8C5A'; }
        else if (progressPercent > 0) { title = '初涉图鉴'; titleColor = '#6B4226'; }
        else { title = '探索者'; titleColor = '#8B7355'; }

        // 按品类统计解锁情况
        const byCategory = {};
        Object.keys(categoryMap).forEach(key => {
            const total = drinkMenu.filter(d => d.category === key).length;
            const unlocked = collection
                ? drinkMenu.filter(d => d.category === key && collection[d.id]).length
                : 0;
            byCategory[key] = { total, unlocked, catInfo: categoryMap[key] };
        });

        return {
            unlockedCount,
            totalCount,
            progressPercent,
            title,
            titleColor,
            byCategory,
        };
    },

    // 杯型分析
    _sizeAnalysis(records) {
        const counts = { small: 0, medium: 0, large: 0 };
        records.forEach(r => { counts[r.size] = (counts[r.size] || 0) + 1; });
        const total = counts.small + counts.medium + counts.large;
        if (total === 0) return null;

        const maxKey = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const labels = { small: '小杯', medium: '中杯', large: '大杯' };

        return {
            favorite: labels[maxKey],
            distribution: {
                small: { label: '小杯', percent: Math.round((counts.small / total) * 100), count: counts.small },
                medium: { label: '中杯', percent: Math.round((counts.medium / total) * 100), count: counts.medium },
                large: { label: '大杯', percent: Math.round((counts.large / total) * 100), count: counts.large },
            },
        };
    },

    // 确定人格类型
    _determinePersonality(catAnalysis, spendAnalysis, ratingAnalysis, collAnalysis, totalRecords) {
        const topCat = catAnalysis.topCategory;
        const diversity = catAnalysis.activeCategories;

        // 基础人格类型
        let typeName, emoji, summary, color;
        const tags = [];

        if (topCat.category === 'coffee') {
            typeName = '咖啡因战士';
            emoji = '☕';
            summary = '代码和咖啡是你最好的伙伴，醇苦中品味人生。';
            color = '#6B4226';
            tags.push('咖啡控');
        } else if (topCat.category === 'milk_tea') {
            typeName = '奶茶狂魔';
            emoji = '🧋';
            summary = '珍珠椰果芋泥，小料拉满才是正义！';
            color = '#C06030';
            tags.push('奶茶控');
        } else if (topCat.category === 'tea') {
            typeName = '茶道中人';
            emoji = '🍵';
            summary = '品茗如品人生，于茶香中寻得片刻宁静。';
            color = '#5B8C5A';
            tags.push('茶饮控');
        } else if (topCat.category === 'juice') {
            typeName = '维C达人';
            emoji = '🍊';
            summary = '健康生活从一杯鲜榨开始，养生扛把子！';
            color = '#E8953A';
            tags.push('果汁控');
        } else if (topCat.category === 'soda') {
            typeName = '气泡爱好者';
            emoji = '🥤';
            summary = '滋滋的气泡声就是你的快乐源泉！';
            color = '#5B7B8C';
            tags.push('汽水控');
        } else {
            typeName = '探索先锋';
            emoji = '🔮';
            summary = '不设边界，勇于尝试各种新奇饮品！';
            color = '#8B7355';
            tags.push('探索家');
        }

        // 复合标签
        if (diversity >= 4) tags.push('口味广泛');
        else if (diversity <= 2 && totalRecords > 3) tags.push('专一长情');

        if (spendAnalysis) {
            if (spendAnalysis.level === '高端享受型') tags.push('品质至上');
            else if (spendAnalysis.level === '经济实惠型') tags.push('精打细算');
        }

        if (ratingAnalysis && ratingAnalysis.avgRating >= 4) tags.push('慷慨好评');
        if (collAnalysis.progressPercent >= 50) tags.push('图鉴达人');

        // 复合人格名称
        let title;
        if (diversity >= 4 && spendAnalysis && spendAnalysis.avgPrice >= 18) {
            title = '品鉴大师';
            summary = '涉猎广泛且品味不俗，你是真正的饮品鉴赏家。';
            emoji = '🎩';
        } else if (diversity >= 4) {
            title = '冒险家';
            summary = '不挑不拣，什么都想试，饮品世界的探险家！';
            emoji = '🗺️';
        } else if (diversity <= 2 && totalRecords > 5) {
            title = '忠实信徒';
            summary = '弱水三千只取一瓢，对最爱品类忠心耿耿。';
        } else {
            title = typeName;
        }

        return {
            typeName,
            emoji,
            title,
            summary,
            tags,
            color,
        };
    },

    // 生成AI建议
    _generateAdvice(personality, catAnalysis, spendAnalysis, collAnalysis, totalRecords) {
        const advice = [];

        // 基于品类偏好的建议
        const topCat = catAnalysis.topCategory;
        if (topCat && topCat.count > 0) {
            const otherDrinks = drinkMenu.filter(d => d.category === topCat.category);
            const triedIds = new Set();
            // 需要从外部获取已尝试的ID，这里用简单估算
            const untriedInFav = otherDrinks.length;
            if (untriedInFav > 0) {
                advice.push({
                    icon: 'fa-heart',
                    text: `你最爱${topCat.label}，还有更多同品类饮品等你去发现`,
                });
            }
        }

        // 基于探索度的建议
        if (collAnalysis.progressPercent < 30) {
            advice.push({
                icon: 'fa-compass',
                text: `图鉴仅解锁了${collAnalysis.progressPercent}%，尝试不同品类会有惊喜`,
            });
        } else if (collAnalysis.progressPercent >= 60) {
            advice.push({
                icon: 'fa-trophy',
                text: `图鉴已解锁${collAnalysis.progressPercent}%，继续收集解锁更高称号`,
            });
        }

        // 基于消费的建议
        if (spendAnalysis) {
            if (spendAnalysis.avgPrice >= 20) {
                advice.push({
                    icon: 'fa-gem',
                    text: '你偏好高品质饮品，偶尔试试平价好物也许有新发现',
                });
            } else {
                advice.push({
                    icon: 'fa-piggy-bank',
                    text: '你的消费很理性，偶尔犒劳自己一杯贵的也不错',
                });
            }
        }

        // 基于多样性的建议
        if (catAnalysis.activeCategories <= 2 && totalRecords > 5) {
            const untriedCats = catAnalysis.categories.filter(c => c.count === 0);
            if (untriedCats.length > 0) {
                const suggestCat = untriedCats[Math.floor(Math.random() * untriedCats.length)];
                advice.push({
                    icon: 'fa-lightbulb',
                    text: `试试${suggestCat.label}品类吧，开拓你的饮品视野`,
                });
            }
        }

        return advice.slice(0, 4);
    },
};
