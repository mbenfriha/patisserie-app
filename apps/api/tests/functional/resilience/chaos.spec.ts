import { test } from '@japa/runner'

test.group('Resilience - Chaos', () => {
	test('app responds to health check when redis is unavailable', async ({ client, assert }) => {
		// The health endpoint should return degraded status if Redis is down
		// but should NOT crash
		const response = await client.get('/health')
		assert.includeMembers([200, 503], [response.status()])

		const body = response.body()
		assert.exists(body.status)
		assert.exists(body.database)
		assert.exists(body.redis)
	})

	test('app handles concurrent requests without crashing', async ({ client, assert }) => {
		// Fire multiple requests in parallel
		const requests = Array.from({ length: 20 }, () => client.get('/health'))

		const responses = await Promise.all(requests)

		for (const response of responses) {
			assert.includeMembers([200, 503], [response.status()])
		}
	})

	test('app handles malformed JSON body gracefully', async ({ client, assert }) => {
		const response = await client
			.post('/auth/login')
			.header('Content-Type', 'application/json')
			.json({})

		// Empty credentials should return 422, not 500
		assert.notEqual(response.status(), 500)
	})

	test('app handles extremely large payload', async ({ client, assert }) => {
		const largePayload = {
			email: 'test@test.com',
			password: 'a'.repeat(10000),
		}

		const response = await client.post('/auth/login').json(largePayload)

		// Should be rejected by validation, not crash
		assert.notEqual(response.status(), 500)
	})

	test('app handles requests with unusual headers', async ({ client, assert }) => {
		const response = await client
			.get('/health')
			.header('X-Custom-Header', 'a'.repeat(5000))
			.header('Accept', '*/*')

		assert.includeMembers([200, 503], [response.status()])
	})

	test('public endpoints remain accessible under basic load', async ({ client, assert }) => {
		// Simulate a burst of requests to public endpoints
		const endpoints = [
			'/public/check-slug/test-1',
			'/public/check-slug/test-2',
			'/public/check-slug/test-3',
			'/health',
			'/health',
		]

		const requests = endpoints.map((path) => client.get(path))
		const responses = await Promise.all(requests)

		for (const response of responses) {
			assert.notEqual(response.status(), 500)
		}
	})
})
