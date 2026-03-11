class ApiClient {
	private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

	private getToken(): string | null {
		if (typeof document === 'undefined') return null
		const match = document.cookie.match(/superadmin_token=([^;]+)/)
		return match ? match[1] : null
	}

	private getHeaders(): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		}

		const token = this.getToken()
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}

		return headers
	}

	private buildUrl(path: string, params?: Record<string, string>): string {
		const base = this.baseUrl.replace(/\/+$/, '')
		const url = new URL(`${base}${path}`)
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				url.searchParams.append(key, value)
			})
		}
		return url.toString()
	}

	private async parseJson(response: Response): Promise<unknown> {
		const text = await response.text()
		if (!text) return {}
		return JSON.parse(text) as unknown
	}

	// biome-ignore lint/suspicious/noExplicitAny: generic default for backwards-compatible callers
	async request<T = any>(
		path: string,
		options: RequestInit & { params?: Record<string, string> } = {}
	): Promise<T> {
		const { params, ...fetchOptions } = options as RequestInit & { params?: Record<string, string> }
		const url = this.buildUrl(path, params)

		const response = await fetch(url, {
			...fetchOptions,
			redirect: 'manual',
			headers: {
				...this.getHeaders(),
				...fetchOptions.headers,
			},
		})

		// Handle redirects (e.g. Cloudflare HTTP→HTTPS) by retrying at the new URL
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get('location')
			if (location) {
				const retryResponse = await fetch(location, {
					...fetchOptions,
					redirect: 'follow',
					headers: {
						...this.getHeaders(),
						...fetchOptions.headers,
					},
				})
				const retryData = (await this.parseJson(retryResponse)) as Record<string, unknown>
				if (!retryResponse.ok) {
					let errorMessage = (retryData.message as string) || 'An error occurred'
					if (Array.isArray(retryData.errors) && retryData.errors.length > 0) {
						const firstError = retryData.errors[0] as Record<string, unknown>
						errorMessage = (firstError.message as string) || errorMessage
					}
					throw new ApiError(errorMessage, retryResponse.status, retryData)
				}
				return retryData as T
			}
			throw new ApiError('Redirect sans URL de destination', response.status, null)
		}

		const data = (await this.parseJson(response)) as Record<string, unknown>

		if (!response.ok) {
			let errorMessage = (data.message as string) || 'An error occurred'
			if (Array.isArray(data.errors) && data.errors.length > 0) {
				const firstError = data.errors[0] as Record<string, unknown>
				errorMessage = (firstError.message as string) || errorMessage
			}
			throw new ApiError(errorMessage, response.status, data)
		}

		return data as T
	}

	// biome-ignore lint/suspicious/noExplicitAny: generic default
	async get<T = any>(path: string, params?: Record<string, string>) {
		return this.request<T>(path, { method: 'GET', params } as RequestInit & {
			params?: Record<string, string>
		})
	}

	// biome-ignore lint/suspicious/noExplicitAny: generic default
	async post<T = any>(path: string, body?: unknown) {
		return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
	}

	// biome-ignore lint/suspicious/noExplicitAny: generic default
	async put<T = any>(path: string, body?: unknown) {
		return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
	}

	// biome-ignore lint/suspicious/noExplicitAny: generic default
	async delete<T = any>(path: string) {
		return this.request<T>(path, { method: 'DELETE' })
	}
}

export class ApiError extends Error {
	status: number
	data: unknown

	constructor(message: string, status: number, data: unknown) {
		super(message)
		this.name = 'ApiError'
		this.status = status
		this.data = data
	}
}

export const api = new ApiClient()
