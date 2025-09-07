'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export function PasswordManagement() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
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
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Todos los campos son requeridos' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    if (!passwordValidation.isValid) {
      setMessage({ type: 'error', text: 'La nueva contraseña no cumple con los requisitos de seguridad' })
      return
    }

    if (currentPassword === newPassword) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe ser diferente a la actual' })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al cambiar la contraseña' })
        return
      }

      setMessage({ type: 'success', text: 'Contraseña cambiada exitosamente' })
      
      // Limpiar formulario
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Cambiar Contraseña</span>
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contraseña Actual */}
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Ingresa tu contraseña actual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

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
                  placeholder="Ingresa tu nueva contraseña"
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
                  placeholder="Confirma tu nueva contraseña"
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

            {/* Botón de envío */}
            <Button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid || newPassword !== confirmPassword}
              className="w-full"
            >
              {isLoading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
