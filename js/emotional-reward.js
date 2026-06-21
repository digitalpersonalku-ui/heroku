// ═══════════════════════════════════════════════════════════
// HEROKU EMOTIONAL REWARD SYSTEM v1.0
// File: js/emotional-reward.js
//
// Pasang di index.html — PALING TERAKHIR setelah app-fixes.js:
//   <script src="js/emotional-reward.js"></script>
//
// Sistem ini MENAMBAHKAN lapisan emosi di atas celebration
// yang sudah ada — tidak mengganti, tidak merusak.
//
// 4 Momen Emosional Utama:
//   1. PERFECT DAY  — 7/7 misi selesai
//   2. LEVEL UP     — naik level
//   3. BADGE UNLOCK — badge baru terbuka
//   4. BUILDING     — bangunan baru terbuka
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─── Guard ───────────────────────────────────────────────
  function G() { return typeof gsap !== 'undefined'; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function name() {
    if (typeof CU === 'undefined' || !CU) return 'Adik';
    return CU.nickname || (CU.name || '').split(' ')[0] || 'Adik';
  }

  // ═══════════════════════════════════════════════════════════
  // DATABASE COPYWRITING
  // Setiap momen punya 3 variasi — dipilih acak
  // Dirancang untuk usia 6-12 tahun: singkat, konkret, hangat
  // ═══════════════════════════════════════════════════════════

  const COPY = {

    // ── Perfect Day ─────────────────────────────────────────
    // Trigger: 7/7 misi selesai dalam satu hari
    // Emosi target: kebanggaan + kejutan + koneksi keluarga
    perfectDay: [
      {
        headline: 'HARI SEMPURNA!!!',
        sub: 'MasyaAllah {name} — 7 dari 7!\nKamu luar biasa hari ini! 🌟',
        detail: 'Orang tuamu pasti sangat bangga.',
        cta: 'Ambil Hadiah Spesialmu! 🎁',
        syekh: 'Subhanallah {name}!\n7 kebiasaan — semua selesai!\nInilah anak yang Allah cintai.',
      },
      {
        headline: '7/7 SEMPURNA!',
        sub: '{name} adalah bintang hari ini! ⭐\nTak satu pun kebiasaan yang terlewat!',
        detail: 'Hari ini akan selalu dikenang di desamu.',
        cta: 'Rayakan Bersama! 🎉',
        syekh: 'MasyaAllah tabarakallah {name}!\nSyekh sangat bangga padamu hari ini.',
      },
      {
        headline: 'LUAR BIASA!!!',
        sub: 'Semua 7 kebiasaan SELESAI! 🏆\n{name} membuktikan: bisa!',
        detail: 'Desamu bercahaya karena kebaikanmu.',
        cta: 'Lihat Hadiahmu! ✨',
        syekh: '{name}, kamu baru saja membuat\nSeluruh desa bersuka cita!',
      },
    ],

    // ── Level Up ─────────────────────────────────────────────
    // Trigger: XP penuh, naik ke level berikutnya
    // Emosi target: kejutan + identitas baru + antisipasi
    levelUp: {
      2:  { title: 'PENJELAJAH MUDA!',   desc: '{name} mulai perjalanan hebat!',    power: 'Kamu bisa membuka bangunan baru!' },
      3:  { title: 'BINTANG BERBINAR!',  desc: 'Cahayamu mulai menerangi desa!',    power: 'Syekh percaya padamu sekarang!' },
      4:  { title: 'PAHLAWAN CILIK!',    desc: '{name} semakin kuat setiap hari!',  power: 'Kamu inspirasi teman-temanmu!' },
      5:  { title: 'PEMBELA KEBAIKAN!',  desc: 'Namamu dikenal di seluruh desa!',   power: 'Kartu langka kini bisa kamu dapatkan!' },
      6:  { title: 'PENJAGA AMANAH!',    desc: 'Warga desa percaya padamu!',        power: 'Kamu hampir mencapai puncak!' },
      7:  { title: 'PEMIMPIN MUDA!',     desc: 'Anak-anak desa mengikutimu!',       power: 'Hanya 3 level lagi menuju puncak!' },
      8:  { title: 'ULAMA CILIK!',       desc: 'Ilmu dan akhlakmu menginspirasi!',  power: 'Hampir menjadi legenda!' },
      9:  { title: 'PEWARIS NABI!',      desc: 'Jejak para ulama kamu teruskan!',   power: 'Satu langkah lagi ke puncak!' },
      10: { title: 'LEGENDA HEROKU!!!',  desc: '{name} — nama yang abadi!',         power: 'Kamu telah mencapai yang tertinggi!' },
    },

    // ── Building Unlock ─────────────────────────────────────
    // Trigger: koin mencapai minKoin bangunan baru
    // Emosi target: kejutan + rasa memiliki + kontribusi
    building: {
      'Pondok Pertama': {
        moment: 'Rumahmu berdiri di desa!',
        feeling: 'Dari sinilah semua dimulai, {name}.',
        impact: 'Warga desa punya tempat untuk beristirahat.',
        hadisNote: '"Rumah yang baik dimulai dari hati yang baik."',
      },
      'Pohon Rezeki': {
        moment: 'Pohon ajaib tumbuh di desamu!',
        feeling: '{name}, kebaikanmu kini berbuah nyata!',
        impact: 'Buahnya memberi makan seluruh warga desa.',
        hadisNote: '"Sedekah tidak mengurangi harta." — Rasulullah ﷺ',
      },
      'Kolam Berkah': {
        moment: 'Air jernih mengalir di desamu!',
        feeling: 'Ilmumu seperti air — terus mengalir!',
        impact: 'Tak ada lagi yang kehausan di desamu.',
        hadisNote: '"Ilmu yang bermanfaat terus mengalir pahalanya."',
      },
      'Masjid Al-Fath': {
        moment: 'MASJID BERDIRI DI DESAMU!!!',
        feeling: '{name}, ini pencapaian luar biasa!',
        impact: 'Adzan pertama berkumandang — seluruh desa hening.',
        hadisNote: '"Barangsiapa membangun masjid, Allah bangunkan rumah di surga."',
      },
      'Sekolah Ilmu': {
        moment: 'Sekolah hadir untuk generasi berikutnya!',
        feeling: 'Kamu tidak hanya belajar — kamu membangun masa depan!',
        impact: 'Anak-anak desa kini punya tempat menuntut ilmu.',
        hadisNote: '"Menuntut ilmu adalah kewajiban setiap Muslim."',
      },
      'Pasar Amanah': {
        moment: 'Pusat ekonomi desa terbuka!',
        feeling: 'Kejujuranmu membangun kepercayaan {name}!',
        impact: 'Desa makin makmur berkat amanah yang kamu jaga.',
        hadisNote: '"Pedagang jujur bersama para Nabi di hari kiamat."',
      },
      'Lapangan Sehat': {
        moment: 'Tempat bermain tersedia untuk semua!',
        feeling: '{name}, tubuh sehat adalah amanah terjaga!',
        impact: 'Tawa anak-anak memenuhi desamu setiap hari.',
        hadisNote: '"Mukmin yang kuat lebih dicintai Allah."',
      },
      'Pustaka Cahaya': {
        moment: 'Cahaya ilmu bersinar di desamu!',
        feeling: 'Ini warisanmu yang tak ternilai, {name}!',
        impact: 'Lampu pustaka tidak pernah padam setiap malam.',
        hadisNote: '"Sebaik-baik manusia yang paling bermanfaat bagi lainnya."',
      },
      'Taman Surga': {
        moment: 'Keindahan surga hadir di desamu!',
        feeling: 'Hatimu yang indah menciptakan keindahan, {name}!',
        impact: 'Bunga mekar sepanjang tahun tanpa henti.',
        hadisNote: '"Allah itu indah dan menyukai keindahan."',
      },
      'Istana Pahlawan': {
        moment: '🏰 ISTANA PAHLAWAN BERDIRI!!! 🏰',
        feeling: '{name} — kamu telah membangun PERADABAN!',
        impact: 'Namamu akan dikenang selamanya di tanah ini.',
        hadisNote: '"Yang paling mulia adalah yang paling bertakwa." — QS Al-Hujurat',
      },
    },

    // ── Badge Unlock ─────────────────────────────────────────
    // Emosi target: identitas + keistimewaan + cerita
    badge: [
      { reaction: 'WOW, {name}!',        sub: 'Badge langka baru masuk koleksimu!' },
      { reaction: 'LUAR BIASA!',         sub: '{name} mendapat pengakuan khusus!' },
      { reaction: 'MASYAALLAH!',         sub: 'Pencapaian ini tidak semua orang bisa!' },
    ],
  };

  // ═══════════════════════════════════════════════════════════
  // AUDIO ENGINE — suara emosional per momen
  // Tanpa file MP3, murni Web Audio API
  // ═══════════════════════════════════════════════════════════

  let _ac = null;
  function getAC() {
    if (!_ac) try { _ac = new (W.AudioContext || W.webkitAudioContext)(); } catch(e) {}
    return _ac;
  }
  function rAC() { const c = getAC(); if (c && c.state === 'suspended') c.resume(); }

  function tone(freq, type, gain, attack, sustain, release, start) {
    const c = getAC(); if (!c) return; rAC();
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    const t = start || c.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, t + attack + sustain);
    g.gain.linearRampToValueAtTime(0, t + attack + sustain + release);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + attack + sustain + release + 0.05);
  }

  const SOUND = {

    // Perfect Day — fanfare megah + pelangi nada
    perfectDay() {
      const c = getAC(); if (!c) return; rAC();
      const t = c.currentTime;
      // Chord pembuka
      [523, 659, 784].forEach((f, i) => tone(f, 'sine', .12, .01, .1, .08, t + i * .05));
      // Fanfare naik
      setTimeout(() => {
        [784, 988, 1175, 1319, 1568].forEach((f, i) =>
          tone(f, 'triangle', .15, .01, .08, .1, c.currentTime + i * .1));
      }, 300);
      // Akhiran megah
      setTimeout(() => {
        [1047, 1319, 1568].forEach((f, i) =>
          tone(f, 'sine', .18, .02, .3, .15, c.currentTime + i * .08));
      }, 900);
    },

    // Level Up — tangga nada naik dramatis
    levelUp() {
      const c = getAC(); if (!c) return; rAC();
      const scale = [523, 587, 659, 698, 784, 880, 988, 1047];
      scale.forEach((f, i) =>
        tone(f, 'sine', .14, .01, .05, .08, c.currentTime + i * .08));
      // Chord akhir
      setTimeout(() => {
        [784, 988, 1175].forEach((f, i) =>
          tone(f, 'triangle', .16, .02, .25, .12, getAC().currentTime + i * .04));
      }, 700);
    },

    // Building — bunyi konstruksi + fanfare
    building(isMasjid) {
      const c = getAC(); if (!c) return; rAC();
      if (isMasjid) {
        // Masjid = bunyi adzan sederhana
        [392, 440, 494, 523, 587].forEach((f, i) =>
          tone(f, 'sine', .13, .02, .12, .1, c.currentTime + i * .15));
        setTimeout(() => {
          [784, 880, 784, 659].forEach((f, i) =>
            tone(f, 'sine', .12, .02, .15, .12, getAC().currentTime + i * .18));
        }, 900);
      } else {
        // Bangunan biasa = ding ascending
        [440, 554, 659, 784].forEach((f, i) =>
          tone(f, 'triangle', .13, .01, .08, .1, c.currentTime + i * .12));
        setTimeout(() => {
          tone(880, 'sine', .15, .02, .2, .15, getAC().currentTime);
        }, 550);
      }
    },

    // Badge = stamp + shimmer
    badge() {
      const c = getAC(); if (!c) return; rAC();
      [392, 494, 587, 784].forEach((f, i) =>
        tone(f, 'triangle', .14, .01, .07, .09, c.currentTime + i * .1));
      setTimeout(() => {
        [1047, 1319, 1568].forEach((f, i) =>
          tone(f, 'sine', .1, .01, .05, .08, getAC().currentTime + i * .07));
      }, 450);
    },

    // Haptic vibrate
    vib(pattern) {
      if (navigator.vibrate) navigator.vibrate(pattern);
    },
  };

  // ═══════════════════════════════════════════════════════════
  // ANIMASI ENGINE — GSAP + CSS
  // ═══════════════════════════════════════════════════════════

  function injectStyles() {
    if (document.getElementById('_er_css')) return;
    const s = document.createElement('style');
    s.id = '_er_css';
    s.textContent = `
/* ── Overlay emosional ── */
#_er_overlay {
  position: fixed; inset: 0; z-index: 8000;
  display: none; align-items: center; justify-content: center;
  padding: 20px; flex-direction: column;
  background: rgba(8,8,16,.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
#_er_overlay.show { display: flex; }

/* ── Box utama ── */
#_er_box {
  position: relative; border-radius: 26px; padding: 28px 22px 24px;
  max-width: 310px; width: 100%; text-align: center;
  overflow: hidden; will-change: transform;
}

/* ── Sinar latar ── */
._er_rays {
  position: absolute; inset: 0; overflow: hidden; pointer-events: none;
}
._er_ray {
  position: absolute; top: 50%; left: 50%; width: 1px;
  transform-origin: 0 0;
  background: linear-gradient(to top, transparent, rgba(255,255,255,.09), transparent);
  animation: erRay 8s linear infinite;
}
@keyframes erRay { from{transform:rotate(var(--r)) translateX(-50%)} to{transform:rotate(calc(var(--r) + 360deg)) translateX(-50%)} }

/* ── Star background ── */
._er_star {
  position: absolute; border-radius: 50%;
  background: rgba(255,255,255,.6);
  animation: erStar var(--d,2s) ease-in-out infinite var(--dl,0s);
}
@keyframes erStar {
  0%,100%{opacity:.1;transform:scale(.6)}
  50%{opacity:1;transform:scale(1.4)}
}

/* ── Emoji utama ── */
._er_emoji {
  font-size: 72px; display: block; margin-bottom: 8px;
  will-change: transform;
}

/* ── Teks ── */
._er_headline {
  font-size: 26px; font-weight: 900; color: #fff;
  line-height: 1.1; margin-bottom: 6px;
  text-shadow: 0 0 20px currentColor;
}
._er_sub {
  font-size: 13px; color: rgba(255,255,255,.65);
  line-height: 1.7; margin-bottom: 6px;
  white-space: pre-line;
}
._er_detail {
  font-size: 11px; color: rgba(255,255,255,.4);
  margin-bottom: 20px; font-style: italic;
}

/* ── Hadis quote box ── */
._er_hadis {
  background: rgba(255,255,255,.07);
  border-left: 3px solid rgba(255,220,100,.6);
  border-radius: 0 10px 10px 0;
  padding: 9px 12px; margin-bottom: 18px;
  font-size: 11px; color: rgba(255,220,100,.85);
  line-height: 1.7; text-align: left;
}

/* ── Stats row ── */
._er_stats {
  display: flex; gap: 8px; justify-content: center;
  flex-wrap: wrap; margin-bottom: 18px;
}
._er_chip {
  padding: 5px 13px; border-radius: 20px;
  font-size: 12px; font-weight: 800; color: #fff;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.15);
}
._er_chip.gold   { background:rgba(241,196,15,.18); border-color:rgba(241,196,15,.4); color:#FFE066; }
._er_chip.green  { background:rgba(46,204,113,.18); border-color:rgba(46,204,113,.4); color:#52D98A; }
._er_chip.purple { background:rgba(155,89,182,.2);  border-color:rgba(155,89,182,.4); color:#D7BDE2; }
._er_chip.blue   { background:rgba(52,152,219,.18); border-color:rgba(52,152,219,.4); color:#74B9FF; }

/* ── Progress bar ── */
._er_bar_wrap {
  background: rgba(255,255,255,.1); border-radius: 5px;
  height: 7px; overflow: hidden; margin-bottom: 18px;
}
._er_bar {
  height: 100%; border-radius: 5px; width: 0%;
  background: linear-gradient(90deg, #FFE066, #E67E22);
  transition: width 1.4s cubic-bezier(.22,1,.36,1);
}

/* ── Button ── */
._er_btn {
  width: 100%; padding: 15px; border: none;
  border-radius: 16px; font-size: 15px; font-weight: 900;
  cursor: pointer; transition: transform .15s;
  font-family: inherit;
}
._er_btn:active { transform: scale(.97); }
._er_btn.gold   { background:linear-gradient(135deg,#FFE066,#E67E22);color:#1A1A2E; box-shadow:0 5px 18px rgba(241,196,15,.35); }
._er_btn.green  { background:linear-gradient(135deg,#2ECC71,#27AE60);color:#fff;    box-shadow:0 5px 18px rgba(46,204,113,.35); }
._er_btn.blue   { background:linear-gradient(135deg,#3498DB,#1A5276);color:#fff;    box-shadow:0 5px 18px rgba(52,152,219,.35); }
._er_btn.purple { background:linear-gradient(135deg,#8E44AD,#6C3483);color:#fff;    box-shadow:0 5px 18px rgba(142,68,173,.35); }

/* ── Syekh whisper ── */
._er_syekh {
  display: flex; gap: 10px; align-items: flex-start;
  background: rgba(46,204,113,.08);
  border: 1px solid rgba(46,204,113,.2);
  border-radius: 14px; padding: 10px 12px;
  margin-bottom: 18px; text-align: left;
}
._er_syekh_av {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg,#27AE60,#0E6655);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
._er_syekh_txt {
  font-size: 11px; color: rgba(255,255,255,.75);
  line-height: 1.65; white-space: pre-line;
}

/* ── Level number dramatis ── */
._er_lvnum {
  font-size: 96px; font-weight: 900; line-height: 1;
  display: block; margin-bottom: 6px;
  color: #FFE066;
  text-shadow: 0 0 30px rgba(255,224,0,.5), 0 0 60px rgba(255,180,0,.2);
}

/* ── Badge stamp ── */
._er_badge_ring {
  position: relative; width: 100px; height: 100px;
  margin: 0 auto 14px;
}
._er_badge_ro {
  position: absolute; inset: 0; border-radius: 50%;
  border: 2.5px solid rgba(230,126,34,.4);
  animation: erRingR 8s linear infinite;
}
._er_badge_ri {
  position: absolute; inset: 8px; border-radius: 50%;
  border: 2px dashed rgba(230,126,34,.2);
  animation: erRingR 6s linear infinite reverse;
}
@keyframes erRingR { from{transform:rotate(0)} to{transform:rotate(360deg)} }
._er_badge_ic {
  position: absolute; inset: 16px; border-radius: 50%;
  background: rgba(230,126,34,.12);
  border: 2px solid rgba(230,126,34,.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 34px;
}

/* ── Float labels ── */
._er_float {
  position: fixed; pointer-events: none; z-index: 9000;
  font-weight: 900; font-size: 15px; border-radius: 22px;
  padding: 5px 13px; will-change: transform,opacity;
}
._er_float_koin { background:linear-gradient(135deg,#FFE066,#D68910);color:#1A1A2E; }
._er_float_xp   { background:linear-gradient(135deg,#8E44AD,#6C3483);color:#fff; }

/* ── Particle ── */
._er_pt { position:fixed;pointer-events:none;z-index:8500;border-radius:50%;will-change:transform,opacity; }

/* ── Canvas konfeti ── */
#_er_canvas { position:fixed;inset:0;pointer-events:none;z-index:8100;width:100%;height:100%; }

/* ── Theme per momen ── */
.er-perfect { background:linear-gradient(160deg,#1A1A2E,#0D1B3E,#1A1A2E); border:1.5px solid rgba(255,224,0,.2); }
.er-levelup { background:linear-gradient(160deg,#1A1A2E,#3D1A78,#1A1A2E); border:1.5px solid rgba(142,68,173,.3); }
.er-badge   { background:linear-gradient(160deg,#1A1A2E,#1A3515,#1A1A2E); border:1.5px solid rgba(230,126,34,.3); }
.er-building{ background:linear-gradient(160deg,#0B1E3B,#1A1A2E,#0B2B3B); border:1.5px solid rgba(52,152,219,.3); }
.er-masjid  { background:linear-gradient(160deg,#1A0A2E,#2A1040,#1A0A2E); border:1.5px solid rgba(155,89,182,.4); }
.er-istana  { background:linear-gradient(160deg,#2A0808,#1A1A2E,#2A0808); border:1.5px solid rgba(231,76,60,.4); }
    `;
    document.head.appendChild(s);
  }

  // ── Inject HTML ──────────────────────────────────────────
  function injectHTML() {
    if (document.getElementById('_er_overlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
<canvas id="_er_canvas"></canvas>
<div id="_er_overlay">
  <div id="_er_box">
    <div class="_er_rays" id="_er_rays"></div>
    <div id="_er_stars"></div>
    <span class="_er_emoji" id="_er_emoji">🎉</span>
    <span class="_er_lvnum" id="_er_lvnum" style="display:none">5</span>
    <div class="_er_badge_ring" id="_er_badge_ring" style="display:none">
      <div class="_er_badge_ro"></div>
      <div class="_er_badge_ri"></div>
      <div class="_er_badge_ic" id="_er_badge_ic">🏅</div>
    </div>
    <div class="_er_headline" id="_er_headline">LUAR BIASA!</div>
    <div class="_er_sub"     id="_er_sub"></div>
    <div class="_er_hadis"   id="_er_hadis" style="display:none"></div>
    <div class="_er_syekh"   id="_er_syekh" style="display:none">
      <div class="_er_syekh_av">🧕</div>
      <div class="_er_syekh_txt" id="_er_syekh_txt"></div>
    </div>
    <div class="_er_stats"   id="_er_stats"></div>
    <div class="_er_bar_wrap" id="_er_bar_wrap" style="display:none">
      <div class="_er_bar" id="_er_bar"></div>
    </div>
    <div class="_er_detail"  id="_er_detail"></div>
    <button class="_er_btn gold" id="_er_btn" onclick="ER.close()">Lanjutkan! 🚀</button>
  </div>
</div>
    `);
  }

  // ── Konfeti Engine ───────────────────────────────────────
  let _cp = [], _craf = null, _ca = false;
  const CC = ['#FFE066','#FF6B35','#52D98A','#6C5CE7','#FF7675','#74B9FF','#FD79A8','#A29BFE'];

  function cResize() {
    const cv = document.getElementById('_er_canvas');
    if (cv) { cv.width = window.innerWidth; cv.height = window.innerHeight; }
  }
  window.addEventListener('resize', cResize);

  function cNewPiece(x, y, sp) {
    const cv = document.getElementById('_er_canvas');
    sp = sp || 1;
    return {
      x: x != null ? x : Math.random() * (cv?.width || 400),
      y: y != null ? y : -10,
      vx: (Math.random() - .5) * 9 * sp, vy: Math.random() * 5 + 2,
      rot: Math.random() * 360, rotV: (Math.random() - .5) * 9,
      w: 7 + Math.random() * 9, h: 4 + Math.random() * 7,
      color: CC[Math.floor(Math.random() * CC.length)],
      shape: Math.random() > .5 ? 'rect' : 'circle',
      gravity: .14 + Math.random() * .1, life: 1,
    };
  }

  function cTick() {
    const cv = document.getElementById('_er_canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    _cp = _cp.filter(p => {
      p.x += p.vx; p.vy += p.gravity; p.y += p.vy;
      p.rot += p.rotV; p.vx *= .99; p.life -= .007;
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath(); ctx.ellipse(0, 0, p.w/2, p.h/2, 0, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      }
      ctx.restore();
      return p.life > 0 && p.y < cv.height + 50;
    });
    if (_cp.length > 0) _craf = requestAnimationFrame(cTick);
    else { _ca = false; ctx.clearRect(0, 0, cv.width, cv.height); }
  }

  function confetti(n, sp, x, y) {
    cResize();
    for (let i = 0; i < (n || 60); i++) _cp.push(cNewPiece(x, y, sp));
    if (!_ca) { _ca = true; if (_craf) cancelAnimationFrame(_craf); cTick(); }
  }

  function confettiStop() {
    _cp = []; _ca = false;
    const cv = document.getElementById('_er_canvas');
    if (cv) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
  }

  // ── Partikel burst ───────────────────────────────────────
  function burst(x, y, colors, n) {
    if (!G()) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8500;overflow:hidden';
    document.body.appendChild(wrap);
    for (let i = 0; i < (n || 14); i++) {
      const p = document.createElement('div');
      p.className = '_er_pt';
      const sz = 7 + Math.random() * 8;
      p.style.cssText = `width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${x}px;top:${y}px`;
      wrap.appendChild(p);
      const a = (i / (n || 14)) * Math.PI * 2, d = 50 + Math.random() * 65;
      gsap.fromTo(p, { x: 0, y: 0, opacity: 1, scale: 1 }, {
        x: Math.cos(a) * d, y: Math.sin(a) * d,
        opacity: 0, scale: .2,
        duration: .7 + Math.random() * .3,
        delay: Math.random() * .1, ease: 'power2.out',
      });
    }
    setTimeout(() => wrap.remove(), 1300);
  }

  // ── Float label (XP/Koin) ────────────────────────────────
  function floatLabel(txt, cls, x, y) {
    if (!G()) return;
    const el = document.createElement('div');
    el.className = '_er_float ' + cls;
    el.textContent = txt;
    document.body.appendChild(el);
    el.style.left = (x - 50) + 'px';
    el.style.top  = y + 'px';
    gsap.fromTo(el,
      { opacity: 0, y: 0, scale: .7 },
      { opacity: 1, y: -60, scale: 1.05, duration: .35, ease: 'back.out(2)',
        onComplete: () => gsap.to(el, { opacity: 0, y: '-=18', duration: .32, delay: .65,
          onComplete: () => el.remove() }) });
  }

  // ── Helper build overlay ─────────────────────────────────
  function tmpl(str) {
    return str.replace(/\{name\}/g, name());
  }

  function makeStars(n) {
    const el = document.getElementById('_er_stars');
    if (!el) return; el.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = '_er_star';
      const sz = 2 + Math.random() * 3;
      d.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${1.5+Math.random()*2}s;--dl:${Math.random()*1.5}s;position:absolute`;
      el.appendChild(d);
    }
  }

  function makeRays(n, h) {
    const el = document.getElementById('_er_rays');
    if (!el) return; el.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const r = document.createElement('div');
      r.className = '_er_ray';
      r.style.cssText = `height:${h||220}px;--r:${i*(360/n)}deg;opacity:${.04+Math.random()*.08}`;
      el.appendChild(r);
    }
  }

  function setChips(chips) {
    const el = document.getElementById('_er_stats');
    if (!el) return; el.innerHTML = '';
    chips.forEach(c => {
      const d = document.createElement('div');
      d.className = '_er_chip ' + (c.cls || '');
      d.textContent = c.t;
      el.appendChild(d);
    });
  }

  function showOverlay(theme, onReady) {
    const ov = document.getElementById('_er_overlay');
    const bx = document.getElementById('_er_box');
    if (!ov || !bx) return;

    // Reset semua optional elements
    ['_er_hadis','_er_syekh','_er_bar_wrap'].forEach(id => {
      const e = document.getElementById(id);
      if (e) e.style.display = 'none';
    });
    document.getElementById('_er_emoji').style.display = 'block';
    document.getElementById('_er_lvnum').style.display = 'none';
    document.getElementById('_er_badge_ring').style.display = 'none';

    // Set theme class
    bx.className = theme;

    if (onReady) onReady();

    ov.classList.add('show');

    // Animate masuk
    if (G()) {
      gsap.fromTo(bx,
        { scale: .45, opacity: 0, rotationX: -15 },
        { scale: 1, opacity: 1, rotationX: 0, duration: .55, ease: 'back.out(1.9)' });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 4 MOMEN UTAMA
  // ═══════════════════════════════════════════════════════════

  const ER = {};

  // ── 1. PERFECT DAY ──────────────────────────────────────
  // Trigger: done === 7
  // Urutan: Konfeti → Overlay dramatis → Float label → Haptic megah
  ER.perfectDay = function () {
    const c = pick(COPY.perfectDay);
    const n = name();
    makeStars(20); makeRays(16, 260);

    showOverlay('_er_box er-perfect', () => {
      document.getElementById('_er_emoji').textContent = '👑';
      document.getElementById('_er_headline').textContent = c.headline;
      document.getElementById('_er_sub').textContent = tmpl(c.sub);
      document.getElementById('_er_detail').textContent = c.detail;
      document.getElementById('_er_btn').textContent = c.cta;
      document.getElementById('_er_btn').className = '_er_btn gold';

      // Chips reward
      setChips([
        { t: '⭐ +100 Koin Bonus', cls: 'gold' },
        { t: '✨ +200 XP', cls: 'purple' },
        { t: '🔥 Streak Bertambah', cls: 'green' },
      ]);

      // Syekh whisper
      const syEl = document.getElementById('_er_syekh');
      const syTxt = document.getElementById('_er_syekh_txt');
      if (syEl && syTxt) {
        syEl.style.display = 'flex';
        syTxt.textContent = tmpl(c.syekh);
      }

      // Progress bar → 100%
      const barWrap = document.getElementById('_er_bar_wrap');
      const bar = document.getElementById('_er_bar');
      if (barWrap && bar) {
        barWrap.style.display = 'block';
        bar.style.background = 'linear-gradient(90deg,#52D98A,#2ECC71)';
        setTimeout(() => { bar.style.width = '100%'; }, 500);
      }
    });

    // GSAP: crown bounce
    if (G()) {
      const em = document.getElementById('_er_emoji');
      setTimeout(() => {
        gsap.fromTo(em, { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: .5, delay: .15, ease: 'back.out(2.6)' });
        gsap.to(em, { y: -8, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: .7 });
      }, 100);

      // Chips masuk
      setTimeout(() => {
        const chips = document.querySelectorAll('._er_chip');
        gsap.fromTo(chips, { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: .08, duration: .3, ease: 'power3.out' });
      }, 350);

      // Btn masuk
      setTimeout(() => {
        const btn = document.getElementById('_er_btn');
        gsap.fromTo(btn, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .35, ease: 'power3.out' });
      }, 550);
    }

    // Konfeti triple burst
    confetti(90, 1.8);
    setTimeout(() => confetti(55, 1.3, window.innerWidth * .2), 550);
    setTimeout(() => confetti(55, 1.3, window.innerWidth * .8), 900);

    // Float labels
    const cx = window.innerWidth / 2;
    setTimeout(() => floatLabel('⭐ +100 Koin', '_er_float_koin', cx - 40, 120), 300);
    setTimeout(() => floatLabel('✨ +200 XP',   '_er_float_xp',   cx + 40, 120), 500);

    // Sound + haptic
    SOUND.perfectDay();
    SOUND.vib([40, 15, 40, 15, 80, 15, 40, 15, 100]);

    // Syekh berbicara (jika SAF tersedia)
    if (typeof SAF !== 'undefined') {
      setTimeout(() => SAF.speak(tmpl(c.syekh)), 2000);
    }
  };

  // ── 2. LEVEL UP ─────────────────────────────────────────
  // Trigger: CU.level meningkat
  // Urutan: Angka dramatis → Identitas baru → Konfeti → Perks
  ER.levelUp = function (level, perks) {
    level = level || (typeof CU !== 'undefined' ? CU.level : 1);
    const lvData = COPY.levelUp[Math.min(level, 10)] || COPY.levelUp[2];
    makeStars(18); makeRays(14, 250);

    showOverlay('_er_box er-levelup', () => {
      // Sembunyikan emoji biasa, tampilkan angka besar
      document.getElementById('_er_emoji').style.display = 'none';
      const lvNum = document.getElementById('_er_lvnum');
      lvNum.style.display = 'block';
      lvNum.textContent = level;

      document.getElementById('_er_headline').textContent = lvData.title;
      document.getElementById('_er_sub').textContent = tmpl(lvData.desc);
      document.getElementById('_er_detail').textContent = lvData.power;
      document.getElementById('_er_btn').textContent = 'Lanjutkan! 🚀';
      document.getElementById('_er_btn').className = '_er_btn gold';

      // Chips perks
      const chipData = [{ t: '🎊 Level ' + level + '!', cls: 'gold' }];
      if (perks && perks.length) {
        perks.forEach(p => chipData.push({ t: p, cls: 'purple' }));
      }
      setChips(chipData);

      // Progress bar ke 0% (level baru dimulai)
      const barWrap = document.getElementById('_er_bar_wrap');
      const bar = document.getElementById('_er_bar');
      if (barWrap && bar) {
        barWrap.style.display = 'block';
        bar.style.background = 'linear-gradient(90deg,#8E44AD,#6C3483)';
        setTimeout(() => { bar.style.width = '5%'; }, 600); // baru mulai
      }
    });

    // GSAP: angka muncul dramatis
    if (G()) {
      const lvNum = document.getElementById('_er_lvnum');
      setTimeout(() => {
        gsap.fromTo(lvNum,
          { scale: .2, opacity: 0, rotation: -12 },
          { scale: 1.15, opacity: 1, rotation: 0, duration: .45, delay: .1, ease: 'back.out(2.8)',
            onComplete: () => gsap.to(lvNum, { scale: 1, duration: .22, ease: 'power2.out' }) });
        // Sinar berputar
        const rays = document.querySelectorAll('._er_ray');
        if (rays.length) gsap.to(rays, { rotation: '+=360', duration: 10, ease: 'none', repeat: -1 });
      }, 100);

      // Chips + btn
      setTimeout(() => {
        const chips = document.querySelectorAll('._er_chip');
        gsap.fromTo(chips, { opacity: 0, x: -16 }, { opacity: 1, x: 0, stagger: .09, duration: .28, ease: 'power3.out' });
      }, 400);
      setTimeout(() => {
        gsap.fromTo(document.getElementById('_er_btn'), { opacity: 0, scale: .8 }, { opacity: 1, scale: 1, duration: .38, ease: 'back.out(1.6)' });
      }, 600);
    }

    confetti(100, 2.0);
    setTimeout(() => confetti(60, 1.4, window.innerWidth * .15), 380);
    setTimeout(() => confetti(60, 1.4, window.innerWidth * .85), 720);

    SOUND.levelUp();
    SOUND.vib([40, 14, 40, 14, 80, 14, 40, 14, 100]);

    if (typeof SAF !== 'undefined') {
      setTimeout(() => SAF.speak(`MasyaAllah ${name()}!\nLevel ${level} — ${lvData.title}\n${lvData.power}`), 1800);
    }
  };

  // ── 3. BADGE UNLOCK ─────────────────────────────────────
  // Trigger: badge baru terbuka
  // Urutan: Stamp dramatis → Ring berputar → Burst partikel
  ER.badge = function (icon, badgeName, requirement, koin, xp) {
    icon = icon || '🏅';
    const c = pick(COPY.badge);
    makeStars(16);

    showOverlay('_er_box er-badge', () => {
      // Sembunyikan emoji, tampilkan badge ring
      document.getElementById('_er_emoji').style.display = 'none';
      const ring = document.getElementById('_er_badge_ring');
      const ic   = document.getElementById('_er_badge_ic');
      if (ring) ring.style.display = 'block';
      if (ic)   ic.textContent = icon;

      document.getElementById('_er_headline').textContent = tmpl(c.reaction);
      document.getElementById('_er_sub').textContent = `${badgeName || 'Badge Baru'}\n${tmpl(c.sub)}`;
      document.getElementById('_er_detail').textContent = requirement || '';
      document.getElementById('_er_btn').textContent = 'Keren! 🎉';
      document.getElementById('_er_btn').className = '_er_btn gold';

      setChips([
        { t: `⭐ +${koin || 50} Koin`, cls: 'gold' },
        { t: `✨ +${xp || 100} XP`,   cls: 'purple' },
        { t: '🏅 Badge Tersimpan',     cls: 'green' },
      ]);
    });

    // GSAP: stamp dari besar ke normal + shake
    if (G()) {
      const ic = document.getElementById('_er_badge_ic');
      setTimeout(() => {
        gsap.fromTo(ic,
          { scale: 3.5, opacity: 0, rotation: 20 },
          { scale: 1, opacity: 1, rotation: 0, duration: .45, delay: .22, ease: 'back.out(2.2)',
            onComplete: () => {
              // Shake kecil = efek stamp
              gsap.fromTo(ic, { x: -5 }, { x: 5, duration: .06, repeat: 5, yoyo: true, ease: 'none',
                onComplete: () => gsap.set(ic, { x: 0 }) });
            } });
        // Ring masuk
        const rings = document.querySelectorAll('._er_badge_ro,._er_badge_ri');
        gsap.fromTo(rings, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, delay: .14, ease: 'power2.out' });

        // Chips + btn
        setTimeout(() => {
          gsap.fromTo(document.querySelectorAll('._er_chip'), { opacity: 0, y: 11 }, { opacity: 1, y: 0, stagger: .07, duration: .28, ease: 'power3.out' });
          gsap.fromTo(document.getElementById('_er_btn'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, delay: .15, duration: .28, ease: 'power3.out' });
        }, 500);
      }, 100);
    }

    // Burst dari posisi badge ring
    setTimeout(() => {
      const ring = document.getElementById('_er_badge_ring');
      if (ring) {
        const r = ring.getBoundingClientRect();
        burst(r.left + r.width/2, r.top + r.height/2, ['#E67E22','#F1C40F','#FFD700','#D35400'], 16);
      }
    }, 280);

    confetti(50, 1.2);
    SOUND.badge();
    SOUND.vib([28, 14, 28, 14, 60]);
  };

  // ── 4. BUILDING UNLOCK ──────────────────────────────────
  // Trigger: setelah showBuildingUnlock (existing) selesai
  // Urutan: Ring burst → Float bangunan → Village story → Hadis
  ER.building = function (buildingName, emoji) {
    buildingName = buildingName || 'Bangunan Baru';
    emoji = emoji || '🏗️';
    const data = COPY.building[buildingName] || {
      moment: buildingName + ' terbuka!',
      feeling: `${name()} — pencapaian luar biasa!`,
      impact: 'Desamu semakin berkembang!',
      hadisNote: '"Sebaik-baik manusia yang paling bermanfaat." — HR. Thabrani',
    };

    const isMasjid  = buildingName === 'Masjid Al-Fath';
    const isIstana  = buildingName === 'Istana Pahlawan';
    const theme     = isMasjid ? 'er-masjid' : isIstana ? 'er-istana' : 'er-building';

    makeStars(14); makeRays(12, 200);

    showOverlay(`_er_box ${theme}`, () => {
      document.getElementById('_er_emoji').textContent = emoji;
      document.getElementById('_er_headline').textContent = data.moment;
      document.getElementById('_er_sub').textContent = tmpl(data.feeling) + '\n\n' + data.impact;
      document.getElementById('_er_detail').textContent = '';

      // Hadis box
      const hadisEl = document.getElementById('_er_hadis');
      if (hadisEl) {
        hadisEl.style.display = 'block';
        hadisEl.textContent = data.hadisNote;
      }

      setChips([
        { t: '🏗️ Bangunan Baru',    cls: 'blue' },
        { t: '⭐ Koin Tersimpan',    cls: 'gold' },
        { t: '🌍 Desa Berkembang',   cls: 'green' },
      ]);

      const btnText = isIstana ? 'Lihat Istanamu! 🏰' :
                      isMasjid ? 'Kunjungi Masjid! 🕌' : 'Kunjungi Desa! 🌍';
      document.getElementById('_er_btn').textContent = btnText;
      document.getElementById('_er_btn').className = '_er_btn blue';
    });

    // GSAP: emoji drop dari atas
    if (G()) {
      const em = document.getElementById('_er_emoji');
      setTimeout(() => {
        gsap.fromTo(em,
          { y: -90, opacity: 0, scale: 1.8, rotation: -12 },
          { y: 0, opacity: 1, scale: 1, rotation: 0, duration: .6, delay: .1, ease: 'bounce.out' });
        // Float terus
        gsap.to(em, { y: -8, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: .8 });

        // Teks masuk
        setTimeout(() => {
          gsap.fromTo([
            document.getElementById('_er_headline'),
            document.getElementById('_er_sub'),
            document.getElementById('_er_hadis'),
          ], { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: .1, duration: .32, ease: 'power3.out' });

          gsap.fromTo(document.querySelectorAll('._er_chip'),
            { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, stagger: .08, duration: .28, ease: 'back.out(1.5)' });
          gsap.fromTo(document.getElementById('_er_btn'),
            { opacity: 0, y: 14 }, { opacity: 1, y: 0, delay: .3, duration: .3, ease: 'power3.out' });
        }, 500);
      }, 100);

      // Ring burst dari emoji
      setTimeout(() => {
        const em2 = document.getElementById('_er_emoji');
        const r = em2.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        ['#74B9FF','#0984E3','#FFE066','#52D98A'].forEach((stk, i) => {
          setTimeout(() => {
            const ring = document.createElement('div');
            ring.style.cssText = `position:fixed;border-radius:50%;border:${3-i*.5}px solid ${stk};
              width:20px;height:20px;left:${cx-10}px;top:${cy-10}px;pointer-events:none;z-index:9000;opacity:.95`;
            document.body.appendChild(ring);
            gsap.to(ring, { width: '180px', height: '180px', left: cx-90, top: cy-90, opacity: 0,
              duration: .72 + i*.14, ease: 'power2.out', onComplete: () => ring.remove() });
          }, i * 140);
        });
        burst(cx, cy, ['#74B9FF','#FFE066','#52D98A','#FF69B4'], 14);
      }, 250);
    }

    confetti(45, 1.1);
    SOUND.building(isMasjid);
    SOUND.vib(isIstana ? [50,15,50,15,100,15,50,15,100] : [38, 14, 38]);

    if (typeof SAF !== 'undefined') {
      setTimeout(() => SAF.speak(tmpl(data.feeling)), 1500);
    }
  };

  // ── CLOSE ────────────────────────────────────────────────
  ER.close = function (cb) {
    const ov = document.getElementById('_er_overlay');
    const bx = document.getElementById('_er_box');
    if (!ov) return;
    if (G() && bx) {
      gsap.to(bx, { scale: .88, opacity: 0, y: 18, duration: .24, ease: 'power2.in',
        onComplete: () => {
          ov.classList.remove('show');
          gsap.set(bx, { scale: 1, opacity: 1, y: 0 });
          confettiStop();
          if (cb) cb();
        } });
    } else {
      ov.classList.remove('show');
      confettiStop();
      if (cb) cb();
    }
  };

  W.ER = ER;

  // ═══════════════════════════════════════════════════════════
  // AUTO-INTEGRASI — hook ke EventBus HeroKuEvents
  // Hanya aktif jika EventBus sudah tersedia (app-fixes.js)
  // ═══════════════════════════════════════════════════════════

  function integrate() {
    if (typeof W.HeroKuEvents === 'undefined') return;

    // Perfect Day
    W.HeroKuEvents.on('perfectday', function (e) {
      // Tunda sedikit agar overlay celebration asli selesai dulu
      setTimeout(() => ER.perfectDay(), 400);
    });

    // Level Up
    W.HeroKuEvents.on('levelup', function (e) {
      const level = e.detail?.level || (typeof CU !== 'undefined' ? CU.level : 1);
      const perks = ['Kartu Koleksi Baru 🃏', 'Koin Bonus Harian ⭐'];
      if (level >= 5) perks.push('Stiker Eksklusif ✨');
      if (level >= 7) perks.push('Mode Khusus 🎓');
      setTimeout(() => ER.levelUp(level, perks), 1200);
    });

    // Building Unlock
    W.HeroKuEvents.on('buildingUnlock', function (e) {
      const bld = e.detail?.building;
      if (!bld) return;
      // Tunggu overlay bangunan asli selesai, lalu tampilkan emotional layer
      setTimeout(() => {
        // Hanya tampilkan jika overlay asli sudah ditutup
        const origOverlay = document.getElementById('overlay-building');
        if (origOverlay && origOverlay.style.display !== 'none') {
          // Tunggu lagi
          setTimeout(() => ER.building(bld.name, bld.icon), 2000);
        } else {
          ER.building(bld.name, bld.icon);
        }
      }, 3000);
    });

    console.log('[ER] Emotional Reward System siap ✅ — PerfectDay, LevelUp, Badge, Building');
  }

  // ── Boot ─────────────────────────────────────────────────
  function boot() {
    injectStyles();
    injectHTML();
    cResize();

    // Coba integrasi setelah EventBus ready
    if (typeof W.HeroKuEvents !== 'undefined') {
      integrate();
    } else {
      // EventBus belum ada, tunggu sebentar
      let tries = 0;
      const wait = setInterval(() => {
        if (typeof W.HeroKuEvents !== 'undefined' || tries > 50) {
          clearInterval(wait);
          integrate();
        }
        tries++;
      }, 200);
    }

    // Unlock audio on first gesture
    ['click','touchstart'].forEach(ev =>
      document.addEventListener(ev, () => { try { getAC(); } catch(e) {} }, { once: true, passive: true })
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
