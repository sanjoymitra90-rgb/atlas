# ATLAS — Code Review & Work List

Scope agreed with Sanjoy. Two things were explicitly **descoped** and are not in this document:
a shared customer/account object across modules, and cost-aware optimisation in the coverage
algorithm. Both were deliberate product calls, not oversights.

Findings are ordered by the damage they can do, not by effort. Each has a location, the
evidence it's real, and a concrete fix. Where a fix has a subtle failure mode, that's called out.

**Verification state:** all findings below were confirmed against `index.html` as of the
2026-08-05 upload (5,808 lines). Line numbers are given only as a starting point — anchor on
the function name, which survives edits.

**R3 is no longer a prediction.** It was reproduced in the browser on 2026-08-05:
`ReferenceError: Chart is not defined`, thrown from `renderGapCharts()` during CSV upload. See
R3 for the fix and R27 for the design flaw it exposed.

---

## P0 — Ship-blockers

### R1. `toggleUpgradePlan()` hard-locks the app on a healthy path

**Location:** `toggleUpgradePlan()`, ~L3121

`showLoading()` is called, then the `!hasMarginals` branch returns without `hideLoading()`:

```js
showLoading();
// ...
if (!hasMarginals) {
  summaryEl.innerHTML = '...No upgrades needed...';
  card.classList.remove('hidden');
  return;                       // ← overlay never dismissed
}
```

Flipping the Marginal Upgrade Plan switch on when there are no marginal endpoints — the
*good* outcome, and the one a clean demo dataset produces — leaves the user behind a
full-screen overlay with no exit but a page reload.

**Fix:** wrap the body in `try { ... } finally { hideLoading(); }`.

### R2. The loading overlay is unsound in all three call sites

**Location:** `showLoading()` / `hideLoading()` ~L3529; call sites at `goToStep()` ~L2493,
`toggleGreenPlanMode()` ~L3118, `toggleUpgradePlan()` ~L3128

```js
if (step === 4) { showLoading(); renderDashboard(); hideLoading(); }
```

Two problems. First, no `try/finally`, so any throw inside `renderDashboard()` strands the
overlay — strictly worse than the pre-change behaviour, where a thrown error left the UI
usable. Second, the sequence is synchronous, so the browser never repaints between the two
calls and **the overlay does not appear at all when things go well.** It renders only in the
cases where it cannot be dismissed.

**Fix:** `try/finally` everywhere, and if the spinner should actually be visible, yield to the
renderer first:

```js
async function withLoading(fn) {
  showLoading();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  try { return fn(); } finally { hideLoading(); }
}
```

Alternatively drop the overlay — these operations complete in single-digit milliseconds for
realistic endpoint counts, and a spinner that flashes is worse than none.

### R3. The Chart.js SRI hash is wrong — Gap Analyzer uploads fail outright

**Status: CONFIRMED in browser, 2026-08-05.** Not a risk assessment; a live failure.

**Location:** `<head>`, L13–31

```
processGapData error: ReferenceError: Chart is not defined
    at renderGapCharts (index.html:5393)
    at processGapData (index.html:4672)
    at confirmGapColumnMapping (index.html:4611)
    at HTMLButtonElement.onclick (index.html:847)
```

Five `integrity` attributes were added in the last hardening pass. An agent cannot compute a
digest of a file it never fetched, so these were recalled rather than calculated. The Leaflet
and Font Awesome values happen to match the canonical published hashes. **The Chart.js value
does not**, so the browser refuses to execute the script and `Chart` is never defined. This
reproduces exactly the bug already in the project's history — *"Chart.js CDN missing — gap
charts were silently failing."*

Because of R27, the consequence is not "charts are missing" but "the entire CSV upload fails
and rolls back."

**Immediate unblock:** delete the `integrity` and `crossorigin` attributes from the Chart.js
tag. The module works again at once.

**Correct remediation, in order:**

1. **Delete the `chartjs-plugin-annotation` tag entirely.** Phase 5 removed the threshold line
   and the plugin is now referenced nowhere in the file. It is a dead dependency carrying a
   possibly-wrong hash. Remove both.
2. **Regenerate the remaining hashes from the real bytes:**

   ```bash
   for u in \
     "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" \
     "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
   do
     printf '%s\n  sha384-%s\n' "$u" \
       "$(curl -s "$u" | openssl dgst -sha384 -binary | openssl base64 -A)"
   done
   ```

3. **Check the console for a second failure.** The html2pdf hash came from the same recall and
   is used unguarded at ~L3748. If it is also wrong, the Client Proposal PDF button throws the
   moment a user clicks it — a worse place to discover this than an upload. Leaflet and Font
   Awesome are expected to be fine, and their failure would be self-evident (no map, no icons).
4. **Add a load-time dependency guard** so this class of failure is legible rather than
   mysterious. This is now the third instance of a silently absent dependency in this project's
   history:

   ```js
   window.addEventListener('load', () => {
     const missing = [
       ['Chart.js', typeof Chart !== 'undefined'],
       ['Leaflet', typeof L !== 'undefined'],
       ['html2pdf', typeof html2pdf !== 'undefined'],
       ['DHTMLX Gantt', typeof gantt !== 'undefined']
     ].filter(([, ok]) => !ok).map(([n]) => n);
     if (missing.length) showToast('Failed to load: ' + missing.join(', '), true);
   });
   ```

**Still outstanding:** the two dependencies excluded from the SRI pass are the two that most
needed it — `cdn.tailwindcss.com` (rolling runtime; also the reason CSP needs `unsafe-eval`)
and `cdn.dhtmlx.com/gantt/edge/`. **"edge" is a moving target that can change without notice.**
If the vendor ships a breaking change tomorrow, the Onboarding module dies exactly the way the
Gap Analyzer just did — except there is no attribute to remove and no version to roll back to.
Pin DHTMLX to a version number and hash it. SRI on four already-pinned libraries was the easy
half of the job.

### R27. A chart failure rolls back the entire data pipeline

**Location:** `processGapData()` try/catch, ~L4587–4670

Discovered by R3 in production use. The trace tells the story:

```
processGapData error: ReferenceError: Chart is not defined
    at renderGapCharts → processGapData → confirmGapColumnMapping
```

A missing *chart* library killed the *entire upload*. By the time `renderGapCharts()` runs, the
pipeline has already succeeded at parsing, normalising, validating, pairing, computing the
summary, populating filters, metrics and the table. The catch block then reverted `gapData` and
`gapFilteredData` to the previous snapshot and discarded all of it.

The rollback is correct for genuine data corruption — that is why it was added, and it should
stay. It is wrong for the presentation layer. Chart rendering is the last and least essential
step; it must not be able to take down the nine steps before it.

**Fix:** move presentation calls outside the transactional boundary and let them fail
independently.

```js
try {
  renderGapCharts();
} catch (e) {
  console.error('Chart rendering failed:', e);
  showToast('Charts unavailable — data loaded successfully', true);
}
```

Apply the same treatment to `renderGapPairPanel()`, which is also presentation and also
currently inside the blast radius. Draw the line explicitly: everything up to and including
`gapFilteredData` assignment is transactional; everything after it degrades.

With this in place, today's failure would have been a legible degraded state rather than a
dead end.

---

## P1 — Produces confidently wrong answers

### R4. AWS region table is mislabelled, and the latency matrix contradicts it

**Location:** `regions[]` L2116, `matrix` L2122

Per AWS: `ap-southeast-5` is **Malaysia**, `ap-southeast-6` is **New Zealand**,
`ap-southeast-7` is **Thailand**. ATLAS maps `ap-southeast-5` → Auckland NZ and
`ap-southeast-7` → Kuala Lumpur. `ap-southeast-6` and `ap-east-2` (Taipei) are absent.

The matrix rows hold the *correct* Malaysia/Thailand latency data under the wrong labels.
Evidence — checking every entry against the physical floor for fibre (`distance ÷ 100` ms RTT):

- **36 entries are physically impossible. Every one involves "Auckland."**
- Singapore → "Auckland" is listed as **9 ms across 8,417 km**. Physical minimum ≈ 84 ms.
  Singapore → Kuala Lumpur *is* ~9 ms.

Consequence: in Naive Mode the optimiser sees an impossibly well-connected Auckland and will
recommend it as the cell covering Singapore, Mumbai and Dubai inside a 150 ms SLA. In
Realistic Mode the same row uses NZ coordinates and behaves completely differently.

**Fix:**
1. `ap-southeast-5` → Kuala Lumpur, Malaysia (3.1390, 101.6869)
2. `ap-southeast-7` → Bangkok, Thailand (13.7563, 100.5018)
3. Add `ap-southeast-6` (Auckland, −36.8485, 174.7633) and `ap-east-2` (Taipei, 25.0330, 121.5654)
   with matrix rows — or omit them until real data exists. **Do not interpolate rows.**
4. `AWS_PRICE_INDEX` needs entries for any added region, or `estimateRegionCost()` returns `NaN`.

**Caution:** `regions[]` index position is the canonical id in `selectedFootprint`,
`cellCosts`, `customers[].regionIdx`, and saved scenarios. Inserting regions **renumbers
every index after the insertion point** and silently corrupts every previously exported
session and every saved scenario. Either append new regions at the end (breaking alphabetical
order, which only affects display) or bump the session version to 3.0 and migrate on import.
See R13.

### R5. Add a physics assertion so R4 can't recur

**Location:** new, near the constants block

```js
// Dev-only invariant: no entry may fall below light-in-fibre RTT.
if (location.hostname === 'localhost' || location.protocol === 'file:') {
  regions.forEach((a, i) => regions.forEach((b, j) => {
    if (i === j) return;
    const floor = haversine(a.lat, a.lng, b.lat, b.lng) * 0.01;
    if (matrix[i][j] < floor) {
      console.error(`matrix[${i}][${j}] (${a.code}→${b.code}) = ${matrix[i][j]}ms, ` +
                    `below physical floor ${floor.toFixed(0)}ms`);
    }
  }));
}
```

This single check catches the entire class of error in R4. Add it as a Playwright assertion
too, so CI fails rather than merely logging.

### R6. The latency model has more noise than the safety margin

Measured from the app's own constants:

| Check | Result |
|---|---|
| Matrix symmetry (doc claims "mirrored/symmetric") | **450 of 496 pairs asymmetric**, max delta 30 ms |
| Triangle inequality | **761 violations**; worst 59 ms (Cape Town→Hyderabad direct 336 ms, via Paris 277 ms) |
| Realistic mode vs. matrix | median **45 ms optimistic**; up to **300 ms** (Cape Town→Melbourne: model 124 ms, matrix 424 ms) |

Default safety floor is 20 ms. The data's internal inconsistency is 30–60 ms.

Compounding it: **the same physical location gives different answers depending on which tab
it was added from.** "London, UK" (city → haversine, no backbone term) and `eu-west-2 London`
(region → matrix lookup, no distance term) are the same building.

**Fix (staged):**
1. Correct the doc — the matrix is *not* symmetric. Do not "fix" it by symmetrising; direction
   may be real. Just stop claiming otherwise.
2. Surface uncertainty rather than removing it — see R7.
3. When a city endpoint's coordinates fall within ~50 km of an AWS region, show an inline note
   that the two models will differ, and offer to switch.

### R7. Precision theatre — show bands, not point estimates

**Location:** `renderDashboard()`, `renderBreakdown()`, recommendation cards, PDF/CSV exports

Given R6, rendering `87ms` and `+13ms headroom` overstates what the model knows.

**Fix:** derive a confidence band from the model's own disagreement — for endpoints resolvable
both ways, `|haversine estimate − matrix estimate|`; otherwise a flat ±20%. Display
`80–110 ms` with the point estimate as a tooltip. Add a per-recommendation confidence chip
(High / Medium / Low) driven by band width relative to the SLA.

Counterintuitively this makes the tool **more** persuasive with a customer, because it
survives being challenged. Keep the exports consistent — a CSV showing `87` beside a UI
showing `80–110` reintroduces the problem.

### R8. Charts never re-render on filter change

**Location:** `applyGapFilters()` ~L4724 (ends with `updateGapMetrics(); renderGapTable();`)

`renderGapCharts()` reads `gapFilteredData` but is never called from `applyGapFilters()`.
Tiles and table filter; charts silently don't.

Worse: changing one chart's bucket dropdown calls `renderSingleChart()`, which *does* read
filtered data — so that chart jumps to the filtered set while the other three still show
everything. Two charts side by side, different populations, no indication.

**Fix:** add `renderGapCharts();` to the end of `applyGapFilters()`.

**Design decision required first.** A drill-through sets a bucket filter; if charts then
re-render against that filter, the chart collapses to the single bar the user clicked, which
is disorienting. Recommended: charts always render against filters **except** `gapBucketFilter`,
which is a chart-originated selection and should render as a *highlighted* bar, not a filter.
Document whichever you choose in `SPEC.md` under invariants — this is exactly the kind of
decision that gets silently reversed later.

### R9. `normalizePhoneNumber()` silently corrupts numbers, then marks them Valid

**Location:** `normalizePhoneNumber()` ~L4669

```js
Number("4.47305E+11").toString()  // → "447305000000"
```

Six significant digits survive; the rest become zeros. The result then passes
`validateUKNumber()` — 12 digits, `447` prefix, no identical digits, no ascending run — and
renders as a green **Valid** pill. A mangled number reported as clean is worse than one
reported as invalid.

**Fix:** detect precision loss and fail closed.

```js
function normalizePhoneNumber(value) {
  if (!value) return value;
  const m = /^(\d)(?:\.(\d+))?[Ee]\+(\d+)$/.exec(String(value).trim());
  if (m) {
    const mantissaDigits = 1 + (m[2] ? m[2].length : 0);
    const totalDigits = parseInt(m[3], 10) + 1;
    if (mantissaDigits < totalDigits) {
      return { value: String(value), lossy: true };   // caller marks row suspect
    }
  }
  // ...existing strip + re-prefix path
}
```

Add a `Truncated by spreadsheet` reason to `gapReasonBucket()` so these land in their own
breakdown chip. **These rows must never be counted as valid** — that is the whole point.

### R10. Pairing keys use un-normalised values

**Location:** `pairGapCalls()` ~L4976

```js
const key = gapPairingKeys.length > 0
  ? gapPairingKeys.map(h => row.raw[h] ?? '').join('|')
  : row.from + '|' + row.to;
```

`row.raw` is the untouched CSV cell. Every other part of the app uses `row.from` / `row.to`
after normalisation. `447305409280` and `+447305409280` are the same call and will fail to
pair — and the normalisation exists precisely because the data arrives inconsistent.

**Fix:** normalise on the way into the key. Note this must apply to the default `from|to` path
*and* to custom `gapPairingKeys` when the selected header maps to a phone-number column; for
non-phone columns (e.g. a trunk ID) normalising would be wrong, so gate on whether the header
equals `gapColumnMapping.from` / `.to`.

### R11. Duplicate detection is time-unbounded

**Location:** `pairGapCalls()`, reclassification loop ~L5010

Any `unverified` signing sharing a key with *any* `paired` signing becomes `duplicate`,
regardless of whether it was 800 ms or eight hours later. This silently drains the headline
"signed but not verified" metric — the number the tool exists to produce.

**Fix:** only reclassify when the unverified signing falls within `gapPairWindow` of a paired
signing on the same key. Everything else stays `unverified`.

This changes counts in `e2e/gap/gap-dup.spec.js`. Verify the new numbers by hand before
updating assertions — the tests currently encode the buggy behaviour.

### R12. Sorting by Time sorts the string, not the timestamp

**Location:** `renderGapTable()` sort comparators (both group and flat branches)

`gapSortColumn === 'time'` compares `row.time` lexicographically. Correct for ISO 8601,
wrong for `31/07/2025 19:00`, epoch seconds, or mixed formats — while `row.timestamp` is
already parsed and sitting on the row.

**Fix:** special-case `time` to compare `row.timestamp`, preserving the existing rule that
`timeValid === false` sorts to the bottom regardless of direction.

**Related:** the UK Valid `<th>` has no `onclick`. Nine columns are sortable; the docs claim
ten. Either add the handler or correct the docs — I'd add it.

### R13. Session import performs no validation

**Location:** `handleImport()` ~L4041

Every field is taken on trust. An out-of-range `selectedFootprint` index yields
`regions[undefined]` inside the coverage loop. `globalSLA = data.globalSLA || 150` turns a
`0` into `150`.

**Fix (deliberately minimal — this is about data integrity, not attackers):**

```js
const before = (data.selectedFootprint || []).length;
selectedFootprint = (data.selectedFootprint || [])
  .filter(i => Number.isInteger(i) && i >= 0 && i < regions.length);
if (selectedFootprint.length < before) {
  showToast(`${before - selectedFootprint.length} cell(s) dropped — unknown region index`, true);
}
```

Same treatment for `customers[].regionIdx`. Replace `||` defaults with `??` for all numerics.

This matters most **because of R4**: a session exported before the region fix contains indices
that afterwards mean a different region. "2 endpoints dropped" is a far better outcome than a
silently wrong plan.

### R14. `computeGreenPlan()` reports success when nothing is reachable

**Location:** `computeGreenPlan()` ~L3090

```js
const globalRelaxation = finiteRelaxations.length > 0 ? Math.max(...finiteRelaxations) : 0;
```

If *every* endpoint is unreachable, all values are the `MAX_SAFE_INTEGER` sentinel,
`finiteRelaxations` is empty, `globalRelaxation` falls to `0`, and the panel reports that no
relaxation is needed while nothing is green.

**Fix:** distinguish "nothing needs relaxation" from "nothing can be relaxed into range" and
render an explicit *not achievable at any SLA* state.

---

## P2 — Security

### R15. Unescaped CSV data in the Gap Analyzer table and filter dropdowns

**Location:** `renderGapTable()` (both branches), `populateGapFilterDropdowns()` ~L4715

`escapeHtml()` exists and is used in **7 of 53** `innerHTML` sites. The data table
interpolates `row.time`, `service`, `from`, `to`, `status`, `customer`, `sourceIP` raw — only
the *custom* columns are escaped. `populateGapFilterDropdowns()` builds `<option>` markup from
raw values. A CSV with `"><img src=x onerror=...>` in a customer column executes; CSP won't
stop it (`'unsafe-inline'`).

**Fix:** escape every CSV-derived interpolation, in cell content *and* attribute position
(`title="${pillTitle}"` included). Then make it structural rather than remembered — extract a
single row-template function used by both branches, with escaping applied inside it.

**Note:** the two branches have already drifted — grouped mode's `pillTitle` is missing the
`duplicate` case that flat mode has. That drift is the argument for the extraction, not just
the escaping.

### R16. CSV formula injection on export

**Location:** `exportGapData()` ~L5572; also `exportSessionCSV()`, `exportOnboardingCSV()`

Values are quote-escaped but not prefix-guarded. `=cmd|'/c calc'!A1` survives the round-trip
into Excel. This matters specifically because the intended workflow is EDR → ATLAS → Excel.

**Fix:**

```js
function csvCell(v) {
  const s = String(v ?? '');
  const guarded = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
  return '"' + guarded.replace(/"/g, '""') + '"';
}
```

Apply to headers too — custom column display names are currently unquoted, so a name
containing a comma breaks the file.

**While here:** `row.processingTime || ''` exports 0 ms as blank (data loss on the fastest
requests), and the summary block uses `Math.abs(signing - verify)` while the UI tile shows a
signed value — export and UI disagree on sign convention.

### R17. Supply chain and CSP

Covered operationally in R3. Two additional items:

- **CSP is currently a no-op.** `default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:`
  permits exfiltration to any HTTPS host. The app makes no XHR calls, so `connect-src 'none'`
  is free and turns the privacy claim into something enforced rather than asserted. Verify
  Leaflet tile loading still works (that's `img-src`, not `connect-src`) and that DHTMLX
  doesn't XHR at runtime.
- The privacy note reads *"never sent to a server."* That is true of the app's own code but
  six third-party scripts run with full DOM access over that data. Tightening `connect-src`
  is what makes the sentence honest.

---

## P3 — Robustness, interaction, accessibility

### R18. Falsy-zero coercions

| Location | Bug |
|---|---|
| `applyGapFilters()` `parseFloat(x) \|\| null` | proc-time filter of `0` never applies |
| `exportGapData()` `row.processingTime \|\| ''` | 0 ms exports as blank |
| `handleImport()` `data.globalSLA \|\| 150` | `0` becomes `150` |
| `updateOnboardingFinancials()` | margin = 100 → `marginMultiplier <= 0` → price silently equals cost |

**Fix:** `??` throughout. The margin case needs a visible error, not a silent fallback — a
quoting tool that quietly quotes at cost is the worst failure mode in this file.

### R19. Ambiguous date parsing

**Location:** `processGapData()` timestamp block ~L4600

The fallback `new Date(trimmed)` reads `01/02/2025` as **January 2nd** in V8. For UK EDR data
that is a wrong date flagged `timeValid: true`.

**Fix:** try explicit formats in order (ISO, then `DD/MM/YYYY HH:mm:ss`), and when a string is
ambiguous, surface a one-time toast asking the user to confirm day-first vs month-first. Do not
guess silently.

### R20. Whole-file `readAsText` with no size guard

**Location:** `readGapFile()` ~L4286

A 200 MB EDR export loads into a single string and hangs the tab with no warning.

**Fix:** check `file.size` and warn above ~50 MB with an explicit confirm. Streaming is the
real answer but is a larger change; the guard is ten minutes and prevents the bad experience.

### R21. Duplicate CSV headers collide silently

**Location:** `readGapFile()`, `gapRawData` construction

`row[header] = r[idx]` — duplicate header names overwrite (last wins), and columns beyond the
header row's width are dropped. Empty header names collapse to key `''`.

**Fix:** de-duplicate on read (`name`, `name (2)`, …) and report it in the summary toast.

### R22. Modal and keyboard accessibility

- **Escape** now closes the help drawer, click-place mode, and the mapping modal. Still not
  handled: proposal, export scope, confirm-reset, scenarios.
- Only 3 of 7 modals carry `role="dialog"` / `aria-modal`. **None trap focus** — tabbing from
  an open modal walks into the page behind it.
- **Gateway cards are `<div onclick>`** with no `tabindex` or `role="button"`. The app's front
  door is keyboard-inaccessible.
- Six `aria-label`s across 5,800 lines.

**Fix:** one `openModal(id)` / `closeModal(id)` pair handling Escape, focus trap, focus
restore on close, and `aria-hidden` on the background. Convert gateway cards to `<button>`.

### R23. Duplicated logic that has already drifted or will

| Duplication | Risk |
|---|---|
| Table row template, grouped vs flat branch | **Already drifted** — `duplicate` case missing from grouped `pillTitle` |
| Group key: `renderGapTable()` uses `pairStatus === 'paired'`, `handleGapPagination()` uses `pairId ?` | Agree only because `pairGapCalls()` nulls `pairId` on duplicates. Change that line and pagination silently disagrees with the table |
| Filter-reset field list, in `resetGapFilters()` and `drillDownPair()` | New filter added to one, forgotten in the other |

**Fix:** extract `gapRowTemplate(row, ctx)`, `gapGroupKey(row)`, `clearGapFilterInputs()`.

### R24. `showModule()` id foot-gun

**Location:** `showModule()` ~L1635

```js
if (el.id === 'main-content') el.id = el.getAttribute('data-module-id') || '';
```

A missing `data-module-id` permanently blanks the element's id. Safe today; not safe against
the next edit. Use `if (dataId) el.id = dataId;`.

---

## Product changes agreed

### R25. Split the "Invalid" pill into three findings

**Location:** `validateUKNumber()`, `gapReasonBucket()`, table pill, breakdown chips, help text

One red pill currently conflates three unrelated things:

1. **Malformed** — fails E.164 structure. A real data-quality defect.
2. **Non-UK** — a `+33` destination is perfectly valid, just not British. Not a defect.
3. **Suspected test data** — sequential or repeated digits. A *heuristic*, not a validity rule,
   and it will produce false positives on legitimate numbers.

Ops teams will chase category 3 as though it were category 1.

**Fix:** return `{ valid, category, reason }` with categories `malformed` / `non-uk` /
`suspected-test` / `valid`, render three distinct pill styles, split the breakdown chips, and
rename the tile from "Invalid UK Numbers" to "Destination Issues" with a category split
beneath. Update the `<th>` tooltip and help drawer, which currently describe the merged
behaviour.

Cheap, and it materially changes whether people trust the number.

### R26. Onboarding: contingency, and assumptions as a pre-seeded textarea

**Location:** `updateOnboardingFinancials()`, ribbon, `tierStates`, PDF/CSV/JSON export

**Contingency must stay structurally separate from margin.** Margin is profit; contingency is
the expected cost of uncertainty. Conflate them and an overrun is undiagnosable — you can't
tell mispricing from misestimation, you just watch margin evaporate.

```
billableHours = baseHours + contingencyHours
internalCost  = billableHours × rate
customerPrice = internalCost ÷ (1 − margin)
```

Two implementation notes that will bite otherwise:

- Contingency hours are **derived**, and must **not** pass through the 4-hour ceiling rule.
  Snapping base hours and then snapping again compounds the rounding.
- Contingency must **not** automatically inflate `duration`. A cost buffer and a schedule
  buffer are separate decisions. Offer schedule contingency as an optional phantom task at the
  end of the Gantt, default off.

Internally show a **range** (base → risk-weighted, with the matching price band), consistent
with R7. Externally the PDF shows one committed number. **Do not itemise contingency to the
customer** — a visible "20% risk buffer" line gets negotiated away.

**Assumptions & exclusions — textarea, one per tier, pre-seeded with editable default text.**
Same implementation cost as an empty box, but an empty box gets skipped and a pre-filled one
gets edited. Store in `tierStates[tier].assumptions` so it survives tier switching, and include
it in session JSON, CSV, and as a PDF section.

Suggested Tier 1 seed text:

> **Assumptions:** Customer provides rack space, power and cross-connects by Day 0. Customer
> network team available for firewall changes within 2 business days. Testing against a single
> SIP trunk. One round of UAT. Delivery is remote.
>
> **Exclusions:** Hardware and circuit costs. Third-party licences. Out-of-hours cutover.
> Number porting. Support beyond the hypercare window.

Add one line of change-control language beside the existing 50/50 invoicing terms — additional
work beyond this scope at $X/hr. Nearly free, and it is what actually protects the margin the
contingency split just made visible.

---

## Suggested order

1. **R3** — the Chart.js hash. The Gap Analyzer is broken right now; the unblock is one
   attribute deletion. Do the full remediation (dead plugin removed, hashes regenerated,
   html2pdf checked, load guard added) in the same sitting.
2. **R27** — presentation failures must not roll back the pipeline. Ten minutes, and it caps
   the damage of every future dependency failure.
3. **R1, R2** — the overlay lock. Under an hour.
4. **R4, R5, R13** — regions, physics assertion, import bounds-check. Do these together; the
   import guard is what makes the region renumbering safe.
5. **R8, R15, R16, R10** — charts, escaping, CSV guard, pairing normalisation.
6. **R9, R11, R12, R14, R18** — the remaining correctness bugs.
7. **R25, R7, R26** — the product changes.
8. **R17, R19–R24** — hardening and interaction.

Steps 1–5 are roughly a day and remove every finding capable of producing a confidently wrong
answer in front of a customer.

---

## What is already solid

Worth recording, because it's the part that shouldn't be disturbed:

- All 180 `getElementById` targets resolve. No inline handler references an undefined function.
  The ID-mismatch bug class that dominated this project's early history is gone.
- All 32 regions have `AWS_PRICE_INDEX` entries — no `NaN` path into OPEX.
- The RFC-4180 CSV state machine correctly handles quoted commas, quoted newlines, CRLF, BOM,
  `""` escapes and short rows. Genuinely good work.
- Chart and Leaflet teardown patterns are correct — no renderer or map-instance leaks.
- `computeCoverage()` / `computeGreenPlan()` are pure and DOM-free, which is why they were
  testable enough for this review to reach firm conclusions about them.
