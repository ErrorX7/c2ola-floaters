// Desktop layout fix for the 青草地 puzzle layer.
// The puzzle layer must stay out of the grass-message grid flow, otherwise it
// creates an extra row and pushes the lyric copy downward on larger screens.

const styleId = "grass-puzzle-layout-fix";

if (!document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .grass-message {
      position: absolute;
      isolation: isolate;
    }

    .grass-puzzle-layer {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      overflow: hidden;
      opacity: 0;
      transition: opacity .65s ease;
    }

    .grass-message.visible .grass-puzzle-layer {
      opacity: 1;
    }

    .grass-message.exiting .grass-puzzle-layer {
      opacity: 0;
    }

    .grass-message-copy {
      position: relative;
      z-index: 2;
      align-self: center;
      justify-self: center;
    }

    .grass-puzzle-piece {
      position: absolute;
      display: block;
      left: calc(var(--piece-x) * 1%);
      top: calc(var(--piece-y) * 1%);
      width: var(--piece-size);
      aspect-ratio: 1;
      transform: translate(-50%, -50%) rotate(var(--piece-rotate));
      transform-origin: center;
      opacity: .27;
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      filter: drop-shadow(0 0 10px rgba(222, 238, 255, .22));
      mix-blend-mode: screen;
      animation: grass-piece-drift-fixed var(--piece-time) ease-in-out var(--piece-delay) infinite alternate;
      will-change: transform;
    }

    .grass-puzzle-piece.soft {
      opacity: .34;
      filter: drop-shadow(0 0 14px rgba(232, 244, 255, .3));
    }

    @keyframes grass-piece-drift-fixed {
      from {
        transform: translate(-50%, -50%) rotate(var(--piece-rotate));
      }
      to {
        transform:
          translate(calc(-50% + var(--piece-dx)), calc(-50% + var(--piece-dy)))
          rotate(calc(var(--piece-rotate) + 7deg));
      }
    }

    @media (max-width: 680px) {
      .grass-puzzle-piece {
        width: calc(var(--piece-size) * .78);
        opacity: .24;
      }

      .grass-puzzle-piece.soft {
        opacity: .3;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .grass-puzzle-piece {
        animation: none;
      }
    }
  `;
  document.head.append(style);
}
