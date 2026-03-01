'use client'

import { endOfWeek, format, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ViewMode } from './types'

interface CalendarHeaderProps {
	currentMonth: Date
	viewMode: ViewMode
	onPrevMonth: () => void
	onNextMonth: () => void
	onToday: () => void
	onViewModeChange: (mode: ViewMode) => void
}

export function CalendarHeader({
	currentMonth,
	viewMode,
	onPrevMonth,
	onNextMonth,
	onToday,
	onViewModeChange,
}: CalendarHeaderProps) {
	let title: string
	if (viewMode === 'week') {
		const ws = startOfWeek(currentMonth, { weekStartsOn: 1 })
		const we = endOfWeek(currentMonth, { weekStartsOn: 1 })
		const sameMonth = ws.getMonth() === we.getMonth()
		if (sameMonth) {
			title = `${format(ws, 'd')} – ${format(we, 'd MMMM yyyy', { locale: fr })}`
		} else {
			title = `${format(ws, 'd MMM', { locale: fr })} – ${format(we, 'd MMM yyyy', { locale: fr })}`
		}
	} else {
		title = format(currentMonth, 'MMMM yyyy', { locale: fr })
	}

	return (
		<div className="flex items-center gap-3">
			<h2 className="text-lg font-semibold capitalize">{title}</h2>
			<div className="flex items-center gap-1.5">
				<button
					type="button"
					onClick={onToday}
					className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
				>
					Aujourd&apos;hui
				</button>
				<button
					type="button"
					onClick={onPrevMonth}
					className="rounded-md border p-1.5 hover:bg-muted"
					aria-label={viewMode === 'week' ? 'Semaine précédente' : 'Mois précédent'}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
				</button>
				<button
					type="button"
					onClick={onNextMonth}
					className="rounded-md border p-1.5 hover:bg-muted"
					aria-label={viewMode === 'week' ? 'Semaine suivante' : 'Mois suivant'}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="m9 18 6-6-6-6" />
					</svg>
				</button>
				<div className="ml-1 flex overflow-hidden rounded-md border">
					<button
						type="button"
						onClick={() => onViewModeChange('month')}
						className={`px-3 py-1.5 text-sm font-medium transition-colors ${
							viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
						}`}
					>
						Mois
					</button>
					<button
						type="button"
						onClick={() => onViewModeChange('week')}
						className={`border-l px-3 py-1.5 text-sm font-medium transition-colors ${
							viewMode === 'week' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
						}`}
					>
						Semaine
					</button>
				</div>
			</div>
		</div>
	)
}
