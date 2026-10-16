import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createBlobCreature, VISEME_PRESETS, EYELID_PRESETS } from './blobCreature.js';
import { createGPUFurPhysics } from './gpuPhysics.js';
import { createGPUFurSystem } from './furSystem.js';

export { VISEME_PRESETS, EYELID_PRESETS };

export const MR_M_DEFAULT_CONFIG = {
  name: 'Mr. M',
  archetype: 'Dream Mascot',
  baseColor: '#4f35ff',
  tipColor: '#ff9ec7',
  eyeColor: '#2563eb',
  cheekColor: '#ff5c8a',
  earStyle: 'bunny',
  muzzleStyle: 'button',
  accessory: 'antennae',
  hatColor: '#dc2626',
  beakColor: '#f59e0b',
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
  curliness: 0.25,
  furReactivity: 1.15,
  lighting: {
    keyColor: '#fff7ed',
    lightAngle: -42,
    lightIntensity: 1.55,
    rimIntensity: 1.45,
    windStrength: 0.70
  },
  gpuFurEnabled: true
};

/**
 * Creates a soft procedural radial contact shadow beneath the mascot.
 */
function createContactShadow() {
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const ctx = shadowCanvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0.0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.45, 'rgba(4, 4, 12, 0.36)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 2.7),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    })
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -0.94;
  return { shadowMesh, shadowTex };
}

/**
 * Reusable 3D Furry Mascot Core:
 * - WebGL2 Renderer (or attaches into an existing Three.js Scene)
 * - 64-Shell + 60,000-Strand GPU Fur System + GPGPU Verlet Physics
 * - 8-Channel Phoneme-to-Viseme Facial Morph Targets
 * - Basic Animations & External AI Voice Control API (talk, wave, blink, playPhoneme, setExpression, setConfig)
 * - Zero Studio UI
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
    ...MR_M_DEFAULT_CONFIG,
    ...userConfig,
    lighting: {
      ...MR_M_DEFAULT_CONFIG.lighting,
      ...(userConfig.lighting || {})
    }
  };

  const isHeadless =
    typeof navigator !== 'undefined' &&
    (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

  const ownsRenderer = !externalRenderer;
  const ownsScene = !externalScene;

  const width = container ? container.clientWidth || window.innerWidth : window.innerWidth;
  const height = container ? container.clientHeight || window.innerHeight : window.innerHeight;

  // 1. WebGL2 Renderer
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
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (container) {
      container.appendChild(renderer.domElement);
    }
  }

  // 2. Scene, Environment Reflections & Camera
  const scene = externalScene || new THREE.Scene();
  let envRT = null;
  if (ownsScene) {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();
  }

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

  // 3. Synchronized 3-Point Studio Lighting Rig
  const lightCfg = config.lighting;
  const rad = ((lightCfg.lightAngle ?? -42) * Math.PI) / 180.0;
  const lx = Math.sin(rad) * 2.8;
  const ly = 2.1;
  const lz = Math.cos(rad) * 2.8;

  let keyLight = null;
  let rimLight = null;
  let hemiLight = null;
  let shadowMesh = null;
  let shadowTex = null;

  if (ownsScene) {
    keyLight = new THREE.DirectionalLight(lightCfg.keyColor, lightCfg.lightIntensity * 1.35);
    keyLight.position.set(lx, ly, lz);
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

    rimLight = new THREE.DirectionalLight('#c4b5fd', lightCfg.rimIntensity * 1.15);
    rimLight.position.set(-2.4, 1.8, -3.2);
    scene.add(rimLight);

    hemiLight = new THREE.HemisphereLight('#f5d0fe', '#1e1b4b', 0.85);
    scene.add(hemiLight);

    const shadowObj = createContactShadow();
    shadowMesh = shadowObj.shadowMesh;
    shadowTex = shadowObj.shadowTex;
    scene.add(shadowMesh);
  }

  // 4. Mascot Character + Morph Targets + Hybrid GPU Fur + GPGPU Verlet Physics
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
  if (config.gpuFurEnabled && !gpuPhysics.isGPGPUActive) {
    config.gpuFurEnabled = false;
  }

  const furParams = {
    ...config,
    lightIntensity: lightCfg.lightIntensity,
    rimIntensity: lightCfg.rimIntensity,
    windStrength: lightCfg.windStrength
  };

  const furSystem = createGPUFurSystem(creature.bodyGeometry, furParams);
  furSystem.sharedUniforms.uKeyLightDir.value.set(lx, ly, lz).normalize();
  furSystem.sharedUniforms.uKeyLightColor.value.set(lightCfg.keyColor);
  furSystem.sharedUniforms.uKeyLightIntensity.value = lightCfg.lightIntensity;
  furSystem.sharedUniforms.uRimIntensity.value = lightCfg.rimIntensity;

  creature.root.add(furSystem.shellMesh);
  creature.root.add(furSystem.strandMesh);

  if (ownsScene) {
    renderer.compile(scene, camera);
  }

  // 5. Interactive Pointer Combing, Petting, Eye Tracking & Click-to-Boop/Emote
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2(0, 0);
  const pointerLocalPos = new THREE.Vector3(0, 0, 2);
  const prevPointerLocalPos = new THREE.Vector3(0, 0, 2);
  const pointerVelocity = new THREE.Vector3(0, 0, 0);
  let isPointerOverCreature = false;
  let pointerDownPos = { x: 0, y: 0 };
  let boopShockwave = 0.0;
  let clickCycleIndex = 0;

  function onPointerMove(e) {
    if (!enablePointerInteraction || !renderer.domElement) return;
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
      if (container) container.style.cursor = 'pointer';
    } else {
      isPointerOverCreature = false;
      pointerVelocity.multiplyScalar(0.5);
      if (container) container.style.cursor = 'grab';
    }
  }

  function onPointerDown(e) {
    if (!enablePointerInteraction) return;
    pointerDownPos.x = e.clientX;
    pointerDownPos.y = e.clientY;
    if (isPointerOverCreature && controls) {
      controls.enabled = false;
    }
  }

  function onPointerUp(e) {
    if (!enablePointerInteraction) return;
    if (controls) controls.enabled = true;
    const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (moveDist < 6 && isPointerOverCreature) {
      creature.triggerBoop();
      boopShockwave = 1.0;
      if (clickCycleIndex % 2 === 1) {
        creature.triggerHappyTalkDemo(2.4);
      } else {
        creature.triggerWave(2.2);
        creature.triggerBlink(true);
      }
      clickCycleIndex++;
    }
  }

  function onResize() {
    if (!ownsRenderer) return;
    const w = container ? container.clientWidth || window.innerWidth : window.innerWidth;
    const h = container ? container.clientHeight || window.innerHeight : window.innerHeight;
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  const visemeKeys = Object.keys(VISEME_PRESETS);
  function onKeyDown(e) {
    if (!enablePointerInteraction) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'Space') {
      creature.triggerHappyTalkDemo(2.6);
      boopShockwave = 0.75;
    } else if (e.key === 'w' || e.key === 'W') {
      creature.triggerWave(2.4);
      boopShockwave = 0.65;
    } else if (e.key === 'b' || e.key === 'B') {
      creature.triggerBlink(true);
    } else if (e.key >= '1' && e.key <= '9') {
      const idx = (parseInt(e.key, 10) - 1) % visemeKeys.length;
      creature.triggerVisemePose(visemeKeys[idx], 0.9, 1.0);
    }
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onResize);

  // 6. Zero-GC Update Step & Optional Render Loop
  const clock = new THREE.Clock();
  let elapsedTime = 0.0;
  let rafId = 0;
  const webglInertiaDisp = new THREE.Vector3(0, 0, 0);
  const webglInertiaVel = new THREE.Vector3(0, 0, 0);
  const webglForceTmp = new THREE.Vector3(0, 0, 0);

  function update(dt) {
    const safeDt = Math.min(Math.max(dt, 0.001), 0.033);
    elapsedTime += safeDt;

    if (controls) controls.update();

    if (boopShockwave > 0.001) {
      boopShockwave *= Math.exp(-safeDt * 2.8);
    } else {
      boopShockwave = 0.0;
    }

    pointerVelocity.multiplyScalar(Math.exp(-safeDt * 12.0));

    // Update mascot breathing, blinking, 8-channel viseme morph targets, waving arms & bounce inertia
    creature.update(safeDt, pointerNDC, camera.position, false);

    if (shadowMesh) {
      const shadowScale = 1.0 - creature.root.position.y * 0.45;
      shadowMesh.scale.set(shadowScale, shadowScale, 1.0);
      shadowMesh.position.x = creature.root.position.x * 0.7;
    }

    // Step GPGPU Verlet fur physics or analytical WebGL inertia fallback
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
      if (isPointerOverCreature) {
        webglForceTmp.addScaledVector(pointerVelocity, 0.85);
      }
      webglForceTmp.addScaledVector(webglInertiaDisp, -24.0);
      webglInertiaVel.addScaledVector(webglForceTmp, safeDt);
      webglInertiaVel.multiplyScalar(Math.exp(-5.5 * safeDt));
      webglInertiaDisp.addScaledVector(webglInertiaVel, safeDt);
      if (webglInertiaDisp.lengthSq() > 0.64) {
        webglInertiaDisp.normalize().multiplyScalar(0.8);
      }
    }

    // Synchronize fur shader uniforms with morph targets and physics state
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

  if (autoRender) {
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      update(clock.getDelta());
      renderer.render(scene, camera);
    };
    animate();
  }

  return {
    root: creature.root,
    renderer,
    scene,
    camera,
    controls,
    creature,
    furSystem,
    gpuPhysics,
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
    playPhoneme(key, duration = 0.85, intensity = 1.0) {
      creature.triggerVisemePose(key, duration, intensity);
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
      if (nextConfig.lighting) {
        Object.assign(config.lighting, nextConfig.lighting);
      }
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
      if (nextConfig.gpuFurEnabled !== undefined) {
        furSystem.setGPUFurEnabled(Boolean(nextConfig.gpuFurEnabled) && gpuPhysics.isGPGPUActive);
      }
      creature.setMascotStyle(nextConfig);
    },
    getConfig() {
      return structuredClone(config);
    },
    // Legacy aliases for backwards compatibility
    triggerBoop: () => {
      creature.triggerBoop();
      boopShockwave = 1.0;
    },
    triggerWave: (duration = 2.4) => {
      creature.triggerWave(duration);
      boopShockwave = 0.65;
    },
    triggerBlink: (wink = false) => creature.triggerBlink(wink),
    triggerVisemePose: (key, duration = 0.85, intensity = 1.0) =>
      creature.triggerVisemePose(key, duration, intensity),
    triggerHappyTalkDemo: (duration = 2.6) => creature.triggerHappyTalkDemo(duration),
    setSpeechState: (state) => creature.setSpeechState(state),
    setMascotStyle: (style) => creature.setMascotStyle(style),
    dispose: () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      if (controls) controls.dispose();
      if (envRT) envRT.dispose();
      if (shadowTex) shadowTex.dispose();
      if (shadowMesh) {
        shadowMesh.geometry.dispose();
        shadowMesh.material.dispose();
      }
      if (ownsRenderer) renderer.dispose();
    }
  };
}

export function createMrMMascot(container, userOptions = {}) {
  return createFurryMascot({
    container,
    config: userOptions
  });
}
