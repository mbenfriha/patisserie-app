import env from '#start/env'

export async function verifyTurnstile(token: string | null, ip?: string): Promise<boolean> {
	const secret = env.get('TURNSTILE_SECRET_KEY')
	if (!secret) return true // Skip verification if not configured

	if (!token) return false

	const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			secret,
			response: token,
			...(ip ? { remoteip: ip } : {}),
		}),
	})

	const data = (await response.json()) as { success: boolean }
	return data.success === true
}
