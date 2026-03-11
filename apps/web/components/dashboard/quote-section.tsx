'use client'

import {
	Check,
	ChevronDown,
	ChevronUp,
	Edit3,
	Euro,
	History,
	Loader2,
	RefreshCw,
	Save,
	Send,
	X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/client'

interface Quote {
	id: string
	orderId: string
	version: number
	price: number
	depositPercent: number
	confirmedDate: string | null
	message: string | null
	status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'revised'
	sentAt: string | null
	respondedAt: string | null
	createdAt: string
	updatedAt: string
}

interface QuoteSectionProps {
	orderId: string
	initialQuotePrice?: number
	onQuoteChange?: () => void
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString('fr-FR')
}

function getQuoteStatusColor(status: string) {
	switch (status) {
		case 'draft':
			return 'text-amber-700 bg-amber-50 border-amber-200'
		case 'sent':
			return 'text-blue-700 bg-blue-50 border-blue-200'
		case 'accepted':
			return 'text-green-700 bg-green-50 border-green-200'
		case 'rejected':
			return 'text-red-700 bg-red-50 border-red-200'
		case 'revised':
			return 'text-slate-600 bg-slate-50 border-slate-200'
		default:
			return ''
	}
}

function getQuoteBorderStyle(status: string) {
	switch (status) {
		case 'draft':
			return 'border-dashed border-amber-300 bg-amber-50/30'
		case 'sent':
			return 'border-blue-200 bg-blue-50/30'
		case 'accepted':
			return 'border-green-200 bg-green-50/30'
		case 'rejected':
			return 'border-red-200 bg-red-50/30'
		default:
			return ''
	}
}

export function QuoteSection({ orderId, initialQuotePrice, onQuoteChange }: QuoteSectionProps) {
	const t = useTranslations('quote')

	const [quotes, setQuotes] = useState<Quote[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [isSending, setIsSending] = useState(false)
	const [historyOpen, setHistoryOpen] = useState(false)

	// Form state
	const [price, setPrice] = useState(0)
	const [depositPercent, setDepositPercent] = useState(30)
	const [confirmedDate, setConfirmedDate] = useState('')
	const [message, setMessage] = useState('')

	const currentQuote = quotes.find((q) => q.status !== 'revised') || null
	const quoteHistory = quotes.filter((q) => q.id !== currentQuote?.id)
	const status = currentQuote?.status || 'draft'
	const isEditing = !currentQuote || currentQuote.status === 'draft'
	const depositAmount = price * (depositPercent / 100)

	const fetchQuotes = useCallback(async () => {
		try {
			const res = await api.get(`/patissier/orders/${orderId}/quotes`)
			const data: Quote[] = res.data?.data || res.data || []
			setQuotes(data)

			// Initialize form with current quote data
			const current = data.find((q) => q.status !== 'revised')
			if (current) {
				setPrice(current.price)
				setDepositPercent(current.depositPercent)
				setConfirmedDate(current.confirmedDate || '')
				setMessage(current.message || '')
			}
		} catch {
			// Quotes not found, that's ok
		} finally {
			setIsLoading(false)
		}
	}, [orderId])

	useEffect(() => {
		fetchQuotes()
	}, [fetchQuotes])

	// Sync price from costing tab
	useEffect(() => {
		if (initialQuotePrice && initialQuotePrice > 0 && status === 'draft') {
			setPrice(initialQuotePrice)
		}
	}, [initialQuotePrice, status])

	const handleSaveDraft = async () => {
		setIsSaving(true)
		try {
			await api.post(`/patissier/orders/${orderId}/quotes/draft`, {
				price,
				depositPercent,
				confirmedDate: confirmedDate || null,
				message: message || null,
			})
			toast.success(t('draftSaved'))
			await fetchQuotes()
			onQuoteChange?.()
		} catch {
			toast.error(t('error'))
		} finally {
			setIsSaving(false)
		}
	}

	const handleSendQuote = async () => {
		setIsSending(true)
		try {
			const res = await api.post(`/patissier/orders/${orderId}/quotes/send`, {
				price,
				depositPercent,
				confirmedDate: confirmedDate || null,
				message: message || null,
			})
			const warnings = res.data?.warnings as string[] | undefined
			if (warnings && warnings.length > 0) {
				toast.warning(warnings[0])
			} else {
				toast.success(t('quoteSent'))
			}
			await fetchQuotes()
			onQuoteChange?.()
		} catch {
			toast.error(t('error'))
		} finally {
			setIsSending(false)
		}
	}

	const handleUpdateStatus = async (newStatus: 'accepted' | 'rejected') => {
		if (!currentQuote) return
		try {
			await api.put(`/patissier/orders/${orderId}/quotes/${currentQuote.id}/status`, {
				status: newStatus,
			})
			toast.success(newStatus === 'accepted' ? t('accepted') : t('rejected'))
			await fetchQuotes()
			onQuoteChange?.()
		} catch {
			toast.error(t('error'))
		}
	}

	const handleRevise = async () => {
		if (!currentQuote) return
		try {
			if (currentQuote.status === 'rejected') {
				// For rejected quotes, create a new draft directly
				await api.post(`/patissier/orders/${orderId}/quotes/draft`, {
					price: currentQuote.price,
					depositPercent: currentQuote.depositPercent,
					confirmedDate: currentQuote.confirmedDate,
					message: '',
				})
			} else {
				await api.post(`/patissier/orders/${orderId}/quotes/${currentQuote.id}/revise`)
			}
			toast.success(t('revised'))
			await fetchQuotes()
			onQuoteChange?.()
		} catch {
			toast.error(t('error'))
		}
	}

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-12">
					<Loader2 className="size-6 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className={`border-2 ${getQuoteBorderStyle(status)}`}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<CardTitle className="flex items-center gap-2">
							<Euro className="size-5" />
							{t('title')}
						</CardTitle>
						<Badge variant="outline" className={getQuoteStatusColor(status)}>
							{t(`status${status.charAt(0).toUpperCase()}${status.slice(1)}`)}
						</Badge>
						{currentQuote && currentQuote.version > 1 && (
							<span className="text-xs text-muted-foreground">v{currentQuote.version}</span>
						)}
					</div>
					{currentQuote?.sentAt && (
						<span className="text-xs text-muted-foreground">
							{t('sentOn', { date: formatDate(currentQuote.sentAt) })}
						</span>
					)}
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{isEditing ? (
					/* Draft / Edit Mode */
					<div className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="quote-price">{t('proposedPrice')}</Label>
								<div className="relative">
									<Euro className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="quote-price"
										type="number"
										min="0"
										step="0.01"
										value={price || ''}
										onChange={(e) => setPrice(Number.parseFloat(e.target.value) || 0)}
										className="pl-9"
										placeholder="0.00"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="deposit-percent">{t('depositPercent')}</Label>
								<Select
									value={depositPercent.toString()}
									onValueChange={(v) => setDepositPercent(Number.parseInt(v, 10))}
								>
									<SelectTrigger id="deposit-percent">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="30">{t('deposit30')}</SelectItem>
										<SelectItem value="50">{t('deposit50')}</SelectItem>
										<SelectItem value="70">{t('deposit70')}</SelectItem>
										<SelectItem value="100">{t('deposit100')}</SelectItem>
									</SelectContent>
								</Select>
								{price > 0 && (
									<p className="text-xs text-muted-foreground">
										{t('depositAmount', { amount: formatCurrency(depositAmount) })}
									</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmed-date">{t('confirmedDate')}</Label>
							<Input
								id="confirmed-date"
								type="date"
								value={confirmedDate}
								onChange={(e) => setConfirmedDate(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="quote-message">{t('responseMessage')}</Label>
							<Textarea
								id="quote-message"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder={t('responsePlaceholder')}
								rows={4}
							/>
						</div>

						<div className="flex gap-2 pt-2">
							<Button
								variant="outline"
								onClick={handleSaveDraft}
								disabled={isSaving}
								className="flex-1"
							>
								{isSaving ? (
									<Loader2 className="mr-2 size-4 animate-spin" />
								) : (
									<Save className="mr-2 size-4" />
								)}
								{t('saveDraft')}
							</Button>
							<Button
								onClick={handleSendQuote}
								disabled={isSending || price <= 0}
								className="flex-1"
							>
								{isSending ? (
									<Loader2 className="mr-2 size-4 animate-spin" />
								) : (
									<Send className="mr-2 size-4" />
								)}
								{t('sendQuote')}
							</Button>
						</div>
					</div>
				) : (
					/* Read-only Mode (sent, accepted, rejected) */
					<div className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="rounded-lg border bg-background p-4">
								<p className="text-sm text-muted-foreground">{t('proposedPrice')}</p>
								<p className="text-2xl font-bold">{formatCurrency(currentQuote?.price || 0)}</p>
							</div>
							<div className="rounded-lg border bg-background p-4">
								<p className="text-sm text-muted-foreground">
									{t('depositPercent')} ({currentQuote?.depositPercent}%)
								</p>
								<p className="text-2xl font-bold">
									{formatCurrency(
										(currentQuote?.price || 0) * ((currentQuote?.depositPercent || 30) / 100)
									)}
								</p>
							</div>
						</div>

						<div className="rounded-lg border bg-background p-4">
							<p className="text-sm text-muted-foreground">{t('confirmedDate')}</p>
							<p className="font-medium">
								{currentQuote?.confirmedDate ? formatDate(currentQuote.confirmedDate) : '-'}
							</p>
						</div>

						{currentQuote?.message && (
							<div className="rounded-lg border bg-background p-4">
								<p className="mb-2 text-sm text-muted-foreground">{t('messageSent')}</p>
								<p className="text-sm">{currentQuote.message}</p>
							</div>
						)}

						<div className="flex gap-2 pt-2">
							{status === 'sent' && (
								<>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="outline" className="flex-1">
												<Edit3 className="mr-2 size-4" />
												{t('modifyQuote')}
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>{t('modifyDialog.title')}</AlertDialogTitle>
												<AlertDialogDescription>
													{t('modifyDialog.description')}
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>{t('modifyDialog.cancel')}</AlertDialogCancel>
												<AlertDialogAction onClick={handleRevise}>
													{t('modifyDialog.confirm')}
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
									<Button className="flex-1" onClick={() => handleUpdateStatus('accepted')}>
										<Check className="mr-2 size-4" />
										{t('markAccepted')}
									</Button>
									<Button
										variant="destructive"
										className="flex-1"
										onClick={() => handleUpdateStatus('rejected')}
									>
										<X className="mr-2 size-4" />
										{t('markRejected')}
									</Button>
								</>
							)}
							{status === 'accepted' && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button variant="outline" className="flex-1">
											<RefreshCw className="mr-2 size-4" />
											{t('reviseQuote')}
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>{t('reviseDialog.title')}</AlertDialogTitle>
											<AlertDialogDescription>
												{t('reviseDialog.description')}
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>{t('reviseDialog.cancel')}</AlertDialogCancel>
											<AlertDialogAction onClick={handleRevise}>
												{t('reviseDialog.confirm')}
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}
							{status === 'rejected' && (
								<Button onClick={handleRevise} className="flex-1">
									<RefreshCw className="mr-2 size-4" />
									{t('createNewQuote')}
								</Button>
							)}
						</div>
					</div>
				)}
			</CardContent>

			{/* Quote History */}
			{quoteHistory.length > 0 && (
				<CardFooter className="flex-col pt-0">
					<Separator className="mb-4" />
					<Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className="w-full">
						<CollapsibleTrigger asChild>
							<Button variant="ghost" className="w-full justify-between">
								<span className="flex items-center gap-2">
									<History className="size-4" />
									{t('history', { count: quoteHistory.length })}
								</span>
								{historyOpen ? (
									<ChevronUp className="size-4" />
								) : (
									<ChevronDown className="size-4" />
								)}
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent className="pt-4">
							<div className="space-y-3">
								{quoteHistory.map((quote) => (
									<div
										key={quote.id}
										className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
									>
										<div className="flex items-center gap-3">
											<span className="text-sm font-medium">
												{t('version', { version: quote.version })}
											</span>
											<span className="font-mono text-sm">{formatCurrency(quote.price)}</span>
											<span className="text-xs text-muted-foreground">
												{t('deposit', { percent: quote.depositPercent })}
											</span>
										</div>
										<div className="flex items-center gap-2">
											{quote.sentAt && (
												<span className="text-xs text-muted-foreground">
													{formatDate(quote.sentAt)}
												</span>
											)}
											<Badge variant="outline" className={getQuoteStatusColor(quote.status)}>
												{t(`status${quote.status.charAt(0).toUpperCase()}${quote.status.slice(1)}`)}
											</Badge>
										</div>
									</div>
								))}
							</div>
						</CollapsibleContent>
					</Collapsible>
				</CardFooter>
			)}
		</Card>
	)
}
