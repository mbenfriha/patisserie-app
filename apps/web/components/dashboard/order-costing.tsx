'use client'

import {
	AlertTriangle,
	Calculator,
	Check,
	Loader2,
	Plus,
	Save,
	Trash2,
	TrendingUp,
	XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api/client'

interface Ingredient {
	id: string
	name: string
	category: string
	unit: string
	pricePerUnit: number
}

interface Employee {
	id: string
	name: string
	role: string | null
	hourlyRate: number
}

interface OrderCostingProps {
	orderId: string
	currentTotal: number
	onApplyPrice?: (price: number) => void
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

const UNIT_LABELS: Record<string, string> = {
	g: 'g',
	kg: 'kg',
	ml: 'ml',
	L: 'L',
	piece: 'pièce',
}

export function OrderCosting({ orderId, currentTotal, onApplyPrice }: OrderCostingProps) {
	const t = useTranslations('costing')
	const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
	const [allEmployees, setAllEmployees] = useState<Employee[]>([])
	const [costingIngredients, setCostingIngredients] = useState<
		{ ingredientId: string; quantity: number }[]
	>([])
	const [costingLabor, setCostingLabor] = useState<{ employeeId: string; hours: number }[]>([])
	const [marginCoefficient, setMarginCoefficient] = useState(2.5)
	const [customPrice, setCustomPrice] = useState<string>('')
	const [ingredientPopoverOpen, setIngredientPopoverOpen] = useState(false)
	const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		Promise.all([
			api.get('/patissier/ingredients'),
			api.get('/patissier/employees'),
			api.get(`/patissier/orders/${orderId}/costing`),
		])
			.then(([ingRes, empRes, costRes]) => {
				setAllIngredients(ingRes.data?.data || ingRes.data || [])
				setAllEmployees(empRes.data?.data || empRes.data || [])

				const costing = costRes.data?.data || costRes.data
				if (costing) {
					if (costing.marginCoefficient != null) {
						setMarginCoefficient(costing.marginCoefficient)
					}
					if (costing.ingredients?.length) {
						setCostingIngredients(
							costing.ingredients.map((i: { ingredientId: string; quantity: number }) => ({
								ingredientId: i.ingredientId,
								quantity: i.quantity,
							}))
						)
					}
					if (costing.labor?.length) {
						setCostingLabor(
							costing.labor.map((l: { employeeId: string; hours: number }) => ({
								employeeId: l.employeeId,
								hours: l.hours,
							}))
						)
					}
				}
			})
			.catch((err) => {
				console.error('Failed to load costing data:', err)
			})
			.finally(() => setIsLoading(false))
	}, [orderId])

	const ingredientsCost = useMemo(
		() =>
			costingIngredients.reduce((sum, item) => {
				const ingredient = allIngredients.find((i) => i.id === item.ingredientId)
				if (!ingredient) return sum
				return sum + ingredient.pricePerUnit * item.quantity
			}, 0),
		[costingIngredients, allIngredients]
	)

	const laborCost = useMemo(
		() =>
			costingLabor.reduce((sum, item) => {
				const employee = allEmployees.find((e) => e.id === item.employeeId)
				if (!employee) return sum
				return sum + employee.hourlyRate * item.hours
			}, 0),
		[costingLabor, allEmployees]
	)

	const totalCost = ingredientsCost + laborCost
	const suggestedPrice = totalCost * marginCoefficient
	const hasCustomPrice = customPrice !== '' && !Number.isNaN(Number(customPrice))
	const finalPrice = hasCustomPrice ? Number(customPrice) : suggestedPrice
	const profit = finalPrice - totalCost
	const marginPercent = finalPrice > 0 ? (profit / finalPrice) * 100 : 0

	const getMarginIndicator = () => {
		if (marginPercent >= 50)
			return { color: 'text-green-600 bg-green-50', icon: Check, label: t('marginExcellent') }
		if (marginPercent >= 30)
			return {
				color: 'text-amber-600 bg-amber-50',
				icon: AlertTriangle,
				label: t('marginAcceptable'),
			}
		return { color: 'text-red-600 bg-red-50', icon: XCircle, label: t('marginLow') }
	}

	const marginIndicator = getMarginIndicator()
	const MarginIcon = marginIndicator.icon

	const addIngredient = (ingredientId: string) => {
		if (!costingIngredients.find((i) => i.ingredientId === ingredientId)) {
			setCostingIngredients([...costingIngredients, { ingredientId, quantity: 1 }])
		}
		setIngredientPopoverOpen(false)
	}

	const removeIngredient = (ingredientId: string) => {
		setCostingIngredients(costingIngredients.filter((i) => i.ingredientId !== ingredientId))
	}

	const updateIngredientQuantity = (ingredientId: string, quantity: number) => {
		setCostingIngredients(
			costingIngredients.map((i) => (i.ingredientId === ingredientId ? { ...i, quantity } : i))
		)
	}

	const addEmployee = (employeeId: string) => {
		if (!costingLabor.find((l) => l.employeeId === employeeId)) {
			setCostingLabor([...costingLabor, { employeeId, hours: 1 }])
		}
		setEmployeePopoverOpen(false)
	}

	const removeEmployee = (employeeId: string) => {
		setCostingLabor(costingLabor.filter((l) => l.employeeId !== employeeId))
	}

	const updateEmployeeHours = (employeeId: string, hours: number) => {
		setCostingLabor(costingLabor.map((l) => (l.employeeId === employeeId ? { ...l, hours } : l)))
	}

	const availableIngredients = allIngredients.filter(
		(i) => !costingIngredients.find((ci) => ci.ingredientId === i.id)
	)

	const availableEmployees = allEmployees.filter(
		(e) => !costingLabor.find((cl) => cl.employeeId === e.id)
	)

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await api.put(`/patissier/orders/${orderId}/costing`, {
				ingredients: costingIngredients,
				labor: costingLabor,
				marginCoefficient,
			})
			toast.success(t('saved'))
		} catch {
			toast.error(t('saveError'))
		} finally {
			setIsSaving(false)
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Matières premières */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-lg">{t('ingredientsTitle')}</CardTitle>
							<CardDescription>{t('ingredientsDescription')}</CardDescription>
						</div>
						<Popover open={ingredientPopoverOpen} onOpenChange={setIngredientPopoverOpen}>
							<PopoverTrigger asChild>
								<Button size="sm">
									<Plus className="mr-2 size-4" />
									{t('add')}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-64 p-0" align="end">
								<Command>
									<CommandInput placeholder={t('searchIngredient')} />
									<CommandList>
										<CommandEmpty>{t('noIngredientFound')}</CommandEmpty>
										<CommandGroup>
											{availableIngredients.map((ingredient) => (
												<CommandItem
													key={ingredient.id}
													onSelect={() => addIngredient(ingredient.id)}
												>
													<span>{ingredient.name}</span>
													<span className="ml-auto text-xs text-muted-foreground">
														{formatCurrency(ingredient.pricePerUnit)}/{ingredient.unit}
													</span>
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>
				</CardHeader>
				<CardContent>
					{costingIngredients.length === 0 ? (
						<p className="py-6 text-center text-sm text-muted-foreground">
							{t('noIngredientAdded')}
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t('ingredient')}</TableHead>
									<TableHead className="w-28">{t('quantity')}</TableHead>
									<TableHead className="text-right">{t('pricePerUnit')}</TableHead>
									<TableHead className="text-right">{t('subtotal')}</TableHead>
									<TableHead className="w-10" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{costingIngredients.map((item) => {
									const ingredient = allIngredients.find((i) => i.id === item.ingredientId)
									if (!ingredient) return null
									const subtotal = ingredient.pricePerUnit * item.quantity

									return (
										<TableRow key={item.ingredientId}>
											<TableCell className="font-medium">{ingredient.name}</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													<Input
														type="number"
														min="0"
														step="0.1"
														value={item.quantity}
														onChange={(e) =>
															updateIngredientQuantity(
																item.ingredientId,
																Number.parseFloat(e.target.value) || 0
															)
														}
														className="h-8 w-20"
													/>
													<span className="text-sm text-muted-foreground">
														{UNIT_LABELS[ingredient.unit] || ingredient.unit}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right font-mono text-sm">
												{formatCurrency(ingredient.pricePerUnit)}
											</TableCell>
											<TableCell className="text-right font-mono font-medium">
												{formatCurrency(subtotal)}
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="icon"
													className="size-8"
													onClick={() => removeIngredient(item.ingredientId)}
												>
													<Trash2 className="size-4" />
												</Button>
											</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					)}
					{costingIngredients.length > 0 && (
						<div className="mt-4 flex justify-end border-t pt-4">
							<div className="text-right">
								<p className="text-sm text-muted-foreground">{t('totalIngredients')}</p>
								<p className="text-lg font-bold">{formatCurrency(ingredientsCost)}</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Main d'oeuvre */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-lg">{t('laborTitle')}</CardTitle>
							<CardDescription>{t('laborDescription')}</CardDescription>
						</div>
						<Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
							<PopoverTrigger asChild>
								<Button size="sm">
									<Plus className="mr-2 size-4" />
									{t('add')}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-64 p-0" align="end">
								<Command>
									<CommandInput placeholder={t('searchEmployee')} />
									<CommandList>
										<CommandEmpty>{t('noEmployeeFound')}</CommandEmpty>
										<CommandGroup>
											{availableEmployees.map((employee) => (
												<CommandItem key={employee.id} onSelect={() => addEmployee(employee.id)}>
													<span>{employee.name}</span>
													<span className="ml-auto text-xs text-muted-foreground">
														{formatCurrency(employee.hourlyRate)}
														/h
													</span>
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>
				</CardHeader>
				<CardContent>
					{costingLabor.length === 0 ? (
						<p className="py-6 text-center text-sm text-muted-foreground">{t('noEmployeeAdded')}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t('employee')}</TableHead>
									<TableHead className="w-28">{t('hours')}</TableHead>
									<TableHead className="text-right">{t('hourlyRate')}</TableHead>
									<TableHead className="text-right">{t('subtotal')}</TableHead>
									<TableHead className="w-10" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{costingLabor.map((item) => {
									const employee = allEmployees.find((e) => e.id === item.employeeId)
									if (!employee) return null
									const subtotal = employee.hourlyRate * item.hours

									return (
										<TableRow key={item.employeeId}>
											<TableCell>
												<div>
													<p className="font-medium">{employee.name}</p>
													{employee.role && (
														<p className="text-xs text-muted-foreground">{employee.role}</p>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													<Input
														type="number"
														min="0"
														step="0.5"
														value={item.hours}
														onChange={(e) =>
															updateEmployeeHours(
																item.employeeId,
																Number.parseFloat(e.target.value) || 0
															)
														}
														className="h-8 w-20"
													/>
													<span className="text-sm text-muted-foreground">h</span>
												</div>
											</TableCell>
											<TableCell className="text-right font-mono text-sm">
												{formatCurrency(employee.hourlyRate)}
											</TableCell>
											<TableCell className="text-right font-mono font-medium">
												{formatCurrency(subtotal)}
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="icon"
													className="size-8"
													onClick={() => removeEmployee(item.employeeId)}
												>
													<Trash2 className="size-4" />
												</Button>
											</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					)}
					{costingLabor.length > 0 && (
						<div className="mt-4 flex justify-end border-t pt-4">
							<div className="text-right">
								<p className="text-sm text-muted-foreground">{t('totalLabor')}</p>
								<p className="text-lg font-bold">{formatCurrency(laborCost)}</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Récapitulatif */}
			<Card className="border-2 border-primary/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calculator className="size-5" />
						{t('summary')}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-3">
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t('ingredientsCost')}</span>
								<span className="font-mono">{formatCurrency(ingredientsCost)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t('laborCost')}</span>
								<span className="font-mono">{formatCurrency(laborCost)}</span>
							</div>
							<Separator />
							<div className="flex justify-between font-medium">
								<span>{t('totalCost')}</span>
								<span className="font-mono">{formatCurrency(totalCost)}</span>
							</div>
						</div>

						<div className="space-y-3">
							<div className="space-y-2">
								<Label htmlFor="margin">{t('marginCoefficient')}</Label>
								<div className="flex items-center gap-2">
									<Input
										id="margin"
										type="number"
										min="1"
										step="0.1"
										value={marginCoefficient}
										onChange={(e) => setMarginCoefficient(Number.parseFloat(e.target.value) || 1)}
										className="w-24"
									/>
									<span className="text-sm text-muted-foreground">x</span>
								</div>
							</div>
						</div>
					</div>

					<Separator />

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">{t('suggestedPrice')}</p>
								<p className="text-sm text-muted-foreground">{t('suggestedPriceDescription')}</p>
							</div>
							<p className="text-2xl font-bold text-primary">{formatCurrency(suggestedPrice)}</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="customPrice">{t('finalPrice')}</Label>
							<div className="flex items-center gap-2">
								<Input
									id="customPrice"
									type="number"
									min="0"
									step="0.01"
									value={customPrice}
									onChange={(e) => setCustomPrice(e.target.value)}
									placeholder={suggestedPrice > 0 ? suggestedPrice.toFixed(2) : t('enterAmount')}
									className="w-40"
								/>
								<span className="text-sm text-muted-foreground">EUR</span>
								{customPrice && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setCustomPrice('')}
										className="text-xs text-muted-foreground"
									>
										{t('resetToSuggested')}
									</Button>
								)}
							</div>
							<p className="text-xs text-muted-foreground">{t('finalPriceDescription')}</p>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">{t('profit')}</span>
							<span
								className={`font-mono font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
							>
								{profit >= 0 ? '+' : ''}
								{formatCurrency(profit)}
							</span>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">{t('realMargin')}</span>
								<Badge variant="outline" className={marginIndicator.color}>
									<MarginIcon className="mr-1 size-3" />
									{marginPercent.toFixed(1)}%
								</Badge>
							</div>
							<Progress value={Math.min(Math.max(marginPercent, 0), 100)} className="h-2" />
							<p className="text-xs text-muted-foreground">{marginIndicator.label}</p>
						</div>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">{t('currentPrice')}</p>
							<p className="text-lg font-medium">{formatCurrency(currentTotal)}</p>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={handleSave} disabled={isSaving}>
								{isSaving ? (
									<Loader2 className="mr-2 size-4 animate-spin" />
								) : (
									<Save className="mr-2 size-4" />
								)}
								{t('save')}
							</Button>
							<Button
								onClick={() => onApplyPrice?.(finalPrice)}
								disabled={!hasCustomPrice && finalPrice === 0}
							>
								<TrendingUp className="mr-2 size-4" />
								{t('applyPrice')}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
