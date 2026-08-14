# ATLAS — Phase 5B Implementation Spec: the rename, the response-code tooltip, and the copy sweep

**Paste this whole file as your opening instruction.**

**For:** the AI coding agent implementing this phase.
**From:** planning session against commit `4cdfa8c`, 2026-08-13. Every claim below was checked
against the code or the built application; the reproduction is included with each one.
**Prerequisite:** Phase 5A is complete, Actions green, site live.

**No line numbers anywhere in this document, or in anything you write.** Anchor on function names,
file paths, element IDs, CSS class names and `data-testid` values.

---

## 0. Your documents

**This document is self-contained.**

- **`docs/SPEC.md` — your contract.** Accurate as of `4cdfa8c`. If it and this document disagree,
  check the code and report the discrepancy rather than picking one.
- **`docs/FEATURES.md` — behaviour in user language. No code identifiers, ever.**
- **`docs/CHANGELOG.md` — history only. You write to it; you do not read it as truth.**

**Do not read `claude_memory.md`.** Do not start Phase 6. Task D (moving `pairGapCalls()` and
`computeCoverage()` into `src/`) and the inline-handler conversion remain deferred.

---

## 1. What this phase is, and what it is not

Phase 5 was split. **5A moved markup and is done.** This is **5B: text only.**

That is a real constraint, not a framing device. If you find yourself moving a `<div>`, restructuring
a grid, or changing a layout class, **you are outside this phase** — write it down and report it
instead. The one exception is Task B, which adds a tooltip element to a table header; keep that
addition as small as it can be and run the containment guard afterwards.

The reason for the split is that a structural edit and a copy edit in one diff is how the Phase 4.6
regression reached production — a chart was moved, one `</div>` was left behind, and the entire data
table fell outside `#gap-dashboard`. Nothing in the diff looked like it touched the table.

---

## 2. Why a copy sweep is safe now, and what would make it unsafe again

This project has a specific recurring defect: **logic that depends on the wording of something a
human is expected to edit.**

- `gapReasonBucket()` decided a validation category by substring-matching a user-facing error
  sentence. Deleted in Phase 3.
- `if (t.name === 'Project Coordination')` selected Gantt behaviour by a task name editable inline in
  the grid. Fixed in Phase 5A to select on the stable id `t9`.

Phase 5A then searched for others and found only **data-driven** matches — `svc.includes('sign')`,
`svc.includes('verif')`, header-keyword autodetection, the region search, the `.csv` extension check.
Those read the *user's CSV*, not the application's copy, so rewording the UI cannot break them.

**That is why this phase can go ahead.** It also means one rule applies throughout:

> **Never introduce a comparison against display text.** If you need to know which thing you are
> looking at, use its id, its `data-testid`, or a value the code already carries. Any new
> `=== 'Some Label'` in this phase is a regression of a class this project has now fixed twice.

Re-run that search at the end of the phase and report the result, even if it is clean.

---

## 3. Hard constraints

1. **Commit per task.**
2. **Every change is test-first** where a test is possible. Prove every test can fail: break the
   thing it names, run it, watch it go red, restore. Say so in the commit message.
3. **Do not change any id, `data-testid`, CSS class, JS identifier, function name or global.** This
   phase changes what users read, not what code refers to. `gap-filter-customer`, `colCustomer`,
   `gapFilterCustomer` and friends all keep their names — renaming them is Phase 6's business at
   most, and it would bloat this diff past the point of review.
4. **Run the containment guard** (`e2e/gap/gap-containment.spec.cjs`) after Task B.
5. **Fix documents in the same commit as the code they describe.**
6. **`test:unit` and `test:unit:dhaka` green locally, and Actions green, before you hand back.**
7. **If any statement in this document turns out to be wrong when you check it, say so and stop.**

---

## 4. Task A — `Customer` → `Service Provider`, including the export

### A1. The decision, and the thing you must not do with it

The `Customer` column does not hold customers. It holds the service provider — `Wavecrest`,
`AudioCodes`. The label has been wrong since the column existed.

**The maintainer has decided to rename it everywhere, including the CSV export header, knowing that
this breaks any downstream script reading a `Customer` column.** He was offered three options —
rename everywhere, rename the screen only, or ship both columns the way `Time (UTC)` /
`Time (original)` does — and chose the clean break deliberately.

**Do not re-litigate this and do not quietly soften it** by keeping a duplicate column "to be safe".
A decision taken with the cost stated is not an oversight.

### A2. What to change

Display text only, in every place a user reads the word in the Call Auditor:

- the data table's column header
- the filter-bar label and its "All Customers" default option
- the column-header filter dropdown's label
- the export CSV header array — the literal `'Customer'` string
- any help-drawer text naming the column
- any tooltip or aria-label naming the column

Find them all before you change any. **Report the list you found and the list you changed**; if those
two lists differ, say why.

### A3. What to leave completely alone

- every id, `data-testid` and CSS class
- `row.customer`, `gapFilterCustomer`, `colCustomer`, `populateGapFilterDropdowns()` and every other
  identifier
- the Optimizer's and Onboarding's uses of the word "customer" — **those are real customers.** This
  rename is the Call Auditor's Status/provider column and nothing else. Check each occurrence's
  module before touching it.

### A4. Announce the break

The break must be loud, because it is silent at the point it bites — a script reading a `Customer`
header simply finds nothing at its next run.

Required:

- **`docs/CHANGELOG.md`** — a **breaking change** entry that names the old header, the new header,
  and says plainly that scripts reading the old name must be updated.
- **`docs/FEATURES.md`** — in user language, that the column was renamed because it never held
  customers, and that exports now carry the new name.

**Then use your judgement on one more thing and say what you chose.** The Filtered/All export already
writes a metrics summary block above the data rows. A single line there noting the header change
would reach the person running the export, which the changelog will not. It also permanently adds a
line of noise to every export. Decide, do it or don't, and give your reasoning.

### A5. Test

- the table header renders the new label
- the export's header row contains the new name and **not** the old one
- the filter still works after the rename — this is the check that proves you changed display text
  and not a value the code selects on
- the Optimizer and Onboarding still say "customer" where they mean customers

---

## 5. Task B — The response-code tooltip

### B1. What is wrong

The Status column carries service-provider response codes. Real data contains `607` and `302`; the
fixtures use `200` and `500`. Users read these as HTTP status codes, which they are not.

There is no tooltip today — confirmed, zero matches for any explanatory text.

### B2. What to add

A tooltip on the **Status column header** reading **"service provider response code"**.

**Do not invent meanings for individual codes.** No lookup table, no "607 = call rejected", nothing
that maps a number to an explanation. Nobody on this project knows what the individual codes mean,
and a plausible-looking wrong mapping in an incident review is worse than no mapping. The tooltip
says what the column *is*; that is the whole scope.

The Time-to-Verify tile already has an `fa-info-circle` info-icon tooltip. **Match that pattern**
rather than inventing a second one — find it, read how it is built, and reuse it.

The filter-bar label reads "Status Code" and the table header reads "Status". Decide whether both
need the tooltip or only the header, and say which you chose and why.

### B3. Test

The header carries the tooltip text; it survives a re-render after sorting and after a filter change.
Prove the test fails by removing the tooltip.

---

## 6. Task C — The copy sweep

### C1. Scope, because "sweep" is not a scope

This is the part of the phase most likely to sprawl. Bound it:

**In scope:** user-visible text in the **Call Auditor** — labels, headings, tile captions, empty
states, toast messages, help-drawer text, tooltips, aria-labels, and button text.

**Out of scope:** the Optimizer, Onboarding and Gateway. Comments. Commit messages. Anything in
`docs/`. Any text that is a value rather than a label — bucket identifiers, status codes, CSV headers
you were not told to change in Task A.

### C2. What you are actually looking for

Not a rewrite. Four specific faults:

1. **Text that names the wrong thing** — the Task A class. The `Customer` column was the big one;
   report anything else you find rather than fixing it, unless it is unambiguous.
2. **Inconsistent vocabulary for one concept.** The same thing called "invalid", "malformed" and
   "bad" in three places makes an Ops person wonder whether they are three things. **Pick one word
   per concept and use it.** Check the reason chips, the tile captions and the export's invalid
   breakdown line against each other — they describe the same buckets.
3. **Empty states and error messages that do not say what to do next.** "No data to display" is
   accurate and useless.
4. **Toast messages that fire on the normal case.** A message that appears every time carries no
   information — Phase 4.8 already reworded one for exactly this reason. There are 43 `showToast()`
   call sites; look for others that always fire.

### C3. The rule that makes this safe

**Changing a user-facing string must never change behaviour.** Before you edit any string, check
whether anything compares against it. §2 says the codebase is currently clean; verify per string
rather than trusting that sentence, because you are about to change dozens of them.

The reason chip labels are the sharpest case: `bucketLabels` in `src/auditor/validate.js` maps
bucket *identifiers* to display text and deliberately sits next to the bucket definitions. **Edit the
labels; never edit the keys.** The keys are logic.

### C4. Report, do not silently improve

Produce a table of every string changed: file, old text, new text, one-line reason. If it does not
fit one of the four faults in §C2, do not change it. **"I improved the wording" is not a reason** —
this project's changelog has drifted before because someone tidied without recording it.

---

## 7. Task D — Re-run the copy-dependency search

After Tasks A–C, run the search from §2 again across the whole file: any comparison against, or
substring match on, a string a user or a copy editor can change.

Report the result **even if it is clean**. A phase that changed dozens of user-facing strings and did
not check this afterwards has not finished.

---

## 8. Definition of done

- [ ] Every user-facing `Customer` in the Call Auditor reads `Service Provider`, including the export header
- [ ] The found-list and the changed-list are both reported, with any difference explained
- [ ] No id, `data-testid`, CSS class or JS identifier was renamed
- [ ] The Optimizer and Onboarding still say "customer" where they mean customers
- [ ] The filter still works after the rename, proven by a test
- [ ] The breaking change is recorded in `CHANGELOG.md` and `FEATURES.md`
- [ ] A decision was made and explained about noting the change inside the export itself
- [ ] The Status header carries a "service provider response code" tooltip, matching the TTV info-icon pattern
- [ ] No meaning is asserted for any individual code, anywhere
- [ ] The tooltip survives a sort and a filter change, proven by a test
- [ ] The copy sweep is reported as a table: file, old, new, reason — every row mapping to a §C2 fault
- [ ] `bucketLabels` keys unchanged; only labels edited
- [ ] The §2 copy-dependency search was re-run and its result reported
- [ ] `gap-containment.spec.cjs` passes on the final build
- [ ] `test:unit` and `test:unit:dhaka` green locally; Actions green; **run URL quoted in the hand-back**
- [ ] Every task reported, including anything not done

---

## 9. Notes for the implementing agent

- **This phase changes text. If you are moving markup, stop and report.**
- **Count tests the way the runner counts them.** A static grep undercounts — `gap-time-verbatim.spec.cjs`
  generates its tests from a loop over `['grouped','flat']`. Take totals from the run output.
- **If CI goes red and you cannot read the logs, fix the readability first.** Phase 5A lost three runs
  to an unreadable failure and diagnosed it in one push by making the workflow emit `::error::`
  annotations, which render without authentication. Revert the instrumentation in its own commit
  afterwards. Do not theorise at an opaque failure.
- **Measure the artifact, not your description of it.** For anything visual, assert with
  `getBoundingClientRect()`, `getComputedStyle()` or `document.elementFromPoint()`. A visibility
  assertion passes on a completely covered element.
- **Run the function, don't read it.** Everything under `src/` is a plain ES module with no DOM
  dependency and runs under bare `node`.
- **Verify which version of a file you are reading.** Use `git show <ref>:path`, never the working
  tree, when comparing across commits.

---

## 10. When you are done

Update `docs/CHANGELOG.md`, `docs/SPEC.md` and `docs/FEATURES.md` — those three only. `SPEC.md` §7.6
names the export columns and the table's ten columns; both mention `Customer`. Write the changelog
from your commit log and verify every identifier against the code.

Then report in your final message — not a file:

- The `Customer` occurrence list: found, changed, and deliberately left alone with the reason
- A screenshot of the renamed column header and the renamed filter
- The first two lines of an exported CSV, showing the new header
- What you decided about noting the change inside the export, and why
- Which elements got the response-code tooltip, and why not the others
- The copy-sweep table: file, old text, new text, reason
- The re-run copy-dependency search result
- The Actions run URL and its result
- **Anything in this document you did not do**

Then stop. **Phase 6 is a separate conversation.**
