import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
	protected tableName = 'audit_logs'

	async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
			table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
			table.string('action', 100).notNullable().index()
			table.string('resource_type', 50).nullable()
			table.uuid('resource_id').nullable()
			table.jsonb('metadata').defaultTo('{}')
			table.string('ip_address', 45).nullable()
			table.text('user_agent').nullable()
			table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
		})

		this.schema.raw('CREATE INDEX idx_audit_logs_user ON audit_logs (user_id, created_at DESC)')
		this.schema.raw('CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id)')
	}

	async down() {
		this.schema.dropTable(this.tableName)
	}
}
