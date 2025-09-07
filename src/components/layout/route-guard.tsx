'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/common'
import { AlertCircle, Lock } from 'lucide-react'

interface RouteGuardProps {
  children: React.ReactNode
  requiredModule: string
  requiredAction?: string
  fallback?: React.ReactNode
}

export function RouteGuard({ 
  children, 
  requiredModule, 
  requiredAction = 'read', 
  fallback 
}: RouteGuardProps) {
  const { user, loading, hasPermission } = useAuth()
  const [canAccess, setCanAccess] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading && user) {
      hasPermission(requiredModule, requiredAction).then(setCanAccess)
    } else if (!loading && !user) {
      setCanAccess(false)
    }
  }, [user, loading, requiredModule, requiredAction, hasPermission])

  // Show loading spinner while checking authentication
  if (loading || canAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show login redirect if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Sesión requerida
          </h2>
          <p className="text-gray-600 mb-4">
            Debes iniciar sesión para acceder a esta página
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    )
  }

  // Show access denied if no permissions
  if (!canAccess) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta sección
          </p>
          <p className="text-sm text-gray-500">
            Contacta al administrador si crees que esto es un error
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Higher-order component for route protection
export function withRouteGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredModule: string,
  requiredAction: string = 'read'
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard requiredModule={requiredModule} requiredAction={requiredAction}>
        <WrappedComponent {...props} />
      </RouteGuard>
    )
  }
}
