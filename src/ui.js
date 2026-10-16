// Minimalist, XSS-safe Glassmorphic DOM UI for GPU Fur Simulation
// Features:
// 1. Primary Scene Selection Menu as a top-floating glass pill bar
// 2. Collapsible Materials & Lighting Settings panel on the side
// 3. Native Google Sans font typography with full fallbacks
// 4. Strict pure safe DOM construction with input sanitization

import { ENVIRONMENT_PRESETS, COZY_SKY_THEMES, sanitizeEnvId } from './environments.js';
import { WORD_CATEGORIES } from './wordBubbles.js';
import { generateMascotExportBundle, extractMascotConfig } from './mascotExporter.js';
import {
  generateBaseFromTextPrompt,
  analyzeImageForBaseMascot,
  BASE_PROMPT_EXAMPLES,
  generateFurPatternFromPrompt,
  FUR_PATTERN_PROMPT_EXAMPLES
} from './baseGenerator.js';

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function clampNumber(val, min, max, fallback) {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

export function sanitizeHexColor(val, fallback) {
  if (typeof val === 'string' && HEX_COLOR_REGEX.test(val.trim())) {
    return val.trim();
  }
  return fallback;
}

export const FUR_PRESETS = [
  {
    name: 'Mr. M (Dream)',
    archetype: 'Dream Mascot',
    baseColor: '#4f35ff',
    tipColor: '#ff9ec7',
    eyeColor: '#2563eb',
    cheekColor: '#ff5c8a',
    earStyle: 'bunny',
    muzzleStyle: 'button',
    accessory: 'antennae',
    bodyRoundness: 1.0,
    earSize: 1.0,
    snoutLength: 0.25,
    headToBodyRatio: 1.0,
    eyeScale: 1.0,
    furLength: 0.32,
    furDensity: 0.78,
    roughness: 0.75,
    specular: 0.28,
    clumping: 0.35,
    curliness: 0.25
  },
  {
    name: 'Barnaby Bear',
    archetype: 'Small Round Bear',
    baseColor: '#6b3e26',
    tipColor: '#eab676',
    eyeColor: '#27170e',
    cheekColor: '#f48c72',
    earStyle: 'bear',
    muzzleStyle: 'snout',
    accessory: 'none',
    bodyRoundness: 1.28,
    earSize: 1.05,
    snoutLength: 0.52,
    headToBodyRatio: 1.06,
    eyeScale: 1.05,
    furLength: 0.34,
    furDensity: 0.88,
    roughness: 0.72,
    specular: 0.28,
    clumping: 0.45,
    curliness: 0.28
  },
  {
    name: 'Pip Gnome',
    archetype: 'Woodland Gnome',
    baseColor: '#285430',
    tipColor: '#a4be7b',
    eyeColor: '#1e3a8a',
    cheekColor: '#fb7185',
    hatColor: '#dc2626',
    earStyle: 'gnome_hat',
    muzzleStyle: 'gnome',
    accessory: 'gnome_hat',
    bodyRoundness: 1.24,
    earSize: 1.18,
    snoutLength: 0.38,
    headToBodyRatio: 1.14,
    eyeScale: 1.02,
    furLength: 0.36,
    furDensity: 0.86,
    roughness: 0.74,
    specular: 0.26,
    clumping: 0.42,
    curliness: 0.38
  },
  {
    name: 'Sunny Rooster',
    archetype: 'Feathered Rooster Bird',
    baseColor: '#b44114',
    tipColor: '#fde047',
    eyeColor: '#1e293b',
    cheekColor: '#fb7185',
    beakColor: '#f59e0b',
    earStyle: 'bird_crest',
    muzzleStyle: 'beak',
    accessory: 'rooster_crest',
    bodyRoundness: 1.18,
    earSize: 1.25,
    snoutLength: 0.42,
    headToBodyRatio: 0.92,
    eyeScale: 1.22,
    furLength: 0.38,
    furDensity: 0.90,
    roughness: 0.68,
    specular: 0.34,
    clumping: 0.55,
    curliness: 0.18
  },
  {
    name: 'Clover Rabbit',
    archetype: 'Long-Eared Rabbit',
    baseColor: '#cbd5e1',
    tipColor: '#fff7ed',
    eyeColor: '#be185d',
    cheekColor: '#fda4af',
    earStyle: 'bunny',
    muzzleStyle: 'button',
    accessory: 'cottontail',
    bodyRoundness: 1.08,
    earSize: 1.62,
    snoutLength: 0.34,
    headToBodyRatio: 0.96,
    eyeScale: 1.12,
    furLength: 0.34,
    furDensity: 0.88,
    roughness: 0.74,
    specular: 0.30,
    clumping: 0.38,
    curliness: 0.22
  },
  {
    name: 'Rusty Fox',
    archetype: 'Woodland Fox Kit',
    baseColor: '#c2410c',
    tipColor: '#ffedd5',
    eyeColor: '#b45309',
    cheekColor: '#fb7185',
    earStyle: 'cat',
    muzzleStyle: 'snout',
    accessory: 'cottontail',
    bodyRoundness: 0.92,
    earSize: 1.42,
    snoutLength: 0.72,
    headToBodyRatio: 1.06,
    eyeScale: 1.08,
    furLength: 0.38,
    furDensity: 0.86,
    roughness: 0.70,
    specular: 0.32,
    clumping: 0.48,
    curliness: 0.22
  }
];

export function createMinimalUI(container, state, onChange) {
  // =========================================================================
  // 1. PRIMARY SCENE SELECTION MENU (TOP GLASS PILL BAR)
  // =========================================================================
  let sceneNav = document.getElementById('scene-nav');
  if (!sceneNav) {
    sceneNav = document.createElement('nav');
    sceneNav.id = 'scene-nav';
    sceneNav.className = 'scene-nav-bar';
    sceneNav.setAttribute('aria-label', 'Scene Selection');
    document.body.appendChild(sceneNav);
  }
  sceneNav.replaceChildren();

  const sceneButtons = {};

  for (const env of ENVIRONMENT_PRESETS) {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'scene-pill';
    pill.setAttribute('data-env', env.id);
    pill.setAttribute('aria-label', `${env.name} · ${env.subtitle}`);
    const isCurrent = (state.environment || 'meadow') === env.id;
    if (isCurrent) {
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
    } else {
      pill.setAttribute('aria-selected', 'false');
    }

    const dot = document.createElement('span');
    dot.className = 'scene-pill-dot';

    const label = document.createElement('span');
    label.className = 'scene-pill-label';
    label.textContent = env.name;

    pill.appendChild(dot);
    pill.appendChild(label);

    pill.addEventListener('click', () => {
      const safeEnv = sanitizeEnvId(env.id, 'meadow');
      state.environment = safeEnv;
      updateEnvSelectionUI(safeEnv);
      onChange('environment', safeEnv);
    });

    sceneButtons[env.id] = pill;
    sceneNav.appendChild(pill);
  }

  // Divider + 1-Click WebGL / GPU Fur Toggle Pill in Top Floating Bar
  const navDivider = document.createElement('span');
  navDivider.className = 'scene-nav-divider';
  navDivider.setAttribute('aria-hidden', 'true');
  sceneNav.appendChild(navDivider);

  const topGpuFurPill = document.createElement('button');
  topGpuFurPill.type = 'button';
  topGpuFurPill.className = 'scene-pill gpu-fur-pill';
  topGpuFurPill.setAttribute('aria-label', 'Toggle between default WebGL Fur and full GPU Fur');

  const topGpuDot = document.createElement('span');
  topGpuDot.className = 'scene-pill-dot';

  const topGpuLabel = document.createElement('span');
  topGpuLabel.className = 'scene-pill-label';

  topGpuFurPill.appendChild(topGpuDot);
  topGpuFurPill.appendChild(topGpuLabel);
  sceneNav.appendChild(topGpuFurPill);

  // =========================================================================
  // 2. COLLAPSIBLE MATERIALS, SKY & MASCOT SETTINGS PANEL
  // =========================================================================
  container.replaceChildren();

  let mobileBackdrop = document.getElementById('mobile-sheet-backdrop');
  if (!mobileBackdrop) {
    mobileBackdrop = document.createElement('div');
    mobileBackdrop.id = 'mobile-sheet-backdrop';
    mobileBackdrop.className = 'mobile-sheet-backdrop';
    mobileBackdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(mobileBackdrop);
  }

  let mobileControlsBtn = document.getElementById('mobile-controls-btn');
  if (!mobileControlsBtn) {
    mobileControlsBtn = document.createElement('button');
    mobileControlsBtn.id = 'mobile-controls-btn';
    mobileControlsBtn.type = 'button';
    mobileControlsBtn.className = 'mobile-controls-btn';
    mobileControlsBtn.setAttribute('aria-label', 'Open mascot and sky controls');
    mobileControlsBtn.setAttribute('aria-expanded', 'false');
    document.body.appendChild(mobileControlsBtn);
  }
  mobileControlsBtn.replaceChildren();

  const mobileBtnDot = document.createElement('span');
  mobileBtnDot.className = 'mobile-controls-btn-dot';

  const mobileBtnLabel = document.createElement('span');
  mobileBtnLabel.className = 'mobile-controls-btn-label';
  mobileBtnLabel.textContent = 'Mascot & Sky';

  const mobileBtnSep = document.createElement('span');
  mobileBtnSep.className = 'mobile-controls-btn-sep';
  mobileBtnSep.setAttribute('aria-hidden', 'true');
  mobileBtnSep.textContent = '·';

  const mobileBtnScene = document.createElement('span');
  mobileBtnScene.className = 'mobile-controls-btn-scene';
  const currentPresetInit =
    ENVIRONMENT_PRESETS.find((e) => e.id === (state.environment || 'meadow')) ||
    ENVIRONMENT_PRESETS[0];
  mobileBtnScene.textContent = currentPresetInit.name;

  mobileControlsBtn.appendChild(mobileBtnDot);
  mobileControlsBtn.appendChild(mobileBtnLabel);
  mobileControlsBtn.appendChild(mobileBtnSep);
  mobileControlsBtn.appendChild(mobileBtnScene);

  // Mobile sheet drag handle bar
  const handleWrap = document.createElement('div');
  handleWrap.className = 'mobile-sheet-handle-wrap';
  handleWrap.setAttribute('aria-hidden', 'true');
  const handleBar = document.createElement('div');
  handleBar.className = 'mobile-sheet-handle';
  handleWrap.appendChild(handleBar);
  container.appendChild(handleWrap);

  // Glass Header Bar with Title and Collapse / Expand / Close toggle
  const header = document.createElement('div');
  header.className = 'ui-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'ui-title-wrap';

  const dot = document.createElement('span');
  dot.className = 'ui-dot';

  const title = document.createElement('span');
  title.className = 'ui-title';
  title.textContent = 'Mascot, Sky & Lighting';

  titleWrap.appendChild(dot);
  titleWrap.appendChild(title);

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'ui-toggle-btn';

  function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function syncToggleBtnLabel() {
    if (isMobileViewport()) {
      const isOpen = container.classList.contains('mobile-sheet-open');
      toggleBtn.textContent = isOpen ? 'Done' : 'Controls';
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      mobileControlsBtn.setAttribute('aria-expanded', String(isOpen));
    } else {
      const isCollapsed = container.classList.contains('collapsed');
      toggleBtn.textContent = isCollapsed ? 'Expand' : 'Collapse';
      toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
    }
  }

  function setMobileSheetOpen(open) {
    const isOpen = Boolean(open);
    container.classList.toggle('mobile-sheet-open', isOpen);
    mobileBackdrop.classList.toggle('active', isOpen);
    document.body.classList.toggle('mobile-sheet-active', isOpen);
    syncToggleBtnLabel();
  }

  toggleBtn.setAttribute('aria-label', 'Toggle settings panel');
  syncToggleBtnLabel();

  mobileControlsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMobileSheetOpen(true);
  });

  mobileBackdrop.addEventListener('click', (e) => {
    e.stopPropagation();
    setMobileSheetOpen(false);
  });

  handleWrap.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isMobileViewport()) {
      setMobileSheetOpen(false);
    }
  });

  let touchStartY = null;
  function onSheetTouchStart(e) {
    if (!isMobileViewport()) return;
    if (e.touches && e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
    }
  }
  function onSheetTouchEnd(e) {
    if (touchStartY === null || !isMobileViewport()) return;
    if (e.changedTouches && e.changedTouches.length === 1) {
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      if (deltaY > 36) {
        setMobileSheetOpen(false);
      }
    }
    touchStartY = null;
  }
  handleWrap.addEventListener('touchstart', onSheetTouchStart, { passive: true });
  handleWrap.addEventListener('touchend', onSheetTouchEnd, { passive: true });
  header.addEventListener('touchstart', onSheetTouchStart, { passive: true });
  header.addEventListener('touchend', onSheetTouchEnd, { passive: true });

  window.addEventListener('resize', () => {
    if (!isMobileViewport() && container.classList.contains('mobile-sheet-open')) {
      setMobileSheetOpen(false);
    } else {
      syncToggleBtnLabel();
    }
  });

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isMobileViewport()) {
      const nextOpen = !container.classList.contains('mobile-sheet-open');
      setMobileSheetOpen(nextOpen);
      return;
    }
    const isCollapsed = container.classList.toggle('collapsed');
    toggleBtn.textContent = isCollapsed ? 'Expand' : 'Collapse';
    toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
  });

  header.addEventListener('click', () => {
    if (isMobileViewport()) {
      return;
    }
    if (container.classList.contains('collapsed')) {
      container.classList.remove('collapsed');
      toggleBtn.textContent = 'Collapse';
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
  });

  header.appendChild(titleWrap);
  header.appendChild(toggleBtn);
  container.appendChild(header);

  const body = document.createElement('div');
  body.className = 'ui-body';
  container.appendChild(body);

  const sliderRefs = {};
  const colorRefs = {};
  const mobileSceneButtons = {};
  const earButtons = {};
  const accButtons = {};
  const skyThemeButtons = {};
  const wordCatButtons = {};

  function addSection(titleText) {
    const sec = document.createElement('section');
    sec.className = 'ui-section';
    const h = document.createElement('div');
    h.className = 'ui-section-title';
    h.textContent = titleText;
    sec.appendChild(h);
    body.appendChild(sec);
    return sec;
  }

  // --- Mobile-Only Section: Scene Selection inside the Bottom Sheet ---
  const mobileSceneSection = addSection('Scene Selection');
  mobileSceneSection.classList.add('mobile-scene-section');

  const mobileSceneGrid = document.createElement('div');
  mobileSceneGrid.className = 'preset-grid mobile-scene-grid';

  for (const env of ENVIRONMENT_PRESETS) {
    const mBtn = document.createElement('button');
    mBtn.type = 'button';
    mBtn.className = 'preset-btn mobile-scene-btn';
    mBtn.setAttribute('data-env', env.id);
    mBtn.setAttribute('aria-label', `${env.name} · ${env.subtitle}`);
    const isCur = (state.environment || 'meadow') === env.id;
    if (isCur) {
      mBtn.classList.add('active');
      mBtn.setAttribute('aria-selected', 'true');
    } else {
      mBtn.setAttribute('aria-selected', 'false');
    }

    const mDot = document.createElement('span');
    mDot.className = 'scene-pill-dot';

    const mLabel = document.createElement('span');
    mLabel.className = 'preset-label';
    mLabel.textContent = env.name;

    mBtn.appendChild(mDot);
    mBtn.appendChild(mLabel);

    mBtn.addEventListener('click', () => {
      const safeEnv = sanitizeEnvId(env.id, 'meadow');
      state.environment = safeEnv;
      updateEnvSelectionUI(safeEnv);
      onChange('environment', safeEnv);
    });

    mobileSceneButtons[env.id] = mBtn;
    mobileSceneGrid.appendChild(mBtn);
  }
  mobileSceneSection.appendChild(mobileSceneGrid);

  function addSlider(parent, key, labelText, min, max, step, formatFn) {
    const row = document.createElement('div');
    row.className = 'control-row';

    const labelRow = document.createElement('div');
    labelRow.className = 'control-label-row';

    const lbl = document.createElement('span');
    lbl.className = 'control-label';
    lbl.textContent = labelText;

    const valSpan = document.createElement('span');
    valSpan.className = 'control-val';
    valSpan.textContent = formatFn(state[key]);

    labelRow.appendChild(lbl);
    labelRow.appendChild(valSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(state[key]);
    input.setAttribute('aria-label', labelText);

    input.addEventListener('input', () => {
      const sanitized = clampNumber(input.value, min, max, state[key]);
      state[key] = sanitized;
      valSpan.textContent = formatFn(sanitized);
      onChange(key, sanitized);
    });

    row.appendChild(labelRow);
    row.appendChild(input);
    parent.appendChild(row);

    sliderRefs[key] = { input, valSpan, formatFn };
  }

  // =========================================================================
  // SECTION 1: BASE MASCOT GENERATOR (TEXT PROMPT & IMAGE REFERENCE) + STUDIO
  // =========================================================================
  const mascotSection = addSection('Mascot Maker Studio');
  const muzzleButtons = {};

  // Mascot Name Input + Active Archetype Badge
  const nameRow = document.createElement('div');
  nameRow.className = 'mascot-name-row';

  const nameLabel = document.createElement('span');
  nameLabel.className = 'control-label';
  nameLabel.textContent = 'Mascot Name';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'mascot-text-input';
  nameInput.value = state.mascotName || 'Mr. M';
  nameInput.maxLength = 22;
  nameInput.setAttribute('aria-label', 'Mascot Name');
  nameInput.addEventListener('input', () => {
    state.mascotName = nameInput.value.trim() || 'Mr. M';
    onChange('mascotName', state.mascotName);
  });

  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  mascotSection.appendChild(nameRow);

  // Quick Expression Action Row: Wave, Blink/Wink, Cheer/Speak
  const emoteRow = document.createElement('div');
  emoteRow.className = 'action-row emote-action-row';

  const waveBtn = document.createElement('button');
  waveBtn.type = 'button';
  waveBtn.className = 'action-btn emote-btn';
  waveBtn.textContent = '👋 Wave Hi';
  waveBtn.addEventListener('click', () => {
    onChange('triggerWave', true);
  });

  const winkBtn = document.createElement('button');
  winkBtn.type = 'button';
  winkBtn.className = 'action-btn emote-btn';
  winkBtn.textContent = '😉 Blink / Wink';
  winkBtn.addEventListener('click', () => {
    onChange('triggerBlink', true);
  });

  const talkBtn = document.createElement('button');
  talkBtn.type = 'button';
  talkBtn.className = 'action-btn emote-btn';
  talkBtn.textContent = '💬 Say Hello';
  talkBtn.addEventListener('click', () => {
    onChange('triggerGreeting', true);
  });

  emoteRow.appendChild(waveBtn);
  emoteRow.appendChild(winkBtn);
  emoteRow.appendChild(talkBtn);
  mascotSection.appendChild(emoteRow);

  // -------------------------------------------------------------------------
  // CREATE NEW BASE MASCOT: (1) TEXT PROMPT TO BASE SHAPE & (2) IMAGE REFERENCE
  // -------------------------------------------------------------------------
  const baseGenBox = document.createElement('div');
  baseGenBox.className = 'base-generator-box';

  const baseGenHeader = document.createElement('div');
  baseGenHeader.className = 'control-label-row';
  baseGenHeader.style.marginBottom = '6px';

  const baseGenTitle = document.createElement('span');
  baseGenTitle.className = 'sub-control-label';
  baseGenTitle.style.margin = '0';
  baseGenTitle.textContent = 'Create New Base Mascot';

  const archetypeBadge = document.createElement('span');
  archetypeBadge.className = 'base-archetype-badge';
  archetypeBadge.textContent = state.archetype || 'Dream Mascot';

  baseGenHeader.appendChild(baseGenTitle);
  baseGenHeader.appendChild(archetypeBadge);
  baseGenBox.appendChild(baseGenHeader);

  // Mode Switcher Tabs: Text Prompt vs Image Reference
  const genTabsRow = document.createElement('div');
  genTabsRow.className = 'dpr-selector-row';
  genTabsRow.style.marginBottom = '8px';

  const textModeTabBtn = document.createElement('button');
  textModeTabBtn.type = 'button';
  textModeTabBtn.className = 'dpr-pill-btn active';
  textModeTabBtn.textContent = '✍️ Text to Base Shape';

  const imgModeTabBtn = document.createElement('button');
  imgModeTabBtn.type = 'button';
  imgModeTabBtn.className = 'dpr-pill-btn';
  imgModeTabBtn.textContent = '🖼️ Image Reference';

  genTabsRow.appendChild(textModeTabBtn);
  genTabsRow.appendChild(imgModeTabBtn);
  baseGenBox.appendChild(genTabsRow);

  // --- Pane A: Text Prompt to Base Shape ---
  const textPromptPane = document.createElement('div');
  textPromptPane.className = 'base-gen-pane';

  const promptInputRow = document.createElement('div');
  promptInputRow.className = 'base-prompt-input-row';

  const basePromptInput = document.createElement('input');
  basePromptInput.type = 'text';
  basePromptInput.className = 'mascot-text-input base-prompt-input';
  basePromptInput.placeholder = 'e.g. small round bear, gnome with pointed hat, rooster bird...';
  basePromptInput.setAttribute('aria-label', 'Text prompt to generate new base mascot shape');

  const generateBaseBtn = document.createElement('button');
  generateBaseBtn.type = 'button';
  generateBaseBtn.className = 'action-btn base-generate-btn';
  generateBaseBtn.textContent = 'Generate Base';

  promptInputRow.appendChild(basePromptInput);
  promptInputRow.appendChild(generateBaseBtn);
  textPromptPane.appendChild(promptInputRow);

  // Quick Prompt Example Chips
  const exampleChipsGrid = document.createElement('div');
  exampleChipsGrid.className = 'base-example-chips';
  BASE_PROMPT_EXAMPLES.forEach((item) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'base-example-chip';
    chip.textContent = item.label;
    chip.title = item.prompt;
    chip.addEventListener('click', () => {
      basePromptInput.value = item.prompt;
      handleTextPromptGeneration(item.prompt);
    });
    exampleChipsGrid.appendChild(chip);
  });
  textPromptPane.appendChild(exampleChipsGrid);

  const textSummaryBanner = document.createElement('div');
  textSummaryBanner.className = 'base-summary-banner';
  textSummaryBanner.style.display = 'none';
  textPromptPane.appendChild(textSummaryBanner);

  // --- Pane B: Image Reference Input (Upload, Drag-Drop, Paste) ---
  const imageRefPane = document.createElement('div');
  imageRefPane.className = 'base-gen-pane';
  imageRefPane.style.display = 'none';

  const hiddenFileInput = document.createElement('input');
  hiddenFileInput.type = 'file';
  hiddenFileInput.accept = 'image/*';
  hiddenFileInput.style.display = 'none';

  const imageDropZone = document.createElement('div');
  imageDropZone.className = 'image-ref-dropzone';
  imageDropZone.tabIndex = 0;
  imageDropZone.setAttribute('role', 'button');
  imageDropZone.setAttribute('aria-label', 'Upload, drop, or paste a reference image to analyze');

  const dropZoneLabel = document.createElement('div');
  dropZoneLabel.className = 'image-ref-dropzone-text';
  dropZoneLabel.textContent = '📥 Click to upload, drop image, or Paste (Ctrl+V)';

  const dropZoneSub = document.createElement('div');
  dropZoneSub.className = 'image-ref-dropzone-sub';
  dropZoneSub.textContent = 'Analyzes shape, proportions, ear/head style & color palette';

  const refThumbImg = document.createElement('img');
  refThumbImg.className = 'image-ref-thumb';
  refThumbImg.alt = 'Reference preview';
  refThumbImg.style.display = 'none';

  imageDropZone.appendChild(refThumbImg);
  imageDropZone.appendChild(dropZoneLabel);
  imageDropZone.appendChild(dropZoneSub);
  imageRefPane.appendChild(hiddenFileInput);
  imageRefPane.appendChild(imageDropZone);

  // Interpretation Summary Card (shown BEFORE applying proposed image base!)
  const imageProposalCard = document.createElement('div');
  imageProposalCard.className = 'image-proposal-card';
  imageProposalCard.style.display = 'none';

  const proposalTitleRow = document.createElement('div');
  proposalTitleRow.className = 'proposal-title-row';

  const proposalTitle = document.createElement('span');
  proposalTitle.className = 'proposal-title';

  const proposalSwatches = document.createElement('div');
  proposalSwatches.className = 'proposal-swatches';

  proposalTitleRow.appendChild(proposalTitle);
  proposalTitleRow.appendChild(proposalSwatches);

  const proposalSummaryText = document.createElement('div');
  proposalSummaryText.className = 'proposal-summary-text';

  const proposalMetricsText = document.createElement('div');
  proposalMetricsText.className = 'proposal-metrics-text';

  const applyProposalBtn = document.createElement('button');
  applyProposalBtn.type = 'button';
  applyProposalBtn.className = 'action-btn export-code-cta-btn';
  applyProposalBtn.style.width = '100%';
  applyProposalBtn.style.marginTop = '7px';
  applyProposalBtn.textContent = '✨ Apply Proposed Base Mascot';

  imageProposalCard.appendChild(proposalTitleRow);
  imageProposalCard.appendChild(proposalSummaryText);
  imageProposalCard.appendChild(proposalMetricsText);
  imageProposalCard.appendChild(applyProposalBtn);
  imageRefPane.appendChild(imageProposalCard);

  baseGenBox.appendChild(textPromptPane);
  baseGenBox.appendChild(imageRefPane);
  mascotSection.appendChild(baseGenBox);

  textModeTabBtn.addEventListener('click', () => {
    textModeTabBtn.classList.add('active');
    imgModeTabBtn.classList.remove('active');
    textPromptPane.style.display = 'block';
    imageRefPane.style.display = 'none';
  });

  imgModeTabBtn.addEventListener('click', () => {
    imgModeTabBtn.classList.add('active');
    textModeTabBtn.classList.remove('active');
    imageRefPane.style.display = 'block';
    textPromptPane.style.display = 'none';
  });

  // Helper to apply any preset or generated base config and update all controls + live 3D mascot
  function applyPresetObject(preset) {
    if (preset.name) {
      state.mascotName = preset.name.replace(/\s*\(.*\)$/, '');
      nameInput.value = state.mascotName;
      onChange('mascotName', state.mascotName);
    }
    if (preset.archetype) {
      state.archetype = preset.archetype;
      archetypeBadge.textContent = preset.archetype;
    }
    Object.keys(preset).forEach((k) => {
      if (k === 'name' || k === 'summary' || k === 'shapeNotes' || k === 'earHeadNotes' || k === 'paletteSwatches') return;
      state[k] = preset[k];
      if (sliderRefs[k]) {
        sliderRefs[k].input.value = String(preset[k]);
        sliderRefs[k].valSpan.textContent = sliderRefs[k].formatFn(preset[k]);
      }
      if (colorRefs[k]) {
        colorRefs[k].value = preset[k];
      }
      if (k === 'earStyle' && earButtons[preset[k]]) {
        Object.values(earButtons).forEach((b) => b.classList.remove('active'));
        earButtons[preset[k]].classList.add('active');
      }
      if (k === 'muzzleStyle' && muzzleButtons[preset[k]]) {
        Object.values(muzzleButtons).forEach((b) => b.classList.remove('active'));
        muzzleButtons[preset[k]].classList.add('active');
      }
      if (k === 'accessory' && accButtons[preset[k]]) {
        Object.values(accButtons).forEach((b) => b.classList.remove('active'));
        accButtons[preset[k]].classList.add('active');
      }
      onChange(k, preset[k]);
    });
  }

  async function handleTextPromptGeneration(promptStr) {
    const query = String(promptStr ?? basePromptInput.value).trim();
    if (!query) return;
    generateBaseBtn.disabled = true;
    generateBaseBtn.textContent = 'Sculpting...';
    textSummaryBanner.style.display = 'block';
    textSummaryBanner.textContent = `Generating original 3D base shape for "${query}"...`;

    try {
      const baseCfg = await generateBaseFromTextPrompt(query);
      applyPresetObject(baseCfg);
      textSummaryBanner.textContent = `✓ ${baseCfg.summary || `Generated ${baseCfg.archetype}`}`;
      onChange('triggerBoop', true);
    } catch (err) {
      textSummaryBanner.textContent = `Could not generate base: ${err.message}`;
    } finally {
      generateBaseBtn.disabled = false;
      generateBaseBtn.textContent = 'Generate Base';
    }
  }

  generateBaseBtn.addEventListener('click', () => {
    handleTextPromptGeneration(basePromptInput.value);
  });

  basePromptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextPromptGeneration(basePromptInput.value);
    }
  });

  let pendingImageProposal = null;

  async function processReferenceImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = String(ev.target?.result || '');
      if (!dataUrl) return;
      refThumbImg.src = dataUrl;
      refThumbImg.style.display = 'block';
      dropZoneLabel.textContent = 'Analyzing shape, proportions & fur palette...';

      const proposal = await analyzeImageForBaseMascot(dataUrl);
      pendingImageProposal = proposal;

      dropZoneLabel.textContent = '✓ Image analyzed — review summary below or drop another';
      proposalTitle.textContent = `Proposed: ${proposal.archetype}`;
      proposalSummaryText.textContent = proposal.summary;
      proposalMetricsText.textContent = `${proposal.shapeNotes} · ${proposal.earHeadNotes}`;

      proposalSwatches.replaceChildren();
      (proposal.paletteSwatches || []).forEach((hex) => {
        const sw = document.createElement('span');
        sw.className = 'proposal-swatch-dot';
        sw.style.background = hex;
        sw.title = hex;
        proposalSwatches.appendChild(sw);
      });

      imageProposalCard.style.display = 'block';
      applyProposalBtn.textContent = `✨ Apply "${proposal.name}" Base Mascot`;
    };
    reader.readAsDataURL(file);
  }

  applyProposalBtn.addEventListener('click', () => {
    if (!pendingImageProposal || !pendingImageProposal.config) return;
    applyPresetObject(pendingImageProposal.config);
    applyProposalBtn.textContent = `✓ Applied "${pendingImageProposal.name}"! (Tweak sliders below)`;
    onChange('triggerBoop', true);
  });

  imageDropZone.addEventListener('click', () => {
    hiddenFileInput.click();
  });

  hiddenFileInput.addEventListener('change', () => {
    if (hiddenFileInput.files && hiddenFileInput.files[0]) {
      processReferenceImageFile(hiddenFileInput.files[0]);
    }
  });

  imageDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageDropZone.classList.add('dragover');
  });

  imageDropZone.addEventListener('dragleave', () => {
    imageDropZone.classList.remove('dragover');
  });

  imageDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    imageDropZone.classList.remove('dragover');
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      processReferenceImageFile(e.dataTransfer.files[0]);
    }
  });

  window.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          imgModeTabBtn.click();
          processReferenceImageFile(file);
          break;
        }
      }
    }
  });

  // -------------------------------------------------------------------------
  // BASE SILHOUETTE & ADJUSTABLE PROPORTION PARAMETERS
  // -------------------------------------------------------------------------
  const earTitle = document.createElement('div');
  earTitle.className = 'sub-control-label';
  earTitle.textContent = 'Ear / Head Silhouette';
  mascotSection.appendChild(earTitle);

  const earGrid = document.createElement('div');
  earGrid.className = 'dpr-selector-row';
  earGrid.style.flexWrap = 'wrap';
  const earOptions = [
    { id: 'bear', label: '🐻 Bear' },
    { id: 'bunny', label: '🐰 Bunny' },
    { id: 'puppy', label: '🐶 Puppy' },
    { id: 'cat', label: '🦊 Cat/Fox' },
    { id: 'bird_crest', label: '🐓 Bird Crest' },
    { id: 'gnome_hat', label: '🧙‍♂️ Gnome' },
    { id: 'owl_tufts', label: '🦉 Owl' },
    { id: 'round', label: '☁️ Round' }
  ];

  earOptions.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dpr-pill-btn';
    btn.style.flex = '1 1 22%';
    btn.textContent = opt.label;
    if ((state.earStyle || 'bunny') === opt.id) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.earStyle = opt.id;
      Object.values(earButtons).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onChange('earStyle', opt.id);
    });
    earButtons[opt.id] = btn;
    earGrid.appendChild(btn);
  });
  mascotSection.appendChild(earGrid);

  // Muzzle / Nose Plan Selector
  const muzzleTitle = document.createElement('div');
  muzzleTitle.className = 'sub-control-label';
  muzzleTitle.textContent = 'Muzzle / Facial Feature';
  mascotSection.appendChild(muzzleTitle);

  const muzzleGrid = document.createElement('div');
  muzzleGrid.className = 'dpr-selector-row';
  const muzzleOptions = [
    { id: 'button', label: 'Button Nose' },
    { id: 'snout', label: 'Animal Snout' },
    { id: 'beak', label: 'Bird Beak' },
    { id: 'gnome', label: 'Gnome Beard' }
  ];

  muzzleOptions.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dpr-pill-btn';
    btn.textContent = opt.label;
    if ((state.muzzleStyle || 'button') === opt.id) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.muzzleStyle = opt.id;
      Object.values(muzzleButtons).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onChange('muzzleStyle', opt.id);
    });
    muzzleButtons[opt.id] = btn;
    muzzleGrid.appendChild(btn);
  });
  mascotSection.appendChild(muzzleGrid);

  // Crown / Dream Accessory Selector
  const accTitle = document.createElement('div');
  accTitle.className = 'sub-control-label';
  accTitle.textContent = 'Headwear & Accessories';
  mascotSection.appendChild(accTitle);

  const accGrid = document.createElement('div');
  accGrid.className = 'dpr-selector-row';
  accGrid.style.flexWrap = 'wrap';
  const accOptions = [
    { id: 'antennae', label: '⭐ Boppers' },
    { id: 'gnome_hat', label: '🧙‍♂️ Gnome Hat' },
    { id: 'rooster_crest', label: '🐓 Comb' },
    { id: 'cottontail', label: '🐰 Tail' },
    { id: 'halo', label: '☁️ Halo' },
    { id: 'amulet', label: '💖 Bowtie' },
    { id: 'none', label: 'None' }
  ];

  accOptions.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dpr-pill-btn';
    btn.style.flex = '1 1 28%';
    btn.textContent = opt.label;
    if ((state.accessory || 'antennae') === opt.id) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.accessory = opt.id;
      Object.values(accButtons).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onChange('accessory', opt.id);
    });
    accButtons[opt.id] = btn;
    accGrid.appendChild(btn);
  });
  mascotSection.appendChild(accGrid);

  // Adjustable Base Proportion Sliders (Body Roundness, Ear Size, Snout Length, Head-to-Body Ratio, Eye Scale)
  const propHeader = document.createElement('div');
  propHeader.className = 'sub-control-label';
  propHeader.style.marginTop = '8px';
  propHeader.textContent = 'Base Proportions & Silhouette';
  mascotSection.appendChild(propHeader);

  if (state.bodyRoundness === undefined) state.bodyRoundness = 1.0;
  if (state.earSize === undefined) state.earSize = 1.0;
  if (state.snoutLength === undefined) state.snoutLength = 0.25;
  if (state.headToBodyRatio === undefined) state.headToBodyRatio = 1.0;
  if (state.eyeScale === undefined) state.eyeScale = 1.0;

  addSlider(
    mascotSection,
    'bodyRoundness',
    'Body Roundness',
    0.65,
    1.50,
    0.02,
    (v) => `${Math.round(v * 100)}%`
  );
  addSlider(
    mascotSection,
    'earSize',
    'Ear / Crest Size',
    0.15,
    1.95,
    0.05,
    (v) => `${Math.round(v * 100)}%`
  );
  addSlider(
    mascotSection,
    'snoutLength',
    'Snout / Muzzle Length',
    0.0,
    1.35,
    0.02,
    (v) => `${Math.round(v * 100)}%`
  );
  addSlider(
    mascotSection,
    'headToBodyRatio',
    'Head-to-Body Ratio',
    0.72,
    1.38,
    0.02,
    (v) => `${v.toFixed(2)}x`
  );
  addSlider(
    mascotSection,
    'eyeScale',
    'Eye Proportions',
    0.80,
    1.35,
    0.02,
    (v) => `${Math.round(v * 100)}%`
  );

  // Mascot Character Presets + Save Custom Variant
  const presetHeaderRow = document.createElement('div');
  presetHeaderRow.className = 'control-label-row';
  presetHeaderRow.style.margin = '8px 0 5px 0';

  const presetSubTitle = document.createElement('div');
  presetSubTitle.className = 'sub-control-label';
  presetSubTitle.style.margin = '0';
  presetSubTitle.textContent = 'Base Character Presets & Variants';

  const saveVariantBtn = document.createElement('button');
  saveVariantBtn.type = 'button';
  saveVariantBtn.className = 'ui-toggle-btn';
  saveVariantBtn.textContent = '+ Save Variant';
  saveVariantBtn.title = 'Save current mascot design as a reusable variant button';

  presetHeaderRow.appendChild(presetSubTitle);
  presetHeaderRow.appendChild(saveVariantBtn);
  mascotSection.appendChild(presetHeaderRow);

  const presetGrid = document.createElement('div');
  presetGrid.className = 'preset-grid';

  function createPresetButton(preset) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-btn';

    const pDot = document.createElement('span');
    pDot.className = 'preset-dot';
    pDot.style.background = `linear-gradient(135deg, ${preset.tipColor} 0%, ${preset.baseColor} 100%)`;

    const pLabel = document.createElement('span');
    pLabel.className = 'preset-label';
    pLabel.textContent = preset.name;

    btn.appendChild(pDot);
    btn.appendChild(pLabel);

    btn.addEventListener('click', () => {
      applyPresetObject(preset);
    });
    return btn;
  }

  for (const preset of FUR_PRESETS) {
    presetGrid.appendChild(createPresetButton(preset));
  }
  mascotSection.appendChild(presetGrid);

  saveVariantBtn.addEventListener('click', () => {
    const customPreset = {
      name: state.mascotName || `Mascot #${presetGrid.children.length + 1}`,
      archetype: state.archetype || 'Custom Base',
      baseColor: state.baseColor,
      tipColor: state.tipColor,
      eyeColor: state.eyeColor,
      cheekColor: state.cheekColor,
      hatColor: state.hatColor,
      beakColor: state.beakColor,
      earStyle: state.earStyle,
      muzzleStyle: state.muzzleStyle,
      accessory: state.accessory,
      bodyRoundness: state.bodyRoundness,
      earSize: state.earSize,
      snoutLength: state.snoutLength,
      headToBodyRatio: state.headToBodyRatio,
      eyeScale: state.eyeScale,
      furLength: state.furLength,
      furDensity: state.furDensity,
      roughness: state.roughness,
      specular: state.specular,
      clumping: state.clumping,
      curliness: state.curliness
    };
    presetGrid.appendChild(createPresetButton(customPreset));
  });

  // Export Mascot Code & Edit Config JSON Action Row
  const exportActionRow = document.createElement('div');
  exportActionRow.className = 'action-row';
  exportActionRow.style.marginTop = '9px';

  const openExportBtn = document.createElement('button');
  openExportBtn.type = 'button';
  openExportBtn.className = 'action-btn export-code-cta-btn';
  openExportBtn.textContent = 'Export Mascot Code';
  openExportBtn.addEventListener('click', () => {
    openExportModal('bundle');
  });

  const openConfigBtn = document.createElement('button');
  openConfigBtn.type = 'button';
  openConfigBtn.className = 'action-btn';
  openConfigBtn.textContent = 'Edit Config JSON';
  openConfigBtn.addEventListener('click', () => {
    openExportModal('config');
  });

  exportActionRow.appendChild(openExportBtn);
  exportActionRow.appendChild(openConfigBtn);
  mascotSection.appendChild(exportActionRow);

  // =========================================================================
  // SECTION 1B: FACIAL MORPH TARGETS — MOUTH SHAPES, EYELIDS & LIP-SYNC STUDIO
  // =========================================================================
  const phonemeSection = addSection('Facial Morph Targets & Lip-Sync Studio');

  const phonemeHeaderRow = document.createElement('div');
  phonemeHeaderRow.className = 'phoneme-studio-header';

  const phonemeStatusLabel = document.createElement('span');
  phonemeStatusLabel.className = 'phoneme-status-label';
  phonemeStatusLabel.textContent = 'Mouth Viseme:';

  const phonemeActiveBadge = document.createElement('span');
  phonemeActiveBadge.className = 'phoneme-active-badge';
  phonemeActiveBadge.textContent = 'SIL · Rest /∅/';

  phonemeHeaderRow.appendChild(phonemeStatusLabel);
  phonemeHeaderRow.appendChild(phonemeActiveBadge);
  phonemeSection.appendChild(phonemeHeaderRow);

  const eyelidHeaderRow = document.createElement('div');
  eyelidHeaderRow.className = 'phoneme-studio-header';
  eyelidHeaderRow.style.marginTop = '-2px';

  const eyelidStatusLabel = document.createElement('span');
  eyelidStatusLabel.className = 'phoneme-status-label';
  eyelidStatusLabel.textContent = 'Eyelid State:';

  const eyelidActiveBadge = document.createElement('span');
  eyelidActiveBadge.className = 'phoneme-active-badge eyelid-active-badge';
  eyelidActiveBadge.textContent = '👀 Alert / Open';

  eyelidHeaderRow.appendChild(eyelidStatusLabel);
  eyelidHeaderRow.appendChild(eyelidActiveBadge);
  phonemeSection.appendChild(eyelidHeaderRow);

  // Pre-recorded Auto-Lip-Sync Test CTA + Visual Step Sequence Tracker ('A', 'O', 'E', 'M', ...)
  const autoTestCard = document.createElement('div');
  autoTestCard.className = 'auto-lipsync-test-card';

  const autoTestTopRow = document.createElement('div');
  autoTestTopRow.className = 'auto-lipsync-top-row';

  const autoLipSyncTestBtn = document.createElement('button');
  autoLipSyncTestBtn.type = 'button';
  autoLipSyncTestBtn.className = 'action-btn export-code-cta-btn auto-lipsync-cta-btn';
  autoLipSyncTestBtn.textContent = '▶️ Auto-Lip-Sync Test';
  autoLipSyncTestBtn.setAttribute(
    'aria-label',
    'Play pre-recorded Auto-Lip-Sync Test sequence of phoneme morph targets A, O, E, M, U, F, L'
  );
  autoLipSyncTestBtn.addEventListener('click', () => {
    onChange('playAutoLipSyncTest', true);
  });

  autoTestTopRow.appendChild(autoLipSyncTestBtn);
  autoTestCard.appendChild(autoTestTopRow);

  const TEST_SEQUENCE_STEPS = [
    { stepIndex: 0, token: 'A', viseme: 'AA', title: 'Open Vowel /AA/' },
    { stepIndex: 1, token: 'O', viseme: 'OH', title: 'Round Open /OH/' },
    { stepIndex: 2, token: 'E', viseme: 'EE', title: 'Wide Smile /EE/' },
    { stepIndex: 3, token: 'M', viseme: 'BMP', title: 'Bilabial Press /B·M·P/' },
    { stepIndex: 4, token: 'U', viseme: 'OO', title: 'Tight Pucker /OO/' },
    { stepIndex: 5, token: 'F', viseme: 'FV', title: 'Lip Tuck /F·V/' },
    { stepIndex: 6, token: 'L', viseme: 'L_TH', title: 'Tongue Tip /L·TH/' },
    { stepIndex: 7, token: 'A', viseme: 'AA', title: 'Open Vowel /AA/' },
    { stepIndex: 8, token: 'O', viseme: 'OH', title: 'Round Open /OH/' },
    { stepIndex: 9, token: 'E', viseme: 'EE', title: 'Wide Smile /EE/' },
    { stepIndex: 10, token: 'M', viseme: 'BMP', title: 'Bilabial Press /B·M·P/' }
  ];

  const testStepStrip = document.createElement('div');
  testStepStrip.className = 'auto-lipsync-step-strip';
  testStepStrip.setAttribute('aria-label', 'Pre-recorded phoneme sequence steps');

  const testStepBadges = [];
  TEST_SEQUENCE_STEPS.forEach((step) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'auto-lipsync-step-pill';
    pill.textContent = step.token;
    pill.title = `${step.token} → ${step.title}`;
    pill.addEventListener('click', () => {
      onChange('triggerPhoneme', step.viseme);
    });
    testStepBadges.push(pill);
    testStepStrip.appendChild(pill);
  });

  autoTestCard.appendChild(testStepStrip);
  phonemeSection.appendChild(autoTestCard);

  // Interactive Lip-Sync Phrase Sequencer (Text -> Coarticulated Mouth Shapes + Eyelid Blinks)
  const lipSyncBox = document.createElement('div');
  lipSyncBox.className = 'lipsync-sequencer-box';

  const lipSyncTitleRow = document.createElement('div');
  lipSyncTitleRow.className = 'lipsync-title-row';

  const lipSyncTitle = document.createElement('span');
  lipSyncTitle.className = 'sub-control-label';
  lipSyncTitle.style.margin = '0';
  lipSyncTitle.textContent = 'Custom Phrase Lip-Sync Sequencer';

  lipSyncTitleRow.appendChild(lipSyncTitle);
  lipSyncBox.appendChild(lipSyncTitleRow);

  const lipSyncInputRow = document.createElement('div');
  lipSyncInputRow.className = 'base-prompt-input-row';

  const lipSyncInput = document.createElement('input');
  lipSyncInput.type = 'text';
  lipSyncInput.className = 'mascot-name-input base-prompt-input';
  lipSyncInput.value = 'Hello friend! Look how my mouth shapes and eyelids move in sync!';
  lipSyncInput.placeholder = 'Type any phrase to test lip-sync mouth shapes & blinks...';
  lipSyncInput.setAttribute('aria-label', 'Phrase to test lip-sync mouth shapes and eyelid movement');

  const playLipSyncBtn = document.createElement('button');
  playLipSyncBtn.type = 'button';
  playLipSyncBtn.className = 'action-btn base-generate-cta-btn';
  playLipSyncBtn.textContent = '▶️ Lip-Sync';
  playLipSyncBtn.addEventListener('click', () => {
    onChange('playLipSyncPhrase', lipSyncInput.value);
  });

  lipSyncInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange('playLipSyncPhrase', lipSyncInput.value);
    }
  });

  lipSyncInputRow.appendChild(lipSyncInput);
  lipSyncInputRow.appendChild(playLipSyncBtn);
  lipSyncBox.appendChild(lipSyncInputRow);

  const SAMPLE_LIPSYNC_PHRASES = [
    { label: '👋 Hello Friend!', text: 'Hello friend! Ready to talk and smile!' },
    { label: '✨ Fluffy Fur', text: 'Ooh look at my super soft fluffy fur!' },
    { label: '🐝 Bumblebees', text: 'Bumblebees, magic stars, and cozy wishes!' },
    { label: '😮 Surprise?', text: 'Wait, can my eyelids wink and squint too?' }
  ];

  const phraseChipGrid = document.createElement('div');
  phraseChipGrid.className = 'base-example-chips';
  SAMPLE_LIPSYNC_PHRASES.forEach((sample) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'base-example-chip';
    chip.textContent = sample.label;
    chip.addEventListener('click', () => {
      lipSyncInput.value = sample.text;
      onChange('playLipSyncPhrase', sample.text);
    });
    phraseChipGrid.appendChild(chip);
  });
  lipSyncBox.appendChild(phraseChipGrid);
  phonemeSection.appendChild(lipSyncBox);

  // 1. Mouth Shape / Phoneme Viseme Triggers
  const phonemeSubNote = document.createElement('div');
  phonemeSubNote.className = 'sub-control-label';
  phonemeSubNote.textContent = '1. Mouth Shapes (Phoneme Visemes — Tap to Trigger)';
  phonemeSection.appendChild(phonemeSubNote);

  const phonemeBtnGrid = document.createElement('div');
  phonemeBtnGrid.className = 'phoneme-btn-grid';

  const PHONEME_BUTTON_LIST = [
    { id: 'AA', code: '/AA/', word: 'star · open' },
    { id: 'EE', code: '/EE/', word: 'dream · wide' },
    { id: 'IH', code: '/IH/', word: 'wish · soft' },
    { id: 'OH', code: '/OH/', word: 'glow · round' },
    { id: 'OO', code: '/OO/', word: 'moon · pucker' },
    { id: 'BMP', code: '/B·M·P/', word: 'press lips' },
    { id: 'FV', code: '/F·V/', word: 'lip tuck' },
    { id: 'L_TH', code: '/L·TH/', word: 'tongue tip' },
    { id: 'SH_CH', code: '/SH·CH/', word: 'palatal' },
    { id: 'WQ', code: '/W·R/', word: 'glide pucker' },
    { id: 'KG', code: '/K·G·S/', word: 'velar grin' },
    { id: 'SIL', code: 'Rest', word: 'cozy smile' }
  ];

  const phonemeBtns = {};
  PHONEME_BUTTON_LIST.forEach((item) => {
    const pBtn = document.createElement('button');
    pBtn.type = 'button';
    pBtn.className = `phoneme-chip-btn ${item.id === 'SIL' ? 'active' : ''}`;
    pBtn.setAttribute('aria-label', `Trigger mouth shape ${item.code} as in ${item.word}`);

    const codeSpan = document.createElement('span');
    codeSpan.className = 'phoneme-chip-code';
    codeSpan.textContent = item.code;

    const exSpan = document.createElement('span');
    exSpan.className = 'phoneme-chip-word';
    exSpan.textContent = item.word;

    pBtn.appendChild(codeSpan);
    pBtn.appendChild(exSpan);

    pBtn.addEventListener('click', () => {
      Object.values(phonemeBtns).forEach((b) => b.classList.remove('active'));
      pBtn.classList.add('active');
      onChange('triggerPhoneme', item.id);
    });

    phonemeBtns[item.id] = pBtn;
    phonemeBtnGrid.appendChild(pBtn);
  });
  phonemeSection.appendChild(phonemeBtnGrid);

  // 2. Eyelid Movement & Periorbital Expression Triggers
  const eyelidSubNote = document.createElement('div');
  eyelidSubNote.className = 'sub-control-label';
  eyelidSubNote.textContent = '2. Eyelid Movement & Expressions (Tap to Trigger)';
  phonemeSection.appendChild(eyelidSubNote);

  const eyelidBtnGrid = document.createElement('div');
  eyelidBtnGrid.className = 'eyelid-btn-grid';

  const EYELID_BUTTON_LIST = [
    { id: 'OPEN', icon: '👀', label: 'Open', sub: 'neutral' },
    { id: 'BLINK', icon: '😌', label: 'Blink', sub: 'single' },
    { id: 'DOUBLE_BLINK', icon: '✨', label: '2x Blink', sub: 'flutter' },
    { id: 'WINK_L', icon: '😉', label: 'Wink L', sub: 'left eye' },
    { id: 'WINK_R', icon: '😜', label: 'Wink R', sub: 'right eye' },
    { id: 'HAPPY_SQUINT', icon: '😊', label: 'Squint', sub: 'happy lid' },
    { id: 'SLEEPY', icon: '😴', label: 'Sleepy', sub: 'half lid' },
    { id: 'WIDE_SURPRISE', icon: '😮', label: 'Wide', sub: 'surprise' },
    { id: 'CLOSED', icon: '🧘', label: 'Closed', sub: 'hold shut' }
  ];

  const eyelidBtns = {};
  EYELID_BUTTON_LIST.forEach((item) => {
    const eBtn = document.createElement('button');
    eBtn.type = 'button';
    eBtn.className = `phoneme-chip-btn eyelid-chip-btn ${item.id === 'OPEN' ? 'active' : ''}`;
    eBtn.setAttribute('aria-label', `Trigger eyelid movement ${item.label}`);

    const codeSpan = document.createElement('span');
    codeSpan.className = 'phoneme-chip-code';
    codeSpan.textContent = `${item.icon} ${item.label}`;

    const subSpan = document.createElement('span');
    subSpan.className = 'phoneme-chip-word';
    subSpan.textContent = item.sub;

    eBtn.appendChild(codeSpan);
    eBtn.appendChild(subSpan);

    eBtn.addEventListener('click', () => {
      Object.values(eyelidBtns).forEach((b) => b.classList.remove('active'));
      eBtn.classList.add('active');
      onChange('triggerEyelidPose', item.id);
    });

    eyelidBtns[item.id] = eBtn;
    eyelidBtnGrid.appendChild(eBtn);
  });
  phonemeSection.appendChild(eyelidBtnGrid);

  // 3. Direct Interactive Morph Target Sliders (Mouth Shapes + Eyelids + Brows)
  const morphSlidersHeaderRow = document.createElement('div');
  morphSlidersHeaderRow.className = 'preset-header-row';
  morphSlidersHeaderRow.style.marginTop = '8px';

  const morphSlidersTitle = document.createElement('div');
  morphSlidersTitle.className = 'sub-control-label';
  morphSlidersTitle.style.margin = '0';
  morphSlidersTitle.textContent = '3. Live Morph Target Channels (Scrub to Blend)';

  const resetMorphsBtn = document.createElement('button');
  resetMorphsBtn.type = 'button';
  resetMorphsBtn.className = 'variant-save-btn';
  resetMorphsBtn.textContent = '↺ Reset Morphs';
  resetMorphsBtn.addEventListener('click', () => {
    onChange('resetMorphTargets', true);
  });

  morphSlidersHeaderRow.appendChild(morphSlidersTitle);
  morphSlidersHeaderRow.appendChild(resetMorphsBtn);
  phonemeSection.appendChild(morphSlidersHeaderRow);

  const morphBarsContainer = document.createElement('div');
  morphBarsContainer.className = 'morph-sliders-grid';

  const MORPH_CHANNELS = [
    { key: 'jawOpen', label: 'Jaw Open (AA)', group: 'mouth' },
    { key: 'mouthWide', label: 'Smile Wide (EE)', group: 'mouth' },
    { key: 'lipRound', label: 'Lip Pucker (OO)', group: 'mouth' },
    { key: 'lipPress', label: 'Lip Press (B/M/P)', group: 'mouth' },
    { key: 'lipTuckFV', label: 'Lip Tuck (F/V)', group: 'mouth' },
    { key: 'tongueUp', label: 'Tongue Tip (L/T)', group: 'mouth' },
    { key: 'cheekPuff', label: 'Cheek Puff', group: 'mouth' },
    { key: 'browLift', label: 'Brow Arch Lift', group: 'eye' },
    { key: 'blinkLeft', label: 'Left Upper Eyelid', group: 'eye' },
    { key: 'blinkRight', label: 'Right Upper Eyelid', group: 'eye' },
    { key: 'eyeSquint', label: 'Lower Lid Squint', group: 'eye' }
  ];

  const morphBarRefs = {};
  const morphSliderInputs = {};
  const morphValSpans = {};
  let activeDraggedMorphKey = null;

  MORPH_CHANNELS.forEach((ch) => {
    const row = document.createElement('div');
    row.className = `morph-channel-control ${ch.group === 'eye' ? 'eyelid-channel' : ''}`;

    const topLine = document.createElement('div');
    topLine.className = 'morph-channel-header';

    const lbl = document.createElement('span');
    lbl.className = 'morph-bar-label';
    lbl.textContent = ch.label;

    const valSpan = document.createElement('span');
    valSpan.className = 'morph-channel-val';
    valSpan.textContent = '0%';

    topLine.appendChild(lbl);
    topLine.appendChild(valSpan);

    const sliderWrap = document.createElement('div');
    sliderWrap.className = 'morph-slider-track-wrap';

    const fill = document.createElement('div');
    fill.className = 'morph-bar-fill';
    fill.style.width = '0%';

    const rangeInput = document.createElement('input');
    rangeInput.type = 'range';
    rangeInput.className = 'morph-channel-range';
    rangeInput.min = '0';
    rangeInput.max = '1';
    rangeInput.step = '0.01';
    rangeInput.value = '0';
    rangeInput.setAttribute('aria-label', `${ch.label} morph target weight`);

    rangeInput.addEventListener('pointerdown', () => {
      activeDraggedMorphKey = ch.key;
    });
    rangeInput.addEventListener('pointerup', () => {
      activeDraggedMorphKey = null;
    });
    rangeInput.addEventListener('blur', () => {
      activeDraggedMorphKey = null;
    });
    rangeInput.addEventListener('input', () => {
      const v = parseFloat(rangeInput.value);
      const pct = Math.round(v * 100);
      fill.style.width = `${pct}%`;
      valSpan.textContent = `${pct}%`;
      onChange('setMorphTarget', { channel: ch.key, value: v });
    });

    sliderWrap.appendChild(fill);
    sliderWrap.appendChild(rangeInput);

    row.appendChild(topLine);
    row.appendChild(sliderWrap);
    morphBarsContainer.appendChild(row);

    morphBarRefs[ch.key] = fill;
    morphSliderInputs[ch.key] = rangeInput;
    morphValSpans[ch.key] = valSpan;
  });
  phonemeSection.appendChild(morphBarsContainer);

  addSlider(
    phonemeSection,
    'furReactivity',
    'Fur Facial Reactivity',
    0.0,
    2.2,
    0.05,
    (v) => `${Math.round(v * 100)}%`
  );

  // =========================================================================
  // SECTION 2: POP-UP WORD & SPELLING BUBBLES (KIDS DREAM-BUILDER EVENT)
  // =========================================================================
  const bubbleSection = addSection('Kids Word & Spelling Bubbles');

  const bubbleTopRow = document.createElement('div');
  bubbleTopRow.className = 'action-row';
  bubbleTopRow.style.marginBottom = '8px';

  let bubblesOn = state.bubblesEnabled !== false;
  const toggleBubblesBtn = document.createElement('button');
  toggleBubblesBtn.type = 'button';
  toggleBubblesBtn.className = `action-btn ${bubblesOn ? 'active' : ''}`;
  toggleBubblesBtn.textContent = bubblesOn ? '🫧 Word Bubbles: ON' : '🫧 Word Bubbles: OFF';
  toggleBubblesBtn.addEventListener('click', () => {
    bubblesOn = !bubblesOn;
    state.bubblesEnabled = bubblesOn;
    toggleBubblesBtn.textContent = bubblesOn ? '🫧 Word Bubbles: ON' : '🫧 Word Bubbles: OFF';
    toggleBubblesBtn.classList.toggle('active', bubblesOn);
    onChange('bubblesEnabled', bubblesOn);
  });

  const partyBtn = document.createElement('button');
  partyBtn.type = 'button';
  partyBtn.className = 'action-btn party-action-btn';
  partyBtn.textContent = '🎉 Bubble Party!';
  partyBtn.addEventListener('click', () => {
    bubblesOn = true;
    state.bubblesEnabled = true;
    toggleBubblesBtn.textContent = '🫧 Word Bubbles: ON';
    toggleBubblesBtn.classList.add('active');
    onChange('triggerBubbleParty', true);
  });

  bubbleTopRow.appendChild(toggleBubblesBtn);
  bubbleTopRow.appendChild(partyBtn);
  bubbleSection.appendChild(bubbleTopRow);

  // Word Level Selector
  const catLabel = document.createElement('div');
  catLabel.className = 'sub-control-label';
  catLabel.textContent = 'Spelling Level';
  bubbleSection.appendChild(catLabel);

  const catRow = document.createElement('div');
  catRow.className = 'dpr-selector-row';
  const catOpts = [
    { id: 'starter', label: '3–4 Letters' },
    { id: 'dreamer', label: '5–6 Letters' },
    { id: 'explorer', label: '7+ Letters' }
  ];

  catOpts.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dpr-pill-btn';
    btn.textContent = opt.label;
    if ((state.wordCategory || 'dreamer') === opt.id) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.wordCategory = opt.id;
      Object.values(wordCatButtons).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onChange('wordCategory', opt.id);
    });
    wordCatButtons[opt.id] = btn;
    catRow.appendChild(btn);
  });
  bubbleSection.appendChild(catRow);

  // Add Custom Spelling Word Bubble Input
  const customWordForm = document.createElement('form');
  customWordForm.className = 'custom-word-form';

  const customWordInput = document.createElement('input');
  customWordInput.type = 'text';
  customWordInput.className = 'mascot-text-input';
  customWordInput.placeholder = 'Add custom word (e.g. CASTLE)...';
  customWordInput.maxLength = 12;
  customWordInput.setAttribute('aria-label', 'Custom spelling word');

  const customWordBtn = document.createElement('button');
  customWordBtn.type = 'submit';
  customWordBtn.className = 'action-btn custom-word-submit';
  customWordBtn.textContent = '+ Pop Bubble';

  customWordForm.appendChild(customWordInput);
  customWordForm.appendChild(customWordBtn);
  customWordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const w = customWordInput.value.trim();
    if (!w) return;
    onChange('launchCustomWord', w);
    customWordInput.value = '';
  });
  bubbleSection.appendChild(customWordForm);

  // =========================================================================
  // SECTION 3: BACKGROUND & COZY SKY OPTIONS
  // =========================================================================
  const skySection = addSection('Background & Cozy Sky');

  const skyThemeGrid = document.createElement('div');
  skyThemeGrid.className = 'preset-grid';
  skyThemeGrid.style.marginBottom = '10px';

  for (const theme of COZY_SKY_THEMES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-btn';
    if ((state.skyTheme || 'daydream') === theme.id) {
      btn.classList.add('active');
    }

    const sDot = document.createElement('span');
    sDot.className = 'preset-dot';
    sDot.style.background = theme.dot;

    const sLabel = document.createElement('span');
    sLabel.className = 'preset-label';
    sLabel.textContent = theme.name;

    btn.appendChild(sDot);
    btn.appendChild(sLabel);

    btn.addEventListener('click', () => {
      state.skyTheme = theme.id;
      Object.values(skyThemeButtons).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onChange('skyTheme', theme.id);
    });

    skyThemeButtons[theme.id] = btn;
    skyThemeGrid.appendChild(btn);
  }
  skySection.appendChild(skyThemeGrid);

  addSlider(
    skySection,
    'skyCloudiness',
    'Cozy Cloud Fluff',
    0.0,
    1.8,
    0.05,
    (v) => `${Math.round(v * 100)}%`
  );
  addSlider(
    skySection,
    'skySparkle',
    'Starlight Twinkle',
    0.0,
    1.0,
    0.05,
    (v) => `${Math.round(v * 100)}%`
  );
  addSlider(
    skySection,
    'skyRainbow',
    'Rainbow Dream Arc',
    0.0,
    1.0,
    0.05,
    (v) => `${Math.round(v * 100)}%`
  );

  // =========================================================================
  // SECTION 4: COAT MATERIALS & HAIR SHADING
  // =========================================================================
  const geoSection = addSection('Coat & Hair Shading');

  const colorGrid = document.createElement('div');
  colorGrid.className = 'color-grid';

  function addColorPicker(key, labelText, fallbackHex) {
    const cell = document.createElement('label');
    cell.className = 'color-cell';

    const span = document.createElement('span');
    span.textContent = labelText;

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = sanitizeHexColor(state[key], fallbackHex);
    picker.setAttribute('aria-label', labelText);

    picker.addEventListener('input', () => {
      const safeColor = sanitizeHexColor(picker.value, state[key] || fallbackHex);
      state[key] = safeColor;
      onChange(key, safeColor);
    });

    cell.appendChild(span);
    cell.appendChild(picker);
    colorGrid.appendChild(cell);
    colorRefs[key] = picker;
  }

  addColorPicker('baseColor', 'Root Fur', '#4f35ff');
  addColorPicker('tipColor', 'Tip Fur', '#ff9ec7');
  addColorPicker('eyeColor', 'Eye Iris', '#2563eb');
  addColorPicker('cheekColor', 'Cheek Blush', '#ff5c8a');
  geoSection.appendChild(colorGrid);

  // =========================================================================
  // AI FUR PATTERN TEXTURE & 'SKIN' OVERLAY GENERATOR (gemini-3.1-flash-lite-image)
  // =========================================================================
  if (state.patternStrength === undefined) state.patternStrength = 0.0;
  if (state.patternScale === undefined) state.patternScale = 1.35;
  if (state.patternMode === undefined) state.patternMode = 0;
  if (state.patternPrompt === undefined) state.patternPrompt = '';
  if (state.patternDataUrl === undefined) state.patternDataUrl = '';

  const patternCard = document.createElement('div');
  patternCard.className = 'fur-pattern-generator-card';

  const patternTitleRow = document.createElement('div');
  patternTitleRow.className = 'fur-pattern-header-row';

  const patternTitleText = document.createElement('span');
  patternTitleText.className = 'sub-control-label';
  patternTitleText.style.margin = '0';
  patternTitleText.textContent = '🎨 AI Fur Pattern & Skin Overlay Generator';

  const patternBadge = document.createElement('span');
  patternBadge.className = 'fur-pattern-badge';
  patternBadge.textContent = state.patternStrength > 0.01 ? 'Active' : 'Solid Coat';

  patternTitleRow.appendChild(patternTitleText);
  patternTitleRow.appendChild(patternBadge);
  patternCard.appendChild(patternTitleRow);

  const patternInputRow = document.createElement('div');
  patternInputRow.className = 'base-prompt-row';

  const patternPromptInput = document.createElement('input');
  patternPromptInput.type = 'text';
  patternPromptInput.className = 'mascot-text-input';
  patternPromptInput.placeholder = 'Prompt pattern (e.g. "golden leopard rosettes", "tiger stripes")...';
  patternPromptInput.value = state.patternPrompt || '';
  patternPromptInput.setAttribute('aria-label', 'Fur pattern or skin overlay text prompt');

  const generatePatternBtn = document.createElement('button');
  generatePatternBtn.type = 'button';
  generatePatternBtn.className = 'action-btn export-code-cta-btn';
  generatePatternBtn.style.flex = '0 0 auto';
  generatePatternBtn.style.padding = '7px 11px';
  generatePatternBtn.textContent = '✨ Generate Pattern';

  patternInputRow.appendChild(patternPromptInput);
  patternInputRow.appendChild(generatePatternBtn);
  patternCard.appendChild(patternInputRow);

  // Quick-prompt preset chips for 1-click Fur Pattern & Skin Overlay generation
  const patternChipsRow = document.createElement('div');
  patternChipsRow.className = 'base-example-chips';

  FUR_PATTERN_PROMPT_EXAMPLES.forEach((ex) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'base-example-chip';
    chip.textContent = ex.label;
    chip.title = ex.prompt;
    chip.addEventListener('click', () => {
      patternPromptInput.value = ex.prompt;
      triggerPatternGeneration(ex.prompt);
    });
    patternChipsRow.appendChild(chip);
  });
  patternCard.appendChild(patternChipsRow);

  // Live 2D Texture Swatch + Status Row
  const patternPreviewRow = document.createElement('div');
  patternPreviewRow.className = 'fur-pattern-preview-row';
  patternPreviewRow.style.display = state.patternDataUrl ? 'flex' : 'none';

  const patternThumbImg = document.createElement('img');
  patternThumbImg.className = 'fur-pattern-thumb';
  patternThumbImg.alt = 'Generated fur pattern texture preview';
  if (state.patternDataUrl) {
    patternThumbImg.src = state.patternDataUrl;
  }

  const patternMetaWrap = document.createElement('div');
  patternMetaWrap.className = 'fur-pattern-meta';

  const patternStatusText = document.createElement('div');
  patternStatusText.className = 'fur-pattern-status';
  patternStatusText.textContent = state.patternPrompt
    ? `"${state.patternPrompt}"`
    : 'Triplanar 3D surface texture mapped to base geometry & fur';

  const patternSubNote = document.createElement('div');
  patternSubNote.className = 'fur-pattern-subnote';
  patternSubNote.textContent = 'Mapped onto base skin geometry & 60k fur follicles';

  patternMetaWrap.appendChild(patternStatusText);
  patternMetaWrap.appendChild(patternSubNote);

  const clearPatternBtn = document.createElement('button');
  clearPatternBtn.type = 'button';
  clearPatternBtn.className = 'ui-toggle-btn';
  clearPatternBtn.textContent = '✕ Clear';
  clearPatternBtn.title = 'Remove custom pattern overlay and return to solid root/tip coat';

  patternPreviewRow.appendChild(patternThumbImg);
  patternPreviewRow.appendChild(patternMetaWrap);
  patternPreviewRow.appendChild(clearPatternBtn);
  patternCard.appendChild(patternPreviewRow);

  // Mapping Mode Selector (Full Coat & Skin, Skin & Undercoat, Frosted Tips)
  const modeLabel = document.createElement('div');
  modeLabel.className = 'sub-control-label';
  modeLabel.style.marginTop = '6px';
  modeLabel.textContent = 'Overlay Mapping Target';
  patternCard.appendChild(modeLabel);

  const patternModeRow = document.createElement('div');
  patternModeRow.className = 'dpr-selector-row';
  const patternModeBtns = {};
  const PATTERN_MODES = [
    { id: 0, label: 'Full Coat & Skin' },
    { id: 1, label: 'Skin & Undercoat' },
    { id: 2, label: 'Frosted Tips' }
  ];

  PATTERN_MODES.forEach((m) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dpr-pill-btn';
    btn.textContent = m.label;
    if (Number(state.patternMode || 0) === m.id) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      state.patternMode = m.id;
      Object.values(patternModeBtns).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onChange('patternMode', m.id);
    });
    patternModeBtns[m.id] = btn;
    patternModeRow.appendChild(btn);
  });
  patternCard.appendChild(patternModeRow);

  addSlider(
    patternCard,
    'patternStrength',
    'Pattern Overlay Blend',
    0.0,
    1.0,
    0.02,
    (v) => `${Math.round(v * 100)}%`
  );
  addSlider(
    patternCard,
    'patternScale',
    'Pattern Tiling Scale',
    0.4,
    3.0,
    0.05,
    (v) => `${v.toFixed(2)}x`
  );

  async function triggerPatternGeneration(rawPrompt) {
    const query = String(rawPrompt ?? patternPromptInput.value).trim();
    if (!query) return;

    generatePatternBtn.disabled = true;
    generatePatternBtn.textContent = 'Painting...';
    patternBadge.textContent = 'Generating...';

    try {
      const result = await generateFurPatternFromPrompt(query, state.baseColor, state.tipColor);
      state.patternPrompt = result.prompt;
      state.patternDataUrl = result.imageUrl;
      if (!state.patternStrength || state.patternStrength < 0.15) {
        state.patternStrength = 0.88;
        if (sliderRefs.patternStrength) {
          sliderRefs.patternStrength.input.value = '0.88';
          sliderRefs.patternStrength.valSpan.textContent = '88%';
        }
      }

      patternThumbImg.src = result.imageUrl;
      patternPreviewRow.style.display = 'flex';
      patternStatusText.textContent = `"${result.prompt}"`;
      patternSubNote.textContent = result.isAI
        ? 'Generated via Gemini AI Image (gemini-3.1-flash-lite-image) · Triplanar 3D mapped'
        : 'Synthesized seamless 2D texture · Triplanar 3D mapped';
      patternBadge.textContent = result.isAI ? '✨ AI Texture' : 'Active Pattern';
      patternBadge.classList.add('active');

      onChange('applyFurPattern', {
        dataUrl: result.imageUrl,
        prompt: result.prompt,
        strength: state.patternStrength,
        scale: state.patternScale,
        mode: state.patternMode
      });
    } catch (err) {
      patternBadge.textContent = 'Error';
      console.error('Fur pattern generation error:', err);
    } finally {
      generatePatternBtn.disabled = false;
      generatePatternBtn.textContent = '✨ Generate Pattern';
    }
  }

  generatePatternBtn.addEventListener('click', () => {
    triggerPatternGeneration(patternPromptInput.value);
  });

  patternPromptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerPatternGeneration(patternPromptInput.value);
    }
  });

  clearPatternBtn.addEventListener('click', () => {
    state.patternDataUrl = '';
    state.patternPrompt = '';
    state.patternStrength = 0.0;
    patternPromptInput.value = '';
    patternPreviewRow.style.display = 'none';
    patternBadge.textContent = 'Solid Coat';
    patternBadge.classList.remove('active');
    if (sliderRefs.patternStrength) {
      sliderRefs.patternStrength.input.value = '0';
      sliderRefs.patternStrength.valSpan.textContent = '0%';
    }
    onChange('clearFurPattern', true);
  });

  geoSection.appendChild(patternCard);

  const engineModeRow = document.createElement('div');
  engineModeRow.className = 'dpr-selector-row engine-mode-row';

  const gpuFurModeBtn = document.createElement('button');
  gpuFurModeBtn.type = 'button';
  gpuFurModeBtn.className = 'dpr-pill-btn engine-mode-btn';
  gpuFurModeBtn.textContent = 'WebGPU (Default)';
  gpuFurModeBtn.setAttribute('aria-label', 'Switch to default 60k WebGPU Fur and GPGPU physics');

  const webglModeBtn = document.createElement('button');
  webglModeBtn.type = 'button';
  webglModeBtn.className = 'dpr-pill-btn engine-mode-btn';
  webglModeBtn.textContent = 'WebGL';
  webglModeBtn.setAttribute('aria-label', 'Switch to lightweight WebGL Fur fallback mode');

  engineModeRow.appendChild(gpuFurModeBtn);
  engineModeRow.appendChild(webglModeBtn);
  geoSection.appendChild(engineModeRow);

  addSlider(
    geoSection,
    'furLength',
    'Fur Length',
    0.06,
    0.62,
    0.01,
    (v) => `${(v * 2.0).toFixed(2)}" (${Math.round(v * 50.8)} mm)`
  );
  addSlider(
    geoSection,
    'furDensity',
    'Fur Density',
    0.12,
    1.0,
    0.01,
    (v) =>
      state.gpuFurEnabled
        ? `${Math.round(v * 100)}% (${Math.round(v * 60)}k)`
        : `${Math.round(v * 100)}% (WebGL)`
  );
  addSlider(
    geoSection,
    'curliness',
    'Curl / Waviness',
    0.0,
    1.0,
    0.01,
    (v) => `${Math.round(v * 100)}%`
  );
  addSlider(
    geoSection,
    'clumping',
    'Tuft Clumping',
    0.0,
    1.0,
    0.01,
    (v) => `${Math.round(v * 100)}%`
  );
  addSlider(
    geoSection,
    'roughness',
    'Roughness',
    0.06,
    0.95,
    0.01,
    (v) => v.toFixed(2)
  );
  addSlider(
    geoSection,
    'specular',
    'Specular Shine',
    0.0,
    2.0,
    0.02,
    (v) => v.toFixed(2)
  );

  // =========================================================================
  // SECTION 5: LIGHTING & WIND
  // =========================================================================
  const lightSection = addSection('Lighting & Wind');

  const keyColorCell = document.createElement('label');
  keyColorCell.className = 'color-cell';
  keyColorCell.style.marginBottom = '9px';

  const keyColorSpan = document.createElement('span');
  keyColorSpan.textContent = 'Key Light Color';

  const keyColorPicker = document.createElement('input');
  keyColorPicker.type = 'color';
  keyColorPicker.value = sanitizeHexColor(state.keyColor, '#fff7ed');
  keyColorPicker.setAttribute('aria-label', 'Key Light Color');

  keyColorPicker.addEventListener('input', () => {
    const safeColor = sanitizeHexColor(keyColorPicker.value, state.keyColor || '#fff7ed');
    state.keyColor = safeColor;
    onChange('keyColor', safeColor);
  });

  keyColorCell.appendChild(keyColorSpan);
  keyColorCell.appendChild(keyColorPicker);
  lightSection.appendChild(keyColorCell);
  colorRefs.keyColor = keyColorPicker;

  addSlider(
    lightSection,
    'lightAngle',
    'Key Light Angle',
    -180,
    180,
    1,
    (v) => `${Math.round(v)}°`
  );
  addSlider(
    lightSection,
    'lightIntensity',
    'Key Intensity',
    0.2,
    2.5,
    0.05,
    (v) => v.toFixed(2)
  );
  addSlider(
    lightSection,
    'rimIntensity',
    'Rim Scatter',
    0.0,
    2.5,
    0.05,
    (v) => v.toFixed(2)
  );
  addSlider(
    lightSection,
    'windStrength',
    'Wind Breeze',
    0.0,
    2.5,
    0.05,
    (v) => v.toFixed(2)
  );

  // --- Section 6: AR Camera Controls (Active only in AR Mode) ---
  const arSection = addSection('AR Camera Controls');
  arSection.className = 'ui-section ar-section';
  arSection.style.display = (state.environment === 'ar') ? 'block' : 'none';

  const arControlsWrap = document.createElement('div');
  arControlsWrap.className = 'ar-controls-wrap';

  const arStatusRow = document.createElement('div');
  arStatusRow.className = 'ar-status-row';

  const arStatusDot = document.createElement('span');
  arStatusDot.className = 'ar-status-dot';

  const arStatusText = document.createElement('span');
  arStatusText.className = 'ar-status-text';
  arStatusText.textContent = 'Ready for AR Camera';

  arStatusRow.appendChild(arStatusDot);
  arStatusRow.appendChild(arStatusText);
  arControlsWrap.appendChild(arStatusRow);

  const arPlaneRow = document.createElement('div');
  arPlaneRow.className = 'ar-plane-row';

  const arPlaneInfo = document.createElement('div');
  arPlaneInfo.className = 'ar-plane-info';

  const arPlaneDot = document.createElement('span');
  arPlaneDot.className = 'ar-plane-dot';

  const arPlaneText = document.createElement('span');
  arPlaneText.className = 'ar-plane-text';
  arPlaneText.textContent = 'Estimating plane from video...';

  arPlaneInfo.appendChild(arPlaneDot);
  arPlaneInfo.appendChild(arPlaneText);

  const arPlaneBadge = document.createElement('span');
  arPlaneBadge.className = 'ar-plane-badge';
  arPlaneBadge.textContent = '0 pts';

  arPlaneRow.appendChild(arPlaneInfo);
  arPlaneRow.appendChild(arPlaneBadge);
  arControlsWrap.appendChild(arPlaneRow);

  const arLightRow = document.createElement('div');
  arLightRow.className = 'ar-plane-row';

  const arLightInfo = document.createElement('div');
  arLightInfo.className = 'ar-plane-info';

  const arLightDot = document.createElement('span');
  arLightDot.className = 'ar-plane-dot';
  arLightDot.style.background = '#fffdf7';
  arLightDot.style.boxShadow = '0 0 6px rgba(253, 224, 71, 0.8)';

  const arLightText = document.createElement('span');
  arLightText.className = 'ar-plane-text';
  arLightText.textContent = 'Light Est: 5200K · 100% · -32°';

  arLightInfo.appendChild(arLightDot);
  arLightInfo.appendChild(arLightText);

  const arLightBadge = document.createElement('span');
  arLightBadge.className = 'ar-plane-badge';
  arLightBadge.textContent = '#fffdf7';

  arLightRow.appendChild(arLightInfo);
  arLightRow.appendChild(arLightBadge);
  arControlsWrap.appendChild(arLightRow);

  const arActionRow = document.createElement('div');
  arActionRow.className = 'action-row';

  let tapPlaceActive = true;
  const tapPlaceBtn = document.createElement('button');
  tapPlaceBtn.type = 'button';
  tapPlaceBtn.className = 'action-btn active';
  tapPlaceBtn.textContent = 'Tap to Place: ON';
  tapPlaceBtn.addEventListener('click', () => {
    tapPlaceActive = !tapPlaceActive;
    tapPlaceBtn.textContent = tapPlaceActive ? 'Tap to Place: ON' : 'Tap to Place: OFF';
    tapPlaceBtn.classList.toggle('active', tapPlaceActive);
    onChange('arToggleTapPlace', tapPlaceActive);
  });

  let lightEstActive = true;
  const lightEstBtn = document.createElement('button');
  lightEstBtn.type = 'button';
  lightEstBtn.className = 'action-btn active';
  lightEstBtn.textContent = 'Light Est: ON';
  lightEstBtn.addEventListener('click', () => {
    lightEstActive = !lightEstActive;
    lightEstBtn.textContent = lightEstActive ? 'Light Est: ON' : 'Light Est: OFF';
    lightEstBtn.classList.toggle('active', lightEstActive);
    onChange('arToggleLightEst', lightEstActive);
  });

  const resetPosBtn = document.createElement('button');
  resetPosBtn.type = 'button';
  resetPosBtn.className = 'action-btn';
  resetPosBtn.textContent = 'Reset';
  resetPosBtn.addEventListener('click', () => {
    onChange('arResetPosition', true);
  });

  arActionRow.appendChild(tapPlaceBtn);
  arActionRow.appendChild(lightEstBtn);
  arActionRow.appendChild(resetPosBtn);
  arControlsWrap.appendChild(arActionRow);

  const arBtnRow = document.createElement('div');
  arBtnRow.className = 'action-row';

  const mirrorBtn = document.createElement('button');
  mirrorBtn.type = 'button';
  mirrorBtn.className = 'action-btn';
  mirrorBtn.textContent = 'Mirror: ON';
  mirrorBtn.addEventListener('click', () => {
    onChange('arToggleMirror', true);
  });

  const flipBtn = document.createElement('button');
  flipBtn.type = 'button';
  flipBtn.className = 'action-btn';
  flipBtn.textContent = 'Flip / Retry Cam';
  flipBtn.addEventListener('click', () => {
    onChange('arFlipCamera', true);
  });

  arBtnRow.appendChild(mirrorBtn);
  arBtnRow.appendChild(flipBtn);
  arControlsWrap.appendChild(arBtnRow);
  arSection.appendChild(arControlsWrap);

  function updateGPUFurModeUI(isGpuFur) {
    const enabled = Boolean(isGpuFur);
    state.gpuFurEnabled = enabled;

    topGpuFurPill.classList.toggle('active', enabled);
    topGpuFurPill.setAttribute('aria-pressed', String(enabled));
    topGpuLabel.textContent = enabled ? 'WebGPU Fur: ON' : 'WebGL Mode: ON';

    webglModeBtn.classList.toggle('active', !enabled);
    webglModeBtn.setAttribute('aria-pressed', String(!enabled));
    gpuFurModeBtn.classList.toggle('active', enabled);
    gpuFurModeBtn.setAttribute('aria-pressed', String(enabled));

    if (sliderRefs.furDensity) {
      sliderRefs.furDensity.valSpan.textContent = sliderRefs.furDensity.formatFn(state.furDensity);
    }
  }

  topGpuFurPill.addEventListener('click', () => {
    const next = !state.gpuFurEnabled;
    updateGPUFurModeUI(next);
    onChange('toggleGPUFur', next);
  });

  webglModeBtn.addEventListener('click', () => {
    if (state.gpuFurEnabled) {
      updateGPUFurModeUI(false);
      onChange('toggleGPUFur', false);
    }
  });

  gpuFurModeBtn.addEventListener('click', () => {
    if (!state.gpuFurEnabled) {
      updateGPUFurModeUI(true);
      onChange('toggleGPUFur', true);
    }
  });

  updateGPUFurModeUI(Boolean(state.gpuFurEnabled));

  function updateEnvSelectionUI(activeId) {
    const safeId = sanitizeEnvId(activeId, 'meadow');
    Object.keys(sceneButtons).forEach((id) => {
      const isSel = id === safeId;
      sceneButtons[id].classList.toggle('active', isSel);
      sceneButtons[id].setAttribute('aria-selected', String(isSel));
    });
    Object.keys(mobileSceneButtons).forEach((id) => {
      const isSel = id === safeId;
      mobileSceneButtons[id].classList.toggle('active', isSel);
      mobileSceneButtons[id].setAttribute('aria-selected', String(isSel));
    });
    const matchedPreset = ENVIRONMENT_PRESETS.find((e) => e.id === safeId);
    if (matchedPreset && mobileBtnScene) {
      mobileBtnScene.textContent = matchedPreset.name;
    }
    if (arSection) {
      arSection.style.display = safeId === 'ar' ? 'block' : 'none';
    }
  }

  // =========================================================================
  // 8. MASCOT CODE & CONFIG EXPORTER MODAL (REUSABLE CORE ONLY, NO STUDIO UI)
  // =========================================================================
  let exportModalBackdrop = document.getElementById('mascot-export-modal');
  if (!exportModalBackdrop) {
    exportModalBackdrop = document.createElement('div');
    exportModalBackdrop.id = 'mascot-export-modal';
    exportModalBackdrop.className = 'mascot-export-modal-backdrop';
    exportModalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(exportModalBackdrop);
  }
  exportModalBackdrop.replaceChildren();

  const modalCard = document.createElement('div');
  modalCard.className = 'mascot-export-modal-card';
  modalCard.setAttribute('role', 'dialog');
  modalCard.setAttribute('aria-labelledby', 'mascot-export-modal-title');
  exportModalBackdrop.appendChild(modalCard);

  const modalHeader = document.createElement('div');
  modalHeader.className = 'mascot-export-modal-header';

  const modalTitleBlock = document.createElement('div');
  const modalTitle = document.createElement('h2');
  modalTitle.id = 'mascot-export-modal-title';
  modalTitle.className = 'mascot-export-title';
  modalTitle.textContent = 'Export Reusable Mascot Code';

  const modalSub = document.createElement('p');
  modalSub.className = 'mascot-export-subtitle';
  modalSub.textContent =
    'Self-contained mascot core: WebGL2/WebGPU fur system, shaders, 8-channel phoneme morph targets & basic animations — zero studio UI.';

  modalTitleBlock.appendChild(modalTitle);
  modalTitleBlock.appendChild(modalSub);

  const closeModalBtn = document.createElement('button');
  closeModalBtn.type = 'button';
  closeModalBtn.className = 'ui-toggle-btn';
  closeModalBtn.textContent = 'Close';
  closeModalBtn.addEventListener('click', () => {
    exportModalBackdrop.classList.remove('visible');
    exportModalBackdrop.setAttribute('aria-hidden', 'true');
  });

  modalHeader.appendChild(modalTitleBlock);
  modalHeader.appendChild(closeModalBtn);
  modalCard.appendChild(modalHeader);

  // Modal Tabs: Complete Bundle | Core Mascot Module | Editable Config JSON | Usage Example
  const modalTabsRow = document.createElement('div');
  modalTabsRow.className = 'mascot-export-tabs';

  const EXPORT_TABS = [
    { id: 'bundle', label: 'Full Export Bundle (Core + Usage)' },
    { id: 'core', label: 'Core Mascot Module (furryMascot.js)' },
    { id: 'config', label: 'Editable Config (JSON)' },
    { id: 'usage', label: 'AI Voice Usage Example' }
  ];

  let activeExportTab = 'bundle';
  const tabBtns = {};

  const codeEditorArea = document.createElement('textarea');
  codeEditorArea.className = 'mascot-export-textarea';
  codeEditorArea.spellcheck = false;

  const modalFooter = document.createElement('div');
  modalFooter.className = 'mascot-export-footer';

  const footerStatus = document.createElement('span');
  footerStatus.className = 'mascot-export-status';
  footerStatus.textContent = 'Ready to drop into any Three.js / AI Voice project.';

  const footerActions = document.createElement('div');
  footerActions.className = 'mascot-export-actions';

  const applyConfigBtn = document.createElement('button');
  applyConfigBtn.type = 'button';
  applyConfigBtn.className = 'action-btn';
  applyConfigBtn.textContent = 'Apply JSON to Live Mascot';
  applyConfigBtn.style.display = 'none';

  const copyCodeBtn = document.createElement('button');
  copyCodeBtn.type = 'button';
  copyCodeBtn.className = 'action-btn export-code-cta-btn';
  copyCodeBtn.textContent = 'Copy Code';

  const downloadCodeBtn = document.createElement('button');
  downloadCodeBtn.type = 'button';
  downloadCodeBtn.className = 'action-btn';
  downloadCodeBtn.textContent = 'Download .js';

  footerActions.appendChild(applyConfigBtn);
  footerActions.appendChild(copyCodeBtn);
  footerActions.appendChild(downloadCodeBtn);
  modalFooter.appendChild(footerStatus);
  modalFooter.appendChild(footerActions);

  function refreshExportTabContent() {
    const bundle = generateMascotExportBundle(state);
    const mascotSlug = (state.mascotName || 'mr-m')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'mascot';

    Object.keys(tabBtns).forEach((id) => {
      tabBtns[id].classList.toggle('active', id === activeExportTab);
    });

    if (activeExportTab === 'config') {
      codeEditorArea.readOnly = false;
      codeEditorArea.value = JSON.stringify(bundle.configObj, null, 2);
      applyConfigBtn.style.display = 'inline-flex';
      downloadCodeBtn.textContent = `Download ${mascotSlug}.config.json`;
      footerStatus.textContent =
        'Edit JSON values directly and click "Apply JSON to Live Mascot" to update the 3D preview.';
    } else {
      codeEditorArea.readOnly = true;
      applyConfigBtn.style.display = 'none';
      downloadCodeBtn.textContent = `Download ${mascotSlug}-mascot.js`;
      if (activeExportTab === 'core') {
        codeEditorArea.value = bundle.coreModuleCode;
        footerStatus.textContent =
          'Core module only: renderer, 64-shell + 60k-strand fur, morph targets & basic animations.';
      } else if (activeExportTab === 'usage') {
        codeEditorArea.value = bundle.usageExampleCode;
        footerStatus.textContent =
          'Example showing how to instantiate and drive lip-sync from an AI voice or TTS stream.';
      } else {
        codeEditorArea.value = bundle.combinedExportCode;
        footerStatus.textContent =
          'Complete reusable ES module + config + AI voice usage example (no studio UI).';
      }
    }
  }

  EXPORT_TABS.forEach((tab) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mascot-export-tab-btn';
    b.textContent = tab.label;
    b.addEventListener('click', () => {
      activeExportTab = tab.id;
      refreshExportTabContent();
    });
    tabBtns[tab.id] = b;
    modalTabsRow.appendChild(b);
  });

  modalCard.appendChild(modalTabsRow);
  modalCard.appendChild(codeEditorArea);
  modalCard.appendChild(modalFooter);

  applyConfigBtn.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(codeEditorArea.value);
      if (parsed.name) {
        state.mascotName = String(parsed.name).slice(0, 24);
        nameInput.value = state.mascotName;
        onChange('mascotName', state.mascotName);
      }
      if (parsed.archetype) {
        state.archetype = String(parsed.archetype);
        archetypeBadge.textContent = state.archetype;
      }
      const flatKeys = [
        'baseColor',
        'tipColor',
        'eyeColor',
        'cheekColor',
        'hatColor',
        'beakColor',
        'earStyle',
        'muzzleStyle',
        'accessory',
        'bodyRoundness',
        'earSize',
        'snoutLength',
        'headToBodyRatio',
        'eyeScale',
        'furLength',
        'furDensity',
        'roughness',
        'specular',
        'clumping',
        'curliness',
        'furReactivity'
      ];
      flatKeys.forEach((k) => {
        if (parsed[k] !== undefined) {
          state[k] = parsed[k];
          onChange(k, parsed[k]);
        }
      });
      if (parsed.lighting && typeof parsed.lighting === 'object') {
        ['keyColor', 'lightAngle', 'lightIntensity', 'rimIntensity', 'windStrength'].forEach((lk) => {
          if (parsed.lighting[lk] !== undefined) {
            state[lk] = parsed.lighting[lk];
            onChange(lk, parsed.lighting[lk]);
          }
        });
      }
      if (parsed.gpuFurEnabled !== undefined) {
        state.gpuFurEnabled = Boolean(parsed.gpuFurEnabled);
        onChange('toggleGPUFur', state.gpuFurEnabled);
      }
      Object.keys(sliderRefs).forEach((k) => {
        if (state[k] !== undefined) {
          sliderRefs[k].input.value = String(state[k]);
          sliderRefs[k].valSpan.textContent = sliderRefs[k].formatFn(state[k]);
        }
      });
      Object.keys(colorRefs).forEach((k) => {
        if (state[k] !== undefined) {
          colorRefs[k].value = state[k];
        }
      });
      if (state.earStyle && earButtons[state.earStyle]) {
        Object.values(earButtons).forEach((b) => b.classList.remove('active'));
        earButtons[state.earStyle].classList.add('active');
      }
      if (state.muzzleStyle && muzzleButtons[state.muzzleStyle]) {
        Object.values(muzzleButtons).forEach((b) => b.classList.remove('active'));
        muzzleButtons[state.muzzleStyle].classList.add('active');
      }
      if (state.accessory && accButtons[state.accessory]) {
        Object.values(accButtons).forEach((b) => b.classList.remove('active'));
        accButtons[state.accessory].classList.add('active');
      }
      footerStatus.textContent = `Applied updated config to "${state.mascotName}"!`;
    } catch (err) {
      footerStatus.textContent = `Invalid JSON: ${err.message}`;
    }
  });

  copyCodeBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codeEditorArea.value);
      copyCodeBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyCodeBtn.textContent = 'Copy Code';
      }, 1600);
    } catch {
      codeEditorArea.select();
      document.execCommand('copy');
      copyCodeBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyCodeBtn.textContent = 'Copy Code';
      }, 1600);
    }
  });

  downloadCodeBtn.addEventListener('click', () => {
    const mascotSlug = (state.mascotName || 'mr-m')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'mascot';
    const isJson = activeExportTab === 'config';
    const filename = isJson ? `${mascotSlug}.config.json` : `${mascotSlug}-mascot.js`;
    const blob = new Blob([codeEditorArea.value], {
      type: isJson ? 'application/json;charset=utf-8' : 'text/javascript;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  exportModalBackdrop.addEventListener('click', (e) => {
    if (e.target === exportModalBackdrop) {
      exportModalBackdrop.classList.remove('visible');
      exportModalBackdrop.setAttribute('aria-hidden', 'true');
    }
  });

  function openExportModal(tabId = 'bundle') {
    activeExportTab = tabId;
    refreshExportTabContent();
    exportModalBackdrop.classList.add('visible');
    exportModalBackdrop.setAttribute('aria-hidden', 'false');
  }

  return {
    openExportModal,
    getMascotConfig: () => extractMascotConfig(state),
    getExportBundle: () => generateMascotExportBundle(state),
    syncUI() {
      Object.keys(sliderRefs).forEach((k) => {
        if (state[k] !== undefined) {
          sliderRefs[k].input.value = String(state[k]);
          sliderRefs[k].valSpan.textContent = sliderRefs[k].formatFn(state[k]);
        }
      });
      Object.keys(colorRefs).forEach((k) => {
        if (state[k] !== undefined) {
          colorRefs[k].value = state[k];
        }
      });
      if (state.skyTheme && skyThemeButtons[state.skyTheme]) {
        Object.values(skyThemeButtons).forEach((b) => b.classList.remove('active'));
        skyThemeButtons[state.skyTheme].classList.add('active');
      }
      updateEnvSelectionUI(state.environment || 'meadow');
      updateGPUFurModeUI(Boolean(state.gpuFurEnabled));
    },
    setGPUFurEnabled(enabled) {
      updateGPUFurModeUI(Boolean(enabled));
    },
    setActiveEnvironment(envId) {
      const safeEnv = sanitizeEnvId(envId, 'meadow');
      state.environment = safeEnv;
      updateEnvSelectionUI(safeEnv);
    },
    setARStatus(statusText, isLive) {
      arStatusText.textContent = String(statusText || '');
      arStatusDot.classList.toggle('live', Boolean(isLive));
    },
    setARPlaneStatus(surfaceType, planeY, confidence, featureCount) {
      const confPct = Math.round((confidence || 0.9) * 100);
      arPlaneText.textContent = `${surfaceType} (${confPct}% conf)`;
      arPlaneBadge.textContent = `${featureCount || 0} pts`;
    },
    setARLightStatus(lightInfo) {
      if (!lightInfo) return;
      const safeHex = sanitizeHexColor(lightInfo.keyColor, '#fffdf7');
      if (lightInfo.isManualReset) {
        arLightDot.style.background = '#94a3b8';
        arLightDot.style.boxShadow = 'none';
        arLightText.textContent = 'Light Est: OFF (Manual Studio Light)';
        arLightBadge.textContent = 'MANUAL';
      } else {
        arLightDot.style.background = safeHex;
        arLightDot.style.boxShadow = `0 0 8px ${safeHex}`;
        arLightText.textContent = `Webcam Light: ${lightInfo.kelvin || 5200}K · ${lightInfo.luminancePct || 100}% · ${Math.round(lightInfo.lightAngle || 0)}°`;
        arLightBadge.textContent = safeHex;
      }
      if (colorRefs.keyColor) {
        colorRefs.keyColor.value = safeHex;
      }
      ['lightAngle', 'lightIntensity', 'rimIntensity'].forEach((k) => {
        if (sliderRefs[k] && state[k] !== undefined) {
          sliderRefs[k].input.value = String(state[k]);
          sliderRefs[k].valSpan.textContent = sliderRefs[k].formatFn(state[k]);
        }
      });
    },
    setLightEstActive(isActive) {
      lightEstActive = Boolean(isActive);
      lightEstBtn.textContent = lightEstActive ? 'Light Est: ON' : 'Light Est: OFF';
      lightEstBtn.classList.toggle('active', lightEstActive);
    },
    setSurfaceTrackedStatus(isLocked, confidence) {
      if (isLocked) {
        arPlaneDot.style.background = '#4ade80';
        arPlaneDot.style.boxShadow = '0 0 6px rgba(74, 222, 128, 0.8)';
        arPlaneBadge.textContent = `${confidence}% lock`;
        arPlaneBadge.style.color = '#86efac';
        arPlaneBadge.style.borderColor = '#4ade80';
      } else {
        arPlaneDot.style.background = '#38bdf8';
        arPlaneDot.style.boxShadow = '0 0 6px rgba(56, 189, 248, 0.7)';
        arPlaneBadge.style.color = '#7dd3fc';
        arPlaneBadge.style.borderColor = 'rgba(56, 189, 248, 0.35)';
      }
    },
    setTapPlaceActive(isActive) {
      tapPlaceActive = Boolean(isActive);
      tapPlaceBtn.textContent = tapPlaceActive ? 'Tap to Place: ON' : 'Tap to Place: OFF';
      tapPlaceBtn.classList.toggle('active', tapPlaceActive);
    },
    setMirrorLabel(isMirrored) {
      mirrorBtn.textContent = isMirrored ? 'Mirror: ON' : 'Mirror: OFF';
    },
    updatePhonemeTelemetry(telemetry) {
      if (!telemetry) return;
      const ph = telemetry.activePhoneme || 'SIL';
      phonemeActiveBadge.textContent = telemetry.activeVisemeLabel || ph;
      phonemeActiveBadge.classList.toggle('speaking', Boolean(telemetry.isSpeaking));

      if (telemetry.activeEyelidLabel) {
        eyelidActiveBadge.textContent = telemetry.activeEyelidLabel;
      }
      const eyePose = telemetry.activeEyelidPose || 'OPEN';
      eyelidActiveBadge.classList.toggle('speaking', eyePose !== 'OPEN');

      Object.keys(phonemeBtns).forEach((k) => {
        phonemeBtns[k].classList.toggle('active', k === ph);
      });

      Object.keys(eyelidBtns).forEach((k) => {
        eyelidBtns[k].classList.toggle('active', k === eyePose);
      });

      const activeTestIdx = telemetry.activeTestStepIndex ?? -1;
      autoLipSyncTestBtn.classList.toggle('active', activeTestIdx >= 0);
      autoLipSyncTestBtn.textContent =
        activeTestIdx >= 0
          ? `🔊 Playing Lip-Sync Test (${TEST_SEQUENCE_STEPS[activeTestIdx]?.token || ''})...`
          : '▶️ Auto-Lip-Sync Test';

      testStepBadges.forEach((pill, idx) => {
        pill.classList.toggle('active', idx === activeTestIdx);
        pill.classList.toggle('completed', activeTestIdx > idx);
      });

      if (telemetry.weights) {
        Object.keys(morphBarRefs).forEach((k) => {
          const rawWeight = Math.min(1.0, Math.max(0.0, telemetry.weights[k] || 0));
          const pct = Math.round(rawWeight * 100);
          morphBarRefs[k].style.width = `${pct}%`;
          if (morphValSpans[k]) {
            morphValSpans[k].textContent = `${pct}%`;
          }
          if (morphSliderInputs[k] && activeDraggedMorphKey !== k) {
            morphSliderInputs[k].value = rawWeight.toFixed(2);
          }
        });
      }
    }
  };
}
