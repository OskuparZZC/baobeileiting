# 爆杯雷霆 V2.1.2 部署文档

---

## 一、项目简介

爆杯雷霆是一款校园饮品管理与记录应用，支持用户记录饮品消费、查看排行榜和饮品图鉴等功能。

| 层级 | 技术栈 |
|------|--------|
| 前端 | 原生 HTML / CSS / JavaScript（无框架），PWA（Service Worker + manifest.json） |
| 后端 | Node.js + Express.js，JWT 身份认证 |
| 数据库 | MySQL 8.0（生产），内存存储（仅开发） |
| 进程管理 | PM2 |
| 反向代理 | Nginx |

---

## 二、服务器环境要求

| 组件 | 版本 | 说明 |
|------|------|------|
| 操作系统 | Ubuntu 22.04 LTS | 推荐长期支持版本 |
| Node.js | >= 18.x | 建议使用 LTS 版本 |
| MySQL | 8.0 | 目标为腾讯云 MySQL 8.0，兼容标准 MySQL 8.0 |
| Nginx | >= 1.18 | 反向代理 + HTTPS 终止 + 静态资源加速 |
| PM2 | >= 5.x | Node 进程守护 |

安装命令参考：

```bash
# Node.js（使用 NodeSource 源）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MySQL 8.0
sudo apt-get install -y mysql-server-8.0

# Nginx
sudo apt-get install -y nginx

# PM2
sudo npm install -g pm2
```

---

## 三、部署步骤

### 3.1 上传项目

将整个项目目录上传至服务器：

```bash
# 建议路径
/opt/baobeileiting/

# 或使用 git clone
git clone <仓库地址> /opt/baobeileiting
```

### 3.2 安装依赖

```bash
cd /opt/baobeileiting/backend
npm install --production
```

`--production` 会跳过 `devDependencies`（仅 `nodemon`），减少安装体积。

### 3.3 配置环境变量

```bash
cd /opt/baobeileiting/backend
cp .env.example .env
nano .env
```

生产环境 `.env` 必须配置：

```env
# ===== 基本配置 =====
PORT=3000
NODE_ENV=production

# ===== CORS（替换为实际域名） =====
CORS_ORIGINS=https://your-domain.com

# ===== 数据库 =====
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=bb_user
DB_PASSWORD=<你的数据库密码>
DB_NAME=baobeileiting

# ===== JWT（必须使用强随机密钥！） =====
JWT_SECRET=<openssl rand -hex 32 生成的64字符随机串>
JWT_EXPIRES_IN=7d
```

> **注意**：`NODE_ENV=production` 时 `AUTH_ENABLED` 配置无效，系统永远强制 JWT 认证。

生成强 JWT 密钥：

```bash
openssl rand -hex 32
```

### 3.4 初始化 MySQL 数据库

#### 3.4.1 创建数据库和应用账号

```bash
mysql -u root -p
```

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS baobeileting
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建应用专用账号（不要用 root）
CREATE USER 'bb_user'@'localhost' IDENTIFIED BY '<强密码>';
GRANT SELECT, INSERT, UPDATE, DELETE ON baobeileting.* TO 'bb_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

#### 3.4.2 导入数据库结构

```bash
mysql -u root -p baobeileiting < /opt/baobeileiting/backend/sql/schema_v2.1.2.sql
```

`schema_v2.1.2.sql` 包含以下表：

| 表名 | 说明 |
|------|------|
| `drink_brands` | 饮品品牌 |
| `drinks` | 饮品信息 |
| `users` | 用户账号 |
| `records` | 饮品记录 |
| `collections` | 饮品图鉴 |

#### 3.4.3 导入种子数据（饮品列表）

```bash
mysql -u root -p baobeileiting < /opt/baobeileiting/backend/sql/seed_drinks_v2.1.2.sql
```

可选数据（如有需要）：

```bash
mysql -u root -p baobeileiting < /opt/baobeileiting/backend/sql/seed_monster_energy.sql
```

### 3.5 配置 Nginx

创建站点配置：

```bash
sudo nano /etc/nginx/sites-available/baobeileiting
```

```nginx
# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书（替换为实际路径）
    ssl_certificate     /etc/ssl/your-domain.crt;
    ssl_certificate_key /etc/ssl/your-domain.key;

    # Gzip 压缩
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    # 静态资源由 Nginx 直接返回（不走 Node）
    location /css/       { root /opt/baobeileiting; expires 7d; }
    location /js/        { root /opt/baobeileiting; expires 7d; }
    location /assets/    { root /opt/baobeileiting; expires 30d; }
    location /manifest.json      { root /opt/baobeileiting; }
    location /service-worker.js  { root /opt/baobeileiting; }

    # API + SPA 回退转发给 Express
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/baobeileiting /etc/nginx/sites-enabled/
sudo nginx -t          # 测试配置
sudo systemctl reload nginx
```

### 3.6 启动后端

```bash
cd /opt/baobeileiting/backend

# 使用 PM2 启动（推荐）
pm2 start src/server.js --name baobeileiting

# 设置开机自启
pm2 startup
pm2 save
```

---

## 四、环境变量说明

| 变量 | 说明 | 生产示例值 |
|------|------|-----------|
| `PORT` | Express 服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `production` |
| `CORS_ORIGINS` | 允许的前端域名，逗号分隔 | `https://your-domain.com` |
| `DB_TYPE` | 数据库类型 | `mysql` |
| `DB_HOST` | 数据库地址 | `localhost` 或云数据库内网地址 |
| `DB_PORT` | 数据库端口 | `3306` |
| `DB_USER` | 数据库用户 | `bb_user`（不要用 root） |
| `DB_PASSWORD` | 数据库密码 | `<强密码>` |
| `DB_NAME` | 数据库名 | `baobeileiting` |
| `JWT_SECRET` | JWT 签名密钥 | `<openssl rand -hex 32 生成的64字符>` |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |

---

## 五、常用命令

### 后端

```bash
# 直接启动（仅测试用）
npm start

# PM2 启动
pm2 start src/server.js --name baobeileiting

# PM2 查看状态
pm2 status

# PM2 查看日志
pm2 logs baobeileiting

# PM2 重启
pm2 restart baobeileiting

# PM2 停止
pm2 stop baobeileiting
```

### 数据库

```bash
# 导入建表语句
mysql -u root -p baobeileiting < sql/schema_v2.1.2.sql

# 导入种子数据
mysql -u root -p baobeileiting < sql/seed_drinks_v2.1.2.sql

# 备份数据库
mysqldump -u root -p baobeileiting > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u root -p baobeileiting < backup_20260717.sql
```

### Nginx

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 查看日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 六、注意事项

### 安全相关

1. **`.env` 不提交 Git** — 已配置 `.gitignore`，确保 `.env` 不会被提交到版本控制。部署时从 `.env.example` 复制后手动填写。

2. **生产必须使用强 JWT 密钥** — 如果 `NODE_ENV=production` 且 `JWT_SECRET` 仍为默认弱密钥，登录接口会直接抛出安全异常，导致所有用户无法登录。用 `openssl rand -hex 32` 生成随机密钥。

3. **不使用 memory 模式** — `DB_TYPE=memory` 仅用于本地开发，数据存储在进程内存中，重启即丢失。生产环境必须配置 `DB_TYPE=mysql`。

4. **不要用 root 连接数据库** — 创建独立的应用账号 `bb_user`，仅授予该账号对 `baobeileiting` 库的 CRUD 权限。

5. **数据库密码含特殊字符** — 如果密码包含 `@`、`#`、`%` 等字符，确保 `.env` 中用双引号包裹或不需转义（dotenv 直接读取，无需 URL 编码）。

### 运维相关

6. **MySQL 连接池** — 默认 `connectionLimit=10`，对于校园小规模应用（预估 < 500 日活）足够。如果并发量增大可以适当上调。

7. **日志管理** — PM2 默认将日志写入 `~/.pm2/logs/`，建议配置日志轮转防止磁盘占满：`pm2 install pm2-logrotate`。

8. **HTTPS 证书续签** — 如果使用 Let's Encrypt 免费证书（90 天有效），配置 `certbot` 自动续签。如果使用腾讯云免费证书（1 年有效），设置日历提醒到期前续期。

9. **端口防火墙** — 仅开放 80（HTTP）和 443（HTTPS）端口，3000 端口只能本地（127.0.0.1）访问。

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

10. **首次部署验证** — 部署后访问 `https://your-domain.com/api/health`，应返回 `{"status":"ok"}` 表示服务正常运行。
