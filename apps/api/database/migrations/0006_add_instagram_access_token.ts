import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	protected tableName = 'patissier_profiles'

	async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string('instagram_access_token', 500).nullable()
		})
	}

	async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('instagram_access_token')
		})
	}
}
