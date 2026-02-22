import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import StripeService from '#services/stripe_service'
import env from '#start/env'

export default class IntegrationsController {
	private stripeService = new StripeService()

	async stripeConnect({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		if (profile.stripeAccountId) {
			// Account already exists, check if onboarding is complete
			const account = await this.stripeService.getConnectAccount(profile.stripeAccountId)

			if (account.details_submitted) {
				profile.stripeOnboardingComplete = true
				await profile.save()

				return response.ok({
					success: true,
					data: {
						accountId: profile.stripeAccountId,
						onboardingComplete: true,
					},
				})
			}

			// Onboarding not complete, generate new link
			const onboardingUrl = await this.stripeService.createConnectOnboardingLink(
				profile.stripeAccountId,
				`${env.get('FRONTEND_URL')}/settings?stripe=refresh`,
				`${env.get('FRONTEND_URL')}/settings?stripe=callback`
			)

			return response.ok({
				success: true,
				data: {
					accountId: profile.stripeAccountId,
					onboardingComplete: false,
					onboardingUrl,
				},
			})
		}

		// Create new Connect account
		const accountId = await this.stripeService.createConnectAccount(profile, user.email)

		profile.stripeAccountId = accountId
		await profile.save()

		const onboardingUrl = await this.stripeService.createConnectOnboardingLink(
			accountId,
			`${env.get('FRONTEND_URL')}/settings?stripe=refresh`,
			`${env.get('FRONTEND_URL')}/settings?stripe=callback`
		)

		return response.ok({
			success: true,
			data: {
				accountId,
				onboardingComplete: false,
				onboardingUrl,
			},
		})
	}

	async stripeCallback({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		if (!profile.stripeAccountId) {
			return response.badRequest({
				success: false,
				message: 'No Stripe account found. Please start the onboarding process first.',
			})
		}

		const account = await this.stripeService.getConnectAccount(profile.stripeAccountId)

		if (account.details_submitted) {
			profile.stripeOnboardingComplete = true
			await profile.save()
		}

		return response.ok({
			success: true,
			data: {
				accountId: profile.stripeAccountId,
				onboardingComplete: account.details_submitted ?? false,
				chargesEnabled: account.charges_enabled ?? false,
				payoutsEnabled: account.payouts_enabled ?? false,
			},
		})
	}

	async stripeDashboard({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		if (!profile.stripeAccountId || !profile.stripeOnboardingComplete) {
			return response.badRequest({
				success: false,
				message: 'Stripe onboarding is not complete',
			})
		}

		const loginUrl = await this.stripeService.createConnectLoginLink(profile.stripeAccountId)

		return response.ok({
			success: true,
			data: {
				url: loginUrl,
			},
		})
	}

	async stripeBalance({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		if (!profile.stripeAccountId || !profile.stripeOnboardingComplete) {
			return response.badRequest({
				success: false,
				message: 'Stripe onboarding is not complete',
			})
		}

		const balance = await this.stripeService.getConnectBalance(profile.stripeAccountId)

		return response.ok({
			success: true,
			data: {
				available: balance.available,
				pending: balance.pending,
			},
		})
	}
}
