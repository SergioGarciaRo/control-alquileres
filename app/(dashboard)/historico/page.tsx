import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getTenantStatusColor, getTenantStatusLabel, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { History, Users, CreditCard, AlertTriangle } from 'lucide-react'

export default async function HistoricoPage() {
  const session = await getServerSession(authOptions)

  const properties = await prisma.property.findMany({
    where: { userId: session!.user!.id },
    include: {
      tenants: {
        include: {
          tenantPayments: {
            include: { payment: { select: { month: true, year: true, expectedAmount: true } } },
          },
          deposits: true,
        },
        orderBy: { startDate: 'desc' },
      },
      payments: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 24,
      },
      incidents: {
        orderBy: { openDate: 'desc' },
        include: { tenant: { select: { name: true } } },
      },
    },
    orderBy: { name: 'asc' },
  })

  const allTenants = properties.flatMap(p =>
    p.tenants.map(t => ({ ...t, propertyName: p.name }))
  ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Histórico completo</h2>
        <p className="text-gray-500 text-sm">Registro histórico de todas las propiedades e inquilinos</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Total propiedades</p>
            <p className="text-xl font-bold text-gray-900">{properties.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Total inquilinos</p>
            <p className="text-xl font-bold text-gray-900">{allTenants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Inquilinos activos</p>
            <p className="text-xl font-bold text-green-600">{allTenants.filter(t => t.status === 'ACTIVE').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Finalizados / Morosos</p>
            <p className="text-xl font-bold text-gray-600">
              {allTenants.filter(t => t.status === 'FINISHED').length} / {allTenants.filter(t => t.status === 'DEFAULTER').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per property history */}
      {properties.map(property => {
        const tenantHistory = property.tenants
        const incidentHistory = property.incidents
        const totalPayments = property.payments.reduce((s, p) => s + p.paidAmount, 0)
        const totalExpected = property.payments.reduce((s, p) => s + p.expectedAmount, 0)

        return (
          <Card key={property.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span>{property.name}</span>
                <span className="text-sm font-normal text-gray-500 truncate">{property.address}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Quick stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg text-center text-sm">
                <div>
                  <p className="text-xs text-gray-400">Total cobrado</p>
                  <p className="font-bold text-green-600">{formatCurrency(totalPayments)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total esperado</p>
                  <p className="font-bold text-gray-700">{formatCurrency(totalExpected)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Incidencias</p>
                  <p className="font-bold text-orange-600">{incidentHistory.length}</p>
                </div>
              </div>

              {/* Tenant history */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Historial de inquilinos ({tenantHistory.length})
                </h4>
                {tenantHistory.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin inquilinos registrados</p>
                ) : (
                  <div className="space-y-2">
                    {tenantHistory.map(tenant => {
                      const tenantPaymentsCount = tenant.tenantPayments.length
                      const unpaidPayments = tenant.tenantPayments.filter(tp => tp.status === 'UNPAID').length
                      const deposit = tenant.deposits[0]

                      return (
                        <div key={tenant.id} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 space-y-2">
                          {/* Row 1: name + status + rent */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="text-sm font-medium text-gray-900 truncate">{tenant.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${getTenantStatusColor(tenant.status)}`}>
                                {getTenantStatusLabel(tenant.status)}
                              </span>
                              {unpaidPayments > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                                  {unpaidPayments} impago(s)
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-gray-900 shrink-0">{formatCurrency(tenant.rent)}/mes</span>
                          </div>
                          {/* Row 2: dates + deposit */}
                          <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                            <span>{formatDate(tenant.startDate)} → {tenant.endDate ? formatDate(tenant.endDate) : 'Actualmente'}</span>
                            {deposit && (
                              <span className="shrink-0">
                                Fianza: {formatCurrency(deposit.amount)}
                                {deposit.status === 'RETURNED_FULL' ? ' ✓' : deposit.status === 'RETAINED' ? ' ⚠' : ''}
                              </span>
                            )}
                          </div>
                          {(tenant.phone || tenant.email) && (
                            <div className="flex gap-3 text-xs text-gray-500">
                              {tenant.phone && <span>📞 {tenant.phone}</span>}
                              {tenant.email && <span className="truncate">✉️ {tenant.email}</span>}
                            </div>
                          )}
                          {tenant.notes && (
                            <p className="text-xs text-gray-400 italic">{tenant.notes}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Payment history (last 12 months) */}
              {property.payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Historial de pagos (últimos {property.payments.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {property.payments.map(p => (
                      <div
                        key={p.id}
                        className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(p.status)}`}
                        title={`${p.month.toString().padStart(2, '0')}/${p.year} - ${formatCurrency(p.paidAmount)}/${formatCurrency(p.expectedAmount)}`}
                      >
                        {p.month.toString().padStart(2, '0')}/{p.year}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incident history */}
              {incidentHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Incidencias ({incidentHistory.length})
                  </h4>
                  <div className="space-y-1">
                    {incidentHistory.slice(0, 5).map(incident => (
                      <div key={incident.id} className="flex items-start justify-between gap-2 p-2 rounded text-xs bg-gray-50">
                        <span className="font-medium text-gray-800 min-w-0 truncate">{incident.title}</span>
                        <div className="flex items-center gap-2 text-gray-400 shrink-0">
                          {incident.cost && <span className="text-red-500 font-medium">{formatCurrency(incident.cost)}</span>}
                          <span>{formatDate(incident.openDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {properties.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-gray-600 font-medium">Sin historial disponible</h3>
          <p className="text-gray-400 text-sm">Añade propiedades e inquilinos para generar historial</p>
        </div>
      )}
    </div>
  )
}
