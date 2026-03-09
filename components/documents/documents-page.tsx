'use client'

import { useState, useMemo } from 'react'
import { FileText, Plus, Loader2, Download, Eye, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'

const DOC_TYPES = [
  { value: 'CONTRACT', label: 'Contrato' },
  { value: 'PAYMENT_PROOF', label: 'Justificante de pago' },
  { value: 'INVOICE', label: 'Factura' },
  { value: 'INVENTORY', label: 'Inventario' },
  { value: 'PHOTO', label: 'Fotografía' },
  { value: 'OTHER', label: 'Otro documento' },
]

const docTypeColors: Record<string, string> = {
  CONTRACT: 'bg-blue-100 text-blue-700',
  PAYMENT_PROOF: 'bg-green-100 text-green-700',
  INVOICE: 'bg-orange-100 text-orange-700',
  INVENTORY: 'bg-purple-100 text-purple-700',
  PHOTO: 'bg-pink-100 text-pink-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

interface Document {
  id: string
  name: string
  type: string
  url: string
  mimeType: string | null
  createdAt: string
  property: { id: string; name: string } | null
  tenant: { id: string; name: string } | null
}

interface Props {
  initialDocuments: Document[]
  properties: any[]
}

const defaultForm = {
  propertyId: '',
  tenantId: '',
  name: '',
  type: 'CONTRACT',
  url: '',
  mimeType: '',
}

export function DocumentsPage({ initialDocuments, properties }: Props) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterProperty, setFilterProperty] = useState('ALL')
  const [search, setSearch] = useState('')

  const selectedProperty = properties.find(p => p.id === form.propertyId)

  const filtered = useMemo(() =>
    documents
      .filter(d => filterType === 'ALL' || d.type === filterType)
      .filter(d => filterProperty === 'ALL' || d.property?.id === filterProperty)
      .filter(d => search === '' || d.name.toLowerCase().includes(search.toLowerCase())),
    [documents, filterType, filterProperty, search]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar'); setLoading(false); return }

      const prop = properties.find(p => p.id === form.propertyId)
      const ten = prop?.tenants?.find((t: any) => t.id === form.tenantId)
      setDocuments(prev => [{
        ...data,
        property: prop ? { id: prop.id, name: prop.name } : null,
        tenant: ten ? { id: ten.id, name: ten.name } : null,
      }, ...prev])
      setShowForm(false)
      setForm(defaultForm)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (res.ok) setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const getDocTypeLabel = (type: string) => DOC_TYPES.find(t => t.value === type)?.label || type

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Documentos</h2>
          <p className="text-gray-500 text-sm">{documents.length} documentos almacenados</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setError(''); setShowForm(true) }}>
          <Plus className="w-4 h-4" />
          Añadir documento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white">
          <option value="ALL">Todos los tipos</option>
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white">
          <option value="ALL">Todas las propiedades</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Documents grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-gray-600 font-medium">No hay documentos</h3>
          <p className="text-gray-400 text-sm mt-1">Sube contratos, facturas e inventarios</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Añadir documento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-all group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(doc.url, '_blank')}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400"
                      onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate mb-1" title={doc.name}>{doc.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${docTypeColors[doc.type] || 'bg-gray-100 text-gray-700'}`}>
                  {getDocTypeLabel(doc.type)}
                </span>
                <div className="mt-3 text-xs text-gray-400 space-y-0.5">
                  {doc.property && <p>📍 {doc.property.name}</p>}
                  {doc.tenant && <p>👤 {doc.tenant.name}</p>}
                  <p>📅 {formatDate(doc.createdAt)}</p>
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
            <DialogTitle>Añadir documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="docName">Nombre del documento *</Label>
              <Input id="docName" placeholder="Ej: Contrato Marta - Sep 2024" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Propiedad</Label>
              <Select value={form.propertyId} onValueChange={v => setForm(f => ({ ...f, propertyId: v, tenantId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedProperty?.tenants?.length > 0 && (
              <div className="space-y-2">
                <Label>Inquilino</Label>
                <Select value={form.tenantId} onValueChange={v => setForm(f => ({ ...f, tenantId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {selectedProperty.tenants.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="docUrl">URL o ruta del documento *</Label>
              <Input id="docUrl" placeholder="/documentos/contrato.pdf o https://..." value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required />
              <p className="text-xs text-gray-400">En el MVP, introduce la ruta o URL del archivo</p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar documento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
