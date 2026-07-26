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
- **Stripe Connect** (Express accounts, destination charges via Checkout) for
  custodial payments in and payouts out.
- Deploy target: Vercel.

## Getting started

1. Copy `.env.example` to `.env` and fill in the values:
   - `DATABASE_URL` — a Postgres connection string (e.g. from a Supabase
     project's Database settings).
   - `SESSION_SECRET` — random string, e.g. `openssl rand -base64 32`.
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — from the Stripe
     dashboard (use test-mode keys locally).
   - `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally.
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

- A parent signs up (email + password) and, in the same step, creates a
  **Family** (their closed circle) — see `src/app/api/auth/signup/route.ts`.
- The parent adds a **Child**, then posts a **ToothPost** when a tooth is
  lost, and can **Invite** specific people by email — `src/app/dashboard/`.
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

## Open questions (not yet decided — see handoff doc)

The scaffold makes a first pass at each of these; revisit before shipping:

- **Data model specifics** — is a "circle" per-child or per-family (this
  scaffold does per-family, multiple kids per circle)? Should invited
  members get accounts, or stay account-less as they are now?
- **Auth approach** — this scaffold uses email + password (bcrypt hashing,
  signed JWT session cookie). Consider a real auth library
  (e.g. Auth.js) before adding OAuth/magic links/MFA.
- **Tooth-post trigger** — currently just a free-text note; photo upload
  isn't wired up yet (`ToothPost.photoUrl` exists in the schema but nothing
  populates it).
- **Invitee notifications** — invites currently only generate a link shown
  in the parent's dashboard; no email/SMS is sent yet.
- **Fee handling** — Checkout currently passes 100% of the gift to the
  parent's Stripe balance (no `application_fee_amount`). Decide whether the
  app takes a cut or passes Stripe's processing fees to the sender/parent.
