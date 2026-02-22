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
		{ href: `${basePath}/#notre-histoire`, label: 'Notre histoire' },
	]

	const instagramUrl = profile.socialLinks?.instagram

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

					{/* Instagram link */}
					{instagramUrl && (
						<a
							href={instagramUrl}
							target="_blank"
							rel="noreferrer"
							className="hidden text-[var(--gold)] opacity-80 transition-opacity duration-300 hover:opacity-100 md:flex"
							aria-label="Instagram"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
							</svg>
						</a>
					)}

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
					{instagramUrl && (
						<a
							href={instagramUrl}
							target="_blank"
							rel="noreferrer"
							className="mt-4 flex items-center gap-2 text-[var(--gold)] opacity-80 transition-opacity duration-300 hover:opacity-100"
							aria-label="Instagram"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
							</svg>
							<span className="font-[family-name:'Josefin_Sans'] text-[13px] tracking-[1px]">
								Instagram
							</span>
						</a>
					)}
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
