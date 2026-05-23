import React, { useState, useEffect, useRef } from 'react'
import { ChatService, mockConversations } from '../services/chatService'
import { Conversation, Message } from '../types/chat'

interface EstimateResult {
  tenagaKerja: number
  material: number
  furnitur: number
  total: number
  breakdown: Array<{ name: string; cost: number }>
}

const Estimator: React.FC = () => {
  const [projectType, setProjectType] = useState('Apartemen Studio')
  const [area, setArea] = useState('45')
  const [quality, setQuality] = useState('Premium')
  const [estimate, setEstimate] = useState<EstimateResult | null>(null)
  const [isDraft, setIsDraft] = useState(false)
  
  // Chat integration
  const [activeConversations, setActiveConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [isManualMode, setIsManualMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConv?.messages])

  // Load active conversations
  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadConversations = async () => {
    const conversations = await ChatService.getConversations()
    const activeOnes = conversations.filter((c) => c.status === 'active').slice(0, 3)
    setActiveConversations(activeOnes)
    
    if (!selectedConv && activeOnes.length > 0) {
      setSelectedConv(activeOnes[0])
      setIsManualMode(activeOnes[0].mode === 'manual')
    }
  }

  const handleToggleMode = async () => {
    if (!selectedConv) return
    
    const newMode = isManualMode ? 'ai' : 'manual'
    setIsManualMode(!isManualMode)
    
    const updated = { ...selectedConv, mode: newMode }
    setSelectedConv(updated)
    setActiveConversations(
      activeConversations.map((c) => (c.id === selectedConv.id ? updated : c))
    )
    
    await ChatService.toggleMode(selectedConv.id, newMode)
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConv || !isManualMode) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConv.id,
      content: messageInput,
      role: 'human',
      timestamp: new Date(),
      source: selectedConv.source,
    }

    const updatedConv = {
      ...selectedConv,
      messages: [...selectedConv.messages, newMessage],
      lastMessage: messageInput,
      lastMessageTime: new Date(),
    }

    setSelectedConv(updatedConv)
    setActiveConversations(
      activeConversations.map((c) => (c.id === selectedConv.id ? updatedConv : c))
    )

    await ChatService.sendMessage(selectedConv.id, messageInput, false, selectedConv)
    setMessageInput('')
  }

  const handleShareEstimate = () => {
    if (!estimate || !selectedConv) return
    
    const estimateMessage = `Estimasi Biaya untuk ${projectType} (${area}m²) - Kualitas ${quality}:\n\n` +
      `💰 Total: ${formatShortCurrency(estimate.total)}\n\n` +
      `Breakdown:\n` +
      `• Tenaga Kerja: ${formatShortCurrency(estimate.tenagaKerja)}\n` +
      `• Material: ${formatShortCurrency(estimate.material)}\n` +
      `• Furnitur: ${formatShortCurrency(estimate.furnitur)}\n\n` +
      `Ini adalah estimasi kasar. Untuk detail lengkap, kami akan kirimkan proposal resmi.`
    
    setMessageInput(estimateMessage)
  }

  const calculateEstimate = () => {
    const areaNum = parseFloat(area) || 0
    
    // Harga per sqm berdasarkan kualitas
    const pricePerSqm = quality === 'Premium' ? 5000000 : quality === 'Standard' ? 3500000 : 2500000
    
    // Kalkulasi
    const material = Math.round(areaNum * pricePerSqm * 0.48) // 48% material
    const tenagaKerja = Math.round(areaNum * pricePerSqm * 0.18) // 18% tenaga kerja
    const furnitur = Math.round(areaNum * pricePerSqm * 0.34) // 34% furnitur
    const total = material + tenagaKerja + furnitur

    // Breakdown detail
    const breakdown = [
      { name: 'Persiapan & Pembongkaran', cost: Math.round(total * 0.06) },
      { name: 'Pekerjaan Dinding & Lantai', cost: Math.round(total * 0.18) },
      { name: 'Instalasi Listrik & Pipa', cost: Math.round(total * 0.10) },
    ]

    setEstimate({ tenagaKerja, material, furnitur, total, breakdown })
    setIsDraft(true)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const formatShortCurrency = (num: number) => {
    if (num >= 1000000) {
      return `Rp ${Math.round(num / 1000000)}M`
    }
    return formatCurrency(num)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Control & Estimator</h1>
        <p className="text-gray-600">Modular AI tools for rapid project assessment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Estimator Form */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🧮</span>
            <h2 className="text-xl font-bold text-gray-900">Cost Estimator</h2>
          </div>

          <div className="space-y-4">
            {/* Project Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Proyek
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="input-field"
              >
                <option>Apartemen Studio</option>
                <option>Rumah 2 Lantai</option>
                <option>Kantor</option>
                <option>Cafe & Restoran</option>
                <option>Retail Store</option>
              </select>
            </div>

            {/* Area and Quality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Luas Area (sqm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="input-field pr-12"
                    placeholder="45"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    m²
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kualitas Material
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="input-field"
                >
                  <option>Premium</option>
                  <option>Standard</option>
                  <option>Economy</option>
                </select>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateEstimate}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              <span>✨</span>
              <span>Hitung Estimasi AI</span>
            </button>
          </div>
        </div>

        {/* AI Consultant Chat */}
        <div className="card relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <h2 className="text-xl font-bold text-gray-900">Kendali Konsultan AI</h2>
            </div>
            <div className={`w-3 h-3 rounded-full ${selectedConv?.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          </div>

          {/* Client Tabs */}
          {activeConversations.length > 0 ? (
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {activeConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConv(conv)
                    setIsManualMode(conv.mode === 'manual')
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedConv?.id === conv.id
                      ? conv.source === 'whatsapp'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-pink-100 text-pink-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {conv.source === 'whatsapp' ? '💬' : '📸'} {conv.clientName}
                  {conv.mode === 'manual' && ' 👤'}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm mb-4">
              No active conversations
            </div>
          )}

          {/* Chat Messages */}
          {selectedConv ? (
            <>
              <div className="space-y-3 mb-4 min-h-[280px] max-h-[320px] overflow-y-auto bg-gray-50 rounded-lg p-3">
                {selectedConv.messages.length > 0 ? (
                  selectedConv.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-lg p-3 ${
                        msg.role === 'client'
                          ? 'bg-blue-50 ml-0'
                          : msg.role === 'ai'
                          ? 'bg-white border border-gray-200'
                          : 'bg-orange-50 ml-8'
                      }`}
                    >
                      <div className="text-xs mb-1 font-medium">
                        {msg.role === 'client' ? (
                          <span className="text-blue-600">
                            {msg.timestamp.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            - CLIENT ({msg.source.toUpperCase()})
                          </span>
                        ) : msg.role === 'ai' ? (
                          <span className="text-gray-500">
                            {msg.timestamp.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            - AI ENGINE
                            {msg.aiConfidence && ` (${Math.round(msg.aiConfidence * 100)}%)`}
                          </span>
                        ) : (
                          <span className="text-orange-600">
                            {msg.timestamp.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            - YOU (Manual)
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No messages yet
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Mode Toggle & Actions */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {isManualMode ? '👤 Manual Mode' : '🤖 AI Mode'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isManualMode}
                        onChange={handleToggleMode}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                  
                  {estimate && (
                    <button
                      onClick={handleShareEstimate}
                      disabled={!isManualMode}
                      className="text-xs px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      📊 Share Estimate
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={
                      isManualMode ? 'Ketik balasan manual...' : 'AI is responding automatically...'
                    }
                    disabled={!isManualMode}
                    className="flex-1 input-field disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!isManualMode || !messageInput.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➤
                  </button>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {isManualMode
                    ? '👤 You are controlling this conversation'
                    : '🤖 AI is handling responses automatically'}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">Select a conversation to monitor</p>
            </div>
          )}
        </div>
      </div>

      {/* Estimate Result */}
      {estimate && (
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Estimasi Biaya</h2>
              {selectedConv && (
                <p className="text-sm text-gray-600 mt-1">
                  untuk {selectedConv.clientName} - {projectType} {area}m²
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isDraft && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  DRAFT AI
                </span>
              )}
              {estimate && selectedConv && (
                <button
                  onClick={handleShareEstimate}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
                >
                  📤 Share to Chat
                </button>
              )}
            </div>
          </div>

          {/* Cost Breakdown Tabs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border-b-2 border-gray-300">
              <div className="text-sm text-gray-600 mb-1">Tenaga Kerja</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(estimate.tenagaKerja)}
              </div>
            </div>
            <div className="text-center p-4 border-b-4 border-primary bg-blue-50">
              <div className="text-sm text-gray-600 mb-1">Material</div>
              <div className="text-2xl font-bold text-primary">
                {formatShortCurrency(estimate.material)}
              </div>
            </div>
            <div className="text-center p-4 border-b-2 border-gray-300">
              <div className="text-sm text-gray-600 mb-1">Furnitur</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(estimate.furnitur)}
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-3 mb-6">
            {estimate.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(item.cost)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
            <span className="text-lg font-bold text-gray-900">Total Estimasi Kasar</span>
            <span className="text-3xl font-bold text-primary">
              {formatShortCurrency(estimate.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Estimator
