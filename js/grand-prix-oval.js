// ═══════════════════════════════════════════════════════════
// HEROKU GRAND PRIX OVAL v1.0
// Sirkuit oval mobile-first menggantikan track lurus
//
// File: js/grand-prix-oval.js
// Pasang di index.html setelah journal.js:
//   <script src="js/grand-prix-oval.js"></script>
//
// Fitur:
//   - Sirkuit oval top-down, full-width, horizontal scroll
//   - Auto-pan ke posisi mobil siswa yang login
//   - Sticky bar: posisi + bus kelas %
//   - Mini Top3 banner
//   - Tab [🎯 Misi Hari Ini] / [🏆 Klasemen]
//   - Skalabel 5-30 siswa
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ── Helper: ambil STORE dari scope manapun ──────────────
  let _storeRef = null; // cache referensi STORE yang benar

  function getStore() {
    // Kalau sudah punya referensi yang valid, pakai itu
    if (_storeRef && _storeRef.students && _storeRef.students.length > 0) return _storeRef;
    // window.STORE (jika app.js expose)
    if (window.STORE && window.STORE.students) {
      _storeRef = window.STORE;
      return _storeRef;
    }
    // Coba curi dari saveStore atau fungsi lain yang capture STORE via closure
    // Trick: patch saveStore untuk expose referensi STORE
    if (typeof saveStore === 'function') {
      // saveStore di app.js mengakses STORE langsung
      // kita intercept dengan cara expose via dummy call
    }
    return window.STORE || { students: [], nextId: 1 };
  }

  // Expose STORE ke window sesegera mungkin via patch saveStore
  function exposeStore() {
    if (typeof saveStore === 'function' && !saveStore._gpo_expose) {
      const _orig = saveStore;
      saveStore = function() {
        if (typeof STORE !== 'undefined' && STORE.students) {
          window.STORE = STORE;
          _storeRef = STORE;
        }
        return _orig.apply(this, arguments);
      };
      saveStore._gpo_expose = true;
    }
    // Juga patch loadStore
    if (typeof loadStore === 'function' && !loadStore._gpo_expose) {
      const _origL = loadStore;
      loadStore = function() {
        const r = _origL.apply(this, arguments);
        if (typeof STORE !== 'undefined' && STORE.students) {
          window.STORE = STORE;
          _storeRef = STORE;
        }
        return r;
      };
      loadStore._gpo_expose = true;
    }
  }

  // ── Konstanta oval ──────────────────────────────────────
  // Oval digambar dalam koordinat SVG 700×420
  // cx/cy = center, rx/ry = radius sumbu x/y lintasan tengah
  const OW = 700, OH = 420;
  const CX = OW / 2, CY = OH / 2;
  const RX = 260, RY = 155;       // radius tengah oval
  const TRACK_W = 48;             // lebar lintasan (px SVG)
  const INNER_RX = RX - TRACK_W, INNER_RY = RY - TRACK_W;
  const OUTER_RX = RX + TRACK_W, OUTER_RY = RY + TRACK_W;

  // Warna mobil (sama dengan app.js)
  const DEFAULT_COLORS = {
    b1:'#F39C12',b2:'#9B59B6',b3:'#E74C3C',b4:'#F1C40F',
    b5:'#27AE60',b6:'#2980B9',g1:'#E91E8C',g2:'#FF69B4',
    g3:'#1ABC9C',g4:'#D35400',g5:'#16A085',g6:'#8E44AD'
  };
  const COLOR_MAP = {
    default:'#F39C12',green:'#27AE60',white:'#BDC3C7',
    blue:'#2980B9',gold:'#F1C40F',purple:'#8E44AD',
    red:'#E74C3C',teal:'#1ABC9C'
  };

  // ── Helper: posisi mobil di oval ────────────────────────
  // progress 0..1 → {x, y, angle} di lintasan tengah oval
  // Mulai dari bawah-kanan (finish/start), bergerak searah jarum jam
  function ovalPos(progress) {
    // t = 0 di bawah (π/2), searah jarum jam
    const t = (Math.PI / 2) + progress * 2 * Math.PI;
    return {
      x: CX + RX * Math.cos(t),
      y: CY + RY * Math.sin(t),
      // Sudut tangent untuk rotasi mobil
      angle: (Math.atan2(RY * Math.cos(t), -RX * Math.sin(t)) * 180 / Math.PI),
    };
  }

  // Distribusi jalur: multi-siswa tidak menumpuk
  // Siswa diletakkan di jalur berbeda (ring dalam-luar selang-seling)
  function laneOffset(rankIndex, total) {
    // Bagi jalur ke dalam beberapa ring radial
    const rings = Math.min(total, 5);
    const ring  = rankIndex % rings;
    // Ring 0 = paling dalam, ring terakhir = paling luar
    const spread = TRACK_W * 0.75;
    return (ring / Math.max(rings - 1, 1) - 0.5) * spread;
  }

  function ovalPosLane(progress, offset) {
    const t  = (Math.PI / 2) + progress * 2 * Math.PI;
    const r  = 1 + offset / Math.sqrt(RX * RX * Math.pow(Math.sin(t), 2) + RY * RY * Math.pow(Math.cos(t), 2));
    return {
      x:     CX + (RX + offset) * Math.cos(t),
      y:     CY + (RY + offset) * Math.sin(t),
      angle: (Math.atan2(RY * Math.cos(t), -RX * Math.sin(t)) * 180 / Math.PI),
    };
  }

  // ── Helper: warna & modifikasi mobil ────────────────────
  function getCarColor(s) {
    const avId = W.resolveAvatarId ? W.resolveAvatarId(s.avatar) : s.avatar;
    const g = s.garage;
    if (g && g.colorId && g.colorId !== 'default') return COLOR_MAP[g.colorId] || DEFAULT_COLORS[avId] || '#888';
    return DEFAULT_COLORS[avId] || '#888';
  }

  function getMods(s) {
    const g = s.garage || {};
    return {
      hasNitro:   (g.upgrades || []).includes('nitro') && s.streak >= 3,
      hasSpoiler: (g.upgrades || []).includes('spoiler'),
      sticker:    (g.stickers || []).map(sid => {
        const st = (W.STICKERS || []).find(x => x.id === sid);
        return st ? st.icon : '';
      }).filter(Boolean)[0] || '',
    };
  }

  function getAvatarEmoji(av) {
    return W.getAvatarEmoji ? W.getAvatarEmoji(av) : '😊';
  }

  function getTier(koin) {
    return W.getTier ? W.getTier(koin) : { icon: '🥉' };
  }

  // ── SVG mobil ────────────────────────────────────────────
  function carSVG(s, x, y, angle, isMe) {
    const cc    = getCarColor(s);
    const mods  = getMods(s);
    const emoji = getAvatarEmoji(s.avatar);
    const nick  = (s.nickname || s.name.split(' ')[0]).slice(0, 8);

    return `
    <g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${angle.toFixed(1)})"
       style="filter:${isMe ? 'drop-shadow(0 0 6px rgba(46,204,113,0.9))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'}">
      <!-- Shadow -->
      <ellipse cx="0" cy="14" rx="13" ry="4" fill="rgba(0,0,0,0.35)"/>
      <!-- Body -->
      <rect x="-13" y="2" width="26" height="11" rx="5" fill="${cc}"/>
      <!-- Roof -->
      <rect x="-9" y="-5" width="18" height="10" rx="3.5" fill="${cc}" opacity="0.9"/>
      <!-- Windscreen -->
      <rect x="-7" y="-4" width="14" height="8" rx="2" fill="rgba(200,235,255,0.9)"/>
      ${mods.hasSpoiler ? `<rect x="-12" y="-9" width="24" height="3.5" rx="2" fill="${cc}" opacity="0.8"/>` : ''}
      <!-- Wheels -->
      <circle cx="-8" cy="14" r="4" fill="#2C3E50"/>
      <circle cx="-8" cy="14" r="1.8" fill="#636E72"/>
      <circle cx="8"  cy="14" r="4" fill="#2C3E50"/>
      <circle cx="8"  cy="14" r="1.8" fill="#636E72"/>
      <!-- Headlights -->
      <rect x="11" y="4" width="3.5" height="4" rx="1.5" fill="#FFE066" opacity="0.9"/>
      <!-- Avatar -->
      <text x="0" y="1" text-anchor="middle" font-size="9">${emoji}${mods.sticker}</text>
      ${mods.hasNitro ? `<text x="-17" y="5" font-size="9">🔥</text>` : ''}
    </g>
    <!-- Name bubble (tidak ikut rotate) -->
    <g id="_gpo_lbl_${s.id}" transform="translate(${x.toFixed(1)},${(y - 28).toFixed(1)})">
      <rect x="-20" y="-9" width="40" height="14" rx="5"
        fill="${isMe ? 'rgba(46,204,113,0.9)' : 'rgba(15,15,30,0.85)'}"/>
      <text x="0" y="1" text-anchor="middle" font-family="Arial,sans-serif"
        font-size="8" font-weight="${isMe ? '900' : '700'}"
        fill="${isMe ? '#fff' : 'rgba(255,255,255,0.85)'}">${nick}</text>
    </g>`;
  }

  // ── Render oval SVG utama ─────────────────────────────
  function buildOvalSVG(sorted, myStudent, classAvg) {
    const maxKoin  = Math.max(sorted[0]?.koin || 0, 1);
    const allZero  = sorted.every(s => s.koin === 0);
    const total    = sorted.length;

    // Hitung progress tiap siswa (0..1 = satu putaran penuh)
    // Gunakan rank-based spread yang proporsional agar mobil tidak menumpuk
    const progressList = (() => {
      const n = sorted.length;
      if (allZero || maxKoin === 0) {
        // Semua nol: spread merata 10%-75%
        return sorted.map((_, i) => 0.10 + (i / Math.max(n - 1, 1)) * 0.65);
      }
      // Ada koin: map ke range 15%-85%, lalu enforce gap minimum 0.08
      const raw = sorted.map(s => 0.15 + (s.koin / maxKoin) * 0.70);
      // Enforce gap minimum dari depan ke belakang
      const MIN_GAP = 0.08;
      for (let i = 1; i < raw.length; i++) {
        if (raw[i-1] - raw[i] < MIN_GAP) raw[i] = raw[i-1] - MIN_GAP;
        if (raw[i] < 0.05) raw[i] = 0.05;
      }
      return raw;
    })();
    const cars = sorted.map((s, i) => {
      const rawP   = progressList[i];
      const offset = laneOffset(i, total);
      const pos    = ovalPosLane(rawP, offset);
      const isMe   = myStudent && s.id === myStudent.id;
      return { s, pos, isMe, rank: i + 1, rawP };
    });

    // Bus kelas — ukuran lebih kecil, posisi di dalam oval
    const busProgress = Math.min(classAvg / 100 * 0.4, 0.4);
    const busPos      = ovalPos(busProgress);

    // Garis start/finish: bawah oval (progress=0)
    const sfPos0 = ovalPos(0);
    const sfPos1 = ovalPosLane(0, TRACK_W * 0.5);
    const sfPos2 = ovalPosLane(0, -TRACK_W * 0.5);

    return `
<svg viewBox="0 0 ${OW} ${OH}" xmlns="http://www.w3.org/2000/svg"
  style="width:100%;min-width:${OW}px;display:block;background:linear-gradient(160deg,#0a1628 0%,#1a2a4a 50%,#0d1f3c 100%)">

  <defs>
    <!-- Aspal -->
    <radialGradient id="trackGrad" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#2d3436"/>
      <stop offset="100%" stop-color="#1a1a2e"/>
    </radialGradient>
    <!-- Rumput dalam -->
    <radialGradient id="grassGrad" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#1e5c2a"/>
      <stop offset="100%" stop-color="#145220"/>
    </radialGradient>
    <!-- Glow siswa login -->
    <filter id="glowMe">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- Finish stripe -->
    <pattern id="finishPat" patternUnits="userSpaceOnUse" width="8" height="8">
      <rect width="4" height="4" fill="white"/>
      <rect x="4" y="4" width="4" height="4" fill="white"/>
    </pattern>
  </defs>

  <!-- ── Background dekorasi ── -->
  <!-- Lampu stadion pojok -->
  <circle cx="80"  cy="60"  r="18" fill="rgba(255,220,100,0.08)"/>
  <circle cx="620" cy="60"  r="18" fill="rgba(255,220,100,0.08)"/>
  <circle cx="80"  cy="360" r="18" fill="rgba(255,220,100,0.08)"/>
  <circle cx="620" cy="360" r="18" fill="rgba(255,220,100,0.08)"/>
  <!-- Tiang lampu -->
  <line x1="80"  y1="60"  x2="80"  y2="100" stroke="#555" stroke-width="3"/>
  <line x1="620" y1="60"  x2="620" y2="100" stroke="#555" stroke-width="3"/>
  <circle cx="80"  cy="58"  r="6" fill="#FFE066" opacity="0.9"/>
  <circle cx="620" cy="58"  r="6" fill="#FFE066" opacity="0.9"/>

  <!-- Pohon dekorasi -->
  <text x="30"  y="210" font-size="22" opacity="0.7">🌳</text>
  <text x="645" y="210" font-size="22" opacity="0.7">🌳</text>
  <text x="320" y="28"  font-size="18" opacity="0.6">🏆</text>
  <text x="355" y="28"  font-size="18" opacity="0.6">🏆</text>

  <!-- ── Lintasan ── -->
  <!-- Outer boundary -->
  <ellipse cx="${CX}" cy="${CY}" rx="${OUTER_RX}" ry="${OUTER_RY}"
    fill="url(#trackGrad)" stroke="#444" stroke-width="2"/>
  <!-- Inner grass -->
  <ellipse cx="${CX}" cy="${CY}" rx="${INNER_RX}" ry="${INNER_RY}"
    fill="url(#grassGrad)" stroke="#2d7a3a" stroke-width="2"/>

  <!-- Marka lintasan (garis putus-putus di tengah oval) -->
  <ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}"
    fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"
    stroke-dasharray="12,8"/>

  <!-- Dekorasi rumput dalam -->
  <text x="${CX - 12}" y="${CY + 6}" font-size="22" text-anchor="middle" opacity="0.5">⛳</text>
  <text x="${CX - 50}" y="${CY + 40}" font-size="16" opacity="0.4">🌿</text>
  <text x="${CX + 40}" y="${CY - 30}" font-size="16" opacity="0.4">🌿</text>

  <!-- ── Start / Finish line ── -->
  <line x1="${sfPos2.x.toFixed(1)}" y1="${sfPos2.y.toFixed(1)}"
        x2="${sfPos1.x.toFixed(1)}" y2="${sfPos1.y.toFixed(1)}"
        stroke="white" stroke-width="6" opacity="0.9"/>
  <line x1="${sfPos2.x.toFixed(1)}" y1="${sfPos2.y.toFixed(1)}"
        x2="${sfPos1.x.toFixed(1)}" y2="${sfPos1.y.toFixed(1)}"
        stroke="url(#finishPat)" stroke-width="6" opacity="0.7"/>
  <!-- Label START/FINISH -->
  <text x="${(sfPos0.x + 18).toFixed(1)}" y="${(sfPos0.y - 10).toFixed(1)}"
    font-family="Arial,sans-serif" font-size="9" font-weight="900"
    fill="white" opacity="0.8">🏁 START/FINISH</text>

  <!-- ── Bus Kelas (kecil, di dalam oval) ── -->
  <g transform="translate(${(CX).toFixed(1)},${(CY).toFixed(1)})">
    <text x="0" y="-8" text-anchor="middle" font-size="18">🚌</text>
    <text x="0" y="8" text-anchor="middle" font-family="Arial,sans-serif"
      font-size="10" font-weight="900" fill="#F9CA24">${classAvg}%</text>
    <text x="0" y="20" text-anchor="middle" font-family="Arial,sans-serif"
      font-size="7" fill="rgba(255,255,255,0.5)">Kelas</text>
  </g>

  <!-- ── Mobil siswa ── -->
  ${cars.map(c => carSVG(c.s, c.pos.x, c.pos.y, c.pos.angle, c.isMe)).join('')}

  <!-- ── Title overlay ── -->
  <text x="${CX}" y="22" text-anchor="middle" font-family="Arial,sans-serif"
    font-size="14" font-weight="900" fill="#FFE066">🏁 GRAND PRIX KEBIASAAN 🏁</text>
  <text x="${CX}" y="36" text-anchor="middle" font-family="Arial,sans-serif"
    font-size="9" fill="rgba(255,255,255,0.4)">Posisi berdasarkan total koin</text>

  <!-- ── Rank badges pojok (Top 3) ── -->
  ${cars.slice(0, 3).map((c, i) => {
    const bx = 20 + i * 72;
    const by = OH - 36;
    const bc = i === 0 ? '#F1C40F' : i === 1 ? '#BDC3C7' : '#CD7F32';
    const nick = (c.s.nickname || c.s.name.split(' ')[0]).slice(0, 7);
    return `
    <g>
      <rect x="${bx}" y="${by}" width="66" height="28" rx="6" fill="rgba(0,0,0,0.6)"/>
      <text x="${bx + 8}" y="${by + 11}" font-size="10">${['🥇','🥈','🥉'][i]}</text>
      <text x="${bx + 22}" y="${by + 11}" font-family="Arial,sans-serif" font-size="8"
        font-weight="900" fill="${bc}">${nick}</text>
      <text x="${bx + 22}" y="${by + 22}" font-family="Arial,sans-serif" font-size="7"
        fill="rgba(255,255,255,0.6)">⭐${c.s.koin}</text>
    </g>`;
  }).join('')}

</svg>`;
  }

  // ── CSS ───────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('_gpo_css')) return;
    const s = document.createElement('style');
    s.id = '_gpo_css';
    s.textContent = `
/* ── Grand Prix Oval ── */
#_gpo_wrap {
  font-family: var(--font-round, 'Trebuchet MS', Arial, sans-serif);
}

/* Sticky bar */
#_gpo_sticky {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px 0;
}
._gpo_stat {
  flex: 1;
  background: linear-gradient(135deg, #1A1A2E, #0F3460);
  border-radius: 10px;
  padding: 8px 10px;
  text-align: center;
  color: #fff;
}
._gpo_stat_val {
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  color: #FFE066;
}
._gpo_stat_lbl {
  font-size: 9px;
  color: rgba(255,255,255,0.5);
  margin-top: 2px;
}

/* Oval container */
#_gpo_oval_wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 16px;
  margin-bottom: 10px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.4);
  scrollbar-width: thin;
  scrollbar-color: #444 #1a1a2e;
}
#_gpo_oval_wrap::-webkit-scrollbar {
  height: 4px;
}
#_gpo_oval_wrap::-webkit-scrollbar-track {
  background: #1a1a2e;
}
#_gpo_oval_wrap::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

/* Focus me button */
#_gpo_focus_btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(46,204,113,0.9);
  border: none;
  border-radius: 20px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  z-index: 2;
  display: none;
}

/* Mini Top3 banner */
#_gpo_top3 {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
._gpo_top3_item {
  flex: 1;
  background: linear-gradient(135deg, #1A1A2E, #16213E);
  border-radius: 10px;
  padding: 7px 8px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.08);
}
._gpo_top3_medal { font-size: 14px; line-height: 1; }
._gpo_top3_name {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
._gpo_top3_koin {
  font-size: 9px;
  color: rgba(255,255,255,0.5);
}

/* Tab bar */
#_gpo_tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
._gpo_tab {
  flex: 1;
  padding: 9px 6px;
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  background: rgba(26,26,46,0.6);
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all .2s;
  text-align: center;
}
._gpo_tab.active {
  background: linear-gradient(135deg, #27AE60, #1E8449);
  color: #fff;
  border-color: transparent;
}

/* Tab content */
._gpo_tab_content { display: none; }
._gpo_tab_content.active { display: block; }

/* Klasemen list */
._gpo_rank_item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  margin-bottom: 6px;
  border: 1px solid rgba(255,255,255,0.05);
}
._gpo_rank_item.me {
  background: rgba(39,174,96,0.12);
  border-color: rgba(39,174,96,0.3);
}
._gpo_rank_num {
  font-size: 14px;
  font-weight: 900;
  color: rgba(255,255,255,0.3);
  min-width: 24px;
  text-align: center;
}
._gpo_rank_info { flex: 1; }
._gpo_rank_name {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
._gpo_rank_sub {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
}
._gpo_rank_koin {
  font-size: 13px;
  font-weight: 900;
  color: #FFE066;
}

/* My position card */
#_gpo_mypos {
  background: linear-gradient(135deg, #1E5C32, #27AE60);
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 8px;
  color: #fff;
}
#_gpo_mypos_grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}
._gpo_mypos_cell {
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}
._gpo_mypos_val {
  font-size: 18px;
  font-weight: 900;
}
._gpo_mypos_lbl {
  font-size: 9px;
  opacity: 0.7;
}
    `;
    document.head.appendChild(s);
  }

  // ── Render utama ─────────────────────────────────────
  function renderOval() {
    const con   = document.getElementById('race-display');
    const myPos = document.getElementById('race-my-pos');
    if (!con) return;

    // Fix: pastikan page-race punya cukup ruang
    const racePage = document.getElementById('page-race');
    if (racePage) {
      racePage.style.minHeight = '100vh';
      racePage.style.height    = 'auto';
    }
    con.style.minHeight = '420px';
    con.style.overflow  = 'visible';

    const ss = getStore().students || [];
    if (!ss.length) {
      // Retry sekali lagi setelah 500ms — mungkin Supabase belum selesai
      if (!renderOval._retried) {
        renderOval._retried = true;
        setTimeout(() => { renderOval._retried = false; renderOval(); }, 800);
        return;
      }
      con.innerHTML = `
        <div style="background:#1A1A2E;border-radius:14px;padding:24px;text-align:center;color:white">
          <div style="font-size:36px;margin-bottom:8px">🏁</div>
          <div style="font-family:var(--font-round);font-size:14px;font-weight:800;margin-bottom:6px">Sirkuit Masih Kosong</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6)">Belum ada siswa terdaftar.</div>
        </div>`;
      return;
    }
    renderOval._retried = false;

    const sorted     = [...ss].sort((a, b) => b.koin - a.koin || b.streak - a.streak);
    const myStudent  = W.CU && W.CRole === 'anak' ? sorted.find(s => s.id === W.CU.id) : null;
    const myRank     = myStudent ? sorted.indexOf(myStudent) + 1 : 0;

    const classTotal = ss.reduce((a, s) => a + Object.keys(s.checkedToday || {}).length, 0);
    const classAvg   = ss.length ? Math.round(classTotal / (ss.length * 7) * 100) : 0;

    // ── Build HTML ──
    const top3HTML = sorted.slice(0, 3).map((s, i) => {
      const nick = (s.nickname || s.name.split(' ')[0]).slice(0, 10);
      return `
        <div class="_gpo_top3_item">
          <div class="_gpo_top3_medal">${['🥇','🥈','🥉'][i]}</div>
          <div class="_gpo_top3_name">${nick}</div>
          <div class="_gpo_top3_koin">⭐${s.koin}</div>
        </div>`;
    }).join('');

    const klasemenHTML = sorted.map((s, i) => {
      const isMe   = myStudent && s.id === myStudent.id;
      const nick   = s.nickname || s.name.split(' ')[0];
      const medal  = i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`;
      const done   = Object.keys(s.checkedToday || {}).length;
      return `
        <div class="_gpo_rank_item ${isMe ? 'me' : ''}">
          <div class="_gpo_rank_num">${medal}</div>
          <div style="font-size:18px">${getAvatarEmoji(s.avatar)}</div>
          <div class="_gpo_rank_info">
            <div class="_gpo_rank_name">${nick}${isMe ? ' ◀' : ''}</div>
            <div class="_gpo_rank_sub">Streak 🔥${s.streak} · Misi ${done}/7 hari ini</div>
          </div>
          <div class="_gpo_rank_koin">⭐${s.koin}</div>
        </div>`;
    }).join('');

    // My position card data
    const done = myStudent ? Object.keys(myStudent.checkedToday || {}).length : 0;
    const myMsg = myRank === 1
      ? '🥇 Kamu memimpin! Pertahankan terus!'
      : myRank <= 3
        ? '🏆 Top 3! Sedikit lagi menuju puncak!'
        : '💪 Setiap kebiasaan membawamu maju. Terus semangat!';

    con.innerHTML = `
<div id="_gpo_wrap">

  <!-- Sticky bar: posisi + bus kelas -->
  ${myStudent ? `
  <div id="_gpo_sticky">
    <div class="_gpo_stat">
      <div class="_gpo_stat_val">#${myRank}</div>
      <div class="_gpo_stat_lbl">Posisiku</div>
    </div>
    <div class="_gpo_stat">
      <div class="_gpo_stat_val">${myStudent.koin}</div>
      <div class="_gpo_stat_lbl">⭐ Koin</div>
    </div>
    <div class="_gpo_stat">
      <div class="_gpo_stat_val" style="color:#F9CA24">${classAvg}%</div>
      <div class="_gpo_stat_lbl">🚌 Bus Kelas</div>
    </div>
  </div>` : `
  <div id="_gpo_sticky">
    <div class="_gpo_stat" style="flex:2">
      <div class="_gpo_stat_val" style="color:#F9CA24">${classAvg}%</div>
      <div class="_gpo_stat_lbl">🚌 Konsistensi Kelas · ${sorted.length} pembalap</div>
    </div>
  </div>`}

  <!-- Oval sirkuit (horizontal scroll) -->
  <div style="position:relative">
    <div id="_gpo_oval_wrap">
      ${buildOvalSVG(sorted, myStudent, classAvg)}
    </div>
    ${myStudent ? `<button id="_gpo_focus_btn" onclick="GPO.focusMe()">🎯 Posisiku</button>` : ''}
  </div>

  <!-- Mini Top 3 -->
  <div id="_gpo_top3">${top3HTML}</div>

  <!-- Tab bar -->
  <div id="_gpo_tabs">
    <button class="_gpo_tab active" id="_gpo_tab_misi"    onclick="GPO.switchTab('misi')">🎯 Misi Hari Ini</button>
    <button class="_gpo_tab"        id="_gpo_tab_klasemen" onclick="GPO.switchTab('klasemen')">🏆 Klasemen</button>
  </div>

  <!-- Tab: Misi Hari Ini -->
  <div class="_gpo_tab_content active" id="_gpo_content_misi">
    <!-- Diisi oleh app.js asli melalui race-my-pos & konten misi yang sudah ada -->
    <div id="_gpo_misi_placeholder" style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;padding:16px">
      Login sebagai siswa untuk melihat misi hari ini.
    </div>
  </div>

  <!-- Tab: Klasemen -->
  <div class="_gpo_tab_content" id="_gpo_content_klasemen">
    <div style="margin-bottom:8px;font-size:11px;color:rgba(255,255,255,0.4);text-align:center">
      ${sorted.length} pembalap · Diurutkan berdasarkan total koin
    </div>
    ${klasemenHTML}
  </div>

</div>`;

    // My position card — pindah ke tab misi
    if (myStudent && myPos) {
      myPos.style.display = 'none'; // sembunyikan yang lama
      const misiPlaceholder = document.getElementById('_gpo_misi_placeholder');
      if (misiPlaceholder) {
        misiPlaceholder.outerHTML = `
          <div id="_gpo_mypos">
            <div style="font-size:12px;font-weight:900">🏁 Posisiku Hari Ini</div>
            <div id="_gpo_mypos_grid">
              <div class="_gpo_mypos_cell">
                <div class="_gpo_mypos_val">#${myRank}</div>
                <div class="_gpo_mypos_lbl">dari ${sorted.length} siswa</div>
              </div>
              <div class="_gpo_mypos_cell">
                <div class="_gpo_mypos_val">${myStudent.koin}</div>
                <div class="_gpo_mypos_lbl">⭐ Koin</div>
              </div>
              <div class="_gpo_mypos_cell">
                <div class="_gpo_mypos_val">${done}/7</div>
                <div class="_gpo_mypos_lbl">✅ Hari ini</div>
              </div>
            </div>
            <div style="margin-top:8px;font-size:11px;text-align:center">${myMsg}</div>
          </div>`;
      }
    }

    // Auto-pan ke posisi mobil siswa yang login
    if (myStudent) {
      setTimeout(() => autoPan(myStudent, sorted), 300);
      const focusBtn = document.getElementById('_gpo_focus_btn');
      if (focusBtn) focusBtn.style.display = 'block';
    }

    // Update subtitle
    const sub = document.getElementById('race-subtitle');
    if (sub) {
      sub.textContent = `${sorted.length} pembalap · ${classAvg}% konsistensi kelas hari ini`;
    }
  }

  // ── Auto-pan ke posisi mobil siswa ──────────────────
  function autoPan(myStudent, sorted) {
    const wrap = document.getElementById('_gpo_oval_wrap');
    if (!wrap) return;
    const maxKoin  = Math.max(sorted[0]?.koin || 0, 1);
    const allZero  = sorted.every(s => s.koin === 0);
    const i        = sorted.findIndex(s => s.id === myStudent.id);
    const rawP     = allZero
      ? (i / Math.max(sorted.length - 1, 1)) * 0.25
      : Math.min((myStudent.koin / maxKoin) * 0.92, 0.98);
    const pos      = ovalPosLane(rawP, laneOffset(i, sorted.length));
    // Scroll agar posisi X mobil ada di tengah viewport
    const svgW     = OW;
    const vw       = wrap.clientWidth;
    const scrollTo = Math.max(0, (pos.x / svgW) * wrap.scrollWidth - vw / 2);
    wrap.scrollTo({ left: scrollTo, behavior: 'smooth' });
  }

  // ═══════════════════════════════════════════════════════════
  // ANIMATION ENGINE
  // Animasi smooth: mobil bergerak dari posisi lama ke target baru
  // menggunakan requestAnimationFrame + easing, tanpa rebuild SVG
  // ═══════════════════════════════════════════════════════════

  const _animState = {}; // { studentId: { progress, targetProgress, offset } }
  let   _animFrame = null;
  let   _animRunning = false;

  function initAnimState(sorted, progressList) {
    const maxKoin = Math.max(sorted[0]?.koin || 0, 1);
    const total   = sorted.length;
    sorted.forEach((s, i) => {
      if (!_animState[s.id]) {
        // First time: mulai dari posisi saat ini
        _animState[s.id] = {
          progress: progressList[i],
          target:   progressList[i],
          offset:   laneOffset(i, total),
        };
      } else {
        // Update target — mobil akan bergerak smooth ke sini
        _animState[s.id].target = progressList[i];
        _animState[s.id].offset = laneOffset(i, total);
      }
    });
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function tickAnimation() {
    const svg = document.querySelector('#_gpo_oval_wrap svg');
    if (!svg) { _animRunning = false; return; }

    let anyMoving = false;
    const SPEED = 0.0008; // progress per frame (tuning)

    for (const [id, state] of Object.entries(_animState)) {
      const diff = state.target - state.progress;
      if (Math.abs(diff) < 0.0005) continue;

      // Smooth lerp
      state.progress += diff * 0.04;
      anyMoving = true;

      const pos   = ovalPosLane(state.progress, state.offset);
      const carEl = svg.getElementById ? svg.getElementById('_gpo_car_' + id)
                                       : document.getElementById('_gpo_car_' + id);
      const lblEl = svg.getElementById ? svg.getElementById('_gpo_lbl_' + id)
                                       : document.getElementById('_gpo_lbl_' + id);

      if (carEl) {
        carEl.setAttribute('transform',
          `translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)}) rotate(${pos.angle.toFixed(1)})`);
      }
      if (lblEl) {
        lblEl.setAttribute('transform',
          `translate(${pos.x.toFixed(1)},${(pos.y - 28).toFixed(1)})`);
      }
    }

    if (anyMoving) {
      _animFrame = requestAnimationFrame(tickAnimation);
    } else {
      _animRunning = false;
    }
  }

  function startAnimation(sorted, progressList) {
    initAnimState(sorted, progressList);
    if (!_animRunning) {
      _animRunning = true;
      _animFrame   = requestAnimationFrame(tickAnimation);
    }
  }

  function stopAnimation() {
    if (_animFrame) cancelAnimationFrame(_animFrame);
    _animRunning = false;
  }

  // Idle animation: mobil bergerak pelan terus (simulasi mesin hidup)
  function startIdleAnimation() {
    if (_idleRunning) return;
    _idleRunning = true;
    let tick = 0;

    function idleTick() {
      if (!_idleRunning) return;
      const svg = document.querySelector('#_gpo_oval_wrap svg');
      if (!svg) { _idleRunning = false; return; }

      tick++;
      // Setiap 4 detik (240 frame @ 60fps), animasi roda berputar kecil
      // TIDAK mengubah posisi — hanya efek visual subtle (wheel wobble)
      if (tick % 240 === 0) {
        // Wheel wobble: gerak maju 0.001 lalu balik — tidak mengubah ranking
        for (const state of Object.values(_animState)) {
          const wobble = 0.001;
          state.target = state.progress + wobble;
        }
        if (!_animRunning) {
          _animRunning = true;
          _animFrame = requestAnimationFrame(tickAnimation);
        }
        // Reset ke posisi asli setelah 0.5 detik
        setTimeout(() => {
          for (const state of Object.values(_animState)) {
            state.target = state.progress;
          }
        }, 500);
      }

      requestAnimationFrame(idleTick);
    }
    requestAnimationFrame(idleTick);
  }

  let _idleRunning = false;

  // ── Patch renderOval agar trigger animasi setelah render ─
  function renderOvalWithAnim() {
    renderOval();
    // Ambil progressList dari state terakhir
    const ss      = getStore().students || [];
    if (!ss.length) return;
    const sorted  = [...ss].sort((a, b) => b.koin - a.koin || b.streak - a.streak);
    const maxKoin = Math.max(sorted[0]?.koin || 0, 1);
    const allZero = sorted.every(s => s.koin === 0);
    const n       = sorted.length;

    const progressList = (() => {
      if (allZero || maxKoin === 0) {
        return sorted.map((_, i) => 0.10 + (i / Math.max(n - 1, 1)) * 0.65);
      }
      const raw = sorted.map(s => 0.15 + (s.koin / maxKoin) * 0.70);
      const MIN_GAP = 0.08;
      for (let i = 1; i < raw.length; i++) {
        if (raw[i-1] - raw[i] < MIN_GAP) raw[i] = raw[i-1] - MIN_GAP;
        if (raw[i] < 0.05) raw[i] = 0.05;
      }
      return raw;
    })();

    // Mulai animasi
    setTimeout(() => {
      startAnimation(sorted, progressList);
      setTimeout(startIdleAnimation, 1000);
    }, 200);
  }

  // ── Nitro burst: mobil maju cepat saat check-in ──────────
  function nitroBurst(studentId) {
    const state = _animState[studentId];
    if (!state) return;
    state.target = Math.min(state.target + 0.06, 0.98);
    if (!_animRunning) {
      _animRunning = true;
      _animFrame = requestAnimationFrame(tickAnimation);
    }
  }

  // Listen event check-in untuk trigger nitro burst
  document.addEventListener('heroku:checkin', (e) => {
    if (e.detail?.studentId) nitroBurst(e.detail.studentId);
  });

  // ── Public API ───────────────────────────────────────
  W.GPO = {
    render: renderOvalWithAnim,
    nitroBurst,
    switchTab(tab) {
      ['misi','klasemen'].forEach(t => {
        document.getElementById(`_gpo_tab_${t}`)?.classList.toggle('active', t === tab);
        document.getElementById(`_gpo_content_${t}`)?.classList.toggle('active', t === tab);
      });
    },
    focusMe() {
      const ss      = getStore().students || [];
      const sorted  = [...ss].sort((a, b) => b.koin - a.koin || b.streak - a.streak);
      const myStudent = W.CU && W.CRole === 'anak' ? sorted.find(s => s.id === W.CU.id) : null;
      if (myStudent) autoPan(myStudent, sorted);
    },
  };

  // ── Boot: patch renderRaceTrack ──────────────────────
  function boot() {
    injectCSS();

    // Tunggu renderRaceTrack tersedia lalu patch
    let tries = 0;
    const waitFn = setInterval(() => {
      if (typeof W.renderRaceTrack === 'function' || tries > 80) {
        clearInterval(waitFn);

        // Override renderRaceTrack
        W.renderRaceTrack = renderOval;
        W.renderRaceTrack._gpo_patched = true;

        // Patch showPage agar render ulang saat tab Balapan diklik
        if (typeof W.showPage === 'function' && !W.showPage._gpo_patched) {
          const _origShow = W.showPage;
          W.showPage = function(page) {
            _origShow.call(this, page);
            if (page === 'race') setTimeout(renderOvalWithAnim, 80);
          };
          W.showPage._gpo_patched = true;
        }
      }
      tries++;
    }, 150);

    // Tunggu STORE.students terisi (Supabase selesai load) lalu render
    let dataWait = 0;
    const waitData = setInterval(() => {
      const students = getStore().students;
      if ((students && students.length > 0) || dataWait > 100) {
        clearInterval(waitData);
        // Render jika halaman race aktif
        const racePage = document.getElementById('page-race');
        if (racePage) setTimeout(renderOvalWithAnim, 100);
      }
      dataWait++;
    }, 200);

    // Listen HeroKuEvents untuk re-render saat data berubah
    document.addEventListener('heroku:pageSwitch', (e) => {
      if (e.detail?.page === 'race') setTimeout(renderOvalWithAnim, 80);
    });
    // Fallback: listen klik tab Balapan
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[onclick]');
      if (btn && btn.getAttribute('onclick')?.includes('race')) setTimeout(renderOvalWithAnim, 150);
    });

    exposeStore();
    console.log('[GPO] Grand Prix Oval v1.0 siap ✅ — sirkuit oval mobile-first aktif');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
