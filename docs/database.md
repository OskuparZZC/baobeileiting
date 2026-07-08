# 爆杯雷霆 数据库设计文档

> 版本: V2.1 | 目标数据库: MySQL 8.0 | 建表脚本: `backend/sql/schema.sql`

---

## 表总览（11 张表）

| # | 表名 | 职责 | 关联 | 实现阶段 |
|---|------|------|------|----------|
| 1 | `drink_brands` | 饮品品牌基础信息 | drinks.brand_id | Phase 0 |
| 2 | `drinks` | 饮品基础信息（菜单） | records, user_collections | Phase 0 |
| 3 | `users` | 用户基本信息（认证） | 所有业务表 | Phase 1 |
| 4 | `user_stats` | 用户游戏化统计（1:1） | users.id | Phase 1 |
| 5 | `records` | 饮品消费记录 | users, drinks | Phase 2 |
| 6 | `user_collections` | 用户图鉴收集进度 | users, drinks | Phase 4 |
| 7 | `bounties` | 校园互助悬赏 | users(publisher), users(acceptor) | Phase 3 |
| 8 | `daily_tasks` | 每日任务数据 | users | Phase 2 |
| 9 | `user_sessions` | 登录会话/认证 | users | Phase 1 |
| 10 | `achievements` | 成就定义 | user_achievements | 预留 |
| 11 | `user_achievements` | 用户成就进度 | users, achievements | 预留 |

---

## 各表详细说明

### 1. `drink_brands` — 饮品品牌

存储饮品品牌信息，如瑞幸、星巴克、蜜雪冰城等。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT PK | 自增主键 |
| `name` | VARCHAR(100) | 品牌名称 |
| `logo` | VARCHAR(255) | 品牌 logo 图片 URL |
| `description` | TEXT | 品牌简介 |
| `is_active` | TINYINT(1) | 是否启用（0=停用, 1=启用） |
| `sort_order` | INT | 排序权重，越小越靠前 |

**设计要点**：drinks 通过 `brand_id` 关联品牌，删除品牌时 drinks 的 brand_id 设为 NULL（SET NULL），不会删除饮品数据。

---

### 2. `drinks` — 饮品基础信息

饮品菜单主表，所有饮品记录和图鉴都引用此表。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT PK | 自增主键 |
| `brand_id` | INT FK | 所属品牌 → drink_brands.id |
| `name` | VARCHAR(100) | 饮品名称（如"生椰拿铁"） |
| `category` | VARCHAR(50) | 品类：coffee/tea/milk/ice/other |
| `sizes` | JSON | 可选杯型数组：`["小杯","中杯","大杯"]` |
| `base_price` | DECIMAL(8,2) | 基准价格（中杯价格） |
| `caffeine` | VARCHAR(20) | 咖啡因含量描述 |
| `sugar` | VARCHAR(20) | 糖度描述 |
| `icon` | VARCHAR(50) | 饮品图标 emoji |
| `description` | TEXT | 饮品描述 |
| `is_active` | TINYINT(1) | 是否上架 |

**设计要点**：饮品删除时使用 RESTRICT，保护历史记录完整性。

---

### 3. `users` — 用户基本信息

仅存储用户身份和认证相关信息，游戏化数据拆分到 `user_stats`。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT PK | 自增主键 |
| `name` | VARCHAR(50) | 用户名 |
| `class_name` | VARCHAR(100) | 班级（可选） |
| `student_id` | VARCHAR(50) | 学号，**允许为空**，唯一索引 |
| `avatar` | VARCHAR(255) | 头像 URL |
| `password_hash` | VARCHAR(255) | 密码哈希（预留认证） |

**设计要点**：
- `student_id` 允许为 NULL，不强制绑定学号
- 游戏化数据（XP、等级等）独立存储在 `user_stats`

---

### 4. `user_stats` — 用户游戏化统计

与 `users` 1:1 关联，存储高频更新的游戏化数据。

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | INT FK UNIQUE | 关联用户 |
| `level` | INT | 当前等级 |
| `xp` | INT | 当前等级经验值 |
| `total_xp` | INT | 累计总经验值 |
| `continuous_days` | INT | 连续签到天数 |
| `last_record_date` | DATE | 最后记录日期 |
| `total_records` | INT | 饮品记录总数 |
| `total_bounties_published` | INT | 发布悬赏总数 |
| `total_bounties_completed` | INT | 完成悬赏总数 |

**设计要点**：与 users 分离，支持独立优化（如 Redis 缓存排行榜）。

---

### 5. `records` — 饮品消费记录

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | INT FK | 用户 → users.id |
| `drink_id` | INT FK | 饮品 → drinks.id |
| `size` | VARCHAR(20) | 杯型 |
| `price` | DECIMAL(8,2) | 实际支付价格 |
| `rating` | TINYINT | 评分 1-5 |
| `note` | TEXT | 备注 |
| `date` | DATE | 记录日期 |
| `time` | TIME | 记录时间 |

**设计要点**：不再冗余存储饮品名称和品类，通过 JOIN drinks 获取。`(user_id, date)` 联合索引支持按日期查询。

---

### 6. `user_collections` — 用户图鉴

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | INT FK | 用户 |
| `drink_id` | INT FK | 饮品 |
| `unlocked_at` | DATETIME | 首次解锁时间 |
| `times_tried` | INT | 尝试次数 |

**设计要点**：`(user_id, drink_id)` 唯一约束，每个用户对每种饮品只有一条收集记录。

---

### 7. `bounties` — 校园悬赏

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | VARCHAR(200) | 悬赏标题 |
| `description` | TEXT | 详细描述 |
| `category` | VARCHAR(50) | 分类：express/meal/borrow/print/other |
| `urgency` | VARCHAR(20) | 紧急程度：low/normal/high/urgent |
| `location` | VARCHAR(200) | 地点 |
| `deadline` | DATETIME | 截止时间 |
| `reward_type` | VARCHAR(20) | 奖励类型：money/drink/favor/custom |
| `reward_amount` | DECIMAL(8,2) | 奖励金额 |
| `reward_detail` | VARCHAR(200) | 奖励文字描述 |
| `reward_unit` | VARCHAR(20) | 金额单位 |
| `publisher_id` | INT FK | 发布者 |
| `acceptor_id` | INT FK | 接单者 |
| `status` | VARCHAR(20) | 状态：open/accepted/completed/cancelled |
| `view_count` | INT | 浏览次数（预留站内热度） |

**状态流转**：
```
open → accepted → completed
  ↓         ↓
cancelled (仅 open 状态可取消)
```

**设计要点**：`reward_type` + `reward_detail` 支持非金钱奖励（如"一杯奶茶""代拿一次快递"），`view_count` 为未来站内联系和热度排序预留。

---

### 8. `daily_tasks` — 每日任务

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | INT FK | 用户 |
| `date` | DATE | 任务日期 |
| `task_data` | JSON | 任务完成数据 |

**设计要点**：`(user_id, date)` 唯一约束，每天每个用户一条记录。使用 JSON 存储灵活的任务结构。

---

### 9. `user_sessions` — 登录会话

| 字段 | 类型 | 说明 |
|------|------|------|
| `token` | VARCHAR(500) | JWT 令牌 |
| `refresh_token` | VARCHAR(500) | 刷新令牌 |
| `ip_address` | VARCHAR(45) | 登录 IP |
| `user_agent` | VARCHAR(500) | 浏览器 UA |
| `expires_at` | DATETIME | 过期时间 |
| `is_revoked` | TINYINT(1) | 是否已强制注销 |

**设计要点**：`is_revoked` 支持服务端强制下线，`token` 索引支持快速验证。

---

### 10-11. `achievements` / `user_achievements` — 成就系统

预留表，暂不实现业务逻辑。

- `achievements`：成就定义（条件类型、目标值、奖励经验）
- `user_achievements`：用户成就进度（当前进度、是否完成）

---

## ER 关系图

```
drink_brands ──1:N──> drinks ──1:N──> records
                        │
                        └──1:N──> user_collections

users ──1:1──> user_stats
users ──1:N──> records
users ──1:N──> user_collections
users ──1:N──> bounties (publisher)
users ──1:N──> bounties (acceptor)
users ──1:N──> daily_tasks
users ──1:N──> user_sessions
users ──1:N──> user_achievements

achievements ──1:N──> user_achievements
```

---

## 索引策略

| 表 | 索引 | 用途 |
|----|------|------|
| drinks | `(is_active, sort_order)` | 菜单列表排序 |
| records | `(user_id, date)` | 按用户+日期查询记录 |
| bounties | `(status, urgency)` | 悬赏大厅列表筛选 |
| user_sessions | `token` | 会话验证 |
| user_collections | `(user_id, drink_id)` UNIQUE | 唯一收集约束 |
| daily_tasks | `(user_id, date)` UNIQUE | 每日唯一任务 |

---

## 外键策略

| 关系 | 策略 | 原因 |
|------|------|------|
| drink_brands → drinks | `SET NULL` | 删除品牌不删除饮品 |
| drinks → records | `RESTRICT` | 保护历史记录 |
| drinks → user_collections | `RESTRICT` | 保护图鉴数据 |
| users → 所有关联表 | `CASCADE` | 删除用户清理所有数据 |
| users → bounties(acceptor) | `SET NULL` | 接单者删除不影响悬赏 |
