const reveal=document.querySelector('#posterReveal');
const layer=document.querySelector('#posterTimelineLayer');
const memory=document.querySelector('#timelineMemory');

if(reveal&&layer){
  const s=document.createElement('style');
  s.textContent=`
  .timeline-sticker.sticker-hint img{animation:stickerHint 1s ease both!important}
  @keyframes stickerHint{0%,100%{filter:brightness(1) drop-shadow(0 0 0 transparent)}40%{filter:brightness(1.22) drop-shadow(0 0 8px rgba(240,248,255,.9)) drop-shadow(0 0 18px rgba(135,180,255,.5))}}
  @media(hover:hover) and (pointer:fine){.poster-reveal.open .timeline-sticker:hover img{filter:brightness(1.15) drop-shadow(0 0 8px rgba(240,248,255,.75))}}
  .sticker-hint-copy{position:absolute;z-index:16;left:50%;bottom:max(1.1rem,env(safe-area-inset-bottom));transform:translate(-50%,6px);margin:0;width:max-content;max-width:78vw;color:rgba(226,237,255,.78);font:400 clamp(.66rem,1.1vw,.78rem)/1.5 Georgia,"Songti SC",serif;letter-spacing:.1em;text-align:center;opacity:0;filter:blur(4px);pointer-events:none;transition:.6s ease}
  .sticker-hint-copy.show{opacity:.88;filter:blur(0);transform:translate(-50%,0)}
  @media(max-width:680px){.sticker-hint-copy{bottom:max(4.4rem,env(safe-area-inset-bottom));font-size:.64rem;max-width:72vw}}
  `;
  document.head.append(s);

  const copy=document.createElement('p');
  copy.className='sticker-hint-copy';
  copy.textContent='海报上的贴纸，也许藏着一些东西。';
  reveal.append(copy);

  let introduced=false,wasOpen=reveal.classList.contains('open'),reminders=0,timer;
  const stickers=()=>[...layer.querySelectorAll('.timeline-sticker')];
  const unseen=()=>stickers().filter(x=>x.dataset.seen!=='1');
  const flash=x=>{if(!x||x.dataset.seen==='1')return;x.classList.remove('sticker-hint');void x.offsetWidth;x.classList.add('sticker-hint');setTimeout(()=>x.classList.remove('sticker-hint'),1100)};
  const schedule=()=>{clearTimeout(timer);if(!reveal.classList.contains('open')||reminders>=2)return;timer=setTimeout(()=>{if(memory?.getAttribute('aria-hidden')==='false'){schedule();return}const left=unseen();if(!left.length)return;flash(left[reminders%left.length]);reminders++;schedule()},11500)};
  const intro=()=>{copy.classList.add('show');setTimeout(()=>copy.classList.remove('show'),3200);unseen().forEach((x,i)=>setTimeout(()=>{if(reveal.classList.contains('open'))flash(x)},850+i*240));schedule()};

  layer.addEventListener('click',e=>{const x=e.target.closest('.timeline-sticker');if(!x)return;x.dataset.seen='1';x.classList.remove('sticker-hint');if(!unseen().length)clearTimeout(timer)},true);

  new MutationObserver(()=>{const open=reveal.classList.contains('open');if(open&&!wasOpen){reminders=0;if(!introduced){introduced=true;setTimeout(intro,520)}else schedule()}if(!open&&wasOpen){clearTimeout(timer);copy.classList.remove('show');stickers().forEach(x=>x.classList.remove('sticker-hint'))}wasOpen=open}).observe(reveal,{attributes:true,attributeFilter:['class']});
}
