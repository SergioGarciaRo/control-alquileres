import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  formatCurrency, formatDate, formatMonth,
  getPaymentStatusColor, getPaymentStatusLabel,
  getTenantStatusColor, getTenantStatusLabel,
  getDepositStatusLabel, getDepositStatusColor,
  getIncidentPriorityColor, getIncidentStatusLabel,
} from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Phone, Mail, Calendar, Building2, CreditCard,
  FileText, Wrench, AlertTriangle, CheckCircle, XCircle,
  Clock, Paperclip, Euro,
} from 'lucide-react'

type Params = { params: Promise<{ id: string }> }

export default async function TenantDetailPage({ params }: Params) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const tenant = await prisma.tenant.findFirst({
    where: { id, property: { userId: session!.user!.id } },
    include: {
      property: { select: { id: true, name: true, address: true, expectedRent: true } },
      deposits: { orderBy: { deliveryDate: 'desc' } },
      incidents: {
        include: { property: { select: { name: true } } },
        orderBy: { openDate: 'desc' },
      },
      documents: { orderBy: { createdAt: 'desc' } },
      tenantPayments: {
        include: {
          payment: {
            select: {
              id: true, month: true, year: true,
              expectedAmount: true, paidAmount: true,
              status: true, paidDate: true, method: true,
              receiptUrl: true, receiptName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!tenant) notFound()

  // Also fetch all property payments for this tenant's tenure period
  const propertyPayments = await prisma.payment.findMany({
    where: {
      propertyId: tenant.propertyId,
      OR: [
        // Payments within the tenant's contract period
        {
          AND: [
            { year: { gte: new Date(tenant.startDate).getFullYear() } },
          ],
        },
      ],
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: 36,
  })

  const daysUntilExpiry = tenant.endDate
    ? Math.floor((new Date(tenant.endDate).getTime() - Date.now()) / 86400000)
    : null

  const totalPaid = propertyPayments.reduce((s, p) => s + p.paidAmount, 0)
  const totalExpected = propertyPayments.reduce((s, p) => s + p.expectedAmount, 0)
  const unpaidCount = propertyPayments.filter(p => p.status === 'UNPAID').length
  const totalDebt = propertyPayments.reduce((s, p) => {
    if (p.status === 'UNPAID') return s + p.expectedAmount
    if (p.status === 'PARTIAL') return s + (p.expectedAmount - p.paidAmount)
    return s
  }, 0)

  const statusIcon = (status: string) => {
    if (status === 'PAID') return <CheckCircle className="w-3.5 h-3.5 text-green-500" />
    if (status === 'UNPAID') return <XCircle className="w-3.5 h-3.5 text-red-500" />
    if (status === 'PARTIAL') return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
    return <Clock className="w-3.5 h-3.5 text-yellow-500" />
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/inquilinos" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a inquilinos
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{tenant.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTenantStatusColor(tenant.status)}`}>
                  {getTenantStatusLabel(tenant.status)}
                </span>
                {daysUntilExpiry !== null && daysUntilExpiry <= 60 && daysUntilExpiry > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    Contrato vence en {daysUntilExpiry} días
                  </span>
                )}
                {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Contrato vencido
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Renta mensual</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(tenant.rent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Total cobrado</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={`p-4 ${totalDebt > 0 ? 'bg-red-50' : ''}`}>
            <p className="text-xs text-gray-400 mb-1">Deuda pendiente</p>
            <p className={`text-lg font-bold ${totalDebt > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {formatCurrency(totalDebt)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Tasa de cobro</p>
            <p className={`text-lg font-bold ${totalExpected > 0 && totalPaid / totalExpected >= 0.9 ? 'text-green-600' : 'text-orange-600'}`}>
              {totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: contact + contract info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Datos de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {tenant.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${tenant.phone}`} className="hover:text-blue-600">{tenant.phone}</a>
                </div>
              )}
              {tenant.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${tenant.email}`} className="hover:text-blue-600 truncate">{tenant.email}</a>
                </div>
              )}
              {!tenant.phone && !tenant.email && (
                <p className="text-sm text-gray-400">Sin datos de contacto</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <Link href={`/propiedades/${tenant.property.id}`} className="hover:text-blue-600 font-medium">
                  {tenant.property.name}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Inicio: {formatDate(tenant.startDate)}</span>
              </div>
              {tenant.endDate && (
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Fin: {formatDate(tenant.endDate)}</span>
                </div>
              )}
              {tenant.notes && (
                <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-2 mt-2">{tenant.notes}</p>
              )}
            </CardContent>
          </Card>

          {/* Deposits */}
          {tenant.deposits.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Euro className="w-4 h-4 text-gray-400" />
                  Fianzas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {tenant.deposits.map(dep => (
                  <div key={dep.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{formatCurrency(dep.amount)}</p>
                      <p className="text-xs text-gray-400">{formatDate(dep.deliveryDate)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getDepositStatusColor(dep.status)}`}>
                      {getDepositStatusLabel(dep.status)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: payments + documents + incidents */}
        <div className="lg:col-span-2 space-y-4">
          {/* Payment history */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                Historial de pagos
                {unpaidCount > 0 && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {unpaidCount} impago{unpaidCount > 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {propertyPayments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin pagos registrados</p>
              ) : (
                <div className="space-y-1">
                  {propertyPayments.map(pay => (
                    <div key={pay.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      pay.status === 'UNPAID' ? 'bg-red-50' :
                      pay.status === 'PARTIAL' ? 'bg-orange-50' :
                      'hover:bg-gray-50'
                    }`}>
                      {statusIcon(pay.status)}
                      <span className="font-medium text-gray-700 w-28 shrink-0 capitalize">
                        {formatMonth(pay.month, pay.year)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusColor(pay.status)}`}>
                        {getPaymentStatusLabel(pay.status)}
                      </span>
                      <span className="ml-auto font-medium text-gray-900">{formatCurrency(pay.paidAmount)}</span>
                      {pay.status === 'PARTIAL' && (
                        <span className="text-xs text-red-500">
                          (debe {formatCurrency(pay.expectedAmount - pay.paidAmount)})
                        </span>
                      )}
                      {pay.receiptUrl ? (
                        <a href={pay.receiptUrl} target="_blank" rel="noopener noreferrer"
                          title={pay.receiptName ?? 'Ver justificante'}
                          className="text-green-600 hover:text-green-700 shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <Paperclip className="w-3.5 h-3.5 text-gray-200 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          {tenant.documents.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {tenant.documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 text-sm hover:bg-gray-50 px-2 py-1.5 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-blue-600 hover:underline truncate">{doc.name}</a>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(doc.createdAt)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Incidents */}
          {tenant.incidents.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-gray-400" />
                  Incidencias asociadas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {tenant.incidents.map(inc => (
                  <div key={inc.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 text-sm">
                    <span className={`mt-0.5 text-xs px-1.5 py-0.5 rounded-full shrink-0 ${getIncidentPriorityColor(inc.priority)}`}>
                      {inc.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{inc.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(inc.openDate)}</p>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{getIncidentStatusLabel(inc.status)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
