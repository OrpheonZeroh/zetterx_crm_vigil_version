'use client'

import React, { useState } from 'react'
import { X, Download, FileText, Database, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToCSV, exportToJSON, exportToPDF } from '@/lib/utils/export'
import type { Customer } from '@/lib/services/customer-service'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  customers: Customer[]
  totalCount: number
}

export function ExportModal({ isOpen, onClose, customers, totalCount }: ExportModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'pdf'>('csv')

  if (!isOpen) return null

  const handleExport = async () => {
    setLoading(true)
    
    try {
      const filename = `clientes-${new Date().toISOString().split('T')[0]}`
      
      switch (selectedFormat) {
        case 'csv':
          exportToCSV(customers, filename)
          break
        case 'json':
          exportToJSON(customers, filename)
          break
        case 'pdf':
          exportToPDF(customers, filename)
          break
      }
      
      // Close modal after brief delay
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileText className="w-5 h-5" />
      case 'json': return <Database className="w-5 h-5" />
      case 'pdf': return <Printer className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'csv': return 'Perfecto para Excel y hojas de cálculo'
      case 'json': return 'Formato de datos estructurado para sistemas'
      case 'pdf': return 'Documento listo para imprimir o compartir'
      default: return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Download className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Exportar Clientes</h3>
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
          <div className="mb-4 text-sm text-gray-600">
            Se exportarán <strong>{customers.length}</strong> clientes de un total de <strong>{totalCount}</strong>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona el formato de exportación:
            </label>
            
            {/* Format Options */}
            <div className="space-y-2">
              {(['csv', 'json', 'pdf'] as const).map((format) => (
                <div
                  key={format}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedFormat === format 
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => setSelectedFormat(format)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      ${selectedFormat === format ? 'text-blue-600' : 'text-gray-400'}
                    `}>
                      {getFormatIcon(format)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 uppercase">
                        {format}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getFormatDescription(format)}
                      </div>
                    </div>
                    <div className={`
                      w-4 h-4 rounded-full border-2 
                      ${selectedFormat === format 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                      }
                    `}>
                      {selectedFormat === format && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="text-xs text-gray-500">
            {selectedFormat === 'pdf' && 'El archivo HTML se puede abrir en el navegador e imprimir como PDF'}
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
