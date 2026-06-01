import { MapPin, SortAsc, LocateFixed, AlertCircle } from 'lucide-react'
import type { PDV, SortMode } from '../../types'
import { SearchBar } from './SearchBar'
import { PDVCard } from './PDVCard'
import type { GeoStatus } from '../../hooks/useGeolocation'

interface SidebarProps {
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

export function Sidebar({
  pdvs, selectedPDV, nearestPDV, sortMode, geoStatus, search,
  loading, onSelectPDV, onSortChange, onSearchChange, onRetryGeo,
}: SidebarProps) {
  return (
    <aside className="flex flex-col h-full bg-carbon-900 border-r border-white/10 overflow-hidden">

      {/* Controls */}
      <div className="px-4 pt-4 pb-3 space-y-3 border-b border-white/10 shrink-0">
        <SearchBar value={search} onChange={onSearchChange} />

        {/* Sort buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onSortChange('nearest')}
            disabled={geoStatus !== 'granted'}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg border transition-all ${
              sortMode === 'nearest' && geoStatus === 'granted'
                ? 'bg-mobil-blue border-mobil-blue text-white shadow-glow-blue'
                : 'bg-transparent border-white/10 text-white/50 disabled:opacity-40'
            } hover:enabled:border-mobil-blue/60`}
            title={geoStatus !== 'granted' ? 'Activa la ubicación para ordenar por cercanía' : ''}
          >
            <LocateFixed size={12} />
            Más cercano
          </button>
          <button
            onClick={() => onSortChange('az')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg border transition-all ${
              sortMode === 'az'
                ? 'bg-mobil-red border-mobil-red text-white'
                : 'bg-transparent border-white/10 text-white/50 hover:border-white/30'
            }`}
          >
            <SortAsc size={12} />
            A – Z
          </button>
        </div>

        {/* Geo denied banner */}
        {geoStatus === 'denied' && (
          <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5 animate-fade-up">
            <AlertCircle size={13} className="text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-yellow-300/80">Ubicación desactivada. Los PDVs se muestran A–Z.</p>
              <button
                onClick={onRetryGeo}
                className="text-xs text-yellow-400 font-semibold underline mt-0.5 hover:text-yellow-300 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Count */}
      <div className="px-4 py-2 shrink-0 border-b border-white/5">
        <p className="text-xs text-white/30">
          {loading ? 'Cargando...' : `${pdvs.length} punto${pdvs.length !== 1 ? 's' : ''} de venta`}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-2"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-carbon-700/40 animate-pulse" />
          ))
        ) : pdvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center animate-fade-up">
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
              onClick={() => onSelectPDV(pdv)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="racing-stripe" />
      <div className="px-4 py-2 shrink-0">
        <p className="text-[10px] text-white/20 text-center">
          Mad4Performance × Mobil — Distribución Venezuela
        </p>
      </div>
    </aside>
  )
}
