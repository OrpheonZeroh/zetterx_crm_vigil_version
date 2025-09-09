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
  ClipboardList,
  Calculator,
  Bot,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Productos', href: '/products', icon: Building2 },
  { name: 'Órdenes', href: '/work-orders', icon: FileText },
  { name: 'Cotizaciones', href: '/quotes', icon: Calculator },
  { name: 'Inspecciones', href: '/inspections', icon: ClipboardList },
  { name: 'Agenda', href: '/calendar', icon: Calendar },
  { name: 'Facturación', href: '/invoices', icon: CreditCard },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'IA', href: '/ai', icon: Bot },
  { name: 'Configuración', href: '/settings', icon: Settings },
]

interface SidebarProps {
  onCloseMobile?: () => void
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn(
      "sidebar bg-white border-r border-gray-200 flex flex-col h-full",
      collapsed ? "w-16" : "w-64"
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
        <div className="flex items-center space-x-1">
          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors lg:hidden"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors hidden lg:block"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile} // Close mobile menu on navigation
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500" 
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "flex-shrink-0",
                collapsed ? "w-5 h-5" : "w-5 h-5 mr-3"
              )} />
              {!collapsed && <span className="truncate">{item.name}</span>}
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
