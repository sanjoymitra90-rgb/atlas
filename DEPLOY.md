# Deploying ATLAS

This document explains how the app gets published, how to tell if it worked, and what to do if something goes wrong. It is written for a non-technical maintainer.

---

## 1. What happens when I push a change

Every time someone pushes a change to the `main` branch, an automated process (called a "workflow") runs. It builds the app, runs all the tests, and if everything passes, it publishes the new version to the website. If any test fails, the old version stays live — nothing breaks.

## 2. How do I know it worked

After pushing, go to the repository on GitHub and click the **Actions** tab. You will see a workflow run named "Build and deploy". A green checkmark means it passed and the new version is live. A red X means something failed (see below). The whole process takes about 5 minutes.

## 3. What if it fails

If the workflow fails:

- **The old version stays live.** Users are not affected.
- **You will get an email** from GitHub with a summary of what went wrong.
- **To read the error:** go to the **Actions** tab, click the failed run, and click the step that has a red X. The error message will be shown in the log.

Most failures are caused by a code change that broke a test. If you did not make the change yourself, ask the developer who did.

## 4. How do I undo a bad change

If a bad change was pushed and you want to go back to the previous version:

1. Go to the repository on GitHub.
2. Click the **Commits** link (under the code tab).
3. Find the last good commit (the one before the bad change).
4. Click the **<>** button on that commit to browse its code.
5. Click the **Revert** button (or ask a developer to run `git revert HEAD` and push).

This creates a new commit that undoes the bad change. The workflow will run again and deploy the reverted version.

## 5. Emergency escape hatch

If the build tooling ever becomes unworkable and you just need to get the app back online:

1. Find the last successful workflow run in the **Actions** tab.
2. Download the `github-pages` artifact from that run.
3. Extract `index.html` from the artifact.
4. Place it at the repository root (replacing the current `index.html` if any).
5. Delete the file `.github/workflows/deploy.yml`.
6. Go to **Settings → Pages → Build and deployment** and set **Source** to **Deploy from a branch**.
7. Set the branch to `main` and the folder to `/ (root)`.

This returns the project to its pre-Phase-1 setup. Nothing about this migration is one-way.

## 7. Why tests sometimes refuse to run

The tests run against the built version of the app (the `dist/` folder), not the source code. If the source changes but the build has not been refreshed, the tests would check an old version — which defeats their purpose.

Every test command now rebuilds the app automatically before running. If something bypasses that (for example, running a test directly from an IDE), the test runner checks whether the build is up to date. If it is not, the run stops immediately with a message like "dist/index.html is stale (src/auditor/time.js is newer); run npm run build". This is not a failure — it is a safety check. Run `npm run build` and try again.

## 6. Where the app is hosted

The live app is at: **https://sanjoymitra90-rgb.github.io/atlas/**

---

## One-time setup (already done)

**Settings → Pages → Build and deployment** is set to **GitHub Actions** (not "Deploy from a branch"). This tells GitHub to use the workflow file instead of deploying from a branch directly. This was set up as part of Phase 2 Task A.
