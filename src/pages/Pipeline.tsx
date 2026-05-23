import React from 'react'

const Pipeline: React.FC = () => {
  const stages = [
    {
      name: 'Lead Baru',
      count: 8,
      color: 'bg-blue-100 text-blue-700',
      projects: [
        { name: 'Bpk. Ahmad', value: 'Rp 180M', source: 'Instagram' },
        { name: 'Ibu Rina', value: 'Rp 120M', source: 'Referral' },
      ],
    },
    {
      name: 'Estimasi',
      count: 5,
      color: 'bg-yellow-100 text-yellow-700',
      projects: [
        { name: 'Bpk. Budi', value: 'Rp 250M', source: 'Website' },
      ],
    },
    {
      name: 'Proposal',
      count: 3,
      color: 'bg-purple-100 text-purple-700',
      projects: [
        { name: 'Ibu Siti', value: 'Rp 320M', source: 'WhatsApp' },
      ],
    },
    {
      name: 'Negosiasi',
      count: 2,
      color: 'bg-orange-100 text-orange-700',
      projects: [
        { name: 'PT. Maju', value: 'Rp 500M', source: 'Direct' },
      ],
    },
    {
      name: 'Deal Closed',
      count: 4,
      color: 'bg-green-100 text-green-700',
      projects: [
        { name: 'Bpk. Joko', value: 'Rp 280M', source: 'Referral' },
      ],
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pipeline CRM</h1>
        <p className="text-gray-600">Kelola semua lead dan proyek dalam satu tempat.</p>
      </div>

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage, index) => (
          <div key={index} className="flex-shrink-0 w-80">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{stage.name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${stage.color}`}>
                  {stage.count}
                </span>
              </div>

              <div className="space-y-3">
                {stage.projects.map((project, pIndex) => (
                  <div
                    key={pIndex}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">{project.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary font-semibold">{project.value}</span>
                      <span className="text-xs text-gray-500">{project.source}</span>
                    </div>
                  </div>
                ))}

                <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors">
                  + Tambah
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Pipeline Value</div>
          <div className="text-3xl font-bold text-gray-900">Rp 1.65B</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
          <div className="text-3xl font-bold text-green-600">32%</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Avg. Deal Size</div>
          <div className="text-3xl font-bold text-gray-900">Rp 245M</div>
        </div>
      </div>
    </div>
  )
}

export default Pipeline
