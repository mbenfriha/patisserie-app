// ─── Enums as union types ────────────────────────────────────────────────────

export type UserRole = 'patissier' | 'client' | 'superadmin'

export type Plan = 'starter' | 'pro' | 'premium'

export type BillingInterval = 'monthly' | 'yearly'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'picked_up'
  | 'cancelled'

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'completed'

export type WorkshopStatus =
  | 'draft'
  | 'published'
  | 'full'
  | 'cancelled'
  | 'completed'

export type WorkshopLevel =
  | 'debutant'
  | 'intermediaire'
  | 'avance'
  | 'tous_niveaux'

export type DeliveryMethod = 'pickup' | 'delivery'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export type OrderType = 'standard' | 'custom'

export type SenderType = 'patissier' | 'client'

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl: string | null
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PatissierProfile {
  id: string
  userId: string
  shopName: string
  slug: string
  plan: Plan
  billingInterval: BillingInterval
  description: string | null
  logoUrl: string | null
  bannerUrl: string | null
  phone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  siret: string | null
  customDomain: string | null
  stripeAccountId: string | null
  stripeCustomerId: string | null
  onboardingCompletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  patissierProfileId: string
  name: string
  slug: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreationImage {
  id: string
  creationId: string
  imageUrl: string
  sortOrder: number
  createdAt: string
}

export interface Creation {
  id: string
  patissierProfileId: string
  categoryId: string | null
  title: string
  slug: string
  description: string | null
  allergens: string[]
  isAvailableForOrder: boolean
  basePrice: number | null
  images: CreationImage[]
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  creationId: string
  name: string
  description: string | null
  priceInCents: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Workshop {
  id: string
  patissierProfileId: string
  title: string
  slug: string
  description: string | null
  level: WorkshopLevel
  durationMinutes: number
  priceInCents: number
  maxParticipants: number
  currentParticipants: number
  date: string
  startTime: string
  endTime: string
  address: string | null
  imageUrl: string | null
  status: WorkshopStatus
  createdAt: string
  updatedAt: string
}

export interface WorkshopBooking {
  id: string
  workshopId: string
  userId: string
  numberOfSeats: number
  totalPriceInCents: number
  status: BookingStatus
  paymentIntentId: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string | null
  creationId: string | null
  label: string
  quantity: number
  unitPriceInCents: number
  totalPriceInCents: number
  notes: string | null
}

export interface OrderMessage {
  id: string
  orderId: string
  senderType: SenderType
  senderId: string
  content: string
  createdAt: string
}

export interface Order {
  id: string
  patissierProfileId: string
  userId: string
  orderNumber: string
  type: OrderType
  status: OrderStatus
  deliveryMethod: DeliveryMethod
  deliveryAddress: string | null
  deliveryDate: string | null
  subtotalInCents: number
  platformFeeInCents: number
  totalInCents: number
  paymentStatus: PaymentStatus
  paymentIntentId: string | null
  notes: string | null
  items: OrderItem[]
  messages: OrderMessage[]
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  patissierProfileId: string
  stripeSubscriptionId: string
  plan: Plan
  billingInterval: BillingInterval
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  type: string
  readAt: string | null
  data: Record<string, unknown> | null
  createdAt: string
}

// ─── API Response types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    perPage: number
    lastPage: number
  }
}
