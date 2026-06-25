// ═══════════════════════════════════════════════════════════
// HEROKU VOICE GUIDE v1.0
// Panduan suara otomatis untuk kelompok usia 6-7 tahun (young)
//
// File: js/voice-guide.js
// Pasang di index.html setelah age-theme.js:
//   <script src="js/voice-guide.js"></script>
//
// Fitur:
//   - Tombol speaker 🔊 di setiap card misi
//   - Membacakan nama + instruksi misi saat diklik
//   - Sapaan otomatis saat login (setelah gesture pertama)
//   - Membacakan pesan Syekh Al-Fath
//   - Bahasa Indonesia, suara natural
//   - Hanya aktif untuk theme-young (6-7 tahun)
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ── Teks suara per habit ─────────────────────────────────
  const HABIT_VOICE = {
    pagi:     'Bangun pagi! Ayo bangun sebelum jam setengah enam. Tubuhmu akan segar dan siap beraktivitas!',
    ibadah:   'Ibadah! Yuk sholat lima waktu dan baca Al Quran. Allah sayang anak yang rajin ibadah!',
    olahraga: 'Olahraga! Ayo gerakkan badanmu minimal lima belas menit. Lompat, lari, atau main bola!',
    makan:    'Makan sehat! Jangan lupa makan sayur dan buah hari ini. Biar tubuhmu kuat dan sehat!',
    belajar:  'Gemar belajar! Buka bukumu dan belajar tiga puluh menit. Kamu pasti bisa!',
    sosial:   'Bermasyarakat! Lakukan satu kebaikan untuk orang lain hari ini. Senyum juga kebaikan!',
    tidur:    'Tidur cepat! Tidurlah sebelum jam sembilan malam supaya badanmu istirahat dengan baik.',
  };

  const GREET_VOICE = [
    'Halo! Selamat datang di HeroKu! Yuk selesaikan misi kebaikanmu hari ini!',
    'Assalamu alaikum! Semangat ya! Hari ini kamu bisa jadi pahlawan kebaikan!',
    'Halo! Bismillah, ayo mulai misi hari ini! Kamu pasti bisa!',
  ];

  const DONE_VOICE = [
    'Hebat! Kamu berhasil! Satu bintang untukmu!',
    'Wah, keren sekali! Terus semangat ya!',
    'Alhamdulillah! Kamu luar biasa!',
    'Yes! Misi selesai! Kamu makin hebat!',
  ];

  // ── State ─────────────────────────────────────────────────
  let _gestured   = false; // browser butuh gesture sebelum autoplay
  let _speaking   = false;
  let _synth      = null;

  // ── Cek apakah young theme aktif ─────────────────────────
  function isYoung() {
    return document.body.classList.contains('theme-young');
  }

  // ── Init Web Speech API ───────────────────────────────────
  function initSynth() {
    if (_synth) return true;
    if (!W.speechSynthesis) {
      console.warn('[VG] Web Speech API tidak didukung browser ini.');
      return false;
    }
    _synth = W.speechSynthesis;
    return true;
  }

  // ── Speak ─────────────────────────────────────────────────
  function speak(text, onEnd) {
    if (!initSynth()) return;
    if (!_gestured) {
      // Simpan untuk diputar setelah gesture
      _pendingText = text;
      _pendingEnd  = onEnd;
      showTapPrompt();
      return;
    }

    // Stop suara sebelumnya
    _synth.cancel();
    _speaking = true;

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = 'id-ID';
    utt.rate  = 0.88;   // sedikit lebih lambat untuk anak kecil
    utt.pitch = 1.15;   // nada sedikit lebih tinggi, ramah anak
    utt.volume = 1;

    // Pilih suara bahasa Indonesia jika tersedia
    const voices = _synth.getVoices();
    const idVoice = voices.find(v => v.lang.startsWith('id')) ||
                    voices.find(v => v.lang.startsWith('ms'));
    if (idVoice) utt.voice = idVoice;

    utt.onend = () => {
      _speaking = false;
      if (typeof onEnd === 'function') onEnd();
    };
    utt.onerror = () => { _speaking = false; };

    _synth.speak(utt);
  }

  let _pendingText = null;
  let _pendingEnd  = null;

  // ── Tap to enable prompt ──────────────────────────────────
  function showTapPrompt() {
    if (document.getElementById('_vg_prompt')) return;
    const el = document.createElement('div');
    el.id = '_vg_prompt';
    el.innerHTML = `
      <div style="
        position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
        background:linear-gradient(135deg,#FF6B35,#FF9A3C);
        color:#fff;border-radius:20px;padding:10px 20px;
        font-family:var(--font-round,Arial,sans-serif);
        font-size:13px;font-weight:900;
        box-shadow:0 4px 12px rgba(255,107,53,0.4);
        z-index:9999;cursor:pointer;text-align:center;
        animation:_vg_bounce .6s ease infinite alternate;
      ">
        🔊 Ketuk di sini untuk aktifkan suara!
      </div>
      <style>
        @keyframes _vg_bounce{from{transform:translateX(-50%) translateY(0)}to{transform:translateX(-50%) translateY(-4px)}}
      </style>`;
    el.onclick = () => {
      _gestured = true;
      el.remove();
      if (_pendingText) {
        speak(_pendingText, _pendingEnd);
        _pendingText = null;
        _pendingEnd  = null;
      }
    };
    document.body.appendChild(el);
  }

  // ── Inject speaker button ke setiap habit card ───────────
  function injectSpeakerButtons() {
    if (!isYoung()) return;
    const cards = document.querySelectorAll('.habit-card');
    cards.forEach(card => {
      if (card.querySelector('._vg_speak_btn')) return;

      // Ambil habit ID dari onclick atau data
      const habitId = getHabitIdFromCard(card);
      if (!habitId) return;

      const btn = document.createElement('button');
      btn.className = '_vg_speak_btn';
      btn.innerHTML = '🔊';
      btn.title     = 'Dengarkan misi ini';
      btn.style.cssText = [
        'position:absolute','top:10px','right:56px',
        'width:36px','height:36px',
        'border-radius:50%','border:none',
        'background:rgba(255,255,255,0.9)',
        'font-size:18px','cursor:pointer',
        'display:flex','align-items:center','justify-content:center',
        'box-shadow:0 2px 6px rgba(0,0,0,0.15)',
        'transition:transform .15s',
        'z-index:2',
      ].join(';');

      btn.onclick = (e) => {
        e.stopPropagation(); // jangan trigger check-in
        const text = HABIT_VOICE[habitId] || `Misi ${habitId}`;
        speak(text);
        // Visual feedback
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => { btn.style.transform = ''; }, 300);
      };

      // Card harus relative untuk posisi absolute button
      card.style.position = 'relative';
      card.appendChild(btn);
    });
  }

  function getHabitIdFromCard(card) {
    // Coba ambil dari onclick attribute
    const onclickStr = card.getAttribute('onclick') || '';
    const match = onclickStr.match(/openCheckIn.*?id.*?['"](\w+)['"]/);
    if (match) return match[1];

    // Coba dari h-name teks → map ke habit ID
    const name = card.querySelector('.h-name')?.textContent?.trim().toLowerCase();
    const NAME_MAP = {
      'bangun pagi': 'pagi',
      'beribadah': 'ibadah',
      'berolahraga': 'olahraga',
      'makan sehat': 'makan',
      'gemar belajar': 'belajar',
      'bermasyarakat': 'sosial',
      'tidur cepat': 'tidur',
    };
    return NAME_MAP[name] || null;
  }

  // ── Inject speaker ke pesan Syekh ────────────────────────
  function injectSyekhSpeaker() {
    if (!isYoung()) return;
    const mentorCard = document.querySelector('.mentor-card, [class*="mentor"]');
    if (!mentorCard || mentorCard.querySelector('._vg_syekh_btn')) return;

    const msgEl = mentorCard.querySelector('p, .mentor-msg, [class*="msg"]');
    if (!msgEl) return;

    const btn = document.createElement('button');
    btn.className = '_vg_syekh_btn';
    btn.innerHTML = '🔊 Dengarkan Syekh';
    btn.style.cssText = [
      'display:flex','align-items:center','gap:6px',
      'margin-top:8px','padding:8px 16px',
      'background:linear-gradient(135deg,#9C27B0,#7B1FA2)',
      'color:#fff','border:none','border-radius:20px',
      'font-size:13px','font-weight:700','cursor:pointer',
      'font-family:var(--font-round,Arial,sans-serif)',
      'box-shadow:0 3px 8px rgba(156,39,176,0.3)',
    ].join(';');

    btn.onclick = () => {
      const text = msgEl.textContent.trim();
      if (text) speak('Pesan dari Syekh Al Fath. ' + text);
    };

    mentorCard.appendChild(btn);
  }

  // ── Auto greet saat pertama login ────────────────────────
  function autoGreet(studentName) {
    if (!isYoung()) return;
    const nick = studentName?.split(' ')[0] || 'Kamu';
    const greet = GREET_VOICE[Math.floor(Math.random() * GREET_VOICE.length)];
    const text  = `Halo ${nick}! ` + greet;
    // Delay sedikit agar UI selesai render
    setTimeout(() => speak(text), 800);
  }

  // ── Public API ────────────────────────────────────────────
  W.VG = {
    speak,
    readMission(habitId) {
      const text = HABIT_VOICE[habitId];
      if (text) speak(text);
    },
    readAll() {
      if (!isYoung()) return;
      const cards = document.querySelectorAll('.habit-card:not(.checked)');
      const texts = [];
      cards.forEach(card => {
        const id = getHabitIdFromCard(card);
        if (id && HABIT_VOICE[id]) texts.push(HABIT_VOICE[id]);
      });
      if (!texts.length) { speak('Semua misi sudah selesai! Alhamdulillah, kamu hebat!'); return; }
      speak('Misi yang belum selesai: ' + texts.join(' Selanjutnya: '));
    },
    stop() {
      if (_synth) _synth.cancel();
      _speaking = false;
    },
    doneSfx(name) {
      const text = DONE_VOICE[Math.floor(Math.random() * DONE_VOICE.length)];
      speak(text);
    },
  };

  // ── Patch renderHabits ───────────────────────────────────
  function patchRenderHabits() {
    if (typeof W.renderHabits !== 'function') return;
    if (W.renderHabits._vg_patched) return;
    const _orig = W.renderHabits;
    W.renderHabits = function () {
      _orig.call(this);
      setTimeout(injectSpeakerButtons, 100);
    };
    W.renderHabits._vg_patched = true;
  }

  // Patch doCheckIn untuk beri feedback suara
  function patchCheckIn() {
    if (typeof W.doCheckIn !== 'function') return;
    if (W.doCheckIn._vg_patched) return;
    const _orig = W.doCheckIn;
    W.doCheckIn = function (habitId) {
      const result = _orig.apply(this, arguments);
      if (isYoung()) {
        setTimeout(() => W.VG.doneSfx(), 300);
      }
      return result;
    };
    W.doCheckIn._vg_patched = true;
  }

  // Patch doLogin untuk auto greet
  function patchLogin() {
    if (typeof W.doLogin !== 'function') return;
    if (W.doLogin._vg_patched) return;
    const _orig = W.doLogin;
    W.doLogin = function () {
      const result = _orig.apply(this, arguments);
      setTimeout(() => {
        if (W.CU && W.CRole === 'anak' && isYoung()) {
          autoGreet(W.CU.nickname || W.CU.name);
        }
      }, 1200);
      return result;
    };
    W.doLogin._vg_patched = true;
  }

  // ── Boot ─────────────────────────────────────────────────
  function boot() {
    // Tunggu app ready
    let tries = 0;
    const wait = setInterval(() => {
      if (typeof W.renderHabits === 'function' || tries > 80) {
        clearInterval(wait);
        patchRenderHabits();
        patchCheckIn();
        patchLogin();

        // Jika sudah login sebagai young, inject langsung
        if (W.CU && W.CRole === 'anak' && isYoung()) {
          setTimeout(injectSpeakerButtons, 300);
          setTimeout(injectSyekhSpeaker, 500);
        }

        // Listen page switch untuk inject ulang
        document.addEventListener('heroku:pageSwitch', (e) => {
          if (isYoung()) {
            setTimeout(injectSpeakerButtons, 200);
            setTimeout(injectSyekhSpeaker, 400);
          }
        });
      }
      tries++;
    }, 150);

    // Gesture detector — aktifkan synth setelah sentuh layar pertama
    const enableGesture = () => {
      if (_gestured) return;
      _gestured = true;
      document.removeEventListener('touchstart', enableGesture);
      document.removeEventListener('click', enableGesture);
      // Coba load voices
      if (W.speechSynthesis) W.speechSynthesis.getVoices();
    };
    document.addEventListener('touchstart', enableGesture, { once: true });
    document.addEventListener('click', enableGesture, { once: true });

    console.log('[VG] Voice Guide v1.0 siap ✅ — panduan suara untuk usia 6-7 tahun aktif');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
