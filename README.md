# ShiftReady — ad hoc nursing shifts marketplace

A MachShip-style marketplace MVP, applied to ad hoc/relief nursing: facilities
post open shifts, nurses browse and claim the ones they're qualified and
available for, and facilities confirm one claim to fill the shift. Nurses
can only claim shifts once an admin has verified their uploaded credentials
and they've completed induction training.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma + SQLite for local dev (swap the datasource for Postgres in production)
- Auth: custom email/password sessions — bcrypt password hashing + a signed
  JWT in an httpOnly cookie (`lib/session.ts`, `lib/password.ts`). No
  external auth provider required to run this locally.
- Tailwind CSS for styling
- All mutations (register, login, post/claim/confirm a shift, upload a
  certificate, complete an induction module, review a nurse, manage
  availability) are React Server Actions — see `lib/actions/`.
- Certificate files are saved to local disk under `/uploads` (gitignored,
  outside `/public`) and streamed back through an auth-gated route handler —
  see "Where this MVP stops" for why that's dev-only.

## Data model (`prisma/schema.prisma`)

- `Facility` — an organization that posts shifts
- `User` — `FACILITY_ADMIN` (belongs to a `Facility`), `NURSE` (has a
  `NurseProfile`), or `ADMIN` (reviews nurse credentials)
- `NurseProfile` — registration number, qualifications, and
  `verificationStatus` (`PENDING → VERIFIED/REJECTED`, set by an admin)
- `Certificate` — a file a nurse uploaded for review (label, stored path, MIME type)
- `InductionModule` / `InductionProgress` — a fixed list of training modules
  (seeded) and which ones a nurse has self-attested completing
- `AvailabilityBlock` — a time range a nurse has marked themselves available
- `Shift` — an open shift posted by a facility (ward, time window, required
  qualification, hourly rate, optional `careNotes`); status:
  `OPEN → FILLED → COMPLETED` (or `CANCELLED`)
- `ShiftClaim` — a nurse's claim on a shift; status:
  `REQUESTED → CONFIRMED/DECLINED`

A nurse is **available to claim shifts** once `verificationStatus === VERIFIED`
*and* they've completed every `InductionModule` (`lib/nurse-status.ts`). This
is enforced server-side in `claimShiftAction`, not just hidden in the UI.

## Getting started

```bash
npm install
cp .env.example .env   # generate a real SESSION_SECRET before deploying anywhere real
npm run db:push         # create the SQLite dev database from the schema
npm run db:seed         # optional: seed demo accounts, induction modules, and a shift
npm run dev
```

Then open http://localhost:3000.

Demo accounts (from `npm run db:seed`), password `password123` for all:

- `facility@demo.test` — Riverside Aged Care (facility admin)
- `nurse@demo.test` — Jordan Lee (nurse, already verified + inducted, ready to claim shifts)
- `newnurse@demo.test` — Alex Chen (nurse, freshly signed up — use this account to walk
  through credential upload → induction → admin review)
- `admin@demo.test` — Priya (compliance admin, reviews credentials at `/admin`)

## The core flow

1. A facility account posts a shift at `/shifts/new` (ward, time window,
   required qualification, hourly rate, optional care/handover notes that
   only the confirmed nurse and the facility can see).
2. A new nurse account starts `PENDING`: they upload certificates at
   `/credentials` and complete every module at `/induction`. An admin
   reviews uploaded documents at `/admin` and verifies or rejects the profile.
3. Once verified + inducted, the nurse sees open shifts on `/dashboard` and
   can claim one from the shift detail page — claiming is blocked server-side
   until both conditions are met.
4. The facility reviews claims on the shift detail page (each claimant shows
   their verification badge) and confirms one — this fills the shift and
   auto-declines any other pending claims.
5. Both sides can download a `.ics` calendar invite for the confirmed shift
   from the shift detail page (includes ward, required qualification, and
   care notes). The nurse's `/schedule` page lists all upcoming confirmed
   shifts and exports the whole thing as one `.ics` feed, and lets them add
   availability blocks for facilities to see later.

## Other scripts

- `npm run db:studio` — Prisma Studio, a GUI for browsing/editing the dev database
- `npm run build` / `npm start` — production build and run
- `npm run lint` — ESLint

## Where this MVP stops (next steps)

- **Object storage for certificates**: uploads currently go to local disk
  (`/uploads`), which doesn't survive a redeploy and won't work across
  multiple server instances. Swap `lib/uploads.ts` for S3-compatible storage
  before running this anywhere but a single dev machine.
- **Patient data handling**: `Shift.careNotes` is a free-text field with no
  encryption-at-rest or access audit trail beyond "confirmed nurse + owning
  facility can see it." Treat it as handover notes, not a place for
  patient-identifiable health information, until real compliance controls
  (encryption, audit logging, data retention policy) are added.
- **Real induction content**: modules are seeded rows with a self-attest
  button. A real deployment would link out to an LMS/course provider or add
  quizzes, and track completion server-side rather than trusting the nurse's click.
- **Two-way calendar sync**: `.ics` export/download is one-way. Linking a
  nurse's Google/Outlook calendar to auto-block their availability (rather
  than manual `AvailabilityBlock` entries) would need OAuth + that
  provider's calendar API.
- **Availability-aware matching**: `AvailabilityBlock` is informational only
  today — it doesn't yet filter the open-shifts feed to a nurse's stated
  availability.
- **Notifications**: email/SMS/push when a shift is claimed, confirmed, or a
  credential review completes, instead of requiring a page refresh.
- **Rate rules / auto-matching**: today every claim needs manual facility
  review; a pricing-rule engine could auto-confirm matches.
- **Invoicing/payouts**: turning completed shifts into invoices and tracking
  nurse payouts.
- **Postgres in production**: the SQLite datasource is for local dev only.
