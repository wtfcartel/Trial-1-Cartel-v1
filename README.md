# ShiftReady — ad hoc nursing shifts marketplace

A MachShip-style marketplace MVP, applied to ad hoc/relief nursing: facilities
post open shifts, nurses browse and claim the ones they're qualified and
available for, and facilities confirm one claim to fill the shift.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma + SQLite for local dev (swap the datasource for Postgres in production)
- Auth: custom email/password sessions — bcrypt password hashing + a signed
  JWT in an httpOnly cookie (`lib/session.ts`, `lib/password.ts`). No
  external auth provider required to run this locally.
- Tailwind CSS for styling
- All mutations (register, login, post a shift, claim a shift, confirm/decline
  a claim) are React Server Actions — see `lib/actions/`.

## Data model (`prisma/schema.prisma`)

- `Facility` — an organization that posts shifts
- `User` — either a `FACILITY_ADMIN` (belongs to a `Facility`) or a `NURSE`
  (has a `NurseProfile` with registration number + qualifications)
- `Shift` — an open shift posted by a facility (ward, time window, required
  qualification, hourly rate); status: `OPEN → FILLED → COMPLETED` (or `CANCELLED`)
- `ShiftClaim` — a nurse's claim on a shift; status:
  `REQUESTED → CONFIRMED/DECLINED`

## Getting started

```bash
npm install
cp .env.example .env   # generate a real SESSION_SECRET before deploying anywhere real
npm run db:push         # create the SQLite dev database from the schema
npm run db:seed         # optional: seed a demo facility, nurse, and shift
npm run dev
```

Then open http://localhost:3000.

Demo accounts (from `npm run db:seed`), password `password123` for both:

- `facility@demo.test` — Riverside Aged Care (facility admin)
- `nurse@demo.test` — Jordan Lee (nurse)

## The core flow

1. A facility account posts a shift at `/shifts/new` (ward, time window,
   required qualification, hourly rate).
2. Nurse accounts see it in their open-shifts feed on `/dashboard` and can
   claim it from the shift detail page.
3. The facility reviews claims on the shift detail page and confirms one —
   this fills the shift and auto-declines any other pending claims on it.
4. Both sides see the updated status on their dashboards.

## Other scripts

- `npm run db:studio` — Prisma Studio, a GUI for browsing/editing the dev database
- `npm run build` / `npm start` — production build and run
- `npm run lint` — ESLint

## Where this MVP stops (next steps)

This covers the manual-matching core loop (Phase 1–3 of the marketplace
pattern). Not yet built, roughly in priority order:

- **Credentialing**: verifying a nurse's registration number/right-to-work
  rather than trusting a free-text field at signup
- **Notifications**: email/SMS/push when a shift is claimed or confirmed,
  instead of requiring a dashboard refresh
- **Rate rules / auto-matching**: today every claim needs manual facility
  review; a pricing-rule engine could auto-confirm matches
- **Invoicing/payouts**: turning completed shifts into invoices and tracking
  nurse payouts
- **Postgres in production**: the SQLite datasource is for local dev only
