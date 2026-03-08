import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Euro, Building2 } from 'lucide-react'
import { RentabilityCharts } from '@/components/dashboard/rentability-charts'

export default async function RentabilidadPage() {
  const session = await getServerSession(authOptions)

  const now = new Date()
  const currentYear = now.getFullYear()

  const properties = await prisma.property.findMany({
    where: { userId: session!.user!.id },
    include: {
      payments: {
        where: { year: { gte: currentYear - 1 } },
      },
      expenses: {
        where: { date: { gte: new Date(currentYear - 1, 0, 1) } },
      },
      tenants: { where: { status: 'ACTIVE' } },
      incidents: true,
    },
    orderBy: { name: 'asc' },
  })

  const propertyStats = properties.map(p => {
    const yearPayments = p.payments.filter(pay => pay.year === currentYear)
    const yearExpenses = p.expenses.filter(exp => new Date(exp.date).getFullYear() === currentYear)

    const totalIncome = yearPayments.reduce((s, pay) => s + pay.paidAmount, 0)
    const totalExpected = yearPayments.reduce((s, pay) => s + pay.expectedAmount, 0)
    const totalExpenses = yearExpenses.reduce((s, exp) => s + exp.amount, 0)
    const netProfit = totalIncome - totalExpenses
    const annualExpected = p.expectedRent * 12
    const grossYield = annualExpected > 0 ? (totalIncome / annualExpected) * 100 : 0
    const netYield = p.expectedRent > 0 ? (netProfit / (p.expectedRent * 12)) * 100 : 0
    const collectionRate = totalExpected > 0 ? (totalIncome / totalExpected) * 100 : 0
    const monthsWithIncome = yearPayments.filter(pay => pay.paidAmount > 0).length
    const unpaidCount = yearPayments.filter(pay => pay.status === 'UNPAID').length

    // Monthly breakdown
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const monthPayments = p.payments.filter(pay => pay.month === month && pay.year === currentYear)
      const monthExpenses = p.expenses.filter(exp => {
        const d = new Date(exp.date)
        return d.getMonth() + 1 === month && d.getFullYear() === currentYear
      })
      return {
        month,
        income: monthPayments.reduce((s, pay) => s + pay.paidAmount, 0),
        expenses: monthExpenses.reduce((s, exp) => s + exp.amount, 0),
        expected: monthPayments.reduce((s, pay) => s + pay.expectedAmount, 0),
      }
    })

    return {
      id: p.id,
      name: p.name,
      address: p.address,
      type: p.type,
      expectedRent: p.expectedRent,
      fixedExpenses: p.fixedExpenses,
      status: p.status,
      activeTenants: p.tenants.length,
      totalIncome,
      totalExpected,
      totalExpenses,
      netProfit,
      grossYield: Math.round(grossYield * 100) / 100,
      netYield: Math.round(netYield * 100) / 100,
      collectionRate: Math.round(collectionRate * 100) / 100,
      monthsWithIncome,
      unpaidCount,
      monthly,
      incidentCost: p.incidents.reduce((s, i) => s + (i.cost || 0), 0),
    }
  }).sort((a, b) => b.netYield - a.netYield)

  const globalStats = {
    totalIncome: propertyStats.reduce((s, p) => s + p.totalIncome, 0),
    totalExpenses: propertyStats.reduce((s, p) => s + p.totalExpenses, 0),
    netProfit: propertyStats.reduce((s, p) => s + p.netProfit, 0),
    bestProperty: propertyStats[0],
    worstProperty: propertyStats[propertyStats.length - 1],
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Análisis de Rentabilidad</h2>
        <p className="text-gray-500 text-sm">Año {currentYear} · Análisis por propiedad</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Ingresos totales {currentYear}</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(globalStats.totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Gastos totales {currentYear}</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(globalStats.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Beneficio neto {currentYear}</p>
            <p className={`text-xl font-bold ${globalStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(globalStats.netProfit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Propiedades</p>
            <p className="text-xl font-bold text-gray-900">{properties.length}</p>
            <p className="text-xs text-gray-400">{properties.filter(p => p.status === 'OCCUPIED').length} ocupadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Best / Worst */}
      {propertyStats.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-green-800">Más rentable</p>
              </div>
              <p className="text-base font-bold text-gray-900">{globalStats.bestProperty?.name}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">+{globalStats.bestProperty?.netYield}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(globalStats.bestProperty?.netProfit || 0)} beneficio neto
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <p className="text-sm font-semibold text-red-800">Menos rentable</p>
              </div>
              <p className="text-base font-bold text-gray-900">{globalStats.worstProperty?.name}</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{globalStats.worstProperty?.netYield}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(globalStats.worstProperty?.netProfit || 0)} beneficio neto
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per property analysis */}
      <div className="space-y-4">
        {propertyStats.map((prop, idx) => (
          <Card key={prop.id} className={`${prop.netYield < 0 ? 'border-red-200' : prop.netYield > 50 ? 'border-green-200' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-600' :
                    'bg-gray-50 text-gray-500'
                  }`}>#{idx + 1}</div>
                  <div>
                    <span>{prop.name}</span>
                    <p className="text-xs font-normal text-gray-400">{prop.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${prop.netYield >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {prop.netYield > 0 ? '+' : ''}{prop.netYield}%
                  </p>
                  <p className="text-xs text-gray-400">rentabilidad neta</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                {[
                  { label: 'Renta esperada/mes', value: formatCurrency(prop.expectedRent) },
                  { label: 'Total cobrado', value: formatCurrency(prop.totalIncome), color: 'text-green-600' },
                  { label: 'Total gastos', value: formatCurrency(prop.totalExpenses), color: 'text-red-600' },
                  { label: 'Beneficio neto', value: formatCurrency(prop.netProfit), color: prop.netProfit >= 0 ? 'text-green-600' : 'text-red-600' },
                  { label: 'Tasa de cobro', value: `${prop.collectionRate}%`, color: prop.collectionRate >= 80 ? 'text-green-600' : 'text-red-600' },
                  { label: 'Meses sin pago', value: prop.unpaidCount.toString(), color: prop.unpaidCount > 0 ? 'text-red-600' : 'text-green-600' },
                ].map(stat => (
                  <div key={stat.label} className="p-2 rounded-lg bg-gray-50 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">{stat.label}</p>
                    <p className={`text-sm font-bold ${stat.color || 'text-gray-900'}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Monthly mini chart */}
              <div className="h-20 flex items-end gap-1">
                {prop.monthly.map(m => {
                  const maxVal = Math.max(...prop.monthly.map(mm => Math.max(mm.income, mm.expenses)), 1)
                  const incomeH = (m.income / maxVal) * 100
                  const expensesH = (m.expenses / maxVal) * 100
                  const months = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex items-end gap-0.5" style={{ height: '64px' }}>
                        <div
                          className="flex-1 rounded-sm bg-blue-400 opacity-80"
                          style={{ height: `${Math.max(incomeH, 2)}%` }}
                          title={`Ingresos: ${formatCurrency(m.income)}`}
                        />
                        <div
                          className="flex-1 rounded-sm bg-red-400 opacity-80"
                          style={{ height: `${Math.max(expensesH, m.expenses > 0 ? 2 : 0)}%` }}
                          title={`Gastos: ${formatCurrency(m.expenses)}`}
                        />
                      </div>
                      <span className="text-xs text-gray-300">{months[m.month - 1]}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span><span className="inline-block w-3 h-3 rounded-sm bg-blue-400 mr-1" />Ingresos</span>
                <span><span className="inline-block w-3 h-3 rounded-sm bg-red-400 mr-1" />Gastos</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-gray-600 font-medium">Sin datos de rentabilidad</h3>
          <p className="text-gray-400 text-sm">Añade propiedades y registra pagos para ver el análisis</p>
        </div>
      )}
    </div>
  )
}
