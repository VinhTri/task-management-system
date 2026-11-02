const integerFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const compactFormatter = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })

/** Currency format used throughout SmartSpend: 100.000 VND. */
export function formatVnd(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0
  return `${formatVndNumber(safeValue)} VND`
}

export function formatVndNumber(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0
  return integerFormatter.format(Math.round(safeValue))
}

/** Short chart labels with the same explicit VND suffix. */
export function formatVndCompact(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0
  return `${compactFormatter.format(safeValue)} VND`
}
