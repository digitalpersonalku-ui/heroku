// ═══════════════════════════════════════════════════════════
// HEROKU PARENT CONNECT v1.0
// Tahap 4 dari 5 — Anti-Jenuh: Koneksi Orang Tua
//
// File: js/parent-connect.js
// Pasang setelah social-pulse.js:
//   <script src="js/parent-connect.js"></script>
//
// Masalah yang diselesaikan:
//   Verifikasi ortu terasa seperti "formalitas admin"
//   Solusi: ubah menjadi momen emosional yang paling berkesan
//
// 4 Fitur Utama:
//   A. Ortu Verification Glow  — animasi saat ortu verifikasi
//   B. Pesan Cinta dari Ortu   — notifikasi hangat ke siswa
//   C. Bangga Meter            — indikator kebanggaan ortu
//   D. Momen Keluarga          — ringkasan malam untuk ortu
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─── Utils ───────────────────────────────────────────────
  function nick(s) {
    if (!s) {
      if (typeof CU !== 'undefined' && CU) {
        return CU.nickname || (CU.name || '').split(' ')[0] || 'Anakku';
      }
      return 'Anakku';
    }
    return s.nickname || (s.name || '').split(' ')[0] || 'Anakku';
  }
  function done() {
    return Object.keys((typeof CU !== 'undefined' && CU?.checkedToday) || {}).length;
  }

  // ═══════════════════════════════════════════════════════════
  // A. PESAN CINTA — template pesan dari ortu ke siswa
  // Muncul di halaman beranda siswa setelah ortu verifikasi
  // ═══════════════════════════════════════════════════════════

  const PARENT_MESSAGES = {
    // Saat ortu verifikasi "Ya" (disetujui)
    approved: [
      { em: '🤗', msg: 'Ayah/Ibu melihatmu dengan mata kepala sendiri — kamu memang luar biasa! Bangga sekali punya anak seperti kamu.' },
      { em: '💝', msg: 'Ayah/Ibu sudah konfirmasi ya, Nak. Teruskan kebiasaan baik ini — rumah kita jadi lebih bahagia karenamu!' },
      { em: '🌟', msg: 'Diverifikasi dengan cinta! Ayah/Ibu selalu melihat usahamu — jangan pernah berhenti, ya!' },
      { em: '🤲', msg: 'Alhamdulillah, Nak. Ayah/Ibu doakan kamu selalu. Kebiasaan baik ini adalah hadiah terbaik untukmu!' },
      { em: '👏', msg: 'Ayah/Ibu bangga! Bukan karena nilaimu — tapi karena karaktermu yang semakin indah setiap hari.' },
    ],

    // Saat 7/7 (perfect day) — pesan dari ortu
    perfect: [
      { em: '👑', msg: 'MASYAALLAH, Nak!!! 7 dari 7 hari ini! Ayah/Ibu tidak bisa menyembunyikan air mata kebanggaan ini. Kamu adalah anugerah terbaik dari Allah!' },
      { em: '🏆', msg: 'Tujuh. Tujuh kebiasaan. Sempurna. Ayah/Ibu doakan hari ini menjadi kenangan indah yang kamu bawa seumur hidup. Kami sangat mencintaimu!' },
      { em: '🌙', msg: 'Malam ini Ayah/Ibu akan ceritakan pencapaianmu hari ini kepada seluruh keluarga. Kamu membuat kami semua bangga, Nak!' },
    ],

    // Saat ortu pertama buka app hari ini
    morningCheck: [
      { em: '☀️', msg: 'Selamat pagi, Nak! Ayah/Ibu selalu mendoakanmu setiap pagi. Hari ini pasti luar biasa!' },
      { em: '🌅', msg: 'Ayah/Ibu buka app ini untuk melihat kabarmu. Kamu selalu ada di hati kami — teruskan semangatmu!' },
    ],

    // Reminder lembut saat anak belum mulai (hanya muncul di sisi ortu)
    gentleNudge: [
      'Ingatkan dengan kasih sayang — ajak bicara, bukan menyuruh.',
      'Tanya pengalamannya hari ini sebelum mengingatkan misi.',
      'Duduk bersama dan kerjakan satu misi pertama bersama-sama.',
    ],
  };

  // ═══════════════════════════════════════════════════════════
  // B. BANGGA METER — visual kebanggaan ortu
  // Dihitung dari: verified count + streak + totalDays
  // ═══════════════════════════════════════════════════════════

  function getBanggaScore() {
    if (typeof CU === 'undefined' || !CU) return 0;
    const verifiedCount = Object.values(CU.verifiedToday || {})
      .filter(v => v === 'yes').length;
    const streakBonus   = Math.min((CU.streak || 0) * 3, 30);
    const daysBonus     = Math.min((CU.totalDays || 0) * 2, 30);
    const missionBonus  = done() * 5;
    const verifyBonus   = verifiedCount * 8;
    return Math.min(100, missionBonus + verifyBonus + streakBonus + daysBonus);
  }

  function getBanggaLabel(score) {
    if (score >= 90) return { text: 'Luar Biasa Sekali!', color: '#FFE066', em: '👑' };
    if (score >= 70) return { text: 'Sangat Bangga!',     color: '#F1C40F', em: '🌟' };
    if (score >= 50) return { text: 'Bangga!',            color: '#2ECC71', em: '😊' };
    if (score >= 30) return { text: 'Mulai Bagus!',       color: '#3498DB', em: '💪' };
    return { text: 'Terus Semangat!', color: '#95A5A6', em: '🌱' };
  }

  // ═══════════════════════════════════════════════════════════
  // C. RINGKASAN MALAM — laporan indah untuk ortu
  // ═══════════════════════════════════════════════════════════

  function getEveningSummary() {
    if (typeof CU === 'undefined' || !CU) return null;
    const d       = done();
    const streak  = CU.streak || 0;
    const total   = CU.totalDays || 0;
    const n       = nick();
    const verified = Object.values(CU.verifiedToday || {}).filter(v => v === 'yes').length;

    const highlights = [];
    if (d === 7)     highlights.push('✅ Hari Sempurna — semua 7 kebiasaan!');
    if (streak >= 7) highlights.push(`🔥 Streak ${streak} hari tanpa henti!`);
    if (verified > 0) highlights.push(`📋 ${verified} kebiasaan sudah Anda verifikasi`);
    if (total % 7 === 0 && total > 0) highlights.push(`🏆 ${total} hari perjalanan bersama HeroKu!`);

    const suggestions = d === 7
      ? `Malam ini, katakan kepada ${n}: "Nak, Ayah/Ibu bangga sekali hari ini. Kamu luar biasa!"`
      : d >= 4
      ? `Tanyakan kepada ${n} misi mana yang paling berkesan hari ini.`
      : d > 0
      ? `Dampingi ${n} menyelesaikan ${7-d} misi yang tersisa sebelum tidur.`
      : `Ajak ${n} duduk bersama malam ini dan mulai satu kebiasaan bersama-sama.`;

    return { d, streak, total, highlights, suggestions, n };
  }

  // ═══════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════

  function injectCSS() {
    if (document.getElementById('_pc_css')) return;
    const s = document.createElement('style');
    s.id = '_pc_css';
    s.textContent = `

/* ── Pesan Cinta Banner (sisi siswa) ── */
#_pc_love_banner {
  border-radius: 16px; padding: 14px 16px; margin-bottom: 12px;
  display: none; align-items: flex-start; gap: 12px;
  position: relative; overflow: hidden;
  background: linear-gradient(135deg,rgba(46,204,113,.12),rgba(39,174,96,.08));
  border: 1.5px solid rgba(46,204,113,.3);
  animation: _pcBannerIn .5s cubic-bezier(.34,1.5,.64,1) both;
}
#_pc_love_banner.show { display: flex; }
@keyframes _pcBannerIn {
  from { opacity:0; transform:scale(.95) translateY(-8px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}
#_pc_love_banner::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent);
  transform:translateX(-100%);
  animation: _pcShine 2.5s ease-in-out 1s forwards;
}
@keyframes _pcShine { to { transform: translateX(200%); } }
._pc_lb_heart {
  font-size: 32px; flex-shrink: 0;
  animation: _pcHeartBeat 1.2s ease-in-out infinite;
}
@keyframes _pcHeartBeat {
  0%,100%{ transform:scale(1); }
  50%    { transform:scale(1.15); }
}
._pc_lb_body { flex: 1; }
._pc_lb_from { font-size: 10px; font-weight: 800; color: rgba(46,204,113,.8);
               text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
._pc_lb_msg  { font-size: 12px; color: rgba(255,255,255,.85); line-height: 1.65;
               font-weight: 600; }
._pc_lb_close{
  position: absolute; top: 8px; right: 10px;
  font-size: 14px; color: rgba(255,255,255,.25);
  cursor: pointer; padding: 2px 4px;
}

/* ── Bangga Meter (sisi siswa) ── */
#_pc_bangga {
  border-radius: 14px; padding: 11px 14px; margin-bottom: 10px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
}
._pc_bg_head {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px;
}
._pc_bg_label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,.6); }
._pc_bg_val   { font-size: 12px; font-weight: 900; }
._pc_bg_bar   { height: 7px; border-radius: 4px; background: rgba(255,255,255,.08); overflow: hidden; }
._pc_bg_fill  {
  height: 100%; border-radius: 4px; width: 0%;
  transition: width 1.2s cubic-bezier(.22,1,.36,1);
}
._pc_bg_note  { font-size: 10px; color: rgba(255,255,255,.4); margin-top: 5px;
                font-style: italic; }

/* ── Verifikasi Glow Overlay (muncul ke siswa) ── */
#_pc_verify_glow {
  position: fixed; inset: 0; z-index: 7500;
  display: none; align-items: center; justify-content: center;
  background: rgba(8,8,16,.88);
  backdrop-filter: blur(16px);
  flex-direction: column; padding: 20px;
}
#_pc_verify_glow.show { display: flex; }
._pc_vg_box {
  border-radius: 24px; padding: 28px 22px 24px;
  max-width: 300px; width: 100%; text-align: center;
  background: linear-gradient(160deg,#0A2E1A,#1A2E0A,#0A1A2E);
  border: 1.5px solid rgba(46,204,113,.35);
  position: relative; overflow: hidden;
  animation: _pcBoxIn .5s cubic-bezier(.34,1.5,.64,1) both;
}
@keyframes _pcBoxIn {
  from { scale:.5; opacity:0; }
  to   { scale:1;  opacity:1; }
}
._pc_vg_from { font-size: 10px; font-weight: 800; letter-spacing: 2px;
               text-transform: uppercase; color: rgba(46,204,113,.7); margin-bottom: 8px; }
._pc_vg_em   { font-size: 64px; display: block; margin-bottom: 10px;
               animation: _pcHeartBeat 1.2s ease-in-out infinite; }
._pc_vg_habit{ font-size: 13px; font-weight: 800;
               color: rgba(46,204,113,.9); margin-bottom: 8px; }
._pc_vg_msg  { font-size: 13px; color: rgba(255,255,255,.8);
               line-height: 1.7; margin-bottom: 18px; white-space: pre-line; }
._pc_vg_from2{ font-size: 10px; color: rgba(255,255,255,.3); margin-bottom: 18px; }
._pc_vg_btn  {
  width: 100%; padding: 14px; border: none; border-radius: 14px;
  font-size: 14px; font-weight: 900; cursor: pointer;
  background: linear-gradient(135deg,#2ECC71,#27AE60);
  color: #fff; box-shadow: 0 5px 18px rgba(46,204,113,.35);
  font-family: inherit; transition: transform .15s;
}
._pc_vg_btn:active { transform: scale(.97); }

/* ── Ringkasan Malam (sisi ortu) ── */
._pc_summary {
  border-radius: 16px; padding: 14px 16px; margin-top: 12px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
}
._pc_sum_head { font-size: 12px; font-weight: 800; color: rgba(255,255,255,.7);
                margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
._pc_sum_high { margin-bottom: 10px; }
._pc_sum_item { font-size: 11px; color: rgba(255,255,255,.65); padding: 3px 0;
                line-height: 1.5; }
._pc_sum_sug  {
  background: rgba(46,204,113,.08); border-left: 3px solid rgba(46,204,113,.4);
  border-radius: 0 10px 10px 0; padding: 9px 12px;
  font-size: 11px; color: rgba(255,255,255,.75); line-height: 1.65;
  font-style: italic; margin-top: 8px;
}
._pc_sum_label{ font-size: 10px; font-weight: 800; color: rgba(46,204,113,.7);
                margin-bottom: 4px; letter-spacing: 1px; text-transform: uppercase; }

/* ── Verify enhanced button ── */
._pc_verify_btn {
  transition: transform .15s, box-shadow .15s !important;
}
._pc_verify_btn:active {
  transform: scale(.94) !important;
}
._pc_verify_yes:hover {
  box-shadow: 0 0 12px rgba(39,174,96,.5) !important;
}

/* ── Stars particle ── */
._pc_star {
  position: fixed; pointer-events: none; z-index: 7600;
  font-size: 16px; will-change: transform, opacity;
}
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  // HTML INJECT
  // ═══════════════════════════════════════════════════════════

  function injectHTML() {
    if (document.getElementById('_pc_verify_glow')) return;
    document.body.insertAdjacentHTML('beforeend', `
<div id="_pc_verify_glow">
  <div class="_pc_vg_box">
    <div class="_pc_vg_from">💌 Pesan dari Ayah/Ibu</div>
    <span class="_pc_vg_em" id="_pc_vg_em">🤗</span>
    <div class="_pc_vg_habit" id="_pc_vg_habit">Kebiasaan diverifikasi!</div>
    <div class="_pc_vg_msg"  id="_pc_vg_msg">Pesan cinta</div>
    <div class="_pc_vg_from2">— Ayah/Ibu —</div>
    <button class="_pc_vg_btn" onclick="PC.closeVerifyGlow()">
      Terima Kasih, Ayah/Ibu! 💚
    </button>
  </div>
</div>
    `);
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  // ── Pesan Cinta di beranda siswa ─────────────────────────
  function renderLoveBanner() {
    const old = document.getElementById('_pc_love_banner');
    if (old) old.remove();

    if (typeof CU === 'undefined' || !CU || typeof CRole === 'undefined' || CRole !== 'anak') return;

    // Tampilkan jika ada verifikasi hari ini
    const verified = CU.verifiedToday || {};
    const verifiedCount = Object.values(verified).filter(v => v === 'yes').length;
    if (verifiedCount === 0) return;

    // Cek sudah ditampilkan hari ini
    const key = `_pc_love_${CU.id}_${new Date().toISOString().slice(0,10)}`;
    if (sessionStorage.getItem(key) === 'all') return;

    // Pilih pesan berdasarkan kondisi
    const d = done();
    const msgPool = d === 7 ? PARENT_MESSAGES.perfect : PARENT_MESSAGES.approved;
    const msg = msgPool[Math.floor(Math.random() * msgPool.length)];

    const el = document.createElement('div');
    el.id = '_pc_love_banner';
    el.innerHTML = `
      <span class="_pc_lb_heart">${msg.em}</span>
      <div class="_pc_lb_body">
        <div class="_pc_lb_from">💌 Pesan dari Ayah/Ibu</div>
        <div class="_pc_lb_msg">${msg.msg}</div>
      </div>
      <span class="_pc_lb_close" onclick="this.closest('#_pc_love_banner').classList.remove('show')">✕</span>
    `;

    // Sisipkan di awal beranda
    const greet = document.getElementById('hero-greeting');
    if (greet && greet.parentElement) {
      greet.parentElement.insertBefore(el, greet);
      requestAnimationFrame(() => el.classList.add('show'));
    }

    // Sound + haptic
    if (typeof HA !== 'undefined') setTimeout(() => HA.play('badge'), 300);
    if (navigator.vibrate) navigator.vibrate([30, 15, 30, 15, 50]);
  }

  // ── Bangga Meter di beranda siswa ────────────────────────
  function renderBanggaMeter() {
    const old = document.getElementById('_pc_bangga');
    if (old) old.remove();

    if (typeof CU === 'undefined' || !CU || typeof CRole === 'undefined' || CRole !== 'anak') return;

    const score = getBanggaScore();
    const label = getBanggaLabel(score);

    const el = document.createElement('div');
    el.id = '_pc_bangga';
    el.innerHTML = `
      <div class="_pc_bg_head">
        <div class="_pc_bg_label">${label.em} Kebanggaan Orang Tua</div>
        <div class="_pc_bg_val" style="color:${label.color}">${label.text}</div>
      </div>
      <div class="_pc_bg_bar">
        <div class="_pc_bg_fill" id="_pc_bg_fill"
          style="background:linear-gradient(90deg,${label.color}88,${label.color})">
        </div>
      </div>
      <div class="_pc_bg_note">
        Semakin banyak kebiasaan baik → semakin besar kebanggaan mereka
      </div>
    `;

    const habitsList = document.getElementById('habits-list');
    if (habitsList && habitsList.parentElement) {
      habitsList.parentElement.insertBefore(el, habitsList);
      // Animasi bar
      setTimeout(() => {
        const fill = document.getElementById('_pc_bg_fill');
        if (fill) fill.style.width = score + '%';
      }, 300);
    }
  }

  // ── Tampilkan glow verifikasi ke siswa ───────────────────
  function showVerifyGlow(habitName, habitIcon) {
    const msg = PARENT_MESSAGES.approved[
      Math.floor(Math.random() * PARENT_MESSAGES.approved.length)];

    document.getElementById('_pc_vg_em').textContent    = msg.em;
    document.getElementById('_pc_vg_habit').textContent = `${habitIcon} ${habitName} — Diverifikasi! ✅`;
    document.getElementById('_pc_vg_msg').textContent   = msg.msg;

    document.getElementById('_pc_verify_glow').classList.add('show');

    // Stars burst
    spawnStars();

    // Sound
    if (typeof HA !== 'undefined') setTimeout(() => HA.play('levelup'), 200);
    if (navigator.vibrate) navigator.vibrate([30, 15, 30, 15, 60]);
  }

  function spawnStars() {
    const emojis = ['⭐','🌟','✨','💚','💛','🤗'];
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const star = document.createElement('div');
        star.className = '_pc_star';
        star.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        star.style.left = (20 + Math.random() * 60) + '%';
        star.style.top  = (10 + Math.random() * 60) + '%';
        document.body.appendChild(star);
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(star,
            { opacity: 0, scale: 0, y: 0 },
            { opacity: 1, scale: 1.3, y: -60 - Math.random() * 40,
              duration: .5, ease: 'back.out(2)',
              onComplete: () => gsap.to(star, {
                opacity: 0, y: '-=20', duration: .3,
                onComplete: () => star.remove()
              }) });
        } else {
          setTimeout(() => star.remove(), 1000);
        }
      }, i * 80);
    }
  }

  // ── Ringkasan Malam di halaman ortu ──────────────────────
  function renderEveningSummary() {
    const old = document.getElementById('_pc_evening_summary');
    if (old) old.remove();

    const data = getEveningSummary();
    if (!data) return;

    // Hanya tampilkan sore/malam hari
    const h = new Date().getHours();
    const showSummary = h >= 16;

    // Cari container halaman ortu
    const ortuNote = document.getElementById('ortu-note');
    if (!ortuNote || !ortuNote.parentElement) return;

    const el = document.createElement('div');
    el.id = '_pc_evening_summary';
    el.className = '_pc_summary';

    const timeLabel = h >= 16 ? '🌆 Ringkasan Sore Hari' : '📊 Laporan Hari Ini';

    let highlightsHTML = '';
    if (data.highlights.length > 0) {
      highlightsHTML = `
        <div class="_pc_sum_high">
          ${data.highlights.map(h => `<div class="_pc_sum_item">${h}</div>`).join('')}
        </div>`;
    }

    el.innerHTML = `
      <div class="_pc_sum_head">
        <span>${timeLabel}</span>
      </div>
      <div class="_pc_sum_item">
        📋 <strong>${data.d}/7</strong> kebiasaan selesai hari ini
      </div>
      <div class="_pc_sum_item">
        🔥 Streak: <strong>${data.streak} hari</strong> berturut-turut
      </div>
      <div class="_pc_sum_item">
        📅 Total: <strong>${data.total} hari</strong> bersama HeroKu
      </div>
      ${highlightsHTML}
      <div class="_pc_sum_sug">
        <div class="_pc_sum_label">💡 Saran untuk malam ini</div>
        ${data.suggestions}
      </div>
    `;

    ortuNote.parentElement.insertBefore(el, ortuNote.nextSibling);
  }

  // ── Upgrade tampilan tombol verifikasi ortu ──────────────
  function enhanceVerifyButtons() {
    // Tambahkan class animasi ke tombol yang sudah ada
    document.querySelectorAll('[onclick*="verifyHabit"]').forEach(btn => {
      btn.classList.add('_pc_verify_btn');
      if (btn.textContent.includes('Ya')) {
        btn.classList.add('_pc_verify_yes');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════
  const PC = {};

  PC.showVerifyGlow = showVerifyGlow;
  PC.renderLoveBanner    = renderLoveBanner;
  PC.renderBanggaMeter   = renderBanggaMeter;
  PC.renderEveningSummary = renderEveningSummary;

  PC.closeVerifyGlow = function () {
    const el = document.getElementById('_pc_verify_glow');
    if (!el) return;
    if (typeof gsap !== 'undefined') {
      const box = el.querySelector('._pc_vg_box');
      if (box) {
        gsap.to(box, { scale: .88, opacity: 0, y: 16, duration: .22, ease: 'power2.in',
          onComplete: () => {
            el.classList.remove('show');
            gsap.set(box, { scale: 1, opacity: 1, y: 0 });
          } });
      }
    } else {
      el.classList.remove('show');
    }
    // Update banner cinta
    setTimeout(renderLoveBanner, 300);
    setTimeout(renderBanggaMeter, 400);
  };

  W.PC = PC;

  // ═══════════════════════════════════════════════════════════
  // INTEGRASI
  // ═══════════════════════════════════════════════════════════
  function integrate() {

    // ── Patch verifyHabit — inject glow setelah verifikasi ──
    if (typeof W.verifyHabit === 'function') {
      const _orig = W.verifyHabit;
      W.verifyHabit = function (habitId, verdict) {
        _orig.call(this, habitId, verdict);

        if (verdict === 'yes') {
          // Tampilkan di sisi ortu: konfirmasi sukses
          setTimeout(() => {
            if (typeof showToast === 'function') {
              showToast('💚 Verifikasi terkirim! Anakmu akan merasa bangga!');
            }
          }, 500);

          // Simpan info verifikasi untuk ditampilkan ke siswa
          const hb = typeof HABITS !== 'undefined'
            ? HABITS.find(h => h.id === habitId)
            : null;
          if (hb && typeof CU !== 'undefined' && CU) {
            const key = `_pc_new_verify_${CU.id}`;
            try {
              const existing = JSON.parse(sessionStorage.getItem(key) || '[]');
              existing.push({ habitId, habitName: hb.name, habitIcon: hb.icon, time: Date.now() });
              sessionStorage.setItem(key, JSON.stringify(existing));
            } catch(e) {}
          }
        }

        // Render ulang ringkasan
        setTimeout(renderEveningSummary, 300);
        setTimeout(enhanceVerifyButtons, 400);
      };
    }

    // ── Patch renderOrtu — tambahkan ringkasan & enhance ────
    if (typeof W.renderOrtu === 'function') {
      const _orig = W.renderOrtu;
      W.renderOrtu = function () {
        _orig.call(this);
        setTimeout(() => {
          renderEveningSummary();
          enhanceVerifyButtons();
        }, 200);
      };
    }

    // ── Saat siswa buka beranda — cek verifikasi baru ───────
    if (typeof W.HeroKuEvents !== 'undefined') {
      W.HeroKuEvents.on('pageSwitch', function (e) {
        const page = e.detail?.page;

        if (page === 'beranda') {
          setTimeout(() => {
            renderLoveBanner();
            renderBanggaMeter();

            // Cek verifikasi baru dari ortu
            if (typeof CU !== 'undefined' && CU) {
              const key = `_pc_new_verify_${CU.id}`;
              try {
                const newVerify = JSON.parse(sessionStorage.getItem(key) || '[]');
                if (newVerify.length > 0) {
                  const latest = newVerify[newVerify.length - 1];
                  setTimeout(() => {
                    showVerifyGlow(latest.habitName, latest.habitIcon);
                  }, 800);
                  // Hapus setelah ditampilkan
                  sessionStorage.removeItem(key);
                }
              } catch(e) {}
            }
          }, 400);
        }

        if (page === 'ortu') {
          setTimeout(() => {
            renderEveningSummary();
            enhanceVerifyButtons();
          }, 300);
        }
      });

      // ── Setelah perfect day — siapkan pesan khusus ──────
      W.HeroKuEvents.on('perfectday', function () {
        if (typeof CU === 'undefined' || !CU) return;
        // Simpan flag perfect day untuk pesan ortu spesial
        const key = `_pc_perfect_${CU.id}_${new Date().toISOString().slice(0,10)}`;
        sessionStorage.setItem(key, '1');
      });
    }

    // ── Hook realtime: saat ortu verifikasi → siswa langsung dapat glow ──
    // Ini bekerja via enableRealtimeSync yang sudah aktif di app-fixes.js
    if (typeof W.HeroKuEvents !== 'undefined') {
      document.addEventListener('heroku:realtimeUpdate', function (e) {
        const updated = e.detail?.updated;
        if (!updated || typeof CU === 'undefined' || !CU) return;
        if (updated.id !== CU.id) return;

        // Ada verifikasi baru
        const oldVerified = Object.keys(CU.verifiedToday || {}).length;
        const newVerified = Object.keys(updated.verifiedToday || {}).length;
        if (newVerified > oldVerified) {
          // Temukan habit yang baru diverifikasi
          const newHabitId = Object.keys(updated.verifiedToday || {})
            .find(id => updated.verifiedToday[id] === 'yes' &&
              !(CU.verifiedToday || {})[id]);
          if (newHabitId) {
            const hb = typeof HABITS !== 'undefined'
              ? HABITS.find(h => h.id === newHabitId)
              : null;
            if (hb) {
              setTimeout(() => showVerifyGlow(hb.name, hb.icon), 500);
            }
          }
        }
      });
    }

    console.log('[PC] Parent Connect siap ✅ — verifikasi jadi momen emosional!');
  }

  function boot() {
    injectCSS();
    injectHTML();

    let tries = 0;
    const wait = setInterval(() => {
      if ((typeof W.HeroKuEvents !== 'undefined' && typeof W.verifyHabit === 'function') || tries > 80) {
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
