// ═══════════════════════════════════════════════════════════
// HEROKU CELEBRATION SYSTEM v2.0
// File: js/celebration-v2.js
//
// PASANG di index.html setelah bridge.js:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
//   <script src="js/celebration-v2.js"></script>
//
// API Publik — panggil dari mana saja:
//   CEL.mission({name, emoji, koin, xp})          → toast ringan
//   CEL.perfect({koin, xp, streak})               → full screen
//   CEL.levelUp({level, perks:[]})                → full screen dramatis
//   CEL.badge({icon, name, req, koin, xp})        → modal stamp
//   CEL.building({emoji, name, desc, koin})       → modal world
//   CEL.race({rank, name, car, koin, done, streak}) → modal balapan
//   CEL.garage({emoji, name, desc, cost, left})   → modal garasi
// ═══════════════════════════════════════════════════════════

(function(W){
'use strict';

// ─── GSAP guard ───────────────────────────────────────────
function G(){ return typeof gsap !== 'undefined'; }

// ─── CSS ──────────────────────────────────────────────────
function injectCSS(){
  if(document.getElementById('_cel_css')) return;
  const s = document.createElement('style');
  s.id = '_cel_css';
  s.textContent = `
/* ── canvas konfeti ── */
#_cel_cv{position:fixed;inset:0;pointer-events:none;z-index:9001;width:100%;height:100%}

/* ── backdrop ── */
._cel_bd{position:fixed;inset:0;z-index:9100;background:rgba(10,10,18,.88);
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  display:none;align-items:center;justify-content:center;padding:16px}
._cel_bd.on{display:flex}

/* ── box dasar ── */
._cel_bx{position:relative;border-radius:24px;padding:28px 20px 24px;
  max-width:300px;width:100%;text-align:center;overflow:hidden}

/* ── star bg ── */
._cel_st{position:absolute;inset:0;overflow:hidden;pointer-events:none}
._cel_sd{position:absolute;border-radius:50%;background:rgba(255,255,255,.55);
  animation:_stk var(--d,2s) ease-in-out infinite var(--dl,0s)}
@keyframes _stk{0%,100%{opacity:.1;transform:scale(.7)}50%{opacity:1;transform:scale(1.3)}}

/* ── sinar ── */
._cel_ry{position:absolute;top:50%;left:50%;width:1.5px;
  transform-origin:0 0;
  background:linear-gradient(to right,transparent,rgba(255,255,255,.07),transparent)}

/* ── ring putar ── */
@keyframes _rr{from{transform:rotate(0)}to{transform:rotate(360deg)}}

/* ── mission toast ── */
#_cel_ms{position:fixed;top:66px;left:50%;
  transform:translateX(-50%) translateY(-18px);
  z-index:9200;opacity:0;pointer-events:none;
  max-width:310px;width:calc(100% - 28px)}
._cel_ms_in{background:linear-gradient(135deg,#16213E,#0F3460);
  border:1.5px solid rgba(46,204,113,.55);
  border-radius:18px;padding:11px 14px;
  display:flex;align-items:center;gap:11px;
  box-shadow:0 6px 24px rgba(0,0,0,.45);
  position:relative;overflow:hidden}
._cel_ms_ic{width:44px;height:44px;border-radius:12px;
  background:rgba(46,204,113,.15);
  display:flex;align-items:center;justify-content:center;
  font-size:22px;flex-shrink:0;position:relative}
._cel_ms_rg{position:absolute;inset:-4px;border-radius:14px;
  border:2px solid rgba(46,204,113,.55);
  animation:_msrg 1.5s ease-out infinite}
@keyframes _msrg{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.4);opacity:0}}
._cel_ms_lb{font-size:9px;font-weight:800;letter-spacing:1.4px;
  text-transform:uppercase;color:#2ECC71;margin-bottom:2px}
._cel_ms_nm{font-size:14px;font-weight:900;color:#fff}
._cel_ms_rw{font-size:10px;color:rgba(255,255,255,.5);margin-top:1px}
._cel_ms_sh{position:absolute;inset:0;border-radius:18px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);
  transform:translateX(-100%)}

/* ── perfect ── */
._cel_pf_bx{background:linear-gradient(160deg,#16213E,#0B1E3B,#16213E);
  border:1.5px solid rgba(241,196,15,.2)}
._cel_cr{font-size:68px;display:block;margin-bottom:6px;
  filter:drop-shadow(0 0 16px rgba(241,196,15,.55));
  animation:_crb 1.3s ease-in-out infinite alternate}
@keyframes _crb{from{transform:translateY(0) rotate(-4deg)}to{transform:translateY(-9px) rotate(4deg)}}
._cel_pf_t{font-size:26px;font-weight:900;color:#fff;margin-bottom:4px}
._cel_pf_s{font-size:12px;color:rgba(255,255,255,.5);margin-bottom:18px;line-height:1.65}

/* ── chips ── */
._cel_chs{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin-bottom:16px}
._cel_ch{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.13);
  border-radius:20px;padding:6px 14px;font-size:12px;font-weight:800;color:#fff}
._cel_ch.gd{background:rgba(241,196,15,.15);border-color:rgba(241,196,15,.3);color:#F1C40F}
._cel_ch.pu{background:rgba(142,68,173,.2);border-color:rgba(142,68,173,.3);color:#D7BDE2}
._cel_ch.bl{background:rgba(116,185,255,.15);border-color:rgba(116,185,255,.3);color:#74B9FF}
._cel_ch.gn{background:rgba(46,204,113,.15);border-color:rgba(46,204,113,.3);color:#2ECC71}

/* ── progress ── */
._cel_pw{background:rgba(255,255,255,.1);border-radius:5px;height:7px;overflow:hidden;margin-bottom:16px}
._cel_pf_{height:100%;border-radius:5px;background:linear-gradient(90deg,#F1C40F,#E67E22);width:0;transition:width 1.3s ease}

/* ── level up ── */
._cel_lu_bx{background:linear-gradient(160deg,#16213E,#3D1A78,#16213E);
  border:1.5px solid rgba(142,68,173,.3)}
._cel_lp{font-size:10px;font-weight:800;letter-spacing:3px;
  text-transform:uppercase;color:rgba(230,126,34,.8);margin-bottom:5px}
._cel_ln{font-size:96px;font-weight:900;color:#F1C40F;line-height:1;
  text-shadow:0 0 28px rgba(241,196,15,.45);display:block;margin-bottom:6px}
._cel_lt{font-size:20px;font-weight:900;color:#fff;margin-bottom:5px}
._cel_ls{font-size:12px;color:rgba(255,255,255,.48);margin-bottom:18px;line-height:1.65}
._cel_lps{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin-bottom:20px}
._cel_pk{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
  border-radius:20px;padding:5px 13px;font-size:10px;font-weight:700;color:rgba(255,255,255,.8)}

/* ── badge ── */
._cel_bg_bx{background:linear-gradient(160deg,#16213E,#1A350D,#16213E);
  border:1.5px solid rgba(230,126,34,.3)}
._cel_bg_sg{position:relative;width:106px;height:106px;margin:0 auto 14px}
._cel_bg_ro{position:absolute;inset:0;border-radius:50%;
  border:3px solid rgba(230,126,34,.35);animation:_rr 8s linear infinite}
._cel_bg_ri{position:absolute;inset:8px;border-radius:50%;
  border:2px dashed rgba(230,126,34,.2);animation:_rr 6s linear infinite reverse}
._cel_bg_ci{position:absolute;inset:16px;border-radius:50%;
  background:linear-gradient(135deg,rgba(230,126,34,.2),rgba(230,126,34,.05));
  border:2.5px solid rgba(230,126,34,.5);
  display:flex;align-items:center;justify-content:center;font-size:34px}
._cel_bn{font-size:21px;font-weight:900;color:#fff;margin-bottom:3px}
._cel_br{font-size:10px;color:rgba(255,255,255,.4);margin-bottom:16px}

/* ── building ── */
._cel_bl_bx{background:linear-gradient(160deg,#0B1E3B,#16213E,#0B2B3B);
  border:1.5px solid rgba(52,152,219,.3)}
._cel_be{font-size:68px;display:block;margin-bottom:10px;
  animation:_blf 2.2s ease-in-out infinite alternate;
  filter:drop-shadow(0 6px 16px rgba(52,152,219,.4))}
@keyframes _blf{from{transform:translateY(0) scale(1)}to{transform:translateY(-9px) scale(1.06)}}
._cel_bul{font-size:9px;font-weight:800;letter-spacing:2px;
  text-transform:uppercase;color:#74B9FF;margin-bottom:6px}
._cel_bln{font-size:22px;font-weight:900;color:#fff;margin-bottom:4px}
._cel_bld{font-size:11px;color:rgba(255,255,255,.48);margin-bottom:18px;line-height:1.65}

/* ── race ── */
._cel_rc_bx{background:linear-gradient(160deg,#2A0808,#16213E,#2A0808);
  border:1.5px solid rgba(231,76,60,.3)}
._cel_rc_c{font-size:52px;display:block;margin-bottom:8px;
  animation:_crc .38s ease-in-out infinite alternate}
@keyframes _crc{from{transform:translateX(-4px) rotate(-1.5deg)}to{transform:translateX(4px) rotate(1.5deg)}}
._cel_rk{font-size:68px;font-weight:900;color:#F1C40F;line-height:1;margin-bottom:3px;
  text-shadow:0 0 18px rgba(241,196,15,.45)}
._cel_rl{font-size:10px;letter-spacing:2px;text-transform:uppercase;
  color:rgba(255,255,255,.4);margin-bottom:5px}
._cel_rn{font-size:18px;font-weight:900;color:#fff;margin-bottom:16px}
._cel_rs{display:flex;justify-content:center;gap:18px;margin-bottom:18px}
._cel_sv{font-size:19px;font-weight:900;color:#fff;text-align:center}
._cel_sl{font-size:9px;color:rgba(255,255,255,.4);font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center}
._cel_sd2{width:1px;background:rgba(255,255,255,.1)}

/* ── garage ── */
._cel_gr_bx{background:linear-gradient(160deg,#16213E,#18331A,#16213E);
  border:1.5px solid rgba(46,204,113,.3)}
._cel_gp{width:96px;height:96px;border-radius:50%;
  background:rgba(46,204,113,.1);border:2px solid rgba(46,204,113,.3);
  display:flex;align-items:center;justify-content:center;font-size:46px;
  margin:0 auto 12px;animation:_gsp 4.5s linear infinite}
@keyframes _gsp{from{transform:rotate(0)}to{transform:rotate(360deg)}}
._cel_gt{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#2ECC71;margin-bottom:5px}
._cel_gn{font-size:21px;font-weight:900;color:#fff;margin-bottom:3px}
._cel_gd{font-size:11px;color:rgba(255,255,255,.45);margin-bottom:16px;line-height:1.65}

/* ── tombol ── */
._cel_btn{width:100%;padding:14px;border:none;border-radius:16px;
  font-size:14px;font-weight:900;cursor:pointer;transition:transform .15s}
._cel_btn:active{transform:scale(.97)}
._btn_gd{background:linear-gradient(135deg,#F1C40F,#E67E22);color:#16213E;box-shadow:0 5px 18px rgba(241,196,15,.3)}
._btn_gn{background:linear-gradient(135deg,#2ECC71,#27AE60);color:#fff;box-shadow:0 5px 18px rgba(46,204,113,.3)}
._btn_bl{background:linear-gradient(135deg,#3498DB,#1A5276);color:#fff;box-shadow:0 5px 18px rgba(52,152,219,.3)}
._btn_rd{background:linear-gradient(135deg,#E74C3C,#C0392B);color:#fff;box-shadow:0 5px 18px rgba(231,76,60,.3)}

/* ── float label ── */
._cel_fl{position:fixed;pointer-events:none;z-index:9300;
  font-weight:900;font-size:15px;border-radius:22px;
  padding:5px 13px;display:flex;align-items:center;gap:5px;
  box-shadow:0 3px 12px rgba(0,0,0,.2);will-change:transform,opacity}
._fl_cn{background:linear-gradient(135deg,#F1C40F,#D68910);color:#16213E}
._fl_xp{background:linear-gradient(135deg,#8E44AD,#6C3483);color:#fff}

/* ── particle ── */
._cel_pt{position:fixed;pointer-events:none;z-index:9200;border-radius:50%;will-change:transform,opacity}
  `;
  document.head.appendChild(s);
}

// ─── HTML ─────────────────────────────────────────────────
function injectHTML(){
  if(document.getElementById('_cel_ms')) return;
  document.body.insertAdjacentHTML('beforeend',`
<canvas id="_cel_cv"></canvas>

<!-- Mission toast -->
<div id="_cel_ms">
  <div class="_cel_ms_in">
    <div class="_cel_ms_ic"><div class="_cel_ms_rg"></div><span id="_ms_em">✅</span></div>
    <div><div class="_cel_ms_lb">MISI SELESAI!</div>
      <div class="_cel_ms_nm" id="_ms_nm">Misi</div>
      <div class="_cel_ms_rw" id="_ms_rw">+0 Koin</div></div>
    <div class="_cel_ms_sh" id="_ms_sh"></div>
  </div>
</div>

<!-- 2. Perfect -->
<div class="_cel_bd" id="_cel_pf">
  <div class="_cel_bx _cel_pf_bx" id="_pf_bx">
    <div class="_cel_ry" id="_pf_ry"></div><div class="_cel_st" id="_pf_st"></div>
    <span class="_cel_cr">👑</span>
    <div class="_cel_pf_t">HARI SEMPURNA!</div>
    <div class="_cel_pf_s" id="_pf_s">MasyaAllah — semua 7 kebiasaan selesai!</div>
    <div class="_cel_chs" id="_pf_cs"></div>
    <div class="_cel_pw"><div class="_cel_pf_" id="_pf_br"></div></div>
    <button class="_cel_btn _btn_gd" onclick="CEL.close('_cel_pf')">Alhamdulillah! 🏆</button>
  </div>
</div>

<!-- 3. Level Up -->
<div class="_cel_bd" id="_cel_lu">
  <div class="_cel_bx _cel_lu_bx" id="_lu_bx">
    <div class="_cel_ry" id="_lu_ry"></div><div class="_cel_st" id="_lu_st"></div>
    <div class="_cel_lp">✨ NAIK LEVEL ✨</div>
    <span class="_cel_ln" id="_lu_n">5</span>
    <div class="_cel_lt" id="_lu_t">NAIK LEVEL!</div>
    <div class="_cel_ls" id="_lu_s">Terus semangat!</div>
    <div class="_cel_lps" id="_lu_pk"></div>
    <div class="_cel_pw"><div class="_cel_pf_" id="_lu_br"></div></div>
    <button class="_cel_btn _btn_gd" onclick="CEL.close('_cel_lu')">Lanjutkan! 🚀</button>
  </div>
</div>

<!-- 4. Badge -->
<div class="_cel_bd" id="_cel_bg">
  <div class="_cel_bx _cel_bg_bx" id="_bg_bx">
    <div class="_cel_st" id="_bg_st"></div>
    <div style="font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#E67E22;margin-bottom:12px">🏅 BADGE BARU TERBUKA!</div>
    <div class="_cel_bg_sg">
      <div class="_cel_bg_ro"></div><div class="_cel_bg_ri"></div>
      <div class="_cel_bg_ci" id="_bg_ic">🌅</div>
    </div>
    <div class="_cel_bn" id="_bg_n">Badge</div>
    <div class="_cel_br" id="_bg_r"></div>
    <div class="_cel_chs" id="_bg_cs"></div>
    <button class="_cel_btn _btn_gd" onclick="CEL.close('_cel_bg')">Keren! 🎉</button>
  </div>
</div>

<!-- 5. Building -->
<div class="_cel_bd" id="_cel_bl">
  <div class="_cel_bx _cel_bl_bx" id="_bl_bx">
    <div class="_cel_st" id="_bl_st"></div>
    <span class="_cel_be" id="_bl_em">🏗️</span>
    <div class="_cel_bul">🏗️ BANGUNAN BARU TERBUKA!</div>
    <div class="_cel_bln" id="_bl_n">Bangunan</div>
    <div class="_cel_bld" id="_bl_d"></div>
    <div class="_cel_chs" id="_bl_cs"></div>
    <button class="_cel_btn _btn_bl" onclick="CEL.close('_cel_bl')">Kunjungi Desa! 🌍</button>
  </div>
</div>

<!-- 6. Race -->
<div class="_cel_bd" id="_cel_rc">
  <div class="_cel_bx _cel_rc_bx" id="_rc_bx">
    <div class="_cel_st" id="_rc_st"></div>
    <span class="_cel_rc_c" id="_rc_c">🚗</span>
    <div class="_cel_rk" id="_rc_rk">#1</div>
    <div class="_cel_rl">POSISI SEKARANG</div>
    <div class="_cel_rn" id="_rc_n">Kamu memimpin!</div>
    <div class="_cel_rs">
      <div><div class="_cel_sv" id="_rc_k">0</div><div class="_cel_sl">Koin</div></div>
      <div class="_cel_sd2"></div>
      <div><div class="_cel_sv" id="_rc_d">0/7</div><div class="_cel_sl">Hari Ini</div></div>
      <div class="_cel_sd2"></div>
      <div><div class="_cel_sv" id="_rc_s">🔥0</div><div class="_cel_sl">Streak</div></div>
    </div>
    <button class="_cel_btn _btn_rd" onclick="CEL.close('_cel_rc')">GAS TERUS! 🏁</button>
  </div>
</div>

<!-- 7. Garage -->
<div class="_cel_bd" id="_cel_gr">
  <div class="_cel_bx _cel_gr_bx" id="_gr_bx">
    <div class="_cel_st" id="_gr_st"></div>
    <div class="_cel_gp" id="_gr_p">🚗</div>
    <div class="_cel_gt">🛒 ITEM BARU DIPASANG!</div>
    <div class="_cel_gn" id="_gr_n">Item</div>
    <div class="_cel_gd" id="_gr_d"></div>
    <div class="_cel_chs" id="_gr_cs"></div>
    <button class="_cel_btn _btn_gn" onclick="CEL.close('_cel_gr')">Keren! 🚗</button>
  </div>
</div>
  `);
}

// ─── KONFETI ──────────────────────────────────────────────
let _cp=[],_craf=null,_ca=false;
const CC=['#F1C40F','#FF6B35','#52D98A','#6C5CE7','#FF7675','#74B9FF','#FD79A8','#A29BFE','#FFEAA7','#00B894'];
function _cv(){ return document.getElementById('_cel_cv'); }
function _cnp(x,y,sp){
  const cv=_cv(); sp=sp||1;
  return{x:x!=null?x:Math.random()*(cv?cv.width:W.innerWidth),y:y!=null?y:-10,
    vx:(Math.random()-.5)*9*sp,vy:Math.random()*5+2,rot:Math.random()*360,
    rotV:(Math.random()-.5)*9,w:7+Math.random()*9,h:4+Math.random()*7,
    color:CC[Math.floor(Math.random()*CC.length)],
    shape:Math.random()>.5?'rect':'circle',gravity:.14+Math.random()*.1,life:1};
}
function _ctk(){
  const cv=_cv();if(!cv)return;
  const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);
  _cp=_cp.filter(p=>{
    p.x+=p.vx;p.vy+=p.gravity;p.y+=p.vy;p.rot+=p.rotV;p.vx*=.99;p.life-=.007;
    ctx.save();ctx.globalAlpha=Math.max(0,p.life);
    ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;
    if(p.shape==='circle'){ctx.beginPath();ctx.ellipse(0,0,p.w/2,p.h/2,0,0,Math.PI*2);ctx.fill();}
    else ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
    ctx.restore();
    return p.life>0&&p.y<cv.height+50;
  });
  if(_cp.length>0)_craf=requestAnimationFrame(_ctk);
  else{_ca=false;ctx.clearRect(0,0,cv.width,cv.height);}
}
function confBurst(n,sp,x,y){
  const cv=_cv();if(!cv)return;
  cv.width=W.innerWidth;cv.height=W.innerHeight;
  for(let i=0;i<(n||50);i++) _cp.push(_cnp(x,y,sp));
  if(!_ca){_ca=true;if(_craf)cancelAnimationFrame(_craf);_ctk();}
}
function confStop(){
  _cp=[];_ca=false;
  const cv=_cv();if(cv)cv.getContext('2d').clearRect(0,0,cv.width,cv.height);
}
W.addEventListener('resize',()=>{const cv=_cv();if(cv){cv.width=W.innerWidth;cv.height=W.innerHeight;}});

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
  ding(){nt(880,'sine',.14,.01,.05,.11);nt(1100,'sine',.09,.01,.03,.09,.12);},
  badge(){[392,494,587,784].forEach((f,i)=>nt(f,'triangle',.17,.01,.06,.08,i*.1));},
  lvl(){[523,659,784,988,1047].forEach((f,i)=>nt(f,'sine',.19,.01,.06,.12,i*.12));},
  fanfare(){
    [523,659,784,1047].forEach((f,i)=>nt(f,'triangle',.21,.01,.05,.07,i*.08));
    setTimeout(()=>{[784,988,1175,1319,1568].forEach((f,i)=>nt(f,'sine',.17,.01,.04,.08,.38+i*.09));},0);
  },
  buy(){nt(659,'square',.05,.001,.02,.04);nt(880,'sine',.15,.01,.04,.1,.07);nt(1100,'sine',.11,.01,.04,.1,.18);},
};

// ─── HAPTIC ───────────────────────────────────────────────
function vib(p){if(navigator.vibrate)navigator.vibrate(p);}

// ─── HELPERS ──────────────────────────────────────────────
function mkStars(id,n){
  const el=document.getElementById(id);if(!el)return;el.innerHTML='';
  for(let i=0;i<n;i++){const d=document.createElement('div');d.className='_cel_sd';
    const sz=2+Math.random()*3;
    d.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${1.5+Math.random()*2}s;--dl:${Math.random()*1.5}s`;
    el.appendChild(d);}
}
function mkRays(id,n,h){
  const el=document.getElementById(id);if(!el)return;el.innerHTML='';
  for(let i=0;i<n;i++){const r=document.createElement('div');r.className='_cel_ry';
    r.style.cssText=`height:${h||220}px;transform:rotate(${i*(360/n)}deg) translateX(-50%);opacity:${.04+Math.random()*.1}`;
    el.appendChild(r);}
}
function mkChips(id,arr){
  const el=document.getElementById(id);if(!el)return;el.innerHTML='';
  arr.forEach(c=>{const d=document.createElement('div');d.className='_cel_ch '+(c.cls||'');d.textContent=c.t;el.appendChild(d);});
}
function floatLbl(txt,cls,x,y){
  if(!G())return;
  const el=document.createElement('div');el.className='_cel_fl '+cls;el.innerHTML=txt;document.body.appendChild(el);
  el.style.left=(x-el.offsetWidth/2)+'px';el.style.top=(y-el.offsetHeight/2)+'px';
  gsap.fromTo(el,{opacity:0,y:0,scale:.65},{opacity:1,y:-65,scale:1.05,duration:.35,ease:'back.out(2)',
    onComplete:()=>gsap.to(el,{opacity:0,y:'-=18',duration:.32,delay:.6,ease:'power2.in',onComplete:()=>el.remove()})});
}
function burstPt(cx,cy,colors,n){
  const w=document.createElement('div');
  w.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9200;overflow:hidden';
  document.body.appendChild(w);
  for(let i=0;i<(n||12);i++){
    const p=document.createElement('div');p.className='_cel_pt';
    const sz=7+Math.random()*9;
    p.style.cssText=`width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${cx}px;top:${cy}px`;
    w.appendChild(p);
    if(G()){const a=(i/(n||12))*Math.PI*2,d=55+Math.random()*65;
      gsap.fromTo(p,{x:0,y:0,opacity:1,scale:1},{x:Math.cos(a)*d,y:Math.sin(a)*d,opacity:0,scale:.2,duration:.72+Math.random()*.28,delay:Math.random()*.1,ease:'power2.out'});}
  }
  setTimeout(()=>w.remove(),1350);
}

// ─── PUBLIC API ───────────────────────────────────────────
const CEL={};

// ── 1. MISI SELESAI (toast 2.5 dtk, tidak blokir) ────────
CEL.mission=function(d){
  // d: {name,emoji,koin,xp}
  document.getElementById('_ms_em').textContent=d.emoji||'✅';
  document.getElementById('_ms_nm').textContent=d.name||'Misi';
  document.getElementById('_ms_rw').textContent=`+${d.koin||0} Koin · +${d.xp||0} XP`;
  const el=document.getElementById('_cel_ms'),sh=document.getElementById('_ms_sh');
  if(!G()){el.style.opacity=1;setTimeout(()=>el.style.opacity=0,2500);return;}
  gsap.killTweensOf(el);gsap.set(el,{opacity:0,y:-18,scale:.9});
  gsap.to(el,{opacity:1,y:0,scale:1,duration:.38,ease:'back.out(1.9)',
    onComplete:()=>{
      gsap.fromTo(sh,{x:'-100%'},{x:'200%',duration:.55,ease:'power2.inOut'});
      gsap.to(el,{opacity:0,y:-14,scale:.95,duration:.28,delay:1.85,ease:'power2.in'});
    }});
  const cx=W.innerWidth/2,cy=78;
  setTimeout(()=>floatLbl(`⭐ +${d.koin}`,'_fl_cn',cx-45,cy),280);
  setTimeout(()=>floatLbl(`✨ +${d.xp} XP`,'_fl_xp',cx+45,cy),460);
  SFX.ding();vib(28);
};

// ── 2. SEMUA MISI SELESAI (full screen) ──────────────────
CEL.perfect=function(d){
  // d: {koin,xp,streak}
  mkStars('_pf_st',18);mkRays('_pf_ry',14,260);
  mkChips('_pf_cs',[{t:`⭐ +${d.koin||200} Koin`,cls:'gd'},{t:`✨ +${d.xp||300} XP`,cls:'pu'},{t:'🔥 Streak +1'}]);
  const bd=document.getElementById('_cel_pf'),bx=document.getElementById('_pf_bx');
  bd.classList.add('on');
  if(G()){
    gsap.fromTo(bx,{scale:.48,opacity:0,rotationX:-16},{scale:1,opacity:1,rotationX:0,duration:.55,ease:'back.out(1.9)'});
    gsap.fromTo(bx.querySelector('._cel_cr'),{scale:0,rotation:-22},{scale:1,rotation:0,duration:.5,delay:.14,ease:'back.out(2.6)'});
    gsap.fromTo(bx.querySelectorAll('._cel_ch'),{opacity:0,y:14},{opacity:1,y:0,stagger:.07,delay:.34,duration:.32,ease:'power3.out'});
    gsap.fromTo(bx.querySelector('._cel_btn'),{opacity:0,y:18},{opacity:1,y:0,delay:.52,duration:.32,ease:'power3.out'});
  }
  setTimeout(()=>{const b=document.getElementById('_pf_br');if(b)b.style.width='100%';},480);
  confBurst(90,1.7);setTimeout(()=>confBurst(55,1.3,W.innerWidth*.22),580);setTimeout(()=>confBurst(55,1.3,W.innerWidth*.78),920);
  SFX.fanfare();vib([50,18,50,18,100,18,50]);
};

// ── 3. LEVEL UP (angka dramatis) ─────────────────────────
CEL.levelUp=function(d){
  // d: {level,perks:[]}
  const T=['','','Penjelajah Muda','Pahlawan Cilik','Pembela Kebaikan','Bintang Kelas','Pejuang Tangguh','Ahli Kebiasaan','Mentor Teman','Pemimpin Sejati','Legenda HeroKu'];
  const S=[,,'Perjalananmu baru dimulai!','Makin kuat setiap hari!','Kebaikanmu menginspirasi!','MasyaAllah — kamu bersinar!','Istiqomah adalah kunci surga!','Kebiasaan sudah jadi karaktermu!','Temanmu belajar darimu!','Pemimpin sejati!','Subhanallah — luar biasa!'];
  document.getElementById('_lu_n').textContent=d.level;
  document.getElementById('_lu_t').textContent=(T[Math.min(d.level,10)]||'NAIK LEVEL!').toUpperCase();
  document.getElementById('_lu_s').textContent=S[Math.min(d.level,10)]||'Terus semangat!';
  const pk=document.getElementById('_lu_pk');pk.innerHTML='';
  (d.perks||[]).forEach(p=>{const c=document.createElement('div');c.className='_cel_pk';c.textContent=p;pk.appendChild(c);});
  const bd=document.getElementById('_cel_lu'),bx=document.getElementById('_lu_bx'),num=document.getElementById('_lu_n');
  mkStars('_lu_st',20);mkRays('_lu_ry',16,280);bd.classList.add('on');
  if(G()){
    gsap.fromTo(num,{scale:.2,opacity:0,rotation:-12},{scale:1.15,opacity:1,rotation:0,duration:.45,delay:.1,ease:'back.out(2.6)',
      onComplete:()=>gsap.to(num,{scale:1,duration:.22,ease:'power2.out'})});
    gsap.fromTo(bx,{y:75,opacity:0},{y:0,opacity:1,duration:.48,ease:'power3.out'});
    const rays=bx.querySelectorAll('._cel_ry');
    if(rays.length)gsap.to(rays,{rotation:'+=360',duration:11,ease:'none',repeat:-1});
    const perks=pk.querySelectorAll('._cel_pk');
    if(perks.length)gsap.fromTo(perks,{opacity:0,x:-18},{opacity:1,x:0,stagger:.09,delay:.38,duration:.28,ease:'power3.out'});
    gsap.fromTo(bx.querySelector('._cel_btn'),{opacity:0,scale:.8},{opacity:1,scale:1,delay:.58,duration:.38,ease:'back.out(1.6)'});
  }
  setTimeout(()=>{const b=document.getElementById('_lu_br');if(b)b.style.width='100%';},380);
  confBurst(105,1.9);setTimeout(()=>confBurst(65,1.3,W.innerWidth*.18),380);setTimeout(()=>confBurst(65,1.3,W.innerWidth*.82),720);
  SFX.lvl();vib([50,14,50,14,100,14,50,14,100]);
};

// ── 4. BADGE UNLOCK (stamp animation) ────────────────────
CEL.badge=function(d){
  // d: {icon,name,req,koin,xp}
  document.getElementById('_bg_ic').textContent=d.icon||'🏅';
  document.getElementById('_bg_n').textContent=d.name||'Badge';
  document.getElementById('_bg_r').textContent=d.req||'';
  mkChips('_bg_cs',[{t:`⭐ +${d.koin||0} Koin`,cls:'gd'},{t:`✨ +${d.xp||0} XP`,cls:'pu'}]);
  const bd=document.getElementById('_cel_bg'),bx=document.getElementById('_bg_bx'),ic=document.getElementById('_bg_ic');
  mkStars('_bg_st',16);bd.classList.add('on');
  if(G()){
    gsap.fromTo(bx,{scale:.5,opacity:0,rotationY:-16},{scale:1,opacity:1,rotationY:0,duration:.55,ease:'back.out(1.9)'});
    gsap.fromTo(ic,{scale:3.2,opacity:0,rotation:22},{scale:1,opacity:1,rotation:0,duration:.45,delay:.24,ease:'back.out(2.1)',
      onComplete:()=>{gsap.fromTo(ic,{x:-4},{x:4,duration:.055,repeat:5,yoyo:true,ease:'none',onComplete:()=>gsap.set(ic,{x:0})});}});
    gsap.fromTo(bx.querySelectorAll('._cel_bg_ro,._cel_bg_ri'),{scale:0,opacity:0},{scale:1,opacity:1,duration:.38,delay:.14,ease:'power2.out'});
    gsap.fromTo(bx.querySelectorAll('._cel_ch'),{opacity:0,y:11},{opacity:1,y:0,stagger:.07,delay:.48,duration:.28,ease:'power3.out'});
    gsap.fromTo(bx.querySelector('._cel_btn'),{opacity:0,y:14},{opacity:1,y:0,delay:.62,duration:.28,ease:'power3.out'});
  }
  setTimeout(()=>{const r=ic.getBoundingClientRect();burstPt(r.left+r.width/2,r.top+r.height/2,['#E67E22','#F39C12','#F1C40F','#D35400'],14);},260);
  confBurst(48,1.1);SFX.badge();vib([28,14,28,14,58]);
};

// ── 5. BANGUNAN BARU (float & bounce) ────────────────────
CEL.building=function(d){
  // d: {emoji,name,desc,koin}
  document.getElementById('_bl_em').textContent=d.emoji||'🏗️';
  document.getElementById('_bl_n').textContent=d.name||'Bangunan';
  document.getElementById('_bl_d').textContent=d.desc||'';
  mkChips('_bl_cs',[{t:`⭐ +${d.koin||0} Koin`,cls:'gd'},{t:'🏗️ Bangunan Baru',cls:'bl'}]);
  const bd=document.getElementById('_cel_bl'),bx=document.getElementById('_bl_bx'),em=document.getElementById('_bl_em');
  mkStars('_bl_st',14);bd.classList.add('on');
  if(G()){
    gsap.fromTo(bx,{y:58,opacity:0,scale:.88},{y:0,opacity:1,scale:1,duration:.48,ease:'back.out(1.7)'});
    gsap.fromTo(em,{y:-85,opacity:0,scale:1.6,rotation:-14},{y:0,opacity:1,scale:1,rotation:0,duration:.55,delay:.1,ease:'bounce.out'});
    gsap.fromTo(bx.querySelectorAll('._cel_bul,._cel_bln,._cel_bld'),{opacity:0,y:14},{opacity:1,y:0,stagger:.09,delay:.44,duration:.32,ease:'power3.out'});
    gsap.fromTo(bx.querySelectorAll('._cel_ch'),{opacity:0,scale:.78},{opacity:1,scale:1,stagger:.07,delay:.62,duration:.28,ease:'back.out(1.5)'});
    gsap.fromTo(bx.querySelector('._cel_btn'),{opacity:0,y:14},{opacity:1,y:0,delay:.78,duration:.28,ease:'power3.out'});
  }
  setTimeout(()=>{const r=em.getBoundingClientRect();burstPt(r.left+r.width/2,r.top+r.height/2,['#74B9FF','#0984E3','#DFE6E9'],14);},190);
  confBurst(42,1.05);SFX.ding();setTimeout(()=>SFX.badge(),380);vib([38,14,38]);
};

// ── 6. NAIK RANKING (number roll) ────────────────────────
CEL.race=function(d){
  // d: {rank,name,car,koin,done,streak}
  const RL=['','#1','#2','#3','#4'];
  const RM={1:'memimpin balapan!',2:'posisi ke-2!',3:'podium ke-3!'};
  document.getElementById('_rc_c').textContent=d.car||'🚗';
  document.getElementById('_rc_rk').textContent=RL[d.rank]||('#'+d.rank);
  document.getElementById('_rc_n').textContent=(d.name||'Kamu')+' '+(RM[d.rank]||'naik ranking!');
  document.getElementById('_rc_k').textContent=d.koin||0;
  document.getElementById('_rc_d').textContent=d.done||'0/7';
  document.getElementById('_rc_s').textContent='🔥'+(d.streak||0);
  const bd=document.getElementById('_cel_rc'),bx=document.getElementById('_rc_bx'),rk=document.getElementById('_rc_rk');
  mkStars('_rc_st',16);bd.classList.add('on');
  if(G()){
    gsap.fromTo(bx,{scale:.68,opacity:0},{scale:1,opacity:1,duration:.44,ease:'back.out(2.1)'});
    gsap.fromTo(document.getElementById('_rc_c'),{x:-105,opacity:0},{x:0,opacity:1,duration:.48,delay:.1,ease:'power3.out'});
    gsap.fromTo(rk,{scale:.28,opacity:0,rotation:16},{scale:1.12,opacity:1,rotation:0,duration:.4,delay:.28,ease:'back.out(2.6)',
      onComplete:()=>gsap.to(rk,{scale:1,duration:.2,ease:'power2.out'})});
    gsap.fromTo(bx.querySelectorAll('._cel_sv'),{opacity:0,y:14},{opacity:1,y:0,stagger:.09,delay:.48,duration:.28,ease:'power3.out'});
    gsap.fromTo(bx.querySelector('._cel_btn'),{opacity:0,y:14},{opacity:1,y:0,delay:.66,duration:.28,ease:'power3.out'});
  }
  if(d.rank===1){confBurst(65,1.4);vib([50,18,50,18,100]);}else vib([28,14,28]);
  SFX.fanfare();
};

// ── 7. BELI ITEM GARASI (spin & burst) ───────────────────
CEL.garage=function(d){
  // d: {emoji,name,desc,cost,left}
  document.getElementById('_gr_p').textContent=d.emoji||'🚗';
  document.getElementById('_gr_n').textContent=d.name||'Item';
  document.getElementById('_gr_d').textContent=d.desc||'';
  mkChips('_gr_cs',[{t:`⭐ -${d.cost||0} Koin`},{t:`Sisa: ${d.left||0} Koin`,cls:'gn'}]);
  const bd=document.getElementById('_cel_gr'),bx=document.getElementById('_gr_bx'),pv=document.getElementById('_gr_p');
  mkStars('_gr_st',12);bd.classList.add('on');
  if(G()){
    gsap.fromTo(bx,{scale:.78,opacity:0,rotation:-3.5},{scale:1,opacity:1,rotation:0,duration:.38,ease:'back.out(1.9)'});
    gsap.fromTo(pv,{scale:0,rotation:-185},{scale:1,rotation:0,duration:.52,delay:.1,ease:'back.out(2.1)'});
    gsap.fromTo(bx.querySelectorAll('._cel_gt,._cel_gn,._cel_gd'),{opacity:0,y:11},{opacity:1,y:0,stagger:.07,delay:.34,duration:.28,ease:'power3.out'});
    gsap.fromTo(bx.querySelectorAll('._cel_ch'),{opacity:0,x:-11},{opacity:1,x:0,stagger:.07,delay:.52,duration:.28,ease:'power3.out'});
    gsap.fromTo(bx.querySelector('._cel_btn'),{opacity:0,y:12},{opacity:1,y:0,delay:.68,duration:.28,ease:'power3.out'});
  }
  setTimeout(()=>{const r=pv.getBoundingClientRect();burstPt(r.left+r.width/2,r.top+r.height/2,['#2ECC71','#27AE60','#A9DFBF','#F1C40F'],10);},188);
  SFX.buy();vib(38);
};

// ── CLOSE ─────────────────────────────────────────────────
CEL.close=function(id){
  const el=document.getElementById(id);if(!el)return;
  const bx=el.querySelector('._cel_bx');
  if(G()&&bx){
    gsap.to(bx,{scale:.88,opacity:0,y:18,duration:.24,ease:'power2.in',
      onComplete:()=>{el.classList.remove('on');gsap.set(bx,{scale:1,opacity:1,y:0});
        const br=bx.querySelector('._cel_pf_');if(br)br.style.width='0';
      }});
  }else el.classList.remove('on');
  confStop();
};

W.CEL=CEL;

// ─── INTEGRASI OTOMATIS KE HEROKU ────────────────────────
function waitApp(cb,n){
  n=n||0;if(n>120)return;
  if(typeof doCheckIn==='function'&&typeof STORE!=='undefined'&&STORE.students)cb();
  else setTimeout(()=>waitApp(cb,n+1),100);
}

function boot(){
  injectCSS();injectHTML();

  waitApp(()=>{
    // Patch doCheckIn
    const _oCI=W.doCheckIn;
    W.doCheckIn=function(hb){
      const pLv=typeof CU!=='undefined'?CU.level:0;
      const pSt=typeof CU!=='undefined'?CU.streak:0;
      const getRank=()=>{
        if(typeof STORE==='undefined'||!STORE.students)return 99;
        return [...STORE.students].sort((a,b)=>(b.koin||0)-(a.koin||0)).findIndex(s=>s.id===(typeof CU!=='undefined'?CU.id:null))+1;
      };
      const pRk=getRank();
      _oCI.call(this,hb);

      // 1. Misi selesai — selalu
      CEL.mission({name:hb.name,emoji:hb.icon||'✅',koin:hb.koin||0,xp:hb.xp||0});

      setTimeout(()=>{
        if(typeof CU==='undefined')return;
        const done=Object.keys(CU.checkedToday||{}).length;

        // 2. 7/7 sempurna
        if(done===7) CEL.perfect({koin:200,xp:300,streak:CU.streak||0});

        // 3. Level up
        if(CU.level>pLv){
          const perks=['Kartu Koleksi Baru 🃏','Koin Bonus ⭐'];
          if(CU.level>=5) perks.push('Stiker Eksklusif ✨');
          if(CU.level>=7) perks.push('Mode Khusus 🎓');
          setTimeout(()=>CEL.levelUp({level:CU.level,perks}),done===7?3800:500);
        }

        // Streak milestone
        if(CU.streak>pSt&&[3,7,14,21,30].includes(CU.streak)){
          setTimeout(()=>CEL.mission({name:`🔥 Streak ${CU.streak} Hari!`,emoji:'🔥',koin:CU.streak*5,xp:CU.streak*10}),1600);
        }

        // 6. Naik ranking
        const nRk=getRank();
        if(nRk<pRk&&nRk<=3){
          setTimeout(()=>CEL.race({rank:nRk,name:CU.nickname||'Kamu',car:'🚗',koin:CU.koin||0,done:done+'/7',streak:CU.streak||0}),done===7?5500:1300);
        }
      },550);
    };

    // Patch showBuildingUnlock
    if(typeof W.showBuildingUnlock==='function'){
      const _o=W.showBuildingUnlock;
      W.showBuildingUnlock=function(b,tc){
        _o.call(this,b,tc);
        CEL.building({emoji:b?.emoji||'🏗️',name:b?.name||'Bangunan',desc:b?.desc||'Bangunan baru hadir di desamu!',koin:b?.koin||50});
      };
    }

    // Patch buySticker / buyUpgrade / setCarColor
    ['buySticker','buyUpgrade'].forEach(fn=>{
      if(typeof W[fn]==='function'){
        const _o=W[fn];
        W[fn]=function(item){
          const r=_o.apply(this,arguments);
          if(r!==false)CEL.garage({emoji:item?.emoji||'🎨',name:item?.name||'Item Baru',desc:'Mobilmu makin keren!',cost:item?.cost||0,left:typeof CU!=='undefined'?CU.koin:0});
          return r;
        };
      }
    });
    if(typeof W.setCarColor==='function'){
      const _o=W.setCarColor;
      W.setCarColor=function(){
        _o.apply(this,arguments);
        CEL.garage({emoji:'🎨',name:'Cat Baru',desc:'Warna baru untuk mobilmu di sirkuit!',cost:30,left:typeof CU!=='undefined'?CU.koin:0});
      };
    }

    // User gesture → unlock audio
    ['click','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{try{gAC();}catch(e){}},{once:true,passive:true}));
    console.log('[CEL v2] Celebration System siap ✅');
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();

})(window);
