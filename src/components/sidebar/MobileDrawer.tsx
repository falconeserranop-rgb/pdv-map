import { useState } from 'react'
import { ChevronUp, LocateFixed, SortAsc, AlertCircle, MapPin } from 'lucide-react'
import type { PDV, SortMode } from '../../types'
import { SearchBar } from './SearchBar'
import { PDVCard } from './PDVCard'
import type { GeoStatus } from '../../hooks/useGeolocation'

// Height of the handle strip visible in peek state
const PEEK_PX = 72

interface MobileDrawerProps {
  pdvs: PDV[]
  selectedPDV: PDV | null
  nearestPDV: PDV | null
  sortMode: SortMode
  geoStatus: GeoStatus
  search: string
  loading: boolean
  onSelectPDV: (pdv: PDV) => void
  onSortChange: (m: SortMode) => void
  onSearchChange: (s: string) => void
  onRetryGeo: () => void
}

/**
 * Mobile-only bottom-sheet drawer that replaces the left sidebar.
 * Sits fixed at the bottom, slides to full height on tap.
 * Invisible on md+ screens (handled via CSS).
 */
export function MobileDrawer({
  pdvs, selectedPDV, nearestPDV, sortMode, geoStatus,
  search, loading, onSelectPDV, onSortChange, onSearchChange, onRetryGeo,
}: MobileDrawerProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(pdv: PDV) {
    onSelectPDV(pdv)
    setOpen(false) // collapse drawer after selection → user sees map flying to PDV
  }

  return (
    <div
      // md:hidden: completely removed on desktop (sidebar handles it there)
      className="md:hidden fixed left-0 right-0 bottom-0 z-50 flex flex-col bg-carbon-900 rounded-t-2xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out"
      style={{
        // Full height capped at 82 small-viewport-height units for iOS Safari compat
        height: 'min(82vh, 82svh)',
        transform: open
          ? 'translateY(0)'
          : `translateY(calc(100% - ${PEEK_PX}px))`,
        // Avoid overlap with iPhone home indicator
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* ── Handle + counter row (always visible, tappable) ──────────────── */}
      <div
        className="shrink-0 cursor-pointer select-none touch-manipulation"
        onClick={() => setOpen((o) => !o)}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* Visual drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-9 h-1 rounded-full bg-white/20" />
        </div>

        {/* Count + toggle label */}
        <div className="flex items-center justify-between px-5 pb-3">
          <p className="text-sm font-bold text-white">
            {loading
              ? 'Cargando...'
              : `${pdvs.length} punto${pdvs.length !== 1 ? 's' : ''} de venta`}
          </p>
          <span className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            open ? 'text-white/40' : 'text-mobil-red'
          }`}>
            <ChevronUp
              size={16}
              className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            />
            {open ? 'Ver mapa' : 'Ver lista'}
          </span>
        </div>
      </div>

      {/* ── Scrollable content (visible only when open) ───────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden border-t border-white/10">
        {/* Search + sort controls */}
        <div className="px-4 pt-3 pb-2.5 space-y-2.5 shrink-0">
          <SearchBar value={search} onChange={onSearchChange} />

          <div className="flex gap-2">
            <button
              onClick={() => onSortChange('nearest')}
              disabled={geoStatus !== 'granted'}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg border transition-all ${
                sortMode === 'nearest' && geoStatus === 'granted'
                  ? 'bg-mobil-blue border-mobil-blue text-white'
                  : 'bg-transparent border-white/10 text-white/50 disabled:opacity-40'
              }`}
              title={geoStatus !== 'granted' ? 'Activa tu ubicación para ordenar por cercanía' : ''}
            >
              <LocateFixed size={12} /> Más cercano
            </button>
            <button
              onClick={() => onSortChange('az')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg border transition-all ${
                sortMode === 'az'
                  ? 'bg-mobil-red border-mobil-red text-white'
                  : 'bg-transparent border-white/10 text-white/50'
              }`}
            >
              <SortAsc size={12} /> A – Z
            </button>
          </div>

          {geoStatus === 'denied' && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
              <AlertCircle size={13} className="text-yellow-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-yellow-300/80">
                  Ubicación desactivada. Los PDVs se muestran A–Z.
                </p>
                <button
                  onClick={onRetryGeo}
                  className="text-xs text-yellow-400 font-semibold underline mt-0.5"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PDV list — overscroll-contain prevents pull-to-refresh fighting */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4 space-y-2"
          // -webkit-overflow-scrolling for smooth momentum scroll on iOS
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-carbon-700/40 animate-pulse" />
            ))
          ) : pdvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <MapPin size={28} className="text-white/20 mb-3" />
              <p className="text-sm font-medium text-white/40">No se encontraron PDVs</p>
              <p className="text-xs text-white/25 mt-1">Intenta con otra búsqueda</p>
            </div>
          ) : (
            pdvs.map((pdv) => (
              <PDVCard
                key={pdv.id}
                pdv={pdv}
                isSelected={selectedPDV?.id === pdv.id}
                isNearest={nearestPDV?.id === pdv.id}
                onClick={() => handleSelect(pdv)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
