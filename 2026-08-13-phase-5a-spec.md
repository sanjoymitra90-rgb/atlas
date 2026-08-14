# ATLAS — Phase 5A Implementation Spec: layout, interference, and one landmine

**Paste this whole file as your opening instruction.**

**For:** the AI coding agent implementing this phase.
**From:** planning session against commit `4f4e8c2`, 2026-08-13. Every claim below was checked by
running the built application in a browser or by executing the code — the reproduction is included
with each one.
**Prerequisite:** Phase 4.9 is complete. Actions run #23 is green.

**No line numbers anywhere in this document, or in anything you write.** Anchor on function names,
file paths, element IDs, CSS class names and `data-testid` values.

---

## 0. Your documents

**This document is self-contained.**

- **`docs/SPEC.md` — your contract.** It was corrected in Phase 4.9 and is accurate as of `4f4e8c2`.
  If it and this document disagree, check the code and report the discrepancy rather than picking
  one.
- **`docs/FEATURES.md` — behaviour in user language. No code identifiers, ever.**
- **`docs/CHANGELOG.md` — history only. You write to it; you do not read it as truth.**

**Do not read `claude_memory.md`.**

**Phase 5 was deliberately split.** This is **5A — layout and interference**. The rename, the SIP
response-code tooltip and the copy sweep are **5B** and are a separate conversation. Do not start
them. Task D (moving `pairGapCalls()` and `computeCoverage()` into `src/`) and the inline-handler
conversion remain deferred.

---

## 1. Why this phase is split

5A moves markup. 5B changes text. Mixing them puts a structural edit and a copy edit in one diff,
and this project has already shipped a regression that way: in Phase 4.6 a chart was moved out of a
grid, one `</div>` was left behind, `#gap-dashboard` closed 117 lines early, and the entire data
table fell outside it. Nothing in the diff looked like it touched the table.

That is the specific risk of this phase. §3 is not boilerplate — read it.

---

## 2. How this project fails — read before you write anything

Each of these has cost this project a shipped defect. Three are directly relevant here.

- **Moving markup relocates things you were not thinking about.** See §1. **After any structural
  edit, verify containment by parsing the built HTML — never by reading indentation.** Two closing
  tags at the same nesting level look identical at a glance.
- **Know what an element depends on its ancestors for.** The data table has no `hidden` class of its
  own; it inherits its hidden state from `#gap-dashboard`. Elements that inherit visibility, spacing
  or scoping from a parent are the ones that break silently when the parent moves.
- **A fix lands in one of two identical branches.** `renderGapTable()` has a grouped path and a flat
  path. Task H touches rendering. Check both.
- **A test that cannot fail is worse than no test.** Before claiming a new test works: break the
  thing it names, run it, watch it go red, restore it. Say so in the commit message.
- **A missing element is a failure, not a branch.** Do not write
  `if (el) el.doSomething()` in test or tooling code — assert the element exists.
- **Read what a failing test proves, not what it is named.** When a failure makes no sense for the
  feature named, ask what else the assertion touches.

---

## 3. Hard constraints

1. **Commit per task.**
2. **Every fix is test-first** where a test is possible. Prove every test can fail.
3. **After every task that changes markup, run a containment assertion** — see §4. This is not
   optional and it is not satisfied by reading the diff.
4. **Do not change the `showToast()` signature.** There are 43 call sites. Task B changes where the
   toast appears, not how it is called.
5. **Fix documents in the same commit as the code they describe.**
6. **`npm test` green locally under both timezones (`test:unit` and `test:unit:dhaka`), and Actions
   green, before you hand back.**
7. **If any statement in this document turns out to be wrong when you check it, say so and stop.**

---

## 4. The containment assertion

Add this as a real test, not a one-off script, in `e2e/gap/`. It must assert that after any layout
change these relationships still hold in the **built** `dist/index.html`:

- `#gap-table-body` is a descendant of `#gap-dashboard`
- the data table's wrapper is a descendant of `#gap-dashboard`
- the metrics tile grid is a descendant of `#gap-dashboard`
- the Destination Issues breakdown panel is a descendant of `#gap-dashboard`
- the charts container is a descendant of `#gap-dashboard`
- **no table is visible before a file is uploaded** — the Phase 4.6 regression's actual symptom

Write it **first**, before any of Tasks B–G, and confirm it passes on the unmodified build. A
containment test written after the fact only proves the end state, not that you did not break
something in between.

---

## 5. Task A — The copy landmine. Do this first, before any text moves.

### A1. What is wrong

In the Onboarding Gantt build, the "spans the whole project" behaviour is selected by matching a
**user-editable task name**:

```js
if (t.name === 'Project Coordination') {
```

The Gantt grid's text column renders a free-text `<input>` calling `updateGridText(task.id, value)`.
A user can rename that task, and the moment they do, the special behaviour silently stops — the bar
stops spanning the project and no error appears anywhere.

The object already carries a stable identifier: `id: "t9"` in all three tier templates.

This is the same defect class as `gapReasonBucket()`, which decided a validation category by
substring-matching a user-facing error sentence and was deleted in Phase 3. The instruction then was
"look for others." This is the one that was left. **A copy sweep is exactly what would trip it**,
which is why it is fixed here and not in 5B.

### A2. The fix

Select on the stable id rather than the display name, in both the conditional and the `Math.max`
scan inside it. Confirm `t9` is the coordination task in **all three** tier templates before you
rely on it — read them, do not assume.

### A3. Prove it

A unit or e2e test that renames the coordination task and asserts the spanning behaviour still
applies. Prove the test fails against the old name-matching code.

### A4. Then look for others

Run the same search across the whole file — logic that compares against, or substring-matches, a
string a user or a copy editor can change. Report what you find, even if you fix nothing. A planning
scan found only this one, but it was not exhaustive.

---

## 6. Task B — The toast covers every header control

### B1. Reproduce it

Load the app, upload `fixtures/gap-screenshots.csv`, and screenshot the top-right corner within
three seconds of the import completing. `Upload CSV`, `Settings`, `Export CSV` and `Guide` are all
behind the toast.

`.toast` is `position: fixed; top: 24px; right: 24px; z-index: 10002`. The header button row is in
the same place. The toast wins on z-index, so for three seconds after every import — the moment the
user is most likely to reach for Settings or Export — the controls are unreachable.

### B2. The fix

Move the toast so it cannot cover interactive controls in any module. **Bottom-left is the obvious
landing spot** — the bottom-right corner is taken (Task C) and the top-right is the header in all
four views.

Check all four modules before committing, not just the Call Auditor. Confirm the toast does not
cover: the Optimizer's wizard navigation, the Onboarding ribbon, or the Gantt grid's first column.

Keep the 3-second auto-hide, the `_toastTimer` clearing, the `.show` transform transition, and the
`showToast(msg, isError)` signature exactly as they are.

### B3. Test

An e2e test asserting that while the toast is visible, the header's Export button is still
clickable — not merely present in the DOM. Use an actual click, or an element-from-point check at
the button's centre. A visibility assertion will pass even when the element is completely covered.

---

## 7. Task C — The help FAB is redundant, and it sits on live data

### C1. What is wrong

`.help-fab` is `position: fixed; bottom: 24px; right: 24px; z-index: 9999`, carrying
`animation: help-pulse 3s ease-in-out infinite`. On the Call Auditor dashboard it sits on top of the
Call Pairing panel's fourth block. It pulses continuously, over live numbers, forever.

**It is also redundant.** All three module headers already have a Guide button —
`openHelp('optimizer')`, `openHelp('gap')`, `openHelp('onboarding')` — and the FAB's
`openHelpDefault()` does nothing more than map the current module to that same `openHelp()` call.
Every module reachable by a user has a header Guide button.

### C2. The fix

**Remove the FAB.** Nothing is lost: every path it offers already exists in the header, one row up
and never on top of anything.

If you find a module or state where the header Guide button is genuinely unreachable, **stop and
report it** rather than keeping the FAB — that would be a real finding and it changes the decision.

Remove `openHelpDefault()` if it has no remaining callers. Check before deleting; leave it if
anything else uses it and say so.

### C3. Test

Assert no fixed-position element overlaps the Call Pairing panel's blocks at default scroll on a
1440×900 viewport. Prove the test fails by re-adding the FAB.

---

## 8. Task D — The filter panel costs the whole first screen

### D1. What is wrong

Nine filter controls in three rows, roughly 300 px, sitting above every metric. On a 1440×900
viewport the user scrolls before seeing a single number. The panel is always expanded and **there is
no collapse mechanism to build on** — the markup is a plain heading and a grid.

### D2. The fix

Make the panel collapsible, and **collapsed by default once data has been loaded**. Before any
upload it may stay expanded — there is nothing else competing for the space then.

**Collapsing must not hide state.** When collapsed, the header must show how many filters are
currently active, so a user cannot be looking at a filtered table while the thing doing the
filtering is folded away. That failure — numbers that disagree with an invisible cause — is worse
than the scrolling this task exists to fix.

Persist the open/closed choice for the session. Do not persist it to `localStorage` — that is a
larger decision and this phase is not the place for it.

`resetGapFilters()` must continue to clear everything, and the active-filter count must return to
zero when it does.

### D3. Test

- collapsed by default after upload; expanded state toggles and survives a filter change
- the active-filter count is correct for zero, one, and several filters, and returns to zero after
  reset
- collapsing does not change `gapFilteredData` — a fold is presentation, never data

---

## 9. Task E — The tile grid wastes half a row

Six metric tiles in a four-across grid: row one is full, row two holds two tiles and two empty
slots. That gap is the dead space.

Reflow so there is no orphaned half-row. Three-across over two rows is the obvious option; six
across one row is another, at the cost of tile width. **Choose, say which you chose and why, and
include a screenshot.**

Keep every `gap-metric-*` id and every `data-testid="gap-tile-*"` exactly as it is — the drill-through
in `drillDownGap()` and several tests depend on them. This is a CSS grid change, not a markup
rebuild. **Run the §4 containment assertion afterwards.**

---

## 10. Task F — Table density

Table cells are `px-4 py-3`. At roughly 45 px per row, a 900 px viewport shows about fourteen rows
of a 25-row page, so most of a page always requires scrolling.

Reduce the vertical padding. Do not reduce the horizontal padding — the phone-number and timestamp
columns are already close to their content.

Report the before and after rows-per-viewport with a screenshot of each. If a denser table makes the
amber invalid-timestamp marker or the coloured validity pills hard to read, say so and stop at the
density that keeps them legible. **Legibility wins over row count** — these are people reading call
data during an incident.

---

## 11. Task G — Hide the theme toggle, and do not strand anyone

### G1. The decision

Light theme is parked indefinitely. The toggle should not be reachable, so a half-styled theme is
not reachable either.

### G2. The trap — read this before you write the fix

**Hiding the button is not sufficient and will strand users.** `toggleGapTheme()` writes
`localStorage['atlas-gap-theme']`, and an IIFE named `initGapTheme()` reads it back on **every**
load and re-applies `data-theme="light"`.

So anyone who has ever pressed that button is currently persisted into light theme on that machine.
Hide the button and they are stuck in it permanently, with no way back — a worse outcome than
leaving the toggle alone.

### G3. The fix

Hide the control **and** make the persisted value inert, so a returning user with `light` already
saved lands in dark. Leave the `[data-theme="light"]` CSS in place — it is not costing anything and
removing it is Phase 6's business.

### G4. Test

Set `localStorage['atlas-gap-theme'] = 'light'`, load the app, and assert the Call Auditor renders
dark and no theme control is reachable. Prove the test fails against the current code — it will.

---

## 12. Task H — The Time column echoes the source when nothing was converted

### H1. The decision, from the maintainer

This closes the two open questions left over from Phase 4.8. Both were reported rather than fixed
because the answer was a product call. The answer is now: **where no conversion happened, show the
source string exactly as the file wrote it.**

Measured against the live build, the current behaviour is:

| Source value | Shown today | Tooltip today | Shown after this task | Tooltip after |
|---|---|---|---|---|
| `2026-08-01T12:05:00Z` | `2026-08-01 12:05:00` | yes | `2026-08-01T12:05:00Z` | **no** |
| `2026-08-01T12:05:00` | `2026-08-01 12:05:00` | yes | `2026-08-01T12:05:00` | **no** |
| `1785586200` | `2026-08-01 12:10:00` | yes | `2026-08-01 12:10:00` | yes |
| `2026-08-01T12:00:00+05:30` | `2026-08-01 06:30:00` | yes | `2026-08-01 06:30:00` | yes |

The rule: **if the parsed instant is the same clock time the source string already stated, render
the source verbatim and add no tooltip.** Convert and annotate only where the value genuinely moved
— epochs, and timestamps carrying a non-UTC offset.

### H2. Why the current check is wrong

In `formatGapTimeCell()` the test is a string comparison:

```js
const differs = utc !== raw && utc + 'Z' !== raw;
```

`2026-08-01 12:05:00` does not equal `2026-08-01T12:05:00Z` as text, so the code concludes a
conversion happened when none did. On this data — nearly all `Z`-suffixed — the tooltip fires on
almost every row and tells the reader nothing. A tooltip that always appears carries no information.

**Do not fix this by adding more string cases.** That is how the check got here. Decide from the
parsed value: compare the instant the source string denotes against the instant rendered.

### H3. Scope

- `renderGapTable()` calls `formatGapTimeCell()` from **both** the grouped and flat branches. Fixing
  the shared function covers both — confirm that by reading, and assert both in tests.
- Rows with `timeValid === false` keep today's behaviour exactly: amber icon, raw text, no change.
- **The export is out of scope.** It keeps both `Time (UTC)` and `Time (original)`. Leaving both is
  correct regardless of what the screen shows.
- The escaping must not regress. This is user-supplied CSV content entering an HTML attribute and
  this project has shipped an XSS through that exact path. `fixtures/gap-xss-time.csv` exists for
  this; use it.

### H4. Test

- a `Z`-suffixed row renders the source verbatim and carries **no** `title` attribute
- an offset-less row renders the source verbatim and carries **no** `title`
- an offset-bearing row renders converted UTC **and** carries a `source:` tooltip
- an epoch row renders readable UTC **and** carries a `source:` tooltip
- the XSS fixture's time value is still escaped in attribute position
- assert in both grouped and flat table modes

`fixtures/gap-screenshots.csv` contains all four formats — 64 `Z`-suffixed rows, one offset-less,
one `+05:30`, two epochs. Confirm that by reading the fixture rather than trusting this sentence.

---

## 13. Definition of done

- [ ] The containment test from §4 exists, was written **before** Tasks B–G, and passes
- [ ] `Project Coordination` is selected by stable id in every place it was matched by name
- [ ] A test proves the spanning behaviour survives a rename, and was proven to fail before the fix
- [ ] A search for other copy-dependent logic was run and its result reported, fixed or not
- [ ] The toast no longer covers header controls in **any** of the four modules
- [ ] A test proves the Export button is clickable — not merely present — while the toast shows
- [ ] `showToast()`'s signature, timer handling and auto-hide are unchanged; all 43 call sites work
- [ ] The help FAB is gone, or its removal is blocked by a reported finding
- [ ] The filter panel collapses, is collapsed by default after upload, and shows an active-filter count
- [ ] Collapsing provably does not change `gapFilteredData`
- [ ] The tile grid has no orphaned half-row; every `gap-metric-*` id and `gap-tile-*` testid unchanged
- [ ] Table density improved, with before/after rows-per-viewport and screenshots
- [ ] The theme toggle is unreachable **and** a persisted `light` value no longer applies
- [ ] A test loads with `atlas-gap-theme=light` and asserts dark rendering
- [ ] Unconverted rows render the source verbatim with no tooltip; converted rows convert and annotate
- [ ] Time-cell behaviour asserted in **both** grouped and flat modes, with the XSS fixture still escaped
- [ ] Containment assertion re-run after the last markup change
- [ ] `test:unit` and `test:unit:dhaka` green locally; Actions green; **run URL quoted in the hand-back**
- [ ] Every task reported, including anything not done

---

## 14. Notes for the implementing agent

- **Screenshots are part of the deliverable, not decoration.** This is a layout phase; a claim that
  something no longer overlaps is not verifiable in prose. `e2e/screenshot.js` exists, targets
  `dist/index.html`, and fails loudly if the build is missing. Use it, and capture before and after.
- **The build is the artifact.** The root `index.html` is source. Run `npm run build` and look at
  `dist/index.html` — the e2e global setup will abort if the build is stale, which is deliberate.
- **Parse the structure; do not read the indentation.** For §4, load the built HTML and assert
  ancestry programmatically.
- **Run the function, don't read it.** Everything under `src/` is a plain ES module with no DOM
  dependency and runs under bare `node`.
- **Two branches, not one** — `renderGapTable()`, for Task H.
- **Verify which version of a file you are reading.** Use `git show <ref>:path`, never the working
  tree, when comparing across commits.

---

## 15. When you are done

Update `docs/CHANGELOG.md`, `docs/SPEC.md` and `docs/FEATURES.md` — those three only. Write the
changelog from your commit log and verify every identifier against the code. `SPEC.md` §7.2 needs
the Time-column rule restated; §7.6 needs the density and tile-grid changes; §8 needs the FAB and
toast entries corrected.

Then report in your final message — not a file:

- Before and after screenshots for the toast, the FAB area, the filter panel, the tiles and the table
- Rows visible per viewport, before and after
- The containment assertion's output on the final build
- What other copy-dependent logic your §5.4 search found
- Which tile layout you chose and why
- What you did about the persisted light theme, and proof a stranded user is recovered
- The four-format Time column table, rendered from the real build
- The Actions run URL and its result
- **Anything in this document you did not do**

Then stop. **Phase 5B — the rename, the SIP response-code tooltip and the copy sweep — is a separate
conversation.**
