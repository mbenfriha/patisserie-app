import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Category from '#models/category'
import PatissierProfile from '#models/patissier_profile'

export interface CreationImage {
	url: string
	alt: string | null
	is_cover: boolean
}

export default class Creation extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare patissierId: string

	@column()
	declare categoryId: string | null

	@column()
	declare title: string

	@column()
	declare slug: string

	@column()
	declare description: string | null

	@column({
		prepare: (value: CreationImage[] | null) => (value ? JSON.stringify(value) : null),
		consume: (value: string | CreationImage[] | null) => {
			if (!value) return []
			if (typeof value === 'object') return value
			return JSON.parse(value) as CreationImage[]
		},
	})
	declare images: CreationImage[]

	@column()
	declare price: number | null

	@column()
	declare isVisible: boolean

	@column()
	declare isFeatured: boolean

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
