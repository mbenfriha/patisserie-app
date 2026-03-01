'use client'

import {
	addDays,
	addMonths,
	endOfMonth,
	endOfWeek,
	format,
	startOfMonth,
	startOfWeek,
	subDays,
	subMonths,
} from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
import { CalendarDayDetail } from './calendar-day-detail'
import { CalendarFilters } from './calendar-filters'
import { CalendarGrid } from './calendar-grid'
import { CalendarHeader } from './calendar-header'
import { CalendarWeekView } from './calendar-week-view'
import type { ActiveFilters, CalendarEvent, CalendarEventKind, ViewMode } from './types'

export function DashboardCalendar() {
	const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
	const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
	const [viewMode, setViewMode] = useState<ViewMode>('month')
	const [events, setEvents] = useState<CalendarEvent[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [filters, setFilters] = useState<ActiveFilters>({
		order: true,
		devis: true,
		workshop: true,
	})

	const fetchEvents = useCallback(async (start: string, end: string) => {
		setIsLoading(true)
		try {
			const res = await api.get<{ data: CalendarEvent[] }>('/patissier/calendar', { start, end })
			const raw = res.data?.data || res.data || []
			// Normalize dates that may come as ISO timestamps (e.g. "2026-03-11T23:00:00.000Z")
			const normalized = (raw as CalendarEvent[]).map((e) => ({
				...e,
				date: e.date?.includes('T') ? format(new Date(e.date), 'yyyy-MM-dd') : e.date,
				meta: {
					...e.meta,
					startTime:
						typeof e.meta?.startTime === 'string'
							? e.meta.startTime.substring(0, 5)
							: e.meta?.startTime,
				},
			}))
			setEvents(normalized)
		} catch (err) {
			console.error('Failed to load calendar events:', err)
			setEvents([])
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		if (viewMode === 'month') {
			const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
			const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
			fetchEvents(start, end)
		} else {
			const start = format(currentWeek, 'yyyy-MM-dd')
			const end = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')
			fetchEvents(start, end)
		}
	}, [currentMonth, currentWeek, viewMode, fetchEvents])

	function handlePrev() {
		if (viewMode === 'week') {
			setCurrentWeek((w) => subDays(w, 7))
		} else {
			setCurrentMonth((m) => subMonths(m, 1))
		}
		setSelectedDate(null)
	}

	function handleNext() {
		if (viewMode === 'week') {
			setCurrentWeek((w) => addDays(w, 7))
		} else {
			setCurrentMonth((m) => addMonths(m, 1))
		}
		setSelectedDate(null)
	}

	function handleToday() {
		const now = new Date()
		setCurrentMonth(startOfMonth(now))
		setCurrentWeek(startOfWeek(now, { weekStartsOn: 1 }))
		setSelectedDate(now)
	}

	function handleToggleFilter(kind: CalendarEventKind) {
		setFilters((f) => ({ ...f, [kind]: !f[kind] }))
	}

	function handleViewModeChange(mode: ViewMode) {
		if (mode === viewMode) return
		setViewMode(mode)
		if (mode === 'week') {
			const ref = selectedDate || currentMonth
			setCurrentWeek(startOfWeek(ref, { weekStartsOn: 1 }))
		} else {
			setCurrentMonth(startOfMonth(currentWeek))
		}
		setSelectedDate(null)
	}

	const headerDate = viewMode === 'week' ? currentWeek : currentMonth

	return (
		<div className="space-y-4">
			{/* Header row */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<CalendarHeader
					currentMonth={headerDate}
					viewMode={viewMode}
					onPrevMonth={handlePrev}
					onNextMonth={handleNext}
					onToday={handleToday}
					onViewModeChange={handleViewModeChange}
				/>
				<CalendarFilters filters={filters} onToggle={handleToggleFilter} events={events} />
			</div>

			{/* Calendar body */}
			<div
				className={`transition-opacity duration-200 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
			>
				{viewMode === 'month' ? (
					<div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
						<CalendarGrid
							currentMonth={currentMonth}
							selectedDate={selectedDate}
							onSelectDate={setSelectedDate}
							events={events}
							filters={filters}
						/>
					</div>
				) : (
					<CalendarWeekView currentWeek={currentWeek} events={events} filters={filters} />
				)}
			</div>

			{/* Day detail panel */}
			{selectedDate && viewMode === 'month' && (
				<CalendarDayDetail date={selectedDate} events={events} filters={filters} />
			)}
		</div>
	)
}
