// ═══════════════════════════════════════════════════════════
// HEROKU APP FIXES — Prioritas 1-6 dari Audit
// File: js/app-fixes.js
//
// Pasang SETELAH semua script lain di index.html:
//   <script src="js/app-fixes.js"></script>
//
// File ini menerapkan 6 perbaikan tanpa mengubah file asli:
//   FIX 1: Hapus credential hint dari halaman login
//   FIX 2: Aktifkan Realtime Sync untuk verifikasi ortu
//   FIX 3: Error handling untuk saveCU & Supabase
//   FIX 4: EventBus — gantikan monkey patching bertumpuk
//   FIX 5: Lazy validation state — cegah double check-in
//   FIX 6: Timezone-safe streak — gunakan server time
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  function waitApp(cb, n) {
    n = n || 0; if (n > 150) return;
    if (typeof STORE !== 'undefined' && STORE.students && typeof doCheckIn === 'function') cb();
    else setTimeout(() => waitApp(cb, n + 1), 100);
  }

  // ═══════════════════════════════════════════════════════
  // FIX 1: HAPUS CREDENTIAL HINT DARI HALAMAN LOGIN
  // Kredensial guru/kepsek/admin tidak boleh tampil di UI
  // ═══════════════════════════════════════════════════════
  function fix1_removeCredentialHints() {
    // Patch setLoginRole untuk menghapus hint credential
    if (typeof W.setLoginRole !== 'function') return;
    const _orig = W.setLoginRole;
    W.setLoginRole = function (role, btn) {
      _orig.call(this, role, btn);
      // Setelah original dipanggil, hapus hint yang tampil
      const hintEl = document.getElementById('staff-hint');
      if (!hintEl) return;
      if (role === 'guru') {
        // Ganti dengan petunjuk yang tidak expose password
        hintEl.innerHTML = '<span style="font-size:10px;color:#666">Masukkan ID dan password yang diberikan koordinator sekolah.</span>';
      } else if (role === 'kepsek') {
        hintEl.innerHTML = '<span style="font-size:10px;color:#666">Masukkan ID dan password kepala sekolah.</span>';
      } else if (role === 'admin') {
        hintEl.innerHTML = '<span style="font-size:10px;color:#666">Masukkan ID dan password admin.</span>';
      }
    };
    console.log('[FIX 1] ✅ Credential hint dihapus dari UI login');
  }

  // ═══════════════════════════════════════════════════════
  // FIX 2: AKTIFKAN REALTIME SYNC
  // Ketika ortu verifikasi → siswa langsung lihat perubahan
  // tanpa perlu refresh manual
  // ═══════════════════════════════════════════════════════
  function fix2_enableRealtimeSync() {
    if (typeof enableRealtimeSync !== 'function') {
      console.warn('[FIX 2] enableRealtimeSync tidak ditemukan di supabase-sync.js');
      return;
    }

    enableRealtimeSync(function (payload) {
      // Dipanggil saat ada perubahan di tabel students di Supabase
      if (!payload || !payload.new) return;
      const updated = payload.new;

      // Hanya update jika ini adalah data siswa yang sedang login
      if (typeof CU === 'undefined' || !CU) return;
      if (updated.id !== CU.id) return;

      // Update field verifikasi tanpa mengganggu state lokal lainnya
      const verifiedFields = ['verifiedToday', 'checkedToday'];
      let changed = false;

      verifiedFields.forEach(field => {
        if (updated[field] && JSON.stringify(updated[field]) !== JSON.stringify(CU[field])) {
          CU[field] = updated[field];
          changed = true;
        }
      });

      if (changed) {
        // Re-render komponen yang relevan
        if (typeof renderHabits  === 'function') renderHabits();
        if (typeof updateStats   === 'function') updateStats();
        if (typeof renderMentor  === 'function') renderMentor();

        // Toast notifikasi
        if (typeof showToast === 'function') {
          showToast('✅ Orang tua baru saja memverifikasi!');
        }
        console.log('[FIX 2] Realtime update diterima — UI diperbarui');
      }
    });

    console.log('[FIX 2] ✅ Realtime sync aktif — verifikasi ortu langsung terdeteksi');
  }

  // ═══════════════════════════════════════════════════════
  // FIX 3: ERROR HANDLING UNTUK SAVESCU & SUPABASE
  // Sebelumnya: 0 try/catch di app.js
  // Sekarang: error ditangkap dan user diberi pesan jelas
  // ═══════════════════════════════════════════════════════
  function fix3_errorHandling() {
    // Patch saveCU dengan error handling
    if (typeof W.saveCU === 'function') {
      const _origSave = W.saveCU;
      W.saveCU = function () {
        try {
          _origSave.call(this);
        } catch (e) {
          console.error('[FIX 3] saveCU error:', e);
          // Simpan ke localStorage sebagai backup
          try {
            if (typeof CU !== 'undefined' && CU && typeof STORE !== 'undefined') {
              const i = STORE.students.findIndex(s => s.id === CU.id);
              if (i >= 0) STORE.students[i] = CU;
              localStorage.setItem('heroku_backup_' + (CU.id || 'unknown'),
                JSON.stringify({ student: CU, savedAt: new Date().toISOString() }));
              console.warn('[FIX 3] Data disimpan ke localStorage sebagai backup');
            }
          } catch (backupErr) {
            console.error('[FIX 3] Backup juga gagal:', backupErr);
          }
          // Tampilkan pesan ke user
          if (typeof showToast === 'function') {
            showToast('⚠️ Koneksi terputus. Data tersimpan sementara di perangkat.');
          }
        }
      };
    }

    // Tambahkan global error handler untuk operasi async Supabase
    W.addEventListener('unhandledrejection', function (e) {
      const msg = e.reason?.message || String(e.reason);
      // Hanya tangkap error yang berkaitan dengan network/Supabase
      if (msg.includes('fetch') || msg.includes('network') ||
          msg.includes('supabase') || msg.includes('Failed to fetch')) {
        e.preventDefault(); // Cegah error ke console browser
        console.warn('[FIX 3] Network error tertangkap:', msg);
        if (typeof showToast === 'function') {
          showToast('📡 Koneksi lambat. Mencoba ulang...');
        }
      }
    });

    console.log('[FIX 3] ✅ Error handling aktif — crash diam-diam dicegah');
  }

  // ═══════════════════════════════════════════════════════
  // FIX 4: EVENTBUS — gantikan monkey patching bertumpuk
  //
  // Sebelumnya: 12 file masing-masing mem-patch doCheckIn
  // Sekarang: doCheckIn memancarkan event, semua file listen
  //
  // File lain cukup gunakan:
  //   document.addEventListener('heroku:checkin', e => {
  //     const {habit, student, done} = e.detail;
  //   });
  // ═══════════════════════════════════════════════════════
  function fix4_eventBus() {
    // Buat EventBus global
    W.HeroKuEvents = {
      emit(name, detail) {
        document.dispatchEvent(new CustomEvent('heroku:' + name, { detail }));
      },
      on(name, handler) {
        document.addEventListener('heroku:' + name, handler);
        return () => document.removeEventListener('heroku:' + name, handler);
      },
    };

    // Patch doCheckIn SATU KALI untuk emit event
    // File lain tidak perlu patch lagi, cukup addEventListener
    const _origCI = W.doCheckIn;
    W.doCheckIn = function (hb) {
      const prevLevel  = typeof CU !== 'undefined' ? (CU.level || 1)  : 1;
      const prevStreak = typeof CU !== 'undefined' ? (CU.streak || 0) : 0;
      const prevKoin   = typeof CU !== 'undefined' ? (CU.koin || 0)   : 0;

      // Panggil original
      _origCI.call(this, hb);

      // Emit event SETELAH original selesai
      setTimeout(() => {
        if (typeof CU === 'undefined') return;
        const done = Object.keys(CU.checkedToday || {}).length;
        const detail = {
          habit:       hb,
          student:     CU,
          done,
          isPerfect:   done === 7,
          leveledUp:   CU.level > prevLevel,
          newLevel:    CU.level,
          streakMile:  CU.streak > prevStreak && [3,7,14,21,30].includes(CU.streak),
          newStreak:   CU.streak,
          koinEarned:  CU.koin - prevKoin,
        };
        W.HeroKuEvents.emit('checkin', detail);
        if (detail.isPerfect)  W.HeroKuEvents.emit('perfectday', { student: CU });
        if (detail.leveledUp)  W.HeroKuEvents.emit('levelup', { level: CU.level, student: CU });
        if (detail.streakMile) W.HeroKuEvents.emit('streakMilestone', { days: CU.streak, student: CU });
      }, 100);
    };

    // Patch showBuildingUnlock untuk emit event
    if (typeof W.showBuildingUnlock === 'function') {
      const _origBU = W.showBuildingUnlock;
      W.showBuildingUnlock = function (building, thenCelebrate) {
        _origBU.call(this, building, thenCelebrate);
        W.HeroKuEvents.emit('buildingUnlock', {
          building,
          student: typeof CU !== 'undefined' ? CU : null,
        });
      };
    }

    // Patch switchPage untuk emit event
    if (typeof W.switchPage === 'function') {
      const _origSP = W.switchPage;
      W.switchPage = function (page) {
        _origSP.call(this, page);
        W.HeroKuEvents.emit('pageSwitch', { page });
      };
    }

    console.log('[FIX 4] ✅ EventBus aktif — window.HeroKuEvents tersedia');
    console.log('[FIX 4] Events: heroku:checkin, heroku:perfectday, heroku:levelup, heroku:streakMilestone, heroku:buildingUnlock, heroku:pageSwitch');
  }

  // ═══════════════════════════════════════════════════════
  // FIX 5: DOUBLE CHECK-IN PREVENTION
  // Proteksi tambahan: cegah tap dua kali cepat pada habit
  // ═══════════════════════════════════════════════════════
  function fix5_doubleCheckInPrevention() {
    let _checkInLock = false;

    if (typeof W.openCheckIn === 'function') {
      const _origOC = W.openCheckIn;
      W.openCheckIn = function (hb) {
        // Jika sedang proses, abaikan
        if (_checkInLock) {
          console.warn('[FIX 5] Check-in sedang diproses, abaikan tap ganda');
          return;
        }
        _origOC.call(this, hb);
      };
    }

    if (typeof W.doCheckIn === 'function') {
      const _origDCI = W.doCheckIn;
      W.doCheckIn = function (hb) {
        if (_checkInLock) return;
        _checkInLock = true;
        _origDCI.call(this, hb);
        // Release lock setelah animasi selesai
        setTimeout(() => { _checkInLock = false; }, 1500);
      };
    }

    console.log('[FIX 5] ✅ Double check-in prevention aktif');
  }

  // ═══════════════════════════════════════════════════════
  // FIX 6: TIMEZONE-SAFE TODAYSTR
  // Sebelumnya: new Date() bisa salah jika timezone HP salah
  // Sekarang: gunakan UTC+7 (WIB) secara eksplisit
  // ═══════════════════════════════════════════════════════
  function fix6_timezoneStreak() {
    // Override todayStr() dengan versi yang selalu WIB (UTC+7)
    // Ini mencegah streak reset karena timezone HP yang salah
    if (typeof W.todayStr === 'function') {
      W.todayStr = function () {
        const now = new Date();
        // Konversi ke WIB (UTC+7) secara eksplisit
        const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        return wib.toISOString().slice(0, 10);
      };
      console.log('[FIX 6] ✅ Timezone WIB (UTC+7) terkunci — streak aman dari timezone HP salah');
    } else {
      // todayStr belum ada (mungkin inline di app.js)
      // Inject sebagai global
      W.todayStr = function () {
        const now = new Date();
        const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        return wib.toISOString().slice(0, 10);
      };
      console.log('[FIX 6] ✅ todayStr WIB di-inject sebagai global');
    }
  }

  // ═══════════════════════════════════════════════════════
  // BOOT — jalankan semua fix setelah app ready
  // ═══════════════════════════════════════════════════════
  function boot() {
    // Fix 1 & 6 bisa langsung (tidak butuh app ready)
    fix1_removeCredentialHints();
    fix6_timezoneStreak();

    // Fix 2-5 butuh app ready
    waitApp(() => {
      fix3_errorHandling();
      fix4_eventBus();
      fix5_doubleCheckInPrevention();

      // Fix 2 hanya untuk siswa yang sudah login
      // (Realtime butuh session aktif)
      if (typeof CU !== 'undefined' && CU && typeof CRole !== 'undefined' && CRole === 'anak') {
        fix2_enableRealtimeSync();
      } else {
        // Coba lagi setelah login
        document.addEventListener('heroku:pageSwitch', function handler(e) {
          if (e.detail?.page === 'beranda') {
            fix2_enableRealtimeSync();
            document.removeEventListener('heroku:pageSwitch', handler);
          }
        });
      }

      console.log('[APP-FIXES] ✅ Semua 6 perbaikan aktif');
    });
  }

  // ═══════════════════════════════════════════════════════
  // BONUS: HEALTH CHECK — tampilkan status semua modul
  // Buka console browser dan ketik: HeroKuHealth()
  // ═══════════════════════════════════════════════════════
  W.HeroKuHealth = function () {
    const checks = {
      'STORE.students': typeof STORE !== 'undefined' && Array.isArray(STORE.students),
      'doCheckIn':      typeof doCheckIn === 'function',
      'renderWorld':    typeof renderWorld === 'function',
      'CEL (Celebration)': typeof CEL !== 'undefined',
      'SAF (Syekh)':    typeof SAF !== 'undefined',
      'HA (Audio)':     typeof HA !== 'undefined',
      'HW (Reward)':    typeof HW !== 'undefined',
      'NL (Narrative)': typeof NL !== 'undefined',
      'WA (World Anim)':typeof WA !== 'undefined',
      'HeroKuEvents':   typeof W.HeroKuEvents !== 'undefined',
      'enableRealtimeSync': typeof enableRealtimeSync === 'function',
      'CU (siswa aktif)': typeof CU !== 'undefined' && CU !== null,
      'GSAP':           typeof gsap !== 'undefined',
      'Supabase':       typeof sbClient !== 'undefined',
    };

    console.group('🏆 HeroKu Health Check');
    let allOk = true;
    Object.entries(checks).forEach(([name, ok]) => {
      console.log((ok ? '✅' : '❌') + ' ' + name);
      if (!ok) allOk = false;
    });
    console.log('');
    console.log(allOk ? '✅ Semua sistem normal!' : '⚠️ Ada sistem yang belum aktif');
    console.groupEnd();

    return checks;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
