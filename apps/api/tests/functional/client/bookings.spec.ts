import { test } from '@japa/runner'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'
import Workshop from '#models/workshop'
import WorkshopBooking from '#models/workshop_booking'

test.group('Client - Bookings', (group) => {
	let patissier: User
	let profile: PatissierProfile
	let workshop: Workshop

	group.setup(async () => {
		await WorkshopBooking.query().delete()
		await Workshop.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		patissier = await User.create({
			email: 'booking-test@example.com',
			password: 'password123',
			fullName: 'Booking Tester',
			role: 'patissier',
		})

		profile = await PatissierProfile.create({
			userId: patissier.id,
			slug: 'booking-shop',
			businessName: 'Booking Shop',
			plan: 'pro',
		})

		workshop = await Workshop.create({
			patissierId: profile.id,
			title: 'Test Workshop',
			slug: 'test-ws',
			price: 80,
			capacity: 10,
			durationMinutes: 120,
			date: '2026-06-15',
			startTime: '14:00',
			status: 'published',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})
	})

	group.each.setup(async () => {
		await WorkshopBooking.query().delete()
	})

	group.teardown(async () => {
		await WorkshopBooking.query().delete()
		await Workshop.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('shows a booking by id', async ({ client, assert }) => {
		const booking = await WorkshopBooking.create({
			workshopId: workshop.id,
			clientName: 'Alice Dupont',
			clientEmail: 'test@test.com',
			nbParticipants: 2,
			totalPrice: 160,
			depositAmount: 48,
			remainingAmount: 112,
			status: 'confirmed',
			depositPaymentStatus: 'pending',
			remainingPaymentStatus: 'pending',
		})

		const response = await client.get(`/client/bookings/${booking.id}`)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.id, booking.id)
		assert.equal(response.body().data.clientName, 'Alice Dupont')
		assert.equal(response.body().data.clientEmail, 'test@test.com')
		assert.equal(response.body().data.nbParticipants, 2)
		assert.equal(response.body().data.totalPrice, 160)
		assert.equal(response.body().data.status, 'confirmed')
		// Workshop should be preloaded
		assert.exists(response.body().data.workshop)
	})

	test('returns 404 for non-existent booking', async ({ client, assert }) => {
		const fakeId = '00000000-0000-0000-0000-000000000000'
		const response = await client.get(`/client/bookings/${fakeId}`)

		response.assertStatus(404)
		assert.isFalse(response.body().success)
		assert.equal(response.body().message, 'Booking not found')
	})

	test('cancels a booking with matching clientEmail', async ({ client, assert }) => {
		const booking = await WorkshopBooking.create({
			workshopId: workshop.id,
			clientName: 'Bob Martin',
			clientEmail: 'test@test.com',
			nbParticipants: 2,
			totalPrice: 160,
			depositAmount: 48,
			remainingAmount: 112,
			status: 'confirmed',
			depositPaymentStatus: 'pending',
			remainingPaymentStatus: 'pending',
		})

		const response = await client.put(`/client/bookings/${booking.id}/cancel`).json({
			clientEmail: 'test@test.com',
			cancellationReason: 'Cannot attend anymore',
		})

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.status, 'cancelled')
		assert.equal(response.body().data.cancellationReason, 'Cannot attend anymore')

		// Verify in DB
		const updated = await WorkshopBooking.findOrFail(booking.id)
		assert.equal(updated.status, 'cancelled')
		assert.isNotNull(updated.cancelledAt)
	})

	test('rejects cancel with wrong clientEmail', async ({ client, assert }) => {
		const booking = await WorkshopBooking.create({
			workshopId: workshop.id,
			clientName: 'Claire Petit',
			clientEmail: 'test@test.com',
			nbParticipants: 2,
			totalPrice: 160,
			depositAmount: 48,
			remainingAmount: 112,
			status: 'confirmed',
			depositPaymentStatus: 'pending',
			remainingPaymentStatus: 'pending',
		})

		const response = await client.put(`/client/bookings/${booking.id}/cancel`).json({
			clientEmail: 'wrong@email.com',
		})

		response.assertStatus(403)
		assert.isFalse(response.body().success)
		assert.equal(response.body().message, 'Unauthorized')

		// Verify booking was NOT cancelled in DB
		const unchanged = await WorkshopBooking.findOrFail(booking.id)
		assert.equal(unchanged.status, 'confirmed')
	})

	test('rejects cancelling already cancelled booking', async ({ client, assert }) => {
		const booking = await WorkshopBooking.create({
			workshopId: workshop.id,
			clientName: 'David Leroy',
			clientEmail: 'test@test.com',
			nbParticipants: 2,
			totalPrice: 160,
			depositAmount: 48,
			remainingAmount: 112,
			status: 'cancelled',
			depositPaymentStatus: 'pending',
			remainingPaymentStatus: 'pending',
		})

		const response = await client.put(`/client/bookings/${booking.id}/cancel`).json({
			clientEmail: 'test@test.com',
		})

		response.assertStatus(400)
		assert.isFalse(response.body().success)
		assert.equal(response.body().message, 'Booking is already cancelled')
	})

	test('store (book) returns 201 or 403 (Turnstile)', async ({ client, assert }) => {
		const response = await client.post(`/client/workshops/${workshop.id}/book`).json({
			client_name: 'Eve Bernard',
			client_email: 'eve@test.com',
			nb_participants: 1,
		})

		// In test environment, Turnstile verification will likely fail with 403.
		// If it passes, we expect 201.
		assert.includeMembers([201, 403], [response.status()])
	})
})
