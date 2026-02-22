import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from '#models/user'

export default class Notification extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare userId: string

	@column()
	declare type: string

	@column()
	declare title: string

	@column()
	declare message: string | null

	@column({
		prepare: (value: Record<string, unknown> | null) =>
			value ? JSON.stringify(value) : null,
		consume: (value: string | Record<string, unknown> | null) => {
			if (!value) return null
			if (typeof value === 'object') return value
			return JSON.parse(value)
		},
	})
	declare data: Record<string, unknown> | null

	@column()
	declare actionUrl: string | null

	@column.dateTime()
	declare readAt: DateTime | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@belongsTo(() => User)
	declare user: BelongsTo<typeof User>
}
