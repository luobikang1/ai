# 🚀 狐AI (Fox AI) 多平台部署指南全集

本文档提供“狐AI”在 **Cloudflare Pages / Workers**、**Vercel**、**Docker / Docker-Compose** 以及 **Wasmer Edge** 等各大平台的全流程部署步骤、关键环境变量说明与故障排查方案。

---

## 📋 环境变量总览 (Environment Variables)

在任何部署方式中，可选择性配置以下环境变量：

| 变量名 | 必填 | 默认值 | 说明 |
| :--- | :---: | :--- | :--- |
| `ADMIN_USERNAME` | 否 | `admin` | 后台与超级管理员登录用户名 |
| `ADMIN_PASSWORD` | 否 | `fox123456` | 管理员登录密码（生产环境建议更改） |
| `CF_ACCOUNT_ID` | 否 | - | Cloudflare 账户 ID（配置后前端无需手动输入） |
| `CF_API_TOKEN` | 否 | - | Cloudflare Workers AI Token |

---

## 🌐 方案一：Cloudflare Pages / Workers 部署 (推荐，零成本)

Cloudflare Pages / Workers 为首选部署平台，原生支持 `Workers AI` 绑定的免费 GPU 算力。

### 方式 1：使用 Wrangler CLI 部署 (最快)

1. **安装 Wrangler 并登录 Cloudflare 账号**：
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **检出项目并安装依赖**：
   ```bash
   git clone https://github.com/your-username/fox-ai.git
   cd fox-ai
   npm install
   ```

3. **构建前端静态资源**：
   ```bash
   npm run build
   ```

4. **一键发布至 Cloudflare Workers**：
   ```bash
   npx wrangler deploy
   ```

---

## 🔺 方案二：Vercel 一键部署

1. **导入 Git 仓库**：
   在 Vercel Dashboard 点击 **New Project**，选择已 Fork 或上传的 `fox-ai` 仓库。

2. **配置构建指令**：
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **设置环境变量 (Optional)**：
   在 Environment Variables 区域添加：
   - `ADMIN_USERNAME`: `admin`
   - `ADMIN_PASSWORD`: `your_secure_password`

4. **部署**：
   点击 **Deploy** 按钮，等待 1 分钟即可生成类似 `https://fox-ai.vercel.app` 的独享域名。

---

## 🐳 方案三：Docker & Docker Compose 容器化部署

适合拥有 VPS、自建服务器或 Docker 托管环境的用户。

### 1. 使用单容器 Docker 部署

```bash
# 1. 构建镜像
docker build -t fox-ai:1.0 .

# 2. 启动容器
docker run -d \
  --name fox-ai-app \
  -p 8080:80 \
  --restart always \
  fox-ai:1.0
```
访问 `http://your-server-ip:8080` 即可使用。

### 2. 使用 Docker-Compose 部署

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  fox-ai:
    build: .
    container_name: fox-ai-service
    ports:
      - "8080:80"
    environment:
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=fox_secure_pass_2025
    restart: always
```

运行启动指令：
```bash
docker-compose up -d
```

---

## ⚡ 方案四：Wasmer / Edge WebAssembly 部署

Wasmer 支持以 WebAssembly & WASI 形式部署至全局边缘节点。

1. **安装 Wasmer CLI**：
   ```bash
   curl https://get.wasmer.io -sSfL | sh
   ```

2. **使用 Wasmer 发布项目**：
   ```bash
   wasmer deploy
   ```

---

## 🛠️ 部署常见问题排查 (Troubleshooting)

### Q1: 提示“Cloudflare AI API Error”或没有出图？
- **原因**：前端未配置 Cloudflare API Token / Account ID，且后端未配置环境变量或 Workers AI Binding 未绑定成功。
- **解决**：进入项目设置页面（⚙️ 设置），填入你的 Cloudflare Account ID 和 API Token。狐AI 亦内置了 100% 可用的模拟展示兜底逻辑，确保不会静默失败或卡死。

### Q2: Docker 构建镜像时在 `npm install` 卡住？
- **原因**：网络延迟。
- **解决**：在 Dockerfile 中切换至 NPM 淘宝镜像源：
  `RUN npm config set registry https://registry.npmmirror.com`
