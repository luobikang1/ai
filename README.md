# 🦊 狐AI (Fox AI) - 极简高颜值 AI 绘图 & 创作工作台

> **狐AI** 是一款专为移动端与桌面端优化的极简高颜值 AI 绘图应用。原生支持 **Cloudflare Pages / Workers** 边缘计算部署、**Vercel**、**Docker 容器化** 及 **Wasmer** 部署。内置免 Key 开源多模型算力、提示词中英双向翻译与爆款增强助理。

![狐AI 项目界面预览](./public/assets/fox-ai-preview.svg)

---

## ✨ 核心功能与亮点

- 🎨 **文生图 (Text-to-Image)**：支持正向/负向提示词、中英双向翻译、比例调节 (1:1 / 3:4 / 4:3) 与艺术风格预设。
- 🖼️ **图生图 (Image-to-Image)**：支持上传本地参考图，结合提示词快速衍生二次创作。
- 📦 **免 Key 热门模型库**：预设 12 款热门开源模型（包含 SDXL Lightning、SDXL Base、DreamShaper 8、Anything V5 等），支持模型搜索与收藏。
- 💬 **AI 提示词助理**：内置智能大模型，支持中文输入一键扩展高品质英文 Prompt。
- 📜 **本地历史记录**：自动持久化存储生成历史，支持一键同款绘图与高清原图下载。
- 🔐 **安全与设置**：内置登录认证系统、成人内容展示开关控制与 Cloudflare API 凭证管理。

---

## 🖼️ 软件界面概览

| 界面模块 | 功能说明 |
| :--- | :--- |
| **🎨 绘图工作台** | 双栏响应式布局，左侧控制参数，右侧实时显示绘图预览 |
| **📦 热门模型库** | 图文卡片展示各分类模型，支持关键字实时搜素与一键使用 |
| **💬 AI 翻译/对话** | 支持中文提示词润色增强，双向互译不掉线 |
| **📜 历史记录** | 浏览器本地存储，离线可看，支持下载与一键重绘 |

---

## 🚀 多平台一键部署指南

完整部署步骤见 [📜 多平台详细部署文档 (docs/DEPLOYMENT.md)](./docs/DEPLOYMENT.md)。

### 1. Cloudflare Pages / Workers 部署 (推荐)

```bash
# 克隆仓库
git clone https://github.com/your-repo/fox-ai.git
cd fox-ai

# 安装依赖并构建
npm install
npm run build

# 发布至 Cloudflare
npx wrangler deploy
```

### 2. Docker 部署

```bash
docker build -t fox-ai:latest .
docker run -d -p 8080:80 --name fox-ai-app fox-ai:latest
```

---

## 📋 关键环境变量

| 变量名 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `ADMIN_USERNAME` | `admin` | 管理员账号 |
| `ADMIN_PASSWORD` | `fox123456` | 管理员登录密码 |
| `CF_ACCOUNT_ID` | - | Cloudflare Account ID (选填) |
| `CF_API_TOKEN` | - | Cloudflare Workers AI Token (选填) |

---

## 📄 开源协议

本项目基于 MIT 协议开源。
