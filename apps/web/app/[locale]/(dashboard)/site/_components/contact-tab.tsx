'use client'

import {
	Clock,
	Facebook,
	Globe,
	Instagram,
	Link2,
	Linkedin,
	MapPin,
	Phone,
	Youtube,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import type { Profile } from './types'
import { DAYS } from './types'

interface ContactTabProps {
	phone: string
	setPhone: (v: string) => void
	addressStreet: string
	setAddressStreet: (v: string) => void
	addressCity: string
	setAddressCity: (v: string) => void
	addressZip: string
	setAddressZip: (v: string) => void
	addressCountry: string
	setAddressCountry: (v: string) => void
	socialLinks: Profile['socialLinks']
	setSocialLinks: React.Dispatch<React.SetStateAction<Profile['socialLinks']>>
	operatingHours: Profile['operatingHours']
	updateOperatingHour: (
		day: string,
		field: 'open' | 'close' | 'closed',
		value: string | boolean
	) => void
}

export function ContactTab({
	phone,
	setPhone,
	addressStreet,
	setAddressStreet,
	addressCity,
	setAddressCity,
	addressZip,
	setAddressZip,
	addressCountry,
	setAddressCountry,
	socialLinks,
	setSocialLinks,
	operatingHours,
	updateOperatingHour,
}: ContactTabProps) {
	const t = useTranslations('siteEditor')

	return (
		<div className="space-y-6">
			{/* Contact Info */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Phone className="size-5" />
						{t('contactTitle')}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>{t('phoneLabel')}</Label>
						<Input
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+33 1 23 45 67 89"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Address */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<MapPin className="size-5" />
						{t('addressTitle')}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2 md:col-span-2">
							<Label>{t('street')}</Label>
							<Input
								type="text"
								value={addressStreet}
								onChange={(e) => setAddressStreet(e.target.value)}
								placeholder="12 rue de la Pâtisserie"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t('city')}</Label>
							<Input
								type="text"
								value={addressCity}
								onChange={(e) => setAddressCity(e.target.value)}
								placeholder="Paris"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t('zipCode')}</Label>
							<Input
								type="text"
								value={addressZip}
								onChange={(e) => setAddressZip(e.target.value)}
								placeholder="75001"
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>{t('country')}</Label>
							<Input
								type="text"
								value={addressCountry}
								onChange={(e) => setAddressCountry(e.target.value)}
								placeholder="France"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Social Links */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Globe className="size-5" />
						{t('socialTitle')}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Instagram className="size-4" />
								Instagram
							</Label>
							<Input
								type="url"
								value={socialLinks.instagram || ''}
								onChange={(e) => setSocialLinks((prev) => ({ ...prev, instagram: e.target.value }))}
								placeholder="https://instagram.com/votre-page"
							/>
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Facebook className="size-4" />
								Facebook
							</Label>
							<Input
								type="url"
								value={socialLinks.facebook || ''}
								onChange={(e) => setSocialLinks((prev) => ({ ...prev, facebook: e.target.value }))}
								placeholder="https://facebook.com/votre-page"
							/>
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
									<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
								</svg>
								TikTok
							</Label>
							<Input
								type="url"
								value={socialLinks.tiktok || ''}
								onChange={(e) => setSocialLinks((prev) => ({ ...prev, tiktok: e.target.value }))}
								placeholder="https://tiktok.com/@votre-page"
							/>
						</div>
						<div className="space-y-2">
							<Label>Snapchat</Label>
							<Input
								type="url"
								value={socialLinks.snapchat || ''}
								onChange={(e) => setSocialLinks((prev) => ({ ...prev, snapchat: e.target.value }))}
								placeholder="https://snapchat.com/add/votre-pseudo"
							/>
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Linkedin className="size-4" />
								LinkedIn
							</Label>
							<Input
								type="url"
								value={socialLinks.linkedin || ''}
								onChange={(e) => setSocialLinks((prev) => ({ ...prev, linkedin: e.target.value }))}
								placeholder="https://linkedin.com/in/votre-profil"
							/>
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Youtube className="size-4" />
								YouTube
							</Label>
							<Input
								type="url"
								value={socialLinks.youtube || ''}
								onChange={(e) => setSocialLinks((prev) => ({ ...prev, youtube: e.target.value }))}
								placeholder="https://youtube.com/@votre-chaine"
							/>
						</div>
					</div>

					<Separator />

					{/* Custom link */}
					<div className="space-y-4">
						<Label className="flex items-center gap-2">
							<Link2 className="size-4" />
							{t('customLink')}
						</Label>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label className="text-xs text-muted-foreground">{t('customLinkName')}</Label>
								<Input
									type="text"
									value={socialLinks.customLabel || ''}
									onChange={(e) =>
										setSocialLinks((prev) => ({
											...prev,
											customLabel: e.target.value,
										}))
									}
									placeholder="Mon autre site"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs text-muted-foreground">{t('customLinkUrl')}</Label>
								<Input
									type="url"
									value={socialLinks.customUrl || ''}
									onChange={(e) =>
										setSocialLinks((prev) => ({
											...prev,
											customUrl: e.target.value,
										}))
									}
									placeholder="https://..."
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Operating Hours */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Clock className="size-5" />
						{t('hoursTitle')}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="divide-y">
						{DAYS.map((day) => {
							const hours = operatingHours?.[day.key]
							const isClosed = hours?.closed === true
							return (
								<div key={day.key} className="flex items-center gap-3 py-2">
									<span className="w-24 text-sm font-medium">{day.label}</span>
									<Switch
										checked={!isClosed}
										onCheckedChange={(checked) => updateOperatingHour(day.key, 'closed', !checked)}
									/>
									{!isClosed ? (
										<div className="flex flex-1 items-center gap-2">
											<Input
												type="time"
												value={hours?.open || '09:00'}
												onChange={(e) => updateOperatingHour(day.key, 'open', e.target.value)}
												className="w-28"
											/>
											<span className="text-sm text-muted-foreground">à</span>
											<Input
												type="time"
												value={hours?.close || '18:00'}
												onChange={(e) => updateOperatingHour(day.key, 'close', e.target.value)}
												className="w-28"
											/>
										</div>
									) : (
										<span className="text-sm italic text-muted-foreground">{t('closed')}</span>
									)}
								</div>
							)
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
