import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import OrderItem from '#models/order_item'
import OrderMessage from '#models/order_message'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

export default class Order extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare orderNumber: string

	@column()
	declare patissierId: string

	@column()
	declare clientId: string | null

	@column()
	declare clientName: string

	@column()
	declare clientEmail: string

	@column()
	declare clientPhone: string | null

	@column()
	declare type: 'catalogue' | 'custom'

	@column()
	declare customType: string | null

	@column()
	declare customNbPersonnes: number | null

	@column()
	declare customDateSouhaitee: string | null

	@column()
	declare customTheme: string | null

	@column()
	declare customAllergies: string | null

	@column()
	declare customPhotoInspirationUrl: string | null

	@column()
	declare customMessage: string | null

	@column()
	declare subtotal: number | null

	@column()
	declare total: number | null

	@column()
	declare status:
		| 'pending'
		| 'confirmed'
		| 'in_progress'
		| 'ready'
		| 'delivered'
		| 'picked_up'
		| 'cancelled'

	@column()
	declare deliveryMethod: 'pickup' | 'delivery'

	@column()
	declare requestedDate: string | null

	@column()
	declare confirmedDate: string | null

	@column()
	declare deliveryAddress: string | null

	@column()
	declare deliveryNotes: string | null

	@column()
	declare stripePaymentIntentId: string | null

	@column()
	declare paymentStatus: 'pending' | 'paid' | 'refunded'

	@column.dateTime()
	declare paidAt: DateTime | null

	@column()
	declare patissierNotes: string | null

	@column()
	declare responseMessage: string | null

	@column()
	declare quotedPrice: number | null

	@column.dateTime()
	declare confirmedAt: DateTime | null

	@column.dateTime()
	declare completedAt: DateTime | null

	@column.dateTime()
	declare cancelledAt: DateTime | null

	@column()
	declare cancellationReason: string | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@belongsTo(() => PatissierProfile, { foreignKey: 'patissierId' })
	declare patissier: BelongsTo<typeof PatissierProfile>

	@belongsTo(() => User, { foreignKey: 'clientId' })
	declare client: BelongsTo<typeof User>

	@hasMany(() => OrderItem)
	declare items: HasMany<typeof OrderItem>

	@hasMany(() => OrderMessage)
	declare messages: HasMany<typeof OrderMessage>
}
