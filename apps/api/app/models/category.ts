import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Creation from '#models/creation'
import PatissierProfile from '#models/patissier_profile'
import Product from '#models/product'
import Workshop from '#models/workshop'

export default class Category extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare patissierId: string

	@column()
	declare name: string

	@column()
	declare slug: string

	@column()
	declare description: string | null

	@column()
	declare imageUrl: string | null

	@column()
	declare sortOrder: number

	@column()
	declare isVisible: boolean

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@belongsTo(() => PatissierProfile, { foreignKey: 'patissierId' })
	declare patissier: BelongsTo<typeof PatissierProfile>

	@hasMany(() => Creation, { foreignKey: 'categoryId' })
	declare creations: HasMany<typeof Creation>

	@hasMany(() => Product, { foreignKey: 'categoryId' })
	declare products: HasMany<typeof Product>

	@hasMany(() => Workshop, { foreignKey: 'categoryId' })
	declare workshops: HasMany<typeof Workshop>
}
