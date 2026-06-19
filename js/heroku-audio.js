// ═══════════════════════════════════════════════════════════
// HEROKU AUDIO SYSTEM v1.0
// Sistem audio ringan berbasis Web Audio API
// Tidak butuh file mp3/wav — semua suara dibuat secara programatik
//
// Cara pakai di index.html:
//   Tambah sebelum </body>:
//   <script src="js/heroku-audio.js"></script>
//
// API Publik:
//   HA.play('checklist')   — centang kebiasaan berhasil
//   HA.play('coin')        — dapat koin
//   HA.play('badge')       — badge baru terbuka
//   HA.play('levelup')     — naik level
//   HA.play('purchase')    — beli item di garasi
//   HA.play('celebrate')   — hari sempurna / 7/7
//   HA.toggle()            — nyala/mati audio
//   HA.setVolume(0.8)      — atur volume 0.0 - 1.0
//   HA.isMuted()           — cek status mute
// ═══════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── STORAGE KEY ─────────────────────────────────────────
  var STORAGE_KEY = 'heroku_audio_prefs';

  // ── LOAD PREFERENSI DARI LOCALSTORAGE ───────────────────
  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { muted: false, volume: 0.7 };
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        muted: _prefs.muted,
        volume: _prefs.volume
      }));
    } catch (e) {}
  }

  var _prefs = loadPrefs();

  // ── AUDIO CONTEXT (lazy init) ────────────────────────────
  // Dibuat saat pertama kali user berinteraksi (wajib untuk browser policy)
  var _ctx = null;
  var _masterGain = null;

  function getCtx() {
    if (_ctx) return _ctx;
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      _masterGain = _ctx.createGain();
      _masterGain.gain.value = _prefs.muted ? 0 : _prefs.volume;
      _masterGain.connect(_ctx.destination);
    } catch (e) {
      console.warn('[HA] Web Audio API tidak tersedia:', e.message);
    }
    return _ctx;
  }

  function resumeCtx() {
    var ctx = getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── HELPER: Buat dan hubungkan oscillator ────────────────
  function makeOsc(ctx, type, freq) {
    var osc = ctx.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.value = freq || 440;
    return osc;
  }

  function makeGain(ctx, value) {
    var g = ctx.createGain();
    g.gain.value = value || 0;
    g.connect(_masterGain);
    return g;
  }

  // ── HELPER: Envelope sederhana ───────────────────────────
  // attack: waktu naik, sustain: waktu bertahan, release: waktu turun
  function envelope(gainNode, ctx, peak, attack, sustain, release, startTime) {
    var t = startTime || ctx.currentTime;
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(peak, t + attack);
    gainNode.gain.setValueAtTime(peak, t + attack + sustain);
    gainNode.gain.linearRampToValueAtTime(0, t + attack + sustain + release);
    return t + attack + sustain + release;
  }

  // ── FILTER ──────────────────────────────────────────────
  function makeFilter(ctx, type, freq, q) {
    var f = ctx.createBiquadFilter();
    f.type = type || 'lowpass';
    f.frequency.value = freq || 1000;
    if (q) f.Q.value = q;
    return f;
  }

  // ═══════════════════════════════════════════════════════════
  // DESAIN SUARA
  // Setiap fungsi adalah "instrumen" yang berbeda.
  // Prinsip: pendek (< 1.5 detik), jelas, menyenangkan untuk anak.
  // ═══════════════════════════════════════════════════════════

  var SOUNDS = {

    // ── 1. CHECKLIST SUCCESS ─────────────────────────────────
    // Karakter: ringan, naik, ceria — seperti "ting!" kecil
    // Teori: dua nada naik (interval perfect 5th) = rasa "selesai"
    checklist: function (ctx, t) {
      var notes = [523, 784]; // C5 → G5
      notes.forEach(function (freq, i) {
        var osc = makeOsc(ctx, 'sine', freq);
        var g = makeGain(ctx, 0);
        osc.connect(g);
        var start = t + i * 0.12;
        envelope(g, ctx, 0.25, 0.01, 0.05, 0.12, start);
        osc.start(start);
        osc.stop(start + 0.3);
      });

      // Tambah shimmer kecil (overtone)
      var shimmer = makeOsc(ctx, 'sine', 1568); // G6
      var sg = makeGain(ctx, 0);
      shimmer.connect(sg);
      envelope(sg, ctx, 0.06, 0.01, 0.02, 0.15, t + 0.18);
      shimmer.start(t + 0.18);
      shimmer.stop(t + 0.5);
    },

    // ── 2. COIN SOUND ────────────────────────────────────────
    // Karakter: metalik, mengkilap, berulang cepat
    // Teori: sine wave frekuensi tinggi dengan decay cepat = logam
    coin: function (ctx, t) {
      var freqs = [1047, 1319, 1568]; // C6, E6, G6 — mayor triad
      freqs.forEach(function (freq, i) {
        var osc = makeOsc(ctx, 'sine', freq);
        var g = makeGain(ctx, 0);

        // Tambah sedikit distorsi metalik via wave shaper
        osc.connect(g);

        var start = t + i * 0.065;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.22, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.start(start);
        osc.stop(start + 0.25);
      });

      // Efek "koin jatuh" — noise singkat
      var bufSize = ctx.sampleRate * 0.04;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.03;
      }
      var noise = ctx.createBufferSource();
      noise.buffer = buf;
      var nf = makeFilter(ctx, 'highpass', 4000);
      var ng = makeGain(ctx, 0);
      noise.connect(nf);
      nf.connect(ng);
      envelope(ng, ctx, 0.08, 0.001, 0.01, 0.03, t + 0.19);
      noise.start(t + 0.19);
    },

    // ── 3. BADGE UNLOCK ──────────────────────────────────────
    // Karakter: megah, naik bertahap, ada "fanfare" mini
    // Teori: arpeggio mayor naik = pencapaian, kebanggaan
    badge: function (ctx, t) {
      var melody = [
        { freq: 392, dur: 0.08 },  // G4
        { freq: 494, dur: 0.08 },  // B4
        { freq: 587, dur: 0.08 },  // D5
        { freq: 784, dur: 0.25 },  // G5 — nada puncak, lebih lama
      ];

      melody.forEach(function (note, i) {
        var osc = makeOsc(ctx, 'triangle', note.freq);
        var g = makeGain(ctx, 0);
        osc.connect(g);
        var start = t + i * 0.1;
        envelope(g, ctx, 0.2, 0.01, note.dur, 0.08, start);
        osc.start(start);
        osc.stop(start + note.dur + 0.15);
      });

      // Harmoni (nada ketiga bawah)
      var harmony = [
        { freq: 311, start: 0.3 },  // Eb4
        { freq: 587, start: 0.3 },  // D5
      ];
      harmony.forEach(function (h) {
        var osc = makeOsc(ctx, 'sine', h.freq);
        var g = makeGain(ctx, 0);
        osc.connect(g);
        envelope(g, ctx, 0.1, 0.02, 0.15, 0.12, t + h.start);
        osc.start(t + h.start);
        osc.stop(t + h.start + 0.35);
      });

      // "Shimmer" di akhir
      var shine = makeOsc(ctx, 'sine', 1568);
      var sg = makeGain(ctx, 0);
      shine.connect(sg);
      envelope(sg, ctx, 0.08, 0.01, 0.1, 0.2, t + 0.42);
      shine.start(t + 0.42);
      shine.stop(t + 0.85);
    },

    // ── 4. LEVEL UP ──────────────────────────────────────────
    // Karakter: dramatis, naik oktaf, penuh semangat
    // Teori: tangga nada pentatonik naik = heroik, epic
    levelup: function (ctx, t) {
      // Melodi utama — arpeggio pentatonik naik
      var melody = [
        { freq: 523,  type: 'sine',     peak: 0.2, start: 0.0,  dur: 0.08, rel: 0.1 },
        { freq: 659,  type: 'sine',     peak: 0.2, start: 0.12, dur: 0.08, rel: 0.1 },
        { freq: 784,  type: 'sine',     peak: 0.2, start: 0.24, dur: 0.08, rel: 0.1 },
        { freq: 988,  type: 'sine',     peak: 0.22,start: 0.36, dur: 0.08, rel: 0.1 },
        { freq: 1047, type: 'triangle', peak: 0.28,start: 0.48, dur: 0.3,  rel: 0.25 },
      ];

      melody.forEach(function (n) {
        var osc = makeOsc(ctx, n.type, n.freq);
        var g = makeGain(ctx, 0);
        osc.connect(g);
        envelope(g, ctx, n.peak, 0.01, n.dur, n.rel, t + n.start);
        osc.start(t + n.start);
        osc.stop(t + n.start + n.dur + n.rel + 0.05);
      });

      // Bass hit di awal — memberikan "berat"
      var bass = makeOsc(ctx, 'sine', 130);
      var bg = makeGain(ctx, 0);
      bass.connect(bg);
      envelope(bg, ctx, 0.3, 0.005, 0.02, 0.15, t);
      bass.start(t);
      bass.stop(t + 0.25);

      // Chord penutup — C major
      [[523,659,784]].forEach(function (chord) {
        chord.forEach(function (freq) {
          var osc = makeOsc(ctx, 'sine', freq);
          var g = makeGain(ctx, 0);
          osc.connect(g);
          envelope(g, ctx, 0.1, 0.02, 0.2, 0.3, t + 0.7);
          osc.start(t + 0.7);
          osc.stop(t + 1.3);
        });
      });
    },

    // ── 5. PURCHASE SOUND ────────────────────────────────────
    // Karakter: positif, cepat, "klik" yang memuaskan
    // Teori: dua nada — konfirmasi + reward kecil
    purchase: function (ctx, t) {
      // "Klik" konfirmasi
      var click = makeOsc(ctx, 'square', 440);
      var cg = makeGain(ctx, 0);
      click.connect(cg);
      envelope(cg, ctx, 0.08, 0.001, 0.02, 0.04, t);
      click.start(t);
      click.stop(t + 0.08);

      // Nada sukses
      var notes = [659, 880]; // E5 → A5
      notes.forEach(function (freq, i) {
        var osc = makeOsc(ctx, 'sine', freq);
        var g = makeGain(ctx, 0);
        osc.connect(g);
        var start = t + 0.06 + i * 0.1;
        envelope(g, ctx, 0.18, 0.01, 0.06, 0.1, start);
        osc.start(start);
        osc.stop(start + 0.22);
      });

      // Woosh kecil (noise filtered = angin lembut)
      var bufSize = ctx.sampleRate * 0.15;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
      var ns = ctx.createBufferSource();
      ns.buffer = buf;
      var nf = makeFilter(ctx, 'bandpass', 1200, 2);
      var ng = makeGain(ctx, 0);
      ns.connect(nf); nf.connect(ng);
      envelope(ng, ctx, 0.06, 0.01, 0.05, 0.08, t + 0.05);
      ns.start(t + 0.05);
    },

    // ── 6. CELEBRATION (7/7 sempurna) ────────────────────────
    // Karakter: meriah, panjang, penuh kegembiraan
    // Teori: fanfare + arpeggio + chord penutup = perayaan total
    celebrate: function (ctx, t) {
      // Fanfare intro — 4 nada cepat naik
      var fanfare = [523, 659, 784, 1047];
      fanfare.forEach(function (freq, i) {
        var osc = makeOsc(ctx, 'triangle', freq);
        var g = makeGain(ctx, 0);
        osc.connect(g);
        var start = t + i * 0.08;
        envelope(g, ctx, 0.22, 0.01, 0.05, 0.06, start);
        osc.start(start);
        osc.stop(start + 0.18);
      });

      // Arpeggio ceria setelah fanfare
      var arp = [784, 988, 1175, 1319, 1568];
      arp.forEach(function (freq, i) {
        var osc = makeOsc(ctx, 'sine', freq);
        var g = makeGain(ctx, 0);
        osc.connect(g);
        var start = t + 0.38 + i * 0.09;
        envelope(g, ctx, 0.18, 0.01, 0.05, 0.08, start);
        osc.start(start);
        osc.stop(start + 0.2);
      });

      // Bass groove — fondasi ritmis
      var bassNotes = [
        { freq: 196, start: 0,    dur: 0.12 },
        { freq: 196, start: 0.35, dur: 0.12 },
        { freq: 196, start: 0.82, dur: 0.2  },
      ];
      bassNotes.forEach(function (bn) {
        var osc = makeOsc(ctx, 'sine', bn.freq);
        var g = makeGain(ctx, 0);
        osc.connect(g);
        envelope(g, ctx, 0.25, 0.005, bn.dur, 0.1, t + bn.start);
        osc.start(t + bn.start);
        osc.stop(t + bn.start + bn.dur + 0.15);
      });

      // Chord penutup megah — G Major
      [[392, 494, 588, 784]].forEach(function (chord) {
        chord.forEach(function (freq) {
          var osc = makeOsc(ctx, 'sine', freq);
          var g = makeGain(ctx, 0);
          osc.connect(g);
          envelope(g, ctx, 0.12, 0.02, 0.3, 0.35, t + 1.05);
          osc.start(t + 1.05);
          osc.stop(t + 1.85);
        });
      });

      // Shimmer akhir
      var shimmer = makeOsc(ctx, 'sine', 2093);
      var sg = makeGain(ctx, 0);
      shimmer.connect(sg);
      envelope(sg, ctx, 0.06, 0.01, 0.15, 0.4, t + 1.1);
      shimmer.start(t + 1.1);
      shimmer.stop(t + 1.8);
    },

  };

  // ═══════════════════════════════════════════════════════════
  // TOGGLE BUTTON — tombol on/off yang muncul di UI
  // ═══════════════════════════════════════════════════════════

  function createToggleBtn() {
    if (document.getElementById('ha-toggle-btn')) return;

    var btn = document.createElement('button');
    btn.id = 'ha-toggle-btn';
    btn.setAttribute('aria-label', 'Nyala/mati suara');
    btn.title = 'Nyala/mati suara';

    // Style inline supaya tidak tergantung file CSS tambahan
    btn.style.cssText = [
      'position:fixed',
      'bottom:70px',
      'right:14px',
      'z-index:9990',
      'width:40px',
      'height:40px',
      'border-radius:50%',
      'border:none',
      'background:rgba(26,26,46,0.85)',
      'color:#fff',
      'font-size:18px',
      'cursor:pointer',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'box-shadow:0 2px 10px rgba(0,0,0,0.3)',
      'transition:transform 0.15s, background 0.2s',
      'backdrop-filter:blur(6px)',
      '-webkit-backdrop-filter:blur(6px)',
    ].join(';');

    function updateIcon() {
      btn.textContent = _prefs.muted ? '🔇' : '🔊';
      btn.style.background = _prefs.muted
        ? 'rgba(231,76,60,0.85)'
        : 'rgba(26,26,46,0.85)';
    }

    btn.addEventListener('click', function () {
      HA.toggle();
      updateIcon();
      // Animasi kecil saat diklik
      btn.style.transform = 'scale(0.85)';
      setTimeout(function () { btn.style.transform = 'scale(1)'; }, 150);
      // Preview suara saat dinyalakan
      if (!_prefs.muted) HA.play('checklist');
    });

    // Touch feedback untuk mobile
    btn.addEventListener('touchstart', function () {
      btn.style.transform = 'scale(0.85)';
    }, { passive: true });
    btn.addEventListener('touchend', function () {
      btn.style.transform = 'scale(1)';
    }, { passive: true });

    updateIcon();
    document.body.appendChild(btn);
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════

  var HA = {};

  // Daftar nama valid → nama fungsi internal
  var SOUND_MAP = {
    'checklist': 'checklist',
    'check':     'checklist',
    'coin':      'coin',
    'koin':      'coin',
    'badge':     'badge',
    'levelup':   'levelup',
    'level':     'levelup',
    'purchase':  'purchase',
    'beli':      'purchase',
    'celebrate': 'celebrate',
    'celebration':'celebrate',
    'perfect':   'celebrate',
  };

  // Mainkan suara
  HA.play = function (name) {
    if (_prefs.muted) return;
    var key = SOUND_MAP[name] || name;
    var soundFn = SOUNDS[key];
    if (!soundFn) {
      console.warn('[HA] Suara tidak dikenal:', name);
      return;
    }
    var ctx = resumeCtx();
    if (!ctx) return;
    try {
      soundFn(ctx, ctx.currentTime + 0.01);
    } catch (e) {
      console.error('[HA] Error saat play:', name, e);
    }
  };

  // Toggle mute
  HA.toggle = function () {
    _prefs.muted = !_prefs.muted;
    if (_masterGain) {
      _masterGain.gain.value = _prefs.muted ? 0 : _prefs.volume;
    }
    savePrefs();
    return !_prefs.muted; // return true jika sekarang ON
  };

  // Set mute langsung
  HA.mute = function () {
    _prefs.muted = true;
    if (_masterGain) _masterGain.gain.value = 0;
    savePrefs();
  };

  HA.unmute = function () {
    _prefs.muted = false;
    if (_masterGain) _masterGain.gain.value = _prefs.volume;
    savePrefs();
  };

  // Cek status
  HA.isMuted = function () { return _prefs.muted; };

  // Atur volume (0.0 - 1.0)
  HA.setVolume = function (v) {
    _prefs.volume = Math.max(0, Math.min(1, v));
    if (_masterGain && !_prefs.muted) {
      _masterGain.gain.value = _prefs.volume;
    }
    savePrefs();
  };

  HA.getVolume = function () { return _prefs.volume; };

  // Daftar suara yang tersedia
  HA.list = function () { return Object.keys(SOUNDS); };

  // Export
  global.HA = HA;

  // ═══════════════════════════════════════════════════════════
  // INIT: Pasang toggle button + aktifkan audio saat user touch pertama
  // ═══════════════════════════════════════════════════════════

  function init() {
    createToggleBtn();

    // Resume AudioContext saat user pertama kali menyentuh layar
    // (wajib untuk mobile browser)
    function firstTouch() {
      getCtx();
      resumeCtx();
      document.removeEventListener('touchstart', firstTouch);
      document.removeEventListener('click', firstTouch);
    }
    document.addEventListener('touchstart', firstTouch, { passive: true, once: true });
    document.addEventListener('click', firstTouch, { once: true });

    console.log('[HA] Audio System siap. Suara:', HA.list().join(', '));
  }

  // Tunggu DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══════════════════════════════════════════════════════════
  // INTEGRASI OTOMATIS KE HEROKU
  // Patch fungsi-fungsi utama di app.js tanpa ubah file lama
  // ═══════════════════════════════════════════════════════════

  function waitApp(cb, n) {
    n = n || 0;
    if (n > 100) return;
    if (typeof doCheckIn === 'function' && typeof STORE !== 'undefined') {
      cb();
    } else {
      setTimeout(function () { waitApp(cb, n + 1); }, 100);
    }
  }

  waitApp(function () {

    // Patch doCheckIn — centang kebiasaan
    var _origCheck = window.doCheckIn;
    window.doCheckIn = function (hb) {
      var prevLevel = typeof CU !== 'undefined' && CU ? CU.level : 0;
      _origCheck.call(this, hb);
      HA.play('checklist');
      setTimeout(function () { HA.play('coin'); }, 220);
      // Level up?
      if (typeof CU !== 'undefined' && CU && CU.level > prevLevel) {
        setTimeout(function () { HA.play('levelup'); }, 500);
      }
    };

    // Patch showCelebration — hari sempurna
    if (typeof window.showCelebration === 'function') {
      var _origCel = window.showCelebration;
      window.showCelebration = function () {
        _origCel.call(this);
        setTimeout(function () { HA.play('celebrate'); }, 300);
      };
    }

    // Patch showBuildingUnlock — bangunan baru
    if (typeof window.showBuildingUnlock === 'function') {
      var _origBuild = window.showBuildingUnlock;
      window.showBuildingUnlock = function (building, thenCelebrate) {
        _origBuild.call(this, building, thenCelebrate);
        HA.play('badge');
      };
    }

    // Patch showCardReveal — kartu koleksi
    if (typeof window.showCardReveal === 'function') {
      var _origCard = window.showCardReveal;
      window.showCardReveal = function () {
        _origCard.call(this);
        setTimeout(function () { HA.play('badge'); }, 200);
      };
    }

    // Patch buySticker, buyUpgrade, setColor — beli di garasi
    ['buySticker', 'buyUpgrade'].forEach(function (fnName) {
      if (typeof window[fnName] === 'function') {
        var _orig = window[fnName];
        window[fnName] = function () {
          var result = _orig.apply(this, arguments);
          HA.play('purchase');
          return result;
        };
      }
    });

    // Patch setCarColor
    if (typeof window.setCarColor === 'function') {
      var _origColor = window.setCarColor;
      window.setCarColor = function () {
        _origColor.apply(this, arguments);
        HA.play('purchase');
      };
    }

    // Patch answerQuiz — jawaban kuis benar
    if (typeof window.answerQuiz === 'function') {
      var _origQuiz = window.answerQuiz;
      window.answerQuiz = function (idx, btn) {
        var prevCorrect = typeof CU !== 'undefined' && CU ? CU.quizCorrect : 0;
        _origQuiz.call(this, idx, btn);
        var isCorrect = typeof CU !== 'undefined' && CU && CU.quizCorrect > prevCorrect;
        if (isCorrect) {
          setTimeout(function () { HA.play('coin'); }, 100);
        }
      };
    }

    console.log('[HA] Integrasi HeroKu selesai ✅');
  });

})(window);
