'use client'

import React from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLoader } from './loading-spinner'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  details?: {
    label: string
    value: string
  }[]
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
  details
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const variantConfig = {
    danger: {
      icon: Trash2,
      iconColor: 'text-red-600',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      bgColor: 'bg-red-50'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      bgColor: 'bg-yellow-50'
    },
    info: {
      icon: AlertTriangle,
      iconColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      bgColor: 'bg-blue-50'
    }
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/60">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${config.bgColor} mr-3`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">{message}</p>
          
          {details && details.length > 0 && (
            <div className={`rounded-lg p-4 text-sm text-gray-600 ${config.bgColor}`}>
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="font-medium">{detail.label}:</span>
                  <span>{detail.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`text-white ${config.buttonColor}`}
          >
            {loading ? (
              <>
                <ButtonLoader size="sm" />
                <span className="ml-2">Procesando...</span>
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
