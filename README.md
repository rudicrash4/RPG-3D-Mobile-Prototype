# RPG-3D-Mobile-Prototype-Fixed

Prototype game RPG 3D berbasis HTML5, CSS3, JavaScript ES Modules, dan Three.js yang dirancang khusus untuk smartphone Android/iOS dan mendukung deployment statis langsung di **GitHub Pages** (termasuk repository subpath).

---

## 📁 Struktur File Modular

Proyek ini dibangun dengan struktur modular terpisah:

```
RPG-3D-Mobile-Prototype-Fixed/
├── index.html                   # Entry point HTML dengan path relatif (./) & import map Three.js
├── style.css                    # Fullscreen 100dvh, layout landscape, touch-action none
├── main.js                      # Entry point JavaScript & 60 FPS requestAnimationFrame game loop
├── world.js                     # Scene Three.js, lighting rig, background putih, horizon fog
├── floor.js                     # Lantai 3D 140×140 (Y = 0) dengan checkerboard tajam & pilar penanda
├── player.js                    # Karakter Cube biru, panah 3D, rotasi terpendek, jump physics
├── camera.js                    # Kamera third-person 360°, pitch clamp, exponential damping follow
├── controls.js                  # Multi-touch pointer tracking (joystick, jump, camera orbit independen)
├── ui.js                        # UI minimalis inline SVG (joystick, jump, portrait warning overlay)
├── utils.js                     # Helper matematika (clamp, lerp, lerpAngle, damp, scratch Vector3)
├── vite.config.ts               # Konfigurasi Vite dengan base: './' untuk GitHub Pages subpath
├── package.json                 # Dependensi & skrip build
├── tsconfig.json                # Konfigurasi TypeScript
├── .nojekyll                    # Mencegah Jekyll mengabaikan asset pada GitHub Pages
├── .github/workflows/deploy.yml # Workflow otomatis GitHub Actions untuk GitHub Pages
└── README.md                    # Dokumentasi lengkap proyek
```

---

## 🚀 Perbaikan Utama yang Telah Dilakukan

### 1. Hosting GitHub Pages & Asset Paths
- **Path Relatif**: Mengubah seluruh pemanggilan asset pada `index.html` dari root absolut (`/style.css`, `/main.js`) menjadi path relatif (`./style.css`, `./main.js`).
- **Vite Base Path**: Menambahkan `base: './'` pada `vite.config.ts` sehingga hasil kompilasi `dist/` dapat berjalan sempurna pada GitHub Pages dengan subpath repositori (`https://username.github.io/repo-name/`) maupun domain root.
- **Bypass Jekyll**: Menambahkan berkas `.nojekyll` di root dan direktori `public/` agar file bundler Vite tidak diabaikan oleh engine GitHub Pages.
- **Workflow Otomatis**: Menyediakan `.github/workflows/deploy.yml` siap pakai yang secara otomatis meng-build dan men-deploy branch `main` ke GitHub Pages menggunakan GitHub Actions resmi (`actions/deploy-pages@v4`).

### 2. Peningkatan Sistem Kamera Third-Person (`camera.js`)
- **Rotasi 360° Penuh**: Sudut yaw berputar bebas tanpa batasan derajat dengan normalisasi sudut terbungkus rapi tanpa snapping.
- **Batas Pitch & Ground Clearance**: Pitch dibatasi antara `-8.6°` (melihat sedikit ke atas) hingga `+60°` (melihat ke bawah), dilengkapi penjaga ketinggian (`camY >= 0.45`) sehingga kamera tidak akan pernah tembus atau masuk ke dalam lantai.
- **Exponential Damping Follow**: Mengikuti pergerakan pemain menggunakan rumus interpolasi `1 - Math.exp(-followSpeed * delta)` yang stabil dan konsisten di berbagai refresh rate layar (60Hz, 90Hz, 120Hz).
- **Sensitivitas Terkonfigurasi**: Variabel `cameraSensitivity`, `cameraPitchSensitivity`, dan `cameraInvertY` tersedia dan dapat disesuaikan dengan mudah.
- **Gerakan Relatif Kamera**: Arah maju joystick selalu mengikuti arah hadap kamera horizontal (bidang XZ). Saat kamera diputar 180°, karakter otomatis berjalan ke arah pandang kamera yang baru.

### 3. Sistem Gerak & Jump Physics (`player.js`)
- **Rotasi Halus Karakter**: Menggunakan interpolasi sudut terpendek `lerpAngle` dengan exponential damping sehingga karakter berputar mulus tanpa hentakan mendadak.
- **Fisika Lompat & Gravitasi**: Menggunakan `verticalVelocity`, `jumpForce = 9.8`, dan `gravity = -24.0` berbasis delta time (`delta <= 0.05`).
- **Anti Double-Jump**: Karakter hanya dapat melompat saat menyentuh tanah (`isGrounded = true`). Tombol jump dinonaktifkan ketika berada di udara.
- **Konsistensi Ground**: Lantai berada tepat pada posisi Y = 0; karakter dan bayangan mendarat tanpa getaran atau penetrasi lantai.

### 4. Kontrol Mobile & Multi-Touch Concurrency (`controls.js`)
- **Isolasi Pointer Events**: Masing-masing kontrol (Virtual Joystick, Kamera Swipe, dan Tombol Jump) melacak `pointerId` independen dengan `setPointerCapture` dan penanganan `lostpointercapture`.
- **Dukungan Multi-Sentuhan Penuh**: Pemain dapat berjalan menggunakan joystick (kiri bawah) sambil memutar kamera (tengah/kanan) dan melompat (kanan bawah) secara bersamaan tanpa saling mengganggu.
- **Pembersihan Event Menyeluruh**: Kontrol otomatis kembali ke titik tengah jika jari terlepas (`pointerup`), dibatalkan sistem HP (`pointercancel`), atau window kehilangan fokus (`blur`).
- **Fallback Desktop**: Mendukung tombol keyboard `WASD` / panah untuk berjalan, `Space` untuk melompat, dan drag mouse untuk memutar kamera.

### 5. UI Minimalis Murni Inline SVG (`ui.js` & `style.css`)
- Hanya menampilkan **Virtual Joystick** di kiri bawah dan **Tombol Jump** di kanan bawah.
- Desain visual kontras tinggi dengan lingkaran latar transparan gelap (`rgba(15, 23, 42, 0.45)`), garis tepi putih solid, dan drop shadow tebal agar terlihat jelas di atas lantai putih maupun abu-abu.
- **Portrait Warning Overlay**: Saat HP berada pada orientasi portrait, otomatis menampilkan animasi ikon HP berputar dan teks "Putar ke mode Landscape", serta menyembunyikan joystick dan jump button sesuai spesifikasi. Saat diputar ke landscape, overlay langsung tertutup dan kontrol aktif.

---

## 🛠️ Cara Menjalankan & Membangun Proyek

### 1. Development Lokal (Vite)
```bash
npm install
npm run dev
```
Akses di browser: `http://localhost:3000`

### 2. Build untuk Produksi
```bash
npm run build
```
Hasil build siap hosting akan berada di folder `dist/`.

### 3. Menjalankan Preview Hasil Build
```bash
npm run preview
```

---

## 🌐 Panduan Deployment ke GitHub Pages

### Opsi A: Menggunakan GitHub Actions (Otomatis - Direkomendasikan)
1. Push repository ini ke GitHub (branch `main`).
2. Masuk ke halaman repositori di GitHub: **Settings** > **Pages**.
3. Pada bagian **Build and deployment** > **Source**, pilih **GitHub Actions**.
4. GitHub Actions akan secara otomatis menjalankan workflow `.github/workflows/deploy.yml` dan mempublikasikan game ke URL `https://<username>.github.io/<repository-name>/`.

### Opsi B: Menggunakan Branch `gh-pages` Manual
1. Jalankan `npm run build`.
2. Deploy isi folder `dist/` (termasuk file `dist/.nojekyll`) ke branch `gh-pages`.
3. Pada menu **Settings** > **Pages**, pilih Source: **Deploy from a branch** > branch `gh-pages` / `root`.
