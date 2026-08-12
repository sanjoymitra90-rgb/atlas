# claude_memory.md

**What this is:** the living memory of this project across Claude sessions. It carries the
*conversation* — what was decided, what was rejected, and why. The other documents carry the
system.

**Read order:** this file → `docs/SPEC.md` → the current phase spec.

**Maintenance rule:** update this file at the end of every working session. It is the only
document permitted to describe project *state*; `docs/SPEC.md` describes the system as it is,
`docs/FEATURES.md` describes behaviour in user language, `docs/CHANGELOG.md` is history. If two
documents state the same fact, one of them will eventually be wrong.

**Last updated:** 2026-08-12 (evening) — Phase 2 shipped and independently audited. Phase 2.5
opened to close what the audit found.

---

## 1. Current status

**Phase 1: complete and verified.** Committed as `02d3dc9`.

Ten of eleven extracted functions arrived byte-identical to their originals; only
`normalizePhoneNumber` changed, by design. No function exists in both `index.html` and `src/` —
re-verified in the Phase 2 audit across all fourteen exported names, still zero duplicates.

**Phase 2: shipped, then audited.** Twenty commits, `e2b97a1` through `ee7f62f`. The "commit as
you go" requirement Phase 1 failed was met properly — one commit per spec item, with honest
messages.

Audit run 2026-08-12 against `ee7f62f`, from the work-laptop clone. Per-task result:

| Task | Result |
|---|---|
| **A** — repo hygiene, CI/CD | Landed. `jwt.csv` confirmed never committed, across all history. Workflow file matches spec. `DEPLOY.md` is genuinely good. Two gaps: `screenshots-before/` was committed to the public repo, and **nobody has confirmed the live site actually works** |
| **B** — six security fixes | All six landed and verified correct. Only B1 has a test — constraint 3 was not met for the other five |
| **C** — Phase 1 leftovers | C1, C3, C4, C5 done. **C2 was not fixed** in `updateOnboardingFinancials()`, and its fix in `handleImport()` created a new toast collision |
| **D** — extract logic | **Half done.** See §5 |
| **E** — npm deps, Tailwind, CSP | Landed and appears correct. The mandatory before/after screenshot verification was **not performed**, and the baseline it would have used is broken |

**Phase 2.5: open.** Spec is `2026-08-12-phase-2.5-spec.md`. Four tasks — trust repairs, import and
onboarding bugs, export correctness, and the Phase 2 test debt. Roughly a day. It exists because
Phase 3 changes rendering, and three of the leftovers would do their damage precisely there.

---

## 2. Who you're working with

Sanjoy is a PM at Provenant Inc., not a full-time engineer, and builds this with agentic coding
tools. ATLAS is a **voluntary project for the DevOps team** — unpaid, solo-maintained. That
context matters: it argues for boring, well-trodden tooling and for documentation written to be
read by him, not by a developer.

- **He engages with reasoning, not verdicts.** Show the evidence and the trade-off; he'll make the
  call. He pushes back with clear rationale when he disagrees, and he is usually right when he does.
- **He improves proposals.** On the exceptions view he spotted that a new panel would duplicate the
  existing Destination Issues breakdown. Absorbing it instead was better than the original idea.
  Expect this; leave room for it.
- **He'll tell you what to skip**, and the reasons have been sound every time. Don't re-litigate.
- **He asks for opinions on product direction and wants real ones.**
- **He prefers a middle path when one exists** — the landing point that gets the benefit at his
  chosen cost.
- **He notices wasted effort and will ask about it.** In the audit session he challenged a remote
  clone when the local folder was right there. The answer was legitimate — git history is not
  readable through the file bridge — but the instinct is correct and the burden is on you to
  explain, briefly, before he has to ask.
- He communicates via voice transcription, so messages carry transcription artefacts. The intent is
  always clear; read through them.
- **He is not a developer.** Explain mechanisms, not just conclusions. When he asked what a "diff"
  was, the useful answer included why it mattered for that specific phase.

---

## 3. Decisions made — do not reopen without new information

**From the 2026-08-05 session:**

- **A shared customer/account object across the three modules.** Declined because he does not want
  to take on persistent storage. A scoping decision, not a disagreement about value. If persistence
  ever arrives for another reason, raise this as a consequence of that change, not on its own.
- **Cost-aware optimisation in the coverage algorithm.** Declined because the users are Ops people
  for whom costing is secondary, and the cost model is an approximation built on a
  reverse-engineered baseline and a hardcoded price index. Leave cost as context, not as a driver.

**From the 2026-08-12 planning session:**

- **Sequencing:** trust-work before visible product work. Tests and correctness first.
- **Exceptions view:** an Attention panel above the table that **absorbs** the Destination Issues
  breakdown rather than sitting beside it. The Call Pairing panel then sheds its four outcome
  blocks and becomes purely a timing panel, which also fixes its dead-space layout problem.
- **Architecture:** split the monolith. Vite with `vite-plugin-singlefile`, so output stays one HTML
  file. Plain ES modules without a build step were ruled out — browsers block them over `file://`.
- **Light theme:** parked indefinitely. Hide the toggle in Phase 5 so a half-styled theme is not
  reachable in the meantime.
- **Endpoint duplicates:** the same physical location may **not** be added twice. The old behaviour
  was a loophole in the dedup key, not a designed feature, and `docs/FEATURES.md` documented it
  wrongly.
- **`jwt.csv` stays local, gitignored.** Never committed — history re-verified clean in the Phase 2
  audit. It holds 1,353 real UK numbers and signed JWTs; the repo is **public**. It remains on disk
  for his testing.
- **Repo stays public and free.** Private repos support Pages only on paid plans, and the actual
  risk was already solved by the `.gitignore` entry.
- **`607` / `302` in the Status column are SIP response codes, not HTTP.** He has not worked with
  them yet and will tackle their meaning later. Phase 5 adds a tooltip reading "service provider
  response code" — do not invent meanings for individual codes.
- **The `Customer` column is really the service provider** (values are `Wavecrest`, `AudioCodes`).
  Renaming to "Service Provider" is Phase 5. It breaks the CSV export header for anyone with
  downstream scripts.
- **Font Awesome stays on its CDN.** Bundling the font files conflicts with single-file output.
  Note that `@fontsource/inter` was added from jsdelivr during Phase 2, so there are now **two**
  remaining CDN stylesheets, not the one the Phase 2 spec anticipated. Not a problem, but the
  "one remaining external dependency" line in that spec is now wrong.

---

## 4. Remaining phases

- **Phase 2.5 — cleanup.** Trust repairs, six import/onboarding bugs, two export decisions, five
  missing security tests. Spec written. See §5 for what the audit found.
- **Phase 3 — Attention panel.** Absorb the Destination Issues breakdown; strip outcome blocks from
  the Call Pairing panel; restore human-readable reason chip labels and their granularity. Currently
  the chips render raw internal slugs (`malformed ×7`) because `reasonLabels` still maps the
  pre-R25 vocabulary. **Two Phase 2.5 decisions feed this** — the `validateUKNumber` reason string
  and the `csvCell` guard both touch the chips being redesigned, so settle them first.
- **Phase 4 — Charts.** Legend colour collision (two "invalid" series share one colour, making the
  stacked bar unreadable); width-aware bucketing (5½ hours of data produces ~65 rotated axis
  labels); single-bucket empty state; rethink the Requests Over Time and Invalid Numbers encodings;
  TTV to full width; table/chart timezone consistency (the table prints the raw CSV string, charts
  print a UTC-normalised timestamp — they disagree when the source carries no offset).
- **Phase 5 — Layout, density, copy.** Toast and help FAB overlap functional UI; filter panel always
  expanded; tile redesign; table density; hide the theme toggle; copy sweep.
- **Phase 6 — Docs and tokens.** `docs/SPEC.md` still carries stale defect markers pointing at
  `REVIEW.md`, deleted in Phase 9. Triangle-inequality violations are **856**, not the 761 stated.
  The changelog has two "Phase 7" sections and runs 7 → 6D → 11 → 10 → 9 → 8 → 7 — **and now also
  carries a Phase 2 section with five factual errors** (Phase 2.5 F2 fixes that one). Unify `--gap-*`
  tokens to `--atlas-*` and adopt them in the other two modules.
- **Deferred, needs its own phase:** converting the 197 inline handlers to delegated listeners.
  This gates removing `unsafe-inline` from the CSP and retiring the `window` bridge in
  `src/main.js`.

---

## 5. What the Phase 2 audit found

Kept in full because Phase 2.5 is built on it. Once Phase 2.5 lands, collapse this to a sentence.

**Verified correct — do not re-check:**

- `jwt.csv` never committed, all history
- No function in both `index.html` and `src/` — all fourteen exported names checked
- B1's XSS fix is real, in both branches of both render paths, with a fixture and a test that would
  genuinely fail
- The D2 memoisation-key fix is correct
- Phase 1's modules behave correctly under direct execution: scientific-notation fail-closed,
  CRLF-plus-quoted CSV parsing, header de-duplication
- The Tailwind migration itself looks clean. The only dynamically built class is
  `text-${confColor}`, and all three values are safelisted. `tier-*` and `step-*` are custom CSS,
  not Tailwind

**Task D — the honest half-finish.** `pairKey()` was extracted and used at all four sites, and the
memo-key bug was fixed. Neither `pairGapCalls()` nor `computeCoverage()` was moved to `src/`, and
no characterisation tests were written. The commit message says "prepare", and `SPEC.md`
invariant 6 still correctly reads "DOM-free but not pure" — **nothing is misrepresented**, the work
just stopped halfway.

**Deferral recorded in Phase 2.5.** The Phase 2.5 spec explicitly asked whether to finish D or
defer. Deferral chosen: the valuable half (pairKey deduplication, memo-key fix) already landed.
What remains is structural work with no user-visible benefit. `computeCoverage()` stays in
`index.html` until a future phase owns the extraction.

Two blockers if it is ever resumed: `computeCoverage()` **mutates its input** (it writes `idx` onto
the caller's customer objects), and it still calls module-scope `findNearestRegionIdx()`. Invariant
6 cannot become "pure" until both are gone.

**The audit's suggestion is to defer D formally rather than finish it now** — the valuable half
landed, the rest is structural work with no user-visible benefit, and it competes with Phase 3.
Decision pending.

**`src/auditor/pairing.test.js` is a fake test file.** It asserts `expect(40 + 60).toBe(100)` and
checks a property on an object it constructed two lines earlier. It imports nothing from the app
and would pass if `pairGapCalls()` were deleted. This is §6's failure mode, reappearing in the
phase immediately after §6 was written. Phase 2.5 F1 deletes or replaces it.

**Six bugs found by executing the modules, not reading them:**

- `handleImport()` double-counts dropped endpoints — two bad rows report as four
- `handleImport()` fires the "dropped" toast and then the success toast; the singleton timer means
  the user never learns their data was discarded. **This re-opens C2** — C2 merged the two original
  toasts without checking what else in the function calls `showToast`
- Endpoints with **no** `lat`/`lng` key survive import (the guard only catches present-but-invalid),
  then `renderCustList` calls `c.lat.toFixed(2)`, throws, and blanks the entire endpoint list.
  **This re-opens B4** — the exact failure B4 was written to prevent
- `updateOnboardingFinancials()` still fires two consecutive toasts. **C2 named this function
  explicitly and it was never changed**
- A non-numeric margin escapes both clamps (`NaN >= 100` and `NaN < 0` are both false), writes the
  literal string `NaN` into the input box, and silently produces a quote with no margin applied
- Margin 99.5 is accepted while the toast claims the range is 0–99

**Three export defects, two of which are decisions for Sanjoy:**

- `csvCell()`'s formula guard prefixes an apostrophe to any leading `+`, so **every exported phone
  number** reads `'+447700900123`, in the From and To columns of every row. Real trade-off — Excel
  does parse a leading `+` as a formula. Recommended landing: guard `+` and `-` only when not
  followed by a digit
- The CSV summary lines (`breakdownLine`, `pairLine`) are unquoted and contain commas — they spill
  across columns in Excel. B3 fixed the headers and the data rows and missed these
- `validateUKNumber` displays `+12125551234` as "Non-UK destination (+12)". C4's two-digit cap fixes
  France and breaks North America. The code comment claims a known-prefix list; there is none

**The screenshot baseline is broken and was committed.** `screenshots-before/` is tracked in the
public repo, three of its nine images are byte-identical (the capture script photographed the same
screen three times), and no "after" set was ever taken. The E2 verification the Phase 2 spec called
mandatory did not happen.

**The Phase 2 changelog section is wrong in five places** — it names three functions in
`financials.js` that do not exist anywhere in the repo, attributes B3 to `escapeHtml()`, attributes
C4 to `normalizePhoneNumber()`, claims a unit test where a Playwright assertion was tightened, and
re-credits Phase 11's tile removal to Phase 2. `SPEC.md` stayed honest; the changelog did not.

**Still unconfirmed: the live site.** The workflow file is correct and `DEPLOY.md` says the Pages
source was switched to GitHub Actions, but no one has looked at the Actions tab. A2 and A5 are
open until Sanjoy checks. The root `index.html` still references `/src/main.js`, so a page that
renders but does nothing means Pages is still serving the branch, not the built artifact.

---

## 6. How this project fails

Three failure modes now. Expect to meet all of them.

**Documentation drifts, and agents build on it.** `docs/SPEC.md` has twice accumulated "known
defect" markers describing bugs long since fixed. It has claimed a symmetric latency matrix when
450 of 496 pairs differ, and claimed `computeCoverage()` was pure when it reads three module
globals. A human reading a wrong claim might go and check. An agent takes it as given and builds on
it. That is what let the region mislabelling survive as long as it did — nobody checked the data
against physics because the doc said the data was fine.

**It happened again in Phase 2**, in the changelog, in the phase that had this rule in its own
spec. The cause is identifiable: the docs were written in **one pass at the end, from memory**,
rather than alongside each change. Phase 2.5 constraint 7 addresses this — if a document and the
code disagree, fix the document in the same commit as the code.

Three rules worth defending:

- **No line numbers in any document.** They go stale within a phase. Anchor on function names,
  element IDs, `data-testid` values.
- **`FEATURES.md` contains no code identifiers.** If a fact appears in only one file, it cannot
  drift against another file. That is the whole mechanism.
- **`SPEC.md` opens with invariants**, each carrying its reason. Rationale next to the rule gets
  updated with the rule; rationale in an appendix does not.

**Tests that assert nothing.** Before Phase 1, six Playwright tests re-implemented application logic
inside `page.evaluate()` and asserted against their own copy — including the physics test, which
computed the light-in-fibre floor and then discarded it. They reported coverage that did not exist,
over exactly the fixes that mattered most, and the suite was reported as "182 passing".

**A test that cannot fail is worse than no test**, because it stops anyone from looking. When
reviewing new tests, ask: would this fail if the thing it names were deleted? For the physics test,
verify it directly — corrupt one matrix entry and watch it fail.

**This also happened again in Phase 2**, as `src/auditor/pairing.test.js`. Two cycles running. When
a phase adds a test file, open it and check that it imports something from the application.

**NEW — fixes land one condition too narrow.** Both C2 and B4 were fixed correctly for the case
named in the spec and left broken for the adjacent case in the same function. C2 merged two toasts
and did not notice a third `showToast` further down. B4 validated present-but-invalid coordinates
and did not handle absent ones. The pattern is fixing the named line rather than reading the whole
function. When closing a spec item, read the function end to end and ask what else does this.

---

## 7. Method notes — how the sharper findings were actually found

The best findings came from checking claims against reality, not from reading code.

- **Speed of light in fibre as a floor.** Any latency below `distance_km × 0.01` ms RTT is
  impossible. This exposed the region mislabelling. It is now `SPEC.md` invariant 1 and, as of
  Phase 1, a real CI assertion.
- **Cross-check two models against each other.** The app estimates latency two ways. Diffing them
  across all region pairs turned "the model might be optimistic" into a number: median 45 ms, up to
  303 ms. Still far above the 20 ms default safety floor.
- **Symmetry and triangle inequality.** 450 asymmetric pairs, 856 triangle violations, worst 59 ms.
- **Count the safety helper.** `escapeHtml` appeared 7 times against 53 `innerHTML` assignments.
  That ratio located the escaping gap before reading a single template.
- **Run the function, don't read it.** The scientific-notation bypasses were found by executing
  `normalizePhoneNumber` against a table of inputs, not by inspecting the regex. **The Phase 2 audit
  found six defects the same way, in under a minute** — the modules under `src/` are plain ES
  modules with no DOM dependency and run under bare `node` with no test runner and no install step.
  Write a scratch file, import them, print a table. Do this before reading anything.
- **Diff moved code against its original.** Extracting the pre-refactor file from git and comparing
  function bodies is what verified Phase 1's moves were genuinely moves.
- **Hash files that should differ.** Three "different" screenshots sharing one MD5 is what exposed
  the broken capture script. Sizes alone would have been suggestive; hashes were conclusive.
- **Read the commit log before judging a phase.** Phase 2's log is accurate and its messages are
  honest — including "prepare computeCoverage for extraction", which is what stopped the audit
  mistaking a half-finished D for a misrepresented one.

Generalisable version: when a tool's output is physical, test the *data* against physics; when a
tool has two paths to the same answer, diff them; when a codebase has a safety helper, count how
often it is actually used; when something claims to be unchanged, prove it; and when two artifacts
should differ, hash them.

---

## 8. Resuming on another machine

1. `git pull` (repo is cloned on both the personal and the work machine)
2. `npm install` — Phase 1 added Vite, Vitest and `vite-plugin-singlefile`; Phase 2 added Leaflet,
   Chart.js, html2pdf, dhtmlx-gantt and Tailwind as real dependencies
3. `npx playwright install chromium` if not already present
4. Connect Claude to the folder
5. **`jwt.csv` will not be there** — gitignored by design. Copy it manually if needed, or use
   `fixtures/gap-screenshots.csv`, which is synthetic and safe.
6. Point the new session at this file, then the current phase spec

**A note for cloud sessions:** when Cowork runs in the cloud, the folder bridge reads and writes
files but **cannot run `git`**. Commit history is therefore not readable from the connected folder
alone — `.git/logs/HEAD` is plain text and gives you the reflog, but the commits themselves are in
compressed pack files. Cloning the public repo into the session container is the working route, and
it is worth saying so up front rather than appearing to ignore the local folder.

---

## 9. Update log for this file

- **2026-08-12 (evening)** — Rewritten after an independent audit of the Phase 2 result at
  `ee7f62f`. Added the per-task Phase 2 verdict, the full audit findings as §5, the Phase 2.5 entry,
  the third failure mode ("fixes land one condition too narrow"), the recurrence notes on the two
  existing failure modes, the cloud-session git limitation, and four new method notes. Sections 2,
  3, 6, 7 and 8 preserved and extended rather than replaced.
- **2026-08-12** — Rewritten as a living document. Folded in the Phase 1 verification result, the
  decisions from the review and planning session, the phase plan, and the "tests that assert
  nothing" failure mode. Preserved the descoped items and method notes from 2026-08-05.
- **2026-08-05** — Original handoff written from a claude.ai chat session with no repo access.
