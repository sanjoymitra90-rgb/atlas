# ATLAS Call Auditor — how destination numbers are checked

**For:** the DevOps / Ops team
**Written:** 13 August 2026
**Source:** the rules as the tool actually runs them today, taken from the live code rather than
from documentation. If you are reading this months later, see *Keeping this accurate* at the end.

---

## The one thing to know first

The checks run **in a fixed order, and the first one that matches wins.**

A number is only tested against a rule if it has already passed every rule above it. So a number
flagged **Wrong length** is not *also* being judged on its prefix — it never got that far. This is
why a number sometimes gets a label that feels like it is not the most interesting thing wrong
with it.

The order is: *Empty → Non-UK → Not +44 → Wrong length → Bad prefix → Identical digits →
Sequential run → Valid.*

---

## Before any rule runs

The tool tidies the number first, so formatting never causes a false flag:

- **Spaces, dashes and brackets are ignored.** `+44 7911 223 344` and `(+44) 7911-223344` are
  treated exactly like `+447911223344`
- **A missing `+` is added** when the number already starts with `44`. So `447911223344` becomes
  `+447911223344` and passes
- **Numbers mangled by Excel** into scientific notation are recovered where it can be done safely.
  The mantissa must carry enough digits to reconstruct the number exactly. Where digits have
  genuinely been lost, the tool leaves the value alone rather than guessing — it would rather flag
  a number than invent one
  - **Recovered:** `4.47911223344E+11` → `+447911223344`, passes all checks. The mantissa carries
    the full 12 digits
  - **Left alone:** `4.47701E+11` is returned unchanged and flagged **Not +44**. The mantissa
    carries only 6 significant digits against the 12 required, so the tool declines to invent the
    six it cannot know. Sometimes it declines to guess — that is a deliberate refusal, not a bug

---

## "Malformed" — four rules

Malformed means *this does not look like a phone number we can use*.

| Label you'll see | What it means | Example |
|---|---|---|
| **Empty** | The destination field was blank | *(nothing)* |
| **Not +44** | The number does not begin `+44` | `07911223344` |
| **Wrong length** | Fewer than 11 or more than 13 digits in total, counting the `44` | `+4479112233` |
| **Bad prefix** | The first digit after `44` is not 1, 2, 3, 7 or 8 | `+440911223344` |

**On length:** the count includes the country code. A standard UK mobile is `+44` followed by 10
digits — **12 in total**. The accepted range of 11 to 13 allows 9 to 11 digits after `44`.

**On prefix:** UK numbers begin 1 or 2 (geographic), 3 (non-geographic), 7 (mobile and personal) or
8 (freephone and special rate). Anything else is not an allocated UK range.

**A note on `07911223344`:** UK national format is reported as **Not +44** rather than being
converted. The tool does not assume a leading `0` means the UK, because in other countries it does
not. If your source system exports national format, that is worth fixing upstream — otherwise every
row will be flagged.

---

## "Suspected test data" — two rules

Suspected means *this is structurally a valid UK number, but it looks like something a person typed
into a test form rather than a real destination*. These are deliberately separate from Malformed,
because the follow-up action is different: Malformed usually points at a data problem, Suspected
usually points at test traffic in production data.

| Label you'll see | What it means | Example |
|---|---|---|
| **Identical digits** | Every digit after `44` is the same | `+447777777777` |
| **Sequential run** | Five or more consecutive ascending digits appear **anywhere** in the number | `+447911223456` |

**On sequential runs:** the rule looks for a *run inside the number*, not at the number as a whole.
`+447911234500` is flagged because `12345` appears in the middle of it. Four consecutive digits are
fine; five trips the rule.

---

## "Non-UK" is a separate category, not a fault

A French or American number is not a malformed number — it is a perfectly good number to the wrong
country. It is reported on its own as **Non-UK destination**, and hovering the label shows which
country code was detected.

This distinction matters when you are triaging: Malformed and Suspected suggest something is wrong
with your data. Non-UK suggests something is wrong with your routing or your expectations.

---

## What these rules do *not* check

Worth knowing before the questions come back:

- **Descending sequences are not detected.** `+447987654321` passes as valid. Only ascending runs
  are caught
- **Repeated pairs are not detected.** `+447121212121` passes as valid
- **Letters produce a confusing label.** `+44abcdefghij` is reported as **Wrong length**, because
  non-digits are discarded before the count. The number is certainly wrong, but the reason given is
  not the clearest one
- **Nothing here checks whether a number exists.** These are structural rules only — they test the
  *shape* of a number, not whether it is allocated, in service, or reachable. A number can pass
  every check and still not connect

---

## Checking a specific number

In the Call Auditor, the **UK Valid** column on each row shows the category. Hovering it gives the
specific reason, and for non-UK numbers the country code.

Above the table, the **Destination Issues — breakdown** panel shows a count for each reason. Click
any one of them to filter the table down to just those rows — the quickest route from *"23 bad
numbers"* to *"show me the seven that are the wrong length"*.

---

## Keeping this accurate

These definitions were read out of the running code on **13 August 2026** — the scientific-notation
examples were re-derived by execution in the Phase 4.9 correction — and each example in this
document was verified by running it through the tool rather than by reading the rules and
describing them. This revision corresponds to the Phase 4.9 Task D corrections.

If the tool has been updated since, treat this document as a starting point rather than the
authority — the code is the authority. Ask for a re-check and it takes a few minutes.

**If any rule here does not match what you are seeing in the tool, that is worth reporting.** A
mismatch means either this document has gone stale or the tool has a defect, and both are worth
knowing about.
