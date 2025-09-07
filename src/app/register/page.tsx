'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/layout/Logo'
import { supabase } from '@/lib/supabase'
import { UserService } from '@/lib/services/user-service'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'admin' as const
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Intentando registro con:', formData)
      
      // Create user in Supabase Auth (simplified - remove user existence check for now)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role
          }
        }
      })

      console.log('Respuesta registro auth:', { authData, authError })

      if (authError) throw authError

      if (authData.user) {
        console.log('Usuario creado en auth:', authData.user)
        
        // Try to create user profile in users table (handle potential errors gracefully)
        try {
          const profileData = await UserService.createUserProfile({
            id: authData.user.id,
            full_name: formData.fullName,
            email: formData.email,
            role: formData.role,
            is_active: true
          })
          console.log('Perfil creado:', profileData)
        } catch (profileError) {
          console.error('Error creando perfil (continuando):', profileError)
          // Continue even if profile creation fails
        }

        setSuccess('Usuario creado exitosamente. Revisa tu email para confirmar la cuenta.')
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      setError(error.message || 'Error al crear el usuario')
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
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
                <span className="text-slate-900">Automatiza </span>
                <span className="text-blue-700">tu flujo de ventas de principio a fin.</span>
              </h1>
              <p className="text-slate-600 font-medium">
                Únete a la plataforma de automatización
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
                  Nombre Completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                  placeholder="juan@email.com"
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
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-semibold text-slate-700">
                  Rol
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                >
                  <option value="admin">Administrador</option>
                  <option value="ops">Operaciones</option>
                  <option value="sales">Ventas</option>
                  <option value="tech">Técnico</option>
                  <option value="viewer">Visualizador</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creando usuario...</span>
                  </div>
                ) : (
                  'Crear Usuario'
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <button 
                  onClick={() => router.push('/login')}
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
