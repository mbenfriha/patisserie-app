import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'
import { auditLogFilterValidator } from '#validators/superadmin_validator'

export default class AuditLogsController {
	async index({ request, response }: HttpContext) {
		const {
			page = 1,
			limit: rawLimit,
			action,
			userId,
			resourceType,
			from,
			to,
		} = await request.validateUsing(auditLogFilterValidator)

		const limit = Math.min(rawLimit || 30, 100)

		const query = AuditLog.query().orderBy('createdAt', 'desc')

		if (action) {
			query.where('action', 'like', `%${action}%`)
		}
		if (userId) {
			query.where('userId', userId)
		}
		if (resourceType) {
			query.where('resourceType', resourceType)
		}
		if (from) {
			query.where('createdAt', '>=', from)
		}
		if (to) {
			query.where('createdAt', '<=', `${to} 23:59:59`)
		}

		const logs = await query.paginate(page, limit)

		return response.ok({
			success: true,
			data: logs.serialize(),
		})
	}
}
