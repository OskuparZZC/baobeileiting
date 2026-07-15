# 爆杯雷霆项目状态

## 当前版本
**V2.1 Phase 3.3 完成**

## 技术架构

### 前端
- HTML5 + CSS3 + 原生 JavaScript (ES6+)
- 页面：dashboard / records / collection / community / leaderboard / profile / help
- 数据层：`localStorage` 持久化 + `drinkMenu` 本地静态数据作为 fallback

### 后端
- Node.js + Express
- MySQL 8.0（腾讯云）
- 鉴权：dev 模式走 `x-user-id` header，production 预留 JWT

---

## 已完成模块

### 饮品系统
| 功能 | 状态 |
|---|---|
| 饮品数据库 (`drink_brands` + `drinks`) | ✅ |
| 品牌系统（40+ 品牌） | ✅ |
| 搜索功能 (`GET /api/drinks/search`) | ✅ |
| 瑞幸饮品扩充（5 个 seed 文件，约 100+ 款） | ✅ |
| 魔爪品牌及饮品（9 款） | ✅ |
| 后端加载优先，失败回退 `drinkMenu` | ✅ |
| 自定义饮品（customBrand/customName） | ✅ |

### 用户系统
| 功能 | 状态 |
|---|---|
| 前端用户系统（`App.users`，localStorage） | ✅ |
| 后端 UUID 用户（`users` 表） | ✅ |
| 前端用户自动绑定后端（`ensureBackendUser()`） | ✅ |
| 学号冲突自动重试（409 → 备用学号） | ✅ |
| `_backendId` 持久化到 localStorage | ✅ |

### 记录系统
| 功能 | 状态 |
|---|---|
| `POST /api/records` 创建记录 | ✅ |
| `GET /api/records/me` 查询我的记录 | ✅ |
| `DELETE /api/records/:id` 删除记录 | ✅ |
| 支持 `time` 字段 | ✅ |
| localStorage + MySQL 双写（`_syncRecordToBackend()`） | ✅ |
| 后端记录同步到前端（`syncRecordsFromBackend()`） | ✅ |
| 后端 record → 前端格式转换（`_normalizeBackendRecord()`） | ✅ |
| 后端同步失败自动回退 localStorage | ✅ |

---

## 数据库状态

### 表结构（11 张表）

| 表名 | 用途 | 状态 |
|---|---|---|
| `drink_brands` | 饮品品牌 | ✅ 已启用 |
| `drinks` | 饮品基础信息 | ✅ 已启用 |
| `users` | 用户基本信息 | ✅ 已启用 |
| `user_stats` | 用户游戏化统计 | ⬜ 表已建，前端未使用 |
| `records` | 饮品记录 | ✅ 已启用 |
| `user_collections` | 用户图鉴收集 | ⬜ 表已建，前端未使用 |
| `bounties` | 校园悬赏 | ⬜ 表已建，前端使用 localStorage |
| `daily_tasks` | 每日任务 | ⬜ 表已建，前端使用 localStorage |
| `user_sessions` | 登录会话 | ⬜ 预留 |
| `achievements` | 成就定义 | ⬜ 预留 |
| `user_achievements` | 用户成就进度 | ⬜ 预留 |

### 种子数据

| 数据 | 数量 |
|---|---|
| 品牌数 (`drink_brands`) | 45 个（含 40 个基础 + 魔爪 + 4 个校园/自定义） |
| 饮品总数 (`drinks`) | 约 250+ 款（主 seed 文件约 250 款） |
| 瑞幸饮品 | 约 100-150 款（5 个 seed 文件，含重复 `INSERT IGNORE`） |
| 魔爪饮品 | 9 款 |

### 运行状态
- `users` 表：通过 `ensureBackendUser()` 自动注册，与前端用户 1:1 绑定
- `records` 表：通过 `_syncRecordToBackend()` 双写，通过 `syncRecordsFromBackend()` 回读
- `drink_brands` / `drinks`：通过 seed SQL 初始化

---

## 已解决问题

### 1. API 加载顺序问题
- **问题**：`App.init()` 中 `loadDrinks()` 异步加载饮品数据，但 `loadCurrentUserData()` 是同步的，导致首次加载时 records 的 `drinkName` 可能为空
- **解决**：`loadDrinks()` 设为异步 fire-and-forget，不影响 init 流程；`getDrinkDisplayName()` 有 `drinkName` fallback

### 2. 品牌和饮品异步加载问题
- **问题**：后端加载的饮品需要关联 `brand_id` 显示品牌名，但品牌也是异步加载
- **解决**：`getDrinkDisplayName()` 同时依赖 `this.drinks` 和 `this.brands`，缺失时使用 `drink.name` 作为 fallback

### 3. CORS x-user-id 问题
- **问题**：浏览器报 `Request header field x-user-id is not allowed by Access-Control-Allow-Headers`
- **解决**：`backend/src/config/cors.js` 第 18 行 `allowedHeaders` 增加 `x-user-id`

### 4. 前后端用户 ID 不一致问题
- **问题**：前端用 `"user_1"` 格式 ID，后端用 UUID v4，无法直接关联
- **解决**：`ensureBackendUser()` 自动调用 `POST /api/users/register` 注册后端用户，将返回的 UUID 存为 `user._backendId`，后续所有 API 用此 UUID

### 5. 后端 record 缺少 drinkName/category 问题
- **问题**：后端 `records` 表不存储 `drinkName` 和 `category`，但前端 Records 页面渲染依赖这两个字段
- **解决**：`_normalizeBackendRecord()` 根据 `drinkId` 从 `this.drinks`/`drinkMenu` 查找补全 `drinkName` 和 `category`

---

## 下一阶段计划

### Phase 4：游戏化系统后端化

| Phase | 内容 | 预计改动 |
|---|---|---|
| **4.1** | 图鉴系统后端化 | `user_collections` 表读写，`collection.js` 适配 |
| **4.2** | XP 和等级系统后端化 | `user_stats` 表读写，`xp`/`level` 同步 |
| **4.3** | 排行榜真实数据化 | 基于 `user_stats` 的排行榜 API |

---

## 开发原则

- ✅ 保留 localStorage fallback（后端不可用时前端仍可用）
- ✅ 小步修改，每 Phase 独立可测
- ✅ 每个 Phase 完成后测试 + Git 提交
- ✅ 增量修改，不重构已有稳定代码
- ✅ 静默失败（后端同步失败不影响前端体验）

---

## Git 提交历史（最近 10 次）

| 提交 | 说明 |
|---|---|
| `816df55` | 完成 Phase 3.3 前后端记录同步 |
| `6e9c0f1` | Add V2.1.2 database schema migration and drink seed data |
| `90e698d` | V2.1 Phase 2A complete records API with MySQL |
| `264a3c7` | V2.1 Phase 2A migrate user system to MySQL |
| `8264252` | V2.1 Phase 1.5C MySQL schema and connection test completed |
| `4a2695f` | V2.1 Phase 1.5A MySQL connection infrastructure completed |
| `8b243b0` | chore: ignore AI-Agent-Website test project |
| `6bf8501` | V2.1 Phase 1 用户认证系统完成 |
| `5852d50` | V2.0.1 校园互助体验升级 |
| `ca61711` | V2.1 Phase 0 后端基础框架完成 |

---

*最后更新：2026-07-13*
