-- ═══════════════════════════════════════════════════════════
-- HEROKU DATABASE SCHEMA — Supabase / PostgreSQL
-- Jalankan seluruh file ini di Supabase SQL Editor
-- (Project → SQL Editor → New Query → paste semua → Run)
-- ═══════════════════════════════════════════════════════════

-- Hapus tabel lama jika ada (aman untuk setup awal/reset)
drop table if exists habit_logs cascade;
drop table if exists students cascade;
drop table if exists staff_accounts cascade;
drop table if exists app_store cascade;

-- ═══════════════════════════════════════════════════════════
-- TABEL: students
-- Menyimpan semua data siswa — pengganti STORE.students[]
-- ═══════════════════════════════════════════════════════════
create table students (
  id text primary key,                    -- contoh: 's1', 's2', dst
  name text not null,
  nickname text,
  age int,
  kelas text,
  avatar text default '🦁',
  pin text unique not null,               -- PIN login siswa (4 digit)
  parent_pin text unique,                 -- PIN login orang tua (4 digit)
  koin int default 0,
  xp int default 0,
  level int default 1,
  streak int default 0,
  last_active date,
  checked_today jsonb default '{}'::jsonb,      -- {pagi:true, ibadah:true, ...}
  verified_today jsonb default '{}'::jsonb,      -- {olahraga:'yes', makan:'no', ...}
  total_days int default 0,
  cards jsonb default '[]'::jsonb,               -- array id kartu koleksi
  quiz_correct int default 0,
  quiz_total int default 0,
  garage jsonb default '{"colorId":"default","stickers":[],"upgrades":[],"ownedColors":["default"]}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: staff_accounts
-- Akun guru, kepala sekolah, admin — pengganti DEFAULT_STAFF[]
-- ═══════════════════════════════════════════════════════════
create table staff_accounts (
  id text primary key,                    -- contoh: 'guru01', 'kepsek1'
  name text not null,
  role text not null,                     -- 'guru' | 'kepsek' | 'admin'
  kelas text,
  password text not null,                 -- demo: plain text. Produksi: harus di-hash!
  avatar text default '👩‍🏫',
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: habit_logs (riwayat historis — untuk laporan jangka panjang)
-- Opsional dipakai sekarang, tapi disiapkan untuk laporan mingguan/bulanan nanti
-- ═══════════════════════════════════════════════════════════
create table habit_logs (
  id bigint generated always as identity primary key,
  student_id text references students(id) on delete cascade,
  habit_id text not null,                 -- 'pagi', 'ibadah', dst
  log_date date not null,
  verified text,                          -- null | 'yes' | 'no'
  koin_earned int default 0,
  xp_earned int default 0,
  created_at timestamptz default now(),
  unique(student_id, habit_id, log_date)
);

-- ═══════════════════════════════════════════════════════════
-- TABEL: app_store (cadangan — penyimpanan kunci-nilai serbaguna)
-- Berguna untuk menyimpan counter global seperti next_id
-- ═══════════════════════════════════════════════════════════
create table app_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Untuk demo/pilot: izinkan akses publik baca-tulis penuh
-- (Nanti saat produksi sungguhan, ini HARUS diperketat dengan auth)
-- ═══════════════════════════════════════════════════════════
alter table students enable row level security;
alter table staff_accounts enable row level security;
alter table habit_logs enable row level security;
alter table app_store enable row level security;

create policy "allow_all_students" on students for all using (true) with check (true);
create policy "allow_all_staff" on staff_accounts for all using (true) with check (true);
create policy "allow_all_logs" on habit_logs for all using (true) with check (true);
create policy "allow_all_store" on app_store for all using (true) with check (true);

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: auto-update updated_at saat data diubah
-- ═══════════════════════════════════════════════════════════
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_students_updated
  before update on students
  for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- DATA AWAL: 4 siswa pertama (sama seperti versi localStorage)
-- ═══════════════════════════════════════════════════════════
insert into students (id, name, nickname, age, kelas, avatar, pin, parent_pin) values
  ('s1', 'Ahmad Badshah Al Fath',       'Badshah', 10, 'Usman Bin Affan',    '🦁', '1001', '2001'),
  ('s2', 'Ahmad Ibrohim Khalid Zayyan', 'Ibrohim', 11, 'Usman Bin Affan',    '🌙', '1002', '2002'),
  ('s3', 'Ahmad Zeeshan Al Barra',      'Zeeshan', 10, 'Umar Bin Khattab',   '⚡', '1003', '2003'),
  ('s4', 'Bahzah Dee Hasya',            'Hasya',    9, 'Abu Bakar As Siddiq','🌟', '1004', '2004');

-- ═══════════════════════════════════════════════════════════
-- DATA AWAL: Akun staf (guru, kepala sekolah, admin)
-- ═══════════════════════════════════════════════════════════
insert into staff_accounts (id, name, role, kelas, password, avatar) values
  ('guru01',  'Reski Wulandari, S.Pd.',          'guru',   'Usman Bin Affan',    'guru01',     '👩‍🏫'),
  ('guru02',  'Hilyatul Jannah',                  'guru',   'Umar Bin Khattab',   'guru02',     '👩‍🏫'),
  ('guru03',  'Muzdalifah Alima Salam, S.Pd.',   'guru',   'Abu Bakar As Siddiq','guru03',     '👩‍🏫'),
  ('guru04',  'Nurhayati, S.Pd.',                 'guru',   'Ali Bin Abi Thalib', 'guru04',     '👩‍🏫'),
  ('kepsek1', 'Musyarrafah, S.Psi., M.Pd.',      'kepsek', 'Semua Kelas',        'kepsek2025', '👩‍💼'),
  ('admin1',  'Ainani Hermansyah',                'admin',  'Semua Kelas',        'admin2025',  '⚙️');

-- ═══════════════════════════════════════════════════════════
-- COUNTER: next_id untuk siswa baru (dimulai dari 5)
-- ═══════════════════════════════════════════════════════════
insert into app_store (key, value) values ('next_id', '5'::jsonb);

-- ═══════════════════════════════════════════════════════════
-- SELESAI — Verifikasi dengan query ini:
-- select * from students;
-- select * from staff_accounts;
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- MIGRASI TAHAP 1: KELOMPOK USIA & TEMA VISUAL
-- Jalankan blok ini di SQL Editor Supabase (terpisah dari skema awal)
-- ═══════════════════════════════════════════════════════════

-- Kolom untuk preferensi tema manual (override).
-- NULL = pakai default otomatis dari usia. Diisi 'muda'/'menengah'/'dewasa' jika siswa pilih sendiri.
alter table students add column if not exists theme_override text;

-- Catatan: kelompok usia TIDAK disimpan sebagai kolom terpisah,
-- karena bisa dihitung langsung dari kolom 'age' yang sudah ada:
--   age 6-8   -> kelompok 'muda'
--   age 9-11  -> kelompok 'menengah'
--   age 12-15 -> kelompok 'dewasa'
-- Ini menghindari data tidak konsisten jika usia diubah tapi kelompok lupa diupdate.

-- Verifikasi:
-- select id, name, age, theme_override from students;

-- ═══════════════════════════════════════════════════════════
-- MIGRASI TAHAP 6: PAPAN TANTANGAN DARI GURU
-- Jalankan blok ini di SQL Editor Supabase (terpisah dari skema awal)
-- ═══════════════════════════════════════════════════════════

create table if not exists teacher_quizzes (
  id bigint generated always as identity primary key,
  teacher_id text not null,             -- ID guru pembuat (cth: 'guru01')
  kelas text not null,                  -- Kelas yang dituju (cth: 'Usman Bin Affan')
  category text not null,               -- 'agama' | 'math' | 'english' | 'sains' | 'sejarah'
  age_group text not null,              -- 'muda' | 'menengah' | 'dewasa'
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer int not null,          -- index 0-3 (0=A, 1=B, 2=C, 3=D)
  bonus_koin int default 20,
  is_active boolean default true,       -- guru bisa nonaktifkan tanpa hapus
  created_at timestamptz default now()
);

-- Mencatat siapa yang sudah menjawab soal buatan guru (untuk guru pantau progres)
create table if not exists teacher_quiz_attempts (
  id bigint generated always as identity primary key,
  quiz_id bigint references teacher_quizzes(id) on delete cascade,
  student_id text references students(id) on delete cascade,
  is_correct boolean not null,
  answered_at timestamptz default now(),
  unique(quiz_id, student_id) -- satu siswa hanya tercatat 1x per soal (percobaan terakhir)
);

alter table teacher_quizzes enable row level security;
alter table teacher_quiz_attempts enable row level security;
create policy "allow_all_teacher_quizzes" on teacher_quizzes for all using (true) with check (true);
create policy "allow_all_quiz_attempts" on teacher_quiz_attempts for all using (true) with check (true);

-- Verifikasi:
-- select * from teacher_quizzes;
-- select * from teacher_quiz_attempts;

-- ═══════════════════════════════════════════════════════════
-- PERBAIKAN BUG: Reset theme_override dari sesi testing sebelumnya
-- Jalankan SEKALI saja untuk membersihkan data testing lama.
-- (Bug ditemukan: soal kuis & Papan Tantangan keliru memakai preferensi
-- TEMA VISUAL untuk menentukan tingkat soal, padahal seharusnya
-- berdasarkan USIA ASLI siswa. Sudah diperbaiki di kode, tapi data lama
-- yang sempat ter-set saat testing perlu dibersihkan agar konsisten.)
-- ═══════════════════════════════════════════════════════════
update students set theme_override = null where theme_override is not null;

-- Verifikasi setelah dijalankan (harus kosong/tidak ada baris):
-- select id, name, age, theme_override from students where theme_override is not null;
