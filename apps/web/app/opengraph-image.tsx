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
						border: '1px solid rgba(196, 164, 112, 0.2)',
						borderRadius: 16,
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
					<div
						style={{
							fontSize: 72,
							fontWeight: 700,
							color: '#C4A470',
							fontFamily: 'serif',
							letterSpacing: '-0.02em',
						}}
					>
						Patissio
					</div>

					<div
						style={{
							width: 80,
							height: 1,
							background: 'linear-gradient(90deg, transparent, #C4A470, transparent)',
							display: 'flex',
						}}
					/>

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
						La plateforme des artisans pâtissiers
					</div>
				</div>

				<div
					style={{
						position: 'absolute',
						bottom: 52,
						display: 'flex',
					}}
				>
					<div
						style={{
							fontSize: 16,
							color: 'rgba(196, 164, 112, 0.6)',
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
