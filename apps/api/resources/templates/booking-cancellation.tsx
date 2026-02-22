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

			<Text style={emailStyles.paragraph}>
				<strong>{clientName}</strong> a annulé sa participation à l'atelier{' '}
				<strong>{workshopTitle}</strong>.
			</Text>

			<Section>
				<table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }} cellPadding="0" cellSpacing="0">
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.dateLabel}</td>
						<td style={emailStyles.infoValue}>{date}</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.participantsLabel}</td>
						<td style={emailStyles.infoValue}>{nbParticipants}</td>
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

			<Text style={emailStyles.paragraph}>{common.seeYouSoon}</Text>
		</EmailLayout>
	)
}
