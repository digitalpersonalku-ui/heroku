// ═══════════════════════════════════════════════════════════
// HEROKU MICRO-REWARD SYSTEM v1.0
// Tahap 2 dari 5 — Anti-Jenuh: Loop Pendek
//
// File: js/micro-reward.js
// Pasang setelah daily-surprise.js:
//   <script src="js/micro-reward.js"></script>
//
// Masalah yang diselesaikan:
//   Loop lama: Login → 7 centang → tutup (membosankan)
//   Loop baru: tiap 1-2 centang ada "hadiah kecil" yang
//   membuat siswa ingin balik lagi siang/sore
//
// 5 Mekanisme:
//   A. Progress Milestones  — hadiah di 1, 3, 5, 7 misi
//   B. Combo Streak         — centang cepat berturut = bonus
//   C. "Balik Lagi" Nudge  — notifikasi sore jika belum selesai
//   D. Micro-Badge Harian   — badge kecil per sesi (tidak permanen)
//   E. Koin Surprise        — koin random kecil saat centang
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─── Utils ───────────────────────────────────────────────
  function nick() {
    if (typeof CU === 'undefined' || !CU) return 'Adik';
    return CU.nickname || (CU.name || '').split(' ')[0] || 'Adik';
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function done()    { return Object.keys((typeof CU !== 'undefined' && CU?.checkedToday) || {}).length; }

  // ═══════════════════════════════════════════════════════════
  // A. PROGRESS MILESTONES
  // Hadiah emosional di titik-titik penting dalam satu hari
  // ═══════════════════════════════════════════════════════════
  const MILESTONES = {
    1: {
      title:  'Langkah Pertama! 🌱',
      msgs: [
        'Bismillah! {name} sudah mulai — ini yang paling penting!',
        'Satu langkah sudah diambil, {name}! Perjalanan seribu mil dimulai dari sini.',
        'MasyaAllah {name}! Yang pertama selalu yang paling berani.',
      ],
      reward: { koin: 5, label: '+5 Koin Semangat!' },
      color: '#27AE60',
    },
    3: {
      title:  'Setengah Jalan! ⚡',
      msgs: [
        'Luar biasa {name}! 3 kebiasaan selesai — kamu sudah di jalur yang benar!',
        'Subhanallah {name}! Tiga langkah menuju tujuh. Jangan berhenti sekarang!',
        '{name} — 3/7! Di titik ini kebanyakan orang menyerah. Tapi kamu bukan yang kebanyakan!',
      ],
      reward: { koin: 10, label: '+10 Koin Pejuang!' },
      color: '#E67E22',
    },
    5: {
      title:  'Hampir Sampai! 🔥',
      msgs: [
        'WOW {name}! 5 dari 7 — finish line sudah kelihatan!',
        'Ahsanta {name}! Tinggal 2 langkah lagi. Syekh bisa melihat semangatmu!',
        '{name} luar biasa! 5/7 — 2 kebiasaan terakhir menunggumu!',
      ],
      reward: { koin: 15, label: '+15 Koin Juara!' },
      color: '#E74C3C',
    },
    7: {
      title:  'SEMPURNA! 🏆',
      msgs: [
        'MASYAALLAH {name}!!! 7/7 SEMPURNA! Hari ini kamu adalah bintang!',
        'Subhanallah tabarakallah {name}! Semua selesai — ini hari yang Allah catat!',
        'ALLAHU AKBAR {name}! 7 dari 7! Syekh tidak bisa lebih bangga dari ini!',
      ],
      reward: { koin: 25, label: '+25 Koin Sempurna!' },
      color: '#F1C40F',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // B. COMBO SYSTEM
  // Centang 2-3 misi dalam waktu berdekatan = bonus combo
  // ═══════════════════════════════════════════════════════════
  let _lastCheckTime = 0;
  let _comboCount    = 0;
  let _comboTimer    = null;

  const COMBOS = {
    2: { label: 'COMBO x2! ⚡',  koin: 8,  msg: '2 kebiasaan berturut — kombinasi yang bagus!' },
    3: { label: 'COMBO x3! 🔥',  koin: 15, msg: '3 berturut-turut! Kamu on fire hari ini!' },
    4: { label: 'COMBO x4! 💎',  koin: 25, msg: '4 COMBO! Tak tertandingi hari ini, {name}!' },
    5: { label: 'ULTRA COMBO! 👑', koin: 40, msg: 'ULTRA COMBO! 5 kebiasaan tanpa henti — LEGENDARIS!' },
  };
  const COMBO_WINDOW_MS = 90000; // 90 detik = masih dihitung combo

  // ═══════════════════════════════════════════════════════════
  // C. MICRO-BADGE HARIAN
  // Badge kecil yang muncul di sesi — tidak masuk koleksi permanen
  // Tujuan: rasa pencapaian yang lebih sering
  // ═══════════════════════════════════════════════════════════
  const SESSION_BADGES = [
    // Muncul berdasarkan kondisi saat check-in
    { id: 'earlybird',  icon: '🌅', name: 'Early Bird!',     cond: () => new Date().getHours() < 7,    msg: 'Bangun dan centang sebelum jam 7 pagi!' },
    { id: 'speedrun',   icon: '⚡', name: 'Speed Runner!',   cond: () => _comboCount >= 3,               msg: '3 kebiasaan selesai dalam waktu singkat!' },
    { id: 'allmorning', icon: '☀️', name: 'Pagi Produktif!', cond: () => new Date().getHours() < 12 && done() >= 3, msg: '3 kebiasaan selesai sebelum siang!' },
    { id: 'nightowl',   icon: '🌙', name: 'Pejuang Malam!', cond: () => new Date().getHours() >= 20,   msg: 'Masih semangat meski sudah malam!' },
    { id: 'comeback',   icon: '💪', name: 'Comeback King!',  cond: () => {
        if (typeof CU === 'undefined' || !CU) return false;
        const streak = CU.streak || 0;
        return streak === 1 && (CU.totalDays || 0) > 3;
      }, msg: 'Kembali lagi setelah absen — ini butuh keberanian!' },
    { id: 'halfway',    icon: '🎯', name: 'Half Way There!', cond: () => done() === 4,                  msg: '4 dari 7 — tepat setengah jalan!' },
    { id: 'almostdone', icon: '🏃', name: 'Almost There!',   cond: () => done() === 6,                  msg: '6 dari 7 — satu langkah lagi!' },
  ];

  // Track badge yang sudah muncul hari ini
  function getShownBadges() {
    const key = '_mr_badges_' + (typeof CU !== 'undefined' && CU ? CU.id : 'x');
    try { return JSON.parse(sessionStorage.getItem(key) || '[]'); } catch { return []; }
  }
  function markBadgeShown(id) {
    const key = '_mr_badges_' + (typeof CU !== 'undefined' && CU ? CU.id : 'x');
    const shown = getShownBadges();
    shown.push(id);
    sessionStorage.setItem(key, JSON.stringify(shown));
  }

  // ═══════════════════════════════════════════════════════════
  // D. KOIN SURPRISE — koin bonus kecil random
  // ═══════════════════════════════════════════════════════════
  const SURPRISE_COINS = [
    { chance: 0.15, koin: 3,  msg: '🎁 Bonus Tersembunyi! +3 Koin!' },
    { chance: 0.08, koin: 7,  msg: '✨ Lucky Coin! +7 Koin!' },
    { chance: 0.03, koin: 15, msg: '💎 JACKPOT! +15 Koin Langka!' },
  ];

  function rollSurpriseCoin() {
    const r = Math.random();
    let cumulative = 0;
    for (const s of SURPRISE_COINS) {
      cumulative += s.chance;
      if (r < cumulative) return s;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // E. "BALIK LAGI" NUDGE
  // Sore hari, jika belum selesai, muncul mini-reminder
  // ═══════════════════════════════════════════════════════════
  const NUDGES = [
    { hour: 14, minDone: 0, maxDone: 3,
      msg: '☀️ Hai {name}! Sudah siang nih — yuk selesaikan misimu sebelum Ashar!',
      cta: 'Buka Misi Sekarang →' },
    { hour: 16, minDone: 0, maxDone: 5,
      msg: '🌤️ {name}, masih ada waktu sebelum sore! {remaining} misi menunggumu.',
      cta: 'Selesaikan Sekarang →' },
    { hour: 19, minDone: 0, maxDone: 6,
      msg: '🌙 {name}! Malam hampir tiba — jangan tidur sebelum {remaining} misi ini selesai!',
      cta: 'Buruan Selesaikan! 🏃' },
  ];

  // ═══════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════
  function injectCSS() {
    if (document.getElementById('_mr_css')) return;
    const s = document.createElement('style');
    s.id = '_mr_css';
    s.textContent = `

/* ── Milestone Toast ── */
#_mr_toast {
  position: fixed; top: 0; left: 50%;
  transform: translateX(-50%) translateY(-100%);
  z-index: 9500; max-width: 300px; width: calc(100% - 28px);
  transition: transform .35s cubic-bezier(.34,1.5,.64,1);
  pointer-events: none;
}
#_mr_toast.show {
  transform: translateX(-50%) translateY(10px);
  pointer-events: all;
}
._mr_toast_inner {
  border-radius: 18px; padding: 12px 16px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 8px 28px rgba(0,0,0,.4);
  position: relative; overflow: hidden;
}
._mr_t_icon { font-size: 28px; flex-shrink:0; }
._mr_t_body { flex:1; min-width:0; }
._mr_t_title{ font-size:13px; font-weight:900; color:#fff; margin-bottom:2px; }
._mr_t_msg  { font-size:11px; color:rgba(255,255,255,.7); line-height:1.5; }
._mr_t_rew  { font-size:10px; font-weight:800; margin-top:3px; }
._mr_t_shine{
  position:absolute; inset:0; border-radius:18px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);
  transform:translateX(-100%);
  animation: _mrShine .6s ease-in-out .2s forwards;
}
@keyframes _mrShine { to { transform:translateX(200%); } }

/* ── Combo Counter ── */
#_mr_combo {
  position: fixed; top: 70px; right: 14px;
  z-index: 9400; pointer-events: none;
  display: none;
}
._mr_combo_inner {
  background: linear-gradient(135deg,#E74C3C,#C0392B);
  border-radius: 14px; padding: 8px 14px;
  text-align: center; box-shadow: 0 4px 16px rgba(231,76,60,.4);
  border: 1.5px solid rgba(255,100,100,.4);
}
._mr_co_num { font-size:24px; font-weight:900; color:#fff; line-height:1; }
._mr_co_lbl { font-size:9px; font-weight:700; color:rgba(255,255,255,.7);
              letter-spacing:1px; text-transform:uppercase; }
._mr_combo_inner.yellow {
  background:linear-gradient(135deg,#F1C40F,#D68910);
  box-shadow:0 4px 16px rgba(241,196,15,.4);
  border-color:rgba(255,220,50,.4);
}

/* ── Session Badge Popup ── */
#_mr_badge {
  position: fixed; bottom: 80px; left: 50%;
  transform: translateX(-50%) translateY(80px);
  z-index: 9400; pointer-events: none;
  transition: transform .35s cubic-bezier(.34,1.5,.64,1);
  opacity: 0;
}
#_mr_badge.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}
._mr_badge_inner {
  background: rgba(26,26,46,.96);
  border: 1.5px solid rgba(255,255,255,.15);
  border-radius: 20px; padding: 9px 16px;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,.4);
  white-space: nowrap;
}
._mr_b_icon { font-size:22px; }
._mr_b_body { }
._mr_b_name { font-size:12px; font-weight:800; color:#FFE066; }
._mr_b_msg  { font-size:10px; color:rgba(255,255,255,.55); }

/* ── Progress Track Bar ── */
#_mr_progress_track {
  display: flex; gap: 6px; padding: 8px 0 4px;
  justify-content: center; align-items: center;
}
._mr_pt_dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: rgba(255,255,255,.15);
  border: 1.5px solid rgba(255,255,255,.2);
  transition: all .3s cubic-bezier(.34,1.5,.64,1);
  position: relative;
}
._mr_pt_dot.done {
  background: var(--col, #2ECC71);
  border-color: var(--col, #2ECC71);
  transform: scale(1.2);
  box-shadow: 0 0 8px var(--col, #2ECC71);
}
._mr_pt_dot.done::after {
  content: '✓'; position: absolute; top:50%; left:50%;
  transform: translate(-50%,-50%);
  font-size: 6px; color: #fff; font-weight:900;
}
._mr_pt_line {
  flex:1; height:2px; background:rgba(255,255,255,.1);
  border-radius:1px; max-width:20px;
}
._mr_pt_label {
  font-size: 9px; color: rgba(255,255,255,.4);
  font-weight: 700; text-align: center; margin-top: 2px;
}

/* ── Nudge Banner ── */
#_mr_nudge {
  border-radius:14px; padding:10px 14px;
  background:rgba(231,76,60,.12);
  border:1px solid rgba(231,76,60,.3);
  margin-bottom:10px;
  display:none; align-items:center; gap:10px;
  animation: _mrNudge .4s cubic-bezier(.34,1.5,.64,1) both;
}
#_mr_nudge.show { display:flex; }
@keyframes _mrNudge { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
._mr_nu_em  { font-size:22px; flex-shrink:0; }
._mr_nu_bod { flex:1; }
._mr_nu_msg { font-size:11px; color:rgba(255,255,255,.75); line-height:1.5; }
._mr_nu_cta { font-size:10px; font-weight:800; color:#E74C3C; margin-top:3px; cursor:pointer; }

/* ── Koin Surprise Float ── */
._mr_coin_float {
  position: fixed; z-index:9600; pointer-events:none;
  font-size:14px; font-weight:900;
  background:linear-gradient(135deg,#FFE066,#D68910);
  color:#1A1A2E; border-radius:20px; padding:4px 12px;
  will-change:transform,opacity;
}
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  // HTML
  // ═══════════════════════════════════════════════════════════
  function injectHTML() {
    if (document.getElementById('_mr_toast')) return;
    document.body.insertAdjacentHTML('beforeend', `
<div id="_mr_toast">
  <div class="_mr_toast_inner" id="_mr_toast_inner">
    <span class="_mr_t_icon" id="_mr_t_icon">🌱</span>
    <div class="_mr_t_body">
      <div class="_mr_t_title" id="_mr_t_title">Milestone!</div>
      <div class="_mr_t_msg"   id="_mr_t_msg">Pesan</div>
      <div class="_mr_t_rew"   id="_mr_t_rew"></div>
    </div>
    <div class="_mr_t_shine"></div>
  </div>
</div>

<div id="_mr_combo">
  <div class="_mr_combo_inner" id="_mr_combo_inner">
    <div class="_mr_co_num" id="_mr_co_num">x2</div>
    <div class="_mr_co_lbl">COMBO!</div>
  </div>
</div>

<div id="_mr_badge">
  <div class="_mr_badge_inner">
    <span class="_mr_b_icon" id="_mr_b_icon">⭐</span>
    <div class="_mr_b_body">
      <div class="_mr_b_name" id="_mr_b_name">Badge!</div>
      <div class="_mr_b_msg"  id="_mr_b_msg">Kamu dapat ini!</div>
    </div>
  </div>
</div>
    `);
  }

  // ═══════════════════════════════════════════════════════════
  // SHOW FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  let _toastTimer = null;

  function showMilestoneToast(ms, habitIcon) {
    const inner = document.getElementById('_mr_toast_inner');
    if (!inner) return;

    const msg = pick(ms.msgs).replace('{name}', nick());
    document.getElementById('_mr_t_icon').textContent  = habitIcon || '🌟';
    document.getElementById('_mr_t_title').textContent = ms.title;
    document.getElementById('_mr_t_msg').textContent   = msg;
    const rewEl = document.getElementById('_mr_t_rew');
    if (rewEl) {
      rewEl.textContent = ms.reward.label;
      rewEl.style.color = ms.color;
    }
    inner.style.background = `linear-gradient(135deg,${ms.color}22,rgba(26,26,46,.97))`;
    inner.style.borderLeft = `3px solid ${ms.color}`;

    // Muncul
    const toast = document.getElementById('_mr_toast');
    toast.classList.add('show');

    // Haptic + sound
    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
    if (typeof HA !== 'undefined') setTimeout(() => HA.play('coin'), 100);

    // Auto hilang
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);

    // Float koin reward
    if (ms.reward.koin > 0) {
      setTimeout(() => showCoinFloat(ms.reward.koin), 400);
    }
  }

  function showCombo(count) {
    const combo = COMBOS[Math.min(count, 5)] || COMBOS[5];
    if (!combo) return;

    const el    = document.getElementById('_mr_combo');
    const inner = document.getElementById('_mr_combo_inner');
    const num   = document.getElementById('_mr_co_num');
    if (!el || !num) return;

    num.textContent = 'x' + count;
    inner.className = '_mr_combo_inner' + (count >= 4 ? ' yellow' : '');
    el.style.display = 'block';

    // Bounce animasi
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(el,
        { scale: .4, opacity: 0 },
        { scale: 1, opacity: 1, duration: .3, ease: 'back.out(2.5)' });
      // Hilang setelah 2 detik
      clearTimeout(el._t);
      el._t = setTimeout(() => {
        gsap.to(el, { scale: .8, opacity: 0, duration: .2, onComplete: () => el.style.display = 'none' });
      }, 2000);
    } else {
      clearTimeout(el._t);
      el._t = setTimeout(() => el.style.display = 'none', 2000);
    }

    // Bonus koin combo
    if (typeof CU !== 'undefined' && CU && combo.koin > 0) {
      CU.koin += combo.koin;
      if (typeof saveCU === 'function') saveCU();
      if (typeof updateStats === 'function') updateStats();
      showCoinFloat(combo.koin);
    }

    // Toast combo
    setTimeout(() => {
      if (typeof showToast === 'function') {
        showToast(`${combo.label} +${combo.koin} Koin!`);
      }
    }, 200);

    if (typeof HA !== 'undefined') HA.play('badge');
    if (navigator.vibrate) navigator.vibrate([15, 8, 15, 8, 30]);
  }

  function showSessionBadge(badge) {
    document.getElementById('_mr_b_icon').textContent = badge.icon;
    document.getElementById('_mr_b_name').textContent = badge.name;
    document.getElementById('_mr_b_msg').textContent  = badge.msg;
    markBadgeShown(badge.id);

    const el = document.getElementById('_mr_badge');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);

    if (typeof HA !== 'undefined') HA.play('badge');
  }

  function showCoinFloat(amount) {
    const el = document.createElement('div');
    el.className = '_mr_coin_float';
    el.textContent = '+' + amount + ' ⭐';
    document.body.appendChild(el);
    el.style.left  = (window.innerWidth / 2 - 40) + 'px';
    el.style.top   = '120px';

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(el,
        { opacity: 0, y: 0, scale: .7 },
        { opacity: 1, y: -55, scale: 1.05, duration: .35, ease: 'back.out(2)',
          onComplete: () => gsap.to(el, {
            opacity: 0, y: '-=20', duration: .3, delay: .6,
            onComplete: () => el.remove()
          }) });
    } else {
      setTimeout(() => el.remove(), 1500);
    }
  }

  // ── Progress Track Bar di beranda ─────────────────────────
  function renderProgressTrack() {
    const old = document.getElementById('_mr_progress_track');
    if (old) old.remove();

    const doneSet = typeof CU !== 'undefined' ? (CU.checkedToday || {}) : {};
    const HABITS_DATA = typeof HABITS !== 'undefined' ? HABITS : [];
    const colors = ['#2ECC71','#9B59B6','#E74C3C','#27AE60','#3498DB','#1ABC9C','#8E44AD'];

    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:0 4px 8px';
    wrap.innerHTML = `
      <div style="font-size:9px;color:rgba(255,255,255,.35);
        text-align:center;letter-spacing:1px;text-transform:uppercase;
        margin-bottom:5px;font-weight:700">
        Progress Hari Ini
      </div>`;

    const track = document.createElement('div');
    track.id = '_mr_progress_track';

    HABITS_DATA.forEach((hb, i) => {
      const isDone = !!doneSet[hb.id];
      const dot = document.createElement('div');
      dot.className = '_mr_pt_dot' + (isDone ? ' done' : '');
      dot.style.setProperty('--col', colors[i]);
      dot.title = hb.name;
      track.appendChild(dot);
      if (i < HABITS_DATA.length - 1) {
        const line = document.createElement('div');
        line.className = '_mr_pt_line';
        if (isDone) line.style.background = colors[i] + '55';
        track.appendChild(line);
      }
    });

    wrap.appendChild(track);

    // Sisipkan sebelum habits-list
    const habitsList = document.getElementById('habits-list');
    if (habitsList && habitsList.parentElement) {
      habitsList.parentElement.insertBefore(wrap, habitsList);
    }
  }

  // ── Nudge sore hari ───────────────────────────────────────
  function checkNudge() {
    if (typeof CU === 'undefined' || !CU) return;
    const d = done();
    if (d >= 7) return; // sudah selesai semua

    const h    = new Date().getHours();
    const nudge = NUDGES.find(n => h >= n.hour && d >= n.minDone && d <= n.maxDone);
    if (!nudge) return;

    // Cek sudah ditampilkan hari ini?
    const key = `_mr_nudge_${h}_${typeof CU !== 'undefined' && CU ? CU.id : 'x'}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    const habitsList = document.getElementById('habits-list');
    if (!habitsList || !habitsList.parentElement) return;

    const old = document.getElementById('_mr_nudge');
    if (old) old.remove();

    const remaining = 7 - d;
    const el = document.createElement('div');
    el.id = '_mr_nudge';
    el.innerHTML = `
      <span class="_mr_nu_em">⏰</span>
      <div class="_mr_nu_bod">
        <div class="_mr_nu_msg">${nudge.msg.replace('{name}', nick()).replace('{remaining}', remaining)}</div>
        <div class="_mr_nu_cta" onclick="document.getElementById('_mr_nudge').classList.remove('show')">
          ${nudge.cta}
        </div>
      </div>
    `;
    habitsList.parentElement.insertBefore(el, habitsList);
    requestAnimationFrame(() => el.classList.add('show'));
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN LOGIC — dipanggil setiap check-in
  // ═══════════════════════════════════════════════════════════
  function onCheckIn(habitId, habitIcon) {
    const now    = Date.now();
    const doneCt = done();

    // ── Combo system ─────────────────────────────
    const timeSinceLast = now - _lastCheckTime;
    if (timeSinceLast < COMBO_WINDOW_MS && _lastCheckTime > 0) {
      _comboCount++;
      clearTimeout(_comboTimer);
      if (_comboCount >= 2) {
        setTimeout(() => showCombo(_comboCount), 600);
      }
      // Reset combo jika tidak ada check-in dalam 90 detik
      _comboTimer = setTimeout(() => {
        _comboCount = 0;
      }, COMBO_WINDOW_MS);
    } else {
      _comboCount = 1;
    }
    _lastCheckTime = now;

    // ── Milestone ────────────────────────────────
    const ms = MILESTONES[doneCt];
    if (ms) {
      setTimeout(() => showMilestoneToast(ms, habitIcon), 800);
      // Berikan koin reward milestone
      if (typeof CU !== 'undefined' && CU && ms.reward.koin > 0) {
        CU.koin += ms.reward.koin;
        if (typeof saveCU === 'function') saveCU();
        if (typeof updateStats === 'function') updateStats();
      }
    }

    // ── Session Badge ─────────────────────────────
    const shownBadges = getShownBadges();
    const eligible = SESSION_BADGES.find(b =>
      !shownBadges.includes(b.id) && b.cond());
    if (eligible) {
      setTimeout(() => showSessionBadge(eligible), 1600);
    }

    // ── Koin Surprise ─────────────────────────────
    const surprise = rollSurpriseCoin();
    if (surprise) {
      if (typeof CU !== 'undefined' && CU) {
        CU.koin += surprise.koin;
        if (typeof saveCU === 'function') saveCU();
        if (typeof updateStats === 'function') updateStats();
      }
      setTimeout(() => {
        if (typeof showToast === 'function') showToast(surprise.msg);
        showCoinFloat(surprise.koin);
      }, 2200);
    }

    // ── Update progress track ─────────────────────
    setTimeout(renderProgressTrack, 200);
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════
  const MR = {};
  MR.renderProgressTrack = renderProgressTrack;
  MR.checkNudge          = checkNudge;
  MR.showCoinFloat       = showCoinFloat;
  W.MR = MR;

  // ═══════════════════════════════════════════════════════════
  // INTEGRASI
  // ═══════════════════════════════════════════════════════════
  function integrate() {

    // Hook ke EventBus check-in
    if (typeof W.HeroKuEvents !== 'undefined') {
      W.HeroKuEvents.on('checkin', function (e) {
        const hb = e.detail?.habit;
        if (hb) onCheckIn(hb.id, hb.icon);
      });

      // Render progress track saat buka beranda
      W.HeroKuEvents.on('pageSwitch', function (e) {
        if (e.detail?.page === 'beranda') {
          setTimeout(() => {
            renderProgressTrack();
            checkNudge();
          }, 300);
        }
      });
    }

    // Patch renderHabits → update progress track
    if (typeof W.renderHabits === 'function') {
      const _orig = W.renderHabits;
      W.renderHabits = function () {
        _orig.call(this);
        setTimeout(renderProgressTrack, 100);
      };
    }

    // Cek nudge setiap 15 menit
    setInterval(checkNudge, 15 * 60 * 1000);

    console.log('[MR] Micro-Reward System siap ✅ — milestone, combo, badge, surprise!');
  }

  function boot() {
    injectCSS();
    injectHTML();

    let tries = 0;
    const wait = setInterval(() => {
      if (typeof W.HeroKuEvents !== 'undefined' || tries > 60) {
        clearInterval(wait);
        integrate();
      }
      tries++;
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
