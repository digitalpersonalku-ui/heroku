// ═══════════════════════════════════════════════════════════
// BRIDGE: Menghubungkan kode lama (data.js / app.js) ke Supabase
// File ini di-load PALING TERAKHIR, setelah data.js, supabase-sync.js,
// dan SEBELUM app.js dieksekusi.
//
// Trik yang dipakai: kode lama di data.js mendefinisikan
//   function loadStore(){ ...baca localStorage... }
//   function saveStore(){ ...tulis localStorage... }
// Di sini kita TIMPA (override) keduanya dengan versi Supabase,
// sehingga app.js yang memanggil loadStore()/saveStore() seperti biasa
// otomatis terhubung ke database tanpa perlu diubah satu baris pun.
// ═══════════════════════════════════════════════════════════

// Override saveStore() — dipanggil banyak tempat di app.js, sifatnya
// "fire and forget": UI tidak menunggu, supaya tetap terasa instan.
window.saveStore = function () {
  // Simpan cadangan lokal juga, untuk jaga-jaga saat offline
  try { localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); } catch (e) {}
  // Kirim ke Supabase di belakang layar (tidak diawait, UI tidak nunggu)
  saveStoreToSupabase();
};

// Override delStudent agar juga menghapus dari Supabase
const _originalDelStudent = window.delStudent;
window.delStudent = function (id) {
  deleteStudentFromSupabase(id);
  if (_originalDelStudent) _originalDelStudent(id);
};

// ═══════════════════════════════════════════════════════════
// INISIALISASI APLIKASI — versi async-aware
// Ini MENGGANTI baris "let STORE = initStore();" yang lama,
// karena sekarang proses ambil data butuh menunggu jaringan.
// ═══════════════════════════════════════════════════════════
async function bootApp() {
  showLoadingScreen();

  const dbStore = await loadStoreFromSupabase();

  let resolvedStore;
  if (dbStore) {
    resolvedStore = dbStore;
  } else {
    // Supabase gagal/belum dikonfigurasi → fallback ke localStorage lama
    console.warn('[HeroKu] Supabase tidak tersedia, memakai data lokal sebagai cadangan.');
    const cached = localStorage.getItem(STORE_KEY);
    if (cached) {
      resolvedStore = JSON.parse(cached);
    } else {
      // Tidak ada data sama sekali → pakai data awal bawaan
      resolvedStore = {
        students: [
          {id:'s1',name:'Ahmad Badshah Al Fath',nickname:'Badshah',age:10,kelas:'Usman Bin Affan',avatar:'🦁',pin:'1001',parentPin:'2001',koin:0,xp:0,level:1,streak:0,lastActive:null,checkedToday:{},verifiedToday:{},totalDays:0,cards:[],quizCorrect:0,quizTotal:0,themeOverride:null},
          {id:'s2',name:'Ahmad Ibrohim Khalid Zayyan',nickname:'Ibrohim',age:11,kelas:'Usman Bin Affan',avatar:'🌙',pin:'1002',parentPin:'2002',koin:0,xp:0,level:1,streak:0,lastActive:null,checkedToday:{},verifiedToday:{},totalDays:0,cards:[],quizCorrect:0,quizTotal:0,themeOverride:null},
          {id:'s3',name:'Ahmad Zeeshan Al Barra',nickname:'Zeeshan',age:10,kelas:'Umar Bin Khattab',avatar:'⚡',pin:'1003',parentPin:'2003',koin:0,xp:0,level:1,streak:0,lastActive:null,checkedToday:{},verifiedToday:{},totalDays:0,cards:[],quizCorrect:0,quizTotal:0,themeOverride:null},
          {id:'s4',name:'Bahzah Dee Hasya',nickname:'Hasya',age:9,kelas:'Abu Bakar As Siddiq',avatar:'🌟',pin:'1004',parentPin:'2004',koin:0,xp:0,level:1,streak:0,lastActive:null,checkedToday:{},verifiedToday:{},totalDays:0,cards:[],quizCorrect:0,quizTotal:0,themeOverride:null},
        ],
        nextId: 5,
        staffAccounts: DEFAULT_STAFF,
      };
    }
  }

  // PENTING: mutasi isi STORE yang sudah ada (jangan reassign STORE = ...),
  // karena app.js sudah menyimpan banyak referensi ke objek STORE yang sama.
  // Jika kita ganti referensinya, fungsi-fungsi lama di app.js yang sudah
  // pegang STORE versi awal tidak akan ikut update.
  STORE.students = resolvedStore.students;
  STORE.nextId = resolvedStore.nextId;
  STORE.staffAccounts = resolvedStore.staffAccounts;

  hideLoadingScreen();
  showSupabaseStatus();

  // Render daftar siswa di halaman login (fungsi ini sudah ada di app.js)
  if (typeof renderStudentPin === 'function') renderStudentPin();
}

function showLoadingScreen() {
  const el = document.createElement('div');
  el.id = 'boot-loading';
  el.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: linear-gradient(160deg,#1A1A2E,#0F3460);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: white; font-family: Arial, sans-serif;
  `;
  el.innerHTML = `
    <div style="font-size:56px;margin-bottom:12px;animation:bootSpin 1.2s linear infinite">🏆</div>
    <div style="font-size:14px;color:#9FE1CB">Memuat data HeroKu...</div>
    <style>@keyframes bootSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(el);
}

function hideLoadingScreen() {
  const el = document.getElementById('boot-loading');
  if (el) el.remove();
}

// ═══════════════════════════════════════════════════════════
// JALANKAN BOOT — menggantikan "let STORE = initStore();" yang lama
// ═══════════════════════════════════════════════════════════
bootApp();
