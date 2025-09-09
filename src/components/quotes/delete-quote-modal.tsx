'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Quote } from '@/lib/services/quote-service'
import { QuoteService } from '@/lib/services/quote-service'

interface DeleteQuoteModalProps {
  isOpen: boolean
  onClose: () => void
  quote: Quote | null
  onDeleted: () => void
}

export function DeleteQuoteModal({ isOpen, onClose, quote, onDeleted }: DeleteQuoteModalProps) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleDelete = async () => {
    if (!quote?.id) return

    setLoading(true)
    try {
      await QuoteService.deleteQuote(quote.id)
      
      showToast({
        type: 'success',
        title: 'Cotización eliminada',
        message: 'La cotización ha sido eliminada exitosamente'
      })
      
      onDeleted()
      onClose()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al eliminar',
        message: error.message || 'No se pudo eliminar la cotización'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !quote) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Eliminar Cotización
          </h2>
          
          <p className="text-gray-600 text-center mb-4">
            ¿Estás seguro de que deseas eliminar esta cotización?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium text-gray-900">
                {quote.customers?.name || 'Sin cliente'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium text-gray-900">
                ${quote.total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Estado:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {quote.status === 'draft' && 'Borrador'}
                {quote.status === 'sent' && 'Enviada'}
                {quote.status === 'approved' && 'Aprobada'}
                {quote.status === 'rejected' && 'Rechazada'}
                {quote.status === 'expired' && 'Expirada'}
              </span>
            </div>
          </div>
          
          <div className="text-center text-sm text-red-600 mb-6">
            Esta acción no se puede deshacer.
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Eliminando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
