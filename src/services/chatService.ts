import { Conversation, Message, QuickReply } from '../types/chat'
import n8nService from './n8nWebhookService'

// Mock data - nanti diganti dengan real API calls ke n8n
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    clientName: 'Bpk. Budi',
    source: 'whatsapp',
    status: 'active',
    mode: 'ai',
    lastMessage: 'Bisa dipercepat jadi 3 minggu nggak ya?',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 1000),
    unreadCount: 1,
    metadata: {
      phoneNumber: '+62 812-3456-7890',
      projectType: 'Apartemen Studio',
      estimatedValue: 'Rp 250M',
    },
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'Halo, saya tertarik untuk renovasi apartemen studio 45m2',
        role: 'client',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        source: 'whatsapp',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        content: 'Halo Pak Budi, saya asisten AI Sudut Ruang. Untuk apartemen 45sqm bergaya minimalis, estimasi waktu pengerjaan standar adalah 4-6 minggu.',
        role: 'ai',
        timestamp: new Date(Date.now() - 9 * 60 * 1000),
        source: 'whatsapp',
        aiConfidence: 0.95,
      },
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        content: 'Bisa dipercepat jadi 3 minggu nggak ya?',
        role: 'client',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        source: 'whatsapp',
        metadata: {
          needsHumanReview: true,
        },
      },
    ],
  },
  {
    id: 'conv-2',
    clientName: 'Ibu Siti',
    source: 'whatsapp',
    status: 'idle',
    mode: 'ai',
    lastMessage: 'Terima kasih infonya!',
    lastMessageTime: new Date(Date.now() - 45 * 60 * 1000),
    unreadCount: 0,
    metadata: {
      phoneNumber: '+62 813-9876-5432',
      projectType: 'Rumah 2 Lantai',
    },
    messages: [],
  },
  {
    id: 'conv-3',
    clientName: '@interior_lover',
    source: 'instagram',
    status: 'active',
    mode: 'ai',
    lastMessage: 'Mau tanya harga untuk cafe 80m2',
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
    unreadCount: 2,
    metadata: {
      igUsername: '@interior_lover',
      projectType: 'Cafe',
    },
    messages: [
      {
        id: 'msg-ig-1',
        conversationId: 'conv-3',
        content: 'Halo kak! Liat portfolio kalian keren banget',
        role: 'client',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        source: 'instagram',
      },
      {
        id: 'msg-ig-2',
        conversationId: 'conv-3',
        content: 'Halo! Terima kasih sudah tertarik dengan portfolio kami 😊 Ada yang bisa saya bantu?',
        role: 'ai',
        timestamp: new Date(Date.now() - 7 * 60 * 1000),
        source: 'instagram',
        aiConfidence: 0.92,
      },
      {
        id: 'msg-ig-3',
        conversationId: 'conv-3',
        content: 'Mau tanya harga untuk cafe 80m2',
        role: 'client',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        source: 'instagram',
        metadata: {
          needsHumanReview: false,
        },
      },
    ],
  },
  {
    id: 'conv-4',
    clientName: 'Bpk. Ahmad',
    source: 'whatsapp',
    status: 'active',
    mode: 'manual',
    lastMessage: 'Saya akan cek dengan tim dulu ya Pak',
    lastMessageTime: new Date(Date.now() - 1 * 60 * 1000),
    unreadCount: 0,
    metadata: {
      phoneNumber: '+62 815-1234-5678',
      projectType: 'Kantor',
      estimatedValue: 'Rp 500M',
    },
    messages: [],
    humanOperator: 'Andi',
  },
]

export const quickReplies: QuickReply[] = [
  {
    id: 'qr-1',
    title: 'Salam Pembuka',
    content: 'Halo! Terima kasih sudah menghubungi Sudut Ruang. Ada yang bisa saya bantu?',
    category: 'greeting',
  },
  {
    id: 'qr-2',
    title: 'Tanya Detail Proyek',
    content: 'Untuk memberikan estimasi yang akurat, boleh saya tahu:\n1. Luas area (m²)\n2. Tipe proyek (apartemen/rumah/kantor/cafe)\n3. Budget range Anda',
    category: 'pricing',
  },
  {
    id: 'qr-3',
    title: 'Konfirmasi Timeline',
    content: 'Estimasi pengerjaan standar adalah 4-6 minggu tergantung kompleksitas. Apakah ada deadline khusus?',
    category: 'timeline',
  },
  {
    id: 'qr-4',
    title: 'Follow Up',
    content: 'Terima kasih sudah tertarik! Saya akan kirimkan proposal detailnya via email dalam 1x24 jam. Ditunggu ya! 😊',
    category: 'closing',
  },
  {
    id: 'qr-5',
    title: 'Pricing Info',
    content: 'Harga kami mulai dari Rp 2.5jt - 5jt per m² tergantung kualitas material (Economy/Standard/Premium). Sudah termasuk material, tenaga kerja, dan furnitur.',
    category: 'pricing',
  },
  {
    id: 'qr-6',
    title: 'Request Survey',
    content: 'Untuk hasil maksimal, kami bisa schedule survey lokasi gratis. Kapan waktu yang cocok untuk Bapak/Ibu?',
    category: 'timeline',
  },
]

// API Service untuk n8n integration
export class ChatService {
  private static useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'

  // Send message via n8n
  static async sendMessage(
    conversationId: string,
    content: string,
    isAI: boolean = false,
    conversation?: Conversation
  ) {
    // If mock mode or no conversation data, use fallback
    if (this.useMockData || !conversation) {
      return { success: true, messageId: `mock-${Date.now()}` }
    }

    try {
      const result = await n8nService.sendMessageToClient({
        conversationId,
        clientPhoneOrUsername:
          conversation.metadata.phoneNumber || conversation.metadata.igUsername || '',
        message: content,
        source: conversation.source as 'whatsapp' | 'instagram',
        senderRole: isAI ? 'ai' : 'human',
        humanOperator: !isAI ? 'Current User' : undefined,
      })

      return result
    } catch (error) {
      console.error('Failed to send message:', error)
      return { success: false, error }
    }
  }

  // Toggle AI/Manual mode via n8n
  static async toggleMode(conversationId: string, mode: 'ai' | 'manual') {
    if (this.useMockData) {
      console.log(`[MOCK] Toggle mode: ${conversationId} → ${mode}`)
      return { success: true }
    }

    try {
      const result = await n8nService.toggleConversationMode({
        conversationId,
        newMode: mode,
        triggeredBy: 'dashboard-user', // TODO: Get from auth context
      })

      return result
    } catch (error) {
      console.error('Failed to toggle mode:', error)
      return { success: false, error }
    }
  }

  // Get conversations (polling or webhook)
  static async getConversations(): Promise<Conversation[]> {
    if (this.useMockData) {
      // Return mock data untuk development
      return mockConversations
    }

    try {
      const conversations = await n8nService.getConversations()
      
      // If no data from n8n, fallback to mock
      if (conversations.length === 0) {
        console.warn('No conversations from n8n, using mock data')
        return mockConversations
      }

      return conversations
    } catch (error) {
      console.error('Failed to get conversations:', error)
      return mockConversations
    }
  }

  // Get conversation messages
  static async getMessages(conversationId: string): Promise<Message[]> {
    if (this.useMockData) {
      const conv = mockConversations.find((c) => c.id === conversationId)
      return conv?.messages || []
    }

    try {
      const messages = await n8nService.getMessages(conversationId)
      
      // If no data, check mock
      if (messages.length === 0) {
        const conv = mockConversations.find((c) => c.id === conversationId)
        return conv?.messages || []
      }

      return messages
    } catch (error) {
      console.error('Failed to get messages:', error)
      const conv = mockConversations.find((c) => c.id === conversationId)
      return conv?.messages || []
    }
  }

  // Setup real-time listener for incoming messages
  static setupMessageListener(callback: (message: any) => void) {
    if (this.useMockData) {
      console.log('[MOCK] Message listener would be active in production')
      return
    }

    // In production, this would setup WebSocket or SSE connection
    n8nService.setupIncomingMessageListener(callback)
  }
}
