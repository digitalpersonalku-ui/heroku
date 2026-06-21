// ═══════════════════════════════════════════════════════════
// HEROKU WEEKLY RITUAL v1.0
// Tahap 5 dari 5 — Anti-Jenuh: Ritual Mingguan
//
// File: js/weekly-ritual.js
// Pasang setelah parent-connect.js:
//   <script src="js/weekly-ritual.js"></script>
//
// Masalah yang diselesaikan:
//   Senin = menyeramkan (streak putus, mulai dari 0)
//   Solusi: Senin = babak baru yang EXCITING
//
// 5 Mekanisme:
//   A. Weekly Recap     — "Minggu lalu kamu luar biasa!"
//   B. Weekly Goal      — target personal tiap pekan
//   C. Senin Celebration— Senin pagi = perayaan babak baru
//   D. Week Progress    — visual 7 hari dalam satu minggu
//   E. Weekly Trophy    — trofi mini di akhir minggu
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─── Utils ───────────────────────────────────────────────
  function nick() {
    if (typeof CU === 'undefined' || !CU) return 'Adik';
    return CU.nickname || (CU.name || '').split(' ')[0] || 'Adik';
  }
  function dow()  { return new Date().getDay(); } // 0=Ahad, 1=Sen
  function isMon(){ return dow() === 1; }
  function isSun(){ return dow() === 0; }
  function isFri(){ return dow() === 5; }
  function weekKey() {
    // Key unik per minggu — ISO week number + tahun
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - jan1) / 86400000) + jan1.getDay() + 1) / 7);
    return `w${d.getFullYear()}${week}`;
  }
  function storageKey(suffix) {
    const uid = typeof CU !== 'undefined' && CU ? CU.id : 'anon';
    return `_wr_${uid}_${suffix}`;
  }

  // ─── Storage helpers ─────────────────────────────────────
  function getLS(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch(e) { return def; }
  }
  function setLS(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════
  // DATA MINGGUAN — simpan & baca progress harian
  // ═══════════════════════════════════════════════════════════

  // Simpan progress hari ini ke weekly log
  function logTodayProgress() {
    if (typeof CU === 'undefined' || !CU) return;
    const key  = storageKey(weekKey());
    const log  = getLS(key, {});
    const today = new Date().toISOString().slice(0, 10);
    const done  = Object.keys(CU.checkedToday || {}).length;

    log[today] = {
      done,
      perfect:  done === 7,
      streak:   CU.streak || 0,
      koin:     CU.koin || 0,
      xp:       (CU.xp || 0),
    };
    setLS(key, log);
  }

  // Ambil ringkasan minggu ini
  function getWeekSummary() {
    if (typeof CU === 'undefined' || !CU) return null;
    const key = storageKey(weekKey());
    const log = getLS(key, {});
    const days = Object.values(log);

    return {
      daysActive:   days.length,
      perfectDays:  days.filter(d => d.perfect).length,
      totalMissions:days.reduce((s, d) => s + d.done, 0),
      maxStreak:    Math.max(...days.map(d => d.streak || 0), 0),
      log,
    };
  }

  // Ambil ringkasan MINGGU LALU
  function getLastWeekSummary() {
    if (typeof CU === 'undefined' || !CU) return null;
    // Hitung key minggu lalu
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - jan1) / 86400000) + jan1.getDay() + 1) / 7);
    const lastKey = storageKey(`w${d.getFullYear()}${week}`);
    const log  = getLS(lastKey, {});
    const days = Object.values(log);
    if (!days.length) return null;

    return {
      daysActive:    days.length,
      perfectDays:   days.filter(d => d.perfect).length,
      totalMissions: days.reduce((s, d) => s + d.done, 0),
      maxStreak:     Math.max(...days.map(d => d.streak || 0), 0),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // COPY WRITING
  // ═══════════════════════════════════════════════════════════

  // A. Recap minggu lalu
  const RECAP_MSGS = {
    perfect: [
      'MasyaAllah {name}! Minggu lalu kamu LUAR BIASA — {perfect} hari sempurna! Pekan ini, bisakah kamu melampauinya?',
      'Subhanallah {name}! {perfect} hari sempurna minggu lalu. Syekh berharap minggu ini bahkan lebih indah!',
    ],
    great: [
      '{name}, minggu lalu kamu aktif {days} hari dari 7! Itu pencapaian yang sungguh bagus. Minggu ini, bisakah {days+1} hari?',
      'Alhamdulillah {name}! {days} hari aktif minggu lalu. Pekan baru = kesempatan baru yang lebih baik!',
    ],
    good: [
      '{name}, minggu lalu sudah {days} hari. Jangan menyerah — minggu ini targetkan {target} hari ya!',
      'Barakallahu fiik {name}! {days} hari sudah luar biasa. Minggu baru = lembaran putih baru!',
    ],
    start: [
      '{name}, minggu baru dimulai hari ini! Pekan ini bisa jadi pekan terbaikmu. Mulai dengan Bismillah!',
      'Selamat datang di pekan baru, {name}! Syekh mendoakanmu — semoga ini minggu yang penuh berkah!',
    ],
  };

  // B. Weekly Goals
  const WEEKLY_GOALS = [
    { id: 'g1', target: 3, label: 'Aktif 3 hari',       icon: '🌱', reward: { koin: 30,  xp: 50 }  },
    { id: 'g2', target: 5, label: 'Aktif 5 hari',       icon: '⚡', reward: { koin: 60,  xp: 100 } },
    { id: 'g3', target: 7, label: 'Aktif 7 hari penuh', icon: '👑', reward: { koin: 120, xp: 200 } },
    { id: 'g4', target: 3, label: '3 hari sempurna',    icon: '🏆', reward: { koin: 100, xp: 180 }, requirePerfect: true },
  ];

  function getActiveGoal() {
    if (typeof CU === 'undefined' || !CU) return WEEKLY_GOALS[0];
    const streak = CU.streak || 0;
    const total  = CU.totalDays || 0;
    // Pilih goal berdasarkan level siswa
    if (total >= 21 || streak >= 14) return WEEKLY_GOALS[3];
    if (total >= 14 || streak >= 7)  return WEEKLY_GOALS[2];
    if (total >= 7  || streak >= 3)  return WEEKLY_GOALS[1];
    return WEEKLY_GOALS[0];
  }

  function getGoalProgress() {
    const goal    = getActiveGoal();
    const summary = getWeekSummary();
    if (!summary) return { goal, current: 0, pct: 0, done: false };

    const current = goal.requirePerfect
      ? summary.perfectDays
      : summary.daysActive;
    const pct  = Math.min(100, Math.round(current / goal.target * 100));
    const done = current >= goal.target;
    return { goal, current, pct, done };
  }

  // C. Senin messages
  const MONDAY_MSGS = [
    { em: '🚀', title: 'BABAK BARU DIMULAI!', sub: '{name}, pekan baru = lembaran putih baru!\nApapun yang terjadi minggu lalu — hari ini kamu mulai dari awal yang segar.' },
    { em: '🌅', title: 'SENIN MUBAROK!',       sub: 'MasyaAllah {name}! Senin adalah hari pertama yang Allah berikan di pekan ini.\n"Mulailah setiap hari dengan niat yang baik." — Imam Syafi\'i' },
    { em: '⚡', title: 'PEKAN TERBAIK DIMULAI!', sub: '{name}, Syekh punya feeling bahwa pekan ini akan jadi yang terbaik!\nBuktikan kepada dirimu sendiri bahwa kamu bisa.' },
  ];

  // E. Weekly Trophy
  const WEEKLY_TROPHIES = {
    7:  { icon: '🏆', name: 'Pahlawan Pekan',    desc: '7 hari aktif — LUAR BIASA!' },
    5:  { icon: '🥇', name: 'Juara Pekan',       desc: '5 hari aktif — Hebat!' },
    3:  { icon: '🥈', name: 'Pejuang Pekan',     desc: '3 hari aktif — Bagus!' },
    1:  { icon: '🥉', name: 'Pemula Pekan',      desc: 'Sudah mulai — langkah pertama!' },
    perfect: { icon: '👑', name: 'Raja Pekan',   desc: 'Semua hari sempurna — LEGENDARIS!' },
  };

  function getWeeklyTrophy() {
    const s = getLastWeekSummary();
    if (!s || s.daysActive === 0) return null;
    if (s.perfectDays >= 5)         return WEEKLY_TROPHIES.perfect;
    if (s.daysActive >= 7)          return WEEKLY_TROPHIES[7];
    if (s.daysActive >= 5)          return WEEKLY_TROPHIES[5];
    if (s.daysActive >= 3)          return WEEKLY_TROPHIES[3];
    return WEEKLY_TROPHIES[1];
  }

  // ═══════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════
  function injectCSS() {
    if (document.getElementById('_wr_css')) return;
    const s = document.createElement('style');
    s.id = '_wr_css';
    s.textContent = `

/* ── Monday Modal ── */
#_wr_monday {
  position: fixed; inset: 0; z-index: 7800;
  background: rgba(8,8,16,.92); backdrop-filter: blur(16px);
  display: none; align-items: center; justify-content: center;
  flex-direction: column; padding: 20px;
}
#_wr_monday.show { display: flex; }
#_wr_monday_box {
  border-radius: 24px; padding: 28px 22px 24px;
  max-width: 300px; width: 100%; text-align: center;
  background: linear-gradient(160deg,#0B1E3B,#1A1A2E,#0B2B1A);
  border: 1.5px solid rgba(52,152,219,.35);
  position: relative; overflow: hidden;
  animation: _wrBoxIn .55s cubic-bezier(.34,1.5,.64,1) both;
}
@keyframes _wrBoxIn {
  from { scale:.45; opacity:0; rotateX(-12deg); }
  to   { scale:1;   opacity:1; rotateX(0deg); }
}
._wr_mon_em  { font-size:64px; display:block; margin-bottom:10px;
               animation: _wrFloat 2s ease-in-out infinite alternate; }
@keyframes _wrFloat {
  from { transform:translateY(0) rotate(-3deg); }
  to   { transform:translateY(-8px) rotate(3deg); }
}
._wr_mon_lbl { font-size:9px; font-weight:800; letter-spacing:2px;
               text-transform:uppercase; color:rgba(52,152,219,.7); margin-bottom:6px; }
._wr_mon_ttl { font-size:22px; font-weight:900; color:#fff; margin-bottom:8px; }
._wr_mon_sub { font-size:12px; color:rgba(255,255,255,.65); line-height:1.7;
               margin-bottom:16px; white-space:pre-line; }

/* ── Trophy Card (dalam Monday modal) ── */
._wr_trophy {
  border-radius: 14px; padding: 10px 14px; margin-bottom: 14px;
  display: flex; align-items: center; gap: 10px; text-align: left;
  background: rgba(241,196,15,.1); border: 1px solid rgba(241,196,15,.25);
}
._wr_tr_ic { font-size: 28px; flex-shrink: 0; }
._wr_tr_nm { font-size: 13px; font-weight: 900; color: #FFE066; margin-bottom: 2px; }
._wr_tr_ds { font-size: 11px; color: rgba(255,255,255,.55); }

/* ── Goal Card (dalam Monday modal) ── */
._wr_goal_card {
  border-radius: 14px; padding: 10px 14px; margin-bottom: 16px;
  background: rgba(46,204,113,.08); border: 1px solid rgba(46,204,113,.2);
  text-align: left;
}
._wr_gc_head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 7px;
}
._wr_gc_lbl { font-size: 11px; font-weight: 800; color: rgba(46,204,113,.8); }
._wr_gc_rew { font-size: 10px; color: rgba(255,255,255,.4); }
._wr_gc_bar { height: 6px; border-radius: 3px; background: rgba(255,255,255,.08); overflow: hidden; }
._wr_gc_fill{
  height: 100%; border-radius: 3px; width: 0%;
  background: linear-gradient(90deg,#2ECC71,#27AE60);
  transition: width 1s cubic-bezier(.22,1,.36,1);
}

._wr_mon_btn {
  width: 100%; padding: 14px; border: none; border-radius: 14px;
  font-size: 14px; font-weight: 900; cursor: pointer; font-family: inherit;
  background: linear-gradient(135deg,#3498DB,#1A5276);
  color: #fff; box-shadow: 0 5px 18px rgba(52,152,219,.35);
  transition: transform .15s;
}
._wr_mon_btn:active { transform: scale(.97); }

/* ── Week Progress Strip ── */
#_wr_week_strip {
  border-radius: 14px; padding: 10px 14px; margin-bottom: 10px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
}
._wr_ws_head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
._wr_ws_title{ font-size: 11px; font-weight: 800; color: rgba(255,255,255,.5);
               letter-spacing: 1px; text-transform: uppercase; }
._wr_ws_goal { font-size: 10px; color: rgba(255,255,255,.35); font-weight: 700; }
._wr_days    {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 4px; margin-bottom: 6px;
}
._wr_day     {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
._wr_day_dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900; border: 1.5px solid;
  transition: all .3s cubic-bezier(.34,1.5,.64,1);
  position: relative;
}
._wr_day_dot.empty   { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.1); color: rgba(255,255,255,.2); }
._wr_day_dot.partial { background: rgba(230,126,34,.15);  border-color: rgba(230,126,34,.4);  color: #E67E22; }
._wr_day_dot.perfect { background: rgba(46,204,113,.2);   border-color: rgba(46,204,113,.6);  color: #2ECC71;
  box-shadow: 0 0 8px rgba(46,204,113,.3); }
._wr_day_dot.today   { border-color: rgba(52,152,219,.6); box-shadow: 0 0 8px rgba(52,152,219,.3); }
._wr_day_dot.future  { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.06); color: rgba(255,255,255,.15); }
._wr_day_lbl {
  font-size: 8px; font-weight: 700; color: rgba(255,255,255,.35);
  text-align: center;
}
._wr_day_lbl.today { color: rgba(52,152,219,.7); }

/* Goal progress bar di strip */
._wr_goal_bar_wrap {
  height: 5px; border-radius: 3px; background: rgba(255,255,255,.06);
  overflow: hidden; margin-top: 4px;
}
._wr_goal_bar_fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg,#2ECC71,#27AE60);
  transition: width 1s cubic-bezier(.22,1,.36,1);
}
._wr_goal_note {
  font-size: 9px; color: rgba(255,255,255,.3); margin-top: 4px; text-align: center;
}

/* ── Friday Reminder ── */
#_wr_friday {
  border-radius: 14px; padding: 10px 14px; margin-bottom: 10px;
  background: rgba(230,126,34,.1); border: 1px solid rgba(230,126,34,.25);
  display: none; align-items: center; gap: 10px;
  animation: _wrFadeIn .4s ease both;
}
#_wr_friday.show { display: flex; }
@keyframes _wrFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
._wr_fr_em  { font-size: 22px; flex-shrink: 0; }
._wr_fr_txt { font-size: 11px; color: rgba(255,255,255,.75); line-height: 1.55; }
._wr_fr_cta { font-size: 10px; font-weight: 800; color: #E67E22; margin-top: 2px; }

/* ── Stars konfeti (weekly) ── */
._wr_star { position:fixed; pointer-events:none; z-index:7900; will-change:transform,opacity; }
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  // HTML
  // ═══════════════════════════════════════════════════════════
  function injectHTML() {
    if (document.getElementById('_wr_monday')) return;
    document.body.insertAdjacentHTML('beforeend', `
<div id="_wr_monday">
  <div id="_wr_monday_box">
    <div class="_wr_mon_lbl" id="_wr_mon_lbl">✨ PEKAN BARU DIMULAI ✨</div>
    <span class="_wr_mon_em" id="_wr_mon_em">🚀</span>
    <div class="_wr_mon_ttl" id="_wr_mon_ttl">BABAK BARU!</div>
    <div class="_wr_mon_sub" id="_wr_mon_sub">Pekan baru menunggumu!</div>
    <div id="_wr_trophy_slot"></div>
    <div id="_wr_goal_slot"></div>
    <button class="_wr_mon_btn" onclick="WR.closeMonday()">
      Bismillah, Mulai Pekan Ini! 🚀
    </button>
  </div>
</div>
    `);
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  // ── D. Week Progress Strip ───────────────────────────────
  function renderWeekStrip() {
    const old = document.getElementById('_wr_week_strip');
    if (old) old.remove();

    if (typeof CU === 'undefined' || !CU) return;

    const key     = storageKey(weekKey());
    const log     = getLS(key, {});
    const gProg   = getGoalProgress();
    const { goal, current, pct } = gProg;

    const DAY_LABELS = ['Ahd','Sen','Sel','Rab','Kam','Jum','Sab'];
    const today = dow();

    // Hitung hari-hari dalam minggu ini (Sen-Ahd)
    const weekDays = [];
    const now = new Date();
    // Mulai dari Senin minggu ini
    const monday = new Date(now);
    const diff = (now.getDay() + 6) % 7; // hari sejak Senin
    monday.setDate(now.getDate() - diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayData = log[dateStr];
      const dayOfWeek = (d.getDay() + 6) % 7; // 0=Sen, 6=Ahd
      const isToday = dateStr === new Date().toISOString().slice(0, 10);
      const isPast  = d < new Date() && !isToday;
      const isFuture = d > now && !isToday;

      weekDays.push({
        label:   ['Sen','Sel','Rab','Kam','Jum','Sab','Ahd'][dayOfWeek],
        done:    dayData?.done || 0,
        perfect: dayData?.perfect || false,
        isToday, isPast, isFuture,
      });
    }

    const el = document.createElement('div');
    el.id = '_wr_week_strip';
    el.innerHTML = `
      <div class="_wr_ws_head">
        <div class="_wr_ws_title">📅 Pekan Ini</div>
        <div class="_wr_ws_goal">${goal.icon} Target: ${goal.label}</div>
      </div>
      <div class="_wr_days" id="_wr_days_grid"></div>
      <div class="_wr_goal_bar_wrap">
        <div class="_wr_goal_bar_fill" id="_wr_goal_bar_fill" style="width:0%"></div>
      </div>
      <div class="_wr_goal_note" id="_wr_goal_note">
        ${current}/${goal.target} ${goal.requirePerfect ? 'hari sempurna' : 'hari aktif'} •
        +${goal.reward.koin} Koin + +${goal.reward.xp} XP saat selesai
      </div>
    `;

    // Render day dots
    const grid = el.querySelector('#_wr_days_grid');
    weekDays.forEach(day => {
      const dotClass = day.isFuture ? 'future'
        : day.perfect    ? 'perfect'
        : day.done > 0   ? 'partial'
        : day.isPast     ? 'empty'
        : 'empty';

      const todayClass = day.isToday ? ' today' : '';
      const symbol = day.perfect ? '✓'
        : day.done > 0 ? day.done
        : day.isFuture ? '○' : '—';

      const dayEl = document.createElement('div');
      dayEl.className = '_wr_day';
      dayEl.innerHTML = `
        <div class="_wr_day_dot ${dotClass}${todayClass}">${symbol}</div>
        <div class="_wr_day_lbl ${day.isToday ? 'today' : ''}">${day.label}</div>
      `;
      grid.appendChild(dayEl);
    });

    // Sisipkan sebelum habits-list
    const habitsList = document.getElementById('habits-list');
    if (habitsList && habitsList.parentElement) {
      habitsList.parentElement.insertBefore(el, habitsList);
      // Animasi bar
      setTimeout(() => {
        const bar = document.getElementById('_wr_goal_bar_fill');
        if (bar) bar.style.width = pct + '%';
      }, 400);
    }
  }

  // ── F. Friday Reminder ────────────────────────────────────
  function renderFridayReminder() {
    const old = document.getElementById('_wr_friday');
    if (old) old.remove();
    if (!isFri()) return;

    const gProg = getGoalProgress();
    const { goal, current } = gProg;
    const remaining = goal.target - current;
    if (remaining <= 0) return; // goal sudah tercapai

    // Cari container
    const habitsList = document.getElementById('habits-list');
    if (!habitsList || !habitsList.parentElement) return;

    const el = document.createElement('div');
    el.id = '_wr_friday';
    el.innerHTML = `
      <span class="_wr_fr_em">📅</span>
      <div>
        <div class="_wr_fr_txt">
          Hari Jumat — pekan hampir usai!
          ${remaining > 0 ? `Masih butuh <strong>${remaining} hari lagi</strong> untuk capai target pekan ini.` : 'Target pekan ini hampir tercapai!'}
        </div>
        <div class="_wr_fr_cta">${goal.icon} ${goal.label} → +${goal.reward.koin} Koin!</div>
      </div>
    `;
    habitsList.parentElement.insertBefore(el, habitsList);
    requestAnimationFrame(() => el.classList.add('show'));
  }

  // ── C. Monday Modal ───────────────────────────────────────
  function showMondayModal() {
    // Cek sudah tampil minggu ini
    const key = storageKey('mon_' + weekKey());
    if (getLS(key, false)) return;

    const msg   = MONDAY_MSGS[Math.floor(Math.random() * MONDAY_MSGS.length)];
    const trophy = getWeeklyTrophy();
    const goal   = getActiveGoal();
    const lastW  = getLastWeekSummary();

    // Set content
    document.getElementById('_wr_mon_em').textContent  = msg.em;
    document.getElementById('_wr_mon_ttl').textContent = msg.title;
    document.getElementById('_wr_mon_sub').textContent =
      msg.sub.replace(/{name}/g, nick());

    // Trophy slot (jika ada rekap minggu lalu)
    const trophySlot = document.getElementById('_wr_trophy_slot');
    if (trophySlot) {
      if (trophy && lastW) {
        trophySlot.innerHTML = `
          <div class="_wr_trophy">
            <span class="_wr_tr_ic">${trophy.icon}</span>
            <div>
              <div class="_wr_tr_nm">${trophy.name}</div>
              <div class="_wr_tr_ds">Minggu lalu: ${lastW.daysActive} hari aktif, ${lastW.perfectDays} hari sempurna!</div>
            </div>
          </div>`;
      } else {
        trophySlot.innerHTML = '';
      }
    }

    // Goal slot
    const goalSlot = document.getElementById('_wr_goal_slot');
    if (goalSlot) {
      goalSlot.innerHTML = `
        <div class="_wr_goal_card">
          <div class="_wr_gc_head">
            <div class="_wr_gc_lbl">${goal.icon} Target Pekan Ini: ${goal.label}</div>
            <div class="_wr_gc_rew">+${goal.reward.koin} Koin</div>
          </div>
          <div class="_wr_gc_bar"><div class="_wr_gc_fill" style="width:0%"></div></div>
        </div>`;
    }

    // Tampilkan
    document.getElementById('_wr_monday').classList.add('show');
    setTimeout(() => {
      const fill = document.querySelector('._wr_gc_fill');
      if (fill) fill.style.width = '0%'; // baru mulai
    }, 500);

    // Stars!
    spawnWeeklyStars();

    // Audio
    if (typeof HA !== 'undefined') setTimeout(() => HA.play('celebrate'), 300);
    if (navigator.vibrate) navigator.vibrate([40, 15, 40, 15, 80]);

    // Syekh berbicara
    if (typeof SAF !== 'undefined') {
      setTimeout(() => SAF.speak(
        `Selamat datang di pekan baru, ${nick()}! 🚀\n` +
        `${trophy ? `Minggu lalu kamu dapat ${trophy.icon} ${trophy.name}!\n` : ''}` +
        `Target pekan ini: ${goal.label}. Bismillah!`
      ), 1000);
    }
  }

  function spawnWeeklyStars() {
    const emojis = ['⭐','🌟','✨','🚀','💫','🎯'];
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const s = document.createElement('div');
        s.className = '_wr_star';
        s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        s.style.cssText = `font-size:${14+Math.random()*10}px;
          left:${10+Math.random()*80}%;top:${5+Math.random()*70}%`;
        document.body.appendChild(s);
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(s, { opacity:0, scale:0, y:0 },
            { opacity:1, scale:1.2, y:-50-Math.random()*40, duration:.5,
              ease:'back.out(2)', delay:Math.random()*.5,
              onComplete: () => gsap.to(s, { opacity:0, y:'-=20', duration:.3,
                onComplete: () => s.remove() }) });
        } else {
          setTimeout(() => s.remove(), 1200);
        }
      }, i * 100);
    }
  }

  // ── E. Weekly Trophy Check ────────────────────────────────
  function checkWeeklyGoalComplete() {
    if (typeof CU === 'undefined' || !CU) return;
    const gProg = getGoalProgress();
    if (!gProg.done) return;

    // Cek sudah dapat reward minggu ini
    const rewardKey = storageKey('goal_rewarded_' + weekKey());
    if (getLS(rewardKey, false)) return;

    // Berikan reward!
    const { goal } = gProg;
    CU.koin += goal.reward.koin;
    CU.xp   += goal.reward.xp;
    if (typeof saveCU === 'function') saveCU();
    if (typeof updateStats === 'function') updateStats();

    // Tandai sudah dapat
    setLS(rewardKey, true);

    // Toast reward
    setTimeout(() => {
      if (typeof showToast === 'function') {
        showToast(`${goal.icon} Target pekan tercapai! +${goal.reward.koin} Koin +${goal.reward.xp} XP!`);
      }
      if (typeof CEL !== 'undefined') {
        CEL.mission({
          name:  `Target Pekan: ${goal.label}`,
          emoji: goal.icon,
          koin:  goal.reward.koin,
          xp:    goal.reward.xp,
        });
      }
    }, 1000);
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════
  const WR = {};

  WR.closeMonday = function () {
    const el  = document.getElementById('_wr_monday');
    const box = document.getElementById('_wr_monday_box');
    if (!el) return;

    // Tandai sudah tampil minggu ini
    setLS(storageKey('mon_' + weekKey()), true);

    if (typeof gsap !== 'undefined' && box) {
      gsap.to(box, { scale:.88, opacity:0, y:16, duration:.22, ease:'power2.in',
        onComplete: () => {
          el.classList.remove('show');
          gsap.set(box, { scale:1, opacity:1, y:0 });
        } });
    } else {
      el.classList.remove('show');
    }
  };

  WR.renderWeekStrip = renderWeekStrip;
  WR.showMondayModal = showMondayModal;
  W.WR = WR;

  // ═══════════════════════════════════════════════════════════
  // INTEGRASI
  // ═══════════════════════════════════════════════════════════
  function integrate() {
    if (typeof W.HeroKuEvents === 'undefined') return;

    // Render strip setiap buka beranda
    W.HeroKuEvents.on('pageSwitch', function (e) {
      if (e.detail?.page !== 'beranda') return;
      setTimeout(() => {
        logTodayProgress();
        renderWeekStrip();
        renderFridayReminder();
        checkWeeklyGoalComplete();

        // Tampilkan Monday modal hanya di hari Senin
        if (isMon()) {
          setTimeout(showMondayModal, 700);
        }
      }, 500);
    });

    // Update strip setelah check-in
    W.HeroKuEvents.on('checkin', function () {
      setTimeout(() => {
        logTodayProgress();
        renderWeekStrip();
        checkWeeklyGoalComplete();
      }, 800);
    });

    // Sunday: simpan log hari ini sebelum reset
    if (isSun()) {
      W.HeroKuEvents.on('checkin', logTodayProgress);
    }

    // Patch renderApp — log saat buka app
    if (typeof W.renderApp === 'function') {
      const _orig = W.renderApp;
      W.renderApp = function () {
        _orig.call(this);
        logTodayProgress();
      };
    }

    console.log('[WR] Weekly Ritual siap ✅ — Senin exciting, goal mingguan, week strip!');
  }

  function boot() {
    injectCSS();
    injectHTML();

    let tries = 0;
    const wait = setInterval(() => {
      if (typeof W.HeroKuEvents !== 'undefined' || tries > 80) {
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
