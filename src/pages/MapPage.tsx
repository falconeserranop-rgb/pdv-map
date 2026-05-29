import { useState, useEffect, useMemo } from 'react'
import { List } from 'lucide-react'
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
  // Open sidebar by default on mobile so users see the list immediately
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )

  const { status: geoStatus, position, retry } = useGeolocation()
  const { pdvs, loading } = usePDVs(position, sortMode, search)

  // Switch sort mode when geo changes
  useEffect(() => {
    if (geoStatus === 'granted') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSortMode('nearest')
    } else if (geoStatus === 'denied') {
      setSortMode('az')
    }
  }, [geoStatus])

  const nearestPDV = useMemo(() => {
    if (!position || pdvs.length === 0) return null
    return [...pdvs].sort((a, b) => {
      const da = haversineKm(position.lat, position.lon, a.latitud!, a.longitud!)
      const db = haversineKm(position.lat, position.lon, b.latitud!, b.longitud!)
      return da - db
    })[0] ?? null
  }, [position, pdvs])

  // Auto-select nearest when geo is first granted
  useEffect(() => {
    if (nearestPDV && geoStatus === 'granted' && !selectedPDV) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPDV(nearestPDV)
    }
  }, [nearestPDV, geoStatus, selectedPDV])

  const handleSelectPDV = (pdv: PDV) => {
    setSelectedPDV(pdv)
    setSidebarOpen(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <Banner />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="sidebar-overlay md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            absolute md:relative z-40 md:z-auto
            h-full
            transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{ width: 'var(--sidebar-w)' }}
        >
          <Sidebar
            pdvs={pdvs}
            selectedPDV={selectedPDV}
            nearestPDV={nearestPDV}
            sortMode={sortMode}
            geoStatus={geoStatus}
            search={search}
            loading={loading}
            onSelectPDV={handleSelectPDV}
            onSortChange={setSortMode}
            onSearchChange={setSearch}
            onRetryGeo={retry}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            pdvs={pdvs}
            selectedPDV={selectedPDV}
            nearestPDV={nearestPDV}
            userPosition={position}
            onSelectPDV={handleSelectPDV}
          />

          {/* Mobile FAB — always rendered but invisible when sidebar open.
               Uses env(safe-area-inset-bottom) so it clears the iOS browser toolbar
               and the home indicator on notched devices. viewport-fit=cover enables this. */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={`md:hidden fixed left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-mobil-red hover:bg-mobil-red-light active:scale-95 text-white text-sm font-bold px-6 py-3.5 rounded-full transition-all duration-200 ${
              sidebarOpen ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
            }`}
            style={{
              bottom: 'calc(max(20px, env(safe-area-inset-bottom, 0px)) + 16px)',
              boxShadow: '0 4px 24px rgba(204,0,0,0.6)',
            }}
          >
            <List size={16} />
            Ver lista
          </button>
        </div>
      </div>
    </div>
  )
}
