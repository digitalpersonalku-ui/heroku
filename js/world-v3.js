// ═══════════════════════════════════════════════════════════
// HEROKU WORLD ALIVE v3.0
// File: js/world-v3.js
//
// Pasang di index.html setelah bridge.js:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
//   <script src="js/world-v3.js"></script>
//
// API Publik:
//   WA.startIdle()               — mulai idle mobil
//   WA.stopIdle()                — hentikan idle
//   WA.move(toIdx, cb)           — gerakkan mobil ke waypoint
//   WA.setTarget(bldIdx)         — glow bangunan target
//   WA.burst(x, y, n, types)     — partikel di koordinat SVG
//   WA.unlock(bldIdx)            — animasi bangunan terbuka
//   WA.wind(ms)                  — angin kencang sementara
//   WA.rushClouds(ms)            — awan cepat sementara
//   WA.config(opts)              — kustomisasi ID & waypoints
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─── CSS INJECTION ──────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('_wa3css')) return;
    const s = document.createElement('style');
    s.id = '_wa3css';
    s.textContent = `
/* pohon */
.wa-tr{transform-origin:50% 100%;
  animation:waTrSway var(--spd,3.2s) ease-in-out infinite alternate var(--dl,0s)}
@keyframes waTrSway{
  from{transform:rotate(var(--a,-4deg)) scaleX(1)}
  to  {transform:rotate(var(--b, 3deg)) scaleX(1.03)}}
.wa-tr.wa-windy{animation-duration:.6s!important}

/* awan */
.wa-cld{animation:waCld var(--dur,36s) linear infinite var(--off,0s);will-change:transform}
@keyframes waCld{
  from{transform:translateX(var(--from,-150px))}
  to  {transform:translateX(var(--to,  820px))}}
.wa-cld.wa-rush{animation-duration:4.5s!important}

/* target glow */
.wa-target{animation:waGlow 1.3s ease-in-out infinite alternate}
@keyframes waGlow{
  from{filter:drop-shadow(0 0 3px rgba(255,210,0,.25))}
  to  {filter:drop-shadow(0 0 22px rgba(255,210,0,1))
              drop-shadow(0 0 44px rgba(255,150,0,.55))}}

/* asap cerobong */
.wa-smk{animation:waSmk var(--sd,2.4s) ease-out infinite var(--sl,0s);
  transform-origin:50% 100%}
@keyframes waSmk{
  0%  {opacity:.6;transform:translateY(0) scale(.7)}
  60% {opacity:.25;transform:translateY(-20px) scale(1.25) translateX(var(--sx,4px))}
  100%{opacity:0;transform:translateY(-38px) scale(1.65) translateX(var(--sx2,9px))}}

/* sparkle dekorasi */
.wa-spk{animation:waSpk var(--sd,1.9s) ease-in-out infinite var(--sl,0s)}
@keyframes waSpk{
  0%,100%{opacity:.15;transform:scale(.7) rotate(0)}
  50%    {opacity:1;  transform:scale(1.3) rotate(180deg)}}

/* ping waypoint */
.wa-ping{animation:waPing 2.2s ease-out infinite}
@keyframes waPing{
  0%{transform:scale(0);opacity:.95}
  80%,100%{transform:scale(2.8);opacity:0}}
    `;
    document.head.appendChild(s);
  }

  // ─── CONFIG ─────────────────────────────────────────────
  // Sesuaikan dengan ID elemen SVG HeroKu yang sebenarnya
  const CFG = {
    carId:      'world-car',       // <g id="world-car">
    wheelLId:   'world-wl',        // <g id="world-wl">
    wheelRId:   'world-wr',        // <g id="world-wr">
    shadowId:   'world-car-sh',    // <ellipse id="world-car-sh">
    fxId:       'world-fx',        // <g id="world-fx"> partikel
    fx2Id:      'world-fx2',       // <g id="world-fx2"> unlock
    bldPrefix:  'world-b',         // bangunan: "world-b0" … "world-b4"
    wpPrefix:   'world-d',         // milestone dots: "world-d0" …
    treeClass:  'wa-tr',           // class mahkota pohon SVG
    cloudClass: 'wa-cld',          // class grup awan SVG
    bldNames:   ['Rumah', 'Sekolah', 'Masjid', 'Taman Ilmu', 'Istana'],
    // Waypoints: sesuaikan dengan posisi jalan di SVG HeroKu
    waypoints: [
      { x: 55,  y: 374 },
      { x: 198, y: 304 },
      { x: 386, y: 280 },
      { x: 531, y: 296 },
      { x: 652, y: 365 },
    ],
  };

  // ─── SVG UTIL ───────────────────────────────────────────
  const NS = 'http://www.w3.org/2000/svg';
  function se(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    return el;
  }

  // ─── GSAP CHECK ─────────────────────────────────────────
  function G() { return typeof gsap !== 'undefined'; }

  // ─── AUDIO ──────────────────────────────────────────────
  let _ac = null;
  function gac() {
    if (!_ac) try { _ac = new (W.AudioContext || W.webkitAudioContext)(); } catch (e) {}
    return _ac;
  }
  function ra() { const c = gac(); if (c && c.state === 'suspended') c.resume(); }
  function nt(f, tp, pk, at, su, rl, t0) {
    const c = gac(); if (!c) return; ra();
    const o = c.createOscillator(), g = c.createGain();
    o.type = tp || 'sine'; o.frequency.value = f;
    const t = t0 || c.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(pk, t + at);
    g.gain.setValueAtTime(pk, t + at + su);
    g.gain.linearRampToValueAtTime(0, t + at + su + rl);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + at + su + rl + .05);
  }
  const SFX = {
    move()   { nt(260, 'sawtooth', .04, .01, .06, .2); },
    arrive() { [523, 659, 784].forEach((f, i) => nt(f, 'sine', .12, .01, .06, .1, i * .13)); },
    unlock() { [392, 494, 587, 784, 1047].forEach((f, i) => nt(f, 'triangle', .15, .01, .07, .09, i * .12)); },
  };
  ['click', 'touchstart'].forEach(ev =>
    document.addEventListener(ev, () => { try { gac(); } catch (e) {} }, { once: true, passive: true })
  );

  // ─── STATE ──────────────────────────────────────────────
  let _ci     = 0;       // current waypoint index
  let _moving = false;
  let _idleTl = null;
  let _whlTl  = null;
  let _exInt  = null;

  // ─── DOM GETTERS ────────────────────────────────────────
  const $ = id => document.getElementById(id);
  function car()  { return $(CFG.carId); }
  function carSh(){ return $(CFG.shadowId); }
  function wl()   { return $(CFG.wheelLId); }
  function wr()   { return $(CFG.wheelRId); }
  function fxP()  { return $(CFG.fxId); }
  function fxU()  { return $(CFG.fx2Id) || fxP(); }

  // ─── UPDATE MILESTONE DOTS ──────────────────────────────
  function updateDots() {
    CFG.waypoints.forEach((_, i) => {
      const d = $(CFG.wpPrefix + i); if (!d) return;
      if (i < _ci)       { d.setAttribute('fill', '#2ECC71'); d.setAttribute('opacity', '1'); }
      else if (i === _ci){ d.setAttribute('fill', '#F1C40F'); d.setAttribute('opacity', '1'); }
      else               { d.setAttribute('fill', '#95A5A6'); d.setAttribute('opacity', '.6'); }
    });
  }

  // ─── PARTICLE COLORS ────────────────────────────────────
  const COLS = ['#F1C40F','#E74C3C','#2ECC71','#3498DB',
                '#9B59B6','#E67E22','#FF69B4','#1ABC9C'];

  function pStar(fg, x, y) {
    if (!G()) return;
    const e = se('text', { x, y, 'text-anchor': 'middle',
      'font-size': 10 + Math.random() * 9, fill: '#F1C40F', opacity: 1 });
    e.textContent = ['✦','✧','⭐','★','✨'][Math.floor(Math.random() * 5)];
    fg.appendChild(e);
    gsap.fromTo(e,
      { attr: { y }, opacity: 1, scale: 0 },
      { attr: { y: y - 58 - Math.random() * 32, x: x + (Math.random() * 36 - 18) },
        opacity: 0, scale: 1.45, duration: .95 + Math.random() * .45,
        ease: 'power2.out', onComplete: () => e.remove() });
  }
  function pDot(fg, x, y) {
    if (!G()) return;
    const c = se('circle', {
      cx: x + (Math.random() * 14 - 7), cy: y + (Math.random() * 8 - 4),
      r: 3 + Math.random() * 5,
      fill: COLS[Math.floor(Math.random() * COLS.length)], opacity: .92 });
    fg.appendChild(c);
    const a = Math.random() * Math.PI * 2, d = 48 + Math.random() * 68;
    gsap.to(c, { attr: { cx: x + Math.cos(a)*d, cy: y + Math.sin(a)*d, r: .3 },
      opacity: 0, duration: .65 + Math.random() * .45, ease: 'power2.out',
      onComplete: () => c.remove() });
  }
  function pRect(fg, x, y) {
    if (!G()) return;
    const r = se('rect', {
      x: x + (Math.random() * 12 - 6), y,
      width: 6 + Math.random() * 6, height: 4 + Math.random() * 3,
      fill: COLS[Math.floor(Math.random() * COLS.length)],
      rx: 1, opacity: 1,
      transform: `rotate(${Math.random() * 360} ${x} ${y})` });
    fg.appendChild(r);
    const a = Math.random() * Math.PI * 2, d = 55 + Math.random() * 80;
    gsap.to(r, {
      attr: { x: x + Math.cos(a)*d, y: y + Math.sin(a)*d },
      rotation: 360 + Math.random() * 360,
      transformOrigin: `${x}px ${y}px`,
      opacity: 0, duration: .8 + Math.random() * .55,
      ease: 'power2.out', onComplete: () => r.remove() });
  }

  // ─── PUBLIC API ─────────────────────────────────────────
  const WA = {};

  // ── 1. IDLE ─────────────────────────────────────────────
  WA.startIdle = function () {
    if (_idleTl || !G()) return;
    const c = car(); if (!c) return;

    _idleTl = gsap.timeline({ repeat: -1, yoyo: true })
      .to(c, { y: -3.5, duration: 1.5, ease: 'sine.inOut' });

    const l = wl(), r = wr();
    if (l && r) {
      _whlTl = gsap.to([l, r], {
        rotation: 360, transformOrigin: '50% 50%',
        duration: 4, ease: 'none', repeat: -1,
      });
    }
    const sh = carSh();
    if (sh) {
      gsap.to(sh, {
        attr: { rx: 20, ry: 5 }, duration: 1.5,
        ease: 'sine.inOut', yoyo: true, repeat: -1,
      });
    }
  };

  WA.stopIdle = function () {
    if (_idleTl) { _idleTl.kill(); _idleTl = null; }
    if (_whlTl)  { _whlTl.kill();  _whlTl  = null; }
    const sh = carSh();
    if (sh) { gsap.killTweensOf(sh); gsap.set(sh, { attr: { rx: 24, ry: 6 } }); }
    const c = car();
    if (c) gsap.set(c, { y: 0 });
  };

  // ── 2. GERAK KE TARGET ──────────────────────────────────
  WA.move = function (toIdx, cb) {
    if (_moving || toIdx >= CFG.waypoints.length || !G()) return;
    const c = car(); if (!c) return;
    _moving = true;
    WA.stopIdle();

    const from = CFG.waypoints[_ci];
    const to   = CFG.waypoints[toIdx];
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const dur  = dist / 95; // px/detik

    // Roda cepat
    const l = wl(), r = wr();
    if (l && r) {
      _whlTl = gsap.to([l, r], {
        rotation: 360, transformOrigin: '50% 50%',
        duration: .55, ease: 'none', repeat: Math.ceil(dur / .55),
      });
    }

    // Asap knalpot
    _exInt = setInterval(() => {
      const fg = fxP(); if (!fg) return;
      const w = CFG.waypoints[_ci];
      const s = se('ellipse', {
        cx: w.x - 28 + (Math.random() * 6 - 3),
        cy: w.y - 20 + (Math.random() * 4 - 2),
        rx: 4 + Math.random() * 3, ry: 3 + Math.random() * 2,
        fill: 'rgba(190,190,190,.55)',
      });
      fg.appendChild(s);
      gsap.to(s, {
        attr: {
          cx: `+=${Math.random() * 14 - 7}`,
          cy: `-=${22 + Math.random() * 14}`,
          rx: 9 + Math.random() * 5, ry: 7 + Math.random() * 4,
        },
        opacity: 0, duration: .85 + Math.random() * .4,
        ease: 'power1.out', onComplete: () => s.remove(),
      });
    }, 240);

    // Timeline gerak
    gsap.timeline({
      onComplete() {
        clearInterval(_exInt);
        _ci = toIdx; _moving = false;
        if (_whlTl) { _whlTl.kill(); _whlTl = null; }
        WA.startIdle(); updateDots();
        SFX.arrive();
        if (cb) cb(toIdx);
      },
    })
    .to(c, {
      attr: { transform: `translate(${to.x - 22},${to.y - 36})` },
      duration: dur, ease: 'power2.inOut',
    })
    .to(c, { y: '-=3.5', duration: .2, ease: 'sine.inOut',
      yoyo: true, repeat: Math.ceil(dur / .4) }, 0);

    SFX.move();
  };

  // ── 3. ANGIN KENCANG ────────────────────────────────────
  WA.wind = function (ms) {
    ms = ms || 3200;
    document.querySelectorAll('.' + CFG.treeClass).forEach(t => {
      t.classList.add('wa-windy');
      setTimeout(() => t.classList.remove('wa-windy'), ms);
    });
  };

  // ── 4. AWAN CEPAT ───────────────────────────────────────
  WA.rushClouds = function (ms) {
    ms = ms || 3600;
    document.querySelectorAll('.' + CFG.cloudClass).forEach(c => {
      c.classList.add('wa-rush');
      setTimeout(() => c.classList.remove('wa-rush'), ms);
    });
  };

  // ── 5. TARGET GLOW ──────────────────────────────────────
  WA.setTarget = function (idx) {
    for (let i = 0; i < 10; i++) {
      const b = $(CFG.bldPrefix + i);
      if (b) b.classList.remove('wa-target');
    }
    if (idx < 0) return;
    const b = $(CFG.bldPrefix + idx); if (!b) return;
    b.classList.add('wa-target');
    if (!G()) return;

    const fg = fxP(); if (!fg) return;
    const w = CFG.waypoints[idx];
    [0, 1, 2].forEach(i => {
      setTimeout(() => {
        const ring = se('circle', {
          cx: w.x, cy: w.y, r: 9,
          fill: 'none', stroke: '#F1C40F',
          'stroke-width': 2.5, opacity: .95,
        });
        fg.appendChild(ring);
        gsap.to(ring, {
          attr: { r: 34 }, opacity: 0,
          duration: 1.1, ease: 'power2.out',
          onComplete: () => ring.remove(),
        });
      }, i * 300);
    });
  };

  // ── 6. PARTIKEL ─────────────────────────────────────────
  WA.burst = function (x, y, n, types) {
    if (!G()) return;
    const fg = fxP(); if (!fg) return;
    types = types || ['star', 'dot', 'rect'];
    const fn = {
      star: (a, b) => pStar(fg, a, b),
      dot:  (a, b) => pDot(fg, a, b),
      rect: (a, b) => pRect(fg, a, b),
    };
    for (let i = 0; i < (n || 12); i++) {
      const t = types[Math.floor(Math.random() * types.length)];
      setTimeout(() => fn[t] && fn[t](x, y), i * 20);
    }
  };

  // ── 7. BANGUNAN TERBUKA ─────────────────────────────────
  WA.unlock = function (idx) {
    if (!G()) return;
    const bld = $(CFG.bldPrefix + idx); if (!bld) return;
    const w   = CFG.waypoints[idx];
    const fg  = fxP();
    const fg2 = fxU();

    bld.classList.remove('wa-target');

    // Scale punch
    gsap.timeline()
      .to(bld, { scale: 1.2,  duration: .14, ease: 'power3.out', transformOrigin: '50% 100%' })
      .to(bld, { scale: .92,  duration: .12, ease: 'power2.in' })
      .to(bld, { scale: 1.09, duration: .1,  ease: 'power2.out' })
      .to(bld, { scale: 1,    duration: .14, ease: 'power2.in' });

    // Brightness flash
    gsap.to(bld, {
      filter: 'brightness(1.7)', duration: .18,
      yoyo: true, repeat: 7,
      onComplete: () => { bld.style.filter = ''; },
    });

    // Ring burst 3 lapis
    if (fg2) {
      ['#F1C40F', '#FFD700', '#FFA500'].forEach((stk, i) => {
        setTimeout(() => {
          const ring = se('circle', {
            cx: w.x, cy: w.y - 36, r: 14,
            fill: 'none', stroke: stk,
            'stroke-width': 3 - i * .6, opacity: .95,
          });
          fg2.appendChild(ring);
          gsap.to(ring, {
            attr: { r: 95 + i * 24 }, opacity: 0,
            duration: .75 + i * .15, ease: 'power2.out',
            onComplete: () => ring.remove(),
          });
        }, i * 140);
      });

      // Koin melayang
      for (let i = 0; i < 7; i++) {
        setTimeout(() => {
          const coin = se('text', {
            x: w.x + (i * 16 - 44), y: w.y - 22,
            'text-anchor': 'middle', 'font-size': 16, opacity: 1,
          });
          coin.textContent = '⭐';
          fg2.appendChild(coin);
          gsap.to(coin, {
            attr: { y: w.y - 100, x: w.x + (i * 16 - 44) + (Math.random() * 24 - 12) },
            opacity: 0, scale: 1.6, duration: 1.35,
            ease: 'power2.out', onComplete: () => coin.remove(),
          });
        }, i * 80);
      }

      // XP label
      setTimeout(() => {
        const xp = se('text', {
          x: w.x, y: w.y - 115,
          'text-anchor': 'middle', 'font-size': 17,
          'font-weight': 'bold', fill: '#F1C40F', opacity: 0,
        });
        xp.textContent = '+100 XP!';
        fg2.appendChild(xp);
        gsap.fromTo(xp,
          { attr: { y: w.y - 95 }, opacity: 0, scale: .5 },
          { attr: { y: w.y - 138 }, opacity: 1, scale: 1,
            duration: .52, ease: 'back.out(2.2)',
            onComplete: () => gsap.to(xp, {
              opacity: 0, delay: .95, duration: .4,
              onComplete: () => xp.remove(),
            }),
          });
      }, 320);
    }

    // Partikel 3 gelombang
    WA.burst(w.x, w.y - 30, 22, ['star']);
    setTimeout(() => WA.burst(w.x, w.y - 30, 20, ['rect']), 200);
    setTimeout(() => WA.burst(w.x, w.y - 30, 18, ['dot']), 380);

    SFX.unlock();
    if (navigator.vibrate) navigator.vibrate([30, 15, 30, 15, 60]);
  };

  // ── CONFIG API ──────────────────────────────────────────
  WA.config = function (opts) {
    Object.assign(CFG, opts || {});
  };

  // ── EXPOSE ──────────────────────────────────────────────
  W.WA = WA;

  // ─── AUTO-INTEGRASI KE HEROKU ───────────────────────────
  function waitApp(cb, n) {
    n = n || 0; if (n > 120) return;
    if (typeof STORE !== 'undefined' && STORE.students) cb();
    else setTimeout(() => waitApp(cb, n + 1), 100);
  }

  function boot() {
    injectCSS();

    waitApp(() => {

      // Patch tab dunia → aktifkan idle
      if (typeof W.switchPage === 'function') {
        const _o = W.switchPage;
        W.switchPage = function (page) {
          _o.call(this, page);
          const worldPages = ['dunia', 'world', 'desa', 'peta'];
          if (worldPages.includes(page)) {
            setTimeout(() => { WA.startIdle(); updateDots(); }, 350);
          } else {
            WA.stopIdle();
          }
        };
      }

      // Patch bangunan terbuka
      if (typeof W.showBuildingUnlock === 'function') {
        const _o = W.showBuildingUnlock;
        W.showBuildingUnlock = function (bld, then) {
          _o.call(this, bld, then);
          const idx = bld?.index ?? bld?.i ?? 0;
          setTimeout(() => WA.unlock(idx), 180);
        };
      }

      // Patch render world progress
      if (typeof W.renderWorldProgress === 'function') {
        const _o = W.renderWorldProgress;
        W.renderWorldProgress = function (student) {
          _o.call(this, student);
          setTimeout(() => {
            WA.startIdle();
            const prog = student?.totalDays || 0;
            const next = Math.min(Math.floor(prog / 7), 4);
            WA.setTarget(next);
            updateDots();
          }, 300);
        };
      }

      // Patch check-in → angin saat misi selesai
      if (typeof W.doCheckIn === 'function') {
        const _o = W.doCheckIn;
        W.doCheckIn = function (hb) {
          _o.call(this, hb);
          // Hembus angin kecil setiap check-in sebagai feedback
          WA.wind(1800);
        };
      }

      console.log('[WA v3] World Alive siap ✅');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
