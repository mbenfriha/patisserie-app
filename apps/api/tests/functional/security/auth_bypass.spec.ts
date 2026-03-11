import { test } from '@japa/runner'

test.group('Security - Auth Bypass', () => {
	test('rejects unauthenticated access to patissier routes', async ({ client }) => {
		const routes = [
			{ method: 'get' as const, path: '/patissier/profile' },
			{ method: 'get' as const, path: '/patissier/categories' },
			{ method: 'get' as const, path: '/patissier/creations' },
		]

		for (const route of routes) {
			const response = await client[route.method](route.path)
			response.assertStatus(401)
		}
	})

	test('rejects unauthenticated access to superadmin routes', async ({ client }) => {
		const routes = [
			{ method: 'get' as const, path: '/superadmin/users' },
			{ method: 'get' as const, path: '/superadmin/orders' },
			{ method: 'get' as const, path: '/superadmin/stats/dashboard' },
		]

		for (const route of routes) {
			const response = await client[route.method](route.path)
			response.assertStatus(401)
		}
	})

	test('rejects unauthenticated access to billing routes', async ({ client }) => {
		const response = await client.get('/billing/current')
		response.assertStatus(401)
	})

	test('rejects unauthenticated access to notifications', async ({ client }) => {
		const response = await client.get('/notifications')
		response.assertStatus(401)
	})

	test('rejects access with invalid token', async ({ client }) => {
		const response = await client
			.get('/patissier/profile')
			.header('Authorization', 'Bearer invalid_token_here')

		response.assertStatus(401)
	})

	test('allows unauthenticated access to public routes', async ({ client, assert }) => {
		const response = await client.get('/public/check-slug/nonexistent')
		// Should not be 401 — public routes don't require auth
		assert.notEqual(response.status(), 401)
	})

	test('allows unauthenticated access to health check', async ({ client, assert }) => {
		const response = await client.get('/health')
		// Health check is public
		assert.includeMembers([200, 503], [response.status()])
	})
})
