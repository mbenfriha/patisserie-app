'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/lib/providers/auth-provider'

export default function LoginPage() {
	const t = useTranslations('auth')
	const { login } = useAuth()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setIsLoading(true)
		try {
			await login({ email, password })
		} catch (err: any) {
			setError(err.message || 'Login failed')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="mx-auto w-full max-w-md space-y-6 p-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Patissio</h1>
					<p className="text-muted-foreground mt-2">{t('login')}</p>
				</div>

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

				<p className="text-center text-sm text-muted-foreground">
					{t('noAccount')}{' '}
					<Link href="/register" className="text-primary hover:underline">
						{t('register')}
					</Link>
				</p>
			</div>
		</div>
	)
}
