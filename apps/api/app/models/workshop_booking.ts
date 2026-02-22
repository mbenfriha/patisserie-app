import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from '#models/user'
import Workshop from '#models/workshop'

export default class WorkshopBooking extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare workshopId: string

	@column()
	declare clientId: string | null

	@column()
	declare clientName: string

	@column()
	declare clientEmail: string

	@column()
	declare clientPhone: string | null

	@column()
	declare nbParticipants: number

	@column()
	declare message: string | null

	@column()
	declare totalPrice: number

	@column()
	declare depositAmount: number

	@column()
	declare remainingAmount: number

	@column()
	declare status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed'

	@column()
	declare stripeCheckoutSessionId: string | null

	@column()
	declare stripePaymentIntentId: string | null

	@column()
	declare depositPaymentStatus: 'pending' | 'paid' | 'refunded'

	@column.dateTime()
	declare depositPaidAt: DateTime | null

	@column()
	declare remainingPaymentStatus: 'pending' | 'paid' | 'not_required'

	@column.dateTime()
	declare remainingPaidAt: DateTime | null

	@column()
	declare cancellationReason: string | null

	@column.dateTime()
	declare cancelledAt: DateTime | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@belongsTo(() => Workshop)
	declare workshop: BelongsTo<typeof Workshop>

	@belongsTo(() => User, { foreignKey: 'clientId' })
	declare client: BelongsTo<typeof User>
}
