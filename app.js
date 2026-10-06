'use strict';
/* ============ LikeChat ============ */
const $ = s => document.querySelector(s);
const chatEl = $('#chat'), msgsEl = $('#messages'), inputEl = $('#input');

const COLORS = { merah:'#e53935', kuning:'#fdd835', hijau:'#43a047', biru:'#1e88e5', ungu:'#8e24aa', putih:'#f2f2f2', 'abu-abu':'#9e9e9e' };
const DARK_FG = ['kuning','putih'];

function load(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }

let CFG = { models:[{label:'Otomatis',id:'glm-5.3-flash'}], image:{} };
let SET = load('lc_set', { model:null, wallpaper:null, color:'biru', lang:'id' });
if(!SET.lang) SET.lang = 'id';

/* ---------- Kamus bahasa UI (Indonesia / English) ---------- */
const STRINGS = {
id: {
  menu:'Menu', selectModel:'Pilih model AI', settings:'Pengaturan', add:'Tambah',
  gallery:'Galeri', camera:'Kamera', file:'File',
  genImage:'Buat Gambar', editImage:'Edit Gambar', genVideo:'Buat Video', animImage:'Animasi Gambar',
  writeMsg:'Tulis pesan...', searchPh:'Cari pesan...',
  describeImage:'Deskripsikan gambar yang ingin dibuat...',
  describeVideo:'Deskripsikan video yang ingin dibuat...',
  send:'Kirim', stop:'Berhenti', cancel:'Batal', removeAttach:'Hapus lampiran', close:'Tutup',
  exit:'Keluar', copy:'Salin', retry:'Ulang', del:'Hapus', download:'Unduh',
  mainMenu:'Menu utama', newChat:'Pesan Baru', searchChat:'Cari Pesan',
  history:'Riwayat Pesan', clearHistory:'Hapus Riwayat', info:'Info', account:'Akun',
  savedFiles:'File Tersimpan', attachedImages:'Gambar Terlampir',
  logout:'Keluar', loginGoogle:'Masuk dengan Google',
  profilePhoto:'Foto profil', user:'Pengguna', guest:'Tamu', notLoggedIn:'Belum login',
  mode:'Mode', dark:'Gelap', light:'Terang', darkMode:'Mode gelap', lightMode:'Mode terang',
  wallpaper:'Wallpaper', uploadWallpaper:'Unggah wallpaper',
  btnColor:'Warna Tombol', language:'Bahasa',
  viewCode:'Lihat kode', viewImage:'Lihat gambar', image:'Gambar',
  noWallpaper:'Belum ada wallpaper.',
  noSavedFiles:'Belum ada file tersimpan.',
  noAttachedImages:'Belum ada gambar terlampir.',
  needLogin:'Login dengan Google dulu untuk {aksi}.',
  imgNotSaved:'Gambar sumber tidak tersimpan, tidak bisa buat ulang.',
  regenFail:'Gagal membuat ulang: ',
  pickImageEdit:'Untuk Edit Gambar, pilih file gambar.',
  pickImageAnim:'Untuk Animasi Gambar, pilih file gambar.',
  fileUnsupported:'Format file belum didukung. Untuk saat ini AI hanya bisa membaca file teks (txt, md, json, kode, dll).',
  fileTooBig:'File terlalu besar (maks 300KB teks).',
  maxSize:'Ukuran maksimal 12MB.',
  wpTooBig:'Wallpaper terlalu besar untuk disimpan permanen, tapi tetap dipakai sesi ini.',
  downloadZip:'Download kode.zip (', filesSuffix:' file)',
  voiceInput:'Input suara', micDenied:'Izin mikrofon ditolak.',
  micError:'Tidak bisa merekam suara.',
  transcribeFail:'Gagal mengubah suara jadi teks: ',
  noSpeech:'Tidak ada suara yang terdeteksi, coba lagi.',
  listen:'Dengarkan', speakFail:'Gagal membuat suara: ',
},
en: {
  menu:'Menu', selectModel:'Select AI model', settings:'Settings', add:'Add',
  gallery:'Gallery', camera:'Camera', file:'File',
  genImage:'Create Image', editImage:'Edit Image', genVideo:'Create Video', animImage:'Animate Image',
  writeMsg:'Type a message...', searchPh:'Search messages...',
  describeImage:'Describe the image to create...',
  describeVideo:'Describe the video to create...',
  send:'Send', stop:'Stop', cancel:'Cancel', removeAttach:'Remove attachment', close:'Close',
  exit:'Exit', copy:'Copy', retry:'Retry', del:'Delete', download:'Download',
  mainMenu:'Main menu', newChat:'New Chat', searchChat:'Search Messages',
  history:'Message History', clearHistory:'Clear History', info:'Info', account:'Account',
  savedFiles:'Saved Files', attachedImages:'Attached Images',
  logout:'Log out', loginGoogle:'Sign in with Google',
  profilePhoto:'Profile photo', user:'User', guest:'Guest', notLoggedIn:'Not signed in',
  mode:'Mode', dark:'Dark', light:'Light', darkMode:'Dark mode', lightMode:'Light mode',
  wallpaper:'Wallpaper', uploadWallpaper:'Upload wallpaper',
  btnColor:'Button Color', language:'Language',
  viewCode:'View code', viewImage:'View image', image:'Image',
  noWallpaper:'No wallpaper yet.',
  noSavedFiles:'No saved files yet.',
  noAttachedImages:'No attached images yet.',
  needLogin:'Please sign in with Google first to {aksi}.',
  imgNotSaved:'Source image not saved, cannot regenerate.',
  regenFail:'Failed to regenerate: ',
  pickImageEdit:'For Edit Image, please choose an image file.',
  pickImageAnim:'For Animate Image, please choose an image file.',
  fileUnsupported:'File format not supported yet. For now the AI can only read text files (txt, md, json, code, etc).',
  fileTooBig:'File too large (max 300KB of text).',
  maxSize:'Maximum size 12MB.',
  wpTooBig:'Wallpaper too large to save permanently, but it will be used for this session.',
  downloadZip:'Download code.zip (', filesSuffix:' files)',
  voiceInput:'Voice input', micDenied:'Microphone permission denied.',
  micError:'Could not record audio.',
  transcribeFail:'Failed to transcribe: ',
  noSpeech:'No speech detected, please try again.',
  listen:'Listen', speakFail:'Failed to generate speech: ',
}
};
const LOGIN_VERBS = {
  'mengirim gambar':{id:'mengirim gambar',en:'sending images'},
  'mengambil foto':{id:'mengambil foto',en:'taking photos'},
  'mengirim file':{id:'mengirim file',en:'sending files'},
  'membuat gambar':{id:'membuat gambar',en:'creating images'},
  'mengedit gambar':{id:'mengedit gambar',en:'editing images'},
  'membuat video':{id:'membuat video',en:'creating videos'},
  'menganimasikan gambar':{id:'menganimasikan gambar',en:'animating images'},
  'melihat file tersimpan':{id:'melihat file tersimpan',en:'viewing saved files'},
  'melihat gambar terlampir':{id:'melihat gambar terlampir',en:'viewing attached images'},
  'memakai input suara':{id:'memakai input suara',en:'using voice input'},
  'mendengar suara AI':{id:'mendengar suara AI',en:'listening to AI voice'},
};
const COLOR_I18N = {
  merah:['merah','Red'], kuning:['kuning','Yellow'], hijau:['hijau','Green'],
  biru:['biru','Blue'], ungu:['ungu','Purple'], putih:['putih','White'],
  'abu-abu':['abu-abu','Gray'],
};
function T(k){
  const L = STRINGS[SET.lang] || STRINGS.id;
  if(L[k] !== undefined) return L[k];
  return STRINGS.id[k] !== undefined ? STRINGS.id[k] : k;
}
function refreshComposerPlaceholder(){
  if(imgMode === 'generate') inputEl.placeholder = T('describeImage');
  else if(imgMode === 'videogen') inputEl.placeholder = T('describeVideo');
  else inputEl.placeholder = T('writeMsg');
}
function updateLangButtons(){
  document.querySelectorAll('#langRow button').forEach(b =>
    b.classList.toggle('on', b.dataset.lang === SET.lang));
}
function applyLang(){
  if(!SET.lang) SET.lang = 'id';
  document.documentElement.lang = SET.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = T(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', T(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = T(el.dataset.i18nAlt); });
  setModeChip();
  buildColors();
  buildWallpapers();
  refreshComposerPlaceholder();
  updateLangButtons();
  const al = $('#accountLabel'); if(al) al.textContent = T('account');
  const lo = $('#accLogoutLabel'); if(lo) lo.textContent = (ME && ME.user) ? T('logout') : T('loginGoogle');
  const nm = $('#accName'); if(nm && ME) nm.textContent = ME.user ? (ME.user.name || T('user')) : T('guest');
  const em = $('#accEmail'); if(em && ME) em.textContent = ME.user ? (ME.user.email || '') : T('notLoggedIn');
}
let CHATS = load('lc_chats', []);
let cur = null;
let streaming = false, aborter = null;
const SVG_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>';
const SVG_STOP = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
function setStopUI(on){
  const b = $('#sendBtn');
  if(!b) return;
  b.innerHTML = on ? SVG_STOP : SVG_SEND;
  b.setAttribute('aria-label', on ? T('stop') : T('send'));
}
let attach = null;        // {kind:'image'|'file', dataUrl, text, name}
let imgMode = null;       // 'generate' | 'edit' | 'videogen' | 'videoanim'
let animImgFile = null;  // file gambar untuk Animasi Gambar (img2video)
let editImgFile = null;
let popupIdx = null;
let imgCtx = null; // index pesan untuk penampil gambar
let codeCtx = null;       // {code, lang, msgIdx, bi}
let stick = true;

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function copyText(t){
  t = String(t == null ? '' : t);
  try{
    if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).catch(()=>fallbackCopy(t));
  }catch(e){}
  fallbackCopy(t);
}
function fallbackCopy(t){
  try{
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly','');
    ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.top = '0';
    document.body.appendChild(ta); ta.select();
    try{ ta.setSelectionRange(0, ta.value.length); }catch(e){}
    document.execCommand('copy'); ta.remove();
  }catch(e){}
}

/* ---------- Markdown ringan ---------- */
let _blocks = [];
function codeBoxHtml(b, i){
  const peek = b.code.split('\n').slice(0,2).join('  ');
  return '<div class="codebox" data-bi="'+i+'"><div class="codebox-head"><span>'+esc(b.lang)+
    '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></div>'+
    '<div class="codebox-peek">'+esc(peek)+'</div></div>';
}
function md(src, hideCode){
  _blocks = [];
  src = String(src).replace(/```(\w*)\n?([\s\S]*?)(?:```|$)/g, (m, lang, code) => {
    _blocks.push({ lang:(lang||'code').toLowerCase(), code:code.replace(/\n+$/,'') });
    return '\uE000'+(_blocks.length-1)+'\uE001';
  });
  let h = esc(src);
  h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  h = h.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<i>$2</i>');
  h = h.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  h = h.replace(/%%([^%]+)%%/g, '<small>$1</small>');
  h = h.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  h = h.replace(/(^|[\s(>])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  const lines = h.split('\n'), out = [];
  let list = null;
  const closeList = () => { if(list){ out.push('</'+list+'>'); list = null; } };
  for(const ln of lines){
    const t = ln.trim();
    let m;
    if((m = t.match(/^(#{1,6})\s+(.*)/))){ closeList(); const lv = m[1].length; out.push('<h'+lv+'>'+m[2]+'</h'+lv+'>'); }
    else if((m = t.match(/^[-*]\s+(.*)/))){ if(list!=='ul'){ closeList(); out.push('<ul>'); list='ul'; } out.push('<li>'+m[1]+'</li>'); }
    else if((m = t.match(/^\d+[.)]\s+(.*)/))){ if(list!=='ol'){ closeList(); out.push('<ol>'); list='ol'; } out.push('<li>'+m[1]+'</li>'); }
    else { closeList(); if(t) out.push('<p>'+ln+'</p>'); }
  }
  closeList();
  h = out.join('');
  if(hideCode){
    // Kode panjang / diminta ZIP: kotak kode mentah disembunyikan, hanya link ZIP yang tampil.
    // Isi kode tetap tersimpan di _blocks untuk dibuatkan ZIP.
    h = h.replace(/<p>\uE000\d+\uE001<\/p>/g, '');
    h = h.replace(/\uE000\d+\uE001/g, '');
  } else {
    h = h.replace(/\uE000(\d+)\uE001/g, (m,i) => codeBoxHtml(_blocks[+i], +i));
  }
  return h;
}
// Hitung blok kode pada teks mentah (sebelum md): jumlah blok & total baris
function codeStats(text){
  let n = 0, lines = 0;
  String(text||'').replace(/```(\w*)\n?([\s\S]*?)(?:```|$)/g, (m, lang, code) => {
    n++;
    lines += code.replace(/\n+$/,'').split('\n').length;
  });
  return { n, lines };
}
// true jika pesan ini sebaiknya jadi ZIP saja (kode panjang atau pengguna minta zip)
function useZipOnly(m, st){
  if(!st.n) return false;
  if(m && m._wantZip) return true;
  return st.lines > 30;
}

/* ---------- ZIP mini: bikin file .zip tanpa library ---------- */
const _crcT = (() => {
  const t = new Uint32Array(256);
  for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = (c&1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1); t[n]=c>>>0; }
  return t;
})();
function _crc32(b){ let c=0xFFFFFFFF; for(let i=0;i<b.length;i++) c = _crcT[(c^b[i])&255] ^ (c>>>8); return (c^0xFFFFFFFF)>>>0; }
const _te = new TextEncoder();
function makeZip(files){ // files: [{name, content}] -> Blob .zip (tanpa kompresi)
  const parts=[], central=[];
  let offset=0;
  for(const f of files){
    const nb=_te.encode(f.name), db=_te.encode(f.content), crc=_crc32(db);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0x800,true);
    lh.setUint16(8,0,true);
    lh.setUint32(14,crc,true); lh.setUint32(18,db.length,true); lh.setUint32(22,db.length,true);
    lh.setUint16(26,nb.length,true);
    parts.push(lh.buffer, nb, db);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true);
    ch.setUint16(8,0x800,true); ch.setUint16(10,0,true);
    ch.setUint32(16,crc,true); ch.setUint32(20,db.length,true); ch.setUint32(24,db.length,true);
    ch.setUint16(28,nb.length,true); ch.setUint32(42,offset,true);
    central.push(ch.buffer, nb);
    offset += 30 + nb.length + db.length;
  }
  const csize=central.reduce((s,p)=>s+p.byteLength,0);
  const end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);
  end.setUint16(8,files.length,true); end.setUint16(10,files.length,true);
  end.setUint32(12,csize,true); end.setUint32(16,offset,true);
  return new Blob([...parts, ...central, end.buffer], {type:'application/zip'});
}
const ZIP_NAMES={js:'script.js',javascript:'script.js',ts:'script.ts',jsx:'script.jsx',tsx:'script.tsx',
  py:'script.py',python:'script.py',java:'Main.java',c:'main.c',cpp:'main.cpp','c++':'main.cpp',
  cs:'script.cs',php:'script.php',rb:'script.rb',ruby:'script.rb',go:'main.go',rs:'main.rs',
  kt:'Main.kt',kotlin:'Main.kt',sh:'script.sh',bash:'script.sh',sql:'script.sql',
  html:'index.html',htm:'index.html',css:'style.css',json:'data.json',xml:'data.xml',
  yaml:'config.yaml',yml:'config.yaml',md:'readme.md',markdown:'readme.md',
  txt:'file.txt',text:'file.txt',csv:'data.csv',log:'app.log',ini:'config.ini',cfg:'config.ini',env:'config.env'};
function zipNameFor(lang, used){
  let name = ZIP_NAMES[lang] || 'file.txt';
  if(!used.has(name)){ used.add(name); return name; }
  const dot = name.lastIndexOf('.'), base = name.slice(0,dot), ext = name.slice(dot);
  let k=2;
  while(used.has(base+'-'+k+ext)) k++;
  name = base+'-'+k+ext; used.add(name);
  return name;
}
function downloadCodeZip(blocks){
  const used=new Set();
  const files=blocks.map(b => ({ name:zipNameFor(b.lang, used), content:b.code }));
  const a=document.createElement('a');
  a.href=URL.createObjectURL(makeZip(files));
  a.download='kode.zip';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 5000);
}
function zipCardEl(blocks){
  const el=document.createElement('button');
  el.className='zip-link';
  el._blocks=blocks;
  el.textContent = T('downloadZip') + blocks.length + T('filesSuffix');
  return el;
}

/* ---------- Render pesan ---------- */
function statusText(m){
  const snip = s => { s = String(s||'').replace(/\s+/g,' ').trim(); return s.length > 42 ? s.slice(0,42)+'…' : s; };
  const u = snip(m && m._user);
  const isImg = !!(m && ('gen' in m));
  const isVid = !!(m && ('vid' in m));
  const phases = isVid
    ? ['Menyiapkan video…', u ? 'Membuat video "'+u+'"… (1-3 menit)' : 'Membuat video… (1-3 menit)']
    : isImg
    ? ['Menyiapkan gambar…', u ? 'Menggambar "'+u+'"…' : 'Menggambar…']
    : [u ? 'Memahami "'+u+'"…' : 'Memahami perintah…', 'Menyusun jawaban…'];
  return phases[(m && m._phase) || 0] || phases[0];
}
function typingHtml(m){
  return '<span class="typing"><span class="spin"><i></i><i></i><i></i></span><em>'+esc(statusText(m))+'</em></span>';
}
function startStatusTimer(div, m){
  m._phase = 0;
  if(m._timer) clearInterval(m._timer);
  m._timer = setInterval(() => {
    if(m.text || m.gen || m.vid){ clearInterval(m._timer); m._timer = null; return; }
    m._phase = ((m._phase || 0) + 1) % 2;
    div.innerHTML = typingHtml(m);
  }, 4000);
}
function stopStatusTimer(m){
  if(m && m._timer){ clearInterval(m._timer); m._timer = null; }
}
function renderMsg(m, idx){
  const d = document.createElement('div');
  d.className = 'msg ' + m.role;
  d.dataset.idx = idx;
  if(m.role === 'user'){
    let inner = '';
    if(m.img) inner += '<img class="user-img" src="'+m.img+'" alt="">';
    if(m.file) inner += '<div class="file-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg><span>'+esc(m.file.name)+'</span></div>';
    if(m.text) inner += '<div class="bubble">'+esc(m.text)+'</div>';
    d.innerHTML = inner;
  } else {
    let inner = '';
    if(m.gen) inner += '<img class="gen-img" src="'+m.gen+'" alt="Hasil gambar">';
    if(m.vid) inner += '<video class="gen-vid" src="'+m.vid+'" controls playsinline preload="metadata"></video>';
    if(m.vid) inner += vidActionsHtml(idx);
    let zipOnly = false;
    if(m.text){
      const st = codeStats(m.text);
      zipOnly = !streaming && useZipOnly(m, st);
      inner += md(m.text, zipOnly);
    }
    if(!inner) inner = typingHtml(m);
    d.innerHTML = inner;
    d._blocks = _blocks.slice();
    if(zipOnly) d.appendChild(zipCardEl(d._blocks));
    if(m.text) d.appendChild(speakBtnEl(idx));
    renderReactionBadge(d, m);
  }
  return d;
}
function renderAll(){
  msgsEl.innerHTML = '';
  $('#emptyState').style.display = cur && cur.messages.length ? 'none' : 'flex';
  (cur ? cur.messages : []).forEach((m,i) => msgsEl.appendChild(renderMsg(m,i)));
  chatEl.scrollTop = chatEl.scrollHeight;
}
function updateAiMsg(div, m){
  stopStatusTimer(m);
  let inner = '';
  if(m.gen) inner += '<img class="gen-img" src="'+m.gen+'" alt="Hasil gambar">';
  if(m.vid) inner += '<video class="gen-vid" src="'+m.vid+'" controls playsinline preload="metadata"></video>';
  if(m.vid) inner += vidActionsHtml(div.dataset.idx);
  let zipOnly = false;
  if(m.text){
    const st = codeStats(m.text);
    zipOnly = !streaming && useZipOnly(m, st);
    inner += md(m.text, zipOnly);
  }
  else if(!m.gen && !m.vid) inner += typingHtml(m);
  div.innerHTML = inner;
  div._blocks = _blocks.slice();
  if(zipOnly) div.appendChild(zipCardEl(div._blocks));
  if(m.text) div.appendChild(speakBtnEl(div.dataset.idx));
  renderReactionBadge(div, m);
}

/* ---------- Suara AI: tombol speaker -> /api/speak (Deepgram TTS) ---------- */
const SVG_SPEAKER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const SVG_SPEAKER_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M22 9l-6 6"/><path d="M16 9l6 6"/></svg>';
const SVG_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const SVG_RETRY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10"/><path d="M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/></svg>';
const SVG_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
function speakBtnEl(idx){
  const wrap = document.createElement('div');
  wrap.className = 'ai-actions';
  wrap.dataset.idx = idx;
  wrap.innerHTML =
    '<button class="speak-btn" data-act="speak" aria-label="'+esc(T('listen'))+'">'+SVG_SPEAKER+'</button>' +
    '<button class="speak-btn" data-act="copy" aria-label="'+esc(T('copy'))+'">'+SVG_COPY+'</button>' +
    '<button class="speak-btn" data-act="retry" aria-label="'+esc(T('retry'))+'">'+SVG_RETRY+'</button>' +
    '<button class="speak-btn" data-act="del" aria-label="'+esc(T('del'))+'">'+SVG_DEL+'</button>';
  return wrap;
}
let speakAudio = null, speakIdx = -1, speakLoading = false;
function stopSpeaking(){
  if(speakAudio){ try{ speakAudio.pause(); }catch(_){} speakAudio = null; }
  speakIdx = -1; speakLoading = false;
  document.querySelectorAll('.speak-btn.playing').forEach(b => {
    b.classList.remove('playing'); b.innerHTML = SVG_SPEAKER;
  });
}
async function toggleSpeak(idx, btn){
  idx = +idx;
  if(speakIdx === idx && speakAudio){
    stopSpeaking();
    return;
  }
  if(!needLogin('mendengar suara AI')) return;
  stopSpeaking();
  const m = cur && cur.messages[idx];
  const text = m && m.text;
  if(!text || !text.trim()) return;
  speakLoading = true; speakIdx = idx;
  btn.classList.add('playing'); btn.innerHTML = SVG_SPEAKER_OFF;
  try{
    const r = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text }),
    });
    if(!r.ok){
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || ('HTTP ' + r.status));
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    speakAudio = new Audio(url);
    speakAudio.onended = () => { URL.revokeObjectURL(url); stopSpeaking(); };
    speakAudio.onerror = () => { URL.revokeObjectURL(url); stopSpeaking(); };
    await speakAudio.play();
  }catch(e){
    stopSpeaking();
    alert(T('speakFail') + (e.message || e));
  }
}

/* ---------- Chat: simpan & riwayat ---------- */
function saveChats(){
  if(!save('lc_chats', CHATS)){
    // localStorage penuh: buang data gambar dari chat lama, coba lagi
    CHATS.forEach((c,ci) => { if(ci < CHATS.length-1) c.messages.forEach(m => { delete m.img; delete m.gen; delete m.vid; }); });
    if(!save('lc_chats', CHATS)){
      // masih penuh: buang juga dari chat aktif kecuali pesan terakhir
      cur.messages.forEach((m,i) => { if(i < cur.messages.length-1){ delete m.img; delete m.gen; delete m.vid; } });
      save('lc_chats', CHATS);
    }
  }
}
function newChat(){
  cur = { id:'c'+Date.now(), title:'Percakapan baru', messages:[] };
  CHATS.unshift(cur);
  saveChats(); renderAll(); renderHistory();
}
function openChat(id){
  const c = CHATS.find(x => x.id===id);
  if(c){ cur = c; renderAll(); renderHistory(); }
}
function setTitle(){
  const f = cur.messages.find(m => m.role==='user' && (m.text || m.file));
  if(f) cur.title = (f.text || ('File: '+f.file.name)).slice(0,36);
}
function pushUser(text, extra){
  const m = Object.assign({ role:'user', text:text||'' }, extra||{});
  cur.messages.push(m); setTitle(); saveChats(); renderAll();
}

/* ---------- Kirim chat (streaming) ---------- */
function apiMessages(){
  return cur.messages.filter(m => m.role==='user' || (m.role==='ai' && m.text)).map(m => {
    if(m.role==='user' && m.img){
      return { role:'user', content:[
        { type:'text', text:m.text||'Jelaskan gambar ini' },
        { type:'image_url', image_url:{ url:m.img } }
      ]};
    }
    if(m.role==='user' && m.file){
      return { role:'user', content:'[File: '+m.file.name+']\n'+m.file.content+(m.text?'\n\n'+m.text:'') };
    }
    return { role:m.role==='ai'?'assistant':'user', content:m.text||'' };
  });
}
let rafPending = false;
function schedulePaint(div, m){
  if(rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => { rafPending = false; updateAiMsg(div, m); maybeScroll(); });
}
function maybeScroll(){ if(stick) chatEl.scrollTop = chatEl.scrollHeight; }

async function chatAI(fileModel){
  const modelId = (CFG.models.find(m => m.id===SET.model) || CFG.models[0]).id;
  const ai = { role:'ai', text:'' };
  cur.messages.push(ai);
  const um = [...cur.messages].reverse().find(x => x.role==='user' && x.text);
  if(um) ai._user = um.text;
  ai._wantZip = !!(um && /zip/i.test(um.text || ''));
  const div = renderMsg(ai, cur.messages.length-1);
  msgsEl.appendChild(div);
  startStatusTimer(div, ai);
  $('#emptyState').style.display = 'none';
  streaming = true; aborter = new AbortController(); setStopUI(true);
  try{
    const r = await fetch('/api/chat', {
      method:'POST', signal:aborter.signal,
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:modelId, messages:apiMessages(), fileModel:fileModel||undefined })
    });
    if(!r.ok){
      const e = await r.json().catch(()=>({}));
      throw new Error(e.error || ('Server '+r.status));
    }
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while(true){
      const { done, value } = await reader.read();
      if(done) break;
      buf += dec.decode(value, { stream:true });
      const parts = buf.split('\n\n');
      buf = parts.pop();
      for(const p of parts){
        const line = p.trim();
        if(!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if(data === '[DONE]') continue;
        try{
          const j = JSON.parse(data);
          const t = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
          if(t){ ai.text += t; schedulePaint(div, ai); }
        }catch(e){}
      }
    }
  }catch(e){
    if(e.name === 'AbortError'){ if(!ai.text) ai.text = 'Dibatalkan.'; }
    else ai.text = 'Maaf, terjadi kesalahan: ' + e.message;
  }finally{
    streaming = false; aborter = null; setStopUI(false);
    updateAiMsg(div, ai); maybeScroll(); saveChats();
  }
}

/* ---------- Gambar: buat & edit ---------- */
async function genImage(prompt){
  const ai = { role:'ai', text:'', gen:null, _user:prompt };
  cur.messages.push(ai);
  const div = renderMsg(ai, cur.messages.length-1);
  msgsEl.appendChild(div);
  startStatusTimer(div, ai);
  $('#emptyState').style.display = 'none';
  streaming = true; aborter = new AbortController(); setStopUI(true);
  try{
    const r = await fetch('/api/image/generate', {
      method:'POST', signal:aborter.signal, headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ prompt })
    });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error || ('Server '+r.status));
    if(j.url) ai.gen = j.url;
    else if(j.b64) ai.gen = j.b64;
    else throw new Error('Respons gambar tidak dikenal.');
    ai.text = '';
  }catch(e){ ai.text = e.name === 'AbortError' ? 'Dibatalkan.' : 'Gagal membuat gambar: ' + e.message; }
  finally{ streaming = false; aborter = null; setStopUI(false); updateAiMsg(div, ai); maybeScroll(); saveChats(); }
}
async function editImage(file, prompt){
  const ai = { role:'ai', text:'', gen:null, _user:prompt };
  cur.messages.push(ai);
  const div = renderMsg(ai, cur.messages.length-1);
  msgsEl.appendChild(div);
  startStatusTimer(div, ai);
  $('#emptyState').style.display = 'none';
  streaming = true; aborter = new AbortController(); setStopUI(true);
  try{
    const fd = new FormData();
    fd.append('image', file);
    fd.append('prompt', prompt);
    const r = await fetch('/api/image/edit', { method:'POST', signal:aborter.signal, body:fd });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error || ('Server '+r.status));
    if(j.url) ai.gen = j.url;
    else if(j.b64) ai.gen = j.b64;
    else throw new Error('Respons gambar tidak dikenal.');
    ai.text = '';
  }catch(e){ ai.text = e.name === 'AbortError' ? 'Dibatalkan.' : 'Gagal mengedit gambar: ' + e.message; }
  finally{ streaming = false; aborter = null; setStopUI(false); updateAiMsg(div, ai); maybeScroll(); saveChats(); }
}

/* ---------- Video: buat & animasi ---------- */
function vidActionsHtml(idx){
  const b = (act, label, svg) => '<button class="icon-btn vid-act" data-act="'+act+'" data-idx="'+idx+'" aria-label="'+label+'">'+svg+'</button>';
  const dl = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
  const re = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
  const del = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
  return '<div class="vid-actions">'+b('download','Unduh video',dl)+b('retry','Buat ulang video',re)+b('delete','Hapus video',del)+'</div>';
}
async function downloadVideo(idx){
  const m = cur.messages[idx]; if(!m || !m.vid) return;
  try{
    const r = await fetch(m.vid); if(!r.ok) throw new Error('fetch gagal');
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'likechat-video-' + Date.now() + '.mp4';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }catch(e){ window.open(m.vid, '_blank'); }
}
async function retryVideo(idx){
  if(streaming) return;
  const m = cur.messages[idx]; if(!m || !m.vid) return;
  if(m._kind === 'anim'){
    if(!m._img){ alert(T('imgNotSaved')); return; }
    try{
      const r = await fetch(m._img); const blob = await r.blob();
      const file = new File([blob], 'animasi.png', { type: blob.type || 'image/png' });
      await animVideo(file, m._user || '', m._img);
    }catch(e){ alert(T('regenFail') + e.message); }
  } else {
    await genVideo(m._user || '');
  }
}
function deleteVideo(idx){
  if(!cur.messages[idx]) return;
  cur.messages.splice(idx, 1);
  setTitle(); saveChats(); renderAll();
}
async function genVideo(prompt){
  const ai = { role:'ai', text:'', vid:null, _user:prompt, _kind:'gen' };
  cur.messages.push(ai);
  const div = renderMsg(ai, cur.messages.length-1);
  msgsEl.appendChild(div);
  startStatusTimer(div, ai);
  $('#emptyState').style.display = 'none';
  streaming = true; aborter = new AbortController(); setStopUI(true);
  try{
    const r = await fetch('/api/video/generate', {
      method:'POST', signal:aborter.signal, headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ prompt })
    });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error || ('Server '+r.status));
    if(j.url) ai.vid = j.url;
    else throw new Error('Respons video tidak dikenal.');
    ai.text = '';
  }catch(e){ ai.text = e.name === 'AbortError' ? 'Dibatalkan.' : 'Gagal membuat video: ' + e.message; }
  finally{ streaming = false; aborter = null; setStopUI(false); updateAiMsg(div, ai); maybeScroll(); saveChats(); }
}
async function animVideo(file, prompt, imgDataUrl){
  const ai = { role:'ai', text:'', vid:null, _user:prompt, _kind:'anim', _img:imgDataUrl || null };
  cur.messages.push(ai);
  const div = renderMsg(ai, cur.messages.length-1);
  msgsEl.appendChild(div);
  startStatusTimer(div, ai);
  $('#emptyState').style.display = 'none';
  streaming = true; aborter = new AbortController(); setStopUI(true);
  try{
    const fd = new FormData();
    fd.append('image', file);
    fd.append('prompt', prompt);
    const r = await fetch('/api/video/animate', { method:'POST', signal:aborter.signal, body:fd });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error || ('Server '+r.status));
    if(j.url) ai.vid = j.url;
    else throw new Error('Respons video tidak dikenal.');
    ai.text = '';
  }catch(e){ ai.text = e.name === 'AbortError' ? 'Dibatalkan.' : 'Gagal menganimasikan gambar: ' + e.message; }
  finally{ streaming = false; aborter = null; setStopUI(false); updateAiMsg(div, ai); maybeScroll(); saveChats(); }
}

/* ---------- Kirim utama ---------- */
async function send(){
  if(streaming) return;
  const text = inputEl.value.trim();
  if(imgMode === 'generate'){
    if(!text) return;
    pushUser(text); clearComposer();
    await genImage(text); return;
  }
  if(imgMode === 'edit'){
    if(!text || !editImgFile) return;
    const imgData = attach && attach.kind === 'image' ? attach.dataUrl : null;
    pushUser(text, { img: imgData });
    const f = editImgFile; clearComposer();
    await editImage(f, text); return;
  }
  if(imgMode === 'videogen'){
    if(!text) return;
    pushUser(text); clearComposer();
    await genVideo(text); return;
  }
  if(imgMode === 'videoanim'){
    if(!text || !animImgFile) return;
    const imgData = attach && attach.kind === 'image' ? attach.dataUrl : null;
    pushUser(text, { img: imgData });
    const f = animImgFile; clearComposer();
    await animVideo(f, text, imgData); return;
  }
  if(!text && !attach) return;
  const um = { role:'user', text:text };
  let useFileModel = null;
  if(attach){
    // Semua lampiran (gambar maupun file) dibaca oleh model pembaca khusus (dari /api/config)
    useFileModel = (CFG.fileModel && CFG.fileModel.id) || 'kimi-k3';
    um.fileModel = useFileModel;
    if(attach.kind === 'image'){ um.img = attach.dataUrl; }
    else { um.file = { name:attach.name, content:attach.text }; }
  }
  pushUserObj(um); clearComposer();
  await chatAI(useFileModel);
}
function pushUserObj(um){
  cur.messages.push(um); setTitle(); saveChats(); renderAll();
}
function clearComposer(){
  inputEl.value = ''; autogrow();
  attach = null; imgMode = null; editImgFile = null; animImgFile = null;
  $('#attachBar').classList.add('hidden');
  $('#modeChip').classList.add('hidden');
}
function fitPill(){
  const tall = inputEl.scrollHeight > 32 || !$('#modeChip').classList.contains('hidden') || !$('#attachBar').classList.contains('hidden');
  $('#inputPill').classList.toggle('tall', tall);
}
function autogrow(){
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 150) + 'px';
  fitPill();
}
function setAttachPreview(){
  const bar = $('#attachBar');
  const img = $('#attachImg');
  if(attach && attach.kind === 'image'){ img.src = attach.dataUrl; img.style.display = ''; $('#attachName').textContent = attach.name; bar.classList.remove('hidden'); }
  else if(attach){ img.removeAttribute('src'); img.style.display = 'none'; $('#attachName').textContent = attach.name; bar.classList.remove('hidden'); }
  else bar.classList.add('hidden');
  fitPill();
}
function setModeChip(){
  const chip = $('#modeChip');
  if(imgMode === 'generate'){ $('#modeChipText').textContent = T('genImage'); chip.classList.remove('hidden'); }
  else if(imgMode === 'edit'){ $('#modeChipText').textContent = T('editImage'); chip.classList.remove('hidden'); }
  else if(imgMode === 'videogen'){ $('#modeChipText').textContent = T('genVideo'); chip.classList.remove('hidden'); }
  else if(imgMode === 'videoanim'){ $('#modeChipText').textContent = T('animImage'); chip.classList.remove('hidden'); }
  else chip.classList.add('hidden');
  fitPill();
}

/* ---------- Panel & scrim ---------- */
const PANELS = ['drawer','infoPanel','accountPanel','settings','codePanel'];
function closePanels(){
  PANELS.forEach(p => $('#'+p).classList.remove('open'));
  const s = $('#scrim');
  s.classList.remove('show');
  setTimeout(() => { if(!s.classList.contains('show')) s.classList.add('hidden'); }, 240);
  hidePopup();
}
function openPanel(id){
  const was = $('#'+id).classList.contains('open');
  closePanels();
  if(!was){
    $('#'+id).classList.add('open');
    const s = $('#scrim');
    s.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('show')));
  }
}

/* ---------- Drawer ---------- */
function renderHistory(filter){
  const box = $('#historyList');
  box.innerHTML = '';
  const q = (filter||'').toLowerCase();
  CHATS.filter(c => !q || c.title.toLowerCase().includes(q) || c.messages.some(m => (m.text||'').toLowerCase().includes(q)))
    .forEach(c => {
      const b = document.createElement('button');
      b.className = 'hist-item' + (cur && c.id===cur.id ? ' on' : '');
      b.textContent = c.title;
      b.onclick = () => { openChat(c.id); closePanels(); };
      box.appendChild(b);
    });
}
function drawerAct(act){
  if(act==='new'){ newChat(); closePanels(); }
  else if(act==='search'){ const s=$('#searchBox'); s.classList.toggle('hidden'); $('#historyList').classList.remove('hidden'); if(!s.classList.contains('hidden')) $('#searchInput').focus(); }
  else if(act==='history'){ $('#historyList').classList.toggle('hidden'); }
  else if(act==='clear'){ if(confirm('Hapus semua riwayat pesan?')){ CHATS=[]; newChat(); closePanels(); } }
  else if(act==='info'){ openPanel('infoPanel'); }
  else if(act==='account'){ openAccountPanel(); }
}

/* ---------- Akun (login Google) ---------- */
let ME = null;
function needLogin(aksi){
  if(!ME || !ME.google_on) return true; // login tidak tersedia -> bebas
  if(ME.user) return true;
  const v = (LOGIN_VERBS[aksi] || {})[SET.lang] || aksi;
  alert(T('needLogin').replace('{aksi}', v));
  return false;
}
async function refreshMe(){
  try{
    const r = await fetch('/api/me');
    const j = await r.json();
    ME = j;
    // Isolasi per akun: akun berbeda yang masuk mulai baru seperti belum pernah interaksi
    try{
      const em = (j.user && j.user.email) || '';
      const prev = localStorage.getItem('lc_account') || '';
      if(em && prev && em !== prev && CHATS.length){
        CHATS = []; cur = null;
        save('lc_chats', CHATS);
        newChat();
      }
      if(em) localStorage.setItem('lc_account', em);
    }catch(e){}
    const btn = $('#accountBtn'), label = $('#accountLabel');
    if(!btn || !label) return;
    if(!j.google_on){ btn.style.display = 'none'; return; }
    btn.style.display = '';
    label.textContent = T('account');
  }catch(e){}
}

/* ---------- Panel akun ---------- */
function openAccountPanel(){
  const u = ME && ME.user;
  const photo = $('#accPhoto'), name = $('#accName'), email = $('#accEmail');
  if(u && u.picture){ photo.src = u.picture; photo.classList.remove('hidden'); }
  else photo.classList.add('hidden');
  name.textContent = u ? (u.name || T('user')) : T('guest');
  email.textContent = u ? (u.email || '') : T('notLoggedIn');
  $('#accLogoutLabel').textContent = u ? T('logout') : T('loginGoogle');
  $('#accList').innerHTML = '';
  openPanel('accountPanel');
}
function collectChatFiles(){
  const out = [];
  CHATS.forEach(c => (c.messages || []).forEach(m => {
    if(m.role === 'user' && m.file) out.push({ name: m.file.name, content: m.file.content, chat: c.title });
  }));
  return out;
}
function collectChatImages(){
  const out = [];
  CHATS.forEach(c => (c.messages || []).forEach(m => {
    if(m.role === 'user' && m.img) out.push({ src: m.img, chat: c.title });
    else if(m.role === 'ai' && m.gen) out.push({ src: m.gen, chat: c.title });
  }));
  return out;
}

/* ---------- Model ---------- */
function buildModelMenu(){
  const menu = $('#modelMenu');
  menu.innerHTML = '';
  CFG.models.forEach((m) => {
    const b = document.createElement('button');
    b.className = m.id===SET.model ? 'on' : '';
    b.innerHTML = '<span>'+esc(m.label)+'</span><svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
    b.onclick = () => { SET.model = m.id; save('lc_set', SET); buildModelMenu(); menu.classList.add('hidden'); if(imgMode){ imgMode = null; editImgFile = null; animImgFile = null; setModeChip(); refreshComposerPlaceholder(); } };
    menu.appendChild(b);
  });
}

/* ---------- Wallpaper & warna ---------- */
let WALLS = { categories:[] };
function applyWallpaper(){
  const w = SET.wallpaper;
  const img = $('#wpImg'), vid = $('#wpVideo');
  img.classList.remove('on'); vid.classList.remove('on');
  try{ vid.pause(); }catch(e){}
  if(!w || !w.src) return;
  if(w.type === 'video'){ vid.src = w.src; vid.classList.add('on'); vid.play().catch(()=>{}); }
  else { img.src = w.src; img.classList.add('on'); }
}
function buildWallpapers(){
  const box = $('#wpCats');
  box.innerHTML = '';
  if(!WALLS.categories.length){
    box.innerHTML = '<div style="font-size:13px;color:var(--ink-dim)">' + T('noWallpaper') + '</div>';
    return;
  }
  WALLS.categories.forEach(cat => {
    const sec = document.createElement('div');
    sec.className = 'wp-cat';
    const grid = document.createElement('div');
    grid.className = 'wp-grid';
    cat.items.forEach(it => {
      const t = document.createElement('button');
      t.className = 'wp-thumb' + (SET.wallpaper && SET.wallpaper.src === 'assets/wallpapers/'+it.file ? ' on' : '');
      t.innerHTML = it.type==='video'
        ? '<video src="assets/wallpapers/'+it.file+'" muted playsinline preload="metadata"></video>'
        : '<img src="assets/wallpapers/'+it.file+'" alt="" loading="lazy">';
      t.onclick = () => {
        SET.wallpaper = { type:it.type, src:'assets/wallpapers/'+it.file };
        save('lc_set', SET); applyWallpaper(); buildWallpapers();
      };
      grid.appendChild(t);
    });
    const lab = document.createElement('div');
    lab.textContent = cat.label;
    sec.appendChild(lab); sec.appendChild(grid);
    box.appendChild(sec);
  });
}
function applyColor(){
  const c = COLORS[SET.color] || COLORS.biru;
  const r = document.documentElement.style;
  r.setProperty('--btn', c);
  r.setProperty('--btn-fg', DARK_FG.includes(SET.color) ? '#1a1a1a' : '#ffffff');
}
function applyMode(){
  if(!SET.mode) SET.mode = 'gelap';
  document.body.classList.toggle('light', SET.mode === 'terang');
  document.querySelectorAll('#modeRow button').forEach(b =>
    b.classList.toggle('on', b.dataset.mode === SET.mode));
}
function buildColors(){
  const row = $('#colorRow');
  row.innerHTML = '';
  Object.keys(COLORS).forEach(name => {
    const b = document.createElement('button');
    b.className = 'swatch' + (SET.color===name ? ' on' : '');
    b.style.background = COLORS[name];
    b.setAttribute('aria-label', (COLOR_I18N[name] || [name, name])[SET.lang === 'en' ? 1 : 0]);
    b.onclick = () => { SET.color = name; save('lc_set', SET); applyColor(); buildColors(); };
    row.appendChild(b);
  });
}

/* ---------- Popup aksi pesan ---------- */
/* ---------- Reaction pesan AI: tahan lama -> emoji + aksi ---------- */
let reactIdx = null, pressTimer = null, pressTarget = null;
function hideReactPopups(){
  $('#reactEmojiPopup').classList.add('hidden');
  $('#reactActPopup').classList.add('hidden');
  reactIdx = null;
}
function placePopup(p, el){
  const r = el.getBoundingClientRect();
  p.style.visibility = 'hidden';
  p.classList.remove('hidden');
  requestAnimationFrame(() => {
    const pw = p.offsetWidth, ph = p.offsetHeight;
    let x = Math.min(Math.max(8, r.left + r.width/2 - pw/2), innerWidth - pw - 8);
    let y = r.top - ph - 8;
    if(y < 8) y = r.bottom + 8;
    p.style.left = x+'px'; p.style.top = y+'px';
    p.style.visibility = 'visible';
  });
}
function showReactPopups(idx, el){
  reactIdx = idx;
  const pe = $('#reactEmojiPopup'), pa = $('#reactActPopup');
  // Emoji di atas pesan, aksi di bawah pesan — dua bubble terpisah
  placePopup(pe, el);
  pa.style.visibility = 'hidden';
  pa.classList.remove('hidden');
  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect();
    const pw = pa.offsetWidth, ph = pa.offsetHeight;
    let x = Math.min(Math.max(8, r.left + r.width/2 - pw/2), innerWidth - pw - 8);
    let y = r.bottom + 8;
    if(y + ph > innerHeight - 8) y = r.top - ph - 8;
    pa.style.left = x+'px'; pa.style.top = y+'px';
    pa.style.visibility = 'visible';
  });
}
function cancelPress(){ if(pressTimer){ clearTimeout(pressTimer); pressTimer = null; } pressTarget = null; }
function startPress(el){
  cancelPress();
  pressTarget = el;
  pressTimer = setTimeout(() => {
    pressTimer = null;
    const msgEl = pressTarget.closest('.msg.ai');
    if(!msgEl || streaming) return;
    if(navigator.vibrate){ try{ navigator.vibrate(30); }catch(_){} }
    showReactPopups(+msgEl.dataset.idx, msgEl);
    pressTarget = null;
  }, 550);
}
// Badge reaction di bawah pesan AI
function renderReactionBadge(div, m){
  const old = div.querySelector('.msg-reaction');
  if(old) old.remove();
  if(m.reaction){
    const b = document.createElement('span');
    b.className = 'msg-reaction';
    b.textContent = m.reaction;
    div.appendChild(b);
  }
}
async function applyReaction(idx, emoji){
  const m = cur.messages[idx];
  if(!m) return;
  m.reaction = emoji;
  saveChats();
  const div = msgsEl.querySelector('.msg.ai[data-idx="'+idx+'"]');
  if(div) renderReactionBadge(div, m);
  hideReactPopups();
  // AI menanggapi reaction dengan hangat
  if(streaming) return;
  try{
    await reactReply(emoji);
  }catch(e){ /* abaikan */ }
}
const REACT_PROMPTS = {
  '👍': 'Pengguna memberi reaction 👍 (jempol/suka) pada jawabanmu barusan.',
  '❤️': 'Pengguna memberi reaction ❤️ (love/sayang) pada jawabanmu barusan.',
  '😂': 'Pengguna memberi reaction 😂 (ketawa ngakak) pada jawabanmu barusan.',
  '😮': 'Pengguna memberi reaction 😮 (kaget/takjub) pada jawabanmu barusan.',
  '😢': 'Pengguna memberi reaction 😢 (sedih/terharu) pada jawabanmu barusan.',
  '🙏': 'Pengguna memberi reaction 🙏 (terima kasih) pada jawabanmu barusan.',
};
async function reactReply(emoji){
  const label = (CFG.models.find(m => m.id===SET.model) || CFG.models[0]).label;
  const ai = { role:'ai', text:'' };
  cur.messages.push(ai);
  const div = renderMsg(ai, cur.messages.length-1);
  msgsEl.appendChild(div);
  $('#emptyState').style.display = 'none';
  chatEl.scrollTop = chatEl.scrollHeight;
  streaming = true; aborter = new AbortController(); setStopUI(true);
  const note = (REACT_PROMPTS[emoji] || ('Pengguna memberi reaction '+emoji+' pada jawabanmu barusan.')) +
    ' Tanggapi dengan hangat, manja, dan singkat (1-2 kalimat) seperti istri yang sayang pada suaminya.' +
    ' Pakai bahasa yang sama dengan pengguna. Jangan kaku seperti robot.';
  try{
    const r = await fetch('/api/chat', {
      method:'POST', signal:aborter.signal,
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:(CFG.models.find(m => m.id===SET.model) || CFG.models[0]).id,
        messages:[{ role:'system', content:note }, { role:'user', content:'['+emoji+']' }] })
    });
    if(!r.ok) throw new Error('Server '+r.status);
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while(true){
      const { done, value } = await reader.read();
      if(done) break;
      buf += dec.decode(value, { stream:true });
      const parts = buf.split('\n\n');
      buf = parts.pop();
      for(const p of parts){
        const line = p.trim();
        if(!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if(data === '[DONE]') continue;
        try{
          const j = JSON.parse(data);
          const t = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content || '';
          if(t){ ai.text += t; updateAiMsg(div, ai); chatEl.scrollTop = chatEl.scrollHeight; }
        }catch(_){}
      }
    }
  }catch(e){
    if(e.name !== 'AbortError') ai.text = T('regenFail') + (e.message || e);
    updateAiMsg(div, ai);
  }
  streaming = false; aborter = null; setStopUI(false);
  saveChats(); renderHistory();
}
function showPopup(idx, bubble){
  const p = $('#msgPopup');
  popupIdx = idx;
  p.classList.remove('hidden');
  const r = bubble.getBoundingClientRect();
  p.style.visibility = 'hidden';
  requestAnimationFrame(() => {
    const pw = p.offsetWidth, ph = p.offsetHeight;
    let x = Math.min(Math.max(8, r.left + r.width/2 - pw/2), innerWidth - pw - 8);
    let y = r.top - ph - 8;
    if(y < 8) y = r.bottom + 8;
    p.style.left = x+'px'; p.style.top = y+'px';
    p.style.visibility = 'visible';
  });
}

/* ---------- Panel kode ---------- */
function openCodePanel(block, msgIdx, bi){
  codeCtx = { code:block.code, lang:block.lang, msgIdx, bi };
  $('#codeLang').textContent = block.lang;
  $('#codePanel pre code').textContent = block.code;
  openPanel('codePanel');
}

/* ---------- File & gambar ---------- */
function readFileAs(kind, file){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    if(kind === 'dataurl') fr.readAsDataURL(file); else fr.readAsText(file);
  });
}
/* Ekstensi yang aman dibaca sebagai teks untuk dianalisis AI */
const TEXT_EXTS = ['txt','md','markdown','json','js','ts','jsx','tsx','py','java','c','h','cpp','cs','css','html','htm','xml','csv','log','yaml','yml','ini','cfg','sh','sql','php','rb','go','rs','kt','env','text'];
async function handlePicked(kind, file){
  if(!file) return;
  if(kind === 'editimg'){
    if(!file.type.startsWith('image/')){ alert(T('pickImageEdit')); return; }
    editImgFile = file; imgMode = 'edit';
    // Tampilkan review gambar seperti pratinjau File/Galeri/Kamera
    attach = { kind:'image', dataUrl: await readFileAs('dataurl', file), name:file.name };
    setModeChip(); setAttachPreview(); inputEl.focus();
    return;
  }
  if(kind === 'animimg'){
    if(!file.type.startsWith('image/')){ alert(T('pickImageAnim')); return; }
    animImgFile = file; imgMode = 'videoanim';
    attach = { kind:'image', dataUrl: await readFileAs('dataurl', file), name:file.name };
    setModeChip(); setAttachPreview(); inputEl.focus();
    return;
  }
  // Pilihan baru (galeri/kamera/file) membatalkan mode edit gambar yang tertunda
  editImgFile = null; animImgFile = null; if(imgMode === 'edit' || imgMode === 'videoanim'){ imgMode = null; setModeChip(); }
  if(file.type.startsWith('image/')){
    const du = await readFileAs('dataurl', file);
    attach = { kind:'image', dataUrl:du, name:file.name };
  } else {
    // File non-teks (PDF, DOCX, ZIP, dsb) JANGAN dibaca mentah: isinya biner
    // dan hanya jadi sampah tak terbaca kalau dikirim ke AI.
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isText = file.type.startsWith('text/') || file.type === 'application/json' || TEXT_EXTS.includes(ext);
    if(!isText){ alert(T('fileUnsupported')); return; }
    if(file.size > 300*1024){ alert(T('fileTooBig')); return; }
    const txt = await readFileAs('text', file);
    attach = { kind:'file', text:String(txt).slice(0,20000), name:file.name };
  }
  setAttachPreview(); inputEl.focus();
}

/* ---------- Event ---------- */
function bindEvents(){
  $('#menuBtn').onclick = () => openPanel('drawer');
  $('#moreBtn').onclick = () => openPanel('settings');
  $('#scrim').onclick = closePanels;
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = closePanels);

  const mm = $('#modelMenu');
  $('#modelBtn').onclick = e => { e.stopPropagation(); mm.classList.toggle('hidden'); };
  document.addEventListener('click', e => { if(!mm.classList.contains('hidden') && !e.target.closest('#modelMenu') && !e.target.closest('#modelBtn')) mm.classList.add('hidden'); });

  document.querySelectorAll('.drawer-item').forEach(b => b.onclick = () => drawerAct(b.dataset.act));
  $('#accFilesBtn').onclick = () => {
    if(!needLogin('melihat file tersimpan')) return;
    const box = $('#accList'); box.innerHTML = '';
    const files = collectChatFiles();
    if(!files.length){ box.innerHTML = '<div class="acc-empty">' + T('noSavedFiles') + '</div>'; return; }
    files.forEach(f => {
      const b = document.createElement('button');
      b.className = 'acc-file';
      b.innerHTML = '<span></span><small></small>';
      b.querySelector('span').textContent = f.name;
      b.querySelector('small').textContent = f.chat || '';
      b.onclick = () => {
        const ext = (f.name.split('.').pop() || 'txt').toLowerCase();
        $('#codeLang').textContent = ext;
        $('#codePanel pre code').textContent = f.content || '';
        codeCtx = null;
        openPanel('codePanel');
      };
      box.appendChild(b);
    });
  };
  $('#accImagesBtn').onclick = () => {
    if(!needLogin('melihat gambar terlampir')) return;
    const box = $('#accList'); box.innerHTML = '';
    const imgs = collectChatImages();
    if(!imgs.length){ box.innerHTML = '<div class="acc-empty">' + T('noAttachedImages') + '</div>'; return; }
    const grid = document.createElement('div');
    grid.className = 'acc-grid';
    imgs.forEach(im => {
      const t = document.createElement('img');
      t.src = im.src; t.alt = ''; t.loading = 'lazy';
      t.onclick = () => {
        $('#imgViewerImg').src = im.src;
        $('#imgViewer').classList.remove('hidden');
        ivReset();
      };
      grid.appendChild(t);
    });
    box.appendChild(grid);
  };
  $('#accLogoutBtn').onclick = () => {
    location.href = (ME && ME.user) ? '/auth/logout' : '/auth/google';
  };
  $('#searchInput').addEventListener('input', e => renderHistory(e.target.value));
  refreshMe();

  const pm = $('#plusMenu');
  $('#plusBtn').onclick = e => { e.stopPropagation(); pm.classList.toggle('hidden'); };
  document.addEventListener('click', e => { if(!pm.classList.contains('hidden') && !e.target.closest('#plusMenu') && !e.target.closest('#plusBtn')) pm.classList.add('hidden'); });
  document.querySelectorAll('#plusMenu [data-plus]').forEach(b => b.onclick = () => {
    pm.classList.add('hidden');
    const k = b.dataset.plus;
    if(k==='gallery'){ if(!needLogin('mengirim gambar')) return; $('#fileGallery').click(); }
    else if(k==='camera'){ if(!needLogin('mengambil foto')) return; $('#fileCamera').click(); }
    else if(k==='file'){ if(!needLogin('mengirim file')) return; $('#fileAny').click(); }
    else if(k==='generate'){ if(!needLogin('membuat gambar')) return; imgMode='generate'; setModeChip(); refreshComposerPlaceholder(); inputEl.focus(); }
    else if(k==='edit'){ if(!needLogin('mengedit gambar')) return; $('#fileEditImg').click(); }
    else if(k==='videogen'){ if(!needLogin('membuat video')) return; imgMode='videogen'; setModeChip(); refreshComposerPlaceholder(); inputEl.focus(); }
    else if(k==='videoanim'){ if(!needLogin('menganimasikan gambar')) return; $('#fileAnimImg').click(); }
  });
  $('#fileGallery').onchange = e => { handlePicked('img', e.target.files[0]); e.target.value=''; };
  $('#fileCamera').onchange = e => { handlePicked('img', e.target.files[0]); e.target.value=''; };
  $('#fileAny').onchange = e => { handlePicked('file', e.target.files[0]); e.target.value=''; };
  $('#fileEditImg').onchange = e => { handlePicked('editimg', e.target.files[0]); e.target.value=''; };
  $('#fileAnimImg').onchange = e => { handlePicked('animimg', e.target.files[0]); e.target.value=''; };
  $('#fileWallpaper').onchange = async e => {
    const f = e.target.files[0]; e.target.value='';
    if(!f) return;
    if(f.size > 12*1024*1024){ alert(T('maxSize')); return; }
    const du = await readFileAs('dataurl', f);
    SET.wallpaper = { type: f.type.startsWith('video') ? 'video' : 'image', src:du };
    if(!save('lc_set', SET)) alert(T('wpTooBig'));
    applyWallpaper(); buildWallpapers();
  };
  $('#wpUploadBtn').onclick = () => $('#fileWallpaper').click();

  $('#modeChipX').onclick = () => { imgMode=null; editImgFile=null; animImgFile=null; setModeChip(); refreshComposerPlaceholder(); };
  $('#attachX').onclick = () => { attach=null; editImgFile=null; animImgFile=null; imgMode=null; setModeChip(); setAttachPreview(); };

  // Long-press pada pesan AI -> popup reaction
  function pressTargetFrom(e){
    const t = e.target;
    const ai = t && t.closest ? t.closest('.msg.ai') : null;
    if(!ai) return null;
    if(t.closest('.ai-actions') || t.closest('a') || t.closest('.codebox')) return null;
    return ai;
  }
  msgsEl.addEventListener('touchstart', e => {
    const ai = pressTargetFrom(e);
    if(ai) startPress(ai);
  }, { passive:true });
  msgsEl.addEventListener('touchend', cancelPress, { passive:true });
  msgsEl.addEventListener('touchmove', cancelPress, { passive:true });
  msgsEl.addEventListener('touchcancel', cancelPress, { passive:true });
  msgsEl.addEventListener('mousedown', e => {
    if(e.button !== 0) return;
    const ai = pressTargetFrom(e);
    if(ai) startPress(ai);
  });
  msgsEl.addEventListener('mouseup', cancelPress);
  msgsEl.addEventListener('mouseleave', cancelPress);

  // Klik emoji reaction
  document.querySelectorAll('#reactEmojiPopup [data-emoji]').forEach(b => {
    b.onclick = () => { if(reactIdx != null) applyReaction(reactIdx, b.dataset.emoji); };
  });
  $('#reactDelete').onclick = () => {
    const idx = reactIdx; hideReactPopups();
    if(idx == null || !cur.messages[idx]) return;
    stopSpeaking();
    cur.messages.splice(idx, 1); setTitle(); saveChats(); renderAll();
  };
  $('#reactCopy').onclick = () => {
    const m = reactIdx != null && cur.messages[reactIdx];
    if(m) copyText(m.text || '');
    hideReactPopups();
  };
  $('#reactSelect').onclick = () => {
    const idx = reactIdx; hideReactPopups();
    if(idx == null) return;
    const div = msgsEl.querySelector('.msg.ai[data-idx="'+idx+'"]');
    if(!div) return;
    div.classList.add('selectable');
    const sel = window.getSelection();
    sel.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(div);
    sel.addRange(range);
  };
  // Ketuk di luar popup menutup popup + menghilangkan seleksi biru
  function clearBlueSelection(){
    const sel = window.getSelection();
    if(sel && !sel.isCollapsed){ try{ sel.removeAllRanges(); }catch(_){} }
    document.querySelectorAll('.msg.ai.selectable').forEach(d => d.classList.remove('selectable'));
  }
  function safeClosest(el, sel){
    try{ return el && el.closest ? el.closest(sel) : null; }catch(_){ return null; }
  }
  // Ketuk di luar popup menutup popup + menghilangkan seleksi biru
  document.addEventListener('click', e => {
    const pe = $('#reactEmojiPopup'), pa = $('#reactActPopup');
    const anyOpen = !pe.classList.contains('hidden') || !pa.classList.contains('hidden');
    if(anyOpen && !safeClosest(e.target,'#reactEmojiPopup') && !safeClosest(e.target,'#reactActPopup') && !safeClosest(e.target,'.msg.ai')){
      hideReactPopups();
    }
    // Ketuk biasa di luar pesan AI -> hilangkan seleksi biru
    if(!safeClosest(e.target,'.msg.ai')) clearBlueSelection();
  });

  $('#sendBtn').onclick = () => { if(streaming){ if(aborter) aborter.abort(); } else send(); };

  /* ---------- Input suara: rekam -> Deepgram STT -> isi ke textarea ---------- */
  let micRecorder = null, micChunks = [], micStream = null;
  const micBtn = $('#micBtn');
  function stopMicTracks(){
    if(micStream){ micStream.getTracks().forEach(t => { try{ t.stop(); }catch(_){} }); micStream = null; }
  }
  async function toggleMic(){
    if(micRecorder && micRecorder.state === 'recording'){
      try{ micRecorder.stop(); }catch(_){}
      return;
    }
    if(!needLogin('memakai input suara')) return;
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined'){
      alert(T('micError'));
      return;
    }
    let stream;
    try{
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }catch(e){
      alert(T('micDenied'));
      return;
    }
    micStream = stream;
    micChunks = [];
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
      : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
    try{
      micRecorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    }catch(e){
      stopMicTracks();
      alert(T('micError'));
      return;
    }
    micRecorder.ondataavailable = e => { if(e.data && e.data.size) micChunks.push(e.data); };
    micRecorder.onstop = async () => {
      micBtn.classList.remove('recording');
      stopMicTracks();
      const blob = new Blob(micChunks, { type: micRecorder.mimeType || 'audio/webm' });
      micChunks = [];
      if(blob.size < 1000){ alert(T('noSpeech')); return; }
      const oldPh = inputEl.placeholder;
      inputEl.placeholder = '...';
      try{
        const fd = new FormData();
        fd.append('audio', blob, 'voice.webm');
        const r = await fetch('/api/transcribe', { method:'POST', body: fd });
        const j = await r.json().catch(() => ({}));
        if(!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
        const text = (j.transcript || '').trim();
        if(!text){ alert(T('noSpeech')); return; }
        const cur = inputEl.value;
        inputEl.value = cur ? (cur.replace(/\s+$/,'') + ' ' + text) : text;
        inputEl.dispatchEvent(new Event('input', { bubbles:true }));
        inputEl.focus();
      }catch(e){
        alert(T('transcribeFail') + (e.message || e));
      }finally{
        inputEl.placeholder = oldPh;
      }
    };
    micRecorder.onerror = () => { micBtn.classList.remove('recording'); stopMicTracks(); };
    micBtn.classList.add('recording');
    try{ micRecorder.start(); }catch(e){ micBtn.classList.remove('recording'); stopMicTracks(); alert(T('micError')); }
  }
  if(micBtn) micBtn.onclick = toggleMic;
  inputEl.addEventListener('input', autogrow);
  // Enter = baris baru; pengiriman hanya lewat tombol kirim

  chatEl.addEventListener('scroll', () => {
    stick = (chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight) < 60;
  }, { passive:true });

  msgsEl.addEventListener('click', e => {
    const ab = e.target.closest('.ai-actions button');
    if(ab){
      const wrap = ab.closest('.ai-actions');
      const idx = +wrap.dataset.idx;
      const act = ab.dataset.act;
      if(act === 'speak'){ toggleSpeak(idx, ab); }
      else if(act === 'copy'){ const m = cur.messages[idx]; if(m) copyText(m.text || ''); }
      else if(act === 'retry'){
        if(streaming) return;
        const m = cur.messages[idx];
        if(!m) return;
        stopSpeaking();
        cur.messages.splice(idx, 1);
        renderAll(); saveChats();
        chatAI(m.fileModel || null);
      }
      else if(act === 'del'){
        stopSpeaking();
        if(cur.messages[idx]){ cur.messages.splice(idx, 1); setTitle(); saveChats(); renderAll(); }
      }
      return;
    }
    const vact = e.target.closest('.vid-act');
    if(vact){
      const idx = +vact.dataset.idx, act = vact.dataset.act;
      if(act === 'download') downloadVideo(idx);
      else if(act === 'retry') retryVideo(idx);
      else if(act === 'delete') deleteVideo(idx);
      return;
    }
    const zc = e.target.closest('.zip-link');
    if(zc){
      const blocks = zc._blocks || (zc.closest('.msg')||{})._blocks || [];
      if(blocks.length) downloadCodeZip(blocks);
      return;
    }
    const box = e.target.closest('.codebox');
    if(box){
      const msgEl = box.closest('.msg');
      const blocks = msgEl._blocks || [];
      const b = blocks[+box.dataset.bi];
      if(b) openCodePanel(b, +msgEl.dataset.idx, +box.dataset.bi);
      return;
    }
    const uimg = e.target.closest('.msg.user .user-img, .msg.ai .gen-img');
    if(uimg){
      imgCtx = +uimg.closest('.msg').dataset.idx;
      $('#imgViewerImg').src = uimg.src;
      $('#imgViewer').classList.remove('hidden');
      ivReset();
      return;
    }
    const bub = e.target.closest('.msg.user .bubble, .msg.user .file-card');
    if(bub) showPopup(+bub.closest('.msg').dataset.idx, bub);
    else hidePopup();
  });

  /* ---------- Zoom penampil gambar (cubit / ketuk 2x / geser) ---------- */
  const ivImg = $('#imgViewerImg');
  let ivScale = 1, ivX = 0, ivY = 0;
  const ivTouches = new Map();
  let ivPinch = null, ivLastTap = 0;
  function ivClamp(){
    const w = ivImg.clientWidth || 1, h = ivImg.clientHeight || 1;
    const mx = Math.max(0, (w * ivScale - w) / 2), my = Math.max(0, (h * ivScale - h) / 2);
    ivX = Math.min(mx, Math.max(-mx, ivX));
    ivY = Math.min(my, Math.max(-my, ivY));
  }
  function ivApply(){ ivClamp(); ivImg.style.transform = 'translate(' + ivX + 'px,' + ivY + 'px) scale(' + ivScale + ')'; }
  function ivReset(){ ivScale = 1; ivX = 0; ivY = 0; ivTouches.clear(); ivPinch = null; ivApply(); }
  function ivDist(a, b){ return Math.hypot(a.x - b.x, a.y - b.y); }
  ivImg.addEventListener('pointerdown', e => {
    try { ivImg.setPointerCapture(e.pointerId); } catch(_){}
    ivTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if(ivTouches.size === 2){
      const p = [...ivTouches.values()];
      ivPinch = { dist: ivDist(p[0], p[1]), scale: ivScale };
    }
  });
  ivImg.addEventListener('pointermove', e => {
    if(!ivTouches.has(e.pointerId)) return;
    const prev = ivTouches.get(e.pointerId);
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    ivTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if(ivTouches.size === 2 && ivPinch){
      const p = [...ivTouches.values()];
      const d = ivDist(p[0], p[1]);
      if(d > 0 && ivPinch.dist > 0){
        ivScale = Math.min(4, Math.max(1, ivPinch.scale * d / ivPinch.dist));
        if(ivScale <= 1){ ivX = 0; ivY = 0; }
        ivApply();
      }
    } else if(ivTouches.size === 1 && ivScale > 1){
      ivX += dx; ivY += dy; ivApply();
    }
  });
  const ivEndPointer = e => {
    ivTouches.delete(e.pointerId);
    if(ivTouches.size < 2) ivPinch = null;
    if(ivTouches.size === 0 && ivScale <= 1) ivReset();
  };
  ivImg.addEventListener('pointerup', ivEndPointer);
  ivImg.addEventListener('pointercancel', ivEndPointer);
  ivImg.addEventListener('click', () => {
    const now = Date.now();
    if(now - ivLastTap < 300){
      ivLastTap = 0;
      if(ivScale > 1) ivReset();
      else { ivScale = 2.5; ivX = 0; ivY = 0; ivApply(); }
    } else ivLastTap = now;
  });

  $('#msgCopy').onclick = () => {
    const m = cur.messages[popupIdx];
    if(m) copyText(m.text||'');
    hidePopup();
  };
  $('#msgRetry').onclick = () => {
    const idx = popupIdx; hidePopup();
    if(idx==null || !cur.messages[idx]) return;
    const fm = cur.messages[idx].fileModel || null;
    if(cur.messages[idx+1] && cur.messages[idx+1].role==='ai') cur.messages.splice(idx+1,1);
    renderAll(); saveChats();
    chatAI(fm);
  };
  $('#msgDelete').onclick = () => {
    const idx = popupIdx; hidePopup();
    if(idx==null) return;
    let n = 1;
    if(cur.messages[idx+1] && cur.messages[idx+1].role==='ai') n = 2;
    cur.messages.splice(idx, n);
    setTitle(); saveChats(); renderAll();
  };

  /* ---------- Penampil gambar ---------- */
  const hideViewer = () => { $('#imgViewer').classList.add('hidden'); imgCtx = null; ivReset(); };
  $('#imgViewerClose').onclick = hideViewer;
  $('#imgViewer').addEventListener('click', e => { if(e.target.id === 'imgViewer') hideViewer(); });
  $('#imgViewerDelete').onclick = () => {
    const idx = imgCtx; hideViewer();
    if(idx==null || !cur.messages[idx]) return;
    let n = 1;
    // Hanya pesan pengguna yang menghapus balasan AI di bawahnya
    if(cur.messages[idx].role === 'user' && cur.messages[idx+1] && cur.messages[idx+1].role==='ai') n = 2;
    cur.messages.splice(idx, n);
    setTitle(); saveChats(); renderAll();
  };
  $('#imgViewerDownload').onclick = async () => {
    const src = $('#imgViewerImg').src;
    if(!src) return;
    try {
      const r = await fetch(src);
      if(!r.ok) throw new Error('fetch gagal');
      const blob = await r.blob();
      const ext = (blob.type && blob.type.split('/')[1]) || 'png';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'likechat-' + Date.now() + '.' + ext;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch(e) {
      // Mis. CORS: buka di tab baru agar bisa disimpan manual
      window.open(src, '_blank');
    }
  };

  $('#codeClose').onclick = closePanels;
  $('#codeCopy').onclick = () => { if(codeCtx) copyText(codeCtx.code); };
  $('#codeRetry').onclick = () => {
    if(!codeCtx) return;
    const mi = codeCtx.msgIdx; closePanels();
    let fm = null;
    const um = cur.messages[mi-1];
    if(um && um.role === 'user') fm = um.fileModel || null;
    if(cur.messages[mi] && cur.messages[mi].role==='ai'){ cur.messages.splice(mi,1); }
    renderAll(); saveChats();
    chatAI(fm);
  };
  $('#codeDelete').onclick = () => {
    if(!codeCtx) return;
    const m = cur.messages[codeCtx.msgIdx], bi = codeCtx.bi;
    closePanels();
    if(m && m.text){
      let n = -1;
      m.text = m.text.replace(/```(\w*)\n?([\s\S]*?)(?:```|$)/g, mt => (++n===bi) ? '' : mt);
      saveChats(); renderAll();
    }
    codeCtx = null;
  };
}

/* ---------- Init ---------- */
async function init(){
  try{ const r = await fetch('/api/config'); const j = await r.json(); if(j.models && j.models.length) CFG = j; }catch(e){}
  if(typeof SET.model === 'number') SET.model = (CFG.models[SET.model]||CFG.models[0]||{}).id || null;
  if(!CFG.models.some(m => m.id===SET.model)) SET.model = (CFG.models[0]||{}).id || null;
  buildModelMenu(); applyColor(); buildColors(); applyWallpaper(); applyMode(); applyLang();
  document.querySelectorAll('#modeRow button').forEach(b => b.onclick = () => {
    SET.mode = b.dataset.mode; save('lc_set', SET); applyMode();
  });
  document.querySelectorAll('#langRow button').forEach(b => b.onclick = () => {
    SET.lang = b.dataset.lang; save('lc_set', SET); applyLang();
  });
  try{ const r = await fetch('/api/wallpapers'); WALLS = await r.json(); }catch(e){ WALLS = { categories:[] }; }
  buildWallpapers();
  bindEvents();
  if(!CHATS.length) newChat();
  else { cur = CHATS[0]; renderAll(); renderHistory(); }
  autogrow();
}
document.addEventListener('DOMContentLoaded', init);
