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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Property {
  id?: string
  name: string
  address: string
  type: string
  rooms?: number | null
  status: string
  expectedRent: number
  fixedExpenses: number
  notes?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (property: any) => void
  property?: Property | null
}

const defaultForm = {
  name: '',
  address: '',
  type: 'APARTMENT',
  rooms: '',
  status: 'AVAILABLE',
  expectedRent: '',
  fixedExpenses: '',
  notes: '',
}

export function PropertyFormDialog({ open, onClose, onSaved, property }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (property) {
      setForm({
        name: property.name,
        address: property.address,
        type: property.type,
        rooms: property.rooms?.toString() || '',
        status: property.status,
        expectedRent: property.expectedRent.toString(),
        fixedExpenses: property.fixedExpenses.toString(),
        notes: property.notes || '',
      })
    } else {
      setForm(defaultForm)
    }
    setError('')
  }, [property, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const method = property?.id ? 'PUT' : 'POST'
      const url = property?.id ? `/api/properties/${property.id}` : '/api/properties'

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property?.id ? 'Editar propiedad' : 'Nueva propiedad'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre / alias *</Label>
              <Input
                id="name"
                placeholder="Ej: Piso Malasaña"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APARTMENT">Piso completo</SelectItem>
                  <SelectItem value="ROOM">Habitación</SelectItem>
                  <SelectItem value="LOCAL">Local comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección *</Label>
            <Input
              id="address"
              placeholder="Calle, número, piso, ciudad"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Disponible</SelectItem>
                  <SelectItem value="OCCUPIED">Ocupado</SelectItem>
                  <SelectItem value="RESERVED">Reservado</SelectItem>
                  <SelectItem value="INCIDENT">En incidencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rooms">Nº habitaciones</Label>
              <Input
                id="rooms"
                type="number"
                min="1"
                placeholder="3"
                value={form.rooms}
                onChange={e => setForm(f => ({ ...f, rooms: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedRent">Renta mensual (€)</Label>
              <Input
                id="expectedRent"
                type="number"
                step="0.01"
                min="0"
                placeholder="1200"
                value={form.expectedRent}
                onChange={e => setForm(f => ({ ...f, expectedRent: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fixedExpenses">Gastos fijos estimados (€/mes)</Label>
            <Input
              id="fixedExpenses"
              type="number"
              step="0.01"
              min="0"
              placeholder="150"
              value={form.fixedExpenses}
              onChange={e => setForm(f => ({ ...f, fixedExpenses: e.target.value }))}
            />
            <p className="text-xs text-gray-400">Comunidad, seguros, IBI prorrateado, etc.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Información adicional sobre la propiedad..."
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
              {property?.id ? 'Guardar cambios' : 'Crear propiedad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
