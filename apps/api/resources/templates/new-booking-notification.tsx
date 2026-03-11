import { Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './components/email-layout.js'
import { emailTranslations } from './i18n/email-translations.js'

interface NewBookingNotificationProps {
	patissierName: string
	clientName: string
	clientEmail: string
	workshopTitle: string
	date: string
	startTime: string
	nbParticipants: number
	depositAmount: string
}

export default function NewBookingNotificationTemplate({
	patissierName,
	clientName,
	clientEmail,
	workshopTitle,
	date,
	startTime,
	nbParticipants,
	depositAmount,
}: NewBookingNotificationProps) {
	const t = emailTranslations.newBookingNotification
	const common = emailTranslations.common

	return (
		<EmailLayout title={t.title} preview={t.preview(workshopTitle)}>
			<Text style={emailStyles.heading}>{t.heading}</Text>

			<Text style={emailStyles.paragraph}>
				{common.greeting} {patissierName},
			</Text>

			<Text style={emailStyles.paragraph}>{t.body(workshopTitle)}</Text>

			<Section>
				<table style={emailStyles.infoTable} cellPadding="0" cellSpacing="0">
					<tr>
						<td style={emailStyles.infoRow}>{t.clientLabel}</td>
						<td style={emailStyles.infoValue}>
							{clientName} ({clientEmail})
						</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.dateLabel}</td>
						<td style={emailStyles.infoValue}>
							{date} à {startTime}
						</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.participantsLabel}</td>
						<td style={emailStyles.infoValue}>{nbParticipants}</td>
					</tr>
					<tr>
						<td style={{ ...emailStyles.infoRow, borderBottom: 'none' }}>{t.depositLabel}</td>
						<td style={{ ...emailStyles.infoValue, borderBottom: 'none' }}>{depositAmount}</td>
					</tr>
				</table>
			</Section>

			<Text style={emailStyles.signature}>
				{common.seeYouSoon}
				<br />
				{common.teamSignature}
			</Text>
		</EmailLayout>
	)
}
