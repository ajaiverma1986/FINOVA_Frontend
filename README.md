# FINOVA React dashboard

React 19, TypeScript, React Router, TanStack Query, React Hook Form and Vite. The React application is independent of Angular at runtime.

## Run

From the repository root:

```powershell
npm install --prefix react-app
Copy-Item react-app/.env.example react-app/.env.local
# Set VITE_API_BASE_URL and VITE_API_TOKEN in .env.local.
npm run start:react
```

Open http://127.0.0.1:5173. Use the same backend and account as the Angular application. Environment values are read when Vite starts; restart after changing them. If `.env.local` already exists, edit it instead of overwriting it.

The current toolchain supports the installed Node 20.12 runtime. Vite 6 is intentional: newer Vite majors require a newer Node version. See [Vite documentation](https://vite.dev/guide/).

```powershell
npm run build:react
npm run test:react
npm --prefix react-app run test:e2e
```

The browser tests use Microsoft Edge and mocked API responses. They never send payments to the configured backend. Change the Playwright browser channel if Edge is unavailable.

## Structure

| Directory        | Purpose                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `src/app`        | Complete route inventory, lazy route imports, protected dashboard shell and menu permissions |
| `src/pages`      | Route components, authentication, profiles, password changes and money-transfer screens      |
| `src/components` | Shared forms, lookups, tables, filtering, CSV export, result/document views and error states |
| `src/core`       | Fetch client, response checks, auth context, structured session storage and navigation       |
| `src/services`   | Eight domain service modules, 100 extracted API operations and four upload operations        |
| `src/models`     | Existing request and response models, copied without Angular dependencies                    |
| `tests`          | Desktop/mobile browser tests with mocked APIs                                                |

All 65 concrete Angular URLs are represented, including 60 dashboard URLs. The duplicate login self-redirect is removed. Most data screens use a shared schema-driven form/table component, with individual route modules and their own API operations, defaults and columns. They are not embedded Angular pages.

The sidebar uses `ListAllMenu` and `ListAllsubMenu`. Direct dashboard navigation also checks that menu. Profiles and self-service password changes remain accessible to the signed-in user. Organisation KYC/configuration and add-account/add-slab screens inherit access from their corresponding list screens. Backend authorization is still authoritative.

The client sends `APIToken` and `UserToken` with the original casing. JSON and multipart requests share response/error handling. Session data uses one namespaced record, is cleared on logout or HTTP 401, and expires after `VITE_SESSION_MINUTES`. The backend has no refresh endpoint in the current source, so expired sessions require login again.

Tables support sorting, searching, local pagination and CSV export of loaded records. Paged APIs also expose server pagination. CSV exports label their scope explicitly and escape spreadsheet formulas. Exports are CSV rather than the previous XLSX format.

Payment and originator-account creation validate the document first, create the record, then upload using the returned ID. Upload retry retains that ID while the screen remains mounted. After an ambiguous network failure or leaving the page, check the list before submitting a new record; the backend does not expose an idempotency contract.

## What has and has not been verified

Latest local verification: production build passed, 12 unit tests passed, and 10 desktop/mobile browser tests passed. Dashboard screenshots were also inspected at both sizes.

- TypeScript and the production build.
- API/auth error handling, multipart headers, query encoding, session expiry, CSV escaping, route inventory and permission normalization.
- Desktop and mobile navigation through all dashboard routes, login/logout, denied direct navigation and payment upload retry without duplicate creation.
- No live backend transactions, provider OTPs, KYC approvals, biometric captures or production deployment were performed.

Route smoke coverage is not full workflow or visual parity. The shared screens differ visually from Angular, and some backend-specific status values and IDs still use explicit input fields. Verify complex role, commission, onboarding and reporting workflows against representative backend data before production cutover. Not every returned data shape has a domain-specific Zod schema; the common response envelope is validated.

## Existing backend gaps

1. `/forget`: the Angular component has no recovery API. React explains how to contact an administrator rather than claiming to send a reset email.
2. Public retailer and business registration pages have been removed from the React application.
3. Fino eKYC: `RegisterFinoCustomerKyc` in Angular points at the same endpoint as customer lookup. The React service preserves the source contract for review, but the UI does not call it as if identity verification were implemented. Customer registration requires an existing provider eKYC context. Confirm the proper endpoint and provider response fields before enabling the complete registration flow.
4. Device integration: Morpho connect/info/capture has a native fetch adapter. It requires the local RD service and certificate. Hardware behavior and the unused legacy Mantra helpers have not been ported/validated.
5. KYC delete is only a console placeholder in Angular; no deletion endpoint has been invented.

## Deployment

Deploy `react-app/dist/` after configuring the production build environment. The API must allow the deployed origin and the authentication headers through CORS. `VITE_*` values are browser-visible; do not put server-only secrets in them.

History routing requires an index fallback. An IIS `web.config` is included. For Nginx use `try_files $uri $uri/ /index.html;` in the application location. This package currently targets deployment at the domain root.

Angular's existing `npm start` and `npm run build` remain the fallback until live workflow and visual parity is accepted. The migration does not remove Angular or change production deployment automatically.

`scripts/migrate-contracts.cjs` records the initial source extraction. It is a bootstrap tool, not a normal build step; running it over customized React pages would overwrite them. The checked-in React sources are the maintained implementation.
