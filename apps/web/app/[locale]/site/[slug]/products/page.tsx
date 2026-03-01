import { notFound } from 'next/navigation'
import { resolveSlug } from '@/lib/resolve-slug'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

type Props = {
	params: Promise<{ slug: string }>
}

export default async function ProductsCataloguePage({ params }: Props) {
	const { slug: paramSlug } = await params
	const slug = await resolveSlug(paramSlug)

	let profile: any = null
	let products: any[] = []

	try {
		const [profileRes, productsRes] = await Promise.all([
			fetch(`${API_URL}/public/${slug}`, { next: { revalidate: 60 } }),
			fetch(`${API_URL}/public/${slug}/products`, { next: { revalidate: 60 } }),
		])
		if (!profileRes.ok) return notFound()
		profile = (await profileRes.json()).data
		products = productsRes.ok ? (await productsRes.json()).data || [] : []
	} catch {
		return notFound()
	}

	return (
		<div className="mx-auto max-w-6xl px-6 py-12">
			<h1 className="text-3xl font-bold">Notre catalogue</h1>
			<p className="mt-2 text-muted-foreground">{profile.businessName}</p>

			{products.length === 0 ? (
				<p className="mt-12 text-center text-muted-foreground">Catalogue non disponible</p>
			) : (
				<div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{products.map((product: any) => (
						<div
							key={product.id}
							className="overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
						>
							{product.images?.[0]?.url && (
								<img
									src={product.images[0].url}
									alt={product.name}
									className="h-56 w-full object-cover"
								/>
							)}
							<div className="p-4">
								<h3 className="text-lg font-medium">{product.name}</h3>

								{product.description && (
									<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
										{product.description}
									</p>
								)}

								<div className="mt-3 flex items-baseline gap-2">
									{product.price && (
										<span
											className="text-lg font-semibold"
											style={{ color: profile.primaryColor }}
										>
											{product.price} &euro;
										</span>
									)}
									{product.unit && (
										<span className="text-sm text-muted-foreground">
											/ {product.unit}
										</span>
									)}
								</div>

								{product.preparation_days != null && (
									<p className="mt-2 text-sm text-muted-foreground">
										Pr&eacute;paration : {product.preparation_days} jour{product.preparation_days > 1 ? 's' : ''}
									</p>
								)}

								{product.allergens && product.allergens.length > 0 && (
									<div className="mt-3 flex flex-wrap gap-1">
										{product.allergens.map((allergen: string, index: number) => (
											<span
												key={index}
												className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800"
											>
												{allergen}
											</span>
										))}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
