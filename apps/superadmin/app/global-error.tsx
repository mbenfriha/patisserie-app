'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		Sentry.captureException(error)
	}, [error])

	return (
		<html lang="fr">
			<body>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						minHeight: '100vh',
						fontFamily: 'system-ui, sans-serif',
					}}
				>
					<h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Une erreur est survenue</h2>
					<button
						type="button"
						onClick={reset}
						style={{
							padding: '0.5rem 1.5rem',
							borderRadius: '0.5rem',
							border: '1px solid #ccc',
							cursor: 'pointer',
						}}
					>
						Reessayer
					</button>
				</div>
			</body>
		</html>
	)
}
