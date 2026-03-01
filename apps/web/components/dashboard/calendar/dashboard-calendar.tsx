'use client'

import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
import { CalendarDayDetail } from './calendar-day-detail'
import { CalendarFilters } from './calendar-filters'
import { CalendarGrid } from './calendar-grid'
import { CalendarHeader } from './calendar-header'
import type { ActiveFilters, CalendarEvent, CalendarEventKind } from './types'

export function DashboardCalendar() {
	const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
	const [events, setEvents] = useState<CalendarEvent[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [filters, setFilters] = useState<ActiveFilters>({
		order: true,
		devis: true,
		workshop: true,
	})

	const fetchEvents = useCallback(async (month: Date) => {
		setIsLoading(true)
		try {
			const start = format(startOfMonth(month), 'yyyy-MM-dd')
			const end = format(endOfMonth(month), 'yyyy-MM-dd')
			const res = await api.get<{ data: CalendarEvent[] }>('/patissier/calendar', { start, end })
			setEvents(res.data?.data || res.data || [])
		} catch (err) {
			console.error('Failed to load calendar events:', err)
			setEvents([])
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchEvents(currentMonth)
	}, [currentMonth, fetchEvents])

	function handlePrevMonth() {
		setCurrentMonth((m) => subMonths(m, 1))
		setSelectedDate(null)
	}

	function handleNextMonth() {
		setCurrentMonth((m) => addMonths(m, 1))
		setSelectedDate(null)
	}

	function handleToday() {
		setCurrentMonth(startOfMonth(new Date()))
		setSelectedDate(new Date())
	}

	function handleToggleFilter(kind: CalendarEventKind) {
		setFilters((f) => ({ ...f, [kind]: !f[kind] }))
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<CalendarHeader
					currentMonth={currentMonth}
					onPrevMonth={handlePrevMonth}
					onNextMonth={handleNextMonth}
					onToday={handleToday}
				/>
				<CalendarFilters filters={filters} onToggle={handleToggleFilter} events={events} />
			</div>

			<div className={`rounded-lg border bg-card ${isLoading ? 'opacity-60' : ''}`}>
				<CalendarGrid
					currentMonth={currentMonth}
					selectedDate={selectedDate}
					onSelectDate={setSelectedDate}
					events={events}
					filters={filters}
				/>
			</div>

			{selectedDate && <CalendarDayDetail date={selectedDate} events={events} filters={filters} />}
		</div>
	)
}
