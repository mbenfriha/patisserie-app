'use client'

import { type Config, type DriveStep, driver } from 'driver.js'
import { useCallback, useEffect, useState } from 'react'
import 'driver.js/dist/driver.css'

const STORAGE_PREFIX = 'patissio-tour-'

export type TourId = 'dashboard' | 'site-editor'

function getTourCompleted(tourId: TourId): boolean {
	if (typeof window === 'undefined') return true
	return localStorage.getItem(`${STORAGE_PREFIX}${tourId}`) === 'completed'
}

function setTourCompleted(tourId: TourId) {
	localStorage.setItem(`${STORAGE_PREFIX}${tourId}`, 'completed')
}

export function resetTour(tourId: TourId) {
	localStorage.removeItem(`${STORAGE_PREFIX}${tourId}`)
}

export function resetAllTours() {
	resetTour('dashboard')
	resetTour('site-editor')
}

const BASE_CONFIG: Partial<Config> = {
	animate: true,
	showProgress: true,
	smoothScroll: true,
	stagePadding: 8,
	stageRadius: 8,
	overlayOpacity: 0.6,
	popoverClass: 'patissio-tour-popover',
	nextBtnText: 'Suivant',
	prevBtnText: 'Précédent',
	doneBtnText: 'Terminer',
	progressText: '{{current}} / {{total}}',
}

const DASHBOARD_STEPS: DriveStep[] = [
	{
		popover: {
			title: 'Bienvenue sur Patissio ! 👋',
			description:
				'Découvrez votre espace de gestion en quelques étapes. Ce guide vous présente les fonctionnalités principales.',
			side: 'over',
			align: 'center',
		},
	},
	{
		element: '#tour-sidebar-header',
		popover: {
			title: 'Votre boutique',
			description:
				'Votre logo et le nom de votre pâtisserie. Le lien "Voir mon site" vous permet de visualiser votre vitrine en ligne.',
			side: 'right',
			align: 'start',
		},
	},
	{
		element: '#tour-nav-overview',
		popover: {
			title: "Vue d'ensemble",
			description:
				"Accédez à votre tableau de bord pour un résumé de votre activité, et à l'éditeur de site pour personnaliser votre vitrine.",
			side: 'right',
			align: 'start',
		},
	},
	{
		element: '#tour-nav-content',
		popover: {
			title: 'Votre contenu',
			description:
				'Gérez vos créations pâtissières, organisez-les par catégories et configurez vos produits à la vente.',
			side: 'right',
			align: 'start',
		},
	},
	{
		element: '#tour-nav-operations',
		popover: {
			title: 'Opérations',
			description:
				'Suivez vos commandes et gérez vos ateliers. Ces fonctionnalités sont disponibles avec le plan Pro.',
			side: 'right',
			align: 'start',
		},
	},
	{
		element: '#tour-nav-costing',
		popover: {
			title: 'Costing',
			description:
				'Calculez le coût de revient de vos créations en renseignant vos ingrédients et votre équipe.',
			side: 'right',
			align: 'start',
		},
	},
	{
		element: '#tour-nav-account',
		popover: {
			title: 'Votre compte',
			description: 'Paramètres de votre profil, sécurité, et gestion de votre abonnement Patissio.',
			side: 'right',
			align: 'start',
		},
	},
	{
		element: '#tour-stats',
		popover: {
			title: 'Vos statistiques',
			description:
				'Un aperçu en temps réel de votre activité : commandes, revenus, ateliers et réservations.',
			side: 'bottom',
			align: 'center',
		},
	},
	{
		popover: {
			title: "C'est parti ! 🎉",
			description:
				"Vous êtes prêt à utiliser Patissio. Commencez par personnaliser votre site dans l'éditeur. Vous pouvez relancer ce guide à tout moment depuis les paramètres.",
			side: 'over',
			align: 'center',
		},
	},
]

// Helper to wrap a description with a video placeholder
// Replace src with actual video URLs when ready (e.g. /tours/branding.mp4)
function withVideo(text: string, videoId: string): string {
	return `${text}<div class="tour-video" data-video="${videoId}"><div class="tour-video-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4816a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg><span>Vidéo à venir</span></div></div>`
}

const SITE_EDITOR_STEPS: DriveStep[] = [
	{
		popover: {
			title: 'Éditeur de site 🎨',
			description:
				'Personnalisez votre vitrine en ligne étape par étape. Chaque onglet contrôle un aspect de votre site.',
			side: 'over',
			align: 'center',
		},
	},
	{
		element: '#tour-site-tabs',
		popover: {
			title: 'Les onglets',
			description: withVideo(
				'Naviguez entre Branding, Contenu, Sections et Contact pour configurer chaque partie de votre site.',
				'site-tabs'
			),
			side: 'bottom',
			align: 'center',
		},
	},
	{
		element: '#tour-tab-branding',
		popover: {
			title: 'Branding',
			description: withVideo(
				"Définissez l'identité visuelle de votre site : logo, couleurs, typographie et image d'en-tête.",
				'branding'
			),
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#tour-tab-content',
		popover: {
			title: 'Contenu',
			description: withVideo(
				'Racontez votre histoire, ajoutez une description et personnalisez les images de chaque page.',
				'content'
			),
			side: 'bottom',
			align: 'center',
		},
	},
	{
		element: '#tour-tab-sections',
		popover: {
			title: 'Sections',
			description: withVideo(
				"Choisissez les sections à afficher sur votre page d'accueil : créations, ateliers, Instagram, etc.",
				'sections'
			),
			side: 'bottom',
			align: 'center',
		},
	},
	{
		element: '#tour-tab-contact',
		popover: {
			title: 'Contact',
			description: withVideo(
				"Renseignez vos coordonnées, réseaux sociaux et horaires d'ouverture pour vos clients.",
				'contact'
			),
			side: 'bottom',
			align: 'end',
		},
	},
	{
		element: '#tour-site-preview',
		popover: {
			title: 'Aperçu en direct',
			description: withVideo(
				"Activez l'aperçu pour voir vos modifications en temps réel, sur mobile ou desktop.",
				'preview'
			),
			side: 'left',
			align: 'center',
		},
	},
	{
		element: '#tour-site-save',
		popover: {
			title: 'Sauvegarder',
			description:
				"N'oubliez pas de sauvegarder vos modifications. Un bandeau jaune vous prévient si des changements ne sont pas enregistrés.",
			side: 'bottom',
			align: 'end',
		},
	},
	{
		popover: {
			title: 'À vous de jouer ! ✨',
			description:
				'Explorez chaque onglet et construisez votre vitrine. Vous pouvez relancer ce guide depuis les paramètres.',
			side: 'over',
			align: 'center',
		},
	},
]

const TOUR_STEPS: Record<TourId, DriveStep[]> = {
	dashboard: DASHBOARD_STEPS,
	'site-editor': SITE_EDITOR_STEPS,
}

export function useTour(tourId: TourId, autoStart = false) {
	const [isCompleted, setIsCompleted] = useState(true)

	useEffect(() => {
		setIsCompleted(getTourCompleted(tourId))
	}, [tourId])

	const startTour = useCallback(() => {
		const steps = TOUR_STEPS[tourId]
		if (!steps) return

		const driverObj = driver({
			...BASE_CONFIG,
			steps,
			onDestroyed: () => {
				setTourCompleted(tourId)
				setIsCompleted(true)
			},
		})

		// Small delay to ensure DOM elements are rendered
		setTimeout(() => driverObj.drive(), 300)
	}, [tourId])

	useEffect(() => {
		if (autoStart && !isCompleted) {
			// Wait for page to be fully rendered
			const timer = setTimeout(() => startTour(), 800)
			return () => clearTimeout(timer)
		}
	}, [autoStart, isCompleted, startTour])

	return {
		startTour,
		isCompleted,
		resetTour: () => {
			resetTour(tourId)
			setIsCompleted(false)
		},
	}
}
