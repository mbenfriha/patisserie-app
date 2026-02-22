import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	output: 'standalone',
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

export default nextConfig
