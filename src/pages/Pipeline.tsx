import React, { useEffect, useState } from 'react'
import { ClientService, DBClient } from '../services/supabaseClient'

const statusStages = ['lead', 'estimasi', 'proposal', 'negosiasi', 'deal']

const stageConfig: Record<string, { label: string; color: string; count: number }> = {
  lead: { label: 'Lead Baru', color: 'bg-secondary-container text-on-secondary-container', count: 0 },
  estimasi: { label: 'Estimasi', color: 'bg-tertiary-fixed text-on-tertiary-fixed', count: 0 },
  proposal: { label: 'Proposal', color: 'bg-primary-fixed text-on-primary-fixed', count: 0 },
  negosiasi: { label: 'Negosiasi', color: 'bg-error-container text-on-error-container', count: 0 },
  deal: { label: 'Deal Closed', color: 'bg-emerald-100 text-emerald-700', count: 0 },
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

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    const data = await ClientService.getAll()
    setClients(data)
    setLoading(false)
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
    <div className="p-gutter">
      {/* Header */}
      <div className="mb-md">
        <h1 className="font-display-lg text-display-lg font-bold text-on-background">
          Client Database
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Pipeline tracking untuk semua lead dan client
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-md mb-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="text-label-caps text-outline uppercase mb-1">Total Pipeline Value</div>
          <div className="font-display-lg text-[28px] font-bold">
            {loading ? '—' : formatIDRShort(totalValue)}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="text-label-caps text-outline uppercase mb-1">Conversion Rate</div>
          <div className="font-display-lg text-[28px] font-bold text-emerald-600">
            {loading ? '—' : `${convRate}%`}
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="text-label-caps text-outline uppercase mb-1">Avg. Deal Size</div>
          <div className="font-display-lg text-[28px] font-bold">
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
                      <button className="w-full py-2 border-2 border-dashed border-outline-variant rounded-lg text-outline hover:border-primary hover:text-primary transition-colors text-body-md">
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
    </div>
  )
}

export default Pipeline
