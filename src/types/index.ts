export interface PDV {
  id: string
  codigo: string
  nombre: string
  zona: string
  direccion?: string | null
  latitud: number | null
  longitud: number | null
  asesor_ventas?: string | null
  activo: boolean
  slug: string
  instagram?: string | null
  instagram_url?: string | null
  telefono?: string | null
  horario?: string | null
  imagen_url?: string | null
  created_at?: string
  updated_at?: string
  // Computed
  distancia?: number
}

export interface PDVFormData {
  codigo: string
  nombre: string
  zona: string
  direccion: string
  latitud: string
  longitud: string
  asesor_ventas: string
  activo: boolean
  instagram: string
  instagram_url: string
  telefono: string
  horario: string
}

export type SortMode = 'nearest' | 'az'

export interface AdminProfile {
  id: string
  email: string
  nombre?: string
  rol: 'superadmin' | 'admin'
}

export interface ImportResult {
  imported: number
  duplicates: number
  errors: number
  errorDetails: string[]
  noCoords: number
}

export interface AuditLog {
  id: string
  admin_id: string
  accion: 'create' | 'update' | 'delete' | 'import' | 'toggle_active'
  tabla: string
  registro_id?: string
  datos_anteriores?: Record<string, unknown>
  datos_nuevos?: Record<string, unknown>
  created_at: string
}

export interface ZoneStats {
  zona: string
  total: number
  activos: number
}
