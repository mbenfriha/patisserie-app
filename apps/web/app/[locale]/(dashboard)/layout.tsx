'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { RoleGuard } from '@/components/auth/role-guard'
import { StripeConnectBanner } from '@/components/dashboard/stripe-connect-banner'
import { useAuth } from '@/lib/providers/auth-provider'

const navItems = [
	{ href: '/dashboard', labelKey: 'dashboard' },
	{ href: '/site', labelKey: 'site' },
	{ href: '/creations', labelKey: 'creations' },
	{ href: '/products', labelKey: 'products' },
	{ href: '/orders', labelKey: 'orders' },
	{ href: '/workshops', labelKey: 'workshops' },
	{ href: '/settings', labelKey: 'settings' },
	{ href: '/billing', labelKey: 'billing' },
]

function getSiteUrl(profile: { slug: string; plan: string; customDomain?: string | null }) {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
	const { hostname, protocol, port } = new URL(baseUrl)
	const portSuffix = port ? `:${port}` : ''

	if (profile.plan === 'premium' && profile.customDomain) {
		return `https://${profile.customDomain}`
	}

	if (profile.plan === 'pro') {
		return `${protocol}//${profile.slug}.${hostname}${portSuffix}`
	}

	// Starter: path-based
	return `${baseUrl}/${profile.slug}`
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const t = useTranslations('nav')
	const pathname = usePathname()
	const { user, logout } = useAuth()

	const siteUrl = useMemo(() => {
		if (!user?.profile?.slug) return null
		return getSiteUrl(user.profile)
	}, [user?.profile])

	return (
		<RoleGuard allowedRoles={['patissier']}>
			<div className="flex min-h-screen">
				{/* Sidebar */}
				<aside className="w-64 border-r bg-sidebar">
					<div className="p-6">
						<h2 className="text-lg font-bold text-sidebar-foreground">
							{user?.profile?.businessName || 'Patissio'}
						</h2>
						{siteUrl && (
							<a
								href={siteUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-sidebar-accent px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
									<polyline points="15 3 21 3 21 9" />
									<line x1="10" y1="14" x2="21" y2="3" />
								</svg>
								Voir mon site
							</a>
						)}
					</div>
					<nav className="space-y-1 px-3">
						{navItems.map((item) => {
							const isActive = pathname === item.href
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
										isActive
											? 'bg-sidebar-accent text-sidebar-accent-foreground'
											: 'text-sidebar-foreground hover:bg-sidebar-accent/50'
									}`}
								>
									{t(item.labelKey)}
								</Link>
							)
						})}
					</nav>
					<div className="mt-auto border-t p-4">
						<button
							type="button"
							onClick={logout}
							className="w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/50"
						>
							{t('logout' as any) || 'Déconnexion'}
						</button>
					</div>
				</aside>

				{/* Main content */}
				<main className="flex-1 overflow-auto">
					<div className="p-8">
						<StripeConnectBanner />
						{children}
					</div>
				</main>
			</div>
		</RoleGuard>
	)
}
