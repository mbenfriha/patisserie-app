'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSiteProfile, useSiteBasePath } from '../site-provider'
import { useAuth } from '@/lib/providers/auth-provider'
import { getImageUrl } from '@/lib/utils/image-url'

export function SiteNavbar() {
	const profile = useSiteProfile()
	const basePath = useSiteBasePath()
	const { user } = useAuth()
	const [scrolled, setScrolled] = useState(false)
	const [mobileOpen, setMobileOpen] = useState(false)

	const isOwner = user?.role === 'patissier' && user?.profile?.slug === profile.slug

	const handleScroll = useCallback(() => {
		setScrolled(window.scrollY > 20)
	}, [])

	useEffect(() => {
		window.addEventListener('scroll', handleScroll, { passive: true })
		handleScroll()
		return () => window.removeEventListener('scroll', handleScroll)
	}, [handleScroll])

	// Close mobile menu on route change / resize
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth > 768) {
				setMobileOpen(false)
			}
		}
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const navLinks = [
		{ href: basePath || '/', label: 'Accueil' },
		{ href: `${basePath}/creations`, label: 'Nos créations' },
		{ href: `${basePath}/workshops`, label: 'Les ateliers' },
		...(profile.ordersEnabled
			? [{ href: `${basePath}/commandes`, label: 'Commander' }]
			: []),
		{ href: `${basePath}/#story`, label: 'Notre histoire' },
	]

	return (
		<nav
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
				scrolled
					? 'bg-[#1A1A1A]/97 backdrop-blur-lg border-b border-[var(--gold)]/20 py-3'
					: 'bg-[#1A1A1A]/80 backdrop-blur-md py-5'
			}`}
		>
			<div className="mx-auto flex max-w-[1200px] items-center justify-between px-6">
				{/* Logo / Business Name */}
				<Link href={basePath || '/'} className="block">
					{profile.logoUrl ? (
						<img
							src={getImageUrl(profile.logoUrl)!}
							alt={profile.businessName}
							className="h-10 w-auto object-contain"
						/>
					) : (
						<span
							className="font-[family-name:'Great_Vibes'] text-[32px] text-[var(--gold)]"
							style={{ letterSpacing: 1 }}
						>
							{profile.businessName}
						</span>
					)}
				</Link>

				{/* Desktop nav links */}
				<div className="flex items-center gap-8">
					<div className="hidden items-center gap-7 md:flex">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="group relative pb-1 font-[family-name:'Josefin_Sans'] text-[13px] font-normal uppercase tracking-[2px] text-white/80 transition-colors duration-300 hover:text-[var(--gold)]"
							>
								{link.label}
								<span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
							</Link>
						))}
					</div>

	
					{/* Backoffice link for owner */}
					{isOwner && (
						<Link
							href="/dashboard"
							className="hidden items-center gap-1.5 rounded-full border border-[var(--gold)]/40 px-3 py-1.5 font-[family-name:'Josefin_Sans'] text-[12px] tracking-[1px] text-[var(--gold)] transition-all duration-300 hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 md:flex"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<rect x="3" y="3" width="7" height="7" />
								<rect x="14" y="3" width="7" height="7" />
								<rect x="3" y="14" width="7" height="7" />
								<rect x="14" y="14" width="7" height="7" />
							</svg>
							Backoffice
						</Link>
					)}

					{/* Mobile hamburger */}
					<button
						onClick={() => setMobileOpen(!mobileOpen)}
						className="flex items-center text-white md:hidden"
						aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
					>
						{mobileOpen ? (
							<svg
								width="24"
								height="24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<path d="M18 6L6 18M6 6l12 12" />
							</svg>
						) : (
							<svg
								width="24"
								height="24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<path d="M3 12h18M3 6h18M3 18h18" />
							</svg>
						)}
					</button>
				</div>
			</div>

			{/* Mobile menu */}
			{mobileOpen && (
				<div className="absolute top-full right-0 left-0 flex animate-[fadeIn_0.3s_ease-out] flex-col bg-[#1A1A1A]/98 p-6 backdrop-blur-xl md:hidden">
					{navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							onClick={() => setMobileOpen(false)}
							className="border-b border-white/10 py-3 font-[family-name:'Josefin_Sans'] text-[15px] uppercase tracking-[2px] text-white/80 transition-colors duration-300 hover:text-[var(--gold)]"
						>
							{link.label}
						</Link>
					))}
						{isOwner && (
						<Link
							href="/dashboard"
							onClick={() => setMobileOpen(false)}
							className="mt-4 flex items-center gap-2 rounded-full border border-[var(--gold)]/40 px-4 py-2 font-[family-name:'Josefin_Sans'] text-[13px] tracking-[1px] text-[var(--gold)] transition-all duration-300 hover:bg-[var(--gold)]/10"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<rect x="3" y="3" width="7" height="7" />
								<rect x="14" y="3" width="7" height="7" />
								<rect x="3" y="14" width="7" height="7" />
								<rect x="14" y="14" width="7" height="7" />
							</svg>
							Backoffice
						</Link>
					)}
				</div>
			)}
		</nav>
	)
}
