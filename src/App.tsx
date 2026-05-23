import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Estimator from './pages/Estimator'
import Pipeline from './pages/Pipeline'
import AIStudio from './pages/AIStudio'
import Settings from './pages/Settings'
import ChatMonitoring from './pages/ChatMonitoring'

type PageType = 'dashboard' | 'pipeline' | 'ai-studio' | 'estimator' | 'settings' | 'chat-monitoring'

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('estimator')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'pipeline':
        return <Pipeline />
      case 'ai-studio':
        return <AIStudio />
      case 'estimator':
        return <Estimator />
      case 'chat-monitoring':
        return <ChatMonitoring />
      case 'settings':
        return <Settings />
      default:
        return <ChatMonitoring />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
