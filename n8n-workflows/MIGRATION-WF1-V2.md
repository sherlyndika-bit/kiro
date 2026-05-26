# Migrasi WF1 → v2 (Zero Ghosting)

File: [`workflow-1-incoming-message-v2.json`](./workflow-1-incoming-message-v2.json)

## Apa yang berubah

| Aspek | WF1 lama | WF1 v2 |
|---|---|---|
| Routing | Switch v3 dengan 4 rule + fallback (fallback **tidak ke-connect**) | Single Code node "Build Decision" |
| Pesan tanpa balasan | Bisa terjadi (intent `OTHER`/`FOLLOW_UP`/`GENERAL_QUESTION` jatuh ke void) | **Tidak pernah** — `replyText` selalu non-empty |
| Trigger WF3 (Proposal) | Tidak pernah ke-trigger (di-block IF) | Trigger via dedicated IF node |
| Detect low-confidence | Tidak ada | Otomatis flag `needs_human` jika confidence < 0.45 |
| Jumlah node | 16 | 12 (lebih simpel) |

## Logic decision per intent

```
Confidence < 0.45 atau needs_human=true   → reply ack + flag dashboard
GREETING                                  → reply sapaan random
ASK_PRICE + type & area lengkap           → reply + trigger WF2 Estimator
ASK_PRICE + type only                     → reply tanya area
ASK_PRICE + area only                     → reply tanya tipe bangunan
ASK_PRICE + kosong                        → reply form lengkap
REQUEST_PROPOSAL                          → reply konfirm + trigger WF3 Proposal
FOLLOW_UP                                 → reply ack + flag human
GENERAL_QUESTION                          → reply ack + flag human
OTHER                                     → reply probe (jangan ghosting)
```

## Cara migrasi (safety-first, ~5 menit)

1. **Backup WF1 lama** (opsional tapi recommended)
   - Buka WF1 di n8n editor → menu `⋯` → **Download** → simpan JSON-nya

2. **Import WF1 v2** sebagai workflow BARU
   - Workflows list → **Add workflow** → menu `⋯` → **Import from File**
   - Pilih `workflow-1-incoming-message-v2.json`
   - **JANGAN** aktifkan dulu

3. **Re-link credentials** (kalau ada warning kuning di node):
   - `WhatsApp Trigger` → pilih credential WhatsApp Business Cloud
   - `Send WA Reply` → pilih credential yang sama
   - `Groq — Classify Intent` → pilih credential "Groq API Header"

4. **Sesuaikan `phoneNumberId`** kalau berbeda dari `1052743247932102`:
   - Di node `Parse WA Message` (default value)
   - Di node `Send WA Reply` (parameter phoneNumberId)
   - Di body `Notify Dashboard` & `Trigger WF2/WF3` (sebagai field literal)

5. **Test mode dulu** (sebelum aktif production):
   - Tombol **Execute Workflow** di kanan atas editor
   - Trigger akan listen ke test URL Meta — atau pakai n8n's manual data input untuk simulasi
   - Atau: pakai tombol **Execute Node** di node `Parse WA Message` dengan input dummy:
     ```json
     {
       "messages": [{ "id": "test1", "from": "6281234567890", "type": "text", "text": { "body": "halo" }, "timestamp": "1700000000" }],
       "contacts": [{ "profile": { "name": "Tester" } }],
       "metadata": { "phone_number_id": "1052743247932102" }
     }
     ```
   - Cek di canvas: setiap node harus output sesuai expectation (lihat tabel logic di atas)

6. **Cutover**:
   - **Deactivate** WF1 lama (toggle di kanan atas → off)
   - **Activate** WF1 v2 (toggle → on)
   - Kirim WhatsApp dari HP kamu sendiri sebagai final smoke test
   - Cek balasan auto muncul + entry baru di dashboard Active Chats

7. **Rollback (kalau ada masalah)**:
   - Deactivate WF1 v2
   - Activate WF1 lama
   - Kondisi semula. Zero data loss.

8. **Cleanup (setelah stabil 1-2 hari)**:
   - Hapus WF1 lama dari n8n
   - Update repo: hapus `workflow-1-incoming-message.json` lama, rename v2 → tanpa suffix

## Test cases yang dijamin pass (sudah dijalanin local)

| Input pesan | Expected actionType | Reply ada? | Trigger |
|---|---|---|---|
| "Halo" | `greeting` | ✓ | — |
| "asdf qwerty" (low conf) | `human` | ✓ | flag dashboard |
| "biaya cafe 80m2" | `estimator` | ✓ | WF2 |
| "tolong buatkan proposal" | `proposal` | ✓ | WF3 |
| "kapan bisa survey?" | `human` | ✓ | flag dashboard |
| "p" / "test" / "ada org?" | `greeting` (Groq classify) atau `human` (low conf) | ✓ | sesuai |

## Catatan khusus

- **Groq prompt** sudah diperkuat: pesan singkat (halo/p/test/ada org/yo/assalamualaikum/permisi) explicit dipetakan ke `GREETING` confidence 0.95 — meminimalkan misclassification
- **Confidence threshold 0.45**: bisa di-tune di Build Decision line `confidence < 0.45`. Naikkan kalau mau lebih agresif eskalasi ke human, turunkan kalau AI dipercaya lebih
- **Message order**: Send WA Reply, Notify Dashboard, dan kedua IF trigger semua jalan **paralel** dari Build Decision. Ini disengaja biar latency balasan ke client cepat
