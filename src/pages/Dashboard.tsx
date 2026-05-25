import React, { useEffect, useRef, useState } from 'react'
import { DBConversation, DBDocument, supabase } from '../services/supabaseClient'

interface Stats {
  activeChats: number
  aiHandledToday: number
  humanTakeovers: number
  proposalsSent: number
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    activeChats: 0,
    aiHandledToday: 0,
    humanTakeovers: 0,
    proposalsSent: 0,
  })
  const [recentConversations, setRecentConversations] = useState<DBConversation[]>([])
  const [recentDocuments, setRecentDocuments] = useState<DBDocument[]>([])
  const [loading, setLoading] = useState(true)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadData()

    // Polling setiap 5 detik — tidak pakai realtime untuk hindari StrictMode error
    pollRef.current = setInterval(loadData, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const loadData = async () => {
    await Promise.all([loadConversations(), loadDocuments()])
    setLoading(false)
  }

  const loadConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(5)

    if (data) {
      setRecentConversations(data)
      setStats((prev) => ({
        ...prev,
        activeChats: data.filter((c) => c.status === 'active').length,
        humanTakeovers: data.filter((c) => c.mode === 'manual').length,
        aiHandledToday: data.filter((c) => c.mode === 'ai' && c.status === 'active').length,
      }))
    }
  }

  const loadDocuments = async () => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      setRecentDocuments(data)
      setStats((prev) => ({
        ...prev,
        proposalsSent: data.filter((d) => d.type === 'proposal' && d.status === 'sent').length,
      }))
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (mins < 1) return 'baru saja'
    if (mins < 60) return `${mins}m lalu`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}j lalu`
    return `${Math.floor(hours / 24)}h lalu`
  }

  const statCards = [
    {
      label: 'Active Chats',
      value: stats.activeChats,
      icon: 'chat',
      color: 'text-secondary',
      change: 'realtime',
    },
    {
      label: 'AI Handled',
      value: stats.aiHandledToday,
      icon: 'smart_toy',
      color: 'text-emerald-600',
      change: 'today',
    },
    {
      label: 'Human Takeovers',
      value: stats.humanTakeovers,
      icon: 'support_agent',
      color: 'text-orange-600',
      change: 'active',
    },
    {
      label: 'Proposals Sent',
      value: stats.proposalsSent,
      icon: 'description',
      color: 'text-purple-600',
      change: 'total',
    },
  ]

  return (
    <div className="p-gutter space-y-md">
      <div>
        <h1 className="font-display-lg text-display-lg font-bold text-on-background">
          Dashboard
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Overview AI Operator performance — realtime dari Supabase
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-md">
              <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              <span className="text-label-caps text-outline">{stat.change}</span>
            </div>
            <div className="font-display-lg text-[32px] font-bold text-on-background">
              {loading ? '—' : stat.value}
            </div>
            <div className="text-body-md text-on-surface-variant">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md items-stretch">
        {/* Recent Conversations */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col">
          <div className="flex items-center justify-between mb-md">
            <h3 className="font-headline-sm text-headline-sm font-bold">Percakapan Terbaru</h3>
            <div className="flex items-center gap-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-label-caps text-emerald-600">Live</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-container rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : recentConversations.length === 0 ? (
            <div className="text-center py-xl text-outline">
              <span className="material-symbols-outlined text-4xl">chat</span>
              <p className="text-body-md mt-2">Belum ada percakapan</p>
              <p className="text-label-caps mt-1">
                Data akan muncul saat WA terhubung ke n8n
              </p>
            </div>
          ) : (
            <div className="space-y-sm">
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-start gap-sm py-sm border-b border-outline-variant last:border-0"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {conv.client_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-on-background truncate">{conv.client_name}</p>
                      <span className="text-label-caps text-outline ml-2 flex-shrink-0">
                        {formatTimeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-body-md text-on-surface-variant truncate">
                      {conv.last_message || 'No messages'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-label-caps font-bold flex-shrink-0 ${
                      conv.mode === 'ai'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {conv.mode === 'ai' ? 'AI' : 'Human'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col">
          <div className="flex items-center justify-between mb-md">
            <h3 className="font-headline-sm text-headline-sm font-bold">Dokumen Terbaru</h3>
          </div>

          {loading ? (
            <div className="space-y-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-container rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="text-center py-xl text-outline">
              <span className="material-symbols-outlined text-4xl">description</span>
              <p className="text-body-md mt-2">Belum ada dokumen</p>
              <p className="text-label-caps mt-1">
                Proposal & invoice akan muncul di sini
              </p>
            </div>
          ) : (
            <div className="space-y-sm">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-sm py-sm border-b border-outline-variant last:border-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      {doc.type === 'proposal'
                        ? 'description'
                        : doc.type === 'invoice'
                        ? 'receipt'
                        : 'calculate'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-on-background capitalize">{doc.type}</p>
                      <span className="text-label-caps text-outline ml-2 flex-shrink-0">
                        {formatTimeAgo(doc.created_at)}
                      </span>
                    </div>
                    <p className="text-body-md text-on-surface-variant truncate">
                      {doc.client_name || doc.client_phone || '-'}
                      {doc.proposal_no ? ` • ${doc.proposal_no}` : ''}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-label-caps font-bold flex-shrink-0 ${
                      doc.status === 'sent'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : doc.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-surface-container text-outline'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info box kalau belum ada data */}
      {!loading && recentConversations.length === 0 && (
        <div className="bg-secondary-fixed border border-secondary-fixed-dim rounded-xl p-md">
          <div className="flex items-start gap-sm">
            <span className="material-symbols-outlined text-secondary">info</span>
            <div>
              <p className="font-bold text-on-secondary-fixed mb-1">Setup yang diperlukan</p>
              <ol className="text-body-md text-on-surface-variant space-y-1 list-decimal list-inside">
                <li>Jalankan schema SQL di Supabase Dashboard → SQL Editor</li>
                <li>Setup WhatsApp Business API di Meta Developer Console</li>
                <li>Aktifkan semua 3 workflow di n8n</li>
                <li>Data percakapan akan muncul realtime di sini</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
