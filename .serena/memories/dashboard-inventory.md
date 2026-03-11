# Backoffice Dashboard - Complete Inventory

## Navigation Structure (from layout.tsx)
Navigation Items with Plan Requirements:
- `/dashboard` - Dashboard (all plans)
- `/site` - Site Editor (all plans)
- `/creations` - Creations (all plans)
- `/products` - Products (Pro+)
- `/orders` - Orders (Pro+)
- `/workshops` - Workshops (Pro+)
- `/settings` - Settings (all plans)
- `/billing` - Billing (all plans)

Plan Levels: Starter (1), Pro (2), Premium (3)

## All Dashboard Pages and Features

### 1. Dashboard (/dashboard)
**Route**: `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx`
**Purpose**: Overview/Analytics page with key metrics
**Features**:
- Analytics Stats component (orders, revenue, workshops, bookings)
- Stats fetched from `/patissier/stats` API
- Shows:
  - Orders: total, pending, confirmed, in_progress count
  - Revenue: total amount
  - Workshops: total, published count
  - Bookings: total, confirmed count
- DashboardCalendar component for calendar view
- CalendarUpgradeBanner (plan upgrade messaging)
- User greeting with full name

### 2. Site Editor (/site)
**Route**: `apps/web/app/[locale]/(dashboard)/site/page.tsx`
**Purpose**: Customizable storefront editor with multiple sections
**Key Features**:
- **Logo & Images**: Upload/crop logo, hero image, story image, section hero images (creations, products, workshops, orders)
- **Business Info**: Name, phone, address (street, city, zip, country)
- **Social Links**: Instagram, Facebook, TikTok, Snapchat, LinkedIn, YouTube, Custom link
- **Colors**: Primary & Secondary color picker
- **Font Selection**: 4 presets (Classique, Moderne, Elegant, Fantaisie)
- **Hero Section**: Custom CTA label and href
- **Operating Hours**: Per-day hours (Mon-Sun) with open/close times, marked as closed option
- **Section Toggles**:
  - Show/Hide Story section
  - Show/Hide Marquee (text carousel)
  - Show/Hide Creations on homepage
  - Show/Hide Workshops CTA
  - Show/Hide Catalogue tab
  - Show/Hide Custom Order tab
  - Show/Hide Instagram section
- **Section Content** (with custom text & subtitles):
  - Story Title, Subtitle, Text, Image
  - Marquee Items (editable list)
  - Creations Title, Subtitle
  - Workshops CTA with Title, Subtitle, Description, Label
  - Instagram Section Title, Subtitle (with Connect/Disconnect Instagram integration)
- **Orders/Workshops Toggles**: Enable/disable orders and workshops on site
- **Preview**: Live preview key with refresh

### 3. Creations (/creations)
**Route**: `apps/web/app/[locale]/(dashboard)/creations/page.tsx`
**Purpose**: Showcase/Portfolio management
**Features**:
- Create/Edit creations with modal
- **Fields**:
  - Title, Description (rich text)
  - Category selection
  - Multiple images (with crop tool, cover image designation)
  - Tags (addable)
  - Price (optional)
  - Visibility toggle
  - Featured toggle (highlight on site)
- List view with creations
- Per-creation actions: Edit, Delete

### 4. Categories (/categories)
**Route**: `apps/web/app/[locale]/(dashboard)/categories/page.tsx`
**Purpose**: Organize products, creations, and workshops
**Features**:
- List of categories with:
  - Name
  - Description (if present)
  - Sort order
  - Visibility toggle
- Create category button
- Per-category actions: Edit, Delete

### 5. Products (/products)
**Route**: `apps/web/app/[locale]/(dashboard)/products/page.tsx`
**Purpose**: Manage catalog items available for order
**Features** (Pro+ only):
- Create/Edit products with modal
- **Fields**:
  - Name, Description
  - Category selection
  - Price, Unit (e.g., "per box")
  - Min/Max quantity constraints
  - Preparation days (lead time)
  - Multiple images (with crop tool)
  - Allergens (addable list)
  - Tags (addable)
  - Availability toggle
  - Visibility toggle
- List view
- Per-product actions: Edit, Delete, Visibility control
- Category inline creation

### 6. Orders (/orders)
**Route**: `apps/web/app/[locale]/(dashboard)/orders/page.tsx`
**Purpose**: Manage customer orders (both catalogue and custom)
**Features** (Pro+ only):
- List of orders with columns:
  - Order Number
  - Client Name
  - Type (Catalogue/Custom)
  - Status (Pending, Confirmed, In Progress, Ready, Delivered, Picked Up, Cancelled)
  - Total, Requested Date
  - Payment Status (Pending, Paid, Refunded)
- Create new order modal with:
  - **Order Type Select**: Custom or Catalogue
  - **For Catalogue Orders**:
    - Add products from catalog
    - Quantity selection
    - Cart view
    - Special instructions per item
  - **For Custom Orders** (Devis):
    - Type, Number of people, Date souhaitée, Theme, Allergies, Message
  - **Common Fields**:
    - Client name, email, phone
    - Requested date
    - Delivery method (Pickup/Delivery)
    - Delivery address & notes
    - Patissier notes
    - Total price
    - Deposit % and paid status
  - Photo upload (for custom orders)
- Per-order actions: View details, Edit, Delete with confirmation

### 7. Order Detail (/orders/[id])
**Route**: `apps/web/app/[locale]/(dashboard)/orders/[id]/page.tsx`
**Purpose**: Detailed order management and communication
**Features**:
- **Order Info**:
  - Order number, status, payment status
  - Client details (name, email, phone)
  - Dates (created, confirmed, delivery requested)
  - Delivery method & address
  - Custom order details (type, theme, allergies, etc.)
- **Status Management**:
  - Update status dropdown (Pending → Confirmed → In Progress → Ready → Delivered/Picked Up)
  - Cancel order with reason
  - Mark as paid button
- **Items List**:
  - Product name, quantity, unit price, total
  - Special instructions per item
  - Can add items inline
- **Notes**:
  - Patissier notes (editable)
  - Delivery notes (editable)
- **Financial Breakdown**:
  - Subtotal, Platform fee (5%), Stripe fee calculation, Total
  - Deposit percent & amount
  - Remaining amount
- **Message Thread**:
  - Customer-patissier communication
  - Send message with optional attachments
  - Quote submission (with quoted price & message)
- **Photo Management**:
  - Custom order photos (upload, delete)
  - Lightbox view
- **Actions**: Save edits, Submit quote, Mark paid, Update status, Cancel, Delete with confirmation

### 8. Workshops (/workshops)
**Route**: `apps/web/app/[locale]/(dashboard)/workshops/page.tsx`
**Purpose**: Manage workshop offerings
**Features** (Pro+ only):
- List of workshops with:
  - Title, Date, Status (Draft, Published, Full, Completed, Cancelled)
  - Price, Capacity
  - Start time, Duration
  - Level (Tous niveaux, Débutant, Intermédiaire, Avancé)
  - Visibility
- Create new workshop modal with:
  - Title, Description (rich text)
  - Category selection
  - Images (with crop tool)
  - Price, Payment mode (Full payment / Deposit)
  - Deposit % (if deposit mode)
  - Capacity
  - Duration (hours + minutes with end time display)
  - Level selection
  - Location
  - What's included (rich text)
  - Date, Start time (hour + minute)
  - Visibility toggle
- Per-workshop actions: Edit, View bookings (detail page), Delete, Publish/Draft

### 9. Workshop Detail (/workshops/[id])
**Route**: `apps/web/app/[locale]/(dashboard)/workshops/[id]/page.tsx`
**Purpose**: Detailed workshop management and booking handling
**Features**:
- **Workshop Info**:
  - Title, description, images, price, capacity
  - Level, duration, location, what's included
  - Status (Draft, Published, Full, Completed, Cancelled)
  - Bookings count, remaining capacity
- **Status Management**:
  - Update workshop status dropdown
  - Publish/Draft toggle
- **Bookings List**:
  - Client name, email, phone
  - Number of participants
  - Booking status (Pending Payment, Confirmed, Completed, Cancelled)
  - Deposit & remaining payment status (Pending, Paid, Refunded)
  - Total price
  - Message from client
- **Per-Booking Actions**:
  - View details
  - Update booking status
  - Mark deposit/remaining as paid
  - Cancel booking with reason and refund type
- **Booking Creation Modal**:
  - Add new manual booking
  - Client info (name, email, phone)
  - Number of participants
  - Client message
- **Financial**:
  - Deposit calculation
  - Remaining amount
  - Fee calculations (platform 5% + Stripe fees)

### 10. Settings (/settings)
**Route**: `apps/web/app/[locale]/(dashboard)/settings/page.tsx`
**Purpose**: Account and business configuration
**Features**:
- **Business Profile**:
  - Business name (edit inline with save/cancel)
  - Slug (path URL base)
  - Phone
  - Address fields (street, city, zip, country)
- **Branding**:
  - Primary & Secondary colors (color pickers)
  - Font selection
  - Logo upload/crop/delete
  - Favicon upload/delete
- **Custom Domain** (Premium):
  - Domain input with validation
  - Verify button
  - Remove button
  - Status indicator
- **Password Change**:
  - Current password
  - New password with strength rules:
    - Minimum 8 characters
    - At least 1 uppercase
    - At least 1 lowercase
    - At least 1 number
    - At least 1 special character
    - Passwords match
  - Show/hide password toggle
- **Stripe Connect**:
  - Connection status
  - Connect button (redirects to onboarding)
  - Status message when connected
  - Support access toggle (allow Patissio support to access account)
- **Support Access** toggle

### 11. Billing (/billing)
**Route**: `apps/web/app/[locale]/(dashboard)/billing/page.tsx`
**Purpose**: Subscription and plan management
**Features**:
- **Current Plan Display**:
  - Active plan badge (Starter, Pro, Premium)
  - Monthly/yearly toggle
  - Current plan highlight
- **Plan Cards** (for Starter, Pro, Premium):
  - Price (with fee percent shown)
  - Features list
  - Subscribe button (disabled if already active)
  - Current plan indicator
  - Upgrade/downgrade action
- **Plan Details**:
  - Features per plan
  - Platform fee % (shown in pricing)
- **Billing Portal**:
  - Manage billing button (for non-Starter)
  - Links to Stripe customer portal

## Additional Components Used
- `StripeConnectBanner` (in main layout, alerts if not connected)
- `RoleGuard` (limits access to ['patissier', 'superadmin'] roles)
- `PlanGate` (blocks Pro+ features for Starter users)
- `DashboardPrefix` hook (handles custom domain routing)
- `useAuth` hook (provides user profile, plan, logout)
- `CategoryCombobox` (reusable category selector)
- `ImageCropper` (image upload/crop modal)
- `RichTextEditor/RichEditor` (WYSIWYG text editing)

## Mobile Responsiveness
- Desktop: Fixed sidebar navigation (left)
- Mobile: Collapsible drawer menu with hamburger toggle
- All pages adapt layout for small screens
