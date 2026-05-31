import React, { useEffect, useRef, useState } from 'react'
import { DBConversation, DBDocument, supabase } from '../services/supabaseClient'

type PageType =
  | 'dashboard'
  | 'chat-monitoring'
  | 'pipeline'
  | 'estimator'
  | 'ai-studio'
  | 'settings'

interface DashboardProps {
  onNavigate?: (page: PageType) => void
}

interface Stats {
  activeChats: number
  aiHandledToday: number
  humanTakeovers: number
  proposalsSent: number
}

const isToday = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
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
    pollRef.current = setInterval(loadData, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const loadData = async () => {
    await Promise.all([loadConversations(), loadDocuments()])
    setLoading(false)
  }

  // Fetch ALL conversations for accurate stats; only display the 5 most recent.
  const loadConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })

    if (data) {
      setRecentConversations(data.slice(0, 5))
      setStats((prev) => ({
        ...prev,
        activeChats: data.filter((c) => c.status === 'active').length,
        humanTakeovers: data.filter((c) => c.mode === 'manual').length,
        aiHandledToday: data.filter((c) => c.mode === 'ai' && isToday(c.last_message_at)).length,
      }))
    }
  }

  const loadDocuments = async () => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRecentDocuments(data.slice(0, 5))
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
    { label: 'Active Chats', value: stats.activeChats, icon: 'forum', tone: 'g' as const },
    { label: 'AI Handled (hari ini)', value: stats.aiHandledToday, icon: 'smart_toy', tone: 'b' as const },
    { label: 'Human Takeovers', value: stats.humanTakeovers, icon: 'support_agent', tone: 'a' as const },
    { label: 'Proposal Terkirim', value: stats.proposalsSent, icon: 'description', tone: 'p' as const },
  ]

  const toneClasses: Record<string, string> = {
    g: 'bg-brand-soft text-brand-mid',
    b: 'bg-blue-soft text-blue',
    a: 'bg-amber-soft text-amber',
    p: 'bg-purple-soft text-purple',
  }

  return (
    <div className="p-sm md:p-gutter max-w-container-max mx-auto space-y-md">
      {/* AI Banner */}
      <div className="bg-brand rounded-2xl p-md md:px-md md:py-5 flex items-center gap-sm md:gap-md relative overflow-hidden">
        <span className="w-2.5 h-2.5 rounded-full bg-brand-accent flex-shrink-0 animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[14px] leading-snug">
            Pusat kendali AI Operator — Syifa
          </p>
          <p className="text-white/55 text-[13px] truncate">
            {loading
              ? 'Memuat data realtime dari Supabase...'
              : `${stats.activeChats} chat aktif · ${stats.aiHandledToday} ditangani AI hari ini`}
          </p>
        </div>
        <button
          onClick={() => onNavigate?.('chat-monitoring')}
          className="bg-brand-accent/20 text-brand-accent border border-brand-accent/25 rounded-lg px-3 py-2 text-[13px] font-semibold whitespace-nowrap hover:bg-brand-accent/30 transition-colors"
        >
          Buka Chat →
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm md:gap-md">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-outline-variant rounded-2xl p-md hover:shadow-soft transition-shadow"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-sm ${toneClasses[stat.tone]}`}>
              <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
            </div>
            <div className="font-serif-display text-[28px] text-on-surface leading-none">
              {loading ? '—' : stat.value}
            </div>
            <div className="text-[12px] text-on-surface-variant mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Recent Conversations */}
        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant">
            <h3 className="text-[14px] font-semibold flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px] text-brand-mid">forum</span>
              Percakapan Terbaru
            </h3>
            <button
              onClick={() => onNavigate?.('chat-monitoring')}
              className="text-[12px] font-semibold text-brand-mid hover:underline"
            >
              Semua →
            </button>
          </div>

          {loading ? (
            <div className="p-md space-y-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-container rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentConversations.length === 0 ? (
            <div className="text-center py-xl text-outline">
              <span className="material-symbols-outlined text-4xl">forum</span>
              <p className="text-body-md mt-2">Belum ada percakapan</p>
            </div>
          ) : (
            <div>
              {recentConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onNavigate?.('chat-monitoring')}
                  className="w-full text-left flex items-center gap-sm px-md py-3 border-b border-outline-variant/60 last:border-0 hover:bg-background transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-soft flex items-center justify-center text-brand-mid font-semibold flex-shrink-0">
                    {(conv.client_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-on-surface truncate text-[13px]">
                        {conv.client_name || 'Pelanggan'}
                      </p>
                      <span className="text-[11px] text-outline ml-2 flex-shrink-0">
                        {formatTimeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-on-surface-variant truncate">
                      {conv.last_message || 'No messages'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                      conv.mode === 'ai' ? 'bg-brand-soft text-brand-mid' : 'bg-amber-soft text-amber'
                    }`}
                  >
                    {conv.mode === 'ai' ? 'AI' : 'Human'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant">
            <h3 className="text-[14px] font-semibold flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px] text-brand-mid">description</span>
              Dokumen Terbaru
            </h3>
            <button
              onClick={() => onNavigate?.('ai-studio')}
              className="text-[12px] font-semibold text-brand-mid hover:underline"
            >
              Semua →
            </button>
          </div>

          {loading ? (
            <div className="p-md space-y-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-container rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="text-center py-xl text-outline">
              <span className="material-symbols-outlined text-4xl">description</span>
              <p className="text-body-md mt-2">Belum ada dokumen</p>
            </div>
          ) : (
            <div>
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-sm px-md py-3 border-b border-outline-variant/60 last:border-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-brand-mid text-[18px]">
                      {doc.type === 'proposal'
                        ? 'description'
                        : doc.type === 'invoice'
                        ? 'receipt'
                        : 'calculate'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-on-surface capitalize text-[13px]">
                        {doc.type}
                      </p>
                      <span className="text-[11px] text-outline ml-2 flex-shrink-0">
                        {formatTimeAgo(doc.created_at)}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-on-surface-variant truncate">
                      {doc.client_name || doc.client_phone || '-'}
                      {doc.proposal_no ? ` • ${doc.proposal_no}` : ''}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 capitalize ${
                      doc.status === 'sent'
                        ? 'bg-blue-soft text-blue'
                        : doc.status === 'accepted'
                        ? 'bg-brand-soft text-brand-mid'
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

      {/* Setup hint */}
      {!loading && recentConversations.length === 0 && (
        <div className="bg-brand-soft border border-brand-accent/20 rounded-2xl p-md">
          <div className="flex items-start gap-sm">
            <span className="material-symbols-outlined text-brand-mid">info</span>
            <div>
              <p className="font-semibold text-brand-dark mb-1">Setup yang diperlukan</p>
              <ol className="text-[13px] text-on-surface-variant space-y-1 list-decimal list-inside">
                <li>Jalankan schema SQL di Supabase Dashboard → SQL Editor</li>
                <li>Setup WhatsApp Business API di Meta Developer Console</li>
                <li>Aktifkan semua workflow di n8n</li>
                <li>Data percakapan akan muncul otomatis di sini</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
