import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	async up() {
		// Add column only if it doesn't exist
		await this.db.rawQuery(`
			ALTER TABLE workshops ADD COLUMN IF NOT EXISTS slug varchar(250)
		`)

		// Generate slugs for existing workshops that don't have one
		const workshops = await this.db
			.from('workshops')
			.whereNull('slug')
			.select('id', 'title', 'patissier_id')

		for (const workshop of workshops) {
			const baseSlug = workshop.title
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '')

			let slug = baseSlug
			let counter = 1
			while (true) {
				const existing = await this.db
					.from('workshops')
					.where('patissier_id', workshop.patissier_id)
					.where('slug', slug)
					.whereNot('id', workshop.id)
					.first()
				if (!existing) break
				slug = `${baseSlug}-${counter++}`
			}

			await this.db.from('workshops').where('id', workshop.id).update({ slug })
		}

		// Make it not nullable
		await this.db.rawQuery(`
			ALTER TABLE workshops ALTER COLUMN slug SET NOT NULL
		`)

		// Add unique index if it doesn't exist
		await this.db.rawQuery(`
			CREATE UNIQUE INDEX IF NOT EXISTS workshops_patissier_id_slug_unique
			ON workshops (patissier_id, slug)
		`)
	}

	async down() {
		await this.schema.alterTable('workshops', (table) => {
			table.dropUnique(['patissier_id', 'slug'])
			table.dropColumn('slug')
		})
	}
}
