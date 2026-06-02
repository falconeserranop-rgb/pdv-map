import { Menu, X, MapPin, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  /** Set false to hide the mobile hamburger (e.g. when tabs replace the sidebar) */
  showMobileMenu?: boolean
}

export function Header({ sidebarOpen, onToggleSidebar, showMobileMenu = true }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="force-dark relative z-20 bg-carbon-900 border-b border-white/10 shadow-lg">
      <div className="racing-stripe" />
      {/* relative + absolute centre: left/right use natural widths on mobile;
          the title is pinned to the exact horizontal centre on desktop.       */}
      <div className="relative flex items-center justify-between px-3 sm:px-4 h-14">

        {/* Left: hamburger (mobile, optional) + Mobil logo */}
        <div className="flex items-center gap-2 sm:gap-3 relative z-10">
          {showMobileMenu && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          <img
            src="/mobil-logo.png"
            alt="Mobil"
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </div>

        {/* Centre: absolutely centred title — desktop only, pointer-events pass through */}
        <div className="absolute inset-x-0 h-full hidden md:flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center">
            <span className="font-display font-bold text-lg tracking-widest text-white/90 uppercase">
              Puntos de Venta Autorizados
            </span>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <MapPin size={11} />
              <span>Caracas &middot; Miranda &middot; Venezuela</span>
            </div>
          </div>
        </div>

        {/* Right: theme toggle + Mad4Performance logo */}
        <div className="flex items-center gap-2 sm:gap-3 relative z-10">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark'
              ? <Sun size={18} className="text-white/60 hover:text-white/90 transition-colors" />
              : <Moon size={18} className="text-white/60 hover:text-white/90 transition-colors" />
            }
          </button>
          <img
            src="/mad4performance-logo.png"
            alt="Mad4Performance"
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </div>

      </div>
    </header>
  )
}
