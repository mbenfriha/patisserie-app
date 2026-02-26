import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Category from '#models/category'
import Creation from '#models/creation'
import Order from '#models/order'
import Product from '#models/product'
import User from '#models/user'
import Workshop from '#models/workshop'

export type SocialLinks = Partial<
	Record<'instagram' | 'facebook' | 'tiktok' | 'snapchat' | 'linkedin' | 'youtube' | 'customUrl' | 'customLabel', string>
>

export type OperatingHours = Partial<
	Record<string, { open: string; close: string; closed?: boolean }>
>

export interface SiteConfig {
	heroSubtitle?: string
	heroCtaLabel?: string
	heroCtaHref?: string
	storyTitle?: string
	storySubtitle?: string
	storyText?: string
	marqueeItems?: string[]
	creationsTitle?: string
	creationsSubtitle?: string
	workshopsCtaTitle?: string
	workshopsCtaSubtitle?: string
	workshopsCtaDescription?: string
	workshopsCtaLabel?: string
	showStorySection?: boolean
	showMarquee?: boolean
	showCreationsOnHomepage?: boolean
	showWorkshopsCta?: boolean
	showCatalogueTab?: boolean
	showCustomOrderTab?: boolean
	showInstagramSection?: boolean
	instagramSectionTitle?: string
	instagramSectionSubtitle?: string
	fontPreset?: 'classic' | 'modern' | 'elegant' | 'playful'
	logoSize?: number
}

export default class PatissierProfile extends BaseModel {
	@column({ isPrimary: true })
	declare id: string

	@column()
	declare userId: string

	@column()
	declare slug: string

	@column()
	declare businessName: string

	@column()
	declare logoUrl: string | null

	@column()
	declare description: string | null

	@column()
	declare phone: string | null

	@column()
	declare addressStreet: string | null

	@column()
	declare addressCity: string | null

	@column()
	declare addressZip: string | null

	@column()
	declare addressCountry: string | null

	@column({
		prepare: (value: SocialLinks | null) => (value ? JSON.stringify(value) : null),
		consume: (value: string | SocialLinks | null) => {
			if (!value) return {}
			if (typeof value === 'object') return value
			return JSON.parse(value) as SocialLinks
		},
	})
	declare socialLinks: SocialLinks

	@column()
	declare primaryColor: string

	@column()
	declare secondaryColor: string

	@column()
	declare fontFamily: string

	@column()
	declare heroImageUrl: string | null

	@column()
	declare creationsHeroImageUrl: string | null

	@column()
	declare workshopsHeroImageUrl: string | null

	@column()
	declare productsHeroImageUrl: string | null

	@column()
	declare ordersHeroImageUrl: string | null

	@column()
	declare customDomain: string | null

	@column()
	declare customDomainVerified: boolean

	@column()
	declare stripeAccountId: string | null

	@column()
	declare stripeOnboardingComplete: boolean

	@column()
	declare plan: 'starter' | 'pro' | 'premium'

	@column({
		prepare: (value: OperatingHours | null) => (value ? JSON.stringify(value) : null),
		consume: (value: string | OperatingHours | null) => {
			if (!value) return null
			if (typeof value === 'object') return value
			return JSON.parse(value) as OperatingHours
		},
	})
	declare operatingHours: OperatingHours | null

	@column()
	declare ordersEnabled: boolean

	@column()
	declare workshopsEnabled: boolean

	@column({
		prepare: (value: SiteConfig | null) => (value ? JSON.stringify(value) : '{}'),
		consume: (value: string | SiteConfig | null) => {
			if (!value) return {}
			if (typeof value === 'object') return value
			return JSON.parse(value) as SiteConfig
		},
	})
	declare siteConfig: SiteConfig

	@column()
	declare storyImageUrl: string | null

	@column()
	declare acceptsCustomOrders: boolean

	@column()
	declare defaultDepositPercent: number

	@column()
	declare allowSupportAccess: boolean

	@column({ serializeAs: null })
	declare instagramAccessToken: string | null

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime

	@belongsTo(() => User)
	declare user: BelongsTo<typeof User>

	@hasMany(() => Category, { foreignKey: 'patissierId' })
	declare categories: HasMany<typeof Category>

	@hasMany(() => Creation, { foreignKey: 'patissierId' })
	declare creations: HasMany<typeof Creation>

	@hasMany(() => Product, { foreignKey: 'patissierId' })
	declare products: HasMany<typeof Product>

	@hasMany(() => Workshop, { foreignKey: 'patissierId' })
	declare workshops: HasMany<typeof Workshop>

	@hasMany(() => Order, { foreignKey: 'patissierId' })
	declare orders: HasMany<typeof Order>

	get isPro() {
		return this.plan === 'pro' || this.plan === 'premium'
	}

	get isPremium() {
		return this.plan === 'premium'
	}

	get isStarter() {
		return this.plan === 'starter'
	}
}
