'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PLANS, PLATFORM_FEE_PERCENT } from '@patissio/config'

type PlanKey = keyof typeof PLANS

const PLAN_ENTRIES: { key: PlanKey; popular: boolean }[] = [
	{ key: 'starter', popular: false },
	{ key: 'pro', popular: true },
	{ key: 'premium', popular: false },
]

const FEATURES = [
	{
		title: 'Vitrine en ligne',
		description:
			'Présentez vos créations avec de belles photos et descriptions détaillées. Votre savoir-faire mérite une vitrine à la hauteur.',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5">
				<rect x="2" y="3" width="20" height="18" rx="2" />
				<path d="M2 9h20" />
				<circle cx="5.5" cy="6" r=".75" fill="currentColor" stroke="none" />
				<circle cx="8" cy="6" r=".75" fill="currentColor" stroke="none" />
				<path d="M8 16l3-4 2.5 2.5L17 10l3 4" strokeLinejoin="round" />
			</svg>
		),
	},
	{
		title: 'Commandes en ligne',
		description:
			'Recevez et gérez vos commandes simplement. Paiement sécurisé, suivi en temps réel et notifications automatiques.',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5">
				<rect x="4" y="2" width="16" height="20" rx="2" />
				<path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
			</svg>
		),
	},
	{
		title: 'Ateliers & cours',
		description:
			"Proposez des ateliers pâtisserie avec inscription et paiement d'acompte en ligne. Gérez vos plannings facilement.",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5">
				<rect x="3" y="4" width="18" height="18" rx="2" />
				<path d="M3 10h18" />
				<path d="M8 2v4M16 2v4" strokeLinecap="round" />
				<path d="M8 15h3v3H8z" />
			</svg>
		),
	},
	{
		title: 'Paiements sécurisés',
		description:
			'Paiements par carte via Stripe, acomptes configurables et suivi des transactions. Recevez vos fonds directement.',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5">
				<rect x="2" y="5" width="20" height="14" rx="2" />
				<path d="M2 10h20" />
				<path d="M6 15h4" strokeLinecap="round" />
			</svg>
		),
	},
]

const STEPS = [
	{
		number: '01',
		title: 'Créez votre compte',
		description: 'Inscription gratuite en 2 minutes. Aucune carte bancaire requise.',
	},
	{
		number: '02',
		title: 'Personnalisez votre vitrine',
		description: 'Ajoutez vos créations, définissez vos prix et configurez votre boutique.',
	},
	{
		number: '03',
		title: 'Recevez des commandes',
		description: 'Vos clients découvrent votre vitrine et commandent directement en ligne.',
	},
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
				className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
					scrolled || mobileMenuOpen
						? 'bg-[#1A1A1A]/90 shadow-2xl shadow-black/20 backdrop-blur-xl'
						: 'bg-transparent'
				}`}
			>
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
					<Link href="/" className="flex items-center">
						<Image
							src="/logo-patissio-full.png"
							alt="Patissio"
							width={886}
							height={368}
							className="h-[42px] w-auto"
							priority
						/>
					</Link>

					{/* Desktop */}
					<div className="hidden items-center gap-8 md:flex">
						<button
							type="button"
							onClick={() => scrollTo('features')}
							className="text-[13px] font-light tracking-wide text-white/60 transition-colors hover:text-white"
						>
							Fonctionnalités
						</button>
						<button
							type="button"
							onClick={() => scrollTo('pricing')}
							className="text-[13px] font-light tracking-wide text-white/60 transition-colors hover:text-white"
						>
							Tarifs
						</button>
						<Link
							href="/login"
							className="text-[13px] font-light tracking-wide text-white/60 transition-colors hover:text-white"
						>
							Se connecter
						</Link>
						<Link
							href="/register"
							className="rounded-full bg-gold px-6 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-gold-light hover:shadow-lg hover:shadow-gold/25"
						>
							Commencer gratuitement
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
							className={`h-px w-5 bg-white/80 transition-all duration-300 ${
								mobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''
							}`}
						/>
						<span
							className={`h-px w-5 bg-white/80 transition-all duration-300 ${
								mobileMenuOpen ? 'opacity-0' : ''
							}`}
						/>
						<span
							className={`h-px w-5 bg-white/80 transition-all duration-300 ${
								mobileMenuOpen ? '-translate-y-[7px] -rotate-45' : ''
							}`}
						/>
					</button>
				</div>

				{/* Mobile menu */}
				<div
					className={`overflow-hidden transition-all duration-300 md:hidden ${
						mobileMenuOpen ? 'max-h-72' : 'max-h-0'
					}`}
				>
					<div className="flex flex-col gap-4 px-6 pb-6">
						<button
							type="button"
							onClick={() => scrollTo('features')}
							className="text-left text-sm font-light text-white/60 transition-colors hover:text-white"
						>
							Fonctionnalités
						</button>
						<button
							type="button"
							onClick={() => scrollTo('pricing')}
							className="text-left text-sm font-light text-white/60 transition-colors hover:text-white"
						>
							Tarifs
						</button>
						<Link
							href="/login"
							onClick={() => setMobileMenuOpen(false)}
							className="text-sm font-light text-white/60 transition-colors hover:text-white"
						>
							Se connecter
						</Link>
						<Link
							href="/register"
							onClick={() => setMobileMenuOpen(false)}
							className="rounded-full bg-gold px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-gold-light"
						>
							Commencer gratuitement
						</Link>
					</div>
				</div>
			</nav>

			{/* ── Hero ── */}
			<section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6">
				{/* Background layers */}
				<div className="absolute inset-0 bg-[#1A1A1A]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,129,106,0.15),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(184,169,212,0.08),transparent)]" />

				{/* Subtle grain overlay */}
				<div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

				{/* Decorative elements */}
				<div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
					<div className="hero-ring h-[600px] w-[600px] rounded-full border border-white/[0.03]" />
				</div>
				<div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
					<div className="hero-ring-delayed h-[400px] w-[400px] rounded-full border border-gold/[0.06]" />
				</div>

				{/* Content */}
				<div className="animate-hero relative z-10 mx-auto max-w-4xl text-center">
					<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 backdrop-blur-sm">
						<span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
						<span className="text-xs font-light tracking-widest text-white/50 uppercase">
							La plateforme des artisans pâtissiers
						</span>
					</div>

					<h1 className="font-serif text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.05] font-bold tracking-tight text-white">
						Votre vitrine
						<br />
						<span className="landing-gradient-text">pâtissière</span>
						<br />
						en ligne
					</h1>

					<p className="mx-auto mt-8 max-w-lg text-base leading-relaxed font-light text-white/45 sm:text-lg">
						Créez votre site, recevez des commandes et proposez des ateliers.
						<span className="text-white/65"> Tout ce qu&apos;il faut pour développer votre activité.</span>
					</p>

					<div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<Link
							href="/register"
							className="group relative rounded-full bg-gold px-8 py-4 text-sm font-medium text-white transition-all duration-300 hover:bg-gold-light hover:shadow-2xl hover:shadow-gold/30"
						>
							<span className="relative z-10">Créer mon site gratuitement</span>
						</Link>
						<button
							type="button"
							onClick={() => scrollTo('features')}
							className="flex items-center gap-2 rounded-full px-8 py-4 text-sm font-light text-white/60 transition-all hover:text-white"
						>
							En savoir plus
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
								<path d="M19 9l-7 7-7-7" />
							</svg>
						</button>
					</div>

					<p className="mt-6 text-xs font-light text-white/30">
						Gratuit pour démarrer — Aucune carte bancaire requise
					</p>
				</div>

				{/* Scroll indicator */}
				<div className="absolute bottom-8 left-1/2 -translate-x-1/2">
					<div className="flex h-8 w-5 items-start justify-center rounded-full border border-white/15 p-1.5">
						<div className="h-1.5 w-0.5 animate-bounce rounded-full bg-white/30" />
					</div>
				</div>
			</section>

			{/* ── Social Proof ── */}
			<section className="relative border-y border-white/[0.06] bg-[#161616] px-6 py-16">
				<div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
					{[
						{ value: '500+', label: 'Pâtissiers inscrits' },
						{ value: '10 000+', label: 'Commandes traitées' },
						{ value: '4.9/5', label: 'Satisfaction client' },
					].map((stat, i) => (
						<div
							key={stat.label}
							className="animate-on-scroll text-center"
							style={{ animationDelay: `${i * 0.1}s` }}
						>
							<p className="font-serif text-4xl font-bold text-white sm:text-5xl">{stat.value}</p>
							<p className="mt-3 text-[13px] font-light tracking-widest text-white/35 uppercase">
								{stat.label}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* ── Features ── */}
			<section id="features" className="relative overflow-hidden bg-background px-6 py-28 lg:py-32">
				{/* Decorative background */}
				<div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-gold/[0.04] blur-3xl" />
				<div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-lavender/[0.04] blur-3xl" />

				<div className="mx-auto max-w-6xl">
					<div className="animate-on-scroll mx-auto max-w-2xl text-center">
						<p className="text-xs font-medium tracking-[0.25em] text-gold uppercase">
							Fonctionnalités
						</p>
						<h2 className="mt-4 font-serif text-4xl font-bold text-foreground sm:text-5xl">
							Tout pour développer
							<br />
							<span className="text-gold">votre activité</span>
						</h2>
						<p className="mt-5 text-base font-light leading-relaxed text-muted-foreground">
							Une plateforme pensée pour les artisans pâtissiers, avec tous les outils pour se faire
							connaître et gérer son activité.
						</p>
					</div>

					<div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{FEATURES.map((feature, i) => (
							<div
								key={feature.title}
								className="animate-on-scroll group relative rounded-2xl border border-border bg-card p-7 transition-all duration-500 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/[0.06]"
								style={{ animationDelay: `${i * 0.1}s` }}
							>
								<div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-white">
									{feature.icon}
								</div>
								<h3 className="text-[15px] font-semibold text-foreground">
									{feature.title}
								</h3>
								<p className="mt-2.5 text-[13px] leading-relaxed font-light text-muted-foreground">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── Dashboard Preview ── */}
			<section className="relative overflow-hidden bg-[#1A1A1A] px-6 py-28 lg:py-32">
				{/* Subtle glow behind the mockup */}
				<div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.05] blur-[100px]" />

				<div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
					{/* Text */}
					<div className="animate-on-scroll">
						<p className="text-xs font-medium tracking-[0.25em] text-gold uppercase">
							Gestion simplifiée
						</p>
						<h2 className="mt-4 font-serif text-4xl font-bold text-white sm:text-5xl">
							Tout au
							<br />
							même endroit
						</h2>
						<p className="mt-6 max-w-md text-base leading-relaxed font-light text-white/50">
							Commandes, devis sur-mesure, ateliers… Retrouvez tout dans un calendrier unifié.
							Fini le jonglage entre carnets et tableurs.
						</p>

						<div className="mt-10 space-y-4">
							{[
								{ color: 'bg-blue-400', label: 'Commandes et livraisons' },
								{ color: 'bg-amber-400', label: 'Devis et demandes sur-mesure' },
								{ color: 'bg-violet-400', label: 'Ateliers et cours' },
							].map((item) => (
								<div key={item.label} className="flex items-center gap-3">
									<span className={`h-2 w-2 rounded-full ${item.color}`} />
									<span className="text-sm font-light text-white/70">{item.label}</span>
								</div>
							))}
						</div>

						<Link
							href="/register"
							className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-gold-light"
						>
							Commencer gratuitement
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
								<path d="M5 12h14M12 5l7 7-7 7" />
							</svg>
						</Link>
					</div>

					{/* Calendar mockup */}
					<div className="animate-on-scroll" style={{ animationDelay: '0.15s' }}>
						<div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl backdrop-blur-sm">
							{/* Month header */}
							<div className="mb-5 flex items-center justify-between">
								<h3 className="font-serif text-lg font-semibold text-white">Mars 2026</h3>
								<div className="flex gap-1">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-white/40">
										<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" /></svg>
									</div>
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-white/40">
										<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
									</div>
								</div>
							</div>

							{/* Day headers */}
							<div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium text-white/30">
								{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
									<div key={`${d}-${i}`} className="py-1">{d}</div>
								))}
							</div>

							{/* Calendar grid */}
							<div className="grid grid-cols-7 gap-0.5">
								{/* offset for March 2026 (starts Sunday) */}
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={`e-${i}`} className="aspect-square" />
								))}
								{Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
									const isToday = day === 6
									const hasBlue = [3, 10, 17, 24].includes(day)
									const hasAmber = [5, 12, 19].includes(day)
									const hasViolet = [7, 14, 21].includes(day)
									const hasEvent = hasBlue || hasAmber || hasViolet
									return (
										<div
											key={day}
											className={`relative flex aspect-square items-center justify-center rounded-lg text-xs transition-colors ${
												isToday
													? 'bg-gold font-semibold text-white'
													: hasEvent
														? 'text-white/70'
														: 'text-white/35'
											}`}
										>
											{day}
											{hasEvent && !isToday && (
												<span
													className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
														hasBlue ? 'bg-blue-400' : hasAmber ? 'bg-amber-400' : 'bg-violet-400'
													}`}
												/>
											)}
										</div>
									)
								})}
							</div>

							{/* Mini event cards */}
							<div className="mt-4 space-y-2">
								<div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
									<div className="flex items-center gap-2.5">
										<span className="h-2 w-2 rounded-full bg-blue-400" />
										<span className="text-xs font-medium text-white/75">Commande #1234 — Marie D.</span>
									</div>
									<span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
										Confirmée
									</span>
								</div>
								<div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
									<div className="flex items-center gap-2.5">
										<span className="h-2 w-2 rounded-full bg-amber-400" />
										<span className="text-xs font-medium text-white/75">Devis #5678 — Lucas P.</span>
									</div>
									<span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
										En attente
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── How It Works ── */}
			<section className="relative bg-background px-6 py-28 lg:py-32">
				<div className="mx-auto max-w-5xl">
					<div className="animate-on-scroll mx-auto max-w-2xl text-center">
						<p className="text-xs font-medium tracking-[0.25em] text-gold uppercase">
							Simple et rapide
						</p>
						<h2 className="mt-4 font-serif text-4xl font-bold text-foreground sm:text-5xl">
							Lancez-vous en
							<br />
							<span className="text-gold">3 étapes</span>
						</h2>
					</div>

					<div className="relative mt-20">
						{/* Connecting line (desktop) */}
						<div className="absolute top-10 left-[16.66%] right-[16.66%] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block" />

						<div className="grid gap-16 sm:grid-cols-3 sm:gap-8">
							{STEPS.map((step, i) => (
								<div
									key={step.number}
									className="animate-on-scroll flex flex-col items-center text-center"
									style={{ animationDelay: `${i * 0.15}s` }}
								>
									<div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card font-serif text-2xl font-bold text-gold shadow-sm">
										{step.number}
									</div>
									<h3 className="mt-6 text-lg font-semibold text-foreground">
										{step.title}
									</h3>
									<p className="mt-3 text-sm leading-relaxed font-light text-muted-foreground">
										{step.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ── Pricing ── */}
			<section id="pricing" className="relative overflow-hidden bg-[#1A1A1A] px-6 py-28 lg:py-32">
				<div className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[120px]" />

				<div className="mx-auto max-w-6xl">
					<div className="animate-on-scroll mx-auto max-w-2xl text-center">
						<p className="text-xs font-medium tracking-[0.25em] text-gold uppercase">Tarifs</p>
						<h2 className="mt-4 font-serif text-4xl font-bold text-white sm:text-5xl">
							Un plan pour
							<br />
							<span className="landing-gradient-text">chaque ambition</span>
						</h2>
						<p className="mt-5 text-base font-light text-white/45">
							Commencez gratuitement et évoluez à votre rythme.
						</p>
					</div>

					<div className="mt-16 grid gap-6 sm:grid-cols-3">
						{PLAN_ENTRIES.map(({ key, popular }, i) => {
							const plan = PLANS[key]
							return (
								<div
									key={key}
									className={`animate-on-scroll relative rounded-2xl border p-8 transition-all duration-300 ${
										popular
											? 'z-10 border-gold/40 bg-gradient-to-b from-gold/[0.08] to-transparent shadow-2xl shadow-gold/10 sm:scale-[1.03]'
											: 'border-white/[0.08] bg-white/[0.02] hover:border-white/15'
									}`}
									style={{ animationDelay: `${i * 0.1}s` }}
								>
									{popular && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-[11px] font-medium tracking-wide text-white uppercase">
											Populaire
										</div>
									)}

									<h3 className="font-serif text-2xl font-bold text-white">{plan.name}</h3>

									<div className="mt-5 flex items-baseline gap-1">
										<span className="font-serif text-5xl font-bold text-white">
											{plan.priceMonthly === 0 ? '0' : plan.priceMonthly}
										</span>
										<span className="text-lg text-white/40">€</span>
										{plan.priceMonthly > 0 && (
											<span className="ml-1 text-sm font-light text-white/40">/mois</span>
										)}
									</div>
									{plan.priceMonthly === 0 && (
										<p className="mt-1 text-sm font-light text-white/40">Pour toujours</p>
									)}
									{plan.priceYearly > 0 && (
										<p className="mt-1 text-sm font-light text-white/40">
											ou {plan.priceYearly}€/an (2 mois offerts)
										</p>
									)}

									<div className="my-7 h-px bg-white/[0.08]" />

									<ul className="space-y-3.5">
										{plan.features.map((feature) => (
											<li key={feature} className="flex items-start gap-3 text-sm">
												<svg
													className="mt-0.5 h-4 w-4 shrink-0 text-gold"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fillRule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clipRule="evenodd"
													/>
												</svg>
												<span className="font-light text-white/70">{feature}</span>
											</li>
										))}
									</ul>

									<Link
										href="/register"
										className={`mt-8 block rounded-full py-3.5 text-center text-sm font-medium transition-all duration-300 ${
											popular
												? 'bg-gold text-white hover:bg-gold-light hover:shadow-lg hover:shadow-gold/25'
												: 'border border-white/15 text-white/80 hover:border-gold/50 hover:bg-gold/10 hover:text-white'
										}`}
									>
										{plan.priceMonthly === 0 ? 'Commencer gratuitement' : 'Choisir ce plan'}
									</Link>
								</div>
							)
						})}
					</div>

					<p className="mt-10 text-center text-[13px] font-light text-white/30">
						Une commission de {PLATFORM_FEE_PERCENT}% est appliquée sur les paiements reçus via la
						plateforme (commandes et ateliers).
					</p>
				</div>
			</section>

			{/* ── CTA Final ── */}
			<section className="relative overflow-hidden bg-background px-6 py-28 lg:py-32">
				<div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.06] blur-[100px]" />

				<div className="animate-on-scroll relative mx-auto max-w-2xl text-center">
					<p className="text-xs font-medium tracking-[0.25em] text-gold uppercase">
						Prêt à vous lancer ?
					</p>
					<h2 className="mt-4 font-serif text-4xl font-bold text-foreground sm:text-5xl">
						Lancez votre vitrine
						<br />
						pâtissière dès aujourd&apos;hui
					</h2>
					<p className="mt-6 text-base font-light leading-relaxed text-muted-foreground">
						Rejoignez des centaines de pâtissiers qui développent leur activité grâce à Patissio.
						Créez votre site en quelques minutes.
					</p>
					<Link
						href="/register"
						className="mt-10 inline-block rounded-full bg-gold px-10 py-4 text-sm font-medium text-white transition-all duration-300 hover:bg-gold-light hover:shadow-2xl hover:shadow-gold/30"
					>
						Créer mon site gratuitement
					</Link>
					<p className="mt-4 text-xs font-light text-muted-foreground">
						Aucune carte bancaire requise
					</p>
				</div>
			</section>

			{/* ── Footer ── */}
			<footer className="border-t border-white/[0.06] bg-[#141414] px-6 py-10">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
					<div className="flex items-center gap-4">
						<Image
							src="/logo-patissio-full.png"
							alt="Patissio"
							width={886}
							height={368}
							className="h-5 w-auto opacity-30"
						/>
						<span className="text-[13px] font-light text-white/25">
							&copy; {new Date().getFullYear()} Tous droits réservés
						</span>
					</div>
					<div className="flex gap-6">
						<Link
							href="/privacy"
							className="text-[13px] font-light text-white/25 transition-colors hover:text-white/50"
						>
							Politique de confidentialité
						</Link>
					</div>
				</div>
			</footer>
		</div>
	)
}
