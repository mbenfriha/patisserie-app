import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Employee from '#models/employee'
import Order from '#models/order'

export default class OrderCostingLabor extends BaseModel {
	static table = 'order_costing_labor'

	@column({ isPrimary: true })
	declare id: string

	@column()
	declare orderId: string

	@column()
	declare employeeId: string | null

	@column()
	declare employeeName: string

	@column()
	declare hourlyRate: number

	@column()
	declare hours: number

	@column()
	declare totalCost: number

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@belongsTo(() => Order)
	declare order: BelongsTo<typeof Order>

	@belongsTo(() => Employee, { foreignKey: 'employeeId' })
	declare employee: BelongsTo<typeof Employee>
}
