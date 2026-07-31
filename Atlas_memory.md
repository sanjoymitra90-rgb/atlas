# ATLAS — Developer Memory & Architecture Guide

## 1. What ATLAS Is

ATLAS is a single-file (`index.html`), zero-build, vanilla HTML/JS/CSS application for **infrastructure planning and cost assessment**. No frameworks, no bundler, no backend. All state is global; all rendering is direct DOM manipulation.

**Three modules, one file:**
- **Cell Placement Optimizer** (green) — Determines optimal AWS infrastructure placement based on SLA latency requirements. Uses haversine distance, tier tax, and a greedy cost-effective coverage algorithm.
- **Onboarding Calculator** (blue) — Scopes engineering hours via an interactive DHTMLX Gantt timeline with automated financial quoting (internal cost + customer price).
- **Gap Analyzer** (violet) — Uploads CSV EDR (Event Detail Record) call data, maps columns, validates UK destination numbers, detects anomalies, and renders Chart.js visualizations.

## 2. Tech Stack (CDN, No Build)

| Dependency | Purpose |
|---|---|
| Tailwind CSS | Styling |
| Font Awesome | Icons |
| Leaflet.js | Mapping (Optimizer) |
| DHTMLX Gantt | Timeline (Onboarding) |
| Chart.js 4.4.1 | Charts (Gap Analyzer) |
| html2pdf.js | PDF export |

**CSV parsing:** Hand-rolled `.split(",")` — does NOT use PapaParse. Handles basic CSV; does not handle quoted commas.

## 3. Architecture

- `showModule(name)` swaps visibility between `#module-gateway`, `#module-optimizer`, `#module-onboarding`, `#module-gap-analyzer`.
- `currentAppModule` tracks active view. Help drawer (`openHelpDefault`) auto-selects the relevant tab.
- Gateway page shows 3 cards (2-column on medium, 3-column on large screens).
- All modules share a floating help button and a slide-out help drawer with per-module tabs.

## 4. Audit Trail — Substantive Changes Made

### Critical Fixes (Application Was Broken)
- **Chart.js CDN missing** — Added `chart.js@4.4.1`. Gap charts were silently failing.
- **`gap-anomalies-count` element missing** — `detectGapAnomalies()` crashed on `getElementById` returning null. Added `<span>` element.
- **`processGapData` crash** — CSV upload + Analyze did nothing. Root cause: the "Invalid Numbers Over Time" chart referenced an `invalid` variable that was renamed when the volume chart was split into signing/verify datasets. Added `invalidTotal` computed from `signingInvalid + verifyInvalid`.
- **HTML/JS function name mismatches** — 7 `onclick="sortGapTable()"` handlers pointed to non-existent function (actual: `handleGapSort`). 2 pagination buttons called `changeGapPage()` (actual: `handleGapPagination`). Fixed all to match JS definitions.
- **Pagination element IDs wrong** — JS referenced `gap-pagination-prev/next` but HTML had `gap-prev-btn/next-btn`. Fixed JS to match HTML.
- **`row.serviceType` → `row.service`** — Table body rendered undefined for the service column.

### UK Number Validation (Complete Rewrite)
- **Scientific notation fix** — CSV exports from Excel produce `4.47305E+11` instead of phone numbers. Added `normalizePhoneNumber()`: detects `E+`/`e+`, converts via `Number()`, prepends `+`.
- **Excel `+` stripping fix** — When phone columns are formatted as "Number" in Excel, `+447305409280` becomes `447305409280`. Added regex `/^44\d{9,10}$/` to detect and re-prepend `+`.
- **`from` number normalization** — Applied same normalization to the From column for display, but no validation (defaults to valid).
- **`slice(3)` bug** — Validator used `digits.slice(3)` to skip `+44`, but `digits` (after `replace(/\D/g, "")`) doesn't contain `+`, so `44` is only 2 chars. Fixed to `slice(2)`.
- **Sequential digit detection rewritten** — Old check started at wrong position and only detected ascending sequences from a fixed index. New version scans the full number for any run of 5+ consecutive ascending digits (catches `+447123456789`).
- **Validation rules** — Hard: E.164 format, length 11-13 digits. Pattern: not all identical, no 5+ sequential runs. Soft: first digit after `+44` must be `1`, `2`, or `7`.

### Table & UI Fixes
- **Column headers fixed** — Headers didn't match body columns. Source IP showed "Proc. Time", processing time showed "UK Valid", Status header was missing entirely. Now all 9 columns align correctly.
- **Anomalies column removed** — Per user request. Processing time >100ms is visible in the Proc. Time column; anomaly flags were redundant.
- **UK Valid info icon** — Native `title` tooltip (replaced custom hover div that was clipped by table `overflow-hidden`).
- **Gateway layout** — Changed from 2-column `max-w-4xl` to responsive `sm:grid-cols-2 lg:grid-cols-3 max-w-6xl` with `pb-32` to prevent footer overlap.
- **Export button** — Removed `disabled` attribute. Added `toggleGapExportMenu()` function and click-away handler for the dropdown.
- **Help drawer** — Added Gap Analyzer tab button and 7-section help content (Overview, Upload, Metrics, Table, Charts, Anomalies, UK Validation). Updated `switchHelpTab()` and `openHelpDefault()` to handle 3 tabs.

### Chart Fixes
- **Charts growing infinitely** — Chart.js `responsive: true` + `maintainAspectRatio: false` needs a parent with fixed height. Wrapped each `<canvas>` in `<div style="position:relative;height:200px;">`.
- **Canvas ID mismatch** — HTML had `gap-chart-proctime`, JS looked for `gap-chart-processing`. Fixed HTML.
- **Stacked bar chart** — Volume chart now has 4 datasets with separate stacks: Signing Valid (blue), Signing Invalid (orange), Verification Valid (green), Verification Invalid (orange). Each service type is its own bar with valid/invalid stacked internally.

### Auto-Detection
- **Column mapping pre-fill** — `openGapSettings()` now matches CSV headers against keyword lists (e.g., "time", "timestamp", "date" → Time column). Pre-selects matching dropdowns automatically.

### Tile Drill-Down
- **`drillDownGap()` rewritten** — Now resets all filters first, then sets the relevant one. Handles: total (reset all), signing, verify, invalid (sets validation filter), outliers (sets processing min to 100ms).

## 5. Things Deliberately Avoided

- **PapaParse** — Referenced in old docs but never loaded. CSV parser is hand-rolled. PapaParse would handle quoted commas, escaped fields, and edge cases better, but was not added to keep the single-file approach simple.
- **Domestic number formats (`0044`, leading `0`)** — These are ambiguous UK dialing formats. EDR exports from telecom systems should already be in E.164 international format. Handling domestic formats would mask dirty data.
- **Full Ofcom allocation validation** — UK number ranges change frequently. Validates structural rules (format, length, prefix) rather than checking against a live allocation database.
- **Backend / persistence** — All analysis is browser-local. No data leaves the machine. This is intentional for security (call data is sensitive).
- **Geographic maps and scatter plots** in Gap Analyzer — Excluded to focus on time-series trends and distributions relevant to EDR analysis.

## 6. Known Limitations

- CSV parser doesn't handle quoted commas or multi-line fields.
- Anomaly detection runs but results are not displayed in the table (column removed). The `detectGapAnomalies()` function still sets `anomalyFlags` on rows internally.
- The `gap-metric-anomalies` tile shows a count but clicking it doesn't filter the table (no filter mapped for anomalies).
- The Gap Analyzer help content sections use `scrollToSection()` which requires matching `id` attributes on the help sections.
