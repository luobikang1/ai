export const PRESET_MODELS = [
  {
    id: '@cf/bytedance/stable-diffusion-xl-lightning',
    name: 'SDXL Lightning (极速极清)',
    author: 'ByteDance',
    category: '二次元/动漫',
    isFree: true,
    nsfwSupport: true,
    description: '字节跳动极速高精细节算力，毫秒级出图，完美支持二次元与国风海报。',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80'
  },
  {
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    name: 'SDXL Base 1.0 (真实电影感)',
    author: 'Stability AI',
    category: '真实/人像',
    isFree: true,
    nsfwSupport: true,
    description: '官方SDXL旗舰模型，高精细真实构图、真实质感人像与风光大片。',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80'
  },
  {
    id: '@cf/lykon/dreamshaper-8-inpainting',
    name: 'DreamShaper 8 (全能艺术CG)',
    author: 'Lykon',
    category: '插画/CG',
    isFree: true,
    nsfwSupport: true,
    description: '万能二次元插画与游戏3D CG模型，色彩鲜艳细节丰富。',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'
  },
  {
    id: '@cf/runwayml/stable-diffusion-v1-5-inpainting',
    name: 'SD v1.5 Inpainting (局部重绘与修复)',
    author: 'RunwayML',
    category: '图生图',
    isFree: true,
    nsfwSupport: false,
    description: '经典 SD1.5 架构，支持图生图局部修补与细节增强。',
    cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&q=80'
  },
  {
    id: 'fal-ai/fast-sdxl',
    name: 'Fal.ai Fast SDXL (高画质外接)',
    author: 'Fal.ai',
    category: '全能旗舰',
    isFree: true,
    nsfwSupport: true,
    description: '支持千万级外接高速算力，完美生成高质量海报与艺术壁纸。',
    cover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80'
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Fox Prompt Enhancer (智能扩展)',
    author: 'Fox AI Core',
    category: 'AI翻译/对话',
    isFree: true,
    nsfwSupport: false,
    description: '专门用于中英文提示词双向互译与 Prompt 智能爆款增强。',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'
  },
  {
    id: '@cf/dusty-nv/stablediffusion-fantasy',
    name: 'Fantasy Realm 奇幻史诗',
    author: 'Community',
    category: '奇幻/概念',
    isFree: true,
    nsfwSupport: true,
    description: '专为魔幻游戏场景、精灵、巨龙与史诗壁纸量身定制。',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80'
  },
  {
    id: '@cf/prompthero/openjourney',
    name: 'OpenJourney (Midjourney 风格)',
    author: 'PromptHero',
    category: 'MJ质感',
    isFree: true,
    nsfwSupport: true,
    description: '复刻 Midjourney v4 精美质感，具有独特的高光与色彩表现。',
    cover: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80'
  },
  {
    id: '@cf/cyberrealism-v2',
    name: 'CyberRealism 赛博写实',
    author: 'CyberDev',
    category: '真实/人像',
    isFree: true,
    nsfwSupport: true,
    description: '超真实皮肤纹理与写实光照，专攻时尚杂志大片。',
    cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
  },
  {
    id: '@cf/anything-v5',
    name: 'Anything V5 (极致二次元)',
    author: 'AnimeDev',
    category: '二次元/动漫',
    isFree: true,
    nsfwSupport: true,
    description: '经典动漫插画与轻小说插图风格，线条细腻灵动。',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80'
  },
  {
    id: '@cf/meinamix-v11',
    name: 'MeinaMix V11 (韩系唯美)',
    author: 'Meina',
    category: '二次元/动漫',
    isFree: true,
    nsfwSupport: true,
    description: '韩系唯美插画与全彩漫风，画面精美度极高。',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80'
  },
  {
    id: '@cf/chinese-poster-ink',
    name: '国风水墨海报专版',
    author: 'Fox Ink',
    category: '国风海报',
    isFree: true,
    nsfwSupport: false,
    description: '融合传统国画水墨与现代广告海报构图，极具东方美学。',
    cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&q=80'
  }
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
  'worst quality, low quality, illustration, 3d, 2d, painting, cartoons, sketch (写实专用排负)'
];

export const THEME_COLORS = [
  { id: 'fox-orange', name: '活力狐橙', primary: '#f97316' },
  { id: 'emerald', name: '翡翠墨绿', primary: '#10b981' },
  { id: 'violet', name: '高雅紫罗兰', primary: '#8b5cf6' },
  { id: 'rose', name: '玫瑰绯红', primary: '#f43f5e' },
  { id: 'sky', name: '蔚蓝天空', primary: '#0ea5e9' }
];

export const I18N_STRINGS = {
  zh: {
    appTitle: '狐AI',
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
    customSize: '自定义图像尺寸 (宽 × 高)'
  },
  en: {
    appTitle: 'Fox AI',
    subTitle: 'Minimalist AI Drawing Workbench',
    txt2img: '🎨 Text-to-Image',
    img2img: '🖼️ Image-to-Image',
    models: '📦 Model Hub',
    translator: '💬 AI Translate',
    history: '📜 History',
    settings: '⚙️ Settings',
    generate: '✨ Generate Image Now',
    generating: 'Generating, please wait...',
    promptLabel: '💡 Prompt',
    negPromptLabel: '🚫 Negative Prompt',
    sizeLabel: '📐 Dimensions',
    styleLabel: '🎨 Art Styles',
    customSize: 'Custom Size (Width × Height)'
  }
};
