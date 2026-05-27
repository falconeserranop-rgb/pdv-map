import { ZONAS } from '../../data/pdvs-seed'

interface ZoneFiltersProps {
  active: string
  onChange: (zone: string) => void
}

export function ZoneFilters({ active, onChange }: ZoneFiltersProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => onChange('')}
        className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-all font-medium ${
          active === ''
            ? 'bg-mobil-red border-mobil-red text-white'
            : 'bg-transparent border-white/15 text-white/50 hover:border-white/30 hover:text-white/80'
        }`}
      >
        Todos
      </button>
      {ZONAS.map((z) => (
        <button
          key={z}
          onClick={() => onChange(active === z ? '' : z)}
          className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-all font-medium whitespace-nowrap ${
            active === z
              ? 'bg-mobil-red border-mobil-red text-white'
              : 'bg-transparent border-white/15 text-white/50 hover:border-white/30 hover:text-white/80'
          }`}
        >
          {z}
        </button>
      ))}
    </div>
  )
}
