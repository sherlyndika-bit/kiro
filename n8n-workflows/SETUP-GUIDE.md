# Sudut Ruang — Setup Guide
## n8n + Meta WhatsApp Business API + Google Sheets

---

## Daftar Isi
1. [Persiapan Akun & API Keys](#1-persiapan-akun--api-keys)
2. [Setup VPS Hostinger](#2-setup-vps-hostinger)
3. [Setup n8n di VPS](#3-setup-n8n-di-vps)
4. [Setup Meta WhatsApp Business API](#4-setup-meta-whatsapp-business-api)
5. [Setup Google Sheets](#5-setup-google-sheets)
6. [Import Workflow ke n8n](#6-import-workflow-ke-n8n)
7. [Setup Credentials di n8n](#7-setup-credentials-di-n8n)
8. [Tambah Sheet Baru di Spreadsheet](#8-tambah-sheet-baru-di-spreadsheet)
9. [Test End-to-End](#9-test-end-to-end)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Persiapan Akun & API Keys

Daftar dan ambil API key dari semua service ini sebelum mulai:

### Groq (LLM — Gratis)
1. Buka https://console.groq.com
2. Sign up dengan Google / GitHub
3. Klik **API Keys** → **Create API Key**
4. Copy dan simpan key-nya: `gsk_xxxxxxxxxxxx`
5. Free tier: 14.400 request/hari, lebih dari cukup

### html2pdf.app (PDF Generator — Gratis)
1. Buka https://html2pdf.app
2. Sign up → masuk ke dashboard
3. Copy API key dari halaman utama
4. Free tier: 100 PDF/bulan

### Google Account
- Cukup pakai Google Account yang sama dengan spreadsheet
- Akan dipakai untuk Google Sheets OAuth di langkah 5

---

## 2. Setup VPS Hostinger

### Spesifikasi minimum yang dibutuhkan
- VPS KVM1 atau lebih (1 CPU, 4GB RAM)
- OS: Ubuntu 22.04 LTS
- Port yang perlu dibuka: 80, 443, 5678

### Buka port di Hostinger
1. Login ke hPanel Hostinger
2. Klik VPS → **Manage**
3. Masuk ke **Firewall**
4. Tambah rule:
   - Port 5678 (n8n), Protocol TCP, Source: Any
   - Port 80 (HTTP), Protocol TCP, Source: Any
   - Port 443 (HTTPS), Protocol TCP, Source: Any
5. Catat **IP publik VPS** (contoh: `123.45.67.89`)

### Arahkan domain/subdomain ke VPS (opsional tapi direkomendasikan)
Di DNS provider Anda, tambah A record:
```
n8n.sudutruang.com  →  123.45.67.89
```
Meta WA webhook butuh HTTPS, jadi domain lebih mudah setup SSL-nya.

---

## 3. Setup n8n di VPS

SSH ke VPS lalu jalankan perintah berikut satu per satu.

### Install Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### Install Docker Compose
```bash
sudo apt install docker-compose-plugin -y
docker compose version
```

### Buat folder n8n
```bash
mkdir -p ~/n8n && cd ~/n8n
```

### Buat file docker-compose.yml
```bash
cat > docker-compose.yml << 'EOF'
version: "3.8"

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.sudutruang.com        # Ganti dengan domain/IP Anda
      - N8N_PORT=5678
      - N8N_PROTOCOL=https                  # Ganti ke http kalau pakai IP
      - WEBHOOK_URL=https://n8n.sudutruang.com/  # URL webhook publik
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin           # Ganti username
      - N8N_BASIC_AUTH_PASSWORD=GantiPassword123!  # Ganti password kuat
      - GENERIC_TIMEZONE=Asia/Jakarta
      - TZ=Asia/Jakarta
      - N8N_LOG_LEVEL=info
      - N8N_METRICS=true
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
EOF
```

### Jalankan n8n
```bash
docker compose up -d
docker compose logs -f   # Lihat log, Ctrl+C untuk keluar
```

### Setup SSL dengan Caddy (kalau pakai domain)
```bash
sudo apt install caddy -y

sudo cat > /etc/caddy/Caddyfile << 'EOF'
n8n.sudutruang.com {
    reverse_proxy localhost:5678
}
EOF

sudo systemctl restart caddy
sudo systemctl enable caddy
```

### Verifikasi
Buka browser: `https://n8n.sudutruang.com` atau `http://IP_VPS:5678`
Login dengan username/password yang tadi diset.

---

## 4. Setup Meta WhatsApp Business API

> **Catatan:** Langkah ini dilakukan bersama client Anda karena butuh akses ke akun bisnis mereka.

### 4.1 Buat Meta Business Account
1. Buka https://business.facebook.com
2. Buat akun bisnis jika belum ada
3. Verifikasi bisnis (butuh dokumen — bisa KTP/NPWP untuk perseorangan)

### 4.2 Buat Meta Developer App
1. Buka https://developers.facebook.com
2. Klik **My Apps** → **Create App**
3. Pilih tipe: **Business**
4. Isi nama app: `Sudut Ruang Bot`
5. Pilih Business Account yang tadi dibuat
6. Setelah app dibuat, klik **Add Products**
7. Cari **WhatsApp** → klik **Set up**

### 4.3 Setup WhatsApp Business
1. Di sidebar, klik **WhatsApp** → **API Setup**
2. Catat **Phone Number ID** (format: `1234567890123`)
3. Catat **WhatsApp Business Account ID**
4. Klik **Generate Token** → Catat **Temporary Access Token**
   > Untuk production, buat **Permanent System User Token** (lihat langkah 4.5)

### 4.4 Daftarkan Webhook
1. Di sidebar, klik **WhatsApp** → **Configuration**
2. Di bagian **Webhook**, klik **Edit**
3. Isi:
   - **Callback URL:** `https://n8n.sudutruang.com/webhook/wa-incoming`
   - **Verify Token:** buat token unik, contoh: `sudutruang-verify-2024`
4. Klik **Verify and Save**
5. Setelah verified, aktifkan subscription: **messages**

> Untuk verifikasi webhook berhasil, n8n webhook Workflow 1 harus sudah aktif dulu.
> Workflow 1 sudah handle GET request dari Meta untuk verification.

### 4.5 Buat Permanent System User Token (Production)
1. Di Meta Business Suite → **Settings** → **System Users**
2. Klik **Add** → Nama: `n8n-bot`, Role: **Admin**
3. Klik **Generate Token**
4. Pilih app Anda, centang permission:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copy token (simpan baik-baik, tidak bisa dilihat lagi)

### 4.6 Tambahkan Nomor WA (Kalau Pakai Nomor Sendiri)
1. Di **WhatsApp** → **Phone Numbers** → **Add Phone Number**
2. Ikuti proses verifikasi SMS/voice call
3. Nomor aktif = bisa kirim/terima pesan

---

## 5. Setup Google Sheets

### 5.1 Buat Google Cloud Project
1. Buka https://console.cloud.google.com
2. Klik **New Project** → Nama: `sudut-ruang-n8n`
3. Aktifkan **Google Sheets API**:
   - Search: "Google Sheets API"
   - Klik **Enable**

### 5.2 Buat Service Account
1. Di Google Cloud Console → **IAM & Admin** → **Service Accounts**
2. Klik **Create Service Account**
3. Nama: `n8n-sheets-reader`
4. Role: **Editor**
5. Klik **Done**
6. Klik service account yang baru dibuat → **Keys** → **Add Key** → **JSON**
7. Download file JSON (simpan sebagai `sudut-ruang-service-account.json`)

### 5.3 Share Spreadsheet ke Service Account
1. Buka file JSON yang didownload
2. Copy nilai `client_email` (format: `n8n-sheets-reader@sudut-ruang-n8n.iam.gserviceaccount.com`)
3. Buka spreadsheet Sudut Ruang di Google Sheets
4. Klik **Share** → paste email service account
5. Set permission: **Editor**
6. Klik **Send**

---

## 6. Import Workflow ke n8n

1. Login ke n8n
2. Klik **Workflows** → **Import from file**
3. Import ketiga file ini secara berurutan:
   - `workflow-1-incoming-message.json`
   - `workflow-2-estimator.json`
   - `workflow-3-proposal-generator.json`
4. Setelah import, **jangan aktifkan dulu** — setup credentials dulu

---

## 7. Setup Credentials di n8n

Buka **Settings** → **Credentials** → **Add Credential** untuk setiap item berikut.

### 7.1 Groq API
- Type: **Groq API**
- Name: `Groq API`
- API Key: `gsk_xxxxxxxxxxxx` (dari langkah 1)

### 7.2 Meta WA Bearer Token
- Type: **HTTP Header Auth**
- Name: `Meta WA Bearer Token`
- Header Name: `Authorization`
- Header Value: `Bearer EAAB...` (token dari langkah 4.3 atau 4.5)

### 7.3 Google Sheets
- Type: **Google Sheets OAuth2 API**
- Name: `Google Sheets (Service Account)`
- Klik **Connect** → Upload file JSON service account dari langkah 5.2

### 7.4 html2pdf API Key
- Buka Workflow 3 → node **HTML2PDF — Generate PDF**
- Ganti `$vars.HTML2PDF_API_KEY` dengan API key dari html2pdf.app
- Atau: tambah di **Settings** → **Variables**:
  - Key: `HTML2PDF_API_KEY`
  - Value: `key_xxxxxxxxx`

---

## 8. Tambah Sheet Baru di Spreadsheet

Buka spreadsheet Sudut Ruang dan tambah 2 sheet baru:

### Sheet: `clients_database`
Buat header di baris 1 (kolom A–K):
```
phone | name | last_intent | building_type | tier | area_sqm | rab_avg | fee_avg | status | last_contact | source
```

### Sheet: `proposal_history`
Buat header di baris 1 (kolom A–L):
```
proposal_no | phone | client_name | building_type | tier | area_sqm | rab_avg | fee_avg | total_fee | sent_at | status | valid_until
```

> **Penting:** Nama sheet harus sama persis dengan yang ada di workflow.

---

## 9. Test End-to-End

### 9.1 Aktifkan semua workflow
1. Buka setiap workflow di n8n
2. Klik toggle **Active** di kanan atas
3. Pastikan status: **Active** (hijau)

### 9.2 Test Workflow 1 — Greeting
Kirim WA ke nomor bisnis:
```
"Halo, mau tanya"
```
**Expected:** Bot balas sambutan dalam 5–10 detik

### 9.3 Test Workflow 2 — Estimasi
Kirim WA:
```
"Berapa biaya desain cafe 80m2 premium?"
```
**Expected:** Bot balas dengan estimasi RAB + fee lengkap

### 9.4 Test Workflow 3 — Proposal
Kirim WA:
```
"Mau dibuatkan proposal dong"
```
**Expected:**
1. Bot balas minta konfirmasi data
2. Setelah data lengkap, kirim file PDF proposal
3. 2 hari kemudian, auto follow-up

### 9.5 Cek Google Sheets
Setelah test, buka spreadsheet:
- Sheet `clients_database` → harus ada data client baru
- Sheet `proposal_history` → harus ada record proposal

### 9.6 Cek Dashboard
Buka dashboard React → **Active Chats** → percakapan test harus muncul

---

## 10. Troubleshooting

### Webhook Meta tidak terverifikasi
- Pastikan Workflow 1 status **Active** sebelum setup webhook di Meta
- Pastikan URL webhook bisa diakses dari internet (bukan localhost)
- Cek: `curl https://n8n.sudutruang.com/webhook/wa-incoming`

### Pesan masuk tapi tidak ada reply
1. Buka n8n → **Executions** → lihat execution terakhir
2. Klik execution → lihat node mana yang error (warna merah)
3. Klik node error → lihat pesan error di panel kanan

### Google Sheets error "Permission Denied"
- Pastikan email service account sudah di-share di spreadsheet
- Cek nama sheet di workflow sama persis dengan nama sheet di Google Sheets

### Groq error "Rate limit"
- Free tier Groq: 14.400 req/hari, ~10 req/menit
- Kalau kena limit, tambah **Wait node** 6 detik sebelum Groq node

### PDF tidak tergenerate
- Cek API key html2pdf.app di Variables
- Test manual: buka node **HTML2PDF** → klik **Test Step**
- Cek apakah free tier sudah habis (100 PDF/bulan)
- Alternatif: gunakan node **Carbone** dengan template .docx

### n8n tidak bisa diakses setelah restart VPS
```bash
cd ~/n8n
docker compose up -d
docker compose ps   # pastikan status: Up
```

---

## Arsitektur Ringkas

```
Client WA
   │  kirim pesan
   ▼
Meta WA API
   │  POST webhook
   ▼
n8n VPS (Hostinger)
   │
   ├─ WF1: Classify intent (Groq LLaMA 3.3)
   │     ├─ GREETING → auto reply sambutan
   │     ├─ ASK_PRICE → trigger WF2
   │     ├─ REQUEST_PROPOSAL → trigger WF3
   │     └─ NEEDS_HUMAN → notify dashboard
   │
   ├─ WF2: Auto Estimator
   │     ├─ Read Google Sheets (RAB + Fee)
   │     ├─ Calculate RAB + Fee + PPN
   │     ├─ Send WA reply
   │     └─ Log ke sheets + dashboard
   │
   └─ WF3: Proposal Generator
         ├─ Build HTML proposal
         ├─ Convert ke PDF (html2pdf.app)
         ├─ Upload ke Meta Media API
         ├─ Send PDF via WA
         ├─ Log ke sheets + dashboard
         └─ Wait 2 days → auto follow-up

Google Sheets (Source of Truth)
   ├─ Sheet: Fee Jasa Arsitek
   ├─ Sheet: RAB Biaya Konstruksi
   ├─ Sheet: clients_database  ← ditulis oleh n8n
   └─ Sheet: proposal_history  ← ditulis oleh n8n

Dashboard React (Monitoring)
   ├─ Lihat semua percakapan real-time
   ├─ Take over conversation (AI → Human)
   └─ Kirim pesan manual
```

---

## Estimasi Biaya Operasional per Bulan

| Service | Free Tier | Estimasi (50 leads/bulan) |
|---|---|---|
| Groq | 14.400 req/hari | Gratis |
| html2pdf.app | 100 PDF/bulan | Gratis |
| Google Sheets API | Unlimited | Gratis |
| Meta WA API | Gratis | Gratis |
| VPS Hostinger KVM1 | — | ~Rp 120.000/bulan |
| Domain (opsional) | — | ~Rp 15.000/bulan |
| **Total** | | **~Rp 135.000/bulan** |

---

*Sudut Ruang AI System — Setup Guide v1.0*
