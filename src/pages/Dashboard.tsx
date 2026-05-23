import React from 'react'

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Total Proyek', value: '24', change: '+12%', icon: '📁' },
    { label: 'Proyek Aktif', value: '8', change: '+3', icon: '⚡' },
    { label: 'Lead Baru', value: '15', change: '+5', icon: '👥' },
    { label: 'Revenue Bulan Ini', value: 'Rp 450M', change: '+18%', icon: '💰' },
  ]

  const recentProjects = [
    { name: 'Apartemen Bpk. Budi', type: 'Studio 45m²', status: 'Estimasi', progress: 20 },
    { name: 'Rumah Ibu Siti', type: 'Rumah 2 Lantai', status: 'Proposal', progress: 60 },
    { name: 'Kantor PT. Maju', type: 'Office 120m²', status: 'Pengerjaan', progress: 80 },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Selamat datang kembali! Berikut ringkasan bisnis Anda.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{stat.icon}</div>
              <span className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Proyek Terbaru</h2>
          <div className="space-y-4">
            {recentProjects.map((project, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-600">{project.type}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {project.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aktivitas AI</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">AI Estimator digunakan</p>
                <p className="text-xs text-gray-500">5 menit yang lalu • Apartemen Bpk. Budi</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">AI Follow-up mengirim pesan</p>
                <p className="text-xs text-gray-500">15 menit yang lalu • Ibu Siti</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📄</span>
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">Proposal AI di-generate</p>
                <p className="text-xs text-gray-500">1 jam yang lalu • PT. Maju</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
