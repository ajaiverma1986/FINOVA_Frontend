# FINOVA architecture

Based on the current frontend source. Solid arrows show implemented dependencies or request paths. Dashed arrows show inferred backend responsibilities; backend internals and storage technologies are not available in this repository.

## System architecture

```mermaid
flowchart TB
    USER["Users, reviewers and administrators"]
    HOST["Static web host<br/>Vite build: dist/<br/>SPA history fallback"]

    subgraph BROWSER["Browser — React 19 / TypeScript"]
        ENTRY["Application providers<br/>Theme · Error boundary · Query client · Auth"]
        ROUTER["React Router<br/>Public login and recovery routes<br/>Protected dashboard + permission guards"]
        UI["Feature pages and shared components<br/>Dashboard · Organizations · Users<br/>Wallet / Pay-ins · Reports<br/>Masters · Configuration · Access · Notifications"]
        QUERY["TanStack Query<br/>Server data cache and query lifecycle"]
        SERVICES["Domain services and operation catalog<br/>Typed request / response models"]
        API["Shared fetch API client<br/>JSON / multipart encoding<br/>Zod response envelope validation<br/>HTTP and application error handling"]
        AUTH["Auth context and session store<br/>Login · Logout · Expiry"]
        SESSION[("sessionStorage<br/>finova.auth")]
        THEME[("localStorage<br/>Theme preference")]
    end

    BACKEND["External FINOVA backend API<br/>Configured by VITE_API_BASE_URL<br/>Authentication · Menus / access · Domain endpoints"]
    DB[("Conceptual backend data stores<br/>Identity · Users / organizations<br/>Accounts / pay-ins · Transactions<br/>Reference / configuration data")]
    FILES[("Document content / metadata<br/>Storage implementation unknown")]

    USER -->|Open application| HOST
    HOST -->|HTML, JavaScript and CSS| ENTRY
    ENTRY --> ROUTER
    ROUTER --> UI
    ENTRY --> AUTH
    ENTRY -->|Read / persist theme| THEME
    ROUTER -->|Check current session| AUTH
    AUTH -->|Read / write / clear| SESSION
    AUTH -->|Login and profile lookup| API
    UI -->|Load / refresh server data| QUERY
    QUERY --> SERVICES
    UI -->|Submit actions and uploads| SERVICES
    SERVICES --> API
    API -->|Read current UserToken| AUTH
    API -->|HTTP 401 clears session| SESSION
    API <-->|HTTP requests / responses: APIToken and authenticated UserToken| BACKEND
    BACKEND -.->|Domain persistence and retrieval — inferred| DB
    BACKEND -.->|Document persistence and retrieval — inferred| FILES

    classDef frontend fill:#e8f0fe,stroke:#2563eb,color:#172554;
    classDef storage fill:#ecfdf5,stroke:#059669,color:#064e3b;
    classDef external fill:#fff7ed,stroke:#ea580c,color:#7c2d12;
    class ENTRY,ROUTER,UI,QUERY,SERVICES,API,AUTH frontend;
    class SESSION,THEME,DB,FILES storage;
    class USER,HOST,BACKEND external;
```

## Frontend module map

| Layer             | Source            | Responsibility                                                           |
| ----------------- | ----------------- | ------------------------------------------------------------------------ |
| Bootstrap         | `src/main.tsx`    | Mount React and initialize application providers                         |
| Routing and shell | `src/app/`        | Lazy route modules, dashboard layout, session and menu permission guards |
| Feature UI        | `src/pages/`      | Domain workflows and page-specific validation                            |
| Shared UI         | `src/components/` | Forms, tables, result views, file viewers and status handling            |
| Core              | `src/core/`       | API transport, authentication, sessions, navigation and permissions      |
| Services          | `src/services/`   | Domain API wrappers and schema-driven operation catalog                  |
| Contracts         | `src/models/`     | Request and response types                                               |
| Appearance        | `src/theme/`      | MUI theme, CSS tokens and persisted theme selection                      |

The diagram groups request and response paths for readability. TanStack Query manages server data; form and component state also live in React and React Hook Form. Menu-based frontend guards control navigation, while authorization must be enforced by the backend. Logout, session expiry and authenticated HTTP 401 clear the local session; the auth provider clears the query cache when the session is absent. There is no implemented refresh-token flow.

`src/services/device.ts` additionally defines a direct browser adapter for a local Morpho RD service at `https://localhost:11100`. This is separate from the FINOVA API client; the adapter's presence does not establish an active page integration or verified hardware workflow. SMS/email delivery, payment-provider processing, ledger posting and backend deployment topology are not established by this frontend.

## Build and deployment

```mermaid
flowchart LR
    SOURCE["React / TypeScript source"] --> CHECK["TypeScript check"]
    CHECK --> BUILD["Vite production build"]
    BUILD --> DIST["dist/ static assets"]
    DIST --> HOST["Static host<br/>IIS fallback configuration included"]
    HOST --> BROWSER["Browser SPA"]
    ENV["Build environment<br/>VITE_API_BASE_URL · VITE_API_TOKEN<br/>VITE_SESSION_MINUTES"] --> BUILD
    BROWSER <-->|API calls; backend CORS must allow deployed origin and headers| BACKEND["External backend API"]
```

Build environment values are bundled into the browser application. The deployment host and backend infrastructure are not specified by this repository.

Sources: [bootstrap](../src/main.tsx), [routing](../src/app/App.tsx), [shell](../src/app/Shell.tsx), [API client](../src/core/api.ts), [authentication](../src/core/auth.tsx), [session store](../src/core/session.ts), [theme persistence](../src/theme/theme.utils.ts), [build configuration](../vite.config.ts), and [IIS configuration](../public/web.config).

Related diagrams: [Data flow](DATA_FLOW_DIAGRAM.md) and [Application process flow](APPLICATION_PROCESS_FLOW.md).
