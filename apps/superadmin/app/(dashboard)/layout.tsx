'use client'

import {
	BarChart3,
	CalendarDays,
	CreditCard,
	Home,
	Loader2,
	LogOut,
	ShoppingBag,
	Store,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api/client'

const navItems = [
	{ href: '/', label: 'Dashboard', icon: Home },
	{ href: '/users', label: 'Utilisateurs', icon: Users },
	{ href: '/patissiers', label: 'Patissiers', icon: Store },
	{ href: '/orders', label: 'Commandes', icon: ShoppingBag },
	{ href: '/workshops', label: 'Ateliers', icon: CalendarDays },
	{ href: '/subscriptions', label: 'Abonnements', icon: CreditCard },
	{ href: '/stats', label: 'Statistiques', icon: BarChart3 },
]

interface User {
	id: string
	email: string
	fullName: string | null
	role: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const fetchMe = async () => {
			try {
				const data = await api.get<{ user: User }>('/auth/me')
				setUser(data.user)
			} catch (err) {
				if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
					document.cookie = 'superadmin_token=; path=/; max-age=0'
					router.push('/login')
				}
			} finally {
				setIsLoading(false)
			}
		}
		fetchMe()
	}, [router])

	const handleLogout = () => {
		document.cookie = 'superadmin_token=; path=/; max-age=0'
		router.push('/login')
	}

	if (isLoading) {
		return (
			<main className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-background flex">
			{/* Sidebar */}
			<aside className="w-64 border-r border-border bg-card min-h-screen flex flex-col">
				<div className="p-6 border-b border-border">
					<h1 className="text-lg font-bold text-foreground">Patisserie Admin</h1>
					{user && (
						<p className="text-sm text-muted-foreground mt-1 truncate">{user.email}</p>
					)}
				</div>

				<nav className="flex-1 p-4 space-y-1">
					{navItems.map((item) => {
						const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
						const Icon = item.icon
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
									isActive
										? 'bg-primary/10 text-primary'
										: 'text-muted-foreground hover:text-foreground hover:bg-secondary'
								}`}
							>
								<Icon className="w-4 h-4" />
								{item.label}
							</Link>
						)
					})}
				</nav>

				<div className="p-4 border-t border-border">
					<button
						onClick={handleLogout}
						className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors w-full"
					>
						<LogOut className="w-4 h-4" />
						Deconnexion
					</button>
				</div>
			</aside>

			{/* Content */}
			<div className="flex-1 p-8 overflow-auto">
				{children}
			</div>
		</main>
	)
}
