'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, User, Mail, Phone, Shield } from 'lucide-react'
import { AuthService, type UserProfile, type UserRole } from '@/lib/services/auth-service'
import { useToast } from '@/components/ui/toast'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: UserProfile | null
  onSave: () => void
}

export function UserModal({ isOpen, onClose, user, onSave }: UserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'instalador' as UserRole,
    phone: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '', // Never pre-fill password
        full_name: user.full_name,
        role: user.role,
        phone: user.phone || ''
      })
    } else {
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'instalador',
        phone: ''
      })
    }
    setError('')
  }, [user, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.email || !formData.full_name || !formData.role) {
        setError('Por favor completa todos los campos requeridos')
        return
      }

      if (!user && !formData.password) {
        setError('La contraseña es requerida para nuevos usuarios')
        return
      }

      if (user) {
        // Update existing user
        const result = await AuthService.updateUserProfile(user.id, {
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || undefined
        })

        if (!result.success) {
          throw new Error(result.error)
        }

        showToast({
          type: 'success',
          title: 'Usuario actualizado',
          message: `${formData.full_name} ha sido actualizado exitosamente`
        })
      } else {
        // Create new user
        const result = await AuthService.createUser({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || undefined
        })

        if (result.error) {
          throw new Error(result.error)
        }

        showToast({
          type: 'success',
          title: 'Usuario creado',
          message: `${formData.full_name} ha sido creado exitosamente`
        })
      }

      onSave()
      onClose()
    } catch (err: any) {
      console.error('Error saving user:', err)
      setError(err.message || 'Error al guardar usuario')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Nombre Completo *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre completo del usuario"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={!!user} // Disable email editing for existing users
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${user ? 'bg-gray-100' : ''}`}
                placeholder="correo@ejemplo.com"
              />
              {user && (
                <p className="text-xs text-gray-500 mt-1">
                  El email no se puede modificar
                </p>
              )}
            </div>

            {/* Password */}
            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!user}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contraseña del usuario"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+507 6000-0000"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="h-4 w-4 inline mr-1" />
                Rol *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="instalador">Instalador</option>
                <option value="administrativo">Administrativo</option>
                <option value="admin">Administrador</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.role === 'admin' && 'Acceso completo al sistema'}
                {formData.role === 'administrativo' && 'Acceso a clientes, órdenes, inspecciones, facturas y calendario'}
                {formData.role === 'instalador' && 'Acceso a órdenes de trabajo, inspecciones y calendario'}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (user ? 'Actualizar' : 'Crear Usuario')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
