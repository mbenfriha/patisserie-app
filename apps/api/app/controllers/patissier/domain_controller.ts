import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import PatissierProfile from '#models/patissier_profile'
import env from '#start/env'
import { getActiveProfile } from '#helpers/get_active_profile'

export default class DomainController {
	async setDomain(ctx: HttpContext) {
		const { request, response } = ctx
		const profile = await getActiveProfile(ctx)

		if (profile.plan !== 'premium') {
			return response.forbidden({
				success: false,
				message: 'Custom domains are only available on the Premium plan',
			})
		}

		const rawDomain = request.input('domain')
		if (!rawDomain) {
			return response.badRequest({ success: false, message: 'Domain is required' })
		}

		// Normalize: lowercase, trim, remove www. prefix
		let domain = rawDomain.toLowerCase().trim().replace(/^www\./, '')

		// Validate: no protocol, no path, just a domain
		if (domain.includes('://') || domain.includes('/') || domain.includes(' ')) {
			return response.badRequest({
				success: false,
				message: 'Invalid domain format. Provide just the domain (e.g. mon-site.com)',
			})
		}

		// Check uniqueness
		const existing = await PatissierProfile.query()
			.where('customDomain', domain)
			.whereNot('id', profile.id)
			.first()

		if (existing) {
			return response.conflict({
				success: false,
				message: 'This domain is already used by another patissier',
			})
		}

		// Add domain to Vercel project
		const vercelToken = env.get('VERCEL_TOKEN')
		const vercelProjectId = env.get('VERCEL_PROJECT_ID')

		if (!vercelToken || !vercelProjectId) {
			return response.serviceUnavailable({
				success: false,
				message: 'Custom domain service is not configured',
			})
		}

		try {
			const teamId = env.get('VERCEL_TEAM_ID')
			const queryParams = teamId ? `?teamId=${teamId}` : ''
			const vercelResponse = await fetch(
				`https://api.vercel.com/v10/projects/${vercelProjectId}/domains${queryParams}`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${vercelToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ name: domain }),
				}
			)

			if (!vercelResponse.ok) {
				const errData: any = await vercelResponse.json()
				logger.error({ err: errData, domain, profileId: profile.id }, 'Vercel add domain failed')
				return response.badRequest({
					success: false,
					message: 'Failed to add domain to hosting provider',
					detail: errData?.error?.message,
				})
			}

			profile.customDomain = domain
			profile.customDomainVerified = false
			await profile.save()

			logger.info({ domain, profileId: profile.id }, 'Custom domain added')

			return response.ok({
				success: true,
				message: 'Domain added successfully',
				data: {
					domain,
					verified: false,
					dns: {
						type: 'CNAME',
						name: domain,
						value: 'cname.vercel-dns.com',
					},
				},
			})
		} catch (err) {
			logger.error({ err, domain, profileId: profile.id }, 'Vercel add domain error')
			return response.internalServerError({
				success: false,
				message: 'Failed to configure custom domain',
			})
		}
	}

	async removeDomain(ctx: HttpContext) {
		const { response } = ctx
		const profile = await getActiveProfile(ctx)

		if (!profile.customDomain) {
			return response.ok({
				success: true,
				message: 'No custom domain to remove',
			})
		}

		const domain = profile.customDomain
		const vercelToken = env.get('VERCEL_TOKEN')
		const vercelProjectId = env.get('VERCEL_PROJECT_ID')

		if (vercelToken && vercelProjectId) {
			try {
				const teamId = env.get('VERCEL_TEAM_ID')
				const queryParams = teamId ? `?teamId=${teamId}` : ''
				const vercelResponse = await fetch(
					`https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}${queryParams}`,
					{
						method: 'DELETE',
						headers: {
							Authorization: `Bearer ${vercelToken}`,
						},
					}
				)

				if (!vercelResponse.ok) {
					const errData: any = await vercelResponse.json()
					logger.error({ err: errData, domain, profileId: profile.id }, 'Vercel remove domain failed')
				}
			} catch (err) {
				logger.error({ err, domain, profileId: profile.id }, 'Vercel remove domain error')
			}
		}

		profile.customDomain = null
		profile.customDomainVerified = false
		await profile.save()

		logger.info({ domain, profileId: profile.id }, 'Custom domain removed')

		return response.ok({
			success: true,
			message: 'Domain removed successfully',
		})
	}

	async verifyDomain(ctx: HttpContext) {
		const { response } = ctx
		const profile = await getActiveProfile(ctx)

		if (!profile.customDomain) {
			return response.badRequest({
				success: false,
				message: 'No custom domain configured',
			})
		}

		const domain = profile.customDomain
		const vercelToken = env.get('VERCEL_TOKEN')
		const vercelProjectId = env.get('VERCEL_PROJECT_ID')

		if (!vercelToken || !vercelProjectId) {
			return response.serviceUnavailable({
				success: false,
				message: 'Custom domain service is not configured',
			})
		}

		try {
			const teamId = env.get('VERCEL_TEAM_ID')
			const queryParams = teamId ? `?teamId=${teamId}` : ''
			const vercelResponse = await fetch(
				`https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}${queryParams}`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${vercelToken}`,
					},
				}
			)

			if (!vercelResponse.ok) {
				const errData: any = await vercelResponse.json()
				logger.error({ err: errData, domain, profileId: profile.id }, 'Vercel verify domain failed')
				return response.badRequest({
					success: false,
					message: 'Failed to check domain status',
				})
			}

			const data: any = await vercelResponse.json()
			const isVerified = data.verified === true
			const isConfigured = !data.misconfigured

			profile.customDomainVerified = isVerified && isConfigured
			await profile.save()

			let status: 'verified' | 'misconfigured' | 'pending' = 'pending'
			if (isVerified && isConfigured) {
				status = 'verified'
			} else if (!isConfigured) {
				status = 'misconfigured'
			}

			return response.ok({
				success: true,
				data: {
					domain,
					status,
					verified: isVerified,
					configured: isConfigured,
					verification: data.verification || null,
				},
			})
		} catch (err) {
			logger.error({ err, domain, profileId: profile.id }, 'Vercel verify domain error')
			return response.internalServerError({
				success: false,
				message: 'Failed to verify domain',
			})
		}
	}
}
