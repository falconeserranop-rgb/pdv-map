import { useState, useEffect, useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { Banner } from '../components/layout/Banner'
import { Sidebar } from '../components/sidebar/Sidebar'
import { MobileDrawer } from '../components/sidebar/MobileDrawer'
import { MapView } from '../components/map/MapView'
import { useGeolocation } from '../hooks/useGeolocation'
import { usePDVs } from '../hooks/usePDVs'
import type { PDV, SortMode } from '../types'
import { haversineKm } from '../lib/geo'

export function MapPage() {
  const [sortMode, setSortMode] = useState<SortMode>('az')
  const [search, setSearch] = useState('')
  const [selectedPDV, setSelectedPDV] = useState<PDV | null>(null)

  // Desktop sidebar toggle (hamburger in header).
  // On mobile the drawer is self-contained and manages its own state.
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

  function handleSelectPDV(pdv: PDV) {
    setSelectedPDV(pdv)
    setSidebarOpen(false) // close desktop sidebar too if open
  }

  const commonSidebarProps = {
    pdvs,
    selectedPDV,
    nearestPDV,
    sortMode,
    geoStatus,
    search,
    loading,
    onSelectPDV: handleSelectPDV,
    onSortChange: setSortMode,
    onSearchChange: setSearch,
    onRetryGeo: retry,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <Banner />

      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Desktop overlay (hamburger → sidebar slide) ────────────────── */}
        {sidebarOpen && (
          <div
            className="sidebar-overlay hidden md:block"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Desktop sidebar (left panel, hidden on mobile) ─────────────── */}
        <div
          className={`
            hidden md:block
            absolute md:relative z-40 md:z-auto
            h-full shrink-0
            transition-transform duration-300 ease-out
            md:translate-x-0
          `}
          style={{ width: 'var(--sidebar-w)' }}
        >
          <Sidebar {...commonSidebarProps} />
        </div>

        {/* ── Map — fills remaining space (full width on mobile) ─────────── */}
        <div className="flex-1 relative overflow-hidden">
          <MapView
            pdvs={pdvs}
            selectedPDV={selectedPDV}
            nearestPDV={nearestPDV}
            userPosition={position}
            onSelectPDV={handleSelectPDV}
          />
        </div>
      </div>

      {/* ── Mobile bottom drawer (replaces sidebar + FAB on phones) ───────── */}
      <MobileDrawer {...commonSidebarProps} />
    </div>
  )
}
