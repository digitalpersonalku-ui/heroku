
// ═══════════════════ MASTER DATA ═══════════════════
// Animasi & config tiap kebiasaan untuk Mission Card
const HABIT_CARDS = {
  pagi: {
    grad:'linear-gradient(145deg,#FF6B35,#F7971E,#FFD700)',
    rarity:'⭐ Misi Subuh', rarityBg:'#FF6B35', rarityColor:'white',
    anims:[
      {type:'stars', frames:['🌟','✨','⭐','🌠']},
    ],
    scene:`<div style="font-size:52px;animation:iconFloat 2s ease-in-out infinite">🌅</div>
           <div style="position:absolute;bottom:20px;display:flex;gap:12px;font-size:28px;opacity:0.7">🐓☀️🕌</div>`,
    yesBtn:'linear-gradient(135deg,#FF6B35,#F7971E)',
  },
  ibadah: {
    grad:'linear-gradient(145deg,#667EEA,#764BA2,#6B48FF)',
    rarity:'🕌 Misi Ibadah', rarityBg:'#764BA2', rarityColor:'white',
    scene:`<div style="display:flex;gap:6px;align-items:flex-end;justify-content:center">
      <div style="font-size:20px;opacity:0.6">🕌</div>
      <div style="font-size:52px;animation:ibadahPulse 2s ease-in-out infinite">🙏</div>
      <div style="font-size:20px;opacity:0.6">📖</div>
    </div> <div style="position:absolute;bottom:16px;font-size:13px;color:rgba(255,255,255,0.7);
      font-family:var(--font-round);font-weight:700">سُبْحَانَ اللّٰهِ</div>`,
    yesBtn:'linear-gradient(135deg,#667EEA,#764BA2)',
  },
  olahraga: {
    grad:'linear-gradient(145deg,#E74C3C,#C0392B,#FF6B6B)',
    rarity:'💪 Misi Sehat', rarityBg:'#E74C3C', rarityColor:'white',
    scene:`<div style="display:flex;align-items:center;gap:-4px;position:relative">
      <div style="font-size:52px;animation:run 0.6s steps(2) infinite">🏃</div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.3);border-radius:2px"></div>
    </div> <div style="position:absolute;bottom:16px;display:flex;gap:8px;font-size:22px;opacity:0.65">⚽🏅🎽</div>`,
    yesBtn:'linear-gradient(135deg,#E74C3C,#C0392B)',
  },
  makan: {
    grad:'linear-gradient(145deg,#11998E,#38EF7D,#56AB2F)',
    rarity:'🥗 Misi Gizi', rarityBg:'#11998E', rarityColor:'white',
    scene:`<div style="display:flex;gap:8px;align-items:center;animation:bounce2 1.5s ease-in-out infinite">
      <div style="font-size:36px">🥗</div><div style="font-size:28px">🍎</div><div style="font-size:32px">🥦</div>
    </div> <div style="position:absolute;bottom:14px;font-size:12px;color:rgba(255,255,255,0.8);
      font-family:var(--font-round);font-weight:700">"Makanlah yang halal lagi baik" — QS. Al-Baqarah</div>`,
    yesBtn:'linear-gradient(135deg,#11998E,#38EF7D)',
  },
  belajar: {
    grad:'linear-gradient(145deg,#2980B9,#6DD5FA,#1A5276)',
    rarity:'📚 Misi Ilmu', rarityBg:'#2980B9', rarityColor:'white',
    scene:`<div style="position:relative;display:flex;align-items:center;justify-content:center">
      <div style="font-size:52px;animation:bookOpen 2s ease-in-out infinite">📖</div>
      <div style="position:absolute;top:-8px;right:-8px;font-size:20px;animation:twinkle 1s ease-in-out infinite alternate">✨</div>
    </div> <div style="position:absolute;bottom:14px;display:flex;gap:6px;font-size:20px;opacity:0.6">🔬🎨✏️📐</div>`,
    yesBtn:'linear-gradient(135deg,#2980B9,#6DD5FA)',
  },
  sosial: {
    grad:'linear-gradient(145deg,#1ABC9C,#16A085,#0E6655)',
    rarity:'🤝 Misi Kebaikan', rarityBg:'#1ABC9C', rarityColor:'white',
    scene:`<div style="display:flex;gap:4px;align-items:flex-end;justify-content:center">
      <div style="font-size:38px;animation:wave 1.5s ease-in-out infinite">🧒</div>
      <div style="font-size:28px;animation:heartBeat 1s ease-in-out infinite;margin-bottom:6px">❤️</div>
      <div style="font-size:38px;animation:wave 1.5s ease-in-out infinite 0.3s">👴</div>
    </div> <div style="position:absolute;bottom:14px;font-size:12px;color:rgba(255,255,255,0.8);
      font-family:var(--font-round);font-weight:700">"Sebaik-baik manusia adalah yang bermanfaat"</div>`,
    yesBtn:'linear-gradient(135deg,#1ABC9C,#16A085)',
  },
  tidur: {
    grad:'linear-gradient(145deg,#2C3E50,#4A235A,#1A1A2E)',
    rarity:'🌙 Misi Istirahat', rarityBg:'#4A235A', rarityColor:'white',
    scene:`<div style="display:flex;align-items:center;gap:8px">
      <div style="font-size:18px;animation:twinkle2 1.5s ease-in-out infinite">⭐</div>
      <div style="font-size:52px;animation:sleepAnim 3s ease-in-out infinite">😴</div>
      <div style="font-size:18px;animation:twinkle2 1.5s ease-in-out infinite 0.5s">🌟</div>
    </div>
    <div style="position:absolute;top:20px;right:60px;font-size:16px;
      animation:floatZ 2s ease-in-out infinite;color:rgba(255,255,255,0.7);
      font-family:var(--font-round);font-weight:900">z</div>
    <div style="position:absolute;top:10px;right:45px;font-size:20px;
      animation:floatZ 2s ease-in-out infinite 0.6s;color:rgba(255,255,255,0.5);
      font-family:var(--font-round);font-weight:900">z</div>
    <div style="position:absolute;top:2px;right:28px;font-size:24px;
      animation:floatZ 2s ease-in-out infinite 1.2s;color:rgba(255,255,255,0.35);
      font-family:var(--font-round);font-weight:900">Z</div> 
    <div style="position:absolute;bottom:14px;font-size:22px;opacity:0.5">🌙 ⭐ 🌟 ✨</div>`,
    yesBtn:'linear-gradient(135deg,#4A235A,#6C3483)',
  },
};

const HABITS = [
  {id:'pagi',   name:'Bangun Pagi',     desc:'Sebelum jam 5.30', icon:'🌅', bg:'#FAEEDA', xp:40, koin:30, needVerify:false},
  {id:'ibadah', name:'Beribadah',       desc:'Sholat 5 waktu + Tilawah', icon:'🙏', bg:'#EEEDFE', xp:60, koin:20, needVerify:false},
  {id:'olahraga',name:'Berolahraga',   desc:'Min. 15 menit', icon:'⚽', bg:'#FAECE7', xp:50, koin:40, needVerify:true},
  {id:'makan',  name:'Makan Sehat',    desc:'Sayur atau buah', icon:'🥗', bg:'#EAF3DE', xp:35, koin:25, needVerify:true},
  {id:'belajar',name:'Gemar Belajar',  desc:'Min. 30 menit', icon:'📚', bg:'#E6F1FB', xp:70, koin:50, needVerify:false},
  {id:'sosial', name:'Bermasyarakat',  desc:'Satu kebaikan hari ini', icon:'🤝', bg:'#E1F5EE', xp:45, koin:35, needVerify:true},
  {id:'tidur',  name:'Tidur Cepat',    desc:'Sebelum jam 9 malam', icon:'😴', bg:'#FBEAF0', xp:55, koin:30, needVerify:false},
];

const BUILDINGS = [
  {icon:'🏡', name:'Pondok Pertama',   minKoin:0,
   desc:'Rumah sederhana yang menjadi awal perjalananmu.',
   hadis:'"Rumah yang baik adalah rumah yang ada Al-Quran di dalamnya." — Hadis',
   confetti:'🌱✨🏡🌟🌱'},
  {icon:'🌳', name:'Pohon Rezeki',     minKoin:50,
   desc:'Pohon yang tumbuh karena kebaikanmu setiap hari.',
   hadis:'"Tidaklah seorang Muslim menanam pohon, lalu dimakan hasilnya, melainkan itu menjadi sedekah baginya." — HR. Muslim',
   confetti:'🌳🍃🌿🌱🌳'},
  {icon:'⛲', name:'Kolam Berkah',     minKoin:150,
   desc:'Air yang mengalir — seperti ilmu yang bermanfaat.',
   hadis:'"Sesungguhnya amal yang terus mengalir pahalanya setelah kematian salah satunya adalah ilmu yang bermanfaat." — HR. Muslim',
   confetti:'💧⛲🌊✨💙'},
  {icon:'🕌', name:'Masjid Al-Fath',  minKoin:300,
   desc:'Pusat kehidupan desamu. Tempat hati menemukan ketenangan.',
   hadis:'"Barangsiapa membangun masjid karena Allah, maka Allah membangunkan untuknya rumah di surga." — HR. Bukhari',
   confetti:'🕌☪️✨🌙⭐'},
  {icon:'🏫', name:'Sekolah Ilmu',    minKoin:500,
   desc:'Tempat generasi penerus belajar dan tumbuh.',
   hadis:'"Menuntut ilmu adalah kewajiban bagi setiap Muslim laki-laki dan perempuan." — HR. Ibnu Majah',
   confetti:'📚🏫✏️🌟📖'},
  {icon:'🏪', name:'Pasar Amanah',    minKoin:700,
   desc:'Tempat jual beli yang jujur dan penuh keberkahan.',
   hadis:'"Pedagang yang jujur dan amanah akan bersama para Nabi, orang-orang jujur dan syuhada." — HR. Tirmidzi',
   confetti:'🏪💰✨🤝🌟'},
  {icon:'⚽', name:'Lapangan Sehat',  minKoin:900,
   desc:'Tempat tubuh dilatih agar kuat untuk beribadah.',
   hadis:'"Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah." — HR. Muslim',
   confetti:'⚽🏃💪🌟⚽'},
  {icon:'📚', name:'Pustaka Cahaya',  minKoin:1100,
   desc:'Gudang ilmu yang menerangi seluruh desa.',
   hadis:'"Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya." — HR. Thabrani',
   confetti:'📚💡✨📖🌟'},
  {icon:'🌺', name:'Taman Surga',     minKoin:1400,
   desc:'Keindahan yang lahir dari hati yang bersih.',
   hadis:'"Sesungguhnya Allah itu indah dan menyukai keindahan." — HR. Muslim',
   confetti:'🌺🌸🌼🌻🌺'},
  {icon:'🏰', name:'Istana Pahlawan', minKoin:1800,
   desc:'Puncak perjalananmu — kamu adalah pahlawan sejati!',
   hadis:'"Sesungguhnya yang paling mulia di antara kamu di sisi Allah adalah yang paling bertakwa." — QS. Al-Hujurat: 13',
   confetti:'🏰👑🏆⭐💎'},
];

const TIERS = [
  {name:'Perunggu', min:0,   max:199,  icon:'🥉', color:'#CD7F32', bg:'#FFF0E0', pill:'#F4A460'},
  {name:'Perak',    min:200, max:499,  icon:'🥈', color:'#95A5A6', bg:'#F0F4F8', pill:'#AAB7B8'},
  {name:'Emas',     min:500, max:999,  icon:'🥇', color:'#F1C40F', bg:'#FFFDE7', pill:'#F9CA24'},
  {name:'Berlian',  min:1000,max:99999,icon:'💎', color:'#3498DB', bg:'#EBF5FB', pill:'#74B9FF'},
];

const COLLECT_CARDS = [
  {id:'c1',icon:'🌅',name:'Fajar yang Indah',rarity:'Umum',quote:'Barangsiapa yang menjaga shalat Subuh, ia dalam jaminan Allah.',grad:'linear-gradient(135deg,#FF6B35,#F7971E)',koinReq:0},
  {id:'c2',icon:'📖',name:'Al-Quran Cahayaku',rarity:'Langka',quote:'Bacalah Al-Quran, sesungguhnya ia akan datang memberi syafaat.',grad:'linear-gradient(135deg,#4CAF50,#087f23)',koinReq:50},
  {id:'c3',icon:'💪',name:'Tubuh Amanah',rarity:'Umum',quote:'Mukmin yang kuat lebih baik dan lebih dicintai Allah.',grad:'linear-gradient(135deg,#E74C3C,#8E0000)',koinReq:0},
  {id:'c4',icon:'🥗',name:'Rezeki yang Sehat',rarity:'Umum',quote:'Makan dan minumlah, tapi jangan berlebih-lebihan.',grad:'linear-gradient(135deg,#27AE60,#145A32)',koinReq:0},
  {id:'c5',icon:'🧠',name:'Pencari Ilmu',rarity:'Langka',quote:'Menuntut ilmu adalah kewajiban bagi setiap Muslim.',grad:'linear-gradient(135deg,#3498DB,#1A5276)',koinReq:100},
  {id:'c6',icon:'🤲',name:'Tangan yang Memberi',rarity:'Langka',quote:'Tangan di atas lebih baik daripada tangan di bawah.',grad:'linear-gradient(135deg,#1ABC9C,#0E6655)',koinReq:100},
  {id:'c7',icon:'🌙',name:'Malam yang Tenang',rarity:'Langka',quote:'Tidur adalah saudara kematian, maka tidurlah dalam kebaikan.',grad:'linear-gradient(135deg,#8E44AD,#4A235A)',koinReq:150},
  {id:'c8',icon:'🦁',name:'Pahlawan Sejati',rarity:'Legendaris',quote:'Sesungguhnya Allah mencintai orang yang berperang di jalan-Nya.',grad:'linear-gradient(135deg,#F1C40F,#D68910)',koinReq:300},
  {id:'c9',icon:'🏆',name:'Juara Karakter',rarity:'Legendaris',quote:'Sesungguhnya yang paling mulia di antara kamu adalah yang paling bertakwa.',grad:'linear-gradient(135deg,#E91E8C,#880E4F)',koinReq:500},
];

// ══ KUIS — bertingkat berdasarkan kelompok usia, 5 kategori ══
// ageGroup: array kelompok yang cocok untuk soal ini ('muda'/'menengah'/'dewasa')
// type: 'agama' | 'english' | 'math' | 'sains' | 'sejarah'
const QUIZZES = [
  // ═══ KELOMPOK MUDA (6-8 tahun) — sangat sederhana, visual, 1 langkah ═══
  {q:'Apa warna langit di siang hari?',sub:'Pilih jawaban yang benar!',opts:['Hijau','Biru','Merah','Ungu'],ans:1,type:'sains',bonus:15,ageGroup:['muda']},
  {q:'Berapa hasil dari 2 + 3?',sub:'Hitung dengan jarimu!',opts:['4','5','6','7'],ans:1,type:'math',bonus:10,ageGroup:['muda']},
  {q:'Apa arti "Bismillah"?',sub:'Pengetahuan Agama',opts:['Dengan nama Allah','Selamat pagi','Terima kasih','Maaf'],ans:0,type:'agama',bonus:15,ageGroup:['muda']},
  {q:'How do you say "Kucing" in English?',sub:'Terjemahkan!',opts:['Dog','Cat','Bird','Fish'],ans:1,type:'english',bonus:10,ageGroup:['muda']},
  {q:'Siapa Nabi pertama dalam Islam?',sub:'Kisah Nabi',opts:['Nabi Adam','Nabi Musa','Nabi Isa','Nabi Nuh'],ans:0,type:'sejarah',bonus:15,ageGroup:['muda']},
  {q:'Berapa kaki yang dimiliki seekor kucing?',sub:'Pengetahuan Hewan',opts:['2','4','6','8'],ans:1,type:'sains',bonus:10,ageGroup:['muda']},
  {q:'Berapa jumlah shalat wajib dalam sehari?',sub:'Fiqih Dasar',opts:['3','4','5','6'],ans:2,type:'agama',bonus:15,ageGroup:['muda']},

  // ═══ KELOMPOK MENENGAH (9-11 tahun) — sedang, mulai ada konteks ═══
  {q:'Apa arti "Shalat" dalam bahasa Arab?',sub:'Pilih jawaban yang benar!',opts:['Doa','Puasa','Zakat','Haji'],ans:0,type:'agama',bonus:20,ageGroup:['menengah']},
  {q:'How do you say "Selamat Pagi" in English?',sub:'Terjemahkan ke Bahasa Inggris!',opts:['Good Night','Good Afternoon','Good Morning','Good Evening'],ans:2,type:'english',bonus:20,ageGroup:['menengah']},
  {q:'Berapa hasil dari 7 × 8?',sub:'Hitung dengan cepat!',opts:['54','56','58','62'],ans:1,type:'math',bonus:15,ageGroup:['menengah']},
  {q:'Surat apakah yang disebut "Ummul Quran"?',sub:'Pengetahuan Al-Quran',opts:['Al-Baqarah','Al-Fatihah','Al-Ikhlas','An-Nas'],ans:1,type:'agama',bonus:20,ageGroup:['menengah']},
  {q:'Planet apa yang dijuluki "Planet Merah"?',sub:'Pengetahuan Alam Semesta',opts:['Venus','Mars','Jupiter','Saturnus'],ans:1,type:'sains',bonus:20,ageGroup:['menengah']},
  {q:'Siapa khalifah pertama setelah Nabi Muhammad ﷺ wafat?',sub:'Sejarah Islam',opts:['Umar bin Khattab','Abu Bakar As-Siddiq','Ali bin Abi Thalib','Utsman bin Affan'],ans:1,type:'sejarah',bonus:20,ageGroup:['menengah']},
  {q:'What is the English word for "Kucing"?',sub:'Terjemahkan ke Bahasa Inggris!',opts:['Dog','Bird','Cat','Fish'],ans:2,type:'english',bonus:15,ageGroup:['menengah']},
  {q:'Berapa hasil dari 12 × 9?',sub:'Hitung dengan cepat!',opts:['98','106','108','112'],ans:2,type:'math',bonus:20,ageGroup:['menengah']},
  {q:'Bagian tubuh apa yang berfungsi memompa darah?',sub:'Pengetahuan Tubuh Manusia',opts:['Paru-paru','Jantung','Ginjal','Hati'],ans:1,type:'sains',bonus:20,ageGroup:['menengah']},
  {q:'Kota apa yang menjadi tujuan hijrah Nabi Muhammad ﷺ dari Mekah?',sub:'Sejarah Islam',opts:['Baghdad','Madinah','Yerusalem','Damaskus'],ans:1,type:'sejarah',bonus:20,ageGroup:['menengah']},
  {q:'How do you say "Terima Kasih" in English?',sub:'Terjemahkan!',opts:['Sorry','Please','Thank You','Excuse Me'],ans:2,type:'english',bonus:15,ageGroup:['menengah']},
  {q:'Berapa jumlah rakaat shalat Dzuhur?',sub:'Fiqih Dasar',opts:['2','3','4','5'],ans:2,type:'agama',bonus:20,ageGroup:['menengah']},

  // ═══ KELOMPOK DEWASA (12-15 tahun) — lebih menantang, ada analisis ringan ═══
  {q:'Manakah yang merupakan kelipatan persekutuan terkecil (KPK) dari 6 dan 8?',sub:'Matematika — KPK',opts:['12','24','48','16'],ans:1,type:'math',bonus:25,ageGroup:['dewasa']},
  {q:'Siapa penyusun Sirah Nabawiyah yang terkenal berjudul "Ar-Rahiq Al-Makhtum"?',sub:'Sejarah Islam Lanjutan',opts:['Ibnu Hisyam','Shafiyyurrahman Al-Mubarakfuri','Ibnu Katsir','Al-Bukhari'],ans:1,type:'sejarah',bonus:25,ageGroup:['dewasa']},
  {q:'What does the idiom "break the ice" mean?',sub:'English Idiom',opts:['Membuat keributan','Memulai percakapan dengan santai','Membatalkan rencana','Marah besar'],ans:1,type:'english',bonus:25,ageGroup:['dewasa']},
  {q:'Proses fotosintesis pada tumbuhan terjadi di bagian sel mana?',sub:'Biologi — Sel Tumbuhan',opts:['Mitokondria','Kloroplas','Nukleus','Ribosom'],ans:1,type:'sains',bonus:25,ageGroup:['dewasa']},
  {q:'Perang Badar terjadi pada tahun berapa dalam kalender Hijriah?',sub:'Sejarah Islam Lanjutan',opts:['1 H','2 H','3 H','5 H'],ans:1,type:'sejarah',bonus:25,ageGroup:['dewasa']},
  {q:'Jika x + 5 = 12, berapakah nilai x?',sub:'Aljabar Dasar',opts:['5','6','7','8'],ans:2,type:'math',bonus:20,ageGroup:['dewasa']},
  {q:'Manakah rukun Islam yang berkaitan dengan ibadah haji?',sub:'Fiqih Lanjutan',opts:['Rukun ke-3','Rukun ke-4','Rukun ke-5','Rukun ke-2'],ans:2,type:'agama',bonus:20,ageGroup:['dewasa']},
  {q:'What is the correct past tense of "go"?',sub:'English Grammar',opts:['Goed','Went','Gone','Going'],ans:1,type:'english',bonus:20,ageGroup:['dewasa']},
  {q:'Hukum Newton ketiga menyatakan bahwa setiap aksi akan menghasilkan...',sub:'Fisika Dasar',opts:['Reaksi yang sama besar dan berlawanan arah','Gerakan melingkar','Energi panas','Tidak ada efek'],ans:0,type:'sains',bonus:25,ageGroup:['dewasa']},
  {q:'Siapakah pendiri Dinasti Umayyah?',sub:'Sejarah Islam Lanjutan',opts:['Muawiyah bin Abi Sufyan','Abdul Malik bin Marwan','Yazid bin Muawiyah','Al-Walid bin Abdul Malik'],ans:0,type:'sejarah',bonus:25,ageGroup:['dewasa']},
];

// Ambil kuis acak yang SESUAI kelompok usia siswa.
// Jika tidak ada soal untuk kelompok tersebut (seharusnya tidak terjadi), fallback ke semua soal.
function getQuizForStudent(student){
  const group = getActiveThemeGroup(student);
  const filtered = QUIZZES.filter(q => !q.ageGroup || q.ageGroup.includes(group));
  const pool = filtered.length > 0 ? filtered : QUIZZES;
  return pool[Math.floor(Math.random() * pool.length)];
}


const BADGES = [
  {icon:'🌅',name:'Juara Pagi',req:'Streak 7 hari'},
  {icon:'📿',name:'Jiwa Bersih',req:'Ibadah 14 hari'},
  {icon:'🏃',name:'Atlet Cilik',req:'Olahraga 30 hari'},
  {icon:'🥦',name:'Pecinta Sayur',req:'Makan sehat 10 hari'},
  {icon:'📖',name:'Kutu Buku',req:'Belajar 50 hari'},
  {icon:'🤲',name:'Pahlawan Baik',req:'50 kebaikan'},
  {icon:'🌙',name:'Tidur Hebat',req:'Tidur cepat 21 hari'},
  {icon:'🏆',name:'Pahlawan Sejati',req:'Semua kebiasaan 30 hari'},
];

const DAYS = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const CLASSES = ['Usman Bin Affan','Umar Bin Khattab','Abu Bakar As Siddiq','Ali Bin Abi Thalib'];
// ══ GARASI DATA ══
const CAR_COLORS = [
  {id:'default', name:'Original',    color:'#F39C12', emoji:'🟡', price:0,   islamic:''},
  {id:'green',   name:'Hijau Iman',  color:'#27AE60', emoji:'🟢', price:30,  islamic:'☪️'},
  {id:'white',   name:'Putih Suci',  color:'#ECF0F1', emoji:'⚪', price:30,  islamic:'🌙'},
  {id:'blue',    name:'Biru Langit', color:'#2980B9', emoji:'🔵', price:50,  islamic:''},
  {id:'gold',    name:'Emas Mulia',  color:'#F1C40F', emoji:'🟡', price:80,  islamic:'⭐'},
  {id:'purple',  name:'Ungu Royal',  color:'#8E44AD', emoji:'🟣', price:80,  islamic:''},
  {id:'red',     name:'Merah Berani',color:'#E74C3C', emoji:'🔴', price:50,  islamic:''},
  {id:'teal',    name:'Zamrud',      color:'#1ABC9C', emoji:'🟢', price:100, islamic:'💎'},
];

const STICKERS = [
  {id:'rainbow',  name:'Pelangi',      icon:'🌈', price:20,  desc:'Stiker pelangi ceria'},
  {id:'star',     name:'Bintang Islam',icon:'⭐',  price:25,  desc:'Bintang keislaman'},
  {id:'flame',    name:'Api Semangat', icon:'🔥',  price:30,  desc:'Semangat pantang menyerah'},
  {id:'lightning',name:'Petir Juara',  icon:'⚡',  price:35,  desc:'Kecepatan sang juara'},
  {id:'crown',    name:'Mahkota',      icon:'👑',  price:60,  desc:'Raja di kelasnya'},
  {id:'moon',     name:'Bulan Sabit',  icon:'🌙',  price:40,  desc:'Simbol Islam mulia'},
  {id:'quran',    name:'Al-Quran',     icon:'📖',  price:50,  desc:'Cahaya petunjuk'},
  {id:'rocket',   name:'Roket',        icon:'🚀',  price:80,  desc:'Melesat ke puncak'},
];

const UPGRADES = [
  {id:'spoiler',  name:'Sayap Balap (Spoiler)', icon:'🏁', price:60,
   desc:'Mobil terlihat lebih aerodinamis di sirkuit kelas', effect:'speed+'},
  {id:'nitro',    name:'Nitro Boost Tank',      icon:'💨', price:100,
   desc:'Efek api biru di roda saat streak 3+ hari aktif', effect:'nitro'},
  {id:'horn',     name:'Klakson Quran',          icon:'🎵', price:40,
   desc:'Melodi bismillah saat melewati checkpoint', effect:'horn'},
  {id:'plate',    name:'Plat Nama Arab',          icon:'🪪', price:50,
   desc:'Nama kamu dalam tulisan Arab di bumper belakang', effect:'plate'},
];

const STORE_KEY = 'heroku_v4';

// ═══════════════════ STORAGE ═══════════════════
function loadStore(){
  try{const r=localStorage.getItem(STORE_KEY);if(r)return JSON.parse(r)}catch(e){}
  return null;
}
function saveStore(){
  try{localStorage.setItem(STORE_KEY,JSON.stringify(STORE))}catch(e){}
}
function todayStr(){return new Date().toISOString().slice(0,10)}
function genPin(){return String(Math.floor(1000+Math.random()*9000))}
function getTier(koin){return TIERS.find(t=>koin>=t.min&&koin<=t.max)||TIERS[0]}

// ══ KELOMPOK USIA & TEMA VISUAL ══
// 3 kelompok: muda (6-8 thn), menengah (9-11 thn), dewasa (12-15 thn)
const AGE_GROUPS = {
  muda:     { label:'6-8 tahun',   min:6,  max:8,  icon:'🧸' },
  menengah: { label:'9-11 tahun',  min:9,  max:11, icon:'🎈' },
  dewasa:   { label:'12-15 tahun', min:12, max:15, icon:'🎯' },
};

// Tentukan kelompok usia default berdasarkan umur siswa (tanpa override)
function getAgeGroupByAge(age){
  if(age == null) return 'menengah'; // fallback aman jika usia belum diisi
  if(age <= 8) return 'muda';
  if(age <= 11) return 'menengah';
  return 'dewasa';
}

// Tentukan tema yang AKTIF dipakai untuk siswa: cek override dulu, baru fallback ke usia.
// Siswa kelompok 'muda' (6-8 thn) TIDAK BISA override — tema anak kecil tetap dikunci
// agar kontennya selalu sesuai usia mereka secara aman.
function getActiveThemeGroup(student){
  if(!student) return 'menengah';
  const naturalGroup = getAgeGroupByAge(student.age);
  if(naturalGroup === 'muda') return 'muda'; // tidak bisa override
  if(student.themeOverride && AGE_GROUPS[student.themeOverride]) return student.themeOverride;
  return naturalGroup;
}

// Daftar tema yang BOLEH dipilih siswa ini sebagai override (selain default-nya)
function getAvailableThemeChoices(student){
  const naturalGroup = getAgeGroupByAge(student.age);
  if(naturalGroup === 'muda') return []; // tidak ada pilihan, dikunci ke tema anak kecil
  if(naturalGroup === 'menengah') return ['menengah','dewasa'];
  return ['dewasa']; // siswa dewasa hanya punya 1 tema (sudah yang paling dewasa)
}

// ══════════════════════════════════════════════════════════
// SISTEM AVATAR — Ilustrasi karakter kartun semi-realistis
// 12 karakter dengan variasi gender, warna kulit, rambut/jilbab.
// 'avatar' di data siswa menyimpan ID (misal 'b1'), BUKAN emoji lagi.
// Untuk kompatibilitas tempat yang sempit (di dalam SVG mobil kecil),
// tetap sediakan versi emoji ringkas lewat getAvatarEmoji().
// ══════════════════════════════════════════════════════════
const AVATAR_CHARACTERS = {
  // ── LAKI-LAKI (6 karakter) ──
  b1: {label:'Rafi',     gender:'L', skin:'#F4C6A1', hair:'#3B2415', hairStyle:'short',    accessory:null,       emoji:'👦🏻'},
  b2: {label:'Dimas',    gender:'L', skin:'#D89B6C', hair:'#1A1A1A', hairStyle:'spiky',    accessory:null,       emoji:'👦🏽'},
  b3: {label:'Farhan',   gender:'L', skin:'#8B5A2B', hair:'#1A1A1A', hairStyle:'curly',    accessory:null,       emoji:'👦🏾'},
  b4: {label:'Bagas',    gender:'L', skin:'#F4C6A1', hair:'#4A3221', hairStyle:'short',    accessory:'glasses',  emoji:'🧒🏻'},
  b5: {label:'Yusuf',    gender:'L', skin:'#D89B6C', hair:'#2B1A0E', hairStyle:'side',     accessory:null,       emoji:'👦🏽'},
  b6: {label:'Zaki',     gender:'L', skin:'#8B5A2B', hair:'#0D0D0D', hairStyle:'spiky',    accessory:'cap',      emoji:'🧒🏾'},
  // ── PEREMPUAN (6 karakter) ──
  g1: {label:'Aisyah',   gender:'P', skin:'#F4C6A1', hair:'#3B2415', hairStyle:'hijab',    hijabColor:'#5FA8D3', emoji:'👧🏻'},
  g2: {label:'Putri',    gender:'P', skin:'#D89B6C', hair:'#1A1A1A', hairStyle:'hijab',    hijabColor:'#E8869C', emoji:'👧🏽'},
  g3: {label:'Khalisa',  gender:'P', skin:'#8B5A2B', hair:'#1A1A1A', hairStyle:'hijab',    hijabColor:'#7FB069', emoji:'👧🏾'},
  g4: {label:'Sari',     gender:'P', skin:'#F4C6A1', hair:'#4A2C12', hairStyle:'ponytail', accessory:null,       emoji:'👧🏻'},
  g5: {label:'Maya',     gender:'P', skin:'#D89B6C', hair:'#2B1A0E', hairStyle:'twintail', accessory:null,       emoji:'👧🏽'},
  g6: {label:'Nadia',    gender:'P', skin:'#8B5A2B', hair:'#0D0D0D', hairStyle:'wavy',     accessory:'glasses',  emoji:'🧒🏾'},
};
const AVATAR_IDS = Object.keys(AVATAR_CHARACTERS);

// Fallback emoji ringkas — dipakai di tempat yang sangat sempit (mis. SVG mobil mini)
function getAvatarEmoji(avatarId){
  const resolved = resolveAvatarId(avatarId);
  const c = AVATAR_CHARACTERS[resolved];
  return c ? c.emoji : '🧒';
}

// Pemetaan avatar emoji LAMA -> karakter baru, untuk siswa yang datanya
// sudah tersimpan di database sebelum sistem avatar SVG ini ada.
// Supaya tidak ada siswa yang tiba-tiba "kehilangan" avatarnya saat update.
const LEGACY_AVATAR_MAP = {
  '🦁':'b2', '🌙':'g1', '⚡':'b6', '🌟':'g4',
  '🏆':'b1', '🦋':'g5', '🐯':'b3', '🌸':'g2',
  '🦅':'b5', '🌿':'g3', '🦊':'b4', '🐬':'g6',
};

// Resolusi ID avatar final: kalau masih emoji lama, petakan dulu ke karakter baru.
function resolveAvatarId(avatarValue){
  if(AVATAR_CHARACTERS[avatarValue]) return avatarValue; // sudah ID baru
  if(LEGACY_AVATAR_MAP[avatarValue]) return LEGACY_AVATAR_MAP[avatarValue]; // emoji lama, petakan
  return 'b1'; // fallback aman
}

// Generator SVG karakter penuh. size = lebar/tinggi kotak SVG (persegi).
function getAvatarSVG(avatarId, size){
  size = size || 64;
  avatarId = resolveAvatarId(avatarId);
  const c = AVATAR_CHARACTERS[avatarId];
  if(!c) return `<svg viewBox="0 0 64 64" width="${size}" height="${size}"><circle cx="32" cy="32" r="28" fill="#DDD"/></svg>`;

  let hairSVG = '';
  if(c.hairStyle === 'short'){
    hairSVG = `<path d="M13 24 Q13 6 32 6 Q51 6 51 24 L51 22 Q51 11 32 11 Q13 11 13 22 Z" fill="${c.hair}"/>`;
  } else if(c.hairStyle === 'spiky'){
    hairSVG = `<path d="M13 22 L16 8 L21 18 L26 4 L32 16 L38 4 L43 18 L48 8 L51 22 Q51 13 32 13 Q13 13 13 22Z" fill="${c.hair}"/>`;
  } else if(c.hairStyle === 'curly'){
    hairSVG = `<g fill="${c.hair}"><circle cx="17" cy="20" r="7.5"/><circle cx="26" cy="11" r="8.5"/><circle cx="38" cy="11" r="8.5"/><circle cx="47" cy="20" r="7.5"/><circle cx="32" cy="8" r="8"/><circle cx="21" cy="15" r="6"/><circle cx="43" cy="15" r="6"/></g>`;
  } else if(c.hairStyle === 'side'){
    hairSVG = `<path d="M13 23 Q13 5 33 5 Q51 5 51 20 Q51 12 38 12 Q44 16 40 19 Q30 14 22 18 Q15 21 13 23Z" fill="${c.hair}"/>`;
  } else if(c.hairStyle === 'ponytail'){
    hairSVG = `<path d="M13 24 Q13 6 32 6 Q51 6 51 24 L51 22 Q51 11 32 11 Q13 11 13 22 Z" fill="${c.hair}"/>
      <path d="M46 22 Q60 24 58 40 Q56 50 50 47 Q53 38 47 26Z" fill="${c.hair}"/>`;
  } else if(c.hairStyle === 'twintail'){
    hairSVG = `<path d="M13 24 Q13 6 32 6 Q51 6 51 24 L51 22 Q51 11 32 11 Q13 11 13 22 Z" fill="${c.hair}"/>
      <ellipse cx="11" cy="32" rx="5.5" ry="13" fill="${c.hair}" transform="rotate(-15 11 32)"/>
      <ellipse cx="53" cy="32" rx="5.5" ry="13" fill="${c.hair}" transform="rotate(15 53 32)"/>`;
  } else if(c.hairStyle === 'wavy'){
    hairSVG = `<path d="M12 26 Q9 6 32 5 Q55 6 52 26 Q50 14 46 24 Q44 10 39 22 Q36 9 32 21 Q28 9 25 22 Q20 10 18 24 Q14 14 12 26Z" fill="${c.hair}"/>`;
  } else if(c.hairStyle === 'hijab'){
    hairSVG = `<path d="M9 32 Q7 4 32 3 Q57 4 55 32 Q55 44 50 52 Q48 44 46 38 Q47 24 32 22 Q17 24 18 38 Q16 44 14 52 Q9 44 9 32Z" fill="${c.hijabColor}"/>
      <path d="M44 38 Q46 46 50 52 L46 54 Q42 48 41 40Z" fill="${c.hijabColor}" opacity="0.85"/>
      <path d="M20 38 Q18 46 14 52 L18 54 Q22 48 23 40Z" fill="${c.hijabColor}" opacity="0.85"/>`;
  }

  const accessorySVG = c.accessory === 'glasses'
    ? `<g stroke="#333" stroke-width="1.5" fill="rgba(255,255,255,0.25)"><circle cx="24" cy="35" r="6"/><circle cx="40" cy="35" r="6"/><line x1="30" y1="35" x2="34" y2="35"/></g>`
    : c.accessory === 'cap'
    ? `<path d="M12 21 Q12 3 32 3 Q52 3 52 21 Q52 12 32 12 Q12 12 12 19Z" fill="#3498DB"/><path d="M44 17 Q54 17 54 23 Q54 27 46 26 Z" fill="#2980B9"/>`
    : '';

  const isHijab = c.hairStyle === 'hijab';

  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <!-- Wajah -->
    <ellipse cx="32" cy="36" rx="18" ry="19" fill="${c.skin}"/>
    <!-- Pipi blush -->
    <ellipse cx="20" cy="40" rx="3.5" ry="2.5" fill="#FF9B9B" opacity="0.4"/>
    <ellipse cx="44" cy="40" rx="3.5" ry="2.5" fill="#FF9B9B" opacity="0.4"/>
    <!-- Mata besar khas kartun -->
    <ellipse cx="24" cy="35" rx="3.2" ry="4.2" fill="#2B1A0E"/>
    <ellipse cx="40" cy="35" rx="3.2" ry="4.2" fill="#2B1A0E"/>
    <circle cx="25" cy="33.5" r="1" fill="#fff"/>
    <circle cx="41" cy="33.5" r="1" fill="#fff"/>
    <!-- Alis -->
    <path d="M20 29 Q24 27 28 29" stroke="${c.hair}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M36 29 Q40 27 44 29" stroke="${c.hair}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <!-- Senyum -->
    <path d="M27 45 Q32 49 37 45" stroke="#A0522D" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <!-- Rambut/Hijab (di belakang & depan wajah sebagian) -->
    ${isHijab ? '' : hairSVG}
    ${isHijab ? hairSVG : ''}
    ${accessorySVG}
  </svg>`;
}


const DEFAULT_STAFF = [
  {id:'guru01', name:'Reski Wulandari, S.Pd.',        role:'guru',   kelas:'Usman Bin Affan',    password:'guru01',     avatar:'👩‍🏫'},
  {id:'guru02', name:'Hilyatul Jannah',                role:'guru',   kelas:'Umar Bin Khattab',   password:'guru02',     avatar:'👩‍🏫'},
  {id:'guru03', name:'Muzdalifah Alima Salam, S.Pd.', role:'guru',   kelas:'Abu Bakar As Siddiq',password:'guru03',     avatar:'👩‍🏫'},
  {id:'guru04', name:'Nurhayati, S.Pd.',               role:'guru',   kelas:'Ali Bin Abi Thalib', password:'guru04',     avatar:'👩‍🏫'},
  {id:'kepsek1',name:'Musyarrafah, S.Psi., M.Pd.',    role:'kepsek', kelas:'Semua Kelas',         password:'kepsek2025', avatar:'👩‍💼'},
  {id:'admin1', name:'Ainani Hermansyah',               role:'admin',  kelas:'Semua Kelas',         password:'admin2025',  avatar:'⚙️'},
];const ARCHETYPES = {
  pemimpin: {
    name:'Pemimpin Sejati', icon:'👑', color:'#F1C40F', bg:'#FFFDE7',
    desc:'Seimbang di semua aspek. Disiplin, spiritual, dan sosial berjalan bersama.',
    traits:['Disiplin tinggi','Jiwa kepemimpinan','Mudah dipercaya teman'],
    guide_ortu:'Beri tanggung jawab kecil di rumah (misal: memimpin doa makan). Ia akan tumbuh menjadi pemimpin yang matang.',
    guide_guru:'Libatkan sebagai ketua kelompok. Ia mampu memotivasi teman-temannya.',
  },
  pejuang: {
    name:'Pejuang Fisik', icon:'⚔️', color:'#E74C3C', bg:'#FDEDEC',
    desc:'Kuat di disiplin fisik dan waktu. Energi tinggi dan semangat besar.',
    traits:['Energi berlimpah','Disiplin waktu','Pantang menyerah'],
    guide_ortu:'Salurkan energinya ke kegiatan fisik terstruktur. Ajari bahwa kekuatan fisik butuh landasan spiritual.',
    guide_guru:'Jadikan model disiplin kelas. Tapi perhatikan agar tidak terlalu kompetitif.',
  },
  cendekia: {
    name:'Sang Cendekia', icon:'📚', color:'#2980B9', bg:'#EBF5FB',
    desc:'Menonjol dalam ilmu dan belajar. Pikiran analitis dan rasa ingin tahu tinggi.',
    traits:['Suka belajar mandiri','Analitis','Tekun'],
    guide_ortu:'Sediakan buku dan konten edukatif. Ingat bahwa istirahat dan olahraga juga bagian dari kecerdasan.',
    guide_guru:'Berikan tantangan intelektual lebih. Ia bisa cepat bosan jika materi terlalu mudah.',
  },
  sufi: {
    name:'Jiwa Sufi', icon:'🌙', color:'#8E44AD', bg:'#F5EEF8',
    desc:'Spiritualitas kuat dan konsisten. Hati yang tenang dan penuh empati.',
    traits:['Spiritualitas tinggi','Empati besar','Tenang dan sabar'],
    guide_ortu:'Dukung rutinitas ibadahnya. Ajak diskusi nilai-nilai Islam dalam kehidupan sehari-hari.',
    guide_guru:'Ia bisa menjadi penyeimbang dalam kelompok yang ramai. Hargai kecerdasannya yang emosional.',
  },
  sosial: {
    name:'Sang Penyambung', icon:'🤝', color:'#1ABC9C', bg:'#E8F8F5',
    desc:'Unggul dalam interaksi sosial dan kebaikan. Mudah bergaul dan disukai.',
    traits:['Empati tinggi','Mudah bergaul','Suka membantu'],
    guide_ortu:'Ajak kegiatan sosial seperti bakti sosial atau membantu tetangga. Ini bidangnya.',
    guide_guru:'Manfaatkan kemampuannya untuk memediasi konflik antar teman di kelas.',
  },
  penjelajah: {
    name:'Penjelajah Baru', icon:'🌱', color:'#27AE60', bg:'#EAF9F0',
    desc:'Masih dalam proses membentuk kebiasaan. Potensi besar yang menunggu diaktifkan.',
    traits:['Masih berkembang','Butuh pendampingan','Potensi besar'],
    guide_ortu:'Mulai dari satu kebiasaan yang paling mudah bagi anak. Rayakan setiap pencapaian kecil bersama.',
    guide_guru:'Berikan perhatian ekstra dan mulai dengan target yang sangat realistis. Jangan bandingkan dengan teman.',
  },
};

