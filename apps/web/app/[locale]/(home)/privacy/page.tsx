import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Politique de confidentialité — Patissio',
	description: 'Politique de confidentialité de la plateforme Patissio.',
}

export default function PrivacyPage() {
	return (
		<div className="mx-auto max-w-3xl px-6 py-16">
			<h1 className="mb-2 text-3xl font-bold">Politique de confidentialité</h1>
			<p className="mb-10 text-sm text-muted-foreground">Dernière mise à jour : 26 février 2026</p>

			<div className="prose prose-neutral max-w-none dark:prose-invert">
				<h2>1. Introduction</h2>
				<p>
					Patissio (ci-après « nous », « notre » ou « la Plateforme ») est une plateforme en ligne
					éditée par Patissio, permettant aux artisans pâtissiers de créer leur site vitrine, gérer
					leurs créations, recevoir des commandes et proposer des ateliers. La présente politique de
					confidentialité décrit comment nous collectons, utilisons et protégeons vos données
					personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
				</p>

				<h2>2. Données collectées</h2>
				<p>Nous collectons les catégories de données suivantes :</p>

				<h3>2.1 Données des pâtissiers (utilisateurs professionnels)</h3>
				<ul>
					<li>
						<strong>Données d'inscription :</strong> nom, prénom, adresse e-mail, mot de passe
						(chiffré).
					</li>
					<li>
						<strong>Données de profil professionnel :</strong> nom de la pâtisserie, description,
						adresse, numéro de téléphone, liens vers les réseaux sociaux, logo et images.
					</li>
					<li>
						<strong>Données de contenu :</strong> créations, catégories, produits, ateliers et
						images associées publiés sur la Plateforme.
					</li>
					<li>
						<strong>Données de paiement :</strong> informations nécessaires à la gestion des
						abonnements et des paiements via Stripe (nous ne stockons pas les numéros de carte
						bancaire).
					</li>
					<li>
						<strong>Données d'intégration Instagram :</strong> jeton d'accès OAuth pour afficher
						votre feed Instagram sur votre site vitrine. Nous ne stockons ni votre mot de passe
						Instagram ni vos messages privés.
					</li>
				</ul>

				<h3>2.2 Données des clients (visiteurs et acheteurs)</h3>
				<ul>
					<li>
						<strong>Données de commande :</strong> nom, prénom, adresse e-mail, numéro de
						téléphone, détails de la commande.
					</li>
					<li>
						<strong>Données de réservation d'atelier :</strong> nom, prénom, adresse e-mail,
						nombre de participants.
					</li>
					<li>
						<strong>Messages :</strong> contenu des échanges entre clients et pâtissiers dans le
						cadre d'une commande.
					</li>
				</ul>

				<h3>2.3 Données techniques</h3>
				<ul>
					<li>Adresse IP, type de navigateur, système d'exploitation.</li>
					<li>Données de navigation et d'utilisation de la Plateforme.</li>
				</ul>

				<h2>3. Finalités du traitement</h2>
				<p>Vos données sont collectées et traitées pour les finalités suivantes :</p>
				<ul>
					<li>Création et gestion de votre compte utilisateur.</li>
					<li>
						Fourniture des services de la Plateforme (site vitrine, gestion de commandes,
						ateliers).
					</li>
					<li>Gestion des abonnements et des paiements.</li>
					<li>
						Intégration avec des services tiers (Instagram, Stripe) à votre demande explicite.
					</li>
					<li>Communication relative à votre compte et aux services.</li>
					<li>Notifications liées aux commandes, réservations et messages.</li>
					<li>Amélioration de la Plateforme et statistiques anonymisées.</li>
					<li>Respect de nos obligations légales.</li>
				</ul>

				<h2>4. Bases légales du traitement</h2>
				<ul>
					<li>
						<strong>Exécution du contrat :</strong> traitement nécessaire à la fourniture de nos
						services (création de compte, gestion de commandes, abonnements).
					</li>
					<li>
						<strong>Consentement :</strong> intégrations tierces (Instagram), cookies non
						essentiels.
					</li>
					<li>
						<strong>Intérêt légitime :</strong> amélioration de la Plateforme, statistiques
						d'utilisation, sécurité.
					</li>
					<li>
						<strong>Obligation légale :</strong> conservation des données de facturation.
					</li>
				</ul>

				<h2>5. Intégration Instagram</h2>
				<p>
					Lorsque vous connectez votre compte Instagram à Patissio, nous utilisons l'API Instagram
					(Meta) pour récupérer et afficher votre feed de photos publiques sur votre site vitrine.
				</p>
				<ul>
					<li>
						Nous stockons uniquement un <strong>jeton d'accès</strong> qui permet de lire vos
						publications publiques.
					</li>
					<li>
						Nous n'accédons pas à vos messages privés, vos followers ni vos données
						personnelles Instagram au-delà de votre nom d'utilisateur et de vos publications
						publiques.
					</li>
					<li>
						Vous pouvez <strong>déconnecter Instagram</strong> à tout moment depuis votre tableau
						de bord. Le jeton d'accès sera alors immédiatement supprimé.
					</li>
					<li>
						Les données Instagram affichées (images, légendes) sont récupérées en temps réel
						depuis les serveurs d'Instagram et ne sont pas stockées sur nos serveurs.
					</li>
				</ul>

				<h2>6. Intégration Stripe</h2>
				<p>
					Les paiements (abonnements et transactions) sont gérés par Stripe, Inc. Nous ne stockons
					aucune donnée bancaire sur nos serveurs. Stripe agit en tant que sous-traitant conforme au
					RGPD. Consultez la{' '}
					<a
						href="https://stripe.com/fr/privacy"
						target="_blank"
						rel="noopener noreferrer"
					>
						politique de confidentialité de Stripe
					</a>
					.
				</p>

				<h2>7. Partage des données</h2>
				<p>Vos données personnelles ne sont jamais vendues. Elles peuvent être partagées avec :</p>
				<ul>
					<li>
						<strong>Stripe :</strong> pour le traitement des paiements et la gestion des comptes
						connectés.
					</li>
					<li>
						<strong>Meta (Instagram) :</strong> dans le cadre de l'intégration Instagram, à votre
						demande.
					</li>
					<li>
						<strong>Hébergeur :</strong> nos serveurs sont hébergés au sein de l'Union européenne.
					</li>
					<li>
						<strong>Autorités compétentes :</strong> en cas d'obligation légale.
					</li>
				</ul>

				<h2>8. Durée de conservation</h2>
				<ul>
					<li>
						<strong>Données de compte :</strong> conservées tant que votre compte est actif, puis
						supprimées dans un délai de 30 jours après la clôture du compte.
					</li>
					<li>
						<strong>Données de commande :</strong> conservées pendant la durée légale de
						conservation des documents commerciaux (10 ans).
					</li>
					<li>
						<strong>Jetons Instagram :</strong> supprimés immédiatement lors de la déconnexion
						d'Instagram ou de la clôture du compte.
					</li>
					<li>
						<strong>Données techniques :</strong> conservées 12 mois maximum.
					</li>
				</ul>

				<h2>9. Vos droits</h2>
				<p>
					Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
				</p>
				<ul>
					<li>
						<strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles.
					</li>
					<li>
						<strong>Droit de rectification :</strong> corriger des données inexactes ou
						incomplètes.
					</li>
					<li>
						<strong>Droit à l'effacement :</strong> demander la suppression de vos données.
					</li>
					<li>
						<strong>Droit à la portabilité :</strong> recevoir vos données dans un format
						structuré.
					</li>
					<li>
						<strong>Droit d'opposition :</strong> vous opposer au traitement de vos données.
					</li>
					<li>
						<strong>Droit au retrait du consentement :</strong> retirer votre consentement à tout
						moment (ex : déconnecter Instagram).
					</li>
				</ul>
				<p>
					Pour exercer ces droits, contactez-nous à l'adresse :{' '}
					<a href="mailto:contact@patissio.com">contact@patissio.com</a>.
				</p>

				<h2>10. Sécurité</h2>
				<p>
					Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
					protéger vos données :
				</p>
				<ul>
					<li>Chiffrement des mots de passe (hachage irréversible).</li>
					<li>Communications sécurisées via HTTPS/TLS.</li>
					<li>Authentification par jetons sécurisés avec expiration.</li>
					<li>Jetons Instagram chiffrés et non exposés publiquement.</li>
					<li>Limitation du débit des requêtes API pour prévenir les abus.</li>
				</ul>

				<h2>11. Cookies</h2>
				<p>
					La Plateforme utilise des cookies strictement nécessaires au fonctionnement du service
					(authentification, préférences de langue). Nous n'utilisons pas de cookies publicitaires
					ni de trackers tiers.
				</p>

				<h2>12. Suppression des données</h2>
				<p>
					Vous pouvez demander la suppression complète de votre compte et de toutes les données
					associées en nous contactant à{' '}
					<a href="mailto:contact@patissio.com">contact@patissio.com</a>. La suppression sera
					effectuée dans un délai de 30 jours, sous réserve des obligations légales de conservation.
				</p>

				<h2>13. Modifications</h2>
				<p>
					Nous nous réservons le droit de modifier cette politique de confidentialité. En cas de
					modification substantielle, nous vous en informerons par e-mail ou via une notification
					sur la Plateforme. La date de dernière mise à jour est indiquée en haut de cette page.
				</p>

				<h2>14. Contact</h2>
				<p>
					Pour toute question relative à cette politique de confidentialité ou à vos données
					personnelles :
				</p>
				<ul>
					<li>
						E-mail : <a href="mailto:contact@patissio.com">contact@patissio.com</a>
					</li>
					<li>Plateforme : patissio.com</li>
				</ul>
			</div>
		</div>
	)
}
