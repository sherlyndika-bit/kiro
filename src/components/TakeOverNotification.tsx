import React, { useEffect, useState } from 'react'

interface TakeOverAlert {
  id: string
  conversationId: string
  clientName: string
  reason: string
  aiConfidence: number
  timestamp: Date
  priority: 'low' | 'medium' | 'high'
}

interface Props {
  alerts: TakeOverAlert[]
  onTakeOver: (conversationId: string) => void
  onDismiss: (alertId: string) => void
}

const TakeOverNotification: React.FC<Props> = ({ alerts, onTakeOver, onDismiss }) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    if (alerts.length > 0) {
      setHasUnread(true)
      // Play notification sound (optional)
      // new Audio('/notification.mp3').play()
    }
  }, [alerts.length])

  if (alerts.length === 0) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-orange-500'
      default:
        return 'bg-yellow-500'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🚨'
      case 'medium':
        return '⚠️'
      default:
        return '⚡'
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      {isMinimized ? (
        <button
          onClick={() => {
            setIsMinimized(false)
            setHasUnread(false)
          }}
          className="relative bg-red-500 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-all animate-bounce"
        >
          <span className="text-2xl">🚨</span>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-white text-red-500 text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {alerts.length}
            </span>
          )}
        </button>
      ) : (
        <div className="bg-white rounded-xl shadow-2xl border border-red-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              <div>
                <h3 className="font-bold">AI Needs Help!</h3>
                <p className="text-xs opacity-90">{alerts.length} conversation(s) need review</p>
              </div>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
            >
              <span className="text-xl">−</span>
            </button>
          </div>

          {/* Alerts List */}
          <div className="max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{getPriorityIcon(alert.priority)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-900">{alert.clientName}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${getPriorityColor(alert.priority)}`}>
                        {alert.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.reason}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>AI Confidence: {Math.round(alert.aiConfidence * 100)}%</span>
                      <span>•</span>
                      <span>{Math.floor((Date.now() - alert.timestamp.getTime()) / 60000)}m ago</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onTakeOver(alert.conversationId)}
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                  >
                    👤 Take Over
                  </button>
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TakeOverNotification
