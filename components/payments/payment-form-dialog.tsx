'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (payment: any) => void
  payment?: any | null
  properties: any[]
}

const now = new Date()

const defaultForm = {
  propertyId: '',
  month: (now.getMonth() + 1).toString(),
  year: now.getFullYear().toString(),
  expectedAmount: '',
  paidAmount: '',
  dueDate: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-05`,
  paidDate: '',
  status: 'PENDING',
  method: '',
  notes: '',
}

export function PaymentFormDialog({ open, onClose, onSaved, payment, properties }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<any>(null)

  useEffect(() => {
    if (payment) {
      setForm({
        propertyId: payment.property?.id || payment.propertyId || '',
        month: payment.month.toString(),
        year: payment.year.toString(),
        expectedAmount: payment.expectedAmount.toString(),
        paidAmount: payment.paidAmount.toString(),
        dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '',
        paidDate: payment.paidDate ? new Date(payment.paidDate).toISOString().split('T')[0] : '',
        status: payment.status,
        method: payment.method || '',
        notes: payment.notes || '',
      })
    } else {
      setForm(defaultForm)
    }
    setError('')
  }, [payment, open])

  useEffect(() => {
    const prop = properties.find(p => p.id === form.propertyId)
    setSelectedProperty(prop || null)
    if (prop && !payment) {
      setForm(f => ({ ...f, expectedAmount: prop.expectedRent?.toString() || '' }))
    }
  }, [form.propertyId, properties, payment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const method = payment?.id ? 'PUT' : 'POST'
      const url = payment?.id ? `/api/payments/${payment.id}` : '/api/payments'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        setLoading(false)
        return
      }

      onSaved(data)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const paidAmount = parseFloat(form.paidAmount) || 0
  const expectedAmount = parseFloat(form.expectedAmount) || 0
  const remaining = expectedAmount - paidAmount

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{payment?.id ? 'Editar pago' : 'Registrar pago'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!payment?.id && (
            <div className="space-y-2">
              <Label>Propiedad *</Label>
              <Select value={form.propertyId} onValueChange={v => setForm(f => ({ ...f, propertyId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una propiedad" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mes *</Label>
              <Select value={form.month} onValueChange={v => setForm(f => ({ ...f, month: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2024, m - 1).toLocaleDateString('es-ES', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Año *</Label>
              <Select value={form.year} onValueChange={v => setForm(f => ({ ...f, year: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedAmount">Importe esperado (€) *</Label>
              <Input
                id="expectedAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="1200"
                value={form.expectedAmount}
                onChange={e => setForm(f => ({ ...f, expectedAmount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Importe pagado (€)</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={form.paidAmount}
                onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))}
              />
            </div>
          </div>

          {expectedAmount > 0 && (
            <div className={`p-3 rounded-lg text-sm ${
              remaining <= 0 ? 'bg-green-50 text-green-700' :
              paidAmount > 0 ? 'bg-orange-50 text-orange-700' :
              'bg-red-50 text-red-700'
            }`}>
              {remaining <= 0 ? '✓ Pago completo' :
               paidAmount > 0 ? `⚠ Pendiente: ${remaining.toFixed(2)}€` :
               `✗ Sin pagar: ${expectedAmount.toFixed(2)}€`}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha vencimiento</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidDate">Fecha de pago</Label>
              <Input
                id="paidDate"
                type="date"
                value={form.paidDate}
                onChange={e => setForm(f => ({ ...f, paidDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Pagado</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="PARTIAL">Parcial</SelectItem>
                  <SelectItem value="UNPAID">Impagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="CHECK">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Notas sobre este pago..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {payment?.id ? 'Guardar cambios' : 'Registrar pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
