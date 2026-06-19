// ═══════════════════════════════════════════════════════════
// HEROKU WORLD ALIVE v1.0
// File: js/world-alive.js
//
// PASANG di index.html setelah bridge.js:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
//   <script src="js/world-alive.js"></script>
//
// API Publik:
//   WA.moveCar(targetIdx, onDone)   — gerakkan mobil ke waypoint
//   WA.setTarget(bldIdx)            — highlight bangunan target
//   WA.unlockBuilding(bldIdx)       — animasi bangunan terbuka
//   WA.burstParticles(x,y,n,type)   — spawn partikel di posisi SVG
//   WA.startIdle()                  — mulai idle animation mobil
//   WA.stopIdle()                   — hentikan idle animation
// ═══════════════════════════════════════════════════════════

(function(W){
'use strict';

const SVG_NS = 'http://www.w3.org/2000/svg';
function G(){ return typeof gsap !== 'undefined'; }
function svgEl(tag,attrs){
  const el=document.createElementNS(SVG_NS,tag);
  Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,v));
  return el;
}

// ─── CSS ──────────────────────────────────────────────────
function injectCSS(){
  if(document.getElementById('_wa_css')) return;
  const s=document.createElement('style');
  s.id='_wa_css';
  s.textContent=`
.wa-tree-top{transform-origin:50% 100%;animation:waTreeSway var(--spd,3s) ease-in-out infinite var(--del,0s) alternate}
@keyframes waTreeSway{
  0%{transform:rotate(var(--r1,-3deg)) scale(1)}
  50%{transform:rotate(var(--r2,2deg)) scale(1.02)}
  100%{transform:rotate(var(--r1,-3deg)) scale(1)}
}
.wa-cloud{animation:waCloudMove var(--dur,30s) linear infinite var(--coff,0s)}
@keyframes waCloudMove{
  from{transform:translateX(var(--cx-start,-120px))}
  to{transform:translateX(var(--cx-end,820px))}
}
.wa-target{animation:waGlow 1.4s ease-in-out infinite alternate}
@keyframes waGlow{
  0%{filter:drop-shadow(0 0 4px rgba(255,220,50,.4))}
  100%{filter:drop-shadow(0 0 18px rgba(255,220,50,.95)) drop-shadow(0 0 36px rgba(255,180,0,.5))}
}
.wa-smoke{animation:waSmoke var(--sd,2.2s) ease-out infinite var(--sdl,0s);transform-origin:50% 100%}
@keyframes waSmoke{
  0%{opacity:.55;transform:translateY(0) scale(.8) translateX(0)}
  50%{opacity:.3;transform:translateY(-22px) scale(1.1) translateX(var(--sdx,4px))}
  100%{opacity:0;transform:translateY(-40px) scale(1.4) translateX(var(--sdx2,8px))}
}
.wa-sparkle{animation:waSpk var(--spkd,1.6s) ease-in-out infinite var(--spkdl,0s)}
@keyframes waSpk{0%,100%{opacity:.2;transform:scale(.7) rotate(0)}50%{opacity:1;transform:scale(1.2) rotate(180deg)}}
.wa-ping{animation:waPing 1.8s ease-out infinite}
@keyframes waPing{0%{transform:scale(0);opacity:.9}80%,100%{transform:scale(2.8);opacity:0}}
  `;
  document.head.appendChild(s);
}

// ─── AUDIO ────────────────────────────────────────────────
let _ac=null;
function gAC(){if(!_ac)try{_ac=new(W.AudioContext||W.webkitAudioContext)();}catch(e){}return _ac;}
function rAC(){const c=gAC();if(c&&c.state==='suspended')c.resume();}
function nt(f,tp,pk,at,su,rl,st){
  const c=gAC();if(!c)return;rAC();
  const o=c.createOscillator(),g=c.createGain();
  o.type=tp||'sine';o.frequency.value=f;
  const t=st||c.currentTime;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+at);
  g.gain.setValueAtTime(pk,t+at+su);g.gain.linearRampToValueAtTime(0,t+at+su+rl);
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+at+su+rl+.05);
}
const SFX={
  move(){nt(220,'sawtooth',.04,.01,.05,.08);},
  arrive(){[523,659,784].forEach((f,i)=>nt(f,'sine',.12,.01,.06,.1,i*.12));},
  unlock(){[392,494,587,784,1047].forEach((f,i)=>nt(f,'triangle',.15,.01,.06,.08,i*.1));},
};
['click','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{try{gAC();}catch(e){}},{once:true,passive:true}));

// ─── CONFIG ───────────────────────────────────────────────
// Override ini sesuai ID elemen SVG di HeroKu
const CFG = {
  carId:       'world-car',
  wheelLId:    'world-wheel-l',
  wheelRId:    'world-wheel-r',
  particlesId: 'world-particles',
  effectsId:   'world-effects',
  // Sesuaikan buildingPrefix dengan ID bangunan di SVG HeroKu
  // Misal: bangunan id="wb0", "wb1", dst.
  buildingPrefix: 'wb',
  // Waypoints: koordinat [x,y] di SVG viewBox HeroKu
  // Sesuaikan dengan posisi jalan di SVG dunia
  waypoints: [
    {x:60,  y:360},
    {x:195, y:302},
    {x:375, y:282},
    {x:520, y:302},
    {x:645, y:366},
  ],
};

// ─── STATE ────────────────────────────────────────────────
let carPos   = 0;
let isMoving = false;
let idleTl   = null;
let wheelTl  = null;

// ─── HELPERS ──────────────────────────────────────────────
function getEl(id){ return document.getElementById(id); }
function pGroup(){ return getEl(CFG.particlesId) || document.querySelector('#world-display svg g'); }
function uGroup(){ return getEl(CFG.effectsId)   || pGroup(); }

// ─── PARTICLE ─────────────────────────────────────────────
function spawnParticle(x, y, type){
  if(!G()) return;
  const pg = pGroup(); if(!pg) return;

  if(type === 'star'){
    const el=svgEl('text',{x,y,'text-anchor':'middle','font-size':10+Math.random()*8,fill:'#F1C40F',opacity:1});
    el.textContent=['✦','✧','⭐','★'][Math.floor(Math.random()*4)];
    pg.appendChild(el);
    gsap.fromTo(el,{attr:{y},opacity:1,scale:0},{attr:{y:y-50-Math.random()*30,x:x+(Math.random()*30-15)},opacity:0,scale:1.5,duration:.9+Math.random()*.5,ease:'power2.out',onComplete:()=>el.remove()});
  }
  if(type === 'circle'){
    const cols=['#F1C40F','#E74C3C','#2ECC71','#3498DB','#9B59B6','#E67E22'];
    const el=svgEl('circle',{cx:x+(Math.random()*16-8),cy:y+(Math.random()*8-4),r:3+Math.random()*5,fill:cols[Math.floor(Math.random()*cols.length)],opacity:.85});
    pg.appendChild(el);
    const a=Math.random()*Math.PI*2,d=40+Math.random()*60;
    gsap.to(el,{attr:{cx:x+Math.cos(a)*d,cy:y+Math.sin(a)*d,r:.5},opacity:0,duration:.6+Math.random()*.5,ease:'power2.out',onComplete:()=>el.remove()});
  }
  if(type === 'confetti'){
    const cols=['#F1C40F','#E74C3C','#2ECC71','#3498DB','#9B59B6','#E67E22','#FF69B4'];
    const el=svgEl('rect',{x:x+(Math.random()*12-6),y,width:6+Math.random()*5,height:4+Math.random()*3,fill:cols[Math.floor(Math.random()*cols.length)],rx:1,opacity:1,transform:`rotate(${Math.random()*360} ${x} ${y})`});
    pg.appendChild(el);
    const a=Math.random()*Math.PI*2,d=50+Math.random()*80;
    gsap.to(el,{attr:{x:x+Math.cos(a)*d,y:y+Math.sin(a)*d},rotation:360+Math.random()*360,transformOrigin:`${x}px ${y}px`,opacity:0,duration:.8+Math.random()*.6,ease:'power2.out',onComplete:()=>el.remove()});
  }
}

// ─── PUBLIC API ───────────────────────────────────────────
const WA = {};

// ── 1. IDLE ANIMATION ─────────────────────────────────────
WA.startIdle = function(){
  if(idleTl || !G()) return;
  const car=getEl(CFG.carId);
  const wl=getEl(CFG.wheelLId);
  const wr=getEl(CFG.wheelRId);
  if(!car) return;
  const wp=CFG.waypoints[carPos];
  idleTl=gsap.to(car,{attr:{transform:`translate(${wp.x-20},${wp.y-26})`},y:-3,duration:1.4,ease:'sine.inOut',yoyo:true,repeat:-1});
  if(wl&&wr) wheelTl=gsap.to([wl,wr],{rotation:360,transformOrigin:'50% 50%',duration:4,ease:'none',repeat:-1});
};

WA.stopIdle = function(){
  if(idleTl){idleTl.kill();idleTl=null;}
  if(wheelTl){wheelTl.kill();wheelTl=null;}
};

// ── 2. MOBIL BERGERAK ─────────────────────────────────────
WA.moveCar = function(targetIdx, onDone){
  if(isMoving||targetIdx>=CFG.waypoints.length||!G()) return;
  const car=getEl(CFG.carId); if(!car) return;
  const wl=getEl(CFG.wheelLId), wr=getEl(CFG.wheelRId);
  isMoving=true;
  WA.stopIdle();

  const from=CFG.waypoints[carPos], to=CFG.waypoints[targetIdx];
  const dist=Math.sqrt((to.x-from.x)**2+(to.y-from.y)**2);
  const dur=dist/90;

  // Roda cepat
  if(wl&&wr) gsap.to([wl,wr],{rotation:360,transformOrigin:'50% 50%',duration:.6,ease:'none',repeat:Math.ceil(dur/.6)});

  // Asap knalpot
  const exhaust=[];
  for(let i=0;i<Math.ceil(dur*4);i++){
    exhaust.push(setTimeout(()=>{
      if(!isMoving) return;
      const wp=CFG.waypoints[carPos];
      const pg=pGroup(); if(!pg) return;
      const sm=svgEl('ellipse',{cx:wp.x-24+(Math.random()*4-2),cy:wp.y-14+(Math.random()*4-2),rx:4+Math.random()*3,ry:3+Math.random()*2,fill:'rgba(180,180,180,.55)'});
      pg.appendChild(sm);
      gsap.to(sm,{attr:{cx:`+=${Math.random()*12-6}`,cy:`-=${20+Math.random()*15}`,rx:8+Math.random()*6,ry:6+Math.random()*4},opacity:0,duration:.9+Math.random()*.4,ease:'power1.out',onComplete:()=>sm.remove()});
    },i*250));
  }

  // Gerak
  gsap.timeline({onComplete:()=>{
    carPos=targetIdx;
    isMoving=false;
    exhaust.forEach(clearTimeout);
    WA.startIdle();
    SFX.arrive();
    if(onDone) onDone(targetIdx);
  }})
  .to(car,{attr:{transform:`translate(${to.x-20},${to.y-26})`},duration:dur,ease:'power1.inOut'})
  .to(car,{y:'-=3',duration:.18,ease:'sine.inOut',yoyo:true,repeat:Math.ceil(dur/.36)},0);

  SFX.move();
};

// ── 3 & 4. POHON + AWAN dikontrol CSS, tidak perlu API ────
// Tambahkan class "wa-tree-top" pada elemen daun pohon di SVG
// Tambahkan class "wa-cloud" pada grup awan di SVG

// ── 5. BANGUNAN TARGET GLOW ───────────────────────────────
WA.setTarget = function(bldIdx){
  for(let i=0;i<10;i++){
    const b=getEl(CFG.buildingPrefix+i);
    if(b) b.classList.remove('wa-target');
  }
  const b=getEl(CFG.buildingPrefix+bldIdx);
  if(!b||!G()) return;
  b.classList.add('wa-target');
  // Ping ring
  const wp=CFG.waypoints[bldIdx];
  const pg=pGroup(); if(!pg) return;
  const ring=svgEl('circle',{cx:wp.x,cy:wp.y,r:8,fill:'none',stroke:'#F1C40F','stroke-width':2,opacity:.8});
  pg.appendChild(ring);
  gsap.to(ring,{attr:{r:28},opacity:0,duration:1.2,ease:'power2.out',repeat:3,onComplete:()=>ring.remove()});
};

// ── 6. BURST PARTIKEL ─────────────────────────────────────
WA.burstParticles = function(x, y, count, type){
  type=type||'circle'; count=count||12;
  for(let i=0;i<count;i++) setTimeout(()=>spawnParticle(x,y,type),i*25);
};

// ── 7. BANGUNAN TERBUKA ───────────────────────────────────
WA.unlockBuilding = function(bldIdx){
  if(!G()) return;
  const bld=getEl(CFG.buildingPrefix+bldIdx); if(!bld) return;
  const wp=CFG.waypoints[bldIdx];
  const ug=uGroup(); if(!ug) return;

  bld.classList.remove('wa-target');

  // Shake scale
  gsap.timeline()
    .to(bld,{scale:1.15,duration:.15,ease:'power2.out',transformOrigin:'50% 100%'})
    .to(bld,{scale:.95,duration:.12,ease:'power2.in'})
    .to(bld,{scale:1.08,duration:.1,ease:'power2.out'})
    .to(bld,{scale:1,duration:.14,ease:'power2.in'});

  // Brightness flash
  gsap.to(bld,{filter:'brightness(1.5)',duration:.2,yoyo:true,repeat:5,onComplete:()=>bld.style.filter=''});

  // Ring burst
  for(let i=0;i<3;i++){
    setTimeout(()=>{
      const ring=svgEl('circle',{cx:wp.x,cy:wp.y-30,r:10,fill:'none',stroke:['#F1C40F','#FFD700','#FFA500'][i],'stroke-width':3-i*.5,opacity:.9});
      ug.appendChild(ring);
      gsap.to(ring,{attr:{r:80+i*20},opacity:0,duration:.7+i*.15,ease:'power2.out',onComplete:()=>ring.remove()});
    },i*120);
  }

  // Partikel 3 jenis
  WA.burstParticles(wp.x,wp.y-20,18,'star');
  setTimeout(()=>WA.burstParticles(wp.x,wp.y-20,16,'confetti'),200);
  setTimeout(()=>WA.burstParticles(wp.x,wp.y-20,14,'circle'),350);

  // Koin float
  for(let i=0;i<5;i++){
    setTimeout(()=>{
      const c=svgEl('text',{x:wp.x+(i*14-28),y:wp.y-10,'text-anchor':'middle','font-size':14,opacity:1});
      c.textContent='⭐';
      ug.appendChild(c);
      gsap.to(c,{attr:{y:wp.y-80,x:wp.x+(i*14-28)+(Math.random()*20-10)},opacity:0,scale:1.5,duration:1.2,ease:'power2.out',onComplete:()=>c.remove()});
    },i*80);
  }

  SFX.unlock();
  if(navigator.vibrate) navigator.vibrate([30,15,30,15,60]);
};

// ── CONFIGURE API ─────────────────────────────────────────
WA.configure = function(opts){
  Object.assign(CFG, opts||{});
};

W.WA = WA;

// ─── INTEGRASI OTOMATIS KE HEROKU ────────────────────────
function waitApp(cb,n){
  n=n||0;if(n>120)return;
  if(typeof STORE!=='undefined'&&STORE.students)cb();
  else setTimeout(()=>waitApp(cb,n+1),100);
}

function boot(){
  injectCSS();

  waitApp(()=>{
    // Patch showWorldMap / renderWorld jika ada
    if(typeof W.renderWorldProgress==='function'){
      const _o=W.renderWorldProgress;
      W.renderWorldProgress=function(student){
        _o.call(this,student);
        // Setelah render: aktifkan idle & set target
        setTimeout(()=>{
          WA.startIdle();
          const progress=student?.totalDays||0;
          const targetIdx=Math.min(Math.floor(progress/7),4);
          WA.setTarget(targetIdx);
        },300);
      };
    }

    // Patch showBuildingUnlock
    if(typeof W.showBuildingUnlock==='function'){
      const _o=W.showBuildingUnlock;
      W.showBuildingUnlock=function(building,then){
        _o.call(this,building,then);
        const idx=building?.index??0;
        setTimeout(()=>WA.unlockBuilding(idx),200);
      };
    }

    // Patch tab switch — aktifkan idle saat pindah ke tab dunia
    if(typeof W.switchPage==='function'){
      const _o=W.switchPage;
      W.switchPage=function(page){
        _o.call(this,page);
        if(page==='dunia'||page==='world'){
          setTimeout(()=>WA.startIdle(),400);
        } else {
          WA.stopIdle();
        }
      };
    }

    console.log('[WA] World Alive siap ✅');
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();

})(window);
