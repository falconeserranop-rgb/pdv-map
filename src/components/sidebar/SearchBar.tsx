import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar punto de venta..."
        className="w-full bg-carbon-700 border border-white/10 text-sm text-white placeholder:text-white/30 rounded-lg pl-9 pr-8 py-2.5 outline-none focus:border-mobil-red/60 focus:bg-carbon-600 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
