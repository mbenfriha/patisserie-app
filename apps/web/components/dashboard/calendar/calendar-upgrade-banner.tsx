'use client'

import Link from 'next/link'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// March 2026 starts on Sunday (index 6 with Monday-based week)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const START_OFFSET = 6 // March 1, 2026 is a Sunday → 6 empty cells (Mon-based)

// Fake events to make the calendar look realistic
const FAKE_EVENTS: Record<number, { color: string }[]> = {
	3: [{ color: 'bg-blue-500' }],
	5: [{ color: 'bg-amber-500' }],
	7: [{ color: 'bg-violet-500' }, { color: 'bg-blue-500' }],
	10: [{ color: 'bg-blue-500' }],
	12: [{ color: 'bg-amber-500' }],
	15: [{ color: 'bg-blue-500' }],
	18: [{ color: 'bg-violet-500' }],
	20: [{ color: 'bg-blue-500' }, { color: 'bg-amber-500' }],
	23: [{ color: 'bg-amber-500' }],
	25: [{ color: 'bg-violet-500' }],
	28: [{ color: 'bg-blue-500' }],
}

export function CalendarUpgradeBanner() {
	return (
		<div className="relative overflow-hidden rounded-lg border">
			{/* Blurred fake calendar */}
			<div className="pointer-events-none select-none blur-[3px]">
				{/* Fake header */}
				<div className="flex items-center gap-3 px-4 py-3">
					<h2 className="text-lg font-semibold capitalize">mars 2026</h2>
					<div className="flex items-center gap-1.5">
						<span className="rounded-md border px-3 py-1.5 text-sm font-medium">
							Aujourd&apos;hui
						</span>
						<span className="rounded-md border p-1.5 text-muted-foreground">‹</span>
						<span className="rounded-md border p-1.5 text-muted-foreground">›</span>
					</div>
				</div>

				{/* Fake grid */}
				<div className="px-4 pb-4">
					<div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
						{WEEKDAYS.map((d, i) => (
							<div key={i} className="py-2">
								{d}
							</div>
						))}
					</div>
					<div className="grid grid-cols-7">
						{/* Empty offset cells */}
						{Array.from({ length: START_OFFSET }).map((_, i) => (
							<div key={`empty-${i}`} className="p-1">
								<div className="h-16" />
							</div>
						))}
						{/* Day cells */}
						{DAYS.map((day) => (
							<div key={day} className="p-1">
								<div className="flex h-16 flex-col rounded-md border border-transparent p-1">
									<span className="text-xs text-muted-foreground">{day}</span>
									<div className="mt-auto flex gap-0.5">
										{FAKE_EVENTS[day]?.map((ev, i) => (
											<span key={i} className={`h-1.5 w-1.5 rounded-full ${ev.color}`} />
										))}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Upgrade overlay */}
			<div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
				<div className="mx-auto max-w-md text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
						<svg
							className="h-7 w-7 text-blue-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1.5}
							aria-hidden="true"
						>
							<title>Cadenas</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
							/>
						</svg>
					</div>
					<h2 className="text-xl font-semibold">Calendrier — Fonctionnalité Pro</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						Visualisez vos commandes, devis et ateliers dans un calendrier unifié.
					</p>
					<Link
						href="/billing"
						className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Passer au plan Pro
					</Link>
				</div>
			</div>
		</div>
	)
}
