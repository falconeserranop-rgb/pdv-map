import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LogOut, Plus, Upload, Download, Search, MapPin, CheckCircle,
  XCircle, AlertCircle, Edit2, Trash2,
  BarChart2, Map, LocateFixed, Loader
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { PDV, PDVFormData, ImportResult, ZoneStats } from '../../types'
import { LOCAL_PDVS } from '../../data/pdvs-seed'
import { slugify } from '../../lib/geo'
import { PDVForm } from '../../components/admin/PDVForm'
import { CSVImport } from '../../components/admin/CSVImport'

type Tab = 'pdvs' | 'stats' | 'nocoords'

export function DashboardPage() {
  const [pdvs, setPdvs] = useState<PDV[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('pdvs')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingPDV, setEditingPDV] = useState<PDV | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [gpsLoadingId, setGpsLoadingId] = useState<string | null>(null)
  const navigate = useNavigate()

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadPDVs() {
    setLoading(true)
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('pdvs').select('*').order('nombre')
      if (!error && data) { setPdvs(data as PDV[]); setLoading(false); return }
    }
    setPdvs([...LOCAL_PDVS].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setLoading(false)
  }

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) navigate('/admin/login')
        else loadPDVs()
      })
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPDVs()
    }
  }, [navigate])

  async function handleLogout() {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    navigate('/admin/login')
  }

  async function handleSavePDV(data: PDVFormData) {
    const record = {
      codigo: data.codigo,
      nombre: data.nombre.toUpperCase(),
      zona: data.zona,
      direccion: data.direccion || null,
      latitud: data.latitud ? parseFloat(data.latitud) : null,
      longitud: data.longitud ? parseFloat(data.longitud) : null,
      asesor_ventas: data.asesor_ventas || null,
      activo: data.activo,
      slug: slugify(data.nombre),
      instagram: data.instagram || null,
      telefono: data.telefono || null,
      horario: data.horario || null,
    }

    if (isSupabaseConfigured) {
      if (editingPDV) {
        const { error } = await supabase.from('pdvs').update(record).eq('id', editingPDV.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from('pdvs').insert(record)
        if (error) throw new Error(error.message)
      }
    } else {
      if (editingPDV) {
        setPdvs((list) => list.map((p) => p.id === editingPDV.id ? { ...p, ...record } : p))
      } else {
        const newPDV: PDV = { ...record, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        setPdvs((list) => [...list, newPDV].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      }
    }

    await loadPDVs()
    setEditingPDV(null)
    showToast(editingPDV ? 'PDV actualizado correctamente' : 'PDV creado correctamente')
  }

  async function handleToggleActive(pdv: PDV) {
    if (isSupabaseConfigured) {
      await supabase.from('pdvs').update({ activo: !pdv.activo }).eq('id', pdv.id)
    } else {
      setPdvs((list) => list.map((p) => p.id === pdv.id ? { ...p, activo: !p.activo } : p))
    }
    await loadPDVs()
    showToast(`${pdv.nombre} ${!pdv.activo ? 'activado' : 'desactivado'}`)
  }

  async function handleDelete(pdv: PDV) {
    if (!window.confirm(`¿Eliminar "${pdv.nombre}"? Esta acción no se puede deshacer.`)) return
    if (isSupabaseConfigured) {
      await supabase.from('pdvs').delete().eq('id', pdv.id)
    } else {
      setPdvs((list) => list.filter((p) => p.id !== pdv.id))
    }
    await loadPDVs()
    showToast(`${pdv.nombre} eliminado`, 'err')
  }

  async function handleQuickGPS(pdv: PDV) {
    if (!navigator.geolocation) { showToast('GPS no disponible en este dispositivo', 'err'); return }
    setGpsLoadingId(pdv.id)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(8))
        const lng = parseFloat(pos.coords.longitude.toFixed(8))
        try {
          if (isSupabaseConfigured) {
            const { error } = await supabase.from('pdvs').update({ latitud: lat, longitud: lng }).eq('id', pdv.id)
            if (error) throw new Error(error.message)
          } else {
            setPdvs((list) => list.map((p) => p.id === pdv.id ? { ...p, latitud: lat, longitud: lng } : p))
          }
          await loadPDVs()
          showToast(`Ubicación de ${pdv.nombre} guardada`)
        } catch (e: unknown) {
          showToast(e instanceof Error ? e.message : 'Error al guardar ubicación', 'err')
        } finally {
          setGpsLoadingId(null)
        }
      },
      () => {
        showToast('No se pudo obtener la ubicación GPS. Verifica los permisos.', 'err')
        setGpsLoadingId(null)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleImport(records: PDVFormData[]): Promise<ImportResult> {
    let imported = 0, errors = 0
    const errorDetails: string[] = []
    const noCoords = records.filter((r) => !r.latitud || !r.longitud).length

    for (const r of records) {
      try {
        await handleSavePDV(r)
        imported++
      } catch (e: unknown) {
        errors++
        errorDetails.push(e instanceof Error ? e.message : 'Error')
      }
    }
    return { imported, duplicates: 0, errors, errorDetails, noCoords }
  }

  function exportCSV() {
    const headers = 'codigo,nombre,zona,direccion,latitud,longitud,asesor_ventas,activo,telefono,instagram,horario'
    const rows = pdvs.map((p) =>
      [p.codigo, p.nombre, p.zona, p.direccion ?? '', p.latitud ?? '', p.longitud ?? '',
       p.asesor_ventas ?? '', p.activo, p.telefono ?? '', p.instagram ?? '', p.horario ?? ''].join(',')
    )
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'pdvs-mobil.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() =>
    pdvs.filter((p) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return p.nombre.toLowerCase().includes(q) || p.zona.toLowerCase().includes(q) || p.codigo.includes(q)
    }), [pdvs, search])

  const noCoordsPDVs = useMemo(() => pdvs.filter((p) => !p.latitud || !p.longitud), [pdvs])

  const stats = useMemo(() => ({
    total: pdvs.length,
    activos: pdvs.filter((p) => p.activo).length,
    inactivos: pdvs.filter((p) => !p.activo).length,
    conCoords: pdvs.filter((p) => p.latitud && p.longitud).length,
    sinCoords: noCoordsPDVs.length,
  }), [pdvs, noCoordsPDVs])

  const zoneStats: ZoneStats[] = useMemo(() => {
    const zmap = new globalThis.Map<string, ZoneStats>()
    pdvs.forEach((p) => {
      const s = zmap.get(p.zona) ?? { zona: p.zona, total: 0, activos: 0 }
      s.total++
      if (p.activo) s.activos++
      zmap.set(p.zona, s)
    })
    return [...zmap.values()].sort((a, b) => b.total - a.total)
  }, [pdvs])

  return (
    <div className="min-h-screen bg-carbon-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-carbon-900 border-b border-white/10">
        <div className="racing-stripe" />
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <img src="/mobil-logo.png" alt="Mobil" className="h-7 w-auto" />
            <span className="text-white/30 text-sm">|</span>
            <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors">
              <Map size={12} /> Ver mapa
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors">
              <LogOut size={12} /> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto w-full">
        {/* Stats — 3 cols on mobile so all 5 fit without an orphan */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-carbon-700' },
            { label: 'Activos', value: stats.activos, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Inactivos', value: stats.inactivos, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'En mapa', value: stats.conCoords, color: 'text-mobil-blue', bg: 'bg-mobil-blue/10' },
            { label: 'Sin ubic.', value: stats.sinCoords, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border border-white/10 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3`}>
              <p className={`text-xl sm:text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
              <p className="text-[10px] sm:text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + actions — stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          {/* Tab group */}
          <div className="flex gap-1 bg-carbon-800 rounded-lg p-1 overflow-x-auto shrink-0">
            {(['pdvs', 'stats', 'nocoords'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tab === t ? 'bg-mobil-red text-white' : 'text-white/50 hover:text-white'}`}>
                {t === 'pdvs' ? 'PDVs'
                  : t === 'stats' ? 'Por zona'
                  : <><span className="sm:hidden">Sin coords ({stats.sinCoords})</span><span className="hidden sm:inline">Sin ubicación ({stats.sinCoords})</span></>
                }
              </button>
            ))}
          </div>

          {/* Action buttons — icon-only labels on mobile */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/15 rounded-lg px-3 py-1.5 transition-colors">
              <Download size={12} /> <span className="hidden sm:inline">Exportar CSV</span><span className="sm:hidden">Exportar</span>
            </button>
            <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-carbon-700 border border-white/15 rounded-lg px-3 py-1.5 transition-colors">
              <Upload size={12} /> <span className="hidden sm:inline">Importar CSV</span><span className="sm:hidden">Importar</span>
            </button>
            <button onClick={() => { setEditingPDV(null); setShowForm(true) }}
              className="flex items-center gap-1.5 text-xs text-white bg-mobil-red hover:bg-mobil-red-light rounded-lg px-3 py-1.5 transition-colors">
              <Plus size={12} /> <span className="hidden sm:inline">Nuevo PDV</span><span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Tab: PDVs */}
        {tab === 'pdvs' && (
          <div className="bg-carbon-900 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <div className="relative max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, zona, código..."
                  className="w-full bg-carbon-700 border border-white/10 text-xs text-white placeholder:text-white/25 rounded-lg pl-8 pr-3 py-2 outline-none focus:border-mobil-blue/40 transition-all" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/30 border-b border-white/10 text-xs">
                    <th className="text-left px-3 py-3 font-medium">Nombre</th>
                    <th className="hidden sm:table-cell text-left px-3 py-3 font-medium">Zona</th>
                    <th className="hidden md:table-cell text-left px-3 py-3 font-medium">Código</th>
                    <th className="text-center px-2 py-3 font-medium">Mapa</th>
                    <th className="text-center px-2 py-3 font-medium">Estado</th>
                    <th className="text-right px-3 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td colSpan={6} className="px-3 py-3">
                          <div className="h-4 bg-carbon-700/40 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-white/30">
                        No se encontraron PDVs
                      </td>
                    </tr>
                  ) : (
                    filtered.map((pdv) => (
                      <tr key={pdv.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <MapPin size={11} className={`shrink-0 ${pdv.latitud ? 'text-mobil-red' : 'text-white/20'}`} />
                            <div className="min-w-0">
                              <span className="font-medium text-white/90 block truncate max-w-[140px] sm:max-w-none">{pdv.nombre}</span>
                              <span className="sm:hidden text-white/40 text-[10px]">{pdv.zona}</span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2.5 text-white/50">{pdv.zona}</td>
                        <td className="hidden md:table-cell px-3 py-2.5 text-white/30 font-mono">{pdv.codigo}</td>
                        {/* Mapa — larger icon */}
                        <td className="px-2 py-3 text-center">
                          {pdv.latitud && pdv.longitud
                            ? <CheckCircle size={22} className="text-green-400 mx-auto" />
                            : <XCircle size={22} className="text-white/25 mx-auto" />
                          }
                        </td>
                        {/* Estado — custom pill toggle, green=active / red=inactive */}
                        <td className="px-2 py-3 text-center">
                          {/* p-0 removes browser button padding; left-0.5+top-0.5 anchor the ball.
                               w-12(48px) – ball w-5(20px) – 2×0.5(4px) = 24px travel → translate-x-6 */}
                          <button
                            onClick={() => handleToggleActive(pdv)}
                            title={pdv.activo ? 'Desactivar' : 'Activar'}
                            className={`relative p-0 inline-flex shrink-0 w-12 h-6 rounded-full overflow-hidden transition-all duration-300 mx-auto ${
                              pdv.activo ? 'bg-green-500' : 'bg-mobil-red/80'
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                              pdv.activo ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </button>
                        </td>
                        {/* Acciones — large tappable buttons */}
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setEditingPDV(pdv); setShowForm(true) }}
                              title="Editar"
                              className="flex items-center justify-center w-9 h-9 rounded-xl bg-mobil-blue/10 hover:bg-mobil-blue/25 text-mobil-blue transition-colors"
                            >
                              <Edit2 size={17} />
                            </button>
                            <button
                              onClick={() => handleDelete(pdv)}
                              title="Eliminar"
                              className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-colors"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Stats by zone */}
        {tab === 'stats' && (
          <div className="bg-carbon-900 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <BarChart2 size={15} className="text-mobil-red" />
              <span className="text-sm font-semibold text-white">PDVs por zona</span>
            </div>
            <div className="p-4 space-y-2">
              {zoneStats.map((s) => (
                <div key={s.zona} className="flex items-center gap-3">
                  <span className="w-44 text-xs text-white/60 truncate">{s.zona}</span>
                  <div className="flex-1 bg-carbon-700 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-mobil-red rounded-full transition-all"
                      style={{ width: `${(s.total / stats.total) * 100}%` }} />
                  </div>
                  <span className="text-xs text-white/40 w-8 text-right">{s.total}</span>
                  <span className="text-xs text-green-400 w-8 text-right">{s.activos} act.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: No coords */}
        {tab === 'nocoords' && (
          <div className="bg-carbon-900 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <AlertCircle size={15} className="text-yellow-400" />
              <span className="text-sm font-semibold text-white">PDVs sin coordenadas ({noCoordsPDVs.length})</span>
              <span className="text-xs text-white/30 ml-1">— Edítalos para añadir su ubicación en el mapa</span>
            </div>
            <div className="divide-y divide-white/5">
              {noCoordsPDVs.map((pdv) => (
                <div key={pdv.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
                  <MapPin size={13} className="text-yellow-500/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 font-medium truncate">{pdv.nombre}</p>
                    <p className="text-xs text-white/30">{pdv.zona}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleQuickGPS(pdv)}
                      disabled={gpsLoadingId === pdv.id}
                      title="Usar mi ubicación GPS actual"
                      className="flex items-center gap-1.5 text-xs text-green-400 hover:text-white border border-green-500/30 hover:bg-green-500/20 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {gpsLoadingId === pdv.id
                        ? <Loader size={11} className="animate-spin" />
                        : <LocateFixed size={11} />
                      }
                      <span className="hidden sm:inline">Mi GPS</span>
                    </button>
                    <button onClick={() => { setEditingPDV(pdv); setShowForm(true) }}
                      className="flex items-center gap-1.5 text-xs text-mobil-blue hover:text-white border border-mobil-blue/30 hover:bg-mobil-blue/20 rounded-lg px-3 py-1.5 transition-colors">
                      <Edit2 size={11} /> <span className="hidden sm:inline">Añadir en mapa</span><span className="sm:hidden">Mapa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <PDVForm
          pdv={editingPDV}
          onSave={handleSavePDV}
          onClose={() => { setShowForm(false); setEditingPDV(null) }}
        />
      )}

      {showImport && (
        <CSVImport
          existingNames={pdvs.map((p) => p.nombre)}
          existingCodigos={pdvs.map((p) => p.codigo)}
          onImport={handleImport}
          onClose={() => { setShowImport(false); loadPDVs() }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl animate-fade-up ${
          toast.type === 'ok' ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-red-500/20 border border-red-500/40 text-red-300'
        }`}>
          {toast.type === 'ok' ? <CheckCircle size={15} /> : <XCircle size={15} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
