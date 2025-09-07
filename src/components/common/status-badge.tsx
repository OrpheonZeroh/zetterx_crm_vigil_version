'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Default status color mappings
const statusColors = {
  // Work Order statuses
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  
  // Inspection statuses
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  
  // Inspection results
  passed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  requires_followup: 'bg-orange-100 text-orange-800 border-orange-200',
  
  // Invoice statuses
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  issued: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  
  // Installation slot statuses
  rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
  
  // Generic statuses
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200'
}

// Outline variants
const outlineColors = {
  pending: 'border-yellow-300 text-yellow-700 bg-transparent',
  approved: 'border-blue-300 text-blue-700 bg-transparent',
  in_progress: 'border-purple-300 text-purple-700 bg-transparent',
  completed: 'border-green-300 text-green-700 bg-transparent',
  cancelled: 'border-red-300 text-red-700 bg-transparent',
  scheduled: 'border-blue-300 text-blue-700 bg-transparent',
  passed: 'border-green-300 text-green-700 bg-transparent',
  failed: 'border-red-300 text-red-700 bg-transparent',
  requires_followup: 'border-orange-300 text-orange-700 bg-transparent',
  draft: 'border-gray-300 text-gray-700 bg-transparent',
  issued: 'border-blue-300 text-blue-700 bg-transparent',
  accepted: 'border-green-300 text-green-700 bg-transparent',
  rejected: 'border-red-300 text-red-700 bg-transparent',
  rescheduled: 'border-purple-300 text-purple-700 bg-transparent',
  active: 'border-green-300 text-green-700 bg-transparent',
  inactive: 'border-gray-300 text-gray-700 bg-transparent',
  success: 'border-green-300 text-green-700 bg-transparent',
  warning: 'border-yellow-300 text-yellow-700 bg-transparent',
  error: 'border-red-300 text-red-700 bg-transparent',
  info: 'border-blue-300 text-blue-700 bg-transparent'
}

// Status labels mapping
const statusLabels = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  in_progress: 'En Progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  scheduled: 'Programada',
  passed: 'Aprobada',
  failed: 'Fallida',
  requires_followup: 'Requiere Seguimiento',
  draft: 'Borrador',
  issued: 'Emitida',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  rescheduled: 'Reprogramada',
  active: 'Activo',
  inactive: 'Inactivo',
  success: 'Éxito',
  warning: 'Advertencia',
  error: 'Error',
  info: 'Información'
}

export function StatusBadge({ 
  status, 
  variant = 'default', 
  size = 'md',
  className 
}: StatusBadgeProps) {
  const colorClass = variant === 'outline' 
    ? outlineColors[status as keyof typeof outlineColors] || outlineColors.info
    : statusColors[status as keyof typeof statusColors] || statusColors.info

  const sizeClass = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }[size]

  const label = statusLabels[status as keyof typeof statusLabels] || status

  return (
    <span className={cn(
      'inline-flex items-center font-semibold rounded-full border',
      colorClass,
      sizeClass,
      className
    )}>
      {label}
    </span>
  )
}

// Helper function to get status color for custom use
export function getStatusColor(status: string, variant: 'default' | 'outline' = 'default') {
  if (variant === 'outline') {
    return outlineColors[status as keyof typeof outlineColors] || outlineColors.info
  }
  return statusColors[status as keyof typeof statusColors] || statusColors.info
}

// Helper function to get status label
export function getStatusLabel(status: string) {
  return statusLabels[status as keyof typeof statusLabels] || status
}
