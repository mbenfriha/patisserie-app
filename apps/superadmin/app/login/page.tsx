'use client'

import { Loader2, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setError('')

		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
			const response = await fetch(`${apiUrl}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || 'Identifiants invalides')
			}

			if (data.user.role !== 'superadmin') {
				throw new Error('Acces refuse - Super Admin requis')
			}

			document.cookie = `superadmin_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`

			router.push('/')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erreur de connexion')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
						<Shield className="w-8 h-8 text-primary" />
					</div>
					<h1 className="text-2xl font-bold text-foreground">Patissio Admin</h1>
					<p className="text-muted-foreground mt-2">
						Connectez-vous pour acceder a l&apos;administration
					</p>
				</div>

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
			</div>
		</main>
	)
}
