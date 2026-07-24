'use strict';
/* ============================================================
   ENGINE — 7 módulos:
   [A] flags/utils  [B] som sintetizado  [C] scroll engine (lerp)
   [D] rail         [E] coreografia/reveals  [F] camada GL (shader)
   [G] canvases 2D (loading, thumbs, demos, outro) + boot
   ============================================================ */

/* ---------- [A] FLAGS + UTILS ---------- */
const Q = new URLSearchParams(location.search);
const STATIC_MODE = Q.has('static');   // ?static=1 → tudo no estado final, sem motion
const NATIVE_SCROLL = Q.has('native'); // ?native=1 → desliga o smooth wheel
const lerp = (a,b,t)=>a+(b-a)*t;
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
const $ = s=>document.querySelector(s);
const $$ = s=>[...document.querySelectorAll(s)];

/* ---------- [B] SOM SINTETIZADO (WebAudio, zero asset) ----------
   Regras pagas em projeto: AudioContext criado NO GESTO e antes de
   qualquer await; envelope sempre fecha com exponentialRamp; tick
   de hover com throttle senão metralha em lista. Opt-in persistido. */
const Som = (() => {
  let ctx=null, master=null, bgmNodes=null, lastTick=0;
  let enabled = localStorage.getItem('pulsar-som')==='1';
  function ensure(){
    if(!ctx){
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value=.45; master.connect(ctx.destination);
    }
    if(ctx.state==='suspended') ctx.resume();
  }
  function env(g,t0,peak,dur){ // ataque curto, cauda exponencial — nunca corte seco
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(peak,t0+.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  }
  function osc(type,f0,f1,peak,dur){
    if(!enabled||!ctx) return;
    const t=ctx.currentTime, o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(f0,t);
    if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+dur*.85);
    env(g,t,peak,dur); o.connect(g); g.connect(master);
    o.start(t); o.stop(t+dur+.05);
  }
  function bgmStart(){ // pad evolutivo: 2 osciladores detunados + LFO no filtro
    if(!enabled||!ctx||bgmNodes) return;
    const t=ctx.currentTime;
    const g=ctx.createGain(); g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(.05,t+3);
    const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=320; f.Q.value=.6;
    const lfo=ctx.createOscillator(), lg=ctx.createGain();
    lfo.frequency.value=.06; lg.gain.value=140; lfo.connect(lg); lg.connect(f.frequency);
    const o1=ctx.createOscillator(); o1.type='sawtooth'; o1.frequency.value=55;
    const o2=ctx.createOscillator(); o2.type='sawtooth'; o2.frequency.value=55*1.007;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(master);
    o1.start(); o2.start(); lfo.start();
    bgmNodes={g,o1,o2,lfo};
  }
  function bgmStop(){
    if(!bgmNodes||!ctx) return;
    const t=ctx.currentTime;
    bgmNodes.g.gain.cancelScheduledValues(t);
    bgmNodes.g.gain.setValueAtTime(bgmNodes.g.gain.value||.05,t);
    bgmNodes.g.gain.exponentialRampToValueAtTime(0.0001,t+.8);
    const n=bgmNodes; setTimeout(()=>{n.o1.stop();n.o2.stop();n.lfo.stop();},900);
    bgmNodes=null;
  }
  // ---- O PULSO (sonoro): batida rítmica — coração do pulsar (a marca é "pulso") ----
  let pulseTimer=null;
  function heartbeat(){
    if(!enabled||!ctx) return;
    const t=ctx.currentTime;
    // thump grave: o pulso (sub-bass, cauda exponencial — nunca corte seco)
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(40,t+.4); // somPulso REAL (Pulsar Finance lib/som.ts)
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(.16,t+.02); g.gain.exponentialRampToValueAtTime(0.001,t+.4);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+.45);
    // ping de rádio: eco distante do feixe, bem sutil (o pulsar "bipa")
    const o2=ctx.createOscillator(), g2=ctx.createGain(), bp=ctx.createBiquadFilter();
    bp.type='bandpass'; bp.frequency.value=1500; bp.Q.value=7;
    o2.type='triangle'; o2.frequency.setValueAtTime(1500,t+.03);
    g2.gain.setValueAtTime(0.0001,t+.03); g2.gain.exponentialRampToValueAtTime(.02,t+.06); g2.gain.exponentialRampToValueAtTime(0.0001,t+.32);
    o2.connect(bp); bp.connect(g2); g2.connect(master); o2.start(t+.03); o2.stop(t+.38);
  }
  function startPulse(){ if(pulseTimer) return; const beat=()=>{ heartbeat(); pulseTimer=setTimeout(beat,1500); }; beat(); } // ~40 bpm, calmo
  function stopPulse(){ if(pulseTimer){ clearTimeout(pulseTimer); pulseTimer=null; } }
  return {
    get enabled(){return enabled;},
    arm(on){ // chamado DENTRO do gesto do click de start
      enabled=on; localStorage.setItem('pulsar-som',on?'1':'0');
      if(on){ ensure(); bgmStart(); startPulse(); } else stopPulse();
      syncIcon();
    },
    toggle(){
      enabled=!enabled; localStorage.setItem('pulsar-som',enabled?'1':'0');
      if(enabled){ ensure(); bgmStart(); startPulse(); } else { bgmStop(); stopPulse(); }
      syncIcon();
    },
    hoverTick(){ // triangle 1900Hz/35ms, throttle 70ms
      const now=performance.now();
      if(now-lastTick<70) return; lastTick=now;
      osc('triangle',1900,null,.05,.035);
    },
    typeTick(){ osc('square',2300,null,.025,.02); },
    select(){ osc('sine',740,540,.12,.14); },
    sting(kind){ // entrada de seção
      if(!enabled||!ctx) return;
      if(kind==='works'){ osc('sine',220,880,.09,.5); osc('sine',330,1320,.05,.5); }
      else if(kind==='mission'){ osc('sine',110,110,.11,1.2); osc('sine',165,165,.07,1.2); }
    },
  };
  function syncIcon(){ $('#btn-sound').classList.toggle('is-on',enabled); }
})();

/* ---------- [C] SCROLL ENGINE ----------
   O truque central do gênero: o wheel não rola — ALIMENTA um alvo;
   um lerp no rAF persegue o alvo e escreve scrollTo(). O DOM continua
   nativo (âncoras, barra, touch funcionam); só a INÉRCIA é nossa.
   A velocidade (vel) vira matéria-prima de distorção no GL e nos títulos. */
const Scroll = (() => {
  let target=scrollY, current=scrollY, vel=0;
  const smooth = !NATIVE_SCROLL && !STATIC_MODE && matchMedia('(pointer:fine)').matches;
  const max = ()=>document.documentElement.scrollHeight-innerHeight;
  if(smooth){
    addEventListener('wheel',e=>{
      if(document.body.dataset.menu==='open'||document.body.dataset.modal==='open') return;
      e.preventDefault();
      target=clamp(target+e.deltaY,0,max());
    },{passive:false});
    // scroll por outro meio (barra, teclado, touch): adota a posição
    addEventListener('scroll',()=>{
      if(Math.abs(scrollY-Math.round(current))>2){ target=current=scrollY; }
    },{passive:true});
  }
  return {
    get y(){return smooth?current:scrollY;},
    get vel(){return vel;},
    get progress(){const m=max();return m?this.y/m:0;},
    to(el){
      const y=clamp(el.getBoundingClientRect().top+this.y,0,max());
      if(smooth){ target=y; } else el.scrollIntoView({behavior:'smooth'});
    },
    tick(dt){
      if(!smooth){ vel=lerp(vel,0,.1); return; }
      const prev=current;
      current=lerp(current,target,1-Math.pow(.0007,dt)); // fator-frame-independente
      if(Math.abs(current-target)<.3) current=target;
      vel=lerp(vel,current-prev,.35);
      if(Math.round(current)!==scrollY) scrollTo(0,current);
    },
  };
})();

/* ---------- [D] RAIL (indicador lateral de seções) ---------- */
const Rail = (() => {
  const secs = $$('.Sec[data-sec]');
  const railEl = $('#rail'); const rows=[];
  secs.forEach(sec=>{
    const row=document.createElement('div'); row.className='Rail__sec';
    const line=document.createElement('div'); line.className='Rail__line';
    const lab=document.createElement('div'); lab.className='Rail__label';
    lab.textContent=sec.dataset.sec; line.appendChild(lab); row.appendChild(line);
    const subs=[]; const n=+sec.dataset.subs||1;
    for(let i=0;i<n;i++){const s=document.createElement('div');s.className='Rail__sub';row.appendChild(s);subs.push(s);}
    row.addEventListener('click',()=>{ Scroll.to(sec); Som.select(); });
    railEl.appendChild(row); rows.push({sec,row,subs});
  });
  let cur='';
  return {
    update(){
      const mid=Scroll.y+innerHeight*.5;
      let active='';
      rows.forEach(({sec,row,subs})=>{
        const top=sec.offsetTop, h=sec.offsetHeight;
        const inSec=mid>=top&&mid<top+h;
        if(inSec) active=sec.dataset.sec;
        row.classList.toggle('is-active',inSec);
        const p=clamp((mid-top)/h,0,.999);
        subs.forEach((s,i)=>s.classList.toggle('is-active',inSec&&Math.floor(p*subs.length)===i));
      });
      // barramento único do gênero: uma escrita em body[data-section] dirige
      // tema claro, cor de header (via blend) e poderia trocar cena/som juntos
      if(active&&active!==cur){ cur=active; document.body.dataset.section=active; }
    },
    sections:secs,
  };
})();

/* ---------- SCRAMBLE (hover) ----------
   Réplica do ScrambleTextPlugin: revela o texto da esquerda pra direita
   trocando as letras ainda-não-fixas por glifos aleatórios. */
const Scramble = (() => {
  const CH='ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/0123456789';
  const rnd=s=>CH[Math.floor((Math.sin(s*99.13)*.5+.5)*CH.length)%CH.length];
  function run(el){
    const txt=el.dataset.scrambleText||(el.dataset.scrambleText=el.textContent);
    let f=0; const dur=txt.length+8;
    clearInterval(el._scr);
    el._scr=setInterval(()=>{
      f++;
      const reveal=Math.floor((f/dur)*txt.length);
      let out='';
      for(let i=0;i<txt.length;i++){
        out += i<reveal ? txt[i] : (txt[i]===' '?' ':rnd(f*7+i*13));
      }
      el.textContent=out;
      if(f>=dur){ el.textContent=txt; clearInterval(el._scr); }
    },26);
  }
  $$('[data-scramble]').forEach(el=>el.addEventListener('pointerenter',()=>run(el)));
  return {run};
})();

/* ---------- CHAR-SPLIT (títulos de works) ----------
   Réplica do SplitText: quebra em <span> por caractere e revela com
   stagger .012s (power4) na entrada — só 1×. */
const CharSplit = (() => {
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return; io.unobserve(e.target);
    const el=e.target, txt=el.textContent; el.textContent='';
    el.setAttribute('aria-label',txt); el.classList.add('is-split');
    [...txt].forEach((ch,i)=>{
      const s=document.createElement('span');
      s.className='char'; s.textContent=ch===' '?' ':ch; s.setAttribute('aria-hidden','true');
      s.style.transitionDelay=(i*.012)+'s';
      el.appendChild(s);
    });
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('is-in')));
  }),{threshold:.5});
  if(!STATIC_MODE) $$('[data-split]').forEach(el=>io.observe(el));
})();

/* ---------- [E] COREOGRAFIA: reveals, typing, stings, distort ---------- */
const Choreo = (() => {
  // reveal padrão: IO {threshold:.06}, dispara 1× e larga o elemento
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); }
  }),{threshold:.06});
  $$('[data-reveal]').forEach(el=>io.observe(el));

  // linhas de mission/vision: stagger manual por índice dentro do bloco
  const ioLines=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return;
    [...e.target.querySelectorAll('.MV__line')].forEach((l,i)=>setTimeout(()=>l.classList.add('is-in'),i*120));
    ioLines.unobserve(e.target);
  }),{threshold:.3});
  $$('.MV__text').forEach(el=>ioLines.observe(el));

  // labels "// works" digitados char a char na 1ª entrada (com tick)
  const ioType=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return; ioType.unobserve(e.target);
    const el=e.target, txt=el.textContent; el.textContent=''; el.classList.add('is-in');
    let i=0; (function step(){
      el.textContent=txt.slice(0,++i);
      if(i<txt.length){ Som.typeTick(); setTimeout(step,42+Math.random()*40); }
    })();
  }),{threshold:.5});
  if(!STATIC_MODE) $$('.Sec__label').forEach(el=>ioType.observe(el));

  // sting sonoro 1× na entrada de seções marcadas
  const heard=new Set();
  const ioSting=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting&&!heard.has(e.target)){ heard.add(e.target); Som.sting(e.target.dataset.sound); }
  }),{threshold:.35});
  $$('[data-sound]').forEach(el=>ioSting.observe(el));

  // títulos data-distort: skew proporcional à velocidade do scroll
  const distorts=$$('[data-distort]');
  return {
    update(){
      const v=clamp(Scroll.vel,-40,40);
      distorts.forEach(el=>{
        el.style.transform=`translateY(${(-v*.35).toFixed(1)}px) skewY(${(v*.06).toFixed(2)}deg)`;
      });
    },
    revealAll(){ $$('[data-reveal],.MV__line,.Sec__label,[data-split]').forEach(el=>el.classList.add('is-in')); },
  };
})();

/* ---------- [F] CAMADA GL — WebGL cru, 1 pass ----------
   Réplica conceitual da cena do alvo (objeto 3D + fundo vivo que
   reage a scroll/mouse), sem lib: esfera por ray-casting analítico
   no fragment shader + campo de partículas em 3 camadas de parallax
   + dither Bayer pra textura "crunchy". Meia resolução: é fundo. */
const GL = (() => {
  const canvas=$('#gl');
  const gl=canvas.getContext('webgl',{antialias:false,alpha:false});
  if(!gl) return {update(){},resize(){}};
  const VERT=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const FRAG=`
precision highp float;
uniform vec2 uRes;uniform float uTime;uniform float uScroll;
uniform float uVel;uniform vec2 uMouse;uniform float uMorph;uniform float uMorphVel;uniform float uHero;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
float stars(vec2 uv,float scale,float t){
  vec2 g=uv*scale;vec2 id=floor(g);vec2 f=fract(g)-.5;
  float h=hash(id);if(h<.92)return 0.;
  vec2 o=vec2(hash(id+7.),hash(id+13.))-.5;
  float d=length(f-o*.8);
  float tw=.6+.4*sin(t*(.5+h)+h*40.);
  return smoothstep(.06,.0,d)*tw;
}
// ===== WARP / HIPERESPAÇO: estrelas riscando radialmente do centro (só no hero, via uHero) =====
// ===== CENA COSMOS: pulsar sóbrio + ANÉIS DE PULSO concêntricos (motivo AG "pulso-anel") =====
vec3 sceneCosmos(vec2 uv){
  vec3 col=vec3(0.);
  // fundo vivo e interativo (sem blob de luz): parallax de mouse por camada + nebulosa respirando
  vec2 m1=uv+uMouse*.015, m2=uv+uMouse*.03, m3=uv+uMouse*.05;
  float fog=fbm(m1*2.2+vec2(uTime*.055,uScroll*3.));
  float neb=fbm(m1*1.05+vec2(-uTime*.028,uScroll*1.4+7.3));
  col+=vec3(.05,.045,.075)*fog+vec3(.11,.07,.19)*neb*neb*.8;
  col+=vec3(.55,.5,.72)*stars(m1+vec2(0.,uScroll*1.2),22.,uTime)*.5;
  col+=vec3(.5,.46,.66)*stars(m2+vec2(.3,uScroll*2.4),38.,uTime)*.32;
  col+=vec3(.45,.42,.6)*stars(m3+vec2(.7,uScroll*4.0),64.,uTime)*.2;
  // MALHA ondulante no topo (via uHero — esvai ao rolar): grade fina respirando,
  // centro limpo pro lockup. Minimalista: só linhas, baixa opacidade.
  vec2 gm=m1*7.0;
  gm.y+=sin(gm.x*1.35+uTime*.5)*.12;
  gm.x+=sin(gm.y*1.2-uTime*.4)*.10;
  vec2 gmf=abs(fract(gm)-.5);
  float mesh=smoothstep(.065,.05,min(gmf.x,gmf.y));
  float mmask=smoothstep(.24,.8,length(uv));
  col+=vec3(.30,.22,.52)*mesh*mmask*.16*uHero;
  return col;
}
// ===== CENA GRID/RADAR: mundo "achatado" de mission/vision (persp->orto via warp de uv, motivo pulso-piso) =====
vec3 sceneGrid(vec2 uv){
  float d=uv.y;
  vec2 persp=vec2(uv.x/(abs(d)+.18), 1./(abs(d)+.18));       // ponto de fuga
  vec2 g=mix(persp, uv*2.6, clamp(uMorph,0.,1.));            // uMorph: 0 perspectiva -> 1 top-down
  vec2 gf=abs(fract(g)-.5);
  float grid=smoothstep(.03,0.,min(gf.x,gf.y))/(1.+dot(g,g)*.04);
  vec3 col=vec3(.03,.028,.05)+vec3(.25,.11,.5)*grid*.7;      // linhas #401C7F
  float rr=length(g);
  col+=vec3(.44,.28,.91)*smoothstep(.05,0.,abs(fract(rr*.5-uTime*.12)))*.12; // anéis de radar
  col*=smoothstep(1.5,.15,length(uv));
  return col;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  uv.y+=uVel*.0012*sin(uv.x*6.+uTime);
  vec3 cosmos=sceneCosmos(uv);
  vec3 grid=sceneGrid(uv);
  // WIPE CURVO (técnica alche topSceneMixer): a fronteira varre de baixo p/ cima e ARQUEIA pela velocidade
  vec2 fuv=gl_FragCoord.xy/uRes;
  float bow=-cos((fuv.x-.5)*3.14159)*uMorphVel*2.2;          // meio adianta/atrasa vs bordas -> arco
  float edge=2./uRes.y+abs(uMorphVel)*.35;                   // borda BORRA com a velocidade (motion blur)
  float sel=smoothstep(0.,edge,-fuv.y+uMorph*(1.0+edge)+bow);
  vec3 col=mix(cosmos, grid, sel);
  col*=1.-.42*length(uv)*(1.-uMorph*.35);
  float bx=mod(gl_FragCoord.x,4.);float by=mod(gl_FragCoord.y,4.);
  col+=(mod(bx*4.+by*3.+bx*by,16.)/16.-.5)*.03;
  gl_FragColor=vec4(col,1.);
}`;
  function shader(type,src){
    const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog=gl.createProgram();
  gl.attachShader(prog,shader(gl.VERTEX_SHADER,VERT));
  gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(prog);gl.useProgram(prog);
  const buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(prog,'p');
  gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const U={};['uRes','uTime','uScroll','uVel','uMouse','uMorph','uMorphVel','uHero'].forEach(n=>U[n]=gl.getUniformLocation(prog,n));
  let mx=0,my=0,smx=0,smy=0,morph=0,morphV=0;
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=-(e.clientY/innerHeight*2-1);},{passive:true});
  function resize(){
    const dpr=Math.min(devicePixelRatio,2)*.66; // meia-res: é fundo
    const w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);
    if(!w||!h) return false; // viewport ainda não medido (tab oculto) — tenta no próximo frame
    if(canvas.width!==w||canvas.height!==h){
      canvas.width=w;canvas.height=h;
      gl.viewport(0,0,w,h);
    }
    return true;
  }
  resize();
  return {
    resize,
    update(t){
      if(!resize()) return; // auto-cura: dimensiona assim que o viewport existir
      smx=lerp(smx,mx,.05);smy=lerp(smy,my,.05);
      gl.uniform2f(U.uRes,canvas.width,canvas.height);
      gl.uniform1f(U.uTime,t/1000);
      gl.uniform1f(U.uScroll,Scroll.progress);
      gl.uniform1f(U.uVel,clamp(Scroll.vel,-60,60));
      gl.uniform2f(U.uMouse,smx,smy);
      const s=document.body.dataset.section;  // POV (alche): em mission/vision o cosmos "achata" p/ o grid/radar
      const target=(s==='missão'||s==='visão')?1:0;
      const M=target-morph; morph+=M*.05; morphV+=(M-morphV)*.05;  // 2 damps: morphV~velocidade -> arqueia+borra o wipe
      gl.uniform1f(U.uMorph,morph); gl.uniform1f(U.uMorphVel,morphV);
      gl.uniform1f(U.uHero,clamp(1-Scroll.y/(innerHeight*.75),0,1));  // malha do topo (esvai ao rolar)
      gl.drawArrays(gl.TRIANGLES,0,3);
    },
  };
})();

/* ---------- [G] CANVASES 2D: loading, thumbs, demos, outro ---------- */
// desenhos generativos por projeto — substituem thumbs/vídeos, zero asset
const Sketches = {
  finance(ctx,w,h,t){ // fluxo de linhas (fluxo de caixa)
    ctx.strokeStyle='rgba(155,135,182,.65)';ctx.lineWidth=1;
    for(let i=0;i<5;i++){ctx.beginPath();
      for(let x=0;x<=w;x+=6){
        const y=h*.5+Math.sin(x*.012+t*.001+i*1.3)*h*.16*(1+i*.18)+Math.sin(x*.05+i)*3;
        x?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }ctx.stroke();}
  },
  lider(ctx,w,h,t){ // ranking de barras vivo
    const n=7;for(let i=0;i<n;i++){
      const v=(Math.sin(t*.0012+i*2.1)*.5+.5)*.8+.15;
      ctx.fillStyle=i===2?'#7048E8':'rgba(155,135,182,.35)';
      ctx.fillRect(14+i*((w-28)/n),h*.86-v*h*.66,(w-28)/n*.62,v*h*.66);}
    ctx.fillStyle='rgba(155,135,182,.5)';ctx.fillRect(14,h*.86,w-28,1);
  },
  beto(ctx,w,h,t){ // scatter vendas × estoque
    for(let i=0;i<46;i++){
      const a=Math.sin(i*12.9898)*43758.5453,r=(a-Math.floor(a));
      const b=Math.sin(i*78.233)*12543.2,r2=(b-Math.floor(b));
      const puls=.5+.5*Math.sin(t*.002+i);
      ctx.fillStyle=`rgba(155,135,182,${.18+r2*.5*puls})`;
      ctx.beginPath();ctx.arc(w*.08+r*w*.84,h*.12+r2*h*.76,1.4+r*2.2,0,7);ctx.fill();}
  },
  rh(ctx,w,h,t){ // grade de pessoas pulsando
    const cols=10,rows=5;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const ph=Math.sin(t*.0016+x*.7+y*1.1)*.5+.5;
      ctx.fillStyle=`rgba(155,135,182,${.12+ph*.55})`;
      ctx.fillRect(w*.1+x*w*.08,h*.16+y*h*.15,w*.045,w*.045);}
  },
  hub(ctx,w,h,t){ // curva de XP subindo
    ctx.strokeStyle='#7048E8';ctx.lineWidth=1.4;ctx.beginPath();
    for(let x=0;x<=w;x+=5){
      const p=x/w,y=h*.85-Math.pow(p,1.7)*h*.6-Math.sin(p*22+t*.002)*4*p;
      x?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.stroke();
    ctx.setLineDash([2,5]);ctx.strokeStyle='rgba(155,135,182,.3)';
    ctx.beginPath();ctx.moveTo(0,h*.25);ctx.lineTo(w,h*.25);ctx.stroke();ctx.setLineDash([]);
  },
};

const Canvas2D = (() => {
  const items=[]; // {canvas,ctx,draw,visible}
  function reg(canvas,drawName){
    const ctx=canvas.getContext('2d');
    const it={canvas,ctx,draw:Sketches[drawName],visible:false};
    const io=new IntersectionObserver(es=>es.forEach(e=>it.visible=e.isIntersecting),{threshold:.05});
    io.observe(canvas);
    items.push(it);return it;
  }
  function size(it){
    const r=it.canvas.getBoundingClientRect();
    if(!r.width)return false;
    const dpr=Math.min(devicePixelRatio,2);
    if(it.canvas.width!==r.width*dpr){it.canvas.width=r.width*dpr;it.canvas.height=r.height*dpr;}
    return true;
  }
  return {
    reg,
    update(t){
      items.forEach(it=>{
        if(!it.visible||!it.draw)return;
        if(!size(it))return;
        const {ctx,canvas}=it,dpr=Math.min(devicePixelRatio,2);
        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.clearRect(0,0,canvas.width,canvas.height);
        it.draw.call(Sketches,ctx,canvas.width/dpr,canvas.height/dpr,t);
      });
    },
  };
})();

/* thumb flutuante dos works: segue o mouse com lerp, troca o sketch por item */
const WorksThumb = (() => {
  const fig=$('#works-thumb'), cap=$('#thumb-caption');
  const it=Canvas2D.reg($('#thumb-canvas'),null);
  it.visible=true;
  let tx=0,ty=0,x=0,y=0,on=false;
  $$('.Works__item').forEach(li=>{
    li.addEventListener('pointerenter',()=>{
      it.draw=Sketches[li.dataset.thumb];on=true;
      cap.textContent='// '+li.dataset.thumb;
      fig.classList.add('is-on');Som.hoverTick();
    });
    li.addEventListener('pointerleave',()=>{on=false;it.draw=null;fig.classList.remove('is-on');});
  });
  addEventListener('pointermove',e=>{tx=e.clientX+26;ty=e.clientY-120;},{passive:true});
  return {update(){
    if(!on&&!fig.classList.contains('is-on'))return;
    x=lerp(x,tx,.13);y=lerp(y,ty,.13);
    fig.style.transform=`translate(${Math.min(x,innerWidth-fig.offsetWidth-80)}px,${clamp(y,70,innerHeight-fig.offsetHeight-40)}px)`;
  }};
})();

/* outro: partículas formam "PULSAR" quando a seção entra */
const Outro = (() => {
  const canvas=$('#outro-canvas');if(!canvas)return{update(){}};
  const ctx=canvas.getContext('2d');
  let parts=null,formed=0,visible=false;
  function build(){
    const r=canvas.getBoundingClientRect();if(!r.width)return;
    const dpr=Math.min(devicePixelRatio,2);
    canvas.width=r.width*dpr;canvas.height=r.height*dpr;
    const off=document.createElement('canvas');
    off.width=r.width;off.height=r.height;
    const oc=off.getContext('2d');
    oc.fillStyle='#fff';oc.textAlign='center';oc.textBaseline='middle';
    oc.font=`700 ${Math.min(r.width/4.4,180)}px "Inter var","Inter","Segoe UI",system-ui,sans-serif`;
    oc.fillText('PULSAR',r.width/2,r.height/2);
    const img=oc.getImageData(0,0,off.width,off.height).data;
    parts=[];
    const gap=3;
    for(let y=0;y<off.height;y+=gap)for(let x=0;x<off.width;x+=gap){
      if(img[(y*off.width+x)*4+3]>128){
        parts.push({tx:x,ty:y,x:Math.random()*r.width,y:Math.random()*r.height,d:.6+Math.random()});
      }
    }
  }
  const io=new IntersectionObserver(es=>es.forEach(e=>{visible=e.isIntersecting;if(visible&&!parts)build();}),{threshold:.2});
  io.observe(canvas);
  addEventListener('resize',()=>{parts=null;formed=0;});
  return {update(){
    if(!visible||!parts)return;
    formed=lerp(formed,1,.03); // forma 1× e assenta — repouso é parado
    const dpr=Math.min(devicePixelRatio,2);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#7048E8';
    parts.forEach(p=>{
      p.x=lerp(p.x,p.tx,.04*p.d*formed+.002);
      p.y=lerp(p.y,p.ty,.04*p.d*formed+.002);
      ctx.fillRect(p.x,p.y,1.5,1.5);
    });
  }};
})();

/* loading bg: grade de pontos com brilho por noise */
const LoadingBG = (() => {
  const canvas=$('#loading-bg'),ctx=canvas.getContext('2d');
  return {update(t){
    if($('#loading').classList.contains('is-done'))return;
    const dpr=Math.min(devicePixelRatio,2);
    if(canvas.width!==innerWidth*dpr){canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const g=34;
    for(let y=g/2;y<innerHeight;y+=g)for(let x=g/2;x<innerWidth;x+=g){
      const a=Math.sin(x*.02+t*.0008)*Math.cos(y*.017-t*.0006);
      ctx.fillStyle=`rgba(255,255,255,${Math.max(0,a)*.16})`;
      ctx.fillRect(x,y,1.5,1.5);
    }
  }};
})();

/* ---------- SHOWCASE: dolly 3D por telas Pulsar (POV travel dirigido por scroll) ---------- */
const Showcase = (() => {
  const sec=$('#showcase'); if(!sec) return {update(){},apply(){}};
  const stage=$('#showcase-stage');
  const screens=$$('#showcase-stage .Screen');
  const dots=$$('#showcase-hud .Showcase__dots i');
  const cap=$('#showcase-cap');
  const N=screens.length, GAP=780;                 // = o -780px do --i no CSS
  const titles=screens.map(s=>s.dataset.cap||'');
  const phrases=screens.map(s=>s.dataset.phrase||'');
  const ph=$('#showcase-phrase'); let lastF=-1;
  let visible=false;
  new IntersectionObserver(es=>es.forEach(e=>visible=e.isIntersecting),{threshold:0}).observe(sec);
  function apply(p){
    const travel=(p*N-0.5)*GAP;                     // câmera anda de antes da tela 0 até logo após a última
    stage.style.transform=`translateZ(${travel.toFixed(1)}px)`;
    let focus=0,best=1e9;
    screens.forEach((s,i)=>{
      const z=-i*GAP+travel;                         // z efetivo (0 = plano da câmera = foco)
      const ad=Math.abs(z);
      const op = z>150 ? clamp(1-(z-150)/420,0,1)    // passou a câmera -> some
                       : clamp(1-ad/(GAP*2.6),.04,1);// longe atrás -> escurece
      s.style.opacity=op.toFixed(3);
      s.style.filter = z>150 ? 'blur(4px)' : 'none';
      s.style.zIndex = String(1000-Math.round(ad));  // o mais próximo por cima
      if(ad<best){best=ad;focus=i;}
    });
    dots.forEach((d,i)=>d.classList.toggle('on',i===focus));
    if(cap) cap.textContent=titles[focus];
    if(ph && focus!==lastF){ lastF=focus;                  // a frase-diferencial acompanha o foco
      ph.textContent=phrases[focus];
      ph.classList.toggle('is-grad', focus%2===1);         // alterna branco/roxo
      ph.classList.remove('is-in'); void ph.offsetWidth; ph.classList.add('is-in');
    }
  }
  return { apply, update(){
    if(!visible) return;
    const p=clamp((Scroll.y-sec.offsetTop)/Math.max(1,sec.offsetHeight-innerHeight),0,1);
    apply(p);
  }};
})();

/* ---------- RIBBON: coverflow 3D lateral dos serviços (POV curvado) ---------- */
const Ribbon = (() => {
  const sec=$('#service'); if(!sec) return {update(){},apply(){}};
  const cards=$$('#ribbon .Svc');
  const dots=$$('#ribbon-hud .Ribbon__dots i');
  const cap=$('#ribbon-cap');
  const names=cards.map(c=>c.dataset.svc);
  const N=cards.length, SPREAD=54*Math.PI/180, R=690;   // curva mais aberta (mais "fita")
  let visible=false, cur=0;                              // cur = posição amortecida (buttery, tipo alche)
  new IntersectionObserver(es=>es.forEach(e=>visible=e.isIntersecting),{threshold:0}).observe(sec);
  function place(active){
    const focus=Math.round(active);
    cards.forEach((c,i)=>{
      const off=i-active, th=off*SPREAD, ad=Math.abs(off);
      const x=Math.sin(th)*R;
      const z=(Math.cos(th)-1)*R - ad*80;                // laterais recuam MUITO mais
      const dip=(1-Math.cos(th))*100;                    // onda: centro no topo, laterais descem (fita curva)
      const ry=-off*40;
      const sc=1-Math.min(ad,1.6)*0.24;                  // centro DOMINA (laterais ~.6)
      const op=clamp(1-ad*0.64,0,1);                     // laterais somem bem mais
      c.style.transform=`translate(-50%,-50%) translateX(${x.toFixed(1)}px) translateY(${dip.toFixed(1)}px) translateZ(${z.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
      c.style.opacity=op.toFixed(3);
      c.style.zIndex=String(100-Math.round(ad*10));
      c.style.filter = ad>0.45 ? `blur(${Math.min(ad*3.0,7).toFixed(1)}px)` : 'none';  // desfoque cresce com a distância
      c.classList.toggle('is-focus', i===focus && ad<0.5);
    });
    dots.forEach((d,i)=>d.classList.toggle('on',i===focus));
    if(cap) cap.textContent=names[focus];
  }
  return {
    apply(p){ cur=p*(N-1); place(cur); },               // estado direto (static)
    update(){
      if(!visible) return;
      const p=clamp((Scroll.y-sec.offsetTop)/Math.max(1,sec.offsetHeight-innerHeight),0,1);
      cur=lerp(cur, p*(N-1), .12);                       // damping exponencial -> desliza suave
      place(cur);
    }
  };
})();

/* ---------- SAIBA MAIS: pop-up por setor — benefícios, nunca método ---------- */
(function SaibaMais(){
  const modal=$('#modal'), card=$('#modal-card'); if(!modal) return;
  const M={
    rh:{i:'01 / ecossistema', t:'Pulsar-RH', s:'Gestão de pessoas viva — para o RH e para o dono.',
      v:['Clima medido de verdade — pesquisa anônima em que a equipe confia',
         'Rotinas sem papelada: ponto, férias e escala num portal só',
         'Desenvolvimento visível: cada pessoa sabe onde está e aonde chega',
         'Decisão de gente com número na mesa — não com achismo'],
      b:['Aplicação em 1 semana','Treinamento da equipe incluído','Dados 100% seus']},
    finance:{i:'02 / ecossistema', t:'Pulsar Finance', s:'O financeiro em tempo real — não o retrato do mês passado.',
      v:['O caixa de hoje na tela — decisão com o número vivo',
         'Fechamento no prazo, todo mês, sem correria',
         'Previsibilidade: surpresa de caixa deixa de existir',
         'Do número-mestre ao detalhe do lançamento em dois cliques'],
      b:['Aplicação em 1 semana','Acompanhamento próximo da AG','Dados 100% seus']},
    custom:{i:'sob medida', t:'Custom', s:'A plataforma com a sua marca, no seu objetivo.',
      v:['Identidade própria — o produto leva o nome da sua empresa',
         'Telas e regras moldadas ao seu processo, não o contrário',
         'Integrações escolhidas por você — entra só o que serve',
         'Construído de trás pra frente a partir da sua meta'],
      dev:'<b>Desenvolvimento incluído:</b> conversa e escopo &rarr; construção sob medida com acompanhamento de perto &rarr; aplicação e ajuste fino junto com o seu time.',
      b:['Escopo acertado em conversa','Desenvolvimento incluído','Aplicação acompanhada']},
  };
  function abrir(k){
    const m=M[k]; if(!m) return;
    card.innerHTML='<button class="Modal__x" aria-label="fechar">&times;</button>'
      +'<div class="Modal__idx">'+m.i+'</div><h3 class="Modal__t">'+m.t+'</h3>'
      +'<p class="Modal__s">'+m.s+'</p>'
      +'<ul class="Modal__ul">'+m.v.map(x=>'<li>'+x+'</li>').join('')+'</ul>'
      +(m.dev?'<div class="Modal__dev">'+m.dev+'</div>':'')
      +'<div class="Modal__badges">'+m.b.map((x,i)=>'<span class="Modal__badge'+(i===0?' Modal__badge--hero':'')+'">'+x+'</span>').join('')+'</div>'
      +'<button class="Modal__cta" data-goto="#contact">Entrar em contato <span>&rarr;</span></button>';
    document.body.dataset.modal='open'; Som.select();
  }
  const fechar=()=>{ document.body.dataset.modal=''; };
  document.addEventListener('click', e=>{
    const btn=e.target.closest('button[data-modal]');  // button: senão o body (data-modal="open") engole o clique
    if(btn){ abrir(btn.dataset.modal); return; }
    if(e.target.closest('.Modal__x')||e.target.id==='modal-backdrop'){ fechar(); Som.select(); return; }
    const go=e.target.closest('[data-goto]');
    if(go){ fechar(); const el=$(go.dataset.goto); if(el){ Scroll.to(el); Som.select(); } }
  });
})();

/* ---------- MOCK DEMO: cards interativos — abas, tema, período e DRILL direto ---------- */
(function MockDemo(){
  const ribbon=$('#ribbon'); if(!ribbon) return;
  ribbon.addEventListener('click', e=>{
    const tab=e.target.closest('.mk-tab[data-mktab]');
    if(tab){
      const scr=tab.closest('.Svc__screen');
      scr.querySelectorAll('.mk-tab[data-mktab]').forEach(t=>t.classList.toggle('on',t===tab));
      scr.querySelectorAll('.mk-body').forEach(b=>b.classList.toggle('on',b.dataset.body===tab.dataset.mktab));
      scr.querySelectorAll('.dm-drill').forEach(d=>d.classList.remove('on'));
      Som.select(); return;
    }
    const dot=e.target.closest('.mk-dot');
    if(dot){
      const scr=dot.closest('.Svc__screen');
      scr.dataset.mktheme=dot.dataset.theme;
      scr.querySelectorAll('.mk-dot').forEach(d=>d.classList.toggle('on',d===dot));
      Som.select(); return;
    }
    const per=e.target.closest('.mk-per[data-per]');   // ANTES do drill: o período mora dentro do KPI clicável
    if(per){
      const body=per.closest('.mk-body');
      body.querySelectorAll('.mk-per').forEach(x=>x.classList.toggle('on',x===per));
      body.querySelectorAll('[data-jul]').forEach(el=>{
        el.classList.remove('mk-swap'); void el.offsetWidth;
        el.textContent=el.dataset[per.dataset.per]; el.classList.add('mk-swap');
      });
      Som.select(); return;
    }
    if(e.target.closest('.dm-back')){
      e.target.closest('.Svc__screen').querySelectorAll('.dm-drill').forEach(d=>d.classList.remove('on'));
      Som.select(); return;
    }
    const drill=e.target.closest('[data-drill]');
    if(drill){
      const scr=drill.closest('.Svc__screen');
      const alvo=scr.querySelector('.dm-drill[data-drill-panel="'+drill.dataset.drill+'"]');
      if(alvo){ scr.querySelectorAll('.dm-drill').forEach(d=>d.classList.remove('on')); alvo.classList.add('on'); Som.select(); }
    }
  });
})();

/* ---------- BOOT + LOOP ÚNICO ---------- */
(function boot(){
  const loading=$('#loading');
  const enter=()=>{ loading.classList.add('is-done'); document.body.dataset.started='1'; };
  if(STATIC_MODE){
    document.documentElement.dataset.static='1';  // liga o kill-switch CSS
    enter(); Choreo.revealAll();
  } else {
    const pct=$('#load-pct'),bar=$('#load-bar');
    const t0=performance.now(),DUR=1800;
    // progresso via setTimeout (não rAF): completa mesmo com a aba em background
    (function prog(){
      const p=clamp((performance.now()-t0)/DUR,0,1);
      const eased=1-Math.pow(1-p,3);
      if(pct) pct.textContent=Math.round(eased*100);
      if(bar) bar.style.width=(eased*100)+'%';
      if(p<1){ setTimeout(prog,16); }
      else { loading.classList.add('is-ready'); setTimeout(enter,650); } // sai sozinho, como o alvo
    })();
    // Não há "click to start": o 1º gesto só ARMA o som se ele já estava ligado
    // (autoplay policy exige gesto). Som off por padrão liga só pelo toggle.
    const arm=()=>{ if(Som.enabled) Som.arm(true); removeEventListener('pointerdown',arm); removeEventListener('wheel',arm); removeEventListener('keydown',arm); };
    addEventListener('pointerdown',arm); addEventListener('wheel',arm,{passive:true}); addEventListener('keydown',arm);
  }

  // header / menu
  $('#btn-sound').classList.toggle('is-on',Som.enabled);
  $('#btn-sound').addEventListener('click',()=>Som.toggle());
  $('#btn-menu').addEventListener('click',()=>{const open=document.body.dataset.menu!=='open';document.body.dataset.menu=open?'open':'';$('#btn-menu').setAttribute('aria-expanded',String(open));Som.select();});
  $('#menu-backdrop').addEventListener('click',()=>document.body.dataset.menu='');
  addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.dataset.menu='';document.body.dataset.modal='';}});

  // âncoras passam pelo scroll engine (senão o smooth wheel briga com o jump)
  $$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const el=$(a.getAttribute('href'));if(!el)return;
    e.preventDefault();document.body.dataset.menu='';
    Scroll.to(el);Som.select();
  }));

  // tick de hover nos interativos
  $$('a,button').forEach(el=>el.addEventListener('pointerenter',()=>Som.hoverTick()));

  addEventListener('resize',()=>GL.resize());

  // UM rAF só — cada módulo recebe o mesmo relógio
  let last=performance.now();
  (function loop(t){
    const dt=Math.min((t-last)/1000,.05);last=t;
    Scroll.tick(dt);
    if(!STATIC_MODE){
      GL.update(t);
      Choreo.update();
      Canvas2D.update(t);
      WorksThumb.update();
      Outro.update();
      LoadingBG.update(t);
      Showcase.update();
      Ribbon.update();
    }
    Rail.update();
    requestAnimationFrame(loop);
  })(last);
  if(STATIC_MODE){ GL.update(performance.now()); Showcase.apply(.12); Ribbon.apply(0); } // 1 frame estático + 1ª tela em foco
})();
