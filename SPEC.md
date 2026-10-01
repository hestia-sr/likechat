# LikeChat — Spesifikasi Proyek (dicatat 2026-09-29)

## Identitas
- Nama aplikasi: **LikeChat**
- Logo: `assets/logo.jpg` (rantai melingkar) — selalu tampil **bulat**
- Layar kosong: logo besar + tulisan "LikeChat" di tengah layar
- Kepala drawer hamburger: logo bulat kecil + "LikeChat" di sampingnya

## Fungsi utama
- **text2text**, **text2img**, **img2img**
- UI & fungsi ala Genspark AI Chat — **semua tombol harus berfungsi**, tidak ada yang pajangan

## Konfigurasi API (file `.env`)
### Text2text — OpenAI-compatible
- `TEXT_BASE_URL=https://api.hcnsec.cn/v1`
- `TEXT_API_KEY_1` s/d `TEXT_API_KEY_5` — **failover otomatis**: key habis/error → pindah ke key berikutnya
- Model (label > id) untuk pilihan model:
  - Otomatis > `glm-5.3-flash`
  - Sedang > `space-bunny-free`
  - Codex > `DeepSeek-V4-Pro`
  - Pintar > `kimi-k3`
  - Akurat > `step-5-preview`
- File yang diupload (+ > File) dianalisis memakai model `kimi-k3`

### Text2img — OpenAI-compatible
- `IMAGE_GEN_URL=https://api.deapi.ai/api/v2/images/generations` — ASINKRON: POST hanya mengembalikan `{data:{request_id}}`, server polling `GET {origin}/api/v2/jobs/{request_id}` tiap 3 detik (maks 5 menit) sampai `status=done` lalu teruskan `result_url` ke klien sebagai `{url}`
- `IMAGE_API_KEY_1` s/d `IMAGE_API_KEY_3` — failover otomatis
- Model: `Flux_2_Klein_4B_BF16`, width 768, height 1360, seed 2279401600, steps 4

### Img2img — OpenAI-compatible
- `IMAGE_EDIT_URL=https://api.deapi.ai/api/v2/images/edits` — asinkron seperti generate (submit multipart `image` + polling job sampai `result_url`)
- File menu hanya menerima file TEKS (txt, md, json, kode, dll); format biner (PDF/DOCX/ZIP) ditolak dengan peringatan, tidak dikirim mentah ke AI
- Pakai `IMAGE_API_KEY_1..3` yang sama
- Model: `Flux_2_Klein_4B_BF16`, width 768, height 1360, steps 4

## Aturan desain
- **Tanpa Tailwind CDN** — CSS biasa + SVG inline saja
- **Ikon saja** — tanpa emoji, tanpa label teks pada tombol
- Elegan, rapi, cantik, **ringan**
- Tombol & teks tombol **tidak bisa diseleksi** (`user-select:none`, tanpa kotak biru saat ditahan lama)
- Tombol +, tombol kirim: **bulat sempurna**
- Layar utama **tidak bisa di-zoom** (`maximum-scale=1.0, user-scalable=no`)
- Panel ketik: **pil panjang bulat**, melebar ke atas saat pesan panjang (ada batas maksimal), tombol + & kirim **tetap di tempat**

## Header atas
- Kiri: ikon hamburger (garis-garis) — buka drawer
- Tengah: tombol pilihan model
- Kanan: tombol titik tiga vertikal — buka sidebar setengah layar
- Tanpa garis pembatas / container — bersih melayang
- Kabut tipis merata kiri-ke-kanan di belakang tombol model (jangan menutupi tombolnya)

## Chat
- AI **streaming bertahap** (tidak sekaligus — anti ngelag/macet)
- Layar **tidak ketarik ke bawah** saat AI mengirim pesan panjang
- Pesan AI: render markdown (tebal, miring, kecil, coret, kode, list, dll)
- Teks AI sedikit tebal + cahaya tipis (tetap terbaca di atas wallpaper)
- Pesan AI tidak boleh melebar keluar layar; link bisa disentuh untuk dibuka
- Bubble pesan pengguna **menyesuaikan isi** (pendek=pendek, panjang=memanjang)
- Pesan pengguna ditekan → popup kecil berisi **ikon**: salin, ulang, hapus
- Blok kode (html/js/css/python/dll): kotak kecil **berlabel nama bahasa** (ala Claude) → disentuh buka sidebar kode berisi ikon: keluar, salin, ulang, hapus
- **Pencarian web otomatis** (2026-10-01): bila pertanyaan butuh info terkini (kata kunci: terbaru/terkini/hari ini/harga/berita/cuaca/skor/jadwal/dll, atau menyebut tahun), server otomatis mencari di DuckDuckGo (gratis, tanpa key) lalu menyelipkan hasilnya ke AI. Jalan untuk semua model tanpa ganti model. Config: `WEB_SEARCH=1`, `WEB_SEARCH_MAX_RESULTS=5`

## Drawer hamburger (kiri)
1. Pesan Baru
2. Cari Pesan
3. Riwayat Pesan
4. Hapus Riwayat
5. Info → sidebar kecil animasi ringan berisi:
   "Web app ini langsung di ciptakan oleh Hestia Sri Rose Dari Keluarga Besar SR Produksi. Jika anda menemukan Bug atau Error Hubungi Kami Melalui email di bawah ini"
   hestia.sri.rosee@gmail.com

## Sidebar titik tiga (kanan, setengah layar)
- **Wallpaper**: kategori bawaan, anime, donghua, awan, angkasa, gunung, lautan, artis-indonesia, artis-china, artis-jepang
  - Folder: `assets/wallpapers/`, nama file `<kategori>.<ext>` (cth: `anime.jpg`, `awan.mp4`); banyak file per kategori tambah angka (`anime-1.jpg`)
  - Pengguna bisa upload wallpaper sendiri: foto **atau video**
  - Server otomatis membaca folder (tanpa edit kode)
- **Warna semua tombol**: merah, kuning, hijau, biru, ungu, putih, abu-abu

## Tombol + (ikon saja)
Galeri, Kamera, File, Buat Gambar, Edit Gambar

## Struktur file (rencana, ~9 file)
index.html, styles.css, app.js, server.js, package.json, .env, .env.example, render.yaml, assets/logo.jpg

## Status
**ON HOLD** — jangan tulis kode sebelum Hestia bilang mulai.

## Standar kualitas
WAJIB sempurna dan layak digunakan — semua fitur diuji berfungsi sebelum diserahkan.

## QA sebelum kirim ZIP (wajib)
Sebelum file ZIP diserahkan ke Hestia:
1. Baca & teliti SEMUA file satu per satu.
2. Uji lokal: syntax check, server jalan, semua endpoint API berfungsi (dengan failover key).
3. Uji UI di browser: setiap tombol diklik & dipastikan berfungsi, tidak ada layar putih/blank, tidak ada bug.
4. Perbaiki semua masalah dulu — ZIP hanya dikirim kalau sudah bersih.

## Hasil QA & perbaikan (2026-09-29)
- **QA fungsional 45/45 lolos** (jsdom + DOM asli): empty state, drawer 5 aksi, panel info, cari pesan, riwayat, hapus riwayat (batal aman), chat baru, 5 model + simpan pilihan, settings, 7 warna tombol + tersimpan, menu + 5 item, chip Buat/Edit Gambar + batal, streaming SSE tiruan + Markdown (tebal/miring), empty state hilang setelah chat, popup pesan (3 tombol), salin, hapus pesan, kotak kode + label bahasa + link tappable + panel kode (4 aksi) + tutup, chat tersimpan di localStorage, pilih wallpaper dari folder, tanpa JS error.
- **Uji fokus 10/10 lolos**: scrim muncul/hilang dengan fade untuk drawer/settings/codePanel, klik scrim menutup panel, salin aman tanpa navigator.clipboard (HTTP biasa), fileModel kimi-k3 terkirim ke server, nama file tampil di pesan.
- **Bug yang diperbaiki**:
  1. Tombol salin crash di HTTP biasa (navigator.clipboard tidak ada) → fallback textarea + execCommand.
  2. Retry pesan file kehilangan model kimi-k3 → pesan menyimpan `fileModel`, retry code-block mencari pesan user sebelumnya.
  3. Teks pesan AI tidak bisa diseleksi → `user-select:text` eksplisit.
  4. Scrim (lapisan gelap) tidak pernah muncul → perbaiki class hidden/show + fade.
  5. **Keamanan**: `express.static` menyajikan seluruh folder termasuk `.env` → file sensitif (.env, package.json, server.js, node_modules) kini diblokir 403.
  6. localStorage penuh → buang data gambar chat lama (img + gen) sebelum menyimpan; wallpaper upload terlalu besar → peringatan jujur.
- Panggilan AI asli belum diuji (belum ada API key asli). Isi key di `.env` lalu `npm install && npm start`.
