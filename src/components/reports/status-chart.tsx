'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatusItem {
  status: string
  count: number
}

interface StatusChartProps {
  title: string
  data: StatusItem[]
  total: number
}

export function StatusChart({ title, data, total }: StatusChartProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'completed': 'bg-green-500',
      'done': 'bg-green-500',
      'confirmed': 'bg-blue-500',
      'in_progress': 'bg-yellow-500',
      'scheduled': 'bg-blue-400',
      'approved': 'bg-purple-500',
      'quoted': 'bg-orange-500',
      'lead': 'bg-gray-500',
      'cancelled': 'bg-red-500',
      'no_show': 'bg-red-400'
    }
    return colors[status] || 'bg-gray-400'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'completed': 'Completado',
      'done': 'Terminado',
      'confirmed': 'Confirmado',
      'in_progress': 'En Progreso',
      'scheduled': 'Programado',
      'approved': 'Aprobado',
      'quoted': 'Cotizado',
      'lead': 'Prospecto',
      'cancelled': 'Cancelado',
      'no_show': 'No Presentado'
    }
    return labels[status] || status
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
        ) : (
          <div className="space-y-3">
            {data.map((item) => {
              const percentage = total > 0 ? (item.count / total) * 100 : 0
              
              return (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">
                      {getStatusLabel(item.status)}
                    </span>
                    <span className="text-gray-600">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(item.status)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-700">Total</span>
                <span className="text-gray-900">{total}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
