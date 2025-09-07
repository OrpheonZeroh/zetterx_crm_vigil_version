'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InvoiceEmailService } from '@/lib/services/invoice-email-service'
import { Mail, Send, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react'

interface InvoiceEmailActionsProps {
  invoiceId: string
  defaultEmail?: string
  cufe?: string
  emailSent?: boolean
  className?: string
}

export function InvoiceEmailActions({ 
  invoiceId, 
  defaultEmail, 
  cufe,
  emailSent = false,
  className = "" 
}: InvoiceEmailActionsProps) {
  const [loading, setLoading] = useState(false)
  const [emailAddress, setEmailAddress] = useState(defaultEmail || '')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)

  const handleSendEmail = async () => {
    if (!emailAddress.trim()) {
      setStatus('error')
      setMessage('Debe ingresar un email válido')
      return
    }

    try {
      setLoading(true)
      setStatus('idle')

      const result = await InvoiceEmailService.resendInvoiceEmail(
        invoiceId, 
        emailAddress.trim()
      )

      if (result.success) {
        setStatus('success')
        setMessage('✅ Factura enviada exitosamente')
        setShowEmailInput(false)
      } else {
        setStatus('error')
        setMessage(`❌ ${result.message}`)
      }

    } catch (error) {
      setStatus('error')
      setMessage('❌ Error inesperado al enviar email')
      console.error('Error sending email:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    try {
      setLoading(true)
      const result = await InvoiceEmailService.getInvoiceEmailStatus(invoiceId)
      
      if (result.success) {
        const data = result.data!
        let statusMessage = ''
        
        if (!data.hasCufe) {
          statusMessage = '⚠️ Factura sin autorización DGI'
        } else if (data.emailSent) {
          statusMessage = `✅ Enviado a ${data.emailAddress} el ${new Date(data.emailSentAt).toLocaleDateString()}`
        } else {
          statusMessage = '📋 Autorizada pero no enviada por email'
        }

        setMessage(statusMessage)
        setStatus(data.emailSent ? 'success' : 'error')
      } else {
        setMessage(`❌ ${result.message}`)
        setStatus('error')
      }
    } catch (error) {
      setMessage('❌ Error consultando estado')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <AlertCircle className="w-4 h-4 text-yellow-600" />
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status Display */}
      {status !== 'idle' && message && (
        <div className={`flex items-center p-3 rounded-md text-sm ${
          status === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {getStatusIcon()}
          <span className="ml-2">{message}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Send/Resend Email Button */}
        <Button
          variant={emailSent ? "outline" : "default"}
          size="sm"
          onClick={() => setShowEmailInput(true)}
          disabled={loading || !cufe}
          className="flex items-center"
        >
          {emailSent ? (
            <>
              <Send className="w-4 h-4 mr-2" />
              Reenviar
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Enviar Email
            </>
          )}
        </Button>

        {/* Check Status Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCheckStatus}
          disabled={loading}
          className="flex items-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Estado
        </Button>

        {/* CUFE Badge */}
        {cufe && (
          <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
            <CheckCircle className="w-3 h-3 mr-1" />
            DGI Autorizada
          </div>
        )}
      </div>

      {/* Email Input Modal */}
      {showEmailInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {emailSent ? '📧 Reenviar Factura' : '📧 Enviar Factura por Email'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del Cliente
                </label>
                <Input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="cliente@email.com"
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {cufe && (
                <div className="bg-gray-50 p-3 rounded text-xs">
                  <div className="font-medium text-gray-700 mb-1">CUFE:</div>
                  <div className="text-gray-600 break-all font-mono">
                    {cufe.substring(0, 40)}...
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEmailInput(false)
                    setStatus('idle')
                    setMessage('')
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={loading || !emailAddress.trim()}
                  className="flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning for invoices without CUFE */}
      {!cufe && !loading && (
        <div className="flex items-center p-2 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200">
          <AlertCircle className="w-4 h-4 mr-2" />
          Esta factura no tiene autorización DGI. Debe procesarse primero con el sistema fiscal.
        </div>
      )}
    </div>
  )
}
