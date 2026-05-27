import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import type { PDV, PDVFormData } from '../../types'
import { slugify } from '../../lib/geo'

interface PDVFormProps {
  pdv?: PDV | null
  onSave: (data: PDVFormData) => Promise<void>
  onClose: () => void
}

const ZONAS_LIST = [
  'CARACAS', 'GUATIRE', 'LOS TEQUES', 'SAN ANTONIO DE LOS ALTOS',
  'BARUTA', 'EL HATILLO', 'CHAGUARAMOS', 'EL PARAISO', 'CARABALLEDA',
  'CATIA LA MAR', 'LA GUAIRA', 'LAS MINAS', 'JUNKITO', 'VALLEY/COCHE',
  'VALLES DEL TUY', 'CHARALLAVE', 'CUA', 'STA. TERESA DEL TUY', 'OCUMARE',
  'PARACOTOS', 'CENTRO', 'FLORIDA', 'CANDELARIA', 'OTRO'
]

const empty: PDVFormData = {
  codigo: '', nombre: '', zona: 'CARACAS', direccion: '', latitud: '', longitud: '',
  asesor_ventas: '', activo: true, instagram: '', telefono: '', horario: '',
}

export function PDVForm({ pdv, onSave, onClose }: PDVFormProps) {
  const [form, setForm] = useState<PDVFormData>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (pdv) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        codigo: pdv.codigo,
        nombre: pdv.nombre,
        zona: pdv.zona,
        direccion: pdv.direccion ?? '',
        latitud: pdv.latitud?.toString() ?? '',
        longitud: pdv.longitud?.toString() ?? '',
        asesor_ventas: pdv.asesor_ventas ?? '',
        activo: pdv.activo,
        instagram: pdv.instagram ?? '',
        telefono: pdv.telefono ?? '',
        horario: pdv.horario ?? '',
      })
    } else {
      setForm(empty)
    }
  }, [pdv])

  function set(field: keyof PDVFormData, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!pdv

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-carbon-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display font-semibold text-white">{isEdit ? 'Editar PDV' : 'Nuevo PDV'}</h2>
            <p className="text-xs text-white/40 mt-0.5">{isEdit ? pdv!.nombre : 'A&ntilde;adir punto de venta'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {error && (
            <div className="bg-mobil-red/10 border border-mobil-red/30 rounded-lg px-3 py-2 text-sm text-red-300">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-white/50">C&oacute;digo *</label>
              <input value={form.codigo} onChange={(e) => set('codigo', e.target.value)}
                className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="501674086" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50">Zona</label>
              <select value={form.zona} onChange={(e) => set('zona', e.target.value)}
                className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all">
                {ZONAS_LIST.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/50">Nombre del PDV *</label>
            <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
              className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="Ej: CAUCHOS AVILA" />
            {form.nombre && (
              <p className="text-[10px] text-white/30">URL: /pdv/{slugify(form.nombre)}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/50">Direcci&oacute;n</label>
            <input value={form.direccion} onChange={(e) => set('direccion', e.target.value)}
              className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="Av. Principal, Local #..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-white/50">Latitud</label>
              <input value={form.latitud} onChange={(e) => set('latitud', e.target.value)}
                className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all font-mono" placeholder="10.4897..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50">Longitud</label>
              <input value={form.longitud} onChange={(e) => set('longitud', e.target.value)}
                className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all font-mono" placeholder="-66.8682..." />
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-white/30 mb-3 uppercase tracking-wider font-medium">Informaci&oacute;n de contacto (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-white/50">Tel&eacute;fono / WhatsApp</label>
                <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)}
                  className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="+58 424..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/50">Instagram</label>
                <input value={form.instagram} onChange={(e) => set('instagram', e.target.value)}
                  className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="@handle" />
              </div>
            </div>
            <div className="space-y-1 mt-3">
              <label className="text-xs text-white/50">Horario</label>
              <input value={form.horario} onChange={(e) => set('horario', e.target.value)}
                className="w-full bg-carbon-700 border border-white/10 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-mobil-blue/50 transition-all" placeholder="Lun-Vie 8:00am - 5:00pm" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={() => set('activo', !form.activo)}
              className={`relative w-10 h-6 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-carbon-600'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-white/70">{form.activo ? 'Activo' : 'Inactivo'}</span>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-semibold transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-mobil-red hover:bg-mobil-red-light disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Save size={14} />{isEdit ? 'Guardar cambios' : 'Crear PDV'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
