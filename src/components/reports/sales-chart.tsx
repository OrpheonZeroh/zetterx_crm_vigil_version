'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SalesMetrics } from '@/lib/services/reports-service'

interface SalesChartProps {
  data: SalesMetrics
}

export function SalesChart({ data }: SalesChartProps) {
  const maxRevenue = Math.max(...data.monthly_revenue.map(item => item.revenue))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Ingresos Mensuales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.monthly_revenue.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {data.monthly_revenue.map((item) => {
                const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                const monthName = new Date(item.month + '-01').toLocaleDateString('es-PA', { 
                  month: 'long', 
                  year: 'numeric' 
                })
                
                return (
                  <div key={item.month} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700 capitalize">{monthName}</span>
                      <span className="text-gray-600">
                        {new Intl.NumberFormat('es-PA', {
                          style: 'currency',
                          currency: 'PAB'
                        }).format(item.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{item.invoices} facturas</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
