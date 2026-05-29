# Gladiator Website

Customer-facing Next.js application for Gladiator boat cruises, boat rentals,
and beach house stays. Inventory, availability rules, routes, pricing, and
bookings are managed through `../gladiator-admin`.

## Stack

- Next.js 16 App Router with application code in `src/`
- React 19 with React Compiler enabled
- TypeScript in strict mode
- CSS modules and global design tokens
- Supabase JavaScript client
- React Query service hooks

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
`.env.local`. Only the Supabase publishable/anon key belongs in this website;
never expose a service-role key.

Validation commands:

```bash
npm run lint
npm run build
```

## Admin Data Contract

The admin application currently defines the customer-visible domain:

- `boats` and `boat_images`: cruises/rentals, capacities, hourly prices, and imagery
- `beach_houses` and `beach_house_images`: stays, day-use pricing, amenities, and imagery
- `locations` and `transport_routes`: active pickup/drop-off locations and route prices
- `bookings`: `boat_cruise`, `beach_house`, and `boat_rental` reservations with `source: 'web'`
- `app_settings`: boat curfew configuration

Before website pages fetch inventory or submit bookings, the Supabase policies
must support the public flow. Current admin migrations allow anonymous reads
for active locations/routes, but boats, beach houses, settings, customers, and
booking inserts remain authenticated-only. Availability should eventually be
served by a restricted public database function or server endpoint rather than
opening customer booking rows to anonymous reads.

## Data Layer

The customer-facing API modules live in `src/services`:

- `apiBoat.ts` and `apiBeachHouse.ts` fetch active catalog entries and details by slug, including boats explicitly available for rentals.
- `apiTransport.ts` fetches active locations/routes and resolves route pricing.
- `apiSettings.ts` reads public booking settings such as the boat curfew.
- `apiBooking.ts` checks availability and creates `web`-sourced reservations.

Reusable React Query hooks live in `src/hooks`, matching the structure used in
the existing Next.js projects. `src/context/QueryProvider.tsx` is already
wired into the root layout.
