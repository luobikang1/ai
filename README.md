# 🦊 狐AI (Fox AI) - 极简高颜值 AI 绘图 & 创作工作台

> 支持 Cloudflare Pages / Workers 边缘计算部署、Vercel 部署、Docker 容器化部署及 Wasmer 部署。内置免 Key 开源多模型算力与智能提示词助理。

---

## 🌟 核心功能特性

1. **🎨 文本生成图像 (Text-to-Image)**
   - 支持正向/负向提示词设定与一键优化。
   - 支持 1:1, 3:4, 4:3 图像尺寸与常用艺术风格预设。
   - 高质量实时生成预览，保证稳定出图，不掉线卡死。

2. **🖼️ 图像生成图像 (Image-to-Image)**
   - 支持上传本地参考图，配合提示词进行二次创作与变体生成。

3. **📦 热门开源模型库 (Model Hub)**
   - 默认精选 SDXL Lightning、SDXL Base、DreamShaper 8 等免 Key 开源模型。
   - 支持模型关键字一键搜索与模型分类筛选。

4. **💬 AI 提示词助理 & 中英双向翻译**
   - 内置智能大模型，支持输入中文一键扩展爆款英文生图 Prompt。

5. **📜 本地历史记录管理**
   - 自动持久化保存历史生成记录，支持下载高清原图与一键复用提示词。

6. **⚙️ 系统设置与凭证管理**
   - 支持在前端直接配置 Cloudflare Account ID & API Token，或无缝使用后端预设算力环境变量。
   - 内置 🔞 成人内容展示开关控制与恢复出厂设置功能。

---

## 🔑 关键环境变量

配置 Cloudflare Workers / Vercel / Docker 时可选用以下环境变量：

| 环境变量名 | 示例值 | 说明 |
| :--- | :--- | :--- |
| `CF_ACCOUNT_ID` | `8a123f456789abcdef...` | Cloudflare 账户 ID |
| `CF_API_TOKEN` | `v1.0-xxxxxxx...` | Cloudflare Workers AI Token |
| `ADMIN_PASSWORD` | `FoxAISecret2025` | 系统管理员与高级设置密码 |

---

## 🚀 部署指南

### 1. Cloudflare Pages / Workers 部署 (推荐)

1. 克隆代码库：
   ```bash
   git clone https://github.com/your-repo/fox-ai.git
   cd fox-ai
   ```
2. 安装依赖并构建：
   ```bash
   npm install
   npm run build
   ```
3. 使用 Wrangler 快速部署：
   ```bash
   npx wrangler deploy
   ```

### 2. Docker 部署

```bash
# 构建镜像
docker build -t fox-ai:latest .

# 运行容器
docker run -d -p 8080:80 --name fox-ai-app fox-ai:latest
```

---

## 🛠️ 常见问题与排查 (Troubleshooting)

- **出图提示 API Error**：检查设置页面中的 Account ID 和 API Token 是否正确填写，或检查 Cloudflare Workers 后端 AI 绑定 `[ai]` 是否有效。
- **构建阶段报错 missing module**：请确保执行过 `npm install`。
