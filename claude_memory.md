# claude_memory.md

**For:** the next Claude instance picking up this project — most likely in Cowork with access to
the full local repo.
**From:** Claude, in a claude.ai chat session, 2026-08-05.
**About:** ATLAS, an internal planning suite built by Sanjoy Mitra (PM, Provenant Inc.).

This file carries the *conversation* — what was decided, what was rejected, and why. The other
documents carry the system. Read this one first, then `REVIEW.md`, then `SPEC.md`.

---

## 1. What I had access to, and what I didn't

I saw exactly two files, uploaded to a chat: `index.html` (~5,800 lines, single-file app) and
`Atlas_memory.md` (~92 KB handoff doc). Everything I concluded came from static reading of those
two files plus arithmetic on the constants inside them. **I never ran the app.**

**You almost certainly have more than I did.** Sanjoy mentioned a local repo containing a
Playwright e2e suite (~99 specs across `e2e/gap/` and `e2e/optimizer/`), CSV fixtures, npm
scripts, and a Playwright config. None of that was shared with me. If you have repo access:

1. **Run the test suite first.** I inferred what it covers from the changelog; you can see it.
2. **The app was broken when I last heard.** R3 predicted that the recalled SRI hashes might
   block a script; on 2026-08-05 Sanjoy reproduced it — `ReferenceError: Chart is not defined`
   on CSV upload. The Chart.js hash is wrong. If that is still unfixed, fix it before anything
   else, and check whether the html2pdf hash shares the fault — same recall, and it is used
   unguarded by the Proposal PDF button.
3. Several of my findings predict specific test failures once fixed (R11 in particular changes
   the counts that `e2e/gap/gap-dup.spec.js` asserts). Those tests currently encode buggy
   behaviour. **Verify the new numbers by hand before updating assertions** — do not let the test
   dictate the fix.

---

## 2. Who you're working with

Sanjoy is a PM, not a full-time engineer, and builds this with an agentic coding tool. That
shapes what's useful:

- **He engages with reasoning, not verdicts.** In this session he accepted most findings, pushed
  back on two with clear rationale, and asked follow-up questions on the ones he found
  interesting. Show the evidence and the trade-off; he'll make the call.
- **He'll tell you what to skip.** He did, twice, and both times the reason was sound. Don't
  re-litigate descoped items (§4).
- **He asks for your opinion on product direction and wants a real one.** "What do you think
  about a features doc?" was a genuine question, not a request for validation.
- He communicates via voice transcription, so his messages have transcription artefacts.
  Read through them; the intent is always clear.
- **He prefers a middle path when one exists.** On the assumptions field I proposed a checkbox
  library; he wanted a plain textarea because he didn't want to build checkbox UI. The landing
  point — a textarea *pre-seeded with editable default text* — got the actual benefit at his
  chosen cost. That pattern worked well; look for it.

---

## 3. What was agreed

Everything in `REVIEW.md` is in scope. It is ordered by damage, not effort, with a suggested
sequence at the end. Two items originated with him rather than me and matter to him
disproportionately:

- **Precision bands over point estimates (R7).** He liked this immediately — "we can't say for
  sure." It's not just a UI change; it's the honest expression of the R6 measurement problem,
  and it makes the tool *more* defensible in front of a customer, not less.
- **Splitting the "Invalid" pill into three categories (R25).** He agreed at once. Ops teams are
  the users here and they will chase false positives as though they were real defects.

He also accepted the doc split (this file's siblings) and asked for a features document
specifically so an AI could pick the project up cold.

---

## 4. What was explicitly descoped — do not reopen

**A shared customer/account object across the three modules.** I argued this is the thing that
would turn three tools into a suite. He declined **because he doesn't want to take on persistent
storage right now.** That's the reason, and it's a scoping decision, not a disagreement about
value. If persistence ever arrives for another reason, this becomes worth raising again — but
raise it as a consequence of that change, not on its own.

**Cost-aware optimisation in the coverage algorithm.** I noted that cost is only a third-order
tiebreak while OPEX is a headline number. He declined because **the tool's users are Ops people,
for whom costing is secondary and, in his words, "a little tricky"** — the cost model is an
approximation and he doesn't want decisions leaning on it. This is a good instinct: the OPEX
figure is derived from a reverse-engineered baseline and a hardcoded price index. Leave it as
context, not as a driver.

Both decisions are recorded in `SPEC.md` as intentional, so a future agent doesn't "fix" them.

---

## 5. Something important about how this project drifts

There is a recurring failure mode here and you should expect to meet it.

`Atlas_memory.md` opened by declaring itself authoritative — understandable enough for a
single-file app — but by the time I read it, it claimed the latency matrix was symmetric (450 of
496 pairs are not), that ten table columns were sortable (nine are), and it both added and
removed the same chart bucket in different sections. Its section numbering had already collided
twice and needed its own cleanup pass.

**This matters more with agents than with humans.** A human reading "the matrix is symmetric"
might go and look. An agent takes it as given and builds on it. The doc's inaccuracy is what
allowed the region mislabelling (R4) to survive as long as it did — nobody checked the data
against physics because the doc said the data was fine.

Hence the split into `SPEC.md` / `FEATURES.md` / `CHANGELOG.md`, and hence three rules worth
defending:

- **No line numbers in any document.** The old file map was regenerated once and went stale
  within a phase. Anchor on function names, element IDs, `data-testid` values.
- **`FEATURES.md` contains no code identifiers.** If a fact appears in only one file, it cannot
  drift against another file. That's the whole mechanism.
- **`SPEC.md` opens with invariants**, and each carries its reason. Rationale that lives next to
  the rule gets updated with the rule. Rationale in a numbered appendix does not — that's exactly
  what happened to the old design-decisions registry.

Add a `Last verified against index.html on <date/commit>` line whenever you touch a doc.

---

## 6. Two more things worth doing when you have the repo

**Point the help drawer at `FEATURES.md`.** The in-app help text has already drifted once — a
changelog entry records fixing a UK prefix line that said "1, 2, or 7" when the code accepted
1, 2, 3, 7, 8. If help copy and gateway card descriptions are written *from* `FEATURES.md`, then
someone reads that file every release, which is the only reliable way to stop a doc rotting.

**Cross-reference the e2e specs by filename in `FEATURES.md`.** The Playwright suite is already
an executable feature list. Naming the spec file beside each feature section turns "is this still
true?" into something runnable. Filenames, not line numbers.

---

## 7. Method notes — how the sharper findings were actually found

Worth repeating rather than reinventing. The best findings in `REVIEW.md` came from checking the
data against physical reality, not from reading code:

- **Speed of light in fibre as a floor.** Any latency below `distance_km × 0.01` ms RTT is
  impossible. Thirty-six matrix entries fail this, all involving one region — which is what
  exposed the mislabelling (R4). This is now `SPEC.md` invariant 1 and should become a CI check.
- **Cross-check the two models against each other.** The app estimates latency two different
  ways. Comparing them across all region pairs quantified the disagreement (median 45 ms, up to
  300 ms) and turned "the model might be optimistic" into a number (R6).
- **Symmetry and triangle inequality** on a claimed-symmetric matrix — 450 asymmetric pairs, 761
  triangle violations — established that the noise floor exceeds the 20 ms safety margin the
  whole algorithm depends on.
- **Count the escaping.** `escapeHtml` appeared 7 times against 53 `innerHTML` assignments. That
  ratio alone located R15 before reading a single template.

Generalisable version: when a tool's output is physical, test the *data* against physics; when a
tool has two paths to the same answer, diff them; when a codebase has a safety helper, count how
often it's actually used.

---

## 8. Immediate next actions

1. Fix the Chart.js SRI hash (`REVIEW.md` R3) — confirmed broken. Delete the dead
   `chartjs-plugin-annotation` tag while there, and add the load-time dependency guard.
2. Stop presentation failures rolling back the data pipeline (R27). Ten minutes.
3. Fix the loading-overlay lock (R1, R2). Under an hour, and it's a demo-killer.
4. Regions, physics assertion, import bounds-check (R4, R5, R13) — as one change, because the
   import guard is what makes region renumbering safe.
5. Charts-on-filter, escaping, CSV guard, pairing normalisation (R8, R15, R16, R10).

Steps 1–5 are roughly a day and remove every finding capable of producing a confidently wrong
answer in front of a customer.

Then the product work: R25 (split the invalid pill), R7 (precision bands), R26 (contingency and
assumptions). Those three are what Sanjoy is most interested in, so don't let the hardening
backlog crowd them out indefinitely.

---

## 9. Open questions I never got to ask

- **Who signs off on UK validation rule changes?** `SPEC.md` says "do not change without
  sign-off" but names no one. R25 changes how those rules are *presented*, not the rules
  themselves — worth confirming that distinction holds before shipping it.
- **Does the EDR export format ever carry millisecond timestamps?** The entire pairing-window
  calibration rests on whole-second logging. If a newer export format has finer resolution, the
  1000 ms default should be re-derived from the observed 95th percentile.
- **Is the price index ever refreshed?** It's hardcoded and anchored to a single Paris figure of
  $2,674. Nothing says when that was true.
- **Is anyone other than Sanjoy using this yet?** It changes how much the "internal tool"
  latitude on error handling and accessibility is worth relying on.

---

## 10. One thing this session proved worth doing

R3 was written as a probability — "an agent cannot compute a digest of a file it never fetched,
so verify these in a browser." Two messages later it was a live stack trace.

The generalisable lesson isn't about SRI. It's that **an agent's output can be confidently wrong
in ways that produce no error at authoring time**, and the only defence is a cheap check run
against reality: open the page, run the suite, assert against physics. Where a review finding can
become an assertion (`SPEC.md` invariants 1, 3, 9a), make it one — a finding in a document decays,
a failing test doesn't.

That same failure exposed R27, which nobody would have found by reading code. Reality is a better
reviewer than I am; get things in front of it early.
