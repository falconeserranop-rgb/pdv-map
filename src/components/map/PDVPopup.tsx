import { ExternalLink, Navigation2, Share2, MapPin, Phone, AtSign, Clock } from 'lucide-react'
import type { PDV } from '../../types'
import { googleMapsUrl, whatsappShareUrl, formatDistance } from '../../lib/geo'

interface PDVPopupProps {
  pdv: PDV
  isNearest?: boolean
}

export function PDVPopup({ pdv, isNearest }: PDVPopupProps) {
  const lat = pdv.latitud!
  const lon = pdv.longitud!

  return (
    <div className="w-72 animate-fade-up">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        {isNearest && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="bg-mobil-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              El m&aacute;s cercano
            </span>
            {pdv.distancia !== undefined && (
              <span className="text-white/50 text-xs">&middot; {formatDistance(pdv.distancia)}</span>
            )}
          </div>
        )}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-mobil-red/20 border border-mobil-red/40 flex items-center justify-center shrink-0">
            <MapPin size={14} className="text-mobil-red" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-white leading-tight">
              {pdv.nombre}
            </h3>
            <p className="text-xs text-white/50 mt-0.5">{pdv.zona}</p>
          </div>
        </div>
        {pdv.direccion && (
          <p className="text-xs text-white/40 mt-2 pl-10">{pdv.direccion}</p>
        )}
      </div>

      {/* Extra info */}
      {(pdv.horario || pdv.telefono || pdv.instagram) && (
        <div className="px-4 py-2.5 border-b border-white/10 space-y-1.5">
          {pdv.horario && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Clock size={11} className="text-white/40" />
              <span>{pdv.horario}</span>
            </div>
          )}
          {pdv.telefono && (
            <a
              href={`https://wa.me/${pdv.telefono.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              <Phone size={11} />
              <span>{pdv.telefono}</span>
            </a>
          )}
          {(pdv.instagram || pdv.instagram_url) && (
            <a
              href={pdv.instagram_url ?? `https://instagram.com/${(pdv.instagram ?? '').replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-pink-400 hover:text-pink-300 transition-colors"
            >
              <AtSign size={11} />
              <span>{pdv.instagram ?? pdv.instagram_url}</span>
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex gap-2">
        <a
          href={googleMapsUrl(lat, lon, pdv.nombre)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 bg-mobil-red hover:bg-mobil-red-light text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
        >
          <Navigation2 size={12} />
          C&oacute;mo llegar
        </a>
        <a
          href={whatsappShareUrl(pdv.nombre, lat, lon)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
          title="Compartir por WhatsApp"
        >
          <Share2 size={12} />
        </a>
        <a
          href={`/pdv/${pdv.slug}`}
          className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
          title="Ver p&aacute;gina del PDV"
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}
