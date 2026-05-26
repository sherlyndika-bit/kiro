import React from 'react'

interface TopBarProps {
  title: string
  onMobileMenuClick: () => void
}

const TopBar: React.FC<TopBarProps> = ({ title, onMobileMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 h-16 px-md md:px-gutter bg-surface border-b border-outline-variant flex justify-between items-center gap-sm">
      <div className="flex items-center gap-sm md:gap-lg min-w-0">
        {/* Hamburger (mobile only) */}
        <button
          onClick={onMobileMenuClick}
          className="md:hidden -ml-2 p-2 rounded-lg hover:bg-surface-container text-on-surface-variant"
          aria-label="Buka menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <h2 className="font-headline-sm text-headline-sm font-black text-primary truncate">
          {title}
        </h2>

        {/* Search — hidden on small screens */}
        <div className="relative group hidden lg:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search interactions..."
            className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-body-md focus:ring-2 focus:ring-secondary outline-none w-64 transition-all duration-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-sm md:gap-md flex-shrink-0">
        <button
          className="hidden sm:inline-flex text-on-surface-variant hover:text-primary transition-opacity active:opacity-80"
          aria-label="Hub"
        >
          <span className="material-symbols-outlined">hub</span>
        </button>
        <button
          className="text-on-surface-variant hover:text-primary transition-opacity active:opacity-80 relative"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
        </button>
        <button
          className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-opacity active:opacity-80"
          aria-label="Account"
        >
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  )
}

export default TopBar
