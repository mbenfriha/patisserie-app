'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'

export default function InstagramCallbackPage() {
	const router = useRouter()
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const code = params.get('code')
		const errorParam = params.get('error')

		if (errorParam) {
			router.replace('/site?instagram=error')
			return
		}

		if (!code) {
			router.replace('/site?instagram=error')
			return
		}

		async function exchangeCode() {
			try {
				await api.post('/patissier/instagram/exchange', { code })
				router.replace('/site?instagram=success')
			} catch {
				router.replace('/site?instagram=error')
			}
		}

		exchangeCode()
	}, [router])

	if (error) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<p className="text-sm text-red-600">{error}</p>
			</div>
		)
	}

	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<div className="text-center">
				<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
				<p className="text-sm text-muted-foreground">Connexion a Instagram en cours...</p>
			</div>
		</div>
	)
}
