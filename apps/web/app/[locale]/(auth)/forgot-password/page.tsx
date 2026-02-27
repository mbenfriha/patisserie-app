'use client'

import { CheckCircle } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/lib/providers/auth-provider'

export default function ForgotPasswordPage() {
	const { forgotPassword } = useAuth()
	const [email, setEmail] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [sent, setSent] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setIsLoading(true)
		try {
			await forgotPassword(email)
			setSent(true)
		} catch (err: any) {
			setError(err.message || 'Une erreur est survenue')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="mx-auto w-full max-w-md space-y-6 p-8">
				<div className="flex flex-col items-center">
					<Link href="/">
						<Image src="/logo-patissio-full.png" alt="Patissio" width={886} height={368} className="h-12 w-auto" />
					</Link>
					<p className="text-muted-foreground mt-3">Mot de passe oublié</p>
				</div>

				{sent ? (
					<div className="space-y-4 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
							<CheckCircle className="h-6 w-6 text-green-600" />
						</div>
						<div>
							<p className="font-medium">Email envoyé</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien pour réinitialiser votre mot de passe.
							</p>
						</div>
						<p className="text-sm text-muted-foreground">
							<Link href="/login" className="text-primary hover:underline">
								Retour à la connexion
							</Link>
						</p>
					</div>
				) : (
					<>
						<p className="text-center text-sm text-muted-foreground">
							Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
						</p>

						<form onSubmit={handleSubmit} className="space-y-4">
							{error && (
								<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
									{error}
								</div>
							)}

							<div className="space-y-2">
								<label htmlFor="email" className="text-sm font-medium">
									Email
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

							<button
								type="submit"
								disabled={isLoading}
								className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
							>
								{isLoading ? '...' : 'Envoyer le lien'}
							</button>
						</form>

						<p className="text-center text-sm text-muted-foreground">
							<Link href="/login" className="text-primary hover:underline">
								Retour à la connexion
							</Link>
						</p>
					</>
				)}
			</div>
		</div>
	)
}
