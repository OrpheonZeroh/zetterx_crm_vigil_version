'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/layout/Logo'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Intentando login con:', { email })
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Respuesta login:', { data, error })

      if (error) {
        console.error('Error de autenticación:', error)
        throw error
      }

      if (data.user) {
        console.log('Usuario logueado:', data.user)
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Error en handleSubmit:', error)
      setError(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="header" size="md" />
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Lenssie</a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Precios</a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">FAQ</a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Contacto</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
                <span className="text-slate-900">Automatiza </span>
                <span className="text-blue-700">tu flujo de ventas de principio a fin.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                Zetterx integra CRM, cobros, soporte multicanal y NPS en un solo panel para que crezcas sin fricciones. Añade Lenssie para reportes y alertas que convierten datos en decisiones.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-lg text-slate-700">Reduce tareas repetitivas hasta un 40%.</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-lg text-slate-700">Integra ventas, pagos y soporte en minutos.</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-lg text-slate-700">Mantén el pulso de tus clientes con NPS automático.</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-blue-700 mb-2">
                    Inicia sesión
                  </h2>
                  <p className="text-slate-600 font-medium">
                    Accede a tu panel de control
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                      Correo Electrónico
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                      Contraseña
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                      placeholder="••••••••"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Iniciando sesión...</span>
                      </div>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </form>


                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    ¿No tienes cuenta?{' '}
                    <button 
                      onClick={() => router.push('/register')}
                      className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                      Regístrate aquí
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="text-sm text-slate-500 uppercase tracking-wider font-medium mb-4">
              EMPRESAS EN PANAMÁ Y LATAM CONFÍAN EN ZETTERX
            </p>
            <div className="flex justify-center space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-16 h-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg flex items-center justify-center">
                  <span className="text-slate-400 text-xs font-medium">Logo {i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
