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
2. **Endpoint Locations** — add endpoints from two searchable tabs: **AWS Regions** or **World Cities** (with T1–T4 tier badges). Centralized `tryAddEndpoint()` helper with dedup guard (identity: `r{regionIdx}` for AWS, `c{name}` for cities; duplicate → toast, no add). **Click to Place on Map** mode snaps clicks to the nearest world city; exitable via toggle, **Escape** key, or **"Done placing"** button. Endpoints list shows count, coords, per-row delete, and **keyboard delete** (focus row + Delete/Backspace key removes endpoint with toast).
3. **SLA Configuration** — pick **Latency Estimation Model** (Realistic Mode default: direct distance + infra tax; Naive Mode: AWS proxy) and **SLA Mode** (one Global threshold, default 150ms, or a custom per-endpoint SLA with live latency previews per endpoint). **Safety Margin** (default 20ms) sets the minimum headroom between latency and SLA for new cell eligibility; set to 0 for legacy pass/fail. Internal processing time (default 10ms) adds to every latency estimate.
4. **Coverage Analysis** — the dashboard: 6 stat cards (Total Endpoints, Already Covered, Pending Coverage, Marginal Headroom, New Cells Needed, Est. Monthly OPEX); an optimization summary with average served latency, min headroom, and marginal relaxation hint; a coverage map (covered/pending/marginal/impossible markers, recommended markers with cost chips and dashed connection lines); four result lists (Already Covered with marginalExisting flags, Pending Coverage, Marginal Headroom with relaxation hints, Impossible SLA); **Latency Explorer** (top-5 candidate cells per uncovered endpoint with full latency breakdowns and cost chips); and **Recommended New Cells** cards (cell, tier tag, cost, covered count, min/avg headroom, per-endpoint headroom + breakdowns). Edge states handled: all covered → success message; nothing coverable → "Impossible SLA" message.

Additional features: session JSON import/export, CSV report export, client proposal PDF, back/start-over navigation, step indicator with completed-state tracking. **Green-Plan what-if** (`computeGreenPlan(input)`, pure, on `window`) calculates the SLA relaxation needed to make all endpoints green (global mode: one relaxed SLA; per-endpoint mode: each endpoint gets exact relaxation). Dashboard section "What-if: Make Everything Green" with toggle. **Marginal Upgrade Plan** — sliding switch on Marginal Headroom card header (default OFF, session-only). Toggling ON runs a parallel `computeCoverage()` with `safetyFloor=0` and renders an upgrade panel showing: added cells + cost delta, and per-marginal-endpoint "covered by <cell>" or "requires +Xms SLA relaxation". Read-only what-if; never mutates primary analysis; exports stay strict. **Saved Scenarios** (localStorage `atlas-opt-scenarios`, per-machine): save/load/delete analysis configurations with summary stats. **Share Report** (`exportShareReport()`): standalone HTML blob download with inline CSS, embedding all dashboard data; openable anywhere, no CDN refs.

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

- **CSV upload & column mapping** — upload a CSV; a modal maps 8 fields (Time, Service, From, To, Status, Customer, Source IP, Processing Time) with **keyword auto-detection** (pre-filled when headers match); time/service/to are required. **Pairing key** dropdowns render horizontally with muted `+` separators; default is From + To, expandable to 4 components via "+ Add pairing component". **Additional columns** render in a two-column grid of self-contained bordered units (header dropdown + display name input each). Upload area includes a **privacy note** ("Private by design — your call data is processed entirely in this browser and never sent to a server.").
- **UK number validation** — every destination number is normalized (scientific notation and Excel `+`-stripping recovered) and validated against E.164 structural rules; results surfaced as a per-row Valid/Invalid pill plus an **Invalid UK Numbers** metric.
- **Call Pairing** — heuristic per-call matching: signing → verification on `(from, to)` key within a directional time window (default 1000ms, configurable in Settings). First-in-wins (FIFO) algorithm. Panel shows match rate, unverified/unsigned counts, time-to-verify median + P95, and invalid cross-tabs. Global (whole dataset, not filtered).
- **Dashboard metrics (7 tiles)** — Total Records, Signing Requests, Verification Requests, Gap Count (signed: `signing − verify`), Gap Percentage, Invalid UK Numbers, Slow Requests (>100ms, configurable). Tiles are **click-to-drill-down**. Below the tiles: **Call Pairing** panel + **Invalid UK Numbers breakdown** panel with clickable reason chips.
- **Configurable thresholds** — Settings modal: processing-time threshold (default 100ms) and pairing window (default 1000ms). Both live-update on change.
- **Filters** — service type, UK validation status, from/to substring search, status code, customer, source IP substring, processing-time min/max, and **pair status** (Paired / Signed not verified / Verified not signed / Unpairable); one-click **Reset All**. Chart drill-through sets a **bucket filter**.
- **3 visualizations** (Chart.js, smart auto-bucketed UTC, humanized labels): Invalid Numbers Over Time, Signing vs Verification Volume, Processing Time Distribution. All charts are **clickable** for drill-through. Per-chart **Time Bucket** dropdowns (Auto / 1 Min / 5 Min / 1 Hour / 1 Day) in each chart card header — each chart buckets independently.
- **TTV chart** — 4th chart: Time to Verify with dual-line (median cyan, P95 pink dashed). Per-chart bucket dropdown.
- **Data table** — 10 sortable columns (including Pair Status), pagination (25/50/100 per page), showing/indicator controls. Paired pills display pair ID (e.g. `P3 · Paired`). Hover a row to cross-highlight its partner (violet ring) and dim others; off-page partners noted in tooltip. **Group by pair** sliding switch groups rows by pair for contiguous rendering with luminance zebra banding. Page-size label switches to "Groups per page" when grouped. Per-column `min-width` styles with `whitespace-nowrap` for stable column widths.
- **Export** — modal with **Filtered** vs **All** scope; CSV includes metrics summary, invalid-reason breakdown, pairing summary, and full data rows with pair status/ID/time-to-verify columns.

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

`index.html` (~5,218 lines) is organized in this order:

| Lines (approx) | Content |
|---|---|
| 1–305 | Head: CDN links, `<style>` block (all custom CSS classes) |
| 307–313 | ARIA live region, skip link |
| 315–374 | **Gateway module** HTML |
| 376–587 | **Optimizer module** HTML (step wizard 1–4) |
| 589–926 | **Gap Analyzer module** HTML (modals, filters, metrics, charts, table, breakdown panel) |
| 935–1066 | **Onboarding module** HTML (ribbon, Gantt container) |
| 1068–1148 | Global: help FAB, toast, proposal modal, confirm-reset modal |
| 1241–1303 | Help drawer (3 tabs: optimizer / onboarding / gap) |
| 1306–1356 | Script: navigation & module state |
| 1358–1790 | Onboarding logic (Gantt engine, financials) |
| 1792–3366 | Help drawer logic, Optimizer logic (constants, maps, `computeCoverage`, coverage algorithm, import/export) |
| 3368–4203 | Gap Analyzer logic (CSV pipeline, validation, charts, table, export) |
| — | `playwright.config.js` — Playwright e2e config (projects: gap, optimizer) |
| — | `fixtures/` — test CSV data files |
| — | `fixtures/gap-core.csv` — core gap analyzer test data (11 rows) |
| — | `fixtures/gap-dup.csv` — duplicate detection test data |
| — | `fixtures/gap-pairing.csv` — event pairing test data |
| — | `fixtures/gap-pairing-chart.csv` — pairing chart test data |
| — | `fixtures/gap-invalid-only.csv` — invalid-only test data |
| — | `fixtures/gap-phase1.csv` — phase 1 test data |
| — | `fixtures/gap-phase6.csv` — phase 6 flexibility test data |
| — | `e2e/gap/helpers.js` — gap test helpers (openGapAnalyzer, uploadAndAnalyze, tileText) |
| — | `e2e/gap/gap-core.spec.js` — core gap analyzer specs (P2.3–P2.6, 5 specs) |
| — | `e2e/gap/gap-dup.spec.js` — duplicate detection specs (5 specs) |
| — | `e2e/gap/gap-pairing.spec.js` — pairing chart + tile specs (2 specs) |
| — | `e2e/gap/gap-pairing-fifo.spec.js` — FIFO pairing / event pairing specs (6 specs) |
| — | `e2e/gap/gap-layout.spec.js` — layout + pair legibility + banding specs (9 specs) |
| — | `e2e/gap/gap-charts.spec.js` — time-series + per-chart bucket specs (9 specs) |
| — | `e2e/gap/gap-flexibility.spec.js` — data flexibility + Phase 6B UX hardening specs (14 specs) |
| — | `e2e/optimizer/opt-coverage.spec.js` — Optimizer coverage-first objective specs (15 specs) |
| — | `e2e/optimizer/opt-ux.spec.js` — Optimizer UX hardening specs (9 specs) |

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
5. **Coverage-first algorithm with SLA safety floor** — eligibility gate: a (region, endpoint) pair is eligible iff `headroom = SLA − latency ≥ safetyFloor` (default 20ms; 0 = legacy pass/fail). Selection priority: MAX endpoints covered (breadth first), tie-break MAX min-headroom, tie-break MIN region cost. Existing cells still cover endpoints below the floor (flagged `marginalExisting`) but are not re-recommended. Endpoints with no eligible region but passing below the floor go to a `marginal` bucket with relaxation hints. Pure function `computeCoverage(input)` used by both `renderDashboard()` and `generateHeadlessAnalysis()` — exposed on `window` for testing. Outputs recommended cells, pending coverage, marginal SLAs, impossible SLAs, headroom stats, total new monthly OPEX.
6. **Latency Explorer** — top-5 candidate cells per uncovered endpoint with full breakdowns (base/distance/infra/proc), existing-cell tags, and cost chips.
7. **Cost breakdown bars** — colored segments (base=blue, dist=amber, infra=violet, proc=pink, total=green) with `title` tooltips for educational transparency.
8. **Click-to-place on map** — snaps clicks to the nearest `worldCities` entry (nearest-city snapping, not freeform placement).
9. **Proper Leaflet teardown** — every map rebuild removes non-tile layers, removes listeners (`off()`), and `remove()`s the instance to prevent memory leaks across step navigation.
10. **Session JSON version "2.1"** with full state round-trip (includes `safetyFloor`); one-way CSV report export with labeled sections including headroom columns and marginal bucket.
11. **Centralized `tryAddEndpoint(candidate)`** — single entry point for all three add paths (AWS Regions, World Cities, click-to-place). Dedup identity: `r{regionIdx}` for AWS regions, `c{name}` for world cities (including snapped cities from click-to-place). On duplicate → `showToast('Endpoint already added', true)`, no mutation. Returns boolean.
12. **Click-to-place exit paths** — three ways to exit: toggle button again, **Escape** key (document-level listener, scoped to step 2 via `custMapEscHandler`), or **"Done placing"** button (visible only while placement mode is active). All clear cursor, hide Done button, and refresh map.
13. **Coverage map cost chips** — recommended cell markers use `createRecommendedIconWithCost(cost)` rendering a `~$N/mo` label above the blue diamond icon. Existing/covered markers unchanged.
14. **Marginal map markers** — marginal endpoints appear on the coverage map as yellow circles with `!` exclamation marks via `createExclamationIcon(color)` (L.divIcon with HTML/CSS). Popup shows endpoint name, best headroom, and relaxation needed. Passed from `renderDashboard()` to `initDashMap()` as 5th arg.
15. **Leaflet double-rAF invalidation** — `showModule('optimizer')` uses nested `requestAnimationFrame(() => requestAnimationFrame(() => map.invalidateSize()))` to ensure full layout settlement before measuring map dimensions.
15. **Keyboard delete on endpoint rows** — each `.customer-row` gets `tabindex="0"` and `onkeydown="handleCustKeydown(event, i)"`. Delete/Backspace removes the endpoint with `showToast` confirmation. Guard: does not fire when focus is inside an `<input>`.
16. **Baseline clarity strings** — `updateBaselineSummary()` shows: "Paris-derived default (no costs entered)" / "Blended average of N entered cell(s)" / "Anchored to {name}". Tooltip on the "Normalized Global Base Cost (1.0x)" label explains the 1.0x convention.
17. **Session JSON `customers[].sla`** — export includes per-endpoint SLA on each customer object. Import restores `perCustomerSLA` from `customers[].sla` when `perCustomerSLA` is missing (backward compat with v2.0).

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
24. **Metrics computed on FILTERED data** — every tile (Total, Signing, Verify, Gap, Gap%, Invalid, Slow) reflects the current filter state, not the raw dataset. When filters are active, a filtered-view strip shows global (unfiltered) counts.
25. **Drill-down tiles** — clicking a metric card resets all filters, applies the matching filter (signing/verify/invalid/outliers), and smooth-scrolls to the table. Total = plain reset. Also clears `gapInvalidReason` and `gapBucketFilter`.
26. **Humanized chart labels** — x-axis formatted `Jul 31, 19:00` (UTC), not ISO timestamps. Hourly UTC buckets via `toISOString().slice(0, 13)`.
27. **Stacked volume chart** — separate stacks for Signing and Verify (`stack: 'signing'` / `stack: 'verify'` + `stacked: true`), each internally stacked Valid (blue/green) over Invalid (orange) — lets you read valid vs invalid volume per service in one bar.
28. **Export CSV with metrics summary block** — the export file begins with a summary row (Total, Signing, Verification, Gap, Invalid, Outliers) followed by a blank line and the full data table. Rows are properly quoted/escaped.
29. **Filtered vs All export modal** — export scope chosen at export time via `window.gapExportAllData`.
30. **Disabled-until-loaded header buttons** — Settings and Export start disabled (opacity-50) and only enable after a successful `processGapData`.
31. **Descriptive toasts** — e.g. `"12 records analyzed · 6 signing, 6 verify"` and `"CSV exported · 12 records"` instead of generic confirmations.
32. **9-column aligned table** with native `title` tooltip on UK Valid (custom hover divs clip inside `overflow-hidden` tables).
33. **RFC-4180 single-pass CSV parser** — handles quoted commas, quoted newlines, CRLF, BOM, `""` escape, empty rows, and short-row padding. Returns `{headers, rows, errors, meta}`.
34. **Case-insensitive service classification** — `isSigning` derived via `svc.includes('sign')` (matches "sign", "signing", "SIGN", etc.), `isVerify` via `svc.includes('verif')` (stem match covers verify/verification/verified); display string preserved as-is.
35. **Sort-at-render pattern** — `renderGapTable()` sorts `[...gapFilteredData]` (shallow copy); source array is never mutated.
36. **Shared upload path** — both file picker and drag-and-drop call `readGapFile(file)` then `handleGapCSVUpload(text)`.
37. **Drag-and-drop upload zone** — violet glow feedback on drag, CSV MIME/extension validation, both picker and drop feed into the same parser.
38. **Timestamp parse guard** — `processGapData()` parses each row's time into `row.timestamp` (ms epoch) + `row.timeValid` flag. Pure 10-digit string → epoch seconds (×1000); pure 13-digit string → epoch ms; otherwise `new Date()`. Rows with invalid timestamps remain in `gapFilteredData` (count in tiles, appear in table with amber icon). In charts, invalid-time rows are assigned to an explicit **"Unknown"** bucket (always last), never excluded — chart bucket totals must equal tile totals. Invalid timestamps always sort to the bottom of the table regardless of sort direction.
39. **Signed directional gap (pairing-derived)** — Gap Count tile shows signed value derived from pairing engine: `signedGap = unverified − unsigned` (positive → "+N net · signed but not verified" (red), negative → "−N net · verified but not signed" (amber), zero → "balanced"). Gaps Over Time chart bar values are also `unverified − unsigned` per hourly bucket. Red bars above zero, amber below, with a dashed slate zero baseline via the annotation plugin. Tooltip uses directional labels via `plugins.tooltip.callbacks.label`. Subtitle: "Derived from pairing engine".
40. **Invalid-reason breakdown panel** — full-width slim panel below the metrics grid, visible only when filtered invalid count > 0. Shows clickable chips (e.g. `sequential run ×3`) derived from `gapReasonBucket()` — a display-layer keyword mapping over existing `ukValidationReason` strings. Chips set `gapInvalidReason` global + UK-validation filter to "Invalid"; clicking active chip clears. `resetGapFilters()` and manual validation-dropdown changes also clear it.
41. **Epoch 10/13-digit handling** — EDR exports sometimes emit epoch seconds (10 digits) or epoch milliseconds (13 digits). Both are detected by regex and converted to ms timestamps, avoiding `new Date(numericString)` ambiguity.
42. **Smart Auto-Bucketing** — charts dynamically select bucket interval based on data time range: ≤1h → 1min, ≤6h → 5min, ≤3d → 1hour, >3d → 1day. User can override via Time Bucket dropdown (Auto/1Min/5Min/1Hour/1Day). `row.bucketKey` is no longer stored on each row; computed dynamically in `applyGapFilters()` and `renderGapCharts()` using `getGapBucketKey(timestamp, interval)`. Changing interval clears any active bucket filter.
43. **Invalid timestamps excluded from time-series charts** — rows with `timeValid === false` are excluded from chart data entirely. They still count in metric tiles and appear in the data table with an amber warning icon. The "Unknown" bucket has been removed. This makes charts cleaner and focuses on actionable time-series data.

**Global:**
42. **ARIA live region + skip link + module-change announcements** — accessibility built in from the start.
43. **Single shared toast + single help drawer with 3 tabs** — one component instance, reused everywhere.
44. **Client Proposal PDF masks internal margins** — the financial section shows only the customer price; internal cost and blended rate never appear. Invoicing language states 50% kickoff / 50% Go-Live. Marked **BETA** with a warning banner.
45. **3-section proposal toggles** — infra strategy / implementation timeline / financial quote can be included independently; the infra section is generated headlessly (`generateHeadlessAnalysis()`) so it works without visiting the dashboard.
46. **Dark theme only**, single design language (slate-900 surfaces, slate-800 borders, glass panels).

**Phase 2B:**
47. **Privacy messaging on upload** — a `fa-shield-halved` line appears below the upload drop-zone: "Private by design — your call data is processed entirely in this browser and never sent to a server." Addresses data-sensitivity concerns without adding complexity.
48. **Filtered-view indicator** — when any filter is active, a slim strip appears above the metrics grid showing global (unfiltered) values as "N of M" with tooltips, plus a Reset Filters button. Metrics tiles, charts, and table continue to show filtered values. Global values are computed in `updateGapMetrics()` by counting against `gapData` (full dataset) when `isFiltered` is true.
49. **Configurable slow threshold** — `gapSlowThreshold` global (default 100) set via a number input in the Settings modal. `handleGapThresholdChange()` updates the tile label, Processing Time chart annotation (`yMin`/`yMax`), `suggestedMax`, and re-renders all data. Annotation label dynamically shows `"{threshold}ms Threshold"`. `drillDownGap('outliers')` uses `gapSlowThreshold` for `procMin` (not hardcoded).
50. **Chart → table drill-through** — each of the four charts has `onClick: makeChartClickHandler(chartType)` which sets `gapBucketFilterSource` to the chart type and resolves the clicked x-index to a time bucket key via `gapChartBucketOrders[chartType][idx]`. `toggleGapBucket(key)` sets/clears `gapBucketFilter`; `applyGapFilters()` resolves interval from `gapBucketIntervals[gapBucketFilterSource]`; a removable chip in the filter bar shows the active bucket. `resetGapFilters()`, `drillDownGap()`, and `resetGapMetrics()` clear the bucket filter and source.
51. **`gapBucketIntervals` per-chart state** — `{ invalid: 'auto', volume: 'auto', proc: 'auto', ttv: 'auto' }`. Each chart has its own dropdown (`gap-bucket-interval-invalid|volume|proc|ttv`). Changing a dropdown calls `handleChartBucketIntervalChange(chartType, val)` → `renderSingleChart(chartType)`. If the filter source chart's interval changes, the bucket filter is cleared.

**Phase 3:**
52. **First-in-wins (FIFO) pairing** — no correlation ID in EDR, so pairing is heuristic: match verification to signing on `(from, to)` key within a directional time window. Stream is sorted by timestamp (signings before verifications at equal timestamps); each verification pairs with the earliest (oldest) unmatched signing with the same key if within `gapPairWindow`. Signings older than the window are evicted from the queue and marked `unverified`. After pairing, any unverified signing that has a paired signing with the same key is reclassified as `pairStatus = 'duplicate'` (superseded retry). Rationale: order-preserving matching recovers true pairs in dense same-key bursts (H10).
53. **Pairing window default 1000ms** — each operation has a 100ms SLA; typical signing→verification handoff is under 500ms (PM domain input). Window covers P99 tail of the handoff distribution (queueing spikes and retries create right-skew). False-pair risk at 1000ms is negligible (same caller + same destination recurs within 1s only in retry storms). The pairing panel's time-to-verify median + P95 is the calibration instrument; the PM will set the production default from observed P99 on real exports. **Calibration result (real EDR data, 41 calls / 82 events):** 1000ms pairs 100% of call outcomes; 500ms pairs only 49.1%. The 500ms misses are a timestamp-resolution artifact — events logged at whole-second granularity, so cross-tick pairs show an apparent 1000ms gap (median time-to-verify 0ms, p95 1000ms). Therefore 1000ms is the minimum usable window with this data and is confirmed as the production default; sub-second latency is not observable from second-resolution EDR timestamps.
54. **Global pairing panel** — computed from `gapData` (full dataset), not `gapFilteredData`. A signing and its verification may be in different filter buckets. Panel does not recompute on filter changes. Documented exception to §5.24 (metrics on filtered data).
55. **Unpairable rows** — rows with `timeValid === false` that are signing or verify are marked `pairStatus = 'unpairable'`. They cannot participate in pairing (no timestamp to compare).
56. **Pair Status filter** — dropdown in the filter bar with options: Paired, Signed not verified, Verified not signed, Duplicates, Unpairable. `applyGapFilters()` checks `pairFilter`. `resetGapFilters()` and `drillDownGap()` clear it. `drillDownPair(status)` sets the filter directly.
57. **Median convention** — `timeToVerifyMedian` uses the upper-middle value for even-count samples (e.g. `[400,500,600,1500]` → `600`, not `550`). This is the "ceil" median, not the standard statistical median (average of the two middle values). Chosen because verification times are discrete integer milliseconds; the upper-middle avoids averaging a near-miss outlier into the median.
58. **Group-by-pair** — a render-layer over `gapFilteredData`. Toggled by a switch in the table header. When on, rows are grouped by pair ID (paired rows share a group, orphans are solo). Groups are paginated (page size applies to groups, not rows); indicator reads `A–B of G groups (R rows)`. The page-size label switches from "Rows per page" to "Groups per page" (with tooltip explaining what a group is). Sorting while grouped sorts groups by the representative row's column value (representative = signing row if present, else first row). Toggling resets `gapCurrentPage = 1`.
59. **Banding (luminance zebra + seams)** — Groups alternate between transparent and `rgba(148,163,184,0.05)` (`gap-group-alt` class). Each group's first row (except the very first) gets a seam (`border-top: 1px solid rgba(71,85,85,0.55)` via `gap-group-seam`). No coloured spines — row banding alone provides structure. Banding is presentation-only; export unchanged.
60. **Group-by-pair switch** — visually-hidden checkbox (`sr-only`, never visible) driving a styled track+knob (`gap-switch-track` + `::after` pseudo-element). Knob slides via `translateX(16px)` on `:checked`; track turns violet. Focus-visible ring on keyboard tab. Native checkbox never rendered as a visible control.
60. **Hover cross-highlight** — event delegation on `tbody` using `mouseover`/`mouseout`. Hovering a paired row adds `gap-pair-highlight` to its partner and `gap-pair-dim` to all other rows. If the partner is not on the current page, no dim is applied; the pill tooltip shows `(partner on page N)`. Orphan rows do nothing on hover.

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
- Enter monthly costs per selected cell → tool reverse-engineers global base (§5.1.3). Blended (default) vs Specific (requires ≥1 cost). Baseline summary: "Paris-derived default (no costs entered)" / "Blended average of N entered cell(s)" / "Anchored to {name}". Tooltip on "Normalized Global Base Cost (1.0x)" label explains 1.0x convention.

### Coverage analysis (step 4)
- `computeCoverage(input)` — pure function (no DOM access) computing the full coverage analysis: covered/uncovered/marginal/impossible classification, greedy selection with headroom-based scoring, headroom stats. Takes `{customers, slaMode, globalSLA, perCustomerSLA, safetyFloor, selectedFootprint, getLatency}`. Exposed on `window` for testing.
- `renderDashboard()` — calls `computeCoverage()`, renders stats, strategy summary (with headroom + marginal hint), 4 result lists (covered with marginalExisting, pending, marginal with relaxation, impossible), Latency Explorer, recommendations (with headroom), and the map. Marginal endpoints are rendered on the map with yellow exclamation icons.
- `generateHeadlessAnalysis()` — calls `computeCoverage()`, returns structured data for JSON/CSV/PDF exports. Includes per-cell min/avg headroom, marginal SLAs, safetyFloor in summary.
- Dashboard subtitle reflects mode: "Realistic Mode · Coverage Optimization" / "Naive Mode · Coverage Optimization".
- `computeGreenPlan(input)` — pure function, on `window`. Takes same input as `computeCoverage`. Computes per-endpoint `relaxationNeeded` (marginal: `safetyFloor - bestHeadroom`; impossible: `bestPossibleLatency + safetyFloor - SLA`; covered: 0), `globalRelaxation = max(relaxationNeeded)`, `relaxedSLA = globalSLA + globalRelaxation`. Re-runs `computeCoverage` with relaxed SLA. Returns `{globalRelaxation, relaxedSLA, perEndpoint[], mode, relaxedResult, relaxedOPEX, deltaOPEX, relaxedMarginal, relaxedImpossible}`. UI: dashboard section with toggle (global vs per-endpoint).
- `getOptScenarios()` / `saveOptScenario(name)` / `loadOptScenario(index)` / `deleteOptScenario(index)` — localStorage key `atlas-opt-scenarios`. Stores `{name, ts, customers, slaMode, globalSLA, perCustomerSLA, safetyFloor, selectedFootprint, cellCosts, baselineMode, specificBaselineIdx, processingTime, realisticMode, summary}`. Per-machine only.
- `exportShareReport()` — standalone HTML blob download with inline CSS. Embeds endpoints table, covered/marginal/impossible lists, recommended cells + costs, headroom stats. No CDN refs.
- Test compatibility bridge: module-scope `let` variables exposed via `Object.defineProperty` on `window` with `_` prefix (e.g., `_customers`, `_globalSLA`, `_selectedFootprint`). Also `window._regions` and `window._AWS_PRICE_INDEX` for direct access.

### Wizard & state
- `currentStep`/`maxStepReached` gate navigation; step dots show completed/active states; connections turn green as you progress.
- SLA inputs validated in `analyzeCoverage()` (min 1ms SLA, min 0ms processing, min 0ms safety floor) with error toasts.
- Import (`handleImport`) restores all globals including `safetyFloor` and `perCustomerSLA` (from `customers[].sla` fallback) and re-renders step 1; Export JSON (`exportSessionJSON`, v2.1 with `customers[].sla`) / CSV (`exportSessionCSV` with headroom columns and marginal section).
- Endpoint management via `tryAddEndpoint(candidate)` with dedup guard (§5.1.11). Keyboard delete on endpoint rows (§5.1.15). Click-to-place exit via toggle/Escape/Done button (§5.1.12).

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
2. `openGapSettings(headers)` — 8 mapping dropdowns (time, service, from, to, status, customer, sourceIP, processingTime) with keyword auto-detection. Required: time, service, to. Fields rendered in a **4-column grid** (`grid-cols-2 sm:grid-cols-4`) with compact `text-xs` styling and `pr-8` for native chevron spacing. Also includes processing-time threshold and pairing window inputs. **Pairing Key** section (horizontal flex-wrap with muted `+` separators between dropdowns; X button above each dropdown top-right; removable down to 1 component, add up to 4 via "+ Add pairing component").
3. `confirmGapColumnMapping` → `processGapData()` (try/catch wrapped): parse timestamps into `row.timestamp`/`row.timeValid`, normalize phone numbers, validate UK numbers, derive `isSigning`/`isVerify` via `svc.includes("signing"/"verif")` on lowercased value (display string preserved), run `pairGapCalls()` (assigns `row.pairStatus`, `row.pairId`, `row.timeToVerify`), compute `gapPairSummary`, populate filter dropdowns, metrics, pairing panel, table, charts; enable Settings/Export buttons; hide upload prompt; show descriptive summary toast.
4. Filters — service, UK validation, from/to substring, status, customer, source IP substring, proc min/max, bucket key (chart drill-through), **pair status** (pairing drill-through). Metrics/table recompute from `gapFilteredData`. Pairing panel is global (from `gapPairSummary`).
5. `drillDownGap(type)` — reset all filters then apply one; `total` = pure reset. Clears `gapInvalidReason`, `gapBucketFilter`, `gapPairFilter`.
6. `drillDownPair(status)` — sets `gapPairFilter` to the given status (or toggles off). Clears other filters. Scrolls to table.
7. `gapReasonBucket(reason)` — display-layer keyword mapping from `ukValidationReason` strings to six buckets: `empty`, `not +44`, `wrong length`, `identical digits`, `sequential run`, `bad prefix`. Anything unmatched → `other`.
8. `gapInvalidReason` — global set by breakdown-panel chip clicks; consulted in `applyGapFilters()` to filter rows by reason bucket. Cleared by `resetGapFilters()`, `drillDownGap()`, and manual validation-dropdown changes.
9. **`row._gapIdx`** — assigned once in `processGapData()` as the row's index in `gapData`. Stable across renders; used for orphan group keys (`g-o-{_gapIdx}`) and partner page lookups.
10. **`data-pair-group`** — attribute on every `<tr>` in grouped mode. Paired rows → `"g-" + pairId`; orphan rows → `"g-o-" + row._gapIdx`. Used by tests and banding logic.
11. **Representative-row rule** — when sorting groups, the representative is the row with `isSigning === true` if present, else the group's first row. The verify leg never drives sort order.
12. **Banding** — `gap-group-alt` class applies `rgba(148,163,184,0.05)` zebra on alternating groups; `gap-group-seam` applies `border-top` on first row of each group (except the first). No coloured spines. Group-by-pair switch uses `gap-switch-input sr-only` (visually hidden checkbox) + `gap-switch-track` (styled track) with `::after` pseudo-element knob that slides via `translateX(16px)` on `:checked`. Track turns violet when checked; focus-visible ring for keyboard access.
13. **Hover classes** — `gap-pair-highlight` (violet ring + raised bg) and `gap-pair-dim` (opacity 0.45). Applied via `mouseover`/`mouseout` event delegation on `tbody`. `initGapHoverHighlight()` is called once in `processGapData()`.

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

### Charts (all smart auto-bucketed, UTC, destroyed/rebuilt per render — invalid-time rows excluded; all charts are clickable for drill-through; per-chart bucket dropdowns in each chart card header)
1. Invalid Numbers Over Time — amber line (invalidTotal = signingInvalid + verifyInvalid). Per-chart bucket dropdown. Click filters table to that bucket.
2. Signing vs Verification Volume — stacked bar, 4 datasets, 2 stacks. Per-chart bucket dropdown. Click filters table to that bucket.
3. Processing Time Distribution — violet line (per-bucket average) with dynamic Y-axis scaling (no fixed `suggestedMax`). Per-chart bucket dropdown. Click filters table to that bucket.
4. Time to Verify (TTV) — dual-line: median cyan, P95 pink dashed. Per-chart bucket dropdown. Computed from paired rows.

### Table & export
- 10 sortable columns (Time, Service, From, To, Status, Customer, Source IP, Proc. Time, UK Valid, Pair); default sort time desc; pagination 25/50/100 (default 25).
- Pair column renders green "Paired" / red "Signed · not verified" / amber "Verified · not signed" / gray "Unpairable" pills with tooltips.
- Export: modal (Filtered/All) → CSV with metrics summary block + invalid-reason breakdown line (when invalid > 0) + pairing summary line + quoted data rows including pair status, pair ID, and time-to-verify columns; filename `gap_analyzer_export_YYYY-MM-DD.csv`.

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

### Phase 1 hotfixes
- **H1: Verification predicate widened** — `isVerify` changed from `svc.includes('verify')` to `svc.includes('verif')` (stem match). `'verification'.includes('verify')` is false (`"ication"` ≠ `"y"`); `'verification'.includes('verif')` is true. Fixes `Verification` service value being uncounted.

### Phase 1 documentation cleanup (D1–D3)
- **D1:** §5 Global decisions renumbered 38–42 (collision with Phase 1 Gap decisions 33–37 resolved).
- **D2:** Stale "Fix the chart annotation" recipe removed from §13 (plugin now loaded).
- **D3:** §4 file-map ranges rewritten from actual line numbers (1–305 through 3361–4095).

### Phase 1 F1 (parse errors)
- `parseGapCSV` returns `{headers, rows, errors}`. Errors collected for empty rows and short-row padding. Count surfaced in summary toast as "· N skipped" when > 0.

### Phase 2A — Diagnostic Foundations
- **Task 1: Timestamp parse guard** — `processGapData()` parses each row's time into `row.timestamp` (ms epoch) + `row.timeValid` flag. 10-digit → epoch seconds, 13-digit → epoch ms, otherwise `new Date()`. Invalid timestamps: counted in tiles, excluded from time-bucketed charts, amber icon in table, sort to bottom. Summary toast appends "· N unparseable timestamp(s)".
- **Task 2: Signed directional gap** — Gap Count tile shows signed value with dynamic caption (positive = "missing verifications", negative = "unsigned verifications", zero = "balanced"). Gaps Over Time converted from line to bar chart: red above zero, amber below, dashed zero baseline via annotation plugin. Subtitle added.
- **Task 3: Invalid-reason breakdown** — `gapReasonBucket()` maps `ukValidationReason` strings to six buckets via keyword matching. Full-width panel below metrics grid with clickable chips; sets `gapInvalidReason` global for filtering. Export CSV includes breakdown line. Help drawer updated.

### Phase 2A hotfixes
- **H3: Unknown time bucket** — invalid-time rows now go to an explicit "Unknown" bucket (always last) in all four charts instead of being excluded. Chart bucket totals must equal tile totals.
- **H4: 100ms threshold visibility** — Processing Time chart y-axis `suggestedMax: 100` ensures the dashed annotation line is visible when all averages fall below 100ms.
- **H5: Net vs. per-hour labeling** — Gap Count tile caption appends "net" (e.g. "−1 net · unsigned verifications"); Gaps Over Time subtitle prefixed with "Per hour:".
- **H6: Help-text sync** — Gap Analyzer help drawer's Dashboard Metrics section updated: "Gap (Missing)" → "Gap Count" with signed description and per-hour chart reference; Processing Time Distribution entry appends threshold-line mention.
- **H7: Directional tooltip labels + vocabulary alignment** — Gaps Over Time chart gains `tooltip.callbacks.label` formatting by sign: "+N · signed but not verified" / "−N · verified but not signed" / "0 · balanced". Tile caption, subtitle, and help drawer Visualizations section aligned to the same phrasing (replacing "missing verifications"/"unsigned verifications").

### Phase 2B — Exploration Polish
- **P2.5: Privacy messaging** — shield icon + "Private by design — your call data is processed entirely in this browser and never sent to a server." text added below the upload drop-zone in the Gap Analyzer module.
- **P2.4: Filtered-view indicator** — when any filter is active, a slim strip (`gap-filtered-strip`) appears above the metrics grid showing global (unfiltered) counts per metric as "N of M" with `title` tooltips, plus a Reset Filters button. Global values computed in `updateGapMetrics()` by counting against `gapData` when `isFiltered` is true. Strip hidden when no filters active.
- **P2.6: Configurable slow threshold** — `gapSlowThreshold` global (default 100), number input in Settings modal, `handleGapThresholdChange()` updates tile label, chart annotation line + `suggestedMax`, and re-renders data. Annotation label dynamically shows `"{threshold}ms Threshold"`.
- **P2.3: Chart → table drill-through** — `row.bucketKey` derived in `processGapData()` (ISO hour or `'__unknown__'`). `gapBucketOrder` stores label order. All four charts gain `onClick: chartClickHandler` resolving x-index → bucket key via `gapBucketOrder[idx]`. `toggleGapBucket(key)` sets/clears `gapBucketFilter`; `applyGapFilters()` checks it. Removable chip in filter bar shows active bucket. `resetGapFilters()`, `drillDownGap()`, `resetGapMetrics()` clear bucket filter.

### Phase 2B hotfix
- **H8: drillDownGap outliers uses threshold** — `drillDownGap('outliers')` set `procMin.value = '100'` (hardcoded). Changed to `procMin.value = String(gapSlowThreshold)` so the drill-down respects the user-configured threshold.
- **H9: Settings button root cause** — `openGapSettings()` called with no arguments from the button's `onclick`; `headers.find()` on `undefined` threw TypeError before the modal opened. Fixed by adding `if (!headers) headers = gapRawHeaders;` fallback at function entry.

### Phase 3 — Event Pairing
- **Task 0: Settings button fix** — root cause: HTML `onclick="openGapSettings()"` passed no arguments; JS `headers.find()` on `undefined` crashed before modal `classList` toggle. Fixed with `gapRawHeaders` fallback.
- **Task 1: pairGapCalls engine** — greedy stream matching on `(from, to)` key within `gapPairWindow` (default 1000ms). Assigns `row.pairStatus` (paired/unverified/unsigned/unpairable/duplicate), `row.pairId` (P1, P2…), `row.timeToVerify` (ms). After pairing, unverified signings with a paired signing on the same key are reclassified as `duplicate`. Computes `gapPairSummary` (match rate, counts including duplicates, median/P95, invalid cross-tabs). Runs on full `gapData`, not filtered subset.
- **Task 2: Call Pairing panel** — full-width panel below metric tiles with 6 stat blocks (match rate, unverified, unsigned, duplicates, unpairable, time-to-verify) + correlation line. Clickable blocks via `drillDownPair(status)`. Global (not filtered).
- **Task 3: Table Pair column** — 10th column with colored pills (green/red/amber/blue/gray for paired/unverified/unsigned/duplicate/unpairable) and tooltips. Pair Status dropdown filter added to filter bar with duplicate option. `applyGapFilters()` checks it; `resetGapFilters()` and `drillDownGap()` clear it.
- **Task 4: Configurable pairing window** — number input in Settings modal; `handleGapPairWindowChange()` re-runs `pairGapCalls()` and re-renders panel + table. Persists for session.
- **Task 5: Export + help** — CSV export includes pairStatus, pairId, timeToVerify columns + pairing summary line with duplicate count. Help drawer gains Call Pairing section (heuristic explained, algorithm, statuses including duplicate, window). Dashboard Metrics section updated to reference pairing panel.

### Playwright e2e testing setup
- Added `data-testid` attributes to 17 elements in `index.html` (gateway launch, upload zone, privacy note, file input, analyze button, settings button/modal, threshold input, 7 metric tile values, service filter, filtered strip, table, bucket chip, reset button).
- Scaffolded `playwright.config.js` (chromium, 1440×900, headless, list reporter).
- Created `e2e/helpers.js` (openGapAnalyzer, uploadAndAnalyze, tileText).
- Created `e2e/gap.spec.js` with 5 specs: P2.5 privacy, core tiles, P2.4 filtered strip, P2.6 threshold, P2.3 bucket drill-through.
- Created `e2e/gap-phase3.spec.js` with 6 specs: pairing summary, correlation, pair status pills (including duplicate), retry first-in-wins (FIFO), widening window, signed-not-verified drill-down.
- Added 9 pairing testids (`gap-pair-matchrate`, `gap-pair-unverified`, `gap-pair-unsigned`, `gap-pair-duplicates`, `gap-pair-unpairable`, `gap-pair-ttv`, `gap-pair-correlation`, `gap-pair-window-input`, `data-pair-status` attribute on pills).
- Selector fix: privacy note assertion changed from "never leaves" to "never sent" to match actual HTML text.
- Assertion fix: widened window TTV changed from 550 to 600 to match actual algorithm median (6 paired calls → median 600ms).
- All 11 tests pass. Test suite is dev tooling alongside the single-file app.

### Duplicate Detection (Gap Analyzer)
- **Service classification fix** — `processGapData()` changed `svc.includes('signing')` → `svc.includes('sign')` to match `"sign"`, `"SIGN"`, etc.
- **Duplicate detection** — after `pairGapCalls()` pairing loop, any `unverified` signing that has a `paired` signing with the same key is reclassified as `pairStatus = 'duplicate'`. New `duplicates` count added to `gapPairSummary`.
- **UI additions** — "Duplicates" stat block (blue pill, `gap-pair-duplicates` testid) added to pairing panel. Pair Status filter dropdown gains "Duplicates" option. Table pill rendering adds blue `bg-blue-900/50 text-blue-400` style for duplicate. Export summary line includes duplicate count.
- Created `e2e/gap-dup.spec.js` with 5 specs: duplicate signing detected, duplicate pill shown, filter includes duplicate option, drillDownPair shows duplicate rows, export CSV includes duplicate in summary.
- Created `test_gap_dup.csv` with test data for duplicate detection (2 signings + 1 verify for same key within 1000ms window).
- Updated Phase-3 tests: unverified count 3→2 (one reclassified as duplicate), widening window unverified 2→1.

### Documentation & help-text hygiene (post-Phase 3)
- Fixed help drawer UK prefix line: changed "must be 1, 2, or 7 (the only allocated UK prefixes)" → "must be 1, 2, 3, 7, or 8". Also fixed the `<th>` title tooltip at the same line.
- Synced memory doc §5.47, §2.4, and §2.6 privacy text from "Your data never leaves your browser" to the actual HTML: "Private by design — your call data is processed entirely in this browser and never sent to a server."
- Documented median convention in §5.57: upper-middle value for even-count samples (e.g. `[400,500,600,1500]` → `600`), not the standard statistical median.

### Pairing window calibration
- Pairing window calibrated against real EDR (41 calls / 82 events): 500ms = 49.1% (resolution artifact), 1000ms = 100%. Default 1000ms confirmed; no longer provisional.

### H10: FIFO pairing rule
- **Change** — `pairGapCalls()` changed from last-in-wins (stack/LIFO) to first-in-wins (queue/FIFO). Each verification now pairs with the earliest unmatched signing within the window; signings older than the window are evicted as unverified. Rationale: order-preserving matching recovers true pairs in dense same-key bursts where the earliest signing is the true caller.
- **Counts unchanged** — pairing counts, match rate, duplicate count are all unaffected (only partner assignment changes). TTV median shifts because the retry pair's ttv changes (e.g. 500ms→800ms for the test dataset).
- **Help drawer** — algorithm line updated to "first-in-wins (FIFO)" wording.
- **Test update** — `e2e/gap-phase3.spec.js` retry test renamed to "first-in-wins"; TTV assertions updated to reflect new median values.

### Phase 4 — Layout, pair legibility, median clarity
- **Task 0**: Verified help prefix (already 1,2,3,7,8), privacy text (already synced), median convention (already documented). All pre-existing from earlier sessions.
- **Task 1**: Widened all three module workspaces to `max-w-[1680px]` (Optimizer: was `max-w-6xl`, Onboarding: was `max-w-[1600px]`, Gap Analyzer: was `max-w-7xl`). Gateway card grid left centered.
- **Task 2**: Added `title` tooltip and `signing → verification handoff` caption to the time-to-verify tile.
- **Task 3**: Paired pills now show `P{N} · Paired` with `data-pair-id="{pairId}"`. Orphan pills unchanged.
- **Task 4**: Hover cross-highlight via `mouseover`/`mouseout` delegation on `tbody`. Partner row gets `gap-pair-highlight`, others get `gap-pair-dim`. Off-page partner shows `(partner on page N)` in tooltip.
- **Task 5**: Group-by-pair toggle (`gapGroupMode`) with `data-pair-group` keys. Group pagination (`Showing A–B of G groups (R rows)`), representative-row sort, Okabe–Ito banding (8 hues + neutral orphans).
- **Task 6**: Help drawer Data Table section updated. Memory doc §2.4, §5.58–60, §9.9–13 updated.
- **Task 7**: `e2e/gap-phase4.spec.js` with 6 specs: workspace width, TTV tooltip, pair ID pills, grouping (9 groups), grouped sort monotonicity, hover highlight. All 17 tests pass.

### Banding visual rework (dark-theme tuning)
- Removed per-group hue-tinted row backgrounds. Replaced with luminance zebra (`gap-group-alt` on alternating groups) + seam (`gap-group-seam` on first row of each group).
- Paired spines now use `GAP_GROUP_PALETTE` inline `border-left-color`; orphan spines use `#64748b` slate.
- Hover highlight updated: `outline: 1px solid rgba(167,139,250,0.7)` + `background: rgba(139,92,246,0.10)` (no bright fills).
- Added banding visual spec to `e2e/gap-phase4.spec.js`: asserts palette spine colors for paired rows, slate for orphans, alternating `gap-group-alt`, adjacent-paired-different-colors. All 18 tests pass.

### Page-size label honesty in group mode
- Wrapped "Rows per page" label in `data-testid="gap-pagesize-label"` span. `toggleGapGroupMode` switches text to "Groups per page:" (with tooltip) when on, reverts to "Rows per page:" when off.
- Added Playwright spec asserting label text toggles correctly. All 19 tests pass.

### Optimizer: Coverage-First Objective (O1)
- **Pure function extraction** — `computeCoverage(input)` replaces duplicated greedy logic in `renderDashboard()` and `generateHeadlessAnalysis()`. No DOM access; exposed on `window` for testing.
- **New objective** — eligibility gate: `headroom = SLA − latency ≥ safetyFloor` (default 20ms). Selection: MAX breadth → MAX min-headroom → MIN cost. Replaces cost-per-customer scoring.
- **Safety margin UI** — new number input in Step 3 (default 20, min 0). Validated in `analyzeCoverage()` with error toast on negative. Included in session JSON (v2.1) and CSV exports.
- **Marginal bucket** — endpoints with no eligible region but passing below the safety floor. Separate card in dashboard with relaxation hints. Not recommended for new cells.
- **Existing marginal** — existing cells covering endpoints below the floor are flagged `marginalExisting` (amber "Marginal" badge) but not dropped or re-recommended.
- **Headroom surfaces** — recommended cell cards show covered count, min/avg headroom, per-endpoint headroom. Strategy summary shows min headroom + avg headroom + marginal relaxation hint. CSV/JSON/PDF exports include headroom columns and safetyFloor.
- **Help text rewrite** — "Cost-Effective Coverage Algorithm" section replaced with "Coverage-First Algorithm with SLA Safety Floor" describing eligibility gate, selection priority, marginal bucket, and legacy mode.
- **15 e2e tests** in `e2e/opt-coverage.spec.js`: 10 focused scoring tests (via `computeCoverage` with synthetic data), 4 UI regression tests (wizard, safety input, JSON export, headless analysis structure), 1 headroom stats test. All 35 tests (20 existing + 15 new) pass.

### Optimizer: UX Hardening (O2)
- **T1: Centralized `tryAddEndpoint(candidate)`** — single entry point for all three add paths (AWS Regions tab, World Cities tab, click-to-place). Dedup identity: `r{regionIdx}` for AWS, `c{name}` for cities. On duplicate → toast, no mutation. Returns boolean.
- **T2: Click-to-place exit** — three exit paths: toggle button, Escape key (`custMapEscHandler` document listener, cleaned up in `initCustMap`), "Done placing" button (visible only while active). All clear cursor and refresh map.
- **T3: Session JSON round-trip** — export includes `customers[].sla` per-endpoint SLA. Import restores `perCustomerSLA` from `customers[].sla` when `perCustomerSLA` is missing (backward compat). All fields: `realisticMode`, `slaMode`, `globalSLA`, `perCustomerSLA`, `processingTime`, `safetyFloor`, `selectedFootprint`, `cellCosts`, `baselineMode`, `specificBaselineIdx`.
- **T4: Baseline clarity** — `updateBaselineSummary()` strings: "Paris-derived default (no costs entered)" / "Blended average of N entered cell(s)" / "Anchored to {name}". Tooltip on "Normalized Global Base Cost (1.0x)" label.
- **T5: Coverage map cost chips** — `createRecommendedIconWithCost(cost)` renders `~$N/mo` label above blue diamond on recommended cell markers.
- **T6: Double-rAF invalidation** — `showModule('optimizer')` uses nested `requestAnimationFrame` for Leaflet map `invalidateSize()`.
- **T7: Keyboard delete** — `.customer-row` gets `tabindex="0"` + `onkeydown="handleCustKeydown(event, i)"`. Delete/Backspace removes with toast. Input focus guard.
- **9 e2e tests** in `e2e/opt-ux.spec.js`: dedup (2), Esc exit, JSON round-trip, baseline strings, baseline tooltip, cost chip, map size, keyboard delete. All 53 tests (48 existing + 5 new gap-dup) pass.

### Switch rework + spine removal
- Rebuilt "Group by pair" as a real sliding switch: `sr-only` checkbox + `gap-switch-track` with `::after` knob that slides via `translateX(16px)` on `:checked`. Track turns violet when on; focus-visible ring for keyboard. Deleted old non-sliding toggle markup.
- Removed all left-border spines: deleted `GAP_GROUP_PALETTE`, `.gap-spine` class, and inline `style="border-left-color:..."` from `<tr>`. Zebra (`gap-group-alt`) + seams (`gap-group-seam`) remain.
- Rewrote banding Playwright spec: asserts no inline `border-left-color`, alt-zebra alternation, 9 groups with correct sizes, switch knob slides. All 20 tests pass.

### Pairing-derived gap chart + tile
- **Gap formula changed** — Gap Count tile and Gaps Over Time chart now derive from pairing engine: `signedGap = unverified − unsigned` (was `signing − verify`). Boundary-signing artifact eliminated: signing at H:59:59 + verification at (H+1):00:00 within 1000ms produces NO bar in either hour.
- **Chart data exposed** — `window.gapChartData` set after `renderGapCharts()` computation for test access. Includes `signedGaps`, `unverified`, `unsigned` arrays per bucket.
- **Help text updated** — Gap Count tile tooltip, help drawer Gap Count entry, and Gaps Over Time entry all reference pairing engine.
- **6 e2e tests** in `e2e/gap-pairing-chart.spec.js`: tile counts (unverified − unsigned), boundary pair no-bar, lone signing red bar, all verifies pair (0 unsigned), unpairable excluded from chart, subtitle mentions pairing engine. 59 tests total.

### Phase 5 — Time-Series Overhaul & Chart Cleanup
- **Smart Auto-Bucketing** — `getGapBucketKey(timestamp, interval)` and `getAutoBucketInterval(minTime, maxTime)` helper functions. Data range ≤1h → 1min, ≤6h → 5min, ≤3d → 1hour, >3d → 1day. `gapBucketIntervals` per-chart object (default all `'auto'`). Per-chart UI dropdowns (`gap-bucket-interval-invalid|volume|proc|ttv`) in each chart card header. Changing an interval re-renders only that chart via `renderSingleChart()`.
- **`gapBucketIntervals` per-chart state** — `{ invalid: 'auto', volume: 'auto', proc: 'auto', ttv: 'auto' }`. Each chart can be bucketed independently. `gapChartBucketOrders` stores per-chart bucket key order for drill-through.
- **`makeChartClickHandler(chartType)`** — Returns closure that sets `gapBucketFilterSource` to the chart type and calls `toggleGapBucket()`. `applyGapFilters()` and `renderGapBucketChip()` resolve interval from `gapBucketIntervals[gapBucketFilterSource]`.
- **`renderSingleChart(chartType)`** — Re-renders a single chart with its own interval. Called by `handleChartBucketIntervalChange()`. Full refresh via `renderGapCharts()` computes all charts in one pass.
- **Gaps Over Time chart removed** — HTML canvas+wrapper deleted, JS rendering logic and `gapChartInstances.gaps` removed. Gap Count tile reverted to simple `signing − verify` (was `unverified − unsigned`). Help drawer and tile tooltip updated.
- **Processing Time chart Y-axis cleanup** — removed `chartjs-plugin-annotation` threshold line and `suggestedMax: gapSlowThreshold` from Y-axis options. Chart.js now scales Y dynamically to data range. `gapSlowThreshold` logic retained for the Slow Requests tile.
- **Invalid timestamps excluded from charts** — `renderGapCharts()` filters for `row.timeValid && row.timestamp` only. Unknown bucket removed from UI. Invalid rows still count in metric tiles and appear in data table with amber icon.
- **`row.bucketKey` removed** — no longer stored on each row. Computed dynamically in `applyGapFilters()` and `renderGapCharts()` via `getGapBucketKey()`. `gapBucketFilter` checked against dynamically computed key.
- **9 e2e tests** in `e2e/gap-charts.spec.js`: auto-bucketing, UI control re-render, per-chart bucket isolation, removed chart DOM, gap tile formula, dynamic Y-axis, invalid timestamps excluded, per-chart dropdown options, TTV chart. 71 tests total.

### Phase 6 — Data Flexibility & Pairing Generality
- **Horizontal scroll for wide tables** — `overflow-x-auto` wrapper with `rounded-lg border border-slate-700/50`. No `min-w-[1200px]` on table. Per-column `min-width` styles on `<th>` elements (Time 140px, Service 80px, From 120px, To 120px, Status 80px, Customer 120px, Source IP 120px, Proc Time 90px, UK Valid 80px, Pair 140px). All `<th>` and `<td>` have `whitespace-nowrap`.
- **`row.raw` stored on each row** — `raw: row` property in `processGapData()` preserves the original header-keyed CSV values for custom column access.
- **Additional columns UI** — In the mapping modal, "Additional Columns" section with "+ Add Column" button. Each entry has a header dropdown (`gap-add-col-header`) and display name input (`gap-add-col-name`). `gapAdditionalColumns: [{header, displayName}]` global. `renderAdditionalColumnsUI()` renders entries. `handleAdditionalColHeaderChange()` / `handleAdditionalColNameChange()` update state and preview.
- **Custom columns in table** — `renderGapTable()` dynamically adds `<th class="gap-custom-col-th">` headers and `<td>` cells using `row.raw[col.header]`. Grouped + flat mode both support custom columns. Sort comparators use `row.raw[col.header]` as fallback. Empty-state colspan updated.
- **Custom columns in CSV export** — `exportGapData()` appends custom column headers and per-row values from `row.raw[col.header]`.
- **Generic pairing key (up to 4 components)** — `gapPairingKeys: []` global (default = from+to). Pairing key UI in mapping modal with "+ Add" / remove buttons. `pairGapCalls()` uses `gapPairingKeys.length > 0 ? gapPairingKeys.map(h => row.raw[h]).join('|') : row.from + '|' + row.to`. Duplicate detection and all downstream stats use generic key.
- **Mapping preview** — Live preview section in mapping modal. `updateGapPreview()` renders headers + first data row from `gapRawData[0]`, updates on every dropdown/input change.
- **Settings snapshot/restore** — `gapSettingsSnapshot` stores deep copy of `gapColumnMapping`, `gapAdditionalColumns`, `gapPairingKeys`, `gapSlowThreshold`, `gapPairWindow` on modal open. `closeGapColumnModal()` restores from snapshot (discards unsaved changes). `confirmGapColumnMapping()` clears snapshot before closing (commits changes). Prevents stale edits persisting after Cancel/X.
- **Time to Verify (TTV) chart** — 4th chart: `gap-chart-ttv`. Dual-line (median cyan, P95 pink dashed). Computed from paired rows per time bucket. `gapChartData` extended with `ttvMedian: []` and `ttvP95: []`. Empty-state shows "No paired data" when no TTV values.
- **`escapeHtml()` helper** — Added for safe rendering of raw CSV values in preview and table cells.
- **`getUnmappedHeaders()`** — Returns CSV headers not already mapped to the 8 core fields, used for additional column and pairing key dropdowns.
- **14 e2e tests** in `e2e/gap-flexibility.spec.js`: horizontal scroll, table no min-w, th whitespace-nowrap, td whitespace-nowrap, th min-width, modal width, pairing key defaults, pairing key pre-selected, modal section, custom column header+cell, live preview, pairing key UI, CSV export includes custom columns, TTV chart canvas. **80 tests total.**

### Phase 6B — PM Feedback Round
- **Modal widened** — `max-w-2xl` → `max-w-4xl`, `max-h-[90vh]` → `max-h-[85vh]`. Threshold/pairing window in `sm:grid-cols-2` wrapper. Column mappings grid `sm:grid-cols-2`.
- **Pairing key editable defaults** — `renderPairingKeysUI()` rewritten: always shows From/To as first two dropdowns with labels ("From (required)", "To (required)"). `gapPairingKeys` always populated with `[fromHeader, toHeader]` defaults. Options disabled if already used elsewhere. "+ Add column" button hidden at max 4. Extra columns get remove buttons. `confirmGapColumnMapping()` ensures at least from/to fallback. `openGapSettings()` syncs defaults via `syncPairDefaults()` on From/To change.
- **Per-chart time bucket dropdowns** — Global dropdown removed. 4 per-chart dropdowns in chart card headers (`gap-bucket-interval-invalid|volume|proc|ttv`). State: `gapBucketIntervals = { invalid:'auto', volume:'auto', proc:'auto', ttv:'auto' }`. `handleChartBucketIntervalChange(chartType, val)` re-renders only that chart. `gapChartBucketOrders` stores per-chart bucket key order. Drill-through uses source chart's interval for `applyGapFilters()`.
- **Table column min-widths** — Removed `min-w-[1200px]`. Added `whitespace-nowrap` to all `<th>` and `<td>`. Per-column `style="min-width: Xpx"` on `<th>` elements for stable column widths.

### Phase 6C — Mapping Modal Layout Refinements
- **Modal widened** — `max-w-4xl` → `max-w-6xl` (1152px) to accommodate 4-column mapping grid.
- **Pairing Key section moved up** — now sits directly after the Processing Time / Pairing Window inputs, before the column mappings.
- **Pairing key horizontal layout** — dropdowns render in a `flex flex-wrap` row with muted `+` separators. Merged `+` and X into Option B: small circular X button positioned `absolute -top-1.5 -right-1.5` above each dropdown (top-right corner). Components removable down to minimum 1; add button "+ Add pairing component" hidden at 4.
- **Pairing key min 1** — `renderPairingKeysUI()` initializes to `[from, to]` on first open only; subsequent removes can go down to 1 component.
- **4-column mapping grid** — `grid-cols-2 sm:grid-cols-4` with compact `text-xs` labels/selects, tighter padding (`p-3`, `px-2.5 py-1.5`), and `pr-8` on all `<select>` elements for native chevron spacing.
- **"Map Columns" section header** — column mappings wrapped in a section with `<h3>Map Columns</h3>` and description, matching Pairing Key / Additional Columns / Preview section style. Standalone intro paragraph removed.
- **Settings snapshot/restore** — `openGapSettings()` takes a deep snapshot of `gapColumnMapping`, `gapAdditionalColumns`, `gapPairingKeys`, `gapSlowThreshold`, `gapPairWindow`. `closeGapColumnModal()` restores from snapshot (discards unsaved changes). `confirmGapColumnMapping()` clears snapshot before closing (commits changes). Prevents stale edits persisting after Cancel/X.
- **Additional columns** — unchanged 2-column grid of bordered grouped units.
- **15 e2e tests** in `gap-flexibility.spec.js` Phase 6C block: horizontal flex-wrap, + separators, button label, max-4 hidden, min-1 remove, grid-cols-2 container, bordered units, unit contents, 4-column mapping grid, pr-8 chevron, X above dropdown, section order, Map Columns header, cancel resets state, Analyze persists state.

### Repo restructure — module-grouped e2e + fixtures
- **Test fixtures moved** — all `test_gap_*.csv` files moved from project root to `fixtures/` with clean names: `gap-core.csv`, `gap-dup.csv`, `gap-pairing.csv`, `gap-pairing-chart.csv`, `gap-invalid-only.csv`, `gap-phase1.csv`, `gap-phase6.csv`.
- **e2e tests grouped by module** — `e2e/gap/` (8 spec files + helpers.js), `e2e/optimizer/` (2 spec files). Specs renamed from phase-based to feature-based: `gap-core.spec.js`, `gap-dup.spec.js`, `gap-pairing.spec.js`, `gap-pairing-fifo.spec.js`, `gap-layout.spec.js`, `gap-charts.spec.js`, `gap-flexibility.spec.js`.
- **Playwright projects** — `playwright.config.js` defines `gap` and `optimizer` projects with separate `testDir`. `npx playwright test --project=gap` runs only gap tests (41), `--project=optimizer` runs only optimizer tests (28).
- **npm scripts** — `npm test` (full regression), `npm run test:gap`, `npm run test:optimizer`, `npm run test:headed`.
- **Post-gate: 69/69 passed** — pre-gate and post-gate counts identical.

### Optimizer Phase O3 — Green-Plan, Scenarios, Share Report, Upgrade Plan
- **`computeGreenPlan(input)`** — pure function on `window`. Computes per-endpoint `relaxationNeeded` (marginal: `safetyFloor - bestHeadroom`; impossible: `bestPossibleLatency + safetyFloor - SLA`; covered: 0). `globalRelaxation = max(relaxationNeeded)`, `relaxedSLA = globalSLA + globalRelaxation`. Re-runs `computeCoverage` with relaxed SLA. Returns `{globalRelaxation, relaxedSLA, perEndpoint[], mode, relaxedResult, relaxedOPEX, deltaOPEX, relaxedMarginal, relaxedImpossible}`.
- **Green-Plan UI** — Dashboard section "What-if: Make Everything Green" (emerald border-l-4) between Marginal and Latency Explorer. Toggle button switches between global and per-endpoint mode. Global: shows relaxed SLA, extra OPEX, marginal/impossible counts. Per-endpoint: table of endpoints needing relaxation.
- **Marginal Upgrade Plan** — Sliding switch on Marginal Headroom card header (existing switch pattern: `upgrade-switch-input sr-only` + `upgrade-switch-track`). Default OFF on every load (session-only, not persisted). Toggling ON runs a parallel `computeCoverage()` with `safetyFloor=0` and renders an "Upgrade plan" panel (amber border-l-4) showing: added cells + cost delta, and per-marginal-endpoint "covered by <cell>" or "requires +Xms SLA relaxation". Read-only what-if — never mutates primary analysis or globals. Exports stay strict. No marginals + ON → empty state "No upgrades needed — all covered endpoints meet the safety floor."
- **Saved Scenarios** — localStorage key `atlas-opt-scenarios`. Functions: `getOptScenarios()`, `saveOptScenario(name)`, `loadOptScenario(index)`, `deleteOptScenario(index)`. UI: modal accessible from top bar "Scenarios" button (bookmark icon). `openScenariosModal()` / `closeScenariosModal()`. Per-machine only (documented in modal).
- **Share Report** — `exportShareReport()` creates standalone HTML blob with inline CSS. Embeds: stats, covered/marginal/impossible tables, recommended cells + costs. Added to Export dropdown menu (not step 4 bottom).
- **Test compatibility bridge** — Module-scope `let` variables exposed on `window` via `Object.defineProperty` with `_` prefix: `_customers`, `_slaMode`, `_globalSLA`, `_perCustomerSLA`, `_processingTime`, `_realisticMode`, `_cellCosts`, `_baselineMode`, `_specificBaselineIdx`, `_safetyFloor`, `_selectedFootprint`. Also `window._regions = regions`, `window._AWS_PRICE_INDEX = AWS_PRICE_INDEX`. Needed because `let` at module scope doesn't become a `window` property.
- **Optimizer test APP URL fixed** — `opt-coverage.spec.js` and `opt-ux.spec.js` changed from hardcoded `file:///C:/Users/Sanjoy/...` to portable `pathToFileURL(path.resolve(...))`.
- **Fixtures** — `fixtures/opt-session-34.json` (34 endpoints, footprint [22], v2.1) and `fixtures/opt-session-7.json` (7 endpoints, footprint [1], v2.0 backward compat). Tests load via `require()`, not inline copies.
- **18 e2e tests** in `e2e/optimizer/opt-scenarios.spec.js`: happy path, floor 0, no footprint, per-endpoint SLA, marginal relaxation, Green-Plan global, Green-Plan per-endpoint, blended vs specific, realistic vs naive, v2.0 import, v2.1 round-trip, dedup, saved scenarios, share report, upgrade plan default OFF, upgrade plan ON shows panel, upgrade plan OFF hides, upgrade plan no-marginals. **46 optimizer tests total (28 existing + 18 new).**

### Marginal endpoint map markers
- **Marginal map markers** — `createExclamationIcon(color)` function added to `index.html` (yellow circle with `!` exclamation mark). Called from `initDashMap()` with `marginal` array passed as 5th arg from `renderDashboard()`. Popup shows endpoint name, best headroom, and relaxation needed.
- **1 e2e test** in `e2e/optimizer/opt-scenarios.spec.js`: verifies 5 marginal markers appear on coverage map with correct HTML structure. **47 optimizer tests total (46 existing + 1 new).**

## 12. Known Limitations & Gotchas

- **Gantt dates are hardcoded 2025 anchors** — "Day N" is generic, but exported JSON carries 2025 start dates; fine for scoping, wrong for real scheduling.
- **Anomaly leftovers:** `row.anomalyFlags` may exist in pre-removal exported JSONs; harmless, ignored by current code.
- **No tests, no lint config** — ~~verification is manual in-browser; the file must stay a single HTML (open directly, no server needed).~~ **Playwright e2e suite in `e2e/`** — run `npx playwright test` (requires network for CDN deps). The app itself stays a single HTML file (opens directly); the test suite is dev tooling. Organized by module: `e2e/gap/` (52 specs), `e2e/optimizer/` (47 specs). Run selectively via `npm run test:gap` or `npm run test:optimizer`. Covers P2.3–P2.6, Phase 3 pairing, Phase 4 layout/pair legibility + banding + page-size label + switch, duplicate detection, Phase 5 time-series overhaul, Phase 6 data flexibility, Phase 6B UX hardening, Phase 6C mapping modal layout refinements, Optimizer O1 coverage-first, Optimizer O2 UX hardening, Optimizer O3 Green-Plan/scenarios/share report/upgrade plan, and marginal endpoint map markers — 99 specs total.
- **Help drawer `scrollToSection`** depends on TOC links matching section `id`s; keep them in sync when editing help content.

## 13. Quick Recipes (common extension tasks)

- **Add a metric tile to Gap Analyzer:** add a card div in the metrics grid (lines ~762–841) with a `gap-metric-*` id, compute it in `updateGapMetrics()`, and (optionally) extend `drillDownGap()`.
- **Add a filter:** add a control in the filters grid, read it in `applyGapFilters()`, reset it in `resetGapFilters()`.
- **Add a chart:** add a `<canvas>` wrapper div (fixed height 200px required), create the Chart instance in `renderGapCharts()`, destroy via `gapChartInstances`.
- **Add a custom column:** click Settings (gear icon) → "+ Add Column" → pick header from dropdown → type display name → Analyze Data. Custom columns persist across filter/sort operations and appear in CSV export.
- **Change pairing key:** click Settings → "+ Add" in Pairing Key section → pick up to 4 CSV headers. Default key is `from|to`. Generic key applies to all pairing, duplicate detection, and TTV calculations.
- **Add a new module:** copy the module HTML block + header pattern, register in `showModule()`, add a gateway card, add a help tab, extend `openHelpDefault()` mapping, and update this document's file map.
- **Change UK rules:** edit `validateUKNumber()` only — rules are centralized there.
- **Change pricing:** edit `AWS_PRICE_INDEX` / `PARIS_DEFAULT_COST`; the baseline system recomputes automatically.
