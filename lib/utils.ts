import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatMonth(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    APARTMENT: 'Piso completo',
    ROOM: 'Habitación',
    LOCAL: 'Local comercial',
  }
  return labels[type] || type
}

export function getPropertyStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: 'Disponible',
    OCCUPIED: 'Ocupado',
    RESERVED: 'Reservado',
    INCIDENT: 'En incidencia',
  }
  return labels[status] || status
}

export function getPropertyStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800',
    OCCUPIED: 'bg-blue-100 text-blue-800',
    RESERVED: 'bg-yellow-100 text-yellow-800',
    INCIDENT: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PAID: 'Pagado',
    PENDING: 'Pendiente',
    PARTIAL: 'Parcial',
    UNPAID: 'Impagado',
  }
  return labels[status] || status
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    UNPAID: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getTenantStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Activo',
    FINISHED: 'Finalizado',
    DEFAULTER: 'Moroso',
  }
  return labels[status] || status
}

export function getTenantStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    FINISHED: 'bg-gray-100 text-gray-800',
    DEFAULTER: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getIncidentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: 'Abierta',
    IN_PROGRESS: 'En proceso',
    RESOLVED: 'Resuelta',
    CLOSED: 'Cerrada',
  }
  return labels[status] || status
}

export function getIncidentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: 'bg-red-100 text-red-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getIncidentPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
  }
  return labels[priority] || priority
}

export function getIncidentPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-blue-100 text-blue-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

export function getExpenseCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    COMMUNITY: 'Comunidad',
    ELECTRICITY: 'Luz',
    WATER: 'Agua',
    GAS: 'Gas',
    INTERNET: 'Internet',
    INSURANCE: 'Seguro',
    IBI: 'IBI',
    REPAIR: 'Reparación',
    CLEANING: 'Limpieza',
    OTHER: 'Otros',
  }
  return labels[category] || category
}

export function getDepositStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    HELD: 'En poder del propietario',
    RETURNED_FULL: 'Devuelta íntegra',
    RETURNED_PARTIAL: 'Devuelta parcial',
    RETAINED: 'Retenida',
  }
  return labels[status] || status
}

export function getDepositStatusColor(status: string): string {
  const colors: Record<string, string> = {
    HELD: 'bg-blue-100 text-blue-800',
    RETURNED_FULL: 'bg-green-100 text-green-800',
    RETURNED_PARTIAL: 'bg-yellow-100 text-yellow-800',
    RETAINED: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function calculateRentability(income: number, expenses: number, investedCapital?: number) {
  const netProfit = income - expenses
  const monthlyRentability = investedCapital ? (netProfit / investedCapital) * 100 : 0
  const annualRentability = monthlyRentability * 12
  return { netProfit, monthlyRentability, annualRentability }
}

export function getDaysOverdue(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const today = new Date()
  const diffTime = today.getTime() - due.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function getCurrentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}
