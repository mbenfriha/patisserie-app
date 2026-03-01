import type { CalendarEventKind } from './types'

export const KIND_COLORS: Record<
	CalendarEventKind,
	{ dot: string; label: string; bg: string; border: string; text: string }
> = {
	order: {
		dot: 'bg-blue-500',
		label: 'Commandes',
		bg: 'bg-blue-50',
		border: 'border-blue-400',
		text: 'text-blue-700',
	},
	devis: {
		dot: 'bg-amber-500',
		label: 'Devis',
		bg: 'bg-amber-50',
		border: 'border-amber-400',
		text: 'text-amber-700',
	},
	workshop: {
		dot: 'bg-violet-500',
		label: 'Ateliers',
		bg: 'bg-violet-50',
		border: 'border-violet-400',
		text: 'text-violet-700',
	},
}

const ORDER_STATUS_COLORS: Record<string, string> = {
	pending: 'bg-yellow-100 text-yellow-800',
	confirmed: 'bg-blue-100 text-blue-800',
	in_progress: 'bg-purple-100 text-purple-800',
	ready: 'bg-green-100 text-green-800',
	delivered: 'bg-gray-100 text-gray-800',
	picked_up: 'bg-gray-100 text-gray-800',
}

const WORKSHOP_STATUS_COLORS: Record<string, string> = {
	draft: 'bg-gray-100 text-gray-800',
	published: 'bg-green-100 text-green-800',
	full: 'bg-orange-100 text-orange-800',
	completed: 'bg-blue-100 text-blue-800',
}

export function getStatusColor(kind: CalendarEventKind, status: string): string {
	if (kind === 'workshop') {
		return WORKSHOP_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
	}
	return ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
}

const ORDER_STATUS_LABELS: Record<string, string> = {
	pending: 'En attente',
	confirmed: 'Confirmée',
	in_progress: 'En cours',
	ready: 'Prête',
	delivered: 'Livrée',
	picked_up: 'Récupérée',
}

const WORKSHOP_STATUS_LABELS: Record<string, string> = {
	draft: 'Brouillon',
	published: 'Publié',
	full: 'Complet',
	completed: 'Terminé',
}

export function getStatusLabel(kind: CalendarEventKind, status: string): string {
	if (kind === 'workshop') {
		return WORKSHOP_STATUS_LABELS[status] || status
	}
	return ORDER_STATUS_LABELS[status] || status
}
