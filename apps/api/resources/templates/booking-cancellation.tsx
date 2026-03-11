import { Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './components/email-layout.js'
import { emailTranslations } from './i18n/email-translations.js'

interface BookingCancellationProps {
	patissierName: string
	clientName: string
	workshopTitle: string
	date: string
	nbParticipants: number
	reason: string | null
}

export default function BookingCancellationTemplate({
	patissierName,
	clientName,
	workshopTitle,
	date,
	nbParticipants,
	reason,
}: BookingCancellationProps) {
	const t = emailTranslations.bookingCancellation
	const common = emailTranslations.common

	return (
		<EmailLayout title={t.title} preview={t.preview(workshopTitle)}>
			<Text style={emailStyles.heading}>{t.heading}</Text>

			<Text style={emailStyles.paragraph}>
				{common.greeting} {patissierName},
			</Text>

			<Text style={emailStyles.paragraph}>{t.body(clientName, workshopTitle)}</Text>

			<Section>
				<table style={emailStyles.infoTable} cellPadding="0" cellSpacing="0">
					<tr>
						<td style={emailStyles.infoRow}>{t.dateLabel}</td>
						<td style={emailStyles.infoValue}>{date}</td>
					</tr>
					<tr>
						<td style={{ ...emailStyles.infoRow, borderBottom: 'none' }}>{t.participantsLabel}</td>
						<td style={{ ...emailStyles.infoValue, borderBottom: 'none' }}>{nbParticipants}</td>
					</tr>
				</table>
			</Section>

			{reason && (
				<Section style={emailStyles.highlightBox}>
					<Text style={{ ...emailStyles.paragraph, marginBottom: 0 }}>
						<strong>{t.reasonLabel} :</strong> {reason}
					</Text>
				</Section>
			)}

			<Text style={emailStyles.signature}>
				{common.seeYouSoon}
				<br />
				{common.teamSignature}
			</Text>
		</EmailLayout>
	)
}
