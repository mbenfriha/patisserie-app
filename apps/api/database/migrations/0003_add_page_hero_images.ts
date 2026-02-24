import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	protected tableName = 'patissier_profiles'

	async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string('creations_hero_image_url', 500).nullable()
			table.string('workshops_hero_image_url', 500).nullable()
			table.string('products_hero_image_url', 500).nullable()
			table.string('orders_hero_image_url', 500).nullable()
		})
	}

	async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('creations_hero_image_url')
			table.dropColumn('workshops_hero_image_url')
			table.dropColumn('products_hero_image_url')
			table.dropColumn('orders_hero_image_url')
		})
	}
}
