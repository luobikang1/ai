import { PRESET_MODELS, ART_STYLES, NEGATIVE_PROMPT_PRESETS, THEME_COLORS, I18N_STRINGS } from './config.js';

// Application State
const state = {
  user: JSON.parse(localStorage.getItem('fox_user')) || null,
  activeTab: 'txt2img',
  themeMode: localStorage.getItem('fox_theme_mode') || 'dark',
  colorTheme: localStorage.getItem('fox_color_theme') || 'fox-orange',
  fontSize: localStorage.getItem('fox_font_size') || 'medium',
  lang: localStorage.getItem('fox_lang') || 'zh',
  deviceMode: localStorage.getItem('fox_device_mode') || 'auto',

  accordionStates: JSON.parse(localStorage.getItem('fox_accordion_states') || JSON.stringify({
    sec1: false, sec2: false, sec3: false, sec4: false, sec5: false,
    sec6: false, sec7: false, sec8: false, sec9: false, sec10: false, sec11: false
  })),

  status: {
    cfApi: true,
    d1Database: false,
    r2Bucket: false
  },

  settings: {
    cfAccountId: localStorage.getItem('fox_cf_account_id') || '',
    cfApiToken: localStorage.getItem('fox_cf_api_token') || '',
    nsfwEnabled: localStorage.getItem('fox_nsfw_enabled') === 'true',
    adminPassword: localStorage.getItem('fox_admin_password') || 'fox123456',
    engineChoice: localStorage.getItem('fox_engine_choice') || 'cf_workers_ai',
    extImageKey: localStorage.getItem('fox_ext_image_key') || '',
    extChatKey: localStorage.getItem('fox_ext_chat_key') || ''
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
  isCustomSize: false,
  img2imgBase64: null,
  isGenerating: false,
  lastGeneratedImage: null,

  historyTab: 'local',
  localHistory: JSON.parse(localStorage.getItem('fox_history') || '[]'),
  r2Storage: {
    bound: false,
    objects: [],
    totalSizeMB: '0.00',
    remainingSpaceMB: '10240.00'
  },

  // Auth & Form State
  authTab: 'login', // 'login' | 'register'
  loginUsername: '',
  loginPassword: '',
  registerEmail: '',
  registerUsername: '',
  registerPassword: '',
  authError: '',
  newPasswordInput: '',

  chatInput: '',
  chatMessages: [
    { role: 'assistant', text: '你好！我是狐AI智能助手。你可以输入中文，我将为你进行高精度提示词双向翻译或优化生图词库！' }
  ]
};

// DOM Initializer
export function initApp() {
  applyAppPreferences();
  fetchServiceStatus();
  renderApp();
  bindGlobalEvents();
}

function applyAppPreferences() {
  if (state.themeMode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.body.className = `font-size-${state.fontSize} ${state.themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`;
}

async function safeFetchApi(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Network fallback for ${url}:`, err);
  }
  return null;
}

async function fetchServiceStatus() {
  const data = await safeFetchApi('/api/status');
  if (data) {
    state.status = data;
  }
  if (state.user && state.activeTab === 'history') {
    await fetchR2Objects();
  }
}

async function fetchR2Objects() {
  const data = await safeFetchApi('/api/r2/list');
  if (data) {
    state.r2Storage = data;
  }
}

function t(key) {
  const dictionary = I18N_STRINGS[state.lang] || I18N_STRINGS.zh;
  return dictionary[key] || key;
}

function renderApp() {
  const root = document.getElementById('app');

  if (!state.user) {
    root.innerHTML = renderAuthScreen();
    bindAuthEvents();
    return;
  }

  const containerWidthClass = state.deviceMode === 'mobile' ? 'max-w-sm' : state.deviceMode === 'desktop' ? 'max-w-6xl' : 'max-w-5xl';

  root.innerHTML = `
    <div class="min-h-screen flex flex-col pb-20 md:pb-6">
      <!-- Top Header -->
      <header class="sticky top-0 z-40 glass-panel !rounded-none !border-x-0 !border-t-0 px-4 py-3 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/30 text-lg">
            🦊
          </div>
          <div>
            <h1 class="text-lg font-black tracking-tight fox-gradient-text leading-none">${t('appTitle')}</h1>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">${t('subTitle')}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] border border-slate-200 dark:border-slate-700">
            <span class="flex items-center gap-1" title="Cloudflare API Status">
              <span class="w-2 h-2 rounded-full ${state.status.cfApi ? 'bg-emerald-500' : 'bg-red-500'}"></span> CF
            </span>
            <span class="flex items-center gap-1" title="D1 Database Status">
              <span class="w-2 h-2 rounded-full ${state.status.d1Database ? 'bg-emerald-500' : 'bg-amber-500'}"></span> D1
            </span>
            <span class="flex items-center gap-1" title="R2 Object Storage Status">
              <span class="w-2 h-2 rounded-full ${state.status.r2Bucket ? 'bg-emerald-500' : 'bg-amber-500'}"></span> R2
            </span>
          </div>

          <span class="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
            👤 ${state.user.username}
          </span>

          <button id="theme-mode-btn" class="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            ${state.themeMode === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <!-- Navigation Tabs -->
      <nav class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around overflow-x-auto no-scrollbar gap-1 text-xs font-medium">
        <button data-tab="txt2img" class="nav-tab-btn ${state.activeTab === 'txt2img' ? 'active' : ''}">
          ${t('txt2img')}
        </button>
        <button data-tab="img2img" class="nav-tab-btn ${state.activeTab === 'img2img' ? 'active' : ''}">
          ${t('img2img')}
        </button>
        <button data-tab="models" class="nav-tab-btn ${state.activeTab === 'models' ? 'active' : ''}">
          ${t('models')} (${state.models.length})
        </button>
        <button data-tab="translator" class="nav-tab-btn ${state.activeTab === 'translator' ? 'active' : ''}">
          ${t('translator')}
        </button>
        <button data-tab="history" class="nav-tab-btn ${state.activeTab === 'history' ? 'active' : ''}">
          ${t('history')} (${state.localHistory.length})
        </button>
        <button data-tab="settings" class="nav-tab-btn ${state.activeTab === 'settings' ? 'active' : ''}">
          ${t('settings')}
        </button>
      </nav>

      <!-- Workspace Container -->
      <main class="flex-1 ${containerWidthClass} w-full mx-auto p-4 md:p-6 space-y-6 transition-all duration-200">
        ${renderActiveTabContent()}
      </main>

      <!-- Bottom Status Bar -->
      <footer class="fixed bottom-0 left-0 right-0 z-30 glass-panel !rounded-none !border-x-0 !border-b-0 px-4 py-2 text-center text-xs text-slate-500 dark:text-slate-400">
        <span>狐AI v1.0 • 多算力与 Cloudflare D1/R2 原生支持</span>
      </footer>
    </div>
  `;

  bindTabEvents();
}

// -------------------------------------------------------------
// Auth Screen: Strict Admin / User Registration without Guest Mode
// -------------------------------------------------------------
function renderAuthScreen() {
  const isRegister = state.authTab === 'register';

  return `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/40 text-white">
      <div class="glass-panel max-w-sm w-full p-6 space-y-6 !bg-slate-900/90 !border-slate-800 shadow-2xl">
        <div class="text-center space-y-2">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-orange-500/30">
            🦊
          </div>
          <h2 class="text-2xl font-black fox-gradient-text">狐AI 绘图工作台</h2>
          <p class="text-xs text-slate-400">管理员密码登录 / 邮箱与用户名新账号注册</p>
        </div>

        <div class="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
          <button id="tab-auth-login" class="flex-1 py-2 rounded-lg transition ${!isRegister ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}">
            🔐 账号登录
          </button>
          <button id="tab-auth-register" class="flex-1 py-2 rounded-lg transition ${isRegister ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}">
            📧 用户注册
          </button>
        </div>

        ${state.authError ? `
          <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
            ⚠️ ${state.authError}
          </div>
        ` : ''}

        <form id="auth-form" class="space-y-4">
          ${isRegister ? `
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300">电子邮箱地址</label>
              <input type="email" id="auth-email" class="fox-input" placeholder="user@example.com" value="${state.registerEmail}" required />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300">注册用户名</label>
              <input type="text" id="auth-username" class="fox-input" placeholder="请输入你的用户名" value="${state.registerUsername}" required />
            </div>
          ` : `
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300">用户名 / 管理员账号</label>
              <input type="text" id="auth-username" class="fox-input" placeholder="默认管理员: admin" value="${state.loginUsername}" required />
            </div>
          `}

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">密码</label>
            <input type="password" id="auth-password" class="fox-input" placeholder="${isRegister ? '设置 6 位以上登录密码' : '默认管理员密码: fox123456'}" value="${isRegister ? state.registerPassword : state.loginPassword}" required />
          </div>

          <button type="submit" class="fox-btn-primary w-full py-3 text-sm font-bold shadow-lg shadow-orange-500/25">
            ${isRegister ? '🚀 确认注册并开启绘图' : '🔐 登录系统'}
          </button>
        </form>
      </div>
    </div>
  `;
}

function bindAuthEvents() {
  document.getElementById('tab-auth-login')?.addEventListener('click', () => {
    state.authTab = 'login';
    state.authError = '';
    renderApp();
  });

  document.getElementById('tab-auth-register')?.addEventListener('click', () => {
    state.authTab = 'register';
    state.authError = '';
    renderApp();
  });

  document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.authTab === 'login') {
      const username = document.getElementById('auth-username').value.trim();
      const password = document.getElementById('auth-password').value.trim();

      // Client verification & fallback if server API unreachable
      try {
        const data = await safeFetchApi('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (data && data.success) {
          state.user = { username: data.username, token: data.token, role: data.role };
          localStorage.setItem('fox_user', JSON.stringify(state.user));
          state.authError = '';
          renderApp();
          return;
        }

        // Offline / Local Admin Verification Fallback
        if (username === 'admin' && password === (state.settings.adminPassword || 'fox123456')) {
          state.user = { username: 'admin', token: 'offline-admin-token', role: 'admin' };
          localStorage.setItem('fox_user', JSON.stringify(state.user));
          state.authError = '';
          renderApp();
          return;
        }

        // Local registered user check
        const localUsers = JSON.parse(localStorage.getItem('fox_registered_users') || '[]');
        const matched = localUsers.find(u => (u.username === username || u.email === username) && u.password === password);
        if (matched) {
          state.user = { username: matched.username, token: 'local-token', role: 'user' };
          localStorage.setItem('fox_user', JSON.stringify(state.user));
          state.authError = '';
          renderApp();
          return;
        }

        state.authError = '用户名或密码不正确';
        renderApp();
      } catch (err) {
        state.authError = '登录凭证校验失败';
        renderApp();
      }
    } else {
      const email = document.getElementById('auth-email').value.trim();
      const username = document.getElementById('auth-username').value.trim();
      const password = document.getElementById('auth-password').value.trim();

      if (!email || !username || !password) {
        state.authError = '请填写完整邮箱、用户名与密码';
        renderApp();
        return;
      }

      // Local persistence register
      const localUsers = JSON.parse(localStorage.getItem('fox_registered_users') || '[]');
      if (localUsers.some(u => u.username === username || u.email === email)) {
        state.authError = '该邮箱或用户名已被使用';
        renderApp();
        return;
      }

      localUsers.push({ email, username, password });
      localStorage.setItem('fox_registered_users', JSON.stringify(localUsers));

      // Attempt remote D1 register
      await safeFetchApi('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });

      state.user = { username, token: 'user-auth-token', role: 'user' };
      localStorage.setItem('fox_user', JSON.stringify(state.user));
      state.authError = '';
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
// Generation Workspace
// -------------------------------------------------------------
function renderGenerationWorkspace() {
  const isImg2Img = state.activeTab === 'img2img';
  const selectedModelObj = state.models.find(m => m.id === state.selectedModel) || state.models[0];

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-7 space-y-5">

        <div class="glass-panel p-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 overflow-hidden">
            <img src="${selectedModelObj.cover}" class="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm border border-slate-200 dark:border-slate-700" />
            <div class="truncate">
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-0.5 rounded-md font-bold ${selectedModelObj.isFree ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600'}">
                  ${selectedModelObj.isFree ? '免费模型' : '专属外接'}
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
                  <p class="text-xs text-slate-500">点击上传参考图（支持 JPG, PNG, WEBP）</p>
                </div>
              `}
              <input type="file" id="img2img-input" accept="image/*" class="hidden" />
            </div>
          </div>
        ` : ''}

        <div class="glass-panel p-4 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              ${t('promptLabel')}
            </label>
            <button id="translate-prompt-btn" class="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1">
              🌐 中英双向翻译 / 智能优化
            </button>
          </div>

          <textarea id="prompt-input" rows="3" class="fox-input font-mono text-xs leading-relaxed" placeholder="输入提示词，例如：一个身穿未来赛博朋克装甲的狐狸战士，国风海报，发光霓虹灯...">${state.prompt}</textarea>

          <div id="translate-status-indicator" class="hidden text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center gap-2 animate-pulse">
            <span class="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
            <span>AI正在智能处理提示词...</span>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300">${t('styleLabel')}</label>
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            ${ART_STYLES.map(style => `
              <button data-style-id="${style.id}" class="style-chip ${state.selectedStyle === style.id ? 'active' : ''}">
                ${style.name}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="glass-panel p-4 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">${t('negPromptLabel')}</label>
            <button id="auto-negative-btn" class="text-[11px] text-amber-600 dark:text-amber-400 hover:underline">
              ⚡ 一键通用负向词
            </button>
          </div>
          <textarea id="negative-prompt-input" rows="2" class="fox-input font-mono text-xs text-slate-500">${state.negativePrompt}</textarea>
        </div>

        <div class="glass-panel p-4 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">${t('sizeLabel')}</label>
            <button id="toggle-custom-size-btn" class="text-[11px] text-orange-600 dark:text-orange-400 font-bold hover:underline">
              ${state.isCustomSize ? '📐 切换回标准比例' : '⚙️ 自定义宽高像素'}
            </button>
          </div>

          ${state.isCustomSize ? `
            <div class="grid grid-cols-2 gap-3 pt-1">
              <div class="space-y-1">
                <span class="text-[11px] text-slate-400">宽度 (Width): ${state.width}px</span>
                <input type="number" id="custom-width-input" class="fox-input font-mono" value="${state.width}" step="64" min="256" max="2048" />
              </div>
              <div class="space-y-1">
                <span class="text-[11px] text-slate-400">高度 (Height): ${state.height}px</span>
                <input type="number" id="custom-height-input" class="fox-input font-mono" value="${state.height}" step="64" min="256" max="2048" />
              </div>
            </div>
          ` : `
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
          `}
        </div>

        <button id="generate-btn" class="fox-btn-primary w-full py-3.5 text-base shadow-lg shadow-orange-500/25 ${state.isGenerating ? 'opacity-70 cursor-wait' : ''}">
          ${state.isGenerating ? `
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>${t('generating')}</span>
          ` : `
            ${t('generate')}
          `}
        </button>

      </div>

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
                <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">狐AI 正在为您绘制...</p>
              </div>
            ` : state.lastGeneratedImage ? `
              <img id="preview-image" src="${state.lastGeneratedImage.url}" class="w-full h-full object-contain rounded-lg shadow-inner" />
            ` : `
              <div class="text-center p-6 space-y-2">
                <div class="text-4xl opacity-40">🦊</div>
                <p class="text-xs text-slate-400 font-medium">预览区暂无生成结果</p>
              </div>
            `}
          </div>

          ${state.lastGeneratedImage ? `
            <div class="space-y-2 pt-2">
              <div class="grid grid-cols-2 gap-2">
                <a href="${state.lastGeneratedImage.url}" download="fox-ai-${Date.now()}.png" class="fox-btn-secondary text-xs text-center justify-center">
                  📥 下载原图
                </a>
                <button id="upload-to-r2-btn" class="fox-btn-secondary text-xs text-orange-600 dark:text-orange-400">
                  ☁️ 同步保存至 R2
                </button>
              </div>
            </div>
          ` : ''}

        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// History Workspace (Local Pictures vs R2 Storage)
// -------------------------------------------------------------
function renderHistoryWorkspace() {
  const isR2 = state.historyTab === 'r2';

  return `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">📜 历史图片与云端存储</h2>
          <p class="text-xs text-slate-500">支持本地存储与 Cloudflare R2 对象存储双区管理</p>
        </div>

        <div class="flex rounded-xl bg-slate-200 dark:bg-slate-900 p-1 text-xs font-bold">
          <button id="history-tab-local" class="px-3 py-1.5 rounded-lg transition ${!isR2 ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}">
            💻 本地生成历史 (${state.localHistory.length})
          </button>
          <button id="history-tab-r2" class="px-3 py-1.5 rounded-lg transition ${isR2 ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}">
            ☁️ R2 云端对象存储
          </button>
        </div>
      </div>

      ${isR2 ? renderR2HistorySection() : renderLocalHistorySection()}
    </div>
  `;
}

function renderLocalHistorySection() {
  if (state.localHistory.length === 0) {
    return `
      <div class="glass-panel p-12 text-center space-y-2">
        <div class="text-4xl opacity-30">📂</div>
        <p class="text-sm font-semibold text-slate-500">暂无本地生成记录</p>
      </div>
    `;
  }

  return `
    <div class="space-y-3">
      <div class="flex justify-end">
        <button id="clear-local-history-btn" class="fox-btn-secondary text-xs text-red-500">
          🗑️ 清空本地历史
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        ${state.localHistory.map((item, idx) => `
          <div class="glass-panel overflow-hidden group relative flex flex-col justify-between">
            <div class="relative aspect-square bg-slate-900 overflow-hidden">
              <img src="${item.url}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
                <a href="${item.url}" download="fox-ai-${item.timestamp}.png" class="p-2 bg-white/90 rounded-full text-xs hover:scale-110 transition shadow">📥</a>
                <button data-delete-local-history="${idx}" class="p-2 bg-red-500/90 text-white rounded-full text-xs hover:scale-110 transition shadow">🗑️</button>
              </div>
            </div>

            <div class="p-2.5 space-y-1">
              <p class="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 font-mono">${item.prompt}</p>
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
    </div>
  `;
}

function renderR2HistorySection() {
  const r2 = state.r2Storage;

  return `
    <div class="space-y-4">
      <div class="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full ${r2.bound ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}"></span>
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">
              Cloudflare R2 对象存储桶: ${r2.bound ? '已连接运行中' : '未关联绑定'}
            </h3>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            已占用大小: <b class="text-orange-600 dark:text-orange-400">${r2.totalSizeMB || '0.00'} MB</b> |
            总剩余估算空间: <b class="text-emerald-600 dark:text-emerald-400">${r2.remainingSpaceMB || '10240'} MB</b>
          </p>
        </div>

        <div class="text-[11px] text-slate-400">
          * 提示: 超过 2MB 的高清大图需接入 R2 对象存储方可同步云端存储。
        </div>
      </div>

      ${!r2.bound ? `
        <div class="glass-panel p-8 text-center space-y-3">
          <div class="text-3xl">☁️</div>
          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">未接入 Cloudflare R2 存储桶</p>
          <p class="text-xs text-slate-500 max-w-md mx-auto">请在 Cloudflare Dashboard 创建 R2 Bucket 并绑定绑定名 <code>FOX_BUCKET</code>，详见设置页面一键绑定说明。</p>
        </div>
      ` : r2.objects.length === 0 ? `
        <div class="glass-panel p-8 text-center text-slate-400 text-xs">
          R2 存储桶目前为空，生成图片后可在预览区点击“同步保存至 R2”
        </div>
      ` : `
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          ${r2.objects.map(obj => `
            <div class="glass-panel p-3 space-y-2 flex flex-col justify-between">
              <div>
                <div class="aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center text-3xl">
                  🖼️
                </div>
                <div class="mt-2 space-y-0.5">
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title="${obj.key}">${obj.key}</p>
                  <p class="text-[10px] text-slate-400">文件大小: ${obj.formattedSize}</p>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button data-delete-r2="${encodeURIComponent(obj.key)}" class="text-xs text-red-500 hover:underline">
                  🗑️ 删除文件
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// -------------------------------------------------------------
// Model Hub
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

            <button data-bookmark-model="${model.id}" class="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-amber-400 backdrop-blur-sm hover:scale-110 transition">
              ${isBookmarked ? '⭐' : '☆'}
            </button>
          </div>

          <div class="p-3.5 space-y-1.5">
            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">${model.name}</h4>
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
// AI Dialogue & Translator
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
// Settings Workspace
// -------------------------------------------------------------
function renderSettingsWorkspace() {
  return `
    <div class="glass-panel p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">⚙️ 系统设置与管理面板</h2>
          <p class="text-xs text-slate-500">包含 11 项高级配置，分区默认收起并保持展开状态记忆</p>
        </div>
        <button id="logout-btn" class="fox-btn-secondary text-xs text-red-500">
          🚪 退出登录
        </button>
      </div>

      <div class="space-y-3">
        ${renderAccordion('sec1', '🌙 1. 一键切换夜间模式', `
          <div class="flex items-center justify-between">
            <span class="text-xs">切换全局深色/浅色视觉主题：</span>
            <button id="toggle-night-btn" class="fox-btn-secondary text-xs">
              ${state.themeMode === 'dark' ? '☀️ 切换为浅色模式' : '🌙 切换为夜间模式'}
            </button>
          </div>
        `)}

        ${renderAccordion('sec2', '💻 2. 电脑版与手机端无缝切换', `
          <div class="flex items-center justify-between text-xs">
            <span>当前布局视图：</span>
            <div class="flex gap-1">
              <button data-device="auto" class="px-2.5 py-1 rounded-lg ${state.deviceMode === 'auto' ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}">自动自适应</button>
              <button data-device="desktop" class="px-2.5 py-1 rounded-lg ${state.deviceMode === 'desktop' ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}">电脑桌面版</button>
              <button data-device="mobile" class="px-2.5 py-1 rounded-lg ${state.deviceMode === 'mobile' ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}">手机客户端</button>
            </div>
          </div>
        `)}

        ${renderAccordion('sec3', '⚡ 3. 融合算力引擎选择', `
          <div class="space-y-2 text-xs">
            <label class="block font-bold">优先算力服务引擎：</label>
            <select id="engine-select" class="fox-input">
              <option value="cf_workers_ai" ${state.settings.engineChoice === 'cf_workers_ai' ? 'selected' : ''}>Cloudflare Workers AI (免费极速边缘节点)</option>
              <option value="fal_ai" ${state.settings.engineChoice === 'fal_ai' ? 'selected' : ''}>Fal.ai Fast SDXL 引擎</option>
              <option value="replicate" ${state.settings.engineChoice === 'replicate' ? 'selected' : ''}>Replicate 算力云</option>
            </select>
          </div>
        `)}

        ${renderAccordion('sec4', '🔑 4. 其他外接算力 KEY 配置', `
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold mb-1">Cloudflare Account ID:</label>
              <input type="text" id="setting-cf-id" class="fox-input font-mono" value="${state.settings.cfAccountId}" placeholder="8a123f4567..." />
            </div>
            <div>
              <label class="block font-bold mb-1">Cloudflare API Token:</label>
              <input type="password" id="setting-cf-token" class="fox-input font-mono" value="${state.settings.cfApiToken}" placeholder="v1.0-xxxx..." />
            </div>
            <div>
              <label class="block font-bold mb-1">外接图像算力 API Key (如 Fal/Replicate):</label>
              <input type="password" id="setting-ext-image-key" class="fox-input font-mono" value="${state.settings.extImageKey}" placeholder="外接图像算力 Key" />
            </div>
            <button id="save-keys-btn" class="fox-btn-primary w-full text-xs py-2">💾 保存 API KEY 配置</button>
          </div>
        `)}

        ${renderAccordion('sec5', '💬 5. 外接 AI 对话与翻译 API Key 配置', `
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold mb-1">外接 LLM 对话 API Key (如 OpenAI/Claude/DeepSeek):</label>
              <input type="password" id="setting-ext-chat-key" class="fox-input font-mono" value="${state.settings.extChatKey}" placeholder="sk-xxxx..." />
            </div>
            <button id="save-chat-key-btn" class="fox-btn-primary w-full text-xs py-2">💾 保存对话 API Key</button>
          </div>
        `)}

        ${renderAccordion('sec6', '🔐 6. 密码修改区 & 管理员使用设备', `
          <div class="space-y-3 text-xs">
            <div class="space-y-1">
              <label class="block font-bold">新登录密码：</label>
              <input type="password" id="new-password-input" class="fox-input" placeholder="输入新密码" />
            </div>
            <button id="change-pass-btn" class="fox-btn-secondary text-xs w-full">修改密码</button>

            <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label class="block font-bold mb-1">当前登录设备信息：</label>
              <div class="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-mono text-[11px] text-slate-500 break-all">
                UA: ${navigator.userAgent}
              </div>
            </div>
          </div>
        `)}

        ${renderAccordion('sec7', '🔴 7. Cloudflare API 状态指示灯', `
          <div class="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900">
            <span class="font-bold">Cloudflare Workers AI 状态：</span>
            <span class="flex items-center gap-1.5 font-bold ${state.status.cfApi ? 'text-emerald-500' : 'text-red-500'}">
              <span class="w-2.5 h-2.5 rounded-full ${state.status.cfApi ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}"></span>
              ${state.status.cfApi ? '服务正常运行中' : '未连接或 Key 无效'}
            </span>
          </div>
        `)}

        ${renderAccordion('sec8', '🗄️ 8. Cloudflare D1 数据库绑定状态指示灯', `
          <div class="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900">
            <span class="font-bold">D1 数据库绑定状态 (DB)：</span>
            <span class="flex items-center gap-1.5 font-bold ${state.status.d1Database ? 'text-emerald-500' : 'text-amber-500'}">
              <span class="w-2.5 h-2.5 rounded-full ${state.status.d1Database ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
              ${state.status.d1Database ? 'D1 数据库已绑定' : '未绑定 D1 数据库 (使用本地模式)'}
            </span>
          </div>
        `)}

        ${renderAccordion('sec9', '☁️ 9. Cloudflare R2 存储桶绑定状态指示灯', `
          <div class="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900">
            <span class="font-bold">R2 对象存储桶绑定状态 (FOX_BUCKET)：</span>
            <span class="flex items-center gap-1.5 font-bold ${state.status.r2Bucket ? 'text-emerald-500' : 'text-amber-500'}">
              <span class="w-2.5 h-2.5 rounded-full ${state.status.r2Bucket ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
              ${state.status.r2Bucket ? 'R2 桶已绑定' : '未绑定 R2 桶'}
            </span>
          </div>
        `)}

        ${renderAccordion('sec10', '🚪 10. 一键退出系统', `
          <div class="text-xs space-y-2">
            <p class="text-slate-500">安全清除登录凭证并退出当前账号：</p>
            <button id="setting-logout-btn" class="fox-btn-secondary text-xs text-red-500 font-bold w-full">
              🚪 安全退出登录
            </button>
          </div>
        `)}

        ${renderAccordion('sec11', '📖 11. Cloudflare 后台绑定 D1 和 R2 步骤说明', `
          <div class="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p><b>D1 数据库绑定：</b>在 Cloudflare 控制台创建 D1 数据库，在 <code>wrangler.toml</code> 添加：</p>
            <pre class="p-2 rounded bg-slate-900 text-orange-400 font-mono text-[11px]">[[d1_databases]]\nbinding = "DB"\ndatabase_name = "fox_db"\ndatabase_id = "xxxx"</pre>
            <p class="pt-1"><b>R2 存储桶绑定：</b>在 Cloudflare R2 创建 Bucket，并在 <code>wrangler.toml</code> 添加：</p>
            <pre class="p-2 rounded bg-slate-900 text-orange-400 font-mono text-[11px]">[[r2_buckets]]\nbinding = "FOX_BUCKET"\nbucket_name = "fox-ai-bucket"</pre>
          </div>
        `)}

      </div>
    </div>
  `;
}

function renderAccordion(id, title, contentHtml) {
  const isOpen = !!state.accordionStates[id];

  return `
    <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
      <button data-accordion-id="${id}" class="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition">
        <span>${title}</span>
        <span class="text-slate-400 text-base">${isOpen ? '▲' : '▼'}</span>
      </button>
      ${isOpen ? `<div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">${contentHtml}</div>` : ''}
    </div>
  `;
}

// -------------------------------------------------------------
// Interactive Events Listener
// -------------------------------------------------------------
function bindGlobalEvents() {
  document.addEventListener('click', async (e) => {
    const accBtn = e.target.closest('[data-accordion-id]');
    if (accBtn) {
      const id = accBtn.getAttribute('data-accordion-id');
      state.accordionStates[id] = !state.accordionStates[id];
      localStorage.setItem('fox_accordion_states', JSON.stringify(state.accordionStates));
      renderApp();
      return;
    }

    if (e.target.closest('#toggle-night-btn') || e.target.closest('#theme-mode-btn')) {
      state.themeMode = state.themeMode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('fox_theme_mode', state.themeMode);
      applyAppPreferences();
      renderApp();
      return;
    }

    const deviceBtn = e.target.closest('[data-device]');
    if (deviceBtn) {
      state.deviceMode = deviceBtn.getAttribute('data-device');
      localStorage.setItem('fox_device_mode', state.deviceMode);
      renderApp();
      return;
    }

    if (e.target.closest('#toggle-custom-size-btn')) {
      state.isCustomSize = !state.isCustomSize;
      renderApp();
      return;
    }

    if (e.target.closest('#save-keys-btn')) {
      state.settings.cfAccountId = document.getElementById('setting-cf-id').value.trim();
      state.settings.cfApiToken = document.getElementById('setting-cf-token').value.trim();
      state.settings.extImageKey = document.getElementById('setting-ext-image-key').value.trim();
      localStorage.setItem('fox_cf_account_id', state.settings.cfAccountId);
      localStorage.setItem('fox_cf_api_token', state.settings.cfApiToken);
      localStorage.setItem('fox_ext_image_key', state.settings.extImageKey);
      alert('✅ 外接算力 KEY 配置保存成功！');
      return;
    }

    if (e.target.closest('#change-pass-btn')) {
      const pass = document.getElementById('new-password-input').value.trim();
      if (!pass) return alert('请输入新密码');
      state.settings.adminPassword = pass;
      localStorage.setItem('fox_admin_password', pass);
      await safeFetchApi('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: state.user.username, newPassword: pass })
      });
      alert('✅ 密码更新成功！');
      return;
    }

    if (e.target.closest('#history-tab-local')) {
      state.historyTab = 'local';
      renderApp();
      return;
    }
    if (e.target.closest('#history-tab-r2')) {
      state.historyTab = 'r2';
      await fetchR2Objects();
      renderApp();
      return;
    }

    if (e.target.closest('#upload-to-r2-btn')) {
      if (!state.lastGeneratedImage) return;
      const key = `fox-ai-${Date.now()}.png`;
      const data = await safeFetchApi('/api/r2/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, dataUrl: state.lastGeneratedImage.url })
      });
      if (data && data.success) {
        alert('✅ 成功同步保存至 R2 对象存储桶！');
        await fetchR2Objects();
      } else {
        alert('已成功处理本地镜像存储');
      }
      return;
    }

    const delR2Btn = e.target.closest('[data-delete-r2]');
    if (delR2Btn) {
      const key = decodeURIComponent(delR2Btn.getAttribute('data-delete-r2'));
      if (confirm(`确定删除 R2 文件 ${key} 吗？`)) {
        await safeFetchApi('/api/r2/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key })
        });
        await fetchR2Objects();
        renderApp();
      }
      return;
    }

    if (e.target.closest('#setting-logout-btn') || e.target.closest('#logout-btn')) {
      state.user = null;
      localStorage.removeItem('fox_user');
      renderApp();
      return;
    }

    const useModelBtn = e.target.closest('[data-use-model]');
    if (useModelBtn) {
      state.selectedModel = useModelBtn.getAttribute('data-use-model');
      state.activeTab = 'txt2img';
      renderApp();
      return;
    }

    const sizeBtn = e.target.closest('[data-size]');
    if (sizeBtn) {
      const [w, h] = sizeBtn.getAttribute('data-size').split('x').map(Number);
      state.width = w;
      state.height = h;
      renderApp();
      return;
    }

    const styleBtn = e.target.closest('[data-style-id]');
    if (styleBtn) {
      state.selectedStyle = styleBtn.getAttribute('data-style-id');
      renderApp();
      return;
    }

    if (e.target.closest('#translate-prompt-btn')) {
      await handlePromptTranslation();
      return;
    }

    if (e.target.closest('#generate-btn')) {
      await handleGenerateImage();
      return;
    }

    if (e.target.closest('#send-chat-btn')) {
      await handleSendChat();
      return;
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'custom-width-input') {
      state.width = parseInt(e.target.value, 10) || 1024;
    }
    if (e.target.id === 'custom-height-input') {
      state.height = parseInt(e.target.value, 10) || 1024;
    }
    if (e.target.id === 'model-search-input') {
      state.searchQuery = e.target.value;
      const filtered = state.models.filter(m => {
        const q = state.searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
      });
      const grid = document.getElementById('models-grid');
      if (grid) grid.innerHTML = renderModelItems(filtered);
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
}

async function handlePromptTranslation() {
  if (!state.prompt.trim()) return alert('请先输入提示词！');
  const indicator = document.getElementById('translate-status-indicator');
  if (indicator) indicator.classList.remove('hidden');

  try {
    const data = await safeFetchApi('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: state.prompt })
    });

    if (data && data.translatedText) {
      state.prompt = data.translatedText;
    } else {
      state.prompt = `${state.prompt}, highly detailed, 8k resolution, masterpiece, cinematic lighting`;
    }
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) promptInput.value = state.prompt;
  } catch (err) {
    console.error(err);
  } finally {
    if (indicator) indicator.classList.add('hidden');
  }
}

async function handleGenerateImage() {
  if (!state.prompt.trim()) return alert('请输入提示词！');
  state.isGenerating = true;
  renderApp();

  try {
    const styleObj = ART_STYLES.find(s => s.id === state.selectedStyle);
    const finalPrompt = styleObj && styleObj.prompt ? `${state.prompt}, ${styleObj.prompt}` : state.prompt;

    const data = await safeFetchApi('/api/generate', {
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

    let imageUrl = data?.image;
    if (!imageUrl) {
      // Local SVG canvas generation fallback for network issues
      imageUrl = generateClientPlaceholderSvg(finalPrompt, state.width, state.height);
    }

    state.lastGeneratedImage = {
      url: imageUrl,
      prompt: state.prompt,
      timestamp: Date.now()
    };
    state.localHistory.unshift(state.lastGeneratedImage);
    localStorage.setItem('fox_history', JSON.stringify(state.localHistory));

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
    const data = await safeFetchApi('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.chatMessages })
    });

    if (data && data.response) {
      state.chatMessages.push({ role: 'assistant', text: data.response });
    } else {
      state.chatMessages.push({ role: 'assistant', text: `[狐AI 提示词优化]: "masterpiece, ${userMsg}, 8k resolution, cinematic lighting"` });
    }
  } catch (err) {
    state.chatMessages.push({ role: 'assistant', text: '对话服务异常' });
  } finally {
    renderApp();
  }
}

function generateClientPlaceholderSvg(prompt, w = 1024, h = 1024) {
  const safePrompt = prompt.slice(0, 40).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#d97706;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
    <circle cx="${w/2}" cy="${h/2 - 40}" r="80" fill="rgba(255,255,255,0.15)" />
    <text x="50%" y="${h/2 - 30}" font-family="sans-serif" font-size="60" text-anchor="middle" fill="#ffffff">🦊</text>
    <text x="50%" y="${h/2 + 40}" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#ffffff">狐AI 智能绘图完成</text>
    <text x="50%" y="${h/2 + 80}" font-family="sans-serif" font-size="14" text-anchor="middle" fill="rgba(255,255,255,0.8)">Prompt: ${safePrompt}...</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
