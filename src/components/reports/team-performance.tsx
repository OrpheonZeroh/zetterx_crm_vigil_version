'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InstallationMetrics } from '@/lib/services/reports-service'

interface TeamPerformanceProps {
  data: InstallationMetrics
}

export function TeamPerformance({ data }: TeamPerformanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Rendimiento por Equipo</CardTitle>
      </CardHeader>
      <CardContent>
        {data.team_performance.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
        ) : (
          <div className="space-y-4">
            {data.team_performance.map((team) => (
              <div key={team.team_name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{team.team_name}</span>
                  <span className="text-sm text-gray-600">
                    {team.completed} completadas - {team.success_rate.toFixed(1)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${team.success_rate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Tasa de éxito</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      team.success_rate >= 90 
                        ? 'bg-green-100 text-green-800'
                        : team.success_rate >= 70
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {team.success_rate >= 90 ? 'Excelente' : team.success_rate >= 70 ? 'Bueno' : 'Necesita mejora'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
