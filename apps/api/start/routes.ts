import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { throttle } from '#middleware/throttle_middleware'

// Health check
router.get('/', async ({ response }) => {
	return response.ok({ status: 'ok', name: 'Patissio API' })
})
router.get('/health', async ({ response }) => {
	return response.ok({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth routes
router
	.group(() => {
		router.post('/register', '#controllers/auth/auth_controller.register').use(throttle('authStrict'))
		router.post('/login', '#controllers/auth/auth_controller.login').use(throttle('authStrict'))
		router.post('/logout', '#controllers/auth/auth_controller.logout').use(middleware.auth())
		router.get('/me', '#controllers/auth/auth_controller.me').use(middleware.auth())
	})
	.prefix('/auth')

// Patissier dashboard routes
router
	.group(() => {
		// Profile
		router.get('/profile', '#controllers/patissier/profile_controller.show')
		router.patch('/profile', '#controllers/patissier/profile_controller.update')
		router.put('/site-design', '#controllers/patissier/profile_controller.updateDesign')
		router.put('/site', '#controllers/patissier/profile_controller.updateSite')
		router.post('/logo', '#controllers/patissier/profile_controller.uploadLogo')
		router.delete('/logo', '#controllers/patissier/profile_controller.deleteLogo')
		router.post('/hero-image', '#controllers/patissier/profile_controller.uploadHeroImage')
		router.delete('/hero-image', '#controllers/patissier/profile_controller.deleteHeroImage')
		router.post('/story-image', '#controllers/patissier/profile_controller.uploadStoryImage')
		router.delete('/story-image', '#controllers/patissier/profile_controller.deleteStoryImage')
		router.post('/page-hero/:page', '#controllers/patissier/profile_controller.uploadPageHeroImage')
		router.delete('/page-hero/:page', '#controllers/patissier/profile_controller.deletePageHeroImage')

		// Categories
		router.get('/categories', '#controllers/patissier/categories_controller.index')
		router.post('/categories', '#controllers/patissier/categories_controller.store')
		router.put('/categories/:id', '#controllers/patissier/categories_controller.update')
		router.delete('/categories/:id', '#controllers/patissier/categories_controller.destroy')
		router.put('/categories/reorder', '#controllers/patissier/categories_controller.reorder')

		// Creations
		router.get('/creations', '#controllers/patissier/creations_controller.index')
		router.post('/creations', '#controllers/patissier/creations_controller.store')
		router.get('/creations/:id', '#controllers/patissier/creations_controller.show')
		router.put('/creations/:id', '#controllers/patissier/creations_controller.update')
		router.delete('/creations/:id', '#controllers/patissier/creations_controller.destroy')
		router.post('/creations/:id/images', '#controllers/patissier/creations_controller.addImage')
		router.put('/creations/:id/images/:idx', '#controllers/patissier/creations_controller.replaceImage')
		router.put('/creations/:id/cover/:idx', '#controllers/patissier/creations_controller.setCover')
		router.delete('/creations/:id/images/:idx', '#controllers/patissier/creations_controller.removeImage')

		// Products (Pro+)
		router
			.group(() => {
				router.get('/', '#controllers/patissier/products_controller.index')
				router.post('/', '#controllers/patissier/products_controller.store')
				router.get('/:id', '#controllers/patissier/products_controller.show')
				router.put('/:id', '#controllers/patissier/products_controller.update')
				router.delete('/:id', '#controllers/patissier/products_controller.destroy')
			})
			.prefix('/products')
			.use(middleware.planGuard({ minPlan: 'pro' }))

		// Workshops (Pro+)
		router
			.group(() => {
				router.get('/', '#controllers/patissier/workshops_controller.index')
				router.post('/', '#controllers/patissier/workshops_controller.store')
				router.get('/:id', '#controllers/patissier/workshops_controller.show')
				router.put('/:id', '#controllers/patissier/workshops_controller.update')
				router.delete('/:id', '#controllers/patissier/workshops_controller.destroy')
				router.put('/:id/status', '#controllers/patissier/workshops_controller.updateStatus')
				router.post('/:id/illustration', '#controllers/patissier/workshops_controller.uploadIllustration')
				router.delete('/:id/illustration', '#controllers/patissier/workshops_controller.deleteIllustration')
				router.get('/:id/bookings', '#controllers/patissier/workshops_controller.bookings')
				router.post('/:id/bookings', '#controllers/patissier/workshops_controller.createBooking')
				router.put(
					'/:id/bookings/:bookingId/status',
					'#controllers/patissier/workshops_controller.updateBookingStatus'
				)
			})
			.prefix('/workshops')
			.use(middleware.planGuard({ minPlan: 'pro' }))

		// Orders (Pro+)
		router
			.group(() => {
				router.get('/', '#controllers/patissier/orders_controller.index')
				router.get('/:id', '#controllers/patissier/orders_controller.show')
				router.put('/:id/status', '#controllers/patissier/orders_controller.updateStatus')
				router.put('/:id/quote', '#controllers/patissier/orders_controller.quote')
				router.get('/:id/messages', '#controllers/patissier/orders_controller.messages')
				router.post('/:id/messages', '#controllers/patissier/orders_controller.sendMessage')
			})
			.prefix('/orders')
			.use(middleware.planGuard({ minPlan: 'pro' }))

		// Instagram OAuth
		router.get('/instagram/auth-url', '#controllers/patissier/instagram_controller.authUrl')
		router.post('/instagram/exchange', '#controllers/patissier/instagram_controller.exchangeCode')
		router.delete('/instagram/disconnect', '#controllers/patissier/instagram_controller.disconnect')
		router.get('/instagram/status', '#controllers/patissier/instagram_controller.status')
		router.post('/instagram/refresh', '#controllers/patissier/instagram_controller.refreshToken')

		// Custom domain (Premium)
		router.put('/domain', '#controllers/patissier/domain_controller.setDomain')
		router.delete('/domain', '#controllers/patissier/domain_controller.removeDomain')
		router.get('/domain/verify', '#controllers/patissier/domain_controller.verifyDomain')

		// Stripe Connect
		router.post('/integrations/stripe/connect', '#controllers/patissier/integrations_controller.stripeConnect')
		router.get('/integrations/stripe/callback', '#controllers/patissier/integrations_controller.stripeCallback')
		router.get('/integrations/stripe/dashboard', '#controllers/patissier/integrations_controller.stripeDashboard')
		router.get('/integrations/stripe/balance', '#controllers/patissier/integrations_controller.stripeBalance')

		// Stats
		router.get('/stats', '#controllers/patissier/stats_controller.index')
	})
	.prefix('/patissier')
	.use([throttle('api'), middleware.auth(), middleware.patissier()])

// Billing routes
router
	.group(() => {
		router.get('/plans', '#controllers/billing_controller.plans')
		router.get('/current', '#controllers/billing_controller.current')
		router.post('/subscribe', '#controllers/billing_controller.subscribe')
		router.post('/cancel', '#controllers/billing_controller.cancel')
		router.post('/resume', '#controllers/billing_controller.resume')
		router.get('/invoices', '#controllers/billing_controller.invoices')
		router.post('/portal', '#controllers/billing_controller.portal')
	})
	.prefix('/billing')
	.use([throttle('api'), middleware.auth()])

// Client routes
router
	.group(() => {
		router.post('/orders', '#controllers/client/orders_controller.store')
		router.get('/orders/:orderNumber', '#controllers/client/orders_controller.show')
		router.get('/orders/:orderNumber/messages', '#controllers/client/orders_controller.messages')
		router.post('/orders/:orderNumber/messages', '#controllers/client/orders_controller.sendMessage')
		router.post('/workshops/:id/book', '#controllers/client/bookings_controller.store')
		router.get('/bookings/:id', '#controllers/client/bookings_controller.show')
		router.put('/bookings/:id/cancel', '#controllers/client/bookings_controller.cancel')
	})
	.prefix('/client')
	.use([throttle('api')])

// Public routes (site vitrine)
router
	.group(() => {
		router.get('/check-slug/:slug', '#controllers/public_controller.checkSlug')
		router.get('/domain/:domain', '#controllers/public_controller.profileByDomain')
		router.get('/:slug', '#controllers/public_controller.profile')
		router.get('/:slug/categories', '#controllers/public_controller.categories')
		router.get('/:slug/creations', '#controllers/public_controller.creations')
		router.get('/:slug/creations/:creationSlug', '#controllers/public_controller.creationDetail')
		router.get('/:slug/products', '#controllers/public_controller.products')
		router.get('/:slug/workshops', '#controllers/public_controller.workshops')
		router.get('/:slug/workshops/:workshopSlug', '#controllers/public_controller.workshopDetail')
		router.get('/:slug/instagram-feed', '#controllers/public_controller.instagramFeed')
	})
	.prefix('/public')
	.use([throttle('global')])

// Superadmin routes
router
	.group(() => {
		router.get('/stats/dashboard', '#controllers/superadmin/stats_controller.dashboard')
		router.get('/stats/revenue', '#controllers/superadmin/stats_controller.revenue')
		router.get('/stats/user-growth', '#controllers/superadmin/stats_controller.userGrowth')
		router.get('/users', '#controllers/superadmin/users_controller.index')
		router.get('/users/:id', '#controllers/superadmin/users_controller.show')
		router.post('/users/:id/suspend', '#controllers/superadmin/users_controller.suspend')
		router.post('/users/:id/unsuspend', '#controllers/superadmin/users_controller.unsuspend')
		router.get('/patissiers', '#controllers/superadmin/users_controller.patissiers')
		router.get('/orders', '#controllers/superadmin/orders_controller.index')
		router.get('/workshops', '#controllers/superadmin/workshops_controller.index')
		router.get('/subscriptions', '#controllers/superadmin/subscriptions_controller.index')
	})
	.prefix('/superadmin')
	.use([throttle('api'), middleware.auth(), middleware.superadmin()])

// Notifications
router
	.group(() => {
		router.get('/', '#controllers/notifications_controller.index')
		router.get('/unread-count', '#controllers/notifications_controller.unreadCount')
		router.put('/:id/read', '#controllers/notifications_controller.markRead')
		router.put('/read-all', '#controllers/notifications_controller.markAllRead')
	})
	.prefix('/notifications')
	.use([throttle('api'), middleware.auth()])

// Webhooks
router
	.post('/webhooks/stripe', '#controllers/webhooks/stripe_controller.handle')
	.use(throttle('webhooks'))
