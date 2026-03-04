import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import PatissierProfile from '#models/patissier_profile'
import TurnstileService from '#services/turnstile_service'
import VercelService from '#services/vercel_service'
import { getActiveProfile } from '#helpers/get_active_profile'

export default class DomainController {
	private vercel = new VercelService()
	private turnstile = new TurnstileService()

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
		const domain = rawDomain.toLowerCase().trim().replace(/^www\./, '')

		// Validate: no protocol, no path, just a domain
		if (domain.includes('://') || domain.includes('/') || domain.includes(' ')) {
			return response.badRequest({
				success: false,
				message: 'Invalid domain format. Provide just the domain (e.g. mon-site.com)',
			})
		}

		// Block patissio.com subdomains
		if (domain.endsWith('.patissio.com') || domain === 'patissio.com') {
			return response.badRequest({
				success: false,
				message: 'You cannot use a patissio.com domain as a custom domain',
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

		if (!this.vercel.isConfigured) {
			return response.serviceUnavailable({
				success: false,
				message: 'Custom domain service is not configured',
			})
		}

		// Add apex domain
		const result = await this.vercel.addDomain(domain)
		if (!result.success) {
			return response.badRequest({
				success: false,
				message: 'Failed to add domain to hosting provider',
				detail: result.error,
			})
		}

		// Add www subdomain with redirect to apex
		const wwwResult = await this.vercel.addDomain(`www.${domain}`, {
			redirect: domain,
			redirectStatusCode: 301,
		})
		if (!wwwResult.success) {
			logger.warn({ domain, error: wwwResult.error }, 'Failed to add www redirect, continuing without it')
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
				dns: [
					{
						type: 'A',
						name: domain,
						value: '76.76.21.21',
					},
					{
						type: 'CNAME',
						name: `www.${domain}`,
						value: 'cname.vercel-dns.com',
					},
				],
			},
		})
	}

	async removeDomain(ctx: HttpContext) {
		const { response } = ctx
		const profile = await getActiveProfile(ctx)

		if (!profile.customDomain) {
			return response.ok({ success: true, message: 'No custom domain to remove' })
		}

		const domain = profile.customDomain
		await this.vercel.removeDomain(domain)
		await this.vercel.removeDomain(`www.${domain}`)
		await this.turnstile.removeHostname(domain)

		profile.customDomain = null
		profile.customDomainVerified = false
		await profile.save()

		logger.info({ domain, profileId: profile.id }, 'Custom domain removed')

		return response.ok({ success: true, message: 'Domain removed successfully' })
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

		if (!this.vercel.isConfigured) {
			return response.serviceUnavailable({
				success: false,
				message: 'Custom domain service is not configured',
			})
		}

		const domain = profile.customDomain

		// Ensure www redirect exists (handles domains added before this feature)
		await this.vercel.addDomain(`www.${domain}`, {
			redirect: domain,
			redirectStatusCode: 301,
		})

		const config = await this.vercel.getDomainConfig(domain)

		if (!config) {
			return response.badRequest({
				success: false,
				message: 'Failed to check domain status',
			})
		}

		profile.customDomainVerified = config.verified && config.configured
		await profile.save()

		// Add domain to Turnstile when verified
		if (config.verified && config.configured) {
			await this.turnstile.addHostname(domain)
		}

		let status: 'verified' | 'misconfigured' | 'pending' = 'pending'
		if (config.verified && config.configured) {
			status = 'verified'
		} else if (!config.configured) {
			status = 'misconfigured'
		}

		return response.ok({
			success: true,
			data: {
				domain,
				status,
				verified: config.verified,
				configured: config.configured,
				verification: config.verification,
			},
		})
	}
}
