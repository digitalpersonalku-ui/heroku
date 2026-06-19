// ═══════════════════════════════════════════════════════════
// HEROKU WORLD ALIVE v2.0
// File: js/world-alive-v2.js
//
// Pasang di index.html — setelah bridge.js:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
//   <script src="js/world-alive-v2.js"></script>
//
// API Publik:
//   WA.startIdle()                  — mulai animasi idle mobil
//   WA.stopIdle()                   — hentikan idle
//   WA.moveCar(toIdx, cb)           — gerakkan mobil ke waypoint
//   WA.setTarget(bldIdx)            — glow bangunan target
//   WA.burst(x, y, n, types)        — partikel di koordinat SVG
//   WA.unlockBuilding(bldIdx)       — animasi bangunan terbuka
//   WA.configure(opts)              — kustomisasi ID elemen & waypoints
// ═══════════════════════════════════════════════════════════

(function(W){
'use strict';

// ─── CSS ──────────────────────────────────────────────────
function injectCSS(){
  if(document.getElementById('_wa2_css')) return;
  const s = document.createElement('style');
  s.id = '_wa2_css';
  s.textContent = `
.wa-crown{transform-origin:50% 100%;
  animation:waCrown var(--spd,3.2s) ease-in-out infinite alternate var(--del,0s)}
@keyframes waCrown{
  0%  {transform:rotate(var(--r1,-4deg)) scaleX(1)}
  100%{transform:rotate(var(--r2,3deg))  scaleX(var(--sx,1.03))}}
.wa-crown.wa-windy{animation-duration:.65s!important}

.wa-cloud{animation:waCloud var(--cd,36s) linear infinite var(--co,0s);will-change:transform}
@keyframes waCloud{
  from{transform:translateX(var(--cs,-140px))}
  to  {transform:translateX(var(--ce,820px))}}
.wa-cloud.wa-fast{animation-duration:5s!important}

.wa-bld-target{animation:waBldGlow 1.3s ease-in-out infinite alternate}
@keyframes waBldGlow{
  0%  {filter:drop-shadow(0 0 3px rgba(255,215,0,.3))}
  100%{filter:drop-shadow(0 0 20px rgba(255,215,0,1)) drop-shadow(0 0 40px rgba(255,160,0,.6))}}

.wa-smoke{animation:waSmoke var(--sd,2.5s) ease-out infinite var(--sdl,0s);transform-origin:50% 100%}
@keyframes waSmoke{
  0%  {opacity:.6;transform:translateY(0)  scale(.7)}
  60% {opacity:.25;transform:translateY(-18px) scale(1.2) translateX(var(--cx,4px))}
  100%{opacity:0;  transform:translateY(-34px) scale(1.6) translateX(var(--cx2,9px))}}

.wa-sparkle{animation:waSpk var(--sd,1.8s) ease-in-out infinite var(--sdl,0s)}
@keyframes waSpk{
  0%,100%{opacity:.15;transform:scale(.7) rotate(0)}
  50%    {opacity:1;  transform:scale(1.3) rotate(180deg)}}

.wa-ping{animation:waPing 2s ease-out infinite}
@keyframes waPing{
  0%{transform:scale(0);opacity:.9}
  80%,100%{transform:scale(2.6);opacity:0}}
  `;
  document.head.appendChild(s);
}

// ─── SVG UTIL ─────────────────────────────────────────────
const NS = 'http://www.w3.org/2000/svg';
function se(tag, attrs){
  const el=document.createElementNS(NS,tag);
  for(const[k,v] of Object.entries(attrs||{})) el.setAttribute(k,v);
  return el;
}

// ─── AUDIO ────────────────────────────────────────────────
let _ac=null;
function gac(){ if(!_ac)try{_ac=new(W.AudioContext||W.webkitAudioContext)();}catch(e){} return _ac; }
function ra(){ const c=gac(); if(c&&c.state==='suspended') c.resume(); }
function nt(f,tp,pk,at,su,rl,st){
  const c=gac(); if(!c) return; ra();
  const o=c.createOscillator(), g=c.createGain();
  o.type=tp||'sine'; o.frequency.value=f;
  const t=st||c.currentTime;
  g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(pk,t+at);
  g.gain.setValueAtTime(pk,t+at+su);
  g.gain.linearRampToValueAtTime(0,t+at+su+rl);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t+at+su+rl+.05);
}
const SFX={
  whoosh(){ nt(300,'sawtooth',.04,.01,.06,.18); },
  arrive(){ [523,659,784].forEach((f,i)=>nt(f,'sine',.12,.01,.06,.1,i*.12)); },
  unlock(){ [392,494,587,784,1047].forEach((f,i)=>nt(f,'triangle',.15,.01,.06,.09,i*.11)); },
};
['click','touchstart'].forEach(ev=>
  document.addEventListener(ev,()=>{try{gac();}catch(e){}},{once:true,passive:true})
);

// ─── CONFIG ───────────────────────────────────────────────
// Sesuaikan dengan ID elemen SVG di HeroKu yang sebenarnya
const CFG = {
  carId:      'world-car',       // <g id="world-car" ...>
  wheelLId:   'world-wl',        // <circle id="world-wl" ...>
  wheelRId:   'world-wr',        // <circle id="world-wr" ...>
  shadowId:   'world-car-sh',    // <ellipse id="world-car-sh" ...>
  fxId:       'world-fx',        // <g id="world-fx"> untuk partikel
  fx2Id:      'world-fx2',       // <g id="world-fx2"> untuk unlock
  bldPrefix:  'world-bld',       // bangunan: "world-bld0","world-bld1",...
  wpPrefix:   'world-wp',        // waypoint dots: "world-wp0",...
  treeClass:  'wa-crown',        // class pada mahkota pohon SVG
  cloudClass: 'wa-cloud',        // class pada grup awan SVG
  bldNames:   ['Rumah','Sekolah','Masjid','Taman','Istana'],
  // Waypoints — koordinat SVG di atas jalan
  // SESUAIKAN dengan posisi jalan di SVG HeroKu kamu!
  waypoints:[
    {x:55,  y:374},
    {x:200, y:308},
    {x:385, y:284},
    {x:526, y:300},
    {x:650, y:368},
  ],
};

// ─── STATE ────────────────────────────────────────────────
let carIdx   = 0;
let moving   = false;
let idleTl   = null;
let wheelTl  = null;
let _exhaustInt = null;

function G(){ return typeof gsap !== 'undefined'; }
function el(id){ return document.getElementById(id); }
function pfx(id){ return el(CFG.fxId) || el('world-fx') || null; }
function pfx2(){  return el(CFG.fx2Id)|| el('world-fx2')|| pfx(); }
function car(){   return el(CFG.carId); }
function wl(){    return el(CFG.wheelLId); }
function wr(){    return el(CFG.wheelRId); }
function sh(){    return el(CFG.shadowId); }

// ─── UPDATE MILESTONE DOTS ────────────────────────────────
function updateDots(){
  CFG.waypoints.forEach((_,i)=>{
    const d=el(CFG.wpPrefix+i); if(!d) return;
    if(i<carIdx){
      d.setAttribute('fill','#2ECC71'); d.setAttribute('opacity','1');
    }else if(i===carIdx){
      d.setAttribute('fill','#F1C40F'); d.setAttribute('opacity','1');
    }else{
      d.setAttribute('fill','#95A5A6'); d.setAttribute('opacity','.6');
    }
  });
}

// ─── PUBLIC API ───────────────────────────────────────────
const WA = {};

// ── 1. IDLE ───────────────────────────────────────────────
WA.startIdle = function(){
  if(idleTl||!G()) return;
  const c=car(); if(!c) return;
  idleTl=gsap.timeline({repeat:-1,yoyo:true})
    .to(c,{y:-3.5,duration:1.5,ease:'sine.inOut'});
  const w=wl(), r=wr();
  if(w&&r) wheelTl=gsap.to([w,r],{rotation:360,transformOrigin:'50% 50%',duration:3.8,ease:'none',repeat:-1});
  const s=sh();
  if(s) gsap.to(s,{attr:{rx:20,ry:5},duration:1.5,ease:'sine.inOut',yoyo:true,repeat:-1});
};

WA.stopIdle = function(){
  if(idleTl){idleTl.kill();idleTl=null;}
  if(wheelTl){wheelTl.kill();wheelTl=null;}
  const s=sh(); if(s){gsap.killTweensOf(s);gsap.set(s,{attr:{rx:23,ry:6}});}
};

// ── 2. MOBIL BERGERAK ─────────────────────────────────────
WA.moveCar = function(toIdx, onDone){
  if(moving||toIdx>=CFG.waypoints.length||!G()) return;
  const c=car(); if(!c) return;
  const w=wl(), r=wr();
  moving=true;
  WA.stopIdle();

  const from=CFG.waypoints[carIdx], to=CFG.waypoints[toIdx];
  const dist=Math.hypot(to.x-from.x,to.y-from.y);
  const dur=dist/95;

  if(w&&r) wheelTl=gsap.to([w,r],{rotation:360,transformOrigin:'50% 50%',duration:.55,ease:'none',repeat:Math.ceil(dur/.55)});

  // Asap knalpot
  _exhaustInt=setInterval(()=>{
    const fg=pfx(); if(!fg) return;
    const wp=CFG.waypoints[carIdx];
    const smk=se('ellipse',{
      cx:wp.x-26+(Math.random()*6-3), cy:wp.y-18+(Math.random()*4-2),
      rx:4+Math.random()*3, ry:3+Math.random()*2, fill:'rgba(190,190,190,.55)',
    });
    fg.appendChild(smk);
    gsap.to(smk,{
      attr:{cx:`+=${Math.random()*14-7}`,cy:`-=${22+Math.random()*14}`,rx:9+Math.random()*5,ry:7+Math.random()*4},
      opacity:0,duration:.85+Math.random()*.4,ease:'power1.out',onComplete:()=>smk.remove(),
    });
  },230);

  gsap.timeline({onComplete(){
    clearInterval(_exhaustInt);
    carIdx=toIdx; moving=false;
    if(wheelTl){wheelTl.kill();wheelTl=null;}
    WA.startIdle(); updateDots(); SFX.arrive();
    if(onDone) onDone(toIdx);
  }})
  .to(c,{attr:{transform:`translate(${to.x-22},${to.y-34})`},duration:dur,ease:'power2.inOut'})
  .to(c,{y:'-=3.5',duration:.2,ease:'sine.inOut',yoyo:true,repeat:Math.ceil(dur/.4)},0);

  SFX.whoosh();
};

// ── 3. POHON (CSS class, tidak perlu JS) ──────────────────
// Tambahkan class "wa-crown" pada elemen mahkota pohon di SVG
// Angin kencang: document.querySelectorAll('.wa-crown').forEach(t=>t.classList.add('wa-windy'))

// ── 4. AWAN (CSS class, tidak perlu JS) ───────────────────
// Tambahkan class "wa-cloud" pada grup awan di SVG
// Speed up: document.querySelectorAll('.wa-cloud').forEach(c=>c.classList.add('wa-fast'))

// ── 5. TARGET GLOW ────────────────────────────────────────
WA.setTarget = function(idx){
  for(let i=0;i<10;i++){
    const b=el(CFG.bldPrefix+i); if(b) b.classList.remove('wa-bld-target');
  }
  if(idx<0) return;
  const b=el(CFG.bldPrefix+idx); if(!b||!G()) return;
  b.classList.add('wa-bld-target');
  const fg=pfx(), wp=CFG.waypoints[idx];
  if(!fg) return;
  for(let i=0;i<3;i++){
    setTimeout(()=>{
      const ring=se('circle',{cx:wp.x,cy:wp.y,r:9,fill:'none',stroke:'#F1C40F','stroke-width':2.5,opacity:.9});
      fg.appendChild(ring);
      gsap.to(ring,{attr:{r:32},opacity:0,duration:1.1,ease:'power2.out',onComplete:()=>ring.remove()});
    },i*280);
  }
};

// ── 6. PARTIKEL ───────────────────────────────────────────
function _star(fg,x,y){
  const chars=['✦','✧','⭐','★','✨'];
  const el2=se('text',{x,y,'text-anchor':'middle','font-size':10+Math.random()*9,fill:'#F1C40F',opacity:1});
  el2.textContent=chars[Math.floor(Math.random()*chars.length)];
  fg.appendChild(el2);
  gsap.fromTo(el2,{attr:{y},opacity:1,scale:0},{attr:{y:y-55-Math.random()*30,x:x+(Math.random()*34-17)},opacity:0,scale:1.4,duration:.95+Math.random()*.45,ease:'power2.out',onComplete:()=>el2.remove()});
}
function _dot(fg,x,y){
  const cols=['#F1C40F','#E74C3C','#2ECC71','#3498DB','#9B59B6','#E67E22','#FF69B4'];
  const c=se('circle',{cx:x+(Math.random()*14-7),cy:y+(Math.random()*8-4),r:3+Math.random()*5,fill:cols[Math.floor(Math.random()*cols.length)],opacity:.9});
  fg.appendChild(c);
  const a=Math.random()*Math.PI*2,d=45+Math.random()*65;
  gsap.to(c,{attr:{cx:x+Math.cos(a)*d,cy:y+Math.sin(a)*d,r:.4},opacity:0,duration:.65+Math.random()*.45,ease:'power2.out',onComplete:()=>c.remove()});
}
function _rect(fg,x,y){
  const cols=['#F1C40F','#E74C3C','#2ECC71','#3498DB','#9B59B6','#E67E22','#FF69B4'];
  const r=se('rect',{x:x+(Math.random()*12-6),y,width:6+Math.random()*6,height:4+Math.random()*3,fill:cols[Math.floor(Math.random()*cols.length)],rx:1,opacity:1,transform:`rotate(${Math.random()*360} ${x} ${y})`});
  fg.appendChild(r);
  const a=Math.random()*Math.PI*2,d=55+Math.random()*75;
  gsap.to(r,{attr:{x:x+Math.cos(a)*d,y:y+Math.sin(a)*d},rotation:360+Math.random()*360,transformOrigin:`${x}px ${y}px`,opacity:0,duration:.8+Math.random()*.55,ease:'power2.out',onComplete:()=>r.remove()});
}

WA.burst = function(x,y,n,types){
  if(!G()) return;
  const fg=pfx(); if(!fg) return;
  types=types||['star','dot','rect'];
  const fns={star:(a,b)=>_star(fg,a,b),dot:(a,b)=>_dot(fg,a,b),rect:(a,b)=>_rect(fg,a,b)};
  for(let i=0;i<(n||12);i++){
    const t=types[Math.floor(Math.random()*types.length)];
    setTimeout(()=>fns[t]&&fns[t](x,y),i*22);
  }
};

// ── 7. UNLOCK BUILDING ────────────────────────────────────
WA.unlockBuilding = function(idx){
  if(!G()) return;
  const bld=el(CFG.bldPrefix+idx); if(!bld) return;
  const wp=CFG.waypoints[idx];
  const fg=pfx(), fg2=pfx2();

  bld.classList.remove('wa-bld-target');

  // Shake + scale punch
  gsap.timeline()
    .to(bld,{scale:1.18,duration:.14,ease:'power2.out',transformOrigin:'50% 100%'})
    .to(bld,{scale:.92, duration:.12,ease:'power2.in'})
    .to(bld,{scale:1.07,duration:.1, ease:'power2.out'})
    .to(bld,{scale:1,   duration:.14,ease:'power2.in'});

  // Flash brightness
  gsap.to(bld,{filter:'brightness(1.6)',duration:.18,yoyo:true,repeat:6,onComplete:()=>bld.style.filter=''});

  // Ring burst
  if(fg2){
    ['#F1C40F','#FFD700','#FFA500'].forEach((stroke,i)=>{
      setTimeout(()=>{
        const ring=se('circle',{cx:wp.x,cy:wp.y-35,r:12,fill:'none',stroke,'stroke-width':3-i*.6,opacity:.95});
        fg2.appendChild(ring);
        gsap.to(ring,{attr:{r:90+i*22},opacity:0,duration:.72+i*.14,ease:'power2.out',onComplete:()=>ring.remove()});
      },i*130);
    });
    // XP label
    setTimeout(()=>{
      const xp=se('text',{x:wp.x,y:wp.y-110,'text-anchor':'middle','font-size':16,'font-weight':'bold',fill:'#F1C40F',opacity:0});
      xp.textContent='+100 XP!';
      fg2.appendChild(xp);
      gsap.fromTo(xp,{attr:{y:wp.y-90},opacity:0,scale:.5},{attr:{y:wp.y-130},opacity:1,scale:1,duration:.5,ease:'back.out(2)',
        onComplete:()=>gsap.to(xp,{opacity:0,delay:.9,duration:.4,onComplete:()=>xp.remove()})});
    },300);
    // Koin
    for(let i=0;i<6;i++){
      setTimeout(()=>{
        const c=se('text',{x:wp.x+(i*16-38),y:wp.y-20,'text-anchor':'middle','font-size':15,opacity:1});
        c.textContent='⭐'; fg2.appendChild(c);
        gsap.to(c,{attr:{y:wp.y-96,x:wp.x+(i*16-38)+(Math.random()*22-11)},opacity:0,scale:1.5,duration:1.3,ease:'power2.out',onComplete:()=>c.remove()});
      },i*75);
    }
  }

  // Partikel
  WA.burst(wp.x,wp.y-30,20,['star']);
  setTimeout(()=>WA.burst(wp.x,wp.y-30,18,['rect']),180);
  setTimeout(()=>WA.burst(wp.x,wp.y-30,16,['dot']),340);

  SFX.unlock();
  if(navigator.vibrate) navigator.vibrate([30,15,30,15,60]);
};

// ── CONFIGURE ─────────────────────────────────────────────
WA.configure = function(opts){ Object.assign(CFG,opts||{}); };

W.WA = WA;

// ─── AUTO-INTEGRASI KE HEROKU ────────────────────────────
function waitApp(cb,n){
  n=n||0; if(n>120) return;
  if(typeof STORE!=='undefined'&&STORE.students) cb();
  else setTimeout(()=>waitApp(cb,n+1),100);
}

function boot(){
  injectCSS();
  waitApp(()=>{

    // Patch switchPage → idle mobil saat halaman dunia aktif
    if(typeof W.switchPage==='function'){
      const _o=W.switchPage;
      W.switchPage=function(page){
        _o.call(this,page);
        if(['dunia','world','desa'].includes(page)){
          setTimeout(()=>{WA.startIdle(); updateDots();},350);
        } else {
          WA.stopIdle();
        }
      };
    }

    // Patch showBuildingUnlock
    if(typeof W.showBuildingUnlock==='function'){
      const _o=W.showBuildingUnlock;
      W.showBuildingUnlock=function(bld,then){
        _o.call(this,bld,then);
        const idx=bld?.index??bld?.i??0;
        setTimeout(()=>WA.unlockBuilding(idx),180);
      };
    }

    // Patch renderWorldProgress → update target & dots
    if(typeof W.renderWorldProgress==='function'){
      const _o=W.renderWorldProgress;
      W.renderWorldProgress=function(student){
        _o.call(this,student);
        setTimeout(()=>{
          WA.startIdle();
          const prog=student?.totalDays||0;
          const next=Math.min(Math.floor(prog/7),4);
          WA.setTarget(next);
          updateDots();
        },300);
      };
    }

    console.log('[WA v2] World Alive siap ✅');
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();

})(window);
