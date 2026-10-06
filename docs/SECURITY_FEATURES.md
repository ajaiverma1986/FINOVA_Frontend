# FINOVA Application — Implemented Security Features

Review date: 6 October 2026  
Scope: Current React frontend source in this repository.

This document lists security controls evidenced by the application code. Backend source, production server configuration, and live API behavior were not reviewed. A frontend control helps protect the user interface but does not establish server-side enforcement. This is a source review, not a penetration test or security certification.

## Implemented controls

| No. | Feature | Implemented behavior | Source evidence |
| --- | --- | --- | --- |
| 1 | Token-based sign-in integration | Submits username and password to `/AA/login` using POST. Validates that the response includes a non-empty user token and obtains a validated user-type identifier before saving the session. | [auth.tsx](../src/core/auth.tsx) |
| 2 | Authentication headers | The shared API client sends `APIToken` and adds `UserToken` for authenticated requests, including multipart requests. Explicitly anonymous requests omit the user token. Token verification belongs to the backend. | [api.ts](../src/core/api.ts) |
| 3 | Protected dashboard routes | Redirects users without a session to the login page before rendering dashboard routes. | [App.tsx](../src/app/App.tsx), [Shell.tsx](../src/app/Shell.tsx) |
| 4 | Menu-based page access | Loads user-scoped menu/submenu responses and checks direct dashboard navigation against permitted paths. Disallowed pages show “Access denied.” Menu loading errors prevent dashboard content from rendering. | [navigation.ts](../src/core/navigation.ts), [Shell.tsx](../src/app/Shell.tsx) |
| 5 | Session lifetime limit | Sessions expire after a configurable duration: 60 minutes by default, with a maximum configured duration of 1,440 minutes. A timer clears the session at expiry; authenticated API requests also check expiry before sending. This is an absolute lifetime, not an inactivity timeout. | [auth.tsx](../src/core/auth.tsx), [api.ts](../src/core/api.ts) |
| 6 | Validated session storage | Uses one namespaced `sessionStorage` record (`finova.auth`). Parses and validates saved session data; malformed or expired records are removed when the module loads. | [session.ts](../src/core/session.ts) |
| 7 | Logout and cached-data cleanup | Logout clears the session and TanStack Query cache. Login also clears cached queries before installing the new session. Loss of the session triggers cache cleanup. | [auth.tsx](../src/core/auth.tsx) |
| 8 | Unauthorized-response handling | An authenticated HTTP 401 response clears the local session. HTTP 403 produces an access-denied message while retaining the session. | [api.ts](../src/core/api.ts) |
| 9 | OTP password recovery integration | Requests an OTP through `/UserMgr/ForgotPassword` and submits the OTP and new password through `/UserMgr/ResetPassword`. The form requires exactly six numeric OTP digits, a nonblank password, and matching password confirmation. The OTP page requires a usercode in navigation state. | [passwordRecovery.ts](../src/services/passwordRecovery.ts), [UserMgrservice.ts](../src/services/UserMgrservice.ts), [ForgotPasswordOtp.tsx](../src/components/ForgotPasswordOtp.tsx), [ForgotPasswordOtpPage.tsx](../src/pages/AppMain/ForgotPasswordOtpPage.tsx) |
| 10 | OTP resend cooldown | Disables OTP resend for 60 seconds, checks the cooldown again in the handler, and disables conflicting operations while a resend or reset is pending. This is a browser control; server-side throttling is not verified. | [ForgotPasswordOtp.tsx](../src/components/ForgotPasswordOtp.tsx) |
| 11 | Password input masking | Login and password recovery use password-type inputs. Shared forms identify password fields and mask their input. Some gateway forms offer an explicit show/hide toggle. Masking does not encrypt the submitted password. | [LoginPage.tsx](../src/pages/AppMain/LoginPage.tsx), [ForgotPasswordOtp.tsx](../src/components/ForgotPasswordOtp.tsx), [FieldsForm.tsx](../src/components/FieldsForm.tsx) |
| 12 | Form validation | Shared forms validate required fields, finite numbers, positive amounts, whole-number pagination values, and ten-digit mobile/phone fields. Recovery additionally validates OTP format and matching passwords. Validation depends on the form and must also occur on the server. | [FieldsForm.tsx](../src/components/FieldsForm.tsx), [ForgotPasswordOtp.tsx](../src/components/ForgotPasswordOtp.tsx) |
| 13 | API response validation | Zod checks the common response envelope and selected domain responses, including authentication and menu data. Invalid JSON, unexpected envelopes, HTTP failures, and recognized backend/provider error statuses are rejected. | [api.ts](../src/core/api.ts), [auth.tsx](../src/core/auth.tsx), [navigation.ts](../src/core/navigation.ts) |
| 14 | API path and query safeguards | The shared client requires paths beginning with `/` and rejects paths beginning with `//`. Dynamic operation queries use `URLSearchParams`; several direct service requests use `encodeURIComponent`. This protects URL construction; it does not prove protection against database injection. | [api.ts](../src/core/api.ts), [UserMgrservice.ts](../src/services/UserMgrservice.ts) |
| 15 | Sensitive-field suppression | Shared tables and result views omit fields whose names match passwords, tokens, file bytes, Base64 payloads, state responses, or eKYC identifiers. User details additionally filter password/token/salt keys. This reduces accidental display and, for the shared table, export exposure. | [DataTable.tsx](../src/components/DataTable.tsx), [ResultView.tsx](../src/components/ResultView.tsx), [UserMasterComponent.tsx](../src/pages/Usermanager/UserMasterComponent.tsx) |
| 16 | Spreadsheet export safeguards | CSV cells beginning with optional whitespace followed by `=`, `+`, `@`, or `-` receive an apostrophe prefix; quotes are escaped. The separate SpreadsheetML exporter XML-escapes values and explicitly represents nonnumeric data as strings. | [DataTable.tsx](../src/components/DataTable.tsx), [exportToExcel.ts](../src/core/exportToExcel.ts) |
| 17 | Document link safeguards | The document viewer accepts only resolved HTTP/HTTPS URLs, rejecting schemes such as `javascript:` and `data:`. Links opened in a new tab use `noopener noreferrer`. Inline previews are limited to recognized image types and PDFs. | [FileViewer.tsx](../src/components/FileViewer.tsx) |
| 18 | User KYC upload checks | The user detail workflow checks PDF/JPG/JPEG/PNG filename extensions, rejects empty files, and limits upload size to 10 MiB. This is specific to this workflow and does not inspect actual file contents or scan for malware. | [UserDetailStep.tsx](../src/pages/Usermanager/UserDetailStep.tsx) |

## Access-control boundaries

- Page permissions are checked in the browser. The backend must independently authorize every API action and record access.
- The user dashboard is allowed for any signed-in session. Several create/view/edit routes inherit access from their parent/list route rather than receiving separate action permissions.
- When the backend returns an empty “Notification Manager” group, the frontend supplies built-in notification pages. Separate permissions for each supplied page are not established by that fallback.
- Role, permission, menu-permission, and role-permission management screens exist. Their presence demonstrates administrative integration, not proof that every backend endpoint enforces those settings.

## Limitations and protections not verified

| Area | Finding from this review |
| --- | --- |
| HTTPS enforcement | The API base URL and document viewer permit both HTTP and HTTPS. Mandatory TLS, HTTPS redirects, and HSTS are not established by the reviewed frontend configuration. |
| Browser-visible credentials | `VITE_API_TOKEN` is bundled into browser code. Session tokens are readable by JavaScript in `sessionStorage`; they are not stored in HttpOnly cookies. Neither value should be described as a protected server-side secret. |
| Backend token revocation | Logout removes the browser session. No server-side logout/revocation request is made by the reviewed auth provider. |
| Password policy and storage | Recovery checks nonblank input and confirmation, but does not enforce minimum length or complexity. Password hashing, secure storage, password history, and backend policy are not verifiable here. |
| Default account password | One user-creation branch sends the literal password `password` with `IsPasswordExpired: false` in `UserMasterComponent.tsx`. This should be reviewed before describing provisioning as secure or claiming forced first-login password changes. |
| Login MFA and abuse prevention | Recovery OTP exists, but login MFA, CAPTCHA, server rate limits, failed-login lockout, and OTP expiry/attempt limits were not verified. A resend countdown can be bypassed outside the UI. |
| Sensitive-data filtering | Filtering is based on field names and varies across components. Data may still reach the browser or appear inside nested objects; this is not comprehensive redaction or data-loss prevention. |
| File protection | Extension/size validation is not content verification. Antivirus scanning, private document authorization, and safe server storage were not verified. The viewer has no origin allowlist, and its PDF iframe is not sandboxed. |
| Security headers and CSRF | The included IIS configuration supplies route rewriting. CSP, frame restrictions, other response security headers, and dedicated CSRF defenses are not established by that file or the reviewed client code. Production infrastructure may provide additional controls. |
| Infrastructure and compliance | Encryption at rest, database injection protection, audit-log integrity, monitoring, backups, CORS deployment rules, and regulatory compliance require backend/infrastructure evidence. |

## Evidence and verification status

Existing tests cover API errors and session expiry, query encoding, menu permission behavior, CSV escaping, rejected document URL schemes, and password recovery validation/cooldown behavior. Relevant files include:

- [API tests](../src/core/api.test.ts)
- [Navigation tests](../src/core/navigation.test.ts)
- [Browser application tests](../tests/application.spec.ts)
- [Data table tests](../src/components/DataTable.test.tsx)
- [Document viewer tests](../src/components/FileViewer.test.tsx)
- [Password recovery tests](../src/components/ForgotPassword.test.tsx)

These tests were inspected as evidence of intended coverage; they were not rerun for this documentation-only review. No live authentication, OTP delivery, backend security testing, or production configuration testing was performed. Current implementation takes precedence over older README descriptions, particularly for password recovery and permission exceptions.
