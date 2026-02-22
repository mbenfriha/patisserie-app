import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
	output: 'standalone',
	reactStrictMode: true,
	images: {
		dangerouslyAllowSVG: true,
		unoptimized: process.env.NODE_ENV === 'development',
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*.r2.cloudflarestorage.com',
			},
			{
				protocol: 'http',
				hostname: 'localhost',
			},
			{
				protocol: 'http',
				hostname: '127.0.0.1',
			},
		],
	},
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

export default withNextIntl(nextConfig)
