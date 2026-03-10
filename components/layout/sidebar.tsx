'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Building2, Users, CreditCard, Receipt,
  Shield, AlertTriangle, FileText, History, LogOut,
  ChevronLeft, ChevronRight, TrendingUp, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/propiedades', label: 'Propiedades', icon: Building2 },
  { href: '/inquilinos', label: 'Inquilinos', icon: Users },
  { href: '/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
  { href: '/fianzas', label: 'Fianzas', icon: Shield },
  { href: '/incidencias', label: 'Incidencias', icon: AlertTriangle },
  { href: '/documentos', label: 'Documentos', icon: FileText },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/rentabilidad', label: 'Rentabilidad', icon: TrendingUp },
]

interface SidebarProps {
  collapsed: boolean
  onCollapse: (v: boolean) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-gray-900 text-white flex flex-col transition-all duration-300 z-40',
        // Mobile: drawer overlay, hidden off-screen by default, shown when mobileOpen
        // Desktop (lg+): always visible, width depends on collapsed state
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        // On mobile always full width (w-60), on desktop depends on collapsed
        collapsed ? 'lg:w-16' : 'lg:w-60',
        'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-gray-700', collapsed ? 'lg:justify-center' : 'gap-3')}>
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className={cn('flex-1', collapsed && 'lg:hidden')}>
          <span className="font-bold text-white text-sm">RentalManager</span>
          <p className="text-xs text-gray-400">Gestión de alquileres</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1 rounded text-gray-400 hover:text-white"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                collapsed ? 'lg:justify-center' : '',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-gray-700 p-2 space-y-1">
        {session?.user && (
          <div className={cn('px-3 py-2', collapsed && 'lg:hidden')}>
            <p className="text-xs font-medium text-white truncate">{session.user.name || session.user.email}</p>
            <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all',
            collapsed ? 'lg:justify-center' : ''
          )}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className={cn(collapsed && 'lg:hidden')}>Cerrar sesión</span>
        </button>
        {/* Collapse toggle: desktop only */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className={cn(
            'hidden lg:flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all',
            collapsed ? 'justify-center' : ''
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Colapsar menú</span>}
        </button>
      </div>
    </aside>
  )
}
