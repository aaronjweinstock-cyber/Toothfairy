# Toothfairy

Crowdsource the tooth fairy: when a kid loses a tooth, a parent posts it, and
the specific people that parent has invited (family, friends) can send the
kid real money. A closed circle, not a public feed — see [Product
decisions](#product-decisions) below.

## Stack

- **Next.js 16** (App Router) — note this version renamed `middleware.ts` to
  `proxy.ts` ("Proxy"); see `src/proxy.ts`.
- **Postgres** via **Prisma 7** (`prisma/schema.prisma`) — designed against
  Supabase, but any Postgres connection string works.
- **Auth.js v5** (`next-auth@beta` + `@auth/prisma-adapter`) — Credentials
  (email/password) provider today; the Prisma adapter is wired up so OAuth
  providers and email verification can be added later without a schema
  migration. Still beta-tagged upstream as of this writing.
- **Stripe Connect** (Express accounts, destination charges via Checkout) for
  custodial payments in and payouts out.
- **Vercel Blob** for tooth photo uploads (`src/lib/photo-upload.ts`), with
  **sharp** for resizing + stripping EXIF/GPS metadata server-side.
- **Resend** for invite emails (`src/lib/email.ts`), gated off by default —
  see "How it works" below.
- Deploy target: Vercel.

## Getting started

1. Copy `.env.example` to `.env` and fill in the values:
   - `DATABASE_URL` — a Postgres connection string (e.g. from a Supabase
     project's Database settings).
   - `AUTH_SECRET` — random string, e.g. `openssl rand -base64 32`.
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — from the Stripe
     dashboard (use test-mode keys locally).
   - `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally.
   - `BLOB_READ_WRITE_TOKEN` — optional locally; only needed to actually
     store tooth photos.
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `EMAIL_SENDING_ENABLED` —
     leave `EMAIL_SENDING_ENABLED=false` until a sending domain is verified
     in Resend (see "How it works").
2. Install dependencies and apply the schema:
   ```bash
   npm install
   npm run db:migrate
   ```
3. Run the app:
   ```bash
   npm run dev
   ```
4. For Stripe webhooks locally, use the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## How it works

- A parent signs up (email + password) via `src/app/api/auth/signup/route.ts`,
  which creates a **Family** (their closed circle) in the same step, then
  signs them in through Auth.js's Credentials provider (`src/auth.ts`).
  Login/logout and route protection (`src/proxy.ts`) go through Auth.js.
- The parent adds a **Child**, then posts a **ToothPost** when a tooth is
  lost (optionally attaching a photo of the tooth — not the child, there's a
  warning in the UI about that), and can **Invite** specific people by
  email — `src/app/dashboard/`. Photos are resized, stripped of EXIF/GPS
  metadata, and uploaded to Vercel Blob; if `BLOB_READ_WRITE_TOKEN` isn't
  configured (e.g. running locally without a linked Vercel project), the
  post still saves, just without a photo — see `src/lib/photo-upload.ts`.
- Each invite has a **Send invite** button (`src/lib/email.ts`,
  `src/app/dashboard/send-invite-button.tsx`). It's a no-op showing "Email
  sending isn't set up yet" until `EMAIL_SENDING_ENABLED=true` — Resend (like
  any transactional email provider) requires a verified sending domain to
  deliver to real recipients, and no domain is owned yet. Until then the
  invite link shown/copyable in the dashboard is the only delivery method.
  Flipping the flag on later is a config change, not a rebuild.
- An invited person opens their unique `/invite/[token]` link (no account
  needed) and can send a **Gift** against a tooth post via Stripe Checkout —
  `src/app/invite/[token]/`, `src/app/api/gifts/route.ts`.
- The parent connects a Stripe **Express** account
  (`src/app/api/stripe/connect/route.ts`) so gifts can be paid out to them;
  Checkout uses a destination charge (`payment_intent_data.transfer_data`)
  so money lands directly in the parent's Stripe balance.
- `src/app/api/stripe/webhook/route.ts` marks gifts as succeeded/failed and
  tracks onboarding completion.

## Data model

See `prisma/schema.prisma`. Short version: `User` (parent) owns one or more
`Family` circles, each with `Child`ren, `Invite`s (email + token, no public
link), and `ToothPost`s that accumulate `Gift`s. This is a first draft, not
a final design — see open questions below.

## Product decisions (already made — see project handoff)

- Closed circle, not a public/open social network — the parent invites
  specific people by link/code, no discovery feed.
- Parent-only account — the kid has no login and no personal data is
  collected directly from them (keeps the COPPA story simple).
- Real money via Stripe Connect, held in the parent's custodial Stripe
  balance until withdrawn — not points or fake currency.

## Compliance / risk notes

- **COPPA**: don't collect personal data directly from children; everything
  stays parent-managed and parent-consented.
- **Money transmission / KYC**: Stripe Connect carries most of the
  licensing/KYC burden, but the custodial-balance design (who legally holds
  funds pre-withdrawal, refunds, disputes) still deserves real legal review
  before real users/money.
- **Child safety**: the closed-circle invite model is the main mitigation
  against stranger contact. Don't loosen it to a public/open model without
  discussing the tradeoff again.
- Repo is **public**: never commit Stripe keys, DB credentials, or any real
  family/child data. `.env*` is gitignored (see `.env.example` for the
  shape); use real secrets only via environment variables in your
  deploy/hosting provider.

## Decisions made since the initial scaffold

- **Circle shape**: staying one `Family` per parent account, multiple
  `Child`ren inside it — not changing.
- **Invited-member accounts**: invitees stay account-less (name/email typed
  at gift time) — not changing.
- **Auth**: migrated from hand-rolled bcrypt+JWT to Auth.js v5 (see Stack
  above).
- **Fees**: will eventually take a percentage per gift via Stripe's
  `application_fee_amount`, not a subscription — deferred until the core
  product is solid. Not implemented yet; nothing in the Checkout code
  hardcodes a 100%-to-parent assumption that would be awkward to unwind.
- **Hosting**: Vercel on the default `*.vercel.app` subdomain — no custom
  domain yet (one will be added later solely for outbound email sending).

## Status

All three v3-handoff work items are done and locally verified: Auth.js
migration, tooth photo upload, and invite email (gated). Not yet deployed —
see below for what deployment needs.

## What deployment will need

- A production `DATABASE_URL` (Supabase project is provisioned; connection
  string still needs to be plugged in).
- Stripe keys — test-mode only for now; no real legal/compliance review has
  happened yet (see Compliance notes above), so live keys are a deliberate
  later step, not part of this pass.
- `BLOB_READ_WRITE_TOKEN`, generated automatically once a Blob store is
  added to the Vercel project.
- Resend stays off (`EMAIL_SENDING_ENABLED=false`) until a domain is bought
  and verified — not a blocker for deploying, just for that one feature.

## Open questions still outstanding

- **Data model**: still just the first draft in `prisma/schema.prisma`
  beyond the Auth.js tables — revisit as the product grows.
