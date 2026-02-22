import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

server.use([() => import('@adonisjs/cors/cors_middleware')])

router.use([
	() => import('@adonisjs/core/bodyparser_middleware'),
	() => import('@adonisjs/session/session_middleware'),
	() => import('@adonisjs/shield/shield_middleware'),
	() => import('@adonisjs/auth/initialize_auth_middleware'),
])

export const middleware = router.named({
	auth: () => import('#middleware/auth_middleware'),
	guest: () => import('#middleware/guest_middleware'),
	patissier: () => import('#middleware/patissier_middleware'),
	client: () => import('#middleware/client_middleware'),
	superadmin: () => import('#middleware/superadmin_middleware'),
	planGuard: () => import('#middleware/plan_guard_middleware'),
	tenantResolver: () => import('#middleware/tenant_resolver_middleware'),
})
