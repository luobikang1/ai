# 🚀 白狐AI (Fox AI) 多平台部署与绑定指南全集

本文档提供“白狐AI”在 **Cloudflare Pages / Workers**、**Zeabur**、**Render**、**Railway**、**Netlify**、**Vercel**、**Docker** 以及 **Wasmer** 等平台的全流程部署步骤，并包含 **Cloudflare D1 数据库** 与 **R2 对象存储 (全能云盘)** 的详细中文绑定指导。

---

## 📋 环境变量总览 (Environment Variables)

在所有平台部署时，可选择配置以下环境变量：

| 变量名 | 必填 | 默认值 | 说明 |
| :--- | :---: | :--- | :--- |
| `ADMIN_PASSWORD` | 否 | `fox123456` | 管理员直登密码（建议在后台设置或部署时自定义） |
| `CF_ACCOUNT_ID` | 否 | - | Cloudflare 账户 ID (用于 REST API 算力透传) |
| `CF_API_TOKEN` | 否 | - | Cloudflare Workers AI API Token |
| `OPENAI_API_KEY` | 否 | - | OpenAI 或兼容中转站 API Key |
| `OPENAI_BASE_URL` | 否 | `https://api.openai.com/v1` | 通用 API 基础请求地址 |

---

## ☁️ 方案一：Cloudflare Git 拉取与自动部署 (极力推荐)

1. **连接 Cloudflare Pages**：
   - 登录 Cloudflare 控制台，进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
   - 选择您的 `fox-ai` 仓库。
2. **设置构建参数**：
   - **Framework preset**: `Vite` (或选 `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. **点击 Save and Deploy**，后续提交代码即可自动拉取构建。

---

## 🗄️ 方案二：Cloudflare D1 数据库与 R2 存储桶中文绑定指南

### 1. D1 数据库绑定（用于数据与用户同步）
- 在 Cloudflare 进入 **Storage & Databases** -> **D1 Database** -> **Create Database**（名称填 `fox_ai_db`）；
- 在 `wrangler.toml` 文件中填入您的数据库 UUID：
  ```toml
  [[d1_databases]]
  binding = "DB"
  database_name = "fox_ai_db"
  database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  ```

### 2. R2 对象存储绑定（支持图片/视频/音频/文档管理）
- 在 Cloudflare 进入 **R2 Object Storage** -> **Create Bucket**（存储桶名称填 `fox-ai-storage`）；
- 在 `wrangler.toml` 文件中填写：
  ```toml
  [[r2_buckets]]
  binding = "FOX_BUCKET"
  bucket_name = "fox-ai-storage"
  ```

---

## 🐳 方案三：Docker 容器化部署

使用根目录的 Dockerfile：

```bash
docker build -t fox-ai:latest .
docker run -d -p 8080:80 --name fox-ai-app fox-ai:latest
```
访问 `http://localhost:8080` 即可使用。
