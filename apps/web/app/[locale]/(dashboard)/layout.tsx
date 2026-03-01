'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { RoleGuard } from '@/components/auth/role-guard'
import { StripeConnectBanner } from '@/components/dashboard/stripe-connect-banner'
import { useAuth } from '@/lib/providers/auth-provider'
import { getImageUrl } from '@/lib/utils/image-url'
import { useDashboardPrefix } from '@/lib/hooks/use-custom-domain'

const navItems: {
	href: string
	labelKey: string
	minPlan?: 'pro' | 'premium'
}[] = [
	{ href: '/dashboard', labelKey: 'dashboard' },
	{ href: '/site', labelKey: 'site' },
	{ href: '/creations', labelKey: 'creations' },
	{ href: '/products', labelKey: 'products', minPlan: 'pro' },
	{ href: '/orders', labelKey: 'orders', minPlan: 'pro' },
	{ href: '/workshops', labelKey: 'workshops', minPlan: 'pro' },
	{ href: '/settings', labelKey: 'settings' },
	{ href: '/billing', labelKey: 'billing' },
]

const PLAN_LEVELS: Record<string, number> = {
	starter: 1,
	pro: 2,
	premium: 3,
}

function PlanBadge({ plan }: { plan: 'pro' | 'premium' }) {
	return (
		<span
			className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
				plan === 'premium'
					? 'bg-[#D4816A]/15 text-[#D4816A]'
					: 'bg-[#B8A9D4]/15 text-[#B8A9D4]'
			}`}
		>
			{plan === 'premium' ? 'Premium' : 'Pro'}
		</span>
	)
}

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

function NavLinks({
	pathname,
	t,
	userPlan,
	onNavigate,
}: {
	pathname: string
	t: (key: string) => string
	userPlan: string
	onNavigate?: () => void
}) {
	const userLevel = PLAN_LEVELS[userPlan] || 1
	const dashboardPrefix = useDashboardPrefix()

	return (
		<>
			{navItems.map((item) => {
				// On custom domains, prefix dashboard links (except /dashboard itself)
				const href =
					item.href === '/dashboard'
						? '/dashboard'
						: `${dashboardPrefix}${item.href}`
				const isActive = pathname === href
				const requiredLevel = item.minPlan ? PLAN_LEVELS[item.minPlan] || 1 : 1
				const locked = userLevel < requiredLevel

				if (locked) {
					return (
						<Link
							key={item.href}
							href={`${dashboardPrefix}/billing`}
							onClick={onNavigate}
							className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/30"
						>
							{t(item.labelKey)}
							<PlanBadge plan={item.minPlan!} />
						</Link>
					)
				}

				return (
					<Link
						key={item.href}
						href={href}
						onClick={onNavigate}
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
		</>
	)
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const t = useTranslations('nav')
	const pathname = usePathname()
	const { user, logout } = useAuth()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	// Close mobile menu on route change
	useEffect(() => {
		setMobileMenuOpen(false)
	}, [pathname])

	// Prevent body scroll when mobile menu is open
	useEffect(() => {
		document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
		return () => {
			document.body.style.overflow = ''
		}
	}, [mobileMenuOpen])

	const siteUrl = useMemo(() => {
		if (!user?.profile?.slug) return null
		return getSiteUrl(user.profile)
	}, [user?.profile])

	return (
		<RoleGuard allowedRoles={['patissier']}>
			<div className="flex min-h-screen">
				{/* ── Desktop Sidebar ── */}
				<aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:flex lg:flex-col">
					<div className="p-6">
						<div className="flex items-center gap-3">
							{user?.profile?.logoUrl ? (
								<img
									src={getImageUrl(user.profile.logoUrl)!}
									alt=""
									className="h-10 w-10 shrink-0 rounded-lg border object-contain"
								/>
							) : (
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
									{(user?.profile?.businessName || 'P').charAt(0).toUpperCase()}
								</div>
							)}
							<h2 className="truncate text-lg font-bold text-sidebar-foreground">
								{user?.profile?.businessName || 'Patissio'}
							</h2>
						</div>
						{siteUrl && (
							<a
								href={siteUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-sidebar-accent px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
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
						<NavLinks pathname={pathname} t={t} userPlan={user?.profile?.plan || 'starter'} />
					</nav>
					<div className="mt-auto border-t p-4">
						<a
							href="https://patissio.com"
							target="_blank"
							rel="noopener noreferrer"
							className="mb-2 flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
						>
							<img src="/logo-patissio.png" alt="" className="h-4 w-4" />
							Propulsé par Patissio.com
						</a>
						<button
							type="button"
							onClick={logout}
							className="w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/50"
						>
							{t('logout' as any) || 'Deconnexion'}
						</button>
					</div>
				</aside>

				{/* ── Mobile Header ── */}
				<div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-sidebar px-4 lg:hidden">
					<div className="flex items-center gap-2">
						{user?.profile?.logoUrl ? (
							<img
								src={getImageUrl(user.profile.logoUrl)!}
								alt=""
								className="h-7 w-7 shrink-0 rounded-md border object-contain"
							/>
						) : (
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
								{(user?.profile?.businessName || 'P').charAt(0).toUpperCase()}
							</div>
						)}
						<h2 className="truncate text-sm font-bold text-sidebar-foreground">
							{user?.profile?.businessName || 'Patissio'}
						</h2>
					</div>
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50"
						aria-label="Menu"
					>
						{mobileMenuOpen ? (
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M18 6L6 18M6 6l12 12" />
							</svg>
						) : (
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M3 12h18M3 6h18M3 18h18" />
							</svg>
						)}
					</button>
				</div>

				{/* ── Mobile Drawer Overlay ── */}
				{mobileMenuOpen && (
					<div
						className="fixed inset-0 z-40 bg-black/50 lg:hidden"
						onClick={() => setMobileMenuOpen(false)}
					/>
				)}

				{/* ── Mobile Drawer ── */}
				<div
					className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar transition-transform duration-300 lg:hidden ${
						mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
					}`}
				>
					<div className="flex items-center justify-between border-b p-4">
						<div className="flex items-center gap-2.5">
							{user?.profile?.logoUrl ? (
								<img
									src={getImageUrl(user.profile.logoUrl)!}
									alt=""
									className="h-8 w-8 shrink-0 rounded-lg border object-contain"
								/>
							) : (
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
									{(user?.profile?.businessName || 'P').charAt(0).toUpperCase()}
								</div>
							)}
							<h2 className="truncate text-lg font-bold text-sidebar-foreground">
								{user?.profile?.businessName || 'Patissio'}
							</h2>
						</div>
						<button
							type="button"
							onClick={() => setMobileMenuOpen(false)}
							className="flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50"
							aria-label="Fermer"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M18 6L6 18M6 6l12 12" />
							</svg>
						</button>
					</div>

					{siteUrl && (
						<div className="px-4 pt-4">
							<a
								href={siteUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 rounded-md border border-sidebar-accent px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
									<polyline points="15 3 21 3 21 9" />
									<line x1="10" y1="14" x2="21" y2="3" />
								</svg>
								Voir mon site
							</a>
						</div>
					)}

					<nav className="space-y-1 px-3 pt-4">
						<NavLinks pathname={pathname} t={t} userPlan={user?.profile?.plan || 'starter'} onNavigate={() => setMobileMenuOpen(false)} />
					</nav>

					<div className="mt-auto border-t p-4">
						<a
							href="https://patissio.com"
							target="_blank"
							rel="noopener noreferrer"
							className="mb-2 flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
						>
							<img src="/logo-patissio.png" alt="" className="h-4 w-4" />
							Propulsé par Patissio.com
						</a>
						<button
							type="button"
							onClick={logout}
							className="w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/50"
						>
							{t('logout' as any) || 'Deconnexion'}
						</button>
					</div>
				</div>

				{/* ── Main Content ── */}
				<main className="flex-1 overflow-auto pt-14 lg:pt-0">
					<div className="p-4 sm:p-6 lg:p-8">
						<StripeConnectBanner />
						{children}
					</div>
				</main>
			</div>
		</RoleGuard>
	)
}
