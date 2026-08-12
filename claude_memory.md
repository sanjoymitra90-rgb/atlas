# claude_memory.md

**What this is:** the living memory of this project across Claude sessions. It carries the
*conversation* — what was decided, what was rejected, and why. The other documents carry the
system.

**Who reads it:** the maintainer and his planning sessions. **Not the implementing agent** — see §5.

**Read order:** this file → `docs/SPEC.md` → the current phase spec.

**Maintenance rule:** update this file at the end of every working session. It is the only
document permitted to describe project *state*; `docs/SPEC.md` describes the system as it is,
`docs/FEATURES.md` describes behaviour in user language, `docs/CHANGELOG.md` is history. If two
documents state the same fact, one of them will eventually be wrong.

**Last updated:** 2026-08-12 (night) — Phases 2 and 2.5 complete, verified and deployed.
Phase 3 planned and specced; not started.

---

## 1. Current status

**Phase 1: complete and verified.** Committed as `02d3dc9`.

**Phase 2: complete.** Twenty commits, `e2b97a1` through `ee7f62f`. Repo hygiene, CI/CD, six
security fixes, the `pairKey` extraction, CDN dependencies moved to npm, build-time Tailwind, and
`unsafe-eval` removed from the CSP.

**Phase 2.5: complete.** An independent audit of the Phase 2 result found a fake test file, six
correctness bugs in the import and onboarding paths, three export defects, and a changelog with
five factual errors. All were closed. The close-out then needed two further passes — the four new
security tests had been written against a UI that does not exist, and the country-code fix had
relocated its own bug into the tooltip. Both were caught and fixed. Final commit `7a6d325`.

**Where things stand:**

- CI is green. The live site serves the current build.
- 77 unit tests, plus the Playwright suite. Every one of the six Phase 2 security fixes now has a
  test that has been proven able to fail.
- The screenshot baseline exists and is valid — eleven distinct captures, gitignored. This matters
  more in Phase 3 than it did before, because Phase 3 changes rendering.
- `docs/SPEC.md`, `docs/FEATURES.md` and `docs/CHANGELOG.md` are accurate as of this commit, with
  one known exception noted in §4.

**Phase 3: planned, specced, not started.** Spec is `2026-08-12-phase-3-spec.md`. Three tasks —
the reason vocabulary, moving the breakdown panel above the table, and closing the hole in the Call
Pairing grid. The first is the substance; the other two are small. Nothing blocks it.

**One question outstanding for Sanjoy:** whether the relocated panel should keep its heading
"Destination Issues — breakdown" or be renamed "Attention". The spec keeps the existing heading and
tells the agent to ask rather than assume. Reasoning in §3.

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
- **He corrects the working method, not just the output.** Two examples from 2026-08-12: he
  challenged a remote clone when the local folder was right there, and he corrected the assumption
  that the implementing agent should read this file. Both were right and both changed how the work
  was done afterwards. When he raises something like this, treat it as a design decision, not a
  complaint.
- **He verifies.** He reports what the dev claims and then asks whether it is true. Answer that
  question by executing the code, not by reading it.
- He communicates via voice transcription, so messages carry transcription artefacts. The intent is
  always clear; read through them.
- **He is not a developer.** Explain mechanisms, not just conclusions. When he asked what a "diff"
  was, the useful answer included why it mattered for that specific phase. When he asked how to run
  the app after the build step landed, the useful answer led with "the file you double-click is now
  `dist/index.html`".

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
- **Exceptions view:** the Destination Issues breakdown is **absorbed** into a panel above the
  table rather than a new panel sitting beside it. Sanjoy's improvement on the original proposal,
  and it still stands. *The second half of this decision — that the Call Pairing panel would shed
  its four outcome blocks — was reversed on 2026-08-12; see below.*
- **Architecture:** split the monolith. Vite with `vite-plugin-singlefile`, so output stays one HTML
  file. Plain ES modules without a build step were ruled out — browsers block them over `file://`.
- **Light theme:** parked indefinitely. Hide the toggle in Phase 5 so a half-styled theme is not
  reachable in the meantime.
- **Endpoint duplicates:** the same physical location may **not** be added twice.
- **`jwt.csv` stays local, gitignored.** Never committed — verified across all history, twice. It
  holds 1,353 real UK numbers and signed JWTs; the repo is **public**.
- **Repo stays public and free.** Private repos support Pages only on paid plans.
- **`607` / `302` in the Status column are SIP response codes, not HTTP.** Phase 5 adds a tooltip
  reading "service provider response code" — do not invent meanings for individual codes.
- **The `Customer` column is really the service provider** (`Wavecrest`, `AudioCodes`). Renaming to
  "Service Provider" is Phase 5. It breaks the CSV export header for downstream scripts.
- **Font Awesome stays on its CDN.** Bundling font files conflicts with single-file output. Note
  that `@fontsource/inter` was also added from jsdelivr, so there are **two** remaining CDN
  stylesheets, not one.

**From the 2026-08-12 audit and close-out:**

- **Task D is deferred**, formally and deliberately. `pairKey()` and the memoisation-key fix — the
  valuable half — landed in Phase 2. Moving `pairGapCalls()` and `computeCoverage()` into `src/` is
  structural work with no user-visible benefit, and it lost to Phase 3 on merit. `SPEC.md`
  invariant 6 correctly still reads "not pure" and describes the two real impurities.
- **Non-UK destination labelling (H3):** the chip label reads **"Non-UK destination" with no code**;
  the country code lives in the **tooltip**. Do not put the code back in the label.
- **Country codes are extracted with a prefix-free E.164 algorithm** — try one digit, then two,
  then fall back to three. Shortest match wins, because no valid code is a prefix of another. This
  replaced a greedy `\d{1,3}` regex that returned `+121` for the US and `+331` for France. An
  earlier planning document of mine said "longest match wins"; that was wrong.
- **`csvCell()` guards `+` and `-` only when not followed by a digit**, so exported phone numbers
  no longer carry a stray apostrophe. `=`, `@`, tab and CR are guarded unconditionally.

**From the 2026-08-12 Phase 3 planning session:**

- **REVERSED — the four pairing outcome blocks stay in the Call Pairing panel.** The earlier plan
  moved them into the Attention panel. The reason for reversing: **the Call Pairing panel is global
  and the Destination Issues chips are filter-responsive.** Putting both in one panel means
  clicking a chip changes half the numbers and freezes the other half — same panel, two rules, no
  visual cue explaining why. The alternative, making pairing outcomes filter-responsive, means
  recomputing pairing on every filter change, and that is the O(n²) code we are deliberately not
  running more often. So Call Pairing keeps all eight blocks; only the grid is rebalanced to close
  the layout hole. **This is a good general test for any future panel merge: do the two things
  refresh on the same trigger?**
- **Seven reason chips, not four.** Empty / Non-UK / Not +44 / Wrong length / Bad prefix /
  Identical digits / Sequential run. Sanjoy chose the finer granularity so an Ops person can see
  the actual fault without clicking. Note the seventh — Non-UK was missing from the options I first
  offered him; the old vocabulary predated that category.
- **Category identity becomes an explicit returned value.** `validateUKNumber()` will return a
  `bucket` field set at each rejection point, and `gapReasonBucket()` — which infers the category by
  substring-matching the user-facing reason prose — is deleted. See §6 for why this matters more
  than the label fix it accompanies.
- **The `truncated` category is deleted.** Dead through several phases; nothing produces it.
- **Panel heading:** open. The spec keeps "Destination Issues — breakdown" and tells the agent to
  ask before renaming to "Attention", on the grounds that a panel called "Attention" which does not
  contain the pairing problems misrepresents itself. Sanjoy's call.

---

## 4. Remaining work

**Phase 3 — specced, not started.** `2026-08-12-phase-3-spec.md`. Three tasks:

- **A — the reason vocabulary.** Seven buckets with human labels, `bucket` returned explicitly by
  `validateUKNumber()`, `gapReasonBucket()` deleted, `truncated` removed, and the first Playwright
  coverage the chips have ever had.
- **B — move the breakdown panel** to sit directly above the table it filters, instead of above the
  charts. Relocation only; contents and behaviour unchanged.
- **C — rebalance the Call Pairing grid** to four columns so eight blocks make two clean rows.
  Nothing else in that panel changes.

**Sequencing note:** Task A must land before Phase 5. Phase 5 is a copy sweep, and until A lands,
rewording a validation message silently breaks the chips. See §6.

**Phase 4 — Charts.** Legend colour collision (two "invalid" series share one colour, making the
stacked bar unreadable); width-aware bucketing (5½ hours of data produces ~65 rotated axis labels);
single-bucket empty state; rethink the Requests Over Time and Invalid Numbers encodings; TTV to
full width; table/chart timezone consistency — the table prints the raw CSV string, the charts
print a UTC-normalised timestamp, and they disagree when the source carries no offset.

**Phase 5 — Layout, density, copy.** Toast and help FAB overlap functional UI; filter panel always
expanded; tile redesign; table density; hide the theme toggle; the `Customer` → "Service Provider"
rename; the SIP response-code tooltip; copy sweep.

**Phase 6 — Docs and tokens.** `docs/SPEC.md` still carries stale defect markers pointing at
`REVIEW.md`, deleted in Phase 9. Triangle-inequality violations are **856**, not the 761 stated.
The changelog has two "Phase 7" sections and runs 7 → 6D → 11 → 10 → 9 → 8 → 7. Unify `--gap-*`
tokens to `--atlas-*` and adopt them in the other two modules.

**Deferred, needs its own phase:** converting the 197 inline handlers to delegated listeners. This
gates removing `unsafe-inline` from the CSP and retiring the `window` bridge in `src/main.js`.

**Known issues with no home yet:**

- **The pairing duplicate-reclassification loop is O(n²)** with key re-computation inside, and the
  pair-summary export does a `find()` inside a `forEach`. The upload guard permits 50 MB — roughly
  500k rows. The guard and the algorithm disagree by orders of magnitude. Best tackled straight
  after Task D, when the code is finally testable.
- **`ap-southeast-6` (Auckland) and `ap-east-2` (Taipei) are absent** from `regions[]`. The R4 fix
  relabelled rather than added, so the optimizer cannot place a cell in New Zealand or Taiwan.
- **One known documentation inaccuracy:** the changelog's country-code entry says the two-digit
  code list has 47 entries. It has 44. The list itself is complete and correct — only the count is
  wrong. Fix it whenever that file is next open.

---

## 5. How the documents are divided

Settled 2026-08-12. This is the mechanism that keeps them from drifting into each other.

| Document | Audience | Role |
|---|---|---|
| `claude_memory.md` | Sanjoy and his planning sessions | The conversation. **The implementing agent does not read it** |
| `docs/SPEC.md` | The implementing agent | The contract. Invariants, behaviour, what must not regress |
| `docs/FEATURES.md` | Anyone | Behaviour in user language. **No code identifiers, ever** |
| `docs/CHANGELOG.md` | History | The agent **writes to it and does not read it as truth** |

**Why the agent does not read this file.** It is a working document between Sanjoy and his planning
sessions — it carries reasoning, half-formed options and state, none of which is a reliable
instruction to build from. Anything an agent needs must be reproduced in its phase spec.

**The practical cost:** every phase spec has to carry its own copy of the relevant failure modes and
the relevant do-not-reopen decisions. That is deliberate. The alternative — promoting the durable
parts of this file into `SPEC.md` so they are available without re-copying — is worth considering
during Phase 6, and not before.

**Why the changelog is write-only for agents.** Its own header states it is not maintained to stay
accurate, only complete. It is also the file that has drifted worst — five factual errors in Phase
2, more introduced while fixing them. An agent that reads it as a description of current behaviour
is building on the least reliable document in the repository.

---

## 6. How this project fails

Three failure modes. All three recurred during Phase 2 and 2.5. **All three are now caught by CI —
see the end of this section.**

**Documentation drifts, and agents build on it.** `docs/SPEC.md` has twice accumulated "known
defect" markers describing bugs long since fixed. It has claimed a symmetric latency matrix when
450 of 496 pairs differ, and claimed `computeCoverage()` was pure when it read three module globals.
A human reading a wrong claim might go and check. An agent takes it as given and builds on it.

It happened again in Phase 2's changelog — five errors, including three functions that do not exist
anywhere in the repository. The cause was identifiable: **the docs were written in one pass at the
end, from memory.** The rule now is to fix the document in the same commit as the code.

Three rules worth defending:

- **No line numbers in any document.** They go stale within a phase. Anchor on function names,
  element IDs, `data-testid` values.
- **`FEATURES.md` contains no code identifiers.** If a fact appears in only one file, it cannot
  drift against another file. That is the whole mechanism.
- **`SPEC.md` opens with invariants**, each carrying its reason. Rationale next to the rule gets
  updated with the rule; rationale in an appendix does not.

**A code-level variant of the same failure, found while planning Phase 3.** `gapReasonBucket()`
decides whether a number is "malformed" by testing whether its **user-facing error sentence**
contains the substring `length`. Category identity — logic — is derived from copy. The label map
and the bucket vocabulary had already drifted apart on exactly this seam, which is why the chips
render raw slugs today. And **Phase 5 is a copy sweep**: rewording "Invalid length" would have
broken the chips again with nothing failing.

The general rule: **logic must never depend on the wording of something a human is expected to
edit.** When a function already knows why it made a decision, have it say so — do not make a second
function re-derive it from prose. Phase 3 Task A closes this one; look for others.

**Tests that assert nothing.** Before Phase 1, six Playwright tests re-implemented application logic
inside `page.evaluate()` and asserted against their own copy — including the physics test, which
computed the light-in-fibre floor and then discarded it. The suite was reported as "182 passing".

Then `src/auditor/pairing.test.js` in Phase 2, asserting `expect(40 + 60).toBe(100)` and checking a
property on an object it had built two lines earlier. Then four tests in the Phase 2.5 close-out,
written against an export modal that does not exist — three of them aimed at the wrong module
entirely, hidden behind `if (await …isVisible().catch(() => false))` guards that swallowed every
missing element.

**A test that cannot fail is worse than no test**, because it stops anyone from looking. The check
that catches all of these takes seconds: **delete the thing the test names, run it, confirm it goes
red.** Every phase spec now requires this and requires it stated in the commit message.

**Fixes land one condition too narrow — or relocate the bug.** C2 merged two competing toasts and
missed a third `showToast` further down the same function. B4 validated coordinates that were
present-but-invalid and let absent ones through, which then crashed the endpoint list. And H3
removed a wrong country code from the chip label and reintroduced the identical greedy-regex bug in
the tooltip — the same `+331`-for-France defect, in a new location, now with unit tests certifying
it as correct.

The pattern is fixing the named line rather than reading the whole function, and moving code
without re-checking whether the original defect moved with it. **When closing an item, read the
function end to end, and ask where else the thing you just fixed now lives.**

**What is new: CI is now a mechanism, not a habit.** The workflow caught two rounds of broken tests
in a single day and refused to deploy both times. Before this, every one of these failures was
found by a human reading code — which is why they survived for phases at a time. The green tick is
now worth something. Protect that: never merge with it red, and never claim a suite is green
without looking.

---

## 7. Method notes — how the sharper findings were actually found

The best findings came from checking claims against reality, not from reading code.

- **Run the function, don't read it.** This is the highest-yield technique in the project by a
  wide margin. The scientific-notation bypasses, six defects in the Phase 2 audit, and the
  `+121`-for-the-US country-code bug were all found by executing the module against a table of
  inputs. The modules under `src/` are plain ES modules with no DOM dependency and run under bare
  `node` with no test runner and no install step. Write a scratch file, import them, print a table.
  Do this before reading anything.
- **Test the reported case and then twenty more.** The country-code fix was reported correct
  against eight numbers. Running thirty-eight — adding Canada, Kazakhstan, Ukraine, Hong Kong,
  Kyrgyzstan, Timor-Leste — is what turned "looks right" into "is right".
- **Speed of light in fibre as a floor.** Any latency below `distance_km × 0.01` ms RTT is
  impossible. This exposed the region mislabelling. It is now `SPEC.md` invariant 1 and a real CI
  assertion.
- **Cross-check two models against each other.** The app estimates latency two ways. Diffing them
  across all region pairs turned "the model might be optimistic" into a number: median 45 ms, up to
  303 ms.
- **Symmetry and triangle inequality.** 450 asymmetric pairs, 856 triangle violations, worst 59 ms.
- **Count the safety helper.** `escapeHtml` appeared 7 times against 53 `innerHTML` assignments.
  That ratio located the escaping gap before reading a single template.
- **Hash files that should differ.** Three "different" screenshots sharing one MD5 exposed a broken
  capture script. Sizes alone were suggestive; hashes were conclusive.
- **Check a test's selectors against the DOM.** Every one of the four broken close-out tests
  referenced an element that does not exist. One grep each would have caught all four.
- **When something has drifted repeatedly, check whether anything tests it.** The reason chips have
  drifted through several phases. One grep showed why: nothing in `e2e/` references
  `.gap-reason-chips` or `#gap-invalid-reason-panel` at all. Repeated silent drift is usually a
  coverage hole, not carelessness — find the hole before rewriting the code.
- **Read the commit log before judging a phase.** Phase 2's messages are honest — including
  "prepare computeCoverage for extraction", which is what stopped the audit mistaking a
  half-finished task for a misrepresented one.
- **When he asks what something is, show it.** The screenshot set exists and answers "what are the
  reason chips" and "what dead space" faster than a paragraph does. Use it.

Generalisable version: when a tool's output is physical, test the *data* against physics; when a
tool has two paths to the same answer, diff them; when a codebase has a safety helper, count how
often it is used; when something claims to be unchanged, prove it; when two artifacts should
differ, hash them; and when a test names an element, check the element exists.

---

## 8. Resuming on another machine

1. `git pull` (the repo is cloned on both the personal and the work machine)
2. `npm install`
3. `npx playwright install chromium` if not already present
4. Connect Claude to the folder
5. **`jwt.csv` will not be there** — gitignored by design. Copy it manually, or use
   `fixtures/gap-screenshots.csv`, which is synthetic and safe.
6. Point the new session at this file, then the current phase spec

**Running the app locally.** The root `index.html` is now source, not the app — opening it directly
shows a broken page, which is expected. Either:

- `npm run build`, then open `dist/index.html` — one self-contained file, opens from disk, and the
  same artifact the tests and the deployment use. This is the closest thing to the old workflow.
- `npm run dev` — a local server with live reload, for while you are changing things.

**A note for cloud sessions.** When Cowork runs in the cloud, the folder bridge reads and writes
files but **cannot run `git`**. Commit history is not readable from the connected folder alone —
`.git/logs/HEAD` is plain text and gives you the reflog, but the commits themselves are in
compressed pack files. Cloning the public repo into the session container is the working route.
Say so up front rather than appearing to ignore the local folder.

---

## 9. Update log for this file

- **2026-08-12 (night, later)** — Phase 3 planned and specced. Recorded the reversal of the
  outcome-blocks decision and the reason for it, the seven-bucket choice, the `bucket`-as-returned-
  value change, and the open panel-heading question. Added the "logic must not depend on editable
  copy" variant to §6 and two method notes to §7. Rewrote the Phase 3 entry in §4 to match the spec.
- **2026-08-12 (night)** — Phases 2 and 2.5 recorded complete and deployed. Collapsed the Phase 2
  audit findings, which have all been actioned. Added §5, the document division settled this
  session, and the reasoning behind keeping this file away from the implementing agent. Added the
  H3, country-code and `csvCell` decisions to §3. Extended the third failure mode to cover fixes
  that relocate a bug, and recorded that CI now catches all three modes. Promoted "run the function,
  don't read it" to the top of §7. Added local-run instructions to §8.
- **2026-08-12 (evening)** — Rewritten after an independent audit of the Phase 2 result. Added the
  per-task verdict, the audit findings, the Phase 2.5 entry, the third failure mode, and the
  cloud-session git limitation.
- **2026-08-12** — Rewritten as a living document. Folded in the Phase 1 verification result, the
  decisions from the review and planning session, the phase plan, and the "tests that assert
  nothing" failure mode. Preserved the descoped items and method notes from 2026-08-05.
- **2026-08-05** — Original handoff written from a claude.ai chat session with no repo access.
