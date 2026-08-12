# ATLAS — country code prefix fix

**Paste this whole file as your opening instruction.**

**For:** the AI coding agent making this fix.
**From:** verification of the Phase 2.5 close-out, 2026-08-12, at commit `488ce9c`.
**Scope:** one defect, its tests, and two documentation lines. Nothing else.

CI is green and the live site is current. Keep it that way.

**No line numbers anywhere in this document, or in anything you write.** Anchor on function names,
file paths, element IDs and `data-testid` values.

---

## 0. Your documents

**This document is your brief. It is self-contained.**

- **`docs/SPEC.md` — your contract.** The system as it is. If this document and `SPEC.md` disagree
  about how something works, check the code and report the discrepancy rather than picking one.
- **`docs/FEATURES.md` — behaviour in user language.** Contains no code identifiers, deliberately.
  You will add one line to it.
- **`docs/CHANGELOG.md` — history only. You write to it; you do not read it as truth.**

**Do not read `claude_memory.md`.** It is the maintainer's working document, not an engineering
source.

Do not start Phase 3, and do not start Task D — both are deferred by decision.

---

## 1. The defect

`validateUKNumber()` in `src/auditor/validate.js` returns a `countryCode` field, added during the
Phase 2.5 close-out so that `ukPillHtml()` could show it in the chip tooltip. The chip label itself
is correct and must not change — it reads `"Non-UK destination"` with no code.

The extraction is `cleaned.match(/^\+(\d{1,3})/)`. **`\d{1,3}` is greedy, so it takes three digits
every time**, regardless of how long the country's actual code is. Verified by execution:

| Input | Country and real code | `countryCode` returned |
|---|---|---|
| `+12125551234` | United States, `+1` | `+121` |
| `+14155552671` | United States, `+1` | `+141` |
| `+33123456789` | France, `+33` | `+331` |
| `+4915112345678` | Germany, `+49` | `+491` |
| `+61412345678` | Australia, `+61` | `+614` |
| `+8801712345678` | Bangladesh, `+880` | `+880` — correct, by coincidence |

`+331` for France is the original complaint that opened this issue as Phase 2 item C4. It was
partially worked around, then reintroduced here in a different place.

**Two things make this stickier than an ordinary bug, and you must fix both:**

- `src/auditor/validate.test.js` **asserts the wrong values as correct** — there are cases pinning
  `'+331'` and `'+121'`. Anyone reading them would assume they were deliberate.
- `docs/CHANGELOG.md` uses one of the wrong values as its illustrative example.

---

## 2. The fix

### 2.1 The algorithm — read this before writing the table

E.164 country calling codes are **prefix-free**: no valid code is a prefix of another valid code.
`+1` exists, so no code begins `1` and continues. `+35` is not a code, but `+350` through `+359`
are.

That property gives a short and provably correct algorithm: **try one digit, then two, then three,
and stop at the first match.** Shortest match wins, not longest.

*(An earlier planning document for this project said "longest match wins". That was wrong. It is
noted here so you do not follow it if you encounter it.)*

It also means **you do not need a table of three-digit codes at all.** If the first digit is not a
one-digit code and the first two are not a two-digit code, the code must be three digits — so three
digits is the fallback. You only need the one- and two-digit sets to be correct.

### 2.2 Implementation

Add two module-level constants to `src/auditor/validate.js` and use them in the non-UK branch.

- **One-digit codes:** `1`, `7`
- **Two-digit codes:** `20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57
  58 60 61 62 63 64 65 66 81 82 84 86 90 91 92 93 94 95 98`

Then, for a cleaned number's digits after the `+`: return the first one-digit prefix that is in the
one-digit set, else the first two-digit prefix that is in the two-digit set, else the first three
digits.

**Verify that two-digit list against ITU-T E.164 before you commit it.** It is believed correct and
it is the part the algorithm actually depends on. If you find an error, fix it and say what you
changed. `44` is in the list for completeness; UK numbers never reach this branch.

### 2.3 Constraints

- **The chip label does not change.** `reason` stays `"Non-UK destination"`. Only `countryCode`
  changes.
- **`gapReasonBucket()` must keep matching `non-uk`.** Check it still does.
- **`ukPillHtml()` needs no change** — it already renders the code when present. Confirm rather
  than assume.
- **`row.ukCountryCode` stays as it is.** The field is populated where the gap row is built; leave
  that wiring alone.
- **UK numbers return no `countryCode`.** The existing test asserting `undefined` for a `+44`
  number must keep passing unchanged.

---

## 3. The tests

In `src/auditor/validate.test.js`:

- **Correct the two wrong expectations** — France becomes `'+33'`, the US number becomes `'+1'`.
  Bangladesh stays `'+880'` and should now pass for the right reason rather than by coincidence.
- **Add cases that would have caught this:** a second US number, a German number, an Australian
  number, and a three-digit European code such as Portugal `+351`. One-digit, two-digit and
  three-digit codes must all be represented.
- **Keep the `+44` case** asserting no country code.

**Prove the tests can fail.** Restore the greedy `\d{1,3}` extraction, run `npm run test:unit`,
confirm the suite goes red, then restore your fix. **State in the commit message that you did
this.** This project has shipped tests that could not fail in three separate phases; the check
takes seconds.

---

## 4. The documentation

**`docs/CHANGELOG.md`** — the Phase 2.5 close-out section gives `"Non-UK destination (+331)"` as
its example of the tooltip. That example is the bug. Correct it, and add an entry for this fix
describing what changed. Write it from your commit log, and verify every identifier against the
code before you write it.

**`docs/FEATURES.md`** — the Destination Issues section describes the three categories, including
Non-UK. It does not mention that the chip has a tooltip. Add one sentence, in user language, saying
that hovering a Non-UK chip shows the destination's country code. **No code identifiers, no
function names, no element IDs** — that rule is what keeps this file from drifting against the
others.

**`docs/SPEC.md`** — check whether it documents the `validateUKNumber()` return shape. If it does
and the description is now incomplete, correct it. If it does not, leave it alone.

---

## 5. Ship it

1. `npm test` — unit, build, e2e. All green locally.
2. Push to `main`.
3. Confirm the "Build and deploy" workflow goes green in the Actions tab.
4. Open the live site, upload `fixtures/gap-core.csv`, and hover a Non-UK chip. Confirm the tooltip
   shows a correct country code.

If the workflow goes red, read the failing step, report what failed, and stop. Do not push a
speculative second fix on top.

---

## 6. Definition of done

- [ ] `countryCode` is correct for one-, two- and three-digit codes, verified by execution
- [ ] The two-digit code list checked against ITU-T E.164
- [ ] The two wrong test expectations corrected; new cases cover all three code lengths
- [ ] The tests proven able to fail, and the commit message says so
- [ ] The chip label, `gapReasonBucket()` behaviour, and the `+44` case all unchanged
- [ ] Changelog example corrected and a new entry added
- [ ] One sentence added to `FEATURES.md`, in user language, with no code identifiers
- [ ] `npm test` green; workflow green; tooltip verified on the live site

---

## 7. When you are done

Report in your final message — not a file:

- The country codes you tested and what each returned
- Any correction you made to the two-digit list
- The Actions run URL and its result
- Anything in this document that turned out to be wrong when you checked it against the code

Then stop.
