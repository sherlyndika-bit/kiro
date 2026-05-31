import { useState, useEffect, useRef, Component, ReactNode } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import NotificationToasts from './components/NotificationToasts'
import Dashboard from './pages/Dashboard'
import ChatMonitoring from './pages/ChatMonitoring'
import Pipeline from './pages/Pipeline'
import Estimator from './pages/Estimator'
import AIStudio from './pages/AIStudio'
import Settings from './pages/Settings'
import LoginPage from './pages/LoginPage'
import { supabase, AIConfigService } from './services/supabaseClient'
import { authService } from './services/auth'
import { playNotificationSound, primeAudio, showBrowserNotification } from './services/notify'
import { AppNotification, ToastItem } from './types/notification'

type PageType =
  | 'dashboard'
  | 'chat-monitoring'
  | 'pipeline'
  | 'estimator'
  | 'ai-studio'
  | 'settings'

const pageTitles: Record<PageType, string> = {
  dashboard: 'Dashboard',
  'chat-monitoring': 'Active Chats',
  pipeline: 'Client CRM',
  estimator: 'AI Estimator',
  'ai-studio': 'AI Studio',
  settings: 'Pengaturan',
}

class PageErrorBoundary extends Component<
  { children: ReactNode; pageKey: string },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode; pageKey: string }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }

  componentDidUpdate(prevProps: { pageKey: string }) {
    if (prevProps.pageKey !== this.props.pageKey && this.state.hasError) {
      this.setState({ hasError: false, error: '' })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-gutter">
          <div className="text-center max-w-md">
            <span className="material-symbols-outlined text-5xl text-error">error</span>
            <h3 className="text-headline-sm font-bold mt-md mb-sm">Halaman gagal dimuat</h3>
            <p className="text-body-md text-on-surface-variant mb-md">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-md py-2 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const [authed, setAuthed] = useState<boolean>(() => authService.isAuthenticated())
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [chatBadge, setChatBadge] = useState(0)
  const [logo, setLogo] = useState<string>('')

  // Search + conversation targeting for ChatMonitoring
  const [chatSearch, setChatSearch] = useState('')
  const [chatSearchNonce, setChatSearchNonce] = useState(0)
  const [chatTargetId, setChatTargetId] = useState<string | null>(null)
  const [chatTargetNonce, setChatTargetNonce] = useState(0)

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seenRef = useRef<Map<string, string>>(new Map())
  const notifInitRef = useRef(false)
  const knownNotifIds = useRef<Set<string>>(new Set())

  const session = authService.getSession()

  // Unlock audio + load logo on first authed render
  useEffect(() => {
    if (!authed) return
    AIConfigService.get('company_logo').then((v) => v && setLogo(v))
    const unlock = () => primeAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [authed])

  const dismissToast = (id: string) => setToasts((ts) => ts.filter((t) => t.id !== id))

  // Poll conversations: sidebar badge + new-message notifications
  useEffect(() => {
    if (!authed) return

    const poll = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('id, client_name, last_message, last_message_at, unread_count')
        .order('last_message_at', { ascending: false })
        .limit(50)
      if (!data) return

      setChatBadge(data.filter((c) => (c.unread_count || 0) > 0).length)

      const fresh: AppNotification[] = []
      for (const c of data) {
        const prev = seenRef.current.get(c.id)
        const t: string = c.last_message_at || ''
        if (notifInitRef.current) {
          const isNew = prev === undefined || (t !== '' && t > prev)
          const notifId = `${c.id}-${t}`
          if (isNew && (c.unread_count || 0) > 0 && !knownNotifIds.current.has(notifId)) {
            knownNotifIds.current.add(notifId)
            fresh.push({
              id: notifId,
              conversationId: c.id,
              title: c.client_name || 'Pelanggan',
              body: c.last_message || 'Pesan baru masuk',
              time: t || new Date().toISOString(),
              read: false,
            })
          }
        }
        if (t) seenRef.current.set(c.id, t)
      }

      if (!notifInitRef.current) {
        notifInitRef.current = true
        return
      }

      if (fresh.length > 0) {
        setNotifications((prev) => [...fresh, ...prev].slice(0, 50))
        setToasts((prev) => [...prev, ...fresh.map((n) => ({ id: n.id, title: n.title, body: n.body }))])
        playNotificationSound()
        fresh.forEach((n) => showBrowserNotification(`Pesan baru — ${n.title}`, n.body))
        fresh.forEach((n) => setTimeout(() => dismissToast(n.id), 6000))
      }
    }

    poll()
    pollRef.current = setInterval(poll, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [authed])

  const handleLogout = () => {
    authService.logout()
    setAuthed(false)
    setCurrentPage('dashboard')
    setIsSidebarOpen(false)
    setNotifications([])
    setToasts([])
    notifInitRef.current = false
    seenRef.current.clear()
    knownNotifIds.current.clear()
  }

  const handleTopbarSearch = (query: string) => {
    setChatSearch(query)
    setChatSearchNonce((n) => n + 1)
    setCurrentPage('chat-monitoring')
  }

  const openConversation = (conversationId: string) => {
    setChatTargetId(conversationId)
    setChatTargetNonce((n) => n + 1)
    setNotifications((prev) =>
      prev.map((n) => (n.conversationId === conversationId ? { ...n, read: true } : n)),
    )
    setCurrentPage('chat-monitoring')
  }

  const handleToastClick = (toastId: string) => {
    const notif = notifications.find((n) => n.id === toastId)
    dismissToast(toastId)
    if (notif) openConversation(notif.conversationId)
  }

  const markAllNotificationsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const clearNotifications = () => setNotifications([])

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />
      case 'chat-monitoring':
        return (
          <ChatMonitoring
            initialSearch={chatSearch}
            searchNonce={chatSearchNonce}
            targetConversationId={chatTargetId}
            targetNonce={chatTargetNonce}
          />
        )
      case 'pipeline':
        return <Pipeline />
      case 'estimator':
        return <Estimator />
      case 'ai-studio':
        return <AIStudio />
      case 'settings':
        return <Settings onLogoChange={setLogo} />
      default:
        return <Dashboard onNavigate={setCurrentPage} />
    }
  }

  const isFullscreenPage = currentPage === 'chat-monitoring'

  return (
    <div className="h-full bg-background text-on-background overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
        chatBadge={chatBadge}
        userEmail={session?.email}
        onLogout={handleLogout}
        logo={logo}
      />
      <main className="md:ml-[264px] h-full flex flex-col min-h-0">
        <TopBar
          title={pageTitles[currentPage]}
          onMobileMenuClick={() => setIsSidebarOpen(true)}
          onSearch={handleTopbarSearch}
          notifications={notifications}
          onOpenConversation={openConversation}
          onMarkAllRead={markAllNotificationsRead}
          onClearNotifications={clearNotifications}
        />
        <div className="flex-1 min-h-0 overflow-hidden">
          <PageErrorBoundary pageKey={currentPage}>
            {isFullscreenPage ? (
              <div className="h-full">{renderPage()}</div>
            ) : (
              <div className="h-full overflow-y-auto custom-scrollbar">{renderPage()}</div>
            )}
          </PageErrorBoundary>
        </div>
      </main>

      <NotificationToasts toasts={toasts} onClick={handleToastClick} onDismiss={dismissToast} />
    </div>
  )
}

export default App
