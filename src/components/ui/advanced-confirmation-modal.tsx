'use client'

import React from 'react'
import { AlertTriangle, Trash2, X, FileText, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdvancedConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (cascade: boolean) => void
  customerName: string
  relations: { workOrders: number; invoices: number }
  loading?: boolean
}

export function AdvancedConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  relations,
  loading = false
}: AdvancedConfirmationModalProps) {
  if (!isOpen) return null

  const hasRelations = relations.workOrders > 0 || relations.invoices > 0

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Eliminar Cliente</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            ¿Estás seguro de que quieres eliminar a <strong>{customerName}</strong>?
          </p>

          {hasRelations && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">
                  Este cliente tiene registros asociados
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-yellow-700">
                {relations.workOrders > 0 && (
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>{relations.workOrders} órdenes de trabajo</span>
                  </div>
                )}
                {relations.invoices > 0 && (
                  <div className="flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    <span>{relations.invoices} facturas</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-gray-600 text-sm">
            {hasRelations 
              ? 'Puedes eliminar solo el cliente o eliminarlo junto con todos sus registros asociados.'
              : 'Esta acción no se puede deshacer.'
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          {hasRelations && (
            <Button
              onClick={() => onConfirm(true)}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Eliminando...
                </>
              ) : (
                'Eliminar todo (cliente + registros)'
              )}
            </Button>
          )}
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            {!hasRelations && (
              <Button
                onClick={() => onConfirm(false)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
