# ATLAS — Feature Reference

**Audience:** PMs, ops users, anyone writing help text or demo scripts, and any AI picking up
this project without reading the code.

**Contract:** this file describes what a user sees and does. It contains **no function names,
no variable names, no file locations**. That constraint is deliberate — it means this file and
`SPEC.md` can never quietly contradict each other on the same fact, because they never state
the same fact.

- How it is built → `SPEC.md`
- What changed and when → `CHANGELOG.md`

**Last verified against the app:** 2026-08-13 (Phase 4.6: filter bug, summary row, timing charts, build-first).

---

## The suite

ATLAS covers three points in a customer's lifecycle:

1. **Plan the infrastructure** — where to put AWS cells so latency SLAs are met (Optimizer)
2. **Scope and price the onboarding** — how many engineering hours, over what timeline, at what
   price (Onboarding Calculator)
3. **Verify production data quality** — whether signing and verification records reconcile, and
   whether destination numbers are sound (Call Auditor)

The three modules are independent. There is no shared customer record — a customer's name is
entered separately in each. This is a known and accepted limitation.

**Who uses it.** Solutions architects and PMs use the Optimizer and the Onboarding Calculator.
Network operations and monitoring teams use the Call Auditor.

**Common to all three.** A landing page with one-click launch into any module. A persistent
header with a home button and module-specific actions. Context-aware help: a floating "?" button
opens the help drawer on the tab for the module you are in, each tab with a table of contents.
Toast notifications for every action that completes or fails. Dark theme throughout, with a
colour per module — green for the Optimizer, blue for Onboarding, violet for the Call Auditor.

**Privacy.** Nothing is uploaded. All processing happens in the browser, and session state moves
between machines as exported files rather than through a server.

---

## Cell Placement Optimizer

A four-step wizard producing a deployment plan: which new AWS cells to stand up so that every
endpoint meets its latency SLA, and roughly what that costs per month.

### Step 1 — Current footprint

Select the AWS cells you already run, either from a searchable list grouped by continent or from
a world map with pulsing markers.

Optionally open the **Infrastructure Cost Profile** and enter the real monthly cost of any
selected cell. From those figures the tool works backwards to a normalised global base cost,
which it then uses to estimate what any other region would cost. Two modes: **Blended** averages
every cell you entered; **Specific** anchors everything to one chosen cell. Enter nothing and it
falls back to a Paris-derived default. A summary line always states which of the three is in
effect, so the number on screen is never unexplained.

### Step 2 — Endpoint locations

Add the places your customers actually are, from two searchable tabs: **AWS Regions**, or
**World Cities** carrying a T1–T4 tier badge indicating local infrastructure quality.

You can also switch on **Click to Place on Map** and click anywhere; the click snaps to the
nearest known city. Leave that mode by clicking the toggle again, pressing Escape, or using the
"Done placing" button.

Adding the same endpoint twice is refused with a toast rather than silently duplicated. Each row
shows coordinates and can be deleted with the button or by focusing the row and pressing Delete.

> Each physical location can only be added once. If you add "London, UK" as a city and then try
> to add the London AWS region (which shares the same coordinates), the tool rejects the duplicate
> with a toast. When a city is within 50km of an AWS region, a proximity note shows which backbone
> region is used.

### Step 3 — SLA configuration

**Latency estimation.** One unified model — no mode selector. When a city endpoint is within 50 km
of an AWS region, the measured backbone matrix latency is used directly. Otherwise, distance-based
estimation applies (Haversine × 0.012 ms/km + infrastructure tier tax).

**SLA mode.** Either one global threshold for everything (default 150 ms), or a custom threshold
per endpoint with a live latency preview beside each.

**Safety margin** (default 20 ms) is the minimum headroom a new cell must leave between the
estimated latency and the SLA before the tool will recommend it. Set it to zero for plain
pass/fail. **Internal processing time** (default 10 ms) is added to every estimate.

> Uncertainty is surfaced via per-recommendation latency bands and a confidence chip, with a
> tooltip on the safety margin; the detailed explanation lives in the help drawer.

### Step 4 — Coverage analysis

The dashboard. Six headline figures: total endpoints, already covered, pending coverage,
marginal headroom, new cells needed, and estimated monthly OPEX. Beneath them a strategy summary
giving average served latency, minimum headroom, and a hint about how much SLA relaxation would
clear the marginal cases.

A **coverage map** plots endpoints by state — covered, pending, marginal, impossible — with
recommended new cells shown as diamonds carrying a monthly cost chip and dashed lines to the
endpoints they serve. Marginal endpoints appear as orange exclamation markers whose popup gives
the best available headroom and the relaxation required.

Four result lists follow: **Already Covered** (with a "Marginal" badge where an existing cell
only just meets the SLA), **Pending Coverage**, **Marginal Headroom** with relaxation hints, and
**Impossible SLA** for endpoints no region can serve.

**Recommended New Cells** are cards giving the cell, its tier, its cost, how many endpoints it
covers, minimum and average headroom, and per-endpoint detail. Both this section and the
**Latency Explorer** are collapsible (chevron toggle) and can be collapsed to reduce scrolling.
Recommended New Cells appears above Latency Explorer in the dashboard.

The **Latency Explorer** shows the five best candidate cells for each uncovered endpoint with a
full breakdown — backbone, distance, infrastructure tax, processing — as coloured segments with
tooltips, plus a cost chip. It exists to make the recommendation legible rather than oracular.

Edge cases are handled explicitly: everything already covered shows a success state; nothing
coverable shows an "Impossible SLA" explanation.

### What-if tools

**Make Everything Green.** Calculates the SLA relaxation that would bring every endpoint into
compliance — either one relaxed global SLA, or the exact relaxation each endpoint needs — and
shows the extra OPEX that buys. When no endpoint is reachable at any SLA, the panel reports
this explicitly.

### Saving and sharing

- **Saved Scenarios** — name and store a configuration with its summary stats, then reload or
  delete it later. Stored on this machine only.
- **Session file** — export the full configuration as a file and import it on another machine.
- **CSV report** — the analysis as a spreadsheet, including headroom columns and marginal cases.
- **Share Report** — a self-contained HTML file with everything inline; it opens anywhere, with
  no internet connection.
- **Client Proposal PDF (BETA)** — see below.

---

## Onboarding Calculator

A scoping and quoting workspace built around an editable project timeline.

### The ribbon

**Blended rate** ($/hr, default 100), **desired margin** (%, default 20), **deployment scope**
(Tier 1 Full Deployment, Tier 2 Integration Only, Tier 3 Standard Onboarding), and a
**Link Duration to Cost** toggle, off by default.

A live financial summary recalculates on every edit: project duration in days, total estimated
hours, total internal cost, and the customer price.

### The timeline

Rows are editable in place — no dialogs. Drag to reorder. Type directly into the task name and
estimated-hours fields; estimated cost and visual days update as you type. Every task has a
delete button.

On the chart side, drag the circle at the end of a bar onto another task to create a dependency
arrow; double-click an arrow to remove it. Drag bar edges to resize. Whether resizing changes
cost depends on the Link Duration toggle: on, resizing recomputes hours; off, duration is purely
visual and cost stays locked. Tooltips distinguish billed effort from visual calendar time.

**Hours snap upward to the nearest four**, minimum four. Entering 17 gives 20. This keeps
scoping conversations in clean increments.

**The calendar is generic** — "Day 0, Day 1, Day 2…" rather than real dates, with weekends
ignored. Scoping stays clean and undated until a real start date exists.

### Tiers

Each tier remembers its own tasks and dependencies. Switching tiers preserves your work silently;
only the explicit **Reset Timeline** action discards it, and it asks first.

Tier 1 covers full deployment from provisioning a near-prem cell through go-live and hypercare,
with project coordination spanning the whole engagement. Tier 2 is the same without provisioning.
Tier 3 is a light path — QA, training, cutover, coordination.

### Pricing

Customer price is derived from internal cost and the margin you set: a 20% margin means the price
is the cost divided by 0.8.

> Setting margin above 99% clamps to 99%. Non-numeric input is treated as 0%. Contingency is now a
> separate control used as a buffer for estimation uncertainty.

### Export

Client proposal PDF, session file for transferring work between machines, and a CSV quote
covering the financials plus all three tier schedules.

---

## Call Auditor

Upload an EDR call-data export and find out whether signing and verification records reconcile,
and whether destination numbers are valid.

### Upload and mapping

Drop a CSV onto the upload zone or pick it with the file browser. A mapping dialog then asks
which column is which — time, service, from, to, status, customer, source IP, processing time.
Columns are pre-selected wherever the header names are recognisable; time, service and
destination are required. A live preview shows the first row as you map, so mistakes surface
before analysis rather than after.

**Pairing key.** By default a call is identified by its from and to numbers. You can add up to
four columns to that key — useful when the export carries a trunk or session identifier that
makes matching more reliable.

**Additional columns.** Any column not mapped to a core field can be added to the table with a
display name of your choosing. Those columns appear in the table and in exports.

**Thresholds.** The dialog also sets the slow-request threshold (default 100 ms) and the pairing
window (default 1000 ms). Both take effect immediately when changed.

Cancelling the dialog discards changes rather than half-applying them.

### Number validation

Every destination number is normalised — recovering numbers a spreadsheet mangled into
scientific notation, and re-adding a plus sign a spreadsheet stripped — then checked against UK
numbering rules: correct country code, plausible length, an allocated prefix digit, and not an
obvious placeholder such as all-identical or sequential digits.

Results appear as a Valid or Invalid pill per row, an **Invalid UK Numbers** headline figure, and
a breakdown panel of clickable reason chips (Empty, Non-UK, Not +44, Wrong length, Bad prefix,
Identical digits, Sequential run) that filter the table when clicked. The chips show human-readable
labels, never internal identifiers.

> Destination numbers are now categorised three ways: **Malformed** (fails E.164 structure),
> **Non-UK** (valid number, wrong country), and **Suspected** (test data patterns). Each gets
> its own pill color. The tile reads "Destination Issues." Hovering a Non-UK chip shows the
> destination's country code in the tooltip.
>
> The breakdown panel sits directly above the data table it filters, so clicking a chip shows
> results immediately without scrolling.
>
> A number truncated by a spreadsheet during export fails validation rather than being reported
> as Valid. Precision loss in scientific notation is detected at the normalisation stage.

### Call pairing

There is no correlation ID in EDR data, so pairing is inferred. Records are ordered by time and
each verification is matched to the **earliest** unmatched signing with the same key inside the
pairing window. A signing that ages out of the window without a match is reported as unverified.

Five outcomes: **Paired**, **Signed · not verified**, **Verified · not signed**, **Duplicate**
(a superseded retry), and **Unpairable** (no usable timestamp).

The Call Pairing panel shows match rate, unverified and unsigned counts, duplicates, unpairable
records, and the median and 95th-percentile time to verify. An info icon on the Time-to-Verify
tile explains that median is the typical hand-off, P95 is the slow 5%, and a large P95-vs-median
gap means sporadic slow hand-offs. Each block is clickable and filters
the table. A correlation line relates unverified signings to invalid destinations — the question
of whether failures cluster on bad numbers.

The panel always reflects the **whole dataset**, not the current filter, because a signing and
its verification can fall on opposite sides of a filter.

**About the window.** 1000 ms was calibrated against real data: it pairs 100% of call outcomes,
where 500 ms pairs only 49%. The gap is an artefact of timestamps being logged to whole seconds —
a pair spanning a second boundary looks 1000 ms apart even when it was 20 ms. Sub-second handoff
latency is not observable from this data, so 1000 ms is the smallest usable window. If the export
format ever gains millisecond timestamps, recalibrate using the observed 95th percentile.

> A signing is now only reclassified as a duplicate if it falls within the pairing window of a
> paired signing on the same key. Signings hours apart stay as unverified.

### Dashboard and filters

Eight headline tiles in a 4×2 grid: total records, paired calls, signing requests, verification
requests, destination issues, slow requests, gap count, and gap percentage. **Every tile is
clickable** and filters the table to the records behind it. The Paired Calls tile shows the
distinct pair count from filtered data and displays the global match rate beneath.

Tiles reflect the current filter. When a filter is active, a strip appears showing the
unfiltered totals alongside the paired count, so you always know what fraction of the dataset you
are looking at.

Filters cover service type, validation status, from and to substring search, status code,
customer, source IP, processing-time range, and pair status, with one-click Reset All.

### Charts

Seven charts, all clickable to filter the table to the time bucket you click:

1. **Requests Over Time** — signing and verification request counts as two lines, with the area
   between them shaded so divergence is immediately visible. Count axes use whole numbers.
2. **Invalid Numbers Over Time** — discrete lollipop bars at only the buckets where invalid events
   exist (empty buckets are not shown); rare events read correctly as events rather than a flat line
3. **Signing vs Verification Volume** — stacked bar with four colours: blue for signing valid,
   light blue for signing invalid, green for verification valid, light green for verification invalid.
   Hue carries service, treatment carries validity. Count axes use whole numbers.
4. **Processing Time Distribution** — split into signing-avg and verification-avg
5. **Time to Verify** — median and 95th percentile handoff time
6. **Pair Processing** — median and 95th percentile of signing + verification processing time
7. **End-to-End** — median and 95th percentile of signing + handoff + verification time

Charts 5–7 are timing charts computed from paired rows only. When no pairs exist, they show
"No paired calls in the current view." instead of an empty axis.

Each chart has a **Series dropdown** that lets you show/hide individual series (e.g., "Signing only"
or "Verification only"). Default is "Both" for all charts.

Bucket size is chosen automatically from the span of the data — minutes for an hour of data, days
for a month — and each chart has its own override dropdown. The auto option shows the actual
interval (e.g., "Auto (5 Min)"). All dropdowns use the `.atlas-select`
class for consistent dark-theme styling: dark background, light text, custom light chevron,
and `color-scheme: dark` for native dark popups. Changing the Processing Time bucket
dropdown correctly re-renders that chart. Axis labels are capped at 15 per chart and are
human-readable (`Jul 31, 19:00`) in UTC. When all records fall within one bucket, or when
filters reduce a chart to zero rows, a message is shown instead of an empty axis.

> Charts now update when filters change.

### Column-header filters

Every column header has a filter icon that opens a dropdown with the same filter controls as the
filter bar. Changing a header filter updates the matching filter bar control and vice versa.
Reset All clears both. The Time and Processing Time columns have custom range inputs.

### Call Pairing panel

The Call Pairing panel shows pair-level metrics in a four-column grid (two clean rows at the
large breakpoint):

- **Time to verify** — mean, median, and P95 handoff time between signing and verification
- **Pair processing (S+V)** — mean, median, and P95 of signing + verification processing time
- **End-to-end (S+H+V)** — mean, median, and P95 of signing + handoff + verification

The TTV chart shows median + P95 only (no mean line); mean lives in the panel.

### Data table

Ten columns, sortable, paginated at 25, 50 or 100 rows. The Time column header reads "Time (UTC)"
to make the timezone assumption explicit — all times shown are UTC. A timestamp arriving with a
different timezone offset is converted to UTC automatically; hovering the cell shows the original
source value. Epoch timestamps are formatted as readable UTC dates. Rows with unreadable timestamps
carry an
amber warning icon and always sort to the bottom. Paired rows show their pair ID on the pill.

Hovering a paired row highlights its partner and dims everything else; if the partner is on
another page, the tooltip says which one. Paired pill tooltips include processing time and
end-to-end metrics.

**Group by pair** reorders the table so paired rows sit together, with alternating shading and a
divider between groups. Each paired group gets a summary row showing handoff, processing, and
end-to-end times. Pagination then counts groups rather than rows, and the label changes to
say so.

> All ten columns are sortable. Sorting by Time compares the parsed timestamp rather than
> the text representation.

### Export

Three export scopes:

1. **Filtered Results** — export only currently filtered and visible rows
2. **All Results** — export complete dataset without any filters applied
3. **Pair Summary** — one row per paired pair with timing metrics (pairId, from, to, signTime,
   verifyTime, handoffMs, signProcMs, verifyProcMs, pairProcessingMs, endToEndMs)

The CSV opens with a summary block — totals, invalid-reason breakdown, pairing summary — followed
by the full rows including pair status, pair ID, time to verify, and any custom columns.

> Values beginning with `=`, `+`, `-`, or `@` are now prefixed to prevent formula execution
> in Excel. Processing times of 0 ms are exported as `0` rather than blank.

---

## Client Proposal PDF (BETA)

One external-facing document generated from Optimizer and Onboarding data. Enter client name,
preparer, date and project title, then choose independently whether to include the infrastructure
strategy, the implementation timeline, and the financial quote. The infrastructure section is
generated on demand, so it works even if you never opened the coverage dashboard.

**Internal margins are masked by design.** The financial section shows only the customer price —
internal cost and blended rate never appear. Invoicing terms state 50% at kickoff, 50% at go-live.

Marked BETA, with a warning banner. Check the output before sending it to a customer.
