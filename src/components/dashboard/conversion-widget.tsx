'use client'

import { cn } from '@/lib/utils'

export function ConversionWidget() {
  return (
    <div className="widget">
      {/* Header with traffic light dots */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {/* Traffic light dots */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-lg font-semibold text-gray-900">Conversión</h3>
          <div className="text-2xl font-bold text-primary-500">+22%</div>
        </div>
      </div>

      {/* Main chart area */}
      <div className="bg-white rounded-lg p-8 mb-6 border border-gray-200">
        <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
          {/* Placeholder for chart - exactly like landing page */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-primary-500 rounded"></div>
            </div>
            <p className="text-sm text-gray-500">Gráfico de Conversión</p>
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex space-x-2">
        {['Leads', 'CRM', 'Cobro', 'NPS'].map((filter) => (
          <button
            key={filter}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
              filter === 'Leads'
                ? "bg-primary-50 border-primary-200 text-primary-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  )
}
