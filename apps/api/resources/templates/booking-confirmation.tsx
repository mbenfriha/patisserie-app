import { Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './components/email-layout.js'
import { emailTranslations } from './i18n/email-translations.js'

interface BookingConfirmationProps {
	clientName: string
	workshopTitle: string
	patissierName: string
	date: string
	startTime: string
	nbParticipants: number
	totalPrice: string
	depositAmount: string
	remainingAmount: string
}

export default function BookingConfirmationTemplate({
	clientName,
	workshopTitle,
	patissierName,
	date,
	startTime,
	nbParticipants,
	totalPrice,
	depositAmount,
	remainingAmount,
}: BookingConfirmationProps) {
	const t = emailTranslations.bookingConfirmation
	const common = emailTranslations.common

	return (
		<EmailLayout title={t.title} preview={t.preview(workshopTitle)}>
			<Text style={emailStyles.heading}>{t.heading}</Text>

			<Text style={emailStyles.paragraph}>
				{common.greeting} {clientName},
			</Text>

			<Text style={emailStyles.paragraph}>
				Votre réservation pour l'atelier <strong>{workshopTitle}</strong> chez{' '}
				<strong>{patissierName}</strong> est confirmée.
			</Text>

			<Section>
				<table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }} cellPadding="0" cellSpacing="0">
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.workshopLabel}</td>
						<td style={emailStyles.infoValue}>{workshopTitle}</td>
					</tr>
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.dateLabel}</td>
						<td style={emailStyles.infoValue}>{date} à {startTime}</td>
					</tr>
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.participantsLabel}</td>
						<td style={emailStyles.infoValue}>{nbParticipants}</td>
					</tr>
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.totalLabel}</td>
						<td style={emailStyles.infoValue}>{totalPrice}</td>
					</tr>
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.depositLabel}</td>
						<td style={emailStyles.infoValue}>{depositAmount}</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.remainingLabel}</td>
						<td style={emailStyles.infoValue}>{remainingAmount}</td>
					</tr>
				</table>
			</Section>

			<Text style={emailStyles.paragraph}>{t.footer}</Text>

			<Text style={emailStyles.paragraph}>{common.seeYouSoon}</Text>
		</EmailLayout>
	)
}
