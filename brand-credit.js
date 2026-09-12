const brandSubtitle = document.querySelector('.brand span');
if (brandSubtitle) brandSubtitle.textContent = '作者小王顶呱呱';

// Some mobile CSS hides the subtitle to save space. Keep the author credit
// visible on phones while preserving the existing FLOATERS title.
const brandCreditStyle = document.createElement('style');
brandCreditStyle.dataset.brandCredit = 'true';
brandCreditStyle.textContent = `
  .brand > span {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  @media (max-width: 680px) {
    .brand > span {
      display: block !important;
      max-width: 52vw;
      margin-top: .18rem;
      font-size: .62rem !important;
      line-height: 1.35 !important;
      letter-spacing: .13em !important;
      white-space: nowrap;
    }
  }
`;
document.head.append(brandCreditStyle);
