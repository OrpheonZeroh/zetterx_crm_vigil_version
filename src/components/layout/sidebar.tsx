'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  CreditCard,
  ClipboardList
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Productos', href: '/products', icon: Building2 },
  { name: 'Órdenes', href: '/work-orders', icon: FileText },
  { name: 'Inspecciones', href: '/inspections', icon: ClipboardList },
  { name: 'Agenda', href: '/calendar', icon: Calendar },
  { name: 'Facturación', href: '/invoices', icon: CreditCard },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Configuración', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn(
      "sidebar",
      collapsed ? "sidebar-collapsed" : "sidebar-expanded"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Image
              src="/sin_fondoBgColor.png"
              alt="Zetterx Logo"
              width={80}
              height={20}
              className="object-contain"
            />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "nav-item",
                isActive ? "nav-item-active" : "nav-item-inactive"
              )}
            >
              <item.icon className={cn(
                "flex-shrink-0",
                collapsed ? "w-5 h-5" : "w-5 h-5 mr-3"
              )} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed && (
          <div className="text-xs text-gray-500 text-center">
            <p>Zetterx CRM</p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  )
}
