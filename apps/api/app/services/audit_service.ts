import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'

interface AuditOptions {
	action: string
	resourceType?: string
	resourceId?: string
	metadata?: Record<string, unknown>
	userId?: string
}

export default class AuditService {
	static async log(ctx: HttpContext, options: AuditOptions) {
		await AuditLog.create({
			userId: options.userId || ctx.auth?.user?.id || null,
			action: options.action,
			resourceType: options.resourceType || null,
			resourceId: options.resourceId || null,
			metadata: options.metadata || {},
			ipAddress: ctx.request.ip(),
			userAgent: ctx.request.header('user-agent') || null,
		})
	}
}
