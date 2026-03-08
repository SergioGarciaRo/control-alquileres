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

interface Tenant {
  id?: string
  name: string
  phone?: string | null
  email?: string | null
  startDate: string
  endDate?: string | null
  rent: number
  status: string
  notes?: string | null
  propertyId?: string
  property?: { id: string }
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (tenant: any) => void
  tenant?: Tenant | null
  properties: { id: string; name: string }[]
}

const defaultForm = {
  name: '',
  phone: '',
  email: '',
  propertyId: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  rent: '',
  status: 'ACTIVE',
  notes: '',
}

export function TenantFormDialog({ open, onClose, onSaved, tenant, properties }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name,
        phone: tenant.phone || '',
        email: tenant.email || '',
        propertyId: tenant.property?.id || tenant.propertyId || '',
        startDate: tenant.startDate ? new Date(tenant.startDate).toISOString().split('T')[0] : '',
        endDate: tenant.endDate ? new Date(tenant.endDate).toISOString().split('T')[0] : '',
        rent: tenant.rent.toString(),
        status: tenant.status,
        notes: tenant.notes || '',
      })
    } else {
      setForm(defaultForm)
    }
    setError('')
  }, [tenant, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const method = tenant?.id ? 'PUT' : 'POST'
      const url = tenant?.id ? `/api/tenants/${tenant.id}` : '/api/tenants'

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenant?.id ? 'Editar inquilino' : 'Nuevo inquilino'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre o alias *</Label>
            <Input
              id="name"
              placeholder="Ej: María García o 'Hab. 1'"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-400">Puedes usar un alias en lugar del nombre real</p>
          </div>

          {!tenant?.id && (
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
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                placeholder="612345678"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Inicio contrato *</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fin contrato</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent">Renta (€/mes) *</Label>
              <Input
                id="rent"
                type="number"
                step="0.01"
                min="0"
                placeholder="800"
                value={form.rent}
                onChange={e => setForm(f => ({ ...f, rent: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="DEFAULTER">Moroso</SelectItem>
                <SelectItem value="FINISHED">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones sobre el inquilino..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
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
              {tenant?.id ? 'Guardar cambios' : 'Crear inquilino'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
