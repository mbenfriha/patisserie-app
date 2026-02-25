import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	protected tableName = 'patissier_profiles'

	async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean('allow_support_access').notNullable().defaultTo(false)
		})
	}

	async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('allow_support_access')
		})
	}
}
