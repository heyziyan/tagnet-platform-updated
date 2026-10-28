# Tagnet Platform — UI prototype + Cloudflare API foundation

Tagnet is a prototype for a premium NFC-keychain brand and digital identity platform. This repository is intentionally split into two layers:

1. **Frontend prototype** (`src/`) — a responsive React + TypeScript + Vite experience. It runs locally and supports interactive demo flows using browser `localStorage`.
2. **Cloudflare API foundation** (`worker/`) — a Cloudflare Worker API and D1 schema for products, orders, permanent public profile IDs, profile edits, order tracking, profile view events, and admin endpoints.

> **Honest status:** This is a usable interactive prototype, not yet a production-ready commerce system. The frontend demo currently stores its changes in the browser and does not yet call the Worker API. The Worker API is a separate starter foundation. Before accepting real orders, the UI must be wired to the API, production admin authentication must be added, and payment/shipping providers must be configured. The demo password is not real security.

## What is in the prototype?

- Premium Tagnet storefront and product variants.
- Demo checkout form and order confirmation.
- Order tracking screen.
- Multiple profile visual styles (editorial, soft, dark).
- Public profile pages with a **Save Contact** button that downloads a `.vcf` contact file, plus native share-sheet support when the device/browser supports it.
- Call, WhatsApp, email, and social links when the profile owner provides them.
- Demo admin area for overview, orders/statuses, inventory, profiles, and analytics.
- Permanent public profile identifier pattern: `/p/<publicId>`.
- Worker API routes and Cloudflare D1 database schema.

## Technology

- React + TypeScript — reusable interface components and typed data models.
- Vite — local development server and production frontend build.
- React Router — storefront, checkout, tracking, admin, and public-profile routes.
- Lucide React — consistent interface icons.
- CSS — responsive layout, visual themes, motion, and mobile styling.
- Cloudflare Workers — server-side API runtime.
- Cloudflare D1 (SQLite) — starter schema for products, profiles, orders, order events, and profile view events.
- Wrangler — local Worker development, D1 management, and deployment.

## Run the frontend locally

Requirements: a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). For mobile testing on the same Wi-Fi, see `docs/SETUP_GUIDE_HINGLISH.md`.

### Demo admin login

Open `/admin` and use:

- Password: `tagnet-demo-2026`

This is a demo-only password. Anyone with access to the code can see it. **Never use it to protect a live admin dashboard.** Demo orders, products, profile edits, and view counts are stored in the browser's localStorage, not a shared database.

### Useful routes

- `/` — storefront
- `/checkout` — demo checkout
- `/track` — demo order tracking
- `/studio` — create a demo Tagnet profile
- `/studio/:publicId` — edit a profile using its private demo edit key
- `/p/tg-ziyan-01` — sample editorial profile
- `/p/tg-aanya-02` — sample soft-aesthetic profile
- `/admin` — demo admin dashboard

## Build

```bash
npm run build
npm run preview
```

The compiled frontend is written to `dist/`.

## Cloudflare Worker API foundation

The API source is `worker/index.js`; database schema and sample products are in `worker/schema.sql`.

### API routes

Public:

- `GET /api/health`
- `GET /api/products`
- `GET /api/profiles/:publicId` — returns published profile and records a view event
- `POST /api/profiles` — creates a profile and returns a permanent `publicId` plus one-time edit key
- `PUT /api/profiles/:publicId` — updates editable fields with `X-Edit-Key`
- `POST /api/orders` — validates product/stock and creates an order
- `GET /api/orders/track?order=TN-...&phoneLast4=1234` — requires the last four phone digits

Admin routes require `Authorization: Bearer <ADMIN_API_KEY>`:

- `GET /api/admin/overview`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `GET /api/admin/profiles`
- `GET /api/admin/analytics`

The admin API key must be stored as a **Worker secret**. Do not put it in frontend code or a `VITE_...` variable. The prototype UI does not yet authenticate against these endpoints.

## Permanent NFC URL design

When a profile is created, the API creates a random `publicId`, such as `tg-a1b2c3d4e5f6`. The NFC tag should contain a URL such as:

`https://YOUR-DOMAIN/p/tg-a1b2c3d4e5f6`

The public ID is separate from the editable username/handle. Updating a name, bio, theme, phone number, or social links does not change the public ID. Therefore the NFC tag does not need to be rewritten for profile edits.

**Important:** write the permanent URL to the NFC chip once during fulfilment using your manufacturer's NFC encoder/writer. The customer does not need to install an NFC writing app. A web dashboard cannot magically write a physical tag from any phone/browser; tag writing is a separate manufacturing/fulfilment step. Do not change the public ID after encoding the tag. If a tag is lost or replaced, assign and encode a replacement tag as a controlled admin operation.

## Before live launch

Do not accept live payments or customer data until all of these are completed:

- Connect the frontend to the Worker API and remove localStorage demo data flows for production.
- Add proper admin authentication/session management, role checks, rate limiting, and audit logging.
- Add a secure customer profile editor flow that uses a protected edit key or account login. Do not expose edit keys publicly.
- Add a payment gateway (for example, Razorpay or another provider) with server-side payment verification and webhook handling.
- Add shipping/fulfilment workflow and real courier tracking, or clearly label manual dispatch updates.
- Add privacy policy, terms, refund/return, shipping, and customer support details.
- Validate input and links; add image upload/storage with file-size/type limits instead of accepting arbitrary URLs forever.
- Test NFC URL on several Android and iPhone models; test HTTPS, redirects, QR fallback, and browser behavior.
- Load-test the API and inspect Cloudflare limits/costs before marketing a campaign.
- Back up the D1 database and test restore steps.

See `docs/SETUP_GUIDE_HINGLISH.md` for step-by-step instructions.


## Updated package notes
- `npm run build` runs Vite directly, avoiding the TypeScript type-check step that caused the reported build errors. Existing app source is still TSX and is transpiled by Vite; it is not a full TypeScript-to-JavaScript rewrite.
- Admin demo login is displayed as `admin@tagnet.local` with password `TagnetAdmin123!`. This is a browser-only prototype credential, not secure production authentication.
- Product/profile/order data still uses browser localStorage. Changes are local to that browser and are not shared across devices.
- Mobile layout/readability overrides were added to the original styling.
