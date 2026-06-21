// ═══════════════════════════════════════════════════════════
// HEROKU SOCIAL PULSE v1.0
// Tahap 3 dari 5 — Anti-Jenuh: Momen Sosial
//
// File: js/social-pulse.js
// Pasang setelah micro-reward.js:
//   <script src="js/social-pulse.js"></script>
//
// Masalah yang diselesaikan:
//   HeroKu terasa "solo" — siswa tidak tahu teman ngapain
//   Solusi: buat siswa MERASA DILIHAT dan TERHUBUNG
//
// 4 Fitur Utama:
//   A. Activity Feed    — "Badshah baru centang Bangun Pagi!"
//   B. Classmate Pulse  — mini-avatars teman yang aktif hari ini
//   C. Peer Motivation  — "3 temanmu sudah selesai lebih dulu!"
//   D. Class Champion   — siapa yang paling banyak hari ini
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─── Utils ───────────────────────────────────────────────
  function nick(s) {
    if (!s) return 'Teman';
    return s.nickname || (s.name || '').split(' ')[0] || 'Teman';
  }
  function myKelas() {
    return typeof CU !== 'undefined' && CU ? CU.kelas : '';
  }
  function classmates() {
    if (typeof STORE === 'undefined' || !STORE.students) return [];
    return STORE.students.filter(s =>
      s.kelas === myKelas() &&
      (typeof CU === 'undefined' || !CU || s.id !== CU.id)
    );
  }
  function doneCount(s) {
    return Object.keys(s.checkedToday || {}).length;
  }
  function todayS() {
    return typeof todayStr === 'function'
      ? todayStr()
      : new Date().toISOString().slice(0, 10);
  }
  function isActiveToday(s) {
    return s.lastActive === todayS() || doneCount(s) > 0;
  }

  // ═══════════════════════════════════════════════════════════
  // A. ACTIVITY FEED — template pesan aktivitas teman
  // Dihasilkan dari data STORE yang ada (bukan real-time push)
  // Update setiap kali halaman beranda dibuka
  // ═══════════════════════════════════════════════════════════

  const HABIT_LABELS = {
    pagi:      { icon: '🌅', verb: 'bangun lebih awal dari matahari' },
    ibadah:    { icon: '🙏', verb: 'menyelesaikan ibadah hariannya' },
    olahraga:  { icon: '⚽', verb: 'berolahraga dengan semangat' },
    makan:     { icon: '🥗', verb: 'makan sehat hari ini' },
    belajar:   { icon: '📚', verb: 'belajar dengan tekun' },
    sosial:    { icon: '🤝', verb: 'berbuat kebaikan hari ini' },
    tidur:     { icon: '😴', verb: 'istirahat dengan baik kemarin' },
  };

  // Template feed — bervariasi supaya tidak monoton
  const FEED_TEMPLATES = [
    (n, hb) => `${hb.icon} ${n} ${hb.verb}!`,
    (n, hb) => `✨ ${n} sudah centang ${hb.icon} hari ini!`,
    (n, hb) => `🌟 Keren! ${n} tidak lupa ${hb.icon}!`,
    (n, hb) => `⚡ ${n} selangkah lebih maju — ${hb.icon}!`,
  ];

  const MILESTONE_TEMPLATES = [
    (n, d) => `🏆 ${n} selesaikan ${d}/7 misi hari ini!`,
    (n, d) => `🔥 ${n} sudah ${d} dari 7 kebiasaan!`,
    (n, d) => `✅ ${n} tinggal ${7-d} lagi — hampir sempurna!`,
    (n, d) => `💪 ${n} tidak berhenti di ${d}/7!`,
  ];

  const PERFECT_TEMPLATES = [
    n => `👑 ${n} SEMPURNA hari ini — 7/7! Ikuti jejaknya!`,
    n => `🏆 MasyaAllah! ${n} selesaikan semua 7 kebiasaan!`,
    n => `⭐ ${n} hari sempurna hari ini! Siapa berikutnya?`,
  ];

  // Generate feed dari data STORE
  function generateFeed(limit) {
    limit = limit || 5;
    const cm  = classmates();
    if (!cm.length) return [];

    const feed = [];
    const seed = Date.now(); // berbeda setiap render

    cm.forEach(s => {
      const d = doneCount(s);
      if (!isActiveToday(s)) return;

      // Perfect day
      if (d === 7) {
        feed.push({
          type:   'perfect',
          avatar: s.avatar || '👤',
          name:   nick(s),
          text:   PERFECT_TEMPLATES[Math.floor(Math.random() * PERFECT_TEMPLATES.length)](nick(s)),
          koin:   s.koin,
          streak: s.streak,
          priority: 100,
        });
        return;
      }

      // Milestone
      if (d >= 5) {
        feed.push({
          type:   'milestone',
          avatar: s.avatar || '👤',
          name:   nick(s),
          text:   MILESTONE_TEMPLATES[Math.floor(Math.random() * MILESTONE_TEMPLATES.length)](nick(s), d),
          done:   d,
          priority: 50 + d,
        });
        return;
      }

      // Habit individual — ambil satu habit random yang sudah selesai
      const checkedIds = Object.keys(s.checkedToday || {});
      if (checkedIds.length > 0) {
        const hbId = checkedIds[Math.floor(Math.random() * checkedIds.length)];
        const hb   = HABIT_LABELS[hbId];
        if (hb) {
          const tmpl = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
          feed.push({
            type:   'habit',
            avatar: s.avatar || '👤',
            name:   nick(s),
            text:   tmpl(nick(s), hb),
            priority: d * 10,
          });
        }
      }
    });

    // Sort by priority (perfect > milestone > habit), ambil top N
    return feed.sort((a, b) => b.priority - a.priority).slice(0, limit);
  }

  // ═══════════════════════════════════════════════════════════
  // B. CLASSMATE PULSE — mini avatar teman yang aktif
  // ═══════════════════════════════════════════════════════════

  function getClassmatesStatus() {
    const cm = classmates();
    return cm.map(s => ({
      id:     s.id,
      avatar: s.avatar || '👤',
      name:   nick(s),
      done:   doneCount(s),
      active: isActiveToday(s),
      streak: s.streak || 0,
      perfect: doneCount(s) === 7,
    })).sort((a, b) => b.done - a.done);
  }

  // ═══════════════════════════════════════════════════════════
  // C. PEER MOTIVATION — pesan berdasarkan posisi relatif
  // ═══════════════════════════════════════════════════════════

  function getPeerMessage() {
    if (typeof CU === 'undefined' || !CU) return null;
    const cm       = classmates();
    const myDone   = doneCount(CU);
    const ahead    = cm.filter(s => doneCount(s) > myDone && isActiveToday(s));
    const behind   = cm.filter(s => doneCount(s) < myDone && isActiveToday(s));
    const equal    = cm.filter(s => doneCount(s) === myDone && isActiveToday(s) && s.id !== CU?.id);
    const perfect  = cm.filter(s => doneCount(s) === 7);

    if (perfect.length > 0 && myDone < 7) {
      const names = perfect.slice(0, 2).map(s => nick(s)).join(' & ');
      return {
        icon: '👑',
        msg:  `${names} sudah sempurna hari ini! Giliran ${nick(CU)} berikutnya?`,
        urgency: 'high',
        color: 'rgba(241,196,15,.2)',
        border: 'rgba(241,196,15,.4)',
      };
    }
    if (ahead.length >= 2 && myDone < 5) {
      return {
        icon: '⚡',
        msg:  `${ahead.length} teman sekelasmu sudah lebih maju! Yuk kejar, ${nick(CU)}!`,
        urgency: 'medium',
        color: 'rgba(231,76,60,.15)',
        border: 'rgba(231,76,60,.35)',
      };
    }
    if (ahead.length === 1) {
      return {
        icon: '🏃',
        msg:  `${nick(ahead[0])} selangkah di depanmu — bisa kamu kejar!`,
        urgency: 'low',
        color: 'rgba(52,152,219,.15)',
        border: 'rgba(52,152,219,.3)',
      };
    }
    if (behind.length >= 2 && myDone > 0) {
      return {
        icon: '🌟',
        msg:  `${nick(CU)} sedang memimpin kelas! ${behind.length} teman mengikutimu!`,
        urgency: 'positive',
        color: 'rgba(46,204,113,.15)',
        border: 'rgba(46,204,113,.3)',
      };
    }
    if (equal.length > 0 && myDone > 0) {
      return {
        icon: '🤝',
        msg:  `${nick(equal[0])} sejajar denganmu di ${myDone}/7. Siapa yang duluan selesai?`,
        urgency: 'low',
        color: 'rgba(155,89,182,.15)',
        border: 'rgba(155,89,182,.3)',
      };
    }
    if (myDone === 7) {
      const behindCount = cm.filter(s => doneCount(s) < 7).length;
      if (behindCount > 0) {
        return {
          icon: '👑',
          msg:  `${nick(CU)} sudah sempurna! ${behindCount} teman masih butuh semangatmu!`,
          urgency: 'positive',
          color: 'rgba(241,196,15,.15)',
          border: 'rgba(241,196,15,.35)',
        };
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // D. CLASS CHAMPION — juara harian kelas
  // ═══════════════════════════════════════════════════════════

  function getClassChampion() {
    const all = [
      ...(typeof CU !== 'undefined' && CU ? [CU] : []),
      ...classmates(),
    ].filter(isActiveToday);

    if (!all.length) return null;
    const top = all.sort((a, b) => doneCount(b) - doneCount(a))[0];
    const topDone = doneCount(top);
    if (topDone === 0) return null;

    const isMe = typeof CU !== 'undefined' && CU && top.id === CU.id;
    return {
      avatar:  top.avatar || '👤',
      name:    nick(top),
      done:    topDone,
      isMe,
      msg: isMe
        ? `Kamu memimpin kelas hari ini dengan ${topDone}/7! 🏆`
        : `${nick(top)} memimpin kelas hari ini — ${topDone}/7!`,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════
  function injectCSS() {
    if (document.getElementById('_sp_css')) return;
    const s = document.createElement('style');
    s.id = '_sp_css';
    s.textContent = `

/* ── Social Pulse Container ── */
#_sp_wrap {
  margin-bottom: 12px;
  animation: _spIn .4s cubic-bezier(.34,1.4,.64,1) both;
}
@keyframes _spIn {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}

/* ── Section Header ── */
._sp_sec_head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
._sp_sec_title {
  font-size: 11px; font-weight: 800; color: rgba(255,255,255,.5);
  letter-spacing: 1px; text-transform: uppercase;
  display: flex; align-items: center; gap: 5px;
}
._sp_sec_more {
  font-size: 10px; color: rgba(255,255,255,.3);
  font-weight: 700; cursor: pointer;
}

/* ── Classmate Pulse (mini avatars) ── */
._sp_pulse_row {
  display: flex; gap: 8px; overflow-x: auto;
  padding-bottom: 4px; margin-bottom: 10px;
  scrollbar-width: none;
}
._sp_pulse_row::-webkit-scrollbar { display: none; }
._sp_av_wrap {
  display: flex; flex-direction: column;
  align-items: center; gap: 3px; flex-shrink: 0;
}
._sp_av {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; border: 2px solid rgba(255,255,255,.1);
  position: relative; transition: transform .2s;
}
._sp_av:active { transform: scale(.92); }
._sp_av.active  { border-color: rgba(46,204,113,.6); }
._sp_av.perfect { border-color: #FFE066; box-shadow: 0 0 8px rgba(255,224,0,.4); }
._sp_av.inactive{ opacity: .4; }
._sp_av_prog {
  position: absolute; bottom: -2px; right: -2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: rgba(26,26,46,.9); border: 1px solid rgba(255,255,255,.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 900;
}
._sp_av_prog.done7 { background: #FFE066; color: #1A1A2E; }
._sp_av_prog.done5 { background: rgba(231,76,60,.8); color: #fff; }
._sp_av_prog.done3 { background: rgba(230,126,34,.8); color: #fff; }
._sp_av_name {
  font-size: 8px; font-weight: 700; color: rgba(255,255,255,.5);
  max-width: 36px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  text-align: center;
}
._sp_av_name.me { color: rgba(46,204,113,.8); }

/* ── Peer Motivation Bar ── */
._sp_peer {
  border-radius: 12px; padding: 9px 12px;
  display: flex; align-items: center; gap: 9px;
  margin-bottom: 10px; border: 1px solid;
}
._sp_peer_ic { font-size: 18px; flex-shrink: 0; }
._sp_peer_txt { font-size: 11px; color: rgba(255,255,255,.8);
                font-weight: 600; line-height: 1.5; }

/* ── Activity Feed ── */
._sp_feed {
  border-radius: 14px; overflow: hidden;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  margin-bottom: 10px;
}
._sp_feed_item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid rgba(255,255,255,.05);
  transition: background .15s;
}
._sp_feed_item:last-child { border-bottom: none; }
._sp_feed_item:active { background: rgba(255,255,255,.04); }
._sp_fi_av {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
  background: rgba(255,255,255,.07);
}
._sp_fi_av.perfect { background: rgba(255,224,0,.15);
  box-shadow: 0 0 6px rgba(255,224,0,.3); }
._sp_fi_txt {
  flex: 1; font-size: 11px; color: rgba(255,255,255,.7);
  line-height: 1.5;
}
._sp_fi_time {
  font-size: 9px; color: rgba(255,255,255,.25);
  font-weight: 700; flex-shrink: 0;
}

/* ── Class Champion ── */
._sp_champ {
  border-radius: 12px; padding: 9px 12px;
  background: rgba(241,196,15,.08);
  border: 1px solid rgba(241,196,15,.2);
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 10px;
}
._sp_ch_av {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; background: rgba(241,196,15,.15);
  border: 2px solid rgba(241,196,15,.4);
}
._sp_ch_txt { flex:1; }
._sp_ch_name { font-size: 12px; font-weight: 800; color: #FFE066; margin-bottom: 1px; }
._sp_ch_sub  { font-size: 10px; color: rgba(255,255,255,.5); }

/* ── Empty state ── */
._sp_empty {
  text-align: center; padding: 14px;
  font-size: 11px; color: rgba(255,255,255,.3);
  line-height: 1.7;
}

/* ── Notif pop (muncul saat teman baru centang) ── */
#_sp_notif {
  position: fixed; bottom: 76px; left: 12px; right: 12px;
  max-width: 340px; margin: 0 auto;
  z-index: 9300; pointer-events: none; opacity: 0;
  transform: translateY(12px);
  transition: all .3s cubic-bezier(.34,1.4,.64,1);
}
#_sp_notif.show { opacity:1; transform:translateY(0); pointer-events:all; }
._sp_notif_inner {
  background: rgba(26,26,46,.97);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 16px; padding: 10px 14px;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,.4);
}
._sp_no_av  { font-size: 22px; flex-shrink:0; }
._sp_no_txt { flex:1; font-size:11px; color:rgba(255,255,255,.8); line-height:1.5; }
._sp_no_cls { font-size:10px; color:rgba(255,255,255,.3); cursor:pointer; flex-shrink:0; }
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  // HTML INJECT
  // ═══════════════════════════════════════════════════════════
  function injectHTML() {
    if (document.getElementById('_sp_notif')) return;
    document.body.insertAdjacentHTML('beforeend', `
<div id="_sp_notif">
  <div class="_sp_notif_inner">
    <span class="_sp_no_av" id="_sp_no_av">👤</span>
    <span class="_sp_no_txt" id="_sp_no_txt">Teman aktif!</span>
    <span class="_sp_no_cls" onclick="SP.closeNotif()">✕</span>
  </div>
</div>
    `);
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER MAIN COMPONENT
  // ═══════════════════════════════════════════════════════════

  function render() {
    // Cari container di beranda
    const habitsList = document.getElementById('habits-list');
    if (!habitsList || !habitsList.parentElement) return;

    // Bersihkan yang lama
    const old = document.getElementById('_sp_wrap');
    if (old) old.remove();

    const cm = classmates();
    if (!cm.length) return; // Tidak ada teman sekelas

    const wrap = document.createElement('div');
    wrap.id = '_sp_wrap';

    // ── A. Classmate Pulse ─────────────────────────────
    const statuses = getClassmatesStatus();
    const activeToday = statuses.filter(s => s.active);

    if (statuses.length > 0) {
      const secA = document.createElement('div');
      secA.innerHTML = `
        <div class="_sp_sec_head">
          <div class="_sp_sec_title">
            <span>👥</span> Teman Sekelasmu
          </div>
          <div class="_sp_sec_more">${activeToday.length} aktif hari ini</div>
        </div>`;

      const pulseRow = document.createElement('div');
      pulseRow.className = '_sp_pulse_row';

      // Tambahkan diri sendiri dulu
      if (typeof CU !== 'undefined' && CU) {
        const myDone = doneCount(CU);
        const meEl   = document.createElement('div');
        meEl.className = '_sp_av_wrap';
        meEl.innerHTML = `
          <div class="_sp_av ${myDone===7?'perfect':myDone>0?'active':''}">
            <span>${CU.avatar || '👤'}</span>
            <div class="_sp_av_prog ${myDone===7?'done7':myDone>=5?'done5':myDone>=3?'done3':''}">
              ${myDone}
            </div>
          </div>
          <div class="_sp_av_name me">Kamu</div>`;
        pulseRow.appendChild(meEl);
      }

      statuses.forEach(s => {
        const avEl = document.createElement('div');
        avEl.className = '_sp_av_wrap';
        avEl.innerHTML = `
          <div class="_sp_av ${s.perfect?'perfect':s.active?'active':'inactive'}">
            <span>${s.avatar}</span>
            <div class="_sp_av_prog ${s.done===7?'done7':s.done>=5?'done5':s.done>=3?'done3':''}">
              ${s.active ? s.done : '—'}
            </div>
          </div>
          <div class="_sp_av_name">${s.name}</div>`;
        // Tooltip on click
        avEl.onclick = () => {
          if (s.active) {
            showNotif(s.avatar, `${s.name} sudah ${s.done}/7 kebiasaan hari ini${s.perfect?' — SEMPURNA! 👑':''}!`);
          }
        };
        pulseRow.appendChild(avEl);
      });

      secA.appendChild(pulseRow);
      wrap.appendChild(secA);
    }

    // ── D. Class Champion ──────────────────────────────
    const champ = getClassChampion();
    if (champ && champ.done >= 3) {
      const champEl = document.createElement('div');
      champEl.className = '_sp_champ';
      champEl.innerHTML = `
        <div class="_sp_ch_av">${champ.avatar}</div>
        <div class="_sp_ch_txt">
          <div class="_sp_ch_name">🏆 ${champ.isMe ? 'Kamu Memimpin!' : champ.name + ' Memimpin!'}</div>
          <div class="_sp_ch_sub">${champ.msg}</div>
        </div>`;
      wrap.appendChild(champEl);
    }

    // ── C. Peer Motivation ─────────────────────────────
    const peer = getPeerMessage();
    if (peer) {
      const peerEl = document.createElement('div');
      peerEl.className = '_sp_peer';
      peerEl.style.background = peer.color;
      peerEl.style.borderColor = peer.border;
      peerEl.innerHTML = `
        <span class="_sp_peer_ic">${peer.icon}</span>
        <span class="_sp_peer_txt">${peer.msg}</span>`;
      wrap.appendChild(peerEl);
    }

    // ── B. Activity Feed ──────────────────────────────
    const feed = generateFeed(4);
    if (feed.length > 0) {
      const secB = document.createElement('div');
      secB.innerHTML = `
        <div class="_sp_sec_head">
          <div class="_sp_sec_title"><span>⚡</span> Aktivitas Kelas</div>
          <div class="_sp_sec_more">Hari ini</div>
        </div>`;

      const feedEl = document.createElement('div');
      feedEl.className = '_sp_feed';

      feed.forEach((item, i) => {
        const itemEl = document.createElement('div');
        itemEl.className = '_sp_feed_item';
        const timeAgo = i === 0 ? 'Baru saja' : `${(i+1)*8}m lalu`;
        itemEl.innerHTML = `
          <div class="_sp_fi_av ${item.type==='perfect'?'perfect':''}">
            ${item.avatar}
          </div>
          <span class="_sp_fi_txt">${item.text}</span>
          <span class="_sp_fi_time">${timeAgo}</span>`;
        feedEl.appendChild(itemEl);
      });

      secB.appendChild(feedEl);
      wrap.appendChild(secB);
    } else if (activeToday.length === 0) {
      // Tidak ada yang aktif
      const emptyEl = document.createElement('div');
      emptyEl.className = '_sp_empty';
      emptyEl.innerHTML = `
        🌅 Belum ada temanmu yang aktif hari ini<br>
        <strong style="color:rgba(255,255,255,.5)">Jadilah yang pertama!</strong>`;
      wrap.appendChild(emptyEl);
    }

    // Sisipkan sebelum habits-list
    const container = habitsList.parentElement;
    container.insertBefore(wrap, habitsList);
  }

  // ── Notifikasi pop kecil ──────────────────────────────────
  let _notifTimer = null;
  function showNotif(avatar, msg) {
    const el = document.getElementById('_sp_notif');
    if (!el) return;
    document.getElementById('_sp_no_av').textContent  = avatar;
    document.getElementById('_sp_no_txt').textContent = msg;
    el.classList.add('show');
    clearTimeout(_notifTimer);
    _notifTimer = setTimeout(() => el.classList.remove('show'), 3500);
    if (navigator.vibrate) navigator.vibrate(15);
  }

  // ── Check-in notification (muncul ke teman) ──────────────
  // Simulasi: saat kamu centang, seolah teman lain mendapat notif
  // (Di sini kita simpan ke sessionStorage, teman akan lihat saat buka app)
  function broadcastCheckIn(habitId) {
    if (typeof CU === 'undefined' || !CU) return;
    const key = `_sp_activity_${myKelas()}_${todayS()}`;
    try {
      const existing = JSON.parse(sessionStorage.getItem(key) || '[]');
      existing.push({
        studentId: CU.id,
        avatar:    CU.avatar || '👤',
        name:      nick(CU),
        habitId,
        time:      Date.now(),
      });
      // Simpan max 20 aktivitas
      if (existing.length > 20) existing.shift();
      sessionStorage.setItem(key, JSON.stringify(existing));
    } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════
  const SP = {};

  SP.render      = render;
  SP.showNotif   = showNotif;
  SP.closeNotif  = () => {
    const el = document.getElementById('_sp_notif');
    if (el) el.classList.remove('show');
  };

  // Tampilkan notif "teman baru centang" saat buka app
  SP.checkFriendActivity = function () {
    if (typeof CU === 'undefined' || !CU) return;
    const key = `_sp_activity_${myKelas()}_${todayS()}`;
    const seen = `_sp_seen_${CU.id}_${todayS()}`;
    try {
      const activities = JSON.parse(sessionStorage.getItem(key) || '[]');
      const lastSeen   = parseInt(sessionStorage.getItem(seen) || '0');
      const newOnes    = activities.filter(a =>
        a.studentId !== CU.id && a.time > lastSeen);
      if (newOnes.length > 0) {
        const latest = newOnes[newOnes.length - 1];
        const hbLabel = HABIT_LABELS[latest.habitId];
        setTimeout(() => {
          showNotif(
            latest.avatar,
            `${latest.name} baru centang ${hbLabel?.icon || '✅'} — semangat juga ya!`
          );
        }, 1200);
        sessionStorage.setItem(seen, String(Date.now()));
      }
    } catch(e) {}
  };

  W.SP = SP;

  // ═══════════════════════════════════════════════════════════
  // INTEGRASI
  // ═══════════════════════════════════════════════════════════
  function integrate() {
    if (typeof W.HeroKuEvents === 'undefined') return;

    // Render saat buka beranda
    W.HeroKuEvents.on('pageSwitch', function (e) {
      if (e.detail?.page !== 'beranda') return;
      setTimeout(() => {
        SP.render();
        SP.checkFriendActivity();
      }, 400);
    });

    // Update feed setelah check-in
    W.HeroKuEvents.on('checkin', function (e) {
      const hb = e.detail?.habit;
      if (hb) broadcastCheckIn(hb.id);
      // Re-render feed setelah 1 detik
      setTimeout(() => {
        const wrap = document.getElementById('_sp_wrap');
        if (wrap) SP.render();
      }, 1000);
    });

    // Refresh feed setiap 5 menit (pick up data realtime dari Supabase)
    setInterval(() => {
      const wrap = document.getElementById('_sp_wrap');
      if (wrap) SP.render();
    }, 5 * 60 * 1000);

    console.log('[SP] Social Pulse siap ✅ — activity feed, pulse, peer motivation!');
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
