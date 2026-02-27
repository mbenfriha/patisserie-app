import mail from '@adonisjs/mail/services/main'
import BookingCancellation from '#mails/booking_cancellation'
import BookingConfirmation from '#mails/booking_confirmation'
import ForgotPassword from '#mails/forgot_password'
import NewBookingNotification from '#mails/new_booking_notification'
import OrderConfirmation from '#mails/order_confirmation'
import OrderMessageNotification from '#mails/order_message_notification'
import PaymentConfirmation from '#mails/payment_confirmation'
import VerifyEmail from '#mails/verify_email'
import env from '#start/env'

interface VerificationEmailData {
	email: string
	fullName: string | null
	verificationUrl: string
}

interface OrderConfirmationData {
	clientEmail: string
	clientName: string
	orderNumber: string
	patissierName: string
	total: number | null
	type: 'catalogue' | 'custom'
}

interface BookingConfirmationData {
	clientEmail: string
	clientName: string
	workshopTitle: string
	patissierName: string
	date: string
	startTime: string
	nbParticipants: number
	totalPrice: number
	depositAmount: number
}

interface NewBookingNotificationData {
	patissierEmail: string
	patissierName: string
	clientName: string
	clientEmail: string
	workshopTitle: string
	date: string
	startTime: string
	nbParticipants: number
	depositAmount: number
}

interface BookingCancellationData {
	patissierEmail: string
	patissierName: string
	clientName: string
	workshopTitle: string
	date: string
	nbParticipants: number
	reason: string | null
}

interface PaymentConfirmationData {
	clientEmail: string
	clientName: string
	workshopTitle: string
	patissierName: string
	date: string
	startTime: string
	location: string | null
	durationMinutes: number
	nbParticipants: number
	amountPaid: number
	totalPrice: number
	remainingAmount: number
}

interface OrderMessageNotificationData {
	recipientEmail: string
	recipientName: string
	senderName: string
	orderNumber: string
	messagePreview: string
}

interface StatusUpdateData {
	email: string
	recipientName: string
	subject: string
	title: string
	body: string
	actionUrl?: string
	actionLabel?: string
}

export default class EmailService {
	private appName = env.get('APP_NAME')

	async sendVerificationEmail(data: VerificationEmailData): Promise<void> {
		await mail.send(new VerifyEmail(data.email, data.fullName, data.verificationUrl))
	}

	async sendOrderConfirmation(data: OrderConfirmationData): Promise<void> {
		await mail.send(
			new OrderConfirmation(data.clientEmail, {
				clientName: data.clientName,
				orderNumber: data.orderNumber,
				patissierName: data.patissierName,
				total: data.total,
				type: data.type,
			})
		)
	}

	async sendBookingConfirmation(data: BookingConfirmationData): Promise<void> {
		await mail.send(
			new BookingConfirmation(data.clientEmail, {
				clientName: data.clientName,
				workshopTitle: data.workshopTitle,
				patissierName: data.patissierName,
				date: data.date,
				startTime: data.startTime,
				nbParticipants: data.nbParticipants,
				totalPrice: data.totalPrice,
				depositAmount: data.depositAmount,
			})
		)
	}

	async sendPaymentConfirmation(data: PaymentConfirmationData): Promise<void> {
		await mail.send(
			new PaymentConfirmation(data.clientEmail, {
				clientName: data.clientName,
				workshopTitle: data.workshopTitle,
				patissierName: data.patissierName,
				date: data.date,
				startTime: data.startTime,
				location: data.location,
				durationMinutes: data.durationMinutes,
				nbParticipants: data.nbParticipants,
				amountPaid: data.amountPaid,
				totalPrice: data.totalPrice,
				remainingAmount: data.remainingAmount,
			})
		)
	}

	async sendNewBookingNotification(data: NewBookingNotificationData): Promise<void> {
		await mail.send(
			new NewBookingNotification(data.patissierEmail, {
				patissierName: data.patissierName,
				clientName: data.clientName,
				clientEmail: data.clientEmail,
				workshopTitle: data.workshopTitle,
				date: data.date,
				startTime: data.startTime,
				nbParticipants: data.nbParticipants,
				depositAmount: data.depositAmount,
			})
		)
	}

	async sendBookingCancellationNotification(data: BookingCancellationData): Promise<void> {
		await mail.send(
			new BookingCancellation(data.patissierEmail, {
				patissierName: data.patissierName,
				clientName: data.clientName,
				workshopTitle: data.workshopTitle,
				date: data.date,
				nbParticipants: data.nbParticipants,
				reason: data.reason,
			})
		)
	}

	async sendOrderMessageNotification(data: OrderMessageNotificationData): Promise<void> {
		await mail.send(
			new OrderMessageNotification(data.recipientEmail, {
				recipientName: data.recipientName,
				senderName: data.senderName,
				orderNumber: data.orderNumber,
				messagePreview: data.messagePreview,
			})
		)
	}

	async sendForgotPasswordEmail(data: {
		email: string
		fullName: string | null
		resetUrl: string
	}): Promise<void> {
		await mail.send(new ForgotPassword(data.email, data.fullName, data.resetUrl))
	}

	/**
	 * Send a generic status update email (kept as inline HTML for flexibility).
	 */
	async sendStatusUpdate(data: StatusUpdateData): Promise<void> {
		const actionButton =
			data.actionUrl && data.actionLabel
				? `<p style="text-align: center; margin: 30px 0;">
					<a href="${data.actionUrl}" style="background-color: #c2956b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
						${data.actionLabel}
					</a>
				</p>`
				: ''

		await mail.send((message) => {
			message
				.to(data.email)
				.subject(`${data.subject} - ${this.appName}`)
				.html(`
					<!DOCTYPE html>
					<html lang="fr">
					<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
					<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
						<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
							<div style="background-color: #1f2937; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
								<span style="color: #c2956b; font-size: 24px; font-weight: bold; font-family: Georgia, serif;">Patissio</span>
							</div>
							<div style="background-color: #ffffff; padding: 30px;">
								<h1 style="color: #1f2937; font-size: 24px;">Bonjour ${data.recipientName},</h1>
								<h2 style="color: #1f2937;">${data.title}</h2>
								<p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${data.body}</p>
								${actionButton}
							</div>
							<div style="background-color: #faf8f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
								<p style="font-size: 12px; color: #9ca3af;">&copy; ${new Date().getFullYear()} Patissio. Tous droits réservés.</p>
							</div>
						</div>
					</body>
					</html>
				`)
		})
	}
}
