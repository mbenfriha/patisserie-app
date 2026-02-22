import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Order from '#models/order'
import PatissierProfile from '#models/patissier_profile'
import Subscription from '#models/subscription'
import WorkshopBooking from '#models/workshop_booking'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
	uids: ['email'],
	passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
	static accessTokens = DbAccessTokensProvider.forModel(User, {
		expiresIn: '7 days',
		prefix: 'oat_',
		table: 'auth_access_tokens',
		type: 'auth_token',
		tokenSecretLength: 40,
	})

	@column({ isPrimary: true })
	declare id: string

	@column()
	declare email: string

	@column({ serializeAs: null })
	declare password: string | null

	@column()
	declare fullName: string | null

	@column()
	declare role: 'patissier' | 'client' | 'superadmin'

	@column.dateTime()
	declare emailVerifiedAt: DateTime | null

	@column.dateTime()
	declare suspendedAt: DateTime | null

	@column()
	declare suspendReason: string | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@hasOne(() => PatissierProfile)
	declare patissierProfile: HasOne<typeof PatissierProfile>

	@hasMany(() => Order, { foreignKey: 'clientId' })
	declare orders: HasMany<typeof Order>

	@hasMany(() => WorkshopBooking, { foreignKey: 'clientId' })
	declare workshopBookings: HasMany<typeof WorkshopBooking>

	@hasMany(() => Subscription)
	declare subscriptions: HasMany<typeof Subscription>

	get isPatissier() {
		return this.role === 'patissier'
	}

	get isClient() {
		return this.role === 'client'
	}

	get isSuperadmin() {
		return this.role === 'superadmin'
	}

	get isEmailVerified() {
		return this.emailVerifiedAt !== null
	}
}
