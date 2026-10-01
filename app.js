'use strict';
/* ============ LikeChat ============ */
const $ = s => document.querySelector(s);
const chatEl = $('#chat'), msgsEl = $('#messages'), inputEl = $('#input');

const COLORS = { merah:'#e53935', kuning:'#fdd835', hijau:'#43a047', biru:'#1e88e5', ungu:'#8e24aa', putih:'#f2f2f2', 'abu-abu':'#9e9e9e' };
const DARK_FG = ['kuning','putih'];

function load(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }

let CFG = { models:[{label:'Otomatis',id:'glm-5.3-flash'}], image:{} };
let SET = load('lc_set', { model:0, wallpaper:null, color:'biru' });
let CHATS = load('lc_chats', []);
let cur = null;
let streaming = false, aborter = null;
let attach = null;        // {kind:'image'|'file', dataUrl, text, name}
let imgMode = null;       // 'generate' | 'edit'
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
function md(src){
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
    if((m = t.match(/^[-*]\s+(.*)/))){ if(list!=='ul'){ closeList(); out.push('<ul>'); list='ul'; } out.push('<li>'+m[1]+'</li>'); }
    else if((m = t.match(/^\d+[.)]\s+(.*)/))){ if(list!=='ol'){ closeList(); out.push('<ol>'); list='ol'; } out.push('<li>'+m[1]+'</li>'); }
    else { closeList(); if(t) out.push('<p>'+ln+'</p>'); }
  }
  closeList();
  h = out.join('');
  h = h.replace(/\uE000(\d+)\uE001/g, (m,i) => codeBoxHtml(_blocks[+i], +i));
  return h;
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
  const el=document.createElement('div');
  el.className='zip-card';
  el._blocks=blocks;
  el.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg><span>kode.zip</span><em>'+blocks.length+' file</em>';
  return el;
}

/* ---------- Render pesan ---------- */
function statusText(m){
  const snip = s => { s = String(s||'').replace(/\s+/g,' ').trim(); return s.length > 42 ? s.slice(0,42)+'…' : s; };
  const u = snip(m && m._user);
  const isImg = !!(m && ('gen' in m));
  const phases = isImg
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
    if(m.text || m.gen){ clearInterval(m._timer); m._timer = null; return; }
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
    if(m.text) inner += md(m.text);
    if(!inner) inner = typingHtml(m);
    d.innerHTML = inner;
    d._blocks = _blocks.slice();
    if(d._blocks.length) d.appendChild(zipCardEl(d._blocks));
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
  if(m.text) inner += md(m.text);
  else if(!m.gen) inner += typingHtml(m);
  div.innerHTML = inner;
  div._blocks = _blocks.slice();
  if(div._blocks.length) div.appendChild(zipCardEl(div._blocks));
}

/* ---------- Chat: simpan & riwayat ---------- */
function saveChats(){
  if(!save('lc_chats', CHATS)){
    // localStorage penuh: buang data gambar dari chat lama, coba lagi
    CHATS.forEach((c,ci) => { if(ci < CHATS.length-1) c.messages.forEach(m => { delete m.img; delete m.gen; }); });
    if(!save('lc_chats', CHATS)){
      // masih penuh: buang juga dari chat aktif kecuali pesan terakhir
      cur.messages.forEach((m,i) => { if(i < cur.messages.length-1){ delete m.img; delete m.gen; } });
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
  const modelId = (CFG.models[SET.model] || CFG.models[0]).id;
  const ai = { role:'ai', text:'' };
  cur.messages.push(ai);
  const um = [...cur.messages].reverse().find(x => x.role==='user' && x.text);
  if(um) ai._user = um.text;
  const div = renderMsg(ai, cur.messages.length-1);
  msgsEl.appendChild(div);
  startStatusTimer(div, ai);
  $('#emptyState').style.display = 'none';
  streaming = true; aborter = new AbortController();
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
    if(e.name !== 'AbortError') ai.text = 'Maaf, terjadi kesalahan: ' + e.message;
  }finally{
    streaming = false; aborter = null;
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
  streaming = true;
  try{
    const r = await fetch('/api/image/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ prompt })
    });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error || ('Server '+r.status));
    if(j.url) ai.gen = j.url;
    else if(j.b64) ai.gen = j.b64;
    else throw new Error('Respons gambar tidak dikenal.');
    ai.text = '';
  }catch(e){ ai.text = 'Gagal membuat gambar: ' + e.message; }
  finally{ streaming = false; updateAiMsg(div, ai); maybeScroll(); saveChats(); }
}
async function editImage(file, prompt){
  const ai = { role:'ai', text:'', gen:null, _user:prompt };
  cur.messages.push(ai);
  const div = renderMsg(ai, cur.messages.length-1);
  msgsEl.appendChild(div);
  startStatusTimer(div, ai);
  $('#emptyState').style.display = 'none';
  streaming = true;
  try{
    const fd = new FormData();
    fd.append('image', file);
    fd.append('prompt', prompt);
    const r = await fetch('/api/image/edit', { method:'POST', body:fd });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error || ('Server '+r.status));
    if(j.url) ai.gen = j.url;
    else if(j.b64) ai.gen = j.b64;
    else throw new Error('Respons gambar tidak dikenal.');
    ai.text = '';
  }catch(e){ ai.text = 'Gagal mengedit gambar: ' + e.message; }
  finally{ streaming = false; updateAiMsg(div, ai); maybeScroll(); saveChats(); }
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
  if(!text && !attach) return;
  const um = { role:'user', text:text };
  let useFileModel = null;
  if(attach){
    if(attach.kind === 'image'){ um.img = attach.dataUrl; }
    else { um.file = { name:attach.name, content:attach.text }; useFileModel = 'kimi-k3'; um.fileModel = 'kimi-k3'; }
  }
  pushUserObj(um); clearComposer();
  await chatAI(useFileModel);
}
function pushUserObj(um){
  cur.messages.push(um); setTitle(); saveChats(); renderAll();
}
function clearComposer(){
  inputEl.value = ''; autogrow();
  attach = null; imgMode = null; editImgFile = null;
  $('#attachBar').classList.add('hidden');
  $('#modeChip').classList.add('hidden');
}
function autogrow(){
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 150) + 'px';
  $('#inputPill').classList.toggle('tall', inputEl.scrollHeight > 32);
}
function setAttachPreview(){
  const bar = $('#attachBar');
  if(attach && attach.kind === 'image'){ $('#attachImg').src = attach.dataUrl; $('#attachName').textContent = attach.name; bar.classList.remove('hidden'); }
  else if(attach){ $('#attachImg').src = ''; $('#attachName').textContent = attach.name; bar.classList.remove('hidden'); }
  else bar.classList.add('hidden');
}
function setModeChip(){
  const chip = $('#modeChip');
  if(imgMode === 'generate'){ $('#modeChipText').textContent = 'Buat Gambar'; chip.classList.remove('hidden'); }
  else if(imgMode === 'edit'){ $('#modeChipText').textContent = 'Edit Gambar'; chip.classList.remove('hidden'); }
  else chip.classList.add('hidden');
}

/* ---------- Panel & scrim ---------- */
const PANELS = ['drawer','infoPanel','settings','codePanel'];
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
}

/* ---------- Model ---------- */
function buildModelMenu(){
  const menu = $('#modelMenu');
  menu.innerHTML = '';
  CFG.models.forEach((m,i) => {
    const b = document.createElement('button');
    b.className = i===SET.model ? 'on' : '';
    b.innerHTML = '<span>'+esc(m.label)+'</span><svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
    b.onclick = () => { SET.model = i; save('lc_set', SET); buildModelMenu(); menu.classList.add('hidden'); };
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
    box.innerHTML = '<div style="font-size:13px;color:var(--ink-dim)">Belum ada wallpaper. Taruh file di folder assets/wallpapers/</div>';
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
    b.setAttribute('aria-label', name);
    b.onclick = () => { SET.color = name; save('lc_set', SET); applyColor(); buildColors(); };
    row.appendChild(b);
  });
}

/* ---------- Popup aksi pesan ---------- */
function hidePopup(){ $('#msgPopup').classList.add('hidden'); popupIdx = null; }
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
    if(!file.type.startsWith('image/')){ alert('Untuk Edit Gambar, pilih file gambar.'); return; }
    editImgFile = file; imgMode = 'edit';
    // Tampilkan review gambar seperti pratinjau File/Galeri/Kamera
    attach = { kind:'image', dataUrl: await readFileAs('dataurl', file), name:file.name };
    setModeChip(); setAttachPreview(); inputEl.focus();
    return;
  }
  // Pilihan baru (galeri/kamera/file) membatalkan mode edit gambar yang tertunda
  editImgFile = null; if(imgMode === 'edit'){ imgMode = null; setModeChip(); }
  if(file.type.startsWith('image/')){
    const du = await readFileAs('dataurl', file);
    attach = { kind:'image', dataUrl:du, name:file.name };
  } else {
    // File non-teks (PDF, DOCX, ZIP, dsb) JANGAN dibaca mentah: isinya biner
    // dan hanya jadi sampah tak terbaca kalau dikirim ke AI.
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isText = file.type.startsWith('text/') || file.type === 'application/json' || TEXT_EXTS.includes(ext);
    if(!isText){ alert('Format file belum didukung. Untuk saat ini AI hanya bisa membaca file teks (txt, md, json, kode, dll).'); return; }
    if(file.size > 300*1024){ alert('File terlalu besar (maks 300KB teks).'); return; }
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
  $('#searchInput').addEventListener('input', e => renderHistory(e.target.value));

  const pm = $('#plusMenu');
  $('#plusBtn').onclick = e => { e.stopPropagation(); pm.classList.toggle('hidden'); };
  document.addEventListener('click', e => { if(!pm.classList.contains('hidden') && !e.target.closest('#plusMenu') && !e.target.closest('#plusBtn')) pm.classList.add('hidden'); });
  document.querySelectorAll('#plusMenu [data-plus]').forEach(b => b.onclick = () => {
    pm.classList.add('hidden');
    const k = b.dataset.plus;
    if(k==='gallery') $('#fileGallery').click();
    else if(k==='camera') $('#fileCamera').click();
    else if(k==='file') $('#fileAny').click();
    else if(k==='generate'){ imgMode='generate'; setModeChip(); inputEl.placeholder='Deskripsikan gambar yang ingin dibuat...'; inputEl.focus(); }
    else if(k==='edit'){ $('#fileEditImg').click(); }
  });
  $('#fileGallery').onchange = e => { handlePicked('img', e.target.files[0]); e.target.value=''; };
  $('#fileCamera').onchange = e => { handlePicked('img', e.target.files[0]); e.target.value=''; };
  $('#fileAny').onchange = e => { handlePicked('file', e.target.files[0]); e.target.value=''; };
  $('#fileEditImg').onchange = e => { handlePicked('editimg', e.target.files[0]); e.target.value=''; };
  $('#fileWallpaper').onchange = async e => {
    const f = e.target.files[0]; e.target.value='';
    if(!f) return;
    if(f.size > 12*1024*1024){ alert('Ukuran maksimal 12MB.'); return; }
    const du = await readFileAs('dataurl', f);
    SET.wallpaper = { type: f.type.startsWith('video') ? 'video' : 'image', src:du };
    if(!save('lc_set', SET)) alert('Wallpaper terlalu besar untuk disimpan permanen, tapi tetap dipakai sesi ini.');
    applyWallpaper(); buildWallpapers();
  };
  $('#wpUploadBtn').onclick = () => $('#fileWallpaper').click();

  $('#modeChipX').onclick = () => { imgMode=null; editImgFile=null; setModeChip(); inputEl.placeholder='Tulis pesan...'; };
  $('#attachX').onclick = () => { attach=null; editImgFile=null; imgMode=null; setModeChip(); setAttachPreview(); };

  $('#sendBtn').onclick = send;
  inputEl.addEventListener('input', autogrow);
  // Enter = baris baru; pengiriman hanya lewat tombol kirim

  chatEl.addEventListener('scroll', () => {
    stick = (chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight) < 60;
  }, { passive:true });

  msgsEl.addEventListener('click', e => {
    const zc = e.target.closest('.zip-card');
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
  if(SET.model >= CFG.models.length) SET.model = 0;
  buildModelMenu(); applyColor(); buildColors(); applyWallpaper(); applyMode();
  document.querySelectorAll('#modeRow button').forEach(b => b.onclick = () => {
    SET.mode = b.dataset.mode; save('lc_set', SET); applyMode();
  });
  try{ const r = await fetch('/api/wallpapers'); WALLS = await r.json(); }catch(e){ WALLS = { categories:[] }; }
  buildWallpapers();
  bindEvents();
  if(!CHATS.length) newChat();
  else { cur = CHATS[0]; renderAll(); renderHistory(); }
  autogrow();
}
document.addEventListener('DOMContentLoaded', init);
