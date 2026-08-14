# ATLAS — Changelog

Historical record of substantive changes, newest first. This file is **history only**.
It describes what changed and when; it does **not** describe how the app works today.
For current behaviour see `SPEC.md` (engineering) and `FEATURES.md` (product).

If a statement here contradicts `SPEC.md`, `SPEC.md` wins — this file is not maintained
to stay true, only to stay complete.

**Last updated:** 2026-08-14 (Phase 6: tokens, dead code, changelog repair, Endpoint→Service Provider, toast repositioning)

---

### Phase 6 — tokens, dead code, changelog repair, Endpoint→Service Provider, toast repositioning, help drawer

Spec: `2026-08-13-phase-6-spec.md`. Commits: (in progress).

**Task A — toast returns to top-right with pointer-events: none.** Moved from bottom-left back to
top-right; `pointer-events: none` added so clicks pass through to header buttons. The 5A
clickability test passes unmodified.

**Task B — Endpoint → Service Provider in Optimizer.** 46 display-text occurrences renamed; export
keys (`totalEndpoints`, `Endpoint Name` CSV headers) left unchanged. The Optimizer's one
"cost-per-customer" became "cost-per-service-provider". Onboarding genuine "customer" untouched.

**Task C — --gap-* CSS tokens renamed to --atlas-*.** All 27 custom properties renamed across
definitions, CSS references, inline styles, and JS reads. Other modules' hardcoded near-matches
left alone and reported.

**Task D — dead light-theme CSS deleted.** 12 `[data-theme='light']` rule blocks removed after
confirming nothing reads or writes `data-theme` outside them.

**Task E — changelog two colliding eras separated.** Original-era headings prefixed with "Legacy";
current-era entries unchanged.

**Task F — help drawer brought up to date.** (To be completed.)

**Task G — three one-line leftovers.** E2e timezone pinned to UTC; bucketing test gains year
boundary; zero-count trap in gap-layout.spec.cjs guarded.

### Phase 5B — Call Auditor display copy: Customer → Service Provider

Spec: `2026-08-13-phase-5b-spec.md`. Commits: `2dbef8b`, `5722f8f`, `0a05dee`, `af43f25`.

**Task A — Customer renamed Service Provider (breaking).** The Call Auditor's display text for the
provider column now reads "Service Provider": the table header, filter-bar label, column-header
filter dropdown label, "All Service Providers" default option (bar and column dropdown, static and
populated), the column-mapping label ("Service Provider Column") and the User Guide copy. The
rename is display-only — field keys (`customer`, `gap-filter-customer`, `col-filter-customer`),
testids and classes are unchanged, so filtering, sorting and the column-mapping "customer" key
behave exactly as before. **Breaking:** the CSV export data header row renames the column
`Customer` → `Service Provider`; scripts reading the old header will find nothing. A one-line note
in the export's metrics summary block names the old header, the new header, and that scripts must
be updated. The Gateway, Onboarding, Optimizer and their docs keep "customer" (real customers).
`e2e/gap/gap-rename.spec.cjs` proves the header and export carry the new label, that filtering by
value still works (display text is not the selection key), and that Onboarding/Optimizer still say
"customer". Proven red before the change: the header and export assertions failed against the
unmodified build.

**Task B — Status response-code tooltip.** The Status column header and the filter bar's
"Status Code" label now carry a small info-circle tooltip (`title="service provider response
code"`) explaining what the values are, following the Time-to-verify tile pattern. The
column-header filter dropdown's "Status Code" label deliberately carries no icon. Containment
guard (`e2e/gap/gap-containment.spec.cjs`) re-run after the change: no markup was added outside
the table header and the filter bar. `e2e/gap/gap-status-tooltip.spec.cjs` proves both sites,
proves the dropdown label stays icon-free, and proves the tooltip survives a re-render after a
sort and a filter change (B3); it failed (red) against the pre-change build.

**Task C — copy sweep (four fault classes).** All changes are display text only; the behaviour
contract (filter/sort/mapping keys) is unchanged.

1. **Same concept, two vocabularies.** The export's invalid-reason breakdown line said
   "Invalid breakdown" and used raw bucket keys (`wrong-length ×2`), while the chips and the
   metric tiles use `bucketLabels` and "Destination Issues". The export now writes
   "Destination issues breakdown" and maps keys through `bucketLabels`, so the export, the chips
   and the tiles describe the same buckets in the same words.
2. **Empty states that said nothing about what to do.** The table's "No data to display. Upload a
   CSV file to begin analysis." is now two messages chosen by `gapData.length`: before any data it
   still points at upload; when a filter excludes every row it says to adjust or clear the filters.
   The same split applies to "No data to export" and to "No data rows found in CSV file" /
   "Failed to parse CSV file", which now say to re-upload (and to check the format).
3. **Toasts that fired on the normal case.** The upload toast ("Analyzed N rows") and the analysis
   toast ("N records analyzed …") fired on every clean import. The upload toast now fires only
   when duplicate column names were renamed; the analysis toast only when rows are invalid,
   skipped, or have unparseable timestamps — a clean import is silent. SPEC.md invariant 9
   amended to match.
4. **Test-infrastructure fixes.** `e2e/gap/gap-toast.spec.cjs` now uses `gap-invalid-reasons.csv`
   (which triggers the conditional analysis toast) instead of `gap-screenshots.csv`.
   `e2e/gap/gap-copy-sweep.spec.cjs` proves all four fixes and was proven red against the
   pre-change build. New fixture `fixtures/gap-clean.csv` (a fully valid import) proves a clean
   import shows no toast. `e2e/gap/gap-fab.spec.cjs` was hardened: it waited only for the toast
   to lose `.show` and measured mid-transition while the toast still overlapped the Call Pairing
   blocks, and it counted the permanently closed off-screen help drawer as an offender by a
   0.5px viewport-edge overlap. It now waits for the toast to leave the viewport and skips
   off-screen fixed elements.

**Task D — copy-dependency search re-run (clean).** Re-ran the §2 search across `index.html` and
`src/` after Tasks A–C: every comparison or substring match against a string literal is an internal
enum/identifier value (module names, SLA mode, view mode, pair status, bucket interval, column keys),
a keyboard key or tag name, or a data-driven read of the *user's* CSV (service-column
`svc.includes('sign')` / `svc.includes('verif')`, header-keyword autodetection, the region search,
the `.csv` extension check). No code compares against, or substring-matches, any user-editable copy —
including the strings renamed or reworded in this phase.

---

### Phase 5A — containment guard, copy-proofing, layout hardening, Time-column source rule

Spec: `2026-08-13-phase-5a-spec.md`. Commits: `0b7165c`, `0d6f075`, `771b9ec`, `f228fb8`,
`7110be0`, `d1c80b9`, `d900471`, `96d69d7`, `e18cbdb`, `4631a20`, `b5663d9`, `d792694`,
`a264ede`, `9c51f57`, `27c5a92`, `36b8121`, `a9bab11`.

**Containment test (written first, §4).** `e2e/gap/gap-containment.spec.cjs` loads the built HTML
and asserts programmatically that the table body, table wrapper, metric-tile grid, invalid-reason
panel, and charts grid are all descendants of `#gap-dashboard`, and that no table is visible before
a file is uploaded. Passed on the unmodified build before any 5A change.

**Task A — Project Coordination matched by stable id, not name.** `generateGanttStateFromTasks()`
selected `t.name === 'Project Coordination'` (two sites); a rename broke spanning. Now matches
`t.id === 't9'`. `e2e/onboarding/onb-coordination.spec.cjs` renames t9 to "Something Else Entirely"
and asserts its span (start day 1, end = max of others) survives. Proven to fail on the old code.
A search of the codebase for other copy-dependent logic found only data-driven matches
(`svc.includes('sign')`, header keyword autodetect, region search, `.csv` check) — none break on
copy changes.

**Task B — toast no longer covers header controls.** `.toast` moved from top-right
(`top: 24px; right: 24px`) to bottom-left (`bottom: 24px; left: 24px`, slide-in from the left).
`showToast()` signature, 3 s auto-hide timer and `.show` transition are unchanged. All 43 call
sites verified. `e2e/gap/gap-toast.spec.cjs` proves the header Export button is *clickable*
(element-from-point) while the toast shows, and that a real click opens the modal — it failed
against the old top-right position and passes now.

**Task C — help FAB kept on Gateway, hidden elsewhere.** The FAB overlapped the Call Pairing
blocks at default scroll (1440×900); per product decision it stays on the Gateway (its only help
entry) and is hidden in Call Auditor, Onboarding and Cell Optimizer via `showModule()`.
`e2e/gap/gap-fab.spec.cjs` asserts no visible fixed element overlaps the pairing blocks after the
toast hides; `e2e/gap/gap-fab-visibility.spec.cjs` covers per-module visibility. `gap-core.spec.cjs`
help test now clicks the header "User Guide" button instead of the FAB.

**Task D — collapsible filter panel.** The nine filter controls now sit in `#gap-filter-panel`
with a toggle button (`#gap-filter-toggle`, chevron, `aria-expanded`) and an active-filter count
badge (`#gap-filter-count`). The panel is collapsed by default after data loads; the open/closed
state persists for the session via `sessionStorage['atlas-gap-filter-collapsed']` (deliberately not
localStorage). Collapsing is presentation-only — `gapFilteredData` is untouched (test-proven).
`applyGapFilters()` and `clearGapFilterInputs()` refresh the count; `resetGapFilters()` returns it
to zero. `e2e/gap/gap-filter-panel.spec.cjs` (3 tests). Five existing tests that drove the filter
bar assumed it was always expanded; `expandGapFilters()` helper added to `e2e/_helpers.cjs` and
called before filter-bar interaction in gap-core/gap-charts/gap-dup/gap-pairing/gap-review.

**Task E — metric tiles reflow to two full rows of three.** Six tiles in `lg:grid-cols-4`
left an orphaned half-row (4+2). Chose `lg:grid-cols-3` (2 rows of 3) — the only factorisation of
6 that fills every row at lg, keeping tiles ~453 px wide at 1440 viewport. All `gap-metric-*` ids
and `gap-tile-*` testids unchanged; drill-down handlers untouched. `e2e/gap/gap-tiles-reflow.spec.cjs`
reads tile bounding boxes and asserts rows of exactly 3 with matching columns; fails against the
4-across build.

**Task F — denser table rows.** Body cells `py-3` → `py-1.5` (both `renderGapTable()` branches),
horizontal `px-4` unchanged. At 1440×900, 25-row pages went from 23 rows in viewport (45 px/row)
to all 25 (33 px/row). Legibility held: amber invalid icon 14×14 px, pills 23 px tall in 33 px
rows, no horizontal overflow. `e2e/gap/gap-density.spec.cjs` pins density and legibility; fails
against the old `py-3` build.

**Task G — theme toggle removed; persisted light is inert.** The header theme toggle is gone,
and `toggleGapTheme()`/`initGapTheme()` are deleted, so a user who previously saved `light` in
`localStorage['atlas-gap-theme']` is no longer stranded: the value is ignored and every load
renders dark. `[data-theme="light"]` CSS stays in place (Phase 6's business). `gap-theme.spec.cjs`
rewritten: no theme control reachable, persisted `light` ignored (attribute absent, value
survives), and a post-analysis check confirms dark rendering. All three fail against pre-G code.
`e2e/screenshot.js` updated (no toggle to click).

**Task H — Time column echoes the source when nothing was converted.** The old
`utc !== raw && utc + 'Z' !== raw` string comparison fired the tooltip on nearly every Z-suffixed
row. `formatGapTimeCell()` now decides from the parsed value: it parses the source as the clock
time it states and compares that instant to `row.timestamp`. Same instant → source rendered
verbatim, no tooltip (Z-suffixed and offset-less rows). Differing instant → converted UTC plus a
`source:` tooltip (epochs and `±HH:MM` rows). `timeValid === false` rows and the export are
unchanged. `e2e/gap/gap-time-verbatim.spec.cjs` covers all four formats × grouped/flat, and the
XSS fixture stays escaped in both modes (serialized `&lt;img`, no live element). 10 tests,
all failing against the pre-H build. The XSS tests are timezone-independent: the non-ISO payload
reaches `new Date()` (documented local-time parsing), so on a UTC runner it renders verbatim as
escaped text while elsewhere it converts to UTC with a source tooltip — both asserted safe.

**Verification.** Containment assertion re-run on the final build (passes). `test:unit` and
`test:unit:dhaka` green (107 each). Full e2e: 214 tests pass (154 gap + 60 optimizer/onboarding).
Actions is green — [final run](https://github.com/sanjoymitra90-rgb/qwen-test-atlas/actions/runs/31812498308)
(success): unit, unit:dhaka, build, e2e and the Pages deploy all pass, site live at
https://sanjoymitra90-rgb.github.io/qwen-test-atlas/. Geometry tests (`gap-density`,
`gap-tiles-reflow`) were made OS-robust for the Linux runner (`d792694`). Before/after
screenshots in `screenshots/5a-before` and `screenshots/5a-after`.

---

### Phase 4.9 — grouped-sort invariant, timezone-provable bucketing, three blind tests, doc corrections

**Task A — invalid timestamps sink in grouped mode (bug fix).** The grouped sort comparator in
`renderGapTable()` never tested `timeValid`, so ascending time sort put unparseable rows (null
timestamp → `0`) at the top. The flat branch already honoured invariant 8; the grouped branch now
gets the same `timeValid` precedence before any column branch. Four-way order table
(flat/grouped × ascending/descending) verified before and after: three orders already sank invalid
rows, grouped-ascending was the outlier and now matches. e2e regression test
`e2e/gap/gap-invalid-sort.spec.cjs` loads `gap-core.csv` (1 unparseable row), enables group mode,
sorts time ascending, asserts amber rows are last. Proven to fail on the reverted fix and pass
after. **Conclusion:** invariant 8 applies to `pairStatus` and `ukCategory` columns too — the flat
comparator already enforced timeValid-first for all columns, grouped now matches by placing the
check before column branches.

**Task B — timezone-provable bucketing.** Added `src/auditor/buckets.tz.test.js` covering
`getGapBucketKey()` and `formatBucketLabel()` across all four intervals, using the same
child-process-under-forced-TZ harness as `time.test.js`. A midnight-crossing instant (18:30Z, which
is 2024-01-16 in Asia/Dhaka) is the discriminating input. Self-verifying assertion included: a
local-time read of that instant differs between UTC and Asia/Dhaka, so the harness cannot pass
vacuously. Proven: `getUTCHours()` → `getHours()` in `formatBucketLabel()` went red under both
zones ('Jan 15, 18:00' vs 'Jan 15, 0:00'), restored, green. **Environment hardening:** `test:unit:dhaka`
script (cross-env `TZ=Asia/Dhaka vitest run`) added to `package.json`, and `deploy.yml` runs it
after the UTC run. `cross-env` added as devDependency. 94 unit tests green under both zones.

**Task C — three blind tests.**
- **C1 financials:** `internalCost` derives from `billableHours` (which includes contingency hours);
  no test asserted the money, so switching it to `totalHours * rate` broke nothing. Added 4 tests
  asserting `internalCost` and `customerPrice` at non-zero contingency, including the margin
  interaction. Proven: changing to `totalHours * rate` failed 3, restored, green.
- **C2 geo:** `haversine()` had no test file; changing Earth's radius 6371→1 left the suite green.
  Added `src/optimizer/geo.test.js` with known great-circle distances (London–Paris ~344 km,
  London–NYC ~5570 km, London–Sydney ~16994 km, Tokyo–Sydney ~7826 km, SF–NYC ~4129 km), a symmetry
  check, the zero-distance case, and the antipodal case (~20015 km = π×6371). Proven: radius→1
  failed 6, restored, green.
- **C3 BOM:** the existing BOM test passed vacuously — field `trim()` also removes FEFF from a
  plain header. The discriminating case is a BOM + quoted first header: without the strip line the
  quote is never recognised and the header splits (`["Time","Service"]` from `"Time,Service"`).
  Added a test for it. Proven: removing the strip line failed it, restored, green.

**Task D — six wrong document statements corrected** (code unchanged in all six; each verified by
execution): D1 R8 charts-follow-filter claim removed from §7.1 (contradicted invariant 5); D2 R12
raw-string-sort marker removed from §7.6; D3 R21 duplicate-header marker removed from §7.1 (leave
R20); D4 `{headers, rows, errors, meta}` → `{headers, rows, errors}` in §7.1; D5 triangle-inequality
count 761 → **856** ordered distinct `(i,j,k)` triples (re-derived from `window._matrix`; adjacent
claims 450 asymmetric pairs / max delta 30 ms confirmed unchanged, definition stated in the
sentence); D6 dependency table versions corrected to `package.json` (Chart.js `^4.5.1`, DHTMLX
`^10.0.1`, html2pdf `^0.14.0`), SRI column reworked — only Font Awesome and `@fontsource/inter`
remain CDN stylesheets, the four npm libs are bundled so SRI is n/a, and §1's "six third-party
scripts" updated to four bundled libraries + two CDN stylesheets; D7 CHANGELOG country-code count
47 → 44 (counted `CC_TWO` directly); D8 destination-number-validation-rules.md — `4.47701E+11` is
the **rejected** case (returned unchanged, 6 sig digits vs 12 required), replaced with the
recovering `4.47911223344E+11` → `+447911223344` and documented the deliberate refusal beside it;
all 12 remaining examples re-verified by execution.

**Task E — skipped.** The two open display questions (Time-column display format; tooltip on
unchanged rows) require a product decision that was not supplied, so per spec §6 no change was made.

---

### Phase 4.8 CI fix

- **Timezone-dependent assertion fixed** — The "non-ISO formats still parse via new Date()" unit test hardcoded `1735668000000`, the Asia/Dhaka reading of `Jan 1 2025 (test)`. Under UTC (GitHub Actions) that branch parses to `1735689600000`, so CI failed while the local suite passed. The test now asserts `timeValid` and derives the expected value with `new Date('Jan 1 2025 (test)').getTime()`, which moves with the environment exactly as the function does. `TZ` is not pinned in any config.
- **Timezone-independence test added** — `time.test.js` now spawns the module in a child process under `TZ=UTC` and `TZ=Asia/Dhaka` and asserts identical results for offset-less ISO, `Z`-suffixed, explicit-offset, `D/M/YYYY`, and epoch inputs. A non-ISO input (documented to reach `new Date()`) is asserted to *differ* between the two zones, proving the harness genuinely varies the timezone rather than passing vacuously.

### Phase 4.8 — One time frame, always UTC

**Task A — Parse offset-less input as UTC:**
- **A1: ISO-shaped strings without offset parsed via Date.UTC** — `2026-01-15T10:30:00` now parses as 10:30 UTC instead of local time. Non-ISO formats (e.g. `Jan 1 2025`) continue through `new Date()` unchanged. Exactly one input changed; verified under `TZ=UTC` and `TZ=Asia/Dhaka` with identical results.

**Task B — Time cell renders UTC:**
- **B1: Both branches of renderGapTable() updated** — Grouped and flat paths now use `formatGapTimeCell()` helper which renders UTC-formatted timestamps. When the rendered value differs from the source, an escaped `source:` tooltip shows the original.

**Task C — Export carries both:**
- **C: Export has Time (UTC) and Time (original) columns** — UTC-formatted value in the first column, raw source string in the second. Downstream scripts continue to work unchanged.

**Task D — Tests:**
- **D1: Fixture rows added** — `gap-screenshots.csv` now includes an offset-bearing pair (`+05:30`), an offset-less pair, and an epoch pair. `pairedPairs` unchanged.
- **D1 fix: Epoch rows corrected** — Epoch values moved from `1722504000` (2024-08-01) to `1785586200` (2026-08-01T12:10:00Z). The 2024 value spanned a >3-day range, which forced the auto bucket interval to `1day` and hid hour-granularity on chart axes.
- **D2: Cross-check test** — A5 test extended to verify offset-bearing row (I9 Corp, 12:00:00+05:30 → 06:30 UTC) appears correctly in both table and chart. A5/D2 now parse chart-label hours from `displayLabels` (tolerating 12-hour and 24-hour label formats) instead of substring matching.
- **D3: Timezone-independence** — All 13 unit tests pass under `TZ=Asia/Dhaka` (same results as UTC). The "offset-less parses as UTC" test catches timezone-dependent bugs.

**Task E — Toast and docs:**
- **Toast suppressed** — The "timestamps without a timezone read as UTC" message removed. UTC is now the default behavior, not a warning; the "Time (UTC)" column header makes the assumption explicit.
- **SPEC.md §7.2 rewritten** — Documents UTC-first parsing, source tooltip, and Time (UTC) + Time (original) export columns.
- **FEATURES.md updated** — States all times are UTC, offset conversion is automatic, hovering shows original.

### Phase 4.7 — Timestamp extraction, staleness guard, screenshot harness fix

**Task A — Timestamp parsing:**
- **A2: parseGapTimestamp extracted** — Timestamp parsing moved from inline in `processGapData()` to `src/auditor/time.js` as a pure function. Exposed on `window` via `src/main.js`. Move only, no behaviour change.
- **A4: timeHadOffset epoch defect fixed** — Epoch inputs (10-digit seconds, 13-digit milliseconds) now report `timeHadOffset: true` instead of `false`. Epochs are unambiguous; no timezone assumption was made, so no warning should be triggered. `Date.UTC` branch still reports `false` (genuine assumption).
- **A3: Unit tests** — 11 tests in `src/auditor/time.test.js`: epoch seconds, epoch ms, ISO with Z, ISO with +05:30, ISO without offset, D/M/YYYY H:MM, D/M/YYYY H:MM:SS, unparseable, empty, null, epoch timeHadOffset.
- **A5: Cross-check test** — Playwright assertion that table hour matches chart axis hour for `gap-screenshots.csv` first row (09:00:10Z → hour 9).

**Task B — Staleness guard:**
- **B1: global-setup.cjs guard** — Fails if `dist/index.html` is missing or older than `index.html` or any `.js`/`.css` file under `src/`. Recursive `readdir` with `mtimeMs` comparison. Actionable error message naming the stale file.
- **B2: Guard proven to fire** — Touched `index.html`, ran `npx playwright test` directly, confirmed abort before any test ran with message "dist/index.html is stale (index.html is newer); run npm run build".

**Task C — Screenshot harness:**
- **C1: Fixture changed** — `e2e/screenshot.js` now uploads `fixtures/gap-screenshots.csv` (62 rows, 32 signings, 29 verifies, same-second pairs) instead of `gap-core.csv` (5 signings, 0 pairs).
- **C2: Root screenshots gitignored** — `screenshot-*.png` pattern added to `.gitignore`.

### Phase 4.6 CI fix — stray div, theme test fixture

**Task A — Stray closing tag (bug fix):**
- **Removed extra `</div>`** — When the End-to-End chart was moved outside the two-column grid in Phase 4.6, a closing `</div>` was added for the grid but the original was not removed. This caused `#gap-dashboard` to close early, making the data table visible before any CSV is uploaded.
- **Regression test** — Added "data table is not visible before any CSV is uploaded" to `gap-core.spec.cjs`. Asserts both `#gap-table-body` and `#gap-invalid-reason-panel` are not visible on fresh load.

**Task B — Theme test fixture (stale test):**
- **Switched to `gap-screenshots.csv`** — `gap-core.csv` produces zero paired calls (signing/verification pairs >1000ms apart). The Phase 4.6 empty-state guard correctly hides the TTV canvas. Theme test now uses `gap-screenshots.csv` which has 20+ pairs within the 1000ms window.
- **All seven charts asserted** — Theme test now checks all seven chart canvases: invalid, volume, processing, requests, TTV, pair processing, end-to-end.
- **`gap-screenshots.csv` fixture fixed** — Pairs were 2000ms apart (09:00:10Z → 09:00:12Z), outside the 1000ms window. All pairs now share the same timestamp so they pair reliably.

**Test counts:** 71 unit + 191 e2e = 262 total, all green.

---

### Phase 4.6 — Filter bug, summary row, badge revert, timing charts, build-first

**Task A — Column filter dropdowns trigger sort (bug fix):**
- **`onclick="event.stopPropagation()"`** — added to all 10 `.gap-col-dropdown` elements. Previously, clicking inside the dropdown (select, label, padding) bubbled up to the `<th>` and fired `handleGapSort()`. Now the dropdown stops propagation entirely.

**Task A2 — Group-by-pair summary row missing on first group (bug fix):**
- **Separated `isFirst` into `isGroupStart` and `needsSeam`** — the old `isFirst` flag combined two unrelated conditions (`rowIsFirstInGroup && gi > 0`). The `gi > 0` was correct for the seam (no divider above the first group on a page) but wrong for the summary row, which belongs to every paired group. Now `needsSeam = isGroupStart && gi > 0` and the summary row condition uses `isGroupStart` alone.

**Task B — Revert pairing-key remove button to floating badge:**
- **Restored `absolute -top-1.5 -right-1.5 z-10`** — Phase 4.5 moved the button in-flow, but the `×` then read as a multiplication sign beside the `+` separator. The floating badge was deliberate.
- **Muted styling** — badge is now `bg-slate-600/80 text-slate-300 hover:bg-red-400 hover:text-white` (less alarming than the original bright red circle).
- **Modal header stacking** — header `z-index` raised from `z-10` to `z-20` so it stays above the `z-10` badges when scrolled.

**Task C — Two new timing charts:**
- **Pair Processing Over Time** — median + P95 of `pairProc` (signing + verification processing time). Orange palette (`#f97316` / `#fb923c`). Own bucket and series dropdowns.
- **End-to-End Over Time** — median + P95 of `pairEndToEnd` (signing + handoff + verification). Pink palette (`#ec4899` / `#f472b6`). Full-width card beneath the other charts.
- **Layout** — TTV and Pair Processing side by side (`lg:grid-cols-2`), End-to-End full width below (`lg:col-span-2`). TTV no longer `lg:col-span-2`.
- **Seven charts total** — was five, now seven.

**Task D1 — Timing charts empty state:**
- **`showChartMessage()` guard** — timing charts (TTV, Pair Processing, End-to-End) now check for empty data (no pairs) in addition to bucket count. Message: "No paired calls in the current view."

**Task D2 — Populated fixture rebuilt:**
- **`fixtures/gap-screenshots.csv`** — 63 rows spanning 09:00–11:35 UTC. Multiple records per bucket, mix of valid and invalid destinations, genuine signing/verification pairs with varied handoff (2–7s) and processing times (35–140ms).

**Task D3 — Count axes use integer ticks:**
- **`precision: 0`** — added to y-axis ticks for Requests Over Time and Signing vs Verification Volume charts in both `renderGapCharts()` and `renderSingleChart()`.

**Task F — Build-first scripts:**
- **`package.json`** — `test:e2e`, `test:gap`, `test:optimizer`, `test:headed` all now run `npm run build` before `playwright test`. `test` runs `test:unit` then `test:e2e` (which includes the build).

**Test counts:** 71 unit + 190 e2e = 261 total, all green.

---

### Phase 4.5 — CI fix, missing tests, screenshot harness, UI defects

**Task A — CI fix (TTV test):**
- **`gap-flexibility.spec.cjs` TTV test** — test expected canvas to be visible, but Phase 4 Task D correctly hides it when there's only one bucket. Fixed to assert canvas is attached AND either canvas or empty-msg is visible.
- **Dark theme test** — updated `paddingRight` threshold from 30 to 20 to accommodate `.atlas-select-sm` (1.75rem = 28px).

**Task B — Phase 4 required tests added:**
- **Colour distinctness** — asserts Volume chart has 4 datasets with 4 distinct `backgroundColor` values via `window.gapChartInstances`.
- **Tick count** — asserts Requests chart x-axis tick labels < 20.
- **Empty state** — asserts sub-minute fixture shows empty-state message, not canvas.
- All three tests verified able to fail (broke temporarily, saw red, restored).

**Task C — Screenshot harness fix:**
- **`data-testid="gap-charts-grid"`** — added to chart grid container; scroll selector updated from `.grid.grid-cols-1.lg\\:grid-cols-2` to `[data-testid="gap-charts-grid"]`.
- **Table scroll** — updated from `document.querySelector('[data-testid="gap-table"]')` to `page.locator('[data-testid="gap-table"]').scrollIntoViewIfNeeded()`.
- **Grouped view scroll** — same fix.
- **Populated charts capture** — second capture pass using `fixtures/gap-screenshots.csv` (multi-hour), saves `11-charts-populated.png` and `12-full-page-populated.png`.
- **`fixtures/gap-screenshots.csv`** — 20-row multi-hour fixture for populated chart captures.

**Task D1 — Pairing-key remove buttons:**
- **Buttons moved in-flow** — removed `absolute -top-1.5 -right-1.5 z-10` positioning; buttons now sit inline at the right end of each pairing-key row as muted glyphs that brighten on hover.

**Task D2 — Dropdown padding rule:**
- **`.atlas-select` padding** — changed from `padding-right: 2rem` only to `padding: 0.5rem 2rem 0.5rem 0.75rem`.
- **`.atlas-select-sm`** — new modifier for chart dropdowns: `padding: 0.25rem 1.75rem 0.25rem 0.625rem`.
- **Removed all `py-*` utilities** from `atlas-select` elements in HTML and JS template literals.
- **SPEC.md §9 updated** — records that padding on selects is owned by `.atlas-select` and its size modifier.

**Task D3 — Column filter NaN guard:**
- **`syncFromColFilter('time')`** — added `isFinite()` guard on parsed timestamps; NaN values now set to `null`.
- **Time branch** — no longer returns early; now runs `closeAllColDropdowns()` like every other branch.

**Task D4 — Date/time picker accent-color:**
- **`accent-color: var(--gap-accent)`** — applied to both `datetime-local` inputs in the time column filter.

**Task E — Stray file removed:**
- **`_p3.mjs`** — deleted from repository; added to `.gitignore`.

**Test counts:** 71 unit + 190 e2e = 261 total, all green.

---

### Phase 4 — Charts: colour collision, UTC, axis crowding, empty states, TTV width, encoding

**Task A — Legend colour collision (bug fix):**
- **Volume chart colours fixed** — Signing (Invalid) and Verification (Invalid) previously shared identical amber (`rgba(245, 158, 11, 0.7)`). Fixed with hue-based system: hue carries service, treatment carries validity.
  - Signing (Valid): `rgba(59, 130, 246, 0.7)` / `#3b82f6` (blue)
  - Signing (Invalid): `rgba(147, 197, 253, 0.75)` / `#93c5fd` (light blue)
  - Verification (Valid): `rgba(16, 185, 129, 0.7)` / `#10b981` (green)
  - Verification (Invalid): `rgba(110, 231, 183, 0.75)` / `#6ee7b7` (light green)
- **Fixed in both** `renderGapCharts()` and `renderSingleChart()`.
- **Test:** Playwright asserts four distinct `backgroundColor` values in volume chart datasets.

**Task B — Table/chart time disagreement (bug fix):**
- **Offset-less timestamps now parse as UTC** — `new Date(trimmed)` parses as local time when no timezone is present, causing the table and chart axis to disagree by the viewer's offset. Fixed by detecting whether the parsed string carried timezone info (`timeHadOffset` flag) and appending UTC assumption toast when at least one row lacks offset.
- **Toast updated** — post-analysis toast appends `· timestamps without a timezone read as UTC` when applicable.
- **Time column header** — now reads `Time (UTC)` to make the assumption explicit.
- **`timeHadOffset` field** — added to each row during `processGapData()`.

**Task C — Axis label crowding:**
- **`maxTicksLimit: 15`** — added to all chart x-axis tick options in both `renderGapCharts()` and `renderSingleChart()`. Chart.js thins labels evenly.
- **Auto bucket label** — dropdown option `Auto` now shows `Auto (5 Min)` (or the actual interval) after data is loaded, via `updateAutoBucketLabels()`.

**Task D — Single-bucket and empty states:**
- **Single-bucket message** — when all records fall within one bucket, shows: "All N records fall within one X-minute bucket. Choose a finer bucket size to see a trend." Canvas hidden.
- **Empty-filter message** — when filters reduce a chart to zero rows, shows: "No records match the current filter." Canvas hidden.
- **`showChartMessage()` / `hideChartMessage()`** — utility functions manage message overlay and canvas visibility.

**Task E — Time to Verify full width:**
- **`lg:col-span-2`** — added to the TTV chart card, giving it the full row width.

**Task F1 — Requests Over Time encoding (signed off by Sanjoy):**
- **Area fill between lines** — when "Both" series is selected, the signing line fills toward the verification line (`fill: { target: 1, above: 'rgba(16, 185, 129, 0.15)', below: 'rgba(59, 130, 246, 0.15)' }`). Where they coincide the shading vanishes; where they diverge it is immediately visible.

**Task F2 — Invalid Numbers Over Time encoding (signed off by Sanjoy):**
- **Lollipop/bar encoding** — switched from line chart to bar chart with thin bars (`barPercentage: 0.3`). Empty buckets filtered out, so only events appear. Rare events read correctly as discrete marks.
- **`gapInvalidOnly.csv` fixture** — created for testing single-bucket/empty states.

**Test counts:** 71 unit tests + 187 e2e tests = 258 total, all green (except pre-existing flaky "Esc exits placement mode").

---

**Task A — the reason vocabulary:**
- **`bucket` field on `validateUKNumber()`** — Each return point now carries an explicit `bucket` identifier (`empty`, `non-uk`, `not-plus-44`, `wrong-length`, `bad-prefix`, `identical-digits`, `sequential-run`, `valid`). Category and bucket are distinct: `category` is coarse (4 values, drives the table pill), `bucket` is fine (7 values, drives the breakdown chips). No code decides a category by matching prose.
- **`bucketLabels` exported from `validate.js`** — Label map sits next to the bucket definitions so adding a bucket without a label is visible in the diff. Sentence case: `Wrong length ×7`.
- **`gapReasonBucket()` deleted** — Replaced by `row.ukBucket` set at row-build time from `validateUKNumber().bucket`. Filter predicate and export both read `row.ukBucket` directly.
- **`truncated` category removed** — Dead through several phases; nothing produced it. Removed from `gapReasonBucket()`, `ukPillHtml()`, and label/style maps.
- **`row.ukBucket` added** — Set alongside `ukCategory` where the gap row is built, as `ukValid.bucket || 'other'`.
- **3 Playwright chip tests** — Panel visibility, no bucket identifier in chip text (regression guard), click-to-filter and click-to-clear. `fixtures/gap-invalid-reasons.csv` created with invalid destinations covering all 7 buckets.
- **Unit tests** — 22 tests in `validate.test.js` (was 28, now 22 after deleting `gapReasonBucket` block and adding `bucket`/`bucketLabels` assertions).

**Task B — Attention panel relocation:**
- **`#gap-invalid-reason-panel` moved** — From between charts and data table to directly above the data table. Contents, show/hide behaviour and filter wiring unchanged. Heading remains "Destination Issues — breakdown".

**Task C — Call Pairing grid:**
- **`lg:grid-cols-3` → `lg:grid-cols-4`** — Eight blocks now fill two clean rows at the large breakpoint. No other changes to the panel.

**Test counts:** 71 unit tests + 187 e2e tests = 258 total, all green.

---

### Country code prefix fix

- **`validateUKNumber()` countryCode extraction fixed** — Greedy `\d{1,3}` regex replaced with prefix-free E.164 algorithm: try 1-digit codes (`1`, `7`), then 2-digit codes (44 entries verified against ITU-T E.164), then fall back to 3 digits. Correct codes: US `+1`, France `+33`, Germany `+49`, Australia `+61`, Bangladesh `+880`, Portugal `+351`.
- **Tests corrected** — Two wrong expectations fixed (France `+331`→`+33`, US `+121`→`+1`). Added cases for one-digit (2 US numbers), two-digit (France, Germany, Australia), and three-digit (Bangladesh, Portugal) codes. UK `+44` case unchanged.
- **Tests proven to fail** — Reverted to greedy extraction, confirmed test failure (`+121` instead of `+1`), restored fix. Stated in commit message per constraint 2.

### Phase 2.5 close-out — test fixes, H3 tooltip, doc corrections

**Task J — Fix broken tests:**
- **J0: Removed isVisible guards** — All `if (await ...isVisible().catch(() => false))` guards removed from `gap-review.spec.cjs`. Missing elements now fail tests immediately.
- **J1: Window bridge pattern** — B3, B5, B6 now use `window.gapExportAllData = true; window.exportGapData()` instead of clicking non-existent UI buttons.
- **J2: B3 fixed** — Custom column with comma added via UI (`+ Add Column` button), asserts exact column count (12 commas = 13 fields) and verifies `"a,b"` appears quoted in header.
- **J3: B5 fixed** — Uses gap CSV export (not JSON) via window bridge. Stub-and-count approach retained.
- **J4: B6 fixed** — Uses window bridge pattern.
- **J5: B2 moved to optimizer** — Test moved from `gap-review.spec.cjs` to `opt-review.spec.cjs`. Seeds `atlas-opt-scenarios` with XSS payload, opens `scenarios-modal` via `openScenariosModal()`.

**Task K — Finish what Phase 2.5 started:**
- **K1: Screenshot capture script run** — Executed `capture-screenshots.cjs`, produced 11 PNG files, all with distinct MD5 hashes. Stale files from previous run deleted.
- **K2: H3 tooltip** — Added `countryCode` field to `validateUKNumber()` return. `ukPillHtml()` now shows country code in tooltip: "Non-UK destination (+33)".
- **K3: Doc corrections** — CHANGELOG: fixed XSS name ("scenario" not "customer"), corrected library versions (^4.5.1, ^0.14.0, ^10.0.1), updated unit test count to 77, corrected screenshot claim. SPEC.md: invariant 6 rewritten to describe actual impurities (input mutation, module-scope `findNearestRegionIdx`). Added `countryCode` to `validateUKNumber()` return type docs.

### Phase 2.5 — Trust repairs, import/onboarding fixes, export correctness, test debt

**Task F — Trust repairs:**
- **Fake test removed** — Deleted `src/auditor/pairing.test.js` which contained no application imports and trivial assertions that always passed.
- **Phase 2 changelog corrected** — Fixed 5 factual errors: financials.js function names, CSV header escaping function, country code cap location, physics test description, Gap column removal attribution.
- **Screenshot capture script repaired** — `screenshots-before/` untracked and added to `.gitignore`. Capture script rewritten to produce 11 distinct screens; executed and verified with MD5 hashes.

**Task G — Import and onboarding correctness:**
- **G1: Doubled drop count fixed** — Removed duplicate counting in `handleImport()` lat/lng validation filter.
- **G2: Drop warning preserved** — Merged the "N items dropped" toast with the "imported successfully" toast into a single terminal message.
- **G3: Missing lat/lng dropped** — Endpoints without `lat` or `lng` keys are now filtered during import instead of crashing the render.
- **G4: Onboarding toast merged** — `updateOnboardingFinancials()` now emits one combined message when both margin and contingency are clamped.
- **G5: NaN margin coerced** — `computeOnboardingFinancials()` now coerces non-finite margin and contingency to 0 before clamping.
- **G6: Margin > 99 clamped** — `computeOnboardingFinancials()` now clamps any margin above 99 to 99 (was only clamping at >= 100).

**Task H — Export correctness:**
- **H1: Phone apostrophe fixed** — `csvCell()` now guards `+` and `-` only when not followed by a digit. Phone numbers like `+447700900123` export clean; `+cmd` stays guarded.
- **H2: CSV summary lines quoted** — `breakdownLine` and `pairLine` in `exportGapData()` now wrapped through `csvCell()` to prevent comma spill in Excel.
- **H3: Non-UK country code display fixed** — Label simplified to "Non-UK destination"; full country code preserved in tooltip.
- **H4: Export arithmetic deduplicated** — `exportOnboardingCSV()` now calls `computeOnboardingFinancials()` instead of duplicating formulas inline.

**Task I — Test debt (security tests):**
- **B2: XSS in scenario name** — Test saves a scenario with `<img src=x onerror=alert(1)>` and verifies it renders as text, not as a live element.
- **B3: CSV header escaping** — Test adds a custom column with comma in display name and verifies the exported CSV header is properly quoted.
- **B5: Blob URL revocation** — Test stubs `createObjectURL`/`revokeObjectURL` and verifies revocation happens for every blob created.
- **B6: Gap column removed** — Test exports CSV and verifies the summary header row does not contain a `Gap` column.

### Phase 2 — Repo hygiene, security hardening, pure extraction, build pipeline

**Phase 2A — Secrets hygiene & CI/CD:**
- **GitHub Actions CI/CD** — `.github/workflows/deploy.yml` runs unit tests, Vite build, and Playwright e2e on push to main. Deploys `dist/` to GitHub Pages.
- **DEPLOY.md** — Non-technical maintainer guide for pushing to GitHub and triggering deployment.
- **Secrets hygiene** — No secrets, API keys, or credentials in the repository. All processing is client-side only.

**Phase 2B — XSS fixes, validation, import hardening:**
- **XSS: row.time** — Timestamp cell now escaped via `escapeHtml()` before innerHTML injection.
- **XSS: scenario name** — `s.name` escaped via `escapeHtml()` in `renderScenarioList()` to prevent stored XSS through saved scenario names.
- **CSV header escaping** — Export header rows passed through `csvCell()` to guard formula injection in downstream applications.
- **Import validation** — Out-of-range footprint indices filtered with toast; falsy-zero defaults changed to `??` operator.
- **Blob URL revocation** — Export blob URLs revoked after download to prevent memory leaks.
- **Retired Gap column** — Removed the `Gap` column from the CSV export summary.

**Phase 2C — Cleanup:**
- **Toast naming** — Consistent toast message format across all modules.
- **Dead code removal** — Removed orphaned variables and unreachable branches.
- **Country code cap** — `validateUKNumber()` non-UK country code display initially capped at 2 digits (later simplified to "Non-UK destination" label in Phase 2.5 H3).
- **Physics test** — Existing Playwright test `R5` tightened to assert `result.error` is undefined for the light-in-fibre RTT invariant.

**Phase 2D — Pure extraction (pairKey, financials):**
- **`pairKey(row)` extracted** — Pairing key construction moved to a pure function; all call sites use the same key construction.
- **`computeCoverage()` prepared** — Input interface expanded to accept `regions` and `getRegionCost` as parameters, removing module-level coupling.
- **`src/onboarding/financials.js`** — `computeOnboardingFinancials()` extracted as a pure function with 6 unit tests.

**Phase 2E1 — CDN-to-npm (Leaflet, Chart.js, html2pdf, Gantt):**
- **Leaflet 1.9.4**, **Chart.js 4.5.1**, **html2pdf.js 0.14.0**, **DHTMLX Gantt 10.0.1** moved from CDN `<script>` tags to npm imports via `src/deps.js`.
- **MAP_BOUNDS lazy init** — `getMapBounds()` computed on first call, not at module load time.
- **Single-file output** — `vite-plugin-singlefile` inlines all JS into `dist/index.html`.

**Phase 2E2 — Tailwind build-time:**
- **Tailwind CSS** moved from CDN runtime (`<script src="https://cdn.tailwindcss.com">`) to build-time PostCSS.
- **`postcss.config.cjs`** + **`tailwind.config.cjs`** — Content scans `index.html` + `src/**/*.js`. Safelist: `text-emerald-400`, `text-amber-400`, `text-red-400`, `text-[10px]`.
- **`src/tailwind.css`** — Tailwind directives (`@tailwind base/components/utilities`) imported by `src/main.js`.
- **CDN script removed** — `<script src="https://cdn.tailwindcss.com">` deleted from `index.html`.

**Phase 2E3 — CSP tightening:**
- **Strict CSP** — `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'none';`
- **`connect-src 'none'`** — Blocks `fetch` and `XMLHttpRequest`; privacy claim is asserted (image beacons still possible via `img-src https:`).
- **`style-src https:`** — Allows Font Awesome and Google Fonts CDN stylesheets.
- **`script-src 'self'`** — No external scripts; all JS bundled via Vite.
- **SPEC.md updated** — Privacy claim description corrected to reflect actual CSP behavior.

**Flaky test fix:**
- **`custMap` guard** — `toggleClickPlace()` and `updateCustMap()` now check `if (custMap)` before accessing map container, preventing crashes when the Leaflet map hasn't initialized yet.
- **Escape handler** — Global `keydown` listener now handles Escape for click-to-place mode directly, removing the dependency on `initCustMap()` registration timing.

**Final counts:** 77 unit tests + 180 e2e tests = 257 total, all green.

---

### Phase 1 — Extract pure modules, unit tests, five bug fixes

**Tooling:**
- Vite + Vitest + vite-plugin-singlefile installed. `npm test` = unit → build → e2e.
- Playwright now targets `dist/index.html`. All spec files renamed `.cjs` for CommonJS.
- Build produces single self-contained HTML file via `vite-plugin-singlefile`.

**Module extraction:**
- `src/core/format.js` — `escapeHtml`, `csvCell`, `formatMoney`
- `src/auditor/validate.js` — `normalizePhoneNumber`, `validateUKNumber`, `gapReasonBucket`
- `src/auditor/parse.js` — `parseGapCSV`, `dedupHeaders`
- `src/auditor/buckets.js` — `getGapBucketKey`, `getAutoBucketInterval`, `formatBucketLabel`
- `src/optimizer/geo.js` — `haversine`
- `src/main.js` — window bridge (temporary scaffolding for Phases 1–2)

**Unit tests:** 66 tests across 4 files (validate, parse, buckets, format). Test-first for all bug fixes.

**Bug fix D1 — `normalizePhoneNumber` precision guard:**
- Regex generalized from `/^(\d)(?:\.(\d+))?[Ee]\+(\d+)$/` to `/^\+?(\d+)(?:\.(\d+))?[Ee]\+(\d+)$/`.
- Rejects `44.7305E+10`, `4473054E+5`, `+4.47305E+11` (precision loss).
- Non-scientific control `447305409280` still converts normally.

**Bug fix D2 — Duplicate CSV header collision:**
- `dedupHeaders()` extracted to `parse.js`. Counter now increments: `['A','A','A']` → `['A','A (2)','A (3)']`.
- Post-analysis toast shows duped count.

**Bug fix D3 — Footprint cells dropped silently on import:**
- `handleImport` now emits error toast when `droppedCells > 0`.
- R13 test rewritten to drive real file input instead of re-implementing logic.

**Bug fix D4 — Margin clamping:**
- `updateOnboardingFinancials` clamps margin to 0–99, writes clamped value back to `#ob-margin`.
- Toast fires only when clamp actually changes the value.
- Negative contingency (`#ob-contingency`) clamped to 0.

**Bug fix D5 — Endpoint double-counting:**
- `tryAddEndpoint` dedup key changed from `r{idx}`/`c{name}` to lat/lng rounded to 3 decimal places.
- Same physical location can no longer be added twice (e.g., us-east-1 as AWS region and as city).
- `window._matrix` exposed for R5 test.

**Test retirement:**
- R9 (truncated scientific notation) — deleted, superseded by unit tests.
- R16 (csvCell formula injection) — deleted, superseded by unit tests.
- R15 (escapeHtml) — strengthened with live-element assertion.
- R8 (charts update) — strengthened with dataset length check.
- R5 (physics invariant) — rewritten to iterate all 32×32 pairs against haversine floor.
- R13 (import out-of-range) — rewritten to drive real file input.

**Final counts:** 66 unit tests + 179 e2e tests = 245 total, all green.

---

## Legacy changelog (original build numbering)

The entries below use the original phase numbering from the initial build.
They are preserved as-is for historical reference.

### Legacy Phase 7 — Requests Over Time, series filters, pair metrics, header filter sync
- **Requests Over Time chart** — New line chart showing signing-request and verification-request counts over time as two lines (green/blue). Own Time Bucket dropdown (`gap-bucket-interval-requests`), registered in `gapChartInstances` and `gapChartBucketOrders`. Clickable for drill-through. Excludes `timeValid === false` rows.
- **Per-graph Series dropdown** — Second dropdown in each chart card header defaulting to "Both". Requests: Both/Signing only/Verification only. Volume: Both/Signing/Verification. Invalid: Both/Signing/Verification (split into signing-invalid/verification-invalid). Proc: Both/Signing/Verification (split into signing-avg/verification-avg). TTV: Both/Median/P95. State: `gapSeriesFilters`. Hidden series removed from dataset.
- **Header filter sync** — Extracted `clearGapFilterInputs()` (deferred R23). Used in `resetGapFilters()`, `drillDownPair()`, and `drillDownGap()`. Two-way sync between filter bar and column header inputs via `syncFromColFilter()`/`syncToColDropdowns()`.
- **Pair-level time metrics** — `pairGapCalls()` now computes `pairProc` (signing + verification processing) and `pairEndToEnd` (signing + handoff + verification) on each paired row. `gapPairSummary` extended with `timeToVerifyMean`, `pairProcMean/Median/P95`, `endToEndMean/Median/P95`.
- **Call Pairing panel** — TTV block now shows mean/median/P95. Two new stat blocks: "Pair processing (S+V)" and "End-to-end (S+H+V)" with mean/median/P95. Testids: `gap-pair-proc`, `gap-pair-endtoend`.
- **Pair summary rows** — When Group by pair is on, each paired group gets a summary row: `P{n} · handoff {h}ms · proc {p}ms · end-to-end {e}ms`. Orphan groups get none. Pagination group count unchanged.
- **Pair pill tooltip** — Paired pill title now includes `· proc {p}ms · end-to-end {e}ms` in both flat and grouped views.
- **Pair-level CSV export** — New "Pair summary" scope in export modal. Columns: pairId, from, to, signTime, verifyTime, handoffMs, signProcMs, verifyProcMs, pairProcessingMs, endToEndMs. One row per paired pair.
- **TTV decision** — TTV chart shows median+P95 only (no mean line). Mean lives in the panel. Recorded in SPEC.
- **Tests** — Updated `gap-layout.spec.js` to filter out pair summary rows. All 111 gap tests passing.

---

### Legacy Phase 6D — Dark-theme select/icon fixes, round 2
- **`color-scheme: dark`** — Added to `:root` and `select, input` for native dark rendering of select listboxes, datetime-local pickers, and scrollbars.
- **Chevron geometry** — `.atlas-select` now has `appearance: none; -webkit-appearance: none; padding-right: 2rem;` with light-stroke SVG chevron (`#e2e8f0`). Background-position and size adjusted for proper alignment.
- **Column filter dropdown selects** — Added `.atlas-select` class to all 5 column filter dropdowns (`col-filter-service`, `col-filter-status`, `col-filter-customer`, `col-filter-validation`, `col-filter-pair`).
- **Column filter icon color** — Changed `.gap-col-filter` color from `#475569` (slate-600) to `#94a3b8` (slate-400) for better visibility on dark backgrounds.
- **Filter bar padding** — Removed `px-*` Tailwind utilities from filter bar selects to let `.atlas-select` handle padding via CSS.
- **JS template literals** — Removed `px-*` and `pr-8` from mapping modal, pairing keys, and additional columns selects.
- **Stronger regression test** — Test #12 now asserts: `color-scheme: dark`, every select has `.atlas-select` class, background luminance < 0.25, foreground luminance > 0.6, `appearance: none`, and `padding-right >= 30px`.
- **Tests** — 111/111 gap tests passing.

---

### Dark theme select/icon fix
- **Shared `.atlas-select` class** — Extracted dark-theme select styling into a single CSS class using CSS variables. All selects (filter bar, bucket dropdowns, mapping modal, pairing keys, additional columns, rows-per-page) now use `.atlas-select` instead of ad-hoc Tailwind utilities. Light-theme support is automatic via CSS variable overrides.
- **Select chevron visibility** — Native `<select>` chevron replaced with custom SVG via `appearance: none` + `background-image`. Light gray chevron (`#94a3b8`) visible on dark background.
- **Tests** — Added Playwright spec asserting bucket dropdown background is not white and text color is light.
- **Unused `.gap-input` class removed** — No element referenced it; the CSS variable `--gap-input` remains used by `.atlas-select`, `.gap-pill-muted`, and `.gap-chip`.

---

### Legacy Phase 11 — Removed Gap Count & Gap Percentage tiles
- **Gap Count tile removed** — Deleted the tile HTML, `signedGap`/`gap` computation in `updateGapMetrics()`, the `drillDownGap('gap')` branch, the `gap` pair filter dropdown option, and the `pairFilter === 'gap'` handling in `applyGapFilters()`. Help drawer Gap Count bullet removed.
- **Gap Percentage tile removed** — Deleted the tile HTML, `gapPct` computation, and DOM update. Tile grid now has 6 tiles in a 4+2 layout: Row 1 (Total Records, Paired Calls, Signing Requests, Verification Requests), Row 2 (Destination Issues, Slow Requests).
- **Tests updated** — Tile order test updated to expect 6 tiles. Gap Count tests removed from `gap-charts.spec.js` and `gap-pairing.spec.js`.

---

### Legacy Phase 10 — Gap Count bug fix, CSV reporter v2, HTML test report viewer
- **Gap Count tile click bug fixed** — Clicking the Gap Count tile now correctly filters to unverified + unsigned records (the rows contributing to the gap) instead of resetting all filters. Added `gap` option to the pair filter dropdown. New filter `drillDownGap('gap')` sets the pair filter; `applyGapFilters()` handles the combined `unverified || unsigned` logic.
- **CSV reporter v2** — Enhanced with 4 new columns: Spec File (relative path), Describe Block (cleaned hierarchy), Fixture (detected CSV filename), and Scenario (3-step Gherkin: Given/When/Then). Describe chain filters out file-path-like titles. When step defaults to "When I run the analysis" for assertion-style titles.
- **HTML test report viewer** — One-time `reports/test-report-viewer.html` file. Self-contained dark-theme viewer with drag-and-drop CSV import, module tabs (Gap Analyzer / Optimizer / Onboarding), per-module metrics, Expand All / Collapse All per module, collapsible spec file sections, Gherkin color coding (Given=violet, When=amber, Then=blue), fixture badges, error expansion for failed tests, search box, and status filter buttons.
- **143 tests passing** — All tests across Gap Analyzer (87), Optimizer (47), and Onboarding (7) pass.

---

### Legacy Phase 9 — Cleanup, restructure, CSV test report
- **REVIEW.md removed** — Deleted stale `REVIEW.md` file. Removed all references from `SPEC.md`, `FEATURES.md`, and `CHANGELOG.md`. `claude_memory.md` left untouched.
- **Stale fixture removed** — Deleted `fixtures/gap-phase1.csv` (zero references in any test or source file).
- **Docs restructured** — `SPEC.md`, `FEATURES.md`, and `CHANGELOG.md` moved from project root into `docs/` folder.
- **screenshot.js fixed** — Updated to use `fixtures/gap-core.csv` (was referencing deleted `test_gap_phase2a.csv`).
- **CSV test report** — Custom Playwright reporter (`e2e/reporters/csv-reporter.js`) generates Gherkin-format CSV reports after each test run. Columns: Test Name (Given/When/Then), Status, Duration, Comments. Includes overall run time summary row. Reports saved to `reports/` (gitignored).
- **Playwright config** — Added CSV reporter alongside existing list reporter.

---

### Legacy Phase 8 — Paired Calls tile, metric grid reorder, Processing Time bucket fix
- **Paired Calls tile** — New metric tile (`gap-tile-paired`) showing distinct `pairId` count where `pairStatus === 'paired'` in `gapFilteredData`. Sub-label shows global match rate from `gapPairSummary`. Clickable via `drillDownPair('paired')`. Icon: `fa-link text-cyan-400`.
- **Metric grid reordered to 4+4** — Row 1: Total Records, Paired Calls, Signing Requests, Verification Requests. Row 2: Destination Issues, Slow Requests, Gap Count, Gap Percentage. Tile count increased from 7 to 8.
- **Filtered strip updated** — When a filter is active, the strip now shows the paired global count alongside the record count.
- **Processing Time bucket fix** — `renderSingleChart('proc')` now correctly destroys and recreates the proc chart when the per-chart bucket dropdown is changed. Root cause: `gapChartInstances` used key `processing` while `renderSingleChart` looked up key `proc`. Fixed by aligning both to `proc`. Window bridge added for `gapChartInstances` at init and both reassignment sites.
- **Tests** — 8 new tests: tile count/order verification, Paired Calls tile count/match rate/grid position/filter behavior, proc bucket dropdown re-render/auto-return/isolation. 87 tests total, all passing.

---

### Legacy Phase 7 — Time-to-Verify info tooltip, module rename, doc split
- **TTV info icon** — Added `fa-info-circle` info icon to the Time-to-Verify tile in the Call Pairing panel, matching the existing pattern on Gap Count and Gap Percentage tiles. Tooltip explains median, P95, and what a large P95-vs-median gap means.
- **Module rename** — Display name "Gap Analyzer" renamed to "Call Auditor" across all user-visible strings: gateway card title + description, module header, help drawer tab label, help section heading/body, and ARIA live announcement map. Internal IDs (`module-gap-analyzer`, `gap-*` globals, `e2e/gap/` paths) unchanged.
- **Doc split** — `Atlas_memory.md` retired. Source of truth is now three files: `SPEC.md` (engineering), `FEATURES.md` (product), `CHANGELOG.md` (history).
- **Tests** — Extended pairing spec with TTV info icon assertion. Added module rename assertion (gateway, header, help tab). Full suite green.

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

### Legacy Phase 6C — Mapping Modal Layout Refinements
- **Modal widened** — `max-w-4xl` → `max-w-6xl` (1152px) to accommodate 4-column mapping grid.
- **Pairing Key section moved up** — now sits directly after the Processing Time / Pairing Window inputs, before the column mappings.
- **Pairing key horizontal layout** — dropdowns render in a `flex flex-wrap` row with muted `+` separators. Merged `+` and X into Option B: small circular X button positioned `absolute -top-1.5 -right-1.5` above each dropdown (top-right corner). Components removable down to minimum 1; add button "+ Add pairing component" hidden at 4.
- **Pairing key min 1** — `renderPairingKeysUI()` initializes to `[from, to]` on first open only; subsequent removes can go down to 1 component.
- **4-column mapping grid** — `grid-cols-2 sm:grid-cols-4` with compact `text-xs` labels/selects, tighter padding (`p-3`, `px-2.5 py-1.5`), and `pr-8` on all `<select>` elements for native chevron spacing.
- **"Map Columns" section header** — column mappings wrapped in a section with `<h3>Map Columns</h3>` and description, matching Pairing Key / Additional Columns / Preview section style. Standalone intro paragraph removed.
- **Settings snapshot/restore** — `openGapSettings()` takes a deep snapshot of `gapColumnMapping`, `gapAdditionalColumns`, `gapPairingKeys`, `gapSlowThreshold`, `gapPairWindow`. `closeGapColumnModal()` restores from snapshot (discards unsaved changes). `confirmGapColumnMapping()` clears snapshot before closing (commits changes). Prevents stale edits persisting after Cancel/X.
- **Additional columns** — unchanged 2-column grid of bordered grouped units.
- **15 e2e tests** in `gap-flexibility.spec.js` Phase 6C block: horizontal flex-wrap, + separators, button label, max-4 hidden, min-1 remove, grid-cols-2 container, bordered units, unit contents, 4-column mapping grid, pr-8 chevron, X above dropdown, section order, Map Columns header, cancel resets state, Analyze persists state.

### Legacy Phase 6B — PM Feedback Round
- **Modal widened** — `max-w-2xl` → `max-w-4xl`, `max-h-[90vh]` → `max-h-[85vh]`. Threshold/pairing window in `sm:grid-cols-2` wrapper. Column mappings grid `sm:grid-cols-2`.
- **Pairing key editable defaults** — `renderPairingKeysUI()` rewritten: always shows From/To as first two dropdowns with labels ("From (required)", "To (required)"). `gapPairingKeys` always populated with `[fromHeader, toHeader]` defaults. Options disabled if already used elsewhere. "+ Add column" button hidden at max 4. Extra columns get remove buttons. `confirmGapColumnMapping()` ensures at least from/to fallback. `openGapSettings()` syncs defaults via `syncPairDefaults()` on From/To change.
- **Per-chart time bucket dropdowns** — Global dropdown removed. 4 per-chart dropdowns in chart card headers (`gap-bucket-interval-invalid|volume|proc|ttv`). State: `gapBucketIntervals = { invalid:'auto', volume:'auto', proc:'auto', ttv:'auto' }`. `handleChartBucketIntervalChange(chartType, val)` re-renders only that chart. `gapChartBucketOrders` stores per-chart bucket key order. Drill-through uses source chart's interval for `applyGapFilters()`.
- **Table column min-widths** — Removed `min-w-[1200px]`. Added `whitespace-nowrap` to all `<th>` and `<td>`. Per-column `style="min-width: Xpx"` on `<th>` elements for stable column widths.

### Legacy Phase 6 — Data Flexibility & Pairing Generality
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

### Legacy Phase 5 — Time-Series Overhaul & Chart Cleanup
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

### Legacy Phase 4 — Layout, pair legibility, median clarity
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

### Legacy Phase 3 — Event Pairing
- **Task 0: Settings button fix** — root cause: HTML `onclick="openGapSettings()"` passed no arguments; JS `headers.find()` on `undefined` crashed before modal `classList` toggle. Fixed with `gapRawHeaders` fallback.
- **Task 1: pairGapCalls engine** — greedy stream matching on `(from, to)` key within `gapPairWindow` (default 1000ms). Assigns `row.pairStatus` (paired/unverified/unsigned/unpairable/duplicate), `row.pairId` (P1, P2…), `row.timeToVerify` (ms). After pairing, unverified signings with a paired signing on the same key are reclassified as `duplicate`. Computes `gapPairSummary` (match rate, counts including duplicates, median/P95, invalid cross-tabs). Runs on full `gapData`, not filtered subset.
- **Task 2: Call Pairing panel** — full-width panel below metric tiles with 6 stat blocks (match rate, unverified, unsigned, duplicates, unpairable, time-to-verify) + correlation line. Clickable blocks via `drillDownPair(status)`. Global (not filtered).
- **Task 3: Table Pair column** — 10th column with colored pills (green/red/amber/blue/gray for paired/unverified/unsigned/duplicate/unpairable) and tooltips. Pair Status dropdown filter added to filter bar with duplicate option. `applyGapFilters()` checks it; `resetGapFilters()` and `drillDownGap()` clear it.
- **Task 4: Configurable pairing window** — number input in Settings modal; `handleGapPairWindowChange()` re-runs `pairGapCalls()` and re-renders panel + table. Persists for session.
- **Task 5: Export + help** — CSV export includes pairStatus, pairId, timeToVerify columns + pairing summary line with duplicate count. Help drawer gains Call Pairing section (heuristic explained, algorithm, statuses including duplicate, window). Dashboard Metrics section updated to reference pairing panel.

### Legacy Phase 2B hotfix
- **H8: drillDownGap outliers uses threshold** — `drillDownGap('outliers')` set `procMin.value = '100'` (hardcoded). Changed to `procMin.value = String(gapSlowThreshold)` so the drill-down respects the user-configured threshold.
- **H9: Settings button root cause** — `openGapSettings()` called with no arguments from the button's `onclick`; `headers.find()` on `undefined` threw TypeError before the modal opened. Fixed by adding `if (!headers) headers = gapRawHeaders;` fallback at function entry.

### Legacy Phase 2B — Exploration Polish
- **P2.5: Privacy messaging** — shield icon + "Private by design — your call data is processed entirely in this browser and never sent to a server." text added below the upload drop-zone in the Gap Analyzer module.
- **P2.4: Filtered-view indicator** — when any filter is active, a slim strip (`gap-filtered-strip`) appears above the metrics grid showing global (unfiltered) counts per metric as "N of M" with `title` tooltips, plus a Reset Filters button. Global values computed in `updateGapMetrics()` by counting against `gapData` when `isFiltered` is true. Strip hidden when no filters active.
- **P2.6: Configurable slow threshold** — `gapSlowThreshold` global (default 100), number input in Settings modal, `handleGapThresholdChange()` updates tile label, chart annotation line + `suggestedMax`, and re-renders data. Annotation label dynamically shows `"{threshold}ms Threshold"`.
- **P2.3: Chart → table drill-through** — `row.bucketKey` derived in `processGapData()` (ISO hour or `'__unknown__'`). `gapBucketOrder` stores label order. All four charts gain `onClick: chartClickHandler` resolving x-index → bucket key via `gapBucketOrder[idx]`. `toggleGapBucket(key)` sets/clears `gapBucketFilter`; `applyGapFilters()` checks it. Removable chip in filter bar shows active bucket. `resetGapFilters()`, `drillDownGap()`, `resetGapMetrics()` clear bucket filter.

### Legacy Phase 2A hotfixes
- **H3: Unknown time bucket** — invalid-time rows now go to an explicit "Unknown" bucket (always last) in all four charts instead of being excluded. Chart bucket totals must equal tile totals.
- **H4: 100ms threshold visibility** — Processing Time chart y-axis `suggestedMax: 100` ensures the dashed annotation line is visible when all averages fall below 100ms.
- **H5: Net vs. per-hour labeling** — Gap Count tile caption appends "net" (e.g. "−1 net · unsigned verifications"); Gaps Over Time subtitle prefixed with "Per hour:".
- **H6: Help-text sync** — Gap Analyzer help drawer's Dashboard Metrics section updated: "Gap (Missing)" → "Gap Count" with signed description and per-hour chart reference; Processing Time Distribution entry appends threshold-line mention.
- **H7: Directional tooltip labels + vocabulary alignment** — Gaps Over Time chart gains `tooltip.callbacks.label` formatting by sign: "+N · signed but not verified" / "−N · verified but not signed" / "0 · balanced". Tile caption, subtitle, and help drawer Visualizations section aligned to the same phrasing (replacing "missing verifications"/"unsigned verifications").

### Legacy Phase 2A — Diagnostic Foundations
- **Task 1: Timestamp parse guard** — `processGapData()` parses each row's time into `row.timestamp` (ms epoch) + `row.timeValid` flag. 10-digit → epoch seconds, 13-digit → epoch ms, otherwise `new Date()`. Invalid timestamps: counted in tiles, excluded from time-bucketed charts, amber icon in table, sort to bottom. Summary toast appends "· N unparseable timestamp(s)".
- **Task 2: Signed directional gap** — Gap Count tile shows signed value with dynamic caption (positive = "missing verifications", negative = "unsigned verifications", zero = "balanced"). Gaps Over Time converted from line to bar chart: red above zero, amber below, dashed zero baseline via annotation plugin. Subtitle added.
- **Task 3: Invalid-reason breakdown** — `gapReasonBucket()` maps `ukValidationReason` strings to six buckets via keyword matching. Full-width panel below metrics grid with clickable chips; sets `gapInvalidReason` global for filtering. Export CSV includes breakdown line. Help drawer updated.

### Legacy Phase 1 F1 (parse errors)
- `parseGapCSV` returns `{headers, rows, errors}`. Errors collected for empty rows and short-row padding. Count surfaced in summary toast as "· N skipped" when > 0.

### Legacy Phase 1 documentation cleanup (D1–D3)
- **D1:** §5 Global decisions renumbered 38–42 (collision with Phase 1 Gap decisions 33–37 resolved).
- **D2:** Stale "Fix the chart annotation" recipe removed from §13 (plugin now loaded).
- **D3:** §4 file-map ranges rewritten from actual line numbers (1–305 through 3361–4095).

### Legacy Phase 1 hotfixes
- **H1: Verification predicate widened** — `isVerify` changed from `svc.includes('verify')` to `svc.includes('verif')` (stem match). `'verification'.includes('verify')` is false (`"ication"` ≠ `"y"`); `'verification'.includes('verif')` is true. Fixes `Verification` service value being uncounted.

### Legacy Phase 1 Hardening (T1–T7)
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
