// ═══════════════════════════════════════════════════════════
// HEROKU CELEBRATION SYSTEM v1.0
// File: js/celebration.js
//
// Pasang di index.html setelah bridge.js:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
//   <script src="js/celebration.js"></script>
//
// API Publik:
//   CEL.mission({name, emoji, koin, xp})
//   CEL.perfect({koin, xp, streak})
//   CEL.levelUp({level, perks})
//   CEL.badge({icon, name, req, koin, xp})
//   CEL.building({emoji, name, desc, koin})
//   CEL.race({rank, name, car, koin, done, streak})
//   CEL.garage({emoji, name, desc, cost, remaining})
//   CEL.close(type)
// ═══════════════════════════════════════════════════════════

(function(global){
'use strict';

// ─────────────────────────────────────────────
// CSS INJECTION
// ─────────────────────────────────────────────
function injectCSS(){
  if(document.getElementById('cel-css')) return;
  const s=document.createElement('style');
  s.id='cel-css';
  s.textContent=`
    #cel-canvas{position:fixed;inset:0;pointer-events:none;z-index:9600;width:100%;height:100%}
    .cel-backdrop{position:fixed;inset:0;z-index:9700;background:rgba(10,10,20,.85);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;padding:20px}
    .cel-backdrop.open{display:flex}
    .cel-box{position:relative;border-radius:28px;padding:32px 24px 28px;max-width:320px;width:100%;text-align:center;overflow:hidden}
    .cel-rays{position:absolute;inset:0;pointer-events:none;overflow:hidden}
    .cel-ray{position:absolute;top:50%;left:50%;width:2px;transform-origin:0 0;background:linear-gradient(to right,transparent,rgba(255,255,255,.07),transparent)}
    .cel-stars-bg{position:absolute;inset:0;pointer-events:none;overflow:hidden}
    .cel-star-dot{position:absolute;border-radius:50%;background:rgba(255,255,255,.5);animation:celStar var(--d,2s) ease-in-out infinite var(--dl,0s)}
    @keyframes celStar{0%,100%{opacity:.15;transform:scale(.8)}50%{opacity:1;transform:scale(1.3)}}
    @keyframes ringRotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @keyframes crownBob{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-8px) rotate(3deg)}}
    @keyframes buildingFloat{from{transform:translateY(0) scale(1)}to{transform:translateY(-10px) scale(1.05)}}
    @keyframes carRace{from{transform:translateX(-4px) rotate(-1deg)}to{transform:translateX(4px) rotate(1deg)}}
    @keyframes garageSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @keyframes missionRing{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.35);opacity:0}}

    /* Mission toast */
    #cel-mission{position:fixed;top:70px;left:50%;transform:translateX(-50%) translateY(-20px);z-index:9800;opacity:0;pointer-events:none;max-width:320px;width:calc(100% - 32px)}
    .cel-mission-inner{background:linear-gradient(135deg,#1A1A2E,#0F3460);border:1.5px solid rgba(46,204,113,.5);border-radius:20px;padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 28px rgba(0,0,0,.4);position:relative;overflow:hidden}
    .cel-mission-icon{width:48px;height:48px;border-radius:14px;background:rgba(46,204,113,.15);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;position:relative}
    .cel-mission-ring{position:absolute;inset:-4px;border-radius:16px;border:2px solid rgba(46,204,113,.5);animation:missionRing 1.4s ease-out infinite}
    .cel-mission-label{font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#2ECC71;margin-bottom:2px}
    .cel-mission-name{font-size:15px;font-weight:900;color:#fff}
    .cel-mission-reward{font-size:11px;color:rgba(255,255,255,.5);margin-top:2px}
    .cel-mission-shine{position:absolute;inset:0;border-radius:20px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);transform:translateX(-100%)}

    /* Perfect */
    .cel-perfect-box{background:linear-gradient(160deg,#1A1A2E,#0D1B3E,#1A1A2E);border:1.5px solid rgba(241,196,15,.2)}
    .cel-perfect-crown{font-size:72px;display:block;margin-bottom:8px;filter:drop-shadow(0 0 20px rgba(241,196,15,.6));animation:crownBob 1.2s ease-in-out infinite alternate}
    .cel-perfect-title{font-size:28px;font-weight:900;color:#fff;margin-bottom:4px}
    .cel-perfect-sub{font-size:13px;color:rgba(255,255,255,.5);margin-bottom:20px;line-height:1.6}
    .cel-stat-chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:18px}
    .cel-chip{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:7px 16px;font-size:13px;font-weight:800;color:#fff}
    .cel-chip.gold{background:rgba(241,196,15,.15);border-color:rgba(241,196,15,.3);color:#F1C40F}
    .cel-chip.purple{background:rgba(142,68,173,.2);border-color:rgba(142,68,173,.3);color:#D7BDE2}
    .cel-chip.blue{background:rgba(116,185,255,.15);border-color:rgba(116,185,255,.3);color:#74B9FF}
    .cel-chip.green{background:rgba(46,204,113,.15);border-color:rgba(46,204,113,.3);color:#2ECC71}

    /* Level up */
    .cel-levelup-box{background:linear-gradient(160deg,#1A1A2E,#4A235A,#1A1A2E);border:1.5px solid rgba(142,68,173,.3)}
    .cel-lvl-pre{font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:rgba(211,84,0,.8);margin-bottom:6px}
    .cel-lvl-num{font-size:100px;font-weight:900;color:#F1C40F;line-height:1;text-shadow:0 0 30px rgba(241,196,15,.5);display:block;margin-bottom:8px}
    .cel-lvl-title{font-size:22px;font-weight:900;color:#fff;margin-bottom:6px}
    .cel-lvl-sub{font-size:13px;color:rgba(255,255,255,.5);margin-bottom:20px;line-height:1.6}
    .cel-lvl-perks{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:22px}
    .cel-perk{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:6px 14px;font-size:11px;font-weight:700;color:rgba(255,255,255,.8)}

    /* Badge */
    .cel-badge-box{background:linear-gradient(160deg,#1A1A2E,#1A350D,#1A1A2E);border:1.5px solid rgba(230,126,34,.3)}
    .cel-badge-stage{position:relative;width:110px;height:110px;margin:0 auto 16px}
    .cel-badge-ring-out{position:absolute;inset:0;border-radius:50%;border:3px solid rgba(230,126,34,.35);animation:ringRotate 7s linear infinite}
    .cel-badge-ring-in{position:absolute;inset:8px;border-radius:50%;border:2px dashed rgba(230,126,34,.2);animation:ringRotate 5s linear infinite reverse}
    .cel-badge-circle{position:absolute;inset:16px;border-radius:50%;background:linear-gradient(135deg,rgba(230,126,34,.2),rgba(230,126,34,.05));border:2.5px solid rgba(230,126,34,.5);display:flex;align-items:center;justify-content:center;font-size:36px}
    .cel-badge-name{font-size:22px;font-weight:900;color:#fff;margin-bottom:4px}
    .cel-badge-req{font-size:11px;color:rgba(255,255,255,.4);margin-bottom:18px}

    /* Building */
    .cel-building-box{background:linear-gradient(160deg,#0D1B3E,#1A1A2E,#0D2E3E);border:1.5px solid rgba(52,152,219,.3)}
    .cel-building-emoji{font-size:72px;display:block;margin-bottom:12px;animation:buildingFloat 2s ease-in-out infinite alternate;filter:drop-shadow(0 8px 20px rgba(52,152,219,.4))}
    .cel-building-unlock{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#74B9FF;margin-bottom:8px}
    .cel-building-name{font-size:24px;font-weight:900;color:#fff;margin-bottom:6px}
    .cel-building-desc{font-size:12px;color:rgba(255,255,255,.5);margin-bottom:20px;line-height:1.6}

    /* Race */
    .cel-race-box{background:linear-gradient(160deg,#2C0A0A,#1A1A2E,#2C0A0A);border:1.5px solid rgba(231,76,60,.3)}
    .cel-race-car{font-size:56px;display:block;margin-bottom:10px;animation:carRace .35s ease-in-out infinite alternate}
    .cel-race-rank{font-size:72px;font-weight:900;color:#F1C40F;line-height:1;margin-bottom:4px;text-shadow:0 0 20px rgba(241,196,15,.5)}
    .cel-race-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:6px}
    .cel-race-name-txt{font-size:20px;font-weight:900;color:#fff;margin-bottom:18px}
    .cel-race-speed{display:flex;justify-content:center;gap:20px;margin-bottom:20px}
    .cel-speed-val{font-size:20px;font-weight:900;color:#fff;text-align:center}
    .cel-speed-lbl{font-size:9px;color:rgba(255,255,255,.4);font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center}
    .cel-speed-div{width:1px;background:rgba(255,255,255,.1)}

    /* Garage */
    .cel-garage-box{background:linear-gradient(160deg,#1A1A2E,#1A2A1A,#1A1A2E);border:1.5px solid rgba(46,204,113,.3)}
    .cel-garage-preview{width:100px;height:100px;border-radius:50%;background:rgba(46,204,113,.1);border:2px solid rgba(46,204,113,.3);display:flex;align-items:center;justify-content:center;font-size:48px;margin:0 auto 14px;animation:garageSpin 4s linear infinite}
    .cel-garage-tag{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#2ECC71;margin-bottom:6px}
    .cel-garage-name{font-size:22px;font-weight:900;color:#fff;margin-bottom:4px}
    .cel-garage-desc-txt{font-size:11px;color:rgba(255,255,255,.45);margin-bottom:18px;line-height:1.6}

    /* Progress bar */
    .cel-prog-wrap{background:rgba(255,255,255,.1);border-radius:6px;height:8px;overflow:hidden;margin-bottom:18px}
    .cel-prog-fill{height:100%;border-radius:6px;background:linear-gradient(90deg,#F1C40F,#E67E22);width:0}

    /* Button */
    .cel-btn{width:100%;padding:15px;border:none;border-radius:18px;font-size:15px;font-weight:900;cursor:pointer;transition:transform .15s}
    .cel-btn:active{transform:scale(.97)}
    .cel-btn-gold{background:linear-gradient(135deg,#F1C40F,#E67E22);color:#1A1A2E;box-shadow:0 6px 22px rgba(241,196,15,.3)}
    .cel-btn-green{background:linear-gradient(135deg,#2ECC71,#27AE60);color:#fff;box-shadow:0 6px 22px rgba(46,204,113,.3)}
    .cel-btn-blue{background:linear-gradient(135deg,#3498DB,#1A5276);color:#fff;box-shadow:0 6px 22px rgba(52,152,219,.3)}
    .cel-btn-red{background:linear-gradient(135deg,#E74C3C,#C0392B);color:#fff;box-shadow:0 6px 22px rgba(231,76,60,.3)}

    /* Float labels */
    .cel-float{position:fixed;pointer-events:none;z-index:9900;font-weight:900;font-size:16px;border-radius:24px;padding:5px 14px;display:flex;align-items:center;gap:5px;box-shadow:0 4px 14px rgba(0,0,0,.2);will-change:transform,opacity}
    .cel-float-coin{background:linear-gradient(135deg,#F1C40F,#D68910);color:#1A1A2E}
    .cel-float-xp{background:linear-gradient(135deg,#8E44AD,#6C3483);color:#fff}

    /* Particles */
    .cel-particle{position:fixed;pointer-events:none;z-index:9800;border-radius:50%;will-change:transform,opacity}
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────
// HTML INJECTION
// ─────────────────────────────────────────────
function injectHTML(){
  if(document.getElementById('cel-mission')) return;
  document.body.insertAdjacentHTML('beforeend',`
    <canvas id="cel-canvas"></canvas>

    <!-- 1. Mission toast -->
    <div id="cel-mission">
      <div class="cel-mission-inner">
        <div class="cel-mission-icon"><div class="cel-mission-ring"></div><span id="cel-m-emoji">✅</span></div>
        <div><div class="cel-mission-label">MISI SELESAI!</div><div class="cel-mission-name" id="cel-m-name">Misi</div><div class="cel-mission-reward" id="cel-m-reward">+0 Koin</div></div>
        <div class="cel-mission-shine" id="cel-m-shine"></div>
      </div>
    </div>

    <!-- 2. Perfect -->
    <div class="cel-backdrop" id="cel-perfect">
      <div class="cel-box cel-perfect-box" id="cel-perfect-box">
        <div class="cel-rays" id="cel-pr-rays"></div><div class="cel-stars-bg" id="cel-pr-stars"></div>
        <span class="cel-perfect-crown">👑</span>
        <div class="cel-perfect-title">HARI SEMPURNA!</div>
        <div class="cel-perfect-sub" id="cel-pr-sub">MasyaAllah — semua 7 kebiasaan selesai!</div>
        <div class="cel-stat-chips" id="cel-pr-chips"></div>
        <div class="cel-prog-wrap"><div class="cel-prog-fill" id="cel-pr-bar"></div></div>
        <button class="cel-btn cel-btn-gold" onclick="CEL.close('perfect')">Alhamdulillah! 🏆</button>
      </div>
    </div>

    <!-- 3. Level up -->
    <div class="cel-backdrop" id="cel-levelup">
      <div class="cel-box cel-levelup-box" id="cel-lu-box">
        <div class="cel-rays" id="cel-lu-rays"></div><div class="cel-stars-bg" id="cel-lu-stars"></div>
        <div class="cel-lvl-pre">✨ NAIK LEVEL ✨</div>
        <span class="cel-lvl-num" id="cel-lu-num">5</span>
        <div class="cel-lvl-title" id="cel-lu-title">NAIK LEVEL!</div>
        <div class="cel-lvl-sub" id="cel-lu-sub">Terus semangat!</div>
        <div class="cel-lvl-perks" id="cel-lu-perks"></div>
        <div class="cel-prog-wrap"><div class="cel-prog-fill" id="cel-lu-bar"></div></div>
        <button class="cel-btn cel-btn-gold" onclick="CEL.close('levelup')">Lanjutkan! 🚀</button>
      </div>
    </div>

    <!-- 4. Badge -->
    <div class="cel-backdrop" id="cel-badge">
      <div class="cel-box cel-badge-box" id="cel-bg-box">
        <div class="cel-stars-bg" id="cel-bg-stars"></div>
        <div style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#E67E22;margin-bottom:14px">🏅 BADGE BARU TERBUKA!</div>
        <div class="cel-badge-stage"><div class="cel-badge-ring-out"></div><div class="cel-badge-ring-in"></div><div class="cel-badge-circle" id="cel-bg-icon">🌅</div></div>
        <div class="cel-badge-name" id="cel-bg-name">Badge</div>
        <div class="cel-badge-req" id="cel-bg-req"></div>
        <div class="cel-stat-chips" id="cel-bg-chips"></div>
        <button class="cel-btn cel-btn-gold" onclick="CEL.close('badge')">Keren! 🎉</button>
      </div>
    </div>

    <!-- 5. Building -->
    <div class="cel-backdrop" id="cel-building">
      <div class="cel-box cel-building-box" id="cel-bl-box">
        <div class="cel-stars-bg" id="cel-bl-stars"></div>
        <span class="cel-building-emoji" id="cel-bl-emoji">🏗️</span>
        <div class="cel-building-unlock">🏗️ BANGUNAN BARU TERBUKA!</div>
        <div class="cel-building-name" id="cel-bl-name">Bangunan</div>
        <div class="cel-building-desc" id="cel-bl-desc"></div>
        <div class="cel-stat-chips" id="cel-bl-chips"></div>
        <button class="cel-btn cel-btn-blue" onclick="CEL.close('building')">Kunjungi Desa! 🌍</button>
      </div>
    </div>

    <!-- 6. Race -->
    <div class="cel-backdrop" id="cel-race">
      <div class="cel-box cel-race-box" id="cel-rc-box">
        <div class="cel-stars-bg" id="cel-rc-stars"></div>
        <span class="cel-race-car" id="cel-rc-car">🚗</span>
        <div class="cel-race-rank" id="cel-rc-rank">#1</div>
        <div class="cel-race-label">POSISI SEKARANG</div>
        <div class="cel-race-name-txt" id="cel-rc-name">Kamu memimpin!</div>
        <div class="cel-race-speed">
          <div><div class="cel-speed-val" id="cel-rc-koin">0</div><div class="cel-speed-lbl">Koin</div></div>
          <div class="cel-speed-div"></div>
          <div><div class="cel-speed-val" id="cel-rc-done">0/7</div><div class="cel-speed-lbl">Hari Ini</div></div>
          <div class="cel-speed-div"></div>
          <div><div class="cel-speed-val" id="cel-rc-streak">🔥0</div><div class="cel-speed-lbl">Streak</div></div>
        </div>
        <button class="cel-btn cel-btn-red" onclick="CEL.close('race')">GAS TERUS! 🏁</button>
      </div>
    </div>

    <!-- 7. Garage -->
    <div class="cel-backdrop" id="cel-garage">
      <div class="cel-box cel-garage-box" id="cel-gr-box">
        <div class="cel-stars-bg" id="cel-gr-stars"></div>
        <div class="cel-garage-preview" id="cel-gr-preview">🚗</div>
        <div class="cel-garage-tag">🛒 ITEM BARU DIPASANG!</div>
        <div class="cel-garage-name" id="cel-gr-name">Item</div>
        <div class="cel-garage-desc-txt" id="cel-gr-desc"></div>
        <div class="cel-stat-chips" id="cel-gr-chips"></div>
        <button class="cel-btn cel-btn-green" onclick="CEL.close('garage')">Keren! 🚗</button>
      </div>
    </div>
  `);
}

// ─────────────────────────────────────────────
// CONFETTI
// ─────────────────────────────────────────────
let _confPieces=[],_confRaf=null,_confActive=false;
const CONF_COLORS=['#F1C40F','#FF6B35','#52D98A','#6C5CE7','#FF7675','#74B9FF','#FD79A8','#A29BFE','#FFEAA7','#00B894'];

function getCanvas(){ return document.getElementById('cel-canvas'); }

function confNewPiece(x,y,spread){
  const c=getCanvas();
  return{x:x!=null?x:Math.random()*(c?c.width:window.innerWidth),y:y!=null?y:-10,vx:(Math.random()-.5)*9*(spread||1),vy:Math.random()*5+2,rot:Math.random()*360,rotV:(Math.random()-.5)*9,w:7+Math.random()*9,h:4+Math.random()*7,color:CONF_COLORS[Math.floor(Math.random()*CONF_COLORS.length)],shape:Math.random()>.5?'rect':'circle',gravity:.14+Math.random()*.1,life:1};
}

function confTick(){
  const canvas=getCanvas(); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  _confPieces=_confPieces.filter(p=>{
    p.x+=p.vx;p.vy+=p.gravity;p.y+=p.vy;p.rot+=p.rotV;p.vx*=.99;p.life-=.007;
    ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;
    if(p.shape==='circle'){ctx.beginPath();ctx.ellipse(0,0,p.w/2,p.h/2,0,0,Math.PI*2);ctx.fill();}else ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
    ctx.restore();
    return p.life>0&&p.y<canvas.height+50;
  });
  if(_confPieces.length>0)_confRaf=requestAnimationFrame(confTick);
  else{_confActive=false;const ctx2=getCanvas()?.getContext('2d');if(ctx2)ctx2.clearRect(0,0,getCanvas().width,getCanvas().height);}
}

function confBurst(count,spread,x,y){
  const canvas=getCanvas(); if(!canvas) return;
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  for(let i=0;i<(count||50);i++) _confPieces.push(confNewPiece(x,y,spread));
  if(!_confActive){_confActive=true;if(_confRaf)cancelAnimationFrame(_confRaf);confTick();}
}

function confStop(){
  _confPieces=[];_confActive=false;
  const c=getCanvas();if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);
}

// ─────────────────────────────────────────────
// AUDIO
// ─────────────────────────────────────────────
let _audioCtx=null;
function getAC(){if(!_audioCtx)try{_audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}return _audioCtx;}
function resumeAC(){const c=getAC();if(c&&c.state==='suspended')c.resume();}
function note(freq,type,peak,att,sus,rel,start){
  const c=getAC();if(!c)return;resumeAC();
  const o=c.createOscillator(),g=c.createGain();
  o.type=type||'sine';o.frequency.value=freq;
  const t=start||c.currentTime;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.setValueAtTime(peak,t+att+sus);g.gain.linearRampToValueAtTime(0,t+att+sus+rel);
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+att+sus+rel+.05);
}
const SFX={
  ding(){note(880,'sine',.15,.01,.05,.12);note(1100,'sine',.1,.01,.03,.1,.12);},
  coin(){[1047,1319,1568].forEach((f,i)=>note(f,'sine',.18,.01,.04,.1,i*.07));},
  badge(){[392,494,587,784].forEach((f,i)=>note(f,'triangle',.18,.01,.06,.08,i*.1));},
  levelUp(){[523,659,784,988,1047].forEach((f,i)=>note(f,'sine',.2,.01,.06,.12,i*.12));},
  fanfare(){[523,659,784,1047].forEach((f,i)=>note(f,'triangle',.22,.01,.05,.07,i*.08));setTimeout(()=>{[784,988,1175,1319,1568].forEach((f,i)=>note(f,'sine',.18,.01,.04,.08,.38+i*.09));},0);},
  purchase(){note(659,'square',.06,.001,.02,.04);note(880,'sine',.16,.01,.04,.1,.07);note(1100,'sine',.12,.01,.04,.1,.18);},
};

function vibrate(p){if(navigator.vibrate)navigator.vibrate(p);}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function makeStars(id,n){
  const el=document.getElementById(id);if(!el)return;el.innerHTML='';
  for(let i=0;i<n;i++){const d=document.createElement('div');d.className='cel-star-dot';const sz=2+Math.random()*3;d.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${1.5+Math.random()*2}s;--dl:${Math.random()*1.5}s`;el.appendChild(d);}
}
function makeRays(id,n,h){
  const el=document.getElementById(id);if(!el)return;el.innerHTML='';
  for(let i=0;i<n;i++){const r=document.createElement('div');r.className='cel-ray';r.style.cssText=`height:${h||220}px;transform:rotate(${i*(360/n)}deg) translateX(-50%);opacity:${.04+Math.random()*.1}`;el.appendChild(r);}
}
function makeChips(id,chips){
  const el=document.getElementById(id);if(!el)return;el.innerHTML='';
  chips.forEach(c=>{const d=document.createElement('div');d.className='cel-chip '+(c.cls||'');d.textContent=c.text;el.appendChild(d);});
}
function floatLabel(text,cls,x,y){
  if(typeof gsap==='undefined') return;
  const el=document.createElement('div');el.className='cel-float '+cls;el.innerHTML=text;document.body.appendChild(el);
  el.style.left=(x-el.offsetWidth/2)+'px';el.style.top=(y-el.offsetHeight/2)+'px';
  gsap.fromTo(el,{opacity:0,y:0,scale:.7},{opacity:1,y:-70,scale:1.05,duration:.35,ease:'back.out(2)',onComplete:()=>gsap.to(el,{opacity:0,y:'-=20',duration:.35,delay:.6,ease:'power2.in',onComplete:()=>el.remove()})});
}
function burstParticles(cx,cy,colors,count){
  const wrap=document.createElement('div');wrap.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9800;overflow:hidden';document.body.appendChild(wrap);
  for(let i=0;i<(count||12);i++){
    const p=document.createElement('div');p.className='cel-particle';const sz=7+Math.random()*9;p.style.cssText=`width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${cx}px;top:${cy}px`;wrap.appendChild(p);
    if(typeof gsap!=='undefined'){const angle=(i/(count||12))*Math.PI*2,dist=50+Math.random()*70;gsap.fromTo(p,{x:0,y:0,opacity:1,scale:1},{x:Math.cos(angle)*dist,y:Math.sin(angle)*dist,opacity:0,scale:.2,duration:.7+Math.random()*.3,delay:Math.random()*.1,ease:'power2.out'});}
  }
  setTimeout(()=>wrap.remove(),1300);
}

// ─────────────────────────────────────────────
// GSAP GUARD
// ─────────────────────────────────────────────
function G(){ return typeof gsap!=='undefined'; }

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────
const CEL={};

CEL.mission=function(data){
  document.getElementById('cel-m-emoji').textContent=data.emoji||'✅';
  document.getElementById('cel-m-name').textContent=data.name||'Misi';
  document.getElementById('cel-m-reward').textContent=`+${data.koin||0} Koin · +${data.xp||0} XP`;
  const el=document.getElementById('cel-mission');
  if(!G()){el.style.opacity=1;setTimeout(()=>el.style.opacity=0,2500);return;}
  gsap.killTweensOf(el);gsap.set(el,{opacity:0,y:-20,scale:.92});
  gsap.to(el,{opacity:1,y:0,scale:1,duration:.4,ease:'back.out(1.8)',onComplete:()=>{
    gsap.fromTo(document.getElementById('cel-m-shine'),{x:'-100%'},{x:'200%',duration:.6,ease:'power2.inOut'});
    gsap.to(el,{opacity:0,y:-16,scale:.96,duration:.3,delay:1.9,ease:'power2.in'});
  }});
  const cx=window.innerWidth/2,cy=80;
  setTimeout(()=>floatLabel(`⭐ +${data.koin} Koin`,'cel-float-coin',cx-50,cy),300);
  setTimeout(()=>floatLabel(`✨ +${data.xp} XP`,'cel-float-xp',cx+50,cy),500);
  SFX.ding();vibrate(30);
};

CEL.perfect=function(data){
  makeStars('cel-pr-stars',18);makeRays('cel-pr-rays',14,260);
  makeChips('cel-pr-chips',[{text:`⭐ +${data.koin||200} Koin`,cls:'gold'},{text:`✨ +${data.xp||300} XP`,cls:'purple'},{text:`🔥 Streak +1`}]);
  const backdrop=document.getElementById('cel-perfect'),box=document.getElementById('cel-perfect-box');
  backdrop.classList.add('open');
  if(G()){
    gsap.fromTo(box,{scale:.5,opacity:0,rotationX:-15},{scale:1,opacity:1,rotationX:0,duration:.55,ease:'back.out(1.8)'});
    gsap.fromTo(box.querySelector('.cel-perfect-crown'),{scale:0,rotation:-20},{scale:1,rotation:0,duration:.5,delay:.15,ease:'back.out(2.5)'});
    gsap.fromTo(box.querySelectorAll('.cel-chip'),{opacity:0,y:15},{opacity:1,y:0,stagger:.08,delay:.35,duration:.35,ease:'power3.out'});
    gsap.fromTo(box.querySelector('.cel-btn'),{opacity:0,y:20},{opacity:1,y:0,delay:.55,duration:.35,ease:'power3.out'});
  }
  setTimeout(()=>{const bar=document.getElementById('cel-pr-bar');if(bar){bar.style.transition='width 1.2s ease';bar.style.width='100%';}},500);
  confBurst(90,1.6);setTimeout(()=>confBurst(50,1.2,window.innerWidth*.25),600);setTimeout(()=>confBurst(50,1.2,window.innerWidth*.75),900);
  SFX.fanfare();vibrate([50,20,50,20,100,20,50]);
};

CEL.levelUp=function(data){
  const T=['','','Penjelajah Muda','Pahlawan Cilik','Pembela Kebaikan','Bintang Kelas','Pejuang Tangguh','Ahli Kebiasaan','Mentor Teman','Pemimpin Sejati','Legenda HeroKu'];
  const S=[,,'Perjalananmu baru dimulai!','Semakin kuat setiap hari!','Kebaikanmu menginspirasi!','MasyaAllah — kamu bersinar!','Istiqomah adalah kunci surga!','Kebiasaan sudah jadi karaktermu!','Teman belajar dari kamu!','Pemimpin sejati!','Subhanallah — luar biasa!'];
  document.getElementById('cel-lu-num').textContent=data.level;
  document.getElementById('cel-lu-title').textContent=(T[data.level]||'NAIK LEVEL!').toUpperCase();
  document.getElementById('cel-lu-sub').textContent=S[Math.min(data.level,10)]||'Terus semangat!';
  const perksEl=document.getElementById('cel-lu-perks');perksEl.innerHTML='';
  (data.perks||[]).forEach(p=>{const c=document.createElement('div');c.className='cel-perk';c.textContent=p;perksEl.appendChild(c);});
  const backdrop=document.getElementById('cel-levelup'),box=document.getElementById('cel-lu-box'),numEl=document.getElementById('cel-lu-num');
  makeStars('cel-lu-stars',20);makeRays('cel-lu-rays',16,280);backdrop.classList.add('open');
  if(G()){
    gsap.fromTo(numEl,{scale:.2,opacity:0,rotation:-10},{scale:1.15,opacity:1,rotation:0,duration:.45,delay:.1,ease:'back.out(2.5)',onComplete:()=>gsap.to(numEl,{scale:1,duration:.25,ease:'power2.out'})});
    gsap.fromTo(box,{y:80,opacity:0},{y:0,opacity:1,duration:.5,ease:'power3.out'});
    const rays=box.querySelectorAll('.cel-ray');if(rays.length)gsap.to(rays,{rotation:'+=360',duration:10,ease:'none',repeat:-1,stagger:0});
    const perks=perksEl.querySelectorAll('.cel-perk');if(perks.length)gsap.fromTo(perks,{opacity:0,x:-20},{opacity:1,x:0,stagger:.1,delay:.4,duration:.3,ease:'power3.out'});
    gsap.fromTo(box.querySelector('.cel-btn'),{opacity:0,scale:.8},{opacity:1,scale:1,delay:.6,duration:.4,ease:'back.out(1.5)'});
  }
  setTimeout(()=>{const bar=document.getElementById('cel-lu-bar');if(bar){bar.style.transition='width 1.5s ease';bar.style.width='100%';}},400);
  confBurst(100,1.8);setTimeout(()=>confBurst(60,1.3,window.innerWidth*.2),400);setTimeout(()=>confBurst(60,1.3,window.innerWidth*.8),700);
  SFX.levelUp();vibrate([50,15,50,15,100,15,50,15,100]);
};

CEL.badge=function(data){
  document.getElementById('cel-bg-icon').textContent=data.icon||'🏅';
  document.getElementById('cel-bg-name').textContent=data.name||'Badge';
  document.getElementById('cel-bg-req').textContent=data.req||'';
  makeChips('cel-bg-chips',[{text:`⭐ +${data.koin||0} Koin`,cls:'gold'},{text:`✨ +${data.xp||0} XP`,cls:'purple'}]);
  const backdrop=document.getElementById('cel-badge'),box=document.getElementById('cel-bg-box'),iconEl=document.getElementById('cel-bg-icon');
  makeStars('cel-bg-stars',16);backdrop.classList.add('open');
  if(G()){
    gsap.fromTo(box,{scale:.5,opacity:0,rotationY:-15},{scale:1,opacity:1,rotationY:0,duration:.55,ease:'back.out(1.8)'});
    gsap.fromTo(iconEl,{scale:3,opacity:0,rotation:20},{scale:1,opacity:1,rotation:0,duration:.45,delay:.25,ease:'back.out(2)',onComplete:()=>{gsap.fromTo(iconEl,{x:-4},{x:4,duration:.06,repeat:4,yoyo:true,ease:'none',onComplete:()=>gsap.set(iconEl,{x:0})});}});
    gsap.fromTo(box.querySelectorAll('.cel-badge-ring-out,.cel-badge-ring-in'),{scale:0,opacity:0},{scale:1,opacity:1,duration:.4,delay:.15,ease:'power2.out'});
    gsap.fromTo(box.querySelectorAll('.cel-chip'),{opacity:0,y:12},{opacity:1,y:0,stagger:.07,delay:.5,duration:.3,ease:'power3.out'});
    gsap.fromTo(box.querySelector('.cel-btn'),{opacity:0,y:16},{opacity:1,y:0,delay:.65,duration:.3,ease:'power3.out'});
  }
  setTimeout(()=>{const r=iconEl.getBoundingClientRect();burstParticles(r.left+r.width/2,r.top+r.height/2,['#E67E22','#F39C12','#F1C40F','#D35400'],14);},280);
  confBurst(45,1.1);SFX.badge();vibrate([30,15,30,15,60]);
};

CEL.building=function(data){
  document.getElementById('cel-bl-emoji').textContent=data.emoji||'🏗️';
  document.getElementById('cel-bl-name').textContent=data.name||'Bangunan';
  document.getElementById('cel-bl-desc').textContent=data.desc||'';
  makeChips('cel-bl-chips',[{text:`⭐ +${data.koin||0} Koin`,cls:'gold'},{text:'🏗️ Bangunan Baru',cls:'blue'}]);
  const backdrop=document.getElementById('cel-building'),box=document.getElementById('cel-bl-box'),emojiEl=document.getElementById('cel-bl-emoji');
  makeStars('cel-bl-stars',14);backdrop.classList.add('open');
  if(G()){
    gsap.fromTo(box,{y:60,opacity:0,scale:.9},{y:0,opacity:1,scale:1,duration:.5,ease:'back.out(1.6)'});
    gsap.fromTo(emojiEl,{y:-80,opacity:0,scale:1.5,rotation:-15},{y:0,opacity:1,scale:1,rotation:0,duration:.55,delay:.1,ease:'bounce.out'});
    gsap.fromTo(box.querySelectorAll('.cel-building-unlock,.cel-building-name,.cel-building-desc'),{opacity:0,y:15},{opacity:1,y:0,stagger:.1,delay:.45,duration:.35,ease:'power3.out'});
    gsap.fromTo(box.querySelectorAll('.cel-chip'),{opacity:0,scale:.8},{opacity:1,scale:1,stagger:.08,delay:.65,duration:.3,ease:'back.out(1.5)'});
    gsap.fromTo(box.querySelector('.cel-btn'),{opacity:0,y:16},{opacity:1,y:0,delay:.8,duration:.3,ease:'power3.out'});
  }
  setTimeout(()=>{const r=emojiEl.getBoundingClientRect();burstParticles(r.left+r.width/2,r.top+r.height/2,['#74B9FF','#0984E3','#DFE6E9'],14);},200);
  confBurst(40,1);SFX.ding();setTimeout(()=>SFX.coin(),400);vibrate([40,15,40]);
};

CEL.race=function(data){
  const RL=['','#1','#2','#3','#4'];
  const RM={1:'memimpin balapan!',2:'posisi ke-2!',3:'podium ke-3!'};
  document.getElementById('cel-rc-car').textContent=data.car||'🚗';
  document.getElementById('cel-rc-rank').textContent=RL[data.rank]||('#'+data.rank);
  document.getElementById('cel-rc-name').textContent=(data.name||'Kamu')+' '+(RM[data.rank]||'naik ranking!');
  document.getElementById('cel-rc-koin').textContent=data.koin||0;
  document.getElementById('cel-rc-done').textContent=data.done||'0/7';
  document.getElementById('cel-rc-streak').textContent='🔥'+(data.streak||0);
  const backdrop=document.getElementById('cel-race'),box=document.getElementById('cel-rc-box'),rankEl=document.getElementById('cel-rc-rank');
  makeStars('cel-rc-stars',16);backdrop.classList.add('open');
  if(G()){
    gsap.fromTo(box,{scale:.7,opacity:0},{scale:1,opacity:1,duration:.45,ease:'back.out(2)'});
    gsap.fromTo(document.getElementById('cel-rc-car'),{x:-100,opacity:0},{x:0,opacity:1,duration:.5,delay:.1,ease:'power3.out'});
    gsap.fromTo(rankEl,{scale:.3,opacity:0,rotation:15},{scale:1.1,opacity:1,rotation:0,duration:.4,delay:.3,ease:'back.out(2.5)',onComplete:()=>gsap.to(rankEl,{scale:1,duration:.2,ease:'power2.out'})});
    gsap.fromTo(box.querySelectorAll('.cel-speed-val'),{opacity:0,y:15},{opacity:1,y:0,stagger:.1,delay:.5,duration:.3,ease:'power3.out'});
    gsap.fromTo(box.querySelector('.cel-btn'),{opacity:0,y:16},{opacity:1,y:0,delay:.7,duration:.3,ease:'power3.out'});
  }
  if(data.rank===1){confBurst(60,1.3);vibrate([50,20,50,20,100]);}else vibrate([30,15,30]);
  SFX.fanfare();
};

CEL.garage=function(data){
  document.getElementById('cel-gr-preview').textContent=data.emoji||'🚗';
  document.getElementById('cel-gr-name').textContent=data.name||'Item';
  document.getElementById('cel-gr-desc').textContent=data.desc||'';
  makeChips('cel-gr-chips',[{text:`⭐ -${data.cost||0} Koin`,cls:''},{text:`Sisa: ${data.remaining||0} Koin`,cls:'green'}]);
  const backdrop=document.getElementById('cel-garage'),box=document.getElementById('cel-gr-box'),preview=document.getElementById('cel-gr-preview');
  makeStars('cel-gr-stars',12);backdrop.classList.add('open');
  if(G()){
    gsap.fromTo(box,{scale:.8,opacity:0,rotation:-3},{scale:1,opacity:1,rotation:0,duration:.4,ease:'back.out(1.8)'});
    gsap.fromTo(preview,{scale:0,rotation:-180},{scale:1,rotation:0,duration:.5,delay:.1,ease:'back.out(2)'});
    gsap.fromTo(box.querySelectorAll('.cel-garage-tag,.cel-garage-name,.cel-garage-desc-txt'),{opacity:0,y:12},{opacity:1,y:0,stagger:.08,delay:.35,duration:.3,ease:'power3.out'});
    gsap.fromTo(box.querySelectorAll('.cel-chip'),{opacity:0,x:-12},{opacity:1,x:0,stagger:.08,delay:.55,duration:.3,ease:'power3.out'});
    gsap.fromTo(box.querySelector('.cel-btn'),{opacity:0,y:14},{opacity:1,y:0,delay:.7,duration:.3,ease:'power3.out'});
  }
  setTimeout(()=>{const r=preview.getBoundingClientRect();burstParticles(r.left+r.width/2,r.top+r.height/2,['#2ECC71','#27AE60','#A9DFBF','#F1C40F'],10);},200);
  SFX.purchase();vibrate(40);
};

CEL.close=function(type){
  const el=document.getElementById('cel-'+type);if(!el)return;
  const box=el.querySelector('.cel-box');
  if(G()&&box){gsap.to(box,{scale:.9,opacity:0,y:20,duration:.25,ease:'power2.in',onComplete:()=>{el.classList.remove('open');gsap.set(box,{scale:1,opacity:1,y:0});const bar=box.querySelector('.cel-prog-fill');if(bar)bar.style.width='0';}}); }
  else el.classList.remove('open');
  confStop();
};

global.CEL=CEL;

// ─────────────────────────────────────────────
// AUTO-INTEGRASI KE HEROKU
// ─────────────────────────────────────────────
function waitApp(cb,n){
  n=n||0;if(n>100)return;
  if(typeof doCheckIn==='function'&&typeof STORE!=='undefined'&&STORE.students)cb();
  else setTimeout(()=>waitApp(cb,n+1),100);
}

function init(){
  injectCSS();injectHTML();

  // Resize canvas
  window.addEventListener('resize',()=>{const c=getCanvas();if(c){c.width=window.innerWidth;c.height=window.innerHeight;}});

  waitApp(()=>{
    // Patch doCheckIn
    const _orig=window.doCheckIn;
    window.doCheckIn=function(hb){
      const prevLevel=CU?CU.level:0;
      const prevStreak=CU?CU.streak:0;
      const prevRankFn=()=>{
        if(typeof STORE==='undefined') return 99;
        return [...STORE.students].sort((a,b)=>(b.koin||0)-(a.koin||0)).findIndex(s=>s.id===CU?.id)+1;
      };
      const prevRank=prevRankFn();
      _orig.call(this,hb);

      // Misi selesai
      CEL.mission({name:hb.name,emoji:hb.icon||'✅',koin:hb.koin,xp:hb.xp});

      setTimeout(()=>{
        // Semua misi selesai (7/7)
        const done=Object.keys(CU?.checkedToday||{}).length;
        if(done===7) CEL.perfect({koin:200,xp:300,streak:CU?.streak||0});

        // Level up
        if(CU&&CU.level>prevLevel) CEL.levelUp({level:CU.level,perks:['Kartu Baru 🃏','Koin Bonus ⭐']});

        // Streak milestone
        if(CU&&CU.streak>prevStreak&&[3,7,14,21,30].includes(CU.streak)){
          setTimeout(()=>CEL.mission({name:`🔥 Streak ${CU.streak} Hari!`,emoji:'🔥',koin:CU.streak*5,xp:CU.streak*10}),1500);
        }

        // Naik ranking
        const newRank=prevRankFn();
        if(newRank<prevRank&&newRank<=3){
          setTimeout(()=>CEL.race({rank:newRank,name:CU?.nickname||'Kamu',car:'🚗',koin:CU?.koin||0,done:done+'/7',streak:CU?.streak||0}),done===7?4000:1200);
        }
      },500);
    };

    // Patch showBuildingUnlock
    if(typeof window.showBuildingUnlock==='function'){
      const _orig=window.showBuildingUnlock;
      window.showBuildingUnlock=function(building,thenCelebrate){
        _orig.call(this,building,thenCelebrate);
        CEL.building({emoji:building?.emoji||'🏗️',name:building?.name||'Bangunan',desc:building?.desc||'Bangunan baru di desamu!',koin:building?.koin||50});
      };
    }

    // Patch showCardReveal (badge)
    if(typeof window.showCardReveal==='function'){
      const _orig=window.showCardReveal;
      window.showCardReveal=function(){
        _orig.call(this);
        // Ambil kartu terakhir yang didapat
        const cards=CU?.cards||[];
        const lastCardId=cards[cards.length-1];
        if(lastCardId&&typeof CARDS!=='undefined'){
          const card=CARDS.find(c=>c.id===lastCardId);
          if(card) setTimeout(()=>CEL.badge({icon:card.icon||'🃏',name:card.name,req:'Kartu koleksi',koin:10,xp:20}),300);
        }
      };
    }

    // Patch buySticker / buyUpgrade
    ['buySticker','buyUpgrade'].forEach(fn=>{
      if(typeof window[fn]==='function'){
        const _orig=window[fn];
        window[fn]=function(item){
          const result=_orig.apply(this,arguments);
          if(result!==false) CEL.garage({emoji:item?.emoji||'🎨',name:item?.name||'Item',desc:'Mobilmu makin keren!',cost:item?.cost||0,remaining:CU?.koin||0});
          return result;
        };
      }
    });

    // Patch setCarColor
    if(typeof window.setCarColor==='function'){
      const _orig=window.setCarColor;
      window.setCarColor=function(colorId){
        _orig.apply(this,arguments);
        CEL.garage({emoji:'🎨',name:'Cat Mobil Baru',desc:'Warna baru untuk mobilmu!',cost:30,remaining:CU?.koin||0});
      };
    }

    // User gesture untuk audio
    document.addEventListener('click',()=>{try{getAC();}catch(e){}},{once:true});
    document.addEventListener('touchstart',()=>{try{getAC();}catch(e){}},{once:true,passive:true});

    console.log('[CEL] Celebration System siap ✅');
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();

})(window);
