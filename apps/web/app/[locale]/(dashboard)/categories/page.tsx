'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api/client'

interface Category {
	id: string
	name: string
	slug: string
	description: string | null
	sortOrder: number
	isVisible: boolean
}

export default function CategoriesPage() {
	const t = useTranslations('nav')
	const [categories, setCategories] = useState<Category[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		api
			.get('/patissier/categories')
			.then((res) => {
				const list = res.data?.data ?? res.data
				setCategories(Array.isArray(list) ? list : [])
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [])

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">{t('categories')}</h1>
				<button
					type="button"
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					+ Nouvelle catégorie
				</button>
			</div>

			{isLoading ? (
				<p className="text-muted-foreground">Chargement...</p>
			) : categories.length === 0 ? (
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">Aucune catégorie</p>
				</div>
			) : (
				<div className="space-y-2">
					{categories.map((cat) => (
						<div key={cat.id} className="flex items-center justify-between rounded-lg border p-4">
							<div>
								<h3 className="font-medium">{cat.name}</h3>
								{cat.description && (
									<p className="text-sm text-muted-foreground">{cat.description}</p>
								)}
							</div>
							<div className="flex gap-2">
								<button type="button" className="text-sm text-muted-foreground hover:text-foreground">
									Modifier
								</button>
								<button type="button" className="text-sm text-destructive hover:text-destructive/80">
									Supprimer
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
