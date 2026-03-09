import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	protected tableName = 'orders'

	async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.jsonb('custom_photo_urls').nullable()
		})

		// Migrate existing single photo URL to the new array column
		this.defer(async (db) => {
			await db.rawQuery(`
				UPDATE orders
				SET custom_photo_urls = jsonb_build_array(custom_photo_inspiration_url)
				WHERE custom_photo_inspiration_url IS NOT NULL
			`)
		})

		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('custom_photo_inspiration_url')
		})
	}

	async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string('custom_photo_inspiration_url', 500).nullable()
		})

		this.defer(async (db) => {
			await db.rawQuery(`
				UPDATE orders
				SET custom_photo_inspiration_url = custom_photo_urls->>0
				WHERE custom_photo_urls IS NOT NULL AND jsonb_array_length(custom_photo_urls) > 0
			`)
		})

		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('custom_photo_urls')
		})
	}
}
