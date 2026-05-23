import React from 'react'

const Settings: React.FC = () => {
  const integrations = [
    { icon: 'chat', name: 'WhatsApp Business', status: 'Connected', active: true },
    { icon: 'photo_camera', name: 'Instagram', status: 'Connected', active: true },
    { icon: 'mail', name: 'Email (Gmail)', status: 'Not Connected', active: false },
    { icon: 'account_tree', name: 'n8n Workflow', status: 'Active', active: true },
  ]

  const aiToggles = [
    { name: 'Auto Follow-Up', desc: 'Kirim pesan otomatis ke lead baru', enabled: true },
    { name: 'Smart Estimator', desc: 'Kalkulasi biaya dengan AI', enabled: true },
    { name: 'Content Generator', desc: 'Generate konten marketing otomatis', enabled: true },
    { name: 'Confidence Alerts', desc: 'Alert ketika AI butuh bantuan human', enabled: true },
  ]

  return (
    <div className="p-gutter max-w-container-max space-y-md">
      <div>
        <h1 className="font-display-lg text-display-lg font-bold text-on-background">Settings</h1>
        <p className="text-body-md text-on-surface-variant">
          Kelola preferensi dan integrasi sistem
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Company Profile */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="font-headline-sm text-headline-sm font-bold mb-md">Profil Perusahaan</h3>
          <div className="space-y-md">
            {[
              { label: 'Nama Perusahaan', value: 'Sudut Ruang' },
              { label: 'Email', value: 'hello@sudutruang.id' },
              { label: 'Telepon', value: '+62 812-3456-7890' },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-label-caps text-outline uppercase block mb-2">
                  {f.label}
                </label>
                <input
                  type="text"
                  defaultValue={f.value}
                  className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                />
              </div>
            ))}
            <button className="w-full py-3 bg-primary text-on-primary rounded-lg font-headline-sm text-[14px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">
              Simpan Perubahan
            </button>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="font-headline-sm text-headline-sm font-bold mb-md">Konfigurasi AI</h3>
          <div className="space-y-sm">
            {aiToggles.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-sm bg-surface rounded-lg border border-outline-variant"
              >
                <div className="flex-1">
                  <p className="text-body-md font-bold">{t.name}</p>
                  <p className="text-label-caps text-outline">{t.desc}</p>
                </div>
                <div
                  className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner ${
                    t.enabled ? 'bg-emerald-500' : 'bg-outline'
                  }`}
                >
                  <div
                    className={`absolute top-1 bg-white w-4 h-4 rounded-full ${
                      t.enabled ? 'right-1' : 'left-1'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="font-headline-sm text-headline-sm font-bold mb-md">Integrasi</h3>
          <div className="space-y-sm">
            {integrations.map((int) => (
              <div
                key={int.name}
                className="flex items-center justify-between p-sm border border-outline-variant rounded-lg"
              >
                <div className="flex items-center gap-sm">
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      {int.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-body-md font-bold">{int.name}</p>
                    <p
                      className={`text-label-caps ${
                        int.active ? 'text-emerald-600' : 'text-outline'
                      }`}
                    >
                      {int.status}
                    </p>
                  </div>
                </div>
                <button className="text-label-caps font-bold text-secondary uppercase">
                  {int.active ? 'Configure' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* n8n Webhook */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="font-headline-sm text-headline-sm font-bold mb-md">n8n Webhook URL</h3>
          <div className="space-y-md">
            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">
                Webhook Base URL
              </label>
              <input
                type="text"
                defaultValue="https://n8n.workflow.ai/v1/hooks/sudutruang"
                className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg font-mono-label text-mono-label focus:ring-2 focus:ring-secondary outline-none"
              />
            </div>
            <div className="p-sm bg-surface-container rounded-lg flex items-start gap-sm">
              <span className="material-symbols-outlined text-secondary text-[18px]">info</span>
              <p className="text-body-md text-on-surface-variant">
                URL ini digunakan untuk komunikasi 2 arah antara dashboard dan workflow n8n Anda.
                Pastikan endpoint dapat diakses dari internet.
              </p>
            </div>
            <button className="w-full py-3 border border-outline-variant rounded-lg text-body-md font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-sm">
              <span className="material-symbols-outlined text-[18px]">sync</span>
              Test Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
