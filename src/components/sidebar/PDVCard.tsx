import { MapPin, Navigation2, Share2, ChevronRight } from 'lucide-react'
import type { PDV } from '../../types'
import { googleMapsUrl, whatsappShareUrl, formatDistance } from '../../lib/geo'

interface PDVCardProps {
  pdv: PDV
  isSelected: boolean
  isNearest: boolean
  onClick: () => void
}

export function PDVCard({ pdv, isSelected, isNearest, onClick }: PDVCardProps) {
  const hasCoords = pdv.latitud != null && pdv.longitud != null

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`group relative rounded-xl p-3 cursor-pointer transition-all border animate-fade-up select-none ${
        isSelected
          ? 'bg-mobil-red/10 border-mobil-red/50 shadow-glow-red'
          : 'bg-carbon-700/60 border-white/5 hover:bg-carbon-700 hover:border-white/15 active:scale-[0.99]'
      }`}
    >
      {/* Nearest badge */}
      {isNearest && (
        <div className="absolute -top-2 left-3 flex items-center gap-1">
          <span className="bg-mobil-blue text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            M&aacute;s cercano
          </span>
        </div>
      )}

      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
          isSelected
            ? 'bg-mobil-red/20 border-mobil-red/50'
            : 'bg-carbon-600 border-white/10 group-hover:border-white/20'
        }`}>
          <MapPin size={14} className={isSelected ? 'text-mobil-red' : 'text-white/50'} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-tight truncate ${isSelected ? 'text-white' : 'text-white/90'}`}>
            {pdv.nombre}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-white/40">{pdv.zona}</span>
            {pdv.distancia !== undefined && pdv.distancia !== Infinity && (
              <>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-xs text-mobil-blue font-medium">{formatDistance(pdv.distancia)}</span>
              </>
            )}
          </div>
        </div>

        <ChevronRight
          size={14}
          className={`shrink-0 mt-1.5 transition-transform duration-200 ${
            isSelected ? 'rotate-90 text-mobil-red' : 'text-white/20 group-hover:text-white/40'
          }`}
        />
      </div>

      {/* Action buttons */}
      {hasCoords && (
        <div className={`flex gap-2 mt-3 pt-2.5 border-t transition-colors ${
          isSelected ? 'border-mobil-red/20' : 'border-white/5'
        }`}>
          <a
            href={googleMapsUrl(pdv.latitud!, pdv.longitud!, pdv.nombre)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-mobil-red/80 hover:bg-mobil-red active:bg-mobil-red-light text-white text-[11px] font-semibold py-2 rounded-lg transition-colors"
          >
            <Navigation2 size={11} />
            Maps
          </a>
          <a
            href={whatsappShareUrl(pdv.nombre, pdv.latitud!, pdv.longitud!)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 active:bg-[#25D366]/30 border border-[#25D366]/20 text-[#25D366] text-[11px] font-semibold py-2 px-3 rounded-lg transition-colors"
            title="Compartir"
          >
            <Share2 size={11} />
          </a>
        </div>
      )}
    </div>
  )
}
