'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Building2, MapPin, Users, CreditCard, Receipt, Shield,
  AlertTriangle, FileText, TrendingUp, Calendar, Edit2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  formatCurrency, formatDate, getPropertyStatusColor, getPropertyStatusLabel,
  getPropertyTypeLabel, getPaymentStatusColor, getPaymentStatusLabel,
  getTenantStatusColor, getTenantStatusLabel, getIncidentStatusColor,
  getIncidentStatusLabel, getIncidentPriorityColor, getExpenseCategoryLabel
} from '@/lib/utils'
import { PropertyFormDialog } from './property-form-dialog'

interface Props {
  property: any
}

export function PropertyDetail({ property: initialProperty }: Props) {
  const [property, setProperty] = useState(initialProperty)
  const [showEditForm, setShowEditForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'payments' | 'expenses' | 'incidents' | 'deposits'>('overview')

  const activeTenants = property.tenants.filter((t: any) => t.status === 'ACTIVE')
  const historicalTenants = property.tenants.filter((t: any) => t.status !== 'ACTIVE')
  const totalIncome = property.payments.reduce((s: number, p: any) => s + p.paidAmount, 0)
  const totalExpected = property.payments.reduce((s: number, p: any) => s + p.expectedAmount, 0)
  const totalExpenses = property.expenses.reduce((s: number, e: any) => s + e.amount, 0)
  const netProfit = totalIncome - totalExpenses
  const collectionRate = totalExpected > 0 ? Math.round((totalIncome / totalExpected) * 100) : 0

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'tenants', label: `Inquilinos (${activeTenants.length})`, icon: Users },
    { id: 'payments', label: `Pagos (${property.payments.length})`, icon: CreditCard },
    { id: 'expenses', label: `Gastos (${property.expenses.length})`, icon: Receipt },
    { id: 'incidents', label: `Incidencias (${property.incidents.length})`, icon: AlertTriangle },
    { id: 'deposits', label: `Fianzas (${property.deposits.length})`, icon: Shield },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/propiedades">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{property.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{property.address}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPropertyStatusColor(property.status)}`}>
            {getPropertyStatusLabel(property.status)}
          </span>
          <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
            <Edit2 className="w-3.5 h-3.5" />
            Editar
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total cobrado', value: formatCurrency(totalIncome), color: 'text-green-600' },
          { label: 'Total gastos', value: formatCurrency(totalExpenses), color: 'text-red-600' },
          { label: 'Beneficio neto', value: formatCurrency(netProfit), color: netProfit >= 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'Tasa de cobro', value: `${collectionRate}%`, color: collectionRate >= 80 ? 'text-green-600' : 'text-red-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo</span>
                <span className="font-medium">{getPropertyTypeLabel(property.type)}</span>
              </div>
              {property.rooms && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Habitaciones</span>
                  <span className="font-medium">{property.rooms}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Renta esperada</span>
                <span className="font-medium">{formatCurrency(property.expectedRent)}/mes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gastos fijos</span>
                <span className="font-medium">{formatCurrency(property.fixedExpenses)}/mes</span>
              </div>
              {property.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Notas</p>
                  <p className="text-sm text-gray-600">{property.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Inquilinos activos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {activeTenants.length === 0 ? (
                <p className="text-sm text-gray-400">Sin inquilinos activos</p>
              ) : (
                activeTenants.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-gray-400">
                        Desde {formatDate(t.startDate)}
                        {t.endDate ? ` hasta ${formatDate(t.endDate)}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(t.rent)}/mes</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'tenants' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Todos los inquilinos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {property.tenants.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">Sin inquilinos registrados</p>
            ) : (
              <div className="space-y-3">
                {property.tenants.map((t: any) => (
                  <div key={t.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{t.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTenantStatusColor(t.status)}`}>
                          {getTenantStatusLabel(t.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(t.startDate)} — {t.endDate ? formatDate(t.endDate) : 'Indefinido'}
                      </p>
                      {t.phone && <p className="text-xs text-gray-400">{t.phone}</p>}
                      {t.notes && <p className="text-xs text-gray-400 italic">{t.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(t.rent)}/mes</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Historial de pagos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {property.payments.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">Sin pagos registrados</p>
            ) : (
              <div className="space-y-2">
                {property.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">
                        {p.month.toString().padStart(2, '0')}/{p.year}
                      </p>
                      {p.paidDate && <p className="text-xs text-gray-400">Pagado: {formatDate(p.paidDate)}</p>}
                      {p.method && <p className="text-xs text-gray-400">{p.method}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className={p.paidAmount > 0 ? 'text-green-600 font-bold' : 'text-gray-400'}>
                          {formatCurrency(p.paidAmount)}
                        </span>
                        <span className="text-gray-400"> / {formatCurrency(p.expectedAmount)}</span>
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusColor(p.status)}`}>
                        {getPaymentStatusLabel(p.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'expenses' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Gastos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {property.expenses.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">Sin gastos registrados</p>
            ) : (
              <div className="space-y-2">
                {property.expenses.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-medium">{e.description || getExpenseCategoryLabel(e.category)}</p>
                      <p className="text-xs text-gray-400">{getExpenseCategoryLabel(e.category)} · {formatDate(e.date)}</p>
                    </div>
                    <p className="text-sm font-bold text-red-600">-{formatCurrency(e.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'incidents' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Incidencias</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {property.incidents.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">Sin incidencias registradas</p>
            ) : (
              <div className="space-y-3">
                {property.incidents.map((inc: any) => (
                  <div key={inc.id} className="p-3 rounded-lg border border-gray-100">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium">{inc.title}</p>
                      <div className="flex gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getIncidentStatusColor(inc.status)}`}>
                          {getIncidentStatusLabel(inc.status)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getIncidentPriorityColor(inc.priority)}`}>
                          {inc.priority}
                        </span>
                      </div>
                    </div>
                    {inc.description && <p className="text-xs text-gray-500 mt-1">{inc.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{formatDate(inc.openDate)}</span>
                      {inc.cost && <span className="text-red-500">Coste: {formatCurrency(inc.cost)}</span>}
                      {inc.tenant && <span>Inquilino: {inc.tenant.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'deposits' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Fianzas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {property.deposits.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">Sin fianzas registradas</p>
            ) : (
              <div className="space-y-3">
                {property.deposits.map((d: any) => (
                  <div key={d.id} className="p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{d.tenant?.name}</p>
                        <p className="text-xs text-gray-400">Entregada: {formatDate(d.deliveryDate)}</p>
                        {d.returnDate && <p className="text-xs text-gray-400">Devuelta: {formatDate(d.returnDate)}</p>}
                        {d.retentionReason && <p className="text-xs text-orange-600">{d.retentionReason}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(d.amount)}</p>
                        {d.retainedAmount && (
                          <p className="text-xs text-red-500">Retenido: {formatCurrency(d.retainedAmount)}</p>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          d.status === 'HELD' ? 'bg-blue-100 text-blue-800' :
                          d.status === 'RETURNED_FULL' ? 'bg-green-100 text-green-800' :
                          d.status === 'RETURNED_PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {d.status === 'HELD' ? 'Retenida' : d.status === 'RETURNED_FULL' ? 'Devuelta' :
                           d.status === 'RETURNED_PARTIAL' ? 'Dev. parcial' : 'Retenida'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <PropertyFormDialog
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSaved={(updated) => { setProperty((prev: any) => ({ ...prev, ...updated })); setShowEditForm(false) }}
        property={property}
      />
    </div>
  )
}
