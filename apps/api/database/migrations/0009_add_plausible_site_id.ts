import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	protected tableName = 'patissier_profiles'

	async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string('plausible_site_id', 255).nullable()
		})
	}

	async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('plausible_site_id')
		})
	}
}
