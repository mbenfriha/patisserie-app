# Patissio — Todolist déploiement

Stack cible : **Railway** (API) · **Vercel** (web + superadmin) · **Neon** (PostgreSQL) · **Cloudflare R2** (storage) · **Resend** (emails)

---

## 1. Nom de domaine (patissio.com)

- [ ] Configurer les DNS chez ton registrar :
  - `patissio.com` → Vercel (A records ou CNAME selon les instructions Vercel)
  - `*.patissio.com` → Vercel (wildcard pour les sous-domaines Pro)
  - `api.patissio.com` → Railway (CNAME fourni par Railway)
  - `admin.patissio.com` → Vercel (pour le superadmin)

## 2. Neon (PostgreSQL)

- [ ] Créer un projet sur [neon.tech](https://neon.tech)
- [ ] Copier la `DATABASE_URL` (format `postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require`)
- [ ] Activer le pooling (PgBouncer) si disponible — utiliser l'URL pooled pour l'API

## 3. Cloudflare R2 (Storage)

- [ ] Créer un compte Cloudflare (si pas déjà fait)
- [ ] Activer R2 dans le dashboard Cloudflare
- [ ] Créer 2 buckets :
  - `patissio-private` (logos, fichiers internes)
  - `patissio-public` (images de créations, avatars)
- [ ] Configurer l'accès public sur `patissio-public` :
  - Activer "Allow public access" sur le bucket
  - Ou connecter un custom domain : `cdn.patissio.com` (recommandé)
- [ ] Créer un token API R2 (Settings → R2 → Manage API Tokens) :
  - Permission : Object Read & Write
  - Scope : les 2 buckets
  - Noter : `Access Key ID` (`R2_KEY`) et `Secret Access Key` (`R2_SECRET`)
- [ ] Endpoint R2 : `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

## 4. Resend (Emails)

- [ ] Créer un compte sur [resend.com](https://resend.com)
- [ ] Ajouter et vérifier le domaine `patissio.com` (ajouter les DNS records SPF, DKIM, DMARC)
- [ ] Créer une API key
- [ ] L'API utilise déjà le driver Resend — il suffit de configurer les env vars

## 5. Railway (API)

- [ ] Créer un projet sur [railway.app](https://railway.app)
- [ ] Connecter le repo GitHub
- [ ] Configurer le service :
  - **Dockerfile Path** : `apps/api/Dockerfile`
  - **Watch paths** : `apps/api/**`
- [ ] Ajouter le custom domain : `api.patissio.com`
- [ ] Configurer les variables d'environnement :

```env
# Core
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
APP_KEY=<générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
APP_NAME=Patissio
API_PUBLIC_URL=https://api.patissio.com
TZ=Europe/Paris
LOG_LEVEL=info

# Database (Neon)
DATABASE_URL=<url Neon avec ?sslmode=require>

# Redis (Railway addon ou Upstash)
REDIS_HOST=<host>
REDIS_PORT=6379
REDIS_PASSWORD=<password>

# Session
SESSION_DRIVER=cookie

# Mail (Resend)
MAIL_MAILER=resend
RESEND_API_KEY=<ta clé Resend>
MAIL_FROM=noreply@patissio.com

# Storage (Cloudflare R2)
DRIVE_DISK=r2
R2_KEY=<access key>
R2_SECRET=<secret key>
R2_BUCKET=patissio-private
R2_PUBLIC_BUCKET=patissio-public
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_REGION=auto
R2_PUBLIC_URL=https://cdn.patissio.com

# Stripe
STRIPE_SECRET_KEY=<sk_live_...>
STRIPE_WEBHOOK_SECRET=<whsec_...>
STRIPE_PRICE_PRO_MONTHLY=<price_id>
STRIPE_PRICE_PRO_YEARLY=<price_id>
STRIPE_PRICE_PREMIUM_MONTHLY=<price_id>
STRIPE_PRICE_PREMIUM_YEARLY=<price_id>
STRIPE_PLATFORM_FEE_PERCENT=5

# Frontend URLs
FRONTEND_URL=https://patissio.com
SUPERADMIN_URL=https://admin.patissio.com

# Superadmin
SUPERADMIN_EMAIL=<ton email>
SUPERADMIN_PASSWORD=<un mdp solide>
```

- [ ] Après le premier déploiement, lancer les migrations :
  - Railway → service → terminal : `node ace migration:run`
  - Puis seed le superadmin : `node ace db:seed`

## 6. Redis

- [ ] Option A : Ajouter le plugin Redis dans Railway (le plus simple, ~$5/mo)
- [ ] Option B : Utiliser [Upstash](https://upstash.com) Redis (free tier : 10K commandes/jour)

## 7. Vercel (Web + Superadmin)

- [ ] Importer le repo sur [vercel.com](https://vercel.com)
- [ ] Créer 2 projets :

### Projet 1 : `patissio-web`
  - **Framework** : Next.js
  - **Root Directory** : `apps/web`
  - **Build Command** : `pnpm build` (Vercel le détecte)
  - **Domaines** : `patissio.com` + `*.patissio.com` (wildcard)
  - **Env vars** :
    ```
    NEXT_PUBLIC_APP_URL=https://patissio.com
    NEXT_PUBLIC_API_URL=https://api.patissio.com
    ```

### Projet 2 : `patissio-admin`
  - **Framework** : Next.js
  - **Root Directory** : `apps/superadmin`
  - **Domaine** : `admin.patissio.com`
  - **Env vars** :
    ```
    NEXT_PUBLIC_API_URL=https://api.patissio.com
    ```

## 8. Stripe (Production)

- [ ] Activer le mode live sur [dashboard.stripe.com](https://dashboard.stripe.com)
- [ ] Créer les produits/prix en mode live (Pro monthly/yearly, Premium monthly/yearly)
- [ ] Copier les `sk_live_`, `pk_live_` et price IDs
- [ ] Configurer le webhook en production :
  - URL : `https://api.patissio.com/webhooks/stripe`
  - Events : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `account.updated`

## 9. Vérifications post-déploiement

- [ ] `https://api.patissio.com` répond (health check)
- [ ] `https://patissio.com` affiche la landing page
- [ ] `https://admin.patissio.com` affiche le login superadmin
- [ ] Inscription → email de vérification reçu (Resend)
- [ ] Upload d'image → stocké sur R2, accessible via `cdn.patissio.com`
- [ ] Sous-domaine Pro fonctionne : `test.patissio.com`
- [ ] Paiement Stripe fonctionne en live
- [ ] Webhook Stripe reçu et traité

---

## Ordre recommandé

1. Neon (DB) → tu auras la DATABASE_URL
2. Cloudflare R2 (Storage) → tu auras les clés R2
3. Resend (Mail) → tu auras la RESEND_API_KEY
4. Redis (Railway ou Upstash) → tu auras le REDIS_HOST
5. Railway (API) → déploie avec toutes les env vars
6. Vercel (Web + Superadmin) → pointe vers api.patissio.com
7. DNS → configure les records pour tous les sous-domaines
8. Stripe → configure le webhook live
