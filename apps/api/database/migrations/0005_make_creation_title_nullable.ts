import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	async up() {
		this.schema.alterTable('creations', (table) => {
			table.string('title', 200).nullable().alter()
		})
	}

	async down() {
		this.schema.alterTable('creations', (table) => {
			table.string('title', 200).notNullable().alter()
		})
	}
}
