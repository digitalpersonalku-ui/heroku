// ═══════════════════════════════════════════════════════════
// HEROKU STUDENT FORM v1.0
// Form manajemen siswa lengkap
//
// File: js/student-form.js
// Pasang setelah verify-upgrade.js:
//   <script src="js/student-form.js"></script>
//
// Field lengkap:
//   1. Nama Lengkap
//   2. NIS
//   3. Tempat & Tanggal Lahir
//   4. Kelas (dropdown)
//   5. Nama Panggilan
//   6. Nama Ayah & Ibu
//   7. No HP Ayah & Ibu
//   8. Avatar
//   9. PIN Siswa & PIN Ortu (auto-generate + bisa ubah)
//  10. Catatan Khusus (opsional)
// ═══════════════════════════════════════════════════════════

(function (W) {
  'use strict';

  // ─── Kelas yang tersedia ─────────────────────────────────
  const KELAS_LIST = [
    'Usman Bin Affan',
    'Umar Bin Khattab',
    'Abu Bakar As Siddiq',
    'Ali Bin Abi Thalib',
  ];

  // ─── Generate PIN ────────────────────────────────────────
  function genPinFromNIS(nis) {
    if (!nis || nis.length < 4) return genRandom4();
    return nis.slice(-4);
  }
  function genPinFromHP(hp) {
    const digits = (hp || '').replace(/\D/g, '');
    if (digits.length < 4) return genRandom4();
    return digits.slice(-4);
  }
  function genRandom4() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  // ─── Format nomor HP ────────────────────────────────────
  function formatHP(val) {
    const d = val.replace(/\D/g, '');
    if (d.startsWith('62')) return '+' + d;
    if (d.startsWith('0'))  return '+62' + d.slice(1);
    return d ? '+62' + d : '';
  }

  // ─── Hitung usia dari tanggal lahir ─────────────────────
  function hitungUsia(tgl) {
    if (!tgl) return 0;
    const lahir = new Date(tgl);
    const today = new Date();
    let usia = today.getFullYear() - lahir.getFullYear();
    const m = today.getMonth() - lahir.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < lahir.getDate())) usia--;
    return usia;
  }

  // ═══════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════
  function injectCSS() {
    if (document.getElementById('_sf_css')) return;
    const s = document.createElement('style');
    s.id = '_sf_css';
    s.textContent = `

/* ── Modal overlay ── */
#_sf_modal {
  position: fixed; inset: 0; z-index: 8500;
  background: rgba(8,8,16,.92);
  backdrop-filter: blur(14px);
  display: none; align-items: flex-start;
  justify-content: center; padding: 16px;
  overflow-y: auto;
}
#_sf_modal.show { display: flex; }

/* ── Form box ── */
#_sf_box {
  background: #fff;
  border-radius: 20px;
  padding: 0;
  max-width: 420px;
  width: 100%;
  margin: auto;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,.4);
  animation: _sfIn .4s cubic-bezier(.34,1.4,.64,1) both;
}
@keyframes _sfIn {
  from { opacity:0; transform:translateY(20px) scale(.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}

/* ── Header form ── */
._sf_header {
  background: linear-gradient(135deg,#1A1A2E,#0F3460);
  padding: 16px 18px;
  display: flex; align-items: center;
  justify-content: space-between;
}
._sf_h_title {
  font-size: 15px; font-weight: 900; color: #fff;
}
._sf_h_sub {
  font-size: 10px; color: rgba(255,255,255,.5); margin-top: 2px;
}
._sf_close {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,.1); border: none;
  color: #fff; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
._sf_close:hover { background: rgba(255,255,255,.2); }

/* ── Sections ── */
._sf_body { padding: 16px 18px; }

._sf_section {
  margin-bottom: 18px;
}
._sf_sec_title {
  font-size: 10px; font-weight: 800;
  color: rgba(0,0,0,.4); letter-spacing: 1.5px;
  text-transform: uppercase; margin-bottom: 10px;
  display: flex; align-items: center; gap: 6px;
}
._sf_sec_title::after {
  content: '';
  flex: 1; height: 1px;
  background: rgba(0,0,0,.07);
}

/* ── Field groups ── */
._sf_row {
  display: grid; gap: 8px; margin-bottom: 8px;
}
._sf_row.col2 { grid-template-columns: 1fr 1fr; }
._sf_row.col3 { grid-template-columns: 1fr 1fr 1fr; }

._sf_field { position: relative; }
._sf_label {
  font-size: 10px; font-weight: 700;
  color: rgba(0,0,0,.5); margin-bottom: 4px;
  display: flex; align-items: center; gap: 4px;
}
._sf_req { color: #E74C3C; }
._sf_opt { color: rgba(0,0,0,.3); font-weight: 400; }

/* ── Inputs ── */
._sf_input, ._sf_select, ._sf_textarea {
  width: 100%; padding: 10px 12px;
  border: 1.5px solid rgba(0,0,0,.12);
  border-radius: 10px; font-size: 13px;
  font-family: inherit; color: #1A1A2E;
  background: #fff; outline: none;
  transition: border-color .15s, box-shadow .15s;
  box-sizing: border-box;
}
._sf_input:focus, ._sf_select:focus, ._sf_textarea:focus {
  border-color: #27AE60;
  box-shadow: 0 0 0 3px rgba(39,174,96,.12);
}
._sf_input::placeholder { color: rgba(0,0,0,.25); }
._sf_input.error { border-color: #E74C3C; }
._sf_input.filled { border-color: rgba(39,174,96,.4); background: rgba(39,174,96,.02); }

._sf_textarea {
  resize: vertical; min-height: 60px; max-height: 120px;
  font-size: 12px; line-height: 1.6;
}

/* ── Select ── */
._sf_select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23666' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

/* ── PIN field ── */
._sf_pin_wrap {
  position: relative;
}
._sf_pin_input {
  letter-spacing: 6px;
  font-size: 18px !important;
  font-weight: 900 !important;
  text-align: center;
  padding-right: 40px !important;
}
._sf_pin_refresh {
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  font-size: 16px; color: rgba(0,0,0,.3);
  padding: 4px; transition: color .15s;
}
._sf_pin_refresh:hover { color: #27AE60; }

/* ── PIN auto-source hint ── */
._sf_pin_hint {
  font-size: 9px; color: rgba(0,0,0,.35);
  margin-top: 3px; font-style: italic;
}

/* ── Avatar picker ── */
._sf_av_grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}
._sf_av_item {
  aspect-ratio: 1; border-radius: 10px;
  border: 2px solid rgba(0,0,0,.08);
  cursor: pointer; overflow: hidden;
  display: flex; align-items: center;
  justify-content: center; font-size: 20px;
  background: #F8F9FA;
  transition: all .15s;
}
._sf_av_item:hover { transform: scale(1.06); border-color: #27AE60; }
._sf_av_item.selected {
  border-color: #27AE60;
  background: rgba(39,174,96,.1);
  box-shadow: 0 0 0 2px rgba(39,174,96,.3);
}

/* ── PIN preview card ── */
#_sf_pin_preview {
  background: linear-gradient(135deg,#EAF9F0,#D5F5E3);
  border: 1.5px solid rgba(39,174,96,.3);
  border-radius: 14px; padding: 14px 16px;
  margin-bottom: 14px; display: none;
}
._sf_pp_title {
  font-size: 11px; font-weight: 800;
  color: #1E8449; margin-bottom: 10px;
  display: flex; align-items: center; gap: 5px;
}
._sf_pp_row {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(39,174,96,.15);
}
._sf_pp_row:last-child { border-bottom: none; }
._sf_pp_lbl { font-size: 11px; color: #1E8449; font-weight: 700; }
._sf_pp_val {
  font-size: 20px; font-weight: 900;
  color: #1A1A2E; letter-spacing: 6px;
}
._sf_pp_note {
  font-size: 10px; color: rgba(30,132,73,.7);
  margin-top: 8px; text-align: center;
  font-style: italic;
}

/* ── Error message ── */
._sf_err {
  font-size: 10px; color: #E74C3C;
  margin-top: 3px; display: none;
}
._sf_err.show { display: block; }

/* ── Action buttons ── */
._sf_actions {
  padding: 14px 18px;
  border-top: 1px solid rgba(0,0,0,.07);
  display: flex; gap: 8px;
  background: #FAFAFA;
}
._sf_btn_cancel {
  flex: 1; padding: 12px;
  border: 1.5px solid rgba(0,0,0,.12);
  border-radius: 12px; background: #fff;
  font-size: 13px; font-weight: 700;
  color: rgba(0,0,0,.5); cursor: pointer;
  font-family: inherit; transition: all .15s;
}
._sf_btn_cancel:hover { background: #F5F5F5; }
._sf_btn_save {
  flex: 2; padding: 12px;
  border: none; border-radius: 12px;
  background: linear-gradient(135deg,#27AE60,#1E8449);
  color: #fff; font-size: 13px; font-weight: 900;
  cursor: pointer; font-family: inherit;
  box-shadow: 0 4px 14px rgba(39,174,96,.35);
  transition: all .15s;
}
._sf_btn_save:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(39,174,96,.4); }
._sf_btn_save:active { transform: scale(.98); }

/* ── Edit mode indicator ── */
._sf_edit_badge {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(52,152,219,.12);
  border: 1px solid rgba(52,152,219,.3);
  border-radius: 20px; padding: 3px 10px;
  font-size: 10px; font-weight: 700; color: #2471A3;
  margin-left: 8px;
}

/* ── Admin list upgrade ── */
._sf_student_card {
  background: #fff; border-radius: 12px;
  border: 1px solid rgba(0,0,0,.08);
  padding: 11px 13px; margin-bottom: 8px;
  transition: box-shadow .15s;
}
._sf_student_card:hover { box-shadow: 0 2px 12px rgba(0,0,0,.08); }
._sf_sc_top {
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
}
._sf_sc_av {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(39,174,96,.1);
  border: 2px solid rgba(39,174,96,.2);
  display: flex; align-items: center;
  justify-content: center; font-size: 20px;
  flex-shrink: 0;
}
._sf_sc_name { font-size: 14px; font-weight: 800; color: #1A1A2E; }
._sf_sc_sub  { font-size: 10px; color: rgba(0,0,0,.45); margin-top: 1px; }
._sf_sc_actions {
  margin-left: auto; display: flex; gap: 6px; flex-shrink: 0;
}
._sf_sc_btn {
  padding: 5px 10px; border-radius: 8px;
  border: none; font-size: 11px; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: all .13s;
}
._sf_sc_btn:active { transform: scale(.93); }
._sf_sc_edit { background: rgba(52,152,219,.12); color: #2471A3; }
._sf_sc_del  { background: rgba(231,76,60,.1);   color: #E74C3C; }

._sf_sc_pins {
  display: flex; gap: 6px; flex-wrap: wrap;
}
._sf_sc_pin {
  font-size: 10px; font-weight: 700;
  padding: 3px 9px; border-radius: 8px;
}
._sf_sc_pin.siswa { background: rgba(39,174,96,.1);  color: #1E8449; }
._sf_sc_pin.ortu  { background: rgba(52,152,219,.1); color: #1A5276; }
._sf_sc_pin.nis   { background: rgba(0,0,0,.05);     color: rgba(0,0,0,.45); }

._sf_sc_extra {
  font-size: 10px; color: rgba(0,0,0,.4);
  margin-top: 5px; line-height: 1.6;
}
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  // HTML — inject modal form
  // ═══════════════════════════════════════════════════════════
  function injectHTML() {
    if (document.getElementById('_sf_modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
<div id="_sf_modal">
  <div id="_sf_box">

    <!-- Header -->
    <div class="_sf_header">
      <div>
        <div class="_sf_h_title" id="_sf_title">➕ Tambah Siswa Baru</div>
        <div class="_sf_h_sub">SDIT Qudwatun Hasanah</div>
      </div>
      <button class="_sf_close" onclick="SF.close()">✕</button>
    </div>

    <div class="_sf_body">

      <!-- PIN Preview (muncul setelah simpan) -->
      <div id="_sf_pin_preview">
        <div class="_sf_pp_title">🔑 Simpan PIN Berikut!</div>
        <div class="_sf_pp_row">
          <span class="_sf_pp_lbl">👤 PIN Siswa</span>
          <span class="_sf_pp_val" id="_sf_pp_siswa">----</span>
        </div>
        <div class="_sf_pp_row">
          <span class="_sf_pp_lbl">👨‍👩‍👧 PIN Ortu</span>
          <span class="_sf_pp_val" id="_sf_pp_ortu">----</span>
        </div>
        <div class="_sf_pp_note">📋 Catat & berikan ke siswa dan orang tua sebelum menutup!</div>
      </div>

      <!-- SEKSI 1: Data Pribadi -->
      <div class="_sf_section">
        <div class="_sf_sec_title">👤 Data Pribadi</div>

        <div class="_sf_row" style="margin-bottom:8px">
          <div class="_sf_field">
            <div class="_sf_label">Nama Lengkap <span class="_sf_req">*</span></div>
            <input class="_sf_input" id="_sf_nama"
              placeholder="Ahmad Badshah Al Fath"
              oninput="SF.autoFill()">
            <div class="_sf_err" id="_sf_err_nama">Nama wajib diisi</div>
          </div>
        </div>

        <div class="_sf_row col2">
          <div class="_sf_field">
            <div class="_sf_label">Nama Panggilan <span class="_sf_req">*</span></div>
            <input class="_sf_input" id="_sf_panggil"
              placeholder="Badshah">
          </div>
          <div class="_sf_field">
            <div class="_sf_label">NIS <span class="_sf_opt">(opsional)</span></div>
            <input class="_sf_input" id="_sf_nis"
              placeholder="2024001"
              oninput="SF.onNISChange()">
          </div>
        </div>

        <div class="_sf_row col2">
          <div class="_sf_field">
            <div class="_sf_label">Tempat Lahir <span class="_sf_req">*</span></div>
            <input class="_sf_input" id="_sf_ttl_kota"
              placeholder="Makassar">
          </div>
          <div class="_sf_field">
            <div class="_sf_label">Tanggal Lahir <span class="_sf_req">*</span></div>
            <input class="_sf_input" id="_sf_ttl_tgl"
              type="date" oninput="SF.onTglChange()">
            <div class="_sf_pin_hint" id="_sf_usia_hint"></div>
          </div>
        </div>

        <div class="_sf_row col2">
          <div class="_sf_field">
            <div class="_sf_label">Kelas <span class="_sf_req">*</span></div>
            <select class="_sf_select" id="_sf_kelas">
              <option value="">Pilih kelas...</option>
              ${KELAS_LIST.map(k => `<option value="${k}">${k}</option>`).join('')}
            </select>
          </div>
          <div class="_sf_field">
            <div class="_sf_label">Jenis Kelamin</div>
            <select class="_sf_select" id="_sf_gender">
              <option value="">Pilih...</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
        </div>
      </div>

      <!-- SEKSI 2: Data Orang Tua -->
      <div class="_sf_section">
        <div class="_sf_sec_title">👨‍👩‍👧 Data Orang Tua</div>

        <div class="_sf_row col2">
          <div class="_sf_field">
            <div class="_sf_label">Nama Ayah</div>
            <input class="_sf_input" id="_sf_ayah"
              placeholder="Muhammad Fauzi">
          </div>
          <div class="_sf_field">
            <div class="_sf_label">Nama Ibu</div>
            <input class="_sf_input" id="_sf_ibu"
              placeholder="Siti Fatimah">
          </div>
        </div>

        <div class="_sf_row col2">
          <div class="_sf_field">
            <div class="_sf_label">No HP Ayah</div>
            <input class="_sf_input" id="_sf_hp_ayah"
              type="tel" placeholder="08xxxxxxxxxx"
              oninput="SF.onHPChange('ayah')">
          </div>
          <div class="_sf_field">
            <div class="_sf_label">No HP Ibu</div>
            <input class="_sf_input" id="_sf_hp_ibu"
              type="tel" placeholder="08xxxxxxxxxx"
              oninput="SF.onHPChange('ibu')">
            <div class="_sf_pin_hint" id="_sf_hp_ibu_hint"></div>
          </div>
        </div>
      </div>

      <!-- SEKSI 3: Avatar -->
      <div class="_sf_section">
        <div class="_sf_sec_title">🎨 Karakter Avatar</div>
        <div class="_sf_av_grid" id="_sf_av_grid"></div>
        <input type="hidden" id="_sf_av_val" value="b1">
      </div>

      <!-- SEKSI 4: PIN -->
      <div class="_sf_section">
        <div class="_sf_sec_title">🔑 PIN Login</div>

        <div class="_sf_row col2">
          <div class="_sf_field">
            <div class="_sf_label">PIN Siswa <span class="_sf_req">*</span></div>
            <div class="_sf_pin_wrap">
              <input class="_sf_input _sf_pin_input" id="_sf_pin_siswa"
                maxlength="4" placeholder="----"
                oninput="this.value=this.value.replace(/\D/g,'').slice(0,4)">
              <button class="_sf_pin_refresh" onclick="SF.refreshPin('siswa')"
                title="Generate ulang">🔄</button>
            </div>
            <div class="_sf_pin_hint" id="_sf_pin_siswa_hint">
              Auto dari 4 digit terakhir NIS
            </div>
          </div>
          <div class="_sf_field">
            <div class="_sf_label">PIN Ortu <span class="_sf_req">*</span></div>
            <div class="_sf_pin_wrap">
              <input class="_sf_input _sf_pin_input" id="_sf_pin_ortu"
                maxlength="4" placeholder="----"
                oninput="this.value=this.value.replace(/\D/g,'').slice(0,4)">
              <button class="_sf_pin_refresh" onclick="SF.refreshPin('ortu')"
                title="Generate ulang">🔄</button>
            </div>
            <div class="_sf_pin_hint" id="_sf_pin_ortu_hint">
              Auto dari 4 digit terakhir HP Ibu
            </div>
          </div>
        </div>
      </div>

      <!-- SEKSI 5: Catatan -->
      <div class="_sf_section">
        <div class="_sf_sec_title">📝 Catatan Khusus <span style="font-size:9px;color:rgba(0,0,0,.3);text-transform:none;letter-spacing:0;font-weight:400">(opsional)</span></div>
        <textarea class="_sf_textarea" id="_sf_catatan"
          placeholder="Contoh: Siswa kidal, orang tua bekerja shift malam, perlu perhatian khusus di kebiasaan bangun pagi..."></textarea>
      </div>

    </div><!-- /_sf_body -->

    <!-- Actions -->
    <div class="_sf_actions">
      <button class="_sf_btn_cancel" onclick="SF.close()">Batal</button>
      <button class="_sf_btn_save" id="_sf_btn_save" onclick="SF.save()">
        ✅ Simpan Data Siswa
      </button>
    </div>

  </div><!-- /_sf_box -->
</div><!-- /_sf_modal -->
    `);
  }

  // ═══════════════════════════════════════════════════════════
  // LOGIC
  // ═══════════════════════════════════════════════════════════

  let _editId = null; // null = mode tambah, ada id = mode edit

  // ── Render avatar picker ─────────────────────────────────
  function renderAvatarPicker() {
    const grid = document.getElementById('_sf_av_grid');
    if (!grid) return;
    const avatars = typeof AVATAR_IDS !== 'undefined'
      ? AVATAR_IDS
      : ['b1','b2','b3','b4','b5','b6','g1','g2','g3','g4','g5','g6'];
    const current = document.getElementById('_sf_av_val')?.value || 'b1';

    grid.innerHTML = '';
    avatars.forEach(av => {
      const el = document.createElement('div');
      el.className = '_sf_av_item' + (av === current ? ' selected' : '');
      el.dataset.av = av;
      // Gunakan getAvatarSVG jika tersedia, fallback ke emoji
      if (typeof getAvatarSVG === 'function') {
        el.innerHTML = `<div style="transform:scale(.85)">${getAvatarSVG(av, 32)}</div>`;
      } else {
        el.textContent = av.startsWith('g') ? '👧' : '👦';
      }
      el.onclick = () => {
        grid.querySelectorAll('._sf_av_item').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        document.getElementById('_sf_av_val').value = av;
      };
      grid.appendChild(el);
    });
  }

  // ── Validasi form ────────────────────────────────────────
  function validate() {
    let ok = true;

    const nama = document.getElementById('_sf_nama')?.value.trim();
    const errNama = document.getElementById('_sf_err_nama');
    if (!nama) {
      errNama?.classList.add('show');
      document.getElementById('_sf_nama')?.classList.add('error');
      ok = false;
    } else {
      errNama?.classList.remove('show');
      document.getElementById('_sf_nama')?.classList.remove('error');
    }

    const kelas = document.getElementById('_sf_kelas')?.value;
    if (!kelas) {
      if (typeof showToast === 'function') showToast('⚠️ Pilih kelas siswa!');
      ok = false;
    }

    const pinSiswa = document.getElementById('_sf_pin_siswa')?.value;
    if (!pinSiswa || pinSiswa.length !== 4) {
      if (typeof showToast === 'function') showToast('⚠️ PIN siswa harus 4 digit!');
      ok = false;
    }

    const pinOrtu = document.getElementById('_sf_pin_ortu')?.value;
    if (!pinOrtu || pinOrtu.length !== 4) {
      if (typeof showToast === 'function') showToast('⚠️ PIN ortu harus 4 digit!');
      ok = false;
    }

    return ok;
  }

  // ── Collect data dari form ───────────────────────────────
  function collectData() {
    const tglLahir  = document.getElementById('_sf_ttl_tgl')?.value || '';
    const hpAyah    = document.getElementById('_sf_hp_ayah')?.value.trim() || '';
    const hpIbu     = document.getElementById('_sf_hp_ibu')?.value.trim() || '';

    return {
      name:       document.getElementById('_sf_nama')?.value.trim() || '',
      nickname:   document.getElementById('_sf_panggil')?.value.trim() ||
                  (document.getElementById('_sf_nama')?.value.trim() || '').split(' ')[0],
      nis:        document.getElementById('_sf_nis')?.value.trim() || '',
      tempatLahir:document.getElementById('_sf_ttl_kota')?.value.trim() || '',
      tglLahir,
      age:        hitungUsia(tglLahir),
      kelas:      document.getElementById('_sf_kelas')?.value || '',
      gender:     document.getElementById('_sf_gender')?.value || '',
      namaAyah:   document.getElementById('_sf_ayah')?.value.trim() || '',
      namaIbu:    document.getElementById('_sf_ibu')?.value.trim() || '',
      hpAyah:     hpAyah ? formatHP(hpAyah) : '',
      hpIbu:      hpIbu  ? formatHP(hpIbu)  : '',
      avatar:     document.getElementById('_sf_av_val')?.value || 'b1',
      pin:        document.getElementById('_sf_pin_siswa')?.value || genRandom4(),
      parentPin:  document.getElementById('_sf_pin_ortu')?.value  || genRandom4(),
      catatan:    document.getElementById('_sf_catatan')?.value.trim() || '',
    };
  }

  // ── Isi form untuk mode edit ─────────────────────────────
  function fillForm(student) {
    document.getElementById('_sf_nama').value      = student.name || '';
    document.getElementById('_sf_panggil').value   = student.nickname || '';
    document.getElementById('_sf_nis').value       = student.nis || '';
    document.getElementById('_sf_ttl_kota').value  = student.tempatLahir || '';
    document.getElementById('_sf_ttl_tgl').value   = student.tglLahir || '';
    document.getElementById('_sf_kelas').value     = student.kelas || '';
    document.getElementById('_sf_gender').value    = student.gender || '';
    document.getElementById('_sf_ayah').value      = student.namaAyah || '';
    document.getElementById('_sf_ibu').value       = student.namaIbu || '';
    document.getElementById('_sf_hp_ayah').value   = student.hpAyah || '';
    document.getElementById('_sf_hp_ibu').value    = student.hpIbu || '';
    document.getElementById('_sf_catatan').value   = student.catatan || '';
    document.getElementById('_sf_pin_siswa').value = student.pin || '';
    document.getElementById('_sf_pin_ortu').value  = student.parentPin || '';
    document.getElementById('_sf_av_val').value    = student.avatar || 'b1';

    // Update usia hint
    if (student.tglLahir) {
      const hint = document.getElementById('_sf_usia_hint');
      if (hint) hint.textContent = `Usia: ${hitungUsia(student.tglLahir)} tahun`;
    }

    // Re-render avatar dengan selection yang benar
    renderAvatarPicker();
  }

  // ── Reset form ───────────────────────────────────────────
  function resetForm() {
    ['_sf_nama','_sf_panggil','_sf_nis','_sf_ttl_kota','_sf_ttl_tgl',
     '_sf_ayah','_sf_ibu','_sf_hp_ayah','_sf_hp_ibu','_sf_catatan'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('_sf_kelas').value   = '';
    document.getElementById('_sf_gender').value  = '';
    document.getElementById('_sf_av_val').value  = 'b1';

    // Auto-generate PIN baru
    const newPin = genRandom4();
    document.getElementById('_sf_pin_siswa').value = newPin;
    document.getElementById('_sf_pin_ortu').value  = genRandom4();

    document.getElementById('_sf_pin_preview').style.display = 'none';
    document.getElementById('_sf_usia_hint').textContent = '';
    document.getElementById('_sf_hp_ibu_hint').textContent = '';
    document.getElementById('_sf_pin_siswa_hint').textContent = 'Auto dari 4 digit terakhir NIS';
    document.getElementById('_sf_pin_ortu_hint').textContent  = 'Auto dari 4 digit terakhir HP Ibu';

    document.getElementById('_sf_err_nama')?.classList.remove('show');
    document.getElementById('_sf_nama')?.classList.remove('error');

    renderAvatarPicker();
    _editId = null;
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════
  const SF = {};

  // Buka form tambah baru
  SF.open = function () {
    resetForm();
    document.getElementById('_sf_title').innerHTML = '➕ Tambah Siswa Baru';
    document.getElementById('_sf_btn_save').textContent = '✅ Simpan Data Siswa';
    document.getElementById('_sf_pin_preview').style.display = 'none';
    document.getElementById('_sf_modal').classList.add('show');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('_sf_nama')?.focus(), 300);
  };

  // Buka form edit
  SF.edit = function (studentId) {
    if (typeof STORE === 'undefined') return;
    const s = STORE.students.find(x => x.id === studentId);
    if (!s) return;

    resetForm();          // reset dulu (ini null-kan _editId)
    _editId = studentId;  // set SETELAH reset agar tidak ter-null-kan
    fillForm(s);

    document.getElementById('_sf_title').innerHTML =
      `✏️ Edit Data Siswa <span class="_sf_edit_badge">✏️ Edit</span>`;
    document.getElementById('_sf_btn_save').textContent = '💾 Perbarui Data';
    document.getElementById('_sf_pin_preview').style.display = 'none';
    document.getElementById('_sf_modal').classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  // Tutup
  SF.close = function () {
    document.getElementById('_sf_modal').classList.remove('show');
    document.body.style.overflow = '';
    resetForm();
  };

  // Simpan
  SF.save = function () {
    if (!validate()) return;
    const data = collectData();

    if (_editId) {
      // Mode edit — update existing
      if (typeof STORE === 'undefined') return;
      const idx = STORE.students.findIndex(x => x.id === _editId);
      if (idx < 0) return;

      // Pertahankan data game, update data profil
      STORE.students[idx] = {
        ...STORE.students[idx],
        name:        data.name,
        nickname:    data.nickname,
        nis:         data.nis,
        tempatLahir: data.tempatLahir,
        tglLahir:    data.tglLahir,
        age:         data.age,
        kelas:       data.kelas,
        gender:      data.gender,
        namaAyah:    data.namaAyah,
        namaIbu:     data.namaIbu,
        hpAyah:      data.hpAyah,
        hpIbu:       data.hpIbu,
        avatar:      data.avatar,
        pin:         data.pin,
        parentPin:   data.parentPin,
        catatan:     data.catatan,
      };

      if (typeof saveStore === 'function') saveStore();
      if (typeof renderAdmin === 'function') renderAdmin();
      if (typeof renderSchool === 'function') renderSchool();
      if (typeof showToast === 'function') showToast(`✅ Data ${data.name} berhasil diperbarui!`);
      SF.close();

    } else {
      // Mode tambah baru
      if (typeof STORE === 'undefined') return;
      const ns = {
        id:          's' + STORE.nextId++,
        name:        data.name,
        nickname:    data.nickname,
        nis:         data.nis,
        tempatLahir: data.tempatLahir,
        tglLahir:    data.tglLahir,
        age:         data.age,
        kelas:       data.kelas,
        gender:      data.gender,
        namaAyah:    data.namaAyah,
        namaIbu:     data.namaIbu,
        hpAyah:      data.hpAyah,
        hpIbu:       data.hpIbu,
        avatar:      data.avatar,
        pin:         data.pin,
        parentPin:   data.parentPin,
        catatan:     data.catatan,
        // Data game — default baru
        koin: 0, xp: 0, level: 1, streak: 0,
        lastActive: null, checkedToday: {}, verifiedToday: {},
        totalDays: 0, cards: [], quizCorrect: 0, quizTotal: 0,
        themeOverride: null, garage: null,
      };

      STORE.students.push(ns);
      if (typeof saveStore  === 'function') saveStore(ns.id);
      if (typeof renderAdmin=== 'function') renderAdmin();
      if (typeof renderSchool==='function') renderSchool();

      // Tampilkan PIN preview
      document.getElementById('_sf_pp_siswa').textContent = data.pin;
      document.getElementById('_sf_pp_ortu').textContent  = data.parentPin;
      document.getElementById('_sf_pin_preview').style.display = 'block';
      document.getElementById('_sf_pin_preview').scrollIntoView({ behavior: 'smooth' });

      document.getElementById('_sf_title').innerHTML = `✅ ${data.name} Berhasil Ditambahkan!`;
      document.getElementById('_sf_btn_save').textContent = '➕ Tambah Siswa Lagi';

      if (typeof showToast === 'function') {
        showToast(`✅ ${data.name} ditambahkan! PIN: ${data.pin}`);
      }

      // Reset form untuk tambah berikutnya (tapi PIN preview tetap)
      _editId = null;
      setTimeout(() => {
        const nama = document.getElementById('_sf_nama');
        if (nama) { nama.value = ''; nama.focus(); }
      }, 100);
    }
  };

  // Auto-fill nickname dari nama
  SF.autoFill = function () {
    const nama     = document.getElementById('_sf_nama')?.value.trim() || '';
    const panggilEl = document.getElementById('_sf_panggil');
    if (panggilEl && !panggilEl.value) {
      panggilEl.value = nama.split(' ')[0] || '';
    }
    // Auto-update PIN dari NIS jika NIS kosong
    const nis = document.getElementById('_sf_nis')?.value.trim();
    if (!nis) {
      const pin = genRandom4();
      const pinEl = document.getElementById('_sf_pin_siswa');
      if (pinEl && !pinEl._manual) pinEl.value = pin;
    }
  };

  // Update PIN saat NIS berubah
  SF.onNISChange = function () {
    const nis    = document.getElementById('_sf_nis')?.value.trim() || '';
    const pinEl  = document.getElementById('_sf_pin_siswa');
    const hint   = document.getElementById('_sf_pin_siswa_hint');
    if (!pinEl) return;

    if (nis.length >= 4) {
      const pin = genPinFromNIS(nis);
      pinEl.value = pin;
      if (hint) hint.textContent = `Auto dari NIS: ${nis}`;
    } else {
      if (hint) hint.textContent = 'Auto dari 4 digit terakhir NIS';
    }
  };

  // Update PIN ortu saat HP Ibu berubah
  SF.onHPChange = function (who) {
    if (who !== 'ibu') return;
    const hp   = document.getElementById('_sf_hp_ibu')?.value.trim() || '';
    const pinEl = document.getElementById('_sf_pin_ortu');
    const hint  = document.getElementById('_sf_pin_ortu_hint');
    if (!pinEl) return;

    if (hp.replace(/\D/g,'').length >= 4) {
      const pin = genPinFromHP(hp);
      pinEl.value = pin;
      if (hint) hint.textContent = `Auto dari HP Ibu: ...${pin}`;
    } else {
      if (hint) hint.textContent = 'Auto dari 4 digit terakhir HP Ibu';
    }
  };

  // Update hint usia
  SF.onTglChange = function () {
    const tgl  = document.getElementById('_sf_ttl_tgl')?.value;
    const hint = document.getElementById('_sf_usia_hint');
    if (hint && tgl) {
      const usia = hitungUsia(tgl);
      hint.textContent = usia > 0 ? `Usia: ${usia} tahun` : '';
    }
  };

  // Refresh PIN manual
  SF.refreshPin = function (who) {
    if (who === 'siswa') {
      document.getElementById('_sf_pin_siswa').value = genRandom4();
    } else {
      document.getElementById('_sf_pin_ortu').value = genRandom4();
    }
  };

  W.SF = SF;

  // ═══════════════════════════════════════════════════════════
  // UPGRADE HALAMAN ADMIN
  // Gantikan tombol "+ Tambah" lama dengan yang baru
  // ═══════════════════════════════════════════════════════════
  function upgradeAdminPage() {
    // Gantikan tombol tambah lama
    const oldBtn = document.querySelector('[onclick="addStudent()"]');
    if (oldBtn) {
      oldBtn.textContent  = '+ Tambah Siswa';
      oldBtn.setAttribute('onclick', 'SF.open()');
    }

    // Upgrade tampilan daftar siswa
    patchRenderAdmin();
  }

  function patchRenderAdmin() {
    if (typeof W.renderAdmin !== 'function') return;
    const _orig = W.renderAdmin;
    W.renderAdmin = function () {
      _orig.call(this);
      // Upgrade tampilan setiap card siswa
      setTimeout(upgradeStudentCards, 100);
    };
  }

  function upgradeStudentCards() {
    const list = document.getElementById('admin-list');
    if (!list || typeof STORE === 'undefined') return;

    const fil = typeof adminFilter !== 'undefined' && adminFilter !== 'all'
      ? STORE.students.filter(s => s.kelas === adminFilter)
      : STORE.students;

    list.innerHTML = '';
    fil.forEach(s => {
      const done = Object.keys(s.checkedToday || {}).length;
      const card = document.createElement('div');
      card.className = '_sf_student_card';
      card.innerHTML = `
        <div class="_sf_sc_top">
          <div class="_sf_sc_av">
            ${typeof getAvatarSVG === 'function'
              ? `<div style="transform:scale(.75)">${getAvatarSVG(s.avatar, 32)}</div>`
              : (s.avatar?.startsWith('g') ? '👧' : '👦')}
          </div>
          <div style="flex:1;min-width:0">
            <div class="_sf_sc_name">${s.name}</div>
            <div class="_sf_sc_sub">
              ${s.kelas} · ${s.nickname || s.name.split(' ')[0]}
              ${s.nis ? ` · NIS: ${s.nis}` : ''}
              · ${done}/7 hari ini
            </div>
          </div>
          <div class="_sf_sc_actions">
            <button class="_sf_sc_btn _sf_sc_edit"
              onclick="SF.edit('${s.id}')">✏️ Edit</button>
            <button class="_sf_sc_btn _sf_sc_del"
              onclick="delStudent('${s.id}')">🗑️</button>
          </div>
        </div>
        <div class="_sf_sc_pins">
          <span class="_sf_sc_pin siswa">🔑 PIN Siswa: ${s.pin}</span>
          <span class="_sf_sc_pin ortu">👨‍👩‍👧 PIN Ortu: ${s.parentPin}</span>
          ${s.nis ? `<span class="_sf_sc_pin nis">NIS: ${s.nis}</span>` : ''}
        </div>
        ${(s.namaAyah || s.namaIbu || s.hpIbu || s.catatan) ? `
        <div class="_sf_sc_extra">
          ${s.namaAyah ? `👨 ${s.namaAyah}` : ''}
          ${s.namaIbu  ? ` · 👩 ${s.namaIbu}` : ''}
          ${s.hpIbu    ? ` · 📱 ${s.hpIbu}` : ''}
          ${s.catatan  ? `<br>📝 ${s.catatan}` : ''}
        </div>` : ''}
      `;
      list.appendChild(card);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════════════════
  function boot() {
    injectCSS();
    injectHTML();

    // Tunggu app ready
    let tries = 0;
    const wait = setInterval(() => {
      if ((typeof STORE !== 'undefined' && typeof renderAdmin === 'function') || tries > 80) {
        clearInterval(wait);
        upgradeAdminPage();
        // Render awal
        if (typeof renderAdmin === 'function') {
          const _orig = W.renderAdmin;
          W.renderAdmin = function () {
            _orig.call(this);
            setTimeout(upgradeStudentCards, 100);
          };
        }
      }
      tries++;
    }, 150);

    // Tutup modal jika klik di luar box
    document.getElementById('_sf_modal')?.addEventListener('click', function (e) {
      if (e.target === this) SF.close();
    });
  }

  // MutationObserver: jalankan SEGERA, tidak perlu tunggu boot()
  (function startObserver() {
    function injectAddBtn() {
      if (document.getElementById('_sf_add_main_btn')) return;
      const hdr = document.querySelector('.admin-hdr') ||
                  document.querySelector('#page-admin > div:first-child');
      if (!hdr) return;
      const btn = document.createElement('button');
      btn.id = '_sf_add_main_btn';
      btn.innerHTML = '➕ Tambah Siswa Baru';
      btn.setAttribute('onclick', 'SF.open()');
      btn.style.cssText = [
        'width:100%','margin:10px 0 0','padding:13px',
        'background:linear-gradient(135deg,#27AE60,#1E8449)',
        'color:#fff','border:none','border-radius:12px',
        'font-size:15px','font-weight:700','cursor:pointer',
        'font-family:var(--font-round,inherit)',
        'box-shadow:0 4px 12px rgba(39,174,96,.35)',
        'display:block',
      ].join(';');
      hdr.insertAdjacentElement('afterend', btn);
    }

    function hideOldFormNow() {
      const el = document.getElementById('single-add-mode');
      if (el && el.style.display !== 'none') {
        el.style.display = 'none';
        const card = el.closest('.card');
        if (card) card.style.display = 'none';
      }
      injectAddBtn();
    }

    hideOldFormNow();
    if (!W._sf_obs) {
      W._sf_obs = new MutationObserver(hideOldFormNow);
      W._sf_obs.observe(document.body, { childList: true, subtree: true });
    }
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
