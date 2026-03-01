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
		<div className="flex items-center gap-2">
			<h2 className="text-lg font-semibold capitalize tracking-tight">{title}</h2>

			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onPrevMonth}
					className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label={viewMode === 'week' ? 'Semaine précédente' : 'Mois précédent'}
				>
					<svg
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
					onClick={onToday}
					className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					Aujourd&apos;hui
				</button>
				<button
					type="button"
					onClick={onNextMonth}
					className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label={viewMode === 'week' ? 'Semaine suivante' : 'Mois suivant'}
				>
					<svg
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
			</div>

			<div className="ml-1 flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
				<button
					type="button"
					onClick={() => onViewModeChange('month')}
					className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
						viewMode === 'month'
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					Mois
				</button>
				<button
					type="button"
					onClick={() => onViewModeChange('week')}
					className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
						viewMode === 'week'
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					Semaine
				</button>
			</div>
		</div>
	)
}
