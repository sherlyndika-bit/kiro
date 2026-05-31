# Deploy Dashboard ke Vercel (gratis)

Dashboard ini adalah app statis (Vite + React). Cara tercepat & gratis untuk
online adalah lewat Vercel. Nanti bisa dipindah ke domain sendiri.

## Langkah (sekali setup, ±5 menit)

1. Buka https://vercel.com → **Sign up / Log in pakai akun GitHub**.
2. Klik **Add New… → Project**.
3. Pilih repo **`sherlyndika-bit/kiro`** → **Import**.
4. Vercel auto-deteksi Vite. Pastikan setelan ini (biasanya sudah otomatis):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Root Directory:** biarkan default (root repo)
5. (Opsional) **Environment Variables** — kalau mau override default:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_N8N_WEBHOOK_URL` (mis. `https://n8n.srv1696073.hstgr.cloud/webhook`)
   - `VITE_DASHBOARD_EMAIL`, `VITE_DASHBOARD_PASSWORD`
   > Kalau dikosongkan, app pakai nilai default yang sudah ada di kode.
6. Klik **Deploy**. Tunggu ±1 menit.
7. Selesai → dapat URL seperti `https://kiro-xxxx.vercel.app`.

Buka URL itu → muncul halaman login. Masuk pakai kredensial dashboard.

## Update otomatis
Setiap kali ada commit baru ke branch `main` di GitHub, Vercel otomatis
build & deploy ulang. Tidak perlu upload manual.

## File pendukung
- `vercel.json` — sudah disiapkan. Bagian `rewrites` membuat semua route
  diarahkan ke `index.html`, jadi refresh halaman tidak 404 (SPA).

## Nanti: pindah ke domain sendiri (sudutruang.com)
Setelah punya akses DNS domain:

### Opsi A — subdomain `dashboard.sudutruang.com` (paling gampang)
1. Di Vercel project → **Settings → Domains → Add** → ketik
   `dashboard.sudutruang.com`.
2. Vercel kasih record DNS (CNAME). Tambahkan di pengaturan DNS domain
   (Hostinger): CNAME `dashboard` → `cname.vercel-dns.com`.
3. Tunggu propagasi. Jadi: https://dashboard.sudutruang.com

### Opsi B — subfolder `sudutruang.com/dashboard`
Lebih rumit kalau web utama beda server. Biasanya pakai reverse proxy di
server utama (Nginx) yang mem-forward `/dashboard` ke Vercel, atau host
dashboard di server yang sama. Sarankan Opsi A (subdomain) dulu.

## Catatan keamanan
- Anon key Supabase & URL n8n akan terlihat di bundle (wajar untuk anon key).
  Pastikan RLS Supabase aktif (sudah diperketat di skema).
- Ganti password default lewat Settings → Akun setelah online, atau set
  `VITE_DASHBOARD_PASSWORD` di Environment Variables Vercel.
- CORS: webhook n8n yang dipanggil dari domain Vercel harus mengizinkan
  origin tersebut (set Allowed Origins `*` atau domain Vercel di node Webhook).
