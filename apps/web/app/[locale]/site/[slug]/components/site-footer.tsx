'use client'

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
			<a href={basePath || '/'} className="inline-block">
				<span
					className="font-[family-name:'Great_Vibes'] text-4xl text-[var(--gold)]"
					style={{ letterSpacing: 1 }}
				>
					{profile.businessName}
				</span>
			</a>

			{/* Description */}
			{profile.description && (
				<p className="mx-auto mt-4 max-w-md font-[family-name:'Cormorant_Garamond'] text-base text-white/50 italic">
					{profile.description}
				</p>
			)}

			{/* Navigation links */}
			<div className="mt-6 flex flex-wrap items-center justify-center gap-8">
				{navLinks.map((link) => (
					<a
						key={link.href}
						href={link.href}
						className="font-[family-name:'Josefin_Sans'] text-[13px] tracking-[1px] text-white/50 transition-colors duration-300 hover:text-[var(--gold)]"
					>
						{link.label}
					</a>
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
							<svg width="20" height="20" viewBox="0 -0.5 20 20" fill="currentColor"><path d="M10.125531,19 C8.838531,19 8.277531,18.71061 7.183531,17.92743 C6.193531,17.21913 5.558531,16.82957 3.720531,17.19283 C3.003531,17.33449 3.017531,17.26973 2.863531,16.55333 C2.781531,16.17591 2.722531,15.94622 2.582531,15.92396 C1.089531,15.69123 0.206531,15.3472 0.030531,14.93133 C-0.053469,14.73098 0.046531,14.57313 0.200531,14.54682 C2.147531,14.22303 3.721531,12.58888 4.404531,10.97902 C4.406531,10.97497 4.407531,10.97092 4.409531,10.96789 C4.582531,10.61374 4.616531,10.30816 4.512531,10.05924 C4.277531,9.49867 3.520531,9.3813 2.977531,9.16274 C2.603531,9.01298 1.988531,8.69728 2.070531,8.26219 C2.145531,7.86352 2.784531,7.61055 3.126531,7.77245 C3.985531,8.18023 4.673531,8.05577 4.879531,7.86352 C4.869531,7.66823 4.999531,7.45675 4.999531,7.25843 C4.999531,5.87927 4.651531,4.16316 5.085531,3.17963 C6.958531,-1.07016 13.206531,-1.04891 15.069531,3.17761 C15.503531,4.16215 15.396531,5.87927 15.310531,7.26045 L15.306531,7.32622 C15.294531,7.51341 15.283531,7.69049 15.274531,7.8625 C15.314531,7.89994 15.475531,8.02946 15.804531,8.04261 C16.083531,8.03148 16.405531,7.94042 16.759531,7.77245 C17.176531,7.57514 17.927531,7.87768 17.935531,8.33099 C17.939531,8.54247 17.784531,8.85817 17.021531,9.16274 C16.480531,9.37927 15.721531,9.49867 15.487531,10.05924 C15.382531,10.30816 15.416531,10.61374 15.589531,10.96688 C15.591531,10.97092 15.592531,10.97497 15.594531,10.97902 C15.647531,11.1055 16.932531,14.06923 19.798531,14.54682 C19.919531,14.56706 20.006531,14.67634 19.999531,14.79979 C19.996531,14.84431 19.986531,14.88883 19.967531,14.93234 C19.792531,15.34619 18.910531,15.68921 17.416531,15.92193 C17.276531,15.9442 17.217531,16.17389 17.136531,16.54929 C17.013531,17.11997 17.032531,17.31627 16.278531,17.16652 C14.460531,16.80832 13.771531,17.24139 12.816531,17.9244 C12.112531,18.4283 11.316531,19 10.125531,19" /></svg>
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
					<a
						href="/login"
						className="font-[family-name:'Josefin_Sans'] text-xs tracking-[1px] text-white/30 transition-colors duration-300 hover:text-[var(--gold)]"
					>
						Espace professionnel
					</a>
				</div>
			)}

			{/* Copyright */}
			<p className="mt-6 font-[family-name:'Josefin_Sans'] text-xs text-white/30">
				&copy; {new Date().getFullYear()} {profile.businessName} &mdash; Tous
				droits r&eacute;serv&eacute;s.
			</p>

			{/* Patissio attribution (Premium: discrete footer text) */}
			{profile.plan === 'premium' && (
				<p className="mt-3 font-[family-name:'Josefin_Sans'] text-[10px] text-white/20">
					Site créé avec{' '}
					<a
						href="https://patissio.com"
						target="_blank"
						rel="noreferrer"
						className="underline transition-colors duration-300 hover:text-white/40"
					>
						Patissio.com
					</a>
				</p>
			)}
		</footer>
	)
}
