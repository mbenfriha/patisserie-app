'use client'

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { ApiError, api } from '@/lib/api/client'

interface PatissierProfile {
	id: string
	slug: string
	businessName: string
	logoUrl: string | null
	description: string | null
	plan: 'starter' | 'pro' | 'premium'
}

interface User {
	id: string
	email: string
	fullName: string | null
	role: 'patissier' | 'client' | 'superadmin'
	emailVerifiedAt: string | null
	profile?: PatissierProfile
}

interface RegisterData {
	email: string
	password: string
	fullName?: string
	role: 'patissier' | 'client'
	slug?: string
	businessName?: string
}

interface LoginData {
	email: string
	password: string
}

interface AuthContextType {
	user: User | null
	isLoading: boolean
	isAuthenticated: boolean
	login: (data: LoginData) => Promise<void>
	register: (data: RegisterData) => Promise<void>
	logout: () => Promise<void>
	refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const router = useRouter()

	const refreshUser = useCallback(async () => {
		try {
			const token = localStorage.getItem('token')
			if (!token) {
				setUser(null)
				return
			}

			const response = await api.get('/auth/me')
			setUser(response.data.user)
		} catch {
			localStorage.removeItem('token')
			setUser(null)
		}
	}, [])

	useEffect(() => {
		refreshUser().finally(() => setIsLoading(false))
	}, [])

	const register = async (data: RegisterData) => {
		const response = await api.post('/auth/register', data)

		if (response.data.token) {
			localStorage.setItem('token', response.data.token)
			setUser(response.data.user)
		}

		if (response.data.user.role === 'patissier') {
			router.push('/dashboard')
		}
	}

	const login = async (data: LoginData) => {
		const response = await api.post('/auth/login', data)
		localStorage.setItem('token', response.data.token)
		setUser(response.data.user)

		if (response.data.user.role === 'patissier') {
			router.push('/dashboard')
		} else if (response.data.user.role === 'superadmin') {
			// Redirect to superadmin app
			window.location.href = process.env.NEXT_PUBLIC_SUPERADMIN_URL || 'http://localhost:3001'
		}
	}

	const logout = async () => {
		try {
			await api.post('/auth/logout')
		} catch {
			// Ignore error
		}
		localStorage.removeItem('token')
		setUser(null)
		router.push('/login')
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAuthenticated: !!user,
				login,
				register,
				logout,
				refreshUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

export { ApiError }
