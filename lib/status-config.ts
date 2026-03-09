/**
 * Central configuration for all entity statuses.
 * Single source of truth for labels and badge colors.
 * Eliminates the scattered getXxxLabel / getXxxColor functions in utils.ts.
 */

export type BadgeColor = string

interface StatusEntry {
  label: string
  color: BadgeColor
}

export const PAYMENT_STATUS: Record<string, StatusEntry> = {
  PAID:    { label: 'Pagado',    color: 'bg-green-100 text-green-800' },
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  PARTIAL: { label: 'Parcial',   color: 'bg-orange-100 text-orange-800' },
  UNPAID:  { label: 'Impagado',  color: 'bg-red-100 text-red-800' },
}

export const PROPERTY_STATUS: Record<string, StatusEntry> = {
  AVAILABLE: { label: 'Disponible',    color: 'bg-green-100 text-green-800' },
  OCCUPIED:  { label: 'Ocupado',       color: 'bg-blue-100 text-blue-800' },
  RESERVED:  { label: 'Reservado',     color: 'bg-yellow-100 text-yellow-800' },
  INCIDENT:  { label: 'En incidencia', color: 'bg-red-100 text-red-800' },
}

export const PROPERTY_TYPE: Record<string, string> = {
  APARTMENT: 'Piso completo',
  ROOM:      'Habitación',
  LOCAL:     'Local comercial',
}

export const TENANT_STATUS: Record<string, StatusEntry> = {
  ACTIVE:    { label: 'Activo',     color: 'bg-green-100 text-green-800' },
  FINISHED:  { label: 'Finalizado', color: 'bg-gray-100 text-gray-800' },
  DEFAULTER: { label: 'Moroso',     color: 'bg-red-100 text-red-800' },
}

export const INCIDENT_STATUS: Record<string, StatusEntry> = {
  OPEN:        { label: 'Abierta',    color: 'bg-red-100 text-red-800' },
  IN_PROGRESS: { label: 'En proceso', color: 'bg-yellow-100 text-yellow-800' },
  RESOLVED:    { label: 'Resuelta',   color: 'bg-green-100 text-green-800' },
  CLOSED:      { label: 'Cerrada',    color: 'bg-gray-100 text-gray-800' },
}

export const INCIDENT_PRIORITY: Record<string, StatusEntry> = {
  LOW:    { label: 'Baja',  color: 'bg-blue-100 text-blue-800' },
  MEDIUM: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  HIGH:   { label: 'Alta',  color: 'bg-red-100 text-red-800' },
}

export const INCIDENT_CATEGORY: Record<string, string> = {
  BREAKDOWN:  'Avería',
  REPAIR:     'Reparación',
  NOISE:      'Ruidos',
  WATER:      'Agua',
  ELECTRICAL: 'Electricidad',
  PLUMBING:   'Fontanería',
  STRUCTURAL: 'Estructural',
  OTHER:      'Otro',
}

export const DEPOSIT_STATUS: Record<string, StatusEntry> = {
  HELD:             { label: 'En poder del propietario', color: 'bg-blue-100 text-blue-800' },
  RETURNED_FULL:    { label: 'Devuelta íntegra',         color: 'bg-green-100 text-green-800' },
  RETURNED_PARTIAL: { label: 'Devuelta parcial',         color: 'bg-yellow-100 text-yellow-800' },
  RETAINED:         { label: 'Retenida',                 color: 'bg-red-100 text-red-800' },
}

export const EXPENSE_CATEGORY: Record<string, string> = {
  COMMUNITY:   'Comunidad',
  ELECTRICITY: 'Luz',
  WATER:       'Agua',
  GAS:         'Gas',
  INTERNET:    'Internet',
  INSURANCE:   'Seguro',
  IBI:         'IBI',
  REPAIR:      'Reparación',
  CLEANING:    'Limpieza',
  OTHER:       'Otros',
}

export const PAYMENT_METHOD: Record<string, string> = {
  TRANSFER: 'Transferencia',
  CASH:     'Efectivo',
  DIRECT_DEBIT: 'Domiciliación',
  BIZUM:    'Bizum',
  OTHER:    'Otro',
}

export const DOCUMENT_TYPE: Record<string, string> = {
  CONTRACT:   'Contrato',
  INVENTORY:  'Inventario',
  RECEIPT:    'Justificante',
  INSPECTION: 'Inspección',
  OTHER:      'Otro',
}

/** Helper: get label + color from any status map, with fallback */
export function getStatus(map: Record<string, StatusEntry>, key: string): StatusEntry {
  return map[key] ?? { label: key, color: 'bg-gray-100 text-gray-800' }
}
