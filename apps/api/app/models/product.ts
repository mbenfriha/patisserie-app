import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Category from '#models/category'
import PatissierProfile from '#models/patissier_profile'

export default class Product extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare patissierId: string

	@column()
	declare categoryId: string | null

	@column()
	declare name: string

	@column()
	declare description: string | null

	@column({
		prepare: (value: any[] | null) => (value ? JSON.stringify(value) : null),
		consume: (value: string | any[] | null) => {
			if (!value) return []
			if (typeof value === 'object') return value
			return JSON.parse(value)
		},
	})
	declare images: any[]

	@column()
	declare price: number

	@column()
	declare unit: string | null

	@column()
	declare minQuantity: number

	@column()
	declare maxQuantity: number | null

	@column()
	declare preparationDays: number

	@column()
	declare isAvailable: boolean

	@column()
	declare isVisible: boolean

	@column()
	declare sortOrder: number

	@column({
		prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
		consume: (value: string | string[] | null) => {
			if (!value) return []
			if (typeof value === 'object') return value
			return JSON.parse(value) as string[]
		},
	})
	declare allergens: string[]

	@column({
		prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
		consume: (value: string | string[] | null) => {
			if (!value) return []
			if (typeof value === 'object') return value
			return JSON.parse(value) as string[]
		},
	})
	declare tags: string[]

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@belongsTo(() => PatissierProfile, { foreignKey: 'patissierId' })
	declare patissier: BelongsTo<typeof PatissierProfile>

	@belongsTo(() => Category, { foreignKey: 'categoryId' })
	declare category: BelongsTo<typeof Category>
}
