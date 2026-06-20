// ═══════════════════════════════════════════════════════════
// HEROKU WORLD ANIMATION — Safe Version
// File: js/world-anim.js
//
// Cara kerja:
//   HANYA menyuntikkan CSS animasi ke elemen yang sudah ada.
//   TIDAK mengubah, memindahkan, atau menghapus elemen apapun.
//   Aman 100% — mobil tidak akan hilang.
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ── Inject CSS ─────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('_wa_css')) return;
    const s = document.createElement('style');
    s.id = '_wa_css';
    s.textContent = `

/* AWAN — drift horizontal */
.wa-cloud {
  animation: waCloud var(--dur,36s) linear infinite var(--off,0s);
  will-change: transform;
}
@keyframes waCloud {
  from { transform: translateX(-160px); }
  to   { transform: translateX(420px);  }
}

/* POHON — goyang dari pangkal */
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

/* MOBIL — bounce naik-turun */
.wa-car {
  animation: waCar 1.6s ease-in-out infinite alternate;
}
@keyframes waCar {
  from { transform: translateY(0px);  }
  to   { transform: translateY(-3px); }
}

/* BANGUNAN TARGET — glow emas */
.wa-target {
  animation: waTarget 1.4s ease-in-out infinite alternate;
}
@keyframes waTarget {
  from { filter: drop-shadow(0 0 4px  rgba(255,224,0,.4)); }
  to   { filter: drop-shadow(0 0 20px rgba(255,224,0,1))
                 drop-shadow(0 0 40px rgba(255,160,0,.6)); }
}

/* BINTANG DEKORASI */
.wa-star {
  animation: waStar var(--dur,2s) ease-in-out
             infinite var(--off,0s);
}
@keyframes waStar {
  0%,100% { opacity:.15; transform:scale(.7) rotate(0deg);   }
  50%      { opacity:1;   transform:scale(1.3) rotate(180deg); }
}

/* ANIMASI SUDAH ADA DI APP.JS (nitro, rain, rainbow) — tidak diubah */
@keyframes nitroFlame {
  0%,100%{ transform:scaleX(1)   scaleY(1);   opacity:.9; }
  50%    { transform:scaleX(1.4) scaleY(.7);  opacity:.6; }
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

  // ── Cari SVG dunia ─────────────────────────────────────
  function getSVG() {
    const d = document.getElementById('world-display');
    return d ? d.querySelector('svg') : null;
  }

  // ── Tambahkan animasi ke elemen yang sudah ada ─────────
  let _lastSVG = null;

  function applyAnimations() {
    const svg = getSVG();
    if (!svg || svg === _lastSVG) return; // sudah diproses
    _lastSVG = svg;

    // 1. AWAN — cari <g> yang isinya ellipse putih
    let cloudIdx = 0;
    const spds = [34, 48, 58, 41];
    const offs = ['-5s', '-22s', '-37s', '-17s'];
    svg.querySelectorAll('g[opacity]').forEach(g => {
      const e = g.querySelector('ellipse');
      if (!e) return;
      if (e.getAttribute('fill') !== 'white') return;
      if (g.classList.contains('wa-cloud')) return;
      g.classList.add('wa-cloud');
      g.style.setProperty('--dur', spds[cloudIdx % 4] + 's');
      g.style.setProperty('--off', offs[cloudIdx % 4]);
      cloudIdx++;
    });

    // 2. POHON — cari <text> yang berisi emoji pohon
    const trees = ['🌲', '🌳', '🌿', '🌴'];
    const tSpd  = [3.2, 2.8, 3.6, 3.0];
    const tDl   = ['0s', '.4s', '.7s', '.2s'];
    const tA    = ['-5deg', '-4deg', '-6deg', '-3deg'];
    const tB    = ['4deg',  '3deg',  '4deg',  '5deg'];
    let ti = 0;
    svg.querySelectorAll('text').forEach(t => {
      if (!trees.includes(t.textContent.trim())) return;
      if (t.classList.contains('wa-tree')) return;
      t.classList.add('wa-tree');
      t.style.setProperty('--spd', tSpd[ti % 4] + 's');
      t.style.setProperty('--dl',  tDl[ti % 4]);
      t.style.setProperty('--a',   tA[ti % 4]);
      t.style.setProperty('--b',   tB[ti % 4]);
      ti++;
    });

    // 3. MOBIL — cari <g transform="translate(...)"> yang langsung
    //    berisi <g transform="scale(1.7)"> (dari getCarSVG scale:1.7)
    //    TIDAK memodifikasi, hanya menambah class ke parent-nya
    svg.querySelectorAll('g[transform^="translate"]').forEach(g => {
      // Cek apakah isinya ada scale(1.7) — itu pasti wrapper mobil
      const scaleG = g.querySelector('g[transform="scale(1.7)"]');
      if (!scaleG) return;
      if (g.classList.contains('wa-car')) return;
      g.classList.add('wa-car');
    });

    // 4. BANGUNAN TARGET — sudah ada <circle stroke="#FFE066">
    //    dengan SVG animate di dalamnya. Tambahkan glow CSS ke parent.
    svg.querySelectorAll('circle[stroke="#FFE066"]').forEach(c => {
      const pg = c.closest('g');
      if (!pg || pg.classList.contains('wa-target')) return;
      // Pastikan ini bukan waypoint dot (r kecil)
      const r = parseFloat(c.getAttribute('r') || 0);
      if (r < 10) return; // waypoint dot r=6, target circle r=24+
      pg.classList.add('wa-target');
    });

    // 5. BINTANG DEKORASI — tambahkan beberapa ✦ ke SVG
    if (!svg.querySelector('.wa-star')) {
      const starPos = [{x:28,y:385},{x:355,y:195},{x:22,y:265},{x:358,y:460}];
      starPos.forEach((p, i) => {
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', p.x);
        t.setAttribute('y', p.y);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-size', '8');
        t.setAttribute('fill', 'rgba(255,255,255,0.7)');
        t.setAttribute('pointer-events', 'none');
        t.className.baseVal = 'wa-star';
        t.style.setProperty('--dur', (1.6 + i * .4) + 's');
        t.style.setProperty('--off', (i * .35) + 's');
        t.textContent = '✦';
        svg.appendChild(t);
      });
    }
  }

  // ── Observer: deteksi setiap kali world-display berubah ─
  function startObserver() {
    const disp = document.getElementById('world-display');
    if (!disp) return;

    // MutationObserver mendeteksi saat innerHTML diganti
    const obs = new MutationObserver(() => {
      _lastSVG = null; // reset agar diproses ulang
      setTimeout(applyAnimations, 80);
    });
    obs.observe(disp, { childList: true, subtree: false });
  }

  // ── Boot ────────────────────────────────────────────────
  function boot() {
    injectCSS();
    startObserver();
    // Coba langsung jika SVG sudah ada
    setTimeout(applyAnimations, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
