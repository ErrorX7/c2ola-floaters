export const tracks = [
  {
    id: "deng-huo",
    order: 1,
    title: "灯火",
    snippetSrc: "./denghuo.mp3?v=20260909a",
    fullAudioSrc: null,
    visualMood: {
      name: "lamp",
      accent: "#ffd99a",
      accentRgb: "255, 217, 154",
      secondary: "#18335d"
    },
    nodeBehavior: { x: 38, y: 62, depth: 1, driftX: 12, driftY: -9, driftSeconds: 9.5 },
    glowStyle: { rgb: "255, 211, 137", size: "150px", intensity: 1.2 },
    placeholderTone: { baseFrequency: 110, intervals: [1, 1.5, 2], duration: 8 }
  },
  {
    id: "fragment-02",
    order: 2,
    title: "青草地",
    snippetSrc: "./qingcaodi-qingmeiguo.mp3?v=20260909a",
    fullAudioSrc: null,
    visualMood: {
      name: "retinal",
      accent: "#a9c2ff",
      accentRgb: "169, 194, 255",
      secondary: "#102a5d"
    },
    nodeBehavior: { x: 32, y: 31, depth: .76, driftX: -14, driftY: 8, driftSeconds: 12 },
    glowStyle: { rgb: "143, 180, 255", size: "120px", intensity: .92 },
    placeholderTone: { baseFrequency: 138.59, intervals: [1, 1.333, 2], duration: 7 }
  },
  {
    id: "fragment-03",
    order: 3,
    title: "走出荒野",
    snippetSrc: "./zouchu-huangye.mp3?v=20260909a",
    fullAudioSrc: null,
    visualMood: {
      name: "deep",
      accent: "#7f9fe8",
      accentRgb: "127, 159, 232",
      secondary: "#0b2149"
    },
    nodeBehavior: { x: 75, y: 27, depth: .63, driftX: 9, driftY: 13, driftSeconds: 10.5 },
    glowStyle: { rgb: "116, 154, 236", size: "105px", intensity: .8 },
    placeholderTone: { baseFrequency: 164.81, intervals: [1, 1.25, 1.75], duration: 7.5 }
  },
  {
    id: "fragment-04",
    order: 4,
    title: "别害怕",
    snippetSrc: "./biehaipa.mp3?v=20260909a",
    fullAudioSrc: null,
    visualMood: {
      name: "blue",
      accent: "#91b5ff",
      accentRgb: "145, 181, 255",
      secondary: "#142d61"
    },
    nodeBehavior: { x: 82, y: 63, depth: .9, driftX: -12, driftY: -7, driftSeconds: 13 },
    glowStyle: { rgb: "134, 174, 255", size: "135px", intensity: .96 },
    placeholderTone: { baseFrequency: 196, intervals: [1, 1.2, 1.5], duration: 8 }
  },
  {
    id: "fragment-05",
    order: 5,
    title: "凌晨",
    snippetSrc: "./lingchen.mp3?v=20260909a",
    fullAudioSrc: null,
    visualMood: {
      name: "glass",
      accent: "#cfdeff",
      accentRgb: "207, 222, 255",
      secondary: "#182c4c"
    },
    nodeBehavior: { x: 51, y: 18, depth: .5, driftX: 8, driftY: 9, driftSeconds: 15 },
    glowStyle: { rgb: "190, 211, 255", size: "95px", intensity: .72 },
    placeholderTone: { baseFrequency: 220, intervals: [1, 1.125, 1.5], duration: 6.5 }
  },
  {
    id: "fragment-06",
    order: 6,
    title: "goodnews",
    snippetSrc: "./goodnews.mp3?v=20260909a",
    fullAudioSrc: null,
    visualMood: {
      name: "afterimage",
      accent: "#94a8dd",
      accentRgb: "148, 168, 221",
      secondary: "#111c39"
    },
    nodeBehavior: { x: 61, y: 77, depth: .72, driftX: -10, driftY: -11, driftSeconds: 11.5 },
    glowStyle: { rgb: "132, 154, 218", size: "115px", intensity: .82 },
    placeholderTone: { baseFrequency: 261.63, intervals: [1, 1.333, 1.667], duration: 7 }
  }
];

// GOOD NEWS keeps the existing floater lifecycle, but replaces the rigid straight
// staff with a softer hand-drawn curve inspired by the reference image.
function installGoodnewsCurvedScore() {
  const scene = document.querySelector("#goodnewsScene");
  const original = document.querySelector("#goodnewsCanvas");
  if (!scene || !original || document.querySelector("#goodnewsCurvedCanvas")) return;

  original.style.visibility = "hidden";
  const canvas = document.createElement("canvas");
  canvas.id = "goodnewsCurvedCanvas";
  canvas.className = "goodnews-canvas goodnews-curved-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.background = "transparent";
  original.insertAdjacentElement("afterend", canvas);

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frame = 0;
  let startedAt = 0;
  let particles = [];
  let running = false;

  const ease = value => {
    const n = Math.max(0, Math.min(1, value));
    return n * n * (3 - 2 * n);
  };

  function curvePoint(t, line = 0) {
    const bend = Math.pow(Math.max(0, (t - .36) / .64), 1.58);
    const x = -.5 + t;
    const y = .64 - bend * 4.55 + Math.sin(t * Math.PI * 1.18) * .10 + line;
    const slope = -7.1 * Math.pow(Math.max(.001, (t - .36) / .64), .58) / .64
      + Math.cos(t * Math.PI * 1.18) * .118 * Math.PI;
    return { x, y, angle: Math.atan2(slope, 1) };
  }

  function makeTargets() {
    const mobile = window.innerWidth <= 680;
    const targets = [];
    const linePoints = mobile ? 36 : 54;
    for (let line = -2; line <= 2; line += 1) {
      for (let i = 0; i < linePoints; i += 1) {
        const t = i / (linePoints - 1);
        const p = curvePoint(t, line);
        targets.push({
          nx: p.x,
          unitY: p.y,
          shape: i % 4 === 0 ? "dot" : "dash",
          angle: p.angle,
          note: false,
          weight: .7
        });
      }
    }

    const notes = mobile
      ? [[.18, .9, false], [.43, -.55, true], [.64, .75, false], [.80, -.5, true]]
      : [[.13, 1.0, false], [.34, -.75, true], [.55, 1.2, false], [.72, -.1, true], [.86, .72, false]];

    notes.forEach(([t, offset, flagged], noteIndex) => {
      const base = curvePoint(t, offset);
      const stemUp = noteIndex % 3 !== 2;
      const headRadius = mobile ? .014 : .012;

      for (let i = 0; i < 13; i += 1) {
        const a = i / 13 * Math.PI * 2;
        targets.push({
          nx: base.x + Math.cos(a) * headRadius,
          unitY: base.y + Math.sin(a) * .24,
          shape: "dot",
          angle: 0,
          note: true,
          weight: 1.2
        });
      }
      for (let i = 0; i < 9; i += 1) {
        targets.push({
          nx: base.x + (stemUp ? .013 : -.013),
          unitY: base.y - (stemUp ? 1 : -1) * i * .27,
          shape: "dash",
          angle: Math.PI / 2,
          note: true,
          weight: 1.05
        });
      }
      if (flagged) {
        for (let i = 0; i < 8; i += 1) {
          targets.push({
            nx: base.x + (stemUp ? .015 : -.015) + (stemUp ? 1 : -1) * i * .010,
            unitY: base.y - (stemUp ? 1 : -1) * 2.08 + Math.sin(i / 7 * Math.PI) * .27,
            shape: i % 2 ? "dot" : "dash",
            angle: stemUp ? -.48 : .48,
            note: true,
            weight: 1
          });
        }
      }
    });
    return targets;
  }

  function resetParticles() {
    particles = makeTargets().map((target, index) => ({
      ...target,
      startX: Math.random(),
      startY: Math.random(),
      phase: Math.random() * Math.PI * 2,
      speed: .00055 + Math.random() * .00065,
      opacity: .5 + Math.random() * .42,
      size: (target.note ? .95 : .68) + Math.random() * (target.note ? 1.1 : .72),
      length: (target.note ? 4.5 : 5.5) + Math.random() * 5.5,
      delay: (index % 19) * 17 + Math.random() * 260
    }));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * ratio));
    const h = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return rect;
  }

  function draw(timestamp) {
    if (!running) return;
    const rect = resize();
    ctx.clearRect(0, 0, rect.width, rect.height);
    const elapsed = timestamp - startedAt;
    const mobile = rect.width <= 680;
    const staffWidth = Math.min(rect.width * (mobile ? .92 : .79), 980);
    const gap = Math.min(rect.height * (mobile ? .038 : .048), mobile ? 22 : 34);
    const centerX = rect.width * (mobile ? .48 : .49);
    const centerY = rect.height * (mobile ? .55 : .59);
    const settled = ease((elapsed - 650) / 5000);
    const floatAmount = ease((elapsed - 5000) / 1500);
    const driftX = Math.sin(elapsed * .00043) * 5.5 * floatAmount;
    const driftY = Math.cos(elapsed * .00052) * 7 * floatAmount;

    particles.forEach(p => {
      const individual = reducedMotion ? 1 : ease((elapsed - 520 - p.delay) / 4700);
      const tx = centerX + p.nx * staffWidth + driftX;
      const ty = centerY + p.unitY * gap + driftY;
      const arcX = Math.sin(individual * Math.PI + p.phase) * (1 - individual) * 38;
      const arcY = Math.cos(individual * Math.PI * 1.45 + p.phase) * (1 - individual) * 28;
      const wobbleX = Math.sin(timestamp * p.speed + p.phase) * (1.4 + (1 - settled) * 6);
      const wobbleY = Math.cos(timestamp * p.speed * .81 + p.phase) * (1.2 + (1 - settled) * 5);
      const x = p.startX * rect.width * (1 - individual) + tx * individual + arcX + wobbleX;
      const y = p.startY * rect.height * (1 - individual) + ty * individual + arcY + wobbleY;
      const alpha = p.opacity * (.18 + individual * .82);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(255,255,255,.98)";
      ctx.strokeStyle = "rgba(255,255,255,.95)";
      ctx.shadowColor = p.note ? "rgba(220,235,255,.72)" : "rgba(205,228,255,.44)";
      ctx.shadowBlur = p.note ? 6.5 : 3.2;
      ctx.lineCap = "round";
      if (p.shape === "dot") {
        ctx.beginPath();
        ctx.arc(x, y, p.size * (p.note ? 1.18 : 1), 0, Math.PI * 2);
        ctx.fill();
      } else {
        const angle = p.angle + (1 - individual) * Math.sin(p.phase) * .65;
        ctx.lineWidth = Math.max(.9, p.size * .78 * p.weight);
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle) * p.length * .5, y - Math.sin(angle) * p.length * .5);
        ctx.lineTo(x + Math.cos(angle) * p.length * .5, y + Math.sin(angle) * p.length * .5);
        ctx.stroke();
      }
      ctx.restore();
    });
    frame = requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    startedAt = performance.now();
    resetParticles();
    frame = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
    frame = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  const sync = () => {
    if (scene.classList.contains("visible")) start();
    else stop();
  };
  new MutationObserver(sync).observe(scene, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", () => {
    if (running) resetParticles();
  }, { passive: true });
  sync();
}

installGoodnewsCurvedScore();

function installShelterLifecycle() {
  const scene = document.querySelector("#shelterScene");
  const canvas = document.querySelector("#shelterCanvas");
  const stage = document.querySelector("#stage");
  const world = document.querySelector("#world");
  const caption = document.querySelector("#fragmentCaption");
  const progress = document.querySelector("#fragmentProgress");
  const worldHint = document.querySelector("#worldHint");
  const todo = document.querySelector(".dream-todo");
  const dreamEcho = document.querySelector("#dreamEcho");
  if (!scene || !canvas || !stage || !world || !caption || !progress || !worldHint || !todo || !dreamEcho) return;

  const TOTAL_MS = 15000;
  const EXIT_MS = 800;
  const DEFAULT_HINT = "海上漂浮的空瓶，载满爱的信号，化作指路的灯火。";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let shelterActive = false;
  let sessionId = 0;
  let autoExitTimer = 0;
  let visualExitAnimation = null;
  let audioFadeFrame = 0;
  let shelterAudio = null;

  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  const shelterFrames = new Set();
  window.requestAnimationFrame = callback => {
    const source = typeof callback === "function" ? Function.prototype.toString.call(callback) : "";
    if (!source.includes("drawShelterScene")) return nativeRequestAnimationFrame(callback);
    let frameId = 0;
    const wrapped = timestamp => {
      shelterFrames.delete(frameId);
      callback(timestamp);
    };
    frameId = nativeRequestAnimationFrame(wrapped);
    shelterFrames.add(frameId);
    return frameId;
  };
  window.cancelAnimationFrame = frameId => {
    shelterFrames.delete(frameId);
    nativeCancelAnimationFrame(frameId);
  };

  const cancelShelterFrames = () => {
    shelterFrames.forEach(frameId => nativeCancelAnimationFrame(frameId));
    shelterFrames.clear();
  };

  const NativeAudio = window.Audio;
  function LifecycleAudio(...args) {
    const media = new NativeAudio(...args);
    const source = String(args[0] || "");
    if (/biehaipa\.mp3(?:\?|$)/i.test(source)) shelterAudio = media;
    return media;
  }
  LifecycleAudio.prototype = NativeAudio.prototype;
  Object.setPrototypeOf(LifecycleAudio, NativeAudio);
  window.Audio = LifecycleAudio;

  const clearAutoExit = () => {
    if (autoExitTimer) clearTimeout(autoExitTimer);
    autoExitTimer = 0;
  };

  const stopAudioImmediately = media => {
    if (!media) return;
    media.pause();
    try { media.currentTime = 0; } catch (_) { /* metadata may not be ready */ }
    if (shelterAudio === media) shelterAudio = null;
  };

  const fadeShelterAudio = (media, duration) => {
    if (!media || media.paused || media.ended) {
      stopAudioImmediately(media);
      return;
    }
    if (audioFadeFrame) nativeCancelAnimationFrame(audioFadeFrame);
    const startedAt = performance.now();
    const startVolume = Number.isFinite(media.volume) ? media.volume : .42;
    const step = now => {
      const amount = Math.min(1, Math.max(0, (now - startedAt) / duration));
      media.volume = startVolume * (1 - amount);
      if (amount < 1) {
        audioFadeFrame = nativeRequestAnimationFrame(step);
      } else {
        audioFadeFrame = 0;
        stopAudioImmediately(media);
      }
    };
    audioFadeFrame = nativeRequestAnimationFrame(step);
  };

  const resetShelterDom = media => {
    cancelShelterFrames();
    if (audioFadeFrame) nativeCancelAnimationFrame(audioFadeFrame);
    audioFadeFrame = 0;
    stopAudioImmediately(media);

    scene.classList.remove("visible", "roof-formed", "protecting", "fast-forward", "swaying");
    scene.setAttribute("aria-hidden", "true");
    stage.classList.remove("shelter-moment");
    todo.classList.remove("complete");
    todo.querySelectorAll("button[data-dream]").forEach(button => button.classList.remove("checked"));
    dreamEcho.className = "dream-echo";

    const context = canvas.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);

    const node = document.querySelector('[data-track-id="fragment-04"]');
    node?.classList.remove("active", "near");
    world.classList.remove("fragment-active");
    caption.classList.remove("visible");
    progress.getAnimations().forEach(animation => animation.cancel());
    worldHint.textContent = DEFAULT_HINT;
  };

  const cancelSession = ({ resetVisual = false } = {}) => {
    shelterActive = false;
    sessionId += 1;
    clearAutoExit();
    if (visualExitAnimation) {
      try { visualExitAnimation.cancel(); } catch (_) { /* already finished */ }
      visualExitAnimation = null;
    }
    if (resetVisual) resetShelterDom(shelterAudio);
  };

  const dismissShelter = reason => {
    if (!shelterActive || !scene.classList.contains("visible")) return;
    shelterActive = false;
    clearAutoExit();
    const thisSession = sessionId;
    const media = shelterAudio;
    const duration = reducedMotion ? 80 : EXIT_MS;

    if (reason === "background") fadeShelterAudio(media, duration);

    if (visualExitAnimation) {
      try { visualExitAnimation.cancel(); } catch (_) { /* already finished */ }
    }
    visualExitAnimation = scene.animate(
      [
        { opacity: 1, filter: "blur(0px)" },
        { opacity: 0, filter: reducedMotion ? "blur(0px)" : "blur(4px)" }
      ],
      { duration, easing: "cubic-bezier(.22,.68,.28,1)", fill: "forwards" }
    );

    visualExitAnimation.finished.then(() => {
      if (thisSession !== sessionId) return;
      const finishedAnimation = visualExitAnimation;
      visualExitAnimation = null;
      try { finishedAnimation?.cancel(); } catch (_) { /* already finished */ }
      resetShelterDom(media);
      sessionId += 1;
    }).catch(() => {});
  };

  const beginSession = () => {
    shelterActive = true;
    sessionId += 1;
    clearAutoExit();
    if (visualExitAnimation) {
      try { visualExitAnimation.cancel(); } catch (_) { /* already finished */ }
      visualExitAnimation = null;
    }
    // Defensive cleanup: a previous fill-forwards exit animation must never
    // keep the scene at opacity:0 when the node is opened again.
    scene.getAnimations().forEach(animation => {
      if (animation.playState === "finished") {
        try { animation.cancel(); } catch (_) { /* no-op */ }
      }
    });
    scene.style.removeProperty("filter");
    scene.style.removeProperty("opacity");
    const thisSession = sessionId;
    autoExitTimer = window.setTimeout(() => {
      if (shelterActive && sessionId === thisSession && scene.classList.contains("visible")) {
        dismissShelter("auto");
      }
    }, TOTAL_MS);
  };

  new MutationObserver(() => {
    if (scene.classList.contains("visible")) {
      if (!shelterActive && !visualExitAnimation) beginSession();
    } else if (shelterActive || autoExitTimer || visualExitAnimation) {
      cancelSession();
    }
  }).observe(scene, { attributes: true, attributeFilter: ["class"] });

  scene.addEventListener("click", event => {
    if (!shelterActive || !scene.classList.contains("visible")) return;
    if (event.target.closest("button, a, input, textarea, select, label, .dream-todo, [role='button']")) return;
    dismissShelter("background");
  });
}

installShelterLifecycle();
