import { useState, useEffect, useMemo } from 'react'
import { List, Map as MapIcon } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Banner } from '../components/layout/Banner'
import { Sidebar } from '../components/sidebar/Sidebar'
import { MapView } from '../components/map/MapView'
import { useGeolocation } from '../hooks/useGeolocation'
import { usePDVs } from '../hooks/usePDVs'
import type { PDV, SortMode } from '../types'
import { haversineKm } from '../lib/geo'

export function MapPage() {
  const [sortMode, setSortMode] = useState<SortMode>('az')
  const [search, setSearch] = useState('')
  const [selectedPDV, setSelectedPDV] = useState<PDV | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false) // desktop only
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
    setSidebarOpen(false)
    setMobileTab('map') // switch to map so user sees the PDV
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
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <Banner />

      {/* ── Mobile tab bar ─────────────────────────────────────────────────── */}
      <div className="md:hidden flex shrink-0 bg-carbon-900 border-b border-white/10">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 flex items-center justify-center gap-2 h-12 text-sm font-semibold border-b-2 transition-all ${
            mobileTab === 'list'
              ? 'text-white border-mobil-red'
              : 'text-white/40 border-transparent'
          }`}
        >
          <List size={16} />
          Lista de PDVs
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
            mobileTab === 'map'
              ? 'text-white border-mobil-red'
              : 'text-white/40 border-transparent'
          }`}
        >
          <MapIcon size={16} />
          Ver mapa
        </button>
      </div>

      {/* ── Content area ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── MOBILE: Lista (full screen) ──────────────────────────────────── */}
        <div className={`
          flex-col w-full overflow-hidden
          ${mobileTab === 'list' ? 'flex' : 'hidden'}
          md:hidden
        `}>
          <Sidebar {...sidebarProps} />
        </div>

        {/* ── MOBILE: Mapa (full screen) ───────────────────────────────────── */}
        {mobileTab === 'map' && (
          <div className="flex flex-1 md:hidden">
            <MapView
              pdvs={pdvs}
              selectedPDV={selectedPDV}
              nearestPDV={nearestPDV}
              userPosition={position}
              onSelectPDV={handleSelectPDV}
            />
          </div>
        )}

        {/* ── DESKTOP: sidebar (always visible) ────────────────────────────── */}
        <div
          className={`
            hidden md:flex flex-col h-full shrink-0
            absolute md:relative z-40 md:z-auto
            transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{ width: 'var(--sidebar-w)' }}
        >
          <Sidebar {...sidebarProps} />
        </div>

        {/* Desktop overlay when sidebar toggled */}
        {sidebarOpen && (
          <div className="sidebar-overlay hidden md:block" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── DESKTOP: map (always visible) ────────────────────────────────── */}
        <div className="hidden md:flex flex-1 relative">
          <MapView
            pdvs={pdvs}
            selectedPDV={selectedPDV}
            nearestPDV={nearestPDV}
            userPosition={position}
            onSelectPDV={handleSelectPDV}
          />
        </div>
      </div>
    </div>
  )
}
