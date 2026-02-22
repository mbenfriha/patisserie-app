import { Link, Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './components/email-layout.js'
import { emailTranslations } from './i18n/email-translations.js'

interface VerifyEmailProps {
	fullName: string | null
	verificationUrl: string
}

export default function VerifyEmailTemplate({
	fullName,
	verificationUrl,
}: VerifyEmailProps) {
	const t = emailTranslations.verifyEmail
	const common = emailTranslations.common
	const greeting = fullName ? `${common.greeting} ${fullName}` : common.greeting

	return (
		<EmailLayout title={t.title} preview={t.preview}>
			<Text style={emailStyles.heading}>{t.heading}</Text>

			<Text style={emailStyles.paragraph}>{greeting},</Text>

			<Text style={emailStyles.paragraph}>{t.body}</Text>

			<Section style={{ textAlign: 'center', marginTop: '30px', marginBottom: '30px' }}>
				<Link href={verificationUrl} style={emailStyles.button}>
					{t.button}
				</Link>
			</Section>

			<Text style={emailStyles.paragraph}>{t.ignore}</Text>

			<Text style={emailStyles.paragraph}>{common.seeYouSoon}</Text>
		</EmailLayout>
	)
}
