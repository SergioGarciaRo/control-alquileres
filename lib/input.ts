export function trimOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  return v.length ? v : null
}

export function trimOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  return v.length ? v : undefined
}

export function parseNumber(
  value: unknown,
  opts: { min?: number; allowZero?: boolean } = {},
): number | null {
  const raw = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(raw)) return null
  const min = opts.min ?? 0
  const allowZero = opts.allowZero ?? true
  if (!allowZero && raw === 0) return null
  if (raw < min) return null
  return raw
}

export function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== 'string') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

