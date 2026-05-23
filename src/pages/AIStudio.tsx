import React, { useState } from 'react'

const AIStudio: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>('content-engine')

  const aiTools = [
    {
      id: 'content-engine',
      name: 'AI Content Engine',
      icon: '✍️',
      description: 'Generate konten marketing, caption sosial media, dan artikel blog',
      features: ['Instagram Caption', 'Blog Post', 'Email Marketing', 'Portfolio Description'],
    },
    {
      id: 'proposal-generator',
      name: 'AI Proposal Generator',
      icon: '📄',
      description: 'Buat proposal profesional secara otomatis dengan AI',
      features: ['Proposal Desain', 'RAB Detail', 'Timeline Proyek', 'Terms & Conditions'],
    },
    {
      id: 'follow-up',
      name: 'AI Follow-Up Automation',
      icon: '🔔',
      description: 'Otomatis follow-up lead dan klien dengan pesan personal',
      features: ['WhatsApp Auto-Reply', 'Email Sequences', 'Reminder System', 'Smart Scheduling'],
    },
    {
      id: 'image-generator',
      name: 'AI Image Generator',
      icon: '🎨',
      description: 'Generate visualisasi desain dan mood board dengan AI',
      features: ['Mood Board', 'Concept Visualization', 'Material Suggestions', 'Color Palettes'],
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Studio</h1>
        <p className="text-gray-600">Suite lengkap AI tools untuk produktivitas maksimal.</p>
      </div>

      {/* AI Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {aiTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => setSelectedTool(tool.id)}
            className={`card cursor-pointer transition-all hover:shadow-lg ${
              selectedTool === tool.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl">{tool.icon}</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{tool.name}</h3>
                <p className="text-sm text-gray-600">{tool.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tool.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Tool Workspace */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {aiTools.find((t) => t.id === selectedTool)?.name} Workspace
        </h2>

        {selectedTool === 'content-engine' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Konten</label>
              <select className="input-field">
                <option>Instagram Caption</option>
                <option>Blog Post</option>
                <option>Email Marketing</option>
                <option>Portfolio Description</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Proyek
              </label>
              <textarea
                className="input-field min-h-[120px]"
                placeholder="Contoh: Renovasi apartemen studio 45m2 dengan konsep minimalis modern..."
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                <select className="input-field">
                  <option>Professional</option>
                  <option>Casual</option>
                  <option>Inspirational</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Panjang</label>
                <select className="input-field">
                  <option>Short (50-100 kata)</option>
                  <option>Medium (100-200 kata)</option>
                  <option>Long (200+ kata)</option>
                </select>
              </div>
            </div>

            <button className="btn-primary w-full">✨ Generate Konten</button>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Generated Content:</div>
              <p className="text-gray-800 italic">
                Hasil konten AI akan muncul di sini...
              </p>
            </div>
          </div>
        )}

        {selectedTool === 'proposal-generator' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Upload data proyek dan AI akan generate proposal lengkap dengan RAB, timeline, dan
              terms & conditions.
            </p>
            <button className="btn-primary">📄 Generate Proposal</button>
          </div>
        )}

        {selectedTool === 'follow-up' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Set up automated follow-up sequences untuk lead dan klien Anda.
            </p>
            <button className="btn-primary">🔔 Setup Automation</button>
          </div>
        )}

        {selectedTool === 'image-generator' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Generate visualisasi desain dan mood board dengan teknologi AI image generation.
            </p>
            <button className="btn-primary">🎨 Generate Image</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIStudio
