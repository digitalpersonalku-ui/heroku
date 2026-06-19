// ═══════════════════════════════════════════════════════════════
// HEROKU REWARD SYSTEM v2.0
// Achievement & Reward Feedback — Core Engine
//
// File: js/reward-system.js
// Dependensi: GSAP (diload via CDN di index.html)
// Cara pakai: tambahkan di index.html PALING AKHIR sebelum </body>
//   <link rel="stylesheet" href="css/reward-system.css">
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
//   <script src="js/reward-system.js"></script>
//
// API Publik (panggil dari mana saja di app.js):
//   HW.xp(amount, originEl)        — floating XP
//   HW.coin(amount, originEl)      — floating coin
//   HW.achievement(config)         — popup achievement
//   HW.badgeUnlock(badge, rewards) — badge unlock modal
//   HW.levelUp(level, perks)       — level up celebration
//   HW.confetti(opts)              — confetti burst
//   HW.streak(days)                — streak milestone
//   HW.tierUp(tier)                — tier naik notif
//   HW.perfectDay()                — 7/7 banner
//   HW.ripple(el, event)           — ripple tap effect
// ═══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── GSAP GUARD ──────────────────────────────────────────────
  // Jika GSAP belum termuat, beri warning sekali & skip efek animasi
  function gsapReady() {
    return typeof gsap !== 'undefined';
  }

  // ── AUDIO ENGINE ────────────────────────────────────────────
  let _ctx = null;
  function ac() {
    if (!_ctx) {
      try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    return _ctx;
  }

  function resumeCtx(ctx) {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  const SFX = {
    coin: function () {
      const ctx = ac(); if (!ctx) return;
      resumeCtx(ctx);
      [880, 1100, 1320].forEach(function (freq, i) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.07);
        g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.07 + 0.03);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.07 + 0.18);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.07);
        o.stop(ctx.currentTime + i * 0.07 + 0.2);
      });
    },
    xp: function () {
      const ctx = ac(); if (!ctx) return;
      resumeCtx(ctx);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(600, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.15);
      g.gain.setValueAtTime(0.07, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.22);
    },
    levelUp: function () {
      const ctx = ac(); if (!ctx) return;
      resumeCtx(ctx);
      const melody = [523, 659, 784, 1047, 1319];
      melody.forEach(function (freq, i) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        g.gain.linearRampToValueAtTime(0.09, ctx.currentTime + i * 0.12 + 0.05);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.12 + 0.22);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.12);
        o.stop(ctx.currentTime + i * 0.12 + 0.25);
      });
    },
    badge: function () {
      const ctx = ac(); if (!ctx) return;
      resumeCtx(ctx);
      [440, 554, 659, 880].forEach(function (freq, i) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + i * 0.1 + 0.04);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.1 + 0.2);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.1);
        o.stop(ctx.currentTime + i * 0.1 + 0.25);
      });
    },
    streak: function () {
      const ctx = ac(); if (!ctx) return;
      resumeCtx(ctx);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(300, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3);
    }
  };

  // ── HAPTICS ─────────────────────────────────────────────────
  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // ── DOM BUILDER ─────────────────────────────────────────────
  function el(tag, cls, attrs) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { e[k] = attrs[k]; });
    return e;
  }

  // ── CONFETTI ENGINE ─────────────────────────────────────────
  let _canvas = null;
  let _confettiActive = false;
  let _confettiPieces = [];
  let _confettiRaf = null;

  function getCanvas() {
    if (!_canvas) {
      _canvas = el('canvas', null, { id: 'hw-confetti-canvas' });
      document.body.appendChild(_canvas);
    }
    _canvas.width = window.innerWidth;
    _canvas.height = window.innerHeight;
    return _canvas;
  }

  const CONFETTI_COLORS = [
    '#F1C40F', '#FF6B35', '#52D98A', '#6C5CE7',
    '#FF7675', '#74B9FF', '#FFEAA7', '#00B894',
    '#FD79A8', '#A29BFE'
  ];

  function spawnConfettiPiece(x, y, spread) {
    spread = spread || 1;
    return {
      x: x || Math.random() * window.innerWidth,
      y: y != null ? y : -10,
      vx: (Math.random() - 0.5) * 8 * spread,
      vy: Math.random() * 4 + 2,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      w: 8 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      alpha: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      gravity: 0.15 + Math.random() * 0.1,
      life: 1
    };
  }

  function tickConfetti() {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    _confettiPieces = _confettiPieces.filter(function (p) {
      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.rot += p.rotV;
      p.vx *= 0.99;
      p.life -= 0.008;
      p.alpha = Math.max(0, p.life);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();

      return p.life > 0 && p.y < canvas.height + 40;
    });

    if (_confettiPieces.length > 0) {
      _confettiRaf = requestAnimationFrame(tickConfetti);
    } else {
      _confettiActive = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ── FLOATING LABEL ──────────────────────────────────────────
  function floatLabel(text, cssClass, originEl) {
    if (!gsapReady()) return;

    const label = el('div', 'hw-float-label ' + cssClass);
    label.innerHTML = text;
    document.body.appendChild(label);

    // Posisi: di atas elemen asal, atau tengah layar
    let startX, startY;
    if (originEl) {
      const r = originEl.getBoundingClientRect();
      startX = r.left + r.width / 2;
      startY = r.top + r.height / 2;
    } else {
      startX = window.innerWidth / 2;
      startY = window.innerHeight / 2;
    }

    // Sementara taruh di DOM dulu untuk ukur
    label.style.visibility = 'hidden';
    label.style.position = 'fixed';
    label.style.left = '-9999px';
    label.style.top = '-9999px';
    const lw = label.offsetWidth;
    const lh = label.offsetHeight;
    label.style.visibility = '';
    label.style.left = (startX - lw / 2) + 'px';
    label.style.top = (startY - lh / 2) + 'px';

    gsap.fromTo(label,
      { opacity: 0, y: 0, scale: 0.7 },
      {
        opacity: 1,
        y: -60 - Math.random() * 20,
        scale: 1.05,
        duration: 0.35,
        ease: 'back.out(2)',
        onComplete: function () {
          gsap.to(label, {
            opacity: 0,
            y: '-=20',
            duration: 0.35,
            delay: 0.55,
            ease: 'power2.in',
            onComplete: function () { label.remove(); }
          });
        }
      }
    );
  }

  // ── BURST PARTICLES ─────────────────────────────────────────
  function burstParticles(originEl, colors, count) {
    if (!gsapReady()) return;
    count = count || 12;
    colors = colors || CONFETTI_COLORS;

    const cx = originEl
      ? (function () { const r = originEl.getBoundingClientRect(); return r.left + r.width / 2; })()
      : window.innerWidth / 2;
    const cy = originEl
      ? (function () { const r = originEl.getBoundingClientRect(); return r.top + r.height / 2; })()
      : window.innerHeight / 2;

    const wrap = el('div', 'hw-particle-wrap');
    document.body.appendChild(wrap);

    for (let i = 0; i < count; i++) {
      const p = el('div', 'hw-particle');
      const size = 8 + Math.random() * 8;
      p.style.cssText = [
        'width:' + size + 'px',
        'height:' + size + 'px',
        'left:' + cx + 'px',
        'top:' + cy + 'px',
        'background:' + colors[Math.floor(Math.random() * colors.length)],
        'border-radius:' + (Math.random() > 0.5 ? '50%' : '3px')
      ].join(';');
      wrap.appendChild(p);

      const angle = (i / count) * Math.PI * 2;
      const dist = 50 + Math.random() * 60;
      gsap.fromTo(p,
        { x: 0, y: 0, opacity: 1, scale: 1 },
        {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          opacity: 0,
          scale: 0.3,
          duration: 0.7 + Math.random() * 0.3,
          delay: Math.random() * 0.1,
          ease: 'power2.out'
        }
      );
    }

    setTimeout(function () { wrap.remove(); }, 1200);
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════

  var HW = {};

  // ─── 1. FLOATING XP ───────────────────────────────────────
  HW.xp = function (amount, originEl) {
    SFX.xp();
    vibrate(20);
    floatLabel('✨ +' + amount + ' XP', 'hw-float-xp', originEl);
    burstParticles(originEl, ['#8E44AD', '#D7BDE2', '#A569BD', '#7D3C98'], 8);
  };

  // ─── 2. FLOATING COIN ─────────────────────────────────────
  HW.coin = function (amount, originEl) {
    SFX.coin();
    vibrate(30);
    floatLabel('⭐ +' + amount + ' Koin', 'hw-float-coin', originEl);
    // Star emoji particles
    if (gsapReady()) {
      const cx = originEl
        ? (function () { const r = originEl.getBoundingClientRect(); return r.left + r.width / 2; })()
        : window.innerWidth / 2;
      const cy = originEl
        ? (function () { const r = originEl.getBoundingClientRect(); return r.top + r.height / 2; })()
        : window.innerHeight / 2;

      ['⭐', '✨', '🌟', '💫'].forEach(function (emoji, i) {
        const p = el('div', 'hw-star-particle');
        p.textContent = emoji;
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        document.body.appendChild(p);
        const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 40 + Math.random() * 50;
        gsap.fromTo(p,
          { x: 0, y: 0, opacity: 1, scale: 0.5, rotation: 0 },
          {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist - 20,
            opacity: 0,
            scale: 1.2,
            rotation: (Math.random() - 0.5) * 180,
            duration: 0.8,
            delay: i * 0.06,
            ease: 'power2.out',
            onComplete: function () { p.remove(); }
          }
        );
      });
    }
  };

  // ─── 3. ACHIEVEMENT POPUP ─────────────────────────────────
  // config: { icon, label, title, desc, coinReward, xpReward }
  var _achQueue = [];
  var _achRunning = false;

  function buildAchievementEl() {
    if (document.getElementById('hw-achievement-popup')) return;
    const popup = el('div', null, { id: 'hw-achievement-popup' });
    popup.innerHTML = [
      '<div class="hw-achievement-inner" style="position:relative;overflow:hidden">',
        '<div class="hw-ach-icon-wrap">',
          '<div class="hw-ach-glow"></div>',
          '<div class="hw-ach-pulse-ring"></div>',
          '<div class="hw-ach-icon" id="hw-ach-icon-el">🏆</div>',
        '</div>',
        '<div class="hw-ach-texts">',
          '<div class="hw-ach-label" id="hw-ach-label-el">PENCAPAIAN BARU</div>',
          '<div class="hw-ach-title" id="hw-ach-title-el">Judul</div>',
          '<div class="hw-ach-desc" id="hw-ach-desc-el">Deskripsi</div>',
          '<div class="hw-ach-reward-row" id="hw-ach-rewards-el"></div>',
        '</div>',
        '<div class="hw-ach-shine" id="hw-ach-shine"></div>',
      '</div>'
    ].join('');
    document.body.appendChild(popup);
  }

  function showNextAch() {
    if (!_achQueue.length) { _achRunning = false; return; }
    _achRunning = true;
    if (!gsapReady()) { _achQueue.shift(); showNextAch(); return; }

    const cfg = _achQueue.shift();
    buildAchievementEl();

    document.getElementById('hw-ach-icon-el').textContent = cfg.icon || '🏆';
    document.getElementById('hw-ach-label-el').textContent = cfg.label || 'PENCAPAIAN BARU';
    document.getElementById('hw-ach-title-el').textContent = cfg.title || '';
    document.getElementById('hw-ach-desc-el').textContent = cfg.desc || '';

    const rewardsEl = document.getElementById('hw-ach-rewards-el');
    rewardsEl.innerHTML = '';
    if (cfg.coinReward) {
      const pill = el('span', 'hw-ach-reward-pill gold');
      pill.textContent = '⭐ +' + cfg.coinReward + ' Koin';
      rewardsEl.appendChild(pill);
    }
    if (cfg.xpReward) {
      const pill = el('span', 'hw-ach-reward-pill purple');
      pill.textContent = '✨ +' + cfg.xpReward + ' XP';
      rewardsEl.appendChild(pill);
    }

    const popup = document.getElementById('hw-achievement-popup');
    const shine = document.getElementById('hw-ach-shine');

    gsap.killTweensOf(popup);

    // Masuk
    gsap.fromTo(popup,
      { opacity: 0, y: -30, scale: 0.9 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.45,
        ease: 'back.out(1.6)',
        onComplete: function () {
          // Shine sweep
          if (shine) {
            gsap.fromTo(shine, { x: '-100%' }, { x: '200%', duration: 0.6, ease: 'power2.inOut' });
          }
          // Keluar setelah delay
          gsap.to(popup, {
            opacity: 0,
            y: -20,
            scale: 0.95,
            duration: 0.3,
            delay: cfg.duration != null ? cfg.duration : 2.8,
            ease: 'power2.in',
            onComplete: function () {
              popup.style.opacity = '0';
              setTimeout(showNextAch, 300);
            }
          });
        }
      }
    );

    SFX.coin();
    vibrate([20, 10, 20]);
  }

  HW.achievement = function (config) {
    _achQueue.push(config);
    if (!_achRunning) showNextAch();
  };

  // ─── 4. BADGE UNLOCK ANIMATION ────────────────────────────
  // badge: { icon, name, req }  |  rewards: { koin, xp }
  HW.badgeUnlock = function (badge, rewards) {
    // Bangun modal jika belum ada
    if (!document.getElementById('hw-badge-modal')) {
      const modal = el('div', null, { id: 'hw-badge-modal' });
      modal.innerHTML = [
        '<div class="hw-badge-box">',
          '<div class="hw-badge-halo"></div>',
          '<div class="hw-badge-stars-bg" id="hw-badge-stars-bg"></div>',
          '<div class="hw-badge-unlock-label">🏅 BADGE BARU TERBUKA!</div>',
          '<div class="hw-badge-icon-stage">',
            '<div class="hw-badge-ring-outer"></div>',
            '<div class="hw-badge-ring-inner"></div>',
            '<div class="hw-badge-circle" id="hw-badge-circle-icon">🌅</div>',
          '</div>',
          '<div class="hw-badge-name" id="hw-badge-name-el">Nama Badge</div>',
          '<div class="hw-badge-req" id="hw-badge-req-el">Syarat</div>',
          '<div class="hw-badge-rewards" id="hw-badge-rewards-el"></div>',
          '<button class="hw-badge-btn" id="hw-badge-btn-el">Keren! 🎉</button>',
        '</div>'
      ].join('');
      document.body.appendChild(modal);
    }

    // Isi data
    document.getElementById('hw-badge-circle-icon').textContent = badge.icon || '🏅';
    document.getElementById('hw-badge-name-el').textContent = badge.name || 'Badge';
    document.getElementById('hw-badge-req-el').textContent = badge.req || '';

    const rEl = document.getElementById('hw-badge-rewards-el');
    rEl.innerHTML = '';
    rewards = rewards || {};
    if (rewards.koin) {
      const c = el('div', 'hw-badge-reward-chip');
      c.textContent = '⭐ +' + rewards.koin + ' Koin';
      rEl.appendChild(c);
    }
    if (rewards.xp) {
      const x = el('div', 'hw-badge-reward-chip xp-chip');
      x.textContent = '✨ +' + rewards.xp + ' XP';
      rEl.appendChild(x);
    }

    // Pasang bintang latar
    const starsEl = document.getElementById('hw-badge-stars-bg');
    starsEl.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const dot = el('div', 'hw-badge-star-dot');
      dot.style.cssText = [
        'left:' + Math.random() * 100 + '%',
        'top:' + Math.random() * 100 + '%',
        '--dur:' + (1.5 + Math.random() * 2) + 's',
        '--delay:' + (Math.random() * 1.5) + 's'
      ].join(';');
      starsEl.appendChild(dot);
    }

    const modal = document.getElementById('hw-badge-modal');
    const box = modal.querySelector('.hw-badge-box');
    const circle = document.getElementById('hw-badge-circle-icon');
    const btn = document.getElementById('hw-badge-btn-el');

    modal.classList.add('open');

    if (gsapReady()) {
      // Animasi masuk kotak
      gsap.fromTo(box,
        { scale: 0.5, opacity: 0, rotationY: -15 },
        { scale: 1, opacity: 1, rotationY: 0, duration: 0.55, ease: 'back.out(1.8)' }
      );

      // Stamp icon
      gsap.fromTo(circle,
        { scale: 2.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, delay: 0.25, ease: 'back.out(2)' }
      );

      // Pulse ring
      const ring = box.querySelector('.hw-badge-ring-outer');
      if (ring) {
        gsap.fromTo(ring,
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, delay: 0.15, ease: 'power2.out' }
        );
      }
    }

    // Confetti
    HW.confetti({ count: 50, spread: 1.2 });
    SFX.badge();
    vibrate([30, 15, 30, 15, 60]);

    // Tombol tutup
    btn.onclick = function () {
      if (gsapReady()) {
        gsap.to(box, {
          scale: 0.85,
          opacity: 0,
          duration: 0.25,
          ease: 'power2.in',
          onComplete: function () {
            modal.classList.remove('open');
            box.style.opacity = '';
            box.style.transform = '';
          }
        });
      } else {
        modal.classList.remove('open');
      }
    };
  };

  // ─── 5. LEVEL UP CELEBRATION ──────────────────────────────
  // perks: array string hal yang terbuka di level baru
  HW.levelUp = function (level, perks) {
    if (!document.getElementById('hw-levelup-overlay')) {
      const overlay = el('div', null, { id: 'hw-levelup-overlay' });
      // Sinar cahaya
      overlay.innerHTML = '<div class="hw-lvl-rays" id="hw-lvl-rays"></div>';

      const box = el('div', 'hw-lvl-box');
      box.innerHTML = [
        '<div class="hw-lvl-pre">✨ Selamat! ✨</div>',
        '<div class="hw-lvl-num-wrap">',
          '<div class="hw-lvl-num" id="hw-lvl-num-el">1</div>',
        '</div>',
        '<div class="hw-lvl-title" id="hw-lvl-title-el">NAIK LEVEL!</div>',
        '<div class="hw-lvl-sub" id="hw-lvl-sub-el">Kamu makin hebat!</div>',
        '<div class="hw-lvl-perks" id="hw-lvl-perks-el"></div>',
        '<button class="hw-lvl-btn" id="hw-lvl-btn-el">Alhamdulillah! 🏆</button>'
      ].join('');
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }

    // Buat sinar
    const raysEl = document.getElementById('hw-lvl-rays');
    if (raysEl) {
      raysEl.innerHTML = '';
      for (let i = 0; i < 12; i++) {
        const ray = el('div', 'hw-lvl-ray');
        ray.style.cssText = [
          'transform: rotate(' + (i * 30) + 'deg) translateX(-50%)',
          'opacity: ' + (0.1 + Math.random() * 0.2)
        ].join(';');
        raysEl.appendChild(ray);
      }
    }

    // Isi data
    document.getElementById('hw-lvl-num-el').textContent = level;

    const titles = [
      '', '', 'Penjelajah Muda', 'Pahlawan Cilik',
      'Pembela Kebaikan', 'Bintang Kelas', 'Pejuang Tangguh',
      'Ahli Kebiasaan', 'Mentor Teman', 'Pemimpin Sejati', 'Legenda HeroKu'
    ];
    const subs = [
      '', '',
      'Perjalananmu baru dimulai!',
      'Kamu semakin kuat setiap hari!',
      'Kebaikanmu menginspirasi teman-temanmu!',
      'MasyaAllah — kamu bersinar!',
      'Istiqomah adalah kunci surga!',
      'Kebiasaan baik sudah jadi karaktermu!',
      'Teman-temanmu belajar dari kamu!',
      'Pemimpin sejati lahir dari kebiasaan baik!',
      'Subhanallah — pencapaian luar biasa!'
    ];

    document.getElementById('hw-lvl-title-el').textContent = (titles[level] || 'NAIK LEVEL!').toUpperCase();
    document.getElementById('hw-lvl-sub-el').textContent = subs[level] || 'Terus semangat!';

    const perksEl = document.getElementById('hw-lvl-perks-el');
    perksEl.innerHTML = '';
    (perks || []).forEach(function (perk) {
      const chip = el('div', 'hw-lvl-perk');
      chip.textContent = perk;
      perksEl.appendChild(chip);
    });

    const overlay = document.getElementById('hw-levelup-overlay');
    const box = overlay.querySelector('.hw-lvl-box');
    const numEl = document.getElementById('hw-lvl-num-el');
    overlay.classList.add('open');

    if (gsapReady()) {
      // Nomor bounce masuk
      gsap.fromTo(numEl,
        { scale: 0.3, opacity: 0 },
        { scale: 1.1, opacity: 1, duration: 0.4, delay: 0.1, ease: 'back.out(2)',
          onComplete: function () {
            gsap.to(numEl, { scale: 1, duration: 0.2, ease: 'power2.out' });
          }
        }
      );
      // Box slide up
      gsap.fromTo(box,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      );
      // Sinar berputar
      const rays = document.querySelectorAll('.hw-lvl-ray');
      gsap.to(rays, { rotation: '+=360', duration: 12, ease: 'none', repeat: -1, stagger: 0 });
    }

    // Confetti besar
    HW.confetti({ count: 80, spread: 1.5 });
    SFX.levelUp();
    vibrate([50, 20, 50, 20, 100, 20, 50]);

    // Tombol tutup
    document.getElementById('hw-lvl-btn-el').onclick = function () {
      if (gsapReady()) {
        gsap.to(overlay, {
          opacity: 0, duration: 0.3, ease: 'power2.in',
          onComplete: function () {
            overlay.classList.remove('open');
            overlay.style.opacity = '';
          }
        });
      } else {
        overlay.classList.remove('open');
      }
    };
  };

  // ─── 6. CONFETTI ──────────────────────────────────────────
  // opts: { count, spread, x, y }
  HW.confetti = function (opts) {
    opts = opts || {};
    const count = opts.count || 40;
    const spread = opts.spread || 1;
    const canvas = getCanvas();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    for (let i = 0; i < count; i++) {
      _confettiPieces.push(spawnConfettiPiece(
        opts.x != null ? opts.x + (Math.random() - 0.5) * 100 : null,
        opts.y != null ? opts.y : null,
        spread
      ));
    }

    if (!_confettiActive) {
      _confettiActive = true;
      if (_confettiRaf) cancelAnimationFrame(_confettiRaf);
      tickConfetti();
    }
  };

  // ─── 7. STREAK MILESTONE ──────────────────────────────────
  HW.streak = function (days) {
    if (!document.getElementById('hw-streak-banner')) {
      const banner = el('div', null, { id: 'hw-streak-banner' });
      banner.innerHTML = [
        '<div class="hw-streak-inner">',
          '<div class="hw-streak-flame">🔥</div>',
          '<div>',
            '<div class="hw-streak-text" id="hw-streak-text-el">3 Hari Berturut!</div>',
            '<div class="hw-streak-sub" id="hw-streak-sub-el">Subhanallah, terus konsisten!</div>',
          '</div>',
        '</div>'
      ].join('');
      document.body.appendChild(banner);
    }

    const milestones = {
      3:   { text: '🔥 3 Hari Berturut!',  sub: '"Amalan yang paling dicintai Allah adalah yang dilakukan terus-menerus."' },
      7:   { text: '⚡ 7 Hari Berturut!',   sub: 'Subhanallah! Satu minggu penuh istiqomah!' },
      14:  { text: '💪 14 Hari Berturut!',  sub: 'Dua minggu! Kebiasaan baik sudah mulai terbentuk!' },
      21:  { text: '🏆 21 Hari Berturut!',  sub: 'Luar biasa! Kebiasaan sudah menjadi karaktermu!' },
      30:  { text: '👑 30 Hari Berturut!',  sub: 'MasyaAllah tabarakallah! Satu bulan tanpa henti!' },
      100: { text: '💎 100 Hari Berturut!', sub: 'LEGENDA! Kamu inspirasi seluruh sekolah!' }
    };

    const data = milestones[days] || { text: '🔥 ' + days + ' Hari Berturut!', sub: 'Terus semangat!' };
    document.getElementById('hw-streak-text-el').textContent = data.text;
    document.getElementById('hw-streak-sub-el').textContent = data.sub;

    const banner = document.getElementById('hw-streak-banner');
    if (!gsapReady()) return;

    gsap.killTweensOf(banner);
    gsap.fromTo(banner,
      { opacity: 0, y: 20, scale: 0.85 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.45, ease: 'back.out(1.8)',
        onComplete: function () {
          gsap.to(banner, {
            opacity: 0, y: 20, scale: 0.9,
            duration: 0.35, delay: 2.5, ease: 'power2.in'
          });
        }
      }
    );

    HW.confetti({ count: 25, spread: 0.8 });
    SFX.streak();
    vibrate([30, 15, 30]);
  };

  // ─── 8. TIER UP NOTIFICATION ──────────────────────────────
  HW.tierUp = function (tier) {
    // tier: { icon, name, color, bg }
    if (!document.getElementById('hw-tier-notif')) {
      const notif = el('div', null, { id: 'hw-tier-notif' });
      notif.innerHTML = [
        '<div class="hw-tier-inner" id="hw-tier-inner-el">',
          '<div class="hw-tier-icon" id="hw-tier-icon-el">🥈</div>',
          '<div class="hw-tier-texts">',
            '<div class="hw-tier-label">TIER BARU!</div>',
            '<div class="hw-tier-name" id="hw-tier-name-el">Perak</div>',
          '</div>',
        '</div>'
      ].join('');
      document.body.appendChild(notif);
    }

    const innerEl = document.getElementById('hw-tier-inner-el');
    document.getElementById('hw-tier-icon-el').textContent = tier.icon || '🥈';
    document.getElementById('hw-tier-name-el').textContent = tier.name || 'Naik Tier!';
    if (tier.bg) innerEl.style.background = tier.bg;
    if (tier.color) {
      document.getElementById('hw-tier-icon-el').style.filter = 'drop-shadow(0 0 8px ' + tier.color + ')';
    }

    const notif = document.getElementById('hw-tier-notif');
    if (!gsapReady()) return;

    gsap.killTweensOf(notif);
    gsap.fromTo(notif,
      { opacity: 0, scale: 0.7, y: 30 },
      {
        opacity: 1, scale: 1, y: 0,
        duration: 0.5, ease: 'back.out(2)',
        onComplete: function () {
          gsap.to(notif, {
            opacity: 0, scale: 0.9, y: 20,
            duration: 0.35, delay: 3, ease: 'power2.in'
          });
        }
      }
    );

    HW.confetti({ count: 35 });
    SFX.levelUp();
    vibrate([40, 20, 40, 20, 80]);
  };

  // ─── 9. PERFECT DAY (7/7) ─────────────────────────────────
  var _perfectShownToday = null;

  HW.perfectDay = function () {
    const today = new Date().toISOString().slice(0, 10);
    if (_perfectShownToday === today) return;
    _perfectShownToday = today;

    if (!document.getElementById('hw-perfect-banner')) {
      const banner = el('div', null, { id: 'hw-perfect-banner' });
      banner.innerHTML = [
        '<div class="hw-perfect-inner">',
          '<div class="hw-perfect-title">🌟 Hari Sempurna! MasyaAllah! 🌟</div>',
          '<div class="hw-perfect-sub">Semua 7 kebiasaan selesai — kamu luar biasa!</div>',
        '</div>'
      ].join('');
      document.body.appendChild(banner);
    }

    const banner = document.getElementById('hw-perfect-banner');
    if (!gsapReady()) return;

    gsap.killTweensOf(banner);
    gsap.fromTo(banner,
      { opacity: 0, y: -20, scale: 0.9 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.5, ease: 'back.out(1.8)',
        onComplete: function () {
          gsap.to(banner, {
            opacity: 0, y: -20, scale: 0.95,
            duration: 0.4, delay: 3.5, ease: 'power2.in'
          });
        }
      }
    );

    HW.confetti({ count: 70, spread: 1.6 });
    vibrate([50, 20, 50, 20, 100]);
  };

  // ─── 10. RIPPLE EFFECT ────────────────────────────────────
  HW.ripple = function (el, event) {
    el.classList.add('hw-ripple-wrap');
    const ripple = document.createElement('div');
    ripple.className = 'hw-ripple';
    const rect = el.getBoundingClientRect();
    const x = (event ? event.clientX : rect.left + rect.width / 2) - rect.left;
    const y = (event ? event.clientY : rect.top + rect.height / 2) - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = [
      'width:' + size + 'px',
      'height:' + size + 'px',
      'left:' + (x - size / 2) + 'px',
      'top:' + (y - size / 2) + 'px'
    ].join(';');
    el.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 600);
  };

  // ─── HELPER: Cek Tier Naik ────────────────────────────────
  // Panggil setelah koin bertambah untuk auto-detect tier naik
  var _lastTierMin = -1;
  HW.checkTierUp = function (koin) {
    if (typeof getTier !== 'function') return;
    const tier = getTier(koin);
    if (_lastTierMin < 0) { _lastTierMin = tier.min; return; }
    if (tier.min > _lastTierMin) {
      _lastTierMin = tier.min;
      HW.tierUp(tier);
    }
  };

  // ─── HELPER: Cek Achievement Habit ───────────────────────
  // Panggil setelah check-in untuk auto-achievement
  HW.checkHabitAchievements = function (student, habitId, habitName) {
    const achievements = [];

    // Pertama kali check-in kebiasaan ini
    const habitCount = student._habitCounts && student._habitCounts[habitId]
      ? student._habitCounts[habitId] : 1;

    if (habitCount === 1) {
      achievements.push({
        icon: '🌱', label: 'PERTAMA KALI',
        title: habitName + ' Pertama!',
        desc: 'Langkah pertama adalah yang terpenting.',
        coinReward: 10, xpReward: 20
      });
    } else if (habitCount === 7) {
      achievements.push({
        icon: '🌿', label: 'KONSISTEN 7 HARI',
        title: '7 Hari ' + habitName + '!',
        desc: '"Amalan yang paling dicintai Allah adalah yang terus-menerus."',
        coinReward: 30, xpReward: 50
      });
    } else if (habitCount === 30) {
      achievements.push({
        icon: '🌳', label: 'MASTER KEBIASAAN',
        title: '30 Hari ' + habitName + '!',
        desc: 'Kebiasaan ini sudah jadi karaktermu!',
        coinReward: 100, xpReward: 200
      });
    }

    achievements.forEach(function (a) { HW.achievement(a); });
    return achievements.length > 0;
  };

  // Resize handler untuk confetti canvas
  window.addEventListener('resize', function () {
    if (_canvas) {
      _canvas.width = window.innerWidth;
      _canvas.height = window.innerHeight;
    }
  });

  // Export ke global
  global.HW = HW;

})(window);


// ═══════════════════════════════════════════════════════════════
// INTEGRASI OTOMATIS KE HEROKU
// Patch doCheckIn + event hooks — tidak mengubah file lain
// ═══════════════════════════════════════════════════════════════

(function () {
  function waitApp(cb, n) {
    n = n || 0;
    if (n > 80) return;
    if (typeof doCheckIn === 'function' && typeof STORE !== 'undefined' && STORE.students) {
      cb();
    } else {
      setTimeout(function () { waitApp(cb, n + 1); }, 100);
    }
  }

  waitApp(function () {

    // ── Patch doCheckIn ──────────────────────────────────────
    var _origCheck = window.doCheckIn;
    window.doCheckIn = function (hb) {
      var prevLevel  = (CU ? CU.level  : 0);
      var prevStreak = (CU ? CU.streak : 0);
      var prevKoin   = (CU ? CU.koin   : 0);

      // Cari elemen yang diklik (habit card terakhir)
      var originEl = document.querySelector('.habit-card:not(.checked) .hchk') ||
                     document.querySelector('.habit-card:not(.checked)') ||
                     null;

      _origCheck.call(this, hb);

      // Floating koin & XP — setelah check-in selesai
      setTimeout(function () {
        HW.coin(hb.koin, originEl);
        setTimeout(function () { HW.xp(hb.xp, originEl); }, 200);

        // Ripple pada card
        var card = document.querySelector('.habit-card.checked:last-child');
        if (card) HW.ripple(card);

        // Cek level up
        if (CU && CU.level > prevLevel) {
          var perks = [];
          if (CU.level === 3)  perks = ['Buka Kartu Langka 🃏', 'Akses Mode Menengah 📚'];
          if (CU.level === 5)  perks = ['Nitro Boost 💨', 'Buka Stiker Eksklusif ⭐'];
          if (CU.level === 7)  perks = ['Mode Dewasa 🎓', 'Kartu Legendaris 🏆'];
          if (CU.level === 10) perks = ['Status Legenda 💎', 'Semua Fitur Terbuka 🔓'];
          HW.levelUp(CU.level, perks);
        }

        // Cek streak milestone
        if (CU && CU.streak > prevStreak) {
          var milestoneStreaks = [3, 7, 14, 21, 30, 60, 100];
          if (milestoneStreaks.indexOf(CU.streak) !== -1) {
            setTimeout(function () { HW.streak(CU.streak); }, 1200);
          }
        }

        // Cek tier up
        if (CU) { HW.checkTierUp(CU.koin); }

        // Perfect day (7/7)
        if (CU) {
          var done = Object.keys(CU.checkedToday || {}).length;
          if (done === 7) {
            setTimeout(function () { HW.perfectDay(); }, 800);
          }
        }
      }, 150);
    };

    // ── Patch showCardReveal — tambah animasi ─────────────
    if (typeof window.showCardReveal === 'function') {
      var _origCard = window.showCardReveal;
      window.showCardReveal = function () {
        _origCard.call(this);
        // Tambahkan shake pada icon kartu setelah modal terbuka
        setTimeout(function () {
          var icon = document.querySelector('.bc-icon, #big-card span[class="bc-icon"]');
          if (icon && typeof gsap !== 'undefined') {
            gsap.fromTo(icon,
              { rotation: -15, scale: 0.8 },
              { rotation: 0, scale: 1.1, duration: 0.3, ease: 'back.out(2)',
                onComplete: function () {
                  gsap.to(icon, { scale: 1, duration: 0.2, ease: 'power2.out' });
                }
              }
            );
          }
          HW.coin(10);
        }, 200);
      };
    }

    // ── Tambah ripple pada SEMUA habit card ───────────────
    document.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.habit-card:not(.checked)') : null;
      if (card) HW.ripple(card, e);
    }, true);

    console.log('[HW Reward System] ✅ Terpasang — GSAP:', typeof gsap !== 'undefined' ? 'OK' : 'TIDAK DITEMUKAN');
  });

})();
