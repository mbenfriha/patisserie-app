'use client'

import { useEffect, useRef } from 'react'
import { api } from '@/lib/api/client'

export default function InstagramCallbackPage() {
	const exchanged = useRef(false)

	useEffect(() => {
		if (exchanged.current) return
		exchanged.current = true

		const params = new URLSearchParams(window.location.search)
		const code = params.get('code')
		const errorParam = params.get('error')

		if (errorParam || !code) {
			window.location.href = '/site?instagram=error'
			return
		}

		api
			.post('/patissier/instagram/exchange', { code })
			.then(() => {
				window.location.href = '/site?instagram=success'
			})
			.catch(() => {
				window.location.href = '/site?instagram=error'
			})
	}, [])

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
				<p className="text-sm text-gray-500">Connexion a Instagram en cours...</p>
			</div>
		</div>
	)
}
