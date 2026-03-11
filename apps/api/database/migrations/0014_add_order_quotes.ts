import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	async up() {
		// Drop type if it exists from a previous migration:fresh (which doesn't drop types)
		this.schema.raw('DROP TYPE IF EXISTS "quote_status"')

		this.schema.createTable('order_quotes', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
			table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
			table.integer('version').notNullable().defaultTo(1)
			table.decimal('price', 10, 2).notNullable().defaultTo(0)
			table.integer('deposit_percent').notNullable().defaultTo(30)
			table.string('confirmed_date', 50).nullable()
			table.text('message').nullable()
			table
				.enum('status', ['draft', 'sent', 'accepted', 'rejected', 'revised'], {
					useNative: true,
					enumName: 'quote_status',
					existingType: false,
				})
				.notNullable()
				.defaultTo('draft')
			table.timestamp('sent_at').nullable()
			table.timestamp('responded_at').nullable()
			table.timestamp('created_at').defaultTo(this.now())
			table.timestamp('updated_at').defaultTo(this.now())

			table.index(['order_id'])
			table.index(['order_id', 'status'])
		})
	}

	async down() {
		this.schema.dropTable('order_quotes')
		this.schema.raw('DROP TYPE IF EXISTS "quote_status"')
	}
}
