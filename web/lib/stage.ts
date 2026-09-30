/* ============================================================
   THE STAGE ENGINE

   Lifted out of index.html unchanged. Every number in here — the chase
   constant, the lead fraction, the blur rounding, the visibility rules —
   was arrived at by measuring the page and watching it, over a lot of
   rounds. Rewriting it in idiomatic React would have thrown all of that
   away for nothing: it is one requestAnimationFrame loop that writes
   transform, opacity and filter, and React has no opinion worth having
   about that.

   So it is the same code, in a module, with the two things a framework
   needs added: it does nothing until start() is called from the browser
   (Next.js runs this file on the server too, where there is no window),
   and scenes can be removed again when a component unmounts.
   ============================================================ */
// @ts-nocheck — the original engine, moved across verbatim rather than
// rewritten. Typing it would mean editing it, and every number in it was
// arrived at by measuring the page.
'use client';

export type Scene = {
  el: HTMLElement;
  build: () => void;
  base: () => void;
  paint: (s: number) => void;
  leadF?: number;
  auto?: boolean;
  manual?: boolean;
  liveF?: number;
  dur?: number;
  [k: string]: any;
};

let reduce = false;

export function makeStage(){
  var scenes=[], t0=null, started=false, prev=null;
  var out =function(t){ return 1-Math.pow(1-t,3); },
      io  =function(t){ return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; },
      film=function(t){ return 1-Math.pow(1-t,4.2); };   /* quick off the mark, long tail */
  function seg(s,a,b){ return Math.max(0,Math.min(1,(s-a)/(b-a))); }
  /* write only what changed — handing the browser a value it already has
     still costs a style recalculation */
  /* A blur whose radius changes every frame is the most expensive thing
     on this page: the browser cannot reuse the layer it rasterised last
     frame, so every word being revealed is redrawn from scratch at
     whatever the screen's pixel density is. Rounded to a quarter of a
     pixel, a fourteen-pixel reveal asks for 56 distinct rasters instead
     of one per frame for as long as it runs, and it is not possible to
     see the difference. Under a third of a pixel it is dropped: a blur
     that small is a layer's worth of work for nothing. */
  function blur(px){
    if(!(px>0.34)) return 'none';
    return 'blur('+(Math.round(px*4)/4)+'px)';
  }
  function set(n,tr,op,fl){
    if(!n) return;
    if(tr!==null && n._tr!==tr){ n._tr=tr; n.style.transform=tr; }
    if(op!==null && n._op!==op){ n._op=op; n.style.opacity=op; }
    if(fl!==undefined && n._fl!==fl){ n._fl=fl; n.style.filter=fl; }
  }
  /* Each word becomes its own layer. The outer span keeps the spacing,
     the inner one tips, blurs and rises — and it keeps whatever tag the
     word had, so a dimmed half of a sentence stays dimmed. */
  function split(el){
    if(!el) return [];
    var kids=[].slice.call(el.childNodes), frag=document.createDocumentFragment(), out=[];
    kids.forEach(function(node){
      var tag = node.nodeType===1 ? node.nodeName.toLowerCase() : 'span';
      var chunks=(node.textContent||'').match(/\S+\s*/g)||[];
      chunks.forEach(function(ch){
        var word=ch.replace(/\s+$/,''), tail=ch.slice(word.length);
        var w=document.createElement('span'); w.className='w';
        var inner=document.createElement(tag);
        inner.textContent=word; w.appendChild(inner);
        if(tail) w.appendChild(document.createTextNode(tail));
        frag.appendChild(w); out.push(inner);
      });
    });
    el.textContent=''; el.appendChild(frag);
    return out;
  }
  function plain(list){
    list.forEach(function(n){ if(!n) return;
      n.style.opacity='1'; n.style.transform='none'; n.style.filter='none';
      n._op='1'; n._tr='none'; n._fl='none'; });
  }
  function measure(){
    var vh=window.innerHeight;
    scenes.forEach(function(o){
      o.top=o.el.offsetTop;
      o.h=o.el.offsetHeight;
      o.span=Math.max(1, o.el.offsetHeight-o.stage.offsetHeight);
      /* The lead starts a scene's timeline before it reaches the top of
         the window. Words want that — they have to be readable by the
         time the stage pins. A scene whose opening beat is the thing
         worth seeing wants the opposite, and says so. */
      o.lead=Math.round(vh*(o.leadF==null?0.45:o.leadF));
      o.last=-1;
    });
  }
  function loop(now){
    requestAnimationFrame(loop);
    /* a hidden tab gets no work at all, and no stale clock on return */
    if(document.visibilityState!=='visible'){ t0=null; prev=null; return; }
    if(t0===null) t0=now;
    /* How much of the gap to the scroll's real position to close on
       this frame. It used to be a flat fourteen per cent, which is a
       different speed on every machine: a frame that arrives late
       closes the same fourteen per cent as one that arrives on time,
       so a dropped frame does not just skip, it lands short — and a
       run of them reads as a stutter rather than as a slow patch.
       Measured against the clock instead, a long frame catches up
       exactly as far as it should have, and the section moves at the
       same speed whether the browser is managing sixty frames or
       thirty. A hair gentler than it was, too: this stage carries a
       laptop and a phone, and weight wants a longer glide. */
    var dt = (prev===null) ? (1/60) : Math.min(.06,(now-prev)/1000);
    prev=now;
    var chase = 1 - Math.pow(1-0.115, dt*60);
    var intro=out(Math.min(1,(now-t0)/900));
    var y=window.scrollY||window.pageYOffset, vh=window.innerHeight;
    for(var i=0;i<scenes.length;i++){
      var o=scenes[i];
      /* A scene that plays itself. The scroll only decides whether it
         is on — once the stage is in the window the clock takes over,
         and it starts again from the top every time it comes back, so
         the section is never found halfway through. This is for the
         one scene that is a little film rather than a thing to be
         wound: a letter cannot be read at whatever speed a thumb
         happens to be moving. */
      if(o.auto){
        /* How early a self-playing scene is allowed to start. Nearly a
           whole screen ahead was right for a line that should already
           be standing when the reader gets to it, and wrong for a
           piece that is meant to hold them: the software house began
           while the section above was still on the glass, so the
           opening ran to an empty room. A scene that is a film says
           so, and starts when its stage takes the window. */
        var lf = (o.liveF==null ? 0.72 : o.liveF);
        var live = (y + vh*lf) > o.top && y < (o.top + o.h - vh*0.28);
        if(live!==o.live){ o.live=live; o.el.classList.toggle('live', live); }
        /* A film that has been played once can be read by hand. From
           the frame somebody takes hold of it the clock is out of it
           altogether — it does not creep on underneath, and it does
           not start again when the section is left and come back to.
           It stays exactly where it was put. */
        if(o.scrubv!=null){
          if(Math.abs(o.scrubv-o.last)>0.0004){ o.last=o.scrubv; o.paint(o.scrubv); }
          continue;
        }
        /* A manual scene waits to be asked. The scroll still decides
           whether it MAY run — leaving the section puts it back to the
           start, so nobody arrives at it halfway through something they
           never started. */
        if(!live || (o.manual && !o.playing)){
          o.t0=null; if(o.manual) o.playing=false;
          if(o.last!==0){ o.last=0; o.paint(0); }
          continue;
        }
        if(o.t0==null) o.t0=now;
        var a=Math.min(1,(now-o.t0)/o.dur);
        if(Math.abs(a-o.last)>0.0004){ o.last=a; o.paint(a); }
        continue;
      }
      var praw=(y-o.top+o.lead)/(o.span+o.lead);
      var p=Math.max(0,Math.min(1,praw));
      /* Only the scene the scroll is in keeps its composited layers —
         see the note in bbh.css. A quarter of a scene either side, so
         the layers exist before they are needed and outlast the exit. */
      var lv=praw>-0.25 && praw<1.25;
      if(lv!==o.live){ o.live=lv; o.el.classList.toggle('live', lv); }
      o.sm+=(p-o.sm)*chase;
      if(Math.abs(p-o.sm)<0.0004) o.sm=p;
      /* The opening beat plays by itself only for someone who lands
         inside the section — a reload, or a link straight to it. Arriving
         down the page, the scroll owns the whole timeline, so nothing
         ever holds still while it is being scrolled through. */
      if(o.introOn===null) o.introOn = p>0.02 && p<0.999;
      var s=o.introOn ? Math.max(o.sm, intro*0.3) : o.sm;
      if(Math.abs(s-o.last)>0.0004){ o.last=s; o.paint(s); }
    }
  }
  return {
    out:out, io:io, film:film, seg:seg, set:set, split:split, plain:plain, blur:blur,
    /* the stage starts hidden in CSS, so it must never be left to the
       loop alone — base() is the state it falls back to */
    add:function(o){
      o.stage=o.el.querySelector('.stage');
      o.sm=0; o.last=-1; o.introOn=null; o.top=0; o.h=0; o.span=1; o.lead=0; o.live=null;
      o.t0=null; o.playing=false;

      scenes.push(o);
      o.build(); o.base();
      if(reduce) return;
      measure();
      if(!started){
        started=true;
        window.addEventListener('resize', measure, {passive:true});
        window.addEventListener('load', measure);
        if(document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
        /* A scene is placed by where it starts and how long it runs, and
           both move whenever anything above it changes height — a late
           image, a font, a canvas that only takes its size once its
           script has run. Measured once, a section can spend its whole
           scroll believing it begins a screen and a half further down,
           and then it never reaches its own end: the last card never
           lands, the notification never arrives. So the page's own box
           is watched, and every scene is measured again whenever it
           moves. */
        if('ResizeObserver' in window){
          new ResizeObserver(function(){ measure(); }).observe(document.documentElement);
        }
        document.addEventListener('visibilitychange', function(){
          t0=null;
          if(document.visibilityState!=='visible'){
            scenes.forEach(function(x){ x.base(); });    /* never leave it blank */
          } else {
            scenes.forEach(function(x){ x.last=-1; });
          }
        });
        /* the language switch rewrites the text, so the words have to be
           cut apart again and the stages repainted where the scroll is */
        [].slice.call(document.querySelectorAll('[data-lang-btn]')).forEach(function(b){
          b.addEventListener('click', function(){
            scenes.forEach(function(x){ x.build(); x.last=-1; });
            measure();
          });
        });
        requestAnimationFrame(loop);
      }
    },
    measure:measure,
    /* A component can be unmounted — a route change, a hot reload — and a
       scene left in the list would go on being painted against an element
       that is no longer in the document. */
    remove:function(el){
      for(var i=scenes.length-1;i>=0;i--) if(scenes[i].el===el) scenes.splice(i,1);
    },
    /* hand a self-playing scene over to the reader, or give it back to
       its own clock with null */
    scrub:function(el,v){
      for(var i=0;i<scenes.length;i++){
        if(scenes[i].el!==el) continue;
        scenes[i].scrubv = (v==null) ? null : Math.max(0,Math.min(1,v));
        if(v==null){ scenes[i].t0=null; scenes[i].last=-1; }
      }
    },
    /* start a manual scene, or start it again from the top */
    go:function(el){
      for(var i=0;i<scenes.length;i++){
        if(scenes[i].el===el){ scenes[i].playing=true; scenes[i].t0=null; scenes[i].last=-1; }
      }
    }
  };
}

/* One engine for the page, made on first use in the browser. */
let _sc: ReturnType<typeof makeStage> | null = null;
export function stage(){
  if (typeof window === 'undefined') return null;
  if (!_sc){
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    _sc = makeStage();
  }
  return _sc;
}
