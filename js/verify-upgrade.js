// ═══════════════════════════════════════════════════════════
// HEROKU VERIFY UPGRADE v1.0
// Peningkatan sistem verifikasi orang tua
//
// File: js/verify-upgrade.js
// Pasang setelah weekly-ritual.js:
//   <script src="js/verify-upgrade.js"></script>
//
// Yang berubah dari sistem lama:
//   LAMA: 3 kebiasaan perlu verifikasi, reward sama
//   BARU: Semua 7 kebiasaan bisa diverifikasi ortu
//         Self-verify  → reward normal (100%)
//         Parent-verify → reward +30% bonus koin
//         Verifikasi Semua → 1 tap, semua pending selesai
//         Auto-approve → 48 jam jika ortu belum buka
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─── Konstanta ───────────────────────────────────────────
  const BONUS_PCT      = 0.30;  // 30% bonus koin
  const AUTO_APPROVE_H = 48;    // auto-approve setelah 48 jam

  // ─── Utils ───────────────────────────────────────────────
  function nick() {
    if (typeof CU === 'undefined' || !CU) return 'Adik';
    return CU.nickname || (CU.name || '').split(' ')[0] || 'Adik';
  }
  function ts() { return Date.now(); }

  // ─── Pesan ortu setelah verifikasi semua ─────────────────
  const VERIFY_ALL_MSGS = [
    'MasyaAllah! Semua kebiasaan {name} hari ini sudah Anda saksikan. Terima kasih telah hadir dalam pertumbuhannya!',
    'Alhamdulillah! Anda baru saja memberikan hadiah terbesar untuk {name} — perhatian dan kepercayaan Anda.',
    'Subhanallah! {name} pasti merasakan kebanggaan Anda. Verifikasi ini bukan formalitas — ini cinta yang nyata!',
    'Barakallahu fiikum! Keterlibatan Anda hari ini adalah investasi terbaik untuk masa depan {name}.',
  ];

  // ═══════════════════════════════════════════════════════════
  // CORE LOGIC
  // ═══════════════════════════════════════════════════════════

  // Hitung bonus koin 30%
  function bonusKoin(baseKoin) {
    return Math.round(baseKoin * BONUS_PCT);
  }

  // Cek apakah suatu check-in sudah melewati 48 jam
  function shouldAutoApprove(habitId) {
    if (typeof CU === 'undefined' || !CU) return false;
    const checkedAt = (CU.checkedTodayAt || {})[habitId];
    if (!checkedAt) return false;
    const hoursAgo = (ts() - checkedAt) / (1000 * 60 * 60);
    return hoursAgo >= AUTO_APPROVE_H;
  }

  // Jalankan auto-approve untuk semua yang sudah 48 jam
  function runAutoApprove() {
    if (typeof CU === 'undefined' || !CU) return;
    const checked  = CU.checkedToday   || {};
    const verified = CU.verifiedToday  || {};
    const checkedAt= CU.checkedTodayAt || {};
    let changed    = false;

    Object.keys(checked).forEach(habitId => {
      if (verified[habitId]) return; // sudah diverifikasi
      const checkedTime = checkedAt[habitId];
      if (!checkedTime) return;
      const hoursAgo = (ts() - checkedTime) / (1000 * 60 * 60);
      if (hoursAgo >= AUTO_APPROVE_H) {
        if (!CU.verifiedToday) CU.verifiedToday = {};
        CU.verifiedToday[habitId] = 'auto';
        changed = true;
      }
    });

    if (changed) {
      if (typeof saveCU === 'function') saveCU();
      console.log('[VU] Auto-approve dijalankan untuk kebiasaan > 48 jam');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PATCH verifyHabit — tambahkan bonus 30%
  // ═══════════════════════════════════════════════════════════
  function patchVerifyHabit() {
    if (typeof W.verifyHabit !== 'function') return;

    const _orig = W.verifyHabit;
    W.verifyHabit = function (habitId, verdict) {

      // Jalankan original dulu
      _orig.call(this, habitId, verdict);

      // Tambahkan bonus 30% jika disetujui ortu
      if (verdict === 'yes') {
        if (typeof CU === 'undefined' || !CU) return;
        const hb = typeof HABITS !== 'undefined'
          ? HABITS.find(h => h.id === habitId)
          : null;
        if (!hb) return;

        const bonus = bonusKoin(hb.koin);
        CU.koin += bonus;

        if (typeof saveCU       === 'function') saveCU();
        if (typeof updateStats  === 'function') updateStats();
        if (typeof renderOrtu   === 'function') renderOrtu();

        // Toast bonus
        setTimeout(() => {
          if (typeof showToast === 'function') {
            showToast(`💚 +${bonus} Koin Bonus Verifikasi Ortu! (${hb.icon} ${hb.name})`);
          }
        }, 600);

        // Simpan ke sessionStorage untuk ditampilkan ke siswa
        _storeVerifyForChild(habitId, hb.name, hb.icon, bonus);
      }
    };
  }

  // Simpan info verifikasi untuk ditampilkan ke siswa
  function _storeVerifyForChild(habitId, habitName, habitIcon, bonus) {
    if (typeof CU === 'undefined' || !CU) return;
    const key = `_vu_verify_${CU.id}`;
    try {
      const arr = JSON.parse(sessionStorage.getItem(key) || '[]');
      arr.push({ habitId, habitName, habitIcon, bonus, time: ts() });
      sessionStorage.setItem(key, JSON.stringify(arr));
    } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════
  // VERIFIKASI SEMUA — fungsi baru
  // ═══════════════════════════════════════════════════════════
  W.verifyAllHabits = function () {
    if (typeof CU === 'undefined' || !CU) return;

    const checked  = CU.checkedToday  || {};
    const verified = CU.verifiedToday || {};

    // Ambil semua yang sudah dicentang tapi belum diverifikasi
    const pending = Object.keys(checked).filter(id => !verified[id]);
    if (pending.length === 0) {
      if (typeof showToast === 'function') {
        showToast('✅ Semua kebiasaan sudah diverifikasi!');
      }
      return;
    }

    let totalBonus = 0;
    if (!CU.verifiedToday) CU.verifiedToday = {};

    pending.forEach(habitId => {
      CU.verifiedToday[habitId] = 'yes';
      const hb = typeof HABITS !== 'undefined'
        ? HABITS.find(h => h.id === habitId)
        : null;
      if (hb) {
        const bonus = bonusKoin(hb.koin);
        CU.koin   += bonus;
        totalBonus += bonus;
        _storeVerifyForChild(habitId, hb.name, hb.icon, bonus);
      }
    });

    if (typeof saveCU       === 'function') saveCU();
    if (typeof updateStats  === 'function') updateStats();
    if (typeof renderOrtu   === 'function') renderOrtu();

    // Animasi konfeti kecil
    if (typeof CEL !== 'undefined') {
      setTimeout(() => {
        const msg = (VERIFY_ALL_MSGS[
          Math.floor(Math.random() * VERIFY_ALL_MSGS.length)
        ]).replace('{name}', nick());

        CEL.mission({
          name:  `✅ ${pending.length} Kebiasaan Diverifikasi!`,
          emoji: '💚',
          koin:  totalBonus,
          xp:    0,
        });

        // Tampilkan pesan khusus
        setTimeout(() => {
          if (typeof showToast === 'function') {
            showToast(`💚 +${totalBonus} Koin Bonus! ${msg.slice(0, 40)}...`);
          }
        }, 1000);
      }, 300);
    } else {
      if (typeof showToast === 'function') {
        showToast(`💚 ${pending.length} kebiasaan diverifikasi! +${totalBonus} Koin Bonus!`);
      }
    }

    // Sound + haptic
    if (typeof HA !== 'undefined') setTimeout(() => HA.play('celebrate'), 200);
    if (navigator.vibrate) navigator.vibrate([30, 15, 30, 15, 60, 15, 30]);
  };

  // ═══════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════
  function injectCSS() {
    if (document.getElementById('_vu_css')) return;
    const s = document.createElement('style');
    s.id = '_vu_css';
    s.textContent = `

/* ── Tombol Verifikasi Semua ── */
#_vu_verify_all_btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  font-family: inherit;
  background: linear-gradient(135deg, #27AE60, #1A7A42);
  color: #fff;
  box-shadow: 0 5px 18px rgba(39,174,96,.35);
  transition: transform .15s, box-shadow .15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
}
#_vu_verify_all_btn:active { transform: scale(.97); }
#_vu_verify_all_btn:disabled {
  background: rgba(255,255,255,.08);
  box-shadow: none;
  cursor: not-allowed;
  opacity: .5;
}
#_vu_verify_all_btn::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);
  transform: translateX(-100%);
  animation: _vuShine 2.5s ease-in-out 1s infinite;
}
@keyframes _vuShine {
  0%  { transform: translateX(-100%); }
  40% { transform: translateX(200%); }
  100%{ transform: translateX(200%); }
}

/* ── Bonus badge di setiap habit ── */
._vu_bonus_badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(39,174,96,.15);
  border: 1px solid rgba(39,174,96,.3);
  border-radius: 10px;
  padding: 2px 7px;
  font-size: 9px;
  font-weight: 800;
  color: #27AE60;
  margin-left: 5px;
}

/* ── Status pending / verified per habit ── */
._vu_status {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}
._vu_status.pending  {
  background: rgba(241,196,15,.12);
  color: #D4A017;
  border: 1px solid rgba(241,196,15,.3);
}
._vu_status.verified {
  background: rgba(39,174,96,.12);
  color: #27AE60;
  border: 1px solid rgba(39,174,96,.3);
}
._vu_status.auto {
  background: rgba(149,165,166,.1);
  color: #7F8C8D;
  border: 1px solid rgba(149,165,166,.2);
}
._vu_status.rejected {
  background: rgba(231,76,60,.1);
  color: #E74C3C;
  border: 1px solid rgba(231,76,60,.25);
}

/* ── Header verifikasi yang diupgrade ── */
#_vu_verify_header {
  background: #FFF8E7;
  border-radius: 13px;
  padding: 12px 14px;
  margin-bottom: 11px;
  border-left: 4px solid #F39C12;
}
._vu_vh_title {
  font-size: 12px;
  font-weight: 800;
  color: #856404;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
._vu_vh_count {
  font-size: 10px;
  font-weight: 700;
  background: rgba(241,196,15,.2);
  color: #856404;
  padding: 2px 8px;
  border-radius: 10px;
}
._vu_vh_note {
  font-size: 11px;
  color: #6D4C0F;
  line-height: 1.6;
  margin-bottom: 10px;
}

/* ── Bonus info box ── */
._vu_bonus_info {
  background: rgba(39,174,96,.08);
  border: 1px solid rgba(39,174,96,.2);
  border-radius: 10px;
  padding: 8px 11px;
  font-size: 10px;
  color: rgba(39,174,96,.9);
  font-weight: 700;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Habit item di list verifikasi ── */
._vu_habit_item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 0;
  border-bottom: 1px solid rgba(133,100,4,.1);
}
._vu_habit_item:last-child { border-bottom: none; }
._vu_hi_icon { font-size: 20px; flex-shrink: 0; }
._vu_hi_body { flex: 1; min-width: 0; }
._vu_hi_name { font-size: 12px; font-weight: 700; color: #1A1A2E; margin-bottom: 2px; }
._vu_hi_sub  { font-size: 10px; color: #856404; }
._vu_hi_acts { display: flex; gap: 5px; align-items: center; flex-shrink: 0; }

/* ── Tombol Ya / Tidak yang lebih besar ── */
._vu_btn_yes {
  padding: 6px 12px;
  background: #27AE60;
  border: none; border-radius: 9px;
  color: white; font-size: 11px;
  font-weight: 800; cursor: pointer;
  font-family: inherit;
  transition: transform .12s, box-shadow .12s;
  box-shadow: 0 2px 8px rgba(39,174,96,.3);
}
._vu_btn_yes:active { transform: scale(.93); }

._vu_btn_no {
  padding: 6px 12px;
  background: #E74C3C;
  border: none; border-radius: 9px;
  color: white; font-size: 11px;
  font-weight: 800; cursor: pointer;
  font-family: inherit;
  transition: transform .12s;
}
._vu_btn_no:active { transform: scale(.93); }

/* ── Auto-approve countdown ── */
._vu_auto_note {
  font-size: 9px;
  color: #999;
  text-align: center;
  margin-top: 6px;
  font-style: italic;
}
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER — gantikan panel verifikasi di halaman ortu
  // ═══════════════════════════════════════════════════════════
  function renderVerifyPanel() {
    if (typeof CU === 'undefined' || !CU) return;

    const checked   = CU.checkedToday  || {};
    const verified  = CU.verifiedToday || {};
    const checkedAt = CU.checkedTodayAt|| {};
    const HABITS_DATA = typeof HABITS !== 'undefined' ? HABITS : [];

    // Semua yang sudah dicentang siswa
    const allChecked  = HABITS_DATA.filter(hb => checked[hb.id]);
    const pending     = allChecked.filter(hb => !verified[hb.id]);
    const verifiedYes = allChecked.filter(hb => verified[hb.id] === 'yes');
    const verifiedAuto= allChecked.filter(hb => verified[hb.id] === 'auto');
    const rejected    = allChecked.filter(hb => verified[hb.id] === 'no');

    // Cari container yang tepat
    const container = document.getElementById('ortu-verify-note')?.closest('div[style*="background:#FFF8E7"]')
      || document.getElementById('ortu-unverified-list')?.parentElement?.parentElement;
    if (!container) return;

    // Hapus panel lama, inject yang baru
    const oldPanel = document.getElementById('_vu_verify_header');
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement('div');
    panel.id = '_vu_verify_header';

    // ── Header ──────────────────────────────────────────────
    panel.innerHTML = `
      <div class="_vu_vh_title">
        <span>✅ Verifikasi Kebiasaan Hari Ini</span>
        <span class="_vu_vh_count">${verifiedYes.length + verifiedAuto.length}/${allChecked.length} selesai</span>
      </div>
      <div class="_vu_vh_note" id="_vu_note">
        ${pending.length > 0
          ? `${pending.length} kebiasaan menunggu konfirmasi Anda.`
          : allChecked.length === 0
          ? `${nick()} belum memulai hari ini.`
          : 'Semua kebiasaan sudah dikonfirmasi. Terima kasih! 💚'}
      </div>
    `;

    // ── Bonus info ───────────────────────────────────────────
    if (pending.length > 0) {
      panel.innerHTML += `
        <div class="_vu_bonus_info">
          💚 Verifikasi Anda memberikan +30% bonus koin untuk ${nick()}!
        </div>
      `;
    }

    // ── Tombol Verifikasi Semua ──────────────────────────────
    if (pending.length > 0) {
      panel.innerHTML += `
        <button id="_vu_verify_all_btn" onclick="verifyAllHabits()">
          <span>💚</span>
          <span>Verifikasi Semua (${pending.length})</span>
          <span style="font-size:11px;opacity:.7">+${_calcTotalBonus(pending)} Koin Bonus</span>
        </button>
      `;
    }

    // ── List Pending ─────────────────────────────────────────
    if (pending.length > 0) {
      const pendingEl = document.createElement('div');
      pendingEl.style.marginBottom = '8px';

      pending.forEach(hb => {
        const checkedTime = checkedAt[hb.id];
        const hoursLeft   = checkedTime
          ? Math.max(0, AUTO_APPROVE_H - (ts() - checkedTime) / (1000 * 60 * 60))
          : AUTO_APPROVE_H;
        const bonus = bonusKoin(hb.koin);

        const item = document.createElement('div');
        item.className = '_vu_habit_item';
        item.innerHTML = `
          <span class="_vu_hi_icon">${hb.icon}</span>
          <div class="_vu_hi_body">
            <div class="_vu_hi_name">
              ${hb.name}
              <span class="_vu_bonus_badge">+${bonus} Koin Bonus</span>
            </div>
            <div class="_vu_hi_sub">Apakah benar-benar dilakukan?</div>
          </div>
          <div class="_vu_hi_acts">
            <button class="_vu_btn_yes" onclick="verifyHabit('${hb.id}','yes')">✓ Ya</button>
            <button class="_vu_btn_no"  onclick="verifyHabit('${hb.id}','no')">✗ Tidak</button>
          </div>
        `;
        pendingEl.appendChild(item);
      });

      // Auto-approve note
      if (allChecked.length > 0) {
        const noteEl = document.createElement('div');
        noteEl.className = '_vu_auto_note';
        noteEl.textContent = `⏱ Otomatis disetujui dalam ${AUTO_APPROVE_H} jam jika belum dikonfirmasi`;
        pendingEl.appendChild(noteEl);
      }

      panel.appendChild(pendingEl);
    }

    // ── List Sudah Diverifikasi ──────────────────────────────
    const doneItems = [...verifiedYes, ...verifiedAuto, ...rejected];
    if (doneItems.length > 0) {
      const doneEl = document.createElement('div');
      doneEl.style.borderTop = '1px solid rgba(133,100,4,.1)';
      doneEl.style.paddingTop = '8px';
      doneEl.style.marginTop = '4px';

      doneItems.forEach(hb => {
        const status = verified[hb.id];
        const statusConfig = {
          yes:    { cls: 'verified', text: '✓ Diverifikasi',          bonus: `+${bonusKoin(hb.koin)} Koin` },
          auto:   { cls: 'auto',    text: '⏱ Auto-disetujui',         bonus: '' },
          no:     { cls: 'rejected',text: '✗ Perlu diulang',          bonus: '' },
        }[status] || { cls: 'pending', text: 'Pending', bonus: '' };

        const item = document.createElement('div');
        item.className = '_vu_habit_item';
        item.style.opacity = '.75';
        item.innerHTML = `
          <span class="_vu_hi_icon">${hb.icon}</span>
          <div class="_vu_hi_body">
            <div class="_vu_hi_name">${hb.name}</div>
          </div>
          <div class="_vu_hi_acts">
            <span class="_vu_status ${statusConfig.cls}">${statusConfig.text}</span>
            ${statusConfig.bonus ? `<span style="font-size:9px;color:#27AE60;font-weight:700">${statusConfig.bonus}</span>` : ''}
          </div>
        `;
        doneEl.appendChild(item);
      });

      panel.appendChild(doneEl);
    }

    // ── Tidak ada yang dicentang ─────────────────────────────
    if (allChecked.length === 0) {
      panel.innerHTML += `
        <div style="text-align:center;padding:14px;font-size:11px;
          color:#856404;line-height:1.7">
          📋 ${nick()} belum mencentang kebiasaan hari ini.<br>
          <strong>Ingatkan dengan lembut dan penuh kasih sayang.</strong>
        </div>
      `;
    }

    // Gantikan panel lama
    const oldFFF = document.querySelector('#page-ortu div[style*="background:#FFF8E7"]');
    if (oldFFF) {
      oldFFF.style.display = 'none'; // sembunyikan panel lama
    }

    // Sisipkan setelah stats grid
    const statsGrid = document.querySelector('#page-ortu .stats-grid2, #page-ortu [style*="grid-template-columns:1fr 1fr 1fr"]');
    if (statsGrid && statsGrid.parentElement) {
      statsGrid.parentElement.insertBefore(panel, statsGrid.nextSibling);
    } else {
      // Fallback: tambahkan di atas ortu-note
      const ortuNote = document.querySelector('.ai-box');
      if (ortuNote && ortuNote.parentElement) {
        ortuNote.parentElement.insertBefore(panel, ortuNote);
      }
    }
  }

  // Helper hitung total bonus
  function _calcTotalBonus(habits) {
    return habits.reduce((sum, hb) => sum + bonusKoin(hb.koin), 0);
  }

  // ═══════════════════════════════════════════════════════════
  // PATCH doCheckIn — simpan timestamp check-in
  // Dibutuhkan untuk auto-approve 48 jam
  // ═══════════════════════════════════════════════════════════
  function patchCheckIn() {
    if (typeof W.doCheckIn !== 'function') return;
    const _orig = W.doCheckIn;
    W.doCheckIn = function (hb) {
      _orig.call(this, hb);
      // Simpan timestamp check-in per habit
      if (typeof CU !== 'undefined' && CU) {
        if (!CU.checkedTodayAt) CU.checkedTodayAt = {};
        CU.checkedTodayAt[hb.id] = ts();
        if (typeof saveCU === 'function') saveCU();
      }
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PATCH renderOrtu — inject panel baru
  // ═══════════════════════════════════════════════════════════
  function patchRenderOrtu() {
    if (typeof W.renderOrtu !== 'function') return;
    const _orig = W.renderOrtu;
    W.renderOrtu = function () {
      _orig.call(this);
      setTimeout(renderVerifyPanel, 100);
    };
  }

  // ═══════════════════════════════════════════════════════════
  // NOTIFIKASI KE SISWA saat buka beranda
  // ═══════════════════════════════════════════════════════════
  function checkParentVerifyNotif() {
    if (typeof CU === 'undefined' || !CU || typeof CRole === 'undefined') return;
    if (CRole !== 'anak') return;

    const key = `_vu_verify_${CU.id}`;
    try {
      const items = JSON.parse(sessionStorage.getItem(key) || '[]');
      if (!items.length) return;

      // Ambil yang paling baru
      const latest = items[items.length - 1];
      const totalBonus = items.reduce((s, i) => s + (i.bonus || 0), 0);

      // Tampilkan pesan cinta + bonus
      setTimeout(() => {
        if (typeof CEL !== 'undefined' && items.length > 1) {
          // Banyak verifikasi sekaligus (Verifikasi Semua)
          CEL.mission({
            name:  `${items.length} Kebiasaan Diverifikasi Ortu! 💚`,
            emoji: '🤗',
            koin:  totalBonus,
            xp:    0,
          });
        } else if (typeof showToast === 'function') {
          showToast(`💚 Ortu memverifikasi ${latest.habitIcon} ${latest.habitName}! +${latest.bonus} Koin Bonus!`);
        }

        // Hapus setelah ditampilkan
        sessionStorage.removeItem(key);
      }, 1000);
    } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════
  // AUTO-APPROVE SCHEDULER
  // ═══════════════════════════════════════════════════════════
  function scheduleAutoApprove() {
    // Jalankan sekali saat boot
    runAutoApprove();
    // Jalankan setiap 30 menit
    setInterval(runAutoApprove, 30 * 60 * 1000);
  }

  // ═══════════════════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════════════════
  function integrate() {
    patchVerifyHabit();
    patchCheckIn();
    patchRenderOrtu();
    scheduleAutoApprove();

    // Hook ke EventBus
    if (typeof W.HeroKuEvents !== 'undefined') {
      W.HeroKuEvents.on('pageSwitch', function (e) {
        const page = e.detail?.page;
        if (page === 'ortu') {
          setTimeout(renderVerifyPanel, 300);
        }
        if (page === 'beranda') {
          setTimeout(checkParentVerifyNotif, 800);
        }
      });
    }

    console.log('[VU] Verify Upgrade siap ✅ — semua kebiasaan bisa diverifikasi ortu!');
    console.log(`[VU] Bonus: +${Math.round(BONUS_PCT * 100)}% koin | Auto-approve: ${AUTO_APPROVE_H} jam`);
  }

  function boot() {
    injectCSS();

    let tries = 0;
    const wait = setInterval(() => {
      if ((typeof W.verifyHabit === 'function' && typeof W.renderOrtu === 'function') || tries > 80) {
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
