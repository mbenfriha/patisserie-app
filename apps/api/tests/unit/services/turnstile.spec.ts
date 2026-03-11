import { test } from '@japa/runner'
import { verifyTurnstile } from '#helpers/verify_turnstile'
import env from '#start/env'

const secretConfigured = !!env.get('TURNSTILE_SECRET_KEY')

test.group('verifyTurnstile', () => {
	test('returns false for null token when secret is configured', async ({ assert }) => {
		const result = await verifyTurnstile(null)
		if (secretConfigured) {
			assert.isFalse(result)
		} else {
			assert.isTrue(result)
		}
	})

	test('rejects invalid token when secret is configured', async ({ assert }) => {
		const result = await verifyTurnstile('invalid-token-value')
		if (secretConfigured) {
			assert.isFalse(result)
		} else {
			assert.isTrue(result)
		}
	})

	test('function accepts optional ip parameter without error', async ({ assert }) => {
		const result = await verifyTurnstile('some-token', '127.0.0.1')
		if (secretConfigured) {
			assert.isFalse(result)
		} else {
			assert.isTrue(result)
		}
	})
})
