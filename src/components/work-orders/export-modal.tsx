'use client'

import React, { useState } from 'react'
import { X, Download, FileText, Database, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkOrder } from '@/lib/services/work-order-service'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  workOrders: WorkOrder[]
}

export function ExportModal({ isOpen, onClose, workOrders }: ExportModalProps) {
  const [loading, setLoading] = useState(false)
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv')

  const handleExport = async () => {
    setLoading(true)
    
    try {
      let content = ''
      let filename = ''
      let mimeType = ''

      switch (format) {
        case 'csv':
          content = convertToCSV(workOrders)
          filename = `ordenes-trabajo-${new Date().toISOString().split('T')[0]}.csv`
          mimeType = 'text/csv'
          break
        
        case 'json':
          content = JSON.stringify(workOrders, null, 2)
          filename = `ordenes-trabajo-${new Date().toISOString().split('T')[0]}.json`
          mimeType = 'application/json'
          break
        
        case 'pdf':
          content = convertToHTML(workOrders)
          filename = `ordenes-trabajo-${new Date().toISOString().split('T')[0]}.html`
          mimeType = 'text/html'
          break
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      onClose()
    } catch (error) {
      console.error('Error exporting work orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const convertToCSV = (data: WorkOrder[]): string => {
    const headers = [
      'ID',
      'Título',
      'Cliente',
      'Estado',
      'Valor Estimado',
      'Dirección',
      'Provincia',
      'Distrito',
      'Corregimiento',
      'Notas',
      'Creado Por',
      'Fecha Creación'
    ]

    const rows = data.map(order => [
      order.id || '',
      order.title || '',
      order.customer?.name || '',
      order.status || '',
      order.estimated_value?.toString() || '',
      order.address_line || '',
      order.province || '',
      order.district || '',
      order.corregimiento || '',
      order.notes || '',
      order.created_by || '',
      order.created_at ? new Date(order.created_at).toLocaleDateString('es-PA') : ''
    ])

    return [headers, ...rows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  const convertToHTML = (data: WorkOrder[]): string => {
    const statusMap = {
      lead: 'Lead',
      quoted: 'Cotizada',
      approved: 'Aprobada',
      scheduled: 'Programada',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Órdenes de Trabajo - ZetterX CRM</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #1f2937; margin-bottom: 5px; }
        .header p { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
        th { background-color: #f9fafb; font-weight: bold; }
        .status { padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .status-lead { background-color: #dbeafe; color: #1e40af; }
        .status-quoted { background-color: #fef3c7; color: #d97706; }
        .status-approved { background-color: #e0e7ff; color: #7c3aed; }
        .status-scheduled { background-color: #fed7aa; color: #ea580c; }
        .status-in_progress { background-color: #c7d2fe; color: #4338ca; }
        .status-completed { background-color: #dcfce7; color: #15803d; }
        .status-cancelled { background-color: #fecaca; color: #dc2626; }
        .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Órdenes de Trabajo</h1>
        <p>Reporte generado el ${new Date().toLocaleDateString('es-PA')} - ZetterX CRM</p>
        <p>Total de órdenes: ${data.length}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Valor Estimado</th>
                <th>Ubicación</th>
                <th>Creado Por</th>
                <th>Fecha</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(order => `
                <tr>
                    <td>#${order.id}</td>
                    <td>${order.title}</td>
                    <td>${order.customer?.name || ''}</td>
                    <td><span class="status status-${order.status}">${statusMap[order.status as keyof typeof statusMap] || order.status}</span></td>
                    <td>$${order.estimated_value?.toFixed(2) || '0.00'}</td>
                    <td>${[order.address_line, order.district, order.province].filter(Boolean).join(', ')}</td>
                    <td>${order.created_by || ''}</td>
                    <td>${order.created_at ? new Date(order.created_at).toLocaleDateString('es-PA') : ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        <p>ZetterX CRM - Sistema de Gestión de Relaciones con Clientes</p>
    </div>
</body>
</html>`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Download className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Exportar Órdenes</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Exportando {workOrders.length} órden{workOrders.length !== 1 ? 'es' : ''} de trabajo
              </p>

              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value as 'csv')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <FileText className="w-5 h-5 text-green-600 mx-3" />
                  <div>
                    <div className="font-medium text-gray-900">CSV</div>
                    <div className="text-sm text-gray-500">Para Excel y hojas de cálculo</div>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={format === 'json'}
                    onChange={(e) => setFormat(e.target.value as 'json')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Database className="w-5 h-5 text-blue-600 mx-3" />
                  <div>
                    <div className="font-medium text-gray-900">JSON</div>
                    <div className="text-sm text-gray-500">Para desarrollo y APIs</div>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={(e) => setFormat(e.target.value as 'pdf')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <File className="w-5 h-5 text-red-600 mx-3" />
                  <div>
                    <div className="font-medium text-gray-900">HTML/PDF</div>
                    <div className="text-sm text-gray-500">Para impresión y reportes</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
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
