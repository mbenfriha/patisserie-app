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
	const typeLabel = type === 'custom' ? 'sur mesure' : 'catalogue'

	return (
		<EmailLayout title={t.title} preview={t.preview(orderNumber)}>
			<Text style={emailStyles.heading}>{t.heading}</Text>

			<Text style={emailStyles.paragraph}>
				{common.greeting} {clientName},
			</Text>

			<Text style={emailStyles.paragraph}>
				Votre commande <strong>{orderNumber}</strong> a bien été enregistrée auprès de{' '}
				<strong>{patissierName}</strong>.
			</Text>

			<Section>
				<table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }} cellPadding="0" cellSpacing="0">
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.typeLabel}</td>
						<td style={emailStyles.infoValue}>Commande {typeLabel}</td>
					</tr>
					<tr style={{ borderBottom: '1px solid #eee' }}>
						<td style={emailStyles.infoRow}>{t.orderLabel}</td>
						<td style={emailStyles.infoValue}>{orderNumber}</td>
					</tr>
					<tr>
						<td style={emailStyles.infoRow}>{t.totalLabel}</td>
						<td style={emailStyles.infoValue}>{total}</td>
					</tr>
				</table>
			</Section>

			<Text style={emailStyles.paragraph}>{t.footer}</Text>

			<Text style={emailStyles.paragraph}>{common.seeYouSoon}</Text>
		</EmailLayout>
	)
}
