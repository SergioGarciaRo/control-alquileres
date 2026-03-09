/**
 * Single source of truth for payment status calculation.
 * Used in: POST /api/payments, PUT /api/payments/[id], seed data.
 */
export function resolvePaymentStatus(
  paidAmount: number,
  expectedAmount: number,
  dueDate: Date,
): 'PAID' | 'PARTIAL' | 'UNPAID' | 'PENDING' {
  if (paidAmount >= expectedAmount) return 'PAID'
  if (paidAmount > 0) return 'PARTIAL'
  if (new Date() > dueDate) return 'UNPAID'
  return 'PENDING'
}

/**
 * Validates payment numeric inputs. Returns an error string or null.
 */
export function validatePaymentFields(data: {
  month: unknown
  year: unknown
  expectedAmount: unknown
  paidAmount: unknown
}): string | null {
  const month = Number(data.month)
  const year = Number(data.year)
  const expected = Number(data.expectedAmount)
  const paid = Number(data.paidAmount ?? 0)

  if (!Number.isInteger(month) || month < 1 || month > 12) return 'Mes inválido (1-12)'
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return 'Año inválido'
  if (isNaN(expected) || expected < 0) return 'Importe esperado inválido'
  if (isNaN(paid) || paid < 0) return 'Importe pagado inválido'
  return null
}
