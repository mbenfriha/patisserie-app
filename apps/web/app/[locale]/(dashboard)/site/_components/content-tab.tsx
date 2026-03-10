'use client'

import { Lock, Plus, RefreshCw, Trash2, Upload, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { getImageUrl } from '@/lib/utils/image-url'
import { AccordionSection } from './accordion'
import type { Profile, SiteConfig } from './types'
import { DEFAULT_MARQUEE } from './types'

interface ContentTabProps {
	profile: Profile
	siteConfig: SiteConfig
	ordersEnabled: boolean
	updateSiteConfigField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void
	onStoryImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
	onStoryImageDelete: () => void
	onPageHeroUpload: (page: string, e: React.ChangeEvent<HTMLInputElement>) => void
	onPageHeroDelete: (page: string) => void
}

function ImageUpload({
	label,
	value,
	onUpload,
	onDelete,
	aspectRatio = '16/9',
	hint,
}: {
	label: string
	value: string | null | undefined
	onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
	onDelete: () => void
	aspectRatio?: string
	hint?: string
}) {
	const t = useTranslations('siteEditor')
	const _tc = useTranslations('common')

	return (
		<div className="space-y-2">
			{label && <Label className="text-sm font-medium">{label}</Label>}
			<div
				className="relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50"
				style={{ aspectRatio }}
			>
				{value ? (
					<>
						<img src={getImageUrl(value)!} alt={label} className="size-full object-cover" />
						<div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
							<Button size="sm" variant="secondary" asChild>
								<label className="cursor-pointer">
									<Upload className="mr-1 size-4" />
									{t('change')}
									<input type="file" accept="image/*" onChange={onUpload} className="hidden" />
								</label>
							</Button>
							<Button
								size="sm"
								variant="destructive"
								onClick={(e) => {
									e.stopPropagation()
									onDelete()
								}}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					</>
				) : (
					<label className="cursor-pointer p-4 text-center">
						<Upload className="mx-auto size-8 text-muted-foreground" />
						<p className="mt-2 text-sm text-muted-foreground">{t('add')}</p>
						{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
						<input type="file" accept="image/*" onChange={onUpload} className="hidden" />
					</label>
				)}
			</div>
		</div>
	)
}

function TagInput({
	tags,
	onChange,
	placeholder,
}: {
	tags: string[]
	onChange: (tags: string[]) => void
	placeholder?: string
}) {
	const [input, setInput] = useState('')

	const addTag = () => {
		const item = input.trim()
		if (item && !tags.includes(item)) {
			onChange([...tags, item])
			setInput('')
		}
	}

	const removeTag = (tag: string) => {
		onChange(tags.filter((t) => t !== tag))
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap gap-2">
				{tags.map((tag) => (
					<Badge key={tag} variant="secondary" className="py-1 pl-3 pr-1">
						{tag}
						<button
							type="button"
							onClick={() => removeTag(tag)}
							className="ml-2 rounded p-0.5 hover:bg-muted"
						>
							<X className="size-3" />
						</button>
					</Badge>
				))}
			</div>
			<div className="flex gap-2">
				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault()
							addTag()
						}
					}}
					placeholder={placeholder}
					className="flex-1"
				/>
				<Button type="button" variant="outline" onClick={addTag}>
					<Plus className="size-4" />
				</Button>
			</div>
		</div>
	)
}

export function ContentTab({
	profile,
	siteConfig,
	ordersEnabled,
	updateSiteConfigField,
	onStoryImageUpload,
	onStoryImageDelete,
	onPageHeroUpload,
	onPageHeroDelete,
}: ContentTabProps) {
	const t = useTranslations('siteEditor')
	const tc = useTranslations('common')

	const marqueeItems = siteConfig.marqueeItems || DEFAULT_MARQUEE

	return (
		<div className="space-y-6">
			<Card>
				<CardContent className="divide-y pt-6">
					{/* Hero Section */}
					<AccordionSection title={t('heroTitle')} defaultOpen>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>{t('heroSubtitle')}</Label>
								<Input
									type="text"
									value={siteConfig.heroSubtitle || ''}
									onChange={(e) => updateSiteConfigField('heroSubtitle', e.target.value)}
									placeholder="patisserie & ateliers"
								/>
							</div>
							<div className="space-y-2">
								<Label>{t('ctaLabel')}</Label>
								<Input
									type="text"
									value={siteConfig.heroCtaLabel || ''}
									onChange={(e) => updateSiteConfigField('heroCtaLabel', e.target.value)}
									placeholder={ordersEnabled ? 'Commander' : 'Voir nos créations'}
								/>
							</div>
							<div className="space-y-2">
								<Label>{t('ctaLink')}</Label>
								<Select
									value={siteConfig.heroCtaHref || '__auto__'}
									onValueChange={(value) =>
										updateSiteConfigField('heroCtaHref', value === '__auto__' ? '' : value)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__auto__">{t('ctaAutomatic')}</SelectItem>
										<SelectGroup>
											<SelectLabel>{t('pages')}</SelectLabel>
											<SelectItem value="/creations">Créations</SelectItem>
											<SelectItem value="/commandes">Commandes</SelectItem>
											<SelectItem value="/workshops">Ateliers</SelectItem>
										</SelectGroup>
										<SelectGroup>
											<SelectLabel>{t('homeSections')}</SelectLabel>
											<SelectItem value="#story">Notre histoire</SelectItem>
											<SelectItem value="#creations">Créations</SelectItem>
											<SelectItem value="#workshops-cta">Ateliers</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">{t('ctaLinkDesc')}</p>
							</div>
						</div>
					</AccordionSection>

					{/* Story Section */}
					<AccordionSection title={t('storyTitle')}>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>{t('storyTitleLabel')}</Label>
								<Input
									type="text"
									value={siteConfig.storyTitle || ''}
									onChange={(e) => updateSiteConfigField('storyTitle', e.target.value)}
									placeholder="Notre histoire"
								/>
							</div>
							<div className="space-y-2">
								<Label>{t('storySubtitle')}</Label>
								<Input
									type="text"
									value={siteConfig.storySubtitle || ''}
									onChange={(e) => updateSiteConfigField('storySubtitle', e.target.value)}
									placeholder="qui sommes-nous"
								/>
							</div>
							<div className="space-y-2">
								<Label>{t('storyText')}</Label>
								<RichTextEditor
									content={siteConfig.storyText || ''}
									onChange={(html) => updateSiteConfigField('storyText', html)}
									placeholder={profile.description || 'Votre histoire...'}
								/>
							</div>
							<ImageUpload
								label={t('storyImage')}
								value={profile.storyImageUrl}
								onUpload={onStoryImageUpload}
								onDelete={onStoryImageDelete}
								aspectRatio="4/3"
							/>
						</div>
					</AccordionSection>

					{/* Marquee */}
					<AccordionSection title={t('marqueeTitle')}>
						<div className="space-y-4">
							<TagInput
								tags={marqueeItems}
								onChange={(words) => updateSiteConfigField('marqueeItems', words)}
								placeholder={t('addWordPlaceholder')}
							/>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => updateSiteConfigField('marqueeItems', DEFAULT_MARQUEE)}
							>
								<RefreshCw className="mr-2 size-4" />
								{t('resetDefault')}
							</Button>
						</div>
					</AccordionSection>

					{/* Creations Section */}
					<AccordionSection title={t('creationsTitle')}>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>{t('storyTitleLabel')}</Label>
								<Input
									type="text"
									value={siteConfig.creationsTitle || ''}
									onChange={(e) => updateSiteConfigField('creationsTitle', e.target.value)}
									placeholder="Nos Créations"
								/>
							</div>
							<div className="space-y-2">
								<Label>{t('storySubtitle')}</Label>
								<Input
									type="text"
									value={siteConfig.creationsSubtitle || ''}
									onChange={(e) => updateSiteConfigField('creationsSubtitle', e.target.value)}
									placeholder="nos spécialités"
								/>
							</div>
						</div>
					</AccordionSection>

					{/* Workshops CTA */}
					<AccordionSection
						title={t('workshopsCtaTitle')}
						badge={
							profile.plan === 'starter' ? (
								<Badge variant="secondary" className="text-xs">
									<Lock className="mr-1 size-3" />
									{tc('pro')}
								</Badge>
							) : undefined
						}
					>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>{t('storyTitleLabel')}</Label>
								<Input
									type="text"
									value={siteConfig.workshopsCtaTitle || ''}
									onChange={(e) => updateSiteConfigField('workshopsCtaTitle', e.target.value)}
									placeholder="Des cours de pâtisserie pour tous"
								/>
							</div>
							<div className="space-y-2">
								<Label>{t('storySubtitle')}</Label>
								<Input
									type="text"
									value={siteConfig.workshopsCtaSubtitle || ''}
									onChange={(e) => updateSiteConfigField('workshopsCtaSubtitle', e.target.value)}
									placeholder="master class"
								/>
							</div>
							<div className="space-y-2">
								<Label>{t('ctaDescription')}</Label>
								<RichTextEditor
									content={siteConfig.workshopsCtaDescription || ''}
									onChange={(html) => updateSiteConfigField('workshopsCtaDescription', html)}
									placeholder="La pâtisserie n'aura plus de secret pour vous..."
								/>
							</div>
							<div className="space-y-2">
								<Label>{t('ctaButtonLabel')}</Label>
								<Input
									type="text"
									value={siteConfig.workshopsCtaLabel || ''}
									onChange={(e) => updateSiteConfigField('workshopsCtaLabel', e.target.value)}
									placeholder="Réserver votre atelier"
								/>
							</div>
						</div>
					</AccordionSection>

					{/* Cover Images */}
					<AccordionSection title={t('pageHeroTitle')}>
						<div className="space-y-6">
							{(
								[
									{
										page: 'creations',
										label: t('creationsPage'),
										field: 'creationsHeroImageUrl',
									},
									{
										page: 'workshops',
										label: t('workshopsPage'),
										field: 'workshopsHeroImageUrl',
									},
									{
										page: 'products',
										label: t('productsPage'),
										field: 'productsHeroImageUrl',
									},
									{
										page: 'orders',
										label: t('ordersPage'),
										field: 'ordersHeroImageUrl',
									},
								] as const
							).map(({ page, label, field }) => (
								<ImageUpload
									key={page}
									label={label}
									value={profile[field]}
									onUpload={(e) => onPageHeroUpload(page, e)}
									onDelete={() => onPageHeroDelete(page)}
									aspectRatio="16/9"
								/>
							))}
						</div>
					</AccordionSection>
				</CardContent>
			</Card>
		</div>
	)
}
