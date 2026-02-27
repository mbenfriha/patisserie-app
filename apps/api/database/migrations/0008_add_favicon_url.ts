import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	protected tableName = 'patissier_profiles'

	async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string('favicon_url').nullable()
		})
	}

	async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('favicon_url')
		})
	}
}
