# VOLANT Store — Codex

Full-stack e-commerce application for a drone and 3D printing store. Supports mixed digital/physical fulfillment, Paystack payments, and Supabase backend.

---

## Folder Structure

```
/
├── src/
│   ├── components/
│   │   ├── admin/          # AdminLayout
│   │   ├── auth/           # RequireAuth, RequireAdmin guards
│   │   ├── layout/         # Navbar, Footer, Layout
│   │   ├── products/       # ProductCard
│   │   └── ui/             # Button, Input, LoadingSpinner
│   ├── contexts/
│   │   ├── AuthContext.tsx  # Supabase auth state, profile, isAdmin
│   │   └── CartContext.tsx  # Global cart with localStorage persistence
│   ├── hooks/
│   │   ├── useProducts.ts   # Products, categories, bundle items
│   │   └── useOrders.ts     # Orders (customer + admin), shipping update
│   ├── lib/
│   │   ├── supabase.ts      # Singleton Supabase client
│   │   ├── database.types.ts # TypeScript types for all DB tables
│   │   └── utils.ts         # formatCurrency, slugify, fulfillment helpers
│   ├── pages/
│   │   ├── admin/           # AdminDashboard, AdminProducts, AdminProductForm,
│   │   │                    # AdminOrders, AdminCategories
│   │   ├── HomePage.tsx
│   │   ├── ShopPage.tsx
│   │   ├── ProductPage.tsx  # With Craycle-style electronics bundling
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx # Paystack inline payment
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ProfilePage.tsx  # Shipping address management
│   │   ├── OrdersPage.tsx
│   │   └── OrderDetailPage.tsx # Download links for FDM items
│   ├── App.tsx              # Route definitions
│   ├── main.tsx             # Entry point
│   └── index.css            # CSS variables, global styles
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── paystack-webhook/   # Verifies signature, marks orders paid, issues signed URLs
│       ├── generate-download/  # On-demand 15-min signed URL generation
│       └── send-email/         # Brevo SMTP wrapper
├── Dockerfile               # Multi-stage: Node build → Nginx serve
├── nginx.conf               # SPA fallback, gzip, long-lived asset cache
├── .dockerignore
└── CODEX.md
```

---

## Database Schema

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | References `auth.users(id)` |
| full_name | text | |
| role | text | `'customer'` or `'admin'` |
| avatar_url | text | |
| shipping_addresses | jsonb | Array of `ShippingAddress` objects |
| created_at / updated_at | timestamptz | Auto-managed by trigger |

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text UNIQUE | |
| slug | text UNIQUE | URL-friendly |
| description | text | |

### `products`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name / slug | text | slug is UNIQUE |
| description | text | |
| price | numeric(10,2) | NGN |
| fulfillment_type | text | `'fdm'` / `'mjf'` / `'composite'` |
| category_id | uuid FK | → categories |
| image_url | text | Public Supabase Storage URL |
| stl_file_path | text | Path inside `stl-files` private bucket |
| stock_count | integer | Ignored for FDM (digital, unlimited) |
| is_active | boolean | Controls storefront visibility |
| is_drone_product | boolean | Enables bundle section on product page |
| is_recommended_electronic | boolean | Can be bundled onto drone product pages |
| tags | text[] | |
| specs | jsonb | Key-value specification map |

### `product_bundle_items`
| Column | Type | Notes |
|---|---|---|
| drone_product_id | uuid FK | → products |
| electronic_product_id | uuid FK | → products |
| sort_order | integer | Display order |

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | Also used as Paystack `ref` |
| user_id | uuid FK | → auth.users |
| status | text | `pending` → `paid` → `processing` → `shipped` → `delivered` |
| payment_reference | text | Paystack transaction reference |
| total_amount | numeric(10,2) | |
| currency | text | Default `'NGN'` |
| has_digital / has_physical | boolean | Mixed cart flags |
| shipping_address | jsonb | Snapshot of address at time of order |
| shipping_status | text | `not_required` / `pending` / `processing` / `shipped` / `delivered` |
| tracking_number | text | Set by admin |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| order_id | uuid FK | → orders |
| product_id | uuid FK | → products |
| quantity | integer | |
| unit_price | numeric(10,2) | Snapshot at time of purchase |
| fulfillment_type | text | Snapshot |
| download_url | text | Signed URL (15-min expiry) |
| download_expires_at | timestamptz | |
| download_count | integer | Incremented on each link generation |

---

## Paystack → Supabase Webhook Flow

```
Customer clicks "Pay with Paystack"
  → Frontend creates order (status: 'pending') in Supabase
  → Inserts order_items
  → Opens Paystack inline popup

Paystack processes payment
  → On success: Paystack sends POST to /functions/v1/paystack-webhook
  → Function verifies HMAC-SHA512 signature (x-paystack-signature header)
  → Parses event.event === 'charge.success'
  → Extracts order_id from metadata.order_id || reference
  → Updates order status → 'paid'
  → For each FDM order_item with stl_file_path:
      Calls supabase.storage.createSignedUrl(path, 900) [15 min]
      Saves signedUrl + expires_at to order_items row
  → Sends order confirmation email via Brevo API

Frontend inline callback (backup)
  → Updates order payment_reference + status = 'paid'
  → Clears cart, navigates to /orders/:id
```

On-demand download regeneration (links expire after 15 min):
```
Customer visits /orders/:id → clicks "Get Link"
  → Calls /functions/v1/generate-download { order_item_id }
  → Function validates JWT + ownership + order paid status
  → Generates new 15-min signed URL from stl-files bucket
  → Saves to order_items.download_url + download_expires_at
  → Returns URL to frontend → opens in new tab
```

---

## Brevo (Sendinblue) SMTP Config

Emails are sent via the Brevo REST API (`https://api.brevo.com/v3/smtp/email`).

Triggered in:
- `paystack-webhook` — order confirmation after payment
- `send-email` edge function — general-purpose transactional email

Sender identity: `noreply@volant.store` (configure in Brevo dashboard as verified sender).

---

## Environment Variables

### Frontend (`.env`)
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key (starts with `pk_live_` or `pk_test_`) |

### Edge Functions (Supabase secrets)
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Auto-populated by Supabase runtime |
| `SUPABASE_ANON_KEY` | Auto-populated |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-populated (used for admin operations) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key for webhook HMAC verification |
| `BREVO_API_KEY` | Brevo API key for transactional email |

### Oracle Cloud Deployment
```bash
# Build image
docker build -t volant-store:latest .

# Run container
docker run -d \
  --name volant-store \
  -p 80:80 \
  --restart unless-stopped \
  volant-store:latest
```

For HTTPS on Oracle Cloud:
- Use OCI Load Balancer with SSL termination, OR
- Add Certbot/Let's Encrypt with nginx inside the container

---

## Admin Access

To grant admin access to a user, update their profile role in Supabase:

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

The `RequireAdmin` route guard checks `profile.role === 'admin'` on the frontend.
The database RLS policies enforce admin checks server-side via:
```sql
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
```

---

## Product Fulfillment Types

| Type | Description | Delivery |
|---|---|---|
| `fdm` | FDM 3D print STL file (digital) | Instant signed URL, 15-min expiry |
| `mjf` | Multi Jet Fusion 3D printed part | Physical shipping required |
| `composite` | Carbon fiber composite part | Physical shipping required |

Mixed carts (FDM + physical) are supported. Checkout requires a shipping address only when `has_physical = true`.

---

## Craycle-Style Electronics Bundling

On drone product pages (`is_drone_product = true`), the `product_bundle_items` table links the drone to recommended electronics (`is_recommended_electronic = true`). The product page renders a "Recommended Electronics" section with checkboxes. Selected items are added to the cart alongside the main product when "Add to Cart" is clicked.

To configure bundles, insert rows into `product_bundle_items`:
```sql
INSERT INTO product_bundle_items (drone_product_id, electronic_product_id, sort_order)
VALUES ('<drone-id>', '<motor-id>', 1),
       ('<drone-id>', '<esc-id>', 2),
       ('<drone-id>', '<servo-id>', 3);
```
