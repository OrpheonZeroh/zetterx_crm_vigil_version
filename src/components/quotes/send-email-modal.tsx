'use client'

import { useState } from 'react'
import { Mail, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { Quote } from '@/lib/services/quote-service'

interface SendEmailModalProps {
  isOpen: boolean
  onClose: () => void
  quote: Quote | null
  onEmailSent: () => void
}

export function SendEmailModal({ isOpen, onClose, quote, onEmailSent }: SendEmailModalProps) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    recipientEmail: quote?.customers?.email || '',
    recipientName: quote?.customers?.name || '',
    customMessage: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quote?.id) return

    if (!formData.recipientEmail || !formData.recipientName) {
      showToast({
        type: 'error',
        title: 'Error de validación',
        message: 'Email y nombre del destinatario son requeridos'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/quotes/${quote.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar el email')
      }

      showToast({
        type: 'success',
        title: 'Email enviado',
        message: 'La cotización ha sido enviada por email exitosamente'
      })
      
      onEmailSent()
      onClose()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al enviar',
        message: error.message || 'No se pudo enviar el email'
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset form when modal opens
  useState(() => {
    if (isOpen && quote) {
      setFormData({
        recipientEmail: quote.customers?.email || '',
        recipientName: quote.customers?.name || '',
        customMessage: ''
      })
    }
  })

  if (!isOpen || !quote) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Enviar Cotización por Email
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quote Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Mail className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-blue-900">Detalles de la Cotización</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">ID:</span>
                <span className="ml-2 font-medium">#{quote.id?.slice(-8)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="ml-2 font-medium">${quote.total.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Cliente:</span>
                <span className="ml-2 font-medium">{quote.customers?.name || 'Sin cliente'}</span>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {quote.status === 'draft' && 'Borrador'}
                  {quote.status === 'sent' && 'Enviada'}
                  {quote.status === 'approved' && 'Aprobada'}
                  {quote.status === 'rejected' && 'Rechazada'}
                  {quote.status === 'expired' && 'Expirada'}
                </span>
              </div>
            </div>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Nombre del Destinatario *</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Email del Destinatario *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="email@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customMessage">Mensaje Personalizado (Opcional)</Label>
              <Textarea
                id="customMessage"
                value={formData.customMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                placeholder="Agregue un mensaje personalizado para incluir en el email..."
                rows={4}
              />
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <h4 className="font-medium text-gray-900 mb-2">Vista Previa del Email</h4>
            <p><strong>Asunto:</strong> Cotización #{quote.id?.slice(-8)} - ZetterX Glass & Aluminum</p>
            <p><strong>De:</strong> cotizaciones@zetterx.com</p>
            <p><strong>Para:</strong> {formData.recipientEmail || 'email@ejemplo.com'}</p>
            <p className="mt-2">El email incluirá los detalles completos de la cotización con formato profesional.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Cotización
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
