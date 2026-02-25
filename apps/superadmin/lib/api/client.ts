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

	async request<T = any>(
		path: string,
		options: RequestInit & { params?: Record<string, string> } = {}
	): Promise<T> {
		const { params, ...fetchOptions } = options as any
		const url = this.buildUrl(path, params)

		const response = await fetch(url, {
			...fetchOptions,
			headers: {
				...this.getHeaders(),
				...fetchOptions.headers,
			},
		})

		const data = await response.json()

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
