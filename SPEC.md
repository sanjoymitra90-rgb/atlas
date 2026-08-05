# ATLAS — Engineering Spec

**Audience:** an engineer or AI agent about to change `index.html`.
**Contract:** this file describes the system *as it is now*. It contains no history and no
feature narrative. If something here contradicts the code, the code is right and this file is
a bug — fix it in the same commit.

- History → `CHANGELOG.md`
- Feature behaviour in user language → `FEATURES.md`
- Known defects and the current work list → `REVIEW.md`

**Last verified against `index.html`:** 2026-08-06 (review pass — ~6,020 lines).

> **No line numbers anywhere in this file.** They were regenerated once and went stale again
> within a phase. Anchor on function names, element IDs, and `data-testid` values — those
> survive edits.

---

## 0. Invariants

Rules that must hold after any change. Several exist because they were once broken. A CI
assertion is noted where one is practical.

1. **Physics.** No `matrix[i][j]` may fall below `haversine(regions[i], regions[j]) × 0.01`
   (light-in-fibre RTT). Asserted at load time in dev; make a CI assertion. *Resolved R4.*
2. **Region indices are identifiers.** Position in `regions[]` is the canonical id used by
   `selectedFootprint`, `cellCosts`, `customers[].regionIdx`, saved scenarios and exported
   sessions. **Inserting a region renumbers everything after it and silently invalidates every
   saved artefact.** Append, or bump the session version and migrate.
3. **Every region code in `regions[]` has an `AWS_PRICE_INDEX` entry.** Otherwise
   `estimateRegionCost()` returns `NaN` and it propagates into OPEX unnoticed. Assertable.
4. **All CSV-derived values pass through `escapeHtml()`** before entering `innerHTML`, in cell
   content and in attribute position. *Resolved R15.*
5. **Charts and table read the same array.** `renderGapCharts()`, `renderSingleChart()`,
   `renderGapTable()` and `updateGapMetrics()` all derive from `gapFilteredData`. Documented
   exception: the Call Pairing panel is global (§4.4). *Resolved R8.*
6. **`computeCoverage()` and `computeGreenPlan()` are pure.** No DOM access, no global reads
   beyond their `input` argument. This is what makes them testable; do not regress it.
7. **Pairing keys use normalised phone numbers**, matching the rest of the app.
   *Resolved R10.*
8. **A row with `timeValid === false` never enters a time-bucketed chart**, always appears in
   the table with an amber marker, and always sorts to the bottom regardless of direction.
9. **`showToast()` fires on every user action that completes or fails.** No silent outcomes.
9a. **Presentation failures never roll back data.** In `processGapData()` the transactional
    boundary ends at the `gapFilteredData` assignment. Everything after it — charts, the pairing
    panel — degrades independently inside its own try/catch. A missing chart library must not
    discard a successful parse. *Resolved R27.*
10. **Chart.js instances are destroyed via `gapChartInstances` before recreation**; Leaflet
    maps are torn down (`off()`, remove non-tile layers, `remove()`, null the ref) before rebuild.
11. **Element IDs are unique across the whole file.** Nearly every early bug in this project
    was an ID mismatch between HTML and JS.
12. **UK validation rules live only in `validateUKNumber()`.** No validation logic elsewhere.
13. **New IDs are module-prefixed:** `gap-*`, `ob-*`, `fp-*`, `cust-*`, `dash-*`, `sla-*`, `cost-*`.

---

## 1. What ATLAS is

A single-file (`index.html`), zero-build, vanilla HTML/JS/CSS application for infrastructure
planning and cost assessment at Provenant Inc. No framework, no bundler, no backend, no
persistence layer beyond `localStorage` for optimiser scenarios. All state is module-scope
globals; all rendering is direct DOM manipulation.

Data never leaves the browser. This is deliberate — call data is sensitive. Note the caveat in
`REVIEW.md` R17: six third-party scripts run with full DOM access, so the claim is currently
asserted rather than enforced.

Four views swapped by `showModule(name)`:

| View | Accent | Purpose |
|---|---|---|
| Gateway | — | Landing page, three launch cards |
| Cell Placement Optimizer | green / emerald `#10b981` | AWS cell placement against SLA latency |
| Onboarding Calculator | blue `#3b82f6` | Engineering-hours scoping and quoting |
| Gap Analyzer | violet `#8b5cf6` / `#a78bfa` | EDR call-data quality analysis |

Use the accent colours consistently for any new UI. Dark theme only.

---

## 2. Tech stack

CDN, no build step. **No other libraries may be assumed.**

| Dependency | Version | Used by | SRI |
|---|---|---|---|
| Tailwind CSS | CDN runtime | all | no — rolling; requires CSP `unsafe-eval` |
| Font Awesome | 6.5.1 | all | yes |
| Leaflet | 1.9.4 | Optimizer | yes |
| DHTMLX Gantt | **edge** | Onboarding | no — **unpinned, moving target** |
| Chart.js | 4.4.1 | Gap Analyzer | yes — **hash is WRONG; script blocked, R3** |
| chartjs-plugin-annotation | 3.0.1 | **nothing — dead since Phase 5** | remove the tag, R3 |
| html2pdf.js | 0.10.1 | Proposal PDF | yes — **unverified, R3** |

The CSV parser is hand-rolled (`parseGapCSV`) — there is no PapaParse. CSP currently allows
`https:` + `data:` + `blob:`, which is permissive enough to be a no-op.

The app requires network access for these CDNs; it is **not** offline-capable despite being
a single file.

---

## 3. Architecture

`index.html` in order: head and `<style>` → ARIA live region and skip link → Gateway markup →
Optimizer markup (4-step wizard) → Gap Analyzer markup → Onboarding markup → global components
(help FAB, toast, proposal modal, confirm modal, loading overlay) → help drawer → scripts.

Scripts in order: navigation and module state → Onboarding (Gantt engine, financials) → help
drawer → Optimizer (constants, maps, coverage) → Gap Analyzer (CSV pipeline, validation,
charts, table, export).

**Module pattern.** Each module owns its markup, its globals and its functions. Cross-module
sharing is limited to `showModule`, `showToast`, `showLoading`/`hideLoading`, the help drawer,
the export-dropdown click-away handler, and the proposal modal (reachable from Optimizer and
Onboarding headers).

**Navigation.** `showModule(name)` hides all four modules, shows one, moves `id="main-content"`
onto the active element (original id preserved in `data-module-id`), and announces via the ARIA
live region. On `optimizer` it invalidates Leaflet maps via nested `requestAnimationFrame` —
never `setTimeout`; layout must settle before measuring. On `onboarding` it lazily initialises
the Gantt on first visit.

**Test surface.** Playwright e2e in `e2e/gap/` and `e2e/optimizer/`, fixtures in `fixtures/`,
projects `gap` and `optimizer` in `playwright.config.js`. Run `npm test`, `npm run test:gap`,
`npm run test:optimizer`. The app stays a single HTML file openable from disk; tests are dev
tooling and require network for CDNs.

Optimizer module-scope `let` bindings are mirrored onto `window` with a `_` prefix
(`_customers`, `_globalSLA`, `_selectedFootprint`, …) plus `window._regions` and
`window._AWS_PRICE_INDEX`, because `let` at module scope does not become a `window` property.
This bridge exists solely for tests.

---

## 4. Conventions

- 2-space indent, single quotes, semicolons. Comments sparse.
- `renderX()` builds DOM · `updateX()` recomputes numbers and labels · `handleX()` handles
  events · `openX()`/`closeX()` for modals · `toggleX()` for booleans · `goToStep()`/`tryGoToStep()`
  for wizard navigation.
- State is module-level `let` prefixed by module (`gap*`, `ob_*`). No closures, no classes.
  Mutate then re-render — there is no reactivity.
- Inline `onclick`/`onchange` call globals directly, so those functions must be on `window`.
  The Onboarding module assigns `window.updateGridHours` and friends explicitly.
- Money via `formatMoney()` / `toLocaleString('en-US')`; percentiles as `toFixed(1)` strings.
- Modals: hidden by default, opened by class toggle. Escape closes the help drawer, click-place
  mode and the mapping modal only (R22).
- Constants stay in the existing blocks: `TIER_TAX`, `AWS_PRICE_INDEX`, `regions`, `worldCities`,
  `matrix`.

---

## 5. Module: Cell Placement Optimizer

### 5.1 Data constants

- `regions[]` — 32 AWS regions (code, name, city, continent, lat, lng). **Index position is the
  canonical id** (invariant 2). Contains known label errors — R4.
- `matrix` — 32×32 ping values. **Not symmetric** (450 of 496 pairs differ, max delta 30 ms) and
  it violates the triangle inequality in 761 cases. Treat it as noisy measurement data, not
  ground truth. Any earlier claim that it is mirrored is wrong.
- `worldCities[]` — name, lat, lng, `tier` 1–4, driving infra tax and T-badges.
- `AWS_PRICE_INDEX` anchored at `us-east-1 = 1.00`; `PARIS_DEFAULT_COST = 2674`;
  `PARIS_INDEX = AWS_PRICE_INDEX['eu-west-3']`.
- `TIER_TAX = { 1:5, 2:20, 3:40, 4:60 }` ms.

### 5.2 Latency — `getCustomerLatency(cellIdx, customer, withBreakdown)`

Two paths, which is the source of a known modelling inconsistency (R6):

- **AWS-region endpoint** (`customer.regionIdx` defined) — `matrix` lookup. Realistic mode adds
  tier tax + processing time; naive mode adds processing time only.
- **City endpoint** — Realistic: `haversine × 0.012 ms/km` + tier tax + processing time, with no
  backbone term. Naive: matrix latency to the nearest AWS region as proxy, + processing time.

The `0.012` factor comes from light in glass (~200,000 km/s → 0.005 ms/km one-way → 0.01 ms/km
RTT) rounded up for last-mile. Measured against the matrix it is **median 45 ms optimistic** and
up to 300 ms optimistic on long-haul African routes.

Returns a number, or `{base, distance, infra, proc, total, nearestRegionIdx, distanceKm, tier,
isDirect}` when `withBreakdown`.

### 5.3 Cost baseline

Users may enter a monthly cost per selected cell; the tool reverse-engineers a normalised global
base by dividing each entered cost by its regional index. **Blended** averages all entered cells;
**Specific** anchors to one. With no costs entered it falls back to `PARIS_DEFAULT_COST / PARIS_INDEX`
(≈ $2,430). `estimateRegionCost(idx)` = base × that region's index, rounded.

### 5.4 Coverage — `computeCoverage(input)`

Pure. Input `{customers, slaMode, globalSLA, perCustomerSLA, safetyFloor, selectedFootprint,
getLatency}`; internally memoised per `(cellIdx, customer)`.

1. **Classify** each endpoint against the existing footprint. Covered if any selected cell meets
   its SLA. Covered endpoints whose best headroom is below `safetyFloor` are flagged
   `marginalExisting` — kept, not re-recommended.
2. **Greedy selection** over uncovered endpoints. Eligibility: `headroom = SLA − latency ≥ safetyFloor`.
   Priority: **max endpoints covered** → **max min-headroom** → **min region cost**. Cost is only
   a third-order tiebreak, so in practice it rarely influences the outcome. This is a documented
   product decision, not an oversight.
3. **Residual buckets.** Uncovered and unrecommended endpoints with `bestHeadroom ≥ 0` go to
   `marginal` with a relaxation hint; those below zero go to `impossible`.

Greedy set cover is a heuristic, not optimal. Returns `{covered, uncovered, recommendations,
pendingCovered, marginal, impossible, avgLatency, minHeadroomAll, avgHeadroomAll}`.

Consumers: `renderDashboard()` (UI), `generateHeadlessAnalysis()` (JSON/CSV/PDF export, works
without visiting step 4), `computeGreenPlan()`, `toggleUpgradePlan()`.

### 5.5 What-if surfaces

- **`computeGreenPlan(input)`** — pure, on `window`. Per-endpoint `relaxationNeeded`
  (marginal: `safetyFloor − bestHeadroom`; impossible: `bestPossibleLatency + safetyFloor − SLA`;
  covered: 0), unreachable endpoints carrying a `Number.MAX_SAFE_INTEGER` sentinel.
  `globalRelaxation = max(finite values)`, then `computeCoverage` re-runs at the relaxed SLA.
  **Known defect:** all-sentinel input yields `globalRelaxation = 0` and reports success — R14.
- **Marginal Upgrade Plan** — sliding switch on the Marginal card, default OFF, session-only.
  Runs a parallel `computeCoverage()` with `safetyFloor = 0`. Read-only: never mutates the
  primary analysis or globals, and exports stay strict. **Known defect:** hard-locks the app on
  the no-marginals path — R1.

### 5.6 State, persistence, export

Wizard gating via `currentStep` / `maxStepReached`. SLA inputs validated in `analyzeCoverage()`.

- **Session JSON v2.1** — `realisticMode`, `slaMode`, `globalSLA`, `perCustomerSLA`,
  `processingTime`, `safetyFloor`, `selectedFootprint`, `cellCosts`, `baselineMode`,
  `specificBaselineIdx`, and `customers[].sla`. Import restores `perCustomerSLA` from
  `customers[].sla` when absent (v2.0 compatibility). **Import performs no validation — R13.**
- **Saved Scenarios** — `localStorage` key `atlas-opt-scenarios`, per-machine only.
- **Share Report** — `exportShareReport()` produces a standalone HTML blob with inline CSS and
  no CDN references.
- **CSV report** — labelled sections including headroom columns and the marginal bucket.

### 5.7 Endpoint management

`tryAddEndpoint(candidate)` is the single entry point for all three add paths (AWS Regions tab,
World Cities tab, click-to-place). Dedup identity: `r{regionIdx}` for regions, `c{name}` for
cities. Duplicate → toast, no mutation, returns `false`.

Click-to-place snaps to the nearest `worldCities` entry and exits three ways: toggle button,
Escape (`custMapEscHandler`, scoped to step 2), or the "Done placing" button. Endpoint rows are
`tabindex="0"` with Delete/Backspace removal, guarded against firing inside inputs.

---

## 6. Module: Onboarding Calculator

**Ribbon:** blended rate ($/hr, default 100), desired margin (%, default 20), deployment scope
(Tier 1 Full Deployment / Tier 2 Integration Only / Tier 3 Standard Onboarding), and a
"Link Duration to Cost" toggle, **off** by default.

**Math.** Hours snap **up** to multiples of 4, minimum 4 ("17" → 20). When linked,
`duration = ceil(hours / 8)`. `internalCost = Σhours × rate`;
`customerPrice = internalCost ÷ (1 − margin/100)`.

> **Known defect (R18):** margin = 100 makes the divisor non-positive and the code silently
> falls back to `customerPrice = internalCost`. A quoting tool quietly quoting at cost is the
> worst failure mode in this file.

> **Planned (R26):** contingency hours as a separate quantity from margin, plus a per-tier
> assumptions textarea stored in `tierStates`.

**Gantt.** Lazy init on first module visit. 60-day runway from `TIMELINE_START` (2025-01-01);
tasks anchor at `PROJECT_START` (2025-01-02 = Day 1). Scale renders generic "Day N";
`work_time = false`, so weekends are ignored deliberately. Day 0 renders empty as visual runway.
Grid 540 px, resizable, drag-to-reorder. Inline `<input>` templates in grid cells rather than
popup dialogs (`details_on_dblclick = false`). Dependencies drawn by dragging a bar's end-circle;
double-click an arrow to delete.

**Multi-tier memory.** `tierStates = {1, 2, 3}`; `saveActiveState()` snapshots on every
structural or grid change. Switching tiers never loses work. Reset Timeline is destructive and
requires the confirm modal.

**Templates.** Tier 1: 9 tasks (Provision Near-Prem Cell 40h → Core Network Config 24h →
Central-Cell Sync 32h → API Handshake 16h + Firewall & Security 32h → Load Testing & QA 16h →
Training 16h → Go-Live Cutover & Hypercare 16h; Project Coordination 40h spanning all).
Tier 2: the same minus Provision, Coordination 24h. Tier 3: QA → Training → Cutover →
Coordination, 16h each.

**Export.** Session JSON v2.0 (rate, margin, link flag, `currentScope`, full `tierStates`;
migrates v1.0 `ob_tasks`/`ob_newCell`). CSV: active-tier financial summary plus all three tier
schedules.

> Exported JSON carries literal 2025 dates. Fine for scoping, wrong for real scheduling.

---

## 7. Module: Gap Analyzer

### 7.1 Pipeline

1. `handleGapCSVUpload` or drag-drop → `readGapFile(file)` → `parseGapCSV(text)`.
   Single-pass state machine: BOM strip, quoted commas, quoted newlines, CRLF, `""` escape,
   empty rows, short-row padding. Returns `{headers, rows, errors, meta}`.
   *Known: duplicate header names collide (R21); whole file read into memory (R20).*
2. `openGapSettings(headers)` — mapping modal. Falls back to `gapRawHeaders` when called with no
   argument (the button does this). Takes a deep snapshot of `gapColumnMapping`,
   `gapAdditionalColumns`, `gapPairingKeys`, `gapSlowThreshold`, `gapPairWindow`;
   `closeGapColumnModal()` restores it, `confirmGapColumnMapping()` clears it. Eight core fields
   with keyword auto-detection; time, service and to are required.
3. `confirmGapColumnMapping()` → `processGapData()`, try/catch wrapped with rollback to the
   previous `gapData` / `gapFilteredData` on failure. Parses timestamps, normalises numbers,
   validates UK numbers, derives `isSigning` (`svc.includes('sign')`) and `isVerify`
   (`svc.includes('verif')`) from the lowercased service value, runs `pairGapCalls()`, computes
   `gapPairSummary`, populates filters, metrics, table and charts, enables the Settings and
   Export buttons, and shows a descriptive toast.
4. Filters recompute `gapFilteredData`; metrics and table follow. Charts currently do not — R8.

`row.raw` holds the original header-keyed CSV values, used by custom columns and pairing keys.
`row._gapIdx` is the stable index into `gapData`, assigned once.

### 7.2 Timestamps

Pure 10-digit string → epoch seconds ×1000. Pure 13-digit → epoch ms. Otherwise `new Date()`,
which is **locale-ambiguous for `DD/MM/YYYY`** — R19. Rows keep `timestamp` and `timeValid`;
invalid ones count in tiles, appear in the table with an amber icon, sort to the bottom, and are
excluded from charts (invariant 8).

### 7.3 UK validation — `validateUKNumber()`

Rules are centralised here and **must not change without sign-off**:

1. Empty → invalid.
2. Must start `+44` after whitespace strip.
3. Total digit count including `44` must be 11–13.
4. Digits after `44` must not all be identical.
5. No run of 5+ consecutive ascending digits anywhere after `44`.
6. First digit after `44` must be one of `1, 2, 3, 7, 8`.

`normalizePhoneNumber()` recovers Excel scientific notation and re-prefixes bare `44…` numbers.
`from` numbers are normalised but never validated. **Known defects:** scientific-notation recovery
silently truncates and the result is then reported Valid (R9); rules 4–5 are heuristics for
synthetic test data and rule 2 rejects legitimate non-UK destinations, all surfaced as one red
"Invalid" pill (R25 splits them).

### 7.4 Pairing — `pairGapCalls()`

No correlation ID exists in EDR, so pairing is heuristic. The stream is sorted by timestamp
(signings before verifications at equal timestamps). Each verification pairs with the **earliest**
unmatched signing sharing its key within `gapPairWindow` (first-in-wins / FIFO); older signings
are evicted as `unverified`. Order-preserving matching recovers true pairs in dense same-key bursts.

Statuses: `paired`, `unverified` (signed, not verified), `unsigned` (verified, not signed),
`duplicate` (superseded retry), `unpairable` (no usable timestamp, or neither signing nor verify).

**Window default 1000 ms**, calibrated against real EDR (41 calls / 82 events): 1000 ms pairs 100%
of outcomes, 500 ms only 49.1%. The 500 ms misses are a timestamp-resolution artefact — events are
logged at whole-second granularity, so cross-tick pairs show an apparent 1000 ms gap. Sub-second
latency is not observable from this data. 1000 ms is therefore the minimum usable window.

**Median convention:** `timeToVerifyMedian` takes the upper-middle value for even samples
(`[400,500,600,1500]` → `600`), not the statistical mean of the two middle values. Chosen because
verification times are discrete integer milliseconds and the upper-middle avoids averaging a
near-miss outlier into the median.

**The pairing panel is global** — computed from `gapData`, not `gapFilteredData`, because a
signing and its verification may sit in different filter buckets. This is the documented exception
to invariant 5.

**Known defects:** keys use un-normalised `row.raw` values (R10); duplicate reclassification is
time-unbounded (R11).

### 7.5 Charts

Four Chart.js instances, all UTC, all destroyed and rebuilt per render, all clickable for
drill-through, each with its own bucket dropdown:

1. Invalid Numbers Over Time — amber line
2. Signing vs Verification Volume — stacked bar, 4 datasets, 2 stacks (valid over invalid per service)
3. Processing Time Distribution — violet line, per-bucket average, dynamic Y axis
4. Time to Verify — dual line, median cyan and P95 pink dashed, from paired rows

**Smart auto-bucketing** via `getAutoBucketInterval(min, max)`: ≤1 h → 1 min, ≤6 h → 5 min,
≤3 d → 1 hour, >3 d → 1 day. `gapBucketIntervals` holds per-chart overrides;
`renderSingleChart(type)` re-renders one chart. `gapChartBucketOrders` stores per-chart bucket key
order for drill-through, resolved through `gapBucketFilterSource`.

### 7.6 Table and export

Ten columns; **nine are sortable** — UK Valid has no handler. Default sort time descending, which
currently compares the raw string rather than `row.timestamp` (R12). Pagination 25/50/100.

Group-by-pair is a render layer: paired rows share a group, orphans are solo, pagination counts
groups, and sorting uses a representative row (the signing leg if present). Banding is luminance
zebra (`gap-group-alt`) plus a seam on each group's first row — presentation only, exports
unchanged. Hovering a paired row highlights its partner and dims the rest via `tbody` delegation;
off-page partners are noted in the pill tooltip.

Export is a modal choosing Filtered or All scope, producing CSV with a metrics summary block, an
invalid-reason breakdown line, a pairing summary line, then quoted data rows including pair status,
pair ID, time-to-verify and any custom columns. **Known defects:** no formula-injection guard
(R16); 0 ms exports as blank; the summary uses an unsigned gap while the UI tile shows a signed one.

---

## 8. Global components

- **Help drawer** — three tabs, TOC chips, `scrollToSection(id)` requiring TOC links to match
  section ids. Keep them in sync when editing help content. Opened per module via `openHelp()`;
  the FAB opens the current module's tab.
- **Toast** — single `#toast-msg`, 3 s auto-hide, `_toastTimer` cleared before each new timer.
- **Loading overlay** — `showLoading()` / `hideLoading()`. Currently unsound; see R1 and R2.
- **Proposal modal (BETA)** — three independent include toggles; infra section built headlessly
  so it works without visiting the dashboard. Internal cost and blended rate never appear;
  invoicing language is 50% kickoff / 50% Go-Live.
- **Confirm modal** — amber, used for timeline reset.
- **Export dropdowns** — `export-menu` and `export-menu-onb`, closed by a click-away handler.

---

## 9. Recipes

- **Add a Gap metric tile:** add a card with a `gap-metric-*` id to the metrics grid, compute it
  in `updateGapMetrics()`, optionally extend `drillDownGap()`.
- **Add a Gap filter:** add the control, read it in `applyGapFilters()`, reset it in
  `resetGapFilters()` **and** `drillDownPair()` — both clear filters and drift apart (R23).
- **Add a chart:** add a `<canvas>` wrapper (fixed 200 px height), create the instance in
  `renderGapCharts()`, register it in `gapChartInstances` for teardown.
- **Change UK rules:** `validateUKNumber()` only.
- **Change pricing:** `AWS_PRICE_INDEX` / `PARIS_DEFAULT_COST`; the baseline recomputes.
- **Add an AWS region:** read invariant 2 first. Append rather than insert, add the
  `AWS_PRICE_INDEX` entry, add a real matrix row and column — do not interpolate — and run the
  physics assertion.
- **Add a module:** copy a module block and header, register in `showModule()`, add a gateway
  card, add a help tab, extend `openHelpDefault()`, update this file.
