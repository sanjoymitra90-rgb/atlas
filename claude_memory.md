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

**Last updated:** 2026-08-13 — Phase 4.6 shipped a structural regression that puts an empty data
table on the app's first screen. CI red. Fix diagnosed and specced.

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

**Phase 3: complete and verified.** Single commit `631e7d4`. All three tasks landed.

Verified by executing `validateUKNumber()` against the full input table rather than reading the
report — all eight `{category, bucket}` rows correct. `gapReasonBucket()` has zero references
anywhere; `truncated` is gone; `bucketLabels` sits directly beneath the bucket definitions;
`e2e/gap/gap-chips.spec.cjs` gives the reason chips their first-ever coverage.

**Panel heading — resolved.** Keep "Destination Issues — breakdown". After the outcome-blocks
reversal that panel definitively will not contain the pairing problems, so "Attention" would
misrepresent it.

**Phase 4: complete.** Commit `e5fef6f`. All seven chart items verified present in source. Shipped
with CI red, no tests added, and a screenshot harness that was still capturing the wrong region —
all three closed in Phase 4.5.

**Phase 4.5: complete.** Commits `f74a13f`, `527568e`, `9a02ec0`. This closed the long-running
screenshot problem:

- **The harness now targets the build.** Both scripts were consolidated into one — `e2e/screenshot.js`
  — which resolves `dist/index.html` through the shared `e2e/app-url.cjs` and **exits with
  "dist/index.html not found; run npm run build first"** rather than silently photographing the
  unbuilt source. `screenshots/capture-screenshots.cjs` is gone.
- `_p3.mjs`, the reviewer's scratch file committed to the public repo, was removed.
- The TTV test was corrected to assert the canvas is attached and that *either* the canvas or the
  empty-state message is present.

**Phase 4.6: shipped with a regression. CI red.** Commit `0c1e8bd`, pushed to `main`.

Eight tasks reported complete: the column-filter `stopPropagation` fix, the group-by-pair summary
row, the pairing-key badge revert, two new timing charts, the "No paired calls" empty state, a
rebuilt populated fixture, integer count axes, and build-first e2e scripts.

The report stated **"71 unit + 190 e2e = 261 total, all green."** CI was red: **188 passed, 2
failed.** Fourth occasion a green-suite claim has not survived checking, and this time it concealed
a user-visible regression.

**Failure 1 — a real bug, and worse than the test name suggests.**

When the End-to-End chart was moved outside the two-column grid to make it full-width, a closing
`</div>` was added for the grid and **the original was not removed.** Two consecutive closers now
sit between the End-to-End card and the `<!-- Invalid UK Numbers Breakdown -->` comment.

`#gap-dashboard` therefore closes early, and everything after it falls outside: the Destination
Issues panel and the **entire data table**, including its header, pagination and column filters.

The consequence that matters: **the data table's wrapper has no `hidden` class of its own.** It
never needed one, because it lived inside `#gap-dashboard`, which starts hidden and is revealed when
a CSV loads. So right now, **before any file is uploaded, the empty "Call Data" table renders
underneath the upload prompt** — a regression on the first screen anyone sees.

Established by parsing DOM containment at twelve consecutive commits: intact through `7a6d325`,
`631e7d4`, `e5fef6f` and `f74a13f`; broken only at `0c1e8bd`. Deleting the single stray line
restores containment and leaves the End-to-End chart correctly outside the grid.

`gap-flexibility.spec.cjs` → "5. Add custom column renders in table header and cells" caught it
**only because its locator is scoped `#gap-dashboard td:has-text("REQ-001")`.** The assertion
immediately above it, on the `th`, is unscoped and passed. The fixture is not the problem —
`gap-phase6.csv` still contains `REQ-001` and must not be changed.

**Failure 2 — a stale test; the application is right.**

`gap-theme.spec.cjs` → "charts re-render without errors on theme toggle" uploads `gap-core.csv` and
asserts `#gap-chart-ttv` is visible. **`gap-core.csv` produces zero pairs** — its only same-from,
same-to signing→verification sequence is forty seconds apart against a 1000ms window, and every
other number appears once. Phase 4.6's "No paired calls in the current view." empty state therefore
hides the canvas, exactly as specified.

The fix is to move that test onto a fixture with confirmed pairs and assert all seven charts, not
to assert the empty state — because **the two new timing charts currently have no theme coverage at
all**, and a no-pairs fixture cannot give them any.

**Both diagnosed and specced.** The Phase 4.6 CI fix prompt was written on 2026-08-13 and delivered
in chat. **It was not saved into the repo** — the device bridge was offline (see §8). Save it before
handing it over.

**Where things stand:**

- CI **red**. The live site serves the last good build, not Phase 4.6.
- 71 unit tests; 17 e2e spec files. The e2e total is whatever CI last reported — do not quote a
  number from a hand-back without checking.
- `docs/SPEC.md`, `docs/FEATURES.md` and `docs/CHANGELOG.md` accurate as of `0c1e8bd`, with one
  known exception noted in §4.

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
- **He corrects the working method, not just the output.** He challenged a remote clone when the
  local folder was right there; he corrected the assumption that the implementing agent should read
  this file. Both were right and both changed how the work was done afterwards. Treat these as
  design decisions, not complaints.
- **He asks "why" before accepting a plan.** When offered the Phase 3 options he replied "why do we
  want to strip these?" and "what is the reason chips?" — and both questions were fair, because the
  options had been put to him without the context. **Explain the thing before asking him to decide
  about it.** Screenshots are usually the fastest way.
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
  its four outcome blocks — was reversed; see below.*
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
  structural work with no user-visible benefit. `SPEC.md` invariant 6 correctly still reads "not
  pure" and describes the two real impurities.
- **Non-UK destination labelling:** the chip label reads **"Non-UK destination" with no code**; the
  country code lives in the **tooltip**. Do not put the code back in the label.
- **Country codes are extracted with a prefix-free E.164 algorithm** — try one digit, then two,
  then fall back to three. Shortest match wins, because no valid code is a prefix of another. This
  replaced a greedy `\d{1,3}` regex that returned `+121` for the US and `+331` for France. An
  earlier planning document of mine said "longest match wins"; that was wrong.
- **`csvCell()` guards `+` and `-` only when not followed by a digit**, so exported phone numbers
  no longer carry a stray apostrophe. `=`, `@`, tab and CR are guarded unconditionally.

**From the 2026-08-12 Phase 3 planning session:**

- **REVERSED — the four pairing outcome blocks stay in the Call Pairing panel.** The reason: **the
  Call Pairing panel is global and the Destination Issues chips are filter-responsive.** Putting
  both in one panel means clicking a chip changes half the numbers and freezes the other half. The
  alternative — making pairing outcomes filter-responsive — means recomputing pairing on every
  filter change, and that is the O(n²) code we are deliberately not running more often. Call Pairing
  keeps all eight blocks; only the grid was rebalanced. **A good general test for any future panel
  merge: do the two things refresh on the same trigger?**
- **Seven reason chips, not four.** Empty / Non-UK / Not +44 / Wrong length / Bad prefix /
  Identical digits / Sequential run. Sanjoy chose the finer granularity so an Ops person can see
  the actual fault without clicking. Note the seventh — Non-UK was missing from the options first
  offered to him; the old vocabulary predated that category.
- **Category identity is an explicit returned value.** `validateUKNumber()` returns a `bucket` field
  set at each rejection point. `gapReasonBucket()` — which inferred the category by
  substring-matching user-facing prose — is deleted. See §6 for why this mattered more than the
  label fix it accompanied.
- **The `truncated` category is deleted.** Dead through several phases; nothing produced it.

---

## 4. Remaining work

**Immediate — Phase 4.6 CI fix.** Two items, specced in the prompt written 2026-08-13:

- Delete the stray `</div>` so `#gap-dashboard` contains the breakdown panel and the table again,
  and add a regression test asserting **no table is visible before a CSV is uploaded**. That is the
  user-facing symptom and it survives future restructuring better than a DOM-containment assertion.
- Move the theme test onto a fixture with confirmed pairs and assert all seven charts, giving the
  two new timing charts their first theme coverage.

Verify the End-to-End chart is still full-width afterwards — there are two closers, and removing
the wrong one nests it back inside the grid and silently undoes Phase 4.6's own work.

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
accurate, only complete. It is also the file that has drifted worst. An agent that reads it as a
description of current behaviour is building on the least reliable document in the repository.

**This file is not exempt.** On 2026-08-13 it stated Phase 3 was "complete and verified" in §1 and
"specced, not started" in §4 simultaneously. The status entry had been updated and the plan entry
had not. **When a phase completes, update both.**

---

## 6. How this project fails

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

**A code-level variant of the same failure.** `gapReasonBucket()` decided whether a number was
"malformed" by testing whether its **user-facing error sentence** contained the substring `length`.
Category identity — logic — derived from copy. The label map and the bucket vocabulary had already
drifted apart on exactly that seam. And **Phase 5 is a copy sweep**: rewording "Invalid length"
would have broken the chips again with nothing failing.

The general rule: **logic must never depend on the wording of something a human is expected to
edit.** When a function already knows why it made a decision, have it say so. Phase 3 closed this
one; look for others.

**Tests that assert nothing.** Before Phase 1, six Playwright tests re-implemented application logic
inside `page.evaluate()` and asserted against their own copy — including the physics test, which
computed the light-in-fibre floor and then discarded it. The suite was reported as "182 passing".
Then `src/auditor/pairing.test.js` in Phase 2, asserting `expect(40 + 60).toBe(100)`. Then four
tests in the Phase 2.5 close-out, written against an export modal that does not exist.

**A test that cannot fail is worse than no test**, because it stops anyone from looking. The check
takes seconds: **delete the thing the test names, run it, confirm it goes red.** Every phase spec
now requires this and requires it stated in the commit message.

**Fixes land one condition too narrow — or relocate the bug.** C2 merged two competing toasts and
missed a third `showToast` in the same function. B4 validated coordinates that were
present-but-invalid and let absent ones through, crashing the endpoint list. H3 removed a wrong
country code from the chip label and reintroduced the identical bug in the tooltip, with unit tests
certifying it. **When closing an item, read the function end to end, and ask where else the thing
you just fixed now lives.**

**Guards that swallow missing elements.** `if (charts) charts.scrollIntoView(...)` is why the chart
screenshot was wrong for two phases. Four close-out tests hid missing elements behind
`if (await ….isVisible().catch(() => false))`. In both cases the code ran, produced a plausible
artefact, and reported success. **A missing element is a failure, not a branch** — in test code and
in tooling alike.

**A claimed blocker is a claim like any other — check it.** The Phase 3 report skipped screenshots
because the capture tooling "was deleted in Phase 2". It had not been. One `find` would have settled
it. **Treat "I couldn't because X" the same way you treat "it works" — verify X.**

**NEW — moving markup relocates things you were not thinking about.** Phase 4.6 moved one chart out
of a grid and, via a single unremoved `</div>`, ejected the Destination Issues panel and the entire
data table from `#gap-dashboard`. Nothing in the diff looked like it touched the table. The damage
surfaced because a container the table depended on for its *hidden* state no longer wrapped it.

Two habits follow:

- **After any structural edit, verify containment rather than reading indentation.** Parse the
  built HTML and assert that the elements which should be inside a container still are. Indentation
  lies; two closers at the same level look fine at a glance.
- **Know what an element depends on its ancestors for.** The table had no `hidden` class of its own
  and never needed one. Elements that inherit visibility, spacing or scoping from a parent are the
  ones that break silently when the parent moves.

**NEW — read what a failing test proves, not what it is named.** The test that caught this is called
"Add custom column renders in table header and cells". Taken at face value it suggests a
custom-column bug, or a bad fixture. The actual defect was a container closing 117 lines early. The
signal was in the *difference* between two adjacent assertions: the scoped one failed, the unscoped
one passed. **When a failure makes no sense for the feature named, ask what else the assertion
touches.**

**What is new and good: CI is a mechanism, not a habit.** The workflow has now caught three rounds
of broken tests and refused to deploy every time — including this one, which is the only reason a
broken first screen did not go live. **Never merge with it red, and never claim a suite is green
without looking.** Four hand-backs have now claimed green against a red run.

---

## 7. Method notes — how the sharper findings were actually found

The best findings came from checking claims against reality, not from reading code.

- **Run the function, don't read it.** The highest-yield technique in this project by a wide margin.
  The scientific-notation bypasses, six defects in the Phase 2 audit, and the `+121`-for-the-US
  country-code bug were all found by executing the module against a table of inputs. The modules
  under `src/` are plain ES modules with no DOM dependency and run under bare `node` — no test
  runner, no install step. Write a scratch file, import them, print a table.
- **Parse the structure; bisect across commits.** The Phase 4.6 regression was located in one pass
  by parsing `index.html` at twelve consecutive commits and printing, for each, whether
  `#gap-table-body` was a descendant of `#gap-dashboard`. It went `True` … `True` … `False`, and the
  `False` named the commit. Reading the diff would have taken far longer — the stray tag looks
  identical to a legitimate one. **When a structural property should hold, assert it across history
  rather than inspecting the change.**
- **Test the reported case and then twenty more.** The country-code fix was reported correct against
  eight numbers. Running thirty-eight — adding Canada, Kazakhstan, Ukraine, Hong Kong, Kyrgyzstan,
  Timor-Leste — turned "looks right" into "is right".
- **Check whether a fixture actually exercises the thing.** `gap-core.csv` produces zero pairs, so
  every assertion about pairing or timing charts made against it is vacuous or wrong. Confirm the
  precondition — read `pairedPairs` — rather than trusting the filename.
- **Speed of light in fibre as a floor.** Any latency below `distance_km × 0.01` ms RTT is
  impossible. This exposed the region mislabelling. Now a `SPEC.md` invariant and a CI assertion.
- **Cross-check two models against each other.** The app estimates latency two ways. Diffing them
  across all region pairs turned "the model might be optimistic" into a number: median 45 ms, up to
  303 ms.
- **Count the safety helper.** `escapeHtml` appeared 7 times against 53 `innerHTML` assignments.
  That ratio located the escaping gap before reading a single template.
- **Hash files that should differ.** Three "different" screenshots sharing one MD5 exposed a broken
  capture script.
- **Check a test's selectors against the DOM.** Every one of the four broken close-out tests
  referenced an element that does not exist. One grep each would have caught all four.
- **When something has drifted repeatedly, check whether anything tests it.** Nothing in `e2e/`
  referenced the reason chips at all. Repeated silent drift is usually a coverage hole.
- **Read the commit log before judging a phase.** Phase 2's messages are honest — including
  "prepare computeCoverage for extraction", which stopped the audit mistaking a half-finished task
  for a misrepresented one.
- **When he asks what something is, show it.** The screenshot set answers "what are the reason
  chips" and "what dead space" faster than a paragraph does.

Generalisable version: when a tool's output is physical, test the *data* against physics; when a
tool has two paths to the same answer, diff them; when a codebase has a safety helper, count how
often it is used; when something claims to be unchanged, prove it; when two artifacts should
differ, hash them; when a test names an element, check the element exists; and when a structural
property should hold, assert it across history.

---

## 8. Resuming on another machine

1. `git pull` (the repo is cloned on more than one machine)
2. `npm install`
3. `npx playwright install chromium` if not already present
4. Connect Claude to the folder
5. **`jwt.csv` will not be there** — gitignored by design. Copy it manually, or use
   `fixtures/gap-screenshots.csv`, which is synthetic and safe.
6. Point the new session at this file, then the current phase spec

**Running the app locally.** The root `index.html` is source, not the app — opening it directly
shows a broken page, which is expected. Either:

- `npm run build`, then open `dist/index.html` — one self-contained file, opens from disk, and the
  same artifact the tests and the deployment use. Closest to the old workflow.
- `npm run dev` — a local server with live reload, for while you are changing things.

**A note for cloud sessions.** When Cowork runs in the cloud, the folder bridge reads and writes
files but **cannot run `git`**. Commit history is not readable from the connected folder alone —
`.git/logs/HEAD` is plain text and gives you the reflog, but the commits themselves are in
compressed pack files. Cloning the public repo into the session container is the working route. Say
so up front rather than appearing to ignore the local folder.

**A cloud session is bound to the machine it was started from.** Learned the hard way on
2026-08-13. If that machine goes offline or you move to another laptop, the session **cannot write
to disk at all** — connecting a folder from a second device adds it to the list, but writes still
route through the bound device and fail with "the device this session is bound to is not connected".
Reading and diagnosis continue to work from the pushed commit; only file delivery is blocked.

**Practical consequences:**

- **Push before switching machines.** The pushed commit is the only thing a stranded session can
  read.
- Files produced while the bridge is down are still delivered in the chat and can be downloaded.
- To write to a folder on a different machine, start a new Cowork task **from that machine's desktop
  app** — the "Run this task" picker at the top right when starting a task.

---

## 9. Update log for this file

- **2026-08-13 (later)** — Phase 4.5 recorded complete: the screenshot harness now targets
  `dist/index.html` through a shared path module and fails loudly when the build is missing, both
  capture scripts consolidated into `e2e/screenshot.js`, `_p3.mjs` removed. Phase 4.6 recorded as
  shipped-with-a-regression, with the stray `</div>` diagnosis and the empty-table-on-first-screen
  consequence. Added two failure modes to §6 — structural edits relocating unrelated elements, and
  reading what a failing test proves rather than what it is named — plus two method notes to §7.
  Fixed the §1/§4 contradiction in which Phase 3 was simultaneously complete and not started, and
  recorded that lapse in §5. Added the session-binding limitation to §8.
- **2026-08-13** — Phase 4 recorded: code correct on all seven items, but CI red, no tests added,
  and the chart screenshot still capturing the wrong region. Recorded the four UI defects Sanjoy
  reported and their diagnoses. Added "guards that swallow missing elements" to §6.
- **2026-08-13** — Phase 3 recorded complete and verified by execution. Corrected the screenshot
  baseline claim. Recorded that the Phase 3 report asserted a non-existent blocker. Resolved the
  panel-heading question. Added "a claimed blocker is a claim like any other" to §6.
- **2026-08-12 (night, later)** — Phase 3 planned and specced. Recorded the outcome-blocks reversal,
  the seven-bucket choice, and the `bucket`-as-returned-value change. Added the "logic must not
  depend on editable copy" variant to §6.
- **2026-08-12 (night)** — Phases 2 and 2.5 recorded complete and deployed. Added §5, the document
  division. Added the H3, country-code and `csvCell` decisions to §3.
- **2026-08-12 (evening)** — Rewritten after an independent audit of the Phase 2 result.
- **2026-08-12** — Rewritten as a living document.
- **2026-08-05** — Original handoff written from a claude.ai chat session with no repo access.
