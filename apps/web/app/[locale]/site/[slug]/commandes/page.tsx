'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSiteProfile, useSiteBasePath, useSiteConfig } from '../site-provider'
import { SectionTitle } from '../components/section-title'
import { getImageUrl } from '@/lib/utils/image-url'
import { CatalogueTab } from './catalogue-tab'
import { DevisForm } from './devis-form'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

type Product = {
	id: string
	name: string
	price: number
	unit: string
	description?: string | null
	images?: { url: string }[]
}

export default function OrderPage() {
	const profile = useSiteProfile()
	const basePath = useSiteBasePath()
	const config = useSiteConfig()

	const showCatalogue = config.showCatalogueTab !== false
	const showCustom = config.showCustomOrderTab !== false
	const showBothTabs = showCatalogue && showCustom

	const defaultTab = useMemo<'catalogue' | 'custom'>(
		() => (showCatalogue ? 'catalogue' : 'custom'),
		[showCatalogue]
	)

	const [products, setProducts] = useState<Product[]>([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState<'catalogue' | 'custom'>(defaultTab)
	const [success, setSuccess] = useState(false)

	useEffect(() => {
		async function fetchProducts() {
			try {
				const res = await fetch(`${API_URL}/public/${profile.slug}/products`)
				if (res.ok) {
					setProducts((await res.json()).data || [])
				}
			} catch {
				// silently fail
			} finally {
				setLoading(false)
			}
		}
		fetchProducts()
	}, [profile.slug])

	/* ── Success state ─────────────────────────────────────────────── */
	if (success) {
		return (
			<>
				<style>{`
					@keyframes fadeInUp {
						from { opacity: 0; transform: translateY(40px); }
						to { opacity: 1; transform: translateY(0); }
					}
					@keyframes scaleIn {
						from { opacity: 0; transform: scale(0.5); }
						to { opacity: 1; transform: scale(1); }
					}
				`}</style>

				{/* Hero */}
				<section
					className="relative flex h-[30vh] min-h-[240px] items-center justify-center overflow-hidden text-center"
					style={{
						background:
							'linear-gradient(160deg, rgba(26,26,26,0.95) 0%, rgba(45,30,10,0.90) 50%, rgba(26,26,26,0.95) 100%)',
					}}
				>
					<div
						className="pointer-events-none absolute inset-0 opacity-5"
						style={{
							background:
								'radial-gradient(circle at 20% 30%, var(--gold) 0%, transparent 40%), radial-gradient(circle at 80% 70%, var(--gold) 0%, transparent 40%)',
						}}
					/>
					<div
						className="relative z-10 px-6"
						style={{ animation: 'fadeInUp 0.8s ease-out' }}
					>
						<SectionTitle subtitle="commande" title="Passer Commande" light />
					</div>
				</section>

				{/* Success card */}
				<section className="mx-auto max-w-[600px] px-6 py-20">
					<div
						className="rounded-2xl bg-white p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
						style={{ animation: 'fadeInUp 0.6s ease-out' }}
					>
						<div
							className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50"
							style={{ animation: 'scaleIn 0.5s ease-out 0.2s both' }}
						>
							<svg
								className="h-10 w-10 text-green-500"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={2}
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</div>

						<h2 className="font-[family-name:'Cormorant_Garamond'] text-[32px] font-medium text-[var(--dark)]">
							Commande envoy&eacute;e !
						</h2>
						<p
							className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[var(--dark-soft)]/70"
							style={{ fontFamily: "'Josefin Sans', sans-serif" }}
						>
							Votre commande a bien &eacute;t&eacute; envoy&eacute;e. Vous recevrez une confirmation par email
							tr&egrave;s prochainement.
						</p>

						<a
							href={basePath || '/'}
							className="mt-8 inline-block rounded-lg bg-[var(--gold)] px-8 py-3 text-sm font-semibold uppercase tracking-[2px] text-[var(--dark)] transition-colors duration-300 hover:bg-[var(--gold-light)]"
							style={{ fontFamily: "'Josefin Sans', sans-serif" }}
						>
							Retour &agrave; l&apos;accueil
						</a>
					</div>
				</section>
			</>
		)
	}

	/* ── Loading state ─────────────────────────────────────────────── */
	if (loading) {
		return (
			<>
				{/* Hero */}
				<section
					className="relative flex h-[30vh] min-h-[240px] items-center justify-center overflow-hidden text-center"
					style={{
						background:
							'linear-gradient(160deg, rgba(26,26,26,0.95) 0%, rgba(45,30,10,0.90) 50%, rgba(26,26,26,0.95) 100%)',
					}}
				>
					<div
						className="pointer-events-none absolute inset-0 opacity-5"
						style={{
							background:
								'radial-gradient(circle at 20% 30%, var(--gold) 0%, transparent 40%), radial-gradient(circle at 80% 70%, var(--gold) 0%, transparent 40%)',
						}}
					/>
					<div className="relative z-10 px-6">
						<SectionTitle subtitle="commande" title="Passer Commande" light />
					</div>
				</section>

				{/* Loading skeleton */}
				<section className="mx-auto max-w-[1200px] px-6 py-16">
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<div
								key={i}
								className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
							>
								<div className="bg-[var(--cream-dark)]" style={{ aspectRatio: '3/2' }} />
								<div className="space-y-3 p-6">
									<div className="h-6 w-3/4 rounded bg-[var(--cream-dark)]" />
									<div className="h-4 w-1/2 rounded bg-[var(--cream-dark)]" />
									<div className="h-10 w-full rounded bg-[var(--cream-dark)]" />
								</div>
							</div>
						))}
					</div>
				</section>
			</>
		)
	}

	/* ── Main page ─────────────────────────────────────────────────── */
	return (
		<>
			<style>{`
				@keyframes fadeInUp {
					from { opacity: 0; transform: translateY(40px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>

			{/* ── Hero Banner ────────────────────────────────────────── */}
			<section
				className="relative flex h-[30vh] min-h-[240px] items-center justify-center overflow-hidden text-center"
				style={{
					background: getImageUrl(profile.ordersHeroImageUrl || profile.heroImageUrl)
						? `linear-gradient(160deg, rgba(26,26,26,0.92) 0%, rgba(45,30,10,0.88) 50%, rgba(26,26,26,0.92) 100%), url('${getImageUrl(profile.ordersHeroImageUrl || profile.heroImageUrl)}') center/cover`
						: 'linear-gradient(160deg, rgba(26,26,26,0.95) 0%, rgba(45,30,10,0.90) 50%, rgba(26,26,26,0.95) 100%)',
				}}
			>
				<div
					className="pointer-events-none absolute inset-0 opacity-5"
					style={{
						background:
							'radial-gradient(circle at 20% 30%, var(--gold) 0%, transparent 40%), radial-gradient(circle at 80% 70%, var(--gold) 0%, transparent 40%)',
					}}
				/>
				<div
					className="relative z-10 px-6"
					style={{ animation: 'fadeInUp 0.8s ease-out' }}
				>
					<SectionTitle subtitle="commande" title="Passer Commande" light />
				</div>
			</section>

			{/* ── Tab Switcher ───────────────────────────────────────── */}
			{showBothTabs && (
				<div className="border-b border-[var(--gold)]/10 bg-white/60 backdrop-blur-sm">
					<div className="mx-auto flex max-w-[1200px] items-center justify-center gap-0 px-6">
						<button
							type="button"
							onClick={() => setActiveTab('catalogue')}
							className="relative px-8 py-5 text-xs font-semibold uppercase tracking-[3px] transition-all duration-300"
							style={{
								fontFamily: "'Josefin Sans', sans-serif",
								color: activeTab === 'catalogue' ? 'var(--gold)' : 'rgba(26,26,26,0.4)',
								borderBottom: activeTab === 'catalogue' ? '2px solid var(--gold)' : '2px solid transparent',
							}}
						>
							Catalogue
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('custom')}
							className="relative px-8 py-5 text-xs font-semibold uppercase tracking-[3px] transition-all duration-300"
							style={{
								fontFamily: "'Josefin Sans', sans-serif",
								color: activeTab === 'custom' ? 'var(--gold)' : 'rgba(26,26,26,0.4)',
								borderBottom: activeTab === 'custom' ? '2px solid var(--gold)' : '2px solid transparent',
							}}
						>
							Sur-mesure
						</button>
					</div>
				</div>
			)}

			{/* ── Content ────────────────────────────────────────────── */}
			<section className="mx-auto max-w-[1200px] px-6 py-16">
				{showCatalogue && activeTab === 'catalogue' && (
					<CatalogueTab
						products={products}
						slug={profile.slug}
						onSuccess={() => setSuccess(true)}
					/>
				)}

				{showCustom && activeTab === 'custom' && (
					<DevisForm
						slug={profile.slug}
						onSuccess={() => setSuccess(true)}
					/>
				)}
			</section>
		</>
	)
}
