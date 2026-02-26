import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Suppression des données — Patissio',
	description: 'Comment demander la suppression de vos données personnelles sur Patissio.',
}

export default function DataDeletionPage() {
	return (
		<div className="mx-auto max-w-3xl px-6 py-16">
			<h1 className="mb-2 text-3xl font-bold">Suppression des données</h1>
			<p className="mb-10 text-sm text-muted-foreground">
				Conformément au RGPD et aux exigences de Meta (Instagram)
			</p>

			<div className="prose prose-neutral max-w-none dark:prose-invert">
				<h2>Comment supprimer vos données</h2>
				<p>
					Si vous avez utilisé votre compte Instagram pour vous connecter ou interagir avec
					Patissio, vous pouvez demander la suppression de vos données à tout moment.
				</p>

				<h3>Option 1 : Depuis votre tableau de bord Patissio</h3>
				<ol>
					<li>
						Connectez-vous à votre compte sur{' '}
						<a href="https://patissio.com">patissio.com</a>.
					</li>
					<li>
						Rendez-vous dans <strong>Mon site</strong>, onglet <strong>Contact & réseaux</strong>.
					</li>
					<li>
						Cliquez sur <strong>Déconnecter</strong> à côté de votre compte Instagram connecté.
					</li>
					<li>
						Votre jeton d'accès Instagram sera immédiatement supprimé de nos serveurs.
					</li>
				</ol>

				<h3>Option 2 : Par e-mail</h3>
				<p>
					Envoyez un e-mail à{' '}
					<a href="mailto:contact@patissio.com">contact@patissio.com</a> avec :
				</p>
				<ul>
					<li>
						<strong>Objet :</strong> Demande de suppression de données
					</li>
					<li>
						<strong>Contenu :</strong> votre adresse e-mail associée à votre compte Patissio et/ou
						votre nom d'utilisateur Instagram.
					</li>
				</ul>
				<p>
					Nous traiterons votre demande dans un délai maximum de <strong>30 jours</strong> et vous
					enverrons une confirmation par e-mail une fois la suppression effectuée.
				</p>

				<h3>Option 3 : Depuis les paramètres Instagram</h3>
				<p>
					Vous pouvez également révoquer l'accès de Patissio directement depuis Instagram :
				</p>
				<ol>
					<li>
						Ouvrez l'application Instagram et allez dans{' '}
						<strong>Paramètres &gt; Sites Web &gt; Applications et sites Web</strong>.
					</li>
					<li>Trouvez Patissio dans la liste des applications autorisées.</li>
					<li>
						Cliquez sur <strong>Supprimer</strong> pour révoquer l'accès.
					</li>
				</ol>
				<p>
					Après révocation, le jeton d'accès stocké sur nos serveurs deviendra invalide et sera
					automatiquement nettoyé.
				</p>

				<h2>Quelles données sont supprimées ?</h2>
				<ul>
					<li>Jeton d'accès Instagram (supprimé immédiatement).</li>
					<li>
						Aucune photo ou contenu Instagram n'est stocké sur nos serveurs — les images sont
						récupérées en temps réel depuis les serveurs d'Instagram.
					</li>
				</ul>

				<h2>Suppression complète du compte</h2>
				<p>
					Si vous souhaitez supprimer l'intégralité de votre compte Patissio et toutes les données
					associées (profil, créations, commandes, etc.), envoyez votre demande à{' '}
					<a href="mailto:contact@patissio.com">contact@patissio.com</a>. La suppression sera
					effectuée dans un délai de 30 jours, sous réserve des obligations légales de conservation.
				</p>

				<h2>Contact</h2>
				<p>
					Pour toute question :{' '}
					<a href="mailto:contact@patissio.com">contact@patissio.com</a>
				</p>
			</div>
		</div>
	)
}
