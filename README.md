# RPG 3D Mobile Prototype

Prototype game RPG 3D berbasis HTML5, CSS3, JavaScript ES Modules murni, dan Three.js yang dirancang khusus untuk browser smartphone (Android & iOS) dan desktop.

---

## 📁 Struktur File Modular

Proyek ini dibangun secara modular menggunakan JavaScript ES Modules (`import`/`export`) tanpa file monolitik:

```
RPG-3D-Mobile-Prototype/
├── index.html           # Struktur HTML, mobile viewport, CDN import map Three.js
├── style.css            # Styling fullscreen, landscape layout, touch constraints
├── main.js              # Entry point aplikasi & 60 FPS delta-time game loop
├── world.js             # Scene Three.js, pencahayaan 3-titik terang, fog, renderer
├── floor.js             # Lantai 3D 140x140 dengan CanvasTexture checkerboard tajam (Y=0)
├── player.js            # Karakter Cube biru, panah 3D, interpolasi rotasi, jump physics
├── camera.js            # Third-person camera, follow smooth, orbit 360°, pitch clamp
├── controls.js          # Virtual joystick, jump button, camera touch, multitouch isolated
├── ui.js                # Minimalist inline SVG UI (joystick, jump, portrait overlay)
├── utils.js             # Helper functions: clamp, lerp, lerpAngle, damp, scratch vectors
└── README.md            # Dokumentasi lengkap sistem dan instruksi instalasi
```

---

## 🎮 Fitur & Mekanisme Utama

### 1. Sistem Kontrol Third-Person
* **Movement Relative to Camera**: Arah pergerakan karakter mengikuti orientasi horizontal kamera (bidang XZ). Mendorong joystick ke atas selalu menggerakkan karakter ke depan arah pandang kamera.
* **Smooth Turning**: Rotasi karakter menggunakan interpolasi `lerpAngle` terpendek agar perputaran tubuh berjalan halus dan tidak menyentak saat berpindah arah.
* **3D Directional Arrow**: Penanda arah 3D berwarna cyan terpasang di atas karakter dan selalu sinkron dengan arah hadap karakter.

### 2. Third-Person Camera 360°
* **Smooth Camera Follow**: Kamera mengikuti posisi target karakter secara dinamis menggunakan interpolasi lerp.
* **Orbit 360° & Pitch Control**: Area layar selain tombol dapat di-swipe untuk memutar sudut yaw kamera 360° dan mengatur sudut pitch vertikal (dibatasi antara -14° hingga +60° untuk mencegah flipping dan tembus lantai).

### 3. Sistem Lompat (Jump Physics)
* **Velocity & Gravitasi**: Dihitung berbasis delta time (`verticalVelocity += gravity * delta`), menjaga ketinggian dan durasi lompat konsisten di berbagai refresh rate layar (60Hz, 90Hz, 120Hz).
* **Anti Double-Jump**: Karakter hanya dapat melompat saat menyentuh tanah (`isGrounded = true`). Tombol jump dinonaktifkan ketika berada di udara.
* **Ground Detection**: Karakter tidak dapat menembus lantai (posisi Y terkunci tepat pada permukaan Y = 0).

### 4. Kontrol Sentuh Mobile (Multi-Touch)
* **Pointer Events & Pointer ID**: Setiap sentuhan (Joystick, Kamera, Tombol Jump) dikelola dengan `pointerId` independen.
* **Multi-touch Concurrency**: Pemain dapat menggerakkan joystick, menggeser kamera, dan menekan tombol lompat secara bersamaan tanpa saling mengganggu.
* **Virtual Joystick**: Lingkaran luar + knob tengah dengan batasan radius dan auto-recenter yang halus saat jari dilepas.
* **Desktop Fallback**: Mendukung kontrol keyboard (`WASD` / tombol panah untuk bergerak, `Space` untuk lompat, dan drag mouse untuk memutar kamera).

### 5. UI Minimalis (Inline SVG)
* Murni menggunakan inline SVG tanpa dependensi gambar PNG atau font eksternal.
* Warna putih transparan minimalis (opacity 0.25 - 0.45) agar 85%+ layar tetap bersih untuk dunia 3D.
* Tanpa elemen yang mengganggu (tidak ada health bar, minimap, logo, atau watermark).

### 6. Mode Landscape & Fullscreen
* Otomatis menampilkan overlay animasi "Putar ke mode Landscape" saat perangkat berada dalam posisi portrait.
* Mendukung permintaan Screen Orientation API (`orientation.lock('landscape')`) dan Fullscreen API pada interaksi pertama pemain.

---

## 🚀 Cara Menjalankan

### Cara 1: Local Server Statis (Tanpa Instalasi Build Tool)
Karena proyek ini menggunakan ES Modules murni dan CDN import map, Anda dapat langsung menjalankannya dengan web server lokal apapun:

```bash
# Menggunakan Node.js npx serve
npx serve .

# Atau menggunakan Python 3
python3 -m http.server 3000
```
Buka browser di `http://localhost:3000`.

### Cara 2: Vite Dev Server
```bash
npm install
npm run dev
```
Buka URL lokal yang ditampilkan (default port 3000).

---

## ⚙️ Variabel Fisika yang Mudah Dimodifikasi (`player.js`)

* `moveSpeed` (default: `8.0` units/sec) - Kecepatan jalan karakter.
* `jumpForce` (default: `9.8` units/sec) - Gaya dorong awal saat melompat.
* `gravity` (default: `-24.0` units/sec²) - Percepatan gravitasi ke bawah.
* `rotationSpeed` (default: `14.0`) - Kecepatan interpolasi rotasi tubuh.
