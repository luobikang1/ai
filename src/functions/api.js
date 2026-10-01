export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Health & Status Indicator Endpoints
    if (url.pathname === '/api/status') {
      return handleStatus(request, env);
    }

    // Auth & User System
    if (url.pathname === '/api/login') {
      return handleLogin(request, env);
    }
    if (url.pathname === '/api/register') {
      return handleRegister(request, env);
    }
    if (url.pathname === '/api/change-password') {
      return handleChangePassword(request, env);
    }

    // Generation & AI
    if (url.pathname === '/api/generate') {
      return handleGenerate(request, env);
    }
    if (url.pathname === '/api/translate') {
      return handleTranslate(request, env);
    }
    if (url.pathname === '/api/chat') {
      return handleChat(request, env);
    }

    // R2 Storage Management Endpoints
    if (url.pathname === '/api/r2/list') {
      return handleR2List(request, env);
    }
    if (url.pathname === '/api/r2/upload') {
      return handleR2Upload(request, env);
    }
    if (url.pathname === '/api/r2/delete') {
      return handleR2Delete(request, env);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};

function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  const CHUNK_SIZE = 32768;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(null, uint8Array.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

function parseBase64DataUrl(dataUrl) {
  try {
    const parts = dataUrl.split(',');
    const base64Str = parts.length > 1 ? parts[1] : parts[0];
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    return new Uint8Array(0);
  }
}

async function handleStatus(request, env) {
  const status = {
    cfApi: !!(env.AI || env.CF_API_TOKEN),
    d1Database: !!env.DB,
    r2Bucket: !!env.FOX_BUCKET
  };
  return new Response(JSON.stringify(status), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleLogin(request, env) {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const { username, password } = await request.json();
    const adminUser = env.ADMIN_USERNAME || 'admin';
    const adminPass = env.ADMIN_PASSWORD || 'fox123456';

    if (username === adminUser && password === adminPass) {
      const token = btoa(JSON.stringify({ username, role: 'admin', exp: Date.now() + 86400000 }));
      return new Response(JSON.stringify({ success: true, token, username, role: 'admin' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (env.DB) {
      const stmt = env.DB.prepare('SELECT * FROM users WHERE email = ? OR username = ?');
      const user = await stmt.bind(username, username).first();
      if (user && user.password === password) {
        const token = btoa(JSON.stringify({ username: user.username, exp: Date.now() + 86400000 }));
        return new Response(JSON.stringify({ success: true, token, username: user.username, role: 'user' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ success: false, message: '账号或密码错误' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: '登录处理异常' }), { status: 400 });
  }
}

async function handleRegister(request, env) {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const { email, username, password } = await request.json();
    if (!email || !username || !password) {
      return new Response(JSON.stringify({ success: false, message: '请填写完整的邮箱、用户名与密码' }), { status: 400 });
    }

    if (env.DB) {
      try {
        await env.DB.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, username TEXT UNIQUE, password TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
        const stmt = env.DB.prepare('INSERT INTO users (email, username, password) VALUES (?, ?, ?)');
        await stmt.bind(email, username, password).run();
      } catch (e) {
        return new Response(JSON.stringify({ success: false, message: '邮箱或用户名已被占用' }), { status: 400 });
      }
    }

    const token = btoa(JSON.stringify({ username, email, exp: Date.now() + 86400000 }));
    return new Response(JSON.stringify({ success: true, token, username }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: '注册失败' }), { status: 500 });
  }
}

async function handleChangePassword(request, env) {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const { username, newPassword } = await request.json();
    if (env.DB) {
      const stmt = env.DB.prepare('UPDATE users SET password = ? WHERE username = ?');
      await stmt.bind(newPassword, username).run();
    }
    return new Response(JSON.stringify({ success: true, message: '密码更新成功' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: '密码修改失败' }), { status: 500 });
  }
}

async function handleGenerate(request, env) {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const body = await request.json();
    const { model, prompt, negativePrompt, width, height, image, cfAccountId, cfApiToken } = body;

    const accountId = cfAccountId || env.CF_ACCOUNT_ID;
    const apiToken = cfApiToken || env.CF_API_TOKEN;

    if (env.AI && model.startsWith('@cf/')) {
      const inputs = {
        prompt: prompt,
        negative_prompt: negativePrompt || 'low quality, blurry',
        width: width || 1024,
        height: height || 1024,
        num_steps: 20
      };
      if (image) inputs.image = Array.from(parseBase64DataUrl(image));

      const binaryRes = await env.AI.run(model, inputs);
      const u8Array = new Uint8Array(binaryRes);
      const base64Str = uint8ArrayToBase64(u8Array);
      return new Response(JSON.stringify({ image: `data:image/png;base64,${base64Str}` }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (accountId && apiToken && model.startsWith('@cf/')) {
      const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
      const payload = {
        prompt: prompt,
        negative_prompt: negativePrompt,
        width: width || 1024,
        height: height || 1024
      };
      if (image) payload.image = Array.from(parseBase64DataUrl(image));

      const cfRes = await fetch(cfUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!cfRes.ok) throw new Error(`Cloudflare AI API Error: ${cfRes.statusText}`);
      const imageBlob = await cfRes.arrayBuffer();
      const u8Array = new Uint8Array(imageBlob);
      const base64Str = uint8ArrayToBase64(u8Array);
      return new Response(JSON.stringify({ image: `data:image/png;base64,${base64Str}` }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const svgDataUri = generatePlaceholderSvg(prompt, width, height);
    return new Response(JSON.stringify({ image: svgDataUri }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message || '生成图片失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleTranslate(request, env) {
  try {
    const { text } = await request.json();
    if (env.AI) {
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are an AI prompt translator. Translate Chinese to detailed English prompt.' },
          { role: 'user', content: text }
        ]
      });
      return new Response(JSON.stringify({ translatedText: response.response.trim() }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ translatedText: `${text}, highly detailed, 8k resolution, masterpiece, cinematic lighting` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ translatedText: text }), { status: 200 });
  }
}

async function handleChat(request, env) {
  try {
    const { messages } = await request.json();
    if (env.AI) {
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages });
      return new Response(JSON.stringify({ response: response.response }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const lastMsg = messages[messages.length - 1]?.text || '';
    return new Response(JSON.stringify({ response: `[狐AI 提示词建议]: "masterpiece, ${lastMsg}, 8k resolution, cinematic lighting"` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ response: '对话服务响应异常' }), { status: 500 });
  }
}

async function handleR2List(request, env) {
  if (!env.FOX_BUCKET) {
    return new Response(JSON.stringify({ bound: false, objects: [], totalSizeMB: '0.00', remainingSpaceMB: '10240.00' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const listed = await env.FOX_BUCKET.list();
  let totalSize = 0;
  const objects = listed.objects.map(obj => {
    totalSize += obj.size;
    return {
      key: obj.key,
      size: obj.size,
      formattedSize: (obj.size / 1024 / 1024).toFixed(2) + ' MB',
      uploaded: obj.uploaded
    };
  });
  const remainingSpaceMB = Math.max(0, (10 * 1024) - (totalSize / 1024 / 1024)).toFixed(2);

  return new Response(JSON.stringify({
    bound: true,
    objects,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    remainingSpaceMB
  }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleR2Upload(request, env) {
  if (!env.FOX_BUCKET) {
    return new Response(JSON.stringify({ message: '未绑定 R2 存储桶' }), { status: 400 });
  }
  try {
    const { key, dataUrl } = await request.json();
    const bytes = parseBase64DataUrl(dataUrl);
    await env.FOX_BUCKET.put(key, bytes, {
      httpMetadata: { contentType: 'image/png' }
    });
    return new Response(JSON.stringify({ success: true, key }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: '上传到 R2 失败' }), { status: 500 });
  }
}

async function handleR2Delete(request, env) {
  if (!env.FOX_BUCKET) {
    return new Response(JSON.stringify({ message: '未绑定 R2 存储桶' }), { status: 400 });
  }
  try {
    const { key } = await request.json();
    await env.FOX_BUCKET.delete(key);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: '删除失败' }), { status: 500 });
  }
}

function generatePlaceholderSvg(prompt, w = 1024, h = 1024) {
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
