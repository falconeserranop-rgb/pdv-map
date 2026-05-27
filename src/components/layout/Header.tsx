import { Menu, X, MapPin } from 'lucide-react'

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="relative z-20 bg-carbon-900 border-b border-white/10 shadow-lg">
      <div className="racing-stripe" />
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Mobil logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <img
            src="/mobil-logo.png"
            alt="Mobil"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Center: title (desktop only) */}
        <div className="hidden md:flex flex-col items-center">
          <span className="font-display font-bold text-base tracking-widest text-white/80 uppercase">
            Puntos de Venta Autorizados
          </span>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <MapPin size={11} />
            <span>Caracas &middot; Miranda &middot; Venezuela</span>
          </div>
        </div>

        {/* Right: Mad4Performance logo */}
        <div className="flex items-center">
          <img
            src="/mad4performance-logo.png"
            alt="Mad4Performance"
            className="h-9 w-auto object-contain"
          />
        </div>
      </div>
    </header>
  )
}
