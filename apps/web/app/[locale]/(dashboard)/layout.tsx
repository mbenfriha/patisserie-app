'use client'

import {
	ChefHat,
	ClipboardList,
	CreditCard,
	ExternalLink,
	FolderOpen,
	Globe,
	LayoutDashboard,
	LogOut,
	type LucideIcon,
	Package,
	Palette,
	Settings,
	ShoppingBag,
	UserCog,
	Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { RoleGuard } from '@/components/auth/role-guard'
import { StripeConnectBanner } from '@/components/dashboard/stripe-connect-banner'
import { Separator } from '@/components/ui/separator'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { Link, usePathname } from '@/i18n/navigation'
import { useDashboardPrefix } from '@/lib/hooks/use-custom-domain'
import { useAuth } from '@/lib/providers/auth-provider'
import { getImageUrl } from '@/lib/utils/image-url'

type NavItem = {
	title: string
	href: string
	icon: LucideIcon
	labelKey: string
	minPlan?: 'pro' | 'premium'
}

const PLAN_LEVELS: Record<string, number> = {
	starter: 1,
	pro: 2,
	premium: 3,
}

const overviewItems: NavItem[] = [
	{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
	{ title: 'Éditeur du site', href: '/site', icon: Globe, labelKey: 'site' },
]

const contentItems: NavItem[] = [
	{ title: 'Créations', href: '/creations', icon: Palette, labelKey: 'creations' },
	{ title: 'Catégories', href: '/categories', icon: FolderOpen, labelKey: 'categories' },
	{ title: 'Produits', href: '/products', icon: ShoppingBag, labelKey: 'products', minPlan: 'pro' },
]

const operationsItems: NavItem[] = [
	{ title: 'Commandes', href: '/orders', icon: ClipboardList, labelKey: 'orders', minPlan: 'pro' },
	{ title: 'Ateliers', href: '/workshops', icon: Users, labelKey: 'workshops', minPlan: 'pro' },
]

const costingItems: NavItem[] = [
	{ title: 'Ingrédients', href: '/ingredients', icon: Package, labelKey: 'ingredients' },
	{ title: 'Équipe', href: '/employees', icon: UserCog, labelKey: 'employees' },
]

const accountItems: NavItem[] = [
	{ title: 'Paramètres', href: '/settings', icon: Settings, labelKey: 'settings' },
	{ title: 'Abonnement', href: '/billing', icon: CreditCard, labelKey: 'billing' },
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

	return `${baseUrl}/${profile.slug}`
}

function NavGroup({
	label,
	items,
	pathname,
	userPlan,
	dashboardPrefix,
	t,
}: {
	label: string
	items: NavItem[]
	pathname: string
	userPlan: string
	dashboardPrefix: string
	t: (key: string) => string
}) {
	const userLevel = PLAN_LEVELS[userPlan] || 1

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => {
						const href =
							item.href === '/dashboard' ? '/dashboard' : `${dashboardPrefix}${item.href}`
						const isActive = pathname === href || pathname.startsWith(href + '/')
						const requiredLevel = item.minPlan ? PLAN_LEVELS[item.minPlan] || 1 : 1
						const locked = userLevel < requiredLevel

						if (locked) {
							return (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton asChild tooltip={t(item.labelKey)}>
										<Link href={`${dashboardPrefix}/billing`} className="opacity-50">
											<item.icon className="size-4" />
											<span>{t(item.labelKey)}</span>
											<span className="ml-auto rounded-full bg-sidebar-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-sidebar-primary-foreground">
												{item.minPlan === 'premium' ? 'Premium' : 'Pro'}
											</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)
						}

						return (
							<SidebarMenuItem key={item.href}>
								<SidebarMenuButton asChild isActive={isActive} tooltip={t(item.labelKey)}>
									<Link href={href}>
										<item.icon className="size-4" />
										<span>{t(item.labelKey)}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const t = useTranslations('nav')
	const pathname = usePathname()
	const { user, logout } = useAuth()
	const dashboardPrefix = useDashboardPrefix()

	const siteUrl = useMemo(() => {
		if (!user?.profile?.slug) return null
		return getSiteUrl(user.profile)
	}, [user?.profile])

	const businessName = user?.profile?.businessName || 'Patissio'
	const planLabel =
		user?.profile?.plan === 'premium'
			? 'Premium'
			: user?.profile?.plan === 'pro'
				? 'Pro'
				: 'Starter'

	return (
		<RoleGuard allowedRoles={['patissier', 'superadmin']}>
			<SidebarProvider>
				<Sidebar collapsible="icon" className="border-r-0">
					<SidebarHeader className="border-b border-sidebar-border">
						<div className="flex items-center gap-2 px-2 py-2">
							{user?.profile?.logoUrl ? (
								<img
									src={getImageUrl(user.profile.logoUrl)!}
									alt=""
									className="size-8 shrink-0 rounded-lg border object-contain"
								/>
							) : (
								<div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<ChefHat className="size-4" />
								</div>
							)}
							<span className="truncate font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
								{businessName}
							</span>
						</div>
						{siteUrl && (
							<a
								href={siteUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="mx-2 mb-1 flex items-center gap-1.5 rounded-md border border-sidebar-border px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:hidden"
							>
								<ExternalLink className="size-3" />
								Voir mon site
							</a>
						)}
					</SidebarHeader>
					<SidebarContent>
						<NavGroup
							label="Vue d'ensemble"
							items={overviewItems}
							pathname={pathname}
							userPlan={user?.profile?.plan || 'starter'}
							dashboardPrefix={dashboardPrefix}
							t={t}
						/>
						<NavGroup
							label="Contenu"
							items={contentItems}
							pathname={pathname}
							userPlan={user?.profile?.plan || 'starter'}
							dashboardPrefix={dashboardPrefix}
							t={t}
						/>
						<NavGroup
							label="Opérations"
							items={operationsItems}
							pathname={pathname}
							userPlan={user?.profile?.plan || 'starter'}
							dashboardPrefix={dashboardPrefix}
							t={t}
						/>
						<NavGroup
							label="Costing"
							items={costingItems}
							pathname={pathname}
							userPlan={user?.profile?.plan || 'starter'}
							dashboardPrefix={dashboardPrefix}
							t={t}
						/>
						<NavGroup
							label="Compte"
							items={accountItems}
							pathname={pathname}
							userPlan={user?.profile?.plan || 'starter'}
							dashboardPrefix={dashboardPrefix}
							t={t}
						/>
					</SidebarContent>
					<SidebarFooter className="border-t border-sidebar-border">
						<a
							href="https://patissio.com"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 px-2 py-1.5 text-xs text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden"
						>
							<img src="/logo-patissio.png" alt="" className="size-4" />
							Propulsé par Patissio.com
						</a>
						<Separator className="bg-sidebar-border" />
						<div className="flex items-center gap-2 px-2 py-2">
							<div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
								{(user?.profile?.businessName || 'P').charAt(0).toUpperCase()}
							</div>
							<div className="flex-1 group-data-[collapsible=icon]:hidden">
								<p className="truncate text-sm font-medium text-sidebar-foreground">
									{user?.fullName || user?.email || 'Utilisateur'}
								</p>
								<p className="text-xs text-sidebar-foreground/60">{planLabel}</p>
							</div>
							<button
								type="button"
								onClick={logout}
								className="rounded-md p-1.5 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
								title="Déconnexion"
							>
								<LogOut className="size-4" />
							</button>
						</div>
					</SidebarFooter>
				</Sidebar>
				<SidebarInset>
					<header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
						<SidebarTrigger />
						<div className="flex-1" />
					</header>
					<div className="flex-1 p-4 md:p-6">
						<StripeConnectBanner />
						{children}
					</div>
				</SidebarInset>
			</SidebarProvider>
		</RoleGuard>
	)
}
