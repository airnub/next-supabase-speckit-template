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
pnpm catalog:publish   # refresh .speckit/catalog bundle
pnpm test:acceptance  # Playwright + requirement tags
pnpm docs:serve   # docs dev server
# or
pnpm docs:build   # static build in docs/website/build
```

Run `pnpm speckit:verify` to confirm docs match the SRS before pushing.

These commands manage the documentation and verification toolchain only.

## CI & Policy Gates

- `speckit-verify` ensures `pnpm docs:gen` + `pnpm rtm:build` leave no git diff.
- `tests.yml` runs `pnpm test:acceptance` with Playwright tagged by `@REQ-*`.
- `catalog-gate.yml` blocks merges touching `.speckit/catalog/**` without the `catalog:allowed` label.
- `mode-policy-gate.yml` requires the `mode-change` label for `.speckit/spec.yaml`, `srs/app.yaml`, or template policy edits.

Once you've scaffolded an app, run its scripts with `pnpm --filter apps/<name> <command>` alongside the workflows above.

> ℹ️ The repository is configured as a [pnpm workspace](https://pnpm.io/workspaces). Running `pnpm install` at the root installs the Docusaurus app in `docs/website` along with the rest of the tooling, so you no longer need to run a separate install inside the docs folder.

## Use with Speckit

Local (as a repo template):
```sh
speckit template use https://github.com/airnub/next-supabase-speckit-template ./starter
```

The CLI will prompt from `template.vars.json`, copy files, then run the `postInit` commands from `template.json` (`pnpm install`, `pnpm docs:gen`, `pnpm rtm:build`). You can also drop this repo under another project's `.speckit/templates/app/next-supabase` and it will appear in the picker. See Speckit's README for template manifests, variable prompts, and post-init commands.

## Manual QA (Speckit)

Run the bundled flow and confirm outputs match the generated docs:

```bash
rm -rf /tmp/next-supabase-template \
  && speckit template use https://github.com/airnub/next-supabase-speckit-template /tmp/next-supabase-template \
  && cd /tmp/next-supabase-template \
  && pnpm docs:gen && pnpm rtm:build
```

You should observe:

- Prompts for `REPO_NAME`, `APP_TITLE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- `postInit` runs `pnpm install`, `pnpm docs:gen`, and `pnpm rtm:build`.
- `docs/specs/generated/` contains the regenerated Spec, Brief, Plan, and RTM with placeholders replaced.
