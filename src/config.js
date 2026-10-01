export const PRESET_MODELS = [
  {
    id: '@cf/black-forest-labs/flux-1-schnell',
    name: 'FLUX.1 Schnell (超高清旗舰) [免费算力]',
    author: 'Black Forest Labs',
    category: '文生图/旗舰',
    isFree: true,
    nsfwSupport: true,
    description: '全网顶尖 FLUX.1 极速模型，画质与细节表现极佳。',
    cover: '/assets/fox-avatar.webp',
    sourceUrl: 'https://civitai.com'
  },
  {
    id: '@cf/bytedance/stable-diffusion-xl-lightning',
    name: 'SDXL Lightning (极速版) [免费算力]',
    author: 'ByteDance',
    category: '二次元/动漫',
    isFree: true,
    nsfwSupport: true,
    description: '字节跳动极速高精细节算力，毫秒级出图，完美支持二次元与国风海报。',
    cover: '/assets/fox-avatar.webp',
    sourceUrl: 'https://huggingface.co'
  },
  {
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    name: 'SDXL Base 1.0 (真实电影感) [免费算力]',
    author: 'Stability AI',
    category: '真实/人像',
    isFree: true,
    nsfwSupport: true,
    description: '官方SDXL旗舰模型，高精细真实构图、真实质感人像与风光大片。',
    cover: '/assets/fox-avatar.webp',
    sourceUrl: 'https://stability.ai'
  },
  {
    id: '@cf/lykon/dreamshaper-8-inpainting',
    name: 'DreamShaper 8 (全能插画CG) [免费算力]',
    author: 'Lykon',
    category: '插画/CG',
    isFree: true,
    nsfwSupport: true,
    description: '万能二次元插画与游戏3D CG模型，色彩鲜艳细节丰富。',
    cover: '/assets/fox-avatar.webp',
    sourceUrl: 'https://civitai.com'
  }
];

export const COMPUTE_ENGINES = [
  { id: 'cf_workers_ai', name: 'Cloudflare Workers AI (免费内置算力)', isFree: true },
  { id: 'cf_rest_api', name: 'Cloudflare Direct REST API (凭证直连算力)', isFree: true },
  { id: 'openai_compatible', name: 'OpenAI 兼容通用图像算力 (DALL-E 3 / 通用 API)', isFree: false },
  { id: 'pollinations_ai', name: 'Pollinations FLUX AI (免Key全功能算力)', isFree: true }
];

export const BACKGROUND_PRESETS = [
  { id: 'oled-black', name: 'OLED 纯黑', bgClass: 'bg-black text-slate-100' },
  { id: 'slate-dark', name: '暗夜深灰 (默认)', bgClass: 'bg-slate-950 text-slate-100' },
  { id: 'pure-white', name: '珍珠纯白', bgClass: 'bg-white text-slate-900' },
  { id: 'warm-cream', name: '暖调奶油', bgClass: 'bg-amber-50/90 text-amber-950' },
  { id: 'cyber-night', name: '赛博深紫', bgClass: 'bg-slate-900 text-purple-100' },
  { id: 'mint-fresh', name: '薄荷清新', bgClass: 'bg-emerald-50/80 text-emerald-950' }
];

export const ART_STYLES = [
  { id: 'none', name: '预设风格', prompt: '' },
  { id: 'anime', name: '日系动漫', prompt: 'masterpiece, best quality, anime style, highly detailed, vibrant colors, makoto shinkai aesthetic' },
  { id: 'photorealistic', name: '写实人像', prompt: 'photorealistic, 8k resolution, raw photo, highly detailed skin texture, professional lighting, cinematic' },
  { id: 'cyberpunk', name: '赛博朋克', prompt: 'cyberpunk style, neon lights, futuristic city background, glowing highlights, volumetric lighting' },
  { id: 'chinese_poster', name: '国风海报', prompt: 'traditional chinese art style, elegant poster design, ink painting, golden ratio, masterpiece, highly detailed' },
  { id: '3d_pixar', name: '3D皮克斯', prompt: '3d render, pixar style, cute, vibrant colors, smooth lighting, octane render, 4k' },
  { id: 'oil_painting', name: '复古油画', prompt: 'oil painting style, rich texture, van gogh artistic stroke, masterpiece, museum quality' }
];

export const NEGATIVE_PROMPT_PRESETS = [
  'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
  'deformed, distorted, disfigured, poorly drawn face, mutation, mutated, extra limbs, extra legs, extra arms, fused fingers, too many fingers, long neck',
  'worst quality, low quality, illustration, 3d, 2d, painting, cartoons, sketch'
];

export const THEME_ACCENTS = [
  { id: 'ocean-blue', name: '海洋蔚蓝 (默认)', hex: '#3b82f6' },
  { id: 'fox-orange', name: '狐狸经典橙', hex: '#f97316' },
  { id: 'emerald', name: '翡翠绿', hex: '#10b981' },
  { id: 'violet', name: '高雅紫', hex: '#8b5cf6' },
  { id: 'rose', name: '玫瑰红', hex: '#f43f5e' },
  { id: 'gold', name: '香槟金', hex: '#eab308' }
];

export const SUPPORTED_LANGUAGES = [
  { id: 'zh', name: '简体中文 (Chinese)' },
  { id: 'en', name: 'English (US)' },
  { id: 'ja', name: '日本語 (Japanese)' },
  { id: 'ko', name: '한국어 (Korean)' },
  { id: 'es', name: 'Español (Spanish)' },
  { id: 'fr', name: 'Français (French)' }
];

export const I18N_STRINGS = {
  zh: {
    appTitle: '白狐AI',
    subTitle: '极简轻量级 AI 绘图工作台',
    txt2img: '文生图',
    img2img: '图生图',
    models: '模型库',
    translator: 'AI助理',
    history: '历史记录',
    settings: '系统设置',
    generate: '✨ 立即开始智能绘制',
    generating: '绘制生成中，请稍候...',
    promptLabel: '💡 正向提示词 (Prompt)',
    negPromptLabel: '🚫 负向提示词 (Negative Prompt)',
    sizeLabel: '📐 图像尺寸规格',
    styleLabel: '🎨 风格工作台预设',
    langSelect: '🌐 语言切换 / Language'
  },
  en: {
    appTitle: 'Fox AI',
    subTitle: 'Minimalist AI Drawing Workbench',
    txt2img: 'Text2Img',
    img2img: 'Img2Img',
    models: 'Models',
    translator: 'Assistant',
    history: 'History',
    settings: 'Settings',
    generate: '✨ Generate Image Now',
    generating: 'Generating, please wait...',
    promptLabel: '💡 Prompt',
    negPromptLabel: '🚫 Negative Prompt',
    sizeLabel: '📐 Dimensions',
    styleLabel: '🎨 Art Styles',
    langSelect: '🌐 Language / 语言切换'
  }
};
