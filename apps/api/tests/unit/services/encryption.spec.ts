import encryption from '@adonisjs/core/services/encryption'
import { test } from '@japa/runner'
import fc from 'fast-check'

test.group('Encryption - Property-based', () => {
	test('encrypt/decrypt roundtrip preserves original string', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.string({ minLength: 1, maxLength: 500 }), async (plaintext) => {
				const encrypted = encryption.encrypt(plaintext)
				const decrypted = encryption.decrypt(encrypted)
				assert.equal(decrypted, plaintext)
			}),
			{ numRuns: 100 }
		)
	})

	test('encrypted value is different from plaintext', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.string({ minLength: 1, maxLength: 200 }), async (plaintext) => {
				const encrypted = encryption.encrypt(plaintext)
				assert.notEqual(encrypted, plaintext)
			}),
			{ numRuns: 50 }
		)
	})

	test('each encryption produces a unique ciphertext', async ({ assert }) => {
		const plaintext = 'test-value'
		const encrypted1 = encryption.encrypt(plaintext)
		const encrypted2 = encryption.encrypt(plaintext)
		// AES-256-GCM uses a random IV, so encryptions differ
		assert.notEqual(encrypted1, encrypted2)
		// But both decrypt to the same value
		assert.equal(encryption.decrypt(encrypted1), plaintext)
		assert.equal(encryption.decrypt(encrypted2), plaintext)
	})

	test('decrypt returns null for tampered ciphertext', async ({ assert }) => {
		const encrypted = encryption.encrypt('hello')
		const tampered = `${encrypted}x`
		const result = encryption.decrypt(tampered)
		assert.isNull(result)
	})

	test('decrypt returns null for random string', async ({ assert }) => {
		const result = encryption.decrypt('definitely-not-valid-ciphertext')
		assert.isNull(result)
	})
})
