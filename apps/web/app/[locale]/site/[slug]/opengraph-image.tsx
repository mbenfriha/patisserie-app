import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Site pâtissier'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || ''

function getImageUrl(key: string | null | undefined): string | null {
	if (!key) return null
	if (key.startsWith('http')) return key
	return STORAGE_URL ? `${STORAGE_URL}/${key}` : null
}

async function getProfile(slug: string) {
	try {
		const res = await fetch(`${API_URL}/public/${slug}`, { next: { revalidate: 300 } })
		if (!res.ok) return null
		const data = (await res.json()) as { data: Record<string, unknown> }
		return data.data
	} catch {
		return null
	}
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const profile = (await getProfile(slug)) as {
		businessName: string
		description: string | null
		logoUrl: string | null
		primaryColor: string
		heroImageUrl: string | null
		siteConfig?: { seoTitle?: string; seoDescription?: string }
	} | null

	if (!profile) {
		return new ImageResponse(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: '#f5f5f5',
					fontSize: 32,
					color: '#999',
				}}
			>
				Page introuvable
			</div>,
			{ ...size }
		)
	}

	const primaryColor = profile.primaryColor || '#D4816A'
	const logoUrl = getImageUrl(profile.logoUrl)
	const title = profile.siteConfig?.seoTitle || profile.businessName
	const description = profile.siteConfig?.seoDescription || profile.description

	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				background: `linear-gradient(145deg, #FFFFFF 0%, #FFF8F5 50%, ${primaryColor}15 100%)`,
				position: 'relative',
			}}
		>
			{/* Top accent bar */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					height: 6,
					background: primaryColor,
					display: 'flex',
				}}
			/>

			{/* Decorative circle */}
			<div
				style={{
					position: 'absolute',
					top: -80,
					right: -80,
					width: 320,
					height: 320,
					borderRadius: '50%',
					border: `1px solid ${primaryColor}20`,
					display: 'flex',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					bottom: -100,
					left: -100,
					width: 400,
					height: 400,
					borderRadius: '50%',
					border: `1px solid ${primaryColor}15`,
					display: 'flex',
				}}
			/>

			{/* Main content */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 28,
					zIndex: 1,
					padding: '0 60px',
				}}
			>
				{/* Logo */}
				{logoUrl ? (
					<img
						src={logoUrl}
						alt=""
						width={140}
						height={140}
						style={{
							objectFit: 'contain',
							borderRadius: 20,
						}}
					/>
				) : (
					<div
						style={{
							width: 100,
							height: 100,
							borderRadius: 20,
							background: primaryColor,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 48,
							fontWeight: 700,
							color: '#fff',
						}}
					>
						{title.charAt(0).toUpperCase()}
					</div>
				)}

				{/* Business name */}
				<div
					style={{
						fontSize: 52,
						fontWeight: 700,
						color: '#1A1A1A',
						textAlign: 'center',
						lineHeight: 1.1,
						maxWidth: 900,
					}}
				>
					{title}
				</div>

				{/* Separator */}
				<div
					style={{
						width: 60,
						height: 3,
						borderRadius: 2,
						background: primaryColor,
						display: 'flex',
					}}
				/>

				{/* Description */}
				{description && (
					<div
						style={{
							fontSize: 22,
							color: '#64748B',
							textAlign: 'center',
							maxWidth: 700,
							lineHeight: 1.5,
							display: 'flex',
						}}
					>
						{description.length > 120 ? `${description.slice(0, 117)}...` : description}
					</div>
				)}
			</div>

			{/* Patissio branding — bottom right */}
			<div
				style={{
					position: 'absolute',
					bottom: 28,
					right: 40,
					display: 'flex',
					alignItems: 'center',
					gap: 6,
				}}
			>
				<div
					style={{
						fontSize: 14,
						color: '#94A3B8',
						fontWeight: 400,
					}}
				>
					propulsé par
				</div>
				<div
					style={{
						fontSize: 16,
						color: '#D4816A',
						fontWeight: 600,
					}}
				>
					Patissio
				</div>
			</div>
		</div>,
		{ ...size }
	)
}
