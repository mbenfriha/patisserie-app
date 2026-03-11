import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

const BRAND = {
	primary: '#D4816A',
	primaryLight: '#E29B85',
	dark: '#1A1A1A',
	background: '#FFF8F5',
	accent: '#F5ECE8',
	border: '#E8DDD5',
	muted: '#8A8A8A',
	text: '#4b5563',
	white: '#FFFFFF',
}

interface EmailLayoutProps {
	title: string
	preview: string
	children: ReactNode
}

export function EmailLayout({ title, preview, children }: EmailLayoutProps) {
	const currentYear = new Date().getFullYear()

	return (
		<Html>
			<Head>
				<title>{title}</title>
			</Head>
			<Preview>{preview}</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					<Section style={styles.header}>
						<Img
							src="https://patissio.xyz/logo-patissio-full.png"
							alt="Patissio"
							width="160"
							height="auto"
							style={styles.logo}
						/>
					</Section>

					<Section style={styles.content}>{children}</Section>

					<Section style={styles.footer}>
						<Hr style={styles.hr} />
						<Text style={styles.footerText}>
							&copy; {currentYear} Patissio. Tous droits réservés.
						</Text>
						<Text style={styles.footerLinks}>
							<Link href="https://patissio.com" style={styles.footerLink}>
								patissio.com
							</Link>
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

const styles = {
	body: {
		backgroundColor: '#f5f5f5',
		fontFamily:
			"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		margin: 0,
		padding: 0,
	},
	container: {
		maxWidth: '600px',
		margin: '0 auto',
		padding: '20px',
	},
	header: {
		backgroundColor: BRAND.white,
		padding: '28px 20px',
		textAlign: 'center' as const,
		borderRadius: '12px 12px 0 0',
		borderBottom: `2px solid ${BRAND.accent}`,
	},
	logo: {
		margin: '0 auto',
	},
	content: {
		backgroundColor: BRAND.white,
		padding: '32px',
	},
	footer: {
		backgroundColor: BRAND.accent,
		padding: '20px',
		textAlign: 'center' as const,
		borderRadius: '0 0 12px 12px',
	},
	hr: {
		borderColor: BRAND.border,
		margin: '0 0 16px 0',
	},
	footerText: {
		fontSize: '12px',
		color: BRAND.muted,
		margin: '4px 0',
	},
	footerLinks: {
		fontSize: '12px',
		color: BRAND.muted,
		margin: '4px 0',
	},
	footerLink: {
		color: BRAND.primary,
		textDecoration: 'none',
	},
}

export const emailStyles = {
	heading: {
		color: BRAND.dark,
		fontSize: '22px',
		fontWeight: 'bold' as const,
		marginBottom: '20px',
		marginTop: 0,
	},
	paragraph: {
		color: BRAND.text,
		fontSize: '15px',
		lineHeight: '1.7',
		marginBottom: '16px',
	},
	button: {
		display: 'inline-block' as const,
		backgroundColor: BRAND.primary,
		color: BRAND.white,
		padding: '14px 32px',
		textDecoration: 'none',
		borderRadius: '8px',
		fontWeight: '600' as const,
		fontSize: '15px',
	},
	highlightBox: {
		backgroundColor: BRAND.accent,
		borderLeft: `4px solid ${BRAND.primary}`,
		padding: '16px',
		margin: '20px 0',
		borderRadius: '0 8px 8px 0',
	},
	successBox: {
		backgroundColor: '#f0fdf4',
		border: '1px solid #bbf7d0',
		padding: '20px',
		margin: '20px 0',
		borderRadius: '8px',
	},
	infoTable: {
		width: '100%' as const,
		borderCollapse: 'collapse' as const,
		margin: '24px 0',
	},
	infoRow: {
		padding: '12px 16px',
		color: BRAND.muted,
		fontSize: '14px',
		borderBottom: `1px solid ${BRAND.accent}`,
	},
	infoValue: {
		padding: '12px 16px',
		fontWeight: '600' as const,
		color: BRAND.dark,
		fontSize: '14px',
		borderBottom: `1px solid ${BRAND.accent}`,
		textAlign: 'right' as const,
	},
	link: {
		color: BRAND.primary,
		textDecoration: 'underline',
	},
	smallText: {
		fontSize: '12px',
		color: BRAND.muted,
	},
	signature: {
		color: BRAND.text,
		fontSize: '15px',
		lineHeight: '1.7',
		marginTop: '24px',
		marginBottom: 0,
	},
}
