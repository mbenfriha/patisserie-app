import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
	vine.object({
		email: vine.string().email().normalizeEmail(),
		password: vine.string().minLength(8).maxLength(128),
		fullName: vine.string().trim().minLength(2).maxLength(100),
		slug: vine
			.string()
			.trim()
			.minLength(2)
			.maxLength(100)
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		businessName: vine.string().trim().minLength(2).maxLength(200),
	})
)

export const loginValidator = vine.compile(
	vine.object({
		email: vine.string().email(),
		password: vine.string(),
	})
)

export const forgotPasswordValidator = vine.compile(
	vine.object({
		email: vine.string().email(),
	})
)

export const resetPasswordValidator = vine.compile(
	vine.object({
		token: vine.string(),
		password: vine.string().minLength(8).maxLength(128),
	})
)

export const changePasswordValidator = vine.compile(
	vine.object({
		currentPassword: vine.string(),
		newPassword: vine.string().minLength(8).maxLength(128),
	})
)
