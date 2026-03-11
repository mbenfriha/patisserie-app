import { Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './components/email-layout.js'
import { emailTranslations } from './i18n/email-translations.js'

interface PaymentConfirmationProps {
	clientName: string
	workshopTitle: string
	patissierName: string
	date: string
	startTime: string
	location: string | null
	durationLabel: string
	nbParticipants: number
	amountPaid: string
	totalPrice: string
	remainingAmount: string
	isFullPayment: boolean
}

export default function PaymentConfirmationTemplate({
	clientName,
	workshopTitle,
	patissierName,
	date,
	startTime,
	location,
	durationLabel,
	nbParticipants,
	amountPaid,
	totalPrice,
	remainingAmount,
	isFullPayment,
}: PaymentConfirmationProps) {
	const t = emailTranslations.paymentConfirmation
	const common = emailTranslations.common

	return (
		<EmailLayout title={t.title} preview={t.preview(workshopTitle)}>
			{/* Success badge */}
			<Section style={{ textAlign: 'center', marginBottom: '24px' }}>
				<table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
					<tr>
						<td
							style={{
								width: '56px',
								height: '56px',
								borderRadius: '50%',
								backgroundColor: '#f0fdf4',
								textAlign: 'center',
								verticalAlign: 'middle',
								fontSize: '28px',
								color: '#16a34a',
							}}
						>
							&#10003;
						</td>
					</tr>
				</table>
			</Section>

			<Text style={{ ...emailStyles.heading, textAlign: 'center' }}>{t.heading}</Text>

			<Text style={{ ...emailStyles.paragraph, textAlign: 'center' }}>
				{common.greeting} {clientName}, votre paiement de <strong>{amountPaid}</strong> a bien été
				reçu.
			</Text>

			{/* Recap heading */}
			<Text
				style={{
					...emailStyles.heading,
					fontSize: '16px',
					marginTop: '32px',
					paddingBottom: '8px',
					borderBottom: '2px solid #D4816A',
				}}
			>
				{t.subheading}
			</Text>

			{/* Info table */}
			<Section>
				<table style={emailStyles.infoTable} cellPadding="0" cellSpacing="0">
					<tr>
						<td style={emailStyles.infoRow}>{t.workshopLabel}</td>
						<td style={emailStyles.infoValue}>{workshopTitle}</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.organizerLabel}</td>
						<td style={emailStyles.infoValue}>{patissierName}</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.dateLabel}</td>
						<td style={emailStyles.infoValue}>{date}</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.timeLabel}</td>
						<td style={emailStyles.infoValue}>{startTime}</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.durationLabel}</td>
						<td style={emailStyles.infoValue}>{durationLabel}</td>
					</tr>
					{location && (
						<tr>
							<td style={emailStyles.infoRow}>{t.locationLabel}</td>
							<td style={emailStyles.infoValue}>{location}</td>
						</tr>
					)}
					<tr>
						<td style={{ ...emailStyles.infoRow, borderBottom: 'none' }}>{t.participantsLabel}</td>
						<td style={{ ...emailStyles.infoValue, borderBottom: 'none' }}>
							{nbParticipants} personne{nbParticipants > 1 ? 's' : ''}
						</td>
					</tr>
				</table>
			</Section>

			{/* Payment summary */}
			<Section style={emailStyles.successBox}>
				<table
					style={{ width: '100%', borderCollapse: 'collapse' }}
					cellPadding="0"
					cellSpacing="0"
				>
					<tr>
						<td style={{ padding: '6px 0', color: '#6b7280', fontSize: '14px' }}>
							{t.amountPaidLabel}
						</td>
						<td
							style={{
								padding: '6px 0',
								textAlign: 'right',
								fontWeight: 700,
								color: '#16a34a',
								fontSize: '18px',
							}}
						>
							{amountPaid}
						</td>
					</tr>
					{!isFullPayment && (
						<tr>
							<td style={{ padding: '6px 0', color: '#6b7280', fontSize: '14px' }}>
								{t.remainingLabel}
							</td>
							<td
								style={{
									padding: '6px 0',
									textAlign: 'right',
									fontWeight: 600,
									color: '#1A1A1A',
									fontSize: '14px',
								}}
							>
								{remainingAmount}
							</td>
						</tr>
					)}
					<tr style={{ borderTop: '1px solid #bbf7d0' }}>
						<td style={{ padding: '10px 0 6px', color: '#6b7280', fontSize: '14px' }}>
							{t.totalLabel}
						</td>
						<td
							style={{
								padding: '10px 0 6px',
								textAlign: 'right',
								fontWeight: 600,
								color: '#1A1A1A',
								fontSize: '14px',
							}}
						>
							{totalPrice}
						</td>
					</tr>
				</table>
			</Section>

			<Text style={emailStyles.paragraph}>
				{isFullPayment ? t.fullPaymentFooter : t.depositFooter(remainingAmount)}
			</Text>

			<Text style={emailStyles.signature}>
				{common.seeYouSoon}
				<br />
				{common.teamSignature}
			</Text>
		</EmailLayout>
	)
}
