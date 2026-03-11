import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, getDaysOverdue, getPaymentStatusColor, getIncidentStatusColor, getIncidentPriorityColor } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Wrench
} from 'lucide-react'
import Link from 'next/link'
import { DashboardCharts } from '@/components/dashboard/charts'
import { getServerLang, tServer } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

async function getDashboardData(userId: string) {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthStart = new Date(currentYear, currentMonth - 1, 1)
  const monthEnd = new Date(currentYear, currentMonth, 1)

  const trendMonths = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i
    const m = currentMonth - offset <= 0 ? currentMonth - offset + 12 : currentMonth - offset
    const y = currentMonth - offset <= 0 ? currentYear - 1 : currentYear
    return { m, y }
  })
  const trendStart = new Date(trendMonths[0].y, trendMonths[0].m - 1, 1)

  const [properties, overduePayments, openIncidents, trendPayments, trendExpenses] = await Promise.all([
    prisma.property.findMany({
      where: { userId },
      include: {
        tenants: true,
        payments: { where: { month: currentMonth, year: currentYear } },
        expenses: { where: { date: { gte: monthStart, lt: monthEnd } } },
        incidents: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } },
      },
    }),
    prisma.payment.findMany({
      where: { property: { userId }, status: { in: ['PENDING', 'PARTIAL', 'UNPAID'] }, dueDate: { lt: now } },
      include: { property: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 8,
    }),
    prisma.incident.findMany({
      where: { property: { userId }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      include: { property: { select: { name: true } } },
      orderBy: { priority: 'desc' },
      take: 5,
    }),
    prisma.payment.findMany({
      where: { property: { userId }, OR: trendMonths.map(({ m, y }) => ({ month: m, year: y })) },
      select: { month: true, year: true, paidAmount: true, expectedAmount: true },
    }),
    prisma.expense.findMany({
      where: { property: { userId }, date: { gte: trendStart, lt: monthEnd } },
      select: { date: true, amount: true },
    }),
  ])

  const totalProperties = properties.length
  const occupiedProperties = properties.filter(p => p.status === 'OCCUPIED').length
  const availableProperties = properties.filter(p => p.status === 'AVAILABLE').length

  let monthlyIncome = 0, monthlyExpenses = 0, totalDebt = 0, totalExpected = 0

  const propertyStats = properties.map(p => {
    const income = p.payments.reduce((s, pay) => s + pay.paidAmount, 0)
    const expenses = p.expenses.reduce((s, exp) => s + exp.amount, 0)
    const expected = p.payments.reduce((s, pay) => s + pay.expectedAmount, 0)
    monthlyIncome += income
    monthlyExpenses += expenses
    totalExpected += expected

    const debt = p.payments.reduce((s, pay) => {
      if (pay.status === 'UNPAID') return s + pay.expectedAmount
      if (pay.status === 'PARTIAL') return s + (pay.expectedAmount - pay.paidAmount)
      return s
    }, 0)
    totalDebt += debt

    const netProfit = income - expenses
    const rentability = p.expectedRent > 0 ? (netProfit / p.expectedRent) * 100 : 0
    return {
      id: p.id, name: p.name, status: p.status, income, expenses, netProfit,
      rentability: Math.round(rentability * 100) / 100,
      activeTenants: p.tenants.filter(t => t.status === 'ACTIVE').length,
      openIncidents: p.incidents.length,
    }
  }).sort((a, b) => b.rentability - a.rentability)

  const monthlyTrend = trendMonths.map(({ m, y }) => {
    const income = trendPayments.filter(p => p.month === m && p.year === y).reduce((s, p) => s + p.paidAmount, 0)
    const expected = trendPayments.filter(p => p.month === m && p.year === y).reduce((s, p) => s + p.expectedAmount, 0)
    const expenses = trendExpenses
      .filter(e => { const d = new Date(e.date); return d.getMonth() + 1 === m && d.getFullYear() === y })
      .reduce((s, e) => s + e.amount, 0)
    return { month: `${m.toString().padStart(2, '0')}/${y}`, income, expenses, expected }
  })

  const collectionRate = totalExpected > 0 ? Math.round((monthlyIncome / totalExpected) * 100) : 0

  return {
    totalProperties, occupiedProperties, availableProperties,
    monthlyIncome, monthlyExpenses, monthlyNetProfit: monthlyIncome - monthlyExpenses,
    totalDebt, overduePayments, openIncidents, propertyStats, monthlyTrend, collectionRate,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const data = await getDashboardData(session!.user!.id)
  const lang = await getServerLang()
  const T = (key: Parameters<typeof tServer>[0], vars?: Record<string, string | number>) =>
    tServer(key, lang, vars)

  const dict = translations[lang] as Record<string, string>
  const paymentStatusLabel = (s: string) => dict[`status.payment.${s}`] ?? s
  const incidentStatusLabel = (s: string) => dict[`status.incident.${s}`] ?? s
  const priorityLabel = (s: string) => dict[`status.priority.${s}`] ?? s

  const statCards = [
    {
      title: T('stat.properties'),
      value: data.totalProperties,
      sub: T('stat.properties_sub', { occupied: data.occupiedProperties, available: data.availableProperties }),
      icon: Building2, color: 'blue',
    },
    {
      title: T('stat.income'),
      value: formatCurrency(data.monthlyIncome),
      sub: T('stat.income_sub', { rate: data.collectionRate }),
      icon: data.monthlyIncome > 0 ? ArrowUpRight : ArrowDownRight,
      color: data.monthlyIncome > 0 ? 'green' : 'red',
    },
    {
      title: T('stat.expenses'),
      value: formatCurrency(data.monthlyExpenses),
      sub: T('stat.expenses_sub'),
      icon: ReceiptIcon, color: 'orange',
    },
    {
      title: T('stat.profit'),
      value: formatCurrency(data.monthlyNetProfit),
      sub: data.monthlyNetProfit >= 0 ? T('stat.profit_positive') : T('stat.profit_negative'),
      icon: data.monthlyNetProfit >= 0 ? TrendingUp : TrendingDown,
      color: data.monthlyNetProfit >= 0 ? 'green' : 'red',
    },
    {
      title: T('stat.debt'),
      value: formatCurrency(data.totalDebt),
      sub: T('stat.debt_sub', { count: data.overduePayments.length }),
      icon: XCircle, color: data.totalDebt > 0 ? 'red' : 'green',
    },
    {
      title: T('stat.incidents'),
      value: data.openIncidents.length,
      sub: data.openIncidents.length > 0 ? T('stat.incidents_active') : T('stat.incidents_none'),
      icon: AlertTriangle, color: data.openIncidents.length > 0 ? 'yellow' : 'green',
    },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  }

  const dateLocale = lang === 'en' ? 'en-GB' : 'es-ES'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{T('dashboard.title')}</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {new Date().toLocaleDateString(dateLocale, { month: 'long', year: 'numeric', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg border mb-3 ${colorMap[stat.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-1">{stat.title}</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DashboardCharts monthlyTrend={data.monthlyTrend} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                {T('dashboard.overdue_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {data.overduePayments.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{T('dashboard.overdue_empty')}</span>
                </div>
              ) : (
                data.overduePayments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{payment.property.name}</p>
                      <p className="text-xs text-gray-500">
                        {payment.month.toString().padStart(2, '0')}/{payment.year} · {T('dashboard.overdue_days', { days: getDaysOverdue(payment.dueDate) })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-red-600">{formatCurrency(payment.expectedAmount - payment.paidAmount)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${getPaymentStatusColor(payment.status)}`}>
                        {paymentStatusLabel(payment.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {data.overduePayments.length > 0 && (
                <Link href="/pagos?status=UNPAID" className="text-xs text-blue-600 hover:underline block text-center">
                  {T('dashboard.overdue_view_all', { count: data.overduePayments.length })}
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" />
                {T('dashboard.incidents_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {data.openIncidents.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{T('dashboard.incidents_empty')}</span>
                </div>
              ) : (
                data.openIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{incident.title}</p>
                      <p className="text-xs text-gray-500 truncate">{incident.property.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${getIncidentStatusColor(incident.status)}`}>
                        {incidentStatusLabel(incident.status)}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${getIncidentPriorityColor(incident.priority)}`}>
                        {priorityLabel(incident.priority)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {data.openIncidents.length > 0 && (
                <Link href="/incidencias" className="text-xs text-blue-600 hover:underline block text-center">
                  {T('dashboard.incidents_view_all')}
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {T('dashboard.ranking_title')}
            </CardTitle>
            <Link href="/rentabilidad" className="text-sm text-blue-600 hover:underline">
              {T('dashboard.ranking_view')}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.propertyStats.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{T('dashboard.no_properties')}</p>
              <Link href="/propiedades" className="text-blue-600 text-sm hover:underline mt-1 block">
                {T('dashboard.add_property')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.propertyStats.map((prop, idx) => (
                <Link key={prop.id} href={`/propiedades/${prop.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{prop.name}</p>
                      <p className="text-xs text-gray-500">
                        {T('dashboard.tenant_count', { tenants: prop.activeTenants, incidents: prop.openIncidents })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${prop.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(prop.netProfit)}
                      </p>
                      <p className={`text-xs font-semibold ${prop.rentability >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {prop.rentability > 0 ? '+' : ''}{prop.rentability}%
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  )
}
