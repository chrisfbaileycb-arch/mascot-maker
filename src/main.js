import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createBlobCreature, VISEME_PRESETS } from './blobCreature.js';
import { createGPUFurPhysics } from './gpuPhysics.js';
import { createGPUFurSystem } from './furSystem.js';
import { createMinimalUI, FUR_PRESETS } from './ui.js';
import { createEnvironmentManager } from './environments.js';
import { createWordBubbleSystem } from './wordBubbles.js';
import { createFurryMascot, createMrMMascot, MR_M_DEFAULT_CONFIG } from './mrMMascot.js';
import {
  extractMascotConfig,
  generateMascotExportBundle,
  generateCoreMascotCode,
  generateConfigCode,
  generateUsageExampleCode
} from './mascotExporter.js';

export {
  createFurryMascot,
  createMrMMascot,
  MR_M_DEFAULT_CONFIG,
  VISEME_PRESETS,
  extractMascotConfig,
  generateMascotExportBundle,
  generateCoreMascotCode,
  generateConfigCode,
  generateUsageExampleCode
};

const container = document.getElementById('canvas-container');
const uiContainer = document.getElementById('ui-root');
const hudHint = document.getElementById('hud-hint');
const pureViewBtn = document.getElementById('pure-mascot-toggle-btn');
const exitPureViewBtn = document.getElementById('exit-pure-view-btn');
const topExportBtn = document.getElementById('top-export-mascot-btn');

if (hudHint) {
  hudHint.textContent =
    'Design your mascot & test phonemes · Click "Export Mascot Code" for drop-in ES module';
}

const urlSearchParams = new URLSearchParams(window.location.search);
const forceWebGL =
  urlSearchParams.get('gpuFur') === '0' || urlSearchParams.get('mode') === 'webgl';
const initialGpuFur = !forceWebGL;

const simState = {
  ...FUR_PRESETS[0],
  mascotName: 'Mr. M',
  keyColor: '#fffbeb',
  lightAngle: -42,
  lightIntensity: 1.55,
  rimIntensity: 1.45,
  windStrength: 0.70,
  environment: 'studio',
  skyTheme: 'daydream',
  skyCloudiness: 1.0,
  skySparkle: 0.30,
  skyRainbow: 0.35,
  bubblesEnabled: false,
  wordCategory: 'dreamer',
  furReactivity: 1.15,
  gpuFurEnabled: initialGpuFur
};

// 1. Initialize WebGL2 Renderer
const isHeadless =
  typeof navigator !== 'undefined' &&
  (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  alpha: true
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = !isHeadless;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// 2. Scene, Studio Reflection Environment & Camera
const scene = new THREE.Scene();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const studioEnvRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
scene.environment = studioEnvRT.texture;
pmremGenerator.dispose();

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  80
);
camera.position.set(0.0, 0.45, 6.4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2.6;
controls.maxDistance = 15.0;
controls.maxPolarAngle = Math.PI * 0.62;
controls.target.set(0, 0.05, 0);

// 3. Synchronized 3-Point Studio Lighting Rig
const keyLight = new THREE.DirectionalLight('#fff7ed', simState.lightIntensity * 1.4);
keyLight.castShadow = !isHeadless;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.bias = -0.0005;
keyLight.shadow.normalBias = 0.02;
keyLight.shadow.radius = 2.5;
keyLight.shadow.camera.left = -2.2;
keyLight.shadow.camera.right = 2.2;
keyLight.shadow.camera.top = 2.2;
keyLight.shadow.camera.bottom = -2.2;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 10.0;
keyLight.shadow.camera.updateProjectionMatrix();
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight('#c4b5fd', simState.rimIntensity * 1.2);
rimLight.position.set(-2.4, 1.8, -3.2);
scene.add(rimLight);

const hemiLight = new THREE.HemisphereLight('#f5d0fe', '#1e1b4b', 0.85);
scene.add(hemiLight);

// 4. Create Customizable Mascot + Hybrid GPU Fur + GPGPU Physics
const creature = createBlobCreature();
creature.setMascotStyle({
  earStyle: simState.earStyle,
  muzzleStyle: simState.muzzleStyle,
  accessory: simState.accessory,
  eyeColor: simState.eyeColor,
  cheekColor: simState.cheekColor,
  hatColor: simState.hatColor,
  beakColor: simState.beakColor,
  bodyRoundness: simState.bodyRoundness,
  earSize: simState.earSize,
  snoutLength: simState.snoutLength,
  headToBodyRatio: simState.headToBodyRatio,
  eyeScale: simState.eyeScale,
  furReactivity: simState.furReactivity
});
scene.add(creature.root);

const gpuPhysics = createGPUFurPhysics(renderer);
if (simState.gpuFurEnabled && !gpuPhysics.isGPGPUActive) {
  simState.gpuFurEnabled = false;
}
const furSystem = createGPUFurSystem(creature.bodyGeometry, simState);

creature.root.add(furSystem.shellMesh);
creature.root.add(furSystem.strandMesh);

const envManager = createEnvironmentManager({
  scene,
  renderer,
  container,
  keyLight,
  rimLight,
  hemiLight,
  furSystem,
  camera
});

let boopShockwave = 0.0;

const wordBubbleSystem = createWordBubbleSystem({
  creature,
  onTriggerBoop: () => {
    boopShockwave = 0.85;
  }
});
wordBubbleSystem.setBubblesEnabled(Boolean(simState.bubblesEnabled));

function updateLightingFromState() {
  const rad = (simState.lightAngle * Math.PI) / 180.0;
  const lx = Math.sin(rad) * 2.8;
  const ly = 2.1;
  const lz = Math.cos(rad) * 2.8;

  keyLight.position.set(lx, ly, lz);
  keyLight.intensity = simState.lightIntensity * 1.35;
  rimLight.intensity = simState.rimIntensity * 1.15;
  if (simState.keyColor) {
    keyLight.color.set(simState.keyColor);
    furSystem.sharedUniforms.uKeyLightColor.value.set(simState.keyColor);
  }

  furSystem.sharedUniforms.uKeyLightDir.value.set(lx, ly, lz).normalize();
  furSystem.sharedUniforms.uKeyLightIntensity.value = simState.lightIntensity;
  furSystem.sharedUniforms.uRimIntensity.value = simState.rimIntensity;

  creature.skinMaterial.color.set(simState.baseColor).multiplyScalar(0.55);
}

function applyCameraFramingForEnvironment(envId) {
  const isDesk = envId === 'highrise';
  const isAR = envId === 'ar';
  const s = isDesk || isAR ? 0.25 : 1.0;
  const deskX = isDesk ? -0.14 : 0.0;
  const deskZ = isDesk ? 0.42 : 0.0;
  creature.setEnvironmentScale(s, deskX, deskZ);

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const mobileZoomOut = isMobile
    ? Math.max(1.45, Math.min(1.95, 0.82 / Math.max(0.42, aspect)))
    : 1.0;

  if (isAR) {
    const targetY = -0.94 * (1.0 - s) + 0.05 * s;
    controls.target.set(0.0, targetY, 0.0);
    camera.position.set(0.0, 0.35, 6.2 * mobileZoomOut);
    controls.minDistance = 1.4;
    controls.maxDistance = 14.0 * mobileZoomOut;
    controls.update();
  } else {
    const targetY = -0.94 * (1.0 - s) + 0.05 * s;
    controls.target.set(deskX, targetY, deskZ);
    camera.position.set(deskX, targetY + 0.40 * s, deskZ + 6.4 * s * mobileZoomOut);
    controls.minDistance = 2.6 * s;
    controls.maxDistance = 15.0 * s * mobileZoomOut;
    controls.update();
  }
}

function applyEnvironmentPreset(envId) {
  const prevEnv = simState.environment;
  simState.environment = envId;

  if (typeof creature !== 'undefined' && creature.resetPlacement) {
    if (
      (prevEnv === 'ar' && envId !== 'ar') ||
      (envId !== 'ar' && creature.isPlaced && creature.isPlaced())
    ) {
      creature.resetPlacement(false);
    }
  }

  const envPreset = envManager.setEnvironment(envId);
  const u = furSystem.sharedUniforms;
  if (envPreset) {
    if (envPreset.keyColor !== undefined) {
      simState.keyColor = envPreset.keyColor;
    }
    simState.lightAngle = envPreset.lightAngle;
    simState.lightIntensity = envPreset.lightIntensity;
    simState.rimIntensity = envPreset.rimIntensity;
    simState.windStrength = envPreset.windStrength;
    u.uWindStrength.value = envPreset.windStrength;
  }
  envManager.setSkyTheme(simState.skyTheme);
  envManager.setSkyParams({
    cloudiness: simState.skyCloudiness,
    sparkle: simState.skySparkle,
    rainbow: simState.skyRainbow
  });

  applyCameraFramingForEnvironment(envId);
  updateLightingFromState();
}

const ALLOWED_ENV_IDS = new Set(['studio', 'meadow', 'highrise', 'ar']);
const urlEnvParam = urlSearchParams.get('env');
const initialEnvId =
  urlEnvParam && ALLOWED_ENV_IDS.has(urlEnvParam) ? urlEnvParam : simState.environment;
applyEnvironmentPreset(initialEnvId);

// 5. Build Mascot Maker Studio UI + Code Exporter
const ui = createMinimalUI(uiContainer, simState, (key, value) => {
  const u = furSystem.sharedUniforms;
  switch (key) {
    case 'environment': {
      applyEnvironmentPreset(value);
      ui.syncUI();
      break;
    }
    case 'mascotName': {
      wordBubbleSystem.setMascotName(value);
      break;
    }
    case 'triggerWave': {
      creature.triggerWave(2.2);
      boopShockwave = 0.65;
      break;
    }
    case 'triggerBlink': {
      creature.triggerBlink(Math.random() > 0.45);
      break;
    }
    case 'triggerGreeting': {
      const name = simState.mascotName || 'Mr. M';
      wordBubbleSystem.speakPhrase(
        `Hi friend! I am ${name}! Ready to export and join your app!`,
        true
      );
      break;
    }
    case 'earStyle': {
      creature.setMascotStyle({ earStyle: value });
      break;
    }
    case 'muzzleStyle': {
      creature.setMascotStyle({ muzzleStyle: value });
      break;
    }
    case 'accessory': {
      creature.setMascotStyle({ accessory: value });
      break;
    }
    case 'hatColor': {
      creature.setMascotStyle({ hatColor: value });
      break;
    }
    case 'beakColor': {
      creature.setMascotStyle({ beakColor: value });
      break;
    }
    case 'bodyRoundness': {
      creature.setMascotStyle({ bodyRoundness: value });
      break;
    }
    case 'earSize': {
      creature.setMascotStyle({ earSize: value });
      break;
    }
    case 'snoutLength': {
      creature.setMascotStyle({ snoutLength: value });
      break;
    }
    case 'headToBodyRatio': {
      creature.setMascotStyle({ headToBodyRatio: value });
      break;
    }
    case 'eyeScale': {
      creature.setMascotStyle({ eyeScale: value });
      break;
    }
    case 'eyeColor': {
      creature.setMascotStyle({ eyeColor: value });
      break;
    }
    case 'cheekColor': {
      creature.setMascotStyle({ cheekColor: value });
      break;
    }
    case 'triggerBoop': {
      creature.triggerBoop();
      boopShockwave = 0.85;
      break;
    }
    case 'triggerPhoneme': {
      creature.triggerVisemePose(value, 1.15, 1.0);
      break;
    }
    case 'triggerEyelidPose': {
      creature.triggerEyelidPose(value, 1.65);
      break;
    }
    case 'setMorphTarget': {
      if (value && value.channel) {
        creature.setMorphTarget(value.channel, value.value, 4.5);
      }
      break;
    }
    case 'resetMorphTargets': {
      creature.resetMorphTargets();
      break;
    }
    case 'playLipSyncPhrase': {
      creature.playLipSyncPhrase(value);
      break;
    }
    case 'playAutoLipSyncTest': {
      creature.playAutoLipSyncTest();
      boopShockwave = 0.65;
      break;
    }
    case 'triggerTalkDemo': {
      creature.triggerHappyTalkDemo(Number(value) || 3.2);
      break;
    }
    case 'furReactivity': {
      creature.setFurReactivity(value);
      break;
    }
    case 'bubblesEnabled': {
      wordBubbleSystem.setBubblesEnabled(value);
      break;
    }
    case 'wordCategory': {
      wordBubbleSystem.setWordCategory(value);
      break;
    }
    case 'launchCustomWord': {
      wordBubbleSystem.launchCustomWord(value);
      break;
    }
    case 'triggerBubbleParty': {
      wordBubbleSystem.triggerBubbleParty();
      break;
    }
    case 'skyTheme': {
      const sky = envManager.setSkyTheme(value);
      if (sky) {
        simState.keyColor = sky.keyColor;
        simState.skySparkle = sky.sparkle;
        simState.skyRainbow = sky.rainbow;
        updateLightingFromState();
        if (simState.environment === 'studio') {
          document.body.style.background = `radial-gradient(circle at 50% 38%, ${sky.mid}44 0%, ${sky.zenith}66 55%, #060812 100%)`;
        } else {
          document.body.style.background = '';
        }
        ui.syncUI();
      }
      break;
    }
    case 'skyCloudiness':
    case 'skySparkle':
    case 'skyRainbow': {
      envManager.setSkyParams({
        cloudiness: simState.skyCloudiness,
        sparkle: simState.skySparkle,
        rainbow: simState.skyRainbow
      });
      break;
    }
    case 'toggleGPUFur': {
      const enabled = Boolean(value);
      simState.gpuFurEnabled = enabled;
      furSystem.setGPUFurEnabled(enabled);
      ui.setGPUFurEnabled(enabled);
      break;
    }
    case 'arToggleMirror': {
      const mirrored = envManager.toggleMirror();
      ui.setMirrorLabel(mirrored);
      break;
    }
    case 'arFlipCamera':
      envManager.flipCamera();
      break;
    case 'furLength':
      u.uFurLength.value = value;
      break;
    case 'furDensity':
      furSystem.updateDensity(value);
      break;
    case 'clumping':
      u.uClumping.value = value;
      break;
    case 'curliness':
      u.uCurliness.value = value;
      break;
    case 'baseColor':
      u.uBaseColor.value.set(value);
      creature.skinMaterial.color.set(value).multiplyScalar(0.55);
      break;
    case 'tipColor':
      u.uTipColor.value.set(value);
      break;
    case 'roughness':
      u.uRoughness.value = value;
      break;
    case 'specular':
      u.uSpecular.value = value;
      break;
    case 'applyFurPattern': {
      if (value && value.dataUrl) {
        furSystem.setPatternOverlay({
          dataUrl: value.dataUrl,
          strength: value.strength ?? simState.patternStrength ?? 0.88,
          scale: value.scale ?? simState.patternScale ?? 1.35,
          mode: value.mode ?? simState.patternMode ?? 0,
          onLoaded: (loadedTex) => {
            creature.setSkinPatternOverlay({
              texture: loadedTex,
              strength: value.strength ?? simState.patternStrength ?? 0.88,
              scale: value.scale ?? simState.patternScale ?? 1.35,
              mode: value.mode ?? simState.patternMode ?? 0
            });
          }
        });
        boopShockwave = 0.72;
      }
      break;
    }
    case 'clearFurPattern': {
      const defTex = furSystem.clearPatternOverlay();
      creature.setSkinPatternOverlay({
        texture: defTex,
        strength: 0.0
      });
      break;
    }
    case 'patternStrength': {
      furSystem.setPatternOverlay({ strength: value });
      creature.setSkinPatternOverlay({ strength: value });
      break;
    }
    case 'patternScale': {
      furSystem.setPatternOverlay({ scale: value });
      creature.setSkinPatternOverlay({ scale: value });
      break;
    }
    case 'patternMode': {
      furSystem.setPatternOverlay({ mode: value });
      creature.setSkinPatternOverlay({ mode: value });
      break;
    }
    case 'keyColor':
    case 'lightAngle':
    case 'lightIntensity':
    case 'rimIntensity':
      updateLightingFromState();
      break;
    case 'windStrength':
      u.uWindStrength.value = value;
      break;
    case 'arToggleTapPlace':
      tapToPlaceEnabled = Boolean(value);
      break;
    case 'arToggleLightEst': {
      const enabled = Boolean(value);
      envManager.setLightEstimationEnabled(enabled);
      break;
    }
    case 'arResetPosition':
      creature.resetPlacement();
      envManager.resetARAnchor();
      break;
    default:
      break;
  }
});

// Pure Mascot View Toggle (hides all Studio UI, Word Bubbles & Docks to preview only the exported mascot)
let isPureMascotMode = urlSearchParams.get('pure') === '1';

function setPureMascotMode(pure) {
  isPureMascotMode = Boolean(pure);
  document.body.classList.toggle('pure-mascot-mode', isPureMascotMode);
  if (exitPureViewBtn) {
    exitPureViewBtn.hidden = !isPureMascotMode;
  }
  if (isPureMascotMode) {
    wordBubbleSystem.setBubblesEnabled(false);
    if (simState.environment !== 'studio') {
      applyEnvironmentPreset('studio');
      ui.syncUI();
    }
  } else {
    wordBubbleSystem.setBubblesEnabled(Boolean(simState.bubblesEnabled));
  }
}

if (pureViewBtn) {
  pureViewBtn.addEventListener('click', () => {
    setPureMascotMode(true);
  });
}
if (exitPureViewBtn) {
  exitPureViewBtn.addEventListener('click', () => {
    setPureMascotMode(false);
  });
}
if (topExportBtn) {
  topExportBtn.addEventListener('click', () => {
    ui.openExportModal('bundle');
  });
}

if (isPureMascotMode) {
  setPureMascotMode(true);
}

let tapToPlaceEnabled = true;

envManager.onARStatusChange((statusText, isLive) => {
  ui.setARStatus(statusText, isLive);
});

envManager.onPlaneDetected((planeInfo) => {
  ui.setARPlaneStatus(
    planeInfo.surfaceType,
    planeInfo.planeY,
    planeInfo.confidence,
    planeInfo.featureCount
  );
});

envManager.onLightEstimated((lightInfo) => {
  if (simState.environment !== 'ar') return;
  if (!lightInfo.isManualReset && !envManager.isLightEstimationEnabled()) return;
  simState.keyColor = lightInfo.keyColor;
  simState.lightAngle = lightInfo.lightAngle;
  simState.lightIntensity = lightInfo.lightIntensity;
  simState.rimIntensity = lightInfo.rimIntensity;
  updateLightingFromState();
  ui.setARLightStatus(lightInfo);
});

// 6. Interactive 3D Pointer Raycasting for Petting, Combing & Booping
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2(0, 0);
const pointerLocalPos = new THREE.Vector3(0, 0, 2);
const prevPointerLocalPos = new THREE.Vector3(0, 0, 2);
const pointerVelocity = new THREE.Vector3(0, 0, 0);
let isPointerOverCreature = false;
let pointerDownPos = { x: 0, y: 0 };

function isEventOnUIOverlay(e) {
  return Boolean(
    e.target &&
      typeof e.target.closest === 'function' &&
      (e.target.closest('#ui-root') ||
        e.target.closest('#page-nav') ||
        e.target.closest('#scene-nav') ||
        e.target.closest('#exit-pure-view-btn') ||
        e.target.closest('#mascot-export-modal') ||
        e.target.closest('#mobile-controls-btn') ||
        e.target.closest('#mobile-sheet-backdrop') ||
        e.target.closest('#word-stage-card') ||
        e.target.closest('#spelling-stage-card') ||
        e.target.closest('#speech-dock') ||
        e.target.closest('#mascot-comm-dock') ||
        e.target.closest('.word-bubble') ||
        e.target.closest('.floating-word-bubble'))
  );
}

window.addEventListener('pointermove', (e) => {
  if (isEventOnUIOverlay(e)) {
    isPointerOverCreature = false;
    return;
  }
  pointerNDC.x = (e.clientX / window.innerWidth) * 2.0 - 1.0;
  pointerNDC.y = -(e.clientY / window.innerHeight) * 2.0 + 1.0;

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
    container.style.cursor = 'pointer';
    if (simState.environment === 'ar') {
      envManager.updateARCursor(pointerNDC.x, pointerNDC.y, false);
    }
  } else {
    isPointerOverCreature = false;
    pointerVelocity.multiplyScalar(0.5);
    container.style.cursor = 'grab';
    if (simState.environment === 'ar' && tapToPlaceEnabled) {
      envManager.updateARCursor(pointerNDC.x, pointerNDC.y, true);
    }
  }
});

window.addEventListener('pointerdown', (e) => {
  pointerDownPos.x = e.clientX;
  pointerDownPos.y = e.clientY;
  if (isEventOnUIOverlay(e)) {
    return;
  }
  if (isPointerOverCreature) {
    controls.enabled = false;
  }
});

window.addEventListener('pointerup', (e) => {
  controls.enabled = true;
  const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (moveDist < 6) {
    if (isEventOnUIOverlay(e)) {
      return;
    }
    if (isPointerOverCreature) {
      creature.triggerBoop();
      boopShockwave = 1.0;
    } else if (simState.environment === 'ar' && tapToPlaceEnabled) {
      const planeHit = envManager.estimatePlaneAt(pointerNDC.x, pointerNDC.y);
      if (planeHit && planeHit.point) {
        pointerNDC.set(0, 0);
        creature.placeAt(planeHit.point, planeHit.normal, true, camera.position);
        envManager.triggerPlacementPulse(planeHit.point);
      }
    }
  }
});

let currentDPR = isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2);
let wasMobileViewport = window.matchMedia('(max-width: 768px)').matches;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(currentDPR);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const isMobileNow = window.matchMedia('(max-width: 768px)').matches;
  if (isMobileNow || isMobileNow !== wasMobileViewport) {
    wasMobileViewport = isMobileNow;
    applyCameraFramingForEnvironment(simState.environment);
  }
});

// 7. Zero-GC Real-Time Render Loop
const clock = new THREE.Clock();
let elapsedTime = 0.0;
const webglInertiaDisp = new THREE.Vector3(0, 0, 0);
const webglInertiaVel = new THREE.Vector3(0, 0, 0);
const webglForceTmp = new THREE.Vector3(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.033);
  elapsedTime += dt;

  controls.update();

  if (boopShockwave > 0.001) {
    boopShockwave *= Math.exp(-dt * 2.8);
  } else {
    boopShockwave = 0.0;
  }

  pointerVelocity.multiplyScalar(Math.exp(-dt * 12.0));

  wordBubbleSystem.update(dt);
  creature.update(dt, pointerNDC, camera.position, simState.environment === 'ar');
  envManager.update(elapsedTime, simState.windStrength, creature.root);

  let physicsTexture = gpuPhysics.fallbackTexture;
  if (simState.gpuFurEnabled) {
    physicsTexture = gpuPhysics.step({
      time: elapsedTime,
      dt,
      windStrength: simState.windStrength,
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
    if (isPointerOverCreature) {
      webglForceTmp.addScaledVector(pointerVelocity, 0.85);
    }
    webglForceTmp.addScaledVector(webglInertiaDisp, -24.0);
    webglInertiaVel.addScaledVector(webglForceTmp, dt);
    webglInertiaVel.multiplyScalar(Math.exp(-5.5 * dt));
    webglInertiaDisp.addScaledVector(webglInertiaVel, dt);
    if (webglInertiaDisp.lengthSq() > 0.64) {
      webglInertiaDisp.normalize().multiplyScalar(0.8);
    }
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

  if (ui && typeof ui.updatePhonemeTelemetry === 'function') {
    ui.updatePhonemeTelemetry(creature.getPhonemeTelemetry());
  }

  renderer.render(scene, camera);
}

animate();

// Expose clean external Mascot Controller & Exporter on window for live inspection and AI voice testing
window.mascotStudio = {
  getConfig: () => extractMascotConfig(simState),
  exportMascot: () => generateMascotExportBundle(simState),
  openExportModal: (tab = 'bundle') => ui.openExportModal(tab),
  setPureMascotMode,
  mascot: {
    talk: (duration = 2.6) => creature.triggerHappyTalkDemo(duration),
    wave: (duration = 2.4) => {
      creature.triggerWave(duration);
      boopShockwave = 0.65;
    },
    blink: (wink = false) => creature.triggerBlink(wink),
    boop: () => {
      creature.triggerBoop();
      boopShockwave = 1.0;
    },
    playPhoneme: (phonemeId, duration = 0.85, intensity = 1.0) =>
      creature.triggerVisemePose(phonemeId, duration, intensity),
    setExpression: (expr) => creature.setSpeechState(expr)
  }
};
