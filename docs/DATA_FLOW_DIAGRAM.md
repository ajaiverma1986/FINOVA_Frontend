# FINOVA data flow diagrams

Prepared: 5 October 2026. Companion to [Application Process Flow](APPLICATION_PROCESS_FLOW.md).

These diagrams show **data movement**, rather than execution order. Frontend-to-API flows are verified from this repository. Backend-to-database flows are inferred because backend code and physical database schemas are unavailable. Store names are conceptual, not confirmed table names.

Notation: rectangles represent external participants; rounded nodes represent processes; cylinders represent data stores. Solid arrows show verified flows; dashed arrows show inferred flows. Every arrow is labeled with the data it carries. Browser session storage is separate from the backend database.

## Level 0: system context

The entire frontend and backend are represented as one FINOVA process. Internal stores are omitted at this level.

```mermaid
flowchart LR
    USER[User]
    REVIEWER[Authorized reviewer]
    ADMIN[Authorized administrator]
    APP([0. FINOVA application])

    USER -->|Credentials, recovery details, pay-in details and receipts| APP
    APP -->|Authentication results, account options, request status and reports| USER
    REVIEWER -->|Search criteria, request IDs, decisions and rejection reasons| APP
    APP -->|Request records, receipt views and decision results| REVIEWER
    ADMIN -->|Organization, user, master, pricing, access and notification configuration| APP
    APP -->|Configuration records, user details, reports and operation results| ADMIN
```

Actual SMS/email delivery and financial-provider exchanges are not established by the current frontend source, so they are not represented as verified external flows.

## Level 1: frontend, backend and data stores

```mermaid
flowchart LR
    U[User]
    R[Reviewer]
    A[Administrator]

    subgraph Browser[Browser frontend]
        P1([1. Capture input and present results])
        P2([2. Manage session and navigation])
        P3([3. Encode requests and validate responses])
        S1[(B1. Session storage)]
    end

    subgraph Backend[Backend API contracts - internal processing inferred]
        P4([4. Authenticate and recover access])
        P5([5. Manage organizations and users])
        P6([6. Manage accounts and pay-ins])
        P7([7. Query reports and dashboard])
        P8([8. Manage reference and configuration data])
    end

    D1[(D1. Identity and access)]
    D2[(D2. Organizations and user details)]
    D3[(D3. Accounts and pay-in requests)]
    D4[(D4. Transaction and statement data)]
    D5[(D5. Reference and configuration data)]
    D6[(D6. Documents and file references)]

    U -->|Credentials, recovery and pay-in input| P1
    R -->|Filters, selections and decisions| P1
    A -->|Maintenance input and report filters| P1
    P1 -->|Results, records and errors| U
    P1 -->|Requests, receipts and decision results| R
    P1 -->|Saved records, reports and errors| A
    P1 -->|Login input and navigation context| P2
    P2 -->|Token, identity and expiry| S1
    S1 -->|Current session| P2
    P2 -->|Session and permitted paths| P1
    P2 -->|Credentials and menu queries| P3
    P1 -->|Domain input, files and filters| P3
    P3 -->|Validated results and errors| P1
    P3 -->|Authentication and menu responses| P2
    P2 -->|Current UserToken| P3

    P3 -->|Login and recovery payloads; APIToken| P4
    P4 -->|Token, display name and recovery results| P3
    P3 -->|User and organization payloads; token headers| P5
    P5 -->|Profiles, child records and operation results| P3
    P3 -->|Account details, pay-in files, filters and decisions; token headers| P6
    P6 -->|Account lists, requests, file references and results| P3
    P3 -->|Report filters, paging and sorting; token headers| P7
    P7 -->|Report records, totals and dashboard summaries| P3
    P3 -->|Menu queries, lookup requests and configuration payloads; token headers| P8
    P8 -->|Menus, lookup records and saved configuration results| P3

    D1 -.->|Credential and recovery verification data| P4
    P4 -.->|Credential and recovery state changes| D1
    D1 -.->|Access catalog and menu mappings| P8
    P8 -.->|Access configuration changes| D1
    D2 -.->|Organization, profile and user detail records| P5
    P5 -.->|Organization and user detail changes| D2
    D3 -.->|Account and pay-in records| P6
    P6 -.->|Account records and request decisions| D3
    P5 -.->|KYC and bank document content or metadata| D6
    D6 -.->|Stored document references| P5
    P6 -.->|Receipt and company-account document content or metadata| D6
    D6 -.->|Stored document references| P6
    D2 -.->|User report and organization data| P7
    D3 -.->|Pay-in reporting data| P7
    D4 -.->|Transaction and statement records| P7
    D5 -.->|Active references and configuration| P8
    P8 -.->|Reference, pricing and notification configuration changes| D5
```

Process 7 groups reporting responsibilities for readability. Pay-in reports actually use `/Wallet/SearchPayinRequests`; transaction and user reports use `/Report/...` contracts. Transaction writes and provider settlement are outside the verified active workflows; D4's originating write process is therefore not asserted here.

## Level 2: authentication and permissions

```mermaid
flowchart LR
    U[User]
    LOGIN([2.1 Capture sign-in details])
    AUTH([2.2 Call authentication API])
    PROFILE([2.3 Resolve user type])
    SESSION([2.4 Store validated session])
    MENU([2.5 Load permitted navigation])
    API[Backend API]
    S[(B1. finova.auth session record)]
    D[(D1. Identity and access - inferred)]

    U -->|Username and password| LOGIN
    LOGIN -->|Username and Password payload| AUTH
    AUTH -->|POST /AA/login with APIToken| API
    API -->|UserToken and DisplayName| AUTH
    AUTH -->|Authorization result and username| PROFILE
    PROFILE -->|GET user profile by UserName; anonymous during login| API
    API -->|Result.UserTypeId| PROFILE
    PROFILE -->|Token, username, display name, user type and expiry| SESSION
    SESSION -->|Validated session record| S
    S -->|Current session and UserToken| MENU
    MENU -->|ListAllMenu and ListAllsubMenu queries| API
    API -->|Parent menus and submenu records| MENU
    MENU -->|Permitted links and page-access information| U
    D -.->|Credential and permission records| API
    AUTH -->|Authentication errors| U
    PROFILE -->|Profile validation errors| U
```

The session is saved after both login and profile lookup succeed. Expiry, logout or authenticated HTTP 401 clear local session state. No server logout or refresh-token flow is used. Recovery data flows through anonymous `POST /UserMgr/ForgotPassword` and `POST /UserMgr/ResetPassword`; OTP delivery and storage are unverified.

## Level 2: user onboarding and document data

```mermaid
flowchart LR
    A[Administrator]
    MASTER([5.1 Save user master])
    DETAILS([5.2 Save user detail records])
    VIEW([5.3 Load saved user information])
    API[UserMgr and organization APIs]
    D[(D2. Organization and user details)]
    F[(D6. Document storage or metadata)]

    A -->|Organization, user type, identity and account settings| MASTER
    MASTER -->|CreateUserMaster or UpdateUserMaster payload| API
    API -->|Saved user ID and operation result| MASTER
    MASTER -->|Resolved UserMasterID| DETAILS
    A -->|Address, KYC, bank, configuration, other details and parent mapping| DETAILS
    DETAILS -->|User ID and child-record payloads; multipart documents where supported| API
    API -->|Saved detail IDs, file references and results| DETAILS
    API -.->|User master and child-record changes| D
    D -.->|Saved organization and user records| API
    API -.->|Uploaded document content or metadata| F
    F -.->|Document locations and media metadata| API
    VIEW -->|User and child-record lookup parameters| API
    API -->|User, address, KYC, bank and configuration records| VIEW
    A -->|Selected user ID| VIEW
    VIEW -->|Saved records and available document references| A
    MASTER -->|Validation and save results| A
    DETAILS -->|Validation and save results| A
```

Each child record references the resolved user ID. Separate requests can leave partially saved onboarding data; the frontend does not establish an atomic onboarding transaction. KYC and bank documents in the current wizard use their respective multipart create/update contracts.

## Level 2: pay-in creation and review

```mermaid
flowchart LR
    U[User]
    R[Reviewer]
    LOOKUP([6.1 Load pay-in selections])
    CREATE([6.2 Validate and submit pay-in])
    SEARCH([6.3 Search and display requests])
    DECIDE([6.4 Submit review decisions])
    API[Wallet and lookup APIs]
    D[(D3. Accounts and pay-in requests)]
    F[(D6. Receipt storage or metadata)]
    REF[(D5. Payment references)]

    U -->|Signed-in identity and selected payment channel| LOOKUP
    LOOKUP -->|Profile, active channels, modes and account queries| API
    API -->|User ID, payment modes and available accounts| LOOKUP
    LOOKUP -->|Valid selection records and user ID| CREATE
    U -->|Amount, charge, account IDs, deposit date, references and optional receipt| CREATE
    CREATE -->|Multipart CreatePayinRequest payload with Status 1| API
    API -->|Creation result or error| CREATE
    CREATE -->|Submission result| U
    API -.->|New pay-in record and receipt reference| D
    API -.->|Receipt content or metadata| F
    F -.->|Stored receipt location| API
    REF -.->|Payment channels and modes| API
    D -.->|Active accounts and pay-in records| API
    U -->|Own user ID for request list| SEARCH
    R -->|Date, status, channel, mode and page filters| SEARCH
    SEARCH -->|GetPayinRequestsByUserMasterID or SearchPayinRequests parameters| API
    API -->|Request records, totals and receipt references| SEARCH
    SEARCH -->|Own request status and details| U
    SEARCH -->|Review records and receipt references| R
    R -->|Request IDs, decision and required rejection reason| DECIDE
    DECIDE -->|RequestID, Action APPROVE or REJECT, RejectedReason| API
    API -.->|Decision and rejection reason changes| D
    API -->|Per-request decision results| DECIDE
    DECIDE -->|Success count and individual errors| R
```

The active creation screen sends the optional receipt within `/Wallet/CreatePayinRequest`, not through a second upload. Review sends one `/Wallet/ApproveRejectPayinRequest` call per selected ID. Frontend wallet statuses are Pending 1, Approved 2 and Rejected 3. A balance credit, ledger posting or provider transfer is not established by the approval contract.

## Level 2: reports and export

```mermaid
flowchart LR
    U[Authorized report user]
    FILTER([7.1 Capture report criteria])
    QUERY([7.2 Query report API])
    DISPLAY([7.3 Present records and totals])
    EXPORT([7.4 Generate browser download])
    API[Report or Wallet APIs]
    D2[(D2. User data)]
    D3[(D3. Pay-in data)]
    D4[(D4. Transaction data)]

    U -->|Dates, IDs, status, search text, page and sort options| FILTER
    FILTER -->|Validated report request| QUERY
    QUERY -->|Report query payload and token headers| API
    D2 -.->|Matching user records| API
    D3 -.->|Matching pay-in records| API
    D4 -.->|Matching transaction records and summaries| API
    API -->|Records and paging or summary information| QUERY
    QUERY -->|Validated report data| DISPLAY
    DISPLAY -->|Tables, totals and errors| U
    U -->|Export request and active filters| EXPORT
    DISPLAY -->|Loaded records where export uses current data| EXPORT
    EXPORT -->|Additional page queries where export loads all matches| API
    API -->|Additional matching records| EXPORT
    EXPORT -->|Excel-compatible XLS or screen-specific CSV file| U
```

Transaction/user reports use `/Report/TransactionDetailsReport` and `/Report/GetUserMasterListReport`. Dashboard summaries use `/Report/AdminDashboard`. The Transfer Report reads pay-in records and initially filters Approved. Export scope and format vary by screen; dedicated pay-in/transfer exports fetch successive pages and create XML `.xls` files locally.

## Data store dictionary

| Store | Logical contents | Evidence / limitation |
| --- | --- | --- |
| B1 | Token, username, display name, user type, expiry | Verified browser `sessionStorage`; not a backend database |
| D1 | Credential/recovery data, roles, menus, access mappings | Inferred from authentication and access contracts |
| D2 | Organizations, users, addresses, KYC metadata, bank details, user limits and parent mappings | Inferred from OrgMgr/UserMgr requests |
| D3 | Company accounts, pay-in records, statuses, reasons and receipt references | Inferred from Wallet requests |
| D4 | Transactions, financial statement records and aggregates | Inferred from report contracts; writes and accounting design unverified |
| D5 | Master references, plans, pricing, policies, gateways and templates | Inferred from configuration contracts |
| D6 | Uploaded files or their metadata and locations | Storage technology and placement of file bytes unverified |

## Contract references

The diagrams are grounded in [API client](../src/core/api.ts), [authentication](../src/core/auth.tsx), [session storage](../src/core/session.ts), [navigation](../src/core/navigation.ts), [user services](../src/services/UserMgrservice.ts), [wallet services](../src/services/WalletService.ts), [report services](../src/services/ReportService.ts), and the source index in [Application Process Flow](APPLICATION_PROCESS_FLOW.md#17-source-index-and-completion-boundary).
