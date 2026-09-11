const scene = document.querySelector('#goodnewsScene');
const originalCanvas = document.querySelector('#goodnewsCanvas');

if (scene && originalCanvas) {
  originalCanvas.style.opacity = '0';

  const canvas = document.createElement('canvas');
  canvas.className = 'goodnews-wave-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    zIndex: '2', pointerEvents: 'none'
  });
  scene.insertBefore(canvas, originalCanvas.nextSibling);

  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  let startedAt = 0;
  let points = [];
  let run = 0;

  const ease = v => {
    const n = Math.max(0, Math.min(1, v));
    return n * n * (3 - 2 * n);
  };

  function addPolyline(targets, polyline, count, kind = 'line') {
    const segments = [];
    let total = 0;
    for (let i = 0; i < polyline.length - 1; i++) {
      const a = polyline[i];
      const b = polyline[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segments.push({ a, b, len, start: total });
      total += len;
    }
    for (let i = 0; i < count; i++) {
      const d = total * i / Math.max(1, count - 1);
      const s = segments.find(seg => d <= seg.start + seg.len) || segments.at(-1);
      const t = s.len ? (d - s.start) / s.len : 0;
      const x = s.a[0] + (s.b[0] - s.a[0]) * t;
      const y = s.a[1] + (s.b[1] - s.a[1]) * t;
      targets.push({ x, y, angle: Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]), kind });
    }
  }

  function buildTargets(width, height) {
    const mobile = width <= 680;
    const targets = [];
    const wave = [
      [.07,0],[.11,0],[.125,-.08],[.14,.10],[.158,-.24],[.175,.08],[.195,0],
      [.29,0],[.33,0],[.35,-.07],[.37,.05],[.40,0],
      [.45,0],[.48,0],[.495,-.36],[.51,.34],[.525,-.10],[.54,.07],[.56,0],
      [.63,0],[.66,0],[.69,-.08],[.71,.04],[.735,-.10],[.755,.07],[.78,0],
      [.80,0],[.815,-.42],[.83,.35],[.845,-.09],[.86,.05],[.88,0],[.94,0]
    ];
    addPolyline(targets, wave, mobile ? 95 : 145, 'wave');

    const clef = [];
    for (let i = 0; i <= 42; i++) {
      const p = i / 42;
      const t = p * Math.PI * 2.15;
      clef.push([.065 + Math.sin(t) * (.014 + .012 * p), -.015 + Math.cos(t) * (.06 + .10 * p) - (p - .5) * .09]);
    }
    addPolyline(targets, clef, mobile ? 28 : 42, 'clef');
    addPolyline(targets, [[.064,-.18],[.058,.18],[.069,.22]], mobile ? 14 : 22, 'clef');

    const notes = mobile
      ? [[.27,0,1],[.42,-.04,1],[.62,.08,-1],[.90,0,1]]
      : [[.27,0,1],[.42,-.04,1],[.62,.08,-1],[.90,0,1],[.96,0,1]];

    notes.forEach(([x,y,dir], idx) => {
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2;
        targets.push({ x: x + Math.cos(a) * .011, y: y + Math.sin(a) * .028, angle: 0, kind: 'note' });
      }
      const stemX = x + .010 * dir;
      const endY = y - .18 * dir;
      addPolyline(targets, [[stemX,y],[stemX,endY]], mobile ? 9 : 13, 'note');
      if (idx === 1 || idx === notes.length - 1) {
        const flag = dir > 0
          ? [[stemX,endY],[stemX+.035,endY+.02],[stemX+.042,endY+.065]]
          : [[stemX,endY],[stemX-.035,endY-.02],[stemX-.042,endY-.065]];
        addPolyline(targets, flag, mobile ? 7 : 10, 'note');
      }
    });

    const scaleX = width * (mobile ? .96 : .90);
    const scaleY = Math.min(height * (mobile ? .55 : .50), mobile ? 290 : 370);
    const centerX = width * .5;
    const centerY = height * (mobile ? .48 : .50);
    return targets.map(t => ({
      ...t,
      tx: centerX + (t.x - .5) * scaleX,
      ty: centerY + t.y * scaleY
    }));
  }

  function rebuild() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio,0,0,ratio,0,0);
    points = buildTargets(rect.width, rect.height).map((t, i) => ({
      ...t,
      sx: Math.random() * rect.width,
      sy: Math.random() * rect.height,
      size: (t.kind === 'note' ? 1.15 : .72) + Math.random() * .8,
      len: 5 + Math.random() * 9,
      phase: Math.random() * Math.PI * 2,
      delay: (i % 23) * 14 + Math.random() * 240,
      opacity: .45 + Math.random() * .42
    }));
  }

  function draw(now, id) {
    if (id !== run || !scene.classList.contains('visible')) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,rect.width,rect.height);
    const elapsed = now - startedAt;
    const settle = ease((elapsed - 350) / 4200);
    const driftX = Math.sin(elapsed * .00042) * 5 * settle;
    const driftY = Math.cos(elapsed * .00048) * 6 * settle;

    for (const p of points) {
      const k = reducedMotion ? 1 : ease((elapsed - 220 - p.delay) / 3900);
      const wobble = p.kind === 'note' ? .45 : 1;
      const x = p.sx * (1-k) + (p.tx + driftX) * k + Math.sin(now*.001 + p.phase) * wobble * (1.4 + (1-k)*5);
      const y = p.sy * (1-k) + (p.ty + driftY) * k + Math.cos(now*.00082 + p.phase) * wobble * (1.3 + (1-k)*4);
      const alpha = p.opacity * (.16 + .84*k);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,255,255,.97)';
      ctx.strokeStyle = 'rgba(255,255,255,.94)';
      ctx.shadowColor = p.kind === 'note' ? 'rgba(225,239,255,.72)' : 'rgba(205,228,255,.34)';
      ctx.shadowBlur = p.kind === 'note' ? 5 : 2.2;
      ctx.lineCap = 'round';

      if (p.kind === 'clef' || p.kind === 'note' || p.phase % 1 < .28) {
        ctx.beginPath();
        ctx.arc(x,y,p.size * (p.kind === 'note' ? 1.18 : 1),0,Math.PI*2);
        ctx.fill();
      } else {
        ctx.lineWidth = Math.max(.9,p.size*.8);
        ctx.beginPath();
        ctx.moveTo(x-Math.cos(p.angle)*p.len*.5,y-Math.sin(p.angle)*p.len*.5);
        ctx.lineTo(x+Math.cos(p.angle)*p.len*.5,y+Math.sin(p.angle)*p.len*.5);
        ctx.stroke();
      }
      ctx.restore();
    }
    raf = requestAnimationFrame(t => draw(t,id));
  }

  function start() {
    run += 1;
    const id = run;
    cancelAnimationFrame(raf);
    rebuild();
    startedAt = performance.now();
    raf = requestAnimationFrame(t => draw(t,id));
  }

  function stop() {
    run += 1;
    cancelAnimationFrame(raf);
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  new MutationObserver(() => scene.classList.contains('visible') ? start() : stop())
    .observe(scene,{attributes:true,attributeFilter:['class']});

  window.addEventListener('resize', () => {
    if (scene.classList.contains('visible')) rebuild();
  }, {passive:true});
}
