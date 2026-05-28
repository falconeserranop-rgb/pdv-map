import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PDV } from '../../types'
import { PDVPopup } from './PDVPopup'
import type { GeoPosition } from '../../hooks/useGeolocation'
import { useTheme } from '../../context/ThemeContext'

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

function FlyToPDV({ pdv }: { pdv: PDV | null }) {
  const map = useMap()
  useEffect(() => {
    if (pdv?.latitud && pdv?.longitud) {
      map.flyTo([pdv.latitud, pdv.longitud], 16, { animate: true, duration: 1.2 })
    }
  }, [pdv, map])
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
  const { theme } = useTheme()
  const withCoords = pdvs.filter((p) => p.latitud != null && p.longitud != null)

  const center: [number, number] = nearestPDV?.latitud
    ? [nearestPDV.latitud, nearestPDV.longitud!]
    : userPosition
    ? [userPosition.lat, userPosition.lon]
    : [10.48, -66.88]

  // Voyager = light coloured tiles with full road/building detail
  const tileUrl = theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        key={theme}
        url={tileUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <FlyToPDV pdv={selectedPDV} />

      {/* User location */}
      {userPosition && (
        <>
          <Marker
            position={[userPosition.lat, userPosition.lon]}
            icon={createUserIcon()}
          />
          <Circle
            center={[userPosition.lat, userPosition.lon]}
            radius={300}
            pathOptions={{ color: '#0052CC', fillColor: '#0052CC', fillOpacity: 0.08, weight: 1 }}
          />
        </>
      )}

      {/* PDV markers */}
      {withCoords.map((pdv) => {
        const isNearest = nearestPDV?.id === pdv.id
        return (
          <Marker
            key={pdv.id}
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
