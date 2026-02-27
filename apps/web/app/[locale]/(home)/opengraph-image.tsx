import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Patissio — La plateforme des artisans pâtissiers'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
	return new ImageResponse(
		(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #1A1A1A 0%, #111111 100%)',
					position: 'relative',
				}}
			>
				{/* Decorative border */}
				<div
					style={{
						position: 'absolute',
						top: 32,
						left: 32,
						right: 32,
						bottom: 32,
						border: '1px solid rgba(184, 169, 212, 0.2)',
						borderRadius: 16,
						display: 'flex',
					}}
				/>

				{/* Decorative diamond */}
				<div
					style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						width: 400,
						height: 400,
						border: '1px solid rgba(184, 169, 212, 0.08)',
						borderRadius: 8,
						transform: 'translate(-50%, -50%) rotate(45deg)',
						display: 'flex',
					}}
				/>

				{/* Content */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 24,
						zIndex: 1,
					}}
				>
					{/* Logo */}
					<div
						style={{
							fontSize: 72,
							fontWeight: 700,
							color: '#D4816A',
							fontFamily: 'serif',
							letterSpacing: '-0.02em',
						}}
					>
						Patissio
					</div>

					{/* Separator */}
					<div
						style={{
							width: 80,
							height: 1,
							background: 'linear-gradient(90deg, transparent, #D4816A, transparent)',
							display: 'flex',
						}}
					/>

					{/* Tagline */}
					<div
						style={{
							fontSize: 28,
							color: 'rgba(255, 255, 255, 0.9)',
							fontWeight: 400,
							textAlign: 'center',
							maxWidth: 700,
							lineHeight: 1.4,
						}}
					>
						Créez votre vitrine pâtissière en ligne
					</div>

					{/* Sub-tagline */}
					<div
						style={{
							fontSize: 18,
							color: 'rgba(255, 255, 255, 0.45)',
							fontWeight: 300,
							textAlign: 'center',
							maxWidth: 600,
							lineHeight: 1.5,
						}}
					>
						Site vitrine, commandes en ligne et ateliers — gratuit pour démarrer
					</div>
				</div>

				{/* Bottom URL */}
				<div
					style={{
						position: 'absolute',
						bottom: 52,
						display: 'flex',
						alignItems: 'center',
						gap: 8,
					}}
				>
					<div
						style={{
							fontSize: 16,
							color: 'rgba(212, 129, 106, 0.6)',
							fontWeight: 400,
							letterSpacing: '0.1em',
						}}
					>
						patissio.com
					</div>
				</div>
			</div>
		),
		{ ...size },
	)
}
