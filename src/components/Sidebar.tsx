import React from 'react'

type PageType = 'dashboard' | 'pipeline' | 'ai-studio' | 'estimator' | 'settings' | 'chat-monitoring'

interface SidebarProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const menuItems = [
    { id: 'dashboard' as PageType, icon: '📊', label: 'Dashboard' },
    { id: 'chat-monitoring' as PageType, icon: '💬', label: 'Chat Monitor', badge: 3 },
    { id: 'pipeline' as PageType, icon: '📋', label: 'Pipeline' },
    { id: 'ai-studio' as PageType, icon: '✨', label: 'AI Studio' },
    { id: 'estimator' as PageType, icon: '🧮', label: 'Estimator' },
    { id: 'settings' as PageType, icon: '⚙️', label: 'Settings' },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Sudut Ruang</h1>
        <p className="text-sm text-gray-500">Interior Design CRM</p>
      </div>

      {/* New Project Button */}
      <div className="p-4">
        <button className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
          <span className="text-xl">+</span>
          <span>Proyek Baru</span>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors relative ${
              currentPage === item.id
                ? 'bg-indigo-50 text-primary font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {'badge' in item && item.badge && item.badge > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Help Button */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
          <span className="text-xl">❓</span>
          <span>Bantuan</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
