import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
	output: process.env.VERCEL ? undefined : 'standalone',
	reactStrictMode: true,
	async rewrites() {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
		return [
			{
				source: '/api/:path*',
				destination: `${apiUrl}/api/:path*`,
			},
		]
	},
}

export default process.env.NEXT_PUBLIC_SENTRY_DSN
	? withSentryConfig(nextConfig, {
			silent: true,
			sourcemaps: {
				deleteSourcemapsAfterUpload: true,
			},
		})
	: nextConfig
