import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AIConfigService } from './services/supabaseClient'
import { n8nService } from './services/n8nWebhookService'

// Boot-load webhook_url dari Supabase ai_config supaya semua page pakai URL terkini.
// Tidak perlu await — fire-and-forget. Default URL akan dipakai sampai config tiba.
;(async () => {
  try {
    const url = await AIConfigService.get('webhook_url')
    if (url) n8nService.setBaseUrl(url)
  } catch (err) {
    // Silent fail — Supabase mungkin belum di-setup, default URL tetap dipakai
    console.warn('[boot] failed to load webhook_url from ai_config:', err)
  }
})()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
