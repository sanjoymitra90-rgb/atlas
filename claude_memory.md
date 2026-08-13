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

**Last updated:** 2026-08-13 (night) — Phases 4.6 through 4.8 complete, CI green, deployed. The
timezone defect found in 4.8 is the most consequential bug the project has had.

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

**Phase 4.6: complete.** Commit `0c1e8bd`, plus CI fix `0325683`.

Shipped a structural regression: moving the End-to-End chart out of the two-column grid left an
extra `</div>`, closing `#gap-dashboard` early. The Destination Issues panel and the whole data
table fell outside it — and because the table's wrapper has no `hidden` class of its own, the empty
"Call Data" table rendered on the upload screen before any file was loaded. One line removed fixed
it. A regression test now asserts no table is visible pre-upload.

**A correction worth keeping.** During that review I reported the rebuilt `gap-screenshots.csv` as
still producing zero pairs, and said Task D2 had failed. **That was wrong.** My clone was checked
out at the pre-fix commit and I measured the old file while calling it the new one — then
"confirmed" it against `git show <old-ref>:...`, which was the same file. Two identical
measurements presented as a before/after. The fixture was correct all along: same-second
timestamps, 30 of 32 signings pairing. See §7.

**Phase 4.7: complete.** Nine commits. Closed the items Phase 4.6 dropped silently — Task E did not
appear in its hand-back at all, and Task F appeared as one line covering the first of four parts.

- Timestamp parsing extracted to `src/auditor/time.js` as `parseGapTimestamp()`, with unit tests.
  Asked for three times before it landed.
- `timeHadOffset` corrected for epoch inputs — they are unambiguous, so the "no timezone" warning
  should not fire for them.
- A staleness guard in `e2e/global-setup.cjs`: aborts if `dist/index.html` is missing, or older than
  anything under `src/` or `index.html`. Proven to fire.
- The screenshot harness pointed at the populated fixture, so the timing charts can actually appear
  in a capture. Root screenshots gitignored.

**Phase 4.8: complete.** Commits through `75f2556`, CI run #21 green and deployed.

**This phase fixed the most consequential bug the project has had.** An ISO timestamp with no
offset was parsed by `new Date()`, which the language specification interprets as *the reader's
local time*. The source data is UTC. So on a UTC+6 machine:

```
source row:      2026-01-15T10:30:00      (10:30 UTC)
parsed as:       04:30 UTC
table showed:    10:30                    (raw string — correct)
charts plotted:  04:30                    (six hours from reality)
```

The charts placed real events at the wrong hour while the table beside them told the truth. **It was
invisible in CI, which runs UTC** — everything agrees there. It only appeared on a human's machine,
which is why no test had ever caught it and why it survived every phase up to this one.

Fixed by parsing offset-less input as UTC. Also landed: the Time cell renders UTC through a shared
`formatGapTimeCell()` used by both table branches, the original is kept in a tooltip where the value
was converted, and the export carries `Time (UTC)` alongside `Time (original)`.

**The CI fix that followed** is worth remembering for how it failed. A new unit test hardcoded
`1735668000000` — the Asia/Dhaka reading of a non-ISO date — so it passed on the developer's laptop
and could not pass in CI or anywhere else. A phase about eliminating timezone dependence shipped a
test that depended on the author's timezone. One line, and the fix was to assert the property rather
than the number.


**Where things stand:**

- **CI green, deployed.** Run #21. The live site serves Phase 4.8.
- 85 unit tests plus the Playwright suite. Do not quote a total from a hand-back without checking
  the Actions run — the two have disagreed repeatedly.
- The three `docs/` files are accurate as of `75f2556`, with one known exception noted in §4.
- **Two display questions are open and waiting on Sanjoy** — see §4.

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

**From the 2026-08-13 timestamp decision — a product rule, not an implementation choice:**

- **Every time the application displays or plots is UTC. No viewer-local rendering anywhere.**
  Sanjoy's reasoning, in his words: the tool is used to reconstruct incidents days later, often by
  more than one person, and *"it has to be at a unified time, meaning UTC"*. A timestamp that means
  something different depending on who opened the file is worse than no timestamp, because it looks
  authoritative while being wrong.
- **A timestamp arriving in another timezone is converted — in the table and in the charts.** The
  source data is UTC today, but the design must hold if a foreign-timezone file ever arrives.
- **Offset-less input is assumed UTC**, because that is what their exports are.
- The original source string is preserved in the cell tooltip where a conversion happened, so the
  conversion is auditable rather than something a user must trust.

---

## 4. Remaining work

**Two open questions, both waiting on Sanjoy. Neither blocks anything.**

- **Display format.** The Time column now shows `2026-01-15 10:30:00` where the source said
  `2026-01-15T10:30:00Z`. Same instant, same clock time, normalised format, original in the
  tooltip. Consistent across every source format — but no longer literally what the file said, and
  the change was made without being flagged. The Phase 4.8 spec had said displayed text must be
  unchanged for `Z`-suffixed rows, so it is a deviation. Keep or revert.
- **The tooltip fires on unchanged rows**, because the "did it change?" check compares strings and
  `T`/`Z` differ textually even when the clock time does not. The right fix depends on the answer
  above, so it was reported and left alone.

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

**NEW — "all tests pass" can mean "on my machine".** Phase 4.8's CI fix shipped a unit test that
hardcoded `1735668000000`, the Asia/Dhaka reading of a non-ISO date. It passed on the developer's
laptop and could not pass in CI or in any other timezone. The phase whose entire purpose was
eliminating timezone dependence shipped a test that depended on the author's timezone.

The wider lesson is not about timezones. **A green suite is evidence about the environment it ran
in.** Anything the environment supplies — timezone, locale, filesystem case-sensitivity, clock,
installed binaries — is a hidden input, and a test that hardcodes a value derived from one of them
is measuring the machine rather than the code. `TZ=UTC npm run test:unit` would have caught this in
seconds and is now in the ship checklist.

**What is new and good: CI is a mechanism, not a habit.** The workflow has now caught four rounds of
broken tests and refused to deploy every time — including the Phase 4.6 regression, which is the only
reason a broken first screen did not go live. **Never merge with it red, and never claim a suite is
green without looking.** Five hand-backs have now claimed green against a red or unrun CI.

**Also new and good: a test that verifies its own instrument.** The Phase 4.8 CI fix added a
timezone-independence test that runs the parser in child processes under two forced timezones and
asserts identical results. Then it does something this project had never done — it asserts that a
value *known* to be timezone-dependent **differs** between the two zones:

```js
expect(dhakaNonIso.timestamp).not.toBe(utcNonIso.timestamp);
```

If the harness ever stops actually varying the timezone, that line goes red. Without it, the test
would pass vacuously forever the moment the mechanism broke — which is exactly how this project has
been bitten again and again. **When a test depends on a harness doing something, assert that the
harness did it.** This pattern was invented by the implementing agent, not specced. Reuse it.

*One caveat on that line: it pins today's non-ISO local-time behaviour as expected. If anyone later
makes the non-ISO path UTC too — a genuine improvement — it goes red with a misleading message. It
deserves a comment saying it asserts current known behaviour.*

---

## 7. Method notes — how the sharper findings were actually found

The best findings came from checking claims against reality, not from reading code.

- **Run the function, don't read it.** The highest-yield technique in this project by a wide margin.
  The scientific-notation bypasses, six defects in the Phase 2 audit, and the `+121`-for-the-US
  country-code bug were all found by executing the module against a table of inputs. The modules
  under `src/` are plain ES modules with no DOM dependency and run under bare `node` — no test
  runner, no install step. Write a scratch file, import them, print a table.
- **Vary the environment, not just the input.** The Phase 4.8 timezone bug was invisible to every
  test in the project because every test ran under UTC, where the wrong answer and the right answer
  coincide. Running the same function under `TZ=UTC` and `TZ=Asia/Dhaka` and diffing the results
  exposed it immediately, and proved the fix afterwards. Ask what the environment is silently
  supplying — timezone, locale, clock, filesystem — and vary it.
- **Read from the ref, never from the working tree.** Reviewing Phase 4.6 I reported a working
  fixture as broken because my clone was still checked out at an earlier commit — I measured the old
  file and called it the new one, then "confirmed" it against `git show <old-ref>:...`, which was
  the same file. **Two identical measurements presented as a before/after should have been the
  tell**: a 60-line change producing byte-identical behaviour is not a finding, it is a signal that
  you are reading the wrong file. Always `git show <ref>:path`.
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

- **2026-08-13 (night)** — Phases 4.6, 4.7 and 4.8 recorded complete; CI green and deployed.
  Collapsed the Phase 4.6 entry now that its regression is fixed, and recorded my own error in that
  review — reading a stale working tree and reporting a working fixture as broken. Added the UTC
  product rule to §3. Added two failure modes to §6 — "all tests pass" meaning "on my machine", and
  the environment as a hidden test input — plus the self-verifying-harness pattern, which is the
  first genuinely new safeguard the project has gained. Added two method notes to §7. Replaced the
  §4 immediate-work entry with the two open display questions.
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
