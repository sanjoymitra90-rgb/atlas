# claude_memory.md

**What this is:** the living memory of this project across Claude sessions. It carries the
*conversation* — what was decided, what was rejected, and why. The other documents carry the
system.

**Read order:** this file → `docs/SPEC.md` → the current phase spec.

**Maintenance rule:** update this file at the end of every working session. It is the only
document permitted to describe project *state*; `docs/SPEC.md` describes the system as it is,
`docs/FEATURES.md` describes behaviour in user language, `docs/CHANGELOG.md` is history. If two
documents state the same fact, one of them will eventually be wrong.

**Last updated:** 2026-08-12 — Phase 1 complete and verified, Phase 2 in progress.

---

## 1. Current status

**Phase 1: complete and verified.** Committed as `02d3dc9`.

Verified against the pre-Phase-1 file: ten of eleven extracted functions arrived **byte-identical**.
The only one that changed was `normalizePhoneNumber`, which was supposed to. No function exists in
both `index.html` and `src/` — checked explicitly, because leaving duplicates behind would have
meant unit tests exercising code the app does not run.

What landed:

- Vite + Vitest; build emits a single self-contained `dist/index.html` that opens from disk
- Six pure modules under `src/` (`core/format`, `auditor/validate`, `auditor/parse`,
  `auditor/buckets`, `optimizer/geo`) with 66 unit tests — the first real tests in the project
- Five bug fixes, all verified: scientific-notation phone bypasses, header de-dup for three or more
  duplicates, silently-dropped footprint cells on import, margin clamping in both directions,
  endpoint location de-duplication
- The physics test now genuinely iterates all 32×32 region pairs and asserts zero violations.
  It previously computed a value and discarded it.
- Two fake tests (R9, R16) deleted rather than left implying coverage that did not exist

**Phase 2: in progress.** Spec is `2026-08-12-phase-2-spec.md`. Five tasks, designed to be handed
back individually rather than run in one pass. Task A (repo hygiene and deployment) unblocks the
live site and should ship on its own.

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

**From the 2026-08-12 session:**

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
- **`jwt.csv` stays local, gitignored.** Never committed — history verified clean. It holds 1,353
  real UK numbers and signed JWTs; the repo is **public**. It remains on disk for his testing.
- **Repo stays public and free.** Private repos support Pages only on paid plans, and the actual
  risk was already solved by the `.gitignore` entry.
- **`607` / `302` in the Status column are SIP response codes, not HTTP.** He has not worked with
  them yet and will tackle their meaning later. Phase 5 adds a tooltip reading "service provider
  response code" — do not invent meanings for individual codes.
- **The `Customer` column is really the service provider** (values are `Wavecrest`, `AudioCodes`).
  Renaming to "Service Provider" is Phase 5. It breaks the CSV export header for anyone with
  downstream scripts.

---

## 4. Remaining phases

- **Phase 3 — Attention panel.** Absorb the Destination Issues breakdown; strip outcome blocks from
  the Call Pairing panel; restore human-readable reason chip labels and their granularity. Currently
  the chips render raw internal slugs (`malformed ×7`) because `reasonLabels` still maps the
  pre-R25 vocabulary.
- **Phase 4 — Charts.** Legend colour collision (two "invalid" series share one colour, making the
  stacked bar unreadable); width-aware bucketing (5½ hours of data produces ~65 rotated axis
  labels); single-bucket empty state; rethink the Requests Over Time and Invalid Numbers encodings;
  TTV to full width; table/chart timezone consistency (the table prints the raw CSV string, charts
  print a UTC-normalised timestamp — they disagree when the source carries no offset).
- **Phase 5 — Layout, density, copy.** Toast and help FAB overlap functional UI; filter panel always
  expanded; tile redesign; table density; hide the theme toggle; copy sweep.
- **Phase 6 — Docs and tokens.** `docs/SPEC.md` still carries stale defect markers pointing at
  `REVIEW.md`, deleted in Phase 9. Triangle-inequality violations are **856**, not the 761 stated.
  The changelog has two "Phase 7" sections and runs 7 → 6D → 11 → 10 → 9 → 8 → 7. Unify `--gap-*`
  tokens to `--atlas-*` and adopt them in the other two modules.

---

## 5. Known issues not yet scheduled

- **The pairing duplicate-reclassification loop is O(n²)** with key re-computation inside, and the
  pair-summary export does a `find()` inside a `forEach`. The upload guard permits 50 MB
  (~500k rows). The guard and the algorithm disagree by orders of magnitude.
- **197 inline event handlers** (`onclick`, `onchange`, `oninput`, `onkeydown`). These gate removing
  `unsafe-inline` from the CSP and retiring the `window` bridge in `src/main.js`. Deserves its own
  phase.
- **The `truncated` validation category is dead code.** `gapReasonBucket` and `ukPillHtml` both
  handle it; nothing produces it.
- **`ap-southeast-6` (Auckland) and `ap-east-2` (Taipei) are absent** from `regions[]`. The R4 fix
  relabelled rather than added, so the optimizer cannot place a cell in New Zealand or Taiwan.
- **The live GitHub Pages site is broken** — root `index.html` loads a module path that does not
  resolve without a build. Phase 2 Task A fixes it. Confirmed nobody is using it right now.

---

## 6. How this project fails

Two failure modes have recurred in every cycle. Expect to meet both.

**Documentation drifts, and agents build on it.** `docs/SPEC.md` has twice accumulated "known
defect" markers describing bugs long since fixed. It has claimed a symmetric latency matrix when
450 of 496 pairs differ, and claimed `computeCoverage()` was pure when it reads three module
globals. A human reading a wrong claim might go and check. An agent takes it as given and builds on
it. That is what let the region mislabelling survive as long as it did — nobody checked the data
against physics because the doc said the data was fine.

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
  `normalizePhoneNumber` against a table of inputs, not by inspecting the regex.
- **Diff moved code against its original.** Extracting the pre-refactor file from git and comparing
  function bodies is what verified Phase 1's moves were genuinely moves.

Generalisable version: when a tool's output is physical, test the *data* against physics; when a
tool has two paths to the same answer, diff them; when a codebase has a safety helper, count how
often it is actually used; and when something claims to be unchanged, prove it.

---

## 8. Resuming on another machine

1. `git pull` (repo is already cloned on the work machine)
2. `npm install` — Phase 1 added Vite, Vitest and `vite-plugin-singlefile`
3. `npx playwright install chromium` if not already present
4. Connect Claude to the folder
5. **`jwt.csv` will not be there** — gitignored by design. Copy it manually if needed, or use
   `fixtures/gap-screenshots.csv`, which is synthetic and safe.
6. Point the new session at this file, then the current phase spec

---

## 9. Update log for this file

- **2026-08-12** — Rewritten as a living document. Folded in the Phase 1 verification result, the
  decisions from the review and planning session, the phase plan, and the "tests that assert
  nothing" failure mode. Preserved the descoped items and method notes from 2026-08-05.
- **2026-08-05** — Original handoff written from a claude.ai chat session with no repo access.
