import { tracks } from "./src/data/tracks.js?v=20260909n";
import { sparkTexts } from "./src/data/sparkTexts.js?v=20260909n";
import { posterTimeline } from "./src/data/posterTimeline.js?v=20260910d";

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
const wildsFormation = document.querySelector("#wildsFormation");
const wildsLines = document.querySelector("#wildsLines");
const wildsChibiEntry = document.querySelector("#wildsChibiEntry");
const posterReveal = document.querySelector("#posterReveal");
const posterClose = document.querySelector("#posterClose");
const posterFilmEntry = document.querySelector("#posterFilmEntry");
const filmReel = document.querySelector("#filmReel");
const posterTimelineLayer = document.querySelector("#posterTimelineLayer");
const timelineMemory = document.querySelector("#timelineMemory");
const timelineMemoryBackdrop = document.querySelector("#timelineMemoryBackdrop");
const timelineMemoryPaper = document.querySelector("#timelineMemoryPaper");
const timelineMemoryClose = document.querySelector("#timelineMemoryClose");
const timelineMemoryContent = document.querySelector("#timelineMemoryContent");
const timelineMemoryCaption = document.querySelector("#timelineMemoryCaption");
const grassMessage = document.querySelector("#grassMessage");
const dawnScene = document.querySelector("#dawnScene");
const dawnCanvas = document.querySelector("#dawnCanvas");
const shelterScene = document.querySelector("#shelterScene");
const shelterCanvas = document.querySelector("#shelterCanvas");
const shelterPerson = document.querySelector("#shelterPerson");
const meltingClock = document.querySelector("#meltingClock");
const dreamTodo = document.querySelector(".dream-todo");
const dreamEcho = document.querySelector("#dreamEcho");
const goodnewsScene = document.querySelector("#goodnewsScene");
const goodnewsCanvas = document.querySelector("#goodnewsCanvas");
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
let wildsRunId = 0;
let grassFadeTimer;
let grassRevealTimers = [];
let activeTrackId = null;
let activeTimelineSticker = null;
let timelineCloseTimer;
let wildsAnimations = [];
let wildsTimers = [];
let posterAmbientGain;
let posterAmbientSources = [];
let posterAmbientTimer;
let posterAmbientStopTimer;
let posterTrackFadeFrame;
let timelineAudio;
let timelineAudioFadeFrame;
let timelineVideo;
let dawnFrame;
let dawnRunId = 0;
let dawnParticles = [];
let shelterFrame;
let shelterRunId = 0;
let shelterParticles = [];
let shelterStartedAt = 0;
let shelterTimers = [];
let goodnewsFrame;
let goodnewsRunId = 0;
let goodnewsParticles = [];
let goodnewsStartedAt = 0;
let goodnewsFormTimer;

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

const TRACK_VOLUME = .42;
const POSTER_WILDS_VOLUME = .09;

function fadeMediaVolume(media, targetVolume, duration, onComplete) {
  if (!media) return;
  const startVolume = Number.isFinite(media.volume) ? media.volume : 0;
  const startedAt = performance.now();
  const step = now => {
    const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
    media.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress < 1) {
      posterTrackFadeFrame = requestAnimationFrame(step);
    } else {
      posterTrackFadeFrame = undefined;
      onComplete?.();
    }
  };
  if (posterTrackFadeFrame) cancelAnimationFrame(posterTrackFadeFrame);
  posterTrackFadeFrame = requestAnimationFrame(step);
}

function stopPosterAmbience(immediate = false) {
  clearTimeout(posterAmbientTimer);
  clearTimeout(posterAmbientStopTimer);
  if (!posterAmbientGain || !audioContext) return;
  const sources = posterAmbientSources;
  const finish = () => {
    sources.forEach(source => {
      try { source.stop(); } catch (_) { /* ambience already ended */ }
    });
    if (posterAmbientSources === sources) {
      posterAmbientSources = [];
      posterAmbientGain = undefined;
    }
  };
  if (immediate || reducedMotion) {
    finish();
    return;
  }
  const now = audioContext.currentTime;
  posterAmbientGain.gain.cancelScheduledValues(now);
  posterAmbientGain.gain.setValueAtTime(Math.max(.0001, posterAmbientGain.gain.value), now);
  posterAmbientGain.gain.exponentialRampToValueAtTime(.0001, now + .42);
  posterAmbientStopTimer = setTimeout(finish, 470);
}

function startPosterAmbience() {
  if (posterAmbientGain || !posterReveal.classList.contains("open")) return;
  initializeAudio();
  if (!audioContext || !masterGain) return;
  if (audioContext.state === "suspended") audioContext.resume();

  const now = audioContext.currentTime;
  const bedGain = audioContext.createGain();
  bedGain.gain.setValueAtTime(.0001, now);
  bedGain.gain.exponentialRampToValueAtTime(muted ? .0001 : .115, now + .9);
  bedGain.connect(masterGain);

  const low = audioContext.createOscillator();
  const high = audioContext.createOscillator();
  low.type = "sine";
  high.type = "triangle";
  low.frequency.setValueAtTime(97, now);
  high.frequency.setValueAtTime(145.5, now);
  high.detune.setValueAtTime(-7, now);

  const lowGain = audioContext.createGain();
  const highGain = audioContext.createGain();
  lowGain.gain.value = .52;
  highGain.gain.value = .12;
  low.connect(lowGain);
  high.connect(highGain);
  lowGain.connect(bedGain);
  highGain.connect(bedGain);

  const noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 2.4), audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let index = 0; index < noiseData.length; index += 1) noiseData[index] = (Math.random() * 2 - 1) * .16;
  const noise = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 380;
  noiseGain.gain.value = .055;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(bedGain);

  low.start(now);
  high.start(now);
  noise.start(now);
  posterAmbientGain = bedGain;
  posterAmbientSources = [low, high, noise];
}

function transitionWildsIntoPoster() {
  if (activeTrackId !== "fragment-03") return;
  if (activeAudio) {
    fadeMediaVolume(activeAudio, muted ? 0 : POSTER_WILDS_VOLUME, reducedMotion ? 30 : 1900);
  }
  clearTimeout(posterAmbientTimer);
  posterAmbientTimer = setTimeout(startPosterAmbience, reducedMotion ? 0 : 650);
}

function stopTimelineAudio(immediate = false) {
  if (!timelineAudio) return;
  const media = timelineAudio;
  const finish = () => {
    media.pause();
    media.currentTime = 0;
    if (timelineAudio === media) timelineAudio = undefined;
  };
  if (immediate || reducedMotion) {
    finish();
    return;
  }
  const startVolume = media.volume;
  const startedAt = performance.now();
  const step = now => {
    const progress = Math.min(1, Math.max(0, (now - startedAt) / 460));
    media.volume = startVolume * (1 - progress);
    if (progress < 1) {
      timelineAudioFadeFrame = requestAnimationFrame(step);
    } else {
      timelineAudioFadeFrame = undefined;
      finish();
    }
  };
  if (timelineAudioFadeFrame) cancelAnimationFrame(timelineAudioFadeFrame);
  timelineAudioFadeFrame = requestAnimationFrame(step);
}

function stopTimelineVideo() {
  if (!timelineVideo) return;
  timelineVideo.pause();
  timelineVideo.controls = false;
  try { timelineVideo.currentTime = 0; } catch (_) { /* metadata may not be ready */ }
  timelineVideo = undefined;
}

function playTimelineAudio(item) {
  if (!item.audioSrc) return;
  stopPosterAmbience();
  if (activeAudio) {
    const wildsAudio = activeAudio;
    fadeMediaVolume(wildsAudio, 0, reducedMotion ? 20 : 620, () => {
      if (activeAudio === wildsAudio) {
        wildsAudio.pause();
        activeAudio = null;
      }
    });
  }
  stopTimelineAudio(true);
  const media = new Audio(item.audioSrc);
  const targetVolume = muted ? 0 : (item.audioVolume ?? .32);
  media.volume = 0;
  timelineAudio = media;
  media.play().then(() => {
    const startedAt = performance.now();
    const fade = now => {
      const progress = Math.min(1, (now - startedAt) / (reducedMotion ? 30 : 560));
      if (timelineAudio !== media) return;
      media.volume = targetVolume * progress;
      if (progress < 1) timelineAudioFadeFrame = requestAnimationFrame(fade);
    };
    timelineAudioFadeFrame = requestAnimationFrame(fade);
  }).catch(() => {
    if (timelineAudio === media) timelineAudio = undefined;
  });
  media.addEventListener("ended", () => {
    if (timelineAudio === media) {
      timelineAudio = undefined;
      startPosterAmbience();
    }
  }, { once: true });
}

function stopAudio() {
  stopWildsSequence();
  stopPosterAmbience(true);
  stopTimelineAudio(true);
  stopTimelineVideo();
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
  const isGrassTrack = track.id === "fragment-02";
  const source = track.snippetSrc || track.fullAudioSrc;
  const scheduleGrassFallback = () => {
    if (!isGrassTrack) return;
    clearTimeout(grassFadeTimer);
    grassFadeTimer = setTimeout(() => {
      if (activeTrackId === "fragment-02") hideGrassMessage();
    }, track.placeholderTone.duration * 1000);
  };
  if (source) {
    activeAudio = new Audio(source);
    activeAudio.volume = muted ? 0 : .42;
    if (isGrassTrack) {
      activeAudio.addEventListener("ended", () => {
        if (activeTrackId === "fragment-02") hideGrassMessage();
      }, { once: true });
    }
    activeAudio.play().catch(() => {
      scheduleGrassFallback();
      playPlaceholder(track);
    });
  } else {
    scheduleGrassFallback();
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
  activeTrackId = track.id;
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
  if (track.id === "fragment-03") {
    showWildsEntry();
    startWildsSequence(activeAudio);
  } else {
    hideWildsEntry();
  }
  if (track.id === "fragment-02") {
    showGrassMessage();
  } else {
    hideGrassMessage();
  }
  if (track.id === "fragment-05") {
    startDawnScene(activeAudio);
  } else {
    stopDawnScene();
  }
  if (track.id === "fragment-04") {
    startShelterScene();
  } else {
    stopShelterScene();
  }
  if (track.id === "fragment-06") {
    startGoodnewsScene(activeAudio);
  } else {
    stopGoodnewsScene();
  }

  const visualDuration = track.id === "fragment-05" ? 16000 : (track.id === "fragment-04" ? 15000 : (track.id === "fragment-06" ? 13600 : track.placeholderTone.duration * 1000));
  if (progressAnimation) progressAnimation.cancel();
  progressAnimation = fragmentProgress.animate(
    [{ width: "0%", opacity: 1 }, { width: "100%", opacity: 1 }, { width: "100%", opacity: 0 }],
    { duration: visualDuration, easing: "linear", fill: "forwards" }
  );
  clearTimeout(fragmentTimer);
  fragmentTimer = setTimeout(() => {
    node.classList.remove("active");
    guidingLamp.classList.remove("active");
    world.classList.remove("fragment-active");
    fragmentCaption.classList.remove("visible");
    worldHint.textContent = "海上漂浮的空瓶，载满爱的信号，化作指路的灯火。";
  }, visualDuration + 250);
}

function dawnEase(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function dawnMix(start, end, amount) {
  return start + (end - start) * amount;
}

function dawnPlanePoint(index, total) {
  const outline = [
    [1, 0], [.16, -.12], [-.06, -.6], [-.2, -.6], [-.14, -.1], [-.9, -.18], [-1, -.34],
    [-.96, 0], [-1, .34], [-.9, .18], [-.14, .1], [-.2, .6], [-.06, .6], [.16, .12]
  ];
  const progress = index / total * outline.length;
  const base = Math.floor(progress) % outline.length;
  const next = (base + 1) % outline.length;
  const amount = progress - Math.floor(progress);
  return {
    x: dawnMix(outline[base][0], outline[next][0], amount),
    y: dawnMix(outline[base][1], outline[next][1], amount)
  };
}

function createDawnParticles() {
  dawnParticles = Array.from({ length: reducedMotion ? 34 : 72 }, (_, index) => {
    const group = index % 2;
    const angle = Math.random() * Math.PI * 2;
    const spread = Math.pow(Math.random(), .65);
    return {
      group,
      angle,
      spread,
      size: 1.4 + Math.random() * 2.7,
      drift: Math.random() * Math.PI * 2,
      twinkle: .48 + Math.random() * .52,
      mergeX: (Math.random() - .5) * .15,
      mergeY: (Math.random() - .5) * .11,
      plane: dawnPlanePoint(index, reducedMotion ? 34 : 72)
    };
  });
}

function drawDawnEarth(context, width, height, progress) {
  const mobile = width <= 680;
  return {
    x: width * .5,
    y: height * .49,
    radius: Math.min(width, height) * (mobile ? .28 : .25)
  };
}

function drawDawnParticle(context, x, y, particle, opacity, scale) {
  const size = particle.size * scale;
  context.save();
  context.globalAlpha = opacity * particle.twinkle;
  context.fillStyle = "rgba(223, 241, 255, .96)";
  context.shadowColor = "rgba(130, 208, 255, .92)";
  context.shadowBlur = size * 5;
  [[0, 0, 1], [-.7, .18, .66], [.58, -.35, .62], [.16, .65, .55]].forEach(([dx, dy, factor]) => {
    context.beginPath();
    context.arc(x + dx * size, y + dy * size, size * factor, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
}

function drawDawnScene(timestamp, runId, startedAt) {
  if (runId !== dawnRunId) return;
  const bounds = dawnCanvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (dawnCanvas.width !== Math.round(bounds.width * ratio) || dawnCanvas.height !== Math.round(bounds.height * ratio)) {
    dawnCanvas.width = Math.round(bounds.width * ratio);
    dawnCanvas.height = Math.round(bounds.height * ratio);
  }
  const context = dawnCanvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, bounds.width, bounds.height);
  const elapsed = timestamp - startedAt;
  const progress = Math.min(1, elapsed / 16000);
  const earth = drawDawnEarth(context, bounds.width, bounds.height, progress);
  const approach = dawnEase((progress - .12) / .36);
  const merge = dawnEase((progress - .48) / .13);
  const plane = dawnEase((progress - .61) / .15);
  const fly = dawnEase((progress - .76) / .21);
  const leftStart = { x: bounds.width * .17, y: bounds.height * .22 };
  const rightStart = { x: bounds.width * .84, y: bounds.height * .76 };
  const leftNear = { x: earth.x - earth.radius * 1.14, y: earth.y - earth.radius * .4 };
  const rightNear = { x: earth.x + earth.radius * 1.14, y: earth.y + earth.radius * .4 };
  const planeScale = earth.radius * .92;
  const planeAngle = -.48;
  dawnParticles.forEach(particle => {
    const start = particle.group === 0 ? leftStart : rightStart;
    const near = particle.group === 0 ? leftNear : rightNear;
    const clusterX = dawnMix(start.x, near.x, approach);
    const clusterY = dawnMix(start.y, near.y, approach);
    const swirl = earth.radius * (.42 + particle.spread * .78);
    const initialX = clusterX + Math.cos(particle.angle) * swirl;
    const initialY = clusterY + Math.sin(particle.angle) * swirl * .7;
    const gatherX = earth.x + particle.mergeX * bounds.width;
    const gatherY = earth.y + particle.mergeY * bounds.height;
    let x = dawnMix(initialX, gatherX, merge);
    let y = dawnMix(initialY, gatherY, merge);
    const px = particle.plane.x * planeScale;
    const py = particle.plane.y * planeScale;
    const rotatedX = px * Math.cos(planeAngle) - py * Math.sin(planeAngle);
    const rotatedY = px * Math.sin(planeAngle) + py * Math.cos(planeAngle);
    const flightX = earth.x + rotatedX + fly * bounds.width * .42;
    const flightY = earth.y + rotatedY - fly * bounds.height * .42;
    x = dawnMix(x, flightX, plane);
    y = dawnMix(y, flightY, plane);
    const flutter = Math.sin(elapsed * .002 + particle.drift) * (plane > .78 ? 1.2 : 3.2);
    const fade = progress > .87 ? 1 - dawnEase((progress - .87) / .13) : 1;
    drawDawnParticle(context, x + flutter, y + Math.cos(elapsed * .0017 + particle.drift) * 2, particle, fade, plane > .58 ? 1.08 : 1);
  });
  if (progress < 1) dawnFrame = requestAnimationFrame(next => drawDawnScene(next, runId, startedAt));
}

function startDawnScene(audio) {
  stopDawnScene();
  const runId = ++dawnRunId;
  createDawnParticles();
  stage.classList.add("dawn-moment");
  dawnScene.setAttribute("aria-hidden", "false");
  dawnScene.classList.add("visible");
  const startedAt = performance.now();
  dawnFrame = requestAnimationFrame(next => drawDawnScene(next, runId, startedAt));
  if (audio) audio.addEventListener("ended", () => {
    if (runId === dawnRunId) stopDawnScene();
  }, { once: true });
}

function stopDawnScene() {
  dawnRunId += 1;
  if (dawnFrame) cancelAnimationFrame(dawnFrame);
  dawnFrame = undefined;
  dawnParticles = [];
  stage.classList.remove("dawn-moment");
  dawnScene.classList.remove("visible");
  dawnScene.setAttribute("aria-hidden", "true");
}

function shelterEase(value) {
  const n = Math.max(0, Math.min(1, value));
  return n * n * (3 - 2 * n);
}

function makeShelterParticles() {
  const count = reducedMotion ? 46 : (window.innerWidth <= 680 ? 86 : 138);
  shelterParticles = Array.from({ length: count }, (_, index) => {
    const side = index % 2;
    const lineProgress = (Math.floor(index / 2) + Math.random() * .55) / Math.ceil(count / 2);
    return {
      dark: index % 7 === 0,
      x: Math.random(), y: Math.random(),
      side, lineProgress,
      size: .65 + Math.random() * 1.25,
      shape: Math.random() < .38 ? "dot" : "dash",
      length: 3.5 + Math.random() * 6,
      tilt: (Math.random() - .5) * .75,
      phase: Math.random() * Math.PI * 2,
      speed: .0007 + Math.random() * .001,
      opacity: .34 + Math.random() * .42
    };
  });
}

function drawShelterScene(timestamp, runId) {
  if (runId !== shelterRunId) return;
  const rect = shelterCanvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(rect.width * ratio);
  const pixelHeight = Math.round(rect.height * ratio);
  if (shelterCanvas.width !== pixelWidth || shelterCanvas.height !== pixelHeight) {
    shelterCanvas.width = pixelWidth; shelterCanvas.height = pixelHeight;
  }
  const ctx = shelterCanvas.getContext("2d");
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.clearRect(0,0,rect.width,rect.height);
  const elapsed = timestamp - shelterStartedAt;
  const gather = reducedMotion ? 1 : shelterEase((elapsed - 2300) / 6800);
  const personRect = shelterPerson.getBoundingClientRect();
  const sceneRect = shelterScene.getBoundingClientRect();
  const centerX = personRect.left - sceneRect.left + personRect.width * .5;
  const halfWidth = Math.min(rect.width * (rect.width <= 680 ? .38 : .27), personRect.width * 1.02);
  const height = Math.min(rect.height * .23, halfWidth * .72);
  const personTop = personRect.top - sceneRect.top;
  const roofGap = Math.max(rect.width <= 680 ? 28 : 34, personRect.height * (rect.width <= 680 ? .09 : .075));
  const roofY = Math.max(rect.height * .1, personTop - height - roofGap);
  const protecting = shelterScene.classList.contains("protecting") ? 1 : 0;
  shelterParticles.forEach((p,index) => {
    const roofParticle = !p.dark;
    const endpointX = centerX + (p.side ? 1 : -1) * p.lineProgress * halfWidth * (1 + protecting * .11);
    const endpointY = roofY + p.lineProgress * height - protecting * Math.sin(p.lineProgress * Math.PI) * 11;
    const wobbleX = Math.sin(timestamp * p.speed + p.phase) * (roofParticle ? 4 : 13);
    const wobbleY = Math.cos(timestamp * p.speed * .83 + p.phase) * (roofParticle ? 3 : 9);
    let x = (p.x * rect.width) * (1 - gather) + endpointX * gather + wobbleX;
    let y = (p.y * rect.height) * (1 - gather) + endpointY * gather + wobbleY;
    if (p.dark) {
      x = ((p.x * rect.width + elapsed * (.009 + index % 3 * .003)) % (rect.width + 60)) - 30;
      y = p.y * rect.height + wobbleY;
      const dx = x - centerX, dy = y - (roofY + height * .65);
      if (Math.abs(dx) < halfWidth * 1.15 && Math.abs(dy) < height * 1.15) x += Math.sign(dx || 1) * 42;
    }
    const glow = gather > .92 && roofParticle ? 1 + Math.sin(timestamp * .002 + p.phase) * .16 : 1;
    ctx.save();
    ctx.globalAlpha = p.dark ? .1 : p.opacity * (.42 + gather * .58);
    ctx.strokeStyle = p.dark ? "rgba(119,139,165,.42)" : "rgba(243,248,255,.92)";
    ctx.fillStyle = p.dark ? "rgba(119,139,165,.34)" : "rgba(247,251,255,.94)";
    ctx.shadowColor = p.dark ? "transparent" : "rgba(190,222,255,.55)";
    ctx.shadowBlur = roofParticle ? 3.5 * glow : 0;
    ctx.lineCap = "round";
    if (p.shape === "dot") {
      ctx.beginPath();
      ctx.arc(x, y, p.size * glow, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const roofAngle = p.side ? Math.atan2(height, halfWidth) : -Math.atan2(height, halfWidth);
      const angle = roofAngle + p.tilt;
      const dashLength = p.length * glow;
      ctx.lineWidth = Math.max(1, p.size * .72);
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(angle) * dashLength * .5, y - Math.sin(angle) * dashLength * .5);
      ctx.lineTo(x + Math.cos(angle) * dashLength * .5, y + Math.sin(angle) * dashLength * .5);
      ctx.stroke();
    }
    ctx.restore();
  });
  shelterFrame = requestAnimationFrame(next => drawShelterScene(next,runId));
}

function startShelterScene() {
  stopShelterScene();
  const runId = ++shelterRunId;
  makeShelterParticles();
  shelterStartedAt = performance.now();
  stage.classList.add("shelter-moment");
  shelterScene.setAttribute("aria-hidden","false");
  shelterScene.classList.add("visible");
  shelterTimers.push(setTimeout(() => shelterScene.classList.add("roof-formed"), 9000));
  shelterFrame = requestAnimationFrame(next => drawShelterScene(next,runId));
}

function stopShelterScene() {
  shelterRunId += 1;
  if (shelterFrame) cancelAnimationFrame(shelterFrame);
  shelterFrame = undefined;
  shelterTimers.forEach(clearTimeout); shelterTimers = [];
  shelterParticles = [];
  stage.classList.remove("shelter-moment");
  shelterScene.classList.remove("visible","roof-formed","protecting","fast-forward","swaying");
  shelterScene.setAttribute("aria-hidden","true");
  dreamTodo.classList.remove("complete");
  dreamTodo.querySelectorAll("button").forEach(button => button.classList.remove("checked"));
  dreamEcho.className = "dream-echo";
}

function goodnewsEase(value) {
  const n = Math.max(0, Math.min(1, value));
  return n * n * (3 - 2 * n);
}

function createGoodnewsTargets() {
  const mobile = window.innerWidth <= 680;
  const targets = [];
  const linePoints = mobile ? 29 : 43;
  for (let line = 0; line < 5; line += 1) {
    for (let index = 0; index < linePoints; index += 1) {
      targets.push({
        nx: -.5 + index / (linePoints - 1),
        unitY: line - 2,
        shape: index % 3 === 0 ? "dot" : "dash",
        angle: 0,
        note: false
      });
    }
  }

  const notes = mobile
    ? [[-.3, 1.05, true], [-.08, -.85, false], [.18, 1.9, true], [.36, -.05, false]]
    : [[-.32, 1.05, true], [-.11, -.85, false], [.12, 1.9, true], [.31, -.05, true]];
  notes.forEach(([nx, unitY, flagged], noteIndex) => {
    const flip = noteIndex % 3 === 2;
    for (let index = 0; index < 11; index += 1) {
      const angle = Math.PI * 2 * index / 11;
      targets.push({
        nx: nx + Math.cos(angle) * .017,
        unitY: unitY + Math.sin(angle) * .28,
        shape: "dot",
        angle: 0,
        note: true
      });
    }
    [[-.009,-.09],[0,0],[.009,.09],[-.008,.12],[.008,-.12]].forEach(([dx,dy]) => {
      targets.push({ nx: nx + dx, unitY: unitY + dy, shape: "dot", angle: 0, note: true });
    });
    for (let index = 0; index < 8; index += 1) {
      targets.push({
        nx: nx + (flip ? -.016 : .016),
        unitY: unitY - index * .28,
        shape: "dash",
        angle: Math.PI / 2,
        note: true
      });
    }
    if (flagged) {
      for (let index = 0; index < 7; index += 1) {
        targets.push({
          nx: nx + (flip ? -.016 - index * .009 : .016 + index * .009),
          unitY: unitY - 1.94 + Math.sin(index / 6 * Math.PI) * .3,
          shape: index % 2 ? "dot" : "dash",
          angle: flip ? -.45 : .45,
          note: true
        });
      }
    }
  });
  return targets;
}

function makeGoodnewsParticles() {
  goodnewsParticles = createGoodnewsTargets().map((target, index) => ({
    ...target,
    startX: Math.random(),
    startY: Math.random(),
    size: target.note ? .9 + Math.random() * 1.1 : .65 + Math.random() * .85,
    length: target.note ? 4 + Math.random() * 5 : 5 + Math.random() * 7,
    phase: Math.random() * Math.PI * 2,
    speed: .00065 + Math.random() * .00065,
    opacity: .42 + Math.random() * .42,
    delay: (index % 17) * 18 + Math.random() * 260
  }));
}

function drawGoodnewsScene(timestamp, runId) {
  if (runId !== goodnewsRunId) return;
  const rect = goodnewsCanvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(rect.width * ratio);
  const pixelHeight = Math.round(rect.height * ratio);
  if (goodnewsCanvas.width !== pixelWidth || goodnewsCanvas.height !== pixelHeight) {
    goodnewsCanvas.width = pixelWidth;
    goodnewsCanvas.height = pixelHeight;
  }
  const ctx = goodnewsCanvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const elapsed = timestamp - goodnewsStartedAt;
  const staffWidth = Math.min(rect.width * (rect.width <= 680 ? .84 : .72), 880);
  const gap = Math.min(rect.height * (rect.width <= 680 ? .045 : .055), rect.width <= 680 ? 25 : 38);
  const centerX = rect.width * .5;
  const centerY = rect.height * (rect.width <= 680 ? .43 : .44);
  const settled = goodnewsEase((elapsed - 900) / 5600);
  const floatAmount = goodnewsEase((elapsed - 6100) / 1300);
  const driftX = Math.sin(elapsed * .00048) * 5 * floatAmount;
  const driftY = Math.cos(elapsed * .00058) * 8 * floatAmount;
  const rotation = Math.sin(elapsed * .00036) * .012 * floatAmount;

  goodnewsParticles.forEach(particle => {
    const individual = goodnewsEase((elapsed - 900 - particle.delay) / 5200);
    const targetX = centerX + particle.nx * staffWidth;
    const targetY = centerY + particle.unitY * gap;
    const localX = targetX - centerX;
    const localY = targetY - centerY;
    const rotatedX = centerX + localX * Math.cos(rotation) - localY * Math.sin(rotation) + driftX;
    const rotatedY = centerY + localX * Math.sin(rotation) + localY * Math.cos(rotation) + driftY;
    const arcX = Math.sin(individual * Math.PI + particle.phase) * (1 - individual) * 34;
    const arcY = Math.cos(individual * Math.PI * 1.5 + particle.phase) * (1 - individual) * 22;
    const wobbleX = Math.sin(timestamp * particle.speed + particle.phase) * (1.5 + (1 - settled) * 5);
    const wobbleY = Math.cos(timestamp * particle.speed * .83 + particle.phase) * (1.2 + (1 - settled) * 4);
    const x = particle.startX * rect.width * (1 - individual) + rotatedX * individual + arcX + wobbleX;
    const y = particle.startY * rect.height * (1 - individual) + rotatedY * individual + arcY + wobbleY;
    const alpha = particle.opacity * (.22 + individual * .78);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(248,252,255,.96)";
    ctx.strokeStyle = "rgba(242,249,255,.94)";
    ctx.shadowColor = particle.note ? "rgba(199,225,255,.72)" : "rgba(178,214,255,.5)";
    ctx.shadowBlur = particle.note ? 6 : 3.5;
    ctx.lineCap = "round";
    if (particle.shape === "dot") {
      ctx.beginPath();
      ctx.arc(x, y, particle.size * (particle.note ? 1.15 : 1), 0, Math.PI * 2);
      ctx.fill();
    } else {
      const angle = particle.angle + rotation + (1 - individual) * Math.sin(particle.phase) * .7;
      ctx.lineWidth = Math.max(.9, particle.size * .75);
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(angle) * particle.length * .5, y - Math.sin(angle) * particle.length * .5);
      ctx.lineTo(x + Math.cos(angle) * particle.length * .5, y + Math.sin(angle) * particle.length * .5);
      ctx.stroke();
    }
    ctx.restore();
  });
  goodnewsFrame = requestAnimationFrame(next => drawGoodnewsScene(next, runId));
}

function startGoodnewsScene(audio) {
  stopGoodnewsScene();
  const runId = ++goodnewsRunId;
  makeGoodnewsParticles();
  goodnewsStartedAt = performance.now();
  stage.classList.add("goodnews-moment");
  goodnewsScene.setAttribute("aria-hidden", "false");
  goodnewsScene.classList.add("visible");
  goodnewsFormTimer = setTimeout(() => goodnewsScene.classList.add("formed"), 7000);
  goodnewsFrame = requestAnimationFrame(next => drawGoodnewsScene(next, runId));
  if (audio) audio.addEventListener("ended", () => {
    if (runId === goodnewsRunId) stopGoodnewsScene();
  }, { once: true });
}

function stopGoodnewsScene() {
  goodnewsRunId += 1;
  if (goodnewsFrame) cancelAnimationFrame(goodnewsFrame);
  goodnewsFrame = undefined;
  clearTimeout(goodnewsFormTimer);
  goodnewsFormTimer = undefined;
  goodnewsParticles = [];
  stage.classList.remove("goodnews-moment");
  goodnewsScene.classList.remove("visible", "formed");
  goodnewsScene.setAttribute("aria-hidden", "true");
}


function showWildsEntry() {
  wildsChibiEntry.classList.add("visible");
  wildsChibiEntry.setAttribute("aria-hidden", "false");
}

function cancelGrassReveal() {
  grassRevealTimers.forEach(timer => clearTimeout(timer));
  grassRevealTimers = [];
}

function showGrassMessage() {
  if (activeTrackId !== "fragment-02" || !stage.classList.contains("entered")) return;
  clearTimeout(grassFadeTimer);
  cancelGrassReveal();
  const lines = [...grassMessage.querySelectorAll(".grass-line")];
  lines.forEach(line => line.classList.remove("is-revealed"));
  grassMessage.classList.remove("exiting", "visible");
  stage.classList.add("grass-moment");
  void grassMessage.offsetWidth;
  grassMessage.classList.add("visible");
  const revealDelays = reducedMotion ? [0, 0, 0, 0, 0] : [80, 320, 660, 940, 1260];
  lines.forEach((line, index) => {
    const timer = window.setTimeout(() => {
      if (
        activeTrackId === "fragment-02"
        && grassMessage.classList.contains("visible")
        && !grassMessage.classList.contains("exiting")
      ) line.classList.add("is-revealed");
    }, revealDelays[index]);
    grassRevealTimers.push(timer);
  });
}

function hideGrassMessage() {
  clearTimeout(grassFadeTimer);
  cancelGrassReveal();
  stage.classList.remove("grass-moment");
  if (!grassMessage.classList.contains("visible") && !grassMessage.classList.contains("exiting")) {
    grassMessage.classList.remove("visible");
    return;
  }
  grassMessage.classList.add("exiting");
  grassFadeTimer = setTimeout(() => {
    grassMessage.classList.remove("visible", "exiting");
  }, 920);
}

function renderPosterTimeline() {
  posterTimelineLayer.replaceChildren();
  posterTimeline.forEach(item => {
    const sticker = document.createElement("button");
    sticker.className = "timeline-sticker";
    if (item.contentType && item.contentSrc) sticker.classList.add("has-memory");
    sticker.type = "button";
    sticker.dataset.timelineId = String(item.id);
    sticker.setAttribute(
      "aria-label",
      item.contentType && item.contentSrc
        ? `打开 ${item.year} 的巡演回忆`
        : `${item.year} 时间节点`
    );
    sticker.style.setProperty("--sticker-left", item.position.left);
    sticker.style.setProperty("--sticker-top", item.position.top);
    sticker.style.setProperty("--sticker-width", item.position.width);
    sticker.style.setProperty("--sticker-rotation", item.position.rotation);

    const image = document.createElement("img");
    image.src = item.stickerSrc;
    image.alt = "";
    image.draggable = false;
    if (item.clipPath) image.style.clipPath = item.clipPath;
    sticker.append(image);

    sticker.addEventListener("click", event => {
      event.stopPropagation();
      if (item.contentType && item.contentSrc) {
        openTimelineMemory(item, sticker);
      } else {
        sticker.classList.remove("peek");
        void sticker.offsetWidth;
        sticker.classList.add("peek");
        window.setTimeout(() => sticker.classList.remove("peek"), 520);
      }
    });
    posterTimelineLayer.append(sticker);
  });
}

function renderTimelineMemoryContent(item) {
  timelineMemoryContent.replaceChildren();
  timelineMemoryCaption.textContent = item.contentCaption || "";
  timelineMemoryCaption.classList.toggle("visible", Boolean(item.contentCaption));
  timelineMemoryContent.classList.remove("has-caption", "has-video");
  timelineMemoryPaper.classList.remove("has-video");
  if (item.contentType === "poster" || item.contentType === "image") {
    const image = document.createElement("img");
    image.src = item.contentSrc;
    image.alt = item.contentAlt || item.year || "巡演回忆图片";
    image.draggable = false;
    timelineMemoryContent.append(image);
    return;
  }
  if (item.contentType === "video") {
    timelineMemoryContent.classList.add("has-video");
    timelineMemoryPaper.classList.add("has-video");

    const videoStage = document.createElement("div");
    videoStage.className = "timeline-video-stage";

    const video = document.createElement("video");
    video.src = item.contentSrc;
    video.poster = item.coverSrc || "";
    video.controls = false;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "metadata";
    video.loop = false;
    video.muted = muted;
    video.setAttribute("aria-label", item.contentAlt || "巡演回忆视频");
    timelineVideo = video;

    const playButton = document.createElement("button");
    playButton.className = "timeline-video-play";
    playButton.type = "button";
    playButton.setAttribute("aria-label", item.playPrompt || "点击播放视频");

    const playIcon = document.createElement("img");
    playIcon.src = item.playIconSrc;
    playIcon.alt = "";
    playIcon.draggable = false;

    const playPrompt = document.createElement("span");
    playPrompt.textContent = item.playPrompt || "点击播放视频";
    playButton.append(playIcon, playPrompt);

    playButton.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      playButton.disabled = true;
      stopPosterAmbience();
      if (activeAudio) {
        const previousAudio = activeAudio;
        fadeMediaVolume(previousAudio, 0, reducedMotion ? 20 : 420, () => {
          if (activeAudio === previousAudio) {
            previousAudio.pause();
            activeAudio = null;
          }
        });
      }
      video.muted = muted;
      video.controls = true;
      video.play().then(() => {
        videoStage.classList.add("is-playing");
      }).catch(() => {
        playButton.disabled = false;
        video.controls = false;
      });
    });

    video.addEventListener("ended", () => {
      video.pause();
      videoStage.classList.add("has-ended");
    });

    videoStage.append(video, playButton);
    timelineMemoryContent.append(videoStage);
    return;
  }
  if (item.contentType === "text") {
    const copy = document.createElement("p");
    copy.textContent = item.contentText || "";
    timelineMemoryContent.append(copy);
  }
}

function openTimelineMemory(item, sticker) {
  closeFilmReel();
  if (item.contentType === "video") {
    stopTimelineAudio(true);
  } else {
    playTimelineAudio(item);
  }
  clearTimeout(timelineCloseTimer);
  renderTimelineMemoryContent(item);
  activeTimelineSticker?.classList.remove("memory-source", "returning");
  activeTimelineSticker = sticker;
  sticker.classList.add("memory-source");

  const rect = sticker.getBoundingClientRect();
  const fromX = rect.left + rect.width / 2 - window.innerWidth / 2;
  const fromY = rect.top + rect.height / 2 - window.innerHeight / 2;
  timelineMemoryPaper.style.setProperty("--timeline-from-x", `${fromX}px`);
  timelineMemoryPaper.style.setProperty("--timeline-from-y", `${fromY}px`);
  timelineMemoryPaper.style.setProperty("--timeline-from-rotation", item.position.rotation);

  timelineMemory.classList.remove("open", "closing");
  timelineMemory.setAttribute("aria-hidden", "false");
  posterReveal.classList.add("timeline-memory-open");
  void timelineMemory.offsetWidth;
  timelineMemory.classList.add("open");
  timelineMemoryClose.focus({ preventScroll: true });
}

function closeTimelineMemory(immediate = false) {
  if (timelineMemory.getAttribute("aria-hidden") === "true") return;
  stopTimelineAudio(immediate);
  stopTimelineVideo();
  if (!immediate) window.setTimeout(startPosterAmbience, reducedMotion ? 0 : 480);
  clearTimeout(timelineCloseTimer);
  const finish = () => {
    timelineMemory.classList.remove("open", "closing");
    timelineMemory.setAttribute("aria-hidden", "true");
    posterReveal.classList.remove("timeline-memory-open");
    timelineMemoryContent.replaceChildren();
    timelineMemoryCaption.textContent = "";
    timelineMemoryCaption.classList.remove("visible");
    activeTimelineSticker?.classList.remove("memory-source", "returning");
    activeTimelineSticker = null;
  };
  if (immediate || reducedMotion) {
    finish();
    return;
  }
  timelineMemory.classList.remove("open");
  timelineMemory.classList.add("closing");
  activeTimelineSticker?.classList.add("returning");
  timelineCloseTimer = window.setTimeout(finish, 760);
}

function closeFilmReel() {
  filmReel.classList.remove("open");
  filmReel.setAttribute("aria-hidden", "true");
  posterFilmEntry.setAttribute("aria-expanded", "false");
}

function toggleFilmReel() {
  const shouldOpen = !filmReel.classList.contains("open");
  filmReel.classList.toggle("open", shouldOpen);
  filmReel.setAttribute("aria-hidden", String(!shouldOpen));
  posterFilmEntry.setAttribute("aria-expanded", String(shouldOpen));
}

function closePosterScene() {
  closeTimelineMemory(true);
  stopPosterAmbience();
  closeFilmReel();
  posterReveal.classList.remove("open");
  window.setTimeout(() => {
    if (!posterReveal.classList.contains("open")) {
      posterReveal.classList.remove("opening");
      posterReveal.setAttribute("aria-hidden", "true");
    }
  }, reducedMotion ? 20 : 430);
}

function hideWildsEntry() {
  wildsChibiEntry.classList.remove("visible");
  wildsChibiEntry.setAttribute("aria-hidden", "true");
  closePosterScene();
}

function openPosterScene() {
  if (!wildsChibiEntry.classList.contains("visible")) return;
  posterReveal.setAttribute("aria-hidden", "false");
  posterReveal.classList.add("opening");
  transitionWildsIntoPoster();
  requestAnimationFrame(() => posterReveal.classList.add("open"));
}

function createWildsTargets(count) {
  const width = Math.max(320, window.innerWidth);
  const height = Math.max(480, window.innerHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const mobile = width <= 680;
  const centerY = height * (mobile ? .48 : .49);
  const topSize = Math.min(mobile ? 58 : 86, width * (mobile ? .17 : .09));
  const bottomSize = Math.min(mobile ? 66 : 104, width * (mobile ? .205 : .115));

  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `900 ${topSize}px Arial Black, Arial, sans-serif`;
  context.fillText("THE", width / 2, centerY - topSize * .48);
  context.font = `900 ${bottomSize}px Arial Black, Arial, sans-serif`;
  context.fillText("WILDS", width / 2, centerY + bottomSize * .43);

  const pixels = context.getImageData(0, 0, width, height).data;
  const candidates = [];
  const step = mobile ? 4 : 5;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (pixels[(y * width + x) * 4 + 3] > 96) candidates.push({ x, y });
    }
  }
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
  }
  return candidates.slice(0, Math.min(count, candidates.length));
}

function wildsEdgeStart(index, width, height) {
  const offset = 32 + Math.random() * 54;
  if (index % 4 === 0) return { x: Math.random() * width, y: -offset };
  if (index % 4 === 1) return { x: width + offset, y: Math.random() * height };
  if (index % 4 === 2) return { x: Math.random() * width, y: height + offset };
  return { x: -offset, y: Math.random() * height };
}

function stopWildsSequence() {
  wildsRunId += 1;
  wildsTimers.forEach(timer => clearTimeout(timer));
  wildsTimers = [];
  wildsAnimations.forEach(animation => {
    try { animation.cancel(); } catch (_) { /* already finished */ }
  });
  wildsAnimations = [];
  wildsFormation.classList.remove("active", "formed");
  wildsLines.replaceChildren();
}

function startWildsSequence(audio) {
  stopWildsSequence();
  const runId = wildsRunId;
  const durationMs = Number.isFinite(audio?.duration) && audio.duration > 0
    ? audio.duration * 1000
    : 18312;
  const assemblyDuration = Math.min(5000, Math.max(4200, durationMs * .4));
  const particleCount = reducedMotion ? 0 : (window.innerWidth <= 680 ? 78 : 132);
  const targets = createWildsTargets(particleCount);
  const width = window.innerWidth;
  const height = window.innerHeight;

  wildsFormation.classList.add("active");
  targets.forEach((target, index) => {
    const line = document.createElement("i");
    const start = wildsEdgeStart(index, width, height);
    const length = 8 + Math.random() * 34;
    const thickness = .65 + Math.random() * 1.15;
    const startRotation = -120 + Math.random() * 240;
    const targetRotation = -24 + Math.random() * 48;
    const visibleOpacity = .24 + Math.random() * .5;
    line.className = "wilds-line";
    line.style.width = `${length.toFixed(1)}px`;
    line.style.height = `${thickness.toFixed(2)}px`;
    wildsLines.append(line);

    const delay = (index / Math.max(1, targets.length)) * assemblyDuration * .22 + Math.random() * 360;
    const travelTime = assemblyDuration * (.5 + Math.random() * .12);
    const bendX = (start.x + target.x) * .5 + (Math.random() - .5) * width * .18;
    const bendY = (start.y + target.y) * .5 + (Math.random() - .5) * height * .16;
    const animation = line.animate([
      { transform: `translate3d(${start.x}px,${start.y}px,0) rotate(${startRotation}deg) scaleX(.55)`, opacity: 0 },
      { offset: .12, opacity: visibleOpacity },
      { offset: .58, transform: `translate3d(${bendX}px,${bendY}px,0) rotate(${(startRotation + targetRotation) * .5}deg) scaleX(1)`, opacity: visibleOpacity * .82 },
      { transform: `translate3d(${target.x}px,${target.y}px,0) rotate(${targetRotation}deg) scaleX(.42)`, opacity: visibleOpacity }
    ], {
      duration: travelTime,
      delay,
      easing: "cubic-bezier(.18,.68,.2,1)",
      fill: "forwards"
    });
    wildsAnimations.push(animation);
  });

  const revealAt = reducedMotion ? 180 : Math.min(durationMs - 950, 4500);
  const riseAt = reducedMotion ? 80 : Math.min(revealAt - 900, assemblyDuration + 480);
  wildsTimers.push(setTimeout(() => {
    if (runId === wildsRunId) wildsFormation.classList.add("rising");
  }, riseAt));
  wildsTimers.push(setTimeout(() => {
    if (runId !== wildsRunId) return;
    wildsFormation.classList.add("formed");
    wildsLines.querySelectorAll(".wilds-line").forEach((line, index) => {
      const fade = line.animate(
        [{ opacity: getComputedStyle(line).opacity }, { opacity: 0 }],
        { duration: 720 + index % 5 * 70, easing: "ease-out", fill: "forwards" }
      );
      wildsAnimations.push(fade);
    });
  }, revealAt));
  wildsTimers.push(setTimeout(() => {
    if (runId === wildsRunId) stopWildsSequence();
  }, revealAt + 5000));

  if (audio) {
    audio.addEventListener("ended", () => {
      if (runId === wildsRunId) stopWildsSequence();
    }, { once: true });
  } else {
    wildsTimers.push(setTimeout(() => {
      if (runId === wildsRunId) stopWildsSequence();
    }, durationMs));
  }
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

wildsChibiEntry.addEventListener("click", event => {
  event.stopPropagation();
  openPosterScene();
});

posterClose.addEventListener("click", event => {
  event.stopPropagation();
  closePosterScene();
});

posterFilmEntry.addEventListener("click", event => {
  event.stopPropagation();
  toggleFilmReel();
});

filmReel.addEventListener("click", event => {
  event.stopPropagation();
  closeFilmReel();
});

timelineMemoryClose.addEventListener("click", event => {
  event.stopPropagation();
  closeTimelineMemory();
});

timelineMemoryBackdrop.addEventListener("click", event => {
  event.stopPropagation();
  closeTimelineMemory();
});

dreamTodo.addEventListener("click", event => {
  const button = event.target.closest("button[data-dream]");
  if (!button) return;
  event.stopPropagation();
  button.classList.toggle("checked");
  dreamEcho.className = `dream-echo ${button.dataset.dream}`;
  void dreamEcho.offsetWidth;
  dreamEcho.className = `dream-echo ${button.dataset.dream}`;
  if (button.dataset.dream === "sway") {
    shelterScene.classList.remove("swaying");
    void shelterScene.offsetWidth;
    shelterScene.classList.add("swaying");
    setTimeout(() => shelterScene.classList.remove("swaying"), 1600);
  }
  const complete = [...dreamTodo.querySelectorAll("button[data-dream]")].every(item => item.classList.contains("checked"));
  dreamTodo.classList.toggle("complete", complete);
});

const protectShelter = () => {
  if (!shelterScene.classList.contains("visible")) return;
  shelterScene.classList.add("protecting");
  setTimeout(() => shelterScene.classList.remove("protecting"), 1300);
};
shelterPerson.addEventListener("pointerenter", protectShelter);
shelterPerson.addEventListener("click", event => { event.stopPropagation(); protectShelter(); });
meltingClock.addEventListener("click", event => {
  event.stopPropagation();
  if (!shelterScene.classList.contains("roof-formed")) return;
  shelterScene.classList.remove("fast-forward");
  void shelterScene.offsetWidth;
  shelterScene.classList.add("fast-forward");
  setTimeout(() => shelterScene.classList.remove("fast-forward"), 1700);
});

window.addEventListener("keydown", event => {
  if (event.key === "Escape" && timelineMemory.getAttribute("aria-hidden") === "false") {
    closeTimelineMemory();
  }
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
  activeTrackId = null;
  hideWildsEntry();
  hideGrassMessage();
  stopDawnScene();
  stopShelterScene();
  stopGoodnewsScene();
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
  if (activeAudio) {
    activeAudio.volume = muted ? 0 : (
      posterReveal.classList.contains("open") && activeTrackId === "fragment-03"
        ? POSTER_WILDS_VOLUME
        : TRACK_VOLUME
    );
  }
  if (timelineAudio) timelineAudio.volume = muted ? 0 : .32;
  if (timelineVideo) timelineVideo.muted = muted;
  if (posterAmbientGain && audioContext) {
    posterAmbientGain.gain.setTargetAtTime(muted ? .0001 : .115, audioContext.currentTime, .14);
  }
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

renderPosterTimeline();
renderTrackNodes();
scheduleBlink();
requestAnimationFrame(animate);
introAudio.defaultMuted = false;
introAudio.muted = false;
updateSoundControl();
startIntroAudio();
