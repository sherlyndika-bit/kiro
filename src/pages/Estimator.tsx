import React, { useMemo, useState } from 'react'
import {
  constructionRates,
  designServiceRates,
  getSuggestedServices,
  calculateRab,
  calculateFee,
  formatIDR,
  formatIDRShort,
} from '../services/pricingService'

const Estimator: React.FC = () => {
  // Step 1: RAB Konstruksi
  const [constructionId, setConstructionId] = useState(constructionRates[1].id) // default Rumah Standar
  const [area, setArea] = useState('100')

  // Step 2: Fee Jasa
  const [serviceId, setServiceId] = useState('')
  const [calcMode, setCalcMode] = useState<'percentage' | 'per_sqm'>('percentage')
  const [customPercent, setCustomPercent] = useState<string>('')

  // Optional client info
  const [clientName, setClientName] = useState('')
  const [projectName, setProjectName] = useState('')

  const selectedConstruction = useMemo(
    () => constructionRates.find((r) => r.id === constructionId),
    [constructionId],
  )

  const rab = useMemo(
    () => calculateRab(constructionId, parseFloat(area) || 0),
    [constructionId, area],
  )

  const suggestedServices = useMemo(
    () => (selectedConstruction ? getSuggestedServices(selectedConstruction.type, selectedConstruction.tier) : []),
    [selectedConstruction],
  )

  // Auto-pick service kalau belum ada selection
  React.useEffect(() => {
    if (suggestedServices.length > 0 && !suggestedServices.find((s) => s.id === serviceId)) {
      setServiceId(suggestedServices[0].id)
    }
  }, [suggestedServices, serviceId])

  const selectedService = useMemo(
    () => designServiceRates.find((s) => s.id === serviceId),
    [serviceId],
  )

  const fee = useMemo(() => {
    if (!serviceId || !rab) return null
    const pct = customPercent ? parseFloat(customPercent) : undefined
    return calculateFee(serviceId, {
      mode: calcMode,
      rabValue: rab.rabAvg,
      area: parseFloat(area) || 0,
      customPercent: pct,
    })
  }, [serviceId, rab, calcMode, customPercent, area])

  // Group construction types untuk dropdown
  const constructionGroups = useMemo(() => {
    const grouped: Record<string, typeof constructionRates> = {}
    constructionRates.forEach((r) => {
      if (!grouped[r.type]) grouped[r.type] = []
      grouped[r.type].push(r)
    })
    return grouped
  }, [])

  return (
    <div className="p-gutter space-y-md">
      {/* Header */}
      <div>
        <h1 className="font-display-lg text-display-lg font-bold text-on-background select-none">
          AI Estimator
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Kalkulator komprehensif: RAB Konstruksi + Fee Jasa Desain
        </p>
      </div>

      {/* Optional Client Info */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
          <div>
            <label className="text-label-caps text-outline uppercase block mb-2">
              Nama Klien (opsional)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Contoh: Bpk. Budi"
              className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
            />
          </div>
          <div>
            <label className="text-label-caps text-outline uppercase block mb-2">
              Nama Proyek (opsional)
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Contoh: Renovasi Apartemen Studio"
              className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md items-stretch">
        {/* STEP 1: RAB Konstruksi */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col">
          <div className="flex items-center gap-sm mb-md">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold">RAB Konstruksi</h2>
              <p className="text-label-caps text-outline">Estimasi biaya pembangunan</p>
            </div>
          </div>

          <div className="space-y-md flex-1 flex flex-col">
            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">
                Tipe & Kelas Bangunan
              </label>
              <select
                value={constructionId}
                onChange={(e) => setConstructionId(e.target.value)}
                className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
              >
                {Object.entries(constructionGroups).map(([type, items]) => (
                  <optgroup key={type} label={type}>
                    {items.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.tier} — {formatIDRShort(r.pricePerSqmMin)}/m² – {formatIDRShort(r.pricePerSqmMax)}/m²
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selectedConstruction && (
                <p className="text-label-caps text-outline mt-2">
                  ℹ️ {selectedConstruction.specification}
                  {selectedConstruction.notes && ` • ${selectedConstruction.notes}`}
                </p>
              )}
            </div>

            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">
                Luas Area
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-md py-3 pr-12 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline">m²</span>
              </div>
            </div>

            {/* Hasil RAB */}
            {rab && (
              <div className="bg-surface-container rounded-lg p-md border border-outline-variant mt-auto">
                <div className="text-label-caps text-outline uppercase mb-sm">
                  Estimasi RAB Konstruksi
                </div>
                <div className="grid grid-cols-3 gap-2 mb-sm">
                  <div>
                    <div className="text-label-caps text-outline">Min</div>
                    <div className="font-mono-label text-mono-label font-bold text-on-surface-variant">
                      {formatIDRShort(rab.rabMin)}
                    </div>
                  </div>
                  <div>
                    <div className="text-label-caps text-secondary uppercase font-bold">Avg</div>
                    <div className="font-headline-sm text-headline-sm font-bold text-secondary">
                      {formatIDRShort(rab.rabAvg)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-label-caps text-outline">Max</div>
                    <div className="font-mono-label text-mono-label font-bold text-on-surface-variant">
                      {formatIDRShort(rab.rabMax)}
                    </div>
                  </div>
                </div>
                <div className="text-label-caps text-outline pt-2 border-t border-outline-variant">
                  📐 {rab.area}m² × {formatIDRShort(rab.pricePerSqmMin)}–{formatIDRShort(rab.pricePerSqmMax)}/m²
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Fee Jasa Desain */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col">
          <div className="flex items-center gap-sm mb-md">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold">Fee Jasa Desain</h2>
              <p className="text-label-caps text-outline">Tagihan untuk klien</p>
            </div>
          </div>

          <div className="space-y-md">
            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">
                Jenis Jasa
                {suggestedServices.length > 0 && (
                  <span className="ml-2 text-secondary normal-case">
                    ✨ AI suggested
                  </span>
                )}
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
              >
                <optgroup label="✨ Suggested for this project">
                  {suggestedServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.serviceName}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All Services">
                  {designServiceRates
                    .filter((s) => !suggestedServices.find((sg) => sg.id === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.serviceName}
                      </option>
                    ))}
                </optgroup>
              </select>
              {selectedService && (
                <p className="text-label-caps text-outline mt-2">
                  ℹ️ {selectedService.description}
                </p>
              )}
            </div>

            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">
                Mode Hitung
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCalcMode('percentage')}
                  className={`py-3 px-md rounded-lg text-body-md font-bold transition-colors ${
                    calcMode === 'percentage'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container hover:bg-surface-container-high'
                  }`}
                >
                  % dari RAB
                </button>
                <button
                  onClick={() => setCalcMode('per_sqm')}
                  className={`py-3 px-md rounded-lg text-body-md font-bold transition-colors ${
                    calcMode === 'per_sqm'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container hover:bg-surface-container-high'
                  }`}
                >
                  Per m²
                </button>
              </div>
            </div>

            {calcMode === 'percentage' && selectedService && (
              <div>
                <label className="text-label-caps text-outline uppercase block mb-2">
                  Persentase Fee (default {selectedService.feePercentMin}–{selectedService.feePercentMax}%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={customPercent}
                    onChange={(e) => setCustomPercent(e.target.value)}
                    placeholder={`${selectedService.feePercentMin}-${selectedService.feePercentMax}`}
                    className="w-full px-md py-3 pr-12 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline">%</span>
                </div>
              </div>
            )}

            {/* Fee Result */}
            {fee && (
              <div className="bg-secondary-container rounded-lg p-md text-on-secondary-container">
                <div className="text-label-caps uppercase opacity-80 mb-sm">
                  Fee Jasa Desain
                </div>
                <div className="grid grid-cols-3 gap-2 mb-md">
                  <div>
                    <div className="text-label-caps opacity-70">Min</div>
                    <div className="font-mono-label text-mono-label font-bold">
                      {formatIDRShort(fee.feeMin)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-label-caps font-bold">Recommended</div>
                    <div className="font-display-lg text-[24px] font-bold">
                      {formatIDRShort(fee.feeAvg)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-label-caps opacity-70">Max</div>
                    <div className="font-mono-label text-mono-label font-bold">
                      {formatIDRShort(fee.feeMax)}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 pt-sm border-t border-white/20 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-80">Fee Subtotal</span>
                    <span className="font-mono-label">{formatIDR(fee.feeAvg)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">PPN 11%</span>
                    <span className="font-mono-label">{formatIDR(fee.ppn)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-white/20">
                    <span>TOTAL TAGIHAN</span>
                    <span className="font-mono-label">{formatIDR(fee.totalAvg)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {rab && fee && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="flex items-center justify-between mb-md">
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold">Actions</h3>
              <p className="text-label-caps text-outline">
                Generate proposal atau kirim ke klien langsung
              </p>
            </div>
            <span className="px-2 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-label-caps font-bold uppercase">
              Draft AI
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
            <button className="flex items-center justify-center gap-sm py-3 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all">
              <span className="material-symbols-outlined">picture_as_pdf</span>
              Generate Proposal PDF
            </button>
            <button className="flex items-center justify-center gap-sm py-3 border border-outline-variant rounded-lg font-bold hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">chat</span>
              Send via WhatsApp
            </button>
            <button className="flex items-center justify-center gap-sm py-3 border border-outline-variant rounded-lg font-bold hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">save</span>
              Save to CRM
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Estimator
