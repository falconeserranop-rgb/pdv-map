// ── Day definitions ───────────────────────────────────────────────────────────

export const DAY_KEYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const
export type DayKey = (typeof DAY_KEYS)[number]

export const DAY_LABEL: Record<DayKey, string> = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo',
}

export const DAY_SHORT: Record<DayKey, string> = {
  lun: 'Lun', mar: 'Mar', mie: 'Mié',
  jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom',
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DaySchedule {
  open: string | null   // "08:00" (24h), null = closed
  close: string | null
}

export type WeekSchedule = Record<DayKey, DaySchedule>

// ── Defaults ──────────────────────────────────────────────────────────────────

const CLOSED: DaySchedule = { open: null, close: null }
const OPEN_STD: DaySchedule = { open: '08:00', close: '17:00' }

export const PRESETS: { label: string; schedule: WeekSchedule }[] = [
  {
    label: 'Lun–Vie',
    schedule: { lun: OPEN_STD, mar: OPEN_STD, mie: OPEN_STD, jue: OPEN_STD, vie: OPEN_STD, sab: CLOSED, dom: CLOSED },
  },
  {
    label: 'Lun–Sáb',
    schedule: { lun: OPEN_STD, mar: OPEN_STD, mie: OPEN_STD, jue: OPEN_STD, vie: OPEN_STD, sab: OPEN_STD, dom: CLOSED },
  },
  {
    label: 'Todos los días',
    schedule: { lun: OPEN_STD, mar: OPEN_STD, mie: OPEN_STD, jue: OPEN_STD, vie: OPEN_STD, sab: OPEN_STD, dom: OPEN_STD },
  },
]

export const DEFAULT_WEEK: WeekSchedule = PRESETS[0].schedule

// ── Parse / Serialize ─────────────────────────────────────────────────────────

/** Returns WeekSchedule if the value is valid JSON, null otherwise (plain text). */
export function parseWeekSchedule(value: string | null | undefined): WeekSchedule | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && 'lun' in parsed) return parsed as WeekSchedule
  } catch { /* not JSON */ }
  return null
}

export function serializeWeekSchedule(s: WeekSchedule): string {
  return JSON.stringify(s)
}

// ── Time helpers ──────────────────────────────────────────────────────────────

/** "08:00" → "8:00am",  "13:30" → "1:30pm",  "00:00" → "12:00am" */
export function to12h(t: string): string {
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr)
  const ampm = h < 12 ? 'am' : 'pm'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${mStr}${ampm}`
}

// ── Format for display ────────────────────────────────────────────────────────

/**
 * Merges consecutive days with the same hours into ranges, e.g.
 * Lun-Vie: 8:00am – 5:00pm · Sáb-Dom: Cerrado
 */
function buildGroups(s: WeekSchedule): { keys: DayKey[]; open: string | null; close: string | null }[] {
  const groups: { keys: DayKey[]; open: string | null; close: string | null }[] = []
  for (const key of DAY_KEYS) {
    const { open, close } = s[key]
    const last = groups[groups.length - 1]
    if (last && last.open === open && last.close === close) {
      last.keys.push(key)
    } else {
      groups.push({ keys: [key], open, close })
    }
  }
  return groups
}

function groupLabel(keys: DayKey[]): string {
  if (keys.length === 1) return DAY_SHORT[keys[0]]
  return `${DAY_SHORT[keys[0]]}-${DAY_SHORT[keys[keys.length - 1]]}`
}

/**
 * Returns an array of display lines (one per period), e.g.:
 * ["Lun-Vie: 8:00am – 5:00pm", "Sáb: 8:00am – 3:00pm", "Dom: Cerrado"]
 *
 * For legacy plain-text values, returns a single-element array.
 */
export function formatHorarioLines(horario: string | null | undefined): string[] {
  if (!horario) return []
  const s = parseWeekSchedule(horario)
  if (!s) return [horario]               // legacy plain text
  return buildGroups(s).map((g) => {
    if (!g.open || !g.close) return `${groupLabel(g.keys)}: Cerrado`
    return `${groupLabel(g.keys)}: ${to12h(g.open)} – ${to12h(g.close)}`
  })
}

/**
 * Compact single-line format for map popups, e.g.:
 * "Lun-Vie: 8:00am – 5:00pm · Sáb: 8:00am – 3:00pm"
 * Closed-only groups are omitted if there is at least one open group.
 */
export function formatHorarioCompact(horario: string | null | undefined): string | null {
  if (!horario) return null
  const s = parseWeekSchedule(horario)
  if (!s) return horario
  const groups = buildGroups(s)
  const openGroups = groups.filter((g) => g.open)
  const parts = (openGroups.length > 0 ? openGroups : groups).map((g) => {
    if (!g.open || !g.close) return `${groupLabel(g.keys)}: Cerrado`
    return `${groupLabel(g.keys)}: ${to12h(g.open)} – ${to12h(g.close)}`
  })
  return parts.join(' · ')
}
