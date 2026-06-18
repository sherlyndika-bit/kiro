// ==========================================
// 1. PENGATURAN UTAMA & KONFIGURASI API
// ==========================================
// Token WhatsApp dikosongkan dulu. Isi kembali saat token baru sudah siap.
const VERIFY_TOKEN = '';     // <- isi token verifikasi webhook baru di sini
const WA_TOKEN = '';         // <- isi WhatsApp Access Token baru di sini
const PHONE_NUMBER_ID = '1215584901629034';
const GEMINI_API_KEY = '';   // <- isi API Key Gemini di Apps Script (jangan simpan di GitHub)
const SPREADSHEET_ID = '1Szs9RT14YeJ12TWqPHXTg9gpUlgHTL8m1DcGS1kZTcI';

// Helper: cek apakah integrasi WhatsApp sudah dikonfigurasi
function waSiap() {
  return WA_TOKEN && WA_TOKEN.trim() !== '' && PHONE_NUMBER_ID && PHONE_NUMBER_ID.trim() !== '';
}

// ==========================================
// 2. SISTEM LOGIN  (tersambung ke Sheet: AKUN_PETUGAS)
// ==========================================
function verifikasiLogin(username, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("AKUN_PETUGAS");
    if (!sheet) return { sukses: false, pesan: "Database AKUN_PETUGAS tidak ditemukan!" };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      let userExcel = data[i][0] ? data[i][0].toString().trim() : "";
      let passExcel = data[i][1] ? data[i][1].toString().trim() : "";
      if (userExcel === username && passExcel === password) {
        return { sukses: true, role: data[i][2], nama: data[i][3] };
      }
    }
    return { sukses: false, pesan: "Username atau Password salah!" };
  } catch (e) {
    return { sukses: false, pesan: "Akses Ditolak Google: " + e.message };
  }
}

// ==========================================
// 3. SYSTEM PROMPT AI
// ==========================================
function getSystemPrompt() {
  return `════════════════════════════════════════════════════════════════
  SYSTEM PROMPT — SIProsa KELURAHAN JATIHANDAP
  Model: Gemini 2.0 Flash | Versi: 1.0
════════════════════════════════════════════════════════════════

## IDENTITAS DAN PERAN

Kamu adalah Asisten Virtual SIProsa (Sistem Pelayanan & Respon
Sosial) Kelurahan Jatihandap. Tugasmu membantu warga mengajukan
layanan kesejahteraan sosial melalui WhatsApp secara ramah,
sabar, dan profesional.

Nama panggilanmu: "SIProsa" atau "Petugas SIProsa".
Selalu sapa warga dengan "Bapak/Ibu" di awal percakapan baru.


## ATURAN UMUM PERCAKAPAN

1. SATU PERTANYAAN SEKALIGUS — jangan tanya lebih dari satu hal
   dalam satu pesan.
2. JANGAN TANYA ULANG — jika warga sudah menyebut suatu data
   sebelum ditanya, simpan dan lanjutkan ke data berikutnya.
3. TERIMA KOREKSI — jika warga mengoreksi data yang sudah
   diberikan, perbarui tanpa mengulang alur dari awal.
4. JAWAB FAQ SINGKAT — jika warga bertanya di luar alur (syarat,
   jadwal, dll), jawab singkat lalu ajak kembali ke pengisian.
5. BAHASA DAERAH — pahami pesan Sunda, Jawa, atau campuran;
   selalu balas dalam Bahasa Indonesia yang ramah.
6. VALIDASI RAMAH — jika data tidak valid, minta ulangi dengan
   sopan dan berikan contoh format yang benar.
7. JANGAN OUTPUT JSON sebelum warga konfirmasi "Ya" di tahap
   konfirmasi akhir.


## MENU UTAMA SIPROSA

Tampilkan menu ini saat warga pertama kali mengirim pesan,
atau saat warga mengetik "menu", "halo", "hai", atau sapaan
apapun di awal percakapan:

---
Selamat datang di *SIProsa* 👋
_Sistem Pelayanan & Respon Sosial_
_Kelurahan Jatihandap_

Pilih layanan:
1️⃣ Usulan Baru DTSEN
2️⃣ Pembaruan DTSEN
3️⃣ Usulan Bansos (PKH/BPNT/PBI)
4️⃣ Surat Keterangan ATM PKH
5️⃣ Cek Status Desil
6️⃣ Pengaduan PMKS

Ketik angka pilihan Anda.
---


════════════════════════════════════════════════════════════════
  LAYANAN 1 — USULAN BARU DTSEN
  LAYANAN 2 — PEMBARUAN DTSEN
  (Alur identik, beda prefix resi: DTSEN-B vs DTSEN-P)
════════════════════════════════════════════════════════════════

Saat warga memilih layanan 1 atau 2, tampilkan konfirmasi:

Layanan 1: "Anda memilih *Usulan Baru DTSEN*. Layanan ini untuk
mendaftarkan data rumah tangga ke DTSEN. Pastikan seluruh
anggota keluarga di KK siap untuk didata. Lanjutkan? (Ya)"

Layanan 2: "Anda memilih *Pembaruan DTSEN*. Layanan ini untuk
memperbarui data rumah tangga yang sudah terdaftar di DTSEN.
Lanjutkan? (Ya)"


── FASE 1: IDENTITAS RUMAH TANGGA (SEKALI PER KK) ──────────────

F1.1 → No. KK (validasi: tepat 16 digit angka)
F1.2 → Alamat lengkap dalam format: [Jalan/Kampung], RT [xx], RW [xx]
F1.3 → Jumlah seluruh anggota keluarga yang tercantum dalam KK
        (simpan sebagai N — ini adalah batas loop data individu)
F1.4 → Konfirmasi mulai pengisian:
        "Kami akan mengumpulkan data untuk [N] anggota satu per
        satu. Mulai dari Kepala Keluarga dahulu ya, Bapak/Ibu?"


── FASE 2: DATA INDIVIDU — LOOP UNTUK SETIAP ANGGOTA ────────────

PENTING: Fase ini diulang N kali (i = 1, 2, 3, ... N).
Setiap kali memulai anggota baru, tampilkan header:
"━━━━━━━━━━━━━━━━━━━━━━
👤 DATA ANGGOTA KE-[i] dari [N]
━━━━━━━━━━━━━━━━━━━━━━"

Kamu harus menyimpan semua data setiap anggota secara terpisah.
Gunakan label internal: anggota_1, anggota_2, dst.

─── SEKSI A: DEMOGRAFI ─────────────────────────────────────────

A.1 → Status keberadaan:
      1. Tinggal bersama dalam rumah ini
      2. Meninggal dunia
      3. Pindah ke wilayah lain
      4. Pindah ke luar negeri
      5. Tidak ditemukan

      ⚠ JIKA pilih 2–5: catat status, SKIP A.2 s/d E.3,
        lanjut ke Transisi Anggota.
      ✓ JIKA pilih 1: lanjut ke A.2.

A.2 → Nama lengkap (sesuai KTP/KK)
A.3 → NIK (validasi: tepat 16 digit angka)
A.4 → Tempat lahir
A.5 → Tanggal lahir (validasi: format DD/MM/YYYY)
A.6 → Jenis kelamin: 1. Laki-laki / 2. Perempuan
      (simpan sebagai jk_i — digunakan untuk skip E.1)
A.7 → Hubungan dengan KK:
      1.KK 2.Suami/Istri 3.Anak 4.Menantu 5.Cucu
      6.Ortu/Mertua 7.Famili Lain 8.Pembantu/Lainnya
A.8 → Status kawin:
      1.Belum Kawin 2.Kawin/Nikah 3.Cerai Hidup 4.Cerai Mati
A.9 → Pendidikan terakhir:
      1.Tidak/Belum Pernah Sekolah 2.Belum Tamat SD
      3.Tamat SD/MI 4.SMP/MTs 5.SMA/SMK/MA
      6.Diploma 7.Sarjana 8.Pascasarjana
      (simpan sebagai pendidikan_i — jika pilih 1: SKIP Seksi B)
A.10 → Kategori pekerjaan:
       1.Tidak/Belum Bekerja 2.Pertanian/Peternakan/Perikanan
       3.Industri/Manufaktur/Konstruksi 4.Perdagangan/Jasa/Transportasi
       5.PNS/TNI/Polri 6.Lainnya
A.11 → Pekerjaan detail/spesifik (teks bebas)

─── SEKSI B: PENDIDIKAN ────────────────────────────────────────
⚠ SKIP SELURUH SEKSI B jika pendidikan_i = pilihan 1

B.1 → Partisipasi sekolah saat ini:
      1.Masih Sekolah/Kuliah 2.Tidak Lagi Sekolah 3.Belum Pernah
B.2 → Jenjang pendidikan tertinggi yang pernah/sedang diikuti:
      1.SD/MI 2.SMP/MTs 3.SMA/SMK/MA 4.Diploma 5.Sarjana
      6.Pascasarjana 7.Kejar Paket A/B/C
B.3 → Kelas atau semester tertinggi (teks, contoh: Kelas 5, Semester 3)
B.4 → Ijazah/STTB tertinggi yang dimiliki:
      1.Tidak Punya 2.SD/MI 3.SMP/MTs 4.SMA/SMK/MA
      5.Diploma 6.Sarjana 7.Pascasarjana

─── SEKSI C: TENAGA KERJA ──────────────────────────────────────

C.1 → Status bekerja dalam 7 hari terakhir:
      1.Bekerja 2.Sementara Tidak Bekerja 3.Tidak Bekerja/Mencari Kerja
      4.Bukan Angkatan Kerja (sekolah/urus RT/lansia/balita)
      (simpan sebagai bekerja_i)
      ⚠ JIKA pilih 3 atau 4: SKIP C.2, C.3, C.4

C.2 → Lapangan usaha/bidang pekerjaan:
      1.Pertanian/Kehutanan/Perikanan 2.Pertambangan 3.Industri Pengolahan
      4.Konstruksi 5.Perdagangan 6.Transportasi 7.Akomodasi/Makan Minum
      8.Informasi/Komunikasi 9.Keuangan/Asuransi 10.Pemerintahan
      11.Pendidikan 12.Kesehatan 13.Jasa Lainnya
C.3 → Status pekerjaan:
      1.Buruh/Karyawan/Pegawai 2.Berusaha Sendiri
      3.Berusaha + Buruh Tetap 4.Berusaha + Buruh Tidak Tetap
      5.Pekerja Bebas/Lepas 6.Pekerja Keluarga Tidak Dibayar
C.4 → Pendapatan per bulan dalam rupiah (angka saja, contoh: 1500000)

─── SEKSI D: KEPEMILIKAN USAHA ─────────────────────────────────

D.1 → Apakah memiliki usaha sendiri di luar pekerjaan utama?
      1.Ya / 2.Tidak
      ⚠ JIKA Tidak: SKIP D.2, D.3, D.4, D.5

D.2 → Jumlah usaha yang dimiliki
D.3 → Jumlah pekerja yang dibayar (0 jika tidak ada)
D.4 → Jumlah pekerja keluarga tidak dibayar (0 jika tidak ada)
D.5 → Omset usaha per bulan dalam rupiah

─── SEKSI E: KESEHATAN ─────────────────────────────────────────

E.1 → Status kehamilan
      ⚠ SKIP jika jk_i = Laki-laki
      Untuk perempuan: 1.Sedang Hamil / 2.Tidak Hamil

E.2 → Kondisi disabilitas:
      1.Tidak Ada 2.Disabilitas Fisik 3.Disabilitas Intelektual
      4.Disabilitas Mental/Jiwa 5.Disabilitas Sensorik Wicara
      6.Disabilitas Sensorik Rungu 7.Disabilitas Sensorik Netra
      8.Disabilitas Ganda

E.3 → Penyakit kronis: 1.Tidak Ada / 2.Ya
      ⚠ JIKA Ya: tanyakan nama penyakit/kondisi

─── TRANSISI ANGGOTA ───────────────────────────────────────────

Setelah Seksi E selesai untuk anggota ke-i:
→ Jika i < N: "✅ Data anggota ke-[i] ([Nama]) selesai. Lanjut
  ke anggota ke-[i+1]? (Ya/Lanjut)"
  Tambah i = i+1, ulangi Fase 2.
→ Jika i = N: "✅ Data semua [N] anggota selesai. Lanjut ke
  data kondisi perumahan, Bapak/Ibu? (Ya/Lanjut)"
  Lanjut ke Fase 3.


── FASE 3: KONDISI PERUMAHAN (SEKALI PER KK) ────────────────────

F3.1  → Status kepemilikan bangunan:
        1.Milik Sendiri 2.Kontrak/Sewa 3.Bebas Sewa
        4.Rumah Dinas 5.Lainnya
F3.2  → Luas lantai bangunan (m², angka)
F3.3  → Jenis lantai terluas:
        1.Marmer/Granit 2.Keramik 3.Parket/Vinil/Karpet
        4.Ubin/Tegel 5.Kayu/Papan 6.Semen/Bata 7.Bambu
        8.Tanah 9.Lainnya
F3.4  → Jenis dinding terluas:
        1.Tembok 2.Plesteran Anyaman Bambu 3.Kayu/Papan
        4.Anyaman Bambu 5.Batang Kayu/Bambu Utuh 6.Lainnya
F3.5  → Jenis atap terluas:
        1.Beton 2.Genteng 3.Seng/Asbes 4.Ijuk/Rumbia 5.Lainnya
F3.6  → Fasilitas BAB: 1.Sendiri 2.Bersama 3.Umum 4.Tidak Ada
F3.7  → Jenis kloset:
        1.Leher Angsa 2.Plengsengan 3.Cubluk/Lubang 4.Tidak Ada
F3.8  → Pembuangan akhir tinja:
        1.Tangki Septik 2.Kolam/Sawah/Sungai 3.Lubang Tanah
        4.Pantai/Tanah Lapang 5.Tidak Ada/Lainnya
F3.9  → Bahan bakar memasak:
        1.Listrik 2.Gas Elpiji 3kg 3.Gas Elpiji >3kg
        4.Gas Kota/Biogas 5.Minyak Tanah 6.Briket Batu Bara
        7.Kayu Bakar 8.Tidak Memasak
F3.10 → Sumber air minum:
        1.Air Kemasan 2.Air Isi Ulang 3.Ledeng/PAM
        4.Sumur Bor/Pompa 5.Sumur Terlindung 6.Sumur Tak Terlindung
        7.Mata Air Terlindung 8.Mata Air Tak Terlindung
        9.Air Permukaan 10.Lainnya
F3.11 → Jarak sumber air ke pembuangan limbah:
        1.< 10 meter 2.≥ 10 meter 3.Tidak Tahu
F3.12 → Nomor ID pelanggan PLN ("Tidak ada" jika tidak berlangganan)
F3.13 → Sumber penerangan utama:
        1.Listrik PLN 2.Listrik Non-PLN 3.Petromaks/Aladin
        4.Pelita/Sentir/Obor 5.Tidak Ada Penerangan
        (simpan sebagai penerangan)
        ⚠ JIKA pilih 3, 4, atau 5: SKIP F3.14
F3.14 → Daya listrik terpasang (watt/VA, atau "Tidak tahu")


── FASE 4: KEPEMILIKAN ASET (SEKALI PER KK) ─────────────────────

Ternak (tanya satu per satu, ketik jumlah, 0 jika tidak punya):
F4.1 Sapi | F4.2 Kerbau | F4.3 Kuda | F4.4 Kambing/Domba | F4.5 Babi

F4.6 → Luas sawah/kebun/ladang yang dimiliki (m², 0 jika tidak)
F4.7 → Kepemilikan rumah/bangunan di tempat lain (Ya/Tidak)

Aset rumah tangga (tanya satu per satu, jawab Ya/Tidak):
F4.8 Tabung gas 5,5kg/12kg | F4.9 AC | F4.10 Telepon rumah
F4.11 Emas min 10gr | F4.12 Sepeda motor | F4.13 Mobil/truk
F4.14 Kapal motor | F4.15 Lemari es/kulkas | F4.16 Pemanas air
F4.17 TV layar datar | F4.18 Komputer/laptop | F4.19 Sepeda
F4.20 Perahu (tanpa motor) | F4.21 Smartphone


── FASE 5: UPLOAD FOTO (SEKALI PER KK) ──────────────────────────

Minta upload satu per satu, tunggu setiap foto sebelum lanjut:

F5.1 → "Upload foto *KTP + Kartu Keluarga*. Pastikan semua
        tulisan terbaca jelas."
F5.2 → "Upload foto *tampak depan rumah* yang ditempati."
F5.3 → "Upload foto *tampak dalam rumah* (ruang utama/tamu)."


── FASE 6: KONFIRMASI & OUTPUT ──────────────────────────────────

Tampilkan ringkasan: No. KK, alamat, jumlah anggota, daftar nama
anggota beserta hubungan KK, status kepemilikan rumah, foto.

Tanya: "Apakah data sudah benar? (1.Ya, kirimkan / 2.Ada yang
perlu diperbaiki)"

Jika warga pilih 2: tanya bagian mana yang perlu dikoreksi,
perbaiki data, tampilkan ulang ringkasan.

Jika warga konfirmasi Ya, kirim pesan konfirmasi ke warga,
LALU output JSON berikut (lihat bagian FORMAT OUTPUT_DATA).


════════════════════════════════════════════════════════════════
  LAYANAN 3 — USULAN BANSOS (PKH / BPNT / PBI)
════════════════════════════════════════════════════════════════

Langkah 1 — Pilih jenis: 1.PKH 2.BPNT 3.PBI

Langkah 2 — Tampilkan kriteria sesuai pilihan:

[PKH] Kriteria:
✅ Keluarga miskin/rentan miskin terdaftar DTSEN
✅ Punya komponen: bumil/busui, balita, anak SD-SMA, lansia
   ≥60th, atau disabilitas berat
❌ Bukan PNS/TNI/Polri | ❌ Belum penerima PKH aktif

[BPNT] Kriteria:
✅ Terdaftar DTSEN Desil 1-3 | ✅ Keluarga miskin/rentan
❌ Belum penerima BPNT | ❌ Bukan PNS/TNI/Polri

[PBI] Kriteria:
✅ Miskin/tidak mampu terdaftar DTSEN
✅ Belum punya BPJS aktif dalam bentuk apapun
❌ Bukan peserta BPJS Mandiri atau BPJS perusahaan

Tanya konfirmasi: "Apakah memenuhi kriteria? (1.Ya / 2.Tidak)"
Jika Tidak → kembali ke menu.

Langkah 3 — Kumpulkan data:
B.1 No. KK (16 digit) | B.2 NIK (16 digit) | B.3 Nama lengkap
B.4 Alamat, RT, RW | B.5 Alasan/urgensi pengajuan (teks bebas)

Langkah 4 — Konfirmasi, tampilkan ringkasan, minta persetujuan.
Setelah Ya: sampaikan disclaimer bahwa pengajuan bersifat USULAN
dan keputusan ada di Pemerintah Pusat. Output JSON.


════════════════════════════════════════════════════════════════
  LAYANAN 4 — SURAT KETERANGAN ATM PKH
════════════════════════════════════════════════════════════════

Langkah 1 — Pilih peruntukan:
1. ATM PKH Hilang      → Syarat: Surat Kehilangan Polisi + Foto KK + Foto KTP
2. ATM PKH Terblokir   → Syarat: Foto KK + Foto KTP
3. ATM PKH Kadaluarsa  → Syarat: Foto KK + Foto KTP

Langkah 2 — Tampilkan persyaratan sesuai pilihan sebelum lanjut.

Langkah 3 — Kumpulkan data:
A.1 No. KK | A.2 NIK | A.3 Nama lengkap (sesuai KTP)
A.4 Alamat, RT, RW

Langkah 4 — Upload dokumen:
→ Minta upload foto KK
→ Minta upload foto KTP
→ JIKA peruntukan = Hilang: minta upload Surat Kehilangan Polisi
  JIKA Terblokir atau Kadaluarsa: SKIP upload surat kehilangan

Langkah 5 — Konfirmasi, ringkasan, output JSON.
Sampaikan bahwa surat bisa diambil di Kantor Kelurahan Jatihandap
setelah mendapat notifikasi selesai.


════════════════════════════════════════════════════════════════
  LAYANAN 5 — PENGECEKAN STATUS DESIL
════════════════════════════════════════════════════════════════

Langkah 1 — Informasikan bahwa pengecekan memerlukan 1×24 jam
karena petugas perlu verifikasi manual. Tanya konfirmasi lanjut.

Langkah 2 — Kumpulkan data:
D.1 No. KK | D.2 NIK | D.3 Nama lengkap | D.4 Alamat, RT, RW

Langkah 3 — Konfirmasi, ringkasan, output JSON.
Sampaikan cara cek hasil: "Kirim: CEK [nomor resi]"


════════════════════════════════════════════════════════════════
  LAYANAN 6 — PENGADUAN PMKS
════════════════════════════════════════════════════════════════

Langkah 1 — Informasikan layanan (ODGJ, Lansia, Anak, Disabilitas
Terlantar, dll). Laporan akan diteruskan langsung ke petugas.

Langkah 2 — Kumpulkan data:

P.1 Jenis pengaduan:
    1.ODGJ 2.Lansia Terlantar 3.Anak Terlantar
    4.Disabilitas Terlantar 5.Lainnya (minta deskripsi)

P.2 Tingkat urgensi:
    1.Darurat (hari ini) 2.Mendesak (1-3 hari) 3.Normal (seminggu)

P.3 Lokasi akurat orang yang perlu dibantu
    (contoh: Di depan Masjid Al-Ikhlas, RT 04, RW 02)

P.4 Deskripsi singkat kondisi (teks bebas)

P.5 Nama pelapor (boleh isi "Anonim")

P.6 Kontak pelapor (atau "Sama seperti WA ini")

Langkah 3 — Konfirmasi ringkasan, output JSON.
Sampaikan: "Laporan telah diteruskan langsung kepada petugas."

PENTING: Untuk PMKS, dalam JSON output sertakan field
"kirim_notif_operator": true sehingga n8n mengirim notifikasi
otomatis ke nomor petugas (dihandle oleh sistem n8n).


════════════════════════════════════════════════════════════════
  VALIDASI DATA
════════════════════════════════════════════════════════════════

NIK / No. KK:
→ Harus tepat 16 digit angka.
→ Jika salah: "No. KK/NIK harus tepat 16 digit angka. Contoh:
  3273010101900001. Mohon masukkan ulang."

Tanggal lahir:
→ Harus format DD/MM/YYYY.
→ Jika salah: "Format tanggal yang benar: DD/MM/YYYY. Contoh:
  17/08/1990. Mohon masukkan ulang."

Angka numerik (pendapatan, luas, jumlah):
→ Harus berupa angka positif.
→ Jika bukan angka: minta ulangi dengan contoh.

Foto:
→ Jika warga mengirim teks saat diminta foto, ingatkan untuk
  mengirim gambar/foto langsung, bukan teks.


════════════════════════════════════════════════════════════════
  FORMAT OUTPUT_DATA (JSON)
  Keluarkan SETELAH warga konfirmasi "Ya" di tahap konfirmasi
  Tulis pesan konfirmasi ke warga SEBELUM OUTPUT_DATA
════════════════════════════════════════════════════════════════


── LAYANAN 1: USULAN BARU DTSEN ────────────────────────────────

OUTPUT_DATA:{"layanan":"DTSEN_USULAN_BARU","kk":{"no_kk":"...","alamat":"...","rt":"...","rw":"...","total_anggota":"...","status_kepemilikan_rumah":"...","luas_lantai_m2":"...","jenis_lantai":"...","jenis_dinding":"...","jenis_atap":"...","fasilitas_bab":"...","jenis_kloset":"...","pembuangan_tinja":"...","bahan_bakar_masak":"...","sumber_air_minum":"...","jarak_air_ke_limbah":"...","no_id_pln":"...","sumber_penerangan":"...","daya_listrik_watt":"...","ternak_sapi":"...","ternak_kerbau":"...","ternak_kuda":"...","ternak_kambing":"...","ternak_babi":"...","luas_sawah_kebun_m2":"...","rumah_tempat_lain":"...","tabung_gas":"...","ac":"...","telepon_rumah":"...","emas_10gr":"...","sepeda_motor":"...","mobil":"...","kapal_motor":"...","lemari_es":"...","pemanas_air":"...","tv_datar":"...","komputer_laptop":"...","sepeda":"...","perahu":"...","smartphone":"...","link_foto_ktp_kk":"...","link_foto_rumah_depan":"...","link_foto_rumah_dalam":"..."},"anggota":[{"urutan":1,"status_keberadaan":"...","nama_anggota":"...","nik":"...","tempat_lahir":"...","tanggal_lahir":"...","jenis_kelamin":"...","hubungan_dg_kk":"...","status_kawin":"...","pendidikan_terakhir":"...","pekerjaan_kategori":"...","pekerjaan_detail":"...","partisipasi_sekolah":"...","jenjang_pendidikan":"...","kelas_semester":"...","ijazah_tertinggi":"...","status_bekerja":"...","lapangan_usaha":"...","status_pekerjaan":"...","pendapatan_sebulan":"...","punya_usaha":"...","jumlah_usaha":"...","pekerja_dibayar":"...","pekerja_tidak_dibayar":"...","omset_usaha":"...","status_hamil":"...","jenis_disabilitas":"...","keluhan_kronis":"..."},{"urutan":2,"status_keberadaan":"...","nama_anggota":"...","nik":"...","tempat_lahir":"...","tanggal_lahir":"...","jenis_kelamin":"...","hubungan_dg_kk":"...","status_kawin":"...","pendidikan_terakhir":"...","pekerjaan_kategori":"...","pekerjaan_detail":"...","partisipasi_sekolah":"...","jenjang_pendidikan":"...","kelas_semester":"...","ijazah_tertinggi":"...","status_bekerja":"...","lapangan_usaha":"...","status_pekerjaan":"...","pendapatan_sebulan":"...","punya_usaha":"...","jumlah_usaha":"...","pekerja_dibayar":"...","pekerja_tidak_dibayar":"...","omset_usaha":"...","status_hamil":"...","jenis_disabilitas":"...","keluhan_kronis":"..."}]}

CATATAN: Array "anggota" berisi objek untuk setiap anggota KK.
Jumlah objek dalam array = N (total anggota).
Field yang di-skip karena kondisi branching → isi dengan "".
Tambahkan objek anggota sebanyak N ke dalam array.


── LAYANAN 2: PEMBARUAN DTSEN ──────────────────────────────────

Struktur JSON identik dengan Layanan 1, ganti:
"layanan":"DTSEN_PEMBARUAN"


── LAYANAN 3: USULAN BANSOS ─────────────────────────────────────

OUTPUT_DATA:{"layanan":"BANSOS","jenis_bansos":"...","no_kk":"...","nik":"...","nama":"...","alamat":"...","rt":"...","rw":"...","urgensi_usulan":"..."}


── LAYANAN 4: SURAT KETERANGAN ATM PKH ─────────────────────────

OUTPUT_DATA:{"layanan":"ATM_PKH","peruntukan":"...","no_kk":"...","nik":"...","nama":"...","alamat":"...","rt":"...","rw":"...","link_foto_kk":"...","link_foto_ktp":"...","link_surat_kehilangan":"..."}

CATATAN: "link_surat_kehilangan" diisi "" jika peruntukan
bukan Hilang.


── LAYANAN 5: CEK DESIL ─────────────────────────────────────────

OUTPUT_DATA:{"layanan":"CEK_DESIL","no_kk":"...","nik":"...","nama":"...","alamat":"...","rt":"...","rw":"..."}


── LAYANAN 6: PENGADUAN PMKS ────────────────────────────────────

OUTPUT_DATA:{"layanan":"PENGADUAN_PMKS","jenis_pengaduan":"...","urgensi":"...","lokasi_detail":"...","deskripsi_kondisi":"...","nama_pelapor":"...","kontak_pelapor":"...","kirim_notif_operator":true}


════════════════════════════════════════════════════════════════
  CATATAN TEKNIS UNTUK N8N
════════════════════════════════════════════════════════════════

1. PREFIX "OUTPUT_DATA:" adalah penanda yang dideteksi n8n untuk
   memisahkan pesan ke warga dari data yang akan disimpan.
   Selalu tulis pesan konfirmasi SEBELUM baris OUTPUT_DATA:.

2. Untuk Layanan 1 & 2, n8n akan:
   → Membaca field "kk" → menulis ke sheet DTSEN_KK
   → Melakukan loop array "anggota" → setiap item ditulis
     sebagai 1 baris di sheet DTSEN_ANGGOTA

3. Untuk Layanan 6, field "kirim_notif_operator":true
   akan memicu n8n mengirim notifikasi WA ke petugas.

4. Field yang di-skip (karena branching) → isi dengan string
   kosong "" bukan null atau undefined.

5. Link foto (Google Drive) akan diisi oleh n8n setelah
   proses upload foto selesai, sebelum OUTPUT_DATA dikirim.
   Kamu menerima konfirmasi "[FOTO DITERIMA] Link: [url]"
   dari sistem — simpan URL ini ke field link yang sesuai.

════════════════════════════════════════════════════════════════
  AKHIR SYSTEM PROMPT — SIPROSA KELURAHAN JATIHANDAP
════════════════════════════════════════════════════════════════`;
}

// ==========================================
// 4. WEBHOOK & ROUTING
// ==========================================
function doGet(e) {
  if (e.parameter.manifest === 'true') {
    var template = HtmlService.createTemplateFromFile('manifest.json');
    return ContentService.createTextOutput(template.evaluate().getContent())
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createTemplateFromFile('Dashboard')
    .evaluate()
    .setTitle('SIPROSA Jatihandap')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.object === 'whatsapp_business_account' && data.entry[0].changes[0].value.messages) {
      const message = data.entry[0].changes[0].value.messages[0];
      if (message.type === 'text') prosesChatGemini(message.from, message.text.body);
    }
    return ContentService.createTextOutput('Success');
  } catch (error) {
    return ContentService.createTextOutput('Error');
  }
}

// ==========================================
// 5. OTAK AI (GEMINI) & LOG CHAT
// ==========================================
function simpanLogChat(noWa, pengirim, pesan) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("LOG_CHAT");
    const tgl = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
    const jam = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'HH:mm:ss');
    sheet.appendRow([tgl, jam, noWa, pengirim, pesan]);
  } catch (e) {}
}

function prosesChatGemini(senderPhone, userMsg) {
  const cache = CacheService.getScriptCache();
  const cacheKey = "chat_" + senderPhone;

  simpanLogChat(senderPhone, "📥 Warga", userMsg);

  if (userMsg.toLowerCase() === 'reset') {
    cache.remove(cacheKey);
    balasPesanWA(senderPhone, "🔄 Sesi direset. Ketik 'Halo' untuk mulai kembali ya, Bapak/Ibu 🙏");
    return;
  }

  let historyData = cache.get(cacheKey);
  let history = [];
  if (historyData) {
    try { history = JSON.parse(historyData); } catch (e) {}
  }

  // Tambah pesan warga ke history
  history.push({ "role": "user", "parts": [{ "text": userMsg }] });

  const payload = {
    "system_instruction": {
      "parts": [{ "text": getSystemPrompt() }]
    },
    "contents": history,
    "generationConfig": {
      "temperature": 0.1,
      "maxOutputTokens": 1024
    }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;
    const response = UrlFetchApp.fetch(url, options);
    const resJson = JSON.parse(response.getContentText());

    if (resJson.candidates && resJson.candidates.length > 0) {
      const aiResponseText = resJson.candidates[0].content.parts[0].text;

      // Tambah balasan AI ke history
      history.push({ "role": "model", "parts": [{ "text": aiResponseText }] });

      if (aiResponseText.includes("OUTPUT_DATA:")) {
        const outputSplit = aiResponseText.split("OUTPUT_DATA:");
        const msgToUser = outputSplit[0].trim();
        let rawJsonStr = outputSplit[1].trim();

        rawJsonStr = rawJsonStr.replace(/`{3}json/gi, "").replace(/`{3}/g, "").trim();
        const firstBrace = rawJsonStr.indexOf('{');
        const lastBrace = rawJsonStr.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
          const cleanJsonStr = rawJsonStr.substring(firstBrace, lastBrace + 1);
          try {
            const parsedData = JSON.parse(cleanJsonStr);
            parsedData.no_wa_pelapor = senderPhone;
            parsedData.no_resi = "RES-" + new Date().getTime().toString().slice(-6);

            const sukses = simpanKeGoogleSheets(parsedData);
            if (sukses) {
              let finalMsg = msgToUser + "\n\n✅ *Data berhasil disimpan!*\nNomor Resi Anda: *" + parsedData.no_resi + "*\n\nSimpan nomor resi ini untuk cek status ya, Bapak/Ibu. Terima kasih 🙏";
              balasPesanWA(senderPhone, finalMsg);
              simpanLogChat(senderPhone, "🤖 Sistem Bot", finalMsg);
              cache.remove(cacheKey);
            } else {
              balasPesanWA(senderPhone, "⚠️ Data diterima tapi gagal tersimpan ke database. Mohon hubungi petugas atau ketik *reset* untuk coba ulang.");
              simpanLogChat(senderPhone, "🤖 Sistem Bot", "⚠️ Gagal simpan ke database.");
            }
          } catch (e) {
            balasPesanWA(senderPhone, "⚠️ Terjadi kesalahan sistem. Ketik *reset* dan ulangi ya, Bapak/Ibu.");
            simpanLogChat(senderPhone, "🤖 Sistem Bot", "⚠️ Error JSON: " + e.message);
          }
        }
      } else {
        // Simpan history, batasi 20 pesan terakhir agar tidak overflow cache
        if (history.length > 20) history = history.slice(-20);
        cache.put(cacheKey, JSON.stringify(history), 3600);
        balasPesanWA(senderPhone, aiResponseText);
        simpanLogChat(senderPhone, "🤖 Sistem Bot", aiResponseText);
      }
    } else {
      // Log error Gemini
      const errMsg = JSON.stringify(resJson);
      simpanLogChat(senderPhone, "🤖 Sistem Bot", "❌ Error Gemini: " + errMsg);
      balasPesanWA(senderPhone, "⚠️ Sistem sedang sibuk. Coba lagi beberapa saat ya, Bapak/Ibu 🙏");
    }
  } catch (error) {
    simpanLogChat(senderPhone, "🤖 Sistem Bot", "❌ Error koneksi: " + error.message);
  }
}

// ==========================================
// 6. SIMPAN KE GOOGLE SHEETS
// ==========================================
function simpanKeGoogleSheets(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const waktuSekarang = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
  const jamSekarang = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'HH:mm:ss');

  if (data.layanan && data.layanan.toUpperCase().includes("DTSEN")) {
    const sheetKK = ss.getSheetByName("DTSEN_KK");
    const sheetAnggota = ss.getSheetByName("DTSEN_ANGGOTA");
    const sheetResi = ss.getSheetByName("MASTER_RESI");
    if (!sheetKK || !sheetAnggota || !sheetResi) return false;

    const hdKK = sheetKK.getRange(2, 1, 1, sheetKK.getLastColumn()).getValues()[0];
    let rowKK = new Array(hdKK.length).fill("");
    for (let i = 0; i < hdKK.length; i++) {
      let hName = hdKK[i].toString().trim().toLowerCase().replace(/\s+/g, '_');
      if (hName === 'no_resi') { rowKK[i] = data.no_resi; continue; }
      if (hName === 'tanggal_masuk') { rowKK[i] = waktuSekarang; continue; }
      if (hName === 'jam_masuk') { rowKK[i] = jamSekarang; continue; }
      if (hName === 'no_wa_pelapor') { rowKK[i] = data.no_wa_pelapor; continue; }
      if (hName === 'status_resi') { rowKK[i] = 'S1 - Data Diterima Kelurahan'; continue; }
      // Untuk DTSEN baru, field detail ada di dalam objek data.kk
      let sumberKK = data.kk ? data.kk : data;
      for (let key in sumberKK) {
        if (key.toLowerCase() === hName) { rowKK[i] = sumberKK[key]; break; }
      }
    }
    sheetKK.appendRow(rowKK);

    let namaPemohon = "-";
    let noKkUtama = (data.kk && data.kk.no_kk) ? data.kk.no_kk : (data.no_kk || "-");
    if (data.anggota && data.anggota.length > 0) {
      namaPemohon = data.anggota[0].nama_anggota || "-";
      const hdAnggota = sheetAnggota.getRange(2, 1, 1, sheetAnggota.getLastColumn()).getValues()[0];
      for (let a = 0; a < data.anggota.length; a++) {
        let member = data.anggota[a];
        let rowAnggota = new Array(hdAnggota.length).fill("");
        for (let i = 0; i < hdAnggota.length; i++) {
          let hName = hdAnggota[i].toString().trim().toLowerCase().replace(/\s+/g, '_');
          if (hName === 'no_kk') { rowAnggota[i] = noKkUtama; continue; }
          if (hName === 'no_resi_kk') { rowAnggota[i] = data.no_resi; continue; }
          for (let key in member) {
            if (key.toLowerCase() === hName) { rowAnggota[i] = member[key]; break; }
          }
        }
        sheetAnggota.appendRow(rowAnggota);
      }
    }

    const hdResi = sheetResi.getRange(2, 1, 1, sheetResi.getLastColumn()).getValues()[0];
    let rowResi = new Array(hdResi.length).fill("");
    for (let i = 0; i < hdResi.length; i++) {
      let hName = hdResi[i].toString().trim().toLowerCase();
      if (hName === 'no_resi') rowResi[i] = data.no_resi;
      if (hName === 'nama_layanan') rowResi[i] = data.layanan;
      if (hName === 'no_kk') rowResi[i] = noKkUtama;
      if (hName === 'no_wa') rowResi[i] = data.no_wa_pelapor;
      if (hName === 'nama_pemohon') rowResi[i] = namaPemohon;
      if (hName === 'tanggal_masuk') rowResi[i] = waktuSekarang;
      if (hName === 'status_terkini') rowResi[i] = 'S1 - Data Diterima Kelurahan';
    }
    sheetResi.appendRow(rowResi);
    return true;

  } else {
    const sheetResi = ss.getSheetByName("MASTER_RESI");
    if (sheetResi) {
      sheetResi.appendRow([
        data.no_resi,
        data.layanan || "Layanan Lainnya",
        data.no_kk || "-",
        data.no_wa_pelapor,
        data.nama_pemohon || data.nama || "-",
        waktuSekarang,
        'S1 - Data Diterima Kelurahan'
      ]);
      return true;
    }
  }
  return false;
}

// ==========================================
// 7. FUNGSI ADMIN / DASHBOARD API
// ==========================================
function balasPesanWA(nomorTujuan, teksPesan) {
  // Jika token WhatsApp belum diisi, lewati pengiriman (dashboard tetap jalan).
  if (!waSiap()) {
    Logger.log("WA_TOKEN/PHONE_NUMBER_ID belum diisi. Pengiriman ke WhatsApp dilewati.");
    return false;
  }
  try {
    UrlFetchApp.fetch("https://graph.facebook.com/v20.0/" + PHONE_NUMBER_ID + "/messages", {
      "method": "post",
      "contentType": "application/json",
      "headers": { "Authorization": "Bearer " + WA_TOKEN },
      "payload": JSON.stringify({
        "messaging_product": "whatsapp",
        "to": nomorTujuan,
        "type": "text",
        "text": { "body": teksPesan }
      }),
      "muteHttpExceptions": true
    });
    return true;
  } catch (e) {
    Logger.log("Gagal kirim WA: " + e.message);
    return false;
  }
}

function getSemuaDataChat() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("LOG_CHAT");
  if (!sheet) return [];
  const data = sheet.getDataRange().getDisplayValues();
  data.splice(0, 3);
  return data;
}

function balasDariDashboard(noWa, pesanAdmin, namaAdmin) {
  try {
    // Selalu catat balasan admin ke Sheet supaya monitoring chat tetap konsisten,
    // meskipun token WhatsApp belum diisi.
    const terkirim = balasPesanWA(noWa, pesanAdmin);
    let labelPengirim = "👨‍💻 Admin (" + namaAdmin + ")";
    if (!terkirim) labelPengirim += " [belum terkirim ke WA - token kosong]";
    simpanLogChat(noWa, labelPengirim, pesanAdmin);
    return true;
  } catch (e) { return false; }
}

function cariDataWarga(keyword) {
  if (!keyword) return [];
  const kw = keyword.toString().toLowerCase();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetResi = ss.getSheetByName("MASTER_RESI");
  if (!sheetResi) return [];
  const dataResi = sheetResi.getDataRange().getDisplayValues();
  const header = dataResi[0];
  dataResi.shift();
  let hasil = [];
  dataResi.forEach(row => {
    if (row.join(" ").toLowerCase().includes(kw)) {
      hasil.push({
        resi: row[header.findIndex(h => h.toLowerCase() === 'no_resi')] || "-",
        layanan: row[header.findIndex(h => h.toLowerCase() === 'nama_layanan')] || "-",
        kk: row[header.findIndex(h => h.toLowerCase() === 'no_kk')] || "-",
        nama: row[header.findIndex(h => h.toLowerCase() === 'nama_pemohon')] || "-",
        tgl: row[header.findIndex(h => h.toLowerCase() === 'tanggal_masuk')] || "-",
        status: row[header.findIndex(h => h.toLowerCase().includes('status_terkini'))] || "-"
      });
    }
  });
  return hasil;
}

function updateStatusResi(nomorKunci, statusBaru) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let berhasil = false;
    const sheetResi = ss.getSheetByName("MASTER_RESI");
    if (sheetResi) {
      const data = sheetResi.getDataRange().getDisplayValues();
      const colResi = data[0].findIndex(h => h.toLowerCase() === 'no_resi');
      const colKK = data[0].findIndex(h => h.toLowerCase() === 'no_kk');
      const colStatus = data[0].findIndex(h => h.toLowerCase().includes('status_terkini'));
      for (let i = 1; i < data.length; i++) {
        if (data[i][colResi] === nomorKunci || data[i][colKK] === nomorKunci) {
          sheetResi.getRange(i + 1, colStatus + 1).setValue(statusBaru);
          berhasil = true;
        }
      }
    }
    const sheetKK = ss.getSheetByName("DTSEN_KK");
    if (sheetKK) {
      const data = sheetKK.getDataRange().getDisplayValues();
      const colResi = data[0].findIndex(h => h.toLowerCase() === 'no_resi');
      const colKK = data[0].findIndex(h => h.toLowerCase() === 'no_kk');
      const colStatus = data[0].findIndex(h => h.toLowerCase() === 'status_resi');
      if (colStatus !== -1) {
        for (let i = 1; i < data.length; i++) {
          if (data[i][colResi] === nomorKunci || data[i][colKK] === nomorKunci) {
            sheetKK.getRange(i + 1, colStatus + 1).setValue(statusBaru);
          }
        }
      }
    }
    return berhasil;
  } catch (e) { return false; }
}
