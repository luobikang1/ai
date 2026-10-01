# 🚀 狐AI (Fox AI) 多平台部署与绑定指南全集

本文档提供“狐AI”在 **Cloudflare Pages / Workers**、**Zeabur**、**Render**、**Railway**、**Netlify**、**Vercel**、**Docker** 以及 **Wasmer** 等平台的全流程部署步骤，并包含 **Cloudflare D1 数据库** 与 **R2 对象存储** 的详细绑定配置。

---

## 📋 环境变量总览 (Environment Variables)

在所有平台部署时，可选配置以下环境变量：

| 变量名 | 必填 | 默认值 | 说明 |
| :--- | :---: | :--- | :--- |
| `ADMIN_USERNAME` | 否 | `admin` | 超级管理员登录用户名 |
| `ADMIN_PASSWORD` | 否 | `fox123456` | 管理员登录密码（建议更改） |
| `CF_ACCOUNT_ID` | 否 | - | Cloudflare 账户 ID |
| `CF_API_TOKEN` | 否 | - | Cloudflare Workers AI Token |

---

## ☁️ 方案一：Cloudflare Git 拉取与自动部署 (推荐)

借助 Cloudflare Pages 的 Git 集成，每次提交代码均可实现自动拉取构建与发布：

1. **创建 GitHub / GitLab 仓库**：
   将本项目代码推送到你个人的 Git 仓库。
2. **连接 Cloudflare Pages**：
   - 登录 Cloudflare 控制台，进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
   - 选择你的 `fox-ai` 仓库。
3. **设置构建配置**：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. **点击 Save and Deploy** 即可获得 Cloudflare Pages 全球 CDN 部署链接。

---

## ☁️ 方案二：Cloudflare 后台一键绑定 D1 和 R2 说明

### 1. D1 数据库绑定
1. 在 Cloudflare 控制台进入 **Storage & Databases** -> **D1 Database** -> **Create Database**（数据库名称填 `fox_ai_db`）。
2. 在 `wrangler.toml` 中取消注释并写入数据库 ID：
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "fox_ai_db"
   database_id = "你的-D1-Database-ID"
   ```

### 2. R2 对象存储绑定 (2MB 以上图片同步与空间管理)
> **注意**：单张大于 2MB 的高清图片需要接入 R2 存储桶方可进行云端同步与持久化空间显示。
1. 在 Cloudflare 控制台进入 **R2** -> **Create Bucket**（存储桶名称填 `fox-ai-storage`）。
2. 在 `wrangler.toml` 中配置绑定量：
   ```toml
   [[r2_buckets]]
   binding = "FOX_BUCKET"
   bucket_name = "fox-ai-storage"
   ```

---

## 💜 方案三：Zeabur 部署

1. 登录 [Zeabur 控制台](https://zeabur.com)，创建新 Service。
2. 选择 **Git Repository** 导入 `fox-ai`。
3. Zeabur 会自动识别 Node.js / Dockerfile 环境。
4. 在 **Variables** 界面填入环境变量 `ADMIN_USERNAME` 与 `ADMIN_PASSWORD`。
5. 生成域名后即可直接访问使用。

---

## 🟢 方案四：Render 部署

1. 在 [Render Dashboard](https://dashboard.render.com/) 选择 **New Web Service**。
2. 关联 Git 仓库后：
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview` 或配合 Docker 部署。
3. 点击 **Create Web Service**。

---

## 🚆 方案五：Railway 部署

1. 在 [Railway App](https://railway.app/) 点击 **New Project** -> **Deploy from GitHub repo**。
2. 选择 `fox-ai` 项目。
3. Railway 会自动读取 `Dockerfile` 并完成编译部署。

---

## 🩵 方案六：Netlify 部署

1. 在 Netlify 选择 **Add new site** -> **Import an existing project**。
2. 构建选项：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. 发布后可在设置添加环境变量。

---

## 🐳 方案七：Docker & Docker-Compose 部署

```bash
docker build -t fox-ai:latest .
docker run -d -p 8080:80 --name fox-ai-app fox-ai:latest
```
