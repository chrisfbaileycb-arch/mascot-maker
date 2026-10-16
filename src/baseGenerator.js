/**
 * Built-in curated quick-prompt examples so users can test diverse non-Mr.-M base shapes in 1 click
 * or type any custom description.
 */
export const BASE_PROMPT_EXAMPLES = [
  {
    label: '🐻 Small Round Bear',
    prompt: 'small round bear with cozy honey-brown fur, wide round ears, and warm snout'
  },
  {
    label: '🧙‍♂️ Gnome + Pointed Hat',
    prompt: 'woodland gnome with pointed red hat, fluffy beard tuft, round belly, and mossy coat'
  },
  {
    label: '🐓 Rooster-Like Bird',
    prompt: 'rooster-like bird with big eyes, golden beak, crimson feathered crest, and soft warm plumage'
  },
  {
    label: '🐰 Long-Eared Rabbit',
    prompt: 'long-eared rabbit with tall upright ears, snowy cream and peach fur, and fluffy cottontail'
  },
  {
    label: '🦊 Woodland Fox Kit',
    prompt: 'perky woodland fox with pointed ears, longer snout, russet orange fur and cream tips'
  },
  {
    label: '🦉 Big-Eyed Baby Owl',
    prompt: 'plump baby owl with huge golden eyes, feathered ear tufts, short beak, and speckled cocoa fur'
  }
];

const COLOR_DICTIONARY = [
  { words: ['honey', 'caramel', 'teddy', 'tan', 'fawn', 'peanut'], base: '#7c4722', tip: '#eab676', cheek: '#f48c72' },
  { words: ['brown', 'cocoa', 'chocolate', 'chestnut', 'grizzly', 'umber', 'walnut'], base: '#4a2816', tip: '#a3663e', cheek: '#e07a5f' },
  { words: ['red', 'crimson', 'scarlet', 'ruby', 'cherry', 'berry'], base: '#991b1b', tip: '#fca5a5', cheek: '#fb7185' },
  { words: ['orange', 'russet', 'ginger', 'copper', 'tangerine', 'fox', 'rooster'], base: '#b44114', tip: '#fdba74', cheek: '#fb7185' },
  { words: ['yellow', 'gold', 'golden', 'sunny', 'lemon', 'chick', 'canary', 'amber'], base: '#b4690e', tip: '#fde047', cheek: '#fb7185' },
  { words: ['green', 'moss', 'forest', 'olive', 'sage', 'sprout', 'frog'], base: '#1e5631', tip: '#a3e635', cheek: '#fb7185' },
  { words: ['mint', 'teal', 'turquoise', 'aqua', 'seafoam'], base: '#0f766e', tip: '#67e8f9', cheek: '#f472b6' },
  { words: ['blue', 'sky', 'azure', 'cobalt', 'sapphire', 'ice', 'frost'], base: '#1d4ed8', tip: '#93c5fd', cheek: '#f472b6' },
  { words: ['white', 'snow', 'snowy', 'cream', 'ivory', 'milk', 'cloud', 'polar', 'lamb'], base: '#94a3b8', tip: '#fffbeb', cheek: '#fda4af' },
  { words: ['pink', 'rose', 'blush', 'peach', 'coral', 'strawberry', 'Sakura'], base: '#be185d', tip: '#fbcfe8', cheek: '#fb7185' },
  { words: ['purple', 'violet', 'lavender', 'plum', 'lilac', 'grape'], base: '#4f35ff', tip: '#f5d0fe', cheek: '#ff5c8a' },
  { words: ['black', 'charcoal', 'midnight', 'shadow', 'obsidian', 'soot', 'panda'], base: '#1e293b', tip: '#64748b', cheek: '#fb7185' },
  { words: ['gray', 'grey', 'silver', 'ash', 'slate', 'koala'], base: '#475569', tip: '#cbd5e1', cheek: '#f472b6' }
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToHex(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return rgbToHex(r * 255, g * 255, b * 255);
}

/**
 * Deterministic semantic interpreter that converts any short text description into
 * an original soft 3D base mascot configuration compatible with the GPU fur & morph system.
 */
export function buildProceduralBaseFromPrompt(rawPrompt = '') {
  const text = String(rawPrompt || 'small round bear').trim();
  const lower = text.toLowerCase();

  // Default balanced base
  let name = 'Barnaby Bear';
  let archetype = 'Cozy Bear Cub';
  let earStyle = 'bear';
  let muzzleStyle = 'snout';
  let accessory = 'none';
  let bodyRoundness = 1.15;
  let earSize = 1.05;
  let snoutLength = 0.45;
  let headToBodyRatio = 1.02;
  let eyeScale = 1.04;
  let baseColor = '#6b3e26';
  let tipColor = '#eab676';
  let eyeColor = '#2d1a12';
  let cheekColor = '#f48c72';
  let hatColor = '#dc2626';
  let beakColor = '#f59e0b';
  let furLength = 0.34;
  let furDensity = 0.88;
  let curliness = 0.28;
  let clumping = 0.42;
  let roughness = 0.68;
  let specular = 0.32;

  // 1. Detect primary archetype / species
  if (/(gnome|wizard|elf|dwarf|mage|goblin)/.test(lower)) {
    name = 'Pip Gnome';
    archetype = 'Woodland Gnome';
    earStyle = 'gnome_hat';
    muzzleStyle = 'gnome';
    accessory = 'gnome_hat';
    bodyRoundness = 1.24;
    earSize = 1.18;
    snoutLength = 0.38;
    headToBodyRatio = 1.14;
    eyeScale = 1.02;
    baseColor = '#285430';
    tipColor = '#a4be7b';
    eyeColor = '#1e3a8a';
    cheekColor = '#fb7185';
    hatColor = '#dc2626';
    furLength = 0.36;
    curliness = 0.38;
  } else if (/(rooster|chicken|hen|chick|bird|parrot|robin|canary|sparrow|duck|penguin)/.test(lower)) {
    const isRooster = /(rooster|cockerel|comb|crest)/.test(lower);
    name = isRooster ? 'Sunny Rooster' : 'Puff Bird';
    archetype = isRooster ? 'Feathered Rooster Mascot' : 'Plump Songbird Mascot';
    earStyle = 'bird_crest';
    muzzleStyle = 'beak';
    accessory = isRooster ? 'rooster_crest' : 'none';
    bodyRoundness = 1.18;
    earSize = isRooster ? 1.25 : 0.85;
    snoutLength = 0.42;
    headToBodyRatio = 0.92;
    eyeScale = 1.22;
    baseColor = isRooster ? '#b44114' : '#d97706';
    tipColor = '#fde047';
    eyeColor = '#1e293b';
    cheekColor = '#fb7185';
    beakColor = '#f59e0b';
    furLength = 0.38;
    clumping = 0.55;
    curliness = 0.18;
  } else if (/(owl|owlet)/.test(lower)) {
    name = 'Hootie Owl';
    archetype = 'Big-Eyed Plump Owl';
    earStyle = 'owl_tufts';
    muzzleStyle = 'beak';
    accessory = 'none';
    bodyRoundness = 1.26;
    earSize = 1.15;
    snoutLength = 0.18;
    headToBodyRatio = 1.18;
    eyeScale = 1.32;
    baseColor = '#5c4033';
    tipColor = '#e6ccb2';
    eyeColor = '#d97706';
    cheekColor = '#fda4af';
    beakColor = '#f59e0b';
    furLength = 0.36;
    clumping = 0.52;
  } else if (/(rabbit|bunny|hare|lop)/.test(lower)) {
    const isFloppy = /(floppy|lop|droopy)/.test(lower);
    name = 'Clover Bunny';
    archetype = isFloppy ? 'Floppy-Eared Lop Rabbit' : 'Long-Eared Plush Rabbit';
    earStyle = isFloppy ? 'puppy' : 'bunny';
    muzzleStyle = 'button';
    accessory = 'cottontail';
    bodyRoundness = 1.08;
    earSize = 1.55;
    snoutLength = 0.32;
    headToBodyRatio = 0.96;
    eyeScale = 1.12;
    baseColor = '#cbd5e1';
    tipColor = '#fff7ed';
    eyeColor = '#be185d';
    cheekColor = '#fda4af';
    furLength = 0.34;
    curliness = 0.22;
  } else if (/(fox|vulpine|fennec|coyote|wolf)/.test(lower)) {
    name = 'Rusty Fox';
    archetype = 'Perky Woodland Fox';
    earStyle = 'cat';
    muzzleStyle = 'snout';
    accessory = 'cottontail';
    bodyRoundness = 0.92;
    earSize = 1.42;
    snoutLength = 0.72;
    headToBodyRatio = 1.06;
    eyeScale = 1.08;
    baseColor = '#c2410c';
    tipColor = '#ffedd5';
    eyeColor = '#b45309';
    cheekColor = '#fb7185';
    furLength = 0.38;
    clumping = 0.48;
  } else if (/(cat|kitten|kitty|feline|lynx|tiger|lion)/.test(lower)) {
    name = 'Miso Kitty';
    archetype = 'Plush Whiskered Cat';
    earStyle = 'cat';
    muzzleStyle = 'button';
    accessory = 'none';
    bodyRoundness = 1.04;
    earSize = 1.22;
    snoutLength = 0.28;
    headToBodyRatio = 1.12;
    eyeScale = 1.16;
    baseColor = '#ea580c';
    tipColor = '#fed7aa';
    eyeColor = '#15803d';
    cheekColor = '#fb7185';
  } else if (/(dog|puppy|pup|hound|corgi|shiba|retriever)/.test(lower)) {
    name = 'Biscuit Pup';
    archetype = 'Floppy-Eared Puppy';
    earStyle = 'puppy';
    muzzleStyle = 'snout';
    accessory = 'amulet';
    bodyRoundness = 1.08;
    earSize = 1.28;
    snoutLength = 0.58;
    headToBodyRatio = 1.08;
    eyeScale = 1.1;
    baseColor = '#9a5b25';
    tipColor = '#fde68a';
    eyeColor = '#3e2723';
    cheekColor = '#fb7185';
  } else if (/(hamster|mouse|rat|gerbil|chinchilla|guinea|hedgehog|squirrel)/.test(lower)) {
    name = 'Mochi Hamster';
    archetype = 'Chubby Pocket Critter';
    earStyle = 'bear';
    muzzleStyle = 'button';
    accessory = 'none';
    bodyRoundness = 1.38;
    earSize = 0.88;
    snoutLength = 0.22;
    headToBodyRatio = 1.16;
    eyeScale = 1.18;
    baseColor = '#d97706';
    tipColor = '#fef3c7';
    eyeColor = '#1e1b4b';
    cheekColor = '#fb7185';
  } else if (/(sheep|lamb|alpaca|cloud|puff|mochi)/.test(lower)) {
    name = 'Cumulus Lamb';
    archetype = 'Curly Cloud Puff';
    earStyle = 'puppy';
    muzzleStyle = 'button';
    accessory = 'halo';
    bodyRoundness = 1.36;
    earSize = 0.92;
    snoutLength = 0.26;
    headToBodyRatio = 1.05;
    eyeScale = 1.1;
    baseColor = '#94a3b8';
    tipColor = '#ffffff';
    eyeColor = '#3b82f6';
    cheekColor = '#f472b6';
    furLength = 0.44;
    curliness = 0.85;
  } else if (/(bear|cub|panda|koala|grizzly|polar)/.test(lower)) {
    name = 'Barnaby Bear';
    archetype = 'Small Round Bear';
    earStyle = 'bear';
    muzzleStyle = 'snout';
    accessory = 'none';
    bodyRoundness = 1.26;
    earSize = 1.05;
    snoutLength = 0.48;
    headToBodyRatio = 1.06;
    eyeScale = 1.05;
    baseColor = '#6b3e26';
    tipColor = '#eab676';
    eyeColor = '#27170e';
    cheekColor = '#f48c72';
  }

  // 2. Apply explicit modifier keywords from prompt
  if (/(round|chubby|plump|fat|pudgy|roly|sphere|orb|ball)/.test(lower)) {
    bodyRoundness = clamp(bodyRoundness + 0.18, 0.7, 1.5);
  }
  if (/(slim|slender|tall|thin|lanky)/.test(lower)) {
    bodyRoundness = clamp(bodyRoundness - 0.25, 0.65, 1.45);
    headToBodyRatio = clamp(headToBodyRatio - 0.14, 0.72, 1.35);
  }
  if (/(small|tiny|little|baby|chibi|mini|compact)/.test(lower)) {
    headToBodyRatio = clamp(headToBodyRatio + 0.14, 0.75, 1.38);
    eyeScale = clamp(eyeScale + 0.1, 0.8, 1.35);
  }
  if (/(big eyes|large eyes|huge eyes|wide eyes)/.test(lower)) {
    eyeScale = clamp(eyeScale + 0.18, 0.85, 1.38);
  }
  if (/(long ear|tall ear|big ear|huge ear|long-eared)/.test(lower)) {
    earSize = clamp(earSize + 0.42, 0.5, 2.0);
  }
  if (/(short ear|small ear|tiny ear)/.test(lower)) {
    earSize = clamp(earSize - 0.35, 0.2, 1.8);
  }
  if (/(long snout|long nose|pointed snout|muzzle)/.test(lower)) {
    snoutLength = clamp(snoutLength + 0.35, 0.1, 1.4);
  }
  if (/(flat face|short snout|no snout)/.test(lower)) {
    snoutLength = 0.12;
  }
  if (/(pointed hat|wizard hat|gnome hat|cap)/.test(lower)) {
    accessory = 'gnome_hat';
    if (earStyle !== 'gnome_hat') earStyle = 'gnome_hat';
  }
  if (/(fluffy|shaggy|long fur|plush|soft fur)/.test(lower)) {
    furLength = clamp(furLength + 0.08, 0.18, 0.52);
    furDensity = clamp(furDensity + 0.08, 0.5, 1.0);
  }
  if (/(curly|woolly|fleece)/.test(lower)) {
    curliness = 0.82;
  }

  // 3. Apply explicit color matches from prompt
  const matchedColors = [];
  for (const entry of COLOR_DICTIONARY) {
    if (entry.words.some((w) => lower.includes(w))) {
      matchedColors.push(entry);
    }
  }
  if (matchedColors.length === 1) {
    baseColor = matchedColors[0].base;
    tipColor = matchedColors[0].tip;
    cheekColor = matchedColors[0].cheek;
    if (accessory === 'gnome_hat') hatColor = matchedColors[0].base;
  } else if (matchedColors.length >= 2) {
    baseColor = matchedColors[0].base;
    tipColor = matchedColors[1].tip;
    cheekColor = matchedColors[0].cheek;
  }

  const summary = `Interpreted "${text}" into an original ${archetype.toLowerCase()} silhouette (roundness ${(bodyRoundness * 100).toFixed(0)}%, ${earStyle.replace('_', ' ')} head plan, snout ${(snoutLength * 100).toFixed(0)}%) with ${baseColor} root and ${tipColor} tip fur.`;

  return {
    name,
    archetype,
    summary,
    earStyle,
    muzzleStyle,
    accessory,
    bodyRoundness: Number(bodyRoundness.toFixed(2)),
    earSize: Number(earSize.toFixed(2)),
    snoutLength: Number(snoutLength.toFixed(2)),
    headToBodyRatio: Number(headToBodyRatio.toFixed(2)),
    eyeScale: Number(eyeScale.toFixed(2)),
    baseColor,
    tipColor,
    eyeColor,
    cheekColor,
    hatColor,
    beakColor,
    furLength: Number(furLength.toFixed(2)),
    furDensity: Number(furDensity.toFixed(2)),
    curliness: Number(curliness.toFixed(2)),
    clumping: Number(clumping.toFixed(2)),
    roughness: Number(roughness.toFixed(2)),
    specular: Number(specular.toFixed(2))
  };
}

/**
 * Generates a new original base mascot configuration from a natural-language text description.
 * Calls the server-side Gemini endpoint (/api/gemini/base-shape) with procedural fallback.
 */
export async function generateBaseFromTextPrompt(promptText) {
  const cleanPrompt = String(promptText || '').trim();
  if (!cleanPrompt) {
    return buildProceduralBaseFromPrompt('small round bear');
  }

  const fallbackConfig = buildProceduralBaseFromPrompt(cleanPrompt);

  try {
    const res = await fetch('/api/gemini/base-shape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: cleanPrompt })
    });
    if (!res.ok) {
      return fallbackConfig;
    }
    const parsed = await res.json();
    return {
      ...fallbackConfig,
      ...parsed,
      bodyRoundness: clamp(Number(parsed.bodyRoundness) || fallbackConfig.bodyRoundness, 0.6, 1.5),
      earSize: clamp(Number(parsed.earSize) ?? fallbackConfig.earSize, 0.1, 2.0),
      snoutLength: clamp(Number(parsed.snoutLength) ?? fallbackConfig.snoutLength, 0.0, 1.4),
      headToBodyRatio: clamp(Number(parsed.headToBodyRatio) || fallbackConfig.headToBodyRatio, 0.7, 1.4),
      eyeScale: clamp(Number(parsed.eyeScale) || fallbackConfig.eyeScale, 0.8, 1.38)
    };
  } catch (err) {
    console.warn('Using procedural base architect fallback:', err);
    return fallbackConfig;
  }
}

/**
 * Extracts dominant color palette, silhouette aspect ratio, crown profile, and roundness
 * from an uploaded/pasted image using an offscreen HTML5 Canvas.
 */
export async function extractImageVisualFeatures(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      // Detect background color from corner pixels
      const corners = [
        [0, 0],
        [size - 1, 0],
        [0, size - 1],
        [size - 1, size - 1]
      ];
      let bgR = 0, bgG = 0, bgB = 0;
      corners.forEach(([cx, cy]) => {
        const idx = (cy * size + cx) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      });
      bgR /= 4;
      bgG /= 4;
      bgB /= 4;

      const buckets = new Map();
      let minX = size, maxX = 0, minY = size, maxY = 0;
      let upperWidthSum = 0, upperRows = 0;
      let lowerWidthSum = 0, lowerRows = 0;
      let topCenterMass = 0, topSideMass = 0;

      for (let y = 0; y < size; y++) {
        let rowMinX = size, rowMaxX = 0, rowFgCount = 0;
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 60) continue;
          const bgDist = Math.hypot(r - bgR, g - bgG, b - bgB);
          // Skip near-background pixels unless near image center
          const centerDist = Math.hypot(x - size * 0.5, y - size * 0.5);
          if (bgDist < 24 && centerDist > size * 0.28) continue;

          rowFgCount++;
          if (x < rowMinX) rowMinX = x;
          if (x > rowMaxX) rowMaxX = x;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          if (y < size * 0.32) {
            if (Math.abs(x - size * 0.5) < size * 0.14) topCenterMass++;
            else if (Math.abs(x - size * 0.5) < size * 0.38) topSideMass++;
          }

          // Quantize RGB into 24-step bins
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;
          const prev = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
          prev.count += 1;
          prev.r += r;
          prev.g += g;
          prev.b += b;
          buckets.set(key, prev);
        }

        if (rowFgCount > 3) {
          const rowWidth = rowMaxX - rowMinX;
          if (y < size * 0.5) {
            upperWidthSum += rowWidth;
            upperRows++;
          } else {
            lowerWidthSum += rowWidth;
            lowerRows++;
          }
        }
      }

      const sorted = Array.from(buckets.values())
        .map((b) => {
          const r = b.r / b.count;
          const g = b.g / b.count;
          const bl = b.b / b.count;
          const [h, s, l] = rgbToHsl(r, g, bl);
          return {
            count: b.count,
            r,
            g,
            b: bl,
            h,
            s,
            l,
            hex: rgbToHex(r, g, bl)
          };
        })
        .filter((c) => c.l > 0.06 && c.l < 0.96)
        .sort((a, b) => b.count * (0.4 + b.s) - a.count * (0.4 + a.s));

      const primary = sorted[0] || { h: 0.08, s: 0.65, l: 0.38, hex: '#7c4722' };
      // Pick a distinct secondary color or a lighter/warmer tint of primary
      let secondary = sorted.find(
        (c, idx) => idx > 0 && Math.abs(c.l - primary.l) > 0.14
      );
      if (!secondary) {
        secondary = {
          h: primary.h,
          s: clamp(primary.s * 0.9, 0.25, 0.95),
          l: clamp(primary.l + 0.28, 0.55, 0.9),
          hex: hslToHex(primary.h, clamp(primary.s * 0.9, 0.25, 0.95), clamp(primary.l + 0.28, 0.55, 0.9))
        };
      }

      // Ensure baseColor is deeper root and tipColor is brighter tip
      const darker = primary.l <= secondary.l ? primary : secondary;
      const lighter = primary.l <= secondary.l ? secondary : primary;

      const baseColor = darker.l > 0.65
        ? hslToHex(darker.h, clamp(darker.s, 0.2, 0.8), 0.42)
        : darker.hex;
      const tipColor = lighter.l < 0.4
        ? hslToHex(lighter.h, clamp(lighter.s, 0.3, 0.9), 0.72)
        : lighter.hex;

      const accent = sorted.find(
        (c, idx) => idx > 1 && Math.abs(c.h - primary.h) > 0.12 && c.s > 0.35
      );
      const eyeColor = accent ? accent.hex : hslToHex((primary.h + 0.5) % 1.0, 0.65, 0.32);
      const cheekColor = hslToHex(0.96, 0.85, 0.68);

      const bboxW = Math.max(8, maxX - minX);
      const bboxH = Math.max(8, maxY - minY);
      const aspectWH = bboxW / bboxH;

      const avgUpperW = upperRows > 0 ? upperWidthSum / upperRows : bboxW * 0.7;
      const avgLowerW = lowerRows > 0 ? lowerWidthSum / lowerRows : bboxW * 0.8;
      const headToBodyRatio = clamp((avgUpperW / Math.max(4, avgLowerW)) * 1.04, 0.78, 1.32);
      const bodyRoundness = clamp(aspectWH * 1.12, 0.78, 1.42);

      // Estimate ear/head style from upper silhouette mass distribution & hue
      let earStyle = 'bear';
      let muzzleStyle = 'snout';
      let accessory = 'none';
      let earSize = 1.1;
      let snoutLength = 0.35;
      let archetype = 'Plush Woodland Creature';

      if (topCenterMass > topSideMass * 1.15) {
        if (primary.h < 0.14 && primary.s > 0.45) {
          earStyle = 'bird_crest';
          muzzleStyle = 'beak';
          accessory = 'rooster_crest';
          archetype = 'Plump Crested Bird';
          earSize = 1.2;
        } else {
          earStyle = 'gnome_hat';
          muzzleStyle = 'gnome';
          accessory = 'gnome_hat';
          archetype = 'Pointed-Cap Gnome Creature';
          earSize = 1.25;
        }
      } else if (aspectWH < 0.82) {
        earStyle = 'bunny';
        muzzleStyle = 'button';
        accessory = 'cottontail';
        earSize = 1.48;
        archetype = 'Tall-Eared Hopper';
      } else if (headToBodyRatio > 1.14) {
        earStyle = 'cat';
        muzzleStyle = 'snout';
        earSize = 1.25;
        archetype = 'Big-Headed Feline / Fox Critter';
      } else if (bodyRoundness > 1.18) {
        earStyle = 'bear';
        muzzleStyle = 'snout';
        earSize = 1.05;
        archetype = 'Round Bear / Mochi Critter';
      }

      const paletteSwatches = [
        baseColor,
        tipColor,
        eyeColor,
        ...(sorted.slice(0, 3).map((c) => c.hex))
      ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 5);

      resolve({
        baseColor,
        tipColor,
        eyeColor,
        cheekColor,
        paletteSwatches,
        bodyRoundness: Number(bodyRoundness.toFixed(2)),
        headToBodyRatio: Number(headToBodyRatio.toFixed(2)),
        earStyle,
        earSize: Number(earSize.toFixed(2)),
        snoutLength: Number(snoutLength.toFixed(2)),
        muzzleStyle,
        accessory,
        archetype
      });
    };
    img.onerror = () => {
      resolve({
        baseColor: '#6b3e26',
        tipColor: '#eab676',
        eyeColor: '#2d1a12',
        cheekColor: '#f48c72',
        paletteSwatches: ['#6b3e26', '#eab676', '#2d1a12', '#f48c72'],
        bodyRoundness: 1.15,
        headToBodyRatio: 1.04,
        earStyle: 'bear',
        earSize: 1.1,
        snoutLength: 0.38,
        muzzleStyle: 'snout',
        accessory: 'none',
        archetype: 'Cozy Plush Creature'
      });
    };
    img.src = dataUrl;
  });
}

/**
 * Analyzes an uploaded or pasted reference image (overall shape, proportions, ear/head style,
 * and color palette) and returns a structured interpretation summary + proposed Mascot Base Config.
 */
export async function analyzeImageForBaseMascot(dataUrl) {
  const cvFeatures = await extractImageVisualFeatures(dataUrl);

  const defaultProposal = {
    name: cvFeatures.archetype.split(' ').slice(-2).join(' ') || 'Custom Base',
    archetype: cvFeatures.archetype,
    summary: `Analyzed reference silhouette (${cvFeatures.archetype.toLowerCase()}, roundness ${Math.round(cvFeatures.bodyRoundness * 100)}%, head-to-body ${Math.round(cvFeatures.headToBodyRatio * 100)}%) and extracted dominant fur palette (${cvFeatures.baseColor} → ${cvFeatures.tipColor}).`,
    shapeNotes: `Roundness ${cvFeatures.bodyRoundness.toFixed(2)}x · Head/Body ${cvFeatures.headToBodyRatio.toFixed(2)}x`,
    earHeadNotes: `${cvFeatures.earStyle.replace('_', ' ')} silhouette (ear size ${cvFeatures.earSize.toFixed(2)}x, ${cvFeatures.muzzleStyle} muzzle)`,
    paletteSwatches: cvFeatures.paletteSwatches,
    config: {
      name: cvFeatures.archetype.split(' ').slice(-2).join(' ') || 'Custom Base',
      archetype: cvFeatures.archetype,
      earStyle: cvFeatures.earStyle,
      muzzleStyle: cvFeatures.muzzleStyle,
      accessory: cvFeatures.accessory,
      bodyRoundness: cvFeatures.bodyRoundness,
      earSize: cvFeatures.earSize,
      snoutLength: cvFeatures.snoutLength,
      headToBodyRatio: cvFeatures.headToBodyRatio,
      eyeScale: 1.08,
      baseColor: cvFeatures.baseColor,
      tipColor: cvFeatures.tipColor,
      eyeColor: cvFeatures.eyeColor,
      cheekColor: cvFeatures.cheekColor,
      hatColor: cvFeatures.baseColor,
      beakColor: '#f59e0b',
      furLength: 0.35,
      furDensity: 0.86,
      curliness: 0.28,
      clumping: 0.42
    }
  };

  if (!dataUrl.startsWith('data:image/')) {
    return defaultProposal;
  }

  try {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return defaultProposal;
    const mimeType = match[1];
    const base64Data = match[2];

    const res = await fetch('/api/gemini/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mimeType, base64Data })
    });
    if (!res.ok) {
      return defaultProposal;
    }

    const parsed = await res.json();
    const mergedConfig = {
      ...defaultProposal.config,
      ...parsed,
      bodyRoundness: clamp(Number(parsed.bodyRoundness) || defaultProposal.config.bodyRoundness, 0.65, 1.48),
      earSize: clamp(Number(parsed.earSize) ?? defaultProposal.config.earSize, 0.2, 1.95),
      snoutLength: clamp(Number(parsed.snoutLength) ?? defaultProposal.config.snoutLength, 0.05, 1.35),
      headToBodyRatio: clamp(Number(parsed.headToBodyRatio) || defaultProposal.config.headToBodyRatio, 0.72, 1.38),
      eyeScale: clamp(Number(parsed.eyeScale) || 1.08, 0.82, 1.36)
    };

    const swatches = [
      mergedConfig.baseColor,
      mergedConfig.tipColor,
      mergedConfig.eyeColor,
      mergedConfig.cheekColor,
      ...cvFeatures.paletteSwatches
    ].filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i).slice(0, 5);

    return {
      name: mergedConfig.name,
      archetype: mergedConfig.archetype,
      summary: parsed.summary || defaultProposal.summary,
      shapeNotes: parsed.interpretedShapeNotes || parsed.shapeNotes || defaultProposal.shapeNotes,
      earHeadNotes: parsed.earHeadNotes || defaultProposal.earHeadNotes,
      paletteSwatches: swatches,
      config: mergedConfig
    };
  } catch (err) {
    console.warn('Using client-side CV image analyzer fallback:', err);
    return defaultProposal;
  }
}

/**
 * Curated quick prompts for AI Fur Pattern Textures & Skin Overlays
 */
export const FUR_PATTERN_PROMPT_EXAMPLES = [
  {
    id: 'leopard',
    label: '🐆 Leopard Rosettes',
    prompt: 'warm golden honey fur with dark espresso leopard rosette spots and amber rings'
  },
  {
    id: 'tiger',
    label: '🐅 Tiger Stripes',
    prompt: 'vibrant tangerine orange Bengal tiger fur with bold charcoal black wavy stripes'
  },
  {
    id: 'galaxy',
    label: '🌌 Cosmic Nebula',
    prompt: 'deep indigo and violet cosmic galaxy nebula fur with glowing cyan and gold starlight speckles'
  },
  {
    id: 'calico',
    label: '🐱 Calico Patches',
    prompt: 'cozy cream plush fur with warm ginger caramel and chocolate brown calico cat patches'
  },
  {
    id: 'rainbow',
    label: '🌈 Pastel Tie-Dye',
    prompt: 'pastel cotton-candy rainbow tie-dye swirl in bubblegum pink, sky blue, lemon, and lavender'
  },
  {
    id: 'cyber',
    label: '⚡ Cyber Circuit Skin',
    prompt: 'sleek dark obsidian skin overlay with glowing neon cyan and magenta hexagonal circuit lines'
  },
  {
    id: 'polka',
    label: '🍓 Berry Polka Dots',
    prompt: 'playful strawberry pink plush skin with bright mint and cream polka dots'
  },
  {
    id: 'snow_owl',
    label: '🦉 Snowy Owl Bars',
    prompt: 'arctic snowy white plumage fur with soft slate-gray and cocoa barred feather speckles'
  }
];

/**
 * Synthesizes a high-resolution 512x512 seamless Canvas2D pattern texture dataURL
 * matching a text prompt or preset ID (used for instant preview or fallback when offline).
 */
export function synthesizeProceduralPatternDataUrl(promptText = '', baseHex = '#4f35ff', tipHex = '#ff9ec7') {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const lower = String(promptText || '').toLowerCase();

  if (lower.includes('leopard') || lower.includes('rosette') || lower.includes('jaguar') || lower.includes('cheetah')) {
    // Warm golden background with organic rosette rings
    const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 20, size * 0.5, size * 0.5, size * 0.72);
    grad.addColorStop(0, '#f6d38b');
    grad.addColorStop(1, '#d99b4e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const cols = 6;
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = ((c + (r % 2) * 0.5 + 0.25) / cols) * size;
        const cy = ((r + 0.5) / rows) * size;
        const rad = 22 + ((r * 7 + c * 13) % 10);

        // Amber center
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(cx, cy, rad * 0.65, rad * 0.52, (r + c) * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Dark espresso broken rosette ring (3-4 lobes)
        ctx.fillStyle = '#271206';
        for (let k = 0; k < 4; k++) {
          const ang = (k / 4) * Math.PI * 2 + (r * 0.7 + c * 1.1);
          const lx = cx + Math.cos(ang) * rad * 0.72;
          const ly = cy + Math.sin(ang) * rad * 0.62;
          ctx.beginPath();
          ctx.ellipse(lx, ly, rad * 0.42, rad * 0.24, ang + Math.PI * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (lower.includes('tiger') || lower.includes('stripe') || lower.includes('zebra')) {
    const isZebra = lower.includes('zebra');
    ctx.fillStyle = isZebra ? '#f8fafc' : '#ea580c';
    ctx.fillRect(0, 0, size, size);

    if (!isZebra) {
      // Warm cream belly gradient bands
      const g = ctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, '#fb923c');
      g.addColorStop(0.5, '#ea580c');
      g.addColorStop(1, '#fed7aa');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }

    ctx.fillStyle = '#18181b';
    const stripeCount = 14;
    for (let i = 0; i < stripeCount; i++) {
      const yBase = (i / stripeCount) * size;
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= size; x += 16) {
        const wave = Math.sin((x / size) * Math.PI * 4 + i * 1.3) * 16;
        const thickness = 11 + Math.sin((x / size) * Math.PI) * 9;
        ctx.lineTo(x, yBase + wave - thickness * 0.5);
      }
      for (let x = size; x >= 0; x -= 16) {
        const wave = Math.sin((x / size) * Math.PI * 4 + i * 1.3) * 16;
        const thickness = 11 + Math.sin((x / size) * Math.PI) * 9;
        ctx.lineTo(x, yBase + wave + thickness * 0.5);
      }
      ctx.closePath();
      ctx.fill();
    }
  } else if (lower.includes('galaxy') || lower.includes('nebula') || lower.includes('cosmic') || lower.includes('star')) {
    ctx.fillStyle = '#0f0728';
    ctx.fillRect(0, 0, size, size);

    const blobs = [
      { x: 0.3, y: 0.35, r: 220, col: 'rgba(139, 92, 246, 0.65)' },
      { x: 0.72, y: 0.65, r: 240, col: 'rgba(236, 72, 153, 0.58)' },
      { x: 0.6, y: 0.25, r: 190, col: 'rgba(56, 189, 248, 0.55)' },
      { x: 0.25, y: 0.75, r: 200, col: 'rgba(99, 102, 241, 0.6)' }
    ];
    blobs.forEach((b) => {
      const g = ctx.createRadialGradient(b.x * size, b.y * size, 10, b.x * size, b.y * size, b.r);
      g.addColorStop(0, b.col);
      g.addColorStop(1, 'rgba(15, 7, 40, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    });

    // Starlight speckles
    for (let i = 0; i < 160; i++) {
      const sx = ((i * 97) % size);
      const sy = ((i * 57 + 23) % size);
      const sr = (i % 5 === 0) ? 3.2 : 1.5;
      ctx.fillStyle = i % 7 === 0 ? '#fde047' : i % 3 === 0 ? '#7dd3fc' : '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (lower.includes('calico') || lower.includes('patch') || lower.includes('cow') || lower.includes('dalmatian')) {
    const isCow = lower.includes('cow') || lower.includes('dalmatian');
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(0, 0, size, size);

    const patches = [
      { x: 0.22, y: 0.24, rx: 85, ry: 68, col: isCow ? '#1e293b' : '#d97706' },
      { x: 0.76, y: 0.28, rx: 92, ry: 74, col: isCow ? '#1e293b' : '#451a03' },
      { x: 0.48, y: 0.55, rx: 98, ry: 78, col: isCow ? '#1e293b' : '#ea580c' },
      { x: 0.20, y: 0.78, rx: 88, ry: 66, col: isCow ? '#1e293b' : '#451a03' },
      { x: 0.80, y: 0.76, rx: 94, ry: 72, col: isCow ? '#1e293b' : '#d97706' }
    ];
    patches.forEach((p, idx) => {
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.ellipse(p.x * size, p.y * size, p.rx, p.ry, idx * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (lower.includes('cyber') || lower.includes('circuit') || lower.includes('neon') || lower.includes('hex')) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    const step = 64;
    for (let y = 0; y <= size; y += step) {
      for (let x = 0; x <= size; x += step) {
        ctx.strokeStyle = (x + y) % 128 === 0 ? '#22d3ee' : '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + step * 0.5, y + step * 0.5);
        ctx.lineTo(x + step, y + step * 0.5);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(x + step * 0.5, y + step * 0.5, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (lower.includes('rainbow') || lower.includes('tie-dye') || lower.includes('candy') || lower.includes('swirl')) {
    const colors = ['#f472b6', '#fb7185', '#fde047', '#4ade80', '#38bdf8', '#a855f7'];
    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        const dx = (x - size * 0.5) / (size * 0.5);
        const dy = (y - size * 0.5) / (size * 0.5);
        const angle = Math.atan2(dy, dx) + Math.hypot(dx, dy) * 5.0;
        const idx = Math.floor(((angle / (Math.PI * 2)) * 6 + 60) % colors.length);
        ctx.fillStyle = colors[idx];
        ctx.fillRect(x, y, 4, 4);
      }
    }
  } else if (lower.includes('owl') || lower.includes('speckle') || lower.includes('feather') || lower.includes('bar')) {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, size, size);
    for (let r = 0; r < 14; r++) {
      for (let c = 0; c < 10; c++) {
        const cx = ((c + (r % 2) * 0.5) / 10) * size;
        const cy = ((r + 0.5) / 14) * size;
        ctx.strokeStyle = r % 2 === 0 ? '#475569' : '#78350f';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
    }
  } else {
    // Polka-dot / organic mottled pattern using prompt colors or mascot colors
    let c1 = baseHex || '#ec4899';
    let c2 = tipHex || '#67e8f9';
    for (const entry of COLOR_DICTIONARY) {
      if (entry.words.some((w) => lower.includes(w))) {
        c1 = entry.base;
        c2 = entry.tip;
        break;
      }
    }
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, size, size);

    const rows = 7;
    const cols = 7;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = ((c + (r % 2) * 0.5 + 0.25) / cols) * size;
        const cy = ((r + 0.5) / rows) * size;
        ctx.fillStyle = (r + c) % 2 === 0 ? c2 : '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Generates a custom fur pattern texture or skin overlay from a text prompt.
 * Calls the server-side Gemini image generator (/api/gemini/generate-fur-texture -> gemini-3.1-flash-lite-image)
 * and falls back gracefully to a procedural pattern texture if needed.
 */
export async function generateFurPatternFromPrompt(promptText, baseHex = '#4f35ff', tipHex = '#ff9ec7') {
  const cleanPrompt = String(promptText || '').trim() || 'golden leopard rosettes on warm honey fur';

  try {
    const res = await fetch('/api/gemini/generate-fur-texture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: cleanPrompt })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.imageUrl) {
        return {
          imageUrl: data.imageUrl,
          prompt: cleanPrompt,
          source: 'gemini-3.1-flash-lite-image',
          isAI: true
        };
      }
    }
  } catch (err) {
    console.warn('Gemini image endpoint fallback to procedural texture:', err);
  }

  const fallbackUrl = synthesizeProceduralPatternDataUrl(cleanPrompt, baseHex, tipHex);
  return {
    imageUrl: fallbackUrl,
    prompt: cleanPrompt,
    source: 'procedural-synthesizer',
    isAI: false
  };
}

