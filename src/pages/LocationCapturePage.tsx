import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, CheckCircle, XCircle, Loader, MapPin, Navigation2, Clock } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type PageState = 'loading' | 'valid' | 'used' | 'expired' | 'invalid' | 'success'

interface TokenInfo {
  valid: boolean
  reason?: string
  pdv_nombre?: string
  zona?: string
  expires_at?: string
}

// Draggable map marker icon
function createPickerIcon() {
  return L.divIcon({
    html: `<div style="width:24px;height:24px;background:#CC0000;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 10px rgba(0,0,0,0.5)"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 21],
  })
}

function MapPicker({
  position,
  onSelect,
}: {
  position: [number, number]
  onSelect: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => onSelect(e.latlng.lat, e.latlng.lng),
  })
  return (
    <Marker
      position={position}
      icon={createPickerIcon()}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const m = e.target as L.Marker
          const p = m.getLatLng()
          onSelect(p.lat, p.lng)
        },
      }}
    />
  )
}

export function LocationCapturePage() {
  const { token } = useParams<{ token: string }>()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [pdvNombre, setPdvNombre] = useState('')
  const [zona, setZona] = useState('')
  const [gettingGPS, setGettingGPS] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function checkToken() {
      if (!token) { setPageState('invalid'); return }
      if (!isSupabaseConfigured) { setPageState('invalid'); return }

      const { data, error } = await supabase.rpc('get_location_token_info', { p_token: token })
      if (error || !data) { setPageState('invalid'); return }

      const info = data as TokenInfo
      if (!info.valid) {
        if (info.reason === 'used') setPageState('used')
        else if (info.reason === 'expired') setPageState('expired')
        else setPageState('invalid')
        return
      }
      setPdvNombre(info.pdv_nombre ?? '')
      setZona(info.zona ?? '')
      setPageState('valid')
    }
    checkToken()
  }, [token])

  function handleGPS() {
    if (!navigator.geolocation) {
      setErrorMsg('GPS no disponible en este dispositivo')
      return
    }
    setGettingGPS(true)
    setErrorMsg('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setShowMap(false)
        setGettingGPS(false)
      },
      () => {
        setErrorMsg('No se pudo obtener la ubicación GPS. Verifica que los permisos estén activos.')
        setGettingGPS(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  async function handleSubmit() {
    if (!coords || !token) return
    setSubmitting(true)
    setErrorMsg('')
    try {
      const { data, error } = await supabase.rpc('claim_location_token', {
        p_token: token,
        p_lat: coords.lat,
        p_lng: coords.lng,
      })
      if (error) throw new Error(error.message)
      const result = data as { success: boolean; error?: string }
      if (!result.success) {
        setErrorMsg(result.error ?? 'Error al registrar la ubicación')
        setSubmitting(false)
        return
      }
      setPageState('success')
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Error de conexión. Intenta nuevamente.')
      setSubmitting(false)
    }
  }

  const mapCenter: [number, number] = coords ? [coords.lat, coords.lng] : [10.48, -66.88]

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-carbon-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-mobil-red border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Verificando enlace...</p>
        </div>
      </div>
    )
  }

  // ── Error states ─────────────────────────────────────────────────────────
  if (pageState === 'used' || pageState === 'expired' || pageState === 'invalid') {
    const icon = pageState === 'used'
      ? <XCircle size={36} className="text-yellow-400" />
      : <XCircle size={36} className="text-red-400" />

    const title = pageState === 'used'
      ? 'Enlace ya utilizado'
      : pageState === 'expired'
      ? 'Enlace expirado'
      : 'Enlace no válido'

    const desc = pageState === 'used'
      ? 'Este enlace de registro fue utilizado y ya no puede volver a usarse. Si necesitas actualizar la ubicación, solicita un nuevo enlace al administrador.'
      : pageState === 'expired'
      ? 'Este enlace ha expirado. Solicita un nuevo enlace al administrador.'
      : 'Este enlace no existe o fue eliminado. Verifica que hayas recibido el enlace correcto.'

    return (
      <div className="min-h-screen bg-carbon-950 flex flex-col">
        <header className="force-dark bg-carbon-900 border-b border-white/10">
          <div className="racing-stripe" />
          <div className="flex items-center justify-center h-14">
            <img src="/mobil-logo.png" alt="Mobil" className="h-10 w-auto" />
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            pageState === 'used' ? 'bg-yellow-500/10' : 'bg-red-500/10'
          }`}>
            {icon}
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white mb-2">{title}</h1>
            <p className="text-white/50 text-sm max-w-xs">{desc}</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-carbon-950 flex flex-col">
        <header className="force-dark bg-carbon-900 border-b border-white/10">
          <div className="racing-stripe" />
          <div className="flex items-center justify-center h-14">
            <img src="/mobil-logo.png" alt="Mobil" className="h-10 w-auto" />
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-3">¡Listo!</h1>
            <p className="text-white/60 text-sm max-w-xs">
              La ubicación de{' '}
              <strong className="text-white">{pdvNombre}</strong>{' '}
              fue registrada exitosamente en el mapa.
            </p>
            <p className="text-white/25 text-xs mt-4">Ya puedes cerrar esta ventana.</p>
          </div>
          <div className="force-dark mt-2 flex items-center gap-3 bg-gradient-to-r from-mobil-blue to-mobil-red/80 rounded-xl px-5 py-3 max-w-xs w-full">
            <img src="/mobil-logo.png" alt="Mobil" className="h-7 w-auto object-contain shrink-0" />
            <p className="text-xs text-white/70 text-left">
              Distribuidores autorizados{' '}
              <strong className="text-white">Mobil Original</strong> Venezuela
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Main capture form ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-carbon-950 flex flex-col">
      {/* Header */}
      <header className="force-dark bg-carbon-900 border-b border-white/10">
        <div className="racing-stripe" />
        <div className="flex items-center justify-center h-14">
          <img src="/mobil-logo.png" alt="Mobil" className="h-10 w-auto" />
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-5">
        {/* Brand card */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Gradient header */}
          <div className="force-dark bg-gradient-to-r from-mobil-blue to-mobil-red/80 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MapPin size={22} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">
                  Registro de ubicación
                </p>
                <p className="text-base font-bold text-white leading-tight">{pdvNombre}</p>
                {zona && <p className="text-xs text-white/60 mt-0.5">{zona}</p>}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <p className="text-sm text-white/60 leading-relaxed">
              Comparte tu ubicación actual o selecciona el punto exacto de tu establecimiento en el mapa.
            </p>

            {/* GPS — primary action */}
            <button
              onClick={handleGPS}
              disabled={gettingGPS}
              className="w-full flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-colors text-sm"
            >
              {gettingGPS
                ? <><Loader size={17} className="animate-spin" /> Obteniendo ubicación GPS...</>
                : <><LocateFixed size={17} /> Usar mi ubicación GPS</>
              }
            </button>

            {/* Map picker toggle */}
            <button
              onClick={() => setShowMap((s) => !s)}
              className="w-full flex items-center justify-center gap-2 bg-carbon-700 hover:bg-carbon-600 border border-white/10 text-white/80 hover:text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              <Navigation2 size={15} />
              {showMap ? 'Ocultar mapa' : 'Elegir en el mapa'}
            </button>

            {/* Mini map */}
            {showMap && (
              <div className="animate-fade-up">
                <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 260 }}>
                  <MapContainer
                    key={`${mapCenter[0]}-${mapCenter[1]}`}
                    center={mapCenter}
                    zoom={coords ? 15 : 12}
                    className="h-full w-full"
                    zoomControl
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      subdomains="abcd"
                    />
                    <MapPicker position={mapCenter} onSelect={(lat, lng) => setCoords({ lat, lng })} />
                  </MapContainer>
                </div>
                <p className="text-[10px] text-white/30 text-center py-1.5 bg-carbon-700/60 rounded-b-xl">
                  Toca el mapa o arrastra el marcador para ajustar la ubicación
                </p>
              </div>
            )}

            {/* Coords preview */}
            {coords && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-400 font-semibold">Ubicación capturada</p>
                  <p className="text-[11px] text-white/30 font-mono mt-0.5">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </p>
                  <button
                    onClick={() => { setCoords(null); setShowMap(true) }}
                    className="text-[11px] text-white/40 hover:text-white/70 mt-1 transition-colors"
                  >
                    Cambiar ubicación
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!coords || submitting}
              className="w-full flex items-center justify-center gap-2 bg-mobil-red hover:bg-mobil-red-light active:scale-[0.98] disabled:opacity-40 text-white font-semibold py-4 rounded-xl transition-all text-sm"
            >
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : 'Confirmar y registrar ubicación'
              }
            </button>

            {/* Expiry note */}
            <div className="flex items-center gap-1.5 justify-center">
              <Clock size={11} className="text-white/20" />
              <p className="text-[10px] text-white/25">Este enlace es de uso único y tiene una validez de 7 días</p>
            </div>
          </div>
        </div>

        {/* Trust footer */}
        <div className="force-dark flex items-center gap-3 bg-gradient-to-r from-mobil-blue to-mobil-red/80 rounded-xl px-4 py-3">
          <img src="/mad4performance-logo.png" alt="Mad4Performance" className="h-8 w-auto object-contain shrink-0" />
          <p className="text-xs text-white/60 flex-1">
            Red de distribuidores autorizados{' '}
            <strong className="text-white">Mobil Original</strong> Venezuela.
          </p>
        </div>
      </div>
    </div>
  )
}
