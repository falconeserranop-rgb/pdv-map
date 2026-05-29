import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  LocateFixed, CheckCircle, XCircle, Loader, MapPin,
  Navigation2, Clock, ArrowLeft, AtSign, Phone as PhoneIcon, Link2,
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { HORARIOS_LIST } from '../lib/horarios'

type PageState = 'loading' | 'valid' | 'used' | 'expired' | 'invalid' | 'success'

interface TokenInfo {
  valid: boolean
  reason?: string
  pdv_nombre?: string
  zona?: string
  expires_at?: string
  telefono?: string | null
  instagram?: string | null
  instagram_url?: string | null
  horario?: string | null
}

// ── Map helpers ──────────────────────────────────────────────────────────────

function createPickerIcon() {
  return L.divIcon({
    html: `<div style="width:30px;height:30px;background:#CC0000;border:3.5px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 12px rgba(0,0,0,0.55)"></div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 27],
  })
}

/** Handles map click and renders a draggable marker (if position is set). */
function MapPicker({
  position,
  onSelect,
}: {
  position: [number, number] | null
  onSelect: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => onSelect(e.latlng.lat, e.latlng.lng),
  })
  if (!position) return null
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

// ── Phone formatter ───────────────────────────────────────────────────────────

/** Formats Venezuelan phone numbers as +58 4XX-XXXXXXX */
function formatPhoneVE(raw: string): string {
  let d = raw.replace(/\D/g, '') // digits only
  if (d.startsWith('58')) d = d.slice(2)    // strip country code
  else if (d.startsWith('0')) d = d.slice(1) // strip leading 0
  d = d.slice(0, 10)                          // max 10 local digits
  if (!d) return ''
  if (d.length <= 3) return `+58 ${d}`
  return `+58 ${d.slice(0, 3)}-${d.slice(3)}`
}

// ── Page component ────────────────────────────────────────────────────────────

export function LocationCapturePage() {
  const { token } = useParams<{ token: string }>()

  // ── Page state
  const [pageState, setPageState] = useState<PageState>('loading')
  const [pdvNombre, setPdvNombre] = useState('')
  const [zona, setZona] = useState('')

  // ── Restricted client fields
  const [phone, setPhone] = useState('')
  const [instaNombre, setInstaNombre] = useState('')   // display name
  const [instaUrl, setInstaUrl] = useState('')         // full link
  const [horario, setHorario] = useState('')

  // ── Coordinates
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [gettingGPS, setGettingGPS] = useState(false)

  // ── Full-screen map overlay
  const [mapFullscreen, setMapFullscreen] = useState(false)
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [mapInitCenter, setMapInitCenter] = useState<[number, number]>([10.48, -66.88])

  // ── Submit
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // ── Load token info
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
      // Pre-fill with existing data so the client can see & update
      setPhone(info.telefono ?? '')
      setInstaNombre(info.instagram ?? '')
      setInstaUrl(info.instagram_url ?? '')
      setHorario(info.horario ?? '')
      setPageState('valid')
    }
    checkToken()
  }, [token])

  // ── Handlers
  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhoneVE(e.target.value))
  }

  function handleGPS() {
    if (!navigator.geolocation) { setErrorMsg('GPS no disponible en este dispositivo'); return }
    setGettingGPS(true)
    setErrorMsg('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGettingGPS(false)
      },
      () => {
        setErrorMsg('No se pudo obtener la ubicación GPS. Verifica que los permisos estén activos.')
        setGettingGPS(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  function openFullscreenMap() {
    const center: [number, number] = coords
      ? [coords.lat, coords.lng]
      : [10.48, -66.88]
    setMapInitCenter(center)
    setTempCoords(coords)        // start marker at confirmed coords (or null)
    setMapFullscreen(true)
  }

  function confirmMap() {
    if (tempCoords) setCoords(tempCoords)
    setTempCoords(null)
    setMapFullscreen(false)
  }

  function cancelMap() {
    setTempCoords(null)
    setMapFullscreen(false)
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
        p_telefono: phone || null,
        p_instagram: instaNombre || null,
        p_instagram_url: instaUrl || null,
        p_horario: horario || null,
      })
      if (error) throw new Error(error.message)
      const result = data as { success: boolean; error?: string }
      if (!result.success) {
        setErrorMsg(result.error ?? 'Error al registrar la información')
        setSubmitting(false)
        return
      }
      setPageState('success')
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Error de conexión. Intenta nuevamente.')
      setSubmitting(false)
    }
  }

  // ── Render: Loading ─────────────────────────────────────────────────────────
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

  // ── Render: Error states ────────────────────────────────────────────────────
  if (pageState === 'used' || pageState === 'expired' || pageState === 'invalid') {
    const isWarning = pageState === 'used'
    const title = pageState === 'used'
      ? 'Enlace ya utilizado'
      : pageState === 'expired'
      ? 'Enlace expirado'
      : 'Enlace no válido'
    const desc = pageState === 'used'
      ? 'Este enlace de registro ya fue utilizado y no puede volver a usarse. Solicita un nuevo enlace al administrador si necesitas actualizar tus datos.'
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
            isWarning ? 'bg-yellow-500/10' : 'bg-red-500/10'
          }`}>
            <XCircle size={40} className={isWarning ? 'text-yellow-400' : 'text-red-400'} />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white mb-2">{title}</h1>
            <p className="text-white/50 text-sm max-w-xs leading-relaxed">{desc}</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Success ─────────────────────────────────────────────────────────
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
            <h1 className="text-2xl font-display font-bold text-white mb-3">¡Información registrada!</h1>
            <p className="text-white/60 text-sm max-w-xs leading-relaxed">
              Los datos de <strong className="text-white">{pdvNombre}</strong> fueron actualizados exitosamente.
            </p>
            <p className="text-white/25 text-xs mt-4">Ya puedes cerrar esta ventana.</p>
          </div>
          <div className="force-dark flex items-center gap-3 bg-gradient-to-r from-mobil-blue to-mobil-red/80 rounded-xl px-5 py-3 max-w-xs w-full">
            <img src="/mobil-logo.png" alt="Mobil" className="h-7 w-auto object-contain shrink-0" />
            <p className="text-xs text-white/70 text-left">
              Distribuidores autorizados <strong className="text-white">Mobil Original</strong> Venezuela
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Main form (pageState === 'valid') ────────────────────────────────
  const tempMarkerPos: [number, number] | null = tempCoords ? [tempCoords.lat, tempCoords.lng] : null

  return (
    <div className="min-h-screen bg-carbon-950 flex flex-col">

      {/* ── Full-screen map overlay ─────────────────────────────────────────── */}
      {mapFullscreen && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-carbon-950">
          {/* Top bar */}
          <div className="force-dark bg-carbon-900 border-b border-white/10 h-14 flex items-center px-4 gap-3 shrink-0">
            <button
              onClick={cancelMap}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Volver</span>
            </button>
            <p className="flex-1 text-center text-sm text-white/50 pr-16">
              {tempCoords ? 'Arrastra el marcador para ajustar' : 'Toca el mapa para colocar el marcador'}
            </p>
          </div>

          {/* Map — fills remaining height */}
          <div className="flex-1 relative" style={{ minHeight: 0 }}>
            <MapContainer
              center={mapInitCenter}
              zoom={tempCoords ? 17 : 14}
              style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              {/* OpenStreetMap: shows all buildings, streets, POIs */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <ZoomControl position="bottomright" />
              <MapPicker
                position={tempMarkerPos}
                onSelect={(lat, lng) => setTempCoords({ lat, lng })}
              />
            </MapContainer>

            {/* Center crosshair hint (when no marker placed yet) */}
            {!tempCoords && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="flex flex-col items-center gap-2">
                  <MapPin size={32} className="text-mobil-red opacity-60" />
                  <span className="text-white/50 text-xs bg-carbon-900/70 px-3 py-1 rounded-full">
                    Toca aquí para marcar
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom confirm bar */}
          <div className="force-dark bg-carbon-900/95 backdrop-blur-sm border-t border-white/10 px-4 pt-3 pb-5 shrink-0">
            {tempCoords && (
              <p className="text-[10px] text-white/30 text-center font-mono mb-2">
                {tempCoords.lat.toFixed(7)}, {tempCoords.lng.toFixed(7)}
              </p>
            )}
            <button
              onClick={confirmMap}
              disabled={!tempCoords}
              className="w-full flex items-center justify-center gap-2 bg-mobil-red hover:bg-mobil-red-light active:scale-[0.98] disabled:opacity-40 text-white font-semibold py-4 rounded-xl transition-all text-sm"
            >
              <CheckCircle size={16} />
              {tempCoords ? 'Confirmar esta ubicación' : 'Toca el mapa para continuar'}
            </button>
          </div>
        </div>
      )}

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <header className="force-dark bg-carbon-900 border-b border-white/10">
        <div className="racing-stripe" />
        <div className="flex items-center justify-center h-14">
          <img src="/mobil-logo.png" alt="Mobil" className="h-10 w-auto" />
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-5">

        {/* ── Identity card ───────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="force-dark bg-gradient-to-r from-mobil-blue to-mobil-red/80 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MapPin size={22} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">
                  Actualizar datos
                </p>
                <p className="text-base font-bold text-white leading-tight">{pdvNombre}</p>
                {zona && <p className="text-xs text-white/60 mt-0.5">{zona}</p>}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* ── Coordinates section ───────────────────────────────────── */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-3">
                Ubicación en el mapa <span className="text-mobil-red">*</span>
              </p>

              {/* GPS button */}
              <button
                onClick={handleGPS}
                disabled={gettingGPS}
                className="w-full flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm mb-2.5"
              >
                {gettingGPS
                  ? <><Loader size={16} className="animate-spin" /> Obteniendo ubicación GPS...</>
                  : <><LocateFixed size={16} /> Usar mi ubicación GPS</>
                }
              </button>

              {/* Map picker button */}
              <button
                onClick={openFullscreenMap}
                className="w-full flex items-center justify-center gap-2 bg-carbon-700 hover:bg-carbon-600 border border-white/10 text-white/80 hover:text-white font-medium py-3 rounded-xl transition-colors text-sm"
              >
                <Navigation2 size={14} />
                Elegir punto en el mapa
              </button>

              {/* Coords confirmation */}
              {coords && (
                <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                  <CheckCircle size={15} className="text-green-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-green-400 font-semibold">Ubicación capturada</p>
                    <p className="text-[11px] text-white/30 font-mono mt-0.5 truncate">
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </p>
                    <button
                      onClick={() => setCoords(null)}
                      className="text-[11px] text-white/35 hover:text-white/60 mt-1 transition-colors"
                    >
                      Cambiar ubicación
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Contact info section ──────────────────────────────────── */}
            <div className="pt-3 border-t border-white/10 space-y-4">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                Información de contacto (opcional)
              </p>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs text-white/50">
                  <PhoneIcon size={11} /> Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+58 414-1234567"
                  className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-xl px-3.5 py-3 outline-none focus:border-mobil-blue/50 transition-all font-mono placeholder:font-sans placeholder:text-white/20"
                />
              </div>

              {/* Instagram display name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs text-white/50">
                  <AtSign size={11} /> Nombre visible en Instagram
                </label>
                <input
                  type="text"
                  value={instaNombre}
                  onChange={(e) => setInstaNombre(e.target.value)}
                  placeholder="@nombre_del_negocio"
                  className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-xl px-3.5 py-3 outline-none focus:border-mobil-blue/50 transition-all placeholder:text-white/20"
                />
              </div>

              {/* Instagram URL */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs text-white/50">
                  <Link2 size={11} /> Link de Instagram
                </label>
                <input
                  type="url"
                  inputMode="url"
                  value={instaUrl}
                  onChange={(e) => setInstaUrl(e.target.value)}
                  placeholder="https://instagram.com/nombre_del_negocio"
                  className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-xl px-3.5 py-3 outline-none focus:border-mobil-blue/50 transition-all placeholder:text-white/20"
                />
              </div>

              {/* Horario */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs text-white/50">
                  <Clock size={11} /> Horario de atención
                </label>
                <select
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-xl px-3.5 py-3 outline-none focus:border-mobil-blue/50 transition-all"
                >
                  <option value="">Sin especificar</option>
                  {HORARIOS_LIST.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                  {/* Keep existing value if it's a legacy free-text entry */}
                  {horario && !HORARIOS_LIST.includes(horario) && (
                    <option value={horario}>{horario}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5 text-xs text-red-300">
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
                : 'Confirmar y guardar información'
              }
            </button>

            {!coords && (
              <p className="text-xs text-white/30 text-center">
                Primero debes capturar tu ubicación para poder guardar.
              </p>
            )}

            {/* Expiry note */}
            <div className="flex items-center gap-1.5 justify-center pt-1">
              <Clock size={10} className="text-white/20" />
              <p className="text-[10px] text-white/20">Enlace de uso único · válido por 7 días</p>
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
