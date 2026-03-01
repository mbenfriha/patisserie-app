'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PLANS } from '@patissio/config'

function CheckIcon() {
	return (
		<svg className="h-5 w-5 shrink-0 text-gold" viewBox="0 0 20 20" fill="currentColor">
			<path
				fillRule="evenodd"
				d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
				clipRule="evenodd"
			/>
		</svg>
	)
}

function VitrineIcon() {
	return (
		<svg
			className="h-8 w-8"
			viewBox="0 0 32 32"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		>
			<rect x="3" y="6" width="26" height="20" rx="2" />
			<path d="M3 12h26" />
			<circle cx="8" cy="9" r="1" fill="currentColor" stroke="none" />
			<circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" />
			<path d="M10 20l4-5 3 3 5-6 4 5" strokeLinejoin="round" />
		</svg>
	)
}

function CommandesIcon() {
	return (
		<svg
			className="h-8 w-8"
			viewBox="0 0 32 32"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		>
			<rect x="6" y="4" width="20" height="24" rx="2" />
			<path d="M11 12h10M11 17h10M11 22h6" strokeLinecap="round" />
			<path d="M12 4V2M20 4V2" strokeLinecap="round" />
		</svg>
	)
}

function AteliersIcon() {
	return (
		<svg
			className="h-8 w-8"
			viewBox="0 0 32 32"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		>
			<rect x="4" y="6" width="24" height="22" rx="2" />
			<path d="M4 12h24" />
			<path d="M10 4v4M22 4v4" strokeLinecap="round" />
			<path d="M10 18h4v4h-4z" />
		</svg>
	)
}

const FEATURES = [
	{
		title: 'Vitrine en ligne',
		description:
			'Présentez vos créations avec de belles photos et descriptions détaillées. Votre savoir-faire mérite une vitrine à la hauteur.',
		Icon: VitrineIcon,
	},
	{
		title: 'Commandes en ligne',
		description:
			'Recevez et gérez vos commandes simplement. Paiement sécurisé, suivi en temps réel et notifications automatiques.',
		Icon: CommandesIcon,
	},
	{
		title: 'Ateliers & cours',
		description:
			"Proposez des ateliers pâtisserie avec inscription et paiement d'acompte en ligne. Gérez vos plannings facilement.",
		Icon: AteliersIcon,
	},
]

const STEPS = [
	{
		number: '1',
		title: 'Créez votre compte',
		description: 'Inscription gratuite en 2 minutes, aucune carte bancaire requise.',
	},
	{
		number: '2',
		title: 'Personnalisez votre vitrine',
		description: 'Ajoutez vos créations, définissez vos prix et configurez votre boutique.',
	},
	{
		number: '3',
		title: 'Recevez des commandes',
		description: 'Vos clients découvrent votre vitrine et commandent directement en ligne.',
	},
]

const PLAN_ENTRIES = [
	{ key: 'starter' as const, popular: false },
	{ key: 'pro' as const, popular: true },
	{ key: 'premium' as const, popular: false },
]

export function HomeContent() {
	const [scrolled, setScrolled] = useState(false)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 50)
		window.addEventListener('scroll', handleScroll, { passive: true })

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible')
					}
				}
			},
			{ threshold: 0.1 }
		)
		document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el))

		return () => {
			window.removeEventListener('scroll', handleScroll)
			observer.disconnect()
		}
	}, [])

	const scrollTo = (id: string) => {
		setMobileMenuOpen(false)
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
	}

	return (
		<div className="min-h-screen bg-[#1A1A1A]">
			{/* ── Navbar ── */}
			<nav
				className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
					scrolled || mobileMenuOpen
						? 'bg-[#1A1A1A]/95 shadow-lg backdrop-blur-md'
						: 'bg-transparent'
				}`}
			>
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<Link href="/" className="flex items-center">
						<Image
							src="/logo-patissio-full.png"
							alt="Patissio"
							width={886}
							height={368}
							className="h-[47px] w-auto"
						/>
					</Link>

					{/* Desktop nav */}
					<div className="hidden items-center gap-8 md:flex">
						<button
							type="button"
							onClick={() => scrollTo('features')}
							className="text-sm font-light text-white/70 transition-colors hover:text-gold"
						>
							Fonctionnalités
						</button>
						<button
							type="button"
							onClick={() => scrollTo('pricing')}
							className="text-sm font-light text-white/70 transition-colors hover:text-gold"
						>
							Tarifs
						</button>
						<Link
							href="/login"
							className="rounded-full border border-gold/50 px-5 py-2 text-sm font-medium text-gold transition-all hover:border-gold hover:bg-gold/10"
						>
							Se connecter
						</Link>
						<Link
							href="/register"
							className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-white transition-all hover:bg-gold-light"
						>
							Créer mon site
						</Link>
					</div>

					{/* Mobile hamburger */}
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
						aria-label="Menu"
					>
						<span
							className={`h-0.5 w-6 bg-white transition-all duration-300 ${
								mobileMenuOpen ? 'translate-y-2 rotate-45' : ''
							}`}
						/>
						<span
							className={`h-0.5 w-6 bg-white transition-all duration-300 ${
								mobileMenuOpen ? 'opacity-0' : ''
							}`}
						/>
						<span
							className={`h-0.5 w-6 bg-white transition-all duration-300 ${
								mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''
							}`}
						/>
					</button>
				</div>

				{/* Mobile menu */}
				<div
					className={`overflow-hidden transition-all duration-300 md:hidden ${
						mobileMenuOpen ? 'max-h-64' : 'max-h-0'
					}`}
				>
					<div className="flex flex-col gap-4 px-6 pb-6">
						<button
							type="button"
							onClick={() => scrollTo('features')}
							className="text-left text-sm font-light text-white/70 transition-colors hover:text-gold"
						>
							Fonctionnalités
						</button>
						<button
							type="button"
							onClick={() => scrollTo('pricing')}
							className="text-left text-sm font-light text-white/70 transition-colors hover:text-gold"
						>
							Tarifs
						</button>
						<Link
							href="/login"
							onClick={() => setMobileMenuOpen(false)}
							className="text-sm font-light text-white/70 transition-colors hover:text-gold"
						>
							Se connecter
						</Link>
						<Link
							href="/register"
							onClick={() => setMobileMenuOpen(false)}
							className="rounded-full bg-gold px-5 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-gold-light"
						>
							Créer mon site
						</Link>
					</div>
				</div>
			</nav>

			{/* ── Hero ── */}
			<section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
				{/* Background gradient */}
				<div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A] via-[#1A1A1A] to-[#111]" />

				{/* Decorative diamonds */}
				<div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
					<div className="h-[500px] w-[500px] rotate-45 rounded border border-lavender/10" />
				</div>
				<div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
					<div className="h-[350px] w-[350px] rotate-45 rounded border border-gold/[0.06]" />
				</div>

				{/* Decorative side lines */}
				<div className="pointer-events-none absolute top-1/2 left-0 h-px w-24 bg-gradient-to-r from-transparent to-lavender/20 sm:w-32" />
				<div className="pointer-events-none absolute top-1/2 right-0 h-px w-24 bg-gradient-to-l from-transparent to-lavender/20 sm:w-32" />

				<div className="animate-hero relative z-10">
					<p className="mb-6 text-xs font-light tracking-[0.3em] text-lavender/80 uppercase sm:text-sm">
						La plateforme des artisans pâtissiers
					</p>
					<h1 className="font-serif text-5xl leading-tight font-bold text-white sm:text-6xl lg:text-7xl">
						Votre vitrine
						<br />
						<span className="text-gold">pâtissière</span>
						<br />
						en ligne
					</h1>
					<p className="mx-auto mt-8 max-w-xl text-base leading-relaxed font-light text-white/60 sm:text-lg">
						Créez votre site vitrine, recevez des commandes et proposez des ateliers. Tout ce dont
						vous avez besoin pour développer votre activité.
					</p>
					<div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<Link
							href="/register"
							className="rounded-full bg-gold px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20"
						>
							Créer mon site gratuitement
						</Link>
						<button
							type="button"
							onClick={() => scrollTo('features')}
							className="rounded-full border border-white/20 px-8 py-3.5 text-sm font-medium text-white transition-all hover:border-lavender/40 hover:bg-lavender/5"
						>
							Découvrir
						</button>
					</div>
				</div>
			</section>

			{/* ── Social Proof ── */}
			<section className="relative border-y border-white/10 bg-[#151515] px-6 py-16">
				<div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
					{[
						{ value: '500+', label: 'Pâtissiers inscrits' },
						{ value: '10 000+', label: 'Commandes traitées' },
						{ value: '4.9/5', label: 'Satisfaction client' },
					].map((stat) => (
						<div key={stat.label} className="animate-on-scroll text-center">
							<p className="font-serif text-4xl font-bold text-amber">{stat.value}</p>
							<p className="mt-2 text-sm font-light tracking-wide text-white/50">{stat.label}</p>
						</div>
					))}
				</div>
			</section>

			{/* ── Features ── */}
			<section id="features" className="bg-background px-6 py-24">
				<div className="mx-auto max-w-6xl">
					<div className="animate-on-scroll text-center">
						<p className="text-sm font-light tracking-[0.2em] text-gold uppercase">
							Fonctionnalités
						</p>
						<h2 className="mt-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">
							Tout pour votre activité
						</h2>
					</div>
					<div className="mt-16 grid gap-8 sm:grid-cols-3">
						{FEATURES.map((feature, i) => (
							<div
								key={feature.title}
								className="animate-on-scroll group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl hover:shadow-gold/5"
								style={{ animationDelay: `${i * 0.15}s` }}
							>
								<div className="mb-5 inline-flex rounded-xl bg-gold/10 p-3 text-gold">
									<feature.Icon />
								</div>
								<h3 className="font-serif text-xl font-semibold text-foreground">
									{feature.title}
								</h3>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── Calendar Spotlight ── */}
			<section className="bg-[#1A1A1A] px-6 py-24">
				<div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
					{/* Text */}
					<div className="animate-on-scroll">
						<p className="text-sm font-light tracking-[0.2em] text-gold uppercase">
							Gestion simplifiée
						</p>
						<h2 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
							Pilotez votre activité au quotidien
						</h2>
						<p className="mt-6 text-base leading-relaxed font-light text-white/60">
							Commandes, devis sur-mesure, ateliers… Fini le jonglage entre carnets et tableurs.
							Retrouvez tout dans un calendrier unifié avec code couleur pour ne plus rien oublier.
						</p>
						<ul className="mt-8 space-y-4">
							<li className="flex items-center gap-3 text-sm text-white/80">
								<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
								Commandes et livraisons
							</li>
							<li className="flex items-center gap-3 text-sm text-white/80">
								<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
								Devis et demandes sur-mesure
							</li>
							<li className="flex items-center gap-3 text-sm text-white/80">
								<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" />
								Ateliers et cours
							</li>
						</ul>
						<Link
							href="/register"
							className="mt-10 inline-block rounded-full bg-gold px-8 py-3 text-sm font-medium text-white transition-all hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20"
						>
							Commencer gratuitement
						</Link>
					</div>

					{/* Calendar mockup */}
					<div className="animate-on-scroll" style={{ animationDelay: '0.2s' }}>
						<div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-gold/5">
							{/* Month header */}
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-serif text-lg font-semibold text-white">Mars 2026</h3>
								<div className="flex gap-1">
									<div className="h-7 w-7 rounded-lg bg-white/10" />
									<div className="h-7 w-7 rounded-lg bg-white/10" />
								</div>
							</div>
							{/* Day headers */}
							<div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium text-white/40">
								{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
									<div key={`${d}-${i}`} className="py-1">
										{d}
									</div>
								))}
							</div>
							{/* Calendar grid */}
							<div className="grid grid-cols-7 gap-1">
								{/* Empty cells for offset (March 2026 starts on Sunday) */}
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={`empty-${i}`} className="aspect-square" />
								))}
								{/* Days 1-28 */}
								{Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
									const isToday = day === 1
									const hasBlue = [3, 10, 17, 24].includes(day)
									const hasAmber = [5, 12, 19].includes(day)
									const hasViolet = [7, 14, 21].includes(day)
									const hasEvent = hasBlue || hasAmber || hasViolet
									return (
										<div
											key={day}
											className={`relative flex aspect-square items-center justify-center rounded-lg text-xs ${
												isToday ? 'bg-gold font-bold text-white' : 'text-white/60'
											}`}
										>
											{day}
											{hasEvent && (
												<span
													className={`absolute bottom-1 h-1 w-1 rounded-full ${
														hasBlue ? 'bg-blue-500' : hasAmber ? 'bg-amber-500' : 'bg-violet-500'
													}`}
												/>
											)}
										</div>
									)
								})}
							</div>
							{/* Mini event card */}
							<div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="h-2 w-2 rounded-full bg-blue-500" />
										<span className="text-xs font-medium text-white/80">
											Commande #1234 — Marie D.
										</span>
									</div>
									<span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
										Confirmée
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── How It Works ── */}
			<section className="bg-[#1A1A1A] px-6 py-24">
				<div className="mx-auto max-w-4xl">
					<div className="animate-on-scroll text-center">
						<p className="text-sm font-light tracking-[0.2em] text-gold uppercase">
							Simple et rapide
						</p>
						<h2 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
							Comment ça marche
						</h2>
					</div>
					<div className="relative mt-16">
						{/* Connecting line (desktop only) */}
						<div className="absolute top-8 left-1/2 hidden h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-lavender/20 via-lavender/40 to-lavender/20 sm:block" />
						<div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
							{STEPS.map((step, i) => (
								<div
									key={step.number}
									className="animate-on-scroll flex flex-col items-center text-center"
									style={{ animationDelay: `${i * 0.2}s` }}
								>
									<div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-lavender bg-[#1A1A1A] font-serif text-2xl font-bold text-lavender">
										{step.number}
									</div>
									<h3 className="mt-6 font-serif text-xl font-semibold text-white">{step.title}</h3>
									<p className="mt-3 text-sm leading-relaxed font-light text-white/50">
										{step.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ── Pricing ── */}
			<section id="pricing" className="bg-background px-6 py-24">
				<div className="mx-auto max-w-6xl">
					<div className="animate-on-scroll text-center">
						<p className="text-sm font-light tracking-[0.2em] text-gold uppercase">Tarifs</p>
						<h2 className="mt-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">
							Un plan pour chaque ambition
						</h2>
						<p className="mx-auto mt-4 max-w-lg text-muted-foreground">
							Commencez gratuitement et évoluez à votre rythme.
						</p>
					</div>
					<div className="mt-16 grid gap-8 sm:grid-cols-3">
						{PLAN_ENTRIES.map(({ key, popular }, i) => {
							const plan = PLANS[key]
							return (
								<div
									key={key}
									className={`animate-on-scroll relative rounded-2xl border p-8 transition-all duration-300 ${
										popular
											? 'z-10 border-gold bg-card shadow-2xl shadow-gold/10 sm:scale-105'
											: 'border-border bg-card hover:border-gold/30'
									}`}
									style={{ animationDelay: `${i * 0.15}s` }}
								>
									{popular && (
										<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-medium text-white">
											Populaire
										</div>
									)}
									<h3 className="font-serif text-2xl font-bold text-foreground">{plan.name}</h3>
									<div className="mt-4 flex items-baseline gap-1">
										<span className="font-serif text-4xl font-bold text-gold">
											{plan.priceMonthly === 0 ? 'Gratuit' : `${plan.priceMonthly}€`}
										</span>
										{plan.priceMonthly > 0 && (
											<span className="text-sm text-muted-foreground">/mois</span>
										)}
									</div>
									<ul className="mt-8 space-y-4">
										{plan.features.map((feature) => (
											<li
												key={feature}
												className="flex items-start gap-3 text-sm text-foreground/80"
											>
												<CheckIcon />
												<span>{feature}</span>
											</li>
										))}
									</ul>
									<Link
										href="/register"
										className={`mt-8 block rounded-full py-3 text-center text-sm font-medium transition-all ${
											popular
												? 'bg-gold text-white hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20'
												: 'border border-gold/50 text-gold hover:border-gold hover:bg-gold/10'
										}`}
									>
										{plan.priceMonthly === 0 ? 'Commencer gratuitement' : 'Choisir ce plan'}
									</Link>
								</div>
							)
						})}
					</div>
				</div>
			</section>

			{/* ── CTA Final ── */}
			<section className="bg-[#1A1A1A] px-6 py-24">
				<div className="animate-on-scroll mx-auto max-w-2xl text-center">
					<h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
						Prêt à lancer votre vitrine ?
					</h2>
					<p className="mt-6 text-lg font-light text-white/50">
						Rejoignez des centaines de pâtissiers qui développent leur activité grâce à Patissio.
					</p>
					<Link
						href="/register"
						className="mt-10 inline-block rounded-full bg-gold px-10 py-4 text-sm font-medium text-white transition-all hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20"
					>
						Créer mon site gratuitement
					</Link>
				</div>
			</section>

			{/* ── Footer ── */}
			<footer className="border-t border-white/10 bg-[#111] px-6 py-8">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
					<div className="flex items-center gap-3">
						<Image
							src="/logo-patissio-full.png"
							alt="Patissio"
							width={886}
							height={368}
							className="h-6 w-auto opacity-40"
						/>
						<p className="text-sm text-white/30">
							&copy; {new Date().getFullYear()} Tous droits réservés.
						</p>
					</div>
					<Link
						href="/privacy"
						className="text-sm text-white/30 transition-colors hover:text-white/50"
					>
						Politique de confidentialité
					</Link>
				</div>
			</footer>
		</div>
	)
}
