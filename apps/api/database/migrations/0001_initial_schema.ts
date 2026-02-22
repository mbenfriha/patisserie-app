import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	async up() {
		// Enable UUID extension
		this.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

		// Users table
		this.schema.createTable('users', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table.string('email', 254).notNullable().unique()
			table.string('password', 180).nullable()
			table.string('full_name', 200).nullable()
			table.enum('role', ['patissier', 'client', 'superadmin']).notNullable()
			table.timestamp('email_verified_at').nullable()
			table.timestamp('suspended_at').nullable()
			table.string('suspend_reason', 500).nullable()
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()

			table.index(['email'])
		})

		// Auth access tokens
		this.schema.createTable('auth_access_tokens', (table) => {
			table.increments('id')
			table.uuid('tokenable_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
			table.string('type').notNullable()
			table.string('name').nullable()
			table.string('hash').notNullable()
			table.text('abilities').notNullable()
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()
			table.timestamp('last_used_at').nullable()
			table.timestamp('expires_at').nullable()
		})

		// Patissier profiles
		this.schema.createTable('patissier_profiles', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table
				.uuid('user_id')
				.notNullable()
				.unique()
				.references('id')
				.inTable('users')
				.onDelete('CASCADE')
			table.string('slug', 50).notNullable().unique()
			table.string('business_name', 200).notNullable()
			table.string('logo_url', 500).nullable()
			table.text('description').nullable()
			table.string('phone', 30).nullable()
			// Address
			table.string('address_street', 255).nullable()
			table.string('address_city', 100).nullable()
			table.string('address_zip', 20).nullable()
			table.string('address_country', 100).defaultTo('France')
			// Social links
			table.jsonb('social_links').defaultTo('{}')
			// Design
			table.string('primary_color', 7).defaultTo('#D4A574')
			table.string('secondary_color', 7).defaultTo('#8B6F47')
			table.string('font_family', 50).defaultTo('default')
			table.string('hero_image_url', 500).nullable()
			// Site config
			table.jsonb('site_config').defaultTo('{}')
			table.string('story_image_url', 500).nullable()
			// Custom domain (Premium)
			table.string('custom_domain', 255).nullable()
			table.boolean('custom_domain_verified').defaultTo(false)
			// Stripe Connect
			table.string('stripe_account_id', 255).nullable()
			table.boolean('stripe_onboarding_complete').defaultTo(false)
			// Plan
			table.enum('plan', ['starter', 'pro', 'premium']).defaultTo('starter')
			// Operating hours
			table.jsonb('operating_hours').nullable()
			// Feature flags
			table.boolean('orders_enabled').defaultTo(false)
			table.boolean('workshops_enabled').defaultTo(false)
			table.boolean('accepts_custom_orders').defaultTo(true)
			table.integer('default_deposit_percent').defaultTo(30)
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()

			table.index(['slug'])
		})

		// Categories
		this.schema.createTable('categories', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table
				.uuid('patissier_id')
				.notNullable()
				.references('id')
				.inTable('patissier_profiles')
				.onDelete('CASCADE')
			table.string('name', 100).notNullable()
			table.string('slug', 100).notNullable()
			table.text('description').nullable()
			table.string('image_url', 500).nullable()
			table.integer('sort_order').defaultTo(0)
			table.boolean('is_visible').defaultTo(true)
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()

			table.unique(['patissier_id', 'slug'])
			table.index(['patissier_id'])
		})

		// Creations
		this.schema.createTable('creations', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table
				.uuid('patissier_id')
				.notNullable()
				.references('id')
				.inTable('patissier_profiles')
				.onDelete('CASCADE')
			table
				.uuid('category_id')
				.nullable()
				.references('id')
				.inTable('categories')
				.onDelete('SET NULL')
			table.string('title', 200).notNullable()
			table.string('slug', 200).notNullable()
			table.text('description').nullable()
			table.jsonb('images').defaultTo('[]')
			table.decimal('price', 10, 2).nullable()
			table.boolean('is_visible').defaultTo(true)
			table.boolean('is_featured').defaultTo(false)
			table.integer('sort_order').defaultTo(0)
			table.jsonb('tags').defaultTo('[]')
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()

			table.index(['patissier_id'])
		})

		// Products (catalogue commandes)
		this.schema.createTable('products', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table
				.uuid('patissier_id')
				.notNullable()
				.references('id')
				.inTable('patissier_profiles')
				.onDelete('CASCADE')
			table
				.uuid('category_id')
				.nullable()
				.references('id')
				.inTable('categories')
				.onDelete('SET NULL')
			table.string('name', 200).notNullable()
			table.text('description').nullable()
			table.jsonb('images').defaultTo('[]')
			table.decimal('price', 10, 2).notNullable()
			table.string('unit', 50).nullable()
			table.integer('min_quantity').defaultTo(1)
			table.integer('max_quantity').nullable()
			table.integer('preparation_days').defaultTo(2)
			table.boolean('is_available').defaultTo(true)
			table.boolean('is_visible').defaultTo(true)
			table.integer('sort_order').defaultTo(0)
			table.jsonb('allergens').defaultTo('[]')
			table.jsonb('tags').defaultTo('[]')
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()

			table.index(['patissier_id'])
		})

		// Workshops
		this.schema.createTable('workshops', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table
				.uuid('patissier_id')
				.notNullable()
				.references('id')
				.inTable('patissier_profiles')
				.onDelete('CASCADE')
			table
				.uuid('category_id')
				.nullable()
				.references('id')
				.inTable('categories')
				.onDelete('SET NULL')
			table.string('title', 200).notNullable()
			table.text('description').nullable()
			table.jsonb('images').defaultTo('[]')
			table.decimal('price', 10, 2).notNullable()
			table.integer('deposit_percent').notNullable().defaultTo(30)
			table.integer('capacity').notNullable()
			table.integer('duration_minutes').notNullable()
			table.string('location', 500).nullable()
			table.date('date').notNullable()
			table.time('start_time').notNullable()
			table
				.enum('status', ['draft', 'published', 'full', 'cancelled', 'completed'])
				.defaultTo('draft')
			table.text('what_included').nullable()
			table
				.enum('level', ['debutant', 'intermediaire', 'avance', 'tous_niveaux'])
				.defaultTo('tous_niveaux')
			table.boolean('is_visible').defaultTo(true)
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()

			table.index(['patissier_id'])
			table.index(['category_id'])
			table.index(['date'])
		})

		// Workshop bookings
		this.schema.createTable('workshop_bookings', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table
				.uuid('workshop_id')
				.notNullable()
				.references('id')
				.inTable('workshops')
				.onDelete('CASCADE')
			table
				.uuid('client_id')
				.nullable()
				.references('id')
				.inTable('users')
				.onDelete('SET NULL')
			table.string('client_name', 200).notNullable()
			table.string('client_email', 254).notNullable()
			table.string('client_phone', 30).nullable()
			table.integer('nb_participants').defaultTo(1)
			table.text('message').nullable()
			table.decimal('total_price', 10, 2).notNullable()
			table.decimal('deposit_amount', 10, 2).notNullable()
			table.decimal('remaining_amount', 10, 2).notNullable()
			table
				.enum('status', ['pending_payment', 'confirmed', 'cancelled', 'completed'])
				.defaultTo('pending_payment')
			table.string('stripe_checkout_session_id', 255).nullable()
			table.string('stripe_payment_intent_id', 255).nullable()
			table
				.enum('deposit_payment_status', ['pending', 'paid', 'refunded'])
				.defaultTo('pending')
			table.timestamp('deposit_paid_at').nullable()
			table
				.enum('remaining_payment_status', ['pending', 'paid', 'not_required'])
				.defaultTo('pending')
			table.timestamp('remaining_paid_at').nullable()
			table.text('cancellation_reason').nullable()
			table.timestamp('cancelled_at').nullable()
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()

			table.index(['workshop_id'])
			table.index(['client_id'])
		})

		// Orders
		this.schema.createTable('orders', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table.string('order_number', 20).notNullable().unique()
			table
				.uuid('patissier_id')
				.notNullable()
				.references('id')
				.inTable('patissier_profiles')
				.onDelete('CASCADE')
			table
				.uuid('client_id')
				.nullable()
				.references('id')
				.inTable('users')
				.onDelete('SET NULL')
			table.string('client_name', 200).notNullable()
			table.string('client_email', 254).notNullable()
			table.string('client_phone', 30).nullable()
			table.enum('type', ['catalogue', 'custom']).notNullable()
			// Custom order fields
			table.string('custom_type', 100).nullable()
			table.integer('custom_nb_personnes').nullable()
			table.date('custom_date_souhaitee').nullable()
			table.string('custom_theme', 200).nullable()
			table.text('custom_allergies').nullable()
			table.string('custom_photo_inspiration_url', 500).nullable()
			table.text('custom_message').nullable()
			// Pricing
			table.decimal('subtotal', 10, 2).nullable()
			table.decimal('total', 10, 2).nullable()
			// Status
			table
				.enum('status', [
					'pending',
					'confirmed',
					'in_progress',
					'ready',
					'delivered',
					'picked_up',
					'cancelled',
				])
				.defaultTo('pending')
			table.enum('delivery_method', ['pickup', 'delivery']).defaultTo('pickup')
			table.date('requested_date').nullable()
			table.date('confirmed_date').nullable()
			table.text('delivery_address').nullable()
			table.text('delivery_notes').nullable()
			// Stripe
			table.string('stripe_payment_intent_id', 255).nullable()
			table.enum('payment_status', ['pending', 'paid', 'refunded']).defaultTo('pending')
			table.timestamp('paid_at').nullable()
			// Patissier notes
			table.text('patissier_notes').nullable()
			table.text('response_message').nullable()
			table.decimal('quoted_price', 10, 2).nullable()
			// Timestamps
			table.timestamp('confirmed_at').nullable()
			table.timestamp('completed_at').nullable()
			table.timestamp('cancelled_at').nullable()
			table.text('cancellation_reason').nullable()
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()

			table.index(['patissier_id', 'status'])
			table.index(['order_number'])
			table.index(['client_id'])
		})

		// Order items
		this.schema.createTable('order_items', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table
				.uuid('order_id')
				.notNullable()
				.references('id')
				.inTable('orders')
				.onDelete('CASCADE')
			table
				.uuid('product_id')
				.nullable()
				.references('id')
				.inTable('products')
				.onDelete('SET NULL')
			table.string('product_name', 200).notNullable()
			table.decimal('unit_price', 10, 2).notNullable()
			table.integer('quantity').notNullable()
			table.decimal('total', 10, 2).notNullable()
			table.text('special_instructions').nullable()
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()

			table.index(['order_id'])
		})

		// Order messages
		this.schema.createTable('order_messages', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table
				.uuid('order_id')
				.notNullable()
				.references('id')
				.inTable('orders')
				.onDelete('CASCADE')
			table.enum('sender_type', ['patissier', 'client', 'system']).notNullable()
			table.uuid('sender_id').nullable()
			table.text('message').notNullable()
			table.jsonb('attachments').defaultTo('[]')
			table.timestamp('read_at').nullable()
			table.timestamp('created_at').notNullable()

			table.index(['order_id', 'created_at'])
		})

		// Subscriptions
		this.schema.createTable('subscriptions', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
			table.enum('plan', ['starter', 'pro', 'premium']).notNullable()
			table.enum('billing_interval', ['monthly', 'yearly']).notNullable()
			table.string('stripe_customer_id', 255).nullable()
			table.string('stripe_subscription_id', 255).nullable()
			table.enum('status', ['active', 'canceled', 'past_due', 'trialing']).defaultTo('active')
			table.timestamp('trial_ends_at').nullable()
			table.timestamp('current_period_start').notNullable()
			table.timestamp('current_period_end').notNullable()
			table.boolean('cancel_at_period_end').defaultTo(false)
			table.timestamp('canceled_at').nullable()
			table.timestamp('created_at').notNullable()
			table.timestamp('updated_at').nullable()
		})

		// Notifications
		this.schema.createTable('notifications', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
			table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
			table.string('type', 50).notNullable()
			table.string('title', 200).notNullable()
			table.text('message').nullable()
			table.jsonb('data').nullable()
			table.string('action_url', 500).nullable()
			table.timestamp('read_at').nullable()
			table.timestamp('created_at').notNullable()

			table.index(['user_id', 'read_at', 'created_at'])
		})
	}

	async down() {
		this.schema.dropTable('notifications')
		this.schema.dropTable('subscriptions')
		this.schema.dropTable('order_messages')
		this.schema.dropTable('order_items')
		this.schema.dropTable('orders')
		this.schema.dropTable('workshop_bookings')
		this.schema.dropTable('workshops')
		this.schema.dropTable('products')
		this.schema.dropTable('creations')
		this.schema.dropTable('categories')
		this.schema.dropTable('patissier_profiles')
		this.schema.dropTable('auth_access_tokens')
		this.schema.dropTable('users')
	}
}
