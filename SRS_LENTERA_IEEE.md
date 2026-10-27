# Software Requirements Specification
## for
## Sistem Informasi Manajemen Desa Wisata
**Berdasarkan Standar:** IEEE Std 830-1998

---

## 1. Introduction

### 1.1 Purpose
Tujuan dari dokumen *Software Requirements Specification* (SRS) ini adalah untuk menetapkan spesifikasi kebutuhan perangkat lunak keseluruhan untuk **Sistem Informasi Manajemen Desa Wisata** (selanjutnya disebut sebagai **LENTERA** - *Location, Education, Navigation of Tourism, E-Resource Application*) **Versi 1.0**. Dokumen ini secara khusus mencakup keseluruhan ruang lingkup fungsionalitas sistem, yang terdiri dari subsistem portal publik berbasis *web* (katalog produk UMKM, peta interaktif, edukasi wisata) dan subsistem kelola data wilayah (Backend API & *Dashboard* Eksekutif) untuk aparatur desa. Spesifikasi ini merupakan acuan formal dari rekayasa kebutuhan perangkat lunak terintegrasi secara *full-stack*.

### 1.2 Document Conventions
Penulisan dokumen SRS ini mengikuti standar pelaporan perangkat lunak teknis. Konvensi tipografi dan standar yang diterapkan meliputi:
- Istilah teknis bahasa asing, bahasa serapan, atau penekanan kata ditulis dengan format miring (*italic*), misal *user interface* atau *client-server*.
- Entitas penting seperti modul sistem ditulis dengan format tebal (**bold**), misal **Dashboard Perangkat Desa** atau **Database Management System (DBMS)**.
- Seluruh persyaratan akan dikodekan (misalnya: `REQ-CAT-01`). Prioritas untuk kebutuhan fungsional tingkat tinggi diasumsikan diwariskan kepada setiap kebutuhan rinci pada sub-tingkatnya kecuali dinyatakan lain.

### 1.3 Intended Audience and Reading Suggestions
Dokumen SRS ini dirancang untuk beberapa kelompok target pembaca:
1. **Manajer Proyek & Aparatur Desa**: Disarankan untuk berfokus pada Bab 1 (*Introduction*) dan Bab 2 (*Overall Description*) untuk memahami arah, cakupan, dan tujuan bisnis sistem LENTERA tanpa masuk ke ranah detail teknis arsitektur.
2. **Pengembang (*Front-End & Back-End Developers*) & Desainer Antarmuka**: Disarankan untuk membaca seluruh dokumen secara runtut, menaruh fokus terbesar pada Bab 3 (*External Interfaces*), Bab 4 (*System Features*), dan Bab 5 untuk implementasi arsitekturnya.
3. **Penguji Perangkat Lunak (*QA / Testers*)**: Disarankan untuk mulai membaca dari ringkasan Bab 2 dan memusatkan spesifikasi validasi pada Bab 4 sebagai landasan penyusunan skenario uji coba (*test cases*).

Secara umum, susunan dokumen bergerak dari tingkat konseptual (Bab 1 dan 2) kepada spesifikasi interaksi sistem (Bab 3), dan berujung pada rincian deskripsi fungsionalitas tiap fitur perangkat lunak (Bab 4).

### 1.4 Product Scope
LENTERA adalah sebuah platform *web application* bernuansa modern skala produksi yang dirancang khusus untuk memajukan digitalisasi potensi desa lokal. Tujuan utamanya adalah memberdayakan pariwisata terpadu, mendukung penjualan produk olahan komunitas melalui fitur Katalog UMKM interaktif terpusat, serta menjadi pusat literasi digital (*E-Resource*). 
Aplikasi selaras dengan strategi bisnis desa guna memperluas nilai ekonomi masyarakat lokal ke ranah publik sekaligus membantu efisiensi administratif tingkat desa melalui penyediaan panel *Dashboard Eksekutif* perihal pemantauan KPI (*Key Performance Indicator*) operasional yang datanya ditarik langsung (secara *real-time*) dari basis data relasional. Sistem ini dibangun menggunakan arsitektur *Client-Server* modern (*Full-Stack*).

### 1.5 References
1. IEEE Standards Board. (1998). *IEEE Recommended Practice for Software Requirements Specifications* (IEEE Std 830-1998). New York: Institute of Electrical and Electronics Engineers.
2. Rencana Pembangunan Jangka Menengah Desa (RPJMDes) Desa Kucur terkait Digitalisasi Administrasi dan Pariwisata.

---

## 2. Overall Description

### 2.1 Product Perspective
LENTERA adalah sebuah produk perangkat lunak baru dan mandiri (*new, self-contained product*) yang secara eksklusif dikembangkan untuk merintis digitalisasi Desa Kucur. Produk ini lahir dari inisiatif untuk menggantikan sistem pencatatan pariwisata dan administrasi UMKM manual ke dalam sistem terpadu satu atap. Walaupun mandiri, ekosistem perangkat lunaknya memiliki celah interkoneksi RESTful API yang kedepannya dirancang sebagai komponen *subsistem* untuk dapat bersinergi dengan Portal *E-Government* skala kabupaten (jika ada). Sistem LENTERA terdiri dari dua komponen antarmuka besar, yakni situs portal publik untuk jangkauan pemasaran dan *Dashboard Back-End* terproteksi (sistem eksekutor). Terdapat arsitektur dasar *Client-Server*, di mana peramban klien berinteraksi dengan sebuah Peladen API (menangani validasi logika bisnis) serta basis data sentral (menyimpan repositori).

### 2.2 Product Functions
Berdasarkan tinjauan tingkat tinggi (*High-Level Summary*), fungsi-fungsi pokok yang dijalankan oleh sistem **LENTERA** merepresentasikan akronim namanya:

| Modul Utama / Grup Fungsi | Ringkasan Fitur dan Fungsionalitas |
| :--- | :--- |
| **H - Home (Katalog Utama)** | Beranda publik berisi rincian katalog produk UMKM (foto/deskripsi, harga, testimoni UMKM terhubung), serta fasilitas *checkout* keranjang. |
| **L - Location (Pemetaan Desa)** | Peta visual interaktif dengan titik marker yang dibedakan kategorinya menggunakan warna (Merah: Fasum; Hijau: Perkebunan; Oranye: Kuliner; Kuning: UMKM Lainnya). Menuntun ke rincian katalog ketika ditekan. |
| **E - Education (Wisata Edukasi)** | Fitur peta pariwisata edukatif dan narasi rujukan bagi pengunjung mengenai produk lokal (seperti referensi belajar kebun Kopi, jeruk, dan ulasan kelompok tani). |
| **N - Navigation of Tourism** | Sistem navigasi peta yang terfokus pada parameter lokasi pengguna saat itu; mampu mengestimasikan jarak pengunjung ke lokasi yang dituju, menampilkan *list* terdekat, serta memberikan layanan peringatan (*emergency contact / Contact me* via WhatsApp admin). |
| **E - E-Resource Application** | Menangani rekam testimoni bebas dari riwayat pesanan (mengambil *data booking*, memfasilitasi input rating 1-5 bintang, *textbox*, hingga unggah foto/video). Serta wadah sentral informasi/buletin Desa bagi admin (*Headline, Terbaru, Arsip*). |
| **S - Sponsorship (Investasi)** | Publikasi transparansi wawan-modal (Grafik pendanaan) dan penyajian registrasi terstruktur untuk inisiasi proposal investor. |
| **Modul Spesifik *Back-End*** | Fungsionalitas tersembunyi yang ditujukan utuh untuk klasifikasi pengguna tata kelola; mencakup panel penarikan dana (*Withdrawal* UMKM), CRUD data admin & informasi, dan validasi *Finance / Approval*. |

*(Pengelompokkan mendetail dari spesifikasi fitur ini akan sangat bergantung pada otorisasi pengguna yang ditangani di level arsitektur berikutnya).*

### 2.3 User Classes and Characteristics
Target demografi (*user classes*) LENTERA sangat luas namun diklasifikasikan dengan batasan hukum akses yang mutlak. Terdiri dari lima (*5*) entitas utama yang secara mendasar menggerakkan rutinitas sirkulasi proses bisnis dan data sistem:

| Kelas Pengguna (*User Class*) | Deskripsi Kelas & Lingkup Interaksi | Batasan Hak Akses & Fitur Utama (*Privileges*) |
| :--- | :--- | :--- |
| **1. Pengunjung** *(Publik)* | Masyarakat umum luar desa yang mendatangi laman LENTERA untuk mencari informasi liburan wisata (Location), memperoleh edukasi, dan memesan katalog. | Interaksi penuh terhadap antarmuka terdepan. Modul yang terlihat konstan: *Home, Location, Education, Navigation, E-Resource* profil testimoni, grafik monitor *Sponsor*, serta Profil *Software house*. |
| **2. Sponsorship** *(Investor)* | Individu/Pemodal komersial yang melakukan investasi *B2B* ke entitas UMKM lokal/mendanai fasilitas desa dengan orientasi penyaluran CSR. | Hanya memenangi hak akses personal atas panel *Dashboard Sponsor* pribadinya, berisikan formulir pembayaran registrasi, penata-bukuan saldo finansial masuk, serta dapat melihat progres/laporan transparan rutin dari tim UMKM terkait. |
| **3. Admin** *(Karang Taruna)* | Pengurus teknis lapang berlatar kepemudaan, dititahkan layaknya staf manajemen portal. Bertanggung jawab mengeksekusi pendataan riil di tataran tanah. | Memegang pintu konfirmasi (*Approval operasional*), melakukan pengkinian pemetaan fasilitas umum, penanda titik wilayah khusus desa, integrasi *Finance* dasar, serta *Approval* awal investor ringan. |
| **4. Penjual** *(Warga/UMKM)* | Masyarakat khusus pelaku dagang/wirausaha asli yang ingin menjual komoditas produk/jasanya terintegrasi di rak pajangan elektronik *Home* LENTERA. | Menguasai pelataran penyusunan katalog lapaknya pribadi. Memegang modul *Withdrawal* (hak penarikan tunai dana transaski), penyematan pemetaan khusus titik kedai/kebun, dan *Approval*. |
| **5. Desa** *(Pemerintah/Eksekutif)* | Pucuk birokrasi tertinggi sistem (*Super Admin*); difungsikan sebagai Pengawas utama (*Supervisor/Monitor*) tanpa diwajibkan capek memelihara pendaftaran teknis minor harian. | *Dashboard* grafikal statistik agregat (Sumber daya alam yang dikeruk, jumlah UMKM aktif, total transaksi). Kontrol **CRUD** mutlak atas *E-Resource* desa; Hak penuh **CRUD** (membuat/mencabut) otorisasi Akun level di bawahnya; serta penyedia *Approval* akhir terhadap lalu-lintas investasi Sponsor masif. |

### 2.4 Operating Environment
Penyebaran perangkat lunak LENTERA diatur untuk bersinergi riil dengan lingkungan berikut:
- **Klien End-User:** Web Browser berstandar terkini pada sistem OS terbuka atau komersial modern (Android, iOS native WebKit, Windows OS Desktop, macOS) tanpa bergantung modul *plugin* usang (misal tanpa dukungan *Flash/Applet*). Sistem wajib merespons secara mulus selambat-lambatnya pada peramban Chrome v100+ ke atas / setara.
- **Backend Infrastruktur:** Dilangsungkan (*hosted*) di wadah Windows OS (Windows Server) minimal spesifikasi menengah (2-4vCPUs, 4GB RAM) yang dipasangkan bersama perangkat *Relational Database* termutakhir (sejenis MySQL v8.0, SQL Server, atau PostgreSQL v14+), serta berjalan paralel berdampingan dengan *Runtime* layanan Backend.

### 2.5 Design and Implementation Constraints
Beberapa batasan perancangan *limitatif* (*Constraints*) yang mutlak dipatuhi *developer* pada arsitektur perangkat lunak ini:

| Tipe Keterbatasan | Deskripsi Spesifikasi *(Constraint List)* |
| :--- | :--- |
| **Regulasi Pengamanan Identitas** | Sandi akses mutlak dienkripsi 1 arah (*hashed algorithm* `bcrypt`). Sistem komunikasi admin dijamin menggunakan klaim token (JWT/Sesi Terotentikasi singkat dan ber-rotasi). |
| **Format Standar API Pihak Tiga** | Setiap konektor komunikasi dari *client* hingga server pusat dipakukan murni melalui rel `HTTP/RESTful API` dengan tipologi nilai bertumpu pada `application/json`. |
| **Arsitektur Integritas Data** | Seluruh skema rekam belanja katalog (e-commerce internal) mewajibkan desainer memanfaatkan struktur transaksi tipe ACID turunan Database SQL Relasional, guna menghindari data tumbuk tabrakan ganda. |
| **Infrastruktur Tumpuan Aset** | Menghindari sistem *storage* meledak, batas perlindungan filter di modul ujung-bawah (*backend endpoint handler*) tidak mentoleransi lonjakan transfer dokumen tunggal melebihi ukuran **5 MB**. |

### 2.6 User Documentation
Saat serah terima rilis peranti, spesifikasi dokumentasi terpaket bersama modul akan dibuktikan dengan adanya:
1. **Buku Panduan (*User Manual/SOP*):** Berformat PDF berhak cipta diserahkan ke Kepala Desa; merinci manual operasional login Dashboard hingga *approval* status proposal.
2. ***Inline Interactive Help* (Tooltip):** Pendampingan di layar seketika (*hover* teks bantuan) tertanam pada label fungsional tata kelola aplikasi admin (*Misal bantuan format gambar pada modul Katalog*).

### 2.7 Assumptions and Dependencies
Pertimbangan di bawah adalah asumsi mendasar yang bergantung pada infrastruktur komersial terpisah, keliru asumsi dapat menyebabkan pengkajian tata letak mundur/gagal:
- Seluruh perizinan untuk perombakan *Payment Gateway* perbankan diasumsikan berhasil digawangi oleh kemitraan Penyedia Lisensi Gateway (Midtrans/Xendit/Serupanya) dengan prasyarat lolos validasi bisnis. Jika dihentikan atau belum terjadi komitmen hukum perizinan dompet elektronik desa, sistem Katalog diturunkan sementara sekadar *Booking form* ke WhatsApp *(Pemesanan Semi-Manual)*.
- Penggunaan **Modul Peta Interaktif** bertumpu kelangsungannya pada integritas layanan `Google Maps API / Mapbox / Leaflet OpenStreetMap` fungsional serta kunci API pihak ketiga yang berstatus aktif/terkreditkan limit aman di server *publisher*.
- Seluruh aparatur yang mendapuk peran `Admin Desa` diasumsikan telah melek literasi perlindungan perangkat dan terhindar dari perilaku penyebarluasan kunci otorisasi sembarang.

---

## 3. External Interface Requirements

### 3.1 User Interfaces
Antarmuka pengguna (UI) LENTERA dirancang dengan mengedepankan estetika modern, responsivitas, dan kemudahan navigasi yang selaras dengan tema alam lestari dan pemberdayaan desa. Karakteristik logis dari setiap antarmuka meliputi:

1. **Front-End Portal Terdistribusi (Publik):**
   - **Gaya Visual & Standar GUI:** Memadukan kesan alam yang bersih (palet warna dominan putih, abu-abu muda, dan aksen hijau segar) dengan tipografi modern tanpa-kait (*sans-serif*) yang mudah dibaca. Memiliki tata letak *Responsive Web UI* yang beradaptasi secara mulus pada berbagai ukuran layar.
   - **Komponen Standar (Header & Footer):** Setiap halaman publik dilengkapi *NavigationBar* (Header) yang seragam memuat identitas logo LENTERA, tautan navigasi utama (*Home, Location, Education, Navigation, E-Resource, Sponsor, Profil*), akses cepat keranjang belanja (*cart*), serta akses profil pengguna. Bagian bawah (*Footer*) selalu menyajikan peta situs (*sitemap*), informasi komunitas, dan informasi hak cipta.
   - **Halaman Beranda (*Home*):** Dirancang sebagai wajah utama pendorong interaksi. Menyajikan *Hero Section* dengan *Call-to-Action* (CTA) yang jelas ("Mulai Eksplorasi"). Diikuti oleh etalase **Katalog Produk Desa** berbasis kartu (*card-based layout*) yang terstruktur rapi memuat foto, nama produk, harga, indikator rating ulasan, dan tombol aksi (*Add to Cart*). Dilengkapi pula blok **Eksplorasi Desa** interaktif yang memadukan peta visual dengan panel navigasi filter kategori spasial (Situs Alam, Pusat Edukasi, dll.) serta panel informasi cuaca aktual.
   - **Standar Tombol dan Interaksi:** Tombol aksi utama menggunakan warna solid mencolok (hijau kontras) untuk diferensiasi visual yang tajam. Menyediakan pengalaman mulus dengan transisi ringan (*hover states*) di setiap elemen interaktif dan *card*.

2. **Control Panel Dashboard (Admin Area):**
   - **Arsitektur Tata Letak:** Bersifat fungsional dan tegas. Bertumpu pada model navigasi panel samping (*Sidebar System*) statis guna memaksimalkan lebar kanvas pengelolaan data.
   - **Pencegahan Galat:** Dilengkapi fitur umpan balik mikro-interaksi (*micro-interactions*) dan perlindungan validasi cegah-kesalahan form (*Anti-Kecerobohan Input*) guna memastikan akurasi masuknya aset komoditas maupun pencatatan keuangan.

*(Detail desain presisi antarmuka pengguna, standar pesan galat, dan struktur layar spesifik untuk tiap komponen didokumentasikan secara terpisah dalam Dokumen Spesifikasi Antarmuka Pengguna/UI-UX).*

### 3.2 Hardware Interfaces
Karena LENTERA dibangun di atas arsitektur *web-based*, interaksi langsung peranti lunak dengan perangkat keras (*low-level hardware*) dikelola seutuhnya oleh peramban (*browser*) dan sistem operasi pengakses. Meskipun demikian, operasional antarmuka perangkat keras yang disyaratkan meliputi:

1. **Perangkat Klien (Pengguna & Admin):**
   - **Layar Tampilan:** Antarmuka visual merespons fluktuasi dimensi kanvas secara elastis; mulai dari resolusi *smartphone* (minimal 320px) hingga *desktop monitor* standar (1080p).
   - **Sensor Geolokasi (GPS):** Modul **L - Location** dan antarmuka **N - Navigation** melakukan jabat tangan data dengan sensor GPS bawaan gawai pengguna (atas persetujuan/ *prompt access*) guna menyuplai kordinat lintang-bujur (*latitude-longitude*) jarak tempuh.
   - **Perangkat Input Standar:** Mendukung interaksi multi-sentuh (*capacitive touchscreen*) pada ponsel pintar dan *keyboard/mouse* pada PC. Sistem dirancang ramah guna tanpa mewajibkan periferal keras fisik eksternal seperti mesin pemindai sidik jari atau pemindai *barcode / QR scanner* di lingkup Desa saat peluncuran.
2. **Perangkat Peladen Pusat (Server):**
   - Tidak ada antarmuka *hardware* secara fisik ke instrumen eksternal (misal: mesin *printer* kasir langsung, atau mesin portal parkir). Komunikasi perangkat keras peladen sepenuhnya mengandalkan antarmuka Kartu Jaringan (*Network Interface Card / Ethernet*) standar industri bernaung di bawah payung *stack* protokol TCP/IP fungsional untuk lalu-lintas data eksternal.

### 3.3 Software Interfaces
    Sistem LENTERA beroperasi dengan mengandalkan interaksi terstruktur terhadap beberapa antarmuka perangkat lunak lapis bawah dan layanan eksternal:
    - **Sistem Operasi (OS):** 
    - *Server-side:* Di-*deploy* pada lingkungan *Windows Server* atau distribusi *Linux* peladen (Ubuntu/CentOS) untuk menjamin persistensi ketersediaan (*uptime*).
    - *Client-side:* Didesain agnostik terhadap OS, sepenuhnya dapat berjalan di atas *engine* peramban WebKit (iOS/macOS), Blink (Google Chrome/Android/Edge), maupun Gecko (Mozilla Firefox).
    - **Database Management System (DBMS):** Berinteraksi secara internal dengan peladen *Relational Database* termutakhir (seperti MySQL v8.0 atau PostgreSQL v14+). Pertukaran kueri memori dilakukan via konektor aman dengan kaidah eksekusi transaksional tipe *ACID*, menjamin tumpukan pengajuan tidak saling tumpang tindih.
    - **Layanan API Pihak Ketiga (*Third-Party API*):**
    - **Mapping Service API:** Berkomunikasi dua-arah dengan penyedia layanan eksternal (spt. integrasi Google Maps API / Leaflet / OpenStreetMap) untuk fungsionalitas perenderan peta interaktif dan navigasi jarak pada modul L & N.
    - **Payment Gateway API *(TBD/Opsional)*:** Potensi komunikasi asinkron lewat *webhook* ke penyedia gerbang pembayaran terlisensi (Midtrans/Xendit) untuk validasi otomatis mutasi dana Transaksi UMKM dan arus kas Sponsorship.
    - **Local/Cloud Storage Server:** Manajemen *upload* media (unggah PDF Laporan dan foto-foto UMKM) diisolasi laluannya agar tak membebankan modul basis data (memanfaatkan partisi penyimpanan file internal *server* atau konektor *AWS S3/Cloud Storage Object*).

### 3.4 Communications Interfaces
Seluruh mekanisme lintasan transit data baik di sisi antarmuka internal maupun layanan terekspos klien dirangkai berdasarkan spesifikasi teknis berikut:
- **Protokol Lapisan Aplikasi:** Semua transaksi muatan data sensitif, seperti profil admin dan rekaman penjualan, dipaksa harus melalui terowongan komunikasi terenkripsi *Hypertext Transfer Protocol Secure* (**HTTPS**) bersertifikat standar *Transport Layer Security* (TLS minimal versi 1.2 / 1.3). Tidak diizinkan persinggungan pertukaran data tak terenkripsi (HTTP *plain-text*).
- **Arsitektur Komunikasi *Client-Server*:** Titik persinggungan integrasi (*Communications Bus*) berjalan di atas antarmuka pola terstandarisasi **RESTful API** (*Representational State Transfer*).
- **Tipe Muatan Format Data (*Data Formats*):** Transmisi informasi disepakati hanya menggunakan objek muatan berstruktur tegar berbasis **JSON** (*JavaScript Object Notation* / *Header:* `application/json`) untuk pergerakan *text-data*, dan form ekstensi **`multipart/form-data`** demi fasilitasi persilangan serah terima dokumen gambar/media.
- **Protokol Notifikasi (Opsional):** Bilamana diperlukan umpan balik eksternal, sistem memuat rel antarmuka dengan *Simple Mail Transfer Protocol* (**SMTP**) untuk menyuntikkan notifikasi ke pesan masuk surel aparatur desa tiap kali terdapat pengajuan entri Investor baru yang harus di-*approval*.

---

## 4. System Features (Functional Requirements)

### 4.1 Registrasi Transaksi Produk & Manajemen Katalog
#### 4.1.1 Description and Priority
Fitur ini memberdayakan pertukaran ekonomi dengan pembelanja publik melalui sistem Katalog UMKM dan Keranjang Belanja (*Online Shopping Cart*). Fitur ini memiliki prioritas **High** (Tinggi), karena merupakan inti dari pemberdayaan ekonomi pariwisata desa yang ditawarkan oleh LENTERA.

#### 4.1.2 Stimulus/Response Sequences
- **Stimulus:** Pengunjung (publik) memilih produk dari halaman Katalog dan menekan tombol "Tambahkan Keranjang".
  **Response:** Sistem menyimpan status sesi keranjang sementara dan memperbarui jumlah *item* keranjang pada indikator *Header* antarmuka.
- **Stimulus:** Pengunjung menekan tombol *Checkout* dan mengisi *form* pemesanan.
  **Response:** Sistem mengagregasi total harga transaksi, menyimpannya ke dalam sistem basis data, dan menampilkan rincian tagihan rekonsiliasi yang kemudian diteruskan pengawasannya ke panel admin/penjual.
- **Stimulus:** Admin (Penjual/Karang Taruna) menambahkan atau mengubah rincian inventori produk melalui *Dashboard*.
  **Response:** Sistem memvalidasi masukan dan memperbarui repositori katalog di antarmuka publik (*Front-End*) secara instan (*real-time*).

#### 4.1.3 Functional Requirements
- **REQ-CAT-01:** Fasilitas *backend* wajib menampilkan (*serve*) suplai katalog komprehensif didukung deskripsi akurat dan variabel parameter penentu jenis.
- **REQ-CAT-02:** Antarmuka pengunjung harus mendukung penambahan, pengurangan, dan penghapusan *item* produk dalam sesi keranjang secara dinamis sebelum masuk ke tahap *checkout*.
- **REQ-CAT-03:** Sistem harus mampu melakukan agregasi harga transaksi secara otomatis berdasarkan keranjang belanja pengguna yang terhubung ke gerbang rekonsiliasi pada sisi admin.
- **REQ-CAT-04:** Jika masukan rincian pesanan dari pelanggan tidak valid, sistem harus menolak *submission* secara *front-end* dan menampilkan pesan galat validasi.

### 4.2 Tata Laksana Dokumentasi & E-Resource
#### 4.2.1 Description and Priority
Fitur ini menjadi sentral manajemen publikasi konten, edukasi wisata, ulasan testimoni pengguna, dan laporan kemasyarakatan. Prioritasnya adalah **Medium** (Menengah), menunjang nilai transparansi desa dan edukasi pariwisata interaktif.

#### 4.2.2 Stimulus/Response Sequences
- **Stimulus:** Admin/Aparatur desa mengunggah informasi terbaru, buletin, atau laporan via *Dashboard*.
  **Response:** Sistem memvalidasi format berkas lampiran (gambar/PDF), menyimpannya di penampungan *server*, dan mempublikasikan referensi rujukan di laman *E-Resource* publik.
- **Stimulus:** Admin mengubah parameter status visibilitas sebuah artikel/laporan menjadi "Tersembunyi".
  **Response:** Sistem seketika menghapus tampilan referensi artikel tersebut dari daftar pencarian dan pandangan publik di *Front-End*.
- **Stimulus:** Pengunjung mencoba mengirimkan ulasan/testimoni dari riwayat pesanan masa lalu.
  **Response:** Sistem memfasilitasi formulir input *rating* (1-5 bintang) beserta fasilitas unggahan *file* media pendukung, lalu mengirimkan log ke *Backend*.

#### 4.2.3 Functional Requirements
- **REQ-RES-01:** Tersedianya fasilitas penyuntingan objek *form* di *Dashboard* yang mampu mencegat, memvalidasi ukuran, dan melontarkan ke *server attachment* lampiran multi-tipe (URL teks, PDF dokumen wisata, citra statis foto).
- **REQ-RES-02:** Sistem harus menjalankan fungsi penyebaran dan pengaturan penanda status publisitas (misal: menyembunyikan informasi yang tertinggal/kedaluwarsa).
- **REQ-RES-03:** Sistem harus secara otomatis menolak unggahan *file* lampiran yang melampaui batas toleransi ukuran maksimum (*Constraint* 5 MB) dengan mengembalikan notifikasi penolakan ke layar pengunggah.

### 4.3 Otorisasi Log-In dan Integritas Akses Dasbor
#### 4.3.1 Description and Priority
Modul keamanan esensial untuk penegakan pemisahan tingkat perizinan (*Role-Based Access Control*) antara "Pengunjung Publik", "Karang Taruna", "Penjual", dan "Aparatur Tata Usaha Desa" di dalam panel aplikasi. Prioritas fitur ini adalah **High** (Tinggi).

#### 4.3.2 Stimulus/Response Sequences
- **Stimulus:** Pengguna dengan hak akses (Aparatur/Admin) memasukkan *username* dan kata sandi di laman antarmuka *Login*.
  **Response:** Sistem memvalidasi presisi kredensial di basis data. Jika benar, sistem membangkitkan Kunci Sesi terenkripsi dan mengarahkan rute peramban ke *Dashboard* yang sesuai dengan tingkat perannya.
- **Stimulus:** Pengguna mencoba memanipulasi *endpoint* API atau mengakses URL spesifik yang melampaui otoritas perannya (misal entitas bawahan mengakses *Approval Sponsor* milik Kepala Desa).
  **Response:** Lapis keamanan *Backend* mencegat kueri rute, menolak akses paksa (mengembalikan HTTP 403 Forbidden), dan melempar pengguna kembali ke ruang aman Dasbor disertai pemunculan pesan *error*.

#### 4.3.3 Functional Requirements
- **REQ-AUTH-01:** Sistem wajib memiliki mekanisme pembangkitan Kunci Sesi atau Token Rahasia (*Secure Login Request* / JWT) mutlak untuk dapat menembus terowongan *Dashboard* Eksekutif LENTERA.
- **REQ-AUTH-02:** Terdapat fitur pemblokiran navigasi rute secara instan pada sistem manakala peran bawahan (`role='karangtaruna'`) memaksakan parameter kueri URL di tab persetujuan (*Approval Sponsor*) milik Kepala Aparatur Utama (`role='desa'`).
- **REQ-AUTH-03:** Sistem wajib menghancurkan token otentikasi aktif dari penyimpan lokal klien bilamana staf admin menekan fitur tombol *Logout*.

### 4.4 Otomatisasi Pendataan Proposal Sponsorship Eksternal
#### 4.4.1 Description and Priority
Fitur untuk menjembatani fasilitasi pendaftaran serta melacak rekam jejak penawaran masuk dari para pemodal/donatur (*Sponsor*) yang menanamkan investasi pada unit kompensasi bisnis desa. Prioritasnya adalah **Medium** (Menengah).

#### 4.4.2 Stimulus/Response Sequences
- **Stimulus:** Calon Investor (Sponsor) mengisi *form* inisiasi registrasi investasi proposal *B2B* di ruang publik.
  **Response:** Sistem mengamankan rincian identitas institusi dan usulan donatur, mentransmisikannya ke memori peladen abadi, dan melabeli status awal pengajuan menjadi `PENDING`.
- **Stimulus:** Aparatur Desa yang berwenang meninjau daftar pengajuan proposal di antarmuka Dasbor dan mengeksekusi kontrol *Approve* (Setuju) atau *Reject* (Tolak).
  **Response:** Sistem memproses keputusan log tindakan tersebut, menimpa status `PENDING` dengan nilai keputusan, dan melakukan kalkulasi pembaruan grafik agregat investasi masuk untuk disiarkan kembali.

#### 4.4.3 Functional Requirements
- **REQ-SPO-01:** Sistem harus memfasilitasi pengiriman rinci identitas institusi donatur melalui isian perlindungan form *Front-End*, yang status kelahirannya direkam berlabel `PENDING` di memori abadi.
- **REQ-SPO-02:** Sistem memungkinkan Aparatur Desa melakukan kapabilitas pengubahan baris catatan status persetujuan (*Approval*), menolak (`REJECTED`) atau memberlakukan legalitas penyetujuan (`APPROVED`) terhadap proposal terkait.
- **REQ-SPO-03:** Sistem harus mampu merender statistik kalkulasi gabungan kumpulan penanam modal yang diklasifikasikan ke dalam grafik pendanaan (*Real Time*) berdasarkan parameter proposal bersatus `APPROVED`.

### 4.5 Pemetaan Visual Interaktif Desa (Location)
#### 4.5.1 Description and Priority
Modul pemetaan visual spasial interaktif untuk membantu pengunjung menjelajahi wilayah desa. Memberikan *marker* (penanda) yang dibedakan kategorinya menggunakan warna untuk memetakan fasilitas umum, perkebunan, kuliner, dan UMKM. Prioritas fitur ini adalah **High** (Tinggi).

#### 4.5.2 Stimulus/Response Sequences
- **Stimulus:** Pengunjung membuka halaman Peta (Location) atau menekan filter kategori (misal: "Situs Alam").
  **Response:** Sistem merender peta geolokasi terintegrasi dan hanya memunculkan *marker* titik koordinat yang sesuai dengan kategori filter yang dipilih.
- **Stimulus:** Pengunjung menekan salah satu ikon *marker* di atas peta.
  **Response:** Sistem memunculkan *pop-up* informasi singkat detail lokasi/UMKM dan memberikan tautan yang menuntun langsung ke halaman rincian produk (Katalog).
- **Stimulus:** Admin (Desa/Karang Taruna) menambahkan titik koordinat (*latitude/longitude*) baru via *Dashboard*.
  **Response:** Sistem menyimpan data geospasial baru ke basis data dan memperbarui letak *marker* di peta publik.

#### 4.5.3 Functional Requirements
- **REQ-LOC-01:** Antarmuka pengunjung harus mampu menampilkan peta *embedded* (via integrasi API Pihak Ketiga seperti Google Maps/Leaflet) lengkap dengan sebaran *marker* berwarna sesuai kategori klasifikasi.
- **REQ-LOC-02:** Sistem harus menyediakan panel interaktif agar pengguna dapat menyaring (*filter*) *marker* berdasarkan kategori lokasi.
- **REQ-LOC-03:** *Backend* wajib menyediakan fungsionalitas CRUD bagi admin untuk memetakan atau memindahkan titik penanda lokasi fasilitas dan entitas UMKM baru.

### 4.6 Sistem Navigasi Pariwisata & Kedaruratan (Navigation)
#### 4.6.1 Description and Priority
Sistem navigasi peta tingkat lanjut yang difokuskan pada parameter lokasi pengguna saat itu. Fitur ini mampu mengestimasikan jarak pengunjung ke lokasi yang dituju dan menyediakan kontak kedaruratan. Prioritas fitur ini adalah **Medium** (Menengah).

#### 4.6.2 Stimulus/Response Sequences
- **Stimulus:** Pengunjung menyetujui *prompt access* sensor GPS peramban (browser) di halaman Navigasi.
  **Response:** Sistem mendeteksi koordinat *latitude/longitude* pengguna saat itu dan menampilkan estimasi rute/jarak ke berbagai titik pariwisata LENTERA.
- **Stimulus:** Pengunjung menekan tombol aksi "Bantuan Kedaruratan / *Contact Me*".
  **Response:** Sistem mengarahkan tautan instan komunikasi ke perpesanan pihak ketiga (WhatsApp) milik Admin Desa dengan templat pesan bantuan.

#### 4.6.3 Functional Requirements
- **REQ-NAV-01:** Sistem harus sanggup melakukan kalkulasi estimasi jarak dari titik lokasi GPS pengunjung ke titik destinasi wisata yang dituju.
- **REQ-NAV-02:** Sistem harus memiliki gerbang layanan peringatan (*emergency contact*) yang melempar *intent* koneksi ke layanan perpesanan (WhatsApp) milik aparatur pelayan desa.

### 4.7 Tata Kelola Keuangan & Penarikan Dana UMKM (Withdrawal)
#### 4.7.1 Description and Priority
Fungsionalitas spesifik *Back-End* tersembunyi yang ditujukan utuh untuk klasifikasi pengguna "Penjual" (UMKM) dan "Desa" guna mengatur penarikan saldo keuntungan (*Withdrawal*) dari hasil keranjang belanja LENTERA. Prioritasnya adalah **High** (Tinggi) karena menyangkut hak finansial mitra.

#### 4.7.2 Stimulus/Response Sequences
- **Stimulus:** Penjual (UMKM) memeriksa total penghasilan dan menekan tombol *Withdrawal* (Tarik Dana) di Dasbor mereka.
  **Response:** Sistem memverifikasi batasan saldo minimal. Jika valid, sistem memotong nominal saldo dari dompet sementara dan membuat antrean penarikan dana berstatus `Pending`.
- **Stimulus:** Admin (Desa/Finance) meninjau antrean penarikan lalu menekan tombol *Approve* (Pencairan).
  **Response:** Sistem mencetak log keuangan, memperbarui status tiket penarikan menjadi `Success`, dan memicu rekaman bukti pelunasan penarikan dana bagi Penjual.

#### 4.7.3 Functional Requirements
- **REQ-FIN-01:** Sistem Dasbor `Penjual` harus memiliki modul pengajuan penarikan dana tunai (*Withdrawal*) yang terkunci dan dilarang diajukan apabila ambang batas minimum agregasi saldo pendapatan belum tercapai.
- **REQ-FIN-02:** *Backend* harus mengunci status mutasi finansial `Pending` dari *Withdrawal* untuk diizinkan beralih menjadi `Success` murni hanya melalui persetujuan manual tingkat otoritas `Admin`/`Desa`.
- **REQ-FIN-03:** Semua arus mutasi angka transaksional dompet elektronik dalam modul ini wajib diproses menggunakan jaminan eksekusi yang *ACID-compliant* (tercegah dari tabrakan duplikasi penarikan).
---

## 5. Other Nonfunctional Requirements

### 5.1 Performance Requirements
Kebutuhan kinerja mendefinisikan batasan terukur terkait seberapa cepat dan efisien sistem LENTERA harus beroperasi di bawah kondisi beban tertentu:
- **Waktu Respon (Response Time):** Respon kueri utama untuk memuat halaman dasbor dan merender data agregasi (statistik, log transaksi) tidak boleh melebihi 1,5 detik pada koneksi internet standar (min. 10 Mbps). Proses transaksional *checkout* atau *submit form* harus diselesaikan di bawah 2 detik.
- **Kapasitas Beban (Throughput & Concurrency):** Sistem harus mampu menangani minimal 500 pengguna aktif secara bersamaan (*concurrent users*) pada portal publik (pengunjung katalog/peta) dan 20 admin secara simultan tanpa degradasi performa yang signifikan.
- **Optimasi Basis Data:** Kueri pencarian, terutama pada modul Katalog UMKM dan Log Sponsorship, wajib mengimplementasikan arsitektur *Database Indexing* yang tepat untuk memastikan proses pencarian dalam skala puluhan ribu baris data dapat dieksekusi di bawah 500 milidetik.
- **Efisiensi Aset:** Semua aset media statis (gambar/foto UMKM) harus dioptimasi otomatis (*auto-compression*) untuk memastikan ukuran halaman muat awal tidak melebihi 3 MB guna menekan latensi *bandwidth*.

### 5.2 Safety Requirements
Kebutuhan keselamatan berkaitan dengan pencegahan kehilangan data, kerusakan sistem, atau dampak negatif akibat kegagalan operasi sistem:
- **Pencegahan Kehilangan Data (Data Loss Prevention):** Sistem wajib memberlakukan mekanisme *Soft-Delete* pada seluruh operasi penghapusan basis data. Data yang dihapus tidak langsung hilang dari disk melainkan ditandai sebagai inaktif (`is_deleted = true`), memungkinkan pemulihan data (*data recovery*) jika terjadi kelalaian operasi oleh aparatur/admin.
- **Verifikasi Tindakan Kritis (Fail-Safe Checks):** Setiap operasi *CRUD* yang bersifat destruktif atau krusial (misal: penolakan pendanaan *Sponsor*, penghapusan produk Katalog) wajib memunculkan jendela dialog konfirmasi (*Confirmation Modal*) berlapis untuk mencegah "Kelelahan Operator/Ketidaksengajaan".
- **Pencadangan Berjangka (Automated Backup):** Basis data relasional harus dikonfigurasi untuk melakukan pencadangan otomatis harian (*daily automated backups*) pada saat lalu-lintas sistem terendah (misal: pukul 02:00 dini hari) untuk menjamin pemulihan bencana (*Disaster Recovery*).

### 5.3 Security Requirements
Kebutuhan keamanan menetapkan standar pengamanan data rahasia desa, UMKM, dan intervensi dari akses yang tidak berwenang:
- **Otentikasi & Otorisasi Lapis Ganda:** Akses masuk *Dashboard* diatur dengan *Role-Based Access Control* (RBAC) yang tegas. Autentikasi berbasis *JSON Web Token* (JWT) dengan umur kedaluwarsa sesi (contoh: *session timeout* dalam 120 menit) untuk mencegah peretasan sesi terbengkalai.
- **Kriptografi Data Statis & Transit (Encryption at Rest & in Transit):** Kata sandi admin/pengguna dilarang keras disimpan dalam *plain-text*. Wajib dienkripsi satu arah menggunakan fungsi *hash* kriptografis yang kuat (misal: Bcrypt / Argon2). Komunikasi jaringan mutlak diamankan oleh protokol lapisan transportasi (TLS 1.2+ / HTTPS).
- **Perlindungan Terhadap Serangan Siber Umum:** Server harus dilengkapi dengan sanitasi parameter input (*Input Validation*) secara ketat pada setiap celah API untuk menangkal serangan Injeksi SQL (*SQL Injection*). Form input konten terbuka, seperti ulasan/testimoni UMKM, harus membersihkan *tag* skrip berbahaya untuk mencegah *Cross-Site Scripting* (XSS).
- **Jejak Audit (Audit Trails):** Sistem perlu merekam log aktivitas fundamental administrator, seperti siapa yang menyetujui transaksi *Sponsor* dan mengubah status produk, dilengkapi stempel waktu (*timestamp*) yang tidak dapat diubah oleh level pengguna biasa.

### 5.4 Software Quality Attributes
Atribut kualitas nonfungsional berikut merupakan penopang ketahanan arsitektural dan adaptabilitas jangka panjang dari LENTERA:
- **Usability (Ketergunaan Tinggi & Aksesibilitas):** Antarmuka (UI/UX) mengutamakan prinsip desain *Clean* dan *Modern* yang intuitif. Meminimalisir kurva pembelajaran (*learning curve*) bagi pengguna aparatur desa awam dengan memberikan *tooltip* edukatif dan pesan galat (*error messages*) yang jelas dengan instruksi penyelesaian, alih-alih menampilkan kode *error* teknis baku.
- **Reliability (Keandalan):** Server diupayakan agar memiliki *Service Level Agreement* (SLA) waktu aktif layanan (*Uptime*) sebesar 99,5%, memastikan katalog jualan desa terus beroperasi mendatangkan traksi wisatawan sepanjang waktu.
- **Scalability (Elastisitas Skalabilitas):** Memiliki arsitektur fondasi REST API (*Backend*) tersentralisasi dan memisahkan lapisan presentasi (*Frontend*). Memungkinkan arsitektur dikembangkan (*scale-out* secara horizontal dengan *Load Balancer* atau *scale-up* vertikal) tanpa harus membongkar basis logika sistem sejak awal.
- **Maintainability (Kemandirian Pemeliharaan):** Kode sumber wajib mematuhi standar *Clean Code*, tertulis dengan paradigma desain terstruktur/OOP, disertai abstraksi komentar *inline* yang koheren. Terpisahnya logika *Frontend* dan *Backend* akan memastikan jika terjadi perombakan *Dashboard Visual* di masa depan, tidak akan mengacaukan jalur logika finansial dan tata kelola data.
- **Portability (Portabilitas):** Bersifat *Responsive Web Design* yang responsif terhadap variasi dimensi kanvas *smartphone*, tablet, maupun *desktop* secara mulus tanpa distorsi rasio antarmuka.

### 5.5 Business Rules
Aturan bisnis mendefinisikan prinsip operasional dan kebijakan manajerial yang membatasi jalannya sistem, yang pada gilirannya akan mendikte implementasi fungsionalitas:
- **Hierarki Persetujuan (Approval Hierarchy):**
  - Akun level `Admin` (Karang Taruna) berwenang memvalidasi dan mempublikasikan entri katalog UMKM baru, pemetaan, dan persetujuan awal (*screening*) proposal *Sponsorship* reguler.
  - Akun level `Desa` (Super Admin Eksekutif) memegang otoritas mutlak untuk pengesahan akhir (*Final Approval*) pencairan dana *Sponsorship* skala besar serta pemberian/pencabutan hak akses operasional.
- **Kebijakan Penarikan Dana (Withdrawal Policy):** Entitas `Penjual` (UMKM) hanya dapat mengajukan permohonan penarikan dana tunai (*Withdrawal*) apabila akumulasi saldo transaksi telah mencapai ambang batas minimum yang ditetapkan regulasi (misal: Rp 50.000). Penarikan dana ditahan dalam status `Pending` hingga disetujui secara manual oleh Admin.
- **Transparansi Sponsorship:** Sistem mengamanatkan keterbukaan informasi. Entitas `Admin` diwajibkan mengunggah dokumen pertanggungjawaban (laporan progres) kepada dasbor privat milik entitas `Sponsorship` (Investor) sebagai prasyarat keberlanjutan kerja sama investasi.
- **Ketentuan Kedaluwarsa Katalog:** Guna menjaga kebaruan informasi (*freshness*) bagi pengunjung publik, sistem berhak menyembunyikan (*hide*) secara otomatis profil atau katalog UMKM yang tidak memperlihatkan aktivitas masuk/pembaruan (*dormant*) melewati batas waktu yang disepakati (misal: 90 hari).

---
## 6. Other Requirements

### 6.1 Database Requirements
- **Integritas Relasional:** Skema basis data harus mendukung konstrain *Foreign Key* dengan skema penghapusan terkontrol (*restrict* atau *cascade* yang diawasi) untuk memastikan tidak ada data anak (misal: produk) yang terombang-ambing (*orphan*) apabila data induk (misal: akun UMKM) dihapus.
- **Penelusuran Jejak Data (Data Auditing):** Setiap tabel krusial (master dan transaksional) wajib memuat kolom pelacakan waktu standar (`created_at`, `updated_at`, dan `deleted_at` untuk mendukung *Soft-Delete*) serta mencatat pengidentifikasi aktor yang melakukan mutasi data (`created_by`, `updated_by`).
- **Dukungan Data Spasial:** Mengingat inti fitur LENTERA mencakup navigasi dan pemetaan (*Location*), arsitektur DBMS diutamakan mampu menangani ekstensi penyortiran tipe data keruangan (*Spatial Data / Geographic Information System* seperti *PostGIS* atau tipe data `POINT` bawaan MySQL) untuk efisiensi kueri pencarian radius/jarak geolokasi.

### 6.2 Legal Requirements
- **Perlindungan Privasi Pengguna (Data Privacy):** Sistem wajib mematuhi regulasi perlindungan data pribadi (misalnya UU PDP yang berlaku di Indonesia). Informasi identitas krusial (seperti data KTP/NIK pada pendaftaran Sponsorship) harus dienkripsi. Tautan ke dokumen Persetujuan Pengguna dan Kebijakan Privasi (*Terms of Service & Privacy Policy*) wajib disediakan dan disetujui pengguna (via *checkbox*) pada seluruh formulir registrasi.
- **Hak Kekayaan Intelektual (HAKI):** Semua aset visual, logo, dan kompilasi data komoditas desa yang terhimpun secara orisinal di dalam platform sepenuhnya menjadi properti hak cipta milik entitas Desa Kucur. Penggunaan *library* atau aset eksternal bersumber terbuka (*Open Source*) di dalam peranti lunak wajib dikelola sesuai kepatuhan lisensi yang menyertainya (misal MIT, GPL, Apache).

### 6.3 Internationalization and Localization Requirements
- **Lokalisasi Utama:** Antarmuka *default* dikonfigurasi menggunakan Bahasa Indonesia dengan format pelokalan (*locale*) wilayah lokal, seperti standar pemformatan mata uang Rupiah (Rp) dan zona waktu (WIB/UTC+7).
- **Kesiapan Ekstensi Bahasa (i18n Readiness):** Sebagai portal promosi pariwisata yang berpotensi menarik kunjungan turis mancanegara, struktur teks presentasi pada lapisan *Front-End* tidak boleh ditanam permanen (*hardcoded*). Teks-teks tersebut wajib diekstraksi ke dalam fail konfigurasi bahasa independen (*translation files*) untuk mempermudah injeksi opsi dwibahasa (seperti Bahasa Inggris) di fase pengembangan tahap lanjut tanpa perlu merekayasa ulang komponen visual.

### 6.4 Reuse Objectives
- **Arsitektur Modular (Reusable Components):** Modul-modul fundamental *Backend* (seperti layanan Autentikasi JWT, sistem panel Dasbor terisolasi, dan modul *File Uploader*) didesain secara agnostik agar *source-code* dapat dengan mudah direplikasi (*white-label*) atau dimanfaatkan kembali bagi proyek-proyek perdesaan (*E-Government* setara) di masa mendatang, demi memangkas biaya dan waktu rekayasa awal.

## Appendix A: Glossary
*   **LENTERA:** Kependekan dari *Location, Education, Navigation of Tourism, E-Resource Application*. Sebuah platform ekosistem digital terpadu untuk Desa Kucur.
*   **UMKM:** Usaha Mikro, Kecil, dan Menengah. Entitas warga pelaku wirausaha atau produsen komoditas lokal yang menjajakan jasanya melalui direktori aplikasi LENTERA.
*   **API (Application Programming Interface):** Kumpulan aturan dan protokol yang memungkinkan modul lapisan *Frontend* berinteraksi saling panggil fungsi logika dengan modul *Backend*.
*   **REST / RESTful:** Representational State Transfer. Arsitektur standar berbasis protokol HTTP yang memastikan pertukaran data komunikasi klien-peladen berjalan efisien, berskala, dan tanpa-status (*stateless*).
*   **Frontend:** Lapisan antarmuka pengguna grafis (*Graphical User Interface*) dari perangkat lunak yang berinteraksi langsung secara visual dengan pengguna melalui peramban (browser).
*   **Backend:** Lapisan peladen di balik layar yang menangani proses komputasi berat, penegakan aturan bisnis, autentikasi sesi, dan interaksi langsung dengan mesin basis data.
*   **JSON Web Token (JWT):** Standar industri untuk representasi token otentikasi ringkas dan aman dengan URL berlapiskan tanda tangan kriptografi (biasa digunakan sebagai tiket izin masuk yang dikirimkan klien pada setiap pemanggilan akses).
*   **RDBMS (Relational Database Management System):** Sistem pengelola basis data tipe berelasi struktural yang menyusun informasi dalam bentuk tabel-tabel (mis. MySQL / PostgreSQL).
*   **CRUD:** *Create, Read, Update, Delete*. Empat operasi fungsi dasar perlakuan rekaman persisten di dalam aplikasi pengelolaan manajemen data.
*   **Soft-Delete:** Mekanisme penghapusan semu; data tidak benar-benar dienyahkan dari cakram keras *server*, melainkan ditandai sebagai data terhapus (inaktif) agar bisa dipulihkan jika terjadi kesalahan operator.
*   **RBAC (Role-Based Access Control):** Mekanisme kendali keamanan yang membatasi ketat ruang lingkup hak akses antar pengguna sistem sesuai dengan perannya di dalam hierarki jabatan organisasi (misal: otorisasi *Desa* vs otorisasi *Admin Karang Taruna*).
*   **SLA (Service Level Agreement):** Perjanjian tingkat layanan yang menjamin standar performa numerik tertentu (seperti jaminan durasi sistem/server selalu aktif hidup di atas 99%).
*   **SQL Injection & XSS (Cross-Site Scripting):** Vektor eksploitasi serangan siber eksternal terpopuler; masing-masing memanfaatkan celah manipulasi parameter sistem *database* dan injeksi skrip peretas liar di laman pengunjung umum.
*   **GIS (Geographic Information System):** Sistem komputasi berfokus keruangan untuk menangkap, mengelola, dan memvisualisasikan koordinat peta geografis riil di atas kanvas aplikasi (seperti yang digunakan pada modul Navigasi peta desa LENTERA).
*   **i18n (Internationalization):** Praktik rancang bangun struktural yang mempersiapkan basis perangkat lunak sejak awal agar mudah dialihbahasakan dan dilokalisasikan tanpa menyentuh bongkar-pasang perombakan *source code*.

## Appendix B: Analysis Models
*(Diagram relasi entitas, peta aliran proses sponsor, dan sejenisnya akan disertakan di luar dokumen persyaratan tekstual primer ini).*

## Appendix C: To Be Determined (TBD)
- Kebijakan penagihan integrasi layanan metode sistem keamanan perbankan ganda (*Third Party Payment API Gateway*) perihal proses Checkout.
- TBD (*To Be Determined*) untuk sinkronisasi pemetaan data administrasi NIK Kependudukan yang diverifikasi langsung dengan portal Dinas Catatan Sipil daerah bagi verifikasi keanggotaan/pelanggan premium/Sponsor/Investor berskala masif.

*(Akhir Spesifikasi)*
