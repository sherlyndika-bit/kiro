/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_WEBHOOK_URL?: string
  readonly VITE_USE_MOCK_DATA?: string
  readonly VITE_WEBSOCKET_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_DASHBOARD_EMAIL?: string
  readonly VITE_DASHBOARD_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
