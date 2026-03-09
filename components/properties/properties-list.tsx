'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Plus, MapPin, Users, AlertTriangle, CheckCircle,
  Home, Store, BedDouble, MoreVertical, Edit2, Trash2, Eye
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getPropertyStatusColor, getPropertyStatusLabel, getPropertyTypeLabel } from '@/lib/utils'
import Link from 'next/link'
import { PropertyFormDialog } from './property-form-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Property {
  id: string
  name: string
  address: string
  type: string
  rooms: number | null
  status: string
  expectedRent: number
  fixedExpenses: number
  notes: string | null
  tenants: any[]
  payments: any[]
  incidents: any[]
  _count: { tenants: number }
}

interface Props {
  initialProperties: Property[]
}

export function PropertiesList({ initialProperties }: Props) {
  const [properties, setProperties] = useState(initialProperties)
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [filter, setFilter] = useState<string>('ALL')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const router = useRouter()

  const filtered = filter === 'ALL' ? properties : properties.filter(p => p.status === filter)

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    const res = await fetch(`/api/properties/${confirmDeleteId}`, { method: 'DELETE' })
    if (res.ok) setProperties(prev => prev.filter(p => p.id !== confirmDeleteId))
    setConfirmDeleteId(null)
  }

  const handleSaved = (property: Property) => {
    if (editingProperty) {
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, ...property } : p))
    } else {
      setProperties(prev => [{ ...property, tenants: [], payments: [], incidents: [], _count: { tenants: 0 } }, ...prev])
    }
    setShowForm(false)
    setEditingProperty(null)
  }

  const typeIcon = (type: string) => {
    if (type === 'ROOM') return <BedDouble className="w-4 h-4" />
    if (type === 'LOCAL') return <Store className="w-4 h-4" />
    return <Home className="w-4 h-4" />
  }

  const statusFilters = [
    { value: 'ALL', label: 'Todas', count: properties.length },
    { value: 'OCCUPIED', label: 'Ocupadas', count: properties.filter(p => p.status === 'OCCUPIED').length },
    { value: 'AVAILABLE', label: 'Disponibles', count: properties.filter(p => p.status === 'AVAILABLE').length },
    { value: 'INCIDENT', label: 'Incidencia', count: properties.filter(p => p.status === 'INCIDENT').length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Propiedades</h2>
          <p className="text-gray-500 text-sm">{properties.length} propiedad(es) registrada(s)</p>
        </div>
        <Button onClick={() => { setEditingProperty(null); setShowForm(true) }}>
          <Plus className="w-4 h-4" />
          Nueva propiedad
        </Button>
      </div>

      {/* Filters */}
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
            {f.label} <span className="opacity-70">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-gray-600 font-medium">No hay propiedades</h3>
          <p className="text-gray-400 text-sm mt-1">Añade tu primera propiedad para empezar</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Añadir propiedad
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(prop => {
            const monthlyIncome = prop.payments.reduce((s: number, p: any) => s + p.paidAmount, 0)
            const unpaidCount = prop.payments.filter((p: any) => p.status === 'UNPAID' || p.status === 'PARTIAL').length
            const activeTenants = prop.tenants.length
            const openIncidents = prop.incidents.length

            return (
              <Card key={prop.id} className="hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  {/* Status + actions */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getPropertyStatusColor(prop.status)}`}>
                        {typeIcon(prop.type)}
                        {getPropertyStatusLabel(prop.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/propiedades/${prop.id}`}>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => { setEditingProperty(prop); setShowForm(true) }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600"
                        onClick={() => setConfirmDeleteId(prop.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Name */}
                  <Link href={`/propiedades/${prop.id}`}>
                    <h3 className="font-bold text-gray-900 text-base hover:text-blue-600 transition-colors cursor-pointer">{prop.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-1 mb-4">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{prop.address}</span>
                  </div>

                  {/* Type + rooms */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs text-gray-500">{getPropertyTypeLabel(prop.type)}</span>
                    {prop.rooms && (
                      <span className="text-xs text-gray-500">{prop.rooms} hab.</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-400 mb-0.5">Renta</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(prop.expectedRent)}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-400 mb-0.5">Cobrado</p>
                      <p className={`text-sm font-bold ${monthlyIncome > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {formatCurrency(monthlyIncome)}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-400 mb-0.5">Gastos fijos</p>
                      <p className="text-sm font-bold text-orange-600">{formatCurrency(prop.fixedExpenses)}</p>
                    </div>
                  </div>

                  {/* Indicators */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{activeTenants} inq.</span>
                    </div>
                    {unpaidCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{unpaidCount} impago(s)</span>
                      </div>
                    )}
                    {openIncidents > 0 && (
                      <div className="flex items-center gap-1 text-xs text-orange-500">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{openIncidents} incid.</span>
                      </div>
                    )}
                    {unpaidCount === 0 && activeTenants > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-500">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Al día</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <PropertyFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingProperty(null) }}
        onSaved={handleSaved}
        property={editingProperty}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Eliminar propiedad"
        description="Se eliminarán permanentemente todos los datos asociados: inquilinos, pagos, gastos, fianzas, incidencias y documentos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar propiedad"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
