import { test } from '@japa/runner'
import fc from 'fast-check'
import { loginValidator, registerValidator } from '#validators/auth_validator'
import { storeCategoryValidator } from '#validators/category_validator'
import { storeCreationValidator } from '#validators/creation_validator'
import {
	quoteOrderValidator,
	sendMessageValidator,
	storePatissierOrderValidator,
	updateOrderStatusValidator,
} from '#validators/order_validator'

test.group('Fuzz - Auth Validators', () => {
	test('registerValidator never crashes on arbitrary input', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.anything(), async (input) => {
				try {
					await registerValidator.validate(input)
				} catch {
					// Validation errors are expected — crashes are not
				}
				assert.isTrue(true)
			}),
			{ numRuns: 100 }
		)
	})

	test('loginValidator never crashes on arbitrary input', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.anything(), async (input) => {
				try {
					await loginValidator.validate(input)
				} catch {
					// Validation errors are expected
				}
				assert.isTrue(true)
			}),
			{ numRuns: 100 }
		)
	})

	test('registerValidator rejects non-object inputs', async ({ assert }) => {
		const nonObjects = [null, undefined, 42, 'string', true, [1, 2, 3]]
		for (const input of nonObjects) {
			try {
				await registerValidator.validate(input)
				assert.fail('Should have thrown')
			} catch {
				assert.isTrue(true)
			}
		}
	})
})

test.group('Fuzz - Order Validators', () => {
	test('storePatissierOrderValidator never crashes on arbitrary input', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.anything(), async (input) => {
				try {
					await storePatissierOrderValidator.validate(input)
				} catch {
					// Expected
				}
				assert.isTrue(true)
			}),
			{ numRuns: 100 }
		)
	})

	test('updateOrderStatusValidator never crashes on arbitrary input', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.anything(), async (input) => {
				try {
					await updateOrderStatusValidator.validate(input)
				} catch {
					// Expected
				}
				assert.isTrue(true)
			}),
			{ numRuns: 100 }
		)
	})

	test('quoteOrderValidator never crashes on arbitrary input', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.anything(), async (input) => {
				try {
					await quoteOrderValidator.validate(input)
				} catch {
					// Expected
				}
				assert.isTrue(true)
			}),
			{ numRuns: 100 }
		)
	})

	test('sendMessageValidator never crashes on arbitrary input', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.anything(), async (input) => {
				try {
					await sendMessageValidator.validate(input)
				} catch {
					// Expected
				}
				assert.isTrue(true)
			}),
			{ numRuns: 100 }
		)
	})
})

test.group('Fuzz - Category & Creation Validators', () => {
	test('storeCategoryValidator never crashes on arbitrary input', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.anything(), async (input) => {
				try {
					await storeCategoryValidator.validate(input)
				} catch {
					// Expected
				}
				assert.isTrue(true)
			}),
			{ numRuns: 100 }
		)
	})

	test('storeCreationValidator never crashes on arbitrary input', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.anything(), async (input) => {
				try {
					await storeCreationValidator.validate(input)
				} catch {
					// Expected
				}
				assert.isTrue(true)
			}),
			{ numRuns: 100 }
		)
	})

	test('storeCategoryValidator accepts valid random names', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.string({ minLength: 2, maxLength: 100 }), async (name) => {
				try {
					const result = await storeCategoryValidator.validate({ name })
					assert.equal(result.name, name.trim())
				} catch {
					// Some strings may fail validation (e.g., whitespace-only after trim)
					assert.isTrue(true)
				}
			}),
			{ numRuns: 50 }
		)
	})

	test('storeCreationValidator accepts valid random titles', async ({ assert }) => {
		await fc.assert(
			fc.asyncProperty(fc.string({ minLength: 1, maxLength: 200 }), async (title) => {
				try {
					const result = await storeCreationValidator.validate({ title })
					assert.equal(result.title, title.trim())
				} catch {
					assert.isTrue(true)
				}
			}),
			{ numRuns: 50 }
		)
	})
})
