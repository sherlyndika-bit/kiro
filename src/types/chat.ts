export type MessageSource = 'whatsapp' | 'instagram' | 'web'
export type MessageRole = 'client' | 'ai' | 'human'
export type ClientStatus = 'active' | 'idle' | 'archived'
export type ConversationMode = 'ai' | 'manual'

export interface Message {
  id: string
  conversationId: string
  content: string
  role: MessageRole
  timestamp: Date
  source: MessageSource
  aiConfidence?: number
  metadata?: {
    phoneNumber?: string
    igUsername?: string
    needsHumanReview?: boolean
  }
}

export interface Conversation {
  id: string
  clientName: string
  clientAvatar?: string
  source: MessageSource
  status: ClientStatus
  mode: ConversationMode
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  metadata: {
    phoneNumber?: string
    igUsername?: string
    projectType?: string
    estimatedValue?: string
  }
  messages: Message[]
  aiTookOver?: boolean
  humanOperator?: string
}

export interface QuickReply {
  id: string
  title: string
  content: string
  category: 'greeting' | 'pricing' | 'timeline' | 'closing'
}
