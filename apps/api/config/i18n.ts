import { defineConfig, formatters, loaders } from '@adonisjs/i18n'

const i18nConfig = defineConfig({
	defaultLocale: 'fr',
	supportedLocales: ['fr', 'en'],
	formatter: formatters.icu(),
	loaders: [
		loaders.fs({
			location: new URL('../resources/lang', import.meta.url),
		}),
	],
})

export default i18nConfig
