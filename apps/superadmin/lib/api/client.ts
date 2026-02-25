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

	private async parseJson(response: Response): Promise<any> {
		const text = await response.text()
		if (!text) return {}
		return JSON.parse(text)
	}

	async request<T = any>(
		path: string,
		options: RequestInit & { params?: Record<string, string> } = {}
	): Promise<T> {
		const { params, ...fetchOptions } = options as any
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
				const retryData = await this.parseJson(retryResponse)
				if (!retryResponse.ok) {
					let errorMessage = retryData.message || 'An error occurred'
					if (retryData.errors && Array.isArray(retryData.errors) && retryData.errors.length > 0) {
						errorMessage = retryData.errors[0].message || errorMessage
					}
					throw new ApiError(errorMessage, retryResponse.status, retryData)
				}
				return retryData
			}
			throw new ApiError('Redirect sans URL de destination', response.status, null)
		}

		const data = await this.parseJson(response)

		if (!response.ok) {
			let errorMessage = data.message || 'An error occurred'
			if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
				errorMessage = data.errors[0].message || errorMessage
			}
			throw new ApiError(errorMessage, response.status, data)
		}

		return data
	}

	async get<T = any>(path: string, params?: Record<string, string>) {
		return this.request<T>(path, { method: 'GET', params } as any)
	}

	async post<T = any>(path: string, body?: any) {
		return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
	}

	async put<T = any>(path: string, body?: any) {
		return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
	}

	async delete<T = any>(path: string) {
		return this.request<T>(path, { method: 'DELETE' })
	}
}

export class ApiError extends Error {
	status: number
	data: any

	constructor(message: string, status: number, data: any) {
		super(message)
		this.name = 'ApiError'
		this.status = status
		this.data = data
	}
}

export const api = new ApiClient()
