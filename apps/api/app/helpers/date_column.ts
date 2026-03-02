/**
 * Consume function for @column() on PostgreSQL DATE columns.
 * Ensures the value is always serialized as a plain "yyyy-MM-dd" string,
 * regardless of whether the pg driver returns a string or a Date object.
 */
export function consumeDateColumn(value: string | Date | null): string | null {
	if (!value) return null
	if (value instanceof Date) {
		const y = value.getFullYear()
		const m = String(value.getMonth() + 1).padStart(2, '0')
		const d = String(value.getDate()).padStart(2, '0')
		return `${y}-${m}-${d}`
	}
	return typeof value === 'string' ? value.split('T')[0] : String(value)
}
