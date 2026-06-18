

// CATATAN MIGRASI SUPABASE:
// initStore() lama (sinkron, baca localStorage) sudah TIDAK dipakai lagi.
// Sekarang STORE diisi oleh bootApp() di file bridge.js, yang mengambil
// data secara asynchronous dari Supabase. Fungsi ini disimpan kosong
// hanya agar tidak ada referensi error jika ada kode lain yang memanggilnya.
function initStore(){ return window.STORE || { students: [], nextId: 1, staffAccounts: DEFAULT_STAFF }; }

let STORE = { students: [], nextId: 1, staffAccounts: DEFAULT_STAFF }; // diisi ulang oleh bootApp()
let CU=null, CRole=null, selRole=null;
let adminFilter='all', habitToCheck=null, quizAnswered=false;
let sessionEarnedKoin=0;

// ═══════════════════ LOGIN ═══════════════════
function resetDayIfNeeded(s){
  const t=todayStr();
  if(s.lastActive&&s.lastActive!==t){
    const diff=Math.round((new Date(t)-new Date(s.lastActive))/86400000);
    if(diff>1)s.streak=0;
    s.checkedToday={};
  }
  return s;
}

renderStudentPin();

function renderStudentPin(){
  // Just render the static form — no names shown
}

let currentLoginRole = 'anak';

function setLoginRole(role, btn){
  currentLoginRole = role;
  document.querySelectorAll('#role-selector .role-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  // Hide all login panels
  ['login-anak','login-ortu','login-staff'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display='none';
  });
  // Clear errors
  ['pin-error','pin-error-ortu','pin-error-staff'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.textContent='';
  });
  // Show relevant panel
  if(role==='anak'){
    document.getElementById('login-anak').style.display='block';
    setTimeout(()=>document.getElementById('p0').focus(),100);
  } else if(role==='ortu'){
    document.getElementById('login-ortu').style.display='block';
    setTimeout(()=>document.getElementById('op0').focus(),100);
  } else {
    document.getElementById('login-staff').style.display='block';
    const label=document.getElementById('staff-label');
    const hint=document.getElementById('staff-hint');
    const idInput=document.getElementById('staff-id-input');
    if(role==='guru'){
      if(label) label.textContent='Login Guru';
      if(hint) hint.innerHTML='<span style="font-size:10px"><strong>ID:</strong> guru01 | <strong>Pass:</strong> guru01<br><strong>ID:</strong> guru02 | <strong>Pass:</strong> guru02<br>dst untuk guru03, guru04</span>';
      if(idInput) idInput.placeholder='ID Guru (cth: guru01)';
    } else if(role==='kepsek'){
      if(label) label.textContent='Login Kepala Sekolah';
      if(hint) hint.innerHTML='<strong>ID:</strong> kepsek1 &nbsp;|&nbsp; <strong>Password:</strong> kepsek2025';
      if(idInput) idInput.placeholder='ID Kepala Sekolah';
    } else {
      if(label) label.textContent='Login Admin';
      if(hint) hint.innerHTML='<strong>ID:</strong> admin1 &nbsp;|&nbsp; <strong>Password:</strong> admin2025';
      if(idInput) idInput.placeholder='ID Admin';
    }
    setTimeout(()=>idInput&&idInput.focus(),100);
  }
}

function pinNextOrtu(i){
  const v=document.getElementById('op'+i).value;
  if(v.length===1&&i<3)document.getElementById('op'+(i+1)).focus();
  if(i===3&&v.length===1)loginOrtu();
}

function loginOrtu(){
  const pin=[0,1,2,3].map(i=>document.getElementById('op'+i).value).join('');
  const err=document.getElementById('pin-error-ortu');
  if(pin.length<4){if(err)err.textContent='Masukkan 4 digit PIN';return;}
  // Find student by parentPin
  const s=STORE.students.find(x=>x.parentPin===pin);
  if(!s){
    if(err)err.textContent='PIN orang tua tidak ditemukan.';
    [0,1,2,3].forEach(i=>{const el=document.getElementById('op'+i);if(el)el.value='';});
    document.getElementById('op0').focus();
    return;
  }
  if(err)err.textContent='';
  // Login as ortu, linked to this student
  resetDayIfNeeded(s);
  CU=s; CRole='ortu';
  // Store linked child
  CU._linkedChild=s;
  go();
}

function loginStaffPassword(){
  const idVal=(document.getElementById('staff-id-input').value||'').trim();
  const passVal=(document.getElementById('staff-pass-input').value||'').trim();
  const err=document.getElementById('pin-error-staff');
  if(!idVal||!passVal){if(err)err.textContent='Isi ID dan password';return;}
  const idNorm = idVal.toLowerCase().trim();
  const passNorm = passVal.trim();
  const staff = (STORE.staffAccounts||DEFAULT_STAFF).find(a=>
    a.id.toLowerCase()===idNorm && a.password===passNorm);
  if(!staff){
    if(err)err.textContent='ID atau password salah.';
    document.getElementById('staff-pass-input').value='';
    return;
  }
  if(err)err.textContent='';
  CU={id:staff.id,name:staff.name,kelas:staff.kelas,avatar:staff.avatar,
      koin:0,xp:0,level:1,streak:0,checkedToday:{},cards:[]};
  CRole=staff.role;
  go();
}

function pinNext(i){
  const v=document.getElementById('p'+i).value;
  if(v.length===1&&i<3)document.getElementById('p'+(i+1)).focus();
}

function loginWithPin(){
  const pin=[0,1,2,3].map(i=>document.getElementById('p'+i).value).join('');
  const err=document.getElementById('pin-error');
  if(pin.length<4){err.textContent='Masukkan 4 digit PIN';return}
  const s=STORE.students.find(x=>x.pin===pin);
  if(!s){err.textContent='PIN salah. Tanya guru/orang tua!';[0,1,2,3].forEach(i=>document.getElementById('p'+i).value='');document.getElementById('p0').focus();return}
  err.textContent='';
  resetDayIfNeeded(s);
  CU=s; CRole='anak';
  go();
}

function selectRole(r,btn){
  document.querySelectorAll('.role-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected'); selRole=r;
  const inp=document.getElementById('login-name'), btnS=document.getElementById('btn-staff');
  inp.style.display='block'; btnS.style.display='block';
  const D={ortu:'Orang Tua',guru:'Reski Wulandari, S.Pd.',kepsek:'Musyarrafah, S.Psi., M.Pd.',admin:'Ainani Hermansyah'};
  inp.value=D[r]||'';
}
function loginStaff(){
  CRole=selRole||'guru';
  CU={name:document.getElementById('login-name').value||'Staff',kelas:'',avatar:'👤',koin:0,xp:0,level:1,streak:0,checkedToday:{},cards:[]};
  go();
}
function go(){
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-app').classList.add('active');
  sessionEarnedKoin=0;
  renderApp();
  const startPage = (CRole==='admin'||CRole==='kepsek'||CRole==='guru')?'sekolah':
    CRole==='ortu'?'ortu':'beranda';
  switchPage(startPage);
}

// ═══════════════════ RENDER APP ═══════════════════
const h=new Date().getHours();
const GREET=h<11?"Assalamu'alaikum,":h<15?"Selamat siang,":h<18?"Selamat sore,":"Selamat malam,";

function renderApp(){
  const u=CU, first=u.name.split(' ')[0];
  const tier=getTier(u.koin);
  document.getElementById('topbar-av').textContent=u.avatar;
  document.getElementById('topbar-name').textContent=first;
  document.getElementById('topbar-sub').textContent=CRole==='anak'?'Level '+u.level:CRole;
  const tp=document.getElementById('topbar-tier');
  tp.textContent=tier.icon+' '+tier.name;
  tp.style.background=tier.bg; tp.style.color=tier.color;

  // Set first page by role
  const firstPage = CRole==='anak'?'beranda': CRole==='ortu'?'ortu':'sekolah';
  renderNav(firstPage);
  if(CRole!=='anak'){
    document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-'+firstPage)?.classList.add('active');
    renderSchool();renderAdmin();
    if(firstPage==='sekolah')renderSchool();
    return;
  }
  document.getElementById('hero-greeting').textContent=GREET;
  const nick = CU.nickname||first; document.getElementById('hero-name').textContent=nick+'! 👋';
  updateStats();
  renderStreak();
  renderMentor();
  renderHabits();
  renderWorld();
  renderBadgesGrid();
  renderCardsGrid();
  renderOrtu();
  if(document.getElementById('page-garasi')&&document.getElementById('page-garasi').classList.contains('active'))renderGarasi();
}

function updateStats(){
  const u=CU;
  const done=Object.keys(u.checkedToday||{}).length;
  const xpMax=u.level*100;
  const xpPct=Math.min(100,Math.round(u.xp/xpMax*100));
  document.getElementById('stat-koin').textContent=u.koin;
  document.getElementById('stat-xp-pct').textContent=xpPct+'%';
  document.getElementById('hero-level').textContent=u.level;
  document.getElementById('next-level').textContent=u.level+1;
  document.getElementById('xp-text').textContent=u.xp+'/'+xpMax;
  document.getElementById('xp-fill').style.width=xpPct+'%';
  document.getElementById('done-label').textContent=done+'/7 selesai';
  const tier=getTier(u.koin);
  const tp=document.getElementById('topbar-tier');
  tp.textContent=tier.icon+' '+tier.name;
  tp.style.background=tier.bg;tp.style.color=tier.color;
}

function renderStreak(){
  const row=document.getElementById('streak-row');
  row.innerHTML='';
  const today=new Date().getDay();
  DAYS.forEach((d,i)=>{
    const div=document.createElement('div');
    const isToday=i===today, done=i<today;
    div.className='sday '+(isToday?'today':done?'done':'empty');
    div.innerHTML=`<span style="font-size:11px">${done?'✓':isToday?'●':'○'}</span><span style="font-size:8px">${d}</span>`;
    row.appendChild(div);
  });
}

function renderMentor(){
  const u=CU, first=u.name.split(' ')[0];
  const done=Object.keys(u.checkedToday||{}).length;
  let msg;
  const nickname = u.nickname || first;
  const ageNote = u.age ? ` Usiamu ${u.age} tahun —` : '';
  if(u.koin===0&&done===0)msg=`Assalamu'alaikum warahmatullahi, ${nickname}! 🌙${ageNote} perjalanan seribu langkah dimulai dari satu kebiasaan. Bismillah, mulailah hari ini!`;
  else if(done===7)msg=`MasyaAllah tabarakallah, ${nickname}! 🏆 Tujuh kebiasaan sempurna hari ini. Syekh bangga — inilah akhlak seorang Muslim sejati!`;
  else if(u.streak>=7)msg=`Subhanallah! ${u.streak} hari berturut — ${nickname} sudah seperti pohon yang berakar kuat. ✨ Istiqomah adalah kunci surga!`;
  else if(u.streak>=3)msg=`Barakallahu fiik, ${nickname}! ${u.streak} hari konsisten. 🌱 "Amalan yang paling dicintai Allah adalah yang dilakukan terus-menerus walau sedikit." — Rasulullah ﷺ`;
  else if(done>=5)msg=`Ahsanta, ${nickname}! ${done} dari 7 kebiasaan selesai. Tinggal ${7-done} lagi menuju hari yang sempurna. Jangan berhenti sekarang! 💪`;
  else if(done>0)msg=`Jayyid, ${nickname}! Sudah ${done} langkah hari ini. 🌅 Syekh Al-Fath menunggumu menyelesaikan sisa ${7-done} kebiasaanmu. Yuk teruskan!`;
  else msg=`Assalamu'alaikum, ${nickname}! 🌄 "Barangsiapa yang hari ini lebih baik dari kemarin, dialah orang yang beruntung." Mulailah dengan Bismillah!`;
  document.getElementById('mentor-msg').textContent=msg;

  // Ortu note untuk verifikasi
  const needV=HABITS.filter(hb=>hb.needVerify&&u.checkedToday[hb.id]);
  const noteEl=document.getElementById('mentor-ortu-note');
  if(needV.length>0&&CRole==='anak'){
    noteEl.style.display='block';
    noteEl.textContent='📋 Minta orang tua verifikasi: '+needV.map(hb=>hb.name).join(', ');
  }else noteEl.style.display='none';
}

function renderHabits(){
  const list=document.getElementById('habits-list');
  list.innerHTML='';
  const checked=CU.checkedToday||{};
  HABITS.forEach(hb=>{
    const done=!!checked[hb.id];
    const div=document.createElement('div');
    div.className='habit-card'+(done?' checked':'');
    div.innerHTML=`<div class="h-icon" style="background:${hb.bg}">${hb.icon}</div>
      <div class="h-info">
        <div class="h-name" style="${done?'text-decoration:line-through;opacity:0.5':''}">${hb.name}</div>
        <div class="h-desc">${hb.desc}</div>
        <div class="h-reward">${done?'✅ Selesai!':'⭐ +'+hb.koin+' Koin · ✨ +'+hb.xp+' XP'+(hb.needVerify?' · 📋 Perlu verif.':'')}</div>
      </div>
      <div class="hchk">${done?'✓':''}</div>`;
    if(!done)div.onclick=()=>openCheckIn(hb);
    else div.onclick=()=>showToast('✅ Sudah selesai hari ini!');
    list.appendChild(div);
  });
}

function renderWorld(){
  const u = CU, con = document.getElementById('world-display');
  const totalKoin = u.koin;
  const nickname = u.nickname || u.name.split(' ')[0];
  const garage = u.garage || {colorId:'default',stickers:[],upgrades:[],ownedColors:['default']};

  // Weather system
  const done = Object.keys(u.checkedToday||{}).length;
  const allDone = done === 7;
  const streak = u.streak || 0;

  let weatherEmoji, weatherBg, weatherLabel, weatherGlow, isDark;
  if(allDone){
    weatherEmoji='🌈'; weatherLabel='Cerah Berpelangi!';
    weatherBg='linear-gradient(180deg,#87CEEB 0%,#B2E5FF 30%,#B8E994 65%,#7BC67E 100%)';
    weatherGlow='rgba(255,255,255,0.3)'; isDark=false;
  } else if(done>=5){
    weatherEmoji='☀️'; weatherLabel='Cerah Berawan';
    weatherBg='linear-gradient(180deg,#87CEEB 0%,#A8D8EA 40%,#B8E994 65%,#7BC67E 100%)';
    weatherGlow='rgba(255,200,0,0.2)'; isDark=false;
  } else if(done>=3){
    weatherEmoji='⛅'; weatherLabel='Mendung Ringan';
    weatherBg='linear-gradient(180deg,#B0C4DE 0%,#C8D8E8 40%,#A8C8A8 65%,#7BAE7B 100%)';
    weatherGlow=''; isDark=false;
  } else if(done>=1){
    weatherEmoji='🌧️'; weatherLabel='Gerimis — Nyalakan Lampu!';
    weatherBg='linear-gradient(180deg,#4A5568 0%,#6B7A8D 40%,#4A6741 65%,#355C34 100%)';
    weatherGlow=''; isDark=true;
  } else {
    weatherEmoji='🌙'; weatherLabel='Malam Berbintang';
    weatherBg='linear-gradient(180deg,#1A1A2E 0%,#16213E 40%,#0F3460 70%,#1A3A2A 100%)';
    weatherGlow=''; isDark=true;
  }

  // Car color from garage
  const carColorMap={'default':'#F39C12','green':'#27AE60','white':'#ECF0F1',
    'blue':'#2980B9','gold':'#F1C40F','purple':'#8E44AD','red':'#E74C3C','teal':'#1ABC9C'};
  const carColor = carColorMap[garage.colorId||'default'] || '#F39C12';
  const hasNitro = (garage.upgrades||[]).includes('nitro') && streak>=3;
  const hasSpoiler = (garage.upgrades||[]).includes('spoiler');
  const activeStickers = (garage.stickers||[]).map(sid=>{
    const s=STICKERS.find(x=>x.id===sid);return s?s.icon:'';
  }).filter(Boolean).slice(0,2).join('');

  // Road path
  const W=380, H=600;
  const pathD=`M 190 590 C 190 530 80 500 80 440 C 80 380 300 350 300 290 C 300 230 80 200 80 140 C 80 80 220 55 270 25`;

  // Waypoints
  const WPS=[
    {x:190,y:585,side:'R'},{x:115,y:480,side:'L'},{x:230,y:410,side:'R'},
    {x:280,y:320,side:'R'},{x:115,y:245,side:'L'},{x:200,y:170,side:'R'},
    {x:115,y:105,side:'L'},{x:220,y:55,side:'R'},{x:155,y:35,side:'L'},{x:270,y:22,side:'R'},
  ];
  const SIDE_OFFSET=70, VERT_OFF=-24;

  function getCarPos(){
    for(let i=0;i<BUILDINGS.length-1;i++){
      const from=BUILDINGS[i].minKoin,to=BUILDINGS[i+1].minKoin;
      if(totalKoin>=from&&totalKoin<to){
        const t=(totalKoin-from)/(to-from);
        const wp=WPS[i],wpN=WPS[i+1]||WPS[i];
        return {x:wp.x+(wpN.x-wp.x)*t,y:wp.y+(wpN.y-wp.y)*t};
      }
    }
    return totalKoin>=BUILDINGS[BUILDINGS.length-1].minKoin
      ? WPS[WPS.length-1] : {x:190,y:585};
  }

  const car=getCarPos();
  const unlockedCount=BUILDINGS.filter(b=>totalKoin>=b.minKoin).length;
  const nextBIdx=BUILDINGS.findIndex(b=>totalKoin<b.minKoin);
  const nextB=nextBIdx>=0?BUILDINGS[nextBIdx]:null;
  const pct=nextB?Math.min(99,Math.round(totalKoin/nextB.minKoin*100)):100;

  function renderBldg(b,i){
    const wp=WPS[i]; if(!wp)return'';
    const unlocked=totalKoin>=b.minKoin;
    const isTarget=nextBIdx===i;
    const side=wp.side==='R'?1:-1;
    const bx=wp.x+side*SIDE_OFFSET, by=wp.y+VERT_OFF;
    const shortName=b.name.length>13?b.name.slice(0,12)+'…':b.name;

    return `
    <g>
      <line x1="${wp.x}" y1="${wp.y}" x2="${bx}" y2="${by+22}"
        stroke="${unlocked?'#52D98A':isTarget?'#FFE066':'rgba(255,255,255,0.25)'}"
        stroke-width="1.5" stroke-dasharray="4,3" opacity="0.7"/>
      <g transform="translate(${bx},${by})" style="cursor:pointer"
        ${unlocked?`onclick="showToast('${b.icon} ${b.name}!')"`:''}>
        <ellipse cx="0" cy="34" rx="24" ry="8" fill="rgba(0,0,0,0.15)"/>
        ${isTarget?`<circle cx="0" cy="14" r="26" fill="none" stroke="#FFE066" stroke-width="2.5">
          <animate attributeName="r" values="24;33;24" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.8s" repeatCount="indefinite"/>
        </circle>`:''}
        <text x="0" y="26" text-anchor="middle" font-size="${unlocked?'36':'28'}"
          opacity="${unlocked?1:isTarget?0.8:isDark?0.2:0.3}"
          style="${unlocked&&!isDark?'filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))':''}">${b.icon}</text>
        ${unlocked?`
          <rect x="-22" y="36" width="44" height="13" rx="5" fill="#27AE60"/>
          <text x="0" y="46" text-anchor="middle" font-family="Arial,sans-serif"
            font-size="8" font-weight="800" fill="white">✓ Selesai</text>`
        :isTarget?`
          <rect x="-24" y="36" width="48" height="13" rx="5" fill="#FFE066"/>
          <text x="0" y="46" text-anchor="middle" font-family="Arial,sans-serif"
            font-size="8" font-weight="800" fill="#1A1A2E">🎯 TARGET</text>`
        :`
          <rect x="-22" y="36" width="44" height="13" rx="5" fill="rgba(0,0,0,${isDark?'0.5':'0.3'})"/>
          <text x="0" y="46" text-anchor="middle" font-family="Arial,sans-serif"
            font-size="8" font-weight="600" fill="rgba(255,255,255,0.45)">🔒 Kunci</text>`}
        <rect x="-28" y="50" width="56" height="14" rx="4"
          fill="${unlocked?'rgba(27,174,96,0.85)':isTarget?'rgba(255,230,0,0.85)':'rgba(0,0,0,0.4)'}"/>
        <text x="0" y="60" text-anchor="middle" font-family="Arial,sans-serif"
          font-size="7.5" font-weight="800"
          fill="${unlocked||isTarget?'#1A1A2E':'rgba(255,255,255,0.45)'}">${shortName}</text>
      </g>
      <circle cx="${wp.x}" cy="${wp.y}" r="${isTarget?6:4}"
        fill="${unlocked?'#52D98A':isTarget?'#FFE066':'rgba(255,255,255,0.3)'}"
        stroke="white" stroke-width="1.5"/>
    </g>`;
  }

  con.innerHTML = `
<div style="background:${weatherBg};border-radius:20px;padding:14px 12px;margin-bottom:10px;
  position:relative;overflow:hidden;transition:background 1s ease">

  ${weatherGlow?`<div style="position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,${weatherGlow},transparent 60%);pointer-events:none"></div>`:''}

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
    <div>
      <div style="font-size:10px;color:${isDark?'rgba(255,255,255,0.45)':'rgba(0,0,0,0.4)'};font-weight:700;letter-spacing:0.5px">PETA PERJALANAN</div>
      <div style="font-family:var(--font-round);font-size:15px;font-weight:900;color:${isDark?'#fff':'#1A1A2E'}">${nickname}'s Journey</div>
    </div>
    <div style="display:flex;align-items:center;gap:6px">
      <div style="background:${isDark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.12)'};border-radius:20px;
        padding:4px 10px;font-family:var(--font-round);font-size:12px;font-weight:800;
        color:${isDark?'#FFE066':'#1A1A2E'}">⭐ ${totalKoin}</div>
      <div style="font-size:20px" title="${weatherLabel}">${weatherEmoji}</div>
    </div>
  </div>

  <!-- Weather label -->
  <div style="text-align:center;font-size:10px;font-weight:700;
    color:${isDark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.4)'};
    margin-bottom:8px;letter-spacing:0.5px">${weatherLabel} — ${done}/7 misi selesai</div>

  <!-- RAINBOW (when all done) -->
  ${allDone?`<div style="position:absolute;top:0;left:0;right:0;height:80px;
    background:linear-gradient(180deg,transparent 0%,rgba(255,200,200,0.1) 20%,rgba(200,255,200,0.1) 40%,
    rgba(200,200,255,0.1) 60%,transparent 80%);
    animation:rainbowFade 2s ease-in-out infinite;pointer-events:none">
    <div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);
      font-size:28px;animation:rainbowFade 1.5s ease-in-out infinite">🌈</div>
  </div>`:''}

  <!-- Rain effect (when few missions done) -->
  ${done===0&&!isDark?'':`${isDark&&done<3?Array.from({length:6},(_,i)=>`
    <div style="position:absolute;top:0;left:${10+i*16}%;width:1px;height:15px;
      background:rgba(150,200,255,0.4);animation:weatherRain 1.${i}s linear infinite;
      animation-delay:${i*0.2}s"></div>`).join(''):''}`}

  <!-- SVG MAP -->
  <div style="border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.2)">
  <svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block;background:${weatherBg}"
    xmlns="http://www.w3.org/2000/svg">

    <!-- Clouds -->
    ${isDark?`
    <!-- Night stars -->
    ${Array.from({length:12},(_,i)=>`<circle cx="${20+i*28}" cy="${10+Math.sin(i)*15}" r="${Math.random()*2+0.5}" fill="white" opacity="${0.4+Math.random()*0.5}"/>`).join('')}
    <text x="20" y="30" font-size="14" opacity="0.6">🌙</text>
    <text x="340" y="50" font-size="10" opacity="0.4">⭐</text>
    <!-- Fog effect -->
    <rect x="0" y="${H-200}" width="${W}" height="200" fill="rgba(100,120,100,0.15)" rx="0"/>
    <rect x="0" y="${H-280}" width="${W}" height="100" fill="rgba(80,100,80,0.1)" rx="0"/>
    `:`
    <!-- Day clouds -->
    <g opacity="0.75">
      <ellipse cx="55" cy="35" rx="30" ry="13" fill="white"/>
      <ellipse cx="78" cy="28" rx="22" ry="11" fill="white"/>
      <ellipse cx="35" cy="30" rx="16" ry="10" fill="white"/>
    </g>
    <g opacity="0.6">
      <ellipse cx="310" cy="50" rx="28" ry="11" fill="white"/>
      <ellipse cx="330" cy="43" rx="20" ry="9" fill="white"/>
    </g>
    ${allDone?`<text x="150" y="35" font-size="24" opacity="0.8">🌈</text>`:''}
    `}

    <!-- Trees -->
    <text x="18" y="375" font-size="22" opacity="${isDark?0.3:0.6}">🌲</text>
    <text x="348" y="475" font-size="18" opacity="${isDark?0.25:0.5}">🌳</text>
    <text x="14" y="275" font-size="16" opacity="${isDark?0.2:0.45}">🌿</text>
    <text x="350" y="195" font-size="20" opacity="${isDark?0.25:0.5}">🌲</text>

    <!-- Road shadow -->
    <path d="${pathD}" stroke="rgba(0,0,0,0.2)" stroke-width="42" fill="none" stroke-linecap="round"/>
    <!-- Road base -->
    <path d="${pathD}" stroke="${isDark?'#3A3A3A':'#5A5A5A'}" stroke-width="36" fill="none" stroke-linecap="round"/>
    <!-- Road surface -->
    <path d="${pathD}" stroke="${isDark?'#555':'#777'}" stroke-width="32" fill="none" stroke-linecap="round"/>
    <!-- Center dash -->
    <path d="${pathD}" stroke="${isDark?'rgba(255,230,0,0.5)':'#FFE066'}" stroke-width="2.5"
      fill="none" stroke-linecap="round" stroke-dasharray="14,12" opacity="0.85"/>
    <!-- Progress glow -->
    ${totalKoin>0?`<path d="${pathD}" stroke="${allDone?'#FFE066':'#52D98A'}" stroke-width="5"
      fill="none" stroke-linecap="round" opacity="0.4" stroke-dasharray="6,16"/>`:''}

    <!-- Fog lights on road (dark weather) -->
    ${isDark?`
    <ellipse cx="${car.x}" cy="${car.y+20}" rx="40" ry="15"
      fill="rgba(255,255,150,0.08)" style="filter:blur(4px)"/>
    `:''}

    <!-- START SIGN -->
    <rect x="148" y="577" width="84" height="24" rx="7" fill="${isDark?'rgba(46,204,113,0.8)':'#27AE60'}"/>
    <text x="190" y="593" text-anchor="middle" font-family="Arial,sans-serif"
      font-size="12" font-weight="900" fill="white">🚦 START</text>

    <!-- BUILDINGS -->
    ${BUILDINGS.map((b,i)=>renderBldg(b,i)).join('')}

    <!-- LASER EFFECT (when last building was just unlocked) -->
    ${unlockedCount>1&&totalKoin===BUILDINGS[unlockedCount-1]?.minKoin?`
    <line x1="${car.x}" y1="${car.y}"
      x2="${WPS[unlockedCount-1]?WPS[unlockedCount-1].x+(WPS[unlockedCount-1].side==='R'?SIDE_OFFSET:-SIDE_OFFSET):car.x}"
      y2="${WPS[unlockedCount-1]?WPS[unlockedCount-1].y-24:car.y}"
      stroke="#52D98A" stroke-width="3" opacity="0.8"
      style="animation:laserShoot 0.6s ease-out forwards"/>
    `:''}

    <!-- CAR -->
    <g transform="translate(${Math.round(car.x)},${Math.round(car.y)})">
      <!-- Headlights (visible in dark) -->
      ${isDark?`
      <ellipse cx="18" cy="4" rx="28" ry="8" fill="rgba(255,255,200,0.12)"/>
      <ellipse cx="18" cy="4" rx="16" ry="5" fill="rgba(255,255,150,0.2)"/>`:''}
      <!-- Shadow -->
      <ellipse cx="0" cy="13" rx="18" ry="6" fill="rgba(0,0,0,0.25)"/>
      <!-- Nitro flames -->
      ${hasNitro?`
      <text x="-24" y="0" font-size="10" style="animation:nitroFlame 0.4s infinite">🔥</text>
      <text x="-28" y="8" font-size="13" style="animation:nitroFlame 0.4s infinite 0.1s">🔥</text>`:''}
      <!-- Body -->
      <rect x="-16" y="-16" width="32" height="22" rx="7" fill="${carColor}"/>
      <!-- Roof -->
      <rect x="-11" y="-28" width="22" height="16" rx="5" fill="${carColor}" opacity="0.9"/>
      <!-- Windscreen -->
      <rect x="-9" y="-26" width="18" height="12" rx="3" fill="${isDark?'rgba(180,210,255,0.85)':'rgba(200,235,255,0.9)'}"/>
      <!-- Windscreen highlight -->
      <rect x="-7" y="-24" width="5" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
      <!-- Spoiler -->
      ${hasSpoiler?`<rect x="-14" y="-32" width="28" height="5" rx="2" fill="${carColor}" opacity="0.8"/>
      <rect x="-12" y="-36" width="8" height="4" rx="1" fill="${carColor}"/>
      <rect x="4" y="-36" width="8" height="4" rx="1" fill="${carColor}"/>`:''}
      <!-- Wheels -->
      <circle cx="-10" cy="7" r="5" fill="#2C3E50"/>
      <circle cx="-10" cy="7" r="2.5" fill="#7F8C8D"/>
      <circle cx="10" cy="7" r="5" fill="#2C3E50"/>
      <circle cx="10" cy="7" r="2.5" fill="#7F8C8D"/>
      <!-- Headlights -->
      <rect x="13" y="-10" width="5" height="6" rx="2" fill="${isDark?'#FFE066':'rgba(255,230,0,0.7)'}"/>
      <!-- Avatar + stickers -->
      <text x="0" y="-12" text-anchor="middle" font-size="13">${u.avatar}</text>
      ${activeStickers?`<text x="14" y="-18" font-size="9">${activeStickers}</text>`:''}
      <!-- Motion lines -->
      ${totalKoin>0?`
      <line x1="-19" y1="-6"  x2="-30" y2="-6"  stroke="white" stroke-width="2"   opacity="0.4" stroke-linecap="round"/>
      <line x1="-19" y1="0"   x2="-33" y2="0"    stroke="white" stroke-width="2.5" opacity="0.3" stroke-linecap="round"/>
      <line x1="-19" y1="6"   x2="-28" y2="6"    stroke="white" stroke-width="1.5" opacity="0.25" stroke-linecap="round"/>
      `:''}
    </g>

    <!-- Koin badge -->
    <rect x="6" y="6" width="72" height="22" rx="8" fill="${isDark?'rgba(0,0,0,0.5)':'rgba(0,0,0,0.35)'}"/>
    <text x="12" y="21" font-family="Arial,sans-serif" font-size="12"
      font-weight="900" fill="#FFE066">⭐ ${totalKoin}</text>

    <!-- Building count -->
    <rect x="${W-78}" y="6" width="72" height="22" rx="8" fill="${isDark?'rgba(0,0,0,0.5)':'rgba(0,0,0,0.35)'}"/>
    <text x="${W-42}" y="21" text-anchor="middle" font-family="Arial,sans-serif"
      font-size="11" font-weight="900" fill="white">${unlockedCount}/${BUILDINGS.length} 🏗️</text>

  </svg>
  </div>

  <!-- Bottom strip -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
    <div style="background:${isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.12)'};border-radius:11px;padding:9px 11px">
      <div style="font-size:9px;color:${isDark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.45)'};font-weight:700;letter-spacing:0.5px;margin-bottom:3px">PROGRES DESA</div>
      <div style="font-family:var(--font-round);font-size:18px;font-weight:900;color:${isDark?'#fff':'#1A1A2E'}">🏡 ${pct}%</div>
      <div style="height:5px;background:${isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'};border-radius:3px;margin-top:5px;overflow:hidden">
        <div style="height:100%;background:${allDone?'linear-gradient(90deg,#F39C12,#FFE066)':'#52D98A'};border-radius:3px;width:${Math.min(pct,100)}%;transition:width 0.6s ease"></div>
      </div>
    </div>
    <div style="background:${isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.12)'};border-radius:11px;padding:9px 11px">
      <div style="font-size:9px;color:${isDark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.45)'};font-weight:700;letter-spacing:0.5px;margin-bottom:3px">${nextB?'TARGET':'STATUS'}</div>
      <div style="font-family:var(--font-round);font-size:13px;font-weight:900;color:${isDark?'#FFE066':'#1A1A2E'};line-height:1.2">${nextB?nextB.icon+' '+nextB.name:'🏆 Semua Terbangun!'}</div>
      <div style="font-size:10px;color:${isDark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.4)'};margin-top:3px">${nextB?(nextB.minKoin-totalKoin)+' koin lagi':'Kamu luar biasa!'}</div>
    </div>
  </div>

  <!-- Quick garage button -->
  <button onclick="switchPage('garasi')" style="width:100%;margin-top:8px;padding:9px;
    background:${isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'};
    border:1.5px solid ${isDark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.1)'};
    border-radius:11px;color:${isDark?'rgba(255,255,255,0.7)':'rgba(0,0,0,0.5)'};
    font-family:var(--font-round);font-weight:700;font-size:12px;cursor:pointer">
    🏎️ Buka Garasi — Modifikasi Mobilmu
  </button>
</div>`;
}


function renderBadgesGrid(){
  const u=CU, grid=document.getElementById('badges-grid');
  grid.innerHTML='';
  BADGES.forEach((b,i)=>{
    const unlocked=(i===0&&u.streak>=7)||(i===4&&u.koin>=200);
    const div=document.createElement('div');
    div.className='badge-item '+(unlocked?'unlocked':'locked');
    div.innerHTML=`<span style="font-size:24px;display:block;margin-bottom:2px">${b.icon}</span><span style="font-size:8px;font-weight:700;font-family:var(--font-round);line-height:1.2">${b.name}</span>`;
    div.title=b.req;
    grid.appendChild(div);
  });
}

function renderCardsGrid(){
  const u=CU, grid=document.getElementById('cards-grid');
  grid.innerHTML='';
  const owned=u.cards||[];
  document.getElementById('cards-count').textContent=owned.length;
  COLLECT_CARDS.forEach(c=>{
    const have=owned.includes(c.id);
    const div=document.createElement('div');
    div.className='coll-card'+(have?'':' locked');
    div.style.background=have?c.grad:'';
    div.innerHTML=`<span class="cc-icon">${c.icon}</span><span class="cc-name">${c.name}</span><span class="cc-rarity">${c.rarity}</span>`;
    if(have)div.onclick=()=>showBigCard(c);
    grid.appendChild(div);
  });
}

function renderOrtu(){
  const u = CU;
  const done = Object.keys(u.checkedToday||{}).length;
  const pct = Math.round(done/7*100);
  const tier = getTier(u.koin);
  const verified = u.verifiedToday || {};

  document.getElementById('ortu-av').textContent = u.avatar;
  document.getElementById('ortu-name').textContent = u.name;
  document.getElementById('ortu-sub').textContent =
    'Kelas '+u.kelas+(u.age?' · Usia '+u.age+' tahun':'')+' · Level '+u.level+' · Tier '+tier.icon+' '+tier.name;
  document.getElementById('ortu-summary').textContent = done>0
    ? '✅ '+done+'/7 kebiasaan selesai hari ini ('+pct+'%)'
    : '📋 Belum ada kebiasaan selesai hari ini.';
  document.getElementById('o-stat1').textContent = pct+'%';
  document.getElementById('o-stat2').textContent = u.streak;
  document.getElementById('o-stat3').textContent = u.koin;

  // Verify panel
  const needV = HABITS.filter(hb=>hb.needVerify && (u.checkedToday||{})[hb.id]);
  const alreadyVerified = needV.filter(hb=>verified[hb.id]==='yes');
  const alreadyRejected = needV.filter(hb=>verified[hb.id]==='no');
  const pending = needV.filter(hb=>!verified[hb.id]);

  const vNote = document.getElementById('ortu-verify-note');
  const vList = document.getElementById('ortu-unverified-list');
  const verList = document.getElementById('ortu-verified-list');

  if(needV.length === 0){
    if(vNote) vNote.textContent = 'Tidak ada kebiasaan yang perlu verifikasi hari ini. Terima kasih!';
    if(vList) vList.innerHTML = '';
    if(verList) verList.innerHTML = '';
  } else {
    if(vNote) vNote.textContent = pending.length>0
      ? pending.length+' kebiasaan menunggu konfirmasi Anda:'
      : 'Semua kebiasaan sudah dikonfirmasi. Terima kasih!';

    // Pending items — with approve/reject
    if(vList) {
      vList.innerHTML = pending.map(hb=>`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;
          border-bottom:1px solid rgba(133,100,4,0.15)">
          <span style="font-size:18px">${hb.icon}</span>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:700;color:#1A1A2E">${hb.name}</div>
            <div style="font-size:10px;color:#856404">Apakah benar-benar dilakukan?</div>
          </div>
          <button onclick="verifyHabit('${hb.id}','yes')" style="padding:5px 10px;
            background:#27AE60;border:none;border-radius:8px;color:white;
            font-size:11px;font-weight:800;cursor:pointer;font-family:var(--font-round)">✓ Ya</button>
          <button onclick="verifyHabit('${hb.id}','no')" style="padding:5px 10px;
            background:#E74C3C;border:none;border-radius:8px;color:white;
            font-size:11px;font-weight:800;cursor:pointer;font-family:var(--font-round)">✗ Tidak</button>
        </div>`).join('');
    }

    // Already verified
    if(verList && (alreadyVerified.length+alreadyRejected.length)>0){
      verList.innerHTML = '<div style="font-size:10px;color:#856404;font-weight:700;margin-bottom:4px">Sudah dikonfirmasi:</div>' +
        [...alreadyVerified.map(hb=>`
          <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px">
            <span>${hb.icon}</span><span style="flex:1;color:#27AE60;font-weight:700">${hb.name}</span>
            <span style="color:#27AE60;font-weight:800">✓ Diverifikasi</span>
          </div>`),
        ...alreadyRejected.map(hb=>`
          <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px">
            <span>${hb.icon}</span><span style="flex:1;color:#E74C3C;font-weight:700">${hb.name}</span>
            <span style="color:#E74C3C;font-weight:800">✗ Perlu diulang</span>
          </div>`)].join('');
    }
  }

  // AI note
  const notes = done===0
    ? 'Anak Anda belum memulai hari ini. Ingatkan dengan lembut.'
    : done<4
    ? (u.name.split(' ')[0])+' sudah memulai ('+done+'/7). Dampingi untuk menyelesaikan sisanya.'
    : done<7
    ? 'Hampir sempurna! '+done+'/7 selesai. Satu dorongan kecil dari Anda bisa jadi penyempurna.'
    : 'MasyaAllah! 7/7 kebiasaan selesai. Rayakan bersama keluarga malam ini! 🌟';
  document.getElementById('ortu-note').textContent = notes;

  // Progress list
  const plist = document.getElementById('ortu-prog-list');
  if(plist) {
    plist.innerHTML = '';
    HABITS.forEach(hb=>{
      const ok = !!(u.checkedToday||{})[hb.id];
      const isVerified = verified[hb.id]==='yes';
      const isRejected = verified[hb.id]==='no';
      const div = document.createElement('div');
      div.className = 'prog-row';
      div.innerHTML = `
        <div class="prog-head">
          <div class="prog-name">${hb.icon} ${hb.name}
            ${hb.needVerify?'<span style="font-size:9px;color:#856404;margin-left:3px">📋</span>':''}
          </div>
          <div class="prog-val" style="color:${isRejected?'#E74C3C':ok?'var(--green-dark)':'var(--muted)'}">
            ${isRejected?'✗ Perlu diulang':isVerified?'✓ Terverifikasi':ok?'✓ Selesai':'Belum'}
          </div>
        </div>
        <div class="prog-bar"><div class="prog-fill" style="width:${ok?100:0}%;
          background:${isRejected?'#E74C3C':isVerified?'#27AE60':ok?'var(--green)':'#DDD'}"></div></div>`;
      plist.appendChild(div);
    });
  }
}

function verifyHabit(habitId, verdict){
  const u = CU;
  if(!u.verifiedToday) u.verifiedToday = {};
  u.verifiedToday[habitId] = verdict;
  if(verdict === 'no'){
    // Remove the check-in and refund coins/xp
    const hb = HABITS.find(h=>h.id===habitId);
    if(hb && u.checkedToday && u.checkedToday[habitId]){
      delete u.checkedToday[habitId];
      u.koin = Math.max(0, u.koin - hb.koin);
      u.xp = Math.max(0, u.xp - hb.xp);
    }
  }
  saveCU();
  renderOrtu();
  showToast(verdict==='yes'
    ? '✅ Kebiasaan diverifikasi! Terima kasih.'
    : '⚠️ Kebiasaan perlu diulang. Koin dikembalikan.');
}


function renderGarasi(){
  if(CRole !== 'anak') return;
  const u = CU;
  const garage = u.garage || {colorId:'default', stickers:[], upgrades:[], ownedColors:['default']};

  // Car display
  const colorCfg = CAR_COLORS.find(c=>c.id===(garage.colorId||'default')) || CAR_COLORS[0];
  const hasNitro = (garage.upgrades||[]).includes('nitro') && u.streak >= 3;
  const hasSpoiler = (garage.upgrades||[]).includes('spoiler');
  const stickersOwned = garage.stickers || [];

  const carEmojis = {'🦁':'🦁','🌙':'🌙','⚡':'⚡','🌟':'🌟','🏆':'🏆',
    '🦋':'🦋','🐯':'🐯','🌸':'🌸','🦅':'🦅','🌿':'🌿','🦊':'🦊','🐬':'🐬'};

  const activeStickers = stickersOwned.map(sid => {
    const s = STICKERS.find(x=>x.id===sid); return s ? s.icon : '';
  }).join(' ');

  const modCount = stickersOwned.length + (garage.upgrades||[]).length +
    (garage.colorId && garage.colorId !== 'default' ? 1 : 0);

  // Update preview section
  const preview = document.getElementById('garasi-car-display');
  if(preview) {
    preview.innerHTML = `
      <div style="position:relative;display:inline-block">
        ${hasNitro ? '<div style="position:absolute;bottom:-10px;left:5px;font-size:20px;animation:nitroFlame 0.4s infinite">🔥</div><div style="position:absolute;bottom:-10px;right:5px;font-size:20px;animation:nitroFlame 0.4s infinite 0.2s">🔥</div>' : ''}
        <div style="font-size:70px;animation:raceFloat 2s ease-in-out infinite;
          filter:drop-shadow(0 6px 12px rgba(0,0,0,0.4)) hue-rotate(${getHueRotate(colorCfg.color)}deg)">
          🚗
        </div>
        ${hasSpoiler ? '<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:16px">🏁</div>' : ''}
        ${activeStickers ? `<div style="position:absolute;top:0;right:-10px;font-size:14px;line-height:1.4">${activeStickers}</div>` : ''}
        <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px">${u.avatar} ${u.nickname||u.name.split(' ')[0]}</div>
      </div>`;
  }
  const nameEl = document.getElementById('garasi-car-name');
  if(nameEl) nameEl.textContent = colorCfg.name + (colorCfg.islamic ? ' ' + colorCfg.islamic : '');
  const modsEl = document.getElementById('garasi-car-mods');
  if(modsEl) modsEl.textContent = modCount > 0 ? modCount + ' modifikasi aktif' : 'Belum ada modifikasi';
  const koinEl = document.getElementById('garasi-koin-display');
  if(koinEl) koinEl.textContent = '⭐ ' + u.koin + ' Koin tersisa';

  // ── Colors ──
  const colorsEl = document.getElementById('garasi-colors');
  if(colorsEl) {
    colorsEl.innerHTML = '';
    CAR_COLORS.forEach(c => {
      const owned = (garage.ownedColors||['default']).includes(c.id);
      const equipped = garage.colorId === c.id;
      const btn = document.createElement('div');
      btn.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer`;
      btn.innerHTML = `
        <div class="color-swatch ${equipped?'selected':''}"
          style="background:${c.color};${owned?'':'opacity:0.4;filter:grayscale(0.5)'}">
          ${equipped ? '<div style="color:white;font-size:16px;text-align:center;line-height:40px">✓</div>' : ''}
        </div>
        <span style="font-size:9px;font-weight:700;color:var(--muted);text-align:center;line-height:1.2;max-width:44px">${c.name}</span>
        ${!owned ? `<span style="font-size:9px;color:var(--green-dark);font-weight:800">⭐${c.price}</span>` : ''}`;
      btn.onclick = () => buyOrEquipColor(c);
      colorsEl.appendChild(btn);
    });
  }

  // ── Stickers ──
  const stEl = document.getElementById('garasi-stickers');
  if(stEl) {
    stEl.innerHTML = '';
    STICKERS.forEach(s => {
      const owned = stickersOwned.includes(s.id);
      const div = document.createElement('div');
      div.className = 'shop-item ' + (owned ? 'owned' : '');
      div.innerHTML = `
        <span class="item-icon">${s.icon}</span>
        <div class="item-name">${s.name}</div>
        <div class="item-price">${owned ? '✓ Dimiliki' : '⭐ ' + s.price + ' Koin'}</div>
        ${owned ? '<span class="item-badge" style="background:#EAF9F0;color:var(--green-dark)">Aktif</span>' : ''}`;
      div.onclick = () => owned ? showToast(s.icon + ' ' + s.name + ' sudah kamu miliki!') : buySticker(s);
      stEl.appendChild(div);
    });
  }

  // ── Upgrades ──
  const upEl = document.getElementById('garasi-upgrades');
  if(upEl) {
    upEl.innerHTML = '';
    UPGRADES.forEach(up => {
      const owned = (garage.upgrades||[]).includes(up.id);
      const div = document.createElement('div');
      div.style.cssText = `display:flex;align-items:center;gap:10px;padding:10px;
        border:1.5px solid ${owned?'var(--green)':'var(--border)'};border-radius:11px;
        background:${owned?'var(--green-light)':'#fff'};cursor:pointer;transition:all 0.2s`;
      div.innerHTML = `
        <span style="font-size:28px;flex-shrink:0">${up.icon}</span>
        <div style="flex:1">
          <div style="font-family:var(--font-round);font-size:13px;font-weight:800">${up.name}</div>
          <div style="font-size:10px;color:var(--muted);line-height:1.4">${up.desc}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          ${owned
            ? '<div style="font-size:11px;font-weight:800;color:var(--green-dark)">✓ Terpasang</div>'
            : `<div style="font-family:var(--font-round);font-size:13px;font-weight:900;color:var(--green-dark)">⭐${up.price}</div>`
          }
        </div>`;
      div.onclick = () => owned ? showToast(up.icon + ' ' + up.name + ' sudah terpasang!') : buyUpgrade(up);
      upEl.appendChild(div);
    });
  }
}

function getHueRotate(hex){
  // Approximate hue rotation from base orange (#F39C12) to target color
  const hues = {'#F39C12':0,'#27AE60':85,'#ECF0F1':0,'#2980B9':200,
    '#F1C40F':10,'#8E44AD':270,'#E74C3C':350,'#1ABC9C':160};
  return hues[hex] || 0;
}

function buyOrEquipColor(c){
  const u = CU;
  if(!u.garage) u.garage = {colorId:'default',stickers:[],upgrades:[],ownedColors:['default']};
  const owned = (u.garage.ownedColors||['default']).includes(c.id);
  if(owned){
    u.garage.colorId = c.id;
    saveCU(); renderGarasi(); renderWorld();
    showToast('🎨 Cat ' + c.name + ' dipasang!');
  } else {
    if(u.koin < c.price){ showToast('⭐ Koin belum cukup! Butuh ' + c.price + ' koin.'); return; }
    u.koin -= c.price;
    u.garage.ownedColors = [...(u.garage.ownedColors||['default']), c.id];
    u.garage.colorId = c.id;
    saveCU(); renderGarasi(); updateStats();
    showToast('🎨 Cat ' + c.name + ' dibeli dan dipasang! -' + c.price + ' Koin');
  }
}

function buySticker(s){
  const u = CU;
  if(!u.garage) u.garage = {colorId:'default',stickers:[],upgrades:[],ownedColors:['default']};
  if(u.koin < s.price){ showToast('⭐ Koin belum cukup! Butuh ' + s.price + ' koin.'); return; }
  u.koin -= s.price;
  u.garage.stickers = [...(u.garage.stickers||[]), s.id];
  saveCU(); renderGarasi(); updateStats();
  showToast(s.icon + ' Stiker ' + s.name + ' dibeli! -' + s.price + ' Koin');
}

function buyUpgrade(up){
  const u = CU;
  if(!u.garage) u.garage = {colorId:'default',stickers:[],upgrades:[],ownedColors:['default']};
  if(u.koin < up.price){ showToast('⭐ Koin belum cukup! Butuh ' + up.price + ' koin.'); return; }
  u.koin -= up.price;
  u.garage.upgrades = [...(u.garage.upgrades||[]), up.id];
  saveCU(); renderGarasi(); updateStats();
  showToast(up.icon + ' ' + up.name + ' terpasang! -' + up.price + ' Koin');
}

// ── SCHOOL PANEL FUNCTIONS ──

function showSchoolPanel(panel){
  ['rekap','sertifikat','notif'].forEach(p=>{
    const el = document.getElementById('school-panel-'+p);
    const btn = document.getElementById('btn-'+p);
    if(el) el.style.display = p===panel?'block':'none';
    if(btn){
      const active = p===panel;
      btn.style.borderColor = active?'var(--green)':'var(--border)';
      btn.style.background = active?'var(--green-light)':'#fff';
      btn.style.color = active?'var(--green-dark)':'var(--muted)';
    }
  });
  if(panel==='rekap') renderRekap();
  if(panel==='sertifikat') renderSertifikat();
}

function renderRekap(){
  const ss = STORE.students;
  const wrap = document.getElementById('rekap-table-wrap');
  if(!wrap) return;
  if(!ss.length){
    wrap.innerHTML='<div style="text-align:center;padding:12px;color:var(--muted);font-size:12px">Belum ada siswa terdaftar.</div>';
    return;
  }
  const sorted = [...ss].sort((a,b)=>b.koin-a.koin);
  wrap.innerHTML = `
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead>
          <tr style="background:#1A1A2E;color:#fff">
            <th style="padding:8px 6px;text-align:left;border-radius:8px 0 0 0">Nama</th>
            <th style="padding:8px 4px;text-align:center">Kelas</th>
            <th style="padding:8px 4px;text-align:center">✅ Hari ini</th>
            <th style="padding:8px 4px;text-align:center">⭐ Koin</th>
            <th style="padding:8px 4px;text-align:center">🔥 Streak</th>
            <th style="padding:8px 6px;text-align:center;border-radius:0 8px 0 0">Tier</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((s,i)=>{
            const done = Object.keys(s.checkedToday||{}).length;
            const tier = getTier(s.koin);
            const bg = i%2===0?'#FAFAFA':'#fff';
            return `<tr style="background:${bg}">
              <td style="padding:7px 6px;font-weight:700">${s.nickname||s.name.split(' ')[0]}</td>
              <td style="padding:7px 4px;text-align:center;color:var(--muted)">${s.kelas.split(' ')[0]}</td>
              <td style="padding:7px 4px;text-align:center;color:${done>=5?'var(--green-dark)':done>=3?'#856404':'var(--coral)'};font-weight:800">${done}/7</td>
              <td style="padding:7px 4px;text-align:center;font-weight:800">${s.koin}</td>
              <td style="padding:7px 4px;text-align:center">${s.streak>0?'🔥'+s.streak:'-'}</td>
              <td style="padding:7px 6px;text-align:center">${tier.icon}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  const total = ss.reduce((a,s)=>a+Object.keys(s.checkedToday||{}).length,0);
  const avg = ss.length?Math.round(total/(ss.length*7)*100):0;
  const topS = [...ss].sort((a,b)=>b.koin-a.koin)[0];
  const noteEl = document.getElementById('rekap-ai-note');
  if(noteEl) noteEl.textContent = ss.length===0?'Belum ada data.':
    'Hari ini '+avg+'% kebiasaan diselesaikan oleh seluruh kelas. '+
    (topS?topS.name.split(' ')[0]+' memimpin dengan '+topS.koin+' koin.':'')+
    (avg>=70?' MasyaAllah, kelas luar biasa!':avg>=40?' Terus semangat!':' Yuk dorong lebih banyak siswa hari ini!');
}

function renderSertifikat(){
  const ss = STORE.students;
  const el = document.getElementById('sertifikat-list');
  if(!el) return;
  // Show top students (streak >= 3 or koin >= 100)
  const achievers = ss.filter(s=>s.streak>=3||s.koin>=100||Object.keys(s.checkedToday||{}).length>=5);
  if(!achievers.length){
    el.innerHTML='<div style="text-align:center;padding:16px;font-size:12px;color:var(--muted)">Belum ada siswa yang memenuhi kriteria sertifikat.<br>Dorong siswa untuk aktif 3+ hari berturut-turut!</div>';
    return;
  }
  el.innerHTML = achievers.map(s=>{
    const tier = getTier(s.koin);
    const reason = s.streak>=7?'Konsistensi Luar Biasa ('+s.streak+' hari)':
      s.koin>=300?'Pencapaian '+s.koin+' Koin':
      'Pahlawan Kebiasaan Harian';
    return `
    <div onclick="previewSertifikat('${s.id}')" style="display:flex;align-items:center;gap:10px;
      padding:10px;border:1.5px solid var(--border);border-radius:12px;margin-bottom:7px;
      cursor:pointer;transition:all 0.2s;background:#fff" 
      onmouseover="this.style.borderColor='var(--green)';this.style.background='var(--green-light)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.background='#fff'">
      <div style="font-size:28px">${s.avatar}</div>
      <div style="flex:1">
        <div style="font-family:var(--font-round);font-size:13px;font-weight:800">${s.name}</div>
        <div style="font-size:10px;color:var(--muted)">${s.kelas}</div>
        <div style="font-size:10px;color:var(--green-dark);margin-top:2px">🏅 ${reason}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px">${tier.icon}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">Preview →</div>
      </div>
    </div>`;
  }).join('');
}

function previewSertifikat(studentId){
  const s = STORE.students.find(x=>x.id===studentId);
  if(!s) return;
  const tier = getTier(s.koin);
  const today = new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  const reason = s.streak>=7?'Konsistensi Luar Biasa selama '+s.streak+' Hari Berturut-turut':
    s.koin>=300?'Pencapaian '+s.koin+' Koin Kebiasaan':
    'Partisipasi Aktif dalam Program 7 Kebiasaan';

  // Open sertifikat in new overlay
  const overlay = document.getElementById('overlay-sertifikat');
  if(!overlay) return;
  document.getElementById('sert-name').textContent = s.name;
  document.getElementById('sert-class').textContent = s.kelas + ' · SDIT Qudwatun Hasanah';
  document.getElementById('sert-reason').textContent = reason;
  document.getElementById('sert-date').textContent = today;
  document.getElementById('sert-tier').textContent = tier.icon + ' Tier ' + tier.name;
  document.getElementById('sert-avatar').textContent = s.avatar;
  overlay.style.display = 'flex';
}

function sendSchoolNotif(){
  const target = document.getElementById('notif-target');
  const msg = document.getElementById('notif-msg');
  const result = document.getElementById('notif-result');
  if(!msg||!msg.value.trim()){ showToast('⚠️ Tulis pesan dulu!'); return; }
  const ss = STORE.students;
  let count = 0;
  if(target.value==='all') count = ss.length;
  else if(target.value==='inactive') count = ss.filter(s=>Object.keys(s.checkedToday||{}).length===0).length;
  else if(target.value==='streak') count = ss.filter(s=>s.streak>=3).length;
  else if(target.value==='low') count = ss.filter(s=>{
    const d=Object.keys(s.checkedToday||{}).length; return d<4;
  }).length;
  if(result) result.innerHTML = '✅ Pesan berhasil dikirim ke <strong>'+count+' orang tua</strong>!<br><span style="font-size:10px;color:var(--muted)">(Fitur notifikasi real membutuhkan integrasi server — tersedia di versi penuh)</span>';
  showToast('📨 Pesan terkirim ke '+count+' orang tua!');
}

function renderSchool(){
  const ss = STORE.students;
  const active = ss.filter(s=>Object.keys(s.checkedToday||{}).length>0).length;
  const total = ss.reduce((a,s)=>a+Object.keys(s.checkedToday||{}).length,0);
  const avg = ss.length>0 ? Math.round(total/(ss.length*7)*100) : 0;
  const goldCount = ss.filter(s=>getTier(s.koin).min>=500).length;
  const streak3 = ss.filter(s=>s.streak>=3).length;

  document.getElementById('sc-s1').textContent = active;
  document.getElementById('sc-s2').textContent = avg+'%';
  document.getElementById('sc-s3').textContent = total;
  document.getElementById('sc-s4').textContent = goldCount;
  document.getElementById('school-sub').textContent = '4 Kelas · '+ss.length+' Siswa Terdaftar';

  document.getElementById('school-ai').textContent = ss.length===0
    ? 'Belum ada siswa. Tambahkan di menu Admin.'
    : active===0
    ? 'Hari baru di SDIT Qudwatun Hasanah! '+ss.length+' siswa siap memulai.'
    : active+'/'+ss.length+' siswa aktif hari ini. '+total+' kebiasaan selesai.'+(streak3>0?' '+streak3+' siswa Nitro Boost aktif!':'');

  // ── GRAND PRIX RACE TRACK ──
  const sorted = [...ss].sort((a,b)=>b.koin-a.koin||b.streak-a.streak);
  const maxKoin = sorted.length>0 ? Math.max(sorted[0].koin, 1) : 1;
  const trackLen = 280; // px

  // Car colors from garage
  const carColors={'🦁':'#F39C12','🌙':'#9B59B6','⚡':'#E74C3C','🌟':'#F1C40F',
    '🏆':'#27AE60','🦋':'#E91E8C','🐯':'#E67E22','🌸':'#FF69B4',
    '🦅':'#2980B9','🌿':'#1ABC9C','🦊':'#D35400','🐬':'#16A085'};

  function getCarColor(student){
    const gc = student.garage && student.garage.colorId;
    if(gc && gc!=='default'){
      const cfg = CAR_COLORS.find(c=>c.id===gc);
      if(cfg) return cfg.color;
    }
    return carColors[student.avatar]||'#888';
  }

  function getCarMods(student){
    const g = student.garage||{};
    const stickers = (g.stickers||[]).map(sid=>{
      const s = STICKERS.find(x=>x.id===sid); return s?s.icon:'';
    }).filter(Boolean).slice(0,2).join('');
    const hasSpoiler = (g.upgrades||[]).includes('spoiler');
    const hasNitro = (g.upgrades||[]).includes('nitro') && student.streak>=3;
    return {stickers, hasSpoiler, hasNitro};
  }

  // Class average bus progress
  const busProgress = Math.round(avg/100 * trackLen);

  const lb = document.getElementById('leaderboard');
  if(!lb) return;

  if(sorted.length === 0){
    lb.innerHTML='<div style="text-align:center;padding:16px;color:var(--muted);font-size:12px">Belum ada siswa terdaftar.</div>';
    return;
  }

  lb.innerHTML = `
  <!-- GRAND PRIX HEADER -->
  <div style="padding:10px 13px;border-bottom:1px solid var(--border);
    display:flex;align-items:center;justify-content:space-between">
    <div style="font-family:var(--font-round);font-size:13px;font-weight:900">
      🏎️ Grand Prix SDIT Qudwatun Hasanah
    </div>
    <div style="font-size:10px;color:var(--muted)">${sorted.length} pembalap</div>
  </div>

  <!-- RACE TRACK SVG -->
  <div style="padding:12px;background:linear-gradient(180deg,#1a1a2e 0%,#16213e 100%)">

    <!-- BUS SEKOLAH PROGRESS (Co-op) -->
    <div style="margin-bottom:10px;background:rgba(255,255,255,0.06);border-radius:10px;padding:8px 10px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
        <div style="font-size:10px;color:rgba(255,255,255,0.6);font-weight:700">🚌 Bus Kelas — Target Bersama</div>
        <div style="font-size:10px;color:#FFE066;font-weight:800">${avg}% konsistensi</div>
      </div>
      <div style="height:28px;background:rgba(255,255,255,0.08);border-radius:8px;
        position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
        <!-- Track markings -->
        <div style="position:absolute;inset:0;display:flex;align-items:center;
          justify-content:space-around;padding:0 8px">
          ${[25,50,75,100].map(p=>`<div style="font-size:7px;color:rgba(255,255,255,0.3);font-weight:700">${p}%</div>`).join('')}
        </div>
        <!-- Bus fill -->
        <div style="height:100%;width:${avg}%;background:linear-gradient(90deg,#E67E22,#F39C12);
          border-radius:8px;transition:width 0.8s ease;position:relative;overflow:hidden">
          <div style="position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
            animation:gpShimmer 2s linear infinite"></div>
        </div>
        <!-- Bus emoji -->
        <div style="position:absolute;top:50%;transform:translateY(-50%);
          left:calc(${Math.min(avg,95)}% - 16px);font-size:18px;transition:left 0.8s ease;
          filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🚌</div>
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;text-align:center">
        ${avg>=100 ? '🎉 Target tercapai! Hadiah kelas menanti!' : 'Capai 100% bersama untuk hadiah kelas!'}
      </div>
    </div>

    <!-- INDIVIDUAL RACE LANES -->
    <div style="display:flex;flex-direction:column;gap:6px">
      ${sorted.map((s,i)=>{
        const pos = Math.round((s.koin/maxKoin) * trackLen);
        const tier = getTier(s.koin);
        const cc = getCarColor(s);
        const mods = getCarMods(s);
        const isMe = CU && s.id === CU.id;
        const rank = i+1;
        const rankIcon = rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':'';
        const nickname = s.nickname || s.name.split(' ')[0];

        return `
        <div style="background:${isMe?'rgba(46,204,113,0.12)':'rgba(255,255,255,0.04)'};
          border-radius:9px;padding:6px 8px;
          border:1px solid ${isMe?'rgba(46,204,113,0.3)':'rgba(255,255,255,0.06)'}">
          <!-- Lane header -->
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
            <div style="font-size:11px;font-weight:900;color:rgba(255,255,255,0.4);
              width:16px;text-align:center">${rankIcon||rank}</div>
            <div style="font-size:16px">${s.avatar}</div>
            <div style="flex:1">
              <div style="font-family:var(--font-round);font-size:11px;font-weight:800;
                color:${isMe?'#52D98A':'rgba(255,255,255,0.85)'}">${nickname}${isMe?' (Kamu)':''}</div>
              <div style="font-size:9px;color:rgba(255,255,255,0.4)">Kelas ${s.kelas.split(' ')[0]}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:11px;font-weight:900;color:${tier.color};font-family:var(--font-round)">${tier.icon} ${s.koin}</div>
              ${s.streak>=3?`<div style="font-size:8px;color:#FF6B35;font-weight:800;animation:nitroFlame 0.6s infinite">⚡NITRO</div>`:''}
            </div>
          </div>

          <!-- Race lane -->
          <div style="height:32px;background:rgba(0,0,0,0.3);border-radius:6px;
            position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
            <!-- Lane stripes -->
            <div style="position:absolute;inset:0;
              background:repeating-linear-gradient(90deg,transparent,transparent 18px,
              rgba(255,255,255,0.04) 18px,rgba(255,255,255,0.04) 20px)"></div>

            <!-- Finish line -->
            <div style="position:absolute;right:8px;top:0;bottom:0;width:4px;
              background:repeating-linear-gradient(180deg,white 0,white 4px,black 4px,black 8px);
              opacity:0.6"></div>
            <div style="position:absolute;right:0;top:0;bottom:0;width:8px;
              background:repeating-linear-gradient(180deg,#FFE066 0,#FFE066 4px,#1A1A2E 4px,#1A1A2E 8px)"></div>

            <!-- CAR -->
            <div style="position:absolute;top:50%;transform:translateY(-50%);
              left:${Math.max(2,Math.min(pos, trackLen-20))}px;
              transition:left 1s cubic-bezier(0.25,0.46,0.45,0.94)">

              <!-- Nitro flames -->
              ${mods.hasNitro||s.streak>=3?`
              <div style="position:absolute;right:100%;top:50%;transform:translateY(-50%);
                display:flex;gap:1px">
                <div style="font-size:8px;animation:nitroFlame 0.3s infinite">🔥</div>
                <div style="font-size:10px;animation:nitroFlame 0.3s infinite 0.1s">🔥</div>
              </div>`:''}

              <!-- Car body (SVG mini) -->
              <svg width="36" height="24" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"
                style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
                <rect x="1" y="10" width="34" height="12" rx="4" fill="${cc}"/>
                <rect x="6" y="4" width="22" height="10" rx="3" fill="${cc}" opacity="0.85"/>
                <rect x="8" y="5" width="9" height="7" rx="2" fill="rgba(200,235,255,0.9)"/>
                <rect x="19" y="5" width="7" height="7" rx="2" fill="rgba(200,235,255,0.9)"/>
                ${mods.hasSpoiler?'<rect x="1" y="8" width="5" height="3" rx="1" fill="'+cc+'"/><rect x="30" y="8" width="5" height="3" rx="1" fill="'+cc+'"/>':''}
                <circle cx="9" cy="21" r="3" fill="#2C3E50"/><circle cx="9" cy="21" r="1.5" fill="#7F8C8D"/>
                <circle cx="27" cy="21" r="3" fill="#2C3E50"/><circle cx="27" cy="21" r="1.5" fill="#7F8C8D"/>
                <rect x="32" y="13" width="4" height="4" rx="1" fill="#FFE066" opacity="0.9"/>
              </svg>

              <!-- Avatar + stickers on car -->
              <div style="position:absolute;top:-14px;left:8px;font-size:12px
                ;line-height:1">${s.avatar}${mods.stickers}</div>
            </div>

            <!-- Exhaust puffs animation if active today -->
            ${Object.keys(s.checkedToday||{}).length>0?`
            <div style="position:absolute;left:${Math.max(0,pos-8)}px;top:4px;
              font-size:8px;opacity:0.5;animation:exhaustPuff 1s ease-out infinite">💨</div>`:''}
          </div>
        </div>`;
      }).join('')}
    </div>

    <!-- LEGEND -->
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;justify-content:center">
      <div style="font-size:9px;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:3px">
        <div style="width:8px;height:8px;background:repeating-linear-gradient(180deg,white 0,white 2px,black 2px,black 4px);border-radius:1px"></div>
        Garis Finish
      </div>
      <div style="font-size:9px;color:rgba(255,255,255,0.4)">⚡ = Nitro (streak 3+ hari)</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.4)">🔥 = Turbo Boost aktif</div>
    </div>
  </div>`;
}


function renderAdmin(){
  document.getElementById('stu-count').textContent=STORE.students.length;
  const cf=document.getElementById('class-filter');
  cf.innerHTML=`<div class="cls-chip ${adminFilter==='all'?'active':''}" onclick="setFilter('all')">Semua</div>`;
  CLASSES.forEach(c=>{cf.innerHTML+=`<div class="cls-chip ${adminFilter===c?'active':''}" onclick="setFilter('${c}')">${c.split(' ')[0]}</div>`});
  const list=document.getElementById('admin-list');
  const fil=adminFilter==='all'?STORE.students:STORE.students.filter(s=>s.kelas===adminFilter);
  list.innerHTML='';
  if(!fil.length){list.innerHTML='<div style="text-align:center;padding:12px;color:var(--muted);font-size:11px">Tidak ada siswa.</div>';return}
  fil.forEach(s=>{
    const done=Object.keys(s.checkedToday||{}).length;
    const div=document.createElement('div');
    div.className='student-row';
    div.innerHTML=`<div class="sr-av" style="background:#F0F0F0">${s.avatar}</div>
      <div class="sr-info"><div class="sr-name">${s.name}</div><div class="sr-sub">Kelas ${s.kelas} · Panggilan: ${s.nickname||'-'} · Usia: ${s.age||'-'} thn · ${done}/7 hari ini</div></div>
      <div style="text-align:right;flex-shrink:0"><div class="sr-pin">PIN: ${s.pin}</div></div>
      <button class="btn-del" onclick="delStudent('${s.id}')">🗑️</button>`;
    list.appendChild(div);
  });
}

function setFilter(f){adminFilter=f;renderAdmin()}

function autoFillNickname(){
  const nameEl = document.getElementById('add-name');
  const nickEl = document.getElementById('add-nickname');
  const pinEl = document.getElementById('pin-preview');
  if(!nameEl||!nickEl) return;
  const name = nameEl.value.trim();
  if(name && !nickEl.value){
    // Auto-fill with first name
    nickEl.placeholder = name.split(' ')[0] + ' (auto)';
  }
  if(pinEl) pinEl.style.display = name ? 'block' : 'none';
}

function toggleBulkMode(){
  const single = document.getElementById('single-add-mode');
  const bulk = document.getElementById('bulk-add-mode');
  const btn = document.getElementById('bulk-toggle-btn');
  if(!single||!bulk) return;
  const isBulk = bulk.style.display !== 'none';
  single.style.display = isBulk ? 'block' : 'none';
  bulk.style.display = isBulk ? 'none' : 'block';
  if(btn) btn.textContent = isBulk ? '📋 Import Massal' : '👤 Tambah Satu';
}

const AVATARS = ['🦁','🌙','⚡','🌟','🏆','🦋','🐯','🌸','🦅','🌿','🦊','🐬'];

function bulkAddStudents(){
  const text = document.getElementById('bulk-text');
  const defClass = document.getElementById('bulk-default-class');
  if(!text||!defClass) return;
  const lines = text.value.trim().split('\n').filter(l=>l.trim());
  if(!lines.length){ showToast('⚠️ Tulis nama siswa dulu!'); return; }
  let added = 0;
  lines.forEach((line, i) => {
    const parts = line.split(',').map(p=>p.trim());
    const name = parts[0]; if(!name) return;
    const kelas = parts[1] || defClass.value;
    const age = parseInt(parts[2]) || 0;
    const nickname = name.split(' ')[0];
    const avatar = AVATARS[i % AVATARS.length];
    const ns = {
      id:'s'+STORE.nextId++, name, nickname, age, kelas, avatar,
      pin:genPin(), koin:0, xp:0, level:1, streak:0,
      lastActive:null, checkedToday:{}, totalDays:0,
      cards:[], quizCorrect:0, quizTotal:0
    };
    STORE.students.push(ns);
    added++;
  });
  saveStore();
  text.value = '';
  renderAdmin(); renderSchool();
  showToast('✅ '+added+' siswa berhasil ditambahkan!');
  toggleBulkMode();
}

function addStudent(){
  const name=document.getElementById('add-name').value.trim();
  const kelas=document.getElementById('add-class').value;
  const avatar=document.getElementById('add-av').value;
  if(!name){showToast('⚠️ Masukkan nama siswa!');return}
  const nickname=document.getElementById('add-nickname').value.trim()||name.split(' ')[0];
  const age=parseInt(document.getElementById('add-age').value)||0;
  const sPin=genPin(); const pPin=genPin();
  const ns={id:'s'+STORE.nextId++,name,nickname:nickname||name.split(' ')[0],age,kelas,avatar,pin:sPin,parentPin:pPin,koin:0,xp:0,level:1,streak:0,lastActive:null,checkedToday:{},verifiedToday:{},totalDays:0,cards:[],quizCorrect:0,quizTotal:0};
  STORE.students.push(ns);
  saveStore();
  document.getElementById('add-name').value='';
  renderAdmin();renderSchool();
  showToast('✅ '+name+' ditambahkan! PIN Siswa: '+sPin+' | PIN Ortu: '+pPin);
  // Show PIN prominently
  const pp = document.getElementById('pin-preview');
  if(pp){ pp.style.display='block'; pp.innerHTML='🔑 PIN Siswa: <strong style="font-size:15px;letter-spacing:3px">'+sPin+'</strong><br>👨‍👩‍👧 PIN Ortu: <strong style="font-size:15px;letter-spacing:3px">'+pPin+'</strong><br><span style="font-size:10px">Catat & berikan ke siswa dan orang tua!</span>'; pp.style.background='#EAF9F0'; pp.style.color='#1E8449'; }
  document.getElementById('add-name').value='';
  document.getElementById('add-nickname').value='';
}

function delStudent(id){
  const s=STORE.students.find(x=>x.id===id);
  if(!s)return; if(!window.confirm('Hapus '+s.name+' dari daftar?'))return;
  STORE.students=STORE.students.filter(x=>x.id!==id);
  saveStore();renderAdmin();renderSchool();
  showToast('🗑️ '+s.name+' dihapus.');
}

function doResetAll(){
  if(!window.confirm('Reset semua data siswa ke nol? Nama dan PIN tetap ada.'))return;
  STORE.students=STORE.students.map(s=>({...s,koin:0,xp:0,level:1,streak:0,lastActive:null,checkedToday:{},totalDays:0,cards:[],quizCorrect:0,quizTotal:0}));
  saveStore();renderAdmin();renderSchool();
  showToast('🔄 Semua data direset.');
}

// ═══════════════════ CHECK-IN FLOW ═══════════════════
function openCheckIn(hb){
  habitToCheck = hb;
  const u = CU;
  const nickname = u.nickname || u.name.split(' ')[0];
  const cfg = HABIT_CARDS[hb.id] || {};

  // Header gradient & scene
  const header = document.getElementById('mc-header');
  header.style.background = cfg.grad || 'linear-gradient(135deg,#27AE60,#2ECC71)';
  header.style.minHeight = '210px';

  // Animasi scene
  document.getElementById('mc-anim-bg').innerHTML = cfg.scene || `<div style="font-size:64px">${hb.icon}</div>`;

  // Main icon (hidden — scene sudah include)
  document.getElementById('mc-main-icon').style.display = 'none';

  // Nama kebiasaan
  document.getElementById('mc-habit-name').textContent = hb.name;

  // Rarity badge
  const rb = document.getElementById('mc-rarity');
  rb.textContent = cfg.rarity || '🌟 Misi Harian';
  rb.style.background = (cfg.rarityBg||'#27AE60') + '22';
  rb.style.color = cfg.rarityBg || '#27AE60';
  rb.style.border = '1.5px solid ' + (cfg.rarityBg||'#27AE60') + '55';

  // Pertanyaan personal
  const questions = {
    pagi:    `Apakah ${nickname} sudah bangun sebelum jam 5.30 pagi hari ini?`,
    ibadah:  `Apakah ${nickname} sudah sholat 5 waktu dan tilawah Al-Quran hari ini?`,
    olahraga:`Apakah ${nickname} sudah berolahraga minimal 15 menit hari ini?`,
    makan:   `Apakah ${nickname} sudah makan sayur atau buah hari ini?`,
    belajar: `Apakah ${nickname} sudah belajar minimal 30 menit hari ini?`,
    sosial:  `Apakah ${nickname} sudah melakukan satu kebaikan untuk orang lain hari ini?`,
    tidur:   `Apakah ${nickname} siap tidur sebelum jam 9 malam malam ini?`,
  };
  document.getElementById('mc-question').textContent = questions[hb.id] || `Apakah ${nickname} sudah menyelesaikan ${hb.name} hari ini?`;

  // Sub keterangan
  const subs = {
    pagi:    'Bangun pagi adalah kunci hari yang penuh berkah dan produktif.',
    ibadah:  'Sholat adalah tiang agama. Tilawah menerangi hati.',
    olahraga:'Tubuh yang kuat adalah amanah dari Allah ﷻ.',
    makan:   'Makanan sehat memberi energi untuk beribadah dan belajar.',
    belajar: '"Menuntut ilmu adalah kewajiban bagi setiap Muslim." — HR. Ibnu Majah',
    sosial:  '"Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain."',
    tidur:   'Istirahat yang cukup membuat besok lebih semangat dan fokus.',
  };
  document.getElementById('mc-sub').textContent = subs[hb.id] || '';

  // Rewards
    document.getElementById('mc-rewards').innerHTML =
    '<span style="background:#FEF9E7;color:#856404;border-radius:20px;padding:4px 10px;font-size:11px;font-weight:800;font-family:var(--font-round)">⭐ +' + hb.koin + ' Koin</span> ' +
    '<span style="background:#EEF;color:#5533CC;border-radius:20px;padding:4px 10px;font-size:11px;font-weight:800;font-family:var(--font-round)">✨ +' + hb.xp + ' XP</span> ' +
    (hb.needVerify ? '<span style="background:#FFF3CD;color:#856404;border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;font-family:var(--font-round)">📋 Verifikasi ortu</span>' : '');

  // Yes button color
  const yesBtn = document.getElementById('mc-yes-btn');
  yesBtn.style.background = cfg.yesBtn || 'linear-gradient(135deg,#27AE60,#2ECC71)';

  // Show overlay
  const ov = document.getElementById('overlay-mission');
  ov.style.display = 'flex';
  // Re-trigger card animation
  const card = document.getElementById('mission-card');
  card.style.animation = 'none';
  card.offsetHeight; // reflow
  card.style.animation = 'cardEntrance 0.45s cubic-bezier(0.34,1.56,0.64,1)';
}

function missionYes(){
  // Particle burst
  spawnParticles();
  // Close overlay after brief delay
  setTimeout(()=>{
    document.getElementById('overlay-mission').style.display='none';
    doCheckIn(habitToCheck);
    // Auto-navigate to Dunia to see car move
    setTimeout(()=>switchPage('dunia'), 400);
  }, 350);
}

function missionNo(){
  document.getElementById('overlay-mission').style.display='none';
  habitToCheck = null;
}

function spawnParticles(){
  const container = document.getElementById('mc-particles');
  const emojis = ['⭐','✨','🌟','💫','⚡','🎉','🌈'];
  for(let i=0;i<18;i++){
    const el = document.createElement('div');
    const tx = (Math.random()-0.5)*300;
    const ty = -(Math.random()*250+80);
    el.style.cssText = `position:absolute;font-size:${14+Math.random()*14}px;
      left:${30+Math.random()*40}%;top:50%;
      --tx:${tx}px;--ty:${ty}px;
      animation:particlePop ${0.5+Math.random()*0.4}s ease-out forwards;
      animation-delay:${Math.random()*0.15}s;pointer-events:none`;
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    container.appendChild(el);
  }
  setTimeout(()=>container.innerHTML='', 900);
}

function doCheckIn(hb){
  const u=CU;
  if(!u.checkedToday)u.checkedToday={};
  u.checkedToday[hb.id]=true;
  u.koin+=hb.koin;
  u.xp+=hb.xp;
  sessionEarnedKoin+=hb.koin;
  const xpMax=u.level*100;
  if(u.xp>=xpMax){u.xp-=xpMax;u.level++;showToast('🎊 Level Up! Sekarang Level '+u.level+'!');}
  const today=todayStr();
  if(u.lastActive!==today){
    u.streak=(u.lastActive&&Math.round((new Date(today)-new Date(u.lastActive))/86400000)===1)?u.streak+1:1;
    u.lastActive=today;
    u.totalDays=(u.totalDays||0)+1;
  }
  // Cek bangunan baru sebelum dan sesudah
  const prevUnlocked=BUILDINGS.filter(b=>b.minKoin>0&&(u.koin-hb.koin)<b.minKoin&&u.koin>=b.minKoin);
  saveCU();
  renderHabits();updateStats();renderMentor();renderWorld();renderBadgesGrid();renderCardsGrid();renderOrtu();
  showToast(hb.icon+' '+hb.name+' selesai! +'+hb.koin+' Koin!');

  const done=Object.keys(u.checkedToday).length;
  if(prevUnlocked.length>0){
    // Ada bangunan baru terbuka!
    setTimeout(()=>showBuildingUnlock(prevUnlocked[prevUnlocked.length-1], done===7),900);
  } else if(done===7){
    setTimeout(()=>showCelebration(),800);
  }
}

function saveCU(){
  if(!CU||CRole!=='anak')return;
  const i=STORE.students.findIndex(s=>s.id===CU.id);
  if(i>=0)STORE.students[i]=CU;
  saveStore();
}

// ═══════════════════ CELEBRATION ═══════════════════
// Track apakah setelah building unlock perlu ke celebration
let _afterBuildingGoToCelebration = false;

function showBuildingUnlock(building, thenCelebrate){
  _afterBuildingGoToCelebration = thenCelebrate;
  const u = CU;
  // Stars berdasarkan bangunan ke berapa
  const idx = BUILDINGS.indexOf(building);
  const stars = idx >= 8 ? '⭐⭐⭐⭐⭐' : idx >= 5 ? '⭐⭐⭐⭐' : '⭐⭐⭐';
  document.getElementById('bu-stars').textContent = stars;
  document.getElementById('bu-icon').textContent = building.icon;
  document.getElementById('bu-name').textContent = building.name;
  document.getElementById('bu-desc').textContent = building.desc;
  document.getElementById('bu-hadis').textContent = building.hadis;
  document.getElementById('bu-total-koin').textContent = u.koin + ' Koin';
  document.getElementById('bu-confetti').textContent = building.confetti || '🌟✨🎊🏆🎉✨🌟';
  const btn = document.getElementById('bu-next-btn');
  btn.textContent = thenCelebrate ? 'Ambil Hadiahmu! 🎉' : 'Kembali ke Desaku →';
  openOverlay('building');
}

function afterBuildingUnlock(){
  closeOverlay('building');
  if(_afterBuildingGoToCelebration){
    setTimeout(()=>showCelebration(), 300);
  } else {
    switchPage('dunia');
  }
}

function showCelebration(){
  const u=CU;
  const unlocked=BUILDINGS.filter(b=>u.koin>=b.minKoin);
  const newest=unlocked[unlocked.length-1]||BUILDINGS[0];
  document.getElementById('cel-emoji').textContent='🎉';
  document.getElementById('cel-title').textContent='MasyaAllah '+(u.nickname||u.name.split(' ')[0])+'!';
  document.getElementById('cel-building').textContent=newest.icon;
  document.getElementById('cel-building-name').textContent='Kamu membangun '+newest.name+'!';
  document.getElementById('cel-sub').textContent='Kamu menyelesaikan semua 7 kebiasaan hari ini!\n+100 Koin Bonus!';
  u.koin+=100; saveCU(); updateStats();
  openOverlay('celebrate');
}

// ═══════════════════ CARD REVEAL ═══════════════════
function showCardReveal(){
  closeOverlay('celebrate');
  const u=CU;
  const owned=u.cards||[];
  // Pick an unlocked card not yet owned, or any available
  const avail=COLLECT_CARDS.filter(c=>u.koin>=c.koinReq&&!owned.includes(c.id));
  const card=avail.length>0?avail[Math.floor(Math.random()*avail.length)]:COLLECT_CARDS[Math.floor(Math.random()*COLLECT_CARDS.length)];
  const isNew=!owned.includes(card.id);
  if(isNew){u.cards=[...owned,card.id];saveCU();}

  const bc=document.getElementById('big-card');
  bc.style.background=card.grad;
  bc.innerHTML=`<span class="bc-rarity">${card.rarity}</span><span class="bc-icon">${card.icon}</span><div class="bc-name">${card.name}</div><div class="bc-quote">"${card.quote}"</div>`;
  document.getElementById('card-flavor').textContent=isNew?'✨ Kartu baru masuk koleksimu!':'Kartu ini sudah kamu miliki. Koleksimu makin lengkap!';
  renderCardsGrid();
  openOverlay('card');
}

function showBigCard(c){
  const bc=document.getElementById('big-card');
  bc.style.background=c.grad;
  bc.innerHTML=`<span class="bc-rarity">${c.rarity}</span><span class="bc-icon">${c.icon}</span><div class="bc-name">${c.name}</div><div class="bc-quote">"${c.quote}"</div>`;
  document.getElementById('card-flavor').textContent='Kartu ini ada di koleksimu!';
  document.getElementById('overlay-card').querySelector('.btn-next').textContent='Tutup';
  document.getElementById('overlay-card').querySelector('.btn-next').onclick=()=>closeOverlay('card');
  openOverlay('card');
}

// ═══════════════════ QUIZ ═══════════════════
let currentQuiz=null;
function showQuiz(){
  closeOverlay('card');
  const u=CU;
  currentQuiz=QUIZZES[Math.floor(Math.random()*QUIZZES.length)];
  quizAnswered=false;
  document.getElementById('quiz-q').textContent=currentQuiz.q;
  document.getElementById('quiz-sub-text').textContent=currentQuiz.sub;
  document.getElementById('quiz-result').textContent='';
  document.getElementById('quiz-result-sub').textContent='';
  document.getElementById('quiz-reward').textContent='';
  document.getElementById('quiz-next-btn').style.display='none';
  const opts=document.getElementById('quiz-opts');
  opts.innerHTML='';
  currentQuiz.opts.forEach((opt,i)=>{
    const btn=document.createElement('button');
    btn.className='quiz-opt';
    btn.textContent=opt;
    btn.onclick=()=>answerQuiz(i,btn);
    opts.appendChild(btn);
  });
  openOverlay('quiz');
}

function answerQuiz(idx,btn){
  if(quizAnswered)return;
  quizAnswered=true;
  const correct=idx===currentQuiz.ans;
  const allBtns=document.querySelectorAll('.quiz-opt');
  allBtns[currentQuiz.ans].classList.add('correct');
  if(!correct)btn.classList.add('wrong');
  const resultEl=document.getElementById('quiz-result');
  const subEl=document.getElementById('quiz-result-sub');
  const rewEl=document.getElementById('quiz-reward');
  if(correct){
    resultEl.textContent='🎉 Benar! MasyaAllah!';
    subEl.textContent='Kamu memilih jawaban yang tepat!';
    rewEl.textContent='⭐ +'+currentQuiz.bonus+' Koin Bonus!';
    CU.koin+=currentQuiz.bonus;
    CU.quizCorrect=(CU.quizCorrect||0)+1;
    saveCU();updateStats();
  }else{
    resultEl.textContent='😊 Hampir benar!';
    subEl.textContent='Jawaban yang benar: '+currentQuiz.opts[currentQuiz.ans];
    rewEl.textContent='Coba lagi besok — kamu pasti bisa!';
  }
  CU.quizTotal=(CU.quizTotal||0)+1;
  saveCU();
  setTimeout(()=>{document.getElementById('quiz-next-btn').style.display='block';},600);
}

function finishSession(){
  closeOverlay('quiz');
  showToast('🏆 Sesi hari ini selesai! Sampai besok ya!');
  renderWorld();renderBadgesGrid();renderCardsGrid();
}

// ═══════════════════ OVERLAY UTILS ═══════════════════
function openOverlay(id){document.getElementById('overlay-'+id).classList.add('open')}
function closeOverlay(id){document.getElementById('overlay-'+id).classList.remove('open')}

// ═══════════════════ NAV ═══════════════════
function switchPage(page){
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));
  const pg=document.getElementById('page-'+page);
  if(pg)pg.classList.add('active');
  document.getElementById('main-content').scrollTop=0;
  renderNav(page);
  if(page==='sekolah'){renderSchool();setTimeout(()=>renderRekap(),100);}
  if(page==='admin')renderAdmin();
  if(page==='ortu')renderOrtu();
  if(page==='beranda'&&CRole==='ortu')renderOrtu();
  if(page==='dunia'){renderCardsGrid();renderWorld();}
  if(page==='garasi')renderGarasi();
  if(page==='race')setTimeout(()=>renderRaceTrack(),50);
  if(page==='psikologi')setTimeout(()=>initPsikologi(),50);
  if(page==='tentang'){}
}

// ═══════════════════ TOAST ═══════════════════
function goToLogin(){
  document.getElementById('screen-welcome').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
  setTimeout(()=>document.getElementById('p0').focus(), 300);
}

// ══════════════════════════════════════
// RACE TRACK (Student View)
// ══════════════════════════════════════
function renderRaceTrack(){
  const con = document.getElementById('race-display');
  const myPos = document.getElementById('race-my-pos');
  if(!con) return;

  const ss = STORE.students;
  if(!ss.length){
    con.innerHTML='<div style="background:#1A1A2E;border-radius:14px;padding:24px;text-align:center;color:white"><div style="font-size:36px;margin-bottom:8px">🏁</div><div style="font-family:var(--font-round);font-size:14px;font-weight:800;margin-bottom:6px">Sirkuit Masih Kosong</div><div style="font-size:12px;color:rgba(255,255,255,0.6)">Belum ada siswa terdaftar.<br>Tambahkan siswa di menu Admin.</div></div>';
    return;
  }
  // If all koin=0, give slight visual spread for demo using index
  const allZero = ss.every(s=>s.koin===0);

  const sorted = [...ss].sort((a,b)=>b.koin-a.koin||b.streak-a.streak);
  const maxKoin = Math.max(sorted[0].koin, 1);
  // Demo spread: if all at zero, spread by index so cars are visible
  const demoSpread = allZero;
  const myStudent = CU && CRole==='anak' ? sorted.find(s=>s.id===CU.id) : null;
  const myRank = myStudent ? sorted.indexOf(myStudent)+1 : 0;

  // Car colors from garage
  const defaultColors={'🦁':'#F39C12','🌙':'#9B59B6','⚡':'#E74C3C','🌟':'#F1C40F',
    '🏆':'#27AE60','🦋':'#E91E8C','🐯':'#E67E22','🌸':'#FF69B4',
    '🦅':'#2980B9','🌿':'#1ABC9C','🦊':'#D35400','🐬':'#16A085'};
  const colorMap={'default':'#F39C12','green':'#27AE60','white':'#BDC3C7',
    'blue':'#2980B9','gold':'#F1C40F','purple':'#8E44AD','red':'#E74C3C','teal':'#1ABC9C'};

  function getCarColor(s){
    const g=s.garage;
    if(g&&g.colorId&&g.colorId!=='default') return colorMap[g.colorId]||defaultColors[s.avatar]||'#888';
    return defaultColors[s.avatar]||'#888';
  }
  function getMods(s){
    const g=s.garage||{};
    return {
      hasNitro:(g.upgrades||[]).includes('nitro')&&s.streak>=3,
      hasSpoiler:(g.upgrades||[]).includes('spoiler'),
      stickers:(g.stickers||[]).map(sid=>{const st=STICKERS.find(x=>x.id===sid);return st?st.icon:'';}).filter(Boolean).slice(0,1).join('')
    };
  }

  // Track dimensions
  const TW=360, LANE_H=44, GAP=8;
  const TRACK_W=280, START_X=36, FINISH_X=START_X+TRACK_W;
  const totalH = sorted.length*(LANE_H+GAP)+60;

  // Bus sekolah progress
  const classTotal = ss.reduce((a,s)=>a+Object.keys(s.checkedToday||{}).length,0);
  const classAvg = ss.length?Math.round(classTotal/(ss.length*7)*100):0;
  const busX = START_X + Math.round(classAvg/100*TRACK_W);

  const lanes = sorted.map((s,i)=>{
    const isMe = myStudent && s.id===myStudent.id;
    const rawProgress = demoSpread
      ? (i / Math.max(sorted.length-1, 1)) * 0.3  // demo: spread 0-30% of track
      : (s.koin/maxKoin) * 0.92;
    const carX = START_X + Math.round(rawProgress * TRACK_W);
    const y = 50 + i*(LANE_H+GAP);
    const cc = getCarColor(s);
    const mods = getMods(s);
    const rank = i+1;
    const tier = getTier(s.koin);
    const nickname = s.nickname||s.name.split(' ')[0];
    const laneAlpha = isMe?'0.18':'0.08';
    const done = Object.keys(s.checkedToday||{}).length;

    return `
    <!-- Lane ${rank}: ${nickname} -->
    <g>
      <!-- Lane background -->
      <rect x="${START_X-4}" y="${y}" width="${TRACK_W+8}" height="${LANE_H}" rx="6"
        fill="${isMe?'rgba(46,204,113,'+laneAlpha+')':'rgba(255,255,255,'+laneAlpha+')'}"
        stroke="${isMe?'rgba(46,204,113,0.4)':'rgba(255,255,255,0.08)'}" stroke-width="1"/>

      <!-- Lane stripes -->
      <rect x="${START_X}" y="${y}" width="${TRACK_W}" height="${LANE_H}"
        fill="url(#laneStripe)" opacity="0.15"/>

      <!-- Rank badge -->
      <rect x="2" y="${y+10}" width="28" height="22" rx="4"
        fill="${rank===1?'#F1C40F':rank===2?'#BDC3C7':rank===3?'#CD7F32':'rgba(255,255,255,0.1)'}"/>
      <text x="16" y="${y+25}" text-anchor="middle" font-family="Arial,sans-serif"
        font-size="${rank<=3?'11':'10'}" font-weight="900"
        fill="${rank<=3?'#1A1A2E':'rgba(255,255,255,0.6)'}">
        ${rank<=3?['🥇','🥈','🥉'][rank-1]:rank}
      </text>

      <!-- Name label -->
      <text x="34" y="${y+16}" font-family="Arial,sans-serif" font-size="9"
        font-weight="${isMe?'900':'700'}"
        fill="${isMe?'#52D98A':'rgba(255,255,255,0.7)'}">${nickname}${isMe?' ◀':''}</text>
      <text x="34" y="${y+28}" font-family="Arial,sans-serif" font-size="8"
        fill="rgba(255,255,255,0.4)">${tier.icon} ${s.koin} koin</text>

      <!-- Exhaust smoke if active -->
      ${done>0?`<circle cx="${carX-14}" cy="${y+LANE_H/2}" r="4"
        fill="rgba(200,200,200,0.2)">
        <animate attributeName="r" values="3;7;3" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite"/>
      </circle>`:''}

      <!-- Nitro flames -->
      ${mods.hasNitro?`
      <text x="${carX-20}" y="${y+LANE_H/2+5}" font-size="10"
        style="animation:nitroFlame 0.4s infinite">🔥</text>`:''}

      <!-- CAR SVG -->
      <g transform="translate(${carX},${y+LANE_H/2-10})">
        <!-- Shadow -->
        <ellipse cx="0" cy="19" rx="16" ry="5" fill="rgba(0,0,0,0.3)"/>
        <!-- Body -->
        <rect x="-15" y="4" width="30" height="13" rx="5" fill="${cc}"/>
        <!-- Roof -->
        <rect x="-10" y="-4" width="20" height="11" rx="4" fill="${cc}" opacity="0.88"/>
        <!-- Windscreen -->
        <rect x="-8" y="-3" width="16" height="9" rx="2.5" fill="rgba(200,235,255,0.9)"/>
        <!-- Spoiler -->
        ${mods.hasSpoiler?`<rect x="-13" y="-8" width="26" height="4" rx="2" fill="${cc}" opacity="0.8"/>`:''}
        <!-- Wheels -->
        <circle cx="-9" cy="18" r="4.5" fill="#2C3E50"/>
        <circle cx="-9" cy="18" r="2" fill="#636E72"/>
        <circle cx="9" cy="18" r="4.5" fill="#2C3E50"/>
        <circle cx="9" cy="18" r="2" fill="#636E72"/>
        <!-- Headlights -->
        <rect x="13" y="6" width="4" height="5" rx="1.5" fill="#FFE066" opacity="0.9"/>
        <!-- Avatar -->
        <text x="0" y="3" text-anchor="middle" font-size="10">${s.avatar}${mods.stickers}</text>
      </g>

      <!-- Progress dots -->
      <text x="${FINISH_X+6}" y="${y+LANE_H/2+4}" font-size="9"
        fill="rgba(255,255,255,0.5)">${done}/7</text>
    </g>`;
  }).join('');

  con.innerHTML = `
  <!-- DEMO NOTICE when all zero -->
  ${demoSpread ? '<div style="background:#FFF8E7;border-radius:10px;padding:8px 12px;margin-bottom:8px;font-size:11px;color:#856404;text-align:center;border:1px solid #F9CA24">⚡ Posisi awal — Selesaikan misi harian untuk mobilmu bergerak maju!</div>' : ''}
  <!-- RACE TRACK SVG -->
  <div style="border-radius:16px;overflow:hidden;margin-bottom:10px;
    box-shadow:0 6px 24px rgba(0,0,0,0.3)">
  <svg viewBox="0 0 ${TW} ${totalH+20}" style="width:100%;display:block;
    background:linear-gradient(180deg,#0D0D1A 0%,#1A1A2E 100%)"
    xmlns="http://www.w3.org/2000/svg">

    <defs>
      <pattern id="laneStripe" patternUnits="userSpaceOnUse" width="20" height="20">
        <line x1="0" y1="20" x2="20" y2="0" stroke="white" stroke-width="0.5"/>
      </pattern>
    </defs>

    <!-- Title -->
    <text x="${TW/2}" y="22" text-anchor="middle" font-family="Arial,sans-serif"
      font-size="13" font-weight="900" fill="#FFE066">🏁 GRAND PRIX KEBIASAAN 🏁</text>
    <text x="${TW/2}" y="36" text-anchor="middle" font-family="Arial,sans-serif"
      font-size="9" fill="rgba(255,255,255,0.4)">Posisi berdasarkan total koin</text>

    <!-- Finish line -->
    <rect x="${FINISH_X}" y="44" width="8" height="${totalH-44}"
      fill="url(#finishStripe)"/>
    <defs>
      <pattern id="finishStripe" patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="4" height="4" fill="white"/>
        <rect x="4" y="4" width="4" height="4" fill="white"/>
        <rect x="4" width="4" height="4" fill="#1A1A2E"/>
        <rect y="4" width="4" height="4" fill="#1A1A2E"/>
      </pattern>
    </defs>
    <text x="${FINISH_X+4}" y="42" text-anchor="middle" font-size="8"
      fill="rgba(255,255,255,0.5)">FINISH</text>

    <!-- Start line -->
    <line x1="${START_X}" y1="44" x2="${START_X}" y2="${totalH}"
      stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="4,4"/>
    <text x="${START_X}" y="42" text-anchor="middle" font-size="8"
      fill="rgba(255,255,255,0.4)">START</text>

    <!-- ALL LANES -->
    ${lanes}

    <!-- BUS SEKOLAH (Class co-op) -->
    <g transform="translate(${busX},${totalH-20})">
      <rect x="-20" y="-12" width="40" height="16" rx="4"
        fill="rgba(243,156,18,0.2)" stroke="#F39C12" stroke-width="1"/>
      <text x="0" y="1" text-anchor="middle" font-size="14">🚌</text>
      <text x="0" y="-14" text-anchor="middle" font-family="Arial,sans-serif"
        font-size="8" fill="#F39C12">Kelas ${classAvg}%</text>
    </g>

  </svg>
  </div>

  <!-- Legend -->
  <div style="background:#fff;border-radius:12px;padding:10px 12px;
    display:flex;flex-wrap:wrap;gap:8px;font-size:10px;color:var(--muted);
    margin-bottom:10px;border:1px solid var(--border)">
    <span>⭐ = Total Koin</span>
    <span>🔥 = Nitro (streak 3+)</span>
    <span>🚌 = Bus Kelas (rata-rata)</span>
    <span>◀ = Posisi Kamu</span>
  </div>`;

  // My position card
  if(myStudent && myPos){
    const tier = getTier(myStudent.koin);
    const done = Object.keys(myStudent.checkedToday||{}).length;
    myPos.style.display='block';
    myPos.innerHTML=`
    <div style="background:linear-gradient(135deg,var(--green-dark),var(--green));
      border-radius:14px;padding:14px;color:#fff">
      <div style="font-family:var(--font-round);font-size:13px;font-weight:900;
        margin-bottom:8px">🏁 Posisiku Hari Ini</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px;text-align:center">
          <div style="font-family:var(--font-round);font-size:20px;font-weight:900">#${myRank}</div>
          <div style="font-size:9px;opacity:0.8">dari ${sorted.length} siswa</div>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px;text-align:center">
          <div style="font-family:var(--font-round);font-size:20px;font-weight:900">${myStudent.koin}</div>
          <div style="font-size:9px;opacity:0.8">⭐ Koin</div>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px;text-align:center">
          <div style="font-family:var(--font-round);font-size:20px;font-weight:900">${done}/7</div>
          <div style="font-size:9px;opacity:0.8">✅ Hari ini</div>
        </div>
      </div>
      ${myRank===1?'<div style="margin-top:8px;font-size:11px;text-align:center">🥇 Kamu memimpin! Pertahankan terus!</div>':
        myRank<=3?'<div style="margin-top:8px;font-size:11px;text-align:center">🏆 Top 3! Sedikit lagi menuju puncak!</div>':
        '<div style="margin-top:8px;font-size:11px;text-align:center">💪 Setiap kebiasaan membawamu maju. Terus semangat!</div>'}
    </div>`;
  }

  // Update subtitle
  const sub = document.getElementById('race-subtitle');
  if(sub) sub.textContent = sorted.length+' pembalap · '+classAvg+'% konsistensi kelas hari ini';
}

// ══════════════════════════════════════
// PSYCHOLOGICAL PROFILE
// ══════════════════════════════════════

// Archetype definitions based on habit patterns
function getArchetype(student){
  const h = student.checkedToday || {};
  const scores = {
    pagi:    h.pagi    ? 1 : 0,
    ibadah:  h.ibadah  ? 1 : 0,
    olahraga:h.olahraga? 1 : 0,
    makan:   h.makan   ? 1 : 0,
    belajar: h.belajar ? 1 : 0,
    sosial:  h.sosial  ? 1 : 0,
    tidur:   h.tidur   ? 1 : 0,
  };
  const total = Object.values(scores).reduce((a,b)=>a+b,0);
  // Add historical weight from koin
  const koinWeight = Math.min(student.koin / 200, 1);
  const streakWeight = Math.min(student.streak / 14, 1);

  if(total < 2 && student.koin < 50) return 'penjelajah';
  // Determine dominant pattern
  const spiritual = scores.ibadah;
  const physical  = scores.olahraga + scores.pagi + scores.tidur;
  const mental    = scores.belajar;
  const social    = scores.sosial;
  if(total >= 6 || (koinWeight > 0.8 && streakWeight > 0.7)) return 'pemimpin';
  if(spiritual >= 1 && social >= 1 && total >= 4) return 'sufi';
  if(physical >= 3) return 'pejuang';
  if(mental >= 1 && scores.pagi >= 1 && total >= 3) return 'cendekia';
  if(social >= 1 && total >= 3) return 'sosial';
  if(spiritual >= 1 && total >= 2) return 'sufi';
  return 'penjelajah';
}

function getPsychProfile(student){
  const h = student.checkedToday || {};
  const koin = student.koin || 0;
  const streak = student.streak || 0;
  const done = Object.keys(h).length;
  const archKey = getArchetype(student);
  const arch = ARCHETYPES[archKey];
  const nick = student.nickname || student.name.split(' ')[0];

  // Strength and growth areas
  const HABIT_LABELS = {
    pagi:'Bangun Pagi 🌅', ibadah:'Beribadah 🙏',
    olahraga:'Olahraga ⚽', makan:'Makan Sehat 🥗',
    belajar:'Belajar 📚', sosial:'Bermasyarakat 🤝', tidur:'Tidur Cepat 😴'
  };
  const strengths = HABITS.filter(hb=>h[hb.id]).map(hb=>hb.name);
  const growths   = HABITS.filter(hb=>!h[hb.id]).map(hb=>hb.name);

  // Psychological insight based on gaps
  let psyInsight = '';
  if(!h.tidur && !h.pagi){
    psyInsight = nick+' menunjukkan pola ritme sirkadian yang belum teratur. Tidur dan bangun tepat waktu adalah fondasi semua kebiasaan lain — tanpa ini, kebiasaan lain akan sulit konsisten.';
  } else if(!h.ibadah){
    psyInsight = 'Kebiasaan ibadah adalah anchor internal yang menguatkan semua kebiasaan lain. Mendorong '+nick+' dengan cara yang menyenangkan — bukan tekanan — akan lebih efektif.';
  } else if(!h.sosial && !h.makan){
    psyInsight = nick+' cenderung fokus pada diri sendiri (disiplin personal bagus) namun perlu dorongan untuk lebih terbuka ke lingkungan sosial dan memperhatikan kesehatan fisiknya.';
  } else if(!h.belajar){
    psyInsight = 'Potensi akademik '+nick+' mungkin belum tersalurkan optimal. Coba identifikasi apakah ada hambatan belajar (suasana, metode, atau minat) yang perlu disesuaikan.';
  } else if(done >= 6){
    psyInsight = nick+' menunjukkan karakter yang sangat seimbang. Pada tahap ini, tantangan yang lebih besar (seperti menjadi mentor teman) akan membantu perkembangannya.';
  } else {
    psyInsight = 'Konsistensi '+nick+' dalam beberapa kebiasaan menunjukkan karakter yang sedang terbentuk dengan baik. Fokus pada satu kebiasaan yang belum konsisten per minggu.';
  }

  // Risk indicator
  let riskLevel = '', riskText = '', riskColor = '';
  if(koin < 10 && streak === 0){
    riskLevel='Perlu Perhatian'; riskColor='#E74C3C';
    riskText='Anak belum aktif sama sekali. Cek apakah ada hambatan teknis, motivasi, atau situasi keluarga yang perlu diperhatikan.';
  } else if(streak >= 7){
    riskLevel='Sangat Baik'; riskColor='#27AE60';
    riskText='Konsistensi '+streak+' hari menunjukkan kebiasaan sudah mulai terbentuk menjadi karakter. Rayakan bersama!';
  } else if(done < 3){
    riskLevel='Perlu Dorongan'; riskColor='#F39C12';
    riskText='Hari ini kurang dari 3 kebiasaan. Cek apakah ada faktor eksternal (sakit, ujian, masalah teman) yang mempengaruhi.';
  } else {
    riskLevel='Berkembang Baik'; riskColor='#2980B9';
    riskText='Perkembangan normal dan positif. Terus berikan dukungan dan apresiasi.';
  }

  return {arch, archKey, strengths, growths, psyInsight, riskLevel, riskText, riskColor, nick, done, koin, streak};
}

function initPsikologi(){
  const isStudent = CRole === 'anak';
  const selector = document.getElementById('psiko-selector');
  const select = document.getElementById('psiko-student-select');

  if(CRole === 'ortu'){
    if(selector) selector.style.display = 'none';
    // Ortu sees their linked child (CU = student object from parentPin login)
    const linkedStudent = STORE.students.find(s=>s.id===CU.id) || CU;
    renderPsikologi(linkedStudent);
  } else if(CRole === 'anak'){
    if(selector) selector.style.display = 'none';
    const me = STORE.students.find(s=>s.id===CU.id) || CU;
    renderPsikologi(me);
  } else {
    // Guru/kepsek/admin: show student selector
    if(selector) selector.style.display = 'block';
    if(select){
      const opts = STORE.students.map(s=>`<option value="${s.id}">${s.nickname||s.name.split(' ')[0]} — ${s.kelas}</option>`).join('');
      select.innerHTML = '<option value="">-- Pilih Siswa --</option>' + opts;
      if(STORE.students.length > 0){
        select.value = STORE.students[0].id;
      }
    }
    if(STORE.students.length > 0){
      renderPsikologi();
    } else {
      const con = document.getElementById('psikologi-content');
      if(con) con.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">Belum ada siswa terdaftar.<br>Tambahkan siswa di menu Manajemen.</div>';
    }
  }
}

function renderPsikologi(studentOverride){
  const con = document.getElementById('psikologi-content');
  if(!con) return;

  let student = studentOverride;
  if(!student){
    const sel = document.getElementById('psiko-student-select');
    if(sel && sel.value){
      student = STORE.students.find(s=>s.id===sel.value);
    }
  }
  if(!student){
    con.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">Pilih siswa untuk melihat profil psikologisnya.</div>';
    return;
  }

  const p = getPsychProfile(student);

  con.innerHTML = `
  <!-- ARCHETYPE CARD -->
  <div style="background:${p.arch.bg};border-radius:16px;padding:16px;
    margin-bottom:10px;border:2px solid ${p.arch.color}40;text-align:center">
    <div style="font-size:48px;margin-bottom:8px">${p.arch.icon}</div>
    <div style="font-family:var(--font-round);font-size:18px;font-weight:900;
      color:${p.arch.color};margin-bottom:4px">${p.arch.name}</div>
    <div style="font-size:11px;color:#555;line-height:1.6;margin-bottom:10px">${p.arch.desc}</div>
    <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap">
      ${p.arch.traits.map(t=>`<span style="background:${p.arch.color}20;color:${p.arch.color};
        border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700">${t}</span>`).join('')}
    </div>
  </div>

  <!-- STATUS INDICATOR -->
  <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:10px;
    border-left:4px solid ${p.riskColor};box-shadow:0 2px 8px rgba(0,0,0,0.05)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
      <div style="width:10px;height:10px;border-radius:50%;background:${p.riskColor};flex-shrink:0"></div>
      <div style="font-family:var(--font-round);font-size:12px;font-weight:800;
        color:${p.riskColor}">${p.riskLevel}</div>
      <div style="display:flex;gap:8px;margin-left:auto;font-size:11px;color:var(--muted)">
        <span>🔥 ${p.streak} hari</span>
        <span>⭐ ${p.koin} koin</span>
        <span>✅ ${p.done}/7</span>
      </div>
    </div>
    <div style="font-size:11px;color:#555;line-height:1.6">${p.riskText}</div>
  </div>

  <!-- HABIT RADAR -->
  <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:10px;
    box-shadow:0 2px 8px rgba(0,0,0,0.05)">
    <div style="font-family:var(--font-round);font-size:12px;font-weight:800;
      margin-bottom:10px">📊 Peta Kekuatan Kebiasaan</div>
    ${HABITS.map(hb=>{
      const done = !!(student.checkedToday||{})[hb.id];
      const barColor = done ? '#27AE60' : '#E74C3C';
      const barW = done ? '100%' : '15%';
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="font-size:14px;width:20px;flex-shrink:0">${hb.icon}</div>
        <div style="font-size:11px;width:90px;flex-shrink:0;font-weight:600">${hb.name}</div>
        <div style="flex:1;height:10px;background:#F5F5F5;border-radius:5px;overflow:hidden">
          <div style="height:100%;width:${barW};background:${barColor};
            border-radius:5px;transition:width 0.5s ease"></div>
        </div>
        <div style="font-size:10px;font-weight:800;color:${barColor};width:20px;text-align:right">
          ${done?'✓':'✗'}
        </div>
      </div>`;
    }).join('')}
  </div>

  <!-- PSYCHOLOGICAL INSIGHT -->
  <div style="background:linear-gradient(135deg,#F5EEF8,#E8DAEF);border-radius:12px;
    padding:12px;margin-bottom:10px;border-left:4px solid #8E44AD">
    <div style="font-family:var(--font-round);font-size:12px;font-weight:800;
      color:#4A235A;margin-bottom:6px">🧠 Analisis Psikologis</div>
    <div style="font-size:12px;color:#4A235A;line-height:1.7">${p.psyInsight}</div>
  </div>

  <!-- GUIDANCE FOR PARENTS -->
  <div style="background:linear-gradient(135deg,#EAF9F0,#D5F5E3);border-radius:12px;
    padding:12px;margin-bottom:10px;border-left:4px solid #27AE60">
    <div style="font-family:var(--font-round);font-size:12px;font-weight:800;
      color:#1E5631;margin-bottom:6px">👨‍👩‍👧 Panduan untuk Orang Tua</div>
    <div style="font-size:12px;color:#1E5631;line-height:1.7">${p.arch.guide_ortu}</div>
  </div>

  <!-- GUIDANCE FOR TEACHER -->
  <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border-radius:12px;
    padding:12px;margin-bottom:10px;border-left:4px solid #2980B9">
    <div style="font-family:var(--font-round);font-size:12px;font-weight:800;
      color:#1A4E6E;margin-bottom:6px">👩‍🏫 Panduan untuk Guru</div>
    <div style="font-size:12px;color:#1A4E6E;line-height:1.7">${p.arch.guide_guru}</div>
  </div>

  <!-- STRENGTHS & GROWTH -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
    <div style="background:#EAF9F0;border-radius:12px;padding:10px">
      <div style="font-family:var(--font-round);font-size:11px;font-weight:800;
        color:var(--green-dark);margin-bottom:6px">💪 Kekuatan</div>
      ${p.strengths.length?p.strengths.map(s=>`<div style="font-size:10px;color:#1E5631;
        padding:2px 0">✓ ${s}</div>`).join('')
        :'<div style="font-size:10px;color:var(--muted)">Belum ada hari ini</div>'}
    </div>
    <div style="background:#FDEDEC;border-radius:12px;padding:10px">
      <div style="font-family:var(--font-round);font-size:11px;font-weight:800;
        color:#A93226;margin-bottom:6px">🌱 Perlu Ditumbuhkan</div>
      ${p.growths.length?p.growths.map(g=>`<div style="font-size:10px;color:#A93226;
        padding:2px 0">→ ${g}</div>`).join('')
        :'<div style="font-size:10px;color:var(--green-dark)">🎉 Semua selesai hari ini!</div>'}
    </div>
  </div>

  <!-- REKOMENDASI MINGGU INI -->
  <div style="background:#FFFDE7;border-radius:12px;padding:12px;margin-bottom:4px;
    border:1px solid #F9CA24">
    <div style="font-family:var(--font-round);font-size:12px;font-weight:800;
      color:#856404;margin-bottom:6px">🎯 Rekomendasi Minggu Ini</div>
    <div style="font-size:11px;color:#6D4C0F;line-height:1.7">
      ${p.growths.length > 0
        ? 'Fokuskan pendampingan pada: <strong>'+p.growths.slice(0,2).join('</strong> dan <strong>')+'</strong>. '
        : 'Semua kebiasaan sudah berjalan baik. '}
      ${p.streak >= 7 ? 'Berikan apresiasi nyata untuk streak '+p.streak+' hari ini — ini momen penting yang perlu dirayakan.' :
        p.streak >= 3 ? 'Streak '+p.streak+' hari adalah momentum bagus. Pertahankan dengan rutinitas yang menyenangkan.' :
        'Mulai dari satu kebiasaan yang paling mudah dan konsistenlah selama 7 hari sebelum menambah kebiasaan lain.'}
    </div>
  </div>`;
}

// ── ROLE-BASED NAV ──
const NAV_CONFIGS = {
  anak: [
    {id:'beranda', icon:'🏠', label:'Beranda'},
    {id:'dunia',   icon:'🗺️', label:'Duniaku'},
    {id:'race',    icon:'🏁', label:'Balapan'},
    {id:'garasi',  icon:'🏎️', label:'Garasi'},
  ],
  ortu: [
    {id:'ortu',     icon:'📊', label:'Laporan'},
    {id:'psikologi',icon:'🧠', label:'Profil'},
    {id:'tentang',  icon:'ℹ️', label:'Tentang'},
  ],
  guru: [
    {id:'sekolah',  icon:'🏫', label:'Kelas'},
    {id:'psikologi',icon:'🧠', label:'Profil Siswa'},
    {id:'admin',    icon:'👥', label:'Manajemen'},
  ],
  kepsek: [
    {id:'sekolah',  icon:'📊', label:'Dashboard'},
    {id:'psikologi',icon:'🧠', label:'Profil'},
    {id:'admin',    icon:'👥', label:'Manajemen'},
  ],
  admin: [
    {id:'sekolah', icon:'📊', label:'Dashboard'},
    {id:'admin',   icon:'👥', label:'Manajemen'},
    {id:'tentang', icon:'ℹ️', label:'Tentang'},
  ],
};

function renderNav(activePageId){
  const role = CRole || 'anak';
  const items = NAV_CONFIGS[role] || NAV_CONFIGS.anak;
  const bar = document.getElementById('bottom-nav-bar');
  if(!bar) return;
  bar.innerHTML = items.map(item => `
    <div class="nav-item ${activePageId===item.id?'active':''}"
      onclick="switchPage('${item.id}')" id="nav-${item.id}">
      <div class="nav-icon">${item.icon}</div>
      <div class="nav-label">${item.label}</div>
    </div>`).join('');
}

function doLogout(){
  CU = null; CRole = null; selRole = null;
  // Reset PIN fields
  [0,1,2,3].forEach(i=>{
    const el = document.getElementById('p'+i);
    if(el) el.value='';
  });
  document.getElementById('pin-error').textContent='';
  // Hide staff fields
  const inp = document.getElementById('login-name');
  const btn = document.getElementById('btn-staff');
  if(inp) inp.style.display='none';
  if(btn) btn.style.display='none';
  // Reset role buttons
  document.querySelectorAll('.role-btn').forEach(b=>b.classList.remove('selected'));
  // Switch screens
  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
  // Reset nav
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const nb = document.getElementById('nav-beranda');
  if(nb) nb.classList.add('active');
  showToast('👋 Sampai jumpa! Jangan lupa kebiasaan baikmu ya!');
}

let tt;
function showToast(msg){
  clearTimeout(tt);
  document.getElementById('toast-msg').textContent=msg;
  document.getElementById('toast').classList.add('show');
  tt=setTimeout(()=>document.getElementById('toast').classList.remove('show'),2800);
}
