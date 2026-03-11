import { ExceptionHandler, type HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import * as Sentry from '@sentry/node'
import env from '#start/env'

const sentryDsn = env.get('SENTRY_DSN')
if (sentryDsn) {
	Sentry.init({
		dsn: sentryDsn,
		environment: app.inProduction ? 'production' : 'development',
		tracesSampleRate: app.inProduction ? 0.1 : 1.0,
	})
}

export default class HttpExceptionHandler extends ExceptionHandler {
	protected debug = !app.inProduction

	async handle(error: unknown, ctx: HttpContext) {
		return super.handle(error, ctx)
	}

	async report(error: unknown, ctx: HttpContext) {
		if (sentryDsn) {
			Sentry.withScope((scope) => {
				scope.setUser({
					id: ctx.auth?.user?.id,
					email: ctx.auth?.user?.email,
				})
				scope.setTag('url', ctx.request.url())
				scope.setTag('method', ctx.request.method())
				Sentry.captureException(error)
			})
		}

		return super.report(error, ctx)
	}
}
