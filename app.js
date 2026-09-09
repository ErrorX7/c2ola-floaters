import { tracks } from "./src/data/tracks.js?v=20260909k";
import { sparkTexts } from "./src/data/sparkTexts.js";

const root = document.documentElement;
const stage = document.querySelector("#stage");
const world = document.querySelector("#world");
const eyeStage = document.querySelector("#eyeStage");
const enter = document.querySelector("#enter");
const reset = document.querySelector("#reset");
const sound = document.querySelector("#sound");
const counter = document.querySelector("#counter");
const trackNodes = document.querySelector("#trackNodes");
const floaterField = document.querySelector("#floaterField");
const sparkField = document.querySelector("#sparkField");
const guidingLamp = document.querySelector("#guidingLamp");
const sparkOrigin = document.querySelector("#sparkOrigin");
const introAudio = document.querySelector("#introAudio");
const fragmentCaption = document.querySelector("#fragmentCaption");
const fragmentOrder = document.querySelector("#fragmentOrder");
const fragmentTitle = document.querySelector("#fragmentTitle");
const fragmentProgress = document.querySelector("#fragmentProgress");
const worldHint = document.querySelector("#worldHint");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  targetX: window.innerWidth / 2,
  targetY: window.innerHeight / 2,
  lastMoveAt: performance.now()
};
const gaze = { x: 0, y: 0, targetX: 0, targetY: 0 };
const discovered = new Set();
let audioContext;
let masterGain;
let activeAudio;
let activeSources = [];
let fragmentTimer;
let progressAnimation;
let nearestTimer;
let blinkTimer;
let muted = false;
let introFadeFrame;
let introPlayRequest = 0;
let introPlaybackBlocked = false;
let introResumeAfterVisibility = false;
let textSparksReleased = false;
let lastSparkBurstAt = 0;
const activeBurstParticles = new Set();

function renderTrackNodes() {
  tracks.forEach((track, index) => {
    const node = document.createElement("button");
    const behavior = track.nodeBehavior;
    node.className = "track-node";
    node.type = "button";
    node.dataset.trackId = track.id;
    node.setAttribute("aria-label", `发现音乐碎片 ${String(track.order).padStart(2, "0")} ${track.title}`);
    node.style.setProperty("--x", `${behavior.x}%`);
    node.style.setProperty("--y", `${behavior.y}%`);
    node.style.setProperty("--depth", behavior.depth);
    node.style.setProperty("--node-size", `${16 + behavior.depth * 17}px`);
    node.style.setProperty("--node-rgb", track.glowStyle.rgb);
    node.style.setProperty("--glow-size", track.glowStyle.size);
    node.style.setProperty("--glow-intensity", track.glowStyle.intensity);
    node.style.setProperty("--drift-time", `${behavior.driftSeconds}s`);
    node.style.setProperty("--delay", `${-index * 1.7}s`);
    node.style.setProperty("--node-dx", `${behavior.driftX}px`);
    node.style.setProperty("--node-dy", `${behavior.driftY}px`);
    node.style.setProperty("--node-rotate", `${index % 2 ? -8 : 7}deg`);
    node.innerHTML = `<span class="node-number">${String(track.order).padStart(2, "0")}</span>`;
    node.addEventListener("click", () => activateTrack(track, node));
    trackNodes.append(node);
  });
}

function renderSparks(originX, originY) {
  if (textSparksReleased) return;
  textSparksReleased = true;
  sparkTexts.forEach((spark, index) => {
    const button = document.createElement("button");
    button.className = `spark ${spark.styleVariant}`;
    if (spark.positionSeed.x < 21) button.classList.add("edge-left");
    if (spark.positionSeed.x > 79) button.classList.add("edge-right");
    button.type = "button";
    button.dataset.sparkId = spark.id;
    button.setAttribute("aria-label", `查看花火文字：${spark.text}`);
    button.style.setProperty("--spark-x", `${spark.positionSeed.x}%`);
    button.style.setProperty("--spark-y", `${spark.positionSeed.y}%`);
    button.style.setProperty("--spark-time", `${6.5 + index * .73}s`);
    button.style.setProperty("--spark-delay", `${-index * 1.4}s`);
    button.style.setProperty("--spark-dx", `${index % 2 ? -8 : 10}px`);
    button.style.setProperty("--spark-dy", `${index % 3 ? 8 : -7}px`);
    button.style.setProperty("--spark-rotate", `${index % 2 ? -7 : 9}deg`);
    button.style.animationPlayState = "paused";

    const core = document.createElement("span");
    core.className = "spark-core";
    button.append(core);
    const rayCount = spark.styleVariant === "long" ? 14 : 11;
    for (let rayIndex = 0; rayIndex < rayCount; rayIndex += 1) {
      const ray = document.createElement("i");
      ray.className = "spark-ray";
      const angle = (360 / rayCount) * rayIndex + index * 7;
      const baseLength = spark.styleVariant === "long" ? 25 : 18;
      const length = baseLength + ((rayIndex * 11 + index * 5) % 15);
      ray.style.setProperty("--ray-angle", `${angle}deg`);
      ray.style.setProperty("--ray-length", `${length}px`);
      ray.style.setProperty("--ray-opacity", `${.38 + ((rayIndex * 17) % 50) / 100}`);
      button.append(ray);
    }
    const copy = document.createElement("span");
    copy.className = "spark-copy";
    copy.textContent = spark.text;
    button.append(copy);
    button.addEventListener("click", event => {
      event.stopPropagation();
      const wasOpen = button.classList.contains("open");
      document.querySelectorAll(".spark.open").forEach(item => item.classList.remove("open"));
      button.classList.toggle("open", !wasOpen);
    });
    sparkField.append(button);

    if (!reducedMotion) {
      const targetX = sparkField.clientWidth * spark.positionSeed.x / 100;
      const targetY = sparkField.clientHeight * spark.positionSeed.y / 100;
      const release = button.animate([
        { transform: `translate(${originX - targetX}px,${originY - targetY}px) scale(.08)`, opacity: 0 },
        { offset: .16, opacity: .92 },
        { offset: .68, transform: `translate(${(originX - targetX) * .16}px,${(originY - targetY) * .2 - 18}px) scale(.72)`, opacity: .82 },
        { transform: "translate(0,0) scale(1)", opacity: 1 }
      ], {
        duration: 1500 + index * 115,
        easing: "cubic-bezier(.16,.72,.22,1)",
        fill: "none"
      });
      release.finished.then(() => { button.style.animationPlayState = "running"; }).catch(() => {});
    } else {
      button.style.animationPlayState = "running";
    }
  });
}

function emitLanternSparks() {
  const now = performance.now();
  if (now - lastSparkBurstAt < 850) return;
  lastSparkBurstAt = now;
  const worldRect = world.getBoundingClientRect();
  const sourceRect = sparkOrigin.getBoundingClientRect();
  const originX = sourceRect.left - worldRect.left + sourceRect.width * .5;
  const originY = sourceRect.top - worldRect.top + sourceRect.height * .5;
  renderSparks(originX, originY);

  const particleCount = reducedMotion ? 12 : (window.innerWidth <= 680 ? 28 : 42);
  const maxDistance = Math.min(270, Math.max(150, window.innerWidth * .24));
  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    const starLike = index % 4 !== 1;
    const size = starLike ? 1.4 + Math.random() * 4.3 : 1.2 + Math.random() * 2.1;
    particle.className = `released-spark ${starLike ? "star" : "seed"}`;
    particle.style.setProperty("--burst-size", `${size.toFixed(2)}px`);
    particle.style.setProperty("--burst-ray", `${(8 + size * 3.1).toFixed(2)}px`);
    particle.style.setProperty("--seed-height", `${(size * 2.7).toFixed(2)}px`);
    sparkField.append(particle);
    activeBurstParticles.add(particle);

    const angle = -Math.PI * (.1 + Math.random() * .8);
    const distance = 52 + Math.random() * maxDistance;
    const spread = .52 + Math.random() * .62;
    const dx = Math.cos(angle) * distance * spread;
    const dy = Math.sin(angle) * distance - 18 - Math.random() * 58;
    const hangX = dx + (Math.random() - .5) * 42;
    const hangY = dy - 25 - Math.random() * 48;
    const duration = reducedMotion ? 1700 : 4400 + Math.random() * 3600;
    const twinkle = .38 + Math.random() * .54;
    const rotation = (Math.random() - .5) * 160;
    const animation = particle.animate([
      { transform: `translate3d(${originX}px,${originY}px,0) scale(.08) rotate(0deg)`, opacity: 0 },
      { offset: .08, opacity: twinkle },
      { offset: .36, transform: `translate3d(${originX + dx * .72}px,${originY + dy * .66}px,0) scale(1) rotate(${rotation * .35}deg)`, opacity: twinkle * .78 },
      { offset: .58, opacity: twinkle },
      { offset: .76, transform: `translate3d(${originX + dx}px,${originY + dy}px,0) scale(.82) rotate(${rotation}deg)`, opacity: twinkle * .62 },
      { transform: `translate3d(${originX + hangX}px,${originY + hangY}px,0) scale(.42) rotate(${rotation * 1.35}deg)`, opacity: 0 }
    ], {
      duration,
      delay: Math.random() * 260,
      easing: "cubic-bezier(.16,.68,.25,1)",
      fill: "forwards"
    });
    animation.finished.then(() => {
      activeBurstParticles.delete(particle);
      particle.remove();
    }).catch(() => {});
  }

  while (activeBurstParticles.size > 92) {
    const oldest = activeBurstParticles.values().next().value;
    activeBurstParticles.delete(oldest);
    oldest.remove();
  }
}

const floaterSpecs = [
  ["dark-dot", 8, 8, 10, 18, 1.05, .76],
  ["dark-dot", 5, 5, 21, 42, .68, .62],
  ["dark-dot", 10, 10, 37, 83, 1.12, .68],
  ["dark-dot", 14, 14, 84, 24, .88, .69],
  ["dark-dot", 6, 6, 92, 56, .52, .55],
  ["dark-blob", 22, 18, 27, 73, 1.2, .54],
  ["dark-blob", 13, 16, 71, 78, .72, .48],
  ["dark-blob", 9, 12, 54, 28, .46, .42],
  ["thread", 74, 3, 16, 48, 1.15, .45],
  ["thread", 92, 3, 68, 39, .82, .35],
  ["thread", 58, 3, 43, 67, .58, .34],
  ["thread", 112, 3, 79, 86, .42, .28],
  ["membrane", 95, 70, 8, 67, .62, .12],
  ["membrane", 130, 92, 72, 53, .44, .1],
  ["membrane", 64, 52, 46, 12, .31, .11],
  ["membrane", 78, 105, 88, 17, .26, .085],
  ["membrane", 54, 61, 34, 49, .73, .105],
  ["ring", 48, 42, 19, 28, .52, .12],
  ["ring", 72, 58, 82, 71, .38, .09],
  ["ring", 38, 34, 57, 61, .68, .1],
  ["ring", 24, 29, 66, 14, .83, .12],
  ["ring", 88, 72, 7, 88, .29, .075],
  ["wisp", 118, 44, 31, 18, .4, .1],
  ["wisp", 150, 52, 62, 81, .3, .08],
  ["wisp", 86, 38, 88, 46, .56, .09],
  ["wisp", 104, 35, 49, 38, .72, .095],
  ["wisp", 76, 30, 12, 58, .48, .085],
  ["white-membrane", 92, 68, 14, 23, .38, .09, true],
  ["white-membrane", 66, 84, 29, 57, .66, .105, true],
  ["white-membrane", 118, 72, 79, 35, .29, .072, true],
  ["white-membrane", 54, 46, 62, 76, .82, .115, true],
  ["pale-ring", 42, 48, 9, 72, .57, .12, true],
  ["pale-ring", 74, 59, 91, 61, .33, .082, true],
  ["pale-ring", 28, 31, 56, 19, .76, .13, true],
  ["glass-speck", 16, 16, 21, 39, .88, .16, true],
  ["glass-speck", 9, 9, 47, 69, .51, .13, true],
  ["glass-speck", 21, 21, 73, 82, .72, .14, true],
  ["glass-speck", 12, 12, 86, 17, .42, .12, true],
  ["white-thread", 86, 24, 37, 27, .46, .13, true],
  ["white-thread", 124, 31, 69, 51, .31, .085, true],
  ["white-thread", 62, 18, 17, 86, .69, .11, true]
];

const floaters = floaterSpecs.map((spec, index) => {
  const [kind, width, height, xPercent, yPercent, depth, opacity, worldOnly = false] = spec;
  const element = document.createElement("span");
  const transparent = ["membrane", "ring", "wisp", "white-membrane", "pale-ring", "glass-speck", "white-thread"].includes(kind);
  element.className = `ambient-floater ${kind}${worldOnly ? " world-floater" : ""}`;
  element.style.setProperty("--w", `${width}px`);
  element.style.setProperty("--h", `${height}px`);
  element.style.setProperty("--base-opacity", opacity);
  element.style.setProperty("--blur", `${Math.max(0, (1.1 - depth) * 2.2)}px`);
  element.style.transform = `translate3d(${window.innerWidth * xPercent / 100}px,${window.innerHeight * yPercent / 100}px,0)`;
  floaterField.append(element);
  return {
    element,
    transparent,
    worldOnly,
    x: window.innerWidth * xPercent / 100,
    y: window.innerHeight * yPercent / 100,
    vx: 0,
    vy: 0,
    depth,
    opacity,
    rotation: (index * 23) % 180,
    phase: index * 1.37,
    speed: transparent ? .018 + depth * .013 : .032 + depth * .026
  };
});

function initializeAudio() {
  if (audioContext) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext = new AudioContextClass();
  masterGain = audioContext.createGain();
  masterGain.gain.value = muted ? 0 : .12;
  masterGain.connect(audioContext.destination);
}

const INTRO_VOLUME = .34;

function updateSoundControl() {
  const waitingForTouch = introPlaybackBlocked && !muted && !stage.classList.contains("entered");
  sound.textContent = muted ? "○" : "◉";
  sound.dataset.soundState = muted ? "off" : (waitingForTouch ? "waiting" : "on");
  sound.setAttribute("aria-pressed", String(!muted));
  sound.setAttribute("aria-label", muted ? "开启声音" : "关闭声音");
  sound.title = waitingForTouch ? "声音已开启 · 轻触页面开始播放" : "声音";
}

async function startIntroAudio() {
  if (muted || stage.classList.contains("entered")) return;
  const requestId = ++introPlayRequest;
  if (introFadeFrame) cancelAnimationFrame(introFadeFrame);
  introFadeFrame = undefined;
  const wasPaused = introAudio.paused;
  if (wasPaused) introAudio.volume = 0;
  try {
    await introAudio.play();
    if (requestId !== introPlayRequest) return;
    introPlaybackBlocked = false;
    updateSoundControl();
    if (!wasPaused || reducedMotion) {
      introAudio.volume = INTRO_VOLUME;
      return;
    }
    const startedAt = performance.now();
    const fadeIn = now => {
      const progress = Math.min(1, Math.max(0, (now - startedAt) / 900));
      introAudio.volume = INTRO_VOLUME * progress;
      if (progress < 1 && requestId === introPlayRequest) {
        introFadeFrame = requestAnimationFrame(fadeIn);
      } else {
        introFadeFrame = undefined;
      }
    };
    introFadeFrame = requestAnimationFrame(fadeIn);
  } catch (_) {
    if (requestId !== introPlayRequest) return;
    introPlaybackBlocked = true;
    introAudio.volume = INTRO_VOLUME;
    updateSoundControl();
  }
}

function pauseIntroAudio(resetPosition = false) {
  introPlayRequest += 1;
  if (introFadeFrame) cancelAnimationFrame(introFadeFrame);
  introFadeFrame = undefined;
  introAudio.pause();
  introAudio.volume = INTRO_VOLUME;
  if (resetPosition) introAudio.currentTime = 0;
}

function fadeOutIntro(duration = 680) {
  introPlayRequest += 1;
  if (introAudio.paused) {
    introAudio.currentTime = 0;
    return;
  }
  if (introFadeFrame) cancelAnimationFrame(introFadeFrame);
  const startedAt = performance.now();
  const startedVolume = introAudio.volume;
  const fade = now => {
    const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
    introAudio.volume = startedVolume * (1 - progress);
    if (progress < 1) {
      introFadeFrame = requestAnimationFrame(fade);
    } else {
      pauseIntroAudio(true);
    }
  };
  introFadeFrame = requestAnimationFrame(fade);
}

function stopAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  activeSources.forEach(source => {
    try { source.stop(); } catch (_) { /* source already ended */ }
  });
  activeSources = [];
}

function playPlaceholder(track) {
  if (!audioContext || !masterGain) return;
  const { baseFrequency, intervals, duration } = track.placeholderTone;
  const start = audioContext.currentTime;
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(960, start);
  filter.Q.value = .7;
  filter.connect(masterGain);

  intervals.forEach((ratio, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(baseFrequency * ratio, start);
    oscillator.detune.setValueAtTime(index * 3 - 2, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(.16 / (index + 1), start + .45 + index * .08);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(filter);
    oscillator.start(start);
    oscillator.stop(start + duration + .05);
    activeSources.push(oscillator);
  });

  const bufferLength = Math.floor(audioContext.sampleRate * duration);
  const noiseBuffer = audioContext.createBuffer(1, bufferLength, audioContext.sampleRate);
  const noise = noiseBuffer.getChannelData(0);
  for (let index = 0; index < bufferLength; index += 1) noise[index] = (Math.random() * 2 - 1) * .09;
  const noiseSource = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();
  noiseSource.buffer = noiseBuffer;
  noiseGain.gain.setValueAtTime(.0001, start);
  noiseGain.gain.exponentialRampToValueAtTime(.018, start + 1.2);
  noiseGain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  noiseSource.connect(noiseGain);
  noiseGain.connect(filter);
  noiseSource.start(start);
  activeSources.push(noiseSource);
}

function playTrackAudio(track) {
  stopAudio();
  initializeAudio();
  if (audioContext?.state === "suspended") audioContext.resume();
  const source = track.snippetSrc || track.fullAudioSrc;
  if (source) {
    activeAudio = new Audio(source);
    activeAudio.volume = muted ? 0 : .42;
    activeAudio.play().catch(() => playPlaceholder(track));
  } else {
    playPlaceholder(track);
  }
}

function createRipple(node, track) {
  const nodeRect = node.getBoundingClientRect();
  const worldRect = world.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "fragment-ripple";
  ripple.style.left = `${nodeRect.left - worldRect.left + nodeRect.width / 2}px`;
  ripple.style.top = `${nodeRect.top - worldRect.top + nodeRect.height / 2}px`;
  ripple.style.setProperty("--ripple-rgb", track.glowStyle.rgb);
  world.append(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}

function activateTrack(track, node) {
  document.querySelectorAll(".track-node").forEach(item => item.classList.remove("active"));
  guidingLamp.classList.remove("active");
  node.classList.add("active");
  if (track.id === "deng-huo") guidingLamp.classList.add("active");
  discovered.add(track.id);
  counter.textContent = `${String(discovered.size).padStart(2, "0")} / ${String(tracks.length).padStart(2, "0")}`;
  root.style.setProperty("--mood", track.visualMood.accent);
  root.style.setProperty("--mood-rgb", track.visualMood.accentRgb);
  root.style.setProperty("--mood-secondary", track.visualMood.secondary);
  world.dataset.mood = track.visualMood.name;
  world.classList.add("fragment-active");
  fragmentOrder.textContent = `FRAGMENT ${String(track.order).padStart(2, "0")}`;
  fragmentTitle.textContent = track.title;
  fragmentCaption.classList.add("visible");
  worldHint.textContent = track.snippetSrc || track.fullAudioSrc
    ? "一小段声音正在穿过视野。"
    : "占位声景 · 可在曲目配置中替换为真实片段";
  createRipple(node, track);
  playTrackAudio(track);

  if (progressAnimation) progressAnimation.cancel();
  progressAnimation = fragmentProgress.animate(
    [{ width: "0%", opacity: 1 }, { width: "100%", opacity: 1 }, { width: "100%", opacity: 0 }],
    { duration: track.placeholderTone.duration * 1000, easing: "linear", fill: "forwards" }
  );
  clearTimeout(fragmentTimer);
  fragmentTimer = setTimeout(() => {
    node.classList.remove("active");
    guidingLamp.classList.remove("active");
    world.classList.remove("fragment-active");
    fragmentCaption.classList.remove("visible");
    worldHint.textContent = "海上漂浮的空瓶，载满爱的信号，化作指路的灯火。";
  }, track.placeholderTone.duration * 1000 + 250);
}

function findNearestTrack() {
  if (!stage.classList.contains("entered")) return;
  let nearest;
  let distance = Infinity;
  document.querySelectorAll(".track-node").forEach(node => {
    node.classList.remove("near");
    const rect = node.getBoundingClientRect();
    const currentDistance = Math.hypot(
      pointer.targetX - (rect.left + rect.width / 2),
      pointer.targetY - (rect.top + rect.height / 2)
    );
    if (currentDistance < distance) {
      distance = currentDistance;
      nearest = node;
    }
  });
  if (nearest && distance < Math.min(230, window.innerWidth * .3)) nearest.classList.add("near");
}

function updatePointer(event) {
  pointer.targetX = event.clientX;
  pointer.targetY = event.clientY;
  pointer.lastMoveAt = performance.now();
  root.style.setProperty("--mx", `${event.clientX}px`);
  root.style.setProperty("--my", `${event.clientY}px`);
  const gazeLimit = Math.min(14, Math.max(6, window.innerWidth * .009));
  gaze.targetX = ((event.clientX / window.innerWidth) - .5) * gazeLimit * 2;
  gaze.targetY = ((event.clientY / window.innerHeight) - .5) * gazeLimit * 1.35;
  clearTimeout(nearestTimer);
  document.querySelectorAll(".track-node.near").forEach(node => node.classList.remove("near"));
  nearestTimer = setTimeout(findNearestTrack, 620);
}

function scheduleBlink() {
  clearTimeout(blinkTimer);
  if (reducedMotion) return;
  blinkTimer = setTimeout(() => {
    if (!stage.classList.contains("entered")) {
      const idle = performance.now() - pointer.lastMoveAt > 4500;
      const duration = 180 + Math.random() * 120;
      const half = duration / 2;
      eyeStage.style.setProperty("--blink-half", `${half}ms`);
      eyeStage.classList.add("blinking");
      if (idle) eyeStage.classList.add("strong-blink");
      setTimeout(() => eyeStage.classList.remove("blinking", "strong-blink"), half);
    }
    scheduleBlink();
  }, 4000 + Math.random() * 3000);
}

function animate(time) {
  pointer.x += (pointer.targetX - pointer.x) * .075;
  pointer.y += (pointer.targetY - pointer.y) * .075;
  gaze.x += (gaze.targetX - gaze.x) * .075;
  gaze.y += (gaze.targetY - gaze.y) * .075;
  root.style.setProperty("--gaze-x", `${gaze.x.toFixed(2)}px`);
  root.style.setProperty("--gaze-y", `${gaze.y.toFixed(2)}px`);

  if (!reducedMotion) {
    floaters.forEach((floater, index) => {
      const dx = floater.x - pointer.x;
      const dy = floater.y - pointer.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const radius = floater.transparent ? 190 : 145;
      if (distance < radius) {
        const repulsion = (1 - distance / radius) * (floater.transparent ? .052 : .16) * floater.depth;
        floater.vx += dx / distance * repulsion;
        floater.vy += dy / distance * repulsion;
      }
      const seconds = time * .001;
      floater.vx += Math.sin(seconds * floater.speed + floater.phase) * (floater.transparent ? .0017 : .004);
      floater.vy += Math.cos(seconds * floater.speed * .8 + floater.phase) * (floater.transparent ? .0014 : .0035);
      const drag = floater.transparent ? .992 : .978;
      floater.vx *= drag;
      floater.vy *= drag;
      floater.x += floater.vx + Math.sin(seconds * floater.speed + index) * .025 * floater.depth;
      floater.y += floater.vy + Math.cos(seconds * floater.speed * .7 + index) * .018 * floater.depth;
      floater.rotation += floater.transparent ? .004 + floater.depth * .002 : .014;

      const margin = 170;
      if (floater.x < -margin) floater.x = window.innerWidth + margin;
      if (floater.x > window.innerWidth + margin) floater.x = -margin;
      if (floater.y < -margin) floater.y = window.innerHeight + margin;
      if (floater.y > window.innerHeight + margin) floater.y = -margin;

      const illumination = Math.max(0, 1 - Math.hypot(floater.x - pointer.x, floater.y - pointer.y) / 330);
      const opacity = floater.transparent ? floater.opacity + illumination * .22 : floater.opacity * (.82 + illumination * .18);
      const parallaxX = (pointer.x / window.innerWidth - .5) * floater.depth * (floater.transparent ? -10 : -4);
      const parallaxY = (pointer.y / window.innerHeight - .5) * floater.depth * (floater.transparent ? -7 : -3);
      floater.element.style.opacity = opacity.toFixed(3);
      floater.element.style.transform = `translate3d(${(floater.x + parallaxX).toFixed(2)}px, ${(floater.y + parallaxY).toFixed(2)}px, 0) rotate(${floater.rotation.toFixed(2)}deg)`;
    });
  }
  requestAnimationFrame(animate);
}

enter.addEventListener("click", () => {
  fadeOutIntro();
  stage.classList.add("entered");
  updateSoundControl();
  initializeAudio();
  if (audioContext?.state === "suspended") audioContext.resume();
  setTimeout(() => {
    document.querySelector(".track-node")?.focus({ preventScroll: true });
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
  }, 1250);
});

guidingLamp.addEventListener("click", () => {
  const track = tracks.find(item => item.id === "deng-huo");
  const node = document.querySelector('[data-track-id="deng-huo"]');
  emitLanternSparks();
  if (track && node) activateTrack(track, node);
});

world.addEventListener("click", event => {
  if (!event.target.closest(".spark")) {
    document.querySelectorAll(".spark.open").forEach(item => item.classList.remove("open"));
  }
});

reset.addEventListener("click", () => {
  stage.classList.remove("entered");
  world.classList.remove("fragment-active");
  fragmentCaption.classList.remove("visible");
  document.querySelectorAll(".track-node").forEach(node => node.classList.remove("active", "near"));
  sparkField.replaceChildren();
  activeBurstParticles.clear();
  textSparksReleased = false;
  stopAudio();
  introAudio.currentTime = 0;
  if (!muted) startIntroAudio();
});

sound.addEventListener("click", () => {
  if (introPlaybackBlocked && !muted && !stage.classList.contains("entered")) {
    startIntroAudio();
    return;
  }
  muted = !muted;
  initializeAudio();
  if (masterGain && audioContext) masterGain.gain.setTargetAtTime(muted ? 0 : .12, audioContext.currentTime, .08);
  if (activeAudio) activeAudio.volume = muted ? 0 : .42;
  if (muted) {
    pauseIntroAudio(false);
  } else if (!stage.classList.contains("entered")) {
    startIntroAudio();
  }
  updateSoundControl();
});

window.addEventListener("pointermove", updatePointer, { passive: true });
window.addEventListener("pointerdown", updatePointer, { passive: true });
window.addEventListener("pointerdown", event => {
  if (!event.target.closest("#sound")) startIntroAudio();
}, { passive: true, capture: true, once: true });
window.addEventListener("keydown", () => startIntroAudio(), { capture: true, once: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    introResumeAfterVisibility = !introAudio.paused && !muted && !stage.classList.contains("entered");
    if (introResumeAfterVisibility) pauseIntroAudio(false);
  } else if (introResumeAfterVisibility) {
    introResumeAfterVisibility = false;
    startIntroAudio();
  }
});
window.addEventListener("resize", () => {
  pointer.targetX = Math.min(pointer.targetX, window.innerWidth);
  pointer.targetY = Math.min(pointer.targetY, window.innerHeight);
});

renderTrackNodes();
scheduleBlink();
requestAnimationFrame(animate);
introAudio.defaultMuted = false;
introAudio.muted = false;
updateSoundControl();
startIntroAudio();
