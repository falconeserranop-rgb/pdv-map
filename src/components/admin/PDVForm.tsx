import { useState, useEffect } from 'react'
import { X, Save, LocateFixed, Map, Loader } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PDV, PDVFormData } from '../../types'
import { slugify } from '../../lib/geo'

interface PDVFormProps {
  pdv?: PDV | null
  onSave: (data: PDVFormData) => Promise<void>
  onClose: () => void
}

const ZONAS_LIST = [
  'CARACAS', 'GUATIRE', 'LOS TEQUES', 'SAN ANTONIO DE LOS ALTOS',
  'BARUTA', 'EL HATILLO', 'CHAGUARAMOS', 'EL PARAISO', 'CARABALLEDA',
  'CATIA LA MAR', 'LA GUAIRA', 'LAS MINAS', 'JUNKITO', 'VALLEY/COCHE',
  'VALLES DEL TUY', 'CHARALLAVE', 'CUA', 'STA. TERESA DEL TUY', 'OCUMARE',
  'PARACOTOS', 'CENTRO', 'FLORIDA', 'CANDELARIA', 'OTRO'
]

const empty: PDVFormData = {
  codigo: '', nombre: '', zona: 'CARACAS', direccion: '', latitud: '', longitud: '',
  asesor_ventas: '', activo: true, instagram: '', telefono: '', horario: '',
}

// Create a draggable marker icon
function createPickerIcon() {
  return L.divIcon({
    html: `<div style="width:20px;height:20px;background:#CC0000;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 18],
  })
}

// Map click + drag handler
function LocationSelector({
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

export function PDVForm({ pdv, onSave, onClose }: PDVFormProps) {
  const [form, setForm] = useState<PDVFormData>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [gettingGPS, setGettingGPS] = useState(false)

  useEffect(() => {
    if (pdv) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        codigo: pdv.codigo,
        nombre: pdv.nombre,
        zona: pdv.zona,
        direccion: pdv.direccion ?? '',
        latitud: pdv.latitud?.toString() ?? '',
        longitud: pdv.longitud?.toString() ?? '',
        asesor_ventas: pdv.asesor_ventas ?? '',
        activo: pdv.activo,
        instagram: pdv.instagram ?? '',
        telefono: pdv.telefono ?? '',
        horario: pdv.horario ?? '',
      })
    } else {
      setForm(empty)
    }
  }, [pdv])

  function set(field: keyof PDVFormData, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleMapSelect(lat: number, lng: number) {
    set('latitud', lat.toFixed(8))
    set('longitud', lng.toFixed(8))
  }

  function handleGetGPS() {
    if (!navigator.geolocation) { setError('GPS no disponible en este dispositivo'); return }
    setGettingGPS(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitud', pos.coords.latitude.toFixed(8))
        set('longitud', pos.coords.longitude.toFixed(8))
        setShowMap(true)
        setGettingGPS(false)
      },
      () => {
        setError('No se pudo obtener la ubicación GPS. Verifica los permisos.')
        setGettingGPS(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const hasCoords = form.latitud && form.longitud
  const mapCenter: [number, number] = hasCoords
    ? [parseFloat(form.latitud as string), parseFloat(form.longitud as string)]
    : [10.48, -66.88] // Caracas default

  const isEdit = !!pdv

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-carbon-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="font-display font-semibold text-white">{isEdit ? 'Editar PDV' : 'Nuevo PDV'}</h2>
            <p className="text-xs text-white/40 mt-0.5">{isEdit ? pdv!.nombre : 'Añadir punto de venta'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {error && (
            <div className="bg-mobil-red/10 border border-mobil-red/30 rounded-lg px-3 py-2 text-sm text-red-300">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-white/50">C&oacute;digo *</label>
              <input value={form.codigo} onChange={(e) => set('codigo', e.target.value)}
                className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="501674086" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50">Zona</label>
              <select value={form.zona} onChange={(e) => set('zona', e.target.value)}
                className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all">
                {ZONAS_LIST.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/50">Nombre del PDV *</label>
            <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
              className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="Ej: CAUCHOS AVILA" />
            {form.nombre && (
              <p className="text-[10px] text-white/30">URL: /pdv/{slugify(form.nombre)}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/50">Direcci&oacute;n</label>
            <input value={form.direccion} onChange={(e) => set('direccion', e.target.value)}
              className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="Av. Principal, Local #..." />
          </div>

          {/* Coordinates with picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/50">Ubicaci&oacute;n en el mapa</label>
              <div className="flex gap-2">
                {/* Filled bg so the button is visible in both dark and light mode */}
                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={gettingGPS}
                  className="flex items-center gap-1.5 text-xs text-white bg-mobil-blue hover:bg-mobil-blue-light rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                >
                  {gettingGPS
                    ? <Loader size={11} className="animate-spin" />
                    : <LocateFixed size={11} />
                  }
                  Mi ubicaci&oacute;n
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap((s) => !s)}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-carbon-700 hover:bg-carbon-600 border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Map size={11} />
                  {showMap ? 'Ocultar mapa' : 'Elegir en mapa'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-white/40">Latitud</label>
                <input value={form.latitud} onChange={(e) => set('latitud', e.target.value)}
                  className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all font-mono" placeholder="10.4897..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40">Longitud</label>
                <input value={form.longitud} onChange={(e) => set('longitud', e.target.value)}
                  className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all font-mono" placeholder="-66.8682..." />
              </div>
            </div>

            {/* Mini map picker */}
            {showMap && (
              <div className="rounded-xl overflow-hidden border border-white/10 animate-fade-up" style={{ height: 220 }}>
                <MapContainer
                  key={`${mapCenter[0]}-${mapCenter[1]}`}
                  center={mapCenter}
                  zoom={hasCoords ? 15 : 12}
                  className="h-full w-full"
                  zoomControl={true}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                  />
                  <LocationSelector position={mapCenter} onSelect={handleMapSelect} />
                </MapContainer>
                <p className="text-[10px] text-white/30 text-center py-1.5 bg-carbon-700/80">
                  Haz clic en el mapa o arrastra el marcador rojo para ajustar la ubicaci&oacute;n
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-white/30 mb-3 uppercase tracking-wider font-medium">Informaci&oacute;n de contacto (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-white/50">Tel&eacute;fono / WhatsApp</label>
                <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)}
                  className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="+58 424..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/50">Instagram</label>
                <input value={form.instagram} onChange={(e) => set('instagram', e.target.value)}
                  className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="@handle" />
              </div>
            </div>
            <div className="space-y-1 mt-3">
              <label className="text-xs text-white/50">Horario</label>
              <input value={form.horario} onChange={(e) => set('horario', e.target.value)}
                className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="Lun-Vie 8:00am - 5:00pm" />
            </div>
          </div>

          {/* Toggle: green = active, red = inactive; pill grows so ball never overlaps label */}
          <div className="flex items-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => set('activo', !form.activo)}
              className={`relative shrink-0 w-14 h-7 rounded-full transition-all duration-300 ${
                form.activo ? 'bg-green-500' : 'bg-mobil-red'
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                form.activo ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${
              form.activo ? 'text-green-400' : 'text-red-400'
            }`}>
              {form.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-semibold transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-mobil-red hover:bg-mobil-red-light disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Save size={14} />{isEdit ? 'Guardar cambios' : 'Crear PDV'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
