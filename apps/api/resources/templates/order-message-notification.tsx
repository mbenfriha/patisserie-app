import { Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './components/email-layout.js'
import { emailTranslations } from './i18n/email-translations.js'

interface OrderMessageNotificationProps {
	recipientName: string
	senderName: string
	orderNumber: string
	messagePreview: string
}

export default function OrderMessageNotificationTemplate({
	recipientName,
	senderName,
	orderNumber,
	messagePreview,
}: OrderMessageNotificationProps) {
	const t = emailTranslations.orderMessageNotification
	const common = emailTranslations.common

	return (
		<EmailLayout title={t.title} preview={t.preview(orderNumber)}>
			<Text style={emailStyles.heading}>{t.heading}</Text>

			<Text style={emailStyles.paragraph}>
				{common.greeting} {recipientName},
			</Text>

			<Text style={emailStyles.paragraph}>{t.body(senderName, orderNumber)}</Text>

			<Section style={emailStyles.highlightBox}>
				<Text style={{ ...emailStyles.paragraph, marginBottom: 0, fontStyle: 'italic' }}>
					"{messagePreview}"
				</Text>
			</Section>

			<Text style={emailStyles.paragraph}>{t.footer}</Text>

			<Text style={emailStyles.paragraph}>{common.seeYouSoon}</Text>
		</EmailLayout>
	)
}
