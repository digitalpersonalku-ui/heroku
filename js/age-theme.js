// ═══════════════════════════════════════════════════════════
// AGE THEME SYSTEM — HeroKu
// File: js/age-theme.js
//
// Tanggung jawab file ini:
//   1. Inject dual class ke <body> saat applyAgeThemeClass() dipanggil
//      → theme-young  + theme-muda   (usia 6-7)
//      → theme-mid    + theme-menengah (usia 8-9)
//      (class lama dari app.js tetap ada untuk kompatibilitas)
//   2. Patch DS.showModal() supaya modal daily-surprise
//      tampil dengan warna cerah untuk siswa theme-young/muda
//
// Cara pasang di index.html — setelah app.js:
//   <script src="js/age-theme.js"></script>
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // 1. DUAL-CLASS INJECTION
  // Patch applyAgeThemeClass() milik app.js supaya juga inject
  // class baru (theme-young / theme-mid) di samping class lama.
  // Ini memastikan CSS baru dan lama tidak saling konflik.
  // ─────────────────────────────────────────────────────────
  function patchApplyAgeThemeClass() {
    if (typeof W.applyAgeThemeClass !== 'function') {
      setTimeout(patchApplyAgeThemeClass, 150);
      return;
    }

    var _orig = W.applyAgeThemeClass;

    W.applyAgeThemeClass = function () {
      // Jalankan fungsi asli dulu (inject theme-muda / theme-menengah / theme-dewasa)
      _orig.call(this);

      // Hapus class baru supaya tidak menumpuk
      document.body.classList.remove('theme-young', 'theme-mid');

      // Tambah class baru sesuai class lama yang sudah diset
      if (document.body.classList.contains('theme-muda')) {
        document.body.classList.add('theme-young');
      } else if (
        document.body.classList.contains('theme-menengah') ||
        document.body.classList.contains('theme-mid')
      ) {
        document.body.classList.add('theme-mid');
      }
    };

    console.log('[AGT] applyAgeThemeClass patched — dual-class injection aktif ✅');
  }

  // ─────────────────────────────────────────────────────────
  // 2. CSS INJECTION — tambahan style untuk theme-young & theme-mid
  //    yang belum ada di style.css
  // ─────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('_agt_css')) return;
    var s = document.createElement('style');
    s.id = '_agt_css';
    s.textContent = `

/* ═══════════════════════════════════════════════════════════
   THEME-YOUNG (usia 6-7 tahun)
   Palette: Soft Cream bg, Pure White card, Ceria Yellow aksen,
   Playful Mint Green, Sky Blue, Soft Terracotta topbar,
   Charcoal Dark Brown teks — high contrast, bold borders
   ═══════════════════════════════════════════════════════════ */

body.theme-young {
  --bg:         #FFF8EE;
  --card-bg:    #FFFFFF;
  --text:       #2D1B0E;
  --muted:      #7A5C3A;
  --border:     #FFD199;
  --green:      #3DBE6E;
  --green-dark: #2E9E55;
  --amber:      #FFB300;
  --blue:       #5BB8F5;
  --coral:      #FF7A5C;
  --topbar-bg:  #C45E3A;
  --topbar-text:#FFFFFF;
  background: var(--bg) !important;
}

/* Topbar — Soft Terracotta */
body.theme-young .topbar {
  background: var(--topbar-bg) !important;
  border-bottom: none !important;
  box-shadow: 0 3px 12px rgba(196,94,58,0.25) !important;
}
body.theme-young .topbar-logo { color: #FFFFFF !important; }
body.theme-young .topbar-name { color: #FFFFFF !important; font-weight: 900 !important; }
body.theme-young .topbar-sub  { color: rgba(255,255,255,0.75) !important; }

/* Kartu — Pure White, border tebal, shadow hangat */
body.theme-young .card,
body.theme-young .habit-card,
body.theme-young .mentor-card {
  background: var(--card-bg) !important;
  border: 2.5px solid var(--border) !important;
  border-radius: 22px !important;
  box-shadow: 0 4px 16px rgba(255,180,80,0.15) !important;
  color: var(--text) !important;
}

/* Hero block */
body.theme-young .hero {
  background: linear-gradient(135deg, #FFB347, #FFD580) !important;
  border-radius: 26px !important;
  border: 2px solid #FFA020 !important;
  box-shadow: 0 6px 20px rgba(255,150,30,0.25) !important;
}
body.theme-young .hero-greeting { color: rgba(45,27,14,0.65) !important; }
body.theme-young .hero-name {
  color: #2D1B0E !important;
  font-size: 24px !important;
  font-weight: 900 !important;
}
body.theme-young .hstat {
  background: rgba(255,255,255,0.55) !important;
  border: 1.5px solid rgba(255,255,255,0.8) !important;
  border-radius: 16px !important;
}
body.theme-young .hstat-num {
  color: #2D1B0E !important;
  font-size: 22px !important;
  font-weight: 900 !important;
}
body.theme-young .hstat-label { color: rgba(45,27,14,0.6) !important; }
body.theme-young .xp-bar { background: rgba(45,27,14,0.12) !important; }
body.theme-young .xp-fill {
  background: linear-gradient(90deg, #3DBE6E, #5FD68A) !important;
  box-shadow: 0 0 8px rgba(61,190,110,0.4) !important;
}
body.theme-young .xp-label { color: rgba(45,27,14,0.6) !important; }

/* Teks umum */
body.theme-young .sec-title { color: #2D1B0E !important; font-weight: 900 !important; }
body.theme-young .mentor-name { color: #2D1B0E !important; font-weight: 800 !important; }
body.theme-young .mentor-sub  { color: var(--muted) !important; }
body.theme-young .mentor-msg  { color: #2D1B0E !important; }
body.theme-young .h-name      { color: #2D1B0E !important; font-size: 15px !important; font-weight: 800 !important; }
body.theme-young .h-desc      { color: var(--muted) !important; }

/* Habit card checked */
body.theme-young .habit-card.checked {
  border-color: #3DBE6E !important;
  background: #F0FFF5 !important;
}
body.theme-young .hchk {
  width: 32px !important;
  height: 32px !important;
  border: 2.5px solid var(--border) !important;
}
body.theme-young .habit-card.checked .hchk {
  background: #3DBE6E !important;
  border-color: #3DBE6E !important;
  color: #fff !important;
}

/* Ikon habit lebih besar */
body.theme-young .h-icon {
  width: 52px !important;
  height: 52px !important;
  font-size: 28px !important;
  border-radius: 18px !important;
}

/* Bottom nav */
body.theme-young .bottom-nav {
  background: #FFFFFF !important;
  border-top: 2.5px solid var(--border) !important;
  box-shadow: 0 -3px 12px rgba(255,150,30,0.1) !important;
}
body.theme-young .nav-label { color: var(--muted) !important; }
body.theme-young .nav-item.active .nav-label { color: var(--green-dark) !important; }
body.theme-young .nav-icon { font-size: 24px !important; }

/* Tombol aksi */
body.theme-young .btn-go,
body.theme-young .btn-confirm,
body.theme-young .btn-next {
  border-radius: 20px !important;
  font-size: 16px !important;
  padding: 16px !important;
}

/* Streak row */
body.theme-young .sday.today {
  background: #3DBE6E !important;
  border-color: #3DBE6E !important;
  color: #fff !important;
}
body.theme-young .sday.done {
  background: #D4F5E3 !important;
  border-color: #3DBE6E !important;
  color: #2E9E55 !important;
}
body.theme-young .sday.empty {
  background: rgba(255,200,100,0.15) !important;
  border-color: var(--border) !important;
  color: var(--muted) !important;
}

/* Streak badge — scoped supaya tidak merembet ke .streak-row */
body.theme-young .streak-badge {
  background: linear-gradient(135deg, #FFB300, #FF8C00) !important;
  color: #fff !important;
}

/* Animasi napas lembut pada hero */
body.theme-young .hero {
  animation: _agt_youngBreathe 4s ease-in-out infinite;
}
@keyframes _agt_youngBreathe {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.006); }
}

/* ═══════════════════════════════════════════════════════════
   THEME-MID (usia 8-9 tahun) — Dark adventure, neon green/gold
   Menargetkan body.theme-mid DAN body.theme-menengah
   ═══════════════════════════════════════════════════════════ */

body.theme-mid,
body.theme-menengah {
  --bg:         #1A1A2E;
  --card-bg:    #16213E;
  --border:     #2A2A4A;
  --text:       #E8E8F0;
  --muted:      #888899;
  --green:      #39D98A;
  --green-dark: #2CC077;
  --amber:      #F1C40F;
  background: var(--bg) !important;
}

body.theme-mid .card,
body.theme-mid .habit-card,
body.theme-mid .mentor-card,
body.theme-menengah .card,
body.theme-menengah .habit-card,
body.theme-menengah .mentor-card {
  background: var(--card-bg) !important;
  border: 1px solid var(--border) !important;
  border-radius: 14px !important;
  color: var(--text) !important;
}

body.theme-mid .hero,
body.theme-menengah .hero {
  background: linear-gradient(135deg, #0D0D1F, #1A1A2E) !important;
  border: 1px solid #2A2A4A !important;
  box-shadow: 0 0 20px rgba(57,217,138,0.1) !important;
}
body.theme-mid .hero-name,
body.theme-menengah .hero-name {
  color: #FFFFFF !important;
  font-size: 20px !important;
  font-weight: 900 !important;
}
body.theme-mid .hero-greeting,
body.theme-menengah .hero-greeting {
  color: rgba(255,255,255,0.5) !important;
}
body.theme-mid .hstat,
body.theme-menengah .hstat {
  background: rgba(255,255,255,0.05) !important;
  border-color: #2A2A4A !important;
}
body.theme-mid .hstat-num,
body.theme-menengah .hstat-num {
  color: #39D98A !important;
  font-weight: 900 !important;
}
body.theme-mid .hstat-label,
body.theme-menengah .hstat-label {
  color: rgba(255,255,255,0.45) !important;
}
body.theme-mid .xp-fill,
body.theme-menengah .xp-fill {
  background: linear-gradient(90deg, #2CC077, #39D98A) !important;
  box-shadow: 0 0 8px rgba(57,217,138,0.4) !important;
}

body.theme-mid .sec-title,
body.theme-menengah .sec-title {
  color: var(--text) !important;
}
body.theme-mid .mentor-name,
body.theme-menengah .mentor-name { color: #39D98A !important; }
body.theme-mid .mentor-msg,
body.theme-menengah .mentor-msg  { color: var(--text) !important; }
body.theme-mid .h-name,
body.theme-menengah .h-name      { color: var(--text) !important; font-weight: 700 !important; }

body.theme-mid .habit-card.checked,
body.theme-menengah .habit-card.checked {
  border-color: #39D98A !important;
  background: rgba(57,217,138,0.08) !important;
}
body.theme-mid .habit-card.checked .hchk,
body.theme-menengah .habit-card.checked .hchk {
  background: #39D98A !important;
  border-color: #39D98A !important;
  color: #0D0D1F !important;
}

body.theme-mid .bottom-nav,
body.theme-menengah .bottom-nav {
  background: #16213E !important;
  border-top: 1px solid #2A2A4A !important;
}
body.theme-mid .nav-label,
body.theme-menengah .nav-label { color: #888899 !important; }
body.theme-mid .nav-item.active .nav-label,
body.theme-menengah .nav-item.active .nav-label { color: #39D98A !important; }

body.theme-mid .topbar,
body.theme-menengah .topbar {
  background: #0D0D1F !important;
  border-bottom: 1px solid #2A2A4A !important;
}
body.theme-mid .topbar-name,
body.theme-menengah .topbar-name { color: #E8E8F0 !important; }
body.theme-mid .topbar-sub,
body.theme-menengah .topbar-sub  { color: #888899 !important; }

/* Scoped twinkle — HANYA di streak-badge, tidak di .streak-row */
body.theme-mid .streak-badge,
body.theme-menengah .streak-badge {
  animation: _agt_twinkle 1.5s ease-in-out infinite alternate;
}
@keyframes _agt_twinkle {
  from { opacity: 0.7; transform: scale(0.95); }
  to   { opacity: 1;   transform: scale(1.05); }
}

    `;
    document.head.appendChild(s);
    console.log('[AGT] CSS injected ✅');
  }

  // ─────────────────────────────────────────────────────────
  // 3. PATCH DS.showModal() — modal daily surprise theme-young
  //
  // Masalah: DS (daily-surprise.js) set box.style.background
  // secara INLINE setelah modal tampil → CSS !important tidak
  // cukup untuk override inline style.
  //
  // Solusi: wrap DS.showModal(), tunggu 60ms setelah DS selesai
  // set inline style, lalu re-apply palette cerah.
  // ─────────────────────────────────────────────────────────
  function applyYoungModalStyle() {
    var isYoung = document.body.classList.contains('theme-young') ||
                  document.body.classList.contains('theme-muda');
    if (!isYoung) return;

    var box   = document.getElementById('_ds_modal_box');
    var modal = document.getElementById('_ds_modal');
    if (!box || !modal) return;

    // Backdrop — kuning cerah transparan, bukan hitam kelam
    modal.style.background     = 'rgba(255,210,120,0.60)';
    modal.style.backdropFilter = 'blur(14px)';

    // Box — putih hangat, border oranye
    box.style.background = 'linear-gradient(160deg, #FFFDF0, #FFF3D0)';
    box.style.border     = '2.5px solid #FFB347';
    box.style.boxShadow  = '0 16px 48px rgba(255,140,40,0.28)';

    // Teks — gelap supaya terbaca di background terang
    var day  = document.getElementById('_ds_m_day');
    var name = document.getElementById('_ds_m_name');
    var bon  = document.getElementById('_ds_m_bon');
    var stxt = document.getElementById('_ds_m_stxt');
    if (day)  { day.style.color  = '#A0522D'; }
    if (name) { name.style.color = '#2D1B0E'; name.style.fontSize = '22px'; }
    if (bon)  { bon.style.color  = '#B85C0A'; }
    if (stxt) { stxt.style.color = '#5A4030'; }

    // Syekh box — hijau mint lembut
    var syekh = box.querySelector('._ds_m_syekh');
    if (syekh) {
      syekh.style.background = 'rgba(95,214,138,0.18)';
      syekh.style.border     = '1.5px solid rgba(61,190,110,0.4)';
    }

    // Tombol — oranye vivid, sudut bulat besar (tema young)
    var btn = document.getElementById('_ds_m_btn');
    if (btn) {
      btn.style.background   = 'linear-gradient(135deg, #FF8C42, #FF6010)';
      btn.style.color        = '#fff';
      btn.style.fontSize     = '16px';
      btn.style.fontWeight   = '900';
      btn.style.borderRadius = '20px';
      btn.style.boxShadow    = '0 6px 18px rgba(255,100,16,0.35)';
    }
  }

  function patchDSModal() {
    if (typeof W.DS === 'undefined') {
      setTimeout(patchDSModal, 200);
      return;
    }

    var _orig = W.DS.showModal;
    W.DS.showModal = function () {
      _orig.call(this);
      // Tunggu DS selesai set inline style (~50ms), lalu override
      setTimeout(applyYoungModalStyle, 60);
    };

    console.log('[AGT] DS.showModal patched — theme-young modal fix aktif ✅');
  }

  // ─────────────────────────────────────────────────────────
  // 4. BOOT
  // ─────────────────────────────────────────────────────────
  function boot() {
    injectCSS();
    patchApplyAgeThemeClass();
    patchDSModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
