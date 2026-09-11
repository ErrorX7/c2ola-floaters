const AUTHOR_SPARK_ID = "spark-07";
const TRIPLE_CLICK_GAP_MS = 650;

// 信的正文之后只需要替换这里，不必再改三击触发逻辑。
const AUTHOR_LETTER = {
  eyebrow: "A LETTER FROM THE AUTHOR",
  title: "给看到这里的你",
  body: [
    "这封信还没有写完。",
    "等我把真正想说的话写好，再把它放进这里。"
  ],
  signature: "— 小王"
};

let clickCount = 0;
let lastClickAt = 0;
let letterOverlay;
let previousFocus;

function injectLetterStyles() {
  if (document.querySelector("#authorLetterStyles")) return;
  const style = document.createElement("style");
  style.id = "authorLetterStyles";
  style.textContent = `
    .author-letter-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      padding: clamp(1rem, 4vw, 3rem);
      background: rgba(1, 4, 11, .78);
      backdrop-filter: blur(12px) saturate(.8);
      -webkit-backdrop-filter: blur(12px) saturate(.8);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity .42s ease, visibility .42s ease;
    }
    .author-letter-overlay.open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
    .author-letter-backdrop {
      position: absolute;
      inset: 0;
      border: 0;
      background: transparent;
      cursor: default;
    }
    .author-letter-paper {
      position: relative;
      z-index: 1;
      width: min(88vw, 650px);
      max-height: min(78dvh, 760px);
      overflow: auto;
      padding: clamp(2.3rem, 7vw, 4.8rem) clamp(1.7rem, 6vw, 4.2rem) clamp(2.4rem, 7vw, 4.4rem);
      border: 1px solid rgba(208, 228, 255, .2);
      background:
        radial-gradient(circle at 18% 14%, rgba(190, 215, 255, .11), transparent 34%),
        linear-gradient(145deg, rgba(18, 27, 48, .97), rgba(5, 10, 22, .98));
      box-shadow: 0 30px 90px rgba(0,0,0,.55), inset 0 0 60px rgba(126, 164, 224, .045);
      color: #eef5ff;
      transform: translateY(18px) scale(.97) rotate(-.35deg);
      opacity: 0;
      transition: transform .55s cubic-bezier(.18,.78,.2,1), opacity .42s ease;
    }
    .author-letter-overlay.open .author-letter-paper {
      transform: translateY(0) scale(1) rotate(-.35deg);
      opacity: 1;
    }
    .author-letter-paper::before,
    .author-letter-paper::after {
      content: "";
      position: absolute;
      pointer-events: none;
    }
    .author-letter-paper::before {
      inset: .7rem;
      border: 1px solid rgba(226, 239, 255, .065);
    }
    .author-letter-paper::after {
      width: 46%;
      height: 1px;
      left: 27%;
      bottom: 2rem;
      background: linear-gradient(90deg, transparent, rgba(197,220,255,.34), transparent);
    }
    .author-letter-eyebrow {
      margin: 0 0 1.15rem;
      font: 500 .68rem/1.4 system-ui, sans-serif;
      letter-spacing: .22em;
      color: rgba(196, 218, 255, .58);
    }
    .author-letter-title {
      margin: 0 0 2rem;
      font: 500 clamp(1.45rem, 4.8vw, 2.25rem)/1.25 "Noto Serif SC", "Songti SC", serif;
      letter-spacing: .08em;
      color: rgba(246, 249, 255, .96);
    }
    .author-letter-copy {
      display: grid;
      gap: 1.2rem;
      font: 400 clamp(.98rem, 2.9vw, 1.12rem)/2 "Noto Serif SC", "Songti SC", serif;
      letter-spacing: .045em;
      color: rgba(231, 239, 252, .82);
    }
    .author-letter-copy p { margin: 0; }
    .author-letter-signature {
      margin: 2.4rem 0 0;
      text-align: right;
      font: 400 1rem/1.6 "Noto Serif SC", "Songti SC", serif;
      letter-spacing: .08em;
      color: rgba(220, 234, 255, .72);
    }
    .author-letter-close {
      position: absolute;
      z-index: 2;
      top: .85rem;
      right: .9rem;
      width: 2.4rem;
      height: 2.4rem;
      border: 0;
      border-radius: 50%;
      background: rgba(255,255,255,.045);
      color: rgba(238,245,255,.76);
      font: 300 1.45rem/1 system-ui, sans-serif;
      cursor: pointer;
      transition: background .2s ease, color .2s ease, transform .2s ease;
    }
    .author-letter-close:hover,
    .author-letter-close:focus-visible {
      background: rgba(202,224,255,.12);
      color: #fff;
      transform: scale(1.05);
      outline: none;
    }
    @media (max-width: 680px) {
      .author-letter-overlay { padding: .9rem; }
      .author-letter-paper {
        width: min(92vw, 650px);
        max-height: 82dvh;
        padding-top: 3.4rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .author-letter-overlay,
      .author-letter-paper { transition: none; }
    }
  `;
  document.head.append(style);
}

function ensureLetterOverlay() {
  if (letterOverlay) return letterOverlay;
  injectLetterStyles();

  letterOverlay = document.createElement("div");
  letterOverlay.className = "author-letter-overlay";
  letterOverlay.setAttribute("aria-hidden", "true");
  letterOverlay.innerHTML = `
    <button class="author-letter-backdrop" type="button" aria-label="关闭作者的信"></button>
    <article class="author-letter-paper" role="dialog" aria-modal="true" aria-labelledby="authorLetterTitle">
      <button class="author-letter-close" type="button" aria-label="关闭作者的信">×</button>
      <p class="author-letter-eyebrow">${AUTHOR_LETTER.eyebrow}</p>
      <h2 class="author-letter-title" id="authorLetterTitle">${AUTHOR_LETTER.title}</h2>
      <div class="author-letter-copy">${AUTHOR_LETTER.body.map(line => `<p>${line}</p>`).join("")}</div>
      <p class="author-letter-signature">${AUTHOR_LETTER.signature}</p>
    </article>
  `;

  document.body.append(letterOverlay);
  letterOverlay.querySelector(".author-letter-backdrop")?.addEventListener("click", closeAuthorLetter);
  letterOverlay.querySelector(".author-letter-close")?.addEventListener("click", closeAuthorLetter);
  return letterOverlay;
}

function openAuthorLetter() {
  const overlay = ensureLetterOverlay();
  previousFocus = document.activeElement;
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.documentElement.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.querySelector(".author-letter-close")?.focus({ preventScroll: true }));
}

function closeAuthorLetter() {
  if (!letterOverlay?.classList.contains("open")) return;
  letterOverlay.classList.remove("open");
  letterOverlay.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";
  if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
}

document.addEventListener("click", event => {
  const spark = event.target.closest?.(`.spark[data-spark-id="${AUTHOR_SPARK_ID}"]`);
  if (!spark) return;

  const now = performance.now();
  if (now - lastClickAt > TRIPLE_CLICK_GAP_MS) clickCount = 0;
  lastClickAt = now;
  clickCount += 1;

  if (clickCount >= 3) {
    clickCount = 0;
    lastClickAt = 0;
    queueMicrotask(openAuthorLetter);
  }
}, true);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && letterOverlay?.classList.contains("open")) {
    event.preventDefault();
    closeAuthorLetter();
  }
});
