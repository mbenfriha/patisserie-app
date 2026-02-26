import Stripe from 'stripe'
import type PatissierProfile from '#models/patissier_profile'
import type User from '#models/user'
import env from '#start/env'

const PLATFORM_FEE_PERCENT = env.get('STRIPE_PLATFORM_FEE_PERCENT', 5)

export default class StripeService {
	private stripe: Stripe

	constructor() {
		this.stripe = new Stripe(env.get('STRIPE_SECRET_KEY') || '')
	}

	// Customer Management

	async createCustomer(user: User): Promise<string> {
		const customer = await this.stripe.customers.create({
			email: user.email,
			name: user.fullName || undefined,
			metadata: { userId: user.id.toString() },
		})
		return customer.id
	}

	async getOrCreateCustomer(user: User): Promise<string> {
		const customer = await this.stripe.customers.create({
			email: user.email,
			name: user.fullName || undefined,
			metadata: { userId: user.id.toString() },
		})
		return customer.id
	}

	// Subscription Management via Checkout Sessions

	async createCheckoutSession(
		customerId: string | null,
		customerEmail: string,
		priceId: string,
		successUrl: string,
		cancelUrl: string,
		userId: string
	): Promise<string> {
		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			mode: 'subscription',
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: successUrl,
			cancel_url: cancelUrl,
			allow_promotion_codes: true,
			subscription_data: {
				metadata: { userId },
			},
			metadata: { userId },
		}

		if (customerId) {
			sessionParams.customer = customerId
		} else {
			sessionParams.customer_email = customerEmail
		}

		const session = await this.stripe.checkout.sessions.create(sessionParams)
		return session.url!
	}

	async getSubscription(subscriptionId: string) {
		return this.stripe.subscriptions.retrieve(subscriptionId)
	}

	async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean = true) {
		if (atPeriodEnd) {
			return this.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
		}
		return this.stripe.subscriptions.cancel(subscriptionId)
	}

	async resumeSubscription(subscriptionId: string) {
		return this.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false })
	}

	async updateSubscriptionPlan(subscriptionId: string, newPriceId: string) {
		const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
		const subscriptionItemId = subscription.items.data[0]?.id

		if (!subscriptionItemId) {
			throw new Error('No subscription item found')
		}

		return this.stripe.subscriptions.update(subscriptionId, {
			items: [{ id: subscriptionItemId, price: newPriceId }],
			proration_behavior: 'create_prorations',
		})
	}

	async createBillingPortalSession(customerId: string, returnUrl: string): Promise<string> {
		const session = await this.stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: returnUrl,
		})
		return session.url
	}

	// Stripe Connect (Patissier Payouts)

	async createConnectAccount(profile: PatissierProfile, email: string): Promise<string> {
		const account = await this.stripe.accounts.create({
			type: 'express',
			country: 'FR',
			email,
			capabilities: {
				card_payments: { requested: true },
				transfers: { requested: true },
			},
			business_type: 'individual',
			metadata: { patissierId: profile.id.toString() },
		})
		return account.id
	}

	async createConnectOnboardingLink(
		accountId: string,
		refreshUrl: string,
		returnUrl: string
	): Promise<string> {
		const accountLink = await this.stripe.accountLinks.create({
			account: accountId,
			refresh_url: refreshUrl,
			return_url: returnUrl,
			type: 'account_onboarding',
		})
		return accountLink.url
	}

	async getConnectAccount(accountId: string) {
		return this.stripe.accounts.retrieve(accountId)
	}

	async requestTransfersCapability(accountId: string) {
		await this.stripe.accounts.update(accountId, {
			capabilities: {
				transfers: { requested: true },
			},
		})
	}

	async getConnectBalance(accountId: string) {
		return this.stripe.balance.retrieve({ stripeAccount: accountId })
	}

	async createConnectLoginLink(accountId: string): Promise<string> {
		const loginLink = await this.stripe.accounts.createLoginLink(accountId)
		return loginLink.url
	}

	// Workshop deposit Checkout (Stripe Connect with platform fee)

	async createWorkshopDepositCheckout(
		amount: number,
		workshopTitle: string,
		bookingId: string,
		clientEmail: string,
		connectedAccountId: string,
		successUrl: string,
		cancelUrl: string
	): Promise<string> {
		const amountInCents = Math.round(amount * 100)
		const platformFeeInCents = Math.round(amountInCents * (PLATFORM_FEE_PERCENT / 100))

		const session = await this.stripe.checkout.sessions.create({
			mode: 'payment',
			customer_email: clientEmail,
			allow_promotion_codes: true,
			line_items: [
				{
					price_data: {
						currency: 'eur',
						product_data: {
							name: `Acompte atelier : ${workshopTitle}`,
						},
						unit_amount: amountInCents,
					},
					quantity: 1,
				},
			],
			payment_intent_data: {
				application_fee_amount: platformFeeInCents,
				transfer_data: {
					destination: connectedAccountId,
				},
				metadata: { booking_id: bookingId },
			},
			success_url: successUrl,
			cancel_url: cancelUrl,
			metadata: { booking_id: bookingId },
		})

		return session.url!
	}

	// Order quote Checkout (Stripe Connect with platform fee)

	async createOrderQuoteCheckout(
		amount: number,
		orderNumber: string,
		orderId: string,
		clientEmail: string,
		connectedAccountId: string,
		successUrl: string,
		cancelUrl: string
	): Promise<string> {
		const amountInCents = Math.round(amount * 100)
		const platformFeeInCents = Math.round(amountInCents * (PLATFORM_FEE_PERCENT / 100))

		const session = await this.stripe.checkout.sessions.create({
			mode: 'payment',
			customer_email: clientEmail,
			allow_promotion_codes: true,
			line_items: [
				{
					price_data: {
						currency: 'eur',
						product_data: {
							name: `Acompte commande #${orderNumber}`,
						},
						unit_amount: amountInCents,
					},
					quantity: 1,
				},
			],
			payment_intent_data: {
				application_fee_amount: platformFeeInCents,
				transfer_data: {
					destination: connectedAccountId,
				},
				metadata: { order_id: orderId },
			},
			success_url: successUrl,
			cancel_url: cancelUrl,
			metadata: { order_id: orderId },
		})

		return session.url!
	}

	// Invoices

	async listInvoices(customerId: string, limit: number = 10) {
		return this.stripe.invoices.list({ customer: customerId, limit })
	}

	// Webhook verification

	constructWebhookEvent(payload: Buffer | string, signature: string, webhookSecret: string) {
		return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret)
	}

	// Price IDs

	getPriceId(plan: 'pro' | 'premium', interval: 'monthly' | 'yearly'): string {
		const priceIds: Record<string, string> = {
			pro_monthly: env.get('STRIPE_PRICE_PRO_MONTHLY', ''),
			pro_yearly: env.get('STRIPE_PRICE_PRO_YEARLY', ''),
			premium_monthly: env.get('STRIPE_PRICE_PREMIUM_MONTHLY', ''),
			premium_yearly: env.get('STRIPE_PRICE_PREMIUM_YEARLY', ''),
		}
		return priceIds[`${plan}_${interval}`]
	}

	getPlanFromPriceId(priceId: string): { plan: 'pro' | 'premium'; interval: 'monthly' | 'yearly' } | null {
		const mapping: Record<string, { plan: 'pro' | 'premium'; interval: 'monthly' | 'yearly' }> = {
			[env.get('STRIPE_PRICE_PRO_MONTHLY', '')]: { plan: 'pro', interval: 'monthly' },
			[env.get('STRIPE_PRICE_PRO_YEARLY', '')]: { plan: 'pro', interval: 'yearly' },
			[env.get('STRIPE_PRICE_PREMIUM_MONTHLY', '')]: { plan: 'premium', interval: 'monthly' },
			[env.get('STRIPE_PRICE_PREMIUM_YEARLY', '')]: { plan: 'premium', interval: 'yearly' },
		}
		return mapping[priceId] || null
	}

	// Utility

	calculatePlatformFee(amount: number): number {
		return Math.round(amount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100
	}

	calculatePatissierPayout(amount: number): number {
		return amount - this.calculatePlatformFee(amount)
	}
}
