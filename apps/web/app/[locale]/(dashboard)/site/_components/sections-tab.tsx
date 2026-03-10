'use client'

import { Instagram, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { FeatureToggle } from './toggle-row'
import type { SiteConfig } from './types'

interface SectionsTabProps {
	isPro: boolean
	siteConfig: SiteConfig
	ordersEnabled: boolean
	workshopsEnabled: boolean
	setOrdersEnabled: (v: boolean) => void
	setWorkshopsEnabled: (v: boolean) => void
	updateSiteConfigField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void
	instagramStatus: { connected: boolean; valid?: boolean; username?: string } | null
	instagramLoading: boolean
	onInstagramConnect: () => void
	onInstagramDisconnect: () => void
}

export function SectionsTab({
	isPro,
	siteConfig,
	ordersEnabled,
	workshopsEnabled,
	setOrdersEnabled,
	setWorkshopsEnabled,
	updateSiteConfigField,
	instagramStatus,
	instagramLoading,
	onInstagramConnect,
	onInstagramDisconnect,
}: SectionsTabProps) {
	const t = useTranslations('siteEditor')

	return (
		<div className="space-y-6">
			{/* Homepage Sections */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{t('homepageSections')}</CardTitle>
					<CardDescription>{t('sectionsDesc')}</CardDescription>
				</CardHeader>
				<CardContent className="divide-y">
					<FeatureToggle
						label={t('showStory')}
						description="Affiche la section de présentation"
						checked={siteConfig.showStorySection !== false}
						onCheckedChange={(v) => updateSiteConfigField('showStorySection', v)}
					/>
					<FeatureToggle
						label={t('showMarquee')}
						description="Affiche le bandeau avec vos spécialités"
						checked={siteConfig.showMarquee !== false}
						onCheckedChange={(v) => updateSiteConfigField('showMarquee', v)}
					/>
					<FeatureToggle
						label={t('showCreations')}
						description="Affiche vos créations mises en avant"
						checked={siteConfig.showCreationsOnHomepage !== false}
						onCheckedChange={(v) => updateSiteConfigField('showCreationsOnHomepage', v)}
					/>
					<FeatureToggle
						label={t('showWorkshopsCta')}
						description="Affiche le bloc d'appel à l'action pour les ateliers"
						checked={isPro ? siteConfig.showWorkshopsCta !== false : false}
						onCheckedChange={(v) => updateSiteConfigField('showWorkshopsCta', v)}
						requiresPro={!isPro}
						isLocked={!isPro}
					/>
					<FeatureToggle
						label={t('showInstagram')}
						description="Affiche vos dernières publications Instagram"
						checked={siteConfig.showInstagramSection === true}
						onCheckedChange={(v) => updateSiteConfigField('showInstagramSection', v)}
					>
						{/* Instagram Connection UI */}
						<div className="mt-2 rounded-lg border bg-muted/30 p-4">
							{instagramStatus?.connected ? (
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
											<Instagram className="size-5 text-white" />
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span className="font-medium">
													{instagramStatus.username
														? `@${instagramStatus.username}`
														: t('instagramConnected')}
												</span>
												{instagramStatus.valid === false ? (
													<Badge variant="destructive" className="text-xs">
														{t('instagramTokenExpired')}
													</Badge>
												) : (
													<Badge className="bg-green-500 text-xs">{t('instagramConnected')}</Badge>
												)}
											</div>
										</div>
									</div>
									<div className="flex gap-2">
										{instagramStatus.valid === false && (
											<Button
												size="sm"
												variant="outline"
												onClick={onInstagramConnect}
												disabled={instagramLoading}
											>
												<RefreshCw className="mr-1 size-4" />
												{t('instagramReconnect')}
											</Button>
										)}
										<Button
											size="sm"
											variant="ghost"
											className="text-destructive"
											onClick={onInstagramDisconnect}
											disabled={instagramLoading}
										>
											{t('instagramDisconnect')}
										</Button>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
											<Instagram className="size-5 text-white" />
										</div>
										<div>
											<p className="font-medium">Instagram</p>
											<p className="text-sm text-muted-foreground">{t('instagramConnectDesc')}</p>
										</div>
									</div>
									<Button size="sm" onClick={onInstagramConnect} disabled={instagramLoading}>
										{instagramLoading ? t('instagramConnecting') : t('instagramConnect')}
									</Button>
								</div>
							)}
						</div>
					</FeatureToggle>
				</CardContent>
			</Card>

			{/* Features / Pages */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{t('features')}</CardTitle>
					<CardDescription>Activez ou désactivez les fonctionnalités principales</CardDescription>
				</CardHeader>
				<CardContent className="divide-y">
					<FeatureToggle
						label={t('workshopPage')}
						description="Permettez aux clients de réserver des ateliers"
						checked={isPro ? workshopsEnabled : false}
						onCheckedChange={setWorkshopsEnabled}
						requiresPro={!isPro}
						isLocked={!isPro}
					/>
					<FeatureToggle
						label={t('orderPage')}
						description="Acceptez les commandes via votre site"
						checked={isPro ? ordersEnabled : false}
						onCheckedChange={setOrdersEnabled}
						requiresPro={!isPro}
						isLocked={!isPro}
					>
						<div className="mt-2 space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium">{t('catalogueTab')}</p>
									<p className="text-xs text-muted-foreground">Affiche vos produits en catalogue</p>
								</div>
								<Switch
									checked={siteConfig.showCatalogueTab !== false}
									onCheckedChange={(v) => updateSiteConfigField('showCatalogueTab', v)}
								/>
							</div>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium">{t('customOrderTab')}</p>
									<p className="text-xs text-muted-foreground">
										Formulaire de commande personnalisée
									</p>
								</div>
								<Switch
									checked={siteConfig.showCustomOrderTab !== false}
									onCheckedChange={(v) => updateSiteConfigField('showCustomOrderTab', v)}
								/>
							</div>
						</div>
					</FeatureToggle>
				</CardContent>
			</Card>
		</div>
	)
}
