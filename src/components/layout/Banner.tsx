import { ShieldCheck } from 'lucide-react'

export function Banner() {
  return (
    <div className="force-dark relative overflow-hidden bg-gradient-to-r from-mobil-blue via-carbon-800 to-mobil-red/80 border-b border-white/10">
      {/* Carbon texture overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }}
      />
      <div className="relative flex items-center justify-center gap-2.5 px-4 py-2">
        <ShieldCheck size={15} className="text-white/80 shrink-0" />
        <p className="text-center text-xs sm:text-sm font-medium text-white/90 tracking-wide">
          Todos cuentan con{' '}
          <span className="font-bold text-white">Lubricante Mobil Original</span>
          {' '}garantizado por{' '}
          <span className="font-bold text-white">Mad4Performance</span>
        </p>
        <ShieldCheck size={15} className="text-white/80 shrink-0" />
      </div>
    </div>
  )
}
