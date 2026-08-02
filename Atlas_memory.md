# ATLAS — Developer Memory & Architecture Guide (Handoff Document)

> **Purpose:** This document is the authoritative reference for ATLAS. It is written so that another engineer or AI can understand every nuance of the application **without reading `index.html`** and safely build on top of it. Where behavior contradicts intuition or docs, the file is the source of truth only if it differs from what is stated here — this document is maintained to match the file.

---

## 1. What ATLAS Is

ATLAS is a single-file (`index.html`), zero-build, vanilla HTML/JS/CSS application for **infrastructure planning and cost assessment**. No frameworks, no bundler, no backend, no persistence layer. All state lives in module-scope globals; all rendering is direct DOM manipulation. Everything runs in the browser; **no data ever leaves the machine** (a deliberate security decision — call data is sensitive).

**Four views, one file** (swapped via `showModule()`):
- **Gateway** — Landing page with 3 launch cards (responsive `sm:grid-cols-2 lg:grid-cols-3`, `max-w-6xl`, `pb-32` for footer clearance).
- **Cell Placement Optimizer** (green) — Determines optimal AWS infrastructure placement based on SLA latency requirements. Haversine distance + tier tax + greedy cost-per-customer coverage algorithm.
- **Onboarding Calculator** (blue) — Scopes engineering hours via an interactive DHTMLX Gantt timeline with financial quoting (internal cost + customer price).
- **Gap Analyzer** (violet) — Uploads CSV EDR call data, maps columns, validates UK destination numbers, renders Chart.js visualizations. **No anomaly detection** (removed by user decision, see §5).

**Module color code (use consistently for any new UI):** Optimizer = green/emerald (`#10b981`), Onboarding = blue (`#3b82f6`), Gap Analyzer = violet (`#8b5cf6`/`#a78bfa`).

## 2. Feature Overview

### 2.1 The application holistically

ATLAS is an internal planning suite for **Provenant Inc.** covering the full lifecycle of a customer relationship: *plan the infrastructure* (Optimizer), *scope the onboarding project and price it* (Onboarding Calculator), and *verify production call data quality* (Gap Analyzer).

**Primary users / personas:**
- **Solutions architects & PMs** — use the Optimizer to decide where to deploy AWS cells, and the Onboarding Calculator to produce project plans and quotes.
- **Network operations / monitoring teams** — use the Gap Analyzer on EDR (Event Detail Record) exports to detect signing-vs-verification discrepancies and UK number issues.

**Workflow & navigation features:**
- Single landing (Gateway) with one-click launch into any module; every module has a persistent header with a home button (back to Gateway), module-specific actions (Import/Export/Settings/Guide), and a sticky design (`bg-[#020617]/85 backdrop-blur`).
- Context-aware help: a floating "?" FAB opens the help drawer on the tab for the module you are currently in; each tab has a table of contents with smooth-scroll links.
- Everything is offline-capable (CDN deps excepted), browser-local, and session state is transferable between machines via JSON export/import files.
- Dark-only UI with a consistent design language: `glass` panels, slate palette, per-module accent colors, Font Awesome icons, toast notifications for every action outcome.

**Shared features across all modules:**
- **Toasts** (`showToast(msg, isError)`) — feedback for every completed/failed action.
- **Import/Export** — Optimizer and Onboarding support full-state JSON round-trip; all three modules support CSV export.
- **Client Proposal PDF (BETA)** — one branded, external-facing PDF generator (optimizer/onboarding data) with internal margins masked.

### 2.2 Cell Placement Optimizer — features

A guided 4-step wizard that produces an actionable deployment plan:

1. **Current Footprint** — select existing cells: **List View** (searchable, grouped by continent) or **Map View** (Leaflet, dark CARTO tiles, pulsing markers). Optional **Infrastructure Cost Profile** accordion: enter monthly cost per selected cell; the tool reverse-engineers a normalized global base cost with **Blended** (average) or **Specific** (single-cell anchor) baseline modes and live summary.
2. **Endpoint Locations** — add endpoints from two searchable tabs: **AWS Regions** or **World Cities** (with T1–T4 tier badges). **Click to Place on Map** mode snaps clicks to the nearest world city. Endpoints list shows count, coords, and per-row delete.
3. **SLA Configuration** — pick **Latency Estimation Model** (Realistic Mode default: direct distance + infra tax; Naive Mode: AWS proxy) and **SLA Mode** (one Global threshold, default 150ms, or a custom per-endpoint SLA with live latency previews per endpoint). Internal processing time (default 10ms) adds to every latency estimate.
4. **Coverage Analysis** — the dashboard: 5 stat cards (Total Endpoints, Already Covered, Pending Coverage, New Cells Needed, Est. Monthly OPEX); an optimization summary with average served latency; a coverage map (covered/pending/impossible/recommended markers with dashed connection lines); three result lists; **Latency Explorer** (top-5 candidate cells per uncovered endpoint with full latency breakdowns and cost chips); and **Recommended New Cells** cards (cell, tier tag, cost, endpoints covered, per-endpoint breakdowns). Edge states handled: all covered → success message; nothing coverable → "Impossible SLA" message.

Additional features: session JSON import/export, CSV report export, client proposal PDF, back/start-over navigation, step indicator with completed-state tracking.

### 2.3 Onboarding Calculator — features

A scoping + quoting workspace built around an interactive DHTMLX Gantt:

- **Top ribbon** — Blended Rate ($/hr, default 100), Desired Margin (%, default 20), **Deployment Scope** (Tier 1 Full Deployment / Tier 2 Integration Only / Tier 3 Standard Onboarding), and **Link Duration to Cost** toggle (off by default).
- **Live financial summary** — project duration in days, total estimated hours, total internal cost, and the customer price (margin-masked), all recomputed on every edit.
- **Interactive timeline** — the Gantt grid (540px, resizable) has inline-editable columns: drag-to-reorder rows, task name text inputs, Est. Hrs number inputs (snapped to 4-hour increments), live Est. Cost, Vis. Days, and delete buttons. On the chart side: draw dependency arrows by dragging the bar's end-circle onto another task; delete arrows by double-click; resize bars by dragging edges (cost impact depends on the Link toggle); tooltips show Billed Effort vs Visual Calendar.
- **Generic Day-N calendar** — dates abstracted to "Day 0, Day 1…" with weekends ignored, for pristine scoping.
- **Multi-tier memory** — each scope tier remembers its own tasks/links; switching tiers preserves your work silently. **Reset Timeline** is destructive and requires confirmation.
- **Exports** — client proposal PDF (BETA), session JSON (v2.0, imports v1.0 files), and a CSV quote covering financials + all 3 tier schedules.

### 2.4 Gap Analyzer — features

An EDR call-data analysis tool with validation, filtering, visualization, and export:

- **CSV upload & column mapping** — upload a CSV; a modal maps 8 fields (Time, Service, From, To, Status, Customer, Source IP, Processing Time) with **keyword auto-detection** (pre-filled when headers match); time/service/to are required.
- **UK number validation** — every destination number is normalized (scientific notation and Excel `+`-stripping recovered) and validated against E.164 structural rules; results surfaced as a per-row Valid/Invalid pill plus an **Invalid UK Numbers** metric.
- **Dashboard metrics (7 tiles)** — Total Records, Signing Requests, Verification Requests, Gap Count, Gap Percentage, Invalid UK Numbers, Slow Requests (>100ms). Tiles are **click-to-drill-down**: they reset filters and apply the matching one, scrolling to the table.
- **Filters** — service type, UK validation status, from/to substring search, status code, customer, source IP substring, and processing-time min/max; one-click **Reset All**.
- **4 visualizations** (Chart.js, hourly UTC buckets, humanized labels): Gaps Over Time, Invalid Numbers Over Time, Signing vs Verification Volume (stacked bars, valid/invalid segmented per service), Processing Time Distribution.
- **Data table** — 9 sortable columns, pagination (25/50/100 per page), showing/indicator controls.
- **Export** — modal with **Filtered** vs **All** scope; CSV includes a metrics summary block followed by the full quoted data rows.

## 3. Tech Stack (CDN, No Build)

| Dependency | Purpose |
|---|---|
| Tailwind CSS (CDN runtime) | Styling — utility classes + custom CSS in `<style>` |
| Font Awesome 6.5.1 | Icons |
| Leaflet 1.9.4 | Mapping (Optimizer only) |
| DHTMLX Gantt (edge build) | Timeline (Onboarding only) |
| Chart.js 4.4.1 | Charts (Gap Analyzer only) |
| chartjs-plugin-annotation 3.0.1 | 100ms threshold dashed line on Processing Time chart |
| html2pdf.js 0.10.1 | Client proposal PDF export |

**Critical: no other libraries may be assumed.** The CSV parser is a pure single-pass state machine (`parseGapCSV`) — no PapaParse. CSP meta tag allows `https:` + `data:` + `blob:` sources — new CDN deps must fit this or the CSP must change.

## 4. Architecture & File Map

`index.html` (~4,095 lines) is organized in this order:

| Lines (approx) | Content |
|---|---|
| 1–305 | Head: CDN links, `<style>` block (all custom CSS classes) |
| 307–313 | ARIA live region, skip link |
| 315–374 | **Gateway module** HTML |
| 376–587 | **Optimizer module** HTML (step wizard 1–4) |
| 589–926 | **Gap Analyzer module** HTML (modals, filters, metrics, charts, table) |
| 928–1059 | **Onboarding module** HTML (ribbon, Gantt container) |
| 1061–1141 | Global: help FAB, toast, proposal modal, confirm-reset modal |
| 1143–1297 | Help drawer (3 tabs: optimizer / onboarding / gap) |
| 1299–1349 | Script: navigation & module state |
| 1351–1783 | Onboarding logic (Gantt engine, financials) |
| 1785–3359 | Help drawer logic, Optimizer logic (constants, maps, coverage algorithm, import/export) |
| 3361–4095 | Gap Analyzer logic (CSV pipeline, validation, charts, table, export) |

**Module pattern (follow when adding features):** each module owns its HTML section, its globals, and its functions. Cross-module sharing is limited to: `showModule`, `showToast`, help drawer, export dropdown click-away, proposal modal (accessible from both Optimizer and Onboarding headers).

**Navigation:** `showModule(name)` hides all four modules, shows one, announces via ARIA live region. On `optimizer` it invalidates Leaflet maps via `requestAnimationFrame` (never `setTimeout` — layout must settle before measuring). On `onboarding` it lazily initializes the Gantt on first visit.

## 5. Design Decisions

Every notable decision made during development. If you are unsure whether a behavior is intentional, check here first.

### 5.1 Deliberately Added

**Optimizer:**
1. **Hardcoded 32×32 AWS latency matrix** (`matrix`) — pristine ping values, no live measurement. Fast, deterministic, offline-capable. Mirrored/symmetric.
2. **Hardcoded `AWS_PRICE_INDEX`** anchored at `us-east-1 = 1.00x` (Paris 1.10x, Tokyo 1.25x, São Paulo 1.50x, Cape Town 1.30x, etc.). Approximates real AWS pricing tiers without live pricing APIs.
3. **Reverse-engineered global base cost** — `PARIS_DEFAULT_COST = 2674` ÷ `PARIS_INDEX = 1.10` yields the $2,430 "normalized global base." User-entered cell costs are divided by their regional index to derive the base; **Blended** averages all entered cells, **Specific** anchors to one chosen cell. Falls back to the Paris-derived default when no costs are entered.
4. **Realistic Mode as default** — direct Haversine distance × `0.012 ms/km` + infrastructure tier tax (`TIER_TAX = {1:5, 2:20, 3:40, 4:60}` ms) + processing time. The 0.012 factor is grounded in fiber physics: speed of light in glass ≈ 200,000 km/s → 0.005 ms/km one-way → 0.01 ms/km RTT, rounded with last-mile factors. Naive Mode (AWS-region proxy) is the fallback.
5. **Greedy cost-effective coverage algorithm** — SLA is a strict pass/fail gate. Score per region = `estimatedCost ÷ endpointsCovered`; lowest wins; tie-break on more coverage; repeat until nothing more can be covered. Outputs recommended cells, pending coverage, impossible SLAs, total new monthly OPEX.
6. **Latency Explorer** — top-5 candidate cells per uncovered endpoint with full breakdowns (base/distance/infra/proc), existing-cell tags, and cost chips.
7. **Cost breakdown bars** — colored segments (base=blue, dist=amber, infra=violet, proc=pink, total=green) with `title` tooltips for educational transparency.
8. **Click-to-place on map** — snaps clicks to the nearest `worldCities` entry (nearest-city snapping, not freeform placement).
9. **Proper Leaflet teardown** — every map rebuild removes non-tile layers, removes listeners (`off()`), and `remove()`s the instance to prevent memory leaks across step navigation.
10. **Session JSON version "2.0"** with full state round-trip; one-way CSV report export with labeled sections.

**Onboarding:**
11. **4-Hour Ceiling Rule** — all hour inputs snap UP to the nearest multiple of 4 (min 4). "17" → 20. Prevents messy fractions in scoping.
12. **Margin formula** — `Customer Price = Internal Cost ÷ (1 − margin%)`. A 20% margin means price = cost ÷ 0.8. Margin field clamped 0–99.
13. **Generic "Day N" calendar** — Gantt scale renders "Day 0, Day 1…" from a fixed `TIMELINE_START` anchor (2025-01-01); tasks snap to `PROJECT_START` (2025-01-02 = Day 1). Weekends are ignored (pure day counting, `work_time = false`). Deliberately abstracts real-world dates for pristine scoping.
14. **Day-0 anchor** — the timeline renders one empty day (Day 0) before the first task for visual runway.
15. **Link Duration to Cost — unchecked by default** (fixed from previously checked). When checked, resizing a task bar recomputes hours (8h/day, 4h-snapped); when unchecked, duration is a free visual concept and cost stays locked. Re-checking re-syncs all bars to their hours.
16. **Multi-tier state cache** — `tierStates = {1, 2, 3}` silently preserves each scope's tasks/links; switching tiers never loses work (unless the user explicitly confirms a reset).
17. **Project Coordination stretch** — the "Project Coordination" template task auto-stretches to span the whole project by default.
18. **Inline grid editing** — task names and hours are edited directly in Gantt grid cells via injected `<input>` templates (`updateGridText`, `updateGridHours`), not in popup dialogs (`details_on_dblclick = false`).
19. **Import backward compatibility** — v1.0 session JSONs (`ob_tasks`, `ob_newCell`) are detected and migrated to the v2.0 tier-cache format.

**Gap Analyzer:**
20. **Hand-rolled UK validation** with explicit rules (see §9): E.164 `+44`, 11–13 digits total, prefix `1|2|3|7|8`, no all-identical digits, no 5+ ascending digit run anywhere in the number.
21. **Scientific-notation recovery** — Excel renders long numbers as `4.47305E+11`; the parser converts them back to full integers (precision permitting).
22. **Excel `+` stripping recovery** — numbers like `447305409280` (Excel dropped the `+`) are re-prefixed via `/^44\d{9,10}$/`.
23. **Auto column mapping** — keyword matching per field (time→`time/timestamp/date`, to→`to/destination/called`, etc.); dropdowns pre-select on open.
24. **Metrics computed on FILTERED data** — every tile (Total, Signing, Verify, Gap, Gap%, Invalid, Slow >100ms) reflects the current filter state, not the raw dataset.
25. **Drill-down tiles** — clicking a metric card resets all filters, applies the matching filter (signing/verify/invalid/outliers), and smooth-scrolls to the table. Total = plain reset.
26. **Humanized chart labels** — x-axis formatted `Jul 31, 19:00` (UTC), not ISO timestamps. Hourly UTC buckets via `toISOString().slice(0, 13)`.
27. **Stacked volume chart** — separate stacks for Signing and Verify (`stack: 'signing'` / `stack: 'verify'` + `stacked: true`), each internally stacked Valid (blue/green) over Invalid (orange) — lets you read valid vs invalid volume per service in one bar.
28. **Export CSV with metrics summary block** — the export file begins with a summary row (Total, Signing, Verification, Gap, Invalid, Outliers) followed by a blank line and the full data table. Rows are properly quoted/escaped.
29. **Filtered vs All export modal** — export scope chosen at export time via `window.gapExportAllData`.
30. **Disabled-until-loaded header buttons** — Settings and Export start disabled (opacity-50) and only enable after a successful `processGapData`.
31. **Descriptive toasts** — e.g. `"12 records analyzed · 6 signing, 6 verify"` and `"CSV exported · 12 records"` instead of generic confirmations.
32. **9-column aligned table** with native `title` tooltip on UK Valid (custom hover divs clip inside `overflow-hidden` tables).
33. **RFC-4180 single-pass CSV parser** — handles quoted commas, quoted newlines, CRLF, BOM, `""` escape, empty rows, and short-row padding. Returns `{headers, rows, errors, meta}`.
34. **Case-insensitive service classification** — `isSigning`/`isVerify` derived from lowercased service value; display string preserved as-is.
35. **Sort-at-render pattern** — `renderGapTable()` sorts `[...gapFilteredData]` (shallow copy); source array is never mutated.
36. **Shared upload path** — both file picker and drag-and-drop call `readGapFile(file)` then `handleGapCSVUpload(text)`.
37. **Drag-and-drop upload zone** — violet glow feedback on drag, CSV MIME/extension validation, both picker and drop feed into the same parser.

**Global:**
38. **ARIA live region + skip link + module-change announcements** — accessibility built in from the start.
39. **Single shared toast + single help drawer with 3 tabs** — one component instance, reused everywhere.
40. **Client Proposal PDF masks internal margins** — the financial section shows only the customer price; internal cost and blended rate never appear. Invoicing language states 50% kickoff / 50% Go-Live. Marked **BETA** with a warning banner.
41. **3-section proposal toggles** — infra strategy / implementation timeline / financial quote can be included independently; the infra section is generated headlessly (`generateHeadlessAnalysis()`) so it works without visiting the dashboard.
42. **Dark theme only**, single design language (slate-900 surfaces, slate-800 borders, glass panels).

## 6. Code Conventions (required for new code)

- **Style:** 2-space indent, single quotes preferred, semicolons everywhere, no `// comments` unless the user asks (existing code has some; new code should keep them minimal).
- **Function naming:** `renderX()` (build DOM), `updateX()` (recompute numbers/labels), `handleX()` / `onchange="X()"` (events), `openX()` / `closeX()` (modals), `toggleX()` (boolean), `goToStep()` / `tryGoToStep()` (wizard nav).
- **State:** module-level `let` globals prefixed with the module (e.g. `gap*`, `ob_*`). No closures, no classes. Mutate then re-render — there is no reactivity.
- **Element IDs:** descriptive kebab-case; module-scoped prefixes (`gap-*`, `ob-*`, `fp-*`, `cust-*`, `dash-*`, `sla-*`, `cost-*`). New IDs must be unique across the file (old bugs were all ID mismatches between HTML and JS).
- **Inline handlers:** `onclick`/`onchange` attributes call global functions directly (functions must be on `window`; the onboarding module explicitly assigns `window.updateGridHours` etc.).
- **Toast feedback:** every user action that completes or fails should call `showToast(msg, isError?)`.
- **Modal pattern:** hidden by default (`hidden`/`opacity-0 pointer-events-none`), opened by toggling classes (`flex`, `open`); Escape closes the help drawer globally.
- **Numbers:** money formatted with `formatMoney()`/`toLocaleString('en-US')`; percentiles as strings with `toFixed(1)`.
- **Chart lifecycle:** destroy existing Chart.js instances in `gapChartInstances` before creating new ones, or canvases leak renderers.
- **Map lifecycle:** follow the teardown pattern in §5.1.9 — remove non-tile layers, `off()`, `remove()`, null the ref.
- **Tier/prefix constants** must stay in the existing constants blocks (`TIER_TAX`, `AWS_PRICE_INDEX`, `regions`, `worldCities`, `matrix`).

## 7. Module: Cell Placement Optimizer (green)

### Data constants
- `regions[]` — 32+ AWS regions (code, name, city, continent, lat/lng). Index position is the canonical id used across state (`selectedFootprint`, `cellCosts`, `customers[].regionIdx`, maps).
- `matrix` — 32×32 symmetric ping matrix, indexed by region position.
- `worldCities[]` — name, lat/lng, `tier` 1–4 (drives infra tax and T-badges).
- `AWS_PRICE_INDEX`, `PARIS_DEFAULT_COST=2674`, `PARIS_INDEX=1.10`.

### Latency (`getCustomerLatency(cellIdx, customer, withBreakdown)`)
- `customer.regionIdx` present → AWS-type: matrix lookup. `realisticMode` adds infra tax + processing time.
- Otherwise city-type: **Realistic** = Haversine × 0.012 + tier tax + proc; **Naive** = matrix latency to nearest AWS region proxy + proc.
- Returns number, or breakdown object `{base, distance, infra, proc, total, nearestRegionIdx, distanceKm, tier, isDirect}` when `withBreakdown`.

### Cost baseline (step 1 accordion)
- Enter monthly costs per selected cell → tool reverse-engineers global base (§5.1.3). Blended (default) vs Specific (requires ≥1 cost). Baseline summary shows source and math.

### Coverage analysis (step 4)
- `renderDashboard()` — computes covered/uncovered, runs greedy algorithm, renders stats, strategy summary, 3 result lists, Latency Explorer, recommendations, and the map.
- `generateHeadlessAnalysis()` — same math, no DOM; feeds JSON/CSV export and the PDF.
- Dashboard subtitle reflects mode: "Realistic Mode · Coverage Optimization" / "Naive Mode · Coverage Optimization".

### Wizard & state
- `currentStep`/`maxStepReached` gate navigation; step dots show completed/active states; connections turn green as you progress.
- SLA inputs validated in `analyzeCoverage()` (min 1ms SLA, min 0ms processing) with error toasts.
- Import (`handleImport`) restores all globals and re-renders step 1; Export JSON (`exportSessionJSON`, v2.0) / CSV (`exportSessionCSV`).

## 8. Module: Onboarding Calculator (blue)

### Ribbon
- Blended Rate ($/hr, default 100), Desired Margin (% default 20), Deployment Scope (Tier 1/2/3), Link Duration to Cost checkbox (unchecked).
- Financial summary strip: Project Duration (days from PROJECT_START), Total Internal Cost, Customer Price.

### Math
- Hours snapped to multiples of 4 (min 4). `duration = ceil(hours/8)` when linked.
- `Internal Cost = Σhours × rate`; `Customer Price = internal ÷ (1 − margin/100)`.

### Gantt engine
- Lazy init on first module visit; 60-day runway from TIMELINE_START; scale = "Day N"; grid 540px resizable; order-branch drag reordering; 12h time step; no weekend skipping.
- Columns: drag handle, task name (inline text input), Est. Hrs (inline number input), Est. Cost (live), Vis. Days, delete.
- Dependencies: drag end-circle of a bar onto another bar; double-click an arrow to delete; arrows green; tooltip shows Billed Effort vs Visual Days.
- `saveActiveState()` snapshots the active tier into `tierStates[currentScope]` — called on every structural/grid change.
- `handleScopeChange` quietly saves current tier, then loads or generates the new tier's state.
- Reset Timeline → confirm modal → `confirmScopeChange()` regenerates defaults for the current tier (destructive).
- `updateGridHours` / `updateGridText` / `deleteObTask` / `addObTask` are exposed on `window` for inline grid inputs.
- Financial recompute: `updateOnboardingFinancials()` — total hours, max end date, internal cost, customer price.

### Templates
- **Tier 1 (Full Deployment):** 9 tasks — Provision Near-Prem Cell (40h) → Core Network Config (24h) → Central-Cell Sync (32h) → API Handshake (16h) + Firewall & Security (32h) → Load Testing & QA (16h) → Training (16h) → Go-Live Cutover & Hypercare (16h); Project Coordination (40h, spans all).
- **Tier 2 (Integration Only):** same minus Provision (8 tasks, Coordination 24h).
- **Tier 3 (Standard Onboarding):** QA → Training → Cutover → Coordination (16h each).

### Export/Import
- JSON v2.0: rate, margin, link flag, currentScope, full tierStates. Import migrates v1.0 (`ob_tasks`, `ob_newCell`).
- CSV: financial summary for the active tier + full 3-tier task schedule.

## 9. Module: Gap Analyzer (violet)

### Pipeline
1. `handleGapCSVUpload` or drag-and-drop → calls `readGapFile(file)` → `parseGapCSV(text)` (single-pass state machine: BOM strip, quoted commas/newlines, CRLF, empty rows, short-row padding). Returns `{headers, rows, errors, meta}`.
2. `openGapSettings(headers)` — 8 mapping dropdowns (time, service, from, to, status, customer, sourceIP, processingTime) with keyword auto-detection. Required: time, service, to.
3. `confirmGapColumnMapping` → `processGapData()` (try/catch wrapped): normalize phone numbers, validate UK numbers, derive `isSigning`/`isVerify` via `svc.includes("signing"/"verify")` on lowercased value (display string preserved), populate filter dropdowns, metrics, table, charts; enable Settings/Export buttons; hide upload prompt; show descriptive summary toast.
4. Filters — service, UK validation, from/to substring, status, customer, source IP substring, proc min/max. Metrics/table recompute from `gapFilteredData`.
5. `drillDownGap(type)` — reset all filters then apply one; `total` = pure reset.

### UK validation (exact rules — do not change without user sign-off)
- `normalizePhoneNumber(value)`: `E+` scientific → full integer; `/^44\d{9,10}$/` → prepend `+`; strip spaces/dashes/parens.
- `validateUKNumber(number)` returns `{valid, reason}`:
  1. Empty → invalid.
  2. Must start `+44` (after whitespace strip).
  3. Total digit count (including `44`) must be 11–13.
  4. Digits after `44` must not all be identical.
  5. No run of **5+ consecutive ascending digits** anywhere after `44` (e.g. `+447123456789`, and mid-number runs like `7700123456`).
  6. First digit after `44` must be one of `1, 2, 3, 7, 8`.
- `from` numbers are normalized but never validated (they are assumed to be internal/valid).
- Per-row results: `ukValid` (bool) + `ukValidationReason` (string). Rendered as green "Valid" / red "Invalid" pill.

### Charts (all hourly-bucketed, UTC, destroyed/rebuilt per render)
1. Gaps Over Time — red line (|signing − verify| per hour).
2. Invalid Numbers Over Time — amber line (invalidTotal = signingInvalid + verifyInvalid).
3. Signing vs Verification Volume — stacked bar, 4 datasets, 2 stacks.
4. Processing Time Distribution — violet line (per-hour average) with a 100ms dashed threshold annotation (plugin loaded).

### Table & export
- 9 sortable columns; default sort time desc; pagination 25/50/100 (default 25).
- Export: modal (Filtered/All) → CSV with metrics summary block + quoted data rows; filename `gap_analyzer_export_YYYY-MM-DD.csv`.

## 10. Global Components

- **Help drawer:** 3 tabs; each has TOC chips + sections; `scrollToSection(id)` requires matching section `id`s. Opened per-module via `openHelp('optimizer'|'onboarding'|'gap')`; the FAB opens the current module's tab.
- **Toast:** single element `#toast-msg`, 3s auto-hide, success/error icon.
- **Proposal modal (BETA):** client name, prepared by, date, project title, 3 include toggles → `buildAndDownloadPDF()` (html2pdf, letter portrait). Uses `generateHeadlessAnalysis()` + active Gantt tier state. Internal margins masked by design.
- **Confirm modal:** amber warning; used for timeline reset.
- **Export dropdowns:** two instances (`export-menu`, `export-menu-onb`) closed by click-away handler.
- **Escape key** closes the help drawer.

## 11. Audit Trail — Substantive Changes Made

### Critical fixes (app was broken)
- **Chart.js CDN missing** — added `chart.js@4.4.1`; gap charts were silently failing.
- **`processGapData` crash** — the Invalid Numbers chart referenced a variable renamed when the volume chart split into signing/verify datasets; added `invalidTotal`.
- **Function name mismatches** — 7 `sortGapTable()` → `handleGapSort`; 2 `changeGapPage()` → `handleGapPagination`.
- **Pagination element IDs** — JS `gap-pagination-prev/next` vs HTML `gap-prev-btn/next-btn`; aligned JS to HTML.
- **`row.serviceType` → `row.service`** — service column rendered undefined.

### UK validation rewrite
- Scientific notation recovery; Excel `+`-strip recovery; `slice(3)` → `slice(2)` bug; sequential-run detection rewritten to scan the entire number (caught `+447123456789` and `7700123456`).

### Table & UI
- 9-column alignment; native tooltip for UK Valid; responsive 3-card gateway; humanized chart labels; stacked volume chart; export simplified to CSV-only with metrics summary; Gap footer added; Settings/Export disabled until data loads; descriptive toasts; column auto-detection; `drillDownGap` reset-first behavior; export field names fixed.

### Anomaly detection removed (user decision — latest change)
- Deleted `detectGapAnomalies()`, `gapAnomalies`, the Anomalies tile, the anomalies panel, `toggleGapAnomaliesDetails()`, the help section, and all text references. Six tiles + Gap Percentage remain.

### Phase 1 Hardening (T1–T7)
- **T1: RFC-4180 CSV parser** — replaced `text.split("\n")` + `text.split(",")` with a single-pass state machine (`parseGapCSV`): BOM stripping, quoted commas, quoted newlines, CRLF, `""` escape, empty/short-row padding. Shared `readGapFile(file)` for both picker and drag-drop. Empty/header-only/zero-data error toasts added.
- **T2: Case-insensitive service classification** — `processGapData()` now uses `const svc = (row.service || '').toLowerCase()` for `isSigning`/`isVerify`; `row.service` unchanged for display. Fixes `Signing`, `VERIFY`, mixed-case values.
- **T3: chartjs-plugin-annotation@3.0.1** — CDN added after Chart.js script tag. 100ms dashed threshold line now renders.
- **T4: Remove duplicate toast** — deleted second `showToast("Data analyzed successfully!")`; only descriptive summary toast remains.
- **T5: Non-mutating sort** — `renderGapTable()` sorts `[...gapFilteredData]` (shallow copy) instead of mutating `gapFilteredData` in place.
- **T6: Drag-and-drop upload** — upload zone accepts drag-and-drop with violet glow visual feedback. Both picker and drop call `readGapFile()` → `handleGapCSVUpload()`. CSV MIME/extension validation added.
- **T7: Skip link fix** — `showModule()` assigns `id="main-content"` on the active module element and removes it from others. All module roots have `tabindex="-1"`. `role="main"` removed from gateway.

## 12. Known Limitations & Gotchas

- **Gantt dates are hardcoded 2025 anchors** — "Day N" is generic, but exported JSON carries 2025 start dates; fine for scoping, wrong for real scheduling.
- **Anomaly leftovers:** `row.anomalyFlags` may exist in pre-removal exported JSONs; harmless, ignored by current code.
- **No tests, no lint config** — verification is manual in-browser; the file must stay a single HTML (open directly, no server needed).
- **Help drawer `scrollToSection`** depends on TOC links matching section `id`s; keep them in sync when editing help content.

## 13. Quick Recipes (common extension tasks)

- **Add a metric tile to Gap Analyzer:** add a card div in the metrics grid (lines ~762–841) with a `gap-metric-*` id, compute it in `updateGapMetrics()`, and (optionally) extend `drillDownGap()`.
- **Add a filter:** add a control in the filters grid, read it in `applyGapFilters()`, reset it in `resetGapFilters()`.
- **Add a chart:** add a `<canvas>` wrapper div (fixed height 200px required), create the Chart instance in `renderGapCharts()`, destroy via `gapChartInstances`.
- **Add a new module:** copy the module HTML block + header pattern, register in `showModule()`, add a gateway card, add a help tab, extend `openHelpDefault()` mapping, and update this document's file map.
- **Change UK rules:** edit `validateUKNumber()` only — rules are centralized there.
- **Change pricing:** edit `AWS_PRICE_INDEX` / `PARIS_DEFAULT_COST`; the baseline system recomputes automatically.
