'use client'

import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useAuth } from '@/lib/providers/auth-provider'

interface RoleGuardProps {
	children: React.ReactNode
	allowedRoles: ('patissier' | 'client' | 'superadmin')[]
	redirectTo?: string
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
	const { user, isLoading, isAuthenticated } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (isLoading) return

		if (!isAuthenticated) {
			router.replace('/login')
			return
		}

		if (user && !allowedRoles.includes(user.role)) {
			const redirect = redirectTo || '/dashboard'
			router.replace(redirect)
		}
	}, [isLoading, isAuthenticated, user, allowedRoles, redirectTo, router])

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		)
	}

	if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		)
	}

	return <>{children}</>
}
