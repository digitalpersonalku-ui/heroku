// ═══════════════════════════════════════════════════════════
// SYEKH AL-FATH MENTOR SYSTEM v2.0
// File: js/syekh-v2.js
//
// Cara pasang di index.html — tambah setelah bridge.js:
//   <script src="js/syekh-v2.js"></script>
//
// API:
//   SAF.speak(msg)         — tampilkan pesan di mentor card
//   SAF.openChat()         — buka panel chat
//   SAF.closeChat()        — tutup panel chat
//   SAF.quickReply(type)   — quick reply dari siswa
// ═══════════════════════════════════════════════════════════

(function(global){
'use strict';

// ─────────────────────────────────────────────────────────
// 1. CSS INJECTION
// ─────────────────────────────────────────────────────────
function injectCSS(){
  if(document.getElementById('saf-v2-css')) return;
  const s = document.createElement('style');
  s.id = 'saf-v2-css';
  s.textContent = `
    /* Typing dots */
    .saf-dot{width:8px;height:8px;border-radius:50%;background:#27AE60;display:inline-block;animation:safDot 1.2s ease-in-out infinite}
    .saf-dot:nth-child(2){animation-delay:.2s}.saf-dot:nth-child(3){animation-delay:.4s}
    @keyframes safDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}

    /* Bubble masuk */
    @keyframes safIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
    .saf-bubble-in{animation:safIn .3s cubic-bezier(.34,1.4,.64,1) forwards}
    @keyframes safUserIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
    .saf-user-in{animation:safUserIn .25s ease forwards}

    /* Avatar pulse */
    @keyframes safAv{0%,100%{box-shadow:0 0 0 3px rgba(46,204,113,.25)}50%{box-shadow:0 0 0 7px rgba(46,204,113,.08)}}
    .saf-av-pulse{animation:safAv 2.5s ease-in-out infinite}

    /* Online dot */
    @keyframes safOnline{0%,100%{opacity:1}50%{opacity:.3}}
    .saf-online{animation:safOnline 1.8s ease-in-out infinite}

    /* Panel */
    #saf-v2-panel{
      position:fixed;bottom:0;left:0;right:0;z-index:9500;
      max-width:480px;margin:0 auto;
      background:#F9FFF9;border-radius:24px 24px 0 0;
      box-shadow:0 -8px 40px rgba(0,0,0,.18);
      transform:translateY(100%);
      transition:transform .4s cubic-bezier(.34,1.1,.64,1);
      display:flex;flex-direction:column;max-height:78vh;overflow:hidden;
    }
    #saf-v2-panel.open{transform:translateY(0)}

    /* Panel header */
    #saf-v2-head{
      background:linear-gradient(135deg,#1A1A2E,#0F3460);
      padding:14px 16px 14px;display:flex;align-items:center;gap:12px;
    }
    #saf-v2-av{
      width:48px;height:48px;border-radius:50%;
      background:linear-gradient(135deg,#27AE60,#0E6655);
      display:flex;align-items:center;justify-content:center;
      font-size:24px;flex-shrink:0;position:relative;
    }

    /* Chat scroll */
    #saf-v2-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}
    #saf-v2-log::-webkit-scrollbar{width:3px}
    #saf-v2-log::-webkit-scrollbar-thumb{background:#C8E6C9;border-radius:3px}

    /* Quick replies */
    #saf-v2-qr{
      display:flex;gap:8px;padding:10px 14px;
      overflow-x:auto;border-top:1px solid #E8F5E9;
      background:#fff;flex-shrink:0;scrollbar-width:none;
    }
    #saf-v2-qr::-webkit-scrollbar{display:none}
    .saf-qr-btn{
      flex-shrink:0;padding:7px 14px;border-radius:20px;
      font-size:12px;font-weight:800;cursor:pointer;
      white-space:nowrap;border:none;transition:all .15s;
    }
    .saf-qr-btn:active{transform:scale(.94)}

    /* Backdrop */
    #saf-v2-bd{
      position:fixed;inset:0;background:rgba(0,0,0,.5);
      z-index:9400;opacity:0;pointer-events:none;
      transition:opacity .3s;backdrop-filter:blur(3px);
    }
    #saf-v2-bd.open{opacity:1;pointer-events:all}

    /* Mentor card upgrade */
    .mentor-card{cursor:pointer;transition:transform .2s,box-shadow .2s}
    .mentor-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(39,174,96,.18)}
    .mentor-card:active{transform:scale(.99)}

    /* Notif badge */
    #saf-v2-badge{
      position:absolute;top:-6px;right:-6px;
      width:18px;height:18px;border-radius:50%;
      background:#E74C3C;color:#fff;font-size:9px;font-weight:900;
      display:none;align-items:center;justify-content:center;
      border:2px solid #fff;
    }
    @keyframes safBadge{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
    #saf-v2-badge.show{display:flex;animation:safBadge .35s cubic-bezier(.34,1.6,.64,1)}

    /* Mentor typing area */
    #saf-typing-wrap{display:flex;align-items:center;gap:4px;height:20px}

    /* Mentor msg */
    .mentor-msg{white-space:pre-wrap;line-height:1.7}

    /* Mentor avatar float */
    @keyframes safFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-5px) rotate(4deg)}}
    .saf-av-float{animation:safFloat 3s ease-in-out infinite}
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────
// 2. MESSAGE DATABASE
// ─────────────────────────────────────────────────────────
const MSG = {
  greet:{
    morning:[
      'Selamat pagi {name}! 🌅\nSyekh harap kamu sudah sholat Subuh ya? Hari baru = peluang baru jadi lebih baik. Bismillah, mulai misimu!',
      'Ahlan {name}! ☀️\nSubhanallah, matahari bersinar menyambut semangatmu! Siap selesaikan 7 misi hari ini?',
    ],
    afternoon:[
      'Assalamu\'alaikum {name}! 🌤️\nSudah siang nih — bagaimana misimu hari ini? Yuk selesaikan yang belum!',
      'Ahsanta {name}! ⭐\nHari masih panjang, masih ada waktu untuk jadi anak hebat hari ini!',
    ],
    evening:[
      'Malam penuh berkah {name}! 🌙\nWaktu hampir habis — pastikan semua misi selesai sebelum tidur ya!',
      'Assalamu\'alaikum {name}! ⭐\nSebelum tidur, yuk periksa — sudah berapa misi yang selesai hari ini?',
    ],
  },
  start:[
    'MasyaAllah {name}! 🌱\nLangkah pertama sudah diambil! Memulai adalah bagian terpenting — dan kamu sudah berhasil! Lanjutkan!',
    'Jayyid jiddan {name}! 👏\nSatu sudah, enam lagi! Kamu sudah buktikan ke dirimu — kamu BISA. Teruskan ke {next}!',
  ],
  halfway:[
    'Subhanallah {name}! 💪\n{done} dari 7 selesai! Setengah perjalanan terlewati. Pantang mundur — tinggal {remaining} lagi!',
    'MasyaAllah {name}! 🔥\n{done} dari 7! Di sinilah kebanyakan orang berhenti. Tapi Syekh tahu kamu bukan yang kebanyakan!',
  ],
  almost:[
    'MasyaAllah MasyaAllah {name}! 🏃\nTinggal {remaining} lagi! Finish line sudah kelihatan — jangan berhenti sekarang!',
    'Yaa {name}, hampir sampai! ⚡\n{done} sudah, hanya {remaining} lagi! Bayangkan rasa bangga saat semuanya selesai!',
  ],
  perfect:[
    'MASYAALLAH TABARAKALLAH {name}!!! 🏆\nTUJUH dari TUJUH! Kamu adalah contoh nyata anak Indonesia hebat!',
    'Subhanallah {name}! 🌟\nSemua 7 kebiasaan selesai! Ini bukan keberuntungan — ini ISTIQOMAHMU. Alhamdulillah!',
  ],
  streak:{
    3:'Barakallahu fiik {name}! 🔥\n3 hari berturut! "Amalan yang dicintai Allah adalah yang terus-menerus walau sedikit." Kamu buktikan itu!',
    7:'SUBHANALLAH {name}! ⚡\nSatu minggu penuh! Pohon berakar kuat tidak mudah ditumbangkan. Kamu sedang bangun akar itu!',
    14:'MasyaAllah {name}! 💎\nDUA MINGGU konsisten! Tinggal satu minggu lagi untuk kebiasaan benar-benar terbentuk permanen!',
    21:'ALLAHU AKBAR {name}!!! 👑\n21 hari berturut! Ini sudah jadi KARAKTERMU — luar biasa!',
    30:'Subhanallahil adzim {name}! 🌙\nSATU BULAN tanpa henti! Syekh sangat bangga. Tidak semua orang dewasa bisa melakukan ini!',
  },
  comeback:[
    'Assalamu\'alaikum {name}! 🌅\nSyekh merindukanmu! Tidak apa-apa — yang penting sekarang kembali. "Setiap hari adalah kesempatan baru dari Allah." Yuk mulai!',
    'Ahlan kembali {name}! 💫\nYang terbaik bukan yang tidak pernah jatuh, tapi yang selalu bangkit. Hari ini, bangkit bersama Syekh!',
  ],
  habitReact:{
    pagi:'MasyaAllah {name}! 🌅 Bangun pagi tanda orang yang dicintai Allah. Rezekimu hari ini sudah lapang!',
    ibadah:'Subhanallah {name}! 🤲 Sholat adalah tiang agama — kamu sudah jaga fondasi hidupmu. Allah pasti memuliakan!',
    olahraga:'MasyaAllah {name}! 💪 "Mukmin yang kuat lebih baik dan lebih dicintai Allah." Tubuhmu adalah amanah!',
    makan:'Jayyid {name}! 🥗 Pilihan makanan sehat hari ini — tubuhmu berterima kasih dan Allah meridhoi!',
    belajar:'Subhanallah {name}! 📚 "Menuntut ilmu kewajiban setiap Muslim." Setiap menit belajar adalah cahaya!',
    sosial:'MasyaAllah {name}! 🤝 "Sebaik-baik manusia yang paling bermanfaat." Kebaikanmu hari ini dicatat Allah!',
    tidur:'Jayyid jiddan {name}! 🌙 Tidur cepat sunnah Nabi — istirahat baik = ibadah lebih semangat besok!',
  },
  quickReply:{
    motivasi:[
      '{name}, Syekh ingin ceritakan:\n\n"Sesungguhnya Allah tidak mengubah keadaan suatu kaum kecuali mereka mengubah diri mereka sendiri." — QS. Ar-Ra\'d: 11\n\nSetiap kebiasaan yang kamu jaga adalah investasi terbaik untuk masa depanmu! 💪',
      '{name}, motivasi terbesar adalah TUJUAN!\n\nTanya dirimu: kenapa kamu melakukan ini? Bukan karena disuruh — tapi karena kamu ingin jadi versi TERBAIK dirimu! 🌟',
    ],
    hadis:[
      'Hadis untuk {name} hari ini:\n\n"Sebaik-baik kalian adalah yang mempelajari Al-Quran dan mengajarkannya." — HR. Bukhari 📖\n\nSemoga ilmumu bermanfaat untuk orang banyak!',
      'Hadis untuk {name}:\n\n"Sesungguhnya amalan itu tergantung niatnya." — HR. Bukhari & Muslim 🌙\n\nNiatkan semua kebiasaanmu karena Allah — pahalanya berlipat ganda!',
    ],
    tips:[
      '{name}, 5 rahasia kebiasaan berhasil:\n\n1️⃣ Mulai KECIL — 1 menit lebih baik dari nol\n2️⃣ Lakukan di waktu yang SAMA setiap hari\n3️⃣ RAYAKAN setiap pencapaian kecil\n4️⃣ Jangan hukum diri saat gagal — mulai lagi\n5️⃣ KONSISTEN lebih penting dari sempurna! 💡',
    ],
    doa:[
      'Doa sebelum belajar untuk {name}:\n\nرَبِّ زِدْنِي عِلْمًا\n"Rabbi zidnii ilmaa"\nArtinya: "Ya Tuhanku, tambahkanlah ilmuku." (QS. Thaha: 114)\n\nBacalah setiap mau belajar — ilmu yang diawali doa lebih mudah masuk ke hati! 📖✨',
    ],
    semangat:[
      '{name}, dengarkan Syekh baik-baik:\n\nKamu sudah HEBAT hanya dengan membuka aplikasi ini hari ini. Banyak yang tidak melakukannya.\n\nKamu punya semangat menyala di dalam dirimu — keluarkan SEKARANG! 🔥',
      '{name}, Syekh ingin kamu tahu:\n\n😔 Hari berat + tetap lanjut = KARAKTER\n😤 Hari mudah + berhenti = MENYESAL\n\nPilih yang mana? Syekh yakin kamu pilih yang pertama! 💪',
    ],
  },
};

// ─────────────────────────────────────────────────────────
// 3. UTILS
// ─────────────────────────────────────────────────────────
function pick(arr){ return Array.isArray(arr) ? arr[Math.floor(Math.random()*arr.length)] : arr; }
function tmpl(str,data){ return str.replace(/\{(\w+)\}/g,(_,k)=>data[k]??''); }
function getHour(){ return new Date().getHours(); }
function getNickname(u){ return u.nickname || (u.name||'').split(' ')[0] || 'Adik'; }

function buildData(u){
  const done = Object.keys(u.checkedToday||{}).length;
  const unchecked = (typeof HABITS!=='undefined'?HABITS:[]).filter(h=>!(u.checkedToday||{})[h.id]);
  return {
    name: getNickname(u), done, remaining: 7-done,
    streak: u.streak||0, next: unchecked[0]?.name||'',
  };
}

function selectMsg(u, trigger, extra={}){
  const data = {...buildData(u), ...extra};
  const done = data.done;
  const streak = data.streak;
  const h = getHour();
  const period = h<11?'morning':h<15?'afternoon':'evening';
  let raw;

  if(trigger==='habit' && extra.habitId){
    raw = MSG.habitReact[extra.habitId] || pick(MSG.start);
  } else if(trigger==='streak'){
    const milestones = [30,21,14,7,3];
    const ms = milestones.find(m=>streak>=m);
    raw = ms ? MSG.streak[ms] : pick(MSG.start);
  } else if(trigger==='checkin'||trigger==='progress'){
    if(done>=7)      raw = pick(MSG.perfect);
    else if(done>=5) raw = pick(MSG.almost);
    else if(done>=3) raw = pick(MSG.halfway);
    else if(done>=1) raw = pick(MSG.start);
    else raw = pick(MSG.greet[period]);
  } else if(trigger==='comeback'){
    raw = pick(MSG.comeback);
  } else {
    raw = pick(MSG.greet[period]);
  }
  return tmpl(raw, data);
}

// ─────────────────────────────────────────────────────────
// 4. TYPING ENGINE
// ─────────────────────────────────────────────────────────
let _tTimer = null;
function typeInto(el, text, speed, onDone){
  speed = speed || 22;
  clearInterval(_tTimer);
  el.textContent = '';
  const chars = [...text];
  let i = 0;
  function step(){
    if(i>=chars.length){ clearInterval(_tTimer); if(onDone) onDone(); return; }
    const ch = chars[i++];
    el.textContent += ch;
    el.scrollTop = el.scrollHeight;
    if(['.','!','?'].includes(ch)){
      clearInterval(_tTimer);
      setTimeout(()=>{ _tTimer=setInterval(step,speed); }, 90);
    } else if(ch==='\n'){
      clearInterval(_tTimer);
      setTimeout(()=>{ _tTimer=setInterval(step,speed); }, 200);
    }
  }
  _tTimer = setInterval(step, speed);
}

// ─────────────────────────────────────────────────────────
// 5. PANEL BUILDER
// ─────────────────────────────────────────────────────────
function buildPanel(){
  if(document.getElementById('saf-v2-panel')) return;

  // Backdrop
  const bd = document.createElement('div');
  bd.id = 'saf-v2-bd';
  bd.onclick = ()=>SAF.closeChat();
  document.body.appendChild(bd);

  // Panel
  const p = document.createElement('div');
  p.id = 'saf-v2-panel';
  p.innerHTML = `
    <div style="text-align:center;padding:10px;background:linear-gradient(135deg,#1A1A2E,#0F3460)">
      <div style="width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,.2);margin:0 auto;cursor:pointer" onclick="SAF.closeChat()"></div>
    </div>
    <div id="saf-v2-head">
      <div id="saf-v2-av" class="saf-av-pulse">
        🧕
        <div class="saf-online" style="position:absolute;bottom:1px;right:1px;width:12px;height:12px;background:#2ECC71;border-radius:50%;border:2px solid #1A1A2E"></div>
      </div>
      <div style="flex:1">
        <div style="font-weight:900;font-size:15px;color:#fff">Syekh Al-Fath</div>
        <div style="font-size:11px;color:rgba(255,255,255,.5);display:flex;align-items:center;gap:5px">
          <span class="saf-online" style="width:7px;height:7px;background:#2ECC71;border-radius:50%;display:inline-block"></span>
          <span id="saf-v2-status">Online</span>
        </div>
      </div>
      <button onclick="SAF.closeChat()" style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
    </div>
    <div id="saf-v2-log"></div>
    <div id="saf-v2-qr">
      <button class="saf-qr-btn" style="background:#EAFAF1;color:#27AE60;border:1.5px solid #A9DFBF" onclick="SAF.quickReply('motivasi')">💪 Motivasi</button>
      <button class="saf-qr-btn" style="background:#EBF5FB;color:#1A5276;border:1.5px solid #AED6F1" onclick="SAF.quickReply('hadis')">📖 Hadis</button>
      <button class="saf-qr-btn" style="background:#F5EEF8;color:#6C3483;border:1.5px solid #D2B4DE" onclick="SAF.quickReply('tips')">💡 Tips</button>
      <button class="saf-qr-btn" style="background:#FEF9E7;color:#7D6608;border:1.5px solid #F9E79F" onclick="SAF.quickReply('doa')">🤲 Doa</button>
      <button class="saf-qr-btn" style="background:#FDEDEC;color:#922B21;border:1.5px solid #F1948A" onclick="SAF.quickReply('semangat')">🔥 Semangat!</button>
    </div>
  `;
  document.body.appendChild(p);
}

// ─────────────────────────────────────────────────────────
// 6. CHAT LOG HELPERS
// ─────────────────────────────────────────────────────────
function addSyekhBubble(log, msg, noAnim){
  const wrap = document.createElement('div');
  wrap.className = noAnim?'':'saf-bubble-in';
  wrap.style.cssText = 'display:flex;gap:10px;align-items:flex-end';
  wrap.innerHTML = `
    <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#27AE60,#0E6655);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🧕</div>
    <div style="max-width:75%">
      <div style="font-size:10px;font-weight:800;color:#27AE60;margin-bottom:3px">Syekh Al-Fath</div>
      <div style="background:#fff;border:1px solid #D5F5E3;border-radius:4px 16px 16px 16px;padding:12px 14px;font-size:13px;font-weight:600;color:#1A1A2E;line-height:1.7;box-shadow:0 2px 8px rgba(0,0,0,.05);white-space:pre-wrap"></div>
      <div style="font-size:10px;color:#ccc;margin-top:3px;padding-left:4px">${new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</div>
    </div>`;
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
  return wrap.querySelector('div:last-child div:nth-child(2)');
}

function addUserBubble(log, text){
  const wrap = document.createElement('div');
  wrap.className = 'saf-user-in';
  wrap.style.cssText = 'display:flex;justify-content:flex-end';
  wrap.innerHTML = `<div style="max-width:70%;background:linear-gradient(135deg,#27AE60,#1ABC9C);color:#fff;border-radius:16px 4px 16px 16px;padding:10px 14px;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(39,174,96,.3)">${text}</div>`;
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

function addTypingIndicator(log){
  const ind = document.createElement('div');
  ind.id = 'saf-typing-ind';
  ind.className = 'saf-bubble-in';
  ind.style.cssText = 'display:flex;gap:10px;align-items:center';
  ind.innerHTML = `
    <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#27AE60,#0E6655);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🧕</div>
    <div style="background:#fff;border:1px solid #D5F5E3;border-radius:4px 16px 16px 16px;padding:10px 16px;box-shadow:0 2px 8px rgba(0,0,0,.05);display:flex;gap:4px;align-items:center">
      <span class="saf-dot"></span><span class="saf-dot"></span><span class="saf-dot"></span>
    </div>`;
  log.appendChild(ind);
  log.scrollTop = log.scrollHeight;
  return ind;
}

// ─────────────────────────────────────────────────────────
// 7. UPGRADE MENTOR CARD
// ─────────────────────────────────────────────────────────
function upgradeMentorCard(){
  const card = document.querySelector('.mentor-card');
  if(!card||card.dataset.safDone) return;
  card.dataset.safDone = '1';
  card.onclick = ()=>SAF.openChat();

  // Wrap avatar untuk badge
  const av = card.querySelector('.mentor-av');
  if(av){
    av.style.position = 'relative';
    const badge = document.createElement('div');
    badge.id = 'saf-v2-badge';
    badge.textContent = '1';
    av.appendChild(badge);
  }

  // Tambah typing area di dalam mentor card
  const msgEl = document.getElementById('mentor-msg');
  if(msgEl){
    const typingWrap = document.createElement('div');
    typingWrap.id = 'saf-card-typing';
    typingWrap.style.cssText = 'display:none;align-items:center;gap:4px;margin-top:4px';
    typingWrap.innerHTML = '<span class="saf-dot"></span><span class="saf-dot"></span><span class="saf-dot"></span>';
    msgEl.parentNode.insertBefore(typingWrap, msgEl.nextSibling);
  }

  // Hint chat
  const hint = document.createElement('div');
  hint.style.cssText = 'font-size:10px;color:#27AE60;font-weight:700;margin-top:8px;text-align:center;opacity:.7';
  hint.textContent = '💬 Ketuk untuk ngobrol dengan Syekh';
  card.appendChild(hint);
}

// ─────────────────────────────────────────────────────────
// 8. PUBLIC API
// ─────────────────────────────────────────────────────────
let _history = [];
let _isOpen = false;
let _pending = 0;

const SAF = {};

SAF.speak = function(msg, instant){
  const el = document.getElementById('mentor-msg');
  const typing = document.getElementById('saf-card-typing');
  const statusEl = document.querySelector('.mentor-sub');
  if(!el) return;

  _history.push({msg, time:new Date()});
  if(_history.length>8) _history.shift();

  if(instant){ el.textContent=msg; return; }

  // Tampilkan typing dulu
  el.textContent='';
  el.style.visibility='hidden';
  if(typing){ typing.style.display='flex'; }
  if(statusEl) statusEl.textContent = 'Syekh sedang mengetik...';

  const delay = 700 + Math.random()*500;
  setTimeout(()=>{
    if(typing) typing.style.display='none';
    el.style.visibility='visible';
    typeInto(el, msg, 22, ()=>{
      if(statusEl) statusEl.textContent='Nasehat & Bimbingan Harianmu';
    });
  }, delay);

  // Notif badge
  if(!_isOpen){
    _pending++;
    const badge = document.getElementById('saf-v2-badge');
    if(badge){ badge.textContent=_pending; badge.classList.add('show'); }
  }

  // Jika panel terbuka, tambah ke log
  if(_isOpen){
    const log = document.getElementById('saf-v2-log');
    if(log){ const msgEl=addSyekhBubble(log,msg); if(msgEl) typeInto(msgEl,msg,18); }
  }
};

SAF.openChat = function(){
  buildPanel();
  _isOpen = true;
  _pending = 0;
  const badge = document.getElementById('saf-v2-badge');
  if(badge) badge.classList.remove('show');

  document.getElementById('saf-v2-panel').classList.add('open');
  document.getElementById('saf-v2-bd').classList.add('open');
  document.body.style.overflow='hidden';

  const log = document.getElementById('saf-v2-log');
  log.innerHTML='';

  if(_history.length===0){
    const u = typeof CU!=='undefined'?CU:{name:'Adik',nickname:'Adik',checkedToday:{},streak:0,koin:0};
    const h = getHour();
    const period = h<11?'morning':h<15?'afternoon':'evening';
    const msg = selectMsg(u,'greet');
    const ind = addTypingIndicator(log);
    setTimeout(()=>{
      ind.remove();
      const msgEl=addSyekhBubble(log,msg);
      if(msgEl) typeInto(msgEl,msg,18);
      _history.push({msg,time:new Date()});
    },1200);
  } else {
    _history.forEach(h=>{
      const el=addSyekhBubble(log,h.msg,true);
      if(el) el.textContent=h.msg;
    });
    log.scrollTop=log.scrollHeight;
  }
};

SAF.closeChat = function(){
  _isOpen = false;
  const panel = document.getElementById('saf-v2-panel');
  const bd = document.getElementById('saf-v2-bd');
  if(panel) panel.classList.remove('open');
  if(bd) bd.classList.remove('open');
  document.body.style.overflow='';
};

SAF.quickReply = function(type){
  const u = typeof CU!=='undefined'?CU:{name:'Adik',nickname:'Adik',checkedToday:{},streak:0};
  const name = getNickname(u);
  const labels = {motivasi:'💪 Motivasi dong!',hadis:'📖 Hadis hari ini?',tips:'💡 Tips kebiasaan',doa:'🤲 Doa belajar',semangat:'🔥 Aku butuh semangat!'};
  const pool = MSG.quickReply[type];
  if(!pool) return;
  const msg = tmpl(pick(pool),{name});
  const log = document.getElementById('saf-v2-log');
  if(!log) return;
  addUserBubble(log, labels[type]||type);
  const statusEl = document.getElementById('saf-v2-status');
  if(statusEl) statusEl.textContent='Mengetik...';
  const ind = addTypingIndicator(log);
  setTimeout(()=>{
    ind.remove();
    if(statusEl) statusEl.textContent='Online';
    const msgEl=addSyekhBubble(log,msg);
    if(msgEl) typeInto(msgEl,msg,18);
    _history.push({msg,time:new Date()});
  }, 1400+Math.random()*800);
};

SAF.react = function(trigger, data){
  const u = data?.student || (typeof CU!=='undefined'?CU:{name:'Adik',nickname:'Adik',checkedToday:{},streak:0,koin:0});
  const msg = selectMsg(u, trigger, data||{});
  SAF.speak(msg);
};

global.SAF = SAF;

// ─────────────────────────────────────────────────────────
// 9. AUTO-INTEGRASI
// ─────────────────────────────────────────────────────────
function waitApp(cb,n){
  n=n||0; if(n>100) return;
  if(typeof doCheckIn==='function'&&typeof STORE!=='undefined'&&STORE.students) cb();
  else setTimeout(()=>waitApp(cb,n+1),100);
}

function init(){
  injectCSS();
  buildPanel();
  // Tunggu DOM mentor card
  const tryUpgrade = (n=0)=>{
    const card = document.querySelector('.mentor-card');
    if(card) upgradeMentorCard();
    else if(n<20) setTimeout(()=>tryUpgrade(n+1),200);
  };
  tryUpgrade();

  // Patch doCheckIn
  waitApp(()=>{
    const _orig = window.doCheckIn;
    window.doCheckIn = function(hb){
      const prevStreak = typeof CU!=='undefined'?CU.streak:0;
      _orig.call(this,hb);
      setTimeout(()=>{
        const streak = typeof CU!=='undefined'?CU.streak:0;
        if(streak>prevStreak&&[3,7,14,21,30].includes(streak)){
          SAF.react('streak',{student:CU});
        } else {
          SAF.react('habit',{student:CU,habitId:hb.id});
        }
      },800);
    };

    // Patch renderMentor — tambah typing animation
    const _origMentor = window.renderMentor;
    window.renderMentor = function(){
      _origMentor.call(this);
      const el = document.getElementById('mentor-msg');
      if(!el||!el.textContent||el.textContent==='—') return;
      const txt = el.textContent;
      el.textContent='';
      const typing = document.getElementById('saf-card-typing');
      if(typing){ typing.style.display='flex'; }
      setTimeout(()=>{
        if(typing) typing.style.display='none';
        typeInto(el,txt,22);
      },700+Math.random()*400);
    };

    console.log('[SAF v2] Syekh Al-Fath siap ✅');
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();

})(window);
