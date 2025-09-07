'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { RouteGuard } from '@/components/layout/route-guard'
import { Button } from '@/components/ui/button'
import { Settings, Users, Building, Shield, Globe, Target } from 'lucide-react'
import { UserManagement } from '@/components/settings/user-management'
import { SalesTargets } from '@/components/settings/sales-targets'
import { PasswordManagement } from '@/components/settings/password-management'
import { cn } from '@/lib/utils'

type SettingsTab = 'users' | 'organization' | 'sales-targets' | 'security' | 'integrations'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('users')

  const tabs = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'organization', label: 'Organización', icon: Building },
    { id: 'sales-targets', label: 'Metas de Ventas', icon: Target },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'integrations', label: 'Integraciones', icon: Globe }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />
      case 'organization':
        return (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración de Organización</h3>
            <p className="text-gray-600">Próximamente disponible</p>
          </div>
        )
      case 'sales-targets':
        return <SalesTargets />
      case 'security':
        return <PasswordManagement />
      case 'integrations':
        return (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Integraciones</h3>
            <p className="text-gray-600">Próximamente disponible</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <RouteGuard requiredModule="settings">
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-900">
                Configuración
              </h1>
              <p className="text-gray-600 mt-2">
                Administra usuarios y configuraciones del sistema
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={cn(
                        'flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </MainLayout>
    </RouteGuard>
  )
}
