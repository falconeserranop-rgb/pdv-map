import { useState, useEffect, useMemo } from 'react'
import { List, Map as MapIcon, Navigation2, X, ExternalLink, Share2, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Banner } from '../components/layout/Banner'
import { Sidebar } from '../components/sidebar/Sidebar'
import { MapView } from '../components/map/MapView'
import { useGeolocation } from '../hooks/useGeolocation'
import { usePDVs } from '../hooks/usePDVs'
import type { PDV, SortMode } from '../types'
import { haversineKm, googleMapsUrl, whatsappShareUrl, formatDistance } from '../lib/geo'

export function MapPage() {
  const [sortMode, setSortMode] = useState<SortMode>('az')
  const [search, setSearch] = useState('')
  const [selectedPDV, setSelectedPDV] = useState<PDV | null>(null)
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list')

  const { status: geoStatus, position, retry } = useGeolocation()
  const { pdvs, loading } = usePDVs(position, sortMode, search)

  useEffect(() => {
    if (geoStatus === 'granted') setSortMode('nearest')
    else if (geoStatus === 'denied') setSortMode('az')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoStatus])

  const nearestPDV = useMemo(() => {
    if (!position || pdvs.length === 0) return null
    return [...pdvs].sort((a, b) => {
      const da = haversineKm(position.lat, position.lon, a.latitud!, a.longitud!)
      const db = haversineKm(position.lat, position.lon, b.latitud!, b.longitud!)
      return da - db
    })[0] ?? null
  }, [position, pdvs])

  useEffect(() => {
    if (nearestPDV && geoStatus === 'granted' && !selectedPDV) {
      setSelectedPDV(nearestPDV)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearestPDV, geoStatus])

  function handleSelectPDV(pdv: PDV) {
    setSelectedPDV(pdv)
    setMobileTab('map') // switch to map so user sees the selected PDV
  }

  const sidebarProps = {
    pdvs, selectedPDV, nearestPDV, sortMode, geoStatus, search, loading,
    onSelectPDV: handleSelectPDV,
    onSortChange: setSortMode,
    onSearchChange: setSearch,
    onRetryGeo: retry,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header sidebarOpen={false} onToggleSidebar={() => {}} showMobileMenu={false} />
      <Banner />

      {/* ── Mobile tab bar ─────────────────────────────────────────────────── */}
      <div className="md:hidden flex shrink-0 bg-carbon-900 border-b border-white/10">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 flex items-center justify-center gap-2 h-12 text-sm font-semibold border-b-2 transition-all ${
            mobileTab === 'list' ? 'text-white border-mobil-red' : 'text-white/40 border-transparent'
          }`}
        >
          <List size={16} />
          Lista
          {!loading && pdvs.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              mobileTab === 'list' ? 'bg-mobil-red text-white' : 'bg-white/10 text-white/40'
            }`}>
              {pdvs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 flex items-center justify-center gap-2 h-12 text-sm font-semibold border-b-2 transition-all ${
            mobileTab === 'map' ? 'text-white border-mobil-red' : 'text-white/40 border-transparent'
          }`}
        >
          <MapIcon size={16} />
          Mapa
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SINGLE MapView always in DOM — no duplication, no black screens.

          Desktop: sidebar on left (hidden md:flex), map on right (flex-1).
          Mobile:  map takes full space; list slides over it as an overlay.
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop sidebar (never shown on mobile) ──────────────────────── */}
        <div
          className="hidden md:flex flex-col h-full shrink-0"
          style={{ width: 'var(--sidebar-w)' }}
        >
          <Sidebar {...sidebarProps} />
        </div>

        {/* ── Map + mobile overlays ─────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">

          {/* The one and only MapView */}
          <MapView
            pdvs={pdvs}
            selectedPDV={selectedPDV}
            nearestPDV={nearestPDV}
            userPosition={position}
            onSelectPDV={handleSelectPDV}
          />

          {/* Mobile list overlay — slides from the left over the map.
              z-[1001] beats Leaflet's internal z-indexes (tiles:200,
              markers:600, controls:800) so the list appears on top.
              translate-x-0  = covering map (list tab active)
             -translate-x-full = slid off left (map tab active)
              md:hidden = never appears on desktop (desktop uses sidebar) */}
          <div
            className={`
              absolute inset-0 z-[1001] flex flex-col overflow-hidden
              md:hidden
              transition-transform duration-300 ease-out
              ${mobileTab === 'list' ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            <Sidebar {...sidebarProps} />
          </div>

          {/* Mobile PDV card — bottom sheet when a PDV is selected on map tab.
              Shows: name, directions, WhatsApp share, link to full detail page. */}
          {mobileTab === 'map' && selectedPDV && (
            <div className="absolute bottom-0 left-0 right-0 z-[1002] p-3 pb-safe md:hidden animate-fade-up">
              <div className="bg-carbon-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

                {/* Name + close */}
                <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                  <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    nearestPDV?.id === selectedPDV.id
                      ? 'bg-mobil-blue/20 border border-mobil-blue/40'
                      : 'bg-mobil-red/15 border border-mobil-red/30'
                  }`}>
                    <MapPin size={15} className={
                      nearestPDV?.id === selectedPDV.id ? 'text-mobil-blue' : 'text-mobil-red'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    {nearestPDV?.id === selectedPDV.id && (
                      <span className="block text-[10px] font-bold text-mobil-blue uppercase tracking-wider mb-0.5">
                        El más cercano
                        {selectedPDV.distancia != null && selectedPDV.distancia !== Infinity
                          && ` · ${formatDistance(selectedPDV.distancia)}`}
                      </span>
                    )}
                    <h3 className="font-display font-bold text-white text-base leading-tight truncate">
                      {selectedPDV.nombre}
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">{selectedPDV.zona}</p>
                    {selectedPDV.direccion && (
                      <p className="text-xs text-white/30 mt-0.5 truncate">{selectedPDV.direccion}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPDV(null)}
                    className="p-1.5 text-white/30 hover:text-white/60 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 px-4 pb-4">
                  {selectedPDV.latitud && selectedPDV.longitud ? (
                    <>
                      <a
                        href={googleMapsUrl(selectedPDV.latitud, selectedPDV.longitud, selectedPDV.nombre)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-mobil-red hover:bg-mobil-red-light text-white text-sm font-semibold py-3 rounded-xl transition-colors"
                      >
                        <Navigation2 size={15} />
                        Cómo llegar
                      </a>
                      <a
                        href={whatsappShareUrl(selectedPDV.nombre, selectedPDV.latitud, selectedPDV.longitud)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] py-3 px-4 rounded-xl transition-colors"
                      >
                        <Share2 size={15} />
                      </a>
                    </>
                  ) : (
                    <span className="flex-1 text-xs text-white/30 py-3 text-center">Sin ubicación</span>
                  )}
                  <Link
                    to={`/pdv/${selectedPDV.slug}`}
                    className="flex items-center justify-center bg-carbon-700 hover:bg-carbon-600 text-white py-3 px-4 rounded-xl transition-colors"
                    title="Ver ficha completa"
                  >
                    <ExternalLink size={15} />
                  </Link>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
