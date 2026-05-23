import { useState } from 'react'
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
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="ml-[280px] min-h-screen flex flex-col">
        <TopBar title={pageTitles[currentPage]} />
        {isFullscreenPage ? (
          renderPage()
        ) : (
          <div className="flex-1 overflow-y-auto">{renderPage()}</div>
        )}
      </main>
    </div>
  )
}

export default App
