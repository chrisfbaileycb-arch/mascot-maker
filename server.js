const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const IS_DEV = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const DIST_DIR = path.join(__dirname, 'dist');
const ROOT_DIR = !IS_DEV && fs.existsSync(DIST_DIR) ? DIST_DIR : __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.txt': 'text/plain; charset=utf-8',
};

let genaiModulePromise = null;
function getGenAIModule() {
  if (!genaiModulePromise) {
    genaiModulePromise = import('@google/genai');
  }
  return genaiModulePromise;
}

async function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  const { GoogleGenAI, Type } = await getGenAIModule();
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return { ai, Type };
}

function readJsonBody(req, maxBytes = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString('utf8');
      if (body.length > maxBytes) {
        reject(new Error('Request payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

async function handleApiRequest(req, res, pathname) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const { ai, Type } = await createGeminiClient();

    // 1. AI Fur Pattern & Skin Overlay Image Generator (gemini-3.1-flash-lite-image)
    if (pathname === '/api/gemini/generate-fur-texture') {
      const userPrompt = String(body.prompt || '').trim();
      if (!userPrompt) {
        sendJson(res, 400, { error: 'Prompt is required to generate a fur pattern texture.' });
        return;
      }

      const texturePrompt =
        `Seamless tileable 2D surface pattern texture for a 3D plush character fur coat and skin overlay: "${userPrompt}". ` +
        `Flat even studio lighting, edge-to-edge pattern fill, rich tactile color contrast, no 3D sphere, no character eyes or face, no text, no frame border.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: texturePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      let imageUrl = null;
      let textNote = '';

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textNote += part.text;
        }
      }

      if (!imageUrl) {
        sendJson(res, 502, {
          error: 'The image model did not return an image part for this prompt.',
          textNote,
        });
        return;
      }

      sendJson(res, 200, {
        imageUrl,
        prompt: userPrompt,
        model: 'gemini-3.1-flash-lite-image',
        textNote,
      });
      return;
    }

    // 2. Text Prompt to Base Mascot Shape (gemini-3.8-flash)
    if (pathname === '/api/gemini/base-shape') {
      const userPrompt = String(body.prompt || '').trim();
      if (!userPrompt) {
        sendJson(res, 400, { error: 'Prompt is required.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents:
          `Design an original, non-copyrighted 3D furry mascot base character configuration for this description: "${userPrompt}".\n` +
          `Map the description to our parametric 3D GPU fur mascot architecture:\n` +
          `- earStyle must be one of: "round", "bear", "bunny", "puppy", "cat", "bird_crest", "gnome_hat", "owl_tufts"\n` +
          `- muzzleStyle must be one of: "button", "snout", "beak", "gnome"\n` +
          `- accessory must be one of: "none", "antennae", "gnome_hat", "rooster_crest", "halo", "cloud_crown", "bowtie", "cottontail"\n` +
          `- bodyRoundness in [0.68, 1.48]\n` +
          `- earSize in [0.35, 1.85]\n` +
          `- snoutLength in [0.0, 1.35]\n` +
          `- headToBodyRatio in [0.74, 1.36]\n` +
          `- eyeScale in [0.82, 1.32]\n` +
          `- Provide vibrant hex colors (#RRGGBB) for baseColor, tipColor, eyeColor, cheekColor, hatColor, beakColor.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              archetype: { type: Type.STRING },
              summary: { type: Type.STRING },
              earStyle: { type: Type.STRING },
              muzzleStyle: { type: Type.STRING },
              accessory: { type: Type.STRING },
              bodyRoundness: { type: Type.NUMBER },
              earSize: { type: Type.NUMBER },
              snoutLength: { type: Type.NUMBER },
              headToBodyRatio: { type: Type.NUMBER },
              eyeScale: { type: Type.NUMBER },
              baseColor: { type: Type.STRING },
              tipColor: { type: Type.STRING },
              eyeColor: { type: Type.STRING },
              cheekColor: { type: Type.STRING },
              hatColor: { type: Type.STRING },
              beakColor: { type: Type.STRING },
              furLength: { type: Type.NUMBER },
              curliness: { type: Type.NUMBER },
              clumping: { type: Type.NUMBER },
            },
            required: [
              'name',
              'archetype',
              'summary',
              'earStyle',
              'muzzleStyle',
              'accessory',
              'bodyRoundness',
              'earSize',
              'snoutLength',
              'headToBodyRatio',
              'baseColor',
              'tipColor',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      sendJson(res, 200, parsed);
      return;
    }

    // 3. Multimodal Image Reference Analyzer for Base Mascot (gemini-3.8-flash)
    if (pathname === '/api/gemini/analyze-image') {
      const base64Data = String(body.base64Data || '').trim();
      const mimeType = String(body.mimeType || 'image/png').trim();
      if (!base64Data) {
        sendJson(res, 400, { error: 'Image base64Data is required.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text:
                'Analyze this reference image for its overall shape, proportions, ear/head style, muzzle/beak shape, and dominant color palette. ' +
                'Propose an original, non-copyrighted 3D furry mascot base configuration that matches its silhouette and colors.\n' +
                'earStyle options: "round", "bear", "bunny", "puppy", "cat", "bird_crest", "gnome_hat", "owl_tufts".\n' +
                'muzzleStyle options: "button", "snout", "beak", "gnome".\n' +
                'accessory options: "none", "antennae", "gnome_hat", "rooster_crest", "halo", "cloud_crown", "bowtie", "cottontail".',
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              archetype: { type: Type.STRING },
              summary: { type: Type.STRING },
              interpretedShapeNotes: { type: Type.STRING },
              earStyle: { type: Type.STRING },
              muzzleStyle: { type: Type.STRING },
              accessory: { type: Type.STRING },
              bodyRoundness: { type: Type.NUMBER },
              earSize: { type: Type.NUMBER },
              snoutLength: { type: Type.NUMBER },
              headToBodyRatio: { type: Type.NUMBER },
              eyeScale: { type: Type.NUMBER },
              baseColor: { type: Type.STRING },
              tipColor: { type: Type.STRING },
              eyeColor: { type: Type.STRING },
              cheekColor: { type: Type.STRING },
              hatColor: { type: Type.STRING },
              beakColor: { type: Type.STRING },
            },
            required: [
              'name',
              'archetype',
              'summary',
              'earStyle',
              'muzzleStyle',
              'accessory',
              'bodyRoundness',
              'earSize',
              'snoutLength',
              'headToBodyRatio',
              'baseColor',
              'tipColor',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      sendJson(res, 200, parsed);
      return;
    }

    sendJson(res, 404, { error: `Unknown API endpoint: ${pathname}` });
  } catch (err) {
    console.error('Gemini API route error:', err);
    sendJson(res, 500, {
      error: err && err.message ? err.message : 'Server-side Gemini API request failed',
    });
  }
}

async function startServer() {
  let vite = null;
  if (IS_DEV) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa',
    });
  }

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      let pathname = decodeURIComponent(parsedUrl.pathname);

      if (pathname === '/healthz' || pathname === '/_ah/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('OK');
        return;
      }

      if (pathname.startsWith('/api/gemini/')) {
        await handleApiRequest(req, res, pathname);
        return;
      }

      if (vite) {
        vite.middlewares(req, res, () => {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not Found');
        });
        return;
      }

      if (pathname === '/') {
        pathname = '/index.html';
      }

      const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
      let filePath = path.join(ROOT_DIR, safePath);

      if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        const fallbackPath = path.join(ROOT_DIR, 'index.html');
        if (fs.existsSync(fallbackPath)) {
          filePath = fallbackPath;
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not Found');
          return;
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      });

      const stream = fs.createReadStream(filePath);
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        res.end('Internal Server Error');
      });
      stream.pipe(res);
    } catch (err) {
      console.error('Request error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('Internal Server Error');
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(
      `Server listening on http://${HOST}:${PORT} (${IS_DEV ? 'Vite Dev + Gemini API' : `serving ${ROOT_DIR}`})`
    );
  });
}

startServer();

