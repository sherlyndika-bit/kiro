import React from 'react'

interface TopBarProps {
  title: string
  onMobileMenuClick: () => void
}

const TopBar: React.FC<TopBarProps> = ({ title, onMobileMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 h-14 px-sm md:px-md bg-surface border-b border-outline-variant flex items-center gap-sm flex-shrink-0">
      {/* Hamburger (mobile only) */}
      <button
        onClick={onMobileMenuClick}
        className="md:hidden p-2 -ml-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
        aria-label="Buka menu"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <h2 className="text-[16px] font-semibold text-on-surface truncate">{title}</h2>

      <div className="flex-1" />

      {/* Search — hidden on small screens */}
      <div className="hidden lg:flex items-center gap-xs bg-background border border-outline-variant rounded-lg px-3 py-2 w-56">
        <span className="material-symbols-outlined text-outline text-[18px]">search</span>
        <input
          type="text"
          placeholder="Cari lead, proyek..."
          className="bg-transparent border-none outline-none text-[13px] text-on-surface w-full placeholder:text-outline"
        />
      </div>

      <button
        className="w-9 h-9 rounded-lg border border-outline-variant bg-surface hover:bg-background flex items-center justify-center text-on-surface-variant relative"
        aria-label="Notifikasi"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-coral rounded-full border border-surface" />
      </button>

      <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-[12px] font-semibold text-white cursor-pointer">
        SR
      </div>
    </header>
  )
}

export default TopBar
