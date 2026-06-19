// ═══════════════════════════════════════════════════════════
// SYEKH AL-FATH — Interactive Mentor System v1.0
// Mentor yang terasa hidup tanpa AI mahal
//
// File: js/syekh-alfath.js
// Pasang di index.html setelah bridge.js:
//   <script src="js/syekh-alfath.js"></script>
//
// API Publik:
//   SAF.speak(message, opts)     — tampilkan pesan dengan typing
//   SAF.react(trigger, data)     — reaksi otomatis berdasarkan konteks
//   SAF.showChat()               — buka panel chat
//   SAF.hideChat()               — tutup panel chat
// ═══════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // 1. DATABASE PESAN — kontekstual, berdasarkan kondisi siswa
  // Setiap kondisi punya multiple variasi supaya tidak terasa repetitif
  // ─────────────────────────────────────────────────────────

  var MESSAGES = {

    // ── SALAM PERTAMA (belum pernah check-in) ───────────────
    firstTime: [
      'Assalamu\'alaikum warahmatullahi wabarakatuh, {name}! 🌙\nSyekh sangat senang bertemu denganmu. Perjalanan menjadi anak hebat dimulai hari ini! Bismillah, mulai dari mana kita?',
      'Wa\'alaikumussalam, {name}! ✨\nMasyaAllah, kamu sudah bergabung! Syekh sudah menunggu. Ingat — "Setiap perjalanan jauh dimulai dari satu langkah." Ayo mulai langkah pertamamu!',
    ],

    // ── SAPAAN PAGI (belum check-in hari ini) ───────────────
    morningGreet: [
      'Selamat pagi, {name}! 🌅\nSyekh harap kamu sudah sholat Subuh ya? Hari baru = peluang baru untuk jadi lebih baik. Yuk mulai misimu!',
      'Ahlan wa sahlan, {name}! ☀️\nSubhanallah, matahari sudah bersinar untuk menyambut semangatmu hari ini. Siap menyelesaikan 7 misi?',
      'Bismillah, {name}! 🌄\nSyekh senang melihatmu hari ini. Ingat hadis Nabi: "Setiap sendi tubuhmu punya hak, dan kebiasaan baik adalah sedekahnya." Ayo kita mulai!',
    ],

    // ── SAPAAN SIANG ────────────────────────────────────────
    afternoonGreet: [
      'Assalamu\'alaikum, {name}! 🌤️\nSudah siang nih — bagaimana misimu hari ini? Yuk selesaikan yang belum selesai!',
      'Ahsanta, {name}! ☀️\nSyekh melihat semangatmu dari sini. Hari masih panjang, masih banyak waktu untuk menyelesaikan misimu!',
    ],

    // ── SAPAAN MALAM ────────────────────────────────────────
    eveningGreet: [
      'Malam yang penuh berkah, {name}! 🌙\nWaktu tersisa tinggal sedikit. Apakah semua misi sudah selesai? Jangan tidur sebelum check-in ya!',
      'Assalamu\'alaikum, {name}! ⭐\nSebelum tidur, pastikan semua misimu sudah selesai. Tidur dengan hati yang bersih adalah nikmat terbesar!',
    ],

    // ── BARU MULAI (done = 1) ───────────────────────────────
    justStarted: [
      'MasyaAllah, {name}! 🌱\nLangkah pertama sudah kamu ambil! Tahu tidak? Satu kebiasaan baik hari ini lebih baik dari rencana seribu hari tanpa action. Terus ya!',
      'Jayyid jiddan, {name}! 👏\nBagus sekali sudah mulai! Syekh selalu bilang — memulai adalah bagian terberat. Dan kamu sudah berhasil! Lanjutkan!',
      'Bismillah, {name}! ✨\nSatu sudah, enam lagi. Kamu sudah buktikan ke dirimu sendiri bahwa kamu BISA. Sekarang tunjukkan ke {next} juga!',
    ],

    // ── SETENGAH JALAN (done = 3-4) ─────────────────────────
    halfway: [
      'Subhanallah, {name}! 💪\n{done} dari 7 misi selesai! Kamu sudah di tengah perjalanan. Ingat — "Yang terbaik di antara kalian adalah yang paling bermanfaat." Tinggal {remaining} lagi!',
      'Ahsanta, {name}! 🌟\nSyekh bangga! {done} kebiasaan selesai hari ini. Setengah jalan sudah terlewati — pantang mundur sekarang! Yuk tambah lagi!',
      'MasyaAllah, {name}! 🔥\nKamu sudah {done} dari 7! Tahu tidak, di sinilah kebanyakan orang berhenti — tapi Syekh tahu kamu bukan yang kebanyakan. Lanjutkan!',
    ],

    // ── HAMPIR SELESAI (done = 5-6) ─────────────────────────
    almostDone: [
      'MasyaAllah MasyaAllah, {name}! 🏃\nTinggal {remaining} lagi! Syekh sudah siapkan pujian terbaiknya untukmu. Jangan berhenti sekarang — finish line sudah kelihatan!',
      'Yaa {name}, hampir sampai! ⚡\n{done} sudah selesai, hanya {remaining} lagi. Bayangkan perasaan bangga saat semua selesai — LARI ke sana!',
      'Luar biasa, {name}! 🌈\nSyekh tidak percaya betapa hebatnya kamu! {remaining} misi lagi dan hari ini akan menjadi hari sempurnamu!',
    ],

    // ── SEMPURNA 7/7 ────────────────────────────────────────
    perfect: [
      'MASYAALLAH TABARAKALLAH, {name}!!! 🏆\nTUJUH dari tujuh! Syekh tidak punya kata-kata... ini adalah hari yang sempurna! Kamu adalah contoh nyata anak Indonesia hebat!',
      'Subhanallah wabihamdihi, {name}! 🌟\nAllahu Akbar! Semua 7 kebiasaan selesai hari ini! Rasulullah ﷺ pasti bangga melihat adab dan semangatmu. Syekh doakan kamu selalu!',
      'Alhamdulillah, {name}! 🎉\nIni bukan keberuntungan — ini hasil kerja keras dan ISTIQOMAHMU! 7/7 hari ini! Rayakan bersama keluargamu malam ini, kamu layak mendapatkannya!',
    ],

    // ── STREAK MILESTONES ────────────────────────────────────
    streak3: [
      'Barakallahu fiik, {name}! 🔥\n3 hari berturut-turut! Syekh selalu bilang — "Amalan yang paling dicintai Allah adalah yang dilakukan terus-menerus, walau sedikit." Kamu buktikan itu!',
      'MasyaAllah, {name}! ✨\n3 hari konsisten! Ini bukan kebetulan. Ini KARAKTER. Syekh sangat bangga melihat perkembanganmu!',
    ],
    streak7: [
      'SUBHANALLAH, {name}! 🌟\nSatu minggu penuh tanpa henti! Syekh ingin ceritakan satu hal: pohon yang berakar kuat tidak mudah ditumbangkan angin. Kamu sedang membangun akar itu!',
      'Alhamdulillah ya {name}! 🏆\n7 hari berturut-turut! Kamu sudah melampaui kebanyakan orang dewasa yang tidak bisa konsisten 7 hari. Luarrrr biasaaa!',
    ],
    streak14: [
      'MasyaAllah tabarakallah, {name}! 💎\nDUA MINGGU konsisten! Ini sudah level lain. Para ulama berkata kebiasaan terbentuk dalam 21 hari — kamu sudah dua pertiga jalan!',
    ],
    streak21: [
      'ALLAHU AKBAR, {name}!!! 👑\n21 hari berturut-turut! Secara ilmiah, kebiasaan sudah terbentuk! Ini bukan lagi "usaha" bagimu — ini sudah jadi KARAKTERMU. Luar biasa!',
    ],
    streak30: [
      'Subhanallah wabihamdihi subhanallahil adzim, {name}! 🌙\nSATU BULAN tanpa henti! Syekh menangis melihat konsistensimu. Tidak semua orang dewasa bisa melakukan ini. Kamu... luar biasa.',
    ],

    // ── SETELAH ABSEN SEHARI ─────────────────────────────────
    comeback: [
      'Assalamu\'alaikum, {name}! 🌅\nSyekh merindukanmu kemarin. Tidak apa-apa — yang penting sekarang kamu kembali! "Setiap hari adalah kesempatan baru dari Allah." Yuk mulai lagi!',
      'Ahlan wa sahlan kembali, {name}! 💫\nKemarin mungkin berat, dan Syekh mengerti. Tapi hari ini adalah hari baru dengan peluang baru. Syekh ada di sini bersamamu!',
      'Wa\'alaikumussalam, {name}! ✨\nSyekh tahu kemarin ada halangan — itulah ujian! Yang terbaik bukan yang tidak pernah jatuh, tapi yang selalu bangkit. Hari ini, bangkit bersama Syekh!',
    ],

    // ── SETELAH LAMA TIDAK AKTIF (> 3 hari) ─────────────────
    longAbsence: [
      'Ya {name}, Syekh sangat merindukanmu! 🌙\nSudah beberapa hari kita tidak bertemu. Tidak apa-apa — Allah Maha Pengampun dan selalu membuka pintu untuk kembali. Hari ini, mulai lagi dari nol. Bismillah!',
      'Assalamu\'alaikum, {name}! 🤗\nSyekh sudah menunggu! Ingat — "Sesungguhnya bersama kesulitan ada kemudahan." Apapun yang menghalangimu kemarin, hari ini kita mulai lagi bersama!',
    ],

    // ── REAKSI PER KEBIASAAN SPESIFIK ───────────────────────
    habitReaction: {
      pagi:     [
        'MasyaAllah, {name}! 🌅 Bangun pagi adalah tanda orang yang dicintai Allah. Rasulullah ﷺ bersabda: "Bangunkanlah anak-anakmu untuk sholat Subuh."',
        'Alhamdulillah, {name}! ☀️ Kamu bangun sebelum jam 5.30! Tahu tidak, orang yang bangun pagi otaknya lebih fresh dan rezekinya lebih lapang.',
      ],
      ibadah:   [
        'Subhanallah, {name}! 🤲 Sholat adalah tiang agama. Dengan menjaga sholat, kamu sudah menjaga fondasi hidupmu. Allah pasti memuliakan orang sepertimu!',
        'MasyaAllah, {name}! 🕌 5 waktu sholat + tilawah hari ini! Syekh doakan semua ibadahmu diterima Allah ﷻ. Aamiin!',
      ],
      olahraga: [
        'MasyaAllah, {name}! 💪 "Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah!" Tubuhmu adalah amanah, kamu jaga dengan baik!',
        'Alhamdulillah, {name}! 🏃 15 menit olahraga hari ini! Badan sehat = ibadah lebih khusyuk = belajar lebih fokus. Kamu investasi untuk masa depan!',
      ],
      makan:    [
        'Jayyid, {name}! 🥗 "Makanlah yang halal lagi baik." Kamu sudah pilih makanan sehat hari ini — tubuhmu berterima kasih!',
        'MasyaAllah, {name}! 🌿 Sayur dan buah hari ini sudah! Nabi Muhammad ﷺ juga menjaga pola makan. Kamu ikuti sunnahnya!',
      ],
      belajar:  [
        'Subhanallah, {name}! 📚 "Menuntut ilmu adalah kewajiban bagi setiap Muslim." Setiap menit yang kamu pakai untuk belajar adalah cahaya yang kamu kumpulkan!',
        'Ahsanta, {name}! ✏️ 30 menit belajar selesai! Syekh selalu bilang — ilmu adalah warisan yang tidak bisa dicuri siapapun.',
      ],
      sosial:   [
        'MasyaAllah, {name}! 🤝 "Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain." Satu kebaikan hari ini sudah kamu lakukan. Allah catat semuanya!',
        'Subhanallah, {name}! ❤️ Kamu sudah berbuat baik hari ini! Tahu tidak, kebaikan itu menular — satu kebaikanmu bisa menginspirasi puluhan orang!',
      ],
      tidur:    [
        'Jayyid jiddan, {name}! 🌙 Tidur sebelum jam 9 malam adalah sunah! Istirahat yang baik = bangun lebih segar = ibadah lebih semangat besok!',
        'MasyaAllah, {name}! 😴 Tidur cepat hari ini selesai! Nabi ﷺ bersabda tidur itu seperti kematian kecil — tidurlah dalam kebaikan!',
      ],
    },

    // ── MOTIVASI BERDASARKAN USIA ────────────────────────────
    ageSpecific: {
      muda: [ // 6-8 tahun
        'Hei {name}! ⭐ Kamu sudah hebat banget hari ini! Syekh kasih bintang emas buat kamu!',
        'Wah {name}! 🌈 Kamu sudah jadi anak yang sangat baik! Allah pasti sayang sama kamu!',
        '{name}, kamu BISA! 💪 Syekh percaya sama kamu! Ayo selesaikan semuanya!',
      ],
      menengah: [ // 9-11 tahun
        '{name}, kamu sudah tahu sesuatu yang belum diketahui banyak orang — bahwa kebiasaan kecil membuat perbedaan besar! 🌟',
        'Syekh ingin {name} tahu: setiap kebiasaan yang kamu bangun sekarang akan jadi pondasi karaktermu saat dewasa. Lanjutkan! 💎',
      ],
      dewasa: [ // 12+ tahun
        '{name}, di usiamu yang produktif ini, kebiasaan yang kamu bangun sekarang akan menentukan siapa kamu 10 tahun lagi. Pilih dengan bijak! 🏆',
        'Syekh sangat terkesan, {name}. Konsistensimu menunjukkan kematangan yang jarang dimiliki orang seusiamu. Terus pertahankan! 💡',
      ],
    },

    // ── PERTANYAAN INTERAKTIF ────────────────────────────────
    questions: [
      'Syekh ingin tanya, {name} — kebiasaan mana yang paling {name} suka dari tujuh kebiasaan ini? 🤔',
      '{name}, coba ceritakan ke Syekh — kebiasaan apa yang paling sulit kamu lakukan hari ini? Syekh ingin membantu! 💭',
      'Pertanyaan dari Syekh untuk {name}: kalau kamu bisa mengajarkan satu kebiasaan ke temanmu, kebiasaan apa yang akan kamu pilih? ⭐',
    ],

    // ── HADIS HARIAN ────────────────────────────────────────
    dailyHadis: [
      '"Sebaik-baik kalian adalah yang mempelajari Al-Quran dan mengajarkannya." — HR. Bukhari 📖',
      '"Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah." — HR. Muslim 💪',
      '"Sesungguhnya amalan itu tergantung niatnya." — HR. Bukhari & Muslim 🌙',
      '"Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia memuliakan tamunya." — HR. Bukhari 🤝',
      '"Tidak ada penyakit yang Allah turunkan kecuali Allah turunkan pula obatnya." — HR. Bukhari 🌿',
      '"Kebersihan adalah sebagian dari iman." — HR. Muslim ✨',
      '"Tangan di atas lebih baik daripada tangan di bawah." — HR. Bukhari & Muslim 💛',
    ],

  };

  // ─────────────────────────────────────────────────────────
  // 2. HELPER FUNCTIONS
  // ─────────────────────────────────────────────────────────

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function fillTemplate(str, data) {
    return str.replace(/\{(\w+)\}/g, function (_, key) {
      return data[key] !== undefined ? data[key] : '{' + key + '}';
    });
  }

  function getHourPeriod() {
    var h = new Date().getHours();
    if (h < 11) return 'morning';
    if (h < 15) return 'afternoon';
    return 'evening';
  }

  function getAgeGroup(age) {
    if (!age || age <= 8) return 'muda';
    if (age <= 11) return 'menengah';
    return 'dewasa';
  }

  function getDaysSinceActive(lastActive) {
    if (!lastActive) return 999;
    var diff = new Date() - new Date(lastActive);
    return Math.floor(diff / 86400000);
  }

  // ─────────────────────────────────────────────────────────
  // 3. MESSAGE SELECTOR — pilih pesan yang tepat
  // ─────────────────────────────────────────────────────────

  function selectMessage(student, trigger, extraData) {
    var name = student.nickname || student.name.split(' ')[0];
    var done = Object.keys(student.checkedToday || {}).length;
    var streak = student.streak || 0;
    var daysSince = getDaysSinceActive(student.lastActive);
    var ageGroup = getAgeGroup(student.age);
    var period = getHourPeriod();
    var tpl, pool;

    // 1. Trigger spesifik dari luar
    if (trigger === 'habit' && extraData && extraData.habitId) {
      pool = MESSAGES.habitReaction[extraData.habitId];
      if (pool) tpl = pick(pool);
    }

    // 2. Streak milestone
    if (!tpl && trigger === 'streak') {
      var sk = streak;
      if (sk >= 30) pool = MESSAGES.streak30;
      else if (sk >= 21) pool = MESSAGES.streak21;
      else if (sk >= 14) pool = MESSAGES.streak14;
      else if (sk >= 7)  pool = MESSAGES.streak7;
      else if (sk >= 3)  pool = MESSAGES.streak3;
      if (pool) tpl = pick(pool);
    }

    // 3. Progress kebiasaan
    if (!tpl && trigger === 'checkin') {
      if (done >= 7)      tpl = pick(MESSAGES.perfect);
      else if (done >= 5) tpl = pick(MESSAGES.almostDone);
      else if (done >= 3) tpl = pick(MESSAGES.halfway);
      else if (done === 1) tpl = pick(MESSAGES.justStarted);
    }

    // 4. Salam awal (load beranda)
    if (!tpl) {
      if (student.koin === 0 && done === 0 && daysSince > 30) {
        tpl = pick(MESSAGES.firstTime);
      } else if (daysSince > 3) {
        tpl = pick(MESSAGES.longAbsence);
      } else if (daysSince >= 1 && daysSince <= 3) {
        tpl = pick(MESSAGES.comeback);
      } else {
        var greetPool = period === 'morning' ? MESSAGES.morningGreet
          : period === 'afternoon' ? MESSAGES.afternoonGreet
          : MESSAGES.eveningGreet;
        tpl = pick(greetPool);
      }
    }

    // 5. Tambah hadis harian (20% chance)
    var addHadis = Math.random() < 0.2;

    // Build data untuk template
    var remaining = 7 - done;
    var nextHabit = '';
    if (typeof HABITS !== 'undefined') {
      var unchecked = HABITS.filter(function (h) {
        return !(student.checkedToday || {})[h.id];
      });
      if (unchecked.length) nextHabit = unchecked[0].name;
    }

    var data = {
      name: name,
      done: done,
      remaining: remaining,
      streak: streak,
      next: nextHabit,
      age: student.age || '',
    };

    var msg = fillTemplate(tpl, data);

    // Tambah hadis di akhir (jika bukan pesan habit-specific)
    if (addHadis && trigger !== 'habit') {
      msg += '\n\n' + pick(MESSAGES.dailyHadis);
    }

    return msg;
  }

  // ─────────────────────────────────────────────────────────
  // 4. TYPING ANIMATION ENGINE
  // ─────────────────────────────────────────────────────────

  var _typingTimer = null;
  var _currentMsg = '';

  function typeText(el, text, opts, onDone) {
    opts = opts || {};
    var speed = opts.speed || 28; // ms per karakter
    var pauseOnNewline = opts.pauseOnNewline || 220;

    clearInterval(_typingTimer);
    el.textContent = '';
    _currentMsg = text;

    var chars = text.split('');
    var i = 0;

    function next() {
      if (i >= chars.length) {
        clearInterval(_typingTimer);
        if (onDone) onDone();
        return;
      }
      var ch = chars[i];
      el.textContent += ch;
      i++;

      // Scroll ke bawah saat mengetik
      el.scrollTop = el.scrollHeight;

      // Pause lebih lama di newline dan titik
      if (ch === '\n') {
        clearInterval(_typingTimer);
        setTimeout(function () {
          _typingTimer = setInterval(next, speed);
        }, pauseOnNewline);
      } else if (ch === '.' || ch === '!' || ch === '?') {
        clearInterval(_typingTimer);
        setTimeout(function () {
          _typingTimer = setInterval(next, speed);
        }, 80);
      }
    }

    _typingTimer = setInterval(next, speed);
  }

  // ─────────────────────────────────────────────────────────
  // 5. CHAT BUBBLE RENDERER
  // ─────────────────────────────────────────────────────────

  var _chatHistory = [];
  var MAX_HISTORY = 5;

  function addChatBubble(message, isTyping) {
    var chatLog = document.getElementById('saf-chat-log');
    if (!chatLog) return null;

    var bubble = document.createElement('div');
    bubble.className = 'saf-bubble';
    bubble.style.cssText = [
      'display:flex', 'gap:9px', 'align-items:flex-start',
      'animation:safBubbleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      'margin-bottom:12px'
    ].join(';');

    var avatar = document.createElement('div');
    avatar.className = 'saf-avatar';
    avatar.textContent = '🧕';
    avatar.style.cssText = [
      'width:36px', 'height:36px', 'border-radius:50%',
      'background:linear-gradient(135deg,#27AE60,#1A5276)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'font-size:18px', 'flex-shrink:0', 'margin-top:2px',
      'box-shadow:0 2px 8px rgba(39,174,96,0.3)'
    ].join(';');

    var msgWrap = document.createElement('div');
    msgWrap.style.cssText = 'flex:1;min-width:0';

    var nameEl = document.createElement('div');
    nameEl.textContent = 'Syekh Al-Fath';
    nameEl.style.cssText = [
      'font-size:10px', 'font-weight:800', 'color:#27AE60',
      'margin-bottom:3px', 'font-family:var(--font-round,Arial,sans-serif)'
    ].join(';');

    var msgEl = document.createElement('div');
    msgEl.className = 'saf-msg-text';
    msgEl.style.cssText = [
      'background:#fff', 'border:1px solid #E8F5E9',
      'border-radius:4px 16px 16px 16px',
      'padding:11px 14px', 'font-size:13px', 'line-height:1.7',
      'color:#1A1A2E', 'white-space:pre-wrap',
      'box-shadow:0 2px 8px rgba(0,0,0,0.05)',
      'position:relative', 'word-break:break-word'
    ].join(';');

    if (isTyping) {
      // Tampilkan indikator "mengetik..." dulu
      msgEl.innerHTML = '<span class="saf-typing-dots"><span></span><span></span><span></span></span>';
    }

    msgWrap.appendChild(nameEl);
    msgWrap.appendChild(msgEl);
    bubble.appendChild(avatar);
    bubble.appendChild(msgWrap);
    chatLog.appendChild(bubble);

    // Scroll ke bawah
    chatLog.scrollTop = chatLog.scrollHeight;

    return msgEl;
  }

  function showTypingIndicator(chatLog) {
    var ind = document.createElement('div');
    ind.id = 'saf-typing-ind';
    ind.style.cssText = 'display:flex;gap:9px;align-items:center;margin-bottom:8px;animation:safBubbleIn 0.2s ease';
    ind.innerHTML = [
      '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#27AE60,#1A5276);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🧕</div>',
      '<div style="background:#fff;border:1px solid #E8F5E9;border-radius:4px 16px 16px 16px;padding:10px 16px;box-shadow:0 2px 8px rgba(0,0,0,0.05)">',
        '<span class="saf-typing-dots"><span></span><span></span><span></span></span>',
      '</div>'
    ].join('');
    chatLog.appendChild(ind);
    chatLog.scrollTop = chatLog.scrollHeight;
    return ind;
  }

  // ─────────────────────────────────────────────────────────
  // 6. INJECT CSS
  // ─────────────────────────────────────────────────────────

  function injectCSS() {
    if (document.getElementById('saf-styles')) return;
    var style = document.createElement('style');
    style.id = 'saf-styles';
    style.textContent = [

      // Animasi bubble masuk
      '@keyframes safBubbleIn{',
        'from{opacity:0;transform:translateY(10px) scale(0.95)}',
        'to{opacity:1;transform:translateY(0) scale(1)}',
      '}',

      // Indikator mengetik (3 titik bouncing)
      '.saf-typing-dots{display:inline-flex;gap:4px;align-items:center;padding:2px 0}',
      '.saf-typing-dots span{',
        'width:7px;height:7px;border-radius:50%;',
        'background:#27AE60;display:inline-block;',
        'animation:safDot 1.2s ease-in-out infinite;',
      '}',
      '.saf-typing-dots span:nth-child(2){animation-delay:0.2s}',
      '.saf-typing-dots span:nth-child(3){animation-delay:0.4s}',
      '@keyframes safDot{',
        '0%,60%,100%{transform:translateY(0);opacity:0.4}',
        '30%{transform:translateY(-6px);opacity:1}',
      '}',

      // Panel chat utama
      '#saf-panel{',
        'position:fixed;bottom:0;left:0;right:0;z-index:8000;',
        'max-width:480px;margin:0 auto;',
        'background:#F0FBF4;',
        'border-radius:24px 24px 0 0;',
        'box-shadow:0 -8px 32px rgba(0,0,0,0.18);',
        'transform:translateY(100%);',
        'transition:transform 0.4s cubic-bezier(0.34,1.2,0.64,1);',
        'display:flex;flex-direction:column;',
        'max-height:75vh;overflow:hidden;',
      '}',
      '#saf-panel.open{transform:translateY(0)}',

      // Header panel
      '#saf-panel-head{',
        'background:linear-gradient(135deg,#1A1A2E,#0F3460);',
        'padding:14px 16px 12px;',
        'display:flex;align-items:center;gap:12px;',
        'border-radius:24px 24px 0 0;flex-shrink:0',
      '}',

      // Avatar animasi berdenyut
      '#saf-panel-av{',
        'width:44px;height:44px;border-radius:50%;',
        'background:linear-gradient(135deg,#27AE60,#1A5276);',
        'display:flex;align-items:center;justify-content:center;',
        'font-size:22px;flex-shrink:0;',
        'box-shadow:0 0 0 3px rgba(46,204,113,0.3);',
        'animation:safAvatarPulse 2s ease-in-out infinite',
      '}',
      '@keyframes safAvatarPulse{',
        '0%,100%{box-shadow:0 0 0 3px rgba(46,204,113,0.3)}',
        '50%{box-shadow:0 0 0 6px rgba(46,204,113,0.15)}',
      '}',

      // Status online dot
      '.saf-online-dot{',
        'width:8px;height:8px;border-radius:50%;background:#2ECC71;',
        'display:inline-block;margin-right:5px;',
        'animation:safOnline 1.5s ease-in-out infinite',
      '}',
      '@keyframes safOnline{0%,100%{opacity:1}50%{opacity:0.3}}',

      // Chat log scroll area
      '#saf-chat-log{',
        'flex:1;overflow-y:auto;padding:14px;',
        'scroll-behavior:smooth;',
      '}',
      '#saf-chat-log::-webkit-scrollbar{width:3px}',
      '#saf-chat-log::-webkit-scrollbar-track{background:transparent}',
      '#saf-chat-log::-webkit-scrollbar-thumb{background:#C8E6C9;border-radius:3px}',

      // Quick replies
      '#saf-quick-wrap{',
        'padding:10px 14px;display:flex;gap:7px;',
        'overflow-x:auto;flex-shrink:0;',
        'border-top:1px solid rgba(46,204,113,0.15);',
        'background:#fff;scrollbar-width:none',
      '}',
      '#saf-quick-wrap::-webkit-scrollbar{display:none}',
      '.saf-quick-btn{',
        'flex-shrink:0;padding:8px 14px;',
        'background:#F0FBF4;border:1.5px solid #C8E6C9;',
        'border-radius:20px;font-size:12px;font-weight:700;',
        'color:#27AE60;cursor:pointer;white-space:nowrap;',
        'transition:all 0.15s;font-family:var(--font-round,Arial,sans-serif)',
      '}',
      '.saf-quick-btn:hover,.saf-quick-btn:active{',
        'background:#27AE60;color:#fff;border-color:#27AE60;transform:scale(0.97)',
      '}',

      // Tutup handle
      '#saf-handle{',
        'width:40px;height:4px;border-radius:2px;',
        'background:rgba(255,255,255,0.25);',
        'margin:0 auto;cursor:pointer;flex-shrink:0',
      '}',

      // Notif badge di mentor card
      '#saf-notif-badge{',
        'position:absolute;top:-4px;right:-4px;',
        'width:16px;height:16px;border-radius:50%;',
        'background:#E74C3C;color:#fff;',
        'font-size:9px;font-weight:900;',
        'display:none;align-items:center;justify-content:center;',
        'border:2px solid #fff;',
      '}',

      // Mentor card upgrade (lebih interaktif)
      '.mentor-card{cursor:pointer;transition:box-shadow 0.2s,transform 0.15s}',
      '.mentor-card:hover{box-shadow:0 4px 16px rgba(39,174,96,0.2);transform:translateY(-1px)}',
      '.mentor-card:active{transform:scale(0.99)}',

      // Pesan di mentor-card dengan typing cursor
      '#mentor-msg::after{',
        'content:"|";opacity:0;',
        'animation:safCursor 0.7s step-end infinite',
      '}',
      '#mentor-msg.typing::after{opacity:1}',
      '@keyframes safCursor{0%,100%{opacity:1}50%{opacity:0}}',

      // Backdrop saat panel terbuka
      '#saf-backdrop{',
        'position:fixed;inset:0;z-index:7999;',
        'background:rgba(0,0,0,0.4);backdrop-filter:blur(3px);',
        'opacity:0;pointer-events:none;',
        'transition:opacity 0.3s',
      '}',
      '#saf-backdrop.open{opacity:1;pointer-events:all}',

      // Animasi masuk panel
      '@keyframes safSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}',

    ].join('');
    document.head.appendChild(style);
  }

  // ─────────────────────────────────────────────────────────
  // 7. BANGUN UI PANEL CHAT
  // ─────────────────────────────────────────────────────────

  function buildPanel() {
    if (document.getElementById('saf-panel')) return;

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.id = 'saf-backdrop';
    backdrop.onclick = function () { SAF.hideChat(); };
    document.body.appendChild(backdrop);

    // Panel utama
    var panel = document.createElement('div');
    panel.id = 'saf-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat dengan Syekh Al-Fath');

    panel.innerHTML = [
      // Handle tutup
      '<div style="padding:10px;background:linear-gradient(135deg,#1A1A2E,#0F3460);border-radius:24px 24px 0 0">',
        '<div id="saf-handle" onclick="SAF.hideChat()"></div>',
      '</div>',

      // Header
      '<div id="saf-panel-head">',
        '<div id="saf-panel-av">🧕</div>',
        '<div style="flex:1">',
          '<div style="font-family:var(--font-round,Arial,sans-serif);font-size:15px;font-weight:900;color:#fff">Syekh Al-Fath</div>',
          '<div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:1px">',
            '<span class="saf-online-dot"></span>',
            '<span id="saf-status-text">Nasehat & Bimbingan Harianmu</span>',
          '</div>',
        '</div>',
        '<button onclick="SAF.hideChat()" style="background:rgba(255,255,255,0.1);border:none;color:#fff;',
          'width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;',
          'display:flex;align-items:center;justify-content:center">✕</button>',
      '</div>',

      // Chat log
      '<div id="saf-chat-log"></div>',

      // Quick reply buttons
      '<div id="saf-quick-wrap" id="saf-quick-area">',
        '<button class="saf-quick-btn" onclick="SAF.quickReply(\'motivasi\')">💪 Motivasi</button>',
        '<button class="saf-quick-btn" onclick="SAF.quickReply(\'hadis\')">📖 Hadis Hari Ini</button>',
        '<button class="saf-quick-btn" onclick="SAF.quickReply(\'tips\')">💡 Tips Kebiasaan</button>',
        '<button class="saf-quick-btn" onclick="SAF.quickReply(\'doa\')">🤲 Doa Belajar</button>',
        '<button class="saf-quick-btn" onclick="SAF.quickReply(\'semangat\')">🔥 Aku butuh semangat!</button>',
      '</div>',
    ].join('');

    document.body.appendChild(panel);
  }

  // ─────────────────────────────────────────────────────────
  // 8. UPGRADE MENTOR CARD DI BERANDA
  // ─────────────────────────────────────────────────────────

  function upgradeMentorCard() {
    var card = document.querySelector('.mentor-card');
    if (!card || card.dataset.safUpgraded) return;
    card.dataset.safUpgraded = '1';

    // Jadikan klikable untuk buka chat
    card.onclick = function () { SAF.showChat(); };
    card.title = 'Ketuk untuk chat dengan Syekh Al-Fath';

    // Tambah badge notifikasi
    var head = card.querySelector('.mentor-head');
    if (head) {
      head.style.position = 'relative';
      var badge = document.createElement('div');
      badge.id = 'saf-notif-badge';
      badge.textContent = '1';
      head.querySelector('.mentor-av').style.position = 'relative';
      var avEl = head.querySelector('.mentor-av');
      avEl.style.position = 'relative';
      avEl.appendChild(badge);
    }

    // Tambah hint "ketuk untuk chat"
    var hint = document.createElement('div');
    hint.style.cssText = [
      'font-size:10px;color:#27AE60;font-weight:700;',
      'margin-top:8px;display:flex;align-items:center;gap:4px;',
      'opacity:0.75'
    ].join('');
    hint.innerHTML = '💬 Ketuk untuk chat dengan Syekh Al-Fath';
    card.appendChild(hint);
  }

  // ─────────────────────────────────────────────────────────
  // 9. PUBLIC API
  // ─────────────────────────────────────────────────────────

  var SAF = {};
  var _isOpen = false;
  var _pendingMsgs = [];

  // Tampilkan pesan di mentor-card dengan typing animation
  SAF.speak = function (message, opts) {
    var msgEl = document.getElementById('mentor-msg');
    if (!msgEl) return;
    opts = opts || {};

    // Tampilkan typing indicator dulu
    var wasMsg = msgEl.textContent;
    msgEl.textContent = '';
    msgEl.classList.add('typing');

    // Delay sebelum mulai typing (simulasi "sedang berpikir")
    var thinkDelay = opts.instant ? 0 : (600 + Math.random() * 400);

    setTimeout(function () {
      typeText(msgEl, message, { speed: opts.speed || 25 }, function () {
        msgEl.classList.remove('typing');
      });
    }, thinkDelay);

    // Simpan ke history chat
    _chatHistory.push({ text: message, time: new Date() });
    if (_chatHistory.length > MAX_HISTORY) _chatHistory.shift();

    // Tampilkan notif badge
    var badge = document.getElementById('saf-notif-badge');
    if (badge && !_isOpen) {
      badge.style.display = 'flex';
      _pendingMsgs.push(message);
    }
  };

  // Reaksi berdasarkan trigger
  SAF.react = function (trigger, data) {
    var student = data && data.student
      ? data.student
      : (typeof CU !== 'undefined' ? CU : null);

    if (!student) return;

    var msg = selectMessage(student, trigger, data);
    SAF.speak(msg);

    // Jika panel terbuka, tambah ke chat log juga
    if (_isOpen) {
      setTimeout(function () {
        var chatLog = document.getElementById('saf-chat-log');
        if (!chatLog) return;
        var ind = showTypingIndicator(chatLog);
        setTimeout(function () {
          ind.remove();
          var msgEl = addChatBubble(msg);
          if (msgEl) {
            typeText(msgEl, msg, { speed: 20 });
          }
        }, 1200 + Math.random() * 600);
      }, 300);
    }
  };

  // Buka panel chat
  SAF.showChat = function () {
    buildPanel();
    _isOpen = true;
    document.getElementById('saf-panel').classList.add('open');
    document.getElementById('saf-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';

    // Reset notif badge
    var badge = document.getElementById('saf-notif-badge');
    if (badge) badge.style.display = 'none';
    _pendingMsgs = [];

    // Muat history chat
    var chatLog = document.getElementById('saf-chat-log');
    chatLog.innerHTML = '';

    if (_chatHistory.length === 0) {
      // Pesan pertama — salam
      var student = typeof CU !== 'undefined' ? CU : null;
      if (student) {
        var msg = selectMessage(student, 'greet');
        var ind = showTypingIndicator(chatLog);
        setTimeout(function () {
          ind.remove();
          var msgEl = addChatBubble(msg);
          if (msgEl) typeText(msgEl, msg, { speed: 22 });
        }, 1000);
      }
    } else {
      // Tampilkan history
      _chatHistory.forEach(function (h) {
        var msgEl = addChatBubble(h.text);
        if (msgEl) msgEl.textContent = h.text;
      });
    }
  };

  // Tutup panel chat
  SAF.hideChat = function () {
    _isOpen = false;
    var panel = document.getElementById('saf-panel');
    var backdrop = document.getElementById('saf-backdrop');
    if (panel) panel.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  };

  // Quick reply handler
  var QUICK_REPLIES = {
    motivasi: [
      'MasyaAllah {name}! Kamu bertanya tentang motivasi? Syekh ingin ceritakan sesuatu:\n\nSetiap pagi yang kamu sambut dengan baik adalah hadiah dari Allah. Setiap kebiasaan yang kamu jaga adalah tabungan untuk masa depanmu.\n\n"Sesungguhnya Allah tidak mengubah keadaan suatu kaum kecuali mereka mengubah diri mereka sendiri." — QS. Ar-Ra\'d: 11 💪',
      '{name}, motivasi terbesar adalah TUJUAN. Tanya dirimu: kenapa kamu melakukan ini?\n\nBukan karena disuruh — tapi karena kamu ingin menjadi versi terbaik dirimu. Itulah yang akan membuatmu tetap semangat bahkan saat tidak ada yang melihat! 🌟',
    ],
    hadis: function () {
      return 'Hadis hari ini, {name}:\n\n' + pick(MESSAGES.dailyHadis) + '\n\nSemoga hadis ini menjadi cahaya untukmu hari ini dan seterusnya. Aamiin! 🤲';
    },
    tips: [
      '{name}, tips dari Syekh untuk membangun kebiasaan:\n\n1️⃣ Mulai KECIL — 1 menit lebih baik dari nol\n2️⃣ HUBUNGKAN dengan kebiasaan yang sudah ada\n3️⃣ RAYAKAN setiap pencapaian kecil\n4️⃣ Jangan hukum diri saat gagal — cukup mulai lagi\n5️⃣ KONSISTEN lebih penting dari sempurna 💡',
      'Rahasia kebiasaan yang berhasil, {name}:\n\n✅ Lakukan di waktu yang SAMA setiap hari\n✅ Siapkan lingkungan yang MENDUKUNG\n✅ Cari TEMAN yang punya tujuan sama\n✅ Ingat MENGAPA kamu mulai\n✅ Percaya bahwa kamu BISA! 🌱',
    ],
    doa: 'Doa belajar: Rabbi zidnii ilmaa - Ya Allah tambahkan ilmuku (QS Thaha 114). Bacalah ini sebelum belajar ya {name}!',
    semangat: [
      '{name}, dengarkan Syekh baik-baik:\n\nKamu sudah HEBAT hanya dengan membuka aplikasi ini hari ini. Banyak anak yang tidak melakukannya.\n\nTapi Syekh tahu kamu lebih dari itu. Kamu punya semangat yang menyala-nyala di dalam dirimu. Keluarkan itu sekarang! 🔥',
      'Hei {name}! Syekh ingin kamu tahu:\n\n😔 Hari yang berat + tetap melanjutkan = KARAKTER\n😤 Hari yang mudah + berhenti = MENYESAL\n\nPilih yang mana? Syekh yakin kamu pilih yang pertama! Ayo, Syekh ada di sampingmu! 💪🌟',
    ],
  };

  SAF.quickReply = function (type) {
    var student = typeof CU !== 'undefined' ? CU : { name: 'Adik', nickname: 'Adik' };
    var name = student.nickname || student.name.split(' ')[0];

    var tplFn = QUICK_REPLIES[type];
    var tpl;
    if (typeof tplFn === 'function') {
      tpl = tplFn();
    } else if (Array.isArray(tplFn)) {
      tpl = pick(tplFn);
    } else {
      tpl = tplFn;
    }

    if (!tpl) return;
    var msg = fillTemplate(tpl, { name: name });

    var chatLog = document.getElementById('saf-chat-log');
    if (!chatLog) return;

    // Tampilkan "user reply" bubble dulu
    var userBubble = document.createElement('div');
    userBubble.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:8px;animation:safBubbleIn 0.25s ease';
    var userMsg = document.createElement('div');
    userMsg.style.cssText = [
      'background:linear-gradient(135deg,#27AE60,#1ABC9C);',
      'color:#fff;padding:9px 14px;border-radius:16px 4px 16px 16px;',
      'font-size:12px;font-weight:600;max-width:70%'
    ].join('');
    var labels = { motivasi:'💪 Motivasi', hadis:'📖 Hadis Hari Ini', tips:'💡 Tips Kebiasaan', doa:'🤲 Doa Belajar', semangat:'🔥 Aku butuh semangat!' };
    userMsg.textContent = labels[type] || type;
    userBubble.appendChild(userMsg);
    chatLog.appendChild(userBubble);
    chatLog.scrollTop = chatLog.scrollHeight;

    // Syekh "mengetik..."
    var ind = showTypingIndicator(chatLog);
    document.getElementById('saf-status-text').textContent = 'Sedang mengetik...';

    setTimeout(function () {
      ind.remove();
      document.getElementById('saf-status-text').textContent = 'Nasehat & Bimbingan Harianmu';
      var msgEl = addChatBubble(msg);
      if (msgEl) typeText(msgEl, msg, { speed: 20 });
    }, 1400 + Math.random() * 800);
  };

  // Export
  global.SAF = SAF;

  // ─────────────────────────────────────────────────────────
  // 10. AUTO-INTEGRASI KE HEROKU
  // ─────────────────────────────────────────────────────────

  function waitApp(cb, n) {
    n = n || 0;
    if (n > 100) return;
    if (typeof doCheckIn === 'function' && typeof STORE !== 'undefined' && STORE.students) {
      cb();
    } else {
      setTimeout(function () { waitApp(cb, n + 1); }, 100);
    }
  }

  // Init saat DOM siap
  function init() {
    injectCSS();
    buildPanel();
    upgradeMentorCard();

    // Patch doCheckIn
    waitApp(function () {
      var _origCheck = window.doCheckIn;
      window.doCheckIn = function (hb) {
        var prevStreak = CU ? CU.streak : 0;
        _origCheck.call(this, hb);
        // Reaksi Syekh
        setTimeout(function () {
          var streak = CU ? CU.streak : 0;
          if (streak > prevStreak && [3,7,14,21,30].indexOf(streak) !== -1) {
            SAF.react('streak', { student: CU });
          } else {
            SAF.react('habit', { student: CU, habitId: hb.id });
          }
        }, 800);
      };

      // Patch renderMentor — tambah typing
      var _origMentor = window.renderMentor;
      window.renderMentor = function () {
        // Jalankan original dulu untuk dapat teks
        _origMentor.call(this);
        // Ambil teks yang sudah diset, lalu re-type
        var el = document.getElementById('mentor-msg');
        if (!el) return;
        var txt = el.textContent;
        if (!txt || txt === '—') return;
        el.textContent = '';
        el.classList.add('typing');
        setTimeout(function () {
          typeText(el, txt, { speed: 22 }, function () {
            el.classList.remove('typing');
          });
        }, 400);
      };

      console.log('[SAF] Syekh Al-Fath siap! ✅');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
