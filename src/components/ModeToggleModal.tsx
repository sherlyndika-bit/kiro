import React from 'react'
import { ConversationMode } from '../types/chat'

interface Props {
  isOpen: boolean
  currentMode: ConversationMode
  clientName: string
  onConfirm: (mode: ConversationMode) => void
  onCancel: () => void
}

const ModeToggleModal: React.FC<Props> = ({
  isOpen,
  currentMode,
  clientName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  const targetMode = currentMode === 'ai' ? 'manual' : 'ai'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
            targetMode === 'manual' 
              ? 'bg-orange-100' 
              : 'bg-blue-100'
          }`}>
            {targetMode === 'manual' ? '👤' : '🤖'}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Switch to {targetMode === 'manual' ? 'Manual' : 'AI'} Mode?
        </h3>

        {/* Description */}
        <div className="text-center text-gray-600 mb-6">
          {targetMode === 'manual' ? (
            <div>
              <p className="mb-3">
                You are about to <strong>take over</strong> the conversation with{' '}
                <strong>{clientName}</strong>.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                <p className="text-orange-800">
                  ⚠️ AI will stop responding. You'll need to handle all messages manually until
                  you switch back.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-3">
                You are about to <strong>return control</strong> to AI for{' '}
                <strong>{clientName}</strong>.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800">
                  🤖 AI will resume automatic responses based on training and context.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(targetMode)}
            className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors font-semibold ${
              targetMode === 'manual'
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {targetMode === 'manual' ? '👤 Take Over' : '🤖 Return to AI'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModeToggleModal
