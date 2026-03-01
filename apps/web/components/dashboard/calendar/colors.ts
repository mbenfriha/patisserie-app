import type { CalendarEventKind } from './types'

export const KIND_COLORS: Record<
	CalendarEventKind,
	{ dot: string; label: string; bg: string; border: string; text: string }
> = {
	order: {
		dot: 'bg-blue-500',
		label: 'Commandes',
		bg: 'bg-blue-50 dark:bg-blue-950/40',
		border: 'border-blue-400 dark:border-blue-500/50',
		text: 'text-blue-700 dark:text-blue-300',
	},
	devis: {
		dot: 'bg-amber-500',
		label: 'Devis',
		bg: 'bg-amber-50 dark:bg-amber-950/40',
		border: 'border-amber-400 dark:border-amber-500/50',
		text: 'text-amber-700 dark:text-amber-300',
	},
	workshop: {
		dot: 'bg-violet-500',
		label: 'Ateliers',
		bg: 'bg-violet-50 dark:bg-violet-950/40',
		border: 'border-violet-400 dark:border-violet-500/50',
		text: 'text-violet-700 dark:text-violet-300',
	},
}

const ORDER_STATUS_COLORS: Record<string, string> = {
	pending:
		'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/10 dark:bg-yellow-950/40 dark:text-yellow-300 dark:ring-yellow-500/20',
	confirmed:
		'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-500/20',
	in_progress:
		'bg-purple-50 text-purple-700 ring-1 ring-purple-600/10 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-500/20',
	ready:
		'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/20',
	delivered:
		'bg-gray-50 text-gray-600 ring-1 ring-gray-600/10 dark:bg-gray-800/40 dark:text-gray-300 dark:ring-gray-500/20',
	picked_up:
		'bg-gray-50 text-gray-600 ring-1 ring-gray-600/10 dark:bg-gray-800/40 dark:text-gray-300 dark:ring-gray-500/20',
}

const WORKSHOP_STATUS_COLORS: Record<string, string> = {
	draft:
		'bg-gray-50 text-gray-600 ring-1 ring-gray-600/10 dark:bg-gray-800/40 dark:text-gray-300 dark:ring-gray-500/20',
	published:
		'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/20',
	full: 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/10 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-500/20',
	completed:
		'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-500/20',
}

export function getStatusColor(kind: CalendarEventKind, status: string): string {
	if (kind === 'workshop') {
		return WORKSHOP_STATUS_COLORS[status] || 'bg-gray-50 text-gray-600'
	}
	return ORDER_STATUS_COLORS[status] || 'bg-gray-50 text-gray-600'
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
