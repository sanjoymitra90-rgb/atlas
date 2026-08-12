# Fix the screenshot harness — precondition for Phase 4

**Small task. Do this before Phase 4 begins, not as part of it.**

---

## The problem

Both screenshot capture scripts point at the **unbuilt source file**, so every screenshot the
project has ever produced is of a page that does not work.

- `screenshots/capture-screenshots.cjs` — targets `../index.html`
- `e2e/screenshot.js` — targets `../index.html`

Since Phase 1, the root `index.html` is a Vite **source** file. It loads `/src/main.js` as a
module, which browsers refuse to execute over `file://`, and its Tailwind styles only exist after a
build. Opening it directly gives a page with no layout, no bundled libraries, and a red
"Failed to load: Chart.js, Leaflet, html2pdf, DHTMLX Gantt" banner.

The built artifact — the one the tests and the deployment use — is `dist/index.html`.

**Consequence:** the Phase 2 Tailwind migration was "verified" by comparing one broken render
against another. The comparison could not have detected anything. The current baseline in
`screenshots/` has the same defect: nine files, two of them byte-identical, all captured against
the broken page.

**Do not** treat this as a Phase 2 regression to re-litigate. Just fix the target and re-establish
a baseline.

---

## What to do

### 1. Point both scripts at the build output

In `screenshots/capture-screenshots.cjs` and `e2e/screenshot.js`, replace the URL resolution so it
resolves `dist/index.html` rather than `index.html`.

`e2e/app-url.cjs` already exports exactly this value and is used by the Playwright specs. Import it
in both scripts rather than constructing a third copy of the path — a duplicated path is what
caused this in the first place.

### 2. Fail loudly if the build is missing

If `dist/index.html` does not exist, exit with a clear message — `dist/index.html not found; run
npm run build first` — rather than capturing a blank page. A capture script that silently produces
useless images is worse than one that refuses to run.

### 3. Prove the harness works before trusting it

This is the point of the task. A screenshot suite that cannot detect a visual change is not a
safety net.

1. `npm run build`, then capture a full set.
2. **Open `01-gateway.png` and confirm it shows the real app:** three cards side by side, the
   centered ATLAS wordmark with its teal gradient, the rounded globe tile. If it shows a stretched
   single column with a tiny globe glyph, or any "Failed to load" banner, the target is still wrong
   — stop and report.
3. **Make the harness fail on purpose.** Temporarily delete a layout class — for example
   `lg:grid-cols-3` from the gateway card grid — rebuild, recapture, and confirm the gateway
   screenshot changes. Then revert.
4. State in the commit message that step 3 was performed and what changed.

### 4. Fix the duplicate captures

Two files in the current set share an MD5: `03-dashboard-metrics.png` and `04-charts.png`. Phase 2
commit `cf62ec3` claimed to fix this; it did not, for these two. Each capture must be a distinct
view. Verify by hashing the set and confirming all hashes are unique — do not judge by file size.

### 5. Re-establish the baseline

Capture a clean set against the current `main` (Phase 3, commit `631e7d4`). This becomes the
before-baseline for Phase 4. Keep it gitignored as now.

---

## Also worth doing while here

Add `.gitattributes` at the repository root containing:

```
* text=auto eol=lf
```

Then normalise once and commit. The repository is edited from two Windows machines and currently
produces ~13,000 lines of pure CRLF churn in the working tree, which makes every diff unreadable.
Verified: `git diff --ignore-all-space` is empty, so none of it is real content.

---

## Done when

- [ ] Both scripts resolve `dist/index.html` via the shared `e2e/app-url.cjs`
- [ ] Missing build exits with a clear message instead of capturing a blank page
- [ ] `01-gateway.png` visibly shows the working app — three cards, gradient wordmark, no banner
- [ ] Deleting a layout class demonstrably changes the captured screenshots, and this is stated in
      the commit message
- [ ] All captures have unique hashes
- [ ] A clean baseline exists against commit `631e7d4`
- [ ] `.gitattributes` added and line endings normalised

---

## Note on how this was reported

The Phase 3 report stated screenshots were skipped because the tooling "was deleted in Phase 2".
The script was present at `screenshots/capture-screenshots.cjs` throughout — Phase 2 untracked the
`screenshots-before/` directory, it did not delete the script.

Skipping screenshots for a panel move was a reasonable call. Reporting a blocker without verifying
it was not. **Treat "I couldn't because X" the same as "it works" — check X before reporting it.**
