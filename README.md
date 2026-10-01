# 🦊 白狐AI (Fox AI) - 极简高颜值 AI 绘图 & 创作工作台

> **白狐AI** 是一款专为移动端与桌面端双向深度优化的极简高颜值 AI 绘图工作台。原生支持 **Cloudflare Pages / Workers (Git 自动拉取与部署)**、**Zeabur**、**Render**、**Railway**、**Netlify**、**Vercel**、**Docker 容器化** 及 **Wasmer** 全平台无缝部署。内置 **Cloudflare D1 云数据库** 与 **Cloudflare R2 对象存储 (全能云盘)** 原生绑定支持。

![白狐AI 界面展示图](./public/assets/fox-ai-preview.svg)

---

## ✨ 核心功能与特色

- 🎨 **一排三列手机屏极佳体验与 4 张连发**：
  - 支持 **1 张单发** / **4 张连发** 生成模式；
  - 手机屏 **一排三图 (grid-cols-3)** 极佳卡片布局；
  - 算力引擎手动选择后**自动保持记忆**，刷新页面不再被重置。
- 🖼️ **图生图 (Image-to-Image)**：上传参考图结合提示词衍生全新艺术大片。
- ⚡ **多引擎零失败极速算力**：
  - **Cloudflare Workers AI** (FLUX.1 Schnell / SDXL Lightning / Base 1.0)；
  - **Cloudflare Direct REST API** (凭证校验连通指示灯)；
  - **OpenAI 兼容通用图像算力** (DALL-E 3 / API 中转)；
  - **Pollinations FLUX AI** (全球免费免 Key 全功能算力通道)。
- 📁 **R2 对象存储全能多媒体云盘**：
  - 完美支持 **图片、视频、音频、文档** 上传与预览查看；
  - 支持 **单文件与批量上传**，实时带上传进度条展示；
  - 支持 **新建文件夹、删除文件夹与重命名** 文件管理；
  - 显示总占用容量与动态剩余空间。
- 📜 **历史记录 & 参数一键载入**：
  - 记录完整模型、尺寸与提示词；
  - 支持 **单张历史记录删除** 与 **一键载入参数重新绘图**。
- ⚙️ **系统控制台与安全保障**：
  - 包含 **Cloudflare API Token 鉴权连通状态指示灯**；
  - 密码修改与管理员设备设置置底；
  - **仅管理员可见**的 D1 云端注册用户列表与邮箱验证码配置预留区。

---

## 🗄️ Cloudflare D1 数据库 & R2 对象存储中文绑定全指南

### 一、如何在 Cloudflare 控制台添加 D1 数据库？

1. **新建 D1 数据库**：
   - 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)；
   - 点击左侧菜单 **存储和数据库 (Storage & Databases)** -> **D1 数据库 (D1 Database)**；
   - 点击 **创建数据库 (Create Database)**，名称填写 `fox_ai_db`；
   - 创建完成后，复制页面中显示的 **数据库 UUID (Database ID)**。

2. **绑定至 Cloudflare Pages**：
   - **方式 A (推荐)：在 `wrangler.toml` 中配置**：
     打开项目根目录下的 `wrangler.toml`，取消注释并填入您的真实 UUID：
     ```toml
     [[d1_databases]]
     binding = "DB"
     database_name = "fox_ai_db"
     database_id = "您的真实-D1-数据库-UUID"
     ```
   - **方式 B：在 Cloudflare Pages 网页控制台绑定**：
     进入 Pages 项目 -> **设置 (Settings)** -> **函数 (Functions)** -> **D1 数据库绑定 (D1 Database Bindings)** -> 点击 **添加绑定 (Add Binding)**；
     - **变量名称 (Variable Name)**: `DB`
     - **D1 数据库**: 选择刚刚创建的 `fox_ai_db`。

---

### 二、如何在 Cloudflare 控制台添加 R2 对象存储 (全能云盘)？

1. **新建 R2 存储桶**：
   - 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)；
   - 点击左侧菜单 **R2 对象存储 (R2 Object Storage)** -> **创建存储桶 (Create Bucket)**；
   - 存储桶名称输入 `fox-ai-storage`，点击 **创建 (Create Bucket)**。

2. **绑定至 Cloudflare Pages**：
   - **方式 A：在 `wrangler.toml` 中配置**：
     ```toml
     [[r2_buckets]]
     binding = "FOX_BUCKET"
     bucket_name = "fox-ai-storage"
     ```
   - **方式 B：在 Cloudflare Pages 网页控制台绑定**：
     进入 Pages 项目 -> **设置 (Settings)** -> **函数 (Functions)** -> **R2 存储桶绑定 (R2 Bucket Bindings)** -> 点击 **添加绑定 (Add Binding)**；
     - **变量名称 (Variable Name)**: `FOX_BUCKET`
     - **R2 存储桶**: 选择 `fox-ai-storage`。

---

## 🌐 8 大平台部署指南

详细步骤见 [📜 多平台部署全集文档 (docs/DEPLOYMENT.md)](./docs/DEPLOYMENT.md)。

| 部署平台 | 支持方式 | 推荐度 |
| :--- | :--- | :---: |
| **Cloudflare Pages** | Git 仓库自动拉取部署 (`npm run build`, 产物 `dist`) | ⭐⭐⭐⭐⭐ |
| **Zeabur** | Git 导入一键发布 | ⭐⭐⭐⭐⭐ |
| **Render** | Docker / Node 部署 | ⭐⭐⭐⭐ |
| **Railway** | GitHub 关联容器识别 | ⭐⭐⭐⭐ |
| **Netlify** | 静态托管 + Functions | ⭐⭐⭐⭐ |
| **Vercel** | SPA 路由发布 | ⭐⭐⭐⭐ |
| **Docker** | 单容器环境 (`docker build -t fox-ai .`) | ⭐⭐⭐⭐⭐ |
| **Wasmer** | WebAssembly 边缘发布 | ⭐⭐⭐ |

---

## 📄 开源协议

本项目基于 MIT 协议开源，欢迎 Star 与 Fork！
