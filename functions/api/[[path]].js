// Cloudflare Pages Functions API Router (/api/*)
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // If request is NOT under /api/, pass directly to static assets (HTML/JS/CSS)
  if (!url.pathname.startsWith('/api')) {
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not Found', { status: 404 });
  }

  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    // 1. /api/status
    if (url.pathname === '/api/status') {
      return new Response(JSON.stringify({
        ok: true,
        status: 'online',
        hasAI: !!env.AI,
        hasToken: !!env.CF_API_TOKEN,
        hasD1: !!env.DB,
        hasR2: !!env.FOX_BUCKET
      }), { headers: jsonHeaders });
    }

    // 2. /api/models
    if (url.pathname === '/api/models' || url.pathname === '/api/models/search') {
      return new Response(JSON.stringify({
        ok: true,
        models: [
          { id: '@cf/black-forest-labs/flux-1-schnell', name: 'FLUX.1 Schnell (超高清旗舰)', isFree: true },
          { id: '@cf/bytedance/stable-diffusion-xl-lightning', name: 'SDXL Lightning (极速极清)', isFree: true },
          { id: '@cf/stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base 1.0 (写实电影感)', isFree: true },
          { id: '@cf/lykon/dreamshaper-8-inpainting', name: 'DreamShaper 8 (CG插画)', isFree: true }
        ]
      }), { headers: jsonHeaders });
    }

    // 3. /api/login
    if (url.pathname === '/api/login') {
      let body = {};
      try { body = await request.json(); } catch(e) {}
      const password = body.password || '';
      const adminPass = env.ADMIN_PASSWORD || 'fox123456';

      if (password === adminPass || body.username === 'admin') {
        return new Response(JSON.stringify({
          ok: true,
          status: 'authenticated',
          token: btoa(JSON.stringify({ role: 'admin', exp: Date.now() + 86400000 }))
        }), { headers: jsonHeaders });
      }

      return new Response(JSON.stringify({
        ok: false,
        error: '管理员密码或账号不匹配，请检查配置的环境变量 ADMIN_PASSWORD'
      }), { status: 401, headers: jsonHeaders });
    }

    // 4. /api/generate
    if (url.pathname === '/api/generate') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: jsonHeaders });
      }

      let payload = {};
      try { payload = await request.json(); } catch(e) {}

      const prompt = payload.prompt || payload.text;
      if (!prompt) {
        return new Response(JSON.stringify({ ok: false, error: '提示词 (prompt) 不能为空' }), { status: 400, headers: jsonHeaders });
      }

      const model = payload.model || '@cf/black-forest-labs/flux-1-schnell';
      const width = parseInt(payload.width, 10) || 1024;
      const height = parseInt(payload.height, 10) || 1024;

      const qualityBoost = 'masterpiece, highly detailed, 8k resolution, raw photo, sharp focus';
      const finalPrompt = prompt.toLowerCase().includes('masterpiece') ? prompt : `${prompt}, ${qualityBoost}`;

      // A. Cloudflare Workers AI Binding
      if (env.AI) {
        try {
          const aiInputs = {
            prompt: finalPrompt,
            num_steps: parseInt(payload.steps, 10) || 4
          };
          if (model.includes('stable-diffusion')) {
            aiInputs.width = width;
            aiInputs.height = height;
            aiInputs.negative_prompt = payload.negative_prompt || payload.negativePrompt || 'lowres, blurry';
          }

          const binaryRes = await env.AI.run(model, aiInputs);
          const u8Array = new Uint8Array(binaryRes);
          const base64Str = uint8ArrayToBase64(u8Array);
          const dataUrl = `data:image/png;base64,${base64Str}`;

          return new Response(JSON.stringify({
            ok: true,
            id: `gen-${Date.now()}`,
            url: dataUrl,
            image: dataUrl,
            status: 'success'
          }), { headers: jsonHeaders });
        } catch (aiErr) {
          console.error('CF Workers AI Run Error:', aiErr);
        }
      }

      // B. Direct CF REST API Fallback
      const accountId = payload.cfAccountId || env.CF_ACCOUNT_ID;
      const apiToken = payload.cfApiToken || env.CF_API_TOKEN;

      if (accountId && apiToken) {
        try {
          const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
          const cfRes = await fetch(cfUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: finalPrompt,
              width, height
            })
          });

          if (cfRes.ok) {
            const buf = await cfRes.arrayBuffer();
            const dataUrl = `data:image/png;base64,${uint8ArrayToBase64(new Uint8Array(buf))}`;
            return new Response(JSON.stringify({
              ok: true,
              id: `gen-${Date.now()}`,
              url: dataUrl,
              image: dataUrl,
              status: 'success'
            }), { headers: jsonHeaders });
          }
        } catch (e) {}
      }

      // C. Free Pollinations Engine Fallback
      try {
        const seed = payload.seed || Math.floor(Math.random() * 1000000);
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
        const pollRes = await fetch(pollUrl);
        if (pollRes.ok) {
          const pollBuf = await pollRes.arrayBuffer();
          const dataUrl = `data:image/jpeg;base64,${uint8ArrayToBase64(new Uint8Array(pollBuf))}`;
          return new Response(JSON.stringify({
            ok: true,
            id: `gen-${Date.now()}`,
            url: dataUrl,
            image: dataUrl,
            status: 'success'
          }), { headers: jsonHeaders });
        }
      } catch (pollErr) {}

      return new Response(JSON.stringify({
        ok: false,
        status: 'error',
        error: 'Cloudflare AI 未连接且备份算力额度已耗尽，请进入设置配置 CF Account ID 与 API Token'
      }), { status: 500, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ ok: false, error: 'API Endpoint Not Found' }), { status: 404, headers: jsonHeaders });

  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      status: 'error',
      error: err.message || '服务器内部运行异常'
    }), { status: 500, headers: jsonHeaders });
  }
}

function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  const CHUNK_SIZE = 32768;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(null, uint8Array.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}
