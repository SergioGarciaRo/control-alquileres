'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle, Plus, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  formatCurrency, formatDate,
  getIncidentStatusColor, getIncidentStatusLabel,
  getIncidentPriorityColor, getIncidentPriorityLabel
} from '@/lib/utils'

const CATEGORIES = [
  { value: 'BREAKDOWN', label: 'Avería' },
  { value: 'REPAIR', label: 'Reparación' },
  { value: 'CLEANING', label: 'Limpieza' },
  { value: 'SUPPLY', label: 'Suministros' },
  { value: 'NOISE', label: 'Ruidos' },
  { value: 'OTHER', label: 'Otros' },
]

const categoryLabels: Record<string, string> = {
  BREAKDOWN: 'Avería',
  REPAIR: 'Reparación',
  CLEANING: 'Limpieza',
  SUPPLY: 'Suministros',
  NOISE: 'Ruidos',
  OTHER: 'Otros',
}

interface Incident {
  id: string
  title: string
  description: string | null
  category: string
  priority: string
  status: string
  cost: number | null
  openDate: string
  resolvedDate: string | null
  property: { id: string; name: string }
  tenant: { id: string; name: string } | null
}

interface Props {
  initialIncidents: Incident[]
  properties: any[]
}

const defaultForm = {
  propertyId: '',
  tenantId: '',
  title: '',
  description: '',
  category: 'REPAIR',
  priority: 'MEDIUM',
  status: 'OPEN',
  cost: '',
  openDate: new Date().toISOString().split('T')[0],
}

export function IncidentsPage({ initialIncidents, properties }: Props) {
  const [incidents, setIncidents] = useState(initialIncidents)
  const [showForm, setShowForm] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')

  const filtered = useMemo(() =>
    incidents
      .filter(i => filterStatus === 'ALL' || i.status === filterStatus)
      .filter(i => filterPriority === 'ALL' || i.priority === filterPriority),
    [incidents, filterStatus, filterPriority]
  )

  const stats = {
    open: incidents.filter(i => i.status === 'OPEN').length,
    inProgress: incidents.filter(i => i.status === 'IN_PROGRESS').length,
    high: incidents.filter(i => i.priority === 'HIGH' && i.status !== 'CLOSED' && i.status !== 'RESOLVED').length,
    totalCost: incidents.reduce((s, i) => s + (i.cost || 0), 0),
  }

  const selectedProperty = properties.find(p => p.id === form.propertyId)

  const openForm = (incident?: Incident) => {
    if (incident) {
      setEditingIncident(incident)
      setForm({
        propertyId: incident.property.id,
        tenantId: incident.tenant?.id || '',
        title: incident.title,
        description: incident.description || '',
        category: incident.category,
        priority: incident.priority,
        status: incident.status,
        cost: incident.cost?.toString() || '',
        openDate: new Date(incident.openDate).toISOString().split('T')[0],
      })
    } else {
      setEditingIncident(null)
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
      const method = editingIncident ? 'PUT' : 'POST'
      const url = editingIncident ? `/api/incidents/${editingIncident.id}` : '/api/incidents'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar'); setLoading(false); return }

      if (editingIncident) {
        setIncidents(prev => prev.map(i => i.id === data.id ? { ...i, ...data, property: i.property, tenant: i.tenant } : i))
      } else {
        const prop = properties.find(p => p.id === form.propertyId)
        const ten = prop?.tenants.find((t: any) => t.id === form.tenantId)
        setIncidents(prev => [{ ...data, property: { id: prop!.id, name: prop!.name }, tenant: ten ? { id: ten.id, name: ten.name } : null }, ...prev])
      }
      setShowForm(false)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta incidencia?')) return
    const res = await fetch(`/api/incidents/${id}`, { method: 'DELETE' })
    if (res.ok) setIncidents(prev => prev.filter(i => i.id !== id))
  }

  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Incidencias y Reparaciones</h2>
          <p className="text-gray-500 text-sm">{incidents.length} incidencias registradas</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="w-4 h-4" />
          Nueva incidencia
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Abiertas</p>
          <p className="text-lg font-bold text-red-600">{stats.open}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">En proceso</p>
          <p className="text-lg font-bold text-yellow-600">{stats.inProgress}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Alta prioridad</p>
          <p className="text-lg font-bold text-red-700">{stats.high}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Coste total</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalCost)}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { v: 'ALL', l: 'Todas' }, { v: 'OPEN', l: 'Abiertas' },
            { v: 'IN_PROGRESS', l: 'En proceso' }, { v: 'RESOLVED', l: 'Resueltas' }, { v: 'CLOSED', l: 'Cerradas' }
          ].map(f => (
            <button key={f.v} onClick={() => setFilterStatus(f.v)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterStatus === f.v ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}>{f.l}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {[{ v: 'ALL', l: 'Todas' }, { v: 'HIGH', l: '🔴 Alta' }, { v: 'MEDIUM', l: '🟡 Media' }, { v: 'LOW', l: '🟢 Baja' }].map(f => (
            <button key={f.v} onClick={() => setFilterPriority(f.v)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterPriority === f.v ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}>{f.l}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-3" />
          <h3 className="text-gray-600 font-medium">Sin incidencias activas</h3>
          <p className="text-gray-400 text-sm">Todo en orden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => {
              const pa = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1
              const pb = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1
              return pa - pb
            })
            .map(incident => (
              <Card key={incident.id} className={`hover:shadow-md transition-all border-l-4 ${
                incident.priority === 'HIGH' ? 'border-l-red-500' :
                incident.priority === 'MEDIUM' ? 'border-l-yellow-500' :
                'border-l-blue-300'
              }`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getIncidentStatusColor(incident.status)}`}>
                          {getIncidentStatusLabel(incident.status)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getIncidentPriorityColor(incident.priority)}`}>
                          {getIncidentPriorityLabel(incident.priority)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {categoryLabels[incident.category]}
                        </span>
                      </div>
                      {incident.description && <p className="text-sm text-gray-500 mb-2">{incident.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span>📍 {incident.property.name}</span>
                        {incident.tenant && <span>👤 {incident.tenant.name}</span>}
                        <span>📅 Abierta: {formatDate(incident.openDate)}</span>
                        {incident.resolvedDate && <span>✓ Resuelta: {formatDate(incident.resolvedDate)}</span>}
                        {incident.cost && <span className="text-red-500 font-medium">💰 {formatCurrency(incident.cost)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openForm(incident)}>Editar</Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600"
                        onClick={() => handleDelete(incident.id)}>Eliminar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIncident ? 'Editar incidencia' : 'Nueva incidencia'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" placeholder="Describe brevemente la incidencia" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            {!editingIncident && (
              <div className="space-y-2">
                <Label>Propiedad *</Label>
                <Select value={form.propertyId} onValueChange={v => setForm(f => ({ ...f, propertyId: v, tenantId: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona propiedad" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedProperty?.tenants?.length > 0 && !editingIncident && (
              <div className="space-y-2">
                <Label>Inquilino (opcional)</Label>
                <Select value={form.tenantId} onValueChange={v => setForm(f => ({ ...f, tenantId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {selectedProperty.tenants.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Abierta</SelectItem>
                    <SelectItem value="IN_PROGRESS">En proceso</SelectItem>
                    <SelectItem value="RESOLVED">Resuelta</SelectItem>
                    <SelectItem value="CLOSED">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openDate">Fecha apertura</Label>
                <Input id="openDate" type="date" value={form.openDate}
                  onChange={e => setForm(f => ({ ...f, openDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Coste (€)</Label>
                <Input id="cost" type="number" step="0.01" min="0" placeholder="0"
                  value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" placeholder="Describe la incidencia con detalle..." rows={3}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingIncident ? 'Guardar' : 'Crear incidencia'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
