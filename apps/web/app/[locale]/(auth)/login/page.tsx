'use client'

import { ArrowLeft, Loader2, Smartphone } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api/client'

export default function LoginPage() {
	const t = useTranslations('auth')
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	// 2FA state
	const [twoFactorRequired, setTwoFactorRequired] = useState(false)
	const [tempToken, setTempToken] = useState('')
	const [twoFactorCode, setTwoFactorCode] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setIsLoading(true)
		try {
			// Call API directly to check for 2FA
			const response = await api.post('/auth/login', { email, password })
			const data = response.data

			if (data.twoFactorRequired) {
				setTempToken(data.tempToken)
				setTwoFactorRequired(true)
				setIsLoading(false)
				return
			}

			// No 2FA - store token and redirect directly (avoid double API call)
			localStorage.setItem('token', data.token)
			router.push('/dashboard')
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Login failed'
			setError(message)
		} finally {
			setIsLoading(false)
		}
	}

	const handleTwoFactorSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setIsLoading(true)
		try {
			const response = await api.post('/auth/login/2fa', {
				tempToken,
				code: twoFactorCode,
			})
			const data = response.data

			if (!data.token) {
				throw new Error('Réponse inattendue du serveur')
			}

			// Store token and redirect to dashboard
			localStorage.setItem('token', data.token)
			router.push('/dashboard')
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Code invalide'
			setError(message)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="mx-auto w-full max-w-md space-y-6 p-8">
				<div className="flex flex-col items-center">
					<Link href="/">
						<Image
							src="/logo-patissio-full.png"
							alt="Patissio"
							width={886}
							height={368}
							className="h-12 w-auto"
						/>
					</Link>
					<p className="mt-3 text-muted-foreground">
						{twoFactorRequired
							? "Entrez le code de votre application d'authentification"
							: t('login')}
					</p>
				</div>

				{!twoFactorRequired ? (
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="email" className="text-sm font-medium">
								{t('email')}
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="password" className="text-sm font-medium">
								{t('password')}
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							/>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{isLoading ? '...' : t('login')}
						</button>
					</form>
				) : (
					<form onSubmit={handleTwoFactorSubmit} className="space-y-4">
						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}

						<div className="flex justify-center">
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
								<Smartphone className="h-7 w-7 text-primary" />
							</div>
						</div>

						<div className="space-y-2">
							<label htmlFor="2fa-code" className="text-sm font-medium">
								Code de vérification
							</label>
							<input
								id="2fa-code"
								type="text"
								inputMode="numeric"
								maxLength={8}
								value={twoFactorCode}
								onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
								placeholder="000000"
								className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-center font-mono text-lg tracking-widest"
								required
								autoComplete="one-time-code"
							/>
							<p className="text-xs text-muted-foreground">
								Vous pouvez aussi utiliser un code de secours
							</p>
						</div>

						<button
							type="submit"
							disabled={isLoading || twoFactorCode.length < 6}
							className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{isLoading ? (
								<span className="flex items-center justify-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									Vérification...
								</span>
							) : (
								'Vérifier'
							)}
						</button>

						<button
							type="button"
							onClick={() => {
								setTwoFactorRequired(false)
								setTwoFactorCode('')
								setTempToken('')
								setError('')
							}}
							className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="h-4 w-4" />
							Retour
						</button>
					</form>
				)}

				{!twoFactorRequired && (
					<>
						<div className="text-center text-sm text-muted-foreground">
							<Link href="/forgot-password" className="text-primary hover:underline">
								Mot de passe oublié ?
							</Link>
						</div>

						<p className="text-center text-sm text-muted-foreground">
							{t('noAccount')}{' '}
							<Link href="/register" className="text-primary hover:underline">
								{t('register')}
							</Link>
						</p>
					</>
				)}
			</div>
		</div>
	)
}
