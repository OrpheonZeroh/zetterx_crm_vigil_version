'use client'

import { useState, useEffect, useContext, createContext, type ReactNode, createElement } from 'react'
import { AuthService, type UserProfile } from '@/lib/services/auth-service'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  hasPermission: (module: string, action: string) => Promise<boolean>
  canAccessModule: (module: string) => Promise<boolean>
  getAccessibleModules: () => Promise<string[]>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    try {
      const profile = await AuthService.getCurrentProfile()
      setUser(profile)
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const hasPermission = async (module: string, action: string) => {
    return await AuthService.hasPermission(module, action)
  }

  const canAccessModule = async (module: string) => {
    return await AuthService.canAccessModule(module)
  }

  const getAccessibleModules = async () => {
    return await AuthService.getAccessibleModules()
  }

  const refreshUser = async () => {
    await loadUser()
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    hasPermission,
    canAccessModule,
    getAccessibleModules,
    refreshUser
  }

  return createElement(AuthContext.Provider, { value: contextValue }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo
    }
  }, [user, loading, redirectTo])

  return { user, loading }
}

export function useRequirePermission(module: string, action: string = 'read') {
  const { user, hasPermission } = useAuth()
  const [canAccess, setCanAccess] = useState<boolean | null>(null)

  useEffect(() => {
    if (user) {
      hasPermission(module, action).then(setCanAccess)
    } else {
      setCanAccess(false)
    }
  }, [user, module, action, hasPermission])

  return canAccess
}
