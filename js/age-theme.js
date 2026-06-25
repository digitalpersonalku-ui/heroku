// ═══════════════════════════════════════════════════════════
// HEROKU AGE-ADAPTIVE THEME v1.0
// Auto-detect usia dari tanggalLahir → apply tema otomatis
//
// File: js/age-theme.js
// Pasang di index.html setelah grand-prix-oval.js:
//   <script src="js/age-theme.js"></script>
//
// Kelompok usia:
//   young  → 6-7  tahun → Light theme, font XL, ikon besar
//   mid    → 8-9  tahun → Light-medium, font L, campuran
//   senior → 10+  tahun → Dark mode (default, tidak berubah)
//
// Override guru: field themeOverride di data siswa
//   null       → auto-detect dari tglLahir
//   'young'    → paksa tema young
//   'mid'      → paksa tema mid
//   'senior'   → paksa tema senior (dark)
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ── Konstanta ─────────────────────────────────────────────
  const AGE_GROUPS = {
    young:  { min: 0,  max: 7,  label: 'Sahabat Kecil (6-7 thn)' },
    mid:    { min: 8,  max: 9,  label: 'Penjelajah (8-9 thn)'    },
    senior: { min: 10, max: 99, label: 'Pahlawan (10-12 thn)'    },
  };

  // ── CSS Themes ────────────────────────────────────────────
  const THEMES = {
    young: {
      '--bg':                '#FFF8F0',
      '--bg2':               '#FFF0E0',
      '--card-bg':           '#FFFFFF',
      '--card-border':       '#FFD580',
      '--text':              '#2C3E50',
      '--text-muted':        '#7F8C8D',
      '--green':             '#27AE60',
      '--green-light':       '#EAFAF1',
      '--green-dark':        '#1E8449',
      '--accent':            '#FF6B6B',
      '--accent2':           '#FFB347',
      '--header-bg':         'linear-gradient(135deg,#FF9A3C,#FF6B6B)',
      '--font-size-base':    '16px',
      '--font-size-sm':      '13px',
      '--font-size-lg':      '20px',
      '--border-radius':     '20px',
      '--border-radius-sm':  '12px',
      '--shadow':            '0 4px 16px rgba(255,107,107,0.15)',
      '--coin-color':        '#FF9A3C',
      '--streak-color':      '#FF6B6B',
    },
    mid: {
      '--bg':                '#F0F4FF',
      '--bg2':               '#E8EEFF',
      '--card-bg':           '#FFFFFF',
      '--card-border':       '#C5D5FF',
      '--text':              '#1A1A2E',
      '--text-muted':        '#5D6D7E',
      '--green':             '#27AE60',
      '--green-light':       '#EAFAF1',
      '--green-dark':        '#1E8449',
      '--accent':            '#5B86E5',
      '--accent2':           '#36D1DC',
      '--header-bg':         'linear-gradient(135deg,#5B86E5,#36D1DC)',
      '--font-size-base':    '14px',
      '--font-size-sm':      '12px',
      '--font-size-lg':      '17px',
      '--border-radius':     '16px',
      '--border-radius-sm':  '10px',
      '--shadow':            '0 4px 16px rgba(91,134,229,0.15)',
      '--coin-color':        '#F39C12',
      '--streak-color':      '#E74C3C',
    },
    senior: null, // senior = default dark, tidak perlu override
  };

  // ── Hitung usia dari tglLahir ─────────────────────────────
  function hitungUsia(tglLahir) {
    if (!tglLahir) return null;
    try {
      const lahir = new Date(tglLahir);
      const today = new Date();
      let usia = today.getFullYear() - lahir.getFullYear();
      const m = today.getMonth() - lahir.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < lahir.getDate())) usia--;
      return usia;
    } catch (e) { return null; }
  }

  // ── Tentukan ageGroup ─────────────────────────────────────
  function getAgeGroup(student) {
    // Override guru selalu menang
    if (student.themeOverride && AGE_GROUPS[student.themeOverride]) {
      return student.themeOverride;
    }
    // Auto-detect dari tglLahir
    const usia = hitungUsia(student.tglLahir);
    if (usia === null) return 'senior'; // fallback
    if (usia <= 7)  return 'young';
    if (usia <= 9)  return 'mid';
    return 'senior';
  }

  // ── Apply tema ke DOM ─────────────────────────────────────
  function applyTheme(ageGroup) {
    const root  = document.documentElement;
    const body  = document.body;
    const theme = THEMES[ageGroup];

    // Set data attribute untuk CSS selector
    body.setAttribute('data-age-group', ageGroup);
    body.setAttribute('data-theme', ageGroup === 'senior' ? 'dark' : 'light');

    // Apply CSS variables
    if (theme) {
      for (const [key, val] of Object.entries(theme)) {
        root.style.setProperty(key, val);
      }
      // Light mode adjustments
      body.classList.remove('theme-young', 'theme-mid', 'theme-senior');
      body.classList.add(`theme-${ageGroup}`);
    } else {
      // Senior: kembalikan ke dark mode default
      body.classList.remove('theme-young', 'theme-mid', 'theme-senior');
      body.classList.add('theme-senior');
      // Hapus override variables
      const lightVars = Object.keys(THEMES.young);
      lightVars.forEach(v => root.style.removeProperty(v));
    }

    console.log(`[AGT] Tema applied: ${ageGroup}`);
  }

  // ── Reset ke dark mode (saat logout) ─────────────────────
  function resetTheme() {
    const root = document.documentElement;
    const body = document.body;
    body.removeAttribute('data-age-group');
    body.removeAttribute('data-theme');
    body.classList.remove('theme-young', 'theme-mid', 'theme-senior');
    const lightVars = Object.keys(THEMES.young);
    lightVars.forEach(v => root.style.removeProperty(v));
  }

  // ── CSS tambahan untuk light themes ──────────────────────
  function injectCSS() {
    if (document.getElementById('_agt_css')) return;
    const s = document.createElement('style');
    s.id = '_agt_css';
    s.textContent = `
/* ── Base light mode overrides ── */
body[data-theme="light"] {
  background: var(--bg) !important;
  color: var(--text) !important;
}

/* Cards */
body[data-theme="light"] .card,
body[data-theme="light"] [class*="card"],
body[data-theme="light"] .habit-card,
body[data-theme="light"] .mission-card {
  background: var(--card-bg) !important;
  color: var(--text) !important;
  border: 1.5px solid var(--card-border, #EEE) !important;
}

/* Header */
body[data-theme="light"] .app-header,
body[data-theme="light"] #app-header {
  background: var(--header-bg) !important;
  color: #fff !important;
}

/* Tab bar */
body[data-theme="light"] .tab-bar,
body[data-theme="light"] #tab-bar {
  background: var(--card-bg) !important;
  border-top: 1.5px solid var(--card-border, #EEE) !important;
}
body[data-theme="light"] .tab-btn {
  color: var(--text-muted) !important;
}
body[data-theme="light"] .tab-btn.active {
  color: var(--green) !important;
}

/* Section backgrounds */
body[data-theme="light"] .tab-page,
body[data-theme="light"] #page-beranda,
body[data-theme="light"] #page-race,
body[data-theme="light"] #page-sekolah {
  background: var(--bg) !important;
}

/* Text colors */
body[data-theme="light"] h1,
body[data-theme="light"] h2,
body[data-theme="light"] h3,
body[data-theme="light"] .sec-title {
  color: var(--text) !important;
}

/* Input fields */
body[data-theme="light"] input,
body[data-theme="light"] select,
body[data-theme="light"] textarea {
  background: #fff !important;
  color: var(--text) !important;
  border-color: var(--card-border, #DDD) !important;
}

/* ════════════════════════════════════════
   YOUNG THEME (6-7 thn) — Ceria & Playful
   ════════════════════════════════════════ */
body.theme-young {
  background: #FFF8E7 !important;
  font-size: 15px !important;
}

/* ── Animasi bintang berkedip ── */
@keyframes _agt_twinkle {
  0%,100% { transform: scale(1) rotate(0deg); opacity:1; }
  50%      { transform: scale(1.2) rotate(10deg); opacity:0.8; }
}
@keyframes _agt_bounce {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
@keyframes _agt_wiggle {
  0%,100% { transform: rotate(0deg); }
  25%      { transform: rotate(-5deg); }
  75%      { transform: rotate(5deg); }
}

/* ── Header ── */
body.theme-young .app-header,
body.theme-young #app-header {
  background: linear-gradient(135deg,#FF6B35,#FF9A3C) !important;
  border-radius: 0 0 24px 24px !important;
  padding-bottom: 16px !important;
}

/* ── Tab bar bawah ── */
body.theme-young .tab-bar,
body.theme-young #tab-bar {
  background: #fff !important;
  border-top: 3px solid #FFE082 !important;
  border-radius: 20px 20px 0 0 !important;
}
body.theme-young .tab-btn { color: #BDBDBD !important; font-size:11px !important; }
body.theme-young .tab-btn.active { color: #FF6B35 !important; }

/* ── Habit cards — BESAR & BERWARNA ── */
body.theme-young .habit-card {
  background: #fff !important;
  border-radius: 22px !important;
  padding: 14px 16px !important;
  margin-bottom: 10px !important;
  border: 3px solid #FFE082 !important;
  box-shadow: 0 4px 0 #FFD54F !important;
  display: flex !important;
  align-items: center !important;
  gap: 14px !important;
  transition: transform .15s !important;
  cursor: pointer !important;
}
body.theme-young .habit-card:active {
  transform: scale(0.97) translateY(2px) !important;
  box-shadow: 0 2px 0 #FFD54F !important;
}
body.theme-young .habit-card.checked {
  background: #F1F8E9 !important;
  border-color: #AED581 !important;
  box-shadow: 0 4px 0 #9CCC65 !important;
  opacity: 0.85 !important;
}

/* Warna border berbeda tiap habit (1-7) */
body.theme-young .habit-card:nth-child(1) { border-color:#FFB74D !important; box-shadow:0 4px 0 #FFA726 !important; }
body.theme-young .habit-card:nth-child(2) { border-color:#CE93D8 !important; box-shadow:0 4px 0 #BA68C8 !important; }
body.theme-young .habit-card:nth-child(3) { border-color:#80DEEA !important; box-shadow:0 4px 0 #26C6DA !important; }
body.theme-young .habit-card:nth-child(4) { border-color:#A5D6A7 !important; box-shadow:0 4px 0 #66BB6A !important; }
body.theme-young .habit-card:nth-child(5) { border-color:#90CAF9 !important; box-shadow:0 4px 0 #42A5F5 !important; }
body.theme-young .habit-card:nth-child(6) { border-color:#FFCC80 !important; box-shadow:0 4px 0 #FFA726 !important; }
body.theme-young .habit-card:nth-child(7) { border-color:#B39DDB !important; box-shadow:0 4px 0 #7E57C2 !important; }

/* ── Ikon habit lebih besar ── */
body.theme-young .h-icon {
  width: 56px !important;
  height: 56px !important;
  border-radius: 18px !important;
  font-size: 28px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
}

/* ── Info text ── */
body.theme-young .h-name {
  font-size: 17px !important;
  font-weight: 900 !important;
  color: #333 !important;
}
body.theme-young .h-desc {
  font-size: 12px !important;
  color: #888 !important;
  margin-top: 2px !important;
}
body.theme-young .h-reward {
  font-size: 12px !important;
  color: #FF9800 !important;
  font-weight: 700 !important;
  margin-top: 4px !important;
}

/* ── Tombol centang BESAR ── */
body.theme-young .hchk {
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  border: 3px solid #E0E0E0 !important;
  background: #FAFAFA !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 22px !important;
  flex-shrink: 0 !important;
  font-weight: 900 !important;
  color: #4CAF50 !important;
}
body.theme-young .habit-card.checked .hchk {
  background: #4CAF50 !important;
  border-color: #4CAF50 !important;
  color: #fff !important;
  animation: _agt_bounce 1s ease infinite !important;
}

/* ── Judul section ── */
body.theme-young .sec-title,
body.theme-young [class*="sec-title"] {
  font-size: 18px !important;
  font-weight: 900 !important;
  color: #E65100 !important;
}

/* ── Cards umum ── */
body.theme-young .card {
  border-radius: 20px !important;
  border: 2.5px solid #FFE082 !important;
  background: #fff !important;
}

/* ── Nama siswa ── */
body.theme-young .stu-name,
body.theme-young #stu-name {
  font-size: 26px !important;
  font-weight: 900 !important;
  color: #E65100 !important;
  animation: _agt_wiggle 2s ease infinite !important;
  display: inline-block !important;
}

/* ── Koin & XP bar ── */
body.theme-young .koin-val { color: #FF9800 !important; font-size:18px !important; font-weight:900 !important; }
body.theme-young .xp-bar { border-radius: 20px !important; height: 14px !important; }
body.theme-young .xp-fill { border-radius: 20px !important; background: linear-gradient(90deg,#FF9A3C,#FF6B35) !important; }

/* ── World/Beranda background ── */
body.theme-young #page-beranda {
  background: linear-gradient(180deg,#FFF8E7,#FFF3E0) !important;
}

/* ── Streak badge ── */
body.theme-young .streak-badge,
body.theme-young [class*="streak"] {
  background: linear-gradient(135deg,#FF6B35,#FF9A3C) !important;
  color: #fff !important;
  border-radius: 20px !important;
  padding: 4px 12px !important;
  font-weight: 900 !important;
  animation: _agt_twinkle 2s ease infinite !important;
}

/* ── SIMPLIFY CARD MISI untuk anak 6-7 tahun ──────────────
   Layout baru: ikon BESAR di kiri, nama saja, tombol BESAR
   Sembunyikan teks kecil yang susah dibaca
   ─────────────────────────────────────────────────────── */

/* Sembunyikan deskripsi dan reward — terlalu padat */
body.theme-young .h-desc  { display: none !important; }
body.theme-young .h-reward { display: none !important; }

/* Nama habit lebih besar, jelas */
body.theme-young .h-name {
  font-size: 19px !important;
  font-weight: 900 !important;
  color: #2C3E50 !important;
  line-height: 1.2 !important;
}

/* Card layout 2-kolom: ikon kiri, nama tengah, centang kanan */
body.theme-young .habit-card {
  min-height: 72px !important;
}

/* Ikon jauh lebih besar */
body.theme-young .h-icon {
  width: 60px !important;
  height: 60px !important;
  font-size: 32px !important;
  border-radius: 20px !important;
  flex-shrink: 0 !important;
}

/* Tombol centang SANGAT BESAR — mudah dipencet anak kecil */
body.theme-young .hchk {
  width: 54px !important;
  height: 54px !important;
  border-radius: 50% !important;
  border: 4px solid #E0E0E0 !important;
  background: #FAFAFA !important;
  flex-shrink: 0 !important;
  font-size: 26px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
body.theme-young .habit-card.checked .hchk {
  background: #4CAF50 !important;
  border-color: #388E3C !important;
  color: #fff !important;
  font-size: 28px !important;
}

/* Badge koin kecil di pojok kanan atas card */
body.theme-young .habit-card::after {
  content: attr(data-koin);
  position: absolute !important;
  top: 8px !important;
  right: 70px !important;
  background: #FFF3E0 !important;
  color: #FF9800 !important;
  font-size: 10px !important;
  font-weight: 900 !important;
  padding: 2px 6px !important;
  border-radius: 10px !important;
  border: 1.5px solid #FFE082 !important;
}
body.theme-young .habit-card { position: relative !important; }

/* Grid misi 1 kolom penuh, bukan list kecil */
body.theme-young #habits-list {
  display: flex !important;
  flex-direction: column !important;
  gap: 10px !important;
  padding: 0 4px !important;
}

/* Judul "Misi Hari Ini" lebih besar */
body.theme-young .sec-title {
  font-size: 20px !important;
  font-weight: 900 !important;
  color: #E65100 !important;
  margin-bottom: 12px !important;
}

/* Progress bar misi di bawah judul */
body.theme-young #habit-note {
  font-size: 13px !important;
  color: #FF9800 !important;
  font-weight: 700 !important;
  background: #FFF8E7 !important;
  border-radius: 12px !important;
  padding: 6px 12px !important;
  margin-bottom: 8px !important;
  text-align: center !important;
}

/* Sembunyikan elemen terlalu kompleks */
body.theme-young [data-hide-young="true"] { display: none !important; }

/* World display lebih cerah */
body.theme-young #world-display {
  border-radius: 24px !important;
  overflow: hidden !important;
}

/* Streak counter lebih besar */
body.theme-young .streak-num {
  font-size: 32px !important;
  font-weight: 900 !important;
}

/* Koin display berwarna */
body.theme-young .koin-num,
body.theme-young #koin-display {
  color: #FF9800 !important;
  font-size: 24px !important;
  font-weight: 900 !important;
}

/* ── MID theme extras (8-9 thn) ── */
body.theme-mid {
  font-size: var(--font-size-base) !important;
}
body.theme-mid [data-hide-mid="true"] {
  display: none !important;
}

/* ── SENIOR theme (10-12 thn) — default dark, tidak diubah ── */
body.theme-senior {
  /* Default app.js styles berlaku */
}

/* ── Age badge di profil siswa ── */
#_agt_badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-round, Arial, sans-serif);
  margin-left: 6px;
}
#_agt_badge.young  { background: rgba(255,107,107,0.15); color: #FF6B6B; }
#_agt_badge.mid    { background: rgba(91,134,229,0.15);  color: #5B86E5; }
#_agt_badge.senior { background: rgba(39,174,96,0.15);   color: #27AE60; }

/* ── Theme override dropdown di Admin ── */
._agt_override_wrap {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
._agt_override_sel {
  padding: 4px 8px;
  border: 1.5px solid #DDD;
  border-radius: 8px;
  font-size: 11px;
  font-family: var(--font-round, Arial, sans-serif);
  cursor: pointer;
  background: #fff;
}
    `;
    document.head.appendChild(s);
  }

  // ── Inject age badge di header siswa ─────────────────────
  function injectAgeBadge(ageGroup, usia) {
    const existing = document.getElementById('_agt_badge');
    if (existing) existing.remove();

    const labels = { young: '🌱 Sahabat Kecil', mid: '🚀 Penjelajah', senior: '⚡ Pahlawan' };
    const badge  = document.createElement('span');
    badge.id        = '_agt_badge';
    badge.className = ageGroup;
    badge.textContent = labels[ageGroup] || '';

    // Cari lokasi inject — di dekat nama siswa di header
    const nameEl = document.querySelector('#user-name, .user-name, #header-name');
    if (nameEl) nameEl.appendChild(badge);
  }

  // ── Override dropdown di kartu siswa (Admin) ─────────────
  function injectOverrideDropdown(studentId, currentOverride) {
    const cardId = `_agt_ovr_${studentId}`;
    if (document.getElementById(cardId)) return;

    // Cari card siswa yang sesuai
    const adminCards = document.querySelectorAll('[data-student-id]');
    adminCards.forEach(card => {
      if (card.dataset.studentId !== studentId) return;
      if (document.getElementById(cardId)) return;

      const wrap = document.createElement('div');
      wrap.className = '_agt_override_wrap';
      wrap.innerHTML = `
        <span style="font-size:10px;color:#888">🎨 Tema:</span>
        <select class="_agt_override_sel" id="${cardId}"
          onchange="AGT.setOverride('${studentId}', this.value)">
          <option value="">Auto (dari usia)</option>
          <option value="young"  ${currentOverride==='young'  ?'selected':''}>🌱 Sahabat Kecil</option>
          <option value="mid"    ${currentOverride==='mid'    ?'selected':''}>🚀 Penjelajah</option>
          <option value="senior" ${currentOverride==='senior' ?'selected':''}>⚡ Pahlawan</option>
        </select>`;
      card.appendChild(wrap);
    });
  }

  // ── Patch login: apply tema setelah siswa login ───────────
  function patchLogin() {
    if (typeof W.doLogin !== 'function') return;
    if (W.doLogin._agt_patched) return;
    const _orig = W.doLogin;
    W.doLogin = function () {
      const result = _orig.apply(this, arguments);
      // Setelah login, apply tema berdasarkan CU
      setTimeout(() => {
        if (W.CU && W.CRole === 'anak') {
          const group = getAgeGroup(W.CU);
          applyTheme(group);
          injectAgeBadge(group, hitungUsia(W.CU.tglLahir));
          W.AGT._currentGroup = group;
        }
      }, 100);
      return result;
    };
    W.doLogin._agt_patched = true;
  }

  // Patch showPage agar tidak reset tema saat navigasi
  function patchShowPage() {
    if (typeof W.showPage !== 'function') return;
    if (W.showPage._agt_patched) return;
    const _orig = W.showPage;
    W.showPage = function (page) {
      _orig.call(this, page);
      // Re-apply tema jika siswa sudah login
      if (W.CU && W.CRole === 'anak' && W.AGT._currentGroup) {
        applyTheme(W.AGT._currentGroup);
      }
    };
    W.showPage._agt_patched = true;
  }

  // Patch logout: reset ke dark mode
  function patchLogout() {
    if (typeof W.doLogout !== 'function') return;
    if (W.doLogout._agt_patched) return;
    const _orig = W.doLogout;
    W.doLogout = function () {
      resetTheme();
      W.AGT._currentGroup = null;
      return _orig.apply(this, arguments);
    };
    W.doLogout._agt_patched = true;
  }

  // ── Public API ────────────────────────────────────────────
  W.AGT = {
    _currentGroup: null,

    // Paksa apply tema (untuk testing)
    apply: applyTheme,

    // Reset ke dark mode
    reset: resetTheme,

    // Hitung usia siswa
    getAge: hitungUsia,

    // Dapatkan group usia
    getGroup: getAgeGroup,

    // Override tema siswa dari Admin
    setOverride(studentId, value) {
      const store = W.STORE || window.STORE;
      if (!store) return;
      const s = store.students.find(x => x.id === studentId);
      if (!s) return;
      s.themeOverride = value || null;
      if (typeof saveStore === 'function') saveStore();
      if (typeof W.showToast === 'function') {
        const label = value
          ? { young:'🌱 Sahabat Kecil', mid:'🚀 Penjelajah', senior:'⚡ Pahlawan' }[value]
          : 'Auto';
        W.showToast(`✅ Tema ${s.nickname || s.name} → ${label}`);
      }
    },

    // Preview tema (untuk admin lihat tampilan)
    preview(group) {
      applyTheme(group);
      setTimeout(() => {
        if (W.CU && W.CRole === 'anak') {
          applyTheme(W.AGT._currentGroup || 'senior');
        } else {
          resetTheme();
        }
      }, 3000);
    },
  };

  // ── Mapping sistem lama ke AGT ───────────────────────────
  // app.js pakai: theme-muda, theme-menengah, theme-dewasa
  // AGT pakai:    young, mid, senior
  const OLD_TO_NEW = { muda: 'young', menengah: 'mid', dewasa: 'senior' };
  const NEW_TO_OLD = { young: 'muda', mid: 'menengah', senior: 'dewasa' };

  // Patch applyAgeThemeClass agar AGT ikut jalan setiap kali app.js apply tema
  function patchApplyAgeThemeClass() {
    if (typeof W.applyAgeThemeClass !== 'function') return;
    if (W.applyAgeThemeClass._agt_patched) return;
    const _orig = W.applyAgeThemeClass;
    W.applyAgeThemeClass = function () {
      _orig.call(this);
      // Setelah sistem lama apply class-nya, AGT apply CSS variables
      if (W.CU && W.CRole === 'anak') {
        const group = getAgeGroup(W.CU);
        applyTheme(group);
        W.AGT._currentGroup = group;
      }
    };
    W.applyAgeThemeClass._agt_patched = true;
  }

  // Sembunyikan pilih tampilan manual (theme-selector-wrap)
  // karena sekarang tema otomatis dari usia
  function hideManualThemeSelector() {
    const wrap = document.getElementById('theme-selector-wrap');
    if (wrap) wrap.style.display = 'none';
    // Juga hide jika dirender ulang
    if (!W._agt_obs) {
      W._agt_obs = new MutationObserver(() => {
        const w = document.getElementById('theme-selector-wrap');
        if (w && w.style.display !== 'none') w.style.display = 'none';
      });
      W._agt_obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ── Boot ─────────────────────────────────────────────────
  function boot() {
    injectCSS();

    let tries = 0;
    const wait = setInterval(() => {
      if (typeof W.applyAgeThemeClass === 'function' || tries > 80) {
        clearInterval(wait);
        patchApplyAgeThemeClass();
        patchLogin();
        patchShowPage();
        patchLogout();
        hideManualThemeSelector();

        // Kalau siswa sudah login (refresh halaman), apply tema langsung
        if (W.CU && W.CRole === 'anak') {
          const group = getAgeGroup(W.CU);
          applyTheme(group);
          injectAgeBadge(group, hitungUsia(W.CU.tglLahir));
          W.AGT._currentGroup = group;
        }
      }
      tries++;
    }, 150);

    console.log('[AGT] Age-Adaptive Theme v1.0 siap ✅ — tema otomatis dari usia aktif');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
