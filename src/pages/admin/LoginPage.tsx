import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!isSupabaseConfigured) {
      setError('Supabase no esta configurado. Sigue las instrucciones en SETUP.md.')
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (authError) {
      setError('Credenciales incorrectas. Verifica tu email y contrasena.')
    } else {
      navigate('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-carbon-950 flex flex-col items-center justify-center p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-mobil-red/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-mobil-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <img src="/mobil-logo.png" alt="Mobil" className="h-12 w-auto mx-auto" />
          <div className="racing-stripe w-16 mx-auto rounded-full" />
          <p className="text-xs text-white/30 uppercase tracking-widest font-medium mt-2">
            Panel de Administracion
          </p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
          <h1 className="text-lg font-display font-semibold text-white text-center mb-1">
            Acceso Administrativo
          </h1>

          {error && (
            <div className="flex items-start gap-2 bg-mobil-red/10 border border-mobil-red/30 rounded-lg p-3">
              <AlertCircle size={14} className="text-mobil-red shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-white/50 font-medium">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@mad4performance.com"
                className="w-full bg-carbon-700 border border-white/10 text-sm text-white placeholder:text-white/20 rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-mobil-blue/60 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/50 font-medium">Contrasena</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-carbon-700 border border-white/10 text-sm text-white placeholder:text-white/20 rounded-lg pl-9 pr-10 py-2.5 outline-none focus:border-mobil-blue/60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-mobil-red hover:bg-mobil-red-light disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock size={14} />
                Ingresar
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-white/20">
          Mad4Performance x Mobil &mdash; Sistema de Gestion PDV
        </p>
      </div>
    </div>
  )
}
