/**
 * n8n Webhook Integration Service
 * 
 * Setup di n8n:
 * 1. Webhook node untuk receive dari dashboard (POST /webhook/dashboard-message)
 * 2. Webhook node untuk send ke dashboard (POST /webhook/incoming-message) 
 * 3. Webhook node untuk mode toggle (POST /webhook/toggle-mode)
 * 4. Webhook node untuk get conversations (GET /webhook/get-conversations)
 */

import { Conversation, Message, ConversationMode } from '../types/chat'

interface WebhookConfig {
  baseUrl: string
  endpoints: {
    sendMessage: string
    incomingMessage: string
    toggleMode: string
    getConversations: string
    getMessages: string
  }
}

class N8NWebhookService {
  private config: WebhookConfig

  constructor() {
    this.config = {
      baseUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook',
      endpoints: {
        sendMessage: '/dashboard-message',
        incomingMessage: '/incoming-message',
        toggleMode: '/toggle-mode',
        getConversations: '/get-conversations',
        getMessages: '/get-messages',
      },
    }
  }

  /**
   * Send message dari dashboard ke client via n8n
   * n8n akan forward ke WhatsApp/Instagram API
   */
  async sendMessageToClient(payload: {
    conversationId: string
    clientPhoneOrUsername: string
    message: string
    source: 'whatsapp' | 'instagram'
    senderRole: 'ai' | 'human'
    humanOperator?: string
  }) {
    const url = `${this.config.baseUrl}${this.config.endpoints.sendMessage}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: payload.conversationId,
          destination: payload.source,
          recipient: payload.clientPhoneOrUsername,
          message: payload.message,
          sender: payload.senderRole,
          operator: payload.humanOperator,
          timestamp: new Date().toISOString(),
          metadata: {
            dashboardUser: 'current-user-id', // Ambil dari auth context
            sessionId: this.getSessionId(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return {
        success: true,
        messageId: result.messageId || `msg-${Date.now()}`,
        deliveryStatus: result.deliveryStatus || 'sent',
      }
    } catch (error) {
      console.error('Failed to send message via n8n:', error)
      // Fallback untuk development/testing
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: `mock-${Date.now()}`,
      }
    }
  }

  /**
   * Toggle AI/Manual mode
   * n8n akan update database dan notify AI Agent untuk pause/resume
   */
  async toggleConversationMode(payload: {
    conversationId: string
    newMode: ConversationMode
    triggeredBy: string
  }) {
    const url = `${this.config.baseUrl}${this.config.endpoints.toggleMode}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: payload.conversationId,
          mode: payload.newMode,
          triggeredBy: payload.triggeredBy,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Toggle mode failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to toggle mode:', error)
      return { success: false, error }
    }
  }

  /**
   * Get all active conversations
   * Untuk polling update (bisa diganti WebSocket nanti)
   */
  async getConversations(): Promise<Conversation[]> {
    const url = `${this.config.baseUrl}${this.config.endpoints.getConversations}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Get conversations failed: ${response.status}`)
      }

      const data = await response.json()
      return this.normalizeConversations(data.conversations || [])
    } catch (error) {
      console.error('Failed to get conversations:', error)
      // Return mock data for development
      return []
    }
  }

  /**
   * Get messages for specific conversation
   */
  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const url = `${this.config.baseUrl}${this.config.endpoints.getMessages}/${conversationId}?limit=${limit}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Get messages failed: ${response.status}`)
      }

      const data = await response.json()
      return this.normalizeMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to get messages:', error)
      return []
    }
  }

  /**
   * Setup incoming message listener (webhook endpoint di dashboard)
   * n8n akan POST ke endpoint ini ketika ada pesan baru dari WA/IG
   */
  setupIncomingMessageListener(callback: (message: any) => void) {
    // This would be handled by your backend server
    // Frontend akan polling atau pakai WebSocket
    console.log('Incoming message listener setup - implement server endpoint')
  }

  /**
   * Normalize data dari n8n ke format aplikasi
   */
  private normalizeConversations(data: any[]): Conversation[] {
    return data.map((conv) => ({
      id: conv.id || conv.conversationId,
      clientName: conv.clientName || conv.client_name,
      source: conv.source || 'whatsapp',
      status: conv.status || 'active',
      mode: conv.mode || 'ai',
      lastMessage: conv.lastMessage || conv.last_message || '',
      lastMessageTime: new Date(conv.lastMessageTime || conv.last_message_time || Date.now()),
      unreadCount: conv.unreadCount || conv.unread_count || 0,
      metadata: {
        phoneNumber: conv.metadata?.phoneNumber || conv.phone_number,
        igUsername: conv.metadata?.igUsername || conv.ig_username,
        projectType: conv.metadata?.projectType || conv.project_type,
        estimatedValue: conv.metadata?.estimatedValue || conv.estimated_value,
      },
      messages: [],
      humanOperator: conv.humanOperator || conv.human_operator,
    }))
  }

  private normalizeMessages(data: any[]): Message[] {
    return data.map((msg) => ({
      id: msg.id || msg.messageId,
      conversationId: msg.conversationId || msg.conversation_id,
      content: msg.content || msg.message,
      role: msg.role || msg.sender,
      timestamp: new Date(msg.timestamp || msg.created_at || Date.now()),
      source: msg.source || 'whatsapp',
      aiConfidence: msg.aiConfidence || msg.ai_confidence,
      metadata: msg.metadata,
    }))
  }

  private getSessionId(): string {
    let sessionId = localStorage.getItem('dashboard-session-id')
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('dashboard-session-id', sessionId)
    }
    return sessionId
  }
}

// Export singleton instance
export const n8nService = new N8NWebhookService()
export default n8nService
