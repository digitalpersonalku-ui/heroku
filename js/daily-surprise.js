// ═══════════════════════════════════════════════════════════
// HEROKU DAILY SURPRISE SYSTEM v1.0
// Tahap 1 dari 5 — Anti-Jenuh: Kejutan Harian
//
// File: js/daily-surprise.js
// Pasang di index.html setelah app-fixes.js:
//   <script src="js/daily-surprise.js"></script>
//
// Sistem ini membuat setiap hari terasa BERBEDA dengan:
//   A. Event Harian       — bonus & tantangan berdasarkan hari
//   B. Syekh Random Mood  — Syekh kadang terkejut, lucu, serius
//   C. Login Streak Spark — sambutan khusus tiap login
//   D. Mini Surprise Card — kartu kejutan kecil saat buka app
//   E. Ramalan Baik       — motivasi harian yang unpredictable
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─── Utils ───────────────────────────────────────────────
  function nick() {
    if (typeof CU === 'undefined' || !CU) return 'Adik';
    return CU.nickname || (CU.name || '').split(' ')[0] || 'Adik';
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function today()   { return new Date(); }
  function dow()     { return today().getDay(); } // 0=Ahad, 1=Sen, ..., 5=Jum, 6=Sab
  function hour()    { return today().getHours(); }
  // Seed deterministik berdasarkan tanggal → kejutan sama sepanjang hari
  function daySeed() {
    const d = today();
    return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
  }
  function seededRandom(seed, idx) {
    const x = Math.sin(seed + idx) * 10000;
    return x - Math.floor(x);
  }

  // ═══════════════════════════════════════════════════════════
  // A. EVENT HARIAN — setiap hari punya tema & bonus berbeda
  // ═══════════════════════════════════════════════════════════
  const DAILY_EVENTS = {
    0: { // Ahad
      name:   'Hari Istirahat Berkah',
      emoji:  '🌙',
      tagline:'Istirahat juga ibadah!',
      bonus:  'Tidur tepat waktu hari ini = XP DOUBLE!',
      xpMult: { tidur: 2 },
      color:  'rgba(155,89,182,.2)',
      border: 'rgba(155,89,182,.5)',
      syekh:  '{name}, Ahad adalah hari istirahat yang penuh berkah!\nNabi ﷺ mengajarkan keseimbangan — bekerja keras dan beristirahat dengan baik. Hari ini, nikmati waktu bersama keluargamu! 🌙',
    },
    1: { // Senin
      name:   'Hari Semangat Baru',
      emoji:  '🚀',
      tagline:'Awal pekan yang luar biasa!',
      bonus:  'Semua misi hari ini = Koin DOUBLE!',
      koinMult: 2,
      color:  'rgba(52,152,219,.2)',
      border: 'rgba(52,152,219,.5)',
      syekh:  'Senin yang penuh semangat, {name}! 🚀\n"Hari ini lebih baik dari kemarin, dan esok lebih baik dari hari ini."\nMulai pekan baru dengan niat yang kuat — Allah pasti memudahkan!',
    },
    2: { // Selasa
      name:   'Hari Ilmu',
      emoji:  '📚',
      tagline:'Hari terbaik untuk belajar!',
      bonus:  'Misi Belajar hari ini = XP TRIPLE!',
      xpMult: { belajar: 3 },
      color:  'rgba(46,204,113,.2)',
      border: 'rgba(46,204,113,.5)',
      syekh:  'Selasa adalah hari para ulama belajar, {name}! 📚\n"Menuntut ilmu dari buaian sampai liang lahat."\nHari ini ilmu yang kamu serap akan bertahan lebih lama di memorimu!',
    },
    3: { // Rabu
      name:   'Hari Kebaikan',
      emoji:  '🤝',
      tagline:'Satu kebaikan mengubah dunia!',
      bonus:  'Misi Sosial hari ini = Koin TRIPLE!',
      koinMult: { sosial: 3 },
      color:  'rgba(241,196,15,.2)',
      border: 'rgba(241,196,15,.5)',
      syekh:  '{name}, Rabu adalah hari penuh keberkahan! 🤝\n"Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain."\nSatu kebaikanmu hari ini bisa mengubah hari seseorang menjadi lebih cerah!',
    },
    4: { // Kamis
      name:   'Hari Amal Jariyah',
      emoji:  '✨',
      tagline:'Amalan terbaik terus mengalir!',
      bonus:  'Semua ibadah hari ini dicatat TRIPLE!',
      xpMult: { ibadah: 3 },
      color:  'rgba(255,223,0,.2)',
      border: 'rgba(255,223,0,.5)',
      syekh:  'Kamis — hari istimewa {name}! ✨\nAmalan-amalan pada hari Kamis diangkat kepada Allah.\n"Aku suka amalanku diangkat sementara aku sedang berpuasa." — Rasulullah ﷺ\nHari ini setiap ibadahmu lebih istimewa dari biasanya!',
    },
    5: { // Jumat
      name:   'HARI JUMAT MUBAROK! 🌟',
      emoji:  '🕌',
      tagline:'Hari terbaik dalam seminggu!',
      bonus:  'SEMUA misi hari ini = Bonus SPESIAL!',
      koinMult: 2, xpMult: 'all',
      color:  'rgba(230,126,34,.2)',
      border: 'rgba(230,126,34,.6)',
      syekh:  'JUMAT MUBAROK {name}!!! 🕌\n"Sebaik-baik hari yang matahari terbit padanya adalah hari Jumat." — HR. Muslim\nHari ini adalah hari rayamu setiap minggu! Semua kebaikanmu hari ini bernilai berlipat ganda!\nJangan lupa perbanyak sholawat! ﷺ',
    },
    6: { // Sabtu
      name:   'Hari Petualangan',
      emoji:  '⚽',
      tagline:'Bergerak, bermain, bersyukur!',
      bonus:  'Olahraga hari ini = XP DOUBLE + Badge Spesial!',
      xpMult: { olahraga: 2 },
      badgeBonus: true,
      color:  'rgba(231,76,60,.2)',
      border: 'rgba(231,76,60,.5)',
      syekh:  '{name}, Sabtu adalah hari petualanganmu! ⚽\n"Bermain adalah cara anak-anak belajar mensyukuri nikmat tubuh yang sehat."\nBergeraklah, tertawalah, nikmatilah — tubuh sehat adalah amanah terbaik dari Allah!',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // B. SYEKH RANDOM MOOD — setiap hari Syekh punya "mood"
  //    berbeda: terkejut, lucu, serius, penuh semangat, dll.
  // ═══════════════════════════════════════════════════════════
  const SYEKH_MOODS = [
    // mood_id, emoji, opener
    { id: 'excited',   em: '🌟', text: 'YA SALAM {name}!\nSyekh sangat senang hari ini — ada kabar baik yang ingin Syekh sampaikan!\n\n' },
    { id: 'wise',      em: '📿', text: 'Assalamu\'alaikum {name}...\nSyekh merenung sejenak tadi, dan terpikir sesuatu untukmu.\n\n' },
    { id: 'funny',     em: '😄', text: 'Hehehe, {name}!\nSyekh punya cerita lucu hari ini — tapi dulu tanya dulu, sudah siap?\n\n' },
    { id: 'proud',     em: '🏆', text: 'Subhanallah {name}...\nTahu tidak? Syekh selalu berdoa untukmu setiap pagi.\n\n' },
    { id: 'challenge', em: '⚡', text: 'Hei {name}!\nSyekh punya tantangan SPESIAL hari ini untukmu!\n\n' },
    { id: 'grateful',  em: '🤲', text: 'Alhamdulillah {name}...\nBetapa indahnya hari ini, bukan? Syekh bersyukur bisa menemanimu.\n\n' },
    { id: 'mystery',   em: '🔮', text: 'Psst... {name}!\nSyekh punya rahasia kecil hari ini yang hanya untuk telingamu.\n\n' },
  ];

  // Isi pesan per mood
  const SYEKH_MOOD_CONTENT = {
    excited:   ['Kamu tahu tidak — nama kamu sudah terkenal di desa! Warga berbisik, "Ada anak yang selalu konsisten..." Dan mereka sedang membicarakan KAMU!'],
    wise:      ['Ada satu hal yang Syekh pelajari dari para ulama terdahulu: mereka tidak pernah melewatkan satu hari pun tanpa belajar sesuatu yang baru. Hari ini, apa yang akan kamu pelajari?'],
    funny:     ['Tahu tidak, ada tikus kecil di desamu yang terinspirasi olehmu. Setiap pagi ia bangun lebih awal karena melihatmu bangun subuh! Wkwk — ini serius, kebaikanmu menular!'],
    proud:     ['Setiap centangan yang kamu buat — Allah catat. Setiap pagi yang kamu sambut — Allah saksikan. Syekh hanya perantara kabar bahagia ini: Allah merindukanmu di setiap sujud.'],
    challenge: ['Tantangan hari ini: selesaikan semua misi SEBELUM Ashar! Kalau berhasil, kamu akan mendapat kejutan spesial dari Syekh. Siap? Bismillah!'],
    grateful:  ['Coba hitung: berapa kali kamu bernapas sejak bangun tadi? Ribuan kali, kan? Setiap napas adalah nikmat yang tidak kita sadari. Alhamdulillah — kita masih di sini, masih bisa berbuat baik!'],
    mystery:   ['Rahasianya: ada bintang yang hanya muncul di langit desamu ketika kamu menyelesaikan semua 7 kebiasaan. Tidak semua orang bisa melihatnya — hanya yang hatinya bersih. Mau buktikan?'],
  };

  // ═══════════════════════════════════════════════════════════
  // C. RAMALAN BAIK HARIAN — unpredictable, ringan, positif
  //    Bukan ramalan sungguhan — framing = doa & harapan
  // ═══════════════════════════════════════════════════════════
  const DAILY_FORTUNE = [
    { icon: '☀️', text: 'Hari ini langit desamu akan bersinar lebih terang dari biasanya!' },
    { icon: '🌱', text: 'Sebuah benih kebaikan yang kamu tanam hari ini akan tumbuh besar.' },
    { icon: '🦋', text: 'Ada kejutan kecil menunggumu hari ini — perhatikan hal-hal kecil!' },
    { icon: '⭐', text: 'Seseorang hari ini akan tersenyum karena kebaikanmu.' },
    { icon: '🎯', text: 'Fokusmu hari ini akan luar biasa — mulai dengan bismillah!' },
    { icon: '🌈', text: 'Setelah usaha kerasmu, ada pelangi yang menunggu.' },
    { icon: '💎', text: 'Hari ini adalah hari yang Allah persiapkan khusus untukmu.' },
    { icon: '🔥', text: 'Semangatmu hari ini akan menginspirasi orang di sekitarmu.' },
    { icon: '🌺', text: 'Kebaikan yang kamu lakukan hari ini akan kembali kepadamu berlipat.' },
    { icon: '🏆', text: 'Hari ini kamu satu langkah lebih dekat ke versi terbaik dirimu.' },
    { icon: '🤝', text: 'Hari ini ada yang membutuhkan bantuanmu — kamu akan menemukannya.' },
    { icon: '📚', text: 'Ilmu yang kamu pelajari hari ini akan menjadi cahaya di masa depan.' },
    { icon: '💫', text: 'Malaikat mencatat kebaikanmu sejak pagi — teruskan!' },
    { icon: '🌙', text: 'Tidurmu malam ini akan sangat nyenyak — karena harimu penuh kebaikan.' },
  ];

  // ═══════════════════════════════════════════════════════════
  // D. LOGIN STREAK SPARK — sambutan berbeda per hari ke-N
  // ═══════════════════════════════════════════════════════════
  const STREAK_SPARKS = [
    { days: 1,  em: '🌱', msg: 'Hari pertama selalu yang paling berani!' },
    { days: 2,  em: '✌️', msg: 'Dua hari berturut — kamu sudah membuktikan bisa!' },
    { days: 3,  em: '🔥', msg: '3 hari! Api semangatmu mulai menyala!' },
    { days: 5,  em: '⚡', msg: '5 hari! Kamu sudah lebih konsisten dari 80% orang!' },
    { days: 7,  em: '🌟', msg: 'SATU MINGGU PENUH! Kamu luar biasa!' },
    { days: 10, em: '💎', msg: '10 hari — kebiasaan ini mulai jadi bagian dirimu!' },
    { days: 14, em: '🏅', msg: 'DUA MINGGU! Tinggal 7 hari lagi untuk kebiasaan permanen!' },
    { days: 21, em: '👑', msg: '21 HARI! Para ilmuwan bilang — ini sudah jadi KARAKTERMU!' },
    { days: 30, em: '🏆', msg: 'SATU BULAN! Kamu adalah legenda kebiasaan baik!' },
  ];

  // ═══════════════════════════════════════════════════════════
  // CSS INJECTION
  // ═══════════════════════════════════════════════════════════
  function injectCSS() {
    if (document.getElementById('_ds_css')) return;
    const s = document.createElement('style');
    s.id = '_ds_css';
    s.textContent = `

/* ── Daily Event Banner ── */
#_ds_banner {
  border-radius: 16px; padding: 12px 14px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 12px;
  border: 1.5px solid; position: relative; overflow: hidden;
  cursor: pointer; transition: transform .15s;
  animation: _dsBannerIn .4s cubic-bezier(.34,1.5,.64,1) both;
}
#_ds_banner:active { transform: scale(.98); }
@keyframes _dsBannerIn {
  from { opacity:0; transform:translateY(-12px) scale(.96); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
#_ds_banner::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent);
  transform:translateX(-100%);
  animation: _dsShine 3s ease-in-out infinite 1s;
}
@keyframes _dsShine {
  0%  { transform:translateX(-100%); }
  40% { transform:translateX(200%); }
  100%{ transform:translateX(200%); }
}
._ds_ev_em  { font-size: 28px; flex-shrink:0; }
._ds_ev_body{ flex:1; min-width:0; }
._ds_ev_name{ font-size: 12px; font-weight:800; color:rgba(255,255,255,.9); margin-bottom:2px; }
._ds_ev_tag { font-size: 10px; color:rgba(255,255,255,.55); }
._ds_ev_bon { font-size: 10px; font-weight:700; margin-top:3px; }
._ds_ev_arr { font-size:16px; color:rgba(255,255,255,.4); flex-shrink:0; }

/* ── Fortune Card ── */
#_ds_fortune {
  border-radius: 14px; padding: 10px 14px;
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  margin-bottom: 12px;
  animation: _dsBannerIn .4s cubic-bezier(.34,1.5,.64,1) .15s both;
}
._ds_ft_em { font-size: 20px; flex-shrink:0; }
._ds_ft_txt{ font-size: 11px; color:rgba(255,255,255,.65); line-height:1.6; font-style:italic; }

/* ── Streak Spark ── */
#_ds_streak_spark {
  border-radius: 14px; padding: 9px 14px;
  display: flex; align-items: center; gap: 10px;
  background: rgba(241,196,15,.1);
  border: 1px solid rgba(241,196,15,.25);
  margin-bottom: 12px;
  animation: _dsBannerIn .4s cubic-bezier(.34,1.5,.64,1) .3s both;
}
._ds_ss_em  { font-size:20px; flex-shrink:0; }
._ds_ss_txt { font-size:11px; font-weight:700; color:rgba(255,220,100,.9); }

/* ── Surprise Modal ── */
#_ds_modal {
  position:fixed; inset:0; z-index:7000;
  background:rgba(8,8,16,.9); backdrop-filter:blur(16px);
  display:none; align-items:center; justify-content:center;
  padding:20px; flex-direction:column;
}
#_ds_modal.show { display:flex; }
#_ds_modal_box {
  border-radius:24px; padding:28px 22px 24px;
  max-width:300px; width:100%; text-align:center;
  position:relative; overflow:hidden;
  animation: _dsBannerIn .5s cubic-bezier(.34,1.5,.64,1) both;
}
._ds_m_em   { font-size:64px; display:block; margin-bottom:10px;
              animation: _dsFloat 2s ease-in-out infinite alternate; }
@keyframes _dsFloat {
  from { transform:translateY(0) rotate(-3deg); }
  to   { transform:translateY(-8px) rotate(3deg); }
}
._ds_m_day  { font-size:10px; font-weight:800; letter-spacing:2px;
              text-transform:uppercase; color:rgba(255,255,255,.4); margin-bottom:6px; }
._ds_m_name { font-size:22px; font-weight:900; color:#fff; margin-bottom:6px; }
._ds_m_bon  { font-size:12px; color:rgba(255,220,100,.85); margin-bottom:14px; line-height:1.7; }
._ds_m_syekh{
  background:rgba(46,204,113,.08); border:1px solid rgba(46,204,113,.2);
  border-radius:12px; padding:10px 12px; margin-bottom:16px;
  text-align:left; display:flex; gap:8px; align-items:flex-start;
}
._ds_m_sav  { width:30px; height:30px; border-radius:50%;
              background:linear-gradient(135deg,#27AE60,#0E6655);
              display:flex; align-items:center; justify-content:center;
              font-size:16px; flex-shrink:0; }
._ds_m_stxt { font-size:11px; color:rgba(255,255,255,.7);
              line-height:1.65; white-space:pre-line; }
._ds_m_btn  { width:100%; padding:14px; border:none; border-radius:14px;
              font-size:14px; font-weight:900; cursor:pointer;
              font-family:inherit; transition:transform .15s; }
._ds_m_btn:active { transform:scale(.97); }

/* ── Pulse dot (indikator event aktif) ── */
._ds_pulse {
  width:7px; height:7px; border-radius:50%;
  display:inline-block; margin-left:4px;
  animation: _dsPulse 1.6s ease-in-out infinite;
}
@keyframes _dsPulse {
  0%,100%{ transform:scale(1); opacity:1; }
  50%    { transform:scale(1.5); opacity:.5; }
}
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  // HTML INJECTION — modal kejutan
  // ═══════════════════════════════════════════════════════════
  function injectHTML() {
    if (document.getElementById('_ds_modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
<div id="_ds_modal">
  <div id="_ds_modal_box">
    <span class="_ds_m_em" id="_ds_m_em">🌟</span>
    <div class="_ds_m_day" id="_ds_m_day">HARI INI</div>
    <div class="_ds_m_name" id="_ds_m_name">Hari Spesial!</div>
    <div class="_ds_m_bon" id="_ds_m_bon">Bonus spesial menunggumu!</div>
    <div class="_ds_m_syekh">
      <div class="_ds_m_sav">🧕</div>
      <div class="_ds_m_stxt" id="_ds_m_stxt">Assalamu'alaikum!</div>
    </div>
    <button class="_ds_m_btn" id="_ds_m_btn" onclick="DS.closeModal()">
      Bismillah, Mulai! 🚀
    </button>
  </div>
</div>
    `);
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  // Render banner event harian di halaman beranda
  function renderDailyBanner(container) {
    const ev = DAILY_EVENTS[dow()];
    const old = document.getElementById('_ds_banner');
    if (old) old.remove();

    const el = document.createElement('div');
    el.id = '_ds_banner';
    el.style.background = ev.color;
    el.style.borderColor = ev.border;
    el.innerHTML = `
      <span class="_ds_ev_em">${ev.emoji}</span>
      <div class="_ds_ev_body">
        <div class="_ds_ev_name">
          ${ev.name}
          <span class="_ds_pulse" style="background:${ev.border}"></span>
        </div>
        <div class="_ds_ev_tag">${ev.tagline}</div>
        <div class="_ds_ev_bon" style="color:${ev.border}">✨ ${ev.bonus}</div>
      </div>
      <span class="_ds_ev_arr">›</span>
    `;
    el.onclick = () => DS.showModal();

    // Sisipkan sebelum habits list, setelah mentor card
    if (container) {
      container.insertBefore(el, container.firstChild);
    }
  }

  // Render fortune card
  function renderFortune(container) {
    const seed = daySeed();
    const idx  = Math.floor(seededRandom(seed, 42) * DAILY_FORTUNE.length);
    const ft   = DAILY_FORTUNE[idx];

    const old = document.getElementById('_ds_fortune');
    if (old) old.remove();

    const el = document.createElement('div');
    el.id = '_ds_fortune';
    el.innerHTML = `
      <span class="_ds_ft_em">${ft.icon}</span>
      <span class="_ds_ft_txt">"${ft.text}"</span>
    `;
    if (container) container.insertBefore(el, container.firstChild);
  }

  // Render streak spark jika milestone
  function renderStreakSpark(container) {
    const old = document.getElementById('_ds_streak_spark');
    if (old) old.remove();

    if (typeof CU === 'undefined' || !CU) return;
    const streak = CU.streak || 0;
    if (streak < 1) return;

    // Cari milestone yang pas
    const milestones = STREAK_SPARKS.slice().reverse();
    const ms = milestones.find(m => streak >= m.days);
    if (!ms) return;

    // Hanya tampilkan di hari yang sama saat streak bertambah
    // (cek lastActive === hari ini)
    const todayS = typeof todayStr === 'function' ? todayStr() : new Date().toISOString().slice(0,10);
    if (CU.lastActive !== todayS) return;

    const el = document.createElement('div');
    el.id = '_ds_streak_spark';
    el.innerHTML = `
      <span class="_ds_ss_em">${ms.em}</span>
      <span class="_ds_ss_txt">🔥 ${streak} hari streak! ${ms.msg}</span>
    `;
    if (container) container.insertBefore(el, container.firstChild);
  }

  // ═══════════════════════════════════════════════════════════
  // MODAL KEJUTAN — muncul saat pertama login hari ini
  // ═══════════════════════════════════════════════════════════
  function showLoginSurprise() {
    const ev = DAILY_EVENTS[dow()];
    const seed = daySeed();

    // Pilih mood Syekh berdasarkan seed hari ini
    const moodIdx  = Math.floor(seededRandom(seed, 7) * SYEKH_MOODS.length);
    const mood     = SYEKH_MOODS[moodIdx];
    const contentArr = SYEKH_MOOD_CONTENT[mood.id] || SYEKH_MOOD_CONTENT.wise;
    const content  = contentArr[Math.floor(seededRandom(seed, 13) * contentArr.length)];
    const n        = nick();

    // Pilih fortune
    const ftIdx = Math.floor(seededRandom(seed, 42) * DAILY_FORTUNE.length);
    const ft    = DAILY_FORTUNE[ftIdx];

    // Set modal content
    const days  = ['Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    document.getElementById('_ds_m_em').textContent   = ev.emoji;
    document.getElementById('_ds_m_day').textContent  = days[dow()].toUpperCase() + ' MUBAROK!';
    document.getElementById('_ds_m_name').textContent = ev.name;
    document.getElementById('_ds_m_bon').textContent  = `${ft.icon} "${ft.text}"\n\n✨ Bonus Hari Ini:\n${ev.bonus}`;
    document.getElementById('_ds_m_stxt').textContent =
      mood.text.replace('{name}', n) + content.replace('{name}', n);

    // Warna box sesuai event
    const box = document.getElementById('_ds_modal_box');
    const colors = {
      0: 'linear-gradient(160deg,#1A0A2E,#1A1A2E)',
      1: 'linear-gradient(160deg,#0B1E3B,#1A1A2E)',
      2: 'linear-gradient(160deg,#0A2E1A,#1A1A2E)',
      3: 'linear-gradient(160deg,#2E2A0A,#1A1A2E)',
      4: 'linear-gradient(160deg,#2E1A0A,#1A1A2E)',
      5: 'linear-gradient(160deg,#2E0A0A,#1A1A2E)',
      6: 'linear-gradient(160deg,#2E0A0A,#1A1A2E)',
    };
    box.style.background = colors[dow()] || 'linear-gradient(160deg,#1A1A2E,#2A1A3E)';
    box.style.border = `1.5px solid ${ev.border}`;

    // Warna button
    const btn = document.getElementById('_ds_m_btn');
    btn.style.background = dow() === 5
      ? 'linear-gradient(135deg,#E67E22,#D35400)'
      : 'linear-gradient(135deg,#2ECC71,#27AE60)';
    btn.style.color = '#fff';
    btn.style.boxShadow = `0 5px 18px ${ev.border}`;

    // Tampilkan
    document.getElementById('_ds_modal').classList.add('show');

    // Audio sambutan
    if (typeof HA !== 'undefined') {
      setTimeout(() => {
        if (dow() === 5) HA.play('celebrate');
        else HA.play('checklist');
      }, 300);
    }

    // Haptic
    if (navigator.vibrate) navigator.vibrate([30, 15, 30]);
  }

  // ─── Cek apakah sudah tampil hari ini ───────────────────
  function hasShownToday() {
    const key = '_ds_shown_' + (typeof todayStr === 'function' ? todayStr() : new Date().toISOString().slice(0,10));
    const uid = typeof CU !== 'undefined' && CU ? CU.id : 'anon';
    return sessionStorage.getItem(key + '_' + uid) === '1';
  }
  function markShownToday() {
    const key = '_ds_shown_' + (typeof todayStr === 'function' ? todayStr() : new Date().toISOString().slice(0,10));
    const uid = typeof CU !== 'undefined' && CU ? CU.id : 'anon';
    sessionStorage.setItem(key + '_' + uid, '1');
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════
  const DS = {};

  DS.showModal = function () {
    showLoginSurprise();
  };

  DS.closeModal = function () {
    const modal = document.getElementById('_ds_modal');
    if (modal) modal.classList.remove('show');
    markShownToday();

    // Setelah modal tutup, render banner & fortune di beranda
    DS.renderBeranda();

    // Syekh berbicara dengan mood hari ini
    if (typeof SAF !== 'undefined') {
      const ev = DAILY_EVENTS[dow()];
      setTimeout(() => SAF.speak(ev.syekh.replace('{name}', nick())), 500);
    }
  };

  // Render semua komponen kejutan di halaman beranda
  DS.renderBeranda = function () {
    // Cari container yang tepat — setelah mentor card, sebelum habits
    const habitsList = document.getElementById('habits-list');
    const container  = habitsList?.parentElement;
    if (!container) return;

    // Render dalam urutan: streak spark → fortune → event banner
    renderStreakSpark(container);
    renderFortune(container);
    renderDailyBanner(container);
  };

  // Ambil event hari ini (untuk digunakan modul lain)
  DS.todayEvent = function () {
    return DAILY_EVENTS[dow()];
  };

  // Cek apakah habit tertentu punya bonus hari ini
  DS.getBonus = function (habitId) {
    const ev = DAILY_EVENTS[dow()];
    const bonus = { koinMult: 1, xpMult: 1 };
    if (!ev) return bonus;

    // koinMult
    if (ev.koinMult === 2)                        bonus.koinMult = 2;
    if (typeof ev.koinMult === 'object' && ev.koinMult[habitId]) bonus.koinMult = ev.koinMult[habitId];

    // xpMult
    if (ev.xpMult === 'all')                      bonus.xpMult = 2;
    if (typeof ev.xpMult === 'object' && ev.xpMult[habitId])  bonus.xpMult = ev.xpMult[habitId];

    return bonus;
  };

  W.DS = DS;

  // ═══════════════════════════════════════════════════════════
  // AUTO-INTEGRASI
  // ═══════════════════════════════════════════════════════════
  function integrate() {

    // 1. Tampilkan kejutan saat pertama login (halaman beranda muncul)
    if (typeof W.HeroKuEvents !== 'undefined') {
      W.HeroKuEvents.on('pageSwitch', function (e) {
        if (e.detail?.page !== 'beranda') return;
        DS.renderBeranda();
        // Tampilkan modal hanya sekali per hari per sesi
        if (!hasShownToday()) {
          setTimeout(() => DS.showModal(), 600);
        }
      });
    }

    // 2. Patch doCheckIn — terapkan bonus harian
    if (typeof W.doCheckIn === 'function') {
      const _orig = W.doCheckIn;
      W.doCheckIn = function (hb) {
        const bonus = DS.getBonus(hb.id);
        // Simpan multiplier sementara
        const origKoin = hb.koin, origXp = hb.xp;
        hb.koin = Math.round(hb.koin * bonus.koinMult);
        hb.xp   = Math.round(hb.xp   * bonus.xpMult);

        _orig.call(this, hb);

        // Restore supaya tidak permanen
        hb.koin = origKoin; hb.xp = origXp;

        // Toast bonus jika ada
        if (bonus.koinMult > 1 || bonus.xpMult > 1) {
          const ev = DS.todayEvent();
          setTimeout(() => {
            if (typeof showToast === 'function') {
              showToast(`${ev.emoji} Bonus ${ev.name}! ×${Math.max(bonus.koinMult, bonus.xpMult)}`);
            }
          }, 400);
        }
      };
    }

    // 3. Setelah renderApp, render banner beranda
    if (typeof W.renderApp === 'function') {
      const _orig = W.renderApp;
      W.renderApp = function () {
        _orig.call(this);
        setTimeout(() => {
          DS.renderBeranda();
          if (!hasShownToday()) {
            setTimeout(() => DS.showModal(), 800);
          }
        }, 200);
      };
    }

    console.log('[DS] Daily Surprise System siap ✅ — kejutan berbeda setiap hari!');
  }

  function boot() {
    injectCSS();
    injectHTML();

    // Tunggu EventBus
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
