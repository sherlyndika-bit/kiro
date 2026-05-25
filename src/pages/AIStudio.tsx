import React, { useState, useEffect } from 'react'
import {
  TemplateService,
  QuickReplyService,
  AIConfigService,
  DBTemplate,
  DBQuickReply,
} from '../services/supabaseClient'

type Tab = 'templates' | 'quick-replies' | 'config' | 'documents'

const AIStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('templates')
  const [templates, setTemplates] = useState<DBTemplate[]>([])
  const [quickReplies, setQuickReplies] = useState<DBQuickReply[]>([])
  const [aiConfig, setAiConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Template form
  const [editingTemplate, setEditingTemplate] = useState<Partial<DBTemplate> | null>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Quick reply form
  const [editingQR, setEditingQR] = useState<Partial<DBQuickReply> | null>(null)
  const [savingQR, setSavingQR] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    const [t, qr, cfg] = await Promise.all([
      TemplateService.getAll(),
      QuickReplyService.getAll(),
      AIConfigService.getAll(),
    ])
    setTemplates(t)
    setQuickReplies(qr)
    setAiConfig(cfg)
    setLoading(false)
  }

  const saveTemplate = async () => {
    if (!editingTemplate?.type || !editingTemplate?.name || !editingTemplate?.content) return
    setSavingTemplate(true)
    await TemplateService.upsert({
      id: editingTemplate.id,
      type: editingTemplate.type!,
      name: editingTemplate.name!,
      content: editingTemplate.content!,
      variables: editingTemplate.variables || [],
      is_active: true,
    })
    await loadAll()
    setEditingTemplate(null)
    setSavingTemplate(false)
  }

  const deleteTemplate = async (id: string) => {
    await TemplateService.delete(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const saveQR = async () => {
    if (!editingQR?.title || !editingQR?.content) return
    setSavingQR(true)
    await QuickReplyService.upsert({
      id: editingQR.id,
      title: editingQR.title!,
      content: editingQR.content!,
      category: editingQR.category || 'general',
      is_active: true,
    })
    await loadAll()
    setEditingQR(null)
    setSavingQR(false)
  }

  const deleteQR = async (id: string) => {
    await QuickReplyService.delete(id)
    setQuickReplies((prev) => prev.filter((q) => q.id !== id))
  }

  const saveConfig = async (key: string, value: string) => {
    await AIConfigService.set(key, value)
    setAiConfig((prev) => ({ ...prev, [key]: value }))
  }

  const tabs: Array<{ id: Tab; icon: string; label: string }> = [
    { id: 'templates', icon: 'description', label: 'Templates' },
    { id: 'quick-replies', icon: 'bolt', label: 'Quick Replies' },
    { id: 'config', icon: 'tune', label: 'AI Config' },
    { id: 'documents', icon: 'folder', label: 'Documents' },
  ]

  const templateTypeColors: Record<string, string> = {
    greeting: 'bg-emerald-100 text-emerald-700',
    estimasi: 'bg-blue-100 text-blue-700',
    proposal_request: 'bg-purple-100 text-purple-700',
    followup: 'bg-orange-100 text-orange-700',
    invoice: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="p-gutter max-w-container-max space-y-md">
      <div>
        <h1 className="font-display-lg text-display-lg font-bold text-on-background">AI Studio</h1>
        <p className="text-body-md text-on-surface-variant">
          Kelola templates, quick replies, dan konfigurasi AI
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-xs py-2 px-sm rounded-lg text-body-md font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-background'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span className="hidden md:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <p className="text-body-md text-on-surface-variant">
                  Template pesan yang digunakan AI untuk auto-reply
                </p>
                <button
                  onClick={() => setEditingTemplate({ type: 'greeting', is_active: true })}
                  className="flex items-center gap-xs py-2 px-md bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Template Baru
                </button>
              </div>

              {/* Edit Form */}
              {editingTemplate !== null && (
                <div className="bg-surface-container-lowest border-2 border-primary rounded-xl p-md">
                  <h3 className="font-headline-sm font-bold mb-md">
                    {editingTemplate.id ? 'Edit Template' : 'Template Baru'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-sm mb-sm">
                    <div>
                      <label className="text-label-caps text-outline uppercase block mb-2">Tipe</label>
                      <select
                        value={editingTemplate.type || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, type: e.target.value })}
                        className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                      >
                        {['greeting', 'estimasi', 'proposal_request', 'followup', 'invoice', 'rab'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-label-caps text-outline uppercase block mb-2">Nama</label>
                      <input
                        type="text"
                        value={editingTemplate.name || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                        placeholder="Nama template"
                        className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                      />
                    </div>
                  </div>
                  <div className="mb-sm">
                    <label className="text-label-caps text-outline uppercase block mb-2">
                      Content — gunakan {'{variable}'} untuk variabel dinamis
                    </label>
                    <textarea
                      rows={8}
                      value={editingTemplate.content || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                      placeholder="Isi template... gunakan {client_name}, {building_type}, dll"
                      className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none resize-none font-mono-label"
                    />
                  </div>
                  <div className="flex gap-sm">
                    <button
                      onClick={saveTemplate}
                      disabled={savingTemplate}
                      className="flex items-center gap-xs py-2 px-md bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {savingTemplate ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      onClick={() => setEditingTemplate(null)}
                      className="py-2 px-md border border-outline-variant rounded-lg font-bold hover:bg-surface-container"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {templates.map((t) => (
                  <div key={t.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
                    <div className="flex items-start justify-between mb-sm">
                      <div>
                        <span className={`text-label-caps px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          templateTypeColors[t.type] || 'bg-surface-container text-on-surface-variant'
                        }`}>
                          {t.type}
                        </span>
                        <h3 className="font-bold text-on-background mt-1">{t.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingTemplate(t)}
                          className="p-1.5 hover:bg-surface-container rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                        </button>
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          className="p-1.5 hover:bg-error-container rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-body-md text-on-surface-variant line-clamp-3 font-mono-label text-[12px] bg-surface-container rounded-lg p-sm">
                      {t.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUICK REPLIES */}
          {activeTab === 'quick-replies' && (
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <p className="text-body-md text-on-surface-variant">
                  Balasan cepat untuk dipakai saat manual mode
                </p>
                <button
                  onClick={() => setEditingQR({ category: 'general' })}
                  className="flex items-center gap-xs py-2 px-md bg-primary text-on-primary rounded-lg font-bold hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Quick Reply Baru
                </button>
              </div>

              {editingQR !== null && (
                <div className="bg-surface-container-lowest border-2 border-primary rounded-xl p-md">
                  <h3 className="font-headline-sm font-bold mb-md">
                    {editingQR.id ? 'Edit Quick Reply' : 'Quick Reply Baru'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-sm mb-sm">
                    <div>
                      <label className="text-label-caps text-outline uppercase block mb-2">Judul</label>
                      <input
                        type="text"
                        value={editingQR.title || ''}
                        onChange={(e) => setEditingQR({ ...editingQR, title: e.target.value })}
                        placeholder="Nama singkat"
                        className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-label-caps text-outline uppercase block mb-2">Kategori</label>
                      <select
                        value={editingQR.category || 'general'}
                        onChange={(e) => setEditingQR({ ...editingQR, category: e.target.value })}
                        className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                      >
                        {['greeting', 'pricing', 'timeline', 'closing', 'general'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-sm">
                    <label className="text-label-caps text-outline uppercase block mb-2">Isi Pesan</label>
                    <textarea
                      rows={4}
                      value={editingQR.content || ''}
                      onChange={(e) => setEditingQR({ ...editingQR, content: e.target.value })}
                      placeholder="Isi pesan quick reply..."
                      className="w-full px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-sm">
                    <button
                      onClick={saveQR}
                      disabled={savingQR}
                      className="flex items-center gap-xs py-2 px-md bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {savingQR ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      onClick={() => setEditingQR(null)}
                      className="py-2 px-md border border-outline-variant rounded-lg font-bold hover:bg-surface-container"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {quickReplies.map((qr) => (
                  <div key={qr.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
                    <div className="flex items-start justify-between mb-sm">
                      <div>
                        <span className="text-label-caps text-outline uppercase text-[10px]">{qr.category}</span>
                        <h3 className="font-bold text-on-background">{qr.title}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingQR(qr)} className="p-1.5 hover:bg-surface-container rounded-lg">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                        </button>
                        <button onClick={() => deleteQR(qr.id)} className="p-1.5 hover:bg-error-container rounded-lg">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-body-md text-on-surface-variant line-clamp-3">{qr.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-md">
              <p className="text-body-md text-on-surface-variant">
                Konfigurasi behavior AI Agent
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {Object.entries(aiConfig).map(([key, value]) => (
                  <div key={key} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
                    <label className="text-label-caps text-outline uppercase block mb-2">{key.replace(/_/g, ' ')}</label>
                    <div className="flex gap-sm">
                      <input
                        type="text"
                        defaultValue={value}
                        onBlur={(e) => {
                          if (e.target.value !== value) {
                            saveConfig(key, e.target.value)
                          }
                        }}
                        className="flex-1 px-md py-3 bg-surface-container-low border-none rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                      />
                    </div>
                    <p className="text-label-caps text-outline mt-1">Current: {value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-md">
              <p className="text-body-md text-on-surface-variant">
                Semua dokumen yang telah di-generate (proposal, invoice, RAB)
              </p>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
                <div className="text-center py-xl text-outline">
                  <span className="material-symbols-outlined text-5xl">folder_open</span>
                  <p className="text-body-md mt-2">Documents akan muncul di sini</p>
                  <p className="text-label-caps mt-1">
                    Setelah WA terhubung dan client minta proposal, dokumen akan tersimpan otomatis
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AIStudio
