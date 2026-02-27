// ─── Plans ───────────────────────────────────────────────────────────────────

export const PLANS = {
  starter: {
    name: 'Starter',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      'Site vitrine',
      'Max 50 créations',
      'URL en chemin (patissio.com/votre-nom)',
    ],
  },
  pro: {
    name: 'Pro',
    priceMonthly: 30,
    priceYearly: 300,
    features: [
      'Site vitrine',
      'Créations illimitées',
      'Commandes en ligne',
      'Ateliers',
      'Sous-domaine personnalisé (votre-nom.patissio.com)',
    ],
  },
  premium: {
    name: 'Premium',
    priceMonthly: 50,
    priceYearly: 500,
    features: [
      'Site vitrine',
      'Créations illimitées',
      'Commandes en ligne',
      'Ateliers',
      'Domaine personnalisé (www.votre-site.com)',
      'Support prioritaire',
    ],
  },
} as const

// ─── Platform fee ────────────────────────────────────────────────────────────

export const PLATFORM_FEE_PERCENT = 5

// ─── Statuses ────────────────────────────────────────────────────────────────

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'ready',
  'delivered',
  'picked_up',
  'cancelled',
] as const

export const BOOKING_STATUSES = [
  'pending_payment',
  'confirmed',
  'cancelled',
  'completed',
] as const

export const WORKSHOP_STATUSES = [
  'draft',
  'published',
  'full',
  'cancelled',
  'completed',
] as const

export const WORKSHOP_LEVELS = [
  'debutant',
  'intermediaire',
  'avance',
  'tous_niveaux',
] as const

// ─── Allergens ───────────────────────────────────────────────────────────────

export const ALLERGENS = [
  'gluten',
  'oeufs',
  'lait',
  'fruits_a_coque',
  'arachides',
  'soja',
  'sesame',
  'celeri',
  'moutarde',
  'lupin',
  'mollusques',
  'crustaces',
  'poissons',
  'sulfites',
] as const

// ─── File limits ─────────────────────────────────────────────────────────────

export const FILE_LIMITS = {
  logo: {
    maxSizeMB: 2,
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  },
  image: {
    maxSizeMB: 5,
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
  gallery: {
    maxSizeMB: 5,
    maxFiles: 10,
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
  avatar: {
    maxSizeMB: 2,
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
} as const
