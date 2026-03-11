'use client'

import { ArrowLeft, Loader2, Shield, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/api/client'

export default function LoginPage() {
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
		setIsLoading(true)
		setError('')

		try {
			const data = await api.post('/auth/login', { email, password })

			// Check if 2FA is required
			if (data.twoFactorRequired) {
				setTempToken(data.tempToken)
				setTwoFactorRequired(true)
				setIsLoading(false)
				return
			}

			const user = data.user || data.data?.user
			const token = data.token || data.data?.token

			if (!user) {
				throw new Error('Reponse inattendue du serveur')
			}

			if (user.role !== 'superadmin') {
				throw new Error('Acces refuse - Super Admin requis')
			}

			document.cookie = `superadmin_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`

			router.push('/')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erreur de connexion')
		} finally {
			setIsLoading(false)
		}
	}

	const handleTwoFactorSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setError('')

		try {
			const data = await api.post('/auth/login/2fa', {
				tempToken,
				code: twoFactorCode,
			})

			const user = data.user || data.data?.user
			const token = data.token || data.data?.token

			if (!user) {
				throw new Error('Reponse inattendue du serveur')
			}

			if (user.role !== 'superadmin') {
				throw new Error('Acces refuse - Super Admin requis')
			}

			document.cookie = `superadmin_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`

			router.push('/')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Code invalide')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
						{twoFactorRequired ? (
							<Smartphone className="w-8 h-8 text-primary" />
						) : (
							<Shield className="w-8 h-8 text-primary" />
						)}
					</div>
					<h1 className="text-2xl font-bold text-foreground">Patissio Admin</h1>
					<p className="text-muted-foreground mt-2">
						{twoFactorRequired
							? "Entrez le code de votre application d'authentification"
							: "Connectez-vous pour acceder a l'administration"}
					</p>
				</div>

				{!twoFactorRequired ? (
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
								{error}
							</div>
						)}

						<div>
							<label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
								Email
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="admin@patissio.com"
								className="w-full px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
								disabled={isLoading}
								required
							/>
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
								Mot de passe
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="********"
								className="w-full px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
								disabled={isLoading}
								required
							/>
						</div>

						<button
							type="submit"
							className="w-full px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Connexion...
								</>
							) : (
								'Se connecter'
							)}
						</button>
					</form>
				) : (
					<form onSubmit={handleTwoFactorSubmit} className="space-y-4">
						{error && (
							<div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
								{error}
							</div>
						)}

						<div>
							<label htmlFor="2fa-code" className="block text-sm font-medium text-foreground mb-2">
								Code de verification
							</label>
							<input
								id="2fa-code"
								type="text"
								inputMode="numeric"
								maxLength={8}
								value={twoFactorCode}
								onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
								placeholder="000000"
								className="w-full px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground text-center text-lg tracking-widest font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
								disabled={isLoading}
								required
								autoComplete="one-time-code"
							/>
							<p className="text-xs text-muted-foreground mt-2">
								Vous pouvez aussi utiliser un code de secours
							</p>
						</div>

						<button
							type="submit"
							className="w-full px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
							disabled={isLoading || twoFactorCode.length < 6}
						>
							{isLoading ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Verification...
								</>
							) : (
								'Verifier'
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
							className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Retour a la connexion
						</button>
					</form>
				)}
			</div>
		</main>
	)
}
