import { useState, useEffect, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  DAY_KEYS, DAY_LABEL, DAY_SHORT,
  type DayKey, type WeekSchedule,
  DEFAULT_WEEK, PRESETS,
  parseWeekSchedule, serializeWeekSchedule, to12h,
} from '../../lib/horario-utils'

// ── Time option list ──────────────────────────────────────────────────────────

const TIMES: { value: string; label: string }[] = []
for (let h = 6; h <= 23; h++) {
  for (const m of [0, 30]) {
    const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    TIMES.push({ value, label: to12h(value) })
  }
}
TIMES.push({ value: '00:00', label: '12:00am' }) // midnight

// ── Component ────────────────────────────────────────────────────────────────

interface HorarioBuilderProps {
  value: string
  onChange: (value: string) => void
  /** Compact row layout for mobile (client page). Defaults to false (admin). */
  compact?: boolean
}

export function HorarioBuilder({ value, onChange, compact = false }: HorarioBuilderProps) {
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    return parseWeekSchedule(value) ?? { ...DEFAULT_WEEK }
  })
  const [copiedDay, setCopiedDay] = useState<DayKey | null>(null)
  const lastEmitted = useRef<string>('')

  // Sync when parent sends a different value (e.g. initial load from DB)
  useEffect(() => {
    if (value !== lastEmitted.current) {
      const parsed = parseWeekSchedule(value)
      if (parsed) {
        setSchedule(parsed)
        lastEmitted.current = value
      }
    }
  }, [value])

  function emit(newSchedule: WeekSchedule) {
    const s = serializeWeekSchedule(newSchedule)
    lastEmitted.current = s
    onChange(s)
    return newSchedule
  }

  function toggleDay(key: DayKey) {
    const day = schedule[key]
    const newDay = day.open
      ? { open: null, close: null }
      : { open: '08:00', close: '17:00' }
    const newSchedule = { ...schedule, [key]: newDay }
    setSchedule(newSchedule)
    emit(newSchedule)
  }

  function setTime(key: DayKey, field: 'open' | 'close', val: string) {
    const newSchedule = { ...schedule, [key]: { ...schedule[key], [field]: val } }
    setSchedule(newSchedule)
    emit(newSchedule)
  }

  function copyToAll(key: DayKey) {
    const source = schedule[key]
    const newSchedule = { ...schedule }
    for (const k of DAY_KEYS) newSchedule[k] = { ...source }
    setSchedule(newSchedule)
    emit(newSchedule)
    setCopiedDay(key)
    setTimeout(() => setCopiedDay(null), 1400)
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    setSchedule({ ...preset.schedule })
    emit({ ...preset.schedule })
  }

  const selectCls = `bg-carbon-700 border border-white/10 text-xs text-white rounded-lg px-2 py-1.5 outline-none focus:border-mobil-blue/50 transition-colors`

  return (
    <div className="space-y-2">
      {/* ── Day rows ────────────────────────────────────────────────────── */}
      {DAY_KEYS.map((key) => {
        const day = schedule[key]
        const isOpen = !!day.open
        const copied = copiedDay === key

        return (
          <div key={key} className="flex items-center gap-2 min-h-[32px]">
            {/* Day toggle button */}
            <button
              type="button"
              onClick={() => toggleDay(key)}
              title={isOpen ? 'Clic para cerrar este día' : 'Clic para abrir este día'}
              className={`shrink-0 text-xs font-semibold rounded-lg transition-all ${
                compact ? 'w-[38px] py-1' : 'w-[52px] py-1.5'
              } ${
                isOpen
                  ? 'bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25'
                  : 'bg-carbon-700 text-white/25 border border-white/5 hover:text-white/50'
              }`}
            >
              {compact ? DAY_SHORT[key] : DAY_LABEL[key].slice(0, 5)}
            </button>

            {isOpen ? (
              <>
                {/* Opening time */}
                <select
                  value={day.open ?? '08:00'}
                  onChange={(e) => setTime(key, 'open', e.target.value)}
                  className={`${selectCls} flex-1`}
                >
                  {TIMES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                <span className="text-white/25 text-xs shrink-0">–</span>

                {/* Closing time */}
                <select
                  value={day.close ?? '17:00'}
                  onChange={(e) => setTime(key, 'close', e.target.value)}
                  className={`${selectCls} flex-1`}
                >
                  {TIMES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                {/* Copy-to-all button */}
                <button
                  type="button"
                  onClick={() => copyToAll(key)}
                  title="Copiar este horario a todos los días"
                  className={`shrink-0 p-1.5 rounded-lg transition-all ${
                    copied
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-carbon-700 text-white/30 hover:bg-carbon-600 hover:text-white/60'
                  }`}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs text-white/20 pl-1">Cerrado</span>
                {/* Copy-to-all (copy closed state) */}
                <button
                  type="button"
                  onClick={() => copyToAll(key)}
                  title="Marcar todos los días como cerrado"
                  className="shrink-0 p-1.5 rounded-lg bg-carbon-700 text-white/20 hover:bg-carbon-600 hover:text-white/40 transition-all"
                >
                  {copiedDay === key ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </>
            )}
          </div>
        )
      })}

      {/* ── Preset buttons ───────────────────────────────────────────────── */}
      <div className="flex gap-1.5 pt-1.5 border-t border-white/5">
        <span className="text-[10px] text-white/20 self-center mr-1 shrink-0">Presets:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="flex-1 text-[10px] text-white/40 hover:text-white/80 bg-carbon-700/50 hover:bg-carbon-700 rounded-lg py-1.5 transition-colors font-medium"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Preview ─────────────────────────────────────────────────────── */}
      <SchedulePreview schedule={schedule} />
    </div>
  )
}

// ── Inline preview ────────────────────────────────────────────────────────────

function SchedulePreview({ schedule }: { schedule: WeekSchedule }) {
  // Build groups
  const groups: { keys: DayKey[]; open: string | null; close: string | null }[] = []
  for (const key of DAY_KEYS) {
    const { open, close } = schedule[key]
    const last = groups[groups.length - 1]
    if (last && last.open === open && last.close === close) last.keys.push(key)
    else groups.push({ keys: [key], open, close })
  }

  const lines = groups.map((g) => {
    const label = g.keys.length === 1
      ? DAY_SHORT[g.keys[0]]
      : `${DAY_SHORT[g.keys[0]]}-${DAY_SHORT[g.keys[g.keys.length - 1]]}`
    if (!g.open || !g.close) return { label, time: 'Cerrado', closed: true }
    return { label, time: `${to12h(g.open)} – ${to12h(g.close)}`, closed: false }
  })

  return (
    <div className="bg-carbon-900/60 border border-white/5 rounded-lg px-3 py-2.5 space-y-1">
      <p className="text-[9px] text-white/20 uppercase tracking-widest font-medium mb-1.5">Vista previa</p>
      {lines.map((l) => (
        <div key={l.label} className="flex justify-between items-baseline gap-2">
          <span className="text-[11px] text-white/40 font-medium">{l.label}</span>
          <span className={`text-[11px] ${l.closed ? 'text-white/20' : 'text-white/70'}`}>{l.time}</span>
        </div>
      ))}
    </div>
  )
}
