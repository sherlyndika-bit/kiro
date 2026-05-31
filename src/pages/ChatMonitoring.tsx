import React, { useState, useEffect, useRef } from 'react'
import {
  DBConversation,
  DBMessage,
  ConversationService,
  QuickReplyService,
  DBQuickReply,
} from '../services/supabaseClient'
import { n8nService } from '../services/n8nWebhookService'

type MobileView = 'list' | 'chat' | 'panel'

const avatarPalette = [
  'bg-brand-mid',
  'bg-blue',
  'bg-coral',
  'bg-purple',
  'bg-brand-accent',
  'bg-amber',
]

const avatarColor = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return avatarPalette[h % avatarPalette.length]
}

interface ChatMonitoringProps {
  /** Optional search term seeded from the TopBar search box */
  initialSearch?: string
  /** Increments whenever the TopBar search is submitted, to re-apply the seed */
  searchNonce?: number
}

const ChatMonitoring: React.FC<ChatMonitoringProps> = ({ initialSearch, searchNonce }) => {
  const [conversations, setConversations] = useState<DBConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DBMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [filterSource, setFilterSource] = useState<'all' | 'whatsapp' | 'instagram'>('all')
  const [search, setSearch] = useState('')
  const [quickReplies, setQuickReplies] = useState<DBQuickReply[]>([])
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [loading, setLoading] = useState(true)
  const [togglingMode, setTogglingMode] = useState(false)
  const [mobileView, setMobileView] = useState<MobileView>('list')

  // Smart auto-scroll state
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [unseenCount, setUnseenCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)
  const prevSelectedIdRef = useRef<string | null>(null)

  const selectedConv = conversations.find((c) => c.id === selectedId) || null
  const convPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const selectedIdRef = useRef<string | null>(null)

  useEffect(() => {
    loadConversations()
    loadQuickReplies()
    convPollRef.current = setInterval(loadConversations, 3000)
    return () => {
      if (convPollRef.current) clearInterval(convPollRef.current)
    }
  }, [])

  // Seed the conversation search from the TopBar (re-applies on each submit)
  useEffect(() => {
    if (searchNonce && searchNonce > 0) {
      setSearch(initialSearch || '')
    }
  }, [searchNonce])

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId)
      ConversationService.markRead(selectedId)
      if (msgPollRef.current) clearInterval(msgPollRef.current)
      msgPollRef.current = setInterval(() => loadMessages(selectedId), 3000)
    }
    return () => {
      if (msgPollRef.current) clearInterval(msgPollRef.current)
    }
  }, [selectedId])

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    const isNearBottom = distanceFromBottom < 80
    setShouldAutoScroll(isNearBottom)
    if (isNearBottom) setUnseenCount(0)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    setShouldAutoScroll(true)
    setUnseenCount(0)
  }

  useEffect(() => {
    if (prevSelectedIdRef.current !== selectedId) {
      prevSelectedIdRef.current = selectedId
      prevMessageCountRef.current = messages.length
      setShouldAutoScroll(true)
      setUnseenCount(0)
      const t = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
      }, 50)
      return () => clearTimeout(t)
    }

    if (messages.length > prevMessageCountRef.current) {
      const newCount = messages.length - prevMessageCountRef.current
      if (shouldAutoScroll) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      } else {
        setUnseenCount((prev) => prev + newCount)
      }
      prevMessageCountRef.current = messages.length
    }
  }, [messages, selectedId, shouldAutoScroll])

  const loadConversations = async () => {
    const data = await ConversationService.getAll()
    setConversations(data)
    if (data.length > 0 && !selectedIdRef.current) {
      setSelectedId(data[0].id)
      selectedIdRef.current = data[0].id
    }
    setLoading(false)
  }

  const loadMessages = async (convId: string) => {
    const data = await ConversationService.getMessages(convId)
    setMessages(data)
  }

  const loadQuickReplies = async () => {
    const data = await QuickReplyService.getAll()
    setQuickReplies(data)
  }

  const handleSelectConversation = (id: string) => {
    setSelectedId(id)
    selectedIdRef.current = id
    setMobileView('chat')
    // Optimistically clear unread in local list
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    )
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return
    const text = messageInput

    const msg: Omit<DBMessage, 'id' | 'created_at'> = {
      conversation_id: selectedConv.id,
      content: text,
      role: 'human',
      source: selectedConv.source,
      ai_confidence: null,
      needs_human_review: false,
      metadata: { dashboardSent: true },
    }

    setMessageInput('')
    await ConversationService.insertMessage(msg)
    await ConversationService.upsertConversation({
      id: selectedConv.id,
      last_message: text,
      last_message_at: new Date().toISOString(),
    })
    loadMessages(selectedConv.id)

    await n8nService.sendMessageToClient({
      conversationId: selectedConv.id,
      clientPhoneOrUsername: selectedConv.id,
      message: text,
      source: selectedConv.source as 'whatsapp' | 'instagram',
      senderRole: 'human',
      humanOperator: 'Dashboard Operator',
    })
  }

  const handleToggleMode = async () => {
    if (!selectedConv || togglingMode) return
    const newMode = selectedConv.mode === 'ai' ? 'manual' : 'ai'
    setTogglingMode(true)
    // Optimistic update
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConv.id ? { ...c, mode: newMode } : c)),
    )
    await ConversationService.toggleMode(selectedConv.id, newMode)
    await n8nService.toggleConversationMode({
      conversationId: selectedConv.id,
      newMode,
      triggeredBy: 'dashboard-operator',
    })
    setTogglingMode(false)
  }

  const filtered = conversations
    .filter((c) => (filterSource === 'all' ? true : c.source === filterSource))
    .filter((c) =>
      search.trim()
        ? (c.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
          c.id.includes(search)
        : true,
    )

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const formatTimeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (mins < 1) return 'baru'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}j`
    return `${Math.floor(hours / 24)}h`
  }

  const meta = (selectedConv?.metadata || {}) as Record<string, string>
  const projectType = meta.projectType || meta.buildingType
  const estimatedValue = meta.estimatedValue

  const listVisibility = mobileView === 'list' ? 'flex' : 'hidden md:flex'
  const chatVisibility = mobileView === 'chat' ? 'flex' : 'hidden md:flex'
  const panelVisibility = mobileView === 'panel' ? 'flex' : 'hidden xl:flex'

  const aiConfidence = (() => {
    const aiMsgs = messages.filter((m) => m.role === 'ai' && m.ai_confidence)
    if (aiMsgs.length === 0) return null
    const avg = aiMsgs.reduce((s, m) => s + (m.ai_confidence || 0), 0) / aiMsgs.length
    return Math.round(avg * 100)
  })()

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* ── Column 1: Conversation List ───────────────────────── */}
      <section
        className={`${listVisibility} w-full md:w-72 lg:w-80 border-r border-outline-variant bg-surface flex-col flex-shrink-0 min-h-0`}
      >
        <div className="p-md border-b border-outline-variant">
          <div className="flex items-center justify-between mb-sm">
            <h3 className="text-[15px] font-semibold text-on-surface">Percakapan</h3>
            <span className="text-[11px] font-semibold bg-brand-soft text-brand-mid px-2 py-0.5 rounded-full">
              {conversations.filter((c) => c.status === 'active').length} online
            </span>
          </div>
          {/* Search */}
          <div className="flex items-center gap-xs bg-background border border-outline-variant rounded-full px-3 py-2 mb-sm">
            <span className="material-symbols-outlined text-outline text-[18px]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / nomor..."
              className="bg-transparent border-none outline-none text-[13px] w-full placeholder:text-outline"
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Hapus pencarian">
                <span className="material-symbols-outlined text-outline text-[18px]">close</span>
              </button>
            )}
          </div>
          {/* Source filter */}
          <div className="flex gap-1">
            {(['all', 'whatsapp', 'instagram'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSource(s)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                  filterSource === s
                    ? 'bg-brand text-white'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {s === 'all' ? `Semua (${conversations.length})` : s === 'whatsapp' ? 'WA' : 'IG'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-md space-y-sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-surface-container rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-md text-center text-outline mt-lg">
              <span className="material-symbols-outlined text-5xl">forum</span>
              <p className="text-body-md mt-2 font-medium text-on-surface-variant">
                {search || filterSource !== 'all' ? 'Tidak ada hasil' : 'Belum ada percakapan'}
              </p>
              <p className="text-[11px] mt-1 px-md">
                Pesan WhatsApp/Instagram akan muncul di sini saat n8n WF1 aktif.
              </p>
            </div>
          ) : (
            filtered.map((conv) => {
              const isSelected = selectedId === conv.id
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full text-left px-md py-3 flex items-center gap-sm border-b border-outline-variant/60 transition-colors ${
                    isSelected ? 'bg-brand-soft' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full ${avatarColor(
                        conv.id,
                      )} flex items-center justify-center text-white font-semibold text-[16px]`}
                    >
                      {(conv.client_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center text-[8px] font-bold text-white ${
                        conv.source === 'whatsapp' ? 'bg-[#25D366]' : 'bg-[#E1306C]'
                      }`}
                    >
                      {conv.source === 'whatsapp' ? 'W' : 'I'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-on-surface text-[14px] truncate">
                        {conv.client_name || 'Pelanggan'}
                      </span>
                      <span
                        className={`text-[11px] flex-shrink-0 ${
                          conv.unread_count > 0 && !isSelected
                            ? 'text-brand-accent font-bold'
                            : 'text-outline'
                        }`}
                      >
                        {formatTimeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-[12.5px] text-on-surface-variant truncate">
                        {conv.last_message || '—'}
                      </p>
                      {conv.unread_count > 0 && !isSelected ? (
                        <span className="flex-shrink-0 bg-brand-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      ) : (
                        <span
                          className={`flex-shrink-0 w-2 h-2 rounded-full ${
                            conv.mode === 'ai' ? 'bg-brand-accent' : 'bg-amber'
                          }`}
                          title={conv.mode === 'ai' ? 'AI aktif' : 'Ditangani manusia'}
                        />
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </section>

      {/* ── Column 2: Chat Thread ─────────────────────────────── */}
      <section className={`${chatVisibility} flex-1 flex-col min-w-0 min-h-0 relative`}>
        {selectedConv ? (
          <>
            {/* Header (WhatsApp green) */}
            <div className="bg-brand text-white px-sm md:px-md h-16 flex items-center gap-sm flex-shrink-0">
              <button
                onClick={() => setMobileView('list')}
                className="md:hidden -ml-1 p-1.5 rounded-full hover:bg-white/10"
                aria-label="Kembali ke daftar"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div
                className={`w-10 h-10 rounded-full ${avatarColor(
                  selectedConv.id,
                )} flex items-center justify-center text-white font-semibold flex-shrink-0`}
              >
                {(selectedConv.client_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[15px] leading-tight truncate">
                  {selectedConv.client_name || 'Pelanggan'}
                </h3>
                <p className="text-[11px] text-white/60 truncate">
                  {selectedConv.source === 'whatsapp' ? 'WhatsApp' : 'Instagram'} · {selectedConv.id}
                </p>
              </div>

              {/* Handoff button */}
              <button
                onClick={handleToggleMode}
                disabled={togglingMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95 disabled:opacity-60 ${
                  selectedConv.mode === 'ai'
                    ? 'bg-amber text-white hover:brightness-105'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title={selectedConv.mode === 'ai' ? 'Ambil alih dari AI' : 'Kembalikan ke AI'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {selectedConv.mode === 'ai' ? 'support_agent' : 'smart_toy'}
                </span>
                <span className="hidden sm:inline">
                  {selectedConv.mode === 'ai' ? 'Ambil Alih' : 'Kembali ke AI'}
                </span>
              </button>

              <button
                onClick={() => setMobileView('panel')}
                className="xl:hidden p-1.5 rounded-full hover:bg-white/10"
                aria-label="Info kontak"
              >
                <span className="material-symbols-outlined">info</span>
              </button>
            </div>

            {/* Mode strip */}
            <div
              className={`flex items-center gap-xs px-md py-1.5 text-[11px] font-semibold flex-shrink-0 ${
                selectedConv.mode === 'ai'
                  ? 'bg-brand-soft text-brand-mid'
                  : 'bg-amber-soft text-amber'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedConv.mode === 'ai' ? 'bg-brand-accent animate-pulse' : 'bg-amber'
                }`}
              />
              {selectedConv.mode === 'ai'
                ? 'AI sedang menangani percakapan ini secara otomatis'
                : 'Mode manusia — AI dijeda, kamu yang membalas'}
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="custom-scrollbar scroll-smooth flex-1 px-sm md:px-md py-md overflow-y-auto flex flex-col gap-2 chat-wallpaper min-h-0 relative"
            >
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-outline">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-5xl">chat_bubble</span>
                    <p className="text-body-md mt-2">Belum ada pesan</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isClient = msg.role === 'client'
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[82%] sm:max-w-[70%] ${
                        isClient ? 'items-start self-start' : 'items-end self-end'
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-2xl shadow-sm text-[13.5px] leading-relaxed ${
                          isClient
                            ? 'bg-white text-on-surface rounded-bl-sm'
                            : msg.role === 'ai'
                            ? 'bg-brand-soft text-brand-dark rounded-br-sm border border-brand-accent/15'
                            : 'bg-brand text-white rounded-br-sm'
                        }`}
                      >
                        {!isClient && (
                          <div className="text-[10px] font-bold uppercase tracking-wide opacity-60 mb-0.5">
                            {msg.role === 'ai' ? 'AI Agent' : 'Operator'}
                            {msg.ai_confidence ? ` · ${Math.round(msg.ai_confidence * 100)}%` : ''}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-outline mt-0.5 mx-1">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* New messages pill */}
            {!shouldAutoScroll && unseenCount > 0 && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-xs px-md py-2 bg-brand text-white rounded-full shadow-soft-md hover:opacity-90 active:scale-95 transition-all animate-scale-up"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                <span className="text-[12px] font-semibold">{unseenCount} pesan baru</span>
              </button>
            )}

            {/* Input */}
            <div className="bg-surface border-t border-outline-variant p-sm flex-shrink-0">
              {selectedConv.mode === 'ai' ? (
                <button
                  onClick={handleToggleMode}
                  disabled={togglingMode}
                  className="w-full py-3 rounded-full bg-amber-soft text-amber font-semibold text-[13px] flex items-center justify-center gap-xs hover:brightness-95 transition-all disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                  AI sedang aktif — Ambil alih untuk membalas
                </button>
              ) : (
                <>
                  {showQuickReplies && quickReplies.length > 0 && (
                    <div className="mb-sm overflow-x-auto no-scrollbar">
                      <div className="flex gap-2 pb-1">
                        {quickReplies.map((qr) => (
                          <button
                            key={qr.id}
                            onClick={() => {
                              setMessageInput(qr.content)
                              setShowQuickReplies(false)
                            }}
                            className="whitespace-nowrap px-3 py-1.5 border border-outline-variant rounded-full text-[12px] text-on-surface-variant hover:border-brand-accent hover:text-brand-mid transition-colors"
                          >
                            {qr.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-end gap-xs bg-background rounded-2xl px-3 py-1.5 border border-outline-variant">
                    <button
                      onClick={() => setShowQuickReplies(!showQuickReplies)}
                      className="text-outline hover:text-brand-mid transition-colors py-1.5"
                      title="Quick Replies"
                    >
                      <span className="material-symbols-outlined">bolt</span>
                    </button>
                    <textarea
                      rows={1}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Ketik pesan..."
                      className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-[13.5px] resize-none py-2 min-w-0 max-h-32"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="bg-brand-accent text-white w-10 h-10 rounded-full flex items-center justify-center hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
                      aria-label="Kirim"
                    >
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-outline p-md chat-wallpaper">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl">chat</span>
              <p className="text-body-md mt-2">Pilih percakapan untuk memulai</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Column 3: Contact / Control Panel ─────────────────── */}
      <section
        className={`${panelVisibility} w-full xl:w-80 bg-surface border-l border-outline-variant flex-col min-h-0 flex-shrink-0`}
      >
        <div className="flex items-center gap-sm px-md h-16 border-b border-outline-variant flex-shrink-0">
          <button
            onClick={() => setMobileView('chat')}
            className="xl:hidden -ml-1 p-1.5 rounded-full hover:bg-surface-container"
            aria-label="Kembali ke chat"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h3 className="text-[15px] font-semibold">Info Kontak</h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-md space-y-md">
          {selectedConv ? (
            <>
              {/* Profile */}
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-20 h-20 rounded-full ${avatarColor(
                    selectedConv.id,
                  )} flex items-center justify-center text-white font-semibold text-[30px] mb-sm`}
                >
                  {(selectedConv.client_name || '?').charAt(0).toUpperCase()}
                </div>
                <p className="font-semibold text-[16px] text-on-surface">
                  {selectedConv.client_name || 'Pelanggan'}
                </p>
                <p className="text-[12px] text-outline font-mono-label break-all">
                  {selectedConv.id}
                </p>
                <span
                  className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    selectedConv.mode === 'ai'
                      ? 'bg-brand-soft text-brand-mid'
                      : 'bg-amber-soft text-amber'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {selectedConv.mode === 'ai' ? 'smart_toy' : 'support_agent'}
                  </span>
                  {selectedConv.mode === 'ai' ? 'Ditangani AI' : 'Ditangani manusia'}
                </span>
              </div>

              {/* Handoff control */}
              <button
                onClick={handleToggleMode}
                disabled={togglingMode}
                className={`w-full py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-xs transition-all active:scale-[0.98] disabled:opacity-60 ${
                  selectedConv.mode === 'ai'
                    ? 'bg-amber text-white hover:brightness-105'
                    : 'bg-brand text-white hover:opacity-90'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {selectedConv.mode === 'ai' ? 'support_agent' : 'smart_toy'}
                </span>
                {selectedConv.mode === 'ai' ? 'Ambil Alih Percakapan' : 'Kembalikan ke AI'}
              </button>

              {/* Project info */}
              {(projectType || estimatedValue) && (
                <div className="bg-background rounded-xl p-md border border-outline-variant">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-outline mb-sm">
                    Info Proyek
                  </p>
                  {projectType && (
                    <div className="flex items-center gap-xs mb-1">
                      <span className="material-symbols-outlined text-[16px] text-brand-mid">
                        home
                      </span>
                      <span className="text-[13px] text-on-surface-variant">{projectType}</span>
                    </div>
                  )}
                  {estimatedValue && (
                    <p className="text-[15px] font-bold text-brand-mid mt-1">{estimatedValue}</p>
                  )}
                </div>
              )}

              {/* AI confidence */}
              <div className="bg-background rounded-xl p-md border border-outline-variant">
                <div className="flex items-center justify-between mb-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-outline">
                    AI Confidence
                  </p>
                  <span className="text-brand-mid font-mono-label font-bold">
                    {aiConfidence !== null ? `${aiConfidence}%` : 'N/A'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full bg-brand-accent transition-all"
                    style={{ width: `${aiConfidence ?? 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-outline mt-1">Rata-rata semua balasan AI</p>
              </div>
            </>
          ) : (
            <p className="text-body-md text-outline text-center mt-lg">Pilih percakapan</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default ChatMonitoring
