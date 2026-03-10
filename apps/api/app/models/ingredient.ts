import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import PatissierProfile from '#models/patissier_profile'

export default class Ingredient extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare patissierId: string

	@column()
	declare name: string

	@column()
	declare category: string

	@column()
	declare unit: string

	@column()
	declare pricePerUnit: number

	@column()
	declare stock: number | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@belongsTo(() => PatissierProfile, { foreignKey: 'patissierId' })
	declare patissier: BelongsTo<typeof PatissierProfile>
}
