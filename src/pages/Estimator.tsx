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
  const [isDraft, setIsDraft] = useState(false)

  const calculateEstimate = () => {
    const areaNum = parseFloat(area) || 0
    
    // Harga per sqm berdasarkan kualitas
    const pricePerSqm = quality === 'Premium' ? 5000000 : quality === 'Standard' ? 3500000 : 2500000
    
    // Kalkulasi
    const material = Math.round(areaNum * pricePerSqm * 0.48) // 48% material
    const tenagaKerja = Math.round(areaNum * pricePerSqm * 0.18) // 18% tenaga kerja
    const furnitur = Math.round(areaNum * pricePerSqm * 0.34) // 34% furnitur
    const total = material + tenagaKerja + furnitur

    // Breakdown detail
    const breakdown = [
      { name: 'Persiapan & Pembongkaran', cost: Math.round(total * 0.06) },
      { name: 'Pekerjaan Dinding & Lantai', cost: Math.round(total * 0.18) },
      { name: 'Instalasi Listrik & Pipa', cost: Math.round(total * 0.10) },
    ]

    setEstimate({ tenagaKerja, material, furnitur, total, breakdown })
    setIsDraft(true)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const formatShortCurrency = (num: number) => {
    if (num >= 1000000) {
      return `Rp ${Math.round(num / 1000000)}M`
    }
    return formatCurrency(num)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Control & Estimator</h1>
        <p className="text-gray-600">Modular AI tools for rapid project assessment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Estimator Form */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🧮</span>
            <h2 className="text-xl font-bold text-gray-900">Cost Estimator</h2>
          </div>

          <div className="space-y-4">
            {/* Project Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Proyek
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="input-field"
              >
                <option>Apartemen Studio</option>
                <option>Rumah 2 Lantai</option>
                <option>Kantor</option>
                <option>Cafe & Restoran</option>
                <option>Retail Store</option>
              </select>
            </div>

            {/* Area and Quality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Luas Area (sqm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="input-field pr-12"
                    placeholder="45"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    m²
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kualitas Material
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="input-field"
                >
                  <option>Premium</option>
                  <option>Standard</option>
                  <option>Economy</option>
                </select>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateEstimate}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              <span>✨</span>
              <span>Hitung Estimasi AI</span>
            </button>
          </div>
        </div>

        {/* AI Consultant Chat */}
        <div className="card relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <h2 className="text-xl font-bold text-gray-900">Kendali Konsultan AI</h2>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>

          {/* Client Type Tabs */}
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              🟢 Klien: Bpk. Budi
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              ⚫ Klien: Ibu Siti
            </button>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4 mb-4 min-h-[300px] max-h-[400px] overflow-y-auto">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">10:42:01 - AI ENGINE</div>
              <p className="text-gray-700">
                "Halo Pak Budi, saya asisten AI Sudut Ruang. Untuk apartemen 45sqm bergaya 
                minimalis, estimasi waktu pengerjaan standar adalah 4-6 minggu."
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 ml-8">
              <div className="text-xs text-blue-600 mb-1">10:43:15 - CLIENT (WA)</div>
              <p className="text-gray-700">"Bisa dipercepat jadi 3 minggu nggak ya?"</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">10:43:18 - AI DRAFTING RESPONSE...</div>
              <p className="text-gray-700">
                "Bisa Pak, namun akan dikenakan biaya lembur pekerja sebesar 15-20% dari total 
                estimasi. Apakah Bapak ingin saya buatkan simulasinya?"
              </p>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Ambil Alih Percakapan</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ketik balasan manual..."
                className="flex-1 input-field"
              />
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estimate Result */}
      {estimate && (
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Estimasi Biaya</h2>
            {isDraft && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                DRAFT AI
              </span>
            )}
          </div>

          {/* Cost Breakdown Tabs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border-b-2 border-gray-300">
              <div className="text-sm text-gray-600 mb-1">Tenaga Kerja</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(estimate.tenagaKerja)}
              </div>
            </div>
            <div className="text-center p-4 border-b-4 border-primary bg-blue-50">
              <div className="text-sm text-gray-600 mb-1">Material</div>
              <div className="text-2xl font-bold text-primary">
                {formatShortCurrency(estimate.material)}
              </div>
            </div>
            <div className="text-center p-4 border-b-2 border-gray-300">
              <div className="text-sm text-gray-600 mb-1">Furnitur</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(estimate.furnitur)}
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-3 mb-6">
            {estimate.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(item.cost)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
            <span className="text-lg font-bold text-gray-900">Total Estimasi Kasar</span>
            <span className="text-3xl font-bold text-primary">
              {formatShortCurrency(estimate.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Estimator
