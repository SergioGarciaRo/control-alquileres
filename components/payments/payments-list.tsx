'use client'

import { useState, useMemo } from 'react'
import { CreditCard, Plus, CheckCircle, XCircle, Clock, AlertTriangle, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  formatCurrency, formatDate, formatMonth, getPaymentStatusColor, getPaymentStatusLabel
} from '@/lib/utils'
import { PaymentFormDialog } from './payment-form-dialog'
import { ReceiptButton } from './receipt-button'
import { PAYMENT_METHOD } from '@/lib/status-config'

interface Payment {
  id: string
  month: number
  year: number
  expectedAmount: number
  paidAmount: number
  dueDate: string
  paidDate: string | null
  status: string
  method: string | null
  notes: string | null
  receiptUrl: string | null
  receiptName: string | null
  property: { id: string; name: string }
  tenantPayments: any[]
}

interface Props {
  initialPayments: Payment[]
  properties: any[]
}

export function PaymentsList({ initialPayments, properties }: Props) {
  const [payments, setPayments] = useState(initialPayments)
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterProperty, setFilterProperty] = useState('ALL')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 12

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const filtered = useMemo(() => {
    return payments
      .filter((p) => filterStatus === 'ALL' || p.status === filterStatus)
      .filter((p) => filterProperty === 'ALL' || p.property.id === filterProperty)
      .filter((p) => {
        if (!filterMonth) return true
        const [y, m] = filterMonth.split('-')
        return p.year === parseInt(y) && p.month === parseInt(m)
      })
  }, [payments, filterStatus, filterMonth, filterProperty])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const stats = useMemo(() => {
    const currentMonthPayments = payments.filter(p => p.month === currentMonth && p.year === currentYear)
    return {
      totalExpected: currentMonthPayments.reduce((s, p) => s + p.expectedAmount, 0),
      totalPaid: currentMonthPayments.reduce((s, p) => s + p.paidAmount, 0),
      paid: currentMonthPayments.filter(p => p.status === 'PAID').length,
      pending: currentMonthPayments.filter(p => p.status === 'PENDING').length,
      unpaid: currentMonthPayments.filter(p => p.status === 'UNPAID').length,
      partial: currentMonthPayments.filter(p => p.status === 'PARTIAL').length,
    }
  }, [payments, currentMonth, currentYear])

  const handleSaved = (payment: any) => {
    if (editingPayment) {
      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, ...payment } : p))
    } else {
      setPayments(prev => [{ ...payment, tenantPayments: [], receiptUrl: null, receiptName: null }, ...prev])
    }
    setShowForm(false)
    setEditingPayment(null)
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    const res = await fetch(`/api/payments/${confirmDeleteId}`, { method: 'DELETE' })
    if (res.ok) setPayments(prev => prev.filter(p => p.id !== confirmDeleteId))
    setConfirmDeleteId(null)
  }

  const statusFilters = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PAID', label: 'Pagados' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'PARTIAL', label: 'Parciales' },
    { value: 'UNPAID', label: 'Impagados' },
  ]

  const statusIcon = (status: string) => {
    if (status === 'PAID') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (status === 'UNPAID') return <XCircle className="w-4 h-4 text-red-500" />
    if (status === 'PARTIAL') return <AlertTriangle className="w-4 h-4 text-orange-500" />
    return <Clock className="w-4 h-4 text-yellow-500" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Control de Pagos</h2>
          <p className="text-gray-500 text-sm">{payments.length} registros totales</p>
        </div>
        <Button onClick={() => { setEditingPayment(null); setShowForm(true) }}>
          <Plus className="w-4 h-4" />
          Registrar pago
        </Button>
      </div>

      {/* Monthly stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Esperado este mes</p>
            <p className="text-base font-bold text-gray-900">{formatCurrency(stats.totalExpected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Cobrado este mes</p>
            <p className="text-base font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Pendiente/Impagado</p>
            <p className="text-base font-bold text-red-600">{formatCurrency(stats.totalExpected - stats.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Tasa de cobro</p>
            <p className={`text-base font-bold ${stats.totalExpected > 0 && stats.totalPaid / stats.totalExpected >= 0.8 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalExpected > 0 ? Math.round((stats.totalPaid / stats.totalExpected) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterStatus === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterProperty}
            onChange={e => setFilterProperty(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todas las propiedades</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Payments list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-gray-600 font-medium">No hay pagos registrados</h3>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Registrar primer pago
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-180 text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mes</th>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Propiedad</th>
                <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Esperado</th>
                <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pagado</th>
                <th className="hidden md:table-cell text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha pago</th>
                <th className="hidden md:table-cell text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Método</th>
                <th className="hidden sm:table-cell text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap" title="Justificante adjunto">
                  Just.
                </th>
                <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(payment.status)}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusColor(payment.status)}`}>
                        {getPaymentStatusLabel(payment.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-medium capitalize">
                    {formatMonth(payment.month, payment.year)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-gray-600">{payment.property.name}</td>
                  <td className="px-3 sm:px-4 py-3 text-right font-medium">{formatCurrency(payment.expectedAmount)}</td>
                  <td className="px-3 sm:px-4 py-3 text-right">
                    <span className={payment.paidAmount >= payment.expectedAmount ? 'text-green-600 font-bold' :
                      payment.paidAmount > 0 ? 'text-orange-600 font-bold' : 'text-gray-400'}>
                      {formatCurrency(payment.paidAmount)}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-3 text-gray-500 text-xs">
                    {payment.paidDate ? formatDate(payment.paidDate) : '—'}
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-3 text-gray-500 text-xs">
                    {payment.method ? (PAYMENT_METHOD[payment.method] ?? payment.method) : '—'}
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-center">
                    <ReceiptButton
                      paymentId={payment.id}
                      receiptUrl={payment.receiptUrl}
                      receiptName={payment.receiptName}
                      onUpdated={(url, name) =>
                        setPayments(prev => prev.map(p =>
                          p.id === payment.id ? { ...p, receiptUrl: url, receiptName: name } : p
                        ))
                      }
                    />
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs"
                        onClick={() => { setEditingPayment(payment); setShowForm(true) }}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400"
                        onClick={() => setConfirmDeleteId(payment.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-3 text-xs text-gray-500 mt-2">
          <p>
            Mostrando {((safePage - 1) * pageSize) + 1}-
            {Math.min(safePage * pageSize, filtered.length)} de {filtered.length} pagos
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 disabled:cursor-default"
            >
              Anterior
            </button>
            <span>
              Página {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 disabled:cursor-default"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <PaymentFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingPayment(null) }}
        onSaved={handleSaved}
        payment={editingPayment}
        properties={properties}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Eliminar pago"
        description="Esta acción eliminará el pago permanentemente. Los datos de inquilinos asociados también se borrarán."
        confirmLabel="Eliminar pago"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
