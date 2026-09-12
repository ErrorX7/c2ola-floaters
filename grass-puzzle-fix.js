const grassCopy = document.querySelector("#grassMessage .grass-message-copy");
if (grassCopy) {
  // Keep each intended mobile line as its own element. This avoids relying on
  // browser-specific wrapping and also makes the reveal sequence deterministic.
  grassCopy.innerHTML = `
    <span class="grass-line">不管是亲人爱人</span>
    <span class="grass-line">还是友情</span>
    <span class="grass-line">都希望你能有人陪</span>
    <span class="grass-line grass-gap">但是当你感到</span>
    <span class="grass-line">没人陪的时候</span>
    <span class="grass-line">希望听到这首歌</span>
    <span class="grass-line grass-final">我会永远陪着你</span>
  `;
}

const style = document.createElement("style");
style.dataset.grassPuzzleFix = "true";
style.textContent = `
/* Grassland puzzle pieces are decorative and must never affect copy layout. */
.grass-puzzle-layer {
  position: absolute !important;
  inset: 0 !important;
  z-index: 0 !important;
  width: 100% !important;
  height: 100% !important;
  pointer-events: none !important;
  overflow: hidden !important;
  opacity: 0;
  transition: opacity .65s ease;
}
.grass-message.visible .grass-puzzle-layer { opacity: 1; }
.grass-message.exiting .grass-puzzle-layer { opacity: 0; }

.grass-puzzle-piece {
  position: absolute !important;
  left: calc(var(--piece-x) * 1%) !important;
  top: calc(var(--piece-y) * 1%) !important;
  width: var(--piece-size) !important;
  aspect-ratio: 1;
  transform: translate(-50%, -50%) rotate(var(--piece-rotate));
  transform-origin: center;
  opacity: .28 !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: contain !important;
  filter: drop-shadow(0 0 9px rgba(218,235,255,.28));
  mix-blend-mode: screen;
  animation: grass-piece-drift-fix var(--piece-time) ease-in-out var(--piece-delay) infinite alternate;
}
.grass-puzzle-piece.soft {
  opacity: .36 !important;
  filter: drop-shadow(0 0 12px rgba(228,241,255,.34));
}

@keyframes grass-piece-drift-fix {
  from { transform: translate(-50%, -50%) rotate(var(--piece-rotate)); }
  to { transform: translate(calc(-50% + var(--piece-dx)), calc(-50% + var(--piece-dy))) rotate(calc(var(--piece-rotate) + 7deg)); }
}

@media (min-width: 681px) {
  .grass-message-copy {
    position: absolute !important;
    z-index: 2 !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
    font-size: clamp(1.08rem, 2vw, 1.34rem) !important;
    line-height: 1.95 !important;
  }
}

@media (max-width: 680px) {
  .grass-message {
    align-items: center !important;
    justify-content: center !important;
    overflow: hidden !important;
  }
  .grass-message-copy {
    position: absolute !important;
    z-index: 2 !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: min(86vw, 360px) !important;
    max-width: 86vw !important;
    max-height: none !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 0 !important;
    overflow: visible !important;
    font-size: clamp(.78rem, 3.25vw, .96rem) !important;
    line-height: 1.58 !important;
    letter-spacing: .035em !important;
    text-align: center !important;
  }
  .grass-message-copy .grass-line {
    display: block !important;
    flex: 0 0 auto !important;
    width: 100% !important;
    min-height: 1.58em !important;
    white-space: nowrap !important;
    overflow: visible !important;
    visibility: visible !important;
  }
  .grass-message-copy .grass-line.grass-gap { margin-top: .62em !important; }
  .grass-message-copy .grass-final { margin-top: .72em !important; }

  /* Mobile browsers differed on the old timer/class based reveal. Once the
     message is visible, reveal every line reliably and let opacity transition
     handle the entrance instead of leaving early lines at opacity: 0. */
  .grass-message.visible .grass-line,
  .grass-message.visible .grass-line.is-revealed {
    opacity: .9 !important;
    transform: translateY(0) !important;
    filter: blur(0) !important;
    animation: none !important;
  }
  .grass-message.visible .grass-final,
  .grass-message.visible .grass-final.is-revealed { opacity: 1 !important; }

  .grass-puzzle-piece { width: calc(var(--piece-size) * .78) !important; opacity: .24 !important; }
  .grass-puzzle-piece.soft { opacity: .31 !important; }
}

@media (max-width: 360px), (max-height: 640px) {
  .grass-message-copy {
    font-size: clamp(.72rem, 3vw, .84rem) !important;
    line-height: 1.48 !important;
  }
  .grass-message-copy .grass-line.grass-gap { margin-top: .48em !important; }
  .grass-message-copy .grass-final { margin-top: .56em !important; }
}

@media (prefers-reduced-motion: reduce) {
  .grass-puzzle-piece { animation: none !important; }
}
`;
document.head.append(style);
