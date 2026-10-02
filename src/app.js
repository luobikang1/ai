import './style.css';
import { PRESET_MODELS, ART_STYLES, NEGATIVE_PROMPT_PRESETS, THEME_ACCENTS, BACKGROUND_PRESETS, COMPUTE_ENGINES, SUPPORTED_LANGUAGES, I18N_STRINGS } from './config.js';

const DEFAULT_AVATAR = '/assets/fox-avatar.webp';

// Global Application State
const state = {
  user: JSON.parse(localStorage.getItem('fox_user')) || null,
  customAvatar: localStorage.getItem('fox_custom_avatar') || DEFAULT_AVATAR,
  activeTab: 'txt2img',
  themeMode: localStorage.getItem('fox_theme_mode') || 'dark',
  themeAccent: localStorage.getItem('fox_theme_accent') || 'ocean-blue',
  bgPreset: localStorage.getItem('fox_bg_preset') || 'slate-dark',
  fontSize: localStorage.getItem('fox_font_size') || 'medium',
  lang: localStorage.getItem('fox_lang') || 'zh',
  deviceMode: localStorage.getItem('fox_device_mode') || 'auto',

  accordionStates: JSON.parse(localStorage.getItem('fox_accordion_states') || JSON.stringify({
    sec1: false, sec2: false, sec3: false, sec4: false, sec5: false,
    sec6: false, sec7: false, sec8: false, sec9: false, sec10: false, sec11: false
  })),

  status: {
    cfWorkersAi: true,
    cfTokenValid: true,
    d1Database: false,
    r2Bucket: false
  },

  settings: {
    cfAccountId: localStorage.getItem('fox_cf_account_id') || '',
    cfApiToken: localStorage.getItem('fox_cf_api_token') || '',
    openaiApiKey: localStorage.getItem('fox_openai_api_key') || '',
    openaiBaseUrl: localStorage.getItem('fox_openai_base_url') || 'https://api.openai.com/v1',
    openaiModel: localStorage.getItem('fox_openai_model') || 'dall-e-3',
    engineChoice: localStorage.getItem('fox_engine_choice') || 'cf_workers_ai',
    enableEmailVerify: localStorage.getItem('fox_enable_email_verify') === 'true',
    systemVerifyCode: localStorage.getItem('fox_system_verify_code') || '888888',
    replyEmail: localStorage.getItem('fox_reply_email') || 'noreply@fox.ai',
    adminPassword: localStorage.getItem('fox_admin_password') || 'fox123456'
  },

  registeredUsersList: [],

  models: JSON.parse(localStorage.getItem('fox_custom_models')) || PRESET_MODELS,
  searchQuery: '',
  onlineModels: [],
  isSearchingOnline: false,

  selectedModel: localStorage.getItem('fox_selected_model') || '@cf/black-forest-labs/flux-1-schnell',
  selectedStyle: 'none',
  prompt: '',
  negativePrompt: NEGATIVE_PROMPT_PRESETS[0],
  width: 1024,
  height: 1024,
  isCustomSize: false,
  steps: 4,
  cfgScale: 7.5,
  seed: '',
  sampler: 'Euler a',
  batchCount: 1,
  showAdvancedSettings: false,
  img2imgBase64: null,
  isGenerating: false,
  lastGeneratedImages: [],
  lastGeneratedImage: null,

  previewModalUrl: null,
  previewMediaType: 'image',

  historyTab: 'local',
  selectedLocalHistoryIdxs: [],
  localHistory: JSON.parse(localStorage.getItem('fox_history') || '[]'),

  // R2 Storage Manager State
  r2Storage: {
    bound: false,
    currentFolder: '',
    folders: [],
    objects: [],
    totalSizeMB: '0.00',
    remainingSpaceMB: '10240.00'
  },
  uploadProgress: 0,
  isUploading: false,

  authTab: 'admin_login', // 'admin_login', 'user_login', 'user_register'
  adminPasswordOnlyInput: '',
  loginEmailInput: '',
  registerEmail: '',
  registerUsername: '',
  registerPassword: '',
  registerVerifyCode: '',
  authError: '',

  chatInput: '',
  chatMessages: [
    { role: 'assistant', text: '你好！我是白狐AI智能助手。您可以输入描述进行提示词润色，或上传图片提取风格关键词！' }
  ]
};

// Application Initializer
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

  const bgObj = BACKGROUND_PRESETS.find(b => b.id === state.bgPreset) || BACKGROUND_PRESETS[1];
  document.body.className = `font-size-${state.fontSize} theme-${state.themeAccent} ${bgObj.bgClass}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || data.message || `请求失败 HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('网络请求超时，请重试');
    }
    throw err;
  }
}

async function fetchServiceStatus() {
  try {
    const data = await fetchWithTimeout('/api/status', {}, 5000);
    if (data) {
      state.status = {
        ...state.status,
        cfWorkersAi: !!data.hasAI,
        d1Database: !!data.hasD1,
        r2Bucket: !!data.hasR2
      };
    }
  } catch (e) {}

  if (state.user && state.user.role === 'admin') {
    fetchUsersList();
  }
}

async function fetchUsersList() {
  try {
    const data = await fetchWithTimeout('/api/users', {}, 5000);
    if (data && data.users) {
      state.registeredUsersList = data.users;
    }
  } catch (e) {}
}

async function verifyCfToken() {
  try {
    const data = await fetchWithTimeout('/api/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: state.settings.cfAccountId, apiToken: state.settings.cfApiToken })
    }, 8000);

    state.status.cfTokenValid = data.valid;
    alert(data.message || 'Token 验证完成');
  } catch (err) {
    state.status.cfTokenValid = false;
    alert(`Token 校验出错: ${err.message}`);
  }
  renderApp();
}

async function fetchR2Objects(folder = state.r2Storage.currentFolder) {
  try {
    const data = await fetchWithTimeout(`/api/r2/list?folder=${encodeURIComponent(folder)}`, {}, 8000);
    if (data) {
      state.r2Storage = data;
    }
  } catch (e) {}
}

function t(key) {
  const dictionary = I18N_STRINGS[state.lang] || I18N_STRINGS.zh;
  return dictionary[key] || key;
}

function renderApp() {
  const root = document.getElementById('app');

  if (!state.user) {
    root.innerHTML = renderWhiteFoxAuthScreen();
    bindAuthEvents();
    return;
  }

  const containerWidthClass = state.deviceMode === 'mobile' ? 'max-w-sm' : state.deviceMode === 'desktop' ? 'max-w-6xl' : 'max-w-5xl';

  root.innerHTML = `
    <div class="min-h-screen flex flex-col pb-24">
      <header class="sticky top-0 z-40 glass-panel !rounded-none !border-x-0 !border-t-0 px-3 py-2 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg overflow-hidden shadow border border-blue-500/30 flex-shrink-0 bg-slate-900">
            <img src="${state.customAvatar}" class="w-full h-full object-cover" />
          </div>
          <div class="flex items-center gap-1.5">
            <h1 class="text-base font-black tracking-tight fox-gradient-text leading-none">${t('appTitle')}</h1>
            <span class="w-2 h-2 rounded-full ${state.status.cfWorkersAi ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}" title="Cloudflare Workers AI 原生 Binding 状态指示灯"></span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <select id="header-lang-select" class="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 font-bold">
            ${SUPPORTED_LANGUAGES.map(l => `<option value="${l.id}" ${state.lang === l.id ? 'selected' : ''}>${l.id.toUpperCase()}</option>`).join('')}
          </select>

          <span class="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
            ${state.user.role === 'admin' ? '👑 管理员' : '👤 ' + state.user.username}
          </span>

          <button id="theme-mode-btn" class="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition text-xs">
            ${state.themeMode === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main class="flex-1 ${containerWidthClass} w-full mx-auto p-3 sm:p-5 space-y-5 transition-all duration-200">
        ${renderActiveTabContent()}
      </main>

      ${state.previewModalUrl ? renderMediaPreviewModal() : ''}

      <nav class="bottom-dock-nav flex items-center justify-around px-2 py-2">
        <button data-tab="txt2img" class="bottom-nav-item flex flex-col items-center gap-1 ${state.activeTab === 'txt2img' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span class="text-[11px] font-bold">${t('txt2img')}</span>
        </button>
        <button data-tab="img2img" class="bottom-nav-item flex flex-col items-center gap-1 ${state.activeTab === 'img2img' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          <span class="text-[11px] font-bold">${t('img2img')}</span>
        </button>
        <button data-tab="models" class="bottom-nav-item flex flex-col items-center gap-1 ${state.activeTab === 'models' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          <span class="text-[11px] font-bold">${t('models')}</span>
        </button>
        <button data-tab="translator" class="bottom-nav-item flex flex-col items-center gap-1 ${state.activeTab === 'translator' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          <span class="text-[11px] font-bold">${t('translator')}</span>
        </button>
        <button data-tab="history" class="bottom-nav-item flex flex-col items-center gap-1 ${state.activeTab === 'history' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span class="text-[11px] font-bold">${t('history')}</span>
        </button>
        <button data-tab="settings" class="bottom-nav-item flex flex-col items-center gap-1 ${state.activeTab === 'settings' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span class="text-[11px] font-bold">${t('settings')}</span>
        </button>
      </nav>
    </div>
  `;

  bindTabEvents();
}

function renderMediaPreviewModal() {
  return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-4">
        <button id="close-preview-modal-btn" class="absolute -top-10 right-0 text-white text-2xl font-bold bg-white/20 rounded-full w-8 h-8 flex items-center justify-center hover:scale-110 transition">✕</button>
        ${state.previewMediaType === 'video' ? `
          <video src="${state.previewModalUrl}" controls autoplay class="max-w-full max-h-[80vh] rounded-2xl shadow-2xl"></video>
        ` : state.previewMediaType === 'audio' ? `
          <div class="glass-panel p-8 text-center space-y-4 bg-slate-900 text-white">
            <div class="text-5xl">🎵</div>
            <audio src="${state.previewModalUrl}" controls autoplay class="w-full"></audio>
          </div>
        ` : `
          <img src="${state.previewModalUrl}" class="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
        `}
        <a href="${state.previewModalUrl}" download="fox-media-${Date.now()}" class="fox-btn-primary text-xs py-2 px-6 font-bold">
          📥 下载原文件
        </a>
      </div>
    </div>
  `;
}

// Separated Login and Auth Screen
function renderWhiteFoxAuthScreen() {
  const isRegister = state.authTab === 'user_register';
  const isUserLogin = state.authTab === 'user_login';
  const isAdminLogin = state.authTab === 'admin_login';

  return `
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-900 relative overflow-hidden">
      <div class="glass-panel max-w-md w-full p-8 space-y-6 !bg-white/95 !border-slate-200 shadow-2xl relative z-10 rounded-3xl">
        <div class="flex justify-between items-center">
          <h1 class="text-xs font-bold text-slate-400">FOX AI WORKBENCH</h1>
          <select id="auth-lang-select" class="text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-2 py-1 font-bold">
            ${SUPPORTED_LANGUAGES.map(l => `<option value="${l.id}" ${state.lang === l.id ? 'selected' : ''}>${l.name}</option>`).join('')}
          </select>
        </div>

        <div class="text-center space-y-2">
          <div class="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/30 mx-auto border-2 border-blue-500/40">
            <img src="${DEFAULT_AVATAR}" class="w-full h-full object-cover" />
          </div>
          <h2 class="text-2xl font-black fox-gradient-text tracking-tight">${t('appTitle')}</h2>
          <p class="text-xs text-slate-500 font-medium">管理员密码直登 / 邮箱通用免密登录与注册</p>
        </div>

        <!-- Three Separate Auth Tabs -->
        <div class="flex rounded-xl bg-slate-100 p-1 text-[11px] font-bold border border-slate-200 gap-0.5">
          <button id="tab-auth-admin" class="flex-1 py-2 rounded-lg transition ${isAdminLogin ? 'bg-blue-500 text-white shadow' : 'text-slate-500 hover:text-slate-900'}">
            👑 管理员登录
          </button>
          <button id="tab-auth-login" class="flex-1 py-2 rounded-lg transition ${isUserLogin ? 'bg-blue-500 text-white shadow' : 'text-slate-500 hover:text-slate-900'}">
            🔑 邮箱登录
          </button>
          <button id="tab-auth-register" class="flex-1 py-2 rounded-lg transition ${isRegister ? 'bg-blue-500 text-white shadow' : 'text-slate-500 hover:text-slate-900'}">
            📧 邮箱注册
          </button>
        </div>

        ${state.authError ? `
          <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-bold">
            ⚠️ ${state.authError}
          </div>
        ` : ''}

        <form id="auth-form" class="space-y-4">
          ${isAdminLogin ? `
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">管理员密码 (环境变量 ADMIN_PASSWORD):</label>
              <input type="password" id="auth-admin-password" class="fox-input !bg-white !border-slate-200 text-slate-900 font-mono" placeholder="默认初始密码: fox123456" value="${state.adminPasswordOnlyInput}" required />
            </div>
            <button type="submit" class="fox-btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-blue-500/20">
              👑 验证管理员密码进入系统
            </button>
          ` : isUserLogin ? `
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">登录邮箱:</label>
              <input type="email" id="auth-login-email" class="fox-input !bg-white !border-slate-200 text-slate-900 font-mono" placeholder="user@example.com" value="${state.loginEmailInput}" required />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">账号密码:</label>
              <input type="password" id="auth-login-password" class="fox-input !bg-white !border-slate-200 text-slate-900 font-mono" placeholder="输入注册密码" value="${state.registerPassword}" required />
            </div>
            <button type="submit" class="fox-btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-blue-500/20">
              🔑 邮箱密码登录工作台
            </button>
          ` : `
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">注册电子邮箱:</label>
              <input type="email" id="auth-email" class="fox-input !bg-white !border-slate-200 text-slate-900 font-mono" placeholder="user@example.com" value="${state.registerEmail}" required />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">设置用户名:</label>
              <input type="text" id="auth-username" class="fox-input !bg-white !border-slate-200 text-slate-900" placeholder="设置用户名" value="${state.registerUsername}" required />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">设置密码:</label>
              <input type="password" id="auth-password" class="fox-input !bg-white !border-slate-200 text-slate-900 font-mono" placeholder="设置账号登录密码" value="${state.registerPassword}" required />
            </div>

            ${state.settings.enableEmailVerify ? `
              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  <label class="text-xs font-bold text-slate-700">邮箱验证码 (管理员开启防护):</label>
                  <span class="text-[10px] text-blue-500">向管理员获取验证码</span>
                </div>
                <input type="text" id="auth-verify-code" class="fox-input !bg-white !border-slate-200 text-slate-900 font-mono" placeholder="输入 6 位验证码" value="${state.registerVerifyCode}" required />
              </div>
            ` : ''}

            <button type="submit" class="fox-btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-blue-500/20">
              🚀 提交注册并开始使用
            </button>
          `}
        </form>
      </div>
    </div>
  `;
}

function bindAuthEvents() {
  document.getElementById('auth-lang-select')?.addEventListener('change', (e) => {
    state.lang = e.target.value;
    localStorage.setItem('fox_lang', state.lang);
    renderApp();
  });

  document.getElementById('tab-auth-admin')?.addEventListener('click', () => {
    state.authTab = 'admin_login';
    state.authError = '';
    renderApp();
  });

  document.getElementById('tab-auth-login')?.addEventListener('click', () => {
    state.authTab = 'user_login';
    state.authError = '';
    renderApp();
  });

  document.getElementById('tab-auth-register')?.addEventListener('click', () => {
    state.authTab = 'user_register';
    state.authError = '';
    renderApp();
  });

  document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.authTab === 'admin_login') {
      const password = document.getElementById('auth-admin-password')?.value.trim();

      try {
        const data = await fetchWithTimeout('/api/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        }, 8000);

        if (data && data.ok) {
          state.user = data.user || { username: 'admin', role: 'admin' };
          localStorage.setItem('fox_user', JSON.stringify(state.user));
          state.authError = '';
          renderApp();
          return;
        }
      } catch (err) {
        if (password === (state.settings.adminPassword || 'fox123456')) {
          state.user = { username: 'admin', role: 'admin' };
          localStorage.setItem('fox_user', JSON.stringify(state.user));
          state.authError = '';
          renderApp();
          return;
        }
        state.authError = err.message || '管理员变量密码不匹配';
        renderApp();
      }
    } else if (state.authTab === 'user_login') {
      const email = document.getElementById('auth-login-email')?.value.trim();
      const password = document.getElementById('auth-login-password')?.value.trim();

      try {
        const data = await fetchWithTimeout('/api/user-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        }, 8000);

        if (data && data.ok) {
          state.user = data.user;
          localStorage.setItem('fox_user', JSON.stringify(state.user));
          state.authError = '';
          renderApp();
          return;
        }
      } catch (err) {
        state.authError = err.message || '邮箱密码错误或账号不存在，请先注册';
        renderApp();
      }
    } else {
      const email = document.getElementById('auth-email').value.trim();
      const username = document.getElementById('auth-username').value.trim();
      const password = document.getElementById('auth-password').value.trim();
      const verifyCode = document.getElementById('auth-verify-code')?.value.trim();

      try {
        const data = await fetchWithTimeout('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            username,
            password,
            verifyCode,
            enableEmailVerify: state.settings.enableEmailVerify,
            systemVerifyCode: state.settings.systemVerifyCode
          })
        }, 8000);

        if (data && data.ok) {
          state.user = data.user;
          localStorage.setItem('fox_user', JSON.stringify(state.user));
          state.authError = '';
          renderApp();
        }
      } catch (err) {
        state.authError = err.message || '邮箱注册失败';
        renderApp();
      }
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

// Generation Workspace
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
                <span class="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  当前工作台模型
                </span>
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
            <div id="img2img-dropzone" class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition relative bg-slate-50/50 dark:bg-slate-900/50">
              ${state.img2imgBase64 ? `
                <div class="relative inline-block">
                  <img src="${state.img2imgBase64}" class="max-h-48 rounded-lg shadow-md object-contain mx-auto border border-slate-700" />
                  <button id="remove-ref-img-btn" type="button" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition z-20">✕</button>
                </div>
              ` : `
                <div class="space-y-1">
                  <div class="text-2xl">📸</div>
                  <p class="text-xs text-slate-500">点击选择上传参考图（支持 JPG, PNG, WEBP）</p>
                </div>
              `}
              <input type="file" id="img2img-file-input" accept="image/*" class="hidden" />
            </div>
          </div>
        ` : ''}

        <div class="glass-panel p-4 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              ${t('promptLabel')}
            </label>
            <button id="translate-prompt-btn" class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              🌐 一键中英双向互译 / 智能润色
            </button>
          </div>

          <textarea id="prompt-input" rows="3" class="fox-input font-mono text-xs leading-relaxed" placeholder="输入提示词，例如：白狐神兽，国风水墨，灵动，高清...">${state.prompt}</textarea>
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
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300">${t('negPromptLabel')}</label>
          <textarea id="negative-prompt-input" rows="2" class="fox-input font-mono text-xs text-slate-500">${state.negativePrompt}</textarea>
        </div>

        <div class="glass-panel p-4 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">${t('sizeLabel')}</label>
            <div class="flex items-center gap-2">
              <button id="toggle-custom-size-btn" class="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline">
                ${state.isCustomSize ? '📐 标准比例预设' : '⚙️ 自定义像素宽高'}
              </button>
              <button id="toggle-advanced-settings-btn" class="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline">
                ${state.showAdvancedSettings ? '▲ 收起高级设置' : '⚙️ 高级细节调节 (Steps, CFG)'}
              </button>
            </div>
          </div>

          <div class="flex justify-between items-center pb-2">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">生成张数模式：</span>
            <div class="flex gap-1">
              <button id="batch-1-btn" class="px-3 py-1 rounded-lg text-xs font-bold ${state.batchCount === 1 ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">1 张单发</button>
              <button id="batch-4-btn" class="px-3 py-1 rounded-lg text-xs font-bold ${state.batchCount === 4 ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">⚡ 4 张连发</button>
            </div>
          </div>

          ${state.isCustomSize ? `
            <div class="grid grid-cols-2 gap-3 pt-1">
              <div class="space-y-1">
                <span class="text-[11px] text-slate-400">宽度 (Width px):</span>
                <input type="number" id="custom-width-input" class="fox-input font-mono" value="${state.width}" step="64" min="256" max="2048" />
              </div>
              <div class="space-y-1">
                <span class="text-[11px] text-slate-400">高度 (Height px):</span>
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

          ${state.showAdvancedSettings ? `
            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label class="block font-bold mb-1">生成步数 (Steps): ${state.steps}</label>
                  <input type="range" id="steps-range" min="1" max="50" value="${state.steps}" class="w-full accent-blue-500" />
                </div>
                <div>
                  <label class="block font-bold mb-1">提示词引导 (CFG Scale): ${state.cfgScale}</label>
                  <input type="range" id="cfg-range" min="1" max="20" step="0.5" value="${state.cfgScale}" class="w-full accent-blue-500" />
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <button id="generate-btn" class="fox-btn-primary w-full py-3.5 text-base shadow-lg shadow-blue-500/25 ${state.isGenerating ? 'opacity-70 cursor-wait' : ''}">
          ${state.isGenerating ? `
            <div class="flex items-center justify-center gap-2">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>${t('generating')}</span>
            </div>
          ` : `
            ${t('generate')}
          `}
        </button>

      </div>

      <div class="lg:col-span-5">
        <div class="glass-panel p-4 sticky top-20 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 dark:text-slate-100">
              🖼️ 实时绘图工作台预览
            </h2>
          </div>

          <div class="relative min-h-[320px] w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2">
            ${state.isGenerating ? `
              <div class="p-6 text-center space-y-3">
                <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">白狐AI 正在绘制 ${state.batchCount} 张图片...</p>
              </div>
            ` : state.lastGeneratedImages.length > 0 ? `
              <div class="grid ${state.lastGeneratedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 w-full">
                ${state.lastGeneratedImages.map((img, idx) => `
                  <div class="aspect-square bg-slate-950 rounded-lg overflow-hidden relative cursor-pointer group" data-open-preview="${encodeURIComponent(img.url)}">
                    <img src="${img.url}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                    <span class="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-white font-bold">图 #${idx + 1}</span>
                  </div>
                `).join('')}
              </div>
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
                <button id="upload-to-r2-btn" class="fox-btn-secondary text-xs text-blue-600 dark:text-blue-400 font-bold">
                  ☁️ 一键存 R2 存储空间
                </button>
              </div>
            </div>
          ` : ''}

        </div>
      </div>
    </div>
  `;
}

// History & R2 Workspace
function renderHistoryWorkspace() {
  const isR2 = state.historyTab === 'r2';

  return `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">📜 历史记录 & R2 全能多媒体云盘</h2>
          <p class="text-xs text-slate-500">一排三图手机屏极佳排版，支持图片/视频/音频/文档管理</p>
        </div>

        <div class="flex rounded-xl bg-slate-200 dark:bg-slate-900 p-1 text-xs font-bold">
          <button id="history-tab-local" class="px-3 py-1.5 rounded-lg transition ${!isR2 ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-200'}">
            💻 本地历史 (${state.localHistory.length})
          </button>
          <button id="history-tab-r2" class="px-3 py-1.5 rounded-lg transition ${isR2 ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-200'}">
            ☁️ R2 对象存储空间
          </button>
        </div>
      </div>

      ${isR2 ? renderR2StorageManagerSection() : render3ColumnLocalHistorySection()}
    </div>
  `;
}

// 3-Column Mobile Responsive Grid for Local History
function render3ColumnLocalHistorySection() {
  if (state.localHistory.length === 0) {
    return `
      <div class="glass-panel p-12 text-center space-y-2">
        <div class="text-4xl opacity-30">📂</div>
        <p class="text-sm font-semibold text-slate-500">暂无本地生成记录</p>
      </div>
    `;
  }

  const allSelected = state.selectedLocalHistoryIdxs.length === state.localHistory.length;

  return `
    <div class="space-y-3">
      <div class="glass-panel p-3 flex items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <input type="checkbox" id="batch-select-all" class="w-4 h-4 accent-blue-500 rounded cursor-pointer" ${allSelected ? 'checked' : ''} />
          <label for="batch-select-all" class="font-bold cursor-pointer">全选 (${state.selectedLocalHistoryIdxs.length}/${state.localHistory.length})</label>
        </div>

        <div class="flex gap-2">
          ${state.selectedLocalHistoryIdxs.length > 0 ? `
            <button id="batch-delete-btn" class="fox-btn-secondary text-xs text-red-500 font-bold">
              🗑️ 批量删除选中
            </button>
          ` : ''}
          <button id="clear-local-history-btn" class="fox-btn-secondary text-xs text-red-500">
            清空全部
          </button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        ${state.localHistory.map((item, idx) => {
          const isChecked = state.selectedLocalHistoryIdxs.includes(idx);
          return `
            <div class="glass-panel overflow-hidden group relative flex flex-col justify-between border ${isChecked ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-800'} p-1.5">
              <div class="relative aspect-square bg-slate-900 rounded-lg overflow-hidden cursor-pointer" data-open-preview="${encodeURIComponent(item.url)}">
                <input type="checkbox" data-select-idx="${idx}" class="absolute top-1 left-1 z-20 w-4 h-4 accent-blue-500 rounded cursor-pointer" ${isChecked ? 'checked' : ''} />
                <img src="${item.url}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
              </div>

              <div class="mt-1.5 space-y-1">
                <p class="text-[10px] text-slate-700 dark:text-slate-300 truncate font-mono" title="${item.prompt}">${item.prompt}</p>

                <div class="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button data-delete-single-history="${idx}" class="text-[10px] text-red-500 hover:underline">
                    🗑️ 删除
                  </button>
                  <button data-load-params="${encodeURIComponent(JSON.stringify(item))}" class="text-[10px] text-blue-500 font-bold hover:underline">
                    🎨 载入参数
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// R2 Storage Manager
function renderR2StorageManagerSection() {
  const r2 = state.r2Storage;

  return `
    <div class="space-y-4">
      <div class="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full ${r2.bound ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}"></span>
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">
              Cloudflare R2 对象存储桶 (全能云盘): ${r2.bound ? '已连接运行中' : '全能演示模式'}
            </h3>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            当前目录: <code class="text-blue-500 font-bold">${r2.currentFolder || '/ (根目录)'}</code> |
            已使用: <b class="text-blue-600 dark:text-blue-400">${r2.totalSizeMB || '0.00'} MB</b>
          </p>
        </div>

        <div class="flex gap-2">
          <button id="r2-mkdir-btn" class="fox-btn-secondary text-xs font-bold">
            📁 新建文件夹
          </button>
          <button id="r2-upload-trigger-btn" class="fox-btn-primary text-xs font-bold">
            📤 上传文件 (图片/视频/音乐/文档)
          </button>
          <input type="file" id="r2-file-input" multiple class="hidden" />
        </div>
      </div>

      ${state.isUploading ? `
        <div class="glass-panel p-3 space-y-1 border border-blue-500">
          <div class="flex justify-between text-xs font-bold text-blue-500">
            <span>正在上传文件至 R2 云盘...</span>
            <span>${state.uploadProgress}%</span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div class="bg-blue-500 h-2 transition-all duration-200" style="width: ${state.uploadProgress}%"></div>
          </div>
        </div>
      ` : ''}

      ${r2.folders && r2.folders.length > 0 ? `
        <div class="space-y-2">
          <span class="text-xs font-bold text-slate-400">文件夹列表：</span>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${r2.folders.map(f => `
              <button data-open-folder="${f}" class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 flex items-center justify-between text-xs font-bold hover:border-blue-500 transition">
                <span class="truncate">📁 ${f}</span>
                <span class="text-slate-400 text-[10px]">打开 →</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        ${r2.objects.map(obj => {
          let mediaBadge = '📄 文档';
          if (obj.type === 'image') mediaBadge = '🖼️ 图片';
          else if (obj.type === 'video') mediaBadge = '🎬 视频';
          else if (obj.type === 'audio') mediaBadge = '🎵 音频';

          return `
            <div class="glass-panel overflow-hidden p-2 space-y-1.5 flex flex-col justify-between border border-slate-200 dark:border-slate-800">
              <div class="cursor-pointer" data-preview-r2-item="${encodeURIComponent(obj.key)}" data-media-type="${obj.type}">
                <div class="aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center text-2xl relative">
                  ${obj.type === 'image' ? `
                    <img src="${obj.key.startsWith('http') ? obj.key : '/assets/fox-avatar.webp'}" class="w-full h-full object-cover" />
                  ` : `
                    <span>${obj.type === 'video' ? '🎬' : obj.type === 'audio' ? '🎵' : '📄'}</span>
                  `}
                  <span class="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white font-bold">${mediaBadge}</span>
                </div>

                <div class="mt-1 space-y-0.5">
                  <p class="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title="${obj.key}">${obj.name || obj.key}</p>
                  <p class="text-[9px] text-slate-400">${obj.formattedSize}</p>
                </div>
              </div>

              <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                <button data-delete-r2="${encodeURIComponent(obj.key)}" class="text-red-500 hover:underline">
                  🗑️ 删除
                </button>
                <a href="${obj.key}" download class="text-blue-500 font-bold hover:underline">
                  📥 下载
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Model Hub
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
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">📦 热门开源模型库 (一排三图极佳缩略布局)</h2>
          <p class="text-xs text-slate-500">点击选中模型即刻与绘图工作台保持同步</p>
        </div>

        <div class="flex gap-2 max-w-sm w-full">
          <input type="text" id="model-search-input" class="fox-input" placeholder="输入关键词 (如 anime, realistic)..." value="${state.searchQuery}" />
          <button id="online-search-btn" class="fox-btn-primary text-xs flex-shrink-0 font-bold">
            🔍 搜全网
          </button>
        </div>
      </div>

      ${state.onlineModels.length > 0 ? `
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-blue-500 flex items-center gap-1">
            🌐 互联网实时检索到的高赞模型：
          </h3>
          <div class="grid grid-cols-3 gap-2 sm:gap-3">
            ${state.onlineModels.map(m => `
              <div class="glass-panel overflow-hidden p-2 space-y-1 flex flex-col justify-between border border-blue-500/30">
                <div class="space-y-1">
                  <img src="${m.cover}" class="w-full aspect-square object-cover rounded-lg" />
                  <h4 class="font-bold text-[11px] text-slate-100 truncate">${m.name}</h4>
                  <p class="text-[9px] text-slate-400 line-clamp-2">${m.description}</p>
                </div>
                <div class="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                  <a href="${m.sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">
                    🌐 源站
                  </a>
                  <button data-use-model="${m.id}" class="fox-btn-primary text-[10px] py-1 px-2">
                    选择使用
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div id="models-grid" class="grid grid-cols-3 gap-2 sm:gap-3">
        ${renderModelItems(filteredModels)}
      </div>
    </div>
  `;
}

function renderModelItems(modelsList) {
  return modelsList.map(model => {
    const isSelected = state.selectedModel === model.id;

    return `
      <div class="glass-panel overflow-hidden flex flex-col justify-between border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-800'} p-1.5">
        <div>
          <div class="relative aspect-square w-full overflow-hidden bg-slate-800 rounded-lg">
            <img src="${model.cover}" class="w-full h-full object-cover" />
            <span class="absolute top-1 left-1 text-[9px] px-1 py-0.5 rounded font-bold bg-black/60 text-white">
              ${model.category}
            </span>
          </div>

          <div class="p-1 mt-1 space-y-0.5">
            <h4 class="font-bold text-[11px] text-slate-800 dark:text-slate-100 truncate">${model.name}</h4>
            <p class="text-[9px] text-slate-400 line-clamp-2">${model.description}</p>
          </div>
        </div>

        <div class="p-1 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <a href="${model.sourceUrl || 'https://civitai.com'}" target="_blank" rel="noopener noreferrer" class="text-[9px] text-blue-500 hover:underline">
            🌐 来源
          </a>
          <button data-use-model="${model.id}" class="fox-btn-primary text-[10px] py-1 px-2">
            ${isSelected ? '使用中' : '选择'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// AI Assistant
function renderTranslatorWorkspace() {
  return `
    <div class="glass-panel p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <span class="text-2xl">💬</span>
        <div>
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">白狐AI 提示词助理 & 图像出词分析</h2>
          <p class="text-xs text-slate-500">支持中英双向互译、智能润色与上传图片反推提示词</p>
        </div>
      </div>

      <div class="glass-panel p-3.5 space-y-3 bg-blue-500/5 border border-blue-500/20">
        <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
          📸 上传图片反推提示词 (Image Interrogator)
        </label>
        <div class="flex items-center gap-3">
          <input type="file" id="vision-file-input" accept="image/*" class="text-xs text-slate-500" />
          <button id="analyze-vision-btn" class="fox-btn-primary text-xs py-1.5 px-3 flex-shrink-0 font-bold">
            🔍 分析出词
          </button>
        </div>
      </div>

      <div id="chat-container" class="space-y-3 min-h-[260px] max-h-[380px] overflow-y-auto p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
        ${state.chatMessages.map(msg => `
          <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-none shadow'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
            }">
              <p class="whitespace-pre-wrap leading-relaxed">${msg.text}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="flex gap-2">
        <input type="text" id="chat-input" class="fox-input flex-1" placeholder="输入中文描述..." />
        <button id="send-chat-btn" class="fox-btn-primary flex-shrink-0 font-bold">
          发送 🚀
        </button>
      </div>
    </div>
  `;
}

// Settings Workspace - Accessible by ALL logged in users, with Admin-Protected Panels
function renderSettingsWorkspace() {
  const isAdmin = state.user && state.user.role === 'admin';

  return `
    <div class="glass-panel p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">⚙️ 系统设置控制台</h2>
          <p class="text-xs text-slate-500">已成功登录账号: <b>${state.user.username}</b> (${isAdmin ? '管理员' : '普通用户'})</p>
        </div>
        <button id="logout-btn" class="fox-btn-secondary text-xs text-red-500 font-bold">
          🚪 退出登录
        </button>
      </div>

      <div class="space-y-3">
        <!-- 1. 一键切换夜间模式 + 主题和背景调色 -->
        ${renderAccordion('sec1', '🌙 1. 一键切换夜间模式 & 主题背景调色', `
          <div class="space-y-4 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold">黑夜/白天视觉主题模式：</span>
              <button id="toggle-night-btn" class="fox-btn-secondary text-xs">
                ${state.themeMode === 'dark' ? '☀️ 切换浅色模式' : '🌙 切换夜间模式'}
              </button>
            </div>

            <div class="space-y-2">
              <label class="block font-bold">界面背景色调预设：</label>
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                ${BACKGROUND_PRESETS.map(bg => `
                  <button data-bg-preset="${bg.id}" class="p-2 rounded-xl text-xs font-bold border ${state.bgPreset === bg.id ? 'border-blue-500 ring-2 ring-blue-500/30 font-black' : 'border-slate-700'} ${bg.bgClass} transition hover:scale-105">
                    ${bg.name}
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="space-y-2">
              <label class="block font-bold">界面主题强调调色盘：</label>
              <div class="flex items-center gap-2 overflow-x-auto">
                ${THEME_ACCENTS.map(acc => `
                  <button data-theme-accent="${acc.id}" class="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow transition flex items-center gap-1.5 ${state.themeAccent === acc.id ? 'ring-2 ring-white scale-105' : ''}" style="background-color: ${acc.hex}">
                    <span>${acc.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        `)}

        <!-- 2. 一键在电脑版与手机端无缝切换 -->
        ${renderAccordion('sec2', '📱 2. 一键在电脑版与手机端无缝切换', `
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold">选择展示界面显示尺寸：</span>
            <div class="flex gap-1">
              <button data-device="auto" class="px-2.5 py-1 rounded-lg ${state.deviceMode === 'auto' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}">自动自适应</button>
              <button data-device="desktop" class="px-2.5 py-1 rounded-lg ${state.deviceMode === 'desktop' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}">电脑桌面大屏</button>
              <button data-device="mobile" class="px-2.5 py-1 rounded-lg ${state.deviceMode === 'mobile' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}">手机极简视图</button>
            </div>
          </div>
        `)}

        <!-- 3. 融合算力引擎选择 -->
        ${renderAccordion('sec3', '⚡ 3. 融合算力引擎选择', `
          <div class="space-y-2 text-xs">
            <label class="block font-bold">选择算力通道 (手选后自动保存记忆不复原)：</label>
            <select id="engine-choice-select" class="fox-input font-bold">
              ${COMPUTE_ENGINES.map(eng => `
                <option value="${eng.id}" ${state.settings.engineChoice === eng.id ? 'selected' : ''}>${eng.name}</option>
              `).join('')}
            </select>
          </div>
        `)}

        <!-- 4. 其他外接算力 KEY 配置 -->
        ${renderAccordion('sec4', '🤖 4. 其他外接算力 KEY 配置 (兼容各种 API，含 OpenAI)', `
          <div class="space-y-3 text-xs">
            ${isAdmin ? `
              <div>
                <label class="block font-bold mb-1">OpenAI / 通用第三方 API Key:</label>
                <input type="password" id="setting-openai-key" class="fox-input font-mono" value="${state.settings.openaiApiKey}" placeholder="sk-xxxx..." />
              </div>
              <div>
                <label class="block font-bold mb-1">通用 API 基础请求 Base URL:</label>
                <input type="text" id="setting-openai-base" class="fox-input font-mono" value="${state.settings.openaiBaseUrl}" placeholder="https://api.openai.com/v1" />
              </div>
              <div>
                <label class="block font-bold mb-1">调用模型名称 (如 dall-e-3 / flux / custom):</label>
                <input type="text" id="setting-openai-model" class="fox-input font-mono" value="${state.settings.openaiModel}" placeholder="dall-e-3" />
              </div>
              <button id="save-openai-keys-btn" class="fox-btn-primary w-full text-xs py-2 font-bold">💾 保存通用外接算力 Key 配置</button>
            ` : `<p class="text-slate-400">非管理员不能修改保存的 Token 与 Key 配置</p>`}
          </div>
        `)}

        <!-- 5. Cloudflare 的 API 状态指示灯 & Workers AI 部署 -->
        ${renderAccordion('sec5', '🔴 5. Cloudflare 的 API 状态指示灯 & Workers AI 部署', `
          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900">
              <span class="font-bold">Workers AI 原生 Binding 状态 (env.AI)：</span>
              <span class="flex items-center gap-1.5 font-bold ${state.status.cfWorkersAi ? 'text-emerald-500' : 'text-amber-500'}">
                <span class="w-2.5 h-2.5 rounded-full ${state.status.cfWorkersAi ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
                ${state.status.cfWorkersAi ? '已绑定 (重新部署即刻生效)' : '免Key公用通道'}
              </span>
            </div>

            <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900">
              <span class="font-bold">Cloudflare API Token 鉴权连通状态：</span>
              <span class="flex items-center gap-1.5 font-bold ${state.status.cfTokenValid ? 'text-emerald-500' : 'text-amber-500'}">
                <span class="w-2.5 h-2.5 rounded-full ${state.status.cfTokenValid ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
                ${state.status.cfTokenValid ? '凭证连通正常' : '未校验或免Key'}
              </span>
            </div>

            ${isAdmin ? `
              <div>
                <label class="block font-bold mb-1">Cloudflare Account ID:</label>
                <input type="text" id="setting-cf-id" class="fox-input font-mono" value="${state.settings.cfAccountId}" placeholder="8a123f4567..." />
              </div>
              <div>
                <label class="block font-bold mb-1">Cloudflare API Token:</label>
                <input type="password" id="setting-cf-token" class="fox-input font-mono" value="${state.settings.cfApiToken}" placeholder="v1.0-xxxx..." />
              </div>
              <div class="flex gap-2">
                <button id="save-keys-btn" class="fox-btn-primary flex-1 text-xs py-2 font-bold">💾 保存 CF 凭证</button>
                <button id="verify-cf-token-btn" class="fox-btn-secondary flex-1 text-xs py-2 font-bold">⚡ 验证 Token 连通状态</button>
              </div>
            ` : `<p class="text-slate-400">非管理员不能修改凭证与 ID 区</p>`}
          </div>
        `)}

        <!-- 6. D1 数据库绑定状态指示灯 -->
        ${renderAccordion('sec6', '🗄️ 6. D1 数据库绑定状态指示灯', `
          <div class="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900">
            <span class="font-bold">Cloudflare D1 数据库 (DB) 状态：</span>
            <span class="flex items-center gap-1.5 font-bold ${state.status.d1Database ? 'text-emerald-500' : 'text-amber-500'}">
              <span class="w-2.5 h-2.5 rounded-full ${state.status.d1Database ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
              ${state.status.d1Database ? '已绑定 (历史/草稿/设置自动同步)' : '未绑定数据库 (本地离线缓存模式)'}
            </span>
          </div>
        `)}

        <!-- 7. R2 绑定状态指示灯 -->
        ${renderAccordion('sec7', '☁️ 7. R2 绑定状态指示灯', `
          <div class="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900">
            <span class="font-bold">Cloudflare R2 对象存储 (FOX_BUCKET) 状态：</span>
            <span class="flex items-center gap-1.5 font-bold ${state.status.r2Bucket ? 'text-emerald-500' : 'text-amber-500'}">
              <span class="w-2.5 h-2.5 rounded-full ${state.status.r2Bucket ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
              ${state.status.r2Bucket ? '已连通 R2 全能云盘' : '未绑定 (使用离线演示盘)'}
            </span>
          </div>
        `)}

        <!-- 8. Cloudflare 后台一键绑定 d1 和 R2 说明 -->
        ${renderAccordion('sec8', '📖 8. Cloudflare 后台一键绑定 d1 和 R2 说明', `
          <div class="space-y-2 text-xs text-slate-500 leading-relaxed">
            <p>1. <b>D1 数据库</b>: 控制台创建 <code>fox_ai_db</code>，在 wrangler.toml 填入 <code>[[d1_databases]] binding="DB" database_id="你的UUID"</code> 即可完成数据同步。</p>
            <p>2. <b>R2 存储桶</b>: 控制台创建 <code>fox-ai-storage</code>，在 wrangler.toml 填入 <code>[[r2_buckets]] binding="FOX_BUCKET" bucket_name="fox-ai-storage"</code> 即可实现文件全能存储。</p>
          </div>
        `)}

        <!-- 9. 密码修改区 & 管理员使用设备 -->
        ${renderAccordion('sec9', '🔐 9. 密码修改区 & 管理员使用设备', `
          <div class="space-y-3 text-xs">
            <div class="space-y-1">
              <label class="block font-bold">修改新登录密码：</label>
              <input type="password" id="new-password-input" class="fox-input" placeholder="输入新密码" />
            </div>
            <button id="change-pass-btn" class="fox-btn-secondary text-xs w-full font-bold">确认更新密码</button>
          </div>
        `)}

        <!-- 10. 管理员可查看注册用户区 -->
        ${isAdmin ? renderAccordion('sec10', '👥 10. 管理员可查看注册用户区 (D1云端同步)', `
          <div class="space-y-3 text-xs">
            <p class="font-bold">注册用户信息表 (接入 D1 数据库后全自动同步)：</p>
            <div class="space-y-1 max-h-40 overflow-y-auto">
              ${state.registeredUsersList.length === 0 ? '<p class="text-slate-400">暂无注册用户</p>' : state.registeredUsersList.map(u => `
                <div class="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-900">
                  <span>👤 ${u.username} (${u.email || '无邮箱'})</span>
                  <span class="text-slate-400">${u.createdAt || '默认'}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `) : ''}

        <!-- 11. 仅管理员可见的回复邮箱注册用户验证码功能的预留功能区 -->
        ${isAdmin ? renderAccordion('sec11', '✉️ 11. 仅管理员可见的回复邮箱注册用户验证码预留区', `
          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold">开启邮箱验证码注册功能：</span>
              <input type="checkbox" id="toggle-email-verify-check" class="w-4 h-4 accent-blue-500 cursor-pointer" ${state.settings.enableEmailVerify ? 'checked' : ''} />
            </div>

            <div>
              <label class="block font-bold mb-1">系统内部注册验证码 (默认 888888):</label>
              <input type="text" id="setting-verify-code" class="fox-input font-mono" value="${state.settings.systemVerifyCode}" />
            </div>

            <div>
              <label class="block font-bold mb-1">回复发信邮箱地址 (回复发信域名):</label>
              <input type="text" id="setting-reply-email" class="fox-input font-mono" value="${state.settings.replyEmail}" placeholder="noreply@fox.ai" />
            </div>

            <button id="save-email-verify-config-btn" class="fox-btn-primary w-full text-xs py-2 font-bold">💾 保存邮箱验证码预留配置</button>
          </div>
        `) : ''}
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

// Interactive Events Handler
function bindGlobalEvents() {
  document.addEventListener('change', (e) => {
    if (e.target.id === 'header-lang-select') {
      state.lang = e.target.value;
      localStorage.setItem('fox_lang', state.lang);
      renderApp();
    }

    if (e.target.id === 'engine-choice-select') {
      state.settings.engineChoice = e.target.value;
      localStorage.setItem('fox_engine_choice', state.settings.engineChoice);
      renderApp();
    }
  });

  document.addEventListener('click', async (e) => {
    if (e.target.closest('#toggle-custom-size-btn')) {
      state.isCustomSize = !state.isCustomSize;
      renderApp();
      return;
    }

    if (e.target.closest('#toggle-advanced-settings-btn')) {
      state.showAdvancedSettings = !state.showAdvancedSettings;
      renderApp();
      return;
    }

    if (e.target.closest('#verify-cf-token-btn')) {
      await verifyCfToken();
      return;
    }

    if (e.target.closest('#save-keys-btn')) {
      state.settings.cfAccountId = document.getElementById('setting-cf-id').value.trim();
      state.settings.cfApiToken = document.getElementById('setting-cf-token').value.trim();
      localStorage.setItem('fox_cf_account_id', state.settings.cfAccountId);
      localStorage.setItem('fox_cf_api_token', state.settings.cfApiToken);
      alert('✅ Cloudflare 凭证保存成功！');
      return;
    }

    if (e.target.closest('#save-openai-keys-btn')) {
      state.settings.openaiApiKey = document.getElementById('setting-openai-key').value.trim();
      state.settings.openaiBaseUrl = document.getElementById('setting-openai-base').value.trim();
      state.settings.openaiModel = document.getElementById('setting-openai-model').value.trim();
      localStorage.setItem('fox_openai_api_key', state.settings.openaiApiKey);
      localStorage.setItem('fox_openai_base_url', state.settings.openaiBaseUrl);
      localStorage.setItem('fox_openai_model', state.settings.openaiModel);
      alert('✅ 外接通用算力 Key 配置保存成功！');
      return;
    }

    if (e.target.closest('#save-email-verify-config-btn')) {
      state.settings.enableEmailVerify = document.getElementById('toggle-email-verify-check').checked;
      state.settings.systemVerifyCode = document.getElementById('setting-verify-code').value.trim();
      state.settings.replyEmail = document.getElementById('setting-reply-email').value.trim();

      localStorage.setItem('fox_enable_email_verify', state.settings.enableEmailVerify);
      localStorage.setItem('fox_system_verify_code', state.settings.systemVerifyCode);
      localStorage.setItem('fox_reply_email', state.settings.replyEmail);
      alert('✅ 邮箱验证码预留配置已保存！');
      return;
    }

    if (e.target.closest('#change-pass-btn')) {
      const pass = document.getElementById('new-password-input').value.trim();
      if (!pass) return alert('请输入新密码');
      state.settings.adminPassword = pass;
      localStorage.setItem('fox_admin_password', pass);
      alert('✅ 密码更新成功！');
      return;
    }

    const deviceBtn = e.target.closest('[data-device]');
    if (deviceBtn) {
      state.deviceMode = deviceBtn.getAttribute('data-device');
      localStorage.setItem('fox_device_mode', state.deviceMode);
      renderApp();
      return;
    }

    if (e.target.closest('#online-search-btn')) {
      if (!state.searchQuery.trim()) return alert('请输入模型搜索关键词');
      state.isSearchingOnline = true;
      try {
        const data = await fetchWithTimeout(`/api/models/search?q=${encodeURIComponent(state.searchQuery)}`, {}, 8000);
        if (data && data.models) {
          state.onlineModels = data.models;
        }
      } catch (err) {
        alert(`❌ 全网搜索提示: ${err.message}`);
      }
      state.isSearchingOnline = false;
      renderApp();
      return;
    }

    if (e.target.closest('#analyze-vision-btn')) {
      const fileInput = document.getElementById('vision-file-input');
      if (!fileInput || !fileInput.files[0]) return alert('请先上传分析图片');

      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = evt.target.result;
        try {
          const data = await fetchWithTimeout('/api/vision-analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
          }, 10000);
          if (data && data.prompt) {
            state.chatMessages.push({ role: 'assistant', text: `📸 图像分析提取出的画风关键词：\n\n${data.prompt}` });
            renderApp();
          }
        } catch (err) {
          alert(`图像分析提示: ${err.message}`);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    if (e.target.closest('#send-chat-btn')) {
      await handleSendChat();
      return;
    }

    if (e.target.closest('#upload-to-r2-btn')) {
      if (!state.lastGeneratedImage) return;
      const key = `fox-ai-${Date.now()}.png`;
      try {
        const data = await fetchWithTimeout('/api/r2/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, dataUrl: state.lastGeneratedImage.url })
        }, 10000);
        if (data && data.success) {
          alert('✅ 成功同步保存至 R2 对象存储空间！');
          await fetchR2Objects();
        }
      } catch (err) {
        alert(`R2 上传提示: ${err.message}`);
      }
      return;
    }

    if (e.target.closest('#r2-upload-trigger-btn')) {
      document.getElementById('r2-file-input')?.click();
      return;
    }

    if (e.target.closest('#r2-mkdir-btn')) {
      const folderName = prompt('请输入新建文件夹名称:');
      if (folderName) {
        await fetchWithTimeout('/api/r2/mkdir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderName })
        }, 5000);
        await fetchR2Objects();
        renderApp();
      }
      return;
    }

    const previewR2 = e.target.closest('[data-preview-r2-item]');
    if (previewR2) {
      state.previewModalUrl = decodeURIComponent(previewR2.getAttribute('data-preview-r2-item'));
      state.previewMediaType = previewR2.getAttribute('data-media-type') || 'image';
      renderApp();
      return;
    }

    const checkItem = e.target.closest('[data-select-idx]');
    if (checkItem) {
      const idx = parseInt(checkItem.getAttribute('data-select-idx'), 10);
      if (state.selectedLocalHistoryIdxs.includes(idx)) {
        state.selectedLocalHistoryIdxs = state.selectedLocalHistoryIdxs.filter(i => i !== idx);
      } else {
        state.selectedLocalHistoryIdxs.push(idx);
      }
      renderApp();
      return;
    }

    if (e.target.id === 'batch-select-all') {
      if (state.selectedLocalHistoryIdxs.length === state.localHistory.length) {
        state.selectedLocalHistoryIdxs = [];
      } else {
        state.selectedLocalHistoryIdxs = state.localHistory.map((_, i) => i);
      }
      renderApp();
      return;
    }

    if (e.target.closest('#batch-delete-btn')) {
      if (confirm(`确定批量删除选中的 ${state.selectedLocalHistoryIdxs.length} 项历史记录吗？`)) {
        state.localHistory = state.localHistory.filter((_, idx) => !state.selectedLocalHistoryIdxs.includes(idx));
        state.selectedLocalHistoryIdxs = [];
        localStorage.setItem('fox_history', JSON.stringify(state.localHistory));
        renderApp();
      }
      return;
    }

    const delSingleHist = e.target.closest('[data-delete-single-history]');
    if (delSingleHist) {
      const idx = parseInt(delSingleHist.getAttribute('data-delete-single-history'), 10);
      state.localHistory.splice(idx, 1);
      localStorage.setItem('fox_history', JSON.stringify(state.localHistory));
      renderApp();
      return;
    }

    const loadParamsBtn = e.target.closest('[data-load-params]');
    if (loadParamsBtn) {
      const item = JSON.parse(decodeURIComponent(loadParamsBtn.getAttribute('data-load-params')));
      state.prompt = item.prompt || '';
      state.width = item.width || 1024;
      state.height = item.height || 1024;
      state.activeTab = 'txt2img';
      alert('✅ 已成功载入绘图参数！');
      renderApp();
      return;
    }

    const bgPresetBtn = e.target.closest('[data-bg-preset]');
    if (bgPresetBtn) {
      state.bgPreset = bgPresetBtn.getAttribute('data-bg-preset');
      localStorage.setItem('fox_bg_preset', state.bgPreset);
      applyAppPreferences();
      renderApp();
      return;
    }

    const themeAccBtn = e.target.closest('[data-theme-accent]');
    if (themeAccBtn) {
      state.themeAccent = themeAccBtn.getAttribute('data-theme-accent');
      localStorage.setItem('fox_theme_accent', state.themeAccent);
      applyAppPreferences();
      renderApp();
      return;
    }

    const openPrev = e.target.closest('[data-open-preview]');
    if (openPrev) {
      state.previewModalUrl = decodeURIComponent(openPrev.getAttribute('data-open-preview'));
      state.previewMediaType = 'image';
      renderApp();
      return;
    }

    if (e.target.closest('#close-preview-modal-btn')) {
      state.previewModalUrl = null;
      renderApp();
      return;
    }

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

    const delR2Btn = e.target.closest('[data-delete-r2]');
    if (delR2Btn) {
      const key = decodeURIComponent(delR2Btn.getAttribute('data-delete-r2'));
      if (confirm(`确定从 R2 删除文件 ${key} 吗？`)) {
        await fetchWithTimeout('/api/r2/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key })
        }, 5000);
        await fetchR2Objects();
        renderApp();
      }
      return;
    }

    if (e.target.closest('#logout-btn')) {
      state.user = null;
      localStorage.removeItem('fox_user');
      renderApp();
      return;
    }

    const useModelBtn = e.target.closest('[data-use-model]');
    if (useModelBtn) {
      state.selectedModel = useModelBtn.getAttribute('data-use-model');
      localStorage.setItem('fox_selected_model', state.selectedModel);
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

    if (e.target.closest('#batch-1-btn')) {
      state.batchCount = 1;
      renderApp();
      return;
    }

    if (e.target.closest('#batch-4-btn')) {
      state.batchCount = 4;
      renderApp();
      return;
    }

    if (e.target.closest('#generate-btn')) {
      await handleGenerateImage();
      return;
    }
  });

  document.addEventListener('change', async (e) => {
    if (e.target.id === 'r2-file-input') {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      state.isUploading = true;
      state.uploadProgress = 10;
      renderApp();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = async (evt) => {
            const dataUrl = evt.target.result;
            const key = state.r2Storage.currentFolder ? `${state.r2Storage.currentFolder}${file.name}` : file.name;

            state.uploadProgress = Math.round(((i + 0.5) / files.length) * 100);
            renderApp();

            await fetchWithTimeout('/api/r2/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key, dataUrl })
            }, 15000);

            state.uploadProgress = Math.round(((i + 1) / files.length) * 100);
            renderApp();
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }

      state.isUploading = false;
      alert('✅ 全部选定文件已成功上传至 R2 空间！');
      await fetchR2Objects();
      renderApp();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'custom-width-input') {
      state.width = parseInt(e.target.value, 10) || 1024;
    }
    if (e.target.id === 'custom-height-input') {
      state.height = parseInt(e.target.value, 10) || 1024;
    }
    if (e.target.id === 'steps-range') {
      state.steps = parseInt(e.target.value, 10);
    }
    if (e.target.id === 'cfg-range') {
      state.cfgScale = parseFloat(e.target.value);
    }
    if (e.target.id === 'model-search-input') {
      state.searchQuery = e.target.value;
    }
  });
}

function bindTabEvents() {
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.getAttribute('data-tab');
      if (state.activeTab === 'history') {
        fetchR2Objects();
      }
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

  try {
    const data = await fetchWithTimeout('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: state.prompt })
    }, 10000);

    if (data && data.translatedText) {
      state.prompt = data.translatedText;
      const promptInput = document.getElementById('prompt-input');
      if (promptInput) promptInput.value = state.prompt;
    }
  } catch (err) {
    alert(`翻译优化提示: ${err.message}`);
  }
}

async function handleGenerateImage() {
  if (!state.prompt.trim()) return alert('请输入提示词！');
  state.isGenerating = true;
  renderApp();

  try {
    const styleObj = ART_STYLES.find(s => s.id === state.selectedStyle);
    let finalPrompt = styleObj && styleObj.prompt ? `${state.prompt}, ${styleObj.prompt}` : state.prompt;

    // Automatic quality boost for free compute engines to ensure high quality results
    if (!finalPrompt.toLowerCase().includes('masterpiece')) {
      finalPrompt = `${finalPrompt}, masterpiece, best quality, highly detailed, 8k resolution, cinematic lighting, sharp focus`;
    }

    const data = await fetchWithTimeout('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine: state.settings.engineChoice,
        model: state.selectedModel,
        prompt: finalPrompt,
        negativePrompt: state.negativePrompt,
        width: state.width,
        height: state.height,
        steps: state.steps,
        batchCount: state.batchCount,
        image: state.activeTab === 'img2img' ? state.img2imgBase64 : null,
        cfAccountId: state.settings.cfAccountId,
        cfApiToken: state.settings.cfApiToken,
        openaiApiKey: state.settings.openaiApiKey,
        openaiBaseUrl: state.settings.openaiBaseUrl,
        openaiModel: state.settings.openaiModel
      })
    }, 45000);

    const imgList = data && data.images && data.images.length > 0 ? data.images : [data.url || data.image];
    state.lastGeneratedImages = imgList.map((url, idx) => ({
      url: url,
      prompt: state.prompt,
      model: state.selectedModel,
      width: state.width,
      height: state.height,
      timestamp: Date.now() + idx
    }));

    state.lastGeneratedImage = state.lastGeneratedImages[0];
    for (const item of state.lastGeneratedImages) {
      state.localHistory.unshift(item);
    }
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
    const data = await fetchWithTimeout('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: userMsg })
    }, 10000);

    if (data && data.translatedText) {
      state.chatMessages.push({ role: 'assistant', text: `✨ 为您优化的生图提示词：\n\n${data.translatedText}` });
    }
  } catch (err) {
    state.chatMessages.push({ role: 'assistant', text: `[白狐AI 响应]: "masterpiece, ${userMsg}, 8k resolution"` });
  } finally {
    renderApp();
  }
}

// Auto Initialize Application on DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
