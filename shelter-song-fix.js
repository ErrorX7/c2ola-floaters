const style = document.createElement('style');
style.dataset.shelterSongFix = 'true';
style.textContent = `
  /* Make the "一起写歌" echo clearer and place it like the movie ticket on mobile. */
  .dream-echo.song::before {
    content: "♪  ♫  ♪  ♬  ♩  ♫  ♪  ♬" !important;
    color: rgba(255,255,255,.96) !important;
    text-shadow: 0 0 7px rgba(255,255,255,.6), 0 0 18px rgba(190,220,255,.34);
    font-size: clamp(1.05rem, 2vw, 1.4rem) !important;
    font-weight: 500;
    line-height: 1.5;
    letter-spacing: .34em !important;
    white-space: normal;
    text-align: center;
    width: min(18vw, 190px);
  }

  @media (max-width: 680px) {
    .dream-echo.song::before {
      left: 43% !important;
      right: auto !important;
      top: 25% !important;
      bottom: auto !important;
      width: min(31vw, 132px) !important;
      min-height: 72px;
      content: "♪ ♫ ♪ ♬\A♫ ♪ ♩ ♫\A♪ ♬ ♫ ♪" !important;
      white-space: pre !important;
      font-size: clamp(1rem, 4.6vw, 1.3rem) !important;
      line-height: 1.45 !important;
      letter-spacing: .16em !important;
      text-align: center !important;
      color: #fff !important;
      filter: drop-shadow(0 0 7px rgba(210,230,255,.42));
    }
  }
`;
document.head.append(style);
