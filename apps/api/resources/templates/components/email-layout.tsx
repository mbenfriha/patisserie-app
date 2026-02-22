import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

const BRAND = {
	gold: '#c2956b',
	goldLight: '#d4a97a',
	dark: '#1f2937',
	cream: '#faf8f5',
	creamDark: '#f0ebe4',
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
						<Text style={styles.logoText}>Patissio</Text>
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
		backgroundColor: BRAND.dark,
		padding: '24px 20px',
		textAlign: 'center' as const,
		borderRadius: '8px 8px 0 0',
	},
	logoText: {
		color: BRAND.gold,
		fontSize: '24px',
		fontWeight: 'bold' as const,
		margin: 0,
		fontFamily: "'Georgia', 'Times New Roman', serif",
		letterSpacing: '1px',
	},
	content: {
		backgroundColor: '#ffffff',
		padding: '30px',
	},
	footer: {
		backgroundColor: BRAND.cream,
		padding: '20px',
		textAlign: 'center' as const,
		borderRadius: '0 0 8px 8px',
	},
	hr: {
		borderColor: BRAND.creamDark,
		margin: '0 0 20px 0',
	},
	footerText: {
		fontSize: '12px',
		color: '#9ca3af',
		margin: '5px 0',
	},
	footerLinks: {
		fontSize: '12px',
		color: '#9ca3af',
		margin: '5px 0',
	},
	footerLink: {
		color: BRAND.gold,
		textDecoration: 'none',
	},
}

export const emailStyles = {
	heading: {
		color: BRAND.dark,
		fontSize: '24px',
		fontWeight: 'bold' as const,
		marginBottom: '20px',
		marginTop: 0,
	},
	paragraph: {
		color: '#4b5563',
		fontSize: '16px',
		lineHeight: '1.6',
		marginBottom: '15px',
	},
	button: {
		display: 'inline-block' as const,
		backgroundColor: BRAND.gold,
		color: '#ffffff',
		padding: '14px 32px',
		textDecoration: 'none',
		borderRadius: '8px',
		fontWeight: '600' as const,
		fontSize: '16px',
	},
	highlightBox: {
		backgroundColor: BRAND.cream,
		borderLeft: `4px solid ${BRAND.gold}`,
		padding: '15px',
		margin: '20px 0',
		borderRadius: '0 4px 4px 0',
	},
	successBox: {
		backgroundColor: '#f0fdf4',
		border: '1px solid #bbf7d0',
		padding: '20px',
		margin: '20px 0',
		borderRadius: '8px',
	},
	infoRow: {
		padding: '12px 16px',
		color: '#6b7280',
		fontSize: '14px',
	},
	infoValue: {
		padding: '12px 16px',
		fontWeight: '600' as const,
		color: BRAND.dark,
		fontSize: '14px',
	},
	link: {
		color: BRAND.gold,
		textDecoration: 'underline',
	},
	smallText: {
		fontSize: '12px',
		color: '#6b7280',
	},
}
