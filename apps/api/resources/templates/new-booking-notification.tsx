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
				<table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }} cellPadding="0" cellSpacing="0">
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.clientLabel}</td>
						<td style={emailStyles.infoValue}>{clientName} ({clientEmail})</td>
					</tr>
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.dateLabel}</td>
						<td style={emailStyles.infoValue}>{date} à {startTime}</td>
					</tr>
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.participantsLabel}</td>
						<td style={emailStyles.infoValue}>{nbParticipants}</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.depositLabel}</td>
						<td style={emailStyles.infoValue}>{depositAmount}</td>
					</tr>
				</table>
			</Section>

			<Text style={emailStyles.paragraph}>{common.seeYouSoon}</Text>
		</EmailLayout>
	)
}
