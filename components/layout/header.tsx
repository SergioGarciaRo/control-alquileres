'use client'

import { Bell, Search } from 'lucide-react'
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

export function Header() {
  const pathname = usePathname()
  const base = '/' + pathname.split('/')[1]
  const title = pageTitles[base] || 'RentalManager'

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
      </div>
    </header>
  )
}
