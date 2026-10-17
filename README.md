# SquadYatra Frontend

React 19 + TypeScript + Vite frontend based on the [SquadYatra project overview](https://docs.google.com/document/d/e/2PACX-1vTj9hJj3GLqnqZhQ20S9TC3-eQmUjcyOMeifsKo54nghZidX-JT8tF8eOXRhbeKlaNl2Tpb1ymPbm8C/pub).

## Run Locally

Use Node **22.13+** and npm. The current application was also smoke-tested with Node 20.11, but the latest lint dependencies require Node 20.19+ or 22.13+.

```sh
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Vite selects another port if it is occupied.

```sh
npm run test
npm run lint
npm run build
npm run preview
npm run format
npm run format:check
```

## Implemented Experience

- Responsive trip catalog with destination, region, month, category, budget, sorting, and saved trips.
- Departure details, itinerary highlights, inclusions, available seats, enrollment deadlines, and squad-specific provisional prices.
- Squad creation for the five documented categories; mixed-squad enrollment stays disabled until an age policy is approved.
- Explicit departure-specific discovery consent, invitation acceptance/decline, category attestation, and one active squad per departure in the demo.
- Separate membership and seat-reservation actions; demo reservations expire after 15 minutes and release inventory on the next refresh.
- My Squads, My Bookings, account/privacy, support, and invitation inbox screens.
- Agency-owned listing view and submission; internal-team submission and admin approval. Approval does not activate inventory.
- Supabase password sign-in wiring, trusted `app_metadata.role` route guards, gateway bearer tokens, correlation IDs, bounded request timeouts, and mutation idempotency keys.
- Error boundaries, loading/error/empty states, keyboard-accessible native dialogs, reduced-motion support, unit checks, and GitHub Actions CI.

## Architecture

```text
frontend/
	src/
		app/                  Application composition, router, role guards
		components/           Shared navigation, dialogs, empty states, avatars
		data/                 Explicit demo fixtures and travel image sources
		domain/               Typed models, formatting, membership/expiry rules
		features/
			auth/               Supabase session and account screens
			bookings/           Reservation and booking summary
			catalog/            Discovery, trip cards, departure detail
			management/         Agency and internal-admin workspace
			squads/             Creation, roster summaries, invitation inbox
			workspace/          Repository boundary and React Query orchestration
		lib/                  Public configuration, Supabase, HTTP transport
		styles.css            Responsive tokens, layouts, and components
```

Request flow: **screen -> React Query -> repository -> gateway -> owning service**. Login goes directly to Supabase Auth, not the gateway. The browser client persists the Supabase session in chunked cookies and API requests send the access token as a bearer token. These browser-set cookies are JavaScript-readable, not `HttpOnly`; HttpOnly session cookies require a server-side auth layer. UI components do not call Supabase database tables. The backend remains authoritative for roles, ownership, eligibility, seat inventory, qualifying confirmations, and price acceptance.

## Demo and Live Integration

Default mode is `demo`: sample trips, a sample traveler, one joined squad, and one incoming invitation. Demo pages require submitting the login form, but accept any non-empty username and password. Set `VITE_DEMO_MODE=true` to explicitly enable demo mode or `VITE_DEMO_MODE=false` to disable it; when unset, `VITE_DATA_MODE` continues to determine the data mode. Actions persist in the browser under `squadyatra.workspace.v1`; clearing that key resets the demo. The sidebar's **Demo view** selector switches consumer, agency, and admin previews. It is not a real authorization mechanism and is absent in live mode. Demo category attestation is not identity or age verification. Sample discoverable squads are illustrative, not evidence of an eligible match. No real payment is taken.

Use `frontend/.env.example` as the configuration reference. Set these values in a local untracked environment file or Vercel environment settings:

```dotenv
VITE_DATA_MODE=live
VITE_DEMO_MODE=false
VITE_API_GATEWAY_URL=https://your-gateway.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
```

Never put service-role keys, JWT signing secrets, or database credentials in `VITE_*` variables. All frontend environment variables are public. Roles are read from trusted `app_metadata.role`; agency ownership is identified by trusted `app_metadata.agency_id`. Backend services must independently authorize every operation.

### Proposed API Adapter Contracts

Only the gateway route groups are established by the project overview. The following resource paths and TypeScript response shapes are **frontend integration proposals, not verified backend contracts**. Adapt the repository to the services' OpenAPI specifications before enabling live mode.

| Operation | Gateway path |
| --- | --- |
| Published trip catalog | `GET /api/v1/catalog/trips` |
| Owned squad state | `GET /api/v1/squads/mine` |
| Invitation inbox | `GET /api/v1/squads/invitations` |
| Booking state | `GET /api/v1/bookings/mine` |
| Discovery/saved preferences | `GET /api/v1/squads/preferences` |
| Save a trip | `POST /api/v1/catalog/saved/toggle` |
| Discovery consent | `POST /api/v1/squads/discovery/toggle` |
| Squad creation | `POST /api/v1/squads` |
| Invitation response | `POST /api/v1/squads/invitations/:id/respond` |
| Seat reservation | `POST /api/v1/bookings/reservations` |
| Agency/internal listing submission | `POST /api/v1/catalog/trips` or `/api/v1/catalog/internal/trips` |
| Listing approval | `POST /api/v1/catalog/trips/:id/approve` |

Live integration still needs public/private query separation, paginated catalog/agency/admin queries, server-owned commercial quote objects, explicit set-state preference endpoints, stable idempotency keys across user retries, and a real reservation response rather than local demo state. Mutation retries are disabled. Browser-local counts and inventory are demonstration-only, never production safeguards.

## Remaining Release Gates

This is a working frontend pilot, **not a production booking platform**. Backend APIs were not supplied and live auth/service integration has not been verified. Agency onboarding/approval, organizer recruitment and outgoing invitations, individual party member/child profiles, document verification, listing editing/departure-tier configuration, notification delivery/preferences, cancellation/refund workflows, and operational moderation are follow-up slices.

Payment timing, qualifying-count conditions, age ranges, child pricing, price locks, cancellation/refund rules, and settlement policies remain intentionally unimplemented pending product approval. No numeric mixed-squad age range is assumed. Published demo prices use INR as sample data, not an approved launch-country decision. New listing forms are pilot metadata submissions; full production publication requires complete descriptions, images, inclusion/departure/tier validation and Booking activation.

## Deployment

In Vercel, set **Root Directory** to `frontend`, framework to Vite, build command to `npm run build`, and output directory to `dist`. The SPA fallback is in `frontend/vercel.json`. Configure separate development, staging, and production variables and restrict gateway CORS to approved frontend origins.

Travel imagery is loaded from Unsplash; fonts load from Google Fonts. Review licensing, privacy/CSP policy, availability, and preferably self-host approved production assets before launch. System fallbacks preserve usability if font loading fails.
