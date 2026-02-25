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
		{ href: `${basePath}/#story`, label: 'Notre histoire' },
	]

	const social = profile.socialLinks || {}
	const hasSocialLinks = social.instagram || social.facebook || social.tiktok || social.snapchat || social.linkedin || social.youtube || social.customUrl

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
			{hasSocialLinks && (
				<div className="mt-6 flex items-center justify-center gap-4">
					{social.instagram && (
						<a href={social.instagram} target="_blank" rel="noreferrer" className="text-[var(--gold)] opacity-70 transition-opacity duration-300 hover:opacity-100" aria-label="Instagram">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
						</a>
					)}
					{social.facebook && (
						<a href={social.facebook} target="_blank" rel="noreferrer" className="text-[var(--gold)] opacity-70 transition-opacity duration-300 hover:opacity-100" aria-label="Facebook">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
						</a>
					)}
					{social.tiktok && (
						<a href={social.tiktok} target="_blank" rel="noreferrer" className="text-[var(--gold)] opacity-70 transition-opacity duration-300 hover:opacity-100" aria-label="TikTok">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
						</a>
					)}
					{social.snapchat && (
						<a href={social.snapchat} target="_blank" rel="noreferrer" className="text-[var(--gold)] opacity-70 transition-opacity duration-300 hover:opacity-100" aria-label="Snapchat">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.214.04-.012.06-.012.1-.012.16 0 .36.048.508.144.18.12.27.3.27.49 0 .21-.12.42-.341.544-.36.2-.76.27-1.11.42-.06.024-.12.06-.181.09l-.031.018c-.12.06-.18.12-.24.204-.06.096-.09.204-.068.328.136.96.386 1.92.779 2.637.173.31.404.606.664.867.078.078.104.144.104.21 0 .18-.153.36-.462.462a6.91 6.91 0 01-.614.15c-.245.05-.473.085-.723.144-.15.036-.225.098-.27.204-.048.12-.038.27.018.408.018.03.03.06.03.09 0 .15-.12.313-.384.385-.36.098-.733.135-1.11.18-.203.024-.404.048-.592.084-.18.036-.33.117-.45.225-.135.12-.225.27-.27.405-.048.135-.06.26-.06.375 0 .24.135.42.375.51.36.12.72.18 1.08.27.18.045.36.09.525.15.245.09.48.204.66.357.24.204.36.48.36.78 0 .42-.27.84-.72 1.08-.45.24-1.11.36-1.86.36-.6 0-1.14-.066-1.47-.12-.348-.056-.687-.156-1.014-.276-.78-.285-1.23-.57-2.01-.57-.765 0-1.215.285-1.995.57-.33.12-.675.22-1.032.276-.33.054-.87.12-1.47.12-.75 0-1.41-.12-1.86-.36C1.272 21.57 1 21.15 1 20.73c0-.3.12-.576.36-.78.18-.153.414-.27.66-.357.165-.06.345-.105.525-.15.36-.09.72-.15 1.08-.27.24-.09.375-.27.375-.51 0-.115-.012-.24-.06-.375-.045-.135-.135-.285-.27-.405-.12-.108-.27-.189-.45-.225-.188-.036-.39-.06-.592-.084-.377-.045-.75-.082-1.11-.18-.264-.072-.384-.234-.384-.385 0-.03.012-.06.03-.09.056-.138.066-.288.018-.408-.045-.106-.12-.168-.27-.204-.25-.059-.478-.094-.723-.144a6.91 6.91 0 01-.614-.15c-.31-.102-.462-.282-.462-.462 0-.066.026-.132.104-.21.26-.261.49-.558.664-.867.393-.717.643-1.677.779-2.637.022-.124-.008-.232-.068-.328-.06-.084-.12-.144-.24-.204l-.031-.018a1.32 1.32 0 01-.181-.09c-.35-.15-.75-.22-1.11-.42A.53.53 0 010 10.676c0-.19.09-.37.27-.49.148-.096.348-.144.508-.144.04 0 .06 0 .1.012.263.094.622.198.922.214.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.3-4.847C4.047 1.07 7.405.793 8.394.793h3.812z" /></svg>
						</a>
					)}
					{social.linkedin && (
						<a href={social.linkedin} target="_blank" rel="noreferrer" className="text-[var(--gold)] opacity-70 transition-opacity duration-300 hover:opacity-100" aria-label="LinkedIn">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
						</a>
					)}
					{social.youtube && (
						<a href={social.youtube} target="_blank" rel="noreferrer" className="text-[var(--gold)] opacity-70 transition-opacity duration-300 hover:opacity-100" aria-label="YouTube">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
						</a>
					)}
					{social.customUrl && (
						<a href={social.customUrl} target="_blank" rel="noreferrer" className="text-[var(--gold)] opacity-70 transition-opacity duration-300 hover:opacity-100" aria-label={social.customLabel || 'Lien'}>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
						</a>
					)}
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
