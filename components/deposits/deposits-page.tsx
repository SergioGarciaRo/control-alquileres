'use client'

import { useState, useMemo } from 'react'
import { Shield, Plus, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate, getDepositStatusColor, getDepositStatusLabel } from '@/lib/utils'

interface Deposit {
  id: string
  amount: number
  deliveryDate: string
  status: string
  returnDate: string | null
  retainedAmount: number | null
  retentionReason: string | null
  property: { id: string; name: string }
  tenant: { id: string; name: string }
}

interface Props {
  initialDeposits: Deposit[]
  properties: any[]
}

const defaultForm = {
  propertyId: '',
  tenantId: '',
  amount: '',
  deliveryDate: new Date().toISOString().split('T')[0],
  status: 'HELD',
  returnDate: '',
  retainedAmount: '',
  retentionReason: '',
}

export function DepositsPage({ initialDeposits, properties }: Props) {
  const [deposits, setDeposits] = useState(initialDeposits)
  const [showForm, setShowForm] = useState(false)
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedProperty = properties.find(p => p.id === form.propertyId)
  const totalHeld = deposits.filter(d => d.status === 'HELD').reduce((s, d) => s + d.amount, 0)
  const totalReturned = deposits.filter(d => d.status === 'RETURNED_FULL').reduce((s, d) => s + d.amount, 0)
  const totalRetained = deposits.filter(d => d.status === 'RETAINED' || d.status === 'RETURNED_PARTIAL')
    .reduce((s, d) => s + (d.retainedAmount || 0), 0)

  const openForm = (deposit?: Deposit) => {
    if (deposit) {
      setEditingDeposit(deposit)
      setForm({
        propertyId: deposit.property.id,
        tenantId: deposit.tenant.id,
        amount: deposit.amount.toString(),
        deliveryDate: new Date(deposit.deliveryDate).toISOString().split('T')[0],
        status: deposit.status,
        returnDate: deposit.returnDate ? new Date(deposit.returnDate).toISOString().split('T')[0] : '',
        retainedAmount: deposit.retainedAmount?.toString() || '',
        retentionReason: deposit.retentionReason || '',
      })
    } else {
      setEditingDeposit(null)
      setForm(defaultForm)
    }
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const method = editingDeposit ? 'PUT' : 'POST'
      const url = editingDeposit ? `/api/deposits/${editingDeposit.id}` : '/api/deposits'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar'); setLoading(false); return }

      if (editingDeposit) {
        setDeposits(prev => prev.map(d => d.id === data.id ? { ...d, ...data, property: d.property, tenant: d.tenant } : d))
      } else {
        const prop = properties.find(p => p.id === form.propertyId)
        const ten = prop?.tenants.find((t: any) => t.id === form.tenantId)
        setDeposits(prev => [{ ...data, property: { id: prop!.id, name: prop!.name }, tenant: { id: ten!.id, name: ten!.name } }, ...prev])
      }
      setShowForm(false)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta fianza?')) return
    const res = await fetch(`/api/deposits/${id}`, { method: 'DELETE' })
    if (res.ok) setDeposits(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fianzas</h2>
          <p className="text-gray-500 text-sm">{deposits.length} fianza(s) registrada(s)</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="w-4 h-4" />
          Nueva fianza
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">En poder del propietario</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(totalHeld)}</p>
            <p className="text-xs text-gray-400">{deposits.filter(d => d.status === 'HELD').length} fianzas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Devueltas íntegras</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalReturned)}</p>
            <p className="text-xs text-gray-400">{deposits.filter(d => d.status === 'RETURNED_FULL').length} fianzas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Importes retenidos</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalRetained)}</p>
            <p className="text-xs text-gray-400">{deposits.filter(d => d.status === 'RETAINED' || d.status === 'RETURNED_PARTIAL').length} fianzas</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {deposits.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-gray-600 font-medium">No hay fianzas registradas</h3>
          <Button className="mt-4" onClick={() => openForm()}>
            <Plus className="w-4 h-4" />
            Registrar primera fianza
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {deposits.map(deposit => (
            <Card key={deposit.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{deposit.tenant.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getDepositStatusColor(deposit.status)}`}>
                        {getDepositStatusLabel(deposit.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{deposit.property.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Entregada: {formatDate(deposit.deliveryDate)}
                      {deposit.returnDate && ` · Devuelta: ${formatDate(deposit.returnDate)}`}
                    </p>
                    {deposit.retentionReason && (
                      <p className="text-xs text-orange-600 mt-1 italic">{deposit.retentionReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(deposit.amount)}</p>
                      {deposit.retainedAmount && (
                        <p className="text-xs text-red-500">Retenido: {formatCurrency(deposit.retainedAmount)}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openForm(deposit)}>Editar</Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600"
                        onClick={() => handleDelete(deposit.id)}>Eliminar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDeposit ? 'Editar fianza' : 'Nueva fianza'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingDeposit && (
              <>
                <div className="space-y-2">
                  <Label>Propiedad *</Label>
                  <Select value={form.propertyId} onValueChange={v => setForm(f => ({ ...f, propertyId: v, tenantId: '' }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona propiedad" /></SelectTrigger>
                    <SelectContent>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {selectedProperty?.tenants?.length > 0 && (
                  <div className="space-y-2">
                    <Label>Inquilino *</Label>
                    <Select value={form.tenantId} onValueChange={v => setForm(f => ({ ...f, tenantId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecciona inquilino" /></SelectTrigger>
                      <SelectContent>
                        {selectedProperty.tenants.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Importe (€) *</Label>
                <Input id="amount" type="number" step="0.01" min="0" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Fecha entrega *</Label>
                <Input id="deliveryDate" type="date" value={form.deliveryDate}
                  onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HELD">En poder del propietario</SelectItem>
                  <SelectItem value="RETURNED_FULL">Devuelta íntegra</SelectItem>
                  <SelectItem value="RETURNED_PARTIAL">Devuelta parcial</SelectItem>
                  <SelectItem value="RETAINED">Retenida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(form.status === 'RETURNED_FULL' || form.status === 'RETURNED_PARTIAL' || form.status === 'RETAINED') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Fecha devolución</Label>
                  <Input id="returnDate" type="date" value={form.returnDate}
                    onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retainedAmount">Importe retenido (€)</Label>
                  <Input id="retainedAmount" type="number" step="0.01" min="0" value={form.retainedAmount}
                    onChange={e => setForm(f => ({ ...f, retainedAmount: e.target.value }))} />
                </div>
              </div>
            )}
            {(form.status === 'RETAINED' || form.status === 'RETURNED_PARTIAL') && (
              <div className="space-y-2">
                <Label htmlFor="retentionReason">Motivo de retención</Label>
                <Textarea id="retentionReason" placeholder="Describe el motivo de retención..." rows={2}
                  value={form.retentionReason} onChange={e => setForm(f => ({ ...f, retentionReason: e.target.value }))} />
              </div>
            )}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingDeposit ? 'Guardar' : 'Registrar fianza'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
