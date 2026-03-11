import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { ApiClient, apiClient } from '@japa/api-client'
import { assert } from '@japa/assert'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import type { Config } from '@japa/runner/types'

ApiClient.setup((request) => {
	request.header('Accept', 'application/json')
})

export const plugins: Config['plugins'] = [
	assert(),
	pluginAdonisJS(app),
	apiClient(),
	authApiClient(app),
]

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
	setup: [() => testUtils.db().migrate()],
	teardown: [],
}

export const configureSuite: Config['configureSuite'] = (suite) => {
	if (['functional'].includes(suite.name)) {
		return suite.setup(() => testUtils.httpServer().start())
	}
}
