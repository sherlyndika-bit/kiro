import React, { useState } from 'react'

const AIStudio: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('content-engine')

  const tools = [
    {
      id: 'content-engine',
      icon: 'edit_note',
      name: 'AI Content Engine',
      desc: 'Generate konten marketing, caption, dan artikel blog',
      tags: ['Instagram Caption', 'Blog Post', 'Email Marketing'],
    },
    {
      id: 'proposal',
      icon: 'description',
      name: 'AI Proposal Generator',
      desc: 'Buat proposal profesional secara otomatis',
      tags: ['Proposal Desain', 'RAB Detail', 'Timeline'],
    },
    {
      id: 'followup',
      icon: 'campaign',
      name: 'AI Follow-Up Automation',
      desc: 'Otomatis follow-up lead dan klien',
      tags: ['WA Auto-Reply', 'Email Sequences', 'Reminder'],
    },
    {
      id: 'image',
      icon: 'palette',
      name: 'AI Image Generator',
      desc: 'Generate visualisasi desain dengan AI',
      tags: ['Mood Board', 'Concept Visual', 'Color Palette'],
    },
  ]

  return (
    <div className="p-gutter max-w-container-max space-y-md">
      <div>
        <h1 className="font-display-lg text-display-lg font-bold text-on-background">AI Studio</h1>
        <p className="text-body-md text-on-surface-variant">
          Suite lengkap AI tools untuk produktivitas maksimal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTool(t.id)}
            className={`text-left bg-surface-container-lowest border rounded-xl p-md transition-all hover:shadow-md ${
              selectedTool === t.id
                ? 'border-primary border-2'
                : 'border-outline-variant'
            }`}
          >
            <div className="flex items-start gap-sm mb-md">
              <div className="w-12 h-12 rounded-lg bg-primary-container text-white flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined">{t.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-headline-sm text-headline-sm font-bold mb-1">{t.name}</h3>
                <p className="text-body-md text-on-surface-variant">{t.desc}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {t.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-surface-container rounded-full text-label-caps text-on-surface-variant"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <h3 className="font-headline-sm text-headline-sm font-bold mb-md">
          {tools.find((t) => t.id === selectedTool)?.name} Workspace
        </h3>

        <div className="space-y-md">
          <div>
            <label className="text-label-caps text-outline uppercase block mb-2">
              Deskripsi Project
            </label>
            <textarea
              rows={4}
              placeholder="Contoh: Renovasi apartemen studio 45m² dengan konsep minimalis modern..."
              className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-sm">
            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">Tone</label>
              <select className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none">
                <option>Professional</option>
                <option>Casual</option>
                <option>Inspirational</option>
              </select>
            </div>
            <div>
              <label className="text-label-caps text-outline uppercase block mb-2">Length</label>
              <select className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none">
                <option>Short</option>
                <option>Medium</option>
                <option>Long</option>
              </select>
            </div>
          </div>

          <button className="w-full py-3 bg-primary text-on-primary rounded-lg font-headline-sm text-[14px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm">
            <span className="material-symbols-outlined">auto_awesome</span>
            Generate dengan AI
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIStudio
