import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import { consumeDateColumn } from '#helpers/date_column'
import Category from '#models/category'
import PatissierProfile from '#models/patissier_profile'
import WorkshopBooking from '#models/workshop_booking'

export default class Workshop extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare patissierId: string

	@column()
	declare title: string

	@column()
	declare slug: string

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
	declare depositPercent: number

	@column()
	declare capacity: number

	@column()
	declare durationMinutes: number

	@column()
	declare location: string | null

	@column({ consume: consumeDateColumn })
	declare date: string

	@column()
	declare startTime: string

	@column()
	declare status: 'draft' | 'published' | 'full' | 'cancelled' | 'completed'

	@column()
	declare whatIncluded: string | null

	@column()
	declare level: 'debutant' | 'intermediaire' | 'avance' | 'tous_niveaux'

	@column()
	declare categoryId: string | null

	@column()
	declare isVisible: boolean

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@belongsTo(() => Category, { foreignKey: 'categoryId' })
	declare category: BelongsTo<typeof Category>

	@belongsTo(() => PatissierProfile, { foreignKey: 'patissierId' })
	declare patissier: BelongsTo<typeof PatissierProfile>

	@hasMany(() => WorkshopBooking)
	declare bookings: HasMany<typeof WorkshopBooking>
}
