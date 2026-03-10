import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	async up() {
		// Ingredients table
		this.schema.createTable('ingredients', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
			table
				.uuid('patissier_id')
				.notNullable()
				.references('id')
				.inTable('patissier_profiles')
				.onDelete('CASCADE')
			table.string('name', 200).notNullable()
			table.string('category', 100).defaultTo('autre')
			table.string('unit', 50).defaultTo('g')
			table.decimal('price_per_unit', 10, 4).defaultTo(0)
			table.decimal('stock', 10, 2).nullable()
			table.timestamp('created_at').defaultTo(this.now())
			table.timestamp('updated_at').defaultTo(this.now())

			table.index(['patissier_id'])
		})

		// Employees table
		this.schema.createTable('employees', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
			table
				.uuid('patissier_id')
				.notNullable()
				.references('id')
				.inTable('patissier_profiles')
				.onDelete('CASCADE')
			table.string('name', 200).notNullable()
			table.string('role', 100).nullable()
			table.decimal('hourly_rate', 10, 2).defaultTo(0)
			table.timestamp('created_at').defaultTo(this.now())
			table.timestamp('updated_at').defaultTo(this.now())

			table.index(['patissier_id'])
		})

		// Order costing ingredients (snapshot-based)
		this.schema.createTable('order_costing_ingredients', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
			table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
			table
				.uuid('ingredient_id')
				.nullable()
				.references('id')
				.inTable('ingredients')
				.onDelete('SET NULL')
			table.string('ingredient_name', 200).notNullable()
			table.string('unit', 50).notNullable()
			table.decimal('unit_price', 10, 4).notNullable()
			table.decimal('quantity', 10, 2).notNullable()
			table.decimal('total_cost', 10, 2).notNullable()
			table.timestamp('created_at').defaultTo(this.now())

			table.index(['order_id'])
		})

		// Order costing labor (snapshot-based)
		this.schema.createTable('order_costing_labor', (table) => {
			table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
			table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
			table
				.uuid('employee_id')
				.nullable()
				.references('id')
				.inTable('employees')
				.onDelete('SET NULL')
			table.string('employee_name', 200).notNullable()
			table.decimal('hourly_rate', 10, 2).notNullable()
			table.decimal('hours', 10, 2).notNullable()
			table.decimal('total_cost', 10, 2).notNullable()
			table.timestamp('created_at').defaultTo(this.now())

			table.index(['order_id'])
		})

		// Add default_margin_coefficient to patissier_profiles
		this.schema.alterTable('patissier_profiles', (table) => {
			table.decimal('default_margin_coefficient', 4, 2).defaultTo(2.5)
		})
	}

	async down() {
		this.schema.alterTable('patissier_profiles', (table) => {
			table.dropColumn('default_margin_coefficient')
		})
		this.schema.dropTable('order_costing_labor')
		this.schema.dropTable('order_costing_ingredients')
		this.schema.dropTable('employees')
		this.schema.dropTable('ingredients')
	}
}
