import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Ingredient from '#models/ingredient'
import Order from '#models/order'

export default class OrderCostingIngredient extends BaseModel {
	static table = 'order_costing_ingredients'

	@column({ isPrimary: true })
	declare id: string

	@column()
	declare orderId: string

	@column()
	declare ingredientId: string | null

	@column()
	declare ingredientName: string

	@column()
	declare unit: string

	@column()
	declare unitPrice: number

	@column()
	declare quantity: number

	@column()
	declare totalCost: number

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@belongsTo(() => Order)
	declare order: BelongsTo<typeof Order>

	@belongsTo(() => Ingredient, { foreignKey: 'ingredientId' })
	declare ingredient: BelongsTo<typeof Ingredient>
}
