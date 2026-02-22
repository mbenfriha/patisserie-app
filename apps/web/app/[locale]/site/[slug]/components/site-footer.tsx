'use client'

import Link from 'next/link'
import { useSiteProfile, useSiteBasePath } from '../site-provider'
import { useAuth } from '@/lib/providers/auth-provider'

export function SiteFooter() {
	const profile = useSiteProfile()
	const basePath = useSiteBasePath()
	const { isAuthenticated } = useAuth()

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
		<footer className="border-t border-[var(--gold)]/20 bg-[#1A1A1A] px-6 pt-16 pb-8 text-center">
			{/* Business name */}
			<Link href={basePath || '/'} className="inline-block">
				<span
					className="font-[family-name:'Great_Vibes'] text-4xl text-[var(--gold)]"
					style={{ letterSpacing: 1 }}
				>
					{profile.businessName}
				</span>
			</Link>

			{/* Description */}
			{profile.description && (
				<p className="mx-auto mt-4 max-w-md font-[family-name:'Cormorant_Garamond'] text-base text-white/50 italic">
					{profile.description}
				</p>
			)}

			{/* Navigation links */}
			<div className="mt-6 flex flex-wrap items-center justify-center gap-8">
				{navLinks.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						className="font-[family-name:'Josefin_Sans'] text-[13px] tracking-[1px] text-white/50 transition-colors duration-300 hover:text-[var(--gold)]"
					>
						{link.label}
					</Link>
				))}
			</div>

			{/* Social links */}
			{instagramUrl && (
				<div className="mt-6">
					<a
						href={instagramUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-flex text-[var(--gold)] opacity-70 transition-opacity duration-300 hover:opacity-100"
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
				</div>
			)}

			{/* Contact info */}
			{(profile.phone || profile.addressCity) && (
				<div className="mt-6 flex flex-col items-center gap-1">
					{profile.phone && (
						<a
							href={`tel:${profile.phone}`}
							className="font-[family-name:'Josefin_Sans'] text-xs text-white/40 transition-colors duration-300 hover:text-[var(--gold)]"
						>
							{profile.phone}
						</a>
					)}
					{profile.addressCity && (
						<span className="font-[family-name:'Josefin_Sans'] text-xs text-white/40">
							{profile.addressStreet && `${profile.addressStreet}, `}
							{profile.addressZip && `${profile.addressZip} `}
							{profile.addressCity}
						</span>
					)}
				</div>
			)}

			{/* Divider */}
			<div className="mx-auto mt-8 flex items-center justify-center gap-4">
				<div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--gold)]/40" />
				<div className="h-2 w-2 rotate-45 bg-[var(--gold)]/40" />
				<div className="h-px w-16 bg-gradient-to-r from-[var(--gold)]/40 to-transparent" />
			</div>

			{/* Login link */}
			{!isAuthenticated && (
				<div className="mt-6">
					<Link
						href="/login"
						className="font-[family-name:'Josefin_Sans'] text-xs tracking-[1px] text-white/30 transition-colors duration-300 hover:text-[var(--gold)]"
					>
						Espace professionnel
					</Link>
				</div>
			)}

			{/* Copyright */}
			<p className="mt-6 font-[family-name:'Josefin_Sans'] text-xs text-white/30">
				&copy; {new Date().getFullYear()} {profile.businessName} &mdash; Tous
				droits r&eacute;serv&eacute;s.
			</p>
		</footer>
	)
}
