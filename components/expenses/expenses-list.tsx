'use client'

import { useRef, useState, useMemo } from 'react'
import { Receipt, Plus, Loader2, Paperclip, CheckCircle, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate, getExpenseCategoryLabel } from '@/lib/utils'

const CATEGORIES = [
  { value: 'COMMUNITY', label: 'Comunidad' },
  { value: 'ELECTRICITY', label: 'Luz' },
  { value: 'WATER', label: 'Agua' },
  { value: 'GAS', label: 'Gas' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'INSURANCE', label: 'Seguro' },
  { value: 'IBI', label: 'IBI' },
  { value: 'REPAIR', label: 'Reparación' },
  { value: 'CLEANING', label: 'Limpieza' },
  { value: 'OTHER', label: 'Otros' },
]

const categoryColors: Record<string, string> = {
  COMMUNITY:   'bg-blue-100 text-blue-700',
  ELECTRICITY: 'bg-yellow-100 text-yellow-700',
  WATER:       'bg-cyan-100 text-cyan-700',
  GAS:         'bg-orange-100 text-orange-700',
  INTERNET:    'bg-purple-100 text-purple-700',
  INSURANCE:   'bg-green-100 text-green-700',
  IBI:         'bg-red-100 text-red-700',
  REPAIR:      'bg-gray-100 text-gray-700',
  CLEANING:    'bg-teal-100 text-teal-700',
  OTHER:       'bg-slate-100 text-slate-700',
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024

interface Expense {
  id: string
  date: string
  amount: number
  category: string
  description: string | null
  receiptUrl: string | null
  property: { id: string; name: string }
}

interface Props {
  initialExpenses: Expense[]
  properties: { id: string; name: string }[]
}

const defaultForm = {
  propertyId: '',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  category: 'COMMUNITY',
  description: '',
}

export function ExpensesList({ initialExpenses, properties }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterProperty, setFilterProperty] = useState('ALL')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const filtered = useMemo(() =>
    expenses
      .filter(e => filterCategory === 'ALL' || e.category === filterCategory)
      .filter(e => filterProperty === 'ALL' || e.property.id === filterProperty),
    [expenses, filterCategory, filterProperty]
  )

  const totalByCategory = useMemo(() => {
    const acc: Record<string, number> = {}
    expenses
      .filter(e => {
        const d = new Date(e.date)
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
      })
      .forEach(e => { acc[e.category] = (acc[e.category] || 0) + e.amount })
    return acc
  }, [expenses, currentMonth, currentYear])

  const totalThisMonth = Object.values(totalByCategory).reduce((s, v) => s + v, 0)

  const openForm = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense)
      setForm({
        propertyId: expense.property.id,
        date: new Date(expense.date).toISOString().split('T')[0],
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description || '',
      })
    } else {
      setEditingExpense(null)
      setForm(defaultForm)
    }
    setPendingFile(null)
    setError('')
    setShowForm(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) { setError('Tipo no permitido. Usa PDF, JPG o PNG.'); return }
    if (file.size > MAX_SIZE) { setError('El archivo no puede superar 5 MB'); return }
    setError('')
    setPendingFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // If a file is selected, upload it first to get the URL
      let receiptUrl: string | null = editingExpense?.receiptUrl ?? null
      if (pendingFile) {
        const fd = new FormData()
        fd.append('file', pendingFile)
        fd.append('context', 'expense')
        const upRes = await fetch('/api/receipts/upload-generic', { method: 'POST', body: fd })
        if (!upRes.ok) { setError('Error al subir la factura'); setLoading(false); return }
        const upData = await upRes.json()
        receiptUrl = upData.url
      }

      const method = editingExpense ? 'PUT' : 'POST'
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, receiptUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar'); setLoading(false); return }

      if (editingExpense) {
        setExpenses(prev => prev.map(ex =>
          ex.id === data.id ? { ...ex, ...data, property: ex.property } : ex
        ))
      } else {
        const prop = properties.find(p => p.id === form.propertyId)
        setExpenses(prev => [{ ...data, property: { id: prop!.id, name: prop!.name } }, ...prev])
      }
      setShowForm(false)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    const res = await fetch(`/api/expenses/${confirmDeleteId}`, { method: 'DELETE' })
    if (res.ok) setExpenses(prev => prev.filter(e => e.id !== confirmDeleteId))
    setConfirmDeleteId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gastos</h2>
          <p className="text-gray-500 text-sm">{expenses.length} gastos registrados</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="w-4 h-4" />
          Registrar gasto
        </Button>
      </div>

      {/* Summary this month */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Total este mes</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalThisMonth)}</p>
          </CardContent>
        </Card>
        {Object.entries(totalByCategory).slice(0, 4).map(([cat, total]) => (
          <Card key={cat}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">{getExpenseCategoryLabel(cat)}</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="ALL">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="ALL">Todas las propiedades</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-gray-600 font-medium">No hay gastos registrados</h3>
          <Button className="mt-4" onClick={() => openForm()}>
            <Plus className="w-4 h-4" />
            Registrar primer gasto
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Propiedad</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Importe</th>
                <th
                  className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap"
                  title="Factura adjunta"
                >
                  Fact.
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(expense => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(expense.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[expense.category] || 'bg-gray-100 text-gray-700'}`}>
                      {getExpenseCategoryLabel(expense.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{expense.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{expense.property.name}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">-{formatCurrency(expense.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    {expense.receiptUrl ? (
                      <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer"
                        title="Ver factura" className="text-green-600 hover:text-green-700 inline-flex">
                        <CheckCircle className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-gray-200">
                        <Paperclip className="w-4 h-4 inline" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openForm(expense)}>Editar</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400" onClick={() => setConfirmDeleteId(expense.id)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Editar gasto' : 'Registrar gasto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Propiedad *</Label>
              <Select value={form.propertyId} onValueChange={v => setForm(f => ({ ...f, propertyId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona una propiedad" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Importe (€) *</Label>
                <Input id="amount" type="number" step="0.01" min="0" placeholder="0"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" placeholder="Descripción del gasto..." rows={2}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Receipt upload */}
            <div className="space-y-2">
              <Label>Factura / Justificante</Label>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
              {pendingFile ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-green-800 truncate flex-1">{pendingFile.name}</span>
                  <button type="button" onClick={() => { setPendingFile(null); if (fileRef.current) fileRef.current.value = '' }}>
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ) : editingExpense?.receiptUrl ? (
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <a href={editingExpense.receiptUrl} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate flex-1">Ver factura actual</a>
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-gray-500 hover:text-blue-600">
                    Reemplazar
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
                  <Paperclip className="w-4 h-4" />
                  Adjuntar factura (PDF, JPG, PNG · máx. 5 MB)
                </button>
              )}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingExpense ? 'Guardar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Eliminar gasto"
        description="Se eliminará el gasto permanentemente. Esta acción no se puede deshacer."
        confirmLabel="Eliminar gasto"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
