# ATLAS — Feature Reference

**Audience:** PMs, ops users, anyone writing help text or demo scripts, and any AI picking up
this project without reading the code.

**Contract:** this file describes what a user sees and does. It contains **no function names,
no variable names, no file locations**. That constraint is deliberate — it means this file and
`SPEC.md` can never quietly contradict each other on the same fact, because they never state
the same fact.

- How it is built → `SPEC.md`
- What changed and when → `CHANGELOG.md`
- Known defects → `REVIEW.md`

**Last verified against the app:** 2026-08-06 (review pass — all ⚠ resolved).

> Where behaviour below is currently defective, it is marked ⚠ with the `REVIEW.md` reference.
> The description is of *intended* behaviour; the marker says don't trust it yet.

---

## The suite

ATLAS covers three points in a customer's lifecycle:

1. **Plan the infrastructure** — where to put AWS cells so latency SLAs are met (Optimizer)
2. **Scope and price the onboarding** — how many engineering hours, over what timeline, at what
   price (Onboarding Calculator)
3. **Verify production data quality** — whether signing and verification records reconcile, and
   whether destination numbers are sound (Gap Analyzer)

The three modules are independent. There is no shared customer record — a customer's name is
entered separately in each. This is a known and accepted limitation.

**Who uses it.** Solutions architects and PMs use the Optimizer and the Onboarding Calculator.
Network operations and monitoring teams use the Gap Analyzer.

**Common to all three.** A landing page with one-click launch into any module. A persistent
header with a home button and module-specific actions. Context-aware help: a floating "?" button
opens the help drawer on the tab for the module you are in, each tab with a table of contents.
Toast notifications for every action that completes or fails. Dark theme throughout, with a
colour per module — green for the Optimizer, blue for Onboarding, violet for the Gap Analyzer.

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

> The same physical location can be added two ways — "London, UK" as a city, or the London AWS
> region — and the tool will estimate different latencies for each. When a city is within 50km
> of an AWS region, a proximity note now warns that the two models will differ.

### Step 3 — SLA configuration

**Latency estimation model.** *Realistic* (default) estimates from real-world distance plus a
penalty for local infrastructure quality. *Naive* uses AWS's own inter-region measurements as a
proxy. Realistic is the better default for endpoints that are cities rather than AWS regions.

**SLA mode.** Either one global threshold for everything (default 150 ms), or a custom threshold
per endpoint with a live latency preview beside each.

**Safety margin** (default 20 ms) is the minimum headroom a new cell must leave between the
estimated latency and the SLA before the tool will recommend it. Set it to zero for plain
pass/fail. **Internal processing time** (default 10 ms) is added to every estimate.

> The underlying latency data disagrees with itself by 30–60 ms in places — more than the
> default safety margin. A warning note is shown in Step 3. Recommendation cards now display
> latency bands (lo–hi ms) with a confidence chip (High/Medium/Low).

### Step 4 — Coverage analysis

The dashboard. Six headline figures: total endpoints, already covered, pending coverage,
marginal headroom, new cells needed, and estimated monthly OPEX. Beneath them a strategy summary
giving average served latency, minimum headroom, and a hint about how much SLA relaxation would
clear the marginal cases.

A **coverage map** plots endpoints by state — covered, pending, marginal, impossible — with
recommended new cells shown as diamonds carrying a monthly cost chip and dashed lines to the
endpoints they serve. Marginal endpoints appear as yellow exclamation markers whose popup gives
the best available headroom and the relaxation required.

Four result lists follow: **Already Covered** (with a "Marginal" badge where an existing cell
only just meets the SLA), **Pending Coverage**, **Marginal Headroom** with relaxation hints, and
**Impossible SLA** for endpoints no region can serve.

The **Latency Explorer** shows the five best candidate cells for each uncovered endpoint with a
full breakdown — backbone, distance, infrastructure tax, processing — as coloured segments with
tooltips, plus a cost chip. It exists to make the recommendation legible rather than oracular.

**Recommended New Cells** are cards giving the cell, its tier, its cost, how many endpoints it
covers, minimum and average headroom, and per-endpoint detail.

Edge cases are handled explicitly: everything already covered shows a success state; nothing
coverable shows an "Impossible SLA" explanation.

### What-if tools

**Make Everything Green.** Calculates the SLA relaxation that would bring every endpoint into
compliance — either one relaxed global SLA, or the exact relaxation each endpoint needs — and
shows the extra OPEX that buys. When no endpoint is reachable at any SLA, the panel reports
this explicitly.

**Marginal Upgrade Plan.** A switch on the Marginal Headroom card. Switched on, it re-runs the
analysis with the safety margin removed and shows what would change: how many cells get added,
the cost difference, and for each marginal endpoint either the cell that would cover it or the
relaxation it still needs. Read-only — it never alters the real analysis, and exports stay
strict. Off by default on every load. When there are no marginal endpoints, the panel shows a
no-upgrades-needed message.

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

> Setting margin to 100 (or above) shows an error and clamps to 99%. Contingency is now a
> separate control used as a buffer for estimation uncertainty.

### Export

Client proposal PDF, session file for transferring work between machines, and a CSV quote
covering the financials plus all three tier schedules.

---

## Gap Analyzer

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
a breakdown panel of clickable reason chips (`sequential run ×3`, `wrong length ×1`, …) that
filter the table when clicked.

> Destination numbers are now categorised three ways: **Malformed** (fails E.164 structure),
> **Non-UK** (valid number, wrong country), and **Suspected** (test data patterns). Each gets
> its own pill color. The tile reads "Destination Issues."
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
records, and the median and 95th-percentile time to verify. Each block is clickable and filters
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

Seven headline tiles: total records, signing requests, verification requests, gap count, gap
percentage, invalid UK numbers, and slow requests. **Every tile is clickable** and filters the
table to the records behind it.

Tiles reflect the current filter. When a filter is active, a strip appears showing the
unfiltered totals alongside, so you always know what fraction of the dataset you are looking at.

Filters cover service type, validation status, from and to substring search, status code,
customer, source IP, processing-time range, and pair status, with one-click Reset All.

### Charts

Four charts, all clickable to filter the table to the time bucket you click:

1. **Invalid Numbers Over Time**
2. **Signing vs Verification Volume** — stacked so valid and invalid volume are readable per
   service in one bar
3. **Processing Time Distribution**
4. **Time to Verify** — median and 95th percentile

Bucket size is chosen automatically from the span of the data — minutes for an hour of data, days
for a month — and each chart has its own override dropdown. Axis labels are human-readable
(`Jul 31, 19:00`) in UTC.

> Charts now update when filters change.

### Data table

Ten columns, sortable, paginated at 25, 50 or 100 rows. Rows with unreadable timestamps carry an
amber warning icon and always sort to the bottom. Paired rows show their pair ID on the pill.

Hovering a paired row highlights its partner and dims everything else; if the partner is on
another page, the tooltip says which one.

**Group by pair** reorders the table so paired rows sit together, with alternating shading and a
divider between groups. Pagination then counts groups rather than rows, and the label changes to
say so.

> All ten columns are sortable. Sorting by Time compares the parsed timestamp rather than
> the text representation.

### Export

Choose filtered or full dataset. The CSV opens with a summary block — totals, invalid-reason
breakdown, pairing summary — followed by the full rows including pair status, pair ID, time to
verify, and any custom columns.

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
