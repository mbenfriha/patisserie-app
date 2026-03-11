import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Order from '#models/order'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'revised'

export default class OrderQuote extends BaseModel {
	static table = 'order_quotes'

	@column({ isPrimary: true })
	declare id: string

	@column()
	declare orderId: string

	@column()
	declare version: number

	@column()
	declare price: number

	@column()
	declare depositPercent: number

	@column()
	declare confirmedDate: string | null

	@column()
	declare message: string | null

	@column()
	declare status: QuoteStatus

	@column.dateTime()
	declare sentAt: DateTime | null

	@column.dateTime()
	declare respondedAt: DateTime | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@belongsTo(() => Order)
	declare order: BelongsTo<typeof Order>
}
