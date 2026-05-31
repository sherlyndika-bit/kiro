import { useState, useEffect, useRef, Component, ReactNode } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import ChatMonitoring from './pages/ChatMonitoring'
import Pipeline from './pages/Pipeline'
import Estimator from './pages/Estimator'
import AIStudio from './pages/AIStudio'
import Settings from './pages/Settings'
import { supabase } from './services/supabaseClient'

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

// Error Boundary untuk catch crash per-page
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
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [chatBadge, setChatBadge] = useState(0)
  const badgePoll = useRef<ReturnType<typeof setInterval> | null>(null)

  // Lightweight poll for total unread conversations (sidebar badge)
  useEffect(() => {
    const loadBadge = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('unread_count')
        .gt('unread_count', 0)
      if (data) setChatBadge(data.length)
    }
    loadBadge()
    badgePoll.current = setInterval(loadBadge, 8000)
    return () => {
      if (badgePoll.current) clearInterval(badgePoll.current)
    }
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />
      case 'chat-monitoring':
        return <ChatMonitoring />
      case 'pipeline':
        return <Pipeline />
      case 'estimator':
        return <Estimator />
      case 'ai-studio':
        return <AIStudio />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard onNavigate={setCurrentPage} />
    }
  }

  // Chat Monitoring is a fullscreen multi-column layout; others scroll vertically.
  const isFullscreenPage = currentPage === 'chat-monitoring'

  return (
    <div className="h-full bg-background text-on-background overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
        chatBadge={chatBadge}
      />
      <main className="md:ml-[264px] h-full flex flex-col min-h-0">
        <TopBar title={pageTitles[currentPage]} onMobileMenuClick={() => setIsSidebarOpen(true)} />
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
    </div>
  )
}

export default App
