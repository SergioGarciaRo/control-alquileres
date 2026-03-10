'use client'

import { Bell, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/propiedades': 'Propiedades',
  '/inquilinos': 'Inquilinos',
  '/pagos': 'Pagos',
  '/gastos': 'Gastos',
  '/fianzas': 'Fianzas',
  '/incidencias': 'Incidencias',
  '/documentos': 'Documentos',
  '/historico': 'Histórico',
  '/rentabilidad': 'Rentabilidad',
}

interface HeaderProps {
  onMobileMenuToggle: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const base = '/' + pathname.split('/')[1]
  const title = pageTitles[base] || 'RentalManager'
  const version = 'v0.2.1'

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
          {version}
        </span>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
      </div>
    </header>
  )
}
