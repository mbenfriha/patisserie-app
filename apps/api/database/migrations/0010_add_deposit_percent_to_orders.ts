import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	protected tableName = 'orders'

	async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer('deposit_percent').nullable().defaultTo(null)
		})
	}

	async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('deposit_percent')
		})
	}
}
