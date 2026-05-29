import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../../context/ThemeContext'

// Light mode: Voyager — colorful, warm roads and labels
// Dark mode:  Positron — crisp light gray, full building/street detail
const VOYAGER  = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const POSITRON = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'

/**
 * Drop this inside any MapContainer to get automatic theme-aware tiles.
 * Uses the Leaflet API directly (addTo / removeLayer) so it always
 * responds to theme changes regardless of react-leaflet reconciliation quirks.
 */
export function ThemeAwareTiles() {
  const map = useMap()
  const { theme } = useTheme()

  useEffect(() => {
    const url = theme === 'dark' ? POSITRON : VOYAGER
    const layer = L.tileLayer(url, {
      attribution: ATTR,
      subdomains: 'abcd',
      maxZoom: 19,
    })
    layer.addTo(map)
    // Cleanup removes the old layer before the new one takes effect
    return () => { map.removeLayer(layer) }
  }, [theme, map])

  return null
}
