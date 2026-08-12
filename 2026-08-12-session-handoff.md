# ATLAS — Session Handoff

**Written:** 2026-08-12, end of session.
**Purpose:** so this work can be resumed on a different machine, in a different session, or by a
different agent, without re-deriving the reasoning.

Read this first, then `2026-08-12-phase-2-spec.md`.

---

## Where things stand

**Phase 1: complete and verified.** Committed as `02d3dc9`.

Verification performed against the pre-Phase-1 file: ten of eleven extracted functions arrived
**byte-identical**. The only one that changed was `normalizePhoneNumber`, which was supposed to.
The extraction is clean — no function exists in both `index.html` and `src/`.

What landed:

- Vite + Vitest tooling; build emits a single self-contained `dist/index.html`
- Six pure modules under `src/` (`core/format`, `auditor/validate`, `auditor/parse`,
  `auditor/buckets`, `optimizer/geo`) with 66 unit tests
- Five bug fixes, all verified working: scientific-notation phone bypasses, header de-dup for 3+
  duplicates, silently-dropped footprint cells, margin clamping in both directions, endpoint
  location de-duplication
- The physics test is now genuine — it iterates all 32×32 region pairs and asserts zero violations.
  It previously asserted nothing at all.
- Two fake tests (R9, R16) deleted rather than left to imply coverage that did not exist

**Phase 2: in progress.** Spec is `2026-08-12-phase-2-spec.md`. Five tasks, meant to be handed back
individually rather than run in one pass.

---

## Decisions made this session — do not reopen without new information

- **Sequencing:** trust-work before visible product work. Tests and correctness first.
- **Exceptions view:** an Attention panel above the table that **absorbs** the existing Destination
  Issues breakdown rather than sitting beside it. Sanjoy spotted the redundancy; the resulting
  design is better than the original proposal. The Call Pairing panel then sheds its four outcome
  blocks and becomes purely a timing panel, which also fixes its dead-space layout problem.
- **Architecture:** split the monolith. Vite with `vite-plugin-singlefile`, so the output stays one
  HTML file that opens from disk. Plain ES modules without a build step were ruled out — browsers
  block them over `file://`.
- **Light theme:** parked indefinitely. Hide the toggle in Phase 5 so a half-styled theme is not
  reachable in the meantime.
- **Endpoint duplicates:** the same physical location may **not** be added twice. Confirmed by
  Sanjoy. The old behaviour was a loophole in the dedup key, not a designed feature, and
  `docs/FEATURES.md` documented it wrongly.
- **`jwt.csv` stays local, gitignored.** Never committed — history is clean, verified. It holds
  1,353 real UK numbers and signed JWTs; the repo is **public**. It remains on disk for testing.
- **Repo stays public and free.** Private repos support Pages only on paid plans, and the actual
  risk was already solved by the `.gitignore` entry.
- **`607` / `302` in the Status column are SIP response codes, not HTTP.** Sanjoy has not worked
  with them yet. Phase 5 adds a tooltip saying "service provider response code" — do not invent
  meanings for the individual codes.
- **`Customer` column is really the service provider** (values are `Wavecrest`, `AudioCodes`).
  Renaming to "Service Provider" is a Phase 5 item. It is a breaking change for the CSV export
  header.

---

## Remaining phases

- **Phase 3 — Attention panel.** Absorb the Destination Issues breakdown; strip outcome blocks from
  the Call Pairing panel; restore human-readable reason chip labels and their granularity.
- **Phase 4 — Charts.** Legend colour collision (two "invalid" series share one colour, making a
  stacked bar unreadable), width-aware bucketing (5½ hours of data currently produces ~65 rotated
  axis labels), single-bucket empty state, rethink the Requests Over Time and Invalid Numbers
  encodings, TTV to full width, table/chart timezone consistency.
- **Phase 5 — Layout, density, copy.** Toast and FAB overlap functional UI; filter panel always
  expanded; tile redesign; table density; hide the theme toggle; the copy sweep.
- **Phase 6 — Docs and tokens.** `docs/SPEC.md` still carries stale defect markers pointing at
  `REVIEW.md`, a file deleted in Phase 9. Triangle-inequality violations are **856**, not the 761
  stated. Changelog has two "Phase 7" sections and runs 7 → 6D → 11 → 10 → 9 → 8 → 7. Unify
  `--gap-*` tokens to `--atlas-*` and adopt them in the other two modules.

---

## Known issues not yet scheduled

- **The pairing duplicate-reclassification loop is O(n²)** with key re-computation inside, and the
  pair-summary export does a `find()` inside a `forEach`. The upload guard permits 50 MB
  (~500k rows). The guard and the algorithm disagree by orders of magnitude. Resolve together once
  pairing is extracted in Phase 2 Task D.
- **197 inline event handlers** (`onclick`, `onchange`, `oninput`, `onkeydown`). These are the gate
  on removing `unsafe-inline` from the CSP and on retiring the `window` bridge in `src/main.js`.
  Deserves its own phase.
- **The `truncated` validation category is dead code.** `gapReasonBucket` and `ukPillHtml` both
  handle it; nothing ever produces it. Wiring it up is a Phase 3 product decision.
- **`ap-southeast-6` (Auckland) and `ap-east-2` (Taipei) are absent** from `regions[]`. The R4 fix
  relabelled rather than added, so the optimizer cannot place a cell in New Zealand or Taiwan.
- The live GitHub Pages site is currently broken — root `index.html` loads a module path that does
  not resolve without a build. Phase 2 Task A fixes it. Sanjoy confirmed nobody is using it
  right now.

---

## How this project fails, and how to avoid it

Two failure modes have recurred across every cycle:

1. **Documentation drifts and agents build on it.** `docs/SPEC.md` has twice accumulated "known
   defect" markers describing bugs that were long since fixed. A human reading a wrong claim might
   check. An agent takes it as given. Treat the code as the source of truth; verify before
   building on any documented claim.
2. **Tests that assert nothing.** Before Phase 1, six Playwright tests re-implemented application
   logic inside `page.evaluate()` and asserted against their own copy — including the physics test,
   which computed a value and then discarded it. They reported coverage that did not exist, over
   exactly the fixes that mattered most. **A test that cannot fail is worse than no test**, because
   it stops anyone looking.

The general rule that has worked here: when a claim can be checked against reality cheaply, check
it. The physics of light in fibre, the actual output of a function, a screenshot before and after.

---

## Resuming on another machine

1. `git clone https://github.com/sanjoymitra90-rgb/qwen-test-atlas.git`
2. `npm install`
3. Connect Claude to the cloned folder
4. **`jwt.csv` will not be there** — it is gitignored by design. Copy it across manually if needed
   for testing, or use `fixtures/gap-screenshots.csv`, which is synthetic and safe.
5. Point the new session at this file and `2026-08-12-phase-2-spec.md`
