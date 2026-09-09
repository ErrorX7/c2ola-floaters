import { tracks } from "./src/data/tracks.js";

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

const floaterSpecs = [
  ["dark-dot", 8, 8, 10, 18, 1.05, .76],
  ["dark-dot", 14, 14, 84, 24, .88, .69],
  ["dark-blob", 22, 18, 27, 73, 1.2, .54],
  ["dark-blob", 13, 16, 71, 78, .72, .48],
  ["thread", 74, 3, 16, 48, 1.15, .45],
  ["thread", 92, 3, 68, 39, .82, .35],
  ["membrane", 95, 70, 8, 67, .62, .12],
  ["membrane", 130, 92, 72, 53, .44, .1],
  ["membrane", 64, 52, 46, 12, .31, .11],
  ["ring", 48, 42, 19, 28, .52, .12],
  ["ring", 72, 58, 82, 71, .38, .09],
  ["ring", 38, 34, 57, 61, .68, .1],
  ["wisp", 118, 44, 31, 18, .4, .1],
  ["wisp", 150, 52, 62, 81, .3, .08],
  ["wisp", 86, 38, 88, 46, .56, .09]
];

const floaters = floaterSpecs.map((spec, index) => {
  const [kind, width, height, xPercent, yPercent, depth, opacity] = spec;
  const element = document.createElement("span");
  const transparent = ["membrane", "ring", "wisp"].includes(kind);
  element.className = `ambient-floater ${kind}`;
  element.style.setProperty("--w", `${width}px`);
  element.style.setProperty("--h", `${height}px`);
  element.style.setProperty("--base-opacity", opacity);
  element.style.setProperty("--blur", `${Math.max(0, (1.1 - depth) * 2.2)}px`);
  floaterField.append(element);
  return {
    element,
    transparent,
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
  node.classList.add("active");
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
    world.classList.remove("fragment-active");
    fragmentCaption.classList.remove("visible");
    worldHint.textContent = "别追它。停下来，让一个片段自己浮近。";
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
      const duration = 180 + Math.random() * 140;
      eyeStage.style.setProperty("--blink-time", `${duration}ms`);
      eyeStage.classList.add("blinking");
      if (idle) eyeStage.classList.add("strong-blink");
      setTimeout(() => eyeStage.classList.remove("blinking", "strong-blink"), duration);
    }
    scheduleBlink();
  }, 6000 + Math.random() * 6000);
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
  stage.classList.add("entered");
  initializeAudio();
  if (audioContext?.state === "suspended") audioContext.resume();
  setTimeout(() => document.querySelector(".track-node")?.focus(), 1250);
});

reset.addEventListener("click", () => {
  stage.classList.remove("entered");
  world.classList.remove("fragment-active");
  fragmentCaption.classList.remove("visible");
  document.querySelectorAll(".track-node").forEach(node => node.classList.remove("active", "near"));
  stopAudio();
});

sound.addEventListener("click", () => {
  muted = !muted;
  initializeAudio();
  if (masterGain && audioContext) masterGain.gain.setTargetAtTime(muted ? 0 : .12, audioContext.currentTime, .08);
  if (activeAudio) activeAudio.volume = muted ? 0 : .42;
  sound.textContent = muted ? "○" : "◉";
  sound.setAttribute("aria-label", muted ? "开启声音" : "关闭声音");
});

window.addEventListener("pointermove", updatePointer, { passive: true });
window.addEventListener("pointerdown", updatePointer, { passive: true });
window.addEventListener("resize", () => {
  pointer.targetX = Math.min(pointer.targetX, window.innerWidth);
  pointer.targetY = Math.min(pointer.targetY, window.innerHeight);
});

renderTrackNodes();
scheduleBlink();
requestAnimationFrame(animate);
