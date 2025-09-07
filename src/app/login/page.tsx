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
    } catch (error: unknown) {
      console.error('Error en handleSubmit:', error)
      setError(error instanceof Error ? error.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="header" size="md" />
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm lg:text-base">Lenssie</a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm lg:text-base">Precios</a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm lg:text-base">FAQ</a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm lg:text-base">Contacto</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24 pb-32">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side - Content */}
          <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
            <div className="space-y-4 lg:space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center lg:text-left mb-4">
                <span className="text-slate-900">Automatiza </span>
                <span className="text-blue-700">tu flujo de ventas de principio a fin.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl text-center lg:text-left">
                Zetterx integra CRM, cobros, soporte multicanal y NPS en un solo panel para que crezcas sin fricciones. Añade Lenssie para reportes y alertas que convierten datos en decisiones.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-start lg:items-center space-x-3 lg:space-x-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 lg:mt-0 flex-shrink-0"></div>
                <span className="text-base lg:text-lg text-slate-700">Reduce tareas repetitivas hasta un 40%.</span>
              </div>
              <div className="flex items-start lg:items-center space-x-3 lg:space-x-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 lg:mt-0 flex-shrink-0"></div>
                <span className="text-base lg:text-lg text-slate-700">Integra ventas, pagos y soporte en minutos.</span>
              </div>
              <div className="flex items-start lg:items-center space-x-3 lg:space-x-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 lg:mt-0 flex-shrink-0"></div>
                <span className="text-base lg:text-lg text-slate-700">Mantén el pulso de tus clientes con NPS automático.</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center order-1 lg:order-2">
            <div className="w-full max-w-md">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-2">
                    Inicia sesión
                  </h2>
                  <p className="text-slate-600 font-medium text-sm sm:text-base">
                    Accede a tu panel de control
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
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
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                      placeholder="••••••••"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Partner Logos */}
      <div className="absolute bottom-0 left-0 right-0 py-4 sm:py-8 bg-gradient-to-t from-white/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wider font-medium mb-3 sm:mb-4">
              EMPRESAS EN PANAMÁ Y LATAM CONFÍAN EN ZETTERX
            </p>
            <div className="flex justify-center items-center space-x-4 sm:space-x-8">
              {/* Ventanas Vigil Logo */}
              <div className="w-20 sm:w-24 lg:w-28 h-12 sm:h-14 lg:h-16 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg flex items-center justify-center p-2 hover:bg-white/90 transition-all shadow-lg">
                <img 
                  src="/ventanasvigil.webp" 
                  alt="Ventanas Vigil" 
                  className="max-w-full max-h-full object-contain filter brightness-75 hover:brightness-100 transition-all"
                />
              </div>
              
              {/* Rito Remodelaciones Logo */}
              <div className="w-20 sm:w-24 lg:w-28 h-12 sm:h-14 lg:h-16 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg flex items-center justify-center p-2 hover:bg-white/90 transition-all shadow-lg">
                <img 
                  src="/ritoremodelacioneslogo-removebg-preview.png" 
                  alt="Rito Remodelaciones" 
                  className="max-w-full max-h-full object-contain filter brightness-75 hover:brightness-100 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
