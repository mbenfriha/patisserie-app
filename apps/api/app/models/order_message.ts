import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Order from '#models/order'

export default class OrderMessage extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare orderId: string

	@column()
	declare senderType: 'patissier' | 'client' | 'system'

	@column()
	declare senderId: string | null

	@column()
	declare message: string

	@column({
		prepare: (value: any[] | null) => (value ? JSON.stringify(value) : null),
		consume: (value: string | any[] | null) => {
			if (!value) return []
			if (typeof value === 'object') return value
			return JSON.parse(value)
		},
	})
	declare attachments: any[]

	@column.dateTime()
	declare readAt: DateTime | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@belongsTo(() => Order)
	declare order: BelongsTo<typeof Order>
}
