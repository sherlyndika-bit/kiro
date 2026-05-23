import React, { useState, useEffect, useRef } from 'react'
import { Conversation, Message, ConversationMode } from '../types/chat'
import { ChatService, mockConversations, quickReplies } from '../services/chatService'
import TakeOverNotification from '../components/TakeOverNotification'
import ModeToggleModal from '../components/ModeToggleModal'

interface TakeOverAlert {
  id: string
  conversationId: string
  clientName: string
  reason: string
  aiConfidence: number
  timestamp: Date
  priority: 'low' | 'medium' | 'high'
}

const ChatMonitoring: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(mockConversations[0])
  const [messageInput, setMessageInput] = useState('')
  const [filterSource, setFilterSource] = useState<'all' | 'whatsapp' | 'instagram'>('all')
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [alerts, setAlerts] = useState<TakeOverAlert[]>([])
  const [showModeModal, setShowModeModal] = useState(false)
  const [pendingModeChange, setPendingModeChange] = useState<{ convId: string; mode: ConversationMode } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConv?.messages])

  // Polling untuk update real-time (nanti bisa diganti WebSocket)
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await ChatService.getConversations()
      setConversations(updated)
      
      // Check for AI confidence issues and generate alerts
      checkForAlerts(updated)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Check messages that need human intervention
  const checkForAlerts = (convs: Conversation[]) => {
    const newAlerts: TakeOverAlert[] = []

    convs.forEach((conv) => {
      if (conv.mode === 'manual') return // Skip manual conversations

      conv.messages.forEach((msg) => {
        if (msg.role === 'ai' && msg.aiConfidence && msg.aiConfidence < 0.7) {
          const existingAlert = alerts.find((a) => a.conversationId === conv.id)
          if (!existingAlert) {
            newAlerts.push({
              id: `alert-${conv.id}-${Date.now()}`,
              conversationId: conv.id,
              clientName: conv.clientName,
              reason: 'AI confidence is low. Complex question detected.',
              aiConfidence: msg.aiConfidence,
              timestamp: new Date(),
              priority: msg.aiConfidence < 0.5 ? 'high' : 'medium',
            })
          }
        }

        if (msg.metadata?.needsHumanReview) {
          const existingAlert = alerts.find((a) => a.conversationId === conv.id)
          if (!existingAlert) {
            newAlerts.push({
              id: `alert-${conv.id}-${Date.now()}`,
              conversationId: conv.id,
              clientName: conv.clientName,
              reason: 'Message flagged for human review',
              aiConfidence: msg.aiConfidence || 0.5,
              timestamp: new Date(),
              priority: 'high',
            })
          }
        }
      })
    })

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...prev, ...newAlerts])
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (filterSource === 'all') return true
    return conv.source === filterSource
  })

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConv.id,
      content: messageInput,
      role: selectedConv.mode === 'ai' ? 'ai' : 'human',
      timestamp: new Date(),
      source: selectedConv.source,
    }

    // Update local state
    const updatedConv = {
      ...selectedConv,
      messages: [...selectedConv.messages, newMessage],
      lastMessage: messageInput,
      lastMessageTime: new Date(),
    }

    setSelectedConv(updatedConv)
    setConversations(
      conversations.map((c) => (c.id === selectedConv.id ? updatedConv : c))
    )

    // Send via n8n
    await ChatService.sendMessage(
      selectedConv.id,
      messageInput,
      selectedConv.mode === 'ai',
      selectedConv
    )
    setMessageInput('')
  }

  const handleToggleMode = (convId: string, newMode: ConversationMode) => {
    setPendingModeChange({ convId, mode: newMode })
    setShowModeModal(true)
  }

  const confirmModeToggle = async () => {
    if (!pendingModeChange) return

    const { convId, mode: newMode } = pendingModeChange
    const conv = conversations.find((c) => c.id === convId)
    if (!conv) return

    const updated = {
      ...conv,
      mode: newMode,
      humanOperator: newMode === 'manual' ? 'You' : undefined,
    }

    setConversations(conversations.map((c) => (c.id === convId ? updated : c)))
    if (selectedConv?.id === convId) setSelectedConv(updated)

    await ChatService.toggleMode(convId, newMode)
    
    // Remove alert if exists
    setAlerts(alerts.filter((a) => a.conversationId !== convId))
    
    setShowModeModal(false)
    setPendingModeChange(null)
  }

  const handleTakeOverFromAlert = (conversationId: string) => {
    const conv = conversations.find((c) => c.id === conversationId)
    if (!conv) return

    // Switch to conversation
    setSelectedConv(conv)

    // Trigger mode change
    handleToggleMode(conversationId, 'manual')
  }

  const handleDismissAlert = (alertId: string) => {
    setAlerts(alerts.filter((a) => a.id !== alertId))
  }

  const insertQuickReply = (content: string) => {
    setMessageInput(content)
    setShowQuickReplies(false)
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp':
        return '💬'
      case 'instagram':
        return '📸'
      default:
        return '🌐'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <>
      {/* Take Over Notifications */}
      <TakeOverNotification
        alerts={alerts}
        onTakeOver={handleTakeOverFromAlert}
        onDismiss={handleDismissAlert}
      />

      {/* Mode Toggle Confirmation Modal */}
      {showModeModal && selectedConv && (
        <ModeToggleModal
          isOpen={showModeModal}
          currentMode={selectedConv.mode}
          clientName={selectedConv.clientName}
          onConfirm={confirmModeToggle}
          onCancel={() => {
            setShowModeModal(false)
            setPendingModeChange(null)
          }}
        />
      )}

      <div className="flex h-screen bg-gray-50">
      {/* Conversations List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chat Monitoring</h2>
          
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterSource('all')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                filterSource === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setFilterSource('whatsapp')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                filterSource === 'whatsapp'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💬 WA
            </button>
            <button
              onClick={() => setFilterSource('instagram')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                filterSource === 'instagram'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📸 IG
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConv?.id === conv.id ? 'bg-blue-50 border-l-4 border-primary' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {conv.clientName.charAt(0)}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(conv.status)} rounded-full border-2 border-white`}></div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">
                        {conv.clientName}
                      </span>
                      <span className="text-lg">{getSourceIcon(conv.source)}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.floor((Date.now() - conv.lastMessageTime.getTime()) / 60000)}m
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-2">{conv.lastMessage}</p>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        conv.mode === 'ai'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {conv.mode === 'ai' ? '🤖 AI Mode' : '👤 Manual'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedConv.clientName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedConv.clientName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{selectedConv.metadata.phoneNumber || selectedConv.metadata.igUsername}</span>
                    <span>•</span>
                    <span>{selectedConv.metadata.projectType || 'No project'}</span>
                  </div>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Mode:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleMode(selectedConv.id, 'ai')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedConv.mode === 'ai'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🤖 AI
                  </button>
                  <button
                    onClick={() => handleToggleMode(selectedConv.id, 'manual')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedConv.mode === 'manual'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👤 Manual
                  </button>
                </div>
              </div>
            </div>

            {/* Alert Banner */}
            {selectedConv.mode === 'manual' && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  ⚠️ <strong>Manual Mode Active</strong> - AI responses disabled. You're now handling this conversation.
                </p>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {selectedConv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.role === 'client' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-lg ${
                    msg.role === 'client'
                      ? 'bg-white border border-gray-200'
                      : msg.role === 'ai'
                      ? 'bg-blue-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {msg.role !== 'client' && (
                    <div className="text-xs opacity-75 mb-1">
                      {msg.role === 'ai' ? '🤖 AI Agent' : '👤 Human'}
                      {msg.aiConfidence && ` (${Math.round(msg.aiConfidence * 100)}% confident)`}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="text-xs opacity-75 mt-1">
                    {msg.timestamp.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {msg.metadata?.needsHumanReview && (
                    <div className="mt-2 pt-2 border-t border-red-300">
                      <span className="text-xs font-semibold">⚠️ Needs Human Review</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            {/* Quick Replies */}
            {showQuickReplies && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Quick Replies</span>
                  <button
                    onClick={() => setShowQuickReplies(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickReplies.map((qr) => (
                    <button
                      key={qr.id}
                      onClick={() => insertQuickReply(qr.content)}
                      className="text-left p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-xs font-semibold text-gray-900 mb-1">{qr.title}</div>
                      <div className="text-xs text-gray-600 truncate">{qr.content}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Quick Replies"
              >
                ⚡
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  selectedConv.mode === 'ai'
                    ? 'AI is responding automatically...'
                    : 'Type your message...'
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                disabled={selectedConv.mode === 'ai'}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || selectedConv.mode === 'ai'}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              {selectedConv.mode === 'ai'
                ? '🤖 AI is handling this conversation. Switch to Manual mode to take over.'
                : '👤 You are in control. Messages will be sent manually.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg">Select a conversation to start</p>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default ChatMonitoring
