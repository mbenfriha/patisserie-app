'use client'

export function ScrollToBookingButton() {
	return (
		<button
			type="button"
			onClick={() => {
				document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })
			}}
			className="inline-block bg-[var(--gold)] px-8 py-3 text-xs font-semibold uppercase tracking-[3px] text-[var(--dark)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--gold-light)]"
			style={{ fontFamily: "'Josefin Sans', sans-serif" }}
		>
			Réserver
		</button>
	)
}
