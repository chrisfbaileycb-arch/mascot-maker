/**
 * Mascot Maker Studio — Clean Export Code Generator
 * Produces self-contained, drop-in ES module code for ONLY the mascot core:
 * - Renderer / Scene attachment
 * - Hybrid GPU Fur System (64 Shells + 60,000 Strands + Marschner Hair BSDF + GPGPU Verlet Physics)
 * - 8-Channel Phoneme-to-Viseme Facial Morph Targets
 * - Basic Animations & External AI-Voice Control API (talk, wave, blink, playPhoneme, setExpression, setConfig)
 * - Zero Studio UI, Zero Word Bubbles, Zero Environment Bloat
 */

export function extractMascotConfig(state) {
  return {
    name: state.mascotName || 'Mr. M',
    archetype: state.archetype || 'Dream Mascot',
    baseColor: state.baseColor || '#4f35ff',
    tipColor: state.tipColor || '#ff9ec7',
    eyeColor: state.eyeColor || '#2563eb',
    cheekColor: state.cheekColor || '#ff5c8a',
    earStyle: state.earStyle || 'bunny',
    muzzleStyle: state.muzzleStyle || 'button',
    accessory: state.accessory || 'antennae',
    hatColor: state.hatColor || '#dc2626',
    beakColor: state.beakColor || '#f59e0b',
    bodyRoundness: Number((state.bodyRoundness ?? 1.0).toFixed(2)),
    earSize: Number((state.earSize ?? 1.0).toFixed(2)),
    snoutLength: Number((state.snoutLength ?? 0.25).toFixed(2)),
    headToBodyRatio: Number((state.headToBodyRatio ?? 1.0).toFixed(2)),
    eyeScale: Number((state.eyeScale ?? 1.0).toFixed(2)),
    furLength: Number((state.furLength ?? 0.32).toFixed(3)),
    furDensity: Number((state.furDensity ?? 0.78).toFixed(3)),
    roughness: Number((state.roughness ?? 0.75).toFixed(3)),
    specular: Number((state.specular ?? 0.28).toFixed(3)),
    clumping: Number((state.clumping ?? 0.35).toFixed(3)),
    curliness: Number((state.curliness ?? 0.25).toFixed(3)),
    furReactivity: Number((state.furReactivity ?? 1.15).toFixed(2)),
    patternPrompt: state.patternPrompt || '',
    patternStrength: Number((state.patternStrength ?? 0.0).toFixed(2)),
    patternScale: Number((state.patternScale ?? 1.35).toFixed(2)),
    patternMode: Number(state.patternMode ?? 0),
    ...(state.patternDataUrl ? { patternDataUrl: state.patternDataUrl } : {}),
    lighting: {
      keyColor: state.keyColor || '#fff7ed',
      lightAngle: Math.round(state.lightAngle ?? -42),
      lightIntensity: Number((state.lightIntensity ?? 1.55).toFixed(2)),
      rimIntensity: Number((state.rimIntensity ?? 1.45).toFixed(2)),
      windStrength: Number((state.windStrength ?? 0.70).toFixed(2))
    },
    gpuFurEnabled: state.gpuFurEnabled !== false
  };
}

export function generateConfigCode(state) {
  const cfg = extractMascotConfig(state);
  return `// ============================================================================
// 1. MASCOT CONFIGURATION (${cfg.name})
// Drop-in appearance, fur shader, and lighting preset
// ============================================================================
export const MASCOT_CONFIG = ${JSON.stringify(cfg, null, 2)};
`;
}

export function generateUsageExampleCode(state) {
  const cfg = extractMascotConfig(state);
  return `// ============================================================================
// 2. USAGE EXAMPLE — Mounting "${cfg.name}" in Another App / AI Voice Agent
// ============================================================================
import { createFurryMascot, MASCOT_CONFIG } from './furryMascot.js';

// --- Option A: Mount with its own WebGL2 Renderer inside a DOM container ---
const container = document.getElementById('mascot-container');
const mascot = createFurryMascot({
  container,
  config: MASCOT_CONFIG
});

// --- Option B: Attach into an existing Three.js Scene & Render Loop ---
// const mascot = createFurryMascot({
//   scene: existingThreeScene,
//   renderer: existingThreeRenderer,
//   camera: existingThreeCamera,
//   config: MASCOT_CONFIG,
//   autoRender: false
// });
// // Then inside your own requestAnimationFrame loop:
// mascot.update(deltaSeconds);

// ============================================================================
// CONTROLLING THE MASCOT FROM AN AI VOICE / TTS PIPELINE
// ============================================================================

// 1. Trigger basic animations
mascot.wave(2.4);            // Friendly two-paw wave
mascot.blink(true);          // Expressive wink (false = double blink)
mascot.boop();               // Joyful squash-and-stretch bounce + fur ripple

// 2. Drive lip-sync directly from Phoneme / Viseme cues
// Supported phonemes: 'AA', 'EE', 'IH', 'OH', 'OO', 'BMP', 'FV', 'L_TH', 'SH_CH', 'WQ', 'KG', 'SIL'
mascot.playPhoneme('AA', 0.45, 1.0);

// 3. Drive continuous coarticulated speech or connect an audio amplitude envelope
mascot.talk(3.0);            // Runs procedural coarticulated phoneme lip-sync for 3.0s

// Or stream real-time audio / phoneme weights per frame from your TTS / WebAudio analyser:
mascot.setExpression({
  talking: true,
  phoneme: 'EE',             // Optional phoneme preset ID
  mouthOpen: 0.65,           // [0..1] vertical mandible drop
  smile: 0.80,               // [0..1] zygomatic smile stretch
  energy: 0.75               // [0..1] vocal emphasis & brow lift
});

// 4. Live-update appearance at runtime
mascot.setConfig({
  baseColor: '${cfg.baseColor}',
  tipColor: '${cfg.tipColor}',
  earStyle: '${cfg.earStyle}',
  accessory: '${cfg.accessory}'
});
`;
}

export function generateCoreMascotCode(state) {
  const cfg = extractMascotConfig(state);
  return `// ============================================================================
// ${cfg.name.toUpperCase()} — REUSABLE 3D GPU FUR MASCOT CORE MODULE
// Exports only the mascot core:
//   - WebGL2 Renderer (or attach to existing Three.js Scene)
//   - 64-Shell + 60,000-Strand GPU Fur System & GPGPU Verlet Physics
//   - 8-Channel Phoneme-to-Viseme Facial Morph Targets
//   - Basic Animations & External Control API (talk, wave, blink, playPhoneme, setExpression)
//   - Zero Studio UI
// ============================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createBlobCreature, VISEME_PRESETS, EYELID_PRESETS } from './blobCreature.js';
import { createGPUFurPhysics } from './gpuPhysics.js';
import { createGPUFurSystem } from './furSystem.js';

export const MASCOT_CONFIG = ${JSON.stringify(cfg, null, 2)};

export { VISEME_PRESETS, EYELID_PRESETS };

/**
 * Instantiates the customizable 3D furry mascot in either:
 * 1) Standalone Canvas Mode (pass \`{ container }\`)
 * 2) Existing Three.js Scene Mode (pass \`{ scene, renderer, camera, autoRender: false }\`)
 */
export function createFurryMascot({
  container = null,
  scene: externalScene = null,
  renderer: externalRenderer = null,
  camera: externalCamera = null,
  config: userConfig = {},
  autoRender = true,
  enableControls = true,
  enablePointerInteraction = true
} = {}) {
  const config = {
    ...MASCOT_CONFIG,
    ...userConfig,
    lighting: {
      ...MASCOT_CONFIG.lighting,
      ...(userConfig.lighting || {})
    }
  };

  const ownsRenderer = !externalRenderer;
  const ownsScene = !externalScene;

  const width = container ? container.clientWidth || window.innerWidth : window.innerWidth;
  const height = container ? container.clientHeight || window.innerHeight : window.innerHeight;

  // 1. Renderer setup (or reuse host application renderer)
  const renderer =
    externalRenderer ||
    new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true
    });

  if (ownsRenderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (container) {
      container.appendChild(renderer.domElement);
    }
  }

  // 2. Scene & Studio Environment Map
  const scene = externalScene || new THREE.Scene();
  let envRT = null;
  if (ownsScene) {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();
  }

  // 3. Camera & OrbitControls
  const camera =
    externalCamera ||
    new THREE.PerspectiveCamera(42, width / Math.max(1, height), 0.1, 80);
  if (!externalCamera) {
    camera.position.set(0.0, 0.45, 6.4);
  }

  let controls = null;
  if (enableControls && renderer.domElement) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.6;
    controls.maxDistance = 15.0;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0, 0.05, 0);
  }

  // 4. 3-Point Studio Lighting & Contact Shadow (when owning scene)
  const lightCfg = config.lighting;
  const rad = ((lightCfg.lightAngle ?? -42) * Math.PI) / 180.0;
  const lx = Math.sin(rad) * 2.8;
  const ly = 2.1;
  const lz = Math.cos(rad) * 2.8;

  let keyLight = null;
  let rimLight = null;
  let hemiLight = null;
  let shadowMesh = null;

  if (ownsScene) {
    keyLight = new THREE.DirectionalLight(lightCfg.keyColor, lightCfg.lightIntensity * 1.35);
    keyLight.position.set(lx, ly, lz);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    rimLight = new THREE.DirectionalLight('#c4b5fd', lightCfg.rimIntensity * 1.15);
    rimLight.position.set(-2.4, 1.8, -3.2);
    scene.add(rimLight);

    hemiLight = new THREE.HemisphereLight('#f5d0fe', '#1e1b4b', 0.85);
    scene.add(hemiLight);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0.0, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.45, 'rgba(4, 4, 12, 0.34)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 2.7),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(shadowCanvas),
        transparent: true,
        depthWrite: false
      })
    );
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.94;
    scene.add(shadowMesh);
  }

  // 5. Mascot Mesh, Parametric Base Shape, 8-Channel Viseme Morph Targets, 64 Fur Shells & 60k Strands
  const creature = createBlobCreature();
  creature.setMascotStyle({
    earStyle: config.earStyle,
    muzzleStyle: config.muzzleStyle,
    accessory: config.accessory,
    eyeColor: config.eyeColor,
    cheekColor: config.cheekColor,
    hatColor: config.hatColor,
    beakColor: config.beakColor,
    bodyRoundness: config.bodyRoundness,
    earSize: config.earSize,
    snoutLength: config.snoutLength,
    headToBodyRatio: config.headToBodyRatio,
    eyeScale: config.eyeScale,
    furReactivity: config.furReactivity
  });
  creature.skinMaterial.color.set(config.baseColor).multiplyScalar(0.55);
  scene.add(creature.root);

  const gpuPhysics = createGPUFurPhysics(renderer);
  const furParams = {
    ...config,
    lightIntensity: lightCfg.lightIntensity,
    rimIntensity: lightCfg.rimIntensity,
    windStrength: lightCfg.windStrength,
    gpuFurEnabled: config.gpuFurEnabled && gpuPhysics.isGPGPUActive
  };

  const furSystem = createGPUFurSystem(creature.bodyGeometry, furParams);
  furSystem.sharedUniforms.uKeyLightDir.value.set(lx, ly, lz).normalize();
  furSystem.sharedUniforms.uKeyLightColor.value.set(lightCfg.keyColor);
  creature.root.add(furSystem.shellMesh);
  creature.root.add(furSystem.strandMesh);

  // 6. Pointer Combing & Click-to-Boop
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2(0, 0);
  const pointerLocalPos = new THREE.Vector3(0, 0, 2);
  const prevPointerLocalPos = new THREE.Vector3(0, 0, 2);
  const pointerVelocity = new THREE.Vector3(0, 0, 0);
  let isPointerOverCreature = false;
  let boopShockwave = 0.0;

  function onPointerMove(e) {
    if (!enablePointerInteraction) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNDC.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2.0 - 1.0;
    pointerNDC.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2.0 + 1.0;

    raycaster.setFromCamera(pointerNDC, camera);
    const hits = raycaster.intersectObject(creature.bodyMesh, false);
    if (hits.length > 0) {
      prevPointerLocalPos.copy(pointerLocalPos);
      pointerLocalPos.copy(hits[0].point);
      creature.root.worldToLocal(pointerLocalPos);
      if (isPointerOverCreature) {
        pointerVelocity.subVectors(pointerLocalPos, prevPointerLocalPos).multiplyScalar(32.0);
      }
      isPointerOverCreature = true;
    } else {
      isPointerOverCreature = false;
      pointerVelocity.multiplyScalar(0.5);
    }
  }

  window.addEventListener('pointermove', onPointerMove);

  // 7. Frame Update Step (can be called manually or via internal loop)
  let elapsedTime = 0.0;
  const webglInertiaDisp = new THREE.Vector3();
  const webglInertiaVel = new THREE.Vector3();
  const webglForceTmp = new THREE.Vector3();

  function update(dt) {
    const safeDt = Math.min(Math.max(dt, 0.001), 0.033);
    elapsedTime += safeDt;

    if (controls) controls.update();
    boopShockwave = boopShockwave > 0.001 ? boopShockwave * Math.exp(-safeDt * 2.8) : 0.0;
    pointerVelocity.multiplyScalar(Math.exp(-safeDt * 12.0));

    creature.update(safeDt, pointerNDC, camera.position, false);

    if (shadowMesh) {
      const shadowScale = 1.0 - creature.root.position.y * 0.45;
      shadowMesh.scale.set(shadowScale, shadowScale, 1.0);
      shadowMesh.position.x = creature.root.position.x * 0.7;
    }

    let physicsTexture = gpuPhysics.fallbackTexture;
    if (furSystem.isGPUFurEnabled()) {
      physicsTexture = gpuPhysics.step({
        time: elapsedTime,
        dt: safeDt,
        windStrength: lightCfg.windStrength,
        creatureVelocity: creature.animState.velocity,
        creatureAngularVel: creature.animState.angularVelocity,
        pointerLocalPos,
        pointerVelocity,
        pointerActive: isPointerOverCreature,
        boopShockwave,
        facialMorphVel: creature.animState.facialMorphVel,
        facialMorphState: creature.animState.facialMorphState
      });
    } else {
      webglForceTmp.set(0, -0.32, 0);
      webglForceTmp.addScaledVector(creature.animState.velocity, -1.65);
      webglForceTmp.y -= creature.animState.facialMorphVel.x * 2.4;
      webglForceTmp.z += creature.animState.facialMorphVel.z * 2.2;
      if (isPointerOverCreature) webglForceTmp.addScaledVector(pointerVelocity, 0.85);
      webglForceTmp.addScaledVector(webglInertiaDisp, -24.0);
      webglInertiaVel.addScaledVector(webglForceTmp, safeDt);
      webglInertiaVel.multiplyScalar(Math.exp(-5.5 * safeDt));
      webglInertiaDisp.addScaledVector(webglInertiaVel, safeDt);
    }

    const u = furSystem.sharedUniforms;
    u.uPhysicsTex.value = physicsTexture;
    u.uTime.value = elapsedTime;
    u.uPointerLocalPos.value.copy(pointerLocalPos);
    u.uPointerActive.value = isPointerOverCreature ? 1.0 : 0.0;
    u.uWebGLInertia.value.copy(webglInertiaDisp);
    u.uBoopShockwave.value = boopShockwave;

    u.uTalkMorph.value = creature.animState.talkMorph;
    u.uTalkSmile.value = creature.animState.talkSmile;
    u.uWaveAmount.value = creature.animState.waveAmount;
    u.uWavePhase.value = creature.animState.wavePhase;
    u.uEarBounce.value = creature.animState.earBounce;
    u.uEarStyle.value = creature.animState.earStyleCode;
    if (u.uBaseShapeA) u.uBaseShapeA.value.copy(creature.animState.baseShapeA);
    if (u.uBaseShapeB) u.uBaseShapeB.value.copy(creature.animState.baseShapeB);
    u.uVisemeWeightsA.value.copy(creature.animState.visemeWeightsA);
    u.uVisemeWeightsB.value.copy(creature.animState.visemeWeightsB);
    u.uFacialMorphVel.value.copy(creature.animState.facialMorphVel);
  }

  const clock = new THREE.Clock();
  let rafId = 0;
  if (autoRender) {
    const loop = () => {
      rafId = requestAnimationFrame(loop);
      update(clock.getDelta());
      renderer.render(scene, camera);
    };
    loop();
  }

  // 8. Public External Control API for Host Apps & AI Voice Agents
  return {
    root: creature.root,
    creature,
    furSystem,
    renderer,
    scene,
    camera,
    controls,
    visemePresets: VISEME_PRESETS,
    eyelidPresets: EYELID_PRESETS,
    update,
    talk(duration = 2.6) {
      creature.triggerHappyTalkDemo(duration);
      boopShockwave = 0.55;
    },
    playAutoLipSyncTest() {
      creature.playAutoLipSyncTest();
      boopShockwave = 0.65;
    },
    playLipSyncPhrase(text) {
      creature.playLipSyncPhrase(text);
    },
    wave(duration = 2.4) {
      creature.triggerWave(duration);
      boopShockwave = 0.65;
    },
    blink(wink = false) {
      creature.triggerBlink(wink);
    },
    playEyelidPose(poseKey, duration = 1.4) {
      creature.triggerEyelidPose(poseKey, duration);
    },
    boop() {
      creature.triggerBoop();
      boopShockwave = 1.0;
    },
    playPhoneme(phonemeKey, duration = 0.65, intensity = 1.0) {
      creature.triggerVisemePose(phonemeKey, duration, intensity);
    },
    setMorphTarget(channel, value, holdDuration = 4.0) {
      creature.setMorphTarget(channel, value, holdDuration);
    },
    resetMorphTargets() {
      creature.resetMorphTargets();
    },
    setPatternOverlay(opts = {}) {
      furSystem.setPatternOverlay({
        ...opts,
        onLoaded: (loadedTex) => {
          creature.setSkinPatternOverlay({
            texture: loadedTex,
            strength: opts.strength ?? config.patternStrength ?? 0.88,
            scale: opts.scale ?? config.patternScale ?? 1.35,
            mode: opts.mode ?? config.patternMode ?? 0
          });
        }
      });
      creature.setSkinPatternOverlay(opts);
    },
    clearPatternOverlay() {
      const defTex = furSystem.clearPatternOverlay();
      creature.setSkinPatternOverlay({ texture: defTex, strength: 0.0 });
    },
    setExpression(expressionState) {
      creature.setSpeechState(expressionState);
    },
    setConfig(nextConfig = {}) {
      Object.assign(config, nextConfig);
      const u = furSystem.sharedUniforms;
      if (nextConfig.baseColor) {
        u.uBaseColor.value.set(nextConfig.baseColor);
        creature.skinMaterial.color.set(nextConfig.baseColor).multiplyScalar(0.55);
      }
      if (nextConfig.tipColor) u.uTipColor.value.set(nextConfig.tipColor);
      if (nextConfig.furLength !== undefined) u.uFurLength.value = nextConfig.furLength;
      if (nextConfig.furDensity !== undefined) furSystem.updateDensity(nextConfig.furDensity);
      if (nextConfig.clumping !== undefined) u.uClumping.value = nextConfig.clumping;
      if (nextConfig.curliness !== undefined) u.uCurliness.value = nextConfig.curliness;
      if (nextConfig.roughness !== undefined) u.uRoughness.value = nextConfig.roughness;
      if (nextConfig.specular !== undefined) u.uSpecular.value = nextConfig.specular;
      creature.setMascotStyle(nextConfig);
    },
    getConfig() {
      return structuredClone(config);
    },
    dispose() {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      if (controls) controls.dispose();
      if (envRT) envRT.dispose();
      if (ownsRenderer) renderer.dispose();
    }
  };
}
`;
}

export function generateMascotExportBundle(state) {
  const configObj = extractMascotConfig(state);
  const configCode = generateConfigCode(state);
  const coreModuleCode = generateCoreMascotCode(state);
  const usageExampleCode = generateUsageExampleCode(state);

  const combinedExportCode = `${coreModuleCode}\n${usageExampleCode}`;

  return {
    configObj,
    configCode,
    coreModuleCode,
    usageExampleCode,
    combinedExportCode
  };
}
