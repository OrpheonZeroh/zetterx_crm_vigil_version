'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerMetrics } from '@/lib/services/reports-service'

interface TopCustomersTableProps {
  data: CustomerMetrics
}

export function TopCustomersTable({ data }: TopCustomersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        {data.top_customers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-700">Cliente</th>
                  <th className="text-right py-2 font-medium text-gray-700">Total Gastado</th>
                  <th className="text-right py-2 font-medium text-gray-700">Órdenes</th>
                  <th className="text-right py-2 font-medium text-gray-700">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {data.top_customers.map((customer, index) => {
                  const avgOrderValue = customer.orders_count > 0 
                    ? customer.total_spent / customer.orders_count 
                    : 0

                  return (
                    <tr key={customer.name} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary-600 font-medium text-xs">
                              {index + 1}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {new Intl.NumberFormat('es-PA', {
                          style: 'currency',
                          currency: 'PAB'
                        }).format(customer.total_spent)}
                      </td>
                      <td className="py-3 text-right text-gray-600">
                        {customer.orders_count}
                      </td>
                      <td className="py-3 text-right text-gray-600">
                        {new Intl.NumberFormat('es-PA', {
                          style: 'currency',
                          currency: 'PAB'
                        }).format(avgOrderValue)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
