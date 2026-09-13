const reveal = document.querySelector('#posterReveal');
const layer = document.querySelector('#posterTimelineLayer');
const memory = document.querySelector('#timelineMemory');

if (reveal && layer) {
  const style = document.createElement('style');
  style.dataset.posterStickerHints = 'true';
  style.textContent = `
    /* The timeline stickers sit at very low opacity in the base poster CSS.
       Animate the sticker BUTTON itself (not just the image) so the affordance
       is clearly visible on phones and desktops without looking like a UI badge. */
    .poster-reveal.open .timeline-sticker.sticker-breathe {
      animation: timeline-sticker-breathe 4.6s ease-in-out var(--sticker-breathe-delay, 0s) infinite alternate !important;
      will-change: opacity, transform, filter;
    }

    @keyframes timeline-sticker-breathe {
      0%, 100% {
        opacity: .18;
        transform: rotate(var(--sticker-rotation)) translateY(0) scale(1);
        filter: brightness(1.04) drop-shadow(0 0 3px rgba(215,230,255,.18));
      }
      46% {
        opacity: .72;
        transform: rotate(var(--sticker-rotation)) translateY(-3px) scale(1.045);
        filter: brightness(1.2) drop-shadow(0 0 7px rgba(244,249,255,.78)) drop-shadow(0 0 16px rgba(145,185,255,.4));
      }
      62% {
        opacity: .46;
        transform: rotate(var(--sticker-rotation)) translateY(-1px) scale(1.025);
        filter: brightness(1.12) drop-shadow(0 0 5px rgba(225,239,255,.48));
      }
    }

    .poster-reveal.open .timeline-sticker.sticker-seen {
      animation: none !important;
    }

    .poster-reveal.open .timeline-sticker:hover,
    .poster-reveal.open .timeline-sticker:focus-visible,
    .poster-reveal.open .timeline-sticker:active {
      animation-play-state: paused !important;
      opacity: .98 !important;
      transform: rotate(var(--sticker-rotation)) translateY(-2px) scale(1.055) !important;
      filter: brightness(1.18) drop-shadow(0 4px 8px rgba(0,0,0,.35)) drop-shadow(0 0 10px rgba(226,239,255,.62)) !important;
    }

    .sticker-hint-copy {
      position: absolute;
      z-index: 24;
      left: 50%;
      top: max(5.1rem, 14vh);
      transform: translate(-50%, 7px);
      width: max-content;
      max-width: 82vw;
      margin: 0;
      color: rgba(238,245,255,.9);
      font: 400 clamp(.7rem, 1.15vw, .82rem)/1.55 Georgia, "Songti SC", serif;
      letter-spacing: .12em;
      text-align: center;
      text-shadow: 0 0 10px rgba(223,237,255,.48), 0 0 22px rgba(137,177,238,.22);
      opacity: 0;
      filter: blur(4px);
      pointer-events: none;
      transition: opacity .65s ease, transform .65s ease, filter .65s ease;
    }

    .sticker-hint-copy.show {
      opacity: .94;
      filter: blur(0);
      transform: translate(-50%, 0);
    }

    @media (max-width: 680px) {
      .sticker-hint-copy {
        top: max(4.8rem, 13vh);
        max-width: 78vw;
        font-size: .67rem;
        line-height: 1.6;
        letter-spacing: .1em;
      }

      .poster-reveal.open .timeline-sticker.sticker-breathe {
        animation-duration: 4.2s !important;
      }

      @keyframes timeline-sticker-breathe {
        0%, 100% {
          opacity: .2;
          transform: rotate(var(--sticker-rotation)) translateY(0) scale(1);
          filter: brightness(1.04) drop-shadow(0 0 3px rgba(215,230,255,.2));
        }
        46% {
          opacity: .82;
          transform: rotate(var(--sticker-rotation)) translateY(-3px) scale(1.06);
          filter: brightness(1.24) drop-shadow(0 0 8px rgba(248,251,255,.86)) drop-shadow(0 0 18px rgba(145,185,255,.45));
        }
        62% {
          opacity: .5;
          transform: rotate(var(--sticker-rotation)) translateY(-1px) scale(1.03);
          filter: brightness(1.12) drop-shadow(0 0 5px rgba(225,239,255,.5));
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .poster-reveal.open .timeline-sticker.sticker-breathe {
        animation: none !important;
        opacity: .42 !important;
        filter: brightness(1.1) drop-shadow(0 0 5px rgba(225,239,255,.38)) !important;
      }
    }
  `;
  document.head.append(style);

  const copy = document.createElement('p');
  copy.className = 'sticker-hint-copy';
  copy.textContent = '沿着海报，探索一路走来的痕迹。';
  reveal.append(copy);

  let wasOpen = reveal.classList.contains('open');
  let copyTimer;

  const stickers = () => [...layer.querySelectorAll('.timeline-sticker')];

  const applyBreathing = () => {
    stickers().forEach((sticker, index) => {
      sticker.style.setProperty('--sticker-breathe-delay', `${(-index * .63).toFixed(2)}s`);
      if (sticker.dataset.seen === '1') {
        sticker.classList.remove('sticker-breathe');
        sticker.classList.add('sticker-seen');
      } else {
        sticker.classList.remove('sticker-seen');
        sticker.classList.add('sticker-breathe');
      }
    });
  };

  const showCopy = () => {
    clearTimeout(copyTimer);
    copy.classList.add('show');
    copyTimer = window.setTimeout(() => copy.classList.remove('show'), 4600);
  };

  const openHints = () => {
    applyBreathing();
    if (stickers().some(sticker => sticker.dataset.seen !== '1')) showCopy();
  };

  layer.addEventListener('click', event => {
    const sticker = event.target.closest('.timeline-sticker');
    if (!sticker) return;
    sticker.dataset.seen = '1';
    sticker.classList.remove('sticker-breathe');
    sticker.classList.add('sticker-seen');
    copy.classList.remove('show');
    clearTimeout(copyTimer);
  }, true);

  new MutationObserver(() => {
    const open = reveal.classList.contains('open');
    if (open && !wasOpen) {
      window.setTimeout(() => {
        if (reveal.classList.contains('open') && memory?.getAttribute('aria-hidden') !== 'false') openHints();
      }, 900);
    }
    if (!open && wasOpen) {
      clearTimeout(copyTimer);
      copy.classList.remove('show');
      stickers().forEach(sticker => sticker.classList.remove('sticker-breathe'));
    }
    wasOpen = open;
  }).observe(reveal, { attributes: true, attributeFilter: ['class'] });

  if (wasOpen) openHints();
}
