import { check, sleep } from 'k6'
import http from 'k6/http'

// Usage: k6 run apps/api/tests/performance/api-load.js
// Requires: API running at localhost:3333 with test data

const BASE_URL = __ENV.API_URL || 'http://localhost:3333'

export const options = {
	stages: [
		{ duration: '15s', target: 20 },
		{ duration: '30s', target: 50 },
		{ duration: '30s', target: 100 },
		{ duration: '15s', target: 0 },
	],
	thresholds: {
		http_req_duration: ['p(95)<500'],
		http_req_failed: ['rate<0.01'],
	},
}

export default function () {
	// Health check
	const healthRes = http.get(`${BASE_URL}/health`)
	check(healthRes, {
		'health status 200': (r) => r.status === 200,
		'health response time < 200ms': (r) => r.timings.duration < 200,
	})

	// Public slug check
	const slugRes = http.get(`${BASE_URL}/public/check-slug/test-shop`)
	check(slugRes, {
		'slug check status 200': (r) => r.status === 200,
		'slug check response time < 500ms': (r) => r.timings.duration < 500,
	})

	// Public profile (if exists)
	const profileRes = http.get(`${BASE_URL}/public/test-shop`)
	check(profileRes, {
		'profile status 200 or 404': (r) => r.status === 200 || r.status === 404,
		'profile response time < 500ms': (r) => r.timings.duration < 500,
	})

	sleep(0.5)
}
