'use client'

const FLAVORS = [
	'Chocolat',
	'Vanille',
	'Pistache',
	'Fraise',
	'Praliné',
	'Framboise',
	'Caramel',
	'Mangue',
	'Cacahouète',
	'Passion',
]

interface FlavorsSelectorProps {
	selected: string[]
	onChange: (flavors: string[]) => void
}

export function FlavorsSelector({ selected, onChange }: FlavorsSelectorProps) {
	function toggle(flavor: string) {
		if (selected.includes(flavor)) {
			onChange(selected.filter((f) => f !== flavor))
		} else {
			onChange([...selected, flavor])
		}
	}

	return (
		<div className="flex flex-wrap gap-3">
			{FLAVORS.map((flavor) => {
				const isSelected = selected.includes(flavor)
				return (
					<button
						key={flavor}
						type="button"
						onClick={() => toggle(flavor)}
						className="rounded-full border-2 px-5 py-2 text-sm font-medium transition-all duration-200"
						style={{
							fontFamily: "'Josefin Sans', sans-serif",
							borderColor: isSelected ? 'var(--gold)' : 'var(--cream-dark)',
							backgroundColor: isSelected ? 'var(--gold)' : 'transparent',
							color: isSelected ? 'white' : 'var(--dark-soft)',
						}}
					>
						{flavor}
					</button>
				)
			})}
		</div>
	)
}
