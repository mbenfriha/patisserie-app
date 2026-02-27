import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { getActiveProfile } from '#helpers/get_active_profile'

const GRAPH_BASE = 'https://graph.instagram.com'
const GRAPH_API = 'https://graph.instagram.com/v21.0'

export default class InstagramController {
	async authUrl(ctx: HttpContext) {
		const { response } = ctx

		const appId = env.get('INSTAGRAM_APP_ID')
		if (!appId) {
			return response.serviceUnavailable({
				success: false,
				message: 'Instagram integration not configured',
			})
		}

		const frontendUrl = (env.get('FRONTEND_URL') || '').replace(/\/+$/, '')
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
		const frontendUrl = (env.get('FRONTEND_URL') || '').replace(/\/+$/, '')
		const redirectUri = `${frontendUrl}/instagram/callback`

		logger.info({ redirectUri, frontendUrl, codeLength: code.length, profileId: profile.id }, 'Instagram exchange attempt')

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
			const userId = String(tokenData.user_id)

			logger.info({ userId, tokenPrefix: shortLivedToken?.substring(0, 10), profileId: profile.id }, 'Instagram short-lived token obtained')

			// Save user ID
			profile.instagramUserId = userId

			// Step 2: Try to exchange for long-lived token (60 days)
			// Per Meta docs: GET https://graph.instagram.com/access_token
			try {
				const controller = new AbortController()
				const timeout = setTimeout(() => controller.abort(), 10000)

				const longLivedResponse = await fetch(
					`${GRAPH_BASE}/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`,
					{ signal: controller.signal }
				)
				clearTimeout(timeout)

				if (!longLivedResponse.ok) {
					const err = await longLivedResponse.text()
					logger.warn({ err, profileId: profile.id }, 'Instagram long-lived token exchange failed, using short-lived token')
					profile.instagramAccessToken = shortLivedToken
				} else {
					const longLivedData: any = await longLivedResponse.json()
					if (longLivedData.access_token) {
						profile.instagramAccessToken = longLivedData.access_token
						logger.info({ expiresIn: longLivedData.expires_in, profileId: profile.id }, 'Instagram long-lived token obtained')
					} else {
						profile.instagramAccessToken = shortLivedToken
					}
				}
			} catch (llErr: any) {
				logger.warn({ err: llErr?.message || llErr, profileId: profile.id }, 'Instagram long-lived token exchange error, using short-lived token')
				profile.instagramAccessToken = shortLivedToken
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
		profile.instagramUserId = null
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
			const userId = profile.instagramUserId
			if (!userId) {
				return response.ok({
					success: true,
					data: { connected: true, valid: false },
				})
			}

			const res = await fetch(
				`${GRAPH_API}/me?fields=user_id,username&access_token=${profile.instagramAccessToken}`
			)

			if (!res.ok) {
				const errData = await res.text()
				logger.error({ err: errData, profileId: profile.id }, 'Instagram status check failed')
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
				`${GRAPH_BASE}/refresh_access_token` +
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
