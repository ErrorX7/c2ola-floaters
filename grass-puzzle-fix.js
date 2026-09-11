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

.grass-message.visible .grass-puzzle-layer {
  opacity: 1;
}

.grass-message.exiting .grass-puzzle-layer {
  opacity: 0;
}

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
  to {
    transform: translate(calc(-50% + var(--piece-dx)), calc(-50% + var(--piece-dy))) rotate(calc(var(--piece-rotate) + 7deg));
  }
}

/* Restore the pre-puzzle desktop copy position exactly at scene center. */
@media (min-width: 681px) {
  .grass-message-copy {
    position: absolute !important;
    z-index: 2 !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
  }
}

@media (max-width: 680px) {
  .grass-message-copy { position: relative; z-index: 2; }
  .grass-puzzle-piece { width: calc(var(--piece-size) * .78) !important; opacity: .24 !important; }
  .grass-puzzle-piece.soft { opacity: .31 !important; }
}

@media (prefers-reduced-motion: reduce) {
  .grass-puzzle-piece { animation: none !important; }
}
`;
document.head.append(style);
