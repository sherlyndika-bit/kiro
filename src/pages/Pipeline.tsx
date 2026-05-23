import React from 'react'

const Pipeline: React.FC = () => {
  const stages = [
    {
      name: 'Lead Baru',
      count: 8,
      color: 'bg-secondary-container text-on-secondary-container',
      projects: [
        { name: 'Bpk. Ahmad', value: 'Rp 180M', source: 'Instagram' },
        { name: 'Ibu Rina', value: 'Rp 120M', source: 'Referral' },
      ],
    },
    {
      name: 'Estimasi',
      count: 5,
      color: 'bg-tertiary-fixed text-on-tertiary-fixed',
      projects: [{ name: 'Bpk. Budi', value: 'Rp 250M', source: 'Website' }],
    },
    {
      name: 'Proposal',
      count: 3,
      color: 'bg-primary-fixed text-on-primary-fixed',
      projects: [{ name: 'Ibu Siti', value: 'Rp 320M', source: 'WhatsApp' }],
    },
    {
      name: 'Negosiasi',
      count: 2,
      color: 'bg-error-container text-on-error-container',
      projects: [{ name: 'PT. Maju', value: 'Rp 500M', source: 'Direct' }],
    },
    {
      name: 'Deal Closed',
      count: 4,
      color: 'bg-emerald-100 text-emerald-700',
      projects: [{ name: 'Bpk. Joko', value: 'Rp 280M', source: 'Referral' }],
    },
  ]

  return (
    <div className="p-gutter max-w-container-max">
      <div className="mb-md">
        <h1 className="font-display-lg text-display-lg font-bold text-on-background">
          Client Database
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Pipeline tracking untuk semua lead dan client
        </p>
      </div>

      <div className="flex gap-md overflow-x-auto pb-md">
        {stages.map((stage, i) => (
          <div key={i} className="flex-shrink-0 w-72">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-headline-sm text-[14px] font-bold uppercase tracking-wide">
                  {stage.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-label-caps font-bold ${stage.color}`}
                >
                  {stage.count}
                </span>
              </div>

              <div className="space-y-sm">
                {stage.projects.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-outline-variant rounded-lg p-sm hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <h4 className="font-bold text-on-background mb-1">{p.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="font-mono-label text-mono-label text-secondary font-bold">
                        {p.value}
                      </span>
                      <span className="text-label-caps text-outline">{p.source}</span>
                    </div>
                  </div>
                ))}

                <button className="w-full py-2 border-2 border-dashed border-outline-variant rounded-lg text-outline hover:border-primary hover:text-primary transition-colors text-body-md">
                  + Tambah
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mt-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="text-label-caps text-outline uppercase mb-1">
            Total Pipeline Value
          </div>
          <div className="font-display-lg text-[28px] font-bold">Rp 1.65B</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="text-label-caps text-outline uppercase mb-1">Conversion Rate</div>
          <div className="font-display-lg text-[28px] font-bold text-emerald-600">32%</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <div className="text-label-caps text-outline uppercase mb-1">Avg. Deal Size</div>
          <div className="font-display-lg text-[28px] font-bold">Rp 245M</div>
        </div>
      </div>
    </div>
  )
}

export default Pipeline
