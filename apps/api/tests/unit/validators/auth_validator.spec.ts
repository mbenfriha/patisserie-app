import { test } from '@japa/runner'
import {
	changePasswordValidator,
	forgotPasswordValidator,
	loginValidator,
	registerValidator,
	resetPasswordValidator,
} from '#validators/auth_validator'

test.group('RegisterValidator', () => {
	const validData = {
		email: 'test@test.com',
		password: 'password123',
		fullName: 'Test User',
		slug: 'my-shop',
		businessName: 'My Shop',
	}

	test('valid registration data passes', async ({ assert }) => {
		const result = await registerValidator.validate(validData)
		assert.equal(result.email, 'test@test.com')
		assert.equal(result.password, 'password123')
		assert.equal(result.fullName, 'Test User')
		assert.equal(result.slug, 'my-shop')
		assert.equal(result.businessName, 'My Shop')
	})

	test('normalizes email', async ({ assert }) => {
		const result = await registerValidator.validate({
			...validData,
			email: '  Test@Test.COM  ',
		})
		assert.equal(result.email, 'test@test.com')
	})

	test('trims fullName and businessName', async ({ assert }) => {
		const result = await registerValidator.validate({
			...validData,
			fullName: '  Test User  ',
			businessName: '  My Shop  ',
		})
		assert.equal(result.fullName, 'Test User')
		assert.equal(result.businessName, 'My Shop')
	})

	test('missing email fails', async ({ assert }) => {
		const { email: _, ...data } = validData
		await assert.rejects(() => registerValidator.validate(data))
	})

	test('invalid email fails', async ({ assert }) => {
		await assert.rejects(() => registerValidator.validate({ ...validData, email: 'invalid' }))
	})

	test('empty email fails', async ({ assert }) => {
		await assert.rejects(() => registerValidator.validate({ ...validData, email: '' }))
	})

	test('password too short fails (less than 8 chars)', async ({ assert }) => {
		await assert.rejects(() => registerValidator.validate({ ...validData, password: 'short' }))
	})

	test('password too long fails (more than 128 chars)', async ({ assert }) => {
		await assert.rejects(() =>
			registerValidator.validate({ ...validData, password: 'a'.repeat(129) })
		)
	})

	test('password with exactly 8 chars passes', async ({ assert }) => {
		const result = await registerValidator.validate({
			...validData,
			password: '12345678',
		})
		assert.equal(result.password, '12345678')
	})

	test('slug with special characters fails', async ({ assert }) => {
		await assert.rejects(() => registerValidator.validate({ ...validData, slug: 'my_shop!' }))
	})

	test('slug with uppercase fails', async ({ assert }) => {
		await assert.rejects(() => registerValidator.validate({ ...validData, slug: 'My-Shop' }))
	})

	test('slug with spaces fails', async ({ assert }) => {
		await assert.rejects(() => registerValidator.validate({ ...validData, slug: 'my shop' }))
	})

	test('slug too short fails (less than 3 chars)', async ({ assert }) => {
		await assert.rejects(() => registerValidator.validate({ ...validData, slug: 'ab' }))
	})

	test('slug with numbers and hyphens passes', async ({ assert }) => {
		const result = await registerValidator.validate({
			...validData,
			slug: 'shop-123',
		})
		assert.equal(result.slug, 'shop-123')
	})

	test('fullName too short fails (less than 2 chars)', async ({ assert }) => {
		await assert.rejects(() => registerValidator.validate({ ...validData, fullName: 'A' }))
	})

	test('fullName too long fails (more than 100 chars)', async ({ assert }) => {
		await assert.rejects(() =>
			registerValidator.validate({ ...validData, fullName: 'A'.repeat(101) })
		)
	})

	test('businessName too short fails (less than 2 chars)', async ({ assert }) => {
		await assert.rejects(() => registerValidator.validate({ ...validData, businessName: 'A' }))
	})

	test('businessName too long fails (more than 100 chars)', async ({ assert }) => {
		await assert.rejects(() =>
			registerValidator.validate({ ...validData, businessName: 'A'.repeat(101) })
		)
	})

	test('missing password fails', async ({ assert }) => {
		const { password: _, ...data } = validData
		await assert.rejects(() => registerValidator.validate(data))
	})

	test('missing fullName fails', async ({ assert }) => {
		const { fullName: _, ...data } = validData
		await assert.rejects(() => registerValidator.validate(data))
	})

	test('missing slug fails', async ({ assert }) => {
		const { slug: _, ...data } = validData
		await assert.rejects(() => registerValidator.validate(data))
	})

	test('missing businessName fails', async ({ assert }) => {
		const { businessName: _, ...data } = validData
		await assert.rejects(() => registerValidator.validate(data))
	})
})

test.group('LoginValidator', () => {
	const validData = {
		email: 'test@test.com',
		password: 'mypassword',
	}

	test('valid login data passes', async ({ assert }) => {
		const result = await loginValidator.validate(validData)
		assert.equal(result.email, 'test@test.com')
		assert.equal(result.password, 'mypassword')
	})

	test('normalizes email', async ({ assert }) => {
		const result = await loginValidator.validate({
			...validData,
			email: '  User@Example.COM  ',
		})
		assert.equal(result.email, 'user@example.com')
	})

	test('missing email fails', async ({ assert }) => {
		await assert.rejects(() => loginValidator.validate({ password: 'mypassword' }))
	})

	test('missing password fails', async ({ assert }) => {
		await assert.rejects(() => loginValidator.validate({ email: 'test@test.com' }))
	})

	test('invalid email fails', async ({ assert }) => {
		await assert.rejects(() => loginValidator.validate({ ...validData, email: 'not-an-email' }))
	})

	test('empty password fails', async ({ assert }) => {
		await assert.rejects(() => loginValidator.validate({ ...validData, password: '' }))
	})

	test('password too long fails (more than 128 chars)', async ({ assert }) => {
		await assert.rejects(() => loginValidator.validate({ ...validData, password: 'a'.repeat(129) }))
	})
})

test.group('ForgotPasswordValidator', () => {
	test('valid email passes', async ({ assert }) => {
		const result = await forgotPasswordValidator.validate({ email: 'test@test.com' })
		assert.equal(result.email, 'test@test.com')
	})

	test('normalizes email', async ({ assert }) => {
		const result = await forgotPasswordValidator.validate({
			email: '  Test@Example.COM  ',
		})
		assert.equal(result.email, 'test@example.com')
	})

	test('invalid email fails', async ({ assert }) => {
		await assert.rejects(() => forgotPasswordValidator.validate({ email: 'not-valid' }))
	})

	test('missing email fails', async ({ assert }) => {
		await assert.rejects(() => forgotPasswordValidator.validate({}))
	})

	test('empty email fails', async ({ assert }) => {
		await assert.rejects(() => forgotPasswordValidator.validate({ email: '' }))
	})
})

test.group('ResetPasswordValidator', () => {
	const validData = {
		token: 'some-reset-token',
		password: 'newpassword123',
	}

	test('valid data passes', async ({ assert }) => {
		const result = await resetPasswordValidator.validate(validData)
		assert.equal(result.token, 'some-reset-token')
		assert.equal(result.password, 'newpassword123')
	})

	test('empty token fails', async ({ assert }) => {
		await assert.rejects(() => resetPasswordValidator.validate({ ...validData, token: '' }))
	})

	test('whitespace-only token fails', async ({ assert }) => {
		await assert.rejects(() => resetPasswordValidator.validate({ ...validData, token: '   ' }))
	})

	test('missing token fails', async ({ assert }) => {
		await assert.rejects(() => resetPasswordValidator.validate({ password: 'newpassword123' }))
	})

	test('short password fails (less than 8 chars)', async ({ assert }) => {
		await assert.rejects(() => resetPasswordValidator.validate({ ...validData, password: 'short' }))
	})

	test('password too long fails (more than 128 chars)', async ({ assert }) => {
		await assert.rejects(() =>
			resetPasswordValidator.validate({ ...validData, password: 'a'.repeat(129) })
		)
	})

	test('missing password fails', async ({ assert }) => {
		await assert.rejects(() => resetPasswordValidator.validate({ token: 'some-token' }))
	})
})

test.group('ChangePasswordValidator', () => {
	const validData = {
		currentPassword: 'oldpassword',
		newPassword: 'newpassword123',
	}

	test('valid data passes', async ({ assert }) => {
		const result = await changePasswordValidator.validate(validData)
		assert.equal(result.currentPassword, 'oldpassword')
		assert.equal(result.newPassword, 'newpassword123')
	})

	test('short new password fails (less than 8 chars)', async ({ assert }) => {
		await assert.rejects(() =>
			changePasswordValidator.validate({ ...validData, newPassword: 'short' })
		)
	})

	test('new password too long fails (more than 128 chars)', async ({ assert }) => {
		await assert.rejects(() =>
			changePasswordValidator.validate({
				...validData,
				newPassword: 'a'.repeat(129),
			})
		)
	})

	test('empty current password fails', async ({ assert }) => {
		await assert.rejects(() =>
			changePasswordValidator.validate({ ...validData, currentPassword: '' })
		)
	})

	test('current password too long fails (more than 128 chars)', async ({ assert }) => {
		await assert.rejects(() =>
			changePasswordValidator.validate({
				...validData,
				currentPassword: 'a'.repeat(129),
			})
		)
	})

	test('missing currentPassword fails', async ({ assert }) => {
		await assert.rejects(() => changePasswordValidator.validate({ newPassword: 'newpassword123' }))
	})

	test('missing newPassword fails', async ({ assert }) => {
		await assert.rejects(() => changePasswordValidator.validate({ currentPassword: 'oldpassword' }))
	})

	test('new password with exactly 8 chars passes', async ({ assert }) => {
		const result = await changePasswordValidator.validate({
			...validData,
			newPassword: '12345678',
		})
		assert.equal(result.newPassword, '12345678')
	})
})
