import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Order from '#models/order'
import Product from '#models/product'

export default class OrderItem extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare orderId: string

	@column()
	declare productId: string | null

	@column()
	declare productName: string

	@column()
	declare unitPrice: number

	@column()
	declare quantity: number

	@column()
	declare total: number

	@column()
	declare specialInstructions: string | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@belongsTo(() => Order)
	declare order: BelongsTo<typeof Order>

	@belongsTo(() => Product, { foreignKey: 'productId' })
	declare product: BelongsTo<typeof Product>
}
