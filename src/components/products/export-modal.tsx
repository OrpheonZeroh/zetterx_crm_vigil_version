'use client'

import React, { useState } from 'react'
import { X, Download, FileText, Database, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/services/product-service'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  totalCount: number
}

function exportToCSV(products: Product[], filename: string = 'productos') {
  const headers = [
    'Código',
    'Descripción',
    'Precio Unitario',
    'ITBMS (%)',
    'Tipo',
    'Estado',
    'Fecha Creación'
  ]

  const rows = products.map(product => [
    product.code || '',
    product.description || '',
    product.unit_price?.toString() || '0',
    product.itbms_rate?.toString() || '0',
    product.is_service ? 'Servicio' : 'Producto',
    product.is_active ? 'Activo' : 'Inactivo',
    product.created_at ? new Date(product.created_at).toLocaleDateString('es-PA') : ''
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

function exportToJSON(products: Product[], filename: string = 'productos') {
  const jsonContent = JSON.stringify(products, null, 2)
  
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

function exportToPDF(products: Product[], filename: string = 'productos') {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Catálogo de Productos - ZetterX CRM</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #1e40af; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .price { text-align: right; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ZetterX CRM - Catálogo de Productos</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-PA')}</p>
        <p>Total de productos: ${products.length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>ITBMS</th>
            <th>Tipo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(product => `
            <tr>
              <td>${product.code || ''}</td>
              <td>${product.description || ''}</td>
              <td class="price">$${(product.unit_price || 0).toFixed(2)}</td>
              <td>${(product.itbms_rate || 0).toFixed(1)}%</td>
              <td>${product.is_service ? 'Servicio' : 'Producto'}</td>
              <td>${product.is_active ? 'Activo' : 'Inactivo'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>ZetterX CRM © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `

  const blob = new Blob([htmlContent], { type: 'text/html' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function ExportModal({ isOpen, onClose, products, totalCount }: ExportModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'pdf'>('csv')

  if (!isOpen) return null

  const handleExport = async () => {
    setLoading(true)
    
    try {
      const filename = `productos-${new Date().toISOString().split('T')[0]}`
      
      switch (selectedFormat) {
        case 'csv':
          exportToCSV(products, filename)
          break
        case 'json':
          exportToJSON(products, filename)
          break
        case 'pdf':
          exportToPDF(products, filename)
          break
      }
      
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
            <h3 className="text-lg font-semibold text-gray-900">Exportar Productos</h3>
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
            Se exportarán <strong>{products.length}</strong> productos de un total de <strong>{totalCount}</strong>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona el formato de exportación:
            </label>
            
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
