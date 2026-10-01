# 🦊 狐AI (Fox AI) - 极简高颜值 AI 绘图 & 创作工作台

> **狐AI** 是一款专为移动端与桌面端优化的极简高颜值 AI 绘图工作台。原生支持 **Cloudflare Pages / Workers (Git 自动拉取与部署)**、**Zeabur**、**Render**、**Railway**、**Netlify**、**Vercel**、**Docker 容器化** 及 **Wasmer** 多平台部署。内置 **Cloudflare D1 数据库** 与 **R2 对象存储** 原生绑定支持。

![狐AI 项目界面预览](./public/assets/fox-ai-preview.svg)

---

## ✨ 核心功能与特色

- 🎨 **文生图与自定义尺寸**：支持正向/负向提示词、中英双向翻译，以及自选或自定义（宽 × 高）像素尺寸。
- 🖼️ **图生图 (Image-to-Image)**：支持上传参考图，结合提示词快速衍生二次创作。
- 📜 **云端 R2 与本地双区历史记录**：
  - 支持本地浏览缓存；
  - 接入 Cloudflare R2 对象存储，支持 2MB 以上大图同步存储、文件管理界面、文件删除与剩余总空间动态显示。
- ⚙️ **11 项折叠分区设置面板**：
  - 夜间模式一键切换；
  - 电脑桌面版与手机端无缝切换；
  - 融合算力引擎选择与外接 KEY 配置；
  - 密码修改区；
  - **CF API / D1 数据库 / R2 存储桶状态指示灯**；
  - Cloudflare 后台一键绑定 D1 与 R2 步骤说明。
- 🔐 **账户与登录系统**：支持管理员密码登录与邮箱新用户注册。

---

## 🌐 多平台部署支持

| 部署平台 | 支持方式 | 部署文档 |
| :--- | :--- | :--- |
| **Cloudflare Pages / Workers** | Git 拉取部署 / Wrangler CLI | [查看指南](./docs/DEPLOYMENT.md#云端方案一cloudflare-git-拉取与自动部署-推荐) |
| **Zeabur** | 一键 Git 导入部署 | [查看指南](./docs/DEPLOYMENT.md#方案三zeabur-部署) |
| **Render** | Node / Docker 自动部署 | [查看指南](./docs/DEPLOYMENT.md#方案四render-部署) |
| **Railway** | GitHub Repo 智能识别 | [查看指南](./docs/DEPLOYMENT.md#方案五railway-部署) |
| **Netlify** | 静态构建拉取部署 | [查看指南](./docs/DEPLOYMENT.md#方案六netlify-部署) |
| **Docker** | 单容器 / Docker-Compose | [查看指南](./docs/DEPLOYMENT.md#方案七docker--docker-compose-部署) |

---

## 🗄️ Cloudflare D1 & R2 绑定速查

详见 [📜 多平台部署与绑定指南全集 (docs/DEPLOYMENT.md)](./docs/DEPLOYMENT.md)。

- **D1 数据库绑定**:
  `[[d1_databases]] binding = "DB" database_name = "fox_ai_db"`
- **R2 对象存储绑定**:
  `[[r2_buckets]] binding = "FOX_BUCKET" bucket_name = "fox-ai-storage"`

---

## 📄 开源协议

本项目基于 MIT 协议开源。
