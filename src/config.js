export const PRESET_MODELS = [
  {
    id: '@cf/bytedance/stable-diffusion-xl-lightning',
    name: 'SDXL Lightning (极速版) [免费]',
    author: 'ByteDance',
    category: '二次元/动漫',
    isFree: true,
    nsfwSupport: true,
    description: '字节跳动极速高精细节算力，毫秒级出图，完美支持二次元与国风海报。',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80'
  },
  {
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    name: 'SDXL Base 1.0 (真实电影感) [免费]',
    author: 'Stability AI',
    category: '真实/人像',
    isFree: true,
    nsfwSupport: true,
    description: '官方SDXL旗舰模型，高精细真实构图、真实质感人像与风光大片。',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80'
  },
  {
    id: '@cf/lykon/dreamshaper-8-inpainting',
    name: 'DreamShaper 8 (全能插画CG) [免费]',
    author: 'Lykon',
    category: '插画/CG',
    isFree: true,
    nsfwSupport: true,
    description: '万能二次元插画与游戏3D CG模型，色彩鲜艳细节丰富。',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'
  },
  {
    id: '@cf/runwayml/stable-diffusion-v1-5-inpainting',
    name: 'SD v1.5 Inpainting (重绘修补) [免费]',
    author: 'RunwayML',
    category: '图生图',
    isFree: true,
    nsfwSupport: false,
    description: '经典 SD1.5 架构，支持图生图局部修补与细节增强。',
    cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&q=80'
  },
  {
    id: 'pollinations/flux-realism',
    name: 'FLUX Realism 超写实 [免费算力]',
    author: 'Pollinations AI',
    category: '真实/人像',
    isFree: true,
    nsfwSupport: true,
    description: '免 Key 全球分布式免费 FLUX 开源渲染引擎，极高清细节。',
    cover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80'
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Fox Prompt Enhancer (智能助手) [免费]',
    author: 'Fox AI Core',
    category: 'AI翻译/对话',
    isFree: true,
    nsfwSupport: false,
    description: '专门用于中英文提示词双向互译与 Prompt 智能爆款增强。',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'
  },
  {
    id: '@cf/dusty-nv/stablediffusion-fantasy',
    name: 'Fantasy Realm 奇幻史诗 [免费]',
    author: 'Community',
    category: '奇幻/概念',
    isFree: true,
    nsfwSupport: true,
    description: '专为魔幻游戏场景、精灵、巨龙与史诗壁纸量身定制。',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80'
  },
  {
    id: '@cf/prompthero/openjourney',
    name: 'OpenJourney (Midjourney风) [免费]',
    author: 'PromptHero',
    category: 'MJ质感',
    isFree: true,
    nsfwSupport: true,
    description: '复刻 Midjourney v4 精美质感，具有独特的高光与色彩表现。',
    cover: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80'
  },
  {
    id: '@cf/cyberrealism-v2',
    name: 'CyberRealism 赛博写实 [免费]',
    author: 'CyberDev',
    category: '真实/人像',
    isFree: true,
    nsfwSupport: true,
    description: '超真实皮肤纹理与写实光照，专攻时尚杂志大片。',
    cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
  },
  {
    id: '@cf/anything-v5',
    name: 'Anything V5 (极致二次元) [免费]',
    author: 'AnimeDev',
    category: '二次元/动漫',
    isFree: true,
    nsfwSupport: true,
    description: '经典动漫插画与轻小说插图风格，线条细腻灵动。',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80'
  },
  {
    id: '@cf/meinamix-v11',
    name: 'MeinaMix V11 (韩系唯美) [免费]',
    author: 'Meina',
    category: '二次元/动漫',
    isFree: true,
    nsfwSupport: true,
    description: '韩系唯美插画与全彩漫风，画面精美度极高。',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80'
  },
  {
    id: '@cf/chinese-poster-ink',
    name: '国风水墨海报专版 [免费]',
    author: 'Fox Ink',
    category: '国风海报',
    isFree: true,
    nsfwSupport: false,
    description: '融合传统国画水墨与现代广告海报构图，极具东方美学。',
    cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&q=80'
  }
];

export const COMPUTE_ENGINES = [
  { id: 'cf_workers_ai', name: 'Cloudflare Workers AI [免费算力]', isFree: true },
  { id: 'pollinations_ai', name: 'Pollinations FLUX AI [免费算力]', isFree: true },
  { id: 'fal_ai', name: 'Fal.ai 高清云引擎 [需Key]', isFree: false },
  { id: 'replicate', name: 'Replicate 云算力 [需Key]', isFree: false }
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
  { id: 'fox-orange', name: '狐狸经典橙', hex: '#f97316' },
  { id: 'emerald', name: '翡翠绿', hex: '#10b981' },
  { id: 'violet', name: '高雅紫', hex: '#8b5cf6' },
  { id: 'rose', name: '玫瑰红', hex: '#f43f5e' },
  { id: 'sky', name: '天空蓝', hex: '#0ea5e9' },
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
    txt2img: '🎨 文生图',
    img2img: '🖼️ 图生图',
    models: '📦 模型库',
    translator: '💬 AI翻译/对话',
    history: '📜 历史记录',
    settings: '⚙️ 设置',
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
    txt2img: '🎨 Text-to-Image',
    img2img: '🖼️ Image-to-Image',
    models: '📦 Model Hub',
    translator: '💬 AI Assistant',
    history: '📜 History',
    settings: '⚙️ Settings',
    generate: '✨ Generate Image Now',
    generating: 'Generating, please wait...',
    promptLabel: '💡 Prompt',
    negPromptLabel: '🚫 Negative Prompt',
    sizeLabel: '📐 Dimensions',
    styleLabel: '🎨 Art Styles',
    langSelect: '🌐 Language / 语言切换'
  },
  ja: {
    appTitle: '白狐AI',
    subTitle: 'ミニマリスト AI 描画ワークベンチ',
    txt2img: '🎨 テキスト描画',
    img2img: '🖼️ 画像描画',
    models: '📦 モデルハブ',
    translator: '💬 AI アシスタント',
    history: '📜 履歴',
    settings: '⚙️ 設定',
    generate: '✨ 今すぐ描画開始',
    generating: '生成中、お待ちください...',
    promptLabel: '💡 プロンプト',
    negPromptLabel: '🚫 ネガティブプロンプト',
    sizeLabel: '📐 画像サイズ',
    styleLabel: '🎨 スタイルプリセット',
    langSelect: '🌐 言語切り替え / Language'
  },
  ko: {
    appTitle: '백호AI',
    subTitle: '미니멀 AI 그림 워크벤치',
    txt2img: '🎨 텍스트 그림',
    img2img: '🖼️ 이미지 그림',
    models: '📦 모델 허브',
    translator: '💬 AI 도우미',
    history: '📜 기록',
    settings: '⚙️ 설정',
    generate: '✨ 지금 생성하기',
    generating: '생성 중입니다...',
    promptLabel: '💡 프롬프트',
    negPromptLabel: '🚫 부작용 프롬프트',
    sizeLabel: '📐 크기 규격',
    styleLabel: '🎨 스타일 설정',
    langSelect: '🌐 언어 선택 / Language'
  },
  es: {
    appTitle: 'Zorro AI',
    subTitle: 'Plataforma de dibujo AI minimalista',
    txt2img: '🎨 Texto a Imagen',
    img2img: '🖼️ Imagen a Imagen',
    models: '📦 Galería de Modelos',
    translator: '💬 Asistente IA',
    history: '📜 Historial',
    settings: '⚙️ Ajustes',
    generate: '✨ Generar Imagen',
    generating: 'Generando, por favor espere...',
    promptLabel: '💡 Prompt Principal',
    negPromptLabel: '🚫 Prompt Negativo',
    sizeLabel: '📐 Dimensiones',
    styleLabel: '🎨 Estilos de Arte',
    langSelect: '🌐 Cambiar Idioma / Language'
  },
  fr: {
    appTitle: 'Renard AI',
    subTitle: 'Plateforme de dessin IA minimaliste',
    txt2img: '🎨 Texte en Image',
    img2img: '🖼️ Image en Image',
    models: '📦 Galerie de Modèles',
    translator: '💬 Assistant IA',
    history: '📜 Historique',
    settings: '⚙️ Paramètres',
    generate: '✨ Générer l\'image',
    generating: 'Génération en cours...',
    promptLabel: '💡 Prompt',
    negPromptLabel: '🚫 Prompt Négatif',
    sizeLabel: '📐 Dimensions',
    styleLabel: '🎨 Styles Artistiques',
    langSelect: '🌐 Langue / Language'
  }
};
