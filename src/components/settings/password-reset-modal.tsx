'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, X } from 'lucide-react'

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    full_name: string
    email: string
  }
  onSuccess: () => void
}

export function PasswordResetModal({ isOpen, onClose, user, onSuccess }: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*]/.test(password)
    
    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial
    }
  }

  const passwordValidation = validatePassword(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validaciones básicas
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Todos los campos son requeridos' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    if (!passwordValidation.isValid) {
      setMessage({ type: 'error', text: 'La contraseña no cumple con los requisitos de seguridad' })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al restablecer la contraseña' })
        return
      }

      setMessage({ type: 'success', text: data.message })
      
      // Limpiar formulario
      setNewPassword('')
      setConfirmPassword('')

      // Llamar callback de éxito después de un breve delay
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)

    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNewPassword('')
    setConfirmPassword('')
    setMessage(null)
    onClose()
  }

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center space-x-2 text-sm">
      {met ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-gray-400" />
      )}
      <span className={met ? 'text-green-600' : 'text-gray-500'}>{text}</span>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Restablecer Contraseña
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Usuario: <span className="font-medium">{user.full_name}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nueva Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
                placeholder="Ingresa la nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>

            {/* Requisitos de contraseña */}
            {newPassword && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">Requisitos de seguridad:</p>
                <div className="space-y-1">
                  <PasswordRequirement met={passwordValidation.minLength} text="Mínimo 8 caracteres" />
                  <PasswordRequirement met={passwordValidation.hasUpper} text="Al menos una mayúscula" />
                  <PasswordRequirement met={passwordValidation.hasLower} text="Al menos una minúscula" />
                  <PasswordRequirement met={passwordValidation.hasNumber} text="Al menos un número" />
                  <PasswordRequirement met={passwordValidation.hasSpecial} text="Al menos un carácter especial (!@#$%^&*)" />
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                placeholder="Confirma la nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Mensaje de resultado */}
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid || newPassword !== confirmPassword}
              className="flex-1"
            >
              {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
