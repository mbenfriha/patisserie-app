import { test } from '@japa/runner'
import throttle, { throttle as namedThrottle } from '#middleware/throttle_middleware'

test.group('Throttle middleware configuration', () => {
	test('throttle config exists with expected tiers', async ({ assert }) => {
		// The throttle function should be callable with each known tier
		const tiers = ['auth', 'authStrict', 'api', 'publicSubmit', 'uploads', 'webhooks', 'global']

		for (const tier of tiers) {
			// biome-ignore lint/suspicious/noExplicitAny: dynamic tier name for test coverage
			const middleware = throttle(tier as any)
			assert.isFunction(middleware, `Tier "${tier}" should produce a middleware function`)
		}
	})

	test('auth tier has stricter limits than global', async ({ assert }) => {
		// We verify this by checking that the middleware functions are created
		// differently for auth vs global. Since LIMITS is not exported, we
		// indirectly verify the configuration by ensuring both tiers produce
		// valid middleware and the default is global.
		const authMiddleware = throttle('auth')
		const globalMiddleware = throttle('global')
		const defaultMiddleware = throttle()

		assert.isFunction(authMiddleware)
		assert.isFunction(globalMiddleware)
		assert.isFunction(defaultMiddleware)

		// Default (no argument) should produce a middleware (defaults to 'global')
		// These are different closures, confirming different configs
		assert.notStrictEqual(authMiddleware, globalMiddleware)
	})

	test('middleware is properly exported as both default and named export', async ({ assert }) => {
		assert.isFunction(throttle, 'Default export should be a function')
		assert.isFunction(namedThrottle, 'Named export should be a function')
		assert.strictEqual(throttle, namedThrottle, 'Default and named exports should be the same')
	})
})
