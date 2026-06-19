// ═══════════════════════════════════════════════════════════
// HEROKU ENHANCEMENTS v1.0
// 20 perbaikan engagement, micro-interaction, & animasi
//
// Cara pakai: tambahkan SATU baris di index.html, PALING BAWAH
// sebelum </body>, setelah semua script lain:
//   <script src="enhancements.js"></script>
//
// File ini TIDAK mengubah file lain sama sekali — aman diupdate,
// aman di-rollback (tinggal hapus 1 baris di index.html).
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── TUNGGU APP SIAP ─────────────────────────────────────
  // Bridge.js memanggil bootApp() yang async. Kita tunggu DOM
  // + flag SUPABASE_READY sebelum menginjeksi semua perbaikan.
  function waitForApp(cb, tries) {
    tries = tries || 0;
    if (tries > 60) return; // timeout 6 detik
    if (typeof STORE !== 'undefined' && STORE.students) {
      cb();
    } else {
      setTimeout(() => waitForApp(cb, tries + 1), 100);
    }
  }

  waitForApp(init);

  // ═══════════════════════════════════════════════════════════
  // INJECT CSS — semua keyframe & utility class
  // ═══════════════════════════════════════════════════════════
  function injectCSS() {
    const style = document.createElement('style');
    style.id = 'heroku-enhancements-css';
    style.textContent = `
      /* ── PAGE TRANSITION (#2) ── */
      .tab-page { transition: opacity 0.18s ease, transform 0.18s ease; }
      .tab-page:not(.active) { opacity: 0; transform: translateX(12px); pointer-events: none; }
      .tab-page.active { opacity: 1; transform: translateX(0); }

      /* ── KOIN BURST PARTIKEL (#1) ── */
      .koin-burst { position: fixed; pointer-events: none; z-index: 9999; }
      .koin-particle {
        position: absolute; font-size: 18px; will-change: transform, opacity;
        animation: koinFly var(--dur, 0.8s) ease-out forwards;
      }
      @keyframes koinFly {
        0%   { opacity: 1; transform: translate(0,0) scale(1); }
        100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.4); }
      }

      /* ── STREAK POP (#4) ── */
      .streak-pop {
        display: inline-block;
        animation: streakBounce 0.35s cubic-bezier(0.36,0.07,0.19,0.97);
      }
      @keyframes streakBounce {
        0%  { transform: scale(1); }
        40% { transform: scale(1.5); }
        70% { transform: scale(0.9); }
        100%{ transform: scale(1); }
      }

      /* ── LEVEL UP OVERLAY (#6) ── */
      #lvlup-overlay {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(0,0,0,0.75); display: none;
        align-items: center; justify-content: center; flex-direction: column;
      }
      #lvlup-overlay.open { display: flex; }
      .lvlup-box {
        background: linear-gradient(145deg, #1A1A2E, #0F3460);
        border-radius: 24px; padding: 36px 32px; text-align: center;
        color: white; max-width: 320px; width: 90%;
        animation: lvlupPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes lvlupPop {
        0%  { transform: scale(0.5); opacity: 0; }
        100%{ transform: scale(1);   opacity: 1; }
      }
      .lvlup-num {
        font-size: 72px; font-weight: 900; color: #FFD700;
        animation: lvlupPulse 0.6s ease-in-out infinite alternate;
      }
      @keyframes lvlupPulse {
        0%  { text-shadow: 0 0 10px #FFD700; }
        100%{ text-shadow: 0 0 30px #FFD700, 0 0 60px #FF8C00; }
      }

      /* ── CONFETTI 7/7 & LEVEL UP (#1, #6, #15) ── */
      .confetti-piece {
        position: fixed; pointer-events: none; z-index: 9998;
        width: 10px; height: 10px; border-radius: 2px;
        animation: confettiFall var(--dur) var(--delay) ease-in forwards;
      }
      @keyframes confettiFall {
        0%   { transform: translateY(-20px) rotate(0deg);  opacity: 1; }
        100% { transform: translateY(110vh)  rotate(720deg); opacity: 0; }
      }

      /* ── KARTU FLIP (#8) ── */
      .card-flip-wrap {
        perspective: 800px;
      }
      .card-flip-inner {
        transform-style: preserve-3d;
        animation: cardFlip 0.5s 0.15s ease-out both;
      }
      @keyframes cardFlip {
        0%   { transform: rotateY(90deg); }
        100% { transform: rotateY(0deg); }
      }

      /* ── BADGE STAMP (#17) ── */
      .badge-stamp {
        animation: stampIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes stampIn {
        0%   { transform: scale(2.2); opacity: 0; }
        60%  { transform: scale(0.85); }
        100% { transform: scale(1);   opacity: 1; }
      }

      /* ── SKELETON LOADING (#16) ── */
      #boot-loading { display: none !important; } /* kita ganti dengan skeleton */
      #heroku-skeleton {
        position: fixed; inset: 0; z-index: 99999;
        background: linear-gradient(160deg, #1A1A2E, #0F3460);
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 14px; padding: 24px;
      }
      .sk-block {
        background: rgba(255,255,255,0.08);
        border-radius: 12px; overflow: hidden; position: relative;
      }
      .sk-block::after {
        content: '';
        position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
        animation: shimmer 1.4s infinite;
      }
      @keyframes shimmer {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      /* ── TYPING MENTOR (#10) ── */
      .mentor-cursor { animation: blinkCursor 0.7s step-end infinite; }
      @keyframes blinkCursor {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0; }
      }

      /* ── PROGRESS BAR ANIMATE (#11) ── */
      .bus-bar-fill { transition: width 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important; }

      /* ── HABIT TAP AREA (#5) ── */
      .habit-card { min-height: 56px !important; cursor: pointer; }
      .habit-card .hchk { min-width: 36px; min-height: 36px; display: flex; align-items: center; justify-content: center; }

      /* ── STREAK BADGE COLOR BY MILESTONE ── */
      .streak-badge-3  { color: #F39C12 !important; }
      .streak-badge-7  { color: #E67E22 !important; }
      .streak-badge-30 { color: #E74C3C !important; }

      /* ── TOAST REAKSI KEBIASAAN (#19) ── */
      #habit-reaction-toast {
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: rgba(26,26,46,0.92); color: white;
        padding: 10px 20px; border-radius: 20px; font-size: 14px;
        font-weight: 600; z-index: 9990; white-space: nowrap;
        pointer-events: none; opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        transform: translateX(-50%) translateY(8px);
      }
      #habit-reaction-toast.show {
        opacity: 1; transform: translateX(-50%) translateY(0);
      }

      /* ── STREAK COUNTDOWN BANNER (#18) ── */
      #streak-countdown {
        background: linear-gradient(135deg, #FF6B35, #F7971E);
        color: white; font-size: 12px; font-weight: 700;
        padding: 8px 14px; border-radius: 12px; margin: 8px 0;
        display: none; text-align: center;
      }

      /* ── REALTIME VERIF NOTIF (#14) ── */
      #verif-notif {
        position: fixed; top: 70px; left: 50%; transform: translateX(-50%) translateY(-20px);
        background: #27AE60; color: white; padding: 10px 20px;
        border-radius: 16px; font-size: 13px; font-weight: 700;
        z-index: 9995; opacity: 0; transition: all 0.3s ease;
        pointer-events: none; white-space: nowrap;
      }
      #verif-notif.show { opacity: 1; transform: translateX(-50%) translateY(0); }

      /* ── HARI SEMPURNA BANNER (#15) ── */
      #perfect-day-banner {
        background: linear-gradient(135deg, #F39C12, #FFD700);
        color: #1A1A2E; font-size: 14px; font-weight: 800;
        padding: 12px 16px; border-radius: 14px; margin: 8px 0;
        text-align: center; display: none;
        animation: bannerPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes bannerPop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }

      /* ── TIER PILL CONSISTENT (#20) ── */
      .tier-pill-perunggu { background: #FFF0E0 !important; color: #CD7F32 !important; }
      .tier-pill-perak    { background: #F0F0F0 !important; color: #707070 !important; }
      .tier-pill-emas     { background: #FFFDE7 !important; color: #B8860B !important; }
      .tier-pill-berlian  { background: #E3F2FD !important; color: #1565C0 !important; }
    `;
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #16 — SKELETON LOADING (ganti spinner polos)
  // Dipasang SEBELUM app siap, jadi langsung inject dari awal
  // ═══════════════════════════════════════════════════════════
  function injectSkeleton() {
    // Sembunyikan loading screen bawaan bridge.js
    const existing = document.getElementById('boot-loading');
    if (existing) existing.style.display = 'none';

    const sk = document.createElement('div');
    sk.id = 'heroku-skeleton';
    sk.innerHTML = `
      <div style="font-size:52px;margin-bottom:8px">🏆</div>
      <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-bottom:20px">Memuat HeroKu...</div>
      <div class="sk-block" style="width:280px;height:56px"></div>
      <div class="sk-block" style="width:240px;height:36px"></div>
      <div class="sk-block" style="width:280px;height:48px"></div>
      <div class="sk-block" style="width:200px;height:36px"></div>
      <div class="sk-block" style="width:280px;height:48px"></div>
    `;
    document.body.appendChild(sk);

    // Hapus skeleton saat app selesai load
    waitForApp(() => {
      setTimeout(() => {
        sk.style.transition = 'opacity 0.3s';
        sk.style.opacity = '0';
        setTimeout(() => sk.remove(), 300);
      }, 200);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #1 — KOIN BURST PARTIKEL saat check-in selesai
  // ═══════════════════════════════════════════════════════════
  function burstKoin(originEl) {
    const rect = originEl ? originEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
    const cx = rect.left + (rect.width || 0) / 2;
    const cy = rect.top + (rect.height || 0) / 2;
    const wrap = document.createElement('div');
    wrap.className = 'koin-burst';
    wrap.style.left = cx + 'px';
    wrap.style.top = cy + 'px';
    const emojis = ['⭐', '🌟', '✨', '💛'];
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('div');
      p.className = 'koin-particle';
      const angle = (i / 14) * Math.PI * 2;
      const dist = 60 + Math.random() * 60;
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
      p.style.setProperty('--dur', (0.6 + Math.random() * 0.4) + 's');
      p.style.animationDelay = (Math.random() * 0.15) + 's';
      p.textContent = emojis[i % emojis.length];
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 1200);
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #3 — AUDIO FEEDBACK (Web Audio API)
  // ═══════════════════════════════════════════════════════════
  let _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    return _audioCtx;
  }

  function playDing(type) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    // Resume jika suspended (browser policy)
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'checkin') {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'levelup') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = freq;
        g2.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        g2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.1 + 0.05);
        g2.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.1 + 0.2);
        o2.start(ctx.currentTime + i * 0.1);
        o2.stop(ctx.currentTime + i * 0.1 + 0.25);
      });
    } else if (type === 'perfect') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1047, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #9 — HAPTIC VIBRATE
  // ═══════════════════════════════════════════════════════════
  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #19 — REAKSI EMOJI PER KEBIASAAN
  // ═══════════════════════════════════════════════════════════
  const HABIT_REACTIONS = {
    pagi:     '🌅 MasyaAllah, sudah bangun pagi! Berkah harimu!',
    ibadah:   '🤲 Semoga ibadahmu diterima Allah!',
    olahraga: '💪 Badan sehat, semangat belajar!',
    makan:    '🥗 Makanan bergizi untuk tubuh yang kuat!',
    belajar:  '📚 Ilmu adalah cahaya — terus bersinar!',
    sosial:   '🤝 Kebaikanmu dicatat malaikat!',
    tidur:    '😴 Istirahat yang baik = ibadah yang lebih khusyuk!',
  };

  let _reactionEl = null;
  let _reactionTimer = null;

  function showHabitReaction(habitId) {
    const msg = HABIT_REACTIONS[habitId];
    if (!msg) return;
    if (!_reactionEl) {
      _reactionEl = document.createElement('div');
      _reactionEl.id = 'habit-reaction-toast';
      document.body.appendChild(_reactionEl);
    }
    clearTimeout(_reactionTimer);
    _reactionEl.textContent = msg;
    _reactionEl.classList.add('show');
    _reactionTimer = setTimeout(() => _reactionEl.classList.remove('show'), 2000);
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #4 — STREAK POP ANIMATION
  // ═══════════════════════════════════════════════════════════
  function popStreak(el) {
    if (!el) return;
    el.classList.remove('streak-pop');
    void el.offsetWidth; // reflow
    el.classList.add('streak-pop');
    setTimeout(() => el.classList.remove('streak-pop'), 400);

    // Warna milestone
    const streak = parseInt(el.textContent) || 0;
    el.classList.remove('streak-badge-3', 'streak-badge-7', 'streak-badge-30');
    if (streak >= 30) el.classList.add('streak-badge-30');
    else if (streak >= 7) el.classList.add('streak-badge-7');
    else if (streak >= 3) el.classList.add('streak-badge-3');
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #6 — LEVEL UP OVERLAY DRAMATIS
  // ═══════════════════════════════════════════════════════════
  function createLevelUpOverlay() {
    if (document.getElementById('lvlup-overlay')) return;
    const el = document.createElement('div');
    el.id = 'lvlup-overlay';
    el.innerHTML = `
      <div class="lvlup-box">
        <div style="font-size:24px;margin-bottom:8px">🎊 NAIK LEVEL!</div>
        <div class="lvlup-num" id="lvlup-num">5</div>
        <div style="font-size:16px;margin:12px 0;color:rgba(255,255,255,0.85)" id="lvlup-msg">Luar biasa! Terus semangat!</div>
        <button onclick="document.getElementById('lvlup-overlay').classList.remove('open')"
          style="margin-top:8px;background:#FFD700;color:#1A1A2E;border:none;
          border-radius:20px;padding:10px 28px;font-size:15px;font-weight:800;cursor:pointer">
          Alhamdulillah! 🏆
        </button>
      </div>
    `;
    el.onclick = (e) => { if (e.target === el) el.classList.remove('open'); };
    document.body.appendChild(el);
  }

  function showLevelUpOverlay(level) {
    createLevelUpOverlay();
    document.getElementById('lvlup-num').textContent = level;
    const msgs = [
      '', '', 'Terus semangat!', 'Kamu makin hebat!',
      'Seperti bintang yang bersinar!', 'MasyaAllah, luar biasa!',
      'Kamu pahlawan sejati!', 'Istiqomah membawa berkah!',
    ];
    document.getElementById('lvlup-msg').textContent = msgs[Math.min(level, msgs.length - 1)] || 'Subhanallah!';
    document.getElementById('lvlup-overlay').classList.add('open');
    playDing('levelup');
    vibrate([30, 20, 30, 20, 60]);
    spawnConfetti(60);
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #15 — CONFETTI & PERFECT DAY BANNER
  // ═══════════════════════════════════════════════════════════
  const CONFETTI_COLORS = ['#FFD700','#FF6B35','#52D98A','#6C5CE7','#FF7675','#74B9FF'];

  function spawnConfetti(count) {
    count = count || 40;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      p.style.setProperty('--dur', (1.5 + Math.random() * 1.5) + 's');
      p.style.setProperty('--delay', (Math.random() * 0.5) + 's');
      p.style.width = (6 + Math.random() * 8) + 'px';
      p.style.height = (6 + Math.random() * 8) + 'px';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 3000);
    }
  }

  let _perfectDayShown = false;
  function checkPerfectDay(done) {
    if (done === 7 && !_perfectDayShown) {
      _perfectDayShown = true;
      const banner = document.getElementById('perfect-day-banner');
      if (banner) {
        banner.style.display = 'block';
        banner.textContent = '🎉 Hari Sempurna! Semua 7 kebiasaan selesai! +100 Koin menuju!';
      }
      setTimeout(() => spawnConfetti(35), 400);
      playDing('perfect');
      vibrate([50, 30, 50, 30, 100]);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #10 — TYPING ANIMATION MENTOR
  // ═══════════════════════════════════════════════════════════
  let _typingTimer = null;
  let _lastMentorMsg = '';

  function typeMentorMsg(el, msg) {
    if (!el || msg === _lastMentorMsg) return;
    _lastMentorMsg = msg;
    clearInterval(_typingTimer);
    el.textContent = '';
    let i = 0;
    _typingTimer = setInterval(() => {
      el.textContent = msg.slice(0, i) + (i < msg.length ? '|' : '');
      if (i >= msg.length) {
        el.textContent = msg;
        clearInterval(_typingTimer);
      }
      i++;
    }, 22);
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #18 — COUNTDOWN STREAK BANNER (malam hari)
  // ═══════════════════════════════════════════════════════════
  function injectStreakCountdownBanner() {
    // Cari area beranda untuk inject banner
    const berandaPage = document.getElementById('page-beranda');
    if (!berandaPage || document.getElementById('streak-countdown')) return;
    const banner = document.createElement('div');
    banner.id = 'streak-countdown';
    // Insert setelah header stats
    const statsBox = berandaPage.querySelector('.hero-stats, #stat-koin')?.closest('div') || berandaPage.firstChild;
    if (statsBox && statsBox.parentNode) {
      statsBox.parentNode.insertBefore(banner, statsBox.nextSibling);
    } else {
      berandaPage.prepend(banner);
    }
  }

  function updateStreakCountdown() {
    const banner = document.getElementById('streak-countdown');
    if (!banner || typeof CU === 'undefined' || !CU) return;
    const streak = CU.streak || 0;
    if (streak < 1) { banner.style.display = 'none'; return; }
    const now = new Date();
    const hour = now.getHours();
    // Tampilkan mulai jam 17.00
    if (hour < 17) { banner.style.display = 'none'; return; }
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const hLeft = Math.floor(diff / 3600000);
    const mLeft = Math.floor((diff % 3600000) / 60000);
    banner.style.display = 'block';
    banner.textContent = `🔥 Streak ${streak} harimu berlanjut besok — ${hLeft}j ${mLeft}m lagi untuk check-in!`;
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #14 — REALTIME NOTIF VERIFIKASI ORANG TUA
  // ═══════════════════════════════════════════════════════════
  function injectVerifNotif() {
    if (document.getElementById('verif-notif')) return;
    const el = document.createElement('div');
    el.id = 'verif-notif';
    document.body.appendChild(el);
  }

  function showVerifNotif(habitName) {
    const el = document.getElementById('verif-notif');
    if (!el) return;
    el.textContent = '✅ Orang tua verifikasi: ' + habitName + '!';
    el.classList.add('show');
    vibrate(40);
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #12 — PREVIEW AVATAR SAAT PIN DIKETIK
  // ═══════════════════════════════════════════════════════════
  function injectPinPreview() {
    const loginBox = document.getElementById('login-anak');
    if (!loginBox || document.getElementById('pin-avatar-preview')) return;
    const preview = document.createElement('div');
    preview.id = 'pin-avatar-preview';
    preview.style.cssText = 'text-align:center;margin:8px 0;min-height:48px;transition:all 0.2s';
    const pinRow = loginBox.querySelector('.pin-row, #p0')?.closest('div') || loginBox.firstChild;
    if (pinRow) loginBox.insertBefore(preview, pinRow);
  }

  function updatePinPreview() {
    const preview = document.getElementById('pin-avatar-preview');
    if (!preview || typeof STORE === 'undefined') return;
    const pin = ['p0','p1','p2','p3'].map(id => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    }).join('');
    if (pin.length < 4) { preview.innerHTML = ''; return; }
    const student = STORE.students.find(s => s.pin === pin);
    if (student) {
      preview.innerHTML = `<div style="font-size:36px">${student.avatar || '🦁'}</div>
        <div style="font-size:13px;font-weight:700;color:#1A1A2E">${student.name.split(' ')[0]}</div>`;
    } else {
      preview.innerHTML = '<div style="font-size:12px;color:#E74C3C">PIN tidak ditemukan</div>';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #8 — KARTU FLIP ANIMATION saat overlay card buka
  // ═══════════════════════════════════════════════════════════
  function applyCardFlip() {
    const bigCard = document.getElementById('big-card');
    if (!bigCard) return;
    bigCard.classList.add('card-flip-inner');
    const wrap = bigCard.parentNode;
    if (wrap) wrap.classList.add('card-flip-wrap');
    // Reset animasi setiap kartu baru tampil
    bigCard.style.animation = 'none';
    void bigCard.offsetWidth;
    bigCard.style.animation = '';
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #7 — MOBIL GRAND PRIX SMOOTH TRANSITION
  // Cek apakah style transition sudah ada; kalau belum, inject
  // ═══════════════════════════════════════════════════════════
  function ensureRaceTransitions() {
    // Dipanggil setelah renderRaceTrack. Tambahkan transition ke semua .car-pos
    document.querySelectorAll('[id^="car-"], .race-car-wrap, [style*="position:absolute"]').forEach(el => {
      if (!el.style.transition) {
        el.style.transition = 'left 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), bottom 0.5s ease';
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PERBAIKAN #20 — TIER PILL KONSISTEN
  // ═══════════════════════════════════════════════════════════
  function normalizeTierPills() {
    document.querySelectorAll('[id="topbar-tier"], .tier-badge, [class*="tier"]').forEach(el => {
      const txt = el.textContent || '';
      el.classList.remove('tier-pill-perunggu','tier-pill-perak','tier-pill-emas','tier-pill-berlian');
      if (txt.includes('Perunggu')) el.classList.add('tier-pill-perunggu');
      else if (txt.includes('Perak'))    el.classList.add('tier-pill-perak');
      else if (txt.includes('Emas'))     el.classList.add('tier-pill-emas');
      else if (txt.includes('Berlian'))  el.classList.add('tier-pill-berlian');
    });
  }

  // ═══════════════════════════════════════════════════════════
  // HOOK: Override doCheckIn
  // Tambahkan semua efek setelah check-in berhasil
  // ═══════════════════════════════════════════════════════════
  function hookCheckIn() {
    if (typeof window.doCheckIn !== 'function') return;
    const orig = window.doCheckIn;
    window.doCheckIn = function (hb) {
      const prevLevel = (typeof CU !== 'undefined' && CU) ? CU.level : 0;
      const prevStreak = (typeof CU !== 'undefined' && CU) ? CU.streak : 0;

      orig.call(this, hb);

      // #1 Koin burst — cari elemen yang diklik
      const checkedEl = document.querySelector('.habit-card.checked .hchk');
      burstKoin(checkedEl || null);

      // #3 Audio
      playDing('checkin');

      // #9 Haptic
      vibrate(30);

      // #19 Reaksi emoji
      showHabitReaction(hb.id);

      // #4 Streak pop — jika streak naik
      setTimeout(() => {
        if (typeof CU !== 'undefined' && CU && CU.streak !== prevStreak) {
          const streakEls = document.querySelectorAll('[class*="streak"], #stat-streak, .streak-val');
          streakEls.forEach(el => popStreak(el));
        }
      }, 300);

      // #6 Level up overlay
      setTimeout(() => {
        if (typeof CU !== 'undefined' && CU && CU.level > prevLevel) {
          showLevelUpOverlay(CU.level);
        }
      }, 500);

      // #15 Perfect day
      setTimeout(() => {
        if (typeof CU !== 'undefined' && CU) {
          const done = Object.keys(CU.checkedToday || {}).length;
          checkPerfectDay(done);
        }
      }, 600);

      // #10 Typing mentor — setelah render
      setTimeout(() => {
        const mentorEl = document.getElementById('mentor-msg');
        if (mentorEl) typeMentorMsg(mentorEl, mentorEl.textContent);
      }, 700);

      // #20 Tier pill normalize
      setTimeout(normalizeTierPills, 400);
    };
  }

  // ═══════════════════════════════════════════════════════════
  // HOOK: Override switchPage — tambahkan efek & banner
  // ═══════════════════════════════════════════════════════════
  function hookSwitchPage() {
    if (typeof window.switchPage !== 'function') return;
    const orig = window.switchPage;
    window.switchPage = function (page) {
      orig.call(this, page);

      // #7 Race smooth
      if (page === 'race') setTimeout(ensureRaceTransitions, 100);

      // #8 Card flip
      if (page === 'dunia') setTimeout(applyCardFlip, 50);

      // #18 Countdown banner
      if (page === 'beranda') {
        setTimeout(() => {
          injectStreakCountdownBanner();
          updateStreakCountdown();
        }, 100);
      }

      // #20 Tier pills
      setTimeout(normalizeTierPills, 300);
    };
  }

  // ═══════════════════════════════════════════════════════════
  // HOOK: Override openOverlay — efek kartu flip
  // ═══════════════════════════════════════════════════════════
  function hookOverlay() {
    if (typeof window.openOverlay !== 'function') return;
    const orig = window.openOverlay;
    window.openOverlay = function (id) {
      orig.call(this, id);
      if (id === 'card') setTimeout(applyCardFlip, 50);
    };
  }

  // ═══════════════════════════════════════════════════════════
  // HOOK: PIN INPUT — preview avatar (#12)
  // ═══════════════════════════════════════════════════════════
  function hookPinInputs() {
    ['p0','p1','p2','p3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updatePinPreview);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // HOOK: Supabase Realtime verifikasi (#14)
  // ═══════════════════════════════════════════════════════════
  function hookRealtimeVerif() {
    if (typeof enableRealtimeSync !== 'function') return;
    enableRealtimeSync(function (payload) {
      if (typeof CU === 'undefined' || !CU) return;
      if (payload.table !== 'students') return;
      const newRow = payload.new;
      if (!newRow || newRow.id !== CU.id) return;
      const oldVerif = CU.verifiedToday || {};
      const newVerif = newRow.verified_today || {};
      // Cari kebiasaan yang baru diverifikasi 'yes'
      Object.keys(newVerif).forEach(hId => {
        if (newVerif[hId] === 'yes' && oldVerif[hId] !== 'yes') {
          const hb = (typeof HABITS !== 'undefined') ? HABITS.find(h => h.id === hId) : null;
          showVerifNotif(hb ? hb.name : hId);
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // HOOK: renderMentor — tambah typing animation (#10)
  // ═══════════════════════════════════════════════════════════
  function hookRenderMentor() {
    if (typeof window.renderMentor !== 'function') return;
    const orig = window.renderMentor;
    window.renderMentor = function () {
      orig.call(this);
      const el = document.getElementById('mentor-msg');
      if (el) typeMentorMsg(el, el.textContent);
    };
  }

  // ═══════════════════════════════════════════════════════════
  // INJECT DOM ELEMENTS STATIS
  // ═══════════════════════════════════════════════════════════
  function injectDOMElements() {
    // #14 Verif notif
    injectVerifNotif();
    // #12 PIN avatar preview
    injectPinPreview();
    hookPinInputs();
    // #15 Perfect day banner (inject ke page beranda)
    const berandaPage = document.getElementById('page-beranda');
    if (berandaPage && !document.getElementById('perfect-day-banner')) {
      const banner = document.createElement('div');
      banner.id = 'perfect-day-banner';
      berandaPage.prepend(banner);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MutationObserver: pantau DOM tambahan yang render dinamis
  // (untuk badge stamp #17 dan tier pills #20)
  // ═══════════════════════════════════════════════════════════
  function startMutationObserver() {
    const obs = new MutationObserver((mutations) => {
      let needTier = false;
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (!node.querySelectorAll) return;
          // #17 Badge stamp
          node.querySelectorAll('.badge-item:not(.badge-stamp), .badge-card:not(.badge-stamp)').forEach(badge => {
            if (!badge.classList.contains('locked')) {
              badge.classList.add('badge-stamp');
            }
          });
          // #20 Tier normalisasi
          if (node.textContent && (node.textContent.includes('Perunggu') || node.textContent.includes('Emas') || node.textContent.includes('Perak'))) {
            needTier = true;
          }
        });
      });
      if (needTier) setTimeout(normalizeTierPills, 50);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN INIT
  // ═══════════════════════════════════════════════════════════
  function init() {
    injectCSS();
    injectDOMElements();
    hookCheckIn();
    hookSwitchPage();
    hookOverlay();
    hookRenderMentor();
    hookRealtimeVerif();
    startMutationObserver();

    // Interval streak countdown setiap menit
    setInterval(updateStreakCountdown, 60000);

    // Normalisasi tier saat init
    setTimeout(normalizeTierPills, 500);

    console.log('[HeroKu Enhancements] ✅ Semua 20 perbaikan aktif!');
  }

  // Skeleton loading langsung berjalan (sebelum app ready)
  // Inject CSS dasar dulu supaya skeleton bekerja
  const earlyStyle = document.createElement('style');
  earlyStyle.textContent = `
    #heroku-skeleton { position:fixed;inset:0;z-index:99999;background:linear-gradient(160deg,#1A1A2E,#0F3460);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px; }
    .sk-block { background:rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;position:relative; }
    .sk-block::after { content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.06) 50%,transparent 100%);animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  `;
  document.head.appendChild(earlyStyle);
  injectSkeleton();

})();
