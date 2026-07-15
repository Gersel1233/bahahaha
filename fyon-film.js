/* ============================================================
   FYON INTELLIGENCE FILM — self-playing 16:9 SVG film.
   Ported from the Claude-design embed; adapted to Lesreg/Fyon:
   self-hosted fonts (no CDN), the site's spruce palette, warm
   paper backdrop. Autoplays + loops while on screen; a cinematic
   camera punches in per beat, time-remapped for a soft finish.
   ============================================================ */
(function(){
  "use strict";
  const SVGNS = "http://www.w3.org/2000/svg";
  const CX = 640, CY = 360;
  // site palette — spruce greens + warm ink, so the film belongs to the page
  const COL = { ink:'#211d18', soft:'#6a6055', faint:'#9a9082', terra:'#1f857a', deep:'#13635a', tint:'#34a596', paper:'#f7ece0' };
  const SERIF = '"Newsreader", Georgia, serif';
  const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';
  const UI = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Helvetica, Arial, sans-serif';

  // ---------- math ----------
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const seg=(p,a,b)=>clamp((p-a)/(b-a),0,1);
  const lerp=(a,b,t)=>a+(b-a)*t;
  const eio=t=>t<0.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1;       // soft settle (shared language)
  const eo =t=>1-Math.pow(1-t,3);
  const eoBack=t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);}; // spring overshoot
  // trapezoid opacity inside a normalized local [0,1]
  const trap=(t,inA=0.16,outA=0.86)=>Math.min(seg(t,0,inA), 1-seg(t,outA,1));

  const el=(tag,attrs)=>{const n=document.createElementNS(SVGNS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);return n;};
  function setText(n,s){ if(n.textContent!==s) n.textContent=s; }

  // ---------- build scene graph ----------
  const stage=document.getElementById('stage');
  if(!stage) return;
  const svg=el('svg',{viewBox:'0 0 1280 720',preserveAspectRatio:'xMidYMid meet'});
  stage.appendChild(svg);

  const defs=el('defs',{});
  svg.appendChild(defs);
  // depth-lit core gradient (light from top-left)
  const grad=el('radialGradient',{id:'coreGrad',cx:'38%',cy:'32%',r:'75%'});
  [['0%','#6fd3c2'],['42%','#34a596'],['100%','#0f4a40']].forEach(([o,c])=>grad.appendChild(el('stop',{offset:o,'stop-color':c})));
  defs.appendChild(grad);
  const glossGrad=el('linearGradient',{id:'gloss',x1:'0',y1:'0',x2:'0',y2:'1'});
  glossGrad.appendChild(el('stop',{offset:'0%','stop-color':'#ffffff','stop-opacity':'.55'}));
  glossGrad.appendChild(el('stop',{offset:'100%','stop-color':'#ffffff','stop-opacity':'0'}));
  defs.appendChild(glossGrad);
  const shGrad=el('radialGradient',{id:'coreSh',cx:'50%',cy:'50%',r:'50%'});
  shGrad.appendChild(el('stop',{offset:'0%','stop-color':'#0d3d34','stop-opacity':'.5'}));
  shGrad.appendChild(el('stop',{offset:'62%','stop-color':'#0d3d34','stop-opacity':'.2'}));
  shGrad.appendChild(el('stop',{offset:'100%','stop-color':'#0d3d34','stop-opacity':'0'}));
  defs.appendChild(shGrad);
  // heavy blur for the ambient light washes
  const soften=el('filter',{id:'soften',x:'-80%',y:'-80%',width:'260%',height:'260%'});
  soften.appendChild(el('feGaussianBlur',{stdDeviation:'34'}));
  defs.appendChild(soften);
  // the scan beam fades at its ends
  const scanGrad=el('linearGradient',{id:'scanGrad',x1:'0',y1:'0',x2:'1',y2:'0'});
  [['0%','0'],['18%','.9'],['50%','1'],['82%','.9'],['100%','0']].forEach(([o,a])=>scanGrad.appendChild(el('stop',{offset:o,'stop-color':'#34a596','stop-opacity':a})));
  defs.appendChild(scanGrad);

  const world=el('g',{}); svg.appendChild(world);

  // ---------- ambient atmosphere — the film breathes even between beats ----------
  const TAU=Math.PI*2;
  const amb=el('g',{}); world.appendChild(amb);
  // soft drifting light washes (spruce · amber · deep teal)
  const washes=[[CX-230,CY-130,190,'#34a596',.10],[CX+260,CY+150,230,'#c2914a',.06],[CX+60,CY-240,150,'#2b7b86',.08]]
    .map(([x,y,r,c,o])=>{ const w=el('circle',{cx:x,cy:y,r:r,fill:c,opacity:o,filter:'url(#soften)'}); amb.appendChild(w); return {n:w,x,y}; });
  // faint concentric orbits around the story's centre
  const orbits=[176,248,326].map(r=>{ const c=el('circle',{cx:CX,cy:CY,r:r,fill:'none',stroke:COL.terra,'stroke-width':'1',opacity:'0'}); amb.appendChild(c); return c; });
  // slow constellation of drifting motes (deterministic, loops seamlessly)
  const parts=[];
  for(let i=0;i<22;i++){
    const r=150+((i*67)%210), a0=i*2.399, sz=1.5+((i*13)%17)/9, dir=i%2?1:-1, spd=1+(i%3);
    const d=el('circle',{r:sz.toFixed(1),fill:i%3?COL.terra:COL.deep,opacity:'0'}); amb.appendChild(d);
    parts.push({n:d,r,a0,dir,spd,base:.10+((i*29)%14)/100,ph:(i*47)%10});
  }

  // face ring (the object is born here)
  const faceRing=el('ellipse',{cx:CX,cy:CY,rx:92,ry:116,fill:'none',stroke:COL.terra,'stroke-width':'1.6',opacity:'0'});
  world.appendChild(faceRing);

  // geometry points
  const geoRel=[[0,-72],[-46,-38],[46,-38],[0,-6],[-38,34],[38,34],[0,54]];
  const geoPts=geoRel.map(()=>{const c=el('circle',{r:'3.4',fill:COL.terra,opacity:'0'});world.appendChild(c);return c;});
  const geoNet=el('path',{d:`M${CX-46} ${CY-38} L${CX+46} ${CY-38} L${CX+38} ${CY+34} L${CX-38} ${CY+34} Z M${CX} ${CY-72} L${CX} ${CY+54}`,fill:'none',stroke:COL.terra,'stroke-width':'1',opacity:'0'});
  world.appendChild(geoNet);

  // scan line (beat 2) — a soft beam with a wide glow underneath
  const scanGlow=el('line',{x1:CX-96,y1:CY,x2:CX+96,y2:CY,stroke:COL.tint,'stroke-width':'11','stroke-linecap':'round',opacity:'0'});
  world.appendChild(scanGlow);
  const scan=el('line',{x1:CX-96,y1:CY,x2:CX+96,y2:CY,stroke:'url(#scanGrad)','stroke-width':'2.6','stroke-linecap':'round',opacity:'0'});
  world.appendChild(scan);

  // sufficiency ring (beat 3)
  const sufR=138, sufC=2*Math.PI*sufR;
  const sufTrack=el('circle',{cx:CX,cy:CY,r:sufR,fill:'none',stroke:'rgba(43,38,32,.12)','stroke-width':'3',opacity:'0'});
  const sufFill=el('circle',{cx:CX,cy:CY,r:sufR,fill:'none',stroke:COL.terra,'stroke-width':'3','stroke-linecap':'round',transform:`rotate(-90 ${CX} ${CY})`,'stroke-dasharray':sufC,'stroke-dashoffset':sufC,opacity:'0'});
  world.appendChild(sufTrack); world.appendChild(sufFill);

  // memory rings (beat 6)
  const memRings=[120,164,208,252].map(r=>el('circle',{cx:CX,cy:CY,r:r,fill:'none',stroke:COL.terra,'stroke-width':'1.4',opacity:'0'}));
  memRings.forEach(r=>world.appendChild(r));
  const memDots=[];
  memRings.forEach((ring,ri)=>{ const rr=120+ri*44; const n=3+ri; for(let k=0;k<n;k++){ const a=(k/n)*Math.PI*2 - Math.PI/2 + ri*0.5; const d=el('circle',{cx:CX+Math.cos(a)*rr,cy:CY+Math.sin(a)*rr,r:'6',fill:COL.deep,opacity:'0'}); d.dataset.ri=ri; world.appendChild(d); memDots.push(d);} });

  // ===== BEAT 5: create a project + merge it into the journey =====
  const RAIL_Y=CY+162;
  const railL=CX-238, railR=CX+238, railLen=railR-railL;
  const rail=el('line',{x1:railL,y1:RAIL_Y,x2:railR,y2:RAIL_Y,stroke:'rgba(43,38,32,.16)','stroke-width':'2','stroke-linecap':'round',opacity:'0'});
  const railFill=el('line',{x1:railL,y1:RAIL_Y,x2:railR,y2:RAIL_Y,stroke:COL.terra,'stroke-width':'2','stroke-linecap':'round','stroke-dasharray':railLen,'stroke-dashoffset':railLen,opacity:'0'});
  world.appendChild(rail); world.appendChild(railFill);

  function mkChip(label,accent){
    const g=el('g',{opacity:'0'});
    g.appendChild(el('rect',{x:-54,y:-18,width:108,height:36,rx:12,fill:accent?'url(#coreGrad)':COL.paper,stroke:accent?'none':'rgba(43,38,32,.14)','stroke-width':'1'}));
    const t=el('text',{x:0,y:5,'text-anchor':'middle','font-family':MONO,'font-size':'13',fill:accent?COL.paper:COL.soft}); t.textContent=label;
    g.appendChild(t); world.appendChild(g); return g;
  }
  // already dialed-in nodes living on the journey
  const existA=mkChip('sleep');
  const existB=mkChip('skincare');
  const existX={a:CX-175, b:CX-72};
  // the merged new-project node
  const mergedNode=mkChip('training',true);
  const mergeX=CX+34;

  // journey markers: TODAY (now) and POTENTIAL (where it's heading)
  function mkMarker(label,filled){
    const g=el('g',{opacity:'0'});
    const ring=el('circle',{cx:0,cy:0,r:filled?16:12,fill:'none',stroke:COL.terra,'stroke-width':'2',opacity:'0'});
    g.appendChild(ring);
    g.appendChild(el('circle',{cx:0,cy:0,r:filled?7:5,fill:filled?COL.deep:'none',stroke:filled?'none':COL.terra,'stroke-width':filled?0:2}));
    const t=el('text',{x:0,y:32,'text-anchor':'middle','font-family':MONO,'font-size':'12','letter-spacing':'2',fill:COL.soft}); t.textContent=label;
    g.appendChild(t); world.appendChild(g); return {g,ring};
  }
  const today=mkMarker('TODAY',true);        const todayX=CX+128;
  const potential=mkMarker('POTENTIAL',false); const potentialX=CX+236;
  const journeyCap=el('text',{x:(existX.a+existX.b)/2,y:RAIL_Y+52,'text-anchor':'middle','font-family':MONO,'font-size':'11','letter-spacing':'2',fill:COL.faint,opacity:'0'}); journeyCap.textContent='CURRENT JOURNEY';
  world.appendChild(journeyCap);

  // ===== chat exchange — the moment Fyon understands & adapts =====
  const chat=el('g',{opacity:'0'});
  const uB=el('g',{});
  uB.appendChild(el('rect',{x:CX-34,y:294,width:376,height:62,rx:16,fill:COL.ink}));
  const uL1=el('text',{x:CX-14,y:320,'font-family':UI,'font-size':'16',fill:COL.paper});
  const uL2=el('text',{x:CX-14,y:342,'font-family':UI,'font-size':'16',fill:COL.paper});
  uB.appendChild(uL1); uB.appendChild(uL2);
  const fB=el('g',{});
  fB.appendChild(el('rect',{x:CX-356,y:372,width:400,height:116,rx:16,fill:COL.paper,stroke:'rgba(31,133,122,.35)','stroke-width':'1.5'}));
  const fEy=el('text',{x:CX-338,y:396,'font-family':MONO,'font-size':'10.5','letter-spacing':'2',fill:COL.terra}); fEy.textContent='FYON';
  const fL1=el('text',{x:CX-338,y:420,'font-family':UI,'font-size':'16',fill:COL.ink});
  const fL2=el('text',{x:CX-338,y:442,'font-family':UI,'font-size':'16',fill:COL.ink});
  const fL3=el('text',{x:CX-338,y:464,'font-family':UI,'font-size':'16',fill:COL.ink});
  fB.appendChild(fEy); fB.appendChild(fL1); fB.appendChild(fL2); fB.appendChild(fL3);
  chat.appendChild(uB); chat.appendChild(fB); world.appendChild(chat);
  const userLines=['I think I need to put on muscle and some','weight — can you build me a project for it?'];
  const fyonLines=['Smart call — your instinct’s right. I’ll','fold it into what you’ve already got going,','so nothing overlaps or undoes your wins.'];
  const userTotal=userLines.join('').length, fyonTotal=fyonLines.join('').length;
  function typeInto(els,lines,n){ let rem=n; for(let i=0;i<lines.length;i++){ const L=lines[i]; setText(els[i], L.slice(0,clamp(Math.round(rem),0,L.length))); rem-=L.length; } }

  // the new project card (training schedule · macros)
  const pcW=210, pcH=110;
  const projCard=el('g',{opacity:'0'});
  projCard.appendChild(el('rect',{x:-pcW/2,y:-pcH/2,width:pcW,height:pcH,rx:16,fill:COL.paper,stroke:'rgba(31,133,122,.4)','stroke-width':'1.5'}));
  const pcTitle=el('text',{x:-pcW/2+18,y:-pcH/2+26,'font-family':MONO,'font-size':'11','letter-spacing':'2',fill:COL.terra}); pcTitle.textContent='NEW PROJECT';
  projCard.appendChild(pcTitle);
  [['Training schedule',10],['Macros',38]].forEach(([lb,dy])=>{
    projCard.appendChild(el('circle',{cx:-pcW/2+24,cy:dy,r:'3.6',fill:COL.terra}));
    const t=el('text',{x:-pcW/2+38,y:dy+5,'font-family':UI,'font-size':'16',fill:COL.ink}); t.textContent=lb;
    projCard.appendChild(t);
  });
  world.appendChild(projCard);

  // architecture nodes + connectors (beat 7)
  const ICON={
    eye:'M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    chat:'M4 5h16v11H8l-4 4V5Z',
    image:'M3.5 4.5h17v15h-17z M9 10.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2 M5 18l5-4 3.5 2.6L17 12l3 3.5',
    plan:'M6 4v14 M6 8h9l-2-2 M6 13h6l-2-2',
    mem:'M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4 M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8',
  };
  const archDef=[
    {x:250,y:250,ic:'eye',l:'Perception',from:true},
    {x:250,y:470,ic:'chat',l:'Understanding',from:true},
    {x:1030,y:210,ic:'image',l:'Image'},
    {x:1030,y:360,ic:'plan',l:'Plan'},
    {x:1030,y:500,ic:'mem',l:'Memory'},
  ];
  const archNodes=archDef.map(d=>{
    const g=el('g',{opacity:'0',transform:`translate(${d.x} ${d.y})`});
    g.appendChild(el('rect',{x:-40,y:-40,width:80,height:80,rx:22,fill:COL.paper,stroke:'rgba(43,38,32,.12)','stroke-width':'1'}));
    const ig=el('g',{transform:'translate(-12,-16)',fill:'none',stroke:COL.terra,'stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round'});
    ig.appendChild(el('path',{d:ICON[d.ic]}));
    g.appendChild(ig);
    const t=el('text',{x:0,y:64,'text-anchor':'middle','font-family':MONO,'font-size':'13','letter-spacing':'1',fill:COL.soft}); t.textContent=d.l.toUpperCase();
    g.appendChild(t); world.appendChild(g); return g;
  });
  const archLines=archDef.map(d=>{
    const isIn=d.from; const x1=isIn?d.x+46:CX+70, y1=isIn?d.y:CY, x2=isIn?CX-70:d.x-46, y2=isIn?CY:d.y;
    const len=Math.hypot(x2-x1,y2-y1);
    const ln=el('line',{x1,y1,x2,y2,stroke:COL.terra,'stroke-width':'2.2','stroke-linecap':'round',opacity:'0','stroke-dasharray':len,'stroke-dashoffset':len});
    ln.dataset.len=len; world.insertBefore(ln, archNodes[0]); return ln;
  });
  // energy pulses that travel along the drawn connectors
  const archFlow=archDef.map((d,i)=>{
    const src=archLines[i];
    const ln=el('line',{x1:src.getAttribute('x1'),y1:src.getAttribute('y1'),x2:src.getAttribute('x2'),y2:src.getAttribute('y2'),
      stroke:COL.tint,'stroke-width':'2.6','stroke-linecap':'round','stroke-dasharray':'5 29',opacity:'0'});
    world.insertBefore(ln, archNodes[0]); return ln;
  });

  // ---- the CORE (hero, depth-lit) — drawn on top of connectors, born late ----
  const coreG=el('g',{opacity:'0'});
  const coreShadowEl=el('ellipse',{cx:CX,cy:CY+72,rx:104,ry:40,fill:'url(#coreSh)'});
  const coreGlow=el('circle',{cx:CX,cy:CY,r:82,fill:COL.tint,opacity:'0'});
  const coreBody=el('circle',{cx:CX,cy:CY,r:82,fill:'url(#coreGrad)'});
  const coreGloss=el('ellipse',{cx:CX-22,cy:CY-30,rx:40,ry:26,fill:'url(#gloss)'});
  const lockG=el('g',{transform:`translate(${CX-14} ${CY-16})`,fill:'none',stroke:COL.paper,'stroke-width':'2','stroke-linecap':'round','stroke-linejoin':'round',opacity:'0'});
  lockG.appendChild(el('rect',{x:2,y:12,width:24,height:17,rx:4}));
  lockG.appendChild(el('path',{d:'M7 12V8a7 7 0 0 1 14 0v4'}));
  lockG.appendChild(el('circle',{cx:14,cy:20,r:2.2,fill:COL.paper,stroke:'none'}));
  // breathing Fyon chevron (alternates with the lock inside the core)
  const chevG=el('g',{opacity:'0'});
  const chevInner=el('g',{fill:'none',stroke:COL.paper,'stroke-width':'2.7','stroke-linecap':'round','stroke-linejoin':'round'});
  chevInner.appendChild(el('path',{d:'M7 17 L16 9 L25 17'}));
  const chev2=el('path',{d:'M7 24 L16 16 L25 24',opacity:'0.5'});
  chevInner.appendChild(chev2);
  chevG.appendChild(chevInner);
  coreG.appendChild(coreShadowEl); coreG.appendChild(coreGlow);
  coreG.appendChild(coreBody); coreG.appendChild(coreGloss); coreG.appendChild(lockG); coreG.appendChild(chevG);
  world.appendChild(coreG);
  // one-shot ripples — motion-graphic accents when the core is born and when
  // the new project lands on the journey
  const rippleA=el('circle',{cx:CX,cy:CY,r:82,fill:'none',stroke:COL.terra,'stroke-width':'2',opacity:'0'});
  const rippleB=el('circle',{cx:CX,cy:CY,r:82,fill:'none',stroke:COL.tint,'stroke-width':'1.4',opacity:'0'});
  const rippleM=el('circle',{cx:CX+34,cy:CY+162,r:10,fill:'none',stroke:COL.terra,'stroke-width':'1.8',opacity:'0'});
  world.insertBefore(rippleA,coreG); world.insertBefore(rippleB,coreG); world.appendChild(rippleM);

  // ---- labels — larger serif with a soft rise as they appear ----
  const labelMain=el('text',{x:CX,y:612,'text-anchor':'middle','font-family':SERIF,'font-size':'40',fill:COL.ink,opacity:'0'});
  const labelSub=el('text',{x:CX,y:652,'text-anchor':'middle','font-family':MONO,'font-size':'15','letter-spacing':'4',fill:COL.soft,opacity:'0'});
  svg.appendChild(labelMain); svg.appendChild(labelSub);
  // ---- contextual memory (compounding) ----
  const memEy=el('text',{x:CX,y:86,'text-anchor':'middle','font-family':MONO,'font-size':'12','letter-spacing':'3',fill:COL.terra,opacity:'0'}); memEy.textContent='IT REMEMBERS — IN CONTEXT';
  svg.appendChild(memEy);
  const memNoteTxt=['Kept macros through 3 travel days','Skipped legs twice — moved them earlier','Down 1.8% body fat since week 1'];
  const memNotes=memNoteTxt.map((tx,i)=>{
    const g=el('g',{opacity:'0'});
    g.appendChild(el('rect',{x:CX+92,y:CY-56+i*54,width:340,height:44,rx:12,fill:COL.paper,stroke:'rgba(43,38,32,.10)','stroke-width':'1'}));
    g.appendChild(el('circle',{cx:CX+116,cy:CY-34+i*54,r:'4',fill:COL.terra}));
    const t=el('text',{x:CX+132,y:CY-29+i*54,'font-family':UI,'font-size':'15',fill:COL.ink}); t.textContent=tx;
    g.appendChild(t); svg.appendChild(g); return g;
  });

  const veil=document.getElementById('veil');

  // ---------- label timeline ----------
  const LAB=[
    {r:[0,.05], main:'A specially trained intelligence'},
    {r:[.05,.09], main:'built to reach your potential.'},
    {r:[.09,.18], main:'reads how you’re perceived', sub:'RESERVED · INTENSE · WARM'},
    {r:[.18,.26], main:'It learns who you’re becoming.'},
    {r:[.26,.36], main:'One understanding of you.'},
    {r:[.36,.52], main:''},
    {r:[.52,.63], main:'It fits into your journey — without overlap.'},
    {r:[.63,.70], main:'From today toward your potential.'},
    {r:[.70,.82], main:'It remembers everything — in context.'},
    {r:[.82,1.001], main:'No matter what — every project becomes one journey to your potential.', payoff:true},
  ];

  // ---------- cinematic camera — hold · move · hold ----------
  // the camera only travels BETWEEN beats; during anything readable it parks.
  const camKeys=[
    [0.000,1.07,640,362],  // open, slightly tight on the face
    [0.060,1.07,640,362],  //   hold — the ring is born
    [0.120,1.12,640,356],  // ease in for the scan
    [0.200,1.12,640,356],  //   hold — scan + understanding read
    [0.270,1.16,640,360],  // push as the face tightens into the core
    [0.335,1.16,640,360],  //   hold — newborn core + ripples
    [0.385,1.10,636,342],  // stay CLOSE for the chat — the core keeps its presence
    [0.545,1.10,636,342],  //   hold — the whole chat, incl. its clean exit
    [0.615,1.13,658,446],  // glide down to the journey rail
    [0.700,1.13,658,446],  //   hold — merge, today → potential
    [0.750,1.04,640,362],  // open up for memory
    [0.825,1.04,640,362],  //   hold — memory notes
    [0.870,1.00,640,360],  // widest for the full architecture
    [0.960,1.00,640,360],  //   hold — payoff
    [1.000,1.03,640,360],  // a final breath in
  ];
  function camAt(p){
    for(let i=0;i<camKeys.length-1;i++){ const a=camKeys[i],b=camKeys[i+1];
      if(p<=b[0]){ const t=eio(seg(p,a[0],b[0])); return {s:lerp(a[1],b[1],t),fx:lerp(a[2],b[2],t),fy:lerp(a[3],b[3],t)}; } }
    const l=camKeys[camKeys.length-1]; return {s:l[1],fx:l[2],fy:l[3]};
  }

  // time-remap (linear segments — the clock never pulses at a seam).
  // Budget per beat, of an 18s take: open 4.2s · chat 5.6s · journey 3.6s ·
  // memory 2.3s · architecture + payoff 2.3s.
  const REMAP=[[0,0],[0.233,0.36],[0.544,0.52],[0.744,0.70],[0.872,0.82],[1,1]];
  function warp(u){
    for(let i=0;i<REMAP.length-1;i++){ const a=REMAP[i],b=REMAP[i+1];
      if(u<=b[0]){ return lerp(a[1],b[1],seg(u,a[0],b[0])); } }
    return 1;
  }

  // ---------- the single render(progress) ----------
  function render(p){
    p=clamp(p,0,1);
    const cam=camAt(p); const settle=18*eio(seg(p,.94,1));
    world.setAttribute('transform',`translate(${(640-cam.fx*cam.s).toFixed(1)} ${(360-cam.fy*cam.s+settle).toFixed(1)}) scale(${cam.s.toFixed(4)})`);
    if(veil) veil.style.opacity = 0;                 // start on warm paper (no dark entry)

    // ambient — washes drift, orbits breathe, motes circle (all loop seamlessly)
    washes.forEach((w,i)=>{
      w.n.setAttribute('cx',(w.x+16*Math.sin(TAU*(p+i*0.33))).toFixed(1));
      w.n.setAttribute('cy',(w.y+11*Math.cos(TAU*(p+i*0.21))).toFixed(1));
    });
    orbits.forEach((c,i)=>{ c.setAttribute('opacity',(0.05+0.02*Math.sin(TAU*(p+i*0.3))).toFixed(3)); });
    parts.forEach(pt=>{
      const a=pt.a0+pt.dir*TAU*pt.spd*p;
      pt.n.setAttribute('cx',(CX+Math.cos(a)*pt.r).toFixed(1));
      pt.n.setAttribute('cy',(CY+Math.sin(a)*pt.r*0.72).toFixed(1));
      pt.n.setAttribute('opacity',(pt.base*(0.55+0.45*Math.sin(TAU*3*p+pt.ph))).toFixed(3));
    });

    // BEAT 1–3 : face ring is born, then scanned, then understood
    const born=eo(seg(p,.015,.09));
    const collapse=eio(seg(p,.27,.35));           // face tightens into core
    faceRing.setAttribute('opacity', (born*(1-collapse)*0.9).toFixed(3));
    faceRing.setAttribute('rx', lerp(92,82,collapse).toFixed(1));
    faceRing.setAttribute('ry', lerp(116,82,collapse).toFixed(1));

    const geoOn=seg(p,.10,.17), geoPull=1-eio(seg(p,.27,.35));
    geoPts.forEach((c,i)=>{
      const on = geoOn>i/geoPts.length ? 1:0;
      c.setAttribute('opacity', (on*(1-seg(p,.28,.35))).toFixed(3));
      c.setAttribute('cx', (CX+geoRel[i][0]*geoPull).toFixed(1));
      c.setAttribute('cy', (CY+geoRel[i][1]*geoPull).toFixed(1));
    });
    geoNet.setAttribute('opacity', (seg(p,.12,.18)*(1-seg(p,.28,.35))*0.7).toFixed(3));

    const b2=seg(p,.10,.18);
    const scanOp=trap(b2,.14,.86);
    scan.setAttribute('opacity', scanOp.toFixed(3));
    scanGlow.setAttribute('opacity',(scanOp*0.22).toFixed(3));
    const sy=lerp(CY-116,CY+116,eio(b2));
    const sw=Math.sqrt(Math.max(0.001,1-Math.pow((sy-CY)/116,2)))*92;
    [scan,scanGlow].forEach(n=>{
      n.setAttribute('y1',sy.toFixed(1)); n.setAttribute('y2',sy.toFixed(1));
      n.setAttribute('x1',(CX-sw).toFixed(1)); n.setAttribute('x2',(CX+sw).toFixed(1));
    });

    const b3=seg(p,.18,.26);
    const sufVis=eo(seg(p,.19,.23))*(1-seg(p,.28,.35));
    sufTrack.setAttribute('opacity',(sufVis*0.9).toFixed(3));
    sufFill.setAttribute('opacity',sufVis.toFixed(3));
    sufFill.setAttribute('stroke-dashoffset',(sufC*(1-eio(b3))).toFixed(1));

    // BEAT 4 : the locked core — pops in with a soft spring, then rises for the chat
    const coreInRaw=seg(p,.28,.36), coreIn=eo(coreInRaw);
    const pulse=1+0.06*Math.sin(clamp(seg(p,.33,.45),0,1)*Math.PI);
    const chatRaise=eio(Math.min(seg(p,.36,.40),1-seg(p,.505,.55)));
    coreG.setAttribute('opacity', clamp(coreIn,0,1).toFixed(3));
    // during the chat the core stays PRESENT — it only steps back a fifth,
    // and its rise arcs slightly past the mark before settling (real motion)
    const cs=(coreInRaw>0?lerp(0.8,1,eoBack(coreInRaw)):0.8)*pulse*(1-0.22*chatRaise);
    const riseArc=12*Math.sin(Math.PI*clamp(seg(p,.365,.45),0,1));
    const dyC=-(118*chatRaise+riseArc);
    coreG.setAttribute('transform',`translate(0 ${dyC.toFixed(1)}) translate(${CX} ${CY}) scale(${cs.toFixed(3)}) translate(${-CX} ${-CY})`);
    // core glyph: lock by default, breathing Fyon chevron during the chat & the payoff
    const glyphOn=eo(seg(p,.34,.40));
    const chevW=Math.max( Math.min(eo(seg(p,.375,.41)), 1-eo(seg(p,.49,.52))), eo(seg(p,.82,.87)) );
    const lockPulse=1+0.14*Math.sin(clamp(seg(p,.63,.70),0,1)*Math.PI);
    lockG.setAttribute('opacity', (glyphOn*(1-chevW)).toFixed(3));
    lockG.setAttribute('transform',`translate(${CX} ${CY}) scale(${lockPulse.toFixed(3)}) translate(${-CX} ${-CY}) translate(${CX-14} ${CY-16})`);
    chevG.setAttribute('opacity', chevW.toFixed(3));
    const breath=1.6*Math.sin(p*130);
    chevInner.setAttribute('transform',`translate(${CX} ${(CY+breath).toFixed(2)}) scale(1.16) translate(-16 -16)`);
    chev2.setAttribute('opacity', (0.4+0.22*(0.5+0.5*Math.sin(p*130))).toFixed(3));
    coreGlow.setAttribute('opacity', (Math.sin(clamp(seg(p,.31,.45),0,1)*Math.PI)*0.5).toFixed(3));
    coreGlow.setAttribute('r', (82*pulse+16).toFixed(1));
    // birth ripples — two rings expand out of the newborn core, then vanish
    const rA=seg(p,.315,.42), rB=seg(p,.345,.45);
    rippleA.setAttribute('r',(82+eo(rA)*130).toFixed(1));
    rippleA.setAttribute('opacity',(rA>0&&rA<1 ? (1-rA)*0.5 : 0).toFixed(3));
    rippleB.setAttribute('r',(82+eo(rB)*170).toFixed(1));
    rippleB.setAttribute('opacity',(rB>0&&rB<1 ? (1-rB)*0.35 : 0).toFixed(3));

    // BEAT 5 : the chat — Fyon understands and adapts, then dissolves cleanly
    // (a gentle fade + rise while the camera holds still — no scale-smear)
    const chatOut=eo(seg(p,.505,.55));
    chat.setAttribute('opacity',(1-chatOut).toFixed(3));
    chat.setAttribute('transform',`translate(0 ${(-16*chatOut).toFixed(1)})`);
    // bubbles slide up into place as they appear (motion-graphic entrance)
    const uIn=eo(seg(p,.37,.41)), fIn=eo(seg(p,.435,.475));
    uB.setAttribute('opacity', uIn.toFixed(3));
    uB.setAttribute('transform',`translate(0 ${((1-uIn)*22).toFixed(1)})`);
    fB.setAttribute('opacity', fIn.toFixed(3));
    fB.setAttribute('transform',`translate(0 ${((1-fIn)*22).toFixed(1)})`);
    typeInto([uL1,uL2],userLines,seg(p,.375,.43)*userTotal);
    typeInto([fL1,fL2,fL3],fyonLines,seg(p,.45,.515)*fyonTotal);

    // BEAT 6 : the project builds and merges into the journey
    const railIn=eo(seg(p,.52,.57));
    const railOut=seg(p,.70,.76);
    rail.setAttribute('opacity',(railIn*(1-railOut)*0.9).toFixed(3));
    // the settled chips pop in with a spring overshoot, staggered
    const exRawA=seg(p,.53,.585), exRawB=seg(p,.545,.60);
    existA.setAttribute('opacity',(eo(exRawA)*(1-railOut)).toFixed(3));
    existA.setAttribute('transform',`translate(${existX.a} ${RAIL_Y}) scale(${(exRawA>0?eoBack(exRawA):0).toFixed(3)})`);
    existB.setAttribute('opacity',(eo(exRawB)*(1-railOut)).toFixed(3));
    existB.setAttribute('transform',`translate(${existX.b} ${RAIL_Y}) scale(${(exRawB>0?eoBack(exRawB):0).toFixed(3)})`);
    journeyCap.setAttribute('opacity',(eo(seg(p,.55,.62))*(1-railOut)*0.9).toFixed(3));
    today.g.setAttribute('opacity',(eo(seg(p,.54,.60))*(1-railOut)).toFixed(3)); today.g.setAttribute('transform',`translate(${todayX} ${RAIL_Y})`);
    potential.g.setAttribute('opacity',(eo(seg(p,.56,.62))*(1-railOut)).toFixed(3)); potential.g.setAttribute('transform',`translate(${potentialX} ${RAIL_Y})`);
    const glowB=Math.sin(clamp(seg(p,.63,.70),0,1)*Math.PI);
    today.ring.setAttribute('opacity',(glowB*0.9).toFixed(3)); today.ring.setAttribute('r',(16+5*glowB).toFixed(1));
    potential.ring.setAttribute('opacity',((0.4+glowB*0.6)*(1-railOut)).toFixed(3)); potential.ring.setAttribute('r',(12+5*glowB).toFixed(1));

    // project card: form out of the core, then merge down onto the rail
    const form=eo(seg(p,.53,.60));
    const merge=eio(seg(p,.585,.64));
    const hoverX=CX+205, hoverY=CY-6;
    const cx2=lerp(CX,hoverX,form), cy2=lerp(CY,hoverY,form);
    const fx=lerp(cx2,mergeX,merge), fy=lerp(cy2,RAIL_Y,merge);
    const fscale=lerp(lerp(0.25,1,form),0.34,merge);
    projCard.setAttribute('opacity',(eo(seg(p,.53,.58))*(1-eo(seg(p,.60,.64)))*(1-railOut)).toFixed(3));
    projCard.setAttribute('transform',`translate(${fx.toFixed(1)} ${fy.toFixed(1)}) scale(${fscale.toFixed(3)})`);
    const mRaw=seg(p,.60,.66), mIn=eo(mRaw);
    mergedNode.setAttribute('opacity',(mIn*(1-railOut)).toFixed(3));
    mergedNode.setAttribute('transform',`translate(${mergeX} ${RAIL_Y}) scale(${(mRaw>0?eoBack(mRaw):0).toFixed(3)})`);
    // landing ripple — a ring expands from the merge point as the node docks
    const mr=seg(p,.615,.71);
    rippleM.setAttribute('r',(12+eo(mr)*74).toFixed(1));
    rippleM.setAttribute('opacity',(mr>0&&mr<1 ? (1-mr)*0.55*(1-railOut) : 0).toFixed(3));
    railFill.setAttribute('opacity',(eo(seg(p,.57,.61))*(1-railOut)).toFixed(3));
    railFill.setAttribute('stroke-dashoffset',(railLen*(1-eio(seg(p,.58,.68)))).toFixed(1));

    // BEAT 7 : memory compounds, in context
    const memOut=seg(p,.82,.88);
    memRings.forEach((r,i)=>{ r.setAttribute('opacity',(eo(seg(p,.71+i*0.03,.80))*(1-memOut)*0.5).toFixed(3)); });
    memDots.forEach(d=>{ const ri=+d.dataset.ri; d.setAttribute('opacity',(eo(seg(p,.72+ri*0.03,.81))*(1-memOut)).toFixed(3)); });
    memEy.setAttribute('opacity',(eo(seg(p,.71,.75))*(1-memOut)).toFixed(3));
    memNotes.forEach((g,i)=>{ g.setAttribute('opacity',(eo(seg(p,.73+i*0.035,.80))*(1-memOut)).toFixed(3)); });

    // BEAT 8 : full architecture + payoff
    archNodes.forEach((g,i)=>{
      const raw=seg(p,.835+i*0.02,.93+i*0.012);
      g.setAttribute('opacity',eo(raw).toFixed(3));
      const d=archDef[i];
      g.setAttribute('transform',`translate(${d.x} ${d.y}) scale(${(raw>0?lerp(0.7,1,eoBack(raw)):0.7).toFixed(3)})`);
    });
    archLines.forEach(ln=>{ const t=eio(seg(p,.86,.99)); ln.setAttribute('opacity',(t*0.6).toFixed(3)); ln.setAttribute('stroke-dashoffset',(ln.dataset.len*(1-t)).toFixed(1)); });
    // energy pulses travel inward/outward along the finished connectors
    archFlow.forEach(ln=>{
      const t=eio(seg(p,.88,.97));
      ln.setAttribute('opacity',(t*0.85).toFixed(3));
      ln.setAttribute('stroke-dashoffset',(-p*340).toFixed(1));
    });

    // labels — fade with a soft rise
    let cur=LAB.find(L=>p>=L.r[0]&&p<L.r[1])||LAB[LAB.length-1];
    const local=seg(p,cur.r[0],cur.r[1]);
    const op = cur.payoff ? eo(seg(local,0,.22)) : trap(local,.18,.82);
    setText(labelMain,cur.main);
    labelMain.setAttribute('opacity',(cur.main?op:0).toFixed(3));
    labelMain.setAttribute('font-size', cur.payoff?'34':'38');
    labelMain.setAttribute('y', cur.payoff?'664':'612');
    labelMain.setAttribute('transform',`translate(0 ${((1-op)*12).toFixed(1)})`);
    if(cur.sub){ setText(labelSub,cur.sub); labelSub.setAttribute('opacity',op.toFixed(3)); }
    else labelSub.setAttribute('opacity','0');
  }

  // ---------- driver : self-playing clock, only while on screen ----------
  const film=document.getElementById('film');
  if(!film) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION=18;                       // seconds — budgeted per beat via REMAP
  const HOLD=2.4;                          // hold the payoff before looping

  let raf=0, t0=null, playing=false;
  function frame(ts){
    if(t0==null) t0=ts;
    const e=((ts-t0)/1000)%(DURATION+HOLD);
    render(warp(clamp(e/DURATION,0,1)));    // fast open, slow middle, easy finish, then hold+loop
    raf=requestAnimationFrame(frame);
  }
  function play(){ if(playing) return; playing=true; t0=null; raf=requestAnimationFrame(frame); }
  function stop(){ playing=false; cancelAnimationFrame(raf); }

  if(reduce){
    render(1);
  } else {
    render(0);
    // only animate while the film is on screen
    const io=new IntersectionObserver((es)=>{es.forEach(en=>{ en.isIntersecting?play():stop(); });},{threshold:0.15});
    io.observe(film);
  }
})();
