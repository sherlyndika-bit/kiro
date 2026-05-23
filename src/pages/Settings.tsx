import React from 'react'

const Settings: React.FC = () => {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Kelola preferensi dan integrasi sistem Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Profile */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profil Perusahaan</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Perusahaan</label>
              <input type="text" value="Sudut Ruang" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value="hello@sudutruang.id" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
              <input type="tel" value="+62 812-3456-7890" className="input-field" />
            </div>
            <button className="btn-primary">Simpan Perubahan</button>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Konfigurasi AI</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto Follow-Up</p>
                <p className="text-sm text-gray-600">Kirim pesan otomatis ke lead baru</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Smart Estimator</p>
                <p className="text-sm text-gray-600">Kalkulasi biaya dengan AI</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Content Generator</p>
                <p className="text-sm text-gray-600">Generate konten marketing otomatis</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Integrasi</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-medium text-gray-900">WhatsApp Business</p>
                  <p className="text-sm text-gray-600">Connected</p>
                </div>
              </div>
              <button className="text-sm text-primary font-semibold">Configure</button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-medium text-gray-900">Email (Gmail)</p>
                  <p className="text-sm text-gray-600">Not connected</p>
                </div>
              </div>
              <button className="text-sm text-primary font-semibold">Connect</button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📸</span>
                <div>
                  <p className="font-medium text-gray-900">Instagram</p>
                  <p className="text-sm text-gray-600">Connected</p>
                </div>
              </div>
              <button className="text-sm text-primary font-semibold">Configure</button>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Paket Berlangganan</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Current Plan</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs">PRO</span>
              </div>
              <div className="text-3xl font-bold mb-1">Rp 500K</div>
              <div className="text-sm opacity-90">per bulan</div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Unlimited Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>AI Estimator & Proposal Generator</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>WhatsApp Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Advanced Analytics</span>
              </div>
            </div>

            <button className="btn-secondary w-full">Upgrade Plan</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
