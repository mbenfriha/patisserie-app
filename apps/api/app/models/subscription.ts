import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from '#models/user'

export default class Subscription extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare userId: string

	@column()
	declare plan: 'starter' | 'pro' | 'premium'

	@column()
	declare billingInterval: 'monthly' | 'yearly'

	@column()
	declare stripeCustomerId: string | null

	@column()
	declare stripeSubscriptionId: string | null

	@column()
	declare status: 'active' | 'canceled' | 'past_due' | 'trialing'

	@column.dateTime()
	declare trialEndsAt: DateTime | null

	@column.dateTime()
	declare currentPeriodStart: DateTime

	@column.dateTime()
	declare currentPeriodEnd: DateTime

	@column()
	declare cancelAtPeriodEnd: boolean

	@column.dateTime()
	declare canceledAt: DateTime | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@belongsTo(() => User)
	declare user: BelongsTo<typeof User>
}
