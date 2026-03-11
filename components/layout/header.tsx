'use client'

import { Bell, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/language-context'

export function Header({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const version = 'v0.2.1'

  const pageTitleKeys: Record<string, Parameters<typeof t>[0]> = {
    '/dashboard':    'nav.dashboard',
    '/propiedades':  'nav.properties',
    '/inquilinos':   'nav.tenants',
    '/pagos':        'nav.payments',
    '/gastos':       'nav.expenses',
    '/fianzas':      'nav.deposits',
    '/incidencias':  'nav.incidents',
    '/documentos':   'nav.documents',
    '/historico':    'nav.history',
    '/rentabilidad': 'nav.profitability',
  }

  const base = '/' + pathname.split('/')[1]
  const titleKey = pageTitleKeys[base]
  const title = titleKey ? t(titleKey) : 'RentalManager'

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label={t('nav.open')}
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
