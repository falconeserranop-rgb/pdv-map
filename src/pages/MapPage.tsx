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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

          {/* Mobile FAB — show list */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-mobil-red hover:bg-mobil-red-light active:scale-95 text-white text-sm font-bold px-5 py-3 rounded-full shadow-lg transition-all"
              style={{ boxShadow: '0 4px 20px rgba(204,0,0,0.5)' }}
            >
              <List size={16} />
              Ver lista
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
