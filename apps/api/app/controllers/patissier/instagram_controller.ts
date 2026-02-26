import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { getActiveProfile } from '#helpers/get_active_profile'

export default class InstagramController {
	async authUrl(ctx: HttpContext) {
		const { request, response } = ctx

		const appId = env.get('INSTAGRAM_APP_ID')
		if (!appId) {
			return response.serviceUnavailable({
				success: false,
				message: 'Instagram integration not configured',
			})
		}

		const frontendUrl = env.get('FRONTEND_URL')
		const redirectUri = `${frontendUrl}/instagram/callback`

		const authUrl =
			`https://www.instagram.com/oauth/authorize` +
			`?enable_fb_login=0` +
			`&force_authentication=1` +
			`&client_id=${appId}` +
			`&redirect_uri=${encodeURIComponent(redirectUri)}` +
			`&response_type=code` +
			`&scope=instagram_business_basic`

		return response.ok({
			success: true,
			data: { url: authUrl },
		})
	}

	async exchangeCode(ctx: HttpContext) {
		const { request, response } = ctx
		const profile = await getActiveProfile(ctx)

		let code = request.input('code')
		if (!code) {
			return response.badRequest({ success: false, message: 'Code is required' })
		}

		// Instagram appends #_ to the code, strip it
		code = code.replace(/#_$/, '').trim()

		const appId = env.get('INSTAGRAM_APP_ID')
		const appSecret = env.get('INSTAGRAM_APP_SECRET')
		const frontendUrl = env.get('FRONTEND_URL')
		const redirectUri = `${frontendUrl}/instagram/callback`

		try {
			// Step 1: Exchange code for short-lived token
			const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					client_id: appId!,
					client_secret: appSecret!,
					grant_type: 'authorization_code',
					redirect_uri: redirectUri,
					code,
				}),
			})

			if (!tokenResponse.ok) {
				const errText = await tokenResponse.text()
				logger.error({ err: errText, redirectUri, profileId: profile.id }, 'Instagram token exchange failed')
				return response.badRequest({ success: false, message: 'Failed to exchange code', detail: errText })
			}

			const tokenData: any = await tokenResponse.json()
			const shortLivedToken = tokenData.access_token

			// Step 2: Exchange for long-lived token (60 days)
			const longLivedResponse = await fetch(
				`https://graph.instagram.com/access_token` +
					`?grant_type=ig_exchange_token` +
					`&client_secret=${appSecret}` +
					`&access_token=${shortLivedToken}`
			)

			if (!longLivedResponse.ok) {
				const err = await longLivedResponse.text()
				logger.error({ err, profileId: profile.id }, 'Instagram long-lived token exchange failed')
				profile.instagramAccessToken = shortLivedToken
			} else {
				const longLivedData: any = await longLivedResponse.json()
				profile.instagramAccessToken = longLivedData.access_token
			}

			await profile.save()

			logger.info({ profileId: profile.id }, 'Instagram connected successfully')
			return response.ok({ success: true, message: 'Instagram connected' })
		} catch (err) {
			logger.error({ err, profileId: profile.id }, 'Instagram OAuth exchange error')
			return response.internalServerError({ success: false, message: 'Failed to connect Instagram' })
		}
	}

	async disconnect(ctx: HttpContext) {
		const { response } = ctx
		const profile = await getActiveProfile(ctx)

		profile.instagramAccessToken = null
		await profile.save()

		return response.ok({
			success: true,
			message: 'Instagram disconnected',
		})
	}

	async status(ctx: HttpContext) {
		const { response } = ctx
		const profile = await getActiveProfile(ctx)

		const connected = !!profile.instagramAccessToken

		if (!connected) {
			return response.ok({
				success: true,
				data: { connected: false },
			})
		}

		// Verify token is still valid by fetching user info
		try {
			const res = await fetch(
				`https://graph.instagram.com/me?fields=id,username&access_token=${profile.instagramAccessToken}`
			)

			if (!res.ok) {
				return response.ok({
					success: true,
					data: { connected: true, valid: false },
				})
			}

			const userData: any = await res.json()
			return response.ok({
				success: true,
				data: {
					connected: true,
					valid: true,
					username: userData.username,
				},
			})
		} catch {
			return response.ok({
				success: true,
				data: { connected: true, valid: false },
			})
		}
	}

	async refreshToken(ctx: HttpContext) {
		const { response } = ctx
		const profile = await getActiveProfile(ctx)

		if (!profile.instagramAccessToken) {
			return response.badRequest({
				success: false,
				message: 'No Instagram token to refresh',
			})
		}

		try {
			const res = await fetch(
				`https://graph.instagram.com/refresh_access_token` +
					`?grant_type=ig_refresh_token` +
					`&access_token=${profile.instagramAccessToken}`
			)

			if (!res.ok) {
				return response.badRequest({
					success: false,
					message: 'Failed to refresh token',
				})
			}

			const data: any = await res.json()
			profile.instagramAccessToken = data.access_token
			await profile.save()

			return response.ok({
				success: true,
				message: 'Token refreshed',
			})
		} catch (err) {
			logger.error({ err, profileId: profile.id }, 'Instagram token refresh failed')
			return response.internalServerError({
				success: false,
				message: 'Failed to refresh token',
			})
		}
	}
}
