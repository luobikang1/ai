import { PRESET_MODELS, ART_STYLES, NEGATIVE_PROMPT_PRESETS } from './config.js';

// Application State
const state = {
  user: JSON.parse(localStorage.getItem('fox_user')) || null, // { username, token }
  activeTab: 'txt2img', // txt2img | img2img | models | translator | history | settings
  theme: localStorage.getItem('fox_theme') || 'dark',
  settings: {
    cfAccountId: localStorage.getItem('fox_cf_account_id') || '',
    cfApiToken: localStorage.getItem('fox_cf_api_token') || '',
    nsfwEnabled: localStorage.getItem('fox_nsfw_enabled') === 'true',
    adminPassword: localStorage.getItem('fox_admin_password') || ''
  },
  models: JSON.parse(localStorage.getItem('fox_custom_models')) || PRESET_MODELS,
  bookmarkedModels: JSON.parse(localStorage.getItem('fox_bookmarks') || '[]'),
  searchQuery: '',
  selectedModel: '@cf/bytedance/stable-diffusion-xl-lightning',
  selectedStyle: 'none',
  prompt: '',
  negativePrompt: NEGATIVE_PROMPT_PRESETS[0],
  width: 1024,
  height: 1024,
  img2imgBase64: null,
  isGenerating: false,
  generationStatus: 'idle',
  lastGeneratedImage: null,
  history: JSON.parse(localStorage.getItem('fox_history') || '[]'),

  // Login Form
  loginUsername: '',
  loginPassword: '',
  loginError: '',

  // AI Translate & Assistant State
  chatInput: '',
  chatMessages: [
    { role: 'assistant', text: '你好！我是狐AI智能助手。你可以输入中文，我将为你进行高精度提示词双向翻译或优化生图词库！' }
  ],
  isTranslatingPrompt: false
};

// DOM Initializer
export function initApp() {
  applyTheme(state.theme);
  renderApp();
  bindGlobalEvents();
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('fox_theme', theme);
}

function renderApp() {
  const root = document.getElementById('app');

  // If user is not logged in, render login modal overlay / view
  if (!state.user) {
    root.innerHTML = renderLoginScreen();
    bindLoginEvents();
    return;
  }

  root.innerHTML = `
    <div class="min-h-screen flex flex-col pb-20 md:pb-6">
      <!-- Header Bar -->
      <header class="sticky top-0 z-40 glass-panel !rounded-none !border-x-0 !border-t-0 px-4 py-3 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/30 text-lg">
            🦊
          </div>
          <div>
            <h1 class="text-lg font-black tracking-tight fox-gradient-text leading-none">狐AI</h1>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">极简轻量级 AI 绘图工作台</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- User Status Badge -->
          <span class="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
            👤 ${state.user.username}
          </span>

          <!-- NSFW Switch Badge -->
          <button id="nsfw-toggle-btn" class="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
            state.settings.nsfwEnabled
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
          }">
            <span>${state.settings.nsfwEnabled ? '🔞 成人模式开' : '🛡️ 安全保护'}</span>
          </button>

          <!-- Theme Switcher -->
          <button id="theme-btn" class="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            ${state.theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <!-- Main Navigation Tabs (Mobile & Desktop Header) -->
      <nav class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around overflow-x-auto no-scrollbar gap-1 text-xs font-medium">
        <button data-tab="txt2img" class="nav-tab-btn ${state.activeTab === 'txt2img' ? 'active' : ''}">
          🎨 文生图
        </button>
        <button data-tab="img2img" class="nav-tab-btn ${state.activeTab === 'img2img' ? 'active' : ''}">
          🖼️ 图生图
        </button>
        <button data-tab="models" class="nav-tab-btn ${state.activeTab === 'models' ? 'active' : ''}">
          📦 模型库 (${state.models.length})
        </button>
        <button data-tab="translator" class="nav-tab-btn ${state.activeTab === 'translator' ? 'active' : ''}">
          💬 AI翻译/对话
        </button>
        <button data-tab="history" class="nav-tab-btn ${state.activeTab === 'history' ? 'active' : ''}">
          📜 历史记录 (${state.history.length})
        </button>
        <button data-tab="settings" class="nav-tab-btn ${state.activeTab === 'settings' ? 'active' : ''}">
          ⚙️ 设置
        </button>
      </nav>

      <!-- Main Workspace Container -->
      <main class="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
        ${renderActiveTabContent()}
      </main>

      <!-- Bottom Fixed Status Bar -->
      <footer class="fixed bottom-0 left-0 right-0 z-30 glass-panel !rounded-none !border-x-0 !border-b-0 px-4 py-2 text-center text-xs text-slate-500 dark:text-slate-400">
        <span>狐AI v1.0 • 驱动引擎: Cloudflare Workers AI / Edge Native</span>
      </footer>
    </div>
  `;

  bindTabEvents();
}

function renderLoginScreen() {
  return `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/40 text-white">
      <div class="glass-panel max-w-sm w-full p-6 space-y-6 !bg-slate-900/90 !border-slate-800 shadow-2xl">
        <div class="text-center space-y-2">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-orange-500/30">
            🦊
          </div>
          <h2 class="text-2xl font-black fox-gradient-text">狐AI 绘图工作台</h2>
          <p class="text-xs text-slate-400">请登录以开启极简高颜值 AI 艺术创作</p>
        </div>

        ${state.loginError ? `
          <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
            ⚠️ ${state.loginError}
          </div>
        ` : ''}

        <form id="login-form" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">用户名</label>
            <input type="text" id="login-username-input" class="fox-input" placeholder="输入管理员账号 (默认: admin)" value="${state.loginUsername}" required />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">密码</label>
            <input type="password" id="login-password-input" class="fox-input" placeholder="输入密码 (默认: fox123456)" value="${state.loginPassword}" required />
          </div>

          <button type="submit" class="fox-btn-primary w-full py-3 text-sm font-bold shadow-lg shadow-orange-500/25">
            🔐 立即登录
          </button>
        </form>

        <div class="text-center text-[11px] text-slate-500 border-t border-slate-800 pt-3">
          提示：亦可使用演示账号 <b>fox</b> / 密码 <b>fox123</b>
        </div>
      </div>
    </div>
  `;
}

function bindLoginEvents() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username-input').value.trim();
    const password = document.getElementById('login-password-input').value.trim();

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        state.user = { username: data.username, token: data.token };
        localStorage.setItem('fox_user', JSON.stringify(state.user));
        state.loginError = '';
        renderApp();
      } else {
        state.loginError = data.message || '登录失败';
        renderApp();
      }
    } catch (err) {
      state.loginError = '服务器未连接或响应异常';
      renderApp();
    }
  });
}

function renderActiveTabContent() {
  switch (state.activeTab) {
    case 'txt2img':
    case 'img2img':
      return renderGenerationWorkspace();
    case 'models':
      return renderModelHub();
    case 'translator':
      return renderTranslatorWorkspace();
    case 'history':
      return renderHistoryWorkspace();
    case 'settings':
      return renderSettingsWorkspace();
    default:
      return renderGenerationWorkspace();
  }
}

// -------------------------------------------------------------
// Workspace Rendering (Txt2Img & Img2Img)
// -------------------------------------------------------------
function renderGenerationWorkspace() {
  const isImg2Img = state.activeTab === 'img2img';
  const selectedModelObj = state.models.find(m => m.id === state.selectedModel) || state.models[0];

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Column: Controls & Inputs -->
      <div class="lg:col-span-7 space-y-5">

        <!-- Model Selection Header Banner -->
        <div class="glass-panel p-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 overflow-hidden">
            <img src="${selectedModelObj.cover}" class="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm border border-slate-200 dark:border-slate-700" />
            <div class="truncate">
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-0.5 rounded-md font-bold ${selectedModelObj.isFree ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600'}">
                  ${selectedModelObj.isFree ? '免费模型' : '需要Key'}
                </span>
                <span class="text-xs text-slate-400">${selectedModelObj.category}</span>
              </div>
              <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">${selectedModelObj.name}</h3>
            </div>
          </div>
          <button data-tab="models" class="fox-btn-secondary text-xs flex-shrink-0">
            切换模型 🔄
          </button>
        </div>

        <!-- Image-to-Image File Upload Area -->
        ${isImg2Img ? `
          <div class="glass-panel p-4 space-y-3">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
              🖼️ 上传参考图 (Image-to-Image)
            </label>
            <div id="img2img-dropzone" class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 rounded-xl p-4 text-center cursor-pointer transition relative bg-slate-50/50 dark:bg-slate-900/50">
              ${state.img2imgBase64 ? `
                <div class="relative inline-block">
                  <img src="${state.img2imgBase64}" class="max-h-48 rounded-lg shadow-md object-contain mx-auto" />
                  <button id="remove-ref-img-btn" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition">✕</button>
                </div>
              ` : `
                <div class="space-y-1">
                  <div class="text-2xl">📸</div>
                  <p class="text-xs text-slate-500">点击上传图像参考图（支持 JPG, PNG, WEBP）</p>
                </div>
              `}
              <input type="file" id="img2img-input" accept="image/*" class="hidden" />
            </div>
          </div>
        ` : ''}

        <!-- Prompt Input Area -->
        <div class="glass-panel p-4 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              💡 正向提示词 (Prompt)
            </label>
            <button id="translate-prompt-btn" class="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1">
              🌐 中英双向翻译 / 智能优化
            </button>
          </div>

          <textarea id="prompt-input" rows="3" class="fox-input font-mono text-xs leading-relaxed" placeholder="输入提示词，例如：一个身穿未来赛博朋克装甲的狐狸战士，国风海报，发光霓虹灯，8k超高清...">${state.prompt}</textarea>

          <div id="translate-status-indicator" class="hidden text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center gap-2 animate-pulse">
            <span class="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
            <span>AI正在智能处理并优化提示词...</span>
          </div>
        </div>

        <!-- Style Preset Selector Bar -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300">🎨 风格工作台预设</label>
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            ${ART_STYLES.map(style => `
              <button data-style-id="${style.id}" class="style-chip ${state.selectedStyle === style.id ? 'active' : ''}">
                ${style.name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Negative Prompt Input Area -->
        <div class="glass-panel p-4 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">🚫 负向提示词 (Negative Prompt)</label>
            <button id="auto-negative-btn" class="text-[11px] text-amber-600 dark:text-amber-400 hover:underline">
              ⚡ 一键预设通用负向词
            </button>
          </div>
          <textarea id="negative-prompt-input" rows="2" class="fox-input font-mono text-xs text-slate-500">${state.negativePrompt}</textarea>
        </div>

        <!-- Generation Parameters -->
        <div class="glass-panel p-4 space-y-3">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300">📐 图像尺寸规格</label>
          <div class="grid grid-cols-3 gap-2">
            <button data-size="1024x1024" class="size-chip ${state.width === 1024 && state.height === 1024 ? 'active' : ''}">
              <span class="block text-sm font-bold">1:1</span>
              <span class="text-[10px] opacity-70">1024 × 1024</span>
            </button>
            <button data-size="768x1024" class="size-chip ${state.width === 768 && state.height === 1024 ? 'active' : ''}">
              <span class="block text-sm font-bold">3:4</span>
              <span class="text-[10px] opacity-70">768 × 1024</span>
            </button>
            <button data-size="1024x768" class="size-chip ${state.width === 1024 && state.height === 768 ? 'active' : ''}">
              <span class="block text-sm font-bold">4:3</span>
              <span class="text-[10px] opacity-70">1024 × 768</span>
            </button>
          </div>
        </div>

        <!-- Big Generation Action Button -->
        <button id="generate-btn" class="fox-btn-primary w-full py-3.5 text-base shadow-lg shadow-orange-500/25 ${state.isGenerating ? 'opacity-70 cursor-wait' : ''}">
          ${state.isGenerating ? `
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>绘制生成中，请稍候...</span>
          ` : `
            ✨ 立即开始智能绘制
          `}
        </button>

      </div>

      <!-- Right Column: Live Preview Box & Actions -->
      <div class="lg:col-span-5">
        <div class="glass-panel p-4 sticky top-24 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              🖼️ 实时绘图工作台预览
            </h2>
            <span class="text-[11px] text-slate-400">
              ${state.isGenerating ? '⚡ 算力计算中' : '🟢 就绪'}
            </span>
          </div>

          <div class="relative min-h-[320px] max-h-[500px] w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            ${state.isGenerating ? `
              <div class="p-6 text-center space-y-3">
                <div class="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">狐AI 正在为您精准构图与绘制...</p>
                <p class="text-[10px] text-slate-400">基于 Cloudflare Edge Workers AI 高性能推理</p>
              </div>
            ` : state.lastGeneratedImage ? `
              <img id="preview-image" src="${state.lastGeneratedImage.url}" class="w-full h-full object-contain rounded-lg shadow-inner" />
            ` : `
              <div class="text-center p-6 space-y-2">
                <div class="text-4xl opacity-40">🦊</div>
                <p class="text-xs text-slate-400 font-medium">预览区暂无生成结果</p>
                <p class="text-[11px] text-slate-400">在左侧输入提示词并点击生成</p>
              </div>
            `}
          </div>

          ${state.lastGeneratedImage ? `
            <div class="grid grid-cols-2 gap-2 pt-2">
              <a href="${state.lastGeneratedImage.url}" download="fox-ai-${Date.now()}.png" class="fox-btn-secondary text-xs text-center justify-center">
                📥 下载高清原图
              </a>
              <button id="reuse-prompt-btn" class="fox-btn-secondary text-xs">
                🔄 一键同款生图
              </button>
            </div>
          ` : ''}

        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Model Hub Workspace
// -------------------------------------------------------------
function renderModelHub() {
  const filteredModels = state.models.filter(m => {
    const q = state.searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) ||
           m.category.toLowerCase().includes(q) ||
           m.description.toLowerCase().includes(q) ||
           m.author.toLowerCase().includes(q);
  });

  return `
    <div class="space-y-5">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">📦 免 Key 热门开源模型库</h2>
          <p class="text-xs text-slate-500">精选全网 Stable Diffusion、SDXL 及二次元海报免费算力模型</p>
        </div>

        <div class="relative max-w-xs w-full">
          <input type="text" id="model-search-input" class="fox-input pr-8" placeholder="搜索模型名称、标签、作者..." value="${state.searchQuery}" />
          <span class="absolute right-3 top-2.5 text-xs text-slate-400">🔍</span>
        </div>
      </div>

      <div id="models-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${renderModelItems(filteredModels)}
      </div>
    </div>
  `;
}

function renderModelItems(modelsList) {
  if (modelsList.length === 0) {
    return `<div class="col-span-full text-center py-12 text-slate-400 text-xs">未找到符合条件的模型</div>`;
  }

  return modelsList.map(model => {
    const isBookmarked = state.bookmarkedModels.includes(model.id);

    return `
      <div class="glass-panel overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="relative h-36 w-full overflow-hidden bg-slate-800">
            <img src="${model.cover}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
            <span class="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold shadow ${
              model.isFree ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }">
              ${model.isFree ? '免费模型' : '需要Key'}
            </span>

            <!-- Bookmark Button -->
            <button data-bookmark-model="${model.id}" class="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-amber-400 backdrop-blur-sm hover:scale-110 transition">
              ${isBookmarked ? '⭐' : '☆'}
            </button>
          </div>

          <div class="p-3.5 space-y-1.5">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">${model.name}</h4>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">${model.description}</p>
          </div>
        </div>

        <div class="p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between mt-2">
          <span class="text-[10px] text-slate-400">作者: ${model.author}</span>
          <button data-use-model="${model.id}" class="fox-btn-primary text-xs py-1.5 px-3">
            ${state.selectedModel === model.id ? '当前使用中' : '使用此模型'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------
// AI Dialogue & Translation Workspace
// -------------------------------------------------------------
function renderTranslatorWorkspace() {
  return `
    <div class="glass-panel p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <span class="text-2xl">🌐</span>
        <div>
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">狐AI 提示词助理 & 中英双向翻译</h2>
          <p class="text-xs text-slate-500">内置智能大语言模型，支持中文爆款生图词扩展、英文互译</p>
        </div>
      </div>

      <div id="chat-container" class="space-y-3 min-h-[300px] max-h-[420px] overflow-y-auto p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
        ${state.chatMessages.map(msg => `
          <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
              msg.role === 'user'
                ? 'bg-orange-500 text-white rounded-br-none shadow'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
            }">
              <p class="whitespace-pre-wrap leading-relaxed">${msg.text}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="flex gap-2">
        <input type="text" id="chat-input" class="fox-input flex-1" placeholder="输入中文描述（如：写实风格的敦煌飞天神女海报）..." />
        <button id="send-chat-btn" class="fox-btn-primary flex-shrink-0">
          发送 🚀
        </button>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// History Workspace
// -------------------------------------------------------------
function renderHistoryWorkspace() {
  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">📜 历史生成记录</h2>
          <p class="text-xs text-slate-500">已自动持久化存储在当前浏览器本地</p>
        </div>
        ${state.history.length > 0 ? `
          <button id="clear-history-btn" class="fox-btn-secondary text-xs text-red-500 hover:text-red-600">
            🗑️ 清空记录
          </button>
        ` : ''}
      </div>

      ${state.history.length === 0 ? `
        <div class="glass-panel p-12 text-center space-y-2">
          <div class="text-4xl opacity-30">📂</div>
          <p class="text-sm font-semibold text-slate-500">暂无历史记录</p>
          <p class="text-xs text-slate-400">快去体验第一张 AI 艺术创作吧！</p>
        </div>
      ` : `
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          ${state.history.map((item, idx) => `
            <div class="glass-panel overflow-hidden group relative flex flex-col justify-between">
              <div class="relative aspect-square bg-slate-900 overflow-hidden">
                <img src="${item.url}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
                  <a href="${item.url}" download="fox-ai-${item.timestamp}.png" class="p-2 bg-white/90 rounded-full text-xs hover:scale-110 transition shadow" title="下载图片">📥</a>
                  <button data-delete-history="${idx}" class="p-2 bg-red-500/90 text-white rounded-full text-xs hover:scale-110 transition shadow" title="删除">🗑️</button>
                </div>
              </div>

              <div class="p-2.5 space-y-1">
                <p class="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 font-mono" title="${item.prompt}">${item.prompt}</p>
                <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>${new Date(item.timestamp).toLocaleTimeString()}</span>
                  <button data-reuse-history-prompt="${encodeURIComponent(item.prompt)}" class="text-orange-500 font-bold hover:underline">
                    一键绘图 🎨
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// -------------------------------------------------------------
// Settings Workspace
// -------------------------------------------------------------
function renderSettingsWorkspace() {
  return `
    <div class="glass-panel p-5 max-w-xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            ⚙️ 系统设置 (狐AI)
          </h2>
          <p class="text-xs text-slate-500">修改 Cloudflare API 凭证、安全模式与管理选项</p>
        </div>
        <button id="logout-btn" class="fox-btn-secondary text-xs text-red-500">
          🚪 退出登录
        </button>
      </div>

      <div class="space-y-4 text-xs">
        <div class="space-y-1.5">
          <label class="font-bold text-slate-700 dark:text-slate-300">Cloudflare Account ID (选填)</label>
          <input type="text" id="setting-cf-id" class="fox-input font-mono" value="${state.settings.cfAccountId}" placeholder="例如: 8a123f456789abcdef..." />
        </div>

        <div class="space-y-1.5">
          <label class="font-bold text-slate-700 dark:text-slate-300">Cloudflare API Token (选填)</label>
          <input type="password" id="setting-cf-token" class="fox-input font-mono" value="${state.settings.cfApiToken}" placeholder="Cloudflare Workers AI Token" />
        </div>

        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div>
            <span class="font-bold text-slate-800 dark:text-slate-200">🔞 成人内容展示开关</span>
            <p class="text-[11px] text-slate-400">开启后将解锁高级艺术内容生成提示</p>
          </div>
          <input type="checkbox" id="setting-nsfw" class="w-4 h-4 accent-orange-500 rounded cursor-pointer" ${state.settings.nsfwEnabled ? 'checked' : ''} />
        </div>

        <button id="save-settings-btn" class="fox-btn-primary w-full py-2.5">
          💾 保存设置
        </button>

        <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <span class="text-slate-400">重置系统状态</span>
          <button id="reset-factory-btn" class="text-red-500 hover:underline font-bold">
            ⚠️ 恢复出厂设置
          </button>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Global Event Listeners & Interactive Logic
// -------------------------------------------------------------
function bindGlobalEvents() {
  document.addEventListener('click', async (e) => {
    // Theme Toggle
    if (e.target.closest('#theme-btn')) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(state.theme);
      renderApp();
      return;
    }

    // NSFW toggle button in header
    if (e.target.closest('#nsfw-toggle-btn')) {
      state.settings.nsfwEnabled = !state.settings.nsfwEnabled;
      localStorage.setItem('fox_nsfw_enabled', state.settings.nsfwEnabled);
      renderApp();
      return;
    }

    // Logout
    if (e.target.closest('#logout-btn')) {
      state.user = null;
      localStorage.removeItem('fox_user');
      renderApp();
      return;
    }

    // Model select
    const useModelBtn = e.target.closest('[data-use-model]');
    if (useModelBtn) {
      state.selectedModel = useModelBtn.getAttribute('data-use-model');
      state.activeTab = 'txt2img';
      renderApp();
      return;
    }

    // Model Bookmark
    const bookmarkBtn = e.target.closest('[data-bookmark-model]');
    if (bookmarkBtn) {
      const modelId = bookmarkBtn.getAttribute('data-bookmark-model');
      if (state.bookmarkedModels.includes(modelId)) {
        state.bookmarkedModels = state.bookmarkedModels.filter(id => id !== modelId);
      } else {
        state.bookmarkedModels.push(modelId);
      }
      localStorage.setItem('fox_bookmarks', JSON.stringify(state.bookmarkedModels));
      renderApp();
      return;
    }

    // Size Selection
    const sizeBtn = e.target.closest('[data-size]');
    if (sizeBtn) {
      const [w, h] = sizeBtn.getAttribute('data-size').split('x').map(Number);
      state.width = w;
      state.height = h;
      renderApp();
      return;
    }

    // Style Selection
    const styleBtn = e.target.closest('[data-style-id]');
    if (styleBtn) {
      state.selectedStyle = styleBtn.getAttribute('data-style-id');
      renderApp();
      return;
    }

    // Translate / Prompt Optimize
    if (e.target.closest('#translate-prompt-btn')) {
      await handlePromptTranslation();
      return;
    }

    // Auto negative prompt
    if (e.target.closest('#auto-negative-btn')) {
      state.negativePrompt = NEGATIVE_PROMPT_PRESETS[0];
      const negInput = document.getElementById('negative-prompt-input');
      if (negInput) negInput.value = state.negativePrompt;
      return;
    }

    // Generate Button
    if (e.target.closest('#generate-btn')) {
      await handleGenerateImage();
      return;
    }

    // Img2Img File input trigger
    if (e.target.closest('#img2img-dropzone')) {
      const fileInput = document.getElementById('img2img-input');
      if (fileInput && !e.target.closest('#remove-ref-img-btn')) fileInput.click();
      return;
    }

    // Clear Img2Img Reference
    if (e.target.closest('#remove-ref-img-btn')) {
      state.img2imgBase64 = null;
      renderApp();
      return;
    }

    // Save Settings
    if (e.target.closest('#save-settings-btn')) {
      state.settings.cfAccountId = document.getElementById('setting-cf-id').value.trim();
      state.settings.cfApiToken = document.getElementById('setting-cf-token').value.trim();
      state.settings.nsfwEnabled = document.getElementById('setting-nsfw').checked;

      localStorage.setItem('fox_cf_account_id', state.settings.cfAccountId);
      localStorage.setItem('fox_cf_api_token', state.settings.cfApiToken);
      localStorage.setItem('fox_nsfw_enabled', state.settings.nsfwEnabled);
      alert('✅ 设置保存成功！');
      renderApp();
      return;
    }

    // Reset Factory
    if (e.target.closest('#reset-factory-btn')) {
      if (confirm('确定要恢复出厂设置吗？这将清空所有本地保存的凭证与历史记录！')) {
        localStorage.clear();
        location.reload();
      }
      return;
    }

    // Reuse prompt
    if (e.target.closest('#reuse-prompt-btn')) {
      state.activeTab = 'txt2img';
      renderApp();
      return;
    }

    // History reuse
    const reusePromptBtn = e.target.closest('[data-reuse-history-prompt]');
    if (reusePromptBtn) {
      const promptStr = decodeURIComponent(reusePromptBtn.getAttribute('data-reuse-history-prompt'));
      state.prompt = promptStr;
      state.activeTab = 'txt2img';
      renderApp();
      return;
    }

    // History delete
    const deleteHistoryBtn = e.target.closest('[data-delete-history]');
    if (deleteHistoryBtn) {
      const idx = parseInt(deleteHistoryBtn.getAttribute('data-delete-history'), 10);
      state.history.splice(idx, 1);
      localStorage.setItem('fox_history', JSON.stringify(state.history));
      renderApp();
      return;
    }

    // Clear all history
    if (e.target.closest('#clear-history-btn')) {
      if (confirm('确定清空所有生成记录吗？')) {
        state.history = [];
        localStorage.setItem('fox_history', JSON.stringify([]));
        renderApp();
      }
      return;
    }

    // Chat send button
    if (e.target.closest('#send-chat-btn')) {
      await handleSendChat();
      return;
    }
  });

  // Search Input Handler
  document.addEventListener('input', (e) => {
    if (e.target.id === 'model-search-input') {
      state.searchQuery = e.target.value;
      const filtered = state.models.filter(m => {
        const q = state.searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) ||
               m.category.toLowerCase().includes(q) ||
               m.description.toLowerCase().includes(q) ||
               m.author.toLowerCase().includes(q);
      });
      const grid = document.getElementById('models-grid');
      if (grid) grid.innerHTML = renderModelItems(filtered);
    }
  });

  // File input change handler for Img2Img
  document.addEventListener('change', (e) => {
    if (e.target.id === 'img2img-input') {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          state.img2imgBase64 = evt.target.result;
          renderApp();
        };
        reader.readAsDataURL(file);
      }
    }
  });
}

function bindTabEvents() {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.getAttribute('data-tab');
      renderApp();
    });
  });

  const promptTextarea = document.getElementById('prompt-input');
  if (promptTextarea) {
    promptTextarea.addEventListener('input', (e) => {
      state.prompt = e.target.value;
    });
  }

  const negPromptTextarea = document.getElementById('negative-prompt-input');
  if (negPromptTextarea) {
    negPromptTextarea.addEventListener('input', (e) => {
      state.negativePrompt = e.target.value;
    });
  }
}

// -------------------------------------------------------------
// Translation & Image Generation API Core Logic
// -------------------------------------------------------------
async function handlePromptTranslation() {
  if (!state.prompt.trim()) {
    alert('请先输入需要翻译或优化的提示词！');
    return;
  }

  const indicator = document.getElementById('translate-status-indicator');
  if (indicator) indicator.classList.remove('hidden');

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: state.prompt,
        cfAccountId: state.settings.cfAccountId,
        cfApiToken: state.settings.cfApiToken
      })
    });

    const data = await res.json();
    if (data.translatedText) {
      state.prompt = data.translatedText;
      const promptInput = document.getElementById('prompt-input');
      if (promptInput) promptInput.value = state.prompt;
    }
  } catch (err) {
    console.error('Translation error:', err);
  } finally {
    if (indicator) indicator.classList.add('hidden');
  }
}

async function handleGenerateImage() {
  if (!state.prompt.trim()) {
    alert('请输入正向提示词！');
    return;
  }

  state.isGenerating = true;
  renderApp();

  try {
    const styleObj = ART_STYLES.find(s => s.id === state.selectedStyle);
    const finalPrompt = styleObj && styleObj.prompt ? `${state.prompt}, ${styleObj.prompt}` : state.prompt;

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: state.selectedModel,
        prompt: finalPrompt,
        negativePrompt: state.negativePrompt,
        width: state.width,
        height: state.height,
        image: state.activeTab === 'img2img' ? state.img2imgBase64 : null,
        cfAccountId: state.settings.cfAccountId,
        cfApiToken: state.settings.cfApiToken
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ message: '生成失败' }));
      throw new Error(errJson.message || '绘图算力请求异常');
    }

    const data = await res.json();
    if (data.image) {
      state.lastGeneratedImage = {
        url: data.image,
        prompt: state.prompt,
        timestamp: Date.now()
      };

      state.history.unshift(state.lastGeneratedImage);
      localStorage.setItem('fox_history', JSON.stringify(state.history));
    }
  } catch (err) {
    alert(`❌ 绘图失败: ${err.message}`);
  } finally {
    state.isGenerating = false;
    renderApp();
  }
}

async function handleSendChat() {
  const input = document.getElementById('chat-input');
  if (!input || !input.value.trim()) return;

  const userMsg = input.value.trim();
  state.chatMessages.push({ role: 'user', text: userMsg });
  input.value = '';
  renderApp();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: state.chatMessages,
        cfAccountId: state.settings.cfAccountId,
        cfApiToken: state.settings.cfApiToken
      })
    });

    const data = await res.json();
    if (data.response) {
      state.chatMessages.push({ role: 'assistant', text: data.response });
    } else {
      state.chatMessages.push({ role: 'assistant', text: '已收到！建议提示词：' + userMsg });
    }
  } catch (err) {
    state.chatMessages.push({ role: 'assistant', text: '服务响应异常，请重试。' });
  } finally {
    renderApp();
  }
}
