-- ============================================================
-- 爆杯雷霆 V2.1.1 数据库建表语句
-- 目标: 腾讯云 MySQL 8.0
-- 数据库: baobeileiting
-- 变更: 用户业务数据主键从 INT AUTO_INCREMENT 迁移到 VARCHAR(36) UUID
-- 创建日期: 2026-07-10
-- ============================================================

CREATE DATABASE IF NOT EXISTS baobeileiting
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE baobeileiting;

-- ============================================================
-- 1. drink_brands - 饮品品牌（INT 主键，后台配置数据）
-- ============================================================
CREATE TABLE IF NOT EXISTS drink_brands (
  id          INT             PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100)    NOT NULL COMMENT '品牌名称',
  logo        VARCHAR(255)    COMMENT '品牌 logo URL',
  description TEXT            COMMENT '品牌描述',
  is_active   TINYINT(1)      DEFAULT 1 COMMENT '是否启用',
  sort_order  INT             DEFAULT 0 COMMENT '排序权重',
  created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='饮品品牌表';

-- ============================================================
-- 2. drinks - 饮品基础信息（INT 主键，后台配置数据）
-- ============================================================
CREATE TABLE IF NOT EXISTS drinks (
  id          INT             PRIMARY KEY AUTO_INCREMENT,
  brand_id    INT             COMMENT '所属品牌',
  name        VARCHAR(100)    NOT NULL COMMENT '饮品名称',
  category    VARCHAR(50)     NOT NULL COMMENT '品类 (coffee/tea/milk/ice/etc)',
  sizes       JSON            NOT NULL COMMENT '可选杯型 ["小杯","中杯","大杯"]',
  base_price  DECIMAL(8,2)    COMMENT '基准价格',
  caffeine    VARCHAR(20)     COMMENT '咖啡因含量',
  sugar       VARCHAR(20)     COMMENT '糖度',
  icon        VARCHAR(50)     COMMENT '图标/emoji',
  description TEXT            COMMENT '描述',
  is_active   TINYINT(1)      DEFAULT 1 COMMENT '是否上架',
  sort_order  INT             DEFAULT 0 COMMENT '排序权重',
  created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_brand (brand_id),
  INDEX idx_category (category),
  INDEX idx_active_sort (is_active, sort_order),

  CONSTRAINT fk_drink_brand
    FOREIGN KEY (brand_id) REFERENCES drink_brands(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='饮品基础信息表';

-- ============================================================
-- 3. users - 用户基本信息（VARCHAR(36) UUID 主键）
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)     PRIMARY KEY COMMENT 'UUID v4',
  name          VARCHAR(50)     NOT NULL COMMENT '用户名',
  nickname      VARCHAR(50)     COMMENT '昵称',
  class_name    VARCHAR(100)    COMMENT '班级',
  student_id    VARCHAR(50)     NOT NULL COMMENT '学号',
  avatar        VARCHAR(255)    COMMENT '头像 URL',
  password_hash VARCHAR(255)    COMMENT '密码哈希（bcrypt）',
  created_at    DATETIME        DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_student_id (student_id),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户基本信息表';

-- ============================================================
-- 4. user_stats - 用户游戏化统计（1:1 users，VARCHAR(36) UUID）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_stats (
  id                      VARCHAR(36)   PRIMARY KEY COMMENT 'UUID v4',
  user_id                 VARCHAR(36)   NOT NULL UNIQUE COMMENT '关联用户 UUID',

  -- 等级经验
  level                   INT           DEFAULT 1 COMMENT '当前等级',
  xp                      INT           DEFAULT 0 COMMENT '当前等级经验值',
  total_xp                INT           DEFAULT 0 COMMENT '累计总经验值',

  -- 签到
  continuous_days         INT           DEFAULT 0 COMMENT '连续签到天数',

  -- 统计
  total_drinks            INT           DEFAULT 0 COMMENT '饮品记录总数',
  total_bounties          INT           DEFAULT 0 COMMENT '发布悬赏总数',
  total_help_completed    INT           DEFAULT 0 COMMENT '完成悬赏总数',
  total_collections       INT           DEFAULT 0 COMMENT '图鉴收集总数',

  created_at              DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user (user_id),
  INDEX idx_level (level),
  INDEX idx_xp (total_xp),

  CONSTRAINT fk_stats_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户游戏化统计表';

-- ============================================================
-- 5. xp_logs - XP 经验流水（VARCHAR(36) UUID）
-- ============================================================
CREATE TABLE IF NOT EXISTS xp_logs (
  id          VARCHAR(36)     PRIMARY KEY COMMENT 'UUID v4',
  user_id     VARCHAR(36)     NOT NULL COMMENT '用户 UUID',
  amount      INT             NOT NULL COMMENT '经验值变化量',
  reason      VARCHAR(200)    NOT NULL COMMENT '变动原因',
  source_type VARCHAR(50)     NOT NULL COMMENT '来源类型 (DAILY_CHECKIN/RECORD_DRINK/COMPLETE_BOUNTY/etc)',
  target_id   VARCHAR(36)     COMMENT '关联目标 ID（如 drink_id/bounty_id，幂等性去重）',
  created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user (user_id),
  INDEX idx_user_type (user_id, source_type),
  INDEX idx_created (created_at),
  INDEX idx_idempotent (user_id, source_type, target_id),

  CONSTRAINT fk_xplog_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='XP 经验流水表';

-- ============================================================
-- 6. records - 饮品记录（user_id 使用 VARCHAR(36) UUID）
-- ============================================================
CREATE TABLE IF NOT EXISTS records (
  id          INT             PRIMARY KEY AUTO_INCREMENT,
  user_id     VARCHAR(36)     NOT NULL COMMENT '用户 UUID',
  drink_id    INT             NOT NULL COMMENT '饮品',
  size        VARCHAR(20)     COMMENT '杯型',
  price       DECIMAL(8,2)    COMMENT '价格',
  rating      TINYINT         COMMENT '评分 1-5',
  note        TEXT            COMMENT '备注',
  date        DATE            NOT NULL COMMENT '记录日期',
  time        TIME            COMMENT '记录时间',
  created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_date (user_id, date),
  INDEX idx_drink (drink_id),

  CONSTRAINT fk_record_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_record_drink
    FOREIGN KEY (drink_id) REFERENCES drinks(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='饮品记录表';

-- ============================================================
-- 7. user_collections - 用户图鉴收集（user_id 使用 VARCHAR(36) UUID）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_collections (
  id          INT             PRIMARY KEY AUTO_INCREMENT,
  user_id     VARCHAR(36)     NOT NULL COMMENT '用户 UUID',
  drink_id    INT             NOT NULL COMMENT '饮品',
  unlocked_at DATETIME        DEFAULT CURRENT_TIMESTAMP COMMENT '解锁时间',
  times_tried INT             DEFAULT 1 COMMENT '尝试次数',
  created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_user_drink (user_id, drink_id),

  CONSTRAINT fk_collection_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_collection_drink
    FOREIGN KEY (drink_id) REFERENCES drinks(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户图鉴收集表';

-- ============================================================
-- 8. bounties - 校园悬赏（publisher_id/acceptor_id 使用 VARCHAR(36) UUID）
-- ============================================================
CREATE TABLE IF NOT EXISTS bounties (
  id            INT           PRIMARY KEY AUTO_INCREMENT,
  title         VARCHAR(200)  NOT NULL COMMENT '悬赏标题',
  description   TEXT          NOT NULL COMMENT '详细描述',
  category      VARCHAR(50)   NOT NULL COMMENT '分类 (express/meal/borrow/print/other)',
  urgency       VARCHAR(20)   DEFAULT 'normal' COMMENT '紧急程度 (low/normal/high/urgent)',
  location      VARCHAR(200)  COMMENT '地点',
  deadline      DATETIME      COMMENT '截止时间',

  -- 奖励（灵活设计）
  reward_type   VARCHAR(20)   DEFAULT 'money' COMMENT '奖励类型 (money/drink/favor/custom)',
  reward_amount DECIMAL(8,2)  COMMENT '奖励金额',
  reward_detail VARCHAR(200)  COMMENT '奖励描述',
  reward_unit   VARCHAR(20)   DEFAULT '元' COMMENT '金额单位',

  -- 参与者（UUID）
  publisher_id  VARCHAR(36)   NOT NULL COMMENT '发布者 UUID',
  acceptor_id   VARCHAR(36)   COMMENT '接单者 UUID',

  -- 状态
  status        VARCHAR(20)   DEFAULT 'open' COMMENT '状态 (open/accepted/completed/cancelled)',

  -- 扩展
  view_count    INT           DEFAULT 0 COMMENT '浏览次数',

  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  accepted_at   DATETIME      COMMENT '接单时间',
  completed_at  DATETIME      COMMENT '完成时间',

  INDEX idx_publisher (publisher_id),
  INDEX idx_acceptor (acceptor_id),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_urgency (urgency),
  INDEX idx_status_urgency (status, urgency),

  CONSTRAINT fk_bounty_publisher
    FOREIGN KEY (publisher_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_bounty_acceptor
    FOREIGN KEY (acceptor_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='校园悬赏表';

-- ============================================================
-- 9. daily_tasks - 每日任务（user_id 使用 VARCHAR(36) UUID）
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_tasks (
  id          INT             PRIMARY KEY AUTO_INCREMENT,
  user_id     VARCHAR(36)     NOT NULL COMMENT '用户 UUID',
  date        DATE            NOT NULL COMMENT '任务日期',
  task_data   JSON            NOT NULL COMMENT '任务数据',
  created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_user_date (user_id, date),

  CONSTRAINT fk_task_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日任务表';

-- ============================================================
-- 10. user_sessions - 登录会话（user_id 使用 VARCHAR(36) UUID）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id            INT           PRIMARY KEY AUTO_INCREMENT,
  user_id       VARCHAR(36)   NOT NULL COMMENT '用户 UUID',
  token         VARCHAR(500)  NOT NULL COMMENT '会话令牌',
  refresh_token VARCHAR(500)  COMMENT '刷新令牌',
  ip_address    VARCHAR(45)   COMMENT '登录 IP',
  user_agent    VARCHAR(500)  COMMENT '用户代理',
  expires_at    DATETIME      NOT NULL COMMENT '过期时间',
  is_revoked    TINYINT(1)    DEFAULT 0 COMMENT '是否已注销',
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_token (token),
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at),

  CONSTRAINT fk_session_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户会话表';

-- ============================================================
-- 11. achievements - 成就定义（INT 主键，后台配置数据）
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id              INT           PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(100)  NOT NULL COMMENT '成就名称',
  description     TEXT          COMMENT '成就描述',
  icon            VARCHAR(50)   COMMENT '图标',
  condition_type  VARCHAR(50)   NOT NULL COMMENT '条件类型 (record_count/level/collection/etc)',
  condition_value INT           NOT NULL COMMENT '条件值',
  reward_xp       INT           DEFAULT 0 COMMENT '奖励经验',
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就定义表';

-- ============================================================
-- 12. user_achievements - 用户成就进度（user_id 使用 VARCHAR(36) UUID）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id              INT           PRIMARY KEY AUTO_INCREMENT,
  user_id         VARCHAR(36)   NOT NULL COMMENT '用户 UUID',
  achievement_id  INT           NOT NULL COMMENT '成就',
  progress        INT           DEFAULT 0 COMMENT '当前进度',
  is_completed    TINYINT(1)    DEFAULT 0 COMMENT '是否完成',
  completed_at    DATETIME      COMMENT '完成时间',
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_user_achievement (user_id, achievement_id),

  CONSTRAINT fk_ua_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ua_achievement
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户成就进度表';
