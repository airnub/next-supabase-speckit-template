# {{APP_TITLE}}

**Repo:** `{{REPO_NAME}}`

**Spec‑Driven Development (SDD) for Next.js + Supabase teams.** Generate **Specification / Coding Agent Brief / Orchestration Plan** from a single SRS YAML, run coding agents with one click, and prove acceptance with tagged tests, Allure reports, and a Requirements Traceability Matrix (RTM). This template currently ships the documentation and automation stack only—you bring the Next.js app code that will consume it.

[![Spec Trace CI](https://img.shields.io/badge/ci-spec--trace-blue)](#)
[![Run Agent](https://img.shields.io/badge/action-run%20agent-brightgreen)](#)
[![Playwright](https://img.shields.io/badge/tests-playwright-informational)](#)
[![Docs](https://img.shields.io/badge/docs-docusaurus-lightgrey)](#)

## What's included

- SRS‑driven documentation pipeline (`pnpm docs:gen`, `pnpm docs:serve`, `pnpm docs:build`).
- Requirements Traceability Matrix tooling (`pnpm rtm:build`).
- Docusaurus site in `docs/website` sourced from the generated specs.
- Playwright acceptance test harness in `tests/` with requirement ID tagging.
- Agent runner scripts under `scripts/` for automating coding workflows.

## What's intentionally _not_ included

- A Next.js / Supabase application under `apps/`. The workspace is preconfigured with an `apps/*` glob, but the actual app code is left to you so you can scaffold the stack that matches your product.

### Bring your own Next.js app

When you're ready to add the product surface area, scaffold it inside the workspace and wire it up to Supabase:

```bash
pnpm create next-app apps/web --use-pnpm --typescript --eslint
```

- Replace `web` with whatever app name you prefer. The directory just needs to live under `apps/` so the pnpm workspace picks it up automatically.
- Add Supabase dependencies (`@supabase/supabase-js`, auth helpers, etc.) and environment variables as needed.
- Expose scripts like `"dev"`, `"lint"`, and `"test"` in the generated `apps/<name>/package.json` so you can target them via `pnpm --filter` commands.
- Update the SRS YAML plus tagged tests to reflect the capabilities you build.

## Quickstart (docs + tooling)

```bash
corepack enable
pnpm install
pnpm docs:gen
pnpm rtm:build
pnpm docs:serve   # docs dev server
# or
pnpm docs:build   # static build in docs/website/build
```

These commands manage the documentation and verification toolchain only. Once you've scaffolded an app, run its scripts with `pnpm --filter apps/<name> <command>` alongside the workflows above.

> ℹ️ The repository is configured as a [pnpm workspace](https://pnpm.io/workspaces). Running `pnpm install` at the root installs the Docusaurus app in `docs/website` along with the rest of the tooling, so you no longer need to run a separate install inside the docs folder.
