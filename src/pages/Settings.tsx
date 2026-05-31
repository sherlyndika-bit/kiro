import React, { useEffect, useState } from 'react'
import { AIConfigService, supabase } from '../services/supabaseClient'
import { n8nService } from '../services/n8nWebhookService'

type ConnState = 'idle' | 'ok' | 'fail'

const Settings: React.FC = () => {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testingConn, setTestingConn] = useState(false)
  const [connStatus, setConnStatus] = useState<'idle' | 'ok' | 'fail'>('idle')

  // Live integration health
  const [conn, setConn] = useState<{ n8n: ConnState; supabase: ConnState }>({
    n8n: 'idle',
    supabase: 'idle',
  })
  const [checking, setChecking] = useState(false)

  // Company profile state (dari ai_config)
  const [companyName, setCompanyName] = useState('Sudut Ruang')
  const [companyEmail, setCompanyEmail] = useState('hello@sudutruang.id')
  const [companyPhone, setCompanyPhone] = useState('+62 812-3456-7890')
  const [webhookUrl, setWebhookUrl] = useState(
    n8nService.getBaseUrl() || 'https://n8n.srv1696073.hstgr.cloud/webhook',
  )

  // AI toggles state
  const [aiToggles, setAiToggles] = useState({
    auto_reply_enabled: true,
    smart_estimator: true,
    content_generator: true,
    confidence_alerts: true,
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const checkConnections = async () => {
    setChecking(true)
    setConn({ n8n: 'idle', supabase: 'idle' })
    const [n8nOk, supabaseOk] = await Promise.all([
      n8nService.ping(5000),
      (async () => {
        const { error } = await supabase.from('ai_config').select('key').limit(1)
        return !error
      })(),
    ])
    setConn({ n8n: n8nOk ? 'ok' : 'fail', supabase: supabaseOk ? 'ok' : 'fail' })
    setChecking(false)
  }

  const loadConfig = async () => {
    const cfg = await AIConfigService.getAll()
    setConfig(cfg)

    if (cfg.company_name) setCompanyName(cfg.company_name)
    if (cfg.company_email) setCompanyEmail(cfg.company_email)
    if (cfg.company_phone) setCompanyPhone(cfg.company_phone)
    if (cfg.webhook_url) {
      setWebhookUrl(cfg.webhook_url)
      n8nService.setBaseUrl(cfg.webhook_url)
    }

    setAiToggles({
      auto_reply_enabled: cfg.auto_reply_enabled !== 'false',
      smart_estimator: cfg.smart_estimator !== 'false',
      content_generator: cfg.content_generator !== 'false',
      confidence_alerts: cfg.confidence_alerts !== 'false',
    })

    setLoading(false)
    checkConnections()
  }

  const saveProfile = async () => {
    setSaving(true)
    await Promise.all([
      AIConfigService.set('company_name', companyName),
      AIConfigService.set('company_email', companyEmail),
      AIConfigService.set('company_phone', companyPhone),
      AIConfigService.set('webhook_url', webhookUrl),
    ])
    // Wire ke n8nService supaya seluruh aplikasi pakai URL baru
    n8nService.setBaseUrl(webhookUrl)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleAI = async (key: keyof typeof aiToggles) => {
    const newVal = !aiToggles[key]
    setAiToggles((prev) => ({ ...prev, [key]: newVal }))
    await AIConfigService.set(key, String(newVal))
  }

  const testConnection = async () => {
    setTestingConn(true)
    setConnStatus('idle')
    // Pastikan service pakai URL terkini sebelum ping
    n8nService.setBaseUrl(webhookUrl)
    const ok = await n8nService.ping(5000)
    setConnStatus(ok ? 'ok' : 'fail')
    setTestingConn(false)
  }

  const aiToggleItems = [
    { key: 'auto_reply_enabled' as const, name: 'Auto Follow-Up', desc: 'Kirim pesan otomatis ke lead baru' },
    { key: 'smart_estimator' as const, name: 'Smart Estimator', desc: 'Kalkulasi biaya dengan AI' },
    { key: 'content_generator' as const, name: 'Content Generator', desc: 'Generate konten marketing otomatis' },
    { key: 'confidence_alerts' as const, name: 'Confidence Alerts', desc: 'Alert ketika AI butuh bantuan human' },
  ]

  const connMeta: Record<ConnState, { label: string; dot: string; text: string }> = {
    idle: { label: 'Memeriksa…', dot: 'bg-outline animate-pulse', text: 'text-outline' },
    ok: { label: 'Terhubung', dot: 'bg-brand-accent', text: 'text-brand-mid' },
    fail: { label: 'Tidak terhubung', dot: 'bg-error', text: 'text-error' },
  }

  const integrations: Array<{ icon: string; name: string; detail: string; state: ConnState }> = [
    { icon: 'chat', name: 'WhatsApp Business', detail: 'via n8n', state: conn.n8n },
    { icon: 'photo_camera', name: 'Instagram', detail: 'via n8n', state: conn.n8n },
    { icon: 'account_tree', name: 'n8n Workflow', detail: 'Webhook engine', state: conn.n8n },
    { icon: 'database', name: 'Supabase', detail: 'Database', state: conn.supabase },
  ]

  return (
    <div className="p-sm md:p-gutter space-y-md">
      <div>
        <h1 className="font-serif-display text-display-lg text-on-background">Pengaturan</h1>
        <p className="text-body-md text-on-surface-variant">
          Kelola preferensi dan integrasi sistem
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Company Profile */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="font-headline-sm text-headline-sm font-bold mb-md">Profil Perusahaan</h3>
          {loading ? (
            <div className="space-y-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-container rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-md">
              <div>
                <label className="text-label-caps text-outline uppercase block mb-2">Nama Perusahaan</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                />
              </div>
              <div>
                <label className="text-label-caps text-outline uppercase block mb-2">Email</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                />
              </div>
              <div>
                <label className="text-label-caps text-outline uppercase block mb-2">Telepon</label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-3 bg-primary text-on-primary rounded-lg font-headline-sm text-[14px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-sm"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    Menyimpan...
                  </>
                ) : saved ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Tersimpan!
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          )}
        </div>

        {/* AI Configuration */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="font-headline-sm text-headline-sm font-bold mb-md">Konfigurasi AI — Syifa</h3>
          <div className="space-y-sm">
            {aiToggleItems.map((t) => (
              <div
                key={t.key}
                className="flex items-center justify-between p-sm bg-surface rounded-lg border border-outline-variant"
              >
                <div className="flex-1">
                  <p className="text-body-md font-bold">{t.name}</p>
                  <p className="text-label-caps text-outline">{t.desc}</p>
                </div>
                <button
                  onClick={() => toggleAI(t.key)}
                  className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${
                    aiToggles[t.key] ? 'bg-emerald-500' : 'bg-outline'
                  }`}
                >
                  <div
                    className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${
                      aiToggles[t.key] ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="flex items-center justify-between mb-md">
            <h3 className="font-headline-sm text-headline-sm font-bold">Integrasi</h3>
            <button
              onClick={checkConnections}
              disabled={checking}
              className="flex items-center gap-xs text-label-caps font-bold text-secondary uppercase disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${checking ? 'animate-spin' : ''}`}>
                sync
              </span>
              {checking ? 'Memeriksa' : 'Periksa Ulang'}
            </button>
          </div>
          <div className="space-y-sm">
            {integrations.map((int) => {
              const m = connMeta[int.state]
              return (
                <div
                  key={int.name}
                  className="flex items-center justify-between p-sm border border-outline-variant rounded-lg"
                >
                  <div className="flex items-center gap-sm min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        {int.icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-md font-bold truncate">{int.name}</p>
                      <p className="text-label-caps text-outline truncate">{int.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                    <span className={`text-label-caps font-bold ${m.text}`}>{m.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* n8n Webhook */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="font-headline-sm text-headline-sm font-bold mb-md">n8n Webhook URL</h3>
          <div className="space-y-md">
            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">
                Webhook Base URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg font-mono-label text-mono-label focus:ring-2 focus:ring-secondary outline-none"
              />
            </div>

            {/* AI Model Config */}
            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">
                AI Model (Groq)
              </label>
              <input
                type="text"
                defaultValue={config.groq_model || 'llama-3.3-70b-versatile'}
                onBlur={(e) => AIConfigService.set('groq_model', e.target.value)}
                className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg font-mono-label text-mono-label focus:ring-2 focus:ring-secondary outline-none"
              />
            </div>

            <div className={`p-sm rounded-lg flex items-start gap-sm ${
              connStatus === 'ok'
                ? 'bg-emerald-50 border border-emerald-200'
                : connStatus === 'fail'
                ? 'bg-error-container border border-error'
                : 'bg-surface-container'
            }`}>
              <span className={`material-symbols-outlined text-[18px] ${
                connStatus === 'ok' ? 'text-emerald-600' : connStatus === 'fail' ? 'text-error' : 'text-secondary'
              }`}>
                {connStatus === 'ok' ? 'check_circle' : connStatus === 'fail' ? 'error' : 'info'}
              </span>
              <p className="text-body-md text-on-surface-variant">
                {connStatus === 'ok'
                  ? 'Koneksi n8n berhasil!'
                  : connStatus === 'fail'
                  ? 'Koneksi gagal. Pastikan n8n aktif dan URL benar.'
                  : 'URL ini digunakan untuk komunikasi 2 arah antara dashboard dan workflow n8n Syifa.'}
              </p>
            </div>

            <button
              onClick={testConnection}
              disabled={testingConn}
              className="w-full py-3 border border-outline-variant rounded-lg text-body-md font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-sm disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${testingConn ? 'animate-spin' : ''}`}>
                sync
              </span>
              {testingConn ? 'Testing...' : 'Test Connection'}
            </button>

            {/* Workflow endpoints reference */}
            <div className="border-t border-outline-variant pt-md">
              <h4 className="font-label-caps text-label-caps text-outline uppercase mb-sm">
                Workflow Endpoints (n8n)
              </h4>
              <ul className="space-y-1 text-[11px] font-mono-label">
                {[
                  { wf: 'WF1', label: 'Incoming WA Trigger', path: '(Meta WhatsApp Cloud webhook)' },
                  { wf: 'WF2', label: 'Auto Estimator', path: '/wa-estimator' },
                  { wf: 'WF3', label: 'Proposal Generator', path: '/wa-proposal' },
                  { wf: 'WF4', label: 'Supabase Sync Hub', path: '/incoming-conversation' },
                  { wf: 'WF0', label: 'Dashboard → Client (manual)', path: '/dashboard-message' },
                  { wf: '—', label: 'Toggle AI/Manual mode', path: '/toggle-mode' },
                ].map((row) => (
                  <li
                    key={row.wf + row.path}
                    className="flex items-start justify-between gap-sm py-1 border-b border-outline-variant/40 last:border-0"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-on-background">{row.wf}</span>{' '}
                      <span className="text-on-surface-variant">{row.label}</span>
                    </div>
                    <span className="text-outline truncate">{row.path}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
