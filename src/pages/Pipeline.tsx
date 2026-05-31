import React, { useEffect, useState } from 'react'
import { ClientService, DBClient } from '../services/supabaseClient'

const statusStages = ['lead', 'estimasi', 'proposal', 'negosiasi', 'deal']

const stageConfig: Record<string, { label: string; color: string; count: number }> = {
  lead: { label: 'Lead Baru', color: 'bg-secondary-container text-on-secondary-container', count: 0 },
  estimasi: { label: 'Estimasi', color: 'bg-tertiary-fixed text-on-tertiary-fixed', count: 0 },
  proposal: { label: 'Proposal', color: 'bg-primary-fixed text-on-primary-fixed', count: 0 },
  negosiasi: { label: 'Negosiasi', color: 'bg-error-container text-on-error-container', count: 0 },
  deal: { label: 'Deal Closed', color: 'bg-brand-soft text-brand-mid', count: 0 },
}

const formatIDRShort = (value: number | null) => {
  if (!value) return 'Rp —'
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)}jt`
  return `Rp ${value.toLocaleString('id-ID')}`
}

const Pipeline: React.FC = () => {
  const [clients, setClients] = useState<DBClient[]>([])
  const [loading, setLoading] = useState(true)

  // Add-client modal
  const emptyForm = {
    name: '',
    phone: '',
    building_type: '',
    tier: '',
    area_sqm: '',
    source: 'dashboard',
  }
  const [addStage, setAddStage] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    const data = await ClientService.getAll()
    setClients(data)
    setLoading(false)
  }

  const openAdd = (stage: string) => {
    setForm(emptyForm)
    setAddStage(stage)
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addStage || saving) return
    setSaving(true)
    const phone = form.phone.replace(/[^\d]/g, '')
    const id = phone || `client_${Date.now()}`
    await ClientService.upsert({
      id,
      name: form.name.trim() || 'Klien Baru',
      phone: phone || null,
      source: form.source || 'dashboard',
      status: addStage,
      building_type: form.building_type.trim() || null,
      tier: form.tier.trim() || null,
      area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
      last_contact_at: new Date().toISOString(),
    })
    setSaving(false)
    setAddStage(null)
    loadClients()
  }

  const clientsByStage = statusStages.reduce((acc, stage) => {
    acc[stage] = clients.filter((c) => c.status === stage)
    return acc
  }, {} as Record<string, DBClient[]>)

  const totalValue = clients.reduce((sum, c) => sum + (c.rab_avg || 0), 0)
  const dealCount = clientsByStage['deal']?.length || 0
  const totalCount = clients.length
  const convRate = totalCount > 0 ? Math.round((dealCount / totalCount) * 100) : 0
  const avgDeal =
    dealCount > 0
      ? clients
          .filter((c) => c.status === 'deal')
          .reduce((sum, c) => sum + (c.rab_avg || 0), 0) / dealCount
      : 0

  return (
    <div className="p-sm md:p-gutter">
      {/* Header */}
      <div className="mb-md">
        <h1 className="font-serif-display text-display-lg text-on-background">Client Database</h1>
        <p className="text-body-md text-on-surface-variant">
          Pipeline tracking untuk semua lead dan client
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm md:gap-md mb-md">
        <div className="bg-surface border border-outline-variant rounded-2xl p-md">
          <div className="text-[11px] font-semibold text-outline uppercase tracking-wide mb-1">Total Pipeline Value</div>
          <div className="font-serif-display text-[26px]">
            {loading ? '—' : formatIDRShort(totalValue)}
          </div>
        </div>
        <div className="bg-surface border border-outline-variant rounded-2xl p-md">
          <div className="text-[11px] font-semibold text-outline uppercase tracking-wide mb-1">Conversion Rate</div>
          <div className="font-serif-display text-[26px] text-brand-mid">
            {loading ? '—' : `${convRate}%`}
          </div>
        </div>
        <div className="bg-surface border border-outline-variant rounded-2xl p-md">
          <div className="text-[11px] font-semibold text-outline uppercase tracking-wide mb-1">Avg. Deal Size</div>
          <div className="font-serif-display text-[26px]">
            {loading ? '—' : formatIDRShort(avgDeal)}
          </div>
        </div>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex gap-md overflow-x-auto pb-2">
          {statusStages.map((s) => (
            <div key={s} className="flex-shrink-0 w-72 h-48 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-md overflow-x-auto pb-2 custom-scrollbar items-stretch">
          {statusStages.map((stage) => {
            const cfg = stageConfig[stage]
            const stageClients = clientsByStage[stage] || []
            return (
              <div key={stage} className="flex-shrink-0 w-72 flex flex-col">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col flex-1">
                  {/* Header kolom */}
                  <div className="flex items-center justify-between mb-md">
                    <h3 className="font-headline-sm text-[14px] font-bold uppercase tracking-wide">
                      {cfg.label}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-label-caps font-bold ${cfg.color}`}>
                      {stageClients.length}
                    </span>
                  </div>

                  {/* Card list */}
                  <div className="flex flex-col gap-sm flex-1">
                    {stageClients.length === 0 ? (
                      <div className="text-center py-md text-outline text-body-md">
                        Kosong
                      </div>
                    ) : (
                      stageClients.map((client) => (
                        <div
                          key={client.id}
                          className="bg-white border border-outline-variant rounded-lg p-sm hover:shadow-sm transition-shadow cursor-pointer"
                        >
                          <h4 className="font-bold text-on-background mb-1">
                            {client.name || 'Pelanggan'}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="font-mono-label text-mono-label text-secondary font-bold text-[12px]">
                              {formatIDRShort(client.rab_avg)}
                            </span>
                            <span className="text-label-caps text-outline text-[10px] capitalize">
                              {client.source}
                            </span>
                          </div>
                          {client.building_type && (
                            <div className="mt-1">
                              <span className="text-[10px] text-outline capitalize">
                                {client.building_type}
                                {client.tier ? ` · ${client.tier}` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {/* Tombol tambah */}
                    <div className="mt-auto pt-sm">
                      <button
                        onClick={() => openAdd(stage)}
                        className="w-full py-2 border-2 border-dashed border-outline-variant rounded-lg text-outline hover:border-brand-accent hover:text-brand-mid transition-colors text-body-md"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add-client modal */}
      {addStage && (
        <div
          className="fixed inset-0 z-50 bg-brand-dark/50 flex items-center justify-center p-4"
          onClick={() => setAddStage(null)}
        >
          <div
            className="bg-surface rounded-2xl shadow-soft-md w-full max-w-md p-md animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-md">
              <h3 className="text-headline-sm font-semibold">
                Tambah Client — {stageConfig[addStage]?.label}
              </h3>
              <button
                onClick={() => setAddStage(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-sm">
              <div>
                <label className="text-[11px] font-semibold text-outline uppercase tracking-wide block mb-1.5">
                  Nama Client *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Bpk. Budi"
                  className="w-full px-md py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-brand-accent outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-outline uppercase tracking-wide block mb-1.5">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Contoh: 6281234567890"
                  className="w-full px-md py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-brand-accent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="text-[11px] font-semibold text-outline uppercase tracking-wide block mb-1.5">
                    Tipe Bangunan
                  </label>
                  <input
                    type="text"
                    value={form.building_type}
                    onChange={(e) => setForm({ ...form, building_type: e.target.value })}
                    placeholder="Rumah Tinggal"
                    className="w-full px-md py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-brand-accent outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-outline uppercase tracking-wide block mb-1.5">
                    Luas (m²)
                  </label>
                  <input
                    type="number"
                    value={form.area_sqm}
                    onChange={(e) => setForm({ ...form, area_sqm: e.target.value })}
                    placeholder="100"
                    className="w-full px-md py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-brand-accent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-outline uppercase tracking-wide block mb-1.5">
                  Sumber
                </label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full px-md py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-brand-accent outline-none"
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="referral">Referral</option>
                </select>
              </div>

              <div className="flex gap-sm pt-1">
                <button
                  type="button"
                  onClick={() => setAddStage(null)}
                  className="flex-1 py-2.5 border border-outline-variant rounded-lg font-bold hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-brand text-white rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-xs"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pipeline
