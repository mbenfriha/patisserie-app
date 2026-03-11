import vine from '@vinejs/vine'

export const verifyTwoFactorValidator = vine.compile(
	vine.object({
		code: vine
			.string()
			.fixedLength(6)
			.regex(/^\d{6}$/),
	})
)

export const disableTwoFactorValidator = vine.compile(
	vine.object({
		password: vine.string(),
	})
)

export const loginTwoFactorValidator = vine.compile(
	vine.object({
		tempToken: vine.string(),
		code: vine.string().minLength(6).maxLength(8),
	})
)
