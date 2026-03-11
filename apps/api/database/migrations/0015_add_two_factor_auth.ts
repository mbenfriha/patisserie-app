import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	protected tableName = 'users'

	async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string('two_factor_secret').nullable()
			table.boolean('two_factor_enabled').defaultTo(false)
			table.jsonb('two_factor_backup_codes').nullable()
		})
	}

	async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('two_factor_secret')
			table.dropColumn('two_factor_enabled')
			table.dropColumn('two_factor_backup_codes')
		})
	}
}
