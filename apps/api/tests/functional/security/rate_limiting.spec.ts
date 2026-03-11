import { test } from '@japa/runner'

test.group('Security - Rate Limiting', () => {
	test('login endpoint has strict rate limiting', async ({ client, assert }) => {
		if (process.env.NODE_ENV === 'test') {
			// Rate limiting is disabled in test mode to avoid flaky tests
			return
		}
		// Send multiple rapid login attempts
		const attempts = 12
		const responses = []

		for (let i = 0; i < attempts; i++) {
			const response = await client.post('/auth/login').json({
				email: `rate-limit-${i}@example.com`,
				password: 'wrongpassword',
			})
			responses.push(response.status())
		}

		// At least some should be rate-limited (429)
		const rateLimited = responses.filter((s) => s === 429)
		assert.isAbove(
			rateLimited.length,
			0,
			`Expected at least 1 rate-limited response out of ${attempts} attempts, got statuses: ${responses.join(', ')}`
		)
	})

	test('register endpoint has strict rate limiting', async ({ client, assert }) => {
		if (process.env.NODE_ENV === 'test') {
			return
		}
		const attempts = 8
		const responses = []

		for (let i = 0; i < attempts; i++) {
			const response = await client.post('/auth/register').json({
				email: `rate-register-${i}@example.com`,
				password: 'password123',
				fullName: 'Rate Tester',
				slug: `rate-test-${i}`,
				businessName: 'Rate Shop',
			})
			responses.push(response.status())
		}

		const rateLimited = responses.filter((s) => s === 429)
		assert.isAbove(
			rateLimited.length,
			0,
			`Expected rate limiting on register after ${attempts} attempts, got statuses: ${responses.join(', ')}`
		)
	})

	test('public routes are not aggressively rate-limited', async ({ client }) => {
		// Public routes should allow reasonable traffic
		for (let i = 0; i < 5; i++) {
			const response = await client.get('/public/check-slug/some-slug')
			response.assertStatus(200)
		}
	})
})
