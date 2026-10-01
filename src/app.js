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
    cfApi: true,
    cfTokenValid: false,
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
  bookmarkedModels: JSON.parse(localStorage.getItem('fox_bookmarks') || '[]'),
  searchQuery: '',
  onlineModels: [],
  isSearchingOnline: false,

  selectedModel: '@cf/black-forest-labs/flux-1-schnell',
  selectedStyle: 'none',
  prompt: '',
  negativePrompt: NEGATIVE_PROMPT_PRESETS[0],
  width: 1024,
  height: 1024,
  steps: 4,
  cfgScale: 7.5,
  seed: '',
  sampler: 'Euler a',
  showAdvancedSettings: false,
  isCustomSize: false,
  img2imgBase64: null,
  isGenerating: false,
  lastGeneratedImage: null,

  previewModalImgUrl: null,

  historyTab: 'local',
  selectedLocalHistoryIdxs: [],
  localHistory: JSON.parse(localStorage.getItem('fox_history') || '[]'),
  r2Storage: {
    bound: false,
    objects: [],
    totalSizeMB: '0.00',
    remainingSpaceMB: '10240.00'
  },

  authTab: 'login',
  adminPasswordOnlyInput: '',
  loginUsername: '',
  loginPassword: '',
  registerEmail: '',
  registerUsername: '',
  registerPassword: '',
  registerVerifyCode: '',
  authError: '',

  chatInput: '',
  chatMessages: [
    { role: 'assistant', text: '你好！我是白狐AI智能助手。您可以输入提示词要求我为您进行高精度中英双向翻译，或上传参考图分析色彩风格！' }
  ],
  visionImageBase64: null,
  isAnalyzingVision: false
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
        cfApi: !!data.hasAI || !!data.hasToken,
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

    if (data && data.valid) {
      state.status.cfTokenValid = true;
      alert(`✅ ${data.message}`);
    } else {
      state.status.cfTokenValid = false;
      alert(`❌ ${data.message || 'Token 验证未通过'}`);
    }
  } catch (err) {
    state.status.cfTokenValid = false;
    alert(`❌ Token 校验出错: ${err.message}`);
  }
  renderApp();
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
      <!-- Compact Header Bar -->
      <header class="sticky top-0 z-40 glass-panel !rounded-none !border-x-0 !border-t-0 px-3 py-2 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg overflow-hidden shadow border border-blue-500/30 flex-shrink-0 bg-slate-900">
            <img src="${state.customAvatar}" class="w-full h-full object-cover" />
          </div>
          <div>
            <h1 class="text-base font-black tracking-tight fox-gradient-text leading-none">${t('appTitle')}</h1>
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

      <!-- Main Workspace Container -->
      <main class="flex-1 ${containerWidthClass} w-full mx-auto p-3 sm:p-5 space-y-5 transition-all duration-200">
        ${renderActiveTabContent()}
      </main>

      <!-- Image Lightbox Modal -->
      ${state.previewModalImgUrl ? renderImagePreviewModal() : ''}

      <!-- Bottom Dock Navigation Bar with Single Clean Icons -->
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

function renderImagePreviewModal() {
  return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-4">
        <button id="close-preview-modal-btn" class="absolute -top-10 right-0 text-white text-2xl font-bold bg-white/20 rounded-full w-8 h-8 flex items-center justify-center hover:scale-110 transition">✕</button>
        <img src="${state.previewModalImgUrl}" class="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
        <div class="flex gap-3">
          <a href="${state.previewModalImgUrl}" download="fox-ai-hd-${Date.now()}.png" class="fox-btn-primary text-xs py-2 px-6">
            📥 确认下载高清大图
          </a>
        </div>
      </div>
    </div>
  `;
}

// Auth Screen
function renderWhiteFoxAuthScreen() {
  const isRegister = state.authTab === 'register';

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
          <p class="text-xs text-slate-500 font-medium">管理员无需账号密码直登 / 邮箱通用注册</p>
        </div>

        <div class="flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
          <button id="tab-auth-login" class="flex-1 py-2 rounded-lg transition ${!isRegister ? 'bg-blue-500 text-white shadow' : 'text-slate-500 hover:text-slate-900'}">
            🔑 管理员直登 / 账号登录
          </button>
          <button id="tab-auth-register" class="flex-1 py-2 rounded-lg transition ${isRegister ? 'bg-blue-500 text-white shadow' : 'text-slate-500 hover:text-slate-900'}">
            📧 账号注册
          </button>
        </div>

        ${state.authError ? `
          <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-bold">
            ⚠️ ${state.authError}
          </div>
        ` : ''}

        <form id="auth-form" class="space-y-4">
          ${isRegister ? `
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">电子邮箱地址</label>
              <input type="email" id="auth-email" class="fox-input !bg-white !border-slate-200 text-slate-900" placeholder="user@example.com" value="${state.registerEmail}" required />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">注册用户名</label>
              <input type="text" id="auth-username" class="fox-input !bg-white !border-slate-200 text-slate-900" placeholder="设置用户名" value="${state.registerUsername}" required />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">密码</label>
              <input type="password" id="auth-password" class="fox-input !bg-white !border-slate-200 text-slate-900" placeholder="设置密码" value="${state.registerPassword}" required />
            </div>

            ${state.settings.enableEmailVerify ? `
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">邮箱验证码</label>
                <input type="text" id="auth-verify-code" class="fox-input !bg-white !border-slate-200 text-slate-900" placeholder="输入接收到的 6 位验证码" value="${state.registerVerifyCode}" required />
              </div>
            ` : ''}
          ` : `
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">管理员密码 (直登，默认 fox123456)</label>
              <input type="password" id="auth-admin-password-only" class="fox-input !bg-white !border-slate-200 text-slate-900 font-mono" placeholder="默认密码: fox123456" value="${state.adminPasswordOnlyInput}" required />
            </div>
          `}

          <button type="submit" class="fox-btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-blue-500/20">
            ${isRegister ? '🚀 提交注册并开始使用' : '🔑 验证密码进入工作台'}
          </button>
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
      const password = document.getElementById('auth-admin-password-only')?.value.trim();

      try {
        const data = await fetchWithTimeout('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password })
        }, 8000);

        if (data && data.ok) {
          state.user = { username: 'admin', role: 'admin' };
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
        state.authError = err.message || '管理员密码校验失败';
        renderApp();
      }
    } else {
      const email = document.getElementById('auth-email').value.trim();
      const username = document.getElementById('auth-username').value.trim();
      const password = document.getElementById('auth-password').value.trim();
      const verifyCode = document.getElementById('auth-verify-code')?.value.trim();

      try {
        await fetchWithTimeout('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password, verifyCode })
        }, 8000);

        state.user = { username, email, role: 'user' };
        localStorage.setItem('fox_user', JSON.stringify(state.user));
        state.authError = '';
        renderApp();
      } catch (err) {
        state.authError = err.message || '注册请求失败';
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
  const engineObj = COMPUTE_ENGINES.find(e => e.id === state.settings.engineChoice) || COMPUTE_ENGINES[0];

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-7 space-y-5">

        <div class="glass-panel p-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 overflow-hidden">
            <img src="${selectedModelObj.cover}" class="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm border border-slate-200 dark:border-slate-700" />
            <div class="truncate">
              <div class="flex items-center gap-2">
                <span class="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  引擎: ${engineObj.name.split(' ')[0]}
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
            <button id="toggle-advanced-settings-btn" class="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline">
              ${state.showAdvancedSettings ? '▲ 收起高级设置' : '⚙️ 展开高级调节 (Steps, CFG, Seed)'}
            </button>
          </div>

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

              <div class="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label class="block font-bold mb-1">随机种子 (Seed):</label>
                  <input type="number" id="seed-input" class="fox-input font-mono" placeholder="留空则随机" value="${state.seed}" />
                </div>
                <div>
                  <label class="block font-bold mb-1">采样算法 (Sampler):</label>
                  <select id="sampler-select" class="fox-input font-mono">
                    <option value="Euler a" ${state.sampler === 'Euler a' ? 'selected' : ''}>Euler a</option>
                    <option value="DPM++ 2M Karras" ${state.sampler === 'DPM++ 2M Karras' ? 'selected' : ''}>DPM++ 2M Karras</option>
                    <option value="DDIM" ${state.sampler === 'DDIM' ? 'selected' : ''}>DDIM</option>
                  </select>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <button id="generate-btn" class="fox-btn-primary w-full py-3.5 text-base shadow-lg shadow-blue-500/25 ${state.isGenerating ? 'opacity-70 cursor-wait' : ''}">
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
        <div class="glass-panel p-4 sticky top-20 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 dark:text-slate-100">
              🖼️ 实时工作台预览
            </h2>
            <span class="text-[11px] text-slate-400">
              ${state.isGenerating ? '⚡ 算力计算中' : '🟢 就绪'}
            </span>
          </div>

          <div class="relative min-h-[320px] max-h-[500px] w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            ${state.isGenerating ? `
              <div class="p-6 text-center space-y-3">
                <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">白狐AI 正在为您绘制...</p>
              </div>
            ` : state.lastGeneratedImage ? `
              <img id="preview-image" src="${state.lastGeneratedImage.url}" class="w-full h-full object-contain rounded-lg shadow-inner cursor-pointer" data-open-preview="${encodeURIComponent(state.lastGeneratedImage.url)}" />
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
                <button id="upload-to-r2-btn" class="fox-btn-secondary text-xs text-blue-600 dark:text-blue-400">
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

// History Workspace
function renderHistoryWorkspace() {
  const isR2 = state.historyTab === 'r2';

  return `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">📜 历史生成记录 & 绘图参数载入</h2>
          <p class="text-xs text-slate-500">已自动记录全部绘图细节，支持一键载入参数重新绘图</p>
        </div>

        <div class="flex rounded-xl bg-slate-200 dark:bg-slate-900 p-1 text-xs font-bold">
          <button id="history-tab-local" class="px-3 py-1.5 rounded-lg transition ${!isR2 ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-200'}">
            💻 本地历史 (${state.localHistory.length})
          </button>
          <button id="history-tab-r2" class="px-3 py-1.5 rounded-lg transition ${isR2 ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-200'}">
            ☁️ R2 存储桶
          </button>
        </div>
      </div>

      ${isR2 ? renderR2HistorySection() : renderBatchLocalHistorySection()}
    </div>
  `;
}

function renderBatchLocalHistorySection() {
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
            <button id="batch-delete-btn" class="fox-btn-secondary text-xs text-red-500">
              🗑️ 批量删除选中
            </button>
          ` : ''}
          <button id="clear-local-history-btn" class="fox-btn-secondary text-xs text-red-500">
            清空全部历史
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${state.localHistory.map((item, idx) => {
          const isChecked = state.selectedLocalHistoryIdxs.includes(idx);
          return `
            <div class="glass-panel overflow-hidden group relative flex flex-col justify-between border ${isChecked ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}">
              <div class="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" data-open-preview="${encodeURIComponent(item.url)}">
                <input type="checkbox" data-select-idx="${idx}" class="absolute top-2 left-2 z-20 w-4 h-4 accent-blue-500 rounded cursor-pointer" ${isChecked ? 'checked' : ''} />
                <img src="${item.url}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
              </div>

              <div class="p-3 space-y-2">
                <p class="text-xs text-slate-800 dark:text-slate-100 font-mono line-clamp-2">${item.prompt}</p>
                <div class="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                  <p>模型: <span class="text-slate-300">${item.model || 'FLUX.1 Schnell'}</span></p>
                  <p>尺寸: <span class="text-slate-300">${item.width || 1024} × ${item.height || 1024}</span></p>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                  <a href="${item.url}" download="fox-ai-${item.timestamp}.png" class="text-blue-500 font-bold hover:underline">
                    📥 下载
                  </a>
                  <button data-load-params="${encodeURIComponent(JSON.stringify(item))}" class="fox-btn-primary text-xs py-1 px-3">
                    🎨 载入绘图参数
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

function renderR2HistorySection() {
  const r2 = state.r2Storage;

  return `
    <div class="space-y-4">
      <div class="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full ${r2.bound ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}"></span>
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">
              Cloudflare R2 对象存储桶: ${r2.bound ? '已连接运行中' : '未关联绑定'}
            </h3>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            已占用大小: <b class="text-blue-600 dark:text-blue-400">${r2.totalSizeMB || '0.00'} MB</b>
          </p>
        </div>
      </div>

      ${!r2.bound ? `
        <div class="glass-panel p-8 text-center space-y-3">
          <div class="text-3xl">☁️</div>
          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">未接入 Cloudflare R2 存储桶</p>
        </div>
      ` : r2.objects.length === 0 ? `
        <div class="glass-panel p-8 text-center text-slate-400 text-xs">
          R2 存储桶目前为空
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
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button data-delete-r2="${encodeURIComponent(obj.key)}" class="text-xs text-red-500 hover:underline">
                  🗑️ 删除
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
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
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">📦 热门模型库 & Civitai / HuggingFace 检索</h2>
          <p class="text-xs text-slate-500">缩略图预览与源站点跳转，支持一键保存与同步</p>
        </div>

        <div class="flex gap-2 max-w-sm w-full">
          <input type="text" id="model-search-input" class="fox-input" placeholder="输入关键词 (如 anime, realistic)..." value="${state.searchQuery}" />
          <button id="online-search-btn" class="fox-btn-primary text-xs flex-shrink-0">
            🔍 搜全网
          </button>
        </div>
      </div>

      ${state.onlineModels.length > 0 ? `
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-blue-500 flex items-center gap-1">
            🌐 互联网全网高赞开源模型：
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${state.onlineModels.map(m => `
              <div class="glass-panel overflow-hidden p-3.5 space-y-2 flex flex-col justify-between border border-blue-500/30">
                <div class="space-y-2">
                  <img src="${m.cover}" class="w-full h-32 object-cover rounded-xl" />
                  <h4 class="font-bold text-sm text-slate-100">${m.name}</h4>
                  <p class="text-xs text-slate-400">${m.description}</p>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-800">
                  <a href="${m.sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-400 hover:underline">
                    🌐 查看源站点
                  </a>
                  <button data-save-online-model="${encodeURIComponent(JSON.stringify(m))}" class="fox-btn-secondary text-xs text-blue-500">
                    ⭐ 保存到模型库
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div id="models-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${renderModelItems(filteredModels)}
      </div>
    </div>
  `;
}

function renderModelItems(modelsList) {
  return modelsList.map(model => {
    return `
      <div class="glass-panel overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="relative h-36 w-full overflow-hidden bg-slate-800">
            <img src="${model.cover}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
            <span class="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500 text-white">
              ${model.category}
            </span>
          </div>

          <div class="p-3.5 space-y-1.5">
            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">${model.name}</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">${model.description}</p>
          </div>
        </div>

        <div class="p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between mt-2">
          <a href="${model.sourceUrl || 'https://civitai.com'}" target="_blank" rel="noopener noreferrer" class="text-[11px] text-blue-500 hover:underline">
            🌐 站点信息
          </a>
          <button data-use-model="${model.id}" class="fox-btn-primary text-xs py-1.5 px-3">
            ${state.selectedModel === model.id ? '当前选择中' : '选择使用此模型'}
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
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">白狐AI 提示词助理 & 图像反推分析</h2>
          <p class="text-xs text-slate-500">支持中英互译、爆款词优化，以及上传图片提取色彩和画风词</p>
        </div>
      </div>

      <div class="glass-panel p-3.5 space-y-3 bg-blue-500/5 border border-blue-500/20">
        <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
          📸 上传图片反推提示词 (Image Interrogator)
        </label>
        <div class="flex items-center gap-3">
          <input type="file" id="vision-file-input" accept="image/*" class="text-xs text-slate-500" />
          <button id="analyze-vision-btn" class="fox-btn-primary text-xs py-1.5 px-3 flex-shrink-0">
            🔍 分析词汇
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
        <input type="text" id="chat-input" class="fox-input flex-1" placeholder="输入中文或描述..." />
        <button id="send-chat-btn" class="fox-btn-primary flex-shrink-0">
          发送 🚀
        </button>
      </div>
    </div>
  `;
}

// Settings Workspace
function renderSettingsWorkspace() {
  const isAdmin = state.user && state.user.role === 'admin';

  return `
    <div class="glass-panel p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">⚙️ 系统设置与算力管理</h2>
          <p class="text-xs text-slate-500">算力选择记忆持久化，支持管理员权限保护</p>
        </div>
        <button id="logout-btn" class="fox-btn-secondary text-xs text-red-500">
          🚪 退出登录
        </button>
      </div>

      <div class="glass-panel p-3.5 space-y-3 border border-blue-500/30 bg-blue-500/5">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">🖼️ 主页个人头像设置：</label>
        <div class="flex items-center gap-4">
          <img src="${state.customAvatar}" class="w-14 h-14 rounded-2xl object-cover shadow border border-slate-700" />
          <div class="space-y-1">
            <input type="file" id="custom-avatar-file-input" accept="image/*" class="text-xs text-slate-500" />
          </div>
        </div>
      </div>

      <div class="glass-panel p-3.5 space-y-2">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">⚡ 算力引擎选择 (选择后自动保持记忆)：</label>
        <select id="engine-choice-select" class="fox-input font-bold">
          ${COMPUTE_ENGINES.map(eng => `
            <option value="${eng.id}" ${state.settings.engineChoice === eng.id ? 'selected' : ''}>${eng.name}</option>
          `).join('')}
        </select>
      </div>

      <div class="glass-panel p-3.5 space-y-2">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">🌌 界面背景色调：</label>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
          ${BACKGROUND_PRESETS.map(bg => `
            <button data-bg-preset="${bg.id}" class="p-2 rounded-xl text-xs font-bold border ${state.bgPreset === bg.id ? 'border-blue-500 ring-2 ring-blue-500/30 font-black' : 'border-slate-700'} ${bg.bgClass} transition hover:scale-105">
              ${bg.name}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="glass-panel p-3.5 space-y-2">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">🎨 界面主题主色调：</label>
        <div class="flex items-center gap-2 overflow-x-auto">
          ${THEME_ACCENTS.map(acc => `
            <button data-theme-accent="${acc.id}" class="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow transition flex items-center gap-1.5 ${state.themeAccent === acc.id ? 'ring-2 ring-white scale-105' : ''}" style="background-color: ${acc.hex}">
              <span>${acc.name}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="space-y-3">
        ${renderAccordion('sec1', '🌙 1. 深色/浅色视觉模式', `
          <div class="flex items-center justify-between text-xs">
            <span>切换主题：</span>
            <button id="toggle-night-btn" class="fox-btn-secondary text-xs">
              ${state.themeMode === 'dark' ? '☀️ 浅色模式' : '🌙 夜间模式'}
            </button>
          </div>
        `)}

        ${renderAccordion('sec2', '🔑 2. Cloudflare API 凭证与连通状态', `
          <div class="space-y-3 text-xs">
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
                <button id="save-keys-btn" class="fox-btn-primary flex-1 text-xs py-2">💾 保存 CF 凭证</button>
                <button id="verify-cf-token-btn" class="fox-btn-secondary flex-1 text-xs py-2">⚡ 验证 Token 状态</button>
              </div>
            ` : `
              <p class="text-slate-400">仅管理员有权修改后台 API 凭证</p>
            `}
          </div>
        `)}

        ${renderAccordion('sec3', '🤖 3. OpenAI 兼容全通用算力接口 Key 配置', `
          <div class="space-y-3 text-xs">
            ${isAdmin ? `
              <div>
                <label class="block font-bold mb-1">OpenAI API Key (或中转API Key):</label>
                <input type="password" id="setting-openai-key" class="fox-input font-mono" value="${state.settings.openaiApiKey}" placeholder="sk-xxxx..." />
              </div>
              <div>
                <label class="block font-bold mb-1">OpenAI Base URL:</label>
                <input type="text" id="setting-openai-base" class="fox-input font-mono" value="${state.settings.openaiBaseUrl}" placeholder="https://api.openai.com/v1" />
              </div>
              <button id="save-openai-keys-btn" class="fox-btn-primary w-full text-xs py-2">💾 保存 OpenAI 兼容算力 Key</button>
            ` : `
              <p class="text-slate-400">仅管理员有权配置通用算力接口</p>
            `}
          </div>
        `)}

        ${renderAccordion('sec4', '🔴 4. Cloudflare API 指示灯', `
          <div class="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900">
            <span class="font-bold">Cloudflare API Token 鉴权状态：</span>
            <span class="flex items-center gap-1.5 font-bold ${state.status.cfTokenValid ? 'text-emerald-500' : 'text-amber-500'}">
              <span class="w-2.5 h-2.5 rounded-full ${state.status.cfTokenValid ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
              ${state.status.cfTokenValid ? '校验通过 (凭证可用)' : '未校验或免Key'}
            </span>
          </div>
        `)}

        ${renderAccordion('sec5', '🗄️ 5. Cloudflare D1 数据库与云端同步指示灯', `
          <div class="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900">
            <span class="font-bold">D1 数据库连通状态 (DB)：</span>
            <span class="flex items-center gap-1.5 font-bold ${state.status.d1Database ? 'text-emerald-500' : 'text-amber-500'}">
              <span class="w-2.5 h-2.5 rounded-full ${state.status.d1Database ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
              ${state.status.d1Database ? '已接入 D1 云数据库 (支持历史/设置同步)' : '未开启 D1 数据库 (使用本地离线存储)'}
            </span>
          </div>
        `)}

        ${renderAccordion('sec6', '🔐 6. 密码修改区 & 管理员使用设备 (移至底部)', `
          <div class="space-y-3 text-xs">
            <div class="space-y-1">
              <label class="block font-bold">修改新登录密码：</label>
              <input type="password" id="new-password-input" class="fox-input" placeholder="输入新密码" />
            </div>
            <button id="change-pass-btn" class="fox-btn-secondary text-xs w-full">确认更新密码</button>
          </div>
        `)}

        ${isAdmin ? renderAccordion('sec7', '👥 7. 注册用户管理列表区 (仅管理员可见)', `
          <div class="space-y-3 text-xs">
            <p class="font-bold text-slate-700 dark:text-slate-300">已注册用户表 (D1数据库模式自动同步)：</p>
            <div class="space-y-1 max-h-40 overflow-y-auto">
              ${state.registeredUsersList.length === 0 ? '<p class="text-slate-400">暂无注册用户</p>' : state.registeredUsersList.map(u => `
                <div class="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-900 text-[11px]">
                  <span>👤 ${u.username} (${u.email || '无邮箱'})</span>
                  <span class="text-slate-400">${u.createdAt || '默认'}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `) : ''}

        ${isAdmin ? renderAccordion('sec8', '✉️ 8. 邮箱注册验证码配置预留区 (仅管理员可见)', `
          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold">启用邮箱注册验证码：</span>
              <input type="checkbox" id="toggle-email-verify-check" class="w-4 h-4 accent-blue-500" ${state.settings.enableEmailVerify ? 'checked' : ''} />
            </div>

            <div>
              <label class="block font-bold mb-1">系统验证码配置 (默认 888888):</label>
              <input type="text" id="setting-verify-code" class="fox-input font-mono" value="${state.settings.systemVerifyCode}" />
            </div>

            <div>
              <label class="block font-bold mb-1">回复发信邮箱 (SMTP发信域名):</label>
              <input type="text" id="setting-reply-email" class="fox-input font-mono" value="${state.settings.replyEmail}" placeholder="noreply@fox.ai" />
            </div>

            <button id="save-email-verify-config-btn" class="fox-btn-primary w-full text-xs py-2">💾 保存邮箱验证码配置</button>
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
    if (e.target.id === 'header-lang-select' || e.target.id === 'settings-lang-select') {
      state.lang = e.target.value;
      localStorage.setItem('fox_lang', state.lang);
      renderApp();
    }

    if (e.target.id === 'engine-choice-select') {
      state.settings.engineChoice = e.target.value;
      localStorage.setItem('fox_engine_choice', state.settings.engineChoice);
      renderApp();
    }

    if (e.target.id === 'custom-avatar-file-input') {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          state.customAvatar = evt.target.result;
          localStorage.setItem('fox_custom_avatar', state.customAvatar);
          alert('✅ 主页个人头像修改成功！');
          renderApp();
        };
        reader.readAsDataURL(file);
      }
    }
  });

  document.addEventListener('click', async (e) => {
    if (e.target.closest('#verify-cf-token-btn')) {
      await verifyCfToken();
      return;
    }

    const loadParamsBtn = e.target.closest('[data-load-params]');
    if (loadParamsBtn) {
      const item = JSON.parse(decodeURIComponent(loadParamsBtn.getAttribute('data-load-params')));
      state.prompt = item.prompt || '';
      state.width = item.width || 1024;
      state.height = item.height || 1024;
      state.activeTab = 'txt2img';
      alert('✅ 已将该历史记录的绘图参数载入工作台！');
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

    const openPrev = e.target.closest('[data-open-preview]');
    if (openPrev) {
      state.previewModalImgUrl = decodeURIComponent(openPrev.getAttribute('data-open-preview'));
      renderApp();
      return;
    }

    if (e.target.closest('#close-preview-modal-btn')) {
      state.previewModalImgUrl = null;
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

    const saveModelBtn = e.target.closest('[data-save-online-model]');
    if (saveModelBtn) {
      const modelObj = JSON.parse(decodeURIComponent(saveModelBtn.getAttribute('data-save-online-model')));
      if (!state.models.some(m => m.id === modelObj.id)) {
        state.models.unshift(modelObj);
        localStorage.setItem('fox_custom_models', JSON.stringify(state.models));
        alert('⭐ 成功添加模型到本地模型库！');
        renderApp();
      }
      return;
    }

    if (e.target.closest('#analyze-vision-btn')) {
      const fileInput = document.getElementById('vision-file-input');
      if (!fileInput || !fileInput.files[0]) return alert('请先上传图片');

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
            state.chatMessages.push({ role: 'assistant', text: `📸 图像分析提取出的词汇：\n\n${data.prompt}` });
            renderApp();
          }
        } catch (err) {
          alert(`图像分析提示: ${err.message}`);
        }
      };
      reader.readAsDataURL(file);
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

    if (e.target.closest('#img2img-dropzone')) {
      const fileInput = document.getElementById('img2img-file-input');
      if (fileInput && !e.target.closest('#remove-ref-img-btn')) fileInput.click();
      return;
    }

    if (e.target.closest('#remove-ref-img-btn')) {
      state.img2imgBase64 = null;
      renderApp();
      return;
    }

    if (e.target.closest('#toggle-advanced-settings-btn')) {
      state.showAdvancedSettings = !state.showAdvancedSettings;
      renderApp();
      return;
    }

    if (e.target.closest('#save-keys-btn')) {
      state.settings.cfAccountId = document.getElementById('setting-cf-id').value.trim();
      state.settings.cfApiToken = document.getElementById('setting-cf-token').value.trim();
      localStorage.setItem('fox_cf_account_id', state.settings.cfAccountId);
      localStorage.setItem('fox_cf_api_token', state.settings.cfApiToken);
      alert('✅ CF 凭证保存成功！');
      return;
    }

    if (e.target.closest('#save-openai-keys-btn')) {
      state.settings.openaiApiKey = document.getElementById('setting-openai-key').value.trim();
      state.settings.openaiBaseUrl = document.getElementById('setting-openai-base').value.trim();
      localStorage.setItem('fox_openai_api_key', state.settings.openaiApiKey);
      localStorage.setItem('fox_openai_base_url', state.settings.openaiBaseUrl);
      alert('✅ OpenAI 兼容算力 Key 保存成功！');
      return;
    }

    if (e.target.closest('#save-email-verify-config-btn')) {
      state.settings.enableEmailVerify = document.getElementById('toggle-email-verify-check').checked;
      state.settings.systemVerifyCode = document.getElementById('setting-verify-code').value.trim();
      state.settings.replyEmail = document.getElementById('setting-reply-email').value.trim();

      localStorage.setItem('fox_enable_email_verify', state.settings.enableEmailVerify);
      localStorage.setItem('fox_system_verify_code', state.settings.systemVerifyCode);
      localStorage.setItem('fox_reply_email', state.settings.replyEmail);
      alert('✅ 邮箱验证码配置已保存！');
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
      try {
        const data = await fetchWithTimeout('/api/r2/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, dataUrl: state.lastGeneratedImage.url })
        }, 10000);
        if (data && data.success) {
          alert('✅ 成功同步保存至 R2 对象存储桶！');
          await fetchR2Objects();
        }
      } catch (err) {
        alert(`R2 上传提示: ${err.message}`);
      }
      return;
    }

    const delR2Btn = e.target.closest('[data-delete-r2]');
    if (delR2Btn) {
      const key = decodeURIComponent(delR2Btn.getAttribute('data-delete-r2'));
      if (confirm(`确定删除 R2 文件 ${key} 吗？`)) {
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

  document.addEventListener('change', (e) => {
    if (e.target.id === 'img2img-file-input') {
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

  document.addEventListener('input', (e) => {
    if (e.target.id === 'steps-range') {
      state.steps = parseInt(e.target.value, 10);
    }
    if (e.target.id === 'cfg-range') {
      state.cfgScale = parseFloat(e.target.value);
    }
    if (e.target.id === 'seed-input') {
      state.seed = e.target.value;
    }
    if (e.target.id === 'model-search-input') {
      state.searchQuery = e.target.value;
    }
  });
}

function bindTabEvents() {
  document.querySelectorAll('.bottom-nav-item, .nav-tab-btn').forEach(btn => {
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
    const finalPrompt = styleObj && styleObj.prompt ? `${state.prompt}, ${styleObj.prompt}` : state.prompt;

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
        cfgScale: state.cfgScale,
        seed: state.seed,
        image: state.activeTab === 'img2img' ? state.img2imgBase64 : null,
        cfAccountId: state.settings.cfAccountId,
        cfApiToken: state.settings.cfApiToken,
        openaiApiKey: state.settings.openaiApiKey,
        openaiBaseUrl: state.settings.openaiBaseUrl
      })
    }, 45000);

    const imageUrl = data.url || data.image;
    if (!imageUrl) {
      throw new Error('未返回有效的图片 URL 数据');
    }

    state.lastGeneratedImage = {
      url: imageUrl,
      prompt: state.prompt,
      model: state.selectedModel,
      width: state.width,
      height: state.height,
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
    const data = await fetchWithTimeout('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: userMsg })
    }, 10000);

    if (data && data.translatedText) {
      state.chatMessages.push({ role: 'assistant', text: `✨ 智能为您优化的生图提示词：\n\n${data.translatedText}` });
    }
  } catch (err) {
    state.chatMessages.push({ role: 'assistant', text: `[白狐AI 智能响应]: "masterpiece, ${userMsg}, 8k resolution"` });
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
