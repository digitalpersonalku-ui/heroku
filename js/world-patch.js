// ═══════════════════════════════════════════════════════════
// HEROKU WORLD PATCH — Animasi Dunia Hidup
// File: js/world-patch.js
//
// Cara pasang di index.html — tambah 2 baris setelah bridge.js:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
//   <script src="js/world-patch.js"></script>
//
// Cara kerja:
//   - Patch renderWorld() yang sudah ada di app.js
//   - Inject CSS animasi ke <head>
//   - Setelah renderWorld() selesai, jalankan animasi GSAP
//   - Tidak mengubah satu baris pun di file lama
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  /* ══════════════════════════════════════════════════════
     1. INJECT CSS — semua keyframe & class animasi
  ══════════════════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById('_wp_css')) return;
    const s = document.createElement('style');
    s.id = '_wp_css';
    s.textContent = `

/* ── Awan bergerak ─────────────────────────────── */
.wp-cloud {
  animation: wpCloud var(--dur, 38s) linear infinite var(--off, 0s);
  will-change: transform;
}
@keyframes wpCloud {
  from { transform: translateX(var(--from, -160px)); }
  to   { transform: translateX(var(--to,   420px));  }
}

/* ── Pohon bergoyang ────────────────────────────── */
/* transform-origin di bawah supaya goyang dari pangkal */
.wp-tree {
  transform-origin: 50% 100%;
  display: inline-block;
  animation: wpTree var(--spd, 3.2s) ease-in-out
             infinite alternate var(--dl, 0s);
}
@keyframes wpTree {
  from { transform: rotate(var(--a, -5deg)) scaleX(1);    }
  to   { transform: rotate(var(--b,  4deg)) scaleX(1.04); }
}

/* ── Mobil idle bounce ──────────────────────────── */
.wp-car-idle {
  animation: wpCarBounce 1.6s ease-in-out infinite alternate;
}
@keyframes wpCarBounce {
  from { transform: translateY(0px);   }
  to   { transform: translateY(-3px);  }
}

/* ── Mobil gerak — roda berputar ────────────────── */
.wp-wheel {
  animation: wpWheel var(--spd, 0.6s) linear infinite;
  transform-origin: 50% 50%;
}
@keyframes wpWheel {
  from { transform: rotate(0deg);   }
  to   { transform: rotate(360deg); }
}

/* ── Asap knalpot mobil ─────────────────────────── */
.wp-exhaust {
  animation: wpExhaust var(--dur, 1.2s) ease-out
             infinite var(--off, 0s);
  transform-origin: 50% 100%;
}
@keyframes wpExhaust {
  0%   { opacity: 0.55; transform: translateY(0)    scale(0.7);  }
  60%  { opacity: 0.25; transform: translateY(-14px) scale(1.2); }
  100% { opacity: 0;    transform: translateY(-26px) scale(1.6); }
}

/* ── Nitro api ──────────────────────────────────── */
@keyframes nitroFlame {
  0%, 100% { transform: scaleX(1)   scaleY(1);   opacity: 0.9; }
  50%       { transform: scaleX(1.4) scaleY(0.7); opacity: 0.6; }
}

/* ── Bangunan target glow ───────────────────────── */
.wp-target-pulse {
  animation: wpTargetGlow 1.3s ease-in-out infinite alternate;
}
@keyframes wpTargetGlow {
  from { filter: drop-shadow(0 0 3px  rgba(255,224,0,.3)); }
  to   { filter: drop-shadow(0 0 18px rgba(255,224,0,1))
                 drop-shadow(0 0 36px rgba(255,160,0,.6)); }
}

/* ── Bintang dekorasi ───────────────────────────── */
.wp-sparkle {
  animation: wpSpk var(--dur, 2s) ease-in-out
             infinite var(--off, 0s);
}
@keyframes wpSpk {
  0%, 100% { opacity: 0.15; transform: scale(0.7) rotate(0deg);   }
  50%       { opacity: 1;    transform: scale(1.3) rotate(180deg); }
}

/* ── Asap cerobong bangunan ─────────────────────── */
.wp-chimney {
  animation: wpChimney var(--dur, 2.4s) ease-out
             infinite var(--off, 0s);
  transform-origin: 50% 100%;
}
@keyframes wpChimney {
  0%   { opacity: 0.6;  transform: translateY(0)    scale(0.8); }
  60%  { opacity: 0.25; transform: translateY(-16px) scale(1.2); }
  100% { opacity: 0;    transform: translateY(-30px) scale(1.5); }
}

/* ── Partikel unlock ────────────────────────────── */
.wp-unlock-ring {
  animation: wpRing var(--dur, 0.8s) ease-out forwards;
}
@keyframes wpRing {
  from { r: 10px; opacity: 0.95; }
  to   { r: 90px; opacity: 0;    }
}

/* ── Rainbow pulse ──────────────────────────────── */
@keyframes rainbowFade {
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 1;   }
}

/* ── Rain animasi ───────────────────────────────── */
@keyframes weatherRain {
  0%   { transform: translateY(-20px); opacity: 0.4; }
  100% { transform: translateY(120px); opacity: 0;   }
}
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════
     2. AUDIO ENGINE
  ══════════════════════════════════════════════════════ */
  let _ac = null;
  function gAC() {
    if (!_ac) try { _ac = new (W.AudioContext || W.webkitAudioContext)(); } catch (e) {}
    return _ac;
  }
  function rAC() { const c = gAC(); if (c && c.state === 'suspended') c.resume(); }
  function nt(f, tp, pk, at, su, rl, t0) {
    const c = gAC(); if (!c) return; rAC();
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
    arrive() { [523, 659, 784].forEach((f, i) => nt(f, 'sine', .11, .01, .06, .1, i * .12)); },
    unlock() { [392, 494, 587, 784, 1047].forEach((f, i) => nt(f, 'triangle', .14, .01, .07, .09, i * .12)); },
  };
  ['click', 'touchstart'].forEach(ev =>
    document.addEventListener(ev, () => { try { gAC(); } catch (e) {} }, { once: true, passive: true })
  );

  /* ══════════════════════════════════════════════════════
     3. SVG HELPER
  ══════════════════════════════════════════════════════ */
  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    return el;
  }

  /* ══════════════════════════════════════════════════════
     4. ANIMASI UTAMA — dipanggil setelah renderWorld()
  ══════════════════════════════════════════════════════ */

  // Mencari SVG dunia yang baru di-render
  function getWorldSVG() {
    const disp = document.getElementById('world-display');
    return disp ? disp.querySelector('svg') : null;
  }

  // ID counter supaya animasi tidak tabrakan
  let _animId = 0;

  function animateWorld() {
    const svg = getWorldSVG();
    if (!svg) return;

    _animId++;
    const aid = _animId; // tangkap untuk cek apakah masih valid

    const G = typeof gsap !== 'undefined';

    /* ── A. AWAN BERGERAK ──────────────────────────── */
    // Cari semua grup awan (opacity .6-.75, ellipse putih)
    const cloudGroups = svg.querySelectorAll('g[opacity]');
    let cloudIdx = 0;
    cloudGroups.forEach(g => {
      const firstEl = g.querySelector('ellipse');
      if (!firstEl) return;
      const fill = firstEl.getAttribute('fill');
      if (fill !== 'white' && fill !== '#fff') return;

      // Ini awan — tambahkan animasi drift
      g.classList.add('wp-cloud');
      const speeds = [34, 48, 58, 41];
      const offsets = ['-5s', '-22s', '-37s', '-17s'];
      const froms   = ['-160px', '-100px', '-80px', '-110px'];
      const tos     = ['430px', '430px', '430px', '430px'];

      g.style.setProperty('--dur',  (speeds[cloudIdx % 4] || 36) + 's');
      g.style.setProperty('--off',  offsets[cloudIdx % 4] || '0s');
      g.style.setProperty('--from', froms[cloudIdx % 4] || '-150px');
      g.style.setProperty('--to',   tos[cloudIdx % 4] || '430px');
      cloudIdx++;
    });

    /* ── B. POHON BERGOYANG ────────────────────────── */
    // Pohon dirender sebagai <text> emoji di SVG
    const allText = svg.querySelectorAll('text');
    const treeEmojis = ['🌲', '🌳', '🌿', '🌴', '🎋'];
    let treeIdx = 0;
    allText.forEach(t => {
      const content = t.textContent.trim();
      if (!treeEmojis.includes(content)) return;

      // Bungkus dengan <g> yang punya transform-origin bawah
      // (karena <text> tidak bisa langsung diberi transform-origin SVG)
      // Kita tambahkan class animasi langsung, pakai CSS transform
      t.classList.add('wp-tree');
      const spds = [3.2, 2.8, 3.6, 3.0, 2.5];
      const dls  = ['0s', '.4s', '.7s', '.2s', '1s'];
      const as   = ['-5deg', '-4deg', '-6deg', '-3deg', '-5deg'];
      const bs   = ['4deg',  '3deg',  '4deg',  '5deg',  '3deg'];
      t.style.setProperty('--spd', spds[treeIdx % 5] + 's');
      t.style.setProperty('--dl',  dls[treeIdx % 5]);
      t.style.setProperty('--a',   as[treeIdx % 5]);
      t.style.setProperty('--b',   bs[treeIdx % 5]);
      treeIdx++;
    });

    /* ── C. MOBIL IDLE BOUNCE ──────────────────────── */
    // Cari grup mobil — posisi dari getCarPos()
    // Mobil ada di dalam <g transform="translate(x,y)"> dekat akhir SVG
    // Kita cari <g> yang mengandung path body mobil
    const carGroups = svg.querySelectorAll('g[transform^="translate"]');
    let carG = null;
    carGroups.forEach(g => {
      // Mobil mengandung path dengan d yang panjang (body mobil)
      const paths = g.querySelectorAll('path');
      if (paths.length >= 3) {
        // Cek apakah ada path yang mirip body mobil (panjang d)
        for (const p of paths) {
          const d = p.getAttribute('d') || '';
          if (d.includes('Q') && d.length > 50) {
            carG = g; break;
          }
        }
      }
    });

    if (carG) {
      carG.classList.add('wp-car-idle');

      // Tambah asap knalpot kecil
      addExhaustSmoke(svg, carG);
    }

    /* ── D. BANGUNAN TARGET — tambahkan class glow ─── */
    // Bangunan target sudah punya <circle> dengan animate SVG
    // Kita tambahkan CSS glow di atasnya
    const animCircles = svg.querySelectorAll('circle[stroke="#FFE066"]');
    // Cari parent group bangunan target
    animCircles.forEach(circle => {
      const parentG = circle.closest('g');
      if (parentG) parentG.classList.add('wp-target-pulse');
    });

    /* ── E. SPARKLE DEKORASI ───────────────────────── */
    addSparkles(svg);

    /* ── F. ASAP CEROBONG BANGUNAN ─────────────────── */
    addChimneySmoke(svg);

    /* ── G. GSAP EXTRAS (jika GSAP tersedia) ──────── */
    if (G) animateWithGSAP(svg, aid);
  }

  /* ── Asap knalpot mobil ──────────────────────────── */
  function addExhaustSmoke(svg, carG) {
    // Ambil posisi translate dari transform="translate(x,y)"
    const tx = carG.getAttribute('transform') || '';
    const match = tx.match(/translate\(([^,]+),([^)]+)\)/);
    if (!match) return;

    const cx = parseFloat(match[1]) - 15; // sedikit ke kiri (belakang mobil)
    const cy = parseFloat(match[2]) + 8;

    [0, 1].forEach(i => {
      const smk = svgEl('ellipse', {
        cx, cy,
        rx: 4, ry: 3.5,
        fill: 'rgba(200,200,200,0.55)',
        class: 'wp-exhaust',
      });
      smk.style.setProperty('--dur', (1.2 + i * .35) + 's');
      smk.style.setProperty('--off', (i * .55) + 's');
      svg.appendChild(smk);
    });
  }

  /* ── Bintang sparkle di tanah ─────────────────────── */
  function addSparkles(svg) {
    // Hanya tambah jika belum ada
    if (svg.querySelector('.wp-sparkle')) return;

    const positions = [
      { x: 30,  y: 390 },
      { x: 200, y: 310 },
      { x: 340, y: 200 },
      { x: 50,  y: 250 },
    ];
    positions.forEach((pos, i) => {
      const t = svgEl('text', {
        x: pos.x, y: pos.y,
        'text-anchor': 'middle',
        'font-size': 7 + Math.random() * 5,
        fill: 'rgba(255,255,255,0.7)',
        class: 'wp-sparkle',
      });
      t.textContent = '✦';
      t.style.setProperty('--dur', (1.6 + i * .4) + 's');
      t.style.setProperty('--off', (i * .35) + 's');
      svg.appendChild(t);
    });
  }

  /* ── Asap cerobong bangunan ─────────────────────── */
  function addChimneySmoke(svg) {
    if (svg.querySelector('.wp-chimney')) return;

    // Posisi cerobong perkiraan (rumah kira2 di start area)
    // Berdasarkan kode: WPS[0] = {x:190, y:585}
    // Bangunan di sisi kanan/kiri offset 70px
    const chimneys = [
      { x: 262, y: 530 }, // bangunan waypoint 0
      { x: 50,  y: 455 }, // bangunan waypoint 1
    ];
    chimneys.forEach((c, i) => {
      const smk = svgEl('ellipse', {
        cx: c.x, cy: c.y,
        rx: 5, ry: 4,
        fill: 'rgba(210,210,210,0.6)',
        class: 'wp-chimney',
      });
      smk.style.setProperty('--dur', (2.2 + i * .4) + 's');
      smk.style.setProperty('--off', (i * .6) + 's');
      svg.appendChild(smk);
    });
  }

  /* ── Animasi GSAP ekstra ─────────────────────────── */
  function animateWithGSAP(svg, aid) {
    // Pastikan animasi ini masih relevan (world belum di-re-render)
    function still() { return _animId === aid; }

    // Bouncing lambat pada seluruh SVG container tidak perlu —
    // cukup mobil sudah punya wp-car-idle dari CSS.

    // Floating koin skor badge di pojok kiri atas
    const koinBadge = svg.querySelectorAll('rect[rx="8"]');
    koinBadge.forEach(r => {
      if (!still()) return;
      gsap.to(r, {
        y: '-=2', duration: 1.8,
        ease: 'sine.inOut', yoyo: true, repeat: -1,
      });
    });

    // Pulse bangunan target — scale kecil yoyo
    const targetGroups = svg.querySelectorAll('.wp-target-pulse');
    targetGroups.forEach(g => {
      if (!still()) return;
      gsap.to(g, {
        scale: 1.04,
        duration: 1.3,
        ease: 'sine.inOut',
        yoyo: true, repeat: -1,
        transformOrigin: '50% 100%',
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     5. EFEK PARTIKEL UNLOCK BANGUNAN
     Dipanggil saat bangunan baru terbuka
  ══════════════════════════════════════════════════════ */
  function burstUnlock(x, y) {
    const svg = getWorldSVG();
    if (!svg || typeof gsap === 'undefined') return;

    const colors = ['#FFE066', '#FFD700', '#FFA500', '#52D98A', '#FF69B4', '#74B9FF'];

    // Ring burst 3 lapis
    [0, 1, 2].forEach(i => {
      setTimeout(() => {
        const ring = svgEl('circle', {
          cx: x, cy: y, r: 12,
          fill: 'none',
          stroke: ['#FFE066', '#FFD700', '#FFA500'][i],
          'stroke-width': 3 - i * .6,
          opacity: .95,
        });
        svg.appendChild(ring);
        gsap.to(ring, {
          attr: { r: 80 + i * 18 }, opacity: 0,
          duration: .7 + i * .15, ease: 'power2.out',
          onComplete: () => ring.remove(),
        });
      }, i * 130);
    });

    // Bintang melayang
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const star = svgEl('text', {
          x: x + (Math.random() * 40 - 20),
          y,
          'text-anchor': 'middle',
          'font-size': 12 + Math.random() * 8,
          opacity: 1,
        });
        star.textContent = ['⭐', '✨', '🌟', '✦'][Math.floor(Math.random() * 4)];
        svg.appendChild(star);
        gsap.to(star, {
          attr: { y: y - 70 - Math.random() * 40 },
          opacity: 0, scale: 1.5,
          duration: 1.2 + Math.random() * .4,
          ease: 'power2.out',
          onComplete: () => star.remove(),
        });
      }, i * 60);
    }

    // Partikel warna-warni
    for (let i = 0; i < 14; i++) {
      setTimeout(() => {
        const c = svgEl('circle', {
          cx: x + (Math.random() * 20 - 10),
          cy: y + (Math.random() * 10 - 5),
          r: 3 + Math.random() * 5,
          fill: colors[Math.floor(Math.random() * colors.length)],
          opacity: .9,
        });
        svg.appendChild(c);
        const angle = Math.random() * Math.PI * 2;
        const dist  = 40 + Math.random() * 60;
        gsap.to(c, {
          attr: { cx: x + Math.cos(angle) * dist, cy: y + Math.sin(angle) * dist, r: .3 },
          opacity: 0,
          duration: .7 + Math.random() * .4,
          ease: 'power2.out',
          onComplete: () => c.remove(),
        });
      }, i * 20);
    }

    SFX.unlock();
    if (navigator.vibrate) navigator.vibrate([30, 15, 30, 15, 60]);
  }

  /* ══════════════════════════════════════════════════════
     6. PATCH renderWorld()
     Tambahkan animasi setiap kali world di-render ulang
  ══════════════════════════════════════════════════════ */
  function waitApp(cb, n) {
    n = n || 0; if (n > 120) return;
    if (typeof renderWorld === 'function' && typeof STORE !== 'undefined' && STORE.students) {
      cb();
    } else {
      setTimeout(() => waitApp(cb, n + 1), 100);
    }
  }

  function boot() {
    injectCSS();

    waitApp(() => {

      /* ── Patch renderWorld ── */
      const _origRW = W.renderWorld;
      W.renderWorld = function () {
        // Panggil original dulu
        _origRW.call(this);

        // Tunggu sedikit agar DOM ter-update, lalu jalankan animasi
        setTimeout(animateWorld, 60);
      };

      /* ── Patch showBuildingUnlock — tambahkan efek burst ── */
      if (typeof W.showBuildingUnlock === 'function') {
        const _origBU = W.showBuildingUnlock;
        W.showBuildingUnlock = function (building, thenCelebrate) {
          // Ambil posisi bangunan sebelum re-render
          const svg = getWorldSVG();
          let bx = 190, by = 300; // fallback tengah

          if (svg && building) {
            // Cari animCircle di SVG (bangunan target punya animate)
            const circles = svg.querySelectorAll('circle[stroke="#FFE066"]');
            if (circles.length > 0) {
              const c = circles[0];
              bx = parseFloat(c.getAttribute('cx') || bx);
              by = parseFloat(c.getAttribute('cy') || by);
            }
          }

          _origBU.call(this, building, thenCelebrate);

          // Burst setelah re-render
          setTimeout(() => burstUnlock(bx, by), 150);
        };
      }

      /* ── Patch switchPage — aktifkan animasi saat masuk dunia ── */
      if (typeof W.switchPage === 'function') {
        const _origSP = W.switchPage;
        W.switchPage = function (page) {
          _origSP.call(this, page);
          if (page === 'dunia') {
            setTimeout(animateWorld, 200);
          }
        };
      }

      /* ── Patch doCheckIn — hembus angin setelah check-in ── */
      if (typeof W.doCheckIn === 'function') {
        const _origCI = W.doCheckIn;
        W.doCheckIn = function (hb) {
          _origCI.call(this, hb);
          // Angin kecil: percepat pohon sementara setelah check-in
          setTimeout(() => {
            const svg = getWorldSVG();
            if (!svg) return;
            svg.querySelectorAll('.wp-tree').forEach(t => {
              const orig = t.style.getPropertyValue('--spd');
              t.style.setProperty('--spd', '.5s');
              setTimeout(() => t.style.setProperty('--spd', orig || '3.2s'), 2000);
            });
          }, 300);
        };
      }

      // Jalankan animasi pertama kali jika halaman dunia sudah aktif
      const pageD = document.getElementById('page-dunia');
      if (pageD && pageD.classList.contains('active')) {
        setTimeout(animateWorld, 200);
      }

      console.log('[WP] World Patch aktif ✅ — awan, pohon, mobil, partikel siap');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
