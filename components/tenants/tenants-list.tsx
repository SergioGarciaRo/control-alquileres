'use client'

import { useState } from 'react'
import { Users, Plus, Phone, Mail, Calendar, AlertTriangle, CheckCircle, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  formatCurrency, formatDate, getTenantStatusColor, getTenantStatusLabel
} from '@/lib/utils'
import { TenantFormDialog } from './tenant-form-dialog'

interface Tenant {
  id: string
  name: string
  phone: string | null
  email: string | null
  startDate: string
  endDate: string | null
  rent: number
  status: string
  notes: string | null
  property: { id: string; name: string; address: string }
  deposits: any[]
  tenantPayments: any[]
}

interface Props {
  initialTenants: Tenant[]
  properties: { id: string; name: string }[]
}

export function TenantsList({ initialTenants, properties }: Props) {
  const [tenants, setTenants] = useState(initialTenants)
  const [showForm, setShowForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = tenants
    .filter(t => filter === 'ALL' || t.status === filter)
    .filter(t =>
      search === '' ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.property.name.toLowerCase().includes(search.toLowerCase())
    )

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este inquilino?')) return
    const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' })
    if (res.ok) setTenants(prev => prev.filter(t => t.id !== id))
  }

  const handleSaved = (tenant: any) => {
    if (editingTenant) {
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, ...tenant } : t))
    } else {
      setTenants(prev => [{ ...tenant, deposits: [], tenantPayments: [] }, ...prev])
    }
    setShowForm(false)
    setEditingTenant(null)
  }

  const statusFilters = [
    { value: 'ALL', label: 'Todos', count: tenants.length },
    { value: 'ACTIVE', label: 'Activos', count: tenants.filter(t => t.status === 'ACTIVE').length },
    { value: 'DEFAULTER', label: 'Morosos', count: tenants.filter(t => t.status === 'DEFAULTER').length },
    { value: 'FINISHED', label: 'Finalizados', count: tenants.filter(t => t.status === 'FINISHED').length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inquilinos</h2>
          <p className="text-gray-500 text-sm">
            {tenants.filter(t => t.status === 'ACTIVE').length} activos · {tenants.filter(t => t.status === 'DEFAULTER').length} morosos
          </p>
        </div>
        <Button onClick={() => { setEditingTenant(null); setShowForm(true) }}>
          <Plus className="w-4 h-4" />
          Nuevo inquilino
        </Button>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o propiedad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-gray-600 font-medium">No hay inquilinos</h3>
          <p className="text-gray-400 text-sm mt-1">Añade tu primer inquilino</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Añadir inquilino
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tenant => {
            const pendingPayments = tenant.tenantPayments.length
            const depositAmount = tenant.deposits.reduce((s: number, d: any) => s + d.amount, 0)
            const isExpiringSoon = tenant.endDate && (() => {
              const end = new Date(tenant.endDate!)
              const now = new Date()
              const diffDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              return diffDays > 0 && diffDays <= 60
            })()

            return (
              <Card key={tenant.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTenantStatusColor(tenant.status)}`}>
                          {getTenantStatusLabel(tenant.status)}
                        </span>
                        {pendingPayments > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            {pendingPayments} pendiente(s)
                          </span>
                        )}
                        {isExpiringSoon && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            Contrato próximo a vencer
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Building2 className="w-3 h-3" />
                        <span>{tenant.property.name}</span>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {formatDate(tenant.startDate)}
                            {tenant.endDate ? ` → ${formatDate(tenant.endDate)}` : ' · Indefinido'}
                          </span>
                        </div>
                        {tenant.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{tenant.phone}</span>
                          </div>
                        )}
                        {tenant.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span>{tenant.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                      <p className="text-base font-bold text-gray-900">{formatCurrency(tenant.rent)}<span className="text-xs font-normal text-gray-400">/mes</span></p>
                      {depositAmount > 0 && (
                        <p className="text-xs text-gray-400">Fianza: {formatCurrency(depositAmount)}</p>
                      )}
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => { setEditingTenant(tenant); setShowForm(true) }}>
                          Editar
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600"
                          onClick={() => handleDelete(tenant.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {tenant.notes && (
                    <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500 italic">
                      {tenant.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <TenantFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTenant(null) }}
        onSaved={handleSaved}
        tenant={editingTenant}
        properties={properties}
      />
    </div>
  )
}
