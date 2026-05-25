import { useState, Component, ReactNode } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import ChatMonitoring from './pages/ChatMonitoring'
import Pipeline from './pages/Pipeline'
import Estimator from './pages/Estimator'
import AIStudio from './pages/AIStudio'
import Settings from './pages/Settings'

type PageType =
  | 'dashboard'
  | 'chat-monitoring'
  | 'pipeline'
  | 'estimator'
  | 'ai-studio'
  | 'settings'

const pageTitles: Record<PageType, string> = {
  dashboard: 'Agent Dashboard',
  'chat-monitoring': 'Active Chats',
  pipeline: 'Client Database',
  estimator: 'AI Estimator',
  'ai-studio': 'AI Studio',
  settings: 'Settings',
}

// Error Boundary untuk catch crash per-page
class PageErrorBoundary extends Component<
  { children: ReactNode; pageKey: string },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }

  componentDidUpdate(prevProps: { pageKey: string }) {
    // Reset error saat pindah halaman
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
            <h3 className="font-headline-sm text-headline-sm font-bold mt-md mb-sm">
              Halaman gagal dimuat
            </h3>
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
  const [currentPage, setCurrentPage] = useState<PageType>('chat-monitoring')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
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
        return <ChatMonitoring />
    }
  }

  // Chat Monitoring is fullscreen 3-column layout, others are scrollable
  const isFullscreenPage = currentPage === 'chat-monitoring'

  return (
    <div className="h-screen overflow-hidden bg-background text-on-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="ml-[280px] h-screen flex flex-col overflow-hidden">
        <TopBar title={pageTitles[currentPage]} />
        <PageErrorBoundary pageKey={currentPage}>
          {isFullscreenPage ? (
            renderPage()
          ) : (
            <div className="flex-1 overflow-y-auto">{renderPage()}</div>
          )}
        </PageErrorBoundary>
      </main>
    </div>
  )
}

export default App
