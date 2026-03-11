import { Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './components/email-layout.js'
import { emailTranslations } from './i18n/email-translations.js'

interface OrderConfirmationProps {
	clientName: string
	orderNumber: string
	patissierName: string
	type: 'catalogue' | 'custom'
	total: string
}

export default function OrderConfirmationTemplate({
	clientName,
	orderNumber,
	patissierName,
	type,
	total,
}: OrderConfirmationProps) {
	const t = emailTranslations.orderConfirmation
	const common = emailTranslations.common
	const typeLabel = type === 'custom' ? 'Sur mesure' : 'Catalogue'

	return (
		<EmailLayout title={t.title} preview={t.preview(orderNumber)}>
			<Text style={emailStyles.heading}>{t.heading}</Text>

			<Text style={emailStyles.paragraph}>
				{common.greeting} {clientName},
			</Text>

			<Text style={emailStyles.paragraph}>{t.body(orderNumber, patissierName)}</Text>

			<Section>
				<table style={emailStyles.infoTable} cellPadding="0" cellSpacing="0">
					<tr>
						<td style={emailStyles.infoRow}>{t.typeLabel}</td>
						<td style={emailStyles.infoValue}>{typeLabel}</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.orderLabel}</td>
						<td style={emailStyles.infoValue}>{orderNumber}</td>
					</tr>
					<tr>
						<td style={{ ...emailStyles.infoRow, borderBottom: 'none' }}>{t.totalLabel}</td>
						<td style={{ ...emailStyles.infoValue, borderBottom: 'none' }}>{total}</td>
					</tr>
				</table>
			</Section>

			<Text style={emailStyles.paragraph}>{t.footer}</Text>

			<Text style={emailStyles.signature}>
				{common.seeYouSoon}
				<br />
				{common.teamSignature}
			</Text>
		</EmailLayout>
	)
}
