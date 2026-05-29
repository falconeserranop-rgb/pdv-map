import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react'
import Papa from 'papaparse'
import type { PDVFormData, ImportResult } from '../../types'
import { fixMalformedCoordinate } from '../../lib/geo'

interface CSVImportProps {
  existingNames: string[]
  existingCodigos: string[]
  onImport: (records: PDVFormData[]) => Promise<ImportResult>
  onClose: () => void
}

interface CSVRow {
  codigo?: string
  nombre?: string
  zona?: string
  direccion?: string
  latitud?: string
  longitud?: string
  asesor_ventas?: string
  instagram?: string
  instagram_url?: string
  telefono?: string
  horario?: string
  activo?: string
  [key: string]: string | undefined
}

export function CSVImport({ existingNames, existingCodigos, onImport, onClose }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PDVFormData[]>([])
  const [duplicates, setDuplicates] = useState<string[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function downloadTemplate() {
    const csv = 'codigo,nombre,zona,direccion,latitud,longitud,asesor_ventas,telefono,instagram,instagram_url,horario\n501674086,CAUCHOS AVILA,CARACAS,Av. Principal Local 5,10.490339,-66.854394,Francisco Carvajal,+58 414-1234567,@cauchos_avila,https://instagram.com/cauchos_avila,Lun-Sáb 8:00am – 6:00pm'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'template-pdvs.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function handleFile(f: File) {
    setFile(f)
    setResult(null)
    Papa.parse<CSVRow>(f, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const dupes: string[] = []
        const records: PDVFormData[] = []

        data.forEach((row) => {
          const nombre = (row.nombre ?? '').trim().toUpperCase()
          const codigo = (row.codigo ?? '').trim()
          if (!nombre) return

          const isDupe =
            existingNames.map((n) => n.toUpperCase()).includes(nombre) ||
            (codigo && existingCodigos.includes(codigo))

          if (isDupe) { dupes.push(nombre); return }

          records.push({
            codigo,
            nombre,
            zona: (row.zona ?? 'CARACAS').trim().toUpperCase(),
            direccion: (row.direccion ?? '').trim(),
            latitud: String(fixMalformedCoordinate(row.latitud ?? '', true) ?? ''),
            longitud: String(fixMalformedCoordinate(row.longitud ?? '', false) ?? ''),
            asesor_ventas: (row.asesor_ventas ?? '').trim(),
            activo: (row.activo ?? 'true') !== 'false',
            instagram: (row.instagram ?? '').trim(),
            instagram_url: (row.instagram_url ?? '').trim(),
            telefono: (row.telefono ?? '').trim(),
            horario: (row.horario ?? '').trim(),
          })
        })

        setPreview(records)
        setDuplicates(dupes)
      },
    })
  }

  async function handleImport() {
    if (!preview.length) return
    setImporting(true)
    try {
      const res = await onImport(preview)
      setResult(res)
      setPreview([])
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-carbon-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display font-semibold text-white">Importar PDVs por CSV</h2>
            <p className="text-xs text-white/40 mt-0.5">Detecta duplicados autom&aacute;ticamente antes de importar</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/15 hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors">
              <Download size={12} /> Plantilla CSV
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Result */}
          {result && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-sm font-semibold text-green-300">Importaci&oacute;n completada</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-green-500/10 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-green-400">{result.imported}</p>
                  <p className="text-green-600">Importados</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-yellow-400">{result.duplicates}</p>
                  <p className="text-yellow-600">Duplicados</p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-red-400">{result.errors}</p>
                  <p className="text-red-600">Errores</p>
                </div>
              </div>
              {result.noCoords > 0 && (
                <p className="text-xs text-white/40">{result.noCoords} PDVs sin coordenadas (se importaron pero no aparecer&aacute;n en el mapa)</p>
              )}
            </div>
          )}

          {/* Drop zone */}
          {!result && (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                file ? 'border-mobil-blue/50 bg-mobil-blue/5' : 'border-white/15 hover:border-white/30 hover:bg-white/2'
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault() }}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            >
              <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText size={20} className="text-mobil-blue" />
                  <span className="text-sm font-medium text-white">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/50">Arrastra tu CSV aqu&iacute; o <span className="text-mobil-blue underline">selecciona el archivo</span></p>
                  <p className="text-xs text-white/25 mt-1">Columnas: codigo, nombre, zona, latitud, longitud...</p>
                </>
              )}
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{preview.length} PDVs listos para importar</p>
                {duplicates.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                    <AlertCircle size={12} />
                    {duplicates.length} duplicados omitidos
                  </div>
                )}
              </div>

              {duplicates.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-xs text-yellow-300 font-medium mb-1">Duplicados detectados (no se importar&aacute;n):</p>
                  <p className="text-xs text-yellow-600">{duplicates.join(', ')}</p>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto space-y-1">
                {preview.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-carbon-700/50 rounded-lg px-3 py-2">
                    <CheckCircle size={12} className="text-green-400 shrink-0" />
                    <span className="text-xs text-white/80 flex-1 truncate">{p.nombre}</span>
                    <span className="text-xs text-white/30">{p.zona}</span>
                    {!p.latitud && <span className="text-xs text-yellow-500/50">Sin coords</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="px-5 py-4 border-t border-white/10 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm font-semibold transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!preview.length || importing}
              className="flex-1 flex items-center justify-center gap-2 bg-mobil-red hover:bg-mobil-red-light disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {importing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Upload size={14} />Importar {preview.length} PDVs</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
