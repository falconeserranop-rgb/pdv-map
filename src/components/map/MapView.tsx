import { useEffect, useRef } from 'react'
import { MapContainer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PDV } from '../../types'
import { PDVPopup } from './PDVPopup'
import { ThemeAwareTiles } from './ThemeAwareTiles'
import type { GeoPosition } from '../../hooks/useGeolocation'

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createPDVIcon(isNearest = false) {
  return L.divIcon({
    html: `<div class="pdv-marker-wrap ${isNearest ? 'pdv-marker-nearest' : ''}"><div class="pdv-marker-dot"></div></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    popupAnchor: [0, -28],
  })
}

function createUserIcon() {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;background:#0052CC;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(0,82,204,0.8)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

// Unified handler: close old popup → fly to PDV → open new popup.
// Responds to selectedPDV.id changes so selecting a different PDV
// always closes the previous ficha and opens the next one.
function SelectionHandler({
  selectedPDV,
  markerRefs,
}: {
  selectedPDV: PDV | null
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>
}) {
  const map = useMap()

  useEffect(() => {
    // Close any open popup immediately (handles switching + deselect)
    map.closePopup()

    if (!selectedPDV?.latitud || !selectedPDV?.longitud) return

    const markerId = selectedPDV.id

    // Fly to selected PDV
    map.flyTo([selectedPDV.latitud, selectedPDV.longitud], 16, {
      animate: true,
      duration: 1.0,
    })

    // Open popup once fly animation finishes
    const openPopup = () => markerRefs.current[markerId]?.openPopup()
    map.once('moveend', openPopup)

    return () => { map.off('moveend', openPopup) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPDV?.id])

  return null
}

interface MapViewProps {
  pdvs: PDV[]
  selectedPDV: PDV | null
  nearestPDV: PDV | null
  userPosition: GeoPosition | null
  onSelectPDV: (pdv: PDV) => void
}

export function MapView({ pdvs, selectedPDV, nearestPDV, userPosition, onSelectPDV }: MapViewProps) {
  const withCoords = pdvs.filter((p) => p.latitud != null && p.longitud != null)
  // Stable ref map: id → Leaflet Marker instance, used by SelectionHandler
  const markerRefs = useRef<Record<string, L.Marker>>({})

  const center: [number, number] = nearestPDV?.latitud
    ? [nearestPDV.latitud, nearestPDV.longitud!]
    : userPosition
    ? [userPosition.lat, userPosition.lon]
    : [10.48, -66.88]

  return (
    <MapContainer center={center} zoom={12} className="h-full w-full" zoomControl>
      <ThemeAwareTiles />
      <SelectionHandler selectedPDV={selectedPDV} markerRefs={markerRefs} />

      {/* User location */}
      {userPosition && (
        <>
          <Marker position={[userPosition.lat, userPosition.lon]} icon={createUserIcon()} />
          <Circle
            center={[userPosition.lat, userPosition.lon]}
            radius={300}
            pathOptions={{ color: '#0052CC', fillColor: '#0052CC', fillOpacity: 0.08, weight: 1 }}
          />
        </>
      )}

      {/* PDV markers — ref stored so SelectionHandler can call openPopup() */}
      {withCoords.map((pdv) => {
        const isNearest = nearestPDV?.id === pdv.id
        return (
          <Marker
            key={pdv.id}
            ref={(m) => { if (m) markerRefs.current[pdv.id] = m }}
            position={[pdv.latitud!, pdv.longitud!]}
            icon={createPDVIcon(isNearest)}
            eventHandlers={{ click: () => onSelectPDV(pdv) }}
          >
            <Popup maxWidth={310} minWidth={290}>
              <PDVPopup pdv={pdv} isNearest={isNearest} />
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
