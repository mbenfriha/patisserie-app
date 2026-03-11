import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class AuditLog extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare userId: string | null

	@column()
	declare action: string

	@column()
	declare resourceType: string | null

	@column()
	declare resourceId: string | null

	@column({
		prepare: (value: Record<string, unknown>) => JSON.stringify(value),
		consume: (value: string) => (typeof value === 'string' ? JSON.parse(value) : value || {}),
	})
	declare metadata: Record<string, unknown>

	@column()
	declare ipAddress: string | null

	@column()
	declare userAgent: string | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime
}
