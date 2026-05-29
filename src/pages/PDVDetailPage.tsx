import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ShieldCheck, Navigation2, Share2, MapPin, ArrowLeft, Phone, AtSign, Clock, Sun, Moon } from 'lucide-react'
import type { PDV } from '../types'
import { LOCAL_PDVS } from '../data/pdvs-seed'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { googleMapsUrl, whatsappShareUrl } from '../lib/geo'
import { useTheme } from '../context/ThemeContext'

function createPDVIcon() {
  const html = `<div class="pdv-marker-wrap"><div class="pdv-marker-dot"></div></div>`
  return L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 28] })
}

export function PDVDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { theme, toggleTheme } = useTheme()
  const [pdv, setPdv] = useState<PDV | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('pdvs').select('*').eq('slug', slug).single()
        if (data) { setPdv(data as PDV); setLoading(false); return }
      }
      const found = LOCAL_PDVS.find((p) => p.slug === slug)
      setPdv(found ?? null)
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-mobil-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!pdv) {
    return (
      <div className="min-h-screen bg-carbon-950 flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-6xl">&#128269;</div>
        <h1 className="text-xl font-display font-semibold text-white">PDV no encontrado</h1>
        <p className="text-white/50 text-sm text-center">
          Este punto de venta no existe o fue desactivado.
        </p>
        <Link to="/" className="flex items-center gap-2 text-mobil-red hover:text-mobil-red-light text-sm font-semibold">
          <ArrowLeft size={14} />
          Volver al mapa
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-carbon-950 flex flex-col">
      {/* Header */}
      <header className="force-dark bg-carbon-900 border-b border-white/10">
        <div className="racing-stripe" />
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} />
            Volver al mapa
          </Link>
          <img src="/mobil-logo.png" alt="Mobil" className="h-10 w-auto" />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark'
              ? <Sun size={17} className="text-white/50" />
              : <Moon size={17} className="text-white/50" />
            }
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-6">
        {/* Verification card */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Badge — force-dark keeps text white on brand gradient in light mode too */}
          <div className="force-dark bg-gradient-to-r from-mobil-blue to-mobil-red/80 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-white/70 uppercase tracking-widest font-medium">Punto de Venta Autorizado</p>
                <p className="text-sm font-bold text-white">Mobil Original &times; Mad4Performance</p>
              </div>
            </div>
          </div>

          {/* PDV info */}
          <div className="p-5 space-y-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-white">{pdv.nombre}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={13} className="text-mobil-red" />
                <span className="text-sm text-white/60">{pdv.zona}</span>
              </div>
              {pdv.direccion && (
                <p className="text-sm text-white/40 mt-1">{pdv.direccion}</p>
              )}
            </div>

            {/* Contact info */}
            {(pdv.horario || pdv.telefono || pdv.instagram) && (
              <div className="space-y-2 pt-3 border-t border-white/10">
                {pdv.horario && (
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Clock size={14} className="text-white/40" />
                    {pdv.horario}
                  </div>
                )}
                {pdv.telefono && (
                  <a href={`https://wa.me/${pdv.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-green-400">
                    <Phone size={14} />
                    {pdv.telefono}
                  </a>
                )}
                {pdv.instagram && (
                  <a href={`https://instagram.com/${pdv.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-pink-400">
                    <AtSign size={14} />
                    {pdv.instagram}
                  </a>
                )}
              </div>
            )}

            {/* Actions */}
            {pdv.latitud && pdv.longitud && (
              <div className="flex gap-3 pt-2">
                <a
                  href={googleMapsUrl(pdv.latitud, pdv.longitud, pdv.nombre)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-mobil-red hover:bg-mobil-red-light text-white text-sm font-semibold py-3 rounded-xl transition-colors"
                >
                  <Navigation2 size={15} />
                  Como llegar
                </a>
                <a
                  href={whatsappShareUrl(pdv.nombre, pdv.latitud, pdv.longitud)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  <Share2 size={15} />
                  Compartir
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Mini map */}
        {pdv.latitud && pdv.longitud && (
          <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 240 }}>
            <MapContainer
              center={[pdv.latitud, pdv.longitud]}
              zoom={15}
              zoomControl={false}
              attributionControl={false}
              className="h-full w-full"
            >
              {/* Same Voyager tiles for both modes; CSS handles dark inversion */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
              />
              <Marker position={[pdv.latitud, pdv.longitud]} icon={createPDVIcon()} />
            </MapContainer>
          </div>
        )}

        {/* Trust footer — same brand gradient as the badge above */}
        <div className="force-dark flex items-center gap-3 bg-gradient-to-r from-mobil-blue to-mobil-red/80 rounded-xl px-4 py-3">
          <img src="/mad4performance-logo.png" alt="Mad4Performance" className="h-8 w-auto object-contain shrink-0" />
          <p className="text-xs text-white/60 flex-1">
            Este establecimiento es distribuidor autorizado de{' '}
            <strong className="text-white">Lubricante Mobil Original</strong> en Venezuela.
          </p>
        </div>
      </div>
    </div>
  )
}
