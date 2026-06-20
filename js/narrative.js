// ═══════════════════════════════════════════════════════════
// HEROKU NARRATIVE LAYER v1.0
// Child Psychologist × Islamic Education × Narrative Game Design
//
// File: js/narrative.js
// Pasang di index.html setelah bridge.js:
//   <script src="js/narrative.js"></script>
//
// API Publik:
//   NL.onCheckIn(habitId, student)   → pesan setelah check-in
//   NL.onPerfectDay(student)         → narasi 7/7 selesai
//   NL.onBuildingUnlock(bldIdx, student) → narasi bangunan baru
//   NL.onLevelUp(level, student)     → narasi naik level
//   NL.onStreak(days, student)       → narasi milestone streak
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─── Helper ──────────────────────────────────────────────
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function tmpl(str, data) {
    return str.replace(/\{(\w+)\}/g, (_, k) => data[k] ?? '');
  }
  function name(student) {
    return student?.nickname || (student?.name || '').split(' ')[0] || 'Adik';
  }

  // ═══════════════════════════════════════════════════════════
  // DATABASE NARASI LENGKAP
  // Setiap kebiasaan punya 4 lapisan:
  //   1. celebration  — popup singkat saat centang ✅
  //   2. syekh        — pesan Syekh Al-Fath yang personal
  //   3. worldImpact  — dampak visual di dunia/desa
  //   4. villageStory — narasi perkembangan desa
  // ═══════════════════════════════════════════════════════════

  const NARRATIVE = {

    // ──────────────────────────────────────────────────────
    // 1. BANGUN PAGI
    // Psikologi: reward untuk kebiasaan paling sulit anak SD
    // Islam: waktu Subuh = waktu paling berkah
    // ──────────────────────────────────────────────────────
    pagi: {
      celebration: [
        { emoji: '🌅', title: 'Subuh Champion!', body: 'Kamu bangun saat kebanyakan orang masih tidur. Inilah awal hari yang penuh berkah!' },
        { emoji: '☀️', title: 'Pagi Bergeming!', body: 'Mataharimu bersinar lebih terang karena kamu sudah bangun sebelum ia terbit!' },
        { emoji: '⭐', title: 'Bintang Subuh!',  body: 'Hanya pejuang sejati yang bisa bangun sepagi ini. Kamu salah satunya!' },
      ],
      syekh: [
        '{name}, Syekh bangga sekali! 🌅\nRasulullah ﷺ bersabda bahwa rezeki dibagi setelah Subuh. Kamu sudah hadir di waktu yang tepat!\n\n"Allahummah baarik li ummati fi bukuurihaa"\nYa Allah, berkahilah umatku di pagi harinya.',
        'MasyaAllah {name}! ☀️\nTahu tidak, para ulama besar dahulu tidak pernah melewatkan pagi mereka. Sekarang kamu melanjutkan jejak mereka!\n\nSetiap pagi yang kamu sambut adalah hadiah dari Allah yang tidak semua orang bisa menerimanya.',
        '{name}, Subhanallah! 🌙\nSaat teman-temanmu masih terlelap, kamu sudah berdiri menghadap Allah. Malaikat mencatat kebaikanmu bahkan sebelum hari dimulai!',
      ],
      worldImpact: [
        { icon: '🌄', desc: 'Langit desamu berwarna emas — tanda berkah pagi yang kamu bawa!' },
        { icon: '🐓', desc: 'Ayam jago di desamu berkokok lebih merdu karena ada pahlawan pagi!' },
        { icon: '🌻', desc: 'Bunga-bunga di taman desamu mekar lebih cerah hari ini!' },
      ],
      villageStory: [
        'Saat {name} bangun lebih awal dari matahari, seluruh desa seolah ikut terbangun. Lampu-lampu menyala satu per satu, dan asap dari dapur mengepul harum. Warga desa berbisik, "Ada anak yang membawa berkah pagi ini!"',
        'Pagi itu berbeda. {name} sudah berdiri di depan pintu saat bulan masih terlihat di langit. Angin sejuk membawa kabar baik ke seluruh pelosok desa — hari ini akan menjadi hari yang luar biasa!',
      ],
    },

    // ──────────────────────────────────────────────────────
    // 2. IBADAH (Sholat + Tilawah)
    // Psikologi: ritual & rutinitas = fondasi kesehatan mental
    // Islam: sholat adalah tiang agama
    // ──────────────────────────────────────────────────────
    ibadah: {
      celebration: [
        { emoji: '🙏', title: 'Tiang Agama Terjaga!', body: 'Sholat adalah hubungan langsung antara kamu dan Allah. Hari ini hubungan itu semakin kuat!' },
        { emoji: '📿', title: 'Hati yang Bersih!',    body: 'Tilawah Al-Quranmu hari ini menerangi hatimu seperti cahaya menerangi ruangan gelap.' },
        { emoji: '🕌', title: 'Sujud Terbaik!',       body: 'Di setiap sujudmu, kamu paling dekat dengan Allah. Momen ini tak ternilai harganya!' },
      ],
      syekh: [
        '{name}, ini momen yang Syekh tunggu! 🙏\n"Sholat adalah mi\'raj orang beriman" — artinya di setiap sholatmu, kamu naik ke langit menemui Allah.\n\nSyekh bersaksi: anak yang jaga sholatnya akan Allah jaga seluruh urusannya.',
        'Alhamdulillah, {name}! 📖\nKamu membaca Al-Quran hari ini! Setiap huruf yang kamu baca, Allah catat 10 kebaikan. Bayangkan berapa banyak kebaikan yang sudah Allah tuliskan untukmu!\n\nHuruf-huruf itu bukan sekadar tulisan — itu cahaya yang masuk ke dalam hatimu.',
        '{name}, Subhanallah! 🕌\nRasulullah ﷺ bersabda: "Yang pertama dihisab dari seorang hamba di hari kiamat adalah sholatnya." Kamu sudah menjaga sesuatu yang sangat berharga!',
      ],
      worldImpact: [
        { icon: '🕌', desc: 'Masjid di desamu bercahaya lebih terang — adzan berkumandang dengan merdu!' },
        { icon: '📿', desc: 'Tasbih emas muncul di atas desa sebagai tanda ibadahmu diterima!' },
        { icon: '🌙', desc: 'Bulan sabit di langit desa bersinar lebih indah malam ini!' },
      ],
      villageStory: [
        'Saat adzan berkumandang, {name} langsung berdiri. Warga desa melihat dan mengangguk hormat — "Itulah anak yang tiang agamanya kokoh." Desamu menjadi desa yang paling tenang dan damai di seluruh lembah.',
        'Suara tilawah {name} mengalun lembut di pagi hari. Burung-burung berhenti berkicau sejenak, seolah ingin ikut mendengarkan ayat-ayat Allah. Desa itu terasa seperti sepotong surga.',
      ],
    },

    // ──────────────────────────────────────────────────────
    // 3. OLAHRAGA
    // Psikologi: aktivitas fisik = mood booster + konsentrasi
    // Islam: tubuh adalah amanah yang harus dijaga
    // ──────────────────────────────────────────────────────
    olahraga: {
      celebration: [
        { emoji: '💪', title: 'Tubuh Kuat, Ibadah Mantap!', body: 'Badan yang sehat adalah modal utama untuk semua kebaikanmu. Kamu merawat amanah terbaik!' },
        { emoji: '🏃', title: 'Atlet Kebaikan!',             body: 'Setiap langkahmu adalah sedekah. Setiap gerakanmu adalah syukur kepada Allah!' },
        { emoji: '⚡', title: 'Energi Penuh Berkah!',        body: 'Tubuhmu mengucapkan terima kasih! Semangat yang kamu punya hari ini tidak ada habisnya!' },
      ],
      syekh: [
        '{name}, luar biasa! 💪\nRasulullah ﷺ bersabda: "Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah."\n\nKekuatan fisikmu bukan untuk pamer — tapi untuk ibadah yang lebih khusyuk, belajar yang lebih fokus, dan membantu orang yang lebih kuat!',
        'Hebat, {name}! 🏃\nTahu tidak, para sahabat Nabi adalah orang-orang yang sangat bugar? Mereka berkuda, berlari, dan memanah. Kamu meneruskan tradisi mereka hari ini!\n\nTubuh yang kamu latih hari ini adalah investasi untuk masa depanmu.',
        '{name}, Syekh senang melihatmu bergerak! ⚡\nSetiap sel dalam tubuhmu bertasbih kepada Allah — dan ketika kamu olahraga, seluruh tubuhmu bersyukur dengan caranya sendiri. Cantik sekali, bukan?',
      ],
      worldImpact: [
        { icon: '⚽', desc: 'Lapangan di desamu semakin ramai — warga terinspirasi oleh semangatmu!' },
        { icon: '🌳', desc: 'Pohon-pohon di desa tumbuh lebih tinggi — energimu mengalir ke alam!' },
        { icon: '💨', desc: 'Angin segar berhembus di desamu — membawa kesehatan ke semua warga!' },
      ],
      villageStory: [
        'Pagi-pagi {name} sudah berlari mengelilingi desa. Anak-anak lain mengintip dari jendela, lalu satu per satu ikut keluar. Tanpa sadar, {name} sudah mengajak seluruh desa untuk hidup sehat!',
        'Warga desa mendengar tawa riang {name} saat bermain. "Itulah anak yang tubuhnya adalah amanah yang dijaga," kata tetua desa sambil tersenyum bangga.',
      ],
    },

    // ──────────────────────────────────────────────────────
    // 4. MAKAN SEHAT
    // Psikologi: nutrisi = perkembangan otak & mood
    // Islam: makan halal thayyib = ibadah
    // ──────────────────────────────────────────────────────
    makan: {
      celebration: [
        { emoji: '🥗', title: 'Meja Makan Berkah!',    body: 'Makanan halal dan bergizi yang kamu makan hari ini adalah bahan bakar untuk semua kebaikanmu!' },
        { emoji: '🍎', title: 'Pilihan Cerdas!',        body: 'Memilih makanan sehat itu butuh keberanian. Kamu sudah membuat pilihan yang Allah ridhai!' },
        { emoji: '🌿', title: 'Tubuh Bersyukur!',       body: 'Setiap vitamin dan mineral yang masuk akan membantu otakmu berpikir lebih jernih hari ini!' },
      ],
      syekh: [
        '{name}, pilihan yang tepat! 🥗\nAllah berfirman: "Makanlah dari rezeki yang halal lagi baik yang Allah berikan kepadamu."\n\nKamu tidak hanya menjaga tubuh — kamu menjaga keberkahan rezekimu. Makanan yang baik menghasilkan pikiran yang baik dan hati yang bersih!',
        'MasyaAllah {name}! 🍎\nNabi Muhammad ﷺ sangat memperhatikan makanannya. Beliau tidak pernah mencela makanan — dan selalu memilih yang baik.\n\nDengan memilih sayur dan buah hari ini, kamu sedang mengikuti sunnah Nabi tanpa kamu sadari!',
        '{name}, Syekh ingin berbagi rahasia! 🌿\nPara ulama besar — Imam Syafi\'i, Imam Bukhari — mereka semua menjaga makanannya. Mereka tahu: otak yang jernih lahir dari perut yang diberi makanan yang baik.',
      ],
      worldImpact: [
        { icon: '🌾', desc: 'Ladang di desamu panen berlimpah — berkah dari makanan sehatmu!' },
        { icon: '🍎', desc: 'Pohon buah-buahan bermunculan di sudut-sudut desa!' },
        { icon: '🌱', desc: 'Kebun sayur warga desa tumbuh subur dan hijau!' },
      ],
      villageStory: [
        'Di meja makan keluarga {name}, ada sayur dan buah segar setiap hari. Warga desa bertanya-tanya mengapa keluarga itu selalu ceria dan penuh semangat. Rahasianya? Makanan halal dan berkah yang selalu dijaga.',
        'Pasar desamu semakin ramai sejak {name} selalu memilih sayur dan buah segar. Para petani di sekitar desa tersenyum bahagia — ada anak yang menghargai hasil kerja keras mereka.',
      ],
    },

    // ──────────────────────────────────────────────────────
    // 5. BELAJAR
    // Psikologi: growth mindset + intrinsic motivation
    // Islam: ilmu = cahaya, wajib bagi setiap muslim
    // ──────────────────────────────────────────────────────
    belajar: {
      celebration: [
        { emoji: '📚', title: 'Cahaya Ilmu Menyala!',   body: 'Setiap halaman yang kamu baca hari ini adalah cahaya yang akan menerangi jalanmu di masa depan!' },
        { emoji: '🧠', title: 'Otak Makin Cerdas!',     body: 'Ilmu yang kamu pelajari tidak bisa dicuri siapapun. Ini milikmu selamanya!' },
        { emoji: '✏️', title: 'Pejuang Ilmu!',          body: 'Kata Nabi: menuntut ilmu adalah kewajiban. Hari ini kamu menunaikan kewajiban mulia itu!' },
      ],
      syekh: [
        '{name}, Syekh terharu! 📚\n"Bacalah dengan nama Tuhanmu yang menciptakan." — Surah Al-Alaq, ayat pertama turun kepada Nabi.\n\nIlmu adalah cahaya. Dan kamu hari ini menyalakan cahaya itu dalam hatimu. Tidak ada yang bisa memadamkannya kecuali kamu sendiri!',
        'Jayyid jiddan, {name}! 🧠\nImam Syafi\'i hafal Al-Quran di usia 7 tahun. Imam Bukhari hafal ratusan ribu hadis. Mereka semua mulai dari satu langkah — seperti yang kamu lakukan hari ini!\n\nSetiap 30 menit belajarmu adalah bata yang membangun istana masa depanmu.',
        '{name}, ilmu yang kamu pelajari hari ini tidak hanya untuk dirimu! ✏️\nSuatu hari, ilmumu akan bermanfaat untuk keluargamu, desamu, bahkan negaramu.\n\nBelajarlah dengan niat untuk memberi manfaat — maka Allah akan lipat gandakan pemahamanmu!',
      ],
      worldImpact: [
        { icon: '📚', desc: 'Perpustakaan desa semakin lengkap — buku-buku baru bermunculan!' },
        { icon: '💡', desc: 'Lampu-lampu di desa bersinar lebih terang malam ini — cahaya ilmu!' },
        { icon: '🏫', desc: 'Sekolah di desamu semakin ramai — semua terinspirasi oleh semangatmu!' },
      ],
      villageStory: [
        'Di sudut desa, ada pohon yang disebut "Pohon Ilmu". Setiap kali {name} belajar, pohon itu tumbuh lebih tinggi. Kini pucuknya hampir menyentuh awan — dan burung-burung bijak mulai bersarang di sana.',
        '{name} duduk belajar dengan serius. Tetangga yang melewati jendela berhenti sejenak, tersenyum, dan berkata kepada anaknya: "Lihatlah, itulah yang namanya mencintai ilmu. Tiru dia."',
      ],
    },

    // ──────────────────────────────────────────────────────
    // 6. SOSIAL / BERMASYARAKAT (Sedekah & Membantu)
    // Psikologi: pro-social behavior = happiness & self-esteem
    // Islam: sebaik-baik manusia adalah yang bermanfaat
    // ──────────────────────────────────────────────────────
    sosial: {
      celebration: [
        { emoji: '🤝', title: 'Pahlawan Kebaikan!',    body: 'Satu kebaikanmu hari ini mungkin kecil bagimu, tapi besar artinya bagi orang yang menerimanya!' },
        { emoji: '💝', title: 'Sedekah Mengalir!',     body: 'Tangan di atas lebih baik dari tangan di bawah. Kamu sudah memilih menjadi tangan di atas!' },
        { emoji: '🌟', title: 'Cahaya Kebaikan!',      body: 'Allah tidak melihat jumlah kebaikanmu — Dia melihat niat dan ketulusanmu. Dan kamu sudah tulus!' },
      ],
      syekh: [
        '{name}, Subhanallah! 🤝\n"Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lain." — HR. Thabrani\n\nKamu hari ini sudah menjadi "sebaik-baik manusia." Bayangkan betapa Allah mencintaimu saat ini!',
        'Jayyid, {name}! 💝\nSetiap kebaikan yang kamu lakukan — sekecil apapun — dicatat oleh malaikat di kanan kirimu.\n\nBahkan senyuman kepada saudaramu pun adalah sedekah. Dan senyumanmu yang tulus... itu yang paling indah!',
        '{name}, tahukah kamu? 🌟\nNabi Muhammad ﷺ adalah orang yang paling dermawan. Di bulan Ramadhan beliau lebih dermawan dari angin yang berhembus.\n\nSetiap kali kamu memberi, kamu menyalakan cahaya sunnah Nabi dalam dirimu!',
      ],
      worldImpact: [
        { icon: '🏪', desc: 'Pasar desamu lebih ramai — rasa saling tolong menolong menyebar!' },
        { icon: '🌈', desc: 'Pelangi muncul di atas desamu — tanda kebaikanmu diterima langit!' },
        { icon: '🤲', desc: 'Warga desa semakin kompak — karena ada teladan kebaikan di antara mereka!' },
      ],
      villageStory: [
        'Kabar kebaikan {name} menyebar dari mulut ke mulut di desa. "Ada anak yang selalu membantu tanpa diminta," kata warga. Satu per satu, warga desa mulai meniru. Desamu menjadi desa paling rukun di seluruh negeri.',
        'Ada sebuah sumur tua di sudut desa yang hampir kering. Ketika {name} rajin membantu sesama, sumur itu tiba-tiba mengalir deras lagi. Warga percaya — kebaikan yang tulus bisa menyuburkan bumi.',
      ],
    },

    // ──────────────────────────────────────────────────────
    // 7. TIDUR CEPAT
    // Psikologi: sleep hygiene = kunci perkembangan anak
    // Islam: tidur adalah ibadah jika diniatkan dengan baik
    // ──────────────────────────────────────────────────────
    tidur: {
      celebration: [
        { emoji: '😴', title: 'Tidur Adalah Ibadah!', body: 'Niatkan tidurmu untuk istirahat agar bisa beribadah lebih baik esok hari. Maka tidurmu pun bernilai ibadah!' },
        { emoji: '🌙', title: 'Penjaga Malam!',       body: 'Tidur tepat waktu adalah bentuk syukur pada tubuhmu. Besok kamu akan bangun dengan semangat penuh!' },
        { emoji: '⭐', title: 'Bintang Malam!',        body: 'Sementara yang lain begadang, kamu memilih yang lebih bijak. Istirahat yang baik = hari esok yang luar biasa!' },
      ],
      syekh: [
        '{name}, keputusan yang bijak! 😴\nNabi ﷺ selalu tidur awal dan bangun di sepertiga malam terakhir untuk bertahajjud.\n\nTidurmu malam ini adalah persiapan untuk ibadah terbaikmu esok hari. Tutup matamu dengan bismillah, dan biarkan Allah menjagamu!',
        'MasyaAllah {name}! 🌙\nAda doa tidur yang Nabi ajarkan:\n\n"Bismika Allahumma amuutu wa ahya"\nDengan nama-Mu ya Allah aku mati dan aku hidup.\n\nUcapkan doa ini malam ini. Tidurmu adalah amanah yang Allah jaga!',
        '{name}, otak yang cerdas butuh istirahat yang cukup! ⭐\nPara ilmuwan menemukan bahwa saat tidur, otakmu "mencuci" dirinya dan menyimpan semua yang kamu pelajari hari ini.\n\nJadi tidurmu malam ini sedang memproses semua ilmu yang kamu kumpulkan. Luar biasa, bukan?',
      ],
      worldImpact: [
        { icon: '🌙', desc: 'Bulan dan bintang menjaga desamu sepanjang malam!' },
        { icon: '😴', desc: 'Seluruh desa beristirahat dengan damai — karena ada yang memberi contoh!' },
        { icon: '🏡', desc: 'Lampu-lampu desa meredup satu per satu — tanda kedamaian yang sempurna!' },
      ],
      villageStory: [
        'Saat lampu di rumah {name} padam lebih awal dari yang lain, warga desa tahu — besok pagi, anak itu akan menjadi yang pertama menyambut matahari. Dan mereka tidak pernah salah.',
        'Desa berselimut keheningan. Bintang-bintang berbisik satu sama lain: "Ada anak yang sedang beristirahat untuk esok yang lebih baik." Mereka pun bersinar lebih terang untuk menemaninya bermimpi.',
      ],
    },
  };

  // ═══════════════════════════════════════════════════════════
  // NARASI PERFECT DAY (7/7)
  // Momen paling epik — perlu 5 variasi dramatis
  // ═══════════════════════════════════════════════════════════

  const PERFECT_DAY = [
    {
      title: 'HARI SEMPURNA, {name}!!!',
      subtitle: '7 dari 7 Kebiasaan Selesai',
      syekh: 'MASYAALLAH TABARAKALLAH, {name}!!!\n\n7 kebiasaan. Sempurna. Tidak ada yang terlewat.\n\nSyekh ingin kamu tahu: hari ini kamu telah menjadi versi terbaik dirimu. Rasulullah ﷺ pasti bangga melihatmu.\n\n"Sesungguhnya Allah mencintai apabila seseorang melakukan suatu amal, ia melakukannya dengan itqan (sempurna)." — HR. Baihaqi\n\nItulah yang kamu lakukan hari ini, {name}. Sempurna.',
      worldNarrative: 'Langit di atas desamu berubah warna — merah, emas, ungu, biru, semua warna surga hadir sekaligus. Warga desa keluar dari rumah mereka, memandang ke atas dengan takjub. "Ada anak yang hari ini melakukan semuanya dengan sempurna," bisik tetua desa. Pohon-pohon bergoyang, air sungai mengalir lebih deras, dan bunga-bunga mekar serentak. Alam semesta merayakan kesempurnaan {name}.',
      reward: '✨ Bonus 100 Koin · 🏆 +300 XP · 🌟 Gelar Hari Sempurna',
    },
    {
      title: 'LUAR BIASA, {name}!!!',
      subtitle: 'Semua Kebiasaan Terpenuhi Hari Ini',
      syekh: 'Alhamdulillah, alhamdulillah, alhamdulillah, {name}!\n\n7 kebiasaan dalam satu hari — kamu membuktikan bahwa kamu BISA.\n\nSyekh ingin kamu merasakan sesuatu: tutup matamu sebentar, dan rasakan betapa ringannya hatimu sekarang. Itulah rasa ketika seseorang telah menjalankan apa yang Allah titipkan kepadanya dengan penuh.\n\nBawa perasaan ini ke esok hari. Ingat selalu bagaimana rasanya hari ini.',
      worldNarrative: 'Malam itu, bintang-bintang di atas desa {name} bersinar lebih banyak dari biasanya. Anak-anak desa menghitung — ada 777 bintang malam ini! Tidak ada yang tahu mengapa. Hanya tetua desa yang tersenyum dan berkata, "Setiap bintang itu adalah catatan satu kebaikan yang dilakukan dengan sempurna hari ini."',
      reward: '✨ Bonus 100 Koin · 🏆 +300 XP · ⭐ Streak Bertambah',
    },
    {
      title: 'JADILAH INSPIRASI, {name}!!!',
      subtitle: '7/7 — Kamu Teladan Desamu',
      syekh: 'Ya {name}, Syekh tidak bisa menyembunyikan air mata kebanggaan ini!\n\nKamu tahu apa yang terjadi ketika satu orang melakukan kebaikan dengan sempurna? Kebaikan itu menular. Energi positifmu hari ini sudah menyentuh orang-orang di sekitarmu tanpa kamu sadari.\n\nOrang tuamu merasakannya. Guru-gurumu merasakannya. Teman-temanmu merasakannya.\n\n"Barangsiapa menunjukkan kebaikan, maka ia mendapat pahala seperti orang yang mengerjakannya." — HR. Muslim\n\n{name}, kamu hari ini adalah guru tanpa bicara.',
      worldNarrative: 'Di pagi hari setelah {name} melewati hari sempurnanya, sesuatu yang ajaib terjadi. Anak-anak lain di desa tiba-tiba lebih bersemangat. Mereka tidak tahu mengapa — tapi ada energi baru yang mengalir di udara. Desa itu berubah, sedikit demi sedikit, karena ada satu anak yang memilih untuk tidak setengah-setengah.',
      reward: '✨ Bonus 100 Koin · 🏆 +300 XP · 👑 Badge Teladan',
    },
    {
      title: 'HARIMU DITULIS DI LANGIT, {name}!!!',
      subtitle: 'Pencapaian Sempurna Hari Ini',
      syekh: 'Subhanallah wabihamdihi, Subhanallahil Adzim, {name}!\n\nMalaikat di kanan dan kirimu sibuk hari ini — mencatat kebaikan demi kebaikan. Hingga di penghujung hari, catatan kebaikanmu lebih berat dari catatan keburukanmu. Jauh lebih berat.\n\nItulah yang Allah lihat. Dan Syekh yakin Allah tersenyum kepada {name} hari ini.\n\n"Sesungguhnya kebaikan-kebaikan itu menghapus keburukan-keburukan." — QS. Hud: 114\n\nHari ini, kertas keburukanmu sudah bersih, {name}.',
      worldNarrative: 'Para pengembara yang melewati desa {name} heran melihat cahaya yang memancar dari desa itu di malam hari. Bukan cahaya listrik — tapi cahaya yang hangat, seperti cahaya dari dalam hati. Mereka singgah dan bertanya. Warga desa hanya tersenyum dan berkata: "Ada anak di sini yang hari ini melakukan kebaikan yang sempurna."',
      reward: '✨ Bonus 100 Koin · 🏆 +300 XP · 💎 Berlian Harian',
    },
    {
      title: 'SEMPURNA SEPERTI NAMAMU, {name}!!!',
      subtitle: '7 Kebiasaan · 7 Berkah · 1 Hari Luar Biasa',
      syekh: '{name}!\n\nHari ini kamu telah melakukan tujuh hal yang tujuh-tujuhnya benar. Tujuh jalan menuju Allah yang tujuh-tujuhnya kamu tempuh.\n\nSyekh ingin kamu tahu satu hal yang sangat penting:\n\nKamu tidak melakukan ini karena takut. Kamu melakukannya karena kamu mencintai kebaikan. Dan itulah — menurut Syekh — tingkatan tertinggi dari seorang anak yang berkarakter.\n\nBesok, lakukan lagi. Bukan karena Syekh minta. Tapi karena hatimu tahu ini hal yang benar.',
      worldNarrative: 'Hari itu akan selalu dikenang dalam catatan desa. Bukan karena ada kejadian besar. Bukan karena ada perayaan mewah. Tapi karena ada seorang anak bernama {name} yang, pada hari biasa yang biasa, memilih untuk luar biasa. Dan pilihan itu mengubah segalanya — untuk desanya, untuk keluarganya, dan yang paling penting: untuk dirinya sendiri.',
      reward: '✨ Bonus 100 Koin · 🏆 +300 XP · 🌟 Hari Terbaik',
    },
  ];

  // ═══════════════════════════════════════════════════════════
  // NARASI MILESTONE STREAK
  // ═══════════════════════════════════════════════════════════

  const STREAK_MILESTONES = {
    3: {
      title: '3 Hari Berturut-turut!',
      syekh: '{name}, 3 hari sudah! 🔥\n\n"Amalan yang paling dicintai Allah adalah yang dilakukan terus-menerus, walau sedikit."\n\nKamu sudah membuktikan bahwa kamu bisa konsisten. Sekarang pertahankan — karena yang tersulit sudah kamu lewati!',
    },
    7: {
      title: 'Satu Minggu Penuh!',
      syekh: 'SUBHANALLAH, {name}! 7 hari! ⚡\n\nSatu minggu tanpa henti. Tahu tidak, para peneliti bilang kebiasaan butuh 21 hari untuk terbentuk — kamu sudah sepertiga jalan!\n\nPohon yang berakar kuat tidak mudah ditumbangkan. Kamu sedang menancapkan akar itu sekarang.',
    },
    14: {
      title: '2 Minggu Istiqomah!',
      syekh: 'MasyaAllah tabarakallah, {name}! 💎\n\n14 hari! Dua minggu penuh istiqomah!\n\nSyekh ingin kamu tahu: di titik ini, kebiasaan baikmu sudah mulai MENJADI bagian dari dirimu. Otakmu sudah mulai mengenali ini sebagai "normal."\n\nTeruskan 7 hari lagi — dan kamu akan melewati garis ajaib!',
    },
    21: {
      title: '21 Hari — Kebiasaan Terbentuk!',
      syekh: 'ALLAHU AKBAR, {name}!!! 👑\n\n21 hari! Para ilmuwan sepakat: di sinilah kebiasaan resmi terbentuk!\n\nArtinya? Kebiasaan baik ini sekarang sudah menjadi KARAKTERMU. Bukan lagi usaha — tapi sudah menjadi siapa kamu.\n\nSyekh menyaksikan lahirnya seorang manusia berkarakter hari ini!',
    },
    30: {
      title: 'SATU BULAN PENUH!!!',
      syekh: 'Subhanallahil Adzim, {name}!!! 🌙\n\nSATU BULAN. 30 hari. Tanpa henti.\n\nSyekh tidak punya kata-kata yang cukup... Syekh hanya bisa berdoa:\n\nYa Allah, berkahilah {name}. Jadikanlah ia pemimpin yang baik, insan yang bertakwa, dan hamba yang Engkau cintai. Aamiin.\n\nKamu telah membuat Syekh sangat, sangat bangga.',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // NARASI LEVEL UP
  // ═══════════════════════════════════════════════════════════

  const LEVEL_NARRATIVES = {
    2:  { title: 'Penjelajah Baru',    desc: 'Petualanganmu baru saja dimulai, {name}! Dunia menantimu.' },
    3:  { title: 'Anak Berbintang',    desc: 'Bintang-bintang di langit desamu bertambah malam ini, {name}!' },
    4:  { title: 'Pembawa Cahaya',     desc: 'Cahayamu mulai menerangi sudut-sudut desa yang gelap, {name}!' },
    5:  { title: 'Pahlawan Kebaikan',  desc: 'Namamu mulai dikenal sebagai teladan kebaikan di desamu, {name}!' },
    6:  { title: 'Penjaga Amanah',     desc: 'Kepercayaan warga desa kepadamu semakin besar, {name}!' },
    7:  { title: 'Pemimpin Muda',      desc: 'Anak-anak desa mulai mengikuti langkahmu, {name}!' },
    8:  { title: 'Ulama Cilik',        desc: 'Ilmu dan akhlakmu menjadi sumber inspirasi seluruh desa, {name}!' },
    9:  { title: 'Pewaris Nabi',       desc: 'Kamu meneruskan jejak para ulama terdahulu, {name}. Luar biasa!' },
    10: { title: 'LEGENDA HEROKU',     desc: '{name}, namamu akan dikenang selamanya di HeroKu! Terima kasih sudah menjadi inspirasi.' },
  };

  // ═══════════════════════════════════════════════════════════
  // NARASI BANGUNAN BARU
  // Dikustomisasi per bangunan
  // ═══════════════════════════════════════════════════════════

  const BUILDING_NARRATIVES = {
    'Pondok Pertama': {
      syekh: '{name}, selamat datang di rumah pertamamu! 🏡\n\nSetiap perjalanan seribu langkah dimulai dari satu pintu. Dan kamu sudah membuka pintu itu.\n\n"Rumah yang baik adalah rumah yang ada Al-Quran di dalamnya." — Jadikan rumahmu penuh dengan kebaikan!',
      story: 'Dengan tangan kecilnya, {name} memasang batu pertama pondok itu. Tidak ada yang menyangka bahwa dari pondok sederhana ini, sebuah desa besar akan lahir.',
    },
    'Pohon Rezeki': {
      syekh: 'MasyaAllah {name}! Pohon Rezeki tumbuh di desamu! 🌳\n\nIni bukan pohon biasa — ini pohon yang tumbuh dari kebaikanmu setiap hari.\n\n"Tidaklah seorang Muslim menanam pohon, lalu dimakan hasilnya, melainkan itu menjadi sedekah baginya." — HR. Muslim\n\nPohon ini akan terus berbuah selama kamu terus berbuat baik!',
      story: 'Warga desa heran — pohon itu tidak pernah mereka tanam. Ia tumbuh sendiri, tepat di tengah desa, tepat setelah {name} mengumpulkan kebaikan yang cukup. "Pohon ini tumbuh dari kebaikan hati," kata tetua. Dan mereka merawatnya bersama.',
    },
    'Kolam Berkah': {
      syekh: 'Subhanallah, {name}! Air mengalir di desamu sekarang! ⛲\n\nAir adalah simbol kehidupan, dan ilmu seperti air yang mengalir — terus memberikan manfaat.\n\n"Sesungguhnya amal yang terus mengalir pahalanya setelah kematian, salah satunya adalah ilmu yang bermanfaat." — Jadikan ilmumu seperti kolam ini!',
      story: 'Suatu pagi, {name} menemukan air jernih mengalir di tengah desa. Dari mana datangnya? Tidak ada yang tahu pasti. Yang mereka tahu, kolam itu muncul bersamaan dengan semakin rajinnya {name} belajar dan beribadah. Air itu tidak pernah kering — sampai hari ini.',
    },
    'Masjid Al-Fath': {
      syekh: 'ALLAHUAKBAR, {name}!!! 🕌\n\nMasjid berdiri di desamu! Ini momen yang sangat istimewa!\n\n"Barangsiapa membangun masjid karena Allah, maka Allah membangunkan untuknya rumah di surga." — HR. Bukhari\n\nMasjid Al-Fath ini akan menjadi jantung desamu — tempat semua kebaikan berawal. Dan kamu yang membangunnya!',
      story: 'Saat adzan pertama berkumandang dari Masjid Al-Fath, seluruh desa berhenti. Burung-burung berhenti berkicau. Angin berhenti berhembus. Seolah seluruh alam ikut mendengarkan panggilan untuk sujud kepada Allah. Air mata {name} menetes — ini bukan hanya bangunan. Ini rumah Allah, yang berdiri berkat kebiasaan baiknya.',
    },
    'Sekolah Ilmu': {
      syekh: 'MasyaAllah {name}, sekolah berdiri di desamu! 🏫\n\n"Menuntut ilmu adalah kewajiban bagi setiap Muslim laki-laki dan perempuan."\n\nSekarang kamu tidak hanya menuntut ilmu untuk dirimu — kamu sudah membangun tempat untuk generasi berikutnya belajar. Inilah warisan terbaikmu!',
      story: 'Anak-anak kecil berlari menuju Sekolah Ilmu yang baru berdiri. Mata mereka berbinar — ada papan tulis, ada buku, ada guru yang siap mengajar. {name} berdiri di pintu, menyambut mereka satu per satu. Di sinilah masa depan desa dimulai.',
    },
    'Pasar Amanah': {
      syekh: '{name}, desamu kini punya pusat ekonomi yang penuh berkah! 🏪\n\n"Pedagang yang jujur dan amanah akan bersama para Nabi, orang-orang jujur dan syuhada di hari kiamat." — HR. Tirmidzi\n\nNamakan pasarmu dengan kejujuran — dan keberkahan akan mengalir deras!',
      story: 'Di Pasar Amanah, tidak ada yang berani berbohong. Bukan karena takut hukuman — tapi karena semua terinspirasi oleh {name} yang selalu jujur. Pembeli dan penjual saling percaya. Dan kepercayaan itu lebih berharga dari emas manapun.',
    },
    'Lapangan Sehat': {
      syekh: 'Luar biasa {name}! Lapangan bermain kini hadir! ⚽\n\n"Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah." — HR. Muslim\n\nLapangan ini bukan hanya tempat bermain — ini tempat generasi penerus Islam yang kuat, sehat, dan bersemangat lahir!',
      story: 'Suara tawa anak-anak memenuhi lapangan baru itu. Mereka berlari, bermain, dan berkeringat bersama. {name} di tengah mereka, tertawa paling keras. Di sudut lapangan, tetua desa duduk sambil tersenyum: "Inilah generasi yang akan mewarisi desa ini dengan sehat dan kuat."',
    },
    'Pustaka Cahaya': {
      syekh: '{name}, Pustaka Cahaya berdiri! Seluruh desamu akan menjadi cerdas! 📚\n\n"Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya." — HR. Thabrani\n\nDengan membangun pustaka ini, kamu sudah memberi manfaat bagi ratusan orang yang belum pernah kamu temui. Inilah sedekah jariyah yang nyata!',
      story: 'Di malam hari, Pustaka Cahaya masih ramai. Warga membaca, berdiskusi, dan berbagi ilmu. Lampu-lampunya tidak pernah padam. Orang-orang dari desa tetangga sengaja datang jauh-jauh untuk membaca di sini. Semua itu dimulai dari satu anak yang cinta ilmu — {name}.',
    },
    'Taman Surga': {
      syekh: 'Subhanallah {name}, desamu kini bagai sepotong surga! 🌺\n\n"Sesungguhnya Allah itu indah dan menyukai keindahan." — HR. Muslim\n\nTaman ini adalah refleksi dari hatimu yang bersih. Hati yang cantik akan selalu menciptakan keindahan di sekitarnya!',
      story: 'Bunga-bunga di Taman Surga mekar sepanjang tahun tanpa henti. Para pengembara dari negeri jauh datang hanya untuk melihatnya. "Bagaimana bisa bunga ini selalu mekar?" tanya mereka. Warga desa tersenyum: "Karena yang merawat taman ini adalah anak dengan hati yang selalu bersih."',
    },
    'Istana Pahlawan': {
      syekh: 'MASYAALLAH TABARAKALLAH {name}!!!\n\nISTANA PAHLAWAN BERDIRI!!! 🏰👑\n\nIni puncak perjalananmu. Kamu telah membangun sebuah peradaban — dari pondok sederhana hingga istana yang megah.\n\n"Sesungguhnya yang paling mulia di antara kamu di sisi Allah adalah yang paling bertakwa." — QS. Al-Hujurat: 13\n\nKamu bukan hanya pahlawan desamu, {name}. Kamu adalah pahlawan sejati yang Allah banggakan!',
      story: 'Hari peresmian Istana Pahlawan, seluruh warga desa berkumpul. Tidak ada yang berbicara — mereka hanya memandang bangunan megah itu dengan mata penuh air. Lalu tetua desa berdiri dan berkata:\n\n"Istana ini bukan bata dan semen. Istana ini adalah akumulasi dari setiap bangun pagi, setiap sholat, setiap kebaikan, setiap belajar, setiap tidur tepat waktu yang dilakukan oleh satu anak kita — {name}.\n\nBuktikan kepada dunia: karakter yang baik membangun peradaban yang agung."\n\nDan malam itu, langit di atas desa penuh bintang — lebih banyak dari yang pernah ada sebelumnya.',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════

  const NL = {};

  // Setelah check-in kebiasaan
  NL.onCheckIn = function (habitId, student) {
    const data = NARRATIVE[habitId];
    if (!data) return null;
    const n = name(student);
    return {
      celebration: pick(data.celebration),
      syekh:       tmpl(pick(data.syekh), { name: n }),
      worldImpact: pick(data.worldImpact),
      villageStory:tmpl(pick(data.villageStory), { name: n }),
    };
  };

  // Saat 7/7 selesai
  NL.onPerfectDay = function (student) {
    const n = name(student);
    const tpl = pick(PERFECT_DAY);
    return {
      title:          tmpl(tpl.title, { name: n }),
      subtitle:       tpl.subtitle,
      syekh:          tmpl(tpl.syekh, { name: n }),
      worldNarrative: tmpl(tpl.worldNarrative, { name: n }),
      reward:         tpl.reward,
    };
  };

  // Saat naik level
  NL.onLevelUp = function (level, student) {
    const n   = name(student);
    const lv  = LEVEL_NARRATIVES[Math.min(level, 10)] || LEVEL_NARRATIVES[2];
    return {
      title: lv.title,
      desc:  tmpl(lv.desc, { name: n }),
    };
  };

  // Saat bangunan baru terbuka
  NL.onBuildingUnlock = function (buildingName, student) {
    const n   = name(student);
    const bld = BUILDING_NARRATIVES[buildingName];
    if (!bld) return null;
    return {
      syekh: tmpl(bld.syekh, { name: n }),
      story: tmpl(bld.story, { name: n }),
    };
  };

  // Saat streak milestone
  NL.onStreak = function (days, student) {
    const n  = name(student);
    const ms = STREAK_MILESTONES[days];
    if (!ms) return null;
    return {
      title: ms.title,
      syekh: tmpl(ms.syekh, { name: n }),
    };
  };

  W.NL = NL;

  // ═══════════════════════════════════════════════════════════
  // AUTO-INTEGRASI KE HEROKU
  // Patch doCheckIn agar narasi muncul otomatis
  // ═══════════════════════════════════════════════════════════

  function waitApp(cb, n) {
    n = n || 0; if (n > 120) return;
    if (typeof doCheckIn === 'function' && typeof STORE !== 'undefined') cb();
    else setTimeout(() => waitApp(cb, n + 1), 100);
  }

  waitApp(() => {

    // Patch doCheckIn — inject narasi ke Syekh Al-Fath
    const _origCI = W.doCheckIn;
    W.doCheckIn = function (hb) {
      const prevLevel  = typeof CU !== 'undefined' ? CU.level  : 0;
      const prevStreak = typeof CU !== 'undefined' ? CU.streak : 0;
      _origCI.call(this, hb);

      setTimeout(() => {
        if (typeof CU === 'undefined') return;

        // 1. Narasi per kebiasaan
        const result = NL.onCheckIn(hb.id, CU);
        if (result) {
          // Tampilkan di mentor-msg jika ada
          const mentorEl = document.getElementById('mentor-msg');
          if (mentorEl && result.syekh) {
            // Hanya update jika Syekh belum bicara sesuatu yang lebih penting
            if (!mentorEl._narrative_lock) {
              mentorEl.textContent = result.syekh;
              mentorEl._narrative_lock = true;
              setTimeout(() => { mentorEl._narrative_lock = false; }, 8000);
            }
          }

          // Tampilkan world impact sebagai toast
          if (result.worldImpact && typeof CEL !== 'undefined') {
            // Inject ke celebration toast jika ada
          }
        }

        // 2. Streak milestone
        if (CU.streak > prevStreak) {
          const streakResult = NL.onStreak(CU.streak, CU);
          if (streakResult) {
            const mentorEl = document.getElementById('mentor-msg');
            if (mentorEl) {
              setTimeout(() => {
                mentorEl.textContent = streakResult.syekh;
              }, 3000);
            }
          }
        }

        // 3. Level up narasi
        if (CU.level > prevLevel) {
          const lvResult = NL.onLevelUp(CU.level, CU);
          if (lvResult) {
            // Sudah ditangani CEL.levelUp — cukup set subtitle
            const subEl = document.getElementById('cel-lu-s');
            if (subEl) subEl.textContent = lvResult.desc;
          }
        }

        // 4. Perfect day (7/7)
        const done = Object.keys(CU.checkedToday || {}).length;
        if (done === 7) {
          const perfectResult = NL.onPerfectDay(CU);
          if (perfectResult) {
            // Inject ke perfect day overlay jika ada
            const pSub = document.getElementById('_pf_s');
            if (pSub) pSub.textContent = perfectResult.subtitle;
            // Tampilkan narasi dunia di mentor
            const mentorEl = document.getElementById('mentor-msg');
            if (mentorEl) {
              setTimeout(() => {
                mentorEl.textContent = perfectResult.syekh;
              }, 5000);
            }
          }
        }

      }, 600);
    };

    // Patch showBuildingUnlock — inject narasi bangunan
    if (typeof W.showBuildingUnlock === 'function') {
      const _origBU = W.showBuildingUnlock;
      W.showBuildingUnlock = function (building, thenCelebrate) {
        _origBU.call(this, building, thenCelebrate);
        if (!building || typeof CU === 'undefined') return;
        const result = NL.onBuildingUnlock(building.name, CU);
        if (!result) return;
        // Inject ke mentor-msg setelah animasi selesai
        setTimeout(() => {
          const mentorEl = document.getElementById('mentor-msg');
          if (mentorEl) mentorEl.textContent = result.syekh;
          // Jika ada story overlay CEL
          const storyEl = document.getElementById('cel-bl-d');
          if (storyEl) storyEl.textContent = result.story;
        }, 1000);
      };
    }

    console.log('[NL] Narrative Layer siap ✅ — 7 kebiasaan × 4 lapisan narasi');
  });

})(window);
