// ═══════════════════════════════════════════════════════════
// HEROKU WORLD ANIMATION — v2 Safe
// File: js/world-anim.js  (timpa file lama dengan ini)
//
// Hanya menganimasi: awan + pohon + bintang dekorasi
// TIDAK menyentuh mobil sama sekali (penyebab bug sebelumnya)
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ── CSS ──────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('_wa_css')) return;
    const s = document.createElement('style');
    s.id = '_wa_css';
    s.textContent = `

/* AWAN — drift kiri ke kanan */
.wa-cloud {
  animation: waCloud var(--dur,36s) linear infinite var(--off,0s);
  will-change: transform;
}
@keyframes waCloud {
  from { transform: translateX(-180px); }
  to   { transform: translateX(420px);  }
}

/* POHON — goyang pelan dari pangkal */
.wa-tree {
  display: inline-block;
  transform-origin: 50% 90%;
  animation: waTree var(--spd,3s) ease-in-out
             infinite alternate var(--dl,0s);
}
@keyframes waTree {
  from { transform: rotate(var(--a,-5deg)); }
  to   { transform: rotate(var(--b, 4deg)); }
}

/* BINTANG DEKORASI */
.wa-star {
  animation: waStar var(--dur,2s) ease-in-out
             infinite var(--off,0s);
  pointer-events: none;
}
@keyframes waStar {
  0%,100% { opacity:.15; transform:scale(.7) rotate(0deg);   }
  50%      { opacity:.8;  transform:scale(1.2) rotate(180deg);}
}

/* Keyframe yang sudah ada di app.js — definisikan ulang supaya tetap jalan */
@keyframes nitroFlame {
  0%,100%{ opacity:.9; }
  50%    { opacity:.5; }
}
@keyframes rainbowFade {
  0%,100%{ opacity:.7; }
  50%    { opacity:1;  }
}
@keyframes weatherRain {
  0%   { transform:translateY(-20px); opacity:.4; }
  100% { transform:translateY(120px); opacity:0;  }
}
    `;
    document.head.appendChild(s);
  }

  // ── Ambil SVG dunia ──────────────────────────────────────
  function getSVG() {
    const d = document.getElementById('world-display');
    return d ? d.querySelector('svg') : null;
  }

  // ── Terapkan animasi ─────────────────────────────────────
  let _processed = null;

  function applyAnimations() {
    const svg = getSVG();
    if (!svg || svg === _processed) return;
    _processed = svg;

    /* ── 1. AWAN ────────────────────────────────────────── */
    // Awan = <g opacity="0.75"> atau <g opacity="0.6"> yang berisi ellipse fill="white"
    const speeds = [34, 48, 56, 40];
    const offsets = ['-4s', '-20s', '-36s', '-15s'];
    let ci = 0;
    svg.querySelectorAll('g[opacity]').forEach(g => {
      if (ci >= 4) return;
      // Harus punya ellipse putih langsung di dalamnya
      const firstChild = g.firstElementChild;
      if (!firstChild) return;
      if (firstChild.tagName !== 'ellipse') return;
      if (firstChild.getAttribute('fill') !== 'white') return;
      // Pastikan belum diproses
      if (g.classList.contains('wa-cloud')) return;

      g.classList.add('wa-cloud');
      g.style.setProperty('--dur', speeds[ci] + 's');
      g.style.setProperty('--off', offsets[ci]);
      ci++;
    });

    /* ── 2. POHON ───────────────────────────────────────── */
    // Pohon = <text> yang isinya emoji pohon
    const TREE_EMOJIS = ['🌲', '🌳', '🌿', '🌴'];
    const tSpd = [3.2, 2.8, 3.6, 3.0];
    const tDl  = ['0s', '.4s', '.7s', '.2s'];
    const tA   = ['-5deg', '-4deg', '-6deg', '-3deg'];
    const tB   = ['4deg',  '3deg',  '4deg',  '5deg'];
    let ti = 0;
    svg.querySelectorAll('text').forEach(t => {
      const txt = t.textContent.trim();
      if (!TREE_EMOJIS.includes(txt)) return;
      if (t.classList.contains('wa-tree')) return;
      const idx = ti % 4;
      t.classList.add('wa-tree');
      t.style.setProperty('--spd', tSpd[idx] + 's');
      t.style.setProperty('--dl',  tDl[idx]);
      t.style.setProperty('--a',   tA[idx]);
      t.style.setProperty('--b',   tB[idx]);
      ti++;
    });

    /* ── 3. BINTANG DEKORASI ────────────────────────────── */
    // Hanya tambah jika belum ada
    if (!svg.querySelector('.wa-star')) {
      const pos = [
        { x: 25,  y: 380 },
        { x: 360, y: 195 },
        { x: 20,  y: 260 },
        { x: 355, y: 460 },
      ];
      pos.forEach((p, i) => {
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', p.x);
        t.setAttribute('y', p.y);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-size', '9');
        t.setAttribute('fill', 'rgba(255,255,255,0.65)');
        t.setAttribute('pointer-events', 'none');
        t.classList.add('wa-star');
        t.style.setProperty('--dur', (1.6 + i * .4) + 's');
        t.style.setProperty('--off', (i * .35) + 's');
        t.textContent = '✦';
        // Sisipkan SEBELUM elemen terakhir (supaya di bawah mobil)
        const last = svg.lastElementChild;
        svg.insertBefore(t, last);
      });
    }

    // Selesai — tidak menyentuh mobil sama sekali
  }

  /* ── MutationObserver: deteksi re-render world-display ── */
  function startObserver() {
    const disp = document.getElementById('world-display');
    if (!disp) {
      // world-display belum ada, coba lagi nanti
      setTimeout(startObserver, 300);
      return;
    }
    const obs = new MutationObserver(() => {
      _processed = null; // reset supaya diproses ulang setelah re-render
      setTimeout(applyAnimations, 80);
    });
    obs.observe(disp, { childList: true, subtree: false });
  }

  /* ── Boot ────────────────────────────────────────────── */
  function boot() {
    injectCSS();
    startObserver();
    // Coba langsung kalau SVG sudah ada
    setTimeout(applyAnimations, 400);
    console.log('[WA] World Animation v2 aktif — awan & pohon bergerak ✅');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
