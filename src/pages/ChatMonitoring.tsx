import React, { useState, useEffect, useRef } from 'react'
import {
  supabase,
  DBConversation,
  DBMessage,
  ConversationService,
  QuickReplyService,
  DBQuickReply,
} from '../services/supabaseClient'
import { n8nService } from '../services/n8nWebhookService'

const ChatMonitoring: React.FC = () => {
  const [conversations, setConversations] = useState<DBConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DBMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [filterSource, setFilterSource] = useState<'all' | 'whatsapp' | 'instagram'>('all')
  const [quickReplies, setQuickReplies] = useState<DBQuickReply[]>([])
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedConv = conversations.find((c) => c.id === selectedId) || null

  useEffect(() => {
    loadConversations()
    loadQuickReplies()
    setupRealtimeConversations()
  }, [])

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId)
      setupRealtimeMessages(selectedId)
      ConversationService.markRead(selectedId)
    }
  }, [selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    const data = await ConversationService.getAll()
    setConversations(data)
    if (data.length > 0 && !selectedId) setSelectedId(data[0].id)
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

  const setupRealtimeConversations = () => {
    const channel = supabase
      .channel('conv-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setConversations((prev) => [payload.new as DBConversation, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setConversations((prev) =>
            prev.map((c) => (c.id === payload.new.id ? (payload.new as DBConversation) : c))
          )
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }

  const setupRealtimeMessages = (convId: string) => {
    const channel = supabase
      .channel(`msg-${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DBMessage])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return

    const msg: Omit<DBMessage, 'id' | 'created_at'> = {
      conversation_id: selectedConv.id,
      content: messageInput,
      role: 'human',
      source: selectedConv.source,
      ai_confidence: null,
      needs_human_review: false,
      metadata: {},
    }

    await ConversationService.insertMessage(msg)
    await ConversationService.upsertConversation({
      id: selectedConv.id,
      last_message: messageInput,
      last_message_at: new Date().toISOString(),
    })

    // Kirim via n8n ke WA
    await n8nService.sendMessageToClient({
      conversationId: selectedConv.id,
      clientPhoneOrUsername: selectedConv.id,
      message: messageInput,
      source: selectedConv.source as 'whatsapp' | 'instagram',
      senderRole: 'human',
      humanOperator: 'Dashboard Operator',
    })

    setMessageInput('')
  }

  const handleToggleMode = async () => {
    if (!selectedConv) return
    const newMode = selectedConv.mode === 'ai' ? 'manual' : 'ai'
    await ConversationService.toggleMode(selectedConv.id, newMode)
    await n8nService.toggleConversationMode({ conversationId: selectedConv.id, newMode })
  }

  const filtered = conversations.filter((c) =>
    filterSource === 'all' ? true : c.source === filterSource
  )

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const formatTimeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (mins < 1) return 'baru'
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}j`
  }

  return (
    <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Column 1: Conversation List */}
      <section className="w-80 border-r border-outline-variant bg-surface-container-lowest flex flex-col flex-shrink-0">
        <div className="p-md border-b border-outline-variant">
          <div className="flex items-center justify-between mb-sm">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              Active Streams
            </span>
            <span className="font-mono-label text-mono-label bg-primary-container text-on-primary-container px-2 py-1 rounded">
              {filtered.filter((c) => c.status === 'active').length} Online
            </span>
          </div>
          <div className="flex gap-1">
            {(['all', 'whatsapp', 'instagram'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSource(s)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-label-caps font-bold uppercase transition-colors ${
                  filterSource === s
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {s === 'all' ? `All (${conversations.length})` : s === 'whatsapp' ? 'WA' : 'IG'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-md space-y-sm">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-surface-container rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-md text-center text-outline">
              <span className="material-symbols-outlined text-4xl">chat</span>
              <p className="text-body-md mt-2">Belum ada percakapan</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`p-md border-b border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors ${
                  selectedId === conv.id ? 'bg-surface-container border-l-4 border-l-primary' : ''
                } ${conv.unread_count > 0 ? 'border-l-4 border-l-error' : ''}`}
              >
                <div className="flex items-start gap-sm">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-fixed to-secondary-fixed flex items-center justify-center text-primary font-bold">
                      {conv.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white ${
                      conv.source === 'whatsapp' ? 'bg-green-500' : 'bg-pink-500'
                    }`}>
                      {conv.source === 'whatsapp' ? 'W' : 'I'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-on-background text-[13px] truncate">
                        {conv.client_name}
                      </span>
                      <span className={`text-label-caps text-[10px] ml-1 flex-shrink-0 ${
                        conv.unread_count > 0 ? 'text-error font-bold' : 'text-outline'
                      }`}>
                        {conv.unread_count > 0 ? 'Baru' : formatTimeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-body-md text-on-surface-variant truncate text-[12px]">
                      {conv.last_message || '—'}
                    </p>
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      conv.mode === 'ai'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}>
                      {conv.mode === 'ai' ? 'AI Handled' : 'Human Active'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Column 2: Chat Window */}
      <section className="flex-1 flex flex-col bg-white min-w-0">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="px-gutter h-16 border-b border-outline-variant flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-background text-[16px] leading-tight">
                    {selectedConv.client_name}
                  </h3>
                  <p className="text-label-caps text-[11px] text-outline">
                    {selectedConv.source === 'whatsapp' ? 'WhatsApp' : 'Instagram'} • {selectedConv.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className={`flex items-center gap-xs px-3 py-1.5 rounded-full border ${
                  selectedConv.mode === 'ai'
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    selectedConv.mode === 'ai' ? 'bg-emerald-500' : 'bg-orange-500'
                  }`} />
                  <span className={`text-label-caps uppercase font-bold ${
                    selectedConv.mode === 'ai' ? 'text-emerald-700' : 'text-orange-700'
                  }`}>
                    {selectedConv.mode === 'ai' ? 'AI Active' : 'Human Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-gutter overflow-y-auto flex flex-col gap-lg bg-background/30">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-outline">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-5xl">chat_bubble</span>
                    <p className="text-body-md mt-2">Belum ada pesan</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${
                      msg.role === 'client' ? 'items-start' : 'items-end self-end'
                    }`}
                  >
                    <div className={`px-md py-3 rounded-xl shadow-sm relative overflow-hidden ${
                      msg.role === 'client'
                        ? 'bg-white border border-outline-variant rounded-tl-none'
                        : msg.role === 'ai'
                        ? 'bg-gradient-to-br from-surface-container-low to-surface-container rounded-tr-none border border-primary/5'
                        : 'bg-primary text-on-primary rounded-tr-none'
                    }`}>
                      {msg.role !== 'client' && (
                        <div className="text-[10px] opacity-60 mb-1 uppercase font-bold">
                          {msg.role === 'ai' ? '🤖 AI Agent' : '👤 Human'}
                          {msg.ai_confidence ? ` • ${Math.round(msg.ai_confidence * 100)}%` : ''}
                        </div>
                      )}
                      <p className="text-body-md whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <span className="text-label-caps text-[10px] text-outline mt-1 mx-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-md border-t border-outline-variant bg-white flex-shrink-0">
              {/* Quick Replies */}
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
                        className="whitespace-nowrap px-3 py-1.5 border border-outline-variant rounded-full text-label-caps text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                      >
                        {qr.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-sm bg-surface-container-low rounded-xl px-md py-sm">
                <button
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="text-outline hover:text-primary transition-colors"
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
                  placeholder={
                    selectedConv.mode === 'ai'
                      ? 'AI sedang aktif — switch ke Manual untuk balas manual...'
                      : 'Ketik pesan...'
                  }
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-body-md resize-none py-1"
                  disabled={selectedConv.mode === 'ai'}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || selectedConv.mode === 'ai'}
                  className="bg-primary text-on-primary w-10 h-10 rounded-lg flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-outline">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl">chat</span>
              <p className="text-body-md mt-2">Pilih percakapan untuk memulai</p>
            </div>
          </div>
        )}
      </section>

      {/* Column 3: Control Panel */}
      <section className="w-80 bg-background border-l border-outline-variant p-gutter flex flex-col gap-md overflow-y-auto flex-shrink-0">
        {/* System Control */}
        <div className="glass-card border border-outline-variant rounded-xl p-md">
          <h4 className="font-label-caps text-label-caps text-outline uppercase mb-md">
            System Control
          </h4>
          <div className="flex items-center justify-between p-sm bg-surface rounded-lg mb-sm">
            <span className="text-body-md font-bold">Auto-Mode</span>
            <button
              onClick={handleToggleMode}
              className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${
                selectedConv?.mode === 'ai' ? 'bg-emerald-500' : 'bg-outline'
              }`}
            >
              <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${
                selectedConv?.mode === 'ai' ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
          <button
            onClick={handleToggleMode}
            disabled={!selectedConv}
            className="w-full py-3 bg-primary text-on-primary rounded-lg font-headline-sm text-[14px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
          >
            {selectedConv?.mode === 'ai' ? 'Take Over Conversation' : 'Return to AI'}
          </button>
          <p className="mt-xs text-[10px] text-outline text-center">
            AI akan pause saat Take Over aktif.
          </p>
        </div>

        {/* AI Confidence */}
        <div className="glass-card border border-outline-variant rounded-xl p-md">
          <div className="flex justify-between items-center mb-md">
            <h4 className="font-label-caps text-label-caps text-outline uppercase">AI Confidence</h4>
            <span className="text-emerald-500 font-mono-label font-bold">
              {selectedConv && messages.length > 0
                ? (() => {
                    const aiMsgs = messages.filter((m) => m.role === 'ai' && m.ai_confidence)
                    if (aiMsgs.length === 0) return 'N/A'
                    const avg = aiMsgs.reduce((s, m) => s + (m.ai_confidence || 0), 0) / aiMsgs.length
                    return `${Math.round(avg * 100)}%`
                  })()
                : 'N/A'}
            </span>
          </div>
          <div className="overflow-hidden h-2 mb-sm rounded bg-surface-container">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{
                width: (() => {
                  const aiMsgs = messages.filter((m) => m.role === 'ai' && m.ai_confidence)
                  if (aiMsgs.length === 0) return '0%'
                  const avg = aiMsgs.reduce((s, m) => s + (m.ai_confidence || 0), 0) / aiMsgs.length
                  return `${Math.round(avg * 100)}%`
                })(),
              }}
            />
          </div>
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-emerald-500">verified</span>
            <span className="text-body-md text-on-surface-variant">Avg dari semua pesan AI</span>
          </div>
        </div>

        {/* n8n Status */}
        <div className="glass-card border border-outline-variant rounded-xl p-md">
          <h4 className="font-label-caps text-label-caps text-outline uppercase mb-md">
            Integrations
          </h4>
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-xs">
              <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-black italic text-[10px]">
                n8n
              </div>
              <span className="text-body-md font-bold">n8n Webhook</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[11px] font-bold text-emerald-600">Active</span>
            </div>
          </div>
          <div className="p-xs bg-surface-container rounded font-mono-label text-[10px] text-outline truncate">
            n8n.srv1696073.hstgr.cloud
          </div>
          <div className="flex items-center justify-between mt-sm">
            <div className="flex items-center gap-xs">
              <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center font-black text-[10px]">
                SB
              </div>
              <span className="text-body-md font-bold">Supabase</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] font-bold text-emerald-600">Realtime</span>
            </div>
          </div>
        </div>

        {/* Client Profile */}
        <div className="glass-card border border-outline-variant rounded-xl p-md flex-1">
          <h4 className="font-label-caps text-label-caps text-outline uppercase mb-md">
            Client Profile
          </h4>
          {selectedConv ? (
            <div className="space-y-md">
              <div>
                <span className="text-label-caps text-[10px] text-outline uppercase block mb-1">
                  Nama
                </span>
                <p className="font-bold text-on-background">{selectedConv.client_name}</p>
              </div>
              <div>
                <span className="text-label-caps text-[10px] text-outline uppercase block mb-1">
                  Phone / ID
                </span>
                <p className="text-body-md font-mono-label">{selectedConv.id}</p>
              </div>
              <div>
                <span className="text-label-caps text-[10px] text-outline uppercase block mb-1">
                  Source
                </span>
                <p className="text-body-md capitalize">{selectedConv.source}</p>
              </div>
              {selectedConv.metadata && Object.keys(selectedConv.metadata).length > 0 && (
                <div>
                  <span className="text-label-caps text-[10px] text-outline uppercase block mb-1">
                    Project Info
                  </span>
                  {(selectedConv.metadata as Record<string, string>).buildingType && (
                    <div className="flex items-center gap-xs px-2 py-1 bg-surface-container rounded border border-outline-variant w-fit">
                      <span className="material-symbols-outlined text-[14px]">home</span>
                      <span className="text-body-md text-on-surface-variant">
                        {(selectedConv.metadata as Record<string, string>).buildingType}
                        {(selectedConv.metadata as Record<string, string>).tier
                          ? ` — ${(selectedConv.metadata as Record<string, string>).tier}`
                          : ''}
                      </span>
                    </div>
                  )}
                  {(selectedConv.metadata as Record<string, string>).estimatedValue && (
                    <p className="text-body-md font-bold text-secondary mt-sm">
                      {(selectedConv.metadata as Record<string, string>).estimatedValue}
                    </p>
                  )}
                </div>
              )}
              <div>
                <span className="text-label-caps text-[10px] text-outline uppercase block mb-1">
                  Last Active
                </span>
                <p className="text-body-md">
                  {new Date(selectedConv.last_message_at).toLocaleString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-body-md text-outline">Pilih percakapan</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default ChatMonitoring
