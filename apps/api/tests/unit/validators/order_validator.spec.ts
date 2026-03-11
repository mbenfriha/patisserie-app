import { test } from '@japa/runner'
import {
	paginationValidator,
	storePatissierOrderValidator,
	quoteOrderValidator,
	sendMessageValidator,
	updateOrderStatusValidator,
} from '#validators/order_validator'

const validUuid = '550e8400-e29b-41d4-a716-446655440000'

test.group('PatissierCreateOrderValidator', () => {
	test('valid catalogue order passes', async ({ assert }) => {
		const data = {
			type: 'catalogue' as const,
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
			items: [{ product_id: validUuid, quantity: 2 }],
		}
		const result = await storePatissierOrderValidator.validate(data)
		assert.equal(result.type, 'catalogue')
		assert.equal(result.clientName, 'John Doe')
		assert.equal(result.clientEmail, 'john@test.com')
		assert.lengthOf(result.items!, 1)
	})

	test('valid custom order passes', async ({ assert }) => {
		const data = {
			type: 'custom' as const,
			clientName: 'Jane Doe',
			clientEmail: 'jane@test.com',
			customType: 'Wedding cake',
			customNbPersonnes: 50,
			customTheme: 'Floral',
			customMessage: 'Please make it elegant',
		}
		const result = await storePatissierOrderValidator.validate(data)
		assert.equal(result.type, 'custom')
		assert.equal(result.customType, 'Wedding cake')
		assert.equal(result.customNbPersonnes, 50)
	})

	test('valid order with all optional fields passes', async ({ assert }) => {
		const data = {
			type: 'catalogue' as const,
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
			clientPhone: '+33612345678',
			deliveryMethod: 'delivery' as const,
			requestedDate: '2026-04-01',
			deliveryAddress: '123 Rue de Paris',
			deliveryNotes: 'Ring the bell',
			patissierNotes: 'VIP client',
			items: [{ product_id: validUuid, quantity: 1, special_instructions: 'No nuts' }],
			total: 45.5,
			paymentStatus: 'pending' as const,
			depositPercent: 30,
		}
		const result = await storePatissierOrderValidator.validate(data)
		assert.equal(result.deliveryMethod, 'delivery')
		assert.equal(result.total, 45.5)
		assert.equal(result.depositPercent, 30)
	})

	test('missing clientName fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientEmail: 'john@test.com',
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('missing clientEmail fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'John Doe',
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('invalid email fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'John Doe',
			clientEmail: 'not-an-email',
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('invalid type fails', async ({ assert }) => {
		const data = {
			type: 'invalid',
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('clientName too short fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'J',
			clientEmail: 'john@test.com',
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('clientName too long fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'A'.repeat(101),
			clientEmail: 'john@test.com',
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('item with invalid product_id fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
			items: [{ product_id: 'not-a-uuid', quantity: 1 }],
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('item with quantity 0 fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
			items: [{ product_id: validUuid, quantity: 0 }],
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('item with quantity over 100 fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
			items: [{ product_id: validUuid, quantity: 101 }],
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('item with decimal quantity fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
			items: [{ product_id: validUuid, quantity: 2.5 }],
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('negative total fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
			total: -10,
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('depositPercent over 100 fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
			depositPercent: 150,
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('invalid paymentStatus fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
			paymentStatus: 'refunded',
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})

	test('invalid deliveryMethod fails', async ({ assert }) => {
		const data = {
			type: 'catalogue',
			clientName: 'John Doe',
			clientEmail: 'john@test.com',
			deliveryMethod: 'drone',
		}
		await assert.rejects(() => storePatissierOrderValidator.validate(data))
	})
})

test.group('UpdateOrderStatusValidator', () => {
	const validStatuses = [
		'pending',
		'confirmed',
		'in_progress',
		'ready',
		'delivered',
		'picked_up',
		'cancelled',
	] as const

	for (const status of validStatuses) {
		test(`valid status "${status}" passes`, async ({ assert }) => {
			const data = { status }
			const result = await updateOrderStatusValidator.validate(data)
			assert.equal(result.status, status)
		})
	}

	test('invalid status fails', async ({ assert }) => {
		const data = { status: 'shipped' }
		await assert.rejects(() => updateOrderStatusValidator.validate(data))
	})

	test('missing status fails', async ({ assert }) => {
		const data = {}
		await assert.rejects(() => updateOrderStatusValidator.validate(data))
	})

	test('cancelled with cancellationReason passes', async ({ assert }) => {
		const data = {
			status: 'cancelled' as const,
			cancellationReason: 'Customer changed their mind',
		}
		const result = await updateOrderStatusValidator.validate(data)
		assert.equal(result.status, 'cancelled')
		assert.equal(result.cancellationReason, 'Customer changed their mind')
	})

	test('cancellationReason too long fails', async ({ assert }) => {
		const data = {
			status: 'cancelled',
			cancellationReason: 'A'.repeat(501),
		}
		await assert.rejects(() => updateOrderStatusValidator.validate(data))
	})

	test('confirmedDate passes', async ({ assert }) => {
		const data = {
			status: 'confirmed' as const,
			confirmedDate: '2026-04-15',
		}
		const result = await updateOrderStatusValidator.validate(data)
		assert.equal(result.confirmedDate, '2026-04-15')
	})
})

test.group('QuoteOrderValidator', () => {
	test('valid quote data passes', async ({ assert }) => {
		const data = {
			quotedPrice: 150.0,
		}
		const result = await quoteOrderValidator.validate(data)
		assert.equal(result.quotedPrice, 150.0)
	})

	test('valid quote with all optional fields passes', async ({ assert }) => {
		const data = {
			quotedPrice: 200,
			responseMessage: 'We can do this for 200 EUR',
			depositPercent: 50,
			confirmedDate: '2026-05-01',
		}
		const result = await quoteOrderValidator.validate(data)
		assert.equal(result.quotedPrice, 200)
		assert.equal(result.depositPercent, 50)
		assert.equal(result.responseMessage, 'We can do this for 200 EUR')
	})

	test('negative price fails', async ({ assert }) => {
		const data = { quotedPrice: -10 }
		await assert.rejects(() => quoteOrderValidator.validate(data))
	})

	test('price zero passes', async ({ assert }) => {
		const data = { quotedPrice: 0 }
		const result = await quoteOrderValidator.validate(data)
		assert.equal(result.quotedPrice, 0)
	})

	test('price over 100000 fails', async ({ assert }) => {
		const data = { quotedPrice: 100001 }
		await assert.rejects(() => quoteOrderValidator.validate(data))
	})

	test('missing quotedPrice fails', async ({ assert }) => {
		const data = {}
		await assert.rejects(() => quoteOrderValidator.validate(data))
	})

	test('responseMessage too long fails', async ({ assert }) => {
		const data = {
			quotedPrice: 100,
			responseMessage: 'A'.repeat(2001),
		}
		await assert.rejects(() => quoteOrderValidator.validate(data))
	})

	test('depositPercent over 100 fails', async ({ assert }) => {
		const data = {
			quotedPrice: 100,
			depositPercent: 101,
		}
		await assert.rejects(() => quoteOrderValidator.validate(data))
	})

	test('negative depositPercent fails', async ({ assert }) => {
		const data = {
			quotedPrice: 100,
			depositPercent: -5,
		}
		await assert.rejects(() => quoteOrderValidator.validate(data))
	})
})

test.group('SendMessageValidator', () => {
	test('valid message passes', async ({ assert }) => {
		const data = { message: 'Hello, is my order ready?' }
		const result = await sendMessageValidator.validate(data)
		assert.equal(result.message, 'Hello, is my order ready?')
	})

	test('message with attachments passes', async ({ assert }) => {
		const data = {
			message: 'See attached photo',
			attachments: [{ url: 'https://example.com/photo.jpg' }],
		}
		const result = await sendMessageValidator.validate(data)
		assert.equal(result.message, 'See attached photo')
	})

	test('empty message fails', async ({ assert }) => {
		const data = { message: '' }
		await assert.rejects(() => sendMessageValidator.validate(data))
	})

	test('whitespace-only message fails', async ({ assert }) => {
		const data = { message: '   ' }
		await assert.rejects(() => sendMessageValidator.validate(data))
	})

	test('too long message fails', async ({ assert }) => {
		const data = { message: 'A'.repeat(5001) }
		await assert.rejects(() => sendMessageValidator.validate(data))
	})

	test('message at max length passes', async ({ assert }) => {
		const data = { message: 'A'.repeat(5000) }
		const result = await sendMessageValidator.validate(data)
		assert.lengthOf(result.message, 5000)
	})

	test('missing message fails', async ({ assert }) => {
		const data = {}
		await assert.rejects(() => sendMessageValidator.validate(data))
	})
})

test.group('PaginationValidator', () => {
	test('valid pagination passes', async ({ assert }) => {
		const data = { page: 1, limit: 10 }
		const result = await paginationValidator.validate(data)
		assert.equal(result.page, 1)
		assert.equal(result.limit, 10)
	})

	test('empty object passes (all optional)', async ({ assert }) => {
		const data = {}
		const result = await paginationValidator.validate(data)
		assert.isUndefined(result.page)
		assert.isUndefined(result.limit)
	})

	test('page 0 fails', async ({ assert }) => {
		const data = { page: 0 }
		await assert.rejects(() => paginationValidator.validate(data))
	})

	test('negative page fails', async ({ assert }) => {
		const data = { page: -1 }
		await assert.rejects(() => paginationValidator.validate(data))
	})

	test('limit 0 fails', async ({ assert }) => {
		const data = { limit: 0 }
		await assert.rejects(() => paginationValidator.validate(data))
	})

	test('limit over 100 fails', async ({ assert }) => {
		const data = { limit: 101 }
		await assert.rejects(() => paginationValidator.validate(data))
	})

	test('limit at max 100 passes', async ({ assert }) => {
		const data = { limit: 100 }
		const result = await paginationValidator.validate(data)
		assert.equal(result.limit, 100)
	})

	test('valid status filter passes', async ({ assert }) => {
		const data = { status: 'pending' }
		const result = await paginationValidator.validate(data)
		assert.equal(result.status, 'pending')
	})

	test('valid type filter catalogue passes', async ({ assert }) => {
		const data = { type: 'catalogue' as const }
		const result = await paginationValidator.validate(data)
		assert.equal(result.type, 'catalogue')
	})

	test('valid type filter custom passes', async ({ assert }) => {
		const data = { type: 'custom' as const }
		const result = await paginationValidator.validate(data)
		assert.equal(result.type, 'custom')
	})

	test('invalid type filter fails', async ({ assert }) => {
		const data = { type: 'invalid' }
		await assert.rejects(() => paginationValidator.validate(data))
	})
})
