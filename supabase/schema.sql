-- ============================================================
-- SUDUT RUANG — Supabase Schema
-- Jalankan di Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable realtime untuk tabel penting
-- (diaktifkan via Dashboard: Database → Replication)

-- ============================================================
-- 1. CONVERSATIONS
-- ============================================================
create table if not exists public.conversations (
  id text primary key, -- nomor WA client (e.g. 6281234567890)
  client_name text not null default 'Pelanggan',
  source text not null default 'whatsapp', -- whatsapp | instagram
  mode text not null default 'ai', -- ai | manual
  status text not null default 'active', -- active | idle | archived
  last_message text,
  last_message_at timestamptz default now(),
  unread_count integer default 0,
  human_operator text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. MESSAGES
-- ============================================================
create table if not exists public.messages (
  id text primary key default gen_random_uuid()::text,
  conversation_id text not null references public.conversations(id) on delete cascade,
  content text not null,
  role text not null, -- client | ai | human
  source text default 'whatsapp',
  ai_confidence float,
  needs_human_review boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx on public.messages(created_at desc);

-- ============================================================
-- 3. DOCUMENTS (Proposal, Invoice, RAB)
-- ============================================================
create table if not exists public.documents (
  id text primary key default gen_random_uuid()::text,
  conversation_id text references public.conversations(id),
  client_phone text,
  client_name text,
  type text not null, -- proposal | invoice | rab | followup
  status text default 'draft', -- draft | sent | viewed | accepted | rejected
  file_url text,
  proposal_no text,
  data jsonb default '{}', -- raw data dokumen (RAB, fee, dll)
  created_at timestamptz default now(),
  sent_at timestamptz,
  valid_until timestamptz
);

create index if not exists documents_client_phone_idx on public.documents(client_phone);
create index if not exists documents_type_idx on public.documents(type);

-- ============================================================
-- 4. CLIENTS / CRM DATABASE
-- ============================================================
create table if not exists public.clients (
  id text primary key, -- nomor WA
  name text,
  phone text,
  ig_username text,
  source text default 'whatsapp',
  status text default 'lead', -- lead | estimasi | proposal | negosiasi | deal | closed
  building_type text,
  tier text,
  area_sqm float,
  rab_avg float,
  fee_avg float,
  last_proposal_no text,
  last_contact_at timestamptz,
  notes text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 5. TEMPLATES (untuk AI generate dokumen)
-- ============================================================
create table if not exists public.templates (
  id text primary key default gen_random_uuid()::text,
  type text not null, -- proposal | invoice | rab | greeting | followup | estimasi
  name text not null,
  content text not null, -- template text dengan {variables}
  variables jsonb default '[]', -- list variabel yang tersedia
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 6. QUICK REPLIES
-- ============================================================
create table if not exists public.quick_replies (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  content text not null,
  category text default 'general', -- greeting | pricing | timeline | closing | general
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 7. AI CONFIG (settings untuk AI behavior)
-- ============================================================
create table if not exists public.ai_config (
  key text primary key,
  value text,
  description text,
  updated_at timestamptz default now()
);

-- ============================================================
-- SEED DATA — Templates default
-- ============================================================
insert into public.templates (type, name, content, variables, is_active) values
(
  'greeting',
  'Sambutan Standar',
  'Halo {client_name}, makasih udah hubungi Sudut Ruang!

Kita bantu desain arsitektur & interior buat rumah, cafe, kantor, villa, dan lainnya.

Ada yang bisa kita bantu? Ceritain dulu proyek yang lagi direncanain.',
  '["client_name"]',
  true
),
(
  'estimasi',
  'Reply Estimasi Harga',
  'Halo {client_name}, ini estimasi kasarnya ya.

Proyek: {building_type} {tier}
Luas: {area_sqm}m2

Estimasi RAB Konstruksi:
{rab_min} - {rab_max}
(rata-rata {rab_avg})

Fee Jasa Desain Sudut Ruang ({fee_pct}% dari RAB):
{fee_display}

PPN 11%: {ppn}
Total Fee Jasa: {total_fee}

Ini masih estimasi awal ya, bisa berubah setelah survey dan diskusi detail.

Mau kita buatkan proposal lengkap?',
  '["client_name","building_type","tier","area_sqm","rab_min","rab_max","rab_avg","fee_pct","fee_display","ppn","total_fee"]',
  true
),
(
  'proposal_request',
  'Konfirmasi Data Proposal',
  'Siap {client_name}, kita buatkan proposal lengkapnya.

Boleh konfirmasi dulu:
1. Nama lengkap
2. Jenis proyek & lokasi
3. Luas area (m2)
4. Budget range yang disiapkan

Proposal akan kita kirim dalam 1x24 jam.',
  '["client_name"]',
  true
),
(
  'followup',
  'Follow Up Proposal',
  'Halo {client_name}, mau follow up proposal {proposal_no} yang kita kirim {days_ago} hari lalu.

Sudah sempat dibaca? Kalau ada pertanyaan atau mau diskusi lebih lanjut, langsung balas aja ya.',
  '["client_name","proposal_no","days_ago"]',
  true
),
(
  'followup_2',
  'Follow Up Kedua',
  'Halo {client_name}!

Kita mau tanya apakah proposal dari Sudut Ruang sudah sempat direview?

Kalau ada yang kurang jelas atau mau diskusi lebih lanjut soal proyek {building_type}-nya, kita siap bantu.',
  '["client_name","building_type"]',
  true
)
on conflict (id) do nothing;

-- ============================================================
-- SEED DATA — Quick Replies default
-- ============================================================
insert into public.quick_replies (title, content, category, sort_order) values
('Salam Pembuka', 'Halo! Terima kasih sudah menghubungi Sudut Ruang. Ada yang bisa kami bantu?', 'greeting', 1),
('Tanya Detail Proyek', 'Untuk memberikan estimasi yang akurat, boleh info:
1. Jenis bangunan (rumah/cafe/kantor/villa/renovasi)
2. Luas area (m2)
3. Kelas material (standar/menengah/premium)', 'pricing', 2),
('Konfirmasi Timeline', 'Estimasi pengerjaan standar 4-6 minggu tergantung kompleksitas. Ada deadline khusus?', 'timeline', 3),
('Info Harga', 'Harga kami mulai dari Rp 2.5jt - 5jt per m2 tergantung kualitas material. Sudah termasuk fee desain + PPN.', 'pricing', 4),
('Request Survey', 'Untuk hasil maksimal, kami bisa schedule survey lokasi gratis. Kapan waktu yang cocok?', 'timeline', 5),
('Follow Up', 'Makasih sudah tertarik! Proposal detailnya akan kami kirim dalam 1x24 jam. Ditunggu ya!', 'closing', 6)
on conflict (id) do nothing;

-- ============================================================
-- SEED DATA — AI Config
-- ============================================================
insert into public.ai_config (key, value, description) values
('groq_model', 'llama-3.3-70b-versatile', 'Model Groq yang digunakan'),
('auto_reply_enabled', 'true', 'Auto reply aktif atau tidak'),
('proposal_validity_days', '14', 'Berapa hari proposal berlaku'),
('followup_delay_days', '2', 'Berapa hari delay sebelum follow up'),
('ppn_rate', '0.11', 'Rate PPN (0.11 = 11%)'),
('company_name', 'Sudut Ruang', 'Nama perusahaan'),
('company_tagline', 'Jasa Desain Arsitektur & Interior', 'Tagline perusahaan')
on conflict (key) do update set value = excluded.value;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — biar aman
-- ============================================================
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.clients enable row level security;
alter table public.templates enable row level security;
alter table public.quick_replies enable row level security;
alter table public.ai_config enable row level security;

-- Policy: anon bisa baca semua (dashboard pakai anon key)
create policy "anon read conversations" on public.conversations for select using (true);
create policy "anon write conversations" on public.conversations for all using (true);

create policy "anon read messages" on public.messages for select using (true);
create policy "anon write messages" on public.messages for all using (true);

create policy "anon read documents" on public.documents for select using (true);
create policy "anon write documents" on public.documents for all using (true);

create policy "anon read clients" on public.clients for select using (true);
create policy "anon write clients" on public.clients for all using (true);

create policy "anon read templates" on public.templates for select using (true);
create policy "anon write templates" on public.templates for all using (true);

create policy "anon read quick_replies" on public.quick_replies for select using (true);
create policy "anon write quick_replies" on public.quick_replies for all using (true);

create policy "anon read ai_config" on public.ai_config for select using (true);
create policy "anon write ai_config" on public.ai_config for all using (true);

-- ============================================================
-- REALTIME — enable untuk tabel yang perlu live update
-- Jalankan di Supabase: Database → Replication → enable tables
-- ============================================================
-- conversations, messages, documents
