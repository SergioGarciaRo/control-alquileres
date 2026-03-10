'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { cn } from '@/lib/utils'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden transition-all duration-300',
          // En móvil el contenido ocupa todo el ancho;
          // en desktop se reserva espacio para la sidebar (colapsada o no).
          collapsed ? 'lg:ml-16' : 'lg:ml-60'
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  )
}
