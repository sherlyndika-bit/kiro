# Migrasi WF1 → v3 (Memory + Direct Supabase)

File: [`workflow-1-incoming-message-v3.json`](./workflow-1-incoming-message-v3.json)

## Apa yang baru di v3 (vs v2)

| Aspek | v2 | v3 |
|---|---|---|
| Save customer message | Lewat WF4 (sering gagal/role salah) | **Direct ke Supabase** sebelum classify (zero ghosting) |
| Save AI reply | Tidak disimpan ke Supabase | **Direct ke Supabase** setelah Build Decision |
| AI Memory | Tidak ada — setiap pesan standalone | **10 pesan terakhir** di-load sebagai konteks Groq |
| Update conversation metadata | Cuma last_message di WF4 | **Memory rich**: lastIntent, confidence, buildingType, tier, areaSqm |
| Pesan masuk dashboard | Tergantung WF4 active & WA Send sukses | **Pasti masuk** — dilakukan sebelum classify |
| Customer balas konteks (e.g. "rumah" setelah ditanya) | Diklasifikasi sbg OTHER → ghosting | Klasifikasi tepat: ASK_PRICE + extracted.building_type=rumah |
| Total nodes | 12 | 17 |

## Memory in action — contoh percakapan

**Tanpa memory (v2)**:
```
Customer: halo
Syifa: Halo, mau bangun apa?
Customer: rumah
[Groq classify "rumah" → OTHER 0.4 → low conf → human handoff] ❌
```

**Dengan memory (v3)**:
```
Customer: halo
[Groq sees: this is greeting → GREETING 0.95]
Syifa: Halo, mau bangun apa?
Customer: rumah
[Groq sees full context: greeting + "rumah" → ASK_PRICE, extracted.building_type=rumah]
Syifa: Oke, desain rumah ya. Berapa luas areanya?
Customer: 80m2
[Groq sees: rumah + 80 → ASK_PRICE complete, extracted.building_type=rumah, area_sqm=80]
Syifa: Oke, Syifa lagi hitungin estimasi buat rumah 80m². Tunggu ya 📊
[Triggers WF2 Estimator] ✓
```

## Persyaratan setup di n8n (sekali aja)

### 1. Credential `Supabase Authorization` (HTTP Header Auth)
- **Name**: `Supabase Authorization`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer eyJhbGciOiJIUzI1NiI...` (ganti dengan **Supabase anon key** atau **service_role key** kamu)
- ID credential: `supabase-cred` (sudah di-reference di workflow JSON, akan auto-link kalau ID match)

> 💡 **Pakai service_role key** kalau RLS aktif dan kamu mau bypass policy.
> Pakai **anon key** kalau tabel pakai RLS yang sudah allow insert dari anon.

### 2. Credential `Groq API Header` (sudah ada — tidak berubah)
- Bearer token dari Groq Console

### 3. Credential `WhatsApp Business Cloud` (sudah ada — tidak berubah)

## Cara migrasi (~10 menit)

### A — Persiapan (kalau belum ada)
1. Buka n8n → **Settings → Credentials**
2. Cek apakah credential **"Supabase Authorization"** sudah ada
3. Kalau belum, klik **Add credential** → pilih **HTTP Header Auth**:
   - Header Name: `Authorization`
   - Header Value: `Bearer <supabase-anon-or-service-key>`
   - Save → beri nama `Supabase Authorization`

### B — Import workflow v3
1. **Workflows** → **Add workflow** → menu `⋯` → **Import from File**
2. Pilih `workflow-1-incoming-message-v3.json`
3. **JANGAN aktifkan dulu**

### C — Re-link credentials di node-node berikut (kalau ada warning kuning)
- `WhatsApp Trigger` & `Send WA Reply` → pilih credential WhatsApp Business Cloud
- `Groq — Classify with Memory` → pilih credential Groq API Header
- `Save Conversation (incoming)` → pilih `Supabase Authorization`
- `Save Message (client)` → pilih `Supabase Authorization`
- `Fetch Conversation History` → pilih `Supabase Authorization`
- `Save AI Reply` → pilih `Supabase Authorization`
- `Update Conversation Memory` → pilih `Supabase Authorization`

### D — Sesuaikan Phone Number ID & Supabase URL
Kalau Phone Number ID kamu beda dari `1052743247932102`:
- Cari semua node yang punya field `phoneNumberId` atau hardcoded di body — ganti

Kalau Supabase URL kamu beda dari `wbfqudrzwsnlzevxjlkm.supabase.co`:
- Update URL di 5 node Supabase

### E — Test mode
1. Klik node **Parse WA Message** → tombol **Execute Node** dengan input dummy:
   ```json
   {
     "messages": [{ "id": "test1", "from": "6281234567890", "type": "text", "text": { "body": "halo" }, "timestamp": "1700000000" }],
     "contacts": [{ "profile": { "name": "Tester" } }],
     "metadata": { "phone_number_id": "1052743247932102" }
   }
   ```
2. Klik **Execute Workflow** dari atas — flow jalanin semua node
3. Cek di Supabase dashboard: tabel `conversations` & `messages` harus ada record baru

### F — Cutover
1. **Deactivate WF1 v2** lama (toggle off)
2. **Activate WF1 v3** (toggle on)
3. Kirim WA dari HP ke nomor bisnis dengan pesan "halo"
4. Cek dashboard: percakapan & pesan customer harus muncul **paling lama 5 detik**

### G — Rollback (kalau ada masalah)
- Deactivate v3 → activate v2 → kondisi semula

## Troubleshooting

### Pesan tidak masuk dashboard

Cek satu-per-satu di n8n executions list:

1. **WhatsApp Trigger ke-fire?** → Kalau tidak: webhook Meta belum verified atau workflow tidak active
2. **Save Conversation (incoming) success?** (status 200/201) → Kalau gagal:
   - 401: anon key salah / expired → update credential
   - 403: RLS blocking → pakai service_role key
   - 400: schema mismatch → cek tabel `conversations` punya kolom yang sesuai (`id`, `client_name`, `source`, `mode`, `status`, `last_message`, `last_message_at`, `unread_count`, `updated_at`, `metadata`)
3. **Save Message (client) success?** → Sama, cek tabel `messages`

### AI tidak ngerti konteks (memory ga jalan)

1. **Fetch Conversation History** harus return array. Kalau return `[]`:
   - Conversation_id baru (first message ever) — normal, memory akan terbangun mulai pesan kedua
   - Atau RLS blocking SELECT → pakai service_role key untuk credential
2. Cek **Build Memory Context** output: `chatHistory` harus berisi array, `memorySummary` berisi teks ringkasan

### Groq return non-JSON

Sudah saya set `response_format: { "type": "json_object" }` di body — Groq llama-3.3 dukung ini. Kalau tetap error, fallback ke `OTHER` confidence 0.3 → flag ke human (Syifa balas template).

## Memory Architecture

```
[Pesan baru masuk]
        ↓
[Save ke Supabase messages] ← langsung, sebelum classify
        ↓
[Fetch last 10 messages dari conversation ini]
        ↓
[Format: chatHistory array + memorySummary text]
        ↓
[Groq prompt: SYSTEM rules + USER (memorySummary + pesan baru)]
        ↓
[Groq output JSON intent + extracted dengan konteks]
        ↓
[Build Decision: pilih reply berdasarkan intent + ext]
        ↓
[Save AI reply ke messages] ← jadi memory untuk pesan berikutnya
[Update conversation.metadata dengan lastIntent, buildingType, dst]
```

Memory tersimpan di **2 tempat**:
1. Tabel `messages` (full chat history) — untuk konteks Groq
2. Tabel `conversations.metadata` (extracted entities) — untuk dashboard tampilan & trigger estimator/proposal

## Keuntungan v3 dibanding pakai WF4

- **Atomic & explicit**: 1 workflow handle conversation + message save langsung, no dependency ke WF4
- **Faster**: 1 hop (n8n → Supabase) vs 2 hop (n8n → n8n → Supabase via WF4)
- **Easier debugging**: tiap node ada log error specific (vs WF4 yang generic)
- **Memory built-in**: Groq selalu punya konteks
- **Robust to AI errors**: customer message disimpan SEBELUM Groq di-call, jadi walau Groq error / Send WA gagal, conversation tetap tampil di dashboard

WF4 tetap dipertahankan di repo untuk dipakai oleh **WF2 (Estimator)** dan **WF3 (Proposal)** — biar mereka cuma kirim 1 webhook ke `/incoming-conversation` saat selesai generate hasil.
