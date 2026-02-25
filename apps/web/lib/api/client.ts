const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

interface RequestOptions extends RequestInit {
	params?: Record<string, string>
}

class ApiClient {
	private baseUrl: string
	private supportSlug: string | null = null

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl
	}

	setSupportSlug(slug: string | null) {
		this.supportSlug = slug
	}

	private async parseJson(response: Response): Promise<any> {
		const text = await response.text()
		if (!text) return {}
		return JSON.parse(text)
	}

	private getHeaders(): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		}

		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('token')
			if (token) {
				headers['Authorization'] = `Bearer ${token}`
			}
		}

		if (this.supportSlug) {
			headers['X-Support-Slug'] = this.supportSlug
		}

		return headers
	}

	private buildUrl(path: string, params?: Record<string, string>): string {
		const url = new URL(`${this.baseUrl}${path}`)
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				url.searchParams.append(key, value)
			})
		}
		return url.toString()
	}

	async request<T = any>(
		path: string,
		options: RequestOptions = {}
	): Promise<{ data: T; status: number }> {
		const { params, ...fetchOptions } = options
		const url = this.buildUrl(path, params)

		const response = await fetch(url, {
			...fetchOptions,
			headers: {
				...this.getHeaders(),
				...fetchOptions.headers,
			},
		})

		const data = await this.parseJson(response)

		if (!response.ok) {
			let errorMessage = data.message || 'An error occurred'
			if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
				errorMessage = data.errors[0].message || errorMessage
			}
			throw new ApiError(errorMessage, response.status, data)
		}

		return { data, status: response.status }
	}

	async get<T = any>(path: string, params?: Record<string, string>) {
		return this.request<T>(path, { method: 'GET', params })
	}

	async post<T = any>(path: string, body?: any) {
		return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
	}

	async put<T = any>(path: string, body?: any) {
		return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
	}

	async patch<T = any>(path: string, body?: any) {
		return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
	}

	async delete<T = any>(path: string) {
		return this.request<T>(path, { method: 'DELETE' })
	}

	async upload<T = any>(path: string, formData: FormData, method: 'POST' | 'PUT' = 'POST') {
		const url = this.buildUrl(path)
		const headers: HeadersInit = {}

		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('token')
			if (token) {
				headers['Authorization'] = `Bearer ${token}`
			}
		}

		if (this.supportSlug) {
			headers['X-Support-Slug'] = this.supportSlug
		}

		const response = await fetch(url, {
			method,
			headers,
			body: formData,
		})

		const data = await this.parseJson(response)

		if (!response.ok) {
			let errorMessage = data.message || 'An error occurred'
			if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
				errorMessage = data.errors[0].message || errorMessage
			}
			throw new ApiError(errorMessage, response.status, data)
		}

		return { data, status: response.status }
	}

	getBaseUrl() {
		return this.baseUrl
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

export const api = new ApiClient(API_URL)
