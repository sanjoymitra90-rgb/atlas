# ATLAS — Changelog

Historical record of substantive changes, newest first. This file is **history only**.
It describes what changed and when; it does **not** describe how the app works today.
For current behaviour see `SPEC.md` (engineering) and `FEATURES.md` (product).

If a statement here contradicts `SPEC.md`, `SPEC.md` wins — this file is not maintained
to stay true, only to stay complete.

**Last updated:** 2026-08-06 (optimizer: upgrade plan removed, marginal recolored, collapsible sections)

---

### Optimizer: Marginal Upgrade Plan removed, marginal recolor, collapsible sections
- **Marginal Upgrade Plan removed** — Deleted the upgrade switch, `toggleUpgradePlan()`, upgrade-plan-card HTML, and `.upgrade-switch-*` CSS. R1 resolved by removal. Green-Plan ("Make Everything Green") untouched.
- **Marginal accents yellow → orange** — Map pins (`createExclamationIcon`), popup text, Marginal Headroom card icon, result list items, and `marginalExisting` badge all changed from yellow/amber to orange.
- **Collapsible sections** — Recommended New Cells and Latency Explorer each get a chevron toggle button (`aria-expanded`, default expanded). Reuses the existing accordion pattern. Added `toggleDashSection()` function and `.dash-section-*` CSS.
- **Dashboard reordered** — Recommended New Cells now appears above Latency Explorer.
- **Tests** — Removed 4 upgrade-plan specs, updated marginal marker spec to assert orange, added collapse/expand spec and DOM order spec. Total optimizer specs: 48 (was 52).

---

### Unified latency model — Naive mode removed (R6 resolved by construction)
- **Unified `getCustomerLatency()`** — One model, no mode parameter. `resolveCityToRegion()` finds nearest region within 50 km. If resolved: matrix path (no tier tax). Otherwise: haversine + tier tax. Same city from any UI path produces identical latency.
- **Naive mode removed** — Deleted mode selector cards, `realisticMode` global, `setRealisticMode()`, `_realisticMode` bridge. Session JSON bumped to v2.2 (imports of v2.0/v2.1 silently ignore `realisticMode`).
- **Proximity note** — Now informational ("uses measured backbone latency") instead of a warning.
- **Precision bands (R7)** — Matrix-resolved endpoints: band collapses to 0, "measured backbone" shown. Direct-path endpoints: ±20% band + confidence chip.
- **Tests** — Replaced "Realistic vs Naive" spec with two unified model tests. All `realisticMode` references removed from test fixtures.
- **Docs** — SPEC.md §5.2 rewritten to unified rule. FEATURES.md Step 3 rewritten. Help drawer "Direct Distance vs AWS Backbone" rewritten.

---

### Review pass — R3, R27, R1, R2, R4, R5, R13 (ship-blockers + correctness)
- **R3 Chart.js SRI recovery** — Removed faulty SRI hashes on Chart.js and html2pdf (recalled, not computed). Deleted dead `chartjs-plugin-annotation` script tag (threshold line removed in Phase 5). Added load-time dependency guard that toasts if Chart/Leaflet/html2pdf/Gantt are missing.
- **R27 Pipeline isolation** — Presentation calls (`renderGapCharts`, `renderGapPairPanel`, etc.) moved outside `processGapData()` try/catch. Data pipeline now rolls back on corruption; chart failure degrades gracefully with a toast.
- **R1/R2 Overlay lock** — `toggleUpgradePlan` no-marginals early return now dismisses overlay. All three `showLoading`/`hideLoading` sites wrapped in `try/finally`.
- **R4 Region labels** — `ap-southeast-5` corrected to Kuala Lumpur (was Auckland), `ap-southeast-7` to Bangkok (was Kuala Lumpur). Matrix data was already correct for the geographic positions.
- **R5 Physics assertion** — Added light-in-fibre check after `haversine()` — warns to console for any matrix entry below `distance × 0.01ms` floor.
- **R13 Import validation** — Out-of-range `selectedFootprint`/`regionIdx` indices are now filtered out with a toast. Falsy-zero `||` defaults changed to `??`.

### Review pass — R8, R10, R15, R16 (security + filtering)
- **R8 Charts respond to filters** — `applyGapFilters()` now calls `renderGapCharts()`. Charts update when filters change.
- **R10 Pairing key normalisation** — Custom pairing keys using from/to headers now use normalised phone numbers (`row.from`/`row.to`) instead of raw CSV cells.
- **R15 XSS hardening** — All CSV-derived values in data table (both branches) and filter dropdowns now escaped via `escapeHtml()`. pillTitle `title` attribute also escaped.
- **R16 CSV injection guard** — New `csvCell()` helper prefixes `=`, `+`, `-`, `@`, tab, CR. Applied to `exportGapData()`. `processingTime=0` no longer exports blank.

### Review pass — R9, R11, R12, R14, R18 (correctness bugs)
- **R9 Precision loss detection** — `normalizePhoneNumber()` detects when scientific notation lost digits and returns the original value, which fails validation. No more truncated numbers marked Valid.
- **R11 Time-bounded duplicates** — Duplicate reclassification now checks `gapPairWindow` between the unverified and paired signing. Call-hours-earlier rows stay `unverified`.
- **R12 Time sort uses timestamp** — Both flat and grouped sort paths compare `row.timestamp` (ms epoch) instead of `row.time` string. Invalid-timestamp sorting preserved.
- **R14 Unreachable-everything** — `computeGreenPlan()` returns `allUnreachable:true` when no endpoint can reach any cell. Panel can show "not achievable at any SLA".
- **R18 Falsy-zero fixes** — `procMin/procMax` now correctly handles 0. Margin=100 shows error toast and clamps to 99.

### Review pass — R17, R19, R20, R21, R22, R23, R24 (hardening)
- **R17 CSP tightened** — Added `connect-src 'none'` to enforce the privacy claim at browser level.
- **R19 Ambiguous date parsing** — Explicit `DD/MM/YYYY HH:mm:ss` detection added before fallback `new Date()`. Avoids month/day swap for UK EDR data.
- **R20 File size guard** — `readGapFile()` rejects files >50 MB with a toast.
- **R21 Duplicate header de-dup** — Duplicate CSV column names now renamed on read (`name` → `name (2)`).
- **R22 Gateway a11y** — All three gateway cards now `role="button" tabindex="0"` with Enter key handler.
- **R23 Duplicate pillTitle drift** — Added missing 'duplicate' case to grouped-mode pillTitle tooltip.
- **R24 showModule guard** — ID restore now checks `data-module-id` exists before assignment, preventing permanently blank element ID.

### Review pass — R6, R7, R25, R26 (model honesty + product changes)
- **R6 Model honesty** — Added amber uncertainty note in Step 3 explaining 30–60ms internal disagreement exceeds default safety margin. Proximity detection in step 2 warns when a city endpoint is within 50km of an AWS region (estimates will differ by model).
- **R7 Precision bands** — Added `latencyBand(cellIdx, customer)` helper computing both Realistic and Naive estimates. Recommendation cards now display per-endpoint latency bands (`est. 80–110ms`) with point estimate as tooltip. Per-recommendation confidence chip (High/Medium/Low) based on max band-to-SLA ratio.
- **R25 Pill split** — `validateUKNumber()` now returns `{valid, category, reason}` with categories: `malformed` (red), `non-uk` (amber), `suspected-test` (blue). Added `ukPillHtml()` helper. Tile renamed to "Destination Issues." Non-UK country codes now detected as valid-but-wrong-country.
- **R26 Contingency + assumptions** — Contingency % input in Onboarding ribbon, structurally separate from margin. Billable hours = base + contingency (derived, not through 4hr ceiling). Per-tier assumptions textarea stored in `tierStates[tier].assumptions`. Included in CSV export, JSON export/import, and PDF proposal. Change-order language added ("additional work beyond scope at $X/hr").

### Outstanding (deferred to follow-up)
- **R23 full extract** — `gapRowTemplate()`/`clearGapFilterInputs()` helper extraction (drift fix `gapGroupKey()` landed; row template and filter reset refactor deferred)

---

### Post-review fixes and hardening
- **Gateway card code leak** — Gap Analyzer card had malformed HTML (`>` before `style="..."`), exposing style attribute as visible text on the tile.
- **Step 2 map spacing** — Grid layout stretched map column to match taller right column. Added `items-start` to grid parent.
- **Click-to-place undo** — Canceling placement mode now reverts endpoints placed during that session. Escape calls `toggleClickPlace()` (with undo) instead of `exitClickPlace()`.
- **UK Valid column sortable** — Added onclick handler and `ukCategory` sort order in both grouped and flat sort paths. All 10 columns now sortable.
- **R23 gapGroupKey helper** — Extracted `gapGroupKey(row)` function. Table rendering, pagination, and share report all use the same key construction, fixing the R23 drift between pagination (used `pairId ?`) and table (used `pairStatus === 'paired'`).
- **DHTMLX pinned** — Gantt CDN changed from `edge` to `8.0`.
- **CDN setup check** — Playwright global setup launches a browser, loads the page, and fails fast with clear message ("Dependency unavailable: Chart.js") if any expected global is missing.
- **New e2e specs** — 4 optimizer review tests (R1 overlay, R4 region labels, R5 physics, R13 import bounds), 5 gap review tests (R3/R27 dep guard, R8 charts filter, R9 precision, R15 escaping, R16 csvCell).
- **Onboarding smoke suite** — 7 specs: 4-hour snapping, margin math, margin-100 error, tier dropdown, ribbon inputs, contingency field, assumptions textarea.
- **Playwright config** — Added `onboarding` project, `globalSetup` for CDN check.
- **UK Valid column sortability** (nine columns sortable; docs claim ten)

---

### Hardening pass — audit fixes (post-O3)
- **exportOnboardingCSV crash** — Removed orphaned `results.marginalSLAs` reference (copy-paste residue from optimizer). Onboarding CSV export now produces clean multi-tier schedule only.
- **showModule ID preservation** — Module elements now retain their original `id` attributes (stored in `data-module-id`); only the active module gets `id="main-content"`. Fixes `toggleGapTheme()` fallback selector breakage after navigation.
- **Global error boundary** — Not added (single-file app, explicit decision: errors surface via try/catch in entry functions). Mitigated by the `processGapData()` rollback below.
- **toggleGapTheme fallback** — Fixed by showModule ID preservation; `document.getElementById('module-gap-analyzer')` no longer returns null after navigation.
- **showToast timer leak** — Added `_toastTimer` guard with `clearTimeout()` before each new `setTimeout`. Rapid toasts no longer accumulate idle timers.
- **computeCoverage latency cache** — Added `_latCache` inside `computeCoverage()` keyed on `cellIdx|custIdx`. Caches `getLatency()` breakdowns across the entire coverage analysis pass, eliminating redundant Haversine recalculations.
- **computeGreenPlan Infinity guard** — `relaxationNeeded` for unreachable endpoints now uses `Number.MAX_SAFE_INTEGER` sentinel; `relaxedSLA` is `null`. Global relaxation calculation filters out these sentinels. Dashboard displays "—" instead of "Infinityms".
- **renderCustList XSS** — Customer names now escaped via `escapeHtml()` before injection into DOM template.
- **updateGridText escaping** — Grid template now escapes `<`, `>`, `'`, `"`, `&` fully (was only `"`).
- **processGapData rollback** — On catch, restores `gapData`/`gapFilteredData` from saved snapshot. Prevents partially-processed state from leaking into UI.
- **Loading overlay** — Global `#loading-overlay` + `showLoading()`/`hideLoading()` utilities. Wrapped into `goToStep(4)`, `toggleGreenPlanMode()`, `toggleUpgradePlan()`.
- **handleGapPagination group-mode** — Page count now computed from unique groups (not raw row count) when `gapGroupMode` is active.
- **drillDownGap var → let** — All five `var` declarations replaced with `let`.
- **SRI integrity hashes** — Added `integrity` + `crossorigin` to Leaflet 1.9.4 and Font Awesome 6.5.1 (canonical published hashes). Chart.js and html2pdf hashes later removed in R3 (recalled, not computed). Deleted dead `chartjs-plugin-annotation` tag.
- **Gap settings modal Escape** — Global `keydown` handler extended to close `#gap-column-modal` via `closeGapColumnModal()` when Escape is pressed and modal is open.
- **buildAndDownloadPDF guard** — Infrastructure section checks `infraData.summary.totalEndpoints > 0` before rendering; shows explanatory note when no endpoints are configured.
- **Dead variable removed** — `hasTtvData` in `renderGapCharts()` TTV block removed.
- **Playwright config** — `timeout` increased to 90s, `workers: 4`, `retries: 1` in CI.
- **Doc sync (§5.39 + help drawer)** — §5.39 rewritten to "simple signing − verify"; help drawer visualizations now lists four charts with per-chart bucket dropdown description.
- **Atlas_memory.md line count** — Updated to ~5,800 lines.

### Marginal endpoint map markers
- **Marginal map markers** — `createExclamationIcon(color)` function added to `index.html` (yellow circle with `!` exclamation mark). Called from `initDashMap()` with `marginal` array passed as 5th arg from `renderDashboard()`. Popup shows endpoint name, best headroom, and relaxation needed.
- **1 e2e test** in `e2e/optimizer/opt-scenarios.spec.js`: verifies 5 marginal markers appear on coverage map with correct HTML structure. **47 optimizer tests total (46 existing + 1 new).**

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

### Repo restructure — module-grouped e2e + fixtures
- **Test fixtures moved** — all `test_gap_*.csv` files moved from project root to `fixtures/` with clean names: `gap-core.csv`, `gap-dup.csv`, `gap-pairing.csv`, `gap-pairing-chart.csv`, `gap-invalid-only.csv`, `gap-phase1.csv`, `gap-phase6.csv`.
- **e2e tests grouped by module** — `e2e/gap/` (8 spec files + helpers.js), `e2e/optimizer/` (2 spec files). Specs renamed from phase-based to feature-based: `gap-core.spec.js`, `gap-dup.spec.js`, `gap-pairing.spec.js`, `gap-pairing-fifo.spec.js`, `gap-layout.spec.js`, `gap-charts.spec.js`, `gap-flexibility.spec.js`.
- **Playwright projects** — `playwright.config.js` defines `gap` and `optimizer` projects with separate `testDir`. `npx playwright test --project=gap` runs only gap tests (41), `--project=optimizer` runs only optimizer tests (28).
- **npm scripts** — `npm test` (full regression), `npm run test:gap`, `npm run test:optimizer`, `npm run test:headed`.
- **Post-gate: 69/69 passed** — pre-gate and post-gate counts identical.

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

### Phase 6B — PM Feedback Round
- **Modal widened** — `max-w-2xl` → `max-w-4xl`, `max-h-[90vh]` → `max-h-[85vh]`. Threshold/pairing window in `sm:grid-cols-2` wrapper. Column mappings grid `sm:grid-cols-2`.
- **Pairing key editable defaults** — `renderPairingKeysUI()` rewritten: always shows From/To as first two dropdowns with labels ("From (required)", "To (required)"). `gapPairingKeys` always populated with `[fromHeader, toHeader]` defaults. Options disabled if already used elsewhere. "+ Add column" button hidden at max 4. Extra columns get remove buttons. `confirmGapColumnMapping()` ensures at least from/to fallback. `openGapSettings()` syncs defaults via `syncPairDefaults()` on From/To change.
- **Per-chart time bucket dropdowns** — Global dropdown removed. 4 per-chart dropdowns in chart card headers (`gap-bucket-interval-invalid|volume|proc|ttv`). State: `gapBucketIntervals = { invalid:'auto', volume:'auto', proc:'auto', ttv:'auto' }`. `handleChartBucketIntervalChange(chartType, val)` re-renders only that chart. `gapChartBucketOrders` stores per-chart bucket key order. Drill-through uses source chart's interval for `applyGapFilters()`.
- **Table column min-widths** — Removed `min-w-[1200px]`. Added `whitespace-nowrap` to all `<th>` and `<td>`. Per-column `style="min-width: Xpx"` on `<th>` elements for stable column widths.

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

### Pairing-derived gap chart + tile
- **Gap formula changed** — Gap Count tile and Gaps Over Time chart now derive from pairing engine: `signedGap = unverified − unsigned` (was `signing − verify`). Boundary-signing artifact eliminated: signing at H:59:59 + verification at (H+1):00:00 within 1000ms produces NO bar in either hour.
- **Chart data exposed** — `window.gapChartData` set after `renderGapCharts()` computation for test access. Includes `signedGaps`, `unverified`, `unsigned` arrays per bucket.
- **Help text updated** — Gap Count tile tooltip, help drawer Gap Count entry, and Gaps Over Time entry all reference pairing engine.
- **6 e2e tests** in `e2e/gap-pairing-chart.spec.js`: tile counts (unverified − unsigned), boundary pair no-bar, lone signing red bar, all verifies pair (0 unsigned), unpairable excluded from chart, subtitle mentions pairing engine. 59 tests total.

### Switch rework + spine removal
- Rebuilt "Group by pair" as a real sliding switch: `sr-only` checkbox + `gap-switch-track` with `::after` knob that slides via `translateX(16px)` on `:checked`. Track turns violet when on; focus-visible ring for keyboard. Deleted old non-sliding toggle markup.
- Removed all left-border spines: deleted `GAP_GROUP_PALETTE`, `.gap-spine` class, and inline `style="border-left-color:..."` from `<tr>`. Zebra (`gap-group-alt`) + seams (`gap-group-seam`) remain.
- Rewrote banding Playwright spec: asserts no inline `border-left-color`, alt-zebra alternation, 9 groups with correct sizes, switch knob slides. All 20 tests pass.

### Optimizer: UX Hardening (O2)
- **T1: Centralized `tryAddEndpoint(candidate)`** — single entry point for all three add paths (AWS Regions tab, World Cities tab, click-to-place). Dedup identity: `r{regionIdx}` for AWS, `c{name}` for cities. On duplicate → toast, no mutation. Returns boolean.
- **T2: Click-to-place exit** — three exit paths: toggle button, Escape key (`custMapEscHandler` document listener, cleaned up in `initCustMap`), "Done placing" button (visible only while active). All clear cursor and refresh map.
- **T3: Session JSON round-trip** — export includes `customers[].sla` per-endpoint SLA. Import restores `perCustomerSLA` from `customers[].sla` when `perCustomerSLA` is missing (backward compat). All fields: `realisticMode`, `slaMode`, `globalSLA`, `perCustomerSLA`, `processingTime`, `safetyFloor`, `selectedFootprint`, `cellCosts`, `baselineMode`, `specificBaselineIdx`.
- **T4: Baseline clarity** — `updateBaselineSummary()` strings: "Paris-derived default (no costs entered)" / "Blended average of N entered cell(s)" / "Anchored to {name}". Tooltip on "Normalized Global Base Cost (1.0x)" label.
- **T5: Coverage map cost chips** — `createRecommendedIconWithCost(cost)` renders `~$N/mo` label above blue diamond on recommended cell markers.
- **T6: Double-rAF invalidation** — `showModule('optimizer')` uses nested `requestAnimationFrame` for Leaflet map `invalidateSize()`.
- **T7: Keyboard delete** — `.customer-row` gets `tabindex="0"` + `onkeydown="handleCustKeydown(event, i)"`. Delete/Backspace removes with toast. Input focus guard.
- **9 e2e tests** in `e2e/opt-ux.spec.js`: dedup (2), Esc exit, JSON round-trip, baseline strings, baseline tooltip, cost chip, map size, keyboard delete. All 53 tests (48 existing + 5 new gap-dup) pass.

### Optimizer: Coverage-First Objective (O1)
- **Pure function extraction** — `computeCoverage(input)` replaces duplicated greedy logic in `renderDashboard()` and `generateHeadlessAnalysis()`. No DOM access; exposed on `window` for testing.
- **New objective** — eligibility gate: `headroom = SLA − latency ≥ safetyFloor` (default 20ms). Selection: MAX breadth → MAX min-headroom → MIN cost. Replaces cost-per-customer scoring.
- **Safety margin UI** — new number input in Step 3 (default 20, min 0). Validated in `analyzeCoverage()` with error toast on negative. Included in session JSON (v2.1) and CSV exports.
- **Marginal bucket** — endpoints with no eligible region but passing below the safety floor. Separate card in dashboard with relaxation hints. Not recommended for new cells.
- **Existing marginal** — existing cells covering endpoints below the floor are flagged `marginalExisting` (amber "Marginal" badge) but not dropped or re-recommended.
- **Headroom surfaces** — recommended cell cards show covered count, min/avg headroom, per-endpoint headroom. Strategy summary shows min headroom + avg headroom + marginal relaxation hint. CSV/JSON/PDF exports include headroom columns and safetyFloor.
- **Help text rewrite** — "Cost-Effective Coverage Algorithm" section replaced with "Coverage-First Algorithm with SLA Safety Floor" describing eligibility gate, selection priority, marginal bucket, and legacy mode.
- **15 e2e tests** in `e2e/opt-coverage.spec.js`: 10 focused scoring tests (via `computeCoverage` with synthetic data), 4 UI regression tests (wizard, safety input, JSON export, headless analysis structure), 1 headroom stats test. All 35 tests (20 existing + 15 new) pass.

### Page-size label honesty in group mode
- Wrapped "Rows per page" label in `data-testid="gap-pagesize-label"` span. `toggleGapGroupMode` switches text to "Groups per page:" (with tooltip) when on, reverts to "Rows per page:" when off.
- Added Playwright spec asserting label text toggles correctly. All 19 tests pass.

### Banding visual rework (dark-theme tuning)
- Removed per-group hue-tinted row backgrounds. Replaced with luminance zebra (`gap-group-alt` on alternating groups) + seam (`gap-group-seam` on first row of each group).
- Paired spines now use `GAP_GROUP_PALETTE` inline `border-left-color`; orphan spines use `#64748b` slate.
- Hover highlight updated: `outline: 1px solid rgba(167,139,250,0.7)` + `background: rgba(139,92,246,0.10)` (no bright fills).
- Added banding visual spec to `e2e/gap-phase4.spec.js`: asserts palette spine colors for paired rows, slate for orphans, alternating `gap-group-alt`, adjacent-paired-different-colors. All 18 tests pass.

### Phase 4 — Layout, pair legibility, median clarity
- **Task 0**: Verified help prefix (already 1,2,3,7,8), privacy text (already synced), median convention (already documented). All pre-existing from earlier sessions.
- **Task 1**: Widened all three module workspaces to `max-w-[1680px]` (Optimizer: was `max-w-6xl`, Onboarding: was `max-w-[1600px]`, Gap Analyzer: was `max-w-7xl`). Gateway card grid left centered.
- **Task 2**: Added `title` tooltip and `signing → verification handoff` caption to the time-to-verify tile.
- **Task 3**: Paired pills now show `P{N} · Paired` with `data-pair-id="{pairId}"`. Orphan pills unchanged.
- **Task 4**: Hover cross-highlight via `mouseover`/`mouseout` delegation on `tbody`. Partner row gets `gap-pair-highlight`, others get `gap-pair-dim`. Off-page partner shows `(partner on page N)` in tooltip.
- **Task 5**: Group-by-pair toggle (`gapGroupMode`) with `data-pair-group` keys. Group pagination (`Showing A–B of G groups (R rows)`), representative-row sort, Okabe–Ito banding (8 hues + neutral orphans).
- **Task 6**: Help drawer Data Table section updated. Memory doc §2.4, §5.58–60, §9.9–13 updated.
- **Task 7**: `e2e/gap-phase4.spec.js` with 6 specs: workspace width, TTV tooltip, pair ID pills, grouping (9 groups), grouped sort monotonicity, hover highlight. All 17 tests pass.

### H10: FIFO pairing rule
- **Change** — `pairGapCalls()` changed from last-in-wins (stack/LIFO) to first-in-wins (queue/FIFO). Each verification now pairs with the earliest unmatched signing within the window; signings older than the window are evicted as unverified. Rationale: order-preserving matching recovers true pairs in dense same-key bursts where the earliest signing is the true caller.
- **Counts unchanged** — pairing counts, match rate, duplicate count are all unaffected (only partner assignment changes). TTV median shifts because the retry pair's ttv changes (e.g. 500ms→800ms for the test dataset).
- **Help drawer** — algorithm line updated to "first-in-wins (FIFO)" wording.
- **Test update** — `e2e/gap-phase3.spec.js` retry test renamed to "first-in-wins"; TTV assertions updated to reflect new median values.

### Pairing window calibration
- Pairing window calibrated against real EDR (41 calls / 82 events): 500ms = 49.1% (resolution artifact), 1000ms = 100%. Default 1000ms confirmed; no longer provisional.

### Documentation & help-text hygiene (post-Phase 3)
- Fixed help drawer UK prefix line: changed "must be 1, 2, or 7 (the only allocated UK prefixes)" → "must be 1, 2, 3, 7, or 8". Also fixed the `<th>` title tooltip at the same line.
- Synced memory doc §5.47, §2.4, and §2.6 privacy text from "Your data never leaves your browser" to the actual HTML: "Private by design — your call data is processed entirely in this browser and never sent to a server."
- Documented median convention in §5.57: upper-middle value for even-count samples (e.g. `[400,500,600,1500]` → `600`), not the standard statistical median.

### Duplicate Detection (Gap Analyzer)
- **Service classification fix** — `processGapData()` changed `svc.includes('signing')` → `svc.includes('sign')` to match `"sign"`, `"SIGN"`, etc.
- **Duplicate detection** — after `pairGapCalls()` pairing loop, any `unverified` signing that has a `paired` signing with the same key is reclassified as `pairStatus = 'duplicate'`. New `duplicates` count added to `gapPairSummary`.
- **UI additions** — "Duplicates" stat block (blue pill, `gap-pair-duplicates` testid) added to pairing panel. Pair Status filter dropdown gains "Duplicates" option. Table pill rendering adds blue `bg-blue-900/50 text-blue-400` style for duplicate. Export summary line includes duplicate count.
- Created `e2e/gap-dup.spec.js` with 5 specs: duplicate signing detected, duplicate pill shown, filter includes duplicate option, drillDownPair shows duplicate rows, export CSV includes duplicate in summary.
- Created `test_gap_dup.csv` with test data for duplicate detection (2 signings + 1 verify for same key within 1000ms window).
- Updated Phase-3 tests: unverified count 3→2 (one reclassified as duplicate), widening window unverified 2→1.

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

### Phase 3 — Event Pairing
- **Task 0: Settings button fix** — root cause: HTML `onclick="openGapSettings()"` passed no arguments; JS `headers.find()` on `undefined` crashed before modal `classList` toggle. Fixed with `gapRawHeaders` fallback.
- **Task 1: pairGapCalls engine** — greedy stream matching on `(from, to)` key within `gapPairWindow` (default 1000ms). Assigns `row.pairStatus` (paired/unverified/unsigned/unpairable/duplicate), `row.pairId` (P1, P2…), `row.timeToVerify` (ms). After pairing, unverified signings with a paired signing on the same key are reclassified as `duplicate`. Computes `gapPairSummary` (match rate, counts including duplicates, median/P95, invalid cross-tabs). Runs on full `gapData`, not filtered subset.
- **Task 2: Call Pairing panel** — full-width panel below metric tiles with 6 stat blocks (match rate, unverified, unsigned, duplicates, unpairable, time-to-verify) + correlation line. Clickable blocks via `drillDownPair(status)`. Global (not filtered).
- **Task 3: Table Pair column** — 10th column with colored pills (green/red/amber/blue/gray for paired/unverified/unsigned/duplicate/unpairable) and tooltips. Pair Status dropdown filter added to filter bar with duplicate option. `applyGapFilters()` checks it; `resetGapFilters()` and `drillDownGap()` clear it.
- **Task 4: Configurable pairing window** — number input in Settings modal; `handleGapPairWindowChange()` re-runs `pairGapCalls()` and re-renders panel + table. Persists for session.
- **Task 5: Export + help** — CSV export includes pairStatus, pairId, timeToVerify columns + pairing summary line with duplicate count. Help drawer gains Call Pairing section (heuristic explained, algorithm, statuses including duplicate, window). Dashboard Metrics section updated to reference pairing panel.

### Phase 2B hotfix
- **H8: drillDownGap outliers uses threshold** — `drillDownGap('outliers')` set `procMin.value = '100'` (hardcoded). Changed to `procMin.value = String(gapSlowThreshold)` so the drill-down respects the user-configured threshold.
- **H9: Settings button root cause** — `openGapSettings()` called with no arguments from the button's `onclick`; `headers.find()` on `undefined` threw TypeError before the modal opened. Fixed by adding `if (!headers) headers = gapRawHeaders;` fallback at function entry.

### Phase 2B — Exploration Polish
- **P2.5: Privacy messaging** — shield icon + "Private by design — your call data is processed entirely in this browser and never sent to a server." text added below the upload drop-zone in the Gap Analyzer module.
- **P2.4: Filtered-view indicator** — when any filter is active, a slim strip (`gap-filtered-strip`) appears above the metrics grid showing global (unfiltered) counts per metric as "N of M" with `title` tooltips, plus a Reset Filters button. Global values computed in `updateGapMetrics()` by counting against `gapData` when `isFiltered` is true. Strip hidden when no filters active.
- **P2.6: Configurable slow threshold** — `gapSlowThreshold` global (default 100), number input in Settings modal, `handleGapThresholdChange()` updates tile label, chart annotation line + `suggestedMax`, and re-renders data. Annotation label dynamically shows `"{threshold}ms Threshold"`.
- **P2.3: Chart → table drill-through** — `row.bucketKey` derived in `processGapData()` (ISO hour or `'__unknown__'`). `gapBucketOrder` stores label order. All four charts gain `onClick: chartClickHandler` resolving x-index → bucket key via `gapBucketOrder[idx]`. `toggleGapBucket(key)` sets/clears `gapBucketFilter`; `applyGapFilters()` checks it. Removable chip in filter bar shows active bucket. `resetGapFilters()`, `drillDownGap()`, `resetGapMetrics()` clear bucket filter.

### Phase 2A hotfixes
- **H3: Unknown time bucket** — invalid-time rows now go to an explicit "Unknown" bucket (always last) in all four charts instead of being excluded. Chart bucket totals must equal tile totals.
- **H4: 100ms threshold visibility** — Processing Time chart y-axis `suggestedMax: 100` ensures the dashed annotation line is visible when all averages fall below 100ms.
- **H5: Net vs. per-hour labeling** — Gap Count tile caption appends "net" (e.g. "−1 net · unsigned verifications"); Gaps Over Time subtitle prefixed with "Per hour:".
- **H6: Help-text sync** — Gap Analyzer help drawer's Dashboard Metrics section updated: "Gap (Missing)" → "Gap Count" with signed description and per-hour chart reference; Processing Time Distribution entry appends threshold-line mention.
- **H7: Directional tooltip labels + vocabulary alignment** — Gaps Over Time chart gains `tooltip.callbacks.label` formatting by sign: "+N · signed but not verified" / "−N · verified but not signed" / "0 · balanced". Tile caption, subtitle, and help drawer Visualizations section aligned to the same phrasing (replacing "missing verifications"/"unsigned verifications").

### Phase 2A — Diagnostic Foundations
- **Task 1: Timestamp parse guard** — `processGapData()` parses each row's time into `row.timestamp` (ms epoch) + `row.timeValid` flag. 10-digit → epoch seconds, 13-digit → epoch ms, otherwise `new Date()`. Invalid timestamps: counted in tiles, excluded from time-bucketed charts, amber icon in table, sort to bottom. Summary toast appends "· N unparseable timestamp(s)".
- **Task 2: Signed directional gap** — Gap Count tile shows signed value with dynamic caption (positive = "missing verifications", negative = "unsigned verifications", zero = "balanced"). Gaps Over Time converted from line to bar chart: red above zero, amber below, dashed zero baseline via annotation plugin. Subtitle added.
- **Task 3: Invalid-reason breakdown** — `gapReasonBucket()` maps `ukValidationReason` strings to six buckets via keyword matching. Full-width panel below metrics grid with clickable chips; sets `gapInvalidReason` global for filtering. Export CSV includes breakdown line. Help drawer updated.

### Phase 1 F1 (parse errors)
- `parseGapCSV` returns `{headers, rows, errors}`. Errors collected for empty rows and short-row padding. Count surfaced in summary toast as "· N skipped" when > 0.

### Phase 1 documentation cleanup (D1–D3)
- **D1:** §5 Global decisions renumbered 38–42 (collision with Phase 1 Gap decisions 33–37 resolved).
- **D2:** Stale "Fix the chart annotation" recipe removed from §13 (plugin now loaded).
- **D3:** §4 file-map ranges rewritten from actual line numbers (1–305 through 3361–4095).

### Phase 1 hotfixes
- **H1: Verification predicate widened** — `isVerify` changed from `svc.includes('verify')` to `svc.includes('verif')` (stem match). `'verification'.includes('verify')` is false (`"ication"` ≠ `"y"`); `'verification'.includes('verif')` is true. Fixes `Verification` service value being uncounted.

### Phase 1 Hardening (T1–T7)
- **T1: RFC-4180 CSV parser** — replaced `text.split("\n")` + `text.split(",")` with a single-pass state machine (`parseGapCSV`): BOM stripping, quoted commas, quoted newlines, CRLF, `""` escape, empty/short-row padding. Shared `readGapFile(file)` for both picker and drag-drop. Empty/header-only/zero-data error toasts added.
- **T2: Case-insensitive service classification** — `processGapData()` now uses `const svc = (row.service || '').toLowerCase()` for `isSigning`/`isVerify`; `row.service` unchanged for display. Fixes `Signing`, `VERIFY`, mixed-case values.
- **T3: chartjs-plugin-annotation@3.0.1** — CDN added after Chart.js script tag. 100ms dashed threshold line now renders.
- **T4: Remove duplicate toast** — deleted second `showToast("Data analyzed successfully!")`; only descriptive summary toast remains.
- **T5: Non-mutating sort** — `renderGapTable()` sorts `[...gapFilteredData]` (shallow copy) instead of mutating `gapFilteredData` in place.
- **T6: Drag-and-drop upload** — upload zone accepts drag-and-drop with violet glow visual feedback. Both picker and drop call `readGapFile()` → `handleGapCSVUpload()`. CSV MIME/extension validation added.
- **T7: Skip link fix** — `showModule()` assigns `id="main-content"` on the active module element and removes it from others. All module roots have `tabindex="-1"`. `role="main"` removed from gateway.

### Anomaly detection removed (user decision — latest change)
- Deleted `detectGapAnomalies()`, `gapAnomalies`, the Anomalies tile, the anomalies panel, `toggleGapAnomaliesDetails()`, the help section, and all text references. Six tiles + Gap Percentage remain.

### Table & UI
- 9-column alignment; native tooltip for UK Valid; responsive 3-card gateway; humanized chart labels; stacked volume chart; export simplified to CSV-only with metrics summary; Gap footer added; Settings/Export disabled until data loads; descriptive toasts; column auto-detection; `drillDownGap` reset-first behavior; export field names fixed.

### UK validation rewrite
- Scientific notation recovery; Excel `+`-strip recovery; `slice(3)` → `slice(2)` bug; sequential-run detection rewritten to scan the entire number (caught `+447123456789` and `7700123456`).

### Critical fixes (app was broken)
- **Chart.js CDN missing** — added `chart.js@4.4.1`; gap charts were silently failing.
- **`processGapData` crash** — the Invalid Numbers chart referenced a variable renamed when the volume chart split into signing/verify datasets; added `invalidTotal`.
- **Function name mismatches** — 7 `sortGapTable()` → `handleGapSort`; 2 `changeGapPage()` → `handleGapPagination`.
- **Pagination element IDs** — JS `gap-pagination-prev/next` vs HTML `gap-prev-btn/next-btn`; aligned JS to HTML.
- **`row.serviceType` → `row.service`** — service column rendered undefined.
