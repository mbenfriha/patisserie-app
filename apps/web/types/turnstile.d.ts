interface TurnstileInstance {
	render: (
		element: HTMLElement,
		options: {
			sitekey: string
			callback: (token: string) => void
			'expired-callback'?: () => void
			theme?: 'light' | 'dark' | 'auto'
			size?: 'normal' | 'compact' | 'flexible'
		}
	) => string
	reset: (widgetId: string) => void
	remove: (widgetId: string) => void
}

interface Window {
	turnstile: TurnstileInstance
}
