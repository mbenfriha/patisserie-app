'use client'

import { Check, Image as ImageIcon, Trash2, Type, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getImageUrl } from '@/lib/utils/image-url'
import type { Profile } from './types'
import { FONT_PRESETS } from './types'

interface BrandingTabProps {
	profile: Profile
	primaryColor: string
	setPrimaryColor: (v: string) => void
	secondaryColor: string
	setSecondaryColor: (v: string) => void
	fontPreset: string
	setFontPreset: (v: string) => void
	onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
	onLogoDelete: () => void
	onHeroImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
	onHeroImageDelete: () => void
}

function ColorPicker({
	label,
	value,
	onChange,
}: {
	label: string
	value: string
	onChange: (value: string) => void
}) {
	return (
		<div className="space-y-2">
			<Label className="text-sm font-medium">{label}</Label>
			<div className="flex items-center gap-3">
				<div
					className="size-10 cursor-pointer rounded-lg border-2 shadow-sm transition-transform hover:scale-105"
					style={{ backgroundColor: value }}
				/>
				<Input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="flex-1 font-mono text-sm uppercase"
					maxLength={7}
				/>
				<Input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="size-10 cursor-pointer border-2 p-1"
				/>
			</div>
		</div>
	)
}

export function BrandingTab({
	profile,
	primaryColor,
	setPrimaryColor,
	secondaryColor,
	setSecondaryColor,
	fontPreset,
	setFontPreset,
	onLogoUpload,
	onLogoDelete,
	onHeroImageUpload,
	onHeroImageDelete,
}: BrandingTabProps) {
	const t = useTranslations('siteEditor')
	const tc = useTranslations('common')

	return (
		<div className="space-y-6">
			{/* Logo */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{t('logoTitle')}</CardTitle>
					<CardDescription>{t('logoDesc')}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-start gap-4">
						<div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/30">
							{profile.logoUrl ? (
								<img
									src={getImageUrl(profile.logoUrl)!}
									alt="Logo"
									className="size-full object-contain"
								/>
							) : (
								<ImageIcon className="size-8 text-muted-foreground" />
							)}
						</div>
						<div className="space-y-2">
							<Button variant="outline" size="sm" asChild>
								<label className="cursor-pointer">
									<Upload className="mr-2 size-4" />
									{profile.logoUrl ? t('changeLogo') : t('uploadLogo')}
									<input type="file" accept="image/*" onChange={onLogoUpload} className="hidden" />
								</label>
							</Button>
							{profile.logoUrl && (
								<Button
									variant="ghost"
									size="sm"
									className="text-destructive"
									onClick={onLogoDelete}
								>
									<Trash2 className="mr-2 size-4" />
									{tc('delete')}
								</Button>
							)}
							<p className="text-xs text-muted-foreground">PNG, JPG. Max 2MB</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Colors */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{t('colorsTitle')}</CardTitle>
					<CardDescription>{t('colorsDesc')}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<ColorPicker label={t('primaryColor')} value={primaryColor} onChange={setPrimaryColor} />
					<ColorPicker
						label={t('secondaryColor')}
						value={secondaryColor}
						onChange={setSecondaryColor}
					/>
				</CardContent>
			</Card>

			{/* Typography */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Type className="size-5" />
						{t('fontTitle')}
					</CardTitle>
					<CardDescription>{t('fontDesc')}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3">
						{FONT_PRESETS.map((preset) => (
							<button
								key={preset.value}
								type="button"
								onClick={() => setFontPreset(preset.value)}
								className={`relative rounded-lg border-2 p-4 text-left transition-all ${
									fontPreset === preset.value
										? 'border-primary bg-primary/5 ring-2 ring-primary/20'
										: 'border-border hover:border-primary/50'
								}`}
							>
								{fontPreset === preset.value && (
									<div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
										<Check className="size-3" />
									</div>
								)}
								<p className="text-sm font-semibold">{preset.label}</p>
								<p className="mt-1 text-xs text-muted-foreground">{preset.fonts}</p>
							</button>
						))}
					</div>
					<p className="mt-3 text-xs text-muted-foreground">{t('fontHint')}</p>
				</CardContent>
			</Card>

			{/* Hero Image */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{t('heroImageTitle')}</CardTitle>
					<CardDescription>{t('heroImageDesc')}</CardDescription>
				</CardHeader>
				<CardContent>
					<div
						className="relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50"
						style={{ aspectRatio: '16/9' }}
					>
						{profile.heroImageUrl ? (
							<>
								<img
									src={getImageUrl(profile.heroImageUrl)!}
									alt="Hero"
									className="size-full object-cover"
								/>
								<div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
									<Button size="sm" variant="secondary" asChild>
										<label className="cursor-pointer">
											<Upload className="mr-1 size-4" />
											{t('change')}
											<input
												type="file"
												accept="image/*"
												onChange={onHeroImageUpload}
												className="hidden"
											/>
										</label>
									</Button>
									<Button size="sm" variant="destructive" onClick={onHeroImageDelete}>
										<Trash2 className="size-4" />
									</Button>
								</div>
							</>
						) : (
							<label className="cursor-pointer p-4 text-center">
								<Upload className="mx-auto size-8 text-muted-foreground" />
								<p className="mt-2 text-sm text-muted-foreground">{t('add')}</p>
								<p className="mt-1 text-xs text-muted-foreground">Format 16:9</p>
								<input
									type="file"
									accept="image/*"
									onChange={onHeroImageUpload}
									className="hidden"
								/>
							</label>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
