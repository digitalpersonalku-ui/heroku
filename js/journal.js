// ═══════════════════════════════════════════════════════════
// HEROKU JOURNAL v1.0
// Rekap riwayat jurnal check-in siswa
//
// File: js/journal.js
// Pasang di index.html setelah student-form.js:
//   <script src="js/journal.js"></script>
//
// Fitur:
//   - Auto-save checkin_logs ke Supabase setiap login (jika hari berubah)
//   - Halaman rekap di panel Admin: per siswa / per kelas
//   - Filter: harian / mingguan / bulanan / rentang custom
//   - Export PDF (window.print)
//   - Export Excel (SheetJS via CDN)
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ── Nama-nama kebiasaan ──────────────────────────────────
  const HABIT_KEYS  = ['pagi','ibadah','olahraga','makan','belajar','sosial','tidur'];
  const HABIT_NAMES = {
    pagi:     '🌅 Bangun Pagi',
    ibadah:   '🕌 Ibadah',
    olahraga: '🏃 Olahraga',
    makan:    '🥗 Makan Sehat',
    belajar:  '📚 Belajar',
    sosial:   '🤝 Sosial',
    tidur:    '😴 Tidur Cukup',
  };

  // ── Supabase shortcut ────────────────────────────────────
  function sb() { return W.sbClient || null; }

  // ── Format tanggal ───────────────────────────────────────
  function toDateStr(d) {
    // Returns YYYY-MM-DD in WIB
    const wib = new Date(d.getTime() + 7 * 3600000);
    return wib.toISOString().slice(0, 10);
  }

  function todayWIB() { return toDateStr(new Date()); }

  function fmtDisplay(dateStr) {
    // YYYY-MM-DD → DD/MM/YYYY
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function dayName(dateStr) {
    const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    return days[new Date(dateStr + 'T00:00:00').getDay()];
  }

  // ── Rentang tanggal helper ───────────────────────────────
  function rangeFor(mode, refDate) {
    const d = refDate ? new Date(refDate + 'T00:00:00') : new Date();
    const today = toDateStr(d);

    if (mode === 'day') {
      return { from: today, to: today };
    }
    if (mode === 'week') {
      const dow = d.getDay(); // 0=Sun
      const mon = new Date(d); mon.setDate(d.getDate() - ((dow + 6) % 7));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: toDateStr(mon), to: toDateStr(sun) };
    }
    if (mode === 'month') {
      const from = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
      const last = new Date(d.getFullYear(), d.getMonth()+1, 0);
      return { from, to: toDateStr(last) };
    }
    return { from: today, to: today };
  }

  // ═══════════════════════════════════════════════════════════
  // SAVE checkin_logs — dipanggil saat login siswa & hari berubah
  // ═══════════════════════════════════════════════════════════
  async function saveCheckinLog(student, date) {
    const client = sb();
    if (!client) return;
    const habits   = student.checkedToday  || {};
    const verified = student.verifiedToday || {};
    const total    = Object.keys(habits).length;

    try {
      await client.from('checkin_logs').upsert({
        student_id:   student.id,
        date:         date,
        habits:       habits,
        verified:     verified,
        total_habits: total,
      }, { onConflict: 'student_id,date' });
    } catch (e) {
      console.warn('[JRN] saveCheckinLog error:', e);
    }
  }

  // Patch resetDayIfNeeded agar auto-save sebelum reset
  // ── Flush: simpan checkin_logs untuk siswa yang punya data ─
  // Dipanggil dari 2 titik: saat resetDayIfNeeded & saat saveStore
  async function flushCheckinLogs(onlyStudentId) {
    const client = sb();
    if (!client || !W.STORE) return;
    const today = todayWIB();
    const targets = onlyStudentId
      ? W.STORE.students.filter(s => s.id === onlyStudentId)
      : W.STORE.students;
    for (const s of targets) {
      const habits = s.checkedToday || {};
      if (!Object.keys(habits).length) continue;
      const date = s.lastActive || today;
      await saveCheckinLog(s, date);
    }
  }

  // Patch resetDayIfNeeded — save kemarin sebelum di-reset
  function patchResetDay() {
    if (typeof W.resetDayIfNeeded !== 'function') return;
    if (W.resetDayIfNeeded._jrn_patched) return;
    const _orig = W.resetDayIfNeeded;
    W.resetDayIfNeeded = function (s) {
      const t = typeof todayStr === 'function' ? todayStr() : todayWIB();
      if (s.lastActive && s.lastActive !== t && Object.keys(s.checkedToday || {}).length > 0) {
        saveCheckinLog(s, s.lastActive);
      }
      return _orig.call(this, s);
    };
    W.resetDayIfNeeded._jrn_patched = true;
  }

  // Patch saveStore — setiap kali data disimpan ke Supabase,
  // pastikan checkin hari ini juga masuk ke checkin_logs
  function patchSaveStore() {
    if (typeof W.saveStore !== 'function') return;
    if (W.saveStore._jrn_patched) return;
    const _orig = W.saveStore;
    W.saveStore = async function (studentId) {
      await _orig.apply(this, arguments);
      flushCheckinLogs(studentId || null);
    };
    W.saveStore._jrn_patched = true;
  }

  // ═══════════════════════════════════════════════════════════
  // LOAD checkin_logs dari Supabase
  // ═══════════════════════════════════════════════════════════
  async function loadLogs({ studentIds, from, to }) {
    const client = sb();
    if (!client) return [];
    try {
      let q = client.from('checkin_logs')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false });

      if (studentIds && studentIds.length) {
        q = q.in('student_id', studentIds);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('[JRN] loadLogs error:', e);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════
  function injectCSS() {
    if (document.getElementById('_jrn_css')) return;
    const s = document.createElement('style');
    s.id = '_jrn_css';
    s.textContent = `
/* ── Journal Panel ── */
#_jrn_panel {
  margin: 10px 0;
  font-family: var(--font-round, 'Trebuchet MS', Arial, sans-serif);
}
._jrn_card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,.07);
}
._jrn_title {
  font-size: 15px;
  font-weight: 900;
  color: #1E8449;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
._jrn_controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
}
._jrn_select, ._jrn_input {
  padding: 7px 10px;
  border: 1.5px solid #DDD;
  border-radius: 9px;
  font-size: 12px;
  font-family: inherit;
  background: #FAFAFA;
  color: #333;
  outline: none;
  cursor: pointer;
}
._jrn_select:focus, ._jrn_input:focus {
  border-color: #27AE60;
  background: #fff;
}
._jrn_btn {
  padding: 7px 14px;
  border: none;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: transform .1s;
}
._jrn_btn:active { transform: scale(.97); }
._jrn_btn_primary { background: #27AE60; color: #fff; }
._jrn_btn_pdf     { background: #E74C3C; color: #fff; }
._jrn_btn_excel   { background: #1E8449; color: #fff; }
._jrn_btn_primary:hover { background: #229954; }
._jrn_btn_pdf:hover     { background: #C0392B; }
._jrn_btn_excel:hover   { background: #196F3D; }

/* ── Summary cards ── */
._jrn_summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
._jrn_sum_item {
  background: linear-gradient(135deg, #EAF9F0, #D5F5E3);
  border-radius: 10px;
  padding: 10px;
  text-align: center;
}
._jrn_sum_val {
  font-size: 22px;
  font-weight: 900;
  color: #1E8449;
  line-height: 1;
}
._jrn_sum_lbl {
  font-size: 10px;
  color: #5D6D7E;
  margin-top: 3px;
}

/* ── Table ── */
._jrn_table_wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
._jrn_table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  min-width: 480px;
}
._jrn_table th {
  background: #1E8449;
  color: #fff;
  padding: 7px 6px;
  text-align: center;
  font-weight: 700;
  white-space: nowrap;
}
._jrn_table th:first-child { text-align: left; border-radius: 8px 0 0 0; }
._jrn_table th:last-child  { border-radius: 0 8px 0 0; }
._jrn_table td {
  padding: 6px;
  border-bottom: 1px solid #F0F0F0;
  text-align: center;
  vertical-align: middle;
}
._jrn_table td:first-child { text-align: left; font-weight: 700; color: #2C3E50; }
._jrn_table tr:last-child td { border-bottom: none; }
._jrn_table tr:hover td { background: #F9FEF9; }
._jrn_hab_ok  { color: #27AE60; font-size: 14px; }
._jrn_hab_no  { color: #DDD;    font-size: 14px; }
._jrn_hab_vfy { color: #F39C12; font-size: 14px; }
._jrn_score   {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 11px;
}
._jrn_score.full   { background: #D5F5E3; color: #1E8449; }
._jrn_score.good   { background: #FEF9E7; color: #D4AC0D; }
._jrn_score.low    { background: #FDEDEC; color: #C0392B; }
._jrn_score.none   { background: #F2F3F4; color: #AAA; }
._jrn_empty {
  text-align: center;
  padding: 30px;
  color: #AAA;
  font-size: 13px;
}

/* ── Per-Siswa Detail ── */
._jrn_student_detail {
  margin-top: 8px;
}
._jrn_cal_row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
._jrn_cal_dot {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  cursor: default;
  position: relative;
}
._jrn_cal_dot.full   { background: #27AE60; color: #fff; }
._jrn_cal_dot.good   { background: #F9CA24; color: #333; }
._jrn_cal_dot.low    { background: #E74C3C; color: #fff; }
._jrn_cal_dot.none   { background: #EEE;    color: #AAA; }
._jrn_cal_dot.future { background: #F8F9FA; color: #DDD; border: 1px dashed #DDD; }

/* ── Print styles ── */
@media print {
  body > *:not(#_jrn_print_area) { display: none !important; }
  #_jrn_print_area {
    display: block !important;
    font-family: Arial, sans-serif;
    font-size: 11px;
    color: #000;
  }
  ._jrn_no_print { display: none !important; }
  ._jrn_table th { background: #2c7a4b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  ._jrn_hab_ok  { color: #27AE60 !important; }
  ._jrn_hab_no  { color: #CCC !important; }
}
#_jrn_print_area { display: none; }
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  let _mode    = 'week';   // day | week | month | custom
  let _view    = 'kelas';  // kelas | siswa
  let _kelas   = 'all';
  let _student = '';
  let _from    = '';
  let _to      = '';
  let _logs    = [];
  let _loading = false;

  // ═══════════════════════════════════════════════════════════
  // RENDER PANEL
  // ═══════════════════════════════════════════════════════════
  function buildPanel() {
    if (document.getElementById('_jrn_panel')) return;

    const adminList = document.getElementById('admin-list');
    if (!adminList) return;

    const panel = document.createElement('div');
    panel.id = '_jrn_panel';
    panel.innerHTML = `
      <div class="_jrn_card">
        <div class="_jrn_title">📓 Jurnal Kebiasaan Siswa</div>

        <!-- Controls -->
        <div class="_jrn_controls _jrn_no_print">
          <!-- View mode -->
          <select class="_jrn_select" id="_jrn_view" onchange="JRN.onViewChange(this.value)">
            <option value="kelas">📊 Per Kelas</option>
            <option value="siswa">👤 Per Siswa</option>
          </select>

          <!-- Kelas filter (show when view=kelas or siswa) -->
          <select class="_jrn_select" id="_jrn_kelas" onchange="JRN.onKelasChange(this.value)">
            <option value="all">Semua Kelas</option>
            <option value="Usman Bin Affan">Usman Bin Affan</option>
            <option value="Umar Bin Khattab">Umar Bin Khattab</option>
            <option value="Abu Bakar As Siddiq">Abu Bakar As Siddiq</option>
            <option value="Ali Bin Abi Thalib">Ali Bin Abi Thalib</option>
          </select>

          <!-- Siswa filter (show when view=siswa) -->
          <select class="_jrn_select" id="_jrn_student" style="display:none" onchange="JRN.onStudentChange(this.value)">
            <option value="">-- Pilih Siswa --</option>
          </select>

          <!-- Periode -->
          <select class="_jrn_select" id="_jrn_mode" onchange="JRN.onModeChange(this.value)">
            <option value="day">Hari Ini</option>
            <option value="week" selected>Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="custom">Rentang Custom</option>
          </select>

          <!-- Custom range -->
          <span id="_jrn_custom_range" style="display:none;gap:4px;align-items:center;display:none">
            <input class="_jrn_input" type="date" id="_jrn_from" style="width:130px">
            <span style="color:#999;font-size:11px">s/d</span>
            <input class="_jrn_input" type="date" id="_jrn_to" style="width:130px">
          </span>

          <button class="_jrn_btn _jrn_btn_primary _jrn_no_print" onclick="JRN.load()">🔍 Tampilkan</button>
        </div>

        <!-- Export buttons -->
        <div class="_jrn_controls _jrn_no_print" id="_jrn_export_row" style="display:none">
          <button class="_jrn_btn _jrn_btn_pdf"   onclick="JRN.exportPDF()">🖨️ Export PDF</button>
          <button class="_jrn_btn _jrn_btn_excel" onclick="JRN.exportExcel()">📊 Export Excel</button>
        </div>

        <!-- Summary -->
        <div id="_jrn_summary"></div>

        <!-- Content -->
        <div id="_jrn_content">
          <div class="_jrn_empty">Pilih periode lalu klik <strong>Tampilkan</strong></div>
        </div>
      </div>
    `;

    // Sisipkan sebelum admin-list
    adminList.parentNode.insertBefore(panel, adminList);
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  W.JRN = {

    onViewChange(val) {
      _view = val;
      const studentSel = document.getElementById('_jrn_student');
      const kelasSel   = document.getElementById('_jrn_kelas');
      if (val === 'siswa') {
        studentSel.style.display = '';
        populateStudentDropdown();
      } else {
        studentSel.style.display = 'none';
      }
    },

    onKelasChange(val) {
      _kelas = val;
      if (_view === 'siswa') populateStudentDropdown();
    },

    onStudentChange(val) {
      _student = val;
    },

    onModeChange(val) {
      _mode = val;
      const cr = document.getElementById('_jrn_custom_range');
      if (cr) cr.style.display = val === 'custom' ? 'flex' : 'none';
    },

    async load() {
      if (_loading) return;
      _loading = true;

      const btn = document.querySelector('._jrn_btn_primary');
      if (btn) btn.textContent = '⏳ Memuat...';

      // Tentukan rentang tanggal
      let from, to;
      if (_mode === 'custom') {
        from = document.getElementById('_jrn_from').value;
        to   = document.getElementById('_jrn_to').value;
        if (!from || !to) { alert('Pilih tanggal mulai dan akhir!'); _loading = false; if(btn) btn.textContent='🔍 Tampilkan'; return; }
      } else {
        const r = rangeFor(_mode);
        from = r.from; to = r.to;
      }
      _from = from; _to = to;

      // Tentukan siswa yang dicari
      const students = W.STORE?.students || [];
      let filtered = students;
      if (_kelas !== 'all') filtered = filtered.filter(s => s.kelas === _kelas);
      if (_view === 'siswa' && _student) filtered = filtered.filter(s => s.id === _student);

      const ids = filtered.map(s => s.id);
      _logs = await loadLogs({ studentIds: ids, from, to });

      renderContent(filtered, from, to);

      _loading = false;
      if (btn) btn.textContent = '🔍 Tampilkan';
      document.getElementById('_jrn_export_row').style.display = _logs.length ? 'flex' : 'none';
    },

    exportPDF() {
      buildPrintArea();
      window.print();
    },

    exportExcel() {
      exportToExcel();
    },
  };

  // ── Populate student dropdown ────────────────────────────
  function populateStudentDropdown() {
    const sel = document.getElementById('_jrn_student');
    if (!sel) return;
    const students = W.STORE?.students || [];
    let list = students;
    if (_kelas !== 'all') list = list.filter(s => s.kelas === _kelas);
    sel.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
      list.map(s => `<option value="${s.id}">${s.name} (${s.kelas})</option>`).join('');
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER CONTENT
  // ═══════════════════════════════════════════════════════════
  function renderContent(students, from, to) {
    const content = document.getElementById('_jrn_content');
    if (!content) return;

    if (!_logs.length && !students.length) {
      content.innerHTML = '<div class="_jrn_empty">Tidak ada data untuk periode ini.</div>';
      renderSummary([], students);
      return;
    }

    // Map logs by student_id + date
    const logMap = {};
    _logs.forEach(l => {
      if (!logMap[l.student_id]) logMap[l.student_id] = {};
      logMap[l.student_id][l.date] = l;
    });

    // Generate date range
    const dates = getDatesInRange(from, to);

    if (_view === 'kelas') {
      renderKelasView(students, dates, logMap);
    } else {
      const student = students[0];
      if (!student) {
        content.innerHTML = '<div class="_jrn_empty">Pilih siswa terlebih dahulu.</div>';
        return;
      }
      renderSiswaView(student, dates, logMap[student.id] || {});
    }

    renderSummary(_logs, students);
  }

  function getDatesInRange(from, to) {
    const dates = [];
    let cur = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');
    while (cur <= end) {
      dates.push(toDateStr(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  // ── Per Kelas view ───────────────────────────────────────
  function renderKelasView(students, dates, logMap) {
    const content = document.getElementById('_jrn_content');

    // Jika rentang > 7 hari, tampilkan ringkasan per siswa
    if (dates.length > 7) {
      renderKelasRingkasan(students, dates, logMap);
      return;
    }

    // ≤7 hari: tabel lengkap per tanggal
    const cols = dates.map(d => `
      <th style="min-width:72px">
        <div>${dayName(d)}</div>
        <div style="font-weight:400;font-size:10px">${fmtDisplay(d)}</div>
      </th>`).join('');

    const rows = students.map(s => {
      const sLogs = logMap[s.id] || {};
      const cells = dates.map(d => {
        const log = sLogs[d];
        if (!log) return `<td><span class="_jrn_score none">-</span></td>`;
        const n = log.total_habits;
        const cls = n === 7 ? 'full' : n >= 4 ? 'good' : 'low';
        const tips = HABIT_KEYS.map(k =>
          log.habits?.[k] ? `✅ ${HABIT_NAMES[k]}` : `❌ ${HABIT_NAMES[k]}`
        ).join('\n');
        return `<td title="${tips}"><span class="_jrn_score ${cls}">${n}/7</span></td>`;
      }).join('');

      const total = Object.values(logMap[s.id] || {}).reduce((a, l) => a + (l.total_habits || 0), 0);
      const avg = dates.length ? (total / dates.filter(d => logMap[s.id]?.[d]).length || 0).toFixed(1) : '-';

      return `
        <tr>
          <td>
            <div style="font-weight:700">${s.nickname || s.name.split(' ')[0]}</div>
            <div style="font-size:10px;color:#888">${s.kelas}</div>
          </td>
          ${cells}
          <td><strong>${isNaN(avg) ? '-' : avg}</strong></td>
        </tr>`;
    }).join('');

    content.innerHTML = `
      <div class="_jrn_table_wrap">
        <table class="_jrn_table">
          <thead>
            <tr>
              <th style="min-width:110px">Siswa</th>
              ${cols}
              <th>Rata²</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="99" class="_jrn_empty">Belum ada data check-in.</td></tr>'}</tbody>
        </table>
      </div>`;
  }

  // Ringkasan per siswa untuk rentang > 7 hari
  function renderKelasRingkasan(students, dates, logMap) {
    const content = document.getElementById('_jrn_content');

    const rows = students.map(s => {
      const sLogs = logMap[s.id] || {};
      const activeDays  = Object.keys(sLogs).length;
      const totalHabits = Object.values(sLogs).reduce((a, l) => a + (l.total_habits || 0), 0);
      const perfectDays = Object.values(sLogs).filter(l => l.total_habits === 7).length;
      const avgHabits   = activeDays ? (totalHabits / activeDays).toFixed(1) : '-';
      const pct         = dates.length ? Math.round(activeDays / dates.length * 100) : 0;
      const pctCls      = pct >= 80 ? 'full' : pct >= 50 ? 'good' : 'low';

      // Mini habit breakdown
      const habitBreak = HABIT_KEYS.map(k => {
        const cnt = Object.values(sLogs).filter(l => l.habits?.[k]).length;
        const p   = activeDays ? Math.round(cnt / activeDays * 100) : 0;
        return `<span title="${HABIT_NAMES[k]}: ${cnt}x (${p}%)" style="
          display:inline-block;width:14px;height:14px;border-radius:3px;margin:1px;
          background:${p>=80?'#27AE60':p>=50?'#F9CA24':'#EEE'};
          font-size:8px;line-height:14px;text-align:center;color:${p>=80?'#fff':p>=50?'#333':'#AAA'}
        ">${HABIT_KEYS.indexOf(k)+1}</span>`;
      }).join('');

      return `
        <tr>
          <td>
            <div style="font-weight:700">${s.name}</div>
            <div style="font-size:10px;color:#888">${s.kelas} · ${s.nickname || ''}</div>
          </td>
          <td><span class="_jrn_score ${pctCls}">${activeDays}/${dates.length}</span></td>
          <td>${avgHabits}</td>
          <td><strong style="color:#27AE60">${perfectDays}</strong></td>
          <td>${habitBreak}</td>
        </tr>`;
    }).join('');

    content.innerHTML = `
      <div style="font-size:11px;color:#888;margin-bottom:8px">
        Periode: ${fmtDisplay(_from)} – ${fmtDisplay(_to)} (${dates.length} hari)
      </div>
      <div class="_jrn_table_wrap">
        <table class="_jrn_table">
          <thead>
            <tr>
              <th style="min-width:130px">Siswa</th>
              <th>Hari Aktif</th>
              <th>Rata² Kebiasaan</th>
              <th>🌟 Hari Sempurna</th>
              <th>Detail Kebiasaan</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="5" class="_jrn_empty">Belum ada data.</td></tr>'}</tbody>
        </table>
      </div>
      <div style="font-size:10px;color:#999;margin-top:6px">
        💡 Angka 1-7 = ${HABIT_KEYS.map((k,i)=>`${i+1}:${HABIT_NAMES[k].replace(/[^\w ]/g,'').trim()}`).join(', ')}
      </div>`;
  }

  // ── Per Siswa view ───────────────────────────────────────
  function renderSiswaView(student, dates, sLogs) {
    const content = document.getElementById('_jrn_content');

    // Kalender dots
    const dots = dates.map(d => {
      const log = sLogs[d];
      const isFuture = d > todayWIB();
      if (isFuture) return `<div class="_jrn_cal_dot future" title="${fmtDisplay(d)}">${new Date(d+'T00:00:00').getDate()}</div>`;
      if (!log)     return `<div class="_jrn_cal_dot none"   title="${fmtDisplay(d)}: Tidak ada data">${new Date(d+'T00:00:00').getDate()}</div>`;
      const n = log.total_habits;
      const cls = n === 7 ? 'full' : n >= 4 ? 'good' : 'low';
      const tips = HABIT_KEYS.map(k => log.habits?.[k] ? `✅ ${HABIT_NAMES[k]}` : `❌ ${HABIT_NAMES[k]}`).join('\n');
      return `<div class="_jrn_cal_dot ${cls}" title="${fmtDisplay(d)}\n${tips}">${new Date(d+'T00:00:00').getDate()}</div>`;
    }).join('');

    // Detail table
    const rows = dates.filter(d => sLogs[d]).map(d => {
      const log = sLogs[d];
      const cells = HABIT_KEYS.map(k => {
        const ok  = log.habits?.[k];
        const vfy = log.verified?.[k];
        if (!ok)  return `<td><span class="_jrn_hab_no">✗</span></td>`;
        if (vfy)  return `<td><span class="_jrn_hab_vfy" title="Diverifikasi ortu">✅</span></td>`;
        return `<td><span class="_jrn_hab_ok">✓</span></td>`;
      }).join('');

      const n   = log.total_habits;
      const cls = n === 7 ? 'full' : n >= 4 ? 'good' : 'low';
      return `
        <tr>
          <td>
            <div>${dayName(d)}</div>
            <div style="font-size:10px;color:#888">${fmtDisplay(d)}</div>
          </td>
          ${cells}
          <td><span class="_jrn_score ${cls}">${n}/7</span></td>
        </tr>`;
    }).join('');

    const habHeaders = HABIT_KEYS.map(k =>
      `<th style="min-width:34px;font-size:10px" title="${HABIT_NAMES[k]}">${HABIT_NAMES[k].split(' ')[0]}</th>`
    ).join('');

    content.innerHTML = `
      <div style="margin-bottom:10px">
        <div style="font-weight:900;font-size:14px;color:#2C3E50">${student.name}</div>
        <div style="font-size:11px;color:#888">${student.kelas} · ${fmtDisplay(_from)} – ${fmtDisplay(_to)}</div>
      </div>
      <div class="_jrn_cal_row">${dots}</div>
      <div style="font-size:10px;color:#888;margin-bottom:10px">
        🟢 Sempurna (7/7) &nbsp; 🟡 Baik (4-6/7) &nbsp; 🔴 Perlu perhatian (&lt;4/7)
      </div>
      ${rows ? `
      <div class="_jrn_table_wrap">
        <table class="_jrn_table">
          <thead>
            <tr>
              <th style="min-width:80px">Tanggal</th>
              ${habHeaders}
              <th>Skor</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="font-size:10px;color:#888;margin-top:6px">
        ✓ Centang sendiri &nbsp; ✅ Diverifikasi orang tua
      </div>` : '<div class="_jrn_empty">Belum ada data check-in pada periode ini.</div>'}
    `;
  }

  // ── Summary cards ────────────────────────────────────────
  function renderSummary(logs, students) {
    const el = document.getElementById('_jrn_summary');
    if (!el) return;
    if (!logs.length) { el.innerHTML = ''; return; }

    const activeDays  = new Set(logs.map(l => l.date)).size;
    const totalHabits = logs.reduce((a, l) => a + (l.total_habits || 0), 0);
    const perfectDays = logs.filter(l => l.total_habits === 7).length;
    const avgHabits   = logs.length ? (totalHabits / logs.length).toFixed(1) : 0;

    el.innerHTML = `
      <div class="_jrn_summary">
        <div class="_jrn_sum_item">
          <div class="_jrn_sum_val">${activeDays}</div>
          <div class="_jrn_sum_lbl">Hari Aktif</div>
        </div>
        <div class="_jrn_sum_item">
          <div class="_jrn_sum_val">${totalHabits}</div>
          <div class="_jrn_sum_lbl">Total Kebiasaan</div>
        </div>
        <div class="_jrn_sum_item">
          <div class="_jrn_sum_val">${avgHabits}</div>
          <div class="_jrn_sum_lbl">Rata² per Hari</div>
        </div>
        <div class="_jrn_sum_item">
          <div class="_jrn_sum_val">${perfectDays}</div>
          <div class="_jrn_sum_lbl">Hari Sempurna</div>
        </div>
      </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // EXPORT PDF
  // ═══════════════════════════════════════════════════════════
  function buildPrintArea() {
    let area = document.getElementById('_jrn_print_area');
    if (!area) {
      area = document.createElement('div');
      area.id = '_jrn_print_area';
      document.body.appendChild(area);
    }

    const content = document.getElementById('_jrn_content')?.innerHTML || '';
    const summary = document.getElementById('_jrn_summary')?.innerHTML || '';
    const period  = `${fmtDisplay(_from)} – ${fmtDisplay(_to)}`;
    const kelasLbl = _kelas === 'all' ? 'Semua Kelas' : _kelas;

    area.innerHTML = `
      <div style="text-align:center;margin-bottom:16px;border-bottom:2px solid #1E8449;padding-bottom:12px">
        <div style="font-size:18px;font-weight:900;color:#1E8449">🏫 SDIT Qudwatun Hasanah</div>
        <div style="font-size:14px;font-weight:700;margin-top:4px">Jurnal Kebiasaan Siswa — HeroKu</div>
        <div style="font-size:11px;color:#666;margin-top:4px">
          Periode: ${period} &nbsp;|&nbsp; Kelas: ${kelasLbl}
        </div>
        <div style="font-size:10px;color:#999;margin-top:2px">Dicetak: ${fmtDisplay(todayWIB())}</div>
      </div>
      ${summary}
      ${content}
      <div style="margin-top:20px;font-size:10px;color:#999;border-top:1px solid #EEE;padding-top:8px">
        Rekap ini digenerate otomatis oleh HeroKu — Platform Karakter Islami SDIT Qudwatun Hasanah
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // EXPORT EXCEL
  // ═══════════════════════════════════════════════════════════
  async function exportToExcel() {
    // Load SheetJS jika belum ada
    if (!W.XLSX) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    }
    if (!W.XLSX) { alert('Gagal memuat library Excel. Cek koneksi internet.'); return; }

    const XLSX    = W.XLSX;
    const wb      = XLSX.utils.book_new();
    const students = W.STORE?.students || [];
    let filtered  = students;
    if (_kelas !== 'all') filtered = filtered.filter(s => s.kelas === _kelas);
    if (_view === 'siswa' && _student) filtered = filtered.filter(s => s.id === _student);

    const logMap = {};
    _logs.forEach(l => {
      if (!logMap[l.student_id]) logMap[l.student_id] = {};
      logMap[l.student_id][l.date] = l;
    });

    const dates = getDatesInRange(_from, _to);

    // Sheet 1: Ringkasan
    const summaryData = [
      ['JURNAL KEBIASAAN SISWA — HeroKu'],
      ['SDIT Qudwatun Hasanah'],
      [`Periode: ${fmtDisplay(_from)} – ${fmtDisplay(_to)}`],
      [`Kelas: ${_kelas === 'all' ? 'Semua Kelas' : _kelas}`],
      [`Dicetak: ${fmtDisplay(todayWIB())}`],
      [],
      ['Nama', 'Kelas', 'Hari Aktif', 'Rata² Kebiasaan', 'Hari Sempurna (7/7)', ...HABIT_KEYS.map(k => HABIT_NAMES[k])],
    ];

    filtered.forEach(s => {
      const sLogs      = logMap[s.id] || {};
      const activeDays = Object.keys(sLogs).length;
      const total      = Object.values(sLogs).reduce((a, l) => a + (l.total_habits || 0), 0);
      const perfect    = Object.values(sLogs).filter(l => l.total_habits === 7).length;
      const avg        = activeDays ? (total / activeDays).toFixed(1) : 0;
      const habitCounts = HABIT_KEYS.map(k =>
        Object.values(sLogs).filter(l => l.habits?.[k]).length
      );
      summaryData.push([s.name, s.kelas, activeDays, avg, perfect, ...habitCounts]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 20 },
      ...HABIT_KEYS.map(() => ({ wch: 16 }))];
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan');

    // Sheet 2: Detail per tanggal (jika ≤31 hari)
    if (dates.length <= 31) {
      const detailHeader = ['Nama', 'Kelas', 'Tanggal', 'Hari', 'Total Kebiasaan',
        ...HABIT_KEYS.map(k => HABIT_NAMES[k]), 'Diverifikasi Ortu'];
      const detailData = [detailHeader];

      filtered.forEach(s => {
        const sLogs = logMap[s.id] || {};
        dates.forEach(d => {
          const log = sLogs[d];
          if (!log) return;
          const habitVals = HABIT_KEYS.map(k => log.habits?.[k] ? '✓' : '');
          const verifyCount = HABIT_KEYS.filter(k => log.verified?.[k]).length;
          detailData.push([s.name, s.kelas, fmtDisplay(d), dayName(d),
            log.total_habits, ...habitVals, verifyCount > 0 ? `${verifyCount} kebiasaan` : '']);
        });
      });

      const ws2 = XLSX.utils.aoa_to_sheet(detailData);
      ws2['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 16 },
        ...HABIT_KEYS.map(() => ({ wch: 14 })), { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Detail Harian');
    }

    const fname = `HeroKu_Jurnal_${_kelas === 'all' ? 'SemuaKelas' : _kelas.replace(/ /g,'_')}_${_from}_${_to}.xlsx`;
    XLSX.writeFile(wb, fname);
  }

  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = resolve;
      document.head.appendChild(s);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════════════════
  function boot() {
    injectCSS();
    patchResetDay();
    patchSaveStore();

    // Tunggu halaman admin ready
    let tries = 0;
    const wait = setInterval(() => {
      if (document.getElementById('admin-list') || tries > 100) {
        clearInterval(wait);
        buildPanel();

        // Patch renderAdmin agar panel jurnal tidak hilang saat re-render
        if (typeof W.renderAdmin === 'function' && !W.renderAdmin._jrn_patched) {
          const _orig = W.renderAdmin;
          W.renderAdmin = function () {
            _orig.call(this);
            setTimeout(() => {
              if (!document.getElementById('_jrn_panel')) buildPanel();
            }, 150);
          };
          W.renderAdmin._jrn_patched = true;
        }
      }
      tries++;
    }, 150);

    console.log('[JRN] Journal System siap ✅ — rekap & export PDF/Excel aktif');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
