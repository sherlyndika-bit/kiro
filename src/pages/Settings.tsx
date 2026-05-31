import React, { useEffect, useState } from 'react'
import { AIConfigService, supabase } from '../services/supabaseClient'
import { n8nService } from '../services/n8nWebhookService'
import { authService } from '../services/auth'

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
  const [aiModel, setAiModel] = useState('llama-3.3-70b-versatile')

  // AI toggles state
  const [aiToggles, setAiToggles] = useState({
    auto_reply_enabled: true,
    smart_estimator: true,
    content_generator: true,
    confidence_alerts: true,
  })

  // ── Settings lock + PIN ──────────────────────────────────────
  const [locked, setLocked] = useState(true)
  const [pinModal, setPinModal] = useState<null | 'unlock' | 'set'>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinNew, setPinNew] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const [savingPin, setSavingPin] = useState(false)

  // ── Account / password ───────────────────────────────────────
  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const hasPin = !!config.settings_pin
  const sessionEmail = authService.getSession()?.email || authService.defaultEmail
  const canManagePassword = authService.canManagePassword()

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
    if (cfg.groq_model) setAiModel(cfg.groq_model)
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
      AIConfigService.set('groq_model', aiModel),
    ])
    n8nService.setBaseUrl(webhookUrl)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleAI = async (key: keyof typeof aiToggles) => {
    if (locked) return
    const newVal = !aiToggles[key]
    setAiToggles((prev) => ({ ...prev, [key]: newVal }))
    await AIConfigService.set(key, String(newVal))
  }

  const testConnection = async () => {
    setTestingConn(true)
    setConnStatus('idle')
    n8nService.setBaseUrl(webhookUrl)
    const ok = await n8nService.ping(5000)
    setConnStatus(ok ? 'ok' : 'fail')
    setTestingConn(false)
  }

  // ── Lock handlers ────────────────────────────────────────────
  const requestUnlock = () => {
    setPinError('')
    setPinInput('')
    if (hasPin) {
      setPinModal('unlock')
    } else {
      setLocked(false)
    }
  }

  const submitUnlock = () => {
    if (pinInput !== config.settings_pin) {
      setPinError('PIN salah.')
      return
    }
    setLocked(false)
    setPinModal(null)
    setPinInput('')
  }

  const openSetPin = () => {
    setPinError('')
    setPinNew('')
    setPinConfirm('')
    setPinModal('set')
  }

  const savePin = async () => {
    if (!/^\d{4,6}$/.test(pinNew)) {
      setPinError('PIN harus 4–6 digit angka.')
      return
    }
    if (pinNew !== pinConfirm) {
      setPinError('Konfirmasi PIN tidak cocok.')
      return
    }
    setSavingPin(true)
    await AIConfigService.set('settings_pin', pinNew)
    setConfig((prev) => ({ ...prev, settings_pin: pinNew }))
    setSavingPin(false)
    setPinModal(null)
  }

  const removePin = async () => {
    setSavingPin(true)
    await AIConfigService.set('settings_pin', '')
    setConfig((prev) => ({ ...prev, settings_pin: '' }))
    setSavingPin(false)
    setPinModal(null)
  }

  // ── Password handler ─────────────────────────────────────────
  const submitChangePwd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingPwd) return
    setPwdMsg(null)
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'err', text: 'Konfirmasi password tidak cocok.' })
      return
    }
    setSavingPwd(true)
    const res = await authService.changePassword(curPwd, newPwd)
    setSavingPwd(false)
    if (res.ok) {
      setPwdMsg({ type: 'ok', text: 'Password berhasil diubah.' })
      setCurPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } else {
      setPwdMsg({ type: 'err', text: res.error || 'Gagal mengubah password.' })
    }
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

  const inputCls =
    'w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-brand-accent outline-none disabled:opacity-60 disabled:cursor-not-allowed'

  return (
    <div className="p-sm md:p-gutter max-w-container-max mx-auto space-y-md">
      <div>
        <h1 className="font-serif-display text-display-lg text-on-background">Pengaturan</h1>
        <p className="text-body-md text-on-surface-variant">
          Kelola akun, preferensi, dan integrasi sistem
        </p>
      </div>

      {/* ── Account ─────────────────────────────────────────── */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-md">
        <h3 className="text-headline-sm font-bold mb-md flex items-center gap-xs">
          <span className="material-symbols-outlined text-[20px] text-brand-mid">account_circle</span>
          Akun
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          <div>
            <label className="text-[11px] font-semibold text-outline uppercase tracking-wide block mb-2">
              Email Login
            </label>
            <div className="flex items-center gap-sm px-md py-3 bg-surface-container-low border border-outline-variant rounded-lg">
              <span className="material-symbols-outlined text-[18px] text-outline">mail</span>
              <span className="text-body-md truncate">{sessionEmail}</span>
            </div>
            <p className="text-[11px] text-outline mt-1.5">
              Email diatur lewat env (VITE_DASHBOARD_EMAIL). Hubungi admin untuk mengubahnya.
            </p>
          </div>

          <form onSubmit={submitChangePwd} className="space-y-sm">
            <label className="text-[11px] font-semibold text-outline uppercase tracking-wide block">
              Ubah Password
            </label>
            <input
              type="password"
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
              placeholder="Password saat ini"
              autoComplete="current-password"
              disabled={!canManagePassword}
              className={inputCls}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Password baru"
                autoComplete="new-password"
                disabled={!canManagePassword}
                className={inputCls}
              />
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Konfirmasi"
                autoComplete="new-password"
                disabled={!canManagePassword}
                className={inputCls}
              />
            </div>
            {pwdMsg && (
              <p
                className={`text-[12.5px] font-medium ${
                  pwdMsg.type === 'ok' ? 'text-brand-mid' : 'text-error'
                }`}
              >
                {pwdMsg.text}
              </p>
            )}
            {!canManagePassword && (
              <p className="text-[11px] text-outline">
                Ubah password butuh koneksi aman (https atau localhost).
              </p>
            )}
            <button
              type="submit"
              disabled={savingPwd || !canManagePassword || !curPwd || !newPwd}
              className="py-2.5 px-md bg-brand text-white rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-xs"
            >
              {savingPwd ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Menyimpan...
                </>
              ) : (
                'Ubah Password'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Lock banner ─────────────────────────────────────── */}
      <div
        className={`rounded-2xl p-md border flex flex-col sm:flex-row sm:items-center gap-sm ${
          locked ? 'bg-amber-soft border-amber/30' : 'bg-brand-soft border-brand-accent/30'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[24px] ${locked ? 'text-amber' : 'text-brand-mid'}`}
        >
          {locked ? 'lock' : 'lock_open'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface">
            {locked ? 'Pengaturan sensitif terkunci' : 'Mode edit aktif'}
          </p>
          <p className="text-[12.5px] text-on-surface-variant">
            {locked
              ? 'Konfigurasi AI & webhook dikunci untuk mencegah perubahan tak sengaja.'
              : hasPin
              ? 'Jangan lupa kunci lagi setelah selesai.'
              : 'Belum ada PIN. Atur PIN agar pengaturan terlindungi.'}
          </p>
        </div>
        <div className="flex items-center gap-sm flex-shrink-0">
          {locked ? (
            <button
              onClick={requestUnlock}
              className="py-2 px-md bg-brand text-white rounded-lg font-bold text-[13px] hover:opacity-90 flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              Buka Kunci
            </button>
          ) : (
            <>
              <button
                onClick={openSetPin}
                className="py-2 px-md border border-outline-variant rounded-lg font-bold text-[13px] hover:bg-surface-container"
              >
                {hasPin ? 'Ubah PIN' : 'Atur PIN'}
              </button>
              <button
                onClick={() => setLocked(true)}
                className="py-2 px-md bg-brand text-white rounded-lg font-bold text-[13px] hover:opacity-90 flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Kunci
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Company Profile */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-md">
          <h3 className="text-headline-sm font-bold mb-md">Profil Perusahaan</h3>
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
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-label-caps text-outline uppercase block mb-2">Email</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-label-caps text-outline uppercase block mb-2">Telepon</label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className={inputCls}
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-3 bg-primary text-on-primary rounded-lg text-[14px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-sm"
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

        {/* AI Configuration (lockable) */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-md">
          <h3 className="text-headline-sm font-bold mb-md flex items-center gap-xs">
            Konfigurasi AI — Syifa
            {locked && (
              <span className="material-symbols-outlined text-[18px] text-amber" title="Terkunci">
                lock
              </span>
            )}
          </h3>
          <div className={`space-y-sm ${locked ? 'opacity-70' : ''}`}>
            {aiToggleItems.map((t) => (
              <div
                key={t.key}
                className="flex items-center justify-between p-sm bg-surface-container-low rounded-lg border border-outline-variant"
              >
                <div className="flex-1">
                  <p className="text-body-md font-bold">{t.name}</p>
                  <p className="text-label-caps text-outline">{t.desc}</p>
                </div>
                <button
                  onClick={() => toggleAI(t.key)}
                  disabled={locked}
                  aria-label={`Toggle ${t.name}`}
                  className={`w-12 h-6 rounded-full relative shadow-inner transition-colors disabled:cursor-not-allowed ${
                    aiToggles[t.key] ? 'bg-brand-accent' : 'bg-outline'
                  } ${locked ? '' : 'cursor-pointer'}`}
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

        {/* Integrations (read-only) */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-md">
          <div className="flex items-center justify-between mb-md">
            <h3 className="text-headline-sm font-bold">Integrasi</h3>
            <button
              onClick={checkConnections}
              disabled={checking}
              className="flex items-center gap-xs text-label-caps font-bold text-brand-mid uppercase disabled:opacity-50"
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
                      <span className="material-symbols-outlined text-brand-mid text-[18px]">
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

        {/* n8n Webhook (lockable) */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-md">
          <h3 className="text-headline-sm font-bold mb-md flex items-center gap-xs">
            n8n Webhook URL
            {locked && (
              <span className="material-symbols-outlined text-[18px] text-amber" title="Terkunci">
                lock
              </span>
            )}
          </h3>
          <div className="space-y-md">
            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">Webhook Base URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                disabled={locked}
                className={`${inputCls} font-mono-label text-mono-label`}
              />
            </div>

            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">AI Model (Groq)</label>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                onBlur={(e) => {
                  if (!locked) AIConfigService.set('groq_model', e.target.value)
                }}
                disabled={locked}
                className={`${inputCls} font-mono-label text-mono-label`}
              />
            </div>

            <div
              className={`p-sm rounded-lg flex items-start gap-sm ${
                connStatus === 'ok'
                  ? 'bg-brand-soft border border-brand-accent/30'
                  : connStatus === 'fail'
                  ? 'bg-error-container border border-error'
                  : 'bg-surface-container'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  connStatus === 'ok' ? 'text-brand-mid' : connStatus === 'fail' ? 'text-error' : 'text-brand-mid'
                }`}
              >
                {connStatus === 'ok' ? 'check_circle' : connStatus === 'fail' ? 'error' : 'info'}
              </span>
              <p className="text-body-md text-on-surface-variant">
                {connStatus === 'ok'
                  ? 'Koneksi n8n berhasil!'
                  : connStatus === 'fail'
                  ? 'Koneksi gagal. Pastikan n8n aktif dan URL benar.'
                  : 'URL ini dipakai untuk komunikasi 2 arah antara dashboard dan workflow n8n Syifa.'}
              </p>
            </div>

            <button
              onClick={testConnection}
              disabled={testingConn || locked}
              className="w-full py-3 border border-outline-variant rounded-lg text-body-md font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[18px] ${testingConn ? 'animate-spin' : ''}`}>
                sync
              </span>
              {testingConn ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
      </div>

      {/* ── PIN modal ───────────────────────────────────────── */}
      {pinModal && (
        <div
          className="fixed inset-0 z-50 bg-brand-dark/50 flex items-center justify-center p-4"
          onClick={() => setPinModal(null)}
        >
          <div
            className="bg-surface rounded-2xl shadow-soft-md w-full max-w-sm p-md animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-md">
              <h3 className="text-headline-sm font-semibold">
                {pinModal === 'unlock' ? 'Masukkan PIN' : hasPin ? 'Ubah PIN' : 'Atur PIN'}
              </h3>
              <button
                onClick={() => setPinModal(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {pinModal === 'unlock' ? (
              <div className="space-y-sm">
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && submitUnlock()}
                  placeholder="PIN"
                  className={`${inputCls} tracking-[0.5em] text-center text-lg`}
                />
                {pinError && <p className="text-[12.5px] text-error font-medium">{pinError}</p>}
                <button
                  onClick={submitUnlock}
                  className="w-full py-2.5 bg-brand text-white rounded-lg font-bold hover:opacity-90"
                >
                  Buka
                </button>
              </div>
            ) : (
              <div className="space-y-sm">
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  value={pinNew}
                  onChange={(e) => setPinNew(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="PIN baru (4–6 digit)"
                  className={`${inputCls} tracking-[0.5em] text-center text-lg`}
                />
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Konfirmasi PIN"
                  className={`${inputCls} tracking-[0.5em] text-center text-lg`}
                />
                {pinError && <p className="text-[12.5px] text-error font-medium">{pinError}</p>}
                <div className="flex gap-sm">
                  {hasPin && (
                    <button
                      onClick={removePin}
                      disabled={savingPin}
                      className="py-2.5 px-md border border-error/40 text-error rounded-lg font-bold hover:bg-error-container disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  )}
                  <button
                    onClick={savePin}
                    disabled={savingPin}
                    className="flex-1 py-2.5 bg-brand text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    {savingPin ? 'Menyimpan...' : 'Simpan PIN'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
