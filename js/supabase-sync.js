// ═══════════════════════════════════════════════════════════
// SUPABASE SYNC ADAPTER
// File ini MENGGANTIKAN penyimpanan localStorage dengan Supabase.
// Cara kerja: fungsi loadStore() dan saveStore() yang lama (di data.js)
// di-override di sini agar baca/tulis ke database, bukan ke browser.
//
// PENTING: file ini harus di-load SETELAH data.js dan SEBELUM app.js
// di index.html, supaya override ini berlaku sebelum app.js berjalan.
// ═══════════════════════════════════════════════════════════

// ╔═══════════════════════════════════════════════════════════╗
// ║  ⚠️  ISI DULU 2 BARIS DI BAWAH INI SEBELUM UPLOAD!  ⚠️       ║
// ║  Cara dapatkan: Supabase Dashboard → Project Settings → API ║
// ║  JANGAN sampai file ini diupload masih dengan teks          ║
// ║  'GANTI_DENGAN...' — aplikasi tidak akan bisa konek ke DB.  ║
// ╚═══════════════════════════════════════════════════════════╝
const SUPABASE_URL = 'GANTI_DENGAN_PROJECT_URL_ANDA';        // contoh: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'GANTI_DENGAN_ANON_KEY_ANDA';       // kunci publik "anon" / "public"
// ╔═══════════════════════════════════════════════════════════╗
// ║  Berhenti edit di sini — bagian di bawah TIDAK perlu        ║
// ║  diubah, biarkan apa adanya.                                ║
// ╚═══════════════════════════════════════════════════════════╝

// ── INISIALISASI KLIEN SUPABASE ──
// (Library Supabase dimuat lewat <script> CDN di index.html)
const sbClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let SUPABASE_READY = false;
let SUPABASE_ERROR = null;

// ═══════════════════════════════════════════════════════════
// OVERRIDE: loadStore() — sekarang ASYNC, ambil data dari Supabase
// ═══════════════════════════════════════════════════════════
async function loadStoreFromSupabase() {
  if (!sbClient) {
    SUPABASE_ERROR = 'Library Supabase belum termuat. Cek koneksi internet atau urutan <script> di index.html.';
    return null;
  }
  try {
    const { data: students, error: studentsErr } = await sbClient
      .from('students')
      .select('*')
      .order('created_at', { ascending: true });

    if (studentsErr) throw studentsErr;

    const { data: staff, error: staffErr } = await sbClient
      .from('staff_accounts')
      .select('*');

    if (staffErr) throw staffErr;

    const { data: counterRow, error: counterErr } = await sbClient
      .from('app_store')
      .select('value')
      .eq('key', 'next_id')
      .single();

    // Konversi format kolom database (snake_case) → format JS yang dipakai app.js (camelCase)
    const mappedStudents = (students || []).map(s => ({
      id: s.id,
      name: s.name,
      nickname: s.nickname,
      age: s.age,
      kelas: s.kelas,
      avatar: s.avatar,
      pin: s.pin,
      parentPin: s.parent_pin,
      koin: s.koin,
      xp: s.xp,
      level: s.level,
      streak: s.streak,
      lastActive: s.last_active,
      checkedToday: s.checked_today || {},
      verifiedToday: s.verified_today || {},
      totalDays: s.total_days,
      cards: s.cards || [],
      quizCorrect: s.quiz_correct,
      quizTotal: s.quiz_total,
      garage: s.garage || { colorId: 'default', stickers: [], upgrades: [], ownedColors: ['default'] },
      themeOverride: s.theme_override || null,
    }));

    const mappedStaff = (staff || []).map(a => ({
      id: a.id, name: a.name, role: a.role, kelas: a.kelas,
      password: a.password, avatar: a.avatar,
    }));

    SUPABASE_READY = true;
    SUPABASE_ERROR = null;

    return {
      students: mappedStudents,
      staffAccounts: mappedStaff.length ? mappedStaff : DEFAULT_STAFF,
      nextId: counterErr ? mappedStudents.length + 1 : (counterRow?.value || mappedStudents.length + 1),
    };
  } catch (e) {
    SUPABASE_ERROR = 'Gagal memuat data dari Supabase: ' + (e.message || e);
    console.error('[Supabase] loadStore error:', e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// OVERRIDE: saveStore() — sekarang menulis ke Supabase
// Strategi: upsert (update jika ada, insert jika belum ada)
// ═══════════════════════════════════════════════════════════
async function saveStoreToSupabase() {
  if (!sbClient || !STORE) return;
  try {
    // Konversi format JS (camelCase) → format database (snake_case)
    const rows = STORE.students.map(s => ({
      id: s.id,
      name: s.name,
      nickname: s.nickname,
      age: s.age,
      kelas: s.kelas,
      avatar: s.avatar,
      pin: s.pin,
      parent_pin: s.parentPin,
      koin: s.koin,
      xp: s.xp,
      level: s.level,
      streak: s.streak,
      last_active: s.lastActive,
      checked_today: s.checkedToday || {},
      verified_today: s.verifiedToday || {},
      total_days: s.totalDays,
      cards: s.cards || [],
      quiz_correct: s.quizCorrect,
      quiz_total: s.quizTotal,
      garage: s.garage || { colorId: 'default', stickers: [], upgrades: [], ownedColors: ['default'] },
      theme_override: s.themeOverride || null,
    }));

    if (rows.length) {
      const { error } = await sbClient.from('students').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    }

    // Simpan counter next_id
    await sbClient
      .from('app_store')
      .upsert({ key: 'next_id', value: STORE.nextId }, { onConflict: 'key' });

    SUPABASE_ERROR = null;
  } catch (e) {
    SUPABASE_ERROR = 'Gagal menyimpan ke Supabase: ' + (e.message || e);
    console.error('[Supabase] saveStore error:', e);
    // Fallback: tetap simpan ke localStorage sebagai cadangan offline
    try { localStorage.setItem(STORE_KEY + '_fallback', JSON.stringify(STORE)); } catch (_) {}
  }
}

// ═══════════════════════════════════════════════════════════
// HAPUS SISWA — langsung dari Supabase (dipanggil oleh delStudent())
// ═══════════════════════════════════════════════════════════
async function deleteStudentFromSupabase(studentId) {
  if (!sbClient) return;
  try {
    const { error } = await sbClient.from('students').delete().eq('id', studentId);
    if (error) throw error;
  } catch (e) {
    console.error('[Supabase] delete error:', e);
  }
}

// ═══════════════════════════════════════════════════════════
// REALTIME SYNC (opsional, lanjutan)
// Memungkinkan beberapa device melihat update satu sama lain otomatis
// tanpa perlu refresh manual.
// ═══════════════════════════════════════════════════════════
function enableRealtimeSync(onUpdateCallback) {
  if (!sbClient) return;
  sbClient
    .channel('students-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
      console.log('[Supabase Realtime] Perubahan terdeteksi:', payload);
      if (typeof onUpdateCallback === 'function') onUpdateCallback(payload);
    })
    .subscribe();
}

// ═══════════════════════════════════════════════════════════
// STATUS INDICATOR — tampilkan status koneksi ke pengguna
// ═══════════════════════════════════════════════════════════
function showSupabaseStatus() {
  const existing = document.getElementById('supabase-status-badge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'supabase-status-badge';
  badge.style.cssText = `
    position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
    z-index: 9998; padding: 6px 14px; border-radius: 20px;
    font-family: var(--font-round, Arial, sans-serif); font-size: 11px; font-weight: 700;
    display: flex; align-items: center; gap: 6px; transition: opacity 0.3s;
  `;
  if (SUPABASE_READY) {
    badge.style.background = '#EAF9F0';
    badge.style.color = '#1E8449';
    badge.innerHTML = '🟢 Tersambung ke Database';
  } else {
    badge.style.background = '#FDEDEC';
    badge.style.color = '#A93226';
    badge.innerHTML = '🔴 ' + (SUPABASE_ERROR || 'Belum tersambung ke Database');
  }
  document.body.appendChild(badge);
  setTimeout(() => { badge.style.opacity = '0'; setTimeout(() => badge.remove(), 300); }, 4000);
}

// ═══════════════════════════════════════════════════════════
// PAPAN TANTANGAN DARI GURU — fungsi sync ke tabel teacher_quizzes
// Ditambahkan di akhir file supaya tidak mengganggu konfigurasi
// SUPABASE_URL/SUPABASE_ANON_KEY di bagian atas file.
// ═══════════════════════════════════════════════════════════

// Ambil semua soal aktif untuk satu kelas tertentu
async function loadTeacherQuizzes(kelas){
  if(!sbClient) return [];
  try{
    const { data, error } = await sbClient
      .from('teacher_quizzes')
      .select('*')
      .eq('kelas', kelas)
      .eq('is_active', true)
      .order('created_at', { ascending:false });
    if(error) throw error;
    return (data||[]).map(q => ({
      id: q.id, teacherId: q.teacher_id, kelas: q.kelas,
      category: q.category, ageGroup: q.age_group,
      question: q.question,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      correctAnswer: q.correct_answer, bonusKoin: q.bonus_koin,
    }));
  }catch(e){
    console.error('[Supabase] loadTeacherQuizzes error:', e);
    return [];
  }
}

// Ambil SEMUA soal buatan guru tertentu (termasuk non-aktif), untuk halaman kelola guru
async function loadTeacherQuizzesByTeacher(teacherId){
  if(!sbClient) return [];
  try{
    const { data, error } = await sbClient
      .from('teacher_quizzes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending:false });
    if(error) throw error;
    return (data||[]).map(q => ({
      id: q.id, teacherId: q.teacher_id, kelas: q.kelas,
      category: q.category, ageGroup: q.age_group,
      question: q.question,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      correctAnswer: q.correct_answer, bonusKoin: q.bonus_koin,
      isActive: q.is_active,
    }));
  }catch(e){
    console.error('[Supabase] loadTeacherQuizzesByTeacher error:', e);
    return [];
  }
}

// Simpan soal baru dari guru
async function saveTeacherQuiz(quizData){
  if(!sbClient) return null;
  try{
    const { data, error } = await sbClient
      .from('teacher_quizzes')
      .insert({
        teacher_id: quizData.teacherId,
        kelas: quizData.kelas,
        category: quizData.category,
        age_group: quizData.ageGroup,
        question: quizData.question,
        option_a: quizData.options[0],
        option_b: quizData.options[1],
        option_c: quizData.options[2],
        option_d: quizData.options[3],
        correct_answer: quizData.correctAnswer,
        bonus_koin: quizData.bonusKoin || 20,
      })
      .select()
      .single();
    if(error) throw error;
    return data;
  }catch(e){
    console.error('[Supabase] saveTeacherQuiz error:', e);
    return null;
  }
}

// Hapus / nonaktifkan soal
async function deleteTeacherQuiz(quizId){
  if(!sbClient) return false;
  try{
    const { error } = await sbClient.from('teacher_quizzes').delete().eq('id', quizId);
    if(error) throw error;
    return true;
  }catch(e){
    console.error('[Supabase] deleteTeacherQuiz error:', e);
    return false;
  }
}

// Catat percobaan jawaban siswa (upsert: percobaan terbaru menimpa yang lama)
async function recordQuizAttempt(quizId, studentId, isCorrect){
  if(!sbClient) return false;
  try{
    const { error } = await sbClient
      .from('teacher_quiz_attempts')
      .upsert({ quiz_id: quizId, student_id: studentId, is_correct: isCorrect, answered_at: new Date().toISOString() },
        { onConflict: 'quiz_id,student_id' });
    if(error) throw error;
    return true;
  }catch(e){
    console.error('[Supabase] recordQuizAttempt error:', e);
    return false;
  }
}

// Ambil rekap siapa saja yang sudah menjawab soal tertentu (untuk guru lihat progres kelas)
async function loadQuizAttempts(quizId){
  if(!sbClient) return [];
  try{
    const { data, error } = await sbClient
      .from('teacher_quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId);
    if(error) throw error;
    return data || [];
  }catch(e){
    console.error('[Supabase] loadQuizAttempts error:', e);
    return [];
  }
}
