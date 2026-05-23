import React, { useState, useEffect, useRef } from 'react'
import { Conversation, Message, ConversationMode } from '../types/chat'
import { ChatService, mockConversations, quickReplies } from '../services/chatService'

const ChatMonitoring: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(mockConversations[0])
  const [messageInput, setMessageInput] = useState('')
  const [autoMode, setAutoMode] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConv?.messages])

  useEffect(() => {
    if (selectedConv) setAutoMode(selectedConv.mode === 'ai')
  }, [selectedConv?.id])

  const onlineCount = conversations.filter((c) => c.status === 'active').length

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConv.id,
      content: messageInput,
      role: autoMode ? 'ai' : 'human',
      timestamp: new Date(),
      source: selectedConv.source,
      aiConfidence: autoMode ? 0.95 : undefined,
    }

    const updatedConv = {
      ...selectedConv,
      messages: [...selectedConv.messages, newMessage],
      lastMessage: messageInput,
      lastMessageTime: new Date(),
    }

    setSelectedConv(updatedConv)
    setConversations(conversations.map((c) => (c.id === selectedConv.id ? updatedConv : c)))
    await ChatService.sendMessage(selectedConv.id, messageInput, autoMode, selectedConv)
    setMessageInput('')
  }

  const handleTakeOver = async () => {
    if (!selectedConv) return
    const newMode: ConversationMode = autoMode ? 'manual' : 'ai'
    setAutoMode(!autoMode)

    const updated = { ...selectedConv, mode: newMode }
    setSelectedConv(updated)
    setConversations(conversations.map((c) => (c.id === selectedConv.id ? updated : c)))
    await ChatService.toggleMode(selectedConv.id, newMode)
  }

  const insertQuickReply = (content: string) => setMessageInput(content)

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'whatsapp':
        return { letter: 'W', color: 'bg-green-500' }
      case 'instagram':
        return { letter: 'I', color: 'bg-pink-500' }
      default:
        return { letter: '?', color: 'bg-gray-500' }
    }
  }

  const getStatusLabel = (conv: Conversation) => {
    if (conv.mode === 'manual')
      return {
        label: 'Human Active',
        className: 'bg-error-container text-on-error-container',
      }
    const needsHuman = conv.messages.some((m) => m.metadata?.needsHumanReview)
    if (needsHuman)
      return {
        label: 'Human Needed',
        className: 'bg-error-container text-on-error-container',
      }
    if (conv.status === 'idle')
      return {
        label: 'Resolved',
        className: 'border border-outline text-outline',
      }
    return {
      label: 'AI Handled',
      className: 'bg-secondary-container text-on-secondary-container',
    }
  }

  const formatTimeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Column 1: Chat List */}
      <section className="w-80 border-r border-outline-variant bg-surface-container-lowest flex flex-col">
        <div className="p-md border-b border-outline-variant">
          <div className="flex items-center justify-between mb-sm">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              Active Streams
            </span>
            <span className="font-mono-label text-mono-label bg-primary-container text-on-primary-container px-2 py-1 rounded">
              {onlineCount} Online
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const badge = getSourceBadge(conv.source)
            const status = getStatusLabel(conv)
            const isActive = selectedConv?.id === conv.id
            const needsHuman = conv.messages.some((m) => m.metadata?.needsHumanReview)
            const isResolved = conv.status === 'idle' && conv.mode === 'ai'

            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`p-md border-b border-outline-variant transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-surface-container'
                    : 'hover:bg-surface-container-low'
                } ${needsHuman ? 'border-l-4 border-l-error' : ''}`}
              >
                <div className={`flex items-start gap-sm ${isResolved ? 'opacity-60' : ''}`}>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-fixed to-secondary-fixed flex items-center justify-center text-primary font-bold">
                      {conv.clientName.charAt(0).toUpperCase()}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 ${badge.color} w-4 h-4 rounded-full border-2 border-white flex items-center justify-center`}
                    >
                      <span className="text-[10px] text-white font-bold">{badge.letter}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-headline-sm text-[14px] font-bold text-on-background truncate">
                        {conv.clientName}
                      </span>
                      <span
                        className={`font-label-caps text-[10px] ${
                          needsHuman ? 'text-error font-bold' : 'text-outline'
                        }`}
                      >
                        {needsHuman ? 'Priority' : formatTimeAgo(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p
                      className={`text-body-md text-on-surface-variant line-clamp-1 ${
                        needsHuman ? 'font-bold' : ''
                      }`}
                    >
                      {conv.lastMessage}
                    </p>
                    <div className="mt-2 flex items-center gap-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Column 2: Chat Window */}
      <section className="flex-1 flex flex-col bg-white min-w-0">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="px-gutter h-16 border-b border-outline-variant flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-[16px] font-bold leading-tight">
                    {selectedConv.clientName}
                  </h3>
                  <p className="text-label-caps text-[11px] text-outline">
                    {selectedConv.source === 'whatsapp' ? 'WhatsApp' : 'Instagram'} • ID:{' '}
                    {selectedConv.id.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-md">
                <div
                  className={`flex items-center gap-xs px-3 py-1.5 rounded-full border ${
                    autoMode
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      autoMode ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}
                  ></span>
                  <span
                    className={`text-label-caps uppercase font-bold ${
                      autoMode ? 'text-emerald-700' : 'text-orange-700'
                    }`}
                  >
                    {autoMode ? 'AI Active' : 'Human Active'}
                  </span>
                </div>
                <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <span className="material-symbols-outlined text-outline">more_vert</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-gutter overflow-y-auto flex flex-col gap-lg bg-background/30">
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-surface-container-low rounded-full text-label-caps text-outline uppercase">
                  Today, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {selectedConv.messages.map((msg) => {
                if (msg.role === 'client') {
                  return (
                    <div key={msg.id} className="flex flex-col items-start max-w-[80%]">
                      <div className="bg-white border border-outline-variant p-md rounded-xl rounded-tl-none shadow-sm">
                        <p className="text-body-md text-on-background whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                      <span className="mt-1 text-label-caps text-[10px] text-outline ml-1">
                        {msg.timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • Delivered
                      </span>
                    </div>
                  )
                }
                if (msg.role === 'ai') {
                  return (
                    <div key={msg.id} className="flex flex-col items-end max-w-[80%] self-end">
                      <div className="message-gradient-ai border border-primary/5 p-md rounded-xl rounded-tr-none shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-20">
                          <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                        </div>
                        <p className="text-body-md text-on-background whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-xs mr-1">
                        <span className="material-symbols-outlined text-[14px] text-secondary">
                          bolt
                        </span>
                        <span className="text-label-caps text-[10px] text-secondary font-bold uppercase">
                          AI Response
                          {msg.aiConfidence
                            ? ` • Confidence ${Math.round(msg.aiConfidence * 100)}%`
                            : ''}
                        </span>
                      </div>
                    </div>
                  )
                }
                // human
                return (
                  <div key={msg.id} className="flex flex-col items-end max-w-[80%] self-end">
                    <div className="bg-primary text-on-primary p-md rounded-xl rounded-tr-none shadow-sm">
                      <p className="text-body-md whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-xs mr-1">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                        person
                      </span>
                      <span className="text-label-caps text-[10px] text-on-surface-variant font-bold uppercase">
                        Human Operator •{' '}
                        {msg.timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-md border-t border-outline-variant bg-white flex-shrink-0">
              <div className="flex gap-sm mb-sm overflow-x-auto pb-2 no-scrollbar">
                {quickReplies.slice(0, 4).map((qr) => (
                  <button
                    key={qr.id}
                    onClick={() => insertQuickReply(qr.content)}
                    className="whitespace-nowrap px-3 py-1.5 border border-outline-variant rounded-full text-label-caps text-on-surface-variant hover:border-primary transition-colors"
                  >
                    {qr.title}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-sm bg-surface-container-low rounded-xl px-md py-sm">
                <button className="text-outline hover:text-primary">
                  <span className="material-symbols-outlined">attach_file</span>
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
                    autoMode
                      ? 'AI is responding... type to override'
                      : 'Type a message or select a quick reply...'
                  }
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-body-md resize-none py-1"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
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
              <p className="mt-2 text-body-md">Select a conversation to start</p>
            </div>
          </div>
        )}
      </section>

      {/* Column 3: Control Panel */}
      <section className="w-[320px] bg-background border-l border-outline-variant p-gutter flex flex-col gap-md overflow-y-auto flex-shrink-0">
        {/* System Mode */}
        <div className="glass-card border border-outline-variant rounded-xl p-md">
          <h4 className="font-label-caps text-label-caps text-outline uppercase mb-md">
            System Control
          </h4>
          <div className="flex items-center justify-between p-sm bg-surface rounded-lg mb-sm">
            <span className="text-body-md font-bold">Auto-Mode</span>
            <button
              onClick={handleTakeOver}
              className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${
                autoMode ? 'bg-emerald-500' : 'bg-outline'
              }`}
            >
              <div
                className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${
                  autoMode ? 'right-1' : 'left-1'
                }`}
              ></div>
            </button>
          </div>
          <button
            onClick={handleTakeOver}
            className="w-full py-3 bg-primary text-on-primary rounded-lg font-headline-sm text-[14px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
          >
            {autoMode ? 'Take Over Conversation' : 'Return to AI'}
          </button>
          <p className="mt-xs text-[10px] text-outline text-center">
            AI will pause immediately if Take Over is engaged.
          </p>
        </div>

        {/* AI Confidence */}
        <div className="glass-card border border-outline-variant rounded-xl p-md">
          <div className="flex justify-between items-center mb-md">
            <h4 className="font-label-caps text-label-caps text-outline uppercase">
              AI Confidence
            </h4>
            <span className="text-emerald-500 font-mono-label font-bold">85.4%</span>
          </div>
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-surface-container">
              <div
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                style={{ width: '85%' }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-emerald-500">verified</span>
            <span className="text-body-md text-on-surface-variant">High Precision Threshold</span>
          </div>
        </div>

        {/* Webhook */}
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
          <div className="p-xs bg-surface-container rounded font-mono-label text-[11px] text-outline truncate">
            https://n8n.workflow.ai/v1/hooks/...
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
                  Lead Name
                </span>
                <p className="text-body-md font-bold">{selectedConv.clientName}</p>
              </div>
              <div>
                <span className="text-label-caps text-[10px] text-outline uppercase block mb-1">
                  Contact
                </span>
                <p className="text-body-md">
                  {selectedConv.metadata.phoneNumber || selectedConv.metadata.igUsername || '-'}
                </p>
              </div>
              <div>
                <span className="text-label-caps text-[10px] text-outline uppercase block mb-1">
                  Project
                </span>
                <div className="flex items-center gap-xs px-2 py-1 bg-surface-container rounded border border-outline-variant w-fit">
                  <span className="material-symbols-outlined text-[14px]">account_tree</span>
                  <span className="text-body-md text-on-surface-variant">
                    {selectedConv.metadata.projectType || 'No project'}
                  </span>
                </div>
              </div>
              {selectedConv.metadata.estimatedValue && (
                <div>
                  <span className="text-label-caps text-[10px] text-outline uppercase block mb-1">
                    Estimated Value
                  </span>
                  <p className="text-body-md font-bold text-secondary">
                    {selectedConv.metadata.estimatedValue}
                  </p>
                </div>
              )}
              <div>
                <span className="text-label-caps text-[10px] text-outline uppercase block mb-1">
                  Last Sync
                </span>
                <p className="text-body-md">
                  {selectedConv.lastMessageTime.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-body-md text-outline">No client selected</p>
          )}

          <div className="mt-xl pt-md border-t border-outline-variant">
            <button className="w-full flex items-center justify-center gap-sm py-2 border border-outline-variant rounded-lg text-body-md font-bold hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              View in CRM
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ChatMonitoring
