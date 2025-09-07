'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Plus, Edit2, Trash2, Calendar, DollarSign } from 'lucide-react'
import { SalesTargetService, type WeeklyTarget } from '@/lib/services/sales-target-service'

export function SalesTargets() {
  const [targets, setTargets] = useState<WeeklyTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTarget, setEditingTarget] = useState<WeeklyTarget | null>(null)
  const [newTarget, setNewTarget] = useState({
    week_start: '',
    amount_target: ''
  })

  useEffect(() => {
    loadTargets()
  }, [])

  const loadTargets = async () => {
    try {
      setLoading(true)
      const data = await SalesTargetService.getWeeklyTargets()
      setTargets(data)
    } catch (error) {
      console.error('Error loading sales targets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newTarget.week_start || !newTarget.amount_target) return

    try {
      await SalesTargetService.createWeeklyTarget({
        week_start: newTarget.week_start,
        amount_target: parseFloat(newTarget.amount_target)
      })
      setNewTarget({ week_start: '', amount_target: '' })
      loadTargets()
    } catch (error) {
      console.error('Error creating target:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingTarget) return

    try {
      await SalesTargetService.updateWeeklyTarget(editingTarget.id, {
        amount_target: editingTarget.amount_target
      })
      setEditingTarget(null)
      loadTargets()
    } catch (error) {
      console.error('Error updating target:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta meta?')) return

    try {
      await SalesTargetService.deleteWeeklyTarget(id)
      loadTargets()
    } catch (error) {
      console.error('Error deleting target:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'PAB'
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getWeekEndDate = (weekStart: string) => {
    const start = new Date(weekStart + 'T00:00:00')
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return end.toLocaleDateString('es-PA', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Metas de Ventas</h2>
          <p className="text-gray-600 mt-1">Configura metas semanales y mensuales</p>
        </div>
        <Button className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Generar Metas Automáticas
        </Button>
      </div>

      {/* Create New Target */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nueva Meta Semanal
          </CardTitle>
          <CardDescription>
            Establece una meta de ventas para una semana específica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inicio de Semana (Lunes)
              </label>
              <Input
                type="date"
                value={newTarget.week_start}
                onChange={(e) => setNewTarget(prev => ({ ...prev, week_start: e.target.value }))}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta de Ventas (PAB)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="3000.00"
                value={newTarget.amount_target}
                onChange={(e) => setNewTarget(prev => ({ ...prev, amount_target: e.target.value }))}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={!newTarget.week_start || !newTarget.amount_target}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear Meta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Targets List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Metas Configuradas</h3>
        
        {targets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay metas configuradas</h3>
              <p className="text-gray-600">Crea tu primera meta semanal para comenzar a hacer seguimiento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {targets.map((target) => (
              <Card key={target.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        Semana del {new Date(target.week_start + 'T00:00:00').toLocaleDateString('es-PA', { month: 'short', day: 'numeric' })} - {getWeekEndDate(target.week_start)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTarget(target)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(target.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    {editingTarget?.id === target.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingTarget.amount_target}
                        onChange={(e) => setEditingTarget(prev => 
                          prev ? { ...prev, amount_target: parseFloat(e.target.value) } : null
                        )}
                        className="text-lg font-bold"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(target.amount_target)}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {formatDate(target.week_start)}
                  </p>

                  {editingTarget?.id === target.id && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdate}>
                        Guardar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingTarget(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
