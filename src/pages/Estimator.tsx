import React, { useState } from 'react'

interface EstimateResult {
  tenagaKerja: number
  material: number
  furnitur: number
  total: number
  breakdown: Array<{ name: string; cost: number }>
}

const Estimator: React.FC = () => {
  const [projectType, setProjectType] = useState('Apartemen Studio')
  const [area, setArea] = useState('45')
  const [quality, setQuality] = useState('Premium')
  const [estimate, setEstimate] = useState<EstimateResult | null>(null)
  const [activeTab, setActiveTab] = useState<'tenagaKerja' | 'material' | 'furnitur'>('material')

  const calculateEstimate = () => {
    const areaNum = parseFloat(area) || 0
    const pricePerSqm =
      quality === 'Premium' ? 5000000 : quality === 'Standard' ? 3500000 : 2500000

    const material = Math.round(areaNum * pricePerSqm * 0.48)
    const tenagaKerja = Math.round(areaNum * pricePerSqm * 0.18)
    const furnitur = Math.round(areaNum * pricePerSqm * 0.34)
    const total = material + tenagaKerja + furnitur

    const breakdown = [
      { name: 'Persiapan & Pembongkaran', cost: Math.round(total * 0.06) },
      { name: 'Pekerjaan Dinding & Lantai', cost: Math.round(total * 0.18) },
      { name: 'Instalasi Listrik & Pipa', cost: Math.round(total * 0.1) },
    ]

    setEstimate({ tenagaKerja, material, furnitur, total, breakdown })
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  const formatShort = (n: number) => (n >= 1e6 ? `Rp ${Math.round(n / 1e6)}M` : formatCurrency(n))

  return (
    <div className="p-gutter space-y-md max-w-container-max">
      <div>
        <h1 className="font-display-lg text-display-lg font-bold text-on-background">
          Smart Control & Estimator
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Modular AI tools for rapid project assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Cost Estimator Form */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="flex items-center gap-sm mb-md">
            <span className="material-symbols-outlined text-primary">calculate</span>
            <h2 className="font-headline-sm text-headline-sm font-bold">Cost Estimator</h2>
          </div>

          <div className="space-y-md">
            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">
                Tipe Proyek
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
              >
                <option>Apartemen Studio</option>
                <option>Rumah 2 Lantai</option>
                <option>Kantor</option>
                <option>Cafe & Restoran</option>
                <option>Retail Store</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-sm">
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
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-body-md">
                    m²
                  </span>
                </div>
              </div>

              <div>
                <label className="text-label-caps text-outline uppercase block mb-2">
                  Kualitas
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                >
                  <option>Premium</option>
                  <option>Standard</option>
                  <option>Economy</option>
                </select>
              </div>
            </div>

            <button
              onClick={calculateEstimate}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-headline-sm text-[14px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              Hitung Estimasi AI
            </button>
          </div>
        </div>

        {/* Estimate Result */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">payments</span>
              <h2 className="font-headline-sm text-headline-sm font-bold">Estimasi Biaya</h2>
            </div>
            {estimate && (
              <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-caps font-bold uppercase">
                Draft AI
              </span>
            )}
          </div>

          {estimate ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-md">
                {(['tenagaKerja', 'material', 'furnitur'] as const).map((key) => {
                  const labels: Record<string, string> = {
                    tenagaKerja: 'Tenaga Kerja',
                    material: 'Material',
                    furnitur: 'Furnitur',
                  }
                  const isActive = activeTab === key
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`p-sm rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary-container text-white'
                          : 'bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <div
                        className={`text-label-caps uppercase mb-1 ${
                          isActive ? 'text-white/70' : 'text-outline'
                        }`}
                      >
                        {labels[key]}
                      </div>
                      <div
                        className={`font-headline-sm text-[18px] font-bold ${
                          isActive ? 'text-white' : 'text-on-background'
                        }`}
                      >
                        {formatShort(estimate[key])}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="space-y-sm mb-md">
                {estimate.breakdown.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-sm border-b border-outline-variant last:border-0"
                  >
                    <span className="text-body-md text-on-surface-variant">{item.name}</span>
                    <span className="font-mono-label text-mono-label font-bold">
                      {formatCurrency(item.cost)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-md border-t-2 border-primary flex justify-between items-center">
                <span className="font-headline-sm text-headline-sm font-bold">
                  Total Estimasi
                </span>
                <span className="font-display-lg text-[28px] font-bold text-primary">
                  {formatShort(estimate.total)}
                </span>
              </div>
            </>
          ) : (
            <div className="py-xl text-center text-outline">
              <span className="material-symbols-outlined text-6xl">receipt_long</span>
              <p className="mt-2 text-body-md">
                Isi form lalu klik <strong>Hitung Estimasi AI</strong> untuk melihat hasil
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Estimator
