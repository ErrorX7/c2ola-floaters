const posterFilmEntry = document.querySelector('#posterFilmEntry');
const filmReel = document.querySelector('#filmReel');
const posterReveal = document.querySelector('#posterReveal');
const posterClose = document.querySelector('#posterClose');
const sound = document.querySelector('#sound');

// The wilds chibi belongs only to fragment 03. Keep it hard-scoped to the
// "deep" mood so a stale `.visible` class can never flash during another
// fragment's shared exit transition.
const chibiScopeStyle = document.createElement('style');
chibiScopeStyle.dataset.wildsChibiScope = 'true';
chibiScopeStyle.textContent = `
  .wilds-chibi-entry.visible {
    opacity: 0 !important;
    pointer-events: none !important;
  }
  .world[data-mood="deep"] .wilds-chibi-entry.visible {
    opacity: .96 !important;
    pointer-events: auto !important;
  }
  .stage.fragment-exiting .wilds-chibi-entry,
  .stage.fragment-exiting .world[data-mood="deep"] .wilds-chibi-entry.visible {
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;
document.head.append(chibiScopeStyle);

if (posterFilmEntry && filmReel && posterReveal) {
  const reelSong = new Audio('./wilds-second-chibi-song.mp3?v=20260911b');
  reelSong.preload = 'auto';
  reelSong.loop = false;
  reelSong.volume = .42;

  const isMuted = () => sound?.getAttribute('aria-pressed') === 'false';

  const stopReelSong = () => {
    reelSong.pause();
    try { reelSong.currentTime = 0; } catch (_) {}
  };

  posterFilmEntry.addEventListener('click', () => {
    const willOpen = !filmReel.classList.contains('open');
    if (!willOpen) {
      stopReelSong();
      return;
    }
    reelSong.muted = isMuted();
    try { reelSong.currentTime = 0; } catch (_) {}
    reelSong.play().catch(() => {});
  }, { capture: true });

  filmReel.addEventListener('click', stopReelSong, { capture: true });
  posterClose?.addEventListener('click', stopReelSong, { capture: true });

  sound?.addEventListener('click', () => {
    queueMicrotask(() => { reelSong.muted = isMuted(); });
  });

  new MutationObserver(() => {
    if (!posterReveal.classList.contains('open')) stopReelSong();
  }).observe(posterReveal, { attributes: true, attributeFilter: ['class'] });
}
