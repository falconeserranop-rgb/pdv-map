import { useState, useEffect, useMemo } from 'react'
import type { PDV, SortMode } from '../types'
import { LOCAL_PDVS } from '../data/pdvs-seed'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { haversineKm } from '../lib/geo'
import type { GeoPosition } from './useGeolocation'

export function usePDVs(userPosition: GeoPosition | null, sortMode: SortMode, search: string, zone: string) {
  const [pdvs, setPdvs] = useState<PDV[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('pdvs')
          .select('*')
          .eq('activo', true)
        if (!error && data) {
          setPdvs(data as PDV[])
          setLoading(false)
          return
        }
      }
      // Fallback to local seed
      setPdvs(LOCAL_PDVS.filter((p) => p.activo))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    // Solo mostrar PDVs con coordenadas
    let list = pdvs.filter((p) => p.latitud != null && p.longitud != null)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.zona.toLowerCase().includes(q) ||
          (p.direccion ?? '').toLowerCase().includes(q)
      )
    }

    if (zone) {
      list = list.filter((p) => p.zona === zone)
    }

    if (userPosition && sortMode === 'nearest') {
      list = list
        .map((p) => ({
          ...p,
          distancia:
            p.latitud && p.longitud
              ? haversineKm(userPosition.lat, userPosition.lon, p.latitud, p.longitud)
              : Infinity,
        }))
        .sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity))
    } else {
      list = list.sort((a, b) => a.nombre.localeCompare(b.nombre))
    }

    return list
  }, [pdvs, userPosition, sortMode, search, zone])

  return { pdvs: filtered, loading }
}
