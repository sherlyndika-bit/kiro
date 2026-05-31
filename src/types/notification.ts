export interface AppNotification {
  id: string
  conversationId: string
  title: string
  body: string
  time: string
  read: boolean
}

export interface ToastItem {
  id: string
  title: string
  body: string
}
