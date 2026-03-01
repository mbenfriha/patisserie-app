'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface CalendarHeaderProps {
	currentMonth: Date
	onPrevMonth: () => void
	onNextMonth: () => void
	onToday: () => void
}

export function CalendarHeader({
	currentMonth,
	onPrevMonth,
	onNextMonth,
	onToday,
}: CalendarHeaderProps) {
	const title = format(currentMonth, 'MMMM yyyy', { locale: fr })

	return (
		<div className="flex items-center justify-between">
			<h2 className="text-lg font-semibold capitalize">{title}</h2>
			<div className="flex items-center gap-2">
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
					aria-label="Mois précédent"
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
					aria-label="Mois suivant"
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
			</div>
		</div>
	)
}
